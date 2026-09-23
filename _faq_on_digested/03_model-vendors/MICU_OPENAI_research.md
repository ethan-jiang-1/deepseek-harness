# MICU OpenAI/GPT Research: 2026-09 目录现状与 gpt-6 系实测

本稿记录 2026-09-23 对 MICU(`https://www.micuapi.ai/v1`)GPT 系模型的目录与可达性实测。请求使用 DSH 凭据服务中已存的 `CODEX_API_KEY_MICU`;凭据值未读取、打印、写入或复制,仅用于请求过程。它区分本次实测、2026-08-17 的历史记录和配置推断。

## 结论

MICU 当前目录在该 key 分组下的 gpt-5.6 / gpt-6 系只提供 3 个模型:`gpt-5.6-sol`、`gpt-6-sol`、`gpt-6-astra`(另有工具型模型 `codex-auto-review`)。`gpt-6-sol` 与 `gpt-6-astra` 的最小文本请求、SSE 流式全事件链(`gpt-6-astra` 为同日补测)与 effort 档位矩阵均已通过;`gpt-6-astra` 不接受 wire 值 `none`,其 `off` 档以省略 reasoning 参数实现。工具调用、工具结果回传和 replay 尚未验证。

DSH 挂载已于 2026-09-23 调整为 `gpt-5.6-sol`、`gpt-6-sol` 与 `gpt-6-astra`:原挂载的 `gpt-5.6-terra` 实测返回 `503 model_not_found`,已从两个配置层移除。目录按 key 分组过滤,`503 model_not_found` 不区分"模型不存在"与"该分组无渠道",因此未列出 id 的探测结论只对当前分组有效。

## 本次实测(2026-09-23)

### `GET /v1/models` 目录

Bearer 认证返回 HTTP 200,`data` 数组共 4 行:

| model id | `owned_by` | `supported_endpoint_types` |
|---|---|---|
| `codex-auto-review` | openai | openai |
| `gpt-5.6-sol` | openai | openai, anthropic |
| `gpt-6-astra` | openai | openai, anthropic |
| `gpt-6-sol` | openai | openai |

### 模型可达性

均经 `POST /v1/responses` 直连发出,固定短提示 `Reply with exactly: OK`,非流式;流式探测单独标注。只记录状态、结构与 usage,不保存模型文本或凭据。

| 模型 | 目录中 | 文本 | `xhigh` | SSE 流 | 本次状态 |
|---|---|---|---|---|---|
| `gpt-6-sol` | 是 | 200 `completed`,输出 `OK` | 200 `completed` | 200,完整事件链至 `response.completed` | 可按纯配置接入 |
| `gpt-6-astra` | 是 | 200 `completed`,输出 `OK`;另有一次 90s 读超时后重试通过 | 200 `completed` | 200,完整事件链至 `response.completed`(同日补测) | 可用;延迟 5.2s–33.4s 波动,有一次 90s 反例 |
| `codex-auto-review` | 是 | 200 `completed`,输出 `OK` | 未测 | 未测 | 可达;工具型模型,未做 agent 用途评估 |
| `gpt-5.6-terra` | 否(已移除) | 503 `model_not_found` | — | — | 对该分组已不可调用 |
| `gpt-5.6-luna` | 否 | 503 `model_not_found` | — | — | 对该分组已不可调用 |
| `gpt-6-luna` | 否 | 503 `model_not_found` | — | — | 未列出;探测证明该分组无渠道 |
| `gpt-6-terra` | 否 | 503 `model_not_found` | — | — | 未列出;探测证明该分组无渠道 |

错误体为 new-api 面板的 `new_api_error`:`{"code":"model_not_found","message":"No available channel for the current group. ..."}`。

### SSE 事件链(`gpt-6-sol`)

实测事件序列与 OpenAI Responses 规范事件名一致:`response.created` → `response.in_progress` → `response.output_item.added` → `response.content_part.added` → `response.output_text.delta` → `response.output_text.done` → `response.content_part.done` → `response.output_item.done` → `response.completed`,终态 usage 完整。DSH 的 `openai-responses` 适配器消费的正是这组事件,这是协议兼容的直接证据,但不证明工具调用事件路径。

### effort 档位矩阵(第三轮探测)

对两个 `gpt-6` 模型逐档发送 DSH 实际使用的 wire 值(`reasoning: { effort: <值> }`),短提示、`max_output_tokens: 512`;`xhigh` 引用上午轮结果:

| wire 值 | `gpt-6-sol` | `gpt-6-astra` |
|---|---|---|
| `none`(`off` 档) | 200 `completed` | 400 `unsupported_value` |
| `minimal` | 200 `completed` | 400 `unsupported_value` |
| `low` | 200 `completed` | 200 `completed` |
| `medium` | 200 `completed` | 200 `completed` |
| `high` | 200 `completed` | 200 `completed` |
| `xhigh` | 200 `completed`(上午轮) | 200 `completed`(上午轮) |
| `max` | 200 `completed` | 200 `completed` |

`gpt-6-astra` 对 `none` 的错误体是上游支持集的直接证据:"Unsupported value: 'none' is not supported with the 'gpt-6-astra' model. Supported values are: 'low', 'medium', 'high', 'xhigh', and 'max'."。`minimal` 在 `gpt-6-astra` 上返回同一错误模板,同样不可用。不发送 reasoning 字段的默认请求两模型均已通过,因此 `gpt-6-astra` 的 `off` 档以空值(省略参数)实现,`gpt-6-sol` 的 `off` 档照 `gpt-5.6-sol` 用 wire 值 `none`。

所有 200 探测的 `reasoning_tokens` 均为 0:矩阵证明的是参数接受与拒绝,不是档位间推理行为的实测差异。`minimal` 在 `gpt-6-sol` 上被接受,但为与 `gpt-5.6-sol` 的选择器一致未写入配置。

### MICU 中转注入的 instructions

`gpt-6-sol` 文本请求 usage 显示 `input_tokens: 4391`(`cached_tokens: 4224`),`gpt-6-astra` 为 `4125`(`cached: 3968`),而本地发送的提示只有约 10 个 token;`attribution.request_fields.instructions` 单独计量 4380。`codex-auto-review` 注入约 1450(无缓存)。含义:MICU 在中转侧注入了自己的系统提示并计入计费输入,成本估算与"发送了什么"判断都必须以服务端 usage 为准,不能只看本地请求体。

## 与 2026-08-17 目录的差量

2026-08-17 实测目录为 `codex-auto-review`、`gpt-5.3-codex-spark`、`gpt-5.5`、`gpt-5.6-luna`、`gpt-5.6-sol`、`gpt-5.6-terra` [GPT_research.md](./GPT_research.md)。本次差量:

| 变化 | 模型 |
|---|---|
| 仍在 | `codex-auto-review`、`gpt-5.6-sol` |
| 已移除 | `gpt-5.3-codex-spark`、`gpt-5.5`、`gpt-5.6-luna`、`gpt-5.6-terra` |
| 新增 | `gpt-6-astra`、`gpt-6-sol` |

`gpt-5.6-luna` 当时已表现不稳定(两次 `503 rate_limited`);本次整行消失。MICU 的目录随上游渠道变动,任何挂载都以当时实测为准。

## 当前 DSH 挂载状态

`/Users/bowhead/.dsh/settings.yaml` 与 `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml` 中的 `micu` route 保持一致:`api: openai-responses`、`baseURL: https://www.micuapi.ai/v1`、`apiKeyEnv: CODEX_API_KEY_MICU` [配置记录](./GPT_dsh-web-micu-configuration.md)。该调整已执行,见下节。

## 已写入的 DSH 配置(2026-09-23)

```yaml
llm-pi-ai:
  providers:
    micu:
      models:
        - id: gpt-5.6-sol
          reasoningEfforts:
            off: none
            low: low
            medium: medium
            high: high
            xhigh: xhigh
            max: max
        - id: gpt-6-sol
          reasoningEfforts:
            off: none
            low: low
            medium: medium
            high: high
            xhigh: xhigh
            max: max
        - id: gpt-6-astra
          reasoningEfforts:
            off:
            low: low
            medium: medium
            high: high
            xhigh: xhigh
            max: max
```

`gpt-5.6-terra` 已从两个配置层移除;`gpt-6-sol` 与 `gpt-6-astra` 已加入;`gpt-5.6-sol` 的声明未改动。两个 `gpt-6` 模型在逐档验证(见档位矩阵)后扩展为六档:`gpt-6-sol` 与 `gpt-5.6-sol` 完全一致;`gpt-6-astra` 同为六档,但 `off:` 为空值 —— 上游拒绝 wire 值 `none`(错误体明确列出支持集),而 DSH 对空值的语义是不发送显式 reasoning 参数,该路径已实测通过。未验证的档位不写入;不要仅因模型名或本机 `pi-ai` 目录存在就声明未验证档位。

`gpt-6-astra` 补测(同日晚些)通过后写入:两次文本与一次 SSE 流均为 200 `completed`,流式事件链完整至 `response.completed`;总延迟在 5.2s–33.4s 间波动,首个输出增量最迟 33.3s 到达,MICU 事件流中夹杂 `keepalive` 事件类型。这把早前的 90s 读超时降级为负载相关的偶发,但不消除延迟波动;日常使用再现挂起时用下方备份回滚。

写入与验证事实:

- 三次变更均同步写入 `/Users/bowhead/.dsh/settings.yaml` 与 `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml`,均保持 `0600`;每次替换后两文件 YAML 解析通过,`micu.models` 最终为 `gpt-5.6-sol`(6 档)、`gpt-6-sol`(6 档)、`gpt-6-astra`(6 档,`off` 为空值)。
- 每次变更对当次备份的 diff 复核均只含目标模型块,无遗留临时文件。
- 变更前 `0600` 备份已逐字校验:第一次(移除 terra、加入 `gpt-6-sol`)为 `/Users/bowhead/.dsh/settings.yaml.bak-20260923-142648-before-micu-gpt6` 与 `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml.bak-20260923-142648-before-micu-gpt6`;第二次(加入 `gpt-6-astra`)为 `/Users/bowhead/.dsh/settings.yaml.bak-20260923-171351-before-micu-gpt6-astra` 与 `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml.bak-20260923-171351-before-micu-gpt6-astra`;第三次(gpt-6 两模型扩展为六档)为 `/Users/bowhead/.dsh/settings.yaml.bak-20260923-182601-before-micu-gpt6-efforts` 与 `/Users/bowhead/.dsh/profiles/web/cordis.patch.yml.bak-20260923-182601-before-micu-gpt6-efforts`。恢复对应备份即撤销对应变更。
- 生效时机:全局安装的 `npx @deepseek-ai/dsh web` 当时未运行,下次启动即读取新配置;正在运行的 `ai_dsh_company` 源码实例设置了自己的 `DSH_HOME`,不读取 `~/.dsh`,不受本次变更影响。

## 未验证边界

本次未验证:`gpt-6` 两模型的工具调用、工具结果回传、replay、上下文窗口、最大输出、取消与中断恢复;各 effort 档位间的服务端推理行为差异(全部探测 `reasoning_tokens` 为 0,矩阵仅证明参数接受);`keepalive` 事件在 DSH 适配器路径上的实际影响(直接 HTTP 层确认其存在);注入 instructions 的内容审计;服务端数据保留策略。它们都不能从文本或流式文本路径的成功外推。

## 关联记录

- [GPT_research.md](./GPT_research.md) — 2026-08-17 的接入方式验证与 DSH 能力边界
- [GPT_dsh-web-micu-configuration.md](./GPT_dsh-web-micu-configuration.md) — 当前 `micu` route 的配置与回滚记录
- [MICU_DEEPSEEK_research.md](./MICU_DEEPSEEK_research.md) — MICU 的 DeepSeek 侧(与本稿无关,不在本稿范围)
- [answer.md](./answer.md) — 多 vendor 接入模式总答案
