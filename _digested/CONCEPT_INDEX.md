# Concept Index · DSH 核心概念词典

这份索引强制约束关键术语（特别是那些容易引发“架构歧义”的术语）的定义归属地。所有跨专题对这些概念的引用，必须以此处的“引入家”为准。

| 概念 | 归属专题（引入家） | 核心定义要点 |
|---|---|---|
| Seam | capability-seams | 三角色（Definition, Provider, Consumer）齐全的可替换能力 |
| Core Service | system-overview | 连 `ctx.<key>` 都不设的进程级库，或无替代实现的单例服务 |
| Plugin Tree | plugin-system | 由一系列插件组成、通过 `ctx` 协作的运行时结构 |
| Isolate Realm | two-tree-runtime | 插件的独立隔离运行域，同一 key 在此范围内单例 |
| Fiber | two-tree-runtime | 定义插件生命周期与状态机的基础单元 |
| Patch/Bundle | plugin-system/composition | 层叠与配置计算的原子单位 |

*注：本索引由 `verify.mjs` 监控，禁止在未登记的情况下在 `_digested/` 全局范围内引入新的承重概念。*
