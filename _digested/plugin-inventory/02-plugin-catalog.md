# 02 · 插件货架：316 包逐组图鉴

基线 `dsh-v0.2.0-rc.2`（快照式清单，重测义务见 [`_coverage/`](../_coverage/00-index.md)）；组序与 [`packages/README.md`](../../packages/README.md) 一致。总量：316 包（`packages/*/*/package.json` 枚举）、55 个包组（含 experimental）。

**这页是图鉴，不是教程**：先读 [`01-capability-tour.md`](./01-capability-tour.md) 建立八类地图，再按组回来查。新人最高频的十个包：

| 包 | 干什么 | 在哪层 |
|---|---|---|
| `tool-bash` | 跑命令 | base＋preset |
| `tool-fs` | 读/写/编辑文件 | base＋preset |
| `tool-web` | 搜索与抓取 | base＋preset |
| `tool-goal` | 目标三工具 | base＋preset |
| `tool-subagent` | 委派子代理 | base＋preset |
| `tool-todo` | 任务清单 | base＋preset |
| `tool-present` | 终件交付声明 | preset |
| `tool-skill` | 加载技能 | base＋preset |
| `compaction-basic` | 历史压缩 | base＋preset |
| `session-persistence-jsonl` | 会话落盘 | base＋min |

**可见性图例**：`base`＝在 dsh-base patch 内（headless / acp / sdk 原样继承）；`web`＝web-app 层；`min`＝sdk-minimal；`preset`＝各会话 agent preset 提供；`opt`＝OPTIONAL_BUNDLES 一键开；`—`＝不随任何 shipped profile 挂载（`dsh plugin add` / patch insert / 纯依赖）。

**形态图例**：Def＝Service Definition（`ctx` 服务声明）；Impl＝Provider 实现；Tool＝模型可见工具；cmd＝人类命令插件；UI＝client UI 插件；adapter＝LLM adapter；lib＝纯库；bundle＝组合清单包；驱动＝启动胶水。九种形态的判定与设计逻辑见 [`05-taxonomy-and-design.md`](./05-taxonomy-and-design.md)。

## core/（8 包）

| 包 | 形态 | 可见 | 关键键 | Config | 职责 |
|---|---|---|---|---|---|
| agent | Def `ctx.agents` | base | `ctx.agents` | — | Agent 句柄/注册/事件词表 |
| agent-loop | bundle 角色 | base+min | `ctx.agentLoop` | 6 | 唯一具体循环 |
| agent-default-model | Def | base | `ctx.agentDefaultModel` | 3 | 默认模型选择 |
| agent-tool-presentation | 展示模式选择器 | preset(ptc) | tools mode | 1 | 工具编排为 ptc / native / both |
| scope | lib | — | — | — | 作用域注册原语 |
| session | Def `ctx.sessions` | base | `ctx.sessions` | — | 事件溯源 Session 存储与持久事件流 |
| system-prompt | Def `ctx.systemPrompt` | base | `ctx.systemPrompt` | 5 | 提示词装配注册表 |
| tools | Def＋Tool | base | `ctx.tools`、`run_code` | 2 | 工具注册与守卫流水线 |

## api/（9 包）——Web BFF Remote 控制器

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| gateway | Remote 分派 | base | 0 | 生成 Remote 命名空间与 unary 调用 |
| session-controller | Remote 控制器 | web | 0 | Session 命令/冷读/跟随 |
| settings-controller | Remote 控制器 | web | 0 | settings/credentials 投影，读恒脱敏 |
| workspace-controller | Remote 控制器 | web | 2 | Workspace 命令＋目录挑选通道 |
| workspace-files | Remote 服务 | web | 0 | 工作区文件受限读/列目录/变更流 |
| account-controller | Remote 控制器 | web | — | 账户操作投影 |
| job-controller | Remote 控制器 | web | 0 | 单 job 观测流 |
| terminal-controller | Remote 控制器 | web | 3 | 用户终端进程＋屏幕恢复 |
| remotes | BFF 组装 | web | — | Remote 装配 |

## typert/（4 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| registry | Def `ctx.typert` | base | — | 运行时类型注册表 |
| loader | Loader 集成 | base | 1 | 生成物注册进 ctx.typert |
| protocol | lib | — | — | Remote 元数据协议 |
| generator | lib/CLI | — | — | TS 工程分析 → Typert 产物 |

## goal/（4 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| goal | Def `ctx.goals` | base | 1 | 会话内目标状态折叠 |
| goal-round-driver | 驱动 | base | — | 目标续跑轮驱动 |
| command-goal | cmd `/goal` | base+preset | — | 人类命令入口 |
| tool-goal | Tool×3 | base+preset | 1 | `create_goal/get_goal/update_goal` |

## schedule/（1 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| schedule | Def＋Tool×4 | opt（随 schedule-bundle） | 2 | `schedule_create/list/delete/update`，宿主级定时任务 |

## feedback/（2 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| message-feedback | Def `ctx.messageFeedback` | web | 0 | 消息级赞/踩入日志 |
| command-feedback | Def `ctx.sessionFeedback`＋cmd | base | — | 会话级反馈记录 |

## telemetry/ 与 identity/（2 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| otel | Def `ctx.otel`（service） | base | — | OTLP 遥测通道 |
| anonymous-user-id | lib | — | — | 共享匿名标识 |

## llm/（9 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| llm | Def seam `ctx.llm` | base+min | — | Provider 无关流式服务 seam |
| llm-deepseek | adapter Impl | —（base 两行挂载） | — | DeepSeek Messages adapter |
| llm-deepseek-api-key | 入口行 | base+min | 1 | api-key 认证发现 |
| llm-deepseek-account | 入口行 | base | 0 | 账户认证发现 |
| llm-pi-ai | adapter Impl（休眠） | base | 56 | 零 routes 直到 settings 提供 profiles |
| llm-retry | 策略 | base+min | 0 | Provider 路由重试 |
| deepseek-llm-api-extensions | Def seam | base+min | — | 官方 API 附加字段注册 seam |
| plugin-package-inventory-deepseek | Impl | base+min | 1 | 活跃插件清单注入官方请求 |
| token-meter | Def `ctx.tokenMeter` | base | 0 | 回放感知 token 计量 |

## 执行面：subprocess / ssh / shell / terminal（17 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| subprocess | Def seam `ctx.subprocess` | — | — | 进程执行 seam |
| subprocess-local | Impl | base+min | — | 本地实现 |
| win32-process | lib | — | — | Windows 进程支撑 |
| ssh | Def `ctx.ssh` | — | 11 | 远程连接（族共享） |
| fs-ssh / subprocess-ssh / sandbox-ssh | Impl×3 | — | — | 三个 seam 的远端实现 |
| shell | Def seam `ctx.shell` | — | — | bash 执行器 seam |
| bash-local | Impl | — | 6 | 本地执行器 |
| bash-sandbox | Impl | base | 0 | 沙箱包裹执行器（base 实装） |
| pwsh-local / pwsh-sandbox | Impl | — / base | 7 / 0 | PowerShell 侧同构 |
| shell-env | Def `ctx.shellEnv` | base | 1 | 托管 DSH_* 环境注册表 |
| tool-bash / tool-pwsh | Tool | base+preset | 2 / 2 | 一次性 `bash` / `pwsh` |
| tool-bash-persistent / tool-pwsh-persistent | Tool | min+preset(minimal) | 4 / 4 | 持久 PTY shell |

## terminal / ptc-runtime（3 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| terminal | Def seam `ctx.terminals` | min | — | 持久终端 seam |
| terminal-bash | Impl | min+preset(minimal) | 16 | bash PTY 实现 |
| tool-terminal | Tool×6 | —（显式 opt-in） | 2 | `terminal_open/read/send/signal/close/list` |
| ptc-runtime | Def seam `ctx.ptcRuntime` | — | — | 代码运行 seam |
| ptc-runtime-node | Impl | base | 9 | worker-thread 后端（`run_code`） |

## 浏览器与桌面控制（2 包）

| 包 | 形态 | 可见 | 职责 |
|---|---|---|---|
| browser-use | Def seam `ctx.browserUse` | — | 浏览器独占注册位，**零 stable Provider**（实现全在 experimental） |
| computer-use | Def seam `ctx.computerUse` | — | 桌面控制同构，**零 stable Provider** |

## sandbox /（4 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| sandbox | Def seam `ctx.sandbox` | — | — | spawn 前_argv 围栏 seam |
| sandbox-local | Impl | base+min | 3 | bwrap / Landlock / Seatbelt |
| sandbox-policy | Def `ctx.sandboxPolicy` | base+min | 2 | 策略判定（permission 联动） |
| sandbox-windows-acl | Impl（skill 形态） | — | — | Windows ACL 诊断 skill |

## fs/（7 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| fs | Def seam `ctx.fs` | — | — | 文件系统 seam |
| fs-local | Impl | — | 2 | 本地实现 |
| fs-sandbox | Impl | base | 0 | 按共享沙箱模式围栏（base 实装） |
| fs-observation-policy | 事件门策略 | base | — | read-before-write/edit 观测 |
| tool-fs | Tool×4 | base+preset | 4 | `edit/read/read_image/write` |
| tool-fs-search | Tool×2 | base+preset | 9 | `glob/grep`（打包 ripgrep） |
| tool-str-replace-editor | Tool | — | 2 | 独立编辑器风格工具（未挂载） |

## lsp/（3 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| lsp | Def seam `ctx.lsp` | — | — | 语言服务 seam |
| lsp-stdio | Impl | — | 12 | stdio host 实现（未挂载） |
| tool-lsp | Tool `lsp` | — | 3 | 未挂载；无 Provider 时报 LSP_UNAVAILABLE |

## skill/（6 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| skill | Def seam `ctx.skills` | base | 0 | Provider 目录合并 |
| skill-filesystem | Impl | base+preset | 12 | 项目/自定义/用户根磁盘 skill |
| skill-office | Impl | sdk-app（门控） | 3 | Word/PPT/Excel 工作流 skill |
| skill-badge | Impl | base（disabled） | — | 徽章 skill |
| tool-skill | Tool `skill` | base+preset | 1 | 目录渲染＋加载 |
| tool-workspace-dependencies | Tool | sdk-app（门控） | 0 | `load_workspace_dependencies` 内置运行时路径 |

## compaction/（5 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| compaction | Def seam `ctx.compaction` | — | — | 历史压缩 seam |
| compaction-basic | Impl | base+preset | 13 | 阈值压缩实现 |
| compaction-tool-result-pruner | Def＋消费 | base+preset | 3 | `ctx.toolResultPruner` 工具结果裁剪 |
| command-compact | cmd `/compact` | base | — | 人类显式压缩命令 |
| compaction-image-offload | 策略 | base | — | 图片预算替换重试 |

## context/（6 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| file-reference | Def seam `ctx.fileReferences` | — | — | 文件引用 seam |
| file-reference-local | Impl | web | 3 | 本地实现 |
| session-reference | Def `ctx.sessionReferenceResolver` | web | 4 | 会话引用解析 |
| agent-instructions | 注入 | base+preset | 6 | AGENTS.md/CLAUDE.md 注入 |
| time-context | 注入 | —（随 schedule-bundle） | 2 | 时间上下文 |
| tmux-context | 注入 | — | 1 | tmux 状态上下文（opt-in） |

## subagent/（10 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| subagent | Def seam `ctx.subagents` | base | 2 | 具名 Provider 注册＋续跑编排 |
| subagent-spawn-in-process | Impl | base | 1 | 进程内 spawn |
| subagent-fork-in-process | Impl | base | 1 | 进程内 fork（可续） |
| subagent-acp | Impl | preset 占位 disabled | 8 | ACP 后端 |
| subagent-codex | Impl | preset 占位 disabled | 5 | Codex 后端 |
| subagent-claude-code | Impl | preset 占位 disabled | 5 | Claude Code 后端 |
| subagent-dsh-sdk | Impl | — | 13 | 经 SDK 的子 DSH 运行时 |
| subagent-in-process-driver | lib 驱动 | — | — | spawn/fork 共用驱动 |
| tool-subagent | Tool 多实例 | base+preset | 11 | `subagent`/`subagent_fork`＋`ctx.subagentModelSelection` |
| tool-subagent-control | Tool×3 | base+preset | — | `send_message`/`interrupt_agent`/`list_agents` |

## jobs/（3 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| jobs | Def seam `ctx.jobs` | — | — | 后台任务 seam |
| jobs-local | Impl | base+min | 4 | 本地任务存储 |
| tool-jobs | Tool×3 | base+preset | 4 | `job_output/job_list/job_kill` |

## workflow/（4 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| workflow | Def seam `ctx.workflowEngine` | — | — | 工作流编排 seam |
| workflow-ptc | Impl | base+preset | 5 | worker-thread 引擎 |
| tool-workflow | Tool `workflow` | base+preset | 3 | 多代理编排入口 |
| tool-ralph | Tool `ralph` | 出厂关闭 | 4 | 打开方式见 base 注释示例 |

## webhook/（2 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| webhook | Def `ctx.webhookRuntime` | — | — | webhook ingress（core） |
| webhook-github | 消费方适配 | — | 0 | GitHub 签名验证与分发 |

## web/（6 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| web | Def seam `ctx.web` | base | 0 | 搜索/抓取 Provider 注册 |
| web-search-deepseek | Impl | base | 7 | 官方搜索（出厂） |
| web-fetch-http | Impl | base | 5 | 匿名 HTTP(S) 抓取（出厂） |
| web-search-exa | Impl | — | 5 | 备选搜索 Provider |
| web-search-perplexity | Impl | — | 5 | 备选搜索 Provider |
| tool-web | Tool×2 | base+preset | 7 | `web_search/web_fetch`（名字稳定） |

## deliverables/（2 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| tool-present | Tool `present` | preset(standard/ptc/cordis) | 1 | 终件交付声明（inject tools/fs/sessionProjections） |
| workspace-changes | Def `ctx.workspaceChanges` | web | 5 | 每轮变更文件摘要（git 快照＋whole-file capture） |

## document / attachment / spill / todo（7 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| office-to-pdf | Def `ctx.officeToPdf` | web | 19 | 宿主 LibreOffice 转换 |
| attachment | Def seam `ctx.attachments` | — | — | 附件 seam |
| attachment-local | Impl | base | 10 | 本地附件实现 |
| spill | Def seam `ctx.spillStore` | — | — | 超大输出落盘 seam |
| spill-local / spill-policy | Impl / 策略 | base | 2 / 1 | 本地存储 / maxInlineTokens 裁剪 |
| tool-todo | Tool `todo_write` | base+preset | 1 | 任务清单 |

## plan / preset（4 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| plan-mode | Def＋Tool | base+preset | 1 | `ctx.planMode`＋`exit_plan_mode` |
| agent-preset-registry | Def `ctx.agentPresets` | web | 2 | preset 注册表（default=standard） |
| agent-preset | 声明式子插件行 | preset 用 | 0 | 四模式 patch；自带 creator skills |
| persona | preset 行 | preset 用 | 4 | agent 私有 persona |

## guard /（2 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| repeat-tool-reminder | 护栏 | base | 4 | 重复调用提醒（thresholds 3/5/8） |
| timeout-policy | 护栏 | base | — | tools/execute 死线 |

## bundle /（6 包）

| 包 | 职责 |
|---|---|
| base | 共享核心 patch 层（headless / acp / sdk 原样继承） |
| web-app | 浏览器层＋presets/（85 条 insert 行明细见 runtime-profiles/01） |
| headless | 一次性任务层，无 Host/HTTP/Web |
| acp-app | ACP stdio 层 |
| sdk-app | SDK stdio 层（含门控的 office skill 与 workspace-deps 工具） |
| sdk-minimal | 独立全树（不叠 base，只有持久 shell） |

## extensions / mcp / hooks（9 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| cordis-host-runner | Def×2 | web | 2 | `ctx.dynamicCordisRunner`＋`ctx.cordisInspect` |
| cordis-client-runner | 浏览器半边 | web | — | client 侧 runner |
| tool-cordis | Tool×2 | preset(cordis) | — | `cordis_inspect_list/query` 只读工具 |
| ui-cordis | UI | web | — | 插件卡片 |
| mcp-resources | Def seam＋Tool×3 | base+min | — | MCP resources 按需 list/read |
| mcp-client | Impl | — | 22 | 把任一 MCP 服务器的工具接进 ctx.tools |
| hook-protocol | lib | — | — | 线协议 |
| hooks-claude-code / hooks-codex | 桥接插件 | — | 5 / 4 | CC/Codex 兼容桥（未挂载） |

## session/（20 包，折叠同类）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| session-persistence | Def seam `ctx.sessionPersistence` | — | — | 持久化 seam |
| session-persistence-jsonl | Impl | base+min | 2 | JSONL+zstd 实现 |
| session-projection | Def | base+min | — | 投影注册 |
| session-projection-cache | Def | base | 2 | 投影缓存 |
| session-title | Def seam | base+min | — | 标题生成面 |
| session-title-first-prompt-llm | Impl | base | — | 首条 prompt 标题 Provider |
| session-title-all-prompts-llm | Impl | — | — | 全 prompt 标题 Provider（未挂载＝patch 可换） |
| session-title-llm | lib | — | — | 标题共享逻辑 |
| session-log-deepseek | Impl | base+min | 2 | 上传通道（delivery-accepted 事件） |
| session-checkpoint-policy | 策略 | base | — | checkpoint 时机 |
| session-telemetry | Def seam | — | — | 会话遥测 seam |
| session-telemetry-otel | Impl | base | 6 | 出厂 FEEDBACK_ONLY |
| session-stats | web 投影 | web | — | 右栏统计 |
| session-turn-outline | web 投影 | web | — | 右栏轮次大纲 |
| session-format-catalog | lib | — | — | 生成式迁移 catalog |
| session-format | lib | — | — | Stage/chain 迁移协议 |
| session-format-v0-to-v1 / session-format-v1-to-v2 / session-format-v2-to-v3 / session-format-v3-to-v4 | lib×4 | — | — | 冻结相邻迁移边 |

## session-query/（4 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| session-query | Def seam `ctx.sessionQuery` | — | — | 会话检索 seam |
| session-query-sqlite | Impl | base | 8 | SQLite FTS5（出厂 `openAt: never` 关） |
| tool-session-query | Tool×5 | —（显式 opt-in） | 2 | `session_search/event_search/trace/event_trace/event_read` |
| session-log-export | cmd | web | — | `/export` 导出 |

## settings / credentials / storage / workspace（11 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| settings | Def `ctx.settings` | base | — | 配置面服务 |
| credentials | Def seam `ctx.credentials` | — | — | 凭据 seam |
| credentials-local | Impl | base | 4 | env-over-.env 实现 |
| deepseek-account | Def seam `ctx.deepseekAccount` | — | — | 账号登录态 seam |
| deepseek-account-platform | Impl | base | 13 | 浏览器 PKCE 实现 |
| authorization | Def seam `ctx.authorization` | base | — | **零 Provider**（新凭据流要自写） |
| storage | Def seam `ctx.storage` | — | — | 键值存储 seam |
| storage-json / storage-sqlite | Impl | base / — | 1 / 2 | json（出厂）/ sqlite（未挂载） |
| storage-domain | Def `ctx.storageDomain` | base | 2 | host 级存储域（schedule 依赖） |
| workspace | Def `ctx.workspaceRegistry` | web | — | 工作区注册表 |

## acp/（1 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| acp | App 服务插件 | acp-app | 4 | automation-only 的 ACP server：经 stdio JSON-RPC 驱动 Harness agent（`packages/bundle/acp-app/cordis.patch.yml:17` 挂载，config 定每次建 agent 的 provider/model） |

## sdk/（3 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| sdk-protocol | lib | — | — | SDK 线协议：newline-delimited JSON-RPC 帧与共享类型 |
| sdk-jsonrpc-server | App 服务插件 | sdk-app+minimal | 2 | 给进程外 SDK 客户端的 stdio JSON-RPC 服务（`packages/bundle/sdk-app/cordis.patch.yml:19`、`packages/bundle/sdk-minimal/cordis.patch.yml:12` 挂载） |
| sdk-client | lib | — | — | 驱动 Harness runtime 子进程的 TypeScript 客户端 SDK（apps/cli devDep 供测试） |

## interaction/（5 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| commands | Def `ctx.commands` | base | — | `/` 命令注册 |
| permission-presets | Def | base | 6 | read-only / workspace-write / danger-full-access 三档表 |
| user-approval | Def seam `ctx.approval` | base | — | **零 Provider**（审批回答器在 UI 侧） |
| user-questions | Def seam `ctx.userQuestions` | base | — | **零 Provider**（headless 要自答回答器） |
| tool-ask-user | Tool `ask_user_question` | preset | 2 | 模型提问入口（timed 变体） |

## boot/（5 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| app-boot | Def `ctx.profileContext` | — | — | profile 加载与组装 |
| cmdline | lib | — | — | argv 交接 |
| config-editor | Def | base（门控） | — | 配置写回 |
| hmr | Def `ctx.hmr` | base（门控） | 4 | patch 热重载 |
| plugin-manager | Def＋Tool | base（门控；工具行出厂 disabled） | 8 | 插件管理面＋`plugin_manager` 工具 |

## host/（9 包）

| 包 | 形态 | 可见 | Config | 职责 |
|---|---|---|---|---|
| webserver | Def `ctx.webServer` | web | 5 | HTTP 服务（127.0.0.1:3080 回退） |
| frontend-static | 静态分发 | web | 1 | 前端 dist |
| directory-picker | Def seam | — | — | 目录挑选 seam |
| directory-picker-native | Impl | — | — | 原生对话框后端 |
| directory-picker-browse | Impl | — | 1 | 浏览器后端 |
| directory-picker-auto | Impl | web | — | 自动选择后端 |
| open-in-app | 打开器 | web | 0 | Open In… 宿主解析 |
| plugin-inventory | 只读投影 | web | — | Loader 只读插件清单 |
| product-telemetry-otel | Def `ctx.productTelemetry` | web | 11 | 桌面遥测 OTLP |

## client/（63 包，全部 web 层）

基础设施与服务（10）：

| 包 | 形态 | 职责 |
|---|---|---|
| connection | Def `ctx.connection` | 浏览器认证传输（fetch/SSE） |
| modules | Def `ctx.clientModules` | `__DSH_BOOT__` 装配与 `/plugins` 分发 |
| hmr | 传输 | client bundle 热更新 |
| locale | 偏好 | 语言目录 |
| store | lib | Zustand/Immer 状态引擎 |
| web | 引导内核 | 静态模块表＋Loader |
| resources | 服务 | `useResource` 统一资源模型 |
| shortcuts | 注册表 | 键位路由 |
| file-upload | Def `ctx.fileUploads` | 上传暂存 |
| product-analytics | Def（service） | 桌面产品分析 |

UI 插件（53）：

| 包 | 一句话 |
|---|---|
| ui-layout | 三栏 AppFrame |
| ui-renderer | slot 绑定＋根装配 |
| ui-session | Session 控制器适配 |
| ui-sidebar | 会话树 |
| ui-sidebar-right | 右栏停靠面 |
| ui-sidebar-files | 工作区文件树 |
| ui-sidebar-terminal | 终端页签 |
| ui-sidebar-documentpreview | 文档预览页 |
| ui-sidebar-browser | 沙箱浏览器页签（desktop 门控） |
| ui-conversation | 会话装配 |
| ui-chat | Chat 目标 |
| ui-commands | `/` 命令面 |
| ui-input-trigger | `/` `@` 管线 |
| ui-tool | 工具调用树＋按工具 slot |
| ui-cordis | 动态插件卡片 |
| ui-approval | 审批瀑布接管 |
| ui-user-questions | 提问接管＋计划评审 |
| ui-attachment | 附件呈现 |
| ui-brand-official | 品牌槽占位 |
| ui-deliverables | 交付卡＋变更文件卡 |
| ui-jobs | 后台 job 面板 |
| ui-goal | GoalBar |
| ui-message-feedback | 赞/踩面 |
| ui-model-selection | `/model` 座位 |
| ui-permission-presets | 权限面 |
| ui-plan | 计划座位＋卡片 |
| ui-agent-preset | preset 缺省座位 |
| ui-plugin-manager | 插件页安装/启停/卸载 |
| ui-shortcuts | 键位参考/录制 |
| ui-open-in-app | Open In… 按钮 |
| ui-schedule | 任务页（schedule-bundle 用） |
| ui-workspace | 工作区选择器 |
| ui-workflow-run | 工作流运行节点 |
| ui-trajectory | 轨迹事件账本 |
| ui-theme | 明暗主题（Config 2） |
| ui-skill | skill 工具行 |
| ui-subagent | 子代理目录＋续跑路由 |
| ui-reference | @file/@session 引用源 |
| ui-settings | 设置域基座 |
| ui-settings-general | 常规页 |
| ui-settings-models | 模型页 |
| ui-settings-account | 账户页 |
| ui-settings-plugins | 插件设置页 |
| ui-settings-plugin-inventory | 只读插件清单页 |
| ui-settings-shell | shell 设置页 |
| ui-settings-agent-loop | agent-loop 设置页 |
| ui-settings-subagent | subagent 设置页 |
| ui-settings-web-search | 网搜设置页 |
| ui-settings-session-log | 日志上传偏好 |
| ui-directory-picker-native | 目录流原生后端 |
| ui-directory-picker-browse | 目录流浏览器后端 |
| ui-primitives | 纯 React 原子 |
| ui-slots | slot 注册表核心 |
| ui-dockkit | 停靠布局引擎 |

## experimental/（21 包，九家族——合同随时会变，机制页见 [`experimental/`](../experimental/00-map.md)）

| 包 | 家族 | 形态 | 入口 |
|---|---|---|---|
| speech-to-text | 语音输入 | Def seam `ctx.speechToText` | voice-input-bundle 一键开 |
| speech-to-text-sensevoice | 语音输入 | Impl（Config 22） | 同上 |
| api-speech-to-text | 语音输入 | Def `ctx.speechController` | 同上 |
| client-ui-voice-input | 语音输入 | UI | 同上 |
| voice-input-bundle | 语音输入 | bundle | OPTIONAL_BUNDLES |
| agent-team | Agent Teams | Def `ctx.agentTeams` | agent-team-profile 一键开 |
| tool-agent-team | Agent Teams | Tool×9 | 同上 |
| client-ui-agent-team | Agent Teams | UI | 同上 |
| agent-team-profile | Agent Teams | bundle | OPTIONAL_BUNDLES |
| auto-review | 自动审查 | tools/pre-execute 审查插件 | OPTIONAL_BUNDLES |
| schedule-bundle | 定时 | bundle（带回 schedule 三行） | OPTIONAL_BUNDLES |
| ptc-runtime-python | PTC | Impl `ctx.ptcRuntime`（Config 7） | patch insert 换后端 |
| computer-use-cua-driver-mcp | 桌面控制 | Impl `ctx.computerUse` | patch insert |
| computer-use-cua-driver-native | 桌面控制 | Impl `ctx.computerUse` | patch insert |
| browser-use-playwright-mcp | 浏览器控制 | Impl `ctx.browserUse` | patch insert |
| browser-use-chrome-devtools-mcp | 浏览器控制 | Impl `ctx.browserUse` | patch insert |
| browser-use-stagehand-native | 浏览器控制 | Impl `ctx.browserUse`（6 工具） | patch insert |
| browser-use-runtime | 浏览器控制 | lib（mountSessionMcp） | 被 driver import |
| inspector | 调试 | Def `ctx.inspector` | 显式安装，不进 OPTIONAL_BUNDLES |
| webworker-packer | worker 预览 | lib | apps/web build:preview |
| webworker-runtime | worker 预览 | worker 入口 | 同上 |

## test-support / runtime-diagnostics / util（25 包）

| 包 | 形态 | 职责 |
|---|---|---|
| agent-loop-testkit / client-runtime / loader-smoke / remote-mock / session-snapshot / llm-mock-server | lib | 测试基建 |
| llm-replay | Impl `ctx.llm` | 回放 adapter（Config 20） |
| invariants | Def `ctx.invariants` | 运行时不变量（min） |
| util/ 17 包（atomic-write、brand、chunked-list、code-language、crypto、deque、home-paths、http-proxy、launch-environment、lazy-require、native-command、output-retention、package-manifest、time、timeout、values、workspace-path） | lib | 零依赖支撑，不挂载 |

## 覆盖复核方式

本页与文件系统的一致性可机械复核（每次 upstream 同步后重跑）：

```sh
for d in packages/*/*/; do [ -f "$d/package.json" ] && basename "$d"; done | while read n; do grep -q "$n" _digested/plugin-inventory/02-plugin-catalog.md || echo "missing: $n"; done
```

0009 独立反查时该扫描曾抓到 32 个缺名包（缩写引用与整组漏节），已全部补齐；此后新增包只要落一个组行即保持零缺失。但它是 **basename 级**匹配、有假阴性：包名（如 `acp`、`client`、`protocol`、`server`）在本页其他行出现即漏报——0010 轮实证 sdk/、acp/ 两组曾借此整组漏节（4 包零落点），复核时必须辅以「按 `##` 节清点组数与每组包数」的分组核对，不能只信本命令的零输出。
