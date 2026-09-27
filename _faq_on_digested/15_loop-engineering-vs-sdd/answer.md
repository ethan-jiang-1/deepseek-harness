# Answer · 执行循环已经出现，取题与判断仍要由人设计

## 结论先行

你的体感有外部参照，不是未经出处核实的自造标签。Addy Osmani 在 2026-06-07 的 [《Loop Engineering》](https://addyosmani.com/blog/loop-engineering/) 用一句话概括：「Loop engineering is replacing yourself as the person who prompts the agent. You design the system that does it instead.」他所说的系统发现工作、分配、检查、记录进度，再决定下一件事。你让 DSH agent 接受目标、持续工作、验证并用文件和门禁留痕，确实接近这个方向；但目前「下一件是什么」「goal 是否仍是我批准的范围」「结果质量是否值得接受」仍常靠你追问和审阅。准确说法是：**执行循环已经形成，跨 feature 的取题、进度与判断还没有被同等清楚地设计出来**，并非「官方流程就是 loop engineering」或「因为不够完整所以不算 loop」。

这也不是 loop 对 SDD 的取代。**Loop 描述工作怎样反复被触发、执行、检查和接续；SDD 描述需求和计划怎样先外置、供人审阅及后来验收。**一份 spec 可以成为 loop 的工作来源与验收依据；循环也可以在实施中反馈并修订 spec。你的 OpenSpec 体验更清楚，首先是因为变更目录和产物让工作与决策可见，不等于所有阶段都受强制人审锁约束。OpenSpec 的 [OPSX 说明](https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/opsx.md)明确允许反复修改产物、没有刚性阶段门；[Spec Kit quickstart](https://github.github.io/spec-kit/quickstart.html)才推荐逐步调用技能、审阅每步结果。详见 [01](./01-slice-vs-pipeline.md) 与 [02](./02-external-trend-verdict.md)。

## 第一节 DSH 真正提供了什么

分三层看，才不会把你在插件仓里建立的流程误认成 DSH 官方规定：

1. **产品运行时给执行能力，不替项目决定需求。** [架构说明](../../docs/architecture.md#turn-flow)描述模型、工具与反馈构成的会话执行；[goal](../../packages/goal/goal/README.md)保存单会话目标，[goal-round-driver](../../packages/goal/goal-round-driver/README.md)在活跃且获准的条件下续轮；[todo](../../packages/todo/README.md)展示会话任务，[plan mode](../../packages/plan/README.md)提供可选的计划审阅。goal 有轮次上限和阻塞/暂停机制，但上限不是「交付质量已被人认可」；这些组件也不自动维护跨 feature、跨仓的优先级与批准历史。
2. **DSH 自己的仓库把每笔变更做成可复核的交付。** 根 [AGENTS.md](../../AGENTS.md)要求按改动选择测试、文档与快照，重大决定以 [Agent Note](../../.agents/notes/README.md)保存取舍；[测试政策](../../docs/testing.md#verify-the-world-not-the-self-report)要求核对外部结果，而非信 agent 的「已经做好」。这是一套强的*单笔交付纪律*，不是按阶段审批的通用项目管理器，更不是对所有插件仓生效的继承规则。
3. **插件作者文档讲如何构建与挂载能力。** [入门](../../docs/user/develop/basic/index.md)教插件、依赖与装载，[设计指南](../../docs/user/develop/practice/index.md)讲能力的三个角色；它们没有规定插件作者必须复制 DSH 仓库的 Note、Issue 或 ROADMAP 工作流。你的独立仓选择队列、立卡和门禁，是基于这些能力与纪律的**本仓适配**。上游不维护 Agent Note 的集中 `INDEX.md`，并不禁止你的插件仓为跨 feature 工作建立自己的队列。

所以让 agent「遵循 DSH 开发流程」会留下歧义：究竟指产品能力、DSH 仓内贡献纪律，还是你自己定的插件仓规则？把三者的来源写清，agent 才不会一面照抄不适用的仪式，一面遗漏你真正需要的工作选择和审阅点。[FAQ 11](../11_native-development-loop/answer.md)的「窄证据切片闭环」是对 DSH 仓内习惯的分析名称，不是官方对外发布的 loop engineering 章程。

## 第二节 为什么会感觉「跑得动，却看不清」

你描述的不是笼统的「需要更多计划」，而是两个不同尺度的工作被放在一起了。单笔交付内，agent 可以读代码、改动、测试、修复、留证据；goal 还能让同一会话多轮继续。跨 feature 时，却需要有人选择优先级、决定是否开工、维持跨会话状态，并裁定自动检查之外的范围与品质。本文用**交付层/工作层**指代这两个观察尺度，仅作分析，不是 DSH 或行业正式术语。[01 篇](./01-slice-vs-pipeline.md)给出边界。

你的[口述与四仓记录](./research.md)提供了具体线索：不断提醒「计划计划」、要求工作进 proposed、用 ROADMAP 标记下一项，说明你在为工作层补外部记忆；[20 个特意选取的较大会话](./research.md)中 goal 多由 agent 代写、plan mode 未进入而 `ask_user_question` 被用于呈批，说明机制是否存在与是否被实际使用是两回事。**这份采样不能证明全部 229 个会话都如此，更不能证明根因只有一个。**尤其「这项做得好吗」还关乎测试覆盖了什么、是否符合你的意图，不只是有无队列或机器门禁。四仓的改动在短时间内聚集，现有记录只支持「问题出现后补了控制点」的线索，不足以证明补丁永久消除了对话提醒。详见 [04 篇](./04-owner-control-gap.md)。

用 Osmani 的术语作参照：你已经把**执行与部分检查**委托给了 agent，仍由自己临场担任**取题、范围裁决和最终质量判断**。这部分由人负责并不失败；问题在于必要的人类决定与本可外置的状态混在对话里，你得反复询问才知道自己该在哪儿介入。他在 [《Practical Loop Engineering》](https://addyosmani.com/blog/practical-loop-engineering/)强调清楚的停止条件与人工复核，是可靠委托的实践建议；它不是所有 loop engineering 用法的统一资格考试。LangChain 的[四层循环论](https://www.langchain.com/blog/the-art-of-loop-engineering)也比「一个 goal 不停跑」更宽。

## 第三节 与 SDD 如何并用，而非二选一

| 你要回答的问题 | 循环需要的内容 | SDD 产物能提供的内容 | 仍须由人决定的内容 |
|---|---|---|---|
| 接下来做什么 | 可读取的待办与优先级 | change/tasks 或项目队列可承载候选项 | 哪一项值得做、哪一项不做 |
| 何时可以开工 | 可辨认的授权状态 | 人审过的意图或计划 | 需求分歧、权限和风险 |
| 做完了吗 | 目标、验证结果与停止上限 | 需求场景与验收判据 | 检查之外的体验和质量 |
| 下轮如何接续 | 跨会话的工作记录 | 可更新的规格和任务状态 | 目标变更是否越过原授权 |

这里不要求每个 feature 都生成一套 spec，也不假设只要有 spec 就能自动验收。小改动可以一条明确任务配测试；需求多、多人要审意图或决策风险高时，再把规格和审阅做厚。OpenSpec 的产物链与迭代动作、Spec Kit 的推荐审阅序列各有取舍；[Anthropic 长程实验](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)甚至在长程执行循环中从粗目标生成了功能清单，并用进度文件和端到端测试防止过早宣布完成。**循环不排斥规格；稳定的外部状态往往是长循环能接续的前提。**

## 第四节 先试哪几个控制点

先用你已有的 [ROADMAP/提案和 goal](./04-owner-control-gap.md)做一个具体试验，而不是直接搬一整套 SDD 阶段门：

1. 每次启动一个工作项，人先确认**为何做、哪些不做、什么证据算完成、什么情况停下问人**；让会话 goal 引用该项，而非让 agent 在续轮中自己扩写范围。`/goal` 可以查看单会话目标；它不替代跨会话队列。
2. 单一工作来源只维护**下一项及阻塞原因**，进行中的短任务交给会话 todo；重大取舍留在提案/Note。你自己的仓库可选择 ROADMAP、Issue 或 spec/tasks，不存在对插件仓通用的「不许 tasks.md」上游禁令。
3. 在**开工授权、范围改变、宣布完成**三个点人工抽查；测试/类型检查负责可机械核对的条件，不能代替需求与品味判断。发现指针失效等可重复错误时，再给具体规则加校验与负例，而非先铺满门禁。
4. 连续试几项后记录「催问次数、目标是否被擅自扩大、完工后返工原因」。若仍无法一眼识别跨仓优先级，再考虑只指向各仓工作来源的总览。这个顺序是**待检验的建议**，不是四仓已证明在数小时内能补齐所有把控力。详见 [05 篇](./05-control-points.md)。

## 证据边界

[03 篇](./03-community-plugins.md)的 15 个公开仓库中未观察到 Spec Kit/OpenSpec 的典型目录，但公开产物不等于作者开发现场，不能据此断言「社区默认给目标就跑」或 spec-first 在插件生态零采用。[02 篇](./02-external-trend-verdict.md)能证实多种循环与规格并存的公开写作，不能从博客与少数 release 推出统一的行业终局。[research-strategy.md](./research-strategy.md)保留了采样、编码和外推的具体限制。

**最接近你体感的一句话：你确实正把逐轮提示转成能自行执行和验证的工作循环；DSH 提供执行能力和可借鉴的单笔交付纪律，却没有替独立插件仓决定跨 feature 的工作安排。OpenSpec 给你的清晰感可以作为这个循环的外部记忆与人类审阅点，而不是它的对立面。接下来要设计的不是更多自动续轮，而是让你看得见工作来源、明确授权和停止条件，并保留最后的质量判断。**
