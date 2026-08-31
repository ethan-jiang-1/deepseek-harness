# GLM 变更记录 · `dsh web` 的 zai route 只留 glm-5.3 与 glm-5.3-flash（2026-08-27）

## 结论

当前 `npx @deepseek-ai/dsh@0.1.0-rc.7 web` 的 Z.ai Coding route 只提供两个 1M 上下文模型：`zai / glm-5.3` 与 `zai / glm-5.3-flash`，其余 GLM 型号已从目录中移除。生效文件是 **`~/.dsh/profiles/web/cordis.patch.yml`**（profile 补丁层），不是 `~/.dsh/settings.yaml`；两份文件的 zai 段已改成完全一致以避免混淆。会话默认模型同时由用户改为 `{ provider: zai, model: glm-5.3-flash, reasoningEffort: medium }`。

## 关键勘误：哪一层说了算

`dsh --profile web --dump-config` 显示组合后的 `llm-pi-ai.providers` 只包含补丁层声明的 micu、zai、moonshotai-cn；用户层 `~/.dsh/settings.yaml` 里独有的 openrouter 根本没进 web 组合。此前 [DSH_web-multi-vendor-configuration.md](./DSH_web-multi-vendor-configuration.md) 把 `settings.yaml` 描述为生效位置，对 `web` profile 并不完整：loader 补丁条目按 id 覆盖，`providers.<id>.models` 这类数组由靠后的层整体替换。改配置时先想清楚目标 profile 读哪层，再用 dump-config 验证；本次两个文件的修改都有同后缀 `.bak-20260827-*-before-trim-zai-two-models` 备份（权限 0600）。

## `models` 字段语义与三个坑（来自 dsh-llm-pi-ai lib/index.js）

- **配置了 `models:` 就完全替换该 route 的内置 pi-ai 目录**（源码注释原话 "models already replaces the served catalog"）。所以列出的清单即最终清单，天然免疫上游 pi-ai 升级的目录增删——例如 npm 最新 `pi-ai@0.84.3` 已把 `glm-4.5-air`、`glm-5v-turbo` 移出 Coding 目录并新增 `glm-5.2-highspeed`，而本地安装仍是 `0.82.1`（内含 `glm-4.5-air/4.7/5-turbo/5.1/5.2/5v-turbo` 六个）。两版目录都没有任何 GLM flash 型号。
- **未知 ID 会静默吃路由默认上限**：`contextWindow` 解析顺序为 条目声明 → 同 id 内置条目 → 路由 `defaultContextWindow`（262144）；`maxTokens` 同理默认 32768。`glm-5.3` 修复前一直按 256K/32K 运行而非官方 1M/128K。不在安装目录里的型号必须显式写 `contextWindow` 与 `maxTokens`。
- 每个条目可用字段：`name`、`contextWindow`、`maxTokens`、`input`、`reasoningEfforts`、`compat`；合法档位键值为 `off/minimal/low/medium/high/xhigh/max`，省略某档等价于显式空 `off:`（同为关闭）。

## 最终条目与逐项依据

```yaml
zai:
  displayName: Z.ai Coding API (working)
  apiKeyEnv: ZAI_API_KEY
  models:
    - id: glm-5.3
      contextWindow: 1000000        # Z.ai 官方模型页标称 1M ctx（GLM_research.md）
      maxTokens: 131072             # 官方标称 128K 最大输出
      reasoningEfforts:             # 沿用先前逐档验证过的稳态映射，未改动
        low: high
        medium: high
        high: high
        max: max
      compat:
        thinkingFormat: zai         # 按 Coding baseURL 自动启用的事实声明化
        supportsReasoningEffort: true
    - id: glm-5.3-flash
      contextWindow: 1000000        # 同官方口径；本次实测请求正常但未压满长度
      maxTokens: 131072
      reasoningEfforts:             # 2026-08-27 六档逐一实测通过后才写全
        minimal: minimal
        low: low
        medium: medium
        high: high
        xhigh: xhigh
        max: max
      compat:
        thinkingFormat: zai
        supportsReasoningEffort: true
```

flash 曾长期不在任何 pi-ai 目录里，但端点真实存在：`GET /api/coding/paas/v4/models` 返回 10 个 id（含 `glm-4.5/4.6/5/5.3-flash` 等目录外型号），最小文本请求 200；它是 thinking 模型，64 token 预算会被推理耗尽（finish=length、正文空），`thinking:{type:"disabled"}` 后正常返回——说明接受 Z.ai thinking 格式，与现有 route 兼容，无需新 adapter。

## 当次实测证据（Coding endpoint，固定小题）

| 请求 | 结果 |
|---|---|
| flash × `reasoning_effort` 六档 | 全部 200 且答案正确；推理 tokens 单调：minimal 2 / low 7 / medium 7 / high 26 / xhigh 40 / max 44 |
| glm-5.3 × `low`、`xhigh` | 同样被接受，但 `low` 得到 0 推理 tokens，行为与 flash 不同 |

因此 glm-5.3 保持粗映射不动，只有 flash 采用恒等细粒度映射；若日后想让 5.3 也走细粒度，需先用多任务确认其 `low` 零推理现象稳定。

## 复现与恢复流程

1. 改前备份：`cp <file> <file>.bak-$(date +%Y%m%d-%H%M%S)-before-<原因>` 并 `chmod 0600`。
2. 只改 `~/.dsh/profiles/web/cordis.patch.yml`（要让其他 profile 一致就同步对应文件）；`settings.yaml` 仅作镜像保持人工可读。
3. 校验加载：`DSH_HOME=~/.dsh dsh --profile web --dump-config`（非交互，结构或 schema 错误会 fail loud）。
4. 校验组合结果：dump 输出里 grep 目标 id 数量。
5. 协议级实测：用 `$ZAI_API_KEY` 直接 curl `/chat/completions`（`thinking` 与 `reasoning_effort` 字段），不启动 UI。
6. 有实例在跑则补丁 watcher 热加载；否则下次启动生效。
7. 恢复：把对应 `.bak-*` 文件拷回即可。

## 仍未验证（不要据此宣称能力）

工具往返、replay/历史恢复、流式下的 effort 差异、上下文/输出上限的真实边界、`/models` 中其余目录外型号；这些沿用 [GLM_research.md](./GLM_research.md) 的逐项验证纪律：每个公开档位单独验过才允许写进条目声明。

## 2026-08-30 增补：flash 条目声明 `input: [text, image]`

同一张图（Z.ai 文档示例 `register.png`）直接 curl Coding endpoint：`glm-5.3-flash` 返回 `200` 且描述正确（`prompt_tokens: 5608`，图真实进入上下文）；`glm-5.3` 返回 `400`、代码 `1210`（`messages.content.type is invalid, allowed values: ['text']`）。flash 能收图、5.3 服务端只收文本，且 flash 不在任何官方 enum 里，这一能力只能实测得知。因此只给 flash 条目加一行 `input: [text, image]`（`~/.dsh/profiles/web/cordis.patch.yml` 与 `~/.dsh/settings.yaml` 同步，备份后缀 `.bak-20260830-214705-before-flash-image-input`，权限 0600）；5.3 不加。

为什么必须显式声明：`models:` 整体替换目录后，条目 `input` 的解析顺序为 条目声明 → 同 id 内置条目（flash 不在 `pi-ai@0.82.1` 目录，不存在）→ 路由 `defaultInput`（默认 `['text']`，`dsh-llm-pi-ai` 的 `DEFAULT_INPUT`）；adapter 在发请求前检查消息是否含图与 `input.includes('image')`，不满足直接抛 `UNSUPPORTED_CONTENT`。这与 `contextWindow`/`maxTokens` 静默吃路由默认值是同一族坑，但 `input` 是发请求前的显式拒绝，不是静默降级。声明后图片走既有 attachment 服务（`dsh-llm-pi-ai` 插件已接 `resolveAttachments`），无需其他配置；openrouter 的 `deepseek/deepseek-v4-flash-vision-exp` 条目是同一写法的先例。

同日其他证据：两个 endpoint 的 `/models` 返回同一份 10 个在售 id（`glm-5.3` 与 `glm-5.3-flash` 的 `created` 均为 2026-08-13）；官方 OpenAPI 文本 enum 已含 `glm-5.3`（共 15 个 id）但仍无 `glm-5.3-flash`；官方 `reasoning_effort` 文档写明 GLM-5.2 及以上支持、GLM-5.3 仅 `low`/`high`/`max`——与本文 5.3 粗映射一致，粗映射不动。

仍未验证（新增）：DSH route 内（非裸 curl）的图片请求往返、带图请求的流式与工具调用行为、`video_url`/`file_url` 输入。
