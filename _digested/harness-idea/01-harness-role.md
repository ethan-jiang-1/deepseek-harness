# Harness 的职责：把参与规则编码进系统

## 问题

有些系统文档齐全、注释规范，新来的人（或 coding agent）仍然上不了手。原因不是文档写得差，而是**参与规则（participation rules）的位置不对**：规则住在资深开发者的脑子里，文档只描述了局部，系统的形状没有约束任何人。

## 因果：为什么 dsh 长成 agent 的形状

先说因果，因为它是本专题其余判断的根。dsh 不是在某个时刻决定「要对 coding agent 友好」，而是**它的开发主力就是 coding agent**。repo 最早的 Agent Note 之一，第一句写的是：

> This codebase is developed primarily by coding agents. Agents follow enforced gates far more reliably than prose conventions, and "a lot of work" is not a cost argument when agents do the labor.
>
> —— [`2026-06-11-quality-gates`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)

把这个因果链展开：

![由 agent 所造：因果链与正反馈闭环](./figures/built-by-agents.svg)

- **写作者没有部落知识通道**：agent 不能问、不能「在这仓库干过三年」、不能读团队氛围。为了让写作者自己第二天还能继续工作，知识必须外置——这不是善意，是生存需要。
- **技术栈选在 LM 训练分布的高密度区**：TypeScript + ESM + pnpm + vitest，都是 coding agent 最熟的语言与工具；选择有记录、有被拒方案（[`2026-06-16-pnpm-over-yarn`](../../.agents/notes/implemented/process/2026-06-16-pnpm-over-yarn.md)、[`2026-06-17-ts-build-config`](../../.agents/notes/implemented/process/2026-06-17-ts-build-config.md)）。
- **分布之外的技术直接搬进仓库**：Cordis 是 niche 框架且当时还是 rc.6，于是整个框架被 vendor 进 `vendor/`，带 manifest（upstream SHA + 本地修改日志），pre-commit 门禁强制「改 vendored 源码必须同步 manifest」（[`2026-06-11-vendor-cordis-as-source`](../../.agents/notes/implemented/process/2026-06-11-vendor-cordis-as-source.md)）。

所以「dsh 的技术容易被 coding agent 消化」的完整答案是：**一半是选出来的（主流栈），一半是搬进来的（vendor 框架），背后的推力是写作者自己就是 agent。** `docs/architecture.md` 那句「推荐用 agent 探索代码库」是事后注脚，不是设计源头。

## 框架给原语，harness 给参与规则

框架给的是原语：plugin、context、inject、events、effects——「你能用什么」。harness 额外回答四个问题：

| 问题 | 字面答案在 dsh 哪里 |
|------|---------------------|
| 有什么可挂的点 | `docs/architecture.md` 的扩展表（18 行「目标 → 机制」）与事件目录（`docs/event-producer-consumer.md`） |
| 怎么挂 | 服务注入、`ctx.effect()` 注册、事件监听——每种挂法都有合同（JSDoc 门禁强制） |
| 挂了发生什么 | 生命周期由 fiber 拥有：插件卸载时贡献一并撤销；`request/header` 快照记录实际生效的请求头 |
| 怎么知道挂对了 | 门禁（`verify-*`）、per-file 100% 覆盖率、snapshot 基准、运行时 invariant |

注意一个容易被当成理所当然的事实：**「框架」这一层本身也被搬进了仓库**（`vendor/`）。dsh 的回答不依赖任何仓库外的魔法——连框架原语的实现都在树里、带 manifest。框架不承诺这四个答案；承诺它们的是 harness。**「harness」与「框架」的差别，就是参与规则是否被外置（externalized）。**

## 参与规则的三层载体

| 载体 | 可读 | 可查 | 可执行 | 会腐烂 | 谁在消费 |
|------|------|------|--------|--------|---------|
| 人脑（部落知识 · tribal knowledge） | 否 | 否 | 否 | 会（遗忘、离职） | 只有本人 |
| 文档（prose） | 是 | 是 | 否 | 会（漂移） | 只有人类读者 |
| 系统本身（类型、事件、表、模板、门禁、运行时检查） | 是 | 是 | 是 | 被门禁阻止 | 编译器、门禁、生成器、双 SDK、harness 自身、人类与 LLM 读者 |

后两列是这张表的要点，它们解释「为什么下沉到第三层」才持久：**文档会漂移，系统不会；文档只有人读，系统被机器消费——漂移会先撞上机器。** dsh 三层都用，但把关键规则下沉到第三层：

- **归属**：扩展表 18 行「目标 → 机制」直接回答「这段代码放哪」。扩展点不再是散落的知识。
- **合同**：Service Definition 是抽象类（可注入、有运行时存在）；事件经声明合并成为类型化 map；`SessionEventMap` 成员默认 required-on-read——构建时不知道事件类型的代码直接拒绝日志。
- **门禁（gates）**：`verify-export-jsdoc`（每个导出必须有 JSDoc）、`verify-package-invariants`（每个包必须登记运行时 invariant）、`doc-typecheck`（文档里的 TypeScript 必须能编译）、`test:coverage`（per-file 100%）。规则不是劝告，是红灯。
- **词汇**：`docs/glossary.md` 规定一个概念一个词；文档标准规定「一个事实一个家」（[`docs/AGENTS.md`](../../docs/AGENTS.md)）。没有两个词指同一物，没有同一事实的两个版本。
- **设计意图**：`为什么` 单独住在 Agent Notes——1124 条 implemented（另有 proposed / rejected / archived，共约 1500 条），被分类、双语、归档政策管辖（[`2026-06-20-agent-note-classification`](../../.agents/notes/implemented/process/2026-06-20-agent-note-classification.md)）；`docs/` 只写当前状态。读者从字面拿到当前规则，不用从 git log 反推。

## 结论

harness 的职责 = 让「正确参与」不依赖参与者的背景知识。做到的系统，读者只需要识字（literacy），加上一小撮**被拆小、有工具支持的判断**（见 [`03`](./03-paved-road.md) 的「门禁本身要学」）；做不到的系统，读者需要行。dsh 特殊之处不是「把它当工程目标」，而是**它的生产方式让「外置知识」成为工程现实**——写作者自己就是没有行的那类读者。

## 证据入口

- [`2026-06-11-quality-gates`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)（因果来源：开发主力是 coding agent）
- [`2026-06-11-vendor-cordis-as-source`](../../.agents/notes/implemented/process/2026-06-11-vendor-cordis-as-source.md)（框架层被搬进仓库）
- [`docs/architecture.md`](../../docs/architecture.md)（扩展表、事件域）
- [`docs/glossary.md`](../../docs/glossary.md)（一词一义）
- [`../../AGENTS.md`](../../AGENTS.md)（standing orders：面向 agent 的规则本身）
- [`docs/event-producer-consumer.md`](../../docs/event-producer-consumer.md)（每个事件的 dispatcher / listener 矩阵）
- [`../../scripts/run-gates.ts`](../../scripts/run-gates.ts)（门禁聚合器）
- [`../../packages/core/agent-loop/src/invariant.ts`](../../packages/core/agent-loop/src/invariant.ts)（运行时 invariant 实例）
- [`../composition/00-map.md`](../composition/00-map.md)（profile / bundle / patch 层：组合规则外置）
