# 03 · 五张横切清单：按「要什么」查

基线 `dsh-v0.2.1-rc.2`（快照式清单，重测义务见 [`_coverage/`](../_coverage/00-index.md)）。[`02-plugin-catalog.md`](./02-plugin-catalog.md) 按包组纵着看，本页按能力类型横着看。

## 3.1 ctx 服务清单 — 99 = 58 core + 35 seam + 5 service + 1 bundle

真源是生成目录 [`docs/capability-seams.md`](../../docs/capability-seams.md):612-712 的表格（角色列可用 awk 复核 58/35/5/1）。

**非 seam 的 6 条（core/service/bundle 概览）：**

| 服务 | role | 说明 |
|---|---|---|
| `ctx.agentLoop` | bundle | 唯一具体循环 |
| `ctx.cotTranslation` / `ctx.translator` | service ×2 | 推理翻译的会话侧服务与匿名翻译端点 |
| `ctx.productAnalytics` / `ctx.otel` / `ctx.productTelemetry` | service ×3 | 桌面分析 / OTLP 遥测 / 产品遥测 |
| 其余 58 条 | core | 主干服务，逐行见生成表 |

**35 条 seam 全景（P＝实现包数，C＝直接消费包数，按生成表逗号切分；P 升序、C 降序）：**

| seam | P | C | owner | 备注 |
|---|---|---|---|---|
| `ctx.approval` | 0 | 3 | interaction/user-approval | **零 Provider**：回答器走 waterfall（缺口清单） |
| `ctx.userQuestions` | 0 | 1 | interaction/user-questions | **零 Provider**：回答端在 Web 侧 |
| `ctx.authorization` | 0 | 1 | credentials/authorization | **零 Provider**：凭据获取流（缺口清单） |
| `ctx.sessionPersistence` | 1 | 7 | session/session-persistence | 单 Provider（JSONL），7 个消费方 |
| `ctx.workingDirectory` | 1 | 6 | session/working-directory | 0.2.1 线新增：单 Session 执行目录投影 |
| `ctx.jobs` | 1 | 5 | jobs/jobs | 单 Provider，消费集中在 job 工具与 job Remote |
| `ctx.attachments` | 1 | 4 | attachment/attachment | 单 Provider |
| `ctx.credentials` | 1 | 3 | credentials/credentials | env-over-.env |
| `ctx.deepseekAccount` | 1 | 2 | credentials/deepseek-account | 账号登录态 |
| `ctx.sessionQuery` | 1 | 2 | session-query/session-query | 单后端（sqlite） |
| `ctx.workflowEngine` | 1 | 2 | workflow/workflow | worker-thread 单引擎 |
| `ctx.worktrees` | 1 | 1 | experimental/worktree | 0.2.1 线新增：Provider 与 Consumer 同族、显式实验组合 |
| `ctx.mcpResources` | 1 | 1 | mcp/mcp-resources | 自消费（P 与 C 同包） |
| `ctx.fileReferences` | 1 | 1 | context/file-reference | 自消费 |
| `ctx.compaction` | 1 | 1 | compaction/compaction | 自消费 |
| `ctx.terminals` | 1 | 1 | terminal/terminal | 单后端（bash PTY） |
| `ctx.lsp` | 1 | 1 | lsp/lsp | 单后端（stdio） |
| `ctx.speechToText` | 1 | 1 | experimental/speech-to-text | 唯一实现是实验性 SenseVoice |
| `ctx.spillStore` | 1 | 1 | spill/spill | 单后端（local） |
| `ctx.sessionTelemetry` | 1 | 0 | session/session-telemetry | 输出离进程（otel） |
| `ctx.subprocess` | 2 | 7 | subprocess/subprocess＋ssh/subprocess-ssh | local＋ssh 双实现 |
| `ctx.computerUse` | 2 | 2 | computer-use/computer-use | 实现全在 experimental |
| `ctx.sandbox` | 2 | 2 | sandbox/sandbox | bwrap / Landlock / Seatbelt |
| `ctx.ptcRuntime` | 2 | 2 | ptc-runtime/ptc-runtime | node ＋ python 双后端 |
| `ctx.deepseekLlmApiExtensions` | 2 | 1 | llm/deepseek-llm-api-extensions | 官方 API 附加字段注册 |
| `ctx.storage` | 2 | 1 | storage/storage | json（出厂）/ sqlite |
| `ctx.directoryPicker` | 2 | 1 | host/directory-picker | native / browse |
| `ctx.sessionTitle` | 2 | 0 | session/session-title | first-prompt / all-prompts 两个 Provider |
| `ctx.shell` | 3 | 4 | shell/shell | bash / pwsh × local / sandbox |
| `ctx.browserUse` | 3 | 3 | browser-use/browser-use | 实现全在 experimental |
| `ctx.llm` | 3 | 2 | llm/llm | deepseek ＋ 休眠 pi-ai ＋ replay |
| `ctx.fs` | 3 | 1 | fs/fs | local / sandbox / ssh |
| `ctx.skills` | 4 | 1 | skill/skill | filesystem / office / badge / windows-acl |
| `ctx.web` | 5 | 1 | web/web | deepseek / http / exa / perplexity / deepseek-api |
| `ctx.subagents` | 6 | 3 | subagent/subagent | in-process×2 / acp / codex / claude-code / dsh-sdk |

P≥2 的 seam 换 Provider 不改调用方；P=0 与自消费（P、C 同包）是成熟度警戒信号——完整信号分析见 [`_faq_on_digested/08`](../../_faq_on_digested/08_plugin-seam-maturity/answer.md)。可替换率 15/35 = 42.9%（上一轮 0009 复核为 15/33）。

## 3.2 模型可见工具 — 每个 profile 实际暴露什么

33 个工具包的模型可见名以生成目录 [`docs/tool-catalog.md`](../../docs/tool-catalog.md):18-50 的 Tool Package Map 为真源；下表按 bundle patch 行推每 profile 的实际暴露。

| profile | 暴露 |
|---|---|
| **base**（headless / acp-app / sdk-app 原样继承） | `bash`/`pwsh` 平台门控（base:281-287）；`job_output/job_list/job_kill`（289-290）；`edit/read/read_image/write`（295-296）；`glob/grep`（298-299）；`skill`（314-315）；`working_directory`（169-170）；`todo_write`（437-438）；`create_goal/get_goal/update_goal`（444-445）；`subagent`＋`subagent_fork`＋`send_message/interrupt_agent/list_agents`（374-392）；`workflow`（405-406）；`web_search/web_fetch`（486-487）；MCP 资源 3 工具（492-493）。出厂关闭：`plugin_manager`（16-18）。**base 不产生 `run_code`**：`tools` 的 `mode` 默认 `native`，只有声明 `agent-tool-presentation mode: ptc` 的 preset 才把能力收进它 |
| **web-app** | Host 面把上述 agent 工具行整体 disabled（web-app:477-581），改由每会话 preset 提供；preset 注册表 default=standard（586-589） |
| **web 预设 standard（出厂默认）** | base 全集＋`ask_user_question`＋`present`＋`exit_plan_mode`＋`schedule_create/list/update/delete`；`plugin_manager` 与 `plugin_market` 行 disabled |
| **web 预设 ptc** | 同 standard，但 `agent-tool-presentation mode: ptc` 把能力收进 `run_code` 绑定；`workflow` 关 |
| **web 预设 minimal** | persona `complete: true`；`tool-fs` 收成只读 `read_image`；持久 `bash`/`pwsh`；compaction＋`/compact`；无 goal / web / subagent / skill / schedule |
| **web 预设 cordis（creator）** | standard＋`cordis_inspect_list/query`＋`plugin_manager`、`plugin_market` 启用（`profileContext` 门控）＋creator skills 目录 |
| **sdk-app** | base 全集＋`load_workspace_dependencies` 与 office skill（DSH_PRIMARY_RUNTIME 门控，sdk-app:30-41） |
| **sdk-minimal** | 只读 `read_image`（44-50）＋`working_directory`（55-56）＋MCP 资源 3 工具（123-124）＋持久 `bash`/`pwsh`（140-166）＋compaction；无 goal / web / subagent / skill，也不产生 `run_code`（未挂 `agent-tool-presentation`） |

## 3.3 bundle 清单

| bundle | 说明 |
|---|---|
| `dsh-base` | 共享核心 patch 层，五个 launcher profile 里四个都叠它 |
| `dsh-web-app` | 浏览器层＋`presets/` 四文件（insert 行明细见 [`runtime-profiles/01`](../runtime-profiles/01-web.md)） |
| `dsh-headless` | 一次性任务层，无 Host/HTTP/Web |
| `dsh-acp-app` | ACP stdio 层 |
| `dsh-sdk-app` | SDK stdio 层 |
| `dsh-sdk-minimal` | 独立全树（不叠 base） |
| OPTIONAL_BUNDLES ×12 | session-search、ralph-bundle、terminal-bundle、badge-skill-bundle、session-titles-bundle、agent-team-profile、voice-input-bundle、cot-translation-bundle、auto-review、inspector-profile、plugin-market-bundle、tool-worktree（profile.ts:223-236；Web 插件页一键开关） |
| 官方按需安装 ×2 | `dsh-subagent-claude-code`、`dsh-subagent-codex`（`ON_DEMAND_BUNDLES`，`packages/boot/app-boot/src/official-bundle-packages.ts`）——与 OPTIONAL_BUNDLES 是两个档位：按需安装 vs 随装默认关 |
| 显式安装 | 裸 `inspector` 插件包不在 OPTIONAL_BUNDLES 里（`scripts/optional-bundles.spec.ts:100-102`）；出货的那个 bundle 是 `inspector-profile` |

profile→bundle 组装：acp=[base,acp-app]、web=[base,web-app]、headless=[base,headless]、sdk=[base,sdk-app]、sdk-minimal=[sdk-minimal]（profile.ts:179-193）；打包安装特有的 headless 变体 [base, web-app, headless]（:196-198）；`dsh plugin add` 初始化缺省 [base]（:213）。退役 bundle 记在 `RETIRED_BUNDLES`（现只有 `dsh-experimental-schedule-bundle`，其 schedule/ui-schedule 行已由 web-app 承担）。

## 3.4 preset 清单（四模式）

| preset | 自动的轴 |
|---|---|
| standard（1，出厂默认，web-app:589） | 全工具带＋workflows（workflow-ptc / tool-workflow 开）＋原生工具呈现 |
| ptc（2） | **呈现轴**：`mode: ptc` → 能力收进 `run_code`；workflow 关 |
| minimal（3） | **persona 轴**（`complete: true`＋`includeRuntimeContext: false`）＋**shell 轴**（持久 PTY bash/pwsh 替代一次性工具）＋只读 fs 面 |
| cordis（4） | **creator 轴**：＋`cordis_inspect_*`、`plugin_manager`/`plugin_market` 工具、creator skills 目录（customSkillDirs 指向 dsh-agent-preset/skills） |

四模式逐行实差的机制解剖在 [`_faq_on_digested/16`](../../_faq_on_digested/16_preset-modes-specialty/answer.md)。

## 3.5 skills 清单（19 个）

`.agents/skills/*/SKILL.md` 经 skill-filesystem 的项目根发现加载：

| skill | 用途一句话 |
|---|---|
| agent-experience | 模型可见工具定义与上下文加载的信息可发现性设计 |
| cordis-styling-nitpicking | Cordis 插件的单例状态、未撤销副作用与清理依赖审查 |
| dsh-archive-agent-notes | Agent Notes 的增删归档审查 |
| dsh-ci-test-reliability | 测试/夹具的 CI 非确定性设计与诊断 |
| dsh-client-ui-ux | client 包 GUI 变更的设计与评审 |
| dsh-code-review | 本仓库 PR 评审定向 |
| dsh-create-upgrade-guide | 破坏性面变更的升级指南撰写 |
| dsh-doc | 文档/README/网站创建审计迁移 |
| dsh-error-handling | 失败、恢复、重试、后台任务与用户可见错误报告的写法 |
| dsh-find-simplifications | 证据支撑的简化提案 |
| dsh-merging-stacked-prs | 依赖 PR stack 的官方落地 |
| dsh-official-plugin-artwork | 官方（含实验）插件图标与功能预览图 |
| dsh-pre-push-checks | push 前最小检查集合选择 |
| dsh-prose-standard | 仓库散文写作/评审/修剪标准 |
| dsh-responsive-ui | 响应式 client 布局、截断、悬停与焦点行为 |
| dsh-speed-up-perf | 性能调查与基准 |
| dsh-translate-docs | 双语文档工作流（用户显式调用） |
| dsh-trim-cot-leakage | 推理残留式散文清理 |
| record-browser-gif | GUI PR 的 GIF 证据录制 |

creator 预设经 customSkillDirs 追加 dsh-agent-preset/skills 的 4 个 skill；skill-office 的 3 个 Office skill 与 sandbox-windows-acl 的 1 个诊断 skill 是资产形态（各包 assets/）。
