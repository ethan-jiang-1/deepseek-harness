# 05 · 根不止一个：goal/plan 之下与之外的另外两个根

## 第一节 修正："goal/plan 是根"只对了一半

检验方法很直接：想象把 `goal`、`goal-round-driver`、`plan-mode` 三行从 `dsh-base` 里 patch 掉（这是合法操作，patch 一行的事）。哪些体感会死？"敢让它自己跑三小时"会死——没有续轮与授权结构，无人值守失去闸门。哪些体感**不会**死？"多路并行"还在（workflow、后台 subagent、工具池与 goal 无关）、"可恢复可审计"还在（会话日志、fork、投影与 goal 无关）、"快"还在（模型路由与 cache 与 goal 无关）。**所以 goal/plan 是最贴近体感的那条根，但不是唯一的根。** 往下挖还有两层，其中一层恰好是 DSH 官方投资最重、最"喜欢"的方向。

## 第二节 根 1（更深）：日志基底——goal/plan 自己就是它的下游

goal/plan 的全部机制细节（[04 第二节、第三节](./04-goal-plan-small-model.md)）其实都建立在一个更早的决策上：**会话日志是唯一事实源**。证据不在别处，就在 goal 自己的设计笔记里：*"The session log remains the only durable authority"*——goal 域承认自己是日志的下游。往下再数一层：

- `goal/change`、`plan/mode`、`tool-workflow/run-start` 全部是 `SessionEventMap` 成员；**model-visible ⟺ logged** 有运行时不变量机械断言（每次 dispatch 逐字比对 `deriveMessages()`，`packages/core/agent-loop/src/invariant.ts:39-42`）。
- 持久化是商品化最彻底的 seam 之一：persistence 单后端（`4553c9d957` 移除 sqlite 后只剩 jsonl）、7 个消费方（[FAQ 08 的 P/C 表](../08_plugin-seam-maturity/answer.md)），fork/resume/transcript/telemetry 全部从同一条流派生。
- 连 subagent 的**谱系**都是日志概念：会话导出把每个后代打包进 `subagents/<id>/session[.vN].jsonl`（`packages/session-query/session-log-export/src/archive.ts:8`），SDK 流按 `packages/sdk/protocol/README.md:43` 转发 *"every session in the runtime, unfiltered"*。

这一层的地位在 [`harness-idea/01`](../../_digested/harness-idea/01-role-and-substrate.md) 里被定为"运行时基底"：插件图 + 事件流。goal/plan 令人觉得是根，只因为它们离体验最近。

## 第三节 根 2（DSH 最擅长最喜欢的）：委派 spine

看官方把钱花在哪：`ctx.subagents` 有 **6 个 Provider**，是全部 29 条 seam 里数量最多的（[FAQ 08](../08_plugin-seam-maturity/answer.md)："数量最多，语义只有三种位置"——进程内 spawn/fork、进程外 ACP/Codex/Claude Code、SDK 驱动；机制见 [`capability-seams/03`](../../_digested/capability-seams/03-subagent后台与产品provider.md)）。再数包：goal 域 4 个包、workflow 组 4 个（engine + worker-thread + tool-workflow + tool-ralph）、experimental 的 agent-team（durable roster + task board + mailbox）与 tool-agent-team、外加 `ctx.jobs` 后台任务。**"把一件事分给很多小执行者，再把结果汇回一本日志"是官方反复重仓的方向**——这个家族的包数超过任何其他领域。

说它"最喜欢"还有一个现场证据：一个开箱 DSH 会话的 captain 默认工具箱里，编排家族（`subagent`/`subagent_fork`/`workflow`/goal 三件套/agent-teams/`job_*`/`ralph`）占据的席位远超其他任何能力族。**DSH 的"native 姿态"就是编排者。**

而且委派 spine 是"快而小模型优秀"的另一半答案——goal 轮次管**时间维度**的拆分（把三小时切成 256 轮以内），委派 spine 管**空间维度**的拆分（`workflow` 的 `agent()`、后台 `subagent`，把一个重构切成 N 个并行子任务）。fan-out 的规模越大，每个叶子节点的任务越小、上下文越新鲜、验收标准越具体——**这恰好是小模型的最优工作区**。两条拆分轴的产物（goal 轮消息、子会话）又全部汇进同一本日志：三条根在"日志"上合流。

## 第四节 根 3：组合层——"开箱"的家

第三条根最朴素：profile/bundle/patch 的层序组合（bundle 层 → profile patch → home patch → `--patch`，[`composition-boot/00-map`](../../_digested/composition-boot/00-map.md)）。"开箱已有 goal、plan"里的"开箱"二字就住在这层——默认姿态是组合层决策，不是内核属性。它也是三条根里唯一**用户可直接指挥**的层：`--patch` overlay、`dsh plugin add`、`cordis.patch.yml`，改体验不用改代码。这层还有 DSH 最自我指涉的爱好：`packages/extensions`（原 self-modification）让 agent 用 `plugin_manager` 安装自己的 bundle、用只读 inspect 工具自省运行时（`cordis_define/cordis_run` 已在 0.1.7 线退役为程序化 runner）——**harness 用自己改自己**，这是官方实践里最"native"的一块，也是第 2 条体感"要自己改造"最深的技术底气。

## 第五节 三个根怎么拼成那三小时

因果链摆出来就完整了：**组合层**把闸门装进默认会话（根 3）→ goal/plan 在日志基底上把自主性做成状态 + 授权（根 1 × [04](./04-goal-plan-small-model.md)）→ 委派 spine 把一个重构切成时间轮次 × 空间子任务（根 2）→ **快而小模型在每个叶子节点上都是最优选择**。三条根缺一，体感都不成立：没有日志基底，不可恢复也不可审计，没人敢放手；没有委派 spine，只剩串行轮次，三小时变十小时；没有组合层，闸门要自己装，"敢放手"的心理成本永远收不回来。

所以修正后的结论是：**"快而小的模型 + 优秀的开发体验"不是 goal/plan 单独解释的，它是一个三根结构——日志基底供可信，委派 spine 供并行，组合层供默认；goal/plan 只是长在最上面的那层"体验皮"。**
