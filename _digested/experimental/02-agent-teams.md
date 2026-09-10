# Agent Teams：多代理编组

本页是 experimental 专题的第二个面——「新服务 + 多包家族」形状的定位、双包 webworker 关系与启用总述见 [`00-map.md`](./00-map.md)；本页讲 `ctx.agentTeams` 家族的机制。

## 核心服务与 ctx 键

`ctx.agentTeams: TeamService`（`packages/experimental/agent-team/src/index.ts:38`-`:42` 声明、`:59` 类定义、`:81` `super(ctx, 'agentTeams')`）。`TeamService extends TypertRemoteService`（`:59`）——它同时是生成 Remote 方法的宿主服务，`@Remote('view')` / `@Remote('createTask')` / `@Remote('updateTask')` 三个方法（`:242`/`:256`/`:267`）经 `./remote` 导出给浏览器端。inject 五项 `agents` / `sessions` / `sessionPersistence` / `sessionProjections` / `subagents`（`:60`）：团队面需要持久 session 存储才激活，成员创建直接复用 subagent seam 的 spawn / fork provider。

## 状态与持久化

完全走 Lead Session 的 event log + projection，不另设存储。四个 log-only 事件 `team/member` / `team/task` / `team/message/queued` / `team/message/delivered`（`packages/experimental/agent-team/src/types.ts:221`-`:230`）先 append 后 flush，flush 成功才算操作成功（`TeamJournal.appendAndFlush`，`packages/experimental/agent-team/src/journal.ts:60`-`:70`），且这些协调记录不进入派生模型历史。投影经 `ctx.root.sessionProjections.register(teamProjectionDefinition)` 注册（`packages/experimental/agent-team/src/index.ts:117`）；崩溃恢复挂 `agent/session-start`（`:111`），把未终结的 provisioning 记录对照 child 自己持久化的 Session 判成 active/failed。Team identity 无需创建事件：每个普通 runtime 根都是隐式 Lead，`TeamId` 就是其 `SessionId` 的 branded 别名（`packages/experimental/agent-team/src/types.ts:8`-`:16`）。上限默认 maxMembers 8、maxTasks 256、maxPendingMessagesPerMember 64、maxMessageBytes 65536、disposalTimeoutMs 5000（`packages/experimental/agent-team/src/index.ts:44`-`:48`）。

## 模型侧工具

`tool-agent-team` 注册九个工具——`spawn_teammate`、`send_message`、`list_agents`、`wait_agent`、`interrupt_agent`、`team_task_create` / `team_task_list` / `team_task_get` / `team_task_update`（`packages/experimental/tool-agent-team/src/index.ts:174`-`:380`），外加每个成员 scope 里的固定 `team:policy` prompt 段（`:165`）；`followup_task` 已并入 `send_message`，一次 Steer 投递同时覆盖唤醒与冷恢复。注册是成员级而非全局：`maybeInstall` 检查 Agent 的 Team membership，非 Team 子代理跳过（`:397`-`:402`）；与全局 continuable 子代理控制同名的 `list_agents` / `send_message` / `interrupt_agent` 只在 Team 成员 scope 内遮蔽全局定义，宿主和非 Team 子代理仍用默认目录。

## 两个 profile bundle 的差异

`agent-team-profile` 是 Host 侧 patch——disable 重名的 `tool-subagent-control` 与 `tool-subagent-list-agents`、把 `tool-subagent` / `tool-subagent-fork` 压成 `backgroundMode: one-shot`，再 insert `agent-team` + `tool-agent-team`（`packages/experimental/agent-team-profile/cordis.patch.yml`）；启用方式 `dsh plugin --profile headless add @deepseek-ai/dsh-experimental-agent-team-profile`（已发布、从 npm 装），要求 profile 已含 `dsh-base`（其 README「Install into a profile」节）。`agent-team-web-profile` 只做一件事：insert 浏览器插件 `ui-agent-team`（`packages/experimental/agent-team-web-profile/cordis.patch.yml`），安装顺序是先 Host 层后 Web 层（`dsh plugin --profile web add @deepseek-ai/dsh-experimental-agent-team-web-profile`）。

## UI 落点

`client-ui-agent-team` 在 Web 会话头部加一个 Team 动作（名册、共享任务板、进入 teammate 会话导航），浏览器经生成的 `ctx.remote.agentTeams.view` / `createTask` / `updateTask` 读改权威状态（`packages/experimental/client-ui-agent-team/src/client/mount.ts:41`-`:48`），由 Client loader 挂载 `/client` 导出（`packages/experimental/client-ui-agent-team/src/client/index.ts:3`、`:12`-`:13`），Host 根导出是空函数（`packages/experimental/client-ui-agent-team/src/index.ts:4`）；它不扩展稳定 API Proxy、不存 Team 状态、不注册模型可见输入。

## 源码入口（五包各一行）

| 包 | 一句话 |
|---|---|
| `packages/experimental/agent-team/` | `ctx.agentTeams` 领域服务：roster / mailbox / task-board / journal / projection |
| `packages/experimental/tool-agent-team/` | 九个成员级工具 + `team:policy` prompt 段 |
| `packages/experimental/agent-team-profile/` | Host 侧 profile patch（disable 重名控制、one-shot 委派、insert 两包） |
| `packages/experimental/agent-team-web-profile/` | Web 侧 profile patch（只 insert 浏览器插件） |
| `packages/experimental/client-ui-agent-team/` | Web 会话头部 Team 动作 UI（经生成 Remote 读状态） |

session event log 与 projection 的底层机制见 [`../session-and-loop/00-map.md`](../session-and-loop/00-map.md)；continuable 子代理的 `send_message` / steer 语义见 [`../capability-seams/03-subagent后台与产品provider.md`](../capability-seams/03-subagent后台与产品provider.md)。
