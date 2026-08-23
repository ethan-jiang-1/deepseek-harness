# Harness 的职责：把参与规则编码进系统

## 问题

有些系统文档齐全、注释规范，新来的人（或 coding agent）仍然上不了手。原因不是文档写得差，而是**参与规则（participation rules）的位置不对**：规则住在资深开发者的脑子里，文档只描述了局部，系统的形状没有约束任何人。

## 框架给原语，harness 给参与规则

框架（Cordis 这层）给的是原语：plugin、context、inject、events、effects——「你能用什么」。harness（dsh 这层）额外回答四个问题：

| 问题 | 字面答案在 dsh 哪里 |
|------|---------------------|
| 有什么可挂的点 | `docs/architecture.md` 的扩展表（`Where new behavior goes`）与事件目录（`docs/event-producer-consumer.md`） |
| 怎么挂 | 服务注入、`ctx.effect()` 注册、事件监听——每种挂法都有合同（JSDoc 门禁强制） |
| 挂了发生什么 | 生命周期由 fiber 拥有：插件卸载时贡献一并撤销；`request/header` 快照记录实际生效的请求头 |
| 怎么知道挂对了 | 门禁（`verify-*`）、per-file 100% 覆盖率、snapshot 基准、运行时 invariant |

框架不承诺这四个答案；承诺它们的是 harness。**「harness」与「框架」的差别，就是参与规则是否被外置（externalized）。**

## 参与规则的三层载体

| 载体 | 可读 | 可查 | 可执行 | 会漂移 |
|------|------|------|--------|--------|
| 人脑（部落知识 · tribal knowledge） | 否 | 否 | 否 | — |
| 文档（prose） | 是 | 是 | 否 | 会 |
| 系统本身（类型、事件、表、模板、门禁、运行时检查） | 是 | 是 | 是 | 不会（由门禁维护） |

dsh 三层都用，但把**关键规则下沉到第三层**：

- **归属**：扩展表 18 行「目标 → 机制」直接回答「这段代码放哪」。扩展点不再是散落的知识。
- **合同**：Service Definition 是抽象类（可注入、有运行时存在）；事件经声明合并成为类型化 map；`SessionEventMap` 成员默认 required-on-read——构建时不知道事件类型的代码直接拒绝日志。
- **门禁（gates）**：`verify-export-jsdoc`（每个导出必须有 JSDoc）、`verify-package-invariants`（每个包必须登记运行时 invariant）、`doc-typecheck`（文档里的 TypeScript 必须能编译）、`test:coverage`（per-file 100%）。规则不是劝告，是红灯。
- **词汇**：`docs/glossary.md` 规定一个概念一个词；文档标准规定「一个事实一个家」（[`docs/AGENTS.md`](../../docs/AGENTS.md)）。没有两个词指同一物，没有同一事实的两个版本。
- **设计意图**：`为什么` 单独住在 Agent Notes（决策记录）；`docs/` 只写当前状态，禁止「previously / now」这类变迁史。读者从字面拿到当前规则，不用从 git log 反推。

## 结论

harness 的职责 = 让「正确参与」不依赖参与者的背景知识。做到的系统，读者只需要识字（literacy）；做不到的系统，读者需要行。dsh 是把这一条当作工程目标、而不是文档风格的少数系统之一。

## 证据入口

- [`docs/architecture.md`](../../docs/architecture.md)（核心包、扩展表、事件域）
- [`docs/glossary.md`](../../docs/glossary.md)（一词一义）
- [`../../AGENTS.md`](../../AGENTS.md)（standing orders：面向 agent 的规则本身）
- [`docs/event-producer-consumer.md`](../../docs/event-producer-consumer.md)（每个事件的 dispatcher / listener 矩阵）
- [`../../scripts/run-gates.ts`](../../scripts/run-gates.ts)（门禁聚合器）
- [`../../packages/core/agent-loop/src/invariant.ts`](../../packages/core/agent-loop/src/invariant.ts)（运行时 invariant 实例）
- [`../composition/00-map.md`](../composition/00-map.md)（profile / bundle / patch 层：组合规则外置）
