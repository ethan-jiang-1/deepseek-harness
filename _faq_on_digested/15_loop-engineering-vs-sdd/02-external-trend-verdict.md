# 02 · 外部趋势判定：loop-first 是被反复命名的中强趋势——是「收敛」，不是「取代」

## 判定

owner 问「这是一种趋势，还是我的错觉」。外部证据的判定是三段式：

1. **方向成立（趋势为真）**：「粗目标进循环 + 约束写进环境 + 机械门禁兜底」在 2025–2026 已被反复命名、有一线阵营的一手方法论背书、有基础设施级的采纳数据。
2. **「取代 SDD」不成立**：SDD 工具活着且在发 1.0；真实图景是**收敛**——两个阵营都在把「同步人类审批门」换成「机器可查门禁」，分歧残留的本质只是**约束的初始载体**：上游人写/人审的 spec，还是环境内生的机械门。
3. **DSH 的位置**：不是异端，是这条收敛线上的**先行个案**——spec-kit v1.0.4 甚至收了 "Add DeepSeek Harness (DSH) integration (#4336)"。

## 第一节 命名簇：这个风格有四个名字，没有一个叫 loop engineering

时间线（全部一手或第一人称，出处见 [research.md](./research.md) D 路）：

- **2024-12 Anthropic 奠基**：《Building effective agents》定义 agents = "LLMs using tools based on environmental feedback in a loop"——loop-first 的机制定义先于一切命名。
- **2025-02 vibe coding**：Karpathy 命名（"forget that the code even exists… I 'Accept All' always"）；Willison 随即收窄定义并警告语义扩散。
- **2025-07 Ralph Wiggum loop**：Huntley——"In its purest form, Ralph is a Bash loop"；方法论全在环境侧：**signs**（踩坑教训写成环境里的牌子）+ **backpressure**（"Anything can be wired in as back pressure to reject invalid code generation"——类型/测试/静态分析当拒绝门）。注意 Huntley 不反 spec：specs 是**环境夹具**，不是上游审批物——这正是 DSH 的位置。后获 VentureBeat「biggest name in AI」、The Register 专文等二次报道。
- **2025-11 harness 工程化 + 第二次命名**：Anthropic《Effective harnesses for long-running agents》给出与 DSH 最同构的一手方案：一句粗目标下 Opus 级模型也会失败，解法不是上游大 spec，而是 `feature_list.json`（200+ 特性、`passes:false`、"**It is unacceptable to remove or edit tests**"）+ progress 文件 + git 提交 + 每轮基线与端到端验证——**机械进度盘 + 机械门禁**；同月 marmelab Zaninotto 给这套风格第二次主动命名——Natural Language Development（"'Vibe coding' sounds dismissive"）。

## 第二节 一线背书与基础设施信号

- Anthropic 两篇工程文等于官方方法论：约束 = 环境里的机械门禁，人类门禁降为可选 checkpoint。
- AGENTS.md 官网自称 "used by **over 60k open-source projects**"，OpenAI Codex / Cursor / Zed / Devin 等采纳，Linux Foundation 旗下基金会托管——「仓库约定承载约束」已是基础设施。
- 实践者叙事大量倒向「给个目标就跑 + 机械门」：marmelab（"Most coding agents already have a plan mode and a task list. In most cases, SDD adds little benefit"）、HN 的 gsadaka（"that's why agents.md exists"）、弃 SpecKit 自建编排的 yoaviram。

## 第三节 与 SDD 阵营的对照：两边各有一面「假把控」的镜子

这是本篇对 owner「把控力」问题最重要的外部回声：

- **SDD 侧的假把控**：Böckeler 设问 "False sense of control?"（"I frequently saw the agent ultimately not follow all the instructions"）；marmelab 的 "**False Sense of Security**——agent 把 'verify implementation' 标成 done 却一个单测都没写"；yoaviram 的验证债（"Most tests were failing, and the build was not successful"）。**门在，但守门的是被约束的 agent 自己。**
- **loop 侧的把控焦虑**：没有上游产物链，管线层退回人的工作记忆与对话催促——owner 的体感即此（见 [01 篇](./01-slice-vs-pipeline.md)）。
- 两个镜像指向同一个收敛答案：**真实把控 = 机器可查的门禁（守门的是机器）+ 少量真正的人在环审批点**。SDD 用户缺前者，loop 用户缺后者；两营的产品演化都在补对方那一半（下一节）。

## 第四节 双向演化：SDD 在拆门，loop 在换门

**SDD 工具向「更自动、更少人工门」**（一手 release 史）：

- OpenSpec：OPSX 重构即拆门（"No more rigid phases"、"Dependencies are enablers, not gates"）；v1.6.0 "auto-approve the openspec CLI"；v1.12.0 "Code-grounded planning"（起草前先读代码与测试）；v1.13.2 "asks for clarification only when context is critically unclear"。人工门从「每阶段必审」收缩为「关键歧义才问」。
- Spec Kit：三入口轻量化；社区目录出现 "**Autonomous Run Governance** preset" 与 "**Ralph Loop** extension"（v1.5.0）——SDD 工具吸收 loop 技术；v1.0.4 收 DSH integration。v1.0.0 发行文甚至改用「迁移指南不再是给你读的，是你的 agent 替你消化」的论证。

**loop 工具链向「补控制点」——但方向是把同步人门换成机械门**（聚合信号）：

- Claude Code "Auto mode is now the default"（用 catch-up 机制兜底）；OpenAI alignment 博客《Auto-review of agent actions without synchronous human oversight》+ Codex 自动批准低风险动作。
- DSH 自身是这个方向的极端样本，也暴露其代价：CVE-2026-82533（2026-09-08 披露）——沙箱内一条命令切 danger-full-access 且不触发审批提示，修复靠一次性 token（0.1.2-alpha.1）。**把门做成机器可查的同时，门本身成为攻击面**；DSH 的 SAFETY.md 自认 sandbox/approval "do not guarantee isolation or prevent damage"。补把控力时这条要记入约束：机械门禁不是免费的把控，它也需要被审计。

## 第五节 反证与边界（防止高估趋势）

1. SDD 未死：spec-kit 仍发 1.0 并堆企业 preset；Asana 等企业写作；Ask HN 有真实成功者（sermakarevich："I use SDD since Feb for all my mid+ size projects. This works great for me"——其读法本质是把 SDD 当多层 gate 用）。
2. 两方都缺大规模 brownfield 纵向数据；现有正反案例偏 solo / 小项目 / greenfield。
3. 证据面偏 HN + 工程博客；「为 DSH 开发」的第一人称长篇工程叙事在公开渠道缺失（Ask HN 2026-09-19 提问 0 回复）——本 FAQ 的 B2 路（owner 四仓取证）恰好是这类稀缺证据的一个私有一手样本。

## 最接近的一句话

**owner 的体感不是错觉：这是 2025–2026 已被四个名字反复命名、被 Anthropic 方法论背书、被 AGENTS.md 基础设施化的真实趋势——但终局不是 loop 取代 SDD，而是双方都收敛到「机械门禁 + 少量真人在环点」；DSH 只是先行到了这一步，连 spec-kit 都反过来集成了它。**
