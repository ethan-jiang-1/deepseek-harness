# 01 · `docs/` 是当前合同层，不是 SDD 源头

## 规则本身禁止 docs 写变更史

`docs/AGENTS.md` 对 durable prose 的规则是：

> **Document current state, not change history.** Avoid "previously/now/no longer", PRs, commits, and stack positions in durable prose; name the live mechanism. Put change stories in commits, PRs, Agent Notes, or postmortems.

来源：`docs/AGENTS.md:38`

这条规则直接排除了“docs 是 SDD 源头”的读法：docs 里不应出现提案、计划和迁移史，它只应该描述当前机制。

## docs 的分层也证明它是合同层

`docs/AGENTS.md` 的 tier taxonomy 明确：

- `architecture.md`：有序地图，read before changing `packages/`；
- subsystems：类型定义、语义、生成 API；
- Agent Notes：why、放弃什么、验证；
- cookbook：step-by-step how-to；
- Package README：该包合同。

也就是说，docs 体系里没有一层叫“变更 spec”。变更 spec 住在上游：Issue、proposed Agent Note、Plan。

## 但 docs 是修改时必须同步的“投影”

`docs/` 不是源头，不等于它不重要。相反，DSH 要求**代码和 docs 同步修改**：

> The owning subsystems page updates in the same change that reshapes a documented type.

来源：`docs/AGENTS.md:45`

> A package's README and JSDoc are part of the change: altered behavior (config keys, defaults, error codes, wire fields) updates them in the same commit.

来源：`packages/AGENTS.md:25`

这意味着：

```text
实现后的当前状态
  → 写回 architecture / subsystems / package README / JSDoc / generated catalogs
  → 由 doc-sync、verify-type-equiv、verify-md-links、budget gates 检查
```

所以更准确的说法是：

> `docs/` 是修改的“当前合同投影”。它不是 SDD 源头，而是 SDD 每个周期必须更新和校验的目标面。

## 证据入口

- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 38、45 行
- [`packages/AGENTS.md`](../../packages/AGENTS.md) 第 25 行
- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 15-33 行：tier taxonomy
