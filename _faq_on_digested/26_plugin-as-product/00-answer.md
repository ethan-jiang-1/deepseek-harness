# Answer 26 · 插件即产品：四个空间、一条工具面、一个启动状态机

## 一分钟结论

1. **一个产品型 DSH 实例 = 一份 profile 组合 + 一个 workspace 根 + 一份 home 级账本与全局设置。** 装什么、在哪干、记住什么，三件事分开看。
2. **可写性不是 workspace 给的，是 preset 的工具面给的。** workspace 只提供侧栏一行、会话 `cwd` 和沙箱可写根；模型能不能 `read`/`write`/`bash`，取决于 agent preset 挂了哪些工具行。
3. **启动时没有用户可问。** 目录解析只能落成四个状态（configured / adopted / default / unresolved），弹窗发生在客户端连上之后；启动时先登记一个占位工作区，才能挡住 DSH 自己的 `<Documents>` 默认工作区。
4. **用户选目录后，DSH 目录里零写入、profile 里零写入。** 知识只在 `$DSH_HOME`（workspace registry + 会话）和浏览器 `localStorage`；要不要在目录里留 marker，是产品决策。
5. **配置有五层，且 patch 是整对象替换。** profile patch 只写一个键，会把该行其余键打回 schema 默认值；产品默认值必须进 schema/代码默认。

## 两种实例

| | 客人（普通插件） | 主人（插件即产品） |
|---|---|---|
| 谁装谁 | 用户把它装进自己的 DSH | 它决定这个 DSH 装什么 |
| 组合 | 一行插件 | 一份 profile（bundle 链 + patch） |
| 目录 | 借用用户的工作区 | 自己的 workspace 根（默认或用户指定） |
| 数据 | 借宿主的家 | 账本 + 全局设置自成一套 |
| 升级 | 宿主升级 | 产品自身版本 + profile 组合 |

两种都存在，但读物不同。本篇主讲"主人"，[11–14](./10-foundations/11-five-homes.md) 的通用词汇仍然适用。

## 四个空间

| 空间 | 权威 | 放什么 | 谁写 | 删了会怎样 |
|---|---|---|---|---|
| **插件包** | 发布版本 | 模板、种子、预设、客户端 bundle | 只读（发布时） | 出厂能力消失，用户数据不动 |
| **workspace** | 用户 | 项目内容 | 模型（有工具时）或插件工具 | 删登记不删目录 |
| **账本** | 插件 | 索引、游标、会话绑定 | 插件 | 应能重建；重建不了说明它不是账本 |
| **全局设置** | 插件 | 渲染节点、默认风格、品牌素材 | 产品 UI | 换机器就丢 |

细节与反模式见 [15](./10-foundations/15-three-spaces.md)。四者与"五个家"的映射也在那一篇。

## 可写性来自工具面

这是最容易说错的一格：

| 模式 | preset 挂了什么 | 谁写项目文件 | workspace 的作用 | 沙箱 |
|---|---|---|---|---|
| **工具中介** | 插件自己的工具 | 插件 `node:fs` | 数据根 + 侧栏入口 | 不相关 |
| **开放 agent** | 加 `tool-fs` / `tool-bash` | 模型直接写 | 沙箱根 + 真正的读写边界 | 决定一切 |

本机的 `deck-studio` preset 只有 `persona` + `deck-studio-tools`，没有 `tool-fs`/`tool-bash`；那个已绑定会话的 cwd 在 `/Users/bowhead/ai_dsh_deep_research`，与 deck 项目目录无关，落盘全部由插件工具完成。**R**

所以：把 deck 目录登记成 workspace，不会让模型多出任何能力；要"像常规 harness 一样可读可改"，得先在 preset 里加工具，再让会话 cwd 落在项目里。

## 六种数据承诺

"承诺"是作者对用户说的话，不是存储 API。选定承诺，位置和键自动收敛；同一插件可以组合多种承诺，但**每一块数据只能有一个主承诺**。

| 承诺 | 一句话 | 数据在哪 | 主要代价 |
|---|---|---|---|
| **P0 纯引用** | 我不存，只读你已有的文件 | 用户的文件原地 | 无法保证存在/格式；不能"学习" |
| **P1 会话派生** | 我不存聊天，只算统计/索引 | 会话日志 + 可重建检查点 | 依赖日志/投影 API；回填有成本 |
| **P2 用户可见文件** | 数据跟项目或用户目录走，用户可见 | `<workspace>/…` 或用户全局文件 | 仓库污染、手改、多人冲突 |
| **P3 宿主账本** | 我按项目记，但东西在我这 | `$DSH_HOME` + 稳定路径键 | 孤儿、换机器丢、用户看不见 |
| **P4 账号/安装配置** | 配一次，所有项目生效 | profile 配置 / home 域 / 凭据 | profile 不是账号；一个默认值套所有项目 |
| **P5 产品实例** | 这个 DSH 就是我的产品 | profile 组合 + workspace 根 + 全局设置 | 升级、隔离、启动编排；见 [16](./10-foundations/16-startup-resolution.md)/[17](./10-foundations/17-config-layers.md) |

（原来提到的"每项目一套运行时"不是数据承诺，是运行时缺口，不在 P0–P5 之列。P2 有两个根：项目内文件删项目就没；用户全局文件跟 home 走，插件只读。）

![所有权与作用域](./figures/00-ownership-matrix.svg)

## 启动解析：四个状态

```text
configured（profile 指定） → 用；缺失则 mkdir
adopted（用户上次选的）    → 用；缺失则重新问，不重建
default（$DSH_HOME/<plugin>/workspace）→ 用；缺失则 mkdir
unresolved                → 登记占位，等客户端弹窗
```

**为什么不能开机弹窗**：目录选择器是客户端交互能力（native 在宿主显示器、browse 供远端），Host 启动时没有浏览器连着。**为什么要占位**：客户端只在"registry 为空且无会话"时自动建 `<Documents>/deepseek-harness/default-workspace`；先登记一个占位，这条路径就失效。

三个风险（细节见 [16](./10-foundations/16-startup-resolution.md)）：Loader 并发启动导致占位与首连有竞态；`session.create` 的 `mkdir -p` 会物化未挂载的卷；registry 全 home 共享，产品的工作区会出现在通用 `web` 侧栏。

## 配置五层与整对象替换

```text
包默认（bundle patch） → profile patch → home patch → --patch
                                    产品全局设置：dataRoot 下的文件（跨 profile）
```

- 产品全局设置**不能**放 home patch：它会 insert 进每个 profile，或在不含该行的 profile 上每次启动告警。
- profile patch 的 `config` 是**整体替换**（`target[key] = value`），不是深合并；只覆盖一个键会让其余键掉回 schema 默认。**C**
- 要跨 profile 一致的字段**不要**做成 `.volatile()`：volatile 写回当前 profile 的 patch，会让"全局"按 profile 分裂。
- 鸡生蛋边界：解析 `dataRoot` 依赖的配置不能放进 `dataRoot` 的文件。

完整规则与检查清单见 [17](./10-foundations/17-config-layers.md)。

## 用户选目录后，留什么、记在哪

| 载体 | 记了什么 | 跨机器 | 污染目录 |
|---|---|---|---|
| DSH workspace registry | 这个目录是一个工作区 | 否 | 否 |
| 插件账本 | 这是我哪个项目、什么游标 | 否 | 否 |
| 目录内 marker | 我是谁 | **是** | 是 |

DSH 自己**不写目录、不写 profile**；"要不要留 marker"是产品在"可携带"与"不污染"之间的取舍。推荐：账本为主判别，marker 只在必须跨 home 携带时引入。

## 承诺 → 空间 → 作用域 → API

| 承诺 | 主空间 | 作用域 | 主要 API | 卸载后 |
|---|---|---|---|---|
| P0 纯引用 | 内容（只读） | 用户给的路径 | `Config` + `ctx.fs` | 原文件不动 |
| P1 会话派生 | 派生 + 历史 | session（可聚合到 workspace） | `ctx.sessionProjections` / `ctx.sessionQuery` | 检查点可丢 |
| P2 用户可见文件 | 内容 | workspace / 用户全局 | `ctx.fs` + `present` | 跟项目/仓库 |
| P3 宿主账本 | 状态 | workspace 键（存 home） | `ctx.storageDomain` 或自造文件 | 留孤儿，需清理 |
| P4 账号配置 | 状态 + 凭据 | profile / home | `Config.volatile()` / `credentials` | 随 profile 或 home |
| P5 产品实例 | 全部四个空间 | profile + workspace + home | bundle patch + registry + dataRoot | 三处都要写清理说明 |

## 产品作者六问

按真实设计顺序问：

1. **用户第一次启动我，要准备什么目录？** 能不能零配置？默认目录放在哪？
2. **我承诺记住什么？** 出厂资产、项目内容、账本、全局设置，各是哪一块？
3. **用户在哪里看见、编辑、带走、删掉它？** 项目里？设置页？根本看不见？
4. **他有 30 个项目时，我怎么知道是哪个？** 键是什么？目录移动了怎么办？
5. **启动时目录不在、换机器、换 home、升级，分别怎么办？** 重建还是重新问？
6. **他凭什么信任我？** 我会不会改写自己的账本、复制他的文件、把密钥写进日志？

这六问的答案，就是你的数据卡。

## 选型：第 0 问 + 七问

```text
0. 模型要对项目目录用通用文件工具吗？
   不要 → 工具中介：项目不必是 workspace，账本/工具自洽
   要   → 开放 agent：会话 cwd 必须落在项目里，沙箱约束全部生效
1. 用户已经有这份数据了吗？            是 → P0（引用它）
2. 能从会话/文件重新算吗？              是 → P1（派生）
3. 必须跟项目一起走/被用户看见吗？      是 → P2（项目内文件）
4. 只在浏览器里用、模型不必知道吗？     是 → 客户端本地
5. 要跨会话记住、但用户不必编辑吗？     是 → P3（home + 稳定键）
6. 是关于这个人/账号/安装的吗？         是 → P4（配置/凭据/home 单例）
7. 这个 DSH 由我决定装什么、从哪起步吗？ 是 → P5（产品实例）
```

注意顺序：**先问工具面，再问"存哪"。** 跳过第 0 问，最容易把"模型写不了"误诊成"数据放错了"。

## 反模式（产品视角）

- **把 workspace 当可写性来源**：登记了目录就以为模型能写；实际由 preset 决定。
- **把账本目录登记成 workspace**：模型能改写自己的注册表。
- **目录缺失就当空目录重建**：未挂载的卷会被物化出空目录，卷挂回来后被遮住。
- **把项目清单塞进 profile**：profile 是安装单位，不是数据库。
- **只在一个 profile 里改配置**：两个 profile 各改一次就分裂；要么用全局文件，要么明确按 profile 区分。
- **以为 `Config` 是深合并**：整对象替换，只写一个键会丢其余默认值。
- **用 `workspaceId` 当长期键**：删一次工作区就失联。
- **把 `realpath` 直接当 per-record 键**：JSON 后端要求 `[a-zA-Z0-9_-]+`，用哈希。
- **启动时重写用户目录**：只写不存在的东西。
- **卸载不写清理说明**：domain、dataRoot、marker、workspace 登记都可能残留。

## 快问快答

| 问题 | 短答 |
|---|---|
| 我的插件一定要有 workspace 吗？ | 不一定。模型只经插件工具读写时，项目目录不必成为 DSH workspace。 |
| workspace 决定模型能写吗？ | 不。决定权在 preset 的工具面；workspace 只给 cwd 与沙箱根。 |
| 启动时能弹窗让用户选目录吗？ | 不能。选择器是客户端交互能力，Host 启动时没有用户；客户端连上后再问。 |
| 用户选目录后 DSH 留什么？ | 目录零写入、profile 零写入；只写 workspace registry 与会话头，浏览器存当前选择。 |
| 产品全局配置放哪？ | `dataRoot` 下的文件（默认 `$DSH_HOME/<plugin>/`），跨 profile 一致。 |
| profile patch 能只写一个键吗？ | 不能。`config` 整对象替换，其余键会回落到 schema 默认。 |
| 能不能按 workspace 建 domain？ | 不能；domain 名静态，一个 Host 一个名字只能打开一次；项目级靠记录键。 |
| `workspaceId` 能当长期键吗？ | 进程内引用可以；删了重加会换 uuid，长期键不行。 |
| `per-record` 键能放路径吗？ | 不能；必须匹配 `[a-zA-Z0-9_-]+`，用 `sha256` 十六进制。 |
| 换 `DSH_HOME` 会带走什么？ | 新 home 没有旧 home 的域/配置/凭据/会话/工作区；项目文件还在。 |
| 卸载后留下什么？ | 视你写哪：domain、dataRoot、marker、workspace 登记都可能留；README 要写清。 |
| 两个产品实例共享一个 home 会怎样？ | 会话、工作区、凭据共享，没有按 profile 过滤；要隔离就用独立 `DSH_HOME` 或重定向数据根。 |
| 原生还是扩展？ | N0 核心 / N1 随包插件首选；N2 只参考；E1 只借鉴、自己实现；E2 最后。 |

## 证据与边界

- **R（运行时实测，2026-10-30）**：`$DSH_HOME/storages/workspace.json` 为 domain `workspace` v2；已绑定会话头含 `cwd`/`agentPreset`/`sandbox/mode`/`approval/policy`；`deck-studio` 落盘全走 `node:fs`；profile 未覆盖 `deck-studio` 行。
- **C（源码/docs）**：workspace 子系统、会话创建与 cwd、`applyEntryPatches` 的整对象替换、config-editor 的完整写入、首用默认工作区的空 registry 条件、沙箱唯一可写根。
- DSH 机制入口：[workspace](docs/subsystems/workspace.md)、[sandbox](docs/subsystems/sandbox.md)、[filesystem](docs/subsystems/filesystem.md)、[settings](docs/subsystems/settings.md)、[persistence](docs/subsystems/persistence.md)。
- 社区材料（31–33）是外部、未独立验证的作者声明，不能当 DSH 的 API 合同。
- 单 Host、单 `$DSH_HOME` 账户；多租户、跨机器同步、对象存储不在本篇范围。
