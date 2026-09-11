# OpenCode Go 研究 · opencode Zen「Go」套餐与「模型 + 用量」插件盘点（2026-09-11 实测）

## 结论

OpenCode Go 是 opencode（SST/Anomaly）的 **$10/月订阅**，走 `https://opencode.ai/zen/go/v1/` 下按模型分协议的端点，不是一个 GLM/Z.ai 套餐。用户提供的 key（对话中出现，本文不记录）实测为 **Go 套餐 key**：GLM 双区域的套餐用量端点均 401 拒绝，Go 自己的 `/usage` 与 `/models` 均 200。本 folder 此前没有 opencode 相关记录；GLM_research.md 里的 `zai`/`zai-coding-cn` 是 Z.ai 官方 Coding 套餐，与 Go 是两个不同产品，key 不通用。

官方依据：[Go | OpenCode](https://opencode.ai/docs/go/)（2026-09-10 更新）、[智谱 OpenCode 接入页](https://docs.bigmodel.cn/cn/coding-plan/tool/opencode)（GLM Coding Plan 的 opencode 接入，另一回事）。

## 当次实测证据（key 以 Bearer 携带，均未写盘）

| 请求 | 结果 |
|---|---|
| `GET /zen/go/v1/usage` | HTTP 200：`rolling 0%`、`weekly 6%`、`monthly 12%` 已用，各带 `resetsAt`；`status:"ok"` |
| `GET /zen/go/v1/models` | HTTP 200，37 个在售 id（glm-5.3 / glm-5.3-flash / glm-5.2 / deepseek-v4-pro / deepseek-v4-flash / kimi-k3 / minimax-m3 / qwen3.8-max / grok-4.6 / gpt-5.6-luna 等） |
| `POST /zen/go/v1/chat/completions`（glm-5.3-flash，无 session 头） | HTTP 400 `MissingSessionID`：要求 `x-opencode-session` |
| `POST /zen/go/v1/chat/completions`（同请求 + `x-opencode-session: <自定 id>`） | HTTP 200，正常回复（16 token 全部进 `reasoning_content`，finish=length） |
| `GET open.bigmodel.cn/api/monitor/usage/quota/limit` 与 `api.z.ai` 同路径 | 401「令牌已过期或验证不正确」→ 该 key 不是 GLM Coding Plan key |

## 端点与协议（官方口径）

| 模型族 | 端点 | 协议 |
|---|---|---|
| GLM-5.x / Kimi / LongCat / DeepSeek V4 系 / MiMo / Hy | `https://opencode.ai/zen/go/v1/chat/completions` | OpenAI-compatible |
| MiniMax M2/M3 / Qwen3.x | `https://opencode.ai/zen/go/v1/messages` | Anthropic Messages |
| Grok 4.6 / GPT 5.6 Luna / Muse Spark | `https://opencode.ai/zen/go/v1/responses` | OpenAI Responses |
| 模型清单 | `GET https://opencode.ai/zen/go/v1/models` | — |
| 套餐用量 | `GET https://opencode.ai/zen/go/v1/usage` | 三窗口百分比 + 重置时间 |

用量窗口：每个模型有月度美元上限，5 小时窗口 = 月度 20%、周窗口 = 50%、月窗口 = 100%（如 GLM-5.3-Flash 月度 $60、GLM-5.3/Kimi K3/DeepSeek V4 Pro 月度 $15）。`/usage` 的 rolling/weekly/monthly 分别对应这三档。客户端必须随请求发送 `x-opencode-session`（稳定会话 id），否则如上 400。

## 「提供模型 + 用量检查」插件盘点（搜索结果）

| 工具/插件 | 出模型 | 查用量 | 说明 |
|---|---|---|---|
| **pi（pi.dev）+ `@d3ara1n/pi-usage-block`** | ✅ 内置 `opencode-go` provider | ✅ 状态栏 + `/usage` 命令 | 目前唯一「模型 + 用量」闭环。usage block 内置 OpenCode Go（`/zen/go/v1/usage`）、Z.AI、Z.AI Coding CN（`/api/monitor/usage/quota/limit`）等，rolling/weekly/monthly 百分比 + 重置倒计时；第三方 provider 可经 `@d3ara1n/pi-usage-block-core` 自建 UsageProvider |
| opencode 官方 | ✅ 原生 | 控制台 [opencode.ai/auth](https://opencode.ai/auth) | 文档只承诺控制台查用量；`/usage` 端点公开（上表） |
| CodePilot v0.56.3 | ✅ Go 订阅接入（OpenAI 兼容 + Anthropic 双渠道） | 未见 | [Release notes](https://github.com/op7418/CodePilot/releases/tag/v0.56.3) |
| opencodex | 代理（GLM 供给 Codex/Claude Code） | ✅ GLM Coding Plan quota | [PR #2028](https://github.com/lidge-jun/opencodex/pull/2028)：`/api/monitor/usage/quota/limit` 双区域探测（`TOKENS_LIMIT`/`CREDIT_LIMIT` 行，unit 3+number 5=5h、unit 6+number 1=weekly） |
| glm-usage-monitor、LLMUsage | ✗ | ✅ 仅 GLM 套餐 | 不覆盖 Go 套餐 |

DSH 不能直接加载 `@d3ara1n/pi-usage-block`：那是 pi coding agent 的扩展（powerline/footer 扩展点），DSH 只内嵌 pi-ai 库，不运行 pi agent。

## DSH 侧现状

- 本地安装 `pi-ai@0.82.1` 的 catalog **已内置 `opencode-go` provider**（`dist/providers/opencode-go.js`：id `opencode-go`、name "OpenCode Zen Go"、凭据 env `OPENCODE_API_KEY`，同时挂 anthropic-messages / openai-completions / openai-responses 三协议）。挂进 `dsh web` 是纯配置（照 [DSH_howto-add-vendor-models.md](./DSH_howto-add-vendor-models.md) 的 zai/openrouter 先例），最新 pi-ai 为 0.85.1。
- 但 0.82.1 目录只有 16 条（glm-5.1/5.2、deepseek-v4-flash/pro、kimi-k2.6/2.7-code/k3、mimo-v2.5(-pro)、minimax-m2.7/m3、qwen3.6/3.7、hy3、grok-4.5），**没有 glm-5.3 / glm-5.3-flash / qwen3.8 / gpt-5.6-luna**；未知 id 会静默吃路由默认 256K/32K，须显式声明 `contextWindow`/`maxTokens`/`input`（同一族坑见 GLM 变更记录）。
- 用量插件：packages/ 内 grep 仅有本地 token 计量（token-meter、turn 用量 UI、session-stats），**无任何套餐百分比/余额查询插件**。若要在 DSH 里查 Go 用量，需自写一个 cordis 插件轮询 `/zen/go/v1/usage`（响应形如 `{usage:{rolling|weekly|monthly:{status,percent,resetsAt}}}`）。
- 兼容性：官方 [Known Problematic Clients](https://opencode.ai/docs/go/#where-can-i-use-it) 列出 DeepSeek Harness——session 头仅部分模型路径在发；裸 curl 复现了无头 400。官方追踪 [Discussion #5495](https://github.com/deepseek-ai/deepseek-harness/discussions/5495)；社区另有「部分模型 API key is invalid 临时方案」[Discussion #3538](https://github.com/deepseek-ai/deepseek-harness/discussions/3538)。

## 2026-09-11 挂载：`opencode-go` route 写入 `dsh web`（四模型）

按 [DSH_howto-add-vendor-models.md](./DSH_howto-add-vendor-models.md) 流程落盘；改前备份三份 `*.bak-20260911-224040-before-add-opencode-go`（0600）：`.credentials.yaml`、`profiles/web/cordis.patch.yml`、`settings.yaml`。凭据 `OPENCODE_API_KEY` 已写入 `.credentials.yaml` 的 `refs:`。

选型 = GLM 最新两个（`glm-5.3`、`glm-5.3-flash`）+ DeepSeek 现役两个（`deepseek-v4-pro`、`deepseek-v4.1-flash`；[DeepSeek 官方](https://api-docs.deepseek.com/quick_start/pricing/)确认 `deepseek-flash` 即 V4.1-Flash、ctx 1M / maxOut 384K，旧名 `deepseek-v4-flash` 已退役由 V4.1-Flash 顶替）。路由用 teamorouter 同形：显式 `api: openai-completions` + `baseURL: https://opencode.ai/zen/go/v1` + 路由级 `headers` 静态补 `x-opencode-session`——pi-ai 库（至 0.85.1）都不自动发该头，无头直接 400 `MissingSessionID`（官方把 DeepSeek Harness 列为 problematic client 的原因）。静态会话 id 的代价是所有会话共享一个 id，只影响路由/prompt-cache 优化，不影响鉴权。

### 逐项实测（Coding `/zen/go/v1/chat/completions`，全部带 session 头）

| 请求 | 结果 |
|---|---|
| glm-5.3 bare | 200（默认 thinking，600 token 全进推理） |
| glm-5.3 `thinking:{type:"disabled"}` | 400「GLM-5.3 is a thinking-only model」→ 与 Z.ai 直连一致，条目**不声明 off** |
| glm-5.3 zai 式 `thinking:{type:"enabled"}`+`reasoning_effort` | 400「Extra inputs are not permitted」→ Go 上游**不吃 thinking 字段**，条目不声明 thinkingFormat |
| glm-5.3 裸 `reasoning_effort` low / high / max | 全 200（low 在小题上 0 推理 token，与 Z.ai 直连同现象） |
| glm-5.3-flash 裸 `reasoning_effort` minimal | 400 [1210]「always engages in thinking…please use low, high, or max」 |
| glm-5.3-flash 裸 `reasoning_effort` low / max | 200 |
| flash 图片输入（1×1 png data URI） | 200 → 声明 `input: [text, image]`（仅验证接受，未测真实图片语义） |
| glm-5.3 图片输入 | 400「does not support image inputs」→ 保持 text |
| deepseek-v4-pro / v4.1-flash bare | 200（默认 thinking） |
| 两 deepseek `thinking:{type:"enabled"/"disabled"}` | 全 200，disabled 后 `reasoning_tokens: 0` |

### 条目设计要点

GLM 两条目：`compat.supportsReasoningEffort: true`（裸 `reasoning_effort` 实测接受），不声明 `off`/`minimal`/`medium`/`xhigh`（选中即走 off 路径、不发任何参数、模型保持默认 thinking）。DeepSeek 两条目：compat 沿用 pi-ai 目录（`thinkingFormat: deepseek` + `requiresReasoningContentOnAssistantMessages: true`，无 `supportsReasoningEffort`），`off: disabled` 使选中 off/未选时发 `thinking:{type:"disabled"}`（实测 rt=0）；minimal..max 六档在 Go 上坍缩为同一 wire 形态 `thinking:{type:"enabled"}`。ctx/maxTokens：GLM 双 1M/131072（pi-ai 0.85.1 目录），DeepSeek 双 1M/384000（官方 Models & Pricing）。

### 验证状态

`DSH_HOME=~/.dsh npx @deepseek-ai/dsh@0.1.5-rc.1 --profile web --dump-config` 退出 0，组合结果含 `opencode-go` 路由与全部四条目（`headers`、`input`、`compat` 原样保留）。仍未验证：DSH route 内完整 turn（工具往返、replay、流式下 effort 差异、多轮 assistant reasoning 回传）；若个别模型报「API key is invalid」参考社区 [Discussion #3538](https://github.com/deepseek-ai/deepseek-harness/discussions/3538)，session 头全覆盖追踪在官方 [Discussion #5495](https://github.com/deepseek-ai/deepseek-harness/discussions/5495)。
