# 04 · 真实例子：Web capability seam 从 proposed 到 implemented

## 例子说明

这个例子能看到 DSH 历史中的一条真实 spec 链：`docs/rfc/proposed/` → 实现 + `docs/rfc/implemented/` → 当前 `.agents/notes/implemented/`。

它不是事后编出来的流程，而是 git 历史里可核对的两次提交。

## 第一步：提案 commit

```text
a4091daa3d docs: propose web capability seam
```

该 commit 只做了提案：

```text
docs/rfc/README.md
docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md
```

提案开头：

> # RFC: Web capability seam - stable tools over multiple providers
>
> Status: proposed
>
> ## Problem
>
> The harness needs model-facing web tools without binding the model contract to one vendor's API shape.

提案里有 `## Proposal`，也有 `## Alternatives considered` 之类的前身结构。

## 第二步：实现 commit

```text
d01f5f73b7 Add web capability seam: ctx.web, search/fetch providers, web tools
```

同一 commit 里同时出现：

```text
docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md
docs/architecture.md
packages/README.md
packages/web/README.md
packages/web/tool-web/...
packages/web/web-search-exa/...
packages/web/web-search-perplexity/...
tests/...
```

也就是说，**代码、包文档、architecture 和 implemented note 在同一变更里一起落地**，而不是先写代码再补文档。

## 第三步：当前基线里，它是 now

当前 `.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md`：

```text
# Agent Note: Web capability seam - stable tools over multiple providers

Status: implemented

## Problem
...
## Decision
...
## Consequences
...
```

已经从提案语言改写为现在式决定，并随着后续代码变化持续更新事实。

## 这个例子说明什么

1. **spec 的移动是可见的**：从 proposed 目录移动到 implemented 目录；
2. **文档/README/代码同 PR 更新**；
3. **提案不是最终答案**：交付后必须重写成 `Decision`；
4. **当前权威是 implemented note + docs + source**，不是最初的 proposed RFC。

## 为什么不用 Plan Mode 作为唯一例子

Plan Mode 是 DSH 内置的一个计划/审批机制，能说明“计划 spec”；Web capability seam 更能说明“提案 spec → 实现 spec → 当前合同”的完整移动，并且 proposal commit 与 implementation commit 分得很干净。

## 证据入口

- `git show a4091daa3d -- docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md`
- `git show d01f5f73b7 -- docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md`
- [`.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md`](../../.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md)
