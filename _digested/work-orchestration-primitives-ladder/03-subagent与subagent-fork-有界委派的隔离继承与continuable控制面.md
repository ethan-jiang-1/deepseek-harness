# subagent 与 subagent_fork：有界委派的隔离、继承与 continuable 控制面

源码核验入口：`docs/subsystems/subagent.md`、`packages/subagent/subagent/src/`（`types.ts`/`index.ts`/`continuation.ts`）、`packages/subagent/tool-subagent/src/index.ts`、`packages/subagent/tool-subagent-control/src/`、`packages/subagent/subagent-fork-in-process/src/`、`packages/bundle/base/cordis.patch.yml`、`packages/bundle/web-app/presets/cordis.patch.yml`。

本页回答：一次委派到底隔离了什么、fork 继承了什么、one-shot 与 continuable 差在哪、控制面（`send_message`/`interrupt_agent`/`list_agents`）的边界规则是什么？工具描述里的选择语义（什么时候用）见 [`02-什么时候用哪个原语-官方选择决策语义全景.md`](./02-什么时候用哪个原语-官方选择决策语义全景.md)；seam 的 provider 结构、catalog 投影与 host Queue/Steer 交付见 [`../capability-seams/03-subagent后台与产品provider.md`](../capability-seams/03-subagent后台与产品provider.md) 与 [`../capability-seams/05-subagent-catalog与host交付.md`](../capability-seams/05-subagent-catalog与host交付.md)，本页不重复。

## 一次 start 的解剖

subagent seam 与 bash 型 seam 的关键差异：**多个具名 provider 共存**于一个 `ctx.subagents` 注册表（像 LLM adapter 注册表，不像 bash 的单执行器）（`docs/subsystems/subagent.md:5`-`7`）。provider 是"具名的子代理 transport"：`spawn`（进程内 fresh）、`fork`（进程内继承）、`acp`/`codex`/`claude-code`（进程外）、`dsh-sdk`。

两层能力发现，两种途径（`docs/subsystems/subagent.md:14`-`22`）：

| 能力 | 发现方式 | 违反行为 |
|------|---------|---------|
| 一次性 start 的 `agentOptions`/`outputSchema`/`depthLimit`/`toolFilter`/`persona` | 静态 `SubagentCapabilities` 旗标，service 在 start **前**检查 | `UNSUPPORTED_CAPABILITY` 拒绝，绝不"接受后忽略"（fail loud） |
| continuable | provider 有没有可选方法 `prepareContinuable`（TS narrowing 即发现） | 无此方法的 provider 起 continuable 被拒 |

provider 只参与**准备初始创建 spec**——返回物只有脱离的 provider 特有创建输入（可选的 parent-history seed），不含 Agent、`AgentHandle`、prompt 交付、结果、处置或恢复操作；**冷恢复根本不走 provider**：continuation manager 折叠通用 descriptor，经 activation-owner scope 调 `ctx.agents.resume()`（`docs/subsystems/subagent.md:223`）。

创建路径分家（`docs/subsystems/subagent.md:457`）：

- **one-shot**：spawn/fork backend 经 `parent.ctx` 创建普通 agent，取消传入 core 创建，经 `AgentHandle` 处置；
- **continuable**：由 continuation manager 经自己的 activation-owner scope 创建；
- provider 卸载阻断新 start，**不撤销已接受的 run**；
- **每个 child 拿到新的 flat scope**，不继承父的任何注册（`docs/subsystems/subagent.md:458`）。

`inheritsParentContext` 只描述**会话播种**（fork: true；spawn 与 acp: false），不意味着继承工具、服务或权限（`docs/subsystems/subagent.md:393`、`:437`）。

## fork 继承什么：balanced completed-turn 前缀

fork 的种子用 `CreateAgentOptions.seed`——一个 `SessionEvent[]` 前缀，经 `AgentLoop.createAgent` → `ctx.sessions.prepare({ seed })` 穿线，**与 `ctx.agents.resume()` 用的是同一原语**。fork backend 传的是父日志的 **balanced completed-turn 前缀**：截至并包含父最后一个 `turn/end` 的全部事件——种子从 seq 0 连续、lossless JSON、收支平衡，invariants 回放可接受；**未收口的 in-flight turn 被排除**（`docs/subsystems/subagent.md:462`；`SubagentStartSpec.seed` 的 JSDoc，`:255`-`259`）。

三条推论：

1. **fork 继承的是事件流，不是对话摘要**——子会话回放的是父的完整已完成轮次，投影、工具调用历史原样在场；
2. **`Session.inheritedEventCount` 是 fork 谱系边界**：catalog 投影忽略 offset 以下事件（fork 出的子会话不把继承段里的目录事实当自己的，`packages/subagent/subagent/src/catalog.ts:119`-`123`）；descriptor 权威读子会话自己的后缀，身份投影 last-wins 折叠 `subagent/descriptor`，子自己的 descriptor 覆盖 fork 种子里祖先的（`docs/subsystems/subagent.md:265`）；
3. **KV Cache 前缀复用是设计动机**：base 的 fork 行省略模型选择，让 provider/model 与父一致、继承历史保持前缀缓存复用资格（`packages/bundle/base/cordis.patch.yml:377`-`379` 注释）。旧的 continuable-fork KV 代价机制（child-only `report` 工具 + prompt section 使继承前缀失效）已退役；现在的组合层选 continuable 不再引入 child-only section（[`../capability-seams/03-subagent后台与产品provider.md`](../capability-seams/03-subagent后台与产品provider.md)）。

fork 子代理还经 session-query 的 lineage traces 继承 Workspace 关联（`packages/bundle/base/cordis.patch.yml:143` 注释：session export 与 subagent-fork Workspace inheritance 依赖 exact reads 保持可用）。

## 深度与谱系：嵌套边界

深度是双字段权威（`docs/subsystems/subagent.md:461`）：持久的 `SessionHeader.delegationDepth` + 可合并扩展的运行时字段 `AgentOptions.subagentDepth`；缺失即顶层深度 0，**取两者中较大者**。seam 独占这两个字段（loop 不读不写）；进程内 child 持久化 parent depth + 1；**冷恢复不能降深度**；每次 start 拒绝超出安全整数域或超过请求 `maxDepth` 绝对上限的派生深度（`maxDepth` 需 `depthLimit` 能力旗标，`docs/subsystems/subagent.md:84`-`89`）。

`SubagentRuntime.listDescendants(rootSessionId)` 递归读各级 catalog，稳定前序、保持各父的事件顺序；不可读的 child catalog 产出 `corrupt`/`unavailable` 并只停那一支；重复 id 与环跳过；不在可达 catalog 里的会话（含普通 Session fork 及其下的子代理）不被发现；每行带 catalog parent 与 root-relative depth（`docs/subsystems/subagent.md:273`-`281`）。

## 权限：delegated permission

委派权限在**第一个 await 之前**捕获（`docs/subsystems/subagent.md:459`）：

- Auto / Full access 父：把捕获的 `permission/preset` 身份附加给新 child（在 fork seeding 之后、sandbox/approval overrides 之中）；one-shot 与 continuable 同路；冷恢复只读 child 日志；
- Read Only / Workspace Write：保留继承的沙箱 override + `approval: never`；
- **每个 Auto child 调用独立审查**：用既有的 `parentSession`、创建 prompt、经认证的 human/direct-parent 消息；Auto review 决策定义 low/medium/high 语义（`.agents/notes/implemented/feature/2026-08-28-auto-review.md`）。

## one-shot 与 continuable：两种后台模式

路由由 `dsh-tool-subagent` 的 `backgroundMode` 配置选择（完整表见 [`../capability-seams/03-subagent后台与产品provider.md`](../capability-seams/03-subagent后台与产品provider.md)），组合层事实：

| 组合 | subagent（spawn） | subagent_fork（fork） |
|------|-----------------|---------------------|
| base bundle | `continuable`（`packages/bundle/base/cordis.patch.yml:370`-`375`） | `one-shot`（`:383`-`388`，保 KV 前缀注释） |
| web preset | `continuable` + `modelSelectionSettings: true`（`packages/bundle/web-app/presets/cordis.patch.yml:93`-`97`） | **`continuable`**（`:98`-`101`） |
| codex / claude-code 行 | preset 内默认 `disabled: true`，`one-shot` + `maxDepth: provider-managed`（`:103`-`116`） | — |

one-shot 显式后台时接入 jobs：`settleStart` 把 `SubagentRun` 映射为 `JobOutcome`（失败清理不改写成干净的 killed Job，`packages/subagent/tool-subagent/src/index.ts:144`-`149`）；`jobs.start(...)` 在 preflight 完成后注册（`:538`-`544`），返回 `{kind:'background', jobId}` 与文案 `started background subagent job <id>`（`:462`、`:560`）；无 jobs 服务时报 `background jobs unavailable: load @deepseek-ai/dsh-jobs and @deepseek-ai/dsh-tool-jobs`（`:540`）。

continuable 走 `ctx.subagents.startContinuable()`，在 inbox 接纳时结算：此后 child 拥有自己的轮次，这个 tool 调用既不等待也不收集结果（`capability-seams/03`）。child 结算时的回传是 **settle notice**：Activation 结算时向 child 的 durable direct parent 交付一条 notice，描述该 epoch 如何结束、携带最终 assistant 输出的非空 text blocks（没有则 `It left no closing message.`）；交付对每个"caller 收到过其 id"的 child 无条件发生，**先于 ownership release**；notice 的 source kind 独立，transcript 永不把 runtime 账目呈现成 child 写的东西（`docs/subsystems/subagent.md:202`）。

Activation 所有权图（`docs/subsystems/subagent.md:165`-`170`）：每个 Activation 拥有自己的 `AgentHandle` 与 `ownedChildren: Set<SessionId>`；一个 Session 至多一个 live Activation，child Session id 即可定位 live child；父在集合非空时不能结算；child 只有在"无活跃 Agent 工作、Inbox 空、它自己的每个 child 都已处置、best-effort 最终 flush 结算、`AgentHandle` 完成处置"五条件齐备后才释放。

## 控制面：send_message / interrupt_agent / list_agents

**`send_message` 是单一 steer 语义**：目标子代理运行中，消息 steer 它最近的 step；idle 则开新 turn。只确认送达、不回答案（工具文案 `packages/subagent/tool-subagent-control/src/index.ts:29`-`32`）。host 通道另有 Queue（独立 turn）/ Steer 双语义，但**模型侧 `send_message` 不随 host 通道扩展**（`capability-seams/05`；`docs/subsystems/subagent.md:246`-`253`）。

**`interrupt_agent` 不等待停止**：`SubagentRuntime.interrupt(targetSessionId, authority)` 同步授权，对 live target 发 `Agent.cancel(cause, { keepInbox: true })`，**不等静止就返回**（`docs/subsystems/subagent.md:156`）。边界规则：

- Activation、未领取的 pending inbox 工作、已发布的后代**不受影响**；已被领取进被中断 turn 的工作不重排队；
- 被中断的 driver idle 后，一次 waking send 恢复 parked FIFO 队列；
- 目标缺席（未知 / one-shot / 已结算）与无 manager 组合是**合法 no-op**；
- live target 上父地址不匹配或 caller 不在其 live ancestry → `UNAUTHORIZED`；过期的 ancestor 对象与自指请求在 target 查找前拒绝；
- 授权两型：`user`（人类客户端出示的 durable direct-parent 地址）| `ancestor`（精确的 live Agent 对象，其记录谱系必须包含 caller）（`docs/subsystems/subagent.md:158`-`164`）。

**`list_agents` 按 scope 深度分权**：`children` 列直接子级；`descendants` 列你之下的整棵树——**深度 >1 的条目只接受 `interrupt_agent`**（工具描述 `packages/subagent/tool-subagent-control/src/list-agents.ts:97`-`98`）；数据面就是 `listChildren`（live-preferred 父观察，不开 child 日志）与 `listDescendants`（递归 catalog，`docs/subsystems/subagent.md:271`-`281`）；`list_agents` 面依赖 session-projection 挂载，缺了 fail loud（`packages/bundle/base/cordis.patch.yml:153`-`156` 注释）。

## 进程外后端与模型路由

一句话差异（细节在 `capability-seams/03`）：

| 后端 | 一句话 |
|------|--------|
| `spawn`（进程内） | 最便宜的委派 transport，fresh child |
| `fork`（进程内） | child 建立在父的已完成轮次上 |
| `acp` | 进程外 ACP transport，拒绝 `agentOptions`（`docs/subsystems/subagent.md:60`） |
| `codex` / `claude-code` | 产品 CLI 的进程外 provider，preset 内默认 disabled、one-shot、`maxDepth: provider-managed` |
| `dsh-sdk` | 经 DSH SDK 起独立 runtime；静态 `agentRouteDefaults` 提供路由默认（`deepseek-official`/`deepseek-v4-flash`）；**无 `prepareContinuable`，其 child 不进 send_message/continuable 路径**（`capability-seams/03`） |

## 与相邻原语的关系

- **workflow 的 `agent()` 钩子就是 subagent 调用**：每次 `agent()` 经 `ctx.subagents.start(provider, { parent })` 发布 child（[`01`](./01-workflow-模型编写的JS编排脚本与子代理扇出机制.md) 归属节）；
- **agent-teams 复用 spawn/fork provider**：成员创建直接走 subagent seam 的 spawn/fork，`spawn_teammate` 的 `context` 参数 fresh/fork 即两种 provider 的暴露（[`../experimental/02-agent-teams.md`](../experimental/02-agent-teams.md)）；
- **goal 工具把子代理关在门外**：goal 的执行时权限检查要求"精确的 live calling agent 在其 active driver 内"（`ctx.agents.get(agent.id) === agent` 且 `currentInitiator() === agent`，`packages/goal/tool-goal/src/authority.ts:45`-`52`）；授权只有 `direct-human` 与 `goal-round` 两型——子代理天然不是 initiator，调用即拒。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `docs/subsystems/subagent.md` | seam 权威文档：能力旗标、start request、seed、深度、权限、interrupt、settle notice |
| `packages/subagent/subagent/src/types.ts` | `SubagentStartRequest`/`SubagentCapabilities`/`SubagentStartSpec.seed` |
| `packages/subagent/subagent/src/continuation.ts` | continuation manager：activation 所有权、Queue/Steer 投递 |
| `packages/subagent/subagent/src/catalog.ts` | `subagent/catalog` 事件与投影、fork 隔离（inheritedEventCount） |
| `packages/subagent/tool-subagent/src/index.ts` | 工具层：双 provider wording、backgroundMode 路由、job 接入（`:144`-`149`、`:538`-`560`） |
| `packages/subagent/tool-subagent-control/src/index.ts` | `send_message` / `interrupt_agent` 注册 |
| `packages/subagent/tool-subagent-control/src/list-agents.ts` | `list_agents` 的 scope 与深度分权 |
| `packages/subagent/subagent-fork-in-process/src/` | fork provider：balanced 前缀种子 |
| `packages/goal/tool-goal/src/authority.ts` | goal 权限：initiator 检查把子代理拒之门外 |
| `packages/bundle/base/cordis.patch.yml:370`-`388` | base 组合：subagent continuable / fork one-shot + KV 注释 |
| `packages/bundle/web-app/presets/cordis.patch.yml:93`-`116` | web preset：fork 也 continuable；codex/claude-code 默认 disabled |
| `.agents/notes/implemented/feature/2026-08-28-auto-review.md` | Auto child 独立审查的 low/medium/high 语义 |
