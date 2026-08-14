# Surfaces 地图

## 一句话定位

CLI、Web、ACP、JSON-RPC 是同一棵插件树的不同入口，不是四套 agent 实现。它们 boot 组合不同的 bundle，但都驱动 `ctx.agents`，并从 `session/event` 渲染或投影。

## 这一层回答什么

- `dsh` CLI 如何源码启动（tsx ESM hook）与如何跑 built `lib/`。
- Web 如何拆成 host 半边与 browser 半边，Chat node 如何注册。
- ACP 自动化服务器接到哪一层，缺什么（它不是完整 IDE）。
- JSON-RPC SDK 的进程外合同：谁拥有 session，谁只是客户端。
- 人发的 slash command（`ctx.commands`）为什么不经过模型 turn。

## 源码入口

| 路径 | 角色 |
|------|------|
| `apps/cli/` | 产品 bin `dsh` |
| `packages/boot/` | 各 bin 共用的 boot 胶水 |
| `packages/host/` | Web-GUI 的 API gateway + HTTP |
| `packages/client/` | 浏览器壳、wire、slots、`ui-*` |
| `packages/sdk/` | JSON-RPC protocol / server / TS client |
| `packages/acp/` | Agent Client Protocol 自动化服务器 |
| `packages/interaction/` | 审批、permission、commands、ask-user |
| `packages/api/` | Remote BFF、Typert RPC gateway |
| [`docs/user/guide/index.md`](../../docs/user/guide/index.md) | 产品 Web UI 指南 |
| [`docs/cookbook/adding-a-conversation-node.md`](../../docs/cookbook/adding-a-conversation-node.md) | Chat node |

## 计划中的章节（待消化）

| 文件 | 打算回答 |
|------|----------|
| `01-cli-启动.md` | `pnpm dsh` vs built bin；profile 选择；`--dump-config` |
| `02-web-host-与-client.md` | 两半如何共享 session 流；ConversationNode |
| `03-acp-与-jsonrpc.md` | 自动化面与 SDK 面各自保证什么 |
| `04-human-command-plane.md` | `ctx.commands` 与模型 tool、shell 执行的三条界 |
