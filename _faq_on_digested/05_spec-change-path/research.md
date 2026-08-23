# Research · `docs/` 与 Spec Driven Development 的关系

## 1. docs 只写当前状态

> **Document current state, not change history.** Avoid "previously/now/no longer", PRs, commits, and stack positions in durable prose; name the live mechanism.

来源：`docs/AGENTS.md:38`

## 2. 每个事实只有一个家

> Each fact has one home: the tier whose job it is; elsewhere, link there.

来源：`docs/AGENTS.md:17`

## 3. 非平凡改动必须带 Agent Note

> **Every non-trivial change includes at least one Agent Note in the same PR.** Update the owning note or add one; only mechanical/local edits are exempt.

来源：`docs/AGENTS.md:39`

> Every non-trivial change MUST add or update at least one Agent Note in the same PR.

来源：`.agents/notes/README.md:46`

## 4. proposed / implemented 的骨架与移动

proposed 骨架：

> `## Problem`
> `## Proposal`
> `## Alternatives considered`
> `## Acceptance criteria`
> `## Risks`

来源：`.agents/notes/README.md:80-90`

implemented 改写：

> `proposed/` → `implemented/` rewrites `## Proposal` into a present-tense `## Decision`, folds `## Acceptance criteria` and `## Risks` into `## Consequences` ... and drops plans in favor of what shipped.

来源：`.agents/notes/README.md:121`

## 5. Issue 与 PR 模板

Feature issue：

> - 验收条件：
> - 用户或模型可见变化：
> - 测试证据：

来源：`.github/ISSUE_TEMPLATE/feature.md:16-18`

PR：

> 关联 Issue：
>
> 变更与验证

来源：`.github/pull_request_template.md:5-10`

## 6. 行为规格：测试与快照

> A guard only guards if the regression actually fails it. ... prove it: introduce the regression, watch red, revert.

来源：`docs/testing.md:34`

> Every non-trivial model-, protocol-, or human-visible change adds or updates a keyless scenario in the same PR through a runnable example's owning snapshot suite.

来源：`docs/testing.md:49`

## 7. 当前合同同步

> The owning subsystems page updates in the same change that reshapes a documented type.

来源：`docs/AGENTS.md:45`

> A package's README and JSDoc are part of the change.

来源：`packages/AGENTS.md:25`

## 8. git 历史例子

提案：

```text
a4091daa3d docs: propose web capability seam
docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md
```

实现：

```text
d01f5f73b7 Add web capability seam: ctx.web, search/fetch providers, web tools
docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md
docs/architecture.md
packages/README.md
packages/web/** and tests/**
```

当前权威文件：

```text
.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md
Status: implemented
```

## 相关消化材料

- `_faq_on_digested/02_spec-driven-development/answer.md`：早期对 DSH SDD 的重建
- `_faq_on_digested/04_root-entry-documentation/answer.md`：系统如何说清楚自己
- `_digested/harness-idea/04-participation-paths.md`：参与阶梯
