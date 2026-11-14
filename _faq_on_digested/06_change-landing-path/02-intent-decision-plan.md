# 02 · 上游：Issue、proposed Note、Plan

## 1. Issue 模板先固定意图与可观察行为（有条件的入口）

Feature issue 模板（0.1.5 基线）只有两节：

> ## Motivation
> ## Behavior

来源：`.github/ISSUE_TEMPLATE/feature.md:1-13`

Idea 与 Research 模板已按[语义化模板决策](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-09-03-semantic-issue-templates-and-policy.md)取消并归入 Task；模板 frontmatter 只保留 `name`/`about`/`type`，验收条件与测试证据不再写进模板，改由 PR 的 Testing 节承载。Bug 模板要求概述、复现、当前行为、预期行为与环境。

模板只问意图与可观察行为，不问内部类名或函数列表；这让后续设计可以变化，但不丢掉最初要解决的问题。

但要划清机器边界：模板只定义字段，Issue policy 不解析“验收条件”是否写得足够好；它对 PR 的强制只发生在 `requiresPullRequestPolicy()` 返回 true 时——**非 Draft、非 Bot/App 作者、已请求或已产生 review 的人类 PR**——然后要求至少引用一个同仓库 Issue。

> const automated = authorType === 'Bot' || authorType === 'App'
> return !isDraft && !automated && (reviewRequestCount > 0 || reviewCount > 0)

来源：`.github/issue-management/rules.mjs:60-70`（`requiresPullRequestPolicy()`）；引用检查在 `validatePullRequest()`，见 `.github/issue-management/rules.mjs:252`。

## 2. proposed Agent Note 固定设计决策

重大未来工作从 `proposed/` 开始：

> - **`proposed/`** — proposals reviewed before implementation; not yet built (or only partly).
> - **`implemented/`** — the decision shipped. The file records what was decided and what was rejected, and is **kept current with what actually shipped**…

来源：`.agents/notes/README.md:12-14`

proposed 的结构：

```text
## Problem
## Proposal
## Alternatives considered
## Acceptance criteria
## Risks
```

`## Alternatives considered` 尤其关键：它迫使提案说明“什么方案输了”。这防止 coding agent 只给一个可行写法，而不解释为什么没走其它路。

## 3. Plan Mode 把实施计划变成可审批对象（可选阶段）

Plan Mode 把“边写边设计”压缩掉：

- 先只读探索；
- 计划必须完整到另一位工程师无需再做设计决定即可实现；
- 覆盖目标、成功标准、子系统修改、公开 API/schema/数据流、边界和失败模式、测试、验收条件、显式假设；
- `exit_plan_mode` 提交计划给用户审批，审批后才退出计划态。

但 DSH 自己的文档把它定义为**可选、软引导**：

> The package is optional, and the agent loop does not depend on it.

来源：`docs/subsystems/plan.md:5`

> **Guidance, not enforcement** — plan mode restrains through text only; deployments that need enforced restrictions configure sandbox mode and approval policy independently.

来源：`packages/plan/plan-mode/README.md:184`

所以 [本目录 09 的六层规格](./09-six-layers-and-limits.md) 也明确说：Plan Mode 是会话可选状态，不能证明每个历史 PR 都使用过它。它能证明 DSH 原生支持「先计划、后实施」的可选工作方式，但不是全仓库统一瀑布的一环。

这层的计划不是 prose 文件：计划文本作为 `exit_plan_mode` 的 `plan` 参数进入 review，README 明确“每个 plan 参数与 review 结果保留在 conversation history”里；`plan/mode` 状态才写入 session log。

> Make the plan decision-complete: state the goal and success criteria; group implementation changes by subsystem; identify public API, schema, and data-flow changes; cover edge cases, failure modes, tests, acceptance criteria, and explicit assumptions. Keep it concise enough to review but detailed enough that another engineer can implement it without making design decisions.

来源：`packages/bundle/web-app/presets/ptc.patch.yml:63`（0.1.7 线起 shipped preset 声明迁至 bundle patch；旧 `packages/preset/agent-presets/presets/ptc/agent.cordis.yml:130` 已随重设计删除）；plan/review 留在会话历史见 `packages/plan/plan-mode/README.md:171`。

## 上游小结

```text
Issue  = 要做什么，预期可观察行为
Note   = 为什么这样做，放弃了什么
Plan   = 具体改哪里，怎么验证
```

它们共同把实现阶段的开放设计问题收窄到最小。

## 证据入口

- [`.github/ISSUE_TEMPLATE/feature.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/ISSUE_TEMPLATE/feature.md) 第 1-13 行
- [`.github/ISSUE_TEMPLATE/bug.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/ISSUE_TEMPLATE/bug.md)
- [`.github/ISSUE_TEMPLATE/task.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/ISSUE_TEMPLATE/task.md)
- [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md) 第 12-14、46、83-88 行
- [`.github/issue-management/rules.mjs`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/issue-management/rules.mjs) 第 60-70、252、265 行
- [`docs/subsystems/plan.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/plan.md) 第 5、33 行
- [`packages/plan/plan-mode/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/plan/plan-mode/README.md) 第 93、171、184 行

## 4. Agent Note 的生命周期与两笔对照

`.agents/notes/` 的目录名就是生命周期：

```text
implemented/   ← 已交付决定，按 architecture / bug-fix / feature / process / simplification / testing 分家
proposed/      ← 待评审提案
rejected/      ← 驳回记录（只在仍能防一个可信错误时保留）
archived/      ← 冻结历史，不作当前权威
```

进入 `implemented/` 时，`## Proposal` 必须改写成现在式 `## Decision`，`## Acceptance criteria` 与 `## Risks` 折入 `## Consequences`；不能原样保留未来式提案。Note 的格式由 `verify-agent-note-format` 检查，但“这个 diff 是否非平凡、是否该有 Note”仍由 review 做语义判断。

两笔真实修改并排看：

- **无需 Note**：模型选择器显示 ID（提交 `5124a2a310`）。局部呈现修改，任务意图、当前合同、回归证据各有 owner，没有“为什么选当前方案、放弃了什么”的持久取舍；理由读完源码和 README 就完整。
- **需要 Note**：pnpm 子进程长期占用 profile lock（提交 `ccaa0dc11c`）。Problem 记录 22 分钟锁持有与 worker-pool 缺陷，Decision 记录进程退出信号与有界排水，Alternatives 列五条被否路线，Testing 指四个测试文件，Consequences 写接受哪些代价。

Plan 与 Agent Note 面向不同时间：Plan 回答“这一次准备怎样做”，服务当前会话；Note 回答“仓库为什么长期采用这个决定”，服务未来维护者。具体案例见 [07](./07-model-selector-case.md)。
