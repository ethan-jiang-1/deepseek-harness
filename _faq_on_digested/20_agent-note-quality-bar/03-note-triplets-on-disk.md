# 03 · 磁盘上的三件套

## 一句话

一篇 Note 在磁盘上是**三个文件**，路径本身同时编码状态和类型：

```text
.agents/notes/{生命周期}/{类型}/yyyy-mm-dd-topic-title.md      ← 英文正文
.agents/notes/{生命周期}/{类型}/yyyy-mm-dd-topic-title.zh.md   ← 中文对侧
.agents/notes/{生命周期}/{类型}/yyyy-mm-dd-topic-title.i18n.yaml ← 一致性记录
```

真实例子（`implemented/feature/` 下的一篇）：

```text
2026-09-16-sandbox-same-mode.md
2026-09-16-sandbox-same-mode.zh.md
2026-09-16-sandbox-same-mode.i18n.yaml
```

## 为什么是三个

因为 DSH 的文档是**双语同权**的，而且配对要被机械检查：

- 两种语言**权威相等**：可以先用中文写再翻成英文，中文优先和英文优先一样合法；约束它们的是「必须说同一件事」。
- **一对 = 三个兄弟文件**，同目录、无 locale 子目录、无交错双语文件。PR 从不只落一种语言。
- `.i18n.yaml` 是**一致性记录**：逐标题段落记录英文块与中文块的哈希。改了一边就要带上另一边，然后重录：

```sh
pnpm run verify-translation-pairing --write .agents/notes/implemented/feature/2026-09-16-sandbox-same-mode.md
```

sidecar 的实际内容长这样：

```yaml
/agent-note-repeated-sandbox-modes-need-no-approval:
  en: 85325770757063d8
  zh: 9c55052551299ddf
/agent-note-repeated-sandbox-modes-need-no-approval/decision:
  en: b102948c4acbdd96
  zh: 7220f043716d571c
```

键是标题 slug 路径，值是那一节中英两边**不同**的内容块哈希。门禁管一致性，不管翻译质量——「绿色哈希不等于翻译正确」是 code review 的活儿。

> 路径里的日期是主题**首次提出**的日期（以 git 历史为准），不是实现或归档日期。

## 只想要英文？那这一层可以整层删掉

三件套是 DSH 的项目政策（[`docs/i18n/README.md`](../../docs/i18n/README.md)），不是 Agent Note 制度的必需部分。单语仓库直接删掉 `.zh.md` 与 `.i18n.yaml`，把两个门禁拿掉即可——见 [06 移植](./06-port-to-another-repo.md)。

## 被测的目录树

门禁 [`scripts/agent-note-tree.ts`](../../scripts/agent-note-tree.ts) 会把结构错误直接判失败：

| 规则 | 违规时报错 |
|---|---|
| 顶层只能是生命周期文件夹 | `unknown lifecycle folder (allowed: proposed, implemented, rejected, plus archived/)` |
| 第二层只能是六个类型之一 | `unknown class folder "xxx" (allowed: feature, bug-fix, …)` |
| 深度必须是三层 | `expected {lifecycle}/{class}/file.md (got depth N)` |
| 文件名必须带日期前缀 | `filename must be yyyy-mm-dd-topic.md` |

还有一条容易踩的：**`INDEX.md` 是被显式拒绝的。**

> centralized Agent Note indexes are forbidden; browse the lifecycle/class tree or search the repository

也就是说：**目录树本身就是清单**，不要另外维护一份索引——第二份清单一定会漂移。Note 之间的交叉引用只用相对 Markdown 链接（`[topic](../../implemented/architecture/2026-…-….md)`），从不用裸文字或编号，这样既能机械检查，也能在文件夹之间移动后继续有效。

## 头部与状态的语法

前三行严格是 `# Agent Note: <title>`、空行、`Status: <status>`，第四行空行，且**全文只有这一个 `Status:` 行**。三种状态：

```text
Status: proposed
Status: implemented
Status: rejected — <why, in one line>
```

状态行**不带日期、不带括号补充**：日期在文件名，其余在 git。唯一带内容的是 rejected，因为读者查阅被否决的 Note 时，结论正是他要找的东西。

真实例子（拒绝理由是完整的一句话）：

```text
Status: rejected — implementation (PR #679) falsified the parity premise: vitest's fake clock
does not intercept `node:timers/promises`, so the swap costs deterministic fast tests for
~10 deleted lines
```

## `.md` 与 `.zh.md` 的机器标记必须保持英文原样

格式门禁**跳过** `.zh.md`；配对门禁检查它们的一致性。但两个跨语言的机器标记在中文文件里也不翻译：

- 第一行 `# Agent Note: `
- 第三行 `Status: `

其余章节标题（`## Problem` 等）在中文侧同样保留英文——配对是按 slug 路径逐节比对的。

## 改名与移动

- **在生命周期之间移动**：同一变更里改 `Status:` **并且**满足目标文件夹的骨架，否则门禁失败。`proposed/` → `implemented/` 是把 `## Proposal` 改写成现在时 `## Decision`，把验收与风险里仍有价值的事实折进 `## Consequences`；`proposed/` → `rejected/` 只在 `Status:` 加理由并冻结。
- **类型选错了**：改目录即可，但三件套一起移动。
- **归档**：见 [05](./05-keep-archive-delete.md)——那是唯一允许在正文里加一行 `Archived: YYYY-MM-DD` 的变更。

## 证据入口

- [`.agents/notes/README.md` 的 "Layout and naming"](../../.agents/notes/README.md)：路径语法、日期语义、不用索引、相对链接。
- [`docs/i18n/README.md`](../../docs/i18n/README.md)：三件套契约、sidecar 键与哈希语义。
- [`scripts/agent-note-tree.ts`](../../scripts/agent-note-tree.ts)：上表每条报错的来源。
