# 10 · 六轴：一份 Harness 发行版由什么组成

## 这一篇回答什么

要交付的东西叫什么、由哪几块构成、每块由谁负责。先定六轴的 owner，再谈目录、工具和数据；数据卡逐块记录事实。

![发行版六轴与数据卡字段](../figures/10-taxonomy-flow.svg)

## 交付单位是 Harness 发行版，不是插件

DSH 里三个对象是三个种类，不是三个级别：

| 词 | 是什么 | 出处 |
|---|---|---|
| plugin | 向 Cordis 上下文贡献 service／event／effect 的单位；也是 patch 行 | [architecture](../../../docs/architecture.md#cordis) |
| bundle | Cordis rows 及其挂载代码的分发格式，声明 `dsh.bundle.patch` | [architecture](../../../docs/architecture.md#profiles-and-bundles) |
| profile | 存在 Harness home 里的具名组装：有序 bundle + 自己的 `cordis.patch.yml` | [architecture](../../../docs/architecture.md#profiles-and-bundles) |

三者单独都不构成 product。repo 里 `product` 指整台运行中的 dsh（"Every part of the product is a plugin"，[architecture](../../../docs/architecture.md#cordis)），所以交付单位必然是一整棵树。本目录把它叫 **Harness 发行版**：上面三类对象，加上运行时来源、应用面、home 策略和生命周期，作为一个交付承诺。

这解释了为什么"插件即产品"讲不通：一个 plugin 至多贡献六轴里配置层的一行，既不能拥有运行时，也不能拥有应用面和数据生命周期。

## 六轴

| 轴 | 发行方必须定 | DSH 提供的机制 | 读回方式 | 缺轴的症状 |
|---|---|---|---|---|
| **运行时** | 谁提供 dsh、版本 floor、签名与更新责任 | 用户自带 CLI、Desktop 内置精确运行时、Python wheel、源码树 | `dsh --version`；`engines.dsh` 在写依赖前拒绝 | 声明了 floor 却没检测；用户装低版本后装不上或装完才坏 |
| **入口 profile** | 用哪个模板、叫什么名、由谁拥有 | shipped template、`--from-default-profile`、application-owned profile | `$DSH_HOME/profiles/<name>/package.json` 的 `dsh.profile.bundles` | 装进 `web` 模板；用户重置模板后发行版消失 |
| **配置层** | 哪些字段作默认、允许谁覆盖 | bundle patches → profile patch → home patch → `--patch`，整份替换 | `dsh --profile <p> --dump-config`；`skippedBundles` | 默认值写成代码常量，部署改不动；或只给一项，让必填字段丢失 |
| **应用面** | 起哪个 surface、带哪些 client plugins | profile 选择 web／headless／sdk／sdk-minimal／acp | 启动日志的 `dsh web:` URL 或 runner 输出 | web 起得来，Desktop 里没有对应入口；client 插件只在一种面上注册 |
| **home 与数据** | 哪些状态共享、哪些自建、卸载留什么 | storage domain、Workspace registry、Session log、`header.cwd` | 数据卡（[91](../90-advisor/91-checklist.md)）逐行读回 | 用户以为卸载删干净了，数据还留在 home |
| **生命周期** | 装/更/卸的入口与数据清理责任 | 应用内 Plugins 页、`dsh plugin`、membership 变更后重启 | 安装三态：exit 0 → 依赖写入 → 进 `dsh.profile.bundles` | 文档写"可回滚"，实际没有命令级回滚 |

两句话判据：

- **完整** = 六轴都有明确 owner，没有一格写"默认应该有"。
- **可控** = 改任一条不用 fork DSH。发行版组合 DSH，不分叉 DSH；`controllable` 不是 `vendored`。

## 入口 profile 的三种控制态

入口 profile 不是一种东西，而是三种，控制权依次收紧（[app-boot README](../../../packages/boot/app-boot/README.md#profiles)）：

| 控制态 | 例子 | 发行方能改 | 用户能改 | 风险 |
|---|---|---|---|---|
| shipped template | `web`、`headless` | 只能建议，不能拥有 | 可整体重置 | 重置后发行版的 plugins 仍在 roster，但模板自己的 patch 层回到出厂 |
| 自定义具名 profile | `kanban`、`--from-default-profile web` | 拥有 bundle 顺序与默认 patch | 可覆盖 patch、增删 bundle | 用户覆盖后，发行方默认值不再是 effective config |
| application-owned profile | Desktop 保留的 `desktop` | 由应用独占 | 不经 CLI profile lookup | `dsh plugin --profile desktop` 被门禁拒绝；CLI 自动化够不到 |

发行方要先回答"我拥有哪一态"，再谈其他五轴；控制态选错，后面每一轴都要打补丁。

## 每块事实用一张数据卡

不要为一块数据选择一个标签代替完整描述。给每份事实分别记录 owner、authority、source (input/operation)、mechanism/path、scope/key、readers、writers、rebuildability 和 retention；这些属性可以同时成立，不是互斥类别。

使用 [91 的数据卡模板](../90-advisor/91-checklist.md) 作为唯一记录格式。后续页面解释数据卡涉及的 DSH 机制，不重复分类数据。

## 参考页

- 六轴里的 home 与数据：见 [11](./11-five-homes.md) 与 [12](./12-state-homes.md)。
- bundle、用户目录、插件状态与设置的 owner：见 [15](./15-four-spaces.md)。
- Session、项目根、DSH Workspace、profile、home 和 device 的生命周期/key：见 [13](./13-scope-and-keys.md)。
- 工具权限、目录和 patch：见 [16](./16-startup-resolution.md) 与 [17](./17-config-layers.md)。
- 配置层与生命周期的推荐做法：见 [50](../50-lifecycle/00-index.md)。

这些页面是查找不同机制的参考，不是固定实现管线。先定六轴 owner，再选择匹配的 API。

## 边界

- Profile 是 DSH composition，不是数据 scope、发布物或隔离边界。
- Workspace registration 不授予模型文件权限；Session cwd、有效 working directory 和发行方 project root 也不同。
- DSH 不提供通用 product data root、多租户隔离或跨机器同步；发行方自建的目录不是 DSH 服务。
- 外部社区材料提供设计参考，不定义 DSH API 合同。
