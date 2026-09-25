# 02 · 可读性 = 一个事实一个 owner（解决「糊涂」的地基）

> **状态：静态（仓库/文件面）** —— 讲的是地图怎么画（one home、tier、当前 vs 决策、负知识）；DSH 侧设计细节归 [`04_root-entry-doc-design`](../04_root-entry-doc-design/answer.md)，运行时消费见 [`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/answer.md)。

## 可读 ≠ 文件少

「让 agent 不糊涂」的朴素冲动是：写一份大而全的总览，让 agent 一次读完。DSH 明确不这么干。它对可读性的定义更实用：

> Legibility 不是把大型仓库压缩成一篇总览。更准确的定义是：遇到一个问题时，能以有限上下文找到正确 owner，区分当前事实与设计理由，并知道下一层应该读什么。

（上句是 [`_agent_ready_development/repo-harness/02-legibility-and-ownership.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/repo-harness/02-legibility-and-ownership.md) 的归纳，不是 DSH 原文。）

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

## 落地实物：one home 在 DSH 里长什么样

「一个事实一个 owner」不是口号，是三个可以直接打开的形态：

1. **根 `AGENTS.md` 的每条 standing order 只有一到三行，后面立刻跟链接。** 实例：「Run relevant checks locally」这条规则在根文件里只占几行，怎么选检查的完整流程链到 [dsh-pre-push-checks skill](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-pre-push-checks/SKILL.md)——根文件负责「有这条规则」，skill 负责「怎么执行」，两层不重复。
2. **tier 分工是一张真实存在的表**（[docs/AGENTS.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md)）：根 `AGENTS.md` 放常驻规则、子树 `AGENTS.md` 放子树专属规则、包 README 放每包合同、Skills 放可复用流程——每行同时写「放什么」和「禁放什么」。
3. **不同工具读同一份事实，用 symlink 而不是复制**：`CLAUDE.md` 是指向 `AGENTS.md` 的软链（一条命令 `ln -s AGENTS.md CLAUDE.md`），Claude 类宿主和其它 agent 宿主各认各的入口文件名，但事实只有一份。DSH 仓库里有 4 处这样的 symlink。

普通项目的落地动作就三条：写短根文件、每条规则链到 home、`ln -s AGENTS.md CLAUDE.md`。

**学走形的检查**：owner 表写了、正文却在每处全文复制——检验法是把链接以外的复制正文删掉，信息应当不丢；丢了说明 home 没写全，该补 home 而不是允许复制。

## 当前事实 vs 决策理由必须分开

这是「不糊涂」里最容易漏的一条，也最能解释「agent 怎么读着读着就歪了」：

- **当前文档**（源码、类型、README、`docs/`）回答「系统**现在**做什么」；
- **决策记录**（Agent Note / ADR）回答「为什么这样决定、什么方案输了、后果是什么」。

两者混在一起会产生两个相反的失败：只读代码会**重走已否定的路径**，只读记录会把**历史实现细节误当成当前 API**。DSH 还进一步给决策记录加生命周期（`proposed` / `implemented` / `rejected` 三个状态；`archived/` 是 implemented 的冻结存放地——冻结历史而非当前权威），让「已否决」「已过时」和「现行」一眼可分。

> Document current state.

（来源：`docs/AGENTS.md` 的 Writing rules）

普通项目至少要做的是：**把 `docs/` 定位成 current state，把「为什么」放进单独的 `notes/` 或 `docs/adr/`。** DSH 侧的完整形态是六类事实六类位置（意图/决定/计划/现状/证据/交付状态各有 owner），见 [SDLC Tutorial 02 的六类位置表](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-tutorial/02-specs-and-decisions.md)；决策记录本身何时写、怎样演进，展开在本目录 [`12-decision-notes.md`](./12-decision-notes.md)。

## 负知识也需要 owner

「乱发挥」有一半是「负知识」没有外置导致的：agent 不知道「为什么不走某条路」「这里为什么没有 runtime invariant」「这个能力有哪些已知限制」，于是**把明确的缺席当成遗漏，反复提出已否定的方案**。

DSH 用 rejected note、README 的 `## Known Limitations and Deferred Work`、以及「没有可观察关系」时写进包 README 的省略理由来存负知识——无关系就省略 `./invariant`，不写空 shell（`packages/AGENTS.md:19`；空 companion 与空 installer 由 `verify-package-invariants` 判 fail）。普通项目最便宜的做法是：**在 README / ADR 里记「为什么不做 X」，而不只是「做了什么」。**

## 渐进披露：先给方向，再为当前问题付细节

根 `AGENTS.md` 只保留每轮需要的 standing orders（每条一到三行、链到 home）；architecture 给有序地图；catalog 支持查询；Skill 在任务命中时才加载全文。这叫 progressive disclosure（渐进披露）：

> 可读性因此不是「把一切写进上下文」，而是「让读者知道下一份最小且权威的材料在哪里」。

（上句出处同上，语料归纳。）

对一个普通项目，这就是「入口文件要短、要只做路由」的直接理由——也是和 `04_root-entry-doc-design` 讲过的根入口分流共用同一个原则。这条原则落到物理文件上，是一条明确的入口链：`CLAUDE.md`（symlink）→ 根 `AGENTS.md` → 少数子树 `AGENTS.md` → 各 `README.md`；它把「渐进披露」变成仓库里真实存在的骨架，详见 [`09-agents-entry-chain.md`](./09-agents-entry-chain.md)。但注意这只是**静态层**——「按需」的「需」在运行时由谁决定、模型每轮实际看到什么、超预算怎么回收、子代理能看到什么，是另一整块，详见 [`10-progressive-disclosure-pipeline.md`](./10-progressive-disclosure-pipeline.md)（完整管线）与 [`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/answer.md)（根入口文档的运行时消费）。

## 可迁移要点

1. 给每类事实指定唯一 home，其它地方只 link——先消灭「多版本漂移」。
2. `docs/` 只写 now，决策理由进 ADR/note——先消灭「读历史误当现在」。
3. 记下「为什么不做 X」——先消灭「反复提出已否定方案」。
4. 入口文件短、只做路由——先消灭「上下文被无关细节淹没」。
5. 搭好入口链：`CLAUDE.md` symlink 指向 `AGENTS.md`，子树 `AGENTS.md` 只在有专属常驻规则时放，其余靠 README 按需加载（见 [`09`](./09-agents-entry-chain.md)）。

## 证据入口

- [`_agent_ready_development/repo-harness/02-legibility-and-ownership.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/repo-harness/02-legibility-and-ownership.md)：五类问题五类 owner、当前事实 vs 决策理由、负知识。
- [`_digested/harness-idea/02-legibility.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_digested/harness-idea/02-legibility.md)：静态可读性的八个机制与上下文入口外置。
- [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md)：文档 tier taxonomy 与 one home per fact。
- [`docs/glossary.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/glossary.md)：一词一义的术语纪律。
- [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/README.md)：决策记录的生命周期与负知识 home。
