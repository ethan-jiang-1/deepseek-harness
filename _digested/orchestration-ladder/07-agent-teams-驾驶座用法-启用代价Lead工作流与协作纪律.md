# agent-teams 的驾驶座用法：启用代价、Lead 工作流与协作纪律

源码核验入口：`packages/experimental/tool-agent-team/src/index.ts`（`POLICY` 与九个成员级工具）、`packages/experimental/agent-team-profile/cordis.patch.yml` 与 `README.md`、`packages/experimental/agent-team/src/index.ts`（服务上限）、`packages/boot/app-boot/src/profile.ts`（OPTIONAL_BUNDLES）。

本页回答：启用 agent-teams 的组合代价是什么（你换掉了什么）？Lead 的实际工作流怎么串九个工具？`team:policy` 里的协作纪律有哪些？机制（TeamService、journal、投影、九工具注册、UI 落点）见 [`../experimental/02-agent-teams.md`](../experimental/02-agent-teams.md)；选择语义（仅显式要求、与 subagent 控制面互斥）见 [`02-什么时候用哪个原语-官方选择决策语义全景.md`](./02-什么时候用哪个原语-官方选择决策语义全景.md)；队友创建复用的 spawn/fork 语义见 [`03`](./03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md)。

## 为什么是这个形状：设计考量

**为什么需要 teams 这个原语**：subagent 委派解决「一次性把活交出去」，但**协调状态活不过一次委派**——任务清单、成员分工、相互消息在 one-shot 结束时全部蒸发；全局控制面（`list_agents`/`send_message`）是**人类驱动**的：要人（或顶层模型）逐个派活、逐个收结果。当工作是「几个人**持续**协作、互相等、共享一个任务板」时，这两者都撑不住。teams 的答案是给 Lead 一套**持久的协调状态**：具名队友（可 offline/resume）、跨崩溃的任务板与邮箱（事件日志 + 投影，见 [`../experimental/02-agent-teams.md`](../experimental/02-agent-teams.md)）——**协调状态本身成为会话的可重放事实**。这个选择的代价是组合互斥（见下节启用代价表）：重名控制面必须让位、continuable 委派被压缩——**DSH 用「换掉低层原语」而不是「叠加」来表达这是一个不同的协作模式**，避免同一会话里两套控制语义打架。experimental 的包装也是考量：用户要能从 npm 一键装完整组合，而内部原型保持私有——所以它是 `OPTIONAL_BUNDLES` 里的一个独立 bundle，而非散装包（`.agents/notes/implemented/architecture/2026-08-18-experimental-agent-teams-packages.md`）。

## 启用代价：一个 bundle 换掉的东西

启用方式：`dsh plugin --profile <name> add @deepseek-ai/dsh-experimental-agent-team-profile`（已发布、从 npm 装，要求 profile 已含 `dsh-base`），或 Web 插件管理器（Official 组）一键开——它是 `OPTIONAL_BUNDLES` 成员（`packages/boot/app-boot/src/profile.ts:214`）。统一 bundle 同时服务 Host 与 Web。

组合代价表（`packages/experimental/agent-team-profile/README.md:49` 与其 `cordis.patch.yml`）：

| 动作 | 你得到/失去什么 |
|------|----------------|
| disable `tool-subagent-control` / `tool-subagent-list-agents` | 全局 `send_message`/`interrupt_agent`/`list_agents` 让位给成员级同名工具（非 Team 成员也看不到全局控制面） |
| `tool-subagent` / `tool-subagent-fork` 压成 `backgroundMode: one-shot` | **continuable 委派语义没了**——subagent 不再返回可持续对话的 id，一次性等待 |
| insert `agent-team` + `tool-agent-team` + `ui-agent-team` | TeamService、九工具、Web 会话头部的 Team 动作（名册/任务板/队友导航，读投影无 RPC） |
| **workflow 不动** | Workflow 保留 base 的 `spawn` provider——脚本扇出 fresh children 照常可用 |

服务上限（`packages/experimental/agent-team/src/index.ts:41`-`45`；profile 把 `maxMembers` 钉回 8）：`maxMembers` 代码默认 16 / profile 钉 8、`maxTasks` 256、`maxPendingMessagesPerMember` 64、`maxMessageBytes` 65536、`disposalTimeoutMs` 5000。**团队面需要持久 session 存储才激活**（机制见 [`../experimental/02-agent-teams.md`](../experimental/02-agent-teams.md)）。

## Lead 的工作流：九个工具怎么串

每个普通 runtime 根都是**隐式 Lead**（`TeamId` 就是其 `SessionId` 的 branded 别名，无需创建事件）。一个典型 Lead 工作流：

```text
spawn_teammate（仅 Lead；context: fresh 无 Lead 历史 / fork 继承已完成轮次）
  → team_task_create（subject + description + blocked_by 依赖 + write_scopes）
  → send_message 派活（steer 运行中队友 / 唤醒 inactive 队友）
  → wait_agent（观察变化；醒后 re-list）
  → team_task_list / get（看 readiness/owner/revision/blockers）
  → 队友 claim（CAS revision）→ perform → complete
  → Lead 等齐 required teammates → 最终答案
```

驾驶座要点（工具描述与 `POLICY`，`packages/experimental/tool-agent-team/src/index.ts:31`-`37`、`:177`-`365`）：

- **`send_message` 成功即持久**："A successful send is already durable even when its result says queued; **do not resend it**."——steer 运行中目标于最近 step 边界、start/resume inactive 目标；送达的 peer 消息以稳定 message id + sender 名开头；
- **`wait_agent` 只观察不唤醒**："Wait for the next teammate status, mailbox, or shared-task change **after this call starts**. This never wakes inactive members and returns noProgress immediately when no other member is running or provisioning. **Re-list after wakeup or timeout instead of polling.**"（`timeout_ms` 10000–3600000，默认 30000）；等待前先 `list_agents` 确认有 running/provisioning 的队友，inactive 的先用 `send_message` 唤醒（`NO_ACTIVE_PEER_MESSAGE`，`:41`-`42`）；
- **任务板是 CAS 工作流**："Shared-task workflow is list, get, **claim with the current revision**, perform the work, then complete."——`team_task_update` 用 `expected_revision` 做前置条件（"Compare-and-set a shared task action using the latest revision"，`:362`）；`team_task_list` 返回 readiness/owner/revision/blockers/**write-scope warnings**；
- **任务就绪不自动开工**："**Task readiness never starts an owner.**"——依赖解开只是就绪，owner 不会因此开 turn，要 `send_message` 去叫。

**可写接口**（`packages/experimental/tool-agent-team/src/index.ts:177`-`365`）：

```json
{ "description": "审计 01-05 页引用", "context": "fresh" }
{ "subject": "fix-out-of-bounds", "description": "修复 ref-sweep 报告的全部越界引用", "blocked_by": ["t1","t2"],
  "write_scopes": ["_digested/orchestration-ladder/"] }
{ "task_id": "t3", "expected_revision": 2, "action": "claim" }
```

`context`：`fresh`（无 Lead 历史）/ `fork`（继承已完成轮次）；`write_scopes` 是 **advisory** 工作区相对前缀（"Advisory workspace-relative file or directory prefixes this task expects to modify"，`:295`-`298`）；一切任务变更一律 `expected_revision` CAS。

## 走查：一次完整的团队会话

规则集读一遍不如演一遍。场景就用读者自己的世界：**本专题有 1437 条 path:line 引用，要一支小队交叉复核并修复越界**——每一步都是你刚经历过的工作。任务板长这样（外部叙事爱画订单支付的 DAG；这张是真的）：

| 任务 | blocked_by | write_scope | 期望产物 |
|------|-----------|-------------|---------|
| audit-01-05：抽查 01-05 页引用 | —（与 audit-06-09 **天然并行**） | 只读 + `docs/audit-01-05.md` | 可疑行号清单 |
| audit-06-09：抽查 06-09 页引用 | — | 只读 + `docs/audit-06-09.md` | 可疑行号清单 |
| fix-out-of-bounds：修复越界 | audit-01-05、audit-06-09（**汇聚等待**） | 专题各页 | `ref-sweep` 新专题零问题 |

![一次 agent-teams 会话的走查](./figures/team-session-walkthrough.svg)

1. **你说「开个 team，把引用复核一遍」**——过了 explicit-ask 门槛（POLICY 首句：只在用户显式要求时才建队友）；当前会话的 agent 成为隐式 Lead。
2. **Lead 派两个 auditor，都用 `fresh`**——读文件核行号不需要对话历史（`fork` 留给要继承 Lead 勘察轮次的角色，比如让一个队友评审 Lead 自己的初步结论——种子语义见 [`03`](./03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md)）。
3. **建三个任务如上表**：两个 audit 无依赖并行跑，fix 汇聚等两者——顺序用 `blocked_by` 表达、写域不相交；但这是 **advisory 不是锁**（POLICY 纪律 1）。
4. **`send_message` 各派一个 audit**——成功即持久，即使结果显示 queued 也不重发。两个 auditor 各自按 CAS 工作流认领：list → get → claim（带当前 revision）→ perform → complete。
5. **auditor-b 写抽查记录时撞上 `FS_STALE_VERSION`**——因为 Lead 同一时刻正在改 00-map（共享文件系统、编辑即时可见，这正是 teams 的核心假设）——按协议 read → rebase 到新内容 → retry。
6. **auditor-b 用 `send_message` 回话给 Lead**（child→parent 的 relay 通道，消息带 sender 名）：06 页有一条引用行号可疑。
7. **Lead `wait_agent` 等两个 audit**——先 `list_agents` 确认有 running 的队友再等（否则 noProgress 立即返回）；醒来后 re-list，不轮询。两个 audit complete，fix 就绪——**但没人动**——「Task readiness never starts an owner」，就绪不会自动开工（新手最容易栽的坑：等半天没人动，其实要主动唤）。Lead 自己领 fix。
8. **Lead 修引用、审最终 diff、跑 `node _digested/ref-sweep.mjs`**——POLICY 纪律 2 的兜底义务：bash 不受文件系统版本守卫保护，最终一致性由 Lead 把关（这就是外部叙事「Reviewer 门禁」的真实形态：没有独立评估器，Lead 兜底）。
9. **等齐 required teammates 才给最终答案**（POLICY 收尾门槛）：哪些引用修了、哪些是其他专题的已知历史命中。

**你会看到什么**（Web 会话头部的 Team 动作，读 Lead Session 投影）：名册里两个 auditor 的状态行 provisioning → running → inactive（注意 `inactive` 不代表完成——状态词汇表）；任务板上两个 audit 从 pending 走到 completed、fix 从 blocked → ready → in_progress → completed；写域若有重叠会显示警告。

**任意一步崩溃**：消息与任务板都在 Lead Session 的事件日志里（四个 log-only 事件 + 投影，见 [`../experimental/02-agent-teams.md`](../experimental/02-agent-teams.md)）——重启后队友 resume 时收到排队的消息，任务板原样；对照外部叙事虚构的 `dsh rollback --task`：真实的恢复语义是**会话级持久**，不是任务级回滚。走查中每条规则的出处：explicit-ask/唤醒/收尾门槛在 `packages/experimental/tool-agent-team/src/index.ts:31`-`37`；CAS 与工具描述在 `:177`-`365`；fork 种子在 [`03`](./03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md)。

## POLICY 的协作纪律（共享文件系统是核心假设）

`team:policy` 是 Lead 与队友共享的协作指南（`packages/experimental/tool-agent-team/src/index.ts:31`-`37`），四条硬纪律：

1. **写域拆分是 advisory 不是锁**："The Team Lead and all teammates share the same working directory and filesystem. Edits are immediately visible to every member. **Split write work into disjoint scopes, record expected write scopes on shared tasks, and use task dependencies when work must be ordered. Write-scope overlap is advisory, not a lock.**"
2. **文件改动的重试协议**："Prefer read/edit/write for file changes. If a file operation returns `FS_STALE_VERSION`, read the current file, rebase your intended change onto the new content, and retry."——**bash、formatter、代码生成器、脚本不受文件系统版本守卫保护**：显式协调，**Lead 审最终 diff 并跑测试**；
3. **状态词汇表不许误读**：`inactive` 只表示"没有 turn 在执行"，**不描述任务完成/成功/失败/等待**；`provisioning` = 创建中；`failed` = 创建失败；
4. **Lead 的收尾门槛**："The Lead must wait for required teammates before giving the final answer."

## 持久语义：跨崩溃的协调状态

消息与任务状态**完全走 Lead Session 的事件日志 + 投影**，不另设存储（机制见 [`../experimental/02-agent-teams.md`](../experimental/02-agent-teams.md)）：四个 log-only 事件先 append 后 flush，flush 成功才算操作成功；协调记录不进派生模型历史。驾驶座效果：**崩溃/重启/中断后，离线队友 resume 时收到排队的消息**——"Messages and task state survive crashes, reloads, and interruptions"（`packages/experimental/agent-team/README.md:12`）。

## 与阶梯的关系：什么时候选 teams

对照已核验的选择语义（[`02`](./02-什么时候用哪个原语-官方选择决策语义全景.md)）：

| 维度 | subagent/fork | workflow | agent-teams |
|------|--------------|----------|-------------|
| 触发 | 常规委派（一两次优先） | 用户显式要求大规模编排 | 用户显式要求 teams/teammates |
| 协调状态 | 无（one-shot）或 inbox（continuable） | 脚本内（随 run 消失） | **持久任务板 + 双向邮箱（跨崩溃）** |
| 成员生命 | 一次或可续 | run 内 | **长驻具名队友（可 offline/resume）** |
| 与 subagent 工具 | — | 保留 spawn provider | **互斥替代**（disable + one-shot 压缩） |

一句话判据：**一次性委派用 subagent，吞吐型扇出用 workflow，需要长驻协作与共享任务板才上 teams**——而 teams 的成员创建机制就是 spawn/fork（[`03`](./03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md)），所以它买到的是协调状态，不是新的委派原语。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/experimental/tool-agent-team/src/index.ts:31`-`37` | `POLICY` 全文：写域纪律、FS_STALE_VERSION 协议、状态词汇、收尾门槛 |
| `packages/experimental/tool-agent-team/src/index.ts:177`-`365` | 九个成员级工具的描述（spawn/wait/task 族） |
| `packages/experimental/tool-agent-team/src/index.ts:41`-`42` | `NO_ACTIVE_PEER_MESSAGE`：wait 前先唤醒的指令 |
| `packages/experimental/agent-team-profile/cordis.patch.yml` | 组合代价：disable/one-shot 压缩/insert 三段 |
| `packages/experimental/agent-team-profile/README.md:49` | "subagent 与 fork 工具被 disable；Workflow 保留 spawn" |
| `packages/experimental/agent-team/src/index.ts:41`-`45` | 服务上限（maxMembers 16/8、maxTasks 256 等） |
| `packages/experimental/agent-team/README.md:12` | 持久语义一句话（crashes/reloads/interruptions） |
| `packages/boot/app-boot/src/profile.ts:213`-`218` | OPTIONAL_BUNDLES |
| `_digested/experimental/02-agent-teams.md` | 机制深挖（引用不重复） |
