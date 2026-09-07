# DSH Web · 添加任意 vendor 模型：先看什么、改哪里（含 OpenRouter 现状，2026-08-28）

本文件是本 folder 的操作入口：今后要给 `dsh web` 添加或修改任何 vendor 的模型时，先按第一、二节走；OpenRouter 的现状与待办在第四节。分层机制与 zai 先例见 [GLM_change-log-zai-two-models-20260827.md](./GLM_change-log-zai-two-models-20260827.md)，vendor 协议依据见各 `*_research.md` 与 [answer.md](./answer.md)。

## 一、先看什么（全部只读，按顺序）

| # | 看哪里 | 回答什么问题 |
|---|---|---|
| 1 | 本 folder 的 `*_research.md` 与 `GLM_change-log-*` | 该 vendor 用哪种已有协议（`openai-responses` / `openai-completions` / `anthropic-messages`，或内置 catalog route）；哪些模型、哪些 effort 档已逐项验证 |
| 2 | `~/.dsh/profiles/web/cordis.patch.yml` | **web profile 唯一生效层**。现有 route 的格式样例；要加的条目最终必须出现在这里 |
| 3 | `~/.dsh/settings.yaml` | 镜像层。检查是否已有人写过该 vendor，避免两份漂移（openrouter 即教训，见第四节） |
| 4 | 安装的 pi-ai 目录（当前 `@earendil-works/pi-ai@0.82.1`，位于 dsh 安装的 node_modules） | route id 是否命中内置 provider：命中且条目未写 `api` 时整体复用内置 provider 的协议与 baseURL；模型 id 不在目录时必须显式写 `contextWindow`/`maxTokens`，否则静默吃路由默认 262144 / 32768 |
| 5 | `~/.dsh/.credentials.yaml` 与 `~/.zshenv` | `apiKeyEnv` 指向的变量能否解析；运行中的 web 进程不继承 shell 环境，只认受管凭据文件（热加载） |
| 6 | `DSH_HOME=~/.dsh dsh --profile web --dump-config` | 组合结果终裁：结构错误 fail loud，grep 目标模型 id 确认真正生效 |

`dsh` 不在 PATH。`npx -y @deepseek-ai/dsh@0.1.0-rc.7 --profile web --dump-config` 首跑可能因包下载超时（本次实测超 2 分钟）；可直接用缓存二进制 `~/.npm/_npx/b86ed90107c62dab/node_modules/.bin/dsh`（0.1.1-rc.2，秒级）。

## 二、改哪里（固定顺序）

1. **备份**：把要改的两个文件各 `cp` 一份 `*.bak-$(date +%Y%m%d-%H%M%S)-before-<原因>` 并 `chmod 0600`；恢复就是逐字节拷回。
2. **改补丁层** `~/.dsh/profiles/web/cordis.patch.yml`（唯一生效位置）：
   - 新 vendor → 新增独立 route id（独立 identity，不伪装 `openai`，日志与计费才可追溯）；
   - 已有 vendor → 在该 route 的 `models:` 数组里加条目；数组**整体替换**内置目录，列出什么就只有什么；
   - 条目可用字段：`id` `name` `contextWindow` `maxTokens` `input` `reasoningEfforts` `compat`；effort 合法档位 `off/minimal/low/medium/high/xhigh/max`，省略某档等价于显式关闭该档；
   - **`off` 不是万能档**：声明 `off:`（空）会让 pi-ai 在选 off 或未选 effort 时发 `reasoning: { effort: "none" }`（openrouter thinkingFormat 路径）——对**强制思考**的模型（GLM-5.3 系：thinking 只能 enabled，深度由 `reasoning_effort` 控制）直接 400 `Reasoning is mandatory`。这种模型的条目**不要声明 `off`**：省略后 `thinkingLevelMap.off = null`，pi-ai 不发 reasoning 参数，模型以自己的默认思考强度运行。判定一个模型是否强制思考：官方文档写明 `thinking` 不可关（GLM-5.3），或实测发 `reasoning: { effort: "none" }` 返回 400。zai 直连 route 的 GLM-5.3 两条目即无 `off`，是正确先例（见 [GLM_change-log-zai-two-models-20260827.md](./GLM_change-log-zai-two-models-20260827.md)）。
   - 模型 id 不在安装目录里 → 必须显式写 `contextWindow` 与 `maxTokens`（数据来源：vendor 官方模型页或其 `/models` 端点，写入时注明日期）。
3. **同步镜像**：`~/.dsh/settings.yaml` 同一段保持逐字一致；它对 web 不生效，只服务人工阅读与历史记录。
4. **凭据**（仅新 vendor）：真实 key 写 `~/.dsh/.credentials.yaml`（`0600`；credentials 服务热加载，运行中的 web 进程无需重启）。settings/patch 只留 `apiKeyEnv` 环境变量名；key 不进 settings、不进 `headers`、不再复制到 shell 启动脚本。
5. **验证**（顺序固定）：`dump-config` 退出 0 → grep 组合结果含目标 id → 用真实 key `curl` 该 endpoint 协议级实测（最小文本 → 工具往返 → 逐个 effort 档）→ 通过的才写进条目声明。有实例在跑则补丁 watcher 热加载，否则下次启动生效。
6. **记录**：验证证据记入对应 vendor 的 `*_research.md`（没有就新建）；改了什么、验过什么、还差什么，写进本 folder 的 change-log，保持可追溯。

## 三、能力阶梯（不要互相冒充）

模型选择器可见 ≠ 一次文本请求可用 ≠ 工具往返可用 ≠ 持续运行（replay/历史恢复）可用。每一层单独实测；条目里声明的每个字段对应一次通过的实测。第三方中转会收到完整系统提示、用户输入、工具 schema 与工具结果——接入前独立评估数据保留、地域与费用（见 [answer.md](./answer.md) 末节）。

## 四、OpenRouter 现状快照（2026-08-31：route 在补丁层，5 个模型）

openrouter route 在 `~/.dsh/profiles/web/cordis.patch.yml`（settings.yaml 为镜像），displayName "OpenRouter"，协议继承内置 provider 的 openai-completions，`apiKeyEnv: OPENROUTER_API_KEY`（凭据有效）。5 个模型全部带显式 `contextWindow`/`maxTokens` 与实测过的 effort 档位：

- `deepseek/deepseek-v4-pro`
- `deepseek/deepseek-v4-flash`
- `deepseek/deepseek-v4-flash-vision-exp`（text+image）
- `z-ai/glm-5.3`（2026-08-31 重新加入，六档 effort 全实测，无 `off`——强制思考）
- `z-ai/glm-5.3-flash`（2026-08-31 重新加入，text+image，六档 effort 全实测，无 `off`）

2026-08-28 曾加入 8 个（含带日期 id 与 nemotron/glm/minimax 跨家三个），随后用户剔除 5 个：带日期 id 与无日期别名同义、别名跟随最新版；跨家三个弃用；2026-08-31 用户决定将 glm-5.3 两个重新暴露（走 OpenRouter）。`agent-default-model` 为 `openrouter / deepseek/deepseek-v4-flash`。全部实测证据、剔除清单与备份记录见 [OPENROUTER_research.md](./OPENROUTER_research.md)。

## 五、OpenRouter 剩余待验证

通过 DSH 的工具往返、replay/历史恢复、流式下 effort 行为、context/maxTokens 真实边界、图片输入路径——均未实测，不宣称。验证后更新 [OPENROUTER_research.md](./OPENROUTER_research.md)。

## 六、2026-09-07 现状更新

- **新 route `teamorouter`**：`api: openai-completions` + `baseURL https://api.teamorouter.com/v1` + `apiKeyEnv: TEAMOROUTER_API_KEY`，4 个付费模型 `deepseek-v4-pro`/`deepseek-v4-flash`/`glm-5.3`/`glm-5.3-flash`，六档恒等 + `off:` 空档，`contextWindow`/`maxTokens` 为官方口径占位值。TeamoRouter 对 GLM-5.3 **非强制思考**（与 Z.ai 直连/OpenRouter 不同），故保留 `off` 是安全的。全档实测、凭据/环境变量与备份记录见 [TEAMOROUTER_research.md](./TEAMOROUTER_research.md)。
- **命名约定（多 vendor 同挂 DeepSeek/GLM）**：DSH 选中后的模型标签只显示 `model.name`（无 vendor 徽标）。凡是可能与其他 vendor 同 id 的模型，一律在 `name` 前加 vendor 品牌前缀（`OpenRouter …`/`TeamoRouter …`/`Z.ai …`），id 不变；provider `displayName` 只负责选择器分组标题。当前 openrouter 5 条、zai 2 条、teamorouter 4 条均已按此命名。
- **默认模型**：`agent-default-model = teamorouter / deepseek-v4-pro / high`（settings.yaml）。
