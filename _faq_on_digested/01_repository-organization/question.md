# FAQ 01 · DSH 的目录为什么这样组织，应该怎样读？

## 问题

读完一部分 DeepSeek Harness 之后，仍然容易被仓库里数量很多的目录和 package 绕住：`core/`、`session/`、`apps/`、`bundle/`、`benchmarks/`、`host/`、`client/`、`vendor/` 各自在回答什么问题？为什么一个文件系统能力会拆成 `fs`、`fs-local`、`fs-sandbox`、`fs-observation-policy`、`tool-fs`，而不是放进一个大模块？从一个命令、工具或 UI 功能出发，应该沿哪条路径读到真正的实现和运行时组合？

这个问题表面在问磁盘目录，实际同时涉及三种结构：仓库目录树、package 依赖图、启动后的 Cordis 插件树。要回答这个问题，需要把三者分开，再解释它们如何连接。

## 要回答的问题

要回答：

1. 顶层目录各属于哪类：框架、产品能力、应用装配、发布载体、文档工程还是研究覆盖层？
2. 根据 `packages/<group>/<pkg>/` 的名字，怎样初步判断它是 Service Definition、Provider、Consumer、策略插件还是组合包？
3. 源码目录里存在、package 依赖里存在、本次进程实际加载，三者是什么关系？
4. 从 `dsh web`、`dsh --profile headless`、桌面入口、`tool-fs` 或一个 Web UI 功能出发，怎样找到入口、组合、合同、实现和测试？
5. 新增或修改一项行为，应落在哪个目录，而不是习惯性修改 `agent-loop` 或某个大入口？

## 范围

核验状态见 [核验基线登记](../00-baseline.md)。本 FAQ 解释组织原则和阅读方法，不逐个复述所有 package；完整 package 表以 [`packages/README.md`](../../packages/README.md) 和生成的 [`docs/module-graph.md`](../../docs/module-graph.md) 为准。

`_digested/` 和 `_faq_on_digested/` 是 `ethan` 分支上的研究覆盖层，不属于产品 pnpm workspace，也不会进入 DSH 运行时。正文会把它们标出来，避免和产品本体混读。

## 阅读入口

- 先读：[目录设计总模型](./answer.md)
- 想理解“为什么同一个项目有三张结构图”：[`01-three-trees.md`](./01-three-trees.md)
- 想查顶层目录职责：[`02-top-level-zones.md`](./02-top-level-zones.md)
- 想看 `packages/` 为什么拆得这么细：[`03-package-role-grammar.md`](./03-package-role-grammar.md)
- 想从命令追到实际加载的插件：[`04-composition-and-entrypoints.md`](./04-composition-and-entrypoints.md)
- 想马上开始读代码：[`05-reading-routes.md`](./05-reading-routes.md)
