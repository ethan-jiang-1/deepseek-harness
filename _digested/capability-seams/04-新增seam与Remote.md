# 不是 seam 的能力：Schedule、Webhook 与 API Remote

> [`00-map`](./00-map.md) 给出了四种能力形状。本篇用三个真实样本讲清「不是三角色 seam」的那几种：**Schedule** 是有 `ctx` 键但没有第二实现的 core 服务；**Webhook** 是 core 服务加来源适配器；**API Remote** 是按通信协议切出 Client stub 的 BFF 暴露模式（Host 侧仍是 `TypertRemoteService`、通常仍占一个 `ctx` 键，但没有可替换的 Provider 竞聘位）。末尾补上三个 core 服务与反馈事件的当前落点——它们说明同一个 `ctx` 键可以是 core、是 seam、也可以是完全不切角色的自足插件。传统三角色见 [`01-三角色与分包装.md`](./01-三角色与分包装.md)。

源码核验入口：`packages/schedule/schedule/`、`packages/schedule/tool-schedule/`、`packages/experimental/webhook/`、`packages/experimental/webhook-github/`、`packages/api/remotes/`、`packages/typert/`、`packages/feedback/`、`packages/client/file-upload/`、`packages/api/workspace-files/`。

## Schedule：core 服务的提醒能力

`packages/schedule/schedule/` 提供 host 作用域的持久提醒：模型经 `schedule_create` / `schedule_list` / `schedule_update` / `schedule_delete` 四个工具（独立成包 `tool-schedule`）管理一次性或固定间隔提醒，到期以 scheduled user message 回到原会话，任务独立于 Session activation 持久化。它是「能力不必都切三角色」的对照例：**没有可分包的 Service Provider，也没有可替换性**——服务是自足的单实现（生成表 role 列为 `core`），模型面工具独立成包。平台合同、通知经济学与交付时序的家在 [`../delegation-and-orchestration/delegation-primitives/05-background-jobs-and-wall-clock-schedules.md`](../delegation-and-orchestration/delegation-primitives/05-background-jobs-and-wall-clock-schedules.md)；Web 组合的挂载行见 [`../runtime-profiles/01-web.md`](../runtime-profiles/01-web.md)。

## Webhook：core 服务 + 来源适配器

`packages/experimental/webhook/` 提供 webhook ingress 能力。它**不是**三角色 seam：

- **core 服务**（`packages/experimental/webhook/`）：`ctx.webhookRuntime` — 认证投递分发、Workspace Session 创建。生成表的 role 列是 `core`、implementation 列是 [`webhook`](../../packages/experimental/webhook)；`docs/architecture.md` 的扩展点表给出「注册受信规则 + 挂 provider adapter」一行。
- **消费者 / 来源适配器**（`packages/experimental/webhook-github/`）：GitHub webhook 事件处理与签名验证（`body.ts`、`handler.ts`）。它 `inject: ['webServer', 'webhookRuntime', 'credentials']`（`packages/experimental/webhook-github/src/index.ts`），验签后调 `ctx.webhookRuntime.dispatch(delivery)`（`src/handler.ts`）——按生成表的列它是 direct consumer，不是 Provider。
- **规则注册方**：受信插件在 `ctx.webhookRuntime` 上注册进程内规则，返回非 null 结果即变成普通的 Workspace-backed Session（`packages/experimental/webhook/src/session.ts`）。

注意产品文档里的「provider adapter」指 **webhook 来源适配器**，不是 capability seam 的 Service Provider 角色——`ctx.webhookRuntime` 没有第二个实现包，因此它是 core 服务 + 适配器消费者，不是三角色 seam。

对照上一节：schedule 与 webhook 都不是 seam，但形态不同——schedule 的 core 服务背后只有一个实现包、模型面工具独立成包；webhook 多了一个来源适配器消费者。

## API Remote：非三角色的 BFF 通信模式

**API Remote 控制器**架构承载 BFF 面的 RPC 路由——unary 与 **stream** 方法都支持（`packages/typert/protocol/src/types.ts` 的 `RemoteStream<Out, In>` 与 `RemoteStreamHandle` send/end/dispose 定义流式 Remote；客户端生成器为 stream 方法产出流式 stub）。

这不是三角色 seam：它不是「一个 Definition 配多个可替换 Provider」的竞聘位，而是按**进程间通信边界**切的协议暴露模式。Host 侧控制器本身仍是继承 `TypertRemoteService` 的 Cordis `Service`（占 Host 侧 `ctx.<key>`，如 `ctx.sessionController`、`ctx.workspaceFiles`、`ctx.goals`），但 Client 侧拿到的不是该服务本身，而是 Typert 生成并由 `ctx.remote.$mount()` 装成 `ctx.remote.<ns>` 的类型化 stub：

| 角色 | 它是什么 | 落点 |
|------|----------|------|
| **Remote 控制器 / 服务** | Host 侧继承 `TypertRemoteService`、用 `@Remote` 标出 wire 方法的 Cordis Service | 各业务包（`packages/api/*-controller/`、`packages/api/workspace-files/`、`packages/goal/goal/`、`packages/llm/llm/` 等） |
| **事件白名单与 Client 主装配** | 非 session 转发事件白名单 `API_REMOTE_FORWARDED_EVENTS` 与 `/remote` 主 `$mount` 装配表 | `packages/api/remotes/src/remote-events.ts`、`packages/api/remotes/src/client/index.ts` |
| **Transit 与生成器** | build 期从 `ts.Program` 生成 Host 反射与 Client stub，运行期做类型安全序列化 | `packages/typert/` |

### Remote 控制器覆盖的域

settings（含 credentials 子命名空间）、subagent control、agent preset registry、workspace-controller、session-controller 等域由 Remote 控制器提供，`client/*` 消费这些 Remote namespace。装配清单是 `packages/api/remotes/src/client/index.ts` 的 `ctx.remote.$mount` 贡献数组（以该文件为准，本页不手抄）。注意**贡献数 ≠ wire namespace 数**：一条贡献可以导出多个 namespace，`session-controller` 一个包就导出 `session`、`fileReferences` 与 `skills` 三个；`goal` / `llm` / `message-feedback` / `schedule` 等本身也是 `TypertRemoteService`（占各自原有的 `ctx.<key>` 并向 Client 暴露 `@Remote` 方法）。

directory-picker 需要按两个面分开说：`ctx.directoryPicker` 本身是 `ctx.directoryPicker` Service seam（native/browse 后端，见生成表；决策见已归档的 [`2026-07-28-directory-picker-capability-seam`](../../.agents/notes/archived/architecture/2026-07-28-directory-picker-capability-seam.md)），同时由 `packages/api/workspace-controller/src/directory-picker.ts` 的 `DirectoryPickerController`（`ctx.directoryPickerController`）把抽象 seam 暴露成 `ctx.remote.directoryPicker` wire 动词。

## 三个 core 服务与反馈事件的落点

生成的 [`docs/capability-seams.md`](../../docs/capability-seams.md) 里还有三个 `core` 行，它们补全了「core / seam / 自足插件」这组三分法样本：

| ctx 键 | owner | 说明 |
|--------|-------|------|
| `ctx.fileUploads` | `packages/client/file-upload/` | 流式接收、持久化与 staged receipt 生命期；唯一直接消费者是 Session controller |
| `ctx.workspaceFiles` | `packages/api/workspace-files/` | Session workspace 内的 stat、分页文本、字节窗口、目录列表与变更流共 5 个 Remote 方法；`WorkspaceFiles extends TypertRemoteService` |
| `ctx.sessionFeedback` | `packages/feedback/command-feedback/` | 记录一条 Session 级反馈，log-only |

`ctx.messageFeedback` 由 canonical Session log 承载：字段级反馈落成 log-only 事件（写入前 per-item version CAS），Session 级反馈是 `feedback/record`，都留在模型历史之外；另有一个进程内事件 `feedback/committed`（写所有权释放前广播已提交前缀），只有进程内遥测能观察——模型历史与 fork 都看不到它。

判定：这三个键全是 core。**升级判据**：一个 core 键什么时候值得升成 seam？出现第二个真实实现的需求时——`ctx.fileUploads` 同时具备 intake / 持久化 / receipt 三个关注点，是当前的待观察项；反之，`ctx.schedule` 这类「每部署一条答案」的能力没有第二实现的前景，core 就是终态。

## 为什么这很重要

- **对分界模式**：「seam」不是唯一的分界方式——按 [00-map 的判定程序](./00-map.md#不是每个能力都是-seam)：没有第二实现的是 core 服务，按通信协议切的是 Remote，连 `ctx` 键都不设的是刻意的进程级库。
- **对入口面**：Web host/client 和 SDK 的通信方式是「Remote 声明 + 生成 stub」，不是手工暴露的 RPC（[`../surfaces-entrypoints/00-map.md`](../surfaces-entrypoints/00-map.md)）。
- **对扩展点**：Remote 控制器是非显然的扩展落点（`docs/architecture.md` 扩展点表）。
