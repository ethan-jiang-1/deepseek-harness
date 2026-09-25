# Yovole 研究 · new-api 中转的目录、实际路由与 DSH 接入（2026-09-25 实测）

基线：`https://ds-api.yovole.com/v1`，2026-09-25 于本机直连实测（无需 VPN），真实 key 打真实 endpoint。凭据来源见第三节；接入方案与 [DSH_howto-add-vendor-models.md](./DSH_howto-add-vendor-models.md) 的方案 1 一致，与 [TEAMOROUTER_research.md](./TEAMOROUTER_research.md)、[OPENROUTER_research.md](./OPENROUTER_research.md) 对照阅读。

## 一、结论速览

- **网关是 new-api（One API 分叉），不是官方直连**：响应头 `x-oneapi-request-id`、错误体 `"type":"new_api_error"`、中文错误文案。上游是自建推理服务（`system_fingerprint` 形如 `vllm-0.1.dev20904+…-tp8-…`，tp8 = 8 路张量并行）。
- **OpenAI 面可用**：`/v1/chat/completions`（普通 + 流式）、工具调用、`/v1/embeddings` 都实测通过。
- **另外提供 Anthropic 面**：`POST /v1/messages`（`x-api-key` + `anthropic-version`）实测 200，new-api 自行转换。
- **目录 33 个 id 与实际服务模型不是一一对应**：请求 `glm-5`、`kimi-k2.5`、`claude-haiku-4-5-20251001`、`DeepSeek-V4-Pro`、`DeepSeek-R1`、`DeepSeek-V3`、`glm-4.7`、`kimi-k2-instruct` 时，响应体 `model` 都是 `DeepSeek-V4-Flash`；`Qwen3-32B`、`Qwen3-14B` 落到 `qwen3.8-27b`；`gpt-oss-120b`、`gemma-4-31b`、`qwen3.6-27b` 则如实返回自身。**响应体 `model` 才是实际服务的模型，请求 id 不足为凭。**
- **推理字段是 `reasoning`**，不是 DeepSeek 官方的 `reasoning_content`；pi-ai 0.85.1 的 `openai-completions` 同时识别 `reasoning` / `reasoning_content` / `reasoning_text`，所以 DSH 侧不需要新 adapter。
- **档位按模型而异，两条线完全不同**：`qwen3.8-27b` 是 **`low` / `medium` / `xhigh`（默认）三档**，加 `reasoning_effort: "none"` 关闭，实测三档可分；`DeepSeek-V4-Flash` 上游自报 **`low` / `high` / `xhigh` / `max` 四档**（外加 `chat_template_kwargs.reasoning_effort` 取 [1,100] 整数），但实测约 3/4 的请求根本不推理，四档之间无法区分。详见第六节。
- **未知模型返回 HTTP 503**（`model_not_found`，文案「分组 default 下模型 X 无可用渠道」），不是 400/404。这是配置错误却以 503 表达，接入前要确认它不会被 retry 策略当成瞬时故障。
- **窗口比同类声明小得多，且输入输出共享同一个预算**：`DeepSeek-V4-Flash` = 262144、`qwen3.8-27b` = 131072（同模型在 OpenRouter / TeamoRouter 声明 1310720 / 131072），超限直接 400 而不截断。详见第七节。
- **key 已在本机 `~/.env`**，变量名 `AIDER_OPENAI_API_KEY`，与本次用户提供的 key 逐字节相同；但它不在 DSH 的凭据解析链上（第三节）。

## 二、服务形态（可核验事实）

| 项 | 实测结果 |
|---|---|
| Base URL | `https://ds-api.yovole.com/v1` |
| 认证 | `Authorization: Bearer <key>`；错误 key → 401 「无效的令牌」；不带 key → 401 「未提供令牌」 |
| 前置 | `server: nginx` |
| 网关 | new-api：`x-oneapi-request-id: 20260925160801678123780ssOExUfD`、`"type":"new_api_error"` |
| 模型目录 | `GET /v1/models`：`{data, object, success}`，每条 `id / object / created / owned_by / supported_endpoint_types`，**全部只声明 `["openai"]`**，无 contextWindow / maxTokens |
| Chat | `POST /v1/chat/completions`，普通与 `stream: true`（标准 `chat.completion.chunk` SSE）均通过 |
| 工具 | 通过：`finish_reason: "tool_calls"`，`tool_calls[].function.arguments` 为 JSON 字符串，id 形如 `chatcmpl-tool-abd6bf85f949c564` |
| 推理 | 响应/流式只有 `reasoning` 字段（14/14 个流式 delta 均用它），另有 `usage.completion_tokens_details.reasoning_tokens` |
| Anthropic | `POST /v1/messages` 200，返回 `type: "message"` + `claude_cache_*` usage 字段 |
| Embeddings | `POST /v1/embeddings`（`bge-m3`）200，返回真实向量 |
| 未知模型 | 503 `{"error":{"code":"model_not_found","message":"分组 default 下模型 does-not-exist-xyz 无可用渠道（distributor）…","type":"new_api_error"}}` |
| 账单 | `/v1/dashboard/billing/subscription`、`/v1/dashboard/billing/usage` 有响应，但数字是 new-api 默认量级（`hard_limit_usd: 100000000`、`total_usage: 2159071427800`），**不能当真实余额/配额读** |

## 三、凭据现状（「key 是不是已经在环境里」的答案）

- **在**：`~/.env` 里 `AIDER_OPENAI_API_KEY=sk-Tx5…`，与用户本次给出的 key **完全一致**（长度 51，sha256 前 8 位 `7124c872`）。该行所属注释是 `# GLM-4.7 API 配置`，属于**错标**：这条 key 打的是 Yovole 中转，只是恰好能调到 `glm-4.7`。
- **不在**：当前 shell 的环境变量；`~/.dsh/settings*`、`~/.dsh/profiles/*`、`~/.dsh/storages/*`；仓库受版本控制的文件（`git grep -il yovole` 空）；本目录 `_faq_on_digested/`；shell history（`~/.zsh_history`、`~/.bash_history`）；`~/.dsh/sessions`（1.3 GB 全量扫描无命中）。
- `~/.dsh/.credentials.yaml` 现有凭据 ref 共 6 条：`OPENROUTER_API_KEY`、`DEEPSEEK_API_KEY`、`CODEX_API_KEY_MICU`、`KIMI_CN_API_KEY`、`TEAMOROUTER_API_KEY`、`OPENCODE_API_KEY`——**没有** yovole 相关条目。
- 钥匙串里三个 `Yovole-Office` / `Yovole-Guest` / `yovole-office` 条目**不是 API key**：它们在 `System.keychain`，`desc = "AirPort network password"`，是无线网络密码。
- **关键坑**：家目录 `~/.env` 不在 DSH 凭据解析链上。链是「继承的进程环境 > `$DSH_HOME/.credentials.yaml` > `<cwd>/.env` > `$DSH_HOME/.env`」（`packages/credentials/credentials-local/src/index.ts:5`）。所以 key 躺在 `~/.env` 里，`dsh web` 也不会自动读到；要用它必须在 Models 页写入（落到 `.credentials.yaml`），或放进 `~/.dsh/.env`，或从启动 shell 导出成进程环境变量。

## 四、`/v1/models` 快照（2026-09-25，共 33 个 id）

| 类别 | id |
|---|---|
| DeepSeek 线 | `DeepSeek-V3`、`DeepSeek-V3.1`、`DeepSeek-V3.2`、`DeepSeek-V4-Flash`、`DeepSeek-V4-Pro`、`DeepSeek-R1`、`DeepSeek-R1-0528-Qwen3-8B`、`DeepSeek-R1-0528-Qwen3-8B-Instruct`、`nim.deepseek-r1-distill-llama-8b` |
| GLM | `glm-4.6`、`glm-4.7`、`glm-5`、`glm-5-nothink` |
| Kimi | `kimi-k2-instruct`、`kimi-k2.5` |
| Anthropic | `claude-haiku-4-5-20251001` |
| OpenAI 开源线 | `gpt-oss-120b`、`gpt-oss-20b` |
| Qwen | `Qwen3-14B`、`Qwen3-30B-A3B`、`Qwen3-32B`、`qwen3.5-27b`、`qwen3.6-27b`、`qwen3.6-35b`、`qwen3.8-27b`、`Qwen2.5-VL-32B-Instruct`、`Qwen2.5-VL-72B-Instruct`、`Qwen3-VL-30B-A3B-Instruct` |
| 其他 / 非对话 | `gemma-4-31b`、`eduChat-32B`、`bge-m3`（embedding）、`Qwen3-Embedding-8B`（embedding）、`kolors`（图像） |
| 分组 | 错误文案出现「分组 default」，即 new-api 的 default 分组 |

## 五、逐项实测证据（2026-09-25，真实 key 直连）

请求一律 `POST /v1/chat/completions`，`messages=[{role:user, content:"say PONG"}]`，`max_tokens=16`；「实服模型」取响应体 `model`：

| 请求 id | 实服模型 | `system_fingerprint` |
|---|---|---|
| `DeepSeek-V4-Flash` | `DeepSeek-V4-Flash` | `vllm-0.1.dev20904+g179dd0fa9-tp8-b6651772` |
| `DeepSeek-V4-Pro` | `DeepSeek-V4-Flash` | 同上 |
| `DeepSeek-V3.2` / `DeepSeek-V3` | `DeepSeek-V4-Flash` | 同上 |
| `DeepSeek-R1` | `DeepSeek-V4-Flash` | 同上 |
| `glm-5` / `glm-4.7` | `DeepSeek-V4-Flash` | 同上 |
| `kimi-k2.5` / `kimi-k2-instruct` | `DeepSeek-V4-Flash` | 同上 |
| `claude-haiku-4-5-20251001` | `DeepSeek-V4-Flash` | 同上 |
| `Qwen3-32B` / `Qwen3-14B` | `qwen3.8-27b` | 无 |
| `qwen3.6-27b` | `qwen3.6-27b` | 无 |
| `gpt-oss-120b` | `gpt-oss-120b` | 无 |
| `gemma-4-31b` | `gemma-4-31b` | 无 |

其余通过项：

- **流式**：`stream: true` 时首个 chunk 为 `{"delta":{"role":"assistant","content":""}}`，推理增量走 `delta.reasoning`，正文走 `delta.content`。
- **工具**：`tool_choice: "auto"` + 一个 `get_weather` 定义，模型回 `finish_reason: "tool_calls"`，参数 `{"city": "Beijing"}`。
- **多轮 replay**：把带 `reasoning_content` 的 assistant 消息塞回历史（模拟 pi-ai 的 replay 写法）返回 200，未报字段冲突。
- **Anthropic 面**：`/v1/messages` + `max_tokens: 16` 时返回空 `text` 且 `stop_reason: "max_tokens"`——推理吃满了预算，**小 max_tokens 会得到空正文**，这与 response 面同一现象。
- **未知模型**：503，见第二节。

## 六、reasoning 档位实测（2026-09-25 追加）

网关自身的 `reasoning_effort` 枚举是 **7 档**：`none` / `minimal` / `low` / `medium` / `high` / `xhigh` / `max`（传非法字面量时，网关自己的校验回 `Input should be 'none', 'minimal', 'low', 'medium', 'high', 'xhigh' or 'max'`）。**但这个枚举比上游宽**：各模型接受哪几档由上游决定，多传即 400。以下均为真实 key 实测。

### 6.1 `qwen3.8-27b`：三档 + 关闭（可分，可依赖）

上游自报的合法集合写在 400 的文案里：`minimal` / `high` / `max` 请求一律回

```
HTTP 400  Unexpected reasoning effort high. Supported types are xhigh (default), medium, and low.
```

`chat_template_kwargs.reasoning_effort` 的整数形式同样被拒。即：

| 档位 | 传值 | 实证 |
|---|---|---|
| 关闭 | `reasoning_effort: "none"` 或 `chat_template_kwargs.enable_thinking=false` | 8/8 无推理，简单题 completion 稳定 2 token |
| low | `reasoning_effort: "low"` | 8/8 推理，简单题 131 token（稳定） |
| medium | `reasoning_effort: "medium"` | 8/8 推理，简单题 112 token（稳定） |
| xhigh（默认） | 不传 / `"xhigh"` | 8/8 推理，简单题 73 或 132 token（双峰） |

难题（12 红 8 蓝 5 绿，不放回抽三个求三色各异的概率）上三档确实不同：low / medium / xhigh 各 3 次产出的思考长度与正文结构互不相同，`none` 则完全不出现思考字段。**这一条线的三档是可信的。**

两个必须记住的细节：

- 思考文本落在 **`reasoning_content`**（Qwen 惯例），不是 DeepSeek 线的 `reasoning`；用量在 **顶层 `usage.reasoning_tokens`**（如 70），不在 `completion_tokens_details` 里。
- `thinking: {"type":"disabled"}` 和 `chat_template_kwargs.thinking=false` **关不掉思考**（实测仍在推理），只有 `enable_thinking=false` 与 `reasoning_effort: "none"` 有效。

### 6.2 `DeepSeek-V4-Flash`：四档声明，实测不可依赖

上游自报：`low` / `high` / `xhigh` / `max`，或 `chat_template_kwargs.reasoning_effort` 取 [1,100] 整数：

```
HTTP 400  DeepSeek V4.1 reasoning_effort must be low, high, xhigh, max, or an integer within [1, 100] in chat_template_kwargs
```

（注意文案自称 **DeepSeek V4.1**。）`minimal` / `medium` 因此被上游拒。

但**档位在这条线上没有可观测效果**：同一配置各 12 次，只有约 1/4 的请求真的产生推理，其余 `completion_tokens=2`、无 `reasoning`：

| 配置 | 12 次中真的推理 | reasoning_tokens 序列 |
|---|---|---|
| 不传参数 | 3/12 | 0,0,0,0,0,0,46,46,0,0,46,0 |
| `none` | **0/12** | 全 0 |
| `low` | 4/12 | 46,0,45,0,0,45,0,0,0,0,0,46 |
| `high` | 3/12 | 0,0,0,0,0,0,46,0,46,0,0,46 |
| `xhigh` | 3/12 | 0,0,0,45,0,45,0,0,45,0,0,0 |
| `max` | 3/12 | 50,0,0,0,0,0,0,0,0,45,50,0 |
| `ctk.reasoning_effort=1` | 3/12 | 0,0,0,47,47,0,0,0,0,0,45,0 |

即：**只有 `none` 是稳定生效的（关得掉），其余四档和「不传参数」在统计上没有差别**。难题上同样如此（`high` 三次里两次无思考、一次有）。所以给 DSH 写 `reasoningEfforts` 时，这条线只能声明「关 / 开」，声明低中高档会在配置面上撒谎。

## 七、上下文窗口实测（2026-09-25）

方法是让服务端自己报数：上游把窗口上限写在 400 的文案里，再用 ±1 token 的小步长把边界卡死。

| 模型 | 总窗口（输入 + 输出共享） | 边界证据 |
|---|---|---|
| `DeepSeek-V4-Flash` | **262144**（256K） | `max_tokens=262139` + prompt 5 → 200；`262140` + 5 = 262145 → 400「This model's maximum context length is 262144 tokens」；另一条报错写 `max_model_len=max_total_tokens=262144` |
| `qwen3.8-27b` | **131072**（128K） | prompt 53 + `max_tokens=131015` → 200；`131016` → 400「maximum context length of 131072 tokens… total of 131069」 |

三个要点：

- **没有独立的输出上限**：两边都从同一个窗口里扣输出，`max_tokens` 必须 ≤ 窗口 − 输入。qwen 另有一条「This model supports at most 131072 completion tokens」的校验，数字与窗口相同，不是第二个上限。
- **超了是 400，不是截断**：上游拒绝而不是 clamp，所以 DSH 侧把 `contextWindow` / `maxTokens` 写大就直接报错。
- **对照「常规」**：同一模型在 OpenRouter / TeamoRouter 的声明是 `deepseek-v4-flash` **1310720** 窗口 / 131072 输出（见本机 patch 的 openrouter 段与 [TEAMOROUTER_research.md](./TEAMOROUTER_research.md)），yovole 这里是 **262144**，只有五分之一；`qwen3.8-27b` 是 128K，且与输出共享。

DSH 侧的含义：`contextWindow` 填上表数字；`maxTokens` 是「每次请求预留多少输出」，compaction 用 `messageBudget = contextWindow − reservedCompletionTokens` 反推可用输入（`packages/compaction/compaction-basic/src/config.ts:172`），所以它要按实际想要的输出长度填，**不能填满窗口**，否则可用输入会被压到接近零。

## 八、DSH 接入（2026-09-25 已执行）

`~/.dsh/profiles/web/cordis.patch.yml` 原有 6 条 route：`micu`、`openrouter`、`zai`、`moonshotai-cn`、`teamorouter`、`opencode-go`。本次按方案 1 追加第 7 条独立 route（不伪装成 `openai`，否则会话日志无法区分来源）——对备份的 diff 是**纯新增 28 行、0 行删除或修改**。

落地动作：

| 文件 | 动作 |
|---|---|
| `~/.dsh/profiles/web/cordis.patch.yml` | 在 `llm-pi-ai.config.providers` 末尾（`- id: ui-settings-general` 之前，即原第 297 行后）插入 `yovole` route |
| `~/.dsh/.credentials.yaml` | `refs` 增加 `AIDER_OPENAI_API_KEY`（复用家目录 `~/.env` 的同一把 key）；该 key 原本不在 DSH 凭据链上，不加这条 route 会解析不到凭据 |
| `~/.dsh/backups/cordis.patch.yml.bak-20260925-162403-before-yovole` | 回滚点 |
| `~/.dsh/backups/.credentials.yaml.bak-20260925-162403-before-yovole` | 回滚点 |

实际写入的 route（`compat` 放在 route 级：两个模型所需开关相同，`compat` 是 route profile 的合法字段，模型级会覆盖它）：

```yaml
      yovole:
        displayName: Yovole (new-api)
        apiKeyEnv: AIDER_OPENAI_API_KEY
        api: openai-completions
        baseURL: https://ds-api.yovole.com/v1
        compat:
          supportsReasoningEffort: true   # 缺它则整块档位静默失效，pi-ai 不发 reasoning_effort
          supportsStore: false
          supportsDeveloperRole: false    # 实测 yovole 对 role: developer 返回 400
          maxTokensField: max_tokens
        models:
          - id: DeepSeek-V4-Flash
            name: Yovole DeepSeek V4 Flash
            contextWindow: 262144
            maxTokens: 65536              # 策略值，不是实测上限：输入与输出共享 262144
            reasoningEfforts:             # 只声明实测稳定生效的开关；low/high/xhigh/max 与不传参数无差异
              off: none
              high: high
          - id: qwen3.8-27b
            name: Yovole Qwen3.8 27B
            contextWindow: 131072
            maxTokens: 32768              # 策略值；128K 是输入 + 输出的总预算
            reasoningEfforts:             # 三档已实测可分；DSH 的 high/max 只能映射到 xhigh，上游没有这两档
              off: none
              low: low
              medium: medium
              high: xhigh
              max: xhigh
```

**验证边界**：写完后 YAML 可被解析、7 条 route 与全部字段齐全、原有 6 条未变动（已用仓库内 `yaml` 复核）。**运行实例是否已热加载未能在本机确认**——`~/.dsh` 下的日志停在 2026-09-13，进程 stdout 不在这些文件里，`ps` 被沙箱拒绝；需要在 web 的模型选择器里目视确认出现这两项，否则重启一次 `dsh web` 必然加载。

**回滚**：把上表两个备份分别盖回原位，再存一次触发 patch watcher。

**不要照抄别家 vendor 的模型元数据**：`contextWindow` 用第七节的实测数字（yovole 的 DeepSeek-V4-Flash 只有别家声明的五分之一），`maxTokens` 是预留策略而非实测上限，`reasoningEfforts` 各模型互不相同（`qwen3.8-27b` 三档、`DeepSeek-V4-Flash` 实际只有开/关）；写多档就是配置面撒谎（参见 [answer.md](./answer.md) 关于「目录可见 ≠ 该模型可用」与逐档验证的要求）。

## 九、未验证与风险

- 计费形态与配额未知：账单端点返回的量级像占位符，无法判断是付费还是试用额度。
- 限速、并发、图片输入（`kolors` / VL 系列）、`glm-5-nothink` 行为均未验证。
- **窗口超限是 400，不 clamp**：DSH 侧若把 `contextWindow` / `maxTokens` 写大，或某次请求的 `max_tokens` 超过「窗口 − 输入」，上游直接 400，而不是截断。DeepSeek-V4-Flash 的 262144 与 qwen3.8-27b 的 131072 都是输入+输出共享（第七节）。
- **id 与实际模型不对应是最大风险**：把 `glm-5` 写进 route，实际跑的是 `DeepSeek-V4-Flash`，会话日志里的模型名会与实际供应商不符；如需可追溯，建议只用实测能自证的那几个 id（`DeepSeek-V4-Flash`、`qwen3.6-27b`、`gpt-oss-120b`、`gemma-4-31b`），或至少以响应体 `model` 为准建立对照表。
- **503 表达配置错误**：未知模型、分组无渠道都返回 503，接入后要确认 retry/错误分类不会把它当瞬时故障反复重试。
- **档位不可全信**：`DeepSeek-V4-Flash` 的 low/high/xhigh/max 在统计上与不传参数无差异（第六节），只有 `qwen3.8-27b` 的三档经重复实验确认可分；其余 31 个 id 的档位未测。
- 本次 key 在对话中明文出现过；它同时躺在 `~/.env`，若该文件曾同步或备份到别处，建议轮换。
