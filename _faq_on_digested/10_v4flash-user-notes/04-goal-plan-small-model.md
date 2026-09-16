# 04 · 主篇：goal 与 plan 的完整机制，以及为什么快而小的模型在这里反而优秀

## 第一节 那句体感的结构：三个短语，三层机制

> "开箱已有 goal、plan"，但它们**不是内核分支**——goal 续轮驱动器与 `agent-loop` 零耦合，设计笔记里 *"Add a goal loop inside dsh-agent-loop — rejected"* 是正面记录。

这句话里的每个词都对应一个可展开的机制层：**"开箱"** 是组合层决定（`dsh-base` 第一层 bundle 的六个插件行，`packages/bundle/base/cordis.patch.yml:292-414`）；**"goal、plan"** 是两个互不相识的日志化状态机；**"不是内核分支"** 是扩展点纪律（AGENTS.md *"Plugins, not loop changes"*）；**"rejected 备选"** 是决策记录制度（note :78 记录了否掉的理由）。本篇把前两者展开到源码级，然后回答真正的解释目标：**为什么这套东西配上一个快而小的模型，反而构成优秀的开发体验**——这是三条体感最直接的根（但不是唯一的根：反例检验与另外两条根见 [05](./05-other-roots.md)），其余（预览清单、模型 catalog、预算表）都是这个根上的投影。

## 第二节 goal 的完整机制：从一条人类消息到自动续轮的闭环

**唯一持久事实是一个快照事件。** goal 域没有私有数据库、没有进程内权威状态：一切持久事实都是会话事件 `goal/change`——要么整快照（whole-value：`{id, revision, objective, phase, maxGoalRounds, blockedReason?}`，id 是 branded `GoalId`），要么 clear 墓碑，`version: 1`（`packages/goal/goal/src/domain.ts:23-44`）。设计笔记一句话定了调：*"Activation remains process-local……The session log remains the only durable authority"*（`.agents/notes/implemented/architecture/2026-07-31-goal-owned-durable-events.md:19`）。提交路径先 append 事件再发 live 事件 `goal/changed`，中间有 CAS（stale revision → `GOAL_STALE_REVISION`）与"精确 live Agent"校验（`packages/goal/goal/src/index.ts:553-625` 的 `commitCurrent` → `goal/changed`；`:462-470` 的 CAS 与 live Agent 校验）。重放是严格 fold：逐事件校验 JSON 形状、id 新鲜性、revision 连续、阶段迁移、计数器、时间戳单调，畸形记录 fail-loud 而不是跳过（`fold.ts:271-349, :134-172`）——**坏一行日志，宁可拒绝重建整条会话**。

**状态机与授权矩阵是双重强制的。** 持久 phase 四态：`active | paused | blocked | complete`；过程本地的 activation 两态：`armed | disarmed`（"never persisted"）。迁移规则同时写在运行时服务（`index.ts:298-390`）与重放 fold（`fold.ts:200-253`）里，两处必须一致：pause 仅 active→paused；resume 接受 paused/blocked 但要求剩余轮次预算、armed 状态重复 resume 直接拒绝；complete 任意非 complete→complete；create 只在无当前未完成 goal 时新建 revision-1。授权按动作分流：`create_goal` 只认直接人类顶层轮次（模型可以推断意图，但非人类与 subagent 在执行期被拒）；`edit/pause/resume` 只认人类；`complete/blocked` 双授权——直接人类，**或"当前 goal 的精确本轮"**（goalId+revision+round 三元组精确匹配，`packages/goal/tool-goal/src/authority.ts:86-92`）。9 个稳定错误码覆盖每种非法路径（`domain.ts:93-100`）。

**续轮驱动器是一个挂在扩展点上的循环，不是 loop 里的分支。** 层级 Goal → Round → Turn → Step：一轮 = 一条 `source.kind==='goal'` 的 `user/message` 开启的普通 turn（note `2026-07-19-same-session-goal-round-driver.md:18`）。`drive()` 每次执行的完整序列（`goal-round-driver/src/index.ts:138-205`）：① 就绪检查（fiber ACTIVE、agent 精确 live 且 idle、无竞争排队）；② **先 `ctx.sessions.flush` 落持久 checkpoint**；③ 轮次耗尽 → block `'round-limit'`；④ 预留 `{goalId, revision, round: roundsStarted+1}` 后 `agent.followup(message)`，失败 → block `'queue-failed'`；⑤ 准入门是 `agent/pre-step` waterfall：`validReservation()` 在 `next()` 前后**各查一次**（防下游 listener 改了 goal 后旧 prompt 仍进入），无效则收回已 claim 的输入并 reject，下游策略拒绝 → block `'prompt-rejected'`。失败结算表是封闭的：取消 → pause、max-tokens → disarm、error → disarm、checkpoint 外的全部异常 → block，原则是 *"No abnormal outcome requests an automatic retry"*（note :39-50）。

**每轮的模型可见输入是固定的，且这个固定被不变量锁死。** 每轮注入的 `<goal_round>` 框原文（`goal-round-driver/src/prompt.ts:12-26`）：

> `<goal_round>`
> Objective: ${JSON.stringify(goal.objective)}
> Round: ${round}/${goal.maxGoalRounds}
>
> Continue working toward the objective in this same session. Treat the current workspace, tool results, and durable session state as authoritative; inspect them instead of assuming earlier narration is still current. Make concrete progress and verify the result. Before claiming completion, gather evidence that the whole objective is achieved, read the current goal, and mark it complete. If work remains, leave the goal active for the next round. Follow the configured goal-tool policy before reporting a blocker.
> `</goal_round>`

配一条重放不变量：重放时每条 goal 轮消息的 content 必须与 `renderGoalRoundPrompt(folded 前缀)` **深相等**（`goal-round-driver/src/invariant.ts:33-46`）——轮与轮之间，模型连开场白的自由都没有。注意这段提示词的认识论立场：**模型三小时前自己说的话，对它的后续步骤没有权威地位**；权威只属于 workspace、工具结果与持久会话状态。这是对"模型自述叙述"的制度性不信任。

**blocked 与 wrap-up 把"放弃"和"结束"都做成了结构化事件。** `blocked` 有机械下限：同因不足 3 个连续轮次直接拒绝（`GOAL_TOOL_BLOCK_THRESHOLD`），语义判断留给模型——工具描述原文明说 "difficulty, uncertainty, or useful remaining work is not blocked"；blocked_reason 必填，持久化为稳定 code `'model-reported'`。goal 轮内的 complete/blocked 成功后，`exec.deferContext` 注入 `<goal_complete>`/`<goal_blocked>` 用户消息，turn 以普通"无工具调用"方式收尾——不是硬停（note `2026-08-02-goal-round-wrapup-message.md`）。

**自主权永远死于重启，靠人复活。** `agent/session-start` 边沿一律 disarm，驱动器加载时对既有 agent 全部 disarm：重启/fork 后持久 phase 原样还原，但绝不会自动开工；人类一句"继续" → 模型 `update_goal resume` 重新武装。设计笔记把这拆成两个不同事实：*"durable lifecycle 与'继续的许可（activation）'是两个不同事实"*（note `2026-07-19-persisted-same-session-goal-domain.md:17`）。预算侧同样只对人开修改口：`maxGoalRounds` 默认 256，只有 `edit` 能改；轮次记账只认 goal 来源消息——**人的插话与澄清永不消耗预算**（`fold.ts:321-332` 校验 round 连续且来源匹配）。

## 第三节 plan 的完整机制：一次批准的"协作姿态"

**plan 的持久事实只有一个布尔。** 会话事件 `plan/mode {active}`，log-only、非 surface、whole-value replace：最后一条赢，无记录折叠为 inactive（`packages/plan/plan-mode/src/index.ts:46-55`）。服务维护三个量：fold 出的 logged active；`pendingIntents`（WeakMap——开放 turn 中的选择保持 pending，直到下一个被接受的 in-turn pre-step 在 `next()` 之后追加提交，追加失败保持 pending 重试）；投影单元 `plan {active, wanted, running}`（fold `/plan` 命令的 `command/run`+`command/done` 对，`plan/mode` 提交时清 wanted），wire 视图 `{active, pending}` 是**纯回放量**——host 重启、别的标签页、冷读，都从日志单独恢复。`set()` 返回四态 `committed / queued / cancelled / noop`：无开放 turn 立即 append 并注入叙事，有开放 turn 则排队；叙事只在"最后一条 `request/header` 记录的模式与目标相反"时注入一句 plugin 来源 notice——最小注入（`index.ts:114-163, :181, :189-200, :412-431, :449-461`）。

**`exit_plan_mode` 是一次真实的人类评审，不是模型自说自话。** 工具常驻注册（模式无关，理由见下节 cache 那段）；执行要求 plan 以 `#` 标题开头；然后经 `ctx.userQuestions.ask` 提交 question id `'plan-review'` 的评审——选项 `Approve` / `Keep planning` 加自由文本；评审通道缺失 fail-closed；用户取消 → "stay in plan mode, stop here"。批准走 **silent pending** `{active:false, narrate:false}`：本工具批内 plan 指导仍然生效，下一次请求装配前由 pre-step 落 `plan/mode {active:false}`；工具结果文本固定 `"Plan approved — plan mode exited; carry out the plan starting with your next step."`；未批准 → 工具抛错，评审反馈原样带回给模型（`index.ts:356-399, :407-416`）。

**plan 的规则是提示词层的，且这条设计是明说的。** 出厂 `plan:policy` section（order 500，`packages/bundle/base/cordis.patch.yml:305-315`）的关键句：

> The tool catalog stays the same across modes for request-cache stability. These plan-mode rules override any later tool description or guidance that suggests using mutation tools; those tools remain listed only to keep the request shape stable.
>
> Make exit_plan_mode the only and final tool call in that assistant response … Do not use todo_write to track this planning phase: it tracks implementation after an approved plan, while the plan itself belongs in exit_plan_mode.

**plan 刻意什么都不管。** 它不读不写 sandbox/approval（模块 doc :4-7；note `2026-07-22-plan-specific-collaboration-state.md:23`）：mutation 工具仍然在目录里、仍然受既有审批管线约束——plan 模式的"保证"是可审计的姿态加现成闸门，不是新造的权限系统。它和 todo 的分界写在提示词里：规划期禁用 `todo_write`，因为 todo 记录的是批准后的实现步骤，而 plan 本身属于 `exit_plan_mode`。成本上只有被 steer 的消息计历史 token，bare `/plan` 与 `/plan off` 计零。

## 第四节 为什么快而小的模型在这里反而优秀

**总论点：goal/plan 的细节展开到头，是同一个设计决定被反复执行——凡是能从模型手里拿走的职责，都被拿走了。** 剩给模型的职责只有一件：把眼前这一步做好。"优秀开发体验"依赖的那些能力——记忆、可靠、诚实、安全、集成——在 DSH 里根本不再由模型参数量供给：

| 开发体验需要的能力 | 谁在供给 | 机制 |
|---|---|---|
| 记住三小时前的上下文 | 日志 | 每轮从 `deriveMessages()` 重投影模型历史；`<goal_round>` 明令 inspect 而非信任自己的叙述；compaction 管压力 |
| 诚实地自报完成/阻塞 | 结构 | complete 前必须收集证据并重读当前 goal；blocked 有 3 轮机械下限；wrap-up 强制收尾轮 |
| 跨越时间保持可靠 | 驱动器 | 每轮先 flush checkpoint；error/max-tokens/取消分别 disarm/pause；重放 fold 与轮次 prompt 深相等不变量 fail-loud |
| 保证预算与安全 | 授权 | 轮次记账只认 goal 来源消息；activation 与 lifecycle 分离；重启后一律 disarm，等人类复活 |
| 把 plan/goal/workflow 集成成流程 | 模型自己——但只在"当下这一步" | 三个原语互不相识，集成发生在每一步的即时决策里；这就是 "dynamic workflow" 是**用法**而不是**功能**的原因（[01 第四节](./01-fast-is-good.md#第四节-dynamic-workflow这个造词的机制解读)） |

**max 档思考与日志制度是一对互补，各管一半。** `reasoningEffort: max` 补的是**步内**：一步之内的规划、代码推理、验收标准撰写——这恰恰是小模型在单步内最需要加强的部分。日志与状态机补的是**步间**：跨步的记忆、可靠与诚实——这恰恰是**任何**模型都不该被信任的部分。大模型用参数量买到的跨步连贯性，在这里被"每轮重读日志"制度性地替代了：既然每一轮都从权威状态出发，模型就没有跨步一致性需要维持，小模型最弱的那一项被制度绕开，而它最强的那一项（低成本高吞吐的单步执行）被制度放大。

**经济账也站在"多步小模型"这边，而且 harness 是明着为它调音的。** 三小时重构 = 数百步：wall clock ≈ Σ(步延迟)，Flash 的步延迟优势被步数放大；成本侧，reasoning 回传让每个有思考的轮次把思考原文带进后续前缀（`packages/llm/llm-deepseek/README.md:163`），**廉价单价是这笔税可承受的前提**；而 prefix cache 只在"多步共享前缀"的机制下才有价值——注意 plan 模式那句 "tool catalog stays the same across modes **for request-cache stability**"：模式切换宁可走提示词规则覆盖也不改工具 schema，为的就是不打破快模型赖以省钱的前缀缓存；`effort` 可被 `agent/request` waterfall 逐请求替换，生效值落 `request/header`——**思考深度成了可以按步购买、且被审计的变量**，重活升 max、轻活降档，这是大模型路由给不了的细粒度。

**"开箱"本身是体验的一部分，不是包装。** 如果 goal/plan 是可选插件，"敢放手"之前要先经过发现→评估→安装→组合四道摩擦，而每道摩擦都在劝退"让它自己跑三小时"这个决定本身。在 `dsh-base` 里它们是默认姿态：**会话出生时，预算、证据门、结算表、授权锚就已装好**。组合层决定"一个 DSH 会话是什么"——这一层才是"体验"与"功能"的分界线：功能是装上才有的能力，体验是出生就带着的默认。

## 第五节 诚实边界：harness 不能替模型做什么

1. **complete 仍是模型的主张。** harness 结构化这个主张（证据门、重读当前 goal 的要求、wrap-up 收尾），但不验证 objective 客观达成——fold 能拒绝非法迁移，不能拒绝一个"证据挑得好的谎言"。真正的人类后盾是 `/goal`（不花模型 turn 暂停/清目标/重武装）、随时 steer、与 plan 评审的否决权。
2. **plan 是姿态，不是权限系统。** mutation 工具在 plan 模式下仍然在目录里、仍然可调用；真正拦住它们的是既有 approval/answerer 管线与人类评审，不是 plan 模式本身。plan 被模型违反时，剩下的是审计（`plan/mode`、`request/header` 全在日志里）与审批闸门，不是沙箱。
3. **自主权不持久是故意的不变量。** activation 进程本地、重启即 disarm——这意味着"三小时无人值守"在 DSH 里永远是"三小时随时可被人类收回的无人值守"，代价是重启后需要一句"继续"。这是设计取舍，不是缺陷：持久的自主权才是真正需要担心的东西。
