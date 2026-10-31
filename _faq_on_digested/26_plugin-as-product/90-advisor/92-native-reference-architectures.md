# 92 · 参考矩阵：机制、隔离与维护责任

> 主路线见 [90](./00-index.md)，Kanban 文件例子见 [93](./93-app-plugin-walkthrough.md)。本页比较具体机制和代价，不是必选架构清单。

## 依赖与自建机制

先确认目标 profile 可解析所需 API/provider。普通 dependency 不会自动加入 Cordis rows，但其他 patch 可以显式挂载该 plugin；只有要自动应用 package 自带的 `dsh.bundle.patch` 时，才须把它作为 bundle 选入 profile。产品可以使用 DSH package、维护中的外部 package，或自行实现所需机制。逐项检查版本、兼容范围、license、供应链和数据生命周期；仅阅读源码或 README 不能证明 package 已验证。外部 service 还要承担网络、认证、隐私和运维责任。

## 数据用途与机制选择

| 用途 | DSH 提供 | 产品要决定 | 不要假设 |
|---|---|---|---|
| 项目知识 | 项目文件、`ctx.fs`、skills | 文件格式、并发、仓库污染与信任 | home 副本会随项目移动 |
| 个人长期知识 | Storage domain、用户已有文件 | home 文件或 SQLite 的迁移、同步与删除 | Profile Config 跨 profile 共享 |
| Session 归档/删除 | Workspace archive 可隐藏；没有通用 Session delete API | 保留期、审计与 live Session 保护 | 物理删除 Session 是受支持 API |
| 知识库/RAG | Storage domain、SQLite backend | schema、重建、模型成本和不可信召回 | DSH 提供通用 RAG/向量索引 |
| 任务/目标 | Session events/projections、todo/goal/schedule packages | authority、重试、重建和通知 | 每个 profile 都启用同一 package |
| 交付物 | 用户文件、`present` | 可发现性、导出版本和留存 | Attachment/spill 是稳定交付物 |
| 渠道/账号 | Profile Config、`ctx.credentials` | owner、轮换、授权撤销和迁移 | `CredentialKey` 能像 env ref 一样解析 |
| 每项目 runtime | 无通用 Workspace plugin instance | 产品 scope/lease、信任、并发和崩溃恢复 | DSH 内建项目级 plugin instance |
| Client state | Browser storage、Session projections | origin、访问控制和清理 | localStorage 是账号级或跨设备存储 |
| 同步/备份 | Session export、项目文件 | 用户 git 或显式导入/导出、冲突和回滚 | Session export 会打包项目文件 |
| 产品 profile | Named profile + ordered bundle patches | home 共享和 provider override | Profile 名隔离同一 `$DSH_HOME` |

这张表比较用途和机制，不定义数据类别。每份事实的 Owner、Authority、Source、Scope/key 和 Retention 用[91 数据卡](./91-checklist.md)记录。

## Profile 数据隔离

Profile 选择 plugin composition 与 patch，不创建独立 home。先列出共享的 Harness stores、provider paths 和 browser-origin data：

| 方案 | 覆盖范围 | 隔离结果 | 仍需检查 |
|---|---|---|---|
| 共享 `$DSH_HOME` | 不覆写 provider paths | Harness home stores 按 provider 共享 | Session、Workspace registry、credentials、profile files |
| 选择性路径重定向 | 为 persistence/storage/attachment/credential/spill/search providers 配置不同路径 | 只隔离已覆写的 provider | `storage-json.root` 包括 Workspace registry 与 projection cache；未覆写的 home 文件和同 origin localStorage 仍共享 |
| 独立 `$DSH_HOME` | Launcher 为产品进程设置独立 home | 隔离大多数默认 home stores | 需重新配置 model/credentials/profile；同一 Web origin 的 localStorage 仍共享，服务端口也需安排 |

逐 provider 路径重定向不是统一的 DSH data-root 开关。还要检查默认写入 home 的 DeepSeek upload mapping 和 anonymous installation ID；若仍使用进程 `$DSH_HOME`，就会继续共享。按目标 package README/config catalog 核实，不能从几个 path overrides 推断完整隔离。

独立 `$DSH_HOME` 之外，也要检查 `DSH_AGENTS_HOME`、环境变量/代理、system temp 和 Client origin。隔离范围按每份数据的 Owner 验证。

## 产品目录与 Workspace

| 选择 | DSH 组合 | Session 初始 cwd | 适用场景 |
|---|---|---|---|
| 使用 DSH Workspace 导航 | Web 挂载 `dsh-workspace`、Workspace Controller 与 Client UI | Host 从 `workspaceId` 取得登记路径 | 需要项目侧栏、Session 分组或 Workspace operations |
| 只传 Session cwd | 使用 Session Controller，不登记 Workspace | 调用方传绝对 `cwd` | 产品已有目录选择 UI，不需要 DSH 分组 |
| 产品工具中介 | 按需组合；Workspace 可选 | 从 Session 或产品选择取得 | 模型不需通用文件工具，Host tool 自行校验读写范围 |

这些选择可以组合：Kanban 可用 DSH Workspace 导航项目，同时只给 Kanban preset 暴露产品 tool；也可不登记 Workspace，让 Session 以显式项目 `cwd` 使用带 policy 的通用工具。分别验证目录 Owner、Session 分组、tool visibility 和执行 policy。

## 边界

- 本页是参考矩阵，不是 DSH 要求实现的唯一设计。
- Bundle 是否进入 profile，取决于该 profile 的 bundle selection。
- 外部研究不是 DSH API 或 dependency 背书；具体 package/service 需单独审核。
