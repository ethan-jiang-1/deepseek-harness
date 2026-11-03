# 10 · 常规流程的名字与边界

本卷反复提到几件"平时就该这么做"的事。它们各有机制主人，本篇只固定**名字、边界与判据**，机制细节一律指回原专题——同一个事实不在这里再讲一遍。

## 一次变更怎么落地

| 名字 | repo 原文 | 边界（机制归谁） |
|---|---|---|
| 同一变更交付代码与文档 | 「Docs accompany every code change」；改动影响 README／JSDoc 时同批更新（[AGENTS](../../AGENTS.md)） | 文档层级怎么分归 [`docs/AGENTS.md`](../../docs/AGENTS.md)；具体写法归 [`04`](./04-writing.md) |
| 同批写升级指南 | 外部可感知的破坏性改动「record … immediately in an upgrade guide」（[AGENTS](../../AGENTS.md)） | 指南模板归 `.agents/skills/dsh-create-upgrade-guide/` |
| 决策留痕 | 只有「难回退 + 离开上下文会让人意外 + 真的有权衡」才写 Agent Note | Note 的格式与生命周期归 [`../../.agents/notes/README.md`](../../.agents/notes/README.md) |

判据一句话：**这次改动会不会让某个读者下次读到时问「为什么」？** 会 → 留痕；不会 → 只改代码与文档。

## 检查怎么选

| 名字 | repo 原文 | 判据 |
|---|---|---|
| 最窄证据 | 「narrowest available test or purpose-built check that would fail for its regression」（[pre-push-checks](../../.agents/skills/dsh-pre-push-checks/SKILL.md)） | 能用一行测试证明的，就不跑全量 |
| 改动的验收路径要拒绝无效用例 | 「prove each changed acceptance path rejects an invalid case」（[AGENTS](../../AGENTS.md)） | 新检查上线前先证明它会红（`negative control`） |
| 可机械失败 | 检查以非零退出码失败，由 `scripts/run-gates.ts` 按 mode 聚合 | 点不出脚本名的，不是 gate，是约定 |

边界：全量矩阵与平台覆盖归 CI，本地不重复；「跑一遍全部」只在明确要求、诊断 CI 失败或改动确实横跨全仓时才做。

## DSH 的生命周期纪律

| 名字 | repo 原文 | 一句话 |
|---|---|---|
| schema 版本单调 | SQLite 用单调 `SCHEMA_VERSION`；会话格式只在既有判别式无法避免误读时才 `bump` | 版本号是兼容承诺，不是发布号 |
| 已提交的世代不改 | 相邻迁移可以加版本命名的后继，但不移动、不覆盖、不删除已提交的世代 | 历史是只追加的 |
| 模型可见 ⟺ 已记录 | 任何进入模型请求的输入都必须能从会话日志重建 | 新输入 → 新事件 |

边界：会话格式的完整规则归 [`../session-and-loop/`](../session-and-loop/00-map.md)，不在这里展开。

## 什么时候该回头改本卷

出现下面任一条，说明流程的名字或边界写错了，而不是执行得不够勤快：

1. 同一件事在两个专题里各有一套步骤。
2. 某个步骤每轮同步都要重做一遍。
3. 有人问「这一步的机制归谁」，本卷答不出来。
