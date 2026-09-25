# Dev Loop · 专家插件的开发过程：从意图到调整的完整生命周期（机制层四方案共享；落地层写给 A/C/D 家族，按方案 A 的形状）

## 这篇怎么读

上一篇回答的是"repo 长什么样"；这篇回答"**一个特性从想法到稳定，整个过程怎么走**"。读者假设：你还不熟悉 DSH 的研发流程。全文按时间顺序走一个例子——"给专家加一条新的信息处理流"——每个阶段讲三件事：

- **你在做什么**（人 + coding agent 的分工）；
- **DSH 原生机制是什么**（这一步在 DSH 里有正式载体，不用发明——本列**只陈述 DSH 树里实际存在的东西并给出处；DSH 没有的载体会显式说"没有"**，不发明任何流程）；
- **专家 repo 怎么落地**（把 DSH 载体搬进你自己 repo 的具体做法——**本列只写给 A/C/D 家族，按方案 A 的目录形状写**：A 是推荐起点，C 是它去掉 submodule 的变体，D 是它按专家数相乘；方案 B 的 repo 就是 DSH，不消费本列，见下段；与 DSH 形状不同的选择都标成**本 repo 适配**，不回写成 DSH 原生）。

本篇是显式索引，不是替代品：**机制的权威是钉住的 `vendor/dsh/` 树本身**（各阶段给出的路径就是核对入口），本篇与它冲突时以 vendor 为准。**共享的边界按"谁跟谁一起演化"切**：机制层四方案没有差别——插拔、调试、驱动 agent 的机制全部来自 DSH 的组合层，只随 DSH 的钉版一起变，每阶段"DSH 原生"列对所有方案成立，这是本篇集中成一篇的理由；落地层分两族——**A/C/D 是同一家族**（C = A 减 submodule、D = A 按专家数相乘，共享九成落地），"专家 repo 落地"列按 A 的形状写一次，C/D 的增量就地标方案记号，完整差异在各方案文件的"开发过程差异"一节（[A](./option-a-standalone-with-pinned-dsh.md#开发过程差异方案-a) / [C](./option-c-external-dependency-only.md#开发过程差异方案-c) / [D](./option-d-marketplace-monorepo.md#开发过程差异方案-d)）；**B 独自成族**——它的 repo 就是 DSH，每阶段"DSH 原生"列描述的就是它的现状，落地列对它不适用，B 特有的环（上游同步）与全套现成义务的唯一家是 [option-b 的"开发过程差异"节](./option-b-in-dsh-monorepo.md#开发过程差异方案-b)，本篇不再逐阶段重复 B 例外。

依据（全部按本仓库工作树 `dsh-v0.1.7-rc.1`（`46a7f68b09`）核对）：`docs/development.md`（环境、钩子、日常命令）、`docs/testing.md`（测试分层）、根 `AGENTS.md`（Conventions 与 checks 纪律）、`lefthook.yml`（钩子作业清单）、`.github/ISSUE_TEMPLATE/feature.md` 与 `.github/pull_request_template.md`（意图入口与 PR 模板）、`.agents/notes/README.md` + `.agents/notes/AGENTS.md` + `.agents/notes/implemented/AGENTS.md` + `.agents/notes/archived/AGENTS.md`（决策记录系统）、`scripts/agent-note-tree.ts` 与 `scripts/verify-agent-note-format.ts`（结构/格式门禁）、`docs/postmortem/README.md`（事故层）、`packages/plan/README.md`（Plan Mode）、`packages/todo/README.md`（todo_write）、`.agents/skills/dsh-pre-push-checks/SKILL.md`（推送前选检查）、`docs/cordis-tutorial/index.md` 与 `docs/user/develop/`（插件作者文档线：面向 agent 开发者的七讲 keyless 可运行教程 + basic/framework/practice 插件开发指南，第 0 阶段探索路由的作者侧入口）、`packages/README.md`（组、发布期望与依赖方向规则，option-b 落位与第 3 阶段设计四问的依据）；流程模型沿 FAQ 06（[spec 从意图走到当前合同的完整路径](../06_spec-change-path/answer.md)）与 FAQ 11（[六步执行闭环与两个回路](../11_native-development-loop/answer.md)）。

## 第 0 阶段 · 一次性准备（只做一次）

**做什么**：把开发环境立起来，让后面每个环都能"秒级反馈"。

**DSH 原生**：`pnpm install`（顺带装好 worktree-local lefthook 钩子）→ `pnpm run typecheck` 通过即就绪（`development.md` 的验收标准）。钩子是快检查：pre-commit 六个作业（translation pairing、archived agent notes、staged lint、THIRD_PARTY_NOTICES 再生、whitespace、vendor manifest guard），pre-merge-commit 重跑其中 translation pairing 与 archived agent notes 两项；**pre-push 跑 `pnpm run typecheck`**。除此之外钩子刻意不跑测试、snapshot、文档检查和构建——这些的穷举归 CI（`lefthook.yml` 头注与 development.md「Git integrations」明说）。

**专家 repo 落地（A/C/D）**：准备做同构版——`pnpm install` → 本 repo 的 typecheck 通过即就绪 + 自己的快检查钩子（学 DSH 的形状，不必照抄它那六个 DSH 专属的 pre-commit 作业清单）——再加两件：① `git submodule update --init` 拉下 `vendor/dsh`（**仅 A/D**；C 无 submodule，DSH 是 npm 依赖 + `AGENTS.md` 里 `$DSH_REPO` 指针，见其差异节）并确认 `pnpm install` 后 typecheck 解析到 DSH 源码；② 写根 `AGENTS.md`（几百词：常驻规则、布局、命令表、`vendor/dsh` 在哪、探索路由——作者侧先 `docs/cordis-tutorial/`（七讲 keyless 可运行，受众即 agent 开发者，末讲把模型可调用工具接进真实 harness services）与 `docs/user/develop/`（写 harness 插件的 basic/framework/practice 指南，从 `basic/index.md` 进），形态与扩展点问题先查 `docs/cookbook/extension-cookbook.md`（扩展形态参考：工具/钩子/UI/协议驱动 + feature→机制映射），组合与集成的深问再 `docs/architecture.md → capability-seams → 包 README`），`CLAUDE.md` 做 symlink。这是给 coding agent 铺的路，第 4 阶段起它每次都走。

### 第 0.5 阶段 · 双 home 隔离

已在用官方安装的 DSH 时，开发插件**不要**直接插进日用 home：日用留在默认 `~/.dsh` 原样不动，开发用 `DSH_HOME=~/dsh-dev` 起第二个 home，并让专家 repo 的环境脚本自动 export 它（coding agent 不会自己想起来这个区别）。机制依据、崩溃半径、向日用 home 的迁移方向见专篇 [dual-home-isolation.md](./dual-home-isolation.md)。

## 第 1 阶段 · 意图：把"想要什么"钉在外部可观察行为上

**做什么**：人用一两句话说清动机和预期行为——"专家在收到 X 类输入时应产出 Y，现在是 Z"。

**DSH 原生**：意图的正式载体是 **GitHub Issue**：Feature 模板只留 **Motivation / Behavior** 两个字段（为什么改、预期的外部可观察行为）；Bug 模板是 Summary / Reproduction / Current behavior / Expected behavior / Environment；Task 模板是 Summary / Deliverables。验收与测试证据不写在 Issue 里——由 PR 模板的 Testing 节（每条方法一个条目 + 可复核的 Proof 折叠块）承载。机器 policy 只在非 Draft 人类 PR 进入 review 后强制引用 Issue（`.github/issue-management/policy.mjs`），不检查意图质量。**Issue 之外 DSH 没有意图登记物**：没有 intents 台账文件；重大工作的动机作为决策记录的一部分，落进 Agent Note 的 `## Problem`（写成离开方案也能独立成立的问题陈述）。

**专家 repo 落地（A/C/D 形状）**：有 tracker 就用同构模板；没有 tracker 也**不造台账文件**——琐碎改动说在对话/commit 里，重大工作的动机落进第 2 阶段 proposed Note 的 `## Problem`（这就是它在 DSH 里的家）。关键是**行为必须是外部可观察的**——"日志里出现事件 E"、"工具返回卡片 K"、"preset 挂上后其他会话无感"，而不是"代码要优雅"。

## 第 2 阶段 · 讨论与决策：Agent Notes 是核心数据，整套生命周期都要搬

**做什么**：人和 agent 把可选做法摆开（"这条流的上下文放 preset prompt 还是 spill store（`ctx.spillStore`，见 FAQ 08 的 seam 表）？事件还是服务方法？"），选定一个，**记录输掉的方案和代价**——讨论不在聊天里蒸发，沉淀成下个 agent 也能读的记录。

**DSH 原生**：**Agent Notes**（`.agents/notes/`）是 DSH 开发流程的核心数据——记录代码、测试、文档都装不下的东西：为什么、放弃了什么、要验证什么。整套制度（`.agents/notes/README.md`）：

- **路径即状态**：`{lifecycle}/{class}/yyyy-mm-dd-topic-title.md`，日期 = 主题首次提出（按 git 历史）。生命周期三个目录：`proposed/`（实施前待审的提案，可合法用将来式）、`implemented/`（已交付的决定，现在式）、`rejected/`（**被否决的提案**：正文按提案时冻结、结论写在 `Status:` 行；只在还能防住一次有诱惑力的复犯时保留，否则整份删掉）。
- **class 是闭集**：`feature` / `bug-fix` / `simplification` / `architecture` / `process` / `testing`（`scripts/agent-note-tree.ts`；加 class 要连 README 的 Classification 节一起改，门禁拒绝其他目录名）。
- **文件格式是门禁**（`scripts/verify-agent-note-format.ts`，doc-sync 的一部分）：头三行固定 `# Agent Note: <title>` + `Status: proposed|implemented|rejected — <一行理由>`；正文以 `## Problem` 开头；每个生命周期有自己的骨架——proposed：Problem / Proposal / **Alternatives considered**（强制：每个真实替代方案与它输在哪——"没有记录赢家的决定会招来翻案"）/ Acceptance criteria / Risks；implemented：Problem / Decision / Alternatives considered / Consequences（proposal 式小节被门禁拒收）。
- **生命周期迁移是同 diff 的机械改写**：proposed → implemented 把 `## Proposal` 改写成现在式 `## Decision`、把 Acceptance criteria 与 Risks 折进 `## Consequences`；proposed → rejected 只在 `Status:` 行补一行理由并冻结。
- **implemented 是活的，不是化石**：路径、符号、默认值、机制随实现**同 diff 更新**（只改事实，不追加 change history）；**决定逆转不许把旧 Note 改写成反面**——写新 Note 并互链（`.agents/notes/implemented/AGENTS.md`）。
- **每条新 Note 触发 supersession 检查**：搜活动树里同一决定/机制的旧 Note；全量被取代的 implemented 三件套同 PR 归档，部分取代的保持活跃并互链（`.agents/notes/AGENTS.md`）。
- **活动树就是库存，不建集中索引**：INDEX.md 被门禁禁止；浏览 lifecycle/class 目录或直接搜仓库。
- **DSH 的原生形状是双语三件套**（`x.md` + `x.zh.md` + `x.i18n.yaml`），配对一致性有门禁；单语 repo 不采用时要明确这是偏离。
- 强制规则只有一条：**非平凡变更必须同 diff 新增或更新 Agent Note**（更新已有的 owner Note 即可，不造重复）；机械/局部改动豁免。重大未来工作先 `proposed/`；已经做出的决定直接从 `implemented/` 开始。
- **两类内容不进 Notes**：事故——subtle（机制不明显）+ systemic（逃逸原因是测试/工具/约定的缺口）+ costly（重新发现要付真实调试成本）的 bug 写 **postmortem**，DSH 放 `docs/postmortem/`，回望式失败记录（Executive summary / Timeline / Root cause / Guardrails），它明确"不是 Agent Note"；临时研究——没有 research 目录，结论折进 Note 的 Problem / Alternatives 小节。

**专家 repo 落地（A/C/D 形状）**：整套搬进 `notes/`（目录树见各方案文件）：`proposed|implemented|rejected/<class>/YYYY-MM-DD-<topic>.md`；格式门禁做最小版进自己的 verify 脚本（照抄骨架检查：Status 行、`## Problem` 开头、`## Alternatives considered` 在场——够把纪律变成机械拒绝）。**被否决的方案要么进 `rejected/`、要么删，不要散在聊天里**——"输掉的方案留下尸体"的家就是这个目录（参考项目就漏了它）。研究结论折进 Note 小节、事故写 docs 层的 postmortem 式记录，**这两个 lifecycle 目录别发明**（DSH 没有它们）。方案 D 的专家级决策记在各自 `packages/<expert>/notes/`（见其目录树），仓库级（registry、shared/ 的取舍）才记在根 `notes/`。「整套搬」是本 repo 的选择，不是 DSH 对插件 repo 的要求——DSH 的作者文档线（`docs/cordis-tutorial/`、`docs/user/develop/`）直接教的是插件形态、配置与打包模型和术语；AGENTS.md / Notes / gates / 发布序列是 DSH 自身作为开发 Harness 的参与机制，对插件 repo 是可迁移的原则，不是继承义务。

## 第 2.5 阶段 · 未来的工作放哪：DSH 没有 roadmap 文件

**DSH 原生**：**没有 roadmap / 计划层文件。** 未来工作只有两个正式载体：**GitHub Issue**（队列与分流：label、Issue type）和 `proposed/` Agent Note（每条自含 Problem / Proposal / Acceptance criteria 的 spec，可合法用将来式）。`docs/` 只写当前状态——implementation-status annotations 在 docs/AGENTS.md 的 slop checklist 里被点名（"Status rots"）；轮次、排期、历史沉积没有任何文件承载，历史在 git / PR / Note / postmortem 里。

**专家 repo 落地（A/C/D 形状）**：有 tracker → Issue 当队列，proposed Note 当 spec；没有 tracker（本地单人仓）→ **proposed/ 本身就是队列**：按日期与 class 浏览（活动生命周期树就是工作库存），文件名即登记时点。确实需要一个"接下来做什么"的索引时，明确它是**本 repo 适配**，并守住 DSH 的三条边界：只放指针（一行一链接指向 proposed Note，spec 全文住 Note 不住队列）；不镜像状态（完成即删行，证据与验收住 Note 和 git）；不沉积历史（收尾记录与环境状态写 Note 或 docs，不写进队列文件）。

## 第 3 阶段 · 设计：细化到 decision-complete

**做什么**：把选定方案展开成实施计划——改哪些面、每面的验收是什么。人对着计划说"对/不对"，批准后才动手。

**DSH 原生**：**Plan Mode**（`packages/plan`，可选会话模式）：agent 产出完整计划并通过 `exit_plan_mode` 取得批准。它是**用户选择的审阅边界**，不是写保护——plan mode 不过滤工具，sandbox / approval policy 是独立 owner，"批准前不动文件"是行为约定而非机制强制。计划要覆盖：改哪些子系统/API/schema、失败路径、测试面。**多步任务的进行时反馈面是 `todo_write`**（`packages/todo`）：整表替换的会话任务清单，跨轮次与重开会话持久，属于创建它的会话——**不是跨会话的决策记录**（那是 Note 的职责）；简单单步可跳过。"每次必须 plan、每次必须全量测试"都不是 DSH 规则。

**专家 repo 落地**：专家的设计清单有固定四问（这是"plugins, not loop changes"纪律的专家版）：

1. **占哪个 ctx 键 / 发哪些事件**？每条流一个自己的键，`inject` 声明依赖（依赖 Service Definition、不依赖具体 provider——`packages/README.md` 的 Dependencies 规则），不劫持别人的。feature→机制映射（DSH 产品功能各占哪个扩展点）的原文家是 `docs/cookbook/extension-cookbook.md`——先查表，照它的模式定自己的键与事件。
2. **模型会看见什么新状态**？model-visible ⟺ logged（下称**日志税**）——每个新的模型可见输入都要配 `SessionEventMap` 成员（并决定 `ignorable`），否则日志重建不出来。这问漏了，第 5 阶段调试时会以"日志读不全"的形式还债。
3. **UI 走哪层**？presenter 层（`presentCall`/`presentResult` + `presentationMeta`，纯函数、可 replay；注意内置 Web Client 不消费它，不配 client 时显示 generic fallback 卡）→ 专属 Web 卡的 `tool.call.toolview` 槽注册 / 独立 UI 面的 `dsh.client.inject` / 自定义 View 的 `ctx.uiConversation.views` 注册 → 改内置卡片组件本体（仅方案 B）。分层事实的家：[answer](./answer.md) 决策 4。
4. **证据是什么**？"会为这次回归而失败"的那个测试长什么样——现在就点名，第 4 阶段写它。

## 第 4 阶段 · 落地：窄证据切片闭环

**做什么**：coding agent 执行，人指挥——这是两个回路：agent 在内圈走六步，人在外圈**切窄片 → 说清意图 → 委派执行 → 只审"会为这次回归而失败"的最小证据 → 错了整 PR 回滚**（人不用记规则，规则住在 repo 的门禁与 Note 里）。执行回路是 DSH 制度反复强化的默认（FAQ 11 命名为**窄证据切片闭环**），六步：

```text
核对现场 → 判定窄 diff → 原子修改 owner 面 → 跑最小证据 → 沉淀 gate/Note → 只报告实际跑过的检查
```

1. **核对现场**：不信任记忆，先读当前的代码/文档/日志——权威只在外部可验证状态里。
2. **判定窄 diff**：这次变更到底动哪几个文件？"给 `<tool>` 加 presentResult 卡片"是窄的，"改一下 UI"不是。窄 diff 是整个闭环的输入，派任务时就按 seam 说。
3. **原子修改 owner 面**：每个事实一个 owner——改 provider 不动 Consumer 合同；改专家流不动 agent-loop。owner 地图在 AGENTS.md 里。
4. **跑最小证据**：只跑"会为这次回归而失败"的那个测试 + typecheck，**不默认全量**。
5. **沉淀**：门禁住了的事实进 `docs/`（只写当前状态），选择进 Note。
6. **只报告实际跑过的检查**：没跑的不算数。

**交付形状**：一次交付是一个**完整垂直切片**——代码 + 测试 + docs/README/JSDoc + Note（+ 快照预期）在**同一个 PR** 里；proposed Note 在同一 diff 里按第 2 阶段的机械改写变成现在式的 implemented Note（`## Proposal` → `## Decision`），不能原样留到交付后（FAQ 06 核实的真实例子：`proposed/` → 实现 commit → `implemented/` 三段在 git 历史里可追）；**交付的 Note 若覆盖了旧决定，同 diff 做 supersession 检查**。

**专家 repo 落地的两条特有纪律（A/C/D）**：

- **插拔验证**（速查表见文末附录）：日常用 workspace 直跑；每次交付前用**真实安装形状**验一遍——`npm pack` → 干净 profile → `dsh plugin add` → 冒烟会话。源码直跑会掩盖依赖声明错误（OpenClaw 文档明示的坑）。
- **快检查在本地，穷举在 CI**：本地跑 lefthook 钩子（含 pre-push 的 typecheck）+ 选中的最小检查（DSH 的 `dsh-pre-push-checks` skill 就是"推送前选最小检查集"的流程）；文档/Note 改动在本地跑文档检查（A/C/D 用第 7 阶段自己的 verify 脚本）；测试、snapshot、平台矩阵的穷举归 CI。

## 第 5 阶段 · 调试：从组合层到会话层，逐层排除

**做什么**：行为不对时，按固定顺序排查，不跳层。

1. **组合层**：`dsh --profile <p> --dump-config` 打印最终插件行——先确认"我以为挂上的行真的在最终组合里、config 是我以为的"。层级顺序 bundle → profile patch → home patch → `--patch` overlay，先想清楚该行该来自哪层。
2. **装载层**：preset 装不上时，`agent-preset-registry` 的 mount 审计（imports / 缺服务 / 全局泄漏，见其 README「Understand the implementation」）**连原因一起列出**而不是藏掉；配置错误按 fail-loud 纪律在最早可解点报错，不会静默跳过——报错信息本身就是诊断。
3. **生效层**：自定义 profile 默认 **live patch reload**（改 patch 行不重启就生效；`headless`/`sdk` 这类一次性应用是启动一次成型，调试它们要重启）。
4. **会话层**：session 是 JSONL 追加日志；model-visible ⟺ logged 保证专家流的每个模型可见状态都在日志里可重放——调试上下文组装**读日志，不猜**。如果日志读不全，回头修第 3 阶段第 2 问欠的债。
5. **回归层**：`test:snapshot` 用录制会话无 key 重放，是回答"行为为什么变了"的最快路径（A/C/D 自建最小版，见各方案差异节）。

## 第 6 阶段 · 调整：证据驱动的打磨，不是重设计

**做什么**：拿真实使用反馈（一条日志、一个 replay diff、一次不满意的会话）回到第 1 阶段——但这次意图更窄。打磨的迭代单位是**切片**，不是"推翻重来"。

**DSH 原生**：闭环的蛇形折回——第 4 阶段的第 5 步（沉淀 gate/Note）就是为这一阶段铺的：上轮的门禁让这轮的回归自动暴露，上轮的 Note 让这轮不再讨论已否决方案（否决记录的家是 `rejected/`，第 2 阶段）。打磨提速靠两个 DSH 机制：**委派 spine**（subagent 把任务切小）与**窄证据**（把验证切小），共享"单位成本最小化"。

**专家 repo 落地（A/C/D 形状）**：兼容性调整有固定环——`vendor/dsh` 升级（方案 A/D）或依赖更新（C）→ typecheck（A/D 经 workspace 协议直解析 DSH 源码，C 靠 npm 安装的类型；都让已声明范围的 API 漂移在编译期暴露）→ compatibility matrix 加列 → 真实安装形状冒烟。把这条环做成一个脚本，agent 每次只触发它。

## 第 7 阶段 · 收尾：只报告实际跑过的检查

**做什么**：推送前用 pre-push-checks 的纪律**选**（不是全跑）能覆盖本次 diff 的最小检查集，报告里只列实际跑过的命令；语义正确性（机器查不到的部分）留给 review 的人。

**DSH 原生**：`dsh-pre-push-checks` skill 明确"匹配证据面：行为测试对行为、`doc-sync` 对文档、快照对用户可见变更、e2e 对 provider；CI 拥有穷举"。**归档是可选的生命周期收敛，只对 implemented**：低未来价值的 implemented 三件套整体移进 `archived/`、在 Status 行下加同一行 `Archived: YYYY-MM-DD`、重录 sidecar、修复入链；**封存后永久冻结**——不编辑、不移动、不作当前权威（`verify-archived-agent-notes` 门禁 + `dsh-archive-agent-notes` skill；按未来决策价值判断，不按字数/年龄/quota）。纯机械改动、小 UI 调整的 implemented Note 直接删。**收尾还要问一句**：这次的坑是否 subtle + systemic + costly——是就写 postmortem，且 guardrails 要可执行（根 AGENTS.md Conventions："机械可查的不变量进执行门禁，并证明每个改动的验收路径会拒绝无效用例"）。

**专家 repo 落地（A/C/D 形状）**：同纪律自带三件套收尾——docs 更新为当前状态（无 change history）、Note 已按第 2/4 阶段改写并做了 supersession 检查、验证清单与实际执行一致。仓库级的机械检查（链接、结构、UTF-8）学 `_faq_on_digested/verify.mjs` 写成自己的 verify 脚本，让"文档不烂"也成为门禁而不是约定。

## 全周期速览

| 阶段 | DSH 原生载体（四方案共享） | 专家 repo 落地（方案 A 形状） |
|---|---|---|
| 0 准备 | `pnpm install` + typecheck + lefthook 六作业 | + submodule（A/D）、AGENTS.md 入口链 |
| 0.5 双 home | home 解析：显式 → `$DSH_HOME` → `~/.dsh` | 开发与日用分 home，见 [dual-home-isolation.md](./dual-home-isolation.md) |
| 1 意图 | Issue 模板（Motivation/Behavior 等）；Issue 之外无登记物 | 有 tracker 用同构模板；没有则动机落 proposed Note 的 `## Problem` |
| 2 决策 | Agent Notes：proposed / implemented / **rejected** + archived，class 闭集 + 格式门禁 | 整套搬进 `notes/`，格式门禁最小版进 verify |
| 2.5 未来工作 | 无 roadmap 文件：Issue 是队列，proposed Note 是 spec | proposed/ 即队列；本地队列文件是适配（只放指针） |
| 3 设计 | Plan Mode（可选审阅边界）+ todo_write（会话内反馈面） | 固定四问：ctx 键/日志税/UI 层/证据 |
| 4 落地 | 六步闭环 + 垂直切片 PR + 同 diff 机械改写 Note + supersession 检查 | + 真实安装形状验证 |
| 5 调试 | dump-config → preset 审计 → live reload → JSONL → snapshot | 同一套，snapshot 可自建最小版 |
| 6 调整 | 蛇形折回；委派 + 窄证据；否决记录住 rejected/ | 兼容性环做成脚本 |
| 7 收尾 | pre-push checks 选最小集；归档仅 implemented 三件套并冻结；subtle+systemic+costly 写 postmortem | + 自己的 verify 脚本 |

**B/C/D 怎么用本表**：**C = A 减 submodule、D = A 按专家数相乘**——两形态的增量只在各自"开发过程差异"节，本表"专家 repo 落地"列在差异节未覆盖处直接适用；**B 不消费本表**——每阶段"DSH 原生"列即其现状，B 特有的上游同步环与现成义务见 option-b 差异节。

## 附录 · 插拔速查

**装法（按离源码远近）**：

| 装法 | 命令/配置 | 用途 |
|---|---|---|
| workspace 直跑 | `pnpm dsh --profile headless "…"` + preset 挂会话 | 日常开发，改源码即刻生效 |
| patch overlay | `dsh --profile <p> --patch ./dev/try-x.patch.yml` | 一次性实验某插件行，不落盘 |
| profile 内持久 | `dsh plugin --profile <p> add file:./packages/expert-pack` | 验证真实安装形状；日常体验 Web |
| 正式分发 | `dsh plugin --profile <p> add <npm-name>` / `github:<owner>/<repo>` | 用户视角；CI 测兼容矩阵 |

**拔法**：会话不挂 preset（最轻）→ patch 里 `disabled: true`（行还在）→ 卸载（registrations are effects，无残留）。（`disabled` 是正式机制：Loader 在每次 mount 决策时求值它，shipped `bundle/base` 自己就在用；FAQ 12 记录过个别 client 行不生效的未解观察，异常时先用 `--dump-config` 对照实际组合再下结论。）
