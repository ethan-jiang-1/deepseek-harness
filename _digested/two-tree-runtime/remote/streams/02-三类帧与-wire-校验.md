# 三类帧与 wire 校验

核验入口：[`packages/api/session-controller/`](../../../../packages/api/session-controller/README.md)、[`packages/api/remotes/src/remote-events.ts`](../../../../packages/api/remotes/src/remote-events.ts)（Host 事件转发白名单）。

这一页拆开 follow 流里的三类帧，以及客户端拿到 wire 事件之后还要过的那道逐字段白名单。

## 三类帧

客户端 `follow` 读到的帧有三类，`packages/api/session-controller/src/types.ts:570` 的 `SessionFollowFrame` 是它们的并集：

| 帧 | 来源 | 说明 |
|----|------|------|
| 开窗快照 | durable log | 含可选 `assistantStream` 基线（`:525` 的 `SessionAssistantStreamBaseline`） |
| durable event | durable log | 逐条 session 事件，gap-free |
| `assistant-stream` | 进程内 | 仅当请求位 `assistantStream: true`（`:508`）时追加；不是 log 的第二个副本 |

客户端在 `packages/api/session-controller/src/client/transport.ts:181` 显式 opt-in。host 侧累积器是 `packages/api/session-controller/src/assistant-stream.ts`：「Process-local assistant state retained for reconnecting Web followers」。每次接受的 revision 物化一份不可变重连基线（同文件 `:21` 的 `EMPTY_BASELINE`、`:84` 的 `snapshot()`），客户端在 `packages/api/session-controller/src/client/sessions/session.ts:677` 以 `replace(entries, assistantStream)` 合并。它承担的是「重连时把正在流式输出的 assistant attempt 接回来」，不是把 raw chunk 补进 durable log。

客户端对 wire 事件另有一层逐字段白名单：`assertSessionWireEvent()`（`packages/api/session-controller/src/client/session-wire-event.ts:14`）先限定 `type/seq/time/data/ignorable/surfaceOp/sourceEventSeqs`（`:20-33`），再跑 `validateSurfaceMetadata` 与 `validateSessionEventData`（`:44-45`），**不**重写或规范化 wire 字段，也不在这里做范围或来源存在性检查（那需要 durable log，属 Host）。三个调用点都在 `packages/api/session-controller/src/client/transport.ts`：`:185`（history page）、`:217`（live 帧）、`:233`（prepend page）。
