# SessionEventMap、required-on-read 与版本

源码核验入口：`packages/core/session/src/types.ts`、`known-event-types.ts`、`.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md`、`.agents/notes/implemented/architecture/2026-08-31-released-session-format-migrations.md`、`docs/session-format-status.md`、`.agents/notes/archived/architecture/2026-08-31-session-sequence-and-log-offset-brands.md`。

本篇说明事件信封、四类 surface 事件、未知类型的读时拒绝，以及 `SESSION_FORMAT_VERSION` 的递增条件；格式世代、相邻迁移链与读准备/写发布时序见 [`04-格式世代与迁移.md`](./04-格式世代与迁移.md)。

![信封：type / seq / time / data](./figures/event-envelope.svg)

## 一份 log 是什么

`SessionEventMap` 是可合并的、仅追加的交互源。消息历史从它投影，不另存一份 `messages[]`。每个事件是无损 JSON；`seq` 连续（当前格式里一次模型尝试只结算一条事件，逐 chunk 时序内嵌在它的 `stream` 里），持久化才能原样存 canonical log。

> **rc.1 事件 seq 与日志 offset 分型**：上游 `27bf1039`（`refactor(session)!`）把同一 `number` 的两种含义拆成品牌类型——`SessionSeq` 命名一条已存在的事件，`SessionLogOffset` 命名空隙/前缀长/读切。信封 `seq`、surface 替换端点与 provenance 用 `SessionSeq`；`Session.seq`、`firstLiveSeq` 与正文读偏移用 `SessionLogOffset`（[`2026-08-31-session-sequence-and-log-offset-brands`](../../.agents/notes/archived/architecture/2026-08-31-session-sequence-and-log-offset-brands.md)）。v0 JSONL header 与线上数值不变；`seedLength` 从逻辑 header 移除，改为 `isSeeded` + 正文侧 `inheritedEventCount`。digest 里「seq 连续」指事件身份，与日志物理偏移无关。

核心地图（插件用 `declare module '@deepseek-ai/dsh-session/types'` 往里加键）里，loop 自己写的是（标注了写者的两行除外）：

| type | 进 `deriveMessages`？ |
|------|------------------------|
| `turn/start` · `turn/end` | 否（边界） |
| `step/start` · `step/end` | 否 |
| `system/message` | 是（surface；system prompt 的落点，第一条成为 surface 节点 0） |
| `user/message` | 是（surface） |
| `assistant/message` | 是（surface；空 content 派生为 null；内嵌 `stream`；可带 `interrupted: true`） |
| `assistant/attempt` | 否（log-only；保存失败、重试、取消或流错误的尝试的内嵌 `stream`） |
| `tool/call` | 否 |
| `tool/result` | 是（surface） |
| `request/header` | 否（单独重建 config、adapterDefaults 与 tools） |
| `request/context` | 否（只记录 provider、model、context window 与 `systemPromptUpdate` 能力） |
| `todo/write` | 否（log-only UI；非 loop 写——`packages/todo/tool-todo/src/index.ts:210`） |
| `session/end-seed` | 否（种子与 live 的分界；非 loop 写——Session 构造器是唯一合法写者，`packages/core/session/src/types.ts:400`；appender `packages/core/session/src/index.ts:607-609`） |

`SurfaceEventType` 有四类：`system/message`、`user/message`、`assistant/message`、`tool/result`（`packages/core/session/src/types.ts:412-416`）。只有它们可以带 `surfaceOp`；`assistant/message` **独占禁止** `sourceEventSeqs`，其余三类可引用非空、唯一、严格更早的 seq 集合。编译器在 `Session.append` 调用点强制：log-only 事件不许带 surface 字段。

`surfaceOp`：`'append'` 接到尾巴；`{ op: 'replace', startSeq, endSeq }` 换掉一段有序 surface（compaction 与 system 节点改写用）。端点按**当前 surface 顺序**、含端点解释，不是数值 seq 顺序；replace 节点的 `sourceEventSeqs` 必须覆盖被挡住的每一个 surface 节点。

## required-on-read

信封上的 `ignorable?: true`。缺省 = **required**。读者碰到不认识的 `type`：

- 没有标记 → 拒绝重建整份会话。未识别的 required 事件可能改变其余 log 怎么读（`session/end-seed` 是现成例子）。
- `ignorable: true` → 可以跳过。写者只给「丢了也不影响重建」的信息性记录打这个标。

默认 required：忘了标记会**过度拒绝**（不方便）；默认 ignorable 会**静默掏空**再 resume（安全事故）。模型请求的消息由四类 surface 类型投影，config、adapterDefaults 与 tools 由 `request/header` 折叠，system prompt 取当前有效的 `system/message` 节点；`request/context` 不参与请求重建。真正危险的未知量是那些改变怎么读其余 log 的非 surface 事件。

> **ignorable 机制的历史与边界**：上游 #3087（`worktree/remove-ignorable-session-events`）曾删除 ignorable 机制，要求所有 event 必须被已知。但 #3325 随后回滚了这次删除，恢复了 ignorable（依据 `.agents/notes/implemented/architecture/2026-08-30-retain-ignorable-external-session-events.md`）。当前（`9c18e3f216`）ignorable 仍在（`packages/core/session/src/types.ts:473-483`、`packages/session/session-persistence/src/storage-contract.ts:74-80`），但 `known-event-types.ts` 在两次改动之间新增的事件以 required 注册。**跨历史格式边时规则更严**：未知事件即使带 `ignorable: true` 也拒迁（`.agents/notes/implemented/architecture/2026-08-31-alpha-historical-unknown-event-refusal.md`），因为基数保持型迁移必须证明每个被保留的 payload 在目标世代仍语义有效。

已知集合是生成的 `KNOWN_SESSION_EVENT_TYPES`（`gen-persistence-catalog` 扫本仓库每一次 `SessionEventMap` 合并）。同一版本、不同插件组合，读规则仍一致。集合内容随事件换代变化：当前有 `assistant/attempt` 与 `system/message`，没有 `assistant/chunk`（`packages/core/session/src/known-event-types.ts:28,61`）。仓外插件事件按构造不在表里；预发布接受「第一方读者拒 resume」，且拒绝是大声的。

守卫在**读**侧。`append` 不查词汇表：活会话中途拒写，比下次加载时大声拒绝代价更大。

## 持久化与格式迁移

当前持久化使用 JSONL-only（上游 #2698、#3339）。`session-persistence-jsonl` 使用 zstd 拼接多帧容器压缩，以支持追加与批量恢复（`packages/session/session-persistence-jsonl/src/zstd.ts:2-3`）。`session-persistence-sqlite` 已删除。

迁移框架存在且是核心机制：`dsh-session-format` 提供 Stage / chain / catalog 协议与 `SessionFormatError` 家族，`dsh-session-format-catalog` 是生成式 build-static catalog（`packages/session/session-format-catalog/src/generated.ts:14-32`），三个 edge 包 `session-format-v0-to-v1` / `-v1-to-v2` / `-v2-to-v3` 串出从最早支持世代到 current 的相邻链。catalog 直接 import 各历史包，因此历史可读性不依赖挂载插件，profile 也不能增删或重排一条边（`packages/session/session-format-catalog/README.md:47`）。`refuseForeignFormatVersion` 仍在（`packages/session/session-persistence-jsonl/src/format.ts:339-345`），但只覆盖「被当作当前世代解码却版本不符」的路径，不是格式兼容的全部语义。

## 当前写入器版本

`SESSION_FORMAT_VERSION` 钉在每个新 `SessionHeader` 上，每个持久化后端加载时检查；当前值为 `3`（`packages/core/session/src/types.ts:88`）。**已发布世代有不可变承诺**：commit 过的世代字节保留、发布记录与证据 tag 齐备、相邻边只增不改（`docs/session-format-status.md:17-23,38-42`；`.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md`）。写作规则按 `docs/session-format-status.md:42`：通用行为用「当前格式」「下一个相邻版本」，只有固定迁移输入输出、wire schema、历史证据与测试才写死数字。

一个单调整数，没有 major/minor。**写者决定 bump**，不是「新读者能吞什么」。只有旧运行时无法对**新** log 做语义正确的读时才 bump。「解析不报错」不够：静默跳过会塑造重建的内容，就是错读。够格的是结构变化：header 形状、信封、核心事件语义、surface 机制（`SurfaceEventType` 集合、`SurfaceOp` 变体）。**加一个普通事件类型不 bump**——那是 `ignorable` 的工作。拿不准就 bump。

读方向不是「高低版本都拒」：**更新**版本拒绝并说明该 log 由更新的 harness 写入（用户看到的永远是 upgrade the harness，不是 corrupt）；**更旧**版本走相邻链迁移，不再拒绝（`packages/session/session-format/src/catalog.ts:52-59,139-157`）。原始 log 保留在磁盘上供检查；迁移从不移动、覆盖或删除已提交世代，只写最终 current 目标。世代、权威表与读准备 / 写发布时序见 [`04-格式世代与迁移.md`](./04-格式世代与迁移.md)。

带 `seedLength` 的旧 header 在加载时直接抛 `'session header has invalid field "seedLength"'`（`packages/core/session/src/index.ts:97-98`）。这是**当前逻辑 header 的形状约束**：历史 header 在进入 `SessionHeader` 之前已由迁移链翻译完毕，所以它不再是「旧格式拒载」的证据。

## 完整记录不等于完整发送

原始 session log 仅追加，记录完整的耐久事实；下一次模型请求使用的消息则是当前有序 surface 的投影。compaction 会追加 summary 和 replacement 事件，`surfaceOp: replace` 只让被覆盖的 surface 节点退出后续 `deriveMessages()` 结果，不会从 raw log 删除旧事件。持久化、审计和精确回放因而仍能读取完整历史，模型则只接收当前投影。

`Session.deriveMessages()` 只折叠有序 surface 节点。返回的数组每次是新的；里面的 `Message` 对象共享且深冻结。`assistant/message` **独占禁止** `sourceEventSeqs`，投影本身不用内嵌 `stream`；逐 chunk 的时序证据留在 `stream` 里，需要时用 `expandAssistantStream()` 展开（`packages/llm/llm/src/assistant-stream.ts:202`）。

人看的 transcript 不是同一份投影：UI 常用 **append-origin** 的 surface 事件；`deriveMessages()` 走 compaction `replace` 之后的有序 surface。像素级回放展开 settlement 的内嵌 `stream`（`expandAssistantStream()`，`packages/llm/llm/src/assistant-stream.ts:202`）；模型下一请求读 assembled message。

两套「source」不要混：`sourceEventSeqs` 是 log 里更早事件的 seq；`UserMessage.source` 是语义来源（`user` / `plugin` / …），不参与 surface fold。

对话内容必须成为 surface；system prompt 最终写成 `system/message` 节点，`inject` 和 runtime-context 快照最终都写成 `user/message`。动态 prompt section、tool schema 与模型配置走另一条现成路径：实际结果在分派前写入 `request/header`（system 除外），无需为每个 section 新增事件类型。只有现有 surface 与 header 都无法表达的新语义，才扩展 `SessionEventMap` 和相应的重建规则。
