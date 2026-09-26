# 05 · 控制点清单：在 loop 风格里找回把控力，不引入 SDD 门

## 结论先行

把控力 = **切片层**（上游已满，不用动）+ **管线层**（要自己补，成本远低于想象）+ **双权威面对齐**（ROADMAP 队列语义 vs goal 轮次语义）。下面按成本从低到高列控制点；每条标证据来源：【owner 已验证】= 四仓里已在用并有 file:line 锚点（见 [research.md](./research.md) B3 路）；【上游在场】= DSH 自带、待纪律化；【外部印证】= 行业同构做法（02 篇）。

## L0 · 用满在场的机制（零新建，一小时纪律）

1. **TodoPanel 当反馈门②**【上游在场 + owner 已验证】：实施期盯 todo 活清单、想改直接发消息 steer——「你看得见自己的反馈被吸收」（dsh-inround-task-surface.md:87-89）。讽刺条在先：机制一直在场却没人用，纪律化后才产出把控感。
2. **Plan Mode 当反馈门①**【上游在场；owner 已验证的是「呈批」这个步骤本身，运行时载体见下】：队列 feature 条目默认呈批——「用户已明确批准具体计划时不重复求批，否则默认先呈批」（company ROADMAP 头注）。B4 修正：20 个采样会话中 plan mode **零进入**，呈批的实际载体是 `ask_user_question`（38 次）——把「呈批」当流程步骤时，机制名要按实际载体写（04 §3）。上游定位仍是可选审阅边界，owner 把它编码成条目生命周期的一段。
3. **goal 的写法与 /goal 人面**【上游在场 + owner 已验证】：objective 用「交付型=按队列逐条执行（队列空即收口）/ 打磨型=预算+输入源+枯竭即收口 + 三类停止条件」（company dev-loop.md:33）；日常 inspect 用 `/goal`（不耗模型轮）。`requireDirectHuman` 保证模型不能自己 create/pause/resume——「模型不能自己 resume」（digital-twin note:185-204）。
4. **拍板语义行内化**【owner 已验证】：`⏸ 等用户拍板`、`🔒 用户判触发（不得自行判触发、不得删行）`——把「谁决定」写成队列行的一部分（ROADMAP.md:48-52）。

## L1 · 管线层薄文件（一小时级，owner 四仓的核心补丁）

5. **根部队列文件**【owner 已验证】：只写「接下来」、完成即离队、▶ 全仓唯一当前指针、条目 ≤3 行（主题/标记/链接）、列表顺序=执行次序、每行标 `等人/可自主`、搁置池每行带复活条件。两条上游红线要恪守：**不发明 tasks.md**（60-dev-loop.md:16-17）、**队列是索引不是全文**（全文住 proposed RFC）——补的是队列，不是 SDD 的任务清单。
6. **开工即立卡**【owner 已验证】：任何要做的先显性化到 `notes/proposed/`，状态词只留生命周期四态，「看不见的工作等于没在做」（AGENTS.md:23-25）。
7. **计划先落盘**【owner 已验证】：「不以对话内共识代替落盘」（company dev-loop.md:28-29）——把对话里达成的共识立刻写成 RFC/卡，否则它不存在。

## L2 · 门禁化（半天级；一次性把对话税资本化）

8. **proposal-scheduled / proposal-graduated**【owner 已验证】：提案必须在队列有归宿、毕业必须离开 proposed——「挂进去才有人做」（company verify.mjs:301 注释原文）。首跑活反证就抓到赖在 proposed/ 的条目。
9. **指针活性门禁**【owner 已验证，事故驱动】：`queue-pointer-live` / `proposed-pointer-live`——毕业手续漏做会让 ▶ 指向已完成条目且 commit message 声称已更新；非 .md 文件里的指针也要查（实测 13 处 404）。静默自主跑起来后，这类静默失真是最先爆的真事故。
10. **门禁负例自证**【owner 已验证】：planted defect 必须让对应门禁变红才算数（architect verify-selftest，20 处）——没有负例的门禁只是摆设。
11. **安全边界**【外部印证】：机械门禁本身是攻击面（CVE-2026-82533：沙箱内一条命令切 danger-full-access 不触发审批；SAFETY.md 自认 sandbox/approval "do not guarantee isolation or prevent damage"）——自动化越深，门禁与审批面越要被审计。

## L3 · 长程自主（goal 马拉松形态）的把控

12. **停止条件写进 objective**【owner 已验证】：交付型「队列空即收口」、打磨型「枯竭即收口」——没有停止条件的 goal 就是「一直催着往前跑」的体感来源。
13. **复盘 note + 事故→门禁回路**【owner 已验证】：每场马拉松留复盘（做了什么/几笔提交/门禁咬作者几次），失真显影即立门禁——这是 loop 风格的学习回路（04 篇第二节）。
14. **行业同构对照**【外部印证】：Anthropic 的 `feature_list.json`（机械进度盘，"It is unacceptable to remove or edit tests"）、Ralph 的 fix_plan.md 与 backpressure（"Anything can be wired in as back pressure to reject invalid code generation"）、Claude Code auto mode + catch-up、OpenAI auto-review——全部是「机械进度盘 + 机械门 + 事后审」同一家族；owner 的 ROADMAP+门禁是同一设计在插件仓的实例。

## L4 · 跨仓总览（可选，尚未验证）

15. **一页跨仓索引**【建议，未验证】：owner 四仓四张队列 + 每仓一个 goal，没有任何一处能看到「全部插件现在各自停在哪」。可做人维护的一页索引，但必须守上游禁令的精神：只放指针、不镜像状态（notes 禁 INDEX 的理由是「第二份状态必然漂移」——跨仓索引若镜像状态会得同样的病）。

## 规模律：流程重量跟着「协调面」走，不跟着人数走

owner 的洞察（2026-09-26）：「DSH 肯定是多人协作，notes 的地位其实多少跟 Spec 一样；我是一个人开发，流程没那么重要。」两条各对一半，合成一条更准的规律。

**为什么 notes ≈ spec**：spec 文档在经典开发里承载三个职能——**记忆**（给无法共享上下文的参与者）、**审批**（人对意图的把关）、**验收**（行为基准）。DSH 把三个职能分给了三种机制：记忆 → Agent Notes + ROADMAP（读者是失忆的新 agent 会话，不只是人）；审批 → `ask_user_question` / 拍板标记 / Plan Mode（B4：20 会话中 plan mode 零进入，批准实际由 ask_user_question 承载）；验收 → tests / snapshots / invariants 门禁。单一 spec 文档消失，不是不需要 spec，而是三个职能各有更便宜、更机械的 owner。notes 与 spec 的两点残留差异：读者以 agent 为主（「HEAD 处无会话读者」），生命周期倒置（同 diff 更新的活记录，不是会腐烂的上游输入）。

**修正「一个人流程不重要」**：决定流程重量的是**协调面**——需要外部记忆才能协作的参与者数量（人 + 各自失忆的 agent 会话），不是人数。owner 是一人，但工作流里有大量互相失忆的 agent 会话（fresh-agent 入口链、handoff、静默马拉松），所以仍建了跨会话队列、立卡、门禁——那是 agent 之间的协调面；真正省掉的是**人-人协调层**：四仓「不借清单」（Issue 流、stacked PR、CI 矩阵、双语 note、词数预算——"adds ceremony with no consumer"，B3）恰好全是人人协调机制。上游 DSH 是多真人 + 多 agent（FAQ 11 的 git 作者数据 + quality-gates 自述），所以两层都要——这是它「流程重」的真正来源。

**四档规模律**：

1. **单会话单 agent**：todo + 验证即够——社区 loop-lite 插件仓【C 路】。
2. **单人 + 多会话多 agent**：+ 跨会话队列、立卡（跨会话记忆）、流程门禁（防静默失真）——owner 四仓【B2/B3】；单 agent 长跑同样需要外部协调面：Anthropic 的 `feature_list.json` 本质是单次长跑的"spec"【D 路】。
3. **多真人 + 多 agent**：+ Issue/PR 流、human-review policy、双语、CI 矩阵、review 纪律——上游 DSH 全套【FAQ 02/06】。
4. **多真人、少 agent**（经典 SDD 时代）：spec 为王——人脑互不共享上下文，文档是唯一协调面；SDD 工具是这个时代的产物【D 路】。

标注：【推断】owner 提出方向、本篇用既有证据修正后归档；四档分界（尤其 1↔2 的「项目时长」变量）未做独立检验。

## 何时才真的该上 SDD

诚实边界：本清单适用的是**单人 owner + agent** 的插件仓形态（owner 四仓即此）。三种情况 SDD 的门仍然划算：① 多真人干系人需要审阅**需求文本**而非代码（OpenSpec 的 proposal review 面向非实现者读者；company 的多人协作条目至今 ⏸ 等裁决，正是这个缺口）；② 对外交付的合同性项目，spec 是交付物本身；③ greenfield 大项目需要可交接的需求资产。即便此时，也建议只取 SDD 的管线层产物（spec/plan/tasks 的人审面），切片层证据仍按 DSH 纪律走。

## 最接近的一句话

**把控力的缺口几乎全部能用「L0 用满在场机制 → L1 一张队列文件 → L2 两道门禁」补齐，成本以小时到半天计；SDD 真正不可替代的只剩「多真人审需求文本」这一种场景——而那不是 loop 的失败，是另一个问题的另一种工具。**
