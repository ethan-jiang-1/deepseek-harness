# FAQ 15 研究底稿

四路证据：A 库内基线（自查）、B owner 复盘（口述 + 三个子面：B2 仓库盘点 / B3 流程笔记深读 / B4 会话日志取证）、C 社区插件抽样（委派）、D 外部 discourse（委派）。证据强度记号：【一手】文件/提交/官方文档；【口述】owner 自述；【推断】从证据推出的结论，需说明依据。

以下是 2026-09-26 的采样和引文记录，保留当时的分类便于复核，**不直接作为本轮修订后的结论**。C 路由公开仓库的目录和提交推断开发过程，不能观察私有计划或提示；D 路原调查漏掉 Osmani 2026-06-07 原文，且把停止条件与外层调度写成统一的术语门槛，现按 [01 篇](./01-slice-vs-pipeline.md)、[02 篇](./02-external-trend-verdict.md)重读。旧句「上游留白管线层」「OpenSpec 每阶段人审」「社区零采用」「行业终局收敛」均不能超出各自证据范围；一手记录及时间点保留，不把当时推断悄悄改成新的观测。

- 委派记录（2026-09-26）：C 路生态抽样 = `e41d02b3`；D 路外部 discourse = `5be21018`；B3 路笔记深读 = `0baa63d4`；B4 路会话日志 = `2263266e`。

## A 路 · 库内基线（2026-09-26 自查，产品基线 `46a7f68b09`）

### 1. 上游对插件作者只教机制，不教流程

- `docs/user/develop/basic/index.md`：第一节「What is a plugin?」= 一个 `apply` 函数；全篇教 overlay 挂载、`ctx.effect()` 清理、`inject` 依赖——没有一句流程要求（无 spec/plan/queue 字样）。
- `docs/user/develop/practice/index.md`：三角色能力设计（Service Definition / Provider / Consumer）——是**结构纪律**（seam 怎么切），不是**过程纪律**（先做什么后做什么、谁审批）。
- 对照：DSH 对**仓库内**贡献者有流程义务（AGENTS.md、Agent Note 同 diff、Issue 引用、pre-push checks）；对**仓库外**插件作者只有机制文档。流程以惯例扩散——owner repo 的写法是「DSH 依据与生命周期见 `vendor/dsh/.agents/notes/README.md`；按需读取」（`ai_dsh_assitant/AGENTS.md`）。【一手】

### 2. 上游刻意不做管线层（队列/次序/在途）

- 根目录无 `ROADMAP.md`/`roadmap.md`（ls 实证）；docs/AGENTS.md 的 slop checklist 明把 implementation-status 注记当腐化（「Status rots」）。【一手】
- `.agents/notes/README.md:19`：「The active lifecycle tree is the working inventory… **Do not add a centralized `INDEX.md`**」——集中视图被门禁禁止。【一手】
- `:12`/`:46`：`proposed/` 是「reviewed before implementation; not yet built」的提案层，「substantial future work starts in `proposed/`」——无次序、无当前指针、无状态板语义。【一手】
- `:121`：生命周期搬移（proposed→implemented/rejected）是**同 diff 机械改写**（改 `Status:` 行 + 重验骨架）——状态变化只活在 git 里，对不翻 git 的人不可见。→ 这正是 owner「不知道他是像看板一样挪来挪去的，还是干啥的」的制度根源。【一手+推断】
- FAQ 13 dev-loop 第 2.5 阶段已结论：「**DSH 没有 roadmap/计划层文件**：Issue 是队列，proposed Note 是 spec」。本篇把它接为前提。【二手（本目录）】

### 3. 运行时给人的人面控制点

- **plan mode**：可选审阅边界，`/plan` 进入、`exit_plan_mode` 呈批（批准 / 继续计划）；「guides rather than restricts: every tool stays available」（`packages/plan/README.md`）；批准前不动文件是行为约定而非机制强制（FAQ 13 dev-loop 第 3 阶段）。【一手】
- **todo_write**：会话级任务清单，「Interactive hosts show the standing plan from the list」（`packages/todo/README.md`）——人可见，但清单**属于创建它的会话**，跨会话/跨 feature 无库存。【一手】
- **goal**：每会话一个持久目标；durable `goal/change` 事件 + `GoalView`（objective / phase / roundsStarted / maxGoalRounds）；`goal-round-driver` 把活跃 goal 变成自动续轮；`goal/activation-changed`「clients consume this event for live status」；人面入口是 `/goal` 命令（packages/goal README：「people can inspect or control it directly with `/goal` without spending a model turn」）（`docs/subsystems/goal.md`）。→ 机制**有人面**，但 owner 报告「那个 goal 是什么都还搞不清楚」——B4 已判定：goal 全由 agent 代建代管、owner 从未亲手创建，`/goal` 人面未被使用。【一手+B4 已证】
- 另有 user-questions seam（`ask_user_question`）、approval policy、guard 等人面闸门（未深读，与本题主线关系弱，标注即可）。【一手】

## B 路 · owner 口述复盘（2026-09-26）

### 原话（语音转写整理，尽量保留原表述）

> 原来（OpenSpec 那种 SDD），我是很清楚哪个 feature 近、哪个 feature 落地的次序，这个 feature 怎么测过的、质量怎么样，通通都知道，尤其是执行的次序。但是在这回我的四个（插件）……DSH 插件开发过程中，搭框架的时候，把控力就没那么强了。我只是时不时提醒他：我们要计划计划，准备做什么内容进去。总之（进展在哪）对我来说是看不太清楚的，直到他说做好了我一看，我才知道他做了几个东西。所以我时不时要强调：你要做任何东西，别你想，你要显性化到 notes 底下的 proposal 里头。然后其实 notes 底下的好几个东西，你也不知道他是像看板一样挪来挪去的，还是干啥的。反正有时候就得提醒他。不像别的 SDD 这个东西很清楚，尤其是 OpenSpec 非常清楚，这种情况下把控力是非常好的。现在这种变成 goal 追问的这种，我甚至那个 goal 是什么都还搞不清楚，就一直催促着他往前跑。这个体感的差异其实很大。

术语备注：owner 使用的是 loop engineering。它描述体感，不表示 DSH 官方用这个名称规定插件开发流程。

### 初步编码 A：owner 实际动用过的控制点

1. 【口述】口头提醒计划——对话内、非正式、即时性（「我们要计划计划，准备做什么内容进去」）。
2. 【口述】要求显性化到 `notes/proposed`——把 DSH 的决策记录机制当任务登记面用（「你要做任何东西，别你想，你要显性化到 proposal 里头」）。
3. 【口述】事后验收——agent 报告完成后人工查看（「他说做好了我一看，才知道他做了几个东西」）。

### 初步编码 B：owner 感到缺失的可见性

1. 队列与次序：哪个 feature 在队里、落地顺序。
2. 在途状态：agent 此刻在做什么、已经做了几个。
3. proposal 的状态语义：「不知道他是像看板一样挪来挪去的，还是干啥的」——proposed 文件有没有被移动/改写/取代，人不可见。
4. 逐 feature 的验证与质量汇总（SDD 时代「怎么测过的、质量怎么样」都知道）。
5. goal 机制本身的内容与状态：「那个 goal 是什么都还搞不清楚」。

### 与库内制度的对位（已由 A 路逐条证实，引用见 A 路节）

- 【推断】DSH 有意不做 roadmap/队列文件：Issue 是队列、proposed Note 是 spec（FAQ 13 dev-loop 第 2.5 阶段）——owner 缺的第 1 项是**制度性留白**，不是漏做。
- 【推断】`todo_write` 是会话内反馈面，属于创建它的会话，不跨会话（packages/todo README）——多 feature 长跑的「在途状态」活在会话里，不活在 repo 里。
- 【推断】plan mode 是用户选择的审阅边界，非必经（packages/plan README）——owner 没把它当常备门（B4 后记：20 个采样会话中 plan mode 零进入），把控感就少了一个人工审批点。
- 【推断】goal 有人面命令 `/goal`（packages/goal README：inspect or control without spending a model turn）——owner「goal 是什么都搞不清楚」（B4 已答：owner 从未亲手创建 goal，全由 agent 代建代管——机制在而未被 owner 直用）。
- 【推断】proposed/ 无看板语义：supersession、归档都是同 diff 的机械改写（FAQ 13 dev-loop 第 2/4 阶段），人只有在翻 git 时才看得见动作。

## B2 路 · owner 插件仓库取证（2026-09-26 自查）

### 仓库盘点：四个插件 repo 全是 FAQ 13 方案 A 形状，但管线层各自生长

| repo（插件） | 管线层（队列/当前指针） | 形状要点 |
|---|---|---|
| `ai_dsh_assitant`（dsh-smart-assistant，领域专家助手） | `ROADMAP.md`，**中途立制**（commit `a303e99`，借 ai_dsh_company D23/D24 之形） | 队列+搁置池+维护规则；标记 ▶ 可开工 / ⏸ 等用户拍板 / 🧹 卫生小修 / ⏳ 触发型；条目 ≤3 行；两道 verify 门禁（proposal-scheduled / proposal-graduated） |
| `ai_dsh_company`（company-pack / wochen 五角色） | `ROADMAP.md`，repo 骨架即有（`25f7c13`），现为条目制（D23/D24） | ▶ 同一时刻只应有一个；无标记=已批准待办（Plan Mode 呈批策略写在队列头）；⏸ 阻塞池；磨清单带升队条件 |
| `ai_dsh_deep_research`（deep-research-pack 四角色） | `roadmap.md`，R1 框架提交即带「队列制流程骨架」（`ea0d3b7`） | 每行标可执行性 `等人/可自主`（入口链据此决定「取题还是开工」）；搁置池每行带复活条件；生命周期显式含「Plan Mode 呈批」 |
| `ai_dsh_architect`（dsh-plugin-architect，脚手架+评审） | run queue as roadmap（`a4442b8` boundary protocol），**run 结束后队列 note 按自身协议退役**（`8571431`） | 有界项目的相位边界协议：每阶段过门即提交，不过门回退到上个边界 |

### 痛点 → 机制：控制面是跟着痛点补的，不是一次搬入 SDD

- `a303e99`（assistant 立条目制）的动因原文：「首跑活反证抓到 tri-line 赖在 proposed/」→ 补 proposal-graduated 门禁；「不要从 git log 或记忆发明任务」→ AGENTS.md:14-15（「现在在哪、接下来做什么的唯一权威 = `ROADMAP.md`…开工前先读它」）。
- `ai_dsh_assitant/AGENTS.md:22`：「`notes/proposed/` 不是停车场（proposal-scheduled / proposal-graduated 两道 verify 门禁管）」；`:23-25`：「**进行中的工作显式化（用户拍板）：开工即立卡 `notes/proposed/`**……看不见的工作等于没在做」。
- `ai_dsh_company/ROADMAP.md` 头注：「无标记 = 已批准待办（**范围**已在 RFC 里获批；轮到它时**是否还需 Plan Mode 呈批按 dev-loop §0.5 判**——用户已明确批准具体计划时不重复求批，否则默认先呈批）」「**列表顺序 = 默认执行次序**，次序只在本列表定义（不另立计划/顺序文件）」。
- `ai_dsh_deep_research/roadmap.md` 头注：「生命周期 = 索引行 → RFC → Plan Mode 呈批 → 实施（todo 面板）→ 同 diff 收尾（RFC 毕业到 implemented/ + 队列行删除）」「每行必须标注可执行性：`等人` = 需真人输入，静默期推不动；`可自主` = 代理可独立推进」。

### 提交史形状（近 12 条抽样）

- assistant：全部为「切片 + 显式验收」消息（尾带「验收：verify 31/31 exit 0」类证据）；含用户拍板落卡记录（`433a3ca`「形态落地（用户拍板：右侧栏 tab）」）与分片指令（`1f43c01`「用户已拍板按序全做，五切片各自独立提交」）。
- architect：phase boundary 提交序列（`5a0ba33`→`8571431`）落实 boundary protocol；阶段产物「converts to implemented and the queue's Nth row lands」。
- deep_research：收尾语言是「毕业/离队/移交」（`d8ca46a`「毕业：『信噪比整治』离队——RFC 迁 implemented + 队列行删除 + ▶ 移交『研究类型覆盖』」）。

### 初步结论（后经 A/C/D 三路互证成立，见 answer 与 01/03/04 篇）

1. owner 缺的「队列/次序/在途/看板」控制面，上游刻意不给（见 A 路第 2 条），owner 在 4 个 repo 里**各自造了薄版**，形态随项目类型分化（常青产品 / 批量 / 研究 run / 有界 run），且跨 repo 扩散（assistant 借 company 之形）。
2. 这些控制面是**痛点驱动逐个补的**，动因就写在立制 commit 与 AGENTS.md 里——不是引入整套 SDD。
3. Plan Mode 从上游的「可选审阅边界」变成 owner repo 里**队列条目的默认呈批步骤**：SDD 的「门」以薄形式回归，但挂在队列行与 RFC 上，不是挂在一份上游大 spec 上。

## B3 路 · owner 流程笔记深读（委派子代理 `0baa63d4`，2026-09-26 回填；全部引语带 文件:行号）

### 时间线与扩散方向：company 是源头仓，控制面全部事后补建

四仓建于 09-21 → 09-25（五天窗口）。扩散方向：**company（09-21，建仓即有 roadmap）→ assistant（09-24 立条目制，明写「借 ai_dsh_company D23/D24 之形」）与 deep_research（09-23 建仓即移植其结论）→ architect（09-25 把整套面产品化为可评分的 8 条 DSH 对齐画像，自己不设队列）**。所有「第二波补丁」（等人/可自主标记、指针活性门禁、历史段删除、在办/已办分组）集中在 09-26——即 09-25 三场静默马拉松（goal 无人值守 8h/8h/4h）之后（时间相关推断，非笔记明示因果）。

### 痛点 → 机制因果链（原文锚点）

| 日期 | 痛点（owner 原话） | 产物 |
|---|---|---|
| 09-22 | 「roadmap 一定要消化掉 notes/proposed 里的东西」（company R4 收尾实测） | `proposal-scheduled` 门禁（company `scripts/verify.mjs:301` 注释原文记起因） |
| 09-23 | 「听由 Agent 自己弄，**等某一步结束才知道是怎么回事**」+「以为最早就知道 DSH 的研发流程，跑下来感觉不太像；我们是靠 roadmap 跑的」 | 轮内任务面 = 反馈双门：呈批（门①）+ TodoPanel steer（门②）（dsh-inround-task-surface.md:9-11, 87-89；B4：门①实际载体为 ask_user_question） |
| 09-24 | 「换了对话接下来做哪一个怎么判断」 | ROADMAP 立条目制 + AGENTS.md「唯一权威=ROADMAP、不从 git log 或记忆发明任务」（roadmap-queue note:5-7） |
| 09-24 | 「看不见的工作等于没在做」（用户拍板，ca5fa9f） | 开工即立卡 `notes/proposed/` |
| 09-24 | 「不以对话内共识代替落盘」（用户确认的工作方式） | 「计划先落盘再执行」（company dev-loop.md:28-29） |
| 09-25 | 「看不出当前/将来/过去式」 | notes 生命周期统一改写（fa1611c） |
| 09-26 | 静默马拉松暴露「▶ 指向已完成条目，commit message 却声称已更新」+ 非 md 指针 404 ×13 | `queue-pointer-live` / `proposed-pointer-live` 门禁；「等人/可自主」行标；ROADMAP 历史段 429→71 行 |

**最讽刺的一条（子代理标注）**：「在场的东西没人用：todo_write 挂在每一个会话上……用户的痛点（『等结束才知道怎么回事』）的解法**一直就在输入框上方**」（dsh-inround-task-surface.md:161-164）——机制在场，缺的是把它变成习惯的纪律；后来纪律被写成 dev-loop 的强制步骤。

### goal 机制实录：被白盒研究、被当作 ROADMAP ▶ 条目的运行时载体

- repo1 iteration-rhythm（09-23）是完整机制白盒：goal-round-driver 只认 `source.kind==='goal'` 的轮次、`maxGoalRounds` 自动 block、`<goal_round>` 提示注入、轮间让路栅栏；结论「**DSH 的 backlog 语义刻意留给领域插件**……harness 层提供的是机制，不提供节奏政策」（:31-34）——owner 在其上建了节拍器与提案槽，并否决自建队列（「DSH 明确不做 backlog 是有理由的」:59-60）。
- company digital-twin note：赞赏 goal 的人类闸门——`requireDirectHuman`，笔记写「模型不能自己 resume」、重启即 disarmed（:185-204）。代码口径更窄：create / edit / pause 要求当前轮有直接人类消息，objective 仍由模型写入；只有暂停态 resume 被工具拒绝（`packages/goal/tool-goal/src/index.ts`，"the model cannot resume a paused goal"）。笔记把 create 也读成「模型不能自己做」，过宽。
- deep_research 三场马拉松全部以 goal 为载体（首场 12 提交、步步为营、门禁咬作者一次——「门禁咬作者 = 设计起效」）；marathon3 记录用户在 goal 里改优先级（「先别搞逻辑了，先把界面弄对」）。
- 四仓 notes **未发现**字面 `/goal` 命令或 `create_goal` 的使用叙述；「催促」零命中——与体感最接近的原文即「等某一步结束才知道是怎么回事」。（B4 已证：goal 全部由 agent 代建代管，见 B4 路。）

### 「DSH 没有 → owner 补的」对照（上游结论转引自四仓笔记并经本 checkout 佐证）

无 roadmap/队列文件（「roadmap 在 DSH 的分层里没有职责空位」，dsh-inround:130；计划目录被上游明文否决「creates a second durable home」:71-75）→ 根部队列 ×3 仓；todo/plan「可用反馈面但无使用纪律」（「缺习惯不缺机制」:142）→ 反馈双门写成强制流程；goal 只给轮次/上限/栅栏 → 长程 goal 目标写法（交付型/打磨型+三类停止条件，dev-loop.md:33）；无可执行性概念 → 等人/可自主；无 proposal↔queue 一致性门禁 → proposal-scheduled/graduated + 指针活性门禁；无维护轮记录 → round record + P1-P8 画像。
**DSH 有而 owner 没照搬的**：Issue/PR 流、stacked PR、CI 矩阵、双语 note、词数预算——「adds ceremony with no consumer」（dsh-aligned-profile note:19）。补的是**队列**不是任务清单：各仓恪守「不要发明 tasks.md」（60-dev-loop.md:16-17）。

### 与 owner 口述的对账

口述「时不时提醒他计划计划 / 显性化到 proposal / 做好了才知道做了几个 / goal 搞不清楚」与笔记记录的因果链**逐条对上**：提醒→反馈双门与计划落盘；显性化→立卡纪律与 proposal 门禁；「做好了才知道」→ TodoPanel 未用 + 在办/已办分组事故；「goal 搞不清楚」→ 队列语义外置在 ROADMAP、轮次语义在会话 goal，两个权威面分工未在 owner 心智里对齐（且 /goal 人面存在但未被使用）。

## B4 路 · 会话日志取证（委派子代理 `2263266e`，2026-09-26 回填）

数据面：`~/.dsh/sessions/` 6 目录、229 个会话文件，采样 20 个最大会话（v4 优先）逐事件分析；行号 = 解压后 JSONL 行号。

### goal 机制实录：全程由 agent 代建代管，owner 从未亲手创建

- 所有 goal 创建事件（`goal/change` 的 create）都紧跟 agent 的 `create_goal` tool/call——**没有一例是 owner 直接创建**；owner 偶尔口头要求设立（arch L10「变成你的一个 ongoing goal」、deep L8955「你记着搞一个 ongoing goal 怕你忘了」）。
- objective 原文高度具体（数百字含判据），并被多次 `edit` 精确吸收 owner 更正（asst L189「信噪比是主线术语（用户更正：不是性价比）」；L7520「这些要更新到 Paused Goal 里面成为 ongoing goal」→L7528 edit→L7561 resume）——**goal 是 agent 的工作记忆与控制意图的记录载体，不是 owner 的仪表**。「goal 搞不清楚」由此完全解释：owner 不读写 goal 文本，只通过对话让 agent 代管。
- 「goal 追问」量化：arch_edf7144d 98 turns 中 **73 次（75%）由 goal 续轮驱动、仅 24 条人类消息**；asst 长期 goal maxGoalRounds=60、25 次续轮。owner 对 goal 状态失控的原话：comp L3579「你应该有一个 goal 啊, 没有看到, 是结束了吗?」、asst L5448「我们现在的 goal 已经 reach 了吗? Meet 了吗」。

### plan mode 从未进入；批准回路实际由 ask_user_question 承载

20 个会话**零 plan/* 事件**；exit_plan_mode 仅 1 次真实调用（deep L738），立即报错「only available in plan mode」（L739），agent 降级用 ask_user_question 呈批获「批准，按 A 执行（推荐）」（L743-744）。ask_user_question 共 38 次且被认真用于计划批准（comp L611-612 plan_approval=「批准，看板 v1 只读（推荐）」）。**B3 路笔记里写的「Plan Mode 呈批」流程，实际执行载体是 ask_user_question**——机制写法与运行时载体分离。

### owner 控制行为画像（20 会话，多标签计数）

干预密度 0.7–7.5 条/h（马拉松化会话最低：arch 0.9、deep 1.1）；提醒计划 44 / 催促推进 86 / steer 收窄 21 / 事后验收 60 / goal 话题 35；≤40 字短消息 123 条（大量「继续」）。代表性原文：
- 入口=粗目标+规划指令：asst L10「先做第一步，先规划规划……显性的把你打算要做什么放到 notes/proposed 规划好了之后，再往前推进，明白吗」。
- 事后验收/不信任：「昨天布置了你一个长城任务啊，没感觉你干了多长时间就结束了。我是有怀疑你干出来的质量怎么样，现在但是我也没空」（deep L2605）；「这么快就完全对齐了吗？我不太相信」（asst L1895）；「你确认你已经都弄好了吗？一下子弄好概率不大呀」（arch L1872）。
- loop 体感的会话内自述：「最早我抱怨你，告诉你一件事，你三下五除二就做完了……让你设定一个沟（goal），一直往前蹦。但我看你……蹦了没两下你就说结束了」（asst L2400）；「我有点烦，干一会儿看你说停下来，然后再继续……我们至少 setup 一个比较长的 goal，好不好……这个 plan 一旦我们推敲好了之后，你就可以静默自主地一口气干到结果出来」（asst_128dbcce L1044-1053）。
- 授权放行：「沿着这个计划一直往前跑吧，不要停下来」（asst L116）；「你跑的时候我是不在的……你就模拟我在场回答他」（deep L2068——HITL 点由 agent 代答，一次性验收）。

### plan 与 todo 的实际使用

todo_write 45 次/19 会话（1–20 项、整表替换），但 **goal 驱动最重的会话里 todo 反而稀疏**（arch 98 turns 仅 4 次）——持久状态面实际是仓内 ROADMAP.md + notes/proposed（AGENTS.md 随会话注入）。

### 控制模式的时间演化

08-27→09-12（awesome-dsh-plugin 会话）：goal 事件 **0**；09-23 深夜 goal 首次出现；09-24 拍板「开工即立卡」；09-25 起演进为「静默马拉松 8 小时 + 一次性验收 + HITL 代答」。**控制模式五天内从「逐条盯」迁移到「设定 goal + 验收制」**——这正是「体感偏向 loop engineering」的形成过程，有日志时间戳。

## C 路 · 社区插件抽样（委派子代理 `e41d02b3`，2026-09-26 回填）

### 生态地图
上游 236,281★；发现机制 = `dsh-plugin` topic（宽口径 16,179，噪声大）+ awesome 榜单 + dshplugin.app（自称 2,653 indexed）+ npm。awesome-dsh-plugin（owner 本地 fork `data/plugins/` 3,552 条目：ui 590 / tools 474 / dev 268…；公开 org 仓 16.9k★）；收录标准哲学（contributing.md）：「**A green CI run is the precondition, not the decision. A maintainer reads the target repository before merging.**」「Overstating is the one thing that gets an otherwise-good plugin sent back」。npm 月下载头部：model-proxy 112.4k、dsh-find-plugin 25.8k。spec-kit v1.0.4（2026-09-02）「Add DeepSeek Harness (DSH) integration (#4336)」——SDD 工具链官方桥已铺，尚无插件仓采用。

### 抽样判定（15 仓）：目标开跑 ≈10 / 目标开跑+自建计划·审批门禁 ≈3 / 自建 spec 体系 1 / 无公开过程痕迹 1

原底稿把前两档叫「纯 loop / loop+门禁」。复审改为「目标开跑」：这是行为标签，仓库文本没有使用 loop engineering 这个名字。
- 垂直切片是默认提交形状（issue→修复→测试→版本号→CHANGELOG；commit body 收尾报「Checks: … npm test 64/64 pass」）；**无两段式 proposal→implement 提交史**。
- 验证门禁是通用底座；进阶者自建门禁类：check-peer-range、verify-bundle、plugin-doctor、docs-drift、mutation-checked tests、打包后装进官方 DSH Web 的集成门（zenstory-ai/oh-story-dsh）。
- 公开目录中**未观察到 Spec Kit/OpenSpec 典型产物**：这 15 仓及当时检查的周边仓库无 `.specify/`、`openspec/`；nexu-io/open-design 有自建 specs/current+change 体系（17 个 change spec 目录，含 SuccessCriteria/Verification 的 spec.md）。这不能判定作者是否在别处做 spec-first，也不能推算插件生态整体的采用率。
- 把控力应对 = **管线层自建，不外挂 SDD**：①净化公开树（GooDAnDReaDY/dsh-context-lens purge 内部 AGENTS.md/docs/plans/：「Public tree for v0.1.23 … without internal documents」）；②计划/评审写进 agent 指令（jianxx/dsh-cc 的 CLAUDE.md 编排宪法：「Plan-first: Enter plan mode before: new features, >2-3-file changes」「parallel blind review… disagreement IS the finding」「Never patch on top of a broken plan」；exoticknight/dsh-plugin-template：「Document files need approval」「Ask first, never do: npm login/OTP, manual npm publish」）；③授权不变量（ruvnet/ruflo：「Do not commit, push, merge, release… unless authorized」）；④人工读码把关（awesome 榜单哲学，见上）。
- 开发 harness 混用：context-lens 的提交者身份含 Antigravity / Cursor / OpenCode / DSH 四种 agent；dsh-cc 用 Claude Code+Serena 开发 DSH 插件；ruflo 明文 Codex=executor——「只用 DSH 写 DSH 插件」不成立。
- 决策记录惯例只有个别项目搬用：oh-story-dsh 有 `.agents/notes/implemented/process/`（Problem/Decision/Alternatives/Consequences/Verification + 「编一个数字比不给更糟」）。
- 社区自述流程样本：omdsh-dev/dsh-plugin-dev SKILL「开发流程（9 个插件沿用）」六步 + 交付前验证闭环——纯验证门驱动，无 spec 阶段。
- **失控/把控力第一人称叙事：未找到**（搜过 HN 全帖、aliyun/tencent 文章、各仓 issue/commit；痛点集中在 peer-range 兼容破坏与分发冷启动）。生态产品层也在补把控：dsh-plan-switch（一键 Plan 模式）、dsh-perm-guard（自动审批中间层）已作为插件出现。

### 缺口
仓库 ≠ 开发现场（context-lens 净化树、model-proxy 下载第一却 npm-only 无 repo）——「仓库内无过程痕迹」推不出「无过程」；ruflo/open-design 为兼容/蹭生态大项目，对「插件作者群体」代表性打折；owner 四仓未公开发布（GitHub 搜索无命中），「作者=重度 harness 用户」参照样本在社区侧不可用。

## D 路 · 外部 discourse（委派子代理 `5be21018`，2026-09-26 回填）

调查窗口：2025-02 → 2026-09。材料：两家 SDD 工具官方文档与 release 史、Anthropic 工程博客、agents.md 官网、Huntley 原文、Böckeler（martinfowler.com）、marmelab 长文、HN 主题评论（经 hn.algolia API）。每条注证据强度。

### 1. SDD 工具的规定流程【一手文档】

- **GitHub Spec Kit**（github/spec-kit README）："Constitution once per project; specify → plan → tasks → implement → converge per feature"，斜杠技能逐个调用，官方要求 "**Invoke each /speckit-* skill in your agent's chat, one at a time, and review the result before continuing**"——人类审阅即阶段审批门；implement→converge 是循环步骤。概念文档自认 "Spec Kit does not prescribe how teams preserve or mutate spec.md, plan.md, and tasks.md"。Böckeler 记录 GitHub 官方口径："your role isn't just to steer. It's to verify. At each phase, you reflect and refine"（https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html ）。
- **OpenSpec**（Fission-AI/OpenSpec README + docs/opsx.md）：每 change 产物 proposal.md / specs/ / design.md / tasks.md；"Your AI writes these; **you review the plan before any code is written**"；但官方哲学已转向 "fluid not rigid"、"**no rigid phase gates**"、"Dependencies are **enablers, not gates**"；自家对比表承认 Spec Kit "Thorough but heavyweight. Rigid phase gates"，自居更轻。【一手】

### 2. 实践者反馈【第一人称叙述】

批评方（spec 腐化 / 控制感错觉 / 验证债）：
- yoaviram（HN 2025-10-17，news.ycombinator.com/item?id=45614365）：SpecKit+Claude Code 两周，"**Most tests were failing, and the build was not successful**… my confidence in the code is low"；自建 backlog/sprint 编排后才可控，但 agent 仍会 "**declare the sprint as done even though tests still fail**"。
- Böckeler（2025-10-15）：设问 "False sense of control?"——"I frequently saw the agent **ultimately not follow all the instructions**"；"**I'd rather review code than all these markdown files**"；对 Kiro 小 bug："a sledgehammer to crack a nut"；提出 spec-first / spec-anchored / spec-as-source 三级 taxonomy，指现存工具几乎只做到第一级。
- marmelab Zaninotto（2025-11-12，marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html）：列 Context Blindness / Markdown Madness / Systematic Bureaucracy / "**False Sense of Security**: agents don't always follow the spec——agent 把 'verify implementation' 标成 done 却一个单测都没写"；"For large existing codebases, **SDD is mostly unusable**"。
- spec-kit Issue #876（2025-10-14）：跨轮 spec 一致性腐化——"the behavior defined in the previous spec was **completely broken**"。
- HN 侧引语：constantcrying "Really, we are doing **waterfall, but with AI**?"；conartist6 "**The code is the spec**"；gsadaka "Having a checklist for an AI to follow makes sense, but **that's why agents.md exists**"（AGENTS.md 当 spec 替身）。
- Ask HN（2026-06-12，item?id=48510002）：SpecKit→GSD→OpenSpec 连换后仍挣扎，问 "should I just let the LLM be free within the bounds of a spec… or should I abandon SDD?"

辩护方：sermakarevich（Ask HN 2026-06-13）"I use SDD since Feb for all my mid+ size projects. **This works great for me**"——多级人工验证使失误 "tactical, not strategical"；cfunderburg 混合派：强模型写 spec、弱模型实现，"My CLAUDE.md has guardrails… keep my coverage above 80%"（spec 当输入、门禁写进环境）；Böckeler 承认 spec-first 是从业者最高频诉求之一。【第一人称】

### 3. loop-first 的命名与主张者

- vibe coding：Karpathy 2025-02（经 simonwillison.net/2025/Mar/19/vibe-coding/ 全文引用）；Willison 收窄定义并警告语义扩散。【一手+第一人称】
- Ralph Wiggum loop：Huntley 2025-07（ghuntley.com/ralph/）："**In its purest form, Ralph is a Bash loop**"；方法论全在环境侧：**signs**（踩坑教训写成环境里的牌子）+ **backpressure**（"Anything can be wired in as back pressure to reject invalid code generation"——类型/测试/静态分析当拒绝门）+ specs/ 与 fix_plan.md 当循环间状态 + AGENT.md 自我更新；"There's no way in heck would I use Ralph in an existing code base"；关于计划："I don't [plan]. The models know what a compiler is better than I do. I just ask it."【一手博客】注意：Huntley 不反 spec——specs 是**环境夹具**（ghuntley.com/specs/），不是上游审批物。上游 DSH 不提供这条队列。
- Anthropic 工程博客：《Building effective agents》（2024-12-19）agents = "LLMs using tools based on environmental feedback in a loop"；《Effective harnesses for long-running agents》（2025-11-26，https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents）initializer 把一句粗目标展开成 `feature_list.json`（claude.ai clone 一例 200+ 条，初始 `passes: false`、"**It is unacceptable to remove or edit tests**"；选 JSON 因 "the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files"），外加 progress 文件、git 提交、每轮先通基线再端到端验证。这是生成出来的进度规格，同构对象是 owner 后补的队列，不是上游留白的 DSH。【一手】
- loop engineering 的直接参照（补核）：Addy Osmani，2026-06-07，[《Loop Engineering》](https://addyosmani.com/blog/loop-engineering/)——「Loop engineering is replacing yourself as the person who prompts the agent. You design the system that does it instead.」他描述系统发现工作、分配、检查、记录并决定下一项，也强调跨会话的外部记忆。这个版本与 owner「我仍要提醒 agent 计划和检查 goal」的体感尤其贴近：执行已有循环，外层取题与授权仍部分由人临场接管。文章列举的组件并非通用方法的逐项准入条件。【一手】
- 另两种相邻用法：LangChain，Sydney Runkle，2026-06-16，[《The Art of Loop Engineering》](https://www.langchain.com/blog/the-art-of-loop-engineering)——叠在 harness 上的 agent / verification / event-driven / hill-climbing 多环；Addy Osmani，2026-08-14，[《Practical Loop Engineering》](https://addyosmani.com/blog/practical-loop-engineering/)——强调自主反复行动、检测、调整直至目标达成，并建议事先明确停止条件和何时审查。不能从后两篇倒推「缺外层调度或停止条件就不是 loop engineering」。原底稿「命名簇里没有 loop engineering」作废。【一手】
- AGENTS.md：官网称 "used by **over 60k open-source projects**"，OpenAI Codex/Cursor/Zed/Devin 等采纳，Linux Foundation 旗下基金会托管；关键句 "The agent will attempt to **execute relevant programmatic checks and fix failures before finishing the task**"。【一手】
- 第二次主动命名：Zaninotto 明说这套东西 "doesn't have a name. 'Vibe coding' sounds dismissive, so let's call it **Natural Language Development**"（2025-11-12）。【第一人称】
- 主流化聚合信号：VentureBeat "How Ralph Wiggum went from 'The Simpsons' to the **biggest name in AI** right now"；The Register 2026-01-27 专文；YC hackathon 战报（while loop 一夜 ship 6 repos）。【聚合】

### 4. 双向演化：两边都在把「人类门」换成「机械门」

SDD 工具向更自动/更少人工门演化【一手 release 史】：
- OpenSpec：OPSX 重构即拆门（"No more rigid phases"）；v1.6.0（2026-07-10）"**auto-approve the openspec CLI**… avoiding repeated confirmation prompts"；v1.12.0（2026-09-03）"**Code-grounded planning**"（起草前先读代码与测试）；v1.13.2（2026-09-23）"Fast-forward asks for clarification **only when context is critically unclear**"。人工门收缩为「关键歧义才问」。
- Spec Kit：三入口轻量化 + 社区目录出现 "**Autonomous Run Governance** preset"；"exempt bug-fix from PR-count confirmation"（v1.0.9）；"stop specify init hanging on arrow-key pickers **in agent harnesses**"（v0.16.5）——工具在适配 agent 驱动使用；社区目录收录 "**Ralph Loop** extension"（v1.5.0）；v1.0.4（2026-09-02）release notes "**Add DeepSeek Harness (DSH) integration (#4336)**"。

loop 工具链向「补控制点」演化——方向是把同步人门换成机械门【聚合】：Claude Code "Auto mode is now the default"；OpenAI alignment 博客《Auto-review of agent actions without synchronous human oversight》+ Codex 自动批准低风险动作；批评者（marmelab）把 plan mode/task list 当作「SDD 冗余」的论据。边界代价亦有一手样本：DSH 自身出过 CVE-2026-82533（2026-09-08 披露，沙箱内一条命令切 danger-full-access 不触发审批；0.1.2-alpha.1 以一次性 token 修复；The Hacker News 2026-09-09 详报）——门禁本身成为攻击面，SAFETY.md 自认 sandbox/approval "do not guarantee isolation or prevent damage"。【一手】

DSH 的外部声音：HN 大帖（2026-08-13，747 分 314 评，news.ycombinator.com/item?id=49285244），好评抽样 "Steal their testing substrate. The offline evaluation is genuinely fucking clever."；第三方生态一周爆发（dshplugin.app、desktop 包装、LLM-verifier 插件等 104 条 HN 记录）；但「在 DSH 里/为 DSH 开发数周」的第一人称工程叙事未找到——Ask HN《Anyone using DeepSeek Harness (dsh) as part of a customer-facing agent?》（2026-09-19）0 回复，缺口本身即信号。【聚合】

### 5. D 路当时判定及其限制（现以 02 篇为准）

复核后的判定：① Osmani 2026-06-07 的「设计系统替代逐轮提示」直接支持 owner 体感的方向，不能把他八月提出的停止条件建议当成唯一术语定义；② Anthropic 在长程循环中引入进度规格，OpenSpec 保留可迭代产物，Spec Kit 推荐逐步审阅，支持**组合**循环、规格、检查与人工判断；③ 少量博客和工具发行记录既不能证明行业终局，也不能推出 DSH 官方插件流程或社区采用率。#4336 是在 DSH 里安装 SDD 技能的适配方向，非 DSH 官方改采 SDD。详见 [02 篇](./02-external-trend-verdict.md)。

### 6. 证据缺口

未能取回：spec-kit Discussion #1784 正文、Asana/KDnuggets/36kr/知乎正文（仅标题级）、innoQ 德文原文 404。未找到：「agent-native codebase」作为口号的代表性写作；Reddit 可用线程（HN 证据充足）；DSH 第一人称长篇使用叙述。X 未试。方法论局限：样本偏 HN+工程博客，无 star/下载量纵向核实；论坛回帖只作第一人称叙述引用。
