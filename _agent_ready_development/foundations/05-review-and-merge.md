# 05 · Review 与 merge：从能运行到能交付

## 三种判断不能互相替代

一个变更能否交付，需要区分三种不同判断。前两种适用于每个 PR；显式用户交互只在 Plan、受限操作或交互机制要求用户决定时出现：

| 判断 | 主要回答 | 不能替代 |
|---|---|---|
| automated checks（自动检查） | 类型、格式、测试、构建和平台结果是否满足规则 | 意图和设计是否正确 |
| semantic review（语义评审） | 实现、文档和证据是否真的符合任务意图、适用时的 Issue 与 Agent Note | 实际运行检查或用户决定 |
| explicit user interaction（显式用户交互） | Plan 是否批准、受限操作是否授权、交互问题是否回答 | 代码质量与 CI 结果 |

Semantic review 可以由具备上下文的人或 agent 执行。`.github` 中的 human-review policy（人类作者 PR 策略）描述哪些 PR metadata 进入强制范围，不规定 reviewer 必须是人。

## Review 应沿真实使用路径检查

Reviewer 不只读变更行，还要连接四类上下文：

1. Issue（如有）或任务上下文：外部结果是什么；
2. 非平凡变更的 owning Agent Note：为什么选择当前方案；
3. 源码与当前文档：系统交付后怎样工作和失败；
4. Tests、snapshots 和 CI：哪些场景已经建立可重复证据。

高风险变更还要沿真实 consumer（消费方）和 entry path（入口路径）检查错误、取消、资源释放、并发、安全限制、模型可见内容与发布产物。完整语义维度见 [code review 高级参考](../advanced-sdd-flow/06-review-and-human-role.md)。

## Review 是一个反馈循环

Finding（评审发现）应指出 defect（缺陷）、location（位置）、impact（影响）和 evidence（证据）。作者逐条核验：成立就修改并补证据，不成立就用可验证事实解释。

新的 push 会更新 PR head，也可能使旧的 review 结论或 checks 失效。因此合并前要重新读取当前 diff、unresolved threads（未解决讨论）和 checks，而不是沿用上一次查看的状态。

## 普通 PR 怎样结束

Required checks 通过、review requirements 满足、PR 不再是 Draft 且 GitHub 报告可合并时，普通 PR 才进入 merge。合并后目标分支成为当前交付状态。

Merge 只改变分支和 PR 状态，不会自动改变 Agent Note 的生命周期；精确的归档条件由 [Agent Note 高级参考](../advanced-sdd-flow/01-agent-note-lifecycle.md) 说明。

## 需要深入时

普通变更在这里结束。需要核对精确 policy、Agent Note 状态、Plan 审批、证据路由、高风险 review、分支改写或依赖式 PR 栈时，从 [Advanced SDD Flow 目录](../advanced-sdd-flow/00-index.md) 按问题进入对应参考页。

## 完成后的心智模型

到这里可以把整个流程压缩成一句话：**先用规格说明变更应该成为什么，再用 GitHub Flow 让实现、文档、证据和决定记录一起经过检查、评审与合并。**
