# sdk — JSON-RPC SDK 服务

## 一句话

`dsh --profile sdk` 启动一个常驻 stdio JSON-RPC 服务，供进程外 SDK 客户端（TypeScript、Python）驱动 Harness agent。stdout 是纯协议帧，不能装 logger。

## 怎么跑

```sh
# 产品 bin（launcher profile）
dsh --profile sdk
```

sdk 是 `PROFILE_TEMPLATES` 中的一个名字（`dsh-base` + `dsh-sdk-app`）。走 bundle 层叠。源码启动走 `pnpm dsh --profile sdk`。

## 组合构成

`dsh-sdk-app` bundle 是叠在 `dsh-base` 上的**薄协议层**，`cordis.patch.yml` 只做三件事：

| 改动 | 内容 |
|------|------|
| `system-prompt` override | persona → `You are a coding agent powered by the {{model}} model. Your working directory is {{cwd}}.` |
| `session-title-llm` `disabled: true` | stdout 只归 JSON-RPC 协议，标题生成关掉 |
| `insert` | `sdk-app-startup` + `sdk-jsonrpc-server`（协议处理器，bundle `inject: [sdkAppStartup, loader]`） |

**sdk 的工具面不收窄**：`dsh-sdk-app` 没有禁用任何 base 工具行——bash / sandbox / web / goal / plan / skill / str-replace-editor 全部从 `dsh-base` 继承。真正把工具面收窄到「persistent bash + str_replace_editor」的是 [`sdk-minimal`](./04-sdk-minimal.md)，它是唯一不叠 base 的 profile。

## 进程模型

```
dsh --profile sdk
  → runProfile → composeProfile → boot()
  → sdk-jsonrpc-server 插件 apply
    → 创建 JsonRpcLineTransport(process.stdin, process.stdout)
    → 创建 HarnessSdkJsonRpcServer
    → 在 transport 上等 JSON-RPC 请求
  → initialize: 等 loader 树结算，返回 serverInfo
  → session/prompt: queue 消息，立刻返回 messageId
  → 推送所有 session.event / session.status 通知
  → shutdown: flush 响应，dispose 根 ctx，exit 0
  → EOF / SIGTERM / SIGINT: dispose 根 ctx，exit
```

## 独特之处

- **stdout 是纯数据管道**：任何 stdout logger 都会污染协议帧。诊断只能走 stderr。
- **协议层接线**：bundle `inject: [sdkAppStartup, loader]`；server 按 sessionId get-or-create agent，经 `ctx.agents` 驱动。
- **推送所有耐久事实**：每条 `session/event` 转成 `session.event` 通知，每条 `agent/status` 转成 `session.status`。
- **`initialize.maxTokens`** 可变成 SDK 创建的 agent 及其后代的输出上限。
- **无 per-prompt 结果**：`session/prompt` 立刻返回 `messageId`（inbox 准入 id），不等 idle。自动化区间由客户端自己定义。
- **startup-only 重载**：协议开始后 patch 重载会打散生命周期。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/sdk/server/src/index.ts` | JSON-RPC server 插件 |
| `packages/sdk/server/src/server.ts` | `HarnessSdkJsonRpcServer` 协议处理器 |
| `packages/sdk/protocol/` | 协议类型、传输层 |
| `packages/sdk/client/` | TypeScript 客户端 |
| `packages/bundle/sdk-app/cordis.patch.yml` | SDK 应用的 bundle 组合 |
| `_digested/surfaces/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证对照 |
