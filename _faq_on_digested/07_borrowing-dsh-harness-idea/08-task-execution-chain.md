# 任务执行链：agent 的一个动作从发出到落定

> **术 · 执行链。** 三巨头的第二条（三条链的咬合关系见 [answer 的术段](./answer.md)）：**入口链管 agent 读什么**（上一页），**本页管 agent 做什么**——一个 tool-call 从模型发出，经策略、审批、沙箱、执行、归一化，到结果落日志、UI 呈现的完整管线。本页是实战：DSH 的每个环节怎么配置、怎么拦截、怎么观测。五维评估里「静与动」维的「agent 动作无记录、无策略」症状、或要写新工具/加拦截时，来这页抄作业。

## 为什么这条链值得单独一页

agent 的每次「动手」都走这条路。写一个新工具、加一道权限检查、限定沙箱行为、观测工具耗时——全都是在这条链的某一环挂钩子。不理解链的形状，就只能整段抄别人的配置；理解了，每一环你都知道**它是谁、能拦什么、拦不住什么**。DSH 对这条链有一份官方管线图（[docs/tool-execution-pipeline.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/tool-execution-pipeline.md)，由 `scripts/gen-doc-graphs.ts` 生成），下面是它的逐步展开。

## 管线的完整顺序（照图走一遍）

```text
模型发出 tool-call（assistant message 内）
  → 落日志：tool/call 事件（执行前先记录）
  → UI：presentCall(args) 渲染 pending 卡片
  → tools/pre-execute waterfall：hooks、permission、sandbox —— 可 allow / deny / ask
  → ask → ctx.approval 一次性提问：拒绝/取消/无应答 → deny
  → 单调 guards：deny 或弃权；身份受保护
  → tools/execute waterfall：timeout、retry、metrics（包在 dispatch 外层）
  → 工具体 execute()：只返回 canonical JSON value
  → fs/write-intent / fs/edit-intent：tool-fs 变更的守门
  → 工具自有会话事件：todo/write、fs/observed、hook/invoked…
  → tools/post-execute waterfall：accept / block / replace / add context
  → 注册表外层归一化：pipeline/result 快照 throw 变 isError
  → ToolDefinition.finalizeContent：最后的 content-only 不变量
  → tools/result 同步通知：冻结的权威结果
  → 落日志：tool/result 事件（单一 model-facing outcome）
  → UI：presentResult(args, result) 渲染完成卡片
```

几个一眼要记住的设计：

1. **call 先落日志再执行**——「模型可见 ⟺ 落日志」在执行侧的落实：哪怕执行失败，这次调用已经在事实源里（见 [`静与动`](./04-static-vs-dynamic.md)）。
2. **策略全部在工具体之外**——pre-execute、guards、approval、post-execute 都不碰工具体；工具体拿到的参数已被快照冻结（`losslessly snapshotted, frozen model arguments`）。
3. **结果只有一条权威出口**——`tools/result` 事件是单一 model-facing outcome；归一化把任何 pipeline 异常变成 `isError`，模型的下一个上下文里不会出现「未知状态」。

## 每一环你能在哪里挂钩（照抄给插件用）

| 环节 | 挂钩点 | 能做什么 | 拦不住什么 |
|---|---|---|---|
| 执行前策略 | `tools/pre-execute` waterfall | 权限判定、沙箱上下文、直接 deny | 模型选择调用哪个工具（那是可见集的事） |
| 一次性审批 | `ctx.approval` | 把「ask」升级成用户决定 | 已放行的执行 |
| 守卫 | 单调 guards 注册 | deny 或弃权，身份受保护 | post-execute 的内容改写 |
| 执行包裹 | `tools/execute` waterfall | timeout、retry、metrics | 工具体内部逻辑 |
| 文件变更 | `fs/write-intent` / `fs/edit-intent` | 拦截 tool-fs 的写/编辑 | 绕过 tool-fs 的操作（那是 sandbox 的事） |
| 执行后策略 | `tools/post-execute` waterfall | accept / block / replace / add context | 已冻结的 call 记录 |
| 内容终审 | `ToolDefinition.finalizeContent` | 最后的 content-only 不变量 | 结构性结果（已归一化） |
| 观测 | `tools/result` 同步通知 | 拿到权威结果做遥测 | 改结果（已冻结） |

这张表的另一半价值在**归属表**里——DSH 原话：

> **DSH 原话 ·** 拦截执行链的正确位置（[docs/architecture.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/architecture.md) 的 Where new behavior goes 表）
>
> Intercept a request, tool, or turn | use its `agent/*` or `tools/*` event; `agent/turn-stopping` stops a turn

**想拦执行链上的任何东西，答案永远是「挂事件」，不是「改 loop」。**

## 工具体本身的契约（写新工具时照这个写）

[`docs/subsystems/tools.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/tools.md) 定义了 `ToolDefinition` 的完整契约，写新工具前值得通读。最关键的几条：

- **模型可见面是显式 allowlist**：注册表的 `schemas()` 构建模型请求里的 `ToolSchema[]`。DSH 原话：

  > **DSH 原话 ·** 实现字段永不进模型请求（[docs/subsystems/tools.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/tools.md)）
  >
  > `output`/`execute`/`projectContent`/`finalizeContent`/`timeoutMs`/`isConcurrencySafe`/`presentCall`/`presentResult` must never leak into a model request.

- **`execute()` 只返回 canonical JSON value**：渲染由 `output.render()` 这个纯投影完成；异步工作必须观察 `exec.signal`，且只在**自己的工作到达静止**后 settle——注册表保留取消信号但不硬杀同进程代码。
- **结果声明是强制的**：`ToolOutputDefinition`（schema + render + 可选 presentationMeta）每个工具必填——没有「随便返回个什么」的工具。

## 从哪开始

普通项目不用建全这条链，但三个环节从第一天就值得有等价物：

1. **call 先记录再执行**——任何 agent 动作先 append 到你的任务日志（哪怕只有 JSONL），失败调用也在场；
2. **一个 pre-execute 等价物**——工具执行前的权限/白名单检查，deny 走统一出口；
3. **结果单一出口**——工具结果经同一处归一化（异常→isError）再进模型上下文，别让「部分成功」「未知状态」出现。

审批、单调 guard、fs 意图门这些，等威胁模型和复杂度到了再加——挂钩点的形状已经在上面，到时候知道往哪挂。

**学走形的检查**：最常见的走形是「工具体里自己做权限检查」——绕过 pre-execute，策略散在 N 个工具里各写一份；或「结果直接塞回上下文」——不走归一化出口，模型看到未冻结的中间态。检验法：你的策略改动要动几个文件？答案应该是「一个」（挂 waterfall），不是「每个工具一个」。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「08 · 执行链」一节）——按需核对，不读不影响理解。
