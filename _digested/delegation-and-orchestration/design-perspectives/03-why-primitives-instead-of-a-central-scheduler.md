# Why Primitives Instead of a Central Scheduler · 为什么是原语而不是中心调度器

源码核验入口：`packages/workflow/tool-workflow/src/index.ts:324`-`325`、`packages/todo/tool-todo/src/index.ts`、`packages/jobs/tool-jobs/src/index.ts:251`、`packages/subagent/tool-subagent/src/index.ts:113`-`137`、`packages/bundle/base/cordis.patch.yml`。

本页回答：DSH 为什么不做一个读任务、把工作分派到原语上的**中心调度器**？这个形状对插件作者意味着什么？逐原语边界句见 [`selection/01`](../primitive-selection/01-per-primitive-usage-sentences-from-tool-descriptions.md)，官方空白见 [`selection/03`](../primitive-selection/03-unspecified-gaps-and-contradictions-in-usage-policy.md)。

## 读完你能回答

- 为什么把路由放进工具，而不是做一个中心调度器？
- 这对插件作者有哪几个直接后果？
- 这个取舍的代价是什么？

## 心智模型

核心判断：**选择必须由持有上下文的那一层做，因为只有它知道现在到底在发生什么。**

- 中心调度器需要把「下一步做什么」提前写死，而真实任务常常边做边变。
- 策略随工具走：换工具即换策略，工具消失策略也一起消失。
- 代价是真的：没有统一进度视图、没有任务级回滚、没有自动升级。

DSH 面对的编排问题是「谁来决定这个任务用哪种原语」。另一种显然的答案是**中心调度器**——一个读任务的引擎把工作分派到原语上（外部叙事想象的正是这个）。DSH 的答案相反：**路由知识分布在原语自身**——每个工具的描述文本（部分工具另有 prompt 节）携带自己的使用边界，模型读了边界自己选。这个形状的考量：①策略**随工具插件走**（master convention，`packages/workflow/tool-workflow/src/index.ts:324`-`325`）——换掉工具，它自己的策略跟着走；但**跨原语引用不会自动消失**：team profile 停掉 `subagent`/`subagent_fork` 后，workflow 的 prompt 仍说 "prefer plain subagent calls"，ralph 仍指向 goal/subagents/workflows，这类残留在别的工具的文本里，组合层得自己处理；②同包双实例（`subagent` 与 `subagent_fork`）**各带各的 wording**——按 provider 是否继承上下文分叉，描述子代能看到什么，而不是“何时选 fork”的路由句（那条只在 fork README 里，不在模型面）；③它是**自描述且组合敏感的**——preset 层 disable 一个工具行，它的 description/prompt section 同时从模型视野消失，不需要中心配置同步；④**并非每个工具都有 prompt section**：todo/schedule 只有 description，jobs/goal/ralph/workflow/teams 另有 section。代价也真实：路由是单向的，缺少统一选择器；具体空白见 [`selection/03`](../primitive-selection/03-unspecified-gaps-and-contradictions-in-usage-policy.md)。这个取舍与 [`perspectives/02`](../design-perspectives/02-external-narratives-versus-source-truth.md) 的证据索引相互对应，但不能据此推出系统没有其他全局视图或调度组件。

## 对插件作者的四个后果

1. **你必须自带边界文本**：工具 description（部分工具另有 prompt section）是随插件走的策略载体；写进 docs 或 README 不会被自动注入（模型仍可能 `read`，但没有保证，见 [`composition/04`](../preset-composition-and-contract-placement/04-contract-placement-between-policy-and-engine.md)）。
2. **你的插件就是一个选择面**：注册几个工具、每个工具的描述怎么写，直接决定模型能看见哪些选项、会不会选错；不存在一个上层组件替你收敛（见 [`selection/03`](../primitive-selection/03-unspecified-gaps-and-contradictions-in-usage-policy.md)）。
3. **引擎只保证不变量，不保证策略**：深度、归属、持久化、终态是引擎的；什么时候该用哪个、失败该不该重试，是插件与部署的合同（见 [`observation/02`](../completion-and-observation/02-terminal-states-and-bounded-retry-authority.md)）。
4. **兜底要登记偏离**（模式）：如果你在引擎之外补了一层控制面（例如自己的运行查询工具），按「接缝 / 代价 / 退出条件」记账；没有这三项的兜底会变成隐性第二引擎，下一次升 pin 时没人知道它为什么存在。

## 这个形状放弃了什么

| 放弃 | 代价 | 谁承担 |
|---|---|---|
| 统一选择器 | 模型可能漏选或选错；没有一个中心位置能一次修正全部路由 | 插件作者：写清边界文本；复核者：用探针证明选择 |
| 跨原语引用自动更新 | 停用某个工具后，别的工具的文本仍可能引用它（team profile 停掉 subagent，workflow 的 prompt 仍说 prefer subagent） | 组合层 / 部署者 |
| 集中的策略配置 | 同一份政策被多个角色使用时，必须共享同一载体，否则复制并漂移 | 每个 preset 的维护者 |
| 引擎保证“选择正确” | 正确性只能靠证据分层（声明/挂载/工具面/行为） | 作者座 |

## 什么时候该怀疑这个形状不适合

只有三种情况值得考虑“换形状”，而且都不该在本插件里造调度器：

1. **需要机械拦截**（不是提示）：例如“没有审批就绝不能开 workflow”。这属于 sandbox / approval / hook 的职责，不是工具描述的职责。
2. **需要跨插件的统一策略**：先把政策收敛到一个共享载体（section 或共享 skill）；收敛不了再谈上游。
3. **组合数量爆炸到文本不可维护**：这时该做的是生成/清单与消费它的测试，而不是中心调度器。

## 常见误解

| 你以为 | 实际上 |
|---|---|
| 中心调度器只是还没做 | 是刻意不引入 |
| 策略写在工具里等于不可控 | 换工具即换策略，组合就是控制面 |
| 没有调度器就不需要编排 | 编排在脚本、对话与任务板里发生 |

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/workflow/tool-workflow/src/index.ts:324`-`325` | master convention 原文：策略随工具插件走 |
| `packages/subagent/tool-subagent/src/index.ts:113`-`137` | 同包双实例各带各的 wording |
| `packages/experimental/agent-team-profile/README.md:49` | 组合层的互斥替代（选择面被安装面改写） |
