# `_spec_driven_development` 语料复核记录

> 复核日期：2026-08-24。产品源码基线：`528c682e061696f5a160f363f236ecbf53cbd006`。本页记录专题的核验范围、结构决定和重审触发路径，不复制专题正文。

## 1. 专题定位

`_spec_driven_development/` 是根级 SDD 与 GitHub Flow 教程，并使用 DSH 开发流程作为机制参考；它不声称仓库正式采用一套名为 Spec-driven Development 的方法。语料把可观察机制综合为“分布式规格”：Issue/任务意图、Agent Note 决定、可选 Plan、当前源码与文档、行为证据，以及 GitHub 远端协作状态分别有自己的 owner。

`00-index.md` 是面向新读者的入口；顶层 `01` 至 `05` 用一个普通变更递进讲解 SDD、GitHub Flow、实现证据与 review/merge。`advanced/` 中的 `01` 至 `07` 按问题提供精确 reference，`08` 是明确限定证据范围的 git 历史案例。专题所需的教学上下文、图与维护说明都在本目录内；目录外引用只指向 DSH 自己的源码、文档、规则与 Agent Notes，不依赖其它研究语料。

本页记录语料的层级、证据范围、`.github/` 纳入原则、独立发行约束、图文分工与重审入口。这些是研究语料自身的维护信息，不写入 DSH 的 Agent Notes。

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

1. 阅读顺序改为 tutorial-first：先用一个 CLI 变更讲完普通路径，再拆解规格、GitHub Flow、证据与 review；精确机制和少见流程移入 `advanced/`。
2. 重要术语在新手层首次出现时同时给出英文名称和中文解释；后文保留仓库与 GitHub 中可搜索的英文名称。
3. 主链不把 Issue、proposed Note 和 Plan Mode 画成统一必经顺序；三者是条件入口，非平凡变更的共同义务是 owning Agent Note。
4. `.github/` 被提升为远端执行面，而非只在 Issue 小节中出现：模板、trusted policy、Project lifecycle、PR CI、自动依赖 PR 和相邻发布 workflow 各自标明职责。
5. Plan Mode 与 sandbox/approval policy 分离；`plan/mode` 只保存 `{ active }`，计划正文不属于该 event。
6. 本地 relevant evidence 与 PR CI matrix 分离；repository scripts 拥有检查逻辑，workflow 拥有触发、runner、权限、并发和聚合。
7. Semantic review 不被描述成人类独占动作。`dsh-code-review` 可由人或 agent 执行；human-review policy 约束的是人类作者 PR 的 metadata 适用范围。
8. Web seam 案例只证明 commit tree 中的 proposal、delivery bundle 和 implemented record，不证明 Issue、Plan、review、local commands 或 GitHub checks。
9. Prose 高级参考明确根级语料不是 bilingual product docs 或 website source，避免把 product documentation workflow 错套到研究语料。
10. 专题作为独立发行单元，不引用其它研究语料，也不从其它语料加载校验逻辑；引用 DSH 时先在本页讲清结论，再用 blockquote 摘录关键原文，并标明 DSH 中的具体 owner 与可核对事实。

## 4. 图示

```text
_spec_driven_development/figures/
└── first-change.svg
_spec_driven_development/advanced/figures/
├── change-control-map.svg
├── agent-note-lifecycle.svg
├── github-event-flow.svg
├── plan-vs-enforcement.svg
├── evidence-routing.svg
├── stack-landing.svg
└── web-seam-history.svg
```

顶层 `first-change.svg` 只服务新手主线；`advanced/figures/` 中的图分别服务精确总流程、Note 状态、GitHub 事件、Plan/权限、证据路由、stack landing 和历史证据范围。正文引用图后继续提供可搜索的机制与来源。

## 5. 重审触发路径

以下路径在上游同步中变化时，将 coverage row 标为“需复核”，再检查对应章节与图：

- `.agents/notes/**`、`.agents/skills/dsh-{archive-agent-notes,pre-push-checks,code-review,merging-stacked-prs,doc-standards,prose-standard,trim-cot-leakage}/**`；
- `.github/AGENTS.md`、`.github/ISSUE_TEMPLATE/**`、`.github/pull_request_template.md`、`.github/issue-management/**`、`.github/workflows/{ci,issue-policy,issue-lifecycle,e2e}.yml`、`.github/dependabot.yml`；
- `packages/plan/plan-mode/**`、`docs/subsystems/{plan,sandbox,approval}.md`、`apps/cli/config/agent-presets/**`；
- `scripts/run-gates.ts`、`docs/testing.md`、`docs/AGENTS.md`；
- Web seam Agent Note 或专题引用的四个历史 commit 被重新解释时。

Release-only workflow 的内部 job 变化不自动触发整篇复核；只有它改变专题描述的触发边界、required evidence 或 daily PR flow 时才进入范围。

## 6. 验证

- **通过**：目录内自带的 `node _spec_driven_development/verify.mjs` 检查了 16 个 Markdown、1 个脚本和 8 个 SVG，并拒绝对其它研究语料的引用。
- **通过**：`git diff --check`。
- **通过**：8 张 SVG 使用 `rsvg-convert` 渲染，并逐张检查文字、连线与缩放结果。
- **部分通过**：`pnpm run doc-sync` 的 28 个 gate 中 27 个通过，包括 documentation build、链接、换行、目录、翻译配对、Agent Note、预算和站点检查；`doc-typecheck` 在既有 host build 中因根包找不到 `lib/types/{index,invariant,startup}.js` 而失败。
- **被基线问题阻断**：`pnpm run lint` 在前置 `build:lib:host` 中遇到同一根包入口错误，未进入 lint；直接运行 `pnpm run lint:contracts-ready` 后只在未修改的 `packages/client/ui-reference/src/client/index.ts` 和 `packages/api/remotes/src/client/index.ts` 报告类型 lint 错误。
