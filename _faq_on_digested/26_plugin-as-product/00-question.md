# 26 · 一个 DSH 插件怎样成为产品 profile：组合、项目目录与数据归属

源码核验基线：`dsh-v0.2.1-rc.3`（`1f81c047fc48fa190a683e469daa699857e9afe8`）。

本篇把 DSH 当前 checkout 的 profile、Workspace、Session、工具与存储机制，与产品作者需要自行设计的目录选择和数据责任分开讨论。标 **T** 的命令/运行观测仅适用于所记录的样本；其他 DSH 行为按当前源码与 docs 核验。运行时合同以本篇 checkout 为准，文件头的 `dsh-v0.2.1-rc.3` 用于标识已归档的研究样本来源，不覆盖当前源码。范围限单 Host；同一 `$DSH_HOME` 下不同 profile 的共享行为会明确说明。

## 问题从哪来

普通插件为已有 DSH composition 增加一项能力。所谓“插件就是产品”通常实际表示：用户通过一份产品 profile 启动 DSH Web 或其他受支持 surface，而该 profile 选入产品 bundle、preset、plugins 与用户配置。

这不会改变 DSH 的启动模型：应用仍由 `dsh --profile <name>` 启动；profile 是 named composition，bundle 是发布 patch 与代码依赖的形式。换 profile 不会自动建立独立 `$DSH_HOME`，也不会隔离同一个 home 下的 Session history、Workspace registry 或凭据。

产品作者需要分别决定：

- 用户看到的产品入口由哪份 profile composition 提供？
- 产品目录、Session 初始 `cwd` 与 DSH Workspace registration 如何对应？
- 模型能调用哪些工具？每种工具怎样访问文件？
- 每块用户数据由谁拥有、存在哪里、何时删除或迁移？
- 多 profile、换 home、换机器或卸载后，哪些状态共享或保留？

## 为什么不能只说“可写目录”

“Workspace”“Session cwd”“有效 working directory”“sandbox root”和“产品 project root”名称接近，但回答不同问题：

- DSH Workspace 是 Host 侧的目录登记，用于 Web 导航与 Session 分组；registration 不给模型文件工具。
- 只需指定 Session 初始工作目录时，传绝对 `cwd`；还要加入 DSH Workspace 侧栏分组时，才传已有 registration 的 `workspaceId`，由 Host 取 canonical path 并 attach Session。两者不能同时传；`WorkspaceId` 是 registration ID，不是 path、权限 token 或产品 project ID。
- `header.cwd` 标识 Session 的原始项目目录，也是正常 sandbox policy 的默认 workspace root。`working_directory` 可以改变后续操作目录，但不会改变 header 或 sandbox writable roots。
- Preset 决定模型可调用的工具。Sandbox policy 只约束接入它的 consumer；Host 插件代码不自动受到 Session sandbox 限制。
- `workspace-write` 除 Session 根外还允许平台临时目录；文件读取也不由这条写入围栏限制。

因此，本篇将目录导航、模型工具面、sandbox policy 和产品数据 owner 作为独立设计维度处理。

## 本篇要回答的具体问题

| # | 问题 | 主回答 |
|---|---|---|
| Q0 | 产品 profile、数据 owner、存储机制和作用域如何区分？ | [10 概念层](./10-foundations/10-taxonomy.md) |
| Q1 | 插件、bundle 与 profile 各是什么？产品入口怎样启动？ | [answer](./00-answer.md)、[FAQ 24](../24_plugin-publish-and-agent-data-planes/answer.md) |
| Q2 | 发布包、用户目录、插件状态与产品设置分别由谁拥有？ | [15 四个空间](./10-foundations/15-four-spaces.md) |
| Q3 | DSH Web 首次怎样建立 Workspace？产品若自选项目目录要自建什么？ | [16 首用与项目目录](./10-foundations/16-startup-resolution.md) |
| Q4 | Patch 优先级、Config 默认值和链外产品设置如何区分？ | [17 配置、工具与权限](./10-foundations/17-config-layers.md) |
| Q5 | Session、project、Workspace、profile、home 与 device 的作用域有何不同？ | [13 作用域与键](./10-foundations/13-scope-and-keys.md) |
| Q6 | storage domain、Config、CredentialRef 与 CredentialKey 各保存什么？ | [12 状态机制](./10-foundations/12-state-homes.md) |
| Q7 | DSH 的五个家与客户端状态是什么关系？ | [11 五个家](./10-foundations/11-five-homes.md) |
| Q8 | `present`、changes、attachments 和 spill 各服务谁？ | [14 产物](./10-foundations/14-artifacts.md) |
| Q9 | DSH 存储能力的形成历史有什么当前影响？ | [22 原生数据历史](./20-native/22-native-data-history.md) |
| Q10 | DSH 外部插件有哪些可借模式？ | [31](./30-external/31-external-community-patterns.md)、[32](./30-external/32-external-ecosystem.md)、[33](./30-external/33-external-plugin-patterns.md) |
| Q11 | Profile bundle 如何安装、更新与卸载？数据清理由谁负责？ | [18 安装生命周期](./10-foundations/18-install-upgrade.md) |
| Q12 | 如何从 profile 文件走到产品 Session、工具和数据？ | [90 主线](./90-advisor/00-index.md)、[93 Kanban 文件走查](./90-advisor/93-app-plugin-walkthrough.md)、[91 数据卡](./90-advisor/91-checklist.md)、[92 参考矩阵](./90-advisor/92-native-reference-architectures.md) |

## 一句话预告

产品型 profile 是产品发布的运行组合。每块数据都要说明 owner、authority、source、保存机制、scope/key、readers、writers、能否重建及保留责任；产品目录选择与 DSH Workspace 导航不是同一个状态。

![产品运行组合与数据卡](./figures/10-taxonomy-flow.svg)

## 不回答什么

- 不重复 plugin、bundle、profile、preset 的发布合同；见 [FAQ 24](../24_plugin-publish-and-agent-data-planes/answer.md)。
- 不设计 DSH 不提供的多租户或跨机器同步服务；产品作者可另行选择部署隔离和同步机制。
- 不重新解释会话格式、compaction 或归档算法；仅说明它们的数据 owner 和删除影响。
- 不提供可直接发布的 Kanban 实现；[93](./90-advisor/93-app-plugin-walkthrough.md) 是产品组合流程示例，产品 package 与工具代码是假想内容。

## 阅读顺序

1. **先看摘要**：[00-answer](./00-answer.md) 了解产品 profile 与数据维度。
2. **准备设计**：[10](./10-foundations/10-taxonomy.md) → [15](./10-foundations/15-four-spaces.md) → [16](./10-foundations/16-startup-resolution.md) → [17](./10-foundations/17-config-layers.md)。
3. **逐块选数据机制**：按需读 [11](./10-foundations/11-five-homes.md)、[12](./10-foundations/12-state-homes.md)、[13](./10-foundations/13-scope-and-keys.md)、[14](./10-foundations/14-artifacts.md)。
4. **开始动手**：沿 [90 主线](./90-advisor/00-index.md) → [93 Kanban 文件例子](./90-advisor/93-app-plugin-walkthrough.md)；完工用 [91](./90-advisor/91-checklist.md) 验收。遇到存储或隔离取舍，再查 [92](./90-advisor/92-native-reference-architectures.md) 和 [18](./10-foundations/18-install-upgrade.md)。
5. **核实研究材料**：[21/22](./20-native/21-native-data-landscape.md) 提供 DSH 参考；[31–33](./30-external/31-external-community-patterns.md) 是 DSH 外部生态模式，不是 DSH 合同；[40-evidence](./40-evidence/00-index.md) 提供来源与命令。
