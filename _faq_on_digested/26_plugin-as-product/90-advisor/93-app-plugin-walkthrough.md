# 93 · Web 产品 profile 走查：从 shipped template 到项目 Session

## 这一篇回答什么

本篇用假想的看板产品说明如何在 DSH Web profile 中加入产品 bundle、复用现有 Workspace UI，以及按项目启动 Session。产品代码和业务界面是示例；profile 命令、bundle 顺序、Workspace 与 Session 行为遵循 DSH 当前 API。

## 0. 示例决定

- 产品：Kanban Studio，让用户在一个项目目录中维护看板文件。
- 运行入口：`dsh --profile kanban`，profile 基于 shipped `web` template。
- 目录导航：复用 DSH 的 Workspace sidebar 和目录 picker；每个看板目录登记为一个 DSH Workspace。
- Session 工作方式：用户在一个 DSH Workspace 中创建 Session，因此调用使用 `workspaceId`，Host 取该 registration 的 path 作为初始 `header.cwd` 并 attach Session。
- 工具面：示例产品 preset 只暴露看板工具，不暴露通用 `tool-fs`/`tool-bash`；看板工具是运行在 Host 的产品代码，必须自行限制操作对象和写入权限。

本例没有自建项目目录选择 UI 或产品账本。若产品需要这些机制，应由产品定义 API、存储位置与生命周期。

## 1. profile 与 bundle 组合

profile 的 bundle 顺序为：

```text
@deepseek-ai/dsh-base
@deepseek-ai/dsh-web-app
<kanban product bundle>
```

后加入的 bundle 可按 row id 覆盖前面层的配置。产品 bundle 应将自己的依赖插件声明为 package dependencies；需要贡献 Cordis rows 时，bundle package 还要声明 `dsh.bundle.patch`。

### 初始化与安装

新的自定义 profile 经 `dsh plugin` 初始化时，默认只含 `dsh-base`。要得到 Web composition，可从 Web template 创建一个**尚不存在的新 profile**：

```sh
dsh --profile kanban --from-default-profile web --dump-default-config
```

该命令创建 `kanban` profile、复制 shipped Web bundle list 和空用户 patch，并打印默认组合，不启动 Web server。示例要求 `kanban` 是新 profile 名。若同名自定义 profile 已存在，该参数会删除并替换其 dependencies 与用户 patch；先备份或选用新名称。检查输出包含 `@deepseek-ai/dsh-base` 与 `@deepseek-ai/dsh-web-app`。

安装产品 bundle：

```sh
dsh plugin --profile kanban add <bundle-spec>
```

`<bundle-spec>` 是产品 bundle 的 registry package spec 或受支持的本地路径/link spec。成功后，CLI 将新的 bundle 加到 profile bundle list 末尾。CLI 命令只返回 package-manager 退出码，不返回 Plugin Manager 的 `ChangeResult.application`。完成 membership 变更后，重新启动该 profile：

```sh
dsh --profile kanban --no-open
```

Web listener、启动参数和部署配置按 [dsh-web-app README](../../../packages/bundle/web-app/README.md) 处理。使用 source checkout 启动前，先确认 Client artifacts 已 build；否则 Web startup 会因缺少 client bundle 失败，并提示在 checkout 执行 `pnpm run build`。Bundle install 若失败，应处理 pnpm 诊断，而不是假设 profile 已安装或已激活。

## 2. 使用 Workspace 选择看板目录

在 Web sidebar 选择 **Add workspace**，使用当前 composition 提供的 native picker 或 browse picker 选择一个已有看板目录。Workspace picker 通过 `workspace.create({ path })` 登记该目录；选择已有目录时，DSH 不会在目录内创建 marker 或产品索引。首次空 Web home 可能已创建 Documents 默认 Workspace；它是 DSH 默认项目入口，不是 Kanban 自己创建的记录。

产品工具以调用 Session 的 `header.cwd` 为项目工作目录。用户通过 DSH Workspace UI 创建 Session 时使用 `workspaceId`，所以 Host 以 registration 的 canonical path 设定初始 cwd 并 attach 到该 Workspace。若产品不需要 DSH sidebar/grouping，调用方可只传绝对 `cwd`；这会创建一个不属于 Workspace registration 的 Session。产品业务 project ID 与 `WorkspaceId` 是两个独立身份。

不要在产品工具里信任模型传入的任意路径。工具应从调用 Session 确认项目上下文，只接受该项目允许的操作，并通过合适的 filesystem API 写入。Host 插件代码不受 Session sandbox 自动限制。

## 3. 工具面选择

| 选项 | DSH composition | 影响 |
|---|---|---|
| 产品工具中介（本例） | 产品 preset 挂载 Kanban 工具，不挂通用写入工具 | 产品工具代码负责目标授权与写入；Session sandbox 不约束直接 Host `node:fs` 调用 |
| 通用文件工具 | preset 挂载 `tool-fs` 和/或 `tool-bash` | 每个工具的 provider/policy 决定可用操作；sandboxed 写入使用 Session 初始 cwd 为主根，另允许平台临时根 |
| 混合 | 产品工具和通用工具都可见 | 两种执行路径独立定义权限，不以一个路径的校验代替另一个 |

若要把模型写入限制在项目文件，不要仅因 Session 位于 Workspace 就宣称安全。确认 preset 不暴露绕过产品工具的通用写入工具，或为每种通用工具配置并验证其实际 policy。

## 4. 配置与作用域

下面是**产品自行定义**的字段分类示例，不是 DSH 内建字段：

| 产品选择 | 作用域 | 选项 |
|---|---|---|
| 是否启用 Kanban 工具行 | profile composition | 产品 bundle patch 或 profile patch |
| 默认看板视图 | profile-local 用户偏好 | 对应 `Config.volatile()` Settings 字段 |
| 跨 profile 的展示偏好 | product/home | 产品自建文件或由产品拥有的 home domain singleton |
| API secret | credentials | `CredentialRef` 表示环境变量名；插件拥有的授权记录用 `CredentialKey` records API |
| 当前看板项目 | Session/Workspace | 由选择的 Workspace 与 Session header cwd 表达；若产品需要自有项目身份，另定义产品 ID |

产品共享设置不能依赖 profile 名自动共享；自建设置路径也不是 `dataRoot` API。若多个 profile 要共享产品设置，配置为同一稳定路径，并记录完整备份和恢复规则。

Patch 优先级是 ordered bundles → profile patch → home patch → CLI overlays。每个后续 patch 对相同 entry 替换完整 `config`，不是深合并；Config schema defaults 是另一种默认值来源，不属于 patch 层。

## 5. 状态存储

本例只需要看板内容、可能的产品业务状态，以及 DSH 自身 Session/Workspace state：

| 事实 | 权威 | 候选机制 | 是否由 DSH 自动管理 |
|---|---|---|---|
| 看板文件 | 用户项目目录 | `ctx.fs` 或受控产品工具 | 文件由用户拥有；Workspace 删除不删文件 |
| DSH 项目登记与会话分组 | Workspace registry | `dsh-workspace` | 是；删除只移除 registration，不移除 Session history |
| 产品状态/用户操作记录 | 看板业务事实由产品定义 | `ctx.storageDomain` 或有迁移说明的产品存储 | 否；产品负责 schema、清理、导出和迁移 |
| 可重建看板索引 | 项目文件或其他权威事实 | storage domain/cache | 产品应可重建 |
| 会话记录 | Session event log | `SessionPersistence` backend | DSH 管理写入与读取；当前没有通用 Session delete API |

如果实现只需要读取看板文件并通过工具更新文件，不要另存一份内容副本作为权威。只在用户需求需要持久化业务状态时才增加产品账本。

## 6. 安装、更新与卸载

- **安装**：从 Web template 初始化 profile，安装产品 bundle，然后重启 `kanban` profile。
- **开发期本地安装**：可以用 CLI 支持的 `link:` package spec；构建产品 bundle 后重新启动 profile 验证。
- **更新**：CLI `dsh plugin update` 修改磁盘 bundle；重启该 profile 后应用新的 bundle membership。Web Plugin Manager 是另一条路径，会报告 `ChangeResult.application`，并可由 HMR 应用兼容的变更。
- **配置更新**：profile patch 编辑只影响 bundle 提供的默认 composition；设置页写入当前 profile volatile Config 时按 Settings contract 处理。
- **数据升级**：产品拥有的数据需要自己的 schema/version、备份、迁移失败与恢复规则。
- **卸载**：bundle removal 会移除 package dependency 和 bundle layer，不自动删除项目文件、产品状态文件或 Session history。DSH `workspace.delete` 只删除 Workspace registration；删除产品自己的内容前要按 owner、创建记录和用户意图验证。

## 7. 可复现检查与产品验收

当前 DSH composition 检查已在隔离 `$DSH_HOME` 下执行：Web template 初始化、fixture bundle 安装、manifest 顺序和 config dump 见[实验 05](../40-evidence/experiments/05-profile-bundle-install.md)。构建 Client artifacts 后，Web source server 也以隔离 profile 启动并返回 tokenized URL 的 HTTP 303；这不验证浏览器渲染或假想 Kanban 工具、数据行为。

以下是产品实现后的 acceptance criteria。实现 Kanban package、preset 和账本后，再于隔离 `$DSH_HOME` 下执行：

1. 用 Web template 初始化一个新 profile，确认默认层是 base + web-app。
2. 安装产品 bundle，再检查 `dsh --profile kanban --dump-config` 中的产品 rows 与 preset。
3. 构建 source Client artifacts 并启动 Web 页面；确认产品工具只在目标 preset 中出现。
4. 从 Workspace picker 添加项目并创建 Session；确认新 Session 的初始 `header.cwd` 对应选择的 Workspace path。
5. 用同一 profile 开两个项目 Session；确认产品数据按定义的 scope/key 区分。删除一个 Workspace registration 后，确认文件与 Session history 仍在。
6. 用临时 home、不同 home 和同 origin 的两个 profile 检查各类数据的共享范围。
7. 更新和移除 bundle 并重启；确认产品自建数据符合 README 所写的保留和删除规则。

## 边界

- 这是一个依据 DSH profile、Workspace 和 Session API 编排的 Web 示例；Kanban 产品 package、工具和配置字段是假想的，不代表仓库内存在同名实现。
- 本篇中的产品级工具、数据 scope 和迁移行为仍是验收目标；Kanban 实现不存在于本仓库，必须由产品实现后另行验证。
- Web Workspace picker、CLI profile manager 与 Plugin Manager 是不同入口；不要混用它们的 Remote 或返回类型。
