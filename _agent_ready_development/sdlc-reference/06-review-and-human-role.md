# Reference 06 · Semantic review（语义评审）

## 一句话

DSH 的 code review（代码评审）不是“机器查结构、人查语义”的固定人员分工。自动检查只能建立它们实际验证的属性；人或 agent 都可以按 `dsh-code-review` 做 semantic review（语义评审）；只有 interaction/approval（交互与审批）机制明确要求用户选择的动作不能由 agent 代答，超出既有授权的产品取舍也要请求方向。

> The report identifies paths and dirty layers but does not replace semantic review. [...] Prioritize correctness, lifecycle, security, and broken required behavior over style.
>
> — DSH [`dsh-code-review` skill 的开篇](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-code-review/SKILL.md)。这里把 scope 工具、自动检查与语义判断明确分开。

## 1. 三层证据不要互相冒充

| 层 | 能建立 | 不能建立 |
|---|---|---|
| static gates、tests、snapshots、CI | 类型、格式、链接、指定场景行为、coverage、build 与平台结果 | 意图是否合理、抽象是否必要、prose 是否准确、测试场景是否选对 |
| semantic review | 实现是否符合任务意图、PR 描述，以及适用时的 Issue 与 owning Agent Note；生命周期、安全、owner、失败、模型视角和真实入口是否完整 | 替代实际运行的检查或用户决定 |
| explicit user interaction | 批准 Plan、授权受限操作、回答交互问题 | 自动证明代码、文档和全部平台已经通过 |

`human-review policy` 是 `.github/issue-management/policy.mjs` 对人类作者 PR 的 metadata 适用条件；它没有规定 reviewer 身份，也不应被拿来证明 semantic review 已由人执行。branch rules 实际要求的 `weighted approval` commit status（加权批准分数与 `/delegate`）由 [Reference 10](./10-approval-gate.md) 单独说明；它回答“谁批准了多少分”，不改变本页的语义评审义务。

仓库规则同样没有把所有产品判断永久保留给人。Agent 可以在任务授权和当前规则内作实现决定；只有需要扩大范围、改变用户意图或取得显式 approval 的选择必须交还用户。

## 2. review 从 live diff 和 owner 开始

`dsh-code-review` 要求先验证并 fetch PR 的 live base 与 exact head，再运行 `change-scope`。Retarget 或 base merge 后重新建立 scope。Reviewer 读取 diff、surrounding code 和对应 owner：

- root/subtree `AGENTS.md` 与 defensive patterns；
- owning package README、subsystem page 与 public JSDoc；
- Agent Notes 的 rationale；与 Note 不同是 design discussion，不是自动 veto；
- testing policy、snapshot 场景和当前 PR CI；
- bilingual changes 的两种语言，而不只 pairing hash。

Skill 是 guidance，不是完整 checklist；review 优先 correctness、lifecycle、security 和 required behavior，不用绿色 gate 已经可靠拒绝的格式问题填充 findings。[Skills 专章](../repo-harness/03-skills-as-procedural-memory.md) 进一步解释 guidance、gate、workflow 与 review 为什么不能互相替代。

## 3. blocking requirements

以下事实缺失时 review 应阻止合并：

- 新增或改动 prose 已接受语义审查；
- config、defaults、errors、wire fields、events 和 public behavior 同 diff 更新 owning README/JSDoc；
- spine 或 capability seam 的 public types 同步 subsystem/type-equivalence owner；
- registry contribution 具有 disposal evidence；
- invariant companion 用独立观察比较 owned 关系，不用 service/method presence、plugin metadata、effect 或固定例子充数；没有可观察关系时省略 `./invariant` 接线并在 package README 记录原因，空 installer 会被 `verify-package-invariants` 拒绝；
- 作者运行覆盖 diff 的相关本地证据，CI 提供远端矩阵。

## 4. 高风险语义检查

Reviewer 沿实际 consumer 和执行入口检查：

- interface 的 error、cancellation、ownership 与 disposal；
- async setup、callback、process 和 teardown 的 race、reentry、detach 与 quiescent disposal；
- consumer-specific behavior 是否泄漏到 generic service，或单一内部 consumer 是否造成多余 public API；
- default、option、compatibility path 和 defensive copy 是否有当前 consumer 或明确决定支持；
- 模型实际看到的 prompt、tool schema、result、diagnostic 和 transcript；
- denial 是否在直接与替代调用路径都到达最终 operation；
- derived state、cache、UI echo 和 replay 是否来自 authoritative success point；
- byte/size limit 是否覆盖 wrapper 与 metadata 后的最终结果；
- Loader、bin、worker、ACP bridge、subprocess 和 built artifact 是否走 shipped entry path；
- assertion 是否会在目标 regression 上失败，negative control 是否通过真实 runner 被拒绝；
- proposed Note 被实现时是否在同 diff 移动并改写为 present-tense shipped reality。

这份列表解释语义维度，精确 review 范围仍由 diff 决定。

## 5. Findings 与反馈闭环

Finding 要给出 defect、location、impact 和 evidence；局部问题放最窄 diff range，跨文件 owner 或设计问题放 PR-level comment。Blocker 与 suggestion 分开，pending check 继续报告 pending。

收到 review 后逐条复核 claim：成立就修复并补证据，不成立就用技术事实反驳，不作表演式同意。历史改写会让旧 commit OID、inline anchor、approval 和 check 证据失效；push 后重新审计 unresolved threads、approvals、mergeability 和 current checks。

## 证据入口

- DSH [`dsh-code-review` skill](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-code-review/SKILL.md)：review scope、阻塞条件、语义维度和 finding 格式。
- DSH [Defensive patterns](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/defensive-patterns.md)：生命周期、并发、subprocess 与 teardown 的高风险缺陷模式。
- DSH [测试策略](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/testing.md)：测试实际能够建立什么证据，以及真实入口与负例要求。
- DSH [Issue/PR policy](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/issue-management/policy.mjs)：`human-review policy` 的适用条件，不是 reviewer 身份规则。
- DSH [PR template](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/pull_request_template.md)：提示 PR 作者呈现适用的 Issue 关联、摘要与已运行验证。
- DSH [Quality gates Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-06-11-quality-gates.md)：自动化检查的设计理由与能力边界。
