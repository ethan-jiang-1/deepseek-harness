# 参考：每条结论的出处

分篇正文只给结论，出处散落在各页的「证据入口」里。这一页把它集中起来：**每个说法对应 DSH 仓库里的哪个文件、哪一行**。想核对原文、或者上游改动后来确认哪些页过期了，从这里查。

## 怎么读这张表

- 路径都相对于**本仓库根目录**（`deepseek-harness/`）。`.agents/notes/` 就是 Agent Note 制度的 owner 目录。
- 行号按下面的基线测量。**规则文件如果被改过，行号会漂，路径不会**——所以先看路径，再用行号定位。
- 标「实测」的条目是我在本仓库跑命令数出来的，不是规则原文；仓库每天都在长，这类数字最先过期。

> **基线：** 工作树 `caf78ed639`（本组页面成稿时的 commit）。测量后工作树前进到 `a98317a9a4`，但我逐文件 `git diff caf78ed639..a98317a9a4` 核过：本文引用的全部规则文件、门禁脚本与 skill **一字未改**，所以行号仍然有效。

## 一、规则原文的 owner 文件

| 说法 | 出处 | 位置 |
|---|---|---|
| Agent Note 是「agent 写的 RFC」，保留 rationale / alternatives / consequences / verification | [`.agents/notes/AGENTS.md`](../../.agents/notes/AGENTS.md) | 第 3 行 |
| 每篇新 Note 必须做 supersession 检查；部分取代保持活跃并互链 | [`.agents/notes/AGENTS.md`](../../.agents/notes/AGENTS.md) | 第 5 行 |
| 归档件是冻结快照，永不编辑、不得当作当前权威 | [`.agents/notes/archived/AGENTS.md`](../../.agents/notes/archived/AGENTS.md) | 全文 |
| 创建门槛：只为「代码、测试与现有文档都装不下的持久决定理由」写 Note | [`.agents/notes/README.md`](../../.agents/notes/README.md) | § When to write one（第 44 行起） |
| 机械与局部编辑豁免，含局部 UI 呈现与交互 | [`.agents/notes/README.md`](../../.agents/notes/README.md) | § When to write one |
| 涉及持久化、协议、权限、跨组件状态归属、共享交互规则时仍回到持久价值判据 | [`.agents/notes/README.md`](../../.agents/notes/README.md) | § When to write one |
| 六个类型的定义、`architecture` 与 `process` 的分界 | [`.agents/notes/README.md`](../../.agents/notes/README.md) | § Classification（第 21 行起） |
| 保留 / 归档 / 删除的语义判据；「实现很小」不构成理由 | [`.agents/notes/README.md`](../../.agents/notes/README.md) | § Archiving and deletion（第 36 行起） |
| 三种状态的正文骨架（proposed / implemented / rejected 各自的必需章节） | [`.agents/notes/README.md`](../../.agents/notes/README.md) | § The body skeleton（第 76 行起） |
| `## Risks` 是合法章节（第 88 行）；`## Consequences` 是 implemented 必需章节（第 100 行） | [`.agents/notes/README.md`](../../.agents/notes/README.md) | 第 88 / 100 行 |
| rejected 保留提案期章节（含 `## Acceptance criteria`、`## Plan`） | [`.agents/notes/README.md`](../../.agents/notes/README.md) | § `rejected/`（第 105 行起） |
| `## Alternatives considered` 强制 | [`.agents/notes/README.md`](../../.agents/notes/README.md) | 第 109 行起 |
| 生命周期之间如何移动、需要同时满足什么 | [`.agents/notes/README.md`](../../.agents/notes/README.md) | 第 119 行起 |
| 中文对侧的规则 | [`.agents/notes/README.md`](../../.agents/notes/README.md) | 第 123 行起 |
| implemented 侧写成当前状态的子树补充要求 | [`.agents/notes/implemented/AGENTS.md`](../../.agents/notes/implemented/AGENTS.md) | 全文 |
| 路径语法、`Layout and naming` | [`.agents/notes/README.md`](../../.agents/notes/README.md) | § Layout and naming（第 7 行起） |

## 二、门禁脚本（DSH 自己执行的检查）

这些是**会以非零退出码失败**的脚本，都在 `scripts/` 下，由 `pnpm run doc-sync` 汇总调用。

| 说法 | 出处 | 位置 |
|---|---|---|
| 头部三行精确匹配、全文只有一个 `Status:` 行 | [`scripts/verify-agent-note-format.ts`](../../scripts/verify-agent-note-format.ts) | 头部解析段 |
| 三种状态的精确正则（rejected 必须 `— ` 加理由） | [`scripts/verify-agent-note-format.ts`](../../scripts/verify-agent-note-format.ts) | 第 29 行 `REQUIRED` 附近的 status 校验 |
| `## Problem` 必须是第一个 h2 | [`scripts/verify-agent-note-format.ts`](../../scripts/verify-agent-note-format.ts) | 正文骨架校验段 |
| implemented 禁用标题正则 `Proposal\|Plan\|Migration plan\|Acceptance criteria` | [`scripts/verify-agent-note-format.ts`](../../scripts/verify-agent-note-format.ts) | **第 36 行** |
| 禁用标题的报错原文 | [`scripts/verify-agent-note-format.ts`](../../scripts/verify-agent-note-format.ts) | 第 74 行 |
| grandfather 注释只对 `2026-07-05` 之前的 Note 有效 | [`scripts/verify-agent-note-format.ts`](../../scripts/verify-agent-note-format.ts) | **第 13 行** `FORMAT_ADOPTED`、第 82 行校验 |
| 退役的 legacy 债务标记被拒 | [`scripts/verify-agent-note-format.ts`](../../scripts/verify-agent-note-format.ts) | 第 19 行 `LEGACY_MARKERS`、第 84 行校验 |
| 封闭的生命周期与类型目录、文件名日期格式、`INDEX.md` 禁令 | [`scripts/agent-note-tree.ts`](../../scripts/agent-note-tree.ts) | 第 48 / 54 / 68 / 72 / 76 行（各条报错） |
| 上一条是**共享模块**，错误随 `verify-agent-note-format` 等门禁失败 | [`scripts/verify-agent-note-format.ts`](../../scripts/verify-agent-note-format.ts) 第 38 行调用 `walkAgentNoteTree()` | — |
| 格式与树门禁**跳过** `.zh.md` | [`scripts/agent-note-tree.ts`](../../scripts/agent-note-tree.ts) | 第 64 行 |
| 三件套完整性、中英逐章节一致性 | [`scripts/verify-translation-pairing.ts`](../../scripts/verify-translation-pairing.ts) | 全文 |
| 章节键取**英文**标题 slug（第 133 行 `slug(headingText(enSection.heading))`），键的构成说明见第 102 行 | [`scripts/translation-pairing-record.ts`](../../scripts/translation-pairing-record.ts) | 第 102 / 133 行 |
| 「标题文字本身会被翻译，因此不能参与跨语言对齐」这句理由 | [`scripts/translation-brief.ts`](../../scripts/translation-brief.ts) | **第 125 行**注释 |
| 各门禁在总入口里如何挂载 | [`scripts/run-gates.ts`](../../scripts/run-gates.ts) | `agent-note-format` 第 843 行、`archived-agent-notes` 第 844 行、`translation-pairing` 第 819 行 |
| 归档件的冻结与三件套规则 | [`scripts/verify-archived-agent-notes.ts`](../../scripts/verify-archived-agent-notes.ts) | 全文 |
| 六类型调用的共享类型集合 | [`scripts/archived-agent-notes.ts`](../../scripts/archived-agent-notes.ts) | 第 5 行 import |

## 三、追加要求的 skill

skill 只追加**判断的语义部分**，不重复门禁能机械检查的东西。全部在 `.agents/skills/` 下。

| 说法 | 出处 |
|---|---|
| 保留 / 归档 / 删除的分类判据、校准例子、不朝配额归档 | [`dsh-archive-agent-notes/SKILL.md`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md) |
| 不要为保住候选计数而创建重复 Note | [`dsh-find-simplifications/SKILL.md`](../../.agents/skills/dsh-find-simplifications/SKILL.md) |
| 保留 rationale / mechanisms / alternatives / consequences / 已交付的验证证据；删规划清单 | [`dsh-prose-standard/SKILL.md`](../../.agents/skills/dsh-prose-standard/SKILL.md)（校准例子在 [`references/examples.md`](../../.agents/skills/dsh-prose-standard/references/examples.md)） |
| 链接不能替代本地合同 | [`dsh-prose-standard/SKILL.md`](../../.agents/skills/dsh-prose-standard/SKILL.md) |
| 反模式：spec-speak、变更叙述、审查视角残留 | [`dsh-trim-cot-leakage/SKILL.md`](../../.agents/skills/dsh-trim-cot-leakage/SKILL.md)（例子在 [`references/examples.md`](../../.agents/skills/dsh-trim-cot-leakage/references/examples.md)） |
| review 侧如何看待 Note | [`dsh-code-review/SKILL.md`](../../.agents/skills/dsh-code-review/SKILL.md) |
| 文档写作与预算 | [`dsh-doc/SKILL.md`](../../.agents/skills/dsh-doc/SKILL.md) |
| 破坏性变更要立刻写 upgrade guide | [`dsh-create-upgrade-guide/SKILL.md`](../../.agents/skills/dsh-create-upgrade-guide/SKILL.md) |
| 推送前该跑哪些检查 | [`dsh-pre-push-checks/SKILL.md`](../../.agents/skills/dsh-pre-push-checks/SKILL.md) |

## 四、作为范例的真实文件

正文引用的每个例子都是仓库里的真实文件，可以直接打开对照。

| 用来说明什么 | 文件 |
|---|---|
| 出口 ③：小改动、但放宽了安全保证（171 词） | [`implemented/feature/2026-09-16-sandbox-same-mode.md`](../../.agents/notes/implemented/feature/2026-09-16-sandbox-same-mode.md) |
| 出口 ③：一条看不出规律的长期约定（232 词） | [`implemented/process/2026-09-22-workspace-release-ranges.md`](../../.agents/notes/implemented/process/2026-09-22-workspace-release-ranges.md) |
| rejected 的价值：防止重新开讼 | [`rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md`](../../.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md) |
| 「机械门禁优于散文约定」的实测结论 | [`implemented/process/2026-06-11-quality-gates.md`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md) |
| 多语言三件套的实际形态 | [`implemented/feature/2026-09-16-sandbox-same-mode.i18n.yaml`](../../.agents/notes/implemented/feature/2026-09-16-sandbox-same-mode.i18n.yaml)（同目录另有 `.md` 与 `.zh.md`） |
| `.i18n.yaml` 的键形态：`/{H1 标题 slug}/{h2 标题 slug}` | 同上文件，例如 `/agent-note-repeated-sandbox-modes-need-no-approval/decision` |

## 五、实测数字（会过期）

这些是我在仓库里跑出来的，**不是规则原文**。过期风险最高，用前请复核。

| 数字 | 怎么得到的 |
|---|---|
| 活跃 578 篇 = `proposed` 39 + `implemented` 525 + `rejected` 14；归档 641 篇 | 数 `.agents/notes/` 下各生命周期目录（**不含** `.zh.md` 与 `.i18n.yaml`），基线 `caf78ed639`，2026-10-08 |
| implemented 各类型：architecture 201 / feature 132 / process 69 / bug-fix 63 / testing 33 / simplification 27 | 同上，按类型子目录分别计数 |
| 5 篇 implemented 仍带 `## Risks` | 全树 grep `^## Risks`，逐篇确认其在 `implemented/` 下 |
| 2 篇活跃 Note 使用 grandfather 注释（另有 6 篇在归档树） | 全树 grep `agent-note-format: alternatives-not-recorded` |
| 改名历史里 20 处 `notes/rejected/` ↔ `notes/proposed/` 相关变更，全部是 `proposed` → `rejected` | `git log --diff-filter=R --name-status -- .agents/notes` |
| 2026-09-18 之后一个月：新增 Note ≈ 110，非合并提交 ≈ 914 | Note 按文件名日期计，提交按 `--no-merges` 计；重命名与合并会同时抬高两侧，只用于给量级感，不做逐年比较 |

## 六、移植时要分清的两类文件

第六页讲的移植，判断依据是「这是 DSH 的机制，还是 DSH 自己的装载方式」。这个边界有明确 owner：

| 说法 | 出处 |
|---|---|
| 插件仓**不继承** DSH 的目录拓扑、Agent Notes、gates 与发布序列；可迁移的是「一个事实一个 owner、生成物有生成器、决定有记录」这类原则 | [`_dsh_plugin_agent_ready_development/repo-harness/09-plugin-author-entry.md`](../../_dsh_plugin_agent_ready_development/repo-harness/09-plugin-author-entry.md) 第 45 行 |
| Note 与 README / docs / Skill 的分工 | [`_dsh_plugin_agent_ready_development/repo-harness/02-legibility-and-ownership.md`](../../_dsh_plugin_agent_ready_development/repo-harness/02-legibility-and-ownership.md) |
| skill 作为程序性记忆的定位 | [`_dsh_plugin_agent_ready_development/repo-harness/03-skills-as-procedural-memory.md`](../../_dsh_plugin_agent_ready_development/repo-harness/03-skills-as-procedural-memory.md) |
| 从哪开始写、什么时候更新既有 owner | [`_dsh_plugin_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md`](../../_dsh_plugin_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md) |
| 文档标准与 slop 清单，含「implemented 里的 spec-speak」这条反模式 | [`docs/AGENTS.md`](../../docs/AGENTS.md) 第 72 行 |
| 多语言政策 | [`docs/i18n/README.md`](../../docs/i18n/README.md) |

## 七、本组页面自己的记录

| 文件 | 说明 |
|---|---|
| [`question.md`](./question.md) | 问题与范围声明 |
| [`answer.md`](./answer.md) | 一分钟版、目录清单、推荐顺序、术语速查 |
| [`walkthrough.md`](./walkthrough.md) | 附录：一次真实改动的全程走查 |
| [`self-audit.md`](./self-audit.md) | 附录：第一轮成稿后的对抗性自查（描述的是当时状态） |

---

*基线：工作树 `caf78ed639`，2026-10-08 测量；同日复核至 `a98317a9a4`，本文引用的规则文件在该区间无改动。*
