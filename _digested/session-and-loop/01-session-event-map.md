# SessionEventMap、required-on-read 与版本

> 基线 `47f943859bef60e4160492346772ded9b24f765a`。`packages/core/session/src/types.ts`、`known-event-types.ts`、`.agents/notes/implemented/architecture/2026-08-10-session-log-version-mechanism.md`。

介绍篇说「模型可见 ⟺ 已记录」。这篇钉信封、surface 三类、未知类型怎么拒、以及 `SESSION_FORMAT_VERSION` 什么时候才加一。

![信封：type / seq / time / data](./figures/event-envelope.svg)

## 一份 log 是什么

`SessionEventMap` 是可合并的、仅追加的交互源。消息历史从它投影，不另存一份 `messages[]`。每个事件是无损 JSON；`seq` 连续，**包括** raw chunk，持久化才能原样存 canonical log。

核心地图（插件用 `declare module '@deepseek-ai/dsh-session/types'` 往里加键）里，loop 自己写的是：

| type | 进 `deriveMessages`？ |
|------|------------------------|
| `turn/start` · `turn/end` | 否（边界） |
| `step/start` · `step/end` | 否 |
| `user/message` | 是（surface） |
| `assistant/chunk` | 否（回放 / UI） |
| `assistant/message` | 是（surface；空 content 派生为 null） |
| `tool/call` | 否 |
| `tool/result` | 是（surface） |
| `request/header` · `request/context` | 否（最新 header 重建请求） |
| `todo/write` | 否（log-only UI） |
| `session/end-seed` | 否（种子与 live 的分界） |

`SurfaceEventType` 只有三种：`user/message`、`assistant/message`、`tool/result`。只有它们可以带 `surfaceOp` / `sourceEventSeqs`。编译器在 `Session.append` 调用点强制：log-only 事件不许带 surface 字段。

`surfaceOp`：`'append'` 接到尾巴；`{ op: 'replace', start, end }` 换掉一段有序 surface（compaction 用）。replace 节点的 `sourceEventSeqs` 必须覆盖被挡住的每一个 surface 节点。

## required-on-read

信封上的 `ignorable?: true`。缺省 = **required**。读者碰到不认识的 `type`：

- 没有标记 → 拒绝重建整份会话。未识别的 required 事件可能改变其余 log 怎么读（`session/end-seed` 是现成例子）。
- `ignorable: true` → 可以跳过。写者只给「丢了也不影响重建」的信息性记录打这个标。

默认 required：忘了标记会**过度拒绝**（不方便）；默认 ignorable 会**静默掏空**再 resume（安全事故）。模型可见内容只走三个 surface 类型，外加 `request/header` / `request/context` 折叠，所以真正危险的未知量是那些改变怎么读其余 log 的非 surface 事件。

已知集合是生成的 `KNOWN_SESSION_EVENT_TYPES`（`gen-persistence-catalog` 扫本仓库每一次 `SessionEventMap` 合并）。同一版本、不同插件组合，读规则仍一致。仓外插件事件按构造不在表里；预发布接受「第一方读者拒 resume」，且拒绝是大声的。

守卫在**读**侧。`append` 不查词汇表：活会话中途拒写，比下次加载时大声拒绝代价更大。

## `SESSION_FORMAT_VERSION = 0`

钉在每个新 `SessionHeader` 上，每个持久化后端加载时检查。未发布期间不承诺兼容：不匹配就拒，没有迁移。

一个单调整数，没有 major/minor。**写者决定 bump**，不是「新读者能吞什么」。只有旧运行时无法对**新** log 做语义正确的读时才 bump。「解析不报错」不够：静默跳过会塑造重建的内容，就是错读。够格的是结构变化：header 形状、信封、核心事件语义、surface 机制（`SurfaceEventType` 集合、`SurfaceOp` 变体）。**加一个普通事件类型不 bump**——那是 `ignorable` 的工作。拿不准就 bump。

方向：版本更新 → 拒，说明「更新的 harness 写的，请升级」，并指出原始 log，好让人仍能看文本。更旧 → 将来走 n→n+1 upgrader 链做内存转换；真正 continue 才落盘。v0 的 upgrader 链还没上，因为还没有真实的 v0→v1 步可测。

## `deriveMessages()`

`Session.deriveMessages()` 只折叠有序 surface 节点。返回的数组每次是新的；里面的 `Message` 对象共享且深冻结。`assistant/chunk` 的 seq 出现在对应 `assistant/message` 的 `sourceEventSeqs` 里，投影本身不用 chunk。

所以「给模型加一种新输入」= 扩展 `SessionEventMap`，并且让它成为 surface 或走已有 surface 的折叠（`inject` 最终变成 `user/message`）。只在 prompt 组装里偷偷加一段，reload 后模型会看见幽灵上下文。
