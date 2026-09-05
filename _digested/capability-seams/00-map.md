# Capability seams · 可替换能力

## 一句话

一条 **seam** 是可替换的**完整能力**，必须有三个角色：Service Definition、Service Provider、Consumer。单独一个角色不是 seam。加一项能力，意味着把三者一并设计。

扩展插件依赖 Definition，绝不依赖具体 Provider。这就是「换一个后端，整面产品跟着变，Consumer 不用改」的原因。

## 三角色

![一条 seam 的三个角色](./figures/three-roles.svg)

| 角色 | 它是什么 | 典型落点 |
|------|----------|----------|
| **Service Definition** | 声明 `ctx.<key>` 和词汇的 Cordis `Service`（抽象类或注册表，不是 `interface`） | `dsh-shell` 的 `ShellExecutor` |
| **Service Provider** | 实现它 | `dsh-bash-local` / `dsh-bash-sandbox` |
| **Consumer** | 注入并使用；常见是面向模型的 tool | `dsh-tool-bash` |

一个包可以兼多个角色——`dsh-llm` 同时拥有 Definition 和 Consumer。角色分包装，是因为它们会独立演化；合在一个包里，是因为它们就是同一件事。

**设计 Definition 时对着所有当前 Consumer。** tool-schema、Loader、UI、传输、某个 provider 的癖好，放在 Consumer 或 provider 里。反味：一个公开服务方法只有一个内部调用者——那多半该是私有闭包，不该抬成合同。

看到新的 `ctx.<key>`，先问它是 spine 服务、一条 seam、还是 bundle 组合点。只有三角色齐全才叫 seam。

## 远程执行世界与本地 confinement

![E2B 远程执行世界与本地 argv confinement](./figures/execution-world.svg)

在 E2B 组合里，`dsh-fs-e2b` 与 `dsh-subprocess-e2b` 注入同一个 `ctx.e2b`，因此共享一棵远程 Linux 目录树和进程世界。依赖 `ctx.fs` / `ctx.subprocess` 的 Consumer 随 provider 组合切换，不必为远程再 fork 一份实现。

本地 shell 经 `ctx.subprocess` spawn；`ctx.sandbox` 在 spawn 前包装 argv。这种 confinement 约束一次本地进程启动，不会自行迁移 `ctx.fs`，也不等于一套完整的远程执行世界。Consumer 面对的是 Definition，不是「我在哪台机器上」。

subagent 是同一模式的另一个例子：一个接口后面，可以是进程内 child agent，也可以是经 ACP 或 JSON-RPC 驱动的独立进程。产品 Codex / Claude Code provider 不在 `dsh-base` 里默认安装；它们是独立 Profile Bundle，装进 profile 后各自注册一个 dormant 默认 provider，preset 的 tool 行再用 `backgroundMode` 选择一次性 Job 还是可续 child。见 [`03-subagent后台与产品provider.md`](./03-subagent后台与产品provider.md)。

> **subagent model routing**：上游 #2868 使 subagent 可通过 DSH SDK 进行动态 model routing。`subagent-dsh-sdk` provider 将 child model 选择委托给 SDK 内置路由，不再硬编码 provider 名称。

## 不是 seam 的调度：schedule（agent 作用域持久提醒）

`packages/schedule/schedule/` 提供 **session-local durable reminders**，不是 Service seam——没有 `ctx.schedule`、没有 Definition/Provider 可分包装。模型经 `schedule_create` / `schedule_list` / `schedule_delete` 三个工具创建一次性或固定间隔提醒，触发后以普通 follow-up 消息回到同一会话；提醒经 session event log 持久化，重启后仍会投递。它是自足插件（`ScheduleRuntime` 按 root agent 实例化）+ `scheduleProjectionDefinition` + Web 侧只读 catalog（`client/ui-schedule`）。它说明：能力可以按需装成插件，不必都切三角色（对照见 [`04`](./04-新增seam与Remote.md)）。

## 新增 seam：Webhook

`packages/webhook/webhook/` 和 `packages/webhook/webhook-github/` 提供了 webhook ingress 能力：

- **Definition**（`webhook/`）：`ctx.webhookRuntime` — 认证投递分发、Workspace Session 创建
- **Provider**（`webhook-github/`）：GitHub webhook 事件处理和签名验证
- **Consumer**：webhook ingress 插件，通过 `ctx.webhookRuntime` 接收外部事件

## 非三角色 seam：API Remote 架构

上游 #3073 等系列 PR 引入了一个**不是传统三角色**的新模式：**API Remote 控制器**。`packages/api/remotes/` + `packages/typert/` 替代了 `packages/host/apiproxy/` 中的 unary RPC 路由。

| 角色 | 它是什么 | 典型落点 |
|------|----------|----------|
| **Remote 声明** | Host 侧声明 Remote 控制器及其 schema（typert generator） | `packages/api/remotes/` |
| **Client stub** | 生成器自动导出的 client 侧 stub | `packages/api/remotes/src/client/` |
| **Transit** | 类型安全的序列化/反序列化层 | `packages/typert/` |

Remote 不是传统 seam 因为它没有 `ctx.<key>`、没有 Cordis Service 定义。它纯粹是 BFF 层的**通信协议模式**：Host 提供一组 Remote 控制器、Client 消费生成的 stub，双方通过 Typert 的 schema 保持类型安全。

迁移路径：settings、credentials、subagent control、agent-presets、workspace-controller、session-controller 已从 apiproxy 迁移到 Remote；`packages/host/apiproxy/` 包已整体删除。directory-picker 不是 Remote——它是 `ctx.directoryPicker` Service seam（native/browse 后端，[`2026-07-28-directory-picker-capability-seam`](../../.agents/notes/implemented/architecture/2026-07-28-directory-picker-capability-seam.md)）。

教科书路径：顺着 `packages/shell/` 走完 Definition → provider → `dsh-tool-bash`。组级 README 拥有「这个组有哪些包、对应哪个 `ctx` key」——本专题不手抄完整包表，完整图在生成的 [`docs/capability-seams.md`](../../docs/capability-seams.md)。

## 源码入口

| 路径 | 角色 |
|------|------|
| [`docs/glossary.md`](../../docs/glossary.md) `capability-seam` | 术语合同 |
| [`docs/capability-seams.md`](../../docs/capability-seams.md) | 生成的包 / key / 实现 / 消费者图 |
| `packages/shell/` | 范本家族 |
| `packages/fs/`、`packages/subprocess/` | 执行世界的文件与进程能力 |
| `packages/sandbox/` | 本地进程 argv confinement |
| `packages/llm/` | Definition 与 Consumer 可同包 |
| `packages/subagent/` | 差异极大的 provider，同一接口 |
| `packages/schedule/schedule/` | agent 作用域持久提醒（`schedule_*` 工具，非 seam） |
| `packages/webhook/webhook/` | `ctx.webhookRuntime` 认证投递 |
| `packages/api/remotes/` | Remote 控制器（非传统 seam） |
| `packages/typert/` | 类型安全的 Remote 序列化 |
| [`2026-06-13-capability-seams`](../../.agents/notes/implemented/architecture/2026-06-13-capability-seams.md) | 为什么这样切 |

## 机制级正文

| 文件 | 内容 |
|------|------|
| [`01-三角色与分包装.md`](./01-三角色与分包装.md) | 分包装的味道；换 E2B 时 tool 源码不动 |
| [`02-一次bash从tool到sandbox.md`](./02-一次bash从tool到sandbox.md) | resolve → confine → spawn；run 的失败合同；持久 bash 的 prompt 就绪 |
| [`03-subagent后台与产品provider.md`](./03-subagent后台与产品provider.md) | `backgroundMode` one-shot / continuable；产品 provider 的 host 平面 opt-in |
| [`04-新增seam与Remote.md`](./04-新增seam与Remote.md) | Schedule、Webhook 新 seam；API Remote 非三角色通信模式 |

模型可见的 tool 管道在 [`../tools-prompt-llm/00-map.md`](../tools-prompt-llm/00-map.md)。
