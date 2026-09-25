# Reference · 证据入口总账

> **定位：证据账本。** 本目录各章声称的 DSH 事实，其上游一手出处集中登记在这里（钉版基线 `46a7f68b09`，`dsh-v0.1.7-rc.1`）。正文按渐进披露的原则不携带链接清单——想核对哪一章的事实，按章号来这里查；不核对就不必读。纯 FAQ 综合判断（施工顺序、优先级排序）在此如实标注「无独立上游证据」。整理过程的语料出处与复核历史在 [`research.md`](./research.md)（内部账本），与本页分工：research 记「这些结论怎么来的」，本页记「去哪里核对」。

## 01 · 变更闭环

- [提交 `5124a2a310`](https://github.com/deepseek-ai/deepseek-harness/commit/5124a2a310a904d28118609c41d89f26440b946b)：本页案例的上游一手证据（7 文件、+15/−14、断言反转）。
- [组件测试](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/client/ui-settings-models/tests/provider-form.client.spec.tsx)：案例的断言反转所在（第 612、753 行附近）。
- [PR 模板](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/pull_request_template.md)：意图/变化/证据三分节的现行模板。
- [根 `AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/AGENTS.md)：本地相关检查与 CI 分工的原始规则。
- [测试策略](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/testing.md)：negative control（负例控制）与真实入口的原始要求。

## 02 · 归属

- [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md)：文档 tier taxonomy 与 one home per fact。
- [`docs/glossary.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/glossary.md)：一词一义的术语纪律。
- [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/README.md)：决策记录的生命周期与负知识 home。

## 03 · 决策记录

- [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/README.md)：DSH 决策记录的原始规则（豁免条款、取代、归档）。
- [`.agents/skills/dsh-archive-agent-notes/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-archive-agent-notes/SKILL.md)：DSH 归档判断的校准工作流（按未来决策价值，不按字数年龄）。

## 04 · 静与动

- [根 `AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/AGENTS.md)：model-visible ⟺ logged 的原始规则。
- [`packages/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/AGENTS.md)：commit point 发布与单权威源派生。
- [session log 机制](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/session-format-status.md)：格式版本与已发布会话数据的迁移纪律。
- [system-prompt 子系统](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/system-prompt.md)：`PromptContext` 作为 cache-safe 的动态层——变化或被压缩时才重新记录快照。

## 05 · 正确路径

- [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/architecture.md)：Where new behavior goes 归属表与扩展点。
- [`docs/glossary.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/glossary.md)：capability seam 三角色的规范定义。
- [`docs/cookbook/extension-cookbook.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/cookbook/extension-cookbook.md)：feature 到机制与操作指南的细化入口。

## 06 · 落地总纲

无独立上游证据——Phase 划分与验收标准是本 FAQ 的施工综合，不是 DSH 的既有制度。各 Phase 引用的 DSH 机制，上游出处按站查：Phase 0.5 → [01 变更闭环](#01--变更闭环)；Phase 1/2 → [02 归属](#02--归属)；Phase 3 → [05 正确路径](#05--正确路径)；Phase 4 → [07 可执行反馈](#07--可执行反馈)；Phase 5 → [10 Skills](#10--skills)；Phase 6 → [11 运行时查询](#11--运行时查询)。

## 07 · 可执行反馈

- [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/testing.md)：test tiers、真实入口、negative control、snapshot 义务。
- [`.agents/skills/dsh-pre-push-checks/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-pre-push-checks/SKILL.md)：按 outgoing scope 选证据，而不是固定跑全套。
- [`scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/scripts/run-gates.ts)：仓库检查逻辑的聚合入口。

## 08 · 迁移清单

优先级排序、三问框架与四个边界是语料/FAQ 层的综合归纳，不是 DSH 的成文制度；四边界引用的 DSH 事实，上游一手出处：

- [`.agents/skills/dsh-code-review/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-code-review/SKILL.md)：Skill 是 guidance、不替代语义 review（边界 2 的原始表述）。
- [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/architecture.md)：注册即效果、随插件卸载 unwind（边界 3 的原始表述）。
- [`.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md)：运行时查询不是安全边界（边界 4 的原始表述）。
- [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md)：文档预算与 one home——「外置有维护成本」的 DSH 侧控制手段。

## 09 · 入口链

- [根 `AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/AGENTS.md)：standing orders + 布局 + 命令的入口本体；`CLAUDE.md` symlink 及「edit the real file」的规则原文。
- [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md)：tier taxonomy 表（根/子树 AGENTS.md 与包 README 的分工）与字数预算。
- [`packages/context/agent-instructions/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/context/agent-instructions/README.md)：会话态加载的机制——touch-driven、`maxBytes` 预算、per-directory 去重、digest 抑制。

（文件态设计的兄弟篇是 FAQ 04，会话态机制是 FAQ 05——家族互链，不是证据。）

## 10 · Skills

- [`.agents/skills/dsh-code-review/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-code-review/SKILL.md)：Skill 作为 guidance、语义 review 输入和 finding 输出的实例。
- [`.agents/skills/dsh-pre-push-checks/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-pre-push-checks/SKILL.md)：按 outgoing scope 选证据的实例。

## 11 · 运行时查询

- [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/architecture.md)：ordered config layers 与 `--dump-config`。
- [`docs/tool-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/tool-catalog.md)：从源码生成的工具 schema 与 opt-in 说明。
- [`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/capability-seams.md)：生成的 Service Definition / Provider / Consumer 关系索引。

## 12 · 披露管线

- [`docs/subsystems/system-prompt.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/system-prompt.md)：`PromptSection` / `PromptContext`（cache-safe，变化才 log）/ `ctx.systemPrompt.tools` / `suppressRuntimeContext`。
- [`docs/subsystems/skills.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/skills.md)：`SkillCatalogSnapshot` summary-only（name + description ≤500）、body on-demand。
- [`docs/subsystems/compaction.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/compaction.md)：pressure/overflow 触发、tool-result pruning、tool-call/result 配对、token meter。
- [`docs/subsystems/token-meter.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/token-meter.md)：`ctx.tokenMeter` 的估算与回放。
- [`packages/context/agent-instructions/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/context/agent-instructions/README.md)：touch-driven 加载、`maxBytes`/`maxSourceBytes`、per-directory dedup、digest 抑制。
- [`packages/context/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/context/README.md)：六个 context 插件的角色与 opt-in。
- [`docs/cookbook/extension-cookbook.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/cookbook/extension-cookbook.md)：`ctx.tools.restrict()` 的 ToolSearch / progressive disclosure 定位。
- [`packages/subagent/subagent-in-process-driver/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/subagent/subagent-in-process-driver/README.md)：spawn 不带父历史、fork 只带 balanced seed。

## 13 · 问题框架

- DSH [`quality-gates` Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-06-11-quality-gates.md)：仓库以 coding agent 为主、机械门禁优于 prose 约定的一手因果自述。
