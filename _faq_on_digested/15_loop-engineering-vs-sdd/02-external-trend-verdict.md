# 02 · 外部趋势判定：无阶段门是中强趋势，终局是收敛；「官方就是 loop engineering」没有外部背书

## 判定

owner 问「这是一种趋势，还是我的错觉」。两句要分开答。错觉的是「官方流程就是 loop engineering」：官方没这么说，外部文献也没有把 DSH 命名成这套方法。要判定的趋势是另一句：「粗目标进循环、约束写进环境、少用阶段门」在行业里是否存在。

1. **这句趋势成立**：「粗目标进循环 + 约束写进环境 + 机械门禁兜底」在 2025–2026 被多次命名。2026-06 起，其中一个名字就是 loop engineering，操作定义见 [01 篇](./01-slice-vs-pipeline.md) 第一节，比 owner 的体感多出可核停止条件和外层调度。
2. **「取代 SDD」不成立**：SDD 工具活着且在发 1.0。两边都在把「每阶段同步人审」收成「机器可查门禁 + 少量真人在环点」。残留的差别是约束先写在哪：人审的 spec 产物链，还是环境里的机械门。
3. **DSH 的位置**：上游留白管线层，自己没有加入这套命名。spec-kit v1.0.4 的 "Add DeepSeek Harness (DSH) integration (#4336)" 是 agent 适配，见第四节。

## 第一节 命名时间线：同一个感觉附近有好几个名字，层高不一样

时间线（一手或第一人称，出处见 [research.md](./research.md) D 路）。它们描述相邻现象，不构成「官方 DSH = loop engineering」的证据：

- **2024-12 Anthropic**：《Building effective agents》把 agents 定义成 "LLMs using tools based on environmental feedback in a loop"。这是机制句，当时没有 loop engineering 这个方法名。
- **2025-02 vibe coding**：Karpathy（"forget that the code even exists… I 'Accept All' always"）。Willison 随即收窄并警告语义扩散。这是「不看代码就接受」，和后面要求测试门的做法不是同一层。
- **2025-07 Ralph Wiggum loop**：Huntley——"In its purest form, Ralph is a Bash loop"。signs 把踩坑写成环境里的牌子；backpressure 用类型、测试、静态分析当拒绝门（"Anything can be wired in as back pressure to reject invalid code generation"）。specs 与 `fix_plan.md` 每轮装进上下文，是环境夹具，不是阶段审批物。上游 DSH 不提供这条队列；owner 的 ROADMAP / proposed 更接近这个角色。Osmani 后来把这种 bash loop 写成 loop engineering 原语出现之前的手写形态。
- **2025-11 harness 与另一套命名**：Anthropic《Effective harnesses for long-running agents》让 initializer 把一句粗目标展开成 `feature_list.json`（claude.ai clone 一例 200+ 条，初始 `passes: false`；"**It is unacceptable to remove or edit tests**"；选 JSON 是因为模型较不容易整文件改写 Markdown），外加 progress 文件、git 提交、每轮先通基线再端到端验证。这是一张生成出来的进度规格，同构的是 owner 后补的队列，不是上游留白的 DSH（根目录无 roadmap，且禁集中 INDEX）。同月 Zaninotto 另起一名 Natural Language Development，用来替换他认为带贬义的 vibe coding（"'Vibe coding' sounds dismissive"）。那是另一次命名，不是 loop engineering 的同义词。
- **2026-06 / 2026-08 loop engineering**：LangChain 与 Osmani 使用这个词。定义与 owner 体感的分界在 01 篇第一节，不在这里重复。

## 第二节 一线背书与基础设施信号

- Anthropic 两篇工程文把约束放进环境里的机械门禁，人类门禁降为可选 checkpoint；长程方案同时外置一张 `feature_list.json` 进度规格。
- AGENTS.md 官网自称 "used by **over 60k open-source projects**"，OpenAI Codex / Cursor / Zed / Devin 等采纳，Linux Foundation 旗下基金会托管——「仓库约定承载约束」已是基础设施。
- 实践者叙事大量倒向「给个目标就跑 + 机械门」：marmelab（"Most coding agents already have a plan mode and a task list. In most cases, SDD adds little benefit"）、HN 的 gsadaka（"that's why agents.md exists"）、弃 SpecKit 自建编排的 yoaviram。

## 第三节 与 SDD 阵营的对照：两边各有一面「假把控」的镜子

这是本篇对 owner「把控力」问题最重要的外部回声：

- **SDD 侧的假把控**：Böckeler 设问 "False sense of control?"（"I frequently saw the agent ultimately not follow all the instructions"）；marmelab 的 "**False Sense of Security**——agent 把 'verify implementation' 标成 done 却一个单测都没写"；yoaviram 的验证债（"Most tests were failing, and the build was not successful"）。**门在，但守门的是被约束的 agent 自己。**
- **没有进度盘的一侧**：管线层退回人的工作记忆与对话催促——owner 的体感即此（见 [01 篇](./01-slice-vs-pipeline.md)）。这是缺少外层进度盘时的体验，不是官方命名的方法。
- 两个镜像指向同一个收敛答案：**真实把控 = 机器可查的门禁（守门的是机器）+ 少量真正的人在环审批点**。SDD 用户缺机器门的时候，没有进度盘的人缺那几个真人检查点；两边的产品演化都在补自己缺的那一半（下一节）。

## 第四节 双向演化：SDD 在拆刚性阶段锁，循环派在补机械门

**SDD 工具向「更自动、更少人工门」**（一手 release 史）：

- OpenSpec：OPSX 去掉刚性阶段锁（"No more rigid phases"、"Dependencies are enablers, not gates"）；npm 说明同时保留 "Agree before you build"，产物仍是 proposal / specs / design / tasks。v1.6.0 "auto-approve the openspec CLI"；v1.12.0 "Code-grounded planning"；v1.13.2 "asks for clarification only when context is critically unclear"。人工确认从「每阶段必审」收成「关键歧义才问」，管线产物还在。
- Spec Kit：三入口轻量化；社区目录出现 "**Autonomous Run Governance** preset" 与 "**Ralph Loop** extension"（v1.5.0）。v1.0.4 的 DSH integration（#4336，issue #4334）做的是 `specify init --integration dsh`，把 `/speckit-constitution` → `specify` → `plan` → `tasks` → `implement` → `converge` 装进 `.dsh/skills/`，与 Codex、Zed、Devin 同类。方向是 SDD 流程在 DSH 里跑。v1.0.0 发行文把迁移指南说成由 agent 消化。

**loop 工具链向「补控制点」——但方向是把同步人门换成机械门**（聚合信号）：

- Claude Code "Auto mode is now the default"（用 catch-up 机制兜底）；OpenAI alignment 博客《Auto-review of agent actions without synchronous human oversight》+ Codex 自动批准低风险动作。
- 机械门自己会成为攻击面。DSH 的样本是 CVE-2026-82533（2026-09-08 披露）：沙箱内一条命令把会话切到 danger-full-access，且不触发审批提示；0.1.2-alpha.1 用一次性 token 修复。SAFETY.md 写明 sandbox/approval "do not guarantee isolation or prevent damage"。这是安全事实，不是「DSH 代表了 loop engineering」的证据。补把控力时要审计门本身。

## 第五节 反证与边界（防止高估趋势）

1. SDD 未死：spec-kit 仍发 1.0 并堆企业 preset；Asana 等企业写作；Ask HN 有真实成功者（sermakarevich："I use SDD since Feb for all my mid+ size projects. This works great for me"——其读法本质是把 SDD 当多层 gate 用）。
2. 两方都缺大规模 brownfield 纵向数据；现有正反案例偏 solo / 小项目 / greenfield。
3. 证据面偏 HN + 工程博客；「为 DSH 开发」的第一人称长篇工程叙事在公开渠道缺失（Ask HN 2026-09-19 提问 0 回复）——本 FAQ 的 B2 路（owner 四仓取证）恰好是这类稀缺证据的一个私有一手样本。

## 最接近的一句话

**「官方就是 loop engineering」没有外部背书。有外部背书的是另一句：2025–2026 的行业里，「粗目标进循环、约束进环境、机械门兜底」被反复写成实践，2026-06 起其中一个名字是 loop engineering，终局是机械门禁加上少量真人在环点。DSH 官方只提供其中的 harness 和 goal 续轮；spec-kit #4336 是把 SDD 技能装进这个 harness。**
