# 可读性（legibility）从哪来：为什么 coding agent 容易读懂 dsh

## 读者模型：有问的通道，但没有免费的部落知识通道

coding agent 与人类读者的关键差别，不是「完全不能问」——dsh 里就有 approval、AskUserQuestion、human command，agent 可以问人。差别是：**它没有零成本、非正式、默认存在的部落知识通道**。它不能靠「在这个仓库干过三年」补出没人写下来的约定；每一次提问都有成本，而真正危险的部落知识往往连问题都形不成。

所以「一个仓库对 agent 可读」（legibility）有一个可检验的标尺：**它的参与知识尽可能以字面形式存在**，包括「这里没有检查」和「这条路已被否掉」这类负知识。没有仓库能真正做到 100%；dsh 的八个机制共同把这一比例推到很高，并把剩下的判断拆小、配工具。编号只为引用方便：机制之间边界故意重叠，不是八块拼图。

## 机制一：运行时语法就是词汇

参与 dsh 只需要反复使用五个词：Context、Plugin、Fiber、Event、Effect。它们不是五个孤立 API，而是一套语法：能力地址空间、最小贡献单元、运行时实例、有控制权的扩展点、带所有者的可逆副作用（[`docs/cordis-primer.md`](../../docs/cordis-primer.md)）。读者不需要为每个子系统学习一套新的注册、作用域与卸载协议。

> A fiber is one loaded plugin instance: its lifecycle state, validated config, and registered effects. `ctx.fiber` is the current fiber, and `ctx.effect()` delegates to it.
>
> —— `docs/cordis-api/fiber.md:6`（基线 `183f08e9c6…`）

这比「词汇表统一」更深一层：同一套原语贯穿工具、provider、策略、UI、loop，所以学会一个插件形状，就能在整棵树上迁移。

> Domain vocabulary for DeepSeek Harness uses one canonical term per concept.
>
> —— `docs/glossary.md:5`（基线 `183f08e9c6…`）

## 机制二：一词一义，文档与代码没有翻译层

[`docs/glossary.md`](../../docs/glossary.md) 规定一个概念一个词（one canonical term per concept）：seam 指三角色完整能力、turn / step / round 严格分层、scope 与 lineage 是两回事。prose 与代码用同一批词（`ctx.tools`、waterfall、`request/header`），文档与源码之间没有翻译层。

读者看到 `ctx.agents`，glossary、架构文档和源码说的是同一件事。翻译层是常见的可读性杀手：文档说「组件」、代码叫 `Component`、review 里叫「那个东西」。

> `SessionEventMap` members are required-on-read by default — builds that do not know a type refuse the log unless the event carries the envelope's `ignorable: true`.
>
> —— `AGENTS.md:108`（基线 `183f08e9c6…`）

## 机制三：合同外显为类型

- Service Definition 是 Cordis `Service`（抽象类或注册表），**不是 TypeScript `interface`**——抽象类有运行时存在、可注入、可被 `ctx.get` 找到；interface 只活在类型空间，合同因此无处安放。
- 事件经声明合并成为类型化 map（`SessionEventMap`），`emit` / `waterfall` / `serial` / `bail` 是调用合同的一部分。
- `SessionEventMap` 成员默认 **required-on-read**：构建时不知道新事件类型的代码，拒绝读取该日志（除非事件携带 `ignorable: true`）。

类型是给编译器读的文档。dsh 把合同放进类型里，等于让编译器当第一个 reviewer——它比任何人类 reviewer 都严格、都即时。

## 机制四：归属有决策表，事件有控制权表

agent 在陌生代码库里最贵的操作是回答「**这段代码放哪**」和「**这段代码有什么控制权**」。dsh 用两张表显式回答：

- [`docs/architecture.md`](../../docs/architecture.md#where-new-behavior-goes) 的扩展表：「目标 → 机制」（行数见 [`claims.json`](./claims.json) 的 N3；加模型提供方 → 在 `ctx.llm` 注册 adapter；加人类命令 → 在 `ctx.commands` 注册……）。更细的 feature → mechanism 表在 [`docs/cookbook/extension-cookbook.md`](../../docs/cookbook/extension-cookbook.md)。
- [`docs/event-producer-consumer.md`](../../docs/event-producer-consumer.md) 把每个事件的 dispatcher / listener 列成矩阵，并带分发模式。

「放哪」从猜测题变成查表题。分发模式本身也是合同的一部分：事件名说「发生什么」，`waterfall` / `serial` / `parallel` / `emit` / `bail` 说「插件拥有什么控制权」——`bail` 在第一个返回值的监听器处短路，结果归它。读者不需要从调用栈反推自己能不能截断这条链（[`docs/cordis-primer.md`](../../docs/cordis-primer.md#cordis-waterfall-semantics)）。

> Services declare event names through TypeScript declaration merging, then dispatch them as `emit`, `waterfall`, `parallel`, `serial`, or `bail` depending on whether listeners observe, wrap, fan out, run in order, or stop at the first bail value.
>
> —— `docs/cordis-primer.md:12`（基线 `183f08e9c6…`）

## 机制五：结构同构，生成目录不漂移

- 每个包同样布局：`src/types.ts` 只放类型、测试在包级 `tests/`、同一 tsconfig 模板、注册进恰好一个 aggregate（[`docs/development.md`](../../docs/development.md)）。学会一个包 = 学会全部包。
- 每个包有 README + JSDoc 合同；`./invariant` 只在有独立可观察关系时登记（`verify-package-invariants` 强制，空/忽略 reporter 判 fail）；README 还必须写 Model Experience 和 Known Limitations（`verify-package-readme-model-experience` / `verify-package-readme-limitations`）。

> Package READMEs document model, token, and KV-cache effects using the canonical Model Experience format.
>
> —— `packages/AGENTS.md:27`（基线 `183f08e9c6…`）
- 目录（`tool-catalog`、`config-catalog`、`persistence-catalog`、`module-graph`、`event-producer-consumer`、`capability-seams`、`cordis-api`）全部**从源码生成、freshness-gated**：读文档就是读代码。

手抄目录是文档漂移的源头。dsh 把「目录」交给生成器，「目录」就不再是知识负担，而是索引。生成器同时也是「合同面被机器消费」的第一个实例：机器读，所以漂移当场断掉。

## 机制六：机制写成规则，意图写成记录

- `AGENTS.md` 直接陈述不变量：waterfall 监听器必须 `next()` 委托、注册即效果、模型可见 ⟺ 已记录、显式优于隐式。
- 文档标准禁止「previously / now / renamed」这类变迁史；当前状态散文（current-state prose），一个事实一个家（[`docs/AGENTS.md`](../../docs/AGENTS.md)）。
- **设计意图住在 Agent Notes——一个被政策管辖的一等语料库**：语料库规模见 [`claims.json`](./claims.json) 的 N1–N2（用 `git ls-tree` 在基线上重算，prose 不手写固定总数）；每条有分类、双语、归档纪律；「非平凡改动必须带 note」本身是一条规则（[`2026-07-19-require-agent-notes-for-non-trivial-changes`](../../.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md)）；归档有专门的 [`dsh-archive-agent-notes`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md) skill。note 记的是「为什么、放弃了什么、怎么验证」。

为什么这一条对 agent 可读性致命重要：**「为什么」恰好是 fresh agent 最不可能自己生成的知识。** 它可以从代码推出「是什么」，但推不出「为什么不是另一种做法」；被拒方案写在 note 里，agent 才能不重蹈覆辙。

## 机制七：负知识也被外置

fresh agent 最贵的错误不是「不会做」，而是**重走已经否掉的路**。dsh 有四类显式负知识：

- `rejected/` Agent Notes 保留被否提案及其失败理由；
- `archived/` 冻结历史，不当现行权威，文档门禁也跳过它；
- `./invariant` 只在有独立可观察关系时登记；无关系的包省略 companion 并在 README 记录原因（[`2026-08-28-omit-unneeded-invariant-companions`](../../.agents/notes/implemented/simplification/2026-08-28-omit-unneeded-invariant-companions.md)）——省略即默认，例外进 README；
- package README 的 `## Known Limitations and Deferred Work` 由 `verify-package-readme-limitations` 门禁检查。

负知识让读者能查到「这里没有检查」和「这条路已被否掉」，而不是靠试错重新发现。

## 机制八：上下文预算内的渐进入口

coding agent 的真实约束不只有「读不读得懂」，还有**上下文预算内能否找到对的入口**。dsh 的文档 tier 为此分层：

- 根 [`AGENTS.md`](../../AGENTS.md) 只放 standing orders（预算 1950 词），细节链接到 home；
- [`docs/architecture.md`](../../docs/architecture.md) 是 2400 词以内的有序地图；
- 生成的 catalog 提供穷举查询，不要求读者通读；
- skills 提供可调用的程序化工作流，如 [`dsh-doc`](../../.agents/skills/dsh-doc/SKILL.md)、[`dsh-prose-standard`](../../.agents/skills/dsh-prose-standard/SKILL.md)。
- 双语文档由配对门禁管理：`docs/AGENTS.md` 要求“Pairs update together”，`verify-translation-pairing` 把英文/中文/记录三方钉在一起。

> **Pairs update together**: Terminology-guided, single-pass active-agent work repositions first-use annotations, preserves untouched prose, and re-records.
>
> —— `docs/AGENTS.md:43`（基线 `183f08e9c6…`）

`verify-doc-budgets` 把字数预算钉成门禁。可读性因此来自组织，不来自把系统做小；正确读法是查表，不是通读。

> **Document current state, not change history.** Name live mechanisms, not PRs, commits, stack positions, or "previously/now/no longer". Keep history in commits, PRs, Agent Notes, or postmortems.
>
> —— `docs/AGENTS.md:38`（基线 `183f08e9c6…`）

## 可读 ≠ 简单

dsh 不简单：机制多、包多、事件多。但「可读」来自组织，不来自简化——复杂系统里，把知识组织成可查的表、可验证的合同、可复制的范本、可调用的 skill，比把系统做小更可行。八个机制是同一事实的不同侧面，不是八块拼图。

## 证据入口

- [`docs/glossary.md`](../../docs/glossary.md)（第 5 行；一词一义）
- [`docs/architecture.md`](../../docs/architecture.md)（第 72、137 行；事件域、扩展表）
- [`docs/event-producer-consumer.md`](../../docs/event-producer-consumer.md)（事件矩阵与分发模式）
- [`../../AGENTS.md`](../../AGENTS.md)（第 108 行；required-on-read 与 standing orders）
- [`docs/AGENTS.md`](../../docs/AGENTS.md)（第 38 行；当前状态散文、tier taxonomy、字数预算）
- [`2026-06-11-quality-gates`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)（第 11 行；读者模型的因果来源）
- [`2026-07-19-require-agent-notes-for-non-trivial-changes`](../../.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md)（note 语料库的规则）
- [`2026-08-28-omit-unneeded-invariant-companions`](../../.agents/notes/implemented/simplification/2026-08-28-omit-unneeded-invariant-companions.md)（省略非必要 companion 的裁定，现行权威）
- [`2026-07-19-package-invariant-runtime-contracts`](../../.agents/notes/implemented/architecture/2026-07-19-package-invariant-runtime-contracts.md)（第 24 行；现文是「无独立关系即省略 companion 并在 README 记原因」）
- [`docs/cordis-primer.md`](../../docs/cordis-primer.md#cordis-waterfall-semantics)（waterfall 合同）
- [`docs/development.md`](../../docs/development.md)（包结构同构）
- [`docs/cookbook/extension-cookbook.md`](../../docs/cookbook/extension-cookbook.md)（feature → mechanism 表）
