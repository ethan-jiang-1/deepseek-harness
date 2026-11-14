# 04 · 下游：implemented Note、review、归档

## 1. proposed → implemented：从未来式改成现在式

实现 PR 落地时，proposed note 必须**在同一变更**移动并改写，不能原样留在原地：

> Moving a file between lifecycle folders means updating the `Status:` line and re-satisfying that folder's skeleton in the same change — the gate fails the move otherwise. Concretely, `proposed/` → `implemented/` rewrites `## Proposal` into a present-tense `## Decision`, folds `## Acceptance criteria` and `## Risks` into `## Consequences` ... and drops plans in favor of what shipped.

来源：`.agents/notes/README.md:121`

这是 DSH 决策记录流程最关键的一步：**提案不是冻结的规格书，交付后要改写成现在式决定。**

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

这防止决策记录语料无限膨胀。

## 下游小结

```text
implemented Note（现在式决定）
  → review（语义兜底）
  → 持续随代码更新
  → 低价值时 archive / consolidate
```

对一次修改而言，前四步收束交付；archive 只在该 note 失去未来价值时发生。

## 证据入口

- [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md) 第 13、42、121 行
- [`dsh-code-review`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-code-review/SKILL.md)
- [`dsh-archive-agent-notes`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-archive-agent-notes/SKILL.md)

## 5. GitHub checks、review 与 merge

到终点前要分清三种判断，谁也不能替代谁：

| 判断 | 主要回答 | 不能替代 |
|---|---|---|
| automated checks | 类型、格式、测试、构建和平台结果是否满足规则 | 意图和设计是否正确 |
| semantic review | 实现、文档和证据是否真的符合任务意图、适用的 Issue 与 Agent Note | 实际运行检查或用户决定 |
| explicit user interaction | Plan 是否批准、受限操作是否授权、交互问题是否回答 | 代码质量与 CI 结果 |

Semantic review 可以由具备上下文的人或 agent 执行；`.github` 的 human-review policy 约束人类作者 PR 的 metadata 适用范围，不规定 reviewer 必须是人。

PR 创建后，模板、workflow 与 policy 接管远端协作：Motivation 引用同仓库 Issue，Changes 分开写命令/配置/API/协议与可观察行为，Testing 把每种证据放进对应的 Proof 折叠区。CI 的检查逻辑在 `scripts/run-gates.ts` 等仓库代码里，workflow 只管何时跑、在哪跑、怎么汇总；`all-checks-passed` 聚合必需 job 后才允许 merge。完整形态见 [08](./08-github-flow.md)。

新的 push 会更新 PR head，旧的 review 结论和 checks 可能失效；合并前要重新读当前 diff、未解决线程和 checks。Merge 只改变分支和 PR 状态，不会自动改变 Agent Note 生命周期；合并后，fresh agent 仍要能从源码/README、owning Note 与 tests/snapshots 回答“现在是什么、为什么这样决定、什么固定住它”。
