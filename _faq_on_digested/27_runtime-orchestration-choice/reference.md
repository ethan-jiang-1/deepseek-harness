# 出处与核验

产品源码基线：`dsh-v0.2.1-rc.3`（上游 `1f81c047`；本仓同步提交 `9bc70c57`）；写作 checkout `cd9ce0ec`。下表行号按当前树核对，`✅` 表示逐条对过源码或包 README，`📄` 表示引自文档/子系统页。

## 00 · 三把尺子

| 结论 | 出处 | 状态 |
|---|---|---|
| workflow 的 child 由脚本持有循环、没有消息通道 | [`workflow-ptc/README.md`](../../packages/workflow/workflow-ptc/README.md) 的 Results and failures 节；钩子集见 [`runtime.ts`](../../packages/workflow/workflow-ptc/src/runtime.ts) 的 globals | ✅ |
| Team 的隐式 Lead、`TeamId` = 根 `SessionId` | [`packages/experimental/agent-team/README.md`](../../packages/experimental/agent-team/README.md) 的 Team identity 节 | ✅ |
| goal 由 Goal Round Driver 在 idle 后推进 | [`packages/goal/goal-round-driver/README.md`](../../packages/goal/goal-round-driver/README.md) | 📄 |
| Team bundle 会 disable 委派与全局控制工具 | [`cordis.patch.yml:3-14`](../../packages/experimental/agent-team-profile/cordis.patch.yml) | ✅ |
| workflow 容量：1000 / 4096 / 并发 `min(16, CPU−2)` | [`workflow-ptc/src/index.ts:108-110`](../../packages/workflow/workflow-ptc/src/index.ts) 与 `:142-144` | ✅ |
| Team 上限：16 成员 / 256 任务 | [`agent-team/src/index.ts:42-43`](../../packages/experimental/agent-team/src/index.ts) | ✅ |
| 策略随工具插件走（master convention） | [`tool-workflow/src/index.ts:329`](../../packages/workflow/tool-workflow/src/index.ts) 的 prompt 段与其上方注释 | ✅ |
| workflow / ralph 把「用户显式要求」写成第一条件 | [`tool-workflow/src/index.ts:329`](../../packages/workflow/tool-workflow/src/index.ts)、[`tool-ralph/src/index.ts:178`](../../packages/experimental/tool-ralph/src/index.ts) | ✅ |

## 01 · 要不要交出去

| 结论 | 出处 | 状态 |
|---|---|---|
| subagent 的「自包含、不共享上下文、只回结果」定义 | [`tool-subagent/src/index.ts:129`](../../packages/subagent/tool-subagent/src/index.ts) | ✅ |
| fork 继承已完成轮次、看不到进行中的轮 | [`tool-subagent/src/index.ts:117`](../../packages/subagent/tool-subagent/src/index.ts) | ✅ |
| 委派调用立即返回 child id、不等待结果 | [`packages/subagent/tool-subagent/README.md`](../../packages/subagent/tool-subagent/README.md) | ✅ |
| 默认委派深度 1 | [`subagent/src/index.ts:196`](../../packages/subagent/subagent/src/index.ts) | ✅ |
| 「一两个委派用 subagent」 | [`tool-workflow/src/index.ts:329`](../../packages/workflow/tool-workflow/src/index.ts) | ✅ |
| child 可选独立 preset / 模型（provider 支持时） | [`tool-subagent/README.md`](../../packages/subagent/tool-subagent/README.md) 的 Selecting a child preset 与 Selecting a child LLM 节 | ✅ |

## 02 · 一把还是一批

| 结论 | 出处 | 状态 |
|---|---|---|
| workflow 的适用面与「大规模」限定 | [`tool-workflow/src/index.ts:158`](../../packages/workflow/tool-workflow/src/index.ts) | ✅ |
| 三个形状（parallel / pipeline / 手写循环）的语义与失败粒度 | [`workflow-ptc/src/runtime.ts`](../../packages/workflow/workflow-ptc/src/runtime.ts) 的 `parallel` / `pipeline` | ✅ |
| `maxItemsPerCall` 4096、`maxTotalAgents` 1000、并发 0 解析为 `min(16, CPU−2)` | [`workflow-ptc/src/index.ts:108-110`](../../packages/workflow/workflow-ptc/src/index.ts) 与 `:142-144` | ✅ |
| 无整体 elapsed deadline | [`workflow-ptc/README.md`](../../packages/workflow/workflow-ptc/README.md) 的 File policy and cancellation 节 | ✅ |
| 无 journal / 无嵌套 / 无保存的 workflow 定义 | [`workflow/README.md:127-128`](../../packages/workflow/workflow/README.md) | ✅ |
| 父模型只拿最终值、child 无完成通知 | [`tool-workflow/README.md`](../../packages/workflow/tool-workflow/README.md) 的 What to expect during a run 与 Durable session records 节 | ✅ |

## 03 · 跨轮与 fresh

| 结论 | 出处 | 状态 |
|---|---|---|
| goal 的适用范围（含「用户没说 goal」） | [`tool-goal/src/index.ts:53`](../../packages/goal/tool-goal/src/index.ts) | ✅ |
| blocked 需连续 3 轮同一阻塞条件 | [`tool-goal/src/index.ts:39`](../../packages/goal/tool-goal/src/index.ts) 与 `:120-121` | ✅ |
| ralph 仅人类显式要求 | [`tool-ralph/src/index.ts:178`](../../packages/experimental/tool-ralph/src/index.ts) | ✅ |
| ralph 的完成是 worker 自报 | [`tool-ralph/src/index.ts:408`](../../packages/experimental/tool-ralph/src/index.ts) | ✅ |
| ralph 轮上限默认 256、bundle 钉 64 | [`tool-ralph/src/index.ts:35`](../../packages/experimental/tool-ralph/src/index.ts)、[`ralph-bundle/cordis.patch.yml`](../../packages/experimental/ralph-bundle/cordis.patch.yml) | ✅ |
| resume / fork 后 active goal 被 disarm，需显式 resume | [`tool-goal/src/index.ts:117-119`](../../packages/goal/tool-goal/src/index.ts) | ✅ |

## 04 · 持续协作

| 结论 | 出处 | 状态 |
|---|---|---|
| readiness 不启动 owner、Lead 必须等齐 | [`tool-agent-team/src/index.ts:41`](../../packages/experimental/tool-agent-team/src/index.ts) 的 POLICY | ✅ |
| 任意成员可给任意成员发消息 | [`agent-team/README.md`](../../packages/experimental/agent-team/README.md) 的 Messages between teammates 节 | ✅ |
| 任务板 CAS、DAG 写时校验、就绪读时推导 | [`task-board.ts`](../../packages/experimental/agent-team/src/task-board.ts)、[`task-graph.ts`](../../packages/experimental/agent-team/src/task-graph.ts)、[`task-view.ts`](../../packages/experimental/agent-team/src/task-view.ts) | ✅ |
| `writeScopes` 只是告警 | [`agent-team/README.md`](../../packages/experimental/agent-team/README.md) 的 Shared task board 节 | ✅ |
| `wait_agent` 只观察不唤醒 | [`tool-agent-team/src/index.ts:41`](../../packages/experimental/tool-agent-team/src/index.ts) 的 POLICY | ✅ |
| Team 需要 durable session storage | [`agent-team/README.md`](../../packages/experimental/agent-team/README.md) 的 Summary | ✅ |
| Team 与 workflow 可共存、与 subagent 互斥 | [`cordis.patch.yml:3-14`](../../packages/experimental/agent-team-profile/cordis.patch.yml) 与 bundle README | ✅ |

## 05 · 谁在等

| 结论 | 出处 | 状态 |
|---|---|---|
| 禁止 busy-poll / sleep，收尾要收 job | [`tool-jobs/src/index.ts:254`](../../packages/jobs/tool-jobs/src/index.ts) | ✅ |
| jobs 属于启动它的 agent | [`packages/jobs/README.md`](../../packages/jobs/README.md) 的 Summary | ✅ |
| `jobs` 是后台作业的观察/控制面，producer 是 bash / pwsh / workflow | [`packages/jobs/README.md`](../../packages/jobs/README.md)、[`tool-jobs/README.md`](../../packages/jobs/tool-jobs/README.md) | ✅ |
| schedule 只能给一个时间参数 | [`tool-schedule/src/index.ts:185`](../../packages/schedule/tool-schedule/src/index.ts) | ✅ |
| schedule 投递回原会话 | [`docs/subsystems/schedule.md`](../../docs/subsystems/schedule.md) | 📄 |

## 06 · 诊断与迁移

| 结论 | 出处 | 状态 |
|---|---|---|
| 「完成」有多个层次、都不等于正确 | [`tool-ralph/src/index.ts:408`](../../packages/experimental/tool-ralph/src/index.ts)（worker 自报）、[`agent-team/README.md`](../../packages/experimental/agent-team/README.md)（任务 completed）、[`jobs/README.md`](../../packages/jobs/README.md)（job 终态） | ✅ |
| fresh / fork 的记忆边界 | [`docs/subsystems/subagent.md`](../../docs/subsystems/subagent.md) | 📄 |
| 组合层替换后工具面消失 | [`cordis.patch.yml`](../../packages/experimental/agent-team-profile/cordis.patch.yml) | ✅ |

## 07 · 为什么长这样

| 结论 | 出处 | 状态 |
|---|---|---|
| 无中心 DAG executor；外部叙事逐条核对 | [digest 09](../../_digested/orchestration-ladder/09-对照外部叙事-Captain与Kahn调度与rollback与KV看板的逐条源码真相.md) | ✅ |
| 写时校验 + 读时推导 + 对话派发的三件分置 | [digest 11](../../_digested/orchestration-ladder/11-图计算的本质-不变量推导与执行的三件分置.md) | ✅ |
| subagent 工具深度默认 1（workflow 启动 child 时不传该上限）、脚本无嵌套钩子 | [`subagent/src/index.ts:196`](../../packages/subagent/subagent/src/index.ts)、[`workflow/README.md:128`](../../packages/workflow/workflow/README.md)、[`workflow-ptc/src/host.ts:203-218`](../../packages/workflow/workflow-ptc/src/host.ts) | ✅ |
| Team 只有 Lead 能拉人 | [`agent-team/README.md`](../../packages/experimental/agent-team/README.md) 的 Teammates 节 | ✅ |
| 无任务级回滚（CLI 无 `rollback` 子命令） | [digest 09](../../_digested/orchestration-ladder/09-对照外部叙事-Captain与Kahn调度与rollback与KV看板的逐条源码真相.md) 第 6 条 | ✅ |

## 已知漂移

- [digest 07](../../_digested/orchestration-ladder/07-agent-teams-驾驶座用法-启用代价Lead工作流与协作纪律.md) 记录 Team 有 `maxPendingMessagesPerMember: 64`；当前 `Config` 只有 `maxMembers`、`maxTasks`、`maxMessageBytes`、`disposalTimeoutMs` 四项（[`agent-team/src/types.ts:153-162`](../../packages/experimental/agent-team/src/types.ts)）。本篇不引用该字段。
- Team 的成员上限在包默认值（16）与 profile 钉值（8）之间不同，引用时按场景说明。
- workflow 的 child 是否进入父 subagent 目录，[`workflow-ptc/README.md`](../../packages/workflow/workflow-ptc/README.md) 在不同小节表述有张力（Results 节说「不加入父 catalog」，Internals 节说「本地 child 完成后留在父 catalog」）。本篇只用两处一致的部分：**不向父模型发完成通知，结果在脚本内消化**。

## 未在本篇核验

- 外部框架（LangGraph、CrewAI、AutoGen）的具体语义，只作类比，未逐条对照。
- webhook 触发线（`ctx.webhookRuntime`）未纳入。
- 不同模型在相同选择面下的实际选择差异，没有实测数据；本篇只讨论「它看得见什么」，不预测「它会怎么选」。
- 「循环归谁」「承诺」「选择面」是分析框架，不是 DSH 源码概念；本篇不声称产品使用这些词，也不把三者当成官方分类。
- 引用的 digest 页基线为 rc.2（`687f282e`）；本篇用到的每条源码事实都在 rc.3 树上重新核对（见上表），但没有逐页重校 digest 的叙述性结论。
- 图是理解辅助，不是证据；每条事实以正文的 path:line 为准。
