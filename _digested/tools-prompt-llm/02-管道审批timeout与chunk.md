# 工具管道、审批、timeout，以及 chunk 如何入 log

源码核验入口：`packages/core/tools/src/index.ts` 事件、`packages/core/tools/src/ptc.ts`、`packages/llm/llm/src/assembler.ts`、`packages/guard/timeout-policy/`、`packages/interaction/user-approval/`、`packages/core/agent-loop/src/agent.ts` `step()`。

本篇说明工具监听器的挂载位置，以及流式 chunk 如何形成 raw chunk 与 assembled message 两类日志事件。

![流：chunk 入 log，message 进 surface](./figures/chunk-to-message.svg)

## 三条 `tools/*` 加上一条 `approval/*`

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

## timeout 挂在 `tools/execute`

`dsh-tool-call-timeout-policy`：读 `ctx.tools.get(name, agent)?.timeoutMs`。未声明则 `next()`。有则 `deadline(exec.signal, timeoutMs)`。超时返回模型可见的失败结果，不是抛给 loop 当基础设施错误。同一条 `tools/execute` 上还有 `dsh-session-checkpoint-policy`：先 flush 再进 tool body。`tools/post-execute` 上 `spill-policy` 处理超大文本。

`timeoutMs` 在 `defineTool` 时声明，必须是正有限数。这是 **tool 调用**预算。shell 的 foreground `timeoutMs` 是 **进程**预算。一次 bash 可能两边都有。

`tools/execute` 包装只许改 `exec.signal`，调用身份不可变。注册表在 body 前重新融合原来的 caller signal，替换不能摘掉取消。包装器仍须恢复自己的 signal 并达到 quiescence。

`tools/post-execute`：抛错的 tool 也作为 error 进入这条链。caller 取消在结算后只替换「已接受的成功结果」。

还有 `tools/code-dispatch-log`：只改 `run_code` 子调度写入 log 的副本（spill 预览），程序已经拿到完整值，模型也看不见这段。

## chunk → message

默认 loop 的 `step()`：

1. `agent/request` waterfall 得到冻结请求。
2. `preparedCall?.stream(request) ?? ctx.llm.stream(request)`。
3. 每个 `StreamChunk`：`session.append('assistant/chunk', { turn, step, chunk })`，seq 推进数组。
4. `BlockAssembler.push(chunk)`。
5. finish 若 error/aborted：`agent/request-error` waterfall；`retry` 则 **同一 step** 再 stream。
6. `createAssistantMessage` 从 assembler blocks + provider/model/replayState。
7. `assistant/message`，`surfaceOp: 'append'`，`sourceEventSeqs: chunkSeqs`。`usage` 有则跟这条走，没有单独 usage 事件。

`deriveMessages` 折叠 message，不折叠 chunk。UI 若要打字机效果，读 chunk；模型下一请求读 assembled message。空 content（只带 usage 的 max-tokens）派生为 null。

max-tokens 截断时，assembler 丢掉未完成的 `tool-call` block。`ReplayEnvelope` 把 adapter 私有 replay 拆成 `response` 与可选的 per-block `blocks`；assembly 按同一套 keep/drop 裁 `blocks`，两半不能各裁各的。长度对不上就丢弃整份 envelope。

PTC 模式（原 code-mode）：子工具结果里的 image block 不嵌进 `run_code` 的程序输出。成功的 image-bearing result 在 run 结束后 `deferContext` 成 plugin 来源的 user message，进入下一轮获准请求。`read_image` 只把图像放进自己的 tool result；由 PTC 在父 run 结束后统一 defer。

`llm-deepseek` 的图像序列化：模型要在 catalog 里声明 `inputModalities` 含 `image` 才收图像输入，否则 `UNSUPPORTED_CONTENT`（门控在 adapter 序列化时，不在 host model-switch 预检）；序列化时把 durable attachment 解析成 DeepSeek Files API 的 file id（`{type:'file', file_id}`），经 `DeepSeekFileStore` 上传、按 `variantId` 索引复用并带过期与配额回收；Files API 解析失败才回退 base64 data URL（`{type:'image_url'}`）。文件引用路径的累计负载受 `maxRequestFilesBytes`（默认 128 MiB）、每请求图像数受 `maxImagesPerRequest`（默认 600）约束；base64 回退受 `maxInlineRequestImageBytes`（默认 20 MiB）约束。超出预算时 `offloadRequestImagesWithPolicy` 按最旧优先、按整数量子把图像替换成占位文本 `OFFLOADED_IMAGE_TEXT`；这是请求期瞬态变换，不写回 durable log。provider 拒绝 file id 时 invalidate 该映射并在同一请求重试一次。413 映射为 `INVALID_REQUEST`。

> **图像编码管线（上游 #2676）**：`attachment-local` 新增统一的 encoding ladder：`encoding.ts` 定义编码参数、`normalization.ts` 标准化输入、`compression-limiter.ts` 强制预算上限、`request-image.ts` 组装请求路径。`saveImage` 返回 canonical ref 与 source facts（尺寸、格式、alpha 通道）。Alpha 感知编码：有透明通道的图像走独立 quality ladder（`encodeAlphaImage` vs `encodeOpaqueImage`），避免透明区域被不透明编码损坏。Metadata carriers（EXIF 等）与 animation 直通，不重编码。Canonical 预算在写入前校验，确保最终编码不超过原始预算。`llm/llm` 的 `content.ts` 支持多模态 image 内容装配；`tool-fs` 的 `read_image` 上报降采样后的尺寸与坐标比例。

ACP 在已提交 `assistant/message` 上按块投影非空文本**或**图像；chunk 仍不上线。SDK JSON-RPC 相反：每条耐久事实都 `session.event`。见 [`../surfaces/02-acp与jsonrpc.md`](../surfaces/02-acp与jsonrpc.md)。
