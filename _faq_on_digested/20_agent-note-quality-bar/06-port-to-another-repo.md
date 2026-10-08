# 06 · 移植到别的仓库

**想自立门户时读这一页。** 哪些必须照抄，哪些可以自己发明。

## 前提

目录叫什么、放在 `.agents/notes/` 还是仓库根目录的 `notes/`，都不影响内容要求。要移植的是**制度**，不是路径前缀。

## 八条照抄

这八条与门禁无关，是制度本身。少了任何一条，剩下的就只是一个带状态的文件夹。

| # | 照抄什么 | 为什么它不能省 |
|---|---|---|
| 1 | **创建门槛**：只有当「未来维护者会犯的具体错误 + 代码与文档解释不了的非显然约束或真实取舍」同时存在时才写；机械与局部 UI 编辑豁免 | 没有门槛，第一年就会写满低价值记录 |
| 2 | **`## Alternatives considered` 强制**，且只能记录不能编造 | 这是整套制度防「重新开讼」的机制；没有它，Note 退化成变更摘要 |
| 3 | **`## Problem` 独立成文** | 读者是来找动机的；看不懂动机就等于没写 |
| 4 | **proposed / implemented 两套骨架分离**，implemented 只写现在时 | 混用会让未来计划伪装成当前事实 |
| 5 | **proposed → implemented 是正文改写**，不是移动文件 | 只改路径和状态行，等于把计划留在原地冒充交付 |
| 6 | **implemented 随事实保持 current，但决策反转必须另写一篇并互链** | 「更新事实」和「改写历史」是两件事，混淆任何一边都会失去可信度 |
| 7 | **新 Note 触发 supersession 检查** | 不做这一步，活动树会积压互相矛盾的决定，读者不知道哪篇算数 |
| 8 | **删除优先于归档**：篇幅小、纯机械、局部 UI 的记录不该占位置 | 归档不是垃圾场；能删就删 |

## 五条可以自己发明

DSH 特有的装载方式，小仓库完全可以不要：

| # | 可以省略什么 | 什么情况下可以省 |
|---|---|---|
| 1 | 六个固定类型 | 个人插件仓两三个就够；关键是**集合封闭**、门禁拒绝未知目录 |
| 2 | `proposed/` 状态 | 没有「先写提案再长成实现」的流程时，它就是空转 |
| 3 | 中英双语对侧 + `.i18n.yaml` + pairing 门禁 | 单语仓库整层删掉 |
| 4 | 归档的哈希 seal 与只追加清单 | 小仓库靠 code review 就够 |
| 5 | 门禁脚本本身 | 没有 CI 时，把上面八条写成一份 `notes/AGENTS.md` 常驻指令即可 |

省掉第 5 条时要清醒：**没有执行者的文字约定，遵从度会显著下降。** DSH 把可机械判断的部分做成 gate，正是因为它自己的 agent 遵循可执行检查远好于遵循文字约定（[`quality-gates` Note](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)）。小仓库的替代方案通常是**一条便宜的脚本**——检查头部三行、`## Problem` 开头、必备章节、目录是否在允许清单里。这几条恰好就是 DSH 门禁里最有价值的部分，实现不到一百行。

## 最小的可运行版本

一个插件仓要的完整形态大概是这样：

```text
notes/
├── AGENTS.md                 ← 常驻指令：上面八条，压到 30 行以内
├── implemented/
│   └── architecture/
│       └── 2026-01-15-tool-execution-seam.md
└── rejected/
    └── 2026-01-20-single-jsonrpc-transport.md
```

配一条 CI 检查（伪代码）：

```text
对 notes/**/*.md：
  前两行必须是 "# Agent Note: X" 和空行
  第三行必须是 "Status: implemented" 或 "Status: rejected — …"
  首个 ## 标题必须是 "## Problem"
  implemented 必须含 "## Decision"、"## Alternatives considered"、"## Consequences"
  目录名必须在允许清单里
  文件名必须匹配 yyyy-mm-dd-*.md
```

## 三个最容易抄错的点

1. **只抄目录结构，不抄 `Alternatives considered` 强制。** 结果是一个带状态的文件柜，失去了防止重新开讼的能力——这是唯一一个「省了就白做」的条目。
2. **归档流程照抄，但创建门槛放水。** 结果是活动树被低价值记录填满，归档从例外变成常态运维。**先立门槛，再谈归档。**
3. **把「非平凡变更必须写 Note」当作规则。** 这是 2026-09-17 已被上游收窄的旧标准。照它执行会为每个行为变更机械建档——DSH 自己就是从这个状态退回来的。

## 一个判断标准

移植成功的标志不是「目录建起来了」，而是**半年后你还能靠一篇 Note 阻止一次重复讨论**。

如果半年里没有任何一条被新 Note 取代、也没有任何一条被引用，那说明要么门槛太松（写的都是没用的），要么门槛太紧（真正需要的没写）。

## 证据入口

- [`_dsh_plugin_agent_ready_development/repo-harness/09-plugin-author-entry.md`](../../_dsh_plugin_agent_ready_development/repo-harness/09-plugin-author-entry.md)：DSH 明确说明插件仓**不继承**它的目录拓扑、gates 与发布制度；可迁移的是原则。
- [`.agents/notes/README.md`](../../.agents/notes/README.md)：八条照抄项的原文依据。
- [`_faq_on_digested/19`](../19_dsh-native-development-process/answer.md)：DSH 原生开发流程里各层载体的落位；移植时它会告诉你哪些环节是**必须保留的机制**、哪些只是 DSH 自己的装载方式。
