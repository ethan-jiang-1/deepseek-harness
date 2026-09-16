# 02 · 上游：Issue、proposed Note、Plan

## 1. Issue 模板先固定意图与可观察行为（有条件的入口）

Feature issue 模板（0.1.5 基线）只有两节：

> ## Motivation
> ## Behavior

来源：`.github/ISSUE_TEMPLATE/feature.md:1-14`

Idea 与 Research 模板已按[语义化模板决策](../../.agents/notes/implemented/process/2026-09-03-semantic-issue-templates-and-policy.md)取消并归入 Task；模板 frontmatter 只保留 `name`/`about`/`type`，验收条件与测试证据不再写进模板，改由 PR 的 Testing 节承载。Bug 模板要求概述、复现、当前行为、预期行为与环境。

模板只问意图与可观察行为，不问内部类名或函数列表；这让后续设计可以变化，但不丢掉最初要解决的问题。


但要划清机器边界：模板只定义字段，Issue policy 不解析“验收条件”是否写得足够好；它对 PR 的强制只发生在 `requiresPullRequestPolicy()` 返回 true 时——**非 Draft、非 Bot/App 作者、已请求或已产生 review 的人类 PR**——然后要求至少引用一个同仓库 Issue。

> const automated = authorType === 'Bot' || authorType === 'App'
> return !isDraft && !automated && (reviewRequestCount > 0 || reviewCount > 0)

来源：`.github/issue-management/policy.mjs:162-170`；引用检查在 `validatePullRequest()`，见 `.github/issue-management/policy.mjs:373`。

## 2. proposed Agent Note 固定设计决策

重大未来工作从 `proposed/` 开始：

> A proposal for substantial future work starts in `proposed/`; a decision already made starts in `implemented/`.

来源：`.agents/notes/README.md:46`

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

> Plan mode guides rather than enforces; deployments that need enforced restrictions must configure sandbox and approval controls independently.

来源：`packages/plan/plan-mode/README.md:94`

所以 [`02_spec-driven-development`](../02_spec-driven-development/answer.md) 的完整 SDD 判断也明确说：Plan Mode 是会话可选状态，不能证明每个历史 PR 都使用过它。它能证明 DSH 原生支持 spec-first workflow，但不是全仓库统一瀑布的一环。

这层的 spec 不是 prose 文件：计划文本作为 `exit_plan_mode` 的 `plan` 参数进入 review，README 明确“每个 plan 参数与 review 结果保留在 conversation history”里；`plan/mode` 状态才写入 session log。

> Make the plan decision-complete: state the goal and success criteria; group implementation changes by subsystem; identify public API, schema, and data-flow changes; cover edge cases, failure modes, tests, acceptance criteria, and explicit assumptions. Keep it concise enough to review but detailed enough that another engineer can implement it without making design decisions.

来源：`packages/preset/agent-presets/presets/ptc/agent.cordis.yml:129`（基线 `528c682e…`）；plan/review 留在会话历史见 `packages/plan/plan-mode/README.md:170`。

## 上游小结

```text
Issue  = 要做什么，怎样算完成
Note   = 为什么这样做，放弃了什么
Plan   = 具体改哪里，怎么验证
```

它们共同把实现阶段的开放设计问题收窄到最小。

## 证据入口

- [`.github/ISSUE_TEMPLATE/feature.md`](../../.github/ISSUE_TEMPLATE/feature.md) 第 1-14 行
- [`.github/ISSUE_TEMPLATE/bug.md`](../../.github/ISSUE_TEMPLATE/bug.md)
- [`.github/ISSUE_TEMPLATE/task.md`](../../.github/ISSUE_TEMPLATE/task.md)
- [`.agents/notes/README.md`](../../.agents/notes/README.md) 第 46、80-90 行
- [`.github/issue-management/policy.mjs`](../../.github/issue-management/policy.mjs) 第 169、267 行
- [`docs/subsystems/plan.md`](../../docs/subsystems/plan.md) 第 5、33 行
- [`packages/plan/plan-mode/README.md`](../../packages/plan/plan-mode/README.md) 第 86、94 行
