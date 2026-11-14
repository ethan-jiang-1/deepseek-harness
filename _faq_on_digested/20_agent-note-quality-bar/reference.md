# Reference · Agent Note 权威规则、门禁脚本与真实样本索引

本页集中汇总 FAQ 20 引用到的全部 DSH 主仓规则文件、门禁脚本、配套技能（Skills）以及真实 Note / 提交样本，方便直接对照源码核查。

---

## 一、核心规则与文档标准（Owner 文件）

| 规范主题 | 仓库文件路径 | 负责定义什么 |
|---|---|---|
| **制度总纲** | [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md) | 准入门槛与豁免范围、路径语法、6 个封闭分类、三态正文骨架、`Alternatives considered` 强制规则、完全取代合并条件、归档与删除准则 |
| **子树常设指令** | [`.agents/notes/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/AGENTS.md) | Agent Note 定位（Agent 撰写的内部 RFC）、每新增一篇必触发的取代检查（Supersession Check） |
| **已交付记录同步边界** | [`.agents/notes/implemented/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/AGENTS.md) | `implemented/` 记录随代码路径/名称/默认值同步更新事实的义务，以及严禁原地篡改历史决定的边界 |
| **归档冻结规范** | [`.agents/notes/archived/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/AGENTS.md) | 归档三件套五步封存要求、永久只读禁令、出站链接免检说明及唯一授权历史哈希例外记录 |
| **全仓静态文档分层** | [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md) | `Document current state` 原则、文档分层职责表（把设计理由分流给 Agent Note）与 `implemented` 提案残留词（slop）禁令 |
| **双语三件套契约** | [`docs/i18n/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/i18n/README.md) | 中英双语同权规则、`.md` + `.zh.md` + `.i18n.yaml` 同目录配对与哈希记录语义 |

---

## 二、机器门禁脚本与本地钩子

以下检查统一挂载在 [`scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts)（通过 `pnpm run doc-sync` 运行），归档防篡改与翻译配对同时挂载在本地 Git 钩子中：

| 检查项 | 脚本 / 配置文件 | 拦截什么违规行为 |
|---|---|---|
| **目录树与分类共享解析** | [`scripts/agent-note-tree.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/agent-note-tree.ts) | 校验顶层生命周期目录、6 个封闭分类目录、三层目录深度、`yyyy-mm-dd-*.md` 文件名语法，并拒绝集中式 `INDEX.md` |
| **分类门禁入口** | [`scripts/verify-agent-note-classification.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-agent-note-classification.ts) | 调用 `walkAgentNoteTree()` 对非法目录结构与未知分类以非零退出码报错 |
| **正文格式与骨架门禁** | [`scripts/verify-agent-note-format.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-agent-note-format.ts) | 校验前四行头部语法、唯一 `Status:` 行、首节 `## Problem`、各状态必填章节、`implemented/` 禁用标题（`Proposal` / `Plan` / `Migration plan` / `Acceptance criteria`），以及 `2026-07-05` 前后 grandfather 注释合法性 |
| **双语三件套配对门禁** | [`scripts/verify-translation-pairing.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-translation-pairing.ts)<br>[`scripts/translation-pairing-record.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/translation-pairing-record.ts)<br>[`scripts/translation-brief.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/translation-brief.ts) | 校验中英两侧章节深度与数量一致、机器头部标记保留英文、代码块逐字一致及 `.i18n.yaml` 哈希最新 |
| **归档冻结校验门禁** | [`scripts/verify-archived-agent-notes.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-archived-agent-notes.ts)<br>[`scripts/archived-agent-notes.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/archived-agent-notes.ts) | 校验 `archived/{class}/` 封闭分类、完整三件套、`Archived: YYYY-MM-DD` 元数据行与只追加冻结内容哈希清单 |
| **本地提交钩子** | [`lefthook.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/lefthook.yml) | 在 `pre-commit` 与 `pre-merge-commit` 阶段拦截对 `.agents/notes/archived/**` 的非法改动并检查暂存的 `.i18n.yaml` |

---

## 三、承担语义判断与跨载体协作的 Skills

| 技能路径 | 在 Agent Note 治理中的职责 |
|---|---|
| [`.agents/skills/dsh-archive-agent-notes/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-archive-agent-notes/SKILL.md) | 留存、归档与整套删除的语义判据、正反校准样本（反驳按字数或年龄划线）及五步归档标准动作 |
| [`.agents/skills/dsh-prose-standard/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-prose-standard/SKILL.md)<br>[`references/examples.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-prose-standard/references/examples.md) | 提案转正时保留动机/备选/后果/验证证据与覆盖缺口、删待办清单的尺度，以及“外链理由不得替代本地代码合同”规则 |
| [`.agents/skills/dsh-trim-cot-leakage/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-trim-cot-leakage/SKILL.md)<br>[`references/examples.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-trim-cot-leakage/references/examples.md) | 清除会话推理残渣、把“Review 被拒”改写为永久技术理由进 `Alternatives considered`、禁止记录文件自身修订版本号 |
| [`.agents/skills/dsh-find-simplifications/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-find-simplifications/SKILL.md) | 删减类提案必备的四项证据（调用方清点、省下的维护成本、放弃的能力、可观察验收）及禁止重复建 Note |
| [`.agents/skills/dsh-code-review/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-code-review/SKILL.md) | 审查实现 PR 时核对 `proposed/` 是否已同提交改写为现在时 `implemented/` 且路径/名称与代码一致 |
| [`.agents/skills/dsh-create-upgrade-guide/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-create-upgrade-guide/SKILL.md) | 升级指南超过 500 词预算时，将深层设计理由剥离进对应 Agent Note |
| [`.agents/skills/dsh-doc/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-doc/SKILL.md) & [`.agents/skills/dsh-pre-push-checks/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-pre-push-checks/SKILL.md) | 区分面向人类读者的文档结构与 Agent Note 骨架；推送涉及 Note 的改动前跑 `pnpm run doc-sync` |

---

## 四、正文引用的真实 Note 与历史提交样本

| 说明要点 | 真实样本 / 永久事件链接 |
|---|---|
| 收紧准入门槛（废除“非平凡改动必写”旧规） | 历史提交 [`730bcc7c85`](https://github.com/deepseek-ai/deepseek-harness/commit/730bcc7c85)（`docs: require lasting rationale before creating agent notes`） |
| 确立 6 个封闭领域分类子目录 | 历史提交 [`a767cd357f`](https://github.com/deepseek-ai/deepseek-harness/commit/a767cd357f)（PR [`#2280`](https://github.com/deepseek-ai/deepseek-harness/pull/2280)） |
| 零 Note 合格交付参照（7 文件局部 UI 呈现调整） | 历史提交 [`5124a2a310`](https://github.com/deepseek-ai/deepseek-harness/commit/5124a2a310)（PR [`#5004`](https://github.com/deepseek-ai/deepseek-harness/pull/5004)） |
| 小改动改安全边界 + 部分取代互链 + 快照同提交闭环 | 历史提交 [`2e15f2046c`](https://github.com/deepseek-ai/deepseek-harness/commit/2e15f2046c) 与封存成品 [`archived/feature/2026-09-16-sandbox-same-mode.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/feature/2026-09-16-sandbox-same-mode.md)（171 词，同目录含 `.zh.md` 与 `.i18n.yaml`） |
| 232 词短小精悍的满分四段骨架样本 | [`archived/process/2026-09-22-workspace-release-ranges.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-09-22-workspace-release-ranges.md) |
| `rejected/` 防后人翻旧账踩假时钟坑的真实样本 | [`rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md) |
| 活跃 Note 逐节哈希 sidecar 样本 | [`implemented/feature/2026-06-15-ptc.i18n.yaml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-06-15-ptc.i18n.yaml) |
| 归档冻结制度与统一正文格式的设计理由 | [`implemented/process/2026-07-26-frozen-agent-note-archive.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md)、[`archived/process/2026-07-05-uniform-agent-note-format.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-07-05-uniform-agent-note-format.md) |
| “Agent 遵守可执行门禁远胜于散文约定”的实证记录 | [`archived/process/2026-06-11-quality-gates.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-06-11-quality-gates.md) |

> 注：`03` 篇第四节关于外部项目“6 条必留灵魂与 4 项可裁包袱”的划分，是基于上表规则与门禁文件提炼的迁移建议，并非 DSH 源码内的字面清单。核验状态见 [核验基线登记](../00-baseline.md)。
