# TeamoRouter 研究 · DeepSeek v4 / GLM-5.3 最新付费型号接入 DSH（2026-09-07 实测）

基线：`api.teamorouter.com`（2026-09-07 于 VPN 后直连实测），用户目标 = **只要最新 DeepSeek / GLM 的正常付费模型，不要免费档**。凭据 `TEAMOROUTER_API_KEY` 前缀 `sk-teamo-`。本文件记录服务形态、官方 DSH 配置样板、`/models` 快照、逐模型实测证据与挂入 `dsh web` 的方案；写入动作未执行，等「先实测后写入」补全后按 [DSH_howto-add-vendor-models.md](./DSH_howto-add-vendor-models.md) 落盘。

> 网络前提：`teamorouter.com` 对境外出口做了地区 gating（2026-09-07 本机直连 apex/www/docs/api 全部 TCP 超时；VPN 后同机即刻 200）。要在这个 repo 环境跑真实 key 实测，需保证该站点可达。

## 一、服务形态与 DSH 接入的关键差异（vs OpenRouter）

OpenRouter route 是**命中 pi-ai 内置 provider 目录**而整体复用其协议/baseURL，条目可不写 `api`。**TeamoRouter 不在 pi-ai@0.82.1 内置目录**，route 必须**显式声明 `api` + `baseURL`**——`api: openai-completions` 是官网样板给出的取值（下述三节）。模型 id 采用**裸名**（`deepseek-v4-pro`），不是 OpenRouter 的 `deepseek/deepseek-v4-pro` 斜杠名。

## 二、官方文档要点（api-integration + install-deepseek-harness，2026-09-07 抓取）

官网自称主打编程智能体工具（Claude Code / Codex / Kimi / OpenClaw / **DeepSeek Harness**），多协议一套 key：

- **Base URL**：`https://api.teamorouter.com/v1`（OpenAI/Gemini 兼容；Anthropic 用 `/v1/messages`）。认证头按协议：OpenAI/Gemini `Authorization: Bearer sk-teamo-…`；Anthropic `x-api-key: sk-teamo-…` + `anthropic-version: 2023-06-01`；Gemini native 另接受 `x-goog-api-key`。
- Endpoint：`/v1/chat/completions`、`/v1/responses`、`/v1/messages`、Gemini `/v1beta/models/{model}:generateContent`、`/v1/images/*`；另有 `/v1/billing/usage|costs|requests|balance`。
- **Fast mode**（原 Priority processing）：请求加 `"service tier": "fast"` 走优先队列。
- 官方页「Supported models」把 DeepSeek 标注为 `deepseek-v4-pro`（8 月 13 官方版）、`deepseek-v4-flash`（7 月 31 官方版）——与 OpenRouter 侧带日期 id（`-0813`/`-0731`）对应同一模型线。
- **官方有专门的 DSH 安装文档** `/docs/install-deepseek-harness`，其给的路由样板（在 web profile 分层里即完整可用的 provider 骨架）：

```yaml
llm-pi-ai:
  providers:
    teamorouter:
      displayName: TeamoRouter
      apiKeyEnv: TEAMOROUTER_API_KEY
      api: openai-completions
      baseURL: https://api.teamorouter.com/v1
      models:
        - id: deepseek-v4-pro
          name: DeepSeek V4 Pro
        - id: deepseek-v4-flash
          name: DeepSeek V4 Flash
        - id: glm-5.3
          name: GLM 5.3
        - id: glm-5.3-flash
          name: GLM 5.3 Flash
  # agent-default-model: { provider: teamorouter, model: deepseek-v4-pro }   # 官方默认模型，由用户另定
```

官方一键脚本写的是 `~/.dsh/settings.yaml` + 把 key 落 `~/.dsh/.env`；对本 repo 的 `web` profile 而言 settings 仅镜像、`.env` 不被运行中 web 进程读取，**照抄会踩本 folder 记录过的分层坑**，只把 route 骨架移植到补丁层即可（见五、六节）。

## 三、/models 实测快照（2026-09-07，`GET /v1/models`，共 45 个 id）

OpenAI 最小格式，每条仅 `id / object / owned_by`，**不含 context/maxTokens**。按 owned_by 分组（DeepSeek / GLM 之外列全以便对照在架规模）：

| owned_by | id |
|---|---|
| deepseek (4) | `deepseek-v4-pro`、`deepseek-v4-pro-260425`（带日期别名）、`deepseek-v4-flash`、`deepseek-v4-flash-vision-exp` |
| zhipu (3) | `glm-5.3`、`glm-5.3-flash`、`glm-5.2` |
| teamorouter 自营 (11) | `deepseek-v4-pro-free`、`deepseek-v4-flash-free`、`glm-5.3-flash-free`、`gpt-5.4-fast / -mini-fast / 5.5-fast / 5.6-luna-fast / sol-fast / terra-fast / gpt-6-astra-fast`、`kimi-k3[1M]` |
| openai (8) | `gpt-5.4`、`gpt-5.4-mini`、`gpt-5.5`、`gpt-5.6-luna/sol/terra`、`gpt-6-astra`、`gpt-image-2` |
| anthropic (10) | `claude-fable-5`、`claude-fable-5-1`、`claude-haiku-4-5`、`claude-haiku-4-5-20251001`、`claude-opus-4-6/4-7/4-8/5`、`claude-sonnet-4-6/5` |
| google (7) | `gemini-3.1-pro-preview`、`gemini-3.1-flash-image`、`gemini-3.5-flash(-lite)`、`gemini-3.6/3.7/3.8-flash` |
| moonshot (1) | `kimi-k3`；xai (1) `grok-4.6` |

免费 alias 是**独立 id**（`-free` 后缀、每日 0 点刷新配额），与付费同 id 不是同一计费实体。**用户不要免费档 → 候选清单 = 付费 5 个**：`deepseek-v4-pro`、`deepseek-v4-flash`、`deepseek-v4-flash-vision-exp`、`glm-5.3`、`glm-5.3-flash`。

## 四、逐模型实测证据（2026-09-07，真实 key 直连 `POST /v1/chat/completions`）

固定小题 PONG，`max_tokens` 64–512；usage 中 `completion_tokens_details.reasoning_tokens` 记作 rt。

### 最小文本（付费 5 个全 200）

| model | 结果 | 备注 |
|---|---|---|
| `deepseek-v4-pro` | 200 PONG | rt 27（默认即思考）；`reasoning_effort: high` 亦 200（rt 10） |
| `deepseek-v4-flash` | 200 PONG | rt 12（flash 也是 thinking） |
| `deepseek-v4-flash-vision-exp` | 200 PONG | 仅文本测；图待补 |
| `glm-5.3` | 200 PONG | rt **0**，无任何参数也直接出正文（见下，非强制思考） |
| `glm-5.3-flash` | 200 PONG | rt 106（thinking 型） |

### glm-5.3 的思考行为：与 Z.ai 直连 / OpenRouter 不同，**非强制思考**

同题 `glm-5.3` 发 `reasoning_effort: low` / `max` / `reasoning:{effort:"none"}` 全部 200 且 rt=0。对照本 folder 记录：Z.ai Coding 直连与 OpenRouter 上 GLM-5.3 系强制思考、`off` 会 400 `Reasoning is mandatory`（`GLM_change-log-zai-two-models-20260827.md`、`OPENROUTER_research.md` 2026-08-31 增补）。**因此这条 route 的条目声明是否需要处理「无 `off`」应按 TeamoRouter 实测行为来定，不能照抄 zai/openrouter 的结论**；DSH 层的 `off`/六档映射待补（见七）。

> 观察：`glm-5.3` 的 usage 里出现 `claude_cache_creation_5_m_tokens`、`cost` 等 Anthropic 风格字段且 prompt cached 64——疑似该路由后端经 Anthropic-compatible 通道代理。仅记录，不据此宣称任何能力。

### 工具往返（3 个全正确返回 tool_calls）

prompt「Use the calc tool to compute 2+2」+ `tools` + `tool_choice: auto`：

| model | 结果 |
|---|---|
| `glm-5.3` | finish=tool_calls，`calc` args `{"a":2,"b":2}` |
| `glm-5.3-flash` | finish=tool_calls，同上 |
| `deepseek-v4-pro` | finish=tool_calls，同上 |

`deepseek-v4-flash` 与 `vision-exp` 未单测工具，同族不替它声明。

### 免费 alias 的 402（仅记录，用户不用免费档）

`deepseek-v4-pro-free` / `deepseek-v4-flash-free` 当日返回 402 `free_request_quota_exhausted`（额度耗尽，次日 0 点刷新；type `free_request_quota_exhausted`）。属账号配额非模型故障，也说明免费档不可靠，不用是对的。

## 五、挂入 DSH 的待定项（写条目前必须定，否则踩「静默吃路由默认值」坑）

pi-ai 对目录外未知 id 的解析：`contextWindow` 条目声明 → 内置目录 → 路由默认 262144；`maxTokens` 同理默认 32768；`input` 默认 `['text']`（发图前显式拒，非静默）。TeamoRouter `/models` 不给 context/maxTokens，官方 DSH 样板也不写——**若照抄，deepseek-v4 / glm-5.3 都按 256K/32K 跑而非真实的 1M 级**。三个待定：

1. 每个候选模型的真实 `contextWindow`/`maxTokens`（来源：上游厂商口径 + TeamoRouter 实测，写入时注明日期）。
2. 图片输入：`deepseek-v4-flash-vision-exp` 与 `glm-5.3-flash` 的 `input` 是否可声明 `[text, image]`（需带图走 DSH 实测）。
3. effort 六档与 `off` 在 pi-ai `api: openai-completions` 路径下的实际映射（curl 层已证 `reasoning_effort` 全档位被接受且 glm-5.3 非强制思考，DSH 层行为待实测）。

## 六、route 写入方案（web profile，按 howto 顺序）

1. **备份**两份文件：`~/.dsh/profiles/web/cordis.patch.yml` 与 `~/.dsh/settings.yaml` → `*.bak-$(date +%Y%m%d-%H%M%S)-before-add-teamorouter`，`0600`。
2. **补丁层**新增 route id `teamorouter`（独立 identity，不伪装 openai/openrouter），displayName `TeamoRouter`；`api: openai-completions`、`baseURL: https://api.teamorouter.com/v1`、`apiKeyEnv: TEAMOROUTER_API_KEY`；`models:` 数组 = 候选 5 个付费模型（清单 = 只列这些），字段按第五节实测结果补 `contextWindow/maxTokens/input/reasoningEfforts`。`models:` 会整体替换任何内置目录，天然免疫上游目录变动。
3. **镜像** settings.yaml 同步逐字一致。
4. **凭据**：真实 key 只写 `~/.dsh/.credentials.yaml`（`0600`、credentials 服务热加载，运行中 web 无需重启）；patch/settings 只留 `apiKeyEnv`。key 不落 repo。
5. **校验**：`DSH_HOME=~/.dsh dsh --profile web --dump-config` 退出 0、组合结果 grep 到 5 个 id。
6. **默认模型** `agent-default-model` 由用户从候选定（此 route 建议 `teamorouter / deepseek-v4-pro`），可稍后 Web 里改。

## 七、仍未验证（不要据此宣称能力）

DSH 层（非裸 curl）的工具往返、带图请求与 `input: [text, image]` 声明、流式下的 effort 行为、replay/历史恢复、context/maxTokens 真实边界（补丁层现为官方口径镜像值）。验证后回填本文表格与补丁层条目。

## 2026-09-07 增补：effort 全档扫描 + 挂入落盘

### 全档扫描（真实 key 直连，4 模型 × reasoning_effort 六档全部 200，无 400）

固定小题 PONG，`max_tokens` 256；rt = `completion_tokens_details.reasoning_tokens`。

| model | minimal | low | medium | high | xhigh | max | 说明 |
|---|---|---|---|---|---|---|---|
| `deepseek-v4-pro` | rt 0 | 10 | 23 | 21 | 22 | 21 | 档位生效，rt 随档变化 |
| `deepseek-v4-flash` | 0 | 55 | 25 | 11 | 26 | 46 | 同上 |
| `glm-5.3` | 0 | 0 | 0 | 0 | 0 | 0 | 参数被接受但 rt 恒 0（上游不走 reasoning 或不上报） |
| `glm-5.3-flash` | 16 | 69 | 51 | 97 | 118 | 19 | thinking 型，rt 基本随档 |

补充：`glm-5.3` 无参数默认 rt=0、`reasoning:{effort:"none"}` 也 200——TeamoRouter 上 GLM-5.3 **非强制思考**，与 Z.ai 直连/OpenRouter（强制思考、`off`→400）不同。故补丁条目保留 `off:` 空档是安全的（= 不发 reasoning 参数，模型默认行为），六档恒等映射全部过测。

### 挂入 `dsh web`（route `teamorouter`，4 个付费模型）

- **生效层** `~/.dsh/profiles/web/cordis.patch.yml`（`api: openai-completions` + `baseURL https://api.teamorouter.com/v1` + `apiKeyEnv: TEAMOROUTER_API_KEY`）；settings.yaml 镜像同段。4 条目 = `deepseek-v4-pro` / `deepseek-v4-flash` / `glm-5.3` / `glm-5.3-flash`，各带 `name`（**按用户决定用品牌全名前缀**：`TeamoRouter DeepSeek V4 Pro` 等，见下）、`contextWindow`/`maxTokens`（**沿用 openrouter/zai 官方口径的占位值，未用 TeamoRouter 实测校准**）、六档恒等 + `off:` 空档。
- **name 品牌前缀（2026-09-07 同批）**：为让「选中后的模型标签」也认得出 vendor（DSH 当前模型指示只显示 `model.name`，无 vendor 徽标），三家重叠模型统一改为 vendor 前缀命名——`teamo*`（`TeamoRouter …`）、openrouter 5 条补 `OpenRouter …`、zai 2 条补 `Z.ai …`；id 不变。展示机制见 [OPENROUTER_research.md](./OPENROUTER_research.md) 同日期增补。
- **凭据**：`TEAMOROUTER_API_KEY` 已入 `~/.dsh/.credentials.yaml` `refs`（`0600`，credentials 服务热加载）；`.zshenv` 同步 `export`（照旧例）。
- **备份**（恢复 = 拷回）：`cordis.patch.yml` / `settings.yaml` / `.credentials.yaml` 各一份 `.bak-20260907-120710-before-add-teamorouter`（`0600`）、`~/.zshenv.bak-20260907-120837-before-add-teamorouter`。name 前缀批量未另备份，恢复点以上述加入前备份为准。
- **校验**：`DSH_HOME=~/.dsh dsh --profile web --dump-config` 退出 0，组合结果 teamorouter route 恰含 4 个 id、`off: null` 语义正确，其余 route（micu/openrouter/zai/moonshotai-cn）未动。
- **默认模型**：用户已在 settings 设 `agent-default-model = teamorouter / deepseek-v4-pro / high`（运行中的 web 实例在 127.0.0.1:3080，patch/credentials 均热加载，无需重启；界面刷新/新建会话即可见新分组）。

## 2026-10-01 增补：/models 快照 diff（45 → 47 个 id）+ gpt-6.1-sol 实测

`GET /v1/models` 复测（真实 key 直连）。**已挂入 DSH 的 4 个付费模型不受影响**，GLM 三条与付费 DeepSeek 4 条原样保留。

新增 10 个：

| owned_by | 新 id |
|---|---|
| openai (+5) | `gpt-6-sol`、`gpt-6.1-sol`、`gpt-6-luna`、`gpt-image-2.5-flare`、`gpt-image-2.5-sunburst` |
| anthropic (+3) | `claude-opus-5-5`、`claude-sonnet-5`、`claude-sonnet-5-5`（注意 `claude-sonnet-5-5` 的 owned_by 是大写 `Anthropic`，独立条目） |
| deepseek (+1) | `deepseek-flash`（新线，未实测） |
| 其他 (+1) | `typesafe-ai/jev`（新厂商，未实测） |

下架 8 个：全部 7 个自营 `-fast` 别名（`gpt-5.4-fast / -mini-fast / 5.5-fast / 5.6-*-fast / sol-fast / terra-fast / gpt-6-astra-fast`）；免费档 `deepseek-v4-pro-free` 被 `deepseek-flash-free` 取代（免费档仍不用）。

`gpt-6.1-sol` PONG 实测：200，约 10 s，6 个输出 token。首测 60 s 零字节超时，重试即过——疑似冷启动，未复现。注意其 `prompt_tokens` 4392（我们只发数词）且 3840 cached——后端疑似注入系统侧上下文，与 09-07 记录的 GLM Anthropic 通道疑点同类，仅记录，不据此宣称能力。

### 同日挂入：7 个新模型全测全通，4 个新条目入 route

PONG 实测（`POST /v1/chat/completions`，max_tokens 128）**7/7 全 200 且正文 PONG**，耗时 1.7–4.1 s：`gpt-6-sol`、`gpt-6.1-sol`、`gpt-6-luna`、`claude-opus-5-5`、`claude-sonnet-5`、`claude-sonnet-5-5`、`deepseek-flash`（rt 10，thinking 型）。sol 注入疑点仅 `gpt-6-sol` / `gpt-6.1-sol` 出现（pt 4392），`gpt-6-luna` pt 12 正常。

route 层现状核对：`gpt-6-luna`、`gpt-6-sol`、`gpt-6-astra`、`claude-opus-5-5` 已于 09-24 两批加入（`bak-20260924-100219/101730`）；本日补齐 4 条 = `gpt-6.1-sol` / `claude-sonnet-5` / `claude-sonnet-5-5` / `deepseek-flash`，均带品牌全名前缀 `name` + 六档恒等映射 + `off: null` 空档，`contextWindow`/`maxTokens` 未实测前不声明（与 09-24 批次同例，吃路由默认 256K/32K，勿当真实边界）。settings.yaml 已不存在（仅补丁层），无镜像步骤。备份：`cordis.patch.yml.bak-20261001-101225-before-teamorouter-new-models`。校验：`--dump-config` 退出 0，组合结果 12 条 teamorouter 条目含 4 个新 id、effort 映射逐字正确。

## 来源

- 官方 API 集成文档与 DSH 安装文档（VPN 后抓取）：`https://teamorouter.com/docs/api-integration`、`https://teamorouter.com/docs/install-deepseek-harness`
- 第三方综述：[ruanyf/weekly#10506（TeamoRouter 迁移指南）](https://github.com/ruanyf/weekly/issues/10506)、[cc-switch README（合作 preset）](https://raw.githubusercontent.com/luxuana/cc-switch/main/README.md)、[DeepSeek V4 Pro Free 每日 200 次指南](https://dev.to/gaige_dorsey/deepseek-v4-pro-free-the-ultimate-guide-to-the-200-requestsday-quota-90g)、[DeepSeek V4 Pro vs Flash 分层路由](https://dev.to/lola_lin_a1be8395c517b081/deepseek-v4-pro-vs-flash-the-ultimate-guide-to-routing-by-difficulty-79p)
