# 实验合同与隔离：命名、发布、执行

> 「experimental 是一种合同状态，不是一个目录的装修风格」。本页拥有这份合同的**执法面**：命名与发布政策怎么强制、release 包与实验包怎么隔离、反向的「非实验包必须有产品用途」怎么查。三词分工与启用通道归 [`00-map.md`](./00-map.md)。

源码核验入口：[`scripts/experimental-package-policy.ts`](../../scripts/experimental-package-policy.ts)、[`packages/experimental/AGENTS.md`](../../packages/experimental/AGENTS.md)、[`scripts/check-workspace-constraints.ts`](../../scripts/check-workspace-constraints.ts)、[`scripts/verify-default-product-isolation.ts`](../../scripts/verify-default-product-isolation.ts)、[`scripts/verify-product-use.ts`](../../scripts/verify-product-use.ts)。

## 命名与发布政策

由 `scripts/experimental-package-policy.ts` 拥有：

- **默认前缀** `@deepseek-ai/dsh-experimental-`（`EXPERIMENTAL_PACKAGE_NAME_PREFIX`）。进组的包默认换前缀发布。
- **保留旧 npm 名例外** `EXPERIMENTAL_PACKAGE_NAME_EXCEPTIONS`：`cua`、`tool-session-query`、`session-title-all-prompts-llm`、`tool-terminal`、`tool-ralph`、`skill-badge`、`hook-protocol`、`hooks-claude-code`、`hooks-codex`、`webhook`、`webhook-github`——这些包在收编前已用旧名发布，改名会切断用户侧的升级路径。
- **private 名单** `PRIVATE_EXPERIMENTAL_PACKAGE_DIRECTORIES` 是**空数组**：全组 public、加入 dsh release 家族。「实验」不等于「不发布」。

## 隔离：release 包不得点名实验包

[`packages/experimental/AGENTS.md`](../../packages/experimental/AGENTS.md) 的规则：release 包和 apps 不得在 dependencies / optionalDependencies / peerDependencies 里点名实验包。执行面有三道：

1. **目录分工与依赖隔离**：[`scripts/check-workspace-constraints.ts`](../../scripts/check-workspace-constraints.ts) 中 `packages/(?!experimental/)` 定义 `standardReleaseMemberDirectory`（非实验发布目录），`isReleaseMemberDirectory` 将它与公开实验目录合并进 release 成员集合，并由 `checkExperimentalDependencyIsolation` 阻止非实验发布包及应用在依赖中点名任何实验包（仅豁免 CLI `@deepseek-ai/dsh` 在 `dependencies` 中列出 `OPTIONAL_BUNDLES`，`:603,609`）。
2. **默认组合隔离**：`scripts/verify-default-product-isolation.ts` 覆盖传递安装、运行时 import 与 shipped 组合——默认产品面不出现实验包。
3. **落点核验**：`packages/bundle/` 下的 shipped bundle 组合保持零挂载（启用通道只有 map 说的三条：显式组合、`OPTIONAL_BUNDLES`、纯实验 provider）。

## 反方向：非实验包必须有产品用途

`scripts/verify-product-use.ts` 从另一侧收口：**非实验**包要么被有效出货组合 / 预设子行 / 运行时 import 用到，要么在 [`scripts/product-package-policy.ts`](../../scripts/product-package-policy.ts) 里显式分类。「不用 experimental 就要证明有用」与「用了 experimental 就隔离」是同一枚硬币的两面——成熟度与出货彻底解耦（[`AGENTS.md`](../../AGENTS.md) 的 Package groups 说明）。

## 这套隔离不意味着什么

- 不意味着实验包质量要求低：工程、安全、文档、测试与已发布数据的义务一条不减（组 README 的 Experimental 定义）。
- 不意味着用户拿不到：全组 public 发布，`OPTIONAL_BUNDLES` 成员随安装出货。
- 不意味着永远隔离：promotion 把包迁回产品角色组并套用该组命名规则（引入记录见组 README 的 Promotion 段；毕业预判见 [`00-map.md`](./00-map.md) 的毕业路径表）。

## 源码入口

| 对象 | 源码位置 | 说明 |
|------|----------|------|
| 命名与公开白名单 | [`scripts/experimental-package-policy.ts`](../../scripts/experimental-package-policy.ts) | 前缀、`EXPERIMENTAL_PACKAGE_NAME_EXCEPTIONS` 与 private 名单 |
| 目录分类与依赖隔离 | [`scripts/check-workspace-constraints.ts`](../../scripts/check-workspace-constraints.ts) | `standardReleaseMemberDirectory`、`isReleaseMemberDirectory`、`checkExperimentalDependencyIsolation` |
| 默认产品组合隔离检查 | [`scripts/verify-default-product-isolation.ts`](../../scripts/verify-default-product-isolation.ts) | 阻止传递依赖、运行时 import 或 shipped bundle 误带入实验包 |
| 非实验包产品用途检查 | [`scripts/verify-product-use.ts`](../../scripts/verify-product-use.ts) | 要求非实验包具备出货路径或归入 [`scripts/product-package-policy.ts`](../../scripts/product-package-policy.ts) |
