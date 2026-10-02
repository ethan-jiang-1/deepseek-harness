# Work Orchestration Primitives Ladder · 工作编排原语阶梯

专题基线：`639ed015397290b3745d163aafe02ffee4aa3f84`（`dsh-v0.2.0-rc.2`）。最近一次引用复核在 `8f761b5a6e`（本专题自身的文档 commit）运行；该 commit 与基线之间的 `packages/` 树逐字相同，因此下文 path:line 与基线一致，不存在两套行号。**专题 HEAD 指产品源码 commit，不是文档 commit**；若同步到新的产品 commit，应重新运行引用复核并重写漂移行号。

## 一句话

ruofei 说「这个其实是一个 agent harness 今后的一个趋势，我们要好好充分利用一下 DSH 这个能力」。本专题从**驾驶座视角**（harness 的使用者，不是插件开发者）回答一个家族问题：**DSH 给了哪些把工作拆解、委派、编排、推进到完成的原语？各自保证什么、隔离什么？什么时候用哪个？怎么组合？**

外部叙事常把 DSH 描绘成「Captain 规划 + Kahn 入度队列 + Reviewer 门禁」的中心化 Task DAG 调度引擎。当前源码没有一个按 Teams ready 队列自动派工的中心 Task DAG executor；实际系统由可组合原语、workflow 局部控制流、Teams 任务图准入、Host schedule 和 JobRegistry 等多个机制组成。模型按任务的时间跨度与隔离需求选择原语，工具描述与包 README 携带各自的选择边界（证据见 [`02-什么时候用哪个原语-官方选择决策语义全景.md`](./02-什么时候用哪个原语-官方选择决策语义全景.md)）。

再往深一层，可以把专题对象分成三类，而不是把所有原语都归为 Agent 编排：**Agent 编排**（subagent、workflow、ralph、goal、agent-teams）负责构造上下文并驱动模型 Agent；**进程作业**（bash、pwsh、terminal 的后台 job）负责驱动非 Agent 工作；**计划与账本**（todo、plan、jobs、schedule）负责记录、投递或触发，不等同于 Agent 执行。它们共享归属、权限、持久化与通知等基础设施，但执行者和完成证据不同。更深的图模型、in-process Agent 的统一重述，以及各类原语的限制见 [`11-图计算的本质-不变量推导与执行的三件分置.md`](./11-图计算的本质-不变量推导与执行的三件分置.md)。

## 统一维度矩阵

| 类别 | 执行者 | 主要持久事实 | 记忆来源 | 派发/推进者 | 完成证据 |
|------|--------|--------------|----------|--------------|----------|
| Agent 编排 | in-process Agent、PTC 脚本或外部 provider | Session、子代理目录、goal/team 记录（按原语不同） | 对话历史、workspace、结构化 handoff 或任务板 | loop、workflow 控制流、Lead 或 goal driver | turn/子代理结果、结构化报告、任务状态或模型自报 |
| 进程作业 | bash、pwsh、terminal 等进程 | job 状态与有界输出 ring | 进程输出与 producer 资源 | producer 与 JobRegistry | `completed`/`killed`/`failed` 终态；不等于模型已读 |
| 计划与账本 | 当前 Agent、Host scheduler 或 registry | todo/plan/schedule/job 记录与投影 | Session 日志、Host 存储或内存 registry | 人类审批、Host 时间、通知控制面 | 提交、审批、到期投递或账本终态；不等于业务完成 |

## 原语维度矩阵

| 原语 | 执行者 | 记忆/事实 | 推进者 | 权限与容量 | 完成证据与通知 |
|------|--------|-----------|--------|------------|----------------|
| todo / plan | 当前 Agent + human review | Session event + turn/pending projection | 模型、人类审批、pre-step | Agent session；无自动派工 | list/mode commit；留在当前会话 |
| subagent / fork | child Agent 或外部 provider | child Session、fork seed 或 one-shot result | parent / control面 | parent lineage、depth、provider capabilities | result/dispose 或 inbox acceptance/settle notice |
| workflow | PTC script + child runs | script args、workspace、观察事件 | script control flow + FIFO slots | engine caps、sandbox、run holder | result stopReason；job notice 或 foreground result |
| ralph | 每轮 fresh child | workspace + 有界五字段 handoff | fixed script | maxRounds、fresh-provider、前台 | worker report / budget / failure；前台返回 |
| goal | 当前 Session 的 Agent incarnation | goal/change + durable phase | Goal Round Driver | armed、revision、idle/quiescence、round cap | complete/blocked + wrapup |
| jobs | producer 进程/资源 | registry state、ring、cursor（provider决定持久性） | producer + JobRegistry | exact-owner fence、owner capacity | terminal state、awaited/read；通知可唤醒或注入 |
| schedule | Host runtime + 目标 Session | Host task record + Session message | wall-clock Host | original Session binding、timer/serialized drive | inbox flush 后 retire/advance；follow-up |
| agent-teams | Lead、具名队友、task board | Lead log + projection + mailbox receipt | Lead/队友对话；ready 不自动派发 | roster/task/mailbox caps、CAS、owner | task/message transitions；peer message/wait；质量需 Lead 显式复核 |

这张矩阵只维护跨页的比较轴；每个原语的详细机制和限制仍以对应专题页为准。`completed`、`settled` 或 `delivered` 都不是业务正确性的自动证明；需要质量判断时，查 [`07`](./07-agent-teams-驾驶座用法-启用代价Lead工作流与协作纪律.md) 的验收闭环和 [`10`](./10-完成语义与崩溃窗口-接受可见静止处置.md) 的完成分层。

![阶梯全景](./figures/ladder.svg)

## 阶梯总表

| 原语 | 包 | 一句话语义 | 上下文隔离 | 时间跨度 |
|------|----|-----------|-----------|---------|
| `todo_write` | `packages/todo/tool-todo/` | 上下文内计划留痕：多步工作列清单，琐碎单步跳过 | 同上下文 | 单 turn |
| plan mode | `packages/plan/plan-mode/` | 计划先行：先出方案、用户批准后执行 | 同上下文 | 单 turn |
| `subagent` / `subagent_fork` | `packages/subagent/tool-subagent/` | 有界委派：一两个自包含任务交给独立子代理 | 独立子上下文 | 一次性（one-shot / continuable） |
| `workflow` | `packages/workflow/tool-workflow/` | 模型写 JS 编排脚本扇出子代理（`agent`/`pipeline`/`parallel`/`phase`） | 沙箱 PTC 进程 | 前台等待 / 后台 job |
| `ralph` | `packages/workflow/tool-ralph/` | 不可变目标的 fresh-agent 前台循环，轮间只传有界报告 | 每轮全新子代理 | 前台多轮 |
| `goal`（`create_goal`/`update_goal`/`get_goal`） | `packages/goal/tool-goal/` | 跨轮次长目标 + idle 自动续跑（Goal Round Driver） | 同会话跨轮 | 跨自动续轮 |
| `jobs`（后台化 + `job_output`/`job_kill`/`job_list`） | `packages/jobs/tool-jobs/` | 任意工作后台化，随时收结果、可取消 | 后台 job | 异步 |
| schedule | `packages/schedule/schedule/` | 定时跟进（optional bundle，随装随用） | — | 定时触发 |
| agent-teams * | `packages/experimental/agent-team/` 服务；`packages/experimental/tool-agent-team/` 工具；`packages/experimental/agent-team-profile/` 组合；`packages/experimental/ui-agent-team/` UI | Lead + 具名队友 + 持久消息 + 共享任务板 | 独立持久会话 | 持续协作 |

\* experimental：无稳定合同承诺，随时可能改名或消失。

## 默认挂载状态

阶梯上每一级在 shipped 组合里的开/关，是「充分利用 DSH」的第一手事实：谁开箱即用、谁要显式打开，全部落在 `packages/bundle/base/cordis.patch.yml` 与 optional bundle 清单里。

| 原语 | 默认状态 | 出处 |
|------|---------|------|
| `todo_write` | base 挂载，`allowParallelInProgress: true` | `packages/bundle/base/cordis.patch.yml:430`-`433` |
| plan mode | base 挂载（plan-mode 行含 plan-mode 行为段注入） | `packages/bundle/base/cordis.patch.yml:322` |
| `subagent` | base 挂载：`provider: spawn`、`backgroundMode: continuable` | `packages/bundle/base/cordis.patch.yml:370`-`375` |
| `subagent_fork` | base 挂载：`provider: fork`、`backgroundMode: one-shot`；fork 不选模型，让 provider/model 与父级一致、继承历史仍符合 KV Cache 前缀复用条件（注释明说） | `packages/bundle/base/cordis.patch.yml:377`-`388` |
| `workflow` | base 挂载，执行链 `workflow-ptc`（`provider: spawn`）→ `ptc-runtime-node` | `packages/bundle/base/cordis.patch.yml:390`-`398` |
| `ralph` | base 挂载但 **`disabled: true`**（完成是 worker 自报而非独立评估，默认关；overlay 行可恢复，`subagentProvider: spawn`、`maxRounds: 64`） | `packages/bundle/base/cordis.patch.yml:441`-`452` |
| goal 三件套 + `/goal` | base 挂载（`goal`、`goal-round-driver`、`command-goal`、`tool-goal`） | `packages/bundle/base/cordis.patch.yml:313`-`320`、`436` |
| jobs | base 挂载（`jobs-local` 服务 + `tool-jobs` 工具） | `packages/bundle/base/cordis.patch.yml:88`、`275` |
| schedule | 不在 base：experimental optional bundle | `packages/boot/app-boot/src/profile.ts:217` |
| agent-teams / auto-review | 不在 base：experimental optional bundle（`OPTIONAL_BUNDLES` 四成员） | `packages/boot/app-boot/src/profile.ts:213`-`218` |

goal 的状态机与 Round Driver 深挖在 [`../agent-loop/00-map.md`](../agent-loop/00-map.md)；subagent 的 seam 与多后端在 [`../capability-seams/03-subagent后台与产品provider.md`](../capability-seams/03-subagent后台与产品provider.md)；agent-teams 的机制在 [`../experimental/02-agent-teams.md`](../experimental/02-agent-teams.md)。本专题拥有的是**跨原语的统一视角**：阶梯位置、选择决策、组合模式。

## 问题登记

本专题按问题驱动登记，不承诺覆盖未列出的问题。已回答：

| 问题 | 结论页 |
|------|--------|
| 阶梯全景：DSH 有哪些工作编排原语，各在什么位置？ | 本页 |
| 模型写的 workflow 编排脚本在什么进程里跑、能调用什么钩子、失败如何结算？ | [`01-workflow-模型编写的JS编排脚本与子代理扇出机制.md`](./01-workflow-模型编写的JS编排脚本与子代理扇出机制.md) |
| 官方对「什么时候用哪个原语」给了什么明文语义？原语之间怎么互相路由？ | [`02-什么时候用哪个原语-官方选择决策语义全景.md`](./02-什么时候用哪个原语-官方选择决策语义全景.md) |
| subagent / subagent_fork：委派隔离了什么、fork 继承什么、one-shot 与 continuable 差在哪、控制面边界规则？ | [`03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md`](./03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md) |
| ralph：轮间到底传什么、固定脚本锁死什么、四种终局怎么结算、为什么长任务分裂成 goal 与 ralph 两策略？ | [`04-ralph-fresh-agent循环的轮间传递与固定脚本机制.md`](./04-ralph-fresh-agent循环的轮间传递与固定脚本机制.md) |
| goal 的驾驶座用法：objective 怎么写、轮预算怎么定、终结纪律、`/goal` 命令面、resume 与 disarmed 语义？ | [`05-goal-驾驶座用法-objective写法轮预算与终结纪律.md`](./05-goal-驾驶座用法-objective写法轮预算与终结纪律.md) |
| jobs / schedule：后台作业平台的保证（id/owner/first-wins/通知经济学）、后台 producer、六选择器时序与交付形态？ | [`06-jobs与schedule-后台作业平台与定时跟进的时间平面.md`](./06-jobs与schedule-后台作业平台与定时跟进的时间平面.md) |
| agent-teams 的驾驶座用法：启用代价（组合互斥表）、Lead 工作流、子 Agent 递归边界、质量复核与重派纪律、POLICY 协作纪律、数字上限？ | [`07-agent-teams-驾驶座用法-启用代价Lead工作流与协作纪律.md`](./07-agent-teams-驾驶座用法-启用代价Lead工作流与协作纪律.md) |
| 组合模式：归属链、深度预算、四条通知通道、五个协同形态与跨模式收尾纪律？ | [`08-组合模式-归属链深度预算通知通道与收尾纪律.md`](./08-组合模式-归属链深度预算通知通道与收尾纪律.md) |
| 对照外部叙事：Captain 规划器、Kahn 调度、`dsh rollback --task`、KV Cache 看板，逐条的源码真相？ | [`09-对照外部叙事-Captain与Kahn调度与rollback与KV看板的逐条源码真相.md`](./09-对照外部叙事-Captain与Kahn调度与rollback与KV看板的逐条源码真相.md) |
| 接受、模型可见、静止、资源处置与业务完成有什么不同？跨日志崩溃会怎样？ | [`10-完成语义与崩溃窗口-接受可见静止处置.md`](./10-完成语义与崩溃窗口-接受可见静止处置.md) |
| Session 谱系、Agent incarnation、Activation epoch 与冷恢复如何区分？ | [`12-Session谱系与Agent实例-持久边与活体权限.md`](./12-Session谱系与Agent实例-持久边与活体权限.md) |
| 哪些是持久事实、派生 projection，哪些只是内存 authority？ | [`13-持久事实派生投影与内存权限-状态三分法.md`](./13-持久事实派生投影与内存权限-状态三分法.md) |
| 深度、并发、总量、owner 容量和 Teams 上限如何叠加？ | [`14-资源预算与公平性-深度并发总量与容量边界.md`](./14-资源预算与公平性-深度并发总量与容量边界.md) |
| workflow 每次运行结果为何不可复现，取消与观察记录能保证什么？ | [`15-workflow可复现性与生命周期-动态结果取消和观察记录.md`](./15-workflow可复现性与生命周期-动态结果取消和观察记录.md) |
| todo_write 与 plan mode 的轻量计划面？ | 分布覆盖，无独立页：选择边界与互斥句见 [`02`](./02-什么时候用哪个原语-官方选择决策语义全景.md)（todo 的 "skip it for trivial single-step tasks"、plan 模式内不用 todo_write）；plan → todo 的顺序纪律见 [`08`](./08-组合模式-归属链深度预算通知通道与收尾纪律.md) 收尾纪律清单；阶梯位置与默认挂载见本页两表 |
| 图计算的本质：编排里真实的图有哪些，引擎对图做什么、拒绝什么，为什么？ | [`11-图计算的本质-不变量推导与执行的三件分置.md`](./11-图计算的本质-不变量推导与执行的三件分置.md) |
| Agent 视角的统一重述：in-process Agent 路径如何构造上下文、驱动执行并回传结果？ | 同 [`11`](./11-图计算的本质-不变量推导与执行的三件分置.md) 的「Agent 是原子」节 |

## 问题登记与复核状态

以下登记项均已完成当前源码与测试交叉核验；删除线表示对应结论页已建立。若产品源码继续变化，按专题 HEAD 声明重新复核：

- ~~Session lineage 与 Agent incarnation：冷恢复、owner disposal 和 ancestry 授权的差异。~~ 已单独立页见 [`12`](./12-Session谱系与Agent实例-持久边与活体权限.md)。
- ~~资源预算与公平性：depth、Activation pool、workflow FIFO 和 job owner 容量怎样共同约束工作。~~ 已单独立页见 [`14`](./14-资源预算与公平性-深度并发总量与容量边界.md)。
- ~~持久事实、派生投影和内存权限：todo/plan/goal/jobs 各自恢复哪些状态。~~ 已单独立页见 [`13`](./13-持久事实派生投影与内存权限-状态三分法.md)。
- ~~动态 workflow 的可复现性：模型结果、未 await 的调用、启动/取消竞态及最终输出之间的关系。~~ 已单独立页见 [`15`](./15-workflow可复现性与生命周期-动态结果取消和观察记录.md)。

当前问题登记均有对应结论页；若后续同步到新的产品 commit，按 [`../_coverage/00-index.md`](../_coverage/00-index.md) 的流程定位受影响行，并更新本页的复核 HEAD。

## 阅读路径

先读本页建立阶梯全景，再按十五个专题入口深入：想知道「这个任务该用哪个原语」直接进 [`02`](./02-什么时候用哪个原语-官方选择决策语义全景.md)；想理解最重的那级原语（workflow）的完整机制进 [`01`](./01-workflow-模型编写的JS编排脚本与子代理扇出机制.md)；想知道委派到底隔离/继承了什么、continuable 子代理怎么续怎么停进 [`03`](./03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md)；想知道 ralph 轮间传什么、为什么长任务分成两种策略进 [`04`](./04-ralph-fresh-agent循环的轮间传递与固定脚本机制.md)；想知道 goal 怎么用好（objective 写法、预算、终结纪律）进 [`05`](./05-goal-驾驶座用法-objective写法轮预算与终结纪律.md)；想知道后台作业平台的保证、完成通知何时打断你、定时提醒怎么交付进 [`06`](./06-jobs与schedule-后台作业平台与定时跟进的时间平面.md)；想知道 agent-teams 启用要付出什么组合代价、Lead 怎么带队进 [`07`](./07-agent-teams-驾驶座用法-启用代价Lead工作流与协作纪律.md)；想知道怎么把原语叠起来用（归属链/深度预算/通知通道/收尾纪律）进 [`08`](./08-组合模式-归属链深度预算通知通道与收尾纪律.md)；想核对流传的外部叙事（Captain/Kahn/rollback/KV 看板）进 [`09`](./09-对照外部叙事-Captain与Kahn调度与rollback与KV看板的逐条源码真相.md)；想分清「接受 / 模型可见 / 静止 / 资源处置 / 业务完成」五个时刻与跨日志崩溃窗口进 [`10`](./10-完成语义与崩溃窗口-接受可见静止处置.md)；想理解编排背后的本质——图的不变量、准入与派发分置——进 [`11`](./11-图计算的本质-不变量推导与执行的三件分置.md)；想把 Session 谱系、Agent 实例与 Activation epoch 分清进 [`12`](./12-Session谱系与Agent实例-持久边与活体权限.md)；想区分持久事实、派生 projection 与内存 authority 进 [`13`](./13-持久事实派生投影与内存权限-状态三分法.md)；想核对深度、并发、总量、owner 容量与 Teams 上限进 [`14`](./14-资源预算与公平性-深度并发总量与容量边界.md)；想知道 workflow 为什么无法逐次复现、取消与观察记录分别保证什么进 [`15`](./15-workflow可复现性与生命周期-动态结果取消和观察记录.md)。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/todo/tool-todo/` | `todo_write` 工具：上下文内计划留痕 |
| `packages/plan/plan-mode/` | 计划模式：方案先行、批准后执行 |
| `packages/subagent/tool-subagent/` | `subagent` / `subagent_fork` 两个模型可见工具 |
| `packages/subagent/subagent-in-process-driver/` 等 | 委派的多后端（进程内 / ACP / Claude Code / Codex / SDK），见 capability-seams 专题 |
| `packages/workflow/workflow/` | 编排引擎：脚本钩子、schema 校验、失败结算 |
| `packages/workflow/tool-workflow/` | `workflow` 模型工具与 Config（`toolName`、`maxResultChars`） |
| `packages/workflow/workflow-ptc/` | PTC 执行 provider：fresh Node 进程 + 沙箱策略 |
| `packages/workflow/tool-ralph/` | `ralph` 工具：fresh-agent 循环 |
| `packages/goal/tool-goal/` | `create_goal` / `update_goal` / `get_goal` |
| `packages/goal/goal-round-driver/` | idle 自动续轮（深挖见 agent-loop 专题） |
| `packages/jobs/tool-jobs/` | 后台 job 的模型可见面 |
| `packages/jobs/jobs-local/` | process-local job registry：owner capacity、ring 与 cursor（不跨重启） |
| `packages/terminal/tool-terminal/` | terminal 后台 producer：`pty-send` |
| `packages/schedule/schedule/` | Host 时间任务与 Session follow-up |
| `packages/experimental/tool-agent-team/` | Agent Teams 模型可见工具 |
| `packages/experimental/agent-team/` | Agent Teams 服务、任务图与 mailbox |
| `packages/experimental/agent-team-profile/` | Agent Teams 组合层 |
| `packages/experimental/ui-agent-team/` | Agent Teams 客户端投影与 UI |
| `packages/bundle/base/cordis.patch.yml` | 阶梯默认挂在哪些 bundle 里 |

## 可审查性清单

审查本专题或同步到新的产品 commit 时，每个结论页至少应能回答四件事：

1. **事实在哪里实现？** 页面末尾的源码入口必须指向当前产品树中的文件和行号；总览页只维护跨页比较轴，不替代机制页的证据。
2. **失败如何暴露？** 检查拒绝、fatal、局部 `null`、`inactive`、`settled`、projection failure 和 provider 差异不能被统一写成“失败”或“完成”。
3. **谁推进下一步？** 区分脚本控制流、Lead/模型对话、Goal Round Driver、Host 时间、JobRegistry 和任务板准入；`ready`、通知或 task `completed` 不自动等于派发或业务完成。
4. **如何验证结果？** 对代码或文档任务，验收条件应指向可执行的测试、构建、引用扫描、diff 检查或人工复核；Agent 自报和任务状态只证明报告或状态提交。

同步流程：先读取产品源码 HEAD（不是文档 commit），再运行 `node _digested/ref-sweep.mjs _digested/orchestration-ladder`，检查 SVG XML 和 `node _digested/verify.mjs`，最后复读受影响页面的矩阵、源码入口、失败边界和导航。
