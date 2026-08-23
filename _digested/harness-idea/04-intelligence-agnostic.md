# 与智能无关：为什么这是 harness 思想，不是 LLM 技巧

## 重述前提

[`01`](./01-harness-role.md) 的结论是：可参与性 = 参与规则被字面外置的程度，剩下的门槛是「识字」加一小撮有工具支持的判断。本页检验这个前提是否依赖「背后是 LLM」——结论是：**原则不依赖，形状依赖。**

## 合同面被多重消费，LLM 只是其中一个消费者

![合同面：多个消费者，漂移先撞机器](./figures/contract-surface.svg)

「LLM 读懂」常被当成对合同面的一次测试。但更准确的说法是：**合同面从来不是只给 LLM 读的**。同一面被这些消费者同时消费：

- **编译器**：类型、`assertNever`、declaration merging——编译期拒绝；
- **门禁与生成器**：`verify-*`、freshness gates——提交前红灯，目录从源码生成；
- **双 SDK**：TypeScript 与 Python 都必须投影同一个 loop 与 `SessionEventMap`（[`2026-07-27-typescript-sdk-and-sdk-subagent-backend`](../../.agents/notes/implemented/feature/2026-07-27-typescript-sdk-and-sdk-subagent-backend.md)）；
- **harness 自身**：self-modification——agent 检视、挂载自己的插件（[`2026-07-08-self-referential-cordis-toolset`](../../.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md)）；
- **人类读者与 LLM 读者**。

这个结构带来一个比「LLM 探针」更硬的检验：**规则漂移会先撞上机器，而不是先撞上读者。** LLM 的可读性只是这个面完整性的一个读数，而且是个宽松的读数——LLM 读不懂只说明「参与规则不在系统里」；机器消费不到才说明「规则根本没法执行」。

## LLM 是合同面的探针（probe）之一

coding agent 是「只能读、不能问」的读者的极端情形：它没有部落知识通道，没有体感，没有问人的权利。这带来一个可检验的推论：

- **它能读懂 dsh 并做对，说明 dsh 的合同面真的完整**——不是「看起来完整」。
- 它读不懂的系统，不代表系统不好，只代表**参与规则不在系统里**。

LLM 于是成为合同面的探针——之一，不是唯一，也不是最严格的。dsh 对 agent 可读不是巧合，也不是设计宣言，是生产方式的产物（[`01`](./01-harness-role.md)）：**写作者自己就是 agent，产物自然对 agent 可读。**

## 「不懂技术也能写插件」的机制分解

「不懂技术」的准确含义是「不懂这个系统的部落知识」。写一个插件由三件事组成：

1. **读模板**：`defineTool` 的最小 shape 26 行，合同写在 cookbook 里；
2. **遵守合同**：注册、execute、render——每条都有字面规则与门禁；
3. **跑门禁**：`verify-*`、coverage、snapshot 当场告诉你对不对。

这三样全是**系统的一部分**。剩下的门槛是 TypeScript 与文档的识字能力，加上被拆小的判断（选门禁、判「非平凡」——见 [`03`](./03-paved-road.md) 机制六）——不是行话、不是体感、不是「得先懂 agent loop 的实现」。

所以「不懂技术也能写插件」的准确表述是：**知识门槛（knowledge barrier）被移除，识字门槛（literacy barrier）保留，判断门槛（judgment barrier）被拆小并配工具。** 三者分工，与智能无关。

## 反证：规则在人脑里的 harness 对谁都不可参与

把参与规则放在部落知识里的系统，无论读者是谁（人 / LLM / 更聪明的东西），参与都需要「问」——而问需要通道。新人有通道（问同事），但通道本身不可扩展、不可复制；agent 没有通道，直接失效；未来更强的 reader 同样没有通道。

这类系统的文档写得再好也没用：**文档与规则之间缺的是「从文档推出规则」的可行性**。dsh 的扩展表、合同类型、门禁之所以重要，是因为它们让「文档 → 规则 → 行为」三段都是机器可检查的，中间没有依赖人脑的一步。

## 为什么原则与智能无关，但形状与生产方式有关

**原则**（把参与规则字面化、可执行化）的成立条件是「读者能读字面合同」——这个条件对任何足够强的 reader 都成立：

- 换更强的模型：合同面只会被读得更透；
- 换非 LLM 的读者（脚本、编译器、未来的自动化工具）：合同面同样可消费，因为它是字面结构，不是暗示；
- 换人类读者：照常成立，人类只是多了一条「问」的通道，用不用都行。

但**形状**（dsh 外置的具体形态：gates over prose、Agent Notes 语料库、vendor 进树）是 agent 特有的——它由「写作者是 agent」这个事实塑形。换个生产方式（纯人类团队），同样想外置知识，大概率不会长出 1500 条带归档政策的 note 和一个 54 门禁的聚合器。所以准确的说法不是「与智能无关」，而是：**原则与智能无关，形状与生产方式有关。**

「dsh 作为 harness 的思想」因此不是 LLM 时代的技巧，是**知识外置的工程**；LLM 只是第一个大规模暴露这个性质的读者群——它把「规则在不在系统里」从可争论变成可观察。

## 诚实的边界

- 本专题回答「为什么参与容易且正确」，不回答「为什么值得参与」——那是产品问题。
- 本专题回答「知识门槛如何移除」，不回答「识字门槛如何移除」——那需要模板简化、可视化、自然语言层，是另一类工程（dsh 的 `cordis.yml` 与 patch 层算一部分努力，见 [`../composition/00-map.md`](../composition/00-map.md)）。
- 判断门槛没有被移除，而是被拆小并配工具（[`03`](./03-paved-road.md) 机制六）。
- 「懂行」的读者依然更高效，但**不再是参与的前提**。这是本专题的全部主张。

## 证据入口

- [`../capability-seams/00-map.md`](../capability-seams/00-map.md)（换 provider 不换 Consumer：合同在 Definition）
- [`../composition/00-map.md`](../composition/00-map.md)（不写代码的组合层：patch 与 `!!js`）
- [`docs/architecture.md`](../../docs/architecture.md)（扩展表：文档到规则的机器可查路径）
- [`2026-07-08-self-referential-cordis-toolset`](../../.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md)（harness 自身消费合同面）
- [`2026-07-27-typescript-sdk-and-sdk-subagent-backend`](../../.agents/notes/implemented/feature/2026-07-27-typescript-sdk-and-sdk-subagent-backend.md)（双 SDK 投影同一 loop）
- [`2026-07-05-reconstructable-requests`](../../.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md)（「模型可见 ⟺ 已记录」作为设计决策而非纪律）
