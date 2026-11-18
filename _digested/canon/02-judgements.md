# 02 · DSH 自己立下的判断

> 这一页的功效是**写作判据**，不是机制教学：一句话能不能写，先看它违反这七条里的哪一条。「系统为什么长这样」的机制解释归各专题（`docs/architecture.md` 与对应机制页），本页只给每条的原文与它对措辞的约束。

**遴选判据**：同时满足才入选——(a) 原文写在 `docs/architecture.md`、`AGENTS.md` 或 `docs/glossary.md`；(b) 它约束的是**别人怎么描述 DSH**（而不是某个包怎么写代码）；(c) 违反它会产生可指认的错误表述。流程义务（如升级指南、门禁证据）归 [`10-process`](./10-process.md)，不重复收在这里。

每条三段：**它怎么说**（逐字引用）、**因此怎么写**（这条判断对措辞的约束）、**出处**。第二段是从第一段推出来的，不是原文——引用时只能引第一段。

## 1. 每一个部分都是插件

**它怎么说**：「Every part of the product is a plugin, including the model adapter, the tool registry, the session log, and the agent loop itself, so each is replaceable from configuration.」（[architecture](../../docs/architecture.md)）

**因此怎么写**：`product` 指整台运行中的 dsh，不修饰单个对象；插件、bundle、profile 单独都不叫 product。

## 2. 一个事实只有一个家

**它怎么说**：「Each fact has one home: the tier whose job it is; elsewhere, link there.」（[docs/AGENTS](../../docs/AGENTS.md)）

**因此怎么写**：同一条事实不在两页展开；第二处只给链接。写不出「这条事实的家在哪」，就说明还没想清楚。

## 3. 模型看得见就等于记下来了

**它怎么说**：「**Model-visible means logged.** Every model request must be reconstructable from the log. New model-visible inputs require session events.」（[architecture](../../docs/architecture.md)）

**因此怎么写**：描述任何「模型看到了什么」时，要能同时指出它对应哪个会话事件；指不出的，是运行时临时拼的，不能写成机制。

## 4. 新行为挂在文档化的扩展点上

**它怎么说**：「New behavior attaches to a documented extension point. Changing the loop itself updates this map.」（[architecture](../../docs/architecture.md)）

**因此怎么写**：讲扩展时先点名扩展点；讲不出扩展点的「扩展」，实际是改 loop。

## 5. waterfall 必须委托

**它怎么说**：「**Waterfall listeners MUST call `next()`** to delegate; returning without it short-circuits the chain」（[AGENTS](../../AGENTS.md)）

**因此怎么写**：描述监听行为时必须说清它是否短路；「加了监听器」不等于「链路照常」。

## 6. 破坏性改动当场记进升级指南

这条义务的原文与流程面在 [`10-process`](./10-process.md#破坏性改动当场记)（不在此重复引文）。写作侧后果只有一句：**改契约的页面必须同批给出升级说明**；没有升级说明的破坏性改动，不算完成。

## 7. seam 是完整能力，绝不是其中一个角色

**它怎么说**：「The seam is the complete capability, never one role; reserve the term for that meaning and name a constituent by its role, class, service, contract, or extension point.」（[glossary](../../docs/glossary.md)）

**因此怎么写**：说某个包时用它的角色名（Service Definition / Provider / Consumer）；只有三角色齐备时才用 seam。

## 怎么用这篇

- 这七条是**判据**，不是文风建议，也不是机制索引：它们回答「这句话能不能这么写」，不回答「这个机制怎么工作」。
- 「因此怎么写」是推论，不是原文；引用时引第一段。
- 本语料自己对这些判断的评价，归 [`../harness-idea/`](../harness-idea/00-map.md)，不写在这里。
- 判断 3、4、6 的流程机制（会话事件、扩展点、升级指南怎么写）分别归 [`../session-and-loop/`](../session-and-loop/00-map.md)、[`../capability-seams/`](../capability-seams/00-map.md) 与 [`../development-flow/`](../development-flow/00-map.md)。
