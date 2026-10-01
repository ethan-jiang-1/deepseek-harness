# goal 的驾驶座用法：objective 写法、轮预算与终结纪律

源码核验入口：`packages/goal/tool-goal/src/index.ts`（工具 schema 与政策 guidance）、`packages/goal/tool-goal/src/wrapup.ts`（终结收尾指令）、`packages/goal/goal-round-driver/src/prompt.ts`（轮 prompt）、`packages/goal/goal/src/index.ts`（服务 Config）、`packages/goal/command-goal/src/index.ts`（`/goal` 命令）、`.agents/notes/implemented/feature/2026-07-16-harness-level-loop.md`（两策略决策）。

本页回答：作为 goal 的使用者（驾驶座），objective 该怎么写、轮预算怎么定、complete/blocked 怎么判定、`/goal` 命令面有什么、resume 之后怎么重新武装？**机制不重复**：goal 状态机与 CAS 见 [`../agent-loop/01-goal-lifecycle.md`](../agent-loop/01-goal-lifecycle.md)，Round Driver 的自动续轮见 [`../agent-loop/02-goal-round-driver.md`](../agent-loop/02-goal-round-driver.md)，四层结束边界见 [`../agent-loop/03-activity-vs-goal-boundaries.md`](../agent-loop/03-activity-vs-goal-boundaries.md)；什么时候选 goal（而不是 subagent/workflow/ralph）见 [`02`](./02-什么时候用哪个原语-官方选择决策语义全景.md)。

## 一场 goal 的驾驶座时间线

```text
人类需求（可不说 goal 一词）
  → 模型调 create_goal（objective + 可选 max_goal_rounds）或你敲 /goal <objective>
  → active · armed：Round Driver 在 idle 时自动注入 <goal_round> prompt，一轮轮推进
  → 终结：complete / blocked（模型自报）或你手动 pause/clear
  → 终结时模型收到 <goal_complete>/<goal_blocked> 收尾指令，写给用户的最终消息
```

### objective 怎么写：官方指引只有一句但字字有据

`create_goal` 的 `objective` 参数描述（`packages/goal/tool-goal/src/index.ts:213`-`215`）：

> "The concrete completion objective inferred from the direct human request."

三个要求合成一句：**具体**（concrete，可判定）、**完成导向**（completion objective，描述终态而不是待办清单）、**从人类请求推断**（inferred，不是模型自己发明）。反例对照：`把文档整理一下` 不是具体完成目标；`校验 _digested 全部 path:line 引用并修复越界` 是。

objective 的**逐字持久**是它区别于 todo 的本质：每轮 prompt 注入的是同一个 JSON 序列化的 objective（`packages/goal/goal-round-driver/src/prompt.ts:17`），256 轮里轮轮相同；编辑要走 `update_goal action: edit`（需直接人类请求 + CAS revision）。

### 每轮模型看到什么：<goal_round> prompt

Round Driver 注入的完整轮指令（`packages/goal/goal-round-driver/src/prompt.ts:14`-`28`）：

> `<goal_round>` Objective: <逐字> / Round: N/maxGoalRounds / "Continue working toward the objective in this same session. **Treat the current workspace, tool results, and durable session state as authoritative; inspect them instead of assuming earlier narration is still current.** Make concrete progress and verify the result. Before claiming completion, gather evidence that the whole objective is achieved, read the current goal, and mark it complete. If work remains, leave the goal active for the next round."

两条驾驶座要点：**「检查工作区而不是相信上一轮的自述」写进了每一轮**（防跨轮幻觉积累）；**完成前必须重读当前 goal**（`read the current goal`——防你在中途 edit 过 objective 后模型按旧目标自报完成）。

### 终结时用户收到什么：wrapup 收尾指令

模型自报 `complete`/`blocked` 后，不是硬停 turn，而是注入收尾上下文（`packages/goal/tool-goal/src/wrapup.ts:21`-`45`，经 `ToolRunContext.deferContext()`）：

- `<goal_complete>`：写给用户的收尾消息必须——说明结果、总结**做了什么、怎么验证的**、指向具体产物（files, commits, or other artifacts）、指出用户接下来该 review 什么、直接称呼用户、**不再调用任何工具**；
- `<goal_blocked>`：必须——说明已完成部分、描述具体阻塞条件与已尝试的办法、**说清需要用户做什么才能继续**；
- 两者共用的 grounding 纪律：**"Report only what earlier rounds and tool results in this session actually establish; when a detail is not in the session, say so instead of inventing it."**

## 预算：两个独立的数字

| 数字 | 默认 | 谁配 | 语义 |
|------|------|------|------|
| `maxGoalRounds` | 256（`packages/goal/goal/src/index.ts:243`-`245`，goal 服务 `defaultMaxGoalRounds`） | `create_goal` 的 `max_goal_rounds` 参数；`update_goal action: edit` 可替换 | **只计 admitted goal rounds**——人类消息与无关 turn 不消耗轮预算（`.agents/notes/implemented/feature/2026-07-16-harness-level-loop.md`） |
| `blockedAfterConsecutiveRounds` | 3（`packages/goal/tool-goal/src/index.ts:38`-`40`，tool 政策） | 部署组合（volatile） | **机械下界**：admitted 轮数不足此值时，模型自报 `blocked` 直接被工具层拒绝（"blocked is rejected before the configured minimum round count"，update_goal 参数描述） |

第二个数字的 JSDoc 原话："Minimum admitted goal rounds before the model may self-report `blocked`"（`:33`-`34`）——它不评估语义相似性，只挡"第一轮就喊卡"的早泄行为。

## 终结判定纪律（政策 guidance 逐字）

`tool:goal` 共享政策节（`packages/goal/tool-goal/src/index.ts:115`-`123`）里的三条硬纪律：

1. **complete**："Mark complete only when the objective is actually achieved."——配合轮 prompt 的 "gather evidence that the whole objective is achieved"；
2. **blocked**："Mark blocked only after the same blocking condition persists for at least N consecutive goal rounds, and report that concrete condition in blocked_reason; **difficulty, uncertainty, or useful remaining work is not blocked**."——难、不确定、还有活干都不算 blocked；`blocked_reason` 参数描述要求 "the concrete condition that persisted across rounds and blocks progress"；
3. **resume**："After session resume or fork, an active goal is disarmed: when a human asks to continue or resume in any wording or language, use update_goal action resume to rearm it."

## 权限与 resume：谁能动哪个 action

`update_goal` 的 `action` 参数描述就是权限表（`packages/goal/tool-goal/src/index.ts:244`-`247`）：

| action | 权限 |
|--------|------|
| `edit` / `pause` / `resume` | 需**直接顶层人类请求**（`requireDirectHuman`，runtime-root 检查——子代理被拒的三道门见 [`03`](./03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md)） |
| `complete` / `blocked` | 人类 turn **或** 本 goal 的自动续轮内皆可（goal-round authority） |

CAS 防写冲突：`goal_id` + `revision` 必须与 `get_goal` 返回的精确匹配。**paused 的 resume 归用户**：`/goal resume`、Web 控制、或直接调 goal 服务；模型工具路径拒绝（user-owned pause，`.agents/notes/implemented/bug-fix/2026-09-03-user-owned-goal-pause-activation.md`）。

**disarmed 是恢复语义的核心**：goal 的 phase（active/paused/blocked/complete）持久在 session log 里，但 activation（armed/disarmed）**从不持久**——会话重开、fork、driver 替换/拆除后一律 disarmed，**重开永远不会自己开始干活**；人类说一声「继续」（任何措辞任何语言），模型在那个 turn 里调 `update_goal action: 'resume'` 重新武装。fork 出的会话继承 goal 前缀但 disarmed——继承不等于执行授权（`.agents/notes/implemented/feature/2026-07-16-harness-level-loop.md`）。

## /goal 命令面

`/goal`（`packages/goal/command-goal/src/index.ts:193`-`194`，描述 "Set or view the goal for a long-running task"）的子命令解析是**整词匹配**：`clear`/`pause`/`resume`/`edit <objective>`，其余一切输入（包括 `cleanup` 这种撞前缀的词）都视为**创建**，空输入 = show（解析细节见 [`../agent-loop/01-goal-lifecycle.md`](../agent-loop/01-goal-lifecycle.md)）。UI 输出刻意不暴露 CAS 内部（`:77`-`78` "Render direct UI output without exposing compare-and-set internals"）；blocked 状态显示 `code: message` 形式的阻塞原因（`:82`）。

## goal round 里能做什么（组合触点）

goal round 是一个 **goal-attributed 的普通 turn**：模型保持完整工具集——读码、subagent、workflow 照常可用（工作原语不受限），goal 工具的 authority 恰好在此时开放 `complete`/`blocked` 两个 action。组合模式全景（goal × workflow × subagent × jobs）见待写的 [`08`]；两个已核验的触点：

- goal round 里起的 workflow/subagent 归属该 agent（parent = caller，见 [`01`](./01-workflow-模型编写的JS编排脚本与子代理扇出机制.md) 归属节）——产物落进同一 session 日志，下一轮的 "inspect workspace" 指令能接着用；
- 子代理自己不能操作 goal（[`03`](./03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md) 的三道门）——goal 的收敛判定永远发生在顶层会话。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/goal/tool-goal/src/index.ts:51`-`54` | `create_goal` description（推断授权语义） |
| `packages/goal/tool-goal/src/index.ts:213`-`215` | objective 参数描述："concrete completion objective inferred from the direct human request" |
| `packages/goal/tool-goal/src/index.ts:115`-`123` | `tool:goal` 政策节：complete/blocked/resume 三条纪律 |
| `packages/goal/tool-goal/src/index.ts:244`-`247` | update_goal action 权限表 |
| `packages/goal/tool-goal/src/index.ts:38`-`40` | `blockedAfterConsecutiveRounds` 默认 3（机械下界） |
| `packages/goal/tool-goal/src/wrapup.ts:21`-`45` | `<goal_complete>`/`<goal_blocked>` 收尾指令与 grounding 纪律 |
| `packages/goal/goal-round-driver/src/prompt.ts:14`-`28` | `<goal_round>` 轮 prompt 全文 |
| `packages/goal/goal/src/index.ts:243`-`245` | `defaultMaxGoalRounds` 256 |
| `packages/goal/command-goal/src/index.ts:193`-`196` | `/goal` 命令注册与整词解析 |
| `.agents/notes/implemented/feature/2026-07-16-harness-level-loop.md` | 两策略决策：round 只计 admitted、disarmed 语义、paused 归用户 |
