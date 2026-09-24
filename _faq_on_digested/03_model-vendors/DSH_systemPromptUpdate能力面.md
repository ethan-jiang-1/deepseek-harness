# DSH · systemPromptUpdate 能力面：选模型也在选提示词表示

产品源码核验基线：DeepSeek Harness `dsh-v0.1.7-rc.1`，commit `46a7f68b09`。本文回答「多 vendor 接入时，为什么选一个 route 不只影响能力档位，还影响提示词在历史里的表示」，以及中转场景下这件事会怎么出问题。

## 能力是什么

`dsh-llm` 定义可选能力 `SystemPromptUpdate = 'in-history'`（`packages/llm/llm/src/types.ts:347`），作为**可选兄弟字段** `systemPromptUpdate` 挂在 `LlmResolvedModelInfo`（`:358`）与 `PreparedLlmCall`（`packages/llm/llm/src/index.ts:169-172`）上。适配器返回其他取值时 `normalizeModelInfo` 抛 `LlmError`，code `INVALID_MODEL_INFO`（`:779-783`）。

语义：声明该能力的模型把对话**任意位置**的 `system` 消息读作完整有效 system prompt，最新一条覆盖前面的。因此 prompt 变化可以追加在已缓存历史**之后**，不必重写 message 0，KV 缓存前缀得以保住。不声明的 route 每次 prompt 变化都要替换 message 0（后面非空的 system 节点还会被逐个清空），前缀缓存整段失效。

注意范围：工具 schema 仍是缓存前缀的一部分，换工具集照样失效；provider/model 换本身不是新 series，目标 route 有能力时变化走 append。

## 谁声明，谁不声明

| route | 是否声明 | 依据 |
|---|---|---|
| 内置 `deepseek-official` 的 `deepseek-flash` | **是** | `packages/llm/llm-deepseek/src/index.ts:94-100`；catalog zod 用 `z.const('in-history')` 校验（`:184`） |
| 同 catalog 的 `deepseek-v4-flash` / `deepseek-v4-pro` / `deepseek-v4-flash-vision-exp` | 否 | `packages/llm/llm-deepseek/src/index.ts:92-122`（只有 `deepseek-flash` 带该字段） |
| 全部 `llm-pi-ai` route（内置目录 route 与手工 route） | 否 | `packages/llm/llm-pi-ai/src/` 全目录无 `systemPromptUpdate`；手工 provider profile 也没有可写该能力的字段 |

所以「官方 DeepSeek」「OpenAI 兼容」「Anthropic messages」这些身份或协议族**都不能推断**该能力，只有 catalog 里那一条 `deepseek-flash` 记录是权威。部署可以用 `cordis.yml` 的 `models` 列表替换 catalog 来显式声明（`packages/llm/llm-deepseek/src/adapter.ts:72`、`:417`），但那就等于自己承担「该模型确实这样读 system 消息」的验证责任；**手工 pi-ai route 目前无法声明**，只能走 replace。

## 对多 vendor 中转的实际含义

1. **能力随模型，不随 vendor。** 同一个官方 provider 下，各模型的声明可以不同；中转把某个模型改名或换 id 后，DSH 看不到原模型的 catalog 条目，也就不会继承该能力。
2. **代价是缓存与 token，不是正确性。** 两种语义下模型最终都读到最新 prompt；差别在是否每步作废前缀、以及多花的 token 与延迟。在选择表里，这是「实测能力」之外单独要记的一格。
3. **中转最隐蔽的风险在代理侧。** 若中转会重写、重排、合并或缓存 `system` 消息，即使上游模型支持 in-history，追加语义也会被静默破坏——现象是缓存命中率下降、成本上升，而不是报错。反过来，一个不支持 in-history 的中转若被 DSH 当作 capable 也没机会发生，因为 DSH 只信 catalog。

## 怎么检查与验证

- 运行时读取：`ctx.llm.resolveModelInfo(provider, model)` 的返回带 `systemPromptUpdate`；每次请求还会把实际生效值写进 `request/context`（`packages/core/agent-loop/src/agent.ts:585-597`），所以会话日志本身可以回答「这次请求用的是 replace 还是 append」。
- 真实 API 检测器：`packages/llm/llm-deepseek/tests/adapter.e2e.ts:358-444` 用同一份 prompt 字节比较两种策略——追加 prompt 的 `cacheReadTokens` 必须不低于热前缀、且严格高于重写 message 0 的基线。由 `DEEPSEEK_IN_HISTORY_MODEL` 指定模型，变量未设时整个用例跳过。
- 机制细节、decision rule 四行表与清空语义见 [_digested/tools-prompt-llm/04-in-history提示词替换.md](../../_digested/tools-prompt-llm/04-in-history提示词替换.md)。
