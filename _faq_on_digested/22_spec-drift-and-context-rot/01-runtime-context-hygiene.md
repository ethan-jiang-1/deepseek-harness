# 01 · 运行时上下文卫生：长对话里怎么防模型记串与腐化？

这一篇只看 **DSH 产品运行时**（`packages/` 下的会话、压缩、目标、技能与子智能体插件），不谈仓库文档制度。核心设计可以用一句话概括：**把“发生过的完整事实”锁进只追加日志，把“当前这一步喂给模型的上下文”做成可随时裁剪重建的纯函数视图，再把关键任务目标从聊天闲谈里拎出来变成结构化状态。**

---

## 一、底账与视图分家：只追加日志 vs 模型可见面（`surface`）

普通聊天工具把“聊天记录”直接当成“发给模型的消息数组”，一旦做截断或改写，原始现场就没了。DSH 用第一条架构铁律把两件事彻底拆开——**凡是模型能看见的，必须先落日志（`model-visible ⟺ logged`）**：

- **日志只追加不篡改**：[`session`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/session/README.md) 把所有模型可见输入（五类消息事件：`system/message`、`developer/message`、`user/message`、`assistant/message`、`tool/result`）连同请求头配置、工具 JSON Schema 一起记入 append-only 会话日志。渲染后的系统提示词固定作为节点 0 的 `system/message` 入账（见 [`docs/subsystems/session.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md)）。
- **模型历史是纯函数投影**：每轮发请求前，`Session.deriveMessages()` 从事件日志派生出当前模型可见的有序消息面（称为 **`surface`**），投影结果缓存且不可变。至于边界标记、重试、错误等非消息事件，语法上直接禁止携带 `surface` 元数据，不会污染模型视野。
- **人看的记录与模型看的记录各走各路**：当上下文压缩用 `replace` 语义把一段旧对话遮蔽（`shadow`）并原位塞入摘要时，模型看到的 `surface` 变短了；但面向人类阅读的聊天界面（transcript）走的是另一条读取原始追加事件的投影——你往前翻依然能看全所有来龙去脉。
- **环境变化靠追加快照，绝不回改旧消息**：像当前分支、GUI 地址这类动态运行时上下文（[`harness-dev-context`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/harness-dev-context/README.md)），值没变就一字不写以保住大模型前缀缓存（KV cache）；值变了就在下一步输入前追加一条新快照。所有状态型事件都要求携带**变更后的完整状态而非增量补丁**（[`session-projection`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/session-projection/README.md)），保证顺着日志折叠一趟就能准确还原任意时刻的现场。

这层分离的直接效果是：**哪怕摘要写得不够好，也只是视图层的损失，底账从未被悄悄涂改，随时能回放、检索和审计。**

---

## 二、上下文压缩（`compaction`）：有账可查的遮蔽，外加主动淘汰过期结论

对话拉长后必然撞上上下文窗口上限。DSH 的 [`compaction`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md) 子系统没有做成黑盒截断，而是做成了**带事务锁、逐笔算账、且专门清理旧结论的显式遮蔽**：

1. **不动底账，逐笔记录省了多少**：
   压缩过程的三个控制事件（`compaction/start`、`compaction/summary`、`compaction/end`）都是纯日志事件（`log-only`），不塞进模型视野。其中 `compaction/summary` 精确登记了本次被遮蔽的事件序号列表（`shadowedSeqs`）与对应 token 数（`shadowedTokenCount`）。[`compaction-tool-result-pruner`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/compaction-tool-result-pruner/README.md) 裁剪超长工具输出时同理——模型眼里只剩精简版，完整原始输出仍在日志里供精确重放。
2. **崩溃留痕，绝不假装成功**：
   开始压缩先写 `compaction/start` 加锁，随后落盘摘要与替换消息，最后写 `compaction/end` 释放锁。万一进程半路崩掉，日志里会留下可检测的孤儿锁，而不会留下一半残缺上下文继续瞎跑。
3. **护住系统前缀与近期现场**：
   [`compaction-basic`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/compaction-basic/README.md) 默认在上下文达到 `floor(min(W × 0.8, W − O − 65536))` 时触发，尾部最近 `16%`（按 `W − O` 计）的消息原样保留；选区永远从第一条非 `system/message` 节点开始，因此**节点 0 的系统提示词和工具定义永远不会被压缩遮蔽**，也不会把一次完整的工具调用与返回硬生生劈成两半。
4. **最防“方向摇摆腐化”的一招——摘要提示词强制丢弃过期信息**：
   很多敏捷会话跑歪，是因为第 2 轮定的方案在第 15 轮推翻了，第 20 轮压缩时模型又把第 2 轮的旧话抄进了摘要。`compaction-basic` 在压缩指令里专门堵死了这个漏洞：如果历史里已经有一块 `<compacted-summary>`，**严禁原样往前照抄，必须保留依然成立的事实、主动丢弃已经过期的旧信息（`drop stale ones`）**，合并成一份反映最新状态的结构化检查点，并固定产出 `## Primary Request and Intent` 章节，确保换个模型接手也能无损续做。

---

## 三、把工作状态拎出闲谈：`goal`、`plan` 与 `todo` 的关键差别

只靠聊天文本记“我现在做到哪一步、总目标是什么”，聊久了迟早会被稀释。DSH 把这三类状态做成了专门的日志事件，但**它们回灌模型的方式截然不同**——用错就会踩坑：

| 状态机制 | 怎么落盘 | 会不会重新喂给模型？ | 防跑偏与安全细节 |
|---|---|---|---|
| **Goal（持久目标）** | 单条 `goal/change` 持久事件，每个会话同一时刻只有一个当前目标（[`goal`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal/README.md)） | **会**。在自动续轮时，[`goal-round-driver`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal-round-driver/README.md) 每一轮都会注入完整的 `<goal_round>` 目标块，直到该轮被后续压缩遮蔽 | 目标本身跨轮次、跨重启、跨 `fork` 存活；但**自动续跑开关（`armed`）故意不持久化**——重开旧会话或 `fork` 后自动解除，必须由人显式确认（`rearm`），防止隔了一天打开会话它自己顺着昨天的错方向狂奔 |
| **Plan Mode（计划模式）** | 单个 `log-only` 整值事件 `plan/mode`，取最后一条记录即为当前状态（[`plan-mode`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/plan/plan-mode/README.md)） | **会**。重启、`fork` 和压缩后通过折叠日志恢复状态，组装系统提示词时据此决定是否挂载只读规划约束段（`plan:policy`） | 未经用户在审批卡上点通过，模型退不出计划态 |
| **Todo（待办面板）** | 整表替换快照 `todo/write`（[`tool-todo`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/todo/tool-todo/README.md)） | **绝对不会！** 源码类型注释明写 `log-only UI state, never derived history` | 它只是模型写给前端底栏进度条看的展示数据，压缩后模型自己根本看不见早先的 `todo` 表——**重要验收条件千万别只往 `todo` 里塞** |

除了把目标存成值，运行时还配了三道**“把模型拉回真实工作区现场”**的纠偏栅栏：

1. **续轮指令直接点破“旧聊天记录可能已过期”**：`goal-round-driver` 的续轮提示词（[`prompt.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal-round-driver/src/prompt.ts)）明令模型以当前工作区文件、工具返回结果和持久会话状态为准，动手核实现场，不得假设早先的口头叙述仍然有效；声称完成前必须先取证、重读当前 `goal` 再标记完成。
2. **收官轮禁止脑补战果**：目标结束时的收尾提示词（[`wrapup.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/tool-goal/src/wrapup.ts)）要求只汇报本会话工具实打实确认过的事实，没查过的细节老实直说，严禁编造。
3. **工作区指令被压缩盖住后自动原地复活**：[`agent-instructions`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/agent-instructions/README.md) 把仓库里的 `AGENTS.md` / `CLAUDE.md` 作为普通 `user/message` 注入历史。一旦长对话压缩把这份基线规则遮蔽了，下一次进入步骤前的 `pre-step` 检查会自动把它重新补发进可见面——压缩能清掉闲聊，但清不走仓库立下的底线规矩。

---

## 四、源头节流、支线隔离与历史打捞

防止上下文烂掉的另一半功夫，是一开始就别把不该塞的东西全倒进主会话：

- **技能（Skill）两层按需加载，不提前灌说明书**：[`tool-skill`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/tool-skill/README.md) 只在上下文里常驻一份轻量目录（技能名 + 默认最多 500 字符的摘要），并在目录头严令模型“这只是摘要目录，未调用 `skill` 工具加载正文前严禁自行揣测步骤”；技能列表变动时整份替换（清空技能也会追加空目录退役旧名字）。同时，常驻入口文档（如根 `AGENTS.md`）由门禁卡死词数上限，从源头杜绝规则文件无限发福。
- **子智能体（Subagent）按需切走噪音**：遇到要翻几十个文件试错的支线任务，派出去跑不会撑大主会话——[`subagent-spawn-in-process`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-spawn-in-process/README.md)（`spawn`）从零空白对话起步，任务提示词必须自包含；[`subagent-fork-in-process`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-fork-in-process/README.md)（`fork`）只拷贝父会话**已完成轮次的一次性前缀快照**，分叉之后父子各写各的，互不串味。
- **被遮蔽的细节仍可全文检索**：[`session-query-sqlite`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session-query/session-query-sqlite/README.md) 默认对 `current`、`shadowed` 和 `log-only` 三类事件全部建索引——哪怕某段报错堆栈在主对话里被压缩遮蔽了，搜会话历史照样能捞出来。仓库还在 `packages/experimental/` 下提供了同工作区跨会话只读检索包（[`session-search`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/session-search/README.md) 与 [`tool-session-query`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/tool-session-query/README.md)，默认关闭）。

---

## 五、看清运行时的能力上限

产品层机制很扎实，但有四件事它明说做不到，使用时心里要有数：

1. **没有任何独立的“语义跑偏裁判”**：[`goal`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal/README.md) 与续轮驱动器都白纸黑字写着 `No independent evaluator`；[`repeat-tool-reminder`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/guard/repeat-tool-reminder/README.md) 在模型用完全相同参数连调同一工具第 3、5、8 次时注入温和提醒，防的是**原地死循环空转**，防不住模型“精神抖擞地往错误架构方向狂写代码”。
2. **压缩终归是有损的，且有压不动的地方**：摘要必然丢失逐字细节；系统提示词、工具列表和不可拆分的单步超大原子消息无法靠 `compaction-basic` 缩减；多模态图片卸载（[`compaction-image-offload`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/compaction-image-offload/README.md)）在没有转存后端时是不可逆的占位符替换。
3. **不开续轮，压缩后不会自动重申目标**：`<goal_round>` 只在自动调度下一轮时重发；普通一问一答模式里压缩完并不会额外复读一遍目标。
4. **跨会话记忆默认不开启**：每次新开会话默认都是干净起点，跨会话搜索仍属实验特性；凡是隔天、换会话还要算数的重要决定与约束，必须落进仓库文件里——这就交棒给了下一篇的仓库治理防线。
