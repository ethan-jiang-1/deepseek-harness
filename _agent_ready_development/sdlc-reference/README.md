# SDLC Reference 目录

本目录是 SDLC（软件研发生命周期）参考层：对变更主线经过的每个阶段——意图入口、决策记录、计划、实现证据、文档、评审、批准门禁、合并与发布——提供精确条件、内部状态、例外流程和证据入口。教程层（建立心智模型）由相邻的 [`sdlc-tutorial/`](../sdlc-tutorial/README.md) 负责；DSH 怎样帮助 coding agent 理解和修改自身，由 [Development Harness 专题](../repo-harness/README.md) 负责。

与 Tutorial 的分工：Tutorial 用一次普通变更按顺序讲完主线，只保留第一次阅读需要的内容；本目录保留实现细节，是为了回答“具体由哪个文件执行”“边界条件是什么”“失败后怎样处理”，按问题查找，不作为新读者的前置。

## 主入口

从 [`00-index.md`](./00-index.md) 按问题选择页面。该页拥有适用条件和完整参考目录；本 `README.md` 只说明本层职责。

## 直接内容

| 路径 | 职责 |
|---|---|
| [`01-agent-note-lifecycle.md`](./01-agent-note-lifecycle.md) 至 [`11-release.md`](./11-release.md) | Agent Note、Issue/PR、Plan、检查、文档、评审、合并、意图入口、批准门禁、发布上线与历史证据参考 |
| [`figures/`](./figures/README.md) | 只服务本目录正文的流程图示 |
