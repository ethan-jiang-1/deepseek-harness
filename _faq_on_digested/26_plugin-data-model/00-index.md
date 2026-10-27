# 26 · 插件数据架构 advisor：从“放哪”到“谁拥有、活多久、怎么删”

这不是一份“插件点评合集”，而是一张给插件作者和 Agent 用的**数据架构决策图**。先想清楚承诺，再选家、作用域、键和生命周期；DSH 没有唯一的“插件数据目录”，外部插件也不是答案，只是参考。

## 30 秒结论

1. **“数据放哪”是四个坐标**：谁拥有、关于谁、活多久、谁必须看见。
2. **一个事实一个家**：同一份事实只有一个权威；其他家只存引用、哈希或可重建副本。
3. **用户的东西留在用户处**：插件只拥有索引、游标、偏好、学到的事实和缓存。
4. **原生优先**：N0 核心 / N1 随包插件是长期依赖；N2 只参考；E1 外部插件 / E2 外部服务只借模式。
5. **没有唯一答案**：同一份数据往往有 3–5 条都成立的路；按承诺选，按代价维护。

## 原生 vs 外部，一眼看懂

| 级别 | 含义 | 长期策略 |
|---|---|---|
| **N0 核心合同** | docs + 核心包 + 测试定义的 Service/事件/格式 | 首选 |
| **N1 官方随包插件** | workspace、projcache、settings、credentials-local、session-query-sqlite、spill-local | 首选 |
| **N2 experimental** | agent-team、claude-code-mods `$.store` 等 | 可参考，不承诺稳定 |
| **E1 外部社区插件** | 第三方仓库/包 | 只借模式；短期用要写清依赖/迁移/卸载 |
| **E2 外部服务** | MCP/HTTP/DB/对象存储 | 没有原生替代时短期用 |

21 只放原生；33 只放外部，并给「外部模式 → 原生替代」；42 的路线表标 N0/N1/N+/E。

## 一页决策画布

先填这八格，再翻到对应章节：

| 格 | 问题 | 去哪里找 |
|---|---|---|
| 权威 | 用户、会话、插件、provider、没人（派生）、外部？ | [11 五个家](./10-foundations/11-five-homes.md) |
| 对象/作用域 | 这次会话、这个项目、这个人、这台机器、这个安装？ | [13 作用域与键](./10-foundations/13-scope-and-keys.md) |
| 寿命 | turn、session、project、account、forever、rebuildable？ | [11](./10-foundations/11-five-homes.md) / [22 历史](./20-native/22-native-data-history.md) |
| 读写者 | 模型、用户、插件、浏览器、没人？ | [11](./10-foundations/11-five-homes.md) |
| 敏感性 | 是否秘密？是否可上传？ | [12 状态的家](./10-foundations/12-state-homes.md) |
| 规模/频率 | 一次多大、多频繁、是否点更新？ | [12](./10-foundations/12-state-homes.md) |
| 可移植/同步 | 换机器/多设备/团队要带走吗？ | [42 参考架构](./40-advisor/42-native-reference-architectures.md) |
| 可重建/清理 | 删了会不会丢？卸载留什么？ | [41 决策程序](./40-advisor/41-checklist.md) |

## 十条 advisor 原则

1. **先定承诺，再找 API。** 承诺 = 对用户说的话：我记住什么、在哪、删了/换机器/升级后还算不算数。
2. **一个事实一个家。** 副本、索引、缓存只能做派生；不能让两层都声称权威。
3. **用户内容不搬进你的域。** 只存路径、哈希、引用；内容留在用户能看见、能带走的地方。
4. **作用域先于存储。** session / workspace / profile / home / device 选错，换什么 API 都别扭。
5. **删除/保留是一等设计。** session 无删除 API、附件无 GC、插件无卸载契约；你必须自己回答“谁删、何时删、删不干净怎么办”。
6. **秘密只存引用。** 值走 `CredentialRef`/`CredentialKey`；文件权限挡其他用户，不挡同 uid 的模型工具。
7. **客户端分两层。** 纯 UI 状态用 `localStorage`/`userData`；session-derived 事实（标题、模型、preset）走 projection，不能复制到 localStorage。
8. **原生优先。** N0/N1 首选；N2 只参考；E1/E2 只借模式，短期用要写清依赖、迁移、卸载。
9. **迁移是数据设计的一部分。** 版本、兼容读、一次性迁移、失败可见、旧数据保留，四件事一起设计。
10. **按代价选路。** 同一问题通常有 2–3 条都成立的路；不要找“唯一正确”，找“你能长期维护”。

## Archetype 快速索引

| Archetype | 原生首选（N0/N1） | 可借模式（N+） | 外部参考（E） | 细读 |
|---|---|---|---|---|
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
| 用户要打开/编辑/带走一份文件 | [14 产物](./10-foundations/14-artifacts.md) | [42 §6](./40-advisor/42-native-reference-architectures.md#6-交付物--文档) |
| 跨会话统计/用量面板 | [11 历史家](./10-foundations/11-five-homes.md) | [21 原生 landscape](./20-native/21-native-data-landscape.md) |
| 项目级插件状态/索引 | [13 作用域与键](./10-foundations/13-scope-and-keys.md) | [42 §1](./40-advisor/42-native-reference-architectures.md#1-项目记忆journal--render) |
| 个人偏好/默认值 | [12 状态的家](./10-foundations/12-state-homes.md) | [42 §7](./40-advisor/42-native-reference-architectures.md#7-渠道--账号集成) |
| API key / token | [12 状态的家](./10-foundations/12-state-homes.md) | [22 历史](./20-native/22-native-data-history.md) 的凭据部分 |
| 删除/保留/卸载 | [41 决策程序](./40-advisor/41-checklist.md) | [42 §3](./40-advisor/42-native-reference-architectures.md#3-会话归档--删除--保留) |
| 每项目一套 MCP/配置 | [13 作用域与键](./10-foundations/13-scope-and-keys.md) | [33 外部案例](./30-external/33-external-plugin-patterns.md) |
| 面板宽度/折叠/快捷键 | [11 客户端家](./10-foundations/11-five-homes.md) | [42 §9](./40-advisor/42-native-reference-architectures.md#9-客户端-ui-状态) |
| 要选一套架构 | [41 决策程序](./40-advisor/41-checklist.md) | [42 参考架构](./40-advisor/42-native-reference-architectures.md) |

## 反模式 Top 10

- 把用户文件复制进 home 当真相。
- 用 `workspaceId` 当长期键（删重加会换）。
- 把 `realpath` 直接当 `per-record` 键（含 `/`，会被拒绝）。
- 把 settings 当数据库（每次重写 profile patch）。
- 硬编码 `~/.dsh`（忽略 `DSH_HOME`）。
- 把客户端 localStorage 当共享状态/身份。
- 把插件状态塞进 session surface（模型上下文污染）。
- 直接物理删 session 日志目录（绕过投影缓存/附件/搜索索引）。
- 直接改 session 日志 header（破坏 append-only/租约/格式合同）。
- 卸载不写清理说明（domain/自造目录/凭据备份/localStorage 都可能残留）。

## 阅读路线

- **插件作者（30 分钟）**：[00-answer](./00-answer.md) → [41 决策程序](./40-advisor/41-checklist.md) → [42 参考架构](./40-advisor/42-native-reference-architectures.md) 对应 archetype。
- **架构/维护者（2 小时）**：[21 原生 landscape](./20-native/21-native-data-landscape.md) → [22 原生历史](./20-native/22-native-data-history.md) → [42 参考架构](./40-advisor/42-native-reference-architectures.md)；外部只读 [31](./30-external/31-external-community-patterns.md)/[32](./30-external/32-external-adjacent-ecosystems.md)/[33](./30-external/33-external-plugin-patterns.md)。
- **Agent 要做一次数据决策**：直接读 [41 决策程序](./40-advisor/41-checklist.md) 的十八问 + 数据卡，再按 archetype 跳 [42](./40-advisor/42-native-reference-architectures.md)。
- **只想看结论**：[00-answer](./00-answer.md)。

## Agent 使用方式（可直接照做）

1. **填八格**：权威 / 作用域 / 寿命 / 读写者 / 敏感性 / 规模 / 可移植 / 可重建。
2. **过十八问**：用 [41 决策程序](./40-advisor/41-checklist.md) 逐条问，不要先选 API。
3. **选 archetype**：在上面的快速索引里找最接近的一个；读 [42](./40-advisor/42-native-reference-architectures.md) 对应小节，至少比较两条路线。
4. **写数据卡**：用 41 的模板写清“数据在哪、谁删、卸载留什么、怎么迁移”。
5. **过反模式**：对照下面的 Top 10；如果命中，回到第 1 步。
6. **标证据**：C/H/P/S/R/U；不要把 README 当合同。

输出可以只有一页：数据卡 + 选中的路线 + 代价 + 未确认项。需要展开时再读 21/22/33。

## 目录结构

```text
26_plugin-data-model/
├── 00-index.md                 # 本文件：advisor 入口
├── 00-question.md              # 问题从哪来
├── 00-answer.md                # 一分钟结论 + 五种承诺
├── 10-foundations/             # 11–14：基础词汇
│   ├── 11-five-homes.md
│   ├── 12-state-homes.md
│   ├── 13-scope-and-keys.md
│   └── 14-artifacts.md
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
| 00 | [00-answer](./00-answer.md) | 一分钟结论、五种承诺、四种解法、快问快答 |
| 11 | [11 五个家](./10-foundations/11-five-homes.md) | 内容/历史/状态/派生/客户端 + 只读层 |
| 12 | [12 状态的家](./10-foundations/12-state-homes.md) | domain / settings / credentials |
| 13 | [13 作用域与键](./10-foundations/13-scope-and-keys.md) | session/workspace/profile/home/device + 键 |
| 14 | [14 产物](./10-foundations/14-artifacts.md) | present / changes / attachments / spill / export |
| 21 | [21 原生 landscape](./20-native/21-native-data-landscape.md) | 33 个原生家、12 archetype、N0/N1/N2 |
| 22 | [22 原生历史](./20-native/22-native-data-history.md) | 22 个关键事件、12 个数据簇、欠账 |
| 31 | [31 外部社区模式](./30-external/31-external-community-patterns.md) | 九个维度、十八种手法（E1 参考） |
| 32 | [32 外部生态对照](./30-external/32-external-adjacent-ecosystems.md) | VS Code / Obsidian / Claude Code 等 |
| 33 | [33 外部插件案例](./30-external/33-external-plugin-patterns.md) | 15 个深读、反模式（E1 参考） |
| 41 | [41 决策程序](./40-advisor/41-checklist.md) | 十八问 + 数据卡 + 反模式 + 测试 |
| 42 | [42 原生参考架构](./40-advisor/42-native-reference-architectures.md) | 10 个 archetype 的数据卡与路线 |
| — | [证据入口](./50-evidence/reference.md) | reference、research、review、quality review |

## 术语

| 词 | 含义 |
|---|---|
| **家（平面）** | 一个存储落点：内容 / 历史 / 状态 / 派生 / 客户端 / 外部 / OS 临时；每个家有权威、作用域和寿命 |
| **权威** | 冲突时谁说了算；一份事实只能有一个权威 |
| **派生** | 从权威算出来、丢了能重建的数据（投影、索引、缓存） |
| **承诺** | 作者对用户说的话：记住什么、在哪、删了/换机器/升级后还算不算数 |
| **N0 / N1 / N2** | DSH 原生：核心合同 / 官方随包插件 / experimental |
| **E1 / E2** | 外部：社区插件 / 外部服务；只借模式，不作长期依赖 |

## 证据等级

**C** 当前合同（docs/源码/测试） · **H** 历史事实（Note/旧文档） · **P** 提案（未实现） · **S** 第三方源码阅读 · **R** README/作者声明 · **U** 未确认。

只有 C 能写成“DSH 现在如何”；H 只能写“当时如何”；P 不能当已实现；S/R/U 不能冒充合同。完整来源见 [reference](./50-evidence/reference.md) 与 [research-native](./50-evidence/research-native.md) / [research-external](./50-evidence/research-external.md)；本轮结构/一致性自查见 [quality-review](./50-evidence/quality-review.md)，v1/v2 历史见 `50-evidence/v1/`、`50-evidence/v2/`。

## 边界

- 单 Host、单 `$DSH_HOME` 账户；多租户/跨机器同步不在范围。
- 外部插件没有安装实测；S 只代表源码阅读。
- 本仓库是浅克隆；2026-06 前历史靠 Note/docs 复述。
- 没有唯一答案；本目录给的是决策画布、参考架构和代价，不是教条。
