# Answer · 多 vendor 接入 DSH 的选择

产品源码核验基线：DeepSeek Harness `dsh-v0.1.7-rc.1`，commit `46a7f68b09`。手工 route 实测仍以各 vendor 研究笔记为准。

## 结论

- **MICU：** GPT-5.6 用纯配置的独立 `micu` route，协议为 `openai-responses`。不要覆盖 `openai`，这样官方 OpenAI、中转站及其会话记录才能并存且可追溯。已验证模型、配置和安全回退见 [GPT_dsh-web-micu-configuration.md](./GPT_dsh-web-micu-configuration.md)、[GPT_research.md](./GPT_research.md) 与 [MICU_DEEPSEEK_research.md](./MICU_DEEPSEEK_research.md)。
- **GLM：** 当前 `dsh web` 已内置 Z.ai 的 `zai`、`zai-coding-cn` provider；属于纯配置接入，只需配置对应的 `apiKeyEnv`，不需要新插件。标准 API 与 Coding endpoint 不能混用，内置模型和待验证范围见 [GLM_research.md](./GLM_research.md)。
- **KIMI：** 当前 `dsh web` 也内置 Kimi/Moonshot provider；应根据 API 产品选择 `moonshotai`、`moonshotai-cn` 或 `kimi-coding` route，只配置该 route 的凭据引用，不伪装为 `openai`。模型、endpoint 和验证边界见 [KIMI_research.md](./KIMI_research.md)。

这三类 route 已作为可回退的纯配置写入实际 DSH Web settings；route 清单、未验证范围与恢复步骤见 [DSH_web-multi-vendor-configuration.md](./DSH_web-multi-vendor-configuration.md)。

## 选择表

| 方案 | 何时使用 | DSH 要做什么 | 适合 MICU 吗 | 代价 |
|---|---|---|---|---|
| 1. 手工配置 route | vendor 完整兼容 `openai-responses`、`openai-completions` 或 `anthropic-messages` | 在 `settings.yaml` 声明 endpoint、协议、模型和凭据引用 | **推荐** | 无代码；每个 endpoint 单独验证能力 |
| 2. 已安装目录 route 加覆盖 | vendor 是 pi-ai 已识别的官方 provider，只是换 key、endpoint 或缩小模型范围 | 配置已有 route，例如 `openai` | 不推荐作为中转身份 | 无代码；会混淆官方与中转的日志来源 |
| 3. 新 LLM adapter 插件 | wire 协议、认证、SSE、工具事件或历史格式不属于以上三种 | 新增 `LlmAdapter`，实现请求、流解析、工具/replay、错误分类和模型能力 | 仅在兼容性失败后 | 中等；需完整 adapter 测试与真实 API e2e |
| 4. 路由/恢复插件或外部网关 | 想按价格、延迟、配额自动选 vendor，或跨 vendor 故障切换 | 策略插件必须持久记录每次模型选择；复杂策略也可放在 DSH 外的网关 | 可作为后续能力 | 高；跨 route 切换不是现成 retry 的配置项 |

## 方案 1：纯配置

DSH 的基础 bundle 已经挂载但默认休眠的 `dsh-llm-pi-ai`。在 `$DSH_HOME/settings.yaml` 写入一条未知 route，adapter 就会用手工声明的协议、endpoint 与模型目录注册它。凭据引用由 DSH 在每个请求时解析；不要把真实 key 写入这个文件，也不要把 key 塞进 `headers`。

```yaml
llm-pi-ai:
  providers:
    micu:
      displayName: MICU
      apiKeyEnv: CODEX_API_KEY_MICU
      api: openai-responses
      baseURL: https://www.micuapi.ai/v1
      models:
        - id: gpt-5.6-sol
          reasoningEfforts:
            xhigh: xhigh
        - id: gpt-5.6-terra
```

`gpt-5.6-sol` 的 `xhigh` 已在本次 DSH 路径中接受；`terra` 的工具往返已通过，但尚未单独测试 `xhigh`，所以示例不宣称它支持。`luna` 虽在 `/models` 中出现，且后来有一次最小请求成功，但此前连续两次返回 `503 model:rate_limited`，暂不放进日常配置。上下文窗口、最大输出、图片和其他推理等级也不能从模型名或本机 `pi-ai` catalog 抄入；只有在该中转实际验证后才在对应模型项声明。

模型选择器会先把 `micu / gpt-5.6-sol` 应用于当前会话，再尝试保存为新会话默认选择；保存失败时，当前会话仍会保持已选模型。也可在 `agent-default-model` 设置中保存 `{ provider: micu, model: gpt-5.6-sol, reasoningEffort: xhigh }`。已发生模型请求的会话保留其日志中的 route/model，不会因以后改默认值而改写历史。

这也是接入多个 OpenAI-compatible 中转站的标准做法：每家一条 route，例如 `micu`、`company-gateway`、`openrouter-prod`，各自一个 `apiKeyEnv` 和独立模型列表。手动选择哪个模型是现有产品能力，不需要写插件。

## 方案 2：用已安装 provider 目录

如果实际是官方 OpenAI endpoint，或一个确定要作为官方 OpenAI 替身的部署，可以配置已安装的 `openai` route。它会继承本机 `pi-ai` 内置 `openai` 目录与协议默认值。这适合“同一身份的 endpoint 覆盖”，不适合长期并存的中转站：会话日志和模型列表会把实际中转误标为 `openai`，以后排障、计费和切换都不清楚。

因此，MICU 应使用方案 1 的未知 route，而不是方案 2。

## 方案 3：新 adapter 插件

只有中转**不能被三种现有协议正确描述**时才写 adapter。典型触发条件如下：

- 只支持 Chat Completions，或 Responses 的事件/请求字段与 pi-ai 的实现不兼容；
- 认证不是 Bearer API key，且不能由静态非机密 headers 表示；
- 工具调用、工具结果回传、流式终止事件或多轮历史格式不兼容；
- 需要 provider 特有的签名、response id、会话 token 或思考参数，通用 replay 不能恢复；
- 需要模型发现、容量、图片或错误码的 vendor 专有逻辑。

实现位置是新的 `packages/llm/llm-<vendor>/`：它作为 `LlmAdapter` 注册自己的 route，把 vendor 流转换为 DSH 的 `StreamChunk`，并提供 `resolveModel()`、凭据配置与 `ReplayEnvelope`（`response` 加可选 per-block `blocks`；max-tokens 丢掉 tool-call 时 assembly 按同一套 keep/drop 裁 replay）。不要改 `agent-loop`；它只消费 provider-neutral 流。新增 adapter 是完整 capability 工作，需要单元测试、真实 API e2e、文档和 Agent Note，而不是一段 fetch 封装。

官方 `dsh-llm-deepseek` 的 thinking effort 是 `off` / `low` / `high` / `max`（省略默认 `high`）。这与 pi-ai 手工 route 上自填的 `reasoningEfforts` 映射无关：中转站仍须逐档验证后再写入 settings。

若 MICU 的 Responses 后续出现一项兼容性失败，先检查能否改用 `openai-completions` 配置；只有两种 OpenAI 协议都不能满足时，才升级到新 adapter。

## 方案 4：自动路由或跨 vendor 故障切换

这不是“多配置几个 route”自然得到的能力。当前 `dsh-llm-retry` 只会在**原 provider**上重试；`agent/request-error` 的现有动作也只有 `{ kind: 'retry' }`，不能通过配置把下一次请求换成另一个 route（`RequestErrorAction = { kind: 'retry' } | undefined`，`packages/core/agent/src/runtime-types.ts:122`）。

有两条合理路线：

1. **DSH 内策略插件。** 新增明确的模型选择/恢复扩展点，使策略能在每次 request 前选择 route，并把实际选择写进请求头和 session log；失败后按错误类别（如 `RATE_LIMIT`、`SERVER`、`TRANSPORT`）重选候选。它必须决定模型映射、上下文能力、工具兼容性、重试预算、成本上限和恢复时的历史可表示性。
2. **DSH 外统一网关。** 让网关自己根据策略选择后端，DSH 只看到一个 OpenAI-compatible route。这最容易上线，但 DSH 无法看到真实后端、真实成本或实际模型；会话日志也只能记录网关 identity。适合集中运维和多个客户端共用同一政策。

如果目标只是“手动在几个 vendor 之间切换”，不要做方案 4。若目标是“一个模型挂了自动换另一个”，先写一份策略设计：明确什么错误允许切换、同一模型如何映射、工具和上下文是否等价、是否允许重发完整 prompt，以及如何记录并向用户展示实际后端。此时不能只给 `llm-retry` 增一个 fallback 字段，因为当前 loop 的恢复动作没有承载新的模型选择。

## 选 route 也选提示词表示

模型能力不只决定思考档位，还决定**提示词如何在历史里表示**。`dsh-llm` 定义可选能力 `SystemPromptUpdate = 'in-history'`（`packages/llm/llm/src/types.ts:347`）：声明它的 route 可以把变更后的 system prompt 追加在已缓存历史之后；不声明的 route 每次 prompt 变化都要重写 message 0，前缀缓存整段失效。**唯一内置声明者是 `deepseek-flash`**（`packages/llm/llm-deepseek/src/models.ts:7-14`，能力字段在 `:12`）；`llm-pi-ai` 全目录不声明，所以所有手工 route（MICU、OpenRouter、公司网关等）一律走 replace 语义。机制细节与 decision rule 见 [04-in-history提示词替换.md](../../_digested/tools-prompt-llm/04-in-history提示词替换.md)，本节只讲它对多 vendor 选择的影响。

结论有三条。其一，route 身份与协议族**不能推断**该能力：官方 DeepSeek 只有 `deepseek-flash` 声明，同族的其他模型仍走 replace；手工 route 目前**无法**通过 settings 声明它。其二，代价是缓存而不是正确性：两种语义下模型最终都读到最新 prompt，差别在是否每步作废前缀、以及多花的 token 与延迟。其三，中转最隐蔽的风险是代理侧行为——若中转会重写、重排或合并 system 消息，即使上游模型支持 in-history，追加语义也会被静默破坏，表现为缓存命中率下降而非报错。面向多 vendor 决策的完整版见 [DSH_systemPromptUpdate能力面.md](./DSH_systemPromptUpdate能力面.md)。

检测器是真实 API e2e：`packages/llm/llm-deepseek/tests/adapter.e2e.ts:51` 起的 `updates system instructions during a conversation, in-history=%s` 用例比较追加 prompt 与重写 message 0 两种策略的 `cacheReadTokens`，断言前者不低于热前缀、且严格高于 replace 基线；由 `DEEPSEEK_IN_HISTORY_MODEL` 指定模型，变量未设时跳过。部署若想为某个模型开启该能力，只能用 `cordis.yml` 的 `models` 列表替换 catalog（`packages/llm/llm-deepseek/src/config.ts:29-30` 的 volatile `models` 字段，schema 默认 `DEFAULT_MODELS` 在 `:88`），并且必须自己承担“该模型确实这样读 system 消息”的验证责任。

## 两个横切事实

**文件从不原生发给任何 provider。** 模型历史里的 `FileBlock` 在每次 dispatch 前被 `projectFilesToText` **无条件**替换成确定性 handle 文本——文件名、字节数、sha256 前缀、只读保存路径与读取指引；嵌套在 tool result 里的文件也一样。图像是**条件式**的：只有 route 没声明 `image` 输入模态时才投影成文本。所以中转即使支持原生文件输入，DSH 也不会把文件字节发过去；反过来，手工 route 也无法通过配置开启原生文件。详见 [06-文件块与内容块投影.md](../../_digested/tools-prompt-llm/06-文件块与内容块投影.md)。

**出网代理统一覆盖 provider 请求。** `dsh` 在任何插件挂载之前按 `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` / `NO_PROXY` 解析一份策略并装成 undici 的 global dispatcher（`apps/cli/src/profile-boot.ts:282-291`），因此裸 `fetch()` 的 pi-ai model discovery 与 DeepSeek 请求都会走代理，不需要各家 adapter 自己实现；这四个名字允许来自 `$DSH_HOME/.env`，但调用目录的 `.env` 会被拒绝（`packages/boot/app-boot/src/index.ts:120-126`）。例外是 session telemetry 的日志导出：它为了解析自己的 collector 而故意直连、绕过 global dispatcher，并有反向断言（`packages/session/session-telemetry-otel/tests/egress.spec.ts:75-120`）。

## 建议的推进顺序

1. 先采用方案 1，将 `micu` 与其他 vendor 并列配置，并保留独立 route identity。
2. 用真实任务验证每个模型的文本流、工具往返、历史恢复、推理档位、上下文和限流表现；把可用能力写进该 route 的模型项。
3. 只有发现协议不能描述时写方案 3 的 adapter；只有需要无人值守的选路/容灾时设计方案 4。

第三方中转会接收完整系统提示、用户输入、工具 schema、工具参数和工具结果。是否接入还应独立评估数据保留、日志、地域、账号隔离、费用和撤销 key 的能力；Codex 样例的 `disable_response_storage` 只影响客户端设置，不能证明中转站不存储数据。
