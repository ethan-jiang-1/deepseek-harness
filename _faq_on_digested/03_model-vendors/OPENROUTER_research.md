# OpenRouter 研究 · DeepSeek v4 系（2026-08-28 实测）

基线：DSH `0.1.1-rc.2`（npx 缓存直跑），`@earendil-works/pi-ai@0.82.1`，OpenRouter `GET /models` 共 387 个模型。凭据 `OPENROUTER_API_KEY` 同时在 `~/.zshenv` 与受管 `~/.dsh/.credentials.yaml`（`0600`，热加载），`GET /models` 返回 200。

> **2026-08-31 更新**：重新加入 `z-ai/glm-5.3` 与 `z-ai/glm-5.3-flash` 两个模型（用户在 08-28 弃用后决定重新暴露，走 OpenRouter 而非 Z.ai 直连）。六档 effort（minimal/low/medium/high/xhigh/max）与工具往返逐项实测通过；flash 图片输入经 OpenRouter 实测通过、5.3 图片被拒。**不声明 `off`**：GLM-5.3 系强制思考，`off` 会发 `reasoning: { effort: "none" }` 导致 400（先加 `off` 实测失败后移除，教训见 [DSH_howto-add-vendor-models.md](./DSH_howto-add-vendor-models.md)）。见「2026-08-31 增补」一节。

## Route 结构

route id `openrouter` 命中 pi-ai 内置 provider（内置目录仅 `ai21/jamba-large-1.7` 一个模型），条目未写 `api:` → 整体复用内置 provider，协议 **openai-completions**（dsh-llm-pi-ai `lib/index.js`：`api = request.api ?? base?.api ?? routeApi`；命中目录且未声明 `api` 时 `reuseCatalogProvider`）。`baseURL` 显式 `https://openrouter.ai/api/v1`。`compat.thinkingFormat: openrouter` 是受支持取值，但本 route 模型均直接接受标准 `reasoning_effort`（下方实测），无需 compat 声明。`input` 字段合法取值仅 `text` / `image`（`MODALITIES`），OpenRouter 的 video 输入无法在 DSH 声明，不宣称。

displayName 为 **"OpenRouter"**：曾因加入跨家模型从 "OpenRouter DeepSeek" 改名，剔除后未改回，保持对后续新增中性。

## 当前配置（2026-08-28 时点为 3 个模型）

> 现状见下方「2026-08-31 增补」；本节保留 08-28 剔除后的历史快照。

context / max output 取自 `/models` 的 `context_length` 与 `top_provider.max_completion_tokens`（2026-08-28）；价格为 prompt / completion 每百万 token。

| id | context | max out | 输入 | 价格 ($/M) | 实测 |
|---|---|---|---|---|---|
| `deepseek/deepseek-v4-pro` | 1048576 | 384000 | text | 0.00000087 / 0.00000174 | none/high/max 全 200 |
| `deepseek/deepseek-v4-flash` | 1048576 | 384000 | text | 0.000000088606 / 0.000000177212 | none/high/max 全 200 |
| `deepseek/deepseek-v4-flash-vision-exp` | 1048576 | 384000 | text+image | 0.00000044 / 0.00000132 | none/high/max 全 200（改 policy 后） |

`agent-default-model`（settings.yaml 用户键）为 `openrouter / deepseek/deepseek-v4-flash`：用户曾在 Web 选过 `z-ai/glm-5.3-flash` 为默认，该模型剔除时默认改到同类 flash 档。注意 dump-config 里 `agent-default-model` 插件显示的是 base bundle 静态默认（`deepseek-official / deepseek-v4-flash`），settings.yaml 的键由 settings 能力运行时消费，dump 看不到它。

## effort 档位实测（2026-08-28，固定小题，max_tokens 200–300）

当日共测 8 个模型，每模型三档：无参数（= 声明里的空 `off:`，不发送 effort）、`reasoning_effort: "high"`、`reasoning_effort: "max"`。全部 200、正文正确、`usage.completion_tokens_details.reasoning_tokens` 正常出现。据此声明 `off`（空）/ `high` / `max` 三档；其余档位（minimal/low/medium/xhigh）未测，不声明。`max` 取值被四家 endpoint（DeepSeek、NVIDIA、Z.ai、MiniMax）普遍接受。

## 已剔除的 5 个模型（用户决定，2026-08-28）

剔除原因：带日期的 `deepseek-v4-flash-0731`、`deepseek-v4-pro-0813` 与无日期别名指向同一模型线，别名跟随最新版本，带日期 id 冗余；跨家三个（`nvidia/nemotron-3-ultra-550b-a55b:free`、`z-ai/glm-5.3-flash`、`minimax/minimax-m3:free`）用户弃用。当日实测数据保留备查：

| id | context | max out | 输入 | 实测结论 |
|---|---|---|---|---|
| `deepseek/deepseek-v4-flash-0731` | 1310720 | 943718 | text | none/high/max 全 200 |
| `deepseek/deepseek-v4-pro-0813` | 1048576 | 384000 | text | none/high/max 全 200 |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1000000 | 65536 | text | none/high 200；max 首两次 502（Nvidia 上游过载，非参数拒绝），重试 200 |
| `z-ai/glm-5.3-flash` | 1310720 | 131072 | text+image | none/high/max 全 200 |
| `minimax/minimax-m3:free` | 1048576 | 943718 | text+image | none/high/max 全 200；其 `supported_parameters` 不列 `reasoning_effort` 但实际接受（reasoning tokens 随档位变化） |

若日后重新加入，按 [DSH_howto-add-vendor-models.md](./DSH_howto-add-vendor-models.md) 流程重新写入即可，上表数据仍可作起点；免费层（`:free`）模型会偶发 502/限流。

## `deepseek/deepseek-v4-flash-vision-exp` 的 policy 事件（已解决）

首次实测（2026-08-28 下午）：`/models` 列出该模型，但请求 404 `No endpoints available matching your guardrail restrictions and data policy. Configure: https://openrouter.ai/settings/privacy`——账号隐私/数据策略过滤了全部 endpoint，其余 DeepSeek 模型不受影响。用户随后在 openrouter.ai/settings/privacy 放宽设置，重测三档全 200。

## 2026-08-31 增补：重新加入 z-ai/glm-5.3 两个模型

用户在 08-28 弃用跨家模型后，决定将 `z-ai/glm-5.3` 与 `z-ai/glm-5.3-flash` 重新暴露，且走 OpenRouter（同一把 `OPENROUTER_API_KEY`，不新增凭据）。按 [DSH_howto-add-vendor-models.md](./DSH_howto-add-vendor-models.md) 流程：先实测后写入。

### /models 数据（2026-08-31 抓取）

两个模型均不在 pi-ai@0.82.1 内置 openrouter 目录（目录内 z-ai 型号止于 `glm-5.2`），必须显式写 `contextWindow`/`maxTokens`，否则静默吃路由默认 262144 / 32768。

| id | context | max out | 输入 | 价格 ($/M) |
|---|---|---|---|---|
| `z-ai/glm-5.3` | 1310720 | 131072 | text | 0.0000014 / 0.0000044 |
| `z-ai/glm-5.3-flash` | 1310720 | 131072 | text+image | 0.000000075 / 0.00000025 |

### 实测证据（2026-08-31，真实 key 直连 OpenRouter）

- **最小文本**：两模型均 200、正文正确。flash 是 thinking 模型：`max_tokens: 64` 时全被 reasoning 吃光（finish `length`），正文在 `max_tokens: 256` 下正常。
- **effort 全档位**：两模型 `none`（= 不发送参数）/ `minimal` / `low` / `medium` / `high` / `xhigh` / `max` 全部 200、正文正确，`reasoning_tokens` 随档位出现（0–85）。与 08-28 只测三档不同，本次七档全测。
- **工具往返**：两模型 `tools` + `tool_choice: auto` 均正确返回 `tool_calls`（calculator `{"a":2,"b":2}`）。这补上了 08-28 遗留的「工具未实测」缺口（至少 curl 层）。
- **图片输入**：flash 实测接受图片并正确描述（`image_tokens` 计入）；`z-ai/glm-5.3` 被拒，错误 404 `No endpoints found that support image input`——与 08-30 Z.ai 直连的 code 1210 同义。故 flash 声明 `input: [text, image]`，5.3 不声明。
- 备注：`glm-5.3` 的 `low` 档首次请求偶发空响应（网络抖动，非参数拒绝），重试 200。

### `off` 实测失败与移除（2026-08-31 下午）

首次写入时给两模型都声明了 `off:`（空）。DSH 实测暴露失败：选 `off` 或**不选 effort**（UI 默认路径，settings.yaml 的 `agent-default-model` 即此形态）时，pi-ai 的 openrouter thinkingFormat 路径把空 `off` 翻译成 `reasoning: { effort: "none" }`，Z.ai 返回 400 `Reasoning is mandatory for this endpoint and cannot be disabled.`（curl 复现同一 body；与 [GLM_change-log-zai-two-models-20260827.md](./GLM_change-log-zai-two-models-20260827.md) 记载的「GLM-5.3 thinking 只能 enabled」一致）。

修复：从两 GLM 条目移除 `off` 声明（`*.bak-20260831-115735-before-remove-glm53-off`，补丁层与 settings.yaml 各一份）。移除后 `thinkingLevelMap.off = null`，pi-ai 不发 reasoning 参数，模型以自己的默认思考强度运行；DSH 实测两模型不选 effort 均 `turn/end completed`（assistant 消息带 `reasoning` block），选择器只显示六档。

### 写入

1. 备份：`*.bak-20260831-114108-before-add-openrouter-glm53`（补丁层与 settings.yaml 各一份，`0600`）。
2. 补丁层 `~/.dsh/profiles/web/cordis.patch.yml` openrouter route `models:` 数组追加两条目（`[text, image]` 无空格格式）；settings.yaml 镜像同步（`[ text, image ]` 带空格格式，与文件既有风格一致）。
3. 移除 `off` 声明：`*.bak-20260831-115735-before-remove-glm53-off`（见上节）。
4. 校验：两文件 YAML 可解析；`DSH_HOME=~/.dsh dsh --profile web --dump-config` 退出 0，openrouter route 组合结果恰含 5 个 id（原 3 个 DeepSeek + 新 2 个 GLM），其余 route 未动。

## 仍未验证（不要据此宣称能力）

通过 DSH 的工具往返（curl 层已验证两 GLM 模型的 `tools`，但未走 DSH 实测）、replay/历史恢复、流式下的 effort 行为、context/maxTokens 真实边界（声明值来自 `/models` 自述）、图片输入路径（flash 经 OpenRouter 实测通过，未走 DSH 实测）。

## 变更与恢复

各批写入均带写入前备份（均 `0600`；恢复 = 逐字节拷回）：

1. DeepSeek 4 模型首次进补丁层（含修复原有 2 条目缺 contextWindow/maxTokens）：`*.bak-20260828-164737-before-add-openrouter-deepseek`
2. 跨家 4 模型 + displayName 改名：`*.bak-20260828-165202-before-add-openrouter-cross-vendor`
3. 剔除 5 个、留 3 个：`*.bak-20260828-170030-before-remove-openrouter-models`
4. 重新加入 z-ai/glm-5.3 两个模型：`*.bak-20260831-114108-before-add-openrouter-glm53`
5. 移除两 GLM 条目的 `off` 档（强制思考模型，见上节）：`*.bak-20260831-115735-before-remove-glm53-off`

校验：`DSH_HOME=~/.dsh dsh --profile web --dump-config` 退出 0，组合结果含预期模型 id。当日全程有一个 `dsh web` 实例在跑（0.1.1-rc.2），补丁 watcher 热加载；剔除时若某会话正选着被剔除的模型，该会话需在选择器里重选。

## 2026-09-07 增补：模型补 vendor 前缀 name（仅展示）＋ 默认模型迁出

同一天接入 teamorouter route（见 [TEAMOROUTER_research.md](./TEAMOROUTER_research.md)）时，为消除「多家 vendor 同挂 DeepSeek/GLM」的视觉歧义，给 openrouter 这 5 个模型条目补了 `name`（此前无 name、UI 按 id 显示）：

| id | name |
|---|---|
| `deepseek/deepseek-v4-pro-0813` | OpenRouter DeepSeek V4 Pro |
| `deepseek/deepseek-v4-flash-0731` | OpenRouter DeepSeek V4 Flash |
| `deepseek/deepseek-v4-flash-vision-exp` | OpenRouter DeepSeek V4 Flash Vision |
| `z-ai/glm-5.3` | OpenRouter GLM 5.3 |
| `z-ai/glm-5.3-flash` | OpenRouter GLM 5.3 Flash |

机制说明：DSH 选中后的当前模型标签只显示 `model.name`（不带 vendor 徽标），选前靠 provider `displayName` 分组标题。要「选完也认出 vendor」，办法是 vendor 前缀进 `name`（id 不变）。settings.yaml 的 `agent-default-model` 已由用户改为 `teamorouter / deepseek-v4-pro / high`（原 openrouter 默认不再生效）。改动在补丁层 + settings 镜像，dump-config 校验通过。
