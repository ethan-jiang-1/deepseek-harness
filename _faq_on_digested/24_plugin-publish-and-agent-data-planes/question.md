# 24 · 插件怎么才算“能发布”，智能体的只读定义与数据又该放在哪？

源码核验基线：当前 checkout，DSH 包版本 `0.2.1-rc.3`。本篇的 DSH 行为结论来自仓库内产品文档、包 README 与源码；市场、npm、Git 托管等仓库外行为只按文档与生成器描述记录，未做联网实测。

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

## 不回答什么

- 不重复安装渠道的 UI 操作：Desktop 六种装法、Web 插件页、`dsh plugin` 的入口差异见 [FAQ 23 的 04 篇](../23_standalone-vs-web-release-forms/04_plugin-paths.md)。
- 不重复“专家插件 repo 选哪个方案”：独立 repo、pinned submodule、marketplace monorepo 的取舍见 [FAQ 13](../13_expert-plugin-repo-organization/answer.md)。
- 不评估某个具体第三方插件的好坏；外部样本只在“生态是否已经收敛到同一形态”处引用。
- 不把 DSH 主仓的贡献纪律（Agent Note、coverage、snapshot、label）当成外部插件作者的义务；两者会明确分开标注。

## 阅读顺序

先读 [answer.md](./answer.md) 的一分钟版与三张判据表，再按 Q1 → Q6 读分篇。若只关心“我现在要发一个包”，直接跳到 [02 篇](./02-package-contract.md) 与 [06 篇](./06-skeleton-and-checklists.md)；若只关心“数据别放错地方”，直接读 [05 篇](./05-data-planes.md)。

![三个角色与五种贡献](./figures/01-three-roles.svg)
