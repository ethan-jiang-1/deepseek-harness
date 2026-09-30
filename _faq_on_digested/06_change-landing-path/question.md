# Question 06 · 一次变更从意图到归位，经过哪些载体、哪些段强制？

## 背景

`04_root-entry-doc-design` 回答了 DSH 如何**说清楚自己**。但“看懂系统”和“修改系统”是两件事。本问题聚焦修改系统：一次变更的意图、决策、计划、实现、当前合同、行为证据、交付决定与 review 分别落在哪个载体。仓库规则与历史样本共同指向一条主路径：

```text
Issue → proposed Note → Plan → implementation → docs/types/README
      → tests/snapshots → implemented Note → review
```

但这条链只是待核验的候选模型：哪些段对每次修改都强制、哪些段只在特定条件出现，正文必须依据 DSH 仓库事实逐段判定，不能默认它是流水线。

要回答：

1. 一次变更从意图到归位分几个面？
2. 每个面的记录住在哪里，由什么约束？
3. `docs/` 在这条路径的什么位置？
4. 有没有真实例子能从头看到尾？

## 框架演变

本目录原名 `06_spec-change-path`，原题为「DSH 修改系统的完整 SPEC 路径是什么？」，正文曾以 "spec" 作统一名词（决策 spec、行为 spec、SPEC 路径）。经 [FAQ 11](../11_native-development-loop/answer.md) 复核，因果方向反转：证据与门禁先行，"spec 感"是六步闭环的沉淀物而非上游输入；经 [FAQ 15](../15_loop-engineering-vs-sdd/answer.md) 复核，交付层与工作层要分开。据此更名为 `06_change-landing-path`，并改用「变更落位/载体」框架：不是一份 spec 在流动，而是变更的每个面各回各家。

## 证据边界

- 证据只使用 DSH 仓库本身：`.github/`（含 `issue-management/rules.mjs`）、`.agents/notes/`、`.agents/skills/`、`docs/`、根 `AGENTS.md`、`packages/`（含 `packages/preset/agent-preset/` 与 `packages/bundle/web-app/presets/`）、`scripts/`、`CONTRIBUTING.md`。
- 当前基线：`dsh-v0.2.0-rc.2`，commit  `639ed015397290b3745d163aafe02ffee4aa3f84`（0009 整树照搬同步）；历史 commit 只用于展示提案 → 实现的生命周期。

## 文件

- [`answer.md`](./answer.md)：总答案（文末有 2026-09-26 后见补记：FAQ 15 复核后的框架修正与规模律，另附本目录更名说明）
- [`01-landing-path-overview.md`](./01-landing-path-overview.md)：完整落位路径总览
- [`02-intent-decision-plan.md`](./02-intent-decision-plan.md)：上游：Issue、proposed Note、Plan
- [`03-implementation-to-current-contract.md`](./03-implementation-to-current-contract.md)：中游：实现、docs/types/README、tests/snapshots
- [`04-implemented-note-and-review.md`](./04-implemented-note-and-review.md)：下游：implemented Note、review、归档
- [`05-example-web-capability-seam.md`](./05-example-web-capability-seam.md)：真实例子：Web capability seam
- [`06-human-and-agent-roles.md`](./06-human-and-agent-roles.md)：这条路径里人干什么，coding agent 干什么
- [`research.md`](./research.md)：证据原文与 git 历史
