# 03 · 五张横切清单：按「要什么」查

基线 `dsh-v0.2.0-rc.2`（快照式清单，重测义务见 [`_coverage/`](../_coverage/00-index.md)）。[`02-plugin-catalog.md`](./02-plugin-catalog.md) 按包组纵着看，本页按能力类型横着看。

## 3.1 ctx 服务清单 — 92 = 55 core + 33 seam + 3 service + 1 bundle

真源是生成目录 [`docs/capability-seams.md`](../../docs/capability-seams.md):580-671 的表格（角色列可用 awk 复核 55/33/3/1）。

**非 seam 的 4 条（core/service/bundle 概览）：**

| 服务 | role | 说明 |
|---|---|---|
| `ctx.agentLoop` | bundle | 唯一具体循环 |
| `ctx.productAnalytics` / `ctx.otel` / `ctx.productTelemetry` | service ×3 | 桌面分析 / OTLP 遥测 / 产品遥测 |
| 其余 55 条 | core | 主干服务，逐行见生成表 |

**33 条 seam 全景（P＝实现包数，C＝直接消费包数，按生成表逗号切分；P 升序、C 降序）：**

| seam | P | C | owner | 备注 |
|---|---|---|---|---|
| `ctx.approval` | 0 | 3 | interaction/user-approval | **零 Provider**：回答器走 waterfall（缺口清单） |
| `ctx.userQuestions` | 0 | 1 | interaction/user-questions | **零 Provider**：回答端在 Web 侧 |
| `ctx.authorization` | 0 | 1 | credentials/authorization | **零 Provider**：凭据获取流（缺口清单） |
| `ctx.sessionPersistence` | 1 | 7 | session/session-persistence | 单 Provider（JSONL），7 个消费方 |
| `ctx.subprocess` | 1 | 7 | subprocess/subprocess | 本地单实现（远端走 ssh 组另接） |
| `ctx.jobs` | 1 | 6 | jobs/jobs | 单 Provider，消费集中在 job 工具 |
| `ctx.attachments` | 1 | 4 | attachment/attachment | 单 Provider |
| `ctx.credentials` | 1 | 3 | credentials/credentials | env-over-.env |
| `ctx.deepseekAccount` | 1 | 2 | credentials/deepseek-account | 账号登录态 |
| `ctx.sessionQuery` | 1 | 2 | session-query/session-query | 单后端（sqlite） |
| `ctx.workflowEngine` | 1 | 2 | workflow/workflow | worker-thread 单引擎 |
| `ctx.fileReferences` | 1 | 1 | context/file-reference | 自消费（P 与 C 同包） |
| `ctx.compaction` | 1 | 1 | compaction/compaction | 自消费 |
| `ctx.terminals` | 1 | 1 | terminal/terminal | 单后端（bash PTY） |
| `ctx.lsp` | 1 | 1 | lsp/lsp | 单后端（stdio） |
| `ctx.mcpResources` | 1 | 1 | mcp/mcp-resources | 单 Provider |
| `ctx.speechToText` | 1 | 1 | experimental/speech-to-text | 唯一实现是实验性 SenseVoice |
| `ctx.spillStore` | 1 | 1 | spill/spill | 单后端（local） |
| `ctx.sessionTelemetry` | 1 | 0 | session/session-telemetry | 输出离进程（otel） |
| `ctx.sandbox` | 2 | 2 | sandbox/sandbox | bwrap / Landlock / Seatbelt |
| `ctx.computerUse` | 2 | 2 | computer-use/computer-use | 实现全在 experimental |
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
| `ctx.web` | 4 | 1 | web/web | deepseek / http / exa / perplexity |
| `ctx.subagents` | 6 | 3 | subagent/subagent | in-process×2 / acp / codex / claude-code / dsh-sdk |

P≥2 的 seam 换 Provider 不改调用方；P=0 与自消费（P、C 同包）是成熟度警戒信号——完整信号分析见 [`_faq_on_digested/08`](../../_faq_on_digested/08_plugin-seam-maturity/answer.md)。

## 3.2 模型可见工具 — 每个 profile 实际暴露什么

30 个工具包的模型可见名以生成目录 [`docs/tool-catalog.md`](../../docs/tool-catalog.md):16-47 的 Tool Package Map 为真源；下表按 bundle patch 行推每 profile 的实际暴露。

| profile | 暴露 |
|---|---|
| **base**（headless / acp-app / sdk-app 原样继承） | `run_code`（base:499-500）；`bash`/`pwsh` 平台门控（267-273）；`job_output/job_list/job_kill`（275-276）；`edit/read/read_image/write`（281-282）；`glob/grep`（284-287）；`skill`（304-305）；`todo_write`（430-433）；`create_goal/get_goal/update_goal`（437-438）；`subagent`＋`subagent_fork`＋`send_message/interrupt_agent/list_agents`（364-388）；`workflow`（398-399）；`web_search/web_fetch`（486-490）；MCP 资源 3 工具（492-493）。出厂关闭：`ralph`（447-452）、`plugin_manager`（16-18） |
| **web-app** | Host 面把上述 agent 工具行整体 disabled（web-app:447-556），改由每会话 preset 提供；preset 注册表 default=standard（561-565） |
| **web 预设 standard（出厂默认）** | base 全集＋`ask_user_question`＋`present`＋`exit_plan_mode`；codex / claude_code / ralph 行 disabled |
| **web 预设 ptc** | 同 standard，但 `agent-tool-presentation mode: ptc` 把能力收进 `run_code` 绑定；workflow / ralph 关 |
| **web 预设 minimal** | 仅持久 `bash`/`pwsh`；无 fs / web / subagent / skill |
| **web 预设 cordis（creator）** | standard＋`cordis_inspect_list/query`＋`plugin_manager` 启用＋creator skills 目录 |
| **sdk-app** | base 全集＋`load_workspace_dependencies` 与 office skill（DSH_PRIMARY_RUNTIME 门控，sdk-app:29-41） |
| **sdk-minimal** | `run_code`（91-92）＋持久 `bash`/`pwsh`（126-152）＋MCP 资源 3 工具（94-95）；无 fs / web / subagent / skill |

## 3.3 bundle 清单

| bundle | 说明 |
|---|---|
| `dsh-base` | 共享核心 patch 层，五个 launcher profile 里四个都叠它 |
| `dsh-web-app` | 浏览器层＋`presets/` 四文件（85 条 insert 行明细见 [`runtime-profiles/01`](../runtime-profiles/01-web.md)） |
| `dsh-headless` | 一次性任务层，无 Host/HTTP/Web |
| `dsh-acp-app` | ACP stdio 层 |
| `dsh-sdk-app` | SDK stdio 层 |
| `dsh-sdk-minimal` | 独立全树（不叠 base） |
| OPTIONAL_BUNDLES ×4 | `dsh-experimental-agent-team-profile`、`dsh-experimental-voice-input-bundle`、`dsh-experimental-auto-review`、`dsh-experimental-schedule-bundle`（profile.ts:213-218；Web 插件页一键开关） |
| inspector | 实验调试面，显式安装、**不进** OPTIONAL_BUNDLES（scripts/optional-bundles.spec.ts:38） |

profile→bundle 组装：acp=[base,acp-app]、web=[base,web-app]、headless=[base,headless]、sdk=[base,sdk-app]、sdk-minimal=[sdk-minimal]（profile.ts:179-195）；打包安装特有的 headless 变体 [base, web-app, headless]（:198-200）；`dsh plugin add` 初始化缺省 [base]（:202-203）。

## 3.4 preset 清单（四模式）

| preset | 自动的轴 |
|---|---|
| standard（1，出厂默认，web-app:565） | 全工具带＋workflows（workflow-ptc / tool-workflow 开、ralph 关）＋原生工具呈现 |
| ptc（2） | **呈现轴**：`mode: ptc` → 能力收进 `run_code`；workflow / ralph 关 |
| minimal（3） | **persona 轴**（`complete: true`＋`includeRuntimeContext: false`）＋**shell 轴**（持久 PTY bash/pwsh 替代一次性工具） |
| cordis（4） | **creator 轴**：＋`cordis_inspect_*`、`plugin_manager` 工具、creator skills 目录（customSkillDirs 指向 dsh-agent-preset/skills） |

四模式逐行实差的机制解剖在 [`_faq_on_digested/16`](../../_faq_on_digested/16_preset-modes-specialty/answer.md)。

## 3.5 skills 清单（15 个）

`.agents/skills/*/SKILL.md` 经 skill-filesystem 的项目根发现加载：

| skill | 用途一句话 |
|---|---|
| agent-experience | 模型可见工具定义与上下文加载的信息可发现性设计 |
| dsh-archive-agent-notes | Agent Notes 的增删归档审查 |
| dsh-ci-test-reliability | 测试/夹具的 CI 非确定性设计与诊断 |
| dsh-client-ui-ux | client 包 GUI 变更的设计与评审 |
| dsh-code-review | 本仓库 PR 评审定向 |
| dsh-create-upgrade-guide | 破坏性面变更的升级指南撰写 |
| dsh-doc | 文档/README/网站创建审计迁移 |
| dsh-find-simplifications | 证据支撑的简化提案 |
| dsh-merging-stacked-prs | 依赖 PR stack 的官方落地 |
| dsh-pre-push-checks | push 前最小检查集合选择 |
| dsh-prose-standard | 仓库散文写作/评审/修剪标准 |
| dsh-speed-up-perf | 性能调查与基准 |
| dsh-translate-docs | 双语文档工作流（用户显式调用） |
| dsh-trim-cot-leakage | 推理残留式散文清理 |
| record-browser-gif | GUI PR 的 GIF 证据录制 |

creator 预设经 customSkillDirs 追加 dsh-agent-preset/skills 的 4 个 skill；skill-office 的 3 个 Office skill 与 sandbox-windows-acl 的 1 个诊断 skill 是资产形态（各包 assets/）。
