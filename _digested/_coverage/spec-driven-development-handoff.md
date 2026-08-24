# Handoff · spec-driven-development 专题

> 本文件是 2025-08-24 会话的交接记录。读者是下一个继续研究/维护 `_digested/spec-driven-development/` 的人。这里只记录状态、已验证事实、已知边界和下一步，不复制专题正文。

## 1. 会话目标

在 `_digested/` 下新建 `spec-driven-development/` 专题，把 DSH 的“开发流程”沉淀下来。它不是 FAQ 式的综合答案，而是按 `_digested/` 习惯的机制参考：每个文件给 home、约束、源码入口和边界。

## 2. 已创建目录与文件

```text
_digested/spec-driven-development/
├── 00-map.md
├── 01-agent-note-lifecycle.md
├── 02-issue-pr-lifecycle.md
├── 03-plan-and-sandbox.md
├── 04-gates-and-local-checks.md
├── 05-prose-doc-standards.md
├── 06-review-and-human-role.md
├── 07-push-merge-stacked-prs.md
└── 08-example-web-seam.md
```

同时更新：

- `_digested/00-index.md`
- `_digested/_coverage/00-index.md`

## 3. 已做的事实核验

- `.agents/notes/README.md`
- `.agents/notes/implemented/AGENTS.md`
- `.agents/notes/archived/AGENTS.md`
- `.agents/skills/*/SKILL.md`
- `.github/ISSUE_TEMPLATE/`
- `.github/pull_request_template.md`
- `.github/issue-management/policy.mjs`
- 根 `AGENTS.md`
- `docs/subsystems/plan.md`
- `packages/plan/plan-mode/README.md`
- `packages/plan/plan-mode/src/index.ts`
- git 历史：`a4091daa3d`、`d01f5f73b7`、`e6fad266a6`、`e8eddc7ef8`

## 4. 已知边界与刻意避开的坑

- **Issue 不是每次变更都强制**：人类 PR 只在 review 阶段被 `requiresPullRequestPolicy()` 强制引用 Issue。
- **Plan Mode 是可选的软引导**：写权限限制由 sandbox / approval policy 独立执行。
- **只有 Agent Note 是每次非平凡变更都强制的**。
- **历史例子不能拿当前规则反推**：Web seam 的 `Decision/Consequences` 是 `e6fad266a6` 统一格式时才改写，不是 `d01f5f73b7` 当时就有的。
- **archive 不是每次变更必经**：只有低未来价值的 implemented Note 才归档。

## 5. 验证结果

- `_digested/verify.mjs` 通过：50 Markdown、1 scripts、42 SVG、10 claims、3 computed metrics。
- `git diff --check` 干净。
- 当前状态：
  - modified: `_digested/00-index.md`
  - modified: `_digested/_coverage/00-index.md`
  - untracked: `_digested/spec-driven-development/`

## 6. 尚未做的事 / 建议下一步

- 未提交到 git；如要提交，建议 `git add _digested/spec-driven-development/ _digested/00-index.md _digested/_coverage/00-index.md` 后 commit。
- 可以补充每篇的“已核验行号/范围”标注，方便 `_coverage` 复核。
- 可以把 `05` 拆成更细的文档/翻译两篇，或保持当前粒度。
- 可以追加一个 process notes 索引，把 `.agents/notes/implemented/process/` 里的关键 note 与 `07` merge 流程、`05` 翻译纪律对应起来。
- 如果后续更新到 `0.1.1-rc.1` 之后，需要按 `_change_log/` 流程重新核对 `_coverage/00-index.md` 里的 `最近核验` 值。

## 7. 交接人的下一步建议

1. 先读 `_digested/spec-driven-development/00-map.md`。
2. 若需要更细核验，重点看 `04-gates` 与 `07-merge` 是否要引用 `scripts/run-gates.ts` 的具体行号。
3. 若不需要再扩展，就提交这版即可。
