# 03 · 为什么渐进式披露难，DSH 怎么把它变成缓存层次和门禁

## 渐进式披露为什么难度量

常见的渐进式披露试图回答：“读者当前应该看到多少？”这个量有三个难处：

1. **读者状态不可观测**。模型是否已建立心智模型，无法直接测量。
2. **问题不是线性的**。模型可能从“加一个工具”进入仓库，也可能从“换 loop”进入仓库；需要的背景完全不同。
3. **细节会腐烂**。即使披露顺序正确，文档与代码漂移后，路径会悄悄失效。

DSH 没有正面度量“理解程度”，而是把披露问题转成了三个可检查性质：

## 性质一：每层有 load boundary，且有预算

`docs/AGENTS.md` 的 Wordcount Budgets 给常驻层设了硬上限：

> Targets: root `AGENTS.md` ≤ 1,950; `architecture.md` ≤ 2,400; subtree `AGENTS.md` ≤ 600, except `packages/AGENTS.md` ≤ 750 and this file ≤ 1,320; `packages/README.md` ≤ 994; …
>
> —— `docs/AGENTS.md:58`（基线 `46a7f68b09…`）

预算超了以后，处理顺序不是“写短一点”：

> 1. **Relocate** content that belongs in another tier; leave a one-line link if needed.
> 2. **Condense** content that belongs here but can be shorter.
> 3. **Raise** the ceiling only when the words need the space; justify the manifest diff in the PR.
>
> —— `docs/AGENTS.md:54-56`（基线 `46a7f68b09…`）

这等于给渐进式披露定义了一个操作顺序：**先重新路由，再压缩，最后才扩预算。** “该披露多少”被替换成“这一层最多能放多少，放不下就必须归位”。

## 性质二：常驻层是 cache，查询面是 disk

可以把 DSH 文档系统看成一个缓存层次：

| 层 | 内容 | 加载时机 | 上限 |
|---|---|---|---|
| L1 常驻 | 根 `AGENTS.md` | 每个 agent session | 1950 words |
| L2 区域入口 | `architecture.md`、子树 `AGENTS.md` | 进入对应区域 | 2400 / 600-750 words |
| L3 按需合同 | package README、subsystems、cookbook | 定位到具体包/任务 | 无统一的字数预算：`packages/README.md` ≤ 994；单个 package README 由 Summary ≤ 100 words、Model Experience 与 limitations 三道门禁管 |
| L4 穷举索引 | generated catalogs、cordis API、module graph | 查询时 | 无人工预算，但由生成器维护 |
| L5 理由与流程 | Agent Notes、skills | 决策或执行时 | Agent Notes 不设总预算，但有归档/分类/格式门禁 |

这个类比不是修辞：L1 的字数预算是真实门禁，L4 的新鲜度是真实 freshness gate，L5 的生命周期是真实 archive policy。**渐进式披露从一种文风选择，变成了缓存设计与容量控制。**

## 性质三：过期地图会先撞机器

地图可靠不只靠写作纪律：

- `verify-md-links` 检查每个相对链接和锚点；
- `verify-doc-budgets` 检查预算和 manifest；
- `verify-*catalog` 重新生成并与提交内容 diff；
- `doc-typecheck` 让文档里的 TypeScript 必须编译；
- `verify-translation-pairing` 让中英文配对不能漂移。

因此，“按图索骥”不是一句比喻：图的边、预算和内容都有人持续验证。模型走错路时，更大的可能是仓库已经在 CI 里红了。

## 为什么这回答了“DSH 为什么做对了”

DSH 做对的不是“写得循序渐进”，而是**把披露顺序编码成结构**：

- 读者不知道去哪里时，tier taxonomy 给出唯一 home；
- 上下文装不下时，预算门禁强制 relocate；
- 细节需要穷举时，生成目录提供查询面；
- 文档过期时，门禁先于读者发现。

这比任何“让文档更易懂”的写作建议都更可迁移，因为它不依赖作者的天赋，也不依赖读者的水平。

## 证据入口

- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 48-58 行：budget 与 relocate/condense/raise
- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 75 行：verify-md-links
- [`package.json`](../../package.json)：`verify-doc-budgets`、`verify-md-links`、`verify-tool-catalog` 等脚本
- [`scripts/doc-budgets.manifest.json`](../../scripts/doc-budgets.manifest.json)：各常驻文档的实际 ceiling
- [`scripts/verify-package-readme-summaries.ts`](../../scripts/verify-package-readme-summaries.ts)：package README Summary 的 100 词上限
- [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 15-33 行：tier taxonomy
