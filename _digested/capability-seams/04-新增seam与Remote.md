# 新能力对照：Schedule（非 seam）、Webhook 与 API Remote 架构

本篇记录上游同步 0004（`0.1.1-rc.2` → `0.1.2-alpha.3`）引入的**新能力**，以及一种**非三角色**的 BFF 通信模式（API Remote）；末尾补记同步 0006（`0.1.2-rc.1` → `0.1.5-rc.1`）的增量——三个新 `core` 服务与 `ctx.messageFeedback` 的 canonical-log 迁移。其中 Schedule 与 Webhook **都不是**三角色 seam，但形态不同：schedule 连 `ctx` 键都没有，webhook 是一个 `core` 服务加一个消费者适配器（对照反例）。传统三角色（Definition / Provider / Consumer）仍见 [`01-三角色与分包装.md`](./01-三角色与分包装.md)。

产品源码基线：`687f282e8625c6b8d11ff58211a90524be2e4317`（`dsh-v0.2.1-rc.2`，2026-10-18 同步轮核验；OLD 侧 `639ed015397290b3745d163aafe02ffee4aa3f84`）。

源码核验入口：`packages/schedule/schedule/`、`packages/schedule/tool-schedule/`、`packages/experimental/webhook/`、`packages/experimental/webhook-github/`、`packages/api/remotes/`、`packages/typert/`、`packages/feedback/`、`packages/client/file-upload/`、`packages/api/workspace-files/`。

## Schedule：不是 seam 的提醒能力（反例；0.2.0 线整块重写）

`packages/schedule/schedule/` 提供持久化提醒，是「能力不必都切三角色」的对照例——没有可分包的 Service Provider，也没有可替换性；生成表把它记成 `core`（`ctx.schedule`，`docs/capability-seams.md:682`），但它是自足插件而不是三角色 seam：

- host 侧服务按每个 root agent 实例化 `ScheduleRuntime`，0.2.1 线 `inject: ['agents', 'sessions', 'storageDomain', 'sessionController', 'sessionPersistence']`（`packages/schedule/schedule/src/index.ts:100`；旧 inject 另有 `tools`，工具 0.2.1 线拆包后移除）
- 模型经普通工具创建/列出/改/删提醒：`schedule_create` / `schedule_list` / `schedule_update` / `schedule_delete`，0.2.1 线整包拆到 `packages/schedule/tool-schedule/`（`src/index.ts:454`/`:492`/`:539`/`:513`，`inject = ['tools']`，`:29`），触发后以 **scheduled user messages** 回到会话（`af39300572`，不再叫 due reminders）
- 持久化在 0.2.0 线随 storage phase 1（PR #4335，merge `7a362b263b`，persistence ack `2026-09-16-host-schedule-storage`）整块重写：旧的 `src/persistence.ts` + `transaction.ts`（持久化与原子事务）与 `src/projection.ts` 的 `scheduleProjectionDefinition`（catalog 数据源）均已从 src 删除、无同名继任；落点改为 `src/storage.ts`（host schedule storage）与 `src/delivery-history.ts`（bounded delivery history，ack `2026-09-22-schedule-hard-delete-and-bounded-history`），目录数据不再走 session-log projection
- 包 README description 已改为「Host-wide durable reminders and shared Session-bound task management.」（`packages/schedule/schedule/README.md:2`；旧口径「Session-local durable reminders」不再成立）；`src/index.ts` 模块 doc 现为 "Host-wide durable reminders and shared human/model management"——从 session 作用域改述为 host 作用域
- **bundle 交付已退役**（0.2.1 线）：0.2.0-rc.2 曾用 `packages/experimental/schedule-bundle/` 交付 Schedule，本轮该 bundle 删除（升级指引 [`schedule-bundle-retired`](../../docs/upgrade-guide/v0.2.0-rc.2/schedule-bundle-retired/guide.md)）。`@deepseek-ai/dsh-web-app` 在 Web 组合里直接挂 `schedule`（`packages/bundle/web-app/cordis.patch.yml:139`）与 `ui-schedule`（`:398`）两行；`schedule_*` 工具改由 preset 声明（`presets/standard.patch.yml:35`、`presets/cordis.patch.yml:38`、`presets/ptc.patch.yml:35`，`minimal` 不声明）。加载旧 profile 会把 `@deepseek-ai/dsh-experimental-schedule-bundle` 从 `dsh.profile.bundles` 移除；已存任务与投递记录留在磁盘上继续使用

关键源码：

| 文件 | 角色 |
|------|------|
| `packages/schedule/schedule/src/runtime.ts` | `ScheduleRuntime`：每 root agent 的投递与调度 |
| `packages/schedule/tool-schedule/src/index.ts` | `schedule_create` / `schedule_list` / `schedule_update` / `schedule_delete`（0.2.1 线自 schedule 包拆出） |
| `packages/schedule/schedule/src/storage.ts` | host schedule storage（0.2.0 线起；替代旧 persistence + transaction，ack `2026-09-16-host-schedule-storage`） |
| `packages/schedule/schedule/src/delivery-history.ts` | bounded delivery history 与 hard-delete（ack `2026-09-22-schedule-hard-delete-and-bounded-history`） |
| `packages/schedule/schedule/src/types.ts` | `ScheduleId` 等类型 |
| `packages/bundle/web-app/cordis.patch.yml` | Web 组合里的 `schedule` 与 `ui-schedule` 行（0.2.1 线起取代 schedule-bundle） |
| `packages/client/ui-schedule/` | Web 只读提醒 catalog |

对照：Webhook（下节）与 schedule 都**不是**三角色 seam，但形态不同——webhook 有一个 `core` 服务 `ctx.webhookRuntime` 加一个消费者适配器包，schedule 的 `core` 服务 `ctx.schedule` 背后同样只有一个实现包，模型面工具独立成包。

## Webhook：`ctx.webhookRuntime`（core + 适配器消费者）

`packages/experimental/webhook/` 提供 webhook ingress 能力（0.2.1 线整族从 `packages/webhook/` 迁入 `experimental/`，包名不变）。它**不是**三角色 seam：

- **core 服务**（`packages/experimental/webhook/`）：`ctx.webhookRuntime` — 认证投递分发、Workspace Session 创建。生成表的 role 列是 `core`、implementation 列是 [`webhook`](../../packages/experimental/webhook)（`docs/capability-seams.md:709`）；`docs/architecture.md` 的核心包表本轮不再收录它，只在扩展点表里留「注册受信规则 + 挂 provider adapter」一行（`docs/architecture.md:151`）
- **消费者 / 来源适配器**（`packages/experimental/webhook-github/`）：GitHub webhook 事件处理与签名验证（`body.ts`、`handler.ts`）。它 `inject: ['webServer', 'webhookRuntime', 'credentials']`（`packages/experimental/webhook-github/src/index.ts:14`），验签后调 `ctx.webhookRuntime.dispatch(delivery)`（`src/handler.ts:115`）——按生成表的列它是 direct consumer，不是 Provider

`packages/experimental/webhook/src/session.ts` 定义了从 webhook 创建 Workspace Session 的逻辑。产品文档里的「provider adapter」（`docs/architecture.md:151`）指 **webhook 来源适配器**，不是 capability seam 的 Service Provider 角色；`ctx.webhookRuntime` 没有第二个实现包，因此这里既没有可分包的 Provider，也不构成 seam——FAQ 08 的 35 条 seam 表不含它。

## API Remote：非三角色的 BFF 通信模式

**API Remote 控制器**架构承载 BFF 面的 RPC 路由——unary 与 **stream** 方法都支持（0.1.7 线起 `packages/typert/protocol/src/types.ts:147` 的 `RemoteStream<Out, In>` 与 `:160`-`:180` 的 `RemoteStreamHandle` send/end/dispose 定义流式 Remote；客户端生成器为 stream 方法产出流式 stub）；`packages/host/apiproxy/` 不存在。

这不是传统 seam：它没有 `ctx.<key>`、没有 Cordis Service 定义、没有 Provider 可替换性。它是一个**通信协议模式**：

| 角色 | 它是什么 | 落点 |
|------|----------|------|
| **Remote 声明** | Host 侧声明控制器及其 schema | `packages/api/remotes/src/*.ts` |
| **Client stub** | Typert 生成器自动导出的 client 侧类型安全 stub | `packages/api/remotes/src/client/` |
| **Transit** | 类型安全的序列化 / 反序列化 | `packages/typert/` |

### Remote 控制器覆盖的域

settings、credentials、subagent control、agent-presets、workspace-controller、session-controller 现由 Remote 控制器提供；`packages/host/apiproxy/` 已整体删除，`client/*` 消费这些 Remote namespace。directory-picker **不是** Remote——它是 `ctx.directoryPicker` Service seam（native/browse 后端）。

全集：`packages/api/remotes/src/client/index.ts` 现组装 **26 条 `$mount` 贡献**（0.2.1-rc.2 复核实数；0009 时为 25、0008 时为 22、0006 时为 15）——productAnalytics、agentPresets、commands、settings（含 credentials 子命名空间）、account、goals、llm、dynamic（cordis-host-runner）、schedule、pluginInventory、pluginManager、pluginMarket、pluginRegistryProbe、messageFeedback、sessionFeedback、fileUploads、sessionReferences、permissionPresets、subagents、session、job、workspace、workspaceFiles、terminal、officeToPdf、userQuestions。装配清单就是 `packages/api/remotes/src/client/index.ts:188-196` 的 `ctx.remote.$mount` 循环（循环体 `:197`）。0011（→0.2.1-rc.2）跨度新增：pluginMarket（`packages/boot/plugin-market/`，`ctx.pluginMarket`）。0008 跨度新增：account（`packages/api/account-controller/`）、pluginManager / pluginRegistryProbe（插件管理面）、permissionPresets、job（`packages/api/job-controller/`）、terminal（`packages/api/terminal-controller/`）、officeToPdf、dynamic；0009（→0.2.0-rc.2）跨度新增：productAnalytics（`packages/client/product-analytics/`）、schedule（`packages/schedule/schedule/`）、userQuestions（`packages/interaction/user-questions/`），并把 `sessionReferenceResolver` 改名 `sessionReferences`。注意「贡献数」不等于「wire namespace 数」：一条贡献可以导出多个 namespace，`session-controller` 一个包就导出 `session`、`fileReferences` 与 `skills` 三个。其中 goal / llm / message-feedback / session-reference 等是原生 Remote（Service 本身即 `TypertRemoteService`），不是 apiproxy 迁移产物；0006 新增的三个与 0008/0009 新增的面同样多为原生 Remote。

### 本跨度增量（0006）：三个新 core 服务与 messageFeedback 的迁移

上游同步 0006（`0.1.2-rc.1` → `0.1.5-rc.1`）没有新增任何三角色 seam。生成的 `docs/capability-seams.md` 只多出三个 `core` 行：

| ctx 键 | owner | 说明 |
|--------|-------|------|
| `ctx.fileUploads` | `packages/client/file-upload/` | 流式接收、持久化与 staged receipt 生命期；唯一直接消费者是 Session controller（`docs/capability-seams.md:629`）；服务名注册见 `packages/client/file-upload/src/index.ts:64` |
| `ctx.workspaceFiles` | `packages/api/workspace-files/` | Session workspace 内的 stat、分页文本、字节窗口、目录列表与变更流共 5 个 Remote 方法（`docs/capability-seams.md:642`）；`WorkspaceFiles extends TypertRemoteService`（`packages/api/workspace-files/src/index.ts:183`） |
| `ctx.sessionFeedback` | `packages/feedback/command-feedback/` | 记录一条 Session 级反馈，log-only（`docs/capability-seams.md:664`） |

`ctx.messageFeedback` 改为由 **canonical Session log** 承载（`docs/capability-seams.md:663`），并且不再消费 `ctx.storageDomain`——迁移后 `:662` 的 `ctx.storageDomain` Direct consumers 只剩 `workspace`。字段级反馈落成 log-only 事件 `feedback/message-put` / `feedback/message-delete`（`packages/feedback/message-feedback/src/index.ts:196`、`:212`），写入前做 per-item version compare-and-set（`:178` 的 `ifVersion` 检查）；Session 级反馈是 `feedback/record`（`packages/feedback/command-feedback/src/index.ts:60`）。三者都留在模型历史之外。

同一次迁移还新增了一个**进程内**（非 session log）事件：`feedback/committed`（`:58` 声明、`:271` 在写所有权释放前用 `ctx.parallel` 广播，携带已提交的 canonical 前缀 `SessionInspection`；观测者失败只记 warning、不影响写结果）。它 0006 跨度才出现（`a66e470204` 的事件目录里没有它），目前唯一消费者是 `packages/session/session-telemetry-otel/src/index.ts:233`——遥测侧用 `Session.fromRestore` 还原一个 detached Session 再捕获。这是「durable 写入点对外广播」与「log-only 事件」并列的第三类反馈产物：它不进日志，因此**模型历史和 fork 都看不到它**，只有进程内的遥测能观察到。判定：三个新键全是 core，**该跨度 0 个新 seam**；`ctx.fileUploads` 同时具备 intake / 持久化 / receipt 三个关注点，属于「若出现第二个 provider 就会升级成 seam」的待观察项。0.2.0 线遥测面扩为产品遥测：desktop 经 OTel 采集产品遥测（`ctx.otel` service，`packages/telemetry/otel/`），session-telemetry-otel 改为 byte-bounded OTLP 上传 session log 事件（reporter 拥有字节/队列上限与 per-request watchdog，`packages/session/session-telemetry-otel/src/index.ts` 的 config 段），但 `feedback/committed` 的消费关系未变。

### 为什么这很重要

- **对 `_digested/` 框架**：它说明「seam」不是唯一的分界模式——BFF 层还有 Remote 控制器这种按通信协议切的分界；0006 的三个新 `core` 服务则补上「同一个 `ctx` 键可以是 core、是 seam、也可以是完全不切角色的自足插件」这组三分法样本。
- **对 surfaces/**：Web host/client 和 SDK 的通信方式已从「apiproxy RPC 手工暴露」换成「Remote 声明 + 生成 stub」（`packages/host/apiproxy/` 已整体删除，见上文迁移表）。
- **对 system/**：扩展表新增了「Remote 控制器」作为非显然落点。
