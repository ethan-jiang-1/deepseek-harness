# 02 · 可读性 = 一个事实一个 owner（解决「糊涂」的地基）

## 可读 ≠ 文件少

「让 agent 不糊涂」的朴素冲动是：写一份大而全的总览，让 agent 一次读完。DSH 明确不这么干。它对可读性的定义更实用：

> Legibility 不是把大型仓库压缩成一篇总览。更准确的定义是：遇到一个问题时，能以有限上下文找到正确 owner，区分当前事实与设计理由，并知道下一层应该读什么。

也就是说，**「不糊涂」的度量不是「读了多少」，而是「能不能便宜地找到那份最小且权威的材料」。** 这直接可迁移，不需要任何插件架构。

## 一个事实一个家（one home per fact）

DSH 的文档层级规则只有一条主线：每个事实住在「负责它的那一层」，其它地方只放 link、不复制。

> Each fact has one home: the tier whose job it is; elsewhere, link there.

这解决两类真实错误：**同一规则在多处各写一版导致漂移**，和**所有细节都塞进根指令导致真正重要的规则被淹没**。对一个普通项目，这意味着：

| 事实类型 | 它该住的地方 | 不该被复制到 |
|---|---|---|
| 每轮必须遵守的常驻规则 | 根 `AGENTS.md` | 教程、war story、详细实现 |
| 系统当前怎么组成 | 架构图 / 子系统文档 / 包 README | 决策理由的完整版 |
| 术语与代码位置 | glossary + 生成索引 | 手工维护的第二份清单 |
| 为什么选择这个方案 | 决策记录（ADR / Agent Note） | 当前 API 的唯一说明 |
| 某类任务怎么做 | cookbook / 任务 skill | 产品运行时行为 |

## 当前事实 vs 决策理由必须分开

这是「不糊涂」里最容易漏的一条，也最能解释「agent 怎么读着读着就歪了」：

- **当前文档**（源码、类型、README、`docs/`）回答「系统**现在**做什么」；
- **决策记录**（Agent Note / ADR）回答「为什么这样决定、什么方案输了、后果是什么」。

两者混在一起会产生两个相反的失败：只读代码会**重走已否定的路径**，只读记录会把**历史实现细节误当成当前 API**。DSH 还进一步给决策记录加生命周期（`proposed` → `implemented` → `rejected`/`archived`），让「已否决」「已过时」和「现行」一眼可分。普通项目至少要做的是：**把 `docs/` 定位成 current state，把「为什么」放进单独的 `notes/` 或 `docs/adr/`。**

## 负知识也需要 owner

「乱发挥」有一半是「负知识」没有外置导致的：agent 不知道「为什么不走某条路」「这里为什么没有 runtime invariant」「这个能力有哪些已知限制」，于是**把明确的缺席当成遗漏，反复提出已否定的方案**。

DSH 用 rejected note、README 的 `## Known Limitations`、说明理由的空 invariant companion 来存负知识。普通项目最便宜的做法是：**在 README / ADR 里记「为什么不做 X」，而不只是「做了什么」。**

## 渐进披露：先给方向，再为当前问题付细节

根 `AGENTS.md` 只保留每轮需要的 standing orders（每条一两行、链到 home）；architecture 给有序地图；catalog 支持查询；Skill 在任务命中时才加载全文。这叫 progressive disclosure（渐进披露）：

> 可读性因此不是「把一切写进上下文」，而是「让读者知道下一份最小且权威的材料在哪里」。

对一个普通项目，这就是「入口文件要短、要只做路由」的直接理由——也是和 `04_root-entry-documentation` 讲过的根入口分流共用同一个原则。这条原则落到物理文件上，是一条明确的入口链：`CLAUDE.md`（symlink）→ 根 `AGENTS.md` → 少数子树 `AGENTS.md` → 各 `README.md`；它把「渐进披露」变成仓库里真实存在的骨架，详见 [`09-agents-entry-chain.md`](./09-agents-entry-chain.md)。但注意这只是**静态层**——「按需」的「需」在运行时由谁决定、模型每轮实际看到什么、超预算怎么回收、子代理能看到什么，是另一整块，详见 [`10-progressive-disclosure-pipeline.md`](./10-progressive-disclosure-pipeline.md)。

## 可迁移要点

1. 给每类事实指定唯一 home，其它地方只 link——先消灭「多版本漂移」。
2. `docs/` 只写 now，决策理由进 ADR/note——先消灭「读历史误当现在」。
3. 记下「为什么不做 X」——先消灭「反复提出已否定方案」。
4. 入口文件短、只做路由——先消灭「上下文被无关细节淹没」。
5. 搭好入口链：`CLAUDE.md` symlink 指向 `AGENTS.md`，子树 `AGENTS.md` 只在有专属常驻规则时放，其余靠 README 按需加载（见 [`09`](./09-agents-entry-chain.md)）。

## 证据入口

- [`../../_agent_ready_development/development-harness/02-legibility-and-ownership.md`](../../_agent_ready_development/development-harness/02-legibility-and-ownership.md)：五类问题五类 owner、当前事实 vs 决策理由、负知识。
- [`../../_digested/harness-idea/02-legibility.md`](../../_digested/harness-idea/02-legibility.md)：静态可读性的八个机制与上下文入口外置。
- [`../../docs/AGENTS.md`](../../docs/AGENTS.md)：文档 tier taxonomy 与 one home per fact。
- [`../../docs/glossary.md`](../../docs/glossary.md)：一词一义的术语纪律。
- [`../../.agents/notes/README.md`](../../.agents/notes/README.md)：决策记录的生命周期与负知识 home。
