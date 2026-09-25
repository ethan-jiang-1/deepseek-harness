# SDLC Tutorial 目录

## 定位

教学层（tutorial）。**这里讲的是“DSH 眼里的 SDLC”，不是通用教材**——市面上的 SDLC 教材讲阶段论，这里讲的是一个真实仓库怎样安排一次变更的一生，而 DSH 对它有三个不同于常规仓库的立场：

1. **agent 是一等参与者。** 写代码、查证据、做评审的可能是人，也可能是没来过的 coding agent——每块知识都要有可发现的入口，不靠口口相传；
2. **规则是可执行的代码。** “文档双语相等”“PR 引用 Issue”“评审要求是什么”全部接成跑得起来的检查（gates、policy 脚本、CI workflow），不是贡献指南里的一句话；
3. **每类事实有唯一的 owner。** 意图归 Issue/任务上下文、决定理由归 Agent Note、当前行为归源码与 README、回归证据归测试、交付状态归 GitHub——一处一个权威，不重复、不漂移。

教程用一笔**真实小变更**——模型选择器显示 model ID（提交 `5124a2a310`，PR #5004）——沿变更主线（意图 → 找 owner → 条件化决定 → 实现/证据 → 本地检查 → PR/CI/review → 合并后归位）把这三个立场走成可核对的动作，每步打开实际文件并标注证据边界。只保留第一次阅读需要的内容。精确条件、状态与例外由 [SDLC Reference](../sdlc-reference/README.md) 拥有；“仓库为什么对 coding agent 友好”由 [Development Harness](../repo-harness/README.md) 拥有。

## 主入口

从 [`00-index.md`](./00-index.md) 开始，并按 `01` 至 `05` 顺序阅读。该页拥有教程立场、贯穿案例和完整阅读顺序；本 `README.md` 只说明本层职责。

## 直接内容

| 路径 | 职责 |
|---|---|
| [`01-follow-a-change.md`](./01-follow-a-change.md) 至 [`05-review-and-merge.md`](./05-review-and-merge.md) | 从变更意图递进到规格、GitHub Flow、实现证据、评审与合并 |
| [`figures/`](./figures/README.md) | 只服务本目录教程的图示 |

读完普通路径后，需要核对精确状态或例外流程时进入 [SDLC Reference](../sdlc-reference/README.md)；想理解仓库怎样帮助 coding agent 参与开发时进入 [Development Harness](../repo-harness/README.md)。
