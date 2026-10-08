# 04 · 为什么有那么多类型

## 先给结论

三个问题，三个不同的答案：

| 看起来像「类型太多」的东西 | 真实身份 | 一句话原因 |
|---|---|---|
| `proposed/` `implemented/` `rejected/` | **状态**——一篇 Note 一生只处于其中一个 | 它回答的是「这个决定现在还算数吗」 |
| `archived/` | **不是状态，是冷藏库** | 里面所有 Note 状态仍是 `implemented` |
| `feature` `bug-fix` `simplification` `architecture` `process` `testing` | **类型**——纯粹是检索用的标签 | 一千多篇之后，你需要先缩小范围再读 |

三个状态 + 一个冷藏库不是设计出来的分类体系，是**两个约束倒逼出来的**：读者主要是 agent（需要稳定可检索的结构），语料会长期增长（需要收敛机制）。下面逐个交代「为什么必须有它」。

## 为什么状态是三个而不是两个

「已交付」和「没交付」两个状态看起来就够了。第三个——`rejected/`——存在的唯一理由是**防止重新开讼**：

> Keep a rejected note only while it prevents a plausible mistake; otherwise delete its complete triplet.

被否决的提案值得留档，当且仅当**它落选的那个诱惑仍然存在**。真实例子：

[`rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md`](../../.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md) 记录的是「用手写的、可取消的 `setTimeout` 包装，换掉 `node:timers/promises` 内置版本」。这个提案**看起来明显是净赚**——删掉大约 10 行手写代码，换上标准库。它输掉的理由只有一句话能说清：

> vitest's fake clock does not intercept `node:timers/promises`, so the swap costs deterministic fast tests for ~10 deleted lines

没有这篇 Note，下一个做清理的人会**再一次**提出这个改动，并且再一次花时间发现同一件事。这就是「防止一种合理的错误」。

反过来，一旦那个诱惑消失了，Note 就该删：

> delete streaming workflow progress through tool calls — 972 words: its ACP/UI premise is obsolete

972 词也照样删——**篇幅不是判据**。

> 关键区别：被否决的提案**永远不归档**。归档是给已交付决定用的；过时的提案要么转 `rejected/`，要么删掉。

## 为什么有六个类型

六个类型是**封闭集合**，门禁 [`scripts/agent-note-tree.ts`](../../scripts/agent-note-tree.ts) 拒绝任何不在这份名单里的目录：

| 类型 | 覆盖范围 | 现在的数量（implemented） |
|---|---|---|
| `architecture` | 关于**交付源码**的结构性决策：包之间怎么关联、运行时词汇是什么 | 201 |
| `feature` | 面向用户或模型的新能力 | 132 |
| `process` | 代码**周边**的工具、政策或工作流——门禁、包管理器、vendoring | 69 |
| `bug-fix` | 修正缺陷，或弥补事故复盘暴露出来的缺口 | 63 |
| `testing` | 测试基础设施与策略 | 33 |
| `simplification` | 不增加能力的前提下，移除代码、行为或对外范围 | 27 |

最容易被追问的两条线：

- **`architecture` / `process` 的分界**：architecture 关乎我们交付的源码；process 关乎围绕源码的工具与工作流。
- **没有 `refactor`**：它和 `simplification` 重叠，而后者的判别标准「可观察行为是否改变」已经覆盖了它。**故意少一个类型，比多一个模糊的类型好。**

### 这六个类型是从哪来的

它们不是一开始就设计好的，而是**从旧的目录名快照下来的**。2026-08-11 的提交 `a767cd357f`（PR #2280，"docs: propose repository naming contract and rename ledger"）把当时的 Note 树**整体搬进了类型子目录**——同一次改动里，旧的顶层分区变成 `feature/`、`bug-fix/`、`simplification/`、`architecture/`、`process/`、`testing/`，并把这份名单写进了门禁和 README。

这解释了一个新人常见困惑：**为什么有些 Note 的类型看起来可以两说？** 因为在既有分类上做判断，本来就有一批边界案例。分类的作用是**缩小检索范围**，不是给出唯一正确答案：

- 拿不准 `simplification` 还是 `feature`？问「可观察行为变了吗」。
- 拿不准 `architecture` 还是 `process`？问「我改的是交付的源码，还是它周围的工具」。
- 真的两可？选一个，不要为此新增类型——新增类型要同时改门禁名单和 README，是一次刻意行为。

## `archived/` 为什么不算第四个状态

因为它**不是 Note 的状态，是它的存放位置**：

- 归档件的 `Status:` 行仍然是 `implemented`，只是在下面多插一行 `Archived: YYYY-MM-DD`；
- 只有 implemented 能进去——所以归档路径 `archived/{类型}/…` 里**刻意没有 `implemented` 这一层**；
- 进去以后**永久冻结**：不得编辑、翻译、重新格式化、更新、移动或删除，也不得当作当前行为的权威依据。

```text
.agents/notes/implemented/architecture/2026-…-….md   ← 活的：路径/名称变了要跟着改
.agents/notes/archived/architecture/2026-…-….md      ← 死的：封存时的快照，永不改动
```

规模说明它为什么必要：**归档 641 篇，活跃（`proposed` 39 + `implemented` 525 + `rejected` 14）578 篇。** 没有冷藏库，活跃树的信噪比会持续恶化。

## 三个状态、六个类型、一个冷藏库——合起来就是这张图

![三个状态、六个类型与一个冷藏库](./figures/lifecycle-and-types.svg)

```text
        写下来                  交付               还能指导未来工作吗？
  ───────────────►  proposed  ────────►  implemented  ──── 是 ──► 留在 implemented/
                      │                      │
                      │ 被否决                │ 不能，但还有历史价值
                      ▼                      ▼
                  rejected/              archived/（冻结）
                      │
                      │ 那个诱惑消失了
                      ▼
                    删除三件套
```

注意图上没有回头箭头：**`archived/` 里的东西永远不出来**，`rejected/` 也不会「复活」成 proposal——想重新提，就新写一篇。

## 证据入口

- [`scripts/agent-note-tree.ts`](../../scripts/agent-note-tree.ts)：状态与类型的封闭集合、允许清单、`INDEX.md` 禁令。
- [`.agents/notes/README.md` 的 "Classification"](../../.agents/notes/README.md)：六个类型的定义与 architecture/process 分界。
- 提交 `a767cd357f`（2026-08-11）：把旧目录整体搬进类型子目录、确立这份名单的那次改动。
- [`dsh-archive-agent-notes`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md)：保留 / 归档 / 删除的判定与校准例子（含字数作为反证的那几个案例）。
