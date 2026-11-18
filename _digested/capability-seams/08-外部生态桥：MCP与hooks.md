# 外部生态桥：MCP 与 hooks

> 外部生态有两种接入方式，DSH 各给了一条桥：**能力注入**——把外部 MCP server 的 tools 注册进 `ctx.tools`，模型直接调用；**决策拦截**——把 Claude Code / Codex 的 shell hook 方言翻译成 DSH 已有的拦截扩展点，在工具执行前后做 allow / deny / ask。两条桥都只做「翻译 + 注册」，不改 loop；都默认不启用。本篇讲两条桥各自的合同、失败行为与启用路径。tool 管道本身归 [`../tools-prompt-llm/00-map.md`](../tools-prompt-llm/00-map.md)。

核验入口：`packages/mcp/`、`packages/experimental/hook-protocol/`、`packages/experimental/hooks-claude-code/`、`packages/experimental/hooks-codex/`。相关决策记录：[`2026-07-07-mcp-client-plugin.md`](../../.agents/notes/archived/feature/2026-07-07-mcp-client-plugin.md) 与 [`2026-06-30-interception-extension-points.md`](../../.agents/notes/archived/feature/2026-06-30-interception-extension-points.md)（两篇均已归档，现行实现以源码为准）。

## MCP：把外部 server 的 tools 注入 `ctx.tools`

包定位与命名由 `mcp-client` 自己拥有：它是 namespace plugin（named exports、无 default export），模块 JSDoc 写「每个 plugin 实例连一个 MCP server；多个 server 就在 `cordis.yml` 里加载多个实例」（`packages/mcp/mcp-client/src/index.ts`）。模型看到的公开名是 `mcp__<serverName>__<rawName>`；`serverName` 是本地配置而不是远端 `serverInfo.name`，必须匹配 `[A-Za-z0-9_-]{1,32}`（`SERVER_NAME_PATTERN`）。公开名是 `(serverName, rawName)` 的纯函数：干净情形逐字用 `mcp__<serverName>__<rawName>`，一旦字符替换或截断到 DeepSeek function-name 契约（64 字符、`[A-Za-z0-9_-]`）改变了名字，就追加 12 位 SHA-256 哈希，使不同 MCP 身份不会塌成同一个公开名（`packages/mcp/mcp-client/src/tools.ts`）。

注入走 effect 作用域：插件声明 `inject = ['tools']`；一次 sync 分「先抓完整下一代 `ToolDefinition`、再 dispose 上一代并注册新代」两阶段，真正落点是 `ctx.tools.register`。`serverName` 命名空间预留与连接实例都包在 `ctx.effect()` 里；dispose 的合同是「停重连、关 live client、等在途 attempt 与排队 sync 静默，然后注销该 server 仍持有的每个 tool」（`packages/mcp/mcp-client/src/connection.ts`）。

HMR 是同一套 effect 语义的直接结果：disposal 会断连、注销 tools、释放 `serverName` 命名空间，HMR 通过 dispose 旧实例、建新实例热替换，相同 `serverName` 复现相同的公开 tool 名。README 从用户角度复述同一事实：编辑配置项会就地重载 server 连接，未变的名字保持不变。

两种 transport 由 config 的判别联合选择：`transport: 'stdio'` 或 `transport: 'streamable-http'`；stdio 臂构造 SDK 的 `StdioClientTransport`，HTTP 臂构造 `StreamableHTTPClientTransport`（`packages/mcp/mcp-client/src/transport.ts`）。

stdio 子进程环境是「共享 scrub 定义、不共享 spawn 路径」：子环境以 subprocess seam 的 `scrubbedParentEnv()` 为底，再叠加配置里的 `env`；README 说明被清掉的是匹配 `/KEY|PASSWORD|SECRET|TOKEN/i` 的环境名与 `DSH_*` 名，显式覆盖能存活，而真正的 spawn 由 MCP SDK 拥有。

启动与恢复由 owner 文档明确规定：`apply` 会等初始连接与首次 tool 发现完成，`outcome.error !== undefined && config.failOnStartupError` 时抛错让 Cordis 回滚该 fiber，否则只记日志并进入重连循环；`failOnStartupError` 默认 `false`。reconnect 默认启用，`initialDelayMs` 500、`maxDelayMs` 30 000、`maxAttempts` 10（`connection.ts`），预算耗尽后 unregister 该 server 的 tools。README 点明触发面：重连由 transport close 触发，崩溃的 stdio 子进程会触发它，而不可达的 Streamable HTTP server 是逐请求重试、不被 supervisor 重启。同步失败也不撕裂可见工具集：fetch 阶段失败保留上一代，注册冲突回滚整代。

### 桥的边界：tools 与 resources 分层

**`mcp-client` 只桥 tools**（其 `inject` 只有 `['tools']`），client 自身对 Resources 与 Prompts 没有消费者机制（README：resources 由共享资源服务按需读、subscriptions 与 prompt templates 不支持）。**resources 的落点是同组的 `mcp-resources` 包**——`ctx.mcpResources` seam（`packages/mcp/mcp-resources/src/index.ts`）经共享工具发现与读取资源，mcp-client 的每条连接把 provider 注册进来（`packages/mcp/mcp-client/src/server-context.ts`），且 **shipped profile 已默认挂载**（`packages/bundle/base/cordis.patch.yml`，sdk-minimal 同）；server instructions 作为字面文本进已记录的 system prompt，MCP prompt templates 仍不支持。group README 的口径是「tools + read server resources / shipped profiles already mount mcp-resources once」。外部依赖只有 MCP SDK 这一项产品依赖：`@modelcontextprotocol/client`（`packages/mcp/mcp-client/package.json`）。

resources 的**能力门**值得单独记一笔，因为它是「stdout 是协议通道」这条不变量对 seam 的反向约束：`resources/list` 与 `resources/templates/list` 先查 `generation.getServerCapabilities()?.resources !== undefined`，server 未声明该能力时直接返回空页 `{ resources: [] }` / `{ resourceTemplates: [] }`，**不调用 SDK**（`connection.ts`）。理由是 SDK 对未声明能力同样回空页，但会往 stdout 写一行 `console.debug`，而 ACP profile 把 stdout 保留给 JSON-RPC 帧。也就是说「空结果的语义」在这里不是由 SDK 决定，而是由承载 profile 的通道纪律决定——同一个 seam 在 web/headless 下容忍的噪声，在 ACP 下会破坏帧，因此能力判断被前移到 provider 侧。回归在 `apps/cli/tests/profiles/acp/tests/stdout.expected.e2e.ts`。

## hooks：两条外部方言，一条共享 wire protocol

分组结构：`hook-protocol` 是共享 hook 引擎（library，永不直接配置），`hooks-claude-code` 与 `hooks-codex` 是两个 plugin，三包住在 `packages/experimental/`（行记在组 README 里）。以下事实按 owner 归属分别引用。

支持点数量：Claude Code 桥支持 7 个 hook point——`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop`、`SubagentStart`、`SubagentStop`（`packages/experimental/hooks-claude-code/src/config.ts` 的 `CLAUDE_EVENTS`），其 README 记 CC 当前 30 个事件中有 23 个不支持；Codex 桥支持 5 个——`PreToolUse`、`PostToolUse`、`SessionStart`、`UserPromptSubmit`、`Stop`（`packages/experimental/hooks-codex/src/config.ts` 的 `CODEX_EVENTS`），README 记 Codex 当前 10 个事件中有 5 个不支持。两桥都只跑 `{ type: 'command', command, timeout? }` 形状，其他 handler 类型 parse-and-skip 并 warn（`packages/experimental/hook-protocol/README.md`）。

wire 差异被压到一个轴：matcher mode。`claude-code` 模式对纯 `[A-Za-z0-9_|]+` 的模式用 literal（管道是精确交替），否则用 regex；`codex` 永远是 unanchored regex（`packages/experimental/hook-protocol/src/types.ts`）。stdin 写法不同：CC 带尾换行，Codex 不带。环境与替换不同：CC 用 `CLAUDE_PROJECT_DIR` 与 `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PROJECT_DIR}` 替换，Codex 不做命令替换、不注入插件环境。payload 形状不同：CC 的 base 是 `session_id`/`transcript_path`/`hook_event_name`，`cwd` 在 runHook payload 单独注入；Codex 是 snake_case 并给每个事件带 `model` 与 `permission_mode: "default"`。两者都把 `transcript_path` 留空（CC 是 `''`，Codex 是 `null`），理由是持久化 seam 不暴露 artifact 路径、默认 zstd 的 session log 对 hook 脚本不可读。

决策能力也不同：CC 的 `PreToolUse` 支持 `ask`，Codex 只认 block，没有 pre-tool approval 或 rewrite 路径。协议层解析 `updatedInput` 但不遵守，bridge 只 log + warn（`hook-protocol/src/types.ts`）。

共享的合并语义在 `merge.ts`：权限优先级 `deny > ask > allow`，`rank()` 把 `deny`/`block` 记为 3、`ask` 为 2、`approve`/`allow` 为 1；第一个 `continue: false` 的 stop 是 sticky，胜出等级的理由用 `\n\n` 连接。

## 事件：log-only，但进入会话日志

库里 `appendHookInvoked` / `appendHookResult` 写一对 `hook/invoked` / `hook/result`（`packages/experimental/hook-protocol/src/events.ts`）；配对 key 是 `handlerId`，两个 bridge 各自生成 `claude-code:<point>:<n>` 与 `codex:<point>:<n>`。`hook/result.decision` 的规则由 `appendHookResult` 拥有：解析出的 decision，否则 `continue:false` 记 `stop`，再否则 `pass`。

这两类事件是 **log-only**：declaration merge 的 JSDoc 明确写 `hook/invoked` 是「like `compaction/*`; NOT a `SurfaceEventType`, carries no `surfaceOp`」（`hook-protocol/src/types.ts`），而 `SurfaceEventType` 全集只有 `system/message`/`developer/message`/`user/message`/`assistant/message`/`tool/result`（`packages/core/session/src/types.ts`）。因此这对事件**不是 model-visible**：模型看到的只会是决策的效果，而不是审计记录本身。

它们**进入会话日志**：生成的事件词汇表 `KNOWN_SESSION_EVENT_TYPES` 里有 `hook/invoked` 与 `hook/result`（`packages/core/session/src/known-event-types.ts`），持久化读路径因此认得并保留它们。

turn 作用域由协议自己约束：invocation/result 必须落在一个打开的 turn 内——`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop` 天然满足，`SessionStart` 在第 1 轮之前跑、拿不到 `hook/*` 记录，它的 context 改由注入交付（`events.ts` 模块合同与 README）。

模型能看到的决策效果由 bridge README 逐条固定：provider 给的理由原样透传；没有时 denied tool 变成 `Error: blocked by PreToolUse hook`，post-tool block 的 feedback 恰为 `blocked by PostToolUse hook`，blocking stop 追加 `continue: blocked by Stop hook`；被 block 的 prompt 直接丢弃、结束为 `blocked`、没有 model-visible 消息。context 类 hook 的效果是注入一条带 source 的 message。

`continue: false` 只有审计效果：folded 的 `stop` 会被记录，但拦截点没有 run-level halt primitive（`hook-protocol/README.md`），两个 bridge 里各留一条 `TODO(hook-continue-false)`。CC README 把同一缺口列进 Known Limitations。

## hook 决策如何进入 tool 管道

拦截点在 `ctx.tools` 的注册表里，不在 hook 包。每个 tool call 的固定序列是 `tools/pre-execute` → 单调 guards → `tools/execute` → dispatch → `tools/post-execute` → 定义拥有的 `projectContent` / `finalizeContent` → `tools/result`（`docs/tool-execution-pipeline.md`）；生成图把 hooks 画在 `tools/pre-execute` 瀑布里，并把 `hook/invoked`/`hook/result` 列进 tool-owned session events 节点。registry 执行的第一个 waterfall 就是 `this.ctx.waterfall(carrier, 'tools/pre-execute', exec, …)`（`packages/core/tools/src/index.ts`）。

bridge 直接挂在这个 waterfall 上：CC 的监听器返回 `PreToolDecision`——`deny` 映射成 `{ kind: 'deny', reason }`、`ask` 映射成 `{ kind: 'ask', reason? }`、其余 `next()`；Codex 的监听器只映射 `deny`，否则 `next()`。`tools/pre-execute` 的语义是 allow / deny / ask 三值：deny 跳过 `tools/execute` 与 core dispatch，ask 经可选 approval seam、只有 `allowed-once` 才继续（决策记录见已归档的 [`2026-06-30-interception-extension-points.md`](../../.agents/notes/archived/feature/2026-06-30-interception-extension-points.md)）。

决策落地：`ask` 由 registry 交给 approval seam——`gate.kind === 'ask'` 时 `await this.serviceAsk(exec, gate)`，而 `ctx.approval` 是 fail-closed 的、只有 `allowed-once` 才放行（`docs/subsystems/approval.md`）。非 allow 的决策取 `decision.reason` 作为 `denialReason`，一旦存在就把结果物化成 `content: [{ type: 'text', text: 'Error: <reason>' }], isError: true`，tool body 不被执行。这是 hook 决策到达 tool 管道的**实际落点**：bridge 只产 typed decision，registry 在瀑布之后、guards 之前执行它。

post 侧同构：`tools/post-execute` 的监听器可以把结果 block 成 feedback，或把 `additionalContext` 折进下游 decision。其余三个映射点：`agent/created`（session-start 边）注入 context、`agent/pre-step` 可 reject、`agent/turn-stopping` 用 `agent.steer()` 强制再走一步（`packages/experimental/hooks-claude-code/src/index.ts`）。`hook/*` 事件刻意不属于拦截扩展点：Service Definition 不声明这些事件，因为它们属于 `dsh-hook-protocol`，native plugin 用 typed decision 时完全不写 hook log。

## 默认启用还是 opt-in

两条桥都**默认不启用**，但要分清「没有 bundle 的 patch 行直接挂它们」与「没有任何出货路径会挂它们」——后者对 MCP 不成立。六个 bundle（`acp-app`/`base`/`headless`/`sdk-app`/`sdk-minimal`/`web-app`）各自的 `cordis.patch.yml` **确实没有任何一行**挂 `@deepseek-ai/dsh-mcp-client`、`@deepseek-ai/dsh-hooks-claude-code` 或 `@deepseek-ai/dsh-hooks-codex`；作为 cordis 挂载行，这些包名只出现在快照 fixture（`snapshots/session/text-turn/cordis.yml`）与文档示例 overlay（`apps/cli/config/examples/mcp-memory/engram.cordis.yml`）里。

**hooks 侧到此为止**：仓库内没有任何动态挂载路径，只能显式 opt-in。**MCP 侧还有第二条路径**：`acp-app` patch 挂的 `@deepseek-ai/dsh-acp` 会按 ACP session 声明的 `mcpServers` 动态挂载 MCP client——`packages/acp/acp/src/session.ts` 调 `mountAcpMcpServers(agentCtx, options.mcpServers, options.cwd)`，后者在 `packages/acp/acp/src/mcp.ts` 对每个声明的 server 执行 `agentCtx.plugin(McpClient, config)`。所以「ACP 客户端主动声明 MCP server」时 MCP 桥是走的；这也解释了该包名为何还出现在 `apps/cli/package.json`、`python/sdk-runtime/package.json`、`packages/acp/acp/package.json` 与 `tsconfig.base.json` 的依赖/引用列表里。owner 文档仍成立：`packages/mcp/README.md` 写 "nothing ships enabled, so you opt in per server"，包 README 写 "no server is enabled by default"——「没有 server 默认启用」与「存在一条按声明动态挂载的路径」并不矛盾。

生成的表对 MCP 有一个覆盖缺口值得点名：`ctx.tools` 的消费者列不含 `mcp-client`，尽管该包声明 `inject = ['tools']`；`docs/architecture.md` 全文也没有 `mcp` 字样——MCP 的产品面文档在 `docs/subsystems/mcp.md` 与生成表的 `ctx.mcpResources` seam 行。被列进生成表只说明依赖关系，不等于默认安装。

## 源码入口

| 路径 | 一句话 |
|---|---|
| `packages/mcp/mcp-client/src/index.ts` | Config 联合、`serverName` 预留、`failOnStartupError` 与 activation await |
| `packages/mcp/mcp-client/src/connection.ts` | 连接 supervisor：generation、重连预算、dispose 静默、resources 能力门 |
| `packages/mcp/mcp-client/src/tools.ts` | 命名纯函数、两阶段 generation swap、`ctx.tools.register` |
| `packages/mcp/mcp-client/src/transport.ts` | stdio（scrubbed env）与 Streamable HTTP 两种 transport |
| `packages/experimental/hook-protocol/src/types.ts` | 方言中立词汇与 log-only 的 `hook/*` 事件声明 |
| `packages/experimental/hook-protocol/src/merge.ts` | `deny > ask > allow` 合并与 `continue:false` stickiness |
| `packages/experimental/hook-protocol/src/events.ts` | `hook/invoked` / `hook/result` 追加、decision 规则与 turn 包围合同 |
| `packages/experimental/hook-protocol/src/runner.ts` | 单条 command hook 的执行与 stdin 编码（`trailingNewline`） |
| `packages/experimental/hooks-claude-code/src/index.ts` | CC 方言 payload、7 个映射点、`ask` 映射 |
| `packages/experimental/hooks-codex/src/index.ts` | Codex 方言 payload、5 个映射点、仅 block |
| `packages/core/tools/src/index.ts` | `tools/pre-execute` 瀑布与 decision 物化 |
| `packages/core/session/src/known-event-types.ts` | 生成的事件词汇表，含 `hook/invoked` / `hook/result` |

MCP over HTTP 的外发路由归进程级代理策略，见 [`06-外发代理策略.md`](./06-外发代理策略.md)；hook 决策经过的 approval seam归交互专题；两条桥作为「不是三角色 seam 的自足插件」的判定口径见 [`00-map.md`](./00-map.md)。
