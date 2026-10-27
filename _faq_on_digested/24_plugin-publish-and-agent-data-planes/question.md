# 24 · 插件怎么才算“能发布”，智能体的只读定义与数据又该放在哪？

源码核验基线：`dsh-v0.2.1-rc.3`（`1f81c047fc48fa190a683e469daa699857e9afe8`），与 `_digested/` 同一基线。本篇的 DSH 行为结论来自仓库内产品文档、包 README 与源码；市场、npm、Git 托管等仓库外行为只按文档与生成器描述记录，未做联网实测。

本篇的**目录外引用统一用 GitHub URL**（产品源码固定到上面的 rc.3 commit，其他 FAQ 指向研究分支），目录内引用用相对路径，便于单独分发。

## 问题从哪来

前面几篇分别回答了“DSH 的目录怎么读”“领域专家插件的 repo 怎么组织”“standalone 与 CLI/Web 怎么发布”“怎么先找现成的轮子”。把这些问题串起来之后，还剩一组没有被单篇回答的困惑，集中在“一个插件作者真正要交付什么”上。

1. **发布要求**：把插件做成一个“好插件”，发布侧到底有哪些硬要求？哪些是 DSH 会拒绝的，哪些只是 DSH 自己遵守、外部作者不必照搬的质量线？一个合理的插件包应该长什么样？
2. **智能体与数据分离**：插件往往交付的是一个“智能体”。这个智能体一定有运行时只读的部分（人设、指令、技能、工具边界），也有它处理的数据。数据有时属于当前 working folder，有时与 folder 无关（例如积累的经验）。这两类东西应该各自放在哪，怎么和智能体代码分开？
3. **发布形态**：DSH 真正认哪些发布形态？哪些只是配置、哪些只是数据？说明文字、图标、版本依赖分别写在哪，谁在读？

## 为什么不能一句话回答

因为“插件”在 DSH 里同时被三种东西使用：

- 作为**运行时行为单元**，它是导出 `apply(ctx)` 或 service class 的模块，被 Loader 行挂进插件树；
- 作为**智能体定义**，它是一段声明式 preset（`@deepseek-ai/dsh-agent-preset` 的一行 `config.plugins`），不是一个可执行程序；
- 作为**数据**，它是会话日志、工作区文件、用户目录里的技能与经验，根本不属于包。

把这三件事都叫“插件”，就会出现“插件的只读部分”“插件的数据部分”“插件怎么发布”这些说法各自指向不同层的情况。本篇先把层拆开，再回答每一层的要求。

## 本篇要回答的具体问题

| # | 问题 | 主回答 |
|---|---|---|
| Q1 | DSH 认哪些“插件形态”？plugin / bundle / profile / preset / skill / client / MCP 各是什么角色，谁能被安装并自动启用？ | [01 篇](./01-publishable-forms.md) |
| Q2 | 一个可发布的插件包，manifest、入口、patch、配置、兼容性、说明文字要满足什么？哪些是硬门禁，哪些是质量线？ | [02 篇](./02-package-contract.md) |
| Q3 | npm、Git、tarball、本地 link、市场 index、官方目录各自怎么发、怎么装、版本依赖怎么声明？ | [03 篇](./03-channels-and-versions.md) |
| Q4 | “智能体”的只读定义层是什么？preset 与 Host 行怎么分工，为什么它是只读的，改它为什么只影响新会话？ | [04 篇](./04-readonly-agent-definition.md) |
| Q5 | 数据分几种归属？working folder 相关的、与 folder 无关的经验、会话日志、宿主 KV 各自住在哪？ | [05 篇](./05-data-planes.md) |
| Q6 | 有没有一个可以直接照抄的仓库骨架、文件清单和发布前检查表？旧写法（`agent.cordis.yml`、`dsh.compatibility`）怎么迁移？ | [06 篇](./06-skeleton-and-checklists.md) |
| Q7 | 合格插件要测什么？打包、数据分割、智能体、代码各自怎么测，时间不够时先做什么？ | [07 篇](./07-testing-and-acceptance.md) |
| Q8 | 灵活度到底怎么打包？打包的性质是什么？Dify、Hugging Face、MCP、Claude Code、VS Code 各自怎么做？ | [08 篇](./08-packaging-flexibility-and-ecosystems.md) |
| Q9 | 智能体的只读定义和数据到底怎么切最合理？除了 workspace/home/session，还有哪些切法？ | [09 篇](./09-agent-data-cuts.md) |
| Q10 | 插件开发时，怎么只用 DSH 原生能力系统安排数据？有没有可以照着做的数据卡、落点表和检查表？ | [10 篇](./10-data-design-advisor.md) |

## 不回答什么

下面只标出不在本篇展开的相邻问题；本篇的结论不依赖它们。

- 不重复安装渠道的 UI 操作：Desktop 六种装法、Web 插件页、`dsh plugin` 的入口差异见 [FAQ 23 的 04 篇](https://github.com/ethan-jiang-1/deepseek-harness/blob/ethan/_faq_on_digested/23_standalone-vs-web-release-forms/04_plugin-paths.md)。
- 不重复“专家插件 repo 选哪个方案”：独立 repo、pinned submodule、marketplace monorepo 的取舍见 [FAQ 13](https://github.com/ethan-jiang-1/deepseek-harness/blob/ethan/_faq_on_digested/13_expert-plugin-repo-organization/answer.md)。
- 不评估某个具体第三方插件的好坏；外部样本只在“生态是否已经收敛到同一形态”处引用。
- 不把 DSH 主仓的贡献纪律（Agent Note、coverage、snapshot、label）当成外部插件作者的义务；两者会明确分开标注。

## 阅读顺序

先读 [00-index.md](./00-index.md) 的 30 秒结论、一页决策画布与六项检查速查，再读 [answer.md](./answer.md) 的一分钟版与三张判据表，最后按 Q1 → Q10 读分篇。若只关心“我现在要发一个包”，直接跳到 [02 篇](./02-package-contract.md)、[06 篇](./06-skeleton-and-checklists.md) 与 [07 篇](./07-testing-and-acceptance.md)；若只关心“数据别放错地方”，读 [05 篇](./05-data-planes.md)、[09 篇](./09-agent-data-cuts.md) 与 [10 篇](./10-data-design-advisor.md)；若关心“为什么这样设计、别人怎么做”，读 [08 篇](./08-packaging-flexibility-and-ecosystems.md)。

![三层与五种贡献](./figures/01-three-roles.svg)
