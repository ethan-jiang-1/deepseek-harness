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

`dsh-sdk-app` bundle 的 `cordis.patch.yml` 包含：

| 层级 | 插件 | 作用 |
|------|------|------|
| dsh-base | 核心插件 | 见 `dsh-base` 清单 |
| dsh-sdk-app | `sdk-jsonrpc-server` | JSON-RPC 协议处理器，`inject: ['agents']` |
| dsh-sdk-app | 其他工具行 | 参考 `dsh-base` 的继承 |

sdk 组合与 `dsh-base` 的关键差异：

- **没有 `sandbox` / `sandbox-policy`**（用 `fs-local` 直接暴露文件系统）
- **没有 `web` / `web-search-deepseek` / `tool-web`**（无网络搜索）
- **没有 `plan-mode`**（无计划模式）
- **没有 `goal` / `goal-round-driver` / `tool-goal`**（无持久目标）
- **没有 `skill` 系统**
- `tool-bash` 配置 `enableRunInBackground: false`

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
- **`inject: ['agents']`**：server 插件直接依赖 agent 注册表，按 sessionId get-or-create。
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
