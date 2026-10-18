# 03 · Note 流程：它把「方向变了」当成一等公民

这是提问里点名要查的那一问：**DSH 的 Note 流程是不是已经考虑过「项目左晃右晃、spec 越堆越多」？**

结论：**考虑了，而且不是靠写作自觉，是靠三条可执行的纪律**——决定不可原地改写、新 Note 必须做取代检查、被取代的记录有明确的去向。下面全部是仓库原文。

## 一、三条硬规则

### 规则 1：决定不能被改写，只能被取代

> An Agent Note is never edited into a *different decision*: supersede it with a new one, and keep both notes cross-linked unless the old note is later fully consolidated under the rule below.

出处：`.agents/notes/README.md:48`（`[原文]`）。

配套的是「事实可以原地更新」：

> Keep paths, symbols, defaults, and mechanisms current in the same change that alters them. Rewrite stale facts in place; do not append change history.

出处：`.agents/notes/implemented/AGENTS.md:7`（`[原文]`）。同一文件紧接着划清边界：

> Update factual realization in place. A reversal of the decision or its rationale requires a new Agent Note and cross-link; a fully superseded old note may be deleted only through the consolidation rule in the Agent Note rules (`README.md`，即 `.agents/notes/README.md`).

出处：`.agents/notes/implemented/AGENTS.md:13`（`[原文]`）。

**事实与决定分开处理**，是这套流程对「改方向」最核心的回答：改了路径/默认值就改原文，改了主意就必须新开一篇并交叉链接。

### 规则 2：每写一篇新 Note，强制做一次取代检查

> **Every new Agent Note triggers a supersession check.** Search the active tree for older notes covering the same decision or mechanism, classify any full or partial supersession with `dsh-archive-agent-notes` (`.agents/skills/dsh-archive-agent-notes/SKILL.md`), and archive every qualifying implemented triplet in the same PR. Keep partial supersessions active and cross-linked.

出处：`.agents/notes/AGENTS.md:5`（`[原文]`）。

这条规则直接消灭了「左晃右晃留下一堆互相矛盾的现行文档」这个形态：**新决定落地的同一个 PR 里，被它取代的旧记录必须被分诊**——全取代的归档，部分取代的保持现行并交叉链接。

为什么放在写作时刻而不是事后审计，仓库给了理由：

> **Defer supersession cleanup to periodic corpus audits.** Rejected because the author of a replacement note has the freshest evidence about ownership and overlap. Postponement leaves redundant active authorities and makes later classification more expensive.

出处：`.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:35`（`[原文]`，`[源码]` 中「Rejected」一词说明这是被否决过的替代方案）。

### 规则 3：记录的去向由「还有没有用」决定，不由年龄或体量决定

| 状态 | 判据（原文要点） | 出处 |
|---|---|---|
| 保持现行 | 备选方案、所有权边界、负面保证、durable/wire 语义、安全规则或**重新引入条件**仍然有用 | `.agents/notes/README.md:38` |
| 直接删除 | 仅限小 UI 调整或纯机械改动；本地 bug 修复、性能改动、新能力、实质性行为决定**不因实现小而合格** | `.agents/notes/README.md:38` |
| 归档（冻结） | 决定已完成 **且** 理由不太可能指导未来工作 **且** 仍有历史决策价值 | `.agents/notes/README.md:38`、`:40` |
| 合并后删除 | 仅限**完全**被取代；且必须先保全每一条独有理由、备选、后果、验证要求与已知覆盖缺口 | `.agents/notes/README.md:50` |
| 拒绝 → 删除 | rejected 只在还能阻止一个「诱人且有意义」的错误时保留，否则整组删除 | `.agents/notes/README.md:14`、`:38` |

技能层把这条判据写成一句可执行的话：

> Reduce the active decision corpus without erasing history that can still guide work.

出处：`.agents/skills/dsh-archive-agent-notes/SKILL.md:8`（`[原文]`）。同文件还明确否定了配额式清理：「Do not archive toward a quota.」「word count and age are discovery aids, never archive criteria.」（`SKILL.md:29`、`SKILL.md:8`，`[原文]`）。

## 二、为什么是这套设计（仓库自己写的理由）

- **不记备选方案 = 邀请重吵一遍**：「A decision recorded without what it beat invites re-litigation — the failure Agent Notes exist to prevent.」（`.agents/notes/README.md:111`，`[原文]`）
- **冻结归档的理由是维护面**：只要一篇 Note 还在活跃树里，「every path, symbol, default, translation, code fence, package reference, and outbound link in the active corpus remains an obligation」；而「maintenance effort and search noise grow with records that no longer help a future decision」（`.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:9`、`:31`，`[原文]`）。
- **归档不能再被编辑的理由是规则会演进**：「a later formatting, translation, code, package, or link rule would require rewriting the historical snapshot」；允许只刷新事实也会「makes it unclear which clauses are historical」（同文件 `:39`、`:41`，`[原文]`）。
- **归档不进默认搜索的理由是旧事实会压过新事实**：「archived facts may be stale by design and can outrank current results by lexical match」（同文件 `:33`，`[原文]`；实现见 `.rgignore:2` 的 `/.agents/notes/archived/`）。
- **不建集中索引的理由是它会成为合并热点**：「Do not add a centralized `INDEX.md`: it duplicates path metadata and makes unrelated note changes contend on one generated file.」（`.agents/notes/README.md:19`，`[原文]`）

## 三、方向反转的三种走法

把上面的规则合起来，一次「改主意」按**旧方向走到哪一步**分三条路：

| 情形 | 处理 | 落地判据 |
|---|---|---|
| **只走了一半，其余部分仍有效** | 部分取代：两篇都留在现行树、互相链接、各自事实刷新 | 「Partial supersession does not qualify: keep both notes cross-linked and update every fact that remains current.」（`.agents/notes/README.md:50`，`[原文]`） |
| **完全被新决定取代** | 合并进当前 owner 后删除旧篇：先保全独有理由/备选/后果/验证/覆盖缺口，修好所有入链，并同时删掉中文对照与一致性记录 | `.agents/notes/README.md:50`，`[原文]`；「must not rewrite the old file into its opposite or rely on git history as the only copy of rationale」 |
| **从未实现、方向作废** | 走 `rejected/`：只加一行理由到 `Status:` 并冻结文件；等它不再能阻止错误时整组删除 | `.agents/notes/README.md:121`、`:14`、`:38`，`[原文]`；且「Never archive a proposed note: reject an obsolete proposal.」（`:38`） |
| **已交付又被移除** | 只有在该能力从生产代码、配置、schema、durable/wire 格式、迁移与兼容行为中**全部消失**，且没有现行文档宣称它可用、没有测试把它当支持行为时，才可合并进移除记录 | `.agents/notes/README.md:52`，`[原文]` |

这张表就是「项目左晃右晃」的记账方式：**每一次转向都能指认它属于哪一种，并且有唯一一个地方保存「现在是这样」。**

## 四、哪些是机器拦的，哪些只能靠人

机器拦的（都属于 `doc-sync` 的 quick 叶子门禁，见 `scripts/run-gates.ts:852`-`:854`）：

- **结构**：生命周期文件夹与状态行必须一致；`implemented/` 里出现提案时代的标题（`## Proposal`、`## Plan`、`## Migration plan`、`## Acceptance criteria`）直接拒绝——「an implemented Agent Note states what is (fold it into Decision/Consequences/Testing)」（`scripts/verify-agent-note-format.ts:74`，`[源码]`）。
- **分类与命名**：类别取自封闭集合，文件名必须是 `yyyy-mm-dd-topic.md`，集中索引被拒绝（`scripts/agent-note-tree.ts:19`、`:76`、`:48`，`[源码]`）。
- **归档不可变**：三件套必须完整、`Archived:` 日期必须紧跟 `Status: implemented` 且不得早于文件名日期、中英日期必须一致、sidecar 必须带两侧当前 Git blob 哈希；封存内容对着 append-only 清单校验，「sealed content hash changed」即失败（`scripts/archived-agent-notes.ts:122`-`:195`，`[源码]`）。

人判断的（仓库明确承认）：

> Review enforces the semantic boundary. No automated gate attempts to classify a diff as trivial or non-trivial, so this policy adds no gate stage or runtime.

出处：`.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:22`（`[原文]`；这是该条规则的历史出处）。归档技能自己也写明判据是语义的：「Judge every note semantically」，且长度「does not matter」（`.agents/skills/dsh-archive-agent-notes/SKILL.md:8`、`:23`，`[原文]`）。

**所以这套流程的诚实边界是：结构、去向、封存由机器保证；「这次改动算不算重大」「这篇 Note 还有没有指导价值」由人和 review 保证。** 它不假装能自动发现语义矛盾——见 [07](./07-limits.md)。

## 五、它对「spec 越堆越多」的正面回答

仓库不回避体量，而且把它量化在一个现行提案里：

> Active Agent Notes account for 580 files and 637,850 words … These quantities describe maintenance and retrieval pressure, not defects by themselves.

出处：`.agents/notes/proposed/process/2026-08-20-audience-first-documentation-quality.md:35`（`[原文]`；这是一篇仍处 `proposed/` 的提案，不是已生效规则）。

这句话的立场很关键：**多本身不是病，维护与检索压力才是**。对应手段就是本节的三条规则：默认不写（多数改动豁免）、写完做取代检查、低未来价值的记录冻结或删除。
