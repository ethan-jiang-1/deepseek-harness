# Per-Primitive Usage Sentences from Tool Descriptions · 逐原语边界句

源码核验入口：`packages/workflow/tool-workflow/src/index.ts`、`packages/subagent/tool-subagent/src/index.ts`、`packages/goal/tool-goal/src/index.ts`、`packages/experimental/tool-ralph/src/index.ts`、`packages/todo/tool-todo/src/index.ts`、`packages/jobs/tool-jobs/src/index.ts`、`packages/schedule/tool-schedule/src/index.ts`、`packages/interaction/tool-ask-user/src/index.ts`、`packages/plan/plan-mode/src/index.ts`、`packages/experimental/tool-agent-team/src/index.ts`、`packages/bundle/base/cordis.patch.yml`。

本页回答：每一级原语的**官方边界句**是什么？这些句子住在哪个模型可见面（工具 description 还是 systemPrompt section），逐字怎么写？路由与阶梯见 [`selection/02`](./02-cross-primitive-routing-and-the-official-upgrade-order.md)，官方没说清的部分见 [`selection/03`](./03-unspecified-gaps-and-contradictions-in-usage-policy.md)，机制见 [`primitives/`](../delegation-primitives/00-map.md)。

## 读完你能回答

- 每个原语的边界句逐字是什么、住在哪个模型可见面？
- 哪些原语的边界句带「仅人类显式要求」？
- 读工具 description 与读包 README，哪一种才是模型看到的？

## 心智模型

核心判断：**边界句就是策略，而且它只住在模型看得见的那一面。**

- 模型看见的是工具 schema 与注册在它作用域里的 prompt 段；包 README 是部署者视角的转述，不进上下文。
- 边界句是提示，不是闸：没有组件会因为你违反一句话而拒绝调用。
- 所以「模型为什么选了不该选的」通常要回到它当时看见了什么。

## 语义住在哪：两个通道 + 一个约定

官方选择语义编码在两类**模型可见文本**里：

| 通道 | 注册处 | 例子 |
|------|--------|------|
| 工具 description / 参数 description | `ctx.tools.register`（各 tool-* 包） | `create_goal` 的 "Use it when the direct human request is a long-running objective" |
| 工具自带的 systemPrompt section | `ctx.systemPrompt.section`（各 tool-* 包） | `tool:workflow` 节的 "ONLY when the user explicitly asks" |

约定（master convention）写在工作流工具的源码注释里：

> "Usage policy ships with the tool (the master convention: tool guidance lives in tool plugins as prompt sections, not in the deployment persona)."

—— `packages/workflow/tool-workflow/src/index.ts:324`-`326`

即：**使用策略随工具插件走，不放进部署 persona**。换掉工具插件，它的策略文本一起走；同包双实例（如 `subagent` 与 `subagent_fork`）各自携带自己的 wording。包 README 的 "Use this package" / "When to choose it" 节是同一语义的部署者视角转述，可作旁证但不进模型上下文。

## 逐原语边界句

### todo_write（最轻：上下文内计划留痕）

> "Record and update a task list to plan multi-step work and show progress; **skip it for trivial single-step tasks**. Add one todo per concrete step before you start."

—— `packages/todo/tool-todo/src/index.ts:46`-`48`

可写接口：`{"todos": [{"content": "修 ref-sweep 越界", "status": "in_progress"}, {"content": "复跑校验", "status": "pending"}]}`——`todos` 是**全量替换**（"The COMPLETE task list, replacing any previous list"，`:142`），status 枚举 `pending/in_progress/completed`。

plan 模式内与 `exit_plan_mode` 互斥（base bundle 的 plan-mode 部署 guidance）：

> "Do not use todo_write to track this planning phase: it tracks implementation after an approved plan, while the plan itself belongs in exit_plan_mode."

—— `packages/bundle/base/cordis.patch.yml:340`

### subagent / subagent_fork（有界委派）

同一插件 `@deepseek-ai/dsh-tool-subagent` 按 provider 生成两套 wording（`providerWording(inheritsParentContext)`，`packages/subagent/tool-subagent/src/index.ts:113`-`137`）。

`subagent`（spawn，fresh）：

> "Delegate a self-contained task to a subagent (a separate agent that works in its own context) to offload focused, independent work — research, a scoped implementation, an analysis — so it does not consume this conversation's context. The subagent returns its result, not its intermediate steps."

—— `packages/subagent/tool-subagent/src/index.ts:130`-`133`；prompt 参数："The complete, self-contained task for the subagent. It does not share this conversation's context, so include everything it needs."（`:135`-`136`）

`subagent_fork`（fork，继承已完成轮次）：

> "Delegate a task to a subagent that inherits this conversation: a child agent seeded with all completed turns so far (it does not see the current in-flight turn). **Use this when the subtask builds on this conversation's context — a follow-up analysis, a review, a continuation — without consuming this conversation's context for the work itself.** You receive its result, not its intermediate steps."

—— `packages/subagent/tool-subagent/src/index.ts:117`-`121`；prompt 参数（`packages/subagent/tool-subagent/src/index.ts:123-124`）："It already sees this conversation's completed turns, so build on them freely and state only what is new."

`backgroundMode` 配置已不存在。现行语义由 `packages/subagent/subagent` 的统一 activation API 承担：**每次委派都变成一次 managed activation，立即返回 child id；continuable 由 per-delegation-tool 选择**（base 注释在 `packages/bundle/base/cordis.patch.yml:373`-`374`：「Continuable background children are selected per delegation tool. The separately loaded follow-up tool registers the one global `send_message`.」）。base 组合只是 `subagent`（provider spawn）与 `subagent_fork`（provider fork）两行（`:380`-`384`、`:391`-`396`），本地 child 接受后续消息、进程外后端自动报告其单次执行（`docs/tool-catalog.md:41`）。README 的选择句："Choose it when the child needs the conversation's completed turns — a follow-up analysis, a review, a continuation. Choose spawn when the child should start clean, or an out-of-process backend when ..."（`packages/subagent/subagent-fork-in-process/README.md:33`）。

### workflow（规模扇出，需用户显式要求）

工具 description：

> "Run a JavaScript workflow script that orchestrates subagents at scale. **Use this for work that fans out across many independent pieces — an audit over many files, a migration, multi-angle research, adversarial verification of findings — where you write the orchestration as a script instead of delegating turn by turn.**"

—— `packages/workflow/tool-workflow/src/index.ts:158`

prompt section（`tool:workflow`）：

> "Use the ${toolName} tool **ONLY when the user explicitly asks for a workflow or for large multi-agent orchestration**: you write a JavaScript script … that fans work out across many subagents with phases and structured results. **For one or two delegations, prefer plain subagent calls.**"

—— `packages/workflow/tool-workflow/src/index.ts:329`-`333`

### ralph（fresh-agent 循环，需人类显式要求，默认关闭）

> "Run a foreground fresh-agent Ralph loop toward one immutable objective. **Use only when the direct human explicitly asks for Ralph or fresh-agent iteration.** Each round opens a new child with no parent conversation or prior child session; the shared workspace is long-term memory, and only a bounded structured report crosses rounds. The call returns when a worker reports completion or a concrete blocker, or at the round limit. **Ordinary long-running same-session work belongs to goal tools.**"

—— `packages/experimental/tool-ralph/src/index.ts:177`-`182`

prompt section 补充路由："Use same-session goal tools for ordinary long-running objectives, and plain subagents or workflows for bounded delegation and fan-out."（`:405`-`409`）。ralph 不在 base bundle：由 optional bundle `packages/experimental/ralph-bundle/cordis.patch.yml:12`-`16` 提供（`maxRounds: 64`），是 `OPTIONAL_BUNDLES` 成员之一（`packages/boot/app-boot/src/profile.ts:223`-`236`），默认不装；README 自述理由："Completion is worker self-declaration — there is no independent evaluator or verifier deciding whether the objective is complete"（`packages/experimental/tool-ralph/README.md:161`）。

### goal（跨轮次长目标的默认档）

> "Create a persisted goal that keeps this session working across automatic continuation rounds. **Use it when the direct human request is a long-running objective, even if the user did not say "goal"; not for single-turn work.**"

—— `packages/goal/tool-goal/src/index.ts:52`-`54`

共享 guidance 节（`tool:goal`）给出推断、续臂与 blocked 阈值语义："create_goal may infer goal intent from a direct human request in any language. After session resume or fork, an active goal is disarmed: when a human asks to continue or resume in any wording or language, use update_goal action resume to rearm it. Mark complete only when the objective is actually achieved. Mark blocked only after the same blocking condition persists for at least ${blockedAfter} consecutive goal rounds…"（`:116`-`:123`）。`update_goal` 的 action 参数描述区分权限：edit/pause/resume 需直接人类请求，complete/blocked 也允许在 goal 自动续轮中发生（`:244`-`245`）。goal 状态机与 Round Driver 深挖见 [`../agent-loop/01-goal-lifecycle.md`](../../agent-loop/01-goal-lifecycle.md)。

### jobs（后台平面：跟踪与收尾纪律）

四个工具的 description 只定义操作（`job_output`/`job_list`/`job_kill`，`packages/jobs/tool-jobs/src/index.ts:312`、`:353`、`:373`）；选择语义在 prompt section（`tool:jobs`）：

> "Track every background job id you start. You are notified in-session when a job finishes — **do not busy-poll or sleep on one; keep working on independent steps and do not duplicate a running job's work.** Before giving a final answer, collect every still-relevant job with job_output (**set wait: true only when you are genuinely blocked on it**), and job_kill jobs that stopped mattering."

—— `packages/jobs/tool-jobs/src/index.ts:254`

### schedule（时间平面：wall-clock 提醒）

`schedule_create` 的 description 定义时序语义（"Supply exactly one timing parameter: after_seconds, at, every_seconds, daily, weekly, or cron. …"，`packages/schedule/tool-schedule/src/index.ts:185`）。组 README 给出形态边界："Due reminders arrive as ordinary follow-up messages in the original conversation, **not email, SMS, or push notifications**."（`packages/schedule/README.md:12`）。schedule **直接进 Web 组合**（`packages/bundle/web-app/cordis.patch.yml:139`-`140` 的服务行与 `:398`-`399` 的 UI 行），不在 optional bundle 清单里；工具包是 `packages/schedule/tool-schedule`。

### ask_user_question（人机路由）

> "Ask the user a concise question **when you need confirmation, a choice, or missing information before proceeding**."

—— `packages/interaction/tool-ask-user/src/index.ts:31`

可写接口：`{"questions": [{"id": "scope", "question": "先修哪个范围？", "header": "选择", "options": [{"label": "本专题 (Recommended)", "description": "……"}]}]}`——推荐项放第一并加 "(Recommended)"（`:56`-`58`）；`id` 在回答里回显（`:50`）。

部署侧路由（base bundle plan-mode guidance）："Use ask_user_question only for user-owned choices or material ambiguity that inspection cannot answer. Do not ask the user where code lives or how current behavior works when you can find out."（`packages/bundle/base/cordis.patch.yml:342`）。README："A timeout is never approval."（`packages/interaction/tool-ask-user/README.md:44`）。

### plan mode / exit_plan_mode（审批门）

> "**Use only in plan mode.** Present your plan for the user's review and, on approval, leave plan mode. The user may approve (carry out the plan from your next step) or keep planning — their feedback comes back in the tool result; revise and present again."

—— `packages/plan/plan-mode/src/index.ts:84`-`86`

可写接口：`{"plan": "# 修复计划\n## 步骤\n1. …"}`——`plan` 必须是 `#` 标题开头的 markdown（`:281`），且按部署 guidance 必须是该回复**唯一且最后**的工具调用（`packages/bundle/base/cordis.patch.yml:346`）。

README 的选择句："Choose plan mode when the agent should explore and design before executing and you want to approve the plan first. **It does not restrict the agent: every tool stays callable, so use sandbox mode and approval prompts when you need enforced limits. Skip it when the agent should act on your requests immediately, without a planning phase.**"（`packages/plan/plan-mode/README.md:30`-`32`）。

### agent-teams（显式 opt-in 顶配，experimental）

共享策略节（`team:policy`）：

> "Agent Teams is available in this session. … The Lead must wait for required teammates before giving the final answer."

—— `packages/experimental/tool-agent-team/src/index.ts:35`-`41`

组合层的互斥替代："The `subagent` and `subagent_fork` tools and overlapping global child controls are disabled. Workflow retains the base profile's `spawn` provider."（`packages/experimental/agent-team-profile/README.md:49`）。机制深挖见 [`../experimental/02-agent-teams.md`](../../experimental/02-agent-teams.md)。

## 常见误解

| 你以为 | 实际上 |
|---|---|
| 工具描述只是给人看的文档 | 它就是模型看到的选择策略 |
| 包 README 与工具描述是同一份内容 | README 是部署者转述，不进模型上下文 |
| 边界句会被机械执行 | 靠模型遵守，没有执行器 |

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/todo/tool-todo/src/index.ts:46`-`58` | todo_write 边界句与并行/单活动两种 wording |
| `packages/subagent/tool-subagent/src/index.ts:113`-`137` | fresh/fork 双分支 description 生成 |
| `packages/subagent/tool-subagent/src/index.ts:370`-`380` | delegation 并发提示 prompt section |
| `packages/workflow/tool-workflow/src/index.ts:158`、`:324`-`333` | workflow description、master convention 注释、`tool:workflow` 节 |
| `packages/experimental/tool-ralph/src/index.ts:177`-`182`、`:405`-`409` | ralph 边界句与三分路由节 |
| `packages/goal/tool-goal/src/index.ts:52`-`54`、`:116`-`:123`、`:240`-`:245` | goal 推断语义、guidance 节、update 权限 |
| `packages/jobs/tool-jobs/src/index.ts:254`、`:312`-`373` | jobs 跟踪纪律节与三工具描述 |
| `packages/schedule/tool-schedule/src/index.ts:185`-`199` | schedule 工具时序语义 |
| `packages/interaction/tool-ask-user/src/index.ts:31` | ask_user_question 边界句 |
| `packages/plan/plan-mode/src/index.ts:84`-`86` | exit_plan_mode 边界句 |
| `packages/experimental/tool-agent-team/src/index.ts:35`-`41` | `team:policy` 显式 opt-in 节 |
| `packages/bundle/base/cordis.patch.yml:332`-`346`、`:380`-`396`；`packages/experimental/ralph-bundle/cordis.patch.yml:1`-`16` | plan-mode guidance、subagent/fork 组合、ralph 可选 bundle |
| `docs/tool-catalog.md` | 生成目录交叉核验（subagent 行 `:41`；其余工具行按标题 grep 定位，目录整体重排过） |
