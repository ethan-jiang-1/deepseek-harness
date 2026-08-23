# 判断纪律：本专题自己的知识从哪来，凭什么可信

## 问题

本专题主张「关键规则要下沉到可执行层」，但它自己主要是 prose。`_digested/verify.mjs` 只查链接、UTF-8 与 SVG 结构，不查判断真伪。所以本专题需要一套替代纪律，并且要诚实说明它的边界。

## 基线

全部判断对照 DeepSeek Harness `0.1.1-rc.1`，commit `528c682e061696f5a160f363f236ecbf53cbd006`。上游同步后，按 `_change_log/` 复核本专题证据锚点；外部技术分享只作背景，不进入证据，事实仍以本基线为准。

## 出处分级

每条判断必须能归入其中一类：

| 标记 | 含义 | 可信度 | 用法 |
|------|------|--------|------|
| `[原文]` | Agent Note / AGENTS.md / 官方文档的直接陈述 | 高 | 可以引用为事实，但「原文说的是什么」与「我们推出的结论」必须分开 |
| `[源码]` | 从 `528c682e` 源码或生成物核对过的事实 | 高 | 可作为机制事实 |
| `[推断]` | 从事实推出的解释或因果 | 中 | 必须能指出让它变假的观察 |
| `[框架]` | 不依赖 dsh 的通式（paved road、知识外置） | 低 | 只提供结构，压缩使用，不得冒充 dsh 发现 |
| `[外部观点]` | 来自 lencx 等外部分析的判断框架 | 中低 | 先当假设，再回源码核；跨项目结论不直接引入 |

「可信度低」不等于「没价值」：框架提供组织，外部观点提供不同坐标。但它必须被标注，否则会污染出处。

## 分布模型：不是二值，而是三个轴

任何把知识只分成「LM 分布内 / 外」两格的模型都太粗。更准确的判断要问三个问题：

1. **生成上下文是什么？** 裸模型 / 只给 repo 路径 / 给了完整 repo 与检索工具 / 人类给了假设。同一个事实在不同上下文里的可生成性完全不同。
2. **它来自哪里？** 训练先验 / 仓库证据 / 人类播种 / 模型推断。
3. **它被核对到什么状态？** 未验证 / 已对源码 / 已被独立来源交叉验证 / 可被机器检查。

所以「fresh agent 会不会写」只测**新颖性**，不测**正确性**。真正的风险有三种，不是一种：

- **具体幻觉**：编造一个分布外但假的细节（最有欺骗性，因为看起来最有信息量）；
- **回归通式**：把 dsh 特有机制磨成「知识外置、paved road」之类的正确废话；
- **出处洗钱**：人类播种的洞察被模型复述后，出处丢失，变成「模型自己发现的」。

## 反事实标记的操作化

写判断时不再只自问一句，而是问三档：

1. **裸模型档**：一个没有任何仓库上下文的 fresh agent 会不会自然写出这句？会 → 是通式，标注 `[框架]`，压缩。
2. **检索档**：给 fresh agent 仓库路径和检索工具，它能否在合理时间内从一手材料找到同一句？能 → 这是可检索事实，价值在整理，出处必须可点。
3. **播种档**：只有人类先给了某个假设或异常点，agent 才找得到？能 → 这是 human-seeded insight，标 `[推断]` 或 `[外部观点]`，并记录播种来源。

「哪几句是 fresh agent 写不出来的」仍然有用，但它只是信息量的一个近似，不是真值标签。

## 分布外知识的搬运通道

分布外知识不能幻想生成；但也不只有「读证据」和「人类播种」两条。可用的通道有：

1. **检索搬运**：从 note / 源码 / 生成目录挖原文，而不是凭记忆复述；
2. **三角核验**：至少两种独立来源（note + 源码，或生成目录 + 测试）才写 `[源码]` 级事实；
3. **人类播种**：人先给假设、问题清单、异常点，agent 去查证；
4. **负证据**：记录「我查了 X，没有发现 Y」，防止沉默变成默认成立；
5. **可执行事实**：数字型 claim（note 数、gate 数、包数）应由脚本或 `git ls-tree` 生成核对，不允许手写固定总数；
6. **消融**：删掉全部 dsh 专名后段落仍成立，说明该段主要是通式；
7. **独立复现**：用另一份无上下文 prompt 做对照生成，或用只有 repo 路径的 agent 做检索对照；
8. **可证伪性**：每条 `[推断]` 都能回答「哪份文件改掉后这句话变假」。

dsh 自己就是这么做的：Agent Notes 是外部记忆，generated catalogs 是检索索引，invariants/gates 是运行时验证，rejected notes 是负样本，archive 是遗忘策略，skills 是程序化判断。本专题应当吃自己的药。

## 核心 claim register

本页维护本专题最重要的 claim；每次修改正文时同步更新。

| id | claim | 状态 | 主要证据 | 什么会证伪它 |
|----|-------|------|----------|--------------|
| C1 | 可参与性 = 参与规则被字面外置并可执行的程度 | `[框架]` | 本文框架 | 找到一个规则大量在人脑但 agent 仍稳定做对的系统 |
| C2 | dsh 的基底是插件图 + 事件流，loop 位于两者之间 | `[源码]` | [`docs/architecture.md`](../../docs/architecture.md) · [`2026-07-05-reconstructable-requests`](../../.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md) | 源码显示 loop 不写日志或直接构造应用状态 |
| C3 | quality-gates note 自称开发主力是 coding agent，并选择 gates over prose | `[原文]` | [`2026-06-11-quality-gates`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md) | 原文被修改或归档且不再指向当前门禁 |
| C4 | 没有部落知识通道 → 知识必须外置 | `[推断]` | 本文因果节 | 找到同时期、同压力、但知识未外置的纯 agent 仓库 |
| C5 | 「推荐用 agent 探索」是事后注脚 | `[推断]` | architecture 原文 + quality-gates note 的时间先后 | 找到更早的官方设计记录把 agent 读者当作源头 |
| C6 | 门禁与 invariant 让关键规则可执行 | `[源码]` | `scripts/run-gates.ts` · invariant 源码 | 关键规则存在且长期只有 prose、无红灯 |
| C7 | 正确路径分四层：patch / 扩展点 / seam / loop | `[推断]` | [`docs/architecture.md`](../../docs/architecture.md) · [`extension-cookbook`](../../docs/cookbook/extension-cookbook.md) · [`AGENTS.md`](../../AGENTS.md) | dsh 官方或源码显示某层参与不成立 |
| C8 | pnpm note 明确把生态熟悉度作为 package manager 选型理由 | `[原文]` | [`2026-06-16-pnpm-over-yarn`](../../.agents/notes/implemented/process/2026-06-16-pnpm-over-yarn.md) | pnpm note 被修订，删除了 agent 生态熟悉度作为理由 |
| C9 | dsh 形状的性价比由组合压力决定 | `[推断]` | [`docs/architecture.md`](../../docs/architecture.md) · [`docs/capability-seams.md`](../../docs/capability-seams.md) | 低组合压力场景下 dsh 形状仍被证明普遍更划算 |
| C10 | 本专题的可执行化做到 prose + 出处 + claims.json 的路径与数字检查 | `[源码]` | 本专题 verify 脚本 · claims.json | 本专题加入更多机器可核验 claim 后需更新 |

## 自我适用：用三个问题检验本专题

1. **规则在哪层？** 本专题的判断主体仍落在第二层（prose），但最小第三层已经存在：`_digested/verify.mjs` 读取 [`claims.json`](./claims.json)，检查 baseline、每个 claim 的证据路径存在，并用 `git ls-tree` / `git show` 重新计算 note 文件数与扩展表行数。它仍不判断 claim 语义真伪——诚实边界在这里。
2. **正确路径与错误路径的摩擦差多少？** 每条判断带出处标记：`[原文]` / `[源码]` 与 `[推断]` / `[框架]` / `[外部观点]` 分开。「说不出从哪挖出来的判断」因此变得显眼——这是本专题自己的 paved road。
3. **错误何时被发现？** 上游同步时按 `_change_log/` 复核（基线变了会牵动证据锚点），以及每次人读时。没有机器帮本专题抓错——诚实地说，这就是第二层载体的处境，也是第三层载体更值得向往的原因。

## 结论

判断一篇消化材料有没有价值，问的不是「写得漂不漂亮」，是「哪几句是 fresh agent 写不出来的，并且它们经得起复核」。分布之外的知识不能幻想写出来；它只能通过检索搬运、人类播种、三角核验和可执行检查进入文本。本专题目前做到的是**出处可追、状态可分、数字与路径可机器核对**；还做不到的是**判断语义真伪的自动验证**——后者仍由人读与上游同步复核承担。

## 证据入口（DSH 官方）

- [`../../AGENTS.md`](../../AGENTS.md)（standing orders：可机械检查的规则优先）
- [`docs/AGENTS.md`](../../docs/AGENTS.md)（第 38 行；当前状态散文与一个事实一个家）
- [`docs/glossary.md`](../../docs/glossary.md)（第 5 行；一词一义）
- [`../../.agents/notes/README.md`](../../.agents/notes/README.md)（Agent Note 生命周期与格式）
- [`2026-07-19-package-invariant-runtime-contracts`](../../.agents/notes/implemented/architecture/2026-07-19-package-invariant-runtime-contracts.md)（第 24 行；空 invariant 的“显式结论”纪律）
- [`../../docs/testing.md`](../../docs/testing.md)（第 34 行；元验证与 snapshot 政策）

## 本专题内部产物（非 DSH 证据）

- [`./claims.json`](./claims.json)（机器核对路径与数字的 claim register）
