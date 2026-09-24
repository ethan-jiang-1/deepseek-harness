# FAQ on Digested · 基于消化材料的二次研究

这个目录不是面向学习者的 FAQ（那些以后会写在 `_digested/` 各专题里）。这里的每一个问题是我们在阅读消化材料、翻源码的过程中**自己产生的困惑**，答案需要跨越多个 `_digested/` 条目、甚至结合源码才能综合出来。

简单说：**一子目录 = 一个探究过的问题，答案是自己综合出来的，不是从某一份材料里直接抄的。**

> **当前研究基线**：涉及运行时行为的结论以 DeepSeek Harness `dsh-v0.1.7-rc.1`（`46a7f68b0922371ce7144b668b90e377d8e799f4`）为准，与 `_digested/` 同一基线。旧 checkout 只用于变更史，不能替代当前源码验证。各篇文件头声明的「源码核验基线」是该篇结论最后一次逐条对过的 commit；0006/0007 两轮同步已把全部篇目的声明推进到当前基线，正文里仍会出现旧 commit（例如 FAQ 08 方法段说明旧读数发生在哪个基线、FAQ 10/06 标注本仓库工作树 `9c18e3f216`），那些都是历史引用而不是未复核。FAQ 08 的 seam 计数曾按其写作时树（`3b1a213e9e`）声明为例外；0006 复核已按当前生成表重测（72 = 42 core + 29 seam + 1 bundle，可替换率 12/29 = 41.4%），并认定旧读数（28 条 / 39.3%）是 OLD 基线之前就存在的存量失真，见该 answer 的方法节。

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
| 08 | ["Everything is a plugin" 落到源码：哪些插件领域已饱和，哪里仍是缺口？（纯技术视角）](./08_plugin-seam-maturity/question.md) | [29 条 seam 的 P/C 全景表与可替换率 41.4%（72 = 42 core + 29 seam + 1 bundle，2026-09-16 按生成表实测）、三个被数字推翻的印象、按信号强度排序的缺口 backlog](./08_plugin-seam-maturity/answer.md) |
| 09 | [同一棵插件树对一个自用 owner（个人 / 小团队）的生产力在哪，怎样讲清楚？（自用生产力视角）](./09_plugin-business-ladder/question.md) | [敢放手 + 省手 + 可复用三层价值；自用 owner 最值的几类插件；L0–L3 参与阶梯；四个 owner 能自证的实验](./09_plugin-business-ladder/answer.md) |
| 10 | [一位烧了 10 亿 token 的用户给 DSH 的三条体感（快就是好 / 要自己改造 / 别用 Pro 多用 vision），在 harness 机制层面对得上什么？](./10_v4flash-user-notes/question.md) | [根本体验 = 一条体验皮（goal/plan）+ 三条根（日志基底 / 委派 spine / 组合层）；主篇展开 goal/plan 机制与"快而小模型为何优秀"的职责拆分论证](./10_v4flash-user-notes/answer.md) |
| 11 | [DSH 支持的开发习惯很多，但哪一种是它"最自然"的？为什么驾驭它写东西会感觉轻松？](./11_native-development-loop/question.md) | [窄证据切片闭环：六步马达 + "轻松"三来源（记忆外包 / 反馈秒级 / 原子回滚）；spec 感是闭环沉淀物而非上游输入；git 历史量化与运行时助推的三路独立验证](./11_native-development-loop/answer.md) |
| 12 | [dsh web 多开窗口卡住：第 4 个就卡，是启动有并发限制吗？](./12_dsh-web-stuck-windows/question.md) | [不是并发：rev 轮换 + 陈旧缓存 index → 动态模块全 404；修复 = index 加 `no-store`；附每次升级后手动重打补丁/重启/验证/回滚的完整 runbook](./12_dsh-web-stuck-windows/answer.md) |
| 13 | [一个"领域专家"DSH 插件，repo 应该怎样组织？](./13_expert-plugin-repo-organization/question.md) | [五个决策（入口/粒度/DSH 源码/UI 层/spec 流程）× 四个方案（pinned submodule / 树内 / 纯外部 / marketplace），推荐方案 A；共享开发过程（插拔/调试/驱动 agent）见 dev-loop.md，官方安装的保护见 dual-home-isolation.md，命名/标识的"身份 vs 皮肤"分层见 naming-and-identity.md，市场实证见 research.md](./13_expert-plugin-repo-organization/answer.md) |
| 14 | [DSH 有没有类似 Claude Code / Codex 的 hooks 机制？三家的 hooks 怎么比？](./14_hooks-vs-claude-code-codex/question.md) | [有，两层：原生拦截扩展点（typed Decision 插件面）+ CC/Codex 兼容桥（7/33 与 5/12 事件的 command 钩子子集）；三家按声明/事件/执行/控制力/审计五轴对照，桥的取舍是"兼容适配器不是力量工具"，外部读数留档 research.md](./14_hooks-vs-claude-code-codex/answer.md) |

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
