# 06 · 这条 SPEC 路径里，人干什么，Coding Agent 干什么？

## 结论先说

DSH 没有一个单独的“人/agent 分工表”，但它把分工写进了权限边界和流程规则里。可以重建出：

- **Coding Agent 负责生产**：探索、提案、计划、实现、文档、测试、门禁、推送前检查、收到 review 后修改。
- **人负责边界**：外部问题与生态、计划审批、human-review policy 下的语义 review、需显式用户调用的翻译扩展、sandbox 之外的主机升级。

下面每条判断都附 DSH 原文。

## 一、Coding Agent 是主要生产者

> This codebase is developed primarily by coding agents. Agents follow enforced gates far more reliably than prose conventions, and "a lot of work" is not a cost argument when agents do the labor.

来源：`.agents/notes/implemented/process/2026-06-11-quality-gates.md:11`

这是 DSH 对角色分工最直接的一句话：**agent 是主要生产者，且机械门禁比 prose 约定更可靠。**

## 二、Coding Agent 具体做什么

### 1. 按 standing orders 工作

根 `AGENTS.md` 直接给 agent 下指令：

> Run checks before pushes via [dsh-pre-push-checks](../../.agents/skills/dsh-pre-push-checks/SKILL.md); report only commands run.

来源：`AGENTS.md:91`

> Never default to the full suite or repeat a passing check for commit or push. CI owns exhaustive coverage and the platform matrix.

来源：`AGENTS.md:94`

### 2. 提案、计划、实现、合同同步

Agent Note 规则要求变更本身带决策记录：

> Every non-trivial change MUST add or update at least one Agent Note in the same PR.

来源：`.agents/notes/README.md:46`

代码和文档同步是 agent 的交付义务：

> A package's README and JSDoc are part of the change: altered behavior (config keys, defaults, error codes, wire fields) updates them in the same commit.

来源：`packages/AGENTS.md:25`

### 3. Plan Mode 里 agent 先探索、设计，再交人审批

Plan prompt 给 agent 的规则是：

> Make the plan decision-complete: ... detailed enough that another engineer can implement it without making design decisions.

来源：`packages/preset/agent-presets/presets/ptc/agent.cordis.yml:129`

> implementation begins only in a later step after approval.

来源：`packages/preset/agent-presets/presets/ptc/agent.cordis.yml:131`

这说明：**agent 负责把计划做到 decision-complete，但不能自己批准实施。**

## 三、人具体做什么

### 1. 审批计划

`exit_plan_mode` 把计划交给用户：

> In plan mode it requires a complete markdown plan starting with a `#` heading and presents it for review through the [user-questions seam](../../docs/subsystems/user-questions.md). Approval returns `{ approved: true }`.

来源：`docs/subsystems/plan.md:33`

> Keep-planning is a failed call carrying the user's feedback, so the model revises and presents again.

来源：`docs/subsystems/plan.md:33`

这里的人是**批准/驳回者**，反馈会作为错误回到 agent。

### 2. 语义 review

代码 review skill 明确区分自动检查和语义判断：

> automated checks do not establish those properties.

来源：`.agents/skills/dsh-code-review/SKILL.md:23`

> ## Manual checks

来源：`.agents/skills/dsh-code-review/SKILL.md:31`

PR 模板明确存在“人类 PR”：

> 进入评审的非 Draft 人类 PR 至少引用一个同仓库 Issue。

来源：`.github/pull_request_template.md:2`

issue policy 则把这种约束命名得更直接：

> Decide whether the human-review policy applies to a PR.
>
> const automated = authorType === 'Bot' || authorType === 'App'
> return !isDraft && !automated && (reviewRequestCount > 0 || reviewCount > 0)

来源：`.github/issue-management/policy.mjs:158-170`

因此更严谨的结论是：机器管结构；语义 review 不能由自动化替代；进入 review 的人类 PR 被单独纳入 human-review policy。`dsh-code-review` 本身没有明文写执行者必须是人，所以“人管语义”是从这套 policy 和 PR 模板反推的边界，不是 DSH 有一张明文分工表。

### 3. 需要显式用户调用的工作

翻译扩展流程不是 agent 默认动作：

> only explicit user invocation may run `dsh-translate-docs`.

来源：`AGENTS.md:146`

### 4. sandbox 无法解决的主机环境问题

当命令被 agent sandbox 挡住时，规则要求先做最窄主机升级；原文没有写执行者，但 sandbox 之外的主机操作通常只能由人批准执行：

> When required `gh`, `pnpm`, build, test, or generator commands fail because the agent sandbox blocks credentials, network, IPC, file watching, or nested `sandbox-exec`, retry unchanged with the narrowest host escalation.

来源：`AGENTS.md:85`

### 5. 外部社区参与

当前仓库不接受外部 PR，外部人主要走 issue 和生态：

> We are sorry that we cannot accept external pull requests at the moment.

来源：`CONTRIBUTING.md:9`

> Identify and report issues or bugs in GitHub Discussions.

来源：`CONTRIBUTING.md:11`

## 四、收到 review 后，agent 还要继续

> When receiving review, verify each claim and fix or rebut it on technical grounds without performative agreement.

来源：`.agents/skills/dsh-code-review/SKILL.md:52`

这补上了闭环：review 反馈回来后，agent 修或 rebut，而不是无脑接受。

## 五、DSH 说得清楚吗？

**部分清楚，但不是一张表说清楚的。**

- Coding Agent 的职责非常清楚：root AGENTS、packages/AGENTS、skills、Agent Note 规则几乎都是直接指令。
- 人的职责也清楚，但分散在 approval、human-review policy、translation、host escalation、CONTRIBUTING 这些边界里。
- DSH 没有写“Human responsibilities vs Agent responsibilities”这种总表；它是**用权限边界反向定义角色**的：哪里需要 approval，哪里就是人。

## 证据入口

- `.agents/notes/implemented/process/2026-06-11-quality-gates.md:11`
- `AGENTS.md:85`、`:89`、`:92`、`:143`
- `packages/AGENTS.md:25`
- `.agents/notes/README.md:46`
- `packages/preset/agent-presets/presets/ptc/agent.cordis.yml:129`、`:131`
- `docs/subsystems/plan.md:33`
- `.agents/skills/dsh-code-review/SKILL.md:23`、`:29`、`:49`
- `.github/pull_request_template.md:2`
- `.github/issue-management/policy.mjs:158-170`、`:343`
- `CONTRIBUTING.md:9`、`:11`
