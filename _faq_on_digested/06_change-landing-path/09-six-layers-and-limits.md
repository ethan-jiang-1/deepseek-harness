# 09 · 六层规格：静态载体地图与不能推出的结论

[07](./07-model-selector-case.md) 跟着一笔真实交付走，[02](./02-intent-decision-plan.md)–[04](./04-implemented-note-and-review.md) 拆解上游、中游、下游。这一页把镜头拉回静态结构：**规格在 DSH 里不是一个文件，而是六层各归其位的载体**；顺带划清从仓库事实不能推出什么。

## 六层，各回答一个问题

| 层 | 主要载体 | 回答什么 | 约束方式 |
|----|----------|----------|----------|
| 意图 | GitHub Issue | 要改变什么可观察结果，怎样算完成 | Bug / Feature / Task 模板固定填写节；验收条件由 PR 的 Testing 节承载 |
| 决策 | Agent Note（`proposed/` / `implemented/` / `rejected/`） | 为什么这样设计，什么方案输了，接受什么风险 | 固定 `Problem` / `Proposal`（或 `Decision`）/ `Alternatives considered` / `Acceptance criteria` / `Risks` 结构；格式由 `verify-agent-note-format` 检查 |
| 实现计划 | Plan Mode 的 plan | 哪些子系统、API、schema、数据流、失败路径和测试要改 | 先只读勘察；`exit_plan_mode` 要求完整 Markdown 计划并取得明确批准（[plan-mode README](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/plan/plan-mode/README.md)） |
| 当前合同 | 类型、配置 schema、事件声明、README、JSDoc、architecture/subsystem 文档 | 调用方和实现方现在必须遵守什么 | strict TypeScript、生成目录、类型等价、README/JSDoc 与文档同步检查 |
| 行为证据 | 单元测试、真实组合测试、keyless snapshot、浏览器快照、real-API e2e | 真实入口和外部可见行为是否满足要求 | 测试矩阵、每文件覆盖率、负例、日志重建、快照 diff、真实 API smoke（[`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)） |
| 工程规则 | `AGENTS.md`、skills、脚本与 CI | 任何变更都不能破坏哪些仓库级约束 | 可机械检查的规则变成非零退出命令（[`scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts)）；语义边界由 review 承担 |

这六层不是一条必须逐层经过的流水线。它们的分工遵循“一个事实一个家”：Issue 不复制长期理由，Agent Note 不复制当前 API，README 不复制生成目录，测试也不替代设计理由。

## 不能从仓库推出什么

- **不能**说 DSH 官方采用了某个名为 SDD 的标准方法；仓库没有这项自我声明。
- **不能**把研究材料对 OpenSpec 的一次对照当成产品采用证据：产品树中没有 OpenSpec workflow 或 schema。
- **不能**说每个变更都先写正式 spec。规则允许已经做出的决定直接从 implemented Agent Note 开始，纯机械或局部改动也豁免。
- **不能**说它严格 TDD。测试和验收必须规划并落地，但没有证据要求所有实现先经历 red-green-refactor。
- **不能**把 Agent Note 当成唯一真相。它拥有理由、取舍和当前决策；精确类型、配置、事件、输出与测试仍各有自己的权威来源。
- **不能**说所有规则都有自动门禁。非平凡变更是否需要 Note 由 review 做语义判断，Plan Mode 本身也是 guidance 而非权限执行器。
- **不能**把 implemented Note 当作最初 spec 的原样归档。它必须按实际交付重写；要研究原始计划，得看 git 历史或仍处于 proposed/rejected 的记录。

## Git 历史里的四种生命周期

| 样本 | 起点 | 收束 |
|------|------|------|
| Plan Mode | `2602270669f1` 新增 session/plan mode 提案，随后多次补充设计 | `5a8e3a14ee97` 把 Note 移到 implemented，后续继续按实现修正 |
| Remote event delivery | `7c8ee81818cd` 只新增 proposed Note（提案 + 替代项 + 验收 + 风险） | `01ecb43ebcdb` 移到 implemented，同提交改 135 个文件（API、wire、Host/Client、测试、文档、生成清单） |
| Drop durable step boundaries | `cc47f76cea0f` 新增 proposed RFC | `7f2769c529b1` 移到 rejected，保留原 Proposal 与 Acceptance criteria，并记录为什么不做 |
| Plan review presentation | `2363ef01eb14` 直接新增 implemented Note，同时交付 UI、测试与 e2e | `6d7bd7e703a0` 修复 presentation narrowing 时同步更新同一 Note、文档和 tests |

这组样本同时支持两个结论：proposal-first 在重大工作中真实存在；它又不是所有变更的绝对前置条件。

## 为什么这套结构适合 coding agent

1. **降低上下文丢失。** Issue 固定目标，Agent Note 固定理由与取舍，Plan 固定本次实现决定，代码和测试固定精确合同；换轮次或换实现者不必从 commit 对话重猜设计。
2. **减少开放设计问题。** Plan Mode 要求另一位工程师可以直接实现，把 coding 阶段从“边写边定架构”收窄为“执行已评审决定，并在发现事实冲突时回到规格”。
3. **把弱约定变成强反馈。** 类型、tests、snapshots、generators 和 CI 能立即拒绝偏离；这比要求 agent 记住数百条 prose 规则可靠。
4. **让插件化改动完整落地。** capability seam、composition、session log 和 presentation 的检查项迫使计划覆盖完整行为，而不是只实现一个局部函数。
5. **允许快速纠正。** 公开 API 是 pre-stable：`AGENTS.md` 要求更新每一个消费方；当规格证明旧基础不对时，可以同步改代码、格式、测试、文档和引用。已发布的 Session 数据例外：相邻迁移只能新增版本命名的后继代，不承诺回退或降级。

## 与动态走查的关系

这一页是静态地图；07 与 02–04 是动态走查。先读哪边都行：需要判断“这个事实该放哪”看本页；需要看“一笔变更实际怎么走”看 [07](./07-model-selector-case.md) 与 [02](./02-intent-decision-plan.md)–[04](./04-implemented-note-and-review.md)。

协作部分见 [GitHub Flow](./08-github-flow.md) 与 [Review/merge](./04-implemented-note-and-review.md)。
