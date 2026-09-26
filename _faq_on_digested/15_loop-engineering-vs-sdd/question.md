# FAQ 15 · 跟着 DSH 流程开发插件，体感是「loop engineering」而非 SDD：趋势还是错觉，把控力缺口在哪一环？

## 问题

owner 跟随 DSH 流程开发了多个插件之后的体感：从主意到落地的入口只是一个（不一定细抠的）目标/proposal，没有 OpenSpec / Spec Kit 那种「每个阶段产出什么、人在阶段之间审批」的强制物，整个感觉更像 loop engineering。这套做法结果尚可，但「人的把控力不够」。本问题分四层：

1. DSH 官方流程的真实形状——「粗目标 + 循环推进 + harness 兜底」是它的制度设计，还是 owner 的错觉？（站在 FAQ 02/06/11/13 之上，不重做考据）
2. 社区 DSH 插件作者的实际开发流程是否同样如此？有没有人走 spec-first？
3. 更大的范围：这种「强 harness + 轻 spec」的风格，在外部世界（spec-kit / OpenSpec 生态、HN、博客）是不是已被命名、正名或批评的趋势？
4. owner 感到的「把控力不够」具体缺在哪一环——是 loop 风格的固有代价，还是可以低成本补上的控制点？

## 背景

owner 口述（2026-09-26，语音转写整理，全文见 [research.md](./research.md) 的 B 路节）：原来用 OpenSpec 那种 SDD 时，哪个 feature 在队里、落地次序、怎么测过、质量如何，「通通都知道」；现在 DSH 插件开发搭框架时把控力没那么强——只能时不时提醒 agent「要计划计划」，等他说做好了才知道做了几个东西；于是反复要求「显性化到 notes 底下的 proposal 里」，但 notes 底下的东西也不知道是不是像看板一样挪来挪去；现在变成 goal 追问，连 goal 是什么都搞不清楚，就一直催着他往前跑。

与已有 FAQ 的关系：FAQ 02 重建过「DSH 也算 SDD（分层规格）」；FAQ 11 已纠正过一次因果（spec 感是闭环的沉淀物而非上游输入），并画出「人的外圈指挥回路 + agent 内圈六步执行回路」。本篇不重做考据，把问题推进到：这个外圈回路在**多 feature、长周期、插件 repo**的场景里，人实际能看见什么、看不见什么；这个风格在社区与行业里是不是普遍实践；缺口用什么补。

## 回答目标

读完本 FAQ，应当能够：

1. 用「阶段地图 vs 阶段门」「切片层 vs 管线层」区分 DSH 与 spec-kit/OpenSpec 的真实差异，并判断 owner 的体感哪些有制度依据、哪些是可补的缺口。
2. 给出社区插件作者开发流程的证据画像（loop / spec-first / 混合 / 无方法论痕迹）。
3. 给出外部趋势判定：loop-first 是否已是被命名的实践，证据强度如何。
4. 拿到一份「在 loop 风格里补把控力」的控制点清单，按证据与成本排序，不引入整套 SDD 门。

## 范围与证据边界

- 库内结论基线：`dsh-v0.1.7-rc.1`（`46a7f68b09`），与 [00-index](../00-index.md) 声明一致。owner 的插件仓库与 `.dsh/sessions/` 会话日志只作为开发过程证据，不作产品权威来源。
- owner 口述为第一手体感证据；owner 的 `ai_dsh_*` 插件仓库用于把体感落到文件与提交史。
- 委派子代理共四个（社区抽样、外部 discourse、仓内笔记深读、会话日志取证，2026-09-26 放出，记录见 research.md 各路节）；每条论断标注证据强度。

## 阅读入口

- 主回答：[answer.md](./answer.md)
- 维度篇：[01 切片层 vs 管线层](./01-slice-vs-pipeline.md) · [02 外部趋势判定](./02-external-trend-verdict.md) · [03 社区插件作者](./03-community-plugins.md) · [04 owner 复盘的机制定位](./04-owner-control-gap.md) · [05 控制点清单](./05-control-points.md)
- 研究底稿（四路证据·B 路含仓库/笔记/日志三个子面，及 owner 口述全文）：[research.md](./research.md)
- 研究策略备忘（写给复审 agent：研究思路、假设修正史、结论攻击面）：[research-strategy.md](./research-strategy.md)
