# 01 · "快就是好"：V4 Flash + Max + goal/plan/workflow 的机制链

## 第一节 先把"快"拆成四层

"快就是好"在 DSH 里不是一句模型夸奖，是四层机制叠出来的总延迟体验。逐层给证据：

| 层 | 机制 | 证据 |
|---|---|---|
| 模型层 | Flash 路由 + `reasoningEffort: max` | `llm-deepseek` 省略 `models` 时默认公布两条目——`deepseek-flash`（name DeepSeek-V41-Flash，text+image，且声明 `systemPromptUpdate: 'in-history'` 与 `toolUpdate: 'addition-only'`）与 `deepseek-v4-pro`（text-only），各 1,000,000 token 上下文（`packages/llm/llm-deepseek/src/models.ts:6-21` 的 `DEFAULT_CONTEXT_WINDOW`，即 `src/defaults.ts:6` 的 1,000,000；`README.md:52`）；档位集 `off\|low\|high\|max`，省略回退 `high`（`README.md:44`、`:58`），`low/high/max` 都启用思考、以官方顶层 `reasoning_effort` 序列化（`README.md:102`）（0009 按 `dsh-v0.2.0-rc.2` 实测重写：旧四条目中的 `deepseek-v4-flash-vision-exp` 与 `deepseek-v4-flash` 已不在默认 catalog） |
| 驱动层 | goal 续轮：一个目标跨 turn 自主推进 | `create_goal/get_goal/update_goal` 三工具 + `goal-round-driver`；层级 **Goal → Round → Turn → Step**，一轮 = 一条 `source.kind==='goal'` 的 `user/message` 开的普通 turn（`.agents/notes/archived/feature/2026-07-19-same-session-goal-round-driver.md:18`） |
| 评审层 | plan 模式：执行前的人类审批姿态 | 唯一持久事实是会话事件 `plan/mode {active}`（`packages/plan/plan-mode/src/index.ts:46-55`）；`exit_plan_mode` 经 `ctx.userQuestions.ask` 提交 `Approve / Keep planning` 评审（`plan-mode/src/index.ts:296-341`） |
| 编排层 | `workflow` 工具：一个 JS 脚本 fan-out 多个子代理 | `ctx.workflowEngine`（worker-thread Provider）+ `tool-workflow` Consumer；脚本 hooks：`agent()/pipeline()/parallel()/phase()/log()`（`packages/workflow/workflow/README.md`） |

关键在**层间关系：四层互相不知道彼此存在**。goal 续轮驱动器只挂在公共扩展点上（`agent/status idle`、`agent/pre-step` waterfall、`session/event`、`goal/changed`），与 `agent-loop` 零耦合——round-driver 设计笔记记录了被否掉的备选方案 *"Add a goal loop inside dsh-agent-loop — rejected"*（归档 note :79），这是 AGENTS.md *"Plugins, not loop changes"* 约定的正面案例。plan 模式同理："plan 只是协作姿态，不读不写 sandbox/approval"（`packages/plan/plan-mode` 模块 doc :5-7）。所以"开箱已有 goal、plan"这句话在机制上是严谨的：它们都在 `dsh-base` 第一层 bundle 里（`packages/bundle/base/cordis.patch.yml:292-414` 的 `goal`、`goal-round-driver`、`plan-mode`、`tool-workflow`、`tool-todo`、`tool-goal` 行），但它们不是内核分支，是六行默认组合配置。**换掉它们 = patch 一行**，这正是 [`capability-seams/00-map`](../../_digested/capability-seams/00-map.md) 说的"可替换"的另一种含义。

## 第二节 "思考开在 Max"的机制，与它 hidden 的 token 账

`reasoningEffort: max` 是适配器拥有的不透明档位字符串，不是核心枚举：`resolveCallConfig()` 只接受该确切模型公布过的档位，不支持的值在**网络 I/O 之前**以 `UNSUPPORTED_REASONING_EFFORT` 失败，绝不静默钳制（`packages/llm/llm-deepseek/README.md:102`；核心侧校验发生在 `ctx.llm.prepareCall()`，`packages/core/agent-loop/README.md:93`）。生效值随 `request/header` 落日志，`agent/request` waterfall 可以每一步替换它（`packages/core/agent-loop/README.md:51`、`:93`）——所以"Max"可以是会话默认，也可以是重构关键步骤才升档的逐请求决策。

但 max 档有一笔多数人不会注意的账：**reasoning 回传规则**——

> 每个携带推理内容的 assistant 轮次都会把 reasoning 原文序列化回历史："Reasoning passback carries every reasoned turn's chain of thought into later requests"（`packages/llm/llm-deepseek/README.md:176`）。

对一个"重构三小时、几百个工具调用轮次"的会话，这意味着**每一步的思考原文都进入后续所有请求的前缀**。缓和组织了这件事：未变的装配前缀可命中 DeepSeek cache 回报（`README.md:178-180`），但路由一换、前缀一变即从第一个变更 token 起全失效。这就是"10 亿 token"的微观结构：**不是哪里漏了，是 max 档的思考税 × 长会话回传 × 前缀敏感缓存的乘积。**"快就是好"在 token 经济学上的完整表述应该是：Flash 的单价优势要乘上 cache 命中率才成立；长会话中途换模型/改 effort/动图预算，都是对缓存的一次性清零。

## 第三节 goal 轮次的授权结构：为什么"敢放手"

`<goal_round>` 每轮注入给模型的提示词是固定的（`packages/goal/goal-round-driver/src/prompt.ts:12-26`），要点：以当前 workspace、工具结果与持久会话状态为权威，"inspect them instead of assuming earlier narration is still current"；完成前必须收集客观已达成的证据并读当前 goal 再 `complete`。配套的授权设计：

- **自动续轮预算**：`maxGoalRounds` 正 safe integer，部署默认 **256**（`packages/goal/goal/src/index.ts:244`）；轮次记账只认 goal 来源消息，**人的插话与澄清永不消耗预算**（`fold.ts:326-331` 校验 `source.kind==='goal'` 且 round 连续）。
- **blocked 下限**：同因阻塞不足 3 个连续轮次时，机械拒绝 `blocked`（`GOAL_TOOL_BLOCK_THRESHOLD`），语义判断留给模型——"difficulty, uncertainty, or useful remaining work is not blocked"（`tool:goal` section，order 2400，`packages/core/system-prompt/src/index.ts:141`；文案在 `tool-goal/src/index.ts:120-121`）。
- **自动性永远锚在人类权威上**：重启/fork 后持久 phase 还原但 activation 一律 disarm（`agent/session-start` 边沿统一 disarm，`goal/src/index.ts:255-256`），人类一句"继续" → 模型 `update_goal resume` 重新武装。设计笔记把这拆成两个不同事实：*"durable lifecycle 与'继续的许可（activation）'是两个不同事实"*（`2026-07-19-persisted-same-session-goal-domain.md:17`）。

这套结构回答了"为什么 3 小时敢不看屏幕"：不是信任模型，是**预算有上限、完成有证据门、阻塞有 3 轮下限、恢复必须过人手**。DSH 把"自主"做成了一个带闸门的系统属性，而不是一段激励性的提示词。（本节是概要；goal 机制的源码级全展开——状态机、驱动循环、失败结算表、授权矩阵——见主篇 [04](./04-goal-plan-small-model.md)。）

## 第四节 "dynamic workflow"这个造词的机制解读

官方词汇表里没有 "dynamic workflow"。这个词唯一能严格对上的机制组合是：

1. **plan 批准**：`exit_plan_mode` 通过评审后落 silent pending，下一次请求装配前 `plan/mode {active:false}` 提交，工具结果固定 `"Plan approved — plan mode exited; carry out the plan starting with your next step."`（`plan-mode/src/index.ts:292`、`:352`）。
2. **模型把 plan 翻译成一次性脚本**：`workflow` 工具的 seam 契约明写 *"the seam starts caller-supplied scripts only"*、Known Limitations 第一条 *"No saved or nested workflows"*（`packages/workflow/workflow/README.md`）。没有模板存储、没有固定管道——**每个任务的编排脚本都是当场生成、跑完即弃**。"dynamic" 描述的就是这个：`meta.phases` 抄 plan 的阶段，各 `agent()` 的 prompt 写该阶段的验收标准，`args` 传 plan 产物的路径。
3. **进度可观察**：`tool-workflow/run-start / agent-start / agent-end / run-end` 四个会话事件让 `ui-workflow-run` 面板从纯日志重建出可折叠披露视图（`packages/client/ui-workflow-run/README.md`）——又一次"事件即 UI 事实"。

这个设计的深意在分工：**动态性留给模型（每次任务的编排确实应该不同），固定策略留给插件**。官方自证是 `dsh-tool-ralph`：*"The tool is an ordinary plugin over `ctx.workflowEngine` and `ctx.subagents` — no Ralph mode or fresh-agent loop is added to `agent-loop`"*（`packages/workflow/tool-ralph/README.md:61`）——如果你发现某类 workflow 你每次都让模型重写一遍，正确动作不是存模板（没有这个机制），是仿 ralph 写一个内嵌固定脚本、参数做成 validated `Config` 的消费者插件（见 [02](./02-self-built-previews.md#第五节-workflow-模板的正确载体)）。

## 第五节 3 小时的下限与上限

**下限（harness 保证的部分）**：一个可并行重构在 DSH 上不空转的结构性原因——

- goal 轮次在 agent idle 时自动续（就绪条件：fiber ACTIVE、agent 精确 live 且 idle、无竞争排队；先 `ctx.sessions.flush` checkpoint 再 followup，`goal-round-driver/src/index.ts:138-205`）；
- `workflow` 的 `parallel()/pipeline()` 让独立子任务无 barrier 并行，`pipeline()` 明确"stages 之间没有全局栅栏"；
- 单 turn 内工具池 `maxParallelToolCalls` 控制无依赖工具调用并行；
- 后台 subagent（`subagent`/`subagent_fork`）不占 captain 上下文，完成时通知回流；
- 一切状态在日志里：进程崩了 checkpoint 恢复，续轮继续。

**上限（harness 不保证的部分）**：模型对 plan 的翻译质量、workflow 脚本里验收标准写得是否可判、以及第二节那笔 token 账会不会先烧穿预算。

对"在 codex 简直是做梦"：本篇不下裁判（见 [answer.md 诚实边界](./answer.md)），但给出一个可操作的观察角度——**上面"下限"清单里的每一项，都要问竞品"它持久吗、可审计吗、授权锚在哪"**。goal/plan/workflow 在 DSH 里全是 `SessionEventMap` 成员 + 授权矩阵 + fail-loud 重放校验（`goal` 域甚至有 companion invariant 对候选事件跑严格 fold，`packages/goal/goal/src/invariant.ts`）；一个只有提示词没有日志地位的"自动续跑"，就是没有闸门的版本。差距若存在，更可能在这层而不是模型层。
