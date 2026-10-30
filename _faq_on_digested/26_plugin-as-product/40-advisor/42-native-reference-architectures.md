# 42 · 原生优先的参考架构：11 个 archetype 总览

## 这一篇回答什么

`11`–`14` 是词汇，`21`/`31`/`32`/`33` 是地图；这一篇是**总览与索引**：九格画布、依赖层级路线表、分篇链接与选型表。每个 archetype 的分篇给数据卡、布局/键、生命周期、失败模式、2–3 条都成立的路线、测试清单与 DSH API 映射。

原则：**没有唯一答案**；每条路线都标出代价与适用条件。一个插件可以组合多个 archetype，但每块数据只能有一个主权威。

**依赖层级（摘要；完整发布规则见 [41](./41-checklist.md)）**：

- **N0 原生核心**：`docs/` + 核心包 + 测试定义的 Service/事件/格式；首选，直接依赖。
- **N1 原生插件**：官方随包插件（workspace、projcache、settings、credentials-local、session-query-sqlite、spill-local 等）；首选，直接依赖。
- **N2 原生实验**：`packages/experimental/`；只参考，不承诺稳定。
- **N+ 借用模式**：用原生 API 自己实现某个外部模式；不是包依赖。
- **E1 扩展插件**：第三方社区插件；**只借鉴，不写进发布依赖**。
- **E2 外部服务**：MCP/HTTP/DB/对象存储；没有原生替代时短期用。

**发布规则**：依赖 E1 会把对方的版本、许可证、卸载和供应链绑进你的发布；除非没有原生替代，否则借它的模式、用 N0/N1 自己实现。

**阅读约定**：每节 A/B/C 中，标“外部”的 C 路线默认只作对照；原生能覆盖时不要选。下面的路线表不再逐个重复徽标，级别以下面的路线表为准。

![11 个 archetype 的参考架构路线](../figures/42-native-reference-architectures.svg)

## 0. 九格决策画布

先填这张画布，再选路线：

| 格 | 问题 |
|---|---|
| 工具面 | 模型要直接读写项目文件，还是只经插件工具？ |
| 权威 | 用户、会话、插件、provider、没人（派生）、外部？ |
| 对象/作用域 | 这次会话、这个项目、这个人、这台机器、这个安装？ |
| 寿命 | turn、session、project、account、forever、rebuildable？ |
| 读写者 | 模型、用户、插件、浏览器、没人？ |
| 敏感性 | 是否秘密？是否可上传？ |
| 规模/频率 | 一次多大、多频繁、是否点更新？ |
| 可移植/同步 | 换机器/多设备/团队要带走吗？ |
| 可重建/清理 | 删了会不会丢？卸载留什么？ |

## 依赖层级路线表（N0 / N1 / N+ / E1 / E2）

| Archetype | 原生核心/插件（N0/N1） | 借用模式（N+，自己实现） | 扩展参考（E1/E2） |
|---|---|---|---|
| 项目记忆 | 项目文件 + `ctx.fs`（N0） | journal+render、锁内备份 | 外部笔记/DB |
| 个人长期记忆 | `ctx.storageDomain`（N0）+ backend（N1），或项目文件（N0） | 条目 id、确认队列 | 外部记忆服务 |
| 会话归档/删除 | **GAP**（无 delete，**C**） | 借用 E1 模式：宽限+审计，自己实现 | archive-retention 等 |
| KB/RAG | `ctx.storageDomain`（N0）+ sqlite backend（N1） | 每 KB SQLite、软删/compact | 外部 RAG/向量 |
| 任务/目标 | session 事件/投影（N0）、home 域（N1） | 状态机、跨标签同步 | 外部任务库 |
| 交付物 | 工作区文件（N0）+ `present`（N1） | 项目导出目录 | artifact 服务 |
| 渠道/账号 | profile patch + `ctx.credentials`（N1） | 去重/路由表 | 外部账号 DB |
| 每项目运行时 | **GAP**（无 per-workspace scope，**C**） | 借用 E1 模式：read-only 配置 + lease，自己实现 | workspace-overlay |
| 客户端状态 | `localStorage`（平台，不是 N0）/ `SessionProjectionMap`（N0） | host 文件迁移、版本键 | 外部同步 |
| 同步/备份 | `/export` ZIP（N1） | 用户 git、冲突三选一 | 外部同步服务 |
| 产品实例 / 配置根 | profile 组合 + `workspaceRegistry` + `dataRoot` 文件（N0/N1） | 启动四状态、占位防抢占、账本路径键 | workspace-overlay |

## 分篇索引

| # | Archetype | 分篇 | 一句话 |
|---|---|---|---|
| 1 | 项目记忆 | [01](./architectures/01-project-memory.md) | journal 权威、Markdown 渲染；用户可读可提交 |
| 2 | 个人长期记忆 | [02](./architectures/02-personal-memory.md) | home 账本或 SQLite；跨项目经验与画像 |
| 3 | 会话归档 / 删除 | [03](./architectures/03-session-archive.md) | **GAP**：无删除 API；归档 + 保留期 |
| 4 | 知识库 / RAG | [04](./architectures/04-knowledge-base.md) | 每 KB SQLite 或项目文件；软删 + compact |
| 5 | 任务 / 待办 / 目标 | [05](./architectures/05-tasks-goals.md) | session 事件/投影，或 home 域 |
| 6 | 交付物 / 文档 | [06](./architectures/06-deliverables.md) | 工作区文件 + `present`；不要用附件库当交付 |
| 7 | 渠道 / 账号 | [07](./architectures/07-channels.md) | profile patch + 凭据引用；一账号一 profile |
| 8 | 每项目运行时 | [08](./architectures/08-per-project-runtime.md) | **GAP**：无 per-workspace scope；lease 自建 |
| 9 | 客户端 UI 状态 | [09](./architectures/09-client-ui.md) | localStorage / projection；分两层 |
| 10 | 同步 / 备份 | [10](./architectures/10-sync-backup.md) | 用户 git 或导出 ZIP；冲突三选一 |
| 11 | 产品实例（配置根） | [11](./architectures/11-product-instance.md) | profile 组合 + workspace 根 + home 账本；三种架构 |

## 一张选型表

| 你的数据 | 首选（N0/N1/N+） | 次选（原生） | 最后/避免 |
|---|---|---|---|
| 项目约定 | 项目内 journal+render | 纯 Markdown | home 域 |
| 个人记忆 | home 文件/SQLite | 项目内文件 | 外部服务（除非原生 GAP） |
| 会话清理 | 归档+保留期 | 只归档 | 直接删日志 |
| 知识库 | 每 KB SQLite | 项目文件/等原生 | session log / 外部 RAG（除非 GAP） |
| 任务 | session 事件/投影 | home 域 | settings |
| 交付物 | 工作区文件+present | 项目导出目录 | 附件库/home |
| 渠道 | profile+credentials | 每账号 profile | 明文 key / 外部 DB（除非多租户） |
| 每项目运行时 | read-only 配置+lease | 自解析 | 默认 trust 仓库 |
| 产品实例 | profile 组合 + registry + dataRoot | 工具面取舍 | 把账本当 workspace |
| UI 状态 | localStorage | host 文件 | settings/domain |
| 同步 | 用户 git | 导出 ZIP | 自建云/外部同步（除非必要） |

## 边界

- 这些是参考架构，不是 DSH 合同；具体 API 以当前 docs/源码为准。
- 同一插件可以组合多个 archetype，但每块数据只能有一个主权威。
- 没有一种路线适合所有部署；按九格画布选，按代价维护。
- 分篇里的结论按 T/C/H/P/S/R/U 标注；未标注的是操作建议。
