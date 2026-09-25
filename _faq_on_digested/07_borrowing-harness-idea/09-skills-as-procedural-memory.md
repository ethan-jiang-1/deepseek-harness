# 09 · Skills 与渐进披露（省上下文、稳住判断）

> **状态：跨状态** —— Skill 文件是**仓库面（静态）**（「任务 → 流程文档」目录）；模型可见面（catalog 只给摘要、正文按需）是**运行时（动态）**，机制见 [`05_root-entry-doc-navigation/02-on-demand-navigation.md`](../05_root-entry-doc-navigation/02-on-demand-navigation.md) 与 [`11-progressive-disclosure-pipeline.md`](./11-progressive-disclosure-pipeline.md)。

## 规则与检查之间还缺一层

`AGENTS.md` 适合放每轮都需要的常驻规则，gate 适合对确定条件给通过/失败。但很多任务既不能靠一句规则、也不能靠一个布尔结果完成——例如「怎样选最小可信的 push 前证据」「怎样判断一个决策记录该保留还是归档」。这些任务需要：读上下文、应用判断标准、执行若干步骤、报告结果。

DSH 把这层知识放进 **development Skill**。它既不是普通文档，也不是自动门禁，而是「程序化工作记忆」——把资深参与者的判断过程变成可发现、可复用、可审查的仓库文件。

> | Skills (`.agents/skills/`) | Reusable workflows and specialized decision standards | Product and runtime contracts (→ docs or source) |

## Skill 不是 gate，也不是文档

这是最容易搞混、也最值得迁移的边界：

| 载体 | 擅长回答 | 不能替代 |
|---|---|---|
| `AGENTS.md` | 每轮必须遵守什么 | 情境化长流程 |
| Skill | 面对某类任务怎样调查、判断、验证 | 确定性 pass/fail 与产品 API/行为 |
| script / gate | 一个可机械条件是否满足 | 意图和设计质量 |
| ADR / Agent Note | 为什么选择这一决定 | 具体执行步骤 |
| current docs / README | 系统现在怎样工作 | 决策历史和临时 review 流程 |

DSH 的 Skill 自己声明这个边界：

> This skill is guidance, not a complete checklist. […] The report identifies paths and dirty layers but does not replace semantic review.

（来源：`.agents/skills/dsh-code-review/SKILL.md`）

一个典型 Skill 的调用过程是五步：**Match（命中）→ Load（先读全文，不从摘要猜）→ Resolve sources（读任务所需 owner）→ Apply judgment（按实际 diff/风险选择动作）→ Verify and report（只报告真正执行过的证据）。** Skill 的价值不是「自动执行一切」，而是让复杂判断有稳定入口、明确来源、可重复过程和诚实的适用边界。

### 落地实物：一个真实 Skill 文件长什么样

打开 DSH 的 [dsh-pre-push-checks/SKILL.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-pre-push-checks/SKILL.md)（推送前选证据的流程），五步各有物理落点：

- **触发条件就是 frontmatter 的两行**——`name: dsh-pre-push-checks` 加一句 `description:`「Use before pushing, force-pushing, marking ready for review…」。catalog 里只有这两行，模型据此决定是否命中；命中才读正文。
- **步骤就是带命令的正文**——第一步「Confirm the checkout and branch」下面直接是可执行的 `git status --short --branch`；第二步给了 `pnpm --silent run change-scope --base <verified-base-ref>` 并写明「never guesses or fetches a base」。每一步都是「做什么 + 具体命令 + 边界」。
- **判断标准写成正文规则**——「Every behavior change needs the narrowest available test or purpose-built check that would fail for its regression」这句就在「Select relevant evidence」一节里。

普通项目的流程文档照这个标准写：**frontmatter 一句触发条件、正文每步带可执行命令、判断标准写成正文规则**。六字段模板（触发条件、输入、步骤、停止条件、验证、输出格式）见 [`03`](./03-step-by-step-guide.md) Phase 5。

**学走形的检查**：流程文档写成没有命令的散文（「做好本地验证后再推送」），或写成强制 checklist（「必须依次执行 12 步」）——前者 agent 还得猜，后者把判断收走了；正确形态是「步骤 + 每步的判断标准」，判断留在执行者。

## 渐进披露：摘要负责发现，正文才拥有指令

Skill 与根文档共用同一个原则——**摘要负责发现，正文才拥有指令**。DSH 的产品侧提示语把这句说得最直白：

> This catalog contains summaries only; do not infer or follow a skill's instructions until it has been loaded.

对普通项目，这意味着：**不要把所有流程文档都塞进常驻上下文，而是给一个「任务 → 文档」的目录，任务命中才加载全文。** 这一条同时省上下文、又避免 agent 从摘要脑补流程。这一节只讲「仓库开发侧」的按需加载；DSH 在**运行时/模型可见面**上如何实现同样的原则（skill catalog 只给摘要、prompt 按 scope 组装、compaction 回收），是另一整块，见 [`11-progressive-disclosure-pipeline.md`](./11-progressive-disclosure-pipeline.md)。

## 为什么这也能治「乱发挥」

「乱发挥」的一部分是 agent **不知道某类任务有标准流程，于是现场发明一个**。Skill 把流程固化下来之后，「发明流程」这个自由度就被收走了——剩下的自由度是「在流程内做判断」。这正是 DSH 想要的：**把「怎么做」外置，把「怎么判断」留在 agent，再让 review 兜底语义。**

## 可迁移要点

1. 把重复出现的任务流程写成带触发条件和验证步骤的短文档（哪怕不叫 Skill）。
2. 明确写「这是 guidance，不是 checklist」，不让它冒充确定性门禁。
3. 每个流程文档：触发条件、输入、步骤、停止条件、验证、输出格式——缺一不可。
4. 可机械判断的部分仍然下沉到 gate；Skill 只处理需要上下文判断的部分。

## 证据入口

- [`_agent_ready_development/repo-harness/03-skills-as-procedural-memory.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/repo-harness/03-skills-as-procedural-memory.md)：两种 Skill 的区分、五步调用、Skill 与 gate 的边界。
- [`_digested/harness-idea/02-legibility.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_digested/harness-idea/02-legibility.md)：上下文入口外置与按需加载。
- [`.agents/skills/dsh-code-review/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-code-review/SKILL.md)：Skill 作为 guidance、语义 review 输入和 finding 输出的实例。
- [`.agents/skills/dsh-pre-push-checks/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-pre-push-checks/SKILL.md)：按 outgoing scope 选证据的实例。
