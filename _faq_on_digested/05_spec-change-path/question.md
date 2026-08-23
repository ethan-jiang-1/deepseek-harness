# Question 05 · DSH 修改系统的完整 SPEC 路径是什么？

## 背景

`04_root-entry-documentation` 回答了 DSH 如何**说清楚自己**。但“看懂系统”和“修改系统”是两件事。本问题聚焦修改系统时，DSH 的 spec 如何从头走到尾：

```text
Issue → proposed Note → Plan → implementation → docs/types/README
      → tests/snapshots → implemented Note → review
```

要回答：

1. DSH 的完整 spec 路径分几个阶段？
2. 每个阶段的 spec 住在哪里，由什么约束？
3. `docs/` 在这条路径的什么位置？
4. 有没有真实例子能从头看到尾？

## 证据边界

- 证据只使用 DSH 仓库本身：`.github/`、`.agents/notes/`、`docs/`、`AGENTS.md`、`packages/`、`scripts/`。
- 当前基线：`0.1.1-rc.1`，commit `528c682e061696f5a160f363f236ecbf53cbd006`；历史 commit 只用于展示提案 → 实现的生命周期。

## 文件

- [`answer.md`](./answer.md)：总答案
- [`01-spec-path-overview.md`](./01-spec-path-overview.md)：完整 spec 路径总览
- [`02-intent-decision-plan.md`](./02-intent-decision-plan.md)：上游：Issue、proposed Note、Plan
- [`03-implementation-to-current-contract.md`](./03-implementation-to-current-contract.md)：中游：实现、docs/types/README、tests/snapshots
- [`04-implemented-note-and-review.md`](./04-implemented-note-and-review.md)：下游：implemented Note、review、归档
- [`05-example-web-capability-seam.md`](./05-example-web-capability-seam.md)：真实例子：Web capability seam
- [`research.md`](./research.md)：证据原文与 git 历史
