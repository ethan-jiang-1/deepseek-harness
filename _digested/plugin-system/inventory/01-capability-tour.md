# 01 · 八类能力与场景：新人 20 分钟消化路径

> **为什么单独有这一页**：面对上百个分散在几十个子目录下的 `@deepseek-ai/dsh-*` 包，直接去翻图鉴表格只会让人淹没在包名里，既分不清哪些开箱就有、哪些只是可替换后端，也抓不到能力之间的组装关系。这一页刻意把全部包先按「你想让系统完成什么事」收拢成 **8 类日常场景**，帮你先建立一张心智地图与三种到货档位的判断；有了这张地图之后，再去 [`02`](./02-plugin-catalog.md)（逐组图鉴）与 [`03`](./03-reference-lists.md)（横切清单）按需查表就不会迷路（分类与设计思考见 [`05`](./05-taxonomy-and-design.md)）。

## 心智模型先立住（4 句话）

1. dsh 的进程里是一棵**插件树**：对话循环、读文件、跑命令、接模型、画界面，都是树上的插件，全部经 `ctx` 总线互相使用。
2. 包要经过**三层才到你面前**：bundle 打包 → profile 组装 → preset 选模式。所以「dsh 有没有 X」永远要按层查，不能只看一层。
3. 同一个能力常常有多个插件实现（换搜索引擎、换 LLM 后端），**换实现不改调用方**——这是整台机器最重要的性质。
4. 术语：`plugin`、`ctx`、`seam` 的 DSH 说法见 [`canon/GLOSSARY.md`](../../canon/GLOSSARY.md)；**role**（core/seam/service/bundle）、**形态**（Def/Impl/Tool/cmd/UI/adapter/lib/bundle/驱动）与**可见性**档位是本专题自己的分类，不是 DSH 的词，见 [`05`](./05-taxonomy-and-design.md)。

本页提到的能力，到货档位只有三种：随装出货且默认开（base/web 层）、随装出货但默认关（`packages/boot/app-boot/src/profile.ts:223` 的 12 条）、不随装出货按需安装（`packages/boot/app-boot/src/official-bundle-packages.ts:4` 的 2 条）。逐个工具包的模型可见名以 `docs/tool-catalog.md:12` 的 Tool Package Map 为真源；profile 模板与默认组合见 `packages/boot/app-boot/src/profile.ts:179`（`PROFILE_TEMPLATES`）。

## 八类能力：你想干什么 ↔ dsh 给了什么

每一类末尾列出它覆盖的包组——全部包组都有着落，读完即知全量分布（组数见 `claims.json` 的 `package-group-total`）；逐包明细回 [`02`](./02-plugin-catalog.md)。

### ① 跑一轮对话（循环、目标、计划、待办）

`agent-loop` 是唯一的具体循环；`goal` 三工具（`create_goal/get_goal/update_goal`）＋round-driver 让一个目标跨 turn 自主推进；`plan-mode` 管计划与 `exit_plan_mode`；`tool-todo` 管任务清单。模型「性格」由 preset 决定（standard/ptc/minimal/cordis 四选一）。**覆盖组**：core、goal、plan、todo、interaction 的 commands 行。

### ② 接模型（Provider、账号、计量）

`ctx.llm` 是 seam：稳定实现 `llm-deepseek`（账号 `llm-deepseek-account` / 裸 key `llm-deepseek-api-key` 两条入口行）；`llm-pi-ai` 休眠随装，settings 给 profiles 即接 OpenRouter 等多家；`llm-retry` 重试、`token-meter` 计量。**覆盖组**：llm、credentials（deepseek-account）。

### ③ 文件、命令、代码（模型的双手）

`tool-fs` 四工具（read/write/edit/read_image）＋`tool-fs-search`（glob/grep）；`shell` 经 sandbox 执行（`bash-sandbox` 围栏）；`tool-bash`/`tool-bash-persistent` 一次性与持久两态；`working-directory`＋`tool-working-directory` 管 Session 执行目录；`tool-terminal` 六工具（随 terminal-bundle）；`lsp`（未挂载现货）；`ptc-runtime` 的 `run_code` 让模型写代码跑代码（ptc 模式的主通道）；`ssh` 族把 fs/subprocess/sandbox 一起换成远端，`ssh-helper-runtime` 是其远端载体。**覆盖组**：fs、subprocess、shell、sandbox、ssh、terminal、lsp、ptc-runtime。

### ④ 上网与文档

`tool-web` 的 `web_search`/`web_fetch` 出厂即有（官方搜索＋HTTP 抓取）；`web-deepseek-api` 是同一 seam 上的 DeepSeek Search/Fetch API 直连 provider；换 Exa/Perplexity 是 patch 两行；`office-to-pdf` 转文档、`attachment` 管图片与文件附件。**覆盖组**：web、document、attachment。

### ⑤ 派活与自动化（子代理、后台任务、定时）

`tool-subagent`/`subagent_fork` 委派子代理（进程内、ACP、Codex、Claude Code、SDK 多后端；Codex 与 Claude Code 走官方按需安装通道）；`jobs` 管后台任务（`job_list/job_output/job_kill`）；`workflow` 编排多步；`schedule` 定时提醒（Web 组合自带服务，四工具由 standard/ptc/cordis preset 声明）；experimental 里有 Agent Teams、session-search、ralph、worktree、auto-review。**覆盖组**：subagent、jobs、workflow、schedule、experimental 的 teams/检索/review 家族、browser-use / computer-use（让模型操作浏览器与桌面）。这一族原语的机制深挖（什么时候用哪个、各自保证什么、怎么组合）见 [`../../delegation-and-orchestration/00-map.md`](../../delegation-and-orchestration/00-map.md)。

### ⑥ 记忆、检索、技能（会话的持久半边）

`session-persistence`（JSONL+zstd）存全部事件；`session-projection` 投影出 UI 需要的视图；`compaction-basic` 压缩历史；`session-query-sqlite` 提供全文搜索（出厂关着）；`context` 组管引用与注入（@file/@session、AGENTS.md 注入、time-context）；`skill` 族是按需加载的任务知识；`spill` 管超大输出落盘。**覆盖组**：session、session-query、compaction、context、skill、spill、storage。

### ⑦ 人与界面（浏览器半边 + 程序化入口）

`client` 组的包画 Web 界面（ui-* 罗盘行）；`host`/`api` 组是 Remote 控制器与 webserver，`api/remote-access` 决定非 owner Peer 能调哪些 Remote 方法；`interaction` 管审批与提问（`ui-approval`/`ui-user-questions` 接管 waterfall）；`deliverables` 呈现终件；`feedback` 记赞踩；`settings`/`config-editor` 管配置面；程序化入口走 `sdk`（JSON-RPC）或 `acp`。**覆盖组**：client、host、api、interaction、feedback、deliverables、settings、workspace、sdk、acp。

### ⑧ 扩展机制与运营（「插件」本身的插件）

`boot` 组管启动（profile、hmr、plugin-manager、config-editor）与插件市场（`plugin-market`＋`util/plugin-market-index`＋`ui-plugin-market`，随 plugin-market-bundle 默认关）；`bundle`/`preset` 组是交付与模式单位；`extensions` 的 cordis-host-runner 支持运行时动态插件；`mcp-client` 把任一 MCP 服务器的工具接进来；`guard` 防重复调用与超时；`identity`/`telemetry`/otel 是运营遥测；`test-support`/`util`/`typert` 是支撑层（不挂载）。**覆盖组**：boot、bundle、preset、extensions、mcp、guard、identity、telemetry、test-support、util、typert。

hooks 三个桥接包（`hook-protocol`/`hooks-claude-code`/`hooks-codex`）与 `webhook` 两个包均归属 [`experimental/`](../../experimental/00-map.md) 组；仓库内不设 `packages/runtime-diagnostics/`、`ctx.invariants` 服务或独立 `packages/hooks/` 组。

## 六个场景走一遍（每个都是「你以为要写插件，其实不用」）

| 场景 | 你的第一反应 | 实际动作 | 证据 |
|---|---|---|---|
| **A. 让模型能上网** | 「写个搜索工具插件？」 | 什么都不写：`web_search`/`web_fetch` 在 base 层出厂即有；设 `DEEPSEEK_API_KEY` 即用官方搜索 | base:473-487 |
| **B. 换搜索引擎** | 「改源码或写新工具？」 | patch 两行：disabled `web-search-deepseek`＋insert `web-search-exa`——`web_search` 名字不变，模型无感 | web-search-exa/README.md:40 |
| **C. 会话全文搜索** | 「写个检索插件？」 | 一行配置：`session-query-sqlite` 的 `openAt: never` 改 `first-search`，SQLite FTS5 立即可用 | base:157-161 |
| **D. 定时提醒** | 「写个 cron 插件？」 | 什么都不写：`schedule`＋`ui-schedule` 已随每个 Web profile 出厂，`schedule_*` 四工具由 standard/ptc/cordis preset 声明（`minimal` 不声明）；旧 `schedule-bundle` 在 `RETIRED_BUNDLES` 中于载入时自动摘除 | web-app:135-140、398-399；presets/standard.patch.yml:35-36 |
| **E. 插件市场** | 「自己写个索引抓取？」 | Web 插件页开 `plugin-market-bundle`（OPTIONAL_BUNDLES 之一）：`plugin-market` 读并校验索引，Discover 页安装，`plugin_market` 工具给模型 | profile.ts:223-236 |
| **F. 无 GUI 部署要审批** | 这才是真的要写 | `ctx.approval` 零 Provider，headless 部署需自写一个 `approval/request` waterfall 监听插件——先查 [`04`](./04-reuse-paths-and-gaps.md) 缺口清单再动手 | docs/capability-seams.md:691 |

## 读完这页你该能回答

1. 我想要的能力属于八类中的哪一类？（回本页找）
2. 它的包在哪个可见性档位？（回 [`02`](./02-plugin-catalog.md) 图鉴查，或 [`03`](./03-reference-lists.md) 按 profile 查）
3. 拿到它要走哪条出路？（去 [`04`](./04-reuse-paths-and-gaps.md)）
