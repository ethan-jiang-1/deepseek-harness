# Research · 借鉴 DSH Harness 思路：证据原文与来源

## 说明

本 FAQ 的证据主体是两份本地研究语料，现已随 `_digested/` 同步到基线 DSH `dsh-v0.1.5-rc.1`（commit `183f08e9c6dde7e36cd2318eaee70b0da08fb35e`，见 [`_digested/00-index.md`](../../_digested/00-index.md) 与 `_digested/_change_log/0006-0.1.2-rc.1-to-0.1.5-rc.1.md`）。下面是本 FAQ 用到的一手原文，标注它在 DSH 仓库的位置；条目 1–12 随语料核对，13–21 为补写 09/10 两章时直接从 DSH 仓库核对的一手原文；第 8、10、13、14、19、20 条已在 0.1.5 基线上按新工作树重核并改写。上游再次合入后，按 `_digested/_change_log/` 复核本节名与原文，不要把「当前 checkout」当成新基线。

## 1. 仓库以 coding agent 为主、机械门禁优于 prose 约定

> This codebase is developed primarily by coding agents. Agents follow enforced gates far more reliably than prose conventions.

来源：`.agents/notes/implemented/process/2026-06-11-quality-gates.md`（语料 `development-harness/00-index.md` 引用）

## 2. 一个事实一个家

> Each fact has one home: the tier whose job it is; elsewhere, link there.

来源：`docs/AGENTS.md`（tier taxonomy 一节）

## 3. 每一条可机械判断的规则落到一个非零退出码的命令

> Every mechanically checkable AGENTS.md promise gets a command that exits non-zero. CI invokes the exhaustive set, while Git hooks reserve their latency budget for cheap local defects.

来源：`.agents/notes/implemented/process/2026-06-11-quality-gates.md`（语料 `development-harness/05-executable-feedback.md` 引用）

## 4. 扩展点优先，改 loop 是例外

> New behavior attaches to a documented extension point. Changing the loop itself updates this map.

来源：`docs/architecture.md`（Where new behavior goes 表）

## 5. 没有特权核心可 patch，注册即效果

> There is no privileged core to patch: you extend dsh by mounting a plugin beside the others, and registrations are effects that unwind when their plugin unloads.

来源：`docs/architecture.md`（语料 `development-harness/04-paved-road-and-participation.md` 引用）

## 6. Skill 是 guidance，不是 checklist

> This skill is guidance, not a complete checklist. […] The report identifies paths and dirty layers but does not replace semantic review.

来源：`.agents/skills/dsh-code-review/SKILL.md`（语料 `development-harness/03-skills-as-procedural-memory.md` 引用）

## 7. 摘要负责发现，正文才拥有指令

> This catalog contains summaries only; do not infer or follow a skill's instructions until it has been loaded.

来源：`packages/skill/tool-skill/README.md`（语料 `development-harness/03-skills-as-procedural-memory.md` 引用）

## 8. 负例控制：门禁必须先被证明会失败

> A guard only guards if the regression fails it. … and prove it: introduce the regression, watch red, revert.

来源：`docs/testing.md`（test the real entry path 一节；语料 `development-harness/05-executable-feedback.md` 引用）

## 9. 运行时查询是 opt-in 开发工具，非安全边界

> This is an opt-in development tool with bash-equivalent trust, not a security boundary or product default.

来源：`.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md`（语料 `development-harness/07-boundaries-and-costs.md` 引用）

## 10. 最终配置树的查询入口

> To see the tree your machine boots: `dsh --profile web --dump-config`

来源：`docs/architecture.md`（profiles and bundles 一节；语料 `development-harness/06-runtime-inspection.md` 引用）

## 11. 文档只写 current state，不写 change history

> **Document current state, not change history.**

来源：`docs/AGENTS.md`（语料 `_faq_on_digested/06_spec-change-path` 也引用过此条）

## 12. 较小项目不该照搬完整包结构

> 较小项目若只有一个 loop、少量固定 adapter 和单一入口，可能只需要清晰 architecture map、少数 standing rules、任务 Skills 和针对性 tests。学习 DSH 的第一步应是知识归属与反馈纪律，而不是复制全部包结构。

来源：`_agent_ready_development/development-harness/07-boundaries-and-costs.md`（语料自身的判断，非 DSH 原文）

## 13. CLAUDE.md 是 symlink，编辑真实文件

> `CLAUDE.md` symlinks `AGENTS.md` at root and `packages/`; edit the real file.

来源：根 `AGENTS.md`（Editing these instructions 一节）

仓库实际有 4 处 `CLAUDE.md` symlink（root、`packages/`、`vendor/`、`.agents/notes/implemented/`），均指向同目录的 `AGENTS.md`；`examples/` 已在上游删除，不再是受跟踪目录。

## 14. tier taxonomy：root / subtree AGENTS.md 与 package README 的分工

> Root `AGENTS.md` — Standing orders: rules an agent needs in context in every session, one to three lines each, linking its home.

> Subtree `AGENTS.md` (`packages/`, `docs/`, `.agents/notes/`) — Orders specific to that subtree. Does NOT belong there: repo-wide rules the root file already carries.

> Package README — The per-package contract: config, semantics, limitations, extension points, and Model Experience.

> Skills (`.agents/skills/`) — Reusable workflows and specialized decision standards.

来源：`docs/AGENTS.md`（The tier taxonomy 表）

字数预算：root `AGENTS.md` ≤ 1,950 词；subtree `AGENTS.md` ≤ 600 词（`packages/AGENTS.md` ≤ 750、`docs/AGENTS.md` ≤ 1,320）；`packages/README.md` ≤ 994 词，由 `verify-doc-budgets` 检查（机器权威清单见 `scripts/doc-budgets.manifest.json`）。来源：`docs/AGENTS.md`（Wordcount Budgets 一节）

## 15. 根 AGENTS.md 的 Repository layout 用 link 串起 README

根 `AGENTS.md` 的布局与约定段落以 `packages/README.md`、`python/README.md`、`native/README.md`、`vendor/README.md`、`docs/architecture.md`、`docs/AGENTS.md`、`packages/AGENTS.md` 等相对链接把事实引到各自 home，不复制正文。来源：根 `AGENTS.md`（Repository layout / Conventions 各节）

## 16. system prompt：PromptContext 是 cache-safe，变化/compaction 才 log

> `PromptContext` is the cache-safe counterpart to `PromptSection`. The assembly resolves and orders these contributions, while agent-loop logs their complete current snapshot after retained model history only when it changed or compaction removed it.

来源：`docs/subsystems/system-prompt.md`（Dynamic prompt context 一节）

tool schema 的可见集由每次 assembly 决定：`ToolProviderResult.schemas` 是本次 assembly 的 model-visible set。来源：`docs/subsystems/system-prompt.md`（Tool-provider result 一节）

## 17. skill catalog 只给摘要，正文 on-demand

> The catalog contains sorted skill `name` and normalized, XML-escaped `description` only; it omits bodies, paths, sources, providers, and routing hints. … It exposes sorted invocation-neutral summaries and loads full skill bodies on demand.

来源：`docs/subsystems/skills.md`（`dsh-tool-skill` 注入段与 registry 段）

## 18. tool 可见集按 scope 收缩

> ToolSearch / progressive disclosure — replace a scoped `ctx.tools.restrict()` registration as the visible set changes; the registry keeps presentation, lookup, and execution aligned.

来源：`docs/cookbook/extension-cookbook.md`（扩展点表）

## 19. agent-instructions：有界加载、去重、touch-driven

> Rendering keeps the most specific files first: it drops whole broader files before truncating the most-specific file, and emits a visible `Workspace instruction budget ...` notice naming the omitted and truncated paths. The rendered bytes never exceed `maxBytes`.

> Instruction content is bounded, not summarized — over-budget broad files are omitted and the most-specific file may be truncated; the plugin never asks a model to compress instruction prose.

来源：`packages/context/agent-instructions/README.md`（Observing the budget / Known Limitations and Deferred Work 一节）

## 20. compaction：压力/溢出触发，保留 tool-call/result 配对

> Pressure compaction runs at the `agent/pre-step` waterfall before request derivation. Once pressure or canonical overflow qualifies, compaction-basic invokes optional `ctx.toolResultPruner` before range selection, remeasures through `ctx.tokenMeter`, and can advance the surface without a summary. … Region boundaries preserve tool-call/result pairing but not whole turns.

来源：`docs/subsystems/compaction.md`（The service 一节）

## 21. subagent spawn 不带父历史，fork 只带 seed

> The shared driver sends the task verbatim as the child's user message … Spawn supplies no history; fork supplies its balanced seed.

来源：`packages/subagent/subagent-in-process-driver/README.md`（Model Experience / Child-agent request 一节）

## 已核对的相关消化材料

- `_agent_ready_development/development-harness/00-index.md`：五类信息缺口与五类 owner 总表（本 FAQ 正文扩为六缺口，见 01）
- `_agent_ready_development/development-harness/01-follow-a-fresh-agent.md`：fresh agent 六问闭环
- `_agent_ready_development/development-harness/02-legibility-and-ownership.md`：可读性与知识归属
- `_agent_ready_development/development-harness/03-skills-as-procedural-memory.md`：Skills 的定位与边界
- `_agent_ready_development/development-harness/04-paved-road-and-participation.md`：参与阶梯与归属路由
- `_agent_ready_development/development-harness/05-executable-feedback.md`：六层反馈与负例控制
- `_agent_ready_development/development-harness/06-runtime-inspection.md`：运行时查询
- `_agent_ready_development/development-harness/07-boundaries-and-costs.md`：优先级清单与三问框架
- `_digested/harness-idea/00-map.md`：harness 思想入口与核心论点
- `_digested/harness-idea/02-legibility.md`：静态可读性
- `_digested/harness-idea/03-paved-road.md`：正确路径
- `_digested/harness-idea/04-participation-paths.md`：参与阶梯
- `_digested/harness-idea/05-dynamic-legibility.md`：动态可读性
- `_digested/harness-idea/07-boundaries-costs-fit.md`：边界与成本
- `_digested/harness-idea/08-judgement-discipline.md`：判断纪律与出处分级
