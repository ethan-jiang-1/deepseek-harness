# 工具管道、审批、timeout，以及 chunk 如何沉淀为 settlement

源码核验入口：`packages/core/tools/src/index.ts` 事件、`packages/core/tools/src/ptc.ts`、`packages/llm/llm/src/assembler.ts`、`packages/llm/llm/src/assistant-stream.ts`、`packages/guard/timeout-policy/`、`packages/interaction/user-approval/`、`packages/core/agent-loop/src/agent.ts` `step()`。

本篇说明工具监听器的挂载位置，以及流式 chunk 如何形成一条内嵌流的 settlement 事件。

![流：一次 attempt 一条 settlement，message 进 surface](./figures/chunk-to-message.svg)

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

还有 `tools/ptc-dispatch-log`（3ca9c7d489 随 PTC 改名，旧名 `tools/code-dispatch-log`；`packages/core/tools/src/index.ts:181,343,1289-1290`）：只改 `run_code` 子调度写入 log 的副本（spill 预览），程序已经拿到完整值，模型也看不见这段。log 事件名与 waterfall 名都已随 PTC 改名：`tool/ptc-dispatch-start` / `tool/ptc-dispatch`（`packages/core/tools/src/ptc.ts:534,509`），sub-call id 为 `<parent>:ptc:<n>`（`:469`），deferred image 的 plugin 来源为 `tools-ptc`（`:562-564`）；旧名只作为 v2→v3 迁移的输入词表存在（`packages/session/session-format-v2-to-v3/README.zh.md:95`）。

## settlement → message

默认 loop 的 `step()`：

1. `agent/request` waterfall 得到冻结请求。
2. `preparedCall?.stream(request) ?? ctx.llm.stream(request)`。
3. 每个 `StreamChunk` 同时喂 `AssistantStreamAttempt`（accumulator 收集紧凑记录、assembler 收块），并作为一个 process-local frame 发出；**不再** append 顶层 `assistant/chunk`。
4. finish 若 error/aborted：先提交 `assistant/attempt`（log-only，携带 embedded stream），再走 `agent/request-error` waterfall；`retry` 则 **同一 step** 再 stream。
5. 正常结束：`createAssistantMessage` 从 assembler blocks + provider/model/replayState，然后提交**一条** `assistant/message`，`surfaceOp: 'append'`，`stream` 是紧凑记录，`usage` 有则跟这条走（没有单独的 usage 事件）。取消但已流出可见内容时，同一条事件带 `interrupted: true`。
6. 提交成功后发 committed end frame，命名 settlement 的类型与 seq；无法提交则发 abandoned end frame，没有 settlement。

一次模型 attempt 因此只有**一条 settlement**，流内嵌其中（`assistant/message.stream` 或 `assistant/attempt.stream`）。`assistant/message` 不能再带 chunk 的 `sourceEventSeqs`。要拿回逐 token 事实与精确时间戳，读的是 [`05-chunk到settlement.md`](./05-chunk到settlement.md)：`expandAssistantStream()`（`packages/llm/llm/src/assistant-stream.ts:202`）是严格校验的展开路径，`assembleAssistantStream()`（`:425`）重组 blocks。

`deriveMessages` 折叠 `assistant/message`，不折叠 `assistant/attempt`；空 content（只带 usage 的 max-tokens）派生为 null。chunk 的 seq 是品牌化 `SessionSeq`（`packages/core/session/src/types.ts:29`），按 seq 读取走 `snapshotEvents()` / `eventAt()`；token-meter 不再按引用的 chunk seq 重组 provider 输出，改为 `assembleAssistantStream(event.data.stream).blocks()`（`packages/llm/token-meter/src/index.ts:9,320-323`）。

max-tokens 截断时，assembler 丢掉全部 `tool-call` block（无论完成与否，`assembler.assembled()` 直接裁）。`ReplayEnvelope` 把 adapter 私有 replay 拆成 `response` 与可选的 per-block `blocks`；assembly 按同一套 keep/drop 裁 `blocks`，两半不能各裁各的。长度对不上就丢弃整份 envelope。

PTC 模式（原 code-mode）：子工具结果里的 image block 不嵌进 `run_code` 的程序输出。成功的 image-bearing result 在 run 结束后 `deferContext` 成 plugin 来源（`plugin: 'tools-ptc'`）的 user message，进入下一轮获准请求。`read_image` 只把图像放进自己的 tool result；由 PTC 在父 run 结束后统一 defer。

`llm-deepseek` 的图像序列化：模型要在 catalog 里声明 `inputModalities` 含 `image` 才收图像输入，否则 `UNSUPPORTED_CONTENT`（门控在 adapter 序列化时，不在 host model-switch 预检）；序列化时把 durable attachment 解析成 DeepSeek Files API 的 file id（`{type:'file', file_id}`），经 `DeepSeekFileStore` 上传、按 `variantId` 索引复用并带过期与配额回收；Files API 解析失败才回退 base64 data URL（`{type:'image_url'}`）。文件引用路径的累计负载受 `maxRequestFilesBytes`（默认 128 MiB）、每请求图像数受 `maxImagesPerRequest`（默认 600）约束；base64 回退受 `maxInlineRequestImageBytes`（默认 20 MiB）约束。超出预算时 `offloadRequestImagesWithPolicy` 按最旧优先、按整数量子把图像替换成占位文本 `OFFLOADED_IMAGE_TEXT`；这是请求期瞬态变换，不写回 durable log。provider 拒绝 file id 时 invalidate 该映射并在同一请求重试一次。413 映射为 `INVALID_REQUEST`。

> **图像编码管线（上游 #2676 / rc.1 核对）**：`attachment-local` 统一 encoding ladder：`encoding.ts` 定义编码参数、`normalization.ts` 标准化输入、`compression-limiter.ts` 限**并发**（FIFO 限制同时图像变换任务数，不是字节预算）、`request-image.ts` 组装请求路径。`saveImage` 返回 canonical ref 与 source facts（尺寸、格式等；`hasAlpha` 只在内部 `DetectedImage`，不入 ref）。Alpha 感知：`encodingLadder(prepared, hasAlpha)` 按 `hasAlpha ? 'image/webp' : 'image/jpeg'` 选编解码器（`IMAGE_ENCODING_QUALITIES = [85, 75, 60]`）。**只有**「干净、单帧、无元数据」的输入才直通；动画压成单帧 8-bit sRGB、带元数据的重编码剥离（`canPassThroughNormalization` 对 animated/metadata 返回 false）。`maxBytes` 是质量阶梯的**目标**而非硬上限——所有阶梯输出都超预算时保留最小输出；provider 字节硬上限在传输路由处才强制。`llm/llm` 的 `content.ts` 支持多模态 image 内容装配；`tool-fs` 的 `read_image` 上报降采样后的尺寸与坐标比例。

内容块不只有图像：**文件块从不原生发给任何 provider**。`projectFilesToText` 在每次 dispatch 前**无条件**把 file block（含嵌套 tool-result 内容）替换成确定性 handle 文本，与图像「只在模型没有 image 输入模态时才投影」的**条件式**行为不对称。文件块、handle 文本两条分支与模态之分见 [`06-文件块与内容块投影.md`](./06-文件块与内容块投影.md)。

ACP 在已提交 `assistant/message` 上按块投影非空文本**或**图像；chunk 仍不上线。实时展示走 process-local 的 `agent/assistant-stream` frame（start / transient chunk / end）：loop 先追加 settlement，committed end frame 再命名其类型与 seq，被放弃的 end 没有 settlement；Web 的实时 chunk 行是 Client-only 事件 `assistant/live-chunk`，不写进 session log。SDK JSON-RPC 相反：每条耐久事实都 `session.event`。见 [`../surfaces/02-acp与jsonrpc.md`](../surfaces/02-acp与jsonrpc.md)。
