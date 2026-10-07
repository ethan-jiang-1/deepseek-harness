# DSH Goal Loop、完成判定与 OpenSpec 研究

## 结论

DSH 的 `goal` 是单个 Session 内可暂停、恢复、阻塞、完成的续轮状态机，不是跨 feature 的工作队列或验收系统。运行时负责按状态与权限调度续轮、记录 durable 状态并实施轮数上限；它要求模型在宣告完成前收集证据，但未把自然语言目标转成可机器逐项判定的验收标准。仓库有大量 goal 状态机、持久化、工具授权和真实组合测试，却未见 goal 专项质量评估集或对“完成声明是否真实”的独立 evaluator。

OpenSpec 在仓库内是对照/建议性材料，而非 DSH 产品集成或仓库强制流程。已有研究准确指出：OpenSpec 提供可迭代的 change 产物并鼓励计划审阅，但 OPSX 明言无刚性阶段门；它不能被概括成强制逐阶段审批，也不能替代对完成质量的证据检查。

## Goal 的运行时控制点

- [goal-round-driver/src/index.ts](../../packages/goal/goal-round-driver/src/index.ts#L102) 的 `readyToDrive` 只在 runtime 活跃、精确 Agent 仍 live、agent idle、无竞争队列时调度；同文件 :137-204 在 checkpoint 后最多 reserve 一个续轮，读取 active/armed 状态并在 round cap 到达时 block。调度状态机处理取消、暂停、过期 revision、竞争消息和 durability checkpoint；这些是**续轮/生命周期控制**，不是需求完成评估。
- [goal-round-driver/src/prompt.ts](../../packages/goal/goal-round-driver/src/prompt.ts#L18) 要求检查当前 workspace、tool results 与 durable session state，完成前 gather evidence、读取当前 goal 并 mark complete；若仍有工作则保持 active。提示规定了模型应采用的完成协议，但没有将目标解析成独立验收项或由运行时核验证据。
- [tool-goal/src/index.ts](../../packages/goal/tool-goal/src/index.ts#L114) 的工具 guidance 规定完成仅在目标实际达成时使用；block 还须同一阻塞条件持续至少配置轮数。:291-331 对 complete/blocked 检查 authority、revision 和 block threshold，并将完成/阻塞结果 durable 记录，续轮终止时注入 wrap-up。该执行层拒绝越权或过早 block，但 `complete` 路径的业务真值仍来自模型判断。
- [goal/src/domain.ts](../../packages/goal/goal/src/domain.ts#L13) 定义 create/edit/pause/resume/complete/block/clear；:23-44 记录完整状态快照或 clear tombstone；:46-81 记录续轮 attribution、轮数及 replay fold。数据模型保存状态演进，不包含 feature queue、acceptance criteria 或 evaluator 结果字段。
- [05-control-points.md](./05-control-points.md:7) 已明确将 goal 定义为单会话持续执行状态、非跨 feature 队列；:17 指出测试结果要逐项回指目标，绿灯不等于需求或体验正确。

## 测试资产与评估缺口

可见的 goal 测试资产包括：[goal.spec.ts](../../packages/goal/goal/tests/goal.spec.ts)、[goal-round-driver.spec.ts](../../packages/goal/goal-round-driver/tests/goal-round-driver.spec.ts)、[tool-goal.spec.ts](../../packages/goal/tool-goal/tests/tool-goal.spec.ts)、[command-goal.spec.ts](../../packages/goal/command-goal/tests/command-goal.spec.ts) 与 [goal.e2e.ts](../../packages/goal/goal/tests/goal.e2e.ts)。驱动器测试 :152-219 覆盖提示协议、prompt injection quoting、精确编号轮次及上限；其余测试涵盖生命周期、重放、tool authorization、block threshold、cancel、pause/resume、错误与组合加载。

因此可证实的验证范围是**机制正确性**：调度是否按状态继续，授权是否拒绝非法动作，持久化与恢复是否一致，提示与工具输出是否符合既定协议。未发现这些测试对模型能否可靠理解任意目标、是否收集了充分证据、是否误报完成、最终用户体验是否合格做独立裁判。测试中对 prompt 文本的断言（如 [goal-round-driver.spec.ts](../../packages/goal/goal-round-driver/tests/goal-round-driver.spec.ts#L152)）证明协议文本存在，不证明模型遵循协议。

需要明确区分“没有找到专门评估资产”和“仓库绝无任何外部评估”：本次范围检索 `packages/goal/` 与 `benchmarks/`，其中 benchmark 资产是 continuation/session 性能基准（[benchmarks/agent-continuation/README.md](../../benchmarks/agent-continuation/README.md)），不是 goal completion quality evaluator。对任意自由目标的语义完成度，仍需外部测试场景、人工审阅或领域 evaluator。

## `.agents/`、借鉴语料与 Agent-ready 语料

- [.agents/notes/README.md](../../.agents/notes/README.md:44) 把 Agent Notes 限定为代码、测试与现有文档尚未解释的持久决策理由；:46-52 表明它们不是通用任务队列。`.agents/` 的 Skills 提供可复用流程/判断标准，根 `AGENTS.md` 提供常设约束，二者不是当前跨 feature backlog。
- [_faq_on_digested/07_borrowing-dsh-harness-idea/01-sdlc-change-loop.md](../07_borrowing-dsh-harness-idea/01-sdlc-change-loop.md:17) 将交付闭环表达为意图、owner、决定、实现/文档/回归证据、本地检查、CI/review、归位；:29-33 要求证据与声称对齐、负例能使检查失败。这里的完成是可核对交付证据，不是 goal 状态本身。
- [_dsh_plugin_agent_ready_development/README.md](../../_dsh_plugin_agent_ready_development/README.md:3) 将该目录定义为独立学习/研究语料，并说 DSH 未正式声明采用名为 SDD 的方法；:29-35 说明其基线、来源和证据范围。[_dsh_plugin_agent_ready_development/sdlc-reference/09-intake-and-work-items.md](../../_dsh_plugin_agent_ready_development/sdlc-reference/09-intake-and-work-items.md:75) 明说仓库没有 Issue→agent 自动分派，goal/todo 是运行时协作状态而非仓库工作项。
- [15-loop-engineering-vs-sdd/05-control-points.md](./05-control-points.md:9) 建议插件仓为当前工作保留一个权威来源（ROADMAP、Issue 或 OpenSpec change/tasks），显式记录为何做、已批准范围、下一步和停止条件；:25-29 建议用多笔真实工作检验状态是否可信、验证是否对齐，而非预先宣称流程奏效。这是研究建议，不是 DSH 产品要求。

## OpenSpec：仓库引用及其证据边界

OpenSpec 关键词在仓库出现于 `_faq_on_digested/` 的研究材料、专家插件仓建议与一个归档 goal-driver 设计说明；检索到的 `.agents/` 和 `_dsh_plugin_agent_ready_development/` 流程目录没有 OpenSpec 采用声明，也未发现产品树中的 `openspec/` 流程或 schema。已有引用的主要观点如下：

- [01-slice-vs-pipeline.md](./01-slice-vs-pipeline.md:19) 将 OpenSpec change 产物和 Spec Kit 的逐步审阅路径分开；引用 OpenSpec README 的计划审阅建议，并引用 OPSX 的“无刚性阶段门、产物可反复修订”。
- [02-external-trend-verdict.md](./02-external-trend-verdict.md:18) 明确区分建议人审与运行时强制审批，避免把 OpenSpec 和 Spec Kit 都说成每阶段硬门。
- [answer.md](./answer.md:7) 说明 OpenSpec 产物可以成为 loop 的外部记忆/审阅依据，但循环与 SDD 并非二选一；:36 以长程工作清单、进度文件和端到端测试说明规格/状态可与续轮并用。
- [13_expert-plugin-repo-organization/answer.md](../13_expert-plugin-repo-organization/answer.md:40) 建议先借 DSH 的 AGENTS/docs/notes/tests，第二贡献者或需要向 DSH 上游提 seam 时再考虑 OpenSpec；这是针对外部插件仓的建议，不代表 DSH 集成。
- [archived goal-round-driver note](../../.agents/notes/archived/feature/2026-07-19-same-session-goal-round-driver.md:79) 记录过“将 goal loop 塞进 agent-loop”这一备选被拒，理由是公共队列、提示、session、取消与状态契约已足够，内嵌具体循环会偏袒一种策略；这是架构边界的历史证据，不是 OpenSpec 采用材料。

外部一手引用（按已有仓内研究的记录；本报告未重新抓取远端页面）：

- OpenSpec README: https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/README.md — change proposal/specs/design/tasks 产物，鼓励实现前 review plan。
- OpenSpec OPSX: https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/opsx.md — “fluid not rigid”、无刚性阶段门、依赖为 enabler 而非 gate；允许产物随实施修改。

## 主要缺口

1. **工作层可见性**：goal 保存一个 objective 和会话内轮次，不表达多个 feature 的排序、负责人、批准范围、状态或跨会话队列。外部插件仓需自行选择单一权威 backlog/spec 来源。
2. **完成判定独立性**：提示和工具政策要求“实际完成并有证据”，但没有机械地将目标映射到验收项，也没有独立 evaluator 验证完成声明。完成状态是 durable 的，不等同于被外部裁判证明。
3. **证据映射**：运行时未持久化“目标子项 → 测试/操作 → 结果 → 未覆盖判断”的结构化映射。仓内交付纪律要求证据与声称对齐，但该映射主要由变更作者/评审者维护。
4. **模型行为评估**：goal 测试以 deterministic mock/fixture 验证 harness 控制逻辑，没有 goal 专项成功率、误完成率或跨目标回归 benchmark 的证据。模型输出质量和需求解释仍需真实任务评审或独立评估。
5. **人类批准与停止条件**：现有 tool policy 可限定特定 goal 动作的调用来源，但普通 continuation 本身不会要求人在每一轮检查计划或批准偏离；高风险/模糊工作需由外部流程定义审阅点与停问条件。

## 证据范围与限制

本报告是仓内源码、测试和既有研究笔记的只读综合；文件路径及行号指向本 checkout 的现状。OpenSpec 两条外部 URL 来自仓内既有研究引用，本次没有验证其远端当前版本；引用内容应视为研究记录所述，不用于证明 DSH 有 OpenSpec 集成。`No matching OpenSpec files found` 仅是检索结果，不是对所有未纳入检索的外部插件仓作判断。
