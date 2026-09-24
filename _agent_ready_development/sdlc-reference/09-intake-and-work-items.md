# Reference 09 · Intake（意图入口与工作项治理）

## 一句话

DSH 的变更意图没有统一入口：外部反馈进入 GitHub Discussions（仓库暂不接受外部 PR），内部工作项以 Bug / Feature / Task 三种 Issue 模板进入并挂到 GitHub Project 的生命周期状态机；proposed Agent Note、代码内的 FIXME/TODO 与 Dependabot 依赖 PR 是另外三类真实存在的意图载体。policy 只在特定时机强制元数据，"这个意图值不值得做"始终是语义判断。

> We are sorry that we cannot accept external pull requests at the moment. However, contributing code to this repository is far from the only way to help. [...] Identify and report issues or bugs in GitHub Discussions:
>
> — DSH [`CONTRIBUTING.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/CONTRIBUTING.md)。这段话同时划定两件事：代码变更只由内部团队与 coding agent 完成；外部输入的通道是 Discussions 加 upvote，由团队监控并用于排期。

## 1. 外部输入的边界决定了协作流的形状

CONTRIBUTING 明确暂不接受外部 PR，外部参与方式是：在 GitHub Discussions 报告问题或点子并给想要的讨论 upvote（团队"monitor them and consider them when allocating resources"）、开发插件并挂 `dsh-plugin` topic、写博客与答疑。仓库被定位为 "an idea, an official showcase, and a source of inspiration, but not a mandate from us"。

这直接影响对 SDLC Tutorial 中 GitHub Flow 的读法：branch → PR → CI/review → merge 描述的是**内部团队与 agent 的协作流**，不是开放社区贡献流。外部反馈要变成变更，必须先被团队转成内部 Issue 或任务上下文；Issue 模板并不是对外开的表单——`.github/ISSUE_TEMPLATE/config.yml` 只有一行 `blank_issues_enabled: false`，空白 Issue 被关闭，但没有配置指向模板的 contact links。

## 2. 三种 Issue 模板固定最小语义输入

| 模板 | 原生 Issue Type | 固定节 |
|---|---|---|
| Bug | `Bug` | Summary / Reproduction / Current behavior / Expected behavior / Environment |
| Feature | `Feature` | Motivation / Behavior |
| Task | `Task` | Summary / Deliverables |

每节只有标题和 HTML 注释指引（例如 Bug 的 Reproduction："列出能稳定触发问题的最小步骤、输入或代码"）。模板问的是可观察行为、复现路径和交付物，不问内部类名或函数清单；frontmatter 只含 `name`、`about`、`type` 三个字段。

> Issue templates cover Bug, Feature, and Task. … Idea and Research belong in Task unless a future decision gives them distinct lifecycle behavior.
>
> — DSH [semantic issue templates Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-09-03-semantic-issue-templates-and-policy.md#decision) 的 Decision。早期基线曾有 Idea 与 Research 独立模板，该决定取消它们并归入 Task，理由是"added choices without changing how the repository planned the work"；policy 同时停止检查 `details` 呈现、正文长度、标题语言、标题前缀和 body ownership 行这类非语义规则。

policy 层把五种原生 Issue Type（`Idea|Feature|Bug|Research|Task`）都视为合法——模板入口收敛成三种，但历史 Issue 的 Type 不被强制迁移（[`issue-management/rules.mjs`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/issue-management/rules.mjs) 的 `TYPES`）。

## 3. PR 模板把 Issue 引用、变更与证据放进同一页

[`.github/pull_request_template.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/pull_request_template.md) 固定三节：Motivation（"以 Fixes #NN 或 Related #NN 引用同仓库 Issue"）；Changes（两个相邻占位——命令/配置/API/协议/持久化格式的高层变化，与用户/模型/系统可观察行为的变化，"没有则写 None"）；Testing（"每种测试方法添加一个条目。方法保持可见，将可复核证据放进对应的 Proof 区域"，每个条目内嵌 `<details><summary>Proof</summary>` 放输出、截图、录屏或日志）。

模板是写作入口，强制范围由 policy 代码决定：进入 review 的人类 PR 才被要求至少一个同仓库 Issue 引用（`Fixes/Closes/Resolves` 算 resolving，`Refs` 算 informational，只在建上下文时读取）。精确条件见 [Reference 02](./02-issue-pr-lifecycle.md) §2，本页不重复。

## 4. Project 生命周期是事件驱动的状态机

[`issue-management/config.json`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/issue-management/config.json) 定义 Project 1（"DSH Issue Management"）的完整状态列表与 lifecycle actor `dsh-issue-management`：

```text
Inbox → Backlog → Ready → In progress → In review → Done 与 No action（两个终态）
```

自动转换只有这些：Issue `opened` / `reopened` 进入 `Inbox`；`closed` 按关闭原因进入 `Done`（Completed）或 `No action`（Not planned）；PR opened / body 编辑把 resolving 引用的 Issue 推进 `In progress`，并为所有被引用 Issue 初始化 Project `Start Date`；`review_requested` 推进 `In review`；`changes_requested` 退回 `In progress`（唯一 backward 转换，仅当该 Issue 最近一次状态由 lifecycle bot 写入时生效，人工设置的状态不被覆盖）。

> The Issue lifecycle workflow treats review webhooks as commands.
>
> — DSH [event-directed PR review status Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-08-10-event-directed-pr-review-status.md#decision)。review 事件是显式命令而非聚合投影：GitHub 聚合状态在作者修复并再次请求 review 后仍可能显示旧的 `CHANGES_REQUESTED`，生命周期需要的是"下一步在谁手里"的交接信号。

这套自动化是事件驱动的，不是 reconciler：错过的事件不会被补跑，Project 变更没有 compare-and-swap，Issue 指派变化不触发任何 lifecycle 工作（[`issue-management/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/issue-management/README.md)）。`Backlog`、`Ready` 等状态由项目管理过程手工设置。

## 5. 标签与 Issue Type 的分工

> Every open or merged pull request carries exactly one canonical `kind/*` label and at least one materially affected `area/*` label.
>
> — DSH [unified GitHub label taxonomy Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.md#decision)。

`kind/*` 是六个封闭互斥值（`feature`、`bug-fix`、`doc`、`testing`、`cleanup`、`dependency`），记录**主导意图**——附带的测试、文档或清理不改变分类。`area/*` 命名持久的产品/工程主题（`area/web`、`area/api`、`area/planning`、`area/infra` 等），集合刻意可扩展：agent 可以不经审批新建一个简洁的 `area/<kebab-case>` 标签，但不得为一个 PR、顺带路径、临时项目、状态、人或团队建 area。Issue 用原生 Issue Type 而不用 `kind/*`，其 `area/*` 可选；`source/*` 标签记录 Issue 如何被创建，不适用于 PR；`p0`–`p3` 是操作性元数据，解决型 PR 要与其 resolving Issue 的最高优先级一致。

## 6. 不进 Issue 的意图载体

Intent 不都长成 Issue。仓库里还有三类被规则认可的载体：

- **proposed Agent Note**：`.agents/notes/AGENTS.md` 开头写道 "Agent Notes are effectively RFCs written by agents: durable proposals and decision records"。重大未来工作以 `proposed/<class>/yyyy-mm-dd-topic.md` 存在，正文含 Problem / Proposal / Alternatives considered / Acceptance criteria / Risks；当前活动树有 39 篇英文提案（六个 class 目录齐全），它们是可以被 review、被拒绝、被实现的"仓库内意图"。规则见 [Agent Note lifecycle](./01-agent-note-lifecycle.md)。
- **代码内的 TODO 标记**：`docs/development.md` 定义三档——`FIXME`（"an issue that should block a new release"，发布不应带着未决 FIXME 出门）、`TODO`（尽快修）、`XXX`（低优先级，无承诺）。
- **Dependabot 依赖 PR**：按 ecosystem 自动创建，预置 `kind/dependency` 与 `area/infra`（见 [Reference 02](./02-issue-pr-lifecycle.md) §6）。

反面入口也存在：`docs/postmortem/` 收录"bug 到达了不该到达的地方（真实用户、已合并 PR、一次 release）"的事故复盘，要求链接由事故催生的 guardrails——它不产生新意图，但经常触发新的规则或测试意图。

## 7. 意图怎样到达 coding agent

仓库没有 Issue→agent 的自动分派机制。coding agent 拿到工作靠三层东西：根 `AGENTS.md` 与 21 个子树 `AGENTS.md` 的常设指令；`.agents/skills/` 下 14 个 Skill 的 frontmatter `description`（以 "Use …" 开头的适用条件）按任务匹配加载；以及会话自身的任务上下文（例如 `pnpm dsh --profile headless "task"` 把任务作为 prompt 字符串交给 headless profile）。Plan Mode、goal、todo 等会话机制属于运行时协作状态，见 [Plan 与 sandbox](./03-plan-and-sandbox.md)，不是仓库工作项。

## 证据入口

- DSH [`CONTRIBUTING.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/CONTRIBUTING.md)：外部参与边界与 Discussions 通道。
- DSH [Issue 模板目录](https://github.com/deepseek-ai/deepseek-harness/tree/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/ISSUE_TEMPLATE)与 [PR 模板](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/pull_request_template.md)：意图输入的最小字段。
- DSH [semantic issue templates Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-09-03-semantic-issue-templates-and-policy.md)：模板收敛为三种、policy 退出呈现检查的决定。
- DSH [label taxonomy Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.md)：kind/*、area/*、Issue Type 与 source/* 的分工。
- DSH [issue-management config](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/issue-management/config.json)、[rules.mjs](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/issue-management/rules.mjs) 与 [README](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/issue-management/README.md)：Project 状态、校验函数与事件语义的真源。
- DSH [issue-lifecycle workflow](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/workflows/issue-lifecycle.yml) 与 [issue-policy workflow](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/workflows/issue-policy.yml)：哪些事件进入哪个入口。
- DSH [event-directed PR review status Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/process/2026-08-10-event-directed-pr-review-status.md)：review webhook 即命令的语义。
- DSH [`.agents/notes/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/AGENTS.md) 与 [Agent Note 规则](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/README.md)：proposed Note 的定义与正文骨架。
- DSH [TODO 标记语义](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/development.md#todo-markers)与 [postmortem 定位](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/postmortem/README.md)：代码内未决意图与事故复盘。
- DSH [Dependabot 配置](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.github/dependabot.yml)：自动意图的预置 metadata。
