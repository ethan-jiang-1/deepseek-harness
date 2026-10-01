# ralph：fresh-agent 循环的轮间传递与固定脚本机制

源码核验入口：`packages/workflow/tool-ralph/src/index.ts`（`RALPH_SCRIPT`、防御性解码、工具注册）、`packages/workflow/tool-ralph/README.md`、`.agents/notes/implemented/feature/2026-07-16-harness-level-loop.md`（两策略决策）、`packages/bundle/base/cordis.patch.yml`。

本页回答：ralph 轮间到底传什么、固定脚本锁死了什么、四种终局怎么结算、为什么 DSH 把「长任务」显式分裂成 goal 与 ralph 两种策略？工具的选择边界（仅人类显式要求）见 [`02-什么时候用哪个原语-官方选择决策语义全景.md`](./02-什么时候用哪个原语-官方选择决策语义全景.md)；它跑在哪个引擎/进程里见 [`01-workflow-模型编写的JS编排脚本与子代理扇出机制.md`](./01-workflow-模型编写的JS编排脚本与子代理扇出机制.md)（ralph 是 `ctx.workflowEngine` + `ctx.subagents` 之上的普通插件，复用 PTC 执行链）。

## 一轮 ralph 到底发生了什么

模型提交 `{ objective, maxRounds? }`，**调用阻塞到整个 run 结算**（前台 only）。工具层做四件事（`packages/workflow/tool-ralph/src/index.ts:435`-`453`）：

1. 取 `exec.agent` 作 parent（无调用 agent 即 fail loud，`:437`-`438`）；objective trim 后非空（`:440`-`441`）；
2. `resolveMaxRounds`：部署 `maxRounds` 既是默认也是 ceiling，调用侧只能往下调（`:206`-`214`）；
3. `requireFreshProvider` 预检：provider 必须存在、具备 `outputSchema` 能力、**不继承父上下文**（fork provider 被拒：`inheritsParentContext` 为 true 直接 throw，`:218`-`230`）；
4. `ctx.workflowEngine.start({ script: RALPH_SCRIPT, meta: RALPH_META, args: { objective, maxRounds, maxHandoffChars }, subagentProvider, maxTotalAgents: maxRounds, parent, signal: exec.signal })`（`:445`-`453`）——**`maxTotalAgents: maxRounds` 把引擎的总子代理上限钉到轮预算**，双层预算收敛为一个数字。

每轮的 child prompt 由固定脚本拼六段（`RALPH_SCRIPT`，`packages/workflow/tool-ralph/src/index.ts:151`-`160`）：

1. 身份声明："You are one fresh worker in a foreground Ralph loop. You receive no parent conversation and no prior child session. **Do not call the ralph tool: this round already is its worker.**"
2. 不可变 objective（逐字传入，每轮相同）；
3. 轮次计数："Ralph round: N of M."；
4. 记忆纪律："The shared workspace and its current working tree are the long-term memory and source of truth. Inspect them before acting, preserve existing work, perform concrete in-scope work, and verify what you change. **Treat the previous report only as a bounded handoff; confirm it against the workspace.**"
5. 上一轮的结构化 handoff（JSON 序列化；第一轮是 `(none — this is the first round)`）；
6. 报告格式指令（三种 status 的使用条件）。

child 经 `agent(prompt, { label: 'Ralph round N', phase: 'Fresh-agent rounds', schema: reportSchema })` 派发（`:161`-`165`）——**每轮一个全新子会话**，父 transcript 与前轮 child transcript 都不是种子。

## 轮间传什么：五字段结构化报告

跨轮传递的**只有一个 JSON 对象**（`reportSchema`，`packages/workflow/tool-ralph/src/index.ts:89`-`100`）：

| 字段 | 类型 | 约束 |
|------|------|------|
| `status` | enum | `continue` / `complete` / `blocked` |
| `summary` | string | 非空、归一化（trim 后非空） |
| `evidence` | string[] | 每项非空归一化 |
| `nextSteps` | string[] | 每项非空归一化 |
| `blocker` | string | 归一化字符串（非 blocked 时空串） |

全字段必填、`additionalProperties: false`。`validateReport` 的状态条件规则（`:110`-`147`）：

- `continue`：`nextSteps` 非空 **且** `blocker` 为空串；
- `complete`：`evidence` 非空 **且** `nextSteps` 为空 **且** `blocker` 为空串；
- `blocked`：`blocker` 非空（具体阻塞条件）；
- 序列化长度 ≤ `maxHandoffChars`（默认 16384）——「有界」的字面执行点（`:142`-`145`）。

**工具层再验一遍**：固定脚本的返回从 PTC 进程跨回工具，`readReport`/`readRunResult` 做防御性解码（`:244`-`331`）——精确键集检查（排序后 join 必须等于 `blocker,evidence,nextSteps,status,summary`）、状态匹配、归一化复检、per-status 不变量、尺寸上限。脚本内校验 + 进程边界校验是两道独立的门。

## 四种终局

| 终局 | 触发 | 校验要点 | 呈现 |
|------|------|---------|------|
| `complete` | worker 报告 complete | report 必须是合法 complete | `Ralph worker reported completion after N rounds.` + 最终报告 |
| `blocked` | worker 报告 blocked | report 必须是合法 blocked | `Ralph worker reported a blocker after N rounds.` + 最终报告 |
| `budget-limited` | 轮数耗尽 | `roundsStarted === maxRounds` 强制相等；report 必须是合法 `continue` | `Ralph reached its N limit; the worker reported work remaining.` + 最后报告 |
| `round-failed` | child 失败（`agent()` 返回 null） | **失败即终局，不重试**；首轮失败要求 `lastReport === null`，后续轮必须携带最后一次成功 handoff | 映射为工具**错误**：`Ralph round N child failed before producing a structured report.` + 最后成功 handoff（或 `No previous handoff was available.`） |

round-failed 的渲染与校验在 `:281`-`331`（readRunResult）、`:383`-`390`（renderRoundFailure）、`:463`（execute 里 throw）。渲染纪律写在 JSDoc 里：**"without presenting self-report as certification"**（`:358`）——文案永远是 "worker **reported** completion"，不写成「任务完成」；同理 `stopReasonError` 把非 `completed` 的 workflow 结算一律变成错误，绝不把部分输出当部分成功（`:333`-`347`）。

`maxResultChars`（默认 16384）用 `boundResult` 封顶**含 envelope 与截断标记在内的完整文本**（`:349`-`356`）。

## 为什么分成 goal 与 ralph 两种策略

`.agents/notes/implemented/feature/2026-07-16-harness-level-loop.md` 的决策记录：

**问题意识**：定时 prompt、同会话续跑、fresh-agent Ralph 都在「重复工作」，但它们的状态、权限、记忆与生命周期完全不同——同会话工作必须在既有 transcript 里持久化人类目标并保留对话上下文；Ralph 工作**有意丢弃**对话上下文，只用 workspace + 一个有界 handoff；完成与阻塞声称需要**显式信任边界**，而不是偷渡进某个调度器抽象。把一切重复动作泛化成一个通用 loop 服务会掩盖这些差异。

**决策**：两个显式插件策略，架在既有 seams 上——同会话 goal（durable objective + armed activation 下的 goal-attributed 续轮）与 fresh-agent Ralph（固定前台 workflow，每轮一个无种子的结构化 child）。**明确拒绝了** `packages/loop/` 家族、`LoopDriver`、`LoopId`、universal `StopCondition`、模型可见的 generic `loop` 工具。

**两套词汇表**（Round 是外层策略迭代，不是 turn 的同义词）：

```text
同会话：  Goal → Goal Round → Turn → Step        （目标持久在会话里，激活可续轮）
fresh-agent：Ralph Run → Ralph Round → fresh child Turn → Step（每轮一个新子会话）
```

**第三种策略未实现**：time-based `/loop` 与 scheduled execution 属于 scheduler，不属于这两个家族。

## 已知限制（README 明文，`packages/workflow/tool-ralph/README.md:155`-`165`）

- **完成是 worker 自声明**——没有独立评估器或验证器判定目标是否真的完成；evaluator policy 与 evaluator-driven continuation 延后；
- **仅前台**——无 job id、无后台收集、无进程恢复检查点、无调度器、无 wall-clock 启动策略；
- **workspace 是唯一跨轮长期记忆**——一个有界报告是显式 handoff，未提交的对话推理随每轮 child 消失；
- **一轮一个 fresh child**——轮内无扇出、无模型/provider 切换、无 fork context、无模型调用侧选 provider。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/workflow/tool-ralph/src/index.ts:88`-`175` | `RALPH_SCRIPT` 固定脚本：reportSchema、validateReport、轮循环、四种终局返回 |
| `packages/workflow/tool-ralph/src/index.ts:244`-`331` | 跨进程边界的防御性解码（readReport / readRunResult） |
| `packages/workflow/tool-ralph/src/index.ts:333`-`390` | stopReasonError、boundResult、renderResult / renderRoundFailure |
| `packages/workflow/tool-ralph/src/index.ts:402`-`477` | 工具注册、参数 schema、execute 全流程、abort 桥与 dispose |
| `packages/workflow/tool-ralph/src/index.ts:184`-`230` | Config 解析与 requireFreshProvider 预检 |
| `packages/workflow/tool-ralph/README.md:155`-`165` | 四条已知限制（worker 自声明 / 仅前台 / workspace 唯一记忆 / 一轮一 child） |
| `.agents/notes/implemented/feature/2026-07-16-harness-level-loop.md` | 两策略决策：为什么没有通用 loop 服务 |
| `packages/bundle/base/cordis.patch.yml:441`-`452` | base 默认 `disabled: true` 与理由注释 |
