# 四层结束边界 — step / turn / activity / goal

## 源码核验入口

`packages/core/agent-loop/src/agent.ts`（step、turn、activity）、`packages/goal/goal-round-driver/src/index.ts`（goal 层）、`packages/goal/goal/src/index.ts`（goal 状态持久化）。

## 四层总览

ruofei 文章原文：「最小 Loop 常被写成 `while (hasToolCalls)`。真实任务里，模型这一轮没再调工具，只能说明这一次请求结束了，任务未必结束。」

DSH 把一层层边界分开，每一层由不同的组件负责，终结条件也各自独立：

### step（步）

| 问题 | 答案 |
|------|------|
| 谁驱动 | `ReactLoopAgent.step()`（agent.ts:332-419） |
| 什么时候结束 | 流式 chunk 收完 → `BlockAssembler.finish` 判断：`completed`（无 tool-call）、入工具执行（可能 `concludesTurn`）、`max-tokens`、`error` |
| 对谁可见 | `step/start` → `step/end` 事件写入 session |
| 关键细节 | 请求错误（`agent/request-error`）可以 `retry`，同一 step 内重发请求，不新开 step |

### turn（对话轮）

| 问题 | 答案 |
|------|------|
| 谁驱动 | `ReactLoopAgent.turn()`（agent.ts:246-330） |
| 什么时候结束 | `preStep` 被 reject（`blocked`）；首次 step 消息为空（`completed`）；所有 step 完成后 `turn-stopping` 无人 steer 且 inbox 无 next-step 消息 |
| 对谁可见 | `turn/start` → `turn/end` 事件写入 session，`turn/end.reason` 记录结束原因 |
| 关键细节 | turn 可以含 0 个或多个 step。`turn/end` 不会发 `interrupted`——那是崩溃恢复层补的 |

### driver activity（驱动活动）

| 问题 | 答案 |
|------|------|
| 谁驱动 | `ReactLoopAgent.wakeDriver()` → `kick()`（agent.ts:172-223） |
| 什么时候结束 | `kick()` 的 `while (await this.turn()) {}` 返回 `false`（turn 返回 false 表示 inbox 无待唤醒消息） |
| 对谁可见 | `agent/status` 从 `'running'` 变回 `'idle'` |
| 关键细节 | `maintenance` 阶段 `status` 也是 `'idle'`。`kick()` catch 所有 error 并 contained 在 driver 边界。activity 结束后自动重检查 `wakeRequested` |

### goal（持久目标）

| 问题 | 答案 |
|------|------|
| 谁驱动 | `Goal Round Driver` 监听 `agent/status === 'idle'` |
| 什么时候结束 | `goal/change` operation = `complete` / `blocked` / `clear`；或自动 `round-limit` block；或 `disarm` |
| 对谁可见 | `goal/change` 事件写入 session，`goal` projection 单元对外暴露 |
| 关键细节 | agent idle 不代表 goal 结束。只有 goal 不再 `active + armed` 才算正经结束 |

## turn/end 的 reason 对照

`turn/end` 的 `reason` 字段记录这一轮为什么结束，各方据此决定下一步行动：

| reason | 含义 | round-driver 反应 | user 看到 |
|--------|------|-------------------|-----------|
| `{ kind: 'completed' }` | 正常完成，无更多 step | 检查 goal，若 active+armed 则下一轮 | 模型回复正常展示 |
| `{ kind: 'max-tokens' }` | 输出达到 token 上限 | **disarm** goal！不再自动续轮 | 消息截断 |
| `{ kind: 'aborted', reason }` | 被取消（user / parent / disposed） | attempt 标记 cancelled，driver 重新评估 | 中途打断 |
| `{ kind: 'blocked' }` | pre-step 拒绝，无 step 被处理 | 不特别处理（pre-step hook 可能已 block goal） | 未产生回复 |
| `{ kind: 'error', error }` | 执行出错 | disarm | 错误提示 |

## 崩溃恢复

进程崩溃时，session log 里有 `turn/start` 但没有匹配的 `turn/end`。恢复时持久化系统会给这些孤儿 turn 补上：

```
turn/start (turn=5)
  step/start (turn=5, step=1)
  step/end   (turn=5, step=1)  ← 这之前的都可信
  ? 可能还有未闭合的 step 或 chunk  ?
turn/end (turn=5, reason={ kind: 'interrupted' })  ← 恢复时补的
```

这发生在加载时，不是 loop 运行时发的。`turn/end` 的 `interrupted` 只用于恢复。不要和 `assistant/message.interrupted` 混——那是 loop 取消时主动写的前缀定稿。

## Goal 的持久化保障

Goal 不依赖进程内存：所有 `goal/change` 事件写入 session log。进程重启后，fold 函数（`fold.ts`）从 log 重放所有 goal 事件，重建 goal 状态。如果进程崩溃时 goal 是 active + armed，重启后 driver 重新订阅，仍在 active 状态的 goal 会继续得到自动续轮。

Goal 与 Agent Loop 之间没有直接耦合——loop 不检查 goal，driver 不干涉 turn/step。它们只通过两件事通信：

1. `agent.followup()` — driver 往 inbox 写消息，loop 从 inbox 读消息
2. `agent/status === 'idle'` — driver 监听这个信号决定要不要写

## 场景：一次完整的 goal 生命周期

```
人: "把这个模块重构了"
                     ↓
模型推断是长期任务，调用 create_goal
                     ↓
goal/change { operation: 'create', phase: 'active' }
  round-driver 被 goal/changed 事件触发
  → 但 agent 正在 running，不满足 idle
                     ↓
turn 结束，agent 回到 idle
  round-driver 收到 agent/status === 'idle'
  → drive() 检查通过
  → followup() 注入 round 1 的 <goal_round> prompt
                     ↓
turn（round 1）:
  模型工作 → 部分完成 → 没调 complete → turn 结束
                     ↓
agent idle → driver 注入 round 2
                     ↓
turn（round 2）:
  模型继续工作 → 全部完成 → 调 update_goal complete
  → deferContext() 注入 <goal_complete> wrapup
  → 模型向人写关闭消息 → turn 结束
                     ↓
agent idle → driver 检查 goal.phase === 'complete'
  → 直接 return → 不再续轮
                     ↓
完结
```

## 四层分别由谁关停

| 层 | 关停操作 | 源码位置 |
|----|---------|---------|
| step | `step()` 内 `return { kind: 'completed' }` 或 `{ kind: 'max-tokens' }` | agent.ts:410, 412 |
| turn | `return false` 且 inbox 无 pending | agent.ts:324-329 |
| activity | `kick()` finally 块 `setPhase({ kind: 'idle' })` | agent.ts:217-221 |
| goal | `ctx.goals.complete()` / `block()` / `clear()` | goal/src/index.ts:245-400<br>goal-round-driver:166-172（auto block） |
