# FAQ 02 · DSH 所谓 Spec-Driven Development 大概怎样运作？

## 问题

据说 DeepSeek Harness 的开发依赖 SDD（Spec-Driven Development），但仓库没有一份名为 `SDD.md` 的方法说明，也没有直接采用 Spec Kit、OpenSpec 或 Gherkin 之类的显式框架。那它所说或实际形成的 SDD 到底可能是什么：spec 写在哪里，谁审批，怎样约束 coding agent，怎样从提案进入实现，又怎样证明实现符合 spec？

这个问题不能只看某一份设计文档。需要把 GitHub Issue/PR 模板、Plan Mode、Agent Note 生命周期、代码与文档合同、测试层级、静态门禁和 git 历史连起来，才能重建实际工作流。

## 回答目标

读完本 FAQ，应当能够：

1. 区分仓库明确规定的流程、由多份证据支持的强推断，以及当前证据不能支持的说法。
2. 解释为什么 DSH 的 spec 不是一份大文档，而是分布在意图、设计、实现合同、行为证据和工程门禁中的多层记录。
3. 从一个 Feature 或架构改动出发，复述它可能经历的 Issue → Agent Note → Plan Review → 实现 → 验证 → Implemented Note 闭环。
4. 说明这套做法为什么特别适合以 coding agent 为主要开发者的代码库。
5. 判断它和严格的 spec-first、TDD、BDD 或某个标准 SDD 工具链有哪些差别。

## 范围

产品源码核验基线为 DeepSeek Harness `0.1.1-rc.1`，commit `528c682e061696f5a160f363f236ecbf53cbd006`。开发过程另查该 commit 之前的 git 历史；研究覆盖层只用于综合结论，不作为产品权威来源。

本 FAQ 回答“从当前仓库能合理重建出怎样的 SDD”，不声称 DeepSeek 官方给这套流程下过同样定义。仓库中没有检索到 `spec-driven development`、`specification-driven development` 或独立 `SDD` 方法声明。

## 阅读入口

- 主回答：[DSH 的 SDD：分层规格、生命周期与可执行验收](./answer.md)
- 一手证据与历史抽样：[研究底稿](./research.md)
