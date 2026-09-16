# FAQ 01 · DSH 的目录为什么这样组织，应该怎样读？

## 问题

读完一部分 DeepSeek Harness 之后，仍然容易被仓库里数量很多的目录和 package 绕住：`core/`、`session/`、`apps/`、`bundle/`、`benchmarks/`、`host/`、`client/`、`vendor/` 各自在回答什么问题？为什么一个文件系统能力会拆成 `fs`、`fs-local`、`fs-sandbox`、`fs-observation-policy`、`tool-fs`，而不是放进一个大模块？从一个命令、工具或 UI 功能出发，应该沿哪条路径读到真正的实现和运行时组合？

这个问题表面在问磁盘目录，实际同时涉及三种结构：仓库目录树、package 依赖图、启动后的 Cordis 插件树。答案需要把三者分开，再解释它们如何连接。

## 回答目标

读完本 FAQ，应当能够：

1. 看懂仓库顶层目录分别属于框架、产品能力、应用装配、发布载体、文档工程还是研究覆盖层。
2. 根据 `packages/<group>/<pkg>/` 的名字，初步判断一个 package 是 Service Definition、Provider、Consumer、策略插件还是组合包。
3. 解释为什么“源码目录里存在”“package 依赖里存在”和“本次进程实际加载”是三件不同的事。
4. 从 `dsh web`、`dsh --profile headless`、不经 `dsh` 的桌面入口、`tool-fs` 或一个 Web UI 功能出发，找到入口、组合、合同、实现和测试。
5. 判断新增或修改一项行为应落在哪个目录，而不是习惯性修改 `agent-loop` 或某个大入口。

## 范围

源码核验基线为 DeepSeek Harness `dsh-v0.1.5-rc.1`，commit `183f08e9c6dde7e36cd2318eaee70b0da08fb35e`。本 FAQ 解释组织原则和阅读方法，不逐个复述所有 package；完整 package 表以 [`packages/README.md`](../../packages/README.md) 和生成的 [`docs/module-graph.md`](../../docs/module-graph.md) 为准。

`_digested/`、`_faq_on_digested/` 和 `_architecture_referenced/` 是 `ethan` 分支上的研究覆盖层，不属于产品 pnpm workspace，也不会进入 DSH 运行时。答案会把它们标出来，避免和产品本体混读。

## 阅读入口

- 先读：[目录设计总模型](./answer.md)
- 想理解“为什么同一个项目有三张结构图”：[`01-three-trees.md`](./01-three-trees.md)
- 想查顶层目录职责：[`02-top-level-zones.md`](./02-top-level-zones.md)
- 想看 `packages/` 为什么拆得这么细：[`03-package-role-grammar.md`](./03-package-role-grammar.md)
- 想从命令追到实际加载的插件：[`04-composition-and-entrypoints.md`](./04-composition-and-entrypoints.md)
- 想马上开始读代码：[`05-reading-routes.md`](./05-reading-routes.md)
