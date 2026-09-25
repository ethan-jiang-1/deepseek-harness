# SDLC Reference 目录

## 定位

参考层（reference）。**这里查的是“DSH 眼里的 SDLC”的精确条款**——不是通用 SDLC 知识手册，而是一个真实仓库对变更主线的三个立场落到条文的形态：

1. **agent 是一等参与者。** 每条规则的读者假设包含没来过的 coding agent：状态、条件、例外都写成可独立查证的条文，不依赖口头传统；
2. **规则是可执行的代码。** 本目录引用的多数规则（门禁、policy、CI、配对检查）在仓库里有对应的可执行实现，页内给出实现文件与钉版链接；
3. **每类事实有唯一的 owner。** Agent Note、Issue/PR、Plan、文档、测试、GitHub 状态各自拥有哪些事实、互不越界，是各参考页的核心组织方式。

对变更主线经过的每个阶段——意图入口、决策记录、计划、实现证据、文档、评审、批准门禁、合并与发布——提供精确条件、内部状态、例外流程和证据入口，按问题查找，不要求通读。教程层由 [`sdlc-tutorial/`](../sdlc-tutorial/README.md) 负责（Tutorial 用一笔真实变更走通主线、建立心智模型，本目录精确到可核对）；“仓库怎样帮 coding agent 修改自身”由 [Development Harness 专题](../repo-harness/README.md) 负责。

## 主入口

从 [`00-index.md`](./00-index.md) 按问题选择页面。该页拥有适用条件和完整参考目录；本 `README.md` 只说明本层职责。

## 直接内容

| 路径 | 职责 |
|---|---|
| [`01-agent-note-lifecycle.md`](./01-agent-note-lifecycle.md) 至 [`11-release.md`](./11-release.md) | Agent Note、Issue/PR、Plan、检查、文档、评审、合并、意图入口、批准门禁、发布上线与历史证据参考 |
| [`figures/`](./figures/README.md) | 只服务本目录正文的流程图示 |
