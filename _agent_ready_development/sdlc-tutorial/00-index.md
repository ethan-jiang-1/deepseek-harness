# DSH 眼里的 SDLC：跟着一笔真实变更走完全程

## 这是“DSH 眼里的 SDLC”，不是通用教材

市面上的 SDLC（Software Development Lifecycle，软件研发生命周期）教材讲的是通用阶段论：需求 → 设计 → 实现 → 测试 → 发布。本专题不是那份东西的复述——它讲的是 **DSH 这个真实仓库怎样理解和安排一次变更的一生**，而 DSH 对 SDLC 有三个不同于常规仓库的立场：

1. **agent 是一等参与者。** 写代码、查证据、做评审的可能是人，也可能是没参与过这个仓库的 coding agent——所以每块知识都要有可发现的入口（`AGENTS.md`、包 README、决策记录），而不是靠“入职口口相传”。
2. **规则是可执行的代码。** “文档要双语相等”“PR 要引用 Issue”“评审要求是什么”，全部接成仓库里跑得起来的检查（gates、policy 脚本、CI workflow），不是写在贡献指南里的一句话。
3. **每类事实有唯一的 owner。** 意图归 Issue 或任务上下文、决定理由归 Agent Note、当前行为归源码与 README、回归证据归测试、交付状态归 GitHub——一处一个权威，不重复、不漂移。

带着这三个立场读后面五篇，你会发现每一步的设计都从它们推出来。

## 这组文档写给谁

写给已经知道 git 可以提交代码、但不熟悉 DSH 开发方式的读者——包括没有参与过这个仓库的 coding agent。读完五篇后，你应该能以一笔真实的小变更走通：**任务意图 → 找 owner（改哪里、谁拥有这块行为） → 条件化决定 → 实现/文档/证据 → 本地检查 → PR/CI/review → merge 后知识归位**，并对每一步说出可打开的文件和证据边界。

贯穿本教程的 DSH（DeepSeek Harness）是一个仍在活跃维护的开源 agent harness 仓库：TypeScript 单仓库（monorepo），由插件组成，管理 agent 会话、工具执行、沙箱、终端与 Web/Desktop 图形界面。你不必先了解它的产品功能——涉及的机制都会在出现时解释，并附上可核对的链接。

DSH 没有正式声明采用一套名为 Spec-driven Development（SDD，规格驱动开发）的方法。本专题借用这个视角解释仓库已经存在的规则：**先把意图、决定和验收说清楚，再让实现、文档、测试与这些规格一起演进**；GitHub Flow（GitHub 协作流）回答的则是另一个问题——一个变更怎样从个人分支出发，经过 Pull Request（变更评审请求）、CI（持续集成：在远端自动运行仓库定义的检查）和 review（评审），安全进入主分支。

## 贯穿案例

全教程跟着**一笔真实交付**走：模型设置列表的呈现修复——选择器每行显示原始 model ID（等宽字体），悬停显示模型名称。提交 `5124a2a310`（PR #5004），7 个文件、+15/−14：组件与样式、组件测试、Web e2e（端到端测试）、双语 README 及配对记录（[01](./01-follow-a-change.md) 有逐文件链接）。

这笔修改没有新增 Agent Note（DSH 放在 `.agents/notes/` 的决策记录文档；此处因局部呈现豁免），正好演示**不需要 Note 的完整小交付**；[02](./02-specs-and-decisions.md) 用另一笔真实修改——包管理器 pnpm 的子进程长期占用 profile lock（配置目录的写锁）——对照**为什么需要 Note**。一正一反，比抽象地说“Note 有时可选”更能阻止机械建档。

教程不伪装历史：任务描述从已交付行为重建（教学重建）；PR #5004 当时的 Issue、CI、review 与 merge 状态不在 git tree 里，涉及处标注 `需查 GitHub`，不补造。

![一次普通变更怎样从意图走到合并](./figures/first-change.svg)

## 用五步理解普通变更

1. **说明意图。** 在 Issue 或任务上下文中写清外部结果和验收条件。
2. **记录决定。** 持久决定理由变更新增或更新 Agent Note（机械/局部编辑豁免）；需要先评审实施计划时可以使用 Plan Mode（计划模式）。两者都是条件入口，不是必经站。
3. **完成变更。** 在分支上同时更新代码、当前文档和能抓住回归的测试或其它 evidence（验证证据）。
4. **发起协作。** Push 分支并创建 PR；GitHub workflow 运行 CI，reviewer 检查自动化无法判断的语义。
5. **合并交付。** Required checks 和 review 状态满足后 merge；主分支成为新的当前状态。

## 阅读顺序

按顺序读下面五篇，每篇只增加一层概念，每篇都围绕贯穿案例做一次练习：

| 章节 | 读完能回答 |
|---|---|
| [`01-follow-a-change.md`](./01-follow-a-change.md) | 一笔具体变更交付了什么、每步证据在哪里 |
| [`02-specs-and-decisions.md`](./02-specs-and-decisions.md) | 六类事实各归哪里；什么时候需要 Agent Note |
| [`03-github-flow.md`](./03-github-flow.md) | 本地与 push 后分别谁拥有证据；模板、CI、policy 怎样长成代码 |
| [`04-implementation-and-evidence.md`](./04-implementation-and-evidence.md) | 变更面怎样对应证据；红灯对照怎样做 |
| [`05-review-and-merge.md`](./05-review-and-merge.md) | 自动检查、语义评审、用户决定各管什么；合并后知识在哪 |

## 三层阅读分工

- **本教程**：跟着一笔真实变更走通过程，练习判断；
- [Development Harness 专题](../repo-harness/00-index.md)：仓库**怎样帮助 agent 参与**——AGENTS.md、Notes、Skills、gates 怎样共同工作；
- [SDLC Reference](../sdlc-reference/00-index.md)：查**精确条件**、状态与例外流程。

首次阅读在 `05` 结束；概念首次出现时正文会给出英文与中文解释，后文保留可搜索的英文名称。需要查 policy 时按问题进 Reference，不在本页预先堆述语表。

## 怎样阅读 DSH 引用

正文先给出完整解释，再把 DSH 链接（钉版在固定基线 `46a7f68b09` 的绝对 URL）作为一手证据；关键规则摘录为 blockquote 并标明出处。证据分三层标注：`已在提交观察`（git tree 可核对）、`现行规则要求`（DSH 今天的规则文件）、`需查 GitHub`（只有远端记录能回答）。

## 一句话记忆

**规格管“变更应该成为什么”，GitHub Flow 管“变更怎样安全到达主分支”；每类事实住进自己的 owner，合并后仍可再次发现。**

返回 [语料总入口](../README.md)，或继续 [Development Harness](../repo-harness/00-index.md)。
