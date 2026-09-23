# Answer 14 · DSH 有 hooks，而且有两层：原生拦截扩展点 + Claude Code/Codex 兼容桥

## 一句话答案

**有。** DSH 的 hooks 机制是两层结构：**原生层**——官方设计立场是「native hooks 不是包」，一个原生 hook 就是订阅规范生命周期事件的普通 Cordis 插件，产品本体是一套强类型的拦截扩展点 API（typed Decision）；**兼容层**——`dsh-hooks-claude-code` 与 `dsh-hooks-codex` 两个 opt-in 桥，把现成的 Claude Code / Codex `hooks.json` **原样**跑在 DSH 会话里（只支持 command 钩子子集：CC 7 个事件、Codex 5 个事件）。桥的存在意义是保住已有的 hooks.json 投资，不是能力上限——「Anything a bridge can do, a plain plugin can do directly — more powerfully」（[interception 扩展点 Note](../../.agents/notes/implemented/feature/2026-06-30-interception-extension-points.md)）。

## 第一节 · 原生层：hooks 的「DSH 形状」

CC/Codex 的 hook 是「配置文件里的 shell 命令」；DSH 的原生 hook 是「插件树上的 TypeScript 监听器」，挂在同一条 tool 执行管道和 loop 边界上（`tools/pre-execute` → guards → `tools/execute` → dispatch → `tools/post-execute` → `finalizeContent` → `tools/result`，见 [tool 执行管道](../../docs/tool-execution-pipeline.md)）。每个点只有一种权力，这是和 CC/Codex 最大的形状差异——权力按阶段分，不靠监听器顺序：

| 扩展点 | 对应 CC/Codex 事件 | 权力 |
|---|---|---|
| `agent/session-start` | `SessionStart` | 纯通知（**不能**阻止启动，刻意留的缺口）；`agent.inject()` 种上下文 |
| `agent/pre-step` | `UserPromptSubmit`（更强：每步都发，不止用户 prompt） | waterfall：`enter` 换入完整消息批 / `reject` 拦下且无 model-visible 消息 |
| `tools/pre-execute` | `PreToolUse` | typed Decision：`allow` / `deny`+reason / `ask`（经 approval seam，fail-closed，仅 `allowed-once` 放行） |
| `ctx.tools.guard()` | 无对应 | deny-only、单调——listening 顺序不能复活被终局不变量禁止的操作 |
| `tools/execute` | 无对应 | around-dispatch 包装（超时/重试/指标），可换可还原 `signal` 但不可删除 |
| `tools/post-execute` | `PostToolUse` | block+feedback / 替换 content 或 canonical value / 附 `additionalContexts` |
| `tools/result` | 无对应（只读终观察者） | 只观察，失败被 contain，改不了结果 |
| `agent/turn-stopping` | `Stop` | 通知；需要续步就 `agent.steer()` 带模型可见理由强制再走一步 |

PreCompact/PostCompact、Notification、Codex `PermissionRequest` 明确在这套决策面之外（interception Note「Boundaries」节）。这套面的合同在 [`docs/subsystems/core.md#interception-decisions`](../../docs/subsystems/core.md#interception-decisions) 与 [interception Note](../../.agents/notes/implemented/feature/2026-06-30-interception-extension-points.md)。

## 第二节 · 兼容层：两个桥

两个桥把外部方言翻译到上面同一批扩展点，共享一个 `dsh-hook-protocol` 引擎，方言差异被压到**一个轴**（matcher 解释模式）加 payload/环境细节。机制级逐条出处已收敛在 [`_digested/capability-seams/08-外部生态桥：MCP与hooks.md`](../../_digested/capability-seams/08-外部生态桥：MCP与hooks.md)，这里只列比较需要的骨架：

- **支持的事件**：CC 臂 7 个（`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop`、`SubagentStart`、`SubagentStop`）；Codex 臂 5 个（无两个 Subagent 事件）（`packages/hooks/hooks-claude-code/src/config.ts:11`、`packages/hooks/hooks-codex/src/config.ts:11`）。
- **决策能力**：CC 臂 `PreToolUse` 支持 `ask`；Codex 臂只有 block——没有 pre-tool approval 或 rewrite 路径，这是刻意保真（「Dialect-shaped, not maximal」）。
- **审计**：每次调用写一对 log-only 的 `hook/invoked` / `hook/result` 会话事件（按 `handlerId` 配对、必须落在打开的 turn 内），进会话日志但**不是 model-visible**——模型只看到决策的效果（[session 事件文档](../../docs/subsystems/session.md)）。
- **合并**：`deny > ask > allow` 最严合并，第一个 `continue:false` 的 stop sticky（`packages/hooks/hook-protocol/src/merge.ts:3`）。
- **默认不挂**：六个 bundle 的 patch 层没有任何一行挂这两个桥，也没有 MCP 那样的动态挂载路径，只能显式 opt-in（digest 08「默认启用还是 opt-in」节）。

## 第三节 · 三家对照

外部两家的读数来自官方文档（检索 2026-09-22，逐条出处见 [research.md](./research.md)）。注意计数漂移：DSH 桥 README 撰写基线是 CC 30 事件、Codex 10 事件；现在官方文档是 **CC 33、Codex 12**（Codex hooks 2026-05 才 GA）。DSH 支持数不变，未支持的从 23/5 变成 26/7。

**配置与发现**

| 轴 | Claude Code | Codex | DSH 桥 | DSH 原生 |
|---|---|---|---|---|
| 声明位置 | settings.json 四层 + plugin/skill/subagent frontmatter，逐层 additive merge | hooks.json / inline TOML 贴着 config 层 + plugin + managed requirements.toml，全量合并 | 单一 `configPath`，进程级，启动读一次 | cordis.yml 插件行 / bundle patch 层 |
| 事件数 | 33 | 12 | 7 / 5 | 8 个拦截点 + 全部 cordis 事件 |
| handler 类型 | command / http / mcp_tool / prompt(LLM judge) / agent | command / mcp_tool | 仅 `{type:'command'}`，其余 parse-and-skip + warn | 无 handler 概念，直接 TypeScript |
| 信任模型 | workspace trust 门 + managed 层 + `disableAllHooks`；**`-p`/SDK 视为已信任** | **逐钩子 hash 信任评审** + managed 不可停 + bypass flag | 无独立信任层（信任随宿主；config 解析失败只 warn，agent 照常启动） | 与插件同信任：挂载即信任，受 Loader/patch 层纪律管 |
| 热更新 | `ConfigChange` 事件、live reload | 评审后生效，`/hooks` 浏览器 | 无（读一次） | 插件 HMR：dispose 旧 fiber 换新实例 |

**执行与控制**

| 轴 | Claude Code | Codex | DSH 桥 | DSH 原生 |
|---|---|---|---|---|
| 并发 | 同事件全部**并行**，同 handler 去重 | 同事件命令钩子并发 | **串行**按 config 顺序（保 `hook/*` 配对相邻；fold 顺序无关所以结果等价） | 同一 waterfall 内按注册序 |
| 超时 | 600s 默认（个别事件 30/10s，SessionEnd 共享 1.5s 预算）；超时的 PreToolUse **不 block** | 600s 默认（SessionEnd/Interrupt 1s/上限 3s） | `defaultTimeoutMs` 600000 | 无进程超时概念 |
| PreToolUse 决策 | allow/deny/ask/defer + `updatedInput` 改写（并行时 last-finisher-wins，非确定） | deny/allow + `updatedInput` 改写 | CC 臂 deny/ask；Codex 臂仅 deny；`updatedInput` 解析但不执行 + warn | allow/deny/ask typed Decision；输入改写是 deferred 设计问题（同一 Note） |
| Stop 语义 | block+reason 成为下一条指令；8 连 block 上限 | block+reason **自动生成续轮 prompt**；`continue:false` 覆盖 | block 经 `steer()` 强制再走一步；**无连 block 上限**——无条件 block 的钩子会无限续步（README 明示） | 同桥；上限留给插件自限 |
| 上下文注入 | plain stdout（部分事件）+ `additionalContext`，10k 字符溢出落盘 | 同形状，~2500 token 溢出 spill + 预览 | JSON `additionalContext`（Codex 臂兼 plain stdout）；以带 source 的 message 注入 | `agent.inject()` / `additionalContexts` FIFO，append-only 不砸 KV 前缀 |
| `continue:false` | 停 Claude 整个 run | 覆盖续轮 / 停 compaction | **只记录不生效**——拦截点没有 run-level halt primitive（两桥各留 `TODO(hook-continue-false)`） | 原生同样没有硬 halt 原语；终止单调性由 tool-result 数据表达 |
| transcript_path | 真实路径（异步写、可能滞后） | `string\|null`，明示不稳定 | **恒空**（CC 臂 `''`，Codex 臂 `null`）：持久化 seam 不暴露 artifact 路径，默认 zstd 的日志钩子脚本读不了 | 不适用 |
| 审计 | transcript 文件 | transcript + hook_outputs spill | `hook/invoked`/`hook/result` 对进会话日志，log-only | 不写 `hook/*`——决策效果直接落在日志的消息/结果里 |

## 第四节 · 桥的刻意取舍（为什么少这么多）

桥 README 的差距清单不是欠账，是「兼容适配器，不是力量工具」的定位结果。刻意的部分：

- **串行而非并行**：让 `hook/invoked`/`hook/result` 对在日志里相邻；最严合并与顺序无关，所以结果与参考引擎的并发语义等价，代价是时延。
- **payload 保形不保真**：Codex 臂坚持 snake_case + `turn_id`/`model`/`permission_mode`，但 model 是配置静态值、permission_mode 恒 `"default"`、`stop_hook_active` 恒 `false`、非 shell 工具塌成 `tool_input:{command}`——方言的形状优先于运行时真值。
- **Codex 臂不做命令替换、不注入插件环境**：保 Codex 方言；CC 臂才做 `${CLAUDE_PLUGIN_ROOT}` 替换。
- **`updatedInput` 不执行**：改写牵动 history/audit/presentation 一致性，归 [pre-tool-input-rewrite 提案](../../.agents/notes/proposed/feature/2026-06-30-pre-tool-input-rewrite.md)，协议层解析但只 log+warn。

被点名的已知缺口（桥 README「Known Limitations」）：`SessionStart` detached 跑、上下文可能错过首个请求且无 `hook/*` 记录（turn 包围不变量）；`continue:false` 只审计；Stop 无环护栏。

## 第五节 · 什么场景选哪条

| 场景 | 选择 |
|---|---|
| 手里已有 CC/Codex `hooks.json`，想原样复用 | **桥**。先对一遍 README 差距表（尤其：只 command 钩子、串行、`continue:false` 不生效、Stop 自限） |
| 新的拦截/注入需求 | **原生插件**。全 `ctx`、typed 返回、无序列化边界；需要 guard 不变量就 `ctx.tools.guard()`，需要审批就接 approval seam |
| 需要 CC 的 `prompt`/`agent` handler（LLM judge）效果 | 原生插件里自己调模型——这类 handler 桥永远不跑 |
| 想改 loop 级行为 | 仍然是插件：新行为走文档化扩展点，「Plugins, not loop changes」是仓库级约定 |

反过来对 CC/Codex 说一句：DSH 原生扩展点里 `ctx.tools.guard()`（单调 deny）、`tools/execute` 包装、`tools/result` 终观察者在两家的 hook 表里都没有直接对应物；而 CC 的 `prompt` handler 与 Codex 的逐钩子信任评审是 DSH 两层都没有的。三家真正的共同点只有骨架：**event → matcher → handlers，stdin JSON，exit 2 block**——Codex 是刻意抄 CC 的形状，DSH 的桥是刻意喂这个形状。

## 出处

- DSH 机制：[digest 08 外部生态桥](../../_digested/capability-seams/08-外部生态桥：MCP与hooks.md)（逐条源码行号在那里）；[packages/hooks/README.md](../../packages/hooks/README.md)、[hook-protocol README](../../packages/hooks/hook-protocol/README.md)、[hooks-claude-code README](../../packages/hooks/hooks-claude-code/README.md)、[hooks-codex README](../../packages/hooks/hooks-codex/README.md)；[interception Note](../../.agents/notes/implemented/feature/2026-06-30-interception-extension-points.md)。
- 外部：[research.md](./research.md)（CC `code.claude.com/docs/en/hooks`；Codex `learn.chatgpt.com/docs/hooks` 等，检索 2026-09-22）。
