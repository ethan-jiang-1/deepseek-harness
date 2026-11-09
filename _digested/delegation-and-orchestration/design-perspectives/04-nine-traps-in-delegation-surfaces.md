# Nine Traps in Delegation Surfaces · 委派面的九个陷阱

源码核验入口：本页不引入新机制，只把 [`../preset-composition-and-contract-placement/`](../preset-composition-and-contract-placement/00-map.md) 与 [`../completion-and-observation/`](../completion-and-observation/00-map.md) 已核验的事实折成反模式；每条给出机制页与一句判据。

本页回答：**在 DSH 上搭委派面时，最常犯、最难自查的九个错误是什么？看到什么信号就该停下来？**

## 一句话

九个陷阱共享一个形状：**把一个“看起来像状态/能力强弱/完成”的东西，当成了事实。** 它们都能在源码里找到对应的“其实不是这样”。

## 九个陷阱

### 1. worker = 角色克隆

**症状**：通用 `subagent` 不带 `agentPreset`，你以为它比父窄；实际它加入父的 preset 修订，工具面与父相同，还能在深度预算内继续委派。
**机制**：`composeFrom` 加入父修订（[`composition/01`](../preset-composition-and-contract-placement/01-channel-capability-differences-and-inheritance.md)）。
**判据**：读子会话的 `subagent/descriptor` 与 `request/header.tools`；如果与父相同，它就不是 worker，只是“另一个父”。

### 2. 修一个 bug 加一句

**症状**：合同没有分层，引擎事实、公司政策、事故注解全塞进一个 skill；每修一次 bug 加一句，句子越来越长，最后没人知道哪句还有效。
**机制**：载体没有生命周期划分（[`composition/04`](../preset-composition-and-contract-placement/04-contract-placement-between-policy-and-engine.md)）。
**判据**：这句话在升 pin 时会变吗？会 → 引擎段；不会 → 政策段。两段不能住同一家。

### 3. 无执行者的声明

**症状**：写了一张家/能力/期望矩阵，没有任何代码或测试读它；它在下一次改配置时变成谎言。
**机制**：声明没有消费者（[`observation/07`](../completion-and-observation/07-evidence-layers-declaration-mount-mechanism-behaviour.md)）。
**判据**：删掉这份声明，哪条测试会红？没有 → 它只是文档。

### 4. 问 fork 证明继承

**症状**：想知道 fork 是否真的继承了上下文，于是让子代理“说说你看到了什么”；子代理的自述被当成证据。
**机制**：fork 的种子是到最后一个 `turn/end` 的**日志前缀**（[`primitives/02`](../delegation-primitives/02-bounded-delegation-with-fresh-and-forked-subagents.md)）。
**判据**：证据应是子会话日志的前缀/`request/header`，不是子代理的叙述。自述只证明它报告了什么。

### 5. parentId 硬折伪造状态

**症状**：客户端只有 sessions 投影，于是用 `parentId` 反推深度与终态；缺失被渲染成“未开始/失败/空白”。
**机制**：depth 可从 catalog/header 投影推，terminal 只在父会话通知与子会话 `turn/end` 里；这些不都在客户端投影里（[`observation/05`](../completion-and-observation/05-delegation-graph-node-and-edge-projection.md)）。
**判据**：这个字段有持久来源吗？没有 → `unavailable`，不是推断值。

### 6. fake 证真

**症状**：fake provider 的单测绿了，就认为真实装配/真实 provider 可用。
**机制**：fake 绕过真实能力位与错误路径（[`observation/07`](../completion-and-observation/07-evidence-layers-declaration-mount-mechanism-behaviour.md)）。
**判据**：断言里有没有“真实存在”的前提？有 → 必须加真入口/真会话证据。

### 7. 抬一个预算救另一层

**症状**：三层链被拒，于是把某一行的 `maxDepth` 调大；结果深度仍然在另一行被卡，或者把无关路径也放开了。
**机制**：深度是绝对量、按行声明、持久 header 是单调 floor（[`composition/06`](../preset-composition-and-contract-placement/06-depth-concurrency-and-capacity-limits.md)）。
**判据**：先测真实算法（哪一行在哪个深度拒绝），再改；不要用“总体调大”代替定位。

### 8. 把 no gate 读成 no counting

**症状**：看到 workflow 的 `agent()` 没有 `maxDepth` 参数，就以为分支内的 spawn 不计深度。
**机制**：workflow 不给“闸”，但分支 child 仍按 `parent + 1` 计算绝对深度（[`composition/01`](../preset-composition-and-contract-placement/01-channel-capability-differences-and-inheritance.md)）。
**判据**：“没有参数”不等于“没有计数”；去读 `resolveChildDepth` 的输入是谁。

### 9. 续驶代替可读结果

**症状**：子代理结果不可读，于是加一条“可以继续问它”的通道；结果父代理不知道该问什么、问几次，最后靠对话补数据。
**机制**：结果通道的截断与结构化语义（[`observation/02`](../completion-and-observation/02-terminal-states-and-bounded-retry-authority.md)、[`observation/06`](../completion-and-observation/06-workflow-reproducibility-cancellation-and-missing-results.md)）。
**判据**：结果是否可被父代理**直接消费**（结构化、有引用、有边界）？不能 → 先改结果形状，再谈续驶。

## 一张自查表

| 你要下的结论 | 先问 |
|---|---|
| “这个 worker 更窄” | 它真的挂了不同的 preset 吗？ |
| “合同生效了” | 模型这一轮真的看见了它吗？ |
| “这条断言被守住” | 谁在消费它？删掉会红吗？ |
| “fork 继承了” | 你看的是日志前缀还是它的自述？ |
| “状态是 X” | X 有持久来源，还是从 parentId 折出来的？ |
| “测试绿了” | 这是哪一层绿？ |
| “深度不够” | 哪一行、在哪个深度、拒绝信息是什么？ |
| “workflow 没有闸” | 分支的 child 深度从谁算起？ |
| “结果拿到了” | 父代理能直接用，还是要再问一轮？ |

## 源码入口

本页是综合页，不新增断言；每条都链到带 `path:line` 的机制页。复核时按各页末尾的源码入口逐条回查。
