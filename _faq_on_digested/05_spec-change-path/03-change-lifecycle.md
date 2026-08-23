# 03 · 从 Issue 到 review 的完整生命周期

## 你问的那条链

```text
Issue → proposed Note → Plan → implementation → docs/types/README
      → tests/snapshots → implemented Note → review
```

DSH 不是每步都强制，也不是每次改动都完整走完。但这条链的主干有明确规则。

## 1. Issue 固定可观察结果

Feature issue 要求：

- 一句话预期结果；
- 验收条件；
- 用户或模型可见变化；
- 测试证据。

来源：`.github/ISSUE_TEMPLATE/feature.md:16-18`

## 2. 重大未来工作先写 proposed Note

`.agents/notes/README.md` 规定：

> A proposal for substantial future work starts in `proposed/`; a decision already made starts in `implemented/`.

来源：`.agents/notes/README.md:46`

proposed 的骨架：

```text
## Problem
## Proposal
## Alternatives considered
## Acceptance criteria
## Risks
```

## 3. Plan Mode 把提案细化成可执行计划

Plan Mode 要求计划完整到另一位工程师无需再做设计决定即可实现，并通过 `exit_plan_mode` 交用户审批。

## 4. implementation 同步更新当前合同

实现代码时，必须同 PR 更新：

- 类型与 JSDoc；
- package README；
- architecture / subsystems；
- 生成目录；
- 双 SDK 投影，如果碰 loop / session。

## 5. tests / snapshots 是行为验收

`docs/testing.md` 要求：

- 产品可见插件走真实 Loader 组合；
- 模型/协议/人类可见变化更新 keyless snapshot；
- e2e 验证外部世界，而不是 agent 的自报。

## 6. proposed → implemented 必须改写时态

Agent Note 跨生命周期移动时：

> `proposed/` → `implemented/` rewrites `## Proposal` into a present-tense `## Decision`, folds `## Acceptance criteria` and `## Risks` into `## Consequences` ... and drops plans in favor of what shipped.

来源：`.agents/notes/README.md:121`

这是 DSH SDD 最独特的一步：**提案不是冻结文档，交付后必须改写成现在式事实。**

## 7. review 是语义兜底

`dsh-code-review` skill 要求 reviewer 验证实现是否符合 PR 和 Agent Note，检查：

- 两侧接口；
- 模型实际看到的内容；
- 真实入口与负例；
- 持久状态；
- 所需验证证据。

当 PR 实现 proposed Agent Note 时，review 还要确认它在同一 diff 中移动并改写为 implemented。

## 什么情况下可以旁路

- 已经做出的决定可以直接从 `implemented/` Agent Note 开始；
- 纯机械或局部改动豁免 Agent Note；
- 小改动可能不需要 Plan Mode。

所以这条链是**默认主干 + 合法旁路**，不是流水线铁律。

## 证据入口

- [`.github/ISSUE_TEMPLATE/feature.md`](../../.github/ISSUE_TEMPLATE/feature.md)
- [`.agents/notes/README.md`](../../.agents/notes/README.md) 第 46、80-121 行
- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 39 行
- [`docs/testing.md`](../../docs/testing.md) 第 27-49 行
- [`dsh-code-review`](../../.agents/skills/dsh-code-review/SKILL.md)
