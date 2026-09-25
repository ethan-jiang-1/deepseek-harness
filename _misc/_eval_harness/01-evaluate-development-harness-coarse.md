# 开发 Harness 评估 · 粗粒度（coarse-grained；先过一遍）

**这份文档是什么。** 开发 Harness 评估的**粗粒度（coarse-grained）**一半：先用较小成本过一遍十七维，判断"值不值得投入、哪几维最痛"，回答一个问题：*一个不熟悉这个项目的 coding agent（或新人），进入这个仓库之后，能不能读懂、改对、验证、交付？* 评估对象是**仓库本身**——它的文件、命令、检查、惯例、协作面——不是团队里某个人的水平，也不是产品的架构。

**谁执行、谁读。** 评估由 coding agent 执行：它按本协议对目标仓库跑一遍，写出一份 Markdown 报告（第 6 节：评分卡（scorecard）、缺口清单（gap list）、切片走查（slice walkthrough）记录、三张清单，末尾列出需要人回答的问题；快诊（quick check）只出前三张表）。人读本文是为了理解判据；人读报告是为了复核证据、回答末尾的问题、决定下一步——**人不打分，也不填表**。

**前置知识。** 无。本文不假设你读过任何其它材料，术语在本页定义。文中出现的 DeepSeek Harness（DSH）只是**例证**：钉版在 commit `46a7f68b0922371ce7144b668b90e377d8e799f4`，用来指认"这件事在成熟仓库里长什么样"。本文只有 §1 一条带链接的原文引文；其余例证在 [02](./02-evaluate-development-harness-fine.md) 各卡不带链接的"例证（可选核对）"段落里——**不打开任何链接也能核对**。

**编号约定。** 维度用两字母前缀（知识归位 `KN` / 变更路径 `CP` / 证据与交付 `EV` / 状态与上下文 `ST` / 维护与发布 `MT`），探针（probe）用 `PB`，证据级（evidence level） `EL`，信息缺口（information gap） `IG`，成熟度档（maturity level） `MG`；完整对照见 [README 的标识符约定](./README.md#标识符约定token)。

**两份粒度。** 本文（`01`）是粗粒度（coarse-grained）：定义、两轴（two axes）、十七维粗判（coarse check）、报告格式与自检。**细粒度（fine-grained）**（[`02`](./02-evaluate-development-harness-fine.md)）才有每维的探针（probe）、锚点（anchor）与封顶规则（cap rules）——只在粗判（coarse check）为红、或要动的维度上翻它。**粗粒度（coarse-grained）定下来后基本不动，细粒度（fine-grained）会持续增补。**

**配套文档。** [运行时评估粗粒度（coarse-grained）](./11-evaluate-runtime-harness.md)（仅当这个仓库本身是 agent 产品时适用）· [细粒度（fine-grained）](./02-evaluate-development-harness-fine.md) · [从缺口到计划](./20-from-gaps-to-plan.md)

---

## 目录

- [0 · 怎么用](#0--怎么用)
- [1 · 什么是"仓库的开发 Harness"](#1--什么是仓库的开发-harness)
- [2 · 为什么不能自评：证据四级](#2--为什么不能自评证据四级)
- [3 · 评估分三层](#3--评估分三层)
- [4 · 十七维粗判（coarse check）](#4--十七维粗判coarse-check)
- [5 · 适用性（applicability）裁剪（tailoring）](#5--适用性applicability裁剪tailoring)
- [6 · 报告格式（agent 写，人读）](#6--报告格式agent-写人读)
- [7 · 报告交付前的自检](#7--报告交付前的自检)
- [8 · 短例](#8--短例)
- [附录 A · 术语表](#附录-a--术语表)
- [附录 B · 常见伪证（false evidence）清单](#附录-b--常见伪证false-evidence清单)

---

## 0 · 怎么用

### 两种模式

| | 快诊（quick check） | 全量 |
|---|---|---|
| 规模 | 一次 agent 会话：六维粗判（coarse check） + 一次 EV2 抽检 + 一次切片（slice） | 通常分多次 agent 会话：十七维粗判（coarse check） + 02 的全部 88 个探针（probe） + 第三层反证（falsification） + 一次切片（slice） + 完整报告 |
| 做哪些维 | 六维：KN1 入口链（Entry chain）、KN2 归属（One home per fact）、CP2 正确路径（Paved road）、EV1 反馈分层（Feedback layers）、EV3 闭环完整性（Delivery completeness）、ST1 静与动（Static and dynamic）；另抽检 EV2 | 全部十七维 |
| 做几层 | 第一层 + 第二层 | 第一、二层全做；第三层见 [02 §3](./02-evaluate-development-harness-fine.md#3--第三层反证falsification) |
| 档位从哪来 | 本文第 4 节的粗判（coarse check；粗判档（coarse grade）） | 粗判（coarse check）之后，按 [02](./02-evaluate-development-harness-fine.md) 逐维定档（final grade；定档（final grade）） |
| 报告 | 六行评分卡（scorecard） + EV2 抽检一行 + 缺口清单（gap list） + 切片走查（slice walkthrough）记录 + 需要人回答的问题 | 四张表齐全 + 需要人回答的问题 |
| 什么时候够 | 只想判断"值不值得投入" | 要拿这张清单排施工顺序（build order） |

快诊（quick check）的六维是十七维里**信息量最高的六个**：这六维里过半是红的（**红 = 该维的覆盖面（coverage）或约束力（enforcement） ≤ 1**），其余十一维基本不可能绿（**绿 = 两轴（two axes）都 ≥ 2**）。快诊（quick check）不能替代全量——它只告诉你"要不要往下做"。

**快诊（quick check）为什么要另抽检 EV2。** 六个维度里有 EV1（有没有检查）却没有 EV2（检查算不算数），而 EV2 是唯一检验其它维度真假的维度（见 [02 的 EV2 卡](./02-evaluate-development-harness-fine.md#ev2-负例控制--negative-control)）。抽检按第 4 节的三步给 EV2 粗判（coarse check）：任选一个现有检查，问"它最近一次为红是什么回归"——答不出，就命中 EV2 的约束力（enforcement）信号，而且这个检查本身只到 `EL2`（见第 2 节），这个仓库的绿灯可能不可信。再问"新检查必须做负例控制（negative control）"这条要求写在哪个文件——说不出，就命中 EV2 的覆盖面（coverage）信号，约束力（enforcement）按三级追问记 `0`。要给 EV2 定档（final grade），按 02 的 EV2 卡抽满三个检查。

### 铁律

**只有当场做过的才算证据。** 一个维度给 2 分以上（覆盖面（coverage）或约束力（enforcement）任一），必须能说出"我做了什么、看到了什么"。凡是只能说出"我们文档里写了"、"我记得有"、"应该是有的"，两个轴都按 `1` 档封顶（cap）——不记 2 分以上。

这条铁律不是形式主义。它针对的是评估最常见的失效模式：**把仓库自己的文档当成事实**。维护者读自己的文档会觉得哪哪都对；agent 读到"我们有严格的测试要求"，也容易照单全收。

### 拿不到的证据

agent 能直接看到的只有仓库和它有权访问的历史。先把"提问"换成"找痕迹"：`git log`、CI 历史、被 revert 的提交、注释里的 TODO/FIXME、README 的 Known Limitations。找不到痕迹、只有人知道的事实（"这条规则上次为什么改""我们当初为什么没做"），agent 不猜，写进报告末尾的[需要人回答的问题](#报告末尾--需要人回答的问题)。

**凡依赖 PR / issue / CI / 发布历史的维度都会系统性低估**：至少 KN3 决策记录（Decision records；理由可能只存在于会议里）、EV2 负例控制（Negative control；为红的历史可能在 CI 里）、CP1 意图入口（Work intake；工作项的原始描述常只在 issue 里）、EV4 评审与批准（Review and approval；批准过程多在 PR 里）、MT2 发布与版本纪律（Release and versioning；发布历史在 CI/包仓库里）——这五维的证据状态一律标"证据受限（evidence-limited）"，不要据缺失的证据扣分，也不要断言机制缺失。

### 产出

一份 Markdown 报告，由 agent 写，格式见[第 6 节](#6--报告格式agent-写人读)：

1. **评分卡（scorecard）**：十七行 × 两轴（two axes；覆盖面（coverage） / 约束力（enforcement））
2. **缺口清单（gap list）**：每条挂在一个**具体症状**上，不是抽象评价
3. **切片走查（slice walkthrough）记录**：一笔真实变更的六步走查
4. **三张清单**：打不开的链接 / 靠猜的 owner / 无证据的声称
5. **需要人回答的问题**：agent 拿不到、只有人知道的事实，写清影响哪一维哪一轴

---

## 1 · 什么是"仓库的开发 Harness"

> **Development harness（开发 Harness）**：一个仓库为了让参与者理解它、修改它、验证自己没改错而提供的全部机制的总和——规则文件、目录约定、决策记录（decision record）、任务流程、检查命令、CI、以及这些之间的链接关系。

一个仓库的**产品**是它交付给用户的东西；它的**开发 Harness** 是它交付给自己的东西。两者可以差距极大：一个产品极其精良的仓库，可能完全靠三个老员工脑子里的默契运转。

### 公理层：fresh agent 缺的七类信息

一个第一次进入这个仓库的编码代理，缺少的是七类**信息**（不是七种能力）：

| 缺口 | 它缺的那句话 | 缺了之后的症状 |
|---|---|---|
| **IG1 必须遵守什么** | 这里有哪些铁律？哪些事绝对不能做？ | 违反约定、绕过安全边界、破坏不变量（invariant） |
| **IG2 系统由什么组成** | 这个库有哪些部分，谁依赖谁，东西放哪？ | 抓不住主线，读散、读偏，文件放错地方 |
| **IG3 为什么这样设计** | 当初为什么选这条路？什么方案被否了？ | 重走已否定的路；把历史实现细节误当当前接口 |
| **IG4 改动落在哪里** | 这个需求应该改哪个机制？ | 在错误的地方插代码；自己发明一套新接法 |
| **IG5 这类任务按什么流程做** | 这类任务该按什么步骤？什么时候停？ | 从多份规则里重新拼流程，漏步骤 |
| **IG6 怎么算做对** | 什么证据能证明我没做错？ | 交付了没法验证的半成品；"全绿"但没人信 |
| **IG7 交付怎样算完整** | 实现、文档、证据要一起交吗？缺口如实说吗？ | 代码先合并、文档后补；声称的行为没有证据 |

**"糊涂"来自 IG1–IG3，"乱发挥"来自 IG4–IG5，"交付不可信"来自 IG6–IG7。** 三者性质不同：糊涂是"不知道"；乱发挥是"知道了也会做错"；交付不可信是"做错了没人拦，做对了也证明不了"。

### 一个关键反转

最容易犯的归因错误是：*DSH 之所以好，是因为给它干活的 agent 聪明。* 事实相反。DSH 自己的记录写的是：

> This codebase is developed primarily by coding agents. Agents follow enforced gates far more reliably than prose conventions.
>
> — DSH [`quality-gates` Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-06-11-quality-gates.md)

因果是反的：**因为干活的主力天然缺背景、会忘、会走捷径，仓库才被迫把成本结构整个反过来**——让"读对、改对"成为阻力最小的路径，让"读错、改错"在离错误源头最近的地方被机器拒绝。

所以评估的落点不是"我们的 agent 够不够聪明"，而是"**我们的仓库把正确路径修得比错误路径更省力了吗**"。

### 三条立场（十七维背后的同一个东西）

1. **参与者是一等公民。** 知识必须外置成可搜索、可检查的文件，而不是留在资深成员脑子里。
2. **规则要能被机器执行。** 写在贡献指南里靠自觉的规则，和接在检查里会拦人的规则，是两种东西。
3. **每类事实有唯一的 owner。** 一处一个权威，其余地方只放链接。一处事实两个家，早晚分叉。

十七维是这三条立场在具体机制上的展开。评估时如果某一维得分低，先问：它坏的是哪一条立场。

---

## 2 · 为什么不能自评：证据四级

同一个"我们有 X"，可以是四个完全不同的档位：

| 档 | 名称 | 判据 | 例子 |
|---|---|---|---|
| **EL0** | 只存在于人和口传 | 你问五个人，得到五种说法；或者根本没有 | "提交前记得跑一下那个脚本" |
| **EL1** | 写在 prose 里 | 有文件写了，但没有东西会因为你违反它而失败 | CONTRIBUTING.md 里的"请为所有新函数写测试" |
| **EL2** | 可核对 | 有一条命令或一个流程，跑/走一遍能得到确定的结论 | `make lint`；一份能照着走的 review checklist |
| **EL3** | 机器强制 + 负例控制（negative control） | 违规必然红，**并且证明过它会红** | 一个 gate；有人记得"这个检查上次为红是因为 XX 回归" |

**EL2 和 EL3 的差别是整份文档里最值钱的一条。** 一个从不失败的检查和一个不存在的检查，在"通过率"上完全一样，在保护效果上差别是全部。区分方法见 [02 的 EV2 负例控制（Negative control）](./02-evaluate-development-harness-fine.md#ev2-负例控制--negative-control)。

### 三级追问法

对任何一个"我们有"的说法，连问三次：

1. **在哪个文件？** → 说不出 = EL0
2. **跑哪条命令能验证？** → 说不出 = EL1
3. **它最近一次为红是什么时候、因为什么？** → 说不出 = EL2（不能记 EL3）

第三问是分水岭。它同时筛掉两种东西：从没被触发过的检查，和只在理论上存在的检查。

### 自评偏置的三种表现

- **文档即事实**：把"写了"当成"做到了"。文档描述的是意图，不是当前行为。
- **作者视角**：评估者知道东西在哪，所以觉得"很好找"。检验法是另开一个没有上下文的 agent 会话再走一遍。
- **例外隐身**：记得的是规程，忘的是"上次赶工期就没走"。切片走查（slice walkthrough；第 3 节第二层）专治这一条——它不看规程，看**最近这笔变更实际怎么做的**。

---

## 3 · 评估分三层

### 第一层 · 静态清点

按第 4 节的十七维逐维粗判（coarse check），每一维记两轴（two axes）的粗判档（coarse grade），并记下**一个最痛的真实案例**。

记录格式：`KN2 归属：覆盖面 2 / 约束力 1。案例：上周有人改了 CI 超时，改了 .github 里那份，但 CONTRIBUTING 里那份没动，两边差了两周没人发现。`

**案例是扣分的佐证，不是扣分的前置条件。** 说不出具体案例时，仍按当场看到的证据给分，并把这维的证据状态标为"证据受限（evidence-limited）"；不要把"没听到事故"当成"机制存在"。

### 第二层 · 垂直切片（vertical slice）

挑**最近完成的一笔真实变更**（修 bug 或小功能，不动核心架构），按六步走一遍。每一步只问一件事：**它留下了什么可以事后核对的痕迹？**

| 步 | 走查问题 | 痕迹在哪 |
|---|---|---|
| 1 **核对现场** | 这笔变更基于哪个 revision？谁能确认？ | 提交/PR 的 base；分支从哪来 |
| 2 **判定窄 diff** | 这次真正触达的行为面是什么？范围是怎么定出来的？ | diff 本身；commit message；PR 描述 |
| 3 **改 owner 面** | 改的是源头还是派生（derived）？有没有同一事实的另一份拷贝也该改？ | diff 里有没有生成物（generated artifact）被手改、有没有双份文件只改一边 |
| 4 **最小匹配证据** | 哪条检查会**因为这次回归而失败**？ | 测试/检查文件；回滚实现保留测试跑一次（红灯对照 revert check） |
| 5 **沉淀** | 这笔变更产生的新判断去哪了？ | 决策记录（decision record） / gate / 什么都没有（什么都没有也可能是对的） |
| 6 **只报告跑过的** | 交付说明里声称的验证，和实际跑过的对得上吗？ | PR 描述 vs CI 记录 |

第 4 步的**红灯对照（revert check）**是切片（slice）里唯一能区分"测试真的钉住了行为"与"测试只是存在"的一步：把实现回滚、保留新增的测试或检查，跑一次，看它红不红。

- 红了 → 这个证据是真的。
- 绿着 → 这个测试没在测它以为在测的东西。这是本轮评估里价值最高的一次发现。

六步走完，再补问**五个问题**（结果记在表 3 的"五问补充"）：

1. 这笔变更的用户可观察结果是什么？写得出两行"外部结果 + 如何观察"吗？
2. 从任务描述出发，能不能一路找到改动位置的 owner（不靠当时作者带路）？
3. 交付里有没有携带持久取舍？有的话它记在哪里？没有的话，理由说得出吗？
4. 哪项证据会在旧行为上失败？（就是上面那次红灯对照 revert check）
5. 每一步标注证据状态：**能指出文件的 / 只有口头说法的 / 完全没有的**。

### 第三层（细粒度 fine-grained）

第三层的反证（falsification）四动作（抽检一个检查、一条规则、一个链接、一次"应该失败"）见 [02 §3](./02-evaluate-development-harness-fine.md#3--第三层反证falsification)。粗粒度（coarse-grained）只到第二层：**清点 → 切片（slice）**；反证（falsification）是给"要动的维度"用的。

---

## 4 · 十七维粗判（coarse check）

### 两轴（two axes）怎么打

每一维记**两个**档，因为"有"和"硬"是两件正交的事。

**轴一 · 覆盖面（coverage）** —— 这一维有没有家

| 档 | 判据 |
|---|---|
| 0 | 没有。没有任何文件、目录、命令或惯例承载它 |
| 1 | 有但不完整。零散存在，没有纪律，覆盖不到常见情况 |
| 2 | 有且成体系。常见情况都能被它覆盖，新参与者能找到它 |
| 3 | 有且被主动维护。有明确的 owner、有更新触发条件（trigger）、有维护记录 |

**轴二 · 约束力（enforcement）** —— 这一维靠什么成立

| 档 | 判据 |
|---|---|
| 0 | 只靠人和口传 |
| 1 | 写在 prose 里（指南、贡献文档、README），违反了不会发生任何事 |
| 2 | 可核对：有一条命令或一个流程，跑/走一遍能得到确定结论 |
| 3 | 机器强制，且有负例控制（negative control）：违规必红，且能说出它最近一次为红是什么回归 |

**读法。** `覆盖面 2 / 约束力 1` 是最常见的形态，也是最危险的形态——看起来什么都有，实际上全靠自觉。**约束力（enforcement） 3 才是"像回事"**。

**这两张表与各维锚点（anchor）的关系。** 两张表是所有维度共用的**通用轴**，粗判（coarse check）就用它们记档。每一维在 [02](./02-evaluate-development-harness-fine.md) 里另有自己的锚点阶梯（anchor ladder；同一档在不同维度上的具体判据），定档（final grade）时以锚点（anchor）为准；锚点（anchor）的约束力（enforcement） 3 一律包含本表的通用条件"做过负例控制（negative control）"。

### 总分与成熟度档（maturity level）

十七维不求和（不同维量纲不同），看**分布**。档位是**累积**的：每一档都要求先满足上一档。

| 档 | 判据 | 一句话 |
|---|---|---|
| **MG0 依赖个人** | 未达 MG1 | 这个仓库靠少数人的记忆运转 |
| **MG1 有文档** | 多数维度覆盖面（coverage） ≥ 2 | 写下来了，但多半没人拦得住违反 |
| **MG2 可核对** | MG1，且六维快诊（quick check）集合中**适用**的至少四个（适用不足四个时全部）约束力（enforcement） ≥ 2 | 走一遍能得出确定结论 |
| **MG3 可自证** | MG2，且至少三个维度的约束力（enforcement） = 3，且 MT1 防漂移（Drift prevention）的**约束力（enforcement）** ≥ 2（检查接进了提交流程） | 机制会自己报告失效 |

**档位怎么记。** 记满足的最高一档。每个仓库至少是 MG0，不存在落在各档之间的情形。

**快诊（quick check）只给推断档。** 快诊（quick check）只评六维，算不出"多数维度"。六维里过半覆盖面（coverage） ≤ 1 时记 `MG0（推断）`——依据是上面那条"快诊（quick check）六维红了，其余十一维基本不可能绿"；否则记"MG 待全量"。正式档位只在全量模式（full mode）里给。

达标线（pass line）：**至少 MG2，且你最痛的三维达到约束力（enforcement） 3。** 这是"能不能用"的下限。达标线（pass line）与档位相互独立——MG3 的仓库也可能未达标（最痛的三维没到约束力（enforcement） 3）。判断一轮打磨**能不能收工**用 [20 的收工线（stop line）](./20-from-gaps-to-plan.md#7--一轮打磨的循环与停止条件)，它包含达标线（pass line），附加条件在 20 里。

**"多数"与计数的口径。** 本节所有"多数"指该档适用维度里的**超过一半**；"至少四个""至少三个"这类计数也只在适用维度里数；标了 N/A 的维度不计入分母（见[第 5 节](#5--适用性applicability裁剪tailoring)）。

### 十七维总表

| 组 | 维 | 填的缺口 | 快诊（quick check） |
|---|---|---|---|
| **知识归位（KN）** | KN1 入口链（Entry chain） | IG1 IG2 | ✅ |
| | KN2 归属（One home per fact） | IG1 IG2 IG3 | ✅ |
| | KN3 决策记录（Decision records） | IG3 | |
| | KN4 分类学（Repository taxonomy） | IG2 | |
| **变更路径（CP）** | CP1 意图入口（Work intake） | IG7 | |
| | CP2 正确路径（Paved road） | IG4 | ✅ |
| | CP3 流程固化（Procedural memory） | IG5 | |
| | CP4 执行与授权链（Execution and authorization） | IG1 | |
| **证据与交付（EV）** | EV1 反馈分层（Feedback layers） | IG6 | ✅ |
| | EV2 负例控制（Negative control） | IG6 | |
| | EV3 闭环完整性（Delivery completeness） | IG7 | ✅ |
| | EV4 评审与批准（Review and approval） | IG6 IG7 | |
| **状态与上下文（ST）** | ST1 静与动（Static and dynamic） | IG2 | ✅ |
| | ST2 披露与隔离（Progressive disclosure and isolation） | IG2 IG5 | |
| | ST3 运行时查询（Inspectability） | IG2 | |
| **维护与发布（MT）** | MT1 防漂移（Drift prevention） | 全部（元维度） | |
| | MT2 发布与版本纪律（Release and versioning） | IG7 | |

---

### 十七维粗判（coarse check）一览

**怎么用**：每一维走三步，得到**粗判档（coarse grade）**。

1. **看粗判（coarse check）信号。** 每条信号后的括号标着它压的轴。命中一条，就把标出的轴粗判（coarse check）记 ≤ 1（标"两轴（two axes）"的两轴（two axes）都记 ≤ 1），并记进缺口清单（gap list）。每条信号都是 02 里一条上限 ≤ 1 的封顶（cap）的一眼版本。
2. **用上面两张通用轴表打两轴（two axes）。** 覆盖面（coverage）看有没有家、成不成体系；约束力（enforcement）用第 2 节的三级追问定——说不出在哪个文件记 0，说不出跑哪条命令记 1，说不出最近一次为红记 2。
3. **判红绿。** **红 = 覆盖面（coverage）或约束力（enforcement） ≤ 1，绿 = 两轴（two axes）都 ≥ 2。** 粗判档（coarse grade）足以判红绿、排优先级。粗判（coarse check）为红、这一轮要动、或要把分数写成最终结论的维度，翻 [02](./02-evaluate-development-harness-fine.md) 定档（final grade）；粗判档（coarse grade）与定档（final grade）冲突时以定档（final grade）为准（定档（final grade）通常更低）。

| 维 | 它管什么 | 粗判（coarse check）信号（一眼看什么；括号里是命中后记 ≤ 1 的轴） | 通常 N/A |
|---|---|---|---|
| `KN1` 入口链（Entry chain） | 新会话先读到的最小规则集与它的路由 | 根入口有没有指向更详细 home 的链接（覆盖面 coverage）；有没有混着教程与历史（覆盖面 coverage）；链接打不打得开（约束力 enforcement） | — |
| `KN2` 归属（One home per fact） | 每类事实只有一个家 | 同一个东西会不会在两处各写一版（覆盖面 coverage）；术语有没有两个名字指同一件事（覆盖面 coverage） | — |
| `KN3` 决策记录（Decision records） | 为什么这么选、什么被否了 | 最近 10 条记录里过半没有真实备选（覆盖面 coverage）；被取代的记录还被当现行权威引用（覆盖面 coverage） | — |
| `KN4` 分类学（Repository taxonomy） | 东西放哪、谁维护、能不能手改 | 两个顶层目录的职责说不说得清（覆盖面 coverage）；生成物（generated artifact）被手改有没有检查发现（约束力 enforcement） | — |
| `CP1` 意图入口（Work intake） | 任务怎么变成可开工的描述 | 最近 5 个工作项写不写得出"怎么观察结果"（覆盖面 coverage） | — |
| `CP2` 正确路径（Paved road） | 常见改动有没有首选入口与范本 | 常见变更类型有没有范本（覆盖面 coverage）；最近有没有"能配置却改核心"而无人拦（约束力 enforcement） | 纯文档站（没有代码 / 配置变更路径）时 |
| `CP3` 流程固化（Procedural memory） | 反复出现的任务有没有成文流程 | 同类任务第三次出现时还在现场发明步骤（覆盖面 coverage）；流程里指到的命令跑不跑得通（约束力 enforcement） | — |
| `CP4` 执行与授权链（Execution and authorization） | 自动化动作走同一管线，授权独立于可见性 | 加一条权限规则要改多个文件（两轴 two axes）；"部分成功"被直接交回发起者（两轴 two axes） | **没有任何需要授权的自动化动作时**（只跑测试、不产生可授权动作的流水线不算） |
| `EV1` 反馈分层（Feedback layers） | 检查分层，每层知道证明不了什么 | 五类检查里有具名检查的够不够四类（覆盖面 coverage） | — |
| `EV2` 负例控制（Negative control） | 检查被证明过会失败 | 随便挑一个检查，说得出它最近一次为红是什么回归吗（约束力 enforcement）；"新检查必须做负例控制（negative control）"有没有成文（覆盖面 coverage） | — |
| `EV3` 闭环完整性（Delivery completeness） | 实现+文档+证据同批交付 | 最近 5 笔有没有"先合并后补文档"（覆盖面 coverage）；交付说明里的验证声称对不对得上（约束力 enforcement） | — |
| `EV4` 评审与批准（Review and approval） | 批准条件与风险挂钩，作者凑不满放行线 | 最近 10 笔评审是不是清一色"LGTM"（覆盖面 coverage）；作者能不能自批（约束力 enforcement） | 单人项目（标 N/A 并写理由） |
| `ST1` 静与动（Static and dynamic） | 仓库的开发状态分层：规则 / 配置 / 记录 / 派生（derived） | 同一份配置或生成物（generated artifact）能不能两处写（两轴 two axes）；删掉生成物（generated artifact）后能不能从源头重建（约束力 enforcement） | 几乎没有配置与生成物（generated artifact）的小仓库 |
| `ST2` 披露与隔离（Progressive disclosure and isolation） | 仓库供给 agent 的上下文按需披露：常驻有预算、流程先给摘要、委派只带所需 | 常驻内容有没有上限（覆盖面 coverage）；规则与流程是不是只能全文常驻（覆盖面 coverage） | 面向 agent 的常驻规则（always-loaded rules）很少的小仓库 |
| `ST3` 运行时查询（Inspectability） | 一条命令问出开发环境与工具链"实际生效的是什么" | 有没有一条命令回答"实际生效的是什么"（覆盖面 coverage）；手工维护的接口清单有没有 freshness 检查（两轴 two axes） | 单层配置的小仓库 |
| `MT1` 防漂移（Drift prevention） | 知识与现实不漂移（drift） | 有没有无 freshness 检查的手工第二份清单（覆盖面 coverage）；有没有复核触发条件（trigger；覆盖面（coverage）） | — |
| `MT2` 发布与版本纪律（Release and versioning） | 发布序列、兼容承诺、回退路径 | 稳定与不稳定的边界写没写明（覆盖面 coverage）；发布有没有成文序列（覆盖面 coverage） | 不对外发布产物时 |

---

## 5 · 适用性（applicability）裁剪（tailoring）

不是每种仓库都要评全部十七维。**不适用的维度记 `N/A`，不记 0 分**——把"不适用"打成 0 会让评分卡（scorecard）失真，让你去修一个根本不存在的问题。

### 按仓库形态裁剪（profile tailoring）

| 形态 | 必评 | 通常 N/A | 特别注意 |
|---|---|---|---|
| **库 / SDK**（被别人引用） | 知识归位全组、变更路径全组、证据与交付全组、ST1 ST2、MT1 MT2 | ST3（配置只有一层时） | MT2 兼容承诺是核心；KN2 归属（One home per fact）要覆盖公开 API 与文档的一致；CP4 看发布流水线怎样动用凭据 |
| **服务 / 后端** | 知识归位全组、变更路径全组、证据与交付全组、状态与上下文全组、MT1 | MT2（若内部服务，版本纪律可能极轻） | ST1 静与动（Static and dynamic）、ST3 运行时查询（Inspectability）权重高；CP4 授权链（Execution and authorization）必看 |
| **Monorepo** | 全部 | — | KN4 分类学（Repository taxonomy）权重最高；MT1 防漂移（Drift prevention）是成败关键；KN2 要跨包查重 |
| **插件平台 / 框架** | 全部 | — | CP2 正确路径（Paved road）是核心（"改哪里"必须有表可查）；CP3 流程固化（Procedural memory）权重高 |
| **数据 / ML 仓库** | 知识归位全组、CP2 CP3、证据与交付全组、ST1 ST2、MT1 MT2 | CP4（没有需要授权的自动化动作时）、ST3（配置只有一层时） | ST1 的"事实源（source of truth） vs 派生（derived）"要覆盖数据集与特征；MT2 要覆盖数据 schema 版本 |
| **文档站 / 知识库** | 知识归位全组、CP1 CP3、EV1 EV2 EV3、ST1、MT1 | CP2 CP4、ST3、MT2 | KN1 入口链（Entry chain）、KN2 归属（One home per fact）、MT1 防漂移（Drift prevention）是**重点**（其余按"必评"列照做）；证据与交付组查"链接与锚点（anchor）是否有检查"；ST1 看站点构建产物能不能从源头重建 |
| **单文件脚本 / 小工具** | KN1 KN2、EV1 EV2、MT1 | 其余 | 上列五维已足够（EV2 与 MT1 对脚本最便宜也最有用）；不要为了评分卡（scorecard）去造机制 |
| **agent 产品 / 自带 agent 运行时** | 本文全部 | — | **另加**：[运行时 Harness 粗粒度（coarse-grained）](./11-evaluate-runtime-harness.md) |

### 四条裁剪（tailoring）纪律

1. **标 N/A 要写理由**，一行即可（"本仓库不发布产物，MT2 不适用"）。
2. **N/A 的维度不计入"多数"的分母**，分母按实际评估的维度数算。
3. **不确定是否适用时，先按适用处理**，评估过程中发现没有对应压力，再改标 N/A 并记录。
4. **卡片的适用性（applicability）优先于"必评"。** 02 各卡的适用性（applicability）说明（例如 CP4"没有需要授权的自动化动作"、ST2"面向 agent 的常驻规则（always-loaded rules）很少"）是事实判断，优先于本表的"必评"。

### 与运行时评估的形态口径不同

本表的"仓库形态"决定十七维里哪些要评；[11 的形态裁剪（profile tailoring）](./11-evaluate-runtime-harness.md#4--形态裁剪profile-tailoring)那套（内部 / 产品 / 平台 / 单机实验 / 多入口）决定十一维里哪些要评。两者正交：一个仓库的形态是"agent 产品"时，两套各判一次。

---

## 6 · 报告格式（agent 写，人读）

agent 按下面的格式写一份 Markdown 报告：四张表加末尾的问题清单，空格全部由 agent 填写。人只读报告——复核证据、回答末尾的问题、决定下一步，不打分，也不改分。

### 表 1 · 评分卡（scorecard）

```
评估对象：<仓库名 / 路径 / revision>
评估者：<agent 标识：模型 / 会话>
日期：<YYYY-MM-DD>
模式：<快诊（quick check） / 全量>
仓库形态：<库 / 服务 / monorepo / 插件平台 / 数据 / 文档站 / 脚本 / agent 产品>
```

| 维 | 覆盖面（coverage） | 约束力（enforcement） | 最痛的真实案例（有则填；无则写证据受限（evidence-limited）的理由） | 证据状态（正常 / 证据受限（evidence-limited） / N/A + 理由） |
|---|---|---|---|---|
| KN1 入口链（Entry chain） | | | | |
| KN2 归属（One home per fact） | | | | |
| KN3 决策记录（Decision records） | | | | |
| KN4 分类学（Repository taxonomy） | | | | |
| CP1 意图入口（Work intake） | | | | |
| CP2 正确路径（Paved road） | | | | |
| CP3 流程固化（Procedural memory） | | | | |
| CP4 执行与授权链（Execution and authorization） | | | | |
| EV1 反馈分层（Feedback layers） | | | | |
| EV2 负例控制（Negative control） | | | | |
| EV3 闭环完整性（Delivery completeness） | | | | |
| EV4 评审与批准（Review and approval） | | | | |
| ST1 静与动（Static and dynamic） | | | | |
| ST2 披露与隔离（Progressive disclosure and isolation） | | | | |
| ST3 运行时查询（Inspectability） | | | | |
| MT1 防漂移（Drift prevention） | | | | |
| MT2 发布与版本纪律（Release and versioning） | | | | |

`N/A` 的维度：案例列写 `—`，证据状态列写 `N/A：<理由>`（第 5 节要求标 N/A 必须写理由）。看不到但没证据的维度，证据状态列写 `证据受限`。

```
成熟度档（maturity level）：<MG0 依赖个人 / MG1 有文档 / MG2 可核对 / MG3 可自证>
最痛的三维：<…>
```

### 表 2 · 缺口清单（gap list）

每一行必须能回答"这是哪一维的缺口，会造成什么具体后果"。**写不出具体后果的行删掉。**

| # | 维 | 症状（具体到文件/提交/时刻） | 后果（谁在什么时候会踩到） | 触及的缺口 | 严重度 |
|---|---|---|---|---|---|
| 1 | | | | IG? | 高/中/低 |
| 2 | | | | | |

### 表 3 · 切片走查（slice walkthrough）记录

```
被走查的变更：<commit / PR / 变更描述>
为什么选它：<最近完成 / 改动小 / 不涉及核心架构>
```

| 步 | 观察到的 | 证据状态 |
|---|---|---|
| 1 核对现场 | | 能指出文件 / 只有口头说法 / 完全没有 |
| 2 判定窄 diff | | |
| 3 改 owner 面 | | |
| 4 最小匹配证据（红灯对照（revert check）结果） | | |
| 5 沉淀 | | |
| 6 只报告跑过的 | | |

五问补充：

```
① 用户可观察结果是什么？如何观察？
② 从任务描述能找到改动位置的 owner 吗（不靠作者带路）？
③ 这笔变更携带的持久取舍记在哪？没有的话理由说得出吗？
④ 哪项证据会在旧行为上失败？红灯对照（revert check）结果是什么？
⑤ 「靠猜」的条目：              「没证据」的条目：
```

### 表 4 · 三张清单

```
打不开的链接：
  - <在哪份文件 / 指向哪里 / 从哪个入口能点到>
靠猜的 owner：
  - <哪个问题 / 为什么必须猜 / 最后靠什么猜出来的>
无证据支持的声称：
  - <哪份文档/说明声称了什么 / 本该有什么证据 / 实际有什么>
```

### 报告末尾 · 需要人回答的问题

只存在于人脑、会议或 agent 无权访问的平台上的事实，agent 不猜，也不在评估中途追问，统一列在这里。每条写清三件事：问题本身、它影响哪一维哪一轴、两种答案各让档位怎么变。人的回答按 `EL0`（口述）记录：它可以把"证据受限（evidence-limited）"换成有依据的判断，但单凭回答不能记 2 分以上（见第 0 节铁律）。

```
- <问题> —— 影响：<维 / 轴>；答"是"→ <档位变化>；答"否"→ <档位变化>
```

---

## 7 · 报告交付前的自检

评估做完，先用这五条检验**评估本身**：

1. **每个扣分点都能指到具体证据。** 说不出"我在哪个文件、哪次提交、哪条命令上看到的"，这一条就不算扣分——回去补证据，或者撤销这条。
2. **另开会话复测（re-evaluation），档位稳定。** 同一维度由另开的无上下文 agent 会话再走一遍，档位差不应超过 1。差 2 以上，说明探针（probe）写得不够客观。
3. **缺口清单（gap list）里的每一条都能归到某一维。** 归不进去的，要么是新维度（记下来），要么根本不是开发 Harness 的问题（删掉）。
4. **（全量模式 full mode）表 4 不是空的。** 一次评估如果三张清单全是空的，八成是没认真找——除非这个仓库真的处于极高水平。
5. **（走细粒度（fine-grained）时）每一次命中封顶（cap），都说得出观察它的探针（probe）。** 封顶规则（cap rules；见 [02 的附录 A](./02-evaluate-development-harness-fine.md#附录-a--封顶规则cap-rules速查)）是写成可观察条件的上限，每条都应由某一维的某个探针（probe）或第三层的某个动作观察到。说不出是谁观察的，说明这条封顶（cap）在本次评估里用不出来——把它当方法缺陷记下来，不要照记分。

### 三条取证纪律

- **区分"看不见"和"没有"。** 只有仓库可查时，很多事实看不到。看不到就标"证据受限（evidence-limited）"，不要断言缺失。
- **不要用仓库自己的文档当证据。** 文档是**被评估对象**的一部分，不是评估依据。文档说"我们有严格的测试要求"，这句话本身只能证明"文档里写了这句话"。
- **（走细粒度（fine-grained）时）不允许跳过第三层的第 4 个动作**（故意制造一个违规，看检查红不红，然后还原）。判断一个检查会不会失败，只能靠亲手让它失败一次。

---

## 8 · 短例

> **说明**：这是一个**构造的示意**，不是对任何真实仓库的评估。目的是给出一份合格报告的样子：agent 照着写，读报告的人照着核。

### 背景

- 仓库：一个运行了三年的后端服务，Go 主体 + TypeScript 前端，约 6 万行，15 人团队。
- 已有：`README.md`（400 行，包含架构、部署、编码规范、常见问题）、`docs/` 目录（12 篇，最后更新日期跨度两年）、`Makefile`、GitHub Actions 跑 `go build`、`go test ./...`、`golangci-lint`、一组 docker-compose 集成测试、启动冒烟测试与前端构建。
- 模式：快诊（quick check；六维）+ 一次 EV2 抽检 + 一次切片（slice）。

### 表 1 · 评分卡（scorecard；节选，粗判档（coarse grade））

| 维 | 覆盖面（coverage） | 约束力（enforcement） | 最痛的真实案例 | 证据状态 |
|---|---|---|---|---|
| KN1 入口链（Entry chain） | 1 | 1 | `README.md` 400 行里混着架构说明、编码规范和历史遗留的部署步骤；没有给 agent 的入口文件；新人第一个问题是"该读哪一段"，答案靠问人 | 正常 |
| KN2 归属（One home per fact） | 1 | 1 | 超时配置有两个家：`config/timeouts.go` 与 `README.md` 的"关键参数"一节；上周改代码里那份，README 那份滞后两周无人发现 | 正常 |
| CP2 正确路径（Paved road） | 1 | 1 | 三个月前有人为了加一个后端接口，在 handler 里直接开了 goroutine 写库，绕过了既有的 task queue 封装；评审时才发现 | 正常 |
| EV1 反馈分层（Feedback layers） | 2 | 2 | 编译期、局部行为、组装行为、运行时关系四类都有具名检查，CI 强制跑；但失败信息只报测试名，说不出违反哪条规则、去哪修 | 正常 |
| EV3 闭环完整性（Delivery completeness） | 1 | 1 | 最近 5 笔变更里 3 笔只改代码；`docs/` 里 12 篇有 7 篇描述的接口已经变了 | 正常 |
| ST1 静与动（Static and dynamic） | 1 | 0 | `api/openapi.yaml` 与由它生成的 `gen/client/` 两处都有人手改；生成命令只有一个人记得，删掉 `gen/` 重新生成会丢掉三处手改 | 正常 |

```
EV2 抽检：任选 TestPaymentRetry，问"它最近一次为红是什么回归"——没人答得出（命中约束力（enforcement）信号）；
         "新检查必须做负例控制（negative control）"没写在任何文件里（命中覆盖面（coverage）信号），一位成员说自己偶尔这么做。
         EV2 粗判（coarse check）：覆盖面（coverage） 1 / 约束力（enforcement） 0。
成熟度档（maturity level）：MG0（推断）（快诊（quick check）六维里五维的覆盖面（coverage）停在 1）
最痛的三维：ST1 静与动（Static and dynamic）、KN2 归属（One home per fact）、EV3 闭环完整性（Delivery completeness）
```

### 表 2 · 缺口清单（gap list；节选）

| # | 维 | 症状 | 后果 | 缺口 | 严重度 |
|---|---|---|---|---|---|
| 1 | ST1 | OpenAPI 规范与生成的客户端两处可写；生成命令无记录 | 规范与客户端不一致时无人知道哪边对；重新生成会悄悄抹掉手改 | IG2 | 高 |
| 2 | KN2 | 超时配置在代码与 README 各有一份 | 新人按 README 改配置，改完不生效；上周已发生一次 | IG1 IG3 | 高 |
| 3 | EV3 | 12 篇文档里 7 篇接口描述已过期 | agent 会照过期文档写出调用不存在接口的代码 | IG7 | 高 |
| 4 | CP2 | 没有"目标→机制"表；新接口绕过 task queue | 每次新功能都可能重新发明一套接法，评审才发现 | IG4 | 中 |
| 5 | KN1 | 400 行 README 无路由结构；无 agent 入口 | 每次新会话先花 10 分钟找该读哪里，且常常读错 | IG1 IG2 | 中 |
| 6 | EV2 | 抽检的检查说不出最近一次为红，负例控制（negative control）没有成文要求；切片（slice）发现 `TestOrderTimeoutConfig` 没钉住配置读取路径 | 绿灯不能说明行为被保护，其它维度的"有检查"都可能是假的 | IG6 | 中 |

### 表 3 · 切片走查（slice walkthrough）记录

```
被走查的变更：commit a3f9c21「订单超时时间改为可配置」
为什么选它：最近完成、改动小、不涉及核心架构
```

| 步 | 观察到的 | 证据状态 |
|---|---|---|
| 1 核对现场 | 从 `develop` 分支切出；base 没有记录在提交信息里，只能从时间推断 | 完全没有（靠推断） |
| 2 判定窄 diff | 窄 diff 是 3 个文件：`config/timeouts.go`、`order/service.go`、一个测试 | 能指出文件 |
| 3 改 owner 面 | 改了代码侧配置；**没有**改 README 里那份同名配置清单 | 能指出文件 |
| 4 最小匹配证据 | 有测试 `TestOrderTimeoutConfig`。红灯对照（revert check）：注释掉配置读取改回硬编码 → 测试**仍然通过** | 能指出文件（红灯对照（revert check）不红，证据不成立） |
| 5 沉淀 | 无决策记录（decision record；这笔变更确实没有持久取舍，✓ 合理） | —（本步无须证据） |
| 6 只报告跑过的 | PR 描述写"已测试"，CI 确实跑了 `go test ./...` | 能指出文件 |

```
⑤ 「靠猜」的条目：README 里那份超时配置是不是权威（靠问人才知道是代码侧权威）
   「没证据」的条目：TestOrderTimeoutConfig 看起来在测配置，实际没有钉住配置读取路径
```

### 一句话结论

这个仓库的问题不是"没有文档"——它有 400 行 README 和 12 篇 docs——而是**文档与代码是两个可以各自漂移（drift）的家，且没有任何检查会发现它们漂了**。切片走查（slice walkthrough）给出了确凿证据：一笔本该同时改两处的变更只改了一处，而那个看起来在保护的测试实际上什么都没保护。

EV2 怎样从粗判档（coarse grade）钉成定档（final grade），见 [02 §5](./02-evaluate-development-harness-fine.md#5--细粒度fine-grained示例把-ev2-从粗判档coarse-grade钉成定档final-grade)；这份缺口清单（gap list）怎样排成施工顺序（build order），见 [20 §8](./20-from-gaps-to-plan.md#8--短例)。

---

## 附录 A · 术语表

| 词 | 含义 |
|---|---|
| **development harness** | 仓库为了让参与者理解、修改、验证自己而提供的全部机制的总和 |
| **fresh agent** | 第一次进入这个仓库、没有任何项目背景的编码代理 |
| **知识外置** | 把原本留在个人经验里的知识，变成可搜索、可检查或可执行的仓库内容 |
| **owner / 归属（ownership）** | 某类事实的唯一权威所在的位置；其它地方只放链接 |
| **paved road / 正确路径** | 仓库为常见变更提供的首选入口、生产范本和升级条件 |
| **procedural memory / 流程固化** | 面向特定任务、带适用条件和验证步骤的工作方法，被写成可复用文档 |
| **inspectability / 可查询性** | 查询实际配置、注册项和运行状态的能力 |
| **负例控制（negative control）** | 故意制造一个该被抓住的回归，确认检查确实会失败，然后还原 |
| **红灯对照（revert check）** | 回滚实现、保留检查，跑一次看它红不红；不红说明这个检查没在测它以为在测的东西 |
| **窄 diff** | 这次改动真正触达的行为面，不含顺带的重构与格式化 |
| **覆盖面（coverage）** | 这一维有没有家：0 没有 / 1 零散 / 2 成体系 / 3 有 owner 与更新触发条件（trigger；见第 4 节） |
| **约束力（enforcement）** | 一条规则靠什么成立：口传 / prose / 可核对 / 机器强制且有负例控制（negative control） |
| **EL0–EL3** | 上述四档证据级（evidence level；见第 2 节） |
| **粗判档（coarse grade） / 定档（final grade）** | 用本文第 4 节粗判（coarse check）得到的档位 / 用 02 的探针（probe）、锚点（anchor）与封顶（cap）钉死的档位；两者冲突时以定档（final grade）为准 |
| **漂移（drift）** | 外置知识与它所描述的现实之间产生的、无人发现的偏差 |
| **freshness 门禁（gate）** | 检查派生（derived）内容跟不跟得上源头：源头变了、派生（derived）没跟着变就红 |
| **第一 / 第二 / 第三层** | 三个评估层：静态清点、垂直切片（vertical slice）、反证（falsification；层与维度是两回事，别混读） |

---

## 附录 B · 常见伪证（false evidence）清单

> **owner 说明。** 逐维伪证（false evidence）与理由写在 [02](./02-evaluate-development-harness-fine.md) 各维卡片的"常见伪证（false evidence）"行（那才是 owner）；本附录只是被跨维反复引用的十条的索引，**增补时补卡片**。

评估时最常听到的十句话，以及它们归哪一维判。

| 说法 | 所属维度（理由在卡片的"常见伪证（false evidence）"行） |
|---|---|
| "我们有 `AGENTS.md`" | [KN1 入口链（Entry chain）](./02-evaluate-development-harness-fine.md#kn1-入口链--entry-chain) |
| "我们的文档很全" | [KN2 归属（One home per fact）](./02-evaluate-development-harness-fine.md#kn2-归属--one-home-per-fact) |
| "我们遵循语义化版本" | [MT2 发布与版本纪律（Release and versioning）](./02-evaluate-development-harness-fine.md#mt2-发布与版本纪律--release-and-versioning) |
| "源码就是文档" | [ST3 运行时查询（Inspectability）](./02-evaluate-development-harness-fine.md#st3-运行时查询--inspectability) |
| "我们 CI 全绿" | [EV1 反馈分层（Feedback layers）](./02-evaluate-development-harness-fine.md#ev1-反馈分层--feedback-layers) |
| "我们的检查很全" | [EV2 负例控制（Negative control）](./02-evaluate-development-harness-fine.md#ev2-负例控制--negative-control) |
| "我们有严格的双人评审" | [EV4 评审与批准（Review and approval）](./02-evaluate-development-harness-fine.md#ev4-评审与批准--review-and-approval) |
| "我们要求每个 PR 带测试" | [EV3 闭环完整性（Delivery completeness）](./02-evaluate-development-harness-fine.md#ev3-闭环完整性--delivery-completeness) |
| "我们的工具自己会检查权限" | [CP4 执行与授权链（Execution and authorization）](./02-evaluate-development-harness-fine.md#cp4-执行与授权链--execution-and-authorization) |
| "我们的文档更新很及时" | [MT1 防漂移（Drift prevention）](./02-evaluate-development-harness-fine.md#mt1-防漂移--drift-prevention) |

---

**下一步。** 报告写完后：粗判（coarse check）为红、或这一轮要动的维度，翻 [02 细粒度（fine-grained）](./02-evaluate-development-harness-fine.md) 走探针（probe）、锚点（anchor）与封顶（cap；封顶（cap）速查在 02 的附录 A）；缺口清单（gap list）变成施工顺序（build order），去 [20 从缺口到计划](./20-from-gaps-to-plan.md)，那里有"症状 → 缺口 → 维度 → 处置"的总对照表和十七维各一张处置卡（remediation card）。

**如果这个仓库本身是 agent 产品**，另跑 [运行时 Harness 粗粒度（coarse-grained）](./11-evaluate-runtime-harness.md)——那套维度回答的是另一个问题：*这个 agent 系统本身做对了吗*，与本文的回答互不替代。
