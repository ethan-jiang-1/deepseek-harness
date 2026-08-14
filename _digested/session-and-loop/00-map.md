# Session and loop 地图

## 一句话定位

session log 是模型看见的上下文的源。`agent-loop` 只是默认驱动，实现 `Agent` 接口；UI、hook、工具插件依赖 `dsh-agent`，不依赖具体 loop。

**Model-visible ⟺ logged.** 任何到达模型请求的东西必须能从 session log 重建。新的模型可见输入必须先有 session event。

## 这一层回答什么

- `turn` / `step` / `round` 的层次（词汇在 [`docs/glossary.md`](../../docs/glossary.md)）。
- 一次 turn 的事件时序，哪些是 durable session event，哪些是 live waterfall。
- `deriveMessages()` 如何从 log 投影模型历史；`assistant/chunk` 为什么仍要记下。
- per-agent `scope`：`agent.ctx`、shadowing、restriction、setup window。
- preset 如何给**一个 session** 另一套能力（含 `isolate` realm）。
- 为什么改产品行为优先挂扩展点，而不是改 `agent-loop`。

## 源码入口

| 路径 | `ctx` key | 角色 |
|------|-----------|------|
| `packages/core/session/` | `ctx.sessions` | append-only `SessionEvent` log + 内存 store |
| `packages/core/agent/` | `ctx.agents` | `Agent` 接口、活注册表、`agent/*` |
| `packages/core/agent-loop/` | `ctx.agentLoop` | 默认驱动 |
| `packages/core/scope/` | （库，无 key） | per-agent 注册原语 |
| `packages/preset/` | | 从 preset `cordis.yml` 组合 per-session agent |
| `packages/session/` | 持久化 seam 等 | JSONL / SQLite、projection、title |
| [`docs/architecture.md`](../../docs/architecture.md) Turn flow | | 官方时序 |
| [`docs/subsystems/core.md`](../../docs/subsystems/core.md) | | Agent handle、取消与恢复 |
| [`docs/subsystems/session.md`](../../docs/subsystems/session.md) | | session 类型与语义 |
| [`docs/subsystems/scope.md`](../../docs/subsystems/scope.md) | | scope 类型与语义 |
| [`docs/agent-lifecycle.md`](../../docs/agent-lifecycle.md) | | 时序图 |

architecture 给出的 turn 骨架（消化时对源码逐事件核验）：

```text
turn/start
  claim next-step input plus one queued message
  assemble prompt sections + tool schemas
  -> agent/pre-step                   reject | enter(messages)
     step/start
     append entered messages as user/message
     derive model history from the log
     agent/request -> llm/stream -> assistant/chunk* -> assistant/message
     tool/call* -> tools/pre-execute -> tools/execute -> tools/post-execute -> tool/result*
     step/end
  -> agent/turn-stopping
turn/end
```

## 计划中的章节（待消化）

| 文件 | 打算回答 |
|------|----------|
| `01-session-log-与投影.md` | `SessionEventMap`、required-on-read、`ignorable`、`deriveMessages()` |
| `02-turn-step-时序.md` | 上图逐事件对源码；waterfall vs serial |
| `03-agent-scope.md` | `agent.ctx`、shadowing、restriction、lineage 不是 scope |
| `04-loop-为何可替换.md` | `dsh-agent` vs `dsh-agent-loop` 的依赖方向 |
| `05-持久化与格式.md` | JSONL/SQLite、`SESSION_FORMAT_VERSION`、projection |
