# Skills：程序化的工作记忆

> **术 · Skills。** 同一类任务出现第三次时，来这页把它固化成流程文档。写法标准、真实文件、常见病，都在下面——照着写就行。

## 写之前：先确认它该是 Skill

| 你的知识 | 放哪 | 不放哪 |
|---|---|---|
| 每轮都要遵守的规则 | 根 `AGENTS.md`（1–3 行 + 链接） | Skill |
| 一个可机械判断的条件 | `exit non-zero` 脚本（gate） | Skill |
| 为什么选这个方案 | ADR / 决策记录 | Skill |
| 系统现在怎么工作 | README / current docs | Skill |
| **一类任务怎么做**（要读上下文、做判断、跑步骤、报结果） | **Skill** | — |

> **DSH 原话 ·** tier 表中 Skills 的定位（[docs/AGENTS.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/AGENTS.md)）
>
> | Skills (`.agents/skills/`) | Reusable workflows and specialized decision standards | Product and runtime contracts (→ docs or source) |

边界自己声明，不靠读的人自觉：

> **DSH 原话 ·** Skill 自我声明的边界（[`.agents/skills/dsh-code-review/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-code-review/SKILL.md)）
>
> This skill is guidance, not a complete checklist. […] The report identifies paths and dirty layers but does not replace semantic review.

## 照着写：一个真实 Skill 文件的解剖

打开 [`.agents/skills/dsh-pre-push-checks/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-pre-push-checks/SKILL.md)（推送前选证据的流程），三样东西逐一看：

**1. frontmatter 两行，触发条件写死：**

```yaml
name: dsh-pre-push-checks
description: Use before pushing, force-pushing, marking ready for review, or claiming checks pass on a deepseek-harness branch, and immediately after gh stack sync publishes rewritten branches, …
```

description 一句话写全「什么时候用」——catalog 里只有这两行，模型据此决定命中不命中，命中才读正文。

**2. 正文每步带可执行命令：**

```sh
# 第一步：确认 checkout 和分支
git status --short --branch
git rev-parse --show-toplevel

# 第二步：验证 base 后解析待推送范围
pnpm --silent run change-scope --base <verified-base-ref>
```

原文还写了边界：「The command never guesses or fetches a base」——每一步都是「做什么 + 具体命令 + 边界」。

**3. 判断标准写成正文规则：**

> Every behavior change needs the narrowest available test or purpose-built check that would fail for its regression.

不是「选合适的检查」这种需要再解释的话，是能直接执行的判据。

## 你的写法清单

1. **触发条件一句话**写进 frontmatter 的 `description`——「Use when … / Use before …」，把适用时机说全；
2. **每一步给可执行命令或可打开的文件**，不给「做好验证」这类散文；
3. **判断标准写成规则**，不给形容词；
4. **可机械判断的部分下沉到 gate**，Skill 只留需要上下文判断的部分；
5. **文末声明边界**：「这是 guidance，不是 checklist」——防止它被当成强制流程；
6. 命中任务时**先读全文再执行**，不从摘要猜——这条纪律写进文档里。

## 两个常见病

- **散文病**：写成「做好本地验证后再推送」——agent 还得自己猜步骤，等于没写。
- **清单病**：写成「必须依次执行 12 步」——把判断收走了，环境一变就卡死在错的步骤上。

正确形态：**步骤 + 每步的判断标准**，判断留给执行者，流程提供稳定入口。

## 摘要负责发现，正文才拥有指令

catalog 只暴露 `name` + `description`（≤500 字符），正文按需加载：

> **DSH 原话 ·** catalog 只给摘要（[`packages/skill/tool-skill/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/skill/tool-skill/README.md)）
>
> This catalog contains summaries only; do not infer or follow a skill's instructions until it has been loaded.

照做：给一个「任务 → 文档」的目录，模型按 name+description 选中才加载全文——同时省上下文、防脑补。运行时怎么实现这条（catalog 机制、注入预算）是 [`披露管线`](./13-progressive-disclosure-pipeline.md) 的事。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「11 · Skills」一节）——按需核对，不读不影响理解。
