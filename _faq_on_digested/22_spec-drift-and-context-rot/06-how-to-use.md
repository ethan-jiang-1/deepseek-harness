# 06 · 使用手册：插件仓与传统应用各抄什么

前面五节回答「机理上有什么」。这一节回答「我该怎么用」。**DSH 主仓的治理不能照搬**（它的 Issue policy、CI 矩阵与发布流程服务的是它自己的规模），能搬的是机制；本节按「插件仓」和「传统应用开发」分开写，后者的每一条都标 `[推断]`——它是从 DSH 的一手机制推出的迁移建议，不是 DSH 的官方主张。

## 一、先建立三条预期

1. **上下文是缓存，仓库才是内存。** 会话历史会被压缩，而压缩提示词明确要求「preserve still-true facts, **drop stale ones**」（`packages/compaction/compaction-basic/README.md:224`，`[原文]`）。所以「隔一阵子还会再问一次」的事实，必须落到仓库里。
2. **常驻上下文是有预算的。** 根 `AGENTS.md` 2080 词、`docs/AGENTS.md` 1430 词等都有硬上限（`docs/AGENTS.md:59`；`scripts/doc-budgets.manifest.json:2`-`:8`）。越靠上、越常驻的文件越贵。
3. **「现在是什么」只能有一个 owner。** 方向变了就换 owner 并交叉链接，不新增第二份并行描述（`.agents/notes/README.md:48`、`:50`）。

## 二、DSH 插件仓：抄这几样

独立插件仓不该复刻主仓的制度规模，但下面五条是**机制**，且已有同仓语料写清落地方式：

| 做法 | 一句话 | 出处 |
|---|---|---|
| 按**维护形态**分区 | 手写 / 生成 / 混合 / 录制 / 投影五类，每类有命名的 owner、生成器或 verifier | [`repo-harness/08-repository-taxonomy.md:5`](../../_dsh_plugin_agent_ready_development/repo-harness/08-repository-taxonomy.md) |
| **一个事实一个 owner** | 找到 owner 就改源头并同步消费者，不在第二处复制一份容易漂移的事实 | [`repo-harness/02-legibility-and-ownership.md:47`](../../_dsh_plugin_agent_ready_development/repo-harness/02-legibility-and-ownership.md) |
| **清单由生成器产出** | agent 按名字查完整集合，不必相信一张人工维护、可能已漂移的表 | 同上 `:45` |
| **决策与当前合同分层** | 为什么这样决定住 Note（含备选），现在是什么住 README / 文档 | [`08-repository-taxonomy.md:66`](../../_dsh_plugin_agent_ready_development/repo-harness/08-repository-taxonomy.md)；[FAQ 20](../20_agent-note-quality-bar/answer.md) |
| **证据可重算** | 插件仓的最小证据集与快照阶梯见 FAQ 21；主仓的整层证据哲学见 [FAQ 07](../07_borrowing-dsh-harness-idea/answer.md) | [`_dsh_plugin_agent_ready_development/`](../../_dsh_plugin_agent_ready_development/00-index.md) |

会话侧（用 DSH 自己开发时）三条最实用：

- **长任务开 goal**：目标落成 durable `goal/change`，跨 resume/fork 存活；但 **resume 后目标自动解除待发，必须显式 rearm**（`packages/goal/tool-goal/README.md:116`，`[原文]`）——这是防止「隔了一天它自己接着干错方向」的设计。
- **方向要改就改 goal**：`edit` 而不是在对话里说一句（`packages/goal/tool-goal/README.md:38`，`[原文]`）。
- **需要独立上下文就委派**：fork 继承父级已完成 turn 的**一次性快照**，spawn 完全不继承（`packages/subagent/subagent-fork-in-process/README.md:143`、`packages/subagent/subagent-spawn-in-process/README.md:12`，`[原文]`）。

## 三、传统应用开发：六条可迁移规则 `[推断]`

下面每条左边是 DSH 的一手机制（可核对），右边是不依赖 DSH 的等价落地形态。

| # | 从 DSH 抽出的规则 | 传统项目里的等价物 |
|---|---|---|
| 1 | **记录面只追加，派生面可重建**：日志 append-only，模型可见面是投影，压缩只遮蔽不删除（`packages/core/session/README.md:12`） | 事件表 / 审计日志不接受 UPDATE；报表、搜索索引、缓存都是可重放的派生视图 |
| 2 | **一个事实一个 owner，其余链接**：`docs/AGENTS.md:17` 的 one home per fact | 指标口径、枚举值、错误码、配置默认值各有一个权威文件；其余文档只链接 |
| 3 | **决定不可改写，只能被取代**：`.agents/notes/implemented/AGENTS.md:13` | ADR/RFC 目录；改主意就新增一篇并写 `Supersedes` / `Superseded by`，旧篇不编辑 |
| 4 | **常驻上下文有预算**：`docs/AGENTS.md:59` + `verify-doc-budgets` | 新人上手文档、onboarding checklist、团队 wiki 首页设字数上限；细节下沉到按需查阅的页 |
| 5 | **能机器查的绝不靠人记**：`AGENTS.md:175` | 把「链接不断、清单不旧、预算不超、生成物同步」写成 CI 检查；跑不动的部分明确写成 review 清单 |

再补一条最容易被忽略的：

6. **语义判断要显式点名给人。** DSH 不假装能自动判断「这次改动算不算重大」「这篇记录还有没有价值」（`.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:22`）。团队流程里也应该有一句「以下判断由 reviewer 负责」，而不是让所有人都以为 CI 绿了就没事。

## 四、症状 → 动作

| 你观察到的 | 该做 | 不该做 |
|---|---|---|
| 同一个数字/规则在两份文档里都能查到 | 选一个 owner，另一处改链接 | 两处都改（下次必漂） |
| 文档里出现「目前/将来会/已实现」这类状态词 | 把状态交给代码、清单或生成器 | 手工维护状态表 |
| 决定改了，但旧文档还在描述旧方案 | 新增一篇决定记录并交叉链接；旧篇按判据归档或删除 | 原地把旧文档改成新方案（理由会丢） |
| 上下文里说不清当初为什么这么做 | 去 Note / ADR / commit 找；找不到就补一篇，写明备选与代价 | 重新讨论一遍（re-litigation） |
| 一个方向做了几周又改回去 | 走「部分取代 / 完全取代 / 拒绝」三条路之一，并把重新引入条件写下来 | 让两种说法同时留在现行文档里 |
| 项目里没人删旧文档 | 用「还有没有指导价值」做判据，而不是年龄或体积（`.agents/skills/dsh-archive-agent-notes/SKILL.md:8`、`:29`） | 定配额、按季度大扫除 |
| 长任务跨了几天 | goal 与 plan 落成可恢复的状态；todo 只是写给界面的清单，不指望它回到模型眼前（见 [02](./02-runtime-anti-rot.md)） | 靠对话记忆续着 |

## 五、三个反模式

1. **把 spec 写成第二份代码清单。** DSH 的 slop checklist 直接点名：「Hand-restated catalogs, JSDoc, or inventories of tests, packages, and status when source or a generator is authoritative.」（`docs/AGENTS.md:68`，`[原文]`）
2. **把「为什么」写进当前状态文档。** 当前状态文档只写 now（`docs/AGENTS.md:40`）；理由写进去，方向一改就面临「要么篡改历史、要么留一份过期说明」的两难。
3. **靠对话记忆承载决定。** 压缩会按「现在还成立吗」重写历史（`packages/compaction/compaction-basic/README.md:224`），没落到仓库的决定迟早消失。
