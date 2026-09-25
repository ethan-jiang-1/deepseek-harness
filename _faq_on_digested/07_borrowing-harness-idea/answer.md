# Answer · 借鉴 DSH Harness 思路：让 coding agent 不糊涂、不乱发挥

## 一句话结论

DSH 没有去训练「一个足够聪明、不会糊涂、不会乱发挥的 agent」；它做的是把这句话反过来——**让「读对、改对」变成阻力最小的路径，让「读错、改错」在离错误源头最近的地方被机器拒绝。** 而支撑这个反转的，是三条贯穿其开发全过程的立场；落到一笔变更上，则是一条从意图到交付的完整闭环。

## 这道题为什么难，答卷怎么构成

「另一个项目想借鉴 DSH」不是一道能一句话答完的题——它同时问了两件性质不同的事：**理解上**，DSH 的可借鉴性不是某个机制，而是一整套彼此咬合的立场，拆开单个抄就会走形；**行动上**，普通项目的资源、架构和协作规模都不同，抄什么、不抄什么、先抄什么，需要一张可执行的路线图。一句话结论只给出了方向，没有给出这两个层面的完整答案。

所以这份答卷分成**道与术两段，用一个分水岭接起来**：

- **道（01–05）回答「理解」**——五个大概念（变更闭环、归属、决策记录、静与动、正确路径），每篇按同一副骨架讲：为什么要有这道（agent 开发里哪类失败逼出了它）→ DSH 怎么应对 → DSH 怎么落地（真实文件与实例，最重的部分）→ 怎么迁移。道不落地就是虚无缥缈——所以每篇的落地段都配可以直接打开的 DSH 实物。
- **术（07–12）回答「行动」**——执行态的六个专题（可执行反馈、迁移清单、入口链、Skills、运行时查询、披露管线），讲每个机制怎么具体做对，配写法标准和学走形检查。
- **分水岭（06）**——道的概念齐了、动手还没开始的那个点：先拿一笔真实变更做垂直切片（诊断），再按 Phase 顺序施工。道告诉你「应该成为什么」，术告诉你「怎么一步步做到」；两段合起来，才是这个难题的完整答案。

本页的角色是**答卷的导读**：先给出精华（三条立场）和它们组织成的三层模型，再给三问自检、立即借/有压力再借/不要照搬的分寸，最后是阅读次序。各章细节不在这里展开。

## DSH 的精华：三条立场

要借鉴 DSH，先得说清它的精华到底是什么。不是插件架构，不是 TypeScript 单仓，甚至不是它的工具链——是三个所有普通项目都能检查自己有没有的立场：

1. **agent 是一等参与者。** DSH 的开发主力自称就是 coding agent。正因为它天然缺背景、会忘、会走捷径，整个仓库才被迫把知识外置成可发现的入口（`AGENTS.md`、包 README、决策记录），而不是靠资深成员的脑子和口口相传。写给 agent 读，和写给人读，是两种不同的纪律。
2. **规则是可执行的代码。** 「文档要双语相等」「PR 要引用 Issue」「评审要求是什么」——全部接成仓库里跑得起来的检查（gates、policy 脚本、CI workflow），违规直接红在检查里。DSH 的原话：*Agents follow enforced gates far more reliably than prose conventions*。写在贡献指南里靠自觉的规则，和接在 CI 里会拦人的规则，是两种东西。
3. **每类事实有唯一的 owner。** 意图归 Issue 或任务上下文、决定理由归 Agent Note、当前行为归源码与 README、回归证据归测试、交付状态归 GitHub——一处一个权威，不重复、不漂移。一处事实两个家，早晚分叉。

这三条立场落到一笔真实变更上的完整演示，就在本目录：跟着一笔真实提交（`5124a2a310`，模型选择器显示 model ID）从任务意图走到合并后知识归位，逐环打开上游可核对的产品文件——见 [`变更闭环`](./01-sdlc-change-loop.md)。

## 三层模型：精华怎样组织成可借的形态

三条立场散落在机制的各个角落，DSH 用三个维度把它们组织起来。普通项目借鉴时，也按这三层自查：

| 层 | 回答什么 | DSH 的做法 | 借用的最小形态 |
|---|---|---|---|
| **变更闭环（时间顺序）** | 一笔变更从「要得到什么」走到「怎样证明、谁来判断、交付后留下什么」，怎样接力 | 任务/Issue 的可观察验收 → 有条件的决定 → 代码、当前文档、回归证据同一变更交付 → 聚焦本地检查、CI、语义 review、merge | 先拿一笔真实变更按此走通（见 [`变更闭环`](./01-sdlc-change-loop.md) 的迁移表、[`落地总纲`](./06-step-by-step-guide.md) Phase 0.5） |
| **知识与决定（归属）** | 下一任 agent 如何区分现在、理由、旧方案和计划 | 现状归代码/README，持久取舍归 owning Note，单次实施步骤归 Plan，行为证据归测试 | 简明 ADR、owner、状态与取代纪律（完整章见 [`决策记录`](./03-decision-notes.md)） |
| **渐进披露（读取时机）** | 此刻该加载哪份最小权威资料，超预算怎么办 | 短常驻规则只负责路由，任务命中才读完整流程，按需读 owner；自建 agent host 再加注入预算和回收 | 入口文件短、只做路由（见 [`入口链`](./07-agents-entry-chain.md)） |

三层不是依次建三个系统：**变更闭环管时间，知识归属管事实去向，渐进披露管读取时机和上下文成本**。最有用的检验方式，是拿一笔真实变更把三层一起跑一遍——三层在这笔变更上共同工作，才是「借鉴成功」的样子。

## 三问自检：症状层的快诊

三层模型是「病因」，三问是「症状」。给自己项目打分时用这三问，定位卡在哪一层：

1. **知识外置了吗？** 规则、结构、改哪里、为什么这样设计、怎么做，是写进了可搜索、可检查的文件，还是只活在资深成员脑子里？（对应立场 1+3）
2. **正确入口明确吗？** 一个新参与者能不能从任务目标出发，找到 owner、范本和升级条件，而不是每次都靠猜代码位置？（对应立场 1）
3. **错误何时被发现？** 是编译/加载/本地测试/运行时/CI/review 就抓住，还是上线之后才爆？（对应立场 2）

「不糊涂」主要由第 1 问回答；「不乱发挥」由第 2、3 问回答。三问都绿，三条立场基本就位；三问里有红的，回三层模型找对应层补课。

## 立即借 / 有压力再借 / 不要照搬

- **立即借**（几乎零架构依赖，普通项目的第一桶金）：拿一笔真实变更跑通闭环（[`落地总纲`](./06-step-by-step-guide.md) Phase 0.5，对照表见 [`变更闭环`](./01-sdlc-change-loop.md)）；短 `AGENTS.md` 只放常驻规则（[`落地总纲`](./06-step-by-step-guide.md) Phase 1，实物见 [`归属`](./02-legibility-ownership.md) 落地实物节）；一个事实一个 owner、决策理由与当前文档分开（[`归属`](./02-legibility-ownership.md)；何时写决策记录见 [`决策记录`](./03-decision-notes.md)）；可机械规则接成 `exit non-zero` 检查并做负例控制（[`落地总纲`](./06-step-by-step-guide.md) Phase 4，六层反馈见 [`可执行反馈`](./09-executable-feedback.md)）。
- **有压力再借**（确有对应压力才值得）：Skills 目录（同类任务反复出现；真实 Skill 文件的写法标准见 [`Skills`](./11-skills-as-procedural-memory.md) 落地实物节）；生成 catalog（声明面大到手工清单漂移）；注入预算与 compaction（上下文吃紧、长任务活不下来，[`披露管线`](./13-progressive-disclosure-pipeline.md)）。
- **不要照搬**：插件图与 capability seam 全家桶（那是组合压力的产物）；DSH 的 Project/标签/加权批准制度（它有特定的协作规模前提）；双语 triplet 与 hash 配对（除非你的项目真的双语平等）。

## 总览表：困惑类型 → 借用机制 → 落地动作

| 你的症状 | DSH 的机制 | 段位 | 落地动作（章节） |
|---|---|---|---|
| agent 交付了没法验证的半成品 | 变更闭环：实现+文档+证据同 PR，缺口如实标注 | 道 | 拿一笔真实变更按证据地图逐项核对（见 [`变更闭环`](./01-sdlc-change-loop.md)、[`落地总纲`](./06-step-by-step-guide.md) Phase 0.5） |
| agent 读完还是抓不住主线 | 分层入口 + 根指令只放 standing orders | 道 | 写一份短 `AGENTS.md`（`CLAUDE.md` 用 symlink 指向它），只放常驻规则 + 布局 + 命令，其余 link 出去（见 [`入口链`](./07-agents-entry-chain.md)） |
| agent 分不清「现在的事实」和「当初的理由」 | 当前文档 vs Agent Note 分开 | 道 | 决策理由单独进 `docs/adr/` 或 `notes/`，文档只写 now（见 [`归属`](./02-legibility-ownership.md)） |
| agent 反复提出已否定的方案 | 负知识外置（rejected note、Known Limitations） | 道 | 记下「为什么不做 X」，而不是只记「做了什么」（见 [`归属`](./02-legibility-ownership.md)、[`决策记录`](./03-decision-notes.md)） |
| 同一个事实存了两处、越跑越分叉 | 静/动分界：事实源唯一，其余派生 | 道 | 按「规则/配置/事实源/派生」四层给数据划家（见 [`静与动`](./04-static-vs-dynamic.md)） |
| agent 改错地方 / 造出新接入方式 | 正确路径 + 参与阶梯 + 归属路由 | 道 | 写一张「目标 → 机制」归属表，cookbook 给出范本（见 [`正确路径`](./05-paved-road-and-ladder.md)） |
| agent 做了坏事要等 review 才知道 | 可执行反馈：类型 / load / 测试 / snapshot / invariant / CI | 术 | 把可机械判断的规则做成 `exit non-zero` 的脚本，并证明负例会失败（见 [`可执行反馈`](./09-executable-feedback.md)） |
| agent 一次读太多上下文、记不住 | 渐进披露 + 按需加载 Skill | 术 | 规则分层，任务命中才加载对应流程文档（见 [`Skills`](./11-skills-as-procedural-memory.md)） |
| agent 每轮看到的上下文爆炸、长任务活不下来 | 按需注入 + 运行时组装 + compaction 回收 | 术 | 注入给预算/去重；catalog 只给摘要；超预算压缩且保留 tool-call/result 配对（见 [`披露管线`](./13-progressive-disclosure-pipeline.md)） |
| agent 靠猜源码而不是问实际状态 | `--dump-config`、生成 catalog、inspect 工具 | 术 | 至少提供一条「查实际配置/注册项」的命令（见 [`运行时查询`](./12-runtime-inspection.md)） |

「段位」列对应三段式结构：**道（01–05）= 概念与落地实物，术（07–12）= 执行态细节**；静态/动态轴的分界本身由 [`静与动`](./04-static-vs-dynamic.md) 拥有。

## 三句话记住它

- **DSH 的精华是三条立场：agent 一等参与、规则可执行、事实有唯一 owner。** 其余都是这三条落到具体机制后的形状。
- **「不糊涂」靠外置与归属，「不乱发挥」靠正确路径加早失败——都不靠 agent 更聪明。**
- **照搬的顺序是：先拿一笔真实变更跑通闭环，再立规矩的 owner，再接可执行反馈，最后才按需加 Skills 和运行时查询。**

## 阅读次序：先道后术，道要落地

**文件编号就是阅读顺序；标题不带序号，以后调整次序不会让标题和内容对不上号。** 各段的构成逻辑见上文「这道题为什么难，答卷怎么构成」；这里只给次序：

### 道（01–05）：五个大概念

1. [`变更闭环`](./01-sdlc-change-loop.md)——一笔变更从意图到归位；「借鉴成功」长什么样。
2. [`归属`](./02-legibility-ownership.md)——一个事实一个 owner；知识的家。
3. [`决策记录`](./03-decision-notes.md)——何时写 ADR、状态、取代与归档。
4. [`静与动`](./04-static-vs-dynamic.md)——read-only 层与动态层的分界；agent 开发里最容易糊涂的数据与状态问题。
5. [`正确路径`](./05-paved-road-and-ladder.md)——改哪里：归属表与参与阶梯。

读完五篇，三条立场就落地成了五个可核对的概念。

### 分水岭（06）：开始动手

[`落地总纲`](./06-step-by-step-guide.md)——先按**道的五个维度**评估你手上的 harness（Phase 0），再拿一笔真实变更跑垂直切片（Phase 0.5），然后按评估结果一轮一轮打磨，直到「像回事」——新来一个 agent 不靠带路，能把一笔变更从意图走到归位。**读到这里就停下读书、开始干活；后面的术，做到哪读到哪。**

### 术（07–13）：执行态的细节

**前三篇是三巨头——harness 面向 agent 的顶顶重要的三条链**：入口链管 agent **读什么**（输入侧），执行链管 agent **做什么**（输出侧），反馈管 agent**做错了会不会被抓住**（验证侧）。三者咬合，agent 的每个动作都被覆盖：

6. [`入口链`](./07-agents-entry-chain.md)——AGENTS.md 的文件态与会话态；agent 的第一印象。
7. [`执行链`](./08-task-execution-chain.md)——一个 tool-call 从策略、审批、沙箱、执行到落日志的完整管线。
8. [`反馈`](./09-executable-feedback.md)——六层反馈 + 负例控制，做 Phase 4 时读。

其余四篇按需进站：

9. [`迁移清单`](./10-transfer-playbook.md)——做完头几个 Phase 后核对：优先级与四个边界，防学走形。
10. [`Skills`](./11-skills-as-procedural-memory.md)——做 Phase 5 时读：流程文档的写法标准。
11. [`运行时查询`](./12-runtime-inspection.md)——做 Phase 6 时读：三个查询面。
12. [`披露管线`](./13-progressive-disclosure-pipeline.md)——上下文吃紧时读：注入、组装、回收、隔离。

### 压尾（14 + reference/research，按需）

[`问题框架`](./14-two-failures-as-missing-info.md)（「糊涂/乱发挥」翻译成信息缺口——全套材料的 why）、[`reference.md`](./reference.md)（各章上游证据总账——想核对时读）、`research.md`（整理过程账本）——想深挖时再进。

一句话：**道五篇读懂概念和实物，06 动手，术做到哪读到哪。**

## 补充入口

- **想看 DSH 精华落成动作的完整演示**：读 [`变更闭环`](./01-sdlc-change-loop.md)——一笔真实提交从意图到归位的逐环对照表，三条立场全部在里头现过身；本 FAQ 的角色是把它和其余机制翻译成普通项目可迁移的动作。

**证据与兜底**：各章声称的 DSH 事实，上游一手出处集中在 [`reference.md`](./reference.md)——按需核对，不读不影响理解（渐进披露用在 FAQ 自己身上）；[`research.md`](./research.md) 是整理过程的内部账本（复核历史与语料出处）。本目录自带 [`verify.mjs`](../verify.mjs)（UTF-8 / 换行 / 链接 / 锚点），修改后运行 `node _faq_on_digested/verify.mjs`；防漂移纪律的落地清单见 [`落地总纲`](./06-step-by-step-guide.md) Phase 7——这个 FAQ 讲的机制，自己也在用。

**自包含**：整套目录可以单独拿走用。指向 DSH 仓库的引用全部是钉版在固定 commit `46a7f68b09` 的 GitHub 绝对 URL——任何人、任何机器都能点开核对，不需要 clone 这个仓库；目录间互链只在 `_faq_on_digested` 家族内部。抄走这套 FAQ 的人，唯一断不了的依赖就是公网。

**按状态读（静态/动态轴）**：这条轴本身由 [`静与动`](./04-static-vs-dynamic.md) 拥有（四层分界 + 三条切换纪律）。偏静态的章——归属、正确路径、入口链文件态、Skills 仓库面；偏动态的章——静与动、运行时查询、披露管线、入口链会话态、Skills 模型可见面。根入口文档的静态设计细节归 [`04_root-entry-doc-design`](../04_root-entry-doc-design/answer.md)，运行时消费归 [`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/answer.md)。

## 继续阅读（按文件号索引，含段位与一句话定位）

- [`01-sdlc-change-loop.md`](./01-sdlc-change-loop.md)：【道】变更闭环——一笔变更从意图走到归位
- [`02-legibility-ownership.md`](./02-legibility-ownership.md)：【道】归属——一个事实一个 owner（含 one home 落地实物）
- [`03-decision-notes.md`](./03-decision-notes.md)：【道】决策记录——何时写、状态、取代与归档、最小 ADR 模板
- [`04-static-vs-dynamic.md`](./04-static-vs-dynamic.md)：【道】静与动——read-only 层与动态层的分界
- [`05-paved-road-and-ladder.md`](./05-paved-road-and-ladder.md)：【道】正确路径——归属表实物 + 参与阶梯
- [`06-step-by-step-guide.md`](./06-step-by-step-guide.md)：【分水岭】**一步一步怎么做——落地总纲**
- [`07-agents-entry-chain.md`](./07-agents-entry-chain.md)：【术·三巨头】入口链——agent 读什么：AGENTS.md 文件态与会话态
- [`08-task-execution-chain.md`](./08-task-execution-chain.md)：【术·三巨头】执行链——agent 做什么：tool-call 从策略到落日志的管线
- [`09-executable-feedback.md`](./09-executable-feedback.md)：【术·三巨头】反馈——做错了会被抓住：六层反馈 + 负例控制
- [`10-transfer-playbook.md`](./10-transfer-playbook.md)：【术】迁移清单——优先级与四个边界
- [`11-skills-as-procedural-memory.md`](./11-skills-as-procedural-memory.md)：【术】Skills——程序化工作记忆（含 Skill 文件落地实物）
- [`12-runtime-inspection.md`](./12-runtime-inspection.md)：【术】运行时查询——不靠猜源码
- [`13-progressive-disclosure-pipeline.md`](./13-progressive-disclosure-pipeline.md)：【术】披露管线——静态 + 注入 + 组装 + 回收 + 隔离
- [`14-two-failures-as-missing-info.md`](./14-two-failures-as-missing-info.md)：【背景】问题框架——糊涂/乱发挥的信息缺口
- [`reference.md`](./reference.md)：各章上游证据总账（按需核对）
- [`research.md`](./research.md)：整理过程账本（复核历史与语料出处）
