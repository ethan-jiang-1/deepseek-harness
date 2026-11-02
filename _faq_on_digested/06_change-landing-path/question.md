# Question 06 · 一次变更从意图到归位，经过哪些载体、哪些段强制？

## 背景

`04_root-entry-doc-design` 回答了 DSH 如何**说清楚自己**。但“看懂系统”和“修改系统”是两件事。本问题聚焦修改系统：一次变更的意图、决策、计划、实现、当前合同、行为证据、交付决定与 review 分别落在哪个载体。仓库规则与历史样本可能指向某种路径，但哪些段对每次修改都强制、哪些段只在特定条件出现，必须依据 DSH 仓库事实逐段判定，不能默认它是流水线。

要回答：

1. 一次变更从意图到归位分几个面？
2. 每个面的记录住在哪里，由什么约束？
3. `docs/` 在这条路径的什么位置？
4. 有没有真实例子能从头看到尾？

## 证据边界

- 证据只使用 DSH 仓库本身：`.github/`（含 `issue-management/rules.mjs`）、`.agents/notes/`、`.agents/skills/`、`docs/`、根 `AGENTS.md`、`packages/`（含 `packages/preset/agent-preset/` 与 `packages/bundle/web-app/presets/`）、`scripts/`、`CONTRIBUTING.md`。
- 当前基线：`dsh-v0.2.1-rc.2`，commit `687f282e8625c6b8d11ff58211a90524be2e4317`（0011 整树照搬同步）；历史 commit 只用于展示提案 → 实现的生命周期。

## 文件

- [`answer.md`](./answer.md)：总答案（文末有 2026-09-26 后见补记：FAQ 15 复核后的框架修正与规模律，另附本目录更名说明）
- [`01-landing-path-overview.md`](./01-landing-path-overview.md)：完整落位路径总览
- [`02-intent-decision-plan.md`](./02-intent-decision-plan.md)：上游：Issue、proposed Note、Plan
- [`03-implementation-to-current-contract.md`](./03-implementation-to-current-contract.md)：中游：实现、docs/types/README、tests/snapshots
- [`04-implemented-note-and-review.md`](./04-implemented-note-and-review.md)：下游：implemented Note、review、归档
- [`05-example-web-capability-seam.md`](./05-example-web-capability-seam.md)：真实例子：Web capability seam
- [`06-human-and-agent-roles.md`](./06-human-and-agent-roles.md)：这条路径里人干什么，coding agent 干什么
- [`research.md`](./research.md)：证据原文与 git 历史
