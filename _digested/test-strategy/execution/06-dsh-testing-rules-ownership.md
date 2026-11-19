# 06-dsh-testing-rules-ownership.md: 规则所有权与证据归属

## 概念 (Concept)
在 DSH 中，每一条测试规则和证据类型都有清晰的所有权归属（Ownership）。所有权不仅指“谁写”，更指“谁负责维护其在 CI 中的表现”以及“当规则失效时谁进行修复”。其核心纪律是“**One Home Per Fact**”（每一条规矩只有一个家）。

![所有权归属图](./figures/rules-homes.svg)

## 背后思考 (Insight)
*   **责任明确化**：没有 owner 的测试，最终会走向假绿和无人维护的废墟。
*   **防假绿机制**：通过显式 ownership 和多重检查面（CI 自动检查 + Owner 人工 Review），封锁证据链上的假绿路径。
*   **One Home Per Fact**：规矩散在文档、注释和代码里会产生不同步。必须将规则、命令、理由归档在对应的 Home 目录。

## 工程实践推荐 (Practice)
*   **所有权标注**：在规矩的文档头部，明确标注 `// OWNER: <xxx>`。
*   **Evidence Chain**：Policy -> Command -> Rationale，确保变更时这三者同步更新。
*   **禁止作弊**：禁止为凑绿而修归一化器（Normalizer），证据必须忠实反映系统行为（包括 Bug）。

## 参考 (Reference)
*   [快照所有权协议](./../mechanisms/10-dsh-snapshot-machinery.md)
*   [CI 门禁与可靠性](./07-dsh-ci-gates-and-reliability.md)

# 规矩与所有权：谁拥有什么、怎么保证不红

> 本篇收集 DSH 测试体系里"操作级"的规矩：常备条令（root `AGENTS.md`）、快照树所有权（`snapshots/AGENTS.md`）、推送前检查选取（`dsh-pre-push-checks`）。思想级的教义见 [01](./01-dsh-testing-philosophy-and-doctrine.md)，分层见 [02](./02-dsh-testing-tiers-and-selection.md)。

## 现象是什么：规矩的三种载体

DSH 的测试规矩不在一份文件里，而是按"谁需要什么时候看到它"分三处：

1. **常备条令**（root `AGENTS.md`）：每个 session 都要在上下文里的条款，每条 1~3 行，链接到它的"家"。
2. **所有权契约**（`snapshots/AGENTS.md`）：快照树的归属规则，只对碰快照的人相关。
3. **流程技能**（`.agents/skills/dsh-pre-push-checks/`）：推送前"选哪些检查跑"的决策流程。

(以下为原文件详细硬事实与规矩清单...)
