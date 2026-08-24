# 08 · 真实改动：Web capability seam 的生命周期

## 一句话

从 git 历史能完整看到一次改动如何经过 `proposed/` → 实现 commit → `implemented/` → 统一格式 → Agent Note 迁移。但要注意：**这个历史样本发生在今天的 Agent Note 格式规则之前**，所以它不能把“同一 commit 完成 Decision 改写”当成事实；改写是后续 commit 才做的。

## 1. 提案 commit

```text
a4091daa3d docs: propose web capability seam
```

该 commit 新增：

```text
docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md
```

并在 `docs/rfc/README.md` 登记 proposed 索引条目。提案开头是：

> # RFC: Web capability seam - stable tools over multiple providers
> Status: proposed
> ## Problem
> ...

## 2. 实现 commit

```text
d01f5f73b7 Add web capability seam: ctx.web, search/fetch providers, web tools
```

同一 commit 的主要落地：

```text
docs/rfc/README.md（条目移入 implemented）
docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md
docs/architecture.md
packages/README.md
packages/web/**（README/package/src/tests）
```

这印证“代码、docs、README、tests 同一变更交付”，但当时只是把文件从 proposed 移到 implemented、把 `Status` 改成 implemented；正文仍是旧 RFC 的 `## Proposal / ## Risks`。

## 3. 格式统一 commit

```text
e6fad266a6 docs(rfc): define and enforce a uniform RFC format; adopt it across the corpus
```

该 commit 才把这份 implemented RFC 的 `Proposal/Tests/Risks` 改写为 `Decision/Testing/Consequences`。也就是说，今天 `proposed → implemented` 的“同一 diff 强制度”是后来机制化的。

## 4. Agent Note 迁移 commit

```text
e8eddc7ef8 Rename RFCs to Agent Notes
```

路径从：

```text
docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md
```

迁到：

```text
.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md
```

当前文件开头已经是：

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

## 5. 对应 spec 阶段

| 阶段 | 落点 |
|---|---|
| 意图/验收 | Issue 层（不在 git tree，本样本不追） |
| 决策 spec | proposed RFC |
| 计划 | 无仓库证据证明该 commit 使用 Plan Mode |
| 实现 | d01f5f73b7 的 `packages/web/**` |
| 当前合同 | `docs/architecture.md`、package READMEs |
| 行为 spec | `packages/web/**/tests/**` |
| 交付决定 | d01 移动并置 implemented；Decision/Consequences 由 e6fad266a6 改写；路径由 e8eddc7ef8 迁移 |
| review | GitHub PR review（不在 git tree） |
| archive | 尚未发生；当前仍在 `.agents/notes/implemented/` |

## 证据入口

- `git show a4091daa3d -- docs/rfc/README.md`
- `git show d01f5f73b7 -- docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md`
- `git show e6fad266a6 -- docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md`
- `git show e8eddc7ef8 --name-status`
- [`.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md`](../../.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md)
