# acp — Agent Client Protocol 自动化服务

## 一句话

`dsh-acp-demo --config ./cordis.yml` 启动一个常驻 stdio ACP 服务，供进程外程序化客户端（另一个 Harness 实例的 `dsh-subagent-acp`、标准 ACP 客户端）驱动 agent。stdout 是纯协议帧，不能装 logger。

## 怎么跑

```sh
# 产品 bin
dsh-acp-demo --config ./cordis.yml

# 源码启动
pnpm exec tsx packages/examples/acp-demo/src/bin.ts --config examples/acp-agent/cordis.yml

# 快照模式（不读 .env，不触发模型调用）
DSH_SNAPSHOT=replay dsh-acp-demo --config cordis.snapshot.yml
```

acp 也不是 `PROFILE_TEMPLATES` 中的一个名字。它是独立的 app 二进制 `dsh-acp-demo`，需要自己提供 `cordis.yml`。`packages/examples/acp-demo/src/index.ts` 是组合插件。

## 组合构成

`@deepseek-ai/dsh-acp-demo` 是一个组合插件，通过 `ctx.plugin()` 顺序挂载：

| 顺序 | 插件 | 作用 |
|------|------|------|
| 1 | `@deepseek-ai/dsh-agent-spine-demo` | agent 核心（timer、llm、session、system-prompt、tools、agent-loop 等） |
| 2 | `@deepseek-ai/dsh-session-persistence-jsonl` | JSONL 持久化（`packChunks` 可选） |
| 3 | `@deepseek-ai/dsh-session-checkpoint-policy` | 耐久检查点 |
| 4 | `@deepseek-ai/dsh-session-query-sqlite` | SQLite 会话查询索引 |
| 5 | `@deepseek-ai/dsh-acp` | ACP 桥，`inject: ['agents']` |

`ctx.effect()` 包装顺序使卸载顺序相反：ACP 先停，再拆查询 → 检查点 → 持久化 → spine，保证 checkpoint 和 persistence 监听器在 ACP agent 冲洗完关闭事件后才拆。

## 进程模型

```
dsh-acp-demo --config ./cordis.yml
  → boot() 加载 cordis.yml
  → acp-demo 组合插件 apply
    → mount spine → persistence → checkpoint → query → ACP transport
  → ACP 插件创建 AgentSideConnection(process.stdin, process.stdout)
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
| `packages/examples/acp-demo/src/index.ts` | ACP demo 组合插件 |
| `packages/examples/acp-demo/src/bin.ts` | ACP demo bin |
| `packages/test-support/acp-snapshot/` | ACP 快照测试工具 |
| `_digested/surfaces/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证详细对照 |
