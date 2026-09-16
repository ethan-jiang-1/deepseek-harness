# Agent 运行时身份：显式属主与 initiator 权限判据

## 一句话

旧基线让任意 `Context` 通过反向属性 `ctx.agent` 找回 Agent；新基线删掉这条关联，身份只在拥有它的地方显式传递——`AgentSetup(agentCtx, agent)`、`CreateAgentOptions.parentAgent` / `ResumeAgentOptions.parentAgent`，以及 loop 用 `withInitiator` 划出的因果边界。这条边界从「日志归属」升级成了**权限判据**：goal round driver 靠它区分 host 的 Pause 与模型自己的 `update_goal pause`。

## 源码核验入口

| 路径 | 角色 |
|------|------|
| `packages/core/agent/src/index.ts` | `AgentSetup`、`parentAgent`、`AgentRegistry.register()`、initiator 边界 API |
| `packages/core/agent-loop/src/index.ts` | factory：以 `parentAgent` enter 子 Agent |
| `packages/core/agent-loop/src/agent.ts` | `wakeDriver()` 用 `withInitiator` 包住整段 activity |
| `packages/goal/goal-round-driver/src/index.ts` | host pause / model pause 的分支判据 |
| `packages/subagent/tool-subagent/src/index.ts` | 子级 model-selection 继承改从 Session 读父 |
| `packages/core/agent/src/runtime-types.ts` | scoped event 的 payload 自带 Agent（`:258`、`:277`） |

## 删掉的反向关联

旧基线在 `Context` 上声明可选的 `agent` 反向属性并注册 `ctx.accessor('agent', …)`，任何拿到 Context 的代码都能反推 Agent。问题是 Context 与 Agent 回答两个不同的问题：Context 是注册与生命周期所有者，Agent 是这次操作的身份（选哪个 Session、谁是运行时属主、事件主体是谁、权限归谁、wire 身份是谁）。反向属性把两者混为一谈，还逼出三种补偿机制——Host Remote 转发从路由 subject 反查 Context、创建路径从调用方 Context 推断运行时父属、适配器维护反向身份扫描。

新基线只按显式身份解析：Typert 的 lookup 与 host context provider 都以 wire 字段 `agentId` 为输入，`resolve: sessionId => this.get(sessionId)`（`packages/core/agent/src/index.ts:259-269`；session-controller 的异步版本 `packages/api/session-controller/src/agent.ts:158-162`）。`agent.ctx` 仍是注册与生命周期所有者，但不再暴露任何反向 Agent 属性。

决策记录在仍现行的 note `.agents/notes/implemented/architecture/2026-08-31-explicit-agent-runtime-identity.md`；它只取代 [2026-07-15 initiator 作用域决策](../../.agents/notes/implemented/architecture/2026-07-15-agent-initiator-scope.md) 里的「反向 Context 关联 / 隐式运行时属主推导」部分，注册作用域与 initiator 私有链的理由仍然独立成立。

## 身份显式传递

- `AgentSetup` 的签名是 `(agentCtx: Context, agent: Agent)`（`packages/core/agent/src/index.ts:50-53`）：setup 回调同时拿到「注册落在哪个 Context」与「这次操作属于哪个 Agent」，不再需要从前者推后者。父创建子时，setup 回调的 Agent 参数是**子**，因果父由 initiator 边界报告。
- `CreateAgentOptions.parentAgent`（`:66`）与 `ResumeAgentOptions.parentAgent`（`:129`）是运行时子属关系的唯一入口。
- `AgentRegistry.register()` 固定以 root 身份进入：`yield this.enter(agent, undefined)`（`:434-436`）。也就是说，已构造 Agent 的注册永远是运行时 root；子属关系只能经 `parentAgent` 建立——loop 侧的调用点是 `loopCtx.agents.enter(agent, parentAgent)`（`packages/core/agent-loop/src/index.ts:667`）。
- 后果：`AgentRegistry.roots()` 与 `isOwnedBy()` 看的是 live 属主，不是 durable 的 `parentSession` metadata。一个 fork 或 resume 出来的 Session 在没有 live Agent 拥有它时就是运行时 root，而 `SubagentContinuationManager` 建立的 continuable child 即使在私有插件 Context 里创建，也因为有精确 `parentAgent`（`packages/subagent/subagent/src/continuation-activation.ts:592`、`:599`，冷 resume 与新建两条路径都传）而不被当成顶层。

### 对 subagent 的直接后果

同一条原则决定了 subagent 的 model-selection 继承目标：`selectForSession(session)` 从 `ctx.get('sessions')` 读父 Session（`packages/subagent/tool-subagent/src/index.ts:620-650`），而不是从 Agent registry 反查父 Agent；委派工具的装载签名因此变成 `apply(ctx, config, session?)`（`:307-313`），由直接 `AgentSetup` 显式传入尚未发布的 Session。host 侧的消息交付同样显式带 parent：`deliverSubagentPrompt(parent, childId, …)`（`packages/subagent/subagent/src/internal.ts:42-55`）。机制细节见 [`../capability-seams/05-subagent-catalog与host交付.md`](../capability-seams/05-subagent-catalog与host交付.md)。

## initiator 边界

`withInitiator(agent, operation)` 把一段进程内操作标记为「继承自这个 Agent」，`currentInitiator()` 读当前边界，`withoutInitiator(operation)` 显式清除归属（`packages/core/agent/src/index.ts:292`、`:324`、`:339`）。契约写明 presence 既不是存活证明也不是授权——它只回答因果归属。

loop 在 `wakeDriver()` 里用 `this.loopCtx.agents.withInitiator(this, () => this.kick())` 启动 driver（`packages/core/agent-loop/src/agent.ts:207`）：整个 activity（若干 turn、step、工具执行）都落在「以该 agent 为 initiator」的边界内。反过来，goal round driver 的调度任务用 `ctx.agents.withoutInitiator(async () => { … })` 包住（`packages/goal/goal-round-driver/src/index.ts:215`），因为后台调度不属于任何 agent 的 turn。

## initiator 作为 pause 来源判据

`goal/changed` 监听器现在解构 `change`，并用 initiator 判定 pause 的来源（`packages/goal/goal-round-driver/src/index.ts:283-294`）：

```ts
if (change.operation === 'pause' && agent.status === 'running'
  && ctx.agents.currentInitiator() !== agent) {
  agent.cancel({ kind: 'user' }, { keepInbox: true })
}
```

- **host 发起**的 pause（Web 按钮等 agent initiator 边界之外的路径）满足 `currentInitiator() !== agent`，于是正在跑的 turn 被 `agent.cancel` 直接中止——Pause 成为真正的「现在停下」，而不只是「别再开新一轮」。`keepInbox` 保留待处理输入。
- **模型自己**的 `update_goal pause` 在自身 turn 内运行，`currentInitiator() === agent`，于是正常跑完当前 turn，pause 从下一轮起生效。

initiator 在产品语义里并非全新判据：`goalToolExecution` 早就在 OLD 基线用 `ctx.agents.currentInitiator() !== agent` 拒绝「不在自己 active driver 内」的 goal tool 调用（`packages/goal/tool-goal/src/authority.ts:52-58`，本跨度未改）。driver 这条分支的新意在于：它用同一个 API 区分**两个都合法的发起者**（host 与 model）并据此决定是否中止正在跑的 turn，而不只是拒绝越权调用。相关的 goal 工具授权（`requireDirectHuman` / `completionAuthority`）仍基于 live agent 与 initiator（`packages/goal/tool-goal/src/authority.ts:110-117`），本跨度未改判据。被中止的 turn 与随后的 resume 时序（revision 栅栏）见 [`02-goal-round-driver.md`](./02-goal-round-driver.md) 的「host pause 与 revision 栅栏」。

## 与四层边界的关系

activity 层因此多了一个此前没有的边界语义：它不只是「一段连续运行的 agent 活动」，还是一段有 initiator 归属的活动。step / turn / goal 三层的结束条件不受影响，唯一新增的关停路径是 `goal/changed` 触发的 host pause——由 driver 主动调用 `agent.cancel`。四层划分与「idle 不等于完成」的结论不变，见 [`03-activity-vs-goal-boundaries.md`](./03-activity-vs-goal-boundaries.md) 与 [`00-map.md`](./00-map.md)。
