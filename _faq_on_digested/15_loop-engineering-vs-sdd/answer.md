# Answer · 判定：体感是真的；趋势是真的（收敛而非取代）；缺口在管线层，且已被你补了一半

## 结论先行

四个子问题的判定，每条至少两路证据交叉：

1. **「DSH 官方流程就是 loop engineering」——属实，且是自觉设计**。上游对插件作者只教机制不教流程（basic/practice 文档纯机制）；阶段有地图（FAQ 13 dev-loop 第 0–7 阶段）没有门（仅有的两个强制义务都是交付时锚）；管线层——队列、次序、在途、提案状态、逐 feature 汇总——**刻意留白**：root 无 roadmap、notes 禁集中 INDEX（`.agents/notes/README.md:19`）、生命周期搬移只显影于 git（`:121`）。→ [01 篇](./01-slice-vs-pipeline.md)
2. **社区插件作者——默认就是 loop**：15 仓抽样纯 loop ≈10、loop+自建计划/审批门禁 ≈3、自建 spec 体系仅 1（open-design）、spec-kit/OpenSpec 采用为零；把控力同样自建管线层（验证门禁、审批点、净化发布树），与你的四仓同构不同形。→ [03 篇](./03-community-plugins.md)
3. **「这是一种趋势」——成立，成色中强，但终局是收敛而非取代**。loop-first 已被四个名字反复命名（vibe coding → Ralph Wiggum loop → harness engineering → Natural Language Development）；Anthropic 工程文给出与 DSH 同构的一手方法论（机械 feature list + 测试门，"It is unacceptable to remove or edit tests"）；SDD 两家自己在拆门（OpenSpec "no rigid phase gates"、spec-kit 收 Ralph 扩展与 autonomous preset）；spec-kit 甚至做了 DSH integration。→ [02 篇](./02-external-trend-verdict.md)
4. **「把控力不够」——缺口精确定位在管线层，且你的四仓已经把它补了一半**：口述的五个缺口全部落在管线层；每个缺口都有对应的、带日期的补面动作（「换了对话接下来做哪一个怎么判断」→ ROADMAP 立条目制；「看不见的工作等于没在做」→ 开工即立卡；马拉松指针失活事故 → pointer-live 门禁）；残余缺口 = 双权威面对齐 + 跨仓总览 + 机制纪律化（TodoPanel「解法一直就在输入框上方」的讽刺条）。→ [04 篇](./04-owner-control-gap.md)；怎么补 → [05 控制点清单](./05-control-points.md)

## 第一节 三条最重的证据（跨路互相咬合）

1. **制度面**：「不知道他是像看板一样挪来挪去的，还是干啥的」是上游设计的直接产物——生命周期搬移是同 diff 机械改写，状态变化只活在 git 里，对不翻 git 的人不显影。你看不清，不是因为不会用工具。
2. **行为面**：20 个采样会话的日志——goal 在采样内无一例由 owner 亲手创建、全部由 agent 代建代管（objective 被反复 edit 吸收你的对话更正），重会话 **75% 的轮次无人类输入**（arch：98 turns 中 73 次续轮 vs 24 条人话），plan mode 零进入、批准回路实际由 `ask_user_question` 承载（38 次），控制模式五天内从「逐条盯」进化到「设定 goal + 验收制」。你在会话里自己的话：「让你设定一个沟（goal），一直往前蹦。但我看你……蹦了没两下你就说结束了」——loop 体感有了时间戳。
3. **生态面**：awesome 榜单的把关哲学（"A green CI run is the precondition, not the decision. A maintainer reads the target repository before merging."）、context-lens 主动 purge 内部 AGENTS.md/docs/plans/ 的净化发布树、dsh-cc 的 plan-first + 盲评编排宪法——生态在用行为投票：loop + 门禁 + 人审点，而不是 spec-first。

## 第二节 「只给 agent 一套方法学」这个做法的判定

对，而且你的四仓做得比「反复强调遵循」更好：architect 把它做成了 8 条**可评分**的 DSH 对齐画像，开头一句边界声明——"**DSH requires none of this of a plugin repository**……This profile is a deliberate choice"；不借的清单（Issue 流、stacked PR、CI 矩阵、双语 note、词数预算）也明写了（"adds ceremony with no consumer"）。给后续 agent 的唯一增量建议：把「遵循 DSH 的开发流程」这句话**说准**——它的准确含义是 **DSH 开发纪律（不变量 + 门禁 + Note 同 diff）+ 本仓管线层（ROADMAP / 立卡 / 门禁）**；后者是你的适配、不是上游要求。写明这一点恰好防止两个方法学混淆：agent 看到的不是两套流程，而是一套流程加一份明确的偏离清单。

## 第三节 给你的下一步（全部低成本，论证见 05 篇）

1. 把「goal = 当前 ROADMAP ▶ 条目的运行时载体」一句话写进入口链——你已经在 ROADMAP 里这么叫了（现役条目名「用户拍板的当前 Goal」），差的是把这句话写给每个新会话；偶尔用 `/goal` 看一眼，不必问 agent「goal 是不是 reach 了」。
2. 「等人/可自主」行标与 `queue-pointer-live` 门禁推广到全部四仓（deep_research 09-26 事故的教训：静默自主跑起来后，指针失真是最先爆的真事故）。
3. 跨仓一页索引（只放指针、不镜像状态）——四仓四张队列是目前唯一没有总览的一层。
4. 长期跟踪一个可证伪的预言：插件仓何时开始出现 `.specify/`（03 §4）——它决定「趋势」判定往哪个方向加强。

## 第四节 证据强度与复审入口

本 FAQ 的判定有三处主要脆弱点：**n=1**（你的四仓是「管线层自建」的核心实证）、**自造分析框架**（切片层/管线层是本篇为了安放五个缺口而造的模型，不是上游术语）、**采样偏差**（会话日志只取最大 20/229）。五层证据（现象→制度→行为→生态→行业）如何互相校验、每个结论的攻击面与最小复核动作、调查中四条被证据修正的假设、若做第二轮会改什么——全部单列在 [research-strategy.md](./research-strategy.md)，供独立复审。

## 最接近的一句话

**你的体感三点全对：DSH 的入口就是粗目标 + 循环（制度如此，且留白是故意的）；这在 2025–2026 的行业里是已被反复命名的中强趋势，终局是收敛而非取代；把控力缺口不在你而在管线层——一个 DSH 刻意不造、而你的四个 repo 已经用「对话税 → 显性化 → 门禁化」补出一半的层。剩下的一半是三件以小时到半天计的小事，不是一门新方法学。**
