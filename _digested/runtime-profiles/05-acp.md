# acp — Agent Client Protocol 自动化服务

## 一句话

`dsh --profile acp` 启动一个常驻 stdio ACP 服务，供进程外程序化客户端（另一个 Harness 实例的 `dsh-subagent-acp`、标准 ACP 客户端）驱动 agent。stdout 是纯协议帧，不能装 logger。

## 怎么跑

```sh
# 产品 bin（launcher profile）
dsh --profile acp

# 快照模式（不读 .env，不触发模型调用）
DSH_SNAPSHOT=replay dsh --profile acp
```

acp 是 `PROFILE_TEMPLATES` 中的一个名字（`dsh-base` + `dsh-acp-app`）。走 bundle 层叠。

## 组合构成

`dsh-acp-app` bundle 是叠在 `dsh-base` 上的**薄自动化层**，`cordis.patch.yml` 只做三件事：

| 改动 | 内容 |
|------|------|
| `system-prompt` override | persona → `You are a coding agent powered by the {{model}} model…` |
| `session-title-llm` `disabled: true` | stdout 只归 ACP 协议 |
| `insert` | `acp-app-startup` + `acp`（ACP 桥；bundle `inject: [acpAppStartup]`，插件自身 `inject: ['agents','llm','sessionPersistence','sessions']`，config 定 provider/model） |

JSONL 持久化（`session-persistence-jsonl`）、`session-checkpoint-policy`、`session-query-sqlite` 都在 `dsh-base`——acp-app 不自持，digest 旧版写的「effect 卸载顺序：先拆查询 → 检查点 → 持久化」那层不存在。

## 进程模型

```
dsh --profile acp
  → runProfile → composeProfile → boot()
  → acp-app 组合 apply
    → mount dsh-base → ACP transport 等
  → ACP 插件经 @agentclientprotocol/sdk 接线 stdio：createAcpAgentApp + ndJsonStream(Writable.toWeb(process.stdout), Readable.toWeb(process.stdin))（packages/acp/acp/src/index.ts:21-47 导入、:372-377 接线）
  → 等待客户端连接
  → initialize: 返回 protocolVersion、agentCapabilities（图像能力取决于精确 route）
  → session/new: 创建新鲜 agent（绝对 cwd）
  → session/prompt: 准入 → 写入 inbox → 等到 idle + 输出静默 → 返回 stopReason
  → session/update: 推送 committed agent_message_chunk
  → session/request_permission: 一次性 allow/reject
  → stdin end / dispose: 排空所有 session → 退出
```

## 与 SDK 的核心差异

| 维度 | SDK | ACP |
|------|-----|-----|
| 协议 | 自定义 JSON-RPC（`dsh-sdk-protocol`） | 标准 Agent Client Protocol |
| prompt 返回 | 立刻 `messageId` | 等到 idle，带 `stopReason` |
| 线上内容 | 每条 `session/event` + `agent/status` | 仅 committed `assistant/message` 的文本与图像块 |
| 取消 | 无 per-prompt cancel | `session/cancel` 对准该 prompt |
| 会话创建 | get-or-create 按 `sessionId` | `session/new` 始终创建新 agent |
| 审批 | 运行时控制（通过 approval 插件） | `session/request_permission` 发送到客户端 |
| image | 无特殊处理 | 批量准入、校验、投递 |
| 典型消费者 | 进程外 SDK 脚本 | 另一个 Harness 的 `dsh-subagent-acp`，或标准 ACP 客户端 |

## 独特之处

- **标准化协议**：ACP 是 Agent Client Protocol 标准实现，为跨平台 agent 互操作设计。
- **只投递 committed 输出**：raw chunks、推理、工具活动、plan、title 都留在 session log，不上协议线。
- **每会话一个 in-flight prompt**：`session/prompt` 排他，不能同时有两个 prompt 互窜。
- **图像处理**：支持 PNG / JPEG / WebP / GIF，inline base64 准入后丢弃，日志只留 attachment 引用。图像投递前再读并校验完整性。
- **审批转发**：`approval/request` 事件转发为 `session/request_permission` 到客户端，客户端可自动答。
- **startup-only 重载**：协议开始后不能在运行时重载 patch。
- **stdout 是纯数据管道**：任何 stdout logger 都会污染 ACP 协议帧。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/acp/acp/src/index.ts` | ACP 桥插件 |
| `packages/acp/acp/src/content.ts` | 内容准入（`admitAcpPrompt`、`assistantBlockToAcp`） |
| `packages/acp/acp/src/codec.ts` | turn 结局到 ACP stopReason 编解码 |
| `packages/bundle/acp-app/cordis.patch.yml` | ACP 应用的 bundle 组合 |
| `packages/test-support/acp-snapshot/` | ACP 快照测试工具 |
| `_digested/surfaces/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证详细对照 |
