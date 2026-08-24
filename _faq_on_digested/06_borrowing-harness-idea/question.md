# Question 06 · 另一个项目想借鉴 DSH 的 Harness 思路，尤其 coding agent 怎么探索、理解项目而不糊涂、不乱发挥，可迁移的东西是什么？

## 背景

我有一个**另一个项目**（不一定是插件架构，不一定是 agent harness，可能只是一个普通代码库）。我想借鉴 DSH 的 Harness 思路——尤其关心一件事：**怎么让一个 coding agent 第一次进入这个项目、探索和理解它之后，既不糊涂（抓不住主线、读错、脑补），也不乱发挥（改错地方、擅自绕过约束、做出无人想要的设计）**。

DSH 自己的仓库就是它最好的样板：它的开发主力自称是 coding agent，而一个 fresh agent 能相对可靠地在里面找到规则、定位改动、选对方法并拿到可信反馈。这套能力不是一个「聪明的 loop」单独给的，而是仓库层面一整套组织方式共同给的。

本问题要挖的不是「DSH 机制是什么」（`_digested/` 各专题已经做完），也不是「DSH 为什么对读者友好」的完整判断（`_digested/harness-idea/` 已经做完），而是一个更窄、更面向行动的产物：**把这两套材料里「可以搬到另一个项目」的东西挑出来，按可迁移性排序，并给出一条一步一步照做的落地路径。**

## 要回答的问题

1. 「糊涂」和「乱发挥」到底缺的是什么？能不能翻译成几个可操作的信息缺口？
2. DSH 靠哪些机制让 fresh agent **不糊涂**？这些机制里哪些不依赖「一切皆插件」、可以照搬到普通项目？
3. DSH 靠哪些机制让 agent **不乱发挥**？「正确路径」「可执行反馈」各自解决「乱发挥」的哪一半？
4. Skills、运行时查询、渐进披露分别扮演什么角色，各自的可迁移成本是多少？
5. 有没有一套**按优先级排序的迁移清单**，以及一个「先做什么、后做什么」的判断框架？
6. 落地到我的项目时，**一步一步具体怎么做**，每一步的产出和验收标准是什么？
7. 哪些是 DSH 独有的、照搬会反噬的边界？普通项目最容易犯的过度投入错误是什么？
8. 从根部出发的 `AGENTS.md` / `CLAUDE.md`（symlink）这条「留下合适个数的 AGENTS.md、串起各种 README.md」的入口链，具体是怎样构成渐进披露骨架的？
9. 渐进披露在 DSH 里除了「文档写短、按需读」，运行时还有哪些面？模型每轮实际看到什么由谁决定、超预算了怎么回收、子代理能看到什么？

## 证据边界

- 主证据是两份本地研究语料，都在同一基线（DSH `0.1.1-rc.1`，commit `528c682e061696f5a160f363f236ecbf53cbd006`）上：
  - `_agent_ready_development/development-harness/`（01–07）——教程式拆解「仓库怎样帮 coding agent 修改仓库自身」；
  - `_digested/harness-idea/`（01–08）——判断式拆解「dsh 为什么对参与者友好」。
- 源码事实需要锚定时，用 DSH 固定基线文件的相对路径或固定 commit 的 GitHub 链接，不重抄 `docs/` 正文充数。
- 与既有 FAQ 的分工：`04_root-entry-documentation` 只覆盖「根入口/文档组织」；本问题覆盖「知识归属 + 正确路径 + 可执行反馈 + Skills + 运行时查询 + AGENTS.md 入口链 + 渐进披露管线」整体，并明确跨到「迁移到另一个项目」。不重复 `_digested/harness-idea/` 里对机制判据的逐条论证，只引用其结论。

## 文件

- [`answer.md`](./answer.md)：一句话结论与总览
- [`01-two-failures-as-missing-info.md`](./01-two-failures-as-missing-info.md)：把「糊涂 / 乱发挥」拆成可操作的信息缺口
- [`02-legibility-ownership.md`](./02-legibility-ownership.md)：可读性 = 一个事实一个 owner；解决「糊涂」
- [`03-paved-road-and-ladder.md`](./03-paved-road-and-ladder.md)：正确路径 + 参与阶梯；解决「乱发挥」的改哪里
- [`04-executable-feedback.md`](./04-executable-feedback.md)：可执行反馈；解决「乱发挥」的做错被抓住
- [`05-skills-as-procedural-memory.md`](./05-skills-as-procedural-memory.md)：Skills 与渐进披露；省上下文、稳住判断
- [`06-runtime-inspection.md`](./06-runtime-inspection.md)：运行时查询；不靠猜源码
- [`07-transfer-playbook.md`](./07-transfer-playbook.md)：可迁移优先级、三问框架与边界成本
- [`08-step-by-step-guide.md`](./08-step-by-step-guide.md)：综合的、一步一步怎么做（重点）
- [`09-agents-entry-chain.md`](./09-agents-entry-chain.md)：AGENTS.md 层级骨架——CLAUDE.md symlink、合适个数的子树 AGENTS.md、串起 README 的渐进披露入口链
- [`10-progressive-disclosure-pipeline.md`](./10-progressive-disclosure-pipeline.md)：渐进披露的完整五层管线——静态组织 + 按需注入 + 运行时组装 + 溢出回收 + 隔离边界
- [`research.md`](./research.md)：证据原文与来源
