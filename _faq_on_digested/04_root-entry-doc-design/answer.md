# Answer · DSH 根入口文档的静态设计

## 一句话结论

DSH 没有试图直接解决“渐进式披露多少才合适”这个主观问题；它把问题转成了三个更可操作的问题：

1. **每个事实归谁？** —— 一个事实一个家（one home per fact）。
2. **哪一层必须常驻模型上下文？** —— 根 `AGENTS.md` 只放 standing orders + 布局 + 命令，受字数预算约束。
3. **查不到时能不能机器证明地图没坏？** —— 生成目录 freshness-gated，Markdown 链接由 `verify-md-links` 检查，文档预算由 `verify-doc-budgets` 检查。

当这三个问题都有机械答案后，“按图索骥”就不再依赖模型的理解力或运气，而是变成一个可执行的路由过程。

（这是**静态**结论：它说的是“图”本身长什么样、怎么保证不坏。图在运行时怎么被注入、被走完、超预算怎么回收，见 [`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/answer.md)。）

## 根入口的分工

| 文件 | 读者 | 职责 | 不做什么 |
|---|---|---|---|
| `README.md` / `README.zh.md` | 人，尤其是首次用户 | 产品是什么、怎么运行、社区、如何贡献 | 不承载 agent 的工作规则 |
| `CLAUDE.md` | Claude 类模型 | 指向 `AGENTS.md` | 本身是 symlink，不产生第二份事实 |
| `AGENTS.md` | coding agent | standing orders、仓库布局、命令、关键约定 | 不写教程、不写 war story、不重复 linked home |
| `docs/architecture.md` | 要改 `packages/` 的人/agent | 有序架构地图 | 不放类型细节、包细节、决策理由 |
| `docs/AGENTS.md` | 要写/审文档的人/agent | 文档的 tier taxonomy 与写作规则 | 不放产品合同 |
| 生成目录 | 查询者 | 穷举索引：tool/config/persistence/event/module graph/cordis API | 不承载叙事 |
| package README | 要改/用某个包的人或 coding agent | 该包合同、Model Experience、限制 | 不重复生成目录和 JSDoc |
| `CONTRIBUTING.md` / `.zh.md` | 想贡献的人类 | 贡献流程与社区约定 | 不承载 agent 的 standing orders |
| `SAFETY.md` / `.zh.md` | 想运行它的人类 | 实验性状态、sandbox 限制、responsible use、免责 | 不是运行时保证，也不描述机制 |
| `BRAND_GUIDELINES.md` / `.zh.md` | 下游项目作者 | 名称与品牌资产的使用边界（“DeepSeek Harness”是注册商标） | 与代码行为无关 |
| `BENCHMARK.md` | 要跑基准的人 | 基准怎么跑（指向 Python SDK 指南） | 不是性能门禁的 owner，门禁在 `benchmarks/` 与 CI |
| `THIRD_PARTY_NOTICES.md` | 合规查询者 | 生成式第三方许可清单（`gen-third-party-notices`） | 不承载叙事，也不手改 |

## 这张地图的路由结构

```text
README.md
  └─ Development: Start with development + architecture
  └─ For agents: follow AGENTS.md

AGENTS.md
  ├─ 第一段：all-plugin Cordis agent harness；改 packages 前读 architecture；文档规则看 docs/AGENTS
  ├─ Repository layout：每个顶层区域一句话
  ├─ Commands：动词表
  ├─ Conventions：standing orders，每条链接 home
  └─ 根据任务进入：
       改代码 → docs/architecture.md
       写文档 → docs/AGENTS.md
       查具体包 → packages/<group>/<pkg>/README.md
       查穷举事实 → docs/*-catalog.md / cordis-api / module-graph
       查为什么 → .agents/notes/
       查怎么做 → docs/cookbook/ 或 .agents/skills/
```

这不是一篇长文的线性展开，而是一个**两层路由**：根 `AGENTS.md` 是常驻内存的总路由表，目标文档按需加载。这条路由在运行时由谁执行（`dsh-agent-instructions` 注入、模型用 read/grep/glob 导航、skill 按需加载），见 [`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/answer.md)。

## 最核心的三件事

1. **一个事实一个家**：`docs/AGENTS.md` 的 tier taxonomy 规定了哪种事实住在哪一层；其它层只 link。
2. **常驻层有硬预算**：根 `AGENTS.md ≤ 1950 words`，`architecture.md` 的强制上限是 **2410**（`scripts/doc-budgets.manifest.json:4`），子树 AGENTS 与 `packages/README.md` 也各有 ceiling，单个 package README 另受 Summary 词数与 Model Experience / limitations 门禁约束；超了先 relocate，再 condense，最后才允许 raise。（0008 复核注记：`docs/AGENTS.md:58` 的 Targets 行仍印 ≤2,400，与 manifest 的 2410 不一致——上游自相矛盾，已登记；以 manifest 为执行口径。）
3. **地图是机器检查的**：相对链接必须存在，生成目录必须和源码一致，文档里的 TypeScript 必须能编译，中英双语必须配对。

## 为什么这能缓解“渐进式披露难以度量”

DSH 没有度量“读者懂了没有”，而是度量了更稳定、更可检查的代理量：

- **上下文成本**：常驻入口的字数预算；
- **路由正确性**：每个事实有唯一 home，链接可解析；
- **索引新鲜度**：生成目录与源码无 diff；
- **文档状态纯净度**：只写 current state，历史与理由归 Agent Notes。

这些代理量加在一起，保证了渐进式披露的两个关键性质：**该进的进得来，不该进的进不来；每张图都能走到，走到的那张图不会过期。**

## 继续阅读

- [`01-root-split-and-map.md`](./01-root-split-and-map.md)
- [`02-tier-routing-and-indexes.md`](./02-tier-routing-and-indexes.md)
- [`03-progressive-disclosure-as-cache.md`](./03-progressive-disclosure-as-cache.md)
- [`04-unique-and-transferable.md`](./04-unique-and-transferable.md)
- [`research.md`](./research.md)
- 运行时消费（另一半）：[`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/answer.md)
- 迁移视角（借用者怎么搬）：[`07_borrowing-harness-idea/09-agents-entry-chain.md`](../07_borrowing-harness-idea/09-agents-entry-chain.md)
