# system prompt 作为 surface 节点

> **为什么单独有这一页**：多数 harness 把 system prompt 当成每个请求的隐式前缀参数或 header 字段，不进对话历史。但在 DSH 里，随着会话中途技能切换或工具更新，system prompt 自己也在演化；如果不把生效的 system prompt 写进事件日志，回放历史请求或审计「当时模型究竟看到了哪一版系统提示」时就会丢失证据。本页说明 system prompt 为什么被提升为一等 surface 事件（node 0 的 `system/message`），以及它怎样和 `request/header` 分工，做到**既完整可重建，又不破坏旧对话历史**。
>
> 源码核验入口：`packages/core/session/src/types.ts` 的事件定义、`packages/core/session/src/request-header.ts`、`packages/core/agent-loop/src/runtime-context.ts`、`packages/core/agent-loop/src/agent.ts` 的 `buildRequest`。

本篇说明渲染后的 system prompt 如何作为一条普通 surface 会话事件 `system/message` 存进日志并占据 surface node 0，以及对应的投影路由与前缀稳定性。

## 事件形状

`system/message` 的载荷镜像 `tool/result`，是 `{ turn, step, message }`（`packages/core/session/src/types.ts:331`）。`message` 是 `SystemMessage`（`role: 'system'`，一个 text block 装渲染后的 prompt），来源固定为 `{ kind: 'system-prompt' }`（构造见 `packages/llm/llm/src/message.ts:279`，source 字段在 `:283`）。

surface 事件类型共五种：`system/message`、`developer/message`（动态工具更新的载体，见 [`02-工具管道审批与timeout.md`](./02-工具管道审批与timeout.md)）、`user/message`、`assistant/message`、`tool/result`（`packages/core/session/src/types.ts` 的 `SurfaceEventType` 闭集）。

空 `content` 表示「无 system prompt」。节点保留 surface 位置，`deriveEventMessage` 把它投影为 `null`，不产生 wire 消息（`packages/core/session/src/surface.ts:120`-`:150`，空 content 分支 `:141`）；同一分支也让「只带 usage 的 max-tokens assistant message」不注入空 assistant turn。

提交时序：loop 在 `step/start` 之后、本步 `user/message` 之前提交 `system/message`（`turn()` 在 `packages/core/agent-loop/src/agent.ts:331` 落 `step/start`，`step()` 在 `:416-424` 提交 system 与首个 attempt 的 user 批次），所以**日志顺序 = wire 顺序**。`buildRequest`（`:616-704`）不传顶层 `system` 字段，请求 = `header.config` + `session.deriveMessages()`（system 在最前）+ `header.tools`（`:695`-`:703`）。「loop 构造的请求不带独立 `system`」由 `buildRequest` 自身保证。

## `EpochHeader` 没有 `system` 字段

`canonicalHeader` 只规范化 `config` / `adapterDefaults` / `tools`（`packages/core/session/src/request-header.ts:21-30`），`headerEquals` 也只逐字段比这三样（`:43-52`）。任何试图读取 `header.system` 的消费者在**编译期就失败**。

`RequestHeaderReason` 是 `'initial' | 'resume' | 'change' | 'series'`（`packages/core/session/src/types.ts`）；`change` 只意味着 **config 或 tools** 变了——prompt 变化不写 `change`，它走自己的 `system/message` 节点。

wire 请求层面：DeepSeek 序列化器把历史里的 `role: 'system'` 消息原样透传（非 in-history 路径收进 `historySystem`，`packages/llm/llm-deepseek/src/serialize.ts:106`-`:114`）；pi-ai 把 leading system history message 映射到它自己的单一 `systemPrompt` 槽（`packages/llm/llm-pi-ai/src/context.ts:156`-`:157`）。`GenerateOptions.system` 用于一次性直调（声明 `packages/llm/llm/src/types.ts:529` 的接口、`:546` 的字段），例如 title provider（`packages/session/session-title-llm/src/index.ts:259` 把它放进冻结的 `GenerateOptions`）。

## 三种路由：`SystemPromptProjection`

`SystemPromptProjection` 与 `RuntimeContextProjection` 并列在 `packages/core/agent-loop/src/runtime-context.ts`（前者 `:65-103`，后者 `:114`）。它**每次 projection 都重扫当前 surface** 的 system node（`:69-85`），因为决策取决于「留下几个」。

`project(rendered, { inHistory, startsSeries })` 返回有序的 per-node commits（`:88-103`），共三条路由：

1. **没有 surviving system node** → `append`。即使 rendering 为空也先占住 node 0，节点记录「无 prompt」。
2. **`!inHistory || startsSeries || rendered === ''`** → 先把 head 之后每个非空节点逐个替换成空，再在 head 文本与 rendering 不同时重写 head。这是「把有效文本归拢到 node 0」的归一化路径。
3. **否则**（capable route、series 继续、rendering 非空）→ 取 surface 顺序上最后一个非空节点；文本相同就不发任何操作，不同就 `append` 一个新节点，**不碰 head**。

## node 0 保护

`assertSystemHeadRewrite`（`packages/core/session/src/surface.ts:493-507`）规定：替换范围覆盖 surface node 0、而 node 0 是 `system/message` 时，除非替换者本身也是恰好覆盖该节点的 `system/message`，否则拒绝。

后面的 system node 没有这层保护，compaction 可以遮蔽它们。`compaction-basic` 的 `selectCompactableRange` 锚在第一个非 system 节点（`packages/compaction/compaction-basic/src/region.ts:131`，`systemHead` 判定后跳过 node 0），所以 node 0 永不被 compaction 遮蔽，摘要输入仍以有效 prompt 开头。

## 「稳定前缀」怎样成立

**前缀稳定成立，载体是 surface node 0 的 `system/message` 文本，同时支持 capable route 的追加绕过。**

KV cache 的机械原因不变（按请求前缀匹配），决定前缀是否不变的是 **surface node 0 的 `system/message` 文本**（以及工具 schema）：

不 capable 的 route 上，prompt 变化 = 替换 node 0（必要时先空掉后面的活动节点），紧随一条 `reason: 'series'` 的 header（若这一次 header 自身也变了，则是一条带 `startsSeries` 的 `change`）；如果有效文本没变、也没有节点被清空，则不发 **node 操作**；但 header 的 `series` / `change` 仍按 `startsRequestSeries` 独立写（`packages/core/agent-loop/src/agent.ts:632-651`），两件事不能混成一句。capable 的 route 上（见 [`04-in-history提示词替换.md`](./04-in-history提示词替换.md)），变化可以 append 成新节点、完全不重写 node 0，缓存前缀因此保住；append 本身不需要 `request/header`。

`resume` 不是 series start，所以重启后改过的 prompt 在 capable route 上是 append，provider 缓存可能跨进程仍然有效；在不 capable 的 route 上则回落到归一化。

`complete: true` 的 section 在 assembly 中同样先跑完 waterfall（好让 tools / contexts / variables 被解析），然后恢复成唯一 prompt section；多于一个有效 complete 时 assembly 抛错（声明在 `packages/core/system-prompt/src/index.ts:70-75`，检查与恢复实现在 `assemble()` 的 `:653-687`）。顺序与前缀细节见 [`01-section顺序与前缀.md`](./01-section顺序与前缀.md)。
