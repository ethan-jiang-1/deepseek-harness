# Answer · 借鉴 DSH Harness 思路：让 coding agent 不糊涂、不乱发挥

## 一句话结论

DSH 没有去训练「一个足够聪明、不会糊涂、不会乱发挥的 agent」；它做的是把这句话反过来——**让「读对、改对」变成阻力最小的路径，让「读错、改错」在离错误源头最近的地方被机器拒绝。** 而支撑这个反转的，是三条贯穿其开发全过程的立场；落到一笔变更上，则是一条从意图到交付的完整闭环。

## DSH 的精华：三条立场

要借鉴 DSH，先得说清它的精华到底是什么。不是插件架构，不是 TypeScript 单仓，甚至不是它的工具链——是三个所有普通项目都能检查自己有没有的立场：

1. **agent 是一等参与者。** DSH 的开发主力自称就是 coding agent。正因为它天然缺背景、会忘、会走捷径，整个仓库才被迫把知识外置成可发现的入口（`AGENTS.md`、包 README、决策记录），而不是靠资深成员的脑子和口口相传。写给 agent 读，和写给人读，是两种不同的纪律。
2. **规则是可执行的代码。** 「文档要双语相等」「PR 要引用 Issue」「评审要求是什么」——全部接成仓库里跑得起来的检查（gates、policy 脚本、CI workflow），违规直接红在检查里。DSH 的原话：*Agents follow enforced gates far more reliably than prose conventions*。写在贡献指南里靠自觉的规则，和接在 CI 里会拦人的规则，是两种东西。
3. **每类事实有唯一的 owner。** 意图归 Issue 或任务上下文、决定理由归 Agent Note、当前行为归源码与 README、回归证据归测试、交付状态归 GitHub——一处一个权威，不重复、不漂移。一处事实两个家，早晚分叉。

这三条立场在 DSH 的 SDLC Tutorial 里有完整的一次「落成动作」演示：跟着一笔真实小变更（模型选择器显示 model ID）从任务意图走到合并后知识归位，每一步打开实际文件、标注证据边界——见 [`_agent_ready_development/sdlc-tutorial/00-index.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-tutorial/00-index.md)。

## 三层模型：精华怎样组织成可借的形态

三条立场散落在机制的各个角落，DSH 用三个维度把它们组织起来。普通项目借鉴时，也按这三层自查：

| 层 | 回答什么 | DSH 的做法 | 借用的最小形态 |
|---|---|---|---|
| **变更闭环（时间顺序）** | 一笔变更从「要得到什么」走到「怎样证明、谁来判断、交付后留下什么」，怎样接力 | 任务/Issue 的可观察验收 → 有条件的决定 → 代码、当前文档、回归证据同一变更交付 → 聚焦本地检查、CI、语义 review、merge | 先拿一笔真实变更按此走通（见 11 的迁移表、08 的 Phase 0.5） |
| **知识与决定（归属）** | 下一任 agent 如何区分现在、理由、旧方案和计划 | 现状归代码/README，持久取舍归 owning Note，单次实施步骤归 Plan，行为证据归测试 | 简明 ADR、owner、状态与取代纪律（完整章见 12） |
| **渐进披露（读取时机）** | 此刻该加载哪份最小权威资料，超预算怎么办 | 短常驻规则只负责路由，任务命中才读完整流程，按需读 owner；自建 agent host 再加注入预算和回收 | 入口文件短、只做路由（见 09） |

三层不是依次建三个系统：**变更闭环管时间，知识归属管事实去向，渐进披露管读取时机和上下文成本**。最有用的检验方式，是拿一笔真实变更把三层一起跑一遍——三层在这笔变更上共同工作，才是「借鉴成功」的样子。

## 三问自检：症状层的快诊

三层模型是「病因」，三问是「症状」。给自己项目打分时用这三问，定位卡在哪一层：

1. **知识外置了吗？** 规则、结构、改哪里、为什么这样设计、怎么做，是写进了可搜索、可检查的文件，还是只活在资深成员脑子里？（对应立场 1+3）
2. **正确入口明确吗？** 一个新参与者能不能从任务目标出发，找到 owner、范本和升级条件，而不是每次都靠猜代码位置？（对应立场 1）
3. **错误何时被发现？** 是编译/加载/本地测试/运行时/CI/review 就抓住，还是上线之后才爆？（对应立场 2）

「不糊涂」主要由第 1 问回答；「不乱发挥」由第 2、3 问回答。三问都绿，三条立场基本就位；三问里有红的，回三层模型找对应层补课。

## 立即借 / 有压力再借 / 不要照搬

- **立即借**（几乎零架构依赖，普通项目的第一桶金）：短 `AGENTS.md` 只放常驻规则、一个事实一个 owner、决策理由与当前文档分开、可机械规则接成 `exit non-zero` 检查并做负例控制、拿一笔真实变更跑通闭环。
- **有压力再借**（确有对应压力才值得）：Skills 目录（同类任务反复出现）、生成 catalog（声明面大到手工清单漂移）、注入预算与 compaction（上下文吃紧、长任务活不下来）。
- **不要照搬**：插件图与 capability seam 全家桶（那是组合压力的产物）、DSH 的 Project/标签/加权批准制度（它有特定的协作规模前提）、双语 triplet 与 hash 配对（除非你的项目真的双语平等）。

## 总览表：困惑类型 → 借用机制 → 落地动作

| 你的症状 | DSH 的机制 | 状态 | 落地动作（章节目录） |
|---|---|---|---|
| agent 交付了没法验证的半成品 | 变更闭环：实现+文档+证据同 PR，缺口如实标注 | 跨状态 | 拿一笔真实变更按证据地图逐项核对（见 08 Phase 0.5、Tutorial 交叉引用） |
| agent 读完还是抓不住主线 | 分层入口 + 根指令只放 standing orders | 静态 | 写一份短 `AGENTS.md`（`CLAUDE.md` 用 symlink 指向它），只放常驻规则 + 布局 + 命令，其余 link 出去（见 09） |
| agent 分不清「现在的事实」和「当初的理由」 | 当前文档 vs Agent Note 分开 | 静态 | 决策理由单独进 `docs/adr/` 或 `notes/`，文档只写 now（见 02） |
| agent 反复提出已否定的方案 | 负知识外置（rejected note、Known Limitations） | 静态 | 记下「为什么不做 X」，而不是只记「做了什么」（见 02） |
| agent 改错地方 / 造出新接入方式 | 正确路径 + 参与阶梯 + 归属路由 | 跨状态 | 写一张「目标 → 机制」归属表，cookbook 给出范本（见 03） |
| agent 做了坏事要等 review 才知道 | 可执行反馈：类型 / load / 测试 / snapshot / invariant / CI | 跨状态 | 把可机械判断的规则做成 `exit non-zero` 的脚本，并证明负例会失败（见 04） |
| agent 一次读太多上下文、记不住 | 渐进披露 + 按需加载 Skill | 跨状态 | 规则分层，任务命中才加载对应流程文档（见 05、10） |
| agent 每轮看到的上下文爆炸、长任务活不下来 | 按需注入 + 运行时组装 + compaction 回收 | 动态 | 注入给预算/去重；catalog 只给摘要；超预算压缩且保留 tool-call/result 配对（见 10） |
| agent 靠猜源码而不是问实际状态 | `--dump-config`、生成 catalog、inspect 工具 | 动态 | 至少提供一条「查实际配置/注册项」的命令（见 06） |

「状态」列与 04/05 同轴：**静态 = 仓库/文件面**，**动态 = 运行时/会话面**，**跨状态 = 一章内同时含两面**（各章顶部有声明）。

## 三句话记住它

- **DSH 的精华是三条立场：agent 一等参与、规则可执行、事实有唯一 owner。** 其余都是这三条落到具体机制后的形状。
- **「不糊涂」靠外置与归属，「不乱发挥」靠正确路径加早失败——都不靠 agent 更聪明。**
- **照搬的顺序是：先拿一笔真实变更跑通闭环，再立规矩的 owner，再接可执行反馈，最后才按需加 Skills 和运行时查询。**

## 阅读路径

- **主线**：按 `01 → 08` 读，是一条「拆问题 → 讲机制 → 给落地顺序」的完整叙事；`08` 是落地总纲；`11`（变更闭环迁移桥）与 `12`（决策记录章）是两个专题深化，分别读完 `08` 的 Phase 0.5 和 `02` 之后读最顺。
- **想先看 DSH 精华落成动作的完整演示**：读 [`_agent_ready_development/sdlc-tutorial/`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-tutorial/00-index.md)——一笔真实变更从意图到合并的全程走查，三层模型与三条立场全部在里头现过身；本 FAQ 的角色是把它和其余机制翻译成普通项目可迁移的动作。
- **两条深化**：`09`（AGENTS.md 入口链）是 `02`「渐进披露」的物理落地，读完 `02` 即可读；`10`（渐进披露管线）是 `02/05/09` 的运行时补全，读完 `09` 再读。它们排在后面只是编号顺序，不是依赖顺序。
- **证据**：`research.md` 是全部 blockquote 的出处总表，写的时候逐条核对过。
- **兜底**：本目录自带 [`verify.mjs`](../verify.mjs)（UTF-8 / 换行 / 链接 / 锚点），基线钉在 `research.md`；防漂移纪律的完整落地清单见 `08` Phase 7——这个 FAQ 讲的机制，自己也在用。
- **自包含**：整套目录可以单独拿走用。指向 DSH 仓库的引用全部是钉版在固定 commit `46a7f68b09` 的 GitHub 绝对 URL——任何人、任何机器都能点开核对，不需要 clone 这个仓库；目录间互链只在 `_faq_on_digested` 家族内部。抄走这套 FAQ 的人，唯一断不了的依赖就是公网。

**按状态读（与 04/05 的静态/动态轴对齐）**：

- **静态（仓库/文件面）**：02（可读性）、03（归属地图）、09（入口链文件态）、05 的仓库面——DSH 侧设计归 [`04_root-entry-doc-design`](../04_root-entry-doc-design/answer.md)；
- **动态（运行时/会话面）**：06（运行时查询）、10（运行时管线）、09（入口链会话态）、05 的模型可见面——根入口文档的消费归 [`05_root-entry-doc-navigation`](../05_root-entry-doc-navigation/answer.md)；
- **元/行动**：01（问题框架）、07（迁移清单）、08（落地顺序）——不贴状态标签，它们管「问什么、先搬什么、怎么做」。

## 继续阅读

- [`01-two-failures-as-missing-info.md`](./01-two-failures-as-missing-info.md)：先拆「糊涂 / 乱发挥」
- [`02-legibility-ownership.md`](./02-legibility-ownership.md)：不糊涂的地基
- [`03-paved-road-and-ladder.md`](./03-paved-road-and-ladder.md)：不乱发挥·改哪里
- [`04-executable-feedback.md`](./04-executable-feedback.md)：不乱发挥·早失败
- [`05-skills-as-procedural-memory.md`](./05-skills-as-procedural-memory.md)：省上下文、稳住判断
- [`06-runtime-inspection.md`](./06-runtime-inspection.md)：不靠猜源码
- [`07-transfer-playbook.md`](./07-transfer-playbook.md)：优先级、三问框架与边界
- [`08-step-by-step-guide.md`](./08-step-by-step-guide.md)：**一步一步怎么做**
- [`09-agents-entry-chain.md`](./09-agents-entry-chain.md)：AGENTS.md 入口链（文件态骨架 → 04、会话态加载 → 05、迁移顺序）
- [`10-progressive-disclosure-pipeline.md`](./10-progressive-disclosure-pipeline.md)：渐进披露的完整五层管线（静态 + 按需注入 + 运行时组装 + 溢出回收 + 隔离）
- [`11-sdlc-change-loop.md`](./11-sdlc-change-loop.md)：变更闭环的迁移桥（DSH 承载者 → 普通项目最小承载者 → 验收）
- [`12-decision-notes.md`](./12-decision-notes.md)：决策记录完整章（何时写、状态、取代与归档、最小 ADR 模板）
- [`research.md`](./research.md)：证据原文与来源
