# 可用模型（2026-10-30 快照）

来源：`GET https://dimagent.cn/v1/models?type=dim`，14 个模型，全部 `owned_by: custom`。
DSH 侧 `/api/session/modelCatalog` 的 `DimAgent OAuth` 分组与此一致，`failures: []`。

> 这是快照，不是承诺。中继上下架模型不由本地控制，用
> [`03-operations.md`](./03-operations.md) 里的「刷新」或直接打端点确认当前列表。

## 全部 14 个

| 模型 id | 阵营 | 备注 |
|---|---|---|
| `glm-5.3` | 智谱 GLM | 实测可对话 |
| `glm-5.3-flash` | 智谱 GLM | flash 档 |
| `kimi-k3` | Moonshot | — |
| `kimi-k3.1-pro` | Moonshot | k3 的 pro 版 |
| `seed-2.1-pro` | 字节 Seed | — |
| `seed-2.0-mini` | 字节 Seed | mini 档 |
| `seedream-5.0` | 字节 Seedream | **图像生成** |
| `qwen3.8-max` | 阿里 Qwen | max 档 |
| `qwen3.8-27b` | 阿里 Qwen | 开源尺寸 |
| `qwen3.8-flash` | 阿里 Qwen | flash 档 |
| `qwen-image-3.0` | 阿里 | **图像生成** |
| `deepseek-v4.1-flash` | DeepSeek | flash 档 |
| `mimo-v2.6-pro` | 小米 MiMo | — |
| `mimo-v2.6-flash` | 小米 MiMo | flash 档 |

## 为什么这个 vendor 值得留

对比全局 DSH 其它 provider 的覆盖：

- **图像生成**：`seedream-5.0`、`qwen-image-3.0` —— 其它 provider 不提供
- **小米 MiMo 系**：`mimo-v2.6-pro` / `mimo-v2.6-flash` —— 独有
- 同时聚合了 GLM / Qwen / Kimi / Seed / DeepSeek 五个阵营

多模型同时可用，做横向对比或按任务分流时不必各自申请账号。

## 已验证的能力

**对话**（`POST /v1/chat/completions`，`glm-5.3`，`max_tokens: 10`）返回 200，
响应体带 `choices[].message.reasoning_content`，中继真实转发：

```json
{"choices":[{"finish_reason":"length","index":0,
  "message":{"content":"","role":"assistant",
  "reasoning_content":"Let me consider how to respond to this greeting effectively",
  "provider_specific_fields":{"refusal":null}}}]}
```

**图像**模型（`seedream-5.0`、`qwen-image-3.0`）本次未做生成测试，只确认在目录中。

## 未测项

以下没验证过，需要时自行确认，不要假设：

- 各模型的上下文窗口与最大输出
- 工具调用（tool use）支持情况
- 图像模型的具体参数与返回格式
- 并发限制与速率限制
- 计费口径（是否按 Credits 折算、各模型倍率）
