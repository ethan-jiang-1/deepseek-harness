# `_dsh_plugin_agent_ready_development` 语料证据与维护说明

> 复核日期：2026-10-07。现行源码与文档基线：release tag `dsh-v0.2.0-rc.2`。本页记录核验范围、结构约束和重审路径，不复制教学正文。固定标签只标明核验版本，不代表永久兼容承诺。

当前引用政策：现行机制链接固定到上述 release tag；历史证据用 release tag、PR、日期与准确提交标题定位，不在维护文件中写 Git commit 标识。0013 轮核对了原本引用的本地同步树与真正 release tag：唯一差异是配对清单中的研究语料排除项。其余引用来源内容等价；配对清单仍证明 DSH 主仓的发现与排除机制，但本地新增排除项不是发布版本事实。语料自身不继承 DSH 主仓的配对制度。

历史基线勘误：2026-09-16 与 09-23 条目分别对应 `dsh-v0.1.5-rc.1` 与 `dsh-v0.1.5-rc.2`；曾误写为 `dsh-v0.1.7-rc.1` 的基线标识已在 0008 轮复原。以下历史条目保留各轮版本与结果，不充当当前状态。

## 1. 专题定位

`_dsh_plugin_agent_ready_development/` 是以 DSH 固定版本一手来源为依据的三卷互补语料：`native-development-model/` 综合原生开发流程中的关系，`sdlc-reference/` 提供精确条件与例外，`repo-harness/` 解释仓库如何帮助 coding agent 参与。它不声称 DSH 正式采用一套名为 Spec-driven Development 的方法；三卷均独立依据 DSH 源码、文档、规则、Skills、workflow 和 git 历史，不依赖其它研究语料。

根 `README.md` 是独立语料的介绍、三卷定位与维护入口。`native-development-model/00-index.md` 说明 owner、证据、交付判断之间的关系，不增加额外阶段或产物；`sdlc-reference/` 按问题提供意图入口、Agent Note、Plan、检查、agent 契约证据、评审、批准、合并、发布与历史证据的精确参考；`repo-harness/` 说明 fresh agent 入口、知识归属、Skills、参与路径、可执行反馈、运行时查询、仓库分类学和插件作者入口。迁移到独立研究 FAQ 的历史案例不再作为本语料的前置卷。

每个目录都有 `README.md`。三个主题目录的 README 只说明本层职责、直接内容与主入口，各自的 `00-index.md` 拥有面向读者的完整导读和阅读顺序；图示目录的 README 还标明每张 SVG 的正文 owner。

专题所需的教学上下文、图与维护说明都在本目录内；目录外引用只指向固定 release tag 的 DSH 源码、文档、规则、Skills 与 Agent Notes，不依赖其它研究语料。本页拥有语料的层级、证据范围、`.github/` 纳入原则、独立发行约束、图文分工与重审入口；这些是研究语料自身的维护信息，不写入或修改 DSH 的 Agent Notes。

## 2. 已核验来源

- Agent Note 规则、implemented/archive 子树规则、quality-gates 决定与 archive skill；
- root、packages、docs、`.github` 的 `AGENTS.md`；
- architecture、glossary、Cordis primer、extension cookbooks、package READMEs 与生成 catalogs；
- Issue/PR templates、`issue-management/policy.mjs`、config 与 policy tests；
- `issue-policy.yml`、`issue-lifecycle.yml`、`ci.yml`、real-provider e2e、docs/release workflow 的触发边界，以及 Dependabot config；
- Plan subsystem、package README、implementation 和 coding preset；
- 固定基线中 `.agents/skills/` 的 15 个 repository development Skills（其中 13 个以 `dsh-` 命名；0009 轮复核：0008 基数 14 个目录（12 个 `dsh-` 前缀）之上新增 `dsh-create-upgrade-guide`（对应根 `AGENTS.md` 新增的升级指南常设指令），且 `agent-experience/SKILL.md` 在 0.2.0 跨度内改为指向 `packages/preset/agent-preset/skills/agent-experience/SKILL.md` 的符号链接，内容本体移入 agent-preset 包），包括 decision corpus、docs/prose 和 delivery/review 三组；
- `packages/skill/{skill,skill-filesystem,tool-skill}` 的 runtime Skill registry、provider discovery 与 model-facing loading；
- `packages/extensions/tool-cordis`、`cordis-host-runner` 源码、生成 tool catalog 与 package trust stance；
- `scripts/run-gates.ts`、testing policy 和相关 process Agent Notes；
- Web capability seam 的四个历史 commit 与当前 Agent Note；
- 2026-09-24 轮新增：`CONTRIBUTING.md`、`.github/review-ownership/**`（README、`approval-policy.json`、`check-approval.mjs`、`blame-ownership.mjs`、`blame-production.py`）、`scripts/release/**`、`native/system/docs/release.md`、`python/development.md` 的发布节、`apps/desktop/README.md` 的 Release versions 与 Windows EV signing 节、`docs/session-format-status.md`、`docs/persistence-changes/releases/`、`docs/postmortem/`，以及发布/预览/评审 workflows（`release`、`release-publish`、`release-vendor`、`release-vendor-publish`、`node-addon-system-release`、`python-release`、`docs-pages`、`build-preview-cloudflare`、`weighted-approval`、`weighted-approval-review-event`、`ci-master`、`sandbox`、`e2e`）；
- 2026-09-24 轮新增：git 历史证据——22 个 `dsh-v*` tag 序列、相邻 tag 的 commit 区间、merge 与 squash 并存的落地形态、`rel/dsh-0.1.7-rc.1` → PR #5073 → tag `dsh-v0.1.7-rc.1` 所指 release commit 的发布样本。
- 2026-09-24 深挖轮新增：`.agents/notes/AGENTS.md` 的 supersession check 常设指令、no-index Agent Note（`implemented/process/2026-07-19-remove-generated-agent-note-index.md`）、`.agents/notes/README.md` 的 “Alternatives considered — mandatory” 与 “Layout and naming” 两节；基线四类 Note 目录英文计数复核（implemented 972、archived 1279、rejected 28、proposed 39，六个 class 目录齐全；0009 独立反查勘误：前三数实为 en+zh 合计口径，rc.1 英文实测 486、639、14，proposed 39 为英文口径无误）、AGENTS.md 总数 22、`.agents/skills/` 14 个目录（12 个 `dsh-` 前缀）复核；语料全部 92 个唯一钉版路径、28 个锚点、29 条带出处引文经脚本 + 人工逐字回对。
- 2026-09-24 第四段新增：`packages/README.md`（分组表、release expectations、依赖方向）、`packages/AGENTS.md`、`snapshots/AGENTS.md`（session fixture 放置与世代规则）、`vendor/README.md`（vendoring manifest 与本地修改日志）、`scripts/doc-budgets.manifest.json` 与 `scripts/translation-pairing.manifest.json`、`docs/cordis-tutorial/index.md` 与 `07-into-the-harness.md`、`docs/user/develop/{basic,framework,practice}/**`（basic 的 index/config/tool/publish 与 framework、practice 各页开篇）、根 `README.md` 的 Run 节、`.github/AGENTS.md`、`docs/subsystems/README.md`；`package.json` 的 `gen:*`/`verify:*-catalog` 命令族清点。

【0008 复核：本条挂账已关闭】上游已把该 note 整篇重写为 "Cordis runtime inspection and runner isolation"，与两工具现状对齐；工具面在 0.1.7 线收敛为 `cordis_inspect_list`/`cordis_inspect_query` 两只读工具，持久安装走 plugin_manager。下文为 0007 时的原文记录：implemented Agent Note [`2026-07-08-self-referential-cordis-toolset`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md) 仍用 `cordis_inspect` / `cordis_mount` / `cordis_unmount` 三个工具的旧词汇描述动态 Plugin，而 [`tool-cordis` source](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/extensions/tool-cordis/src/index.ts)、生成 [`tool catalog`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/tool-catalog.md#deepseek-aidsh-tool-cordis) 与 package README 在 0.1.5 线曾列出七个工具。`repo-harness/06` 已按 0.1.7 线改述为两工具。

## 3. 结构与叙事约束

1. 三卷互补但独立：`native-development-model/` 只综合 owner、证据与交付判断的关系；`sdlc-reference/` 拥有精确条件、状态与例外；`repo-harness/` 拥有仓库入口、工具和反馈机制。任何一卷都不要求先读另一卷，也不把迁移到 FAQ 的历史案例当作前置知识。
2. 重要术语在新手层首次出现时同时给出英文名称和中文解释；后文保留仓库与 GitHub 中可搜索的英文名称。
3. 主链不把 Issue、proposed Note 和 Plan Mode 画成统一必经顺序；三者是条件入口，承载持久决定理由的变更的共同义务是 owning Agent Note（机械/局部编辑豁免，与上游收窄后的标准一致）。
4. `.github/` 是远端执行面，而非只在 Issue 小节中出现：模板、trusted policy、Project lifecycle、PR CI、自动依赖 PR 和相邻发布 workflow 各自标明职责。
5. Plan Mode 与 sandbox/approval policy 分离；`plan/mode` 只保存 `{ active }`，计划正文不属于该 event。
6. 本地 relevant evidence 与 PR CI matrix 分离；repository scripts 拥有检查逻辑，workflow 拥有触发、runner、权限、并发和聚合。
7. Semantic review 不被描述成人类独占动作。`dsh-code-review` 可由人或 agent 执行；human-review policy 约束的是人类作者 PR 的 metadata 适用范围。
8. Web seam 案例只证明 commit tree 中的 proposal、delivery bundle 和 implemented record，不证明 Issue、Plan、review、local commands 或 GitHub checks。
9. 本页拥有独立研究语料的发行边界：这些文件不是 bilingual product docs 或 website source，不创建 pairing sidecar 或站点投影。
10. 专题不引用其它研究语料，也不从其它语料加载校验逻辑；引用 DSH 时先在正文讲清结论，再用 blockquote 摘录关键原文，并标明 DSH 中的具体 owner 与可核对事实。
11. `sdlc-reference/` 独立定义 DSH 主仓变更流的条件、状态与例外，不依赖迁出的 Tutorial；`repo-harness/` 独立回答 DSH 怎样帮助 coding agent 理解、修改和验证 DSH。两条平级叙事通过可选内部链接协作，不复制对方拥有的详细事实。
12. Development Harness 从一个 fresh-agent 场景起步，再引入 legibility、procedural memory、paved road 与 inspectability；抽象术语不能成为新读者的前置条件。
13. `.agents/skills/` 的 repository development Skills 与 `packages/skill/` 的 runtime Skill capability 分开说明；相似的按需知识思想不能被误写成共享同一 registry 或调用机制。
14. Skills 拥有情境化工作流程，`AGENTS.md` 拥有 standing orders，repository gates 拥有确定性检查，`.github/` workflows 拥有远端调度，Agent Notes 拥有决定理由，current docs/source 拥有当前行为。
15. 每个目录必须有 `README.md`；README 负责目录导航，不复制 `00-index.md` 的教学叙事或本页的维护细节。

## 4. 图示

现有 SVG 分属 [SDLC Reference](../sdlc-reference/figures/README.md)、[Development Harness](../repo-harness/figures/README.md) 和 [Native Development Model](../native-development-model/figures/README.md) 三个图示清单；各清单拥有文件名与正文映射。主题 Markdown 不跨目录引用图，根 README 与 `_coverage/` 不拥有图。正文引用图后继续提供可搜索的机制与来源。每张 SVG 还提供与 `viewBox` 一致的固有尺寸，以及由 `role="img"`、`aria-labelledby="title desc"`、`title` 和 `desc` 组成的无障碍元数据。

## 5. 重审触发路径

以下路径在上游同步中变化时，将对应章节与图列为“需复核”，再检查它们：

- `.agents/notes/**`、`.agents/skills/**`；
- `.github/AGENTS.md`、`.github/ISSUE_TEMPLATE/**`、`.github/pull_request_template.md`、`.github/issue-management/**`、`.github/workflows/{ci,issue-policy,issue-lifecycle,e2e}.yml`、`.github/dependabot.yml`；
- `packages/plan/plan-mode/**`、`docs/subsystems/{plan,sandbox,approval}.md`、`packages/preset/agent-preset/**`、`packages/preset/agent-preset-registry/**`、`packages/bundle/web-app/presets/**`（0.1.7 线起 preset 重设计：旧 `packages/preset/agent-presets/**` 已删）；
- `packages/skill/{skill,skill-filesystem,tool-skill}/**`；
- `packages/extensions/{tool-cordis,cordis-host-runner}/**`；
- `AGENTS.md`、`packages/AGENTS.md`、`docs/{AGENTS,architecture,glossary,cordis-primer,testing}.md`、`docs/cookbook/**`；
- 2026-09-24 轮新增触发路径：`CONTRIBUTING.md`、`.github/review-ownership/**`、`scripts/release/**`、`.github/workflows/{release,release-publish,release-vendor,release-vendor-publish,node-addon-system-release,python-release,docs-pages,build-preview-cloudflare,weighted-approval,weighted-approval-review-event,ci-master,sandbox,e2e}.yml`、`apps/desktop/README.md`、`native/system/docs/release.md`、`docs/session-format-status.md`、`docs/persistence-changes/releases/**`、`.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md` 与同目录的 approval 系列笔记；
- `scripts/run-gates.ts` 与专题引用的 generated catalog owners；
- 2026-09-24 深挖轮新增触发路径：`packages/README.md`、`packages/AGENTS.md`、`snapshots/AGENTS.md`、`vendor/README.md`、`scripts/{doc-budgets,translation-pairing}.manifest.json`、`docs/cordis-tutorial/**`、`docs/user/develop/**`、根 `README.md` 的 Run 节；
- Web seam Agent Note 或专题引用的四个历史 commit 被重新解释时。

Release-only workflow 的内部 job 变化不自动触发整篇复核；只有它改变专题描述的触发边界、required evidence 或 daily PR flow 时才进入范围。

## 6. 验证

- 独立发行只需 Node：在语料目录运行 `node verify.mjs`；验证规则变更再运行 `node verify.test.mjs` 与 `node --check verify.mjs`、`node --check verify.test.mjs`。负例测试通过完整临时副本调用真实入口，检查固定发布标签、图示归属、越界链接、锚点与文件结束规则。
- 在 DSH checkout 内维护时，附加运行 `pnpm run verify-md-links`、`pnpm run verify-md-wrap`、`pnpm run test:docs` 与 `git diff --check`；这些宿主命令不是独立发行依赖。本语料遵守宿主引用门禁：现行证据使用固定 release tag，历史样本保留非 commit 标识的定位方式。
- 修改 SVG 后渲染受影响文件，检查 XML、尺寸、文字与连线。源码几何检查和成功渲染不等于视觉验收，未用可看图工具确认时明确记录限制。
- Repository-level 完整文档校验为 `pnpm run doc-sync`。检查失败时区分语料内缺陷、目录外已有违规、构建前提与工具链问题，记录 exact command 与错误；不得把目录级通过写成全库绿色证据，也不能把命中本语料的报错全部称为目录外问题。

2026-08-24 的 repository-level 复核没有建立绿色 `doc-sync` 结果：`corepack pnpm run doc-sync` 完成 28 项中的 25 项，`doc-typecheck` 缺少 `lib/types/{index,invariant,startup}.js` 构建入口，documentation build 命中 host Corepack 的 `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`，translation pairing 因仓库 scope 包含本语料而拒绝 8 个 README。前两项需要目录外构建或工具链修复；pairing exclusion 由目录外的 `scripts/translation-pairing.manifest.json` 拥有。目录级检查通过不能替代这三项 repository-level 结果。

2026-09-05 的 rc.1（`dsh-v0.1.2-rc.1`）复核：全部目录外 DSH 引用 URL re-pin 到 rc.1；机制扫描（invariant 空 companion 废除、subagent report 工具删除、schedule 非 seam、apiproxy 删除、profile 组合变薄层、agent preset 改名 ptc、session header 去 seedLength）在本语料正文无命中，证据正文无需修订。目录级 verify 通过。

2026-09-16 的 0.1.5-rc.1（`dsh-v0.1.5-rc.1`）re-pin 与逐条复核：118 处目录外 DSH 引用 URL（约 57 个唯一 URL）从 `dsh-v0.1.2-rc.1` 改钉到 `dsh-v0.1.5-rc.1`（17 个内容文件，另同步 `verify.mjs` 的钉版正则和两处正文中的 commit 说明）。旧基线列出的 58 个钉版路径逐一用 `git cat-file -e` 在该 commit 复核：57 个仍然存在，1 个已不存在（`.agents/skills/dsh-doc-site-sync/SKILL.md`，内容早先并入 `dsh-doc`），改后 57 个路径全部存在。目录级 verify 通过（32 Markdown、1 scripts、15 SVG）；11 个带 fragment 的钉版 URL 的锚点、以及全部 blockquote 引文都对照该 commit 重新核对。上一轮预告的四项处理结果：

1. `.github/ISSUE_TEMPLATE/` 确认只剩 `Bug / Feature / Task` 三种模板且 `config.yml` 关闭空白 Issue，折叠的验收与测试证据区已删除 → 改写 `sdlc-reference/02` §1；§2 的 policy 条件逐条比对 `policy.mjs` 后仍然成立。
2. `.agents/notes/` 归档确认发生：implemented note（不含 `README.md`/`AGENTS.md`）从 644 篇降到 291 篇，archived 从 170 篇升到 628 篇，其中 445 篇按同名路径从 implemented 迁到 archived。语料钉版的 5 个 implemented note（`quality-gates`、`uniform-agent-note-format`、`web-capability-seam`、`self-referential-cordis-toolset`、`native-github-stacks-and-optional-rebases`）与 1 个 archived note（`incremental-pr-base-retargeting`）在该 commit 都仍在原位置，无需改路径；预告中的 `quality-gates`、`native-stacks`、`self-referential-cordis-toolset` 迁移并未发生。
3. `.github/AGENTS.md` 平台矩阵确认反转：native Windows build 与 native tests 计入 PR 的 `all checks passed`（`ci.yml` 的 `needs` 含 `windows-build`、`windows-native-tests`），Wine 只在 master-only 的 `ci-master.yml` 用 hosted Linux 运行 → 改写 `sdlc-reference/04` §4 与证据入口，并同步 `figures/evidence-routing.svg` 的 Windows 方框文字。
4. `docs/` 清单：本轮跨度新增 `session-format-status.md`、`subsystems/client-resources.md`、`subsystems/sidebar-right.md`、`user/guide/network-proxy.md` 与 `cookbook/adding-a-session-format-version.md`，没有删除任何 `docs/` 文件（apiproxy 面的删除属于更早的跨度）；新增文件都不是 generated catalog，`repo-harness/06` 的 catalog 清单与 `docs/cookbook/extension-cookbook.md` 的索引范围仍然成立，无需改写。

逐条复核另外发现并修正的问题：

1. `.agents/skills/dsh-doc-site-sync` 在旧基线就已不存在（内容早先并入 `dsh-doc`）→ `sdlc-reference/05` 的正文与证据入口改指 `dsh-doc`；`repo-harness/03` 的 Skills 表同步补正为 12 个仓库 Skills（新增 `dsh-ci-test-reliability`、`dsh-speed-up-perf`，移除不存在的项）。
2. `packages/extensions/tool-cordis/README.md#trust-stance` 锚点在新旧两个 commit 都不存在，信任边界现在住在 “Boundaries to plan around” 一节 → `repo-harness/06` 与 `07` 改锚。
3. invariant companion 规则：`packages/AGENTS.md` 早已规定空 companion 会被 `verify-package-invariants` 拒绝，语料仍写“允许说明理由的空 installer” → 修正 `sdlc-reference/06`、`repo-harness/02`、`repo-harness/05`；2026-09-05 条目中“invariant 空 companion 废除在本语料正文无命中”的判断有误。
4. `sdlc-reference/03` 的 plan 引文在旧基线也不是原文（含义相近但措辞不同，且归属文件不对）→ 改引 `docs/subsystems/plan.md` 的原文；同页 `foldPlanMode()` 只是测试内 helper，已改述为 `ctx.planMode` 经可选注册的 `plan` projection unit 读取。
5. 维护页 §5 的重审触发路径 `apps/cli/config/agent-presets/**` 在旧基线已不存在 → 改为 `packages/preset/agent-presets/**`。

复核后未改动的部分：`sdlc-reference/02` 的 policy 函数与 workflow/Dependabot 事实、`sdlc-reference/04` 的 `change-scope`、hook 与证据路由表、`sdlc-reference/07` 的 stack 流程、`repo-harness/01`、`04`、`06` 的机制清单、`sdlc-reference/08` 的四个历史 commit 与现行 Note 结构，以及 `sdlc-tutorial/` 全篇，都与 `dsh-v0.1.7-rc.1` 一致。

本轮只做语料级验证：`node _dsh_plugin_agent_ready_development/verify.mjs` 通过（32 Markdown、1 scripts、15 SVG），`npx tsx scripts/verify-md-wrap.ts`、`npx tsx scripts/verify-md-links.ts` 与 `git diff --check` 也都通过，且语料中没有任何 URL 仍钉在旧 commit。完整 `doc-sync` 未在本轮重跑，2026-08-24 条目记录的目录外阻断仍然适用。

2026-09-16 的 0.1.5-rc.2（`dsh-v0.1.5-rc.2`）re-pin：本语料的固定基线从 `dsh-v0.1.5-rc.1` 推进到 0.1.5 的最后一个 RC `dsh-v0.1.5-rc.2`，118 处目录外 DSH 引用 URL（约 57 个唯一 URL）全部改钉（17 个内容文件，另同步 `verify.mjs` 的钉版正则、`repo-harness/00-index.md` 的 baseline 声明与本页基线行）。钉版路径与锚点**逐一**在 rc.2 用 `git cat-file -e` / 标题比对复核：57 个唯一路径全部存在，11 个带 fragment 的锚点全部解析到 rc.2 的标题或 HTML id。rc.2 相对 rc.1 只有 4 个提交、1 个内容提交（feedback 提交对称化 + `ui-deliverables`/`ui-primitives` 细化），未触及本语料引用的任何文件，因此正文机制陈述无需修订。目录级 verify 通过。（0008 复核复原注记：本条基线标识在 0008 轮的机械 re-pin 中被误替换为 0.1.7-rc.1；实际基线是 `dsh-v0.1.5-rc.2` 所指的 release tag，已按 git tag 证据复原。0013 轮起历史条目不再记录 Git commit 标识。）

**pairing exclusion 落地（同批）**：2026-08-24 条目记录的最后一项目录外阻断——translation pairing 因仓库 scope 覆盖「每个非 vendor README」而拒绝本语料的 8 个 `README.md`（另外两个研究语料没有 README，所以只有本语料命中）——已按该条目预告的方式关闭：`scripts/translation-pairing.manifest.json` 的 `excluded` 增加目录项 `"_dsh_plugin_agent_ready_development/"`（尾斜杠是路径边界），本语料整体退出双语配对 scope。此后 `npx tsx scripts/run-gates.ts doc-quick` **16 项全绿**（此前 15 通过 1 失败），`verify-translation-pairing` 报 789 对全部一致。2026-08-24 条目余下的两项（`doc-typecheck` 缺少构建入口、documentation build 的 host Corepack `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`）仍需目录外构建或工具链修复，本语料无法自行关闭。

## 2026-09-23 的 0.1.7-rc.1（`dsh-v0.1.7-rc.1`）re-pin：整树照搬口径首次执行

本语料的固定基线从 `dsh-v0.1.5-rc.2` 推进到 `dsh-v0.1.7-rc.1`（0.1.6 线未出 RC 即跳线；0.1.7-rc.1 为当前最后一个 RC）。自本卷起同步口径为**整树照搬**：产品源码完全等于 upstream tag，本地只保留四个语料目录；332 个 ethan-only 产品文件随同步退役（含 0007 的五处上游文档修复——全部被上游自行吸收，及本地 frontend-static no-store 修复——登记为上游候选缺口）。

66 个唯一目录外 DSH 引用 URL（115 处文本出现）全部改钉到 `dsh-v0.1.7-rc.1`，钉版路径与锚点逐条用 `git cat-file` / 标题比对复核：63 条直接通过；3 条按 rc.1 现实改写——`tool-cordis/src/prompt.ts`（#4745 删除，查询纪律改由工具描述自述，改钉 `src/index.ts`）、`agent-presets/presets/ptc/agent.cordis.yml`（preset 重设计，改钉 `packages/bundle/web-app/presets/ptc.patch.yml`）、tool-cordis README 的 `boundaries-to-plan-around` 锚点（节已删，改钉 `known-limitations-and-deferred-work`）。`verify.mjs` 钉版正则与 `repo-harness/00-index.md` 基线声明同步。目录级 verify 通过。（0008 独立复核注记：本轮改钉只更新了 URL 与三处机制改写，正文若干「当前事实」陈述未同步——Agent Note 收窄标准、tier 表 Persistence history 行、skills 清单（新增 `dsh-client-ui-ux`、`agent-experience`）、preset 触发路径、`repo-harness/06` 的七工具残留段——已在本轮独立复核中补正，见各页 0008 复核注记。）

## 2026-09-24 的主链两端补齐（intake 与 release），基线不变

本轮不 re-pin：基线仍是 `dsh-v0.1.7-rc.1`（`dsh-v0.1.7-rc.1`），产品源码未被触及，全部新增页面只引用既有基线内容与该仓库 git 历史。动因是复核确认旧语料把 SDD 主链挖窄了：`sdlc-reference/02` §6 自己声明 release workflows「不属于每次代码变更的 Issue → PR 主链」，SDLC Tutorial 把 GitHub Flow 讲成通用协作流，且从未出现 merge 的真实批准门禁。本轮以四组一手证据补齐：

1. **意图入口（新 `09`）**：`CONTRIBUTING.md` 明确「cannot accept external pull requests at the moment」、外部反馈走 GitHub Discussions；`config.yml` 的 `blank_issues_enabled: false`；Bug/Feature/Task 三模板与 semantic issue templates note 的收敛决定；`issue-management/config.json` 的完整状态机与 event-directed review commands note；label taxonomy note 的 kind/area/Type/source 分工；proposed Note 池（39 篇英文提案）、FIXME/TODO/XXX 与 postmortem 作为非 Issue 意图载体。
2. **批准门禁（新 `10`）**：`.github/review-ownership/` 的加权批准体系——`approval-policy.json`（2 分门槛、六位 2 分评审人）、blame 归属加权公式与生产代码定义、作者信用封顶 1.1、pending/success/error 状态机、`/delegate` 转移与收回、default-branch 信任边界；旧语料只讲了 metadata policy，从未讲过 branch rules 实际要求的 `weighted approval` commit status。
3. **发布上线（新 `11`）**：npm release sequences note + `scripts/release/**` + 发布 workflows 的完整链路——三条 release family、本地 bump 经 `rel/*` PR 落库（样本：`rel/dsh-0.1.7-rc.1` → #5073 → `dsh-v0.1.7-rc.1`）、人工 tag、无凭据 rehearsal 常开、publish 为 manual dispatch + `npm-publish` environment、registry 三态、docs/Python/native/Desktop 各 lane、无 CHANGELOG（由 `docs/persistence-changes/releases/` 与 Agent Notes 承载）、发布后 Session record 更新义务。
4. **git 历史轨迹（支撑 `10` §5 与 `11` §2）**：在可复核窗口内（本地 checkout 为 shallow，master 线可见约 2026-07-30 之后；22 个 tag 全部可见）确认——merge commit 是主导落地形态（约 33% 的 commit 为 merge，PR merge 标题带 PR 号），squash 为少数；PR commit 数中位数 3、众数 1（0009 独立反查重测：众数 2、单 commit 约 19%，旧读为该轮样本口径误差）；分支命名是类型前缀（`feat/`、`fix/`、`rel/`）与执行者命名空间（`worktree/`、`codex/`、`turtle/`、`ihsiang/`）并存并常带日期后缀；release tag 直接打在 release PR 的 merge commit 上，距前一个 feature merge 约 19–41 分钟（0010 轮重测：23m48s/40m34s/19m27s；0009 轮的 24–41 读数不可复现）。两个端到端案例：semantic issue templates（note 直接诞生于 implemented/，note+模板+policy+测试同一 commit（提交标题 `refactor: simplify issue templates and policy`），经 PR #3529 merge 落库，首个包含 tag `dsh-v0.1.3-alpha.2`）；conversation build groups（PR #4758 内 proposed-intro docs commit → 实现 commits → 独立的 implemented 移动 commit，同 PR 异 commit）。语料维护 commit 在 fork 本地分支直接提交、不经 upstream PR pipeline（fork 与 upstream 仅以周期性 sync merge 连接）。
5. **根 README 声明改写**：按用户要求写明「语料的全部理解只从 DSH GitHub 仓库一手挖出」，并把钉版表述改为「本轮尊敬的版本，随上游版本演进不断 re-pin」，不是永久前提；历轮记录仍由本页承载。

同轮修正的旧偏差记录：`sdlc-reference/02` §6 与 `sdlc-reference/00-index` 补充指向 `09`–`11` 的导航，`sdlc-reference/06` §1 补充指向 `10` 的加权批准门禁；`sdlc-reference/10` §5 按 git 历史证据把 merge 形态改述为「merge commit 主导、squash 少数」，并补 PR 规模分布与分支命名两类前缀。新增页面全部引用钉版 URL，锚点按标题或既有 `<a id>` 核对；`09` 初稿误写的 `#the-two-dimensions` 锚点已改为 `#decision`。本轮运行 `node _dsh_plugin_agent_ready_development/verify.mjs` 通过（35 Markdown、1 script、15 SVG），未重跑 repository-level `doc-sync`（2026-08-24 条目的目录外阻断仍然适用）。

## 2026-09-24 的目录更名与语料自查

同日第二段工作，基线仍为 `dsh-v0.1.7-rc.1` 不变：

1. **目录更名**：`foundations/` → `sdlc-tutorial/`、`advanced-sdd-flow/` → `sdlc-reference/`、`development-harness/` → `repo-harness/`。动因是用户指出三个视角从目录名看不出来：旧名"foundations vs advanced"看不出是同一条流程的两种深度，"advanced-sdd-flow"也不再准确（该卷现已覆盖 intake → release 全程），"development-harness"易读成产品功能而非仓库视角。新名把关系写进名字：`sdlc-tutorial` 与 `sdlc-reference` 是同一条变更主线的 tutorial/reference 两层，`repo-harness` 是另一个视角（仓库作为开发 Harness）。`verify.mjs` 的 figures 归属表、全部交叉链接、图示 README 与本页同步改写；正文术语保留 "Development Harness"（DSH 语境已建立），`repo-harness/README` 说明目录名与术语的对应。全文清扫了依赖旧目录名的措辞（“高级参考”→“参考”等）。
2. **README 定位重写**：根 `README.md` 新增「目录：每个子目录为什么存在，什么时候改它」表（定位 + 改动时机），三个主题目录与 `_coverage` 的 README 各自写明本层定位、不拥有什么与相邻目录分工；图示 README 保留既有归属表。
3. **多维度自查发现并修正**：`repo-harness/06` 证据入口残留「三个 inspect 与四个 lifecycle tools」旧事实（与正文两工具表述矛盾）→ 改为两个只读工具；`repo-harness/06` 工具描述引文与源码原文不符 → 改引 `src/index.ts` 真实 description；`repo-harness/06` “像 bash access 一样对待”与“vm 隔离归属 Tool Cordis”两句基于旧 note → 按改写后的 note 修正为“vm 只防意外全局污染、注入服务仍有真实权限、`tool-cordis` 本身只读”；`repo-harness/07` 引文 `bash-equivalent trust` 在改写后的 note 中已不存在 → 换为现行原文 "The vm prevents accidental global pollution; …"，`07` §4 同步；`repo-harness/01` 拼接引文（`docs/AGENTS.md` 名义下混排两个来源）→ 改为 `.agents/notes/README.md` "When to write one" 的逐字原文。教训记录：0008 轮对 note 改写的复核只到了正文事实层，没有逐条回对“引文 blockquote 是否仍逐字存在”，本轮已补齐；后续 re-pin 应把“引文逐字回对”列入固定动作。
4. **复查轮（应用户要求按初始标准再过一遍）**：对 `09`/`10`/`11` 全部事实断言重对一手源码——新核验通过的引文与数据：label taxonomy 总规则、`.agents/notes/AGENTS.md` RFC 句、postmortem 定位句、skill description 的 "Use …" 模式、`AGENTS.md` 文件总数 22（root + 21 子树）、`families.ts` 版本一致断言、三组相邻 tag 的 commit 数（4/3/156）。据证据修正四处措辞：`09` 的 skill description 概括从 `"Use when …"` 放宽为 `以 "Use …" 开头`、“约 20 个子树”改为 21；`10` §1 补全 workflow 的两个 PR 检查（publisher job 与 commit status）并把 branch rules 约束改述准确（只要求 commit status、expected source 为 GitHub Actions、防同名 context 冒充），§1 归因跳过条件改为 README 原文口径（评审人分数加作者信用达门槛或存在 blocking review，删去无出处的“作者是 2 分评审人”）；`11` §2 “前一个 feature merge”改为“前一个 merge commit”。同轮把 `sdlc-reference/` 十一个页面标题与互链的旧前缀 "Advanced NN" 统一改为 "Reference NN"，与新目录名一致。第三遍整页通读 `09`/`10`/`11` 并做标点扫描：修正 `10` 半角括号与“其standing decision”缺空格、`09` 三处措辞（“SDLC Tutorial 中 GitHub Flow”“事件”、area 禁止清单补全至状态/人/团队）、`11` 引文后重复句点，并把 `10` 的 PR 规模样本明确为“最近 100 个 PR merge”；`verify.mjs` 在目录名 sed 改动后 `node --check` 通过。
5. **根 README 新增宗旨节**：按用户要求在「三个视角」之前加入「宗旨：为什么选 DSH 的开发体系做研究对象」，说清三层理由——DSH 是被实践长期使用的优秀 coding-agent harness（作榜样解剖而非教条转述）；它自举（用自己的体系开发自己，git/CI/notes/发布证据可互相印证）；它既能开发传统程序也能开发智能体、产物可能是另一个 harness，递归场景的整理难度即学习价值。

## 2026-09-24 的第三段：.agents/notes 深挖复核与引文逐字回对清扫

同日第三段工作，基线仍为 `dsh-v0.1.7-rc.1` 不变。动因是用户复核指出 `.agents/notes` 这一块的精髓没有抓全（抓了大部分），且各子目录“各司其职”的叙述有发挥空间。本轮做四件事：

1. **机械同步审计**：自写脚本（未入库）对语料全部钉版引用做三层校验——92 个唯一路径全部在基线 `git cat-file -e` 存在；28 个带锚点 URL 全部解析（标题 slug 或 `<a id>`，`#L<n>` 行号未越界）；29 条带出处 blockquote 按 `[...]`/`…` 省略切分并空白归一后逐字回对。目录级 `verify.mjs` 结构检查同步通过。
2. **引文偏差修正**：逐条人工判定 10 处未过引文。两处拼接改掉——`sdlc-reference/02` 曾把 `rules.mjs` 的 JSDoc 首句与函数体 return 表达式拼成一句（改为只引 JSDoc 原句，函数体留给下节代码块）；`sdlc-reference/09` 曾把 CONTRIBUTING 正文与相邻 bullet 用「—」连接（改为显式 `[...]`）。四处标点/格式偏移恢复逐字——quality-gates 句尾 `:` 被改成 `.`、dsh-code-review 在 `over style;` 处截断改句号（现引到句尾 “list of nits”）、tool-cordis 引文自加的反引号删除、architecture.md 引文把代码块压成行内代码（改为引文内 fence）。两处注释续行拼接（weighted-approval.yml 的 `#` 注释、bump.ts 的 JSDoc ` * ` 续行）与两处渲染形引用（源文件内链接/加粗在引文中 de-markdown）判定为逐字等价，保留不改；此判定口径记为本页后续 re-pin 的固定动作。
3. **旧创建标准残留清理**：0008 收窄后的「持久决定理由」标准此前只改了正文，图与本页结构约束漏改。本轮清理——`agent-note-lifecycle.svg` 副标题「每个非平凡变更要覆盖一个 decision owner」、`change-control-map.svg` 两处「每个非平凡变更必须（有）」、`fresh-agent-loop.svg` 步骤 4 把 owning Note 无条件列入交付组合（补「持久理由」限定）、本页结构约束 #3 的「非平凡变更的共同义务」，全部改为收窄后口径；`sdlc-tutorial/02` 的「源码表达不了」补全为 README 原文的 code, tests, and existing documentation 三主体。教训同 0008：正文修正必须连带检索图内文字与本页结构约束里的同款表述。
4. **`.agents/notes` 精髓补全**：语料此前抓全了生命周期、路径编码与格式 gate，漏了四条系统级设计。(a) 强制备选的存在目的——“A decision recorded without what it beat invites re-litigation — the failure Agent Notes exist to prevent”，且备选只能记录不能编造；(b) 路径树即工作清单——刻意不设集中 `INDEX.md`（历史生成索引已被移除并由 no-index Note 拥有理由），交叉引用只用相对 Markdown 链接、可机械检查、跨 lifecycle 移动后存活；(c) `.agents/notes/AGENTS.md` 常设指令——每新增一篇 Note 都触发 supersession check，完整取代要收敛的 implemented triplet 在同一个 PR 内归档；(d) archived 不是第四种状态——`Status:` 只有三种且与目录互相校验，归档保留 `Status: implemented`、只在其下插 `Archived:` 行，只有 implemented Note 能进入。(a)(b) 的引文与说明进入 `sdlc-reference/01`（§2 补路径树即清单段、§4 补反重提讼目的段），(c) 进入该页 §6，(a)(b) 同时以短引文与索引策略对比进入 `repo-harness/02`（负知识节 + 生成目录节），(d) 改写该页 §3 标题（「四个状态」→「三个 lifecycle 状态与一个冻结存放地」）与表后说明，并同步 `agent-note-lifecycle.svg` 的 desc。证据入口补 `.agents/notes/AGENTS.md` 与 no-index Note 两条。

## 2026-09-24 的第四段：结构盲区检查与分类学、插件作者入口两篇新页

同日第四段工作，基线仍为 `dsh-v0.1.7-rc.1` 不变。动因是用户提出两点：一怕语料既有的三视角结构本身限制了捕捉——装不进 tutorial/reference/repo-harness 框架的 DSH 信号可能从一开始就没进语料；二想抓 DSH 分类体系的 ground rules（哪个目录放什么、静态还是动态），因为读者的典型用途是开发 DSH 插件，插件仓库与 DSH 本体沿用同一套分类词汇时 coding agent 的信噪比最高。

1. **盲区判定**：反向扫基线原树的规则 owner 文件后确认盲区属实——语料三视角全部对准“DSH 开发自身”，两块真实信号落在框外：(a) DSH 为插件作者维护的完整文档 tier（`docs/cordis-tutorial/` 七讲 keyless 可运行教程 + `docs/user/develop/{basic,framework,practice}` 三层指南 + bundle/profile 打包模型），语料零覆盖；(b) 仓库自身的分类系统（`packages/README.md` 的分组与 release expectations、`snapshots/AGENTS.md` 的证据放置规则、`vendor/README.md` 的所有权边界与修改日志、生成/混合/录制内容的机器边界、预算与双语配对清单），语料只在“生成目录降低查询成本”一处部分触及。另核实基线无 `examples/`（上游已退役，工作树残留为未跟踪 node_modules），语料不涉。
2. **新增 `repo-harness/08-repository-taxonomy.md`**：顶层分区各辖其职表、包“恰好属于一个组”与 product/support/experimental 发布期望、依赖方向规则、内容的五种维护形态（手写 / 生成+freshness / 混合 cordis-surface 与 type-equiv / 录制 snapshots 与 archived / 投影 website）加预算与双语两个仪表、`snapshots/` 只收 session 回放的放置规则、vendor 作为所有权边界（owned 而非 depended，分叉逐条留痕）。
3. **新增 `repo-harness/09-plugin-author-entry.md`**：cordis-tutorial（audience 是 agent developers、scratch 可运行、末讲接入真实 tools service）与 user/develop 两条线的分界（`cordis.yml` 加载 + Web UI 驱动）、插件最小定义（导出 `apply` 的 TS 模块，DSH 自身包同为此种插件）、bundle/profile 二分（“Nothing is both”）与 plugin → bundle → profile 发布链；§4 为标注的语料归纳——插件仓库对齐词汇的收益与继承边界（DSH 不要求插件仓库复制 AGENTS.md/Notes/gates）。
4. **导航与定位同步**：`repo-harness/00-index` 阅读路径表加两行，`repo-harness/README` 内容表改 01–09，根 README 宗旨节补一段“读者典型用途是开发 DSH 插件”的定位并指向新两篇。两篇新页均无图（页不强制配图，`verify.mjs` 不要求）。
5. **验证**：`node _dsh_plugin_agent_ready_development/verify.mjs` 通过（37 Markdown、1 scripts、15 SVG），钉版审计脚本对新增 URL 全过（路径与锚点，含 `#package-groups`、`#release-expectations`、`#dependencies`、`#what-is-a-plugin`、`#two-concepts-two-manifests`、`#local-modifications`），新页全部 blockquote 逐字回对；`npx tsx scripts/verify-md-links.ts`、`npx tsx scripts/verify-md-wrap.ts` 与 `git diff --check` 通过。

## 2026-09-24 的第五段：分类学与插件作者两页补图

同日第五段工作，基线不变。动因是用户指出两篇新页（`repo-harness/08`、`09`）缺一目了然的图示，且点出真正要画的复杂性是三个结构的并存：DSH 本体结构、插件开发所依赖的组合结构、插件自身的结构。

1. **新增 `repo-harness/figures/content-maintenance-forms.svg`（08 页）**：五列展示手写 / 混合 / 生成+freshness / 录制 / 投影五种维护形态（各含例子与机器边界，副标题声明“从左到右机器参与度递增”）；下方 “docs/ 分区剖面” 四个 chip + website chip 与上方五列垂直对齐，承载“形态由 owner 与 gate 决定、不由目录名决定——docs/ 一个目录住四种形态”的核心洞见；底部条收束三条放置规则（分组表、snapshots/AGENTS.md、vendor 修改日志）。列序按机器参与度排（混合居第二），08 页正文表格保持手写/生成/混合/录制/投影原序未改——图讲频谱、表讲逐类边界，两序并存有意为之。
2. **新增 `repo-harness/figures/plugin-three-structures.svg`（09 页）**：三面板画三个结构——DSH 仓库（词汇与机制 owner，含 packages/apps/docs/.agents/.github·vendor 迷你树）、插件仓库（hello-plugin/ 的 package.json dsh.bundle、cordis.patch.yml、src 插件模块）、运行时组合（$DSH_HOME/profiles 的 dsh.profile、bundle 层叠加、挂进 ctx）；顶部流程条（词汇与教程 → dsh plugin add → bundle 进入 profile）、面板间裸箭头、底部虚线回环箭头（挂回同一棵运行时插件树）与 coding agent 双仓库视角条（含继承边界）。初稿流程标签放在 30px 面板间隙中导致溢出，改为顶部流程条承载全部流程语义。
3. **几何自检**：自写宽度估算脚本（CJK≈字号、ASCII≈0.6×字号）检查全部新图文本是否溢出所在容器与画布，两图均通过并用 `rsvg-convert` 渲染成功；同一脚本对第三段改过的三张图复核，被标记项均为存量版式或旋转文本误报（本段未触及），不翻修。
4. **同步**：`repo-harness/figures/README.md` 登记两张新图的正文 owner；本页 §4 图示计数 15 → 17。`node _dsh_plugin_agent_ready_development/verify.mjs` 通过（37 Markdown、1 scripts、17 SVG），`npx tsx scripts/verify-md-links.ts`、`npx tsx scripts/verify-md-wrap.ts`、`git diff --check` 通过。

## 2026-09-30 的 0.2.0-rc.2（`dsh-v0.2.0-rc.2`）re-pin：0.2.0 线首轮对齐

本语料的固定基线从 `dsh-v0.1.7-rc.1` 的源码树推进到本地同步提交 `sync(upstream): 整树照搬 dsh-v0.2.0-rc.2（0009 卷）`，整树照搬口径不变。113 个唯一目录外 DSH 引用路径（130 个唯一 URL、243 处文本出现；0009 独立反查按本页「唯一 URL 数」口径勘误）当时全部固定到该本地同步提交；0013 轮才改成真正的 release tag，并核对配对清单的唯一差异。钉版路径与锚点逐条用 `git cat-file -e` / 标题 slug 比对复核：113 条路径全部存在，29 个锚点（含 1 个 `#L32` 行号锚）全部解析到 rc.2 的标题或文件行。`verify.mjs` 钉版正则、`repo-harness/00-index.md` 基线声明与本页基线行同步。目录级 verify 通过。

机制改写（正文按 rc.2 现实逐条核实）：

1. **Skills 计数与符号链接**：`.agents/skills/` 从 14 个目录（12 个 `dsh-` 前缀）变为 15 个（13 个），新增 `dsh-create-upgrade-guide`（对应根 `AGENTS.md` 新增的升级指南常设指令）；`agent-experience/SKILL.md` 从普通文件改为指向 `packages/preset/agent-preset/skills/agent-experience/SKILL.md` 的符号链接。`repo-harness/03` 分组表、`sdlc-reference/09` 与本页 §2 同步。
2. **README.i18n.yaml 格式变更**：上游把根 README 的配对记录从整文件 blob hash 改为按标题分节的双语 hash（每节 `en`/`zh` 两值）。`sdlc-tutorial/01` 的证据表加注——主例提交（PR #5004 的交付提交）当时仍是整文件 hash，正文描述对该提交仍然成立。
3. **字数上限**：根 `AGENTS.md` 的 doc budget 从 1,950 提到 1,960（`docs/AGENTS.md` 与 `scripts/doc-budgets.manifest.json` 同步）；`_misc/_eval_harness/02` 的例证卡随之改数（该目录钉版声明同步改到 rc.2）。
4. **tag 计数**：`dsh-v*` tag 从 22 个增到 25 个（`dsh-v0.1.7-rc.2`、`dsh-v0.2.0-rc.1`、`dsh-v0.2.0-rc.2`）；`sdlc-reference/11` §2 的「截至基线」计数加注更新，历史样本 commit 不改。

核对后未改动的部分：`tool-cordis` 在 rc.2 仍只注册 `cordis_inspect_list`/`cordis_inspect_query` 两个只读工具；`packages/plan/plan-mode` 只删去 `exit_plan_mode` 描述中的一句措辞（审批时序与「完整计划作为 tool input」的机制陈述不受影响）；`packages/client/ui-settings-models/README.md` 的变更（DeepSeek Account 行、preview notice 措辞、凭据保存细节）不触碰 tutorial 主例断言的选择器行为；`packages/README.md` 新增 `telemetry/` 组并改 `schedule/` 描述，语料只引用其分组/发布期望/依赖规则原文（三节未变）；`docs/subsystems/approval.md` 新增可选 `displayReason` 字段，不推翻 `sdlc-reference/03`/`10` 的任何断言；`scripts/run-gates.ts` 新增 `ci-unit` 聚合、移除 coverage timeout 传参，`sdlc-reference/04` 未复制 gate inventory（明示以脚本为真源），无需改写；`.agents/notes/{implemented,archived,rejected,proposed}` 英文计数变为约 1050/1282/28/78，本页 2026-09-24 深挖轮条目作为该轮历史记录保留原数。AGENTS.md 子树计数（21）不变。

## 2026-09-30 的 0009 独立反查（按维度重测）

re-pin 轮之后另做一轮**按维度**的独立反查（全量引用反查、实体正向覆盖、硬数字重测、口径一致性四线并行）。本语料修复：`sdlc-reference/11` 的版本基线（`0.1.7-rc.1` → `0.2.0-rc.2`，re-pin 漏网）与 release 间隔口径（约 24–41 分钟）；`sdlc-reference/10` 与本页 `:120` 的 PR merge 样本读数（众数 2、单 commit 约五分之一，最近 100 个 PR merge 重测）；`sdlc-tutorial/02` 的 Note 类别数（六）；`sdlc-tutorial/03`、`04` 与 `sdlc-reference/04` 的 PR CI job 结构（9 必需 + 不进聚合的 `windows-coverage`；observational gates 是 required Windows build job 内 step）；`sdlc-reference/09` 的 Skill description 前缀表述（实测 9/15 以 "Use" 开头）；`repo-harness/08` 的 pairing manifest 归属（与门禁发现范围逻辑共同定义）；`_misc/_eval_harness/README.md` 的例证钉版与 `_eval_harness/02` 的 npm-publish job 口径（每条发布序列一个）；本页 `:30` 加 en+zh 合计口径勘误、`:120` 间隔与 `:165` 唯一 URL 数（130）口径统一。钉版纪律复核：113 条钉版路径全量 `git cat-file -e` 全部存在，29 个锚点全解析，内容一致性抽查 5/5 逐字吻合。

## 2026-10-08 的 0014 轮：agent 契约证据页

基线仍是 `dsh-v0.2.0-rc.2`。`sdlc-reference/12-agent-contract-evidence.md` 拥有 agent 侧三件资产的条件、例外和原文位置：看见的请求、可回放会话、外部世界。同页用 `figures/agent-contract-evidence.svg` 把每件资产指到权威文件，文末表保留可搜索的同一映射。同页另写测试怎样推动这笔变更，并在「三种情况」里用白话分开改行为、修 bug、新守卫：前两种不必先看见红，新守卫必须亲眼看红再撤；未覆盖行经常是待删除代码，变异测试仍是 proposed。推动顺序由图 `figures/test-drives-the-change.svg` 拥有示意，三种红灯由图 `figures/three-red-cases.svg` 拥有示意，三件资产仍由图 `figures/agent-contract-evidence.svg` 拥有。随后把阅读顺序改成先资产、后推动、再冒烟与完成判断，并删掉与三张图重复的第二份步骤清单；覆盖率变红不再算进三种情况。Reference 04 继续只拥有命令路由；原生开发模型第 5 步和 Development Harness 的可执行反馈页各加一条入口，不复制本页的条件。

本轮不新增 DSH Agent Note：页面归纳的是现行 testing policy、architecture、snapshots 规则和 agent-loop invariant，不改变 DSH 运行时或主仓持久决定。

## 2026-10-07 的 0013 轮：独立发行与一致性修复

本轮依据系统性复核修复三卷，不引入 OpenSpec、跨 feature 排期或第二套主仓制度。根入口说明读者、复制范围、Node 前提、阅读顺序及校验能力；三个卷入口各自解释必需概念，另外两卷仅供可选深入阅读。正文区分运行时事实、DSH 主仓要求、独立插件仓建议与仓库自定治理，删除对迁出 Tutorial 的当前依赖。

修正范围：合法 provider 等待可以持续 `PENDING`，已可判定错误仍须尽早失败；sandbox 只约束 filesystem effects，approval 由调用方显式请求并在未获一次许可时 fail closed；主仓非平凡模型、协议或用户可见变化必须同 PR 新增或更新 recorded-session，真实组合和普通示例不能自动替代；bundle 链限定自动启用配置层；owner 按事实/行为/人的语境使用。图示同步修正文义、五卡重叠、Loader 悬空连线和 provider 证据归类；总览页删除重复 owner 图。

引用不再放宽宿主门禁：现行外链转为 release tag `dsh-v0.2.0-rc.2`，历史样本保留 release tag、PR 或准确日期/标题。区分真正 release tag 与旧本地同步树。286 处现行引用、109 个不同目标路径均存在，Markdown 标题锚点已核对；唯一来源内容差异为配对清单的本地研究排除项，不影响正文对配对机制的说明。Web seam 的历史样本单独注明获取历史对象的条件，不能用不可取得的历史冒充已复核的现行来源。

实际验证：

- `node verify.mjs` 通过：34 Markdown、2 scripts、23 SVG；两脚本的 `node --check` 通过，`git diff --check` 通过。
- `node verify.test.mjs` 通过：完整语料副本从目录外执行成功；8 个 invalid case 经真实 verifier 拒绝（4 种错误 ref、跨卷 SVG、越界链接、缺失锚点、缺失结尾换行）。测试只用 Node 内置模块，不依赖宿主仓库。
- 23 张 SVG 全部通过 XML、viewBox/尺寸及 `rsvg-convert` 渲染；修正图另外检查卡片间距、连接坐标与保守文字宽度。未进行视觉验收，不能用成功渲染宣称布局已由看图确认。
- `pnpm run test:docs`：19 passed / 2 failed；`pnpm run doc-sync`：41 passed / 2 failed。Markdown links/wrap、translation pairing、文档构建与 doc-typecheck 通过。两失败均为 `verify-repository-references`、`verify-concrete-terms`，实际失败项位于目录外的其它研究语料；本语料引用冲突已消除，没有修改全库门禁或无关研究目录。全库文档检查仍未绿色，不得将目录级通过替代该结论。

本轮不新增 DSH Agent Note：修复教学解释和语料自己的验证，不改变 DSH 运行时或主仓持久决定。历史维护条目保留各轮事实；0012 中 owner 图删除和待验证状态的误记已在其条目注明本轮实际结果。

## 2026-10-01 的 0012 轮：原生开发模型图解与术语入口

基线不变，继续面向新建独立 DSH 插件仓补强入口页。

1. **图解入口**：`native-development-model/` 新增开发闭环、owner/证据、证据路由、新仓起步、插件生命周期、Plugin → Bundle → Profile 分层和交付判断角色七张 SVG；图示只表达关系与流程，具体条件仍由正文和固定版本的一手来源拥有。每张图均由本卷 `figures/README.md` 登记，`verify.mjs` 将图归属限制在本卷 figures 目录。
2. **术语入口**：新增 `02-terms-and-mental-models.md`，按运行时、组合分发、变更组织、验证判断四组解释 Plugin、Context、Loader、inject、effect/disposer、HMR、owner、Agent Note、Plan、goal、bundle、profile、oracle、real composition、snapshot、CI、semantic review 等词，说明常见误解并链接固定版本 DSH 一手来源。
3. **入口导航**：native model README、总览页和新仓起步页均明确链接术语页；根 README 与维护说明改正“原生开发模型当前不使用图示”的旧描述。总览页新增 Plugin/bundle/profile 与 acceptance-roles 图；当时仍重复使用 owner 图，实际删除在 0013 轮完成。
4. **验证**：当时目录 verifier 通过。该条目未收录随后执行的 Markdown links/wrap、翻译配对与 `git diff --check` 结果；本次以 0013 轮的实际结果作为当前证据，不将旧记录中的待检查项写成绿色验收。本轮不新增 Agent Note：内容是现有 DSH 机制的教学归纳，不是新的 DSH 持久决定。

## 2026-09-30 的 0011 轮：语料更名与 sdlc-tutorial 迁出

基线不变，仅动目录结构与引用，不改任何对 DSH 一手来源的事实断言。

1. **语料更名**：`_agent_ready_development/` → `_dsh_plugin_agent_ready_development/`。旧名描述对象模糊（“agent ready”未说明面向哪类仓库），新名写清定位：面向新建独立 DSH 插件仓的 agent-ready 语料。根 `README.md`、引用扫描脚本的 `CORPORA`、`scripts/translation-pairing.manifest.json` 与全部跨语料引用同步；其余语料目录下的旧路径引用已清扫（本目录的 `verify.mjs` 禁止正文点名兄弟语料目录，故本节不写其目录名；改名后的跨语料引用见各自仓库）。
2. **`sdlc-tutorial/` 迁出**：该卷的 01–05 与图示迁入 FAQ 语料的 `17_dsh-native-development-process/`（与本轮同时新增），以贯穿案例（PR #5004 的交付提交）与三条立场为正文主线，不再作为本语料的第四卷；本语料保留 `native-development-model/`、`sdlc-reference/`、`repo-harness/` 三卷。`verify.mjs` 的 `owningFiguresDirectory` 删去 `sdlc-tutorial` 分支（该目录已不存在）。
3. **引用修正**：FAQ 07 的 `research.md` 两处 tutorial 出处改指 FAQ 17（02 页与 answer.md），评估语料 README 的“教程与立场”与来源表同步改指 FAQ 17。本页与各卷正文中记录历史轮次的 `sdlc-tutorial/NN` 字样保留原样——它们描述当时状态，不改写成现在时。

## 2026-09-30 的 0010 轮（变更账本＋无引文钉专项）

同基线换角轮（目标 `goal-9417a210`；方法与全语料修复清单记于同轮的另一份语料账本，此处只留本语料结论）。本语料修复：`sdlc-reference/11` 的 release 间隔回归 **19–41 分钟**（重测 23m48s/40m34s/19m27s，0009 轮的「24–41」与「19 来自 release-commit 端点」归因均不可复现）与本页 `:120` 同步。核对后未改动：PR CI job 结构（`ci.yml` 定义 11 个 job＝needs 9＋不进聚合的 windows-coverage＋聚合 all-checks-passed，与 `sdlc-tutorial/03:65-67`、`sdlc-reference/04:53-62` 逐字对账）；run-gates 18 mode 与 `run-gates.ts:19-37` 行钉；skills 15 目录/13 dsh- 前缀/9 个以 Use 开头（agent-experience 为 symlink）；plugin-manager 簇（OPTIONAL_BUNDLES 四包 `profile.ts:213-218`、Web 页一键开关、plugin-manager 行 Config 8 字段）；`repo-harness/03` 等无引文钉抽查全中。落点决策：0009 跨度新增的 `verify-upgrade-guides.ts`、`lane-test-budget.spec.ts`、`persistence-schema-snapshot.spec.ts` 三个文件按问题驱动口径均不追（语料零断言依赖；verify-upgrade-guides 已由 `repo-harness/03:33` 的 skill 落点覆盖，可选在 `sdlc-reference/11` 补一句指路，非义务）。方法论发现：无引文的行号区间钉（`path:N-M`）是 ref-sweep 盲区，本轮约 60 处漂移全靠人工实证重锚，后续每轮须保持承重钉抽样实证。
