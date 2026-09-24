# 06 · 运行时查询（不靠猜源码）

> **状态：动态主导** —— 核心是「问活运行时」，不靠猜源码；对照面「声明面」（生成 catalog）是静态的，属 04 的 L4 穷举索引（见 [`04_root-entry-doc-design/02-tier-routing-and-indexes.md`](../04_root-entry-doc-design/02-tier-routing-and-indexes.md)）。

## 源码只能说明可能性

静态 import 和目录树能说明仓库**可能**提供哪些能力，却不能回答某台机器、某个 profile、某个 session **实际**加载了什么。「糊涂」的一个隐蔽来源，就是 agent 拿着源码结构去猜部署结果，然后按猜错的结果行动。

DSH 的对策是 inspectability（可检查性）：提供查询入口，让 agent 用当前状态验证假设。这条的可迁移性中等——完整版需要工程投入，但「至少提供一条查实际状态的命令」几乎每个项目都做得到。

## 三个查询面，回答三个不同问题

| 查询 | 回答 | 手段 |
|---|---|---|
| 最终配置树是什么 | profile / bundle / patch 叠加后，这台机器实际 boot 什么 | `dsh --profile web --dump-config` |
| 仓库声明了什么静态接口与注册项 | tool schema、config 字段、event dispatch mode、service signature | 生成的 tool/config/persistence/event/capability catalog |
| 当前进程里实际有什么 | 哪个 provider、service、tool 正在生效 | `cordis_inspect_list` / `cordis_inspect_query`（0.1.7 线起只有这两个只读工具，`cordis_inspect_self` 已随 #4745 收缩退役） |

三者的关键区别必须守住：**catalog 回答「仓库声明了什么」，不是「当前进程正运行什么」**；实际 provider 与 Fiber 状态要问活运行时。DSH 用 freshness gate 保证生成目录与源码无 diff，所以「声明面」是可信的索引，而不是一张可能漂移的手写清单。

## 可查询让「脑补」失去市场

这三个查询面合起来，消灭了 agent 最危险的一类猜测：把「源码里出现过的插件」当成「这台机器装了的插件」，或把「某个配置项出现在示例里」当成「当前生效值」。当 agent 可以**问**而不是**猜**，它就更难「乱发挥」。

## 可迁移要点（按成本排序）

1. **低成本**：给一条命令 dump 最终生效配置（等价于 `--dump-config`）。普通项目用 `config dump`、`env` 输出或一个 `make show-config` 即可。
2. **中成本**：把「声明面」做成可搜索索引（tool/config/接口清单），并加 freshness 检查防止漂移。
3. **高成本**：像 `tool-cordis` 那样暴露运行时的只读 inspect 工具——只有确有多 profile/provider/动态装卸压力时才值得，普通项目可跳过。

## 边界提醒

运行时查询 ≠ 安全沙箱。`tool-cordis` 的 Host 定义在 vm realm 里求值，但 vm 只防意外全局污染，注入的服务仍有真实权限（两只读工具本身 opt-in、不做变更；持久安装走 `plugin_manager`）：

> The vm prevents accidental global pollution; injected filesystem, shell, and network services still have real authority, so it is not a security boundary.

所以「可查询/可试验」不代表「不需要授权」，也不代表外部副作用能回滚。迁移时别把「给 agent 一个 inspect 工具」当成「给了它一个沙箱」。

## 证据入口

- [`../../_agent_ready_development/repo-harness/06-runtime-inspection.md`](../../_agent_ready_development/repo-harness/06-runtime-inspection.md)：三个查询面、catalog 与活运行时的区别、tool-cordis 的 trust stance。
- [`../../_digested/harness-idea/05-dynamic-legibility.md`](../../_digested/harness-idea/05-dynamic-legibility.md)：dsh 不只可读、还可查询可试验。
- [`../../docs/architecture.md`](../../docs/architecture.md)：ordered config layers 与 `--dump-config`。
- [`../../docs/tool-catalog.md`](../../docs/tool-catalog.md)：从源码生成的工具 schema 与 opt-in 说明。
- [`../../docs/capability-seams.md`](../../docs/capability-seams.md)：生成的 Service Definition / Provider / Consumer 关系索引。
