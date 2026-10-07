# DSH 的一次变更，为什么要把意图、决定、实现和证据分开安放？

## 问题

DSH 这样的真实仓库里，一次变更为什么不能只靠一份 spec、一个 PR 或一组通过的测试来说明？新来的 coding agent 应该怎样找到任务意图、当前行为、持久决定理由、回归证据和交付状态各自的权威位置？

这个问题关注 DSH 已经存在的开发机制，不把它扩写成 DSH 官方宣布的方法论，也不借用 OpenSpec 或路线图。答案综合本目录内的五个问题页与 DSH 固定基线中的仓库规则，保留历史提交能够证明和不能证明的边界。

## 范围

本 FAQ 以提交 `5124a2a310`（PR #5004）中的模型选择器呈现修改为历史例子：候选行显示原始 model ID，悬停时显示模型名称。该例用于观察文件、证据和流程边界，不用于补造当时不可从 git tree 得到的 Issue、review、CI 或 merge 记录。

另一笔 pnpm 子进程锁修复（提交 `ccaa0dc11c`）只用于说明何时需要记录持久决定理由。它不表示每次变更都必须创建 Agent Note。

## 入口

按问题进入对应页面，不要求把它们当作固定的串行阶段：

| 问题 | 页面 |
|---|---|
| 一笔具体修改交付了什么，历史证据能证明什么？ | [`01-follow-a-change.md`](./01-follow-a-change.md) |
| 哪类事实应放在哪里，什么时候需要 Agent Note？ | [`02-specs-and-decisions.md`](./02-specs-and-decisions.md) |
| 本地证据与 push 后的 GitHub 协作状态由谁拥有？ | [`03-github-flow.md`](./03-github-flow.md) |
| 改动面与测试、真实入口、负例和 review 怎样共同构成证据？ | [`04-implementation-and-evidence.md`](./04-implementation-and-evidence.md) |
| 自动检查、语义评审和合并后的知识归位分别负责什么？ | [`05-review-and-merge.md`](./05-review-and-merge.md) |

需要精确条件、状态或例外时，进入 [`SDLC Reference`](../../_dsh_plugin_agent_ready_development/sdlc-reference/00-index.md)；想了解仓库怎样帮助 coding agent 探索和修改 DSH，进入 [`Development Harness`](../../_dsh_plugin_agent_ready_development/repo-harness/00-index.md)。这两个入口不依赖本 FAQ 的线性阅读。

## 证据边界

正文会区分三类事实：`已在提交观察`（git 历史可核对）、`现行规则要求`（固定基线中的规则文件）和 `需查 GitHub`（只有远端记录才能回答）。教学重建的任务描述会明确标出，不冒充原始 Issue；未执行的 e2e、doc-sync 或远端 CI 也不会写成已验证。

本 FAQ 的图示只辅助正文，不构成独立阅读路径；图示清单见 [`figures/README.md`](./figures/README.md)。
