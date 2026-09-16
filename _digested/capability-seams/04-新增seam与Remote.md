# 新能力对照：Schedule（非 seam）、Webhook 与 API Remote 架构

本篇记录上游同步 0004（`0.1.1-rc.2` → `0.1.2-alpha.3`）引入的**新能力**，以及一种**非三角色**的 BFF 通信模式（API Remote）；末尾补记同步 0006（`0.1.2-rc.1` → `0.1.5-rc.1`）的增量——三个新 `core` 服务与 `ctx.messageFeedback` 的 canonical-log 迁移。其中 Schedule 与 Webhook **都不是**三角色 seam，但形态不同：schedule 连 `ctx` 键都没有，webhook 是一个 `core` 服务加一个消费者适配器（对照反例）。传统三角色（Definition / Provider / Consumer）仍见 [`01-三角色与分包装.md`](./01-三角色与分包装.md)。

源码核验入口：`packages/schedule/schedule/`、`packages/webhook/`、`packages/api/remotes/`、`packages/typert/`、`packages/feedback/`、`packages/client/file-upload/`、`packages/api/workspace-files/`。

## Schedule：不是 seam 的 agent 作用域提醒（反例）

`packages/schedule/schedule/` 提供 **session-local durable reminders**，是「能力不必都切三角色」的对照例——**没有** `ctx.schedule`、没有 `ScheduleService`、没有 Provider 可替换性：

- 它是自足插件：`ScheduleRuntime` 按每个 root agent 实例化，`inject: ['agents','sessions','tools','sessionPersistence']`
- 模型经普通工具创建/列出/取消提醒：`schedule_create` / `schedule_list` / `schedule_delete`（`tools.ts`），触发后以 follow-up 消息回到同一会话
- 提醒经 session event log 持久化并 `scheduleProjectionDefinition` 投影（`projection.ts`）；Web 侧只读 active-reminder catalog 在独立包 `client/ui-schedule`
- 包 README description 直述其边界：「Session-local durable reminders」（`packages/schedule/schedule/README.md:2`）；`src/index.ts` 模块 doc 为 "Agent-scoped durable one-shot and fixed-rate reminders over the session event log"——不是调度服务，也不承诺跨会话推送

关键源码：

| 文件 | 角色 |
|------|------|
| `packages/schedule/schedule/src/runtime.ts` | `ScheduleRuntime`：每 root agent 的投递/持久化 |
| `packages/schedule/schedule/src/tools.ts` | `schedule_create` / `schedule_list` / `schedule_delete` |
| `packages/schedule/schedule/src/persistence.ts` · `transaction.ts` | 提醒的持久化与原子事务 |
| `packages/schedule/schedule/src/projection.ts` | `scheduleProjectionDefinition`（catalog 数据源） |
| `packages/schedule/schedule/src/types.ts` | `ScheduleId` 等类型 |
| `packages/client/ui-schedule/` | Web 只读提醒 catalog（经 `useProjection('schedule')`） |

对照：Webhook（下节）与 schedule 都**不是**三角色 seam，但形态不同——webhook 有一个 `core` 服务 `ctx.webhookRuntime` 加一个消费者适配器包，schedule 连 ctx 键都没有。

## Webhook：`ctx.webhookRuntime`（core + 适配器消费者）

`packages/webhook/` 提供 webhook ingress 能力。它**不是**三角色 seam：

- **core 服务**（`packages/webhook/webhook/`）：`ctx.webhookRuntime` — 认证投递分发、Workspace Session 创建。生成表的 role 列是 `core`、implementation 列是 `-`，`docs/architecture.md:68` 也把它列在核心包表里
- **消费者 / 来源适配器**（`packages/webhook/webhook-github/`）：GitHub webhook 事件处理与签名验证（`body.ts`、`handler.ts`）。它 `inject: ['webServer', 'webhookRuntime', 'credentials']`（`packages/webhook/webhook-github/src/index.ts:14`），验签后调 `ctx.webhookRuntime.dispatch(delivery)`（`src/handler.ts:115`）——按生成表的列它是 direct consumer，不是 Provider

`webhook/webhook/src/session.ts` 定义了从 webhook 创建 Workspace Session 的逻辑。产品文档里的「provider adapter」（`docs/architecture.md:146`）指 **webhook 来源适配器**，不是 capability seam 的 Service Provider 角色；`ctx.webhookRuntime` 没有第二个实现包，因此这里既没有可分包的 Provider，也不构成 seam——FAQ 08 的 29 条 seam 表不含它。

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
| agent-presets | #3082 (`worktree-apire-a2`) | preset browser 操作 |
| session-controller | #3293 (`worktree-apiremote`) | `apiproxy` session RPC |

迁移完成后 `packages/host/apiproxy/` 包整体删除（`refactor(api): remove ApiProxy package`）。`client/*` 消费迁移后的 Remote namespace。directory-picker **不在**迁移表里：它是 `ctx.directoryPicker` Service seam（native/browse 后端），不是 Remote。

全集：`packages/api/remotes/src/client/index.ts` 现组装 **15 条 `$mount` 贡献**——agent-presets、commands、settings-controller（含 credentials 子命名空间）、goal、llm、cordis-host-runner、plugin-inventory、message-feedback、session-reference、subagents、session-controller、workspace-controller，加上跨度 0006 新增的 session-feedback（owner `packages/feedback/command-feedback/`）、file-uploads（owner `packages/client/file-upload/`）、workspace-files（owner `packages/api/workspace-files/`）。装配清单就是 `packages/api/remotes/src/client/index.ts:153-158` 的 `ctx.remote.$mount` 循环。注意「贡献数」不等于「wire namespace 数」：一条贡献可以导出多个 namespace，`session-controller` 一个包就导出 `session`（`src/index.ts:121`）、`fileReferences`（`src/file-references.ts:22`）与 `skills`（`src/skill-catalog.ts:25`）三个。其中 goal / llm / message-feedback / session-reference 等是原生 Remote（Service 本身即 `TypertRemoteService`），不是 apiproxy 迁移产物；新增的三个同样是原生 Remote。

### 本跨度增量（0006）：三个新 core 服务与 messageFeedback 的迁移

上游同步 0006（`0.1.2-rc.1` → `0.1.5-rc.1`）没有新增任何三角色 seam。生成的 `docs/capability-seams.md` 只多出三个 `core` 行：

| ctx 键 | owner | 说明 |
|--------|-------|------|
| `ctx.fileUploads` | `packages/client/file-upload/` | 流式接收、持久化与 staged receipt 生命期；唯一直接消费者是 Session controller（`docs/capability-seams.md:478`）；服务名注册见 `packages/client/file-upload/src/index.ts:65` |
| `ctx.workspaceFiles` | `packages/api/workspace-files/` | Session workspace 内的 stat、分页文本、字节窗口、目录列表与变更流共 7 个 Remote 方法（`docs/capability-seams.md:489`）；`WorkspaceFiles extends TypertRemoteService`（`packages/api/workspace-files/src/index.ts:182`） |
| `ctx.sessionFeedback` | `packages/feedback/command-feedback/` | 记录一条 Session 级反馈，log-only（`docs/capability-seams.md:504`） |

`ctx.messageFeedback` 改为由 **canonical Session log** 承载（`docs/capability-seams.md:503`），并且不再消费 `ctx.storageDomain`——迁移后 `:502` 的 Direct consumers 只剩 `workspace`。字段级反馈落成 log-only 事件 `feedback/message-put` / `feedback/message-delete`（`packages/feedback/message-feedback/src/index.ts:196`、`:212`），写入前做 per-item version compare-and-set（`:178` 的 `ifVersion` 检查）；Session 级反馈是 `feedback/record`（`packages/feedback/command-feedback/src/index.ts:59`）。三者都留在模型历史之外。

同一次迁移还新增了一个**进程内**（非 session log）事件：`feedback/committed`（`:58` 声明、`:269` 在写所有权释放前用 `ctx.parallel` 广播，携带已提交的 canonical 前缀 `SessionInspection`；观测者失败只记 warning、不影响写结果）。它本跨度才出现（`a66e470204` 的事件目录里没有它），目前唯一消费者是 `packages/session/session-telemetry-otel/src/index.ts:255`——遥测侧用 `Session.fromRestore` 还原一个 detached Session 再捕获。这是「durable 写入点对外广播」与「log-only 事件」并列的第三类反馈产物：它不进日志，因此**模型历史和 fork 都看不到它**，只有进程内的遥测能观察到。判定：三个新键全是 core，**本跨度 0 个新 seam**；`ctx.fileUploads` 同时具备 intake / 持久化 / receipt 三个关注点，属于「若出现第二个 provider 就会升级成 seam」的待观察项。

### 为什么这很重要

- **对 `_digested/` 框架**：它说明「seam」不是唯一的分界模式——BFF 层还有 Remote 控制器这种按通信协议切的分界；0006 的三个新 `core` 服务则补上「同一个 `ctx` 键可以是 core、是 seam、也可以是完全不切角色的自足插件」这组三分法样本。
- **对 surfaces/**：Web host/client 和 SDK 的通信方式已从「apiproxy RPC 手工暴露」换成「Remote 声明 + 生成 stub」（`packages/host/apiproxy/` 已整体删除，见上文迁移表）。
- **对 system/**：扩展表新增了「Remote 控制器」作为非显然落点。
