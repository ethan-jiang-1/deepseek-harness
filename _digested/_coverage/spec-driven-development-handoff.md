# `spec-driven-development` 专题复核记录

> 复核日期：2026-08-24。产品源码基线：`528c682e061696f5a160f363f236ecbf53cbd006`。本页记录专题的核验范围、结构决定和重审触发路径，不复制专题正文。

## 1. 专题定位

`_digested/spec-driven-development/` 是对 DSH 开发流程的机制参考，不声称仓库正式采用一套名为 Spec-driven Development 的方法。专题把可观察机制综合为“分布式规格”：Issue/任务意图、Agent Note 决定、可选 Plan、当前源码与文档、行为证据，以及 GitHub 远端协作状态分别有自己的 owner。

`00-map.md` 是概念导读；`01` 至 `07` 按问题提供 reference；`08` 是明确限定证据范围的 git 历史案例。`_faq_on_digested/` 继续承载跨专题综合问答，不与这里互相复制。

专题的证据范围、`.github/` 纳入原则和图文分工由 [evidence-scoped process digest Agent Note](../../.agents/notes/implemented/process/2026-08-24-evidence-scoped-process-digest.md) 记录；本页只维护本次核验事实和重审入口。

## 2. 已核验来源

- Agent Note 规则、implemented/archive 子树规则与 archive skill；
- root、docs、`.github` 的 `AGENTS.md`；
- Issue/PR templates、`issue-management/policy.mjs`、config 与 policy tests；
- `issue-policy.yml`、`issue-lifecycle.yml`、`ci.yml`、real-provider e2e、docs/release workflow 的触发边界，以及 Dependabot config；
- Plan subsystem、package README、implementation 和 coding preset；
- pre-push、code-review、stacked-PR、doc/prose/CoT、translation 与 doc-site skills；
- `scripts/run-gates.ts`、testing policy 和相关 process Agent Notes；
- Web capability seam 的四个历史 commit 与当前 Agent Note。

## 3. 本次结构纠正

1. 主链不再把 Issue、proposed Note 和 Plan Mode 画成统一必经顺序；三者是条件入口，非平凡变更的共同义务是 owning Agent Note。
2. `.github/` 被提升为远端执行面，而非只在 Issue 小节中出现：模板、trusted policy、Project lifecycle、PR CI、自动依赖 PR 和相邻发布 workflow 各自标明职责。
3. Plan Mode 与 sandbox/approval policy 分离；`plan/mode` 只保存 `{ active }`，计划正文不属于该 event。
4. 本地 relevant evidence 与 PR CI matrix 分离；repository scripts 拥有检查逻辑，workflow 拥有触发、runner、权限、并发和聚合。
5. Semantic review 不再被描述成人类独占动作。`dsh-code-review` 可由人或 agent 执行；human-review policy 约束的是人类作者 PR 的 metadata 适用范围。
6. Web seam 案例只证明 commit tree 中的 proposal、delivery bundle 和 implemented record，不证明 Issue、Plan、review、local commands 或 GitHub checks。
7. Prose 章节明确 `_digested/` 不是 bilingual product docs 或 website source，避免把 product documentation workflow 错套到研究语料。

## 4. 图示

```text
_digested/spec-driven-development/figures/
├── change-control-map.svg
├── agent-note-lifecycle.svg
├── github-event-flow.svg
├── plan-vs-enforcement.svg
├── evidence-routing.svg
├── stack-landing.svg
└── web-seam-history.svg
```

图分别拥有总流程、Note 状态、GitHub 事件、Plan/权限、证据路由、stack landing 和历史证据范围；正文引用图后继续提供可搜索的精确机制与来源。

## 5. 重审触发路径

以下路径在上游同步中变化时，将 coverage row 标为“需复核”，再检查对应章节与图：

- `.agents/notes/**`、`.agents/skills/dsh-{archive-agent-notes,pre-push-checks,code-review,merging-stacked-prs,doc-standards,prose-standard,trim-cot-leakage}/**`；
- `.github/AGENTS.md`、`.github/ISSUE_TEMPLATE/**`、`.github/pull_request_template.md`、`.github/issue-management/**`、`.github/workflows/{ci,issue-policy,issue-lifecycle,e2e}.yml`、`.github/dependabot.yml`；
- `packages/plan/plan-mode/**`、`docs/subsystems/{plan,sandbox,approval}.md`、`apps/cli/config/agent-presets/**`；
- `scripts/run-gates.ts`、`docs/testing.md`、`docs/AGENTS.md`；
- Web seam Agent Note 或专题引用的四个历史 commit 被重新解释时。

Release-only workflow 的内部 job 变化不自动触发整篇复核；只有它改变专题描述的触发边界、required evidence 或 daily PR flow 时才进入范围。

## 6. 验证

- **通过**：`node _digested/verify.mjs` 检查了 51 个 Markdown、49 个 SVG、10 条 claims 和 3 个 computed metrics。
- **通过**：`git diff --check`。
- **通过**：7 张 SVG 使用 `rsvg-convert` 渲染，并逐张检查文字、连线与缩放结果。
- **部分通过**：`pnpm run doc-sync` 的 28 个 gate 中 27 个通过，包括 documentation build、链接、换行、目录、翻译配对、Agent Note、预算和站点检查；`doc-typecheck` 在既有 host build 中因根包找不到 `lib/types/{index,invariant,startup}.js` 而失败。
- **被基线问题阻断**：`pnpm run lint` 在前置 `build:lib:host` 中遇到同一根包入口错误，未进入 lint；直接运行 `pnpm run lint:contracts-ready` 后只在未修改的 `packages/client/ui-reference/src/client/index.ts` 和 `packages/api/remotes/src/client/index.ts` 报告类型 lint 错误。
