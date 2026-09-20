# GLM Research Notes: Z.ai 的直接支持与纯配置边界

> **2026-08-27 更新**：`dsh web` 的 zai route 已裁剪为 `glm-5.3` 与 `glm-5.3-flash` 两个 1M 上下文模型，且实际生效层是 profile 补丁层而非本文所述 settings.yaml；本文其余目录快照仍以当时的 `pi-ai@0.82.1` 为准。见 [GLM_change-log-zai-two-models-20260827.md](./GLM_change-log-zai-two-models-20260827.md)。
>
> **2026-08-30 更新**：两个 endpoint 的 `/models` 实测同列 10 个在售 id；`glm-5.3-flash` 实测接受图片输入，`glm-5.3` 服务端拒绝（仅文本）；官方 OpenAPI enum 已含 `glm-5.3`。见下方「2026-08-30 实测」一节与变更记录的同日增补。
>
> **2026-09-20 更新**：`/models` 出现第 11 个 id `glm-5.3-flashx`（Coding 与标准 endpoint 同列）；本机 Coding Plan 尚未包含该模型（错误码 `1311`），已按未验证状态加入 `zai` route 两层配置。见下方「2026-09-20 实测」一节。

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

官方 OpenAPI 当前（2026-08-30 抓取）列出 `glm-5.3`、`glm-5.2`、`glm-5.1`、`glm-5-turbo`、`glm-5`、`glm-4.7`、`glm-4.7-flash`、`glm-4.7-flashx`、`glm-4.6`、`glm-4.5`、`glm-4.5-air`、`glm-4.5-x`、`glm-4.5-airx`、`glm-4.5-flash` 与 `glm-4-32b-0414-128k` 共 15 个文本 id，另列 6 个视觉 id（`glm-5v-turbo`、`glm-4.6v`、`glm-4.6v-flash`、`glm-4.6v-flashx`、`glm-4.5v`、`autoglm-phone-multilingual`）；`reasoning_effort` 由 GLM-5.2 及以上支持，`glm-5.3` 只接受 `low`/`high`/`max`，`glm-5.2` 将 `none`/`minimal` 映射为跳过思考、`low`/`medium` 映射为 `high`、`xhigh` 映射为 `max`，默认 `max`；GLM-5.3 的 `thinking` 只能 enabled，深度由 `reasoning_effort` 控制。该枚举与本机 Coding catalog 不同，不能跨 endpoint 互相抄写：[Chat Completion OpenAPI](https://docs.z.ai/api-reference/llm/chat-completion.md)。

## 2026-08-30 实测：/models 目录与图片输入

两个 endpoint 的 `GET /models`（Coding `/api/coding/paas/v4/models` 与标准 `/api/paas/v4/models`）当日返回同一份 10 个 id 的在售列表：`glm-4.5` 与 `glm-4.5-air`（created 2025-07-27）、`glm-4.6`（2025-10-01）、`glm-4.7`（2025-12-21）、`glm-5`（2026-02-10）、`glm-5-turbo`（2026-03-14）、`glm-5.1`（2026-03-27）、`glm-5.2`（2026-06-16）、`glm-5.3` 与 `glm-5.3-flash`（均为 2026-08-13）；括号为响应的 `created` 字段。`/models` 不返回视觉模型，也不返回 `glm-4.7-flash`/`glm-4.5-x` 等仍在文档 enum 内的旧型号和 `glm-5.2-highspeed`（pi-ai@0.84.3 catalog 新增项）：`/models` 是在售清单，不是官方接受过的请求全集。

图片输入经 Coding endpoint 用同一张图（Z.ai 文档示例 `register.png`）实测：`glm-5.3-flash` 返回 HTTP `200` 并正确描述图片（`prompt_tokens: 5608`，图片真实进入上下文；`thinking` 禁用时 `reasoning_tokens: 0`）；`glm-5.3` 返回 HTTP `400`、代码 `1210`（`messages.content.type is invalid, allowed values: ['text']`）。即 flash 能收图、5.3 服务端只收文本，且该差别官方 OpenAPI 未记载（flash 不在任何 enum）。据此 zai route 仅给 flash 条目声明 `input: [text, image]`，见 [GLM_change-log-zai-two-models-20260827.md](./GLM_change-log-zai-two-models-20260827.md) 的 2026-08-30 增补。只验证了 `image_url` 输入；`video_url`、`file_url` 未验证，不宣称。

## 2026-09-20 实测：glm-5.3-flashx 出现在 /models 但套餐未含

Coding 与标准两个 endpoint 的 `GET /models` 当日均列出第 11 个 id `glm-5.3-flashx`；其 `created` 与 `glm-5.3`/`glm-5.3-flash` 同为 1786636800（2026-08-13），属于追加进目录而非新 created。最小非流式文本请求返回错误码 `1311`（`Your current subscription plan does not yet include access to GLM-5.3-FlashX`），与官方模型页「GLM-5.3-FlashX is not yet available on the plan」一致（[GLM-5.3-Flash/FlashX](https://docs.z.ai/guides/vlm/glm-5.3-flash)）。

官方文档口径：FlashX 是 Flash 的加速版（200 tokens/s），320B 总参 / 18B 激活，稀疏 + 线性注意力混合架构；1M context / 128K 最大输出；原生多模态（text/image/video/file 输入）；文本参数与 GLM-5.3 一致，`thinking.type` 只支持 `enabled`，推荐 `reasoning_effort: max` 与 `tool_stream: true`。价格约为 Flash 的 2.5 倍；OpenRouter 已上架 `z-ai/glm-5.3-flashx`。

尽管无法实测，应用户要求已将其加入 `zai` route 两层配置（`settings.yaml` 与 `~/.dsh/profiles/web/cordis.patch.yml`，备份后缀 `bak-20260920-180800-before-add-glm-5-3-flashx`）。条目按官方「与 GLM-5.3 文本参数一致」沿用 `glm-5.3` 的保守 effort 映射（`low/medium/high→high`，`max→max`），`name` 带 `(unverified)` 后缀以便在选择器中识别；**未声明 `input`**——多模态未实测，且 5.3 系已有 flash 收图 / 5.3 拒图的分化先例，图片输入等真实访问后单独验证再声明。任何能力（文本流、工具往返、replay、各档 effort、图片）在套餐开通后仍须逐项实测。

## TODO · glm-5.3-flashx 等开放后实验（2026-09-20 挂起）

**触发条件**：Z.ai Coding 直连不再报 `1311`，或 OpenRouter 共享池不再报 `429/1302`。先用一行命令探路，通了再做全量实验：

```sh
set -a; source ~/.zshenv; set +a
curl -sS -m 30 https://api.z.ai/api/coding/paas/v4/chat/completions \
  -H "Authorization: Bearer $ZAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"glm-5.3-flashx","messages":[{"role":"user","content":"hi"}]}'
```

**当时被挡的原因**：Z.ai 直连 `1311`（套餐未含，官方明说 "not yet available on the plan"）；OpenRouter `z-ai/glm-5.3-flashx`（1M ctx，in $0.37/M、out $1.25/M）连续 7 次重试全部 `429/1302` 上游共享池限流，BYOK 也无济于事（本机 Z.ai key 无 FlashX 权限）。

**实验清单**（逐项通过后才更新 zai 条目、去掉 `(unverified)` 后缀）：

1. 最小非流式文本请求（HTTP 200、`finish_reason: stop`、非空内容）。
2. 流式输出与 `tool_stream: true` 工具往返。
3. 各 effort 档逐一实测：`minimal`/`low`/`medium`/`high`/`max` 实际接受值（官方说与 GLM-5.3 一致、`thinking` 只能 `enabled`，但须实测确认配置里的 `low/medium/high→high` 映射不会被判非法）。
4. 图片输入：官方宣称原生多模态，但 5.3 系已有 flash 收图 / 5.3 拒图分化；用 flash 当时同款 `register.png` 实测，通过才给条目补 `input: [text, image]`。
5. DSH 内走完整链路验证：Web 选择器选 `zai / glm-5.3-flashx`，跑一轮带工具的真实任务，确认 replay 与会话日志正常；`video_url`/`file_url` 不在清单内，不宣称。




`ZAI_API_KEY` 由运行中的 DSH credentials 服务解析为环境变量，未写入 settings 或本文档。标准 API 的 `/models` 请求成功，但 `glm-5.2` 最小文本请求返回 HTTP `429`、代码 `1113`（`Insufficient balance or no resource package`）。同一 key 调用 Coding endpoint 的 `glm-5.3` 最小非流式文本请求成功，返回 HTTP `200`、`finish_reason: stop` 和非空内容。这证明问题是 Standard 与 Coding 产品入口/资源包的区别，不是 API key 或 `/api/` 路径错误。

排查时曾将默认模型切到 `zai/glm-5.3`，随后 Web 选择器已将默认项改为用户所选模型。默认模型不是 Z.ai route 正确性的依据；若选择 GLM，应在会话模型选择器中明确选择 `zai / glm-5.3`。配置前快照为 `/Users/bowhead/.dsh/settings.yaml.bak-20260817-191500-before-glm-coding-default`，权限为 `0600`。

仍应经实际 DSH route 分别验证流式输出、工具调用和 replay；其中 `glm-5.2` 的每个公开 effort 也需单独验证。用户曾在对话中粘贴 API key，应在 Z.ai 控制台撤销并重新生成该 key。
