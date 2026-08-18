# GLM Research Notes: Z.ai 的直接支持与纯配置边界

## 结论

独立安装的 `npx @deepseek-ai/dsh web` 当前使用 `@deepseek-ai/dsh@0.1.0-rc.6` 与 `@earendil-works/pi-ai@0.82.1`。该版本已经内置 `zai` 和 `zai-coding-cn` provider，不需要为 Z.ai/GLM 新建 DSH 插件，也不应把它伪装成 `openai` 或 `micu` route。

标准做法是给内置 `zai` route 配置一个凭据引用：

```yaml
llm-pi-ai:
  providers:
    zai:
      apiKeyEnv: ZAI_API_KEY
```

`apiKeyEnv` 仅存环境变量名。不要将 API key 写入 `settings.yaml`、`headers`、Shell 脚本或本文档。启动 `npx @deepseek-ai/dsh web` 的进程必须继承 `ZAI_API_KEY`；通过 DSH credentials 服务解析失败时，请求应在网络调用前以 `MISSING_CREDENTIAL` 失败。

## 两种 Z.ai endpoint

两者都使用 Bearer API key 与 OpenAI-compatible Chat Completions，但不是可互换的地址。

| 用途 | base URL | DSH route | 当前结论 |
|---|---|---|---|
| Z.ai Open Platform 标准 API | `https://api.z.ai/api/paas/v4` | 未配置 | 本机 key 能通过认证与模型列举，但最小文本请求返回 `429`、代码 `1113`：该产品没有可用余额或资源包；为避免同名模型误选，已移除手工 route |
| Z.ai Coding endpoint | `https://api.z.ai/api/coding/paas/v4` | `zai` | 当前 DSH/`pi-ai` 直接内置，含 Z.ai thinking、工具流和 replay 兼容设置；本机 `glm-5.3` 最小非流式文本请求返回 `stop` 与非空内容 |
| Z.ai Coding CN endpoint | `https://open.bigmodel.cn/api/coding/paas/v4` | `zai-coding-cn` | 当前 DSH/`pi-ai` 直接内置，凭据引用名应为 `ZAI_CODING_CN_API_KEY` |

不要把服务根 `https://api.z.ai/api/` 写成 `baseURL`：Chat Completions 需要 `/paas/v4` 这一段，DSH 内置 `zai` 又额外指向 `/coding/paas/v4`。

## 当前 `zai` 内置模型目录

以下为 DSH 实际运行依赖的 `zai` catalog，不是对 API key 权限或当前服务可用性的保证。

| API model ID | context | 最大输出 | DSH 目录中的 effort 行为 |
|---|---:|---:|---|
| `glm-4.5-air` | 131,072 | 98,304 | 支持 Z.ai thinking；未声明 `reasoning_effort` |
| `glm-4.7` | 204,800 | 131,072 | 支持 Z.ai thinking 与工具流 |
| `glm-5-turbo` | 200,000 | 131,072 | 支持 Z.ai thinking 与工具流 |
| `glm-5.1` | 200,000 | 131,072 | 支持 Z.ai thinking 与工具流 |
| `glm-5.2` | 1,000,000 | 131,072 | `minimal` 关闭 thinking，`low`/`medium`/`high` 发送 `high`，`max` 发送 `max` |
| `glm-5v-turbo` | 200,000 | 131,072 | 支持文本与图片、Z.ai thinking 与工具流 |

`glm-5.3` 有 Z.ai 官方模型页，标称文本输入输出、1M context、128K 最大输出、thinking 与 function calling。本机安装的 `pi-ai` Coding catalog 尚未列出该 ID，但 Coding endpoint 已用最小非流式文本请求验证成功；因此它已被显式加入 `zai` route。DSH 对该未知 ID 复用 `zai` provider 和 Coding base URL，并按 URL 自动启用 Z.ai thinking 格式。该最小测试不覆盖工具往返、replay 或 effort。

## 为什么内置 route 优先

内置 `zai` 不只是一个普通的 OpenAI base URL：它使用 `openai-completions`，同时让 pi-ai 在 reasoning 选择时发送 Z.ai 的 `thinking` 字段，并为已有工具调用开启 `tool_stream: true`。对 `glm-5.2`，它还知道 Z.ai 的 `reasoning_effort` 映射。

因此，能使用 `zai` 的 key 不应改成手工 `openai-completions` route；手工 route 会丢掉当前 catalog 已记录的模型能力和兼容设置。

## 官方模型与参数证据

Z.ai Quick Start 指定标准 API 的 `POST https://api.z.ai/api/paas/v4/chat/completions`、`Authorization: Bearer …`、模型 `glm-5.2`，并提供 OpenAI SDK 兼容示例：[Quick Start](https://docs.z.ai/guides/overview/quick-start.md)。官方 Function Calling 文档使用 OpenAI 格式的 `tools`、`tool_calls`、`tool_call_id` 回传：[Function Calling](https://docs.z.ai/guides/capabilities/function-calling.md)。官方流式文档说明 SSE 与 `data: [DONE]`：[Streaming Messages](https://docs.z.ai/guides/capabilities/streaming.md)。

官方 OpenAPI 当前列出 `glm-5.2`、`glm-5.1`、`glm-5-turbo`、`glm-5`、`glm-4.7`、`glm-4.7-flash`、`glm-4.7-flashx`、`glm-4.6`、`glm-4.5`、`glm-4.5-air`、`glm-4.5-x`、`glm-4.5-airx`、`glm-4.5-flash` 与 `glm-4-32b-0414-128k`；它声明 `reasoning_effort` 只由 `glm-5.2` 支持。该枚举与本机 Coding catalog 不同，不能跨 endpoint 互相抄写：[Chat Completion OpenAPI](https://docs.z.ai/api-reference/llm/chat-completion.md)。

## 本机实测与待验证项

`ZAI_API_KEY` 由运行中的 DSH credentials 服务解析为环境变量，未写入 settings 或本文档。标准 API 的 `/models` 请求成功，但 `glm-5.2` 最小文本请求返回 HTTP `429`、代码 `1113`（`Insufficient balance or no resource package`）。同一 key 调用 Coding endpoint 的 `glm-5.3` 最小非流式文本请求成功，返回 HTTP `200`、`finish_reason: stop` 和非空内容。这证明问题是 Standard 与 Coding 产品入口/资源包的区别，不是 API key 或 `/api/` 路径错误。

排查时曾将默认模型切到 `zai/glm-5.3`，随后 Web 选择器已将默认项改为用户所选模型。默认模型不是 Z.ai route 正确性的依据；若选择 GLM，应在会话模型选择器中明确选择 `zai / glm-5.3`。配置前快照为 `/Users/bowhead/.dsh/settings.yaml.bak-20260817-191500-before-glm-coding-default`，权限为 `0600`。

仍应经实际 DSH route 分别验证流式输出、工具调用和 replay；其中 `glm-5.2` 的每个公开 effort 也需单独验证。用户曾在对话中粘贴 API key，应在 Z.ai 控制台撤销并重新生成该 key。
