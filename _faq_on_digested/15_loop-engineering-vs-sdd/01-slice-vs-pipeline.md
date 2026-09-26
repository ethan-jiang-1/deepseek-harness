# 01 · 切片层 vs 管线层：DSH 和 SDD 卖的是两层不同的「把控」

## 结论先行

owner 的体感「结果还行，但把控力不够」对上的是**分层错位**：DSH 把把控力做满了**切片层**（每一笔交付的最小证据、机械门禁、整 PR 回滚），把**管线层**（队列、次序、在途状态、提案状态板、逐 feature 验证汇总）**刻意留白**；OpenSpec / Spec Kit 把管线层当第一公民（spec → plan → tasks 的产物链 + 每阶段人工审批门），切片层的证据薄。两边的「把控」不是同一种东西，所以对照起来就是「OpenSpec 非常清楚、DSH 看不太清但结果还行」。另一句体感——「这就是 loop engineering」——官方没有说过，见第一节。

## 第一节 「loop engineering」是体感用词，不是官方流程名

官方文档、插件作者指南和本目录既有 FAQ 都没有把插件开发流程命名为 loop engineering，也没有主张它是这种流程。owner 口述里的这个词，是语音转写把「logo engineering」按语境改成的体感标签：入口是一个粗目标，后面在循环，没有 OpenSpec / Spec Kit 那种「每个阶段一份产物、人审完才继续」。

这个感觉对得上两件可以单独核对的事，对不上一个官方身份：

- **对得上的制度事实**在第二节、第三节：有阶段地图，没有阶段门；切片层门禁是满的，管线层是空的。
- **对得上的运行时事实**在 [04 篇](./04-owner-control-gap.md)：人不再逐条发话之后，goal 续轮仍会往前跑。口述里的「时不时提醒他计划计划」是人还在当下一句 prompt 的作者。
- **对不上的身份**：把上面两件事叫成「官方的 loop engineering」。官方写的是机制、Note、门禁和会话级 goal，没有这门方法的名字。

2026 年的公开定义用了同一个词，指的操作比这份体感多一层。出处放在 [research.md](./research.md) D 路；这里只留分界：

- LangChain，Sydney Runkle，2026-06-16：loop engineering 是叠在 harness 上的多环——模型调工具直到做完、验证失败打回、事件或定时再跑、用运行轨迹改 harness。
- Addy Osmani，2026-08-14：loop 是 agent 反复行动、自测、调整，直到一个写清的目标达成。他转述的分层是：人每一轮自己写下一句，叫 agentic loop；`/goal` 把完成条件交给评估器打回；`/loop` 按间隔重跑。停止条件含糊，或把品味一起交出去，这套做法会出问题。他把 Huntley 的 Ralph bash loop 写成这些原语出现之前的手写形态。

所以体感「有点像 loop」可以保留。把它写成官方流程的名字，多写了官方没说的话。把它写成已经是上述公开实践，又少了他们要求的两样：人能核的停止条件，以及决定下一件工作的外层系统。DSH 的 goal 续轮靠近内层原语；owner 四仓后补的 ROADMAP 才靠近外层。FAQ 11 的窄证据切片闭环是每一笔交付内部的执行环，同样不是这个公开术语。相邻的旧名字（vibe coding、Ralph、harness engineering、Natural Language Development）各自指哪一层，见 [02 篇](./02-external-trend-verdict.md)。

## 第二节 DSH 有「阶段地图」，没有「阶段门」

FAQ 13 的 [dev-loop](../13_expert-plugin-repo-organization/dev-loop.md) 画过第 0–7 阶段（准备/意图/决策/设计/落地/调试/调整/收尾），但它描述的是**每一步有什么现成载体可用**，不是**每一步必须停车等人审批**。上游真正强制的只有两个**交付时锚**：非 Draft 人类 PR 进 review 后必须引用 Issue（`.github/issue-management/policy.mjs`）、非平凡变更同 diff 带 Agent Note（`.agents/notes/README.md:46`）。Plan Mode 是「用户选择的审阅边界」——「guides rather than restricts: every tool stays available」（[packages/plan/README.md](../../packages/plan/README.md)），批准前不动文件是行为约定而非机制强制。

对照 SDD 工具的「门」：Spec Kit 官方要求「Invoke each /speckit-* skill **one at a time, and review the result before continuing**」（specify→plan→tasks→implement 每阶段人审）；OpenSpec 的核心卖点「Your AI writes these; **you review the plan before any code is written**」。门的密度与位置，是两家 SDD 工具与 DSH 最硬的差别。

## 第三节 两层模型：把控力缺口的精确定位

| | 切片层（每笔交付） | 管线层（多 feature / 长周期） |
|---|---|---|
| 上游 DSH | **制度完备**：最小匹配证据、quality gates、Note 同 diff、整 PR 回滚、`dsh-pre-push-checks` | **刻意留白**：见下 |
| OpenSpec / Spec Kit | 薄（验收 checklist 由 AI 解释，Böckeler：「no 100% guarantee that they will be respected」） | **第一公民**：spec/plan/tasks/changes 产物链 + 每阶段人审门 + 队列可见 |
| owner 体感 | 「结果还行」——切片层门禁是真的 | 「把控力不够」——管线层看不见 |

上游留白是**自觉的设计**，不是漏做，证据有四条：

1. 根目录无任何 roadmap/队列文件（ls 实证）；docs/AGENTS.md 把 implementation-status 注记列为腐化（「Status rots」）。
2. `.agents/notes/README.md:19`：「The active lifecycle tree is the working inventory… **Do not add a centralized `INDEX.md`**」——集中视图被门禁禁止。
3. `.agents/notes/README.md:121`：生命周期搬移（proposed→implemented/rejected）是同 diff 机械改写——状态变化只活在 git 里，对不翻 git 的人**不显影**。这正是 owner「不知道他是像看板一样挪来挪去的，还是干啥的」的制度根源。
4. 运行时反馈面都是**会话级**的：`todo_write` 清单「belongs to the agent session that created it」（[packages/todo/README.md](../../packages/todo/README.md)）；goal「Each session has only one current goal」（[packages/goal/README.md](../../packages/goal/README.md)）。跨会话、跨 feature 没有任何 harness 级的管线视图。

owner 的五个体感缺口（B 路编码：队列与次序 / 在途状态 / proposal 状态语义 / 逐 feature 验证汇总 / goal 内容不可见）**全部落在管线层**；而他在切片层拿到的东西（验收：verify 31/31、tsc 0 error、整 PR 回滚）恰恰是 SDD 用户抱怨缺的（yoaviram：「Most tests were failing… it declares the sprint as done even though tests still fail」）。两边各缺一层，互为镜像。

## 第四节 这个留白把成本推给了谁

管线层留白不是免费的：它把「接下来做什么、做到哪了」从**外部产物**（tasks.md、changes/ 目录）搬回了**人的工作记忆与对话催促**。owner 的应对是口述复盘里的两条——时不时提醒「我们要计划计划」、要求「显性化到 notes/proposal 里头」——都是在用对话税手工补一层 DSH 刻意不维护的东西。这不是 owner 不会用工具，而是该设计下的必然体验；FAQ 11 第八节说「六步闭环是执行者的回路，指挥者的回路在它外面」，本篇补一句：**指挥者回路的进度盘，上游没有造，实践者要么自造（见 [04 篇](./04-owner-control-gap.md)：owner 四个 repo 的队列层演化），要么去买 SDD 工具的整层（带上一堆自己未必想要的门）。**

## 最接近的一句话

**DSH 的把控力在切片层是满的、在管线层是空的，而且空得是故意的；SDD 工具反过来。owner 用 OpenSpec 时的「非常清楚」买的是管线层，跟 DSH 打交道的「看不太清但结果还行」用的是切片层——两个体感都真实，加起来才是一幅完整地图。**
