# `_coverage` — 源码消化核验矩阵

本页记录 `_digested` 明确回答了哪些问题、结论住在哪篇机制参考、最后对哪个产品源码 commit 复核。它不按篇数估算“完成度”，也不承诺覆盖未列出的包或行为；完整包组清单由 [`packages/README.md`](../../packages/README.md) 维护。

产品源码基线：`639ed015397290b3745d163aafe02ffee4aa3f84`（`dsh-v0.2.0-rc.2`）。受影响行的判定见 [`../_change_log/0009-0.1.7-rc.1-to-0.2.0-rc.2.md`](../_change_log/0009-0.1.7-rc.1-to-0.2.0-rc.2.md)。

「最近核验」列写的是该专题最后对到的产品 commit，可能**小于等于**产品源码基线：上游同步并未触及某个专题时，其核验值沿用上一轮，不会被基线更新。这不是口径不一致，只说明该专题的入口在本次同步中无 diff。0005 复核后当时的九行曾全部对齐 `a66e470204`；0006 跨度（1512 个提交，含 session 格式升到 v3、客户端资源面、subprocess containment、约 700 篇 Note 归档）触及全部专题，故全部重新标为「需复核」，逐专题审计后写回新值。矩阵补上了两个此前从未登记的行：0006 的 `runtime-profiles/`，以及 0007 复核时发现的 `harness-idea/`——它从 0004 起就是 `00-index.md` 列出的专题，却一直没进本矩阵，因此 0007 前本页只声明十行而实际有十一个专题。0008 跨度（3304 个提交：session 格式升 v4 并新增 persistence-changes 声明树、sandbox 组转正、ssh/browser-use/computer-use/deliverables/document/ptc-runtime/mcp-resources 等新面、tool-cordis 缩减为两工具、preset 声明式重设计、E2B/code-runtime/agent-presets 等 332 个旧路径退役）同样触及全部十一行，复核后全部写回 `46a7f68b09`。0009 跨度（794 个提交：Schedule 转正为 schedule-bundle、账号/模型面与遥测大改、user-questions timed waits、llm 动态工具更新、desktop/web/client 大批 UI 修复；vendor 零 diff，session 格式保持 v4）再次触及全部十一行，同步执行时全部标为「需复核」，逐专题审计后写回新值。

## 状态

| 状态 | 含义 |
|------|------|
| 已核验 | 结论页已按“最近核验”所列产品 commit 对照源码 |
| 需复核 | 上游同步触及来源，结论尚未重新核验 |
| 未覆盖 | 问题已登记，但还没有机制参考 |

## 核验矩阵

| 专题 | 已核验问题 | 结论页 | 状态 | 最近核验 |
|------|------------|--------|------|----------|
| `system/` | 扩展表中非显然的落点；从单体 loop 迁移时各职责归属；门禁聚合器与性能基准树 | [`01`](../system/01-扩展表非显然落点.md) · [`02`](../system/02-对照单一loop.md) · [`03`](../system/03-门禁与性能基准.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `cordis-runtime/` | 五条原语；waterfall 派发；Loader/Include 与 `!!js`；产品依赖的 vendor 修改 | [`01`](../cordis-runtime/01-五条原语对照源码.md) · [`02`](../cordis-runtime/02-waterfall-与事件合同.md) · [`03`](../cordis-runtime/03-loader-include-与js插值.md) · [`04`](../cordis-runtime/04-vendor-本地修改.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `composition/` | profile boot 时序；dump 与 boot 的共同算法和层差；用户 patch HMR 事务；profile 创建路径与保留名 | [`01`](../composition/01-boot-时序.md) · [`02`](../composition/02-dump-与boot-保真.md) · [`03`](../composition/03-user-patch-hmr.md) · [`04`](../composition/04-profile-创建与保留名.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `runtime-profiles/` | 五个 Launcher Profile 的共同基底与差异；桌面这一应用自有组合 | [`00`](../runtime-profiles/00-map.md) · [`01`](../runtime-profiles/01-web.md) · [`02`](../runtime-profiles/02-headless.md) · [`03`](../runtime-profiles/03-sdk.md) · [`04`](../runtime-profiles/04-sdk-minimal.md) · [`05`](../runtime-profiles/05-acp.md) · [`06`](../runtime-profiles/06-desktop.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `session-and-loop/` | session 世代与迁移机制；inbox/turn/step 时序；替换默认 loop 的运行时义务 | [`01`](../session-and-loop/01-session-event-map.md) · [`02`](../session-and-loop/02-inbox-与turn-时序.md) · [`03`](../session-and-loop/03-换loop的半径.md) · [`04`](../session-and-loop/04-格式世代与迁移.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `capability-seams/` | 三种角色与分包装；E2B provider 组合（0008 起 E2B 组退役，接替面为 sandbox 组与 ssh 组——ssh 族见 09）；bash 的本地 confinement 调用链与原生 containment；subagent 后台、目录与宿主交付；外发代理这类「刻意不是 seam」的进程级策略；外部生态桥（MCP 客户端与 hook 桥，两者都 opt-in）与新执行面/编排 seam 地图 | [`01`](../capability-seams/01-三角色与分包装.md) · [`02`](../capability-seams/02-一次bash从tool到sandbox.md) · [`03`](../capability-seams/03-subagent后台与产品provider.md) · [`04`](../capability-seams/04-新增seam与Remote.md) · [`05`](../capability-seams/05-subagent-catalog与host交付.md) · [`06`](../capability-seams/06-外发代理策略.md) · [`07`](../capability-seams/07-原生containment与native-system.md) · [`08`](../capability-seams/08-外部生态桥：MCP与hooks.md) · [`09`](../capability-seams/09-ssh远程执行族.md) · [`10`](../capability-seams/10-新执行面与编排seam.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `plugin-inventory/` | 现成插件货架：按组的包清单与可见性图例；ctx 服务/工具/bundle/preset/skills 五张横切清单；复用四条出路（调配置/换 Provider/挂包/胶水插件）与零 Provider 缺口清单；九形态×四 role 的分类法与设计思考（四张 SVG：taxonomy/spectrum/reuse-paths/funnel）。快照式清单，随每次同步重测计数 | [`00`](../plugin-inventory/00-map.md) · [`01`](../plugin-inventory/01-插件货架.md) · [`02`](../plugin-inventory/02-五张清单.md) · [`03`](../plugin-inventory/03-复用路径与缺口.md) · [`04`](../plugin-inventory/04-插件分类与设计思考.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `tools-prompt-llm/` | prompt section 顺序与稳定前缀；system prompt 作为 surface 节点；in-history 替换能力；工具审批/timeout；chunk 到 settlement 的日志关系；内容块投影 | [`01`](../tools-prompt-llm/01-section顺序与前缀.md) · [`02`](../tools-prompt-llm/02-管道审批timeout与chunk.md) · [`03`](../tools-prompt-llm/03-system-prompt作为surface节点.md) · [`04`](../tools-prompt-llm/04-in-history提示词替换.md) · [`05`](../tools-prompt-llm/05-chunk到settlement.md) · [`06`](../tools-prompt-llm/06-文件块与内容块投影.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `surfaces/` | 源码与 built 启动面；host session 流；ACP 与 JSON-RPC 的不同投影保证；桌面这一第五入口；客户端资源模型与右栏；客户端分层与插件纪律；Typert 类型图到 Remote stub 的生成链 | [`01`](../surfaces/01-启动面与session流.md) · [`02`](../surfaces/02-acp与jsonrpc.md) · [`03`](../surfaces/03-桌面入口.md) · [`04`](../surfaces/04-客户端资源模型与右栏.md) · [`05`](../surfaces/05-客户端架构与插件纪律.md) · [`06`](../surfaces/06-Typert类型图与Remote生成.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `agent-loop/` | step/turn/activity/goal 四层结束边界；goal 创建的三条路径与状态机（含模型通道的 `paused` 禁令）；Goal Round Driver 的自动续轮、竞态栅栏与重启后 re-arm；Agent 运行时身份与 initiator 权限判据 | [`00`](../agent-loop/00-map.md) · [`01`](../agent-loop/01-goal-lifecycle.md) · [`02`](../agent-loop/02-goal-round-driver.md) · [`03`](../agent-loop/03-activity-vs-goal-boundaries.md) · [`04`](../agent-loop/04-agent-runtime-identity.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `experimental/` | python 子进程后端；Agent Teams 服务/工具/双 profile（含 public 例外边界）；Inspector CDP 调试面 | [`00`](../experimental/00-map.md) · [`01`](../experimental/01-code-runtime-python.md) · [`02`](../experimental/02-agent-teams.md) · [`03`](../experimental/03-inspector.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |
| `harness-idea/` | dsh 作为 harness 的职责与基底（插件图 + 事件流回答哪五个运行时问题）；可读性的两个来源；正确路径为何是阻力最小路径；参与阶梯的四层路由；动态可读性（可回答 + 可试验）；技术选型与语言贴合；原则与适用条件的边界及成本；本专题自身的判断纪律 | [`00`](../harness-idea/00-map.md) · [`01`](../harness-idea/01-role-and-substrate.md) · [`02`](../harness-idea/02-legibility.md) · [`03`](../harness-idea/03-paved-road.md) · [`04`](../harness-idea/04-participation-paths.md) · [`05`](../harness-idea/05-dynamic-legibility.md) · [`06`](../harness-idea/06-tech-and-language-fit.md) · [`07`](../harness-idea/07-boundaries-costs-fit.md) · [`08`](../harness-idea/08-judgement-discipline.md) | 已核验 | `639ed015397290b3745d163aafe02ffee4aa3f84` |

上游同步先按变更路径定位受影响行，将其改为“需复核”；复核结论、源码入口和图后，再写入新的产品 commit。未受影响的行保留原最近核验值。0006 与 0008 两轮均已完成全部十一行的重写入；0009 独立反查新增第十二行 `plugin-inventory/`（现成插件货架专题），本矩阵当前十二行、没有“需复核”行。

## 覆盖方式与已知未覆盖

上面的矩阵回答的是「本语料声称回答了哪些问题」，不是「包级覆盖率」。这两种口径必须分开看：**本语料是问题驱动的，不承诺覆盖每一个包或每一种行为**，所以「某包没被提到」本身不是缺陷。为了让边界可查，这里登记两件事。

### 覆盖是怎么核出来的

反向核验（引用对不对）与正向覆盖（有没有漏）是两件事，本语料两件都做：

1. **反向**：全部 `path:line` 引用解析成仓库相对路径后逐条打开源码核对；合并校验器覆盖三语料 266 个 Markdown/SVG、1486 条 HEAD 行引用 + 6 条历史引用，并逐字核对了带引文主体的 `> ——` 引用块（校验器识别出 12 组；三语料里 `^> ——` 行共 54 条，其余是紧随正文的单行出处标注）。
2. **正向**（0007 复核时补做）：把项目树摊开与语料求差，逐项判定。判定结果按「该机制是不是本语料会覆盖的那类机制」分三类：**已补齐**（见下表）、**登记为已知未覆盖**、**确认覆盖良好**。
   - 生成目录差分：跨 0006 跨度新增的 18 个包与 5 篇 docs **全部**在语料中有落点，只有 3 个纯 UI 包（`client/ui-open-in-app`、`client/ui-sidebar-files`、`host/open-in-app`）未点名，而其机制由 `surfaces/03-桌面入口` 与 `surfaces/04-客户端资源模型与右栏` 承载（0008 独立复核时同名 03 旧页 `03-客户端资源与侧栏.md` 已删）。
   - 扩展面差分：跨 0006 跨度新增 3 个 `ctx` 服务（`fileUploads`/`sessionFeedback`/`workspaceFiles`）、新增工具 `present`、退役工具 `followup_task`、新增事件 `agent/assistant-stream`/`feedback/committed`/`goal/activation-changed`——逐条在语料中找到落点或已补齐。
   - 零命中的工具与服务名**全部**在跨度之前就存在（即属于既有范围选择），不是本轮同步漏掉的。
   - 文件级回归：两语料相对同步前**没有任何文件被删除**（`_digested` 108 → 126、`_faq_on_digested` 92 → 93）。

### 0007 复核补齐的覆盖

| 补齐项 | 落点 |
|--------|------|
| Web Client 三层架构、slot/props 四份共享、客户端模块身份、导出与依赖声明纪律、域图门禁、样式与文案所有权、测试阶梯、新增包三处注册面 | [`surfaces/05-客户端架构与插件纪律.md`](../surfaces/05-客户端架构与插件纪律.md) |
| Typert 类型图 → Remote 生成（声明期 / build 期 / 运行期） | [`surfaces/06-Typert类型图与Remote生成.md`](../surfaces/06-Typert类型图与Remote生成.md) |
| MCP 客户端桥；Claude Code / Codex hook 桥与 `hook-protocol` 线协议 | [`capability-seams/08-外部生态桥：MCP与hooks.md`](../capability-seams/08-外部生态桥：MCP与hooks.md) |
| `feedback/committed` 进程内事件 | [`capability-seams/04`](../capability-seams/04-新增seam与Remote.md) 的 messageFeedback 段 |
| typert 类型图（此前仅有旁述） | 见上表第 2 行 |

### 登记为已知未覆盖（本语料不追，需要时另开专题）

这些是**真实存在且有 owner 的机制**，本语料目前不覆盖，登记在此以免被读成遗漏。每项都给了权威入口。

| 未覆盖项 | 权威入口 | 为什么不在本语料 |
|----------|----------|------------------|
| CI 平台矩阵与 PR 阻断信号（PR-only `ci.yml` vs master-only `ci-master.yml`、Windows/Wine 分工、failover 开关） | `.github/AGENTS.md`、`.github/workflows/ci.yml`、`ci-master.yml` | 属仓库流程面，不是运行时机制 |
| 门禁系统自身的 mode 分类与阻断语义（`scripts/run-gates.ts` 的 18 个 mode，0009 新增 `ci-unit`、`allowFailure`/`quick`） | `scripts/run-gates.ts`、`scripts/AGENTS.md`；机制级概述已由 `system/03-门禁与性能基准.md` 承载（0008 独立复核后补挂） | mode 逐个语义仍不展开；语料只给聚合与家族图 |
| 录制会话快照的所有权与规范化规则 | `snapshots/AGENTS.md` | 义务散见于 `harness-idea/03`、`04`，未成页 |
| Python 发行物（SDK / runtime 拆分、单文件可执行、wheel、smoke 与 CI） | `python/README.md`、`python/development.md` | 只有区域级一行描述 |
| PR 历史的当前契约（官方 stack 对象、`gh stack merge`、lease 重写） | `AGENTS.md` 的「Choose PR history deliberately」、`dsh-merging-stacked-prs` skill | `_faq_on_digested/11` 记的是历史观察，非当前契约 |
| GitHub 标签法与加权审批 | `AGENTS.md` 的 Labels 行、`docs`/`.github/issue-management/policy.mjs`、`.github/review-ownership/` | 同上 |
| 根级政策文档 `SAFETY.md` / `BRAND_GUIDELINES.md` | 仓库根 | 非机制 |
| `docs/rescope.md` 的 vendored 包命名映射权威 | `docs/rescope.md`、`vendor/README.md` | 概念已覆盖（`cordis-runtime/00-map.md`），文件名未引 |
| `docs/graph-atlas.md` 作为生成目录之一 | `docs/graph-atlas.md` | 生成目录枚举里漏列 |
| `docs/ui-radius.md`（0009 新增顶层页）与 `docs/deepseek-llm-api-wire-extensions.md` 的逐条细则 | 两页本体；权威入口已挂 `surfaces/05`、`tools-prompt-llm/00-map.md` | 语料只引权威入口，不逐条展开视觉 token 与线协议字段（0009 独立反查登记） |
| 未挂载 shipped 组合的工具族与零落点事件键：`tool-session-query` 5 工具、`tool-terminal` 6 工具、`list_subagent_models`、`lsp` 工具名；事件键 `session/title(-llm-request)`、`web/deepseek-search-llm-request`、`llm/retry(-started)` | `packages/session-query/tool-session-query/src/index.ts:65-108`、`packages/terminal/tool-terminal/src/index.ts:163-390`、`packages/subagent/tool-subagent/src/list-models.ts:87`、`packages/lsp/tool-lsp/src/index.ts:109`、`packages/core/session/src/known-event-types.ts:22-82` | 整族零落点但机制近邻有承载（`capability-seams/10`、`runtime-profiles/01:32`）；事件名零落点、机制旁及（0009 独立反查登记） |
| 配置字段级落点：`compaction-basic` 的 `thresholdRatio`、`deepseek-account-platform` 的 `platformOrigin` | `docs/config-catalog.md` | 机制页有落点（`tools-prompt-llm/03`、`capability-seams/10:25`），字段名不逐一收录（0009 独立反查登记） |
| 既有面（0009 前即无落点，属既有范围选择）：`ctx.shellEnv` 的 DSH_* 注册表、`ctx.sessionSkillCatalog`（Host 侧 skills namespace 适配器）、`identity/anonymous-user-id`、`compaction/command-compact` | `packages/shell/shell-env/`、`packages/api/session-controller/src/skill-catalog.ts:24`、`packages/identity/anonymous-user-id/`、`packages/compaction/command-compact/` | 机制近邻有承载（`capability-seams/02` bash 链、`runtime-profiles/01:50` ui-skill、遥测事实行、`tools-prompt-llm/03:41` 压缩机制）；0009 独立反查登记 |
| `native/` 的 Windows job 名与 source-of-record 表述 | `native/README.md`、`.github/workflows/node-addon-system.yml` | 区域级已覆盖，未到 job 级 |
| `client/hmr`、`client/locale`、`client/store` 等平台包的内部机制 | 各自 package README | 属客户端基础设施，`surfaces/05` 覆盖其对外纪律 |
| ssh 各 provider 的逐行传输合同（master channel、TLS-PSK、心跳租约的深读） | `packages/ssh/`、`capability-seams/09-ssh远程执行族.md`（本语料已有族级页） | 0008 独立复核补的是族级机制页；逐条 wire 细节待有需要再扩 |
| browser-use / computer-use driver 的内部契约（stagehand-native / MCP 挂载细节） | `packages/browser-use/`、`packages/computer-use/`、`capability-seams/10-新执行面与编排seam.md`（地图页） | 同上——地图先行，深读待该面有真实使用压力 |
