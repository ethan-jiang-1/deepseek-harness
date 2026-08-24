# Agent-ready Development（面向 Agent 的开发体系）

Agent-ready Development 指一套让人类与 coding agent（编码代理）都能理解目标、找到权威知识、完成变更并取得可信反馈的开发体系。它不只关心“agent 能不能写代码”，还关心规格怎样约束实现、GitHub 怎样承载协作，以及仓库怎样降低新参与者理解和修改自身的难度。

本目录是一套可独立发行的学习与研究语料。它以 Spec-driven Development（SDD，规格驱动开发）和 GitHub Flow（GitHub 协作流）建立变更主线，再以 DeepSeek Harness（DSH）说明成熟的 Development Harness（开发 Harness）怎样把规则、知识、工具和反馈组织成可参与的环境。DSH 没有正式声明采用一套名为 SDD 的方法；这里借用 SDD 视角解释其可观察机制。

## 三条阅读路径

| 路径 | 适合谁 | 核心问题 |
|---|---|---|
| [Foundations（基础教程）](./foundations/README.md) | 尚未系统理解 SDD 或 GitHub Flow 的读者 | 一次普通变更怎样从意图走到合并？ |
| [Advanced SDD Flow（高级 SDD 流程）](./advanced-sdd-flow/README.md) | 已理解普通流程，需要核对精确条件、状态或例外的读者 | 复杂变更和远端协作机制具体怎样运作？ |
| [Development Harness（开发 Harness）](./development-harness/README.md) | 想理解仓库怎样帮助 coding agent 修改仓库自身的读者 | 规则、Skills、结构、检查和运行时查询怎样降低参与难度？ |

第一次接触本主题时，从 Foundations 开始。Advanced SDD Flow 的“高级”只相对于 Foundations 中的普通 SDD/GitHub 变更流：它不是整个 Agent-ready Development 的杂项高级区，也不包含 Development Harness。Development Harness 是另一条平级叙事，可以在 Foundations 之后阅读，也可以按兴趣单独进入。

三条路径共同回答一件事：

- SDD 管“变更应该成为什么”；
- GitHub Flow 管“变更怎样经过协作进入主分支”；
- Development Harness 管“参与者怎样看懂仓库、完成修改并获得反馈”。

## DSH 在这里扮演什么角色

正文会先用本目录内的文字和图解释概念，再把 DSH 固定版本中的源码、文档、`.agents/`、`.github/`、Skills、workflows 和 Agent Notes 作为一手证据。关键规则尽量以 Markdown blockquote 摘录，并说明它来自 DSH 的哪个部分以及能证明什么；读者不需要先理解 DSH 才能读懂主线。

本语料不引用 `_digested/` 或其它研究语料。目录外链接只指向固定 commit 的 DSH 内容，因此可以独立发行，同时保留回到原始证据的路径。

## 目录

| 路径 | 职责 |
|---|---|
| [`foundations/`](./foundations/README.md) | SDD 与 GitHub Flow 的顺序入门教程 |
| [`advanced-sdd-flow/`](./advanced-sdd-flow/README.md) | 高级 SDD/GitHub 变更流参考 |
| [`development-harness/`](./development-harness/README.md) | DSH Development Harness 专题 |
| [`_coverage/`](./_coverage/README.md) | 证据范围、结构约束与维护入口 |
| [`verify.mjs`](./verify.mjs) | 自包含的链接、文件和图示校验脚本 |

每个主题拥有自己的 `README.md`、`00-index.md` 和 `figures/`；图只服务所在主题的正文。

## 验证

修改本目录后运行：

```sh
node _agent_ready_development/verify.mjs
```

该命令检查严格 UTF-8、单个结尾换行、Markdown 相对链接和锚点、目录 README、固定 DSH 外链，以及 SVG 结构、归属和引用。语义准确性与来源范围由 [`_coverage/00-corpus-maintenance.md`](./_coverage/00-corpus-maintenance.md) 记录。
