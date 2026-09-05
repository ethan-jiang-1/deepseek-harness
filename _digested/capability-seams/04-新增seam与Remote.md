# 新能力对照：Schedule（非 seam）、Webhook 与 API Remote 架构

本篇记录上游同步 0004（`0.1.1-rc.2` → `0.1.2-alpha.3`）引入的**新能力**，以及一种**非三角色**的 BFF 通信模式（API Remote）。其中 Schedule 是刻意不切三角色的插件式能力（对照反例），Webhook 才是真 seam。传统三角色（Definition / Provider / Consumer）仍见 [`01-三角色与分包装.md`](./01-三角色与分包装.md)。

源码核验入口：`packages/schedule/schedule/`、`packages/webhook/`、`packages/api/remotes/`、`packages/typert/`。

## Schedule：不是 seam 的 agent 作用域提醒（反例）

`packages/schedule/schedule/` 提供 **session-local durable reminders**，是「能力不必都切三角色」的对照例——**没有** `ctx.schedule`、没有 `ScheduleService`、没有 Provider 可替换性：

- 它是自足插件：`ScheduleRuntime` 按每个 root agent 实例化，`inject: ['agents','sessions','tools','sessionPersistence']`
- 模型经普通工具创建/列出/取消提醒：`schedule_create` / `schedule_list` / `schedule_delete`（`tools.ts`），触发后以 follow-up 消息回到同一会话
- 提醒经 session event log 持久化并 `scheduleProjectionDefinition` 投影（`projection.ts`）；Web 侧只读 active-reminder catalog 在独立包 `client/ui-schedule`
- 模块 doc 直述其边界：「Session-local durable reminders」——不是调度服务，也不承诺跨会话推送

关键源码：

| 文件 | 角色 |
|------|------|
| `packages/schedule/schedule/src/runtime.ts` | `ScheduleRuntime`：每 root agent 的投递/持久化 |
| `packages/schedule/schedule/src/tools.ts` | `schedule_create` / `schedule_list` / `schedule_delete` |
| `packages/schedule/schedule/src/persistence.ts` · `transaction.ts` | 提醒的持久化与原子事务 |
| `packages/schedule/schedule/src/projection.ts` | `scheduleProjectionDefinition`（catalog 数据源） |
| `packages/schedule/schedule/src/types.ts` | `ScheduleId` 等类型 |
| `packages/client/ui-schedule/` | Web 只读提醒 catalog（经 `useProjection('schedule')`） |

对照：Webhook（下节）是真正的 Definition + Provider 分包 seam；schedule 提醒机制刻意不这么做。

## Webhook：`ctx.webhookRuntime`

`packages/webhook/` 提供 webhook ingress 能力，是「Definition 与 Provider 分包」的例子：

- **Definition**（`packages/webhook/webhook/`）：`ctx.webhookRuntime` — 认证投递分发、Workspace Session 创建
- **Provider**（`packages/webhook/webhook-github/`）：GitHub webhook 事件处理与签名验证（`body.ts`、`handler.ts`）
- **Consumer**：webhook ingress 插件接收外部事件

`webhook/webhook/src/session.ts` 定义了从 webhook 创建 Workspace Session 的逻辑。`docs/architecture.md` 把 `webhook/webhook` 列入核心包表（`ctx.webhookRuntime`）。

## API Remote：非三角色的 BFF 通信模式

上游 #3073、#3082、#3083、#3085、#3086、#3217、#3235、#3293 系列 PR 引入 **API Remote 控制器**架构，替代 `packages/host/apiproxy/` 中的 unary RPC 路由。

这不是传统 seam：它没有 `ctx.<key>`、没有 Cordis Service 定义、没有 Provider 可替换性。它是一个**通信协议模式**：

| 角色 | 它是什么 | 落点 |
|------|----------|------|
| **Remote 声明** | Host 侧声明控制器及其 schema | `packages/api/remotes/src/*.ts` |
| **Client stub** | Typert 生成器自动导出的 client 侧类型安全 stub | `packages/api/remotes/src/client/` |
| **Transit** | 类型安全的序列化 / 反序列化 | `packages/typert/` |

### 已迁移的域

| 域 | 迁移 PR | 旧落点（apiproxy） |
|----|---------|-------------------|
| settings | #3073 (`worktree-apire-a`) | `apiproxy` settings RPC |
| subagent control | #3085 (`worktree-apire-c`) | `apiproxy` subagent RPC |
| workspace-controller | #3086 (`worktree-apire-d2`) | `apiproxy` workspace RPC |
| agent-presets | #3074 / #3082 | preset browser 操作 |
| session-controller | #3293 (`worktree-apiremote`) | `apiproxy` session RPC |

迁移完成后 `packages/host/apiproxy/` 包整体删除（`refactor(api): remove ApiProxy package`）。`client/*` 消费迁移后的 Remote namespace。directory-picker **不在**迁移表里：它是 `ctx.directoryPicker` Service seam（native/browse 后端），不是 Remote。

### 为什么这很重要

- **对 `_digested/` 框架**：它说明「seam」不是唯一的分界模式——BFF 层还有 Remote 控制器这种按通信协议切的分界。
- **对 surfaces/**：Web host/client 和 SDK 的通信方式正在从「apiproxy RPC 手工暴露」转向「Remote 声明 + 生成 stub」。
- **对 system/**：扩展表新增了「Remote 控制器」作为非显然落点。
