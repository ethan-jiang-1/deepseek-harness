# 0010 变更账本与钉位专项反查：四个语料目录 vs 产品源码

反查日期：2026-09-30。产品基线：`639ed015397290b3745d163aafe02ffee4aa3f84`（`dsh-v0.2.0-rc.2`，与 0009 相同——本轮是**同基线换角轮**，不是新同步轮）。整树照搬持续成立：`git diff 639ed015 HEAD` 排除四个语料目录后仅 `scripts/translation-pairing.manifest.json` 一行排除项（三条审计线独立复核）。

本轮起立为目标 `goal-9417a210` 的常设对齐轮：每轮刻意更换审计角度、机械取证、三态分诊、过全部验证门禁、scoped 提交并留痕。本轮切角 = **变更三账本＋merge 主题正查＋无引文行号钉专项**：对 0.1.7-rc.1→0.2.0-rc.2 的 794 提交全量建新增/变更/退役三账本（包、docs、skills、门禁、apps、改名、命令、workflow 八类），263 个 merge 按分支主题聚类后逐簇核对语料落点；同时把 0009 轮遗留的「不带引文的行号区间钉」作为专项人工核对。核对执行为四个只读子代理分区并行（schedule/account/llm 簇、session/loop 簇、desktop/surfaces 簇、ARD/CI/plugin-manager 簇），全部行号 sed 实证后落笔。

## 方法论发现（本轮最重要产出）

1. **无引文的行号区间钉（`path:N` / `path:N-M`）是 ref-sweep 的盲区**：`--quotes` 只核对显式引文与越界，钉在文件行数以内但指错位置的钉全部漏网。本轮实证约 60 处此类漂移（composition-boot/00-map 的钉甚至是 0.1.5-rc.1 旧值、与其自称基线都不符；agent.ts 在 0009 跨度内 +55 行导致 agent-loop 一整簇漂移），全部人工重锚。后续轮次应把「承重钉抽样实证」固化为每轮必做动作。
2. **02 图鉴的 basename 复核命令有假阴性**：包名在他行出现即漏报——sdk/、acp/ 两组曾借此整组漏节（4 包零落点），本页复核命令已补警示（见 02 尾注）。
3. **ref-sweep 引文漂移候选三态分流后全部为误报或历史引用**：±1 行容差内的钉（verify-client-packages 三段）、引文归属错钉（tools-prompt-llm/06 的 content.ts:199 与 index.ts:1065 双钉实为各自正确）、引文出自归档 note 且页面自带过期声明（harness-idea/05）。

## 修复清单（按文件）

| 文件 | 修复 |
|---|---|
| `composition-boot/00-map.md` | 页头基线升 `0.2.0-rc.2`、增量指针 0007→0009；PROFILE_TEMPLATES `:158-174`→`:179-195`；tool-web `:450-454`→`:486-490`、disable 注释 `:425-435`→`:461-463`；代理放行 `:126/:168-169`→`:132/:165/:208-209` |
| `composition-boot/01-boot-时序.md` | proxy 调用 `:242-250`→`:249-252`、dispose `:254-256`→`:256-260`；appReady `:315`→`:317`；removeLinkProjections `:240-258`→`:275-283`；createRuntimeResolution `:406-439`→`:431-464`；BOOTSTRAP/白名单 `:130/:163/:207`→`:132/:165/:208-209` |
| `composition-boot/03-user-patch-hmr.md` | appReady 三连 `:266/:308/:315`→`:268/:310/:317`；desktop-host ready `:82`→`:104`；config-editor `:141`→`:153`；emit `:298`→`:300` |
| `composition-boot/04-profile-创建与保留名.md` | `--from-default-profile` `:168`→`:169`；initProfile `:141`→`:139`；prepareProfile `:166`→`:167`、composeProfile 路径 `:201`→`:203`；根 action `:182`→`:183`；plugin 子命令 `:194`→`:195`；positional 展开 `:201-206`→`:202-204` |
| `session-and-loop/`（00/01/02/03/04） | 00-map 基线升 rc.2＋指针 0009；JSONL 簇 6 钉、gen-catalog 5 钉、invariant、buildCell、runtime-types、inbox.spec 等全部重锚；新增 `user-question-reply` 与 timed waits 两个落点段（C1/C2，口径＝加生产者 kind 不加事件类型、不 bump v4） |
| `agent-loop/`（01/02/03/04） | goal 注册/解析/resume、agent.ts status/turn/step/kick 全簇、closers、四层关停表、initiator 三 API（含声明顺序改正 327/295/342）、continuation-activation 等 30+ 钉重锚 |
| `tools-prompt-llm/02、04` | agent.ts `413-415`→`:414` |
| `capability-seams/10-新执行面与编排seam.md` | account 段 8 钉：类 `:32-:117`、resolveToken `:99`、getPlatformSession `:111`、platform README `:20`、account-controller inject `:11`＋列表补 `agents`；tool-present `:47`；config-editor `:153`；mcp-client README `:209` |
| `surfaces-entrypoints/05-客户端架构与插件纪律.md` | :38 组合 API 句改述（register 与 registerFactory 两种声明形式）；AGENTS.md/verify-client-packages 约 15 钉重锚 |
| `surfaces-entrypoints/03-桌面入口.md` | 「64 KiB」→「64×1024 字符」（`MAX_FATAL_DIAGNOSTIC_CHARS` 是字符数）；README 钉两处 |
| `runtime-profiles/06-desktop.md` | 整页重锚（25 处）＋页头基线升 rc.2＋IPC 表补 `quit-inspection` 行＋「100 行」→122 行＋「64 KiB」→字符口径 |
| `runtime-profiles/01-web.md` | base hmr disable `:21-25`→`:27-32` |
| `system-overview/03-门禁与性能基准.md` | `verify-vendored-links`（d225dbba50 退役）移出 leaf 族；`verify-cordis-api` 改注独立 check 脚本（未注册进 run-gates） |
| `experimental/00-map.md` | auto-review 触发钉 `:657/:660`→`:691/:723` |
| `experimental/01-code-runtime-python.md` | headless 改「经 base 继承 worker 后端」（base:390-391，rc.1 起 headless patch 无此行）；devDeps 钉 `:116`→`:117`、并列说法「三个包」→「两个包相邻」 |
| `plugin-inventory/01-capability-tour.md` | 术语形态表补 bundle |
| `plugin-inventory/02-plugin-catalog.md` | **补 acp/（1 包）与 sdk/（3 包）两节**（dsh-acp、dsh-sdk-client、dsh-sdk-protocol、dsh-sdk-jsonrpc-server 此前零落点）；形态图例补 bundle/驱动；覆盖复核命令补 basename 假阴性警示 |
| `plugin-inventory/03-reference-lists.md` | ctx.subprocess P 1→2（subprocess-local＋ssh/subprocess-ssh），行移入 P=2 区块（同页 ctx.fs/ctx.sandbox 均计 ssh，唯此行漏计） |
| `sdlc-reference/11-release.md` ＋ `_coverage/00-corpus-maintenance.md:120` | release 间隔回归 **19–41 分钟**（0010 重测 23m48s/40m34s/19m27s），删除「19 来自 release-commit 端点」的不可复现归因 |

## 三态分诊（未改动项）

- **历史引用（不改）**：`_change_log/` 全部候选；FAQ 04 的根 README 裸钉（自带历史基线）；FAQ 01/03 的 0008 实测读数；`_coverage:105/:80` 的带日期运行快照；experimental/01 的旓名覆盖注记主体；harness-idea/02 的 rc.1 基线三数（`git ls-tree` 重算 2360/972/1279 逐项吻合）。
- **误报（不改）**：surfaces/03 引文与钉位双正确（端口 19387 未变）；directory-picker :10-30 恰为函数全体；FAQ 10 三页裸 `README.md:` 钉内容全对（已在本轮全路径化，扫的假越界随之消失）；FAQ feedback 行（PR #5310 改的是桌面 preload/device-info，不触 packages/feedback）；verify-client-packages 三钉 ±1 容差内。
- **缺落点决策（三个 0009 新门禁文件）**：`verify-upgrade-guides`（doc-sync/doc-quick/ci-static lane）、`lane-test-budget.spec`（unit/coverage lane）、`persistence-schema-snapshot.spec`（同）——语料零断言依赖，按「问题驱动」口径均**可不追**；可选增强：sdlc-reference/11 补一句升级指南结构门禁指路。

## 遗留待办（衔接下一轮）

1. **FAQ 区批次（并行会话避让中）**：`03_model-vendors/OPENROUTER_research.md:25` 与 `10_v4flash-user-notes/research.md:25` 的 `models.ts:8-24`→`:6-:21`；`03_model-vendors/DSH_systemPromptUpdate能力面.md` 补 0009 目录收缩注记（catalog 现两条、flash 增 `toolUpdate:'addition-only'`）＋6 钉重锚（types.ts:347→:396 等）；`03_model-vendors/answer.md:82/:92` 三钉；`17_finding-existing-plugins/answer.md:9` 的「54 个组」→55（02 补节后）＋形态清单补 bundle。
2. **可选补登记**：windows-update-restart 壳侧重启流程、webview-persistence 等 8 个修复主题在语料零断言，属「新面缺落点」，下轮按需补一行指针。
3. **ref-sweep 增强（产品侧，需另立任务）**：无引文区间钉的机械核对——本轮 60 处漂移全靠人工，长期应固化工具（如引文缺失的 `path:N-M` 钉降权告警）。
