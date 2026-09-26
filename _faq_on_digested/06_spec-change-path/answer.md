# Answer · DSH 修改系统时，spec 从意图一路走到当前合同

## 一句话答案

DSH 的 spec 不是一份文档，而是一条**从意图到当前合同、再到交付决定和 review** 的主路径：

```text
Issue 模板（意图/验收）
  → proposed Agent Note（决策 spec，重大未来工作）
  → Plan Mode（实施 spec，可选会话模式）
  → implementation + docs/types/JSDoc/README + tests/snapshots/invariants
  → implemented Agent Note（交付后的决定）
  → review（语义兜底）
  → archive（可选生命周期收敛）
```

需要先划清强制边界：**只有“非平凡变更必须带 Agent Note”是每次非平凡修改都成立的规则**。Issue 模板是意图入口，但机器 policy 只在非 Draft 人类 PR 进入 review 后强制引用 Issue；proposed Note 只针对重大未来工作；Plan Mode 是可选状态，不是每个 PR 的历史都能证明用过它；实现、当前合同、行为证据和 implemented Note 必须同一变更交付；archive 只发生在低未来价值时。

`docs/` 在这条路径里是**当前合同层**。

## 完整路径的阶段

| 阶段 | 主要载体 | 回答 | 约束 / 适用条件 |
|---|---|---|---|
| 意图与可观察行为 | `.github/ISSUE_TEMPLATE/feature.md` 等 | 为什么要改、预期行为是什么（0.1.5 起模板只留 Motivation / Behavior；验收与测试证据改由 PR 的 Testing 节承载） | 模板固定字段；`issue-management/policy.mjs` 只在非 Draft 人类 PR 进入 review 后强制引用 Issue |
| 决策 | `proposed/` Agent Note | 为什么这样设计，什么方案输了，风险是什么 | 重大未来工作才走 `proposed/`；已定决策可直接 `implemented/`；Agent Note 格式由 gate 检查 |
| 计划 | Plan Mode | 改哪些子系统、API、schema、失败路径、测试 | 可选会话模式；`exit_plan_mode` 要求完整计划并取得用户批准，批准前不退出 |
| 实现 | `packages/`、`apps/`、`python/`、`vendor/` 等源码 | 实际改变行为 | 与当前合同、行为证据、Agent Note 同一 PR 交付 |
| 当前合同 | `docs/`、types、JSDoc、package README | 系统现在是什么 | 只写 current state；生成目录 freshness-gated |
| 行为规格 | tests、snapshots、real composition、invariants | 行为是否真的成立 | 真实入口、keyless snapshot、package invariant 等分层测试政策 |
| 交付决定 | `implemented/` Agent Note | 最终交付了什么，代价是什么 | 同 diff 从 `proposed/` 移动并改写为现在式；随代码事实保持 current |
| 语义兜底 | `dsh-code-review`、prose skills | 机器查不到的语义是否正确 | 自动化不建立语义属性；进入 review 的人类 PR 由 policy 单独约束 |
| 归档收敛 | `.agents/notes/archived/`、`dsh-archive-agent-notes` | 低未来价值的 implemented note 才冻结归档 | 可选；冻结后不作现行权威，文档门禁跳过 |

## `docs/` 在路径中的位置

DSH 的文档规则明确：

> **Document current state.**

来源：`docs/AGENTS.md:38`

`docs/` 被设计成**只写 now**。变更理由在 Agent Notes，变更过程在 git/PR，最终留下的当前状态才写进 docs。

所以，按**逻辑时态**看：

```text
proposed Note（未来式）
  → 实现 + 测试 + docs/types/README（现在式合同）+ implemented Note（现在式决定）
```

后四项不是四个先后 PR，而是同一变更里同时落地的四个面；`docs/` 是这条链落地的当前合同投影。

## 最关键的机制

1. **Issue 模板先固定外部可观察结果**；机器 policy 对 Issue 引用的强制只发生在“非 Draft 人类 PR 进入 review”之后，不把语义质量自动化。
2. **每个非平凡变更必须带 Agent Note**；重大未来工作先写 proposed Note，已经做出的决定可直接写 implemented Note。
3. **Plan Mode 使用时，把提案细化到 decision-complete**；它是软引导，写权限仍由 sandbox / approval policy 独立执行。
4. **实现同时更新代码、docs、README、JSDoc、tests/snapshots**；
5. **proposed → implemented 必须在同一 diff 改写时态**，不能把 proposal 原样留到交付后；
6. **review 检查机器门禁之外的语义**；
7. **archive 只对低未来价值 note 做生命周期收敛**。

## 真实例子

Web capability seam 在 git 历史里能看到证据完整的**核心段**：`proposed/` → 实现 commit → `implemented/`：

```text
a4091daa3d docs: propose web capability seam
  → docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md

d01f5f73b7 Add web capability seam: ctx.web, search/fetch providers, web tools
  → docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md
  → docs/architecture.md、packages/README.md、packages/web/**（README/src/tests）
```

Issue 与 GitHub review 不在 git tree 里，这个例子不能证明 Plan Mode 被使用；它证明的是“提案 → 实现 + 合同 + 行为证据 → implemented Note”这一段，而不是九个阶段全部。所以对“能否从头看到尾”的诚实回答是：仓库内 git 对象没有能覆盖九阶段的单一例子，Web capability seam 是核心段证据最完整的例子。详细见 [`05-example-web-capability-seam.md`](./05-example-web-capability-seam.md)。

## 继续阅读

- [`01-spec-path-overview.md`](./01-spec-path-overview.md)
- [`02-intent-decision-plan.md`](./02-intent-decision-plan.md)
- [`03-implementation-to-current-contract.md`](./03-implementation-to-current-contract.md)
- [`04-implemented-note-and-review.md`](./04-implemented-note-and-review.md)
- [`05-example-web-capability-seam.md`](./05-example-web-capability-seam.md)
- [`06-human-and-agent-roles.md`](./06-human-and-agent-roles.md)
- [`research.md`](./research.md)

## 后见（2026-09-26，FAQ 15 完成后补记）

本篇的强制边界段（"只有 Agent Note 是普遍义务"）与九阶段表在 [FAQ 15](../15_loop-engineering-vs-sdd/answer.md) 复核后仍然成立；修正四点：

1. **这条"主路径"是载体地图，不是门序**。除 Agent Note 同 diff 外，没有任何机制强迫在阶段之间停车审批——上游无 roadmap/队列文件、`.agents/notes/README.md:19` 禁集中 `INDEX.md`、Plan Mode 是可选审阅边界。把九段画成一条从意图到合同的"路径"，读者会自然读出 SDD 式阶段门的暗示；那是框架带来的，不是制度事实。SDD 工具真正在卖的"门 + 队列 + tasks"整层，是 DSH 刻意不造的（FAQ 15 的 01 篇）。
2. **行为面证据（FAQ 15 B4）**：owner 的 20 个采样会话中 plan mode 零进入；"开工即立卡 `notes/proposed/`"是 owner 09-24 因"看不见的工作等于没在做"的痛点后用规则补出来的习惯——即"proposed 先行"上游只有规则倡导（`.agents/notes/README.md:46`：「重大未来工作从 proposed/ 开始」）、无调度门禁；owner 用立卡纪律与 proposal-scheduled/graduated（company 09-22 起）把它变成机械拒绝。
3. **适用范围的区分**：本篇描述的是 DSH **仓库自身**的贡献流程（有 git 历史证据支撑）；"跟随 DSH 开发插件 repo"时，这套路径只有惯例可迁移性（FAQ 13："可迁移的原则，不是继承义务"），不构成义务。把前者当成后者的操作指南，是 FAQ 15 的出发点之一。
4. **「spec 地位」的去向（规模律视角）**：owner 指出「notes 的地位其实多少跟 Spec 一样」——按三职能拆分，本篇九段路径的载体各自接管其一：proposed/implemented Notes + ROADMAP 接**记忆**（读者以失忆的新 agent 会话为主）；Plan Mode 与拍板标记接**审批**（实践中实为 `ask_user_question`，见 FAQ 15 B4：20 会话 plan mode 零进入）；tests / snapshots / invariants 接**验收**。九段表因此应读作「三个职能在 DSH 里的机制分布图」，不是一条带门序的流水线。流程重量随**协调面**（失忆参与者数量）伸缩而非随人数：上游多真人 + 多 agent 全套都要；owner 单人多 agent 只留 agent 协调层——四档规模律见 [FAQ 15 · 05 篇](../15_loop-engineering-vs-sdd/05-control-points.md)。
