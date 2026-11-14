# Reference 22 · 权威文件入口与历史转向核验命令

本页汇总本专题引用的 DSH 仓库源码、文档规范、门禁脚本路径，以及真实架构转向案例的本地 Git 复核命令。核验状态见 [核验基线登记](../00-baseline.md)。

---

## 一、第一层：运行时会话、压缩与工作状态入口

- **会话日志与 `surface` 纯函数投影**
  - 核心不变量（`model-visible ⟺ logged`）：[`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)、[`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md)
  - 只追加日志、`surface` 替换遮蔽与面向人的 transcript 分离：[`docs/subsystems/session.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md)、[`packages/core/session/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/session/README.md)
  - 状态事件完整后态要求与动态环境快照：[`packages/session/session-projection/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/session-projection/README.md)、[`packages/context/harness-dev-context/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/harness-dev-context/README.md)
- **上下文压缩（`compaction`）与输出裁剪**
  - 压缩锁事务、`shadowedSeqs` / `shadowedTokenCount` 记账：[`docs/subsystems/compaction.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md)、[`packages/compaction/compaction/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/compaction/README.md)
  - 触发阈值、节点 0 保护与“丢弃过期事实（`drop stale ones`）”摘要提示词：[`packages/compaction/compaction-basic/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/compaction-basic/README.md)
  - 超长工具结果裁剪与图片卸载边界：[`packages/compaction/compaction-tool-result-pruner/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/compaction-tool-result-pruner/README.md)、[`packages/compaction/compaction-image-offload/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/compaction-image-offload/README.md)
- **外置工作状态、再锚定与上下文隔离**
  - Goal 持久化、`rearm` 续跑安全阀与无独立评估器声明：[`packages/goal/goal/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal/README.md)、[`packages/goal/tool-goal/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/tool-goal/README.md)
  - 续轮“以现场为准、不信旧叙述”与收尾轮防编造提示词：[`packages/goal/goal-round-driver/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal-round-driver/README.md)、[`packages/goal/goal-round-driver/src/prompt.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal-round-driver/src/prompt.ts)、[`packages/goal/tool-goal/src/wrapup.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/tool-goal/src/wrapup.ts)
  - Plan Mode 状态折叠与 Todo 仅服务 UI（`never derived history`）：[`packages/plan/plan-mode/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/plan/plan-mode/README.md)、[`packages/plan/plan-mode/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/plan/plan-mode/src/index.ts)、[`packages/todo/tool-todo/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/todo/tool-todo/README.md)、[`packages/todo/tool-todo/src/types.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/todo/tool-todo/src/types.ts)
  - 工作区指令遮蔽后自动重注与技能两层按需加载：[`packages/context/agent-instructions/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/agent-instructions/README.md)、[`packages/skill/tool-skill/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/tool-skill/README.md)、[`packages/skill/tool-skill/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/tool-skill/src/index.ts)
  - 子智能体 `spawn` / `fork` 隔离、被遮蔽事件检索与重复调用提醒：[`packages/subagent/subagent-spawn-in-process/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-spawn-in-process/README.md)、[`packages/subagent/subagent-fork-in-process/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-fork-in-process/README.md)、[`packages/session-query/session-query-sqlite/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session-query/session-query-sqlite/README.md)、[`packages/experimental/session-search/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/session-search/README.md)、[`packages/experimental/tool-session-query/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/tool-session-query/README.md)、[`packages/guard/repeat-tool-reminder/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/guard/repeat-tool-reminder/README.md)

---

## 二、第二层：仓库文档层级与 Agent Note 生命周期入口

- **现状文档原则与腐烂清单（Slop Checklist）**
  - 一个事实一个家、`Document current state`、词数预算与禁止手抄目录：[`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md)、[`docs/postmortem/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/README.md)
- **Agent Note 规则、取代检查与冻结归档**
  - 写入门槛、决定不可原地改写、合并删除与归档判据：[`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md)
  - 新 Note 强制取代检查：[`.agents/notes/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/AGENTS.md)
  - 已交付 Note 事实原地更新 vs 决定反转新开篇：[`.agents/notes/implemented/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/AGENTS.md)
  - 冻结归档设计理由、封存规则与默认搜索屏蔽：[`.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md)、[`.agents/notes/archived/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/AGENTS.md)、[`.agents/skills/dsh-archive-agent-notes/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-archive-agent-notes/SKILL.md)、[`.rgignore`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.rgignore)
  - 活跃语料规模压力量化提案与语义边界归属说明：[`.agents/notes/proposed/process/2026-08-20-audience-first-documentation-quality.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/proposed/process/2026-08-20-audience-first-documentation-quality.md)、[`.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md)

---

## 三、第三层：生成器、门禁脚本与诚实边界出处

- **生成目录与 `doc-sync` 门禁实现**
  - 9 对 `gen-*` / `verify-*` 脚本入口与 `doc-sync` 叶子门禁表：[`package.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/package.json)、[`scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts)、[`scripts/gen-config-catalog.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/gen-config-catalog.ts)、[`docs/tool-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-catalog.md)
  - 常驻文档词数上限清单：[`scripts/doc-budgets.manifest.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/doc-budgets.manifest.json)
  - Note 分类、现在时标题检查与归档哈希校验：[`scripts/agent-note-tree.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/agent-note-tree.ts)、[`scripts/verify-agent-note-format.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-agent-note-format.ts)、[`scripts/archived-agent-notes.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/archived-agent-notes.ts)
- **可重算证据、快照世代、持久化确认与门禁自述边界**
  - 证据优于手工同步原则与快照世代规则：[`docs/defensive-patterns/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/defensive-patterns/README.md)、[`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)、[`snapshots/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md)
  - 持久化变更确认与双语门禁的自述能力上限：[`docs/persistence-changes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/persistence-changes/README.md)、[`docs/session-format-status.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/session-format-status.md)、[`docs/i18n/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/i18n/README.md)、[`scripts/verify-upgrade-guides.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-upgrade-guides.ts)

---

## 四、真实架构转向案例核验路径与 Git 命令

- **工作树直接可读的转向记录**
  - 部分取代并保留其余决定：[`.agents/notes/implemented/process/2026-10-14-experimental-dependency-policy.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/process/2026-10-14-experimental-dependency-policy.md)
  - 启动机制切换互链与幸存条款点名：[`.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md)、[`.agents/notes/archived/architecture/2026-07-28-dsh-native-typescript-source-launch.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/architecture/2026-07-28-dsh-native-typescript-source-launch.md)
  - 完全取代合并删除旧篇并继承顺序保证：[`.agents/notes/implemented/architecture/2026-08-27-adjacent-agent-steer-messaging.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-08-27-adjacent-agent-steer-messaging.md)
  - 砍掉整条产品支线、删提案并写明重议条件：[`.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md)

```sh
# 1. 移除第一方 SQLite 持久化后端：旧 Note 归档、新篇接管并写明代价与重开条件
git show --stat 4553c9d957
git show 4553c9d957 -- .agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md

# 2. 提案挂起 11 周后否决（进 rejected/），并一次性归档 453 组已完成三件套
git log -1 a7a5be1703
git show a7a5be1703 -- .agents/notes/rejected/architecture/2026-06-16-typed-event-schemas.md

# 3. 性能改动次日整单回滚（删除随附 Note）及误删封存 Note 按原 sha256 哈希恢复
git log -1 81e05abaab
git log -1 e0427f38e9

# 4. 未正式发布的能力撤回：代码、Note 三件套与封存清单条目同提交一并移除
git show --stat 26706559b2
```
