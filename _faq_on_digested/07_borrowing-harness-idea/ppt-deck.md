# DeepSeek Harness 项目组织 · PPT 五页稿

> **用法**：`---` 是分页符，每页一节（抬头 + 要点 + 一行口播稿），可直接转成 PPT。素材来自本目录 [`answer.md`](./answer.md) 与 [`01`](./01-two-failures-as-missing-info.md)–[`10`](./10-progressive-disclosure-pipeline.md)，不重抄 DSH `docs/` 正文；事实基线为 DSH `dsh-v0.1.5-rc.2`。
>
> **一份 PPT 要回答的问题**：DSH 这个项目是怎么被组织起来的？为什么一个 fresh coding agent 进来之后，既不糊涂（抓不住主线、读错、脑补），也不乱发挥（改错地方、绕过约束、自作主张）？

---

## 第 1 页 · 全景与主张：不赌聪明，赌成本结构

**一句话结论**：DSH 没有去训练一个"不会糊涂、不会乱发挥"的 agent；它把这句话反过来——**让"读对、改对"变成阻力最小的路径，让"读错、改错"在离错误源头最近的地方被机器拒绝。**

**要点**

- **前提**：这个仓库的开发主力就是 coding agent。它天然缺背景、会忘、会走捷径——仓库必须先按这个前提来组织，而不是假设读者什么都记得。
- **三个检验问题**：知识外置了吗？正确入口明确吗？错误何时被发现？——分别测**知识外置 / 正确路径 / 反馈延迟**。三问都不需要插件架构，任何仓库都能用。
- **两个失败，六个缺口**：「糊涂」= 不知道铁律、不知道系统怎么组成、不知道当初为什么这样设计；「乱发挥」= 不知道改动该落在哪、不知道该按什么流程、不知道怎么证明自己做对了。
- **关键反转**：不指望换一个更聪明的模型来解决，而是**把知识写进可搜索、可检查的文件，把规则接到能失败的命令上**。原话是：*Agents follow enforced gates far more reliably than prose conventions.*
- **后面四页的路线**：结构（谁拥有哪个事实）→ 入口（从哪进来）→ 路径与反馈（该改哪里、错了何时被抓）→ 运行时与落地（每轮看到什么、按什么顺序搬）。

**口播稿（一行）**：DSH 的立场是别赌模型更聪明——改造仓库本身，让做对成为最省力的那条路，让做错在最近的地方撞墙。

> 出处：[`answer.md`](./answer.md)、[`01-two-failures-as-missing-info.md`](./01-two-failures-as-missing-info.md)

---

## 第 2 页 · 项目结构：一个事实一个 owner

**一句话结论**：项目结构的第一原则不是"文件怎么放"，而是**归属**——每类事实只住在负责它的那一层，别处只放链接。

**要点**

- **物理布局（顶层）**：`packages/`（按 group 分的能力与插件）、`docs/`（架构与当前合同）、`.agents/`（skills + notes）、`scripts/`（门禁与生成器）、`snapshots/`、`vendor/`、`python/`、`native/`、`benchmarks/`。
- **tier taxonomy（谁说什么话）**：根 `AGENTS.md` = 每轮必读的常驻规则；子树 `AGENTS.md` = 该子树的专属规则；package `README` = 每包当前合同；Skill = 可复用的流程与判断标准。四层各写各的，不互相复制。
- **one home per fact**：一个事实一个家，其余地方只 link——先消灭"同一条规则在多处各写一版、然后互相漂移"。
- **当前事实 vs 决策理由必须分开**：`docs/` 只写"系统现在怎样"，决策记录（Agent Note / ADR）写"为什么这样决定、什么方案输了、后果是什么"。混在一起会产生两个相反的失败：只读代码会重走已否定的路，只读记录会把历史实现误当当前 API。
- **负知识也要有 owner**：明确记下"为什么不走这条""已知限制是什么""这里为什么没有某个检查"——否则 agent 会把"明确的缺席"当成"遗漏"，反复提出已被否决的方案。
- **可读 ≠ 文件少**：可读性的度量不是"读了多少"，而是"能不能便宜地找到那份最小且权威的材料，并知道下一层该读什么"。

**口播稿（一行）**：项目结构先解决归属问题——根指令只放常驻规则，每类事实一个家，当前状态和当初的理由分开放，连"为什么不做"也要写下来。

> 出处：[`02-legibility-ownership.md`](./02-legibility-ownership.md)、[`09-agents-entry-chain.md`](./09-agents-entry-chain.md)、[`../../AGENTS.md`](../../AGENTS.md)、[`../../docs/AGENTS.md`](../../docs/AGENTS.md)

---

## 第 3 页 · 入口链：fresh agent 进来先看到什么

**一句话结论**：入口不是一份大文档，而是**一条路**——从 symlink 到根指令、到子树指令、再到各 README，每多走一步才付那一步的上下文成本。

**要点**

- **物理链路**：`CLAUDE.md`（symlink）→ 根 `AGENTS.md` → 少量子树 `AGENTS.md` → 各 `README.md`。
- **`CLAUDE.md` 是 symlink，不是副本**：不同 agent 宿主约定不同文件名（Claude 类读 `CLAUDE.md`，其它读 `AGENTS.md`），但每个目录里事实只能有一份——symlink 让"改规则"只有一个动作、一个 home。
- **根 `AGENTS.md` 只放三类东西**：常驻规则（每条 1–3 行、链到 home）、仓库布局（每个顶层区域一句话）、命令表。教程、历史故事、详细流程一律不写——它们该 link 出去。
- **子树 `AGENTS.md` 是"合适个数"**：只在"该子树有专属常驻规则"时才放；大多数包只有 `README.md` 是正确结果，不是缺口。AGENTS 是路由层，README 才是当前合同的事实层。
- **常驻层有硬预算**：根 `AGENTS.md` ≤ 1,950 词、`packages/AGENTS.md` ≤ 750 词、`docs/AGENTS.md` ≤ 1,320 词、`packages/README.md` ≤ 994 词，由 `verify-doc-budgets` 校验——防止入口文件膨胀成总览。
- **两种状态分开看**：**文件态**（磁盘上的链路怎么写，几乎零成本、宿主自动加载第一环就生效）与**会话态**（活 session 里怎么被注入、去重、回收，贵且 DSH 特有）。

**口播稿（一行）**：入口链是写文件的工程，不是写插件的工程——先做文件态：短根指令 + symlink + 克制个数的子树指令 + 字数预算。

> 出处：[`09-agents-entry-chain.md`](./09-agents-entry-chain.md)、[`02-legibility-ownership.md`](./02-legibility-ownership.md)

---

## 第 4 页 · 两道闸：不乱发挥是怎么被防住的

**一句话结论**：正确路径只能降低"改错地方"的概率，拦不住"改错了还自认为对"——所以还需要第二道闸：让错误在离来源最近的地方被机器抓住。

**闸一 · 正确路径（先问归属，再谈实现）**

- **归属问题先于实现问题**：第一个设计判断不是"在哪个函数里插代码"，而是"这个功能属于哪一类"。
- **成文归属表**：新行为挂到已成文的扩展点；只有真的要改核心循环时，才更新那张地图。原文：*New behavior attaches to a documented extension point.*
- **L0–L3 参与阶梯**：配置/组合 → 扩展点 → capability seam（Service Definition + Provider + Consumer）→ 核心 loop。**阶梯不是价值排序**：本可用 L0/L1 表达却一路爬到 L3 改核心，正是"乱发挥"的典型形态。
- **五问缩小选择**：其中第 4 问是**横切义务**（无论选哪层都要查）——只要新增了"模型可见"的事实，就必须同步事件表并从 session log 投影出来；模型可见 ⟺ 落日志。
- **生命周期只有一套所有权**：注册即 effect，插件卸载 / HMR / 显式 dispose 走同一条清理路径——agent 不用在"临时注册"和"正式注册"之间二选一。

**闸二 · 可执行反馈（做错了早被发现）**

- **六层反馈，各证明一件事**：编译 → load/parser → 局部测试 → 组装快照 → 运行时 invariant → 语义 review。**绿色一层不代表其它层也绿**：coverage 绿不代表产品能跑，snapshot 绿不代表 API 合理。
- **每条可机械判断的规则，配一个 `exit non-zero` 的命令**：CI 跑穷举集合，git hook 只保留低延迟项——反馈按成本分层，不是为了降低本地标准。
- **负例控制**：新检查必须"引入回归 → 看它变红 → 还原"，否则可能是一个永远为绿的摆设。
- **最高杠杆、也最常被漏掉的一条**：规则只写进 prose、不接执行，agent 的乱发挥就只能等 review 才被抓。

**口播稿（一行）**：第一道闸让你知道该改哪里，第二道闸让你改错了立刻被机器抓住——两道都到位，才算把"乱发挥"堵上。

> 出处：[`03-paved-road-and-ladder.md`](./03-paved-road-and-ladder.md)、[`04-executable-feedback.md`](./04-executable-feedback.md)、[`../../docs/architecture.md`](../../docs/architecture.md)

---

## 第 5 页 · 运行时与落地：披露管线，按成本顺序搬

**一句话结论**："按需"不是写作纪律，而是一条**五层管线**——静态组织、按需注入、运行时组装、溢出回收、隔离边界；而搬家顺序只有一句：先立规矩的 owner，再铺正确路径，再接可执行反馈，最后才按需加 Skills 和运行时查询。

**A. 渐进披露的五层管线**

| 层 | 回答什么 | 关键机制 |
|---|---|---|
| 1 静态组织 | 每种知识住哪、多大、什么时候读 | tier taxonomy、字数预算、AGENTS.md 骨架、生成 catalog |
| 2 按需注入 | 这一轮该把哪些文件拉进上下文 | 触达才加载（touch-driven）、`maxBytes` 预算、按 digest 去重 |
| 3 运行时组装 | 这一轮模型实际看到什么 | system prompt 按 scope 组装；skill catalog 只给摘要、正文 on-demand；tool 可见集按 scope 收缩 |
| 4 溢出回收 | 上下文超预算怎么办 | token meter + compaction + tool 结果裁剪，**保留 tool-call/result 配对** |
| 5 隔离边界 | 谁能看到什么 | subagent spawn 不带父历史，fork 只带一个平衡过的 seed |

**B. 落地顺序（收益/成本从高到低，每步可独立验收）**

- **Phase 0** 用三问给项目打分，指着一个具体的返工说出它属于哪个缺口 → **Phase 1** 立规矩的 owner（短根 `AGENTS.md` + symlink + 事实→home 表，**收益最高**）→ **Phase 2** 划清"现在"和"为什么"（含负知识）→ **Phase 3** 铺正确路径（归属表 + 2–3 份 cookbook）→ **Phase 4** 把可机械规则接到执行（**回报第二高**）→ **Phase 5** 固化任务流程 → **Phase 6** 加运行时查询 → **Phase 7** 防漂移。
- **一个周末的 MVP**：短 `AGENTS.md` + `CLAUDE.md` symlink；决策理由进 `docs/adr/`、`docs/` 只写 now；一张"目标 → 机制"归属表；2–3 条规则接成 `exit non-zero` 并各做一次负例控制。**这四件事覆盖八成收益，且不需要任何插件架构。**
- **照搬会反噬的四个边界**：可读 ≠ 简单、Skill ≠ enforcement、清理 ≠ 事务回滚、运行时查询 ≠ 安全沙箱。
- **最容易犯的过度投入**：在还不存在"组合压力"时，提前造一整套插件 / 生成目录 / invariant 架构，结果维护成本吃掉可读性收益——seam 三角色与运行时 inspect 是组合压力的产物，不是默认项。
- **最后一条纪律**：外置的知识会漂，所以**给外置知识本身配机器检查**（verify 脚本 + 钉基线 + 改事实只改它的 home）。

**口播稿（一行）**：披露是分层、有预算、可回收的；落地就按成本顺序走——先 owner，再路径，再反馈，Skills 和运行时查询留到真有压力的时候。

> 出处：[`10-progressive-disclosure-pipeline.md`](./10-progressive-disclosure-pipeline.md)、[`08-step-by-step-guide.md`](./08-step-by-step-guide.md)、[`07-transfer-playbook.md`](./07-transfer-playbook.md)
