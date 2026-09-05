# Session and loop · 会话与驱动

## 一句话

**session log 是模型请求的可重建来源。** `agent-loop` 只是默认驱动，实现 `Agent` 接口。UI、hook、工具插件依赖 `dsh-agent`，不依赖具体 loop。

**模型可见 ⟺ 已记录。** 消息从 surface 事件投影；生效的模型配置、system 和 tools 在分派前写入完整的 `request/header` 快照。

## 一轮对话长什么样

词汇先分开（正式定义在 [`docs/glossary.md`](../../docs/glossary.md)）：

| 词 | 含义 |
|----|------|
| **turn** | 一次把获准输入抽干。模型与工具都停了，或策略终止，这一轮结束。 |
| **step** | 一次逻辑模型请求周期，加上它调用的工具。`agent/request-error` 重试可在同一 step 内再次流式请求。一个 turn 里可以有 0 个或多个 step。 |
| **round** | 外层策略计数，例如 goal round、Ralph round。不是 session 里每一 turn 都算。 |

![一轮 turn 的事件骨架](./figures/turn-step.svg)

读这张图时抓住三件事：

1. **橙色是持久的。** `turn/*`、`step/*`、`user/message`、`assistant/*`、`tool/*` 写入 log，reload / fork / 回放都靠它们。
2. **蓝色是活的扩展点。** `agent/pre-step`、`agent/request`、`llm/stream`、三条 `tools/*` 是 waterfall；`next()` 委托下游，拥有最终决定的监听器可以直接返回并短路。`agent/turn-stopping` 是 serial，没有 `next()`；需要继续时由监听器 `agent.steer()`。
3. **拒绝也记一笔。** `pre-step` 拒绝、或首次 enter 被改写成空，仍关掉一个不含 step 的持久 turn。日志记录这次尝试。

输入走**同一个 inbox**。有的消息立刻唤醒驱动器；`agent.inject()` 放进去的上下文会等，直到另一条消息把它带走。

## 模型可见即已记录

![模型可见即已记录](./figures/model-visible-logged.svg)

这条不变量决定了模型请求各部分如何落日志：

- 对话内容用 `agent.inject()` 或其它消息入口；获准后写成 surface `user/message`。
- prompt section、tool schema 和模型配置可以在请求前动态组装；loop 会把实际结果写入完整的 `request/header`，然后才分派。
- 只有现有 surface 与 `request/header` 都无法表达的新语义，才需要扩展 `SessionEventMap` 并补上对应的重建规则。

`deriveMessages()` 只从当前有序 surface 投影消息历史；`request/header` 单独重建 config、system 与 tools。`request/context` 只记录 provider、model 和 context window，不参与请求重建。完整记录不等于全部发送：compaction 在仅追加日志中保留旧事件，只让 replacement 在后续消息投影中遮蔽旧 surface。原始 `assistant/chunk` 也会保留，用于回放和 UI 保真。精确折叠规则见 [`01-session-event-map.md`](./01-session-event-map.md#完整记录不等于完整发送)。

fork、resume、transcript、遥测、持久化（JSONL-only）都从这一条流派生。所以 loop 可以换：只要新驱动仍往同一条 log 写、仍发同一类 `session/event`，渲染面可以不动。

> **持久化后端变化**：上游 #2698 和 #3339 将 session 持久化调整为 JSONL-only。SQLite 代码路径已删除。`session-persistence-sqlite` 不再存在；`session-persistence-jsonl` 承担全部持久化职责。zstd 后端拥有拼接多帧容器，以支持追加与批量恢复（`packages/session/session-persistence-jsonl/src/zstd.ts:2-3`）。版本只有一道拒收闸：单一 `SESSION_FORMAT_VERSION = 0`，任何 ≠0 的版本抛 `SessionFormatUnsupportedError`（`packages/session/session-persistence-jsonl/src/format.ts:305-312` 的 `refuseForeignFormatVersion`），没有迁移框架，与 [`01-session-event-map.md`](./01-session-event-map.md#持久化与格式迁移) 的表述一致。

> **ToolCallId 重命名**：上游 #2731 将 `CallId` 统一重命名为 `ToolCallId`（`llm`、`session` 及相关包）。事件字段和类型名已更新，不影响语义。

## Projection 必须化

上游 #2774 和 #2742 将 session projection 从可选机制变为强制要求：

- 每个 projection 定义必须实现 `init(header: SessionHeader, inheritedEventCount: SessionLogOffset)` 方法（`packages/session/session-projection/src/index.ts:62,143`；`header` 仍是 session 的不可变元数据），不再允许无参 `init()`。`inheritedEventCount` 决定 fork/resume 时投影从哪条 seq 起算自有事件（与 `ownEvents()` 的种子前缀切分一致）
- 视图发布使用 `Object.is` 比较：两次 fold 结果若引用相同则跳过发布，避免无效 UI 更新（`packages/session/session-projection/src/index.ts:66,78,96,186`）
- `projection` 层现在位于 `session` 与 `session-persistence` 之间，作为 session 状态的规范投影源

## 每个 agent 的 scope chain

![Scope：全局、preset 祖先层与 agent 自有层](./figures/agent-scope.svg)

- 注册表先读**全局层**，再按 scope parent chain 从最远祖先读到当前 agent；离 agent 最近的同名注册获胜。
- Agent preset 是显式祖先层：standing composition 的工具、提示词和监听器对加入它的 agent 可见。子 agent 可以加入父 agent 正在使用的同一 preset generation，但不会因此继承父 agent 自有层的注册。
- `parentSession` / `delegationDepth` 是持久 lineage 数据，不会自动建立 scope parent；可见性只由 `bindScopeParent` 的运行时关系决定。
- **restrict**：沿 chain 的 restriction 取交集，过滤全局与祖先贡献；当前 agent 自有层的注册最后合并，不受自己的继承面过滤。被过滤的工具在提示词和执行中都表现为不存在。
- **setup window**：agent 对象已经有了、但还没发布、还没 `agent/session-start`。这里只注册，不驱动。preset 给**一个 session** 另一套能力，其中的服务行需要 `isolate` realm。

## 源码入口

| 路径 | `ctx` key | 角色 |
|------|-----------|------|
| `packages/core/session/` | `ctx.sessions` | 仅追加的 log + 内存 store |
| `packages/core/agent/` | `ctx.agents` | `Agent` 接口、活注册表、`agent/*` |
| `packages/core/agent-loop/` | `ctx.agentLoop` | 默认驱动 |
| `packages/core/scope/` | （库） | per-agent 注册原语 |
| `packages/preset/` | | 从 preset `cordis.yml` 组合 |
| `packages/session/` | 持久化 seam | JSONL、projection、title |
| [`docs/agent-lifecycle.md`](../../docs/agent-lifecycle.md) | | 官方时序图 |
| [`docs/subsystems/session.md`](../../docs/subsystems/session.md) | | session 语义 |
| [`docs/subsystems/scope.md`](../../docs/subsystems/scope.md) | | scope 语义 |
| [`docs/subsystems/core.md`](../../docs/subsystems/core.md) | | Agent handle、取消与恢复 |

## 机制级正文

| 文件 | 内容 |
|------|------|
| [`01-session-event-map.md`](./01-session-event-map.md) | 信封、surface 三类、required-on-read、`SESSION_FORMAT_VERSION = 0` |
| [`02-inbox-与turn-时序.md`](./02-inbox-与turn-时序.md) | followup / steer / inject；claim；拒绝仍关 turn |
| [`03-换loop的半径.md`](./03-换loop的半径.md) | `AgentFactory`、日志与事件义务、默认组合替换点 |

下一专题：[`../capability-seams/00-map.md`](../capability-seams/00-map.md) 或 [`../tools-prompt-llm/00-map.md`](../tools-prompt-llm/00-map.md)。
