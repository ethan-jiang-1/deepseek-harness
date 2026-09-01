# sdk — JSON-RPC SDK 服务

## 一句话

`dsh-jsonrpc-agent ./cordis.yml` 启动一个常驻 stdio JSON-RPC 服务，供进程外 SDK 客户端（TypeScript、Python）驱动 Harness agent。stdout 是纯协议帧，不能装 logger。

## 怎么跑

```sh
# 产品 bin（需要外部 cordis.yml）
dsh-jsonrpc-agent ./cordis.yml
```

sdk 不走 `dsh --profile`。它通过独立的 app 二进制 `dsh-jsonrpc-agent` 启动，需要调用方提供 `cordis.yml`。源码启动走 `pnpm exec tsx packages/examples/jsonrpc-demo/src/bin.ts -- ./cordis.yml`。

sdk 不是 `PROFILE_TEMPLATES` 中的一个名字。`examples/jsonrpc-agent/cordis.yml` 是参考组合。

## 组合构成

sdk 没有两个 bundle 层叠，而是**单层 `cordis.yml`** 直接声明所有插件行。参考实现 `examples/jsonrpc-agent/cordis.yml`：

| id | 插件 | 作用 |
|----|------|------|
| `sdk-jsonrpc-server` | `@deepseek-ai/dsh-sdk-jsonrpc-server` | JSON-RPC 协议处理器，`inject: ['agents']` |
| `llm-deepseek` | `@deepseek-ai/dsh-llm-deepseek` | LLM 适配器 |
| `subprocess` | `@deepseek-ai/dsh-subprocess-local` | 子进程管理 |
| `bash` | `@deepseek-ai/dsh-bash-local` | bash 执行器 |
| `agent-spine` | `@deepseek-ai/dsh-agent-spine-demo` | agent 核心组合（timer、llm、session、system-prompt、tools、agent-loop、subagent、invariants 等） |
| `sessions` | `@deepseek-ai/dsh-session-persistence-jsonl` | JSONL 会话持久化 |
| `session-checkpoints` | `@deepseek-ai/dsh-session-checkpoint-policy` | 耐久检查点 |
| `subagent` | `@deepseek-ai/dsh-subagent` | subagent 服务 |
| `subagent-spawn-in-process` | `@deepseek-ai/dsh-subagent-spawn-in-process` | 进程内 spawn provider |
| `tool-subagent` | `@deepseek-ai/dsh-tool-subagent` | subagent 模型 tool |
| `tool-todo` | `@deepseek-ai/dsh-tool-todo` | todo_write 工具 |
| `fs-local` | `@deepseek-ai/dsh-fs-local` | 本地文件系统 |
| `fs-observation-policy` | `@deepseek-ai/dsh-fs-observation-policy` | 文件操作观测 |
| `tool-fs` | `@deepseek-ai/dsh-tool-fs` | 文件系统 model tool |
| `token-meter` | `@deepseek-ai/dsh-token-meter` | token 计量 |
| `compaction-basic` | `@deepseek-ai/dsh-compaction-basic` | 上下文压缩 |

## 区别于 `dsh-base` bundle

sdk 的 `cordis.yml` 行与 `dsh-base` 有很多重叠，但有几个关键差异：

- **没有 `session` 插件**（`agent-spine` 里的 `SessionStore` 提供）
- **没有 `sandbox` / `sandbox-policy` / `approval` / `permission`**（用 `fs-local` 直接暴露文件系统）
- **没有 `web` / `web-search-deepseek` / `tool-web`**（无网络搜索）
- **没有 `plan-mode`**（无计划模式）
- **没有 `goal` / `goal-round-driver` / `tool-goal`**（无持久目标）
- **没有 `skill` 系统**（`skills: enabled: false`）
- `tool-bash` 配置 `enableRunInBackground: false`

## 进程模型

```
dsh-jsonrpc-agent ./cordis.yml
  → boot() 加载 cordis.yml
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
| `examples/jsonrpc-agent/cordis.yml` | 参考组合 |
| `examples/jsonrpc-demo/` | 外部配置 bin |
| `_digested/surfaces/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证对照 |
