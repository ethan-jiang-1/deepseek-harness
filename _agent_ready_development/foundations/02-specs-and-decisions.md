# 02 · 规格不是一份文件

## 从一个问题开始

“规格在哪里？”在 DSH 中没有单一文件答案。更准确的问题是：“我现在想确认哪一种事实？”

一个 Issue 可以说明用户想得到什么，却不适合保存长期架构理由；一个 Agent Note 可以解释决定，却不应复制当前 API；测试可以证明一个场景，却不能解释为什么选择这个设计。把所有内容塞进同一份 spec，会让每类事实失去合适的更新时机。

## 六种问题，六个位置

| 你要确认什么 | 主要位置 | 简单理解 |
|---|---|---|
| 为什么做、怎样算完成 | Issue 或任务上下文 | 意图与验收 |
| 为什么这样决定 | Agent Note | 理由、替代方案与后果 |
| 这一次准备怎样实现 | Plan Mode 会话；可选 | 一次性的实施计划 |
| 交付后的系统是什么 | 源码、types、README、JSDoc、`docs/` | 当前行为和接口 |
| 什么能抓住回归 | tests、snapshots、invariants | 可重复运行的行为证据 |
| PR 现在能否推进 | GitHub checks、review 和 merge state | 远端交付状态 |

这就是 distributed specification（分布式规格）：每类事实有自己的 owner（主要维护位置），它们通过同一个变更保持一致。

## Agent Note 只拥有决定

Agent Note 是仓库定义的 design decision record（设计决定记录）。每个非平凡变更都必须新增或更新 owning Agent Note，因为源码通常不能完整表达两类事实：为什么选择当前方案，以及主动放弃了什么。

Agent Note 有两个常见起点：

- 决定仍需在实现前评审：创建 proposed Agent Note；
- 决定已经明确并随当前变更交付：直接创建或更新 implemented Agent Note。

因此，“必须有 Agent Note”不等于“必须先写 proposed Note”。生命周期、取代和冻结归档规则属于高级机制，见 [Agent Note lifecycle（生命周期）](../advanced-sdd-flow/01-agent-note-lifecycle.md)。

## Plan 与 Agent Note 面向不同时间

Plan（计划）回答“这一次准备怎样做”，可以写具体文件、步骤、验证和未确定假设。它服务当前会话和即将开始的实现。

Agent Note 回答“仓库为什么长期采用这个决定”，保留问题、决定、替代方案和后果。它服务未来维护者。

一个 Plan 可以在实施中变化；implemented Agent Note 只描述实际交付的决定。两者可能来自同一次设计讨论，但不能互相替代。

## 用 CLI 例子对照

| 内容 | 应放在哪里 |
|---|---|
| “错误提示必须指出配置字段” | Issue 或任务验收 |
| “在配置解析层统一产生结构化错误” | Agent Note 的决定 |
| “先改 parser，再改 renderer，最后补 CLI snapshot” | Plan；需要时使用 |
| 具体 error type 和输出规则 | 源码、JSDoc、README 或相关 docs |
| 输入错误配置后得到明确提示 | test 或 snapshot |
| CI 是否通过、review 是否完成 | Pull Request |

同一个句子如果同时出现在六个位置，未来很快会漂移；如果六类事实只剩一类，读者又无法判断变更是否完整。SDD 的重点不是文档越多越好，而是**每个重要问题都能找到权威答案**。

下一篇进入协作部分：[`03-github-flow.md`](./03-github-flow.md)。
