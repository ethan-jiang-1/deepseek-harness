# DSH 原生开发流程：工作项、意图、证据与闭环

## 范围与结论

本文只研究当前 DSH 仓库的原生开发与运行机制，不以 OpenSpec 作为方案来源，也不把 OpenSpec 的产物或术语当作 DSH 的既定流程。证据来自根规则、`.agents/`、Issue/PR 模板与 policy、测试政策、Agent Notes、Skills、gate 脚本、GitHub workflows、Git 历史和插件作者文档。

DSH 不是一条单一的“需求 → spec → 实现”流水线，而是多个 owner 分工的闭环：Issue/Project 或直接任务上下文承载意图和工作项，Agent Note 承载持久决策理由，Plan Mode 承载一次会话中的设计与批准交互，源码/README 承载当前行为，测试与 snapshots 承载可复核行为证据，GitHub policy/review/CI 承载远端交付状态，Git 历史承载最终落地序列。它们不是同一份 spec 的不同章节。

前次研究需要收窄两条结论：

- “没有独立 evaluator”过强。DSH 有独立于目标运行时的 PR approval evaluator：`weighted-approval` 计算批准分数并发布 `pending/success/error`；Issue policy 也执行可机检的元数据校验，CI gates 评估测试、构建、文档、覆盖率和平台信号。准确说法是：没有发现专门针对任意自然语言 goal 的“完成声明是否真实、验收项是否满足”的独立语义裁判。
- “没有 backlog”错误。DSH Project 配置明确包含 `Backlog`，并有 `Inbox → Backlog → Ready → In progress → In review → Done/No action` 状态。准确说法是：没有发现由 DSH runtime 的 `goal` 或 `todo` 提供的跨 feature backlog；仓库贡献制度的 backlog 在 GitHub Project 中，`Backlog`/`Ready` 主要由项目管理手工推进。

## 本轮研究主线：单笔变更的 owner 与证据

用户已明确把 OpenSpec 仅作为可控性体感参照，并从本轮问题中剔除 roadmap、backlog 和跨 feature 排序。下文保留 Project 机制作为对前次事实错误的纠正；它不构成本轮对测试资产和评估问题的解释或方案。

DSH 的 owner 用法需要按对象区分。文档层级的 owner 是某类事实的维护位置；插件的 owner 是行为、注册与资源的实现主体；测试场景的 owner 是维护该场景及预期结果的唯一来源。它们不是一套统一的人员职位，也没有证据支持把“acceptance owner”作为 DSH 的正式术语。

- **知识归属**：`docs/AGENTS.md` 的 one-home 规则要求每类事实放在职责对应的层级，其他位置链接它。源码、README、类型与测试分别表达实现、使用义务、接口和行为证据；一个权威来源不等于只准存在一个文件。
- **实现与生命周期归属**：`packages/AGENTS.md` 要求行为留在拥有它的插件或服务；注册是 effect，注册者拥有 disposer。能力的 Service Definition、Provider、Consumer 各有职责，只有角色独立演化时才拆包（`docs/architecture.md:131-135`）。
- **测试资产归属**：`docs/testing.md:9,12,14,55` 区分代码旁的测试、owner-local expected output 与 session-driven snapshot。`snapshots/AGENTS.md:7` 规定只有场景 owner 记录或刷新所选 Session，共享引用只读且无环；`:15` 要求工作区变更与独立的 `workspace.expected/` 比较，record/refresh 不重写该预期。
- **评估责任**：测试检查指定行为，review 检查行为声称、测试选择和意图是否对齐，PR Testing/Proof 呈现实际执行证据。三者都需要；记录完成不自动建立这些属性。

这些规定没有建立一条固定的 test-first 阶段序列。`docs/testing.md:55` 要求在计划时明确必要测试层；实现、文档和行为证据在同一变更交付。unit、snapshot、real composition、e2e 和 invariant 按可观察对象分工，不能把它们机械排列成每笔变更都必须依次执行的阶段。

## 一、机制归属

### 1. 产品 runtime：会话内工作控制

`packages/goal/README.md:10-12` 将 goal 定义为每个 session 一个 durable completion objective，可跨 restart、resume、fork；模型和人可以更新它，continuation package 可把 active goal 变成 sequential rounds；但每个 session 只有一个 current goal，goal 记录 completion state 而非 scheduling work，自动 continuation 还要单独启用。这是运行时协作状态，不是跨 feature 工作池。

`packages/goal/tool-goal/src/index.ts:51-56` 规定 `create_goal` 用于 direct human request 的 long-running objective，而不是 single-turn work；`guidance()` 在 `:114-123` 要求目标实际达成才 complete，只有同一阻塞条件至少持续配置轮数才 block，困难、不确定或尚有有用工作不算 blocked。`update_goal` 的 authority、revision、block threshold 和 durable mutation 在 `:255-331` 执行；这些是权限、并发版本和状态合法性约束，不是对业务结果的独立判定。

`packages/goal/goal-round-driver/src/prompt.ts:18-23` 要求模型检查当前 workspace、tool results 和 durable state，取得 whole-objective evidence 后再 complete；`packages/goal/goal-round-driver/src/index.ts:102-205` 负责 agent live/idle、竞争消息、checkpoint、round cap、队列失败和 disarm。`packages/goal/goal/src/domain.ts:13-44,70-90` 的 durable vocabulary 只有 create/edit/pause/resume/complete/block/clear、轮次 attribution 和 replay fold，没有 feature queue、acceptance-item 或 evaluator-result 字段。

`packages/todo/README.md:10-12,25-37` 的 todo 是 session-level task list：add、in progress、check off，跨 turns/reopened sessions 持久化；每次 update 替换整个列表。它是模型协作的可见计划，不是 GitHub backlog，也不负责证明完成。

`packages/plan/README.md:10-12,25-39` 的 plan mode 在执行前探索和设计，完成计划后交给用户 approval，也可以继续 planning；但它是 guidance rather than restriction，tool availability、sandbox 和 approval prompts 另行配置。它提供一次会话内的设计/批准点，不是仓库 PR approval 或 Project 状态。

`packages/skill/README.md:10-12,25-42` 的 skill runtime 负责发现、加载可复用 instruction catalog；技能是上下文加载和行为规范，不是持久 work item。仓库 `.agents/skills/` 另有贡献者工作流，例如 `dsh-code-review/SKILL.md:22-49` 要求语义评审、文档匹配、真实入口、负例和 snapshot 证据；`dsh-pre-push-checks/SKILL.md:28-40` 选择与改动表面匹配的最小检查。

### 2. DSH repo 贡献制度：意图、设计、审批和交付

Issue 模板提供最小意图输入：Bug 要 Summary/Reproduction/Current behavior/Expected behavior/Environment（`.github/ISSUE_TEMPLATE/bug.md:7-25`）；Feature 要 Motivation/Behavior（`feature.md:7-13`）；Task 要 Summary/Deliverables（`task.md:7-13`）。PR 模板要求 Motivation 中引用 `Fixes #NN` 或 `Related #NN`，Changes 分别写命令/配置/API/协议/持久化和可观察行为，Testing 每种方法附可复核 Proof（`.github/pull_request_template.md:1-21`）。模板是写作入口，真正强制性由 policy/workflow 提供。

Issue policy README 说明非 draft、human-authored 且已有 review request/review 的 PR 必须进入校验；合格 PR 至少有同仓库 Issue、一个 canonical `kind/*`、一个 `area/*`，并满足 priority 规则（`.github/issue-management/README.md:24-37`）。`issue-policy.yml:19-58` 从 default branch checkout trusted policy，最后重新读取 live state；这避免 PR 自己修改 policy 来改变自己的判定。

Backlog 证据是直接配置而非推测：`.github/issue-management/config.json:1-18` 定义 Project `DSH Issue Management`，状态包含 `Inbox`, `Backlog`, `Ready`, `In progress`, `In review`, `Done`, `No action`。生命周期 workflow 订阅 Issue、PR、review 事件（`.github/workflows/issue-lifecycle.yml:3-24`），并由 `policy.mjs lifecycle` 写 Project（`:41-57`）。权威说明指出 PR body/打开可把 resolving Issue 推到 `In progress`，review request 到 `In review`，changes requested 回 `In progress`，关闭原因决定 `Done`/`No action`（`.github/issue-management/README.md:41-57`）。这是事件驱动而非 reconciler，漏事件不会修复状态，`Backlog`/`Ready` 的推进仍主要是人工项目管理。

设计与批准不是一个机制。Agent Notes 的生命周期是持久决策记录：`.agents/notes/README.md:9-19` 定义 `proposed/implemented/rejected`，`:21-34` 定义 feature/bug-fix/architecture/process/testing 等 class，`:44-52` 要求只有代码、测试和现有文档无法承载的 lasting rationale 才写 Note，`:76-103` 要求 proposed 使用 Problem/Proposal/Alternatives/Acceptance criteria/Risks，implemented 改为现状式 Decision/Consequences。它不是 backlog，也不是每次改动都要创建的 RFC。

PR approval 有真正的 evaluator。`.github/review-ownership/README.md:15-31` 规定 weighted-approval workflow 读取当前 reviews、权限、作者历史和必要时 production-line blame，发布 commit status；低于 2 分、draft 或 blocking changes requested 为 pending，满足阈值且 ready 且无 blocker 才 success，评估失败为 error。`approval-policy.json:1-12` 将 requiredPoints 设为 2，并列出 2-point reviewers。`weighted-approval.yml:3-66` 监听 PR、delegate comment 和 review-event，先撤销旧 status 为 pending，再执行 trusted default-branch evaluator 并发布结果。它评估“是否满足仓库批准门槛”，不评估“目标功能是否真实完成”。

语义评审仍是人/agent 判断，不被 approval score 替代。`dsh-code-review/SKILL.md:22-29,32-49` 明确自动 gate 不能建立 prose 语义正确性；reviewer 必须追踪意图、接口、生命周期、真实入口、负例、snapshot 和当前 Agent Note。这个分工说明“没有 goal evaluator”不能推出“没有任何 evaluator”。

### 3. CI/gates：测试资产、评估和完成证据

`docs/testing.md:7-17` 定义 unit、coverage、real-API e2e、owner-local expected output、benchmarks、session snapshot 和 Web browser snapshot tiers；`:19-35` 规定并发 worker、资源 teardown 和 external-world assertion；`:37-51` 要求 product-visible plugin 通过 Loader/app/process 的真实 composition，而不是只用手工 `ctx.plugin()`。

`docs/testing.md:53-55` 要求每个非平凡 model/protocol/human-visible change 在同一 PR 添加或更新 keyless recorded-session scenario；headless、SDK、ACP、Web 各有 owner，agent-loop/session-lifecycle/SessionEventMap 还要更新两个 SDK projection。这里的完成判定是“相关行为证据已落到正确测试资产并可 replay”，不是 goal phase 自己变成 complete。

`scripts/run-gates.ts:1-6,18-58` 将 gates 建模为有依赖、状态、输出、失败策略和可中止语义的 graph；CI workflow 的 static/coverage/artifact/consumer/benchmark/snapshot 等 lane 再组合这些 gate。`.github/workflows/ci.yml:21-56,102-108` 展示 PR CI 的可信 checkout、并发/取消策略和 static gate；`docs/development.md:124-136` 说明 hooks 只做窄检查，CI 拥有 exhaustive coverage、built-artifact smokes 和 Node/platform matrix。

因此测试资产承担“实现是否通过规定场景”的机器证据，但测试描述 behavior，不自动证明任意产品意图、模型输出质量或用户体验已经满足。前次报告中“goal 测试是机制正确性，不是任意目标质量 evaluator”的判断仍成立，但应放在这个更大的 repo evaluator 体系之内。

## 二、从意图到收尾的原生闭环

1. **意图进入。** 内部变更通常由 Bug/Feature/Task Issue、直接任务上下文、proposed Agent Note、FIXME/TODO/XXX 或 Dependabot PR 承载。`CONTRIBUTING.md:9-19` 说明当前不接受外部 PR；外部反馈走 Discussions，外部作者也可以独立开发并发布插件。
2. **范围与设计。** Issue/任务上下文说明可观察结果和交付物；需要持久 rationale 的重大决定进入 proposed Agent Note；一次会话若需要先探索和批准则进入 plan mode。根 `AGENTS.md:114-121,138-160` 将证据匹配、真实入口、snapshot、SDK projection 和 Agent Note 条件写为 standing orders。
3. **实现。** 新 runtime behavior 优先通过 documented plugin/event/capability extension points；根 `AGENTS.md:138-144` 明确“Plugins, not loop changes”，配置错误要尽早 loud failure。插件贡献由 effects 管理并在 unload/HMR 时清理（`docs/user/develop/basic/index.md:66-83`）。
4. **验证。** 按 changed surface 选 focused behavior test、snapshot、doc-sync、build smoke、real-API e2e 或相关 gate；`dsh-pre-push-checks/SKILL.md:28-50` 明确不能以重复全套测试代替表面匹配。测试要走 published Loader/bin/process 路径，且 e2e 要从外部世界观察结果（`docs/testing.md:33-41`）。
5. **评审与批准。** PR body 提供 Issue/Changes/Testing/Proof；Issue policy 验证 metadata；semantic review 检查意图、架构、失败和证据；weighted approval 计算可机检的批准 status；CI 发布静态、覆盖率、构建、快照和平台结果。三者回答不同问题，不能互相替代。
6. **完成与收尾。** PR merge 和 Issue close 是远端交付状态；Issue lifecycle 将关闭原因映射为 Done 或 No action（`.github/issue-management/README.md:44-57`）。实现 Agent Note 必须改写为 shipped present tense，并保持与代码同步（`.agents/notes/README.md:11-14,93-103,119-121`）。若有已完成但仍具历史价值的 Note，可按 archive 规则封存；archive 后冻结，不再作为 current authority（`:36-42`）。
7. **跨 feature 接续。** GitHub Project 的 Backlog/Ready/Issue references 负责跨 feature 可见性；同一 Session 的 goal/todo/plan 只负责 session 内协作。新 PR 可继续引用 Issue，Agent Notes 通过相对链接保持决策连续性，Git history/stack rules 保持分支和 merge-forward 的可追踪性。没有证据表明 runtime 会自动从 Project Issue 分派 goal 给 agent；这正是“repo work item”与“runtime collaboration state”的边界。

## 三、插件作者适用边界

插件作者共享的是 runtime extension contract 和验证方法，不自动继承 DSH 内部 GitHub Project、approval policy 或 release workflow。`docs/user/develop/basic/index.md:15-29` 定义最小插件为导出 `apply(ctx)` 的 TypeScript module；`:46-64` 用 `cordis.yml` patch 加载本地插件；`:87-103` 用 `inject` 声明依赖。作者应使用 effect cleanup、明确 config、真实 Loader composition 和外部可观察断言。

发布路径是 plugin → bundle → profile，而不是 DSH repo 的 PR → CI → merge。`docs/user/develop/basic/publish.md:9-16` 区分 bundle（贡献 configuration layer）和 profile（用户可运行 composition）；`:75-116` 描述 `dsh plugin --profile <name> add`、bundle list、dump-config 和 remove；`:118-134` 定义层顺序与用户 override。插件仓可以采用 DSH 的模型、测试、文档和 runtime 词汇，但 DSH 没有要求外部仓复制根 `AGENTS.md`、Agent Notes 树、GitHub Project 或加权审批制度。

插件作者的适用“完成”应是自己的可观察契约完成：Loader 能加载、配置失败能 loud fail、真实 tool pipeline/持久状态/用户输出符合预期、必要 snapshot/e2e/README 已更新。本轮不讨论跨 feature roadmap。测试资产和评估应沿单笔变更的实际 owner、真实入口、独立预期结果与语义 review 核对；不能用 Session goal 的完成状态替代这些证据。

## 四、对“独立 evaluator / backlog”结论的精确修订

| 说法 | 证据支持的精确版本 |
|---|---|
| “DSH 没有独立 evaluator” | DSH 没有发现针对任意自然语言 goal 的独立语义完成裁判；但 PR approval、Issue policy、CI gates、coverage/snapshot/real-entry checks 都是不同层面的 evaluator。 |
| “DSH 没有 backlog” | DSH runtime 的 goal/todo 不是跨 feature backlog；repo Project 明确有 Backlog 和 Ready，并由 Issue lifecycle/workflow 管理部分自动状态。 |
| “goal 没有完成判定” | goal 有 model guidance、authority、revision、round cap、block threshold 和 durable complete phase；缺的是独立业务验收，不是完全没有判定。 |
| “设计没有批准” | plan mode 有 finished-plan approval；PR 有 semantic review 和 weighted approval；这些 approval 作用域不同，不能合并成一个统一阶段门。 |
| “测试不支持完成判断” | 测试支持特定行为和交付表面的完成证据，尤其是真实入口、snapshot 和外部世界断言；它不自动证明任意目标的整体语义完成。 |

## 证据限制

本报告只陈述当前 checkout 中可读取的机制。GitHub Project 的人工操作、真实远端 review 参与者和 Actions 运行结果不等于本地源码中的历史证据；workflow 与 policy 文件证明设计和执行入口，不能单独证明每一次远端事件都成功送达。报告没有把 `_faq_on_digested/` 的 OpenSpec 讨论作为 DSH 方案来源。
