# chunk 到 settlement

源码核验入口：`packages/core/session/src/types.ts` 的 assistant 事件、`packages/llm/llm/src/assistant-stream.ts`、`packages/core/agent-loop/src/{agent,assistant-stream}.ts`、`packages/llm/token-meter/src/index.ts`。

本篇写 session format v2 之后「流式 chunk 如何入 log」的完整替代关系：**顶层 `assistant/chunk` 事件已不存在**，一次模型 attempt 只提交一条 settlement，流内嵌其中。

## 旧表示被推翻

v1 的表示是：每个 `StreamChunk` 一条顶层 `assistant/chunk` session event（seq 推进数组），`assistant/message` 用 `sourceEventSeqs: chunkSeqs` 引用它们。

v2 起：每个 attempt **一条** settlement。`assistant/message`（surface）新增 `stream: AssistantStreamRecord[]`，与 assembled message、可选 `usage`、可选 `interrupted: true` 并列（`packages/core/session/src/types.ts:321-331`）；`assistant/attempt`（**新事件**，log-only）是 `{ turn, step, stream }`（`:335`），保存 failed / retried / cancelled / stream-error 且没有 surface message 的 attempt。`assistant/message` **不能**再带 chunk 的 `sourceEventSeqs`。

两类 settlement 的分工：模型可见历史只由 `assistant/message` 构成；`assistant/attempt` 让诊断与记账不必伪造模型可见历史。取消但已流出可见内容时，loop 提交带 `interrupted: true` 的 `assistant/message`（只有已交付的 text/reasoning 前缀，未 dispatch 的 tool call 不在内）；取消且无可见内容、以及 error/aborted 的 attempt，走 `assistant/attempt`（`packages/core/agent-loop/src/agent.ts:398-495`）。

## 紧凑编码

`packages/llm/llm/src/assistant-stream.ts` 是本次新增的流词汇（534 行）：

- `AssistantStreamRecord`（`:20`）是四种记录的联合：`text-chunks` / `reasoning-chunks` / `tool-call-chunks` 三种 run，以及带时间戳的 raw `chunk`。
- `AssistantStreamAccumulator`（`:100`）对同一 block 的连续 text / reasoning / tool-argument delta 合成一个 run：保留首个时间戳 `time0`、每个相邻 delta 的精确间隔 `dt`、每个原始 delta 一个数组成员（`texts` / `args`）；其他 chunk 原样保留为 raw record。合成不合并 delta 边界，因此是无损的。
- `expandAssistantStream()`（`:202`）严格校验记录并重建精确的有时间戳序列，是**读耐久边界**的验证路径。
- `assembleAssistantStream()`（`:425`）把记录喂给 `BlockAssembler` 重组 blocks；它信任静态类型、不校验，只做拼接，因此和逐 delta 输入得到同样的 blocks。
- 另有不展开数组成员的读取器：`joinAssistantStreamText()`（`:406`）、`runFirstTokenTime()`（`:312`）、`assistantStreamHasVisibleContent()`（`:349`）等。

公开入口是 package subpath `@deepseek-ai/dsh-llm/assistant-stream`（`packages/llm/llm/package.json:37-40`）。

## 实时展示与耐久回放分离

`agent/assistant-stream`（声明 `packages/core/agent/src/runtime-types.ts:373`）发 process-local 的三种 frame：`start`、transient `chunk`、`end`（`packages/core/agent-loop/src/assistant-stream.ts:49-109`）。loop **先追加**完整的 `assistant/message` 或 `assistant/attempt`，committed end frame 再命名其类型与 seq；无法提交时发 `abandoned` end，没有 settlement。

Web 的 follow adapter 订阅这些 frame 做打字机效果，重建时用 `expandAssistantStream()` 展开 settlement 的 embedded stream（`packages/api/session-controller/src/client/sessions/assistant-stream.ts`）。chunk 仍不上线：Web 的实时 chunk 行是 Client-only 事件 `assistant/live-chunk`（`packages/api/session-controller/src/client/contract/events.ts:6-17`），不写进 session log。

**耐久性代价（重要）**：v1 的顶层 chunk 可以被缓冲写入器在 attempt 结束前 flush；v2 在 settlement 前**没有**耐久 attempt 证据——settlement 前硬进程/主机丢失会丢掉整个 in-flight stream。`agent/assistant-stream` **不是 write-ahead log**。

## consumer 的变化

`dsh-token-meter` 不再按引用的 chunk seq 重组 provider 输出，改为 `assembleAssistantStream(event.data.stream).blocks()`（`packages/llm/token-meter/src/index.ts:9`、`:320-323`）。

## 与 session 格式迁移的边界

写者版本一路推进：v2 引入时 `SESSION_FORMAT_VERSION` 由 `0` 变成 `3`（当时锚点 `packages/core/session/src/types.ts:88`）；0008 跨度（0.1.7-rc.1）v4 落地，当前值为 **4**（`packages/core/session/src/types.ts:89`），迁移族扩到 `session-format`、`session-format-catalog`、`session-format-v0-to-v1` 至 `-v3-to-v4` 共六个包。v2→v3 这条边把系统提示词提升为消息、重映射本地事件引用、转换 PTC 与预设名称并规范化信封（`packages/session/session-format-v2-to-v3/README.zh.md`）；v3→v4 把 tool/result 提升为一等 tool-role message、`source.plugin` 改名 `source.kind`、新增第五类 surface 事件 `developer/message`（全链见 [`../session-and-loop/04-格式世代与迁移.md`](../session-and-loop/04-格式世代与迁移.md)）。

本篇只写「chunk 不再是一等事件」的模型可见后果；格式版本与迁移机制的细节归 session 专题，见 [`../session-and-loop/01-session-event-map.md`](../session-and-loop/01-session-event-map.md)。
