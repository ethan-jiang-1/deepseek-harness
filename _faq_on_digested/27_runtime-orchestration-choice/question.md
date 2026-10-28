# FAQ 27 · Agent 跑到一半，workflow 还是 Agent Team？

## 问题

一个 agent 正在跑，手上有一批活：四十个文件要审、一个迁移要铺开、一个目标要做三天、两个人要在同一个 checkout 里持续改。它可以自己做，可以派一个 subagent，可以写一段 workflow 脚本扇出，可以开一个跨轮 goal，也可以把工作交给一个持续在线的 Agent Team。

这些选项在工具面板上是并列的，但它们换掉的东西完全不同：谁持循环、谁记得、崩溃之后还剩什么、装了什么就再也看不见什么。DSH 没有中心调度器，也没有一份「编排选择指南」；选择知识散落在每个工具的 description 和它自带的 prompt 段里。真实发生的是：模型在运行时读着自己看得见的那点文本，做一个会影响后续几十轮的决定。

本 FAQ 回答的不是「DSH 有哪些编排能力」——那是 [`_digested/orchestration-ladder/`](../../_digested/orchestration-ladder/00-map.md) 的活——而是三个更窄的问题：**站在这些岔口上，判断依据是什么？每种选择的代价差在哪？选错了怎么看出来、怎么换？**

## 为什么这个问题不好答

- **同名不同物。** `agent-team` 听起来像「多代理 DAG 编排」，实际是共享任务板加具名队友；`workflow` 听起来像工作流引擎，实际是模型写的一段 JavaScript。按名字类比外部框架，第一步就会错。
- **能力重叠。** `subagent`、`workflow`、`ralph` 都能「把活分出去」；`jobs` 和后台 workflow 都能异步；`goal` 和 `schedule` 都能跨轮。只看能力，它们互为替代；看代价，它们几乎不重叠。
- **没有一处能查全。** 官方边界句分散在四五个工具描述里，且互相引用（workflow 说「一两个委派用 subagent」，ralph 说「普通长跑用 goal」）。读完单个工具，只知道它自己的适用范围。

## 回答目标

读完本 FAQ，应当能够：

1. 说清五个岔口分别在哪、各自的触发信号是什么。
2. 用三把尺子（循环归谁、承诺多深、选择住在哪）解释任意两个原语为什么不能互换。
3. 面对一个具体任务，先看用户有没有点名、这件事是不是模型工作，再按 00 的四问评估候选，并用路由表找到对应的岔口，说出它的代价。
4. 认出选错的典型症状，并知道往哪迁移、迁移时丢什么。
5. 解释 DSH 为什么把编排做成「原语 + 运行时判断」，而不是中心 DAG 调度器。

## 范围与基线

产品源码基线：`dsh-v0.2.1-rc.3`（上游 `1f81c047`；本仓同步提交 `9bc70c57`）；本篇写作 checkout `cd9ce0ec`，产品树未变，行号以当前树为准。[`reference.md`](./reference.md) 登记每条结论的出处与核验状态。

本 FAQ 不覆盖：怎么实现一个新原语、外部框架（LangGraph、CrewAI 等）的用法、以及 webhook 触发这条线。它也不声称存在一套「官方最佳实践」——DSH 给的是边界句，边界之间的空白由模型判断。

## 与既有材料的分工

| 材料 | 它回答什么 | 本篇不重复 |
|---|---|---|
| [digest 02](../../_digested/orchestration-ladder/02-什么时候用哪个原语-官方选择决策语义全景.md) | 官方**明文**说了什么（逐字引用） | 只引决定性的四句 |
| [digest 01](../../_digested/orchestration-ladder/01-workflow-模型编写的JS编排脚本与子代理扇出机制.md)、[03](../../_digested/orchestration-ladder/03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md)、[07](../../_digested/orchestration-ladder/07-agent-teams-驾驶座用法-启用代价Lead工作流与协作纪律.md) | 每个原语的机制细节 | 不重讲 PTC、邮箱、CAS、driver |
| [digest 09](../../_digested/orchestration-ladder/09-对照外部叙事-Captain与Kahn调度与rollback与KV看板的逐条源码真相.md)、[11](../../_digested/orchestration-ladder/11-图计算的本质-不变量推导与执行的三件分置.md) | 外部叙事核对、图论本质 | 只做差异对照 |
| [digest 00](../../_digested/orchestration-ladder/00-map.md) | 原语阶梯全景 | 不重画阶梯 |

本篇拥有的是**运行时决策**这一层：信号、判据、代价、症状、迁移。

## 文件

从 [`answer.md`](./answer.md) 进入；它有一页图、一分钟版和岔口路由表。按场景查直接跳对应的 `01`–`05`；诊断看 [`06`](./06-diagnosis-and-migration.md)；元层讨论看 [`07`](./07-why-this-shape.md)；所有出处见 [`reference.md`](./reference.md)。
