# SDLC 变更闭环：一笔变更从意图走到归位

> **道 · 变更闭环。** 本页拥有「一笔变更从意图到归位」的完整逻辑：为什么需要闭环、DSH 怎么应对、怎么落地、普通项目怎么迁。可打开的一手证据只有 DSH 仓库本身（钉版 `46a7f68b09` 的 GitHub URL）；本页不复制 [FAQ 06](../06_change-landing-path/answer.md) 的落位面表——那篇讲 DSH 的流程本身，本页讲「普通项目怎么借」。

## 为什么要有这道

多数项目对「一笔变更」的默认想象是：**一段代码改动**——写代码 → 跑测试 → 让 CI 看看 → 合并。agent 深度参与开发后，这个想象很快失效，失效形态有三个，各有一个名字：

- **完成不可信。** agent 的自述没有约束力；绿灯只覆盖检查碰巧碰到的地方，它声称交付的行为可能没有任何证据。
- **意图蒸发。** 「为什么改、改成什么样算对」只活在当时的会话里；下一个来 review 的 agent 看不到，只能凭 diff 反猜意图，猜错就批准了错误的东西。
- **知识散落。** 「为什么这样做」留在 PR 讨论和聊天记录里；新会话的 agent 读不到上个会话，同类变更每次都从零开始，被否定过的方案被重新提出。

根子上的原因只有一个：**agent 没有组织记忆，自述也不该被信任。** 可靠的替代方案不是「找一个更聪明的 agent」，而是把一笔变更从「一段代码」升级成**完整的交付物**：意图、决定、实现、当前文档、回归证据同进一个 PR——每一项都有 owner、可核对、合并后可再次发现。这就是变更闭环这道：三个失效形态，一条闭环全治。

## DSH 怎么应对

DSH 把闭环定成一条流水线，每环有产物、有 owner、有失败信号：

**可观察结果 → 找 owner → 有条件的决定 → 实现 + 当前文档 + 回归证据（同一变更交付）→ 聚焦本地检查 → CI + 语义 review → merge → 知识归位。**

两个关键设计：

1. **条件化机制**——Issue、Agent Note、Plan Mode 都不是每笔变更的必经站，只在需要承载对应事实时出现。局部修补不带 Note 是合规，不是偷懒——这条豁免的 DSH 原话：

   > **DSH 原话 ·** 决策记录的豁免条款（[`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/README.md)）
   >
   > Mechanical or local edits, including local UI presentation and interaction changes, are exempt.

2. **证据与声称对齐**——测试必须能在旧行为上失败（红灯对照），没被钉住的行为如实标注为缺口；绿灯的数目不是目标，证据与声称的对齐才是。这条纪律的 DSH 原话：

   > **DSH 原话 ·** 本地检查按改动面选择、负例控制（根 [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/AGENTS.md)）
   >
   > Match evidence to the surface: focused behavior tests, model/user-output snapshots, `doc-sync` for docs, built smokes for published paths, and real-API e2e for providers. … A guard only guards if the regression fails it.

## DSH 怎么落地

DSH 用一笔 7 文件的真实提交（`5124a2a310`，PR #5004：模型选择器显示 model ID）完整演示过这条链，逐环对应的实物：

| 环节 | 这笔变更里的实物 |
|---|---|
| 意图进入 | 用户可观察结果：同名模型分不清 → 每行显示原始 ID、悬停看名称 |
| 找 owner | 根 `AGENTS.md` → `packages/README.md` 分组表 → 包 README，三跳定位到组件 |
| 有条件的决定 | 局部呈现修改，**豁免** Agent Note（判据：无持久取舍，见 [`决策记录`](./03-decision-notes.md)） |
| 实现 + 文档 + 证据 | 同一提交 7 文件 +15/−14：组件、样式、组件测试、e2e、双语 README、配对 hash |
| 回归证据 | 组件测试断言反转；实测旧行为上 **2 红 95 绿**（[复现方法见落地总纲 Phase 1 第二步](./06-step-by-step-guide.md)） |
| 缺口如实标注 | README 声称的等宽字体与悬停名称**没有**测试钉住，被教程如实标为证据缺口，留给 review 判断——绿灯不掩盖缺口 |
| 知识归位 | 行为归源码与测试、当前合同归 README——合并后新 agent 不读 PR 对话也能回答三问 |

逐环核对的上游一手证据是[提交 `5124a2a310` 本身](https://github.com/deepseek-ai/deepseek-harness/commit/5124a2a310a904d28118609c41d89f26440b946b)：`git show 5124a2a310` 可打开全部 7 个文件、断言反转与双语 README 改述——不需要任何第二手材料。

## 怎么迁移到你的项目

每一环的 DSH 承载者 → 普通项目最小承载者 → 验收标准：

| 环节 | DSH 的承载者 | 普通项目最小承载者 | 验收（做到什么样算数） |
|---|---|---|---|
| 意图进入 | Issue 模板（Bug 分节/Feature 分节）或任务上下文 | Issue 模板或 PR 描述的第一段：两行「外部结果 + 如何观察」 | 新任务进来，写得出「用户会看到什么、怎么验证」 |
| 找 owner | 根 AGENTS.md → 分组表 → 包 README 的归属链 | 一张「目标 → 位置」归属表 | 不靠作者本人带路，能从任务描述走到改动位置 |
| 有条件的决定 | Agent Note（持久取舍）/ Plan（单次实施），条件出现才用 | ADR（持久取舍）/ 草稿计划（单次实施），[何时值得写见决策记录](./03-decision-notes.md) | 局部修补不写 ADR；有真实备选被放弃的，说得清记在哪 |
| 实现交付 | 同一提交：代码 + 双语 README + 测试 | 同一 PR：代码 + README + 测试 | 文档和行为一起变；「先合并后补文档」被当成反模式 |
| 回归证据 | 断言反转的测试 + 真实入口 e2e | 会因旧行为变红的测试（红灯对照：回滚实现、保留测试、看它红） | 每个声称的行为都有对应断言；没证据的如实标注为缺口 |
| 本地检查 | 聚焦相关检查，不默认跑全套 | 只跑覆盖当前 diff 的测试/lint | push 前拿得到相关红灯，不是等 CI 全量 |
| CI + review | workflow 拥有调度，脚本拥有检查；语义 review 独立于 CI | CI 跑机械规则；reviewer（人或 agent）判断意图与证据对齐 | 「绿灯放行」被拒绝：CI 全绿 ≠ 声称的行为全有证据 |
| 知识归位 | 每类事实回 owner：源码/README 现状、Note 理由、测试证据 | 合并后新 agent 不读 PR 对话也能回答「现在是什么、为什么、什么固定它」 | 三问各有可打开的答案 |

**学走形的检查**：最常见的走形是闭环断在两处——「实现+文档+证据同一变更交付」（变成先合并后补文档）和「缺口如实标注」（变成绿灯崇拜）。拿一笔最近的变更自测：README 声称的行为里，有几条没有测试钉住？说不出就是缺口没被管理。

## 与其它各篇的关系

- 「找 owner」一环的完整形态（归属链、tier 表）展开在 [`归属`](./02-legibility-ownership.md)；「有条件的决定」一环展开在 [`决策记录`](./03-decision-notes.md)；「知识归位」的静/动版本（哪些层接住归位的知识）展开在 [`静与动`](./04-static-vs-dynamic.md)。
- 用本页打分自己项目的操作（垂直切片），见 [`落地总纲`](./06-step-by-step-guide.md) Phase 1 第二步。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「01 · 变更闭环」一节）——按需核对，不读不影响理解。
