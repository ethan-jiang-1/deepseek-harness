# 01 · `goal + plan` 外置状态循环：为什么快而小的模型在这里反而跑赢慢大模型？

在很多单轮问答或极简 CLI 工具里，想让 Agent 独立扛下几个小时的重构，往往只能押注参数量最大、单步思考最慢的旗舰推理模型——因为跨步记忆、计划拆解、遇错不早退、防自我欺骗全都得靠模型自己的注意力硬撑。

DSH 走了一条完全相反的路：**凡是能从模型脑子里拿出来变成确定性状态机的职责，一律收归 Harness。** 当跨步的规矩和记忆由外部系统锁死后，留给模型的任务退化成了“看清当前工作区现场，把眼前这一步干漂亮”——这恰恰是低延迟快模型（`deepseek-flash`）配单步高强度思考（`reasoningEffort: max`）最舒服的甜点区。

---

## 一、职责大腾挪：把“长跑耐力”从模型参数里剥出来

先看一张直观的职责对照表——在 DSH 里，“靠谱的长程重构体验”到底是由谁供给的：

| 长任务最容易崩的环节 | 传统做法靠谁扛 | DSH 交给哪层机制管 |
|---|---|---|
| **跑了两小时忘掉最初目标和约束** | 靠模型超长上下文注意力硬记 | **会话日志 + `<goal_round>` 注入**：每轮从持久日志重建历史，开头固定重申目标与当前轮次，并明令禁止轻信早期自述 |
| **遇到报错就偷懒交卷或草率喊卡壳** | 靠提示词反复叮嘱“请务必认真完成” | **`tool-goal` 结构化门禁**：完成前必须重读目标并附客观证据；自动续轮前 3 轮内直接从代码层面拒绝 `blocked` 申报 |
| **还没想清楚就乱改一通代码** | 靠人工在聊天框里盯着喊停 | **`plan-mode` 审批态**：调用 `exit_plan_mode` 弹出交互式决策卡，人类点 `Approve` 前禁止进入施工阶段 |
| **大改几十个文件串行跑太慢、污染主上下文** | 在同一个长对话里硬刷几百次工具调用 | **`workflow` 与异步 `subagent`**：当场生成编排脚本并发拉起子智能体，主会话只收结构化阶段结果 |
| **进程意外退出或超长中断后前功尽弃** | 只能重开对话凭印象接着聊 | **每轮前强制落盘 + 严格回放**：驱动器每次派活前先调 `ctx.sessions.flush()` 落检查点；重启后完整还原阶段，等人类授权续跑 |

一句话概括这套分工：**`reasoningEffort: max` 负责补足“单步之内”的代码推理深度；而“步与步之间”的记忆、诚实、节奏与容错，全部由外置插件接管。**

---

## 二、`goal` 续轮机制：为什么敢放手让它自己跑三小时？

很多人以为 `/goal` 只是给模型加了一句“没做完继续做”的循环提示词。翻开 [`packages/goal/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/goal) 下的四个包就会发现，它是一套跟 `agent-loop` 内核完全解耦、纯靠公共扩展点挂载的受控状态机。

### 1. 日志是唯一持久权威，彻底杜绝“模型三小时前吹过的牛”

`dsh-goal` 内部不建私有数据库，也不信进程内存里的临时变量——唯一持久事实就是写入会话日志的 `goal/change` 事件（记录目标文本、修订号 `revision`、当前阶段 `phase: active | paused | blocked | complete` 与最大轮次上限）。更新时强制走 `{ id, revision }` 乐观锁校验（CAS），拿到过期视图的写入直接报 `GOAL_STALE_REVISION` 拒绝；回放时对每条事件做严格校验，日志一旦损坏宁可当场报错停机也绝不静默跳过。

更关键的是 [`goal-round-driver/src/prompt.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal-round-driver/src/prompt.ts) 在每轮自动续跑开头塞给模型的固定指令：

> `Treat the current workspace, tool results, and durable session state as authoritative; inspect them instead of assuming earlier narration is still current.`

这段话直接立下了一条硬规矩：**模型在前面轮次里写下的口头总结（“我已经修好了 X 模块”）对后续步骤没有任何权威性**；每一轮接力都必须老老实实去读当前工作区文件、跑真实工具验证。这从根子上切断了小模型长对话最常见的“顺着上一轮幻觉越编越歪”。

### 2. 四道安全闸门兜住无人值守下限

敢把会话挂在后台跑几个小时，靠的是四道写死在代码里的机械闸门（详见 [`goal/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal/README.md) 与 [`goal-round-driver/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal-round-driver/README.md)）：

1. **轮次预算只扣自动轮，人类插话零损耗**：`defaultMaxGoalRounds` 默认上限为 `256` 轮。只有真正进入模型历史的 `goal` 来源消息才消耗预算；中途人类插话补充背景或纠偏，一概不扣轮次。耗尽上限时自动转为 `blocked`（错误码 `round-limit`）停机候命。
2. **防早退门槛与体面收尾**：在自动续轮期间，如果已启动轮次不足 3 轮，工具执行器会直接拒绝模型的 `blocked` 请求（提示“有难度或不确定不算阻塞，先尝试推进”），逼模型真去排查问题；只有人类直接发起的轮次不受此限。一旦成功标记 `complete` 或 `blocked`，系统注入收尾提示让当轮自然结束，而不是粗暴腰斩工具流。
3. **等子任务收拢 + 先落盘再派活 + 异常零盲目重试**：续轮驱动器只在主 Agent 完全空闲、且名下仍在运行的子智能体全部结算完毕后才触发下一轮；入队前强制等待 `ctx.sessions.flush()` 持久化落盘，并在 `agent/pre-step` 拦截链前后两次核对目标修订号。遇到输出截断（`max-tokens`）、用户取消或任何未预期异常，一律停止自动续跑——绝不搞失控的死循环重试。
4. **“目标状态”与“自动点火开关”彻底分家**：目标的 `active` 阶段会写进日志跨重启保留，但驱动自动续跑的开关 `activation`（`armed | disarmed`）纯属进程内存状态。**只要进程重启、会话恢复或分叉（fork），开关一律强制归零为 `disarmed`**，必须由人类亲口发话恢复（或敲 `/goal` 控制）才会重新点火，防止旧后台任务重启后背着人乱改工作区。

---

## 三、`plan` 模式的一个精妙细节：为了保住快模型的缓存，绝不动工具列表

打开 [`packages/plan/plan-mode/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/plan/plan-mode/src/index.ts) 和 [`packages/bundle/base/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml) 里的出厂配置，会看到两个反常规的设计决定：

1. **只管“人类拍板流程”，不另造一套沙箱权限**
   计划模式的持久状态只有一个布尔事件 `plan/mode { active }`。模型调研完代码后，必须把以 `#` 标题开头的完整 Markdown 方案作为当轮唯一且最后一次工具调用传给 `exit_plan_mode`，经 `ctx.userQuestions.ask` 在前端渲染出专门的方案评审卡片（`Approve` / `Keep planning`，或直接关闭卡片亲自打字回复）。
2. **切换模式时故意保留全部写入工具定义（保 KV Cache！）**
   按直觉，进只读规划态应该把 `write`、`edit` 从工具表里摘掉；但 `plan:policy` 原文明明白白写着原因：
   > `The tool catalog stays the same across modes for request-cache stability.`

   因为在大模型 API 请求里，工具 Schema 排在消息历史最前面——**一旦进出计划模式增删了一个工具定义，前面积攒的几万 token 调研代码历史瞬间全部失去前缀缓存命中资格！** 所以 DSH 宁可用系统提示词压制写入冲动（外加底层的审批管线兜底），也要死保快模型在“先调研规划 → 批准后立刻施工”交接点上的缓存不断裂。同时提示词明确禁止在规划期调 `todo_write`，把“批前定方案（`exit_plan_mode`）”与“批后跟进度（`todo_write`）”切得清清楚楚。

---

## 四、“用 plan 打造 dynamic workflow”的真相与两笔必算成本账

### 1. 没有叫“dynamic workflow”的隐藏开关，只有三个原语的现场接力

把源码翻遍也不会找到名为 `dynamic workflow` 的包。重度用户感受到的丝滑体验，其实是三个彼此完全解耦的原语在模型手里串起了接力棒：

1. **先用 `/plan` 框定边界**：模型翻完代码交出分阶段改造方案，人在评审卡片上点 `Approve`；
2. **当场把方案翻译成一次性编排脚本**：[`workflow`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workflow/workflow/README.md) 引擎明确规定只跑调用方当场传入的 JS 脚本（不存静态模板、不支持嵌套工作流）。模型直接把刚批准的各个子系统改动写成 `parallel()`（带栅栏并发）或 `pipeline()`（阶段流式推进），在每个 `agent()` 调用里塞入明确的验收条件；
3. **外层由 `goal` 兜底收口**：`workflow` 运行期间发出的 `tool-workflow/run-start` 等四个事件驱动前端 [`ui-workflow-run`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-workflow-run/README.md) 折叠进度卡实时刷新；等一批子代理跑完回到主会话，`goal` 驱动器再推着主 Agent 跑集成检查、修边角漏网之鱼，直到整场重构收官。

### 2. 为什么这招能烧出 10 亿 token？看清回传税与缓存护城河

想把“Flash + `max` 思考”用得既快又不肉疼，必须看懂 [`llm-deepseek`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/llm-deepseek/README.md) 里的两笔底层经济账：

- **第一笔是 `max` 档的推理原文回传税（Reasoning passback）**：在 DeepSeek Messages 协议下，只要开启了思考，每一轮助手生成的完整推理过程都会原样拼回后续每一次请求的历史上下文里。一个跑上百步的长会话，如果每步都开 `max` 猛想，历史前缀膨胀极快——这也是为什么单价便宜、吞吐高的 `deepseek-flash` 是这套打法得以成立的经济前提（你也可以通过插件在 `agent/request` 拦截点按步骤动态调节 `reasoningEffort`，重活开 `max`、轻活降 `high` 或 `low`）。
- **第二笔是前缀缓存（KV Cache）的保命设计**：细看 [`models.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/llm-deepseek/src/models.ts) 里默认主力 `deepseek-flash` 的目录声明，官方特意给它标上了两项关键能力——`systemPromptUpdate: 'in-history'` 与 `toolUpdate: 'addition-only'`。这意味着哪怕会话中途系统提示词发生了更新（比如状态提醒变化）或按需增量挂了新工具，适配器也会把变更**追加在已缓存历史消息的末尾**，而不是回头篡改开头的 `system` 消息把整条前缀缓存炸掉。

看懂这两笔账，就能彻底明白为什么老手在长程重构里锁死 `deepseek-flash` 一路跑到底：每少断一次前缀缓存、每切碎一个子任务，省下来的都是真金白银的时间和预算。
