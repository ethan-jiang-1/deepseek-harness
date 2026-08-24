# Question 05 · DSH 跑起来之后，根入口文档是怎么被消费的？

## 背景

[`04_root-entry-doc-design`](../04_root-entry-doc-design/question.md) 回答了**静态一半**：DSH 怎么设计这张地图（读者分流、tier、预算、门禁）。但“地图画对了”不等于“模型真的走了对的路”——一张再好的地图，如果运行时没人把入口塞进模型上下文、模型读完入口不知道该用哪个工具去读下一份文档、上下文超了预算没人回收，按图索骥仍然落空。

本问题回答**动态一半**：DSH 一旦跑起来，根入口文档在运行时实际经历了什么。核心疑点是原 04 里那个被静态答案答非所问的子问题——“coding agent 会主动读 package README 吗？DSH 怎么保证它被读到、并且被维护？”

## 要回答的问题

1. 根 `AGENTS.md` 是怎么进入模型上下文的？是模型“主动读”，还是被运行时“注入”？
2. 模型第一次进入、以及触达更深目录时，运行时分别发生什么（baseline 与 touch-driven nested）？
3. 模型怎么按需走图？用哪些工具、什么时候拉取 package README 或 skill？
4. “按需”的“需”在运行时由谁、以什么预算决定？
5. Coding agent 会主动读 package README 吗？DSH 怎么保证它被读到、并且被维护？
6. 上下文超预算 / 长任务时怎么回收？
7. 运行时这套机制与静态设计（04）是什么关系？

## 证据边界

- 运行时机制引用 DSH 源码与子系统文档：`packages/context/agent-instructions/README.md`、`docs/subsystems/skills.md`、`docs/subsystems/compaction.md`、`docs/subsystems/token-meter.md`、`packages/fs/tool-fs/src/read.ts`、`packages/fs/tool-fs-search/src/{grep,glob}.ts`。
- 静态设计（tier、budget、one home）只引用 04 的结论，不重证。
- 当前源码基线：`0.1.1-rc.1`，commit `528c682e061696f5a160f363f236ecbf53cbd006`。

## 文件

- [`answer.md`](./answer.md)：一句话结论与总览
- [`01-runtime-injection.md`](./01-runtime-injection.md)：根 AGENTS 链怎么被注入（baseline + touch-driven）
- [`02-on-demand-navigation.md`](./02-on-demand-navigation.md)：模型怎么按需走图（read/grep/glob + skill + README）
- [`03-budget-and-guarantee.md`](./03-budget-and-guarantee.md)：运行时预算/回收，以及 README 怎么保证被读到/被维护
- [`research.md`](./research.md)：证据原文与行号
