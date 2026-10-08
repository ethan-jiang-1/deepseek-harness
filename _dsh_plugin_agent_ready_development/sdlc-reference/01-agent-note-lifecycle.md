# Reference 01 · Agent Note lifecycle（生命周期）

## 一句话

成为一篇 Agent Note，是在同一次变更里留下一份代码、测试和现有文档都解释不了的持久决定：为什么这样做，以及当时放弃了什么。改动本身不会成为 Note。机械或局部编辑不写。同一决定已有 owner 时，更新那一篇。决定已经做出，就直接写进 `implemented/`；只有尚未构建、需要先评审的重大工作，才从 `proposed/` 开始。写完之后，留下、归档、合并后删除是三种不同结局。

## 本页读法

先判断这次会不会成为一篇 Note，再看它放在哪、正文长什么样，最后看写完之后怎样收场。图回答第一问和最后一问。

| 问题 | 本节 |
|---|---|
| 什么会成为一篇 Note | [§1](#1-什么会成为一篇-note) |
| 成为之后放在哪个路径 | [§2](#2-路径同时编码状态和类别) |
| 三个状态和冻结存放地各表示什么 | [§3](#3-三个-lifecycle-状态与一个冻结存放地) |
| 正文要有哪些段，才算这篇 Note | [§4](#4-文件格式让状态转换可检查) |
| `proposed` 交付时正文怎样改写 | [§5](#5-proposed--implemented-是正文改写) |
| 留下、归档，还是合并后删除 | [§6](#6-写完之后留下归档还是合并后删除) |

本页拥有成为 Note 的判据、状态转换和写完之后的三条结局。[Reference 03](./03-plan-and-sandbox.md) 拥有一次会话里的 Plan。[Reference 05](./05-prose-doc-standards.md) 拥有「系统现在做什么」。[Reference 09](./09-intake-and-work-items.md) 拥有 Issue 与 proposed Note 作为意图载体的分工。

## 1. 什么会成为一篇 Note

![什么会成为一篇 Agent Note，以及写完之后的三条结局](./figures/agent-note-lifecycle.svg)

DSH 自己的定义是：Agent Note 是 agent 写的 RFC，保存决定或提案的理由、被放弃的方案、后果和必需的验证。

> Agent Notes are effectively RFCs written by agents: durable proposals and decision records that preserve rationale, alternatives, consequences, and required verification.
>
> — DSH [`.agents/notes/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/AGENTS.md)。成为 Note 的是一份给以后的参与者看的决定记录。它要能独立回答「为什么是这条路」。

规则把「写不写」收成一个条件。代码和文档装得下的 why，仍然不够；测试也装不下，才写。

> Add or update an Agent Note in the same PR only for lasting decision rationale that code, tests, and existing documentation do not explain. A proposal for substantial future work starts in `proposed/`; a decision already made starts in `implemented/`.
>
> — DSH [`.agents/notes/README.md` 的 “When to write one”](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/README.md#when-to-write-one)。`only for` 把 Note 收成例外。后一句规定起点：proposal 只属于实现前要评审的重大工作，已做出的决定直接进入 `implemented/`。

拿这次改动对三个出口：

| 出口 | 怎样判断 | 动作 |
|---|---|---|
| 不成为 Note | 没有新的持久取舍。当前行为已经由代码、测试或现有文档解释；或者这次是机械编辑、局部编辑，包括局部 UI 的呈现与交互 | 不新建。当前行为留在它已有的文档和测试里 |
| 更新已有 Note | 决定还是那一个，变的是它落在哪：路径、包名、key、默认值 | 改 owner 里的事实。不另建一篇 |
| 新写一篇 | 出现一份以后还会被人重新提出的取舍，而代码、测试和现有文档都装不下这份 why 和放弃了什么 | 尚未构建且要先评审：`proposed/<class>/`。决定已随这次变更交付：`implemented/<class>/` |

> Updating the Agent Note that already owns the decision satisfies the rule; do not create a duplicate. Mechanical or local edits, including local UI presentation and interaction changes, are exempt. An Agent Note is never edited into a *different decision*: supersede it with a new one, and keep both notes cross-linked unless the old note is later fully consolidated under the rule below.
>
> — DSH [`.agents/notes/README.md` 的 “When to write one”](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/README.md#when-to-write-one)。同一决定不复制。一篇 Note 不能被改写成另一个决定；要换决定，就新写一篇，并与旧篇交叉链接。跟踪既有决定的新位置，是必须做的更新。

`bug-fix` 是正式类别，表示修正缺陷或补上复盘暴露的缺口。一次修复成为 Note，是因为它留下了别处装不下的决定；只是让代码回到既有决定之内，走第一个出口。篇幅、改动文件数都不是这条判据。归档侧把同一边界写在删除上：局部 bug 修复、性能变更、新能力或实质行为决定，不因为实现小就够格删掉。

两则基线上的对照：

- 小改动仍然成为了 Note。[Repeated sandbox modes need no approval](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/implemented/feature/2026-09-16-sandbox-same-mode.md) 记录：`danger-full-access` 已经生效时，再次请求同一模式应直接返回。拒绝这次调用会挡住已授权的工作，又挡不住任何权限上升。若不写下这个边界，后来的人会把它当成漏洞补上。这篇 Note 同时写明，它只部分取代沙箱决定里的 non-widening rejection，原决定的隔离和逐次批准仍然有效。
- 一次合格交付没有成为 Note。PR #5004 `fix(web): show model IDs in monospace and names on hover` 改了模型设置列表的呈现，同一变更更新了组件、样式、README 和测试，没有新增 Agent Note。局部 UI 呈现由现有文档和测试解释。

一篇文件要真的成为 Note，还得写下它击败了什么。只写结论、不写输家，等于邀请后来的人把同一条路再争论一遍。这段强制要求在 [§4](#4-文件格式让状态转换可检查)。

## 2. 路径同时编码状态和类别

活动树使用 `{lifecycle}/{class}/yyyy-mm-dd-topic-title.md`：

- `lifecycle` 是 `proposed/`、`implemented/` 或 `rejected/`；低未来价值的 implemented triplet 另行移动到冻结的 `archived/` 树；
- `class` 是 `feature`、`bug-fix`、`simplification`、`architecture`、`process` 或 `testing`；
- 日期是主题首次提出的日期，不是实现或归档日期。

分类是 `scripts/agent-note-tree.ts` 中的封闭集合，门禁拒绝未知目录。`refactor` 不在集合中；不增加能力的删除或收缩归 `simplification`。`architecture` 记录交付源码的结构决定；`process` 记录代码周围的工具、政策和流程。

路径树本身就是工作清单：仓库刻意不设集中式 `INDEX.md`（历史上的生成索引已被移除，理由由 no-index Agent Note 拥有），读者按 lifecycle/class 目录浏览或全库搜索；Note 之间的交叉引用只用相对 Markdown 链接，不用裸文字或编号。

> Cross-references between Agent Notes use relative markdown links [...] — never bare prose or numbers — so they are mechanically checkable and survive moves between folders. The active lifecycle tree is the working inventory: browse its lifecycle/class folders or search the repository. Do not add a centralized `INDEX.md`; the no-index Agent Note owns the rationale.
>
> — DSH [`.agents/notes/README.md` 的 “Layout and naming”](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/README.md#layout-and-naming)。相对链接让引用可被机械检查，也让 Note 在 lifecycle 目录间移动后链接仍然有效；目录树代替索引，避免第二份会漂移的清单。

## 3. 三个 lifecycle 状态与一个冻结存放地

| 位置 | 内容 | 读者怎样使用 |
|---|---|---|
| `proposed/` | 未完成或仅部分完成的重大未来工作 | 评审问题、方案、验收和风险，不能当成已交付功能 |
| `implemented/` | 已交付决定及其替代方案和后果 | 作为当前 rationale owner，并随路径、名称、默认值和机制保持 current |
| `rejected/` | 被否决的提案及一行拒绝原因 | 仅在仍能阻止一个可信错误时保留 |
| `archived/` | 未来决策价值低的 implemented 历史快照 | 只作历史引用，永久冻结，不是当前权威 |

`Status:` 值只有三种，且与所在目录互相校验；`archived/` 不是第四种状态——归档保留 `Status: implemented`、只在其下插入 `Archived:` 行，且只有 implemented Note 能进入。`proposed → rejected` 冻结提案；`proposed → implemented` 必须改写成已交付事实；`implemented → archived` 只在未来决策价值低时发生。Proposed Note 永不归档，过时提案应转 rejected；rejected Note 失去防错价值后删除完整 triplet。

## 4. 文件格式让状态转换可检查

`pnpm run verify-agent-note-format` 是 `doc-sync` 的一部分，强制：

- 前三行是 `# Agent Note: <title>`、空行、`Status: <status>`，且 status 与目录一致；
- body 以 `## Problem` 开头；
- proposed 使用 `## Proposal / ## Alternatives considered / ## Acceptance criteria / ## Risks`；
- implemented 使用 `## Decision / ## Alternatives considered / ## Consequences`，拒绝 proposal-era 的 `Proposal / Plan / Migration plan / Acceptance criteria` 标题；
- rejected 保留提案体，拒绝结论写在 `Status:` 行；
- 每个活动 Note 都有 `## Alternatives considered`，只有规则生效前且无法重建 alternatives 的 Note 可使用固定 grandfather 注释。

强制备选有明确目的：仓库把“没有记录它击败了什么”的决定视为会重新引发争论的失败模式，备选只能记录、不能编造。

> A decision recorded without what it beat invites re-litigation — the failure Agent Notes exist to prevent. Alternatives are recorded, never invented.
>
> — DSH [`.agents/notes/README.md` 的 “Alternatives considered — mandatory”](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/README.md#alternatives-considered--mandatory)。Agent Note 的存在理由是防止重新开讼：每篇 Note 固定携带“为什么不是另一条路”，让后续参与者从已知理由开始，而不是重新提出已被击败的方案。

格式门禁只证明结构满足规则，不证明决定正确、替代方案真实或 shipped facts 与代码一致；这些仍需语义 review。没有一份「写 Agent Note」的 skill：路径和骨架由上面的门禁执行，留下还是归档的语义判断留在 [§6](#6-写完之后留下归档还是合并后删除) 的 skill。

## 5. `proposed → implemented` 是正文改写

移动和改写必须在同一变更完成：

- `Proposal` 改成现在式 `Decision`；
- acceptance 与 risks 中仍有维护价值的事实进入 `Consequences` 或现在式 `Testing / Verification`；
- 删除迁移计划和未来时态，记录实际交付内容；
- 同一 diff 更新源码、当前文档和行为证据。

只修改路径和 `Status:` 会让未来计划伪装成当前事实，因此格式 gate 和 code review 都检查这次改写。

## 6. 写完之后：留下、归档，还是合并后删除

写完不是终点。之后有两个不同的问题。Supersession 问：哪个活动 Note 继续拥有这个决定。保留、归档或删除问：一篇已经写完的记录，还值不值得留在活动树里。字数和年龄只帮助发现候选，从来不是判据。

> Judge every note semantically; word count and age are discovery aids, never archive criteria.
>
> — DSH [`dsh-archive-agent-notes`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/skills/dsh-archive-agent-notes/SKILL.md)。判的是这份理由还能不能指导以后的工作。

每新增一篇 Note，都要在同一个 PR 里搜索同一决定、机制或被拒方案，并分类：

> Every new Agent Note triggers a supersession check. Search the active tree for older notes covering the same decision or mechanism, classify any full or partial supersession with dsh-archive-agent-notes, and archive every qualifying implemented triplet in the same PR. Keep partial supersessions active and cross-linked.
>
> — DSH [`.agents/notes/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/AGENTS.md)。`qualifying` 指符合归档条件的那几篇，不是每一篇被提到的旧 Note。部分取代的两边都继续活动，并交叉链接。

完全取代还有另一条出路。新 owner 已经吸收旧篇全部独有内容时，旧三件套删除，不进归档：

> An implemented Agent Note that is fully superseded may be consolidated into the current owning note and deleted. Before deletion, the owner must preserve every unique rationale, alternative, consequence, required verification, and named coverage gap; repair every inbound link; and delete the Chinese counterpart and consistency record in the same change. Partial supersession does not qualify: keep both notes cross-linked and update every fact that remains current.
>
> — DSH [`.agents/notes/README.md` 的 “When to write one”](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/README.md#when-to-write-one)。合并删除的前提是独有内容已经活在新 owner 里。不得把旧文件改写成相反结论，也不得只靠 git history 留底。

| 情况 | 结局 |
|---|---|
| 部分取代，或旧理由仍独立有用 | 两边都留在活动树，交叉链接，并更新仍然有效的事实 |
| 完全取代，且新 owner 已吸收全部独有 rationale、alternative、consequence、verification 和 coverage gap | 删除旧的英文、中文和 sidecar，并修复入站链接 |
| 已交付，理由、备选、否定性保证、归属边界、持久化或协议语义、安全规则或重新引入条件仍可能指导以后的改动 | 留在活动树 |
| 已交付且完整，不太再指导以后的工作，历史决定价值仍在 | 归档完整三件套 |
| implemented 只描述小型 UI 调整或纯机械变更 | 直接删除完整三件套。局部 bug 修复、性能变更、新能力或实质行为决定，不因为实现小就走这条 |
| 提案过时 | 不归档。转入 `rejected/`，或在不再能阻止可信错误时删除 |
| rejected 的想法已经过时，或不再能阻止重新开讼 | 删除完整三件套，并修复或删除入站链接 |

功能新增 Note 收进后来的移除 Note，还要多满足一组事实：该功能已从生产代码、配置、schema、持久化或线上格式、迁移和兼容行为中消失；当前文档不再把它写成可用；测试不再把它当成受支持行为。移除 owner 要保住原来的动机、为何不再成立、未完全移除的备选、放弃的能力、重新引入的条件，以及对「已经完全不存在」的验证。只去掉一种传输、默认值、实现或呈现，或者仍有持久数据与兼容处理，是部分取代，两边都留。

归档不是改个文件夹名。一次归档移动完整的 `.md`、`.zh.md`、`.i18n.yaml`，路径是 `archived/{class}/`，中间没有 `implemented`。正文不改，只在两种语言的 `Status: implemented` 下插入同一行 `Archived: YYYY-MM-DD`，机械重录 sidecar，并处理活动 prose 的入站链接。`verify-archived-agent-notes` 把内容写入只追加的 hash manifest。封存后不得编辑、翻译、移动或删除。文档门禁跳过归档源文件，包括它们的出站链接；活动 prose 仍可以在有意引用历史时链进去。

`dsh-archive-agent-notes` 拥有上面这张表的语义判断。格式 gate 只证明结构合法，不代替这张表。Skill 为什么适合承载这类判断，见 [Development Harness 的 Skills 章节](../repo-harness/03-skills-as-procedural-memory.md)。

## 证据入口

- DSH [`.agents/notes/README.md` 的 “When to write one”](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/README.md#when-to-write-one)：成为 Note 的条件、豁免、禁止改写成另一个决定、完全取代后的合并删除。
- DSH [`.agents/notes/README.md` 的 “Archiving and deletion”](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/README.md#archiving-and-deletion)：留下、归档、直接删除，以及 proposed 永不归档。
- DSH [`.agents/notes/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/AGENTS.md)：Agent Note 的身份，以及新增 Note 触发 supersession check。
- DSH [`dsh-archive-agent-notes`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/skills/dsh-archive-agent-notes/SKILL.md)：按未来价值分类，以及归档一次的五个动作。字数和年龄不是判据。
- DSH [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/README.md)：路径、六个 class、统一正文结构。
- DSH [no-index Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/implemented/process/2026-07-19-remove-generated-agent-note-index.md)：活动树为什么不设集中索引。
- DSH [implemented Note 子树规则](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/implemented/AGENTS.md)：implemented Note 如何随已交付路径、名称和机制保持当前。
- DSH [archived Note 子树规则](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/archived/AGENTS.md)：归档 triplet 的冻结与 seal 约束。
- DSH [统一格式 Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/implemented/process/2026-07-05-uniform-agent-note-format.md)：为什么三种活动 lifecycle 使用一套可检查格式。
- DSH [Repeated sandbox modes need no approval](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/implemented/feature/2026-09-16-sandbox-same-mode.md)：一次小改动仍然成为 Note 的对照。
