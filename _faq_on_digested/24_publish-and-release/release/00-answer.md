# Answer 26 · Harness 发行版：六轴、组合、目录与数据

## 一分钟结论

1. **要交付的是一份 Harness 发行版，不是“一个产品化的插件”。** DSH 里 `product` 指整台运行中的 dsh（[architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md#cordis)），所以交付单位必然是一整棵树：plugin 贡献能力，bundle 贡献可 patch 的 rows，profile 决定起哪个 app surface，发行版把这三类对象连同运行时、app surface、Harness home 与生命周期一起承诺出去。
2. **完整与可控是两个可证伪的判据。** 六轴（运行时、profile、patch 层、app surface、Harness home 与数据、生命周期）都有明确 owner = 完整；改任一条不用 fork DSH = 可控。缺轴的具体症状见 [10 六轴](./10-foundations/10-taxonomy.md)。
3. **profile 有三种控制态**：随包交付的模板名、自定义具名 profile（`--from-default-profile`）、application-owned profile（Desktop 保留的 `desktop`，`loadProfileDirectory` 加载且不经 CLI profile lookup）。控制态决定发行方与用户各能改多少，比“是不是发行版 profile”有用得多。
4. **每份事实分别记录 owner、authority、source、mechanism/path、scope/key、readers、writers、可重建性和保留责任。** 这些属性互不替代，不应合成一个分类标签。
5. **DSH Workspace 是 Host 侧目录登记。** 它服务项目导航与 Session 分组；创建 Session 时可选择 `workspaceId`，也可直接提供 `cwd` 而不登记 Workspace。
6. **模型权限来自可用工具与各工具的 provider/policy。** Workspace 不赋予模型文件操作；Host 插件代码也不自动受到 Session sandbox 约束。
7. **profile 不是隔离边界。** 同一 `$DSH_HOME` 中的 profile 可以共享 Session、Workspace registry、凭据与其他 home 数据；CLI 改变 bundle membership 后要重启 profile。
8. **交付路径有硬边界。** 应用内 Plugins 页是跨面安装入口；CLI `--profile` 面绑定（不能 `desktop`），面向 GUI 时仅 web 自动化；bundle 在 roster ≠ patch 生效（新增 row 用 `insert:`）；web 命令行归 `web-startup`，替换 provider 要重实现全部 web flags；session 创建与 UI 选中是两层（fresh 可能自动选最新 blank，returning 保持 current）；版本门在安装前拒绝。

## 六轴速查

| 轴 | 发行方必须定 | DSH 提供的机制 | 读回方式 |
|---|---|---|---|
| 运行时 | 谁提供 dsh、版本 floor、签名/更新责任 | 用户自带 CLI、Desktop 内置、Python wheel、源码树 | `dsh --version`、`engines.dsh` |
| profile | 用哪个模板、叫什么名、由谁拥有 | shipped template、`--from-default-profile`、application-owned profile | `$DSH_HOME/profiles/<name>/package.json` 的 `dsh.profile.bundles` |
| patch 层 | 哪些字段作默认、允许谁覆盖 | bundle patches → profile patch → home patch → `--patch`，整份替换 | `dsh --profile <p> --dump-config`、`skippedBundles` |
| app surface | 起哪个 surface、带哪些 client plugins | profile 选择 web/headless/sdk/sdk-minimal/acp | 启动日志的 `dsh web:` URL 或 runner 输出 |
| Harness home 与数据 | 哪些状态共享、哪些自建、卸载留什么 | storage domain、Workspace registry、Session log、`header.cwd` | 数据卡（[91](./90-advisor/91-checklist.md)）逐行读回 |
| 生命周期 | 装/更/卸的入口与数据清理责任 | Plugins 页、`dsh plugin`、bundle membership 变更后重启 | 安装结果三态：exit 0 → 依赖写入 → 进 `dsh.profile.bundles` |

## 本篇如何回答问题

[00-question](../question.md) 与下表列出 Q0–Q12 的主答位置。本文提供发行版与数据模型的摘要；具体 API 与机制由对应基础页、DSH package README 和源码拥有。

| 问题 | 摘要 | 展开 |
|---|---|---|
| Q0：发行版与数据卡如何区分？ | 六轴定 owner；数据卡逐项记录事实属性 | [10 六轴](./10-foundations/10-taxonomy.md) |
| Q1：交付单位是什么？ | 一份由选定 profile 启动、六轴各有 owner 的 Harness 发行版 | [FAQ 24](../answer.md)、[50](./50-lifecycle/00-index.md)、[90](./90-advisor/00-index.md) |
| Q2：资产放哪里？ | 发布包、用户目录、插件状态、设置与 Session history 由不同 owner 管理 | [15](./10-foundations/15-asset-owners.md) |
| Q3：目录怎样选择？ | DSH Web 有 Workspace 首用与 picker；发行方 root resolver 是自建机制 | [16](./10-foundations/16-startup-resolution.md) |
| Q4：配置如何生效？ | Patch 链按层覆盖完整 entry config；链外设置在更高层 | [17](./10-foundations/17-config-layers.md) |
| Q5–Q8：作用域、存储、凭据与产物 | 按数据 owner 与 API 分别选择 | [11–14](./10-foundations/11-storage-channels.md) |
| Q9–Q10：设计来源与 DSH 外部生态 | DSH 当前行为以原生证据为准；外部材料仅供参考 | [21–22](./20-native/21-native-data-landscape.md)、[31–37](./30-external/31-external-community-patterns.md) |
| Q11–Q12：安装与施工检查 | CLI 与 Plugin Manager 有不同更新结果；形态与装配见 34/35，装/起/配/首启见 37，安装/启动/命令行见 50，用 90–93 完成方案与验收 | [18](./10-foundations/18-install-upgrade.md)、[34](./30-external/34-profile-delivery-forms.md)、[35](./30-external/35-profile-assembly-ownership.md)、[50](./50-lifecycle/00-index.md)、[90–93](./90-advisor/00-index.md) |

## profile、bundle 与数据 owner

profile 是 Harness home 里的具名组装（[architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md#profiles-and-bundles)）；bundle 是发布 Cordis patch 和 package dependencies 的形式（[architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md#profiles-and-bundles)）。发行版的 package 可以提供 plugins、presets 和 Client plugins，但运行入口仍是 DSH 支持的 named profile。package 是否贡献 rows 取决于其 bundle manifest 和 profile 选择。

度量发行版的“完整度”时，不要给整份发行版套一个数据标签。对每份事实，用 [91 数据卡](./90-advisor/91-checklist.md) 分列 owner、authority、source、mechanism/path、scope/key、readers、writers、可重建性与保留责任。

## 数据归属

发行版 bundle、用户项目目录、插件状态和运行设置各有 owner；DSH Session history、Workspace registration 和 browser state 也各有自己的生命周期。详见 [15 资产 owner](./10-foundations/15-asset-owners.md) 与 [11 存储通道](./10-foundations/11-storage-channels.md)。

发行方自建 `$DSH_HOME/<plugin>/` 只是路径约定，不是 DSH 服务。发行方需自行说明迁移、备份和卸载责任。

## Workspace、Session 与文件权限

只指定 Session 工作目录时，传绝对路径 `cwd` 更直接；Session header 保存绝对初始目录。若还要加入 DSH Workspace 侧栏分组，才传 `workspaceId`：它引用一条含 title、顺序和 Session account 的 registration，Host 从记录取得 canonical path 并 attach Session。两者不能同时传。`WorkspaceId` 是 registration ID，不是路径或项目身份；它也不是权限 token。

`header.cwd` 是 Session 的原始项目身份，也是 sandbox policy 的默认 workspace root。`working_directory` 可改变后续相对操作目录，但不会修改初始 header、Workspace membership 或 sandbox writable roots。

Preset 决定模型可见的工具；具体 consumer/provider 决定文件操作如何执行。接入 sandbox 的 `workspace-write` 调用以 Session 根为主根，并允许平台临时目录；读取不由该写入 fence 限制。直接从 Host 插件代码写文件也不自动受该 fence 控制。故需分别回答：

- 模型能调用哪些文件或进程工具？
- 每种工具是否使用 sandbox policy？
- 发行版 Host 工具如何限制其写入目标？
- 项目导航是否需要 DSH Workspace？

机制详情见 [sandbox](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/sandbox.md)、[working-directory](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/working-directory.md) 与 [17](./10-foundations/17-config-layers.md)。

## DSH Web 首用与发行方目录选择

DSH Web Client 在 Workspace 与 Session 列表都就绪后，仅当 Workspace registry 为空且没有 Session history 时调用 `workspace.initializeDefault()`。Host 在其 Documents 目录下解析 `deepseek-harness/default-workspace`，由 Workspace registry 创建并登记该目录，再由 Client 创建或复用 blank Session。此流程不是发行方可配置的 `<dataRoot>/workspace` fallback。

Web 用户也可通过 Workspace picker 选择已有目录；native 与 browse capabilities 的差异见 [16](./10-foundations/16-startup-resolution.md)。发行方自建目录选择和保存由发行方维护，不是 DSH 服务。

但安装/首启还有一道更前面的门：`dsh web` 打印 token URL；无 token 且无有效 cookie 时 401，带 token 则 303 + 30 天 HttpOnly cookie 后进 SPA。原生**没有欢迎页/向导**；`settings.onboarding` 只是设置面板里一次一个的 step，且 `welcome-notice` 在 Desktop 不注册。第一次看到什么由发行版的 bundle/客户端插件回答，见 [37](./30-external/37-lifecycle-stages.md)。

选择目录后，DSH Web 的 Workspace domain 写入 `$DSH_HOME/storages/workspace.json`；Session 首次打开时以不可变 `header.cwd` 保存初始目录，Web Client 将当前 Session selection 写入该 browser origin 的 local storage。此流程不写 profile patch，也不会仅因选择而在项目目录生成 marker 或索引。若发行方另写 settings 文件，应列入备份、恢复和卸载说明。

## 配置与 patch

DSH 配置 patch 顺序为 **ordered bundle patches → profile patch → home patch → CLI `--patch` overlays**。后层对同一 entry 替换完整 `config`，不是 field-by-field deep merge。Config schema defaults 是缺省值来源，不是一个 patch layer；patch 中省略且 schema 未定义默认值的字段，不会从下层 bundle config 自动继承。

`Config.volatile()` Settings 写回当前 profile patch，不自动跨 profile 共享。跨 profile 的发行版设置应选择稳定的数据路径，并用发行方文件或发行方拥有的 home domain 保存；`dataRoot` 只是发行方自定义的字段名，不是 DSH API。若目标是隔离，需逐项核实哪些 providers 的路径已重定向、哪些 `$DSH_HOME` 文件仍共享。[17](./10-foundations/17-config-layers.md) 说明完整规则。

## 安装、升级、卸载

安装默认走**应用内 Plugins 页**：`dsh web` 与 Desktop 用同一句话，因为该服务没有 profile 参数。CLI `dsh plugin --profile <p>` 是面绑定：可管理 web/headless/sdk 等显式 profile，**不能** `desktop`；面向 GUI 的 CLI 只作 web 自动化，必须标"仅 `dsh web`"。

“装成功”有三个状态：pnpm exit 0 → dependency 写入 → 进 `dsh.profile.bundles`；只有第三个让功能存在。无 `dsh.bundle.patch` 的包在两条通道结果不同：CLI exit 0、roster 不变、只给 warning；应用内则以 `not-bundle` 失败并回滚 manifest。CLI 装完宿主不知道，必须重启；应用内装才可能返回 `restart-required`。

新建 Web 发行版 profile 时，若要 CLI 自动化，可从 shipped Web template 初始化，再加入发行版 bundle；GUI 用户不需要这一步。`dsh plugin` 不返回 Plugin Manager 的 `ChangeResult.application`；membership 变更后要重启 profile。

卸载 bundle 会移除依赖与 bundle layer，但不会自动删除发行方数据、用户项目文件、Workspace contents 或 Session history。`workspace.delete` 只删 registration。发行方负责记录并清理自有状态；对用户目录、Session logs 或同一 home 的共享数据，不能仅凭 profile/plugin name 就推断其所有权。[18](./10-foundations/18-install-upgrade.md) 说明生命周期责任。

## 证据与边界

- **T（2026-10-31，隔离 home 的 CLI web 自动化组合检查）**：从 Web template 初始化 `verify-kanban-web`，再通过 `dsh plugin` 安装本地 fixture bundle；manifest 中 bundle 顺序为 base、web-app、fixture。命令和实际结果见 [实验 05](./40-evidence/experiments/05-profile-bundle-install.md)。该检查证明 profile 初始化与 bundle 追加；不证明 Kanban 应用代码或 Web runtime 已实现。
- **C（DSH 当前合同）**：profile layer order、Workspace/Session create 语义、默认 Workspace eligibility、tool visibility 与 sandbox provider 行为均以对应 `docs/`、package README 和源码为准。
- **T（2026-11-01，50 的隔离实验）**：bundle patch insert、web-startup 拒绝自定义 flag/替换 provider、workspace/session create、engines 门、并发替换、无 bundle exit 0、home 供货失败；见 [50/90](./50-lifecycle/90-evidence.md)。
- 外部 plugin 章节中的 S/R/U 样本未作为 DSH API 依据。
- 本篇讨论单 Host profile 组合；不提供多租户或跨机器同步方案。
