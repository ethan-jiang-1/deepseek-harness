# Agent Teams：多代理编组

本页是 experimental 专题的第二个面——「新服务 + 多包家族」形状的定位、webworker 关系与启用总述见 [`00-map.md`](./00-map.md)；本页讲 `ctx.agentTeams` 家族的机制。（0008 复核注记：0.1.7 线起该家族从「五包 + 两个 profile」收缩为「四包 + 一个统一 bundle」，`TeamService` 不再是 Remote 宿主服务，浏览器端改读投影；本页已按现树改述，旧机制以删除线留痕。）

## 核心服务与 ctx 键

`ctx.agentTeams: TeamService`（`packages/experimental/agent-team/src/index.ts:56` 类定义、`:78` `super(ctx, 'agentTeams')`）。`TeamService extends Service`——~~0.1.5 线它 `extends TypertRemoteService` 并把 `view` / `createTask` / `updateTask` 经 `@Remote` 导出给浏览器~~（0.1.7 线 Remote 面已删，`ctx.remote.agentTeams.*` 不再存在；浏览器端改读 Lead Session 的 `agentTeam` 投影，见 UI 落点节）。inject 五项 `agents` / `sessions` / `sessionPersistence` / `sessionProjections` / `subagents`（`:57`）：团队面需要持久 session 存储才激活，成员创建直接复用 subagent seam 的 spawn / fork provider。

## 状态与持久化

完全走 Lead Session 的 event log + projection，不另设存储。四个 log-only 事件 `team/member` / `team/task` / `team/message/queued` / `team/message/delivered`（`packages/experimental/agent-team/src/types.ts:232`-`:238`）先 append 后 flush，flush 成功才算操作成功（`TeamJournal.appendAndFlush`，`packages/experimental/agent-team/src/journal.ts:60`-`:70`），且这些协调记录不进入派生模型历史。投影经 `ctx.root.sessionProjections.register(teamProjectionDefinition)` 注册（`packages/experimental/agent-team/src/index.ts:114`）；崩溃恢复挂 `agent/created`（session-start 边，0.1.7 线自 `agent/session-start` 改名；`:108`），把未终结的 provisioning 记录对照 child 自己持久化的 Session 判成 active/failed。Team identity 无需创建事件：每个普通 runtime 根都是隐式 Lead，`TeamId` 就是其 `SessionId` 的 branded 别名（`packages/experimental/agent-team/src/types.ts:8`-`:16`）。服务层上限默认 maxMembers **16**、maxTasks 256、maxPendingMessagesPerMember 64、maxMessageBytes 65536、disposalTimeoutMs 5000（`packages/experimental/agent-team/src/index.ts:41`-`:45`；agent-team-profile 的 patch 行把 maxMembers 钉回 8，部署配置覆盖代码默认）。

## 模型侧工具

`tool-agent-team` 注册九个工具——`spawn_teammate`、`send_message`、`list_agents`、`wait_agent`、`interrupt_agent`、`team_task_create` / `team_task_list` / `team_task_get` / `team_task_update`（`packages/experimental/tool-agent-team/src/index.ts:170`-`:365`），外加每个成员 scope 里的固定 `team:policy` prompt 段（`:170`）。注册是成员级而非全局：`maybeInstall` 检查 Agent 的 Team membership，非 Team 子代理跳过（`:405`-`:407`）；与全局 continuable 子代理控制同名的 `list_agents` / `send_message` / `interrupt_agent` 只在 Team 成员 scope 内遮蔽全局定义，宿主和非 Team 子代理仍用默认目录。

## 统一 profile bundle（0.1.7 线起 Host/Web 共用一个）

`agent-team-profile` 同时服务 Host 与 Web：disable 重名的 `tool-subagent-control` / `tool-subagent-list-agents`、把 `tool-subagent` / `tool-subagent-fork` 压成 `backgroundMode: one-shot`，再 insert `agent-team` + `tool-agent-team` + 浏览器插件 `ui-agent-team`（`packages/experimental/agent-team-profile/cordis.patch.yml`，`maxMembers: 8` 等配置在同一行）。启用方式 `dsh plugin --profile headless|web add @deepseek-ai/dsh-experimental-agent-team-profile`（已发布、从 npm 装），要求 profile 已含 `dsh-base`（其 README「Install into a profile」节）；~~旧的 Host/Web 两个 bundle 与「先 Host 后 Web」安装顺序~~（`agent-team-web-profile` 包已随 0.1.7 线删除，目录不复存在）。它也是 `OPTIONAL_BUNDLES` 成员（`packages/boot/app-boot/src/profile.ts:213-218`），shipped 安装在 Web 插件管理器里默认关、一键开。

## UI 落点

`client-ui-agent-team` 在 Web 会话头部加一个 Team 动作（名册、共享任务板、进入 teammate 会话导航），**读 Lead Session 的 `agentTeam` 投影**，不做任何 Team RPC（`packages/experimental/client-ui-agent-team/src/client/mount.ts:25` 起的模块注释明说 "performs no Team RPC"；`packages/experimental/client-ui-agent-team/src/client/index.ts:3` 导出），由 Client loader 挂载 `/client` 导出，Host 根导出是空函数（`packages/experimental/client-ui-agent-team/src/index.ts:4`）；它不扩展稳定 API Proxy、不存 Team 状态、不注册模型可见输入。~~经生成的 `ctx.remote.agentTeams.view` / `createTask` / `updateTask` 读改权威状态~~（0.1.7 线该 Remote 面已删）。

## 源码入口（四包各一行）

| 包 | 一句话 |
|---|---|
| `packages/experimental/agent-team/` | `ctx.agentTeams` 领域服务：roster / mailbox / task-board / journal / projection |
| `packages/experimental/tool-agent-team/` | 九个成员级工具 + `team:policy` prompt 段 |
| `packages/experimental/agent-team-profile/` | Host/Web 统一 profile patch（disable 重名控制、one-shot 委派、insert 服务 + 工具 + UI 三行；OPTIONAL_BUNDLES 成员） |
| `packages/experimental/client-ui-agent-team/` | Web 会话头部 Team 动作 UI（读 Lead Session 投影，无 RPC） |
| ~~`packages/experimental/agent-team-web-profile/`~~ | （0.1.7 线删除；职责并入 agent-team-profile 的统一 bundle） |

session event log 与 projection 的底层机制见 [`../session-and-loop/00-map.md`](../session-and-loop/00-map.md)；continuable 子代理的 `send_message` / steer 语义见 [`../capability-seams/03-subagent后台与产品provider.md`](../capability-seams/03-subagent后台与产品provider.md)；驾驶座用法（启用代价组合互斥表、Lead 九工具工作流、POLICY 协作纪律）见 [`../work-orchestration-primitives-ladder/07-agent-teams-驾驶座用法-启用代价Lead工作流与协作纪律.md`](../work-orchestration-primitives-ladder/07-agent-teams-驾驶座用法-启用代价Lead工作流与协作纪律.md)。
