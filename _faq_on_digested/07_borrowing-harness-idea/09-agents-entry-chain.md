# 09 · AGENTS.md 入口链：文件态骨架 + 会话态加载

## 先纠正一个隐含误解：入口链不是单态对象

前面 [`02`](./02-legibility-ownership.md) 讲了「一个事实一个 owner」和「渐进披露」，[`08`](./08-step-by-step-guide.md) 的 Phase 1 让你「写一份短的 AGENTS.md」。这一篇钉的是**入口链本身**——但这条链不是一件扁平的东西，它是**同一根链条的两种存在状态**：

| 状态 | 对象 | 链条长什么样 | 归属 | 对借用者的成本 |
|---|---|---|---|---|
| **文件态（静态）** | 磁盘上的文件 | `CLAUDE.md`（symlink）→ 根 `AGENTS.md` → 合适个数的子树 `AGENTS.md` → 各 `README.md` | [`04_root-entry-doc-design`](../04_root-entry-doc-design/answer.md)（地图怎么画） | 低：写短文件 + symlink + 预算；宿主自动加载让第一环不写代码就生效 |
| **会话态（动态）** | 活 session 里的上下文 | baseline push → touch-driven nested push → README pull → 预算/去重/回收 | [`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/answer.md)（跑起来怎么被消费） | 高：需要一个 `dsh-agent-instructions` 级别的加载插件 |

DSH 两种状态都做全了；普通项目可以先只做文件态。下面分开讲。

## 状态一 · 文件态（静态骨架）

```text
CLAUDE.md（symlink → 同目录 AGENTS.md，每目录只有一份真实文件）
  └─ 根 AGENTS.md（standing orders + 布局 + 命令，每条 link 到 home）
       ├─ 子树 AGENTS.md（只在「该子树有专属常驻规则」时才有，数量刻意克制）
       │    └─ 按需 link 到各 package README.md（当前合同的事实层）
       └─ docs/architecture.md（有序地图）、docs/AGENTS.md（文档 tier）
            cookbook/（怎么做）、.agents/notes/（为什么）
```

四个环节的分工，设计理由都在 04，这里只给结论：

1. **CLAUDE.md 是 symlink，不产生第二份事实**：不同 agent host 有不同入口文件名约定（Claude 类读 `CLAUDE.md`，其它读 `AGENTS.md`），但每个目录里事实只该有一份；symlink 让「改规则」只有一个动作、一个 home。→ 04 的[读者分流](../04_root-entry-doc-design/01-root-split-and-map.md)。
2. **根 AGENTS.md 只放 standing orders**：每轮都要在上下文里的规则，每条 1–3 行、链到 home；教程、故事、流程一律不写。→ 04 的[常驻层硬预算](../04_root-entry-doc-design/03-progressive-disclosure-as-cache.md)。
3. **子树 AGENTS.md 是「合适个数」**：只在「有子树专属常驻规则」时放，宁可少放；大多数 package 只有 README.md 是正确结果，不是缺口。→ 04 的 [tier 分工](../04_root-entry-doc-design/02-tier-routing-and-indexes.md)。
4. **AGENTS.md 串起 README.md，而不是吞掉它**：AGENTS 是路由/常驻指令层，README 是「当前合同」事实层；AGENTS 通过 link 把它串进地图。→ 04 的 tier taxonomy。

**文件态的可迁移结论**：这是「写文件」的工程，几乎零架构依赖——`CLAUDE.md` 直接 `ln -s AGENTS.md`，根文件只写 standing orders，子树只在必要时放，并给常驻层设字数预算。而且宿主自动加载（Claude Code 读 `CLAUDE.md`）意味着**第一环不写代码就免费生效**。这就是 [`08`](./08-step-by-step-guide.md) Phase 1 的完整内容。

## 状态二 · 会话态（运行时加载）

文件态是「地图」，会话态是「地图在活 session 里怎么被走」。DSH 的运行时把文件态变成三件机器执行的事（机制细节都在 05）：

- **注入（push）**：`dsh-agent-instructions` 在会话第一步注入根 AGENTS 链（baseline），模型触达更深目录后再注入子树 AGENTS（touch-driven nested）；有 `maxBytes` 预算、按 digest 去重。→ 05 的 [`01-runtime-injection.md`](../05_root-entry-doc-navigation/01-runtime-injection.md)。
- **导航（pull）**：不在注入链里的 README / catalog / skill 正文，由模型用 read/grep/glob 按需拉取；skill 只给摘要、正文按需不缓存。→ 05 的 [`02-on-demand-navigation.md`](../05_root-entry-doc-navigation/02-on-demand-navigation.md)。
- **回收（recycle）**：超预算由 token meter 度量、compaction 压缩回收，保留 tool-call/result 配对。→ 05 的 [`03-budget-and-guarantee.md`](../05_root-entry-doc-navigation/03-budget-and-guarantee.md)。

**会话态的可迁移结论**：这是「写加载插件」的工程，贵且 DSH 特有。普通项目不写这个也能受益——文件态 + 宿主自动加载已经覆盖了「不糊涂」的大头；会话态（触达才加载、预算去重、回收）是上下文吃紧或长任务时的增量。

## 迁移顺序：先文件态，后会话态

两种状态的成本差直接给出迁移顺序：

1. **先文件态**：写短 AGENTS.md、symlink、预算、tier 表——这是 [`08`](./08-step-by-step-guide.md) Phase 1，几乎零成本，收益立竿见影。
2. **后会话态**：确认组合压力（上下文爆炸、长任务活不下来）之后再考虑加载插件——这是 [`10`](./10-progressive-disclosure-pipeline.md) 的注入层。

只做文件态不是残缺：宿主自动加载让第一环免费；会话态是 DSH 把「按需」从写作纪律升级成运行时保证的那一步，普通项目按需取用。

## 证据入口

- 文件态（设计）：[`04_root-entry-doc-design`](../04_root-entry-doc-design/answer.md) 及其子章节
- 会话态（机制）：[`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/answer.md) 及其子章节
- 本目录的关联：[`02-legibility-ownership.md`](./02-legibility-ownership.md)、[`08-step-by-step-guide.md`](./08-step-by-step-guide.md) Phase 1、[`10-progressive-disclosure-pipeline.md`](./10-progressive-disclosure-pipeline.md)
- 源码：[`../../AGENTS.md`](../../AGENTS.md)、[`../../packages/context/agent-instructions/README.md`](../../packages/context/agent-instructions/README.md)
