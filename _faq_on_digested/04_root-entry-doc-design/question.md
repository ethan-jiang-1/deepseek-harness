# Question 04 · DSH 根入口文档的静态设计：这张地图是怎么画出来的？

## 背景

一个 coding agent 第一次进入仓库，最先接触的通常不是代码，而是根目录的 `README.md`、`AGENTS.md` / `CLAUDE.md`，以及它们链接出去的文档。很多仓库在这里出现两类失败：

- **入口太厚**：README 和 AGENTS 试图讲完一切，模型读不完，或者读完仍抓不住主线；
- **入口太薄**：入口只是礼貌性概述，真正能用的地图散落在 wiki、issue、代码注释和人脑里。

流行解法叫“渐进式披露”（progressive disclosure），但它的难点在于**度量**：披露多少算合适？顺序怎样算对？对一个模型而言，“读懂”本身又很难直接观测。

本问题只回答**静态一半**：DSH 作为框架，是怎么**设计**根入口文档与文档组织的——地图是怎么画出来的、为什么这么画、怎么保证地图不坏。跑起来之后这些文档**怎么被消费**（谁注入、模型怎么走、超预算怎么办），是另一个问题，见 [`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/question.md)。也不重复 `_digested/harness-idea/` 里关于 harness 参与机制的全部判断。

## 要回答的问题

1. 根 `README.md`、根 `AGENTS.md`、`CLAUDE.md` 各自扮演什么角色？
2. DSH 的根入口到 `docs/architecture.md`、`docs/AGENTS.md`、生成目录、package README 之间形成了怎样的导航结构？
3. 这套组织在**结构上**保证了什么，使模型第一次进入时至少能按图索骥？
4. DSH 为什么能处理“渐进式披露难以度量”的问题？它度量的是什么？
5. 大多数 package 没有自己的 `AGENTS.md`，只有 `README.md`；静态层的分工里，给 coding agent 看的到底是什么？
6. 有哪些独特且可迁移的设计判断？

## 证据边界

- 结论只引用 DSH 官方文件：根 `README.md`、根 `AGENTS.md`、`docs/AGENTS.md`、`docs/architecture.md`、生成目录、package README、`docs/development.md` 等。
- 运行时的加载/导航机制（`dsh-agent-instructions`、skill catalog、token meter 等）不属于本问题，归 [`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/question.md)。
- `_digested/harness-idea/` 只作为已有消化视角，不作为原始证据。
- 当前源码基线：`dsh-v0.1.2-rc.1`，commit `a66e4702047846cdaa10c66c9d3df3951f5ea70d`。

## 文件

- [`answer.md`](./answer.md)：一句话结论与总览
- [`01-root-split-and-map.md`](./01-root-split-and-map.md)：根入口的读者分流与地图
- [`02-tier-routing-and-indexes.md`](./02-tier-routing-and-indexes.md)：一层事实一个家，以及生成索引
- [`03-progressive-disclosure-as-cache.md`](./03-progressive-disclosure-as-cache.md)：为什么渐进式披露难，DSH 怎么把它变成缓存层次和门禁
- [`04-unique-and-transferable.md`](./04-unique-and-transferable.md)：独特设计判断与可迁移原则
- [`research.md`](./research.md)：证据原文与行号
