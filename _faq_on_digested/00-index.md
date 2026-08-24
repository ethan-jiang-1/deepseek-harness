# FAQ on Digested · 基于消化材料的二次研究

这个目录不是面向学习者的 FAQ（那些以后会写在 `_digested/` 各专题里）。这里的每一个问题是我们在阅读消化材料、翻源码的过程中**自己产生的困惑**，答案需要跨越多个 `_digested/` 条目、甚至结合源码才能综合出来。

简单说：**一子目录 = 一个探究过的问题，答案是自己综合出来的，不是从某一份材料里直接抄的。**

> **当前研究基线**：涉及运行时行为的结论以 DeepSeek Harness `0.1.1-rc.1`（`528c682e061696f5a160f363f236ecbf53cbd006`）为准；旧 checkout 只用于变更史，不能替代当前源码验证。

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

| 编号 | 问题 | 主回答 |
|------|------|--------|
| 01 | [DSH 的目录为什么这样组织，应该怎样读？](./01_repository-organization/question.md) | [目录设计总模型](./01_repository-organization/answer.md) |
| 02 | [DSH 所谓 Spec-Driven Development 大概怎样运作？](./02_spec-driven-development/question.md) | [分层规格、生命周期与可执行验收](./02_spec-driven-development/answer.md) |
| 03 | [多个模型 vendor 应怎样接入 DSH？](./03_model-vendors/question.md) | [配置、adapter 与自动路由的选择](./03_model-vendors/answer.md) |
| 04 | [DSH 根入口文档的静态设计：这张地图是怎么画出来的？](./04_root-entry-doc-design/question.md) | [根入口分流、tier 路由、预算门禁与可迁移原则](./04_root-entry-doc-design/answer.md) |
| 05 | [DSH 跑起来之后，根入口文档是怎么被消费的？](./05_root-entry-doc-navigation/question.md) | [指令注入、工具导航、按需加载与运行时预算](./05_root-entry-doc-navigation/answer.md) |
| 06 | [DSH 修改系统的完整 SPEC 路径是什么？](./06_spec-change-path/question.md) | [docs 是当前合同层；Issue / Note / Plan / 实现 / 合同 / 行为 / implemented Note / review 的主路径与强制边界](./06_spec-change-path/answer.md) |
| 07 | [另一个项目想借鉴 DSH 的 Harness 思路，尤其 coding agent 怎么探索、理解项目而不糊涂、不乱发挥，可迁移的东西是什么？](./07_borrowing-harness-idea/question.md) | [把「糊涂/乱发挥」拆成知识外置、正确路径、可执行反馈三条腿；按优先级迁移，并给一步一步落地路径](./07_borrowing-harness-idea/answer.md) |

## 引用规范

引用 `_digested/` 时用相对路径：

```markdown
../_digested/system/00-map.md
../_digested/session-and-loop/00-map.md
```

引用源码时标注 commit hash，避免链接随时间失效。

引用官方文档用仓库内相对路径，不要把 `docs/` 的正文抄进答案里充数。

## 验证

修改本目录后运行：

```sh
node _faq_on_digested/verify.mjs
```

它检查严格 UTF-8、LF 换行与单个结尾换行、相对链接和锚点。兼容三种历史引用写法：`file.md:47` 行号后缀、仓库根视角裸路径（`docs/…`）、从 DSH 文档摘录的 `docs/` 内裸链接；`node_modules` 内与仓库外的引用降级为警告，不判失败。

数字类事实的新鲜度与基线同步复核仍是人工步骤：上游合入后，按 `_digested/_change_log/` 复核各 answer/research 的节名与数字，不把「当前 checkout」当成新基线。

## 一个子目录该长什么样

- **问题要明确** — 不是「Harness 是怎么工作的」，而是「换掉 `dsh-agent-loop` 而不换 `dsh-agent` 时，Web UI 还能否从 `session/event` 渲染完整一轮 turn？」
- **答案要综合** — 至少引用到 2 份不同的消化材料，或 1 份消化材料 + 源码
- **不追求完备** — 回答自己当时的困惑就够了，不全覆盖，不是百科全书
