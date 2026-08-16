# Research Notes: DSH 可能采用的 Spec-Driven Development

产品源码核验基线：DeepSeek Harness `0.1.0-rc.5`，commit `47f943859bef60e4160492346772ded9b24f765a`。开发过程另查该 commit 之前的 git 历史。本文件只记录一手证据、历史样本、推断等级和限制；综合回答见 [`answer.md`](./answer.md)。

## 核心结论

仓库没有明确自称采用 “Spec-Driven Development”、`spec-driven`、`specification-driven` 或 `SDD`。在当前有效的 `AGENTS.md`、`.github/`、`.agents/`、`docs/`、`packages/`、`apps/`、`scripts/` 中排除归档、快照和测试夹具后，精确搜索这些词没有结果；Git 提交主题和字符串历史也没有形成一份以 SDD 命名的方法论文档。因此，“DSH 靠 SDD”不能作为仓库明文事实，只能从实际机制反推。

最有根据的反推是：DSH 采用的是一套**分布式、生命周期化、可执行的规格闭环**，而不是一份大而全的 canonical spec。Issue、Agent Note、Plan Mode、代码与文档、行为证据和工程门禁分别拥有不同种类的事实，review 负责判断它们在语义上是否一致。实现完成后，proposal 不继续充当任务清单，而改写为当前态的 Decision、Consequences 和 Verification/Testing。主路径、反馈环和合法旁路见[主回答中的流程图](./answer.md#结论先行)。

## 直接证据

### 1. 工作入口先写可观察结果和验收证据

Feature Issue 模板要求一句话预期结果，并在折叠区写“验收条件、用户或模型可见变化、测试证据” [`.github/ISSUE_TEMPLATE/feature.md:11`](../../.github/ISSUE_TEMPLATE/feature.md)。Task 模板要求“验收条件、交付物、测试证据” [`.github/ISSUE_TEMPLATE/task.md:11`](../../.github/ISSUE_TEMPLATE/task.md)。Bug 模板要求复现、实际结果、预期结果和验收条件 [`.github/ISSUE_TEMPLATE/bug.md:11`](../../.github/ISSUE_TEMPLATE/bug.md)。Research 模板则把问题、证据标准和交付结论分开 [`.github/ISSUE_TEMPLATE/research.md:11`](../../.github/ISSUE_TEMPLATE/research.md)。

非 Draft 的人类 PR 进入评审时，PR 模板要求关联同仓库 Issue，并列出变更和验证 [`.github/pull_request_template.md:1`](../../.github/pull_request_template.md)。Issue policy 会解析同仓库引用，并在适用时拒绝没有 Issue 引用的 PR [`.github/issue-management/policy.mjs:157`](../../.github/issue-management/policy.mjs)、[`.github/issue-management/policy.mjs:331`](../../.github/issue-management/policy.mjs)；Issue lifecycle 又把普通实现事件映射到 `In progress`，把 review request 映射到 `In review`，把 changes requested 映射回 `In progress` [`.github/issue-management/policy.mjs:178`](../../.github/issue-management/policy.mjs)、[`.agents/notes/implemented/process/2026-08-10-event-directed-pr-review-status.md:13`](../../.agents/notes/implemented/process/2026-08-10-event-directed-pr-review-status.md)。

限制：机器 policy 并不解析“验收条件”或“测试证据”是否填写充分。`validateBody()` 机械检查的是折叠区、外露长度和 Owner/Assignees 一致性 [`.github/issue-management/policy.mjs:122`](../../.github/issue-management/policy.mjs)，PR policy 强制的是 Issue 引用和元数据，不是 Issue 规格质量。因此 Issue 层的语义质量仍由作者和 review 负责。

### 2. Agent Note 是 proposal/decision 的生命周期记录

Agent Note 的自我定义是记录影响代码库的“决定或提案”，保存代码和普通文档无法承载的 why 与 trade-off [`.agents/notes/README.md:1`](../../.agents/notes/README.md)。每个非平凡变更必须在同一 PR 新增或更新至少一个 Agent Note；非平凡包括行为、架构、跨文件/包义务、流程、测试策略以及磁盘、wire、配置格式等 [`.agents/notes/README.md:44`](../../.agents/notes/README.md)、[`AGENTS.md:121`](../../AGENTS.md)。

`proposed/` 明确表示实施前评审、尚未构建或只部分构建；`implemented/` 表示已经交付且必须随真实实现保持当前；`rejected/` 保存被否决的提案 [`.agents/notes/README.md:7`](../../.agents/notes/README.md)。但规则同时明确：重大未来工作从 `proposed/` 开始，已经做出的决定可以直接从 `implemented/` 开始 [`.agents/notes/README.md:44`](../../.agents/notes/README.md)。所以它不是“所有代码都必须先有一份 proposal”的刚性瀑布流程。

提案期的固定骨架是 `Problem -> Proposal -> Alternatives considered -> Acceptance criteria -> Risks`，其中 acceptance criteria 的定义就是“什么可观察状态意味着完成” [`.agents/notes/README.md:76`](../../.agents/notes/README.md)。当前 proposed 样本“Semantic phases for composer-chain election”把完成条件逐层分解为纯逻辑测试、组合交互矩阵、HMR/重连、keyless Web snapshot、README/JSDoc，以及模型请求头不变 [`.agents/notes/proposed/architecture/2026-08-08-semantic-composer-chain-phases.md:33`](../../.agents/notes/proposed/architecture/2026-08-08-semantic-composer-chain-phases.md)。这直接显示 acceptance criteria 会提前指定证据层级，而不只是写一句“功能可用”。

实现期的骨架改为 `Problem -> Decision -> Alternatives considered -> Consequences`，并允许现在时的 Testing/Verification；Proposal、Plan、Migration plan、Acceptance criteria 这些提案期标题在 implemented Note 中被禁止 [`.agents/notes/README.md:93`](../../.agents/notes/README.md)。`proposed -> implemented` 必须在同一变更中把未来态 Proposal 改写成当前态 Decision，并把 acceptance/risk 折入 Consequences 或 Verification/Testing [`.agents/notes/README.md:119`](../../.agents/notes/README.md)。`verify-agent-note-format` 机械要求 proposed 的 Acceptance criteria、implemented 的 Decision/Consequences，并拒绝 implemented 中的 proposal-era 标题 [`scripts/verify-agent-note-format.ts:21`](../../scripts/verify-agent-note-format.ts)。

Agent Note 的存在性边界不是 CI 自动分类。该政策的 owning Note 明说“Review enforces the semantic boundary”，不会由自动 gate 判断一个 diff 是否 non-trivial [`.agents/notes/implemented/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:21`](../../.agents/notes/implemented/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md)。机器能保证格式、状态、分类和配对，不能保证“这个 PR 本来就应该有 Note”。

### 3. Plan Mode 把“先规格、后执行”做成产品行为

Code preset 的 Plan Mode 提示明确要求先只读探索，禁止编辑、写配置、运行会改文件的 formatter/codegen 或实施计划 [apps/cli config:121](../../apps/cli/config/agent-presets/code/agent.cordis.yml)。计划必须是 decision-complete：写目标和成功标准，按 subsystem 分组修改，指出 public API、schema、data flow，覆盖边界、失败模式、测试、验收条件和显式假设，并详细到另一位工程师无需再做设计决策即可实施 [apps/cli config:127](../../apps/cli/config/agent-presets/code/agent.cordis.yml)。

同一提示把计划与实施清楚分开：`todo_write` 只跟踪批准后的实施，完整计划必须通过 `exit_plan_mode` 提交；实现只能在批准后的后续 step 开始；拒绝后要吸收反馈重新提交；review channel 不可用时必须保持 Plan Mode 而不能继续实施 [apps/cli config:125](../../apps/cli/config/agent-presets/code/agent.cordis.yml)、[apps/cli config:131](../../apps/cli/config/agent-presets/code/agent.cordis.yml)。

这不只是一段软提示。Plan Mode 状态写入 session log，resume/fork 可恢复 [packages/plan/plan-mode/src/index.ts:1](../../packages/plan/plan-mode/src/index.ts)；`exit_plan_mode` 要求完整 Markdown 计划，校验 H1，通过 user-questions channel 展示计划，提供 Approve/Keep planning，只有严格批准才安排退出模式，其他回答返回模型继续修订 [packages/plan/plan-mode/src/index.ts:305](../../packages/plan/plan-mode/src/index.ts)。真实 Web e2e 会进入 Plan Mode、等待 review 卡片、点击 Approve，并验证工具结果、后续 `DONE`、模式退出和 keyless golden [apps/web/tests/plan-review.e2e.ts:66](../../apps/web/tests/plan-review.e2e.ts)。

限制：Plan Mode 是会话可选状态，不是 Git 历史能够证明的“每一位 DSH 贡献者每次都用它”。它强有力地证明 DSH 产品原生支持一种 spec-first agent workflow，但不能单独证明整个仓库的每个 PR 都由该模式产生。

### 4. “规格”实施后分散到当前代码义务、文档和可执行证据中

根规则要求测试描述 behavior 而非抽象“正确性”，改变旧行为时要连同测试一起改 [AGENTS.md:121](../../AGENTS.md)。代码变更必须同步更新受影响 README 和 JSDoc；所有 public export 的非显然义务必须有 JSDoc，并由 `verify-export-jsdoc` 检查 [AGENTS.md:135](../../AGENTS.md)。Review 要追踪接口两端，确认实现符合 PR 和 Agent Note，包括错误、取消、所有权和 disposal [`.agents/skills/dsh-code-review/SKILL.md:29`](../../.agents/skills/dsh-code-review/SKILL.md)。

模型或用户可见行为有更强的 executable-spec 要求：每个非平凡 model/protocol/human-visible 变更都要在同一 PR 通过真实 runnable example 新增或更新 keyless scenario，package tests、mock-only 组合和 PR rationale 都不能替代 assembled transcript [docs/testing.md:47](../../docs/testing.md)、[AGENTS.md:123](../../AGENTS.md)。新 capability、lifecycle variant 或 transcript surface 要在计划阶段点名 unit、e2e、snapshot 层，并先确认 harness 能表达它 [docs/testing.md:47](../../docs/testing.md)。

测试策略反复要求观察外部世界而不是相信 agent 自述，并要求测试真实 Loader/bin/worker/bridge 入口 [docs/testing.md:27](../../docs/testing.md)、[docs/testing.md:31](../../docs/testing.md)。Coverage 只是必要非充分证据；snapshot 固定 transport、presentation 和持久化日志；with-key e2e 才证明真实模型调用链 [docs/testing.md:7](../../docs/testing.md)。这说明“acceptance”在 DSH 中通常被拆成最贴近行为表面的多种证据，而不是由一个测试层垄断。

### 5. 能机械化的规格会被变成 gate 或 freshness check

根规则要求把可机械检查的不变量接入执行中的顶层 gate，并为每条改变的 acceptance path 证明无效输入会被拒绝 [AGENTS.md:139](../../AGENTS.md)。质量门禁决策说明其出发点：代码库主要由 coding agents 开发，agent 对 enforced gates 比 prose conventions 更可靠，因此每个可机械检查的 AGENTS promise 都应有非零退出命令，CI 运行完整集合 [`.agents/notes/implemented/process/2026-06-11-quality-gates.md:9`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)。

`run-gates.ts` 的 CI 聚合包含 typecheck、lint、duplication、coverage、snapshot、doc-sync、module graph、knip、build、publint、built-package invariants 和真实 build-entry smokes [`scripts/run-gates.ts:256`](../../scripts/run-gates.ts)。`doc-sync` 本身包含源码导出的 Cordis/client/tool/config/persistence catalogs、新鲜度检查、export JSDoc、scoped events、Markdown links、package paths、Agent Note classification/format、type equivalence、translation pairing 和 docs build [`scripts/run-gates.ts:571`](../../scripts/run-gates.ts)。

生成物在这里是 derivative evidence，不是另一个人工维护的 spec。文档规范把 Cordis API、tool/config/persistence catalog、module graph 定义为从源码生成且 freshness-gated 的 reference，禁止手改生成源 [docs/AGENTS.md:25](../../docs/AGENTS.md)。相应 `package.json` 脚本以 `gen-*.ts --check` 验证 Cordis、tool、config、persistence 和 module graph 是否与源一致 [package.json:104](../../package.json)。这更接近“源码类型/JSDoc 是可执行接口说明，生成物是投影”，而不是“先写外部 schema 再生成全部实现”。

### 6. Review 负责 spec 与实现之间机器不能判断的部分

Review 的 sources of truth 包括 AGENTS、defensive patterns、testing policy、quality-gates Note 和 Agent Notes [`.agents/skills/dsh-code-review/SKILL.md:10`](../../.agents/skills/dsh-code-review/SKILL.md)。Blocking requirements 要求 docs 与 code 同步、必要证据存在；manual checks 要求实现匹配 PR 与 Agent Note、检查真实入口、确认断言真的观察外部状态、让 invalid case 在真实 runner 中失败，并在实现 proposal 时同 diff 移动和改写 Agent Note [`.agents/skills/dsh-code-review/SKILL.md:20`](../../.agents/skills/dsh-code-review/SKILL.md)、[`.agents/skills/dsh-code-review/SKILL.md:40`](../../.agents/skills/dsh-code-review/SKILL.md)。Editor/model-visible 变更必须更新 snapshot 或解释为什么不需要，expected output diff 被当作 behavior change 审阅 [`.agents/skills/dsh-code-review/SKILL.md:43`](../../.agents/skills/dsh-code-review/SKILL.md)。

因此，DSH 的闭环不是“有绿灯就等于符合规格”。Review skill 明说 automated checks 不能证明 prose 的准确性和语义质量 [`.agents/skills/dsh-code-review/SKILL.md:20`](../../.agents/skills/dsh-code-review/SKILL.md)，testing policy 也明说 coverage 不能证明 feature 按发布形态工作 [docs/testing.md:9](../../docs/testing.md)。机器负责可判定一致性，人负责 scope、intent、trade-off 和 evidence strength。

## Git 历史实例

### proposed -> implemented：Remote event delivery

`7c8ee81818cd68cd3c120ed505c8b665fdcabbb7`（`docs(agent-note): propose Remote event delivery via ctx.remote.$on`）只新增 proposed Agent Note 的英中两侧，先记录设计、替代项、验收与风险。`01ecb43ebcdb304543c84d8c414f755b7e2cc468` 随后以 `R060` 把英文 Note 从 `proposed/architecture/` 移到 `implemented/architecture/`，同时改写为当前态 Decision/Verification/Consequences，并在同一提交修改 135 个文件：Remote API、wire 类型、Host/Client 实现、单测、browser e2e、README、subsystem docs、type-equiv manifest、module graph 和 persistence catalog。验证命令：

```sh
git log --all --follow --name-status -- .agents/notes/implemented/architecture/2026-08-10-remote-event-delivery.md
git show --stat 7c8ee81818cd68cd3c120ed505c8b665fdcabbb7
git show --stat 01ecb43ebcdb304543c84d8c414f755b7e2cc468
```

这是最清楚的“先 proposal spec，再实现并重写成 living decision record”的实证。当前 Note 的 Verification 仍列出真实组合、type-level negatives、branded type、disposal、listener containment、frame ordering、JSON safety 和旧路径删除等现时证据 [remote-event Note: Verification](../../.agents/notes/implemented/architecture/2026-08-10-remote-event-delivery.md)。

### proposed -> rejected：Drop durable step boundary events

`cc47f76cea0f83f0381a1ea71f15101402c99f46` 新增 proposed RFC；经过两轮 review 修改后，`7f2769c529b10a6d174447555e02aac29666e0b7` 把它从 `proposed/` 移到 `rejected/`。当前 rejected Agent Note 保留原 Proposal 与 Acceptance criteria，并在 Status 和 “What we give up” 中记录为什么没有实施：`step/end` 是模型 step 完成的持久证据，移除会削弱 crash repair、invariants 和 transcript inspection [rejected Note:3](../../.agents/notes/rejected/simplification/2026-06-20-drop-durable-step-boundaries.md)、[rejected Note:19](../../.agents/notes/rejected/simplification/2026-06-20-drop-durable-step-boundaries.md)。验证命令：

```sh
git log --all --follow --name-status -- .agents/notes/rejected/simplification/2026-06-20-drop-durable-step-boundaries.md
git show --stat cc47f76cea0f83f0381a1ea71f15101402c99f46
git show --stat 7f2769c529b10a6d174447555e02aac29666e0b7
```

这说明 spec 生命周期真的允许“在写代码前否决”，而 rejected 文档的价值是阻止将来重复一个有诱惑力但已被证明代价过高的方案。

### 决定已定，implemented Note 与实现同提交：Plan review presentation

`2363ef01eb14560ecce3cdede09b48a3280122e5`（`feat(web): render a plan review as a decision card, not a quiz`）直接新增 implemented Agent Note，同时新增 UI 实现、221 行 component tests、真实 Web e2e、session fixture 和 waiting/approved 两份 golden；它符合“decision already made starts in implemented”的合法路径。`6d7bd7e703a024d4a437a28ba1e5f151ec77b2a2` 后续修复 presentation narrowing 时又同步更新同一 Note、文档和 tests。当前 Note 的 Testing 仍明确列出 unit/schema/plan-mode/Web e2e 各层钉住的行为 [plan-review Note:51](../../.agents/notes/implemented/feature/2026-07-30-plan-review-presentation-intent.md)。验证命令：

```sh
git show --stat 2363ef01eb14560ecce3cdede09b48a3280122e5
git show --stat 6d7bd7e703a024d4a437a28ba1e5f151ec77b2a2
```

## 推断分级

| 等级 | 可以成立的命题 | 理由 |
|---|---|---|
| 明确事实 | 仓库没有以 SDD 自称 | 当前权威目录与 Git 搜索均无该术语或方法论文档 |
| 明确事实 | proposed Agent Note 是实施前 proposal，必须有 observable acceptance criteria、alternatives 和 risks | 生命周期和格式由 README 定义，格式 gate 强制 |
| 明确事实 | non-trivial change 同 PR 必须有 Agent Note，但是否 non-trivial 由 review 判断 | owning policy 明确拒绝自动 diff classification |
| 明确事实 | Plan Mode 要求只读调查、decision-complete plan 和显式人类批准，批准前不能实施 | preset prompt、tool implementation、session-log state 和真实 Web e2e 一致 |
| 明确事实 | 可见行为需要 real-composition keyless snapshot；新 capability/lifecycle 在计划期点名证据层 | root rule 与 testing policy 明文要求 |
| 明确事实 | 可机械判断的义务进入顶层 gates；生成 docs/catalogs 由源码投影并检查新鲜度 | quality-gates Note、run-gates 和 `--check` generators |
| 明确事实 | Review 要核对实现与 PR/Agent Note/interface obligations，并审查 snapshot 作为行为变化 | dsh-code-review skill 明文要求 |
| 强推断 | DSH 实际采用“分布式 living/executable spec”而非单一 spec 文件 | 意图、决策、接口、行为证据分别有 owner，并由 lifecycle、review 和 gates 串联 |
| 强推断 | 它更像 acceptance/contract-driven development 加上 agent-native planning，而不是传统文档先行瀑布 | acceptance criteria 直接绑定测试层，implemented Note 去掉任务清单、只保留当前事实与验证 |
| 强推断 | 对 coding agents 而言，gate 是规格的一部分而不是实施后的附属检查 | quality-gates Note 明说 agents 更可靠地遵守 enforced gates，并要求每个可判定义务有命令 |
| 弱推断 | DSH 的每个 PR 都严格先写 Issue、proposal Note、Plan Mode 再编码 | 规则有 direct-implemented 和 mechanical/local 例外；Plan Mode 可选；机器人/Draft policy 也有豁免 |
| 弱推断 | Issue 中的 acceptance criteria 总是高质量且被机器执行 | policy 不解析这些字段的内容或完整性 |
| 不可推出 | DSH 采用某个业界标准 SDD 框架、OpenSpec/Spec Kit、BDD/Gherkin 或 TDD | 仓库没有相应声明；测试可以先于或随实现出现，历史不足以证明 red-green 顺序 |
| 不可推出 | 代码由 spec 自动生成 | 实际是部分 references/catalogs 从源码类型/JSDoc 生成；实现本身主要手写 |
| 不可推出 | 上游组织对所有内部仓库都采用相同方法 | 当前证据只覆盖此仓库；本地 git 不含 Issue 正文，本次也未获得可独立核验的历史 Issue 正文 |

## 本次验证命令

```sh
rg -n -i '(spec[- ]driven|specification[- ]driven|\bSDD\b)' AGENTS.md .github .agents docs packages apps scripts --glob '!vendor/**' --glob '!.agents/notes/archived/**' --glob '!**/snapshots/**' --glob '!**/tests/fixtures/**'
git log --all -i --oneline --grep='spec[- ]driven\|specification[- ]driven\|\bSDD\b'
git log --all --follow --name-status -- .agents/notes/implemented/architecture/2026-08-10-remote-event-delivery.md
git log --all --follow --name-status -- .agents/notes/rejected/simplification/2026-06-20-drop-durable-step-boundaries.md
git show --stat 2363ef01eb14560ecce3cdede09b48a3280122e5
git status --short
```
