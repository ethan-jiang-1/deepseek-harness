# 02 · 一次修改的 spec 分层

## 六层规格

DSH 没有单文件 spec，但有六个规格面。每层都有明确的 home 和检查方式。

| 层 | 主要载体 | 回答的问题 | 约束方式 |
|---|---|---|---|
| 意图规格 | `.github/ISSUE_TEMPLATE/feature.md` 等 | 要改变什么可观察结果，怎样算完成 | Issue 模板要求验收条件、可见变化、测试证据 |
| 决策规格 | `proposed/` Agent Note | 为什么这样设计，什么方案输了，接受什么风险 | `Problem / Proposal / Alternatives / Acceptance criteria / Risks` 固定结构 |
| 实施规格 | Plan Mode | 改哪些子系统、API、schema、数据流、失败路径、测试 | plan review，要求完整到另一工程师可直接实现 |
| 当前合同 | types、JSDoc、README、`docs/` | 现在必须遵守什么 | TypeScript、generated catalogs、README/JSDoc/docs gates |
| 行为规格 | tests、keyless snapshots、real composition、invariants | 真实入口和外部可见行为是否符合 | test matrix、coverage、snapshot diff、invariant |
| 工程规则 | `AGENTS.md`、skills、CI | 任何变更都不能破坏的仓库约束 | gates、review、semantic skills |

## Issue 模板是最早的“意图 spec”

Feature issue 模板要求：

> - 验收条件：
> - 用户或模型可见变化：
> - 测试证据：

来源：`.github/ISSUE_TEMPLATE/feature.md:16-18`

Bug issue 模板要求复现、实际结果、预期结果、环境、验收条件。

PR 模板要求关联 Issue，并给出变更与验证：

> 关联 Issue：
>
> 变更与验证

来源：`.github/pull_request_template.md:5-10`

## proposed Agent Note 是“决策 spec”

`.agents/notes/README.md` 规定 proposed 的结构：

- `## Problem`
- `## Proposal`
- `## Alternatives considered`
- `## Acceptance criteria`
- `## Risks`

且每个非平凡改动必须新增或更新 Agent Note：

> Every non-trivial change MUST add or update at least one Agent Note in the same PR.

来源：`.agents/notes/README.md:46`

## Plan Mode 是“实施 spec”

DSH 的 Plan Mode 要求：

- 先只读探索；
- 完整计划包含目标、子系统修改、公开 API/schema/数据流、失败路径、测试、验收条件、显式假设；
- `exit_plan_mode` 提交计划给用户审批；
- 计划写入 session log，可恢复。

这一层把“实现阶段还要做设计决策”压缩到最低。

## 当前合同层是 `docs/` + types + README

`docs/` 在这里，不在更早。实现后必须把“现在是什么”写回：

- architecture / subsystems；
- package README；
- JSDoc；
- 生成目录由生成器刷新。

## 行为规格是测试和快照

`docs/testing.md` 的关键规则：

- 产品可见插件需要 REAL-composition test；
- 模型/协议/人类可见变化需要 keyless snapshot；
- `verify the world, not the self-report`；
- 每个包有 `./invariant`。

行为 spec 不写在 prose 里，而是直接以可执行断言存在。

## 工程规则是最后一条横切 spec

根 `AGENTS.md` 的 standing orders、`packages/AGENTS.md`、`docs/AGENTS.md`、skills 和 CI，规定任何修改都不能破坏的横切约束。

## 证据入口

- [`.github/ISSUE_TEMPLATE/feature.md`](../../.github/ISSUE_TEMPLATE/feature.md) 第 16-18 行
- [`.github/pull_request_template.md`](../../.github/pull_request_template.md) 第 5-10 行
- [`.agents/notes/README.md`](../../.agents/notes/README.md) 第 46、80-103 行
- [`docs/testing.md`](../../docs/testing.md) 第 27-49 行
- [`AGENTS.md`](../../AGENTS.md) 第 99 行起
