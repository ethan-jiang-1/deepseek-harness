# 01 · 先分清烂的是哪一层

「上下文腐化」和「规格漂移」经常被当成一句话说，但它们出事的载体不同、可观测信号不同、能用的手段也不同。DSH 的规则体系里恰好有四个互相独立的概念分别对应，先把它们对齐，后面的机理才好读。

## 四种失败，四个载体

| 失败 | 出事载体 | 一句话机理 | 仓库里的对应词 |
|---|---|---|---|
| **上下文腐化** | 一次会话的**模型可见面**（surface） | 模型这一步看见的历史，是日志的一次投影；叙述、摘要、旧结论都可能还在，而工作区已经不是那样了 | surface / shadow / 重建 |
| **规格漂移** | 仓库里的**事实载体**（文档、清单、类型粘贴、图） | 同一事实被写在第二个地方，改了一处忘了另一处 | one home per fact / 生成目录 / freshness |
| **方向反复** | **决策的版本化**方式 | 决定被原地改写，于是「当时为什么这样」消失，后来者只能重新吵一遍 | supersede / consolidate / rejected |
| **存量堆积** | 决策语料的**总量** | 每篇都还在、都没人删，检索成本随时间线性上升 | archive / delete / 不设 INDEX |

前三种是「内容错了」，第四种是「内容没错但太多」。混着谈就会得出「写少一点就好了」这种既不正确也不可执行的结论——DSH 对第四种给的是归档与删除判据，同时用写入门槛压住新增量，两者配套（见 [03](./03-note-process-anti-drift.md)、[05](./05-agile-swings.md)）。

## 上下文腐化：模型看见的不是项目，是投影

DSH 的会话日志是仅追加的（append-only），而模型请求里的历史是**从日志派生出来的 surface**：

- `Session.deriveMessages()` 把事件日志投影成模型看见的 `Message[]`，投影规则是纯函数，缓存且冻结（`docs/subsystems/session.md:668`，`[原文]`）。
- 消息型事件（`system/message`、`developer/message`、`user/message`、`assistant/message`、`tool/result`）都要声明自己怎么加入 surface；非消息型事件（边界标记、重试、错误）不得携带 surface 元数据（`docs/subsystems/session.md:298`、`:262`，`[原文]`）。
- `replace` 语义会**遮蔽（shadow）**一段 surface 并把新事件插在原位；被遮蔽的事件仍在日志里（`docs/subsystems/session.md:338`，`[原文]`）。
- 面向人的 transcript 走另一条投影，读的是「以 append 方式进入 surface」的事件，**因为 surface 故意遮蔽了被替换覆盖的范围**（`docs/subsystems/session.md:358`，`[原文]`）。

所以「上下文腐化」在 DSH 里不是一个不可观测的过程：**被压掉的东西有 seq 记录，被保留的摘要是一条普通 `user/message`，而完整历史仍在日志中**。腐化的风险被限制在「摘要写得不好」这一层，不是「旧事实被悄悄改写」这一层。

## 规格漂移：仓库自己点名的三种形态

DSH 对规格漂移的命名比外部讨论更具体。`docs/AGENTS.md` 的 slop checklist 直接列出会腐烂的写法（`docs/AGENTS.md:65`-`69`，`[原文]`）：

- **重复的规则**：「搜索一个有辨识度的短语；留一个家，其余链接过去。」
- **历史写错了层**：正文只陈述当前事实，历史链接到它的 owner。
- **实现状态标注**：「Status rots; the repo layout and package manifests carry it.」
- **手抄的目录、JSDoc、测试与包清单**：源码或生成器才是权威。

插件仓语料把这件事总结得更狠：**大型仓库最常见的漂移不是代码错误，而是「东西放错了地方」——同一事实出现在第二份手写清单、生成的产物被手改、测试期望输出堆进无关目录**（[`repo-harness/08-repository-taxonomy.md:5`](../../_dsh_plugin_agent_ready_development/repo-harness/08-repository-taxonomy.md)，`[原文]`）。

## 方向反复：不是腐化，是「决定被版本化」

「先往东、后来改往西」本身不是错误，是迭代的常态。出问题的是记录方式：如果把第一篇 spec 原地改成西向版本，那么**东向阶段的理由、放弃的备选、当时的约束全部消失**，团队既无法解释为什么现在这样，也无法判断将来该不该改回去。DSH 的规则把这件事拆成两条：

- 事实（路径、包名、默认值）**原地更新**：「Rewrite stale facts in place; do not append change history.」（[`.agents/notes/implemented/AGENTS.md:7`](../../.agents/notes/implemented/AGENTS.md)，`[原文]`）
- 决定（以及它的理由）**不可原地改写**：「A reversal of the decision or its rationale requires a new Agent Note and cross-link.」（[`.agents/notes/implemented/AGENTS.md:13`](../../.agents/notes/implemented/AGENTS.md)，`[原文]`）

这两条一起，才让「左晃右晃」变成可回溯的轨迹而不是丢失的历史。

## 存量堆积：数量级是真实的

本基线实测：`.agents/notes/` 下活跃 **343** 篇（proposed 42 + implemented 293 + rejected 8）、归档 **924** 篇；`.agents/skills/` 19 个（实测口径见 [`reference.md`](./reference.md)）。[FAQ 20](../20_agent-note-quality-bar/answer.md) 用的是同一组数字。

这不是「太多了该清理」的证据，而是说明**这套制度必须自己回答容量问题**：它的回答是「默认不写（多数改动不需要 Note）+ 写完有归档与删除判据 + 不建集中索引」，细节见 [03](./03-note-process-anti-drift.md)。

## 一个可操作的判据

遇到「感觉要腐化了」的时候，先问一句：**这条内容现在住在哪一层？**

| 症状 | 真实层 | 去哪一节 |
|---|---|---|
| 模型把旧叙述当现状、摘要吃掉了细节 | 模型可见面 | [02](./02-runtime-anti-rot.md) |
| 文档/清单/图与代码对不上 | 事实载体 | [03](./03-note-process-anti-drift.md)、[04](./04-gates-and-evidence.md) |
| 说不清为什么变成现在这样 | 决策版本 | [05](./05-agile-swings.md) |
| 找东西越来越慢、没人删 | 语料容量 | [05](./05-agile-swings.md)、[06](./06-how-to-use.md) |

下一节：运行时机理。
