# Answer · DSH 根入口文档让模型按图索骥的方式

## 一句话结论

DSH 没有试图直接解决“渐进式披露多少才合适”这个主观问题；它把问题转成了三个更可操作的问题：

1. **每个事实归谁？** —— 一个事实一个家（one home per fact）。
2. **哪一层必须常驻模型上下文？** —— 根 `AGENTS.md` 只放 standing orders + 布局 + 命令，受字数预算约束。
3. **查不到时能不能机器证明地图没坏？** —— 生成目录 freshness-gated，Markdown 链接由 `verify-md-links` 检查，文档预算由 `verify-doc-budgets` 检查。

当这三个问题都有机械答案后，“按图索骥”就不再依赖模型的理解力或运气，而是变成一个可执行的路由过程。

## 根入口的分工

| 文件 | 读者 | 职责 | 不做什么 |
|---|---|---|---|
| `README.md` / `README.zh.md` | 人，尤其是首次用户 | 产品是什么、怎么运行、社区、如何贡献 | 不承载 agent 的工作规则 |
| `CLAUDE.md` | Claude 类模型 | 指向 `AGENTS.md` | 本身是 symlink，不产生第二份事实 |
| `AGENTS.md` | coding agent | standing orders、仓库布局、命令、关键约定 | 不写教程、不写 war story、不重复 linked home |
| `docs/architecture.md` | 要改 `packages/` 的人/agent | 有序架构地图 | 不放类型细节、包细节、决策理由 |
| `docs/AGENTS.md` | 要写/审文档的人/agent | 文档的 tier taxonomy 与写作规则 | 不放产品合同 |
| 生成目录 | 查询者 | 穷举索引：tool/config/persistence/event/module graph/cordis API | 不承载叙事 |
| package README | 要改/用某个包的人 | 该包合同、Model Experience、限制 | 不重复生成目录和 JSDoc |

## 模型第一次进入时的实际路径

```text
README.md
  └─ Development: Start with development + architecture
  └─ For agents: follow AGENTS.md

AGENTS.md
  ├─ 第一段：everything is a plugin；改 packages 前读 architecture；文档规则看 docs/AGENTS
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

这不是一篇长文的线性展开，而是一个**两层路由**：根 `AGENTS.md` 是常驻内存的总路由表，目标文档按需加载。

## 最核心的三件事

1. **一个事实一个家**：`docs/AGENTS.md` 的 tier taxonomy 规定了哪种事实住在哪一层；其它层只 link。
2. **常驻层有硬预算**：根 `AGENTS.md ≤ 1600 words`，`architecture.md ≤ 1800 words`，子树 AGENTS 和 package README 也各有预算；超了先 relocate，再 condense，最后才允许 raise。
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
