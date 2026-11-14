# 核验基线登记

本页是本语料**唯一**的基线家（`CORPUS-CHARTER.md` §2）。各篇正文不再声明「当前基线」，统一链回本页。

判据很简单：同一基线的声明数应为 1。第 2 份起就是维护负债——每轮同步都会多一处要改，而且必然漂移成不一致。

## 当前基线

| 项 | 值 |
|---|---|
| `baseline` | `dsh-v0.2.1-rc.5`（commit `62adbb04417f3214eb4428c4ac28490d7ea0fdcf`） |
| 登记日期 | 2026-11-14 |
| 含义 | 本轮全量重写与复核时产品树的检出口。各篇具体核验状态与外部/本机时点快照说明见下表 |

## 各篇核验状态

`status` 取值：`reverified`（已按当前 `baseline` 工作树逐条复核源码与文档路径）、`carried`（沿用早期实测读数，仅做结构整理）、`unrecorded`（未登记核验点）。

| 篇 | `verifiedAt` 时的基线 | `status` | 说明 |
|---|---|---|---|
| 01 目录组织 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..03` + `reference`；顶层目录、`desktop-host` 随机回环端口、`tsconfig.host/client` 双编译面按 rc.5 核 |
| 02 hooks 对比 | `dsh-v0.2.1-rc.5` | reverified | DSH 原生拦截点（`agent/created`、`agent/pre-step`、`tools/*`）与实验桥实现按 rc.5 核；外部 CC/Codex 官方文档读数留档于 2026-09-22 |
| 03 preset 模式 | `dsh-v0.2.1-rc.5` | reverified | 四份 `*.patch.yml`、`minimal-preset` 快照契约与 `cordis` 四个创作技能按 rc.5 核 |
| 04 根入口文档 | `dsh-v0.2.1-rc.5` | reverified | `doc-budgets.manifest.json` 七项词数上限、`doc-sync` 门禁、`agent-instructions` 与 `compaction` 契约按 rc.5 核 |
| 06 变更落位 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..04` + `reference`；Note 现行判据（`730bcc7c85`）、`rules.mjs` 与 `ci.yml` 按 rc.5 核 |
| 07 借鉴 DSH | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..04` + `reference`；引用的 `AGENTS.md`、`defensive-patterns/README.md` 与门禁脚本按 rc.5 核 |
| 08 插件 seam | `dsh-v0.2.1-rc.5` | reverified | 生成表按 rc.5 核（99 = 58 core + 35 seam + 5 service + 1 bundle，15 条 P≥2 = 42.9%），远程与扩展点对齐 `ctx.ssh` / `ctx.deepseekLlmApiExtensions` |
| 10 重度用户体感 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..03` + `reference`；校对了已内置的右栏/交付卡/Office 预览及已退回程序化 runner 的 `cordis_define` |
| 11 原生开发闭环 | `dsh-v0.2.1-rc.5` | reverified | 拆清运行时产品姿态与仓内六步窄切片开发闭环，附新增工具走查，按 rc.5 核 |
| 13 专家插件仓 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..03` + `research`；对齐 `@deepseek-ai/dsh-agent-preset`、`dsh.client` 与 `engines.dsh` 现行校验逻辑 |
| 20 Agent Note 质量 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..03` + `reference`；准入判据、`verify-agent-note-format.ts`、`lefthook.yml` 与归档冻结机制按 rc.5 核 |
| 21 录制会话快照 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..03` + `reference`；`dsh-llm-replay`、`replay.override.json` 与 `postmortem 0001–0004` 按 rc.5 核 |
| 22 规格漂移 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..03` + `reference`；运行时投影/压缩、9 对生成器 `--check` 门禁与历史转向提交按 rc.5 核 |
| 23 发布物形态 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..03` + `reference`（保留 `upgrade-dsh-global.sh`）；启动器与发布规则按 rc.5 核，社区反馈为 2026-10-25 快照 |
| 24 插件发布与数据 | `dsh-v0.2.1-rc.5` | reverified | 独立聚焦插件与智能体作者：`dsh.bundle.patch`、`engines.dsh`、随包 `SkillProvider` 与三块运行数据接口按 rc.5 核 |
| 25 Workspace | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..02` + `reference`；`workspace.json`、`ctx.workingDirectory` 与 `deriveGroups` 按 rc.5 核，含 2026-10-27 本机案例读数 |
| 26 定制工作台发行 | `dsh-v0.2.1-rc.5` | reverified | 由原 `24/release/` 独立成篇：以 Kanban Studio 串联 Profile 组装、`$DSH_HOME` 隔离、首启绑定与生命周期，按 rc.5 与隔离冒烟核 |
| 27 运行时编排 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..03`；`PTC`、`subagent`、`workflow`、`agent-team`、`goal`/`ralph`、`jobs`/`schedule` 契约按 rc.5 核 |
| 28 探针工作法 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..02` + `reference`；4 个主仓夹具实例按 rc.5 实测核对，外仓 `probes/` 读数为 2026-11-10 本机清点 |
| 29 keyless 边界 | `dsh-v0.2.1-rc.5` | reverified | 重组为 `answer` + `01..02`；唯一判据、哨兵假 Key、`refresh` 语义与五档测试证据按 rc.5 核 |

## 版本号能写在哪

- **本页**：写当前基线，唯一一处。
- **正文引用历史 commit 作为证据**：可以，但必须明确作为历史事件（如历史提交、已归档决策记录），不得写成当前基线。
- **正文引用外部文档或本机抽样的当日读数**：可以，明确标出采样日期，不冒充仓库基线。
- **链接 URL**：一律 `blob/master/` 或 `tree/master/`；不把 tag / SHA 写进内容地址。事件与讨论永久链接（`commit/`、`pull/`、`issues/`、`discussions/`）可固定编号或 SHA。

## 版本升级时改什么

| 动作 | 做不做 |
|---|---|
| 改本页的 `baseline` 一处 | 做 |
| 逐条复核受影响结论 | **做**（这是升级的实质工作） |
| 改各篇正文里的基线副本 | 不做（不应存在） |
| 改链接里的 tag 或 SHA | 不做（链接指向 `master`） |
| 把「换了一批 URL」记成「复核完成」 | 不做（改 URL 不等于复核） |
