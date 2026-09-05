# SessionEventMap、required-on-read 与版本

源码核验入口：`packages/core/session/src/types.ts`、`known-event-types.ts`、`.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md`、`.agents/notes/implemented/architecture/2026-08-31-session-sequence-and-log-offset-brands.md`。

本篇说明事件信封、三种 surface 事件、未知类型的读时拒绝，以及 `SESSION_FORMAT_VERSION` 的递增条件。

![信封：type / seq / time / data](./figures/event-envelope.svg)

## 一份 log 是什么

`SessionEventMap` 是可合并的、仅追加的交互源。消息历史从它投影，不另存一份 `messages[]`。每个事件是无损 JSON；`seq` 连续，**包括** raw chunk，持久化才能原样存 canonical log。

> **rc.1 事件 seq 与日志 offset 分型**：上游 `27bf1039`（`refactor(session)!`）把同一 `number` 的两种含义拆成品牌类型——`SessionSeq` 命名一条已存在的事件，`SessionLogOffset` 命名空隙/前缀长/读切。信封 `seq`、surface 替换端点与 provenance 用 `SessionSeq`；`Session.seq`、`firstLiveSeq` 与正文读偏移用 `SessionLogOffset`（[`2026-08-31-session-sequence-and-log-offset-brands`](../../.agents/notes/implemented/architecture/2026-08-31-session-sequence-and-log-offset-brands.md)）。v0 JSONL header 与线上数值不变；`seedLength` 从逻辑 header 移除，改为 `isSeeded` + 正文侧 `inheritedEventCount`。digest 里「seq 连续」指事件身份，与日志物理偏移无关。

核心地图（插件用 `declare module '@deepseek-ai/dsh-session/types'` 往里加键）里，loop 自己写的是：

| type | 进 `deriveMessages`？ |
|------|------------------------|
| `turn/start` · `turn/end` | 否（边界） |
| `step/start` · `step/end` | 否 |
| `user/message` | 是（surface） |
| `assistant/chunk` | 否（回放 / UI） |
| `assistant/message` | 是（surface；空 content 派生为 null；可带 `interrupted: true`） |
| `tool/call` | 否 |
| `tool/result` | 是（surface） |
| `request/header` | 否（单独重建 config、system 与 tools） |
| `request/context` | 否（只记录 provider、model 与 context window） |
| `todo/write` | 否（log-only UI） |
| `session/end-seed` | 否（种子与 live 的分界） |

`SurfaceEventType` 只有三种：`user/message`、`assistant/message`、`tool/result`。只有它们可以带 `surfaceOp` / `sourceEventSeqs`。编译器在 `Session.append` 调用点强制：log-only 事件不许带 surface 字段。

`surfaceOp`：`'append'` 接到尾巴；`{ op: 'replace', start, end }` 换掉一段有序 surface（compaction 用）。replace 节点的 `sourceEventSeqs` 必须覆盖被挡住的每一个 surface 节点。

## required-on-read

信封上的 `ignorable?: true`。缺省 = **required**。读者碰到不认识的 `type`：

- 没有标记 → 拒绝重建整份会话。未识别的 required 事件可能改变其余 log 怎么读（`session/end-seed` 是现成例子）。
- `ignorable: true` → 可以跳过。写者只给「丢了也不影响重建」的信息性记录打这个标。

默认 required：忘了标记会**过度拒绝**（不方便）；默认 ignorable 会**静默掏空**再 resume（安全事故）。模型请求的消息由三个 surface 类型投影，config、system 与 tools 由 `request/header` 折叠；`request/context` 不参与请求重建。真正危险的未知量是那些改变怎么读其余 log 的非 surface 事件。

> **ignorable 机制的历史**：上游 #3087（`worktree/remove-ignorable-session-events`）曾删除 ignorable 机制，要求所有 event 必须被已知。但 #3325 随后回滚了这次删除，恢复了 ignorable。当前（`a66e470204`）ignorable 仍在，但 `known-event-types.ts` 在两次改动之间新增的事件以 required 注册。

已知集合是生成的 `KNOWN_SESSION_EVENT_TYPES`（`gen-persistence-catalog` 扫本仓库每一次 `SessionEventMap` 合并）。同一版本、不同插件组合，读规则仍一致。仓外插件事件按构造不在表里；预发布接受「第一方读者拒 resume」，且拒绝是大声的。

守卫在**读**侧。`append` 不查词汇表：活会话中途拒写，比下次加载时大声拒绝代价更大。

## 持久化与格式迁移

当前持久化使用 JSONL-only（上游 #2698、#3339）。`session-persistence-jsonl` 使用 zstd 单帧压缩，包含格式版本化机制（`session-format-01` 分支）。`session-persistence-sqlite` 已删除。

`formatRegistry` 维护 one-to-one 格式迁移函数：每个版本只需要知道如何从上一个版本迁移，不跳跃。`SESSION_FORMAT_VERSION` 在 header 中记录，加载时检查。

## `SESSION_FORMAT_VERSION = 0`

钉在每个新 `SessionHeader` 上，每个持久化后端加载时检查。未发布期间不承诺兼容：不匹配就拒，没有迁移。

一个单调整数，没有 major/minor。**写者决定 bump**，不是「新读者能吞什么」。只有旧运行时无法对**新** log 做语义正确的读时才 bump。「解析不报错」不够：静默跳过会塑造重建的内容，就是错读。够格的是结构变化：header 形状、信封、核心事件语义、surface 机制（`SurfaceEventType` 集合、`SurfaceOp` 变体）。**加一个普通事件类型不 bump**——那是 `ignorable` 的工作。拿不准就 bump。

当前后端只加载 `SESSION_FORMAT_VERSION = 0`。版本更高时拒绝并说明该 log 由更新的 harness 写入；版本更低时同样拒绝，因为预发布格式没有迁移路径。原始 log 保留在磁盘上供检查。

## 完整记录不等于完整发送

原始 session log 仅追加，记录完整的耐久事实；下一次模型请求使用的消息则是当前有序 surface 的投影。compaction 会追加 summary 和 replacement 事件，`surfaceOp: replace` 只让被覆盖的 surface 节点退出后续 `deriveMessages()` 结果，不会从 raw log 删除旧事件。持久化、审计和精确回放因而仍能读取完整历史，模型则只接收当前投影。

`Session.deriveMessages()` 只折叠有序 surface 节点。返回的数组每次是新的；里面的 `Message` 对象共享且深冻结。`assistant/chunk` 的 seq 出现在对应 `assistant/message` 的 `sourceEventSeqs` 里，投影本身不用 chunk。

人看的 transcript 不是同一份投影：UI 常用 **append-origin** 的 surface 事件；`deriveMessages()` 走 compaction `replace` 之后的有序 surface。像素级回放读 chunk；模型下一请求读 assembled message。

两套「source」不要混：`sourceEventSeqs` 是 log 里更早事件的 seq；`UserMessage.source` 是语义来源（`user` / `plugin` / …），不参与 surface fold。

对话内容必须成为 surface；`inject` 和 runtime-context 快照最终都写成 `user/message`。动态 prompt section、tool schema 与模型配置走另一条现成路径：实际结果在分派前进入完整的 `request/header`，无需为每个 section 新增事件类型。只有现有 surface 与 header 都无法表达的新语义，才扩展 `SessionEventMap` 和相应的重建规则。
