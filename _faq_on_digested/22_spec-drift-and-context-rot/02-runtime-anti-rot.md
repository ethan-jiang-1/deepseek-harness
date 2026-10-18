# 02 · 运行时机理：DSH 产品自己防了什么

这一节只看**产品运行时**（`packages/` 里的插件与 session 机制），不看仓库治理。结论先说：DSH 把「会话里的事实」放在一条仅追加日志上，模型可见面只是它的投影，工作状态（goal / plan / todo）全部落同一条日志——所以上下文可以被压缩，但**记录不会因此腐化**；真正会丢的只有「还没写进仓库、只存在于对话叙述里的东西」。

## 一、记录面与可见面分开

这是整套机制的地基，也是 DSH 自己反复写下的第一条不变量：

- `docs/architecture.md:124`：「**Model-visible means logged.** Every model request must be reconstructable from the log.」（`[原文]`）
- 根 `AGENTS.md:137` 的同一条规则：「anything that reaches a model request must be reconstructable from the session log; a new model-visible input requires a session event.」（`[原文]`）
- `packages/core/session/README.md:12`：「records every model-visible fact in an append-only session log and derives model history from that record … compaction hides superseded entries from the active conversation without deleting them.」（`[原文]`）
- 请求信封（config、adapterDefaults、工具 schema）是**被记录**的会话状态，所以「每一次对话请求都是日志的纯函数」；渲染后的 system prompt 是 surface 节点 0 的 `system/message`（`docs/subsystems/session.md:183`，`[原文]`）。
- 模型历史由 `Session.deriveMessages()` 从日志投影，投影规则是纯函数、只投影一次、冻结（`docs/subsystems/session.md:668`，`[原文]`）。

含义：**上下文里丢的东西，在日志里找得回来**。腐化只可能发生在投影这一层，不可能发生在「事实被悄悄改写」这一层。

## 二、compaction 是「有账的遮蔽」，不是删除

长会话必然要压缩。DSH 的做法是让压缩**显式、可观测、可审计**：

- compaction 的三个事件（`compaction/start`、`compaction/summary`、`compaction/end`）都是 **log-only**：记录锁、摘要、选中范围、被遮蔽事件的 seq、token 数与模型调用，但**不加入 surface**（`docs/subsystems/compaction.md:11`，`[原文]`）。
- `compaction/summary` 的载荷带 `shadowedSeqs`（按 surface 顺序）与 `shadowedTokenCount`——压掉了什么、值多少 token，都记账（`docs/subsystems/compaction.md:16`，`[原文]`）。
- 原始事件留着，只是不再进入派生消息：「The raw events stay logged but stop appearing in derived model messages; the seam itself performs no rewrite.」（`packages/compaction/compaction/README.md:142`，`[原文]`）；工具结果的裁剪同理——「The complete original result remains in the session log for exact replay and inspection.」（`packages/compaction/compaction-tool-result-pruner/README.md:12`，`[原文]`）。
- 触发与保留可配置：默认 `floor(min(W × 0.8, W − O − 65536))` 触发，最近 `16%` 的 `W − O` 逐字保留（`packages/compaction/compaction-basic/README.md:62`、`:68`，`[原文]`）；摘要只保留返回文本，**压不动 system prompt、工具与 session 前缀**（同文件 `:12`；`packages/compaction/compaction/README.md:161`），也**切不开一个不可分的单元**（`packages/compaction/compaction/README.md:160`，`[原文]`）。
- 每个被选中的范围都从「第一条不是 `system/message` 的 surface 节点」开始，所以节点 0 的 system prompt 永远不会被遮蔽（`packages/compaction/compaction-basic/README.md:113`，`[原文]`）。
- 写入是一笔有开始有结束的事务：`compaction/start` 先落，摘要与替换消息随后，`compaction/end` 最后释放锁——**中途崩溃留下的是可检测的孤儿锁，而不是假装成功**（`docs/subsystems/compaction.md:19`，`[原文]`）。

最有意思的一条在摘要提示词里：**压缩指令本身要求丢弃过期事实**。

> If the conversation already contains a `<compacted-summary>` block, it is a PRIOR checkpoint. Do not copy it forward verbatim: preserve still-true facts, **drop stale ones**, and merge newer information into a single consolidated summary under the same structure.

出处：`packages/compaction/compaction-basic/README.md:224`（`[原文]`，加粗为本节所加）。同一提示词还固定要求产出 `## Primary Request and Intent` 一节，目标是「a structured checkpoint that lets another model resume the work with no loss of essential context」（同文件 `:191`、`:195`，`[原文]`）。

所以对使用者的直接结论：**压缩会丢细节，但不会丢事实来源**；而且压缩被明确要求按「现在还成立吗」重写，不是照抄。凡是「不写下来就会丢」的东西（放弃的方案、约束、验收判据），要放进仓库或 Note，别指望留在对话里。

## 三、稳定性靠追加，不靠重写

运行时上下文（当前 checkout、GUI URL、时间等）如果每次都重写历史，前缀缓存和可回溯性都会崩。规则是**值不变就不写，值变了就追加一条快照**：

- `harness-dev-context`：「Runtime context follows the shared snapshot rules: an unchanged value adds nothing, and a changed one appends a snapshot before the step's input instead of rewriting earlier messages.」（`packages/context/harness-dev-context/README.md:32`，`[原文]`）
- 请求信封只在 `initial` / `resume` / `change` / `series` 四种理由下追加快照；`foldRequestHeader(events)` 取最近一条重建（`docs/subsystems/session.md:183`，`[原文]`）。
- 状态型事件必须携带**变更后的完整状态，而不是增量**：「A state-carrying log event must carry the complete post-change state, never a bare delta.」（`packages/session/session-projection/README.md:54`，`[原文]`）。这条是「折叠日志就能恢复状态」的前提。

## 四、工作状态外置到日志

这是最容易被当成「普通功能」的一组机制，实际是**反漂移**的核心：它们把「我现在要做什么」从对话叙述里拿出来，变成可折叠、可恢复的持久状态。

| 机制 | 持久方式 | 恢复与再注入行为 | 出处 |
|---|---|---|---|
| **goal** | 一条 durable `goal/change` 事件；每个 session 只有一个当前目标 | 跨 turn、resume、fork、进程重启存活；**续跑许可（armed/disarmed）故意不持久化**，resume/fork 后必须由人显式 rearm | `packages/goal/README.md:12`、`:72`、`:99`；`packages/goal/tool-goal/README.md:116`，`[原文]` |
| **plan mode** | 单个 log-only 的整值替换事件 `plan/mode`，最后一条记录值就是状态 | 「resume, fork, and compaction recover it by folding the log」；每次组装 system prompt 时由投影状态决定是否注入 `plan:policy` 段 | `packages/plan/plan-mode/README.md:81`、`:12`；`packages/plan/plan-mode/src/index.ts:9`，`[源码]` |
| **todo** | 整表替换的 `todo/write` 快照事件，属于单个 agent session | **只作日志态 UI 状态，明确「never derived history」**——持久、可重放、可重建，但不会自动回灌进模型历史 | `packages/todo/tool-todo/README.md:12`；`packages/todo/tool-todo/src/types.ts:30`，`[原文]` |

三者的共同点：**状态是值，不是叙述**。值可以被折叠、比较、被 UI 直接读；叙述只能被重新解读。差别也很重要：goal 与 plan 会重新进入模型请求，todo 不会。

## 五、再锚定：让模型回到现场

光有持久状态不够，还要有人把它重新说给模型听。DSH 有三处针对「叙述可能已经过期」的显式设计：

**1. 自动续轮要求以现场为准。**

> Treat the current workspace, tool results, and durable session state as authoritative; inspect them instead of assuming earlier narration is still current.

出处：`packages/goal/goal-round-driver/src/prompt.ts:18`-`20`（`[源码]`）。同一提示词要求「声称完成前先取证、读当前 goal、再标 complete」（同文件 `:20`-`:23`）。这是仓库里唯一直白假设「早先叙述可能过期」的运行时指令。

**2. 目标轮次会整条重发，直到被压缩遮蔽。**

> Each admitted round is one retained user-role `<goal_round>` block naming the full objective and positive round number. … Later requests resend retained rounds until compaction shadows them.

出处：`packages/goal/goal-round-driver/README.md:108`、`:112`（`[原文]`）。终结轮还有一条配套的收紧指令：「Report only what earlier rounds and tool results in this session actually establish.」（`packages/goal/tool-goal/src/wrapup.ts:6`，`[源码]`）。

**3. 指令基线被压缩遮蔽后，会在下一次 pre-step 重新注入。**

> Refresh is touch-driven — there is no watcher; external edits become visible on the next successful first-party `read`, `write`, or `edit`, when resume reconciles a visible baseline, or **when an entering pre-step restores a shadowed baseline**.

出处：`packages/context/agent-instructions/README.md:220`（`[原文]`，加粗为本节所加）。这条很关键：**压缩可以把工作区指令从可见面拿走，但不能让它永久消失**。

## 六、按需加载，而不是全塞进去

规格堆积最直接的成本是「全都放进上下文」。两条机制把它摊开：

- **skills 只发目录**：模型先拿到「名字 + 截断描述（默认上限 500）」的耐久目录，再用 `skill` 工具加载正文；目录整份替换，清空则追加空目录退役旧名字（`packages/skill/tool-skill/README.md:12`、`:54`、`:57`，`[原文]`）。目录消息本身还写明「This catalog contains summaries only; do not infer or follow a skill's instructions until it has been loaded.」（`packages/skill/tool-skill/src/index.ts:268`，`[源码]`）。
- **指令文件分层注入并刷新**：`agent-instructions` 把 `AGENTS.md` / `CLAUDE.md` 载入上下文，注入的是普通带 source 的 `user/message`，因此「replay, compact, and resume exactly like other history」（`packages/context/agent-instructions/README.md:88`，`[原文]`）。

配套的是**预算**：根 `AGENTS.md` 有 2080 词的硬上限，`docs/AGENTS.md` 1430、`docs/architecture.md` 2410、`docs/testing.md` 1350 等，由 `verify-doc-budgets` 在超限或缺文件时拒绝（`docs/AGENTS.md:51`、`:59`；`scripts/doc-budgets.manifest.json:2`-`:8`，`[源码]`）。**常驻上下文的那份规则文件不能无限长**——这是把 spec 堆积挡在上下文之外的第一道闸。

## 七、找回来：检索与隔离

被压缩或压根没进上下文的历史可以按需检索；需要独立上下文的工作则被隔离出去：

- `session-search` 给每个 agent 五个只读全局工具，检索**当前工作区更早的 session**（`packages/experimental/session-search/README.md:12`，`[原文]`）。
- `tool-session-query` 提供五个只读工具（搜索 session、搜索事件、追关系、读精确事件），跨 session 访问要求目标 `cwd` 与调用者完全一致，且**默认关闭**（`packages/experimental/tool-session-query/README.md:12`，`[原文]`）。被压缩遮蔽的事件仍然可搜：「All `current`, `shadowed`, and `log-only` events are searchable by default.」（`packages/session-query/session-query-sqlite/README.md:59`，`[原文]`）
- **子代理按「继承多少上下文」分成两种**：fork 继承父级**已完成 turn 的前缀**，是一次性快照，此后父级再写什么都不会进来（`packages/subagent/subagent-fork-in-process/README.md:32`、`:143`，`[原文]`）；spawn 完全不继承，「The child starts with an empty conversation, so a task prompt must stand alone」（`packages/subagent/subagent-spawn-in-process/README.md:12`，`[原文]`）。委派因此不会把主线上下文继续吹大。

## 八、守住循环卫生（但不是防漂移）

`guard/` 组处理两种「卡住」：重复调用同一工具时按阈值（默认 3、5、8 次）提醒模型换法或收尾，且**只提醒不拦截**（`packages/guard/repeat-tool-reminder/src/index.ts:53`、`:219`；`packages/guard/repeat-tool-reminder/README.md:170`，`[源码]`）；给声明了上限的工具调用加超时（`packages/guard/README.md:12`，`[原文]`）。

边界要说清楚：这两条防的是**卡死与空转**，不是方向漂移。而且仓库明确承认没有语义级的偏离检测——goal 域与 driver 都写着「No independent evaluator」（`packages/goal/goal/README.md:159`、`packages/goal/goal-round-driver/README.md:125`，`[原文]`）。方向是否还正确，仍由人判断。

## 运行时的能力边界

- **压缩是有损的**，只是损失被记账：只保留摘要文本，压不动 system prompt、工具、前缀（`packages/compaction/compaction-basic/README.md:12`）。
- **没有「压缩后自动重述目标」的机制**：目标只在调度下一轮时整条重发（`packages/goal/goal-round-driver/README.md:112`）；不续跑就没有这句话。
- **会话记忆不等于项目记忆**：日志记的是这一次会话；跨会话检索要显式挂 `session-search` / `tool-session-query`。
- **没有语义漂移检测器**：没有运行时会对「你现在做的和当初说的还是不是一件事」下判断。
