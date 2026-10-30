# 26 · 插件即产品：先分清四个空间，再决定安装、启动与数据归属

这不是一份"插件点评合集"，而是一张给**产品型插件作者**和 Agent 用的决策图。当 DSH 实例的用途由一个插件决定时，问题不再是"数据放哪"，而是"这个实例由哪些空间组成、启动时根从哪来、模型能写哪儿、用户改的东西记在哪"。

![四个空间与所有权](./figures/00-ownership-matrix.svg)

## 30 秒结论

1. **一个产品型实例 = 一份 profile 组合 + 一个 workspace 根 + 一份 home 级账本与全局设置。** 装什么、在哪干、记住什么，三件事分开看。
2. **四个空间各有权威**：插件包只读、workspace 可写、账本可重建、全局设置跟 home。
3. **可写性来自 preset 的工具面，不来自 workspace。** workspace 只给侧栏一行、会话 `cwd` 和沙箱可写根。
4. **启动时没有用户可问**：目录解析落成四状态，弹窗在客户端连上之后；先登记占位才能挡住 `<Documents>` 默认工作区。
5. **用户选目录后，目录零写入、profile 零写入。** 知识只在 `$DSH_HOME` 与浏览器本地；marker 是产品选择。
6. **配置五层，patch 是整对象替换。** 只覆盖一个键会把该行其余键打回 schema 默认。

## 原生 vs 扩展：五级依赖

| 级别 | 是什么 | 长期策略 | 发布含义 |
|---|---|---|---|
| **N0 原生核心** | docs + 核心包 + 测试定义的 Service/事件/格式 | 首选，直接依赖 | 随 DSH 发行，最稳 |
| **N1 原生插件** | 官方随包：workspace、projcache、settings、credentials-local、session-query-sqlite、spill-local | 首选，直接依赖 | 跟 DSH 版本走，兼容成本低 |
| **N2 原生实验** | `packages/experimental/`，如 agent-team、claude-code-mods `$.store` | 只参考，不承诺稳定 | 可能改/撤，不写进发布依赖 |
| **E1 扩展插件** | 第三方社区插件/包 | **只借鉴模式，自己用原生 API 实现** | 不写进 `dependencies`；版本/许可证/卸载/供应链不受制于人 |
| **E2 外部服务** | MCP/HTTP/DB/对象存储 | 没有原生替代时短期用 | 运维/隐私/网络成本自负 |

## 一页决策画布

先填这九格，再翻到对应章节：

| 格 | 问题 | 去哪里找 |
|---|---|---|
| 工具面 | 模型要直接读写项目文件吗？ | [17 配置分层](./10-foundations/17-config-layers.md) |
| 空间 | 插件包 / workspace / 账本 / 全局设置？ | [15 四个空间](./10-foundations/15-three-spaces.md) |
| 启动 | 根从哪来？不在怎么办？ | [16 启动解析](./10-foundations/16-startup-resolution.md) |
| 权威 | 用户、会话、插件、没人（派生）、外部？ | [11 五个家](./10-foundations/11-five-homes.md) |
| 作用域 | 这次会话、这个项目、这个人、这台机器、这个安装？ | [13 作用域与键](./10-foundations/13-scope-and-keys.md) |
| 寿命 | turn、session、project、account、forever、rebuildable？ | [11](./10-foundations/11-five-homes.md) / [22](./20-native/22-native-data-history.md) |
| 读写者 | 模型、用户、插件、浏览器、没人？ | [11](./10-foundations/11-five-homes.md) |
| 配置层级 | 包默认 / profile / home / 产品全局设置？ | [17](./10-foundations/17-config-layers.md) |
| 删除/迁移 | 删了会不会丢？卸载留什么？ | [41 决策程序](./40-advisor/41-checklist.md) |

## 十一条原则

0. **先问工具面。** 模型要不要对项目目录用通用文件工具？不要，项目不必是 workspace；要，会话 cwd 必须落在项目里。
1. **先定承诺，再找 API。** 承诺 = 对用户说的话：我记住什么、在哪、删了/换机器/升级后还算不算数。
2. **一个事实一个家。** 副本、索引、缓存只能做派生；不能让两层都声称权威。
3. **用户内容不搬进你的域。** 只存路径、哈希、引用；内容留在用户能看见、能带走的地方。
4. **作用域先于存储。** session / workspace / profile / home / device 选错，换什么 API 都别扭。
5. **账本不是 workspace。** 账本目录一旦登记成 workspace，模型就能改写自己的记录。
6. **删除/保留是一等设计。** session 无删除 API、附件无 GC、插件无卸载契约；你必须自己回答"谁删、何时删、删不干净怎么办"。
7. **秘密只存引用。** 值走 `CredentialRef`/`CredentialKey`；文件权限挡其他用户，不挡同 uid 的模型工具。
8. **客户端分两层。** 纯 UI 状态用 `localStorage`/`userData`；session-derived 事实走 projection。
9. **原生优先。** N0/N1 首选；N2 只参考；E1 只借模式、自己实现，不写进 `dependencies`；E2 最后。
10. **迁移是数据设计的一部分。** 版本、兼容读、一次性迁移、失败可见、旧数据保留，四件事一起设计。

## Archetype 快速索引

| Archetype | 原生核心/插件（N0/N1） | 借用模式（N+，自己实现） | 扩展参考（E1/E2） | 细读 |
|---|---|---|---|---|
| **产品实例 / 配置根** | profile 组合 + workspace registry + `dataRoot` 文件 | 启动四状态、占位防抢占、账本路径键 | workspace-overlay | [15](./10-foundations/15-three-spaces.md) / [16](./10-foundations/16-startup-resolution.md) / [17](./10-foundations/17-config-layers.md) |
| 项目记忆 | 项目文件 + `ctx.fs` | journal+render、锁内备份 | project-context | [42 §1](./40-advisor/42-native-reference-architectures.md#1-项目记忆journal--render) |
| 个人长期记忆 | `ctx.storageDomain` / 项目文件 | 条目 id、确认队列 | memory-evolve、graphmemory | [42 §2](./40-advisor/42-native-reference-architectures.md#2-个人长期记忆home-ledger--sqlite--向量) |
| 会话归档/删除 | **GAP**（无 delete） | 宽限+审计 | archive-retention | [42 §3](./40-advisor/42-native-reference-architectures.md#3-会话归档--删除--保留) |
| KB/RAG | `ctx.storageDomain` + sqlite backend | 每 KB SQLite、软删/compact | kb-manager | [42 §4](./40-advisor/42-native-reference-architectures.md#4-知识库--rag) |
| 任务/目标 | session 事件/投影、home 域 | 状态机、跨标签同步 | task-board | [42 §5](./40-advisor/42-native-reference-architectures.md#5-任务--待办--目标状态) |
| 交付物 | 工作区文件 + `present` | 项目导出目录 | artifact 服务 | [42 §6](./40-advisor/42-native-reference-architectures.md#6-交付物--文档) |
| 渠道/账号 | profile patch + `ctx.credentials` | 去重/路由表 | 外部账号 DB | [42 §7](./40-advisor/42-native-reference-architectures.md#7-渠道--账号集成) |
| 每项目运行时 | **GAP**（无 per-workspace scope） | read-only 配置 + lease | workspace-overlay | [42 §8](./40-advisor/42-native-reference-architectures.md#8-每项目运行时) |
| 客户端 UI | localStorage / `SessionProjectionMap` | host 文件迁移、版本键 | beauty-persist | [42 §9](./40-advisor/42-native-reference-architectures.md#9-客户端-ui-状态) |
| 同步/备份 | `/export` ZIP | 用户 git、冲突三选一 | 外部同步服务 | [42 §10](./40-advisor/42-native-reference-architectures.md#10-同步--备份) |

## 按问题快速分流

| 你的问题 | 先读 | 再读 |
|---|---|---|
| 产品启动时目录从哪来、用户怎么选 | [16 启动解析](./10-foundations/16-startup-resolution.md) | [15 四个空间](./10-foundations/15-three-spaces.md) |
| 模型为什么写不了项目文件 | [17 配置分层](./10-foundations/17-config-layers.md) | [sandbox](docs/subsystems/sandbox.md) |
| 产品全局设置放哪、跨 profile 一致 | [17](./10-foundations/17-config-layers.md) | [12 状态的家](./10-foundations/12-state-homes.md) |
| 用户选目录后要留什么 | [15](./10-foundations/15-three-spaces.md) | [13](./10-foundations/13-scope-and-keys.md) |
| 用户要打开/编辑/带走一份文件 | [14 产物](./10-foundations/14-artifacts.md) | [42 §6](./40-advisor/42-native-reference-architectures.md#6-交付物--文档) |
| 跨会话统计/用量面板 | [11 历史家](./10-foundations/11-five-homes.md#历史家会话日志) | [21 原生 landscape](./20-native/21-native-data-landscape.md) |
| 项目级插件状态/索引 | [13 作用域与键](./10-foundations/13-scope-and-keys.md) | [41 例 1](./40-advisor/41-checklist.md) |
| API key / token | [12 状态的家](./10-foundations/12-state-homes.md) | [22 历史 §3](./20-native/22-native-data-history.md#3-凭据引用与记录分开) |
| 删除/保留/卸载 | [41 决策程序](./40-advisor/41-checklist.md) | [42 §3](./40-advisor/42-native-reference-architectures.md#3-会话归档--删除--保留) |
| 面板宽度/折叠/快捷键 | [11 客户端家](./10-foundations/11-five-homes.md#客户端家浏览器设备本地状态) | [42 §9](./40-advisor/42-native-reference-architectures.md#9-客户端-ui-状态) |

## 反模式 Top 10

- 把 workspace 当可写性来源（登记了目录就以为模型能写）。
- 把账本目录登记成 workspace（模型能改写自己的注册表）。
- 目录缺失就当空目录重建（物化未挂载的卷）。
- 把用户文件复制进 home 当真相。
- 把项目清单塞进 profile（profile 是安装单位，不是数据库）。
- 用 `workspaceId` 当长期键（删重加会换）。
- 把 `realpath` 直接当 `per-record` 键（含 `/`，会被拒绝）。
- 只在一个 profile 里改配置，或以为 `Config` 是深合并。
- 把客户端 localStorage 当共享状态/身份。
- 直接物理删 session 日志目录、或直接改 session 日志 header。
- 卸载不写清理说明（domain/dataRoot/marker/workspace 登记都可能残留）。

## 阅读路线

- **产品型插件作者（30 分钟）**：[00-answer](./00-answer.md) → [15 四个空间](./10-foundations/15-three-spaces.md) → [16 启动解析](./10-foundations/16-startup-resolution.md) → [17 配置分层](./10-foundations/17-config-layers.md) → [41 决策程序](./40-advisor/41-checklist.md)。
- **普通插件作者**：[00-answer](./00-answer.md) → [11](./10-foundations/11-five-homes.md) → [13](./10-foundations/13-scope-and-keys.md) → [12](./10-foundations/12-state-homes.md) → [41](./40-advisor/41-checklist.md)。
- **架构/维护者（2 小时）**：[21 原生 landscape](./20-native/21-native-data-landscape.md) → [22 原生历史](./20-native/22-native-data-history.md) → [42 参考架构](./40-advisor/42-native-reference-architectures.md)；外部只读 [31](./30-external/31-external-community-patterns.md)/[32](./30-external/32-external-adjacent-ecosystems.md)/[33](./30-external/33-external-plugin-patterns.md)。
- **Agent 要做一次数据决策**：直接读 [41 决策程序](./40-advisor/41-checklist.md) 的决策问题 + 数据卡，再按 archetype 跳 [42](./40-advisor/42-native-reference-architectures.md)。
- **只想看结论**：[00-answer](./00-answer.md)。

## Agent 使用方式（可直接照做）

1. **问第 0 问**：模型要不要对项目目录用通用工具？决定架构 I（工具中介）还是 II（workspace 化）。
2. **填画布**：工具面 / 空间 / 启动 / 权威 / 作用域 / 寿命 / 读写者 / 配置层级 / 删除迁移。
3. **过决策问题**：用 [41](./40-advisor/41-checklist.md) 逐条问，不要先选 API。
4. **选 archetype**：先看"产品实例 / 配置根"，再按需要看项目记忆、账本、会话归档等。
5. **写数据卡**：对每块事实重复，写清"在哪、谁删、卸载留什么、怎么迁移"。
6. **过反模式**：命中就回到第 1 步。
7. **标证据**：C/H/P/S/R/U；不要把 README 当合同。

## 目录结构

```text
26_plugin-as-product/
├── 00-index.md                 # 本文件：advisor 入口
├── 00-question.md              # 问题从哪来
├── 00-answer.md                # 一分钟结论 + 四空间 + 六承诺
├── 10-foundations/             # 11–17：基础词汇
│   ├── 11-five-homes.md
│   ├── 12-state-homes.md
│   ├── 13-scope-and-keys.md
│   ├── 14-artifacts.md
│   ├── 15-three-spaces.md      # 插件包 / workspace / 账本 / 全局设置
│   ├── 16-startup-resolution.md# 四状态、占位、弹窗时机
│   └── 17-config-layers.md     # 五层配置、整对象替换、工具面
├── 20-native/                  # 21–22：DSH 原生
│   ├── 21-native-data-landscape.md
│   └── 22-native-data-history.md
├── 30-external/                # 31–33：外部参考
│   ├── 31-external-community-patterns.md
│   ├── 32-external-adjacent-ecosystems.md
│   └── 33-external-plugin-patterns.md
├── 40-advisor/                 # 41–42：决策与骨架
│   ├── 41-checklist.md
│   └── 42-native-reference-architectures.md
├── 50-evidence/                # 证据
│   ├── 00-index.md
│   ├── reference.md
│   ├── research-native.md
│   ├── research-external.md
│   ├── quality-review.md
│   ├── v1/
│   └── v2/
└── figures/
```

## 章节地图

| # | 文件 | 作用 |
|---|---|---|
| 00q | [00-question](./00-question.md) | 问题从哪来、为什么不能一句话回答 |
| 00 | [00-answer](./00-answer.md) | 一分钟结论、两种实例、四个空间、六种承诺、启动与配置摘要 |
| 11 | [11 五个家](./10-foundations/11-five-homes.md) | 内容/历史/状态/派生/客户端 + 只读层 |
| 12 | [12 状态的家](./10-foundations/12-state-homes.md) | domain / settings / credentials |
| 13 | [13 作用域与键](./10-foundations/13-scope-and-keys.md) | session/workspace/profile/home/device + 键 |
| 14 | [14 产物](./10-foundations/14-artifacts.md) | present / changes / attachments / spill / export |
| 15 | [15 四个空间](./10-foundations/15-three-spaces.md) | 插件包 / workspace / 账本 / 全局设置 |
| 16 | [16 启动解析](./10-foundations/16-startup-resolution.md) | 四状态、占位防抢占、弹窗时机、三个风险 |
| 17 | [17 配置分层](./10-foundations/17-config-layers.md) | 五层配置、整对象替换、volatile、工具面 |
| 21 | [21 原生 landscape](./20-native/21-native-data-landscape.md) | 33 个 DSH 侧数据落点、12 archetype |
| 22 | [22 原生历史](./20-native/22-native-data-history.md) | 关键事件、数据簇、欠账 |
| 31 | [31 外部社区模式](./30-external/31-external-community-patterns.md) | 九个维度、十八种手法（E1 参考） |
| 32 | [32 外部生态对照](./30-external/32-external-adjacent-ecosystems.md) | VS Code / Obsidian / Claude Code 等 |
| 33 | [33 外部插件案例](./30-external/33-external-plugin-patterns.md) | 深度案例、反模式（E1 参考） |
| 41 | [41 决策程序](./40-advisor/41-checklist.md) | 决策问题 + 数据卡 + 反模式 + 测试 |
| 42 | [42 原生参考架构](./40-advisor/42-native-reference-architectures.md) | archetype 的数据卡与路线 |

## 术语

| 词 | 含义 |
|---|---|
| **四个空间** | 插件包（只读）/ workspace（可写）/ 账本（可重建）/ 全局设置（跟 home） |
| **工具面** | agent preset 挂了哪些工具行；决定模型能不能读写，而不是 workspace 决定 |
| **五个家** | 内容 / 历史 / 状态 / 派生 / 客户端；DSH 的抽象存储层 |
| **启动四状态** | configured / adopted / default / unresolved；决定启动时用哪个根、要不要问用户 |
| **占位工作区** | 启动时先登记的默认目录，用来让 DSH 首用默认工作区失效 |
| **账本** | 插件的索引、游标、会话绑定；应可重建，不是用户内容的权威 |
| **承诺** | 作者对用户说的话：记住什么、在哪、删了/换机器/升级后还算不算数 |
| **N0 / N1 / N2** | DSH 原生：核心合同 / 官方随包插件 / experimental |
| **E1 / E2** | 外部：社区插件 / 外部服务；只借模式，不作长期依赖 |

## 证据等级

**R** 运行时实测 · **C** 当前合同（docs/源码/测试） · **H** 历史事实（Note/旧文档） · **P** 提案（未实现） · **S** 第三方源码阅读 · **U** 未确认。

只有 C 能写成"DSH 现在如何"；H 只能写"当时如何"；P 不能当已实现；S/R/U 不能冒充合同。完整来源见 [reference](./50-evidence/reference.md) 与 [research-native](./50-evidence/research-native.md) / [research-external](./50-evidence/research-external.md)；本轮结构/一致性自查见 [quality-review](./50-evidence/quality-review.md)，v1/v2 历史见 `50-evidence/v1/`、`50-evidence/v2/`。

## 边界

- 单 Host、单 `$DSH_HOME` 账户；多租户/跨机器同步不在范围。
- 扩展插件没有安装实测；S 只代表源码阅读。
- 本仓库是浅克隆；2026-06 前历史靠 Note/docs 复述。
- 没有唯一答案；本目录给的是决策画布、参考架构和代价，不是教条。
