# 26 · 一组插件怎样交成一份完整可控的 Harness 发行版：组合、项目目录、数据与交付

源码核验基线：`dsh-v0.2.1-rc.3`（`1f81c047fc48fa190a683e469daa699857e9afe8`）。

本篇把 DSH 当前 checkout 的 profile、Workspace、Session、工具与存储机制，与发行方需要自行设计的目录选择和数据责任分开讨论。标 **T** 的命令/运行观测仅适用于所记录的样本；其他 DSH 行为按当前源码与 docs 核验。运行时合同以本篇 checkout 为准，文件头的 `dsh-v0.2.1-rc.3` 用于标识已归档的研究样本来源，不覆盖当前源码。范围限单 Host；同一 `$DSH_HOME` 下不同 profile 的共享行为会明确说明。

## 问题从哪来

普通插件为已有 DSH composition 增加一项能力。当作者想把一组插件交到用户手里时，他要交付的不是“一个变成产品的插件”，而是一份**完整可控的 Harness 发行版**：运行时从哪来、profile 叫什么、patch 层给谁覆盖、起哪个 app surface、数据归谁、装完怎么更和怎么卸。这六件事里任何一件没定 owner，交付就不完整；任何一件要靠改 DSH 源码才能改，交付就不可控。

把这件事说成“插件即产品”会掩盖上面六件，还会把 profile 抬成产品边界——而 profile 只是 Harness home 里的具名组装。发行方需要分别决定：

- 用户看到的入口由哪份 profile composition 提供？
- 项目目录、Session 初始 `cwd` 与 DSH Workspace registration 如何对应？
- 模型能调用哪些工具？每种工具怎样访问文件？
- 每块用户数据由谁拥有、存在哪里、何时删除或迁移？
- 多 profile、换 home、换机器或卸载后，哪些状态共享或保留？

## 这个问题的难点

“Workspace”“Session cwd”“有效 working directory”“sandbox root”和“发行方定义的 project root”名称接近，但在 DSH 里回答不同问题。发行方需要先把目录身份、模型工具面、sandbox policy 与数据 owner 分开，再判断每一层分别由谁负责、哪些是 DSH 已有的机制、哪些要发行方自己设计。

## 本篇要回答的具体问题

| # | 问题 | 主回答 |
|---|---|---|
| Q0 | Harness 发行版由哪六轴组成？每轴的 owner、DSH 机制与读回方式是什么？ | [10 六轴](./10-foundations/10-taxonomy.md) |
| Q1 | plugin、bundle 与 profile 各是什么？发行版入口怎样启动？ | [answer](./00-answer.md)、[FAQ 24](../24_plugin-publish-and-agent-data-planes/answer.md)、[50 生命周期](./50-lifecycle/00-index.md) |
| Q2 | 发布包、用户目录、插件状态与设置分别由谁拥有？ | [15 资产 owner](./10-foundations/15-asset-owners.md) |
| Q3 | DSH Web 首次怎样建立 Workspace？发行方若自选项目目录要自建什么？ | [16 首用与项目目录](./10-foundations/16-startup-resolution.md)、[37 首启](./30-external/37-lifecycle-stages.md) |
| Q4 | Patch 优先级、Config 默认值和链外设置如何区分？ | [17 配置、工具与权限](./10-foundations/17-config-layers.md)、[37 配阶段](./30-external/37-lifecycle-stages.md) |
| Q5 | Session、项目根、Workspace、profile、home 与 device 的作用域有何不同？ | [13 作用域与键](./10-foundations/13-scope-and-keys.md) |
| Q6 | storage domain、Config、CredentialRef 与 CredentialKey 各保存什么？ | [12 状态机制](./10-foundations/12-state-storage.md) |
| Q7 | DSH 的五类存储与客户端状态是什么关系？ | [11 五类存储](./10-foundations/11-storage-channels.md) |
| Q8 | `present`、changes、attachments 和 spill 各服务谁？ | [14 产物](./10-foundations/14-artifacts.md) |
| Q9 | DSH 存储能力的形成历史有什么当前影响？ | [22 原生数据历史](./20-native/22-native-data-history.md) |
| Q10 | 外部插件与 profile 交付形态有哪些可借模式？ | [31](./30-external/31-external-community-patterns.md)、[32](./30-external/32-external-ecosystem.md)、[33](./30-external/33-external-plugin-patterns.md)、[34](./30-external/34-profile-delivery-forms.md)、[35](./30-external/35-profile-assembly-ownership.md)、[36](./30-external/36-profile-evidence-ledger.md)、[37](./30-external/37-lifecycle-stages.md) |
| Q11 | profile bundle 如何安装、更新与卸载？数据清理由谁负责？ | [18 安装生命周期](./10-foundations/18-install-upgrade.md)、[34 profile 交付形态](./30-external/34-profile-delivery-forms.md)、[35 装配所有权](./30-external/35-profile-assembly-ownership.md)、[37 装/起/配/首启](./30-external/37-lifecycle-stages.md)、[50 安装启动](./50-lifecycle/00-index.md) |
| Q12 | 如何从 profile 文件走到发行版 Session、工具和数据？ | [90 主线](./90-advisor/00-index.md)、[93 Kanban 文件走查](./90-advisor/93-app-plugin-walkthrough.md)、[91 数据卡](./90-advisor/91-checklist.md)、[92 参考矩阵](./90-advisor/92-native-reference-architectures.md) |

## 不回答什么

- 不重复 plugin、bundle、profile、preset 的发布合同；见 [FAQ 24](../24_plugin-publish-and-agent-data-planes/answer.md)。
- 不设计 DSH 不提供的多租户或跨机器同步服务；发行方可另行选择部署隔离和同步机制。
- 不重新解释会话格式、compaction 或归档算法；仅说明它们的数据 owner 和删除影响。
- 不提供可直接发布的 Kanban 实现；[93](./90-advisor/93-app-plugin-walkthrough.md) 是发行版组合流程示例，其中的 package 与工具代码是假想内容。
- 不安装或运行外部 profile 交付；八个样本的证据分级与未验证项见 [36](./30-external/36-profile-evidence-ledger.md)。

## 阅读顺序

1. **先看摘要**：[00-answer](./00-answer.md) 了解发行版六轴与数据维度。
2. **准备设计**：[10 六轴](./10-foundations/10-taxonomy.md) → [15](./10-foundations/15-asset-owners.md) → [16](./10-foundations/16-startup-resolution.md) → [17](./10-foundations/17-config-layers.md)。
3. **逐块选数据机制**：按需读 [11](./10-foundations/11-storage-channels.md)、[12](./10-foundations/12-state-storage.md)、[13](./10-foundations/13-scope-and-keys.md)、[14](./10-foundations/14-artifacts.md)。
4. **开始动手**：先看 [50 生命周期](./50-lifecycle/00-index.md) 选交付方式，装/起/配/首启的阶段判据见 [37](./30-external/37-lifecycle-stages.md)，再沿 [90 主线](./90-advisor/00-index.md) → [93 Kanban 文件例子](./90-advisor/93-app-plugin-walkthrough.md)；完工用 [91](./90-advisor/91-checklist.md) 验收。遇到存储或隔离取舍，再查 [92](./90-advisor/92-native-reference-architectures.md) 和 [18](./10-foundations/18-install-upgrade.md)。
5. **核实研究材料**：[21/22](./20-native/21-native-data-landscape.md) 提供 DSH 参考；[31–37](./30-external/31-external-community-patterns.md) 是 DSH 外部生态模式，不是 DSH 合同；[40-evidence](./40-evidence/00-index.md) 提供来源与命令。
