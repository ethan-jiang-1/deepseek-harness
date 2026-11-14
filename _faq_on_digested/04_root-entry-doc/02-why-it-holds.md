# 02 · 为什么渐进式披露难，DSH 怎么把它变成缓存层次和门禁

## 渐进式披露为什么难度量

常见的渐进式披露试图回答「读者当前应该看到多少？」这个量有三个难处：

1. **读者状态不可观测**：模型是否已建立心智模型，无法直接测量。
2. **问题不是线性的**：模型可能从「加一个工具」进入仓库，也可能从「换 loop」进入，需要的背景完全不同。
3. **细节会腐烂**：即使披露顺序正确，文档与代码漂移后路径会悄悄失效。

DSH 没有正面度量「理解程度」，而是把披露问题转成三个可检查的性质。

## 性质一：每层有 load boundary，且有预算

`docs/AGENTS.md` 的 Wordcount Budgets 给常驻层设了硬上限：

> Targets: root `AGENTS.md` ≤ 1,950; `architecture.md` ≤ 2,400; subtree `AGENTS.md` ≤ 600, except `packages/AGENTS.md` ≤ 750 and this file ≤ 1,320; `packages/README.md` ≤ 994; …
>
> —— `docs/AGENTS.md:58`

引文照录上游原文，但**执行口径以 `scripts/doc-budgets.manifest.json` 为准**。复核时上游 Targets 行与 manifest 的对照是：root `AGENTS.md` 2,080 对 2,080、`docs/AGENTS.md` 1,430 对 1,430、`packages/AGENTS.md` 810 对 810，这三条已一致；`architecture.md` 仍印 ≤2,400 而 manifest 是 2410、`testing.md` 印 1,300 而 manifest 是 1350，这两处上游自相矛盾已登记。原 Targets 行里的 `defensive-patterns.md 550` 已随该页由单页改成目录而取消。

预算超了以后，处理顺序不是「写短一点」：

> 1. **Relocate** content that belongs in another tier; leave a one-line link if needed.
> 2. **Condense** content that belongs here but can be shorter.
> 3. **Raise** the ceiling only when the words need the space; justify the manifest diff in the PR.
>
> —— `docs/AGENTS.md:54-56`

这等于给渐进式披露定义了一个操作顺序：**先重新路由，再压缩，最后才扩预算。**「该披露多少」被替换成「这一层最多能放多少，放不下就必须归位」。

## 性质二：常驻层是 cache，查询面是 disk

把 DSH 文档系统看成一个缓存层次：

| 层 | 内容 | 加载时机 | 上限 |
|---|---|---|---|
| L1 常驻 | 根 `AGENTS.md` | 每个 agent session | 2080 words（manifest） |
| L2 区域入口 | `architecture.md`、子树 `AGENTS.md` | 进入对应区域 | 2410（manifest）/ 600-810 words |
| L3 按需合同 | package README、subsystems、cookbook | 定位到具体包/任务 | `packages/README.md` ≤ 994；单个 package README 由 Summary ≤ 100 words、Model Experience 与 limitations 三道门禁管 |
| L4 穷举索引 | generated catalogs、cordis API、module graph | 查询时 | 无人工预算，由生成器维护 |
| L5 理由与流程 | Agent Notes、skills | 决策或执行时 | 不设总预算，但有归档/分类/格式门禁 |

这个类比不是修辞：L1 的字数预算是真实门禁，L4 的新鲜度是真实 freshness gate，L5 的生命周期是真实 archive policy。**渐进式披露从一种文风选择，变成了缓存设计与容量控制。**

## 性质三：过期地图会先撞机器

- `verify-md-links` 检查每个相对链接和锚点；
- `verify-doc-budgets` 检查预算和 manifest；
- `verify-*catalog` 重新生成并与提交内容 diff；
- `doc-typecheck` 让文档里的 TypeScript 必须编译；
- `verify-translation-pairing` 让中英文配对不能漂移。

因此「按图索骥」不是比喻：图的边、预算和内容都有人持续验证。模型走错路时，更大的可能是仓库已经在 CI 里红了。

## 这七条判断是可迁移的

DSH 在这件事上的判断，按可迁移性排：

1. **对人和对模型的入口分离**：README 给人，AGENTS 给模型，`CLAUDE.md` symlink 到 `AGENTS.md`，不产生第二份事实。
2. **根 AGENTS 是 standing orders，不是 onboarding essay**：入口的目标不是让模型一次读完，而是让它在每次 session 都带着正确的最小内核。
3. **一个事实一个家**：「写在哪里」先于「写得详细」；重复陈述被列为 slop。这让导航可逆。
4. **穷举与叙事分离**：穷举内容由生成器维护，叙事内容受预算约束。模型不会因为「配置项太多」把 architecture 撑爆。
5. **预算先 relocate，再 condense，最后 raise**：渐进式披露通常缺少惩罚机制，预算门禁补上了处理顺序。
6. **历史、理由、当前状态分开**：current-state prose + Agent Notes + 冻结归档，模型读架构时看到的是 now。
7. **图是机器可验证的**：链接、预算、生成物、类型代码、双语配对全部有门禁。可信度来自 CI，不来自「我们写得很认真」。

照搬到另一个仓库，最小可用集是前六条里的第 1、2、3、5、7 加上「把穷举交给生成器」。

## 边界

这套组织不是零成本：它要求先有 tier taxonomy 和预算 manifest，要求维护生成器与门禁，且更偏向 reference-heavy、agent 参与频繁的仓库。它不替代教程，只保证教程、参考、理由各有去处。

## 证据入口

- [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md) 第 15-36 行（tier taxonomy）、第 49-59 行（budget 与 relocate/condense/raise）、第 77 行（verify-md-links）
- [`scripts/doc-budgets.manifest.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/doc-budgets.manifest.json)：各常驻文档的实际 ceiling
- [`scripts/verify-package-readme-summaries.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-package-readme-summaries.ts)：package README Summary 的 100 词上限
- [`package.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/package.json)：`verify-doc-budgets`、`verify-md-links`、`verify-tool-catalog` 等脚本
