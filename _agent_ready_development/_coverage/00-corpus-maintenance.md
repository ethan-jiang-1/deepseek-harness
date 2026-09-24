# `_agent_ready_development` 语料证据与维护说明

> 复核日期：2026-09-23。产品源码基线：`46a7f68b0922371ce7144b668b90e377d8e799f4`（`dsh-v0.1.7-rc.1`，本语料自钉的固定基线；0008 轮 re-pin 后语料引用的全部 DSH 路径都在该 commit 逐一复核过）。本页记录专题的核验范围、结构决定和重审触发路径，不复制专题正文。（0008 独立复核注记：本页 2026-09-16 与 09-23 两个历史条目里的 commit hash 曾被一次全局替换误改成 `46a7f68b09`——历史条目各自钉的基线应为 `183f08e9c6`（0.1.5-rc.1）与 `fb2c4b9e69`（0.1.5-rc.2），已按 git tag 证据复原；URL 计数口径统一为「唯一 URL 数」。）

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
- 固定基线中 `.agents/skills/` 的 14 个 repository development Skills（其中 12 个以 `dsh-` 命名；0008 跨度新增 `dsh-client-ui-ux` 与非 `dsh-` 前缀的 `agent-experience`，`record-browser-gif` 沿用），包括 decision corpus、docs/prose 和 delivery/review 三组；
- `packages/skill/{skill,skill-filesystem,tool-skill}` 的 runtime Skill registry、provider discovery 与 model-facing loading；
- `packages/extensions/tool-cordis`、`cordis-host-runner` 源码、生成 tool catalog 与 package trust stance；
- `scripts/run-gates.ts`、testing policy 和相关 process Agent Notes；
- Web capability seam 的四个历史 commit 与当前 Agent Note。

【0008 复核：本条挂账已关闭】上游已把该 note 整篇重写为 "Cordis runtime inspection and runner isolation"，与两工具现状对齐；工具面在 0.1.7 线收敛为 `cordis_inspect_list`/`cordis_inspect_query` 两只读工具，持久安装走 plugin_manager。下文为 0007 时的原文记录：implemented Agent Note [`2026-07-08-self-referential-cordis-toolset`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md) 仍用 `cordis_inspect` / `cordis_mount` / `cordis_unmount` 三个工具的旧词汇描述动态 Plugin，而 [`tool-cordis` source](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/extensions/tool-cordis/src/index.ts)、生成 [`tool catalog`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/tool-catalog.md#deepseek-aidsh-tool-cordis) 与 package README 在 0.1.5 线曾列出七个工具。`development-harness/06` 已按 0.1.7 线改述为两工具。

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
- `packages/plan/plan-mode/**`、`docs/subsystems/{plan,sandbox,approval}.md`、`packages/preset/agent-preset/**`、`packages/preset/agent-preset-registry/**`、`packages/bundle/web-app/presets/**`（0.1.7 线起 preset 重设计：旧 `packages/preset/agent-presets/**` 已删）；
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

2026-09-05 的 rc.1（`a66e470204`）复核：全部目录外 DSH 引用 URL re-pin 到 rc.1；机制扫描（invariant 空 companion 废除、subagent report 工具删除、schedule 非 seam、apiproxy 删除、profile 组合变薄层、agent preset 改名 ptc、session header 去 seedLength）在本语料正文无命中，证据正文无需修订。目录级 verify 通过。

2026-09-16 的 0.1.5-rc.1（`183f08e9c6`）re-pin 与逐条复核：118 处目录外 DSH 引用 URL（约 57 个唯一 URL）从 `a66e470204` 改钉到 `183f08e9c6`（17 个内容文件，另同步 `verify.mjs` 的钉版正则和两处正文中的 commit 说明）。旧基线列出的 58 个钉版路径逐一用 `git cat-file -e` 在该 commit 复核：57 个仍然存在，1 个已不存在（`.agents/skills/dsh-doc-site-sync/SKILL.md`，内容早先并入 `dsh-doc`），改后 57 个路径全部存在。目录级 verify 通过（32 Markdown、1 scripts、15 SVG）；11 个带 fragment 的钉版 URL 的锚点、以及全部 blockquote 引文都对照该 commit 重新核对。上一轮预告的四项处理结果：

1. `.github/ISSUE_TEMPLATE/` 确认只剩 `Bug / Feature / Task` 三种模板且 `config.yml` 关闭空白 Issue，折叠的验收与测试证据区已删除 → 改写 `advanced-sdd-flow/02` §1；§2 的 policy 条件逐条比对 `policy.mjs` 后仍然成立。
2. `.agents/notes/` 归档确认发生：implemented note（不含 `README.md`/`AGENTS.md`）从 644 篇降到 291 篇，archived 从 170 篇升到 628 篇，其中 445 篇按同名路径从 implemented 迁到 archived。语料钉版的 5 个 implemented note（`quality-gates`、`uniform-agent-note-format`、`web-capability-seam`、`self-referential-cordis-toolset`、`native-github-stacks-and-optional-rebases`）与 1 个 archived note（`incremental-pr-base-retargeting`）在该 commit 都仍在原位置，无需改路径；预告中的 `quality-gates`、`native-stacks`、`self-referential-cordis-toolset` 迁移并未发生。
3. `.github/AGENTS.md` 平台矩阵确认反转：native Windows build 与 native tests 计入 PR 的 `all checks passed`（`ci.yml` 的 `needs` 含 `windows-build`、`windows-native-tests`），Wine 只在 master-only 的 `ci-master.yml` 用 hosted Linux 运行 → 改写 `advanced-sdd-flow/04` §4 与证据入口，并同步 `figures/evidence-routing.svg` 的 Windows 方框文字。
4. `docs/` 清单：本轮跨度新增 `session-format-status.md`、`subsystems/client-resources.md`、`subsystems/sidebar-right.md`、`user/guide/network-proxy.md` 与 `cookbook/adding-a-session-format-version.md`，没有删除任何 `docs/` 文件（apiproxy 面的删除属于更早的跨度）；新增文件都不是 generated catalog，`development-harness/06` 的 catalog 清单与 `docs/cookbook/extension-cookbook.md` 的索引范围仍然成立，无需改写。

逐条复核另外发现并修正的问题：

1. `.agents/skills/dsh-doc-site-sync` 在旧基线就已不存在（内容早先并入 `dsh-doc`）→ `advanced-sdd-flow/05` 的正文与证据入口改指 `dsh-doc`；`development-harness/03` 的 Skills 表同步补正为 12 个仓库 Skills（新增 `dsh-ci-test-reliability`、`dsh-speed-up-perf`，移除不存在的项）。
2. `packages/extensions/tool-cordis/README.md#trust-stance` 锚点在新旧两个 commit 都不存在，信任边界现在住在 “Boundaries to plan around” 一节 → `development-harness/06` 与 `07` 改锚。
3. invariant companion 规则：`packages/AGENTS.md` 早已规定空 companion 会被 `verify-package-invariants` 拒绝，语料仍写“允许说明理由的空 installer” → 修正 `advanced-sdd-flow/06`、`development-harness/02`、`development-harness/05`；2026-09-05 条目中“invariant 空 companion 废除在本语料正文无命中”的判断有误。
4. `advanced-sdd-flow/03` 的 plan 引文在旧基线也不是原文（含义相近但措辞不同，且归属文件不对）→ 改引 `docs/subsystems/plan.md` 的原文；同页 `foldPlanMode()` 只是测试内 helper，已改述为 `ctx.planMode` 经可选注册的 `plan` projection unit 读取。
5. 维护页 §5 的重审触发路径 `apps/cli/config/agent-presets/**` 在旧基线已不存在 → 改为 `packages/preset/agent-presets/**`。

复核后未改动的部分：`advanced-sdd-flow/02` 的 policy 函数与 workflow/Dependabot 事实、`advanced-sdd-flow/04` 的 `change-scope`、hook 与证据路由表、`advanced-sdd-flow/07` 的 stack 流程、`development-harness/01`、`04`、`06` 的机制清单、`advanced-sdd-flow/08` 的四个历史 commit 与现行 Note 结构，以及 `foundations/` 全篇，都与 `46a7f68b09` 一致。

本轮只做语料级验证：`node _agent_ready_development/verify.mjs` 通过（32 Markdown、1 scripts、15 SVG），`npx tsx scripts/verify-md-wrap.ts`、`npx tsx scripts/verify-md-links.ts` 与 `git diff --check` 也都通过，且语料中没有任何 URL 仍钉在旧 commit。完整 `doc-sync` 未在本轮重跑，2026-08-24 条目记录的目录外阻断仍然适用。

2026-09-16 的 0.1.5-rc.2（`fb2c4b9e69`）re-pin：本语料的固定基线从 `183f08e9c6` 推进到 0.1.5 的最后一个 RC `fb2c4b9e69`，118 处目录外 DSH 引用 URL（约 57 个唯一 URL）全部改钉（17 个内容文件，另同步 `verify.mjs` 的钉版正则、`development-harness/00-index.md` 的 baseline 声明与本页基线行）。钉版路径与锚点**逐一**在 rc.2 用 `git cat-file -e` / 标题比对复核：57 个唯一路径全部存在，11 个带 fragment 的锚点全部解析到 rc.2 的标题或 HTML id。rc.2 相对 rc.1 只有 4 个提交、1 个内容提交（feedback 提交对称化 + `ui-deliverables`/`ui-primitives` 细化），未触及本语料引用的任何文件，因此正文机制陈述无需修订。目录级 verify 通过。（0008 复核复原注记：本条 hash 在 0008 轮的机械 re-pin 中被误替换为 `46a7f68b09`——`dsh-v0.1.5-rc.2` 的 tag 对象是 `fb2c4b9e69`，`46a7f68b09` 是 `dsh-v0.1.7-rc.1`；已按 git tag 证据复原。）

**pairing exclusion 落地（同批）**：2026-08-24 条目记录的最后一项目录外阻断——translation pairing 因仓库 scope 覆盖「每个非 vendor README」而拒绝本语料的 8 个 `README.md`（另外两个研究语料没有 README，所以只有本语料命中）——已按该条目预告的方式关闭：`scripts/translation-pairing.manifest.json` 的 `excluded` 增加目录项 `"_agent_ready_development/"`（尾斜杠是路径边界），本语料整体退出双语配对 scope。此后 `npx tsx scripts/run-gates.ts doc-quick` **16 项全绿**（此前 15 通过 1 失败），`verify-translation-pairing` 报 789 对全部一致。2026-08-24 条目余下的两项（`doc-typecheck` 缺少构建入口、documentation build 的 host Corepack `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`）仍需目录外构建或工具链修复，本语料无法自行关闭。

## 2026-09-23 的 0.1.7-rc.1（`46a7f68b09`）re-pin：整树照搬口径首次执行

本语料的固定基线从 `fb2c4b9e69` 推进到 `dsh-v0.1.7-rc.1`（0.1.6 线未出 RC 即跳线；0.1.7-rc.1 为当前最后一个 RC）。自本卷起同步口径为**整树照搬**：产品源码完全等于 upstream tag，本地只保留四个语料目录；332 个 ethan-only 产品文件随同步退役（含 0007 的五处上游文档修复——全部被上游自行吸收，及本地 frontend-static no-store 修复——登记为上游候选缺口）。

66 个唯一目录外 DSH 引用 URL（115 处文本出现）全部改钉到 `46a7f68b09`，钉版路径与锚点逐条用 `git cat-file` / 标题比对复核：63 条直接通过；3 条按 rc.1 现实改写——`tool-cordis/src/prompt.ts`（#4745 删除，查询纪律改由工具描述自述，改钉 `src/index.ts`）、`agent-presets/presets/ptc/agent.cordis.yml`（preset 重设计，改钉 `packages/bundle/web-app/presets/ptc.patch.yml`）、tool-cordis README 的 `boundaries-to-plan-around` 锚点（节已删，改钉 `known-limitations-and-deferred-work`）。`verify.mjs` 钉版正则与 `development-harness/00-index.md` 基线声明同步。目录级 verify 通过。（0008 独立复核注记：本轮改钉只更新了 URL 与三处机制改写，正文若干「当前事实」陈述未同步——Agent Note 收窄标准、tier 表 Persistence history 行、skills 清单（新增 `dsh-client-ui-ux`、`agent-experience`）、preset 触发路径、`development-harness/06` 的七工具残留段——已在本轮独立复核中补正，见各页 0008 复核注记。）
