# 07 · 这些要求归哪一层

**想知道一条要求该信谁的时候读这一页。** 文件路径、行号和实测口径只在 [reference.md](./reference.md)。

## 三层，各有一个 owner

| 层 | 位置 | 拥有什么 | 谁执行 |
|---|---|---|---|
| 规则层 | [`.agents/notes/README.md`](../../.agents/notes/README.md) + 各子树 `AGENTS.md` | 何时写、路径语法、生命周期、正文骨架、Alternatives 强制、归档删除判据、移动改写 | `verify-agent-note-classification` + `verify-agent-note-format`（两者共用 `agent-note-tree` 的结构判定，均在 `doc-sync` 内） |
| 流程层 | `dsh-archive-agent-notes`、`dsh-find-simplifications`、`dsh-prose-standard`、`dsh-trim-cot-leakage` | 语义判断：结构合法之后，决定本身对不对 | 人 / agent 的语义 review |
| 消费层 | `dsh-doc`、`dsh-code-review`、`dsh-pre-push-checks`、`dsh-create-upgrade-guide`、`docs/AGENTS.md` | 其他文档怎么引用 Note、review 查什么、理由写不下时倒到哪里 | review 与文档门禁 |

**`.agents/skills/` 里没有一份「写 Agent Note」的 skill，这是分工不是遗漏**：可机械判定的部分已经变成 gate，不需要 skill；需要判断的部分才留在 skill 与 review 里。这正是 [`quality-gates` Note](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md) 记录的仓库立场。

![Agent Note 质量要求的三层分工](./figures/ownership-layers.svg)

## 每一层追加什么

**规则层**决定一篇 Note 在磁盘上合不合格：何时写、路径、骨架、`## Alternatives considered`、归档与删除的条件。

**流程层**在结构合法之后做语义判断。四份 skill 各追加一块，不重复门禁：

- `dsh-archive-agent-notes`：留下、归档还是删除。判据和操作步骤见 [05](./05-keep-archive-delete.md)。
- `dsh-find-simplifications`：删除类提案要有消费者证据、被移除的维护成本、放弃的能力、可观察的验收条件。同一决定更新既有 owner。
- `dsh-prose-standard`：留下理由、机制、备选、后果、已交付的验证和已命名的覆盖缺口；删掉规划清单。对照见 [02](./02-what-goes-in-the-file.md)。
- `dsh-trim-cot-leakage`：备选方案一节记下为什么输。不写 reviewer、轮次，也不写「这篇 Note 的第几版」。

**消费层**不定义 Note 怎么写。`dsh-doc` 审计时去读规则 owner，面向人的文档的作者顺序不套到 Note 上。`dsh-code-review` 核对 implemented Note 是不是已交付的事实。`dsh-create-upgrade-guide` 把指南里溢出的理由移进 Note。`dsh-pre-push-checks` 为 Note 改动选择要跑的检查。`docs/AGENTS.md` 的结构规则不适用于 Note，它的 tier 表把理由指派给 Note。

## 出处

每一层的文件与行号见 [reference.md](./reference.md)。

---

*基线：工作树 `caf78ed639`，2026-10-08 实测；上游改动规则文件后需重新核对行号。*
