# Answer · 多 vendor 接入 DSH 的选择

## 结论

MICU 的 GPT-5.6 当前应走**纯配置的独立 `micu` route**。本次已通过 DSH 的真实 `openai-responses` 适配器验证 `gpt-5.6-sol` 和 `gpt-5.6-terra` 的工具调用、工具结果回传和 replay；不需要改 `agent-loop`，也不需要为 MICU 新建 vendor 包。配置示例和逐项实验记录在 [research.md](./research.md)。

不要把 MICU 覆盖成 `openai`。`micu` 是持久会话、模型选择和凭据引用中的 route identity；保留独立名称，官方 OpenAI 和多个中转站才能同时存在且能追溯请求来源。

独立 `npx @deepseek-ai/dsh web` 的已应用配置、effort 策略和精确回退步骤见 [dsh-web-micu-configuration.md](./dsh-web-micu-configuration.md)。

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

`gpt-5.6-sol` 的 `xhigh` 已在本次 DSH 路径中接受；`terra` 的工具往返已通过，但尚未单独测试 `xhigh`，所以示例不宣称它支持。`luna` 虽在 `/models` 中出现，但本次连续两次返回 `503 model:rate_limited`，暂不放进默认配置。上下文窗口、最大输出、图片和其他推理等级也不能从模型名或官方目录抄入；只有在该中转实际验证后才在对应模型项声明。

模型选择器中选择 `micu / gpt-5.6-sol` 即会成为新会话默认选择。也可在 `agent-default-model` 设置中保存 `{ provider: micu, model: gpt-5.6-sol, reasoningEffort: xhigh }`。已发生模型请求的会话保留其日志中的 route/model，不会因以后改默认值而改写历史。

这也是接入多个 OpenAI-compatible 中转站的标准做法：每家一条 route，例如 `micu`、`company-gateway`、`openrouter-prod`，各自一个 `apiKeyEnv` 和独立模型列表。手动选择哪个模型是现有产品能力，不需要写插件。

## 方案 2：用已安装 provider 目录

如果实际是官方 OpenAI endpoint，或一个确定要作为官方 OpenAI 替身的部署，可以配置已安装的 `openai` route。它会继承 pi-ai 的官方模型目录与协议默认值。这适合“同一身份的 endpoint 覆盖”，不适合长期并存的中转站：会话日志和模型列表会把实际中转误标为 `openai`，以后排障、计费和切换都不清楚。

因此，MICU 应使用方案 1 的未知 route，而不是方案 2。

## 方案 3：新 adapter 插件

只有中转**不能被三种现有协议正确描述**时才写 adapter。典型触发条件如下：

- 只支持 Chat Completions，或 Responses 的事件/请求字段与 pi-ai 的实现不兼容；
- 认证不是 Bearer API key，且不能由静态非机密 headers 表示；
- 工具调用、工具结果回传、流式终止事件或多轮历史格式不兼容；
- 需要 provider 特有的签名、response id、会话 token 或思考参数，通用 replay 不能恢复；
- 需要模型发现、容量、图片或错误码的 vendor 专有逻辑。

实现位置是新的 `packages/llm/llm-<vendor>/`：它作为 `LlmAdapter` 注册自己的 route，把 vendor 流转换为 DSH 的 `StreamChunk`，并提供 `resolveModel()`、凭据配置与 replay state。不要改 `agent-loop`；它只消费 provider-neutral 流。新增 adapter 是完整 capability 工作，需要单元测试、真实 API e2e、文档和 Agent Note，而不是一段 fetch 封装。

若 MICU 的 Responses 后续出现一项兼容性失败，先检查能否改用 `openai-completions` 配置；只有两种 OpenAI 协议都不能满足时，才升级到新 adapter。

## 方案 4：自动路由或跨 vendor 故障切换

这不是“多配置几个 route”自然得到的能力。当前 `dsh-llm-retry` 只会在**原 provider**上重试；`agent/request-error` 的现有动作也只有 `{ kind: 'retry' }`，不能通过配置把下一次请求换成另一个 route。

有两条合理路线：

1. **DSH 内策略插件。** 新增明确的模型选择/恢复扩展点，使策略能在每次 request 前选择 route，并把实际选择写进请求头和 session log；失败后按错误类别（如 `RATE_LIMIT`、`SERVER`、`TRANSPORT`）重选候选。它必须决定模型映射、上下文能力、工具兼容性、重试预算、成本上限和恢复时的历史可表示性。
2. **DSH 外统一网关。** 让网关自己根据策略选择后端，DSH 只看到一个 OpenAI-compatible route。这最容易上线，但 DSH 无法看到真实后端、真实成本或实际模型；会话日志也只能记录网关 identity。适合集中运维和多个客户端共用同一政策。

如果目标只是“手动在几个 vendor 之间切换”，不要做方案 4。若目标是“一个模型挂了自动换另一个”，先写一份策略设计：明确什么错误允许切换、同一模型如何映射、工具和上下文是否等价、是否允许重发完整 prompt，以及如何记录并向用户展示实际后端。此时不能只给 `llm-retry` 增一个 fallback 字段，因为当前 loop 的恢复动作没有承载新的模型选择。

## 建议的推进顺序

1. 先采用方案 1，将 `micu` 与其他 vendor 并列配置，并保留独立 route identity。
2. 用真实任务验证每个模型的文本流、工具往返、历史恢复、推理档位、上下文和限流表现；把可用能力写进该 route 的模型项。
3. 只有发现协议不能描述时写方案 3 的 adapter；只有需要无人值守的选路/容灾时设计方案 4。

第三方中转会接收完整系统提示、用户输入、工具 schema、工具参数和工具结果。是否接入还应独立评估数据保留、日志、地域、账号隔离、费用和撤销 key 的能力；Codex 样例的 `disable_response_storage` 只影响客户端设置，不能证明中转站不存储数据。
