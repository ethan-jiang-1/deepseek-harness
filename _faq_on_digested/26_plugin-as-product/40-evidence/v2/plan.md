# Plan v2 · 先广度建 landscape，再深度解释

> **编号为 v2 当时的编号**；重组后的编号见 [00-index](../../00-index.md)。

状态：**已执行（2026-10-27）**；结果见 08–11。执行偏差：外部插件不安装，探针降级为源码阅读 + 原生 `$DSH_HOME` 结构读数；文件按 native/external 重命名。
决策已按你的意思定下：**先广度，后深度；目标是 landscape，不是单一结论；预算足够，不再用问题打断你。** 下面把每一阶段的范围、样本量、模板、产出和检查点写细。

## 0. 最终要得到什么

一张能长期使用的 **DSH 插件数据 landscape**：

1. **全景图**：DSH 与社区插件里，数据到底落在哪些家、按什么作用域切、用什么介质、谁拥有、活多久。
2. **演进线**：DSH 自己为什么长成现在这样；哪些是刻意、哪些是欠账、哪些被否决过。
3. **市场层**：复杂插件在补什么缺口；哪些模式成熟、哪些是反模式、哪些只是某个作者的权宜。
4. **参考架构**：8–10 个 archetype 的“数据卡 + 布局 + 生命周期 + 失败模式 + 测试清单”，每个给 2–3 条都成立的路线。
5. **决策画布**：不是一棵“正确树”，而是八格权衡，让作者按承诺选路。

最终读者是插件作者，也包括未来的 DSH 维护者：他们能查到“这个事实历史上怎么放、别人怎么放、为什么、代价是什么”。

## 1. Landscape 的七个轴

所有样本都按这七个轴归档，避免又写成“插件点评合集”。

| 轴 | 取值 |
|---|---|
| **家（home）** | 内容 / 历史 / 状态 / 派生 / 客户端 / 外部服务 / OS 临时 / 包目录 / 进程内存 |
| **作用域** | session / workspace / profile / home / device / external |
| **权威** | 用户 / 会话 / 插件 / provider / 无（派生） / 外部 |
| **寿命** | turn / session / project / account / forever / rebuildable |
| **可见/可编辑** | 模型 / 用户 / 插件 / 浏览器 / 没人 |
| **介质** | 文件 / journal / KV domain / SQLite / 向量 / settings / credentials / localStorage / 外部 API |
| **成熟度** | L0 核心合同 / L1 experimental / L2 社区模式 / L3 反模式 / L4 缺口 |

另有两张派生表：

- **样本 × 家**：每个插件/子系统用了哪些家，形成热力图；
- **模式 × 成熟度**：每个模式被多少样本验证、是否值得抄。

## 2. 证据等级

| 等级 | 含义 | 能写成什么 |
|---|---|---|
| **C** | 当前合同：`docs/` + 当前源码 + 测试 | “DSH 现在如何” |
| **H** | 历史事实：当时的 Agent Note / 旧文档 / commit | “当时如何、为什么” |
| **P** | 提案：`proposed/` 未实现 | “曾计划/仍未实现” |
| **S** | 第三方源码阅读，未运行 | “这个插件源码里如何” |
| **R** | README/作者声明，未核源码 | “作者声称” |
| **U** | 无法确认 | 开放问题 |

规则：C 才能当现状；H 不能冒充 C；P 不能当已实现；S/R/U 不能写成 DSH 合同。

## 3. 阶段总表

| 阶段 | 工作 | 主要产出 | 检查点 |
|---|---|---|---|
| **0. 基线** | 建模板、冻结 v1 结论、列假设 | `plan-v2` + 模板 | 你 review 本计划 |
| **1A. DSH 广度** | 1275 篇英文 Note 标题/摘要 triage；343 个包过滤；67 篇 subsystem、49 篇 persistence、43 篇 upgrade guide 扫读 | `landscape-v0` 的 DSH 半张表 | 我看数量与覆盖 |
| **1B. 市场广度** | 13,882 条目录中抽 150 个候选；README 关键词扫描；50 个中等阅读 | `landscape-v0` 的市场半张表 | 我看候选分布 |
| **2. Landscape v0** | 合成第一张全景图：家 × archetype × 成熟度 × 缺口 | `08-native-data-landscape.md` 初稿 | **你 review 全景图** |
| **3A. DSH 深度** | 12 个数据簇；深读约 40 篇 Note/文档 | `09-native-data-history.md` | 你抽查 3 张决策卡 |
| **3B. 插件深度** | 15 个复杂插件；数据卡、设计理由、失败模式 | `10-external-plugin-patterns.md` | 你抽查 2 个案例 |
| **3C. 运行时探针** | 5 个插件在隔离 `DSH_HOME` 观察写入/卸载残留 | 探针记录（并入 10） | 我看隔离与清理 |
| **4. 综合** | 模型压力测试、参考架构、产品缺口 | `11-native-reference-architectures.md` + 修订 01–05 | 你 review 模型变更 |
| **5. 收尾** | 图、索引、证据表、门禁 | 全部交付 | 自动检查 |

预计 10–14 个工作块；每个检查点都可以停。先广度后深度是硬顺序，不在广度完成前开深读。

## 4. 阶段 0：基线、模板、假设

### 4.1 冻结 v1 的结论

把第一轮的 14 条 review、五个家、五种承诺、四种解法、15 种社区手法列成一张“待复核清单”。每条标：

- 当前证据等级；
- v2 要验证/推翻/补充什么；
- 若不成立，影响哪些章节。

### 4.2 模板

**A. 数据家卡（DSH / 插件通用）**

```text
id:
名称:
物理位置:
拥有者/服务:
权威:
作用域:
寿命:
可见/可编辑:
介质与格式:
写路径:
读路径:
迁移:
删除/GC:
跨进程/并发:
秘密:
证据等级:
证据:
备注:
```

**B. 插件候选卡（广度扫描用）**

```text
plugin:
repo:
category:
declared DSH version:
last push:
data signals（README 关键词）:
homes[]:
authority:
scope:
medium:
sync:
migration:
cleanup:
design docs:
complexity 0–3:
evidence S/R/U:
shortlist?:
```

**C. Note 决策卡（历史深读用）**

```text
note:
date/status:
问题:
旧方案:
新方案:
否决的替代:
理由:
影响的家:
当前状态 C/H/P:
证据:
```

**D. 深度案例卡**

```text
插件/子系统:
它解决的用户问题:
数据卡（A）:
布局/键:
生命周期:
失败模式:
设计理由（作者原话/ADR）:
与 DSH 合同的偏差:
可迁移模式:
不要抄的部分:
```

## 5. 阶段 1A：DSH 广度

### 5.1 目标

在深读任何一篇之前，先回答“DSH 里到底有多少个数据家、多少条相关设计、哪些包在读写数据”。产出是**清单**，不是结论。

### 5.2 范围与数量

- **343 个包**：按 README/package 名过滤出约 40 个数据相关包；读 README + 关键 `src/types.ts`。
- **1275 篇英文 Note**（298 implemented / 42 proposed / 925 archived）：先脚本抽 title、date、status、首段，做关键词 triage；预计 150–200 篇进入候选，40 篇深读。
- **67 篇 subsystem docs**：读 20 篇数据相关的（storage/session/workspace/attachment/spill/settings/credentials/deliverables/session-query/client/web-client）。
- **49 篇 persistence-changes**：全扫标题，读 15 篇与格式/迁移/字段相关的。
- **43 篇 upgrade guides**：筛出涉及路径、配置、数据迁移的约 15 篇。
- **4 篇 postmortem + 6 篇 defensive-patterns**：全读数据相关部分。
- **当前 `$DSH_HOME`**：只做结构统计（目录、文件类型、大小、mtime），不读内容。

### 5.3 搜索词

```text
storage, store, persist, session, log, workspace, cwd, home, DSH_HOME,
attachment, spill, deliverable, present, setting, settings.yaml, profile,
credential, secret, projection, cache, query, record, domain, sqlite,
jsonl, zstd, migration, export, import, backup, delete, retention, GC
```

### 5.4 产出

`_misc/_scratch/26-data-landscape/dsh-inventory.md`（暂存，最终并入 08）：

- 表 D1：数据家清单（约 25–35 行，字段用模板 A）。
- 表 D2：数据相关包清单（包 | 服务 | 家 | 读/写 | 证据）。
- 表 D3：Note 时间线（date | title | status | 家 | 一句话）。
- 表 D4：数据相关 docs 清单。
- 表 D5：本机 `$DSH_HOME` 结构统计。

## 6. 阶段 1B：插件市场广度

### 6.1 目标

先建立**候选池**，不急着评价。要看到 13,882 条目录里“数据复杂”的插件分布在哪些类别、哪些架构。

### 6.2 目录与来源

- `awesome-deepseek-harness-plugins` 的 11 个分类（UI 2657、主题 503、会话 886、记忆 441、工具 4027、技能 1049、工作流 778、通知 504、模型 830、开发 1643、娱乐 564）。
- `dshbase.com` 的 15 类与“verified”列表（只作线索，不作质量证据）。
- GitHub topic `dsh-plugin`。
- npm registry/包页（若可用；上次 403 就跳过，不硬刚）。
- 插件自带的 `docs/`、ADR、issue/discussion。

### 6.3 抽样设计

不做排行榜 Top N，做**分层配额**：

| 层 | 扫描数 | 说明 |
|---|---|---|
| 目录候选池 | 300 | 按分类、关键词、最近推送、README 数据信号挑 |
| README 扫描 | 150 | 抓 raw README，抽数据关键词与声明版本 |
| 中等阅读 | 50 | README + package.json + 源码树 + 关键文件 |
| 深度阅读 | 15 | 数据卡 + 设计理由 + 失败模式 |

分类配额（150 扫描）：

- 会话与消息 30（归档、删除、回滚、导入、分享）
- 记忆 30（文件、SQLite、向量、图谱、分层）
- 工作流/自动化 20（任务、状态、定时、协作）
- 工具与能力 15（文件、文档、产物）
- 通知与集成 15（渠道、账号、去重、默认 workspace）
- 开发与运行时 15（每项目运行时、MCP、配置、备份）
- UI/客户端 15（localStorage、面板状态、输入历史）
- 模型/账号/安全 10（凭据、多租户、加密、导出脱敏）

### 6.4 广度扫描怎么做得动

- 优先用已抓到的 awesome 目录条目（含 repo URL、描述）建候选表；不逐个打开网页。
- 用 `gh api`（若已认证）或 raw README 批量取文本；限速、缓存到 `_misc/_scratch/26-data-landscape/readmes/`，不提交原始大文件。
- 对每个 README 只抽：版本声明、数据路径/介质关键词、是否有迁移/同步/锁/清理/加密、是否有设计文档。
- 不安装、不执行；广度阶段零运行时代码。

### 6.5 产出

`_misc/_scratch/26-data-landscape/market-candidates.md`：

- 表 M1：150 个候选（模板 B）。
- 表 M2：分类 × 数据信号分布。
- 表 M3：初步 shortlist 30（打分：数据复杂度 0–3、设计文档 0–2、架构差异 0–2、兼容性 0–2、证据可得 0–2）。
- 表 M4：明显同质/克隆的排除记录。

## 7. 阶段 2：Landscape v0（第一个检查点）

把 DSH 半张表与市场半张表合成第一版全景：

### 7.1 表 L1：archetype × 家

12 个 archetype：

1. 会话历史/transcript
2. 项目/工作区知识
3. 个人长期记忆
4. 任务/待办/目标状态
5. 设置/偏好
6. 秘密/凭据
7. 交付物/文档
8. 附件/媒体
9. 索引/缓存/分析
10. Agent 间消息/协作
11. 账号/租户/身份
12. 客户端/UI 状态

列：家、作用域、权威、寿命、可见性、介质、DSH 支持（L0–L4）、社区样本、缺口。

### 7.2 表 L2：插件 × 家热力图

行是 30 个 medium 样本，列是 9 个家；每格标“主/次/无”。看哪些家被频繁使用、哪些家没人用、哪些家被误用。

### 7.3 表 L3：模式 × 成熟度

把第一轮 15 种手法 + 广度中新发现的模式放进来，标：被多少样本使用、是否有反例、成熟度 L0–L4。

### 7.4 表 L4：时间线 v0

DSH 侧 30–50 个事件；插件侧只放“有代表性的架构出现时间”，不追求完整。

### 7.5 产出与检查点

`08-native-data-landscape.md` 初稿：全景表 + 5 条初步观察 + 10 个待深挖问题。

**检查点：你 review 这张图，确认深读名单与优先级。** 这是唯一必须停下来等你的点；之后按计划执行。

## 8. 阶段 3A：DSH 历史深读（12 个簇）

按“数据簇”读，不按文件顺序读。每簇产出决策卡 + 时间线 + 当前合同 + 未完成项。

| 簇 | 核心问题 | 主要 Note/文档 |
|---|---|---|
| 1. home 与 profile | `$DSH_HOME` 为什么单根？profile 为什么是配置边界？ | `single-harness-home-resolver`、`profile-plugin-bundles`、app-boot/profile 源码 |
| 2. settings | `settings.yaml` 为什么退场？profile patch 的边界？ | `user-settings-seam`、settings/config-editor 源码、upgrade guides |
| 3. credentials | 引用 vs 记录；为什么秘密不进 config？ | `credential-boundaries`、`credential-records`、`stored-credential-precedence` |
| 4. session persistence | 为什么 event-sourced、zstd、handle-based、无删除 API？ | `event-sourced-sessions`、`session-persistence`、`zstandard-jsonl`、`handle-based`、persistence docs |
| 5. session format | 版本世代、迁移、ignorable 事件、拒绝语义 | `session-log-version`、`released-session-format-migrations`、`retain-ignorable`、format catalog |
| 6. projections/query/cache | 投影、检查点、sessionQuery、SQLite 索引各自权威 | `session-projection-and-command-log`、`session-projection-mandatory-seam`、`unified-session-query`、`session-projcache` |
| 7. storage domain/workspace | 为什么通用 KV、为什么 workspaceId 短命、为什么 path 是 canon | `domain-kv-storage-and-workspace`、workspace docs、`project-session-directories` |
| 8. attachments | 为什么不可变、content-addressed、不 GC；为什么与 session 解耦 | attachment docs/README、image-offload、session-log-export |
| 9. spill | 为什么默认 OS temp、30 天清理、session owner | `tool-output-spill-files`、`local-spill-startup-cleanup`、spill docs |
| 10. deliverables | present 为什么只记路径；changes 为什么只活内存 | `present-workspace-source-files`、workspace-changes、deliverables docs |
| 11. client state | 为什么客户端状态不进 session；localStorage/userData 的边界 | client loading/ownership/locale docs、ui-shortcuts/shortcuts 源码 |
| 12. plugin records/experimental | 为什么 `plugin:` 只限 experimental；为什么没有插件数据根 | `retain-ignorable`、claude-code-mods `$.store`、plugin record 源码 |

每簇输出：

- 3–6 张决策卡（模板 C）；
- 一条“旧 → 新 → 为什么”；
- 当前合同（C）与历史（H）分开；
- 未完成/被降级项（P/U）。

## 9. 阶段 3B：插件深度（15 个）

广度 shortlist 后，按以下配额选 15；若某类在广度里没有合格样本，用备选补，不硬凑。

| 类别 | 深读候选（15 选） | 重点看 |
|---|---|---|
| 记忆/文件 | `dsh-memory-evolve`、`dsh-project-context`、`dsh-workspace-memories` | journal vs render、锁、备份、手改收编、两种存储位置 |
| 记忆/SQLite/向量 | `dsh-graphmemory`、`dsh-kb-manager`、`dsh-mnemon` | schema 迁移、索引重建、软删除/compact、分层 sources/view |
| 会话/归档/回滚 | `dsh-session-workspace-organizer`、`dsh-archive-retention`、`dsh-archived-chats` | 日志复制/改写、物理删除、保留期、ZIP 备份、回滚边界 |
| 导入/同步 | `dsh-codex-sync`、`dsh-claude-move` | 外部会话映射、幂等、冲突、ID 重写、迁移清单 |
| 协作/消息 | `dsh-agent-mailbox`、`dsh-conversation-link` | 持久消息、回执、线程、跨会话可见性、进程内 vs 持久 |
| 运行时 | `dsh-workspace-overlay` | 每 workspace scope、lease、trust、热重载、MCP 进程 |
| 账号/安全 | `dsh-config-export` 或 `dsh-accounts`/`dsh-auth-gate` | 导出脱敏、凭据、多租户隔离、备份/恢复 |
| 客户端 | `dsh_PromptRecall` 或 `dsh-chat-history` | localStorage/IndexedDB、按源/会话、卸载残留 |

若 15 个里有两个同构，换成备选：`dsh-memory-db`、`dsh-local-vector-memory`、`dsh-agent-messaging`、`dsh-checkpoint-rewind`、`dsh-token-usage-dashboard`、`dsh-session-folders`。

每个深读产出模板 D，并回答：

1. 它为什么不用 DSH 的通用 domain？（不能、不知道、还是不适合）
2. 它的权威/派生分层是否清楚？
3. 它怎么处理迁移、并发、删除、卸载？
4. 它暴露了 DSH 的哪个缺口？
5. 哪些能抄，哪些只是权宜？

## 10. 阶段 3C：运行时探针（执行偏差：降级为源码/原生结构读数）

**执行偏差（2026-10-27）**：按“长期原生、外部只借鉴”的方向，**不安装任何外部插件**。外部插件的“运行时探针”降级为源码阅读 + README 证据；原生侧只做 `$DSH_HOME` 结构读数。这样避免把参考变成依赖，也避免第三方代码执行风险。

原计划的 5 个候选（未安装）：

1. `dsh-memory-evolve`（文件树 + 锁 + git 同步）
2. `dsh-project-context`（项目内 journal + 锁 + 备份）
3. `dsh-graphmemory`（SQLite + 迁移表）
4. `dsh-workspace-overlay`（workspace scope + 热重载）
5. `dsh-archive-retention` 或 `dsh-archived-chats`（删除/保留/备份）

规则：

- `DSH_HOME=$(mktemp -d)`，独立 profile，无真实凭据；不连接外部服务。
- 只装已发布包或已读源码的本地包；不执行第三方 `postinstall`；遇到就停止并记录。
- 记录安装前/后的文件树、权限、大小、mtime；触发最小写入（不调用真实模型，用本地 fixture 或空会话）。
- 卸载后再记录残留；与 README 声明对比。
- 任何不确定/破坏性操作立即停止；不为了“跑通”而污染真实 home。

产出并入 `10`：探针表（插件 | 安装后新增路径 | 卸载后残留 | 与声明差异 | 证据等级）。

## 11. 阶段 4：综合

### 11.1 模型压力测试

用 30 个 medium + 15 个 deep 样本逐条检验：

- 每个样本能否放进“家 × 承诺”？不能的，是模型漏了家还是样本越界？
- 同一种存储为什么对应不同承诺？承诺是否真的决定 API？
- 双权威（git + 本地 journal、session log + 项目副本）是否合法？规则怎么改？
- 外部服务、OS temp、包目录、进程内存、IndexedDB 是否要升为独立家？
- 跨设备副本算不算第二权威？
- 五种承诺是否 MECE？哪些是组合？

产出：模型修订说明 + 反例表 + 新的“八格决策画布”。

### 11.2 参考架构（8–10 个）

每个给：数据卡、布局/表结构、键、生命周期、失败模式、测试清单、DSH API 映射、2–3 条都成立的路线。

1. 项目记忆（journal + render）
2. 个人长期记忆（home ledger / SQLite / 向量）
3. 会话归档与回滚
4. 知识库/RAG
5. 任务/待办/目标状态
6. 交付物/文档
7. 渠道/账号集成
8. 每项目运行时
9. 客户端 UI 状态
10. 同步/备份（git / export / external）

### 11.3 产品缺口

每条缺口要有市场证据 + 历史证据，标优先级：

- workspace state / per-project KV
- 稳定插件数据根（类似 `CLAUDE_PLUGIN_DATA`）
- 卸载/GC/保留契约
- cross-process revision
- 迁移模板
- 项目层 trust
- 任意 settings namespace（与 Config-backed 表单区分）

## 12. 阶段 5：写作、图、验证

### 12.1 章节

- `08-native-data-landscape.md`：全景图 + 表 L1–L4 + 初步观察。
- `09-native-data-history.md`：DSH 12 簇时间线 + 决策卡 + 开放项。
- `10-external-plugin-patterns.md`：15 个案例 + 模式库 + 反模式（外部探针降级为源码阅读）。
- `11-native-reference-architectures.md`：10 个 archetype + 决策画布 + 产品缺口。
- 修订 `answer.md`、`01`–`05`：补历史注脚、修正模型、加参考架构链接。
- `research-native-v2.md`：来源表、证据等级、未确认清单。
- `review-v2-native-vs-external.md`：本轮发现、改了什么、仍开放什么。

### 12.2 图

- `08-native-landscape.svg`：archetype × 家 × 成熟度。
- `09-native-timeline.svg`：DSH 数据家时间线。
- `10-external-market-map.svg`：15 个深读样本 × 家/架构。
- `11-native-reference-architectures.svg`：10 个 archetype 的权威/作用域/寿命矩阵。

### 12.3 验证

- 每条 C 结论有 docs/源码/测试；每条 H 有 Note/文档；P/S/R/U 标注。
- `node _faq_on_digested/verify.mjs`。
- `pnpm run doc-sync`。
- `pnpm run verify-repository-references`。
- SVG XML 解析 + `rsvg-convert` 目检。
- `git diff --check`。

## 13. 文件与暂存

最终文件在 `_faq_on_digested/26_plugin-data-model/`。
广度原始清单、README 缓存放 `_misc/_scratch/26-data-landscape/`，不提交大文件；最终只把合成表与来源表写进 FAQ。

## 14. 时间与预算

- 10–14 个工作块；广度约占 40%，深度 40%，综合/写作 20%。
- 每个检查点可停；不设硬截止。
- 若某类样本不足，宁可标“证据不足”，不硬凑。

## 15. 风险与停止条件

- **浅克隆**：早期历史只能靠 Note/docs；不能声称“从未存在”。
- **Note 过期**：H 必须与当前源码交叉；冲突时以 C 为准，并记录冲突。
- **插件不可运行**：很多钉旧 RC；源码阅读是主证据，探针是补充。
- **市场噪声**：克隆/刷星/计数不一致；按架构与设计文档选样。
- **探针风险**：第三方代码会执行；只在隔离 home、无凭据、已读源码时做；遇到安装脚本或不确定行为立即停止。
- **模型不收敛**：如果 30 个样本仍无法分类，保留反例与开放问题，不强行造“统一理论”。

## 16. 完成定义

- `08` 有完整 landscape 表；`09` 有 12 簇时间线；`10` 有 15 个案例；`11` 有 10 个参考架构。
- 30 个 medium + 15 个 deep 样本全部有数据卡与证据等级。
- 至少 8 条“DSH 缺什么”有历史 + 市场双证据。
- 旧章节与索引同步；所有门禁通过。
- 最终回答能一句话说清：“数据放哪”不是找 API，是在‘家 × 作用域 × 权威 × 寿命 × 可见性’里选一条可维护的承诺；没有唯一答案，但有可复用的参考架构。
