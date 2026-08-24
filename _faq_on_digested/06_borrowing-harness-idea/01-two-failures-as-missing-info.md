# 01 · 「糊涂」和「乱发挥」缺的到底是什么

## 先把症状翻译成缺口

「agent 探索完项目还是糊涂」和「agent 上手就乱发挥」都是结果，不是原因。DSH 的做法是不去修这个结果，而是先问：**一个 fresh agent 进入大仓库时，缺少哪几类信息？** 答案稳定地落在五个缺口上：

| 缺口 | agent 缺的句子 | 缺了之后的症状 |
|---|---|---|
| 必须遵守什么 | 「这里有什么铁律？」 | 违反约定、绕过 sandbox、破坏不变量 |
| 系统由什么组成 | 「这个库有哪些部分，谁依赖谁？」 | 抓不住主线，读散、读偏 |
| 改动落在哪里 | 「这个需求应该改哪个机制？」 | 在错误的地方插代码、造出新接入方式 |
| 用什么流程 | 「这类任务该按什么步骤做？」 | 从多份规则重新拼流程，漏步骤 |
| 怎么算做对 | 「什么证据能证明我没做错？」 | 交付了没法验证的半成品 |

「糊涂」主要来自第 2 个缺口（以及第 1 个缺口没被清楚排序）；「乱发挥」主要来自第 3、4、5 个缺口。这五个缺口合起来，就是 Development Harness 要填的洞。

## DSH 给每个缺口一个可查入口

DSH 没有把五类信息混写在一份总览里，而是**一个问题一个 owner**：

| 缺口 | DSH 中的主要回答 |
|---|---|
| 必须遵守什么 | 根级与子目录 `AGENTS.md` |
| 系统由什么组成 | architecture、glossary、subsystem docs、generated catalogs |
| 为什么这样设计 | Agent Notes 及其 alternatives |
| 当前任务怎样做 | `.agents/skills/` 与 cookbook |
| 怎样证明完成 | 类型、测试、snapshots、invariants、gates、GitHub CI |

> 这些文件并非越多越好。关键在于每类事实有 owner，读者可以从短入口逐步进入详细来源，而不必先通读整个仓库。

## 关键反转：不赌「聪明」，赌「成本结构」

最容易误读的一点，是把 DSH 的成就归因于「它的 agent 很聪明，所以不会糊涂」。实际正好相反。DSH 的自述是：

> This codebase is developed primarily by coding agents. Agents follow enforced gates far more reliably than prose conventions.

这句话的因果是：**因为开发主力是 agent（它天然缺背景、会忘、会走捷径），所以仓库才被迫把「读得懂、做不对」的成本结构整个反过来**——正确路径阻力最小、错误路径早撞机器。对你要借鉴的项目，这句话的含义是：**不要指望换一个更聪明的模型来解决「糊涂 / 乱发挥」，要指望把知识外置、把规则接到执行。**

## 「不糊涂 / 不乱发挥」各由哪几篇回答

- **不糊涂** → [`02-legibility-ownership.md`](./02-legibility-ownership.md)（知识归属）、[`05-skills-as-procedural-memory.md`](./05-skills-as-procedural-memory.md)（按需加载）、[`06-runtime-inspection.md`](./06-runtime-inspection.md)（问实际状态）。
- **不乱发挥** → [`03-paved-road-and-ladder.md`](./03-paved-road-and-ladder.md)（改哪里）、[`04-executable-feedback.md`](./04-executable-feedback.md)（早失败）。

这个两分不是 DSH 的官方术语，而是本 FAQ 为了「可迁移」做的归纳：**可读性解决「知不知道」，正确路径 + 反馈解决「会不会做错、做错了有没有人拦」。**

## 证据入口

- [`../../_agent_ready_development/development-harness/00-index.md`](../../_agent_ready_development/development-harness/00-index.md)：五类信息缺口与五类 owner 的总表。
- [`../../_agent_ready_development/development-harness/01-follow-a-fresh-agent.md`](../../_agent_ready_development/development-harness/01-follow-a-fresh-agent.md)：fresh agent 连续回答六个问题的完整闭环。
- [`../../_digested/harness-idea/00-map.md`](../../_digested/harness-idea/00-map.md)：参与知识「外置 / 自带」两分与核心论点。
- DSH [`quality-gates` Agent Note](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)：仓库以 coding agent 为主、机械门禁优于 prose 约定的一手因果自述。
