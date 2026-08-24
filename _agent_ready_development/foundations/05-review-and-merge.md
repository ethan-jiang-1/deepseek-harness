# 05 · Review 与 merge：从能运行到能交付

## 三种判断不能互相替代

一个 PR 能否交付，至少经过三种不同判断：

| 判断 | 主要回答 | 不能替代 |
|---|---|---|
| automated checks（自动检查） | 类型、格式、测试、构建和平台结果是否满足规则 | 意图和设计是否正确 |
| semantic review（语义评审） | 实现、文档和证据是否真的符合 Issue 与 Agent Note | 实际运行检查或用户授权 |
| explicit user approval（显式用户批准） | Plan 或受限操作是否得到授权 | 代码质量与 CI 结果 |

Semantic review 可以由具备上下文的人或 agent 执行。`.github` 中的 human-review policy（人类作者 PR 策略）描述哪些 PR metadata 进入强制范围，不规定 reviewer 必须是人。

## Review 应沿真实使用路径检查

Reviewer 不只读变更行，还要连接四类上下文：

1. Issue 或任务意图：外部结果是什么；
2. Agent Note：为什么选择当前方案；
3. 源码与当前文档：系统交付后怎样工作和失败；
4. Tests、snapshots 和 CI：哪些场景已经建立可重复证据。

高风险变更还要沿真实 consumer（消费方）和 entry path（入口路径）检查错误、取消、资源释放、并发、安全限制、模型可见内容与发布产物。完整语义维度见 [code review 高级参考](../advanced-sdd-flow/06-review-and-human-role.md)。

## Review 是一个反馈循环

Finding（评审发现）应指出 defect（缺陷）、location（位置）、impact（影响）和 evidence（证据）。作者逐条核验：成立就修改并补证据，不成立就用可验证事实解释。

新的 push 会更新 PR head。依赖旧 commit、旧 diff anchor（行内锚点）或旧 checks 的 review 状态可能失效，因此合并前要读取当前 head、当前 unresolved threads（未解决讨论）和当前 checks。

## 普通 PR 怎样结束

Required checks 通过、review requirements 满足、PR 不再是 Draft 且 GitHub 报告可合并时，普通 PR 才进入 merge。合并后目标分支成为当前交付状态。

Agent Note 不会因为 merge 自动 archive（归档）。只有 implemented Note 的未来决策价值已经很低时，才按归档规则冻结；仍能解释替代方案、安全规则或重新引入条件的 Note 继续保持 active（活动状态）。

## 什么时候进入高级流程

普通变更在这里结束。只有出现下面情况时，才需要进入高级参考：

- 多个 PR 存在同仓库依赖关系：阅读 [Stacked Pull Requests（依赖式 PR 栈）](../advanced-sdd-flow/07-push-merge-stacked-prs.md)；
- 需要改写已经发布的 branch history（分支历史）：阅读同一篇中的 force-with-lease（带租约强制推送）规则；
- 需要核对某个机制从 proposal 到 implemented 的历史证据：阅读 [Web capability seam 历史案例](../advanced-sdd-flow/08-example-web-seam.md)；
- 需要维护文档 owner、双语配对或站点投影：阅读 [文档高级参考](../advanced-sdd-flow/05-prose-doc-standards.md)。

## 完成后的心智模型

到这里可以把整个流程压缩成一句话：**先用规格说明变更应该成为什么，再用 GitHub Flow 让实现、文档、证据和决定记录一起经过检查、评审与合并。**
