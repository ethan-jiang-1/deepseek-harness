# 05 · 真实例子：Web capability seam 从 proposed 到 implemented

## 为什么用这个例子

它展示的是 spec 生命周期中**证据最完整的核心段**：

```text
proposed RFC
  → 实现 commit（代码 + docs + README + tests 一起落地）
  → implemented note
  → 当前基线里的现在式权威 note
```

Issue 与 GitHub review 不在 git tree 里，此例也不能证明使用了 Plan Mode；它是 proposed → implemented 的实证，不是八阶段全链路实证。git 历史可核对，不是事后编造。

## 第一步：提案 commit

```text
a4091daa3d docs: propose web capability seam
```

该 commit 新增提案，并在 RFC 索引中登记它：

```text
docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md
docs/rfc/README.md（新增 proposed 条目）
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

同一 commit 的主要落地（非穷举）：

```text
docs/rfc/README.md（proposed 条目移入 implemented）
docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md
docs/architecture.md
packages/README.md
packages/web/README.md
packages/web/tool-web/...、web-search-exa/...、web-search-perplexity/...（README/package/src/tests）
.gitignore、knip.json、pnpm-lock.yaml、tsconfig.base.json、tsconfig.build.json 等工程文件
```

这印证了 DSH 的规则：**代码、docs、README、tests 不是一个跟一个补，而是同一变更交付。**

但它还**不能**当作当前 `proposed/ → implemented/` 改写规则的例子：当时 d01 只是把文件移到 `implemented/` 并把 `Status` 改为 implemented，正文仍保留旧 RFC 时代的 `## Proposal` / `## Risks` 标题；今天的 Decision/Consequences 改写规则是后来才机制化的。

## 第三步：格式规则与 RFC → Agent Note 迁移

后续 commit `e6fad266a6 docs(rfc): define and enforce a uniform RFC format; adopt it across the corpus` 才把这份 implemented RFC 的 `Proposal/Tests/Risks` 改写为 `Decision/Testing/Consequences`。

再后来 `e8eddc7ef8 Rename RFCs to Agent Notes` 把它从 `docs/rfc/implemented/` 移到当前权威位置：

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
| 意图/验收 | Issue 层（不在 git tree；本 FAQ 不追具体 issue） |
| 决策 spec | proposed RFC |
| 计划 | 无仓库证据能证明该变更使用了 Plan Mode |
| 实现 | d01f5f73b7 的 packages/web/** |
| 当前合同 | docs/architecture.md、package READMEs |
| 行为 spec | packages/web/**/tests/** |
| 交付决定 | d01 移动并置 `Status: implemented`；`Decision/Consequences` 形式由 e6fad266a6 改写，当前路径由 e8eddc7ef8 迁移 |
| review | GitHub PR review（不在 git tree；本 FAQ 未追） |
| archive | 尚未发生；当前仍在 `.agents/notes/implemented/` |

这个表同时说明：git 历史只能实证核心段，Issue、Plan、review 不能靠仓库内 git 对象硬声称。

## 证据入口

- `git show a4091daa3d -- docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md`
- `git show a4091daa3d -- docs/rfc/README.md`
- `git show d01f5f73b7 -- docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md`
- `git show e6fad266a6 -- docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md`（统一 RFC 格式：Proposal/Tests/Risks → Decision/Testing/Consequences）
- `git show e8eddc7ef8 --name-status`（RFC → Agent Note 重命名）
- [`.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md`](../../.agents/notes/implemented/architecture/2026-06-24-web-capability-seam.md)
