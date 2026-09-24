# 03 · GitHub Flow：变更怎样进入主分支

## GitHub Flow 解决什么问题

本地 git 能保存 commits，却不能独自回答谁评审了变更、远端检查是否通过、目标分支是否允许合并。GitHub Flow 把这些协作状态放进 Pull Request。

普通流程可以记成：

```text
branch → commits → push → Pull Request → CI + review → merge
```

## 1. Branch 隔离正在进行的工作

Branch（分支）让一个变更在不直接修改主分支的情况下演进。作者可以反复提交和本地验证；目标分支仍保持可交付状态。

分支不是规格的 owner。它只是承载这次变更的代码、文档、测试，以及持久决定理由变更的 Agent Note。

## 2. Push 把分支发布到远端

Push（推送）把本地 commits 发布到 GitHub。普通 push 前先运行覆盖当前 diff 的相关检查；push 后还要确认远端 branch ref（分支引用）确实指向预期 commit。

## 3. Pull Request 汇集协作状态

Pull Request（PR）不是“申请复制代码”的字面动作，而是一个变更的远端协作页。它同时展示 diff、Issue 关联、描述、checks、review threads（评审讨论）、approval（批准）和 mergeability（可合并状态）。

PR 可以是 Draft（草稿），表示作者仍在组织变更；Ready for review 表示它已经进入正式评审阶段。具体 metadata 规则由仓库 policy 决定，不应仅凭模板文字猜测。

## 4. CI 自动运行可重复检查

Continuous Integration（CI，持续集成）接收 PR 事件，在 GitHub runner（远端运行器）上执行仓库命令。它擅长回答类型、测试、覆盖率、构建、文档链接和平台结果是否满足机械规则。

CI 不能判断需求是否合理、错误信息是否清楚、抽象是否多余。那些问题属于 semantic review（语义评审）。

## 5. Review 让人或 agent 检查含义

Reviewer 阅读任务意图、适用时的 Agent Note、diff、当前文档和测试证据，判断它们是否一致。Review 提出问题后，作者继续修改同一分支并 push；PR 自动显示新 diff，CI 也会针对新 head 重新运行。

## 6. Merge 让目标分支接收变更

当 required checks 和 review requirements 满足时，PR 才能 merge（合并）。Merge 后目标分支包含完整交付组合，而不是只有实现代码。

## `.github/` 为什么属于开发流程

`.github/` 是 repository automation（仓库自动化）的代码和配置位置，不只是模板目录：

| 部分 | 在普通流程中做什么 |
|---|---|
| Issue / PR templates | 提示作者提供意图、关联、摘要和验证 |
| policy code + workflow | 校验适用 PR 的 Issue 引用、labels（标签）和其它 metadata |
| lifecycle workflow | 把 Issue、PR 和 review 事件投影到 GitHub Project 状态 |
| CI workflow | 决定何时、在哪个平台调用仓库检查，并聚合远端结果 |
| Dependabot config | 创建自动依赖 PR；仍进入普通 PR CI |

仓库脚本拥有“检查什么”，GitHub workflow 拥有“何时运行、在哪里运行、怎样汇总”。这就是为什么理解 DSH 的 GitHub Flow 时必须阅读 `.github/`。

Trusted policy（可信策略）、Project 状态转换和 CI job 拆分见 [`.github/` 高级参考](../advanced-sdd-flow/02-issue-pr-lifecycle.md)。普通开发先掌握本页主线即可。

下一篇解释实现和验证：[实现与证据](./04-implementation-and-evidence.md)。
