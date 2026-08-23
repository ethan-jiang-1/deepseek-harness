# Harness idea · dsh 作为 harness 的思想

## 一句话

dsh 做对的核心，不是「实现了一个聪明的 agent loop」，而是把**「如何正确参与」的知识从参与者的脑子里搬进了系统本身**。插件编写因此变成「读合同 + 照模板 + 过门禁」，而不是「懂行」。

本专题是 `_digested/` 里唯一**不回答机制、只回答判断**的专题：其它专题解释「机制是什么」，本篇解释「dsh 为什么对参与者友好」——为什么没有背景知识的人或 coding agent 容易读懂它，读懂了之后照着做就做对，而且这套道理与背后是不是 LLM 无关。本篇不进入 `_coverage/` 核验矩阵：它不追踪源码事实，只记录消化后的理解。

## 为什么存在本专题

本专题源自一个观察：dsh 对没有背景知识的读者（尤其 coding agent）容易读懂，读懂了之后照着做就做对——「不懂技术也能写插件」这件事说明 harness 在某个地方做对了。这个观察值得单独成篇，有三个原因：

1. `_digested/` 其它专题回答「机制是什么」，默认读者已经决定要读懂 dsh；本专题回答「它为什么值得这样被读」，并把答案整理成**可迁移的判断**——可以用来检验任何 harness，不限于 dsh。
2. 答案与背后是不是 LLM 无关：它说的是知识外置（knowledge externalization），不是模型能力。把它从 LLM 语境中抽出来，才能成为 harness 设计的一般思想（见 [`04`](./04-intelligence-agnostic.md)）。
3. 判断需要与证据分离：每篇末尾的「证据入口」引用源码与文档，立场单独成文，便于被反驳和修正。

## 章节构思

构思顺序是「先立论点，再拆机制，再划边界，最后给反面」：

- **01 立论点**（[`01-harness-role.md`](./01-harness-role.md)）：harness 的职责是外置参与规则。没有这个定义，后面所有机制都没有归属。
- **02 拆「读懂」**（[`02-legibility.md`](./02-legibility.md)）：可读性来自六个机制，共同保证「全部参与知识都以字面形式存在」。回答问题的前半截：为什么 coding agent 容易读懂。
- **03 拆「做对」**（[`03-paved-road.md`](./03-paved-road.md)）：正确路径来自六个机制，共同保证「正确做法是阻力最小的路径」。回答问题的后半截：为什么读懂了就做对。
- **04 划边界**（[`04-intelligence-agnostic.md`](./04-intelligence-agnostic.md)）：把上述论证从 LLM 语境中抽离，检验「与智能无关」；同时划清本专题回答什么、不回答什么。
- **05 给反面**（[`05-participability-killers.md`](./05-participability-killers.md)）：用「什么会杀死可参与性」的对照清单收尾——反面让正面的主张可检验，也给出用三个问题检验任何 harness 的工具。

两篇「六个机制」是主体，04、05 是边界与检验；推荐顺序即构思顺序。

## 术语对照

本专题的重要术语首次出现时中英对照；官方定义以 [`docs/glossary.md`](../../docs/glossary.md) 为准，本表只收录本专题自己的判断性词汇。

| 中文 | English | 含义 |
|------|---------|------|
| 参与规则 | participation rules | harness 外置的「怎么参与」：挂点、挂法、生命周期、验证 |
| 合同面 | contract surface | 词汇、类型与事件、决策表、范本、门禁组成的字面知识层 |
| 知识外置 | knowledge externalization | 把参与知识从读者脑中搬进系统本身 |
| 部落知识 | tribal knowledge | 只存在于资深参与者脑中、未字面化的规则 |
| 可读性 | legibility | 无背景读者建立正确心智模型的成本 |
| 正确路径 | paved road / pit of success | 正确做法是阻力最小路径的性质 |
| 门禁 | gates | 把合同变成可执行检查的验证脚本 |
| 扩展表 | extension table | architecture.md 的「目标 → 机制」归属表 |
| 注册即效果 | registrations are effects | 贡献经 `ctx.effect` 注册、卸载自动撤销 |
| 失败大声 | fail loud | 误配置在最早可解析点报错，不静默跳过 |
| 一词一义 | one canonical term per concept | glossary 的术语纪律 |
| 一个事实一个家 | one home per fact | 文档 tier 的归属纪律 |
| 模型可见 ⟺ 已记录 | model-visible ⟺ logged | 请求可从 session log 重建的不变量 |

## 核心论点

![合同面：参与者只带识字，知识在系统里](./figures/contract-surface.svg)

参与一个 harness 需要两类知识：**系统外置的**（写在哪、怎么写、怎么验证）和**读者自带的**（背景、行话、部落知识）。dsh 的工程重心是让第一类尽可能多、第二类尽可能少：

1. **参与规则住在系统里，不在人脑里。** 有什么可挂的点、怎么挂、挂了发生什么、怎么知道挂对了——四问全部有字面答案：扩展表、合同类型、事件 map、门禁。
2. **合同是可执行的，不只是可读的。** 类型在编译期拒绝、门禁在提交前纠正、运行时 invariant 在请求发出时比对。正确性由系统证明，不由读者自觉。
3. **正确路径是唯一的路径。** 注册即效果、显式优于隐式、fail loud、范本即教科书——正确做法成为形状上唯一的路。

## 边界

| 本专题回答 | 本专题不回答 |
|------------|--------------|
| 为什么参与容易且正确 | 为什么值得参与（产品价值问题） |
| 知识门槛如何被移除 | 识字门槛如何被移除（教育问题） |
| 什么样的 harness 设计让 reader 能上手 | 具体机制是什么（各专题的 `00-map.md`） |

## 章节

| 文件 | 回答的问题 |
|------|-----------|
| [`01-harness-role.md`](./01-harness-role.md) | 框架与 harness 的差别；参与规则住在哪一层 |
| [`02-legibility.md`](./02-legibility.md) | 为什么没有背景知识的读者（尤其 coding agent）能读懂 dsh |
| [`03-paved-road.md`](./03-paved-road.md) | 为什么正确路径是阻力最小的路径 |
| [`04-intelligence-agnostic.md`](./04-intelligence-agnostic.md) | 为什么这套思想不依赖背后是不是 LLM |
| [`05-participability-killers.md`](./05-participability-killers.md) | 反面清单：哪些设计选择让 harness 退回部落知识 |

推荐顺序：`01` → `02` → `03` → `04` → `05`。每篇末尾列证据入口；判断与证据分离，判断是我消化后的立场，证据是源码与文档的引用。

## 我的判断

- **判断一：prose 是索引，执行才是保证。** dsh 的规则文档（`docs/`、`AGENTS.md`）写得克制，是因为每一条关键规则都有机器可执行的落点：`verify-export-jsdoc`、`verify-package-invariants`、`doc-typecheck`、coverage 门禁、运行时 invariant。文档负责「告诉你往哪看」，系统负责「证明你做对了」。
- **判断二：「模型可见 ⟺ 已记录」能成立，是因为它被写成了运行时检查。** `dsh-agent-loop/invariant` 在 loop 构建的每次 `llm/stream` 上独立重建请求并与日志比对，不一致直接 fail（机制见 [`03`](./03-paved-road.md)，源码在 `packages/core/agent-loop/src/invariant.ts`）。这条不变量如果只是文档里的劝告，一定会在某次重构中失效；它是检查，所以它活着。
- **判断三：LLM 读得懂 dsh 不是巧合，是设计目标。** `docs/architecture.md` 明说推荐用 agent 探索代码库，[`docs/AGENTS.md`](../../docs/AGENTS.md) 把根 `AGENTS.md` 定义为「agent 每个会话都需要在上下文里的规则」。文档的读者模型就是 agent。而「读懂了就做对」是知识外置的直接后果，不是 agent 能力带来的。

## 与其它专题的关系

- 机制总览：[`../system/00-map.md`](../system/00-map.md)（六层叠加、活插件图与耐久事件流）
- 参与规则的原语：[`../cordis-runtime/00-map.md`](../cordis-runtime/00-map.md)（五条原语、waterfall 合同）
- 组合与替换：[`../composition/00-map.md`](../composition/00-map.md)、[`../capability-seams/00-map.md`](../capability-seams/00-map.md)
- 会话与模型可见面：[`../session-and-loop/00-map.md`](../session-and-loop/00-map.md)、[`../tools-prompt-llm/00-map.md`](../tools-prompt-llm/00-map.md)
- 入口投影：[`../surfaces/00-map.md`](../surfaces/00-map.md)
- 二次研究（问题导向，非判断导向）：[`../../_faq_on_digested/00-index.md`](../../_faq_on_digested/00-index.md)
