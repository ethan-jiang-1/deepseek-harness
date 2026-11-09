# Why Primitives Instead of a Central Scheduler · 为什么是原语而不是中心调度器

源码核验入口：`packages/workflow/tool-workflow/src/index.ts:324`-`326`、`packages/tool/*`、`packages/subagent/tool-subagent/src/index.ts:113`-`137`、`packages/bundle/base/cordis.patch.yml`。

本页回答：DSH 为什么不做一个读任务、把工作分派到原语上的**中心调度器**？这个形状对插件作者意味着什么？逐原语边界句见 [`selection/01`](../primitive-selection/01-per-primitive-usage-sentences-from-tool-descriptions.md)，官方空白见 [`selection/03`](../primitive-selection/03-unspecified-gaps-and-contradictions-in-usage-policy.md)。

DSH 面对的编排问题是「谁来决定这个任务用哪种原语」。另一种显然的答案是**中心调度器**——一个读任务的引擎把工作分派到原语上（外部叙事想象的正是这个）。DSH 的答案相反：**路由知识分布在原语自身**——每个工具的描述文本和 prompt 节携带自己的使用边界，模型读了边界自己选。这个形状的考量：①策略**随工具插件走**（master convention，`packages/workflow/tool-workflow/src/index.ts:324`-`326`）——换掉工具，它的策略跟着走，不会留下指向不存在工具的孤儿规则；②同包双实例（`subagent` 与 `subagent_fork`）**各带各的 wording**——路由语义与具体工具形态绑定，而不是一份全局文档漂在上面；③它是**自描述且组合敏感的**——preset 层 disable 一个工具行，它的路由语义同时从模型视野消失，不需要任何中心配置同步。代价也真实：路由是单向的，缺少统一选择器；具体空白见本页后文。这个取舍与 [`perspectives/02`](../design-perspectives/02-external-narratives-versus-source-truth.md) 的证据索引相互对应，但不能据此推出系统没有其他全局视图或调度组件。

## 对插件作者的三个后果

1. **你必须自带边界文本**：工具 description 与 prompt section 是唯一保证随插件走的策略载体；写进 docs 或 README 只对人有效（见 [`composition/04`](../preset-composition-and-contract-placement/04-contract-placement-between-policy-and-engine.md)）。
2. **你的插件就是一个选择面**：注册几个工具、每个工具的描述怎么写，直接决定模型能看见哪些选项、会不会选错；不存在一个上层组件替你收敛（见 [`selection/03`](../primitive-selection/03-unspecified-gaps-and-contradictions-in-usage-policy.md)）。
3. **引擎只保证不变量，不保证策略**：深度、归属、持久化、终态是引擎的；什么时候该用哪个、失败该不该重试，是插件与部署的合同（见 [`observation/02`](../completion-and-observation/02-terminal-states-and-bounded-retry-authority.md)）。
4. **兜底要登记偏离**（模式）：如果你在引擎之外补了一层控制面（例如自己的运行查询工具），按「接缝 / 代价 / 退出条件」记账；没有这三项的兜底会变成隐性第二引擎，下一次升 pin 时没人知道它为什么存在。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/workflow/tool-workflow/src/index.ts:324`-`326` | master convention 原文：策略随工具插件走 |
| `packages/subagent/tool-subagent/src/index.ts:113`-`137` | 同包双实例各带各的 wording |
| `packages/experimental/agent-team-profile/README.md:49` | 组合层的互斥替代（选择面被安装面改写） |
