# Goal Round Driver — 自动续轮的 loop engineering

## 源码核验入口

`packages/goal/goal-round-driver/src/index.ts`（driver 完整实现）、`packages/goal/goal-round-driver/src/prompt.ts`（round prompt）、`packages/goal/tool-goal/src/wrapup.ts`（terminal wrapup）、`packages/goal/tool-goal/src/authority.ts`（权限守卫）。

## 为什么这是 loop engineering

普通 Agent Loop 是 `while (hasToolCalls)`——模型调完工具、给出最终回复，就停了。但长期任务需要**跨越多次 turn 的持久推进**：本次模型只完成一部分，下次继续。Goal Round Driver 就是 DSH 里负责这个「继续」的组件。

你感受到的「ongoing goal 效果超级好」的本质就是这个：一次需求进去 → 模型创建 goal → 然后系统自动一轮又一轮直到完成。这就是 DSH 版本的 loop engineering。

## 一轮完整的 goal round 生命周期

下面是最典型的一次 goal round 从触发到结束的完整流程：

```
goal round N
  │
  ├─ 1. agent 回到 idle（上一轮结束）
  │      │
  │      ├─ 触发 agent/status({ status: 'idle' }) 事件
  │      │   （agent-loop/src/agent.ts:107-110, setPhase 发出）
  │      │
  │      └─ goal-round-driver 监听器收到通知
  │         （goal-round-driver/src/index.ts:259-277）
  │
  ├─ 2. requestDrive(state) 被调用（第 275 行）
  │      │
  │      ├─ 串行：state.run 保证同一 agent 不会并发两个 drive 循环
  │      │   （第 212 行：if (state.run !== undefined) return）
  │      │
  │      └─ drive() 执行（第 138 行）
  │
  ├─ 3. drive() 做六道检查（第 140-172 行）
  │      │
  │      ├─ readyToDrive(state)？→ ctx.fiber.active、未 stopping、
  │      │   agent 仍存活、agent status === idle、无 competing 消息
  │      │   缺任一 → 直接 return 不做事
  │      │
  │      ├─ needsCheckpoint？→ 先刷持久化，确保上一轮写完
  │      │
  │      ├─ attempt 未完成？→ （上一轮的 attempt 状态处理）
  │      │
  │      ├─ currentGoal() 存在？→ 无 goal 直接 return
  │      │
  │      ├─ goal.phase === 'active' && activation === 'armed'？
  │      │   不是 → 直接 return
  │      │
  │      └─ roundsStarted < maxGoalRounds？
  │         已达上限 → ctx.goals.block(agent, ref, { code: 'round-limit' })
  │
  ├─ 4. 构造 round 消息（第 174-189 行）
  │      │
  │      ├─ round = goal.roundsStarted + 1
  │      ├─ content = renderGoalRoundPrompt(goal, round)
  │      │   → 生成 <goal_round> XML 标签
  │      │   → 包含 objective、round 计数、指导语
  │      ├─ source = { kind: 'goal', goalId, revision, round }
  │      │   → 这个 source 标记很重要：pre-step 验证认它
  │      ├─ message = createUserMessage({ content, source })
  │      │
  │      └─ reservation = { round, messageId, phase: 'queued' }
  │
  ├─ 5. agent.followup(message) 入列（第 192 行）
  │      │
  │      ├─ send('next-turn', true)
  │      │
  │      └─ wakeDriver() → 创建新 activity → kick() 循环启动
  │
  ├─ 6. turn() 开始新 turn（agent-loop/src/agent.ts:246）
  │      │
  │      ├─ turn/start 事件写入 session
  │      ├─ preStep('next-turn') → inbox.claim() 取出 round 消息
  │      │
  │      └─ agent/pre-step waterfall 启动
  │
  ├─ 7. goal-round-driver 的 pre-step 拦截（第 349-414 行）
  │      │
  │      ├─ 在消息列表中找到 source.kind === 'goal' 的那条
  │      ├─ validReservation() 验证（第 334-347 行）：
  │      │   ├─ state.attempt.phase === 'claimed'（刚被 claim 的）
  │      │   ├─ !attempt.stale（未被标记为过期）
  │      │   ├─ sameQueued（内容和 source 与预约完全一致）
  │      │   ├─ goal 仍存在、id/revision 匹配、phase active、armed
  │      │   └─ source.round === goal.roundsStarted + 1
  │      │
  │      ├─ 验证失败 → attempt.stale = true 并作废（goal round 消息
  │      │   本身不退回 inbox，下轮重新构造；其他被一并 claim 的消息
  │      │   经 restoreOtherClaimed 退回 next-step）、
  │      │   requestDrive() 重新排程、pre-step 返回 reject
  │      │
  │      └─ 验证通过 → 调用 next() 让 step 继续
  │
  ├─ 8. 模型看到 <goal_round> prompt（goal-round-driver/src/prompt.ts）
  │      │
  │      ├─ "Objective: <目标>\nRound: N/M\n\nContinue working…"
  │      ├─ 模型开始工作：调工具、读文件、写代码
  │      ├─ step → 工具执行 → 下一 step → 直到模型决定：
  │      │
  │      ├─ 场景 A：模型调用 update_goal complete → 进入 wrapup
  │      ├─ 场景 B：模型调用 update_goal blocked → 进入 wrapup
  │      └─ 场景 C：模型没调 goal tool 直接 final message
  │
  ├─ 9. 场景 A/B：模型标记完成/阻塞（tool-goal/src/index.ts:295-325）
  │      │
  │      ├─ completionAuthority() 检查（authority.ts:101-107）
  │      │   ├─ direct human input？→ 允许
  │      │   └─ goal round？→ 检查 isMatchingGoalRound
  │      │      → 当前 turn 中有带 correct goalId/revision/round 的 goal 消息
  │      │      → 允许
  │      │
  │      ├─ ctx.goals.complete() / block() 持久化 goal/change
  │      │
  │      └─ deferContext() 注入 <goal_complete> 或 <goal_blocked> wrapup
  │         （wrapup.ts:17-39）
  │         → "The goal is marked complete and this autonomous run is ending.
  │            Write the closing message to the user now… Do not call any
  │            more tools in this run."
  │         → 模型写关闭消息给用户，不再调工具
  │
  └─ 10. turn 结束，agent 回到 idle
         │
         ├─ 场景 A/B：goal 已经是 complete/blocked
         │   → drive() 检查 goal.phase !== 'active' → 直接 return
         │   → 循环停止
         │
         └─ 场景 C：goal 还是 active + armed
            → drive() 正常推进下一轮
            → 循环继续：round N+1, N+2, … 直到达成
```

## 整个循环的结束条件

| 条件 | 谁触发 | 具体机制 | round-driver 反应 |
|------|--------|---------|-----------------|
| 模型 `update_goal complete` | 模型 tool | `goal/change` operation='complete'，phase→complete | `drive()` 第 165 行检查 `phase !== 'active'` → return |
| 模型 `update_goal blocked` | 模型 tool | `goal/change` operation='blocked'，phase→blocked | 同上 |
| 达最大 round 上限 | driver 自动 | driver 第 166-172 行调用 `ctx.goals.block(agent, ref, { code: 'round-limit' })` | block 后不再续 |
| `max-tokens` turn 结束 | agent-loop | driver 第 318-319 行监听 `turn/end` reason='max-tokens' → `disarm(state)` | disarm 后 `activation !== 'armed'` → 无 round |
| 人插入新消息 | 用户 | driver 第 284-290 行 `agent/inbox/inserted` → `competingQueued = true` | `readyToDrive()` 第 108 行检查 `!state.competingQueued` → 不推进 |
| 人 `/goal clear` | human 命令 | `goal/change` operation='clear'，goal 被清除 | `currentGoal()` 返回 undefined → return |
| goal pause/disarm | 各种路径 | `goal/change` phase→paused 或 activation→disarmed | drive 第 165 行检查不通过 |
| pre-step 验证失败 | driver 主动 | 第 390-398 行调用 `ctx.goals.block()` code='prompt-rejected' | block 后不再续 |

## 并发安全

同一 agent 不会有两个并发的 drive 循环：

```ts
// 第 212 行
if (state.run !== undefined) return
```

一个 drive 循环从 requestDrive 串行执行到条件不再满足。idle 事件触发 `requestDrive`，但如果在 drive 执行期间又来了一个 idle 事件，`state.requested = true` 只标一次，当前 drive 循环结束后自动重来：

```ts
// 第 216-224 行
while (state.requested && !state.stopping) {
  state.requested = false
  await drive(state)
}
```

多种事件都能触发 `requestDrive`：`agent/status` idle、`goal/changed`、pre-step 验证失败后重新排程。但它们都走同一条串行队列。

## 持久化检查点

每一轮开始前，driver 先等持久化写完（第 142-153 行）再发下一轮。这样可以保证：

- round 计数（`roundsStarted`）完全重建自 session log，不会漏 round 也不会计数超前
- 但注意：崩溃重启后 phase 重建为 active，而 activation 不持久化、重启即 disarmed——driver 要等 human re-arm（`update_goal resume`）之后才会「从 round N 重来」（见 [`03-activity-vs-goal-boundaries.md`](./03-activity-vs-goal-boundaries.md) 与 [`figures/restart-rearm.svg`](./figures/restart-rearm.svg)）
