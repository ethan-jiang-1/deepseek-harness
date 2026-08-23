# 01 · 完整 spec 路径总览

## 先看整条链

DSH 的修改 spec 不是单文件，而是按阶段流动：

```text
意图/验收
  → 设计决策
  → 实施计划
  → 实现
  → 当前合同（docs/types/README）
  → 行为证据（tests/snapshots/invariants）
  → 交付决定（implemented Note）
  → review / archive
```

每一段都有明确 home：

| 阶段 | home |
|---|---|
| 意图/验收 | `.github/ISSUE_TEMPLATE/feature.md`、`bug.md`、`task.md` |
| 设计决策 | `.agents/notes/proposed/` |
| 实施计划 | Plan Mode、plan review |
| 实现 | `packages/`、`vendor/`、`python/` 等 |
| 当前合同 | `docs/`、types、JSDoc、package README |
| 行为证据 | package tests、real composition、snapshots、invariants |
| 交付决定 | `.agents/notes/implemented/` |
| 语义兜底 | `.agents/skills/dsh-code-review`、`dsh-prose-standard` |

## 一条链，两个时态

这条路径最有意思的是**时态变化**：

- 前端是未来式：Issue 说“应该”，proposed Note 说“Proposal / Acceptance criteria / Risks”；
- 后端是现在式：docs 写 current state，implemented Note 写 `Decision / Consequences`。

`.agents/notes/README.md` 明确：

> `proposed/` → `implemented/` rewrites `## Proposal` into a present-tense `## Decision`, folds `## Acceptance criteria` and `## Risks` into `## Consequences` ... and drops plans in favor of what shipped.

来源：`.agents/notes/README.md:121`

## 顺序本身就是路径

这条路径的顺序是固定的：

1. 先有意图和决策；
2. 再有实现；
3. 然后把当前状态写回 docs/types/README；
4. 最后把交付决定写成 implemented Note。

所以 04 讲“系统怎么说清楚自己”，05 讲“系统怎么在修改中更新自己”。docs 是这条修改路径中的**当前合同层**。

## 与 `04_root-entry-documentation` 的衔接

04 说“一个事实一个家”；05 的完整路径等于说：

```text
修改的每个阶段也有一个家。
Issue 的家是 .github；
决策的家是 proposed notes；
计划的家是 Plan Mode；
当前合同的家是 docs/types/README；
行为的家是 tests/snapshots；
交付决定的家是 implemented notes。
```

两者共用同一个原则：**先路由，再表达。**

## 证据入口

- [`.github/ISSUE_TEMPLATE/feature.md`](../../.github/ISSUE_TEMPLATE/feature.md)
- [`.agents/notes/README.md`](../../.agents/notes/README.md) 第 12、46、80-121 行
- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 38、45 行
- [`docs/testing.md`](../../docs/testing.md) 第 27-49 行
