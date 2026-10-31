# 92 · 参考架构：数据需求与维护责任

> 入口见 [90 动手](./00-index.md)；完整的 Web profile 走查见 [93](./93-app-plugin-walkthrough.md)。本篇给数据与集成问题作选型，不是安装清单或唯一架构规范。

## 这一篇回答什么

不同数据需求可能使用 DSH API、随附 package、产品自建机制或外部服务。先确认目标 profile 提供所需 API/provider，再决定实际依赖。

## 依赖与实现方式

若需要另一个 package 的 Cordis rows，该 package 必须以 bundle 方式选入 profile；普通 runtime dependency 本身不会加入 rows。DSH 不要求产品只用原生 package。产品可以依赖维护中的外部 package，也可以自建所需机制；应评估具体版本、license、供应链、兼容范围和数据生命周期。仅读过社区源码或 README 时，不能把其行为写成已验证的 DSH API。外部 service 还需要网络、认证、隐私和运维责任。

## 数据用途与组合模式

本表列出常见用途的 DSH 能力、产品选项和需验证的假设；每份实际事实的 owner、scope/key 和生命周期见 [91 数据卡](./91-checklist.md)。

| 数据用途 | 可用机制 | 还需决定 | 不要假设 |
|---|---|---|---|
| 项目知识 | 项目文件、`ctx.fs`、skills | 格式、并发、仓库污染与信任 | Home 副本会随项目移动 |
| 个人长期知识 | Storage domain、用户已有文件 | home file/SQLite 的迁移、同步和删除 | Profile Config 跨 profile 共享 |
| Session archive/delete | Workspace archive 用于隐藏；没有通用 Session delete API | 保留期、审计、live Session 保护 | 物理删除 Session 是受支持 API |
| Knowledge base/RAG | Storage domain、SQLite backend | schema、重建、模型成本、不可信召回 | DSH 提供通用 RAG/向量索引 |
| Tasks/goals | Session events/projections、todo/goal/schedule packages | 权威状态、重试、重建和通知 | 每个 profile 都启用同一 package |
| Deliverables | 用户文件、`present` | 可发现性、导出版本和留存 | Attachment/spill 是稳定用户交付物 |
| Channels/accounts | Profile Config、`ctx.credentials` | owner、轮换、撤销和迁移 | `CredentialKey` 可像 env ref 一样 resolve |
| Per-project runtime | 无通用 Workspace plugin instance | 产品 scope/lease、信任、并发、崩溃恢复 | DSH 有内建项目级 plugin instance |
| Client state | Browser storage、Session projections | Origin、访问控制、清理 | localStorage 是账号级或跨设备 |
| Sync/backup | Session export、项目文件 | 用户 git 或显式 export/import、冲突和回滚 | Session export 包含项目文件 |
| Product profile | Named profile + ordered bundle patches | Home 共享与 provider override | Profile 名隔离同一 `$DSH_HOME` |

## 产品运行组合与数据隔离

profile 只决定 plugin composition 与 patch，并不创建独立 home。选择隔离方案时，说明其覆盖范围：

| 方案 | 配置范围 | 隔离程度 | 仍需说明 |
|---|---|---|---|
| **共享 `$DSH_HOME`** | 不覆盖 provider path | 共享 DSH home stores | sessions、Workspace registry、credentials、profile files 等按各自机制共享或并列存在 |
| **选择性路径重定向** | 为明确支持的 persistence/storage/attachment/credential/spill/search providers 设置不同路径 | 仅隔离已覆写的 providers | `storage-json.root` 包括 Workspace registry 与 projection cache；未覆写的 home 文件仍共享；浏览器同 origin 的 localStorage 仍共享 |
| **独立 `$DSH_HOME`** | launcher 为产品进程设置独立 home | 隔离大多数默认 home stores | 需重新配置 model/credentials/profile；同一个 Web origin 的 browser localStorage 不因 DSH_HOME 改变而隔离，服务端口也需单独安排 |

逐 provider 重定向不是统一 DSH data-root 开关。还应检查默认写到 home 的 DeepSeek upload mapping 和 anonymous installation ID；若它们仍使用进程 `$DSH_HOME`，就会继续共享。按目标 package README/config catalog 核实，不能从几个路径 override 推断完整隔离。

选择独立 `$DSH_HOME` 时，也应检查外部 `DSH_AGENTS_HOME`、环境变量/代理、系统 temp 和 Client origin 是否仍共享。安全边界需要按具体数据 owner 验证。

## 产品目录与 Workspace 集成选项

| 选择 | DSH 组合 | Session 初始 cwd | 适合 |
|---|---|---|---|
| 用 DSH Workspace 导航 | Web profile 挂载 `dsh-workspace`、Workspace Controller 与 Client UI | 通过 `workspaceId` 取登记路径 | 用户需要 DSH 项目侧栏、分组和 Workspace 操作 |
| 只用显式 Session cwd | Session Controller 可用，但不登记 Workspace | 由调用方传入绝对 `cwd` | 适合 Session 工作目录已由其他产品 UI/配置选择的场景 |
| 产品工具中介 | 按产品需要选择；Workspace 可有可无 | 可用项目目录或其他 Session 目录 | 模型不需要通用文件工具；Host 工具自行控制读写范围 |

这些选择可以组合。例如产品可以通过 DSH Workspace 导航用户项目，同时让 preset 只暴露产品工具；也可以不登记 Workspace，但让某个 Session 以显式项目 `cwd` 使用 sandboxed tools。请分别检查 directory ownership、Session grouping、tool availability 和 policy。

## 边界

- 这些是参考架构，不是 DSH 必须实现的唯一设计。
- 随附 package 是否出现在某个 profile，由该 profile 的 bundles 和插件行决定。
- 用数据卡记录最终 owner、scope/key 和保留规则；本页矩阵仅供选型参考。
- 外部样本只作 package 或设计模式选择参考，不是 DSH API 合同。
