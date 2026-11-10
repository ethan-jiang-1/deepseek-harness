# Answer 04 · 地图做成工程对象，运行时才有「按图索骥」

## 一句话结论

DSH 没有试图直接解决「渐进式披露多少才合适」这个主观问题；它把问题转成三个可机械回答的问题：

1. **每个事实归谁？** 一个事实一个家（one home per fact），由 tier taxonomy 固定。
2. **哪一层必须常驻模型上下文？** 根 `AGENTS.md` 只放 standing orders + 布局 + 命令，受字数预算约束。
3. **查不到时能不能机器证明地图没坏？** 生成目录 freshness-gated，相对链接由 `verify-md-links` 检查，文档预算由 `verify-doc-budgets` 检查。

「图」本身只是这一半。另一半是运行时：静态设计承诺的「按需加载」不是靠模型自觉兑现的，而是被拆成三件由机器执行的事：

- **注入（push）**：`AGENTS.md` 指令链由 `dsh-agent-instructions` 在会话第一步注入 baseline，触达更深目录时注入 nested，有 `maxBytes` 预算、按 digest 去重；
- **导航（pull）**：不在注入链里的内容由模型用 read/grep/glob 拉取，工具提示词本身就规定了「用 read 不用 cat、用 grep 不用 rg」；
- **回收（recycle）**：超预算由 `ctx.tokenMeter` 度量、compaction 回收，保留 tool-call/result 配对。

所以「按图索骥」的「索」不是写作美德，而是工程保证：图不会悄悄断，该进的被塞进来，该拉的能拉到，塞多了会被收走。

## 静态半：根入口的分工

| 文件 | 读者 | 职责 | 不做什么 |
|---|---|---|---|
| `README.md` / `README.zh.md` | 人，尤其首次用户 | 产品是什么、怎么运行、社区、如何贡献 | 不承载 agent 的工作规则 |
| `CLAUDE.md` | Claude 类模型 | 指向 `AGENTS.md` | 本身是 symlink，不产生第二份事实 |
| `AGENTS.md` | coding agent | standing orders、仓库布局、命令、关键约定 | 不写教程、不写 war story、不重复 linked home |
| `docs/architecture.md` | 要改 `packages/` 的人/agent | 有序架构地图 | 不放类型细节、包细节、决策理由 |
| `docs/AGENTS.md` | 要写/审文档的人/agent | 文档的 tier taxonomy 与写作规则 | 不放产品合同 |
| 生成目录 | 查询者 | 穷举索引：tool/config/persistence/event/module graph/cordis API | 不承载叙事 |
| package README | 要改/用某个包的人或 coding agent | 该包合同、Model Experience、限制 | 不重复生成目录和 JSDoc |
| `CONTRIBUTING.md` / `SAFETY.md` / `BRAND_GUIDELINES.md` | 人类贡献者、运行者、下游作者 | 贡献流程、实验状态与 sandbox 限制、品牌边界 | 都不承载 agent standing orders，也都不是运行时机保证 |
| `THIRD_PARTY_NOTICES.md` | 合规查询者 | 生成式第三方许可清单 | 不承载叙事，也不手改 |

路由是两层的，不是一篇长文：

```text
README.md
  └─ Development: Start with development + architecture
  └─ For agents: follow AGENTS.md

AGENTS.md（常驻）
  ├─ 第一段：all-plugin Cordis agent harness；改 packages 前读 architecture；文档规则看 docs/AGENTS
  ├─ Repository layout / Commands / Conventions
  └─ 按任务进入：改代码 → architecture；写文档 → docs/AGENTS；
       查包 → packages/<group>/<pkg>/README；查穷举事实 → docs/*-catalog.md；
       查为什么 → .agents/notes/；查怎么做 → docs/cookbook/ 或 .agents/skills/
```

## 三件撑住这张地图的事

1. **一个事实一个家。** `docs/AGENTS.md` 的 tier taxonomy 规定哪种事实住在哪一层，其它层只 link，重复陈述被列为 slop。这让导航可逆：从文件位置能推出它拥有哪类事实，从问题类型能推出该去哪个文件。
2. **常驻层有硬预算。** 根 `AGENTS.md` ≤ 2080 words（`scripts/doc-budgets.manifest.json:2`），`architecture.md` 上限 2410（同文件 `:4`），子树 AGENTS 与 `packages/README.md` 各有 ceiling。超了先 relocate，再 condense，最后才允许 raise。
3. **地图是机器检查的。** 相对链接必须存在，生成目录必须与源码一致，文档里的 TypeScript 必须能编译，中英双语必须配对。入口文档的可信度来自 CI，不来自「我们写得很认真」。

## 运行时半：静态层 ↔ 运行时的对应

| 静态层 | 运行时机制 |
|---|---|
| L1 常驻：根 `AGENTS.md` | baseline 注入，`maxBytes` 限整条链 |
| L2 区域入口：architecture、子树 AGENTS | touch-driven nested 注入（触达才加载） |
| L3 按需合同：package README | 模型用 `read` 工具拉取 |
| L4 穷举索引：generated catalogs | 模型用 `grep`/`glob` 查询 |
| L5 理由与流程：Agent Notes、skills | skill catalog 只给摘要，`skill()` 才加载正文 |
| 写作时的字数预算 | 注入时 `maxBytes` + token meter + compaction 回收 |

两端的预算是同一个预算的两个时点，不是两套规则——这是这套设计最容易被看漏的一点。详见 [03](./03-runtime-consumption.md)。

## 为什么这能缓解「渐进式披露难以度量」

DSH 没有度量「读者懂了没有」，而度量了更稳定、可检查的代理量：常驻成本（字数预算）、路由正确性（事实唯一 home、链接可解析）、索引新鲜度（生成目录与源码无 diff）、文档纯净度（只写 current state，历史与理由归 Agent Notes）。

这些代理量合起来保证两条性质：**该进的进得来，不该进的进不来；每张图都能走到，走到的那张图不会过期。**

## 分篇

| 篇 | 内容 |
|---|---|
| [01](./01-map-and-tiers.md) | 根入口的读者分流、standing orders 的取舍、tier taxonomy 与生成索引 |
| [02](./02-why-it-holds.md) | 为什么渐进式披露难度量，DSH 把它变成缓存层次与门禁；独特判断与可迁移原则、边界 |
| [03](./03-runtime-consumption.md) | 运行时：baseline 与 touch-driven 注入、按需导航、预算与回收 |
| [reference.md](./reference.md) | 证据原文与来源 |

## 边界

这套组织不是零成本：它要求先有 tier taxonomy 和预算 manifest，要求维护生成器与门禁，且更偏向 reference-heavy、agent 参与频繁的仓库。它不替代教程，只保证教程、参考、理由各有去处。对「模型第一次进入要能按图索骥」这个具体问题，它的答案是：**把地图、容量和新鲜度都做成工程对象，而不是写作美德。**

迁移视角（借用者怎么搬）见 [FAQ 07](../07_borrowing-dsh-harness-idea/question.md)。
