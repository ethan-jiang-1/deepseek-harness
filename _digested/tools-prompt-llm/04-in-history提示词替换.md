# in-history 提示词替换

产品源码基线：`639ed015397290b3745d163aafe02ffee4aa3f84`（`dsh-v0.2.0-rc.2`，2026-09-25 同步轮核验；OLD 侧 `46a7f68b09`）。

源码核验入口：`packages/llm/llm/src/types.ts`、`packages/llm/llm/src/index.ts` 的 `normalizeModelInfo`、`packages/llm/llm-deepseek/src/models.ts` 的 catalog、`packages/core/agent-loop/src/runtime-context.ts:81-96`。

本篇写一条**按模型能力分路**的替换语义：同一次 prompt 变化，不 capable 的 route 要重写 message 0，capable 的 route 可以把新 prompt 追加在已缓存历史之后。

## 能力面

`dsh-llm` 定义能力 `SystemPromptUpdate = 'in-history'`（`packages/llm/llm/src/types.ts:396`），作为**可选兄弟字段**挂在 `LlmResolvedModelInfo`（`:410`，字段 `:418`）与 `PreparedLlmCall` 上（`packages/llm/llm/src/index.ts:169`，字段 `:179`）。`normalizeModelInfo` 拒绝任何其他取值，抛 `LlmError` code `INVALID_MODEL_INFO`（`:789-794`）。

**唯一内置声明者是 `deepseek-flash`**（`packages/llm/llm-deepseek/src/models.ts:12`；0.2.0 线该模型同时声明了兄弟能力 `toolUpdate: 'addition-only'`，见 [`02-管道审批timeout与chunk.md`](./02-管道审批timeout与chunk.md) 的新节）。catalog zod 用 `z.const('in-history')` 校验（0.2.0 线 catalog 定义随 `llm-deepseek/src/index.ts` 瘦身迁到 `config.ts:77`，per-model 复核在 `:163-165`）。**所有 `llm-pi-ai` route 都不声明**（`packages/llm/llm-pi-ai/src/` 全目录无 `systemPromptUpdate`），因此手工配置的 pi-ai route 一律保持「重写 message 0」的 replace 行为。部署可以用 `cordis.yml` 的 `models` 列表替换 catalog，从而显式声明该能力（`packages/llm/llm-deepseek/src/config.ts:77`、`:163-165`）。

## 语义

该模型把对话**任意位置**的 `system` 消息读作完整有效 system prompt，最新一条覆盖前面的。所以变更后的 prompt 可以追加在已缓存历史**之后**，不必重写前缀——这正是 in-history 模式保住 KV 缓存的机械原因。

工具 schema 仍是缓存前缀的一部分，换工具集仍会失效。provider/model 换本身也不是 series start（见下）。

## decision rule

`SystemPromptProjection.project()` 的四条决策（与 note `.agents/notes/implemented/feature/2026-09-02-in-history-system-prompt-replacement.md` 的表、以及源码 `packages/core/agent-loop/src/runtime-context.ts:81-96` 对齐）：

| route 能力 | 前缀状态 | 操作 |
|---|---|---|
| 无 | 非空 rendering，任意前缀状态 | 为每个非空的后继 system node 记一次空替换，然后按需重写第一个 system node |
| `in-history` | 当前 request series 继续 | 在本步 `user/message` 之前 append 新 `system/message`；append 本身不需要 `request/header` |
| `in-history` | 新 series 开始 | 先给非空后继节点记空替换，再按需重写第一个节点，即使有效文本没变 |
| 任意 | rendering 为空 | 先给非空后继节点记空替换，再按需清空 head；没有任何 prompt 版本留在 derived messages |

`startsSeries` 为 true 的三种情况：`agent/pre-step` 决定声明 `startsRequestSeries`；surface `replaceGeneration` 相对于上次请求动了（compaction 或任何其他替换）；可见 tool schema 集变了——最后这条在 0.2.0 线收窄为「route 未声明 `toolUpdate` 模式」时才成立（`packages/core/agent-loop/src/agent.ts:413-415`），声明了模式的 route 由历史更新机制接管工具面变化。**provider/model 换本身不是 series start**：目标 route capable 时变化走 append，而 route 换本来就已错过缓存，不必再归一化。

空渲染会清掉**所有**活动 system node，不只是最新的，否则更早的 prompt 会「复活」。dormant 的空尾节点既不提供有效文本，也不需要重复替换；空 head 且无活动后继节点就表示「无 prompt」。

## 落 log 与记账

`RequestContext.systemPromptUpdate` 作为 `request/context` 字段落 log，与 provider/model/contextWindow 并列，任一不同就写快照（`packages/core/agent-loop/src/agent.ts:652-665`）。

`dsh-token-meter` 把 surface 顺序上**最后一个非空** surviving system node 计入 `contextBreakdown.systemTokens`，其余（包括被取代的 prompt）计入 `messageTokens`；空 dormant 节点忽略（`packages/llm/token-meter/src/breakdown-projection.ts:70-74`）。

`complete: true` 的 persona 只用渲染后的 prefix、忽略 suffix：`packages/preset/persona/src/index.ts:63-73` 把 `complete` 挂在 prefix section 上，assembly 之后只保留这一段，suffix section 因此被抑制。

## 限制与验证

**模型契约本身是「按供给记录」的**，不是源码分析能验证的：note 写明「The model contract is recorded as supplied」。验证路径是真实 API e2e `packages/llm/llm-deepseek/tests/adapter.e2e.ts:51-70`（0.2.0 线重写：`it.skipIf(!IN_HISTORY_MODEL).each([false, true])` 用 `DEEPSEEK_IN_HISTORY_MODEL` 指定的模型对**声明与未声明**两种能力状态各跑一轮三段对话——改写 prompt、追加为后继 system 消息、空 prompt 清空——断言回复内容按各自身份切换且历史不可变；旧版「比较 replace/in-history 两种 `cacheReadTokens`」的断言已不在这条测试里，缓存收益由模型契约侧记录，源码不再断言）；变量未设时跳过。

对多 vendor 中转的实际含义见 [`../../_faq_on_digested/03_model-vendors/DSH_systemPromptUpdate能力面.md`](../../_faq_on_digested/03_model-vendors/DSH_systemPromptUpdate能力面.md)：中转 route 无法声明该能力，代理若重写或重排 system 消息会**静默**破坏替换语义。
