# 15 · 四个空间：发布包、项目目录、插件状态与产品设置

## 这一篇回答什么

产品作者通常要安排四类资产：随 bundle 发布的默认内容、用户项目文件、插件自己的状态，以及产品运行时设置。本篇说明每类资产由谁拥有、哪些部分属于 DSH、以及卸载和换 home 时会发生什么。它不把 DSH Workspace registry 当作文件权限或产品项目数据库。

![四类产品资产：bundle、用户项目目录、插件状态与产品设置](../figures/15-four-spaces.svg)

## 四个空间

```text
发布 bundle（只读输入）     模板 / 默认 preset / bundled skills —— 随包版本更新
用户项目目录（用户拥有）    项目文件 —— 可由产品工具或获准模型工具读写
插件状态（插件拥有）        索引（可重建）+ 绑定/游标（可能不可重建）
产品运行时设置              作用域由产品选择：profile Config 或产品自建共享存储
```

这四个空间描述产品资产的所有权，不是 DSH 的四种原生存储 API：

| 空间 | 可能的机制 | 说明 |
|---|---|---|
| 发布 bundle | package files、Cordis patch、Client bundle | 安装包是默认资产来源；不要将运行时写入包目录 |
| 用户项目目录 | `ctx.fs`、模型文件工具或产品自己的工具 | 文件属于用户；是否可通过 DSH Web 分组取决于是否登记 Workspace |
| 插件状态 | `ctx.storageDomain`、会话/文件引用、产品自建目录 | 指明权威数据；状态与可重建索引分开 |
| 产品设置 | profile Config、volatile Settings，或产品自建文件/domain | 跨 profile 与 profile-local 是不同作用域；选择机制由产品决定 |
| Session 历史 | Session persistence | DSH 持久化会话，不等同于项目账本 |
| 浏览器状态 | browser storage | 仅适用于设备或 origin 级 UI 状态 |

## 发布 bundle：版本化输入

bundle 是 DSH 的发布与组合单位。它可带 Cordis patch 和依赖的插件包，也可带 Web client 插件。bundle 里的模板、默认配置和提示文本按发布版本提供；不要把可变用户数据写回安装包目录。

安装包能否加载由 profile composition 和兼容性检查决定。产品 bundle 可以依赖它实际组合的 plugin package；依赖声明意味着 package manager 安装该包，不会自动把任意普通包当作 profile layer。要贡献 Cordis rows，package 需声明 `dsh.bundle.patch`，并成为 profile bundle。

## 用户项目目录：不要与 DSH Workspace 混为一谈

用户项目目录是项目内容的权威位置。模型是否能直接操作这些文件，取决于其 preset 中的工具和这些工具使用的 filesystem/subprocess providers 与 policy。Host 插件自己的代码不会因为 Session sandbox 而自动受限；插件应通过明确的产品授权与目标路径规则控制写入。

DSH Workspace 是 Host 保存的一条目录登记，用于 Web 项目导航、Session 分组和 Workspace 操作。若只指定 Session 的工作目录，显式 `cwd` 更直接；若还要加入 DSH 侧栏分组，应引用已有 registration 的 `workspaceId`，让 Host 同时解析其 canonical path 并 attach Session。`WorkspaceId` 是这条 registration 的身份，不是文件路径，也不是产品长期 project ID。只传 `cwd` 不会自动创建 Workspace，因为登记还要有独立的 ID、标题、顺序和 Session account。路径输入应为绝对目录；Workspace create 要求目录已存在。Workspace registration 不提供文件读写 API、不赋予模型工具，也不拥有目录。

`header.cwd` 固定原始项目身份，并作为正常 sandbox policy 的默认 workspace 根。`workspace-write` 另允许平台临时目录；读取不由写入 fence 限制。`working_directory` 可改变有效工作目录，但不更改原始 Workspace membership 或 sandbox writable roots。删除 Workspace 只移除登记和分组关系；目录、文件与 Session history 保留。

## 插件状态：逐条区分权威与派生

插件状态可包含两类不同的数据：

| 类别 | 例子 | 丢失结果 | 建议机制 |
|---|---|---|---|
| 可重建派生 | 项目索引、内容哈希缓存、统计检查点 | 可重算，可能较慢 | 可重建的 per-record domain 或 cache |
| 权威插件状态 | 用户确认、同步游标、显式项目与 Session 绑定 | 可能丢失用户事实或进度 | `ctx.storageDomain`，或有 schema/迁移/卸载说明的产品自建存储 |

普通插件可先考虑 `ctx.storageDomain`；它提供 schema 校验和进程内单写链，但没有自动迁移、跨表事务或通用 per-workspace scope。JSON domain 的 `per-record` 键必须是 `[a-zA-Z0-9_-]+`。若产品需要可读文件、与设置一起备份或其他 domain 不适合的特性，可选择自建目录；这不是 DSH 提供的 plugin data-root 服务，产品需自担 schema version、迁移、并发、备份与清理。

不要假设 Workspace registry 带有产品属主或卸载钩子。registry 内的记录由 DSH 管理，产品只有在能可靠证明记录由自己创建时，才可考虑删除它；不能把“看起来属于产品”的路径当作授权删除的充分依据。

## 产品运行时设置：明确 profile 或共享作用域

DSH 的 `Config.volatile()` Settings 表单写回当前 profile 的 patch。它适合该 profile 自己的用户选项，不是跨 profile 的账号设置。

若多个 profile 要共享产品设置，产品需显式选择 home 级文件或 storage domain，并明确稳定的数据路径、读写入口、迁移与备份策略。`dataRoot` 是产品可以定义的 Config 字段名称，不是 DSH API；默认值可由产品指向 `$DSH_HOME` 下的目录。若 profile 将该路径配置成不同值，设置会分裂；同一 `$DSH_HOME` 不会自动合并或按产品过滤用户数据。

秘密使用 `CredentialRef` 表示环境变量名并在调用时解析；插件拥有的 OAuth grant 或多字段凭据使用 `CredentialKey` records API 读取和更新。两种接口不是同一个“resolve key”操作。避免把秘密明文写进 Config、domain、产品设置文件或日志。

## 归属与生命周期速查

| 事实 | 权威 | 常见位置 | 删除/迁移责任 |
|---|---|---|---|
| 出厂模板、默认 preset | bundle 发布版本 | package files | 随包升级；用户修改应写入其他空间 |
| 项目内容 | 用户 | 项目目录 | 用户决定；卸载产品不应擅删 |
| Workspace 登记 | DSH Workspace registry | DSH storage domain | `workspace.delete` 只删登记；产品不能声称它会删项目 |
| 项目索引 | 源文件或日志 | domain/cache/产品目录 | 派生数据可重建；清理规则由拥有者说明 |
| 项目/会话绑定、同步游标 | 插件 | domain/产品状态目录 | 迁移和卸载保留策略由产品说明 |
| 用户运行时选择 | 用户与产品 | profile patch 或产品共享存储 | 由选择的作用域决定是否跨 profile 保留 |
| 会话历史 | Session log | Session persistence root | 当前 DSH 没有 Session delete API；不要物理删除目录 |
| 浏览器布局状态 | 当前 browser origin | `localStorage` | 浏览器本地，换 origin/浏览器可丢；产品负责清理自己的 key |

## 边界

- DSH profile 是 plugin composition，不是数据隔离边界。
- Workspace registration 仅提供导航和分组数据；它不授予文件权限或拥有用户目录。
- `$DSH_HOME/<plugin>/` 可以作为产品约定，但没有 DSH 的配额、迁移或卸载清理保证。
- 本篇不承诺多租户隔离、跨机器同步或产品自建目录选择 API。
