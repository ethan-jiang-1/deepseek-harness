# 05 · 真实例子：Web capability seam 从 proposed 到 implemented

## 为什么用这个例子

它展示的是一条完整的 spec 移动：

```text
proposed RFC
  → 实现 commit（代码 + docs + README + tests 一起落地）
  → implemented note
  → 当前基线里的现在式权威 note
```

git 历史可核对，不是事后编造。

## 第一步：提案 commit

```text
a4091daa3d docs: propose web capability seam
```

该 commit 只增加提案：

```text
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

## 第二步：实现 commit

```text
d01f5f73b7 Add web capability seam: ctx.web, search/fetch providers, web tools
```

同一 commit 同时落地：

```text
docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md
docs/architecture.md
packages/README.md
packages/web/README.md
packages/web/tool-web/...
packages/web/web-search-exa/...
packages/web/web-search-perplexity/...
packages/web/**/tests/**
```

这印证了 DSH 的规则：**代码、docs、README、tests 不是一个跟一个补，而是同一变更交付。**

## 第三步：当前基线里的 now

当前文件：

```text
.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md
```

开头：

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

它已经是现在式决定，不再是 proposal。

## 这个例子对应的 spec 阶段

| 阶段 | 落点 |
|---|---|
| 意图/验收 | Issue 层（本 FAQ 不追具体 issue） |
| 决策 spec | proposed RFC |
| 实现 | d01f5f73b7 的 packages/web/** |
| 当前合同 | docs/architecture.md、package READMEs |
| 行为 spec | packages/web/**/tests/** |
| 交付决定 | implemented note |
| 持续维护 | 当前 `.agents/notes/implemented/...` |

## 证据入口

- `git show a4091daa3d -- docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md`
- `git show d01f5f73b7 -- docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md`
- [`.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md`](../../.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md)
