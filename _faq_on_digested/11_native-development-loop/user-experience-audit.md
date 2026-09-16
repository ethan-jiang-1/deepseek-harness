# 用户体验审计 · "为什么驾驭 DSH 感觉轻松？"（FAQ 11）

严格从**用户**视角，以写作时的 checkout（`git HEAD 4f69e0f3b5`, branch `ethan`）的原始
源码 / 文档 / 配置 / 测试为基准，对 [`answer.md`](./answer.md) 的审计；本次上游同步复核
（`fb2c4b9e69`，dsh-v0.1.5-rc.2）已把下文引用的源码/文档行号推进到当前工作树，结论未变。
目标问题：对于每个关于感觉 **light / fast / easy / native** 的核心主张，（1）用户实际做了什么和观察到了什么，
（2）哪个仓库原始来源/机制导致了它，（3）该主张是 **proven / inferred / unsupported**，
以及（4）反证与局限性是什么。

最重要的先决条件是问题描述要求的三种用户类别划分。当前 answer 没有干净地遵循这一点，而这是其大多数问题的根源。

---

## 0. 三种用户类别，以及 answer 实际描述了哪一类

| 类别 | 谁 | 他们作用于什么 | 他们观察到什么 |
|---|---|---|---|
| **(A) 通过 Web/CLI 指挥 DSH 的人类** | 问题原文命名的"让 agent 干活的外界观察者"（[`question.md:5`](./question.md)） | 输入 GUI/CLI 的自然语言任务 | 工具的 cards/diffs/terminal、todo + plan 骨架、偶尔的 `ask_user_question`、以及最终的自包含报告。他们**从不**运行 git 命令，**从不**碰 AGENTS.md / skills / gates / hooks。 |
| **(B) 执行仓库工作的 Agent** | 仓库内的 coding agent | `change-scope`、tests、`doc-sync`、Note 三件套、snapshots | Gate 失败、hook 输出、CI 运行、六步闭环。 |
| **(C) 手动编码的贡献者** | 在终端编辑仓库的人类 | `git commit` / `git push`、`pnpm run <check>` | Pre-commit/pre-push hooks、CI、review。 |

**发现 F0（结构性问题）。** Answer 的第 1–6 阶段（六步闭环）、§2–§4（记忆外包、
反馈延迟、犯错成本低）和 §6（git 历史量化）描述的是 **类别 (B)**，仅对 **类别 (C)** 做了薄薄的修饰。
Answer 对问题明确指名的 **类别 (A)** 只字未提。在 §8 中，answer 将"对人是…指挥与审查面"映射到**团队领导 / reviewer** 角色
（`answer.md:92`），这更接近 **(C)** 而非 (A) 的 Web/CLI 用户。因此，answer 回答的是"为什么 agent（和仓库工作者）觉得容易"，
而问题问的是"为什么指挥 DSH 的人类觉得容易"。这是最核心的修正。

实际上创造 (A) 轻松感的机制是**运行时/产品设计**属性（interview 姿态、按需加载、自包含报告）；
answer 详细阐述的机制是**仓库流程**属性（gates、hooks、窄测试、原子切片）。**后者中没有一个对 (A) 可见。** 下面，每个主张都标注了它实际适用的类别。

---

## 1. 逐条主张审计

### 1.1 "feedback is seconds / 秒到分钟级"（§3）— 类别 **(B)/(C)** — **INFERRED, over-precise（推断，过度精确）**

他们做什么：对 (C) 的 push，或 (B) 运行最窄测试或 `doc-sync`。
来源机制：[`lefthook.yml:52-55`](../../lefthook.yml) pre-push 运行 `pnpm run typecheck`；
`package.json` `typecheck` = `npm run build:lib:host && npm run typecheck:contracts-ready`，
而 `build:lib:host` = `tsc -b tsconfig.host.json && tsdown --env.DSH_BUILD_FACE host`。

- **反证。** "Seconds" 的表述将本地 hooks 作为反馈步骤，但唯一的 *始终开启的* push 时本地门禁是
  **完整的 host build + bundle + client typecheck**（`build:lib:host`），而不是亚秒级检查。Superseding note
  [`2026-07-22-fast-local-git-hooks.md:35`](../../.agents/notes/archived/process/2026-07-22-fast-local-git-hooks.md)
  明确说：*"Hook latency is observed in development and PR evidence rather than enforced by a
  timing test whose result would depend on host load and cache state."* 仓库**故意拒绝承诺持续时间**。
  所以"痛在秒级"（`answer.md:43`）和"秒到分钟级"（`answer.md:47`）
  仅作为*定性*排序（local ≤ CI）是诚实的，而非作为测量的延迟。在冷缓存上，
  40+ 包的 pnpm workspace 中的 host build 通常需要数十秒到几分钟。
- **反证（类别 A）。** (A) 用户从不体验 hook 延迟；他们的反馈是
  agent 的 *displayed streaming progress*，这是完全不同的事情，不在这个主张的范围内。
- **裁定。** 可以支持为"local is much faster than CI"；**不能**支持为"seconds"。

### 1.2 "each time only one or two checks / 一两个检查"（§结论, §1 step 4）— 类别 **(B)/(C)** — **PARTLY PROVEN, understates the automatic baseline（部分证实，低估了自动基线）**

来源：[`dsh-pre-push-checks/SKILL.md:29`](../../.agents/skills/dsh-pre-push-checks/SKILL.md)（"There
is no universal local baseline beyond the hooks. Every behavior change needs the narrowest available
test or purpose-built check that would fail for its regression"）。

- **证实部分。** 对于单表面变更，*agent 选择*的证据确实是一两个检查（docs → `doc-sync`；package behavior → owning Vitest file；manifest → build + hygiene + smoke；`SKILL.md:31-35`）。
- **反证。** "Only one or two" 省略了**始终开启的自动基线**：每次 commit
  已经运行 pre-commit jobs（`lefthook.yml:5-38`：staged oxlint + fix、whitespace、vendor-manifest
  guard、notices regen、translation-pairing），每次 push 都运行 host-build typecheck。把这些加到你
  "一两个"之上，实际数字更高。对于横切变更，skill 明确
  要求更多（"add broader checks only for surfaces the diff actually reaches", `SKILL.md:29`；对于仓库级别变更的
  Full local rehearsal 路径 `SKILL.md:62-64`）。所以"一两个"是一个
  **median** 陈述，而不是上限，只有在忽略 hooks 时才读起来像保证。
- **裁定。** 方向正确，适用于 agent 选择的典型情况；如果被解读为"每次变更的总工作量是一两个检查"，则**误导**。

### 1.3 "forget the rules, the gates remember / 忘了规则没关系，门禁会替你记得"（§2）— 类别 **(B)/(C)** — **OVERSTATES the coverage the gates claim（夸大了门禁声称的覆盖范围）**

来源：[`quality-gates` note:11-15](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)
（"Agents follow enforced gates far more reliably than prose conventions…"）以及"Every mechanically
checkable AGENTS.md promise gets a command that exits non-zero"的决策。

- **证实部分。** 对于 *mechanically checkable* 子集——typecheck、per-file 100% coverage、lint、
  jscpd、knip/publint/constraints、doc-sync、translation-pairing、Note-format、whitespace、vendor manifest
  ——机器命令确实以非零退出。忘了*那些*确实会被抓住。
- **反证 (a)。本地门禁的覆盖范围狭窄。** [`docs/development.md:117`](../../docs/development.md)：
  *"the hooks intentionally do not run tests, snapshots, documentation checks, builds, or hygiene."*
  详尽的门禁集在 **CI** 中运行，即在 push 之后，即**慢**反馈——不是一个"记着"能帮你节省本地工作量的事情。
- **反证 (b)。该主张对于它所推崇的循环是自否定的。** 六步闭环、
  "在同一个 PR 中写 Note"规则、双语配对规则、`owner-surface` 规则、
  `report-only-commands-run` 规则——这些是 **skills/AGENTS.md 中的 prose conventions**，而不是门禁。
  机械违规者会被抓住；*叙述性*违规者（跳过 Note、错误的循环顺序）不会被命令抓住。
  仓库自己的 quality-gates note 承认了这个边界：这正是它说
  "mechanical enforcement"以及 Note-format 和 Note-classification verifier 存在的原因。所以
  "规则"中门禁能记住的是**少数**；answer 所推崇的循环
  本身是无门禁的 prose。
- **反证 (c)。门禁的记忆在 CI，而引用的 note 本身将其标记为已取代。**
  Quality-gates note 的 hook/CI 对称性已被
  [`fast-local-git-hooks`](../../.agents/notes/archived/process/2026-07-22-fast-local-git-hooks.md)
  取代（`:23`，"supersedes the hook/CI symmetry"），而 answer 引用 *quality-gates* note 时仿佛它
  描述了当前的 hook 集。当前的 hook 集是 `lefthook.yml`，比 quality-gates note 的 prose 暗示的更窄。
- **裁定。** 对机械规则为真，且仅在本地狭窄 hook 子集上；作为 blanket "你可以忘记规则"**unsupported**。
  不需要记住规则的感觉是真实的，但覆盖的规则面**很小**，而且漏掉了循环本身。

### 1.4 "whole-PR rollback / 整个 PR 原样回滚"（§4, §6）— 跨 **(B)/(C)** 的工作流层面事实 — **PROVEN, with a re-revert nuance（被证实，有 re-revert 的细微差别）**

来源：`upstream/master` 上的 git 历史。

- **已核实。** `#2903`（`577bb71418`, `worktree-revert-2608`）回滚 `#2608`
  （`4e1b3e4b87`），merge 是一个真正的镜像：`git diff --stat 4e1b3e4b87^1 4e1b3e4b87` = **67 files**，
  而 `git diff --stat 577bb71418^1 577bb71418` ≈ **67 files**（revert commit 本身是 66 个，额外的那个
  是后来的接触）。其他被回滚的切片存在：`#3000`（`revert-2926`）、`#3054`（`revert2698`）、
  `#2577`（`revert-2571`）、`#544`（`revert-543`）、`#3325`（`revert-pr-3087`）、`#3326`
  （`rerevert2608`）。因此已合并的切片整体回滚而不是向前修补——这个*模式*是真的。
- **反证 / 局限。** 原子性**不是**对 churn 免疫：`#3326` **重新回滚**了 `#2608`
  （即 `#2608` 的原始回滚后来被它自己回滚了）。整 PR 回滚是干净的*单次*撤销，
  仅当没有后续 PR 触及相同文件时才成立；在 6000+ merge 的历史中，这种情况经常不成立，
  所以"改错了…不需要外科手术"（`answer.md:9`）夸大了。这也是 **(B)/(C)** 的属性，
  (A) 用户从不看到——Web/CLI 用户不能回滚一个 PR。
- **裁定。** 模式**被证实**；"no surgery needed" 的修饰是**推断的**且有边界。

### 1.5 "write only the non-derivable essence / 只写不可派生的本质"（§5）— 类别 **(C)**（tool 作者）— **PARTLY PROVEN, understates the "essence"（部分证实，低估了"本质"）**

来源：[`adding-a-tool.md`](../../docs/cookbook/adding-a-tool.md)。

- **证实部分。** `defineTool` 提供了真正的免费价值：args 在 `execute` 之前就被类型化和验证
  （`adding-a-tool.md:42`），schemas 流入 system-prompt 组装（`:38`），注册是基于 effect 的
  （`:38`），Code Mode 从同一 schemas 免费到达（`:61-63`），UI card 从声明的 render intent 派生
  （`:71-83`）。"Generate, don't hand-edit"在
  [`docs/AGENTS.md`](../../docs/AGENTS.md) 中得到确认（"Generated catalogs are never hand-edited"）。
- **反证。** "只写不可派生的本质"低估了作者实际的表面。`execute()` 契约（`adding-a-tool.md:40-49`）密集：
  args-validated（但你仍然要手动检查 DSL 无法表达的非空字符串 / 正数 / 跨字段规则，`:42`）、
  identity-protection / 不 mutate 注册的定义（`:43`）、一个规范值 + `isError` 语义（`:45-46`）、
  尊重 `exec.signal`（`:47`）、可选的 `presentationMeta`（`:48`）、用于异步通知的 `exec.agent`
  （`:49`），以及 presenters 的 **purity hard rule**（`:86`——重放时没有 I/O、没有 session state、没有 clock）。
  "免费"的机制是真实的，但"本质"远不止一行声明。Answer 自己的"90 余行宽度"的 hedge 是模糊的；
  execute-contract 规则本身约 10 个密集行，reference 总共有 94 行，所以"90 余行"不是契约表面的精确度量。
- **裁定。** *机制*（派生其余部分）**被证实**；*程度*（仅"本质"）是**推断的且宽松的**。

### 1.6 六步闭环（"核对现场 → 判定窄 diff → 原子修改 owner 面 → 最小匹配证据 → 沉淀 → 只报告实际跑过的"）（§1）— 类别 **(B)** — **PROVEN as a description of what skills say; NOT proven as "the most natural path"（作为 skills 陈述的描述被证实；未证实为"最自然的路径"）**

- **作为抽象被证实。** 六步是
  [`dsh-pre-push-checks`](../../.agents/skills/dsh-pre-push-checks/SKILL.md)（checkout/branch/base +
  "never guesses or fetches a base", `SKILL.md:19-25`；narrowest test, `:29`）、
  [`dsh-code-review`](../../.agents/skills/dsh-code-review/SKILL.md)（change-scope first）、
  [`dsh-prose-standard`](../../.agents/skills/dsh-prose-standard/SKILL.md) + `doc-standards`
  （owning source then regenerate）、[`dsh-trim-cot-leakage`](../../.agents/skills/dsh-trim-cot-leakage/SKILL.md)
  （HEAD, no-session reader test）、Agent-Note 规则（[`.agents/notes/README.md`](../../.agents/notes/README.md)）
  和 `AGENTS.md:92`（"report only commands run"）的忠实投影。每个 skill 具体化了同一个骨架。
- **作为排名未证实。** 问题是问哪条路径*最自然 / 最被强化*。Answer
  从*三个证据流的汇聚*推断出"窄证据切片闭环"，但没有为任何竞争对手分配一个可证伪的排名；
  "三个机制"（§2–4）是提出的*解释*，而不是测量的原因。Answer 甚至承认这个闭环不是唯一路径：
  它记录仓库历史包含**三种**共存的 PR 实践（lettered worktrees、numbered native stacks，以及
  大多数纯独立 `fix/`/`feat/` PR, `answer.md:77`; `research.md:36`）。因此"最自然的那一个"
  是一个**综合推断**，而不是一个被展示的唯一种子。
- **关键的混淆。** 六步是 *agent 的执行循环*——(B)。(A) 用户不运行这个循环，也不观察它；
  (A) 用户观察一个不同的循环（见 §2）。然而 §1 和标题（"正确 = 最省力路径"）被写成
  好像这个循环是问题的通用答案。
- **裁定。** **作为 skills 语料的忠实总结被证实**；**作为可测量的"最自然"路径未证实**，且**错误适用于类别 (A)**。

### 1.7 "correct path = least-effort path（正确路径与最省力路径被制度对齐）" — 类别 **(B)/(C)** — **INFERRED, plausible only for the mechanical subset（推断，仅对机械子集合理）**

- 在*机械*意义上得到支持：只运行最窄失败检查的 agent 每 token 做更多正确工作，
  CI 后盾覆盖了穷举性违规。这是一个连贯的设计主张，由
  [`quality-gates:15`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)
  和 `fast-local-git-hooks:10-20` 支持。
- **反证。** 对齐仅适用于"正确"是*机械强制执行的*地方。当规则是 prose（循环顺序、Note 必要性判断、
  `report-only-commands-run`、tier 放置）时，最省力路径**不**自动是正确路径——
  你仍然必须阅读并遵循 prose。所以这个"对齐"是一个**部分的**对齐，而 answer 在没有限定词的情况下陈述了它。
- **裁定。** **推断的且过度概括的**；对机械规则为真，但不适用于它所包裹的 prose 循环。

### 1.8 §3 "验证本身便宜 / validation is cheap"（§3, 第 51 行）— 类别 **(B)/(C)** — **unsupported gloss on the quoted source（对所引来源的不可支持的修饰）**

来源：[`docs/testing.md:25`](../../docs/testing.md) — "We are DeepSeek — do not ration real-API tests.
A no-key test proves plumbing; only a with-key run proves the agent works against a real model." Answer
引用此作为"验证本身便宜"的证据。

- **反证。** "Do not ration"是一个**反成本借口**的指示，而不是成本主张。它所指的——带 key 的真实 API e2e——
  是仓库中**最昂贵的**验证（真实模型、真实网络、真实延迟、真实金钱）。这个修饰颠倒了引用的意图。
  便宜的部分是 *no-key plumbing* 证明；昂贵的部分（真实模型证明）*不*设配额 *因为正确性重要*，
  而不是*因为它便宜*。
- **裁定。** **Unsupported / misleading** 如其所表述。

### 1.9 §6 历史量化 — 类别 **(B)/(C)** — **reported, method-dependent, and answer-vs-research inconsistent（已报告、方法依赖、answer 与研究不一致）**

- Answer 的标题百分比（88% notes / 96% tests / 86% docs / 90% src）与 `research.md:31` 匹配，
  answer 复现了警示（"测试类 94 与 96 之差是计数定义噪音", `answer.md:74`），这很好。
- **但 answer 默默丢弃了其 own research 记录的可复现性警示，且在数字上与它不一致：**
  - **作者计数。** `answer.md:75` 给出 "Tianyi Cui **5475** / Yichen Jiang **1680** / imccyu **1556**"；
    `research.md:35` 给出 "Tianyi Cui **5000** / Yichen Jiang **1666** / imccyu **1556**"。同一 FAQ 中的两个文档
    不一致。实测：在 `upstream/master` `--no-merges` 上，Tianyi Cui = **2433**（Yichen Jiang =
    **869**）；跨 `--all` incl. merges，Tianyi Cui = **5475**（Yichen Jiang = **1680**）。所以"5475"是一个
    特定的计数选择（所有 refs，包含 merges），而"5000"与我可复现的任何方法都不匹配。
  - **Checkpoint 密度。** `answer.md:75` 说 "merge-forward checkpoint 密度约 **1.8** 次/PR"。
    `research.md:33` 说原始数据是 "≥**1.4** 次/PR" 并明确注明 "原记 1985/1085 的密度口径
    **未能复现**，方向不变"。Answer 将一个不可复现的指标提升为精确数字（1.8）并丢弃
    "未能复现"的警示。在 `upstream/master` 上实测：1230 个 PR-landing merges，而 body 中提到
    "checkpoint" 的 commits 集合 ≈154（≈0.13 每此类 merge）——远非 1.4 或 1.8。
    关键不是哪个数字正确；而是该比率不可复现且 FAQ 以两种方式报告了它。
  - **`fz@dsh.dev` commits。** `answer.md`/`research.md:35` 说 91；在 `upstream/master` 上实测 = **92**。
- **裁定。** *历史证据*（切片是真实的；回滚是真实的；文档在很大程度上是
  观察结果）**被证实**。*精确数值*是**方法依赖且在 FAQ 中报告不一致**；
  answer 应要么重现计数命令，要么陈述范围，而不是精确到小数位。

---

## 2. 类别 (A) 实际做了什么和观察了什么——缺失的一半

对于通过 Web/CLI 指挥 DSH 的人类，§1 的机制中没有一个可见。他们经历的轻松感是由**运行时姿态**生成的，
它是**部署级配置**，而不是仓库流程。已核实的主要来源：

- **只在权威边界问，从不问检查可发现的事实。** Plan-mode 姿态节，answer 引用了它但也只是作为"姿态条款"，
  实际上是 (A) 面对的契约："A user's conversational agreement — including an answer confirming something you asked — **approves nothing**"
  （[`packages/bundle/base/cordis.patch.yml:305`](../../packages/bundle/base/cordis.patch.yml)）；"Resolve
  discoverable facts by inspection. Use `ask_user_question` only for user-owned choices or material
  ambiguity that inspection cannot answer. **Do not ask the user where code lives**"（`:311`）。工具自身的描述
  进一步缩小范围："when you need confirmation, a choice, or missing information"
  （[`packages/interaction/tool-ask-user/src/index.ts:16`](../../packages/interaction/tool-ask-user/src/index.ts)）。
  这是 (A) 体验感觉轻松的确切原因：**人只在为他们拥有的决策时被打断**，
  而检查可以解决的一切都由 agent 处理。
- **按需而非预先的知识。** Skills 被广告为 hashed、deduped 的 catalog 摘要，
  仅在被调用时才完全加载
  （[`packages/skill/tool-skill/src/index.ts`](../../packages/skill/tool-skill/src/index.ts)，`agent/pre-step`
  catalog + hash-digest；用户的 `/name` 手势是确定性加载）。人类从不需事先阅读规则。
- **使进度可读的脚手架。** Todo 列表（整表替换，
  [`packages/todo/tool-todo/src/index.ts:45-66`](../../packages/todo/tool-todo/src/index.ts)）和
  plan-mode 门禁使 agent 的工作*可见且可步进*，而无需人驱动每一步。
- **Advisory 而非致命的引导。** 重复调用提醒温和升级（`[3,5,8]`，
  [`packages/guard/repeat-tool-reminder/src/index.ts:46`](../../packages/guard/repeat-tool-reminder/src/index.ts)）
  且是 advisory（`:209-224`），注册在 post-execute 正是为了让*被拒绝的*调用获得指导。
  卡住 → 被引导，而非被杀。
- **可读的最终交付。** 后台子会话 settle 时，运行时把 outcome 与 final message 作为 notice 交回父会话
  （"When a background run settles, the runtime sends you a notice containing its outcome and any final
  assistant message"，[`packages/subagent/tool-subagent/src/index.ts:603`](../../packages/subagent/tool-subagent/src/index.ts)）。
  rc.1 删除了独立的自足 `report` 工具（`tool-subagent-report`）。
  对 (A) 用户而言，最顶层的对应物仍是可读的完成报告，而不是六步循环。
- **可重放性 / 对 transcript 的信任。** `model-visible ⟺ logged` 不变量
  （[`AGENTS.md`](../../AGENTS.md) — "anything that reaches a model request must be reconstructable from the
  session log"）是让人信任并重新检查发生了什么的机制。这是一个关于*审计 agent* 的运行时不变量，
  不是关于*写代码*。

**结论。** 这些都是**产品/运行时**机制。(A) 轻松感的正确描述是：
"人只在为他们拥有的决策时被征求；其余由 agent 检查；工作被脚手架化为可见；
知识按需加载；卡住时被引导而非被杀；最终报告是自包含且可重建的。"
§1 的 git-hooks / gates / narrow-tests / atomic-slice 主张中没有一个对此有贡献。

---

## 3. 推荐的修正论点

> **落地状态（0006 复核补记）**：本节是审计当时的建议清单。后续的 FAQ 11 修订已部分采纳——最明确的是双重主语：`answer.md` 现在区分「agent 执行者的六步闭环」与「人类指挥者回路」，并配 `figures/two-loops.svg`；第 7 条的历史数值改为带基线的复核注记。本节其余各条的采纳情况未逐条标注，读的时候请以 `answer.md` 的当前正文为准，不要把它当成一份未处理的待办。

当前 answer 的论点将 **repo-process ease（仓库流程轻松）**（agent/contributor）与 **product-usage ease（产品使用轻松）**
（指挥 DSH 的人）混为一谈。替换为**双重主语**论点，并将每个机制重新锚定到其实际所有者：

> **DSH 对两个不同的主语轻松，出于两个不同的原因。**
>
> **对于 agent (B) 和手动贡献者 (C)，** 轻松是一个*流程*属性：正确和
> 便宜在*机械强制执行*的子集上重合。本地 hooks 保持狭窄（`lefthook.yml`,
> [`docs/development.md:117-125`](../../docs/development.md)），agent 选择会为其回归而失败的最窄检查
> （`dsh-pre-push-checks:29`）；变更的正确性被委派给 CI
> 因此本地成本保持低。整 PR revert 是真实的（`#2903` 镜像 `#2608`, 67 文件），但只有在没有后续碰撞时才是干净的
> 单次撤销。这**不是**一个"你可以忘记规则"的主张：门禁覆盖一个*机械*子集，而被推崇的六步循环本身是无门禁的 prose。
> 这里诚实的"轻松"是 **"机械可检查的负担由机器承担；叙述性负担（循环顺序、Note 必要性、tier 放置、报告忠实度）仍然通过 skills 由你承担。"**
>
> **对于通过 Web/CLI 指挥 DSH 的人类 (A)，** 轻松是一个*产品*属性，不在 git 层中。
> 人只在为他们拥有的决策时被打断（"conversational agreement approves nothing",
> "do not ask where code lives", [`cordis.patch.yml:305,311`](../../packages/bundle/base/cordis.patch.yml)）；
> 知识按需加载；工作被脚手架化（todo + plan）和引导（advisory guard）；结果由运行时在子会话 settle 时
> 以 notice 交回父会话，而不是由子会话自己交一份报告
> （[`continuation-messages.ts:130`](../../packages/subagent/subagent/src/continuation-messages.ts)、
> [`docs/subsystems/subagent.md:202`](../../docs/subsystems/subagent.md)）。对 (A) 而言，
> "轻松"意味着 **"harness 处理流程，只在需要我选择时中断我。"**
>
> 两种"轻松"**不是**同一现象。如果问题是"为什么对一个人来说驾驶 DSH 很容易"，答案是其 **运行时姿态**，
> 而不是仓库的门禁/hook/窄测试经济学。

需要明确的修正：

1. **添加类别 (A)** 作为独立主语（问题自己的"observer"框架），并将仓库流程机制（§1–6）移到 (B)/(C) 下。
   不要将六步循环呈现为 (A) 框架问题的答案。
2. **拆分"forget rules, gates remember"** 为 (a) 机械子集——门禁确实记住，以及 (b) 仍是 prose 的
   子集——循环本身和 Note-tier 规则——没有门禁记住。引用当前 hook 集
   （`lefthook.yml`）和取代中的 `fast-local-git-hooks` note，而不是已取代的 quality-gates hook/CI
   对称性。
3. **将"seconds"降级**为"local is much faster than CI"；仓库拒绝保证持续时间
   （`fast-local-git-hooks:35`），pre-push 运行完整的 host build + client typecheck。
4. **限定"one or two checks"** 加上始终开启的 hook 基线和横切异常。
5. **重做 §3 中"validation is cheap"的修饰**："do not ration real-API tests" 是一个反成本借口，
   而不是成本主张；真实模型 e2e 是仓库中最昂贵的验证。
6. **中立化"只写不可派生的本质"** 通过列出 tool 作者仍然写的内容（execute contract、
   `signal`、`isError`、带 purity rule 的纯 presenters）并命名 DSL 的限制
   （[`adding-a-tool.md:40-49,86`](../../docs/cookbook/adding-a-tool.md)）。
7. **删除或限定精确的历史数值**，这些数值是方法依赖的或 answer 自己的研究标记为不可复现的：
   作者计数（answer 5475/1680/1556 vs research 5000/1666/1556 vs 实测 2433/869）、checkpoint 密度
   （answer "≈1.8/PR" vs research "≥1.4, 未能复现"）和 `fz@dsh.dev`
   （91 vs 92）。重现计数命令或呈现范围。

---

## 4. 核实附录（已读取的原始来源）

- [`answer.md`](./answer.md), [`research.md`](./research.md), [`question.md`](./question.md) — 被审计的文本。
- [`lefthook.yml`](../../lefthook.yml) — pre-commit jobs, pre-push typecheck。
- [`package.json`](../../package.json) — `typecheck` = host build + client typecheck。
- [`docs/development.md`](../../docs/development.md) — Git integrations, "hooks intentionally do not run…"。
- [`docs/testing.md`](../../docs/testing.md) — coverage gate（"uncovered line often dead code"）、
  real-API policy（"do not ration"）。
- [`docs/cookbook/adding-a-tool.md`](../../docs/cookbook/adding-a-tool.md) — 最小形状、
  execute contract、Code Mode free、purity hard rule。
- [`docs/AGENTS.md`](../../docs/AGENTS.md) — tier taxonomy、one-home-per-fact、"never hand-edited"。
- [`AGENTS.md`](../../AGENTS.md) — "report only commands run", "Never default to the full suite"。
- [`.agents/notes/implemented/process/2026-06-11-quality-gates.md`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)
  — "developed primarily by coding agents", "Every mechanically checkable…", "gates are code to maintain"。
- [`.agents/notes/archived/process/2026-07-22-fast-local-git-hooks.md`](../../.agents/notes/archived/process/2026-07-22-fast-local-git-hooks.md)
  — 当前 hook 集、取代 quality-gates、无延迟保证。
- [`packages/bundle/base/cordis.patch.yml`](../../packages/bundle/base/cordis.patch.yml) — plan-mode posture。
- [`packages/interaction/tool-ask-user/src/index.ts`](../../packages/interaction/tool-ask-user/src/index.ts) — ask_user_question 契约。
- [`packages/skill/tool-skill/src/index.ts`](../../packages/skill/tool-skill/src/index.ts) — 两层披露、catalog hash。
- [`packages/core/system-prompt/src/index.ts`](../../packages/core/system-prompt/src/index.ts) — section order convention。
- [`packages/workflow/tool-workflow/src/index.ts`](../../packages/workflow/tool-workflow/src/index.ts) — tool guidance lives in tool plugins。
- [`packages/subagent/subagent/src/continuation-messages.ts`](../../packages/subagent/subagent/src/continuation-messages.ts) — settle notice（rc.1 起取代 `tool-subagent-report`）。
- [`packages/subagent/tool-subagent/src/index.ts`](../../packages/subagent/tool-subagent/src/index.ts) — background-first delegation。
- [`packages/guard/repeat-tool-reminder/src/index.ts`](../../packages/guard/repeat-tool-reminder/src/index.ts) — advisory thresholds。
- [`packages/todo/tool-todo/src/index.ts`](../../packages/todo/tool-todo/src/index.ts) — todo as visible skeleton。
- Git 历史（`upstream/master`, tip `0a53fb55be`）：reverts `#2903`/`#2608`（67-file mirror）、`#3000`、
  `#3054`、`#2577`、`#544`、`#3325`、`#3326`（re-revert）；作者计数；checkpoint mentions；
  `fz@dsh.dev` = 92；`Co-authored-by` = 4。
