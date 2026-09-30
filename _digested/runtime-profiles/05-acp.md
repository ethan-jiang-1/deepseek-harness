# acp — Agent Client Protocol 自动化服务

## 一句话

`dsh --profile acp` 启动一个常驻 stdio ACP 服务，供进程外程序化客户端（另一个 Harness 实例的 `dsh-subagent-acp`、标准 ACP 客户端）驱动 agent。stdout 是纯协议帧，不能装 logger。

## 怎么跑

```sh
# 产品 bin（launcher profile）
dsh --profile acp

# 快照回放：由 snapshot harness 驱动，不是 CLI 自己认 DSH_SNAPSHOT
pnpm run test:snapshot
```

回放时 `snapshots/acp/*/snapshot.yml` 声明 `profile: acp`，harness 把选中的 replay patch 以 `--patch` 交给 `dsh --profile acp`，并用 `DSH_SNAPSHOT=replay` 在 base patch 与 replay sibling 之间选择（`packages/test-support/session-snapshot/src/launcher.ts:344-363`）；`DSH_SNAPSHOT` 由测试工具读取，`apps/cli/src/bin.ts` 不消费它。

acp 是 `PROFILE_TEMPLATES` 中的一个名字（`dsh-base` + `dsh-acp-app`）。走 bundle 层叠。

## 组合构成

`dsh-acp-app` bundle 是叠在 `dsh-base` 上的**薄自动化层**，`cordis.patch.yml` 只做三件事：

| 改动 | 内容 |
|------|------|
| `system-prompt` override | persona 两段：`personaSuffix`（`Your working directory is {{cwd}}.`）+ `personaPrefix`（`You are a coding agent powered by the {{model}} model.`）（`packages/bundle/acp-app/cordis.patch.yml:3-7`） |
| `session-title-llm` `disabled: true` | stdout 只归 ACP 协议 |
| `insert` | `acp-app-startup` + `acp`（ACP 桥；bundle `inject: [acpAppStartup]`，插件自身 `inject: ['agents','llm','sessionPersistence','sessions']`，config 定 provider/model） |

JSONL 持久化（`session-persistence-jsonl`）、`session-checkpoint-policy`、`session-query-sqlite` 都在 `dsh-base`——acp-app 不自持，digest 旧版写的「effect 卸载顺序：先拆查询 → 检查点 → 持久化」那层不存在。

**与 base 不一致的默认模型**：`acp` 行硬编码 `provider: deepseek-official` / `model: deepseek-v4-flash`（`packages/bundle/acp-app/cordis.patch.yml:19-21`），而 base 的 `agent-default-model` 用 `deepseek-flash`（`packages/bundle/base/cordis.patch.yml:86`）。0009 起目录语义有变：advisory catalog 收缩为两条目（`packages/llm/llm-deepseek/src/models.ts:8-24`：`deepseek-flash`（name `DeepSeek-V41-Flash`）与 `deepseek-v4-pro`），`deepseek-v4-flash` **不再是默认 catalog 条目**——acp 硬编码的 id 仍可用（未列 id 经 passthrough 作 text-only 路由提交，GUI 选择才要求 catalog 条目，`packages/llm/llm-deepseek/README.md:52`），但这不再是「目录内两个条目二选一」而是「catalog 条目 + passthrough id」的搭配；同一个仓库里两处默认值不统一，改模型目录时需同时看这两处。

## 进程模型

```
dsh --profile acp
  → runProfile → composeProfile → boot()
  → acp-app 组合 apply
    → mount dsh-base → ACP transport 等
  → ACP 插件经 @agentclientprotocol/sdk 接线 stdio：createAcpAgentApp + ndJsonStream(Writable.toWeb(process.stdout), Readable.toWeb(process.stdin))（`packages/acp/acp/src/index.ts:21-47` 导入、`:374-378` 接线）
  → 等待客户端连接
  → initialize: 返回 protocolVersion、agentCapabilities（图像能力取决于精确 route）
  → session/new: 创建新鲜 agent（绝对 cwd）
  → session/prompt: 准入 → 写入 inbox → 等到 idle + 输出静默 → 返回 stopReason
  → session/update: 推送 committed 语义更新（文本 / 图像块、reasoning、tool 生命周期、usage）
  → session/request_permission: 一次性 allow/reject
  → stdin end / dispose: 排空所有 session → 退出
```

## 与 SDK 的核心差异

| 维度 | SDK | ACP |
|------|-----|-----|
| 协议 | 自定义 JSON-RPC（`dsh-sdk-protocol`） | 标准 Agent Client Protocol |
| prompt 返回 | 立刻 `messageId` | 等到 idle，带 `stopReason` |
| 线上内容 | 每条 `session/event` + `agent/status` | 只投递 committed 事实的语义更新：文本与图像块、非空 reasoning、通用 tool 生命周期、context usage（`packages/acp/acp/src/updates.ts`） |
| 取消 | 无 per-prompt cancel | `session/cancel` 对准该 prompt |
| 会话创建 | get-or-create 按 `sessionId` | `session/new` 始终创建新 agent |
| 审批 | 运行时控制（通过 approval 插件） | `session/request_permission` 发送到客户端 |
| image | 无特殊处理 | 批量准入、校验、投递 |
| 典型消费者 | 进程外 SDK 脚本 | 另一个 Harness 的 `dsh-subagent-acp`，或标准 ACP 客户端 |

## 独特之处

- **标准化协议**：ACP 是 Agent Client Protocol 标准实现，为跨平台 agent 互操作设计。
- **只投递 committed 事实**：`session/update` 发的是已提交 `assistant/message` 的文本 / 图像块与 reasoning 块（`agent_message_chunk` / `agent_thought_chunk`）、已提交 `tool/call` 与 `tool/result` 的通用 tool 生命周期（`tool_call` / `tool_call_update`）、以及可用时的一条 `usage_update`（`packages/acp/acp/src/updates.ts:36`、`:54`、`:80`、`:98`）；raw provider delta、retry attempt、plan、title、todo、terminal 这类 DSH 展示面不上线。
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
| `packages/test-support/session-snapshot/` | 快照测试工具（含 ACP 场景的 suite/normalize） |
| `_digested/surfaces/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证详细对照 |
