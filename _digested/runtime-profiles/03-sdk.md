# sdk — JSON-RPC SDK 服务

## 一句话

`dsh --profile sdk` 启动一个常驻 stdio JSON-RPC 服务，供进程外 SDK 客户端（TypeScript、Python）驱动 Harness agent。stdout 是纯协议帧，不能装 logger。

## 怎么跑

```sh
# 产品 bin（launcher profile）
dsh --profile sdk
```

sdk 是 `PROFILE_TEMPLATES` 中的一个名字（`dsh-base` + `dsh-sdk-app`）。走 bundle 层叠。源码启动走 `pnpm dsh --profile sdk`。

协议方法面与对调用方的保证见 [`../surfaces-entrypoints/02-acp与jsonrpc.md`](../surfaces-entrypoints/02-acp与jsonrpc.md)；本页只写 profile 组合与启动。

## 组合构成

`dsh-sdk-app` bundle 是叠在 `dsh-base` 上的**薄协议层**，`cordis.patch.yml` 只做四件事：

| 改动 | 内容 |
|------|------|
| `system-prompt` override | 只设 `personaPrefix`（`You are a coding agent powered by the {{model}} model.`）（`packages/bundle/sdk-app/cordis.patch.yml:3-6`）。shipped 组合不设 `personaSuffix`；执行目录由 `ctx.workingDirectory` 作必需用户上下文供给（升级指南 [`working-directory`](../../docs/upgrade-guide/v0.2.1-alpha.1/working-directory/guide.md)） |
| `session-title-llm` `disabled: true` | stdout 只归 JSON-RPC 协议，标题生成关掉 |
| `hmr` `disabled: true` | 协议开始后不做运行时 patch 重载（`packages/bundle/sdk-app/cordis.patch.yml:23-24`） |
| `insert` | `sdk-app-startup`（带 `config: { profile: sdk }`，`:12-15`）+ `sdk-jsonrpc-server`（协议处理器，bundle `inject: [sdkAppStartup, loader]`）+ `workspace-dependencies`（`:29-33`，仅在 `DSH_PRIMARY_RUNTIME ?? DSH_BUNDLED_PRIMARY_RUNTIME` 存在时启用）+ `skill-office`（`:35-41`，同一条件或 `DSH_BUNDLED_OFFICE_CLI`；Office skills 载荷，`DSH_BUNDLED_OFFICE_*` 环境变量可覆盖） |

`sdk-app-startup` 的 `profile` config 只影响 `dsh --profile <name> --help` 打印的命令语法，不改变组合（`packages/bundle/sdk-app/src/index.ts:25`、`:30`、`:38-45`）。

**sdk 的工具面不收窄**：`dsh-sdk-app` 没有禁用任何 base 工具行——bash / sandbox / web / goal / plan / skill / working-directory 全部从 `dsh-base` 继承；base 默认暴露 `web_fetch`（`packages/bundle/base/cordis.patch.yml:454-466,486-490`），sdk 工具面随之多出 `web_fetch`（`dsh-sdk-app` 无反向覆盖）；sdk 另自挂 `load_workspace_dependencies`（`packages/bundle/sdk-app/cordis.patch.yml:29-33`，工具在 `packages/skill/tool-workspace-dependencies/src/index.ts:295`），供模型查询捆绑的 Python / Node.js / pnpm 运行时载荷。**`str_replace_editor` 不在这份继承清单里**：base 的默认编辑器面是 `read` / `write` / `edit`（`tool-fs`）；包 `@deepseek-ai/dsh-tool-str-replace-editor` 仍在，任何组合（含 sdk）想要它都必须显式 `insert`（仓库里的显式例子是 `snapshots/sdk/persistent-tools/cordis.yml:6-7`）。真正把工具面收窄到三个工具（持久 shell + `read_image` + `working_directory`）的是 [`sdk-minimal`](./04-sdk-minimal.md)，它是唯一不叠 base 的 profile。

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
  → session/resume / session/wait / session/working-directory/get|set: 按需分发（方法面见 surfaces/02）
  → 推送所有 session.event / session.status 通知（另发 subagent.started / subagent.finished，后者仅 local）
  → shutdown: flush 响应，dispose 根 ctx，exit 0
  → EOF / SIGTERM / SIGINT: dispose 根 ctx，exit
```

## 独特之处

- **stdout 是纯数据管道**：任何 stdout logger 都会污染协议帧。诊断只能走 stderr。
- **协议层接线**：bundle `inject: [sdkAppStartup, loader]`；server 按 sessionId get-or-create agent，经 `ctx.agents` 驱动。
- **推送所有耐久事实**：每条 `session/event` 转成 `session.event` 通知，每条 `agent/status` 转成 `session.status`；`session/created` 的子 Session 发 `subagent.started`，`subagent/end` 只在 `local` 为 true 时发 `subagent.finished`（`packages/sdk/server/src/server.ts:120-147`）。
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
| `packages/bundle/sdk-app/src/index.ts` | `sdk-app-startup` 的 `profile` config 与 `--help` 命令语法 |
| `_digested/surfaces-entrypoints/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证对照 |
