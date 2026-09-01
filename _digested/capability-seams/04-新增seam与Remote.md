# 新增 seam：Schedule、Webhook 与 API Remote 架构

本篇记录上游同步 0004（`0.1.1-rc.2` → `0.1.2-alpha.3`）引入的**新能力 seam**，以及一种**非三角色**的 BFF 通信模式（API Remote）。传统三角色（Definition / Provider / Consumer）仍见 [`01-三角色与分包装.md`](./01-三角色与分包装.md)。

源码核验入口：`packages/schedule/schedule/`、`packages/webhook/`、`packages/api/remotes/`、`packages/typert/`。

## Schedule：`ctx.schedule`

`packages/schedule/schedule/` 提供一个完整的定时调度 seam：

- **Definition**：`ScheduleService` 声明调度接口，作为 `ctx.schedule` 挂载
- **Provider**：`schedule` 包自身同时提供基于时间的调度实现（`domain.ts`、`projection.ts`）
- **Consumer**：插件通过 `ctx.schedule.schedule()` 注册定时任务；`projection.ts` 提供调度状态的投影，供 Web UI（`schedule-catalog`）读取

关键源码：

| 文件 | 角色 |
|------|------|
| `packages/schedule/schedule/src/domain.ts` | 调度领域模型 |
| `packages/schedule/schedule/src/projection.ts` | 调度状态的投影（Web 展示用） |
| `packages/schedule/schedule/src/client.ts` | 客户端（Web）侧访问调度 |
| `packages/schedule/schedule/src/types.ts` | `ScheduleId` 等类型 |

Schedule 是「Definition + Provider 同包」的例子（与 `dsh-llm` 一样）。

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
| directory-picker | #3082 (`worktree-apire-a2`) | `apiproxy` directory-picker RPC |
| subagent control | #3085 (`worktree-apire-c`) | `apiproxy` subagent RPC |
| workspace-controller | #3086 (`worktree-apire-d2`) | `apiproxy` workspace RPC |
| agent-presets | #3074 / #3082 | preset browser 操作 |
| session-controller | #3293 (`worktree-apiremote`) | `apiproxy` session RPC |

迁移完成后，`packages/host/apiproxy/` 中对应的 unary RPC 已删除（`refactor(apiproxy)!: remove ...` 提交）。`client/*` 消费迁移后的 Remote namespace。

### 为什么这很重要

- **对 `_digested/` 框架**：它说明「seam」不是唯一的分界模式——BFF 层还有 Remote 控制器这种按通信协议切的分界。
- **对 surfaces/**：Web host/client 和 SDK 的通信方式正在从「apiproxy RPC 手工暴露」转向「Remote 声明 + 生成 stub」。
- **对 system/**：扩展表新增了「Remote 控制器」作为非显然落点。
