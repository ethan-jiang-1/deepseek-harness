# 03 · 中游：实现、docs/types/README、tests/snapshots

## 1. 实现与合同同步

实现不是“先写代码”。DSH 要求代码和当前合同同一变更更新：

> A package's README and JSDoc are part of the change: altered behavior (config keys, defaults, error codes, wire fields) updates them in the same commit.

来源：`packages/AGENTS.md:25`

> The owning subsystems page updates in the same change that reshapes a documented type.

来源：`docs/AGENTS.md:45`

也就是说，`docs/`、package README、JSDoc 是在这里作为**结果**被写回。

## 2. docs 只写 now，不写过程

> **Document current state, not change history.** Avoid "previously/now/no longer", PRs, commits, and stack positions in durable prose; name the live mechanism.

来源：`docs/AGENTS.md:38`

所以 docs 更新时，写的是实现后的当前机制，不写“我们以前怎样，现在改成怎样”。

## 3. 生成目录由生成器刷新

tool-catalog、config-catalog、persistence-catalog、event-producer-consumer、module-graph、cordis API 都是从源码生成并 freshness-gated。

模型不需要手动维护这些穷举面；实现后运行生成器，再让 gate 检查没有 diff。

## 4. tests / snapshots 是行为 spec

`docs/testing.md` 把行为验收分成多层：

- 产品可见插件需要 REAL-composition test，不能只测手搭 `ctx.plugin(...)`；
- 模型/协议/人类可见变化必须更新 keyless snapshot；
- `verify the world, not the self-report`；
- 真实入口路径要测 built artifact 和真实 Loader 组合；
- guard 必须证明引入回归会红。

> Every non-trivial model-, protocol-, or human-visible change adds or updates a keyless scenario in the same PR through a runnable example's owning snapshot suite.

来源：`docs/testing.md:49`

## 中游小结

```text
实现
  → types / JSDoc
  → package README
  → architecture / subsystems
  → generated catalogs
  → tests / snapshots / invariants
```

`docs/` 在这里作为实现后的当前合同被写回。

## 证据入口

- [`packages/AGENTS.md`](../../packages/AGENTS.md) 第 25-27 行
- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 38、45 行
- [`docs/testing.md`](../../docs/testing.md) 第 27-49 行
- [`docs/tool-catalog.md`](../../docs/tool-catalog.md) 第 1-2 行
- [`docs/config-catalog.md`](../../docs/config-catalog.md) 第 1-2 行
