# SDLC 变更闭环：一笔变更从意图走到归位

> **道 · 变更闭环。** 本页拥有「一笔变更从意图到归位」的每一环翻译——普通项目的最小承载者与每环验收；DSH 侧的精确制度（生命周期、policy、批准门禁）不归本页。DSH 侧的精确制度（生命周期状态、policy 条件、加权批准、发布 lane）由 [SDLC Reference](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-reference/00-index.md) 按问题拥有；完整的教程式走查（一笔真实变更从意图到合并）由 [SDLC Tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-tutorial/00-index.md) 拥有。本页不复制 [FAQ 06](../06_spec-change-path/answer.md) 的阶段表——那篇讲 DSH 的流程本身，本页讲「普通项目怎么借」。

## 一行生命周期

**可观察结果 → 找 owner → 有条件的决定 → 实现 + 当前文档 + 回归证据（同一变更交付）→ 聚焦本地检查 → CI + 语义 review → merge → 知识归位。**

每一环都有产物、owner 和失败信号。DSH 用一笔 7 文件的真实变更（模型选择器显示 model ID）完整演示过这条链——逐环打开文件、标注证据边界，见 [Tutorial 01 的证据地图](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-tutorial/01-follow-a-change.md)。

## 迁移表：DSH 承载者 → 普通项目最小承载者 → 验收

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

## 贯穿例子（一行版）

DSH 的演示例：一笔 UI 呈现修复——7 个文件（组件、样式、组件测试、e2e、双语 README、配对记录）同一个提交；测试断言反转保证旧行为会红；README 声称的两个行为（等宽字体、悬停名称）没有测试钉住，被教程如实标为证据缺口，留给 review 判断——**绿灯不掩盖缺口，这正是闭环的纪律所在。** 完整走查见 [Tutorial 04 的实测记录](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-tutorial/04-implementation-and-evidence.md)。

## 什么时候读本页

- 你想知道「借鉴 DSH」最终要落到什么形态：就是每一笔变更都走得通这条闭环；
- 你在做 [`落地总纲`](./06-step-by-step-guide.md) 的 Phase 0.5（垂直切片），需要一张对照表打分；
- 你怀疑自己的项目「文档、测试都有，但交付还是乱」——通常断点就在「实现+文档+证据同一变更交付」或「缺口如实标注」这两环。

## 证据入口

- [SDLC Tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-tutorial/00-index.md)：三条立场 + 一笔真实变更的完整走查（本页的事实来源）。
- [SDLC Reference](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-reference/00-index.md)：变更闭环各环节的精确条件与例外。
- [`06_spec-change-path/answer.md`](../06_spec-change-path/answer.md)：DSH 变更流程本身的阶段表（与本页的迁移视角互补）。
- [`落地总纲`](./06-step-by-step-guide.md) Phase 0.5：垂直切片操作——本页迁移表的实战用法。
