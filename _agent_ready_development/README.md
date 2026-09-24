# Agent-ready Development（面向 Agent 的开发体系）

Agent-ready Development 指一套让人类与 coding agent（编码代理）都能理解目标、找到权威知识、完成变更并取得可信反馈的开发体系。它不只关心“agent 能不能写代码”，还关心规格怎样约束实现、GitHub 怎样承载协作，以及仓库怎样降低新参与者理解和修改自身的难度。

本目录是一套可独立发行的学习与研究语料。它以 Spec-driven Development（SDD，规格驱动开发）和 GitHub Flow（GitHub 协作流）建立变更主线，再以 DeepSeek Harness（DSH）说明成熟的 Development Harness（开发 Harness）怎样把规则、知识、工具和反馈组织成可参与的环境。DSH 没有正式声明采用一套名为 SDD 的方法；这里借用 SDD 视角解释其可观察机制。

## 宗旨：为什么选 DSH 的开发体系做研究对象

第一个理由：DSH 本身就是一个 coding-agent harness——它把模型、工具、会话和交互组合成可运行的 agent——而且是同类中做得足够好的一个。规则外置成 `AGENTS.md`、可机械判断的规则接成会失败的 gate、按需加载的任务知识、逐层的执行反馈，这些特征都能在仓库里逐条核对。一个被真实开发实践长期使用过的样板，比任何理想化的方法论描述都值得拆开学；本语料把它当作榜样来解剖，而不是当作教条来转述。

第二个理由：它是自举的。DSH 用本目录所描述的这套流程、规则和工具开发 DSH 自己——研究对象与研究方法是同一个东西。这意味着这里挖出的每条机制都在开发 DSH 的过程中被真实使用过，git 历史、CI 记录、Agent Notes 和发布产物可以互相印证；"这套体系是否真的可运行"因此有持续的证据，而不是一份没人执行过的倡议书。

第三个理由：它的复杂度与产物的性质放大了整理的价值。DSH 不仅能开发传统程序，也能开发智能体；而用 harness 生产出来的东西，本身可能又是一个 harness，或至少带有 harness 的性质——工具、会话、反馈与扩展点的组合。在这种递归场景下，把规格、协作、验证与发布全量整理对，比一次性的项目开发难得多；正因为不简单，可学的东西才多。下面的三个视角，就是为这次整理搭的结构。

## 三个视角，各看什么

| 路径 | 视角：看什么 | 怎么读 |
|---|---|---|
| [SDLC Tutorial（流程教程）](./sdlc-tutorial/README.md) | 一次普通变更怎样从意图走到合并——SDD 与 GitHub Flow 的主线 | 从头到尾按顺序跟一遍 |
| [SDLC Reference（流程参考）](./sdlc-reference/README.md) | 同一条生命周期（意图入口 → 决策 → 计划 → 实现 → 评审 → 批准 → 发布）每一步的精确条件、状态与例外 | 按问题查，不必通读 |
| [Development Harness（开发 Harness）](./repo-harness/README.md) | 不看流程本身，看仓库怎样让 coding agent 看懂、修改、验证 DSH——AGENTS.md、Skills、gates、运行时查询的组织原理 | 在 Tutorial 之后读，或按兴趣单独进入 |

三个视角的差异：前两者是**同一条 SDLC 主线的两种深度**——Tutorial 负责建立心智模型，Reference 负责精确到可核对；第三者是**另一个视角**——不看"变更怎样走"，看"仓库为参与者提供了什么"。不确定该进哪个时：想学会走流程读 Tutorial，想核对某条规则的确切条件读 Reference，想理解"为什么这个仓库对 agent 友好"读 Development Harness。

## DSH 在这里扮演什么角色，理解从哪里来

本语料对 DSH 的全部理解都只从 DSH 的 GitHub 仓库 [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness/tree/46a7f68b0922371ce7144b668b90e377d8e799f4) 的一手内容挖出：源码、文档、`AGENTS.md`、`.agents/`、`.github/`、Skills、workflows，以及该仓库 git 历史中的 commit 与 tag。语料不使用任何二手转述或仓库外的描述性材料；其它研究目录不参与本语料的证据链。

挖取按版本进行：当前这一轮把全部目录外引用钉在 commit `46a7f68b0922371ce7144b668b90e377d8e799f4`（tag `dsh-v0.1.7-rc.1`）——这是“本语料此刻尊敬的版本”，不是永久前提。DSH 处于 developer preview，它的研发体系本身也会继续改：Issue/PR 门禁、评审制度、发布链路这些被挖出来的机制都随上游版本演进。语料随上游版本不断 re-pin，逐条复核并改写过时的结论（历轮 re-pin 与复核记录见 [`_coverage/00-corpus-maintenance.md`](./_coverage/00-corpus-maintenance.md)）；读到与本页不同的基线 commit 时，以维护页最新一轮为准。

具体做法是：结论先在正文里讲清楚，关键规则以 Markdown blockquote 摘录仓库原文，并给出来自该仓库固定 commit 的可核对链接与出处说明；读者不需要先理解 DSH 才能读懂主线，也可以顺着链接回到原文逐条核对。仓库没有声明的制度（例如它从未自称采用一套名为 SDD 的方法）在本语料中一律表述为“可观察机制的综合”，而不是官方方法名。

本语料不引用其它研究语料。目录外链接只指向固定 commit 的 DSH 内容，因此可以独立发行，同时保留回到原始证据的路径。

## 目录：每个子目录为什么存在，什么时候改它

| 路径 | 为什么要有它 | 什么时候需要改它 |
|---|---|---|
| [`sdlc-tutorial/`](./sdlc-tutorial/README.md) | 新读者（人或 fresh agent）需要一条按顺序跟完的完整主线；没有它，每次都要从零散规则里自己拼流程。它用一次普通变更把"意图 → 决策 → 实现 → 评审 → 合并"串成可跟读的故事，专教第一次 | 只有当主线叙事本身错了或缺了一段普通路径时才动它；改前先确认对应精确机制在 Reference 里的表述 |
| [`sdlc-reference/`](./sdlc-reference/README.md) | 教程为了好读省略了大量精确条件（policy 触发时机、状态机例外、加权批准公式、发布序列）；核对事实不能靠教程记忆。它是按问题可查的精确参考，也是历轮 re-pin 逐条复核的主战场 | 最常改的一卷：任何一手事实变化（workflows、policy、release、评审制度）都按 `_coverage` 的重审触发路径改对应页，并同步改写受影响的正文结论 |
| [`repo-harness/`](./repo-harness/README.md) | 流程之外有一个独立问题：为什么这个仓库对 coding agent 特别可参与？AGENTS.md、Skills、gates、生成目录、运行时查询这些机制本身值得一个专题来回答"仓库怎样帮 agent 看懂、修改、验证自己" | 仓库机制清单变化时改（Skills 增减、gate 结构、inspect 工具面、preset 组装）；历轮教训是这类"现状清单"最容易在 re-pin 时漏改，见 `_coverage` 0008 注记 |
| [`_coverage/`](./_coverage/README.md) | 语料的可信度取决于证据范围与复核记录：钉了哪个版本、哪些来源核过、上游什么变化要触发重审、历轮改了什么。没有它，更新就不知道从哪下手、哪些结论还站得住 | 每轮挖取/re-pin/改名都必须在这里留一条带日期的记录；改动了证据范围或结构约束时同步更新对应节 |
| [`verify.mjs`](./verify.mjs) | 语料的结构规则（严格 UTF-8、结尾换行、相对链接与锚点、钉版 DSH 外链、目录 README、SVG 规范）用可执行脚本强制，不靠人记；它使"语料改动没有破坏结构"可以机器回答 | 只在结构规则本身变化时改；改完要确认代表性无效输入会被拒绝 |

三个主题目录各有自己的 `README.md`、`00-index.md` 和 `figures/`；图只服务所在主题的正文。目录名在 2026-09-24 轮从 `foundations/`、`advanced-sdd-flow/`、`development-harness/` 更名为现名，理由记录在 [`_coverage/00-corpus-maintenance.md`](./_coverage/00-corpus-maintenance.md)。

## 验证

修改本目录后运行：

```sh
node _agent_ready_development/verify.mjs
```

该命令检查严格 UTF-8、单个结尾换行、Markdown 相对链接和锚点、目录 README、固定 DSH 外链，以及 SVG 的固有尺寸、无障碍元数据、结构、归属和引用。语义准确性与来源范围由 [`_coverage/00-corpus-maintenance.md`](./_coverage/00-corpus-maintenance.md) 记录。
