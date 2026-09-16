# GPT Research Notes: MICU GPT-5.6 中转样本

本稿先核验本机样本和当前 DSH 源码，随后用已在进程环境中提供的 `CODEX_API_KEY_MICU` 发起了最小真实请求。未读取、打印、写入或复制凭据值。它区分本次实测、历史本机记录和配置推断。

## 结论

`codex_micu.sh` 把 MICU 配成 `https://www.micuapi.ai/v1` 上的 API-key 供应商，模型为 `gpt-5.6-sol`，推理级别为 `xhigh` [样本调用](../../../ait_exam_docker/cli_codex/final/codex_micu.sh:57)。它调用的生成器固定写入 `wire_api = "responses"` [生成器](../../../ait_exam_docker/cli_codex/final/generate_config.py:65)。本次真实 DSH 请求进一步验证：手工 `micu` route 通过 `openai-responses` 成功完成 `gpt-5.6-sol` 和 `gpt-5.6-terra` 的文本流、工具调用、工具结果回传和 replay；`sol` 的 `xhigh` 也已接受。

因此 MICU 当前无须开发新的 vendor 包：已挂载的通用 `dsh-llm-pi-ai` 能以一个手工 route 声明 `openai-responses`、endpoint、凭据引用和模型列表 [适配器说明](../../packages/llm/llm-pi-ai/README.md:47)。基础 bundle 默认将它以零 route 的休眠状态挂载，`$DSH_HOME/settings.yaml` 的 `llm-pi-ai` 段即可启用 [基础组合](../../packages/bundle/base/cordis.patch.yml:75)。

## 本次真实实验（2026-08-17）

实验均经 DSH 的 `dsh-llm-pi-ai` 手工 `micu` route 发出，而非直接调用 HTTP。route 使用 `api: openai-responses`、`baseURL: https://www.micuapi.ai/v1`、`apiKeyEnv: CODEX_API_KEY_MICU` 和只包含被测模型的手工目录。请求只含固定短提示与一个虚构的 `lookup_code` 工具；输出只记录结构和状态，不保存模型文本、工具参数内容或凭据。

| 模型 | `/v1/models` | 文本流 | 工具调用 + 工具结果回传 | replay | `xhigh` | 本次状态 |
|---|---|---|---|---|---|---|
| `gpt-5.6-luna` | 列出 | 曾两次得到 `503 model:rate_limited`，随后一次隔离 route 的最小文本请求通过 | 未测 | 未测 | 仅该次使用 `xhigh` 通过 | 可用性仍不稳定，暂不作为日常 route 模型 |
| `gpt-5.6-sol` | 列出 | 通过，带 usage 和 replay | 通过；第一轮以 `tool-calls` 结束，回传结果后第二轮 `stop` | 通过 | 通过，DSH 公开并发送 `xhigh` 后完成文本流 | 可按纯配置接入 |
| `gpt-5.6-terra` | 列出 | 工具试验的两轮流均通过 | 通过；第一轮 `tool-calls`，结果回传后第二轮 `stop` | 通过 | 未测 | 可按纯配置接入；其余 effort 待实测 |

`GET /v1/models` 返回 HTTP 200，模型列表为 `codex-auto-review`、`gpt-5.3-codex-spark`、`gpt-5.5`、`gpt-5.6-luna`、`gpt-5.6-sol`、`gpt-5.6-terra`。目录存在不保证稳定可调用：`luna` 曾两次得到相同的 `503` 和 `model:rate_limited`，DSH 将其归类为 `RATE_LIMIT`，但随后一次最小请求成功。这支持保留独立 route 并启用 route 内常规重试，但不证明跨 vendor 自动故障切换已经存在。

本次没有验证图片输入、上下文窗口、最大输出、取消、中断后的恢复、`luna` 工具调用或稳定性、`terra` 的 `xhigh`、其他推理档位或服务端数据保留政策。它们仍须单独验证，不能从成功路径外推。后续 Web 配置按本机 OpenAI Responses catalog 对 `sol` 与 `terra` 对称提供 `off`、`low`、`medium`、`high`、`xhigh`、`max`；这改善了选择器一致性，不构成对尚未实际请求的档位的验证。

## 样本能证明什么

- **协议意图：** MICU 脚本传入 endpoint、`gpt-5.6-sol` 和 `xhigh` [脚本](../../../ait_exam_docker/cli_codex/final/codex_micu.sh:59)；公共生成器把 provider 写成 `responses` [生成器](../../../ait_exam_docker/cli_codex/final/generate_config.py:55)。样本没有出现 `/responses` 的实际 HTTP 请求或响应。
- **认证引用：** 脚本要求一个名为 `CODEX_API_KEY_MICU` 的环境变量 [脚本](../../../ait_exam_docker/cli_codex/final/codex_micu.sh:26)，生成器写的是 `preferred_auth_method = "apikey"` 和该变量名 [生成器](../../../ait_exam_docker/cli_codex/final/generate_config.py:55)。这不证明 MICU 接受哪一种 HTTP 认证报头。
- **模型目录：** 生成器支持可选 `model_catalog_json`，但 MICU 调用未传该参数 [生成器](../../../ait_exam_docker/cli_codex/final/generate_config.py:61)。样本没有 `/models` 返回、其他 GPT-5.6 变体、上下文窗口或输出上限的证据。
- **非 DSH 配置：** `CODEX_HOME` 隔离、`disable_response_storage` 和 `--dangerously-bypass-approvals-and-sandbox` 都是这份 Codex 启动脚本的行为 [脚本](../../../ait_exam_docker/cli_codex/final/codex_micu.sh:47)，不应照搬为 DSH 接入要求，也不证明中转站不留存请求数据。

## DSH 对应能力与边界

DSH 手工 route 当前可选的协议正好包括 `openai-responses`、`openai-completions` 和 `anthropic-messages` [协议表](../../packages/llm/llm-pi-ai/src/provider.ts:47)。未知 route 必须完整提供 `api`、`baseURL` 和非空 `models`，否则配置在写入时被拒绝 [适配器说明](../../packages/llm/llm-pi-ai/README.md:115)。因此 MICU 应命名为独立 route，而不是覆盖 `openai`；这保留了官方 OpenAI 与中转站的可选性和会话来源。

`apiKeyEnv` 在 DSH 中是逐请求解析的凭据引用，不把 key 写入 settings [适配器说明](../../packages/llm/llm-pi-ai/README.md:36)。对 OpenAI-compatible route，DSH 的模型发现会请求 `<baseURL>/models`，并在有 key 时使用 `Authorization: Bearer …` [发现实现](../../packages/llm/llm-pi-ai/src/discovery.ts:323)。这是 DSH probe 的发送行为，不是 MICU 接受该报头或其 Responses 请求完全兼容的证据。

本机安装的 `pi-ai` 内置 `openai` catalog 含有 `gpt-5.6-luna`、`gpt-5.6-sol` 和 `gpt-5.6-terra` 定义，均为 `openai-responses`，并列出 `xhigh`/`max`、272,000 context 和 128,000 output [本地依赖目录](../../node_modules/@earendil-works/pi-ai/dist/providers/data/openai.json:1)。这是当前依赖的目录数据，不是 OpenAI 官方文档，不能直接继承给 MICU；手工 route 应只写中转实际广告并验证过的模型能力。

## 需要实测的最小集合

1. 用候选 key 执行 `GET /v1/models`，确认返回 OpenAI 风格的 `data` 数组和实际可用 model id。
2. 对 `/v1/responses` 进行最小 SSE 文本流请求，确认完成、取消和空输出错误均能正确处理。
3. 运行一次工具调用及工具结果回传，确认中转没有只实现纯文本 Responses。
4. 运行多轮对话并从持久会话恢复，确认历史和工具结果可再次发送。
5. 分别验证 `xhigh` 与不传推理级别时的接受情况和实际语义；不要从模型名推断它一定支持该参数。

如果任一项失败，先尝试该中转实际提供的 `openai-completions` 协议；若其认证、流事件或工具/历史语义又偏离这两种通用协议，才需要新增适配器或一个路由/故障切换插件。当前 `dsh-llm-retry` 只在原 provider 内重试，不会自动切换到另一个 vendor [重试说明](../../packages/llm/llm-retry/README.md:12)。
