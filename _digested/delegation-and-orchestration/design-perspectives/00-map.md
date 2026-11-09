# Design Perspectives · 设计判断

## 一句话

本组回答：**这套编排为什么长成这个形状，外部叙事哪里说错了，以及在这套面上最常见的九个陷阱。** 它不重复机制（在 [`../delegation-primitives/`](../delegation-primitives/00-map.md)），也不给操作步骤（在 [`../preset-composition-and-contract-placement/`](../preset-composition-and-contract-placement/00-map.md)）。

> 名词不熟（seam / preset / Activation / 终态 / 能力面）：先读 [`02` 词与平面](../02-terms-and-planes.md)，有具体困惑查 [`03` 十二问](../03-newcomer-questions.md)。

## 页面

| 页 | 回答 |
|---|---|
| [`01`](./01-graph-computation-essence-invariant-derivation-and-execution.md) | 编排里真实的图有哪几个、引擎对图做什么与拒绝什么：不变量、准入与派发三件分置 |
| [`02`](./02-external-narratives-versus-source-truth.md) | Captain 规划器、Kahn 调度、`dsh rollback --task`、KV Cache 看板这些外部说法，逐条的源码真相 |
| [`03`](./03-why-primitives-instead-of-a-central-scheduler.md) | DSH 为什么把路由放进工具而不是中心调度器，以及这对插件作者的四个后果 |
| [`04`](./04-nine-traps-in-delegation-surfaces.md) | 九个反模式：从“worker 是角色克隆”到“续驶代替可读结果”，附自查表 |

## 四个判断，先记住

1. **图不是被调度的对象**：workflow 的“图”是一段 JS，Teams 的图是任务板准入，goal 的图是轮次；没有拓扑排序器（[`01`](./01-graph-computation-essence-invariant-derivation-and-execution.md)）。
2. **策略住在选择面上**：工具的描述文本就是策略；换工具即换策略，没有全局开关（[`03`](./03-why-primitives-instead-of-a-central-scheduler.md)）。
3. **外部框架的等价物大多不存在**：DSH 没有中心 DAG 执行器、没有 `rollback --task`、没有 KV 看板；把外部名词直接映射过来会读出错觉（[`02`](./02-external-narratives-versus-source-truth.md)）。
4. **九个陷阱共享一个形状**：把“看起来像状态/能力强弱/完成”的东西当成事实（[`04`](./04-nine-traps-in-delegation-surfaces.md)）。

## 入口问题

| 你在问 | 进入 |
|---|---|
| 为什么 DSH 不像 LangGraph 那样有中心调度？ | [`03`](./03-why-primitives-instead-of-a-central-scheduler.md) |
| “DSH 的图”到底指什么？有几张图？ | [`01`](./01-graph-computation-essence-invariant-derivation-and-execution.md) |
| 外部文章说 DSH 有 Captain / Kahn / rollback / KV 看板，是真的吗？ | [`02`](./02-external-narratives-versus-source-truth.md) |
| 我们这套搭法最常错在哪？ | [`04`](./04-nine-traps-in-delegation-surfaces.md) |
