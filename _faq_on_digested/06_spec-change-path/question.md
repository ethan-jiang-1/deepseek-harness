# Question 06 · DSH 修改系统的完整 SPEC 路径是什么？

## 背景

`04_root-entry-doc-design` 回答了 DSH 如何**说清楚自己**。但“看懂系统”和“修改系统”是两件事。本问题聚焦修改系统时，DSH 的 spec 如何从头走到尾。仓库规则与历史样本共同指向一条主路径：

```text
Issue → proposed Note → Plan → implementation → docs/types/README
      → tests/snapshots → implemented Note → review
```

但这条链只是待核验的候选模型：哪些段对每次修改都强制、哪些段只在特定条件出现，正文必须依据 DSH 仓库事实逐段判定，不能默认它是流水线。

要回答：

1. DSH 的完整 spec 路径分几个阶段？
2. 每个阶段的 spec 住在哪里，由什么约束？
3. `docs/` 在这条路径的什么位置？
4. 有没有真实例子能从头看到尾？

## 证据边界

- 证据只使用 DSH 仓库本身：`.github/`（含 `issue-management/policy.mjs`）、`.agents/notes/`、`.agents/skills/`、`docs/`、根 `AGENTS.md`、`packages/`（含 `packages/preset/agent-presets/`）、`scripts/`、`CONTRIBUTING.md`。
- 当前基线：`dsh-v0.1.7-rc.1`，commit `46a7f68b0922371ce7144b668b90e377d8e799f4`（工作树 `23aa3b253b`，0008 整树照搬同步）；历史 commit 只用于展示提案 → 实现的生命周期。

## 文件

- [`answer.md`](./answer.md)：总答案
- [`01-spec-path-overview.md`](./01-spec-path-overview.md)：完整 spec 路径总览
- [`02-intent-decision-plan.md`](./02-intent-decision-plan.md)：上游：Issue、proposed Note、Plan
- [`03-implementation-to-current-contract.md`](./03-implementation-to-current-contract.md)：中游：实现、docs/types/README、tests/snapshots
- [`04-implemented-note-and-review.md`](./04-implemented-note-and-review.md)：下游：implemented Note、review、归档
- [`05-example-web-capability-seam.md`](./05-example-web-capability-seam.md)：真实例子：Web capability seam
- [`06-human-and-agent-roles.md`](./06-human-and-agent-roles.md)：这条路径里人干什么，coding agent 干什么
- [`research.md`](./research.md)：证据原文与 git 历史
