# 09 · AGENTS.md 层级骨架：从根到 README 的渐进披露入口链

## 这条线为什么值得单独立一章

前面 [`02`](./02-legibility-ownership.md) 讲了「一个事实一个 owner」和「渐进披露」，[`08`](./08-step-by-step-guide.md) 的 Phase 1 让你「写一份短的 AGENTS.md」。这一篇把这条线**钉成一条物理入口链**——它是渐进披露在仓库文件系统里的真实骨架，也是「agent 不糊涂」第一落地的东西。

DSH 的入口链长这样：

```text
CLAUDE.md（symlink → AGENTS.md，同一份真实文件）
  └─ 根 AGENTS.md（standing orders + 布局 + 命令，每条 link 到 home）
       ├─ 子树 AGENTS.md（只在「该子树有专属常驻规则」时才有，数量刻意克制）
       │    └─ 按需 link 到各 package README.md（当前合同的事实层）
       └─ docs/architecture.md（有序地图）、docs/AGENTS.md（文档 tier）
            cookbook/（怎么做）、.agents/notes/（为什么）
```

四个环节各有分工，缺一个都不成立。

## 环节一：CLAUDE.md 是 symlink，不产生第二份事实

`CLAUDE.md` 在根、`packages/`、`examples/` 等处都指向同一份 `AGENTS.md`。原因是：不同 agent host 有不同入口文件名约定（Claude 类读 `CLAUDE.md`，其它读 `AGENTS.md`），但**事实只该有一份**。用 symlink 而不是复制，让「改规则」只有一个动作、一个 home，不会出现两份内容漂移。

> `CLAUDE.md` symlinks `AGENTS.md` at root, `packages/`, and `examples/`; edit the real file.

可迁移结论：**你的项目里，`CLAUDE.md` 直接 `ln -s AGENTS.md`，永远只编辑 `AGENTS.md`。**

## 环节二：根 AGENTS.md 只放 standing orders

tier taxonomy 的第一行规定根 `AGENTS.md` 的职责和禁区：

| 属于它 | 不属于它 |
|---|---|
| 每轮都要在上下文里的规则（每条 1–3 行，链到 home） | 故事、worked example、情境化流程、任何从 linked home restate 的内容 |

根 `AGENTS.md` 的「Repository layout」正是「内容串起 README」的范例：它用 `packages/README.md`、`python/README.md`、`native/README.md`、`vendor/README.md`、`docs/architecture.md`、`docs/AGENTS.md` 等 link 把布局讲完，**不复制任何一方的正文**。

## 环节三：子树 AGENTS.md 是「合适个数」，不是每个目录一份

这是最容易照抄错的点。DSH 的子树 `AGENTS.md` 只出现在「该子树有专属常驻规则」的地方，tier taxonomy 点名的只有 `packages/`、`examples/`、`docs/`、`.agents/notes/`：

> Subtree `AGENTS.md` — Orders specific to that subtree. Does NOT belong there: repo-wide rules the root file already carries.

也就是说，子树 `AGENTS.md` 的判定标准是：**这里有没有「只在这个子树成立、且每轮都该在上下文里」的规则？** 有，才放；没有，就靠 README 按需加载。大多数 package 只有 `README.md`，没有 `AGENTS.md`——这不是偷懒，而是「合适个数」的正确结果。

## 环节四：AGENTS.md 串起 README.md，而不是吞掉它

分工是严格的：**`AGENTS.md` 是路由/常驻指令层，`README.md` 是「当前合同」事实层。** package README 的职责是 per-package contract——config、语义、限制、扩展点、Model Experience；它按任务加载，不进常驻上下文。`AGENTS.md` 通过 link 把它串进地图，agent 命中某个包才读它的 README。

> Package README — The per-package contract: config, semantics, limitations, extension points, and Model Experience.

## 为什么这就是好的渐进披露

四环节合起来，得到一个「常驻层极小、详情按需加载、host 无关、且有机械规则」的骨架：

1. **常驻层极小**：根 `AGENTS.md` ≤ 1600 词、子树 ≤ 600 词（`packages/AGENTS.md` ≤ 650）、`packages/README.md` ≤ 600 词，全部由 `verify-doc-budgets` 机械检查——「该进的进得来，不该进的进不来」。
2. **host 无关**：symlink 让不同 agent host 读同一份事实。
3. **「该放哪」有机器可查的规则**：tier taxonomy 说清哪种事实住哪层，`verify-md-links` 保证每条 link 真能走到。

## 可迁移要点

1. `CLAUDE.md` → `ln -s AGENTS.md`，永远只编辑真实文件。
2. 根 `AGENTS.md` 只写 standing orders + 布局 + 命令，每条一两行、link 到 home；其余（教程/故事/流程）一律不写。
3. 子树 `AGENTS.md` 只在「有子树专属常驻规则」时才放，宁可少放；多数目录/包只留 README。
4. `README.md` 是「当前合同」，被 `AGENTS.md` link 串起来、按任务加载。
5. 给「哪种事实住哪层」写一张 tier 表，并把常驻层的字数设个预算——这比「写很多文档」更能治「不糊涂」。

## 证据入口

- 入口链的机制来源：本目录 [`02-legibility-ownership.md`](./02-legibility-ownership.md)、[`08-step-by-step-guide.md`](./08-step-by-step-guide.md) Phase 1。
- [`../../docs/AGENTS.md`](../../docs/AGENTS.md)：tier taxonomy（root/subtree AGENTS.md、package README 的职责与禁区）与字数预算。
- [`../../AGENTS.md`](../../AGENTS.md)：根 standing orders + Repository layout 怎样 link 到各 README 与核心文档。
- [`../../docs/architecture.md`](../../docs/architecture.md)：从 AGENTS.md 进入的有序地图。
- [`../../docs/cookbook/adding-a-package.md`](../../docs/cookbook/adding-a-package.md)：package README 应写什么（contract 的范本）。
- 既有 FAQ 的相关面：[`04_root-entry-documentation`](../04_root-entry-documentation/answer.md)（根入口分流与预算）。
