# 01 · 交付层与工作层：DSH 的执行能力如何接到项目进度

## 结论先行

「结果还行，但把控力不够」可以先分成两个尺度：**交付层**是一笔变更的行为、测试、文档和复核证据；**工作层**是跨 feature 的取题、排序、在途状态、停止与人的批准。这个二分是本 FAQ 的分析工具，不是 DSH 或 SDD 的官方分类。DSH 运行时支持执行与会话级目标，DSH 自身仓库重视每笔交付的可检验性；但它没有为所有外部插件项目规定统一的跨 feature 工作管理方法。OpenSpec/Spec Kit 提供可选的规格与任务产物，能使工作层更容易看清，也并不保证交付质量。两层可以组合，不能说一方「满」、另一方「空」。

## 第一节 你的 loop 体感有出处，但不是官方流程名

[Addy Osmani 2026-06-07 的原文](https://addyosmani.com/blog/loop-engineering/)把 loop engineering 的关键变化说成「replacing yourself as the person who prompts the agent」，让系统发现、分配、检查、记录并接续工作。你的多轮 goal、验证反馈与插件仓队列，已在靠近这种工作方式；仍需要你反复提醒计划、检查目标和决定下一项的地方，说明工作层尚有部分靠对话维持。不能因此说「完全不算 loop」，更不能把 DSH 产品或插件作者文档命名成官方的 loop engineering 开发流程。

其他作者讨论了相邻但不完全相同的循环：[LangChain 2026-06-16](https://www.langchain.com/blog/the-art-of-loop-engineering)区分 agent 运行、验证反馈、事件触发与改进 harness 的多层循环；[Osmani 2026-08-14](https://addyosmani.com/blog/practical-loop-engineering/)强调清楚的停止条件与需要时亲自审代码。停止条件是可靠委托的重要设计项，不是这些文章共享的唯一术语定义。DSH 的 [goal 服务](../../packages/goal/goal/README.md)只保存单会话目标，[续轮驱动](../../packages/goal/goal-round-driver/README.md)有轮次上限与停止状态；它们本身不会选择跨 feature 的下一件工作，也不保证完成结果通过人类判断。FAQ 11 的窄证据切片闭环则描述一笔交付内的习惯，不是对整个项目编排的正式名称。

## 第二节 三种不同来源的流程事实

1. **DSH 产品**：提供可组合的插件、会话执行与 goal、todo、plan 等能力；[插件入门](../../docs/user/develop/basic/index.md)讲如何构建和挂载，[设计指南](../../docs/user/develop/practice/index.md)讲角色分工，没有要求外部作者采用统一的 Issue/Note/任务序列。
2. **DSH 仓库**：其贡献者遵循根 [AGENTS.md](../../AGENTS.md)的测试、快照和文档纪律，重大决策记录在 [Agent Note](../../.agents/notes/README.md)；这是这个仓库的交付制度，不因别人在 DSH 上写插件就自动适用。
3. **你的独立插件仓**：选择把 ROADMAP、提案、立卡与指针校验连起来，使下一项和在途工作可见。这是有针对性的本仓适配；它可以借 DSH 的质量原则，却不是复制 DSH 官方插件开发流程。

FAQ 13 的 [dev-loop](../13_expert-plugin-repo-organization/dev-loop.md)把不同载体排成第 0–7 阶段，供设计独立插件仓时参考，不是产品要求按阶段停车。DSH 的 [plan mode](../../packages/plan/README.md)提供可选审阅，而非操作权限锁。在外部工具侧，[Spec Kit 的 quickstart](https://github.github.io/spec-kit/quickstart.html)推荐每步审阅；OpenSpec [README](https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/README.md)鼓励审阅计划，但 [OPSX](https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/opsx.md)明说没有刚性阶段门，产物可在实施中反复修订。应分别比较产物可见性、建议审阅时点和真正强制的检查。

## 第三节 两个尺度能解释什么、不能解释什么

| | 单笔交付（交付层） | 跨 feature 工作（工作层） |
|---|---|---|
| DSH 产品 | 工具与反馈支持逐步执行；goal/todo/plan 保存各自会话状态 | 不替插件仓决定项目优先级或统一的跨会话队列 |
| DSH 自身仓库 | 代码、测试、快照、文档和决策记录随变更核对 | Issue、PR 和 Note 生命周期可追踪部分工作；没有通用的项目进度盘规定 |
| OpenSpec / Spec Kit | 规格与场景可供验收；通过测试仍需另行核对 | change/spec/tasks 等产物使计划与进度可见；审阅密度与强制程度不同 |
| owner 四仓 | 用验证与门禁留交付证据 | 用 ROADMAP、提案及授权标记补跨会话工作来源 |

根目录没有 ROADMAP，以及 [Agent Note 规则](../../.agents/notes/README.md)禁止给 Note 树建立集中 `INDEX.md`，只说明 **DSH 仓库这样安排其记录**；不能推出上游禁止插件仓建队列，或要求用户靠记忆管理项目。另一方面，note 的 proposed/implemented/rejected 路径编码了决策生命周期，却不等于任务的「下一项、正在做、等人确认、质量可接受」；用它当进度盘需要额外的视图与纪律。[todo](../../packages/todo/README.md)和 goal 属于会话，不能仅凭它们看到四个 repo 的全貌。

这个模型还解释不完「质量怎么样」和「goal 是什么」：自动检查只覆盖它实际检测的行为；人未批准的范围扩大、需求理解错误、体验不够好，即使验证通过也可能存在。goal 既是会话执行状态，又牵涉谁能设定完成标准。把一切归入工作层并说交付层已满，会错过这两个判断问题。[04 篇](./04-owner-control-gap.md)把它们与进度可见性分开。

## 最接近的一句话

**DSH 让 agent 的单项执行和检查易于循环，也让自己仓库的变更留有证据；你的插件仓跨 feature 取题、进度和批准如何组织，则由你决定。SDD 的规格与任务可以成为循环的外部记忆和审阅依据。要补的既有可见状态，也有目标授权与质量判断，不能只用一张队列或一轮绿灯代替。**
