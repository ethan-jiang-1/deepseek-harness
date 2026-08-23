# Answer · `docs/` 不是 SDD 源头，它是“当前合同层”

## 一句话答案

DSH 没有把 `docs/` 当作 Spec Driven Development 的源头。

`docs/` 是 spec 链路里的**当前合同层**：它回答“系统现在是什么”。真正的修改 spec 从 Issue 模板和 Agent Note 开始，经过 Plan、代码、类型、README、测试与快照，最后又回到 `docs/` 与 Agent Note 的“现在式改写”。

## 一次修改的 spec 链路

| 阶段 | 载体 | 回答 |
|---|---|---|
| 意图与验收 | `.github/ISSUE_TEMPLATE/*.md` | 要改变什么可观察结果，怎样算完成 |
| 设计决策 | `proposed/` Agent Note | 为什么这样设计，什么方案输了，风险是什么 |
| 实施计划 | Plan Mode / plan review | 改哪些子系统、API、schema、失败路径、测试 |
| 实现与当前合同 | 代码、types、JSDoc、README、`docs/` | 现在必须遵守什么 |
| 行为规格 | tests、keyless snapshots、real composition、invariants | 真实入口和外部可见行为是否满足 |
| 交付后的决定 | `implemented/` Agent Note | 实际交付了什么，代价是什么 |
| 语义兜底 | `dsh-code-review`、`dsh-prose-standard` | 机器门禁查不到的语义是否正确 |

## 为什么 `docs/` 看起来像源头

因为 `docs/` 是模型最容易看到、也最常被引用的“系统真相”。但 DSH 的规则明确说：

> **Document current state, not change history.**

来源：`docs/AGENTS.md:38`

也就是说，`docs/` 被设计成**不承载变更过程**。变更理由在 Agent Notes，变更历史在 git，当前状态才在 `docs/`。

## 真正的“源头”在哪里

更准确地说，DSH 没有一个单文件源头。它有多个“规格面”，每个面拥有一种事实：

- 意图：Issue；
- 选择：proposed Agent Note；
- 计划：Plan Mode；
- 当前合同：`docs/` + types + JSDoc + package README；
- 行为：tests / snapshots / invariants；
- 交付决定：implemented Agent Note；
- 语义判定：skills + review。

这正好和 `04_root-entry-documentation` 的“一个事实一个家”接上了：**修改的每个阶段也有一个家，不能都塞进 `docs/`。**

## 最关键的机制

DSH 的 spec 流程最独特的地方，不是“先写文档再写代码”，而是：

1. **proposed 是未来式，implemented 必须改写成现在式。**
2. **代码、docs、README、JSDoc 必须同 PR 更新。**
3. **测试和快照是行为 spec，不只是验证。**
4. **门禁把“当前合同”和源码锁在一起。**

所以 `docs/` 是这条链的**投影终点**，不是源头。

## 继续阅读

- [`01-docs-is-current-contract.md`](./01-docs-is-current-contract.md)
- [`02-spec-layers.md`](./02-spec-layers.md)
- [`03-change-lifecycle.md`](./03-change-lifecycle.md)
- [`04-example-web-capability-seam.md`](./04-example-web-capability-seam.md)
- [`research.md`](./research.md)
