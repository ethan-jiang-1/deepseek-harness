# 26 · 插件组合成产品：profile、目录与数据

本目录帮助 DSH plugin 作者和产品 profile 维护者选择启动组合、目录行为和数据存储。产品 profile 不自动创建数据隔离；项目目录、Workspace registration、Session cwd 和工具权限是不同的决定。

> **产品 profile 路线**：先查 [34 profile 形态](./30-external/34-profile-product-forms.md) 与 [35 装配所有权](./30-external/35-profile-assembly-ownership.md) 定发行形态，再从 [90 主线](./90-advisor/00-index.md) 开始，沿 [93 Kanban 文件走查](./90-advisor/93-app-plugin-walkthrough.md) 对照 JSON/YAML；数据责任见 [91 数据卡](./90-advisor/91-checklist.md)。

![产品运行组合与数据卡](./figures/10-taxonomy-flow.svg)

## 结论

- Profile 是由 DSH 启动的 package/patch 组合，不是数据隔离边界。
- 每份事实分别记录 owner、authority、source、mechanism/path、scope/key、readers、writers、可重建性和保留责任。
- `workspaceId` 加入 DSH Workspace 导航与 Session 分组；只需工作目录时可传绝对 `cwd`。
- DSH Web 有自己的首用 Workspace；产品自建项目选择和数据存储由产品维护。

## 按角色阅读

- **普通 plugin 作者**：从 [91 数据卡](./90-advisor/91-checklist.md) 开始，按需查 [10–14](./10-foundations/10-taxonomy.md)、[31 社区做法](./30-external/31-external-community-patterns.md)/[32 数据设计](./30-external/32-external-ecosystem.md) 和 [92](./90-advisor/92-native-reference-architectures.md)。
- **产品 profile 作者**：先查 [34 profile 形态](./30-external/34-profile-product-forms.md) 与 [35 装配所有权](./30-external/35-profile-assembly-ownership.md) 定发行形态；再走 [90 主线](./90-advisor/00-index.md) → [93 Kanban 文件走查](./90-advisor/93-app-plugin-walkthrough.md)；交付前查 [91 数据卡/验收](./90-advisor/91-checklist.md)，证据查 [36 样本台账](./30-external/36-profile-evidence-ledger.md)，遇到存储取舍查 [92 参考矩阵](./90-advisor/92-native-reference-architectures.md)。
- **DSH 维护者**：读 [21 原生数据面](./20-native/21-native-data-landscape.md) 与 [22 历史](./20-native/22-native-data-history.md)；[31–36](./30-external/31-external-community-patterns.md) 是 DSH 外部生态研究（核心仓之外的插件与服务），不是 DSH API 合同。

## 章节地图

31–33 是单插件数据模式与案例；34–36 是 profile 交付形态、装配状态与证据。

| 文件 | 内容 |
|---|---|
| [00-question](./00-question.md) | 原始问题与范围 |
| [00-answer](./00-answer.md) | 摘要答案与问题索引 |
| [10 概念层](./10-foundations/10-taxonomy.md) | Profile 与数据卡 |
| [11 存储机制](./10-foundations/11-five-homes.md) | 内容、Session history、插件状态、派生与 Client state |
| [12 状态存储](./10-foundations/12-state-homes.md) | Storage domain、Config、credentials |
| [13 作用域与键](./10-foundations/13-scope-and-keys.md) | Session、产品 project、Workspace、profile、home、device |
| [14 产物](./10-foundations/14-artifacts.md) | `present`、changes、attachments、spill、export |
| [15 产品空间](./10-foundations/15-four-spaces.md) | Bundle、用户目录、产品状态与设置的 owner |
| [16 首次启动](./10-foundations/16-startup-resolution.md) | DSH Web 首用与产品目录选择 |
| [17 配置与工具](./10-foundations/17-config-layers.md) | Patch、runtime settings、tools 与 sandbox policy |
| [18 安装升级](./10-foundations/18-install-upgrade.md) | Profile、升级、兼容与卸载 |
| [21 原生数据面](./20-native/21-native-data-landscape.md) | DSH 数据机制与 API 来源 |
| [22 原生历史](./20-native/22-native-data-history.md) | DSH 存储能力的决策背景 |
| [31 社区模式](./30-external/31-external-community-patterns.md) | 社区插件的数据做法（九个维度、18 种手法） |
| [32 产品设计](./30-external/32-external-ecosystem.md) | 产品型外部插件的八组数据结构 + 20 个目录样本；六个缺口 |
| [33 外部插件](./30-external/33-external-plugin-patterns.md) | 15 个案例；具体依赖需单独审核 |
| [34 profile 形态](./30-external/34-profile-product-forms.md) | 八种交付方式与逐卡机制 |
| [35 装配所有权](./30-external/35-profile-assembly-ownership.md) | 四层状态、身份、更新、接管、进口、资产 |
| [36 样本台账](./30-external/36-profile-evidence-ledger.md) | 逐样本证据、采用信号与未验证项 |
| [90 主线](./90-advisor/00-index.md) | Profile 文件、启动顺序、Kanban 运行和数据归属 |
| [91 数据卡](./90-advisor/91-checklist.md) | 数据事实、装配/发行、实现和退出检查 |
| [92 参考架构](./90-advisor/92-native-reference-architectures.md) | 数据用途、DSH 能力、隔离与维护 |
| [93 Kanban 文件例子](./90-advisor/93-app-plugin-walkthrough.md) | Profile JSON、bundle JSON、preset YAML 和 Session request |

## 证据

**T** 可复现实验 · **C** 当前 DSH docs/types/implementation · **H** 历史记录 · **P** 未实现提案 · **S** 第三方源码阅读 · **R** 第三方 README/作者声明 · **U** 未确认。S/R/U 不建立 DSH API 或外部依赖的兼容性保证。

34–36 用 `[SRC]`/`[DSH]` 分别对应 S/C；`[TEST]`/`[CI]` 表示读过测试/CI 记录但未执行；`[RUN]` 表示本轮没有运行。

Profile/template 的局部实验见 [05](./40-evidence/experiments/05-profile-bundle-install.md)。证据来源见 [reference](./40-evidence/reference.md)、[research-native](./40-evidence/research-native.md) 和 [research-external](./40-evidence/research-external.md)。[Quality review](./40-evidence/quality-review.md) 是历史审查记录，不是当前行为的 owner。

## 范围

- 本目录不设计多租户、跨机器同步或统一对象存储。
- 产品自建目录、settings 和 onboarding 由产品承担备份、迁移与删除责任。
