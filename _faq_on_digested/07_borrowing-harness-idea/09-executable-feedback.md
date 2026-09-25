# 可执行反馈：做错了会被抓住

> **术 · 反馈。** 本页是实战：DSH 的六层反馈各是什么、本地和 CI 怎么分工、检查怎么证明自己会拦人、invariant 什么时候写。配 [`落地总纲`](./06-step-by-step-guide.md) Phase 4 用——五维评估里「变更闭环」维的证据环亮红时，来这页抄作业。

## 先把规则变成命令

规则写在 CONTRIBUTING 里，agent 违反了什么都不会发生——prose 没有约束力，门禁才有。DSH 的原话说尽了为什么这样做：

> **DSH 原话 ·** 为什么门禁优于 prose（[`.agents/notes/implemented/process/2026-06-11-quality-gates.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-06-11-quality-gates.md)）
>
> This codebase is developed primarily by coding agents. Agents follow enforced gates far more reliably than prose conventions.

## 这样做：每条规则接一个非零退出码的命令

> **DSH 原话 ·** 门禁的接入方式（同上 Note）
>
> Every mechanically checkable AGENTS.md promise gets a command that exits non-zero. CI invokes the exhaustive set, while Git hooks reserve their latency budget for cheap local defects.

落到仓库里就是可以直接看的东西：

- `scripts/run-gates.ts`——全部顶层检查的聚合调度器（哪个命令、什么依赖、能否并行，都在这一个文件里）；
- `.github/workflows/ci.yml`——CI 侧的穷举矩阵；
- `lefthook.yml`——两个 hook，各管一段、严格限速（[设计记录](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/archived/process/2026-07-22-fast-local-git-hooks.md)）：
  - **pre-commit 串行跑三件**：对 staged 的 JS/TS 跑无项目加载的 Oxlint（自动修安全项并重新 stage）；`git diff --cached --check` 拒绝空白错误；vendor manifest 守卫核对 vendored 源码元数据。
  - **pre-push 只加一件**：`pnpm run typecheck`（增量）。
  - **明文禁止**进 hook 的：类型分析（pre-commit 侧）、测试、快照、文档检查、构建、hygiene——「unit suites, snapshots, documentation checks, builds … vary with the changed surface and do not（fit that boundary）」。hook 不是小号 CI，是**便宜高置信**缺陷的快反馈层。

同样的纪律也定义了 agent 的义务边界，还是那份记录的原话：「Agents inspect the outgoing diff and run the narrowest tests and checks that cover its behavior once. CI owns exhaustive coverage, built-artifact checks, and the platform matrix.」

## 这样做：六层各查各的，别让一层冒充另一层

| 反馈层 | DSH 的典型机制 | 能证明 | 不能单独证明 |
|---|---|---|---|
| 编译期 | strict TypeScript、closed union + `assertNever` | 类型关系、穷举分支成立 | 运行时组合正确 |
| Load / parser | config schema 校验、引用解析、fail loud | 输入在最早可解析点合法 | 行为满足意图 |
| 局部行为 | unit tests、per-file 100% coverage | 模块正例、错误、生命周期 | 已发行入口与完整输出 |
| 组装行为 | snapshots、real-composition 测试、e2e | 真实入口产生预期外部结果 | 设计选择合理 |
| 运行时关系 | package `./invariant` | 活系统中 owned relationship 持续成立 | 没有可观察关系的性质 |
| 语义判断 | code review（人或 agent）、用户验收 | 意图、架构、风险对齐 | 每个机械细节都已执行 |

每一层在 DSH 仓库里都有具名的真实检查，抓一个回归该去哪层一目了然：

- **编译期**：`pnpm run typecheck`——max-strict（`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`…），vitest 不做类型检查这个教训就写在这层的动机里；
- **Load/parser**：`verify-cordis-config`——配置在加载时解析校验，坏引用直接 fail loud，不带病启动；
- **局部行为**：`pnpm run test:coverage`——per-file 100%（`packages/*/*/src`），防御性死分支要 `/* v8 ignore */` 加理由，不许删；
- **组装行为**：`test:snapshot`——无 key 回放录制会话，走真实 profile 入口；`test:expected`——进程级期望输出；
- **运行行时关系**：`verify-package-invariants`——各包的 `./invariant` 安装器，空壳直接判 fail（见下文）；
- **语义判断**：`dsh-code-review` skill + 人类作者 PR 的加权批准门禁——人和 agent 都能做 reviewer，但意图判断不外包给机器。

关键纪律：**每层只拥有自己能观察的性质，绿色一层不代表其它层也绿。** coverage 绿不代表产品工作，snapshot 绿不代表 API 合理，review 也不该手工重复绿色 gate 已经精确拒绝的格式问题。

## 这样做：本地按 diff 选检查，不全跑

> **DSH 原话 ·** 本地检查的选择纪律（根 [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/AGENTS.md)）
>
> Match evidence to the surface: focused behavior tests, model/user-output snapshots, `doc-sync` for docs, built smokes for published paths, and real-API e2e for providers. … Never default to the full suite or repeat a passing check for commit or push.

实战工具是 [`dsh-pre-push-checks` skill](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-pre-push-checks/SKILL.md)：先跑 `pnpm --silent run change-scope --base <verified-base-ref>` 解析待推送范围，再为受影响面选**最小可信证据**。本地快、有针对性；CI 统一、跑穷举矩阵——两层不是二选一。

## 这样做：新检查上线前，先证明它会红

> **DSH 原话 ·** 门禁必须先被证明会失败（[docs/testing.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/testing.md)）
>
> A guard only guards if the regression fails it. … and prove it: introduce the regression, watch red, revert.

同一原则的孪生句是 e2e 的「**verify the world, not the self-report**」——测试重新读文件、跑命令、看持久状态，而不是相信 agent 声称完成了。本 FAQ 自己就有一次实战记录：把提交 `5124a2a310` 的实现回滚、保留新测试，跑出 **2 红 95 绿**（[变更闭环](./01-sdlc-change-loop.md) 的逐环对照里有完整记录）——这就是负例控制的活样本。

## 这样做：invariant 只在「有关系」时写

有效的 runtime invariant 比较 package 拥有的权威关系，最典型的就是静与动那篇的 `model-visible ⟺ logged`。**没有可观察关系时，DSH 明确不发布 `./invariant`**，而是在包 README 写省略原因——因为「没有关系」和「漏了检查」是两种状态。空壳 companion 被 `verify-package-invariants` 直接判 fail（[`.agents/notes/implemented/simplification/2026-08-28-omit-unneeded-invariant-companions.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/simplification/2026-08-28-omit-unneeded-invariant-companions.md)）。

## 从哪开始

第一周就做三件事：挑根文件里最容易被违反的三条规则，各配一个 `exit non-zero` 命令；给这三个检查各做一次负例控制（引入回归 → 看红 → 还原）；本地只跑覆盖当前 diff 的这三个，CI 跑全套。invariant 和 per-file coverage 之类的，等前三件事成为习惯再说。

## 学走形的检查

最贵的走形是「检查全绿但没人信」——绿灯数目成了 KPI，负例控制没人做过，检查逐渐变成仪式。检验法：随便挑一个现有检查，说得出它最近一次为红是什么回归吗？说不出，它可能就是摆设。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「09 · 可执行反馈」一节）——按需核对，不读不影响理解。
