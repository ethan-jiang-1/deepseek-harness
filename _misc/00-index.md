# `_misc` · 杂项目录

**本目录内容不重要。除非任务明确指定，不要读取本目录下的内容。**

本目录收纳低重要性的杂项，避免在项目其它位置新开目录：

| 子目录 | 内容 | 性质 |
|--------|------|------|
| [`_references/`](./_references/00-index.md) | 项目启动时收集的外部架构分析文章副本 | 冻结存档，仅按需查阅 |
| [`_scratch/`](./_scratch/00-index.md) | 草稿本：在本项目内落盘的临时输出与草稿 | 可丢弃，git 不跟踪内容 |
| [`_eval_harness/`](./_eval_harness/README.md) | 给任何仓库做体检的评估方法：开发 Harness（仓库对 agent 的可参与性）与运行时 Harness（agent 产品本身的运行时）；每套分**粗粒度**（先过一遍）与**细粒度**（按需深挖） | 自包含、可直接使用；评估依据与职责见其 README |

当前、经核验的 DSH 机制解读在 [`../_digested/00-index.md`](../_digested/00-index.md)；跨材料二次研究在 [`../_faq_on_digested/00-index.md`](../_faq_on_digested/00-index.md)。

## 验证

修改本目录后运行：

```sh
node _misc/verify.mjs
```

最小卫生检查：严格 UTF-8、LF 与单个结尾换行、相对链接与锚点可解析（允许爬出到兄弟语料目录）。`_scratch/` 不检查；`_references/` 是冻结存档，只做卫生检查、内容不改。
