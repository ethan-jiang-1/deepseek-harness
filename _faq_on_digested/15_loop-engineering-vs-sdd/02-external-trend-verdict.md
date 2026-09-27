# 02 · 外部参照：loop engineering 与 SDD 如何相交

## 判定

你的体感在公开写作中有贴近的描述，但这些文章不是一项经过统一标准化、已由 DSH 官方采用的方法。尤其值得先读 [Addy Osmani 2026-06-07《Loop Engineering》](https://addyosmani.com/blog/loop-engineering/)：他强调从「我写每一轮 prompt」转到「我设计一个系统，发现工作、交给 agent、检查、记录并决定接下来做什么」。你的 DSH 使用已把一部分执行与检查委托出去，工作选择与授权仍常由你通过对话维持，正是两者相接的地方。公开案例可以支持**方向相似**，不足以判定「少 spec 的 loop 已取代 SDD」或行业终局。

## 第一节 几种循环，不是一份统一定义

- [Anthropic《Building effective agents》](https://www.anthropic.com/engineering/building-effective-agents)用环境反馈中的循环描述 agent 执行。这是基础机制，不自动产生跨任务的取题与记忆。
- [Osmani 2026-06-07](https://addyosmani.com/blog/loop-engineering/)讲系统接替人逐轮下提示，并列出自动发现与派工、隔离工作、技能、工具、相互检查及跨会话记忆等可用组件；这是贴近 owner 体感的首要参照。无需把每个列举的组件都当成术语定义的必要条件。
- [LangChain 2026-06-16](https://www.langchain.com/blog/the-art-of-loop-engineering)区分 agent 行动、验证返工、事件或定时再跑、以及根据运行轨迹改进 harness 的多层循环；这是比一次 goal 续轮更宽的工程视角。
- [Osmani 2026-08-14](https://addyosmani.com/blog/practical-loop-engineering/)讨论 goal/定时等原语，强调明确的停止条件、约束与审阅；这是让自主运行更可靠的实践建议，不是用来否定上面其他用法的硬性定义。

更早的 [Huntley Ralph loop](https://ghuntley.com/loop/)把上下文、specs、计划与测试反馈带进反复执行；[Anthropic 的长程 agent 实验](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)从高层目标生成 `feature_list.json`，用它和进度文件维持跨上下文状态，逐项验证。**循环与外部规格可同时存在**。后者不是「只给粗目标就放手」成功的证据，而是粗目标往往需要被拆成可跟踪的工作与检查。

## 第二节 和 SDD 的对照轴

SDD 的优势通常在**先使需求、变更和计划可读**，而不是代码一动就自动被人强制批准。OpenSpec 的 [README](https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/README.md)鼓励先审计划，[OPSX](https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/opsx.md)却明说没有刚性阶段锁，允许实施中重写产物；[Spec Kit quickstart](https://github.github.io/spec-kit/quickstart.html)推荐逐技能调用、逐步审阅。不能把这两个工具统称为「每阶段强制审批」。工具建议人审和运行时实际阻止执行，也不是同一个事实。

反过来，loop engineering 讨论**谁在何时启动下一轮、以何种反馈修改下一轮**，并不规定每一轮只能读 prompt、不得读 spec。一个可行的组合是：用规格或薄队列记工作与验收条件，用 agent 反复实现和验证，用人审关键范围变化及最终结果；是否需要更厚的 spec，由需求分歧、工作时长和受影响者决定。spec 有验收场景仍需要真正运行检查；机器检查通过，也不说明人的需求或品味已经被满足。关于 DSH 如何借这两个维度，见 [01 篇](./01-slice-vs-pipeline.md)。

## 第三节 证据能支持到哪里

OpenSpec 对刚性阶段的调整、Spec Kit 给 DSH 增加技能适配、Anthropic 在长程执行中引入外部进度文件，都说明工具作者在探索**产物、执行与监督的不同组合**。Spec Kit 的 DSH integration（#4336）表示 SDD 技能可安装到 DSH，不表示 DSH 官方改采 Spec Kit，亦不表示社区插件仓实际采用了它。[03 篇](./03-community-plugins.md)只抽验了公开仓库，无法据目录是否存在推算行业采用率。

博客、release 和论坛实例既没有统一的长期对照，也没有给出足以推出「最终都收敛到机械门禁 + 少量真人」的纵向数据。机械测试可拒绝某类错误，人类审阅可发现机器无法表达的目标偏差；两者可能互补，不是行业已经完成的单一终局。哪种安排适合你的长程插件，仍需用自己的几轮工作记录检验。[研究底稿](./research.md)记录了旧材料与采样限制；其中将省人审等同于趋势的段落应按本篇收窄理解。

## 最接近的一句话

**你感觉「越来越不像我逐轮提示，而像在设计能接着做事的循环」，有 Osmani 2026-06 的直接概念参照。SDD 的需求与计划产物可以给循环提供外部记忆和审阅点；DSH 的 goal 只解决单会话续轮的一部分。公开材料支持组合这两类机制，尚不能替你决定该保留多少人工审阅或下一个 feature 该由谁选。**
