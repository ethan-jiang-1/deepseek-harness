# 迁移优先级与边界：什么先搬、什么别搬

> **术 · 迁移清单。** 优先级默认排序 + 四个不能混淆的边界 + 外置的维护成本。项目评估用 [`落地总纲`](./06-step-by-step-guide.md) 的五维表（三问是它的快诊汇总视角），本页不管评估，只管「按什么次序搬、搬的时候别把什么当成什么」。

## 先排序：什么值得先搬

次序不是死的——**你的五维评估结果说了算**（哪维最痛先磨哪维）。这张表是没做评估时的默认排序：

| 优先级 | 可迁移做法 | 原因 |
|---|---|---|
| 0 | 先拿一笔最近的真实变更跑通垂直切片（意图 → owner → 证据 → 红灯对照） | 先知道自己缺什么，再动手建 |
| 1 | 一个事实一个 owner，根指令只放 standing orders | 先减少冲突和上下文浪费 |
| 2 | 为常见任务提供短入口、范本和明确升级条件 | 先降低「改哪里」的判断成本 |
| 3 | 把可机械规则接入真实接受路径，并证明负例会失败 | 先让反馈可信 |
| 4 | 用 Skills 保存需要上下文判断的工作流程 | 让复杂任务不依赖个人记忆 |
| 5 | 在确有动态组合压力时引入可查询 plugin graph 和完整 seams | 让架构成本与真实需求匹配 |

第 0 项是本 FAQ 补充的（垂直切片思想），第 1–5 项来自研究语料的清单。第 5 项被刻意排在最后：**插件图、seam 三角色、完整运行时 inspect 是「组合压力」的产物，不是普通项目的默认项。** 第 0–3 项几乎零架构依赖，是大多数项目真正的第一桶金。垂直切片的完整操作见 [`落地总纲`](./06-step-by-step-guide.md) Phase 1 第二步；DSH 的标准演示（提交 `5124a2a310` 逐环对照）见 [`变更闭环`](./01-sdlc-change-loop.md)。

## 四个不能混淆的边界

照搬时最容易翻车的是把「相似」当「等同」。每条边界配 DSH 原话——这些句子就是边界的定义：

**1. 可读 ≠ 简单。** owner、catalog、统一术语让复杂系统**可查询**，但包、事件和生命周期仍然复杂。

**2. Skill ≠ enforcement。** Skill 是 guidance；可机械规则仍需类型/脚本/invariant，语义仍需 review。DSH 原话：

> **DSH 原话 ·** Skill 自我声明的边界（[`.agents/skills/dsh-code-review/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-code-review/SKILL.md)）
>
> This skill is guidance, not a complete checklist. […] The report identifies paths and dirty layers but does not replace semantic review.

**3. 清理 ≠ 事务回滚。** disposer 撤销它拥有的注册与资源，不会自动补偿已经发生的外部写入。DSH 原话：

> **DSH 原话 ·** 注册即效果、随卸载 unwind（[docs/architecture.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/architecture.md)）
>
> There is no privileged core to patch: you extend dsh by mounting a plugin beside the others, and registrations are effects that unwind when their plugin unloads.

**4. 运行时查询 ≠ 安全沙箱。** `tool-cordis` 的 vm 只防意外全局污染，注入服务仍有真实权限。DSH 原话：

> **DSH 原话 ·** vm 不是安全边界（[`.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md)）
>
> The vm prevents accidental global pollution; injected filesystem, shell, and network services still have real authority, so it is not a security boundary.

## 知识外置本身有维护成本

类型、文档、决策记录、Skills、生成目录、测试、invariant、CI 都要维护。**外置不是免费的**，DSH 用几样纪律控制成本，每样都是可打开的实践：

| 成本风险 | DSH 的控制实践 |
|---|---|
| 索引过期 | 生成 catalog 配 freshness gate——目录与源码有 diff 就红（[生成 catalog 的门禁](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/tool-catalog.md)） |
| 常驻层膨胀 | 文档预算进 `scripts/doc-budgets.manifest.json`，`verify-doc-budgets` 逐文件卡上限（[docs/AGENTS.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md) 的 Wordcount Budgets）；数值不迁移——给区间不给定值（推荐区间见 [`入口链`](./07-agents-entry-chain.md)） |
| 过时理由冒充现行 | 决策记录带状态目录与冻结归档（[.agents/notes/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/README.md)） |
| 假门禁 | 新检查必须负例控制：引入回归 → 看红 → 还原（[docs/testing.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/testing.md)） |
| 双语漂移 | README 配对 hash sidecar，改一侧必须重录另一侧（`README.i18n.yaml`，[变更闭环](./01-sdlc-change-loop.md) 的 7 文件案例里就有它） |

普通项目最容易犯的错，是**在还不存在组合压力时，提前造一整套插件/生成目录/invariant 架构**——维护成本吃掉可读性收益。本 FAQ 的研究语料（整理者归纳，非 DSH 原文）说得直接：

> 较小项目若只有一个 loop、少量固定 adapter 和单一入口，可能只需要清晰 architecture map、少数 standing rules、任务 Skills 和针对性 tests。学习 DSH 的第一步应是知识归属与反馈纪律，而不是复制全部包结构。

## 从哪开始

没做五维评估就按默认排序做第 0–3 项；做了评估就按评估结果排。每引入一样外置知识，问一句「谁维护它、漂移了谁发现」，答案照着上面的实践表配。四条边界贴在墙上看：可读≠简单、Skill≠enforcement、清理≠回滚、查询≠沙箱——每条的定义就是那三句 DSH 原话。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「10 · 迁移清单」一节）——按需核对，不读不影响理解。
