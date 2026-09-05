# Research · 三路调查的原始发现

方法：从三个互相独立的证据面重建"最自然的开发习惯"，事先不预设答案；FAQ 02/10 的结论只作对位参考。所有路径相对仓库根。

## 第一路：skills 语料（9 个进语料 dsh-* SKILL.md 全读 + Note 规则；仓库共 10 个，translate-docs 仅限显式调用不进入语料）

对象：`dsh-pre-push-checks`、`dsh-code-review`、`dsh-find-simplifications`、`dsh-prose-standard`、`dsh-doc-standards`、`dsh-archive-agent-notes`、`dsh-trim-cot-leakage`、`dsh-merging-stacked-prs`、`dsh-doc-site-sync`，加上 `.agents/notes/README.md`、`docs/AGENTS.md`。全仓库共 10 个 `dsh-*` skill；`dsh-translate-docs` 仅限用户显式调用，不进入开发习惯语料，故闭环分析以其余 9 个为对象。

每个 skill 按"自动化的场景 → 规定的默认路径 → 隐含假设的摩擦 → 明说的理由"拆解。跨 skill 的公共分母（12 条）：

1. 最小匹配证据，绝不全套（PP:29 "no universal local baseline beyond the hooks… narrowest available test"；AGENTS.md "Never default to the full suite"）。
2. 判活的 diff，不判记忆里的 diff（change-scope 出现在 PP:22、CR:8、DS:37；"The command never guesses or fetches a base" 在 PP:25）。
3. 以 HEAD 视角书写，禁止叙述会话（TL:12 一句测试）。
4. 一次事实一个家，链接代替复述（DA:17；PS:40；DS:41）。
5. owner 先于派生物，重生成代替手编（PS:26；DS:31 "Generated catalogs are never hand-edited"）。
6. 机械 gate 与语义判断之间没有中间态（CR:22 "automated checks do not establish those properties"；FS:72 "`knip` … is not a substitute"）。
7. why 与 what-was-given-up 同 PR 记录（NR:46；NR:111）。
8. 持续修剪，增生是敌人（AN:8；DA 的 relocate→condense→raise）。
9. 冻结的历史保持冻结（PS:24；TL:41；AN:62）。
10. 只在真正的权威边界问人（SP:63；PS:16；FS:15 保护性 seam 需用户显式否决）。
11. 多面修改原子化（DS:33 "A move is atomic"；WS:23）。
12. 自我限权被成文化：CR/FS/PS/DS/TL 五个 skill 以"guidance, not a script/checklist"开篇（translate-docs 为 "guidance, not a translation memory"）。

skill 的隐含画像：默认开发者是短会话里的 LLM agent，以 stacked PR 交付；每个 skill 是对一种特定 agent 失败模式的校准反习惯（跑全套、重跑绿检查、信任过期状态、把推理过程漏进产物、让文档增生、手编生成物、手工合并平台原语能管的事）。skill 缩写：PP=pre-push-checks、CR=code-review、FS=find-simplifications、PS=prose-standard、DS=doc-standards、AN=archive-agent-notes、TL=trim-cot-leakage、SP=merging-stacked-prs、WS=doc-site-sync、NR=notes/README.md、DA=docs/AGENTS.md。

## 第二路：git 历史（upstream/master，tip `0a53fb55be`）

- 提交风格：严格 Conventional Commits 小写祈使句，scope=子系统；PR 编号几乎不出现在 subject（`(#N)` 形式全历史 9 例），合并 commit 的 subject 即 PR 标题。
- 单位 = 一个 PR，且 PR 内 commit 序列自身分层（#3319：refactor(values)→refactor(services)→refactor(consumers)→test(deps)→docs，自底向上逐层可独立成立）。
- 八个抽样 PR 全部带 Note 三件套与测试，多数同时改 docs/website/README（个别 bug-fix 如 #2814 的文档面仅由 Note 承载）：`a760c0b0f6`(#2847)、`a67b9a4d31`(#2814)、`6d6262703b`(#2820)、`3a9e1a6e24`(#2749)、`e637bcfb98`(#2726)、`f5faeae4d3`(#2798，CI-only 仍带 2 个 Note 三件套+spec)、`5951d19f58`(#2844)、`577bb71418`(#2903 整切片反向 revert，67 文件与 #2608 的 67 文件完全镜像)。反例 `b7135e6206`(#2760，1 文件 25 行测试修复，无 Note) 恰好落在制度豁免类。
- 最近 100 个 PR landing merge 量化：88 含 `.agents/notes/`、96 含测试、86 含 docs/README、90 含 src；典型 ~9 个 Note 文件 = 3 个三件套；三件套从不拆半（双语配对制度）。独立复现（merge-base 口径 = PR 真实足迹）：88/94/86/90（测试 94 vs 96 为计数定义噪音）；Note 文件数众数 3（= 一个新三件套）、中位数 ≈9；.md/.zh 对 0 例拆半，仅 3 个 PR 有 meta-only 重记录（#3074/#3235/#2966）。
- 流程自我修改的 changelog：`2026-08-02-native-github-stacks-and-optional-rebases`（引入 `9a07380c23`，raw `--force` 禁止）、`2026-07-26-dependencies-over-hand-rolling`（引入 `3a88912a22`，NIH 复盘：未声明的"别加依赖"被 agent 从模式推断且"stricter than anyone decided"）、`2026-07-26-incremental-pr-base-retargeting`（merge-forward checkpoint，"Do not abandon or rewrite a checkpoint"）、`2026-07-19-require-agent-notes-for-non-trivial-changes`（同 PR Note 规则起源；明确拒绝自动 diff 分类 gate）。
- stack 证据：`stack/agent-profiles-1-seam`→`-3-wire`→`-5-web-ui`→`-8-authoring`（层内缺陷修在引入层，`beec364e04`）；lettered 系列 `worktree-apire-a`(#3073)…`-f`(#3235)（`-e` 的 PR 未以该名出现）。merge-forward checkpoint 大量存在：全历史提交消息体含 "checkpoint" 1725 处、PR landing merge 1230 个（≥1.4 次/PR；原记 1985/1085 的密度口径未能复现，方向不变）。
- 整 PR revert 文化：#2903、#3000、#3054、#2577、#544、#3325、#3326（re-revert），无 patch-forward hotfix。
- 作者：人为主（Tianyi Cui 5000 / Yichen Jiang 1666 / imccyu 1556…）；agent 疑似身份极小且产出正常切片（`fz@dsh.dev` 91 commits 仍带 README 三件套+spec）；Co-authored-by 仅 4 例——机器辅助的活记在操作者名下。
- 分歧：文档统一描述 stacked-PR，历史里并存三种实践（lettered worktree、编号 native stack、占多数的无栈独立 PR）——文档是理想形，简单 PR 允许简单路径。

## 第三路：运行时助推结构（packages 源码，file:line 见下）

- `packages/guard/repeat-tool-reminder/src/index.ts`：纯 advisory 重复调用检测，阈值 `[3,5,8]` 逐级提醒（默认值 :46、逐级文案 :63-78、逐级逻辑 :199-202、advisory 注册 :209-224），检测放 post-execute 因为"被拒的调用也流经这里——模型反复锤一个被拒调用正是值得打断的环"（注释 :181-188）；用户插话重置计数（:226-231）"a user interjection changes the context"。`timeout-policy` 协作式：结构化 `TOOL_TIMEOUT` 结果，不弃 promise。**stuck 时 steering 而非 veto**。
- `packages/todo/tool-todo/src/index.ts:45-66`：整表替换、开工前列每步、完成即标记、琐碎任务豁免——todo 是执行期的可见骨架。
- `packages/bundle/base/cordis.patch.yml:268-279`（:269/:275）：姿态条款——"conversational agreement… approves nothing"；"Resolve discoverable facts by inspection"；"Do not ask the user where code lives"。条款由部署注入：plan-mode 源码 `index.ts:2-18` 是日志折叠 JSDoc，插件自身声明"Deployment-owned plan guidance"（index.ts:69-73）——姿态是部署级配置，这本身就是设计。**先勘察后变更，只问人拥有的选择**。
- `packages/skill/tool-skill/src/index.ts`：两层披露——目录摘要常驻（hash 去重，变了才重发；机制 :213-251 与 :328-334，:260-267 是目录消息正文），全文经 `skill` 工具按需载入（:154）；用户 `/name` 是确定性且不可伪造的加载手势（:163-176）。**程序按需付费**。
- `packages/interaction/`：`ask_user_question` 只收确认/选择/缺失信息；审批默认 `ask`、fail-closed，policy 原文告知模型；每次 ask/outcome 是 log-only 审计对。**人在决策点在环，其他时候不打扰**。
- `packages/bundle/base/cordis.patch.yml`：默认会话出生即带 todo、plan、skills、goal 续轮、后台优先的委派栈（continuable subagent 默认 background，"Start independent delegations together… When a background run settles, the runtime sends you a notice containing its outcome and any final assistant message"，`packages/subagent/tool-subagent/src/index.ts:596`）、advisory guards、compaction/pruning。（rc.1 删除了独立的自足 `report` 工具 `tool-subagent-report`：子会话交付从"欠一份自足 report"改为 settle 时由运行时把 outcome + final message 作为 notice 交回父会话。）
- 系统提示组织（`packages/core/system-prompt/src/index.ts:56-60`）：identity -100 / persona 0 / 工具指导 100-199——后一句 "tool guidance lives in tool plugins as prompt sections, not in the deployment persona" 的原文在 `packages/workflow/tool-workflow/src/index.ts:210-211`（近义表述见 cordis.patch.yml:427-428）。

运行时合成姿态：**先勘察、再计划、批准后 todo 驱动执行、卡住时被引导而非被杀、只在权威边界问人、结论以自足报告交付**——且模型可见即日志可重建（model-visible ⟺ logged）是使能不变量。

## 三路收敛

三路证据指向同一条路径：开发制度（skills/gates/Note）、历史实践（垂直切片/整 revert/最小检查）、运行时默认（todo/plan/guard/skills）共享同一组取向——不信任叙述、单位成本最小、判断必须沉淀、报告与证据对齐。这就是 answer.md 命名的"窄证据切片闭环"，"轻松"体感来自正确路径与最省力路径的制度性对齐（记忆外包、反馈秒级、原子回滚）。

## 与输入参考的对位

- FAQ 02/06（SDD）：静态分层成立；本篇结论是其动态前置——spec 感是闭环沉淀物，不是上游输入。02 自己的"不能从仓库推出什么"一节已含此意，本篇升格。
- FAQ 10（goal/plan 三根）：运行时体感的解释，与本篇开发制度同构（goal 轮"权威只属于外部可验证状态" ⟺ trim-cot-leakage 的 HEAD 测试 ⟺ pre-push 的"不信任记忆"），但互不依赖。
