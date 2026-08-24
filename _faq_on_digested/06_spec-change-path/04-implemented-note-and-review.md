# 04 · 下游：implemented Note、review、归档

## 1. proposed → implemented：从未来式改成现在式

实现 PR 落地时，proposed note 必须**在同一变更**移动并改写，不能原样留在原地：

> Moving a file between lifecycle folders means updating the `Status:` line and re-satisfying that folder's skeleton in the same change — the gate fails the move otherwise. Concretely, `proposed/` → `implemented/` rewrites `## Proposal` into a present-tense `## Decision`, folds `## Acceptance criteria` and `## Risks` into `## Consequences` ... and drops plans in favor of what shipped.

来源：`.agents/notes/README.md:121`

这是 DSH spec 流程最关键的一步：**提案不是冻结的规格书，交付后要改写成现在式决定。**

## 2. implemented note 记录交付后的决定

implemented note 的结构：

```text
## Problem
## Decision
## Alternatives considered
## Consequences
```

它描述 shipped reality，并持续跟随代码事实更新：

> When the code later moves a file, renames a package, or changes a key/default, the Agent Note is updated in the same change to match.

来源：`.agents/notes/README.md:13`

## 3. review 检查机器门禁之外的语义

`dsh-code-review` skill 要求 reviewer 验证：

- 实现是否符合 PR 和 Agent Note；
- 两侧接口；
- 生命周期、并发、清理；
- 模型实际看到的内容；
- 真实入口、负例与测试强度；
- 借出/派生状态与可重建的持久历史；
- 所需验证证据；
- proposed note 是否在同一 diff 中移动并改写为 implemented。

机器门禁守住可判定的结构；review 检查机器查不到的语义是否歪。

## 4. archive 是可选的生命周期收敛

只有低未来价值的 implemented note 才会归档（不是每次修改的必经阶段）：

- archived note 冻结，不做现行权威；
- 文档门禁跳过 archived；
- 归档有专门的 skill 和 gate。

这防止 spec 语料无限膨胀。

## 下游小结

```text
implemented Note（现在式决定）
  → review（语义兜底）
  → 持续随代码更新
  → 低价值时 archive / consolidate
```

对一次修改而言，前四步收束交付；archive 只在该 note 失去未来价值时发生。

## 证据入口

- [`.agents/notes/README.md`](../../.agents/notes/README.md) 第 13、42、121 行
- [`dsh-code-review`](../../.agents/skills/dsh-code-review/SKILL.md)
- [`dsh-archive-agent-notes`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md)
