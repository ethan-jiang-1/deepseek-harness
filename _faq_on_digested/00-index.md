# FAQ on Digested · 基于消化材料的二次研究

这个目录不是面向学习者的 FAQ（那些以后会写在 `_digested/` 各专题里）。这里的每一个问题是我们在阅读消化材料、翻源码的过程中**自己产生的困惑**，答案需要跨越多个 `_digested/` 条目、甚至结合源码才能综合出来。

简单说：**一子目录 = 一个探究过的问题，答案是自己综合出来的，不是从某一份材料里直接抄的。**

> **当前研究基线**：涉及运行时行为的结论以 DeepSeek Harness `0.1.0-rc.5`（`47f943859bef60e4160492346772ded9b24f765a`）为准；旧 checkout 只用于变更史，不能替代当前源码验证。

文件不叫 `README.md`：仓库的 bilingual pairing 门禁会把任意 `README.md` 当成产品文档语料。

## 和 `_digested/` 内置 FAQ 的区别

| | `_digested/` 内 FAQ | `_faq_on_digested/` |
|---|---|---|
| 读者 | 学习者 | 我自己（产出者） |
| 答案来源 | 单一消化材料的整理 | 跨多份消化材料 + 源码的综合推断 |
| 本质 | 文档的一部分 | 研究过程的归档 |

## 目录结构

```text
_faq_on_digested/
├── 00-index.md            # 你正在看的文件
├── <NN>_<question-slug>/  # 一个问题 = 一个子目录
│   ├── question.md        # 问题描述 + 背景
│   └── answer.md          # 答案 / 分析 / 结论
```

子目录内自由组织。可以是 `question.md` + `answer.md` 两张，也可以合在一起，也可以带代码示例。关键是**引用来源要标注清楚**。

## 命名约定

子目录用英文 slug，简短描述问题主题，例如：

- `plugin-vs-bundle/`
- `loop-swap-radius/`
- `model-visible-equals-logged/`

`NN_` 数字前缀按创建时间排序（01 最早），方便了解问题是按什么次序产生和探究的。

## 已有问题

（还没有单独开题。主干七个专题的机制级正文已经写完；跨条目的困惑出现后再按上面的结构建子目录。）

## 引用规范

引用 `_digested/` 时用相对路径：

```markdown
../_digested/system/00-map.md
../_digested/session-and-loop/00-map.md
```

引用源码时标注 commit hash，避免链接随时间失效。

引用官方文档用仓库内相对路径，不要把 `docs/` 的正文抄进答案里充数。

## 一个子目录该长什么样

- **问题要明确** — 不是「Harness 是怎么工作的」，而是「换掉 `dsh-agent-loop` 而不换 `dsh-agent` 时，Web UI 还能否从 `session/event` 渲染完整一轮 turn？」
- **答案要综合** — 至少引用到 2 份不同的消化材料，或 1 份消化材料 + 源码
- **不追求完备** — 回答自己当时的困惑就够了，不全覆盖，不是百科全书
