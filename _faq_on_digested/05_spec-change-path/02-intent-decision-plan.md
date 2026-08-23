# 02 · 上游：Issue、proposed Note、Plan

## 1. Issue 先固定可观察结果

Feature issue 模板：

> - 验收条件：
> - 用户或模型可见变化：
> - 测试证据：

来源：`.github/ISSUE_TEMPLATE/feature.md:16-18`

Bug 模板要求复现、实际、预期、环境、验收。Task 模板要求验收条件、交付物、测试证据。

这一层刻意不先规定内部类名或函数列表。它先固定**外部结果和完成标准**，让后续设计可以变化，但不能丢掉最初要解决的问题。

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

## 3. Plan Mode 固定实施计划

Plan Mode 把“边写边设计”压缩掉：

- 先只读探索；
- 计划必须完整到另一位工程师无需再做设计决定即可实现；
- 覆盖目标、成功标准、子系统修改、公开 API/schema/数据流、边界和失败模式、测试、验收条件、显式假设；
- `exit_plan_mode` 提交计划给用户审批，审批后才退出计划态。

这层的 spec 不是 prose 文档，而是**计划 + 审批边界 + 会话日志记录**。

> Make the plan decision-complete: state the goal and success criteria; group implementation changes by subsystem; identify public API, schema, and data-flow changes; cover edge cases, failure modes, tests, acceptance criteria, and explicit assumptions. Keep it concise enough to review but detailed enough that another engineer can implement it without making design decisions.

来源：`apps/cli/config/agent-presets/code/agent.cordis.yml:129`（基线 `528c682e…`）

## 上游小结

```text
Issue  = 要做什么，怎样算完成
Note   = 为什么这样做，放弃了什么
Plan   = 具体改哪里，怎么验证
```

它们共同把实现阶段的开放设计问题收窄到最小。

## 证据入口

- [`.github/ISSUE_TEMPLATE/feature.md`](../../.github/ISSUE_TEMPLATE/feature.md) 第 16-18 行
- [`.github/ISSUE_TEMPLATE/bug.md`](../../.github/ISSUE_TEMPLATE/bug.md)
- [`.github/ISSUE_TEMPLATE/task.md`](../../.github/ISSUE_TEMPLATE/task.md)
- [`.agents/notes/README.md`](../../.agents/notes/README.md) 第 46、80-90 行
