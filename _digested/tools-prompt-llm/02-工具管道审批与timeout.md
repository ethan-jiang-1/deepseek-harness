# 工具管道、审批与 timeout

> **为什么单独有这一页**：一个工具写好 `execute` 注册进 `ctx.tools` 只是起点；真正上线时，权限拦截、人机审批、强制超时、以及对话中途动态加载工具都要同时插到一次调用的生命周期里。如果这些政策各自去包一层工具函数，或者审批把权限硬编码进工具源码，整套工具面立刻无法组合。本页讲清 DSH 如何用**三条固定顺序的 waterfall 钩子**与独立的 `approval`/`timeout` 插件把调用治理统一起来，并说明运行中新增工具时如何安全通知模型。
>
> 源码核验入口：`packages/core/tools/src/index.ts` 事件、`packages/core/tools/src/ptc.ts`、`packages/guard/timeout-policy/`、`packages/interaction/user-approval/`、`packages/core/agent-loop/src/agent.ts` `step()`。

本篇分工：调用治理与中途工具面更新看本页；流式 chunk 如何沉淀为 settlement 归 [`05`](./05-chunk到settlement.md)，图像与文件如何进消息归 [`06`](./06-文件块与内容块投影.md)。

## `tools/*` 调用管道的三条，加上一条 `approval/*`

```text
tool/call（log）
  tools/pre-execute     → PreToolDecision：allow | deny | ask
  tools/execute         → 真正 dispatch；timeout 包在这
  tools/post-execute    → 包装 / 替换结果
tool/result（log，surface）
```

三条都是 waterfall：调用 `next()` 委托内层；拥有政策结果的监听器可以直接返回决定、dispatch 结果或 post-decision。只做观察或包装的监听器必须委托。scope 过滤：agent-scoped 监听器只收到该 agent 的调用。

`pre-execute` 默认 inner 是 allow。`ask` 没有审批支持 → 否决。异步门必须看 `exec.signal`；注册表在它们结算后复核取消，但**不丢弃**它们的 promise。

审批本身是另一条 seam：`ctx.approval` + waterfall `approval/request`。审计事件 `approval/asked` / `approval/decided` / `approval/policy` 都是 **log-only**，不进 `deriveMessages`。模型从 runtime-context 快照和 tool result 得知结果，不从审批事件本身。缺 answerer fail-closed。

hooks（Claude Code / Codex 桥）把外部 permission 决策映射成 `pre-execute` 的 allow/deny/ask。人点的 slash command 走 `ctx.commands`，不进这条管道。

## 会话中途的工具面更新

`dsh-llm` 定义路由能力 `ToolUpdate = 'in-history' | 'addition-only'`（`packages/llm/llm/src/types.ts:425`，挂在 `LlmResolvedModelInfo` 上，`:428`）。每次模型请求的 `request/header` 基准确定后，只要工具列表相对基准有增删，loop 就在**所有路由**上无条件把增删写成一条 `developer/message`（source `{ kind: 'tool-registry' }`，content 是 `tool-addition` / `tool-removal` 块，`packages/core/agent-loop/src/agent.ts:652-666`；仅 `additions.length > 0` 时附带 `headerSeq`）。随后在 dispatch 边界由 `projectToolUpdates`（`packages/llm/llm/src/content.ts:424`，调用点 `packages/llm/llm/src/index.ts:1106-1108`）按目标 route 声明的模式投影：`in-history` route 收到保留的 `tool-addition` / `tool-removal` 增量，`addition-only` route 的 removal 被滤掉（工具只能增不能撤），未声明模式的 route 收不到 developer 更新、拿完整工具表（`content.ts:430-436`）。DeepSeek wire 侧把保留的 developer 块序列化成 system-role 的 `tool_addition` / `tool_removal` tool 引用，`defer_loading` 声明按 schema 字段透传（`packages/llm/llm-deepseek/src/serialize.ts:47`、`:95-96`、`:165`）。内置唯一声明者 `deepseek-flash` 用 `addition-only`（`packages/llm/llm-deepseek/src/models.ts:15`，catalog Schemastery 校验 `packages/llm/llm-deepseek/src/config.ts`）。tool 模式同样可被官方 listing 的 `api_capabilities.anthropic_messages.tool_update` 覆盖：`in-history` / `addition-only` 照收，省略保留内建，其他值按 `leading-only` 移除（`packages/llm/llm-deepseek/src/listed-catalog.ts:55-68`）。未声明模式的 route 在可见 schema 集变化时使 `startsSeries` 成立（`packages/core/agent-loop/src/agent.ts:420` 的条件是 `preparedCall?.toolUpdate === undefined && this.toolsChanged(assembly.tools)`）。

## timeout 挂在 `tools/execute`

`dsh-tool-call-timeout-policy`：读 `ctx.tools.get(name, agent)?.timeoutMs`。未声明则 `next()`。有则 `deadline(exec.signal, timeoutMs)`。超时返回模型可见的失败结果，不是抛给 loop 当基础设施错误。同一条 `tools/execute` 上还有 `dsh-session-checkpoint-policy`：先 flush 再进 tool body。`tools/post-execute` 上 `spill-policy` 处理超大文本。

`timeoutMs` 在 `defineTool` 时声明，必须是正有限数。这是 **tool 调用**预算。shell 的 foreground `timeoutMs` 是 **进程**预算。一次 bash 可能两边都有。

`tools/execute` 包装只许改 `exec.signal`，调用身份不可变。注册表在 body 前重新融合原来的 caller signal，替换不能摘掉取消。包装器仍须恢复自己的 signal 并达到 quiescence。

`tools/post-execute`：抛错的 tool 也作为 error 进入这条链。caller 取消在结算后只替换「已接受的成功结果」。

还有 `tools/ptc-dispatch-log`（`packages/core/tools/src/index.ts`）：只改 `run_code` 子调度写入 log 的副本（spill 预览），程序已经拿到完整值，模型也看不见这段。事件名 `tool/ptc-dispatch-start` / `tool/ptc-dispatch`（`packages/core/tools/src/ptc.ts`），sub-call id 为 `<parent>:ptc:<n>`，子调度产生的图像通过 `deferContext` 转为 `{ kind: 'ptc-mode' }` 的 user message（细节归 [`06`](./06-文件块与内容块投影.md)）。

**工具卡的 preparing 阶段**：`assistant/live-chunk` 的 `tool-call-delta` 帧在 `tool/call` 落 log 之前就把工具卡的 phase 置为 `preparing`（`packages/client/ui-chat/src/client/conversation-nodes/tool.ts`），Web 过程活动行同样显示准备态（同目录 `process-activity.ts`）；card 拿到的是「工具开始准备」的过程信号，不是执行结果。

## 关联机制的归属

- **流式 settlement 与实时帧**：一次模型 attempt 只提交一条内嵌 `stream` 的 settlement（`assistant/message` 或 log-only `assistant/attempt`），实时展示走 process-local 的 `agent/assistant-stream` 帧，见 [`05-chunk到settlement.md`](./05-chunk到settlement.md)；ACP / SDK 的对外流投影见 [`../surfaces-entrypoints/02-acp与jsonrpc.md`](../surfaces-entrypoints/02-acp与jsonrpc.md)。
- **内容块投影**：文件块与图像块由发送边界统一处理（文件转 handle 文本、图像按模态与预算投影），见 [`06-文件块与内容块投影.md`](./06-文件块与内容块投影.md)。
