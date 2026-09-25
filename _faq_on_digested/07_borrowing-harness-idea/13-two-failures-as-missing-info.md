# 「糊涂」和「乱发挥」缺的到底是什么

> **背景 · 问题框架。** 把两个症状翻译成信息缺口——全套材料要填的洞。放在最后：入门不需要先读它，想深挖「为什么是这些机制」时再读。

## 先把症状翻译成缺口

「agent 探索完项目还是糊涂」和「agent 上手就乱发挥」都是结果，不是原因。DSH 的做法是不去修这个结果，而是先问：**一个 fresh agent 进入大仓库时，缺少哪几类信息？** 答案稳定地落在六个缺口上：

| 缺口 | agent 缺的句子 | 缺了之后的症状 |
|---|---|---|
| 必须遵守什么 | 「这里有什么铁律？」 | 违反约定、绕过 sandbox、破坏不变量 |
| 系统由什么组成 | 「这个库有哪些部分，谁依赖谁？」 | 抓不住主线，读散、读偏 |
| 为什么这样设计 | 「当初为什么选这条路？」 | 重走已否定的路径、把历史细节误当当前 API |
| 改动落在哪里 | 「这个需求应该改哪个机制？」 | 在错误的地方插代码、造出新接入方式 |
| 用什么流程 | 「这类任务该按什么步骤做？」 | 从多份规则重新拼流程，漏步骤 |
| 怎么算做对 | 「什么证据能证明我没做错？」 | 交付了没法验证的半成品 |
| 交付怎样算完整 | 「实现、文档、证据要一起交付吗？缺口要如实说吗？」 | 代码先走、文档后补、声称的行为没有证据 |

「糊涂」主要来自第 1、2、3 个缺口（铁律没排序、组成不清、为什么不知道）；「乱发挥」主要来自第 4、5、6 个缺口（改哪里、按什么流程、怎么证明）。第 7 个缺口是交付时刻的：前三类缺口的答案再对，交付时只交代码、声称与证据脱节，前面的功夫也白费。这七个缺口合起来，就是 Development Harness 要填的洞——前六个关于「参与」，第七个关于「交付」，两者共同构成 DSH 眼里的变更闭环。

## DSH 给每个缺口一个可查入口

DSH 没有把六类信息混写在一份总览里，而是**一个问题一个 owner**：

| 缺口 | DSH 中的主要回答 |
|---|---|
| 必须遵守什么 | 根级与子目录 `AGENTS.md` |
| 系统由什么组成 | architecture、glossary、subsystem docs、generated catalogs |
| 为什么这样设计 | Agent Notes 及其 alternatives |
| 改动落在哪里 | architecture 的 Where new behavior goes + extension cookbook |
| 当前任务怎样做 | `.agents/skills/` 与 cookbook |
| 怎样证明完成 | 类型、测试、snapshots、invariants、gates、GitHub CI |

> 这些文件并非越多越好。关键在于每类事实有 owner，读者可以从短入口逐步进入详细来源，而不必先通读整个仓库。

（上句是 `_agent_ready_development/repo-harness/00-index.md` 的归纳，不是 DSH 原文。）

## 关键反转：不赌「聪明」，赌「成本结构」

最容易误读的一点，是把 DSH 的成就归因于「它的 agent 很聪明，所以不会糊涂」。实际正好相反。DSH 的自述是：

> This codebase is developed primarily by coding agents. Agents follow enforced gates far more reliably than prose conventions [...].

（来源：DSH [`quality-gates` Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-06-11-quality-gates.md)，英文原文）

这句话的因果是：**因为开发主力是 agent（它天然缺背景、会忘、会走捷径），所以仓库才被迫把「读得懂、做不对」的成本结构整个反过来**——正确路径阻力最小、错误路径早撞机器。对你要借鉴的项目，这句话的含义是：**不要指望换一个更聪明的模型来解决「糊涂 / 乱发挥」，要指望把知识外置、把规则接到执行。**

## 「不糊涂 / 不乱发挥」各由哪几篇回答

- **不糊涂** → [`02-legibility-ownership.md`](./02-legibility-ownership.md)（知识归属：缺口 1、2、3）、[`09-agents-entry-chain.md`](./09-agents-entry-chain.md)（AGENTS.md 入口链：缺口 1 的骨架）、[`12-progressive-disclosure-pipeline.md`](./12-progressive-disclosure-pipeline.md)（披露管线的静态与注入层）、[`10-skills-as-procedural-memory.md`](./10-skills-as-procedural-memory.md)（按需加载）、[`11-runtime-inspection.md`](./11-runtime-inspection.md)（问实际状态：缺口 2 的运行时版）。
- **不乱发挥** → [`05-paved-road-and-ladder.md`](./05-paved-road-and-ladder.md)（改哪里：缺口 4）、[`07-executable-feedback.md`](./07-executable-feedback.md)（早失败：缺口 6）、[`10-skills-as-procedural-memory.md`](./10-skills-as-procedural-memory.md)（流程固化：缺口 5）、[`12-progressive-disclosure-pipeline.md`](./12-progressive-disclosure-pipeline.md)（可见集收缩 + 子代理隔离）。

这个两分不是 DSH 的官方术语，而是本 FAQ 为了「可迁移」做的归纳：**可读性解决「知不知道」，正确路径 + 反馈解决「会不会做错、做错了有没有人拦」。** 部分章节（05、10）同时服务两侧，见各章内说明。

## 证据入口

- [`_agent_ready_development/repo-harness/00-index.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/repo-harness/00-index.md)：语料的五类信息缺口与五类 owner 总表（本页正文扩成六缺口：把「改动落在哪里」单列，与语料的「为什么这样设计」并齐）。
- [`_agent_ready_development/repo-harness/01-follow-a-fresh-agent.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/repo-harness/01-follow-a-fresh-agent.md)：fresh agent 连续回答六个问题的完整闭环。
- [`_digested/harness-idea/00-map.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_digested/harness-idea/00-map.md)：参与知识「外置 / 自带」两分与核心论点。
- DSH [`quality-gates` Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-06-11-quality-gates.md)：仓库以 coding agent 为主、机械门禁优于 prose 约定的一手因果自述。
