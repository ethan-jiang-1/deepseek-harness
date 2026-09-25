# 一个事实一个 owner：知识的家

> **道 · 归属。** 本页拥有「一个事实一个 owner」的完整逻辑：为什么需要归属、DSH 怎么应对、怎么落地。DSH 侧设计细节归 [`04_root-entry-doc-design`](../04_root-entry-doc-design/answer.md)，运行时消费见 [`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/answer.md)。

## 为什么要有这道

先看知识没有家的项目里，四类失败各自从哪来：**上下文有限**——agent 每轮的上下文有预算，塞进无关细节，重要的规则就被挤出去，「大而全总览一次读完」这个朴素冲动恰恰是让 agent 糊涂的第一来源；**同一事实两处各写一版**——早晚会分叉，改了 A 处忘了 B 处，agent 读到哪版信哪版，错得无声无息；**人走了知识就走**——规则只活在资深成员脑子里，agent 连「去问谁」这个选项都没有；**现在和当初搅在一起**——只读代码会重走已否定的路径，只读历史会把过时实现误当当前 API。

**「不糊涂」的度量因此不是「读了多少」，而是「能不能便宜地找到那份最小且权威的材料」。** 这就是归属这道要保证的东西。

## DSH 怎么应对

DSH 的文档层级规则只有一条主线：**每个事实住在「负责它的那一层」，其它地方只放 link、不复制。**

> Each fact has one home: the tier whose job it is; elsewhere, link there.

（来源：[docs/AGENTS.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md) 的 tier taxonomy 一节）

对各类事实，这个原则落成一张归属表：

| 事实类型 | 它该住的地方 | 不该被复制到 |
|---|---|---|
| 每轮必须遵守的常驻规则 | 根 `AGENTS.md` | 教程、war story、详细实现 |
| 系统当前怎么组成 | 架构图 / 子系统文档 / 包 README | 决策理由的完整版 |
| 术语与代码位置 | glossary + 生成索引 | 手工维护的第二份清单 |
| 为什么选择这个方案 | 决策记录（ADR / Agent Note） | 当前 API 的唯一说明 |
| 某类任务怎么做 | cookbook / 任务 skill | 产品运行时行为 |

加上两个分家纪律：**当前事实 vs 决策理由分开**（源码/README 只写 now，理由归决策记录——DSH 的 Writing rules 原文就一句 `Document current state.`），**负知识也要有 owner**（「为什么不做 X」不记下来，agent 就把明确的缺席当成遗漏，反复提已否决的方案）。

## DSH 怎么落地

「一个事实一个 owner」不是口号，是三个可以直接打开的形态：

1. **根 `AGENTS.md` 的每条 standing order 只有一到三行，后面立刻跟链接。** 实例：「Run relevant checks locally」这条规则在根文件里只占几行，怎么选检查的完整流程链到 [dsh-pre-push-checks skill](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-pre-push-checks/SKILL.md)——根文件负责「有这条规则」，skill 负责「怎么执行」，两层不重复。
2. **tier 分工是一张真实存在的表**（[docs/AGENTS.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md)）：根 `AGENTS.md` 放常驻规则、子树 `AGENTS.md` 放子树专属规则、包 README 放每包合同、Skills 放可复用流程——每行同时写「放什么」和「禁放什么」。
3. **不同工具读同一份事实，用 symlink 而不是复制**：`CLAUDE.md` 是指向 `AGENTS.md` 的软链（一条命令 `ln -s AGENTS.md CLAUDE.md`），Claude 类宿主和其它 agent 宿主各认各的入口文件名，但事实只有一份。DSH 仓库里有 4 处这样的 symlink。

分家纪律的落地：决策记录带生命周期目录（`proposed` / `implemented` / `rejected` 三个状态；`archived/` 是冻结存放地），「已否决」「已过时」「现行」一眼可分——展开在 [`决策记录`](./03-decision-notes.md)。DSH 的完整形态是六类事实六类位置：意图/决定/计划/现状/证据/交付状态，各有自己的 home（[变更闭环](./01-sdlc-change-loop.md) 的环即其位置）。

## 怎么迁移到你的项目

普通项目的落地动作就三条，每条配验收：**写短根文件**（验收：任何一条规则 10 秒内指出唯一 home，根文件里没有教程和故事）；**每条规则链到 home**（验收：删掉链接以外的复制正文，信息不丢）；**`ln -s AGENTS.md CLAUDE.md`**（验收：两个入口文件名，一份事实，零复制）。进一步：把 `docs/` 定位成 current state，「为什么」放进单独的 `docs/adr/`（验收：ADR 能回答「为什么这样决定、什么方案输了」）；README 里记「为什么不做 X」这类负知识（验收：agent 不再重复提出已否决的方案）。

**学走形的检查**：owner 表写了、正文却在每处全文复制——检验法是把链接以外的复制正文删掉，信息应当不丢；丢了说明 home 没写全，该补 home 而不是允许复制。

## 与其它各篇的关系

- **当前事实 vs 决策理由**的分家细则、状态目录、取代与归档——展开在 [`决策记录`](./03-decision-notes.md)；「现在 vs 当初」再往深处走一步就是静态层与动态层的分界——展开在 [`静与动`](./04-static-vs-dynamic.md)。
- **负知识的 DSH 落地**：rejected note、README 的 `## Known Limitations and Deferred Work`、无可观察关系时写进包 README 的省略理由（空 companion 被 `verify-package-invariants` 判 fail）。
- **入口链与渐进披露**：归属的静态骨架（`CLAUDE.md` symlink → 根 `AGENTS.md` → 子树 → README）展开在 [`入口链`](./09-agents-entry-chain.md)；「按需」的运行时由谁决定、超预算怎么回收，展开在 [`披露管线`](./12-progressive-disclosure-pipeline.md)——「按需读取」的原则同源，但那是术的部分。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「02 · 归属」一节）——按需核对，不读不影响理解。
