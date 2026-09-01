# `_agent_ready_development` 语料证据与维护说明

> 复核日期：2026-09-01。产品源码基线：`dd6322d604e00eec1ba5e0c8541159906a21094a`。本页记录专题的核验范围、结构决定和重审触发路径，不复制专题正文。

## 1. 专题定位

`_agent_ready_development/` 是根级 SDD、GitHub Flow 与 Development Harness 学习语料，并使用 DSH 作为固定版本的一手机制参考；它不声称 DSH 正式采用一套名为 Spec-driven Development 的方法。语料把可观察机制综合为“分布式规格”：Issue/任务意图、Agent Note 决定、可选 Plan、当前源码与文档、行为证据，以及 GitHub 远端协作状态分别有自己的 owner。

根 `README.md` 是独立语料的介绍与三路径入口。`foundations/` 中的 `01` 至 `05` 用一个普通变更递进讲解 SDD、GitHub Flow、实现证据与 review/merge。`advanced-sdd-flow/` 中的 `01` 至 `07` 按问题提供高级 SDD Flow 精确 reference，`08` 是明确限定证据范围的 git 历史案例。`development-harness/` 中的 `01` 是 fresh-agent tutorial，`02` 至 `07` 分别拥有知识归属、Skills、参与路径、可执行反馈、运行时查询和适用边界。

每个目录都有 `README.md`。三个主题目录的 README 只说明本层职责、直接内容与主入口，各自的 `00-index.md` 拥有面向读者的完整导读和阅读顺序；图示目录的 README 还标明每张 SVG 的正文 owner。

专题所需的教学上下文、图与维护说明都在本目录内；目录外引用只指向固定 commit 的 DSH 源码、文档、规则、Skills 与 Agent Notes，不依赖其它研究语料。本页拥有语料的层级、证据范围、`.github/` 纳入原则、独立发行约束、图文分工与重审入口；这些是研究语料自身的维护信息，不写入或修改 DSH 的 Agent Notes。

## 2. 已核验来源

- Agent Note 规则、implemented/archive 子树规则、quality-gates 决定与 archive skill；
- root、packages、docs、`.github` 的 `AGENTS.md`；
- architecture、glossary、Cordis primer、extension cookbooks、package READMEs 与生成 catalogs；
- Issue/PR templates、`issue-management/policy.mjs`、config 与 policy tests；
- `issue-policy.yml`、`issue-lifecycle.yml`、`ci.yml`、real-provider e2e、docs/release workflow 的触发边界，以及 Dependabot config；
- Plan subsystem、package README、implementation 和 coding preset；
- 固定基线中 `.agents/skills/` 的 11 个 repository development Skills，包括 decision corpus、docs/prose 和 delivery/review 三组；
- `packages/skill/{skill,skill-filesystem,tool-skill}` 的 runtime Skill registry、provider discovery 与 model-facing loading；
- `packages/extensions/tool-cordis`、`cordis-host-runner` 源码、生成 tool catalog 与 package trust stance；
- `scripts/run-gates.ts`、testing policy 和相关 process Agent Notes；
- Web capability seam 的四个历史 commit 与当前 Agent Note。

固定基线的 self-referential Cordis 资料存在可核验冲突：implemented Agent Note 描述 `cordis_inspect/mount/unmount` 三个工具，package README 概括 `cordis_inspect/define/run/stop/undefine` 五个工具，而 [`tool-cordis` source](https://github.com/deepseek-ai/deepseek-harness/blob/dd6322d604e00eec1ba5e0c8541159906a21094a/packages/extensions/tool-cordis/src/index.ts) 与生成 [`tool catalog`](https://github.com/deepseek-ai/deepseek-harness/blob/dd6322d604e00eec1ba5e0c8541159906a21094a/docs/tool-catalog.md#deepseek-aidsh-tool-cordis) 一致列出 `inspect_list/inspect_query/inspect_self/define/run/stop/undefine` 七个工具。`development-harness/06` 以源码和生成 catalog 说明当前工具集合，只使用 Note 与 README 中仍与源码相容的信任和生命周期边界。

## 3. 结构与叙事约束

1. 阅读顺序是 tutorial-first：先在 `foundations/` 用一个 CLI 变更讲完普通路径，再拆解规格、GitHub Flow、证据与 review；精确机制和少见流程进入 `advanced-sdd-flow/`。
2. 重要术语在新手层首次出现时同时给出英文名称和中文解释；后文保留仓库与 GitHub 中可搜索的英文名称。
3. 主链不把 Issue、proposed Note 和 Plan Mode 画成统一必经顺序；三者是条件入口，非平凡变更的共同义务是 owning Agent Note。
4. `.github/` 是远端执行面，而非只在 Issue 小节中出现：模板、trusted policy、Project lifecycle、PR CI、自动依赖 PR 和相邻发布 workflow 各自标明职责。
5. Plan Mode 与 sandbox/approval policy 分离；`plan/mode` 只保存 `{ active }`，计划正文不属于该 event。
6. 本地 relevant evidence 与 PR CI matrix 分离；repository scripts 拥有检查逻辑，workflow 拥有触发、runner、权限、并发和聚合。
7. Semantic review 不被描述成人类独占动作。`dsh-code-review` 可由人或 agent 执行；human-review policy 约束的是人类作者 PR 的 metadata 适用范围。
8. Web seam 案例只证明 commit tree 中的 proposal、delivery bundle 和 implemented record，不证明 Issue、Plan、review、local commands 或 GitHub checks。
9. 本页拥有独立研究语料的发行边界：这些文件不是 bilingual product docs 或 website source，不创建 pairing sidecar 或站点投影。
10. 专题不引用其它研究语料，也不从其它语料加载校验逻辑；引用 DSH 时先在正文讲清结论，再用 blockquote 摘录关键原文，并标明 DSH 中的具体 owner 与可核对事实。
11. `advanced-sdd-flow/` 只拥有相对于 Foundations 更深入的 SDD/GitHub 变更流；`development-harness/` 独立回答 DSH 怎样帮助 coding agent 理解、修改和验证 DSH。两条平级叙事通过内部链接协作而不重复全文。
12. Development Harness 从一个 fresh-agent 场景起步，再引入 legibility、procedural memory、paved road 与 inspectability；抽象术语不能成为新读者的前置条件。
13. `.agents/skills/` 的 repository development Skills 与 `packages/skill/` 的 runtime Skill capability 分开说明；相似的按需知识思想不能被误写成共享同一 registry 或调用机制。
14. Skills 拥有情境化工作流程，`AGENTS.md` 拥有 standing orders，repository gates 拥有确定性检查，`.github/` workflows 拥有远端调度，Agent Notes 拥有决定理由，current docs/source 拥有当前行为。
15. 每个目录必须有 `README.md`；README 负责目录导航，不复制 `00-index.md` 的教学叙事或本页的维护细节。

## 4. 图示

15 张 SVG 分属 [Foundations](../foundations/figures/README.md)、[Advanced SDD Flow](../advanced-sdd-flow/figures/README.md) 和 [Development Harness](../development-harness/figures/README.md) 三个清单；各清单拥有文件名与正文映射。主题 Markdown 不跨目录引用图，根 README 与 `_coverage/` 不拥有图。正文引用图后继续提供可搜索的机制与来源。每张 SVG 还提供与 `viewBox` 一致的固有尺寸，以及由 `role="img"`、`aria-labelledby="title desc"`、`title` 和 `desc` 组成的无障碍元数据。

## 5. 重审触发路径

以下路径在上游同步中变化时，将对应章节与图列为“需复核”，再检查它们：

- `.agents/notes/**`、`.agents/skills/**`；
- `.github/AGENTS.md`、`.github/ISSUE_TEMPLATE/**`、`.github/pull_request_template.md`、`.github/issue-management/**`、`.github/workflows/{ci,issue-policy,issue-lifecycle,e2e}.yml`、`.github/dependabot.yml`；
- `packages/plan/plan-mode/**`、`docs/subsystems/{plan,sandbox,approval}.md`、`apps/cli/config/agent-presets/**`；
- `packages/skill/{skill,skill-filesystem,tool-skill}/**`；
- `packages/extensions/{tool-cordis,cordis-host-runner}/**`；
- `AGENTS.md`、`packages/AGENTS.md`、`docs/{AGENTS,architecture,glossary,cordis-primer,testing}.md`、`docs/cookbook/**`；
- `scripts/run-gates.ts` 与专题引用的 generated catalog owners；
- Web seam Agent Note 或专题引用的四个历史 commit 被重新解释时。

Release-only workflow 的内部 job 变化不自动触发整篇复核；只有它改变专题描述的触发边界、required evidence 或 daily PR flow 时才进入范围。

## 6. 验证

- 每次改动运行 `node _agent_ready_development/verify.mjs`、`pnpm run verify-md-links`、`pnpm run verify-md-wrap` 和 `git diff --check`。目录 verifier 检查严格 UTF-8、结尾换行、内部链接与锚点、固定 DSH 外链、研究语料隔离、目录 README、图示归属、孤立 SVG，以及 SVG 的固有尺寸、无障碍元数据和 XML。
- 修改 `verify.mjs` 时再运行 `node --check _agent_ready_development/verify.mjs`，并确认代表性无效输入会被拒绝；修改 SVG 时渲染受影响文件，检查文字、连线和缩放。
- Repository-level 文档校验运行 `pnpm run doc-sync`；被 host toolchain、build prerequisite 或目录外规则阻断时，交付报告记录 exact command 与错误，不把结果写成绿色证据。

2026-08-24 的 repository-level 复核没有建立绿色 `doc-sync` 结果：`corepack pnpm run doc-sync` 完成 28 项中的 25 项，`doc-typecheck` 缺少 `lib/types/{index,invariant,startup}.js` 构建入口，documentation build 命中 host Corepack 的 `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`，translation pairing 因仓库 scope 包含本语料而拒绝 8 个 README。前两项需要目录外构建或工具链修复；pairing exclusion 由目录外的 `scripts/translation-pairing.manifest.json` 拥有。目录级检查通过不能替代这三项 repository-level 结果。
