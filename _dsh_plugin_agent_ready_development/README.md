# DSH Plugin Agent-ready Development

本语料面向新建的独立 DSH 插件仓库，说明如何沿用 DSH 的原生开发机制组织意图、owner、实现、文档、测试证据与交付判断。目标不是复制 DSH 主仓库的内部治理，而是让插件开发者复用其可验证的扩展、组合和测试方式。

本目录是一套面向独立 DSH 插件仓的可独立使用语料。三卷分别解释原生开发模型、精确流程机制和仓库参与机制；每卷均以 DeepSeek Harness（DSH）的源码、文档、规则、Skills、workflow 与 git 历史为一手来源，不依赖其他研究材料。DSH 没有正式声明采用一套统一开发方法，本语料不把综合模型写成官方方法。

## 目标读者与适用边界

目标读者是在独立仓库中开发 DSH 插件的 owner 与 coding agent。读者应能从插件作者文档找到可运行的最小插件入口，再逐步建立自己的源码、配置、测试、预期结果和交付记录。从插件仓启动时，先按 DSH [首次插件指南](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/user/develop/basic/index.md)创建并挂载最小插件，再用 [Cordis 教程](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/cordis-tutorial/index.md)学习依赖、生命周期和真实组合。随后按本语料从单个行为切片增补行为 owner、用户配置、测试预期与可重复验证。

**适用边界**：独立插件仓可以采用 DSH 的 `apply(ctx)`、依赖声明、effect 清理、Cordis 配置组合、真实 Loader 测试和外部可观察断言。DSH 主仓库的 Issue policy、GitHub Project、加权批准积分、CI job 矩阵与发布工作流属于主仓库治理，不会因使用 DSH 就自动适用于插件仓。插件仓应为自身公开接口、用户可见行为、升级兼容和发布方式指定 owner 与验证路径。

本语料只以 DSH 固定版本的仓库源码、文档、规则、测试、Skills、workflows 和 git 历史作为事实来源。FAQ 与其他研究目录不作为必要前提或证据 owner。

正文区分四类陈述：**运行时事实**描述 DSH 接口和实际行为；**主仓要求**说明 DSH 自身贡献、测试与发布规则；**插件仓建议**是本语料归纳出的开发做法；**仓库自定**包括外部插件仓的组织、审批与发布选择。主仓要求不会因使用 DSH 自动成为外部仓库制度；调整建议时，插件仓应说明自己的可观察结果与验证方式。

## 独立使用与发行

复制本目录的全部内容并保留相对目录结构，即可独立阅读和验证；不需要宿主仓库的 FAQ、研究目录或本次会话。必要术语在各卷正文或本卷入口中解释，跨卷链接供深入查阅，不构成前置顺序。核对一手事实需要访问固定版本的 DSH 来源；离线核对可另备该版本的 DSH checkout。

独立读者建议先看[新仓起步](./native-development-model/01-new-plugin-repository.md)，遇到陌生词查[术语页](./native-development-model/02-terms-and-mental-models.md)，再按问题选择另外两卷。首次插件指南以已完成源码运行准备的 DSH checkout 为前提；它的 scratch 示例用于学习挂载，不规定独立插件仓的目录模板。

## 三卷入口

| 路径 | 插件仓读者的问题 | 使用方式 |
|---|---|---|
| [DSH 原生开发模型](./native-development-model/README.md) | 新建独立插件仓后如何起步并组织一次插件变更？ | 先看 [新仓起步](./native-development-model/01-new-plugin-repository.md)，再按问题深入 |
| [SDLC Reference（流程参考）](./sdlc-reference/README.md) | DSH 本身的具体条件、状态和例外是什么？哪些内容可移用于独立插件仓？ | 按问题查阅，并遵守适用边界 |
| [Development Harness（开发 Harness）](./repo-harness/README.md) | DSH 仓库怎样让 agent 定位知识、扩展点和验证方式？ | 按参与任务查阅 |

三卷分别解释原生开发模型、DSH 主仓库的精确机制和仓库参与方式。它们各有 README 与入口页，只依赖 DSH 一手来源，彼此不构成前置阅读顺序。

## DSH 在这里扮演什么角色，理解从哪里来

本语料对 DSH 的全部理解都只从 DSH 的 GitHub 仓库 [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.2.0-rc.2) 的一手内容挖出：源码、文档、`AGENTS.md`、`.agents/`、`.github/`、Skills、workflows，以及该仓库 git 历史中的 commit 与 tag。语料不使用任何二手转述或仓库外的描述性材料；其它研究目录不参与本语料的证据链。

挖取按版本进行：当前现行机制的目录外引用固定到 release tag `dsh-v0.2.0-rc.2`。这是本轮核验版本，不是永久前提。DSH 处于 developer preview，运行时接口与主仓制度都会演进；更新版本时应逐条复核并改写过时结论，不能只替换 URL。基线与历轮复核记录由[维护页](./_coverage/00-corpus-maintenance.md)拥有。历史样本以日期、提交标题、PR 或 release tag 定位，不充当当前规则。

具体做法是：结论先在正文里讲清楚，关键规则以 Markdown blockquote 摘录仓库原文，并给出来自该仓库固定 release tag 的可核对链接与出处说明；读者不需要先理解 DSH 才能读懂主线，也可以顺着链接回到原文逐条核对。仓库没有声明的制度（例如它从未自称采用一套名为 SDD 的方法）在本语料中一律表述为“可观察机制的综合”，而不是官方方法名。

本语料不引用其它研究语料。目录外链接只指向固定 release tag 的 DSH 内容，因此可以独立发行，同时保留回到原始证据的路径。

## 目录：每个子目录为什么存在，什么时候改它

| 路径 | 为什么要有它 | 什么时候需要改它 |
|---|---|---|
| [`native-development-model/`](./native-development-model/README.md) | 从新仓起步页开始，说明独立插件仓怎样组合 DSH 的 owner、证据和交付判断 | DSH 的事实归属、测试层或评审职责变化时复核 |
| [`sdlc-reference/`](./sdlc-reference/README.md) | 查阅 DSH 主仓库的精确条件、状态与例外，并判断哪些机制适用于独立插件仓 | 任何一手事实变化（workflows、policy、release、评审制度）都按 `_coverage` 的重审触发路径改对应页 |
| [`repo-harness/`](./repo-harness/README.md) | 查找 DSH 的知识入口、Skills、扩展方式和反馈机制，选择独立插件仓实际需要的部分 | 仓库机制清单变化时改（Skills 增减、gate 结构、inspect 工具面、preset 组装）；历轮教训是这类"现状清单"最容易在 re-pin 时漏改，见 `_coverage` 0008 注记 |
| [`_coverage/`](./_coverage/README.md) | 语料的可信度取决于证据范围与复核记录：钉了哪个版本、哪些来源核过、上游什么变化要触发重审、历轮改了什么。没有它，更新就不知道从哪下手、哪些结论还站得住 | 每轮挖取/re-pin/改名都必须在这里留一条带日期的记录；改动了证据范围或结构约束时同步更新对应节 |
| [`verify.mjs`](./verify.mjs) | 语料的结构规则（严格 UTF-8、结尾换行、相对链接与锚点、钉版 DSH 外链、目录 README、SVG 规范）用可执行脚本强制，不靠人记；它使“语料改动没有破坏结构”可以机器回答 | 只在结构规则本身变化时改；同步检查负例 |
| [`verify.test.mjs`](./verify.test.mjs) | 在临时复制的完整语料中，通过真实 verifier 入口测试接受和拒绝条件 | 修改引用政策、隔离或链接约束时更新对应负例 |

每卷都有自己的 README 和入口页；术语页和图示服务拥有它们的卷。目录更名与历史案例迁移由[维护记录](./_coverage/00-corpus-maintenance.md)保存，不作为阅读本语料的前提。

## 验证

修改本目录后，使用支持 ESM 与 Unicode 正则的 Node.js（本轮使用 Node 22）运行。位于本目录时：

```sh
node verify.mjs
```

位于宿主仓库根目录时：

```sh
node _dsh_plugin_agent_ready_development/verify.mjs
```

脚本仅使用 Node 内置模块，不依赖 pnpm、宿主脚本、Git 或网络；它按自身文件位置定位语料，不按当前工作目录猜路径。该命令检查严格 UTF-8、单个结尾换行、Markdown 相对链接和锚点、目录 README、固定 DSH 外链，以及 SVG 的固有尺寸、无障碍元数据、XML、归属和引用。它不核对远端来源内容、不证明语义准确，也不替代图示视觉检查。

修改验证规则后，在本目录运行 `node verify.test.mjs`。测试将完整语料复制到独立临时目录，确认有效副本通过，错误版本引用、跨卷图、越界链接、缺失锚点与缺失结尾换行被真实入口拒绝；它不改当前语料，结束时打印并保留临时副本位置。证据复核与宿主仓库附加检查见[维护页](./_coverage/00-corpus-maintenance.md)。
