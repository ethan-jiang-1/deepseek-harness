# Delegation Primitives · 原语机制

## 一句话

本组回答：**每一级原语是什么、保证什么、隔离什么、谁推进、怎么结算。** 它不回答「什么时候用哪个」（见 [`../primitive-selection/00-map.md`](../primitive-selection/00-map.md)），也不回答「怎么在你的组合上收窄能力、放合同、做观测」（见 [`../preset-composition-and-contract-placement/00-map.md`](../preset-composition-and-contract-placement/00-map.md)、[`../completion-and-observation/00-map.md`](../completion-and-observation/00-map.md)）。

## 三类对象，不是一类

把阶梯上的原语都当「Agent 编排」是常见误读。按**执行者**分三类：

| 类别 | 执行者 | 主要持久事实 | 记忆来源 | 派发/推进者 | 完成证据 |
|------|--------|--------------|----------|--------------|----------|
| Agent 编排 | in-process Agent、PTC 脚本或外部 provider | Session、子代理目录、goal/team 记录（按原语不同） | 对话历史、workspace、结构化 handoff 或任务板 | loop、workflow 控制流、Lead 或 goal driver | turn/子代理结果、结构化报告、任务状态或模型自报 |
| 进程作业 | bash、pwsh、terminal 等进程 | job 状态与有界输出 ring | 进程输出与 producer 资源 | producer 与 JobRegistry | `completed`/`killed`/`failed` 终态；不等于模型已读 |
| 计划与账本 | 当前 Agent、Host scheduler 或 registry | todo/plan/schedule/job 记录与投影 | Session 日志、Host 存储或内存 registry | 人类审批、Host 时间、通知控制面 | 提交、审批、到期投递或账本终态；不等于业务完成 |

三类的共同点只有归属、权限、持久化与通知这些基础设施；**执行者和完成证据不同**，不能互相折算。更深的图模型、in-process Agent 的统一重述，以及各类原语的限制见 [`../design-perspectives/01`](../design-perspectives/01-graph-computation-essence-invariant-derivation-and-execution.md)。

## 页面

| 页 | 原语 | 一句话 |
|---|---|---|
| [`01`](./01-scripted-workflow-and-sandboxed-fan-out.md) | `workflow` | 模型写的 JS 脚本在沙箱 PTC 进程里跑，`agent()` 是图的叶子；失败分级与 caps 决定一次 run 能扇多宽 |
| [`02`](./02-bounded-delegation-with-fresh-and-forked-subagents.md) | `subagent` / `subagent_fork` | 有界委派：fresh 从零开始、fork 继承已完成轮前缀；权限在第一个 await 前捕获 |
| [`03`](./03-fresh-agent-iteration-loop-and-round-handoff.md) | `ralph` | 不可变目标的 fresh-agent 前台循环；轮间只传有界五字段报告，完成是 worker 自报 |
| [`04`](./04-cross-round-goals-and-the-round-driver.md) | `goal` | 跨轮次长目标 + idle 自动续跑；objective 写法、轮预算与终结纪律 |
| [`05`](./05-background-jobs-and-wall-clock-schedules.md) | `jobs` / `schedule` | 后台作业平台（id/owner/first-wins/通知）与 wall-clock 提醒（到期进原会话，不是推送） |
| [`06`](./06-persistent-teams-with-a-shared-task-board.md) | `agent-teams` | Lead + 具名队友 + 任务板 + 邮箱；启用代价是全局 subagent 控制面被 shadow |
| [`07`](./07-shipped-mount-state.md) | shipped 组合 | 每一级原语在 base / optional / on-demand 里的默认开关与出处 |

## 入口问题

| 想知道 | 进入 |
|---|---|
| workflow 脚本在什么进程里跑、能调用什么、失败怎么结算 | [`01`](./01-scripted-workflow-and-sandboxed-fan-out.md) |
| 子代理隔离了什么、fork 继承什么、one-shot 与 continuable 差在哪 | [`02`](./02-bounded-delegation-with-fresh-and-forked-subagents.md) |
| ralph 每轮传什么、为什么长任务分成 goal 与 ralph 两种策略 | [`03`](./03-fresh-agent-iteration-loop-and-round-handoff.md) |
| goal 的 objective 怎么写、轮预算怎么定、什么时候算 blocked | [`04`](./04-cross-round-goals-and-the-round-driver.md) |
| 后台 job 的 id/owner/通知语义、schedule 到期后发生什么 | [`05`](./05-background-jobs-and-wall-clock-schedules.md) |
| Agent Teams 怎么进入/退出、为什么 `subagent` 工具会消失 | [`06`](./06-persistent-teams-with-a-shared-task-board.md) |

## 与其他组的关系

- 选择和路由：[`../primitive-selection/`](../primitive-selection/00-map.md)。
- 能力面与合同：[`../preset-composition-and-contract-placement/`](../preset-composition-and-contract-placement/00-map.md)。
- 终态、谱系与观测：[`../completion-and-observation/`](../completion-and-observation/00-map.md)。
- goal 状态机深挖：[`../../agent-loop/`](../../agent-loop/00-map.md)；Teams 服务机制：[`../../experimental/02-agent-teams.md`](../../experimental/02-agent-teams.md)。
