# Inbox、唤醒与 turn 时序

源码核验入口：`packages/core/agent/src/types.ts`、`packages/core/agent/src/runtime-types.ts`、`packages/core/agent-loop/src/inbox.ts`、`packages/core/agent-loop/src/agent.ts` `ReactLoopAgent`。

本篇说明默认驱动中的 inbox 队列、claim，以及 `pre-step` 拒绝后仍关闭持久 turn 的时序。

![两个队列，三种入口](./figures/inbox-wake.svg)

## 两个列表，一份持久 splice

`InboxTarget`：`'next-turn'` | `'next-step'`。inbox 是 session-projection 的一个单元（key `inbox`，`packages/core/agent-loop/src/inbox.ts`），由投影注册表折叠 `agent/inbox/spliced` 事件重建（`Session.ownEvents()` / `Session.isOwnSeq()` 对普通消费者隐藏继承前缀比较，机制见 [`2026-08-31-session-sequence-and-log-offset-brands`](../../.agents/notes/archived/architecture/2026-08-31-session-sequence-and-log-offset-brands.md)）。

`splice` 通过 `session.append('agent/inbox/spliced', …)` 持久化；投影注册表在 `append` 的 `session/event` 驱动中同步折叠该事件，`append` 返回时投影已是新列表。实时 `agent/inbox/inserted` 与 `agent/inbox/discarded` 通知在 `append` 之后发出。

`claim(target, turn)`：抽空 `next-step`；若 `target === 'next-turn'` 再取 `next-turn` 的头一条。返回值按这个顺序。loop 的 step 边界操作，不是插件扩展点。

## 三个公开入口

`ReactLoopAgent.send(message, target, wakeup)`：

| 方法 | target | wakeup | 典型用途 |
|------|--------|--------|----------|
| `followup` | `next-turn` | true | 人的下一条，开新 turn |
| `steer` | `next-step` | true | 本 turn 内插话，下一步带走 |
| `inject` | `next-step` | false | 文件变更、AGENTS.md、skill……等下一次获准请求 |

唤醒输入不能加入已经 abort 的活动：若 `wakeup &&` 当前非 idle 且 abort 已触发，target 改成 `next-turn`。这个分类在插入**之前**拍板，以免 splice 观察者里的可重入 cancel 把它改类。

idle 时 wakeup **一定**开 turn 边界，即使消息随后被清掉。只有 latch 住的重放会在队列不再持有 wake 时被抑制。维护中或已 abort 的驱动把 `wakeRequested` latch 住，收敛后再 `wakeDriver`。`runMaintenance` 期间 `status` 仍是 `idle`。`disposed` 原因不 latch，teardown 不等模型 turn。

runtime context **不是** `inject`。`RuntimeContextProjection.project()` 造一条 `UserMessage`（`source.plugin = '@deepseek-ai/dsh-system-prompt'`），只在文本相对上次保留快照有变化时交给 pre-step 的 enter 批次。`inject` 是插件往 `next-step` 塞材料、不唤醒；两者都会在获准后变成 `user/message`，入队路径不同。

`cancel({ keepInbox })`：默认 `inbox.clear()`（先 next-step 再 next-turn）。`keepInbox` 只 abort 活动，不记 canceled splice。

## `turn()` 里实际发生的事

1. `session.append('turn/start', { turn })` —— 在 claim 和 pre-step **之前**。所以拒绝也有打开的 turn。
2. `preStep`：**先 `claim`**（消息已从 inbox 耐久删掉并 `agent/inbox/claimed`），再 `systemPrompt.assemble`，再把 runtime context 快照（若与上次不同）拼进 inner 的 `messages`，最后 `waterfall('agent/pre-step')`。inner 默认 `{ kind: 'enter', messages: claimed + context? }`。
3. `reject` → `turnEnds = { kind: 'blocked' }`，没有 step，也**没有** `user/message`。claimed 的条目不会回到 inbox。
4. 首次 step 且 `messages.length === 0`（唤醒消息被拿掉，或 enter 被改写成空）→ `completed`，仍无 step。
5. 否则 `step/start`，逐条 `system/message`（surface 节点 0）与 `user/message`（`surfaceOp: 'append'`），再 `step()`。
6. 工具还欠一次请求，或 `next-step` 又有货 → 下一 step 的 target 是 `next-step`。
7. 有结束原因且 `next-step` 为空时，`serial('agent/turn-stopping')`（没有 `next()`）；监听器可 `agent.steer()`，驱动随后重读 inbox，有新工作就继续下一 step。
8. `finally` 里 `turn/end`。loop **不等** turn 边界上的 flush；checkpoint 策略另挂。

`turn/end` 的 `interrupted` 只给持久化后端关崩溃孤儿 turn；loop 从不发这个标记。别和 `assistant/message.interrupted` 混：那是 loop 在取消时主动写的前缀定稿（见 `step()` 一节），不是 `turn/end` 的字段。

## `step()` 与历史

`buildRequest(..., this.session.deriveMessages(), ...)`。流：

```text
llm.stream / preparedCall.stream（整个 for-await 包在 try/catch，流经 AssistantStreamAttempt 累积）
  signal.aborted 且有已送达前缀 → append assistant/message（interrupted: true，内嵌 stream；
    未派发的 tool-call 不在），再 rethrow
  signal.aborted 但无内容 → append assistant/attempt
finish 为 error/aborted → append assistant/attempt，waterfall agent/request-error；
  retry 则同一 step 再来，不新开 step
  否则 createAssistantMessage → assistant/message（surfaceOp append，内嵌 stream 与 usage）
  max-tokens → 该 step 结束，turn 上 sticky
  无 tool-call → completed
  有 → executeToolCalls；可往 next-step splice 上下文
```

请求头：`request/header` 在 dispatch 前写入。对截至某次请求的日志前缀取最后一份，即可重建当时的 config 与 tools（system prompt 是 surface 节点）。`request/context` 只在路由或容量变时写，不参与 header 相等。

## `claim` 与 architecture 的对应

architecture 写「claim next-step 加上一条排队消息」。源码是：第一步 `target = 'next-turn'`（抽空 next-step **并且**取一条 next-turn）；后续 step 只 claim next-step。inject 的材料若在第一步之前就已经在 next-step 里，会和这条 followup **同一 step** 进入模型。
