# `_misc/_references` · 外部架构材料的本地参考副本

本目录收藏**别人写的**架构分析文章副本，供对照其它视角时使用。它们不是本仓库的消化产物，不随上游同步做版本审计；每份描述的 DSH 版本以该文自身的 pin 为准，没有 pin 的按「写作时点的快照」读，不当作当前事实。

| 文件 | 来源与性质 | 描述的 DSH 版本 |
|------|------------|----------------|
| [`Google/original-5-patterns.md`](./Google/original-5-patterns.md) | 外部作者（Saboo R. X 帖）的「5 patterns」式分析，2026-08 存档 | 无版本 pin——读作写作时点快照，机制名勿对当前源码 |
| [`lencx/DSH架构解析.md`](./lencx/DSH架构解析.md) | lencx（WeChat 文章）对 DSH 架构的解析 | 钉 DSH commit `47f9438`（文内自注） |
| [`lencx/lencx-dsh.md`](./lencx/lencx-dsh.md) | lencx 的 PDF 演讲稿 | 钉 `dsh-v0.1.1-rc.1` |
| [`LM_harness/Harness_Compositional_Generalization_详解.md`](./LM_harness/Harness_Compositional_Generalization_详解.md) | Harness 论文深读（**与 DSH 无关**：全文无 deepseek/DSH 内容，留作 compositional-generalization 视角参考） | — |
| [`ruofei/ruofei.md`](./ruofei/ruofei.md) | ruofei 的 DSH 分析 | 钉 `dsh-v0.1.2-alpha.2`（`0a53fb55be`） |
| [`shixiang/sx_DeepSeek Harness 是自进化 Agent 的基石.md`](./shixiang/sx_DeepSeek%20Harness%20是自进化%20Agent%20的基石.md) | shixiang 的 DSH 评论 | 无版本 pin——读作写作时点快照 |

使用纪律：

1. 本目录内容**冻结**：不修改外部文章正文，不向上游同步看齐；需要补充视角时另开文件。
2. 版本差异以 `_digested/_change_log/` 为对照——文中与当前源码（基线 `dsh-v0.1.7-rc.1`，`46a7f68b09`）不符的机制描述是**历史快照**，不是错误。
3. 当前、经核验的 DSH 机制解读在 [`../../_digested/00-index.md`](../../_digested/00-index.md)；跨材料二次研究在 [`../../_faq_on_digested/00-index.md`](../../_faq_on_digested/00-index.md)。
4. 文件名不叫 `README.md`（仓库 bilingual pairing 门禁会把任意 `README.md` 当产品文档语料），本目录自身无 verify 脚本——它不在三语料门禁范围内。
