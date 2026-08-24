# `_digested` — DeepSeek Harness 源码消化

这个目录是对 DeepSeek Harness 源码的**消化分析**：从 TypeScript 源码出发，理解机制、架构和设计意图。它不是用户指南，也不是给 upstream 的补丁。

> **产品源码审计基线**：DeepSeek Harness `0.1.1-rc.1`，commit `528c682e061696f5a160f363f236ecbf53cbd006`。每次同步产品源码后，在 [`_change_log/`](./_change_log/00-index.md) 记录范围，并按 [`_coverage/`](./_coverage/00-index.md) 逐专题复核。最近一次合入见 [`_change_log/0002-0.1.0-rc.7-to-0.1.1-rc.1.md`](./_change_log/0002-0.1.0-rc.7-to-0.1.1-rc.1.md)。

`_digested/` 面向已熟悉 agent harness / plugin 运行时，但尚未建立 DeepSeek Harness 概念体系的读者。这里先抓住思想主轴，再进入源码机制——而不是把 `packages/` 目录平铺成分类货架。

每个专题的 `00-map.md` 是按主干顺序阅读的**概念导读**，只建立职责、关系和阅读入口；同目录编号正文是按问题查找的**机制参考**，记录状态对象、算法、失败行为和源码入口。图放在该专题的 `figures/`。

文件不叫 `README.md`：仓库的 bilingual pairing 门禁会把任意 `README.md` 当成产品文档语料。研究目录用 `00-index.md` / `00-map.md`。

## 分支纪律

| 分支 | 上面有什么 |
|------|------------|
| `master` | 干净的 upstream 镜像。不放研究材料，不改产品代码。 |
| `ethan` | 研究分支。源码随 `upstream/master` merge 进来；研究材料位于 `_digested/`、`_faq_on_digested/` 和 `_architecture_referenced/`。 |

同步方式：在 `ethan` 上非快进 merge `upstream/master`，让产品源码对齐新基线并保留研究目录，再按 `_change_log/` 审计过期结论。

## 与同级目录的关系

| 目录 | 本质 | 受众 |
|------|------|------|
| **`_digested/`** | 源码消化，机制剖析 | 想彻底搞懂背后发生了什么的人 |
| `_faq_on_digested/` | 跨消化材料的二次研究 | 我自己（产出者） |
| `_architecture_referenced/` | 外部架构材料的本地参考副本 | 需要对照其它分析的人 |

本仓库不另做用户手册。官方怎么用、怎么扩展，仍读 `docs/` 和 package README。

## 子目录

专题按 **Harness 自己的主轴** 切，不按 OpenSpec 的 schema / CLI workflow 切。

| 目录 | 聚焦 | 一句话 |
|------|------|--------|
| `system/` | 总体系统专题 | everything-is-a-plugin、组合层、循环、seam、扩展点怎么拼成一台运行中的 `dsh` |
| `cordis-runtime/` | 被 vendor 的框架 | `ctx` / plugin / effect / event / waterfall / fiber / Loader |
| `composition/` | 启动组合 | profile、bundle、patch 层、Harness home、`dsh --dump-config` |
| `session-and-loop/` | 会话与驱动 | session log、turn/step、agent-loop、model-visible ⟺ logged、agent scope |
| `capability-seams/` | 可替换能力 | Service Definition / Provider / Consumer 三角色，以及如何组合一致的 fs / subprocess provider |
| `tools-prompt-llm/` | 模型可见面 | tool registry、system prompt 组装、LLM adapter、tool 执行瀑布 |
| `surfaces/` | 人对机器的入口 | CLI、Web host/client、ACP、JSON-RPC SDK |
| `spec-driven-development/` | 开发流程 | Agent Note 生命周期、Issue/PR policy、Plan Mode、门禁、pre-push、review、stacked PR 与文档/翻译纪律 |
| `_coverage/` | 覆盖矩阵 | 维护用索引，按源码组追踪 digest 覆盖状态 |
| `harness-idea/` | 消化后的理解与判断 | dsh 作为 harness 做对了什么：插件图 + 事件流构成的运行时基底、可读性与正确路径、参与阶梯、动态可读性、技术选型与语言贴合、边界与成本，以及本专题自身的判断纪律 |
| `_change_log/` | 上游同步记录 | 每次 upstream 合入后的变更摘要与资料审计 |

## 阅读路径

![消化阅读主干](./figures/topics.svg)

- **熟悉 agent / plugin 运行时，但不熟 dsh** → `system/00-map.md`
- **想先搞懂 Cordis 在这棵树里到底是什么** → `cordis-runtime/00-map.md`，官方入门仍是 [`docs/cordis-primer.md`](../docs/cordis-primer.md)
- **想搞懂一次 `dsh --profile web` 怎么变成插件树** → `composition/00-map.md`
- **想搞懂一轮对话怎么跑** → `session-and-loop/00-map.md`
- **想加能力或换后端** → `capability-seams/00-map.md`
- **想搞懂模型看见什么** → `tools-prompt-llm/00-map.md`
- **想搞懂 CLI / Web / ACP 怎么复用同一套 runtime spine** → `surfaces/00-map.md`
- **想搞懂 DSH 如何被修改、spec/开发流程怎么走** → `spec-driven-development/00-map.md`
- **想搞懂 dsh 为什么对读者友好（harness 思想）** → `harness-idea/00-map.md`

推荐主干顺序：

```text
system/
  → cordis-runtime/
  → composition/
  → session-and-loop/
  → capability-seams/ 或 tools-prompt-llm/
  → surfaces/
  → spec-driven-development/
```

按推荐顺序读 `00-map.md`，遇到具体机制再进入编号正文。专题承诺的核验范围以 [`_coverage/00-index.md`](./_coverage/00-index.md) 为准；未列问题不隐含完整覆盖。跨专题研究放在 `_faq_on_digested/`。

## 验证

修改本目录后运行：

```sh
node _digested/verify.mjs
```

该检查验证 Markdown / SVG / 校验脚本的严格 UTF-8 与单个结尾换行、Markdown 相对链接和锚点，以及 SVG 的 XML 结构与实体。
