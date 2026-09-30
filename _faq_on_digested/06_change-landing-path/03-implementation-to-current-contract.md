# 03 · 中游：实现、docs/types/README、tests/snapshots

## 1. 实现与合同同步

实现不是“先写代码”。DSH 要求代码和当前合同同一变更更新：

> Update package README and JSDoc contracts in the same commit as behavior, and verify them against code with dsh-prose-standard.

来源：`packages/AGENTS.md:26`

> The owning subsystems page updates in the same change that reshapes a documented type.

来源：`docs/AGENTS.md:43`

也就是说，`docs/`、package README、JSDoc 是在这里作为**结果**被写回。

## 2. docs 只写 now，不写过程

> **Document current state.** Name live mechanisms, not PRs, commits, stack positions, or "previously/now/no longer".

来源：`docs/AGENTS.md:38`

所以 docs 更新时，写的是实现后的当前机制，不写“我们以前怎样，现在改成怎样”。

## 3. 生成目录由生成器刷新

tool-catalog、config-catalog、persistence-catalog、event-producer-consumer、module-graph、cordis API 都是从源码生成并 freshness-gated。

模型不需要手动维护这些穷举面；实现后运行生成器，再让 gate 检查没有 diff。

## 4. tests / snapshots 是行为证据

`docs/testing.md` 把行为验收分成多层：

- 产品可见插件需要 REAL-composition test，不能只测手搭 `ctx.plugin(...)`；
- 模型/协议/人类可见变化必须更新 keyless snapshot；
- `verify the world, not the self-report`；
- 真实入口路径要测 built artifact 和真实 Loader 组合；
- guard 必须证明引入回归会红。

> Every non-trivial model-, protocol-, or human-visible change adds or updates a keyless recorded-session scenario in the same PR.

来源：`docs/testing.md:55`

## 中游小结

```text
实现（源码行为）
  + types / JSDoc
  + package README
  + architecture / subsystems
  + generated catalogs
  + tests / snapshots / invariants
```

这些都是同一变更的多个面，不是依次补交的多个 PR。`docs/` 在这里作为实现后的当前合同被写回。

## 证据入口

- [`packages/AGENTS.md`](../../packages/AGENTS.md) 第 26-28 行
- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 39、43 行
- [`docs/testing.md`](../../docs/testing.md) 第 27-55 行
- [`docs/tool-catalog.md`](../../docs/tool-catalog.md) 第 1-2 行
- [`docs/config-catalog.md`](../../docs/config-catalog.md) 第 1-2 行
