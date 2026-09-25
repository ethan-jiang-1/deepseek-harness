# 缺了维度怎么办：从缺口到计划 · 粗粒度（coarse-grained）

**这份文档是什么。** 评估已经指出哪一维红了。这份文档回答三件事：**先补哪一个、补成什么样算数、什么时候停。** 每维只给最小一步。做法、验收红线（acceptance red lines）、成本和走形（degradation），在 [22 细粒度（fine-grained）](./22-from-gaps-to-plan-fine.md)，只翻这一轮要动的那几张卡。

**谁执行、谁读。** agent 拿缺口清单（gap list）按本文排施工顺序（build order），写出这一轮补哪几维、每维的最小一步。人读本文是为了同意这个顺序，读 [22](./22-from-gaps-to-plan-fine.md) 是为了看某一维怎么做深。

**可以单独使用。** 没做过评估也能用：用[第 2 节](#2--症状--缺口--维度总对照表)的症状对号入座，再到[第 3 节](#3--每维的最小一步)看怎么补。做过评估的话，从[第 1 节](#1--排序原则ordering-principles)开始。

**编号约定。** 维度沿用 01/02 的两字母前缀（`KN`/`CP`/`EV`/`ST`/`MT`/`RT`），缺口用 `IG`（见 [README 的标识符约定](./README.md#标识符约定token)）。

**两份粒度。** 本文（`21`）稳定：排序原则（ordering principles）、症状对照、每维最小一步、边界、收工线（stop line）。[22](./22-from-gaps-to-plan-fine.md) 会随做法增补。

**配套文档。** [01](./01-evaluate-development-harness-coarse.md) · [02](./02-evaluate-development-harness-fine.md) · [11](./11-evaluate-runtime-harness-coarse.md) · [12](./12-evaluate-runtime-harness-fine.md) · [22](./22-from-gaps-to-plan-fine.md)

---

## 目录

- [1 · 排序原则（ordering principles）](#1--排序原则ordering-principles)
- [2 · 症状 → 缺口 → 维度总对照表](#2--症状--缺口--维度总对照表)
- [3 · 每维的最小一步](#3--每维的最小一步)
- [4 · 边界与反模式](#4--边界与反模式)
- [5 · 一轮打磨的循环与停止条件](#5--一轮打磨的循环与停止条件)
- [6 · 短例](#6--短例)
- [附录 · 一页速查](#附录--一页速查)

---

## 1 · 排序原则（ordering principles）

### 原则一：痛点优先，不按列表顺序

评分卡（scorecard）上哪一维的**案例最多、后果最贵**，就先做哪一维。通用优先级只是没做评估时的默认值。

判断"最痛"的方法：缺口清单（gap list）里每一条都写了"谁在什么时候会踩到"。把"已经在踩"的排到"迟早会踩"前面。

### 原则二：先做前置维（prerequisite dimension）

有五个维度是**前置的**（KN1、KN2 属知识归位组（KN），EV1、EV2、EV3 属证据与交付组（EV））——它们不做，其余维度做了也白做：

| 前置 | 为什么是前置 |
|---|---|
| **KN1 入口链（Entry chain） + KN2 归属（One home per fact）** | 路由不存在，你后面写的所有知识都到不了读者手里 |
| **EV1 反馈分层（Feedback layers） + EV2 负例控制（Negative control）** | 没有可信反馈，你无法验证任何一项改动的效果。改进本身变成盲改 |
| **EV3 闭环完整性（Delivery completeness）** | 交付不闭合，前面所有投入都会在下一次"先合并后补文档"里漏掉 |

前置维（prerequisite dimension）的特征：**它们的失败会让其它维度的收益归零**，而不是"它们比较重要"。

**MT1 防漂移（Drift prevention）不单独排期，伴随做。** 每外置一份知识（入口、归属表（ownership table）、清单、流程），就在同一次改动里给它配上结构检查和负例控制（negative control；见 [MT1 卡](./22-from-gaps-to-plan-fine.md#mt1-防漂移drift-prevention--处置卡remediation-card)）。其余十一维归[原则三](#原则三有压力再借pressure-triggered)。

### 原则三：有压力再借（pressure-triggered）

以下维度**不要提前做**。它们的收益只有在对应压力真实出现时才成立，提前做会变成纯维护成本（maintenance cost）：

| 维度 | 触发条件（trigger；压力真的出现了才做） |
|---|---|
| KN3 决策记录（Decision records） | 一个已被否决的方案，被第二次重新提出 |
| KN4 分类学（Repository taxonomy） | 出现同一事实的第二份手写清单；或生成物（generated artifact）被手改而无人发现；或"这个文件该放哪"被问第三次 |
| CP3 流程固化（Procedural memory） | 同一类任务第三次出现，且每次做法都不一样 |
| CP4 执行与授权链（Execution and authorization） | 仓库里开始有自动化代理直接改动内容，且威胁模型清晰了 |
| ST1 静与动（Static and dynamic） | 出现同一份配置或数据两处可写；或删掉派生（derived）后重建不出同样的结果 |
| ST2 披露与隔离（Progressive disclosure and isolation） | 常驻规则（always-loaded rules）开始膨胀；或 agent 频繁漏读、读错流程；或团队开始抱怨"规则文档越塞越多" |
| ST3 运行时查询（Inspectability） | 有人开始读源码猜"现在实际生效的是什么"；或手工维护的接口清单已经维护不动；或存在多层配置叠加 |
| MT2 发布与版本纪律（Release and versioning） | 开始对外发布产物，且出过一次"发错了/忘 bump 了"的事故 |
| CP1 意图入口（Work intake） | 出现"做完才发现理解错了"的返工；或提交无法回溯到它服务的意图 |
| CP2 正确路径（Paved road） | 有人在错误的地方插代码、或自己发明一套新接法；或真实需求进来没人答得出"改哪里" |
| EV4 评审与批准（Review and approval） | 出现"评审只是点通过"或"评审全在挑格式" |

**在压力出现之前建这些机制，是在为一个不存在的问题付维护费。** 这是把成熟样板照搬到小项目上最常见的浪费。

### 原则四：按"成本档"而不是"重要性"排同一批

同一个优先级里，先做便宜的：

| 成本档 | 特征 | 典型 |
|---|---|---|
| **零架构依赖** | 只是一份文件、一个符号链接、一条命令 | 入口链（entry chain）、归属表（ownership table）、决策记录（decision record）目录 |
| **一个脚本** | 一个 `exit non-zero` 的命令 + 一次负例控制（negative control） | 负例控制（negative control）、防漂移（drift prevention）、披露与隔离（progressive disclosure and isolation）的预算门禁（gate） |
| **一个流程** | 需要改协作习惯，但不需要改代码结构 | 反馈分层（feedback layers）、闭环完整性（delivery completeness）、评审与批准（review and approval）、意图入口（work intake） |
| **一个架构** | 需要动代码结构或引入新层 | 执行与授权链（execution and authorization）、静与动（static and dynamic）的单一可写来源、发布与版本纪律（release and versioning） |

前两档几乎零架构依赖，是大多数项目最先见效的部分。同一批里，第四档排在最后。

**运行时维度的对应排序**（前置三维、有压力再借（pressure-triggered）、最便宜的三刀）见[运行时维度的排序](#运行时维度的排序原则ordering-principles)。原则一到六对两类维度同样成立。

### 原则五：一轮只动一到三维

一轮改动同时碰五维，做完了没人说得清是哪一项起了作用。**一轮一到三维，做完回评估复测（re-evaluation），再决定下一轮。**

### 原则六：同时评两份时，相近的维度各评各的对象

一个仓库本身是 agent 产品时，[01](./01-evaluate-development-harness-coarse.md) 与 [11](./11-evaluate-runtime-harness-coarse.md) 都要评。有五对维度判据同源、容易混为一谈，但**评的是两个不同的系统**：开发侧评仓库交给参与者（含 coding agent）的机制，运行时侧评产品里的 agent 运行时。

| 开发侧（评仓库） | 运行时侧（评产品） | 两边各自看什么 |
|---|---|---|
| CP4 执行与授权链（Execution and authorization） | RT9 工具执行与授权（Tool execution and authorization） | 仓库的 CI 机器人、发布脚本、改仓库的 agent 流程 vs 产品里模型发起的工具调用 |
| ST1 静与动（Static and dynamic） | RT2 会话事实源（Session as the single source of truth） | 仓库的配置、记录、生成物（generated artifact） vs 产品的会话记录 |
| ST2 披露与隔离（Progressive disclosure and isolation） | RT7 模型可见面组装（Model-visible surface assembly） | 仓库供给 coding agent 的常驻规则（always-loaded rules）与流程摘要 vs 产品每一步组装给模型的请求 |
| ST3 运行时查询（Inspectability） | RT1 组合与启动（Composition and boot） | 开发工具链与本地环境的实际生效值 vs 产品运行时的组合结果 |
| MT2 发布与版本纪律（Release and versioning） | RT3 格式世代与兼容（Format generations） | 仓库发布物（包、公开接口、发布的数据格式）的兼容承诺 vs 产品持久数据的版本与迁移 |

**规则：两侧各自计分、各自排期，不去重，也不互相借证据**——用产品有会话记录来给开发侧 ST1 加分，或用仓库有 CI 授权来给 RT9 加分，都是拿一个系统的证据评另一个系统。判据可以互相借鉴：一侧已经做对的做法，常常是另一侧处置卡（remediation card）的现成范本。

---

### 运行时维度的排序原则（ordering principles）

**前置三维（不做它，其余做了也无法验证）：**

| 前置 | 为什么是前置 |
|---|---|
| **RT2 会话事实源（Session as the single source of truth）** | 它是"系统报告什么"与"实际发生什么"之间的唯一桥梁。没有它，你无法诊断任何其它维度的问题 |
| **RT7 模型可见面组装（Model-visible surface assembly）** | 它是 RT2 在请求侧的另一半。模型看到什么不进记录，RT2 就只能重建一半 |
| **RT9 工具执行与授权（Tool execution and authorization）** | 它决定系统报告的"结果"能不能被相信。异常被吞成空结果时，后面所有判断都建立在错的前提上 |

**有压力再借（pressure-triggered）：**

| 维度 | 触发条件（trigger） |
|---|---|
| RT3 格式世代与兼容（Format generations） | 持久数据要跨版本长期存活（用户不会每次升级都丢历史）|
| RT4 循环与终结边界（Loop and termination boundaries） | 出现"它到底是做完了还是卡住了"的争论；或取消后动作仍在后台继续 |
| RT5 能力 seam | 第二个真实实现出现（不是"我们知道将来可能会有"）|
| RT6 扩展点（Extension points and interception） | 有第二个人要往上面加东西；或出现"为了加功能改了核心"的实例 |
| RT10 可执行治理（Executable governance） | 出现写在文档里、可以机械判断却没人遵守的规则 |
| RT8 入口与协议投影（Entry surfaces and protocol projection） | 第二个入口出现 |
| RT11 客户端组装纪律（Client composition discipline） | 界面上出现"同一个数字两处不一样"；或改一个数据要在界面里同步好几处 |
| RT1 组合与启动（Composition and boot） | 配置开始由多个人改；或出现过"以为开着实际没装"|

**最便宜的三刀（几乎零成本，收益立刻）**——它们是原则三的例外：成本接近零、不引入新层，不必等触发条件（trigger）：

1. **坏配置大声失败**（RT1）：把"引用了不存在的组件"从警告改成错误。
2. **结果单一出口**（RT9）：把所有"异常吞成空值"的地方改成明确的错误结果。
3. **终结原因封闭化**（RT4）：把自由字符串换成封闭集合，并加上"被取消"与"已完成"的区分。

## 2 · 症状 → 缺口 → 维度总对照表

### 缺口编号（评估里的 IG1–IG7）

| 缺口 | 它缺的那句话 |
|---|---|
| **IG1 必须遵守什么** | 这里有哪些铁律？哪些事绝对不能做？ |
| **IG2 系统由什么组成** | 这个仓库有哪些部分，谁依赖谁，东西放哪？ |
| **IG3 为什么这样设计** | 当初为什么选这条路？什么方案被否了？ |
| **IG4 改动落在哪里** | 这个需求应该改哪个机制？ |
| **IG5 这类任务按什么流程做** | 这类任务该按什么步骤？什么时候停？ |
| **IG6 怎么算做对** | 什么证据能证明我没做错？ |
| **IG7 交付怎样算完整** | 实现、文档、证据要一起交吗？缺口如实说吗？ |

### 总对照表

**从症状出发**：左边找最像你的一句，右边拿到维度，再到[第 3 节](#3--每维的最小一步)看最小一步；要做深时翻 [22](./22-from-gaps-to-plan-fine.md)。

| 你看到的症状 | 缺的缺口 | 维度 | 先去哪张卡 |
|---|---|---|---|
| 每次新会话都要花十几分钟才搞清该读什么 | IG1 IG2 | KN1 入口链（Entry chain） | [KN1](./22-from-gaps-to-plan-fine.md#kn1-入口链entry-chain--处置卡remediation-card) |
| 同一个规则在两个文件里各有一版，改一处漏一处 | IG1 IG3 | KN2 归属（One home per fact） | [KN2](./22-from-gaps-to-plan-fine.md#kn2-归属one-home-per-fact--处置卡remediation-card) |
| 同一个概念有两种叫法，或两个近义词被当成两件事 | IG2 | KN2 归属（One home per fact） | [KN2](./22-from-gaps-to-plan-fine.md#kn2-归属one-home-per-fact--处置卡remediation-card) |
| 被否决过的方案，每隔半年被重新提一次 | IG3 | KN3 决策记录（Decision records） | [KN3](./22-from-gaps-to-plan-fine.md#kn3-决策记录decision-records--处置卡remediation-card) |
| 同一件事改过几轮，没人说得出最后是什么、为什么改 | IG3 | KN3 决策记录（Decision records） | [KN3](./22-from-gaps-to-plan-fine.md#kn3-决策记录decision-records--处置卡remediation-card) |
| 新文件不知道该放哪，同一个东西放三个地方 | IG2 | KN4 分类学（Repository taxonomy） | [KN4](./22-from-gaps-to-plan-fine.md#kn4-分类学repository-taxonomy--处置卡remediation-card) |
| 做完才发现理解错了需求，返工 | IG7 | CP1 意图入口（Work intake） | [CP1](./22-from-gaps-to-plan-fine.md#cp1-意图入口work-intake--处置卡remediation-card) |
| 有人在错误的地方插代码，或自己发明一套新接法 | IG4 | CP2 正确路径（Paved road） | [CP2](./22-from-gaps-to-plan-fine.md#cp2-正确路径paved-road--处置卡remediation-card) |
| 同一类任务每次都用不同做法，步骤靠记忆 | IG5 | CP3 流程固化（Procedural memory） | [CP3](./22-from-gaps-to-plan-fine.md#cp3-流程固化procedural-memory--处置卡remediation-card) |
| 同一套做法改过几轮，新旧说法并存，新人不知道该照哪一份 | IG5 | CP3 流程固化（Procedural memory） | [CP3](./22-from-gaps-to-plan-fine.md#cp3-流程固化procedural-memory--处置卡remediation-card) |
| 加一条权限规则要改十几个文件，总有一个忘了改 | IG1 | CP4 执行与授权链（Execution and authorization） | [CP4](./22-from-gaps-to-plan-fine.md#cp4-执行与授权链execution-and-authorization--处置卡remediation-card) |
| 做错了要等到评审或线上了才知道 | IG6 | EV1 反馈分层（Feedback layers） | [EV1](./22-from-gaps-to-plan-fine.md#ev1-反馈分层feedback-layers--处置卡remediation-card) |
| 检查一堆，但没人记得它们什么时候真的拦住过东西 | IG6 | EV2 负例控制（Negative control） | [EV2](./22-from-gaps-to-plan-fine.md#ev2-负例控制negative-control--处置卡remediation-card) |
| 代码合并了，文档和测试没跟上 | IG7 | EV3 闭环完整性（Delivery completeness） | [EV3](./22-from-gaps-to-plan-fine.md#ev3-闭环完整性delivery-completeness--处置卡remediation-card) |
| 评审只是点个通过，或者全在挑格式 | IG6 IG7 | EV4 评审与批准（Review and approval） | [EV4](./22-from-gaps-to-plan-fine.md#ev4-评审与批准review-and-approval--处置卡remediation-card) |
| 同一份配置两处可写，本地绿、CI 红时不知道信哪个 | IG2 | ST1 静与动（Static and dynamic） | [ST1](./22-from-gaps-to-plan-fine.md#st1-静与动static-and-dynamic--处置卡remediation-card) |
| 常驻规则（always-loaded rules）越塞越多，agent 每次要读完一大堆才开工，还常漏读流程 | IG2 IG5 | ST2 披露与隔离（Progressive disclosure and isolation） | [ST2](./22-from-gaps-to-plan-fine.md#st2-披露与隔离progressive-disclosure-and-isolation--处置卡remediation-card) |
| 只能读源码猜"现在实际生效的是什么" | IG2 | ST3 运行时查询（Inspectability） | [ST3](./22-from-gaps-to-plan-fine.md#st3-运行时查询inspectability--处置卡remediation-card) |
| 文档写的时候是对的，三个月后处处对不上 | 全部 | MT1 防漂移（Drift prevention） | [MT1](./22-from-gaps-to-plan-fine.md#mt1-防漂移drift-prevention--处置卡remediation-card) |
| 发布靠手动记步骤；发布后才发现兼容性炸了 | IG7 | MT2 发布与版本纪律（Release and versioning） | [MT2](./22-from-gaps-to-plan-fine.md#mt2-发布与版本纪律release-and-versioning--处置卡remediation-card) |

### 反向读法：从维度找症状

评估给出的是一张十七行的表。表上每一维低于 2 档时，它对应的**典型后果**是：

- **知识归位组低** → 读者抓不住主线，读到过期的理由当现行，东西越放越乱
- **变更路径组低** → 改动落在错误位置，流程每次重新发明，能配置的事改了核心
- **证据与交付组低** → 交付不可验证，"全绿"与"没人信"同时存在
- **状态与上下文组低** → 配置两处存真，常驻规则（always-loaded rules）淹没读者，只能读源码猜实际生效的是什么
- **维护与发布组低** → 其余十六维的成果在半年内失效

---

### 运行时：症状 → 维度

| 你看到的症状 | 维度 | 先去哪张卡 |
|---|---|---|
| 以为某个能力开着，实际因为配置写错没装上 | RT1 组合与启动（Composition and boot） | [RT1](./22-from-gaps-to-plan-fine.md#rt1-组合与启动composition-and-boot--处置卡remediation-card) |
| 模型行为异常，但事后说不清它当时看到了什么 | RT2 会话事实源（Session as the single source of truth） | [RT2](./22-from-gaps-to-plan-fine.md#rt2-会话事实源session-as-the-single-source-of-truth--处置卡remediation-card) |
| 升级后读不了旧数据；报错一律说"文件损坏" | RT3 格式世代与兼容（Format generations） | [RT3](./22-from-gaps-to-plan-fine.md#rt3-格式世代与兼容format-generations--处置卡remediation-card) |
| 分不清"它做完了"和"它暂时没动作了"；取消之后动作还在跑 | RT4 循环与终结边界（Loop and termination boundaries） | [RT4](./22-from-gaps-to-plan-fine.md#rt4-循环与终结边界loop-and-termination-boundaries--处置卡remediation-card) |
| 换一个模型/沙箱/存储要改一片代码 | RT5 能力 seam | [RT5](./22-from-gaps-to-plan-fine.md#rt5-能力-seam--处置卡remediation-card) |
| 加一个新能力要动核心；说不清拦截点拦不住什么 | RT6 扩展点与拦截（Extension points and interception） | [RT6](./22-from-gaps-to-plan-fine.md#rt6-扩展点与拦截extension-points-and-interception--处置卡remediation-card) |
| 同一个部署两次启动，模型看到的工具清单不一样 | RT7 模型可见面组装（Model-visible surface assembly） | [RT7](./22-from-gaps-to-plan-fine.md#rt7-模型可见面组装model-visible-surface-assembly--处置卡remediation-card) |
| 加了第二个入口，语义开始分叉；日志污染协议 | RT8 入口与协议投影（Entry surfaces and protocol projection） | [RT8](./22-from-gaps-to-plan-fine.md#rt8-入口与协议投影entry-surfaces-and-protocol-projection--处置卡remediation-card) |
| 失败被吞成"返回空"；权限检查散在每个工具里 | RT9 工具执行与授权（Tool execution and authorization） | [RT9](./22-from-gaps-to-plan-fine.md#rt9-工具执行与授权tool-execution-and-authorization--处置卡remediation-card) |
| 运行时的架构规则（插件边界、注册清理）只写在文档里，没有检查拦 | RT10 可执行治理（Executable governance） | [RT10](./22-from-gaps-to-plan-fine.md#rt10-可执行治理executable-governance--处置卡remediation-card) |
| 界面上的数字对不上；改一处要同步好几处 | RT11 客户端组装纪律（Client composition discipline） | [RT11](./22-from-gaps-to-plan-fine.md#rt11-客户端组装纪律client-composition-discipline--处置卡remediation-card) |

## 3 · 每维的最小一步

这一节只回答"这一维最少做成什么样"。命中的维度要往下做，翻 [22](./22-from-gaps-to-plan-fine.md) 的对应处置卡（remediation card）。

### 开发 Harness

| 维 | 什么时候才值得做（when it's worth doing） | 最小一步 | 做完怎么确认 |
|---|---|---|---|
| [KN1](./22-from-gaps-to-plan-fine.md#kn1-入口链entry-chain--处置卡remediation-card) 入口链（Entry chain） | 任何时候。 | 一份短的根入口文件（常驻规则（always-loaded rules） + 仓库布局 + 命令表），其余全部链接出去；如果宿主认多个文件名，用符号链接指向同一份。 | 故意把根文件里的一个链接改错，跑检查，看它红，然后还原。 |
| [KN2](./22-from-gaps-to-plan-fine.md#kn2-归属one-home-per-fact--处置卡remediation-card) 归属（One home per fact） | 任何时候，与 KN1 同批。 | 一张"事实 → home"对照表，每行同时写清**放什么**和**禁放什么**；然后按表把复制出来的正文删掉，改成链接。 | 挑一个有两份拷贝的事实，只改其中一份，看有没有任何检查或流程发现。 |
| [KN3](./22-from-gaps-to-plan-fine.md#kn3-决策记录decision-records--处置卡remediation-card) 决策记录（Decision records） | 一个已被否决的方案被第二次重新提出时。 | 一个记录目录 + 一份五节模板 + 一条判据。 | 找一条已被取代的决定，新开一个无上下文的 agent 会话，问它会怎么选。 |
| [KN4](./22-from-gaps-to-plan-fine.md#kn4-分类学repository-taxonomy--处置卡remediation-card) 分类学（Repository taxonomy） | 出现同一事实的第二份手写清单；或者生成物（generated artifact）被人手改而没有任何检查发现；或者"这个文件该放哪"被问第三次。 | 一张顶层区域表（区域 / 拥有什么 / 规则 owner），加一张"内容的维护形态"表（手写 / 生成 / 录制 / 派生（derived）的投影），每类写清"能不能手改"。 | 手改一个生成物（generated artifact），跑检查，看它红不红，然后还原。 |
| [CP1](./22-from-gaps-to-plan-fine.md#cp1-意图入口work-intake--处置卡remediation-card) 意图入口（Work intake） | 出现"做完才发现理解错了"的返工；或者提交无法回溯到它服务的意图。 | 一个工作项模板，第一段强制写两行：**外部可观察结果 + 如何观察**。 | 拿一个最近的小改动，把它关联的工作项描述交给一个无上下文的 agent 会话，让它说出这笔改动做了什么——说得出来吗？说不出，说明描述里只有"要做什么"，没有"怎么算做完"。 |
| [CP2](./22-from-gaps-to-plan-fine.md#cp2-正确路径paved-road--处置卡remediation-card) 正确路径（Paved road） | 有人在错误的地方插代码，或自己发明了一套新的接法；或者一个真实需求进来，没人答得出"改哪里"。 | 一张两列的"目标 → 机制"表。 | 拿最近一次"绕过入口"的改动，看现在的规则或检查会不会拦住它。 |
| [CP3](./22-from-gaps-to-plan-fine.md#cp3-流程固化procedural-memory--处置卡remediation-card) 流程固化（Procedural memory） | 同一类任务第三次出现，且每次做法都不一样。 | 一个"任务 → 流程文档"的目录；每份文档带触发条件（trigger）、步骤、停止条件、验证方式；只给摘要层（标题 + 适用条件），命中才读全文。 | 把一份流程文档交给一个无上下文的 agent 会话，让它照着做一遍。 |
| [CP4](./22-from-gaps-to-plan-fine.md#cp4-执行与授权链execution-and-authorization--处置卡remediation-card) 执行与授权链（Execution and authorization） | 仓库里开始有自动化代理直接改动内容，且威胁模型清晰了。 | 三件事，各一个：动作先记录再执行；统一的执行前检查；结果的单一出口。 | 加一条新权限规则，数一数改了几个文件。 |
| [EV1](./22-from-gaps-to-plan-fine.md#ev1-反馈分层feedback-layers--处置卡remediation-card) 反馈分层（Feedback layers） | 任何时候，与知识归位组同批。 | 一张表：每一层检查能证明什么、**不能单独证明什么**。 | 制造一个只在一个层能被发现的回归，跑一遍，确认**正确的那一层**抓住了它，其它层保持绿。 |
| [EV2](./22-from-gaps-to-plan-fine.md#ev2-负例控制negative-control--处置卡remediation-card) 负例控制（Negative control） | 任何时候（前置维 prerequisite dimension）；最晚在你**第一次**把一条规则接成检查的同时。 | 三件事：挑最容易被违反的三条规则，各配一个非零退出的命令；给这三个检查各做一次负例控制（negative control）；本地只跑与当前改动相关的检查，远端跑全套。 | 这一步本身就是这张卡的全部内容。 |
| [EV3](./22-from-gaps-to-plan-fine.md#ev3-闭环完整性delivery-completeness--处置卡remediation-card) 闭环完整性（Delivery completeness） | 任何时候（前置维 prerequisite dimension），排在 KN1/KN2 与 EV2 之后：同批规则要挂在归属表（ownership table）写出的 home 上，它的检查要能被证明会失败。 | 一条规则 + 一个豁免条款：实现、当前文档、回归证据在同一次交付里一起走；机械性或局部改动明确豁免，且豁免要有理由。 | 拿最近一笔变更问："文档里声称的行为，有几条**没有**任何检查钉住？"说不出，就是缺口没被管理。 |
| [EV4](./22-from-gaps-to-plan-fine.md#ev4-评审与批准review-and-approval--处置卡remediation-card) 评审与批准（Review and approval） | 出现"评审只是点通过"或者"评审全在挑格式"。 | 一份写清的批准条件（谁、几个人、什么情况下可以放行），加上一条分工纪律：**评审不重复机器已经精确拒绝的问题**。 | 数一数最近 10 笔变更的评审评论条数与内容。 |
| [ST1](./22-from-gaps-to-plan-fine.md#st1-静与动static-and-dynamic--处置卡remediation-card) 静与动（Static and dynamic） | 出现同一份配置或数据两处可写；或删掉派生（derived）后重建不出同样的结果。 | 一张四层表，每层写清：变化速度 / 承载者 / 谁能改 / **丢失代价**。 | 手改一个生成物（generated artifact），跑可重建性（rebuildability）检查，看它红不红，然后还原。 |
| [ST2](./22-from-gaps-to-plan-fine.md#st2-披露与隔离progressive-disclosure-and-isolation--处置卡remediation-card) 披露与隔离（Progressive disclosure and isolation） | 常驻规则（always-loaded rules）开始膨胀时；agent 频繁漏读或读错流程时；团队开始抱怨"规则文档越塞越多"时。 | 按压力逐项加，每项独立见效：给常驻内容设上限 → 流程文档只给摘要、命中才读全文 → 子树规则放进子树 → 委派说明只带所需部分。 | 往常驻文件里加一段内容使它超出上限，跑检查，看它红不红，然后还原。 |
| [ST3](./22-from-gaps-to-plan-fine.md#st3-运行时查询inspectability--处置卡remediation-card) 运行时查询（Inspectability） | 有人开始读源码猜"现在实际生效的是什么"；手工维护的接口清单已经维护不动；或存在多层配置叠加。 | 一条命令，dump 出最终生效的配置。 | 新增一个注册项但不改生成清单，跑检查，看它红不红。 |
| [MT1](./22-from-gaps-to-plan-fine.md#mt1-防漂移drift-prevention--处置卡remediation-card) 防漂移（Drift prevention） | 在你**第一次**外置知识的同时。 | 一个结构检查脚本 + 一段"基线与复核方式"说明。 | 见第 2 条——**这条卡的全部价值就在于它被执行过一次**。 |
| [MT2](./22-from-gaps-to-plan-fine.md#mt2-发布与版本纪律release-and-versioning--处置卡remediation-card) 发布与版本纪律（Release and versioning） | 开始对外发布产物，且出过一次"发错了"或"忘了 bump 版本"的事故。 | 一段成文发布序列 + 一份兼容承诺（哪些接口稳定、哪些明确不稳定）+ 一条不可逆产物的处理规则。 | 制造一次"内容改了但版本没动"，看发布流程会不会失败。 |

### 运行时 Harness

先做 [11 §0](./11-evaluate-runtime-harness-coarse.md#0--先做适用性applicability判定) 的适用性（applicability）判定。AQ1 答"否"时下面不适用。

| 维 | 什么时候才值得做（when it's worth doing） | 最小一步 | 做完怎么确认 |
|---|---|---|---|
| [RT1](./22-from-gaps-to-plan-fine.md#rt1-组合与启动composition-and-boot--处置卡remediation-card) 组合与启动（Composition and boot） | 配置开始由多个人改，或者出现过"以为开着实际没装"。 | 一条"dump 出最终生效配置"的命令，且它和真正启动用的是**同一套叠加算法**；加上"引用不存在的组件必须失败"。 | 把一个组件的键名改错，启动。 |
| [RT2](./22-from-gaps-to-plan-fine.md#rt2-会话事实源session-as-the-single-source-of-truth--处置卡remediation-card) 会话事实源（Session as the single source of truth） | 任何时候。 | 一条只追加的记录，把**进入模型请求的一切**都记进去——消息、system prompt、可见工具清单、动态上下文。 | 加一个动态注入的上下文片段，不改记录逻辑。 |
| [RT3](./22-from-gaps-to-plan-fine.md#rt3-格式世代与兼容format-generations--处置卡remediation-card) 格式世代与兼容（Format generations） | 持久数据要跨版本长期存活时。 | 一个版本号（**唯一权威**），加三条明确路径：能读 → 正常读；版本更旧 → 迁移；版本更新 → **拒绝并提示升级**。 | 手工把一份数据的版本号改成一个更新的值，读它。 |
| [RT4](./22-from-gaps-to-plan-fine.md#rt4-循环与终结边界loop-and-termination-boundaries--处置卡remediation-card) 循环与终结边界（Loop and termination boundaries） | 出现"它到底是做完了还是卡住了"的争论时；或者取消之后动作仍在后台继续时。 | 分层的终结概念 + **封闭的终结原因集合** + "被取消"与"已完成"的明确区分。 | 取消一个正在跑的长动作，看它在**该系统自己声明的超时预算内**是否真的停止（不是"合理时间"），并检查记录里有没有这次取消。 |
| [RT5](./22-from-gaps-to-plan-fine.md#rt5-能力-seam--处置卡remediation-card) 能力 seam | **第二个真实实现出现时。 | 一项能力的三件套：定义（能力接口）+ 实现 + 使用方；使用方只依赖定义。 | 数一数某个"可替换点"有几个使用方、几个实现。 |
| [RT6](./22-from-gaps-to-plan-fine.md#rt6-扩展点与拦截extension-points-and-interception--处置卡remediation-card) 扩展点与拦截（Extension points and interception） | 有第二个人要往上面加东西时；或者出现"为了加功能改了核心"的实例时。 | 一张"新行为 → 挂哪里"的表，右列是**可以直接执行的动作**；拦截点按权限分类，并写明各自拦不住什么。 | 拿一次"绕过扩展点"的历史改动，看现在的规则或检查拦不拦得住。 |
| [RT7](./22-from-gaps-to-plan-fine.md#rt7-模型可见面组装model-visible-surface-assembly--处置卡remediation-card) 模型可见面组装（Model-visible surface assembly） | 任何时候，与 RT2 同批。 | 每一步**显式组装**模型看到的东西（工具清单、提示词、内容块），并把组装结果写进记录。 | 让一个插件在组装完成之后再往请求里追加一段提示，跑 LX1 与 LX3。 |
| [RT8](./22-from-gaps-to-plan-fine.md#rt8-入口与协议投影entry-surfaces-and-protocol-projection--处置卡remediation-card) 入口与协议投影（Entry surfaces and protocol projection） | 第二个入口出现时。 | 所有入口通过同一套运行时接口驱动；每个协议入口有一份"故意不保证"清单。 | 往协议入口的 stdout 打一行日志，看协议还正常吗。 |
| [RT9](./22-from-gaps-to-plan-fine.md#rt9-工具执行与授权tool-execution-and-authorization--处置卡remediation-card) 工具执行与授权（Tool execution and authorization） | 任何时候。 | 三件事：动作**先记录再执行**；统一的执行前判定；结果**单一出口**（异常归一化成明确错误）。 | 让一个工具内部抛异常，看模型收到的是什么。 |
| [RT10](./22-from-gaps-to-plan-fine.md#rt10-可执行治理executable-governance--处置卡remediation-card) 可执行治理（Executable governance） | 第一条"写在文档里、可以机械判断却没人遵守"的规则出现时。 | 一个检查的**统一注册处**；加一条规则 = 加一个会失败的检查，而不是加一段文档。 | 引入一个该被抓住的回归，跑检查，看红，还原。 |
| [RT11](./22-from-gaps-to-plan-fine.md#rt11-客户端组装纪律client-composition-discipline--处置卡remediation-card) 客户端组装纪律（Client composition discipline） | 界面上出现"同一个数字两处不一样"时；或者改一个数据要在界面里同步好几处时。 | 一条规则：界面状态从权威事实**派生（derived）**，不另存一份业务数据。 | 在后台直接改一次权威数据，看界面会不会自动跟上。 |

---

## 4 · 边界与反模式

### 四条不能混淆的边界

照搬成熟样板最容易翻车的地方，是把"相似"当成"等同"。四条边界：

**1. 可读 ≠ 简单。**
归属（ownership）、清单、统一术语让复杂系统**可查询**，但包、事件和生命周期仍然复杂。把知识组织好，不会让系统本身变小。

**2. 流程文档 ≠ 强制执行。**
流程文档是指导；可机械判断的规则仍需类型、脚本、不变量（invariant）；语义问题仍需评审。**用流程文档替代检查，等于把一条会失败的规则降级成一条会被人略过的建议。**

**3. 清理 ≠ 事务回滚。**
撤销注册、释放资源这类清理动作，撤销的是它自己拥有的东西，**不会自动补偿已经发生的外部写入**。"卸载了就干净了"只在你拥有的范围内成立。

**4. 可查询 ≠ 安全沙箱。**
查询工具能看见运行状态，不代表它有修改权限，更不代表被它观察的东西受保护。**授权边界与可见性是两件事，必须分别设计。**

### 外置知识的维护成本（maintenance cost）

外置知识不是免费的。每引入一样，问一句"**谁维护它、漂了谁发现**"。

| 成本风险 | 对策 |
|---|---|
| 索引/清单过期 | 生成 + freshness 检查：与源码有 diff 就红 |
| 常驻层膨胀 | 给常驻文件设字数/字节上限；超限时先把内容挪到它该在的 home，再精简措辞，两者都不够才提高上限 |
| 过时的理由冒充现行 | 决策记录（decision record）带状态与冻结归档；归档后不再是当前权威 |
| 假门禁（gate） | 新检查必须做负例控制（negative control；见 EV2） |
| 多语言/多版本漂移（drift） | 配对与哈希校验，改一侧必须重录另一侧 |
| 记录通胀 | 只记有真实取舍的；"防错而不是数量"是唯一判据 |

### 最常见的过度投入

**在还不存在相应压力时，提前造一整套分层架构。**

具体表现：只有一个主流程、少量固定依赖、单一入口的项目，却先建了完整的插件系统、生成目录体系、不变量（invariant）检查框架。维护成本（maintenance cost）吃掉了可读性收益，而且**没人用得上**。

判据：**这一维的触发条件（trigger）出现了吗？**（见[原则三](#原则三有压力再借pressure-triggered)）没出现就记进待办，不建。

> 一个成熟样板之所以长成那样，是因为它承受过对应的压力。**照搬它的形状，而不照搬它承受过的压力，是这类工作最常见的失败。**

### 三个"不要照搬"

- **分层架构与完整扩展点体系**：那是组合压力的产物。没有多个可替换实现由稳定接口消费的需求，就不要建。
- **重型协作制度**（复杂的批准公式、多级标签体系、双语三件套）：它们有特定的协作规模和合规前提。
- **生成目录 + 不变量（invariant）检查的全套基础设施**：先有纪律，量大了再上机器。

---

## 5 · 一轮打磨的循环与停止条件

### 循环

1. 拿评估的缺口清单（gap list），按第 1 节的原则排出这一轮的 1–3 维（两份评分卡（scorecard）各自排，见原则六）。
2. 翻 [22](./22-from-gaps-to-plan-fine.md) 里对应的处置卡（remediation card）。
3. 逐条过"验收红线（acceptance red lines）"。
4. 做一次该卡的"负例控制（negative control）"。
5. 回 [开发 Harness 粗粒度（coarse-grained）](./01-evaluate-development-harness-coarse.md) 或 [运行时 Harness 粗粒度（coarse-grained）](./11-evaluate-runtime-harness-coarse.md) 复测（re-evaluation）这几维（施工过的维度按 02 / 12 定档（final grade））。
6. 看切片走查（slice walkthrough）记录与 [01 §6 的表 4](./01-evaluate-development-harness-coarse.md#6--报告格式agent-写人读)（三张清单）里"靠猜"和"没证据"的条目比上一轮少了吗（运行时侧看另一条线：实验记录里"靠我手动兜住"的分界有没有变短）。
7. 少 → 进下一轮；没少 → 这一轮做的方式有问题，回去看"学走形的样子（how it degrades）"。

### 每轮复测（re-evaluation）看三件事

1. 哪几维从低档升上去了？
2. 垂直切片（vertical slice）复测（re-evaluation）里，"靠猜"和"没证据"的条数变少了吗？
3. 有没有新引入的维护负担（新脚本、新清单、新流程），它们有 owner 吗？

运行时侧把第 2 条换成：五个活体实验（live experiment）复跑一遍，对应被评维度的那几个通过了吗。

### 停止条件

**收工线（stop line）** = 达标线（pass line） + 下面的附加条件。达标线（pass line；01 §4 与 11 §3）回答"这套机制能不能用"，收工线（stop line）回答"这一轮打磨能不能停"：

- **开发 Harness**：先满足达标线（pass line；至少 MG2，且你最痛的三维达到 **约束力（enforcement） 3**）。另加：裁剪（tailoring）后的每一维至少 **覆盖面（coverage） 2**（有且成体系；处置卡（remediation card）写明可以长期停在较低档的维度，例如 ST3，按卡里写的上限算）；切片（slice）复测（re-evaluation）里没有"完全找不到 owner"和"声称的行为零证据"这类硬伤。
- **运行时 Harness**：先满足达标线（pass line；至少 **MG2**：MG1，且事实源（source of truth）、模型可见面（model-visible surface）、工具执行与授权三维约束力（enforcement） ≥ 2）。另加：五个活体实验（live experiment）都跑过，被评维度对应的实验通过（MG2 的三维对应 LX1、LX3、LX5），被裁掉的维度对应的实验按 N/A 记录。**单机实验档例外**：RT9 属 N/A，这一档不追求 MG2，收工线（stop line）留到决定继续做之后再算（见 11 §4）。

**最终标志很朴素，两类各一个：**

> **开发 Harness：** 新来一个 agent（或人），不靠任何人带路，能把一笔普通变更从意图走到归位，并且每一步说得出证据在哪。
>
> **运行时 Harness：** 出问题时能只靠记录说清它当时看到了什么、做了什么、结果是什么。

达到本类的标志就可以停。**继续加机制不是进步**——每多一条规则、一个检查、一份清单，未来的每一笔变更都要多付一点合规成本。成熟样板的纪律里最反直觉的一条是：**机制本身也是要维护的代码。**

---

## 6 · 短例

> 承接 [开发 Harness 粗粒度（coarse-grained）](./01-evaluate-development-harness-coarse.md) §8 的构造示例。**这是演示，不是对任何真实仓库的评估。**

### 输入：缺口清单（gap list）

那家三年、6 万行、15 人的后端服务，快诊（quick check）给出五个缺口，外加 EV2 抽检与切片（slice）共同发现的一个（EV2）：

| # | 维 | 症状 | 严重度 |
|---|---|---|---|
| 1 | ST1 静与动（Static and dynamic） | OpenAPI 规范与生成的客户端两处可写；生成命令无记录 | 高 |
| 2 | KN2 归属（One home per fact） | 超时配置在代码与 README 各一份 | 高 |
| 3 | EV3 闭环完整性（Delivery completeness） | 12 篇文档里 7 篇接口描述已过期 | 高 |
| 4 | CP2 正确路径（Paved road） | 没有"目标→机制"表；新接口绕过 task queue | 中 |
| 5 | KN1 入口链（Entry chain） | 400 行 README 无路由；无 agent 入口 | 中 |
| 6 | EV2 负例控制（Negative control） | 抽检的检查说不出最近一次为红；切片（slice）发现 `TestOrderTimeoutConfig` 实际没钉住配置读取路径 | 中 |

### 第一步 · 排序

**过一遍原则一（痛点优先）**：六条里，"已经在踩"的是 #1（生成的客户端里已有三处手改，下次重新生成就会抹掉）、#2（上周已经发生过一次）、#4（三个月前绕过过一次）、#5（每次新会话都在花时间找该读哪里）、#6（那个测试现在什么都不保护）；#3 是"迟早会踩"（agent 会照过期文档写出调用不存在接口的代码）。

**过一遍原则二（前置维 prerequisite dimension）**：六条里有四条是前置维（prerequisite dimension）——#5 KN1、#2 KN2（知识归位组），#6 EV2、#3 EV3（证据与交付组）；EV1 在 01 §8 里是绿的，不在清单上。前置维（prerequisite dimension）不论痛点先排。组内顺序：先知识归位（读者找不到文档，改对内容也没用），再 EV2（验证手段先要可信），EV3 最后（它的同批规则要挂在 KN2 定下的 home 上，它的检查要能被证明会失败）。

**过一遍原则三（有压力再借 pressure-triggered）**：非前置的两条，ST1（#1）与 CP2（#4）的触发条件（trigger）都已出现（见 [ST1 卡](./22-from-gaps-to-plan-fine.md#st1-静与动static-and-dynamic--处置卡remediation-card)、[CP2 卡](./22-from-gaps-to-plan-fine.md#cp2-正确路径paved-road--处置卡remediation-card)），排在前置维（prerequisite dimension）之后。两者之间按原则一：ST1 严重度高，先做。

**重新排**（原则五：一轮一到三维）：

| 轮次 | 维度 | 理由 |
|---|---|---|
| 第 1 轮 | **KN1 入口链（Entry chain） + KN2 归属（One home per fact）** | 前置维（prerequisite dimension），知识归位组；成本低（KN1 半天、KN2 一到两天）；#5、#2 就是这两维本身的缺口，#3 的"文档过期"也是 KN2 的下游 |
| 第 2 轮 | **EV2 负例控制（Negative control）** | 前置维（prerequisite dimension）；抽检与切片（slice）已经证明现有绿灯不可信，后面每一轮的检查都要靠它才可信 |
| 第 3 轮 | **EV3 闭环完整性（Delivery completeness） + ST1 静与动（Static and dynamic）** | EV3：前置维（prerequisite dimension），接在 KN2 与 EV2 之后；ST1：触发条件（trigger）已出现，先把 `gen/client/` 里的三处手改挪回规范或生成器模板，再加"重新生成后 diff 为空"的检查 |
| 第 4 轮 | CP2 正确路径（Paved road） | 触发条件（trigger）已出现，非前置，排在 ST1 之后 |

**为什么 EV2 排在 ST1 前面。** 按严重度 ST1 更高，但 EV2 是**前置维（prerequisite dimension）**——团队现在的验证手段不可信（切片（slice）证明了），而 ST1 要加的可重建性（rebuildability）检查、EV3 要加的同批检查，都要靠负例控制（negative control）才能判断它们有没有用。**验证手段不可信时，先修验证。**

### 第二步 · 第 1 轮怎么做（KN1 + KN2）

按 [KN1 处置卡（remediation card）](./22-from-gaps-to-plan-fine.md#kn1-入口链entry-chain--处置卡remediation-card) 与 [KN2 处置卡（remediation card）](./22-from-gaps-to-plan-fine.md#kn2-归属one-home-per-fact--处置卡remediation-card)：

1. 把 400 行 README 拆开：常驻规则（always-loaded rules；缩到 30 行内）、布局（顶层目录各一句）、命令表（装/跑/测/构建）留下；架构说明、编码规范、部署步骤各自成文，从根文件链接出去。
2. 建"事实 → home"表，第一版只覆盖最容易漂的五类：配置项、公开接口、部署步骤、错误码、环境变量。
3. 按表把 `README.md` 里的"关键参数"一节删掉，改成指向 `config/` 的链接。
4. 给根文件定 2,000 词的字数上限，再加一个根入口链接检查；两者都写成 Makefile 的检查目标，接进 CI。
5. 多个入口文件名（如果团队同时用不同的 agent 宿主）用符号链接统一。

**验收红线（acceptance red lines）自查**：任意一条规则 10 秒内指得出唯一 home？——5 类里 5 类可以。删掉链接以外的复制正文，信息不丢？——"关键参数"那节删掉后，参数含义在 `config/` 里有注释，成立。

**负例控制（negative control）**：把根文件里一个链接改错，跑链接检查，看它红；还原，确认它变绿。

### 第三步 · 第 2 轮怎么做（EV2）

按 [EV2 处置卡（remediation card）](./22-from-gaps-to-plan-fine.md#ev2-负例控制negative-control--处置卡remediation-card)：

1. 挑三条最容易被违反的规则，各配一个 `exit non-zero` 命令：
   - 超时配置必须只从 `config/` 读取（切片（slice）发现的反例）；
   - 错误码只在归属表（ownership table）写明的那个文件里定义；
   - 根入口不超过 2,000 词。
2. 逐个做负例控制（negative control）：引入对应违规 → 看红 → 还原 → 确认变绿。**没钉住配置读取路径的 `TestOrderTimeoutConfig` 这一轮被重写成真的会红的版本**。
3. 把"新检查必须做负例控制（negative control）"写进贡献指南，并在本轮的评审里抽查一次。

**验收红线（acceptance red lines）自查**：三个检查都能说出最近一次为红的原因吗？——能，因为刚刚亲手制造过。

### 第四步 · 复测（re-evaluation）

第 1、2 轮做完后回到评估，重跑 KN1、KN2、EV2 三维 + 一次切片（slice）：

| 维 | 改造前 | 改造后 |
|---|---|---|
| KN1 入口链（Entry chain） | 覆盖面（coverage） 1 / 约束力（enforcement） 1 | 覆盖面（coverage） 2 / 约束力（enforcement） 3 |
| KN2 归属（One home per fact） | 覆盖面（coverage） 1 / 约束力（enforcement） 1 | 覆盖面（coverage） 2 / 约束力（enforcement） 1 |
| EV2 负例控制（Negative control） | 覆盖面（coverage） 1 / 约束力（enforcement） 0 | 覆盖面（coverage） 2 / 约束力（enforcement） 1 |

**缺口清单（gap list）变化**：六条减到四条（#2、#5 消除；#6 缩小为"老检查未经负例控制（negative control）核查"；#3 部分缓解：归属表（ownership table）给"公开接口"定了唯一 home，但过期的 7 篇还没改完、同步检查还没有；#1、#4 未动）。改造前一列是定档（final grade）：KN1、KN2 的粗判档（coarse grade）复核后不变，EV2 用 [02 §5](./02-evaluate-development-harness-fine.md#5--细粒度fine-grained示例把-ev2-从粗判档coarse-grade钉成定档final-grade) 的结果。

**为什么 KN1 约束力（enforcement）到 3、覆盖面（coverage）停在 2**：链接检查与字数上限门禁（gate）都接进了 CI，并且都做过负例控制（negative control；第 1 轮验了链接检查，第 2 轮验了字数门禁（gate）），满足 [02 的 KN1 卡](./02-evaluate-development-harness-fine.md#kn1-入口链--entry-chain)的约束力（enforcement） 3 与 02 §2 的通用条件。覆盖面（coverage） 3 还要求成文的维护触发条件（trigger；什么情况下要重新审视根入口），这一条还没写，命中"根入口没有成文的字数预算或维护触发条件（trigger） → 覆盖面（coverage）封顶（cap） 2"。

**为什么 EV2 的约束力（enforcement）停在 1**：新检查都做过负例控制（negative control），贡献指南也写了要求并在本轮评审里抽查过一次（锚点（anchor）给 2）；但 `TestLegacyExport` 这类两年没红过的老检查还没人核查，命中"存在长期未失败过的检查且无人核查"，封顶（cap）压在 1。下一轮把老检查逐个过一遍。

**为什么 KN2 的约束力（enforcement）还停在 1**："关键参数"那份拷贝删掉后，超时配置只剩一个家；但"代码里的接口改了、对应的接口文档跟着改"这类耦合还靠人记得，命中"有'改了 A 必须同时改 B'的耦合却没有同步机制 → 覆盖面（coverage）封顶（cap） 2、约束力（enforcement）封顶（cap） 1"。这一条留到第 3 轮——**它和 EV3 闭环完整性（Delivery completeness）是同一件事的两面**。

### 这个短例想说明的

- **严重度不是唯一的排序依据**；前置维（prerequisite dimension；KN1、KN2、EV1、EV2、EV3）要提前。
- **验证手段不可信时，先修验证**，再做依赖验证的改动。
- **一轮不要贪多**：第 1 轮只动了 KN1 + KN2。KN2 的约束力（enforcement）要升到 2 需要一条同步检查，它要等 EV2 的负例控制（negative control）纪律立起来之后，和 EV3 一起在第 3 轮做。
- **收敛的标志是缺口清单（gap list）变短**，不是评分卡（scorecard）变好看。

---

## 附录 · 一页速查

### 排序口诀

```
开发 Harness：
  前置先做：入口、归属（ownership）、反馈、负例、闭环
  伴随做：防漂移（drift prevention；每外置一份知识就配检查）
  有压力再做：决策记录（decision record）、分类、意图入口、正确路径、流程、执行链、评审、静与动、披露、查询、发布

运行时 Harness（先做适用性（applicability）判定）：
  前置先做：会话事实源（source of truth）、模型可见面（model-visible surface）、工具执行与授权
  有压力再做：格式世代、终结边界、能力 seam、扩展点、治理、入口投影、客户端纪律、组合与启动
  最便宜的三刀：坏配置大声失败、结果单一出口、终结原因封闭化

通用：一轮一到三维，先便宜的，做完复测（re-evaluation）
  两套都评时：CP4/ST1/ST2/ST3 与 RT9/RT2/RT7/RT1 名字相近但对象不同，各评各的
```

### 收工线（stop line）

```
开发 Harness：
  达标线（pass line）：MG2，且最痛的三维 = 约束力（enforcement） 3
  另加：十七维（裁剪（tailoring）后）全部 ≥ 覆盖面（coverage） 2（卡片写明可停在较低档的按卡片上限）
  另加：切片（slice）复测（re-evaluation）无「找不到 owner」「声称零证据」
  标志：新人/新 agent 不靠带路能走完一笔变更，每步说得出证据在哪

运行时 Harness：
  达标线（pass line）：MG2（可重建）：MG1，且事实源（source of truth）、模型可见面（model-visible surface）、工具执行与授权 ≥ 约束力（enforcement） 2
  另加：五个活体实验（live experiment）都跑过；被评维度对应的实验通过（MG2 的三维对应 LX1、LX3、LX5）
  例外：单机实验档不追求 MG2，收工线（stop line）留到决定继续做之后再算
  标志：出问题时能只靠记录说清「它当时看到了什么、做了什么、结果是什么」
```

**两类都适用的最终判据。** 一个系统"像回事"的标志不是它有多少机制，而是——**当一个陌生人（人或 agent）接手时，他能不能不靠任何人口头补充，走完一次完整的工作，并在每一步说得出证据在哪。**

---

**相关文档。** [开发 Harness 粗粒度（coarse-grained）](./01-evaluate-development-harness-coarse.md)（十七维与粗判（coarse check）；探针（probe）、锚点（anchor）与封顶（cap）在 [02](./02-evaluate-development-harness-fine.md)）· [运行时 Harness 粗粒度（coarse-grained）](./11-evaluate-runtime-harness-coarse.md)（十一维、五个活体实验（live experiment）、模仿判断；探针（probe）、锚点（anchor）与封顶（cap）在 [12](./12-evaluate-runtime-harness-fine.md)）。本文是这两份的共同下游：**它们负责诊断，本文负责决定下一步做什么**。
