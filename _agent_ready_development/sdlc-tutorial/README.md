# SDLC Tutorial 目录

## 定位

教学层（tutorial）：用一次普通变更把 DSH 的 SDLC（Software Development Lifecycle，软件研发生命周期）主线——意图 → 决策 → 实现 → 评审 → 合并——按顺序讲完一遍，回答"一次变更从头到尾发生了什么"。只保留第一次阅读需要的内容。精确条件、状态与例外由 [SDLC Reference](../sdlc-reference/README.md) 拥有；"仓库为什么对 coding agent 友好"由 [Development Harness](../repo-harness/README.md) 拥有。

## 主入口

从 [`00-index.md`](./00-index.md) 开始，并按 `01` 至 `05` 顺序阅读。该页拥有教程目标、核心术语和完整阅读顺序；本 `README.md` 只说明本层职责。

## 直接内容

| 路径 | 职责 |
|---|---|
| [`01-follow-a-change.md`](./01-follow-a-change.md) 至 [`05-review-and-merge.md`](./05-review-and-merge.md) | 从变更意图递进到规格、GitHub Flow、实现证据、评审与合并 |
| [`figures/`](./figures/README.md) | 只服务本目录教程的图示 |

读完普通路径后，需要核对精确状态或例外流程时进入 [SDLC Reference](../sdlc-reference/README.md)；想理解仓库怎样帮助 coding agent 参与开发时进入 [Development Harness](../repo-harness/README.md)。
