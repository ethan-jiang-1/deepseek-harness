# Session and loop · 会话与驱动

## 一句话

**session log 是模型看见的上下文的源。** `agent-loop` 只是默认驱动，实现 `Agent` 接口。UI、hook、工具插件依赖 `dsh-agent`，不依赖具体 loop。

**模型可见 ⟺ 已记录。** 任何到达模型请求的东西必须能从 log 重建。新的模型可见输入必须先有 session event。

## 一轮对话长什么样

词汇先分开（正式定义在 [`docs/glossary.md`](../../docs/glossary.md)）：

| 词 | 含义 |
|----|------|
| **turn** | 一次把获准输入抽干。模型与工具都停了，或策略终止，这一轮结束。 |
| **step** | 一次模型请求，加上它调用的工具。一个 turn 里可以有 0 个或多个 step。 |
| **round** | 外层策略计数，例如 goal round、Ralph round。不是 session 里每一 turn 都算。 |

![一轮 turn 的事件骨架](./figures/turn-step.svg)

读这张图时抓住三件事：

1. **橙色是持久的。** `turn/*`、`step/*`、`user/message`、`assistant/*`、`tool/*` 写入 log，reload / fork / 回放都靠它们。
2. **蓝色是活的扩展点。** `agent/pre-step`、`agent/request`、`llm/stream`、三条 `tools/*` 是 waterfall，必须 `next()`。`agent/turn-stopping` 是 serial，没有 `next()`。
3. **拒绝也记一笔。** `pre-step` 拒绝、或首次 enter 被改写成空，仍关掉一个不含 step 的持久 turn。日志记录这次尝试。

输入走**同一个 inbox**。有的消息立刻唤醒驱动器；`agent.inject()` 放进去的上下文会等，直到另一条消息把它带走。

## 模型可见即已记录

![模型可见即已记录](./figures/model-visible-logged.svg)

这条不变量决定了「加上下文」的合法路径：

- 给下一请求塞材料：`agent.inject()`，它会进入 inbox，出现在下一次获准请求里，并且必须能从 log 重建。
- 给产品加一种新的模型可见输入：扩展 `SessionEventMap`，从 log 渲染。不要只在 prompt 组装里偷偷加一段。

`deriveMessages()` 从 log 投影模型历史。原始 `assistant/chunk` 另外记下，是为了回放和 UI 保真——投影给模型的历史，和像素级 UI，不是同一份东西。

fork、resume、transcript、遥测、持久化（JSONL / SQLite）都从这一条流派生。所以 loop 可以换：只要新驱动仍往同一条 log 写、仍发同一类 `session/event`，渲染面可以不动。

## 每个 agent 自己的 scope

![Scope：两层扁平，不向下继承](./figures/agent-scope.svg)

- 贡献要么**全局**（每个 agent 都看见），要么**scoped**（只属于一个 agent，key 就是这个活着的 agent 对象）。
- **没有树状继承。** 子 agent 看不见父的 scoped 工具。父子是 `lineage` 数据（`parentSession`、`delegationDepth`），不参与可见性。
- **shadowing**：同名 scoped 注册盖掉全局孪生，只对该 agent。
- **restrict**：先按交集过滤全局工具集；被滤掉的工具，提示词里没有，执行也拒绝，和「不存在」无法区分。scope-local 注册在过滤之后合并。
- **setup window**：agent 对象已经有了、但还没发布、还没 `agent/session-start`。这里只注册，不驱动。preset 给**一个 session** 另一套能力，其中的服务行需要 `isolate` realm。

## 源码入口

| 路径 | `ctx` key | 角色 |
|------|-----------|------|
| `packages/core/session/` | `ctx.sessions` | 仅追加的 log + 内存 store |
| `packages/core/agent/` | `ctx.agents` | `Agent` 接口、活注册表、`agent/*` |
| `packages/core/agent-loop/` | `ctx.agentLoop` | 默认驱动 |
| `packages/core/scope/` | （库） | per-agent 注册原语 |
| `packages/preset/` | | 从 preset `cordis.yml` 组合 |
| `packages/session/` | 持久化 seam | JSONL / SQLite、projection、title |
| [`docs/agent-lifecycle.md`](../../docs/agent-lifecycle.md) | | 官方时序图 |
| [`docs/subsystems/session.md`](../../docs/subsystems/session.md) | | session 语义 |
| [`docs/subsystems/scope.md`](../../docs/subsystems/scope.md) | | scope 语义 |
| [`docs/subsystems/core.md`](../../docs/subsystems/core.md) | | Agent handle、取消与恢复 |

## 机制级正文

| 文件 | 内容 |
|------|------|
| [`01-session-event-map.md`](./01-session-event-map.md) | 信封、surface 三类、required-on-read、`SESSION_FORMAT_VERSION = 0` |
| [`02-inbox-与turn-时序.md`](./02-inbox-与turn-时序.md) | followup / steer / inject；claim；拒绝仍关 turn |
| [`03-换loop的半径.md`](./03-换loop的半径.md) | `AgentFactory`；介绍句是方向，`package.json` 是当前耦合 |

下一专题：[`../capability-seams/00-map.md`](../capability-seams/00-map.md) 或 [`../tools-prompt-llm/00-map.md`](../tools-prompt-llm/00-map.md)。
