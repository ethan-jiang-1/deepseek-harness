# 01 · 完整落位路径总览

## 先看整条链

一次修改的记录不是单文件，而是按面分散、按逻辑顺序归位。这是**主路径，不是每次修改都经历的强制流水线**：

```text
意图
  → 设计决策
  → 实施计划（可选）
  → 实现 + 当前合同 + 行为证据 + 交付决定（同一变更）
  → review
  → archive（可选）
```

每一段都有明确 home 和适用边界：

| 面 | home | 适用边界 / 约束 |
|---|---|---|
| 意图与可观察行为 | `.github/ISSUE_TEMPLATE/feature.md`、`bug.md`、`task.md` | 模板入口（0.1.5 起只有 Bug / Feature / Task）；非 Draft 人类 PR 进入 review 后由 issue policy 强制引用 Issue |
| 设计决策 | `.agents/notes/proposed/` | 重大未来工作；已做出的决定可直接进 `implemented/` |
| 实施计划 | Plan Mode、plan review | 可选会话模式；批准才经 `exit_plan_mode` 退出 |
| 实现 | `packages/`、`apps/`、`vendor/`、`python/` 等 | 与合同/证据/note 同一变更 |
| 当前合同 | `docs/`、types、JSDoc、package README | current state，不写 change history |
| 行为证据 | package tests、real composition、snapshots、invariants | 按行为表面选真实入口与 snapshot |
| 交付决定 | `.agents/notes/implemented/` | 同 diff 改写为现在式，并随代码事实更新 |
| 语义兜底 | `.agents/skills/dsh-code-review`、`dsh-prose-standard` | 机器门禁不建立语义属性 |
| 归档收敛 | `.agents/notes/archived/`、`dsh-archive-agent-notes`、`verify-archived-agent-notes` | 可选；只用于低未来价值 note |

## 一条链，两个时态

这条路径最有意思的是**时态变化**：

- 前端是未来式：Issue 模板写动机与预期行为，proposed Note 写“Proposal / Acceptance criteria / Risks”；
- 后端是现在式：docs 写 current state，implemented Note 写 `Decision / Consequences`。

`.agents/notes/README.md` 明确：

> `proposed/` → `implemented/` rewrites `## Proposal` into a present-tense `## Decision`, folds `## Acceptance criteria` and `## Risks` into `## Consequences` ... and drops plans in favor of what shipped.

来源：`.agents/notes/README.md:121`

## 逻辑顺序 ≠ 多个先后 PR

这条路径的逻辑顺序是：

1. 先有意图和决策；
2. 再有实现；
3. 实现、docs/types/README、tests/snapshots 与 implemented Note 在**同一变更**落地；
4. review 和 archive 分别兜底与收敛。

所以 04 讲“系统怎么说清楚自己”，06 讲“系统怎么在修改中更新自己”。docs 是这条修改路径中的**当前合同层**。

## 与 `04_root-entry-doc-design` 的衔接

04 说“一个事实一个家”；06 的完整路径等于说：

```text
修改的每个面也有一个家。
Issue 的家是 .github；
决策的家是 proposed/implemented notes；
计划的家是 Plan Mode 会话；
当前合同的家是 docs/types/README；
行为的家是 tests/snapshots；
交付决定的家是 implemented notes。
```

两者共用同一个原则：**先路由，再表达。**

## 证据入口

- [`.github/ISSUE_TEMPLATE/feature.md`](../../.github/ISSUE_TEMPLATE/feature.md)
- [`.agents/notes/README.md`](../../.agents/notes/README.md) 第 12、46、80-121 行
- [`.github/issue-management/rules.mjs`](../../.github/issue-management/rules.mjs) 第 60-70、265 行
- [`docs/subsystems/plan.md`](../../docs/subsystems/plan.md) 第 5、33 行
- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 39、43 行
- [`docs/testing.md`](../../docs/testing.md) 第 27-55 行
