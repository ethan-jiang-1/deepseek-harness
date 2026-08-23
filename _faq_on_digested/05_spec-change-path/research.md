# Research · DSH 修改系统的完整 spec 路径

## 1. 意图与验收：Issue 模板

> - 验收条件：
> - 用户或模型可见变化：
> - 测试证据：

来源：`.github/ISSUE_TEMPLATE/feature.md:16-18`

PR 模板：

> 关联 Issue：
>
> 变更与验证

来源：`.github/pull_request_template.md:5-10`

## 2. 决策 spec：Agent Note

> A proposal for substantial future work starts in `proposed/`; a decision already made starts in `implemented/`.

来源：`.agents/notes/README.md:46`

> Every non-trivial change MUST add or update at least one Agent Note in the same PR.

来源：`.agents/notes/README.md:46`

proposed 骨架：

```text
## Problem
## Proposal
## Alternatives considered
## Acceptance criteria
## Risks
```

来源：`.agents/notes/README.md:80-90`

## 3. 提案 → 实现：时态改写

> `proposed/` → `implemented/` rewrites `## Proposal` into a present-tense `## Decision`, folds `## Acceptance criteria` and `## Risks` into `## Consequences` ... and drops plans in favor of what shipped.

来源：`.agents/notes/README.md:121`

## 4. docs 是当前状态，不是变更史

> **Document current state, not change history.** Avoid "previously/now/no longer", PRs, commits, and stack positions in durable prose; name the live mechanism.

来源：`docs/AGENTS.md:38`

> The owning subsystems page updates in the same change that reshapes a documented type.

来源：`docs/AGENTS.md:45`

## 5. package README / JSDoc 随代码更新

> A package's README and JSDoc are part of the change.

来源：`packages/AGENTS.md:25`

> Package READMEs document model, token, and KV-cache effects using the canonical Model Experience format.

来源：`packages/AGENTS.md:26`

## 6. 行为 spec：测试与快照

> A guard only guards if the regression actually fails it. ... prove it: introduce the regression, watch red, revert.

来源：`docs/testing.md:34`

> Every non-trivial model-, protocol-, or human-visible change adds or updates a keyless scenario in the same PR through a runnable example's owning snapshot suite.

来源：`docs/testing.md:49`

## 7. git 历史例子

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

当前权威：

```text
.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md
Status: implemented
```

## 相关消化材料

- `_faq_on_digested/02_spec-driven-development/answer.md`
- `_faq_on_digested/04_root-entry-documentation/answer.md`
- `_digested/harness-idea/04-participation-paths.md`
