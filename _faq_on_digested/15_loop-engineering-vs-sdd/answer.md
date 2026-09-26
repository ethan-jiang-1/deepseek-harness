# Answer · 判定：「像 loop」是体感，官方没有这个流程名；外部趋势是收敛；缺口在管线层

## 结论先行

四个子问题的判定，每条至少两路证据交叉：

1. **「DSH 官方流程就是 loop engineering」——不成立。** 官方文本没有这个名字，也没有这个主张。loop engineering 是 owner 的体感用词（语音转写自「logo engineering」）：入口像一个粗目标，后面在循环，不像 OpenSpec 的阶段门。体感对上的制度事实是另一组句子：插件作者文档只教机制；阶段有地图、没有门；管线层——队列、次序、在途、提案状态、逐 feature 汇总——**刻意留白**（root 无 roadmap、`.agents/notes/README.md:19` 禁集中 INDEX、`:121` 生命周期搬移只显影于 git）。公开文献里的 loop engineering（2026-06 起）还要多一层：停止条件写清，外层系统决定下一轮。DSH 运来的 goal 续轮只接近内层。→ [01 篇](./01-slice-vs-pipeline.md)
2. **社区插件作者——默认是「给个目标就开跑」**：15 仓抽样里这种跑法 ≈10、另加自建计划/审批门禁 ≈3、自建 spec 体系仅 1（open-design）、spec-kit/OpenSpec 采用为零。这是行为画像，不是他们在实行名为 loop engineering 的方法。把控力同样自建在门禁、审批点和净化发布树上，与四仓同构不同形。→ [03 篇](./03-community-plugins.md)
3. **「没有阶段门、约束写进环境」是趋势——成立，成色中强，终局是收敛。** 2026-06 起 loop engineering 成为公开名字，操作定义比 owner 的体感多出「可核的停止条件」和「外层调度」。Anthropic 的 `feature_list.json` 是从一句粗目标展开的进度规格，同构的是 owner 后补的队列，不是上游那张空的管线层。OpenSpec 拆掉刚性阶段锁，产物链还在。spec-kit #4336 是把 `/speckit-*` 装进 `.dsh/skills/`，让 SDD 流程在 DSH 里跑。→ [02 篇](./02-external-trend-verdict.md)
4. **「把控力不够」——缺口精确定位在管线层，且你的四仓已经把它补了一半**：口述的五个缺口全部落在管线层；每个缺口都有对应的、带日期的补面动作（「换了对话接下来做哪一个怎么判断」→ ROADMAP 立条目制；「看不见的工作等于没在做」→ 开工即立卡；马拉松指针失活事故 → pointer-live 门禁）；残余缺口 = 双权威面对齐 + 跨仓总览 + 机制纪律化（TodoPanel「解法一直就在输入框上方」的讽刺条）。→ [04 篇](./04-owner-control-gap.md)；怎么补 → [05 控制点清单](./05-control-points.md)

## 第一节 三条最重的证据（跨路互相咬合）

1. **制度面**：「不知道他是像看板一样挪来挪去的，还是干啥的」是上游设计的直接产物——生命周期搬移是同 diff 机械改写，状态变化只活在 git 里，对不翻 git 的人不显影。你看不清，不是因为不会用工具。
2. **行为面**：20 个采样会话的日志——goal 在采样内无一例由 owner 亲手创建、全部由 agent 代建代管（objective 被反复 edit 吸收你的对话更正），重会话 **75% 的轮次无人类输入**（arch：98 turns 中 73 次续轮 vs 24 条人话），plan mode 零进入、批准回路实际由 `ask_user_question` 承载（38 次），控制模式五天内从「逐条盯」进化到「设定 goal + 验收制」。你在会话里自己的话：「让你设定一个沟（goal），一直往前蹦。但我看你……蹦了没两下你就说结束了」——loop 体感有了时间戳。
3. **生态面**：awesome 榜单的把关哲学（"A green CI run is the precondition, not the decision. A maintainer reads the target repository before merging."）、context-lens 主动 purge 内部 AGENTS.md/docs/plans/ 的净化发布树、dsh-cc 的 plan-first + 盲评编排宪法——仓库行为是给个目标就开跑，加上门禁和人审点，没有 spec-first。这仍然不是一份名为 loop engineering 的官方或社区章程。

## 第二节 「只给 agent 一套方法学」这个做法的判定

对，而且你的四仓做得比「反复强调遵循」更好：architect 把它做成了 8 条**可评分**的 DSH 对齐画像，开头一句边界声明——"**DSH requires none of this of a plugin repository**……This profile is a deliberate choice"；不借的清单（Issue 流、stacked PR、CI 矩阵、双语 note、词数预算）也明写了（"adds ceremony with no consumer"）。给后续 agent 的唯一增量建议：把「遵循 DSH 的开发流程」这句话**说准**——它的准确含义是 **DSH 开发纪律（不变量 + 门禁 + Note 同 diff）+ 本仓管线层（ROADMAP / 立卡 / 门禁）**；后者是你的适配、不是上游要求。写明这一点恰好防止两个方法学混淆：agent 看到的不是两套流程，而是一套流程加一份明确的偏离清单。

## 第三节 给你的下一步（全部低成本，论证见 05 篇）

1. 把「goal = 当前 ROADMAP ▶ 条目的运行时载体」一句话写进入口链——你已经在 ROADMAP 里这么叫了（现役条目名「用户拍板的当前 Goal」），差的是把这句话写给每个新会话；偶尔用 `/goal` 看一眼，不必问 agent「goal 是不是 reach 了」。
2. 「等人/可自主」行标与 `queue-pointer-live` 门禁推广到全部四仓（deep_research 09-26 事故的教训：静默自主跑起来后，指针失真是最先爆的真事故）。
3. 跨仓一页索引（只放指针、不镜像状态）——四仓四张队列是目前唯一没有总览的一层。
4. 长期跟踪一个可证伪的预言：插件仓何时开始出现 `.specify/`（03 §4）——它决定「趋势」判定往哪个方向加强。

## 第四节 证据强度与复审入口

「官方流程就是 loop engineering」已经撤回，依据在 [01 篇](./01-slice-vs-pipeline.md) 第一节。仍开放的脆弱点有三处：**n=1**（你的四仓是「管线层自建」的核心实证）、**自造分析框架**（切片层/管线层是本篇为了安放五个缺口而造的模型，不是上游术语）、**采样偏差**（会话日志只取最大 20/229）。五层证据（现象→制度→行为→生态→行业）如何互相校验、每个结论的攻击面与最小复核动作、调查中四条被证据修正的假设、若做第二轮会改什么——全部单列在 [research-strategy.md](./research-strategy.md)，供独立复审。

## 最接近的一句话

**「像 loop」是你的感觉，官方没有把插件开发流程叫成 loop engineering。感觉里站得住的是：入口是粗目标，后面在循环，阶段门和管线总览是上游故意不造的。公开的 loop engineering 还要两样：人能核的停止条件，以及决定下一件工作的外层系统。DSH 的 goal 续轮只会自己接着跑，停止条件要人写进去它才有；跨 feature 的下一件要靠你的 ROADMAP。把控力缺口在管线层，四个 repo 已经用「对话税 → 显性化 → 门禁化」补出一半。**
