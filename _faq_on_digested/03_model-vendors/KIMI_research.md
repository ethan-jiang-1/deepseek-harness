# KIMI Research Notes: Kimi 的直接支持与纯配置边界

## 结论

独立安装的 `npx @deepseek-ai/dsh web` 当前使用 `@deepseek-ai/dsh@0.1.0-rc.6` 和 `@earendil-works/pi-ai@0.82.1`。其中内置三条可选的 Kimi route：`moonshotai`、`moonshotai-cn` 和 `kimi-coding`。它们均可通过 `llm-pi-ai.providers` 的纯配置启用；不需要新 vendor 插件，也不应伪装为 `openai` 或手工 OpenAI route。当前实际配置只启用已验证的 `moonshotai-cn`。

先按 key 所属产品选 route，不能只因模型名称相同而混用：

| 购买的产品 | DSH route | 传输协议与 endpoint | 建议的凭据引用 |
|---|---|---|---|
| Kimi Open Platform（国际） | `moonshotai` | OpenAI Chat Completions，`https://api.moonshot.ai/v1` | `KIMI_GLOBAL_API_KEY` |
| Kimi Open Platform（中国） | `moonshotai-cn` | OpenAI Chat Completions，`https://api.moonshot.cn/v1` | `KIMI_CN_API_KEY` |
| Kimi Coding API | `kimi-coding` | Anthropic Messages，`https://api.kimi.com/coding` | `KIMI_API_KEY` |

这里的凭据引用名可由 DSH 自定义；官方 Open Platform 示例与 pi-ai 原生环境发现都使用 `MOONSHOT_API_KEY`，但国际与中国平台生成的 key 不可交叉使用。若要同时配置两条 Open Platform route，应在 DSH 配置中使用两个不同的 `apiKeyEnv` 引用。Kimi Coding 的原生变量是 `KIMI_API_KEY`。

`apiKeyEnv` 只写环境变量名。不要把 key 写入 `settings.yaml`、`headers`、脚本或本文档；DSH 在每次请求时解析该引用。

## 推荐的纯配置

以下是 provider 对应的候选配置。当前实际 DSH settings 只保留已验证的 `moonshotai-cn`，避免国际、Coding 和中国 Open Platform 的同名模型互相干扰。

```yaml
llm-pi-ai:
  providers:
    moonshotai:
      displayName: Kimi Global
      apiKeyEnv: KIMI_GLOBAL_API_KEY
      models:
        - id: kimi-k3
        - id: kimi-k2.7-code
        - id: kimi-k2.7-code-highspeed
        - id: kimi-k2.6
    moonshotai-cn:
      displayName: Kimi China
      apiKeyEnv: KIMI_CN_API_KEY
      models:
        - id: kimi-k3
        - id: kimi-k2.7-code
        - id: kimi-k2.7-code-highspeed
        - id: kimi-k2.6
    kimi-coding:
      displayName: Kimi Coding
      apiKeyEnv: KIMI_API_KEY
      models:
        - id: k3
        - id: kimi-for-coding
        - id: kimi-for-coding-highspeed
```

这是对已有 provider catalog 的收窄，不会改变对应 route 的 endpoint、协议、工具兼容设置或模型能力。声明 `models` 会替换该 route 的完整目录，所以每个要在 Web 中保留的模型都必须列出；若希望直接使用本机 catalog 的全部模型，可完全省略 `models`。

不要把 `moonshotai` / `moonshotai-cn` 改为 `kimi-coding` 的 endpoint 或协议。前两者是 OpenAI Chat Completions，后者是 Anthropic Messages；`kimi-coding` 的订阅 OAuth 可以经 harness 的授权 seam 登录——pi-ai 提供 login 的 provider 走 OAuth 或交互式 key（key 在 pi-ai 自己的登录提示里输入，不落在 DSH 配置里），凭据存到 `llm-pi-ai/<provider id>` 并在跨进程锁下自动刷新（`packages/llm/llm-pi-ai/README.md:12`、`:93`，实现见 `src/login.ts`、`src/auth.ts`）。`apiKeyEnv` 仍是并列可用的接入路径，纯配置接入选它。

## 模型与 effort

Kimi Open Platform 官方当前列出 `kimi-k3`、`kimi-k2.7-code`、`kimi-k2.7-code-highspeed` 和 `kimi-k2.6`；推荐默认选 `kimi-k3`，代码任务再选 K2.7 Code 或其高速版。当前本机 pi-ai catalog 还保留若干旧预览模型，它们只是安装目录历史数据，不应仅因此加入日常配置。

| 模型 | 官方能力或定位 | 本机 DSH catalog 的关键记录 | effort 结论 |
|---|---|---|---|
| `kimi-k3` | 通用推理模型 | 1M context、128K 最大输出、图片、工具与历史兼容 | DSH 实际公开 `low`、`high`、`max`；分别发送同名 `reasoning_effort` |
| `kimi-k2.7-code` | 代码模型 | 256K context、图片与工具 | 官方要求 thinking 始终开启；不要把 DSH 的通用档位理解为可关闭或精确控制 Kimi 思考强度 |
| `kimi-k2.7-code-highspeed` | 同参数的高速代码模型 | 与 K2.7 Code 相同能力记录 | 同上 |
| `kimi-k2.6` | Open Platform 模型 | 256K context、图片 | 本机目录标记为 reasoning，但没有官方已核实的可选 effort 映射；保留供应商默认值 |

K3 的官方 `reasoning_effort` 只有 `low`、`high`、`max`，默认是 `max`；不要自行添加 DSH 通用的 `minimal`、`medium` 或 `xhigh`。K3 的多轮和工具调用还必须原样回传 assistant message 中的 `reasoning_content`，本机 catalog 已为该模型保留相应兼容标记。这正是使用内置 route 而非手工 `openai-completions` route 的原因。

K2.7 Code（含高速版）支持流式和工具调用，但官方说明 thinking 强制开启、必须保留思考内容，并且不应传 `thinking: disabled` 或自定义 `temperature`。这与 K3 的 `reasoning_effort` 机制不同，不能互相套用。

本机 `moonshotai` 和 `moonshotai-cn` catalog 还列有 `kimi-k2-0711-preview`、`kimi-k2-0905-preview`、`kimi-k2-thinking`、`kimi-k2-thinking-turbo`、`kimi-k2-turbo-preview` 和 `kimi-k2.5`，连同上表的四个模型共十个。`kimi-coding` catalog 则列有 `k3`、`k3-256k`、`kimi-for-coding`、`kimi-for-coding-highspeed` 四个 Anthropic Messages 模型。前者的一批预览/旧模型不属于官方当前推荐列表，`kimi-k2.5` 与 Moonshot V1 也不向新注册用户开放并计划在 8 月 31 日下线；除非账户和实际 `GET /models` 已确认需要，默认不要加入 Web 配置。

## 官方依据与验证范围

- 国际平台和中国平台均使用 OpenAI Chat Completions 的 `POST /chat/completions` 与 `GET /models`，官方示例使用 `Authorization: Bearer $MOONSHOT_API_KEY`：[国际 API Overview](https://platform.kimi.ai/docs/api/overview)、[中国 API Overview](https://platform.kimi.com/docs/api/overview)、[国际 List Models](https://platform.kimi.ai/docs/api/list-models)、[中国 List Models](https://platform.kimi.com/docs/api/list-models)。
- 官方模型目录与推荐模型：[Kimi Models](https://platform.kimi.ai/docs/models)。
- K3 的 reasoning 参数和历史回传要求：[Use Thinking Models](https://platform.kimi.ai/docs/guide/use-thinking-models)。
- K2.7 Code 的 256K、多模态、工具、流式和 thinking 限制：[K2.7 Code Quick Start](https://platform.kimi.ai/docs/guide/kimi-k2-7-code-quickstart)。
- 通用 SSE 与工具调用格式：[Chat API](https://platform.kimi.ai/docs/api/chat)、[Tool Calls](https://platform.kimi.ai/docs/guide/use-kimi-api-to-complete-tool-calls)。

本机 key 来自 `platform.kimi.com`，对 `https://api.moonshot.cn/v1/models` 成功列出 `kimi-k3`、`kimi-k2.7-code`、`kimi-k2.7-code-highspeed` 与 `kimi-k2.6`，而国际 endpoint 返回认证失败。因此它只配置到 `moonshotai-cn`，使用 `KIMI_CN_API_KEY`。该 key 已对 `kimi-k3` 的最小非流式文本请求返回 HTTP `200`、`finish_reason: stop` 和非空内容。

仍需经实际 DSH route 验证 K3 流式输出、三个 effort、工具调用与结果回传、持久会话 replay，以及 K2.7 Code 的工具回合。实际 DSH settings、凭据存储和可回退快照见 [DSH_web-multi-vendor-configuration.md](./DSH_web-multi-vendor-configuration.md)。
