# 可读性（legibility）从哪来：为什么 coding agent 容易读懂 dsh

## 读者模型：会读，不会问

coding agent 与人类读者有一个关键差别：它没有部落知识（tribal knowledge）通道。它不能问资深开发者、看不懂团队氛围、没有「在这个仓库干过三年」的体感。它只有一件事做得极好——**读字面材料**；有一件事完全做不到——**读言外之意**。

所以「一个仓库对 agent 可读」有一个可检验的定义：**它的全部参与知识都以字面形式存在**。dsh 的六个机制共同凑出这个性质。

## 机制一：词汇就是合同（vocabulary as contract）

`docs/glossary.md` 规定一个概念一个词（one canonical term per concept）：seam 指三角色完整能力、turn / step / round 严格分层、scope 与 lineage 是两回事。prose 与代码用同一批词（`ctx.tools`、waterfall、`request/header`），文档与源码之间没有翻译层。

读者不需要「领域翻译」这一步。看到 `ctx.agents`，glossary 和架构文档说的是同一件事，源码里也是同一件事。翻译层是常见的可读性杀手：文档说「组件」、代码叫 `Component`、review 里叫「那个东西」。

## 机制二：合同外显为类型

- Service Definition 是 Cordis `Service`（抽象类或注册表），**不是 TypeScript `interface`**——抽象类有运行时存在、可注入、可被 `ctx.get` 找到；interface 只活在类型空间，合同因此无处安放。
- 事件经声明合并成为类型化 map（`SessionEventMap`），`emit` / `waterfall` / `serial` 是调用合同的一部分。
- `SessionEventMap` 成员默认 **required-on-read**：构建时不知道新事件类型的代码，拒绝读取该日志（除非事件携带 `ignorable: true`）。类型即文档，且由编译器强制执行。

类型是给编译器读的文档。dsh 把合同放进类型里，等于让编译器当第一个 reviewer——它比任何人类 reviewer 都严格、都即时。

## 机制三：归属有决策表（decision table）

agent 在陌生代码库里最贵的操作是回答「**这段代码放哪**」。dsh 用一张表显式回答：

- `docs/architecture.md` 的扩展表：18 行「目标 → 机制」（加模型提供方 → 在 `ctx.llm` 注册 adapter；加模型面向能力 → 在 `ctx.tools` 注册；加人类命令 → 在 `ctx.commands` 注册……）。
- 消化后的三分法：看到一个 `ctx.<key>`，先问它是 spine 服务、一条 seam、还是 bundle 组合点（见 [`../capability-seams/00-map.md`](../capability-seams/00-map.md)）。
- 事件目录把每个事件的 dispatcher / listener 列成矩阵（`docs/event-producer-consumer.md`）——「谁在听这个事件」直接查表，不用读代码。

「放哪」从猜测题变成查表题，是 agent 可读性的最大单项提升。

## 机制四：结构同构，文档不漂移

- 每个包同样布局：`src/types.ts` 只放类型、测试在包级 `tests/`、同一 tsconfig 模板、注册进恰好一个 aggregate（[`docs/development.md`](../../docs/development.md)）。学会一个包 = 学会全部包。
- 每个包有 README + JSDoc 合同 + `./invariant` 登记（`verify-package-invariants` 强制）。
- 目录（`tool-catalog`、`config-catalog`、`module-graph`、`event-producer-consumer`）全部**从源码生成、freshness-gated**：文档不可能与代码漂移，读文档就是读代码。

手抄目录是文档漂移的源头。dsh 把「目录」交给生成器，「目录」就不再是知识负担，而是索引。

## 机制五：机制写成规则，不写成历史

- `AGENTS.md` 直接陈述不变量：waterfall 监听器必须 `next()` 委托、注册即效果（registrations are effects）、模型可见 ⟺ 已记录（model-visible ⟺ logged）、显式优于隐式（explicit over implicit）。
- 文档标准禁止「previously / now / renamed」这类变迁史（change history）；当前状态散文（current-state prose），一个事实一个家（one home per fact）（[`docs/AGENTS.md`](../../docs/AGENTS.md)）。
- 设计意图单独住在 Agent Notes（`为什么`、`放弃了什么`、`怎么验证`），且 implemented 状态用现在时描述已落地的现实。

读者不需要从 git log 或代码注释反推设计意图——意图是显式交付物。这同时消除了文档自相矛盾的可能：一个事实只有一个家，两个版本不可能并存。

## 机制六：读者模型就是 agent

- `docs/architecture.md` 开篇明说：「We recommend using an agent to explore the codebase and understand its architecture.」
- [`docs/AGENTS.md`](../../docs/AGENTS.md) 把根 `AGENTS.md` 定位为「rules an agent needs in context in every session」——仓库为 agent 的上下文预算写的规则。
- 仓库里存在 `writing-for-agents`、`dsh-prose-standard` 等技能：**写文档给 agent 读**是仓库内的正式工作流。

这不是「顺手对 agent 友好」，是把 agent 当作一等读者来设计文档。

## 可读 ≠ 简单

dsh 不简单：机制多、包多、事件多。但「可读」来自组织，不来自简化——复杂系统里，把知识组织成可查的表、可验证的合同、可复制的范本，比把系统做小更可行。读 dsh 的正确姿势是查表，不是通读。

## 证据入口

- [`docs/glossary.md`](../../docs/glossary.md)（一词一义）
- [`docs/architecture.md`](../../docs/architecture.md)（扩展表、事件域、推荐用 agent 探索）
- [`docs/event-producer-consumer.md`](../../docs/event-producer-consumer.md)（事件矩阵）
- [`../../AGENTS.md`](../../AGENTS.md)（standing orders 本身）
- [`../session-and-loop/01-session-event-map.md`](../session-and-loop/01-session-event-map.md)（required-on-read 机制）
- [`../cordis-runtime/02-waterfall-与事件合同.md`](../cordis-runtime/02-waterfall-与事件合同.md)（waterfall 合同）
- [`../capability-seams/01-三角色与分包装.md`](../capability-seams/01-三角色与分包装.md)（seam 三角色）
