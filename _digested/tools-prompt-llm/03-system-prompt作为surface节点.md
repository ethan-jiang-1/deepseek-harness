# system prompt 作为 surface 节点

源码核验入口：`packages/core/session/src/types.ts` 的事件定义、`packages/core/session/src/request-header.ts`、`packages/core/agent-loop/src/runtime-context.ts`、`packages/core/agent-loop/src/agent.ts` 的 `buildRequest`。

本篇回答一个表示的搬迁：渲染后的 system prompt 从 `request/header` 的 `system` 字段，搬成一条普通的 surface 会话事件 `system/message`，占据 surface node 0。

## 事件形状

`system/message` 的载荷镜像 `tool/result`，是 `{ turn, step, message }`（`packages/core/session/src/types.ts:310`）。`message` 是 `SystemMessage`（`role: 'system'`，一个 text block 装渲染后的 prompt），来源固定为 `{ kind: 'plugin', plugin: '@deepseek-ai/dsh-system-prompt' }`（构造见 `packages/llm/llm/src/message.ts:238`）。

surface 事件类型因此从三种变成四种：`system/message`、`user/message`、`assistant/message`、`tool/result`（`packages/core/session/src/types.ts:412-416`）。

空 `content` 表示「无 system prompt」。节点保留 surface 位置，`deriveEventMessage` 把它投影为 `null`，不产生 wire 消息（`packages/core/session/src/surface.ts:109-116`）；同一分支也让「只带 usage 的 max-tokens assistant message」不注入空 assistant turn。

提交时序：loop 的 `turn()` 在 `step/start` 之后、本步 `user/message` 之前提交 `system/message`（`packages/core/agent-loop/src/agent.ts:370-376`），所以**日志顺序 = wire 顺序**。`buildRequest`（`:553-612`）不再设 `system`，请求 = `header.config` + `session.deriveMessages()`（system 在最前）+ `header.tools`；配套的 invariant 断言 loop 构造的请求 `system === undefined`（`packages/core/agent-loop/src/invariant.ts:44-46`）。

## `EpochHeader` 不再有 `system`

`canonicalHeader` 只规范化 `config` / `adapterDefaults` / `tools`（`packages/core/session/src/request-header.ts:21-30`），`headerEquals` 也只逐字段比这三样（`:43-52`）。一个还想读 `header.system` 的消费者在**编译期就失败**——这是这次搬迁的设计目标之一。

`RequestHeaderReason` 本身没变，仍是 `'initial' | 'resume' | 'change' | 'series'`（`packages/core/session/src/types.ts:261`）。变的是 `change` 的含义：现在只意味着 **config 或 tools** 变了；prompt 变化不再伪装成 `change`。

wire 请求不变。DeepSeek 序列化器把历史里的 `role: 'system'` 消息原样透传（`packages/llm/llm-deepseek/src/serialize.ts:250-251`、`:303-305`）；pi-ai 把 leading system history message 映射到它自己的单一 `systemPrompt` 槽（`packages/llm/llm-pi-ai/src/context.ts:140-151`）。`GenerateOptions.system` 仍保留给一次性调用者，例如 title provider（`:386-387`、`:425-426`）。

## 三种路由：`SystemPromptProjection`

`SystemPromptProjection` 现在与 `RuntimeContextProjection` 并列，前者在 `packages/core/agent-loop/src/runtime-context.ts:59-104`，后者在 `:107`。它**每次 projection 都重扫当前 surface** 的 system node（`:63-73`），因为决策取决于「留下几个」。

`project(rendered, { inHistory, startsSeries })` 返回有序的 per-node commits（`:81-96`），共三条路由：

1. **没有 surviving system node** → `append`。即使 rendering 为空也先占住 node 0，节点记录「无 prompt」。
2. **`!inHistory || startsSeries || rendered === ''`** → 先把 head 之后每个非空节点逐个替换成空，再在 head 文本与 rendering 不同时重写 head。这是「把有效文本归拢到 node 0」的归一化路径。
3. **否则**（capable route、series 继续、rendering 非空）→ 取 surface 顺序上最后一个非空节点；文本相同就不发任何操作，不同就 `append` 一个新节点，**不碰 head**。

## node 0 保护

`assertSystemHeadRewrite`（`packages/core/session/src/surface.ts:404-418`）规定：替换范围覆盖 surface node 0、而 node 0 是 `system/message` 时，除非替换者本身也是恰好覆盖该节点的 `system/message`，否则拒绝。

后面的 system node 没有这层保护，compaction 可以遮蔽它们。`compaction-basic` 的 `selectCompactableRange` 锚在第一个非 system 节点（`packages/compaction/compaction-basic/src/region.ts:130`），所以 node 0 永不被 compaction 遮蔽，摘要输入仍以有效 prompt 开头。

## 「稳定前缀是否还成立」

**成立，但物换了，而且多了一条绕过它的路。**

以前「前缀稳定」= `header.system` 字节不变；现在 = **surface node 0 的 `system/message` 文本不变**。同一个结论，不同的载体；KV cache 的机械原因没变，比较的对象变了。

不 capable 的 route 上，prompt 变化 = 替换 node 0（必要时先空掉后面的活动节点），紧随一条 `reason: 'series'` 的 header（若这一次 header 自身也变了，则是一条带 `startsSeries` 的 `change`）；如果有效文本没变、也没有节点被清空，则一条操作都不发，series 不换、header 也不写。capable 的 route 上（见 [`04-in-history提示词替换.md`](./04-in-history提示词替换.md)），变化可以 append 成新节点、完全不重写 node 0，缓存前缀因此可能保住；append 本身不需要 `request/header`。

`resume` 不是 series start，所以重启后改过的 prompt 在 capable route 上是 append，provider 缓存可能跨进程仍然有效；在不 capable 的 route 上则回落到归一化。

`complete: true` 的 section 语义未参与这次搬迁：assembly 仍跑完 waterfall（好让 tools / contexts / variables 被解析），然后把这一段恢复成唯一 prompt section；多于一个有效 complete → assembly 失败（声明 `packages/core/system-prompt/src/index.ts:68-73`，实现 `:590-592`）。顺序与前缀细节见 [`01-section顺序与前缀.md`](./01-section顺序与前缀.md)。
