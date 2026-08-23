# Answer · DSH 修改系统时，spec 从意图一路走到当前合同

## 一句话答案

DSH 的 spec 不是一份文档，而是一条**从意图到当前合同、再到交付决定和 review** 的路径：

```text
Issue 模板（意图/验收）
  → proposed Agent Note（决策 spec）
  → Plan Mode（实施 spec）
  → implementation（实现）
  → docs / types / JSDoc / package README（当前合同）
  → tests / snapshots / invariants（行为 spec）
  → implemented Agent Note（交付后的决定）
  → review / archive（语义兜底与生命周期收敛）
```

`docs/` 在这条路径里是**当前合同层**。

## 完整路径的阶段

| 阶段 | 主要载体 | 回答 |
|---|---|---|
| 意图与验收 | `.github/ISSUE_TEMPLATE/feature.md` 等 | 要改变什么可观察结果，怎样算完成 |
| 决策 | `proposed/` Agent Note | 为什么这样设计，什么方案输了，风险是什么 |
| 计划 | Plan Mode | 改哪些子系统、API、schema、失败路径、测试 |
| 实现 | `packages/`、`vendor/`、`python/` 等源码 | 实际改变行为 |
| 当前合同 | `docs/`、types、JSDoc、package README | 系统现在是什么 |
| 行为规格 | tests、snapshots、real composition、invariants | 行为是否真的成立 |
| 交付决定 | `implemented/` Agent Note | 最终交付了什么，代价是什么 |
| 语义兜底 | `dsh-code-review`、prose skills | 机器查不到的语义是否正确 |

## `docs/` 在路径中的位置

DSH 的文档规则明确：

> **Document current state, not change history.**

来源：`docs/AGENTS.md:38`

`docs/` 被设计成**只写 now**。变更理由在 Agent Notes，变更过程在 git/PR，最终留下的当前状态才写进 docs。

所以：

```text
proposed Note（未来式）
  → 实现 + 测试
  → docs/types/README（现在式合同）
  → implemented Note（现在式决定）
```

`docs/` 是这条链落地的当前合同投影。

## 最关键的机制

1. **Issue 先固定外部可观察结果**；
2. **重大工作先写 proposed Note**；
3. **Plan Mode 把提案细化到可实现**；
4. **实现同时更新代码、docs、README、JSDoc**；
5. **测试和快照作为行为 spec**；
6. **proposed → implemented 必须改写时态**；
7. **review 检查机器门禁之外的语义**。

## 真实例子

Web capability seam 能看到完整的两步历史：

```text
a4091daa3d docs: propose web capability seam
  → docs/rfc/proposed/architecture/2026-06-24-web-capability-seam.md

d01f5f73b7 Add web capability seam: ctx.web, search/fetch providers, web tools
  → docs/rfc/implemented/architecture/2026-06-24-web-capability-seam.md
  → docs/architecture.md
  → packages/README.md
  → packages/web/** + tests/**
```

详细见 [`05-example-web-capability-seam.md`](./05-example-web-capability-seam.md)。

## 继续阅读

- [`01-spec-path-overview.md`](./01-spec-path-overview.md)
- [`02-intent-decision-plan.md`](./02-intent-decision-plan.md)
- [`03-implementation-to-current-contract.md`](./03-implementation-to-current-contract.md)
- [`04-implemented-note-and-review.md`](./04-implemented-note-and-review.md)
- [`05-example-web-capability-seam.md`](./05-example-web-capability-seam.md)
- [`06-human-and-agent-roles.md`](./06-human-and-agent-roles.md)
- [`research.md`](./research.md)
