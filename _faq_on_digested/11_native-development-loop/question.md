# FAQ 11 · DSH 支持的开发习惯很多，但哪一种是它"最自然"的？为什么驾驭它写东西会感觉轻松？

## 问题

DSH 是一个规则密度很高的仓库（AGENTS.md、双层 AGENTS、门禁脚本、skills、Note 制度），理论上它"支持"很多种开发习惯：spec-first、TDD、plan-first、全量验证仪式、goal 续轮长跑……但在这之中，**哪一种是阻力最小、被制度反复强化、做起来最不需要意志力的那条路径**？更进一步：很多人（尤其是让 agent 在里面干活的观察者）会感到"驾驭 DSH 写东西非常轻松、很愉悦"，这个体感的机制根源是什么？

这个问题不能从单份文档得出。`AGENTS.md` 是义务清单，不告诉你哪条路最常被走；FAQ 02/06 重建的"分层规格"是静态结构，不告诉你马达怎么转；FAQ 10（v4flash 三条体感）解释的是运行时体感，不是开发体感。需要把三类证据放在一起才能收敛：

1. 仓库自己的 `dsh-*` skills（写作时 10 个、语料取其中 9 个，其中 dsh-translate-docs 仅限显式调用；到 `fb2c4b9e69` 为 11 个）——它们是"反复出现的场景"的固化，每个 skill 都暗示了一种没它就会痛的工作方式；
2. git 历史（upstream/master）——文档声称的习惯是否真的被实践，可量化；
3. 运行时自身的助推结构（todo/plan/guard/skills/interaction 的默认行为）——harness 认为里面工作的 agent 该怎么干活。

## 回答目标

读完本 FAQ，应当能够：

1. 说出那条最自然的路径是什么（本 FAQ 命名为**窄证据切片闭环**），以及它的六步。
2. 解释"轻松愉悦"体感的三个机制来源：记忆外包、反馈延迟最小、犯错代价低——以及它们如何把"正确"与"省力"对齐。
3. 区分 FAQ 02 的静态"分层规格"与本题的动态闭环，并纠正一个可能的因果倒置（spec 是闭环的沉淀物，不是上游输入）。
4. 用 git 历史量化检验这个习惯是否真实被实践（含与文档声称的分歧处）。
5. 说出这套习惯的代价与边界，以及它明确不优先的几种习惯。

## 范围

行为与制度结论以 `dsh-v0.1.5-rc.2`（commit `fb2c4b9e69`）的文档、Notes、skills 为准（写作时为 checkout `08b582ea02`）；git 历史量化取自 `upstream/master`（tip `0a53fb55be`，release `0.1.2-alpha.2`，最近 100 个 PR landing merge），本次同步未重算。输入参考（FAQ 02 spec-driven、FAQ 10 goal-plan 三根）只作为待检验假设，结论独立重建后再对位。

## 阅读入口

- 主回答：[窄证据切片闭环：最自然的开发习惯与"轻松"的机制](./answer.md)
- 三路调查原始发现：[研究底稿](./research.md)
- 分角色与分层的展开：[开发结构总览](./developer-journey-structure.md)、[插件旅程实例推演](./developer-journey.md)、[传统代码插件](./developer-journey-plugin.md)、[智能体工作流插件](./developer-journey-workflow.md)、[运行时用户旅程](./runtime-user-journey.md)
