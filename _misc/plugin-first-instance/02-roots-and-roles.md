# 02 · `projectsRoot` 的五个角色，以及"这个 workspace 是不是我的"

`projectsRoot` 不是一个字段，是五个互不相干的角色共用一个名字。每个角色的消费者、权威和缺口都不同；混着谈就会得出"放哪都不对"的结论。

## 五个角色

| # | 角色 | 消费者 | 现有机制 | 缺口 / 现状 |
|---|---|---|---|---|
| **R1** | **发现根**：从这个目录找出有哪些"项目" | 你的插件 | 无。`readdir` 自己扫 | **GAP**：DSH 没有"从根发现项目"的概念 |
| **R2** | **注册根**：让 GUI 列出这些项目 | `ctx.workspaceRegistry` | 逐个 `create(path)`，canonical path 幂等，durable 顺序 | 有 API，无 root；扫出来的要自己对齐、自己排序 |
| **R3** | **会话根**：新会话在哪 | `sessionController.create` | `workspaceId → workspace.path`；否则 `request.cwd`；否则 `process.cwd()`（硬编码） | 默认值不可配；已建会话 cwd 不可改 |
| **R4** | **沙箱根**：模型能写哪 | `ctx.sandbox` / `fs-sandbox` | **唯一**：`SessionHeader.cwd` | 没有额外可写根；见 [03](./03-sandbox-roots.md) |
| **R5** | **插件数据根**：索引/游标/缓存放哪 | 你的插件 | `ctx.storageDomain`（`$DSH_HOME/storages`）或自造目录 | 可配但没统一作用域；要自己负责清理与迁移 |

关键点只有一句：**R3 和 R4 是同一个值。** 会话建在哪，模型就能写哪。R1/R2 只决定"看得见"，不产生任何写权限；R5 是插件自己的账本，和模型权限无关。

## 谁写、写在哪

| 角色 | 谁写 | 写在哪 | 用户能看见吗 |
|---|---|---|---|
| R1 | 插件 | 不落盘（每次扫）或派生索引 | 间接 |
| R2 | 用户在 GUI 点 / 插件调 registry | `$DSH_HOME/storages/workspace.json` | 是（侧栏） |
| R3 | 客户端选 workspace 时 | 会话日志 `header.cwd` | 是（会话目录） |
| R4 | 同 R3 | 同 R3（只读派生） | 是（模型上下文里会打印路径） |
| R5 | 插件 | domain / 自造目录 / 目录内文件 | 看选择 |

## 判别问题：插件怎么知道"这个 workspace 是我的"

用户可能在同一个 home 里既用通用 `web` 又用 `deckline`；registry 是全共享的。插件要认出自己的项目，只有四种依据：

| 依据 | 做法 | 稳定性 | 代价 |
|---|---|---|---|
| **前缀匹配** | `canonical(workspace.path)` 是否在 `canonical(projectsRoot)` 之下 | 目录移动就失效；rename 不变 | 零额外状态；最便宜 |
| **插件 domain 记录** | 采纳时写一条 `w_<sha256(realpath)>`，记录 path/title/纳入时间 | 目录移动失效；可带 `lastSeenAt` 清理 | 一份可重建账本；有孤儿 |
| **目录内 marker** | 目录里放 `.deckline/project.json`（或复用 `.dsh/`） | 跟目录走、跨机器可认 | 污染仓库；要用户同意；要考虑 gitignore |
| **会话头推断** | `sessionQuery.filterSessions({ kind:'cwd' })` | 只说明"用过" | 历史噪音；不能表达"这是我的项目" |

推荐起点：**前缀匹配做主判别，插件 domain 存派生索引**；只有"必须跨 home 携带"时才引入 marker。

## 权威冲突：扫描 vs 登记

如果 R1 每次启动都扫 `projectsRoot` 并 `create` 一遍，会立刻撞上两个语义问题：

1. **用户删掉的工作区会被复活。** `delete()` 只删登记，目录还在；下次扫描又加回来。
2. **顺序不稳。** `create` 每次都插到最前面；扫描顺序决定显示顺序，用户手动排过的顺序会被打乱（`insertBefore` 可修，但要自己维护）。

三种立场，必须选一个：

| 立场 | 行为 | 用户删工作区 | 新目录出现 | 适合 |
|---|---|---|---|---|
| **目录树权威** | 每次启动对齐目录树 | 下次启动复活 | 自动出现 | 产品完全拥有这个根 |
| **登记表权威** | 只在"首次/显式刷新"时扫描 | 保持删除 | 需用户点刷新 | 用户会整理自己的列表 |
| **混合 + 墓碑** | 扫描但记住被删的路径 | 不复活 | 自动出现 | 要"自动发现 + 尊重删除" |

墓碑需要插件自己的状态（domain 或目录内 marker），并且要定"什么时候清墓碑"（目录被删再重建算不算同一个）。这是 [04](./04-options.md) 里必须显式选择的一项。

## 与 FAQ 26 现有结论的关系

- **"profile 不是账号"** 仍然成立；但要补一句：**产品型 profile 是一个"实例"，它共享 home 的数据面**。
- **"没有 per-workspace 实例/数据家"** 仍然成立；`projectsRoot` 不改变这一点，它只是插件在记录键上的约定。
- **"`workspaceId` 不能当长期键"** 仍然成立；`projectsRoot` 场景下应当用 path 的哈希或目录 marker。
- 新增一条：**用户的目录在 DSH 里没有自描述锚点**，跨 home/跨机器携带必须由插件自己设计。

## 现实样本：插件其实需要三种根

`deck-studio` 的实现把"根"拆成了三层，这比单一 `projectsRoot` 精确得多，也值得抄：

| 根 | 字段 | 默认 | 装什么 | 谁写 | 用户可见 |
|---|---|---|---|---|---|
| **账本根** | `dataRoot` | `$DSH_HOME/deckline` | 注册表、会话绑定、事件、素材库、deck 工作目录 | 插件（node:fs） | 否（在 home 里） |
| **项目根** | `projectsRoot` | 空 = 内部 `decks/`+`projects/` | "新项目"的落盘位置 | 插件（node:fs） | 是（如果配到用户目录） |
| **单项目源根** | 每条 `sourceRoot` | 每个 deck 自己 | 受控源（只读引用） | 用户/外部 | 是 |

对照五个角色：

- R1 发现根 ≈ 项目根（扫描 `projectsRoot` 下的子目录）
- R2 注册根 = 账本根里的 `decks-registry.json`（**不是** DSH 的 `workspaceRegistry`）
- R3 会话根 = **无**：会话与项目的关联走 `session-bindings.json`，cwd 不参与
- R4 沙箱根 = 无意义：模型不直接写项目目录，写操作全部由插件工具中介
- R5 插件数据根 = 账本根

这带来一个非常重要的判断：**"插件即产品"不必然要把项目变成 DSH workspace。** 只要写操作全部由插件工具中介，项目目录可以完全在 DSH 的 workspace/沙箱体系之外。两种架构的取舍见 [04](./04-options.md)。
