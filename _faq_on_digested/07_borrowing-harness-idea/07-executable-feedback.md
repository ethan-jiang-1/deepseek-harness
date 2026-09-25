# 可执行反馈：做错了会被抓住

> **术 · 反馈。** 本页是实战：DSH 的六层反馈各是什么、本地和 CI 怎么分工、检查怎么证明自己会拦人、invariant 什么时候写。配 [`落地总纲`](./06-step-by-step-guide.md) Phase 4 用——五维评估里「变更闭环」维的证据环亮红时，来这页抄作业。

## prose 对 agent 没有约束力

规则写在 CONTRIBUTING 里，agent 违反了什么都不会发生——它不是故意违反，是**对「做错了」没有痛感**。DSH 的立场是让违反直接产生红灯。它的原话说尽了一切：

> **DSH 原话 ·** 为什么门禁优于 prose（[`.agents/notes/implemented/process/2026-06-11-quality-gates.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-06-11-quality-gates.md)）
>
> This codebase is developed primarily by coding agents. Agents follow enforced gates far more reliably than prose conventions.

## DSH 怎么做：每条可机械规则接一个非零退出码的命令

> **DSH 原话 ·** 门禁的接入方式（同上 Note）
>
> Every mechanically checkable AGENTS.md promise gets a command that exits non-zero. CI invokes the exhaustive set, while Git hooks reserve their latency budget for cheap local defects.

落到仓库里就是可以直接看的东西：

- `scripts/run-gates.ts`——全部顶层检查的聚合调度器（哪个命令、什么依赖、能否并行，都在这一个文件里）；
- `.github/workflows/ci.yml`——CI 侧的穷举矩阵；
- pre-commit / pre-push hook——只放低延迟项（staged lint、whitespace、增量 typecheck），**hook 不是小号 CI，是快反馈层**。

## DSH 怎么做：六层反馈各证明什么

| 反馈层 | DSH 的典型机制 | 能证明 | 不能单独证明 |
|---|---|---|---|
| 编译期 | strict TypeScript、closed union + `assertNever` | 类型关系、穷举分支成立 | 运行时组合正确 |
| Load / parser | config schema 校验、引用解析、fail loud | 输入在最早可解析点合法 | 行为满足意图 |
| 局部行为 | unit tests、per-file 100% coverage | 模块正例、错误、生命周期 | 已发行入口与完整输出 |
| 组装行为 | snapshots、real-composition 测试、e2e | 真实入口产生预期外部结果 | 设计选择合理 |
| 运行时关系 | package `./invariant` | 活系统中 owned relationship 持续成立 | 没有可观察关系的性质 |
| 语义判断 | code review（人或 agent）、用户验收 | 意图、架构、风险对齐 | 每个机械细节都已执行 |

关键纪律：**每层只拥有自己能观察的性质，绿色一层不代表其它层也绿。** coverage 绿不代表产品工作，snapshot 绿不代表 API 合理，review 也不该手工重复绿色 gate 已经精确拒绝的格式问题。

## DSH 怎么做：本地检查按 diff 选，不全跑

> **DSH 原话 ·** 本地检查的选择纪律（根 [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/AGENTS.md)）
>
> Match evidence to the surface: focused behavior tests, model/user-output snapshots, `doc-sync` for docs, built smokes for published paths, and real-API e2e for providers. … Never default to the full suite or repeat a passing check for commit or push.

实战工具是 [`dsh-pre-push-checks` skill](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-pre-push-checks/SKILL.md)：先跑 `pnpm --silent run change-scope --base <verified-base-ref>` 解析待推送范围，再为受影响面选**最小可信证据**。本地快、有针对性；CI 统一、跑穷举矩阵——两层不是二选一。

## DSH 怎么做：负例控制，证明检查真的会拦

> **DSH 原话 ·** 门禁必须先被证明会失败（[docs/testing.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/testing.md)）
>
> A guard only guards if the regression fails it. … and prove it: introduce the regression, watch red, revert.

同一原则的孪生句是 e2e 的「**verify the world, not the self-report**」——测试重新读文件、跑命令、看持久状态，而不是相信 agent 声称完成了。本 FAQ 自己就有一次实战记录：把提交 `5124a2a310` 的实现回滚、保留新测试，跑出 **2 红 95 绿**（[变更闭环](./01-sdlc-change-loop.md) 的逐环对照里有完整记录）——这就是负例控制的活样本。

## DSH 怎么做：invariant 检查「关系」，不检查「存在」

有效的 runtime invariant 比较 package 拥有的权威关系，最典型的就是静与动那篇的 `model-visible ⟺ logged`。**没有可观察关系时，DSH 明确不发布 `./invariant`**，而是在包 README 写省略原因——因为「没有关系」和「漏了检查」是两种状态。空壳 companion 被 `verify-package-invariants` 直接判 fail（[`.agents/notes/implemented/simplification/2026-08-28-omit-unneeded-invariant-companions.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/simplification/2026-08-28-omit-unneeded-invariant-companions.md)）。

## 怎么迁移到你的项目

1. **每一条可机械判断的规则，配一个 `exit non-zero` 的命令**——先挑 Phase 1 根文件里最容易被违反的三条。
2. 每层证明什么、不证明什么写清楚——避免「一个绿灯就放行」。
3. 新检查必须负例控制（引入回归 → 看红 → 还原），否则可能是永远为绿的摆设。
4. 本地按 diff 选相关检查，CI 跑穷举——先拿相关红灯，别一上来跑全套。
5. invariant 是锦上添花：没有可观察关系就诚实写空，不造假断言。

**学走形的检查**：最贵的走形是「检查全绿但没人信」——绿灯数目成了 KPI，负例控制没人做过，检查逐渐变成仪式。检验法：随便挑一个现有检查，说得出它最近一次为红是什么回归吗？说不出，它可能就是摆设。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「07 · 可执行反馈」一节）——按需核对，不读不影响理解。
