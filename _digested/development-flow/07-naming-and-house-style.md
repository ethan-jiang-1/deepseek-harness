# 07 — 命名、引用与家务规则：把「为什么不这么写」也写下来的工程习惯

> 前六篇讲这套文档机制的骨架与运转。本篇讲**命名法**与**日常习惯**——那些不成文才发现重要、写下来才可复查的部分。它们大多不是门禁，而是三层的措辞选择：`.agents/notes/` 自己的 `AGENTS.md` 文件、标题的句式、引用用什么代替、哪一层不允许出现哪些词。

## 三层命令文件，三种语气

`.agents/notes/` 的纪律不是一份文档，是**三份**，每份只有自己那段该说的话：

| 文件 | 行数 | 语气 | 说什么 |
| --- | ---: | --- | --- |
| [`README.md`](../../.agents/notes/README.md) | 125 | **规范** | 树怎么长、每个生命周期背什么义务、什么情况下写、正文骨架是什么 |
| [`implemented/AGENTS.md`](../../.agents/notes/implemented/AGENTS.md) | 13 | **义务** | 两件事：事实要实时更新；但不得借此改写决策 |
| [`archived/AGENTS.md`](../../.agents/notes/archived/AGENTS.md) | 9 | **禁令** | 九个动词的禁令：`Never edit, reformat, translate, repair, delete, or move a sealed artifact` |

13 行与 9 行的两个子目录军规是**故意做小的**。它们各自只回答一个问题，而且答案都在前两行：`implemented` 的问题是「事实过时了怎么办」，`archived` 的问题是「可是那是历史」。README 再长也不重述这两句，两个子目录文件也不重复植物学式的背景——**一个事实一个家，在这里是三条同层文件之间的分工，不是四个层级之间的分工。**

## 与 `docs/` 是管辖权对偶，而非同类

![DSH 做笔记的七个工程习惯](./figures/naming-and-house-style.svg)

最容易误读这一点：把这套东西当成「docs 的另一个子目录」。实际上它划的是**内容的归属**，而且两端都用排他语句写下来了。

`docs/AGENTS.md` 的层级表里，Agent Notes 占一行，右列是**排除项**：

> Active decision records: the why, what-was-given-up, and required verification; `implemented/` notes describe shipped reality in present tense — **Migration plans, acceptance-task checklists, fixture walkthroughs, and spec-speak ("should…") once the decision has shipped**; archived notes are frozen history, never current authority

同一张表里 `docs/architecture.md` 那一行反过来写：

> Ordered map: composition, core packages, loop, seams, extension points; read before changing `packages/` — **decision rationale (→ Agent Notes)**

两条对照起来，规则就完整了：**`docs/` 写当前状态，note 写为什么；`docs/` 不允许解释理由，note 不允许以当前状态自居。** 一句话版本在 `docs/AGENTS.md` 的 Placement 行：「bugs → postmortems; rationale → Agent Notes; procedures → cookbooks; type definitions → subsystems; package contracts → READMEs; standing orders → root `AGENTS.md` with a rationale link」。

这也解释了一条容易被当成排版的规则：`docs/AGENTS.md:7` 说「These rules apply to human-facing documentation; Agent Notes remain outside their scope.」——note **不受**散文预算、字数上限、受众分层那一套约束。它们不为「被读过」而优化，而为「被查证过」而优化。

## 命名法：五条现出来的规律

`yyyy-mm-dd-topic-title.md` 只规定了形状，真正决定「能不能活下去」的是里面那几个词。从 1275 个英文文件名里能看出五条稳定的习惯。

### 一、必须以动词开头

命名不是名词短语。除少数早期例外，文件名都是**一个决定的行为**：

| 句式 | 例子 |
| --- | --- |
| `{动词}-{对象}` | `prune-stream-visibility-helpers`、`fold-session-persistence-interface`、`truncate-interrupted-turns` |
| `{动词} ... over/with/to ...` | `pnpm-over-yarn`、`dev-invariants-over-deep-readonly`、`collapse-workflow-to-foreground-core` |
| `{对象} stay/keep/must-not ...` | `fork-children-stay-one-shot`、`served-index-must-not-be-cached`、`retain-ignorable-external-session-events` |
| `{主题}: {结论}` 型短句 | `single-source-before-derived-medium`、`explicit-agent-runtime-identity` |

一个附带效果：**超链接的文字天然自解释。** 任何一句正文里写「见 [fold-children-stay-one-shot]」，读者不需要点进去就知道那条决定说了什么。这与 [02](./02-gates.md) 里「章节名是闭集」同源：**命名承担一部分检索功能，于是索引就不需要存在了。**

### 二、同一个意思只有一个词

同一批决策不会换着说法：落地一律用 `-stay`、`-retain`、`-keep`；退役一律用 `-retire`、`-remove`、`-drop`、`-fold`、`-prune`、`-collapse`；替换一律写成 `X-over-Y`。这条与 [`docs/glossary.md`](../../docs/glossary.md) 的「one canonical term per concept」是同一条纪律在文件名上的 instance，而不是另一条规则。

`-fold` 尤其值得单独提：它在 `simplification` 类里被用来表示「两个东西其实是同一个，合并掉」，并且这个用法在文件名、正文、以及 [03](./03-transitions.md) 的转换表里**三处一致**。术语能跨层一致，是因为它们本来就在同一批人的同一种命名习惯里。

### 三、标题里明明写着的东西，正文不得重述

这个习惯最不显眼，但影响很大：

- 文件名写着 `2026-08-10-fork-children-stay-one-shot.md`，正文的 `## Decision` 就不再解释「为什么这很重要」，而是直接给机制；
- 文件名写着 `2026-09-19-retire-prompt-registry-change-event.md`，`## Problem` 就直接从「仓库搜索找不到执行中的产品监听器」开始，不复述「我们要退役一个事件」。

**文件名是 `## Problem` 的摘要，`## Problem` 是文件名的证据。** 读起来像重复，实际上是「声明」与「论证」的分工。

### 四、标题里的日期是**主题首次被提出**的时间，不是归档时间

README 写得很精确：`The date in the filename is when the topic was **first proposed** (per git history).` 两个推论：

- 归档**不改名**。一篇 2026-06-11 的 note 在 2026-09-04 被移进 `archived/`，文件名仍是 06-11——所以 `archived/` 里的日期分布反映的是**决策发生的时间**，不是遗忙被执行的时间。
- 归档日被单独放在 `Archived:` 行里，**不占用文件名位**。这是「地址语义」与「状态语义」不混入同一个字段的又一例，与 [语料维护宪章](../CORPUS-CHARTER.md) 在另一层做的「内容地址不用版本号」是同一个直觉。

### 五、标题不用问句，也不带状态词

没有 `should-we-...`、没有 `-revisited`、没有 `v2`、没有 `final`。因为一篇 note 的生命周期已由目录表达；把「还没定」「改过一次」写进文件名，就是在一个已有状态机的系统里再建一套私有的状态标记。

## 章节词汇是一张闭集表

`verify-agent-note-format` 要求的第一节永远是 `## Problem`，其余按生命周期从一张小表里选。这张表的条目少得有意：

| 章节 | 什么时候用 | 不允许出现的地方 |
| --- | --- | --- |
| `## Problem` | 永远第一节 | — |
| `## Decision` | implemented | proposed / rejected |
| `## Alternatives considered` | **全部生命周期** | — |
| `## Consequences` | implemented | proposed / rejected |
| `## Proposal` | proposed / rejected | **implemented**（被禁） |
| `## Acceptance criteria` | proposed / rejected | **implemented**（被禁） |
| `## Risks` | proposed | — |

还有一条允许但不强制的：`## Testing` / `## Verification` / `## Deferred` / `## Related` 在 implemented 里可以用，但必须写成现在时的事实（“what now pins the behavior”），不能写成任务清单。

**这套词汇的真正价值不在词汇本身，而在它禁止了什么。** `## Acceptance criteria` 在 implemented 里被禁，背后是一条判断：一旦决定已落地，验收标准就不再是「我们将怎么知道做完了」，而是「现在钉住行为的是什么」——后者是 `## Testing`，前者是提案语言。同一个章节名在两个生命周期里意思完全不同，所以干脆不允许它跨过去。

而且这个禁行**与拒绝的方向相反**：`rejected/` 允许保留 `## Acceptance criteria`、`## Plan`，因为 rejected 就是提案快照。**同一个标题在一个目录里被禁、在另一个目录里被要求保留**——理由只有一个：状态不同，语气就不能共享。

## 引用习惯：链接代替叙述

README 里有一条给人听的禁令：`Cross-references between Agent Notes use relative markdown links (...) — never bare prose or numbers — so they are mechanically checkable and survive moves between folders.`

三个字是重点：**mechanically**。因为用了真正的链接，`verify-md-links` 能查出断链，`verify-doc-refs` 能查出链接不到的位置；如果写成「见第 12 号 note」，这两道门禁全部失效。

同一条规则的另一个后果是：**归档造成的引用折断能被立刻发现**。`a7a5be1703` 把 452 组三件套搬家后，必须同一提交里改掉 242 篇 `.md` 的入站链接（[04](./04-forgetting.md#可复核的部分无-rename-检测时的逐文件增删行)），否则全红。也就是说，“归档不破坏引用”不是靠人记得，是靠链接能机器验证。

## 三条「不要」，各自有一个具体动机

| 禁令 | 原文 | 是否被强制 | 真实动机（来自文档自己的话） |
| --- | --- | --- | --- |
| 不要集中索引 | `centralized Agent Note indexes are forbidden` | **是**（classification 报错） | 重复路径已有的元数据；让无关修改争用同一文件 |
| 不要 changelog 式改写 | `do not append change history` | 否 | 变更历史属于 git 与 `_change_log/`；note 不是日记 |
| 不要 `unknown` 断言之外的取巧 | 这里的类比是：不靠兜底而靠拒绝 | — | — |

第二条值得展开。`implemented/AGENTS.md` 说「Rewrite stale facts in place; do not append change history.」，意思是不允许出现这种段落：

> （2026-09-14 更新：该默认值已改为 5。）

正确做法是直接把事实改成新值。理由是：如果每篇 note 都累积历史，那么每位读者都要先花时间区分「现在是什么」与「曾经是什么」，而这正是 `docs/` 一直在付、note 专门不付的成本。历史要么在 git 里（免费、精确、按需），要么在 `_change_log/` 里（结构化、可检索），不需要第三份。

## 三段式的「测试」

一个很细的习惯：当一条 note 声称某个迁移步骤能原地完成时，`docs/cookbook/reviewing-persistence-type-changes.md` 要求填真实的 vitest 证据，并明说：

> A recording command's `ok: true` does not replace these checks or the owner's behavior and migration tests.

这是 DSH 通用的**证明模板**在文档领域的实例：`AGENTS.md` 要求「prove each changed acceptance path rejects an invalid case」——一个新检查必须先证明它会红。同样地，一条说法必须先证明它可能错（[06](./06-honest-gaps.md) 的「可证伪」栏位）。**说一句话与证明这句话的区别，在这套体系里是章节级的：`## Decision` 是说法，`## Testing` 是证明。**

---

## 本篇用到的五个习惯

| 习惯 | 一句话 |
| --- | --- |
| 三层命令文件 | 总规、子目录义务、子目录禁令各自小且只说自己那句 |
| 管辖权对偶 | `docs/` 写状态、note 写理由；两边的排除项互相兜底 |
| 动词命名 | 文件名是一个行为，且同一意义只用一个词 |
| 闭集章节词汇 | 同一个标题名在不同生命周期不得跨用 |
| 链接代替叙述 | 引用写成真链接，才对得起断链门禁 |
