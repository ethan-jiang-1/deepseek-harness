# chunk 到 settlement

源码核验入口：`packages/core/session/src/types.ts` 的 assistant 事件、`packages/llm/llm/src/assistant-stream.ts`、`packages/core/agent-loop/src/{agent,assistant-stream}.ts`、`packages/llm/token-meter/src/index.ts`。

本篇是「流式输出如何入 log」的家：**没有顶层 `assistant/chunk` 事件**——一次模型 attempt 只提交一条 settlement，流内嵌其中。

## 一次 attempt 一条 settlement

`assistant/message`（surface）携带 `stream: AssistantStreamRecord[]`，与 assembled message、可选 `usage`、可选 `interrupted: true` 并列（`packages/core/session/src/types.ts`）；`assistant/attempt`（log-only）是 `{ turn, step, stream }`，保存 failed / retried / cancelled / stream-error 且没有 surface message 的 attempt。`assistant/message` 不带 chunk 的 `sourceEventSeqs`。

两类 settlement 的分工：模型可见历史只由 `assistant/message` 构成；`assistant/attempt` 让诊断与记账不必伪造模型可见历史。取消但已流出可见内容时，loop 提交带 `interrupted: true` 的 `assistant/message`（只有已交付的 text/reasoning 前缀，未 dispatch 的 tool call 不在内）；取消且无可见内容、以及 error/aborted 的 attempt，走 `assistant/attempt`（`packages/core/agent-loop/src/agent.ts`）。

## step() 里的结算序列

1. `agent/request` waterfall 得到冻结请求。
2. `preparedCall?.stream(request) ?? ctx.llm.stream(request)`。
3. 每个 `StreamChunk` 同时喂 `AssistantStreamAttempt`（accumulator 收集紧凑记录、assembler 收块），并作为一个 process-local frame 发出；不 append 顶层事件。
4. finish 若 error/aborted：先提交 `assistant/attempt`（log-only，携带 embedded stream），再走 `agent/request-error` waterfall；`retry` 则**同一 step** 再 stream。
5. 正常结束：`createAssistantMessage` 从 assembler blocks + provider/model/replayState 生成，提交**一条** `assistant/message`（`surfaceOp: 'append'`，`stream` 是紧凑记录，`usage` 有则跟这条走，没有单独的 usage 事件）。取消但已流出可见内容时，同一条事件带 `interrupted: true`。
6. 提交成功后发 committed end frame，命名 settlement 的类型与 seq；无法提交则发 abandoned end frame，没有 settlement。

max-tokens 截断时，assembler 丢掉全部 `tool-call` block（无论完成与否）。`ReplayEnvelope` 把 adapter 私有 replay 拆成 `response` 与可选的 per-block `blocks`；assembly 按同一套 keep/drop 裁 `blocks`，两半不能各裁各的；长度对不上就丢弃整份 envelope。`deriveMessages` 折叠 `assistant/message`，不折叠 `assistant/attempt`；空 content（只带 usage 的 max-tokens）派生为 null。

## 紧凑编码

`packages/llm/llm/src/assistant-stream.ts` 是流词汇的家：

- `AssistantStreamRecord`（`:20`）是四种记录的联合：`text-chunks` / `reasoning-chunks` / `tool-call-chunks` 三种 run，以及带时间戳的 raw `chunk`。
- `AssistantStreamAccumulator`（`:100`）对同一 block 的连续 text / reasoning / tool-argument delta 合成一个 run：保留首个时间戳 `time0`、每个相邻 delta 的精确间隔 `dt`、每个原始 delta 一个数组成员（`texts` / `args`）；其他 chunk 原样保留为 raw record。合成不合并 delta 边界，因此是无损的。
- `expandAssistantStream()`（`:202`）严格校验记录并重建精确的有时间戳序列，是**读耐久边界**的验证路径。
- `assembleAssistantStream()`（`:425`）把记录喂给 `BlockAssembler` 重组 blocks；它信任静态类型、不校验，只做拼接，因此和逐 delta 输入得到同样的 blocks。
- 另有不展开数组成员的读取器：`joinAssistantStreamText()`（`:406`）、`runFirstTokenTime()`（`:312`）、`assistantStreamHasVisibleContent()`（`:349`）等。

公开入口是 package subpath `@deepseek-ai/dsh-llm/assistant-stream`（`packages/llm/llm/package.json:33`-`:36`）。

## 实时展示与耐久回放分离

`agent/assistant-stream`（声明 `packages/core/agent/src/runtime-types.ts:363`）发 process-local 的三种 frame：`start`、transient `chunk`、`end`（`packages/core/agent-loop/src/assistant-stream.ts:49`）。loop **先追加**完整的 `assistant/message` 或 `assistant/attempt`，committed end frame 再命名其类型与 seq；无法提交时发 `abandoned` end，没有 settlement。

Web 的 follow adapter 订阅这些 frame 做打字机效果，重建时用 `expandAssistantStream()` 展开 settlement 的 embedded stream（`packages/api/session-controller/src/client/sessions/assistant-stream.ts`）。chunk 仍不上线：Web 的实时 chunk 行是 Client-only 事件 `assistant/live-chunk`（`packages/api/session-controller/src/client/contract/events.ts:6`-`:17`），不写进 session log。

**耐久性代价（重要）**：settlement 前**没有**耐久 attempt 证据——硬进程/主机丢失会丢掉整个 in-flight stream；`agent/assistant-stream` **不是 write-ahead log**。

## consumer 合同

`dsh-token-meter` 不再按引用的 chunk seq 重组 provider 输出，改为 `assembleAssistantStream(event.data.stream).blocks()`（`packages/llm/token-meter/src/index.ts:10`、`:337`）。

## 与 session 格式迁移的边界

本篇只写「chunk 不是一等事件」的模型可见后果；格式世代、写者版本与迁移链的唯一家是 [`../session-and-loop/04-格式世代与迁移.md`](../session-and-loop/04-格式世代与迁移.md)。
