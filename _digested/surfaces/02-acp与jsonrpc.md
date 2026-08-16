# ACP 与 JSON-RPC 各自保证什么

源码核验入口：`packages/acp/acp/README.md`、`packages/sdk/server/README.md`。

两个都是进程外驱动 Harness runtime 的协议入口，可以挂在不同的插件组合上。它们复用 `ctx.agents` 和 session 语义，但输出保证相反：一个提供精简的自动化结果，一个推送完整耐久流。

## ACP：自动化适配器，不是 IDE

`dsh-acp` 在 stdio 上开 `AgentSideConnection`，驱动 `ctx.agents`。stdout 只给协议帧。它**不是** UI 集成，也不是 capability seam。

**保证：**

- `session/new`：新鲜 agent，绝对 `cwd`。空的 `additionalDirectories` / `mcpServers` 接受，非空拒绝。
- `session/prompt`：文本块拼接成一条 user message；baseline resource link 变成 `[resource_link name=… uri=…]`。每会话一个 in-flight。等到 **整个 agent idle**。正常静默 → `end_turn`；ACP 取消 / dispose / 未被准入的 turnless slot → `cancelled`。
- `session/update`：每条 **已提交** `assistant/message` 里每个非空文本块一个 `agent_message_chunk`。
- `session/request_permission`：带 tool call id 的、桥拥有的审批，一次性 allow/reject。客户端可自动答。
- 拆连接与 Cordis dispose 共用一份 teardown：先拒新 session/prompt，结算 pending，只排空本连接拥有的可续后代，再并行 dispose。别的前端共用 Context 时，它们的森林还在。

**故意不保证：**

- 加载、列表、resume、删除、fork。只有新鲜 session。
- 图像、音频、embedded resources、非空 extra dirs、MCP。
- 把 raw `assistant/chunk`、推理、工具活动、plan、title、usage 打到线上。它们留在 session log，走别的入口观察。
- prompt 级的 turn 结局。token-limit 的 turn 在 ACP 里仍是 `end_turn`；相关 turn 上的模型错误才立刻拒 prompt。
- 编辑器导航、commands、modes、配置选择器、elicitation。

用它：父 harness 经 `dsh-subagent-acp` spawn；或任何只需要上述核心方法的 ACP 客户端。

## JSON-RPC SDK：耐久事实全推

`dsh-sdk-jsonrpc-server`：`inject: ['agents']`。按 `sessionId` get-or-create 一个 agent。stdout 同样只给 JSON-RPC 帧。

**保证：**

- `session/prompt` **立刻**返回 `{ messageId }`（inbox 准入 id），不等 idle。
- 同一 Context 内每条 `session/event` 都转成 `session.event`，每条 `agent/status` 都转成 `session.status`；订阅不按「是否由 SDK 创建」过滤。
- `initialize.maxTokens` 可变成该 SDK 创建的 agent 及其进程内后代的输出上限。
- `shutdown`：刷新响应，dispose 根 ctx，exit 0。

**故意不保证：**

- 把某条 prompt 对应到某条 `assistant/message` 或 `turn/end`。独立请求可以在同一 session 上继续排队。自动化区间由客户端自己定义和观察。
- 线上的 per-session close 或 prompt-cancel。SDK 创建的 agent 活到进程关机。
- 检查兄弟插件有没有 stdout logger——配错就会污染通道。
- 任意提供方的自动 mount：已登记的 adapter 能复用；唯一 fallback 是 `dsh-llm-deepseek`。

子 agent 完成通知只在生命周期快照的 `local` 为 true 时转发。提供方名字、child id、耐久 lineage **不**构成 locality。

## 对照

| | ACP | JSON-RPC SDK |
|--|-----|----------------|
| prompt 返回 | 等到 idle，带 `stopReason` | 立刻 `messageId` |
| 线上可见 | committed 文本块 | Context 内每条 log 事件与 agent 状态 |
| resume / fork | 无 | 无（session 由运行时拥有，线协议不暴露） |
| 取消 | `session/cancel` 对准该 agent | 无 per-prompt cancel |
| 典型消费者 | 另一个产品里的 subagent | 进程外 SDK / 脚本 |

两者都驱动 `ctx.agents`，都不在入口里实现 loop。差别是投影：ACP 为了自动化干净故意丢中间态；SDK 把 log 当产品。
