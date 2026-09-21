# 外部生态桥：MCP 与 hooks

本页记录产品里两条**外部生态桥**：MCP client（把外部 Model Context Protocol server 的 tools 注入 `ctx.tools`）与 Claude Code / Codex hook 桥（把外部 shell hook 方言翻译到已有的拦截扩展点，外加一层共享的 wire-protocol 库）。核验入口：`packages/mcp/`、`packages/hooks/`；本专题此前只在 egress 清单、ACP 的 `mcpServers` 和 FAQ 里顺带提到它们，没有机制级记录。相关决策记录：[`2026-07-07-mcp-client-plugin.md`](../../.agents/notes/implemented/feature/2026-07-07-mcp-client-plugin.md) 与 [`2026-06-30-interception-extension-points.md`](../../.agents/notes/implemented/feature/2026-06-30-interception-extension-points.md)。

## 一句话

两条桥都只做「翻译 + 注册」，不改 loop：MCP client 把外部 server 的 tools 以 `mcp__<serverName>__<rawName>` 注册进 `ctx.tools`，只桥 tools、不桥 resources/prompts；hook 桥把 Claude Code 与 Codex 的 command hook 映射到已有的拦截扩展点，并额外写一对 **log-only** 的 `hook/invoked` / `hook/result` 会话事件。两者都默认不启用、都没有 bundle patch 行直接挂载（MCP 另有一条经 ACP 按会话声明动态挂载的路径，见下）。

## MCP：把外部 server 的 tools 注入 `ctx.tools`

包定位与命名由 `mcp-client` 自己拥有：它是 namespace plugin（named exports、无 default export），模块 JSDoc 写「每个 plugin 实例连一个 MCP server；多个 server 就在 `cordis.yml` 里加载多个实例」（`packages/mcp/mcp-client/src/index.ts:3`）。模型看到的公开名是 `mcp__<serverName>__<rawName>`（`packages/mcp/mcp-client/src/index.ts:4`）；`serverName` 是本地配置而不是远端 `serverInfo.name`，必须匹配 `[A-Za-z0-9_-]{1,32}`（`packages/mcp/mcp-client/src/index.ts:38`、`packages/mcp/mcp-client/src/index.ts:55`）。公开名是 `(serverName, rawName)` 的纯函数：干净情形逐字用 `mcp__<serverName>__<rawName>`，一旦字符替换或截断到 DeepSeek function-name 契约（64 字符、`[A-Za-z0-9_-]`）改变了名字，就追加 12 位 SHA-256 哈希，使不同 MCP 身份不会塌成同一个公开名（`packages/mcp/mcp-client/src/tools.ts:112`-`:117`）。

注入走 effect 作用域：插件声明 `inject = ['tools']`（`packages/mcp/mcp-client/src/index.ts:32`）；一次 sync 分「先抓完整下一代 `ToolDefinition`、再 dispose 上一代并注册新代」两阶段（`packages/mcp/mcp-client/src/tools.ts:123`），真正落点是 `ctx.tools.register`（`packages/mcp/mcp-client/src/tools.ts:191`）。`serverName` 命名空间预留与连接实例都包在 `ctx.effect()` 里（`packages/mcp/mcp-client/src/index.ts:154`、`packages/mcp/mcp-client/src/index.ts:175`）；dispose 的合同是「停重连、关 live client、等在途 attempt 与排队 sync 静默，然后注销该 server 仍持有的每个 tool」（`packages/mcp/mcp-client/src/connection.ts:107`-`:111`）。

HMR 是同一套 effect 语义的直接结果：模块 JSDoc 写 disposal 会断连、注销 tools、释放 `serverName` 命名空间，HMR 通过 dispose 旧实例、建新实例热替换，相同 `serverName` 复现相同的公开 tool 名（`packages/mcp/mcp-client/src/index.ts:7`-`:11`）。README 从用户角度复述同一事实：编辑配置项会就地重载 server 连接，未变的名字保持不变（`packages/mcp/mcp-client/README.md:92`）。

两种 transport 由 config 的判别联合选择：`transport: 'stdio'` 或 `transport: 'streamable-http'`（`packages/mcp/mcp-client/src/index.ts:113`）；stdio 臂构造 SDK 的 `StdioClientTransport`（`packages/mcp/mcp-client/src/transport.ts:34`），HTTP 臂构造 `StreamableHTTPClientTransport`（`packages/mcp/mcp-client/src/transport.ts:45`）。

stdio 子进程环境是「共享 scrub 定义、不共享 spawn 路径」：子环境以 subprocess seam 的 `scrubbedParentEnv()` 为底，再叠加配置里的 `env`（`packages/mcp/mcp-client/src/transport.ts:21`-`:23`）；README 说明被清掉的是匹配 `/KEY|PASSWORD|SECRET|TOKEN/i` 的环境名与 `DSH_*` 名，显式覆盖能存活，而真正的 spawn 由 MCP SDK 拥有（`packages/mcp/mcp-client/README.md:134`）。

启动与恢复由 owner 文档明确规定：`apply` 会等初始连接与首次 tool 发现完成，`outcome.error !== undefined && config.failOnStartupError` 时抛错让 Cordis 回滚该 fiber，否则只记日志并进入重连循环（`packages/mcp/mcp-client/src/index.ts:184`-`:187`）；`failOnStartupError` 默认 `false`（`packages/mcp/mcp-client/src/index.ts:122`）。reconnect 默认启用，`initialDelayMs` 500、`maxDelayMs` 30 000、`maxAttempts` 10（`packages/mcp/mcp-client/src/connection.ts:40`-`:45`），预算耗尽后 unregister 该 server 的 tools（`packages/mcp/mcp-client/src/connection.ts:12`-`:13`）。README 点明触发面：重连由 transport close 触发，崩溃的 stdio 子进程会触发它，而不可达的 Streamable HTTP server 是逐请求重试、不被 supervisor 重启（`packages/mcp/mcp-client/README.md:193`）。同步失败也不撕裂可见工具集：fetch 阶段失败保留上一代，注册冲突回滚整代（`packages/mcp/mcp-client/README.md:126`）。

桥的边界是 **tools only**：Resources 与 Prompts 没有 harness 消费者机制，被明确推迟（`packages/mcp/mcp-client/README.md:191`）；group README 用同一句话收尾——只桥 Tools 能力，且「nothing ships enabled, so you opt in per server」（`packages/mcp/README.md:12`）。外部依赖只有 MCP SDK 这一项产品依赖：`@modelcontextprotocol/sdk` `^1.12.0`（`packages/mcp/mcp-client/package.json:39`）。

## hooks：两条外部方言，一条共享 wire protocol

分组结构清楚：`hook-protocol` 是共享 hook 引擎（library，永不直接配置），`hooks-claude-code` 与 `hooks-codex` 是两个 plugin（`packages/hooks/README.md:27`-`:29`）。以下事实按 owner 归属分别引用。

支持点数量：Claude Code 桥支持 7 个 hook point——`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop`、`SubagentStart`、`SubagentStop`（`packages/hooks/hooks-claude-code/src/config.ts:11`-`:19`），其 README 记 CC 当前 30 个事件中有 23 个不支持（`packages/hooks/hooks-claude-code/README.md:174`）；Codex 桥支持 5 个——`PreToolUse`、`PostToolUse`、`SessionStart`、`UserPromptSubmit`、`Stop`（`packages/hooks/hooks-codex/src/config.ts:11`），README 记 Codex 当前 10 个事件中有 5 个不支持（`packages/hooks/hooks-codex/README.md:170`）。两桥都只跑 `{ type: 'command', command, timeout? }` 形状，其他 handler 类型 parse-and-skip 并 warn（`packages/hooks/hook-protocol/README.md:12`）。

wire 差异被压到一个轴：matcher mode。`claude-code` 模式对纯 `[A-Za-z0-9_|]+` 的模式用 literal（管道是精确交替），否则用 regex；`codex` 永远是 unanchored regex（`packages/hooks/hook-protocol/src/types.ts:73`-`:79`），调用点分别在 `packages/hooks/hooks-claude-code/src/index.ts:152` 与 `packages/hooks/hooks-codex/src/index.ts:130`。stdin 写法不同：CC 带尾换行（`packages/hooks/hooks-claude-code/src/index.ts:168`），Codex 不带（`packages/hooks/hooks-codex/src/index.ts:145`）。环境与替换不同：CC 用 `CLAUDE_PROJECT_DIR` 与 `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PROJECT_DIR}` 替换（`packages/hooks/hooks-claude-code/src/index.ts:150`、`packages/hooks/hooks-claude-code/src/config.ts:57`），Codex 不做命令替换、不注入插件环境（`packages/hooks/hooks-codex/README.md:87`）。payload 形状不同：CC 的 base 是 `session_id`/`transcript_path`/`cwd`/`hook_event_name` 加 per-event 字段（`packages/hooks/hooks-claude-code/src/index.ts:320`-`:329`），Codex 是 snake_case 并给每个事件带 `model` 与 `permission_mode: "default"`（`packages/hooks/hooks-codex/src/index.ts:290`-`:301`）。两者都把 `transcript_path` 留空（CC 是 `''`，Codex 是 `null`），理由是持久化 seam 不暴露 artifact 路径、默认 zstd 的 session log 对 hook 脚本不可读（`packages/hooks/hooks-claude-code/src/index.ts:325`、`packages/hooks/hooks-codex/src/index.ts:295`）。

决策能力也不同：CC 的 `PreToolUse` 支持 `ask`（`packages/hooks/hooks-claude-code/src/index.ts:241`），Codex 只认 block，没有 pre-tool approval 或 rewrite 路径（`packages/hooks/hooks-codex/src/index.ts:223`、`packages/hooks/hooks-codex/README.md:173`）。协议层解析 `updatedInput` 但不遵守，bridge 只 log + warn（`packages/hooks/hook-protocol/src/types.ts:131`-`:136`）。

共享的合并语义在 `merge.ts`：权限优先级 `deny > ask > allow`（`packages/hooks/hook-protocol/src/merge.ts:3`-`:4`），`rank()` 把 `deny`/`block` 记为 3、`ask` 为 2、`approve`/`allow` 为 1（`packages/hooks/hook-protocol/src/merge.ts:35`-`:42`）；第一个 `continue: false` 的 stop 是 sticky（`packages/hooks/hook-protocol/src/merge.ts:79`-`:82`），胜出等级的理由用 `\n\n` 连接（`packages/hooks/hook-protocol/src/merge.ts:91`-`:95`）。

## 事件：log-only，但进入会话日志

库里 `appendHookInvoked` / `appendHookResult` 写一对 `hook/invoked` / `hook/result`（`packages/hooks/hook-protocol/src/events.ts:75`、`packages/hooks/hook-protocol/src/events.ts:92`）；配对 key 是 `handlerId`，两个 bridge 各自生成 `claude-code:<point>:<n>` 与 `codex:<point>:<n>`（`packages/hooks/hooks-claude-code/src/index.ts:82`、`packages/hooks/hooks-codex/src/index.ts:68`）。`hook/result.decision` 的规则由 `appendHookResult` 拥有：解析出的 decision，否则 `continue:false` 记 `stop`，再否则 `pass`（`packages/hooks/hook-protocol/src/events.ts:99`）。

这两类事件是 **log-only**：declaration merge 的 JSDoc 明确写 `hook/invoked` 是「like `compaction/*`; NOT a `SurfaceEventType`, carries no `surfaceOp`」（`packages/hooks/hook-protocol/src/types.ts:11`-`:13`），而 `SurfaceEventType` 全集只有 `system/message`/`user/message`/`assistant/message`/`tool/result`（`packages/core/session/src/types.ts:412`-`:416`）。因此这对事件**不是 model-visible**：模型看到的只会是决策的效果，而不是审计记录本身。

它们**进入会话日志**：生成的事件词汇表 `KNOWN_SESSION_EVENT_TYPES` 里有 `hook/invoked` 与 `hook/result`（`packages/core/session/src/known-event-types.ts:41`-`:42`），持久化读路径因此认得并保留它们。

turn 作用域由协议与 invariant 双重约束：invocation/result 必须落在一个打开的 turn 内——`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop` 天然满足，`SessionStart` 在第 1 轮之前跑、拿不到 `hook/*` 记录，它的 context 改由注入交付（`packages/hooks/hook-protocol/src/events.ts:4`-`:5`、`packages/hooks/hook-protocol/README.md:69`）；invariant companion 拒绝 open turn 之外的 `hook/*`（`packages/hooks/hook-protocol/src/invariant.ts:37`）、没有配对 invoked 的 result（`packages/hooks/hook-protocol/src/invariant.ts:53`）、未知 dialect（`packages/hooks/hook-protocol/src/invariant.ts:47`）与非法 duration（`packages/hooks/hook-protocol/src/invariant.ts:56`）。

模型能看到的决策效果由 bridge README 逐条固定：provider 给的理由原样透传；没有时 denied tool 变成 `Error: blocked by PreToolUse hook`，post-tool block 的 feedback 恰为 `blocked by PostToolUse hook`，blocking stop 追加 `continue: blocked by Stop hook`；被 block 的 prompt 直接丢弃、结束为 `blocked`、没有 model-visible 消息（`packages/hooks/hooks-claude-code/README.md:157`）。context 类 hook 的效果是注入一条带 source 的 message（`packages/hooks/hooks-claude-code/README.md:143`）。

`continue: false` 只有审计效果：folded 的 `stop` 会被记录，但拦截点没有 run-level halt primitive（`packages/hooks/hook-protocol/README.md:128`），两个 bridge 里各留一条 `TODO(hook-continue-false)`（`packages/hooks/hooks-claude-code/src/index.ts:188`、`packages/hooks/hooks-codex/src/index.ts:171`）。CC README 把同一缺口列进 Known Limitations（`packages/hooks/hooks-claude-code/README.md:181`）。

## hook 决策如何进入 tool 管道

拦截点在 `ctx.tools` 的注册表里，不在 hook 包。每个 tool call 的固定序列是 `tools/pre-execute` → 单调 guards → `tools/execute` → dispatch → `tools/post-execute` → 定义拥有的 `finalizeContent` → `tools/result`（`docs/tool-execution-pipeline.md:6`）；生成图把 hooks 画在 `tools/pre-execute` 瀑布里（`docs/tool-execution-pipeline.md:13`），并把 `hook/invoked`/`hook/result` 列进 tool-owned session events 节点（`docs/tool-execution-pipeline.md:20`）。registry 执行的第一个 waterfall 就是 `const gate = await this.ctx.waterfall(carrier, 'tools/pre-execute', exec, …)`（`packages/core/tools/src/index.ts:1465`-`:1466`）。

bridge 直接挂在这个 waterfall 上：CC 的监听器返回 `PreToolDecision`——`deny` 映射成 `{ kind: 'deny', reason }`、`ask` 映射成 `{ kind: 'ask', reason? }`、其余 `next()`（`packages/hooks/hooks-claude-code/src/index.ts:237`-`:243`）；Codex 的监听器只映射 `deny`，否则 `next()`（`packages/hooks/hooks-codex/src/index.ts:224`-`:229`）。`tools/pre-execute` 的语义由决策记录的 bullet 定义：allow/deny/ask 三值，deny 跳过 `tools/execute` 与 core dispatch，ask 经可选 approval seam、只有 `allowed-once` 才继续（`.agents/notes/implemented/feature/2026-06-30-interception-extension-points.md:27`）。

决策落地：`ask` 由 registry 交给 approval seam——`gate.kind === 'ask'` 时 `await this.serviceAsk(exec, gate)`（`packages/core/tools/src/index.ts:1469`-`:1471`），而 `ctx.approval` 是 fail-closed 的、只有 `allowed-once` 才放行（`docs/subsystems/approval.md:5`）。非 allow 的决策取 `decision.reason` 作为 `denialReason`，一旦存在就把结果物化成 `content: [{ type: 'text', text: 'Error: <reason>' }], isError: true`（`packages/core/tools/src/index.ts:1476`-`:1484`），tool body 不被执行。这是 hook 决策到达 tool 管道的**实际落点**：bridge 只产 typed decision，registry 在瀑布之后、guards 之前执行它。

post 侧同构：`tools/post-execute` 的监听器可以把结果 block 成 feedback，或把 `additionalContext` 折进下游 decision（`packages/hooks/hooks-claude-code/src/index.ts:246`-`:264`、`packages/hooks/hooks-codex/src/index.ts:233`-`:252`）。其余三个映射点：`agent/session-start` 注入 context、`agent/pre-step` 可 reject、`agent/turn-stopping` 用 `agent.steer()` 强制再走一步（`packages/hooks/hooks-claude-code/src/index.ts:205`、`packages/hooks/hooks-claude-code/src/index.ts:218`、`packages/hooks/hooks-claude-code/src/index.ts:269`）。`hook/*` 事件刻意不属于拦截扩展点：Service Definition 不声明这些事件，因为它们属于 `dsh-hook-protocol`，native plugin 用 typed decision 时完全不写 hook log（`.agents/notes/implemented/feature/2026-06-30-interception-extension-points.md:50`）。

## 默认启用还是 opt-in

两条桥都**默认不启用**，但要分清「没有 bundle 的 patch 行直接挂它们」与「没有任何出货路径会挂它们」——后者对 MCP 不成立。六个 bundle（`acp-app`/`base`/`headless`/`sdk-app`/`sdk-minimal`/`web-app`）各自的 `cordis.patch.yml` **确实没有任何一行**挂 `@deepseek-ai/dsh-mcp-client`、`@deepseek-ai/dsh-hooks-claude-code` 或 `@deepseek-ai/dsh-hooks-codex`；作为 cordis 挂载行，这些包名只出现在快照 fixture（`snapshots/session/text-turn/cordis.yml:73`、`:78`）与文档示例 overlay（`apps/cli/config/examples/mcp-memory/engram.cordis.yml:5`）里。

**hooks 侧到此为止**：仓库内没有任何动态挂载路径，只能显式 opt-in。**MCP 侧还有第二条路径**：`acp-app` patch 挂的 `@deepseek-ai/dsh-acp` 会按 ACP session 声明的 `mcpServers` 动态挂载 MCP client——`packages/acp/acp/src/session.ts:135`、`:159` 调 `mountAcpMcpServers(agentCtx, options.mcpServers, options.cwd)`，后者在 `packages/acp/acp/src/mcp.ts:32` 对每个声明的 server 执行 `agentCtx.plugin(McpClient, config)`。所以「ACP 客户端主动声明 MCP server」时 MCP 桥是走的；这也解释了该包名为何还出现在 `apps/cli/package.json`、`python/sdk-runtime/package.json`、`packages/acp/acp/package.json` 与 `tsconfig.base.json` 的依赖/引用列表里。owner 文档仍成立：`packages/mcp/README.md:12` 写 "nothing ships enabled, so you opt in per server"，`packages/mcp/mcp-client/README.md:12` 写 "no server is enabled by default"——「没有 server 默认启用」与「存在一条按声明动态挂载的路径」并不矛盾。

MCP 侧的 owner 文档把这点写成合同：group README 写「nothing ships enabled, so you opt in per server」（`packages/mcp/README.md:12`），包 README 写「no server is enabled by default」（`packages/mcp/mcp-client/README.md:12`）。hooks 侧的 owner 文档没有 "shipped" 承诺，反而给出组合证据：生成的 `docs/capability-seams.md` 把两个 bridge 列为 `ctx.shell` 的消费者（`docs/capability-seams.md:525`，对应它们声明的 `inject = ['shell', 'sessionProjections']`，`packages/hooks/hooks-claude-code/src/index.ts:41`），也列为 `ctx.sessionPersistence` 的消费者（`docs/capability-seams.md:495`）；被列进生成表只说明依赖关系，不等于默认安装。

生成的表对 MCP 还有一个覆盖缺口值得点名：`ctx.tools` 的消费者列（`docs/capability-seams.md:511`）不含 `mcp-client`，尽管该包声明 `inject = ['tools']`（`packages/mcp/mcp-client/src/index.ts:32`）；`docs/capability-seams.md` 与 `docs/architecture.md` 全文没有 `mcp` 字样，也没有 `docs/subsystems/mcp.md`。也就是说 MCP 桥有明确产品面（`packages/mcp/README.md:12`），却没有进入这两张生成图与参考文档。

## 源码入口

| 路径 | 一句话 |
|---|---|
| `packages/mcp/mcp-client/src/index.ts` | Config 联合、`serverName` 预留、`failOnStartupError` 与 activation await |
| `packages/mcp/mcp-client/src/connection.ts` | 连接 supervisor：generation、重连预算、dispose 静默 |
| `packages/mcp/mcp-client/src/tools.ts` | 命名纯函数、两阶段 generation swap、`ctx.tools.register` |
| `packages/mcp/mcp-client/src/transport.ts` | stdio（scrubbed env）与 Streamable HTTP 两种 transport |
| `packages/hooks/hook-protocol/src/types.ts` | 方言中立词汇与 log-only 的 `hook/*` 事件声明 |
| `packages/hooks/hook-protocol/src/merge.ts` | `deny > ask > allow` 合并与 `continue:false` stickiness |
| `packages/hooks/hook-protocol/src/events.ts` | `hook/invoked` / `hook/result` 追加与 decision 规则 |
| `packages/hooks/hook-protocol/src/invariant.ts` | turn 包围、invoked/result 配对、dialect 与 duration 校验 |
| `packages/hooks/hooks-claude-code/src/index.ts` | CC 方言 payload、7 个映射点、`ask` 映射 |
| `packages/hooks/hooks-codex/src/index.ts` | Codex 方言 payload、5 个映射点、仅 block |
| `packages/core/tools/src/index.ts` | `tools/pre-execute` 瀑布与 decision 物化 |
| `packages/core/session/src/known-event-types.ts` | 生成的事件词汇表，含 `hook/invoked` / `hook/result` |

MCP over HTTP 的外发路由归进程级代理策略，见 [`06-外发代理策略.md`](./06-外发代理策略.md)（`web_fetch` 的 pinning 与 MCP 的 dispatcher 同源）；hook 决策经过的 approval seam 归交互专题；两条桥作为「不是三角色 seam 的自足插件」的判定口径见 [`00-map.md`](./00-map.md)。
