# 01 · 八类能力与场景：新人 20 分钟消化路径

基线 `dsh-v0.2.0-rc.2`；本页是专题的**教程层**——先建立地图、走完场景，再回 [`02`](./02-plugin-catalog.md)（图鉴）与 [`03`](./03-reference-lists.md)（清单）按需查表。分类思考的深挖在 [`05`](./05-taxonomy-and-design.md)。

## 心智模型先立住（4 句话）

1. dsh 的进程里是一棵**插件树**：对话循环、读文件、跑命令、接模型、画界面，都是树上的插件，全部经 `ctx` 总线互相使用。
2. 包要经过**三层才到你面前**：bundle 打包 → profile 组装 → preset 选模式。所以「dsh 有没有 X」永远要按层查，不能只看一层。
3. 同一个能力常常有多个插件实现（换搜索引擎、换 LLM 后端），**换实现不改调用方**——这是整台机器最重要的性质。
4. 术语最小集：**插件**＝导出 `apply` 的模块；**ctx**＝服务总线；**seam**＝三角色齐备的可替换能力；**role**＝core/seam/service/bundle；**形态**＝Def/Impl/Tool/cmd/UI/adapter/lib/bundle/驱动；**可见性**＝base/web/min/preset/opt/—。完整版见 [`../00-index.md`](../00-index.md) 的术语速查与 [`05`](./05-taxonomy-and-design.md)。

## 八类能力：你想干什么 ↔ dsh 给了什么

每一类末尾列出它覆盖的包组——55 个组全部有着落，读完即知全量分布；逐包明细回 [`02`](./02-plugin-catalog.md)。

### ① 跑一轮对话（循环、目标、计划、待办）

`agent-loop` 是唯一的具体循环；`goal` 三工具（`create_goal/get_goal/update_goal`）＋round-driver 让一个目标跨 turn 自主推进；`plan-mode` 管计划与 `exit_plan_mode`；`tool-todo` 管任务清单。模型「性格」由 preset 决定（standard/ptc/minimal/cordis 四选一）。**覆盖组**：core、goal、plan、todo、interaction 的 commands 行。

### ② 接模型（Provider、账号、计量）

`ctx.llm` 是 seam：稳定实现 `llm-deepseek`（账号 `llm-deepseek-account` / 裸 key `llm-deepseek-api-key` 两条入口行）；`llm-pi-ai` 休眠随装，settings 给 profiles 即接 OpenRouter 等多家；`llm-retry` 重试、`token-meter` 计量。**覆盖组**：llm、credentials（deepseek-account）。

### ③ 文件、命令、代码（模型的双手）

`tool-fs` 四工具（read/write/edit/read_image）＋`tool-fs-search`（glob/grep）；`shell` 经 sandbox 执行（`bash-sandbox` 围栏）；`tool-bash`/`tool-bash-persistent` 一次性与持久两态；`tool-terminal`（未挂载现货）；`lsp`（未挂载现货）；`ptc-runtime` 的 `run_code` 让模型写代码跑代码（ptc 模式的主通道）。**覆盖组**：fs、subprocess、shell、sandbox、ssh、terminal、lsp、ptc-runtime。

### ④ 上网与文档

`tool-web` 的 `web_search`/`web_fetch` 出厂即有（官方搜索＋HTTP 抓取）；换 Exa/Perplexity 是 patch 两行；`office-to-pdf` 转文档、`attachment` 管图片与文件附件。**覆盖组**：web、document、attachment。

### ⑤ 派活与自动化（子代理、后台任务、定时）

`tool-subagent`/`subagent_fork` 委派子代理（进程内、ACP、Codex、Claude Code、SDK 多后端）；`jobs` 管后台任务（`job_list/job_output/job_kill`）；`workflow` 编排多步；`schedule` 定时提醒（随 optional bundle）；experimental 里有 Agent Teams 与 auto-review。**覆盖组**：subagent、jobs、workflow、schedule、experimental 的 teams/auto-review 家族、browser-use / computer-use（让模型操作浏览器与桌面）。

### ⑥ 记忆、检索、技能（会话的持久半边）

`session-persistence`（JSONL+zstd）存全部事件；`session-projection` 投影出 UI 需要的视图；`compaction-basic` 压缩历史；`session-query-sqlite` 提供全文搜索（出厂关着）；`context` 组管引用与注入（@file/@session、AGENTS.md 注入、time-context）；`skill` 族是按需加载的任务知识；`spill` 管超大输出落盘。**覆盖组**：session、session-query、compaction、context、skill、spill、storage。

### ⑦ 人与界面（浏览器半边 + 程序化入口）

63 个 `client` 包画 Web 界面（ui-* 罗盘行）；`host`/`api` 组是 Remote 控制器与 webserver；`interaction` 管审批与提问（`ui-approval`/`ui-user-questions` 接管 waterfall）；`deliverables` 呈现终件；`feedback` 记赞踩；`settings`/`config-editor` 管配置面；程序化入口走 `sdk`（JSON-RPC）或 `acp`；`webhook` 让外部事件开会话。**覆盖组**：client、host、api、interaction、feedback、deliverables、settings、workspace、sdk、acp、webhook。

### ⑧ 扩展机制与运营（「插件」本身的插件）

`boot` 组管启动（profile、hmr、plugin-manager、config-editor）；`bundle`/`preset` 组是交付与模式单位；`extensions` 的 cordis-host-runner 支持运行时动态插件；`mcp-client` 把任一 MCP 服务器的工具接进来、`hooks-claude-code`/`hooks-codex` 桥接外部 hook；`guard` 防重复调用与超时；`identity`/`telemetry`/otel 是运营遥测；`test-support`/`util`/`typert`/`runtime-diagnostics` 是支撑层（不挂载）。**覆盖组**：boot、bundle、preset、extensions、mcp、hooks、guard、identity、telemetry、runtime-diagnostics、test-support、util、typert。

## 四个场景走一遍（每个都是「你以为要写插件，其实不用」）

| 场景 | 你的第一反应 | 实际动作 | 证据 |
|---|---|---|---|
| **A. 让模型能上网** | 「写个搜索工具插件？」 | 什么都不写：`web_search`/`web_fetch` 在 base 层出厂即有；设 `DEEPSEEK_API_KEY` 即用官方搜索 | base:472-490 |
| **B. 换搜索引擎** | 「改源码或写新工具？」 | patch 两行：disabled `web-search-deepseek`＋insert `web-search-exa`——`web_search` 名字不变，模型无感 | web-search-exa/README.md:40 |
| **C. 会话全文搜索** | 「写个检索插件？」 | 一行配置：`session-query-sqlite` 的 `openAt: never` 改 `first-search`，SQLite FTS5 立即可用 | base:141-153 |
| **D. 定时提醒** | 「写个 cron 插件？」 | Web 插件页一键开 `schedule-bundle`（OPTIONAL_BUNDLES 四个之一），带回 schedule/time-context/ui-schedule 三行 | profile.ts:213-218 |
| **E. 无 GUI 部署要审批** | 这才是真的要写 | `ctx.approval` 零 Provider，headless 部署需自写一个 `approval/request` waterfall 监听插件——先查 [`04`](./04-reuse-paths-and-gaps.md) 缺口清单再动手 | docs/capability-seams.md:652 |

## 读完这页你该能回答

1. 我想要的能力属于八类中的哪一类？（回本页找）
2. 它的包在哪个可见性档位？（回 [`02`](./02-plugin-catalog.md) 图鉴查，或 [`03`](./03-reference-lists.md) 按 profile 查）
3. 拿到它要走哪条出路？（去 [`04`](./04-reuse-paths-and-gaps.md)）
