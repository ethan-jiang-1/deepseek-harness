# ACP 与 JSON-RPC 各自保证什么

源码核验入口：`packages/acp/acp/README.md`、`packages/sdk/server/README.md`。

两个都是进程外驱动 Harness runtime 的协议入口，可以挂在不同的插件组合上。它们复用 `ctx.agents` 和 session 语义，但输出保证相反：一个只把 committed 事实重新表达成标准语义更新，一个推送完整耐久流。

`a66e470204`（`dsh-v0.1.2-rc.1`）→ `183f08e9c6`（`dsh-v0.1.5-rc.1`）这个跨度内，ACP 的 `src/` 只有内部 API 适配（`persistence.ensureMaterialized` → `ctx.sessions.flush`、`persistence.list(signal)` → `persistence.list({ signal })`、resume 改走 `persistence.stat(...)`、`setup(agentCtx, agent)` 签名），方法面与能力广告未变；`packages/sdk/` 的 `src/` 一行未改。下面两节的保证清单据此只需核对行号。

## ACP：自动化适配器，不是 IDE

`dsh-acp` 在 stdio 上用 `createAcpAgentApp(...).onRequest(...).connect(stream)` 接线（@agentclientprotocol/sdk 1.4.0；`packages/acp/acp/src/index.ts:378-389`，stdout/stdin 经 `ndJsonStream` 接线 `:374-377`），驱动 `ctx.agents`。stdout 只给协议帧。它**不是** UI 集成，也不是 capability seam。

**保证：**

- `session/new`：新鲜 agent，绝对 `cwd`。非空 `additionalDirectories` 拒绝（`packages/acp/acp/src/index.ts:516`）；`mcpServers` 非空则**接受并验证**（`:209` 传入 `AcpSession.create`），配置错抛 `AcpMcpConfigError` → invalidParams（`:216`），`initialize` 广告 `mcpCapabilities: { http: true }`（`:184`）。
- `session/list` / `session/resume` / `session/close` / `session/set_config_option`：均已实现并在 `initialize` 广告（`packages/acp/acp/src/index.ts:186`、`:385-388`）。list 是确定性 newest-first 分页（`sessionListPageSize` 可配），按物理目录身份过滤 `cwd`，只列持久化的 root 会话（排除活跃、subagent origin、带 parent 的条目，`:305-313`）；resume 校验同目录后才恢复持久 log，排除 origin / parentSession（`:248-254`）；set_config_option 序列化更新广告的 `model` / `reasoning_effort`。
- `initialize`：仅当挂了 durable attachment store、且配置的精确 provider/model 声明了 image input 时，才广告图像 prompt；音频和 embedded context 恒为 false。
- `session/prompt`：按线序保留文本与受支持的 inline 图像；resource link 变成 `[resource_link name=… uri=…]`。整批图像先校验、再按最新精确 route 复核，然后在 user 事件之前全部 commit。inline base64 准入后丢弃，日志里只留 attachment 引用。每会话一个 in-flight。等到准入、整个 agent idle、以及有序输出投递。正常静默 → `end_turn`，token-limit → `max_tokens`；ACP 取消 / dispose / 未被准入的 turnless slot → `cancelled`。
- `session/cancel`：先中止尚未进 inbox 的 admission，不取消无关 agent 工作；prompt 一旦进 inbox，才取消该 agent 并等到所拥有区间静默。没有 in-flight prompt 时取消自主工作。
- `session/update`：只投递 committed 事实的语义更新，保序、每会话串行化——已提交 `assistant/message` 里每个非空文本或图像块一个 `agent_message_chunk`、每个非空 reasoning 块一个 `agent_thought_chunk`、已提交 `tool/call` / `tool/result` 一对 `tool_call` / `tool_call_update`、可用时一条 `usage_update`，以及 model / reasoning_effort 的配置更新（`packages/acp/acp/src/updates.ts:36`、`:54`、`:80`、`:98`）。图像投递前再读并校验完整性；缺失或损坏会使这次 prompt 失败，而不是发占位符。
- `session/request_permission`：带 tool call id 的、桥拥有的审批，一次性 allow/reject。客户端可自动答。
- 拆连接与 Cordis dispose 共用一份 teardown：先拒新 session/prompt，取消并排空 admission / agent 活动 / 有序输出，只排空本连接拥有的可续后代，flush persistence，再并行 dispose。别的前端共用 Context 时，它们的森林还在。

**故意不保证：**

- 删除、fork、`session/load`（transcript replay）。`session/resume` 恢复持久 log 但不重放旧 update。
- 音频、embedded resources、非空 `additionalDirectories`。图像仅 PNG / JPEG / WebP / GIF，且依赖 attachment store 与声明了 image input 的精确 route。
- 把 raw provider delta（`assistant/chunk`）、retry attempt 或 DSH 展示面（plan、title、todo、terminal、编辑器导航）打到线上。线上只有 committed 事实的语义投影，raw chunk 另有 process-local 的 `agent/assistant-stream` 帧不落盘，走别的入口观察。
- prompt 级的 turn 结局。操作区间从 prompt 进入 inbox 起到 idle 与输出投递都静默；token-limit 仍是 `end_turn`；相关模型错误也在同一静默边界才拒 prompt。
- 编辑器导航、commands、modes、elicitation 等交互式 UI surfaces。

用它：父 harness 经 `dsh-subagent-acp` spawn；或任何只需要上述核心方法的 ACP 客户端。

## JSON-RPC SDK：耐久事实全推

`dsh-sdk-jsonrpc-server`：`inject: ['agents']`。按 `sessionId` get-or-create 一个 agent。stdout 同样只给 JSON-RPC 帧。

**保证：**

- `session/prompt` **立刻**返回 `{ messageId }`（inbox 准入 id），不等 idle。
- `initialize` 是就绪边界：处理前先 `ctx.get('loader')?.await()` 等整棵当前树结算，避免异步 sibling Loader 条目（如 MCP 工具发现）未完成时宣称 ready。
- 同一 Context 内每条 `session/event` 都转成 `session.event`，每条 `agent/status` 都转成 `session.status`；订阅不按「是否由 SDK 创建」过滤。
- `initialize.maxTokens` 可变成该 SDK 创建的 agent 及其进程内后代的输出上限。
- `shutdown`：刷新响应，dispose 根 ctx，exit 0。

**故意不保证：**

- 把某条 prompt 对应到某条 `assistant/message` 或 `turn/end`。独立请求可以在同一 session 上继续排队。自动化区间由客户端自己定义和观察。
- 线上的 per-session close 或 prompt-cancel。SDK 创建的 agent 活到进程关机。
- 检查兄弟插件有没有 stdout logger——配错就会污染通道。
- 任意提供方的自动 mount：已登记的 adapter 能复用；唯一 fallback 是 `dsh-llm-deepseek`。

子 agent 完成通知只在生命周期快照的 `local` 为 true 时转发。提供方名字、child id、耐久 lineage **不**构成 locality。

「`src/` 没变」不等于「线上内容没变」：SDK 是无过滤透传层，而同一跨度内 `SESSION_FORMAT_VERSION` 从 `0` 走到 `3`（现值 `4`，`packages/core/session/src/types.ts:89`；0009 跨度仍为 v4），所以线上词汇表实际发生断裂（`assistant/chunk` 归零、`assistant/message` 内嵌 `data.stream`、新增 `assistant/attempt` / `system/message` / `feedback/*` / `command/*` / `tool/ptc-dispatch*`）。那是 session-format 专题的事实，这里只记它由 SDK 透传。

## 对照

| | ACP | JSON-RPC SDK |
|--|-----|----------------|
| prompt 返回 | 等到 idle，带 `stopReason` | 立刻 `messageId` |
| 线上可见 | committed 事实的语义更新：文本 / 图像 / reasoning 块、通用 tool 生命周期、usage、配置更新 | Context 内每条 log 事件与 agent 状态 |
| resume / fork | `session/resume`；无 fork | 无（session 由运行时拥有，线协议不暴露） |
| 取消 | `session/cancel` 对准该 agent | 无 per-prompt cancel |
| 典型消费者 | 另一个产品里的 subagent | 进程外 SDK / 脚本 |

两者都驱动 `ctx.agents`，都不在入口里实现 loop。差别是投影：ACP 只把 committed 事实重新表达成标准 ACP 语义更新，raw delta、retry attempt 与 DSH 展示面留在 session log，但在广告了图像能力时投递已提交的光栅图；SDK 把 log 当产品。
