# Research · DSH 修改系统的完整 spec 路径

## 1. 意图与可观察行为：Issue 模板

> ## Motivation
> ## Behavior

来源：`.github/ISSUE_TEMPLATE/feature.md:1-14`（Idea 与 Research 模板已按[语义化模板决策](../../.agents/notes/implemented/process/2026-09-03-semantic-issue-templates-and-policy.md)取消并归入 Task；模板不再承载验收与测试证据）

PR 模板：

> 关联 Issue：
>
> 变更与验证

来源：`.github/pull_request_template.md:5-10`


Issue 引用的机器强制边界：

> const automated = authorType === 'Bot' || authorType === 'App'
> return !isDraft && !automated && (reviewRequestCount > 0 || reviewCount > 0)

来源：`.github/issue-management/policy.mjs:162-170`

> if (input.references.all.length === 0) errors.push('PR 正文必须引用至少一个同仓库 Issue')

来源：`.github/issue-management/policy.mjs:373`

限制：policy 检查引用和元数据，不检查“验收条件/测试证据”是否写得充分。

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


## 2.1 Plan Mode：原生支持但可选、软引导

> The package is optional, and the agent loop does not depend on it.

来源：`docs/subsystems/plan.md:5`

> Make the plan decision-complete: ... detailed enough that another engineer can implement it without making design decisions.

来源：`packages/preset/agent-presets/presets/ptc/agent.cordis.yml:129`

> Plan mode guides rather than enforces; deployments that need enforced restrictions must configure sandbox and approval controls independently.

来源：`packages/plan/plan-mode/README.md:94`

限制：Plan Mode 能证明 DSH 原生支持 spec-first workflow；git 历史不能证明每个 PR 都使用过它。

## 3. 提案 → 实现：时态改写

> Moving a file between lifecycle folders means updating the `Status:` line and re-satisfying that folder's skeleton in the same change ... Concretely, `proposed/` → `implemented/` rewrites `## Proposal` into a present-tense `## Decision`, folds `## Acceptance criteria` and `## Risks` into `## Consequences` ... and drops plans in favor of what shipped.

来源：`.agents/notes/README.md:121`

## 4. docs 是当前状态，不是变更史

> **Document current state, not change history.** Avoid "previously/now/no longer", PRs, commits, and stack positions in durable prose; name the live mechanism.

来源：`docs/AGENTS.md:38`

> The owning subsystems page updates in the same change that reshapes a documented type.

来源：`docs/AGENTS.md:42`

## 5. package README / JSDoc 随代码更新

> A package's README and JSDoc are part of the change.

来源：`packages/AGENTS.md:25`

> Package READMEs document model, token, and KV-cache effects using the canonical Model Experience format.

来源：`packages/AGENTS.md:27`

## 6. 行为 spec：测试与快照

> A guard only guards if the regression actually fails it. ... prove it: introduce the regression, watch red, revert.

来源：`docs/testing.md:34`

> Every non-trivial model-, protocol-, or human-visible change adds or updates a keyless scenario in the same PR through a runnable example's owning snapshot suite.

来源：`docs/testing.md:54`

## 7. git 历史例子

提案：

```text
a4091daa3d docs: propose web capability seam
docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md
docs/rfc/README.md（proposed 索引条目）
```

实现（同一 commit，主要文件，非穷举）：

```text
d01f5f73b7 Add web capability seam: ctx.web, search/fetch providers, web tools
docs/rfc/README.md（条目移入 implemented）
docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md
docs/architecture.md
packages/README.md
packages/web/**（README/package/src/tests）
```

统一 RFC 格式（后来才把该 implemented RFC 改写为 Decision/Testing/Consequences）：

```text
e6fad266a6 docs(rfc): define and enforce a uniform RFC format; adopt it across the corpus
```

RFC → Agent Note 重命名：

```text
e8eddc7ef8 Rename RFCs to Agent Notes
docs/rfc/implemented/... → .agents/notes/implemented/...
```

当前权威：

```text
.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md
Status: implemented
```

限制：这个例子实证 proposed → implemented 核心段；d01 时代尚无今天的 Note 格式规则，Decision/Consequences 是 e6fad266a6 才落到这份文件；Issue、Plan、review 不在 git tree，不能用它声称八阶段全链路。

## 相关消化材料

- `_faq_on_digested/02_spec-driven-development/answer.md`
- `_faq_on_digested/04_root-entry-doc-design/answer.md`
- `_digested/harness-idea/04-participation-paths.md`
