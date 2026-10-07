# DSH Plugin Agent-ready Development

本语料面向新建的独立 DSH 插件仓库，说明如何沿用 DSH 的原生开发机制组织意图、owner、实现、文档、测试证据与交付判断。目标不是复制 DSH 主仓库的内部治理，而是让插件开发者复用其可验证的扩展、组合和测试方式。

本目录是一套面向独立 DSH 插件仓的可独立使用语料。三卷分别解释原生开发模型、精确流程机制和仓库参与机制；每卷均以 DeepSeek Harness（DSH）的源码、文档、规则、Skills、workflow 与 git 历史为一手来源，不依赖其他研究材料。DSH 没有正式声明采用一套统一开发方法，本语料不把综合模型写成官方方法。

## 目标读者与适用边界

目标读者是在独立仓库中开发 DSH 插件的 owner 与 coding agent。读者应能从插件作者文档找到可运行的最小插件入口，再逐步建立自己的源码、配置、测试、预期结果和交付记录。从插件仓启动时，先按 DSH [首次插件指南](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/user/develop/basic/index.md)创建并挂载最小插件，再用 [Cordis 教程](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/index.md)学习依赖、生命周期和真实组合。随后按本语料从单个行为切片增补行为 owner、用户配置、测试预期与可重复验证。

**适用边界**：独立插件仓可以采用 DSH 的 `apply(ctx)`、依赖声明、effect 清理、Cordis 配置组合、真实 Loader 测试和外部可观察断言。DSH 主仓库的 Issue policy、GitHub Project、加权批准积分、CI job 矩阵与发布工作流属于主仓库治理，不会因使用 DSH 就自动适用于插件仓。插件仓应为自身公开接口、用户可见行为、升级兼容和发布方式指定 owner 与验证路径。

本语料只以 DSH 固定版本的仓库源码、文档、规则、测试、Skills、workflows 和 git 历史作为事实来源。FAQ 与其他研究目录不作为必要前提或证据 owner。

## 三卷入口

| 路径 | 插件仓读者的问题 | 使用方式 |
|---|---|---|
| [DSH 原生开发模型](./native-development-model/README.md) | 一次插件变更如何组织 owner、实现、测试资产和交付判断？ | 了解相互关系 |
| [SDLC Reference（流程参考）](./sdlc-reference/README.md) | DSH 本身的具体条件、状态和例外是什么？哪些内容可移用于独立插件仓？ | 按问题查阅，并遵守适用边界 |
| [Development Harness（开发 Harness）](./repo-harness/README.md) | DSH 仓库怎样让 agent 定位知识、扩展点和验证方式？ | 按参与任务查阅 |

三卷分别解释原生开发模型、DSH 主仓库的精确机制和仓库参与方式。它们各有 README 与入口页，只依赖 DSH 一手来源，彼此不构成前置阅读顺序。

## DSH 在这里扮演什么角色，理解从哪里来

本语料对 DSH 的全部理解都只从 DSH 的 GitHub 仓库 [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness/tree/580646c14fb998532a6ef19bb4cc4009cd74b786) 的一手内容挖出：源码、文档、`AGENTS.md`、`.agents/`、`.github/`、Skills、workflows，以及该仓库 git 历史中的 commit 与 tag。语料不使用任何二手转述或仓库外的描述性材料；其它研究目录不参与本语料的证据链。

挖取按版本进行：当前这一轮把全部目录外引用钉在 commit `580646c14fb998532a6ef19bb4cc4009cd74b786`（tag `dsh-v0.2.0-rc.2`）——这是“本语料此刻尊敬的版本”，不是永久前提。DSH 处于 developer preview，它的研发体系本身也会继续改：Issue/PR 门禁、评审制度、发布链路这些被挖出来的机制都随上游版本演进。语料随上游版本不断 re-pin，逐条复核并改写过时的结论（历轮 re-pin 与复核记录见 [`_coverage/00-corpus-maintenance.md`](./_coverage/00-corpus-maintenance.md)）；读到与本页不同的基线 commit 时，以维护页最新一轮为准。

具体做法是：结论先在正文里讲清楚，关键规则以 Markdown blockquote 摘录仓库原文，并给出来自该仓库固定 commit 的可核对链接与出处说明；读者不需要先理解 DSH 才能读懂主线，也可以顺着链接回到原文逐条核对。仓库没有声明的制度（例如它从未自称采用一套名为 SDD 的方法）在本语料中一律表述为“可观察机制的综合”，而不是官方方法名。

本语料不引用其它研究语料。目录外链接只指向固定 commit 的 DSH 内容，因此可以独立发行，同时保留回到原始证据的路径。

## 目录：每个子目录为什么存在，什么时候改它

| 路径 | 为什么要有它 | 什么时候需要改它 |
|---|---|---|
| [`native-development-model/`](./native-development-model/README.md) | 说明独立插件仓怎样组合 DSH 的 owner、证据和交付判断，不增加额外阶段或产物 | DSH 的事实归属、测试层或评审职责变化时复核 |
| [`sdlc-reference/`](./sdlc-reference/README.md) | 查阅 DSH 主仓库的精确条件、状态与例外，并判断哪些机制适用于独立插件仓 | 任何一手事实变化（workflows、policy、release、评审制度）都按 `_coverage` 的重审触发路径改对应页 |
| [`repo-harness/`](./repo-harness/README.md) | 查找 DSH 的知识入口、Skills、扩展方式和反馈机制，选择独立插件仓实际需要的部分 | 仓库机制清单变化时改（Skills 增减、gate 结构、inspect 工具面、preset 组装）；历轮教训是这类"现状清单"最容易在 re-pin 时漏改，见 `_coverage` 0008 注记 |
| [`_coverage/`](./_coverage/README.md) | 语料的可信度取决于证据范围与复核记录：钉了哪个版本、哪些来源核过、上游什么变化要触发重审、历轮改了什么。没有它，更新就不知道从哪下手、哪些结论还站得住 | 每轮挖取/re-pin/改名都必须在这里留一条带日期的记录；改动了证据范围或结构约束时同步更新对应节 |
| [`verify.mjs`](./verify.mjs) | 语料的结构规则（严格 UTF-8、结尾换行、相对链接与锚点、钉版 DSH 外链、目录 README、SVG 规范）用可执行脚本强制，不靠人记；它使"语料改动没有破坏结构"可以机器回答 | 只在结构规则本身变化时改；改完要确认代表性无效输入会被拒绝 |

每卷都有自己的 `README.md` 和 `00-index.md`；图示只服务拥有它们的卷，原生开发模型当前不使用图示。目录名在 2026-09-24 轮从 `foundations/`、`advanced-sdd-flow/`、`development-harness/` 更名为现名；其中 `sdlc-tutorial/` 已在后续轮次迁出本语料（见下）。

## 验证

修改本目录后运行：

```sh
node _dsh_plugin_agent_ready_development/verify.mjs
```

该命令检查严格 UTF-8、单个结尾换行、Markdown 相对链接和锚点、目录 README、固定 DSH 外链，以及 SVG 的固有尺寸、无障碍元数据、结构、归属和引用。语义准确性与来源范围由 [`_coverage/00-corpus-maintenance.md`](./_coverage/00-corpus-maintenance.md) 记录。
