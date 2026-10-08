# Reference 02 · `.github/` automation（仓库自动化）

## 一句话

`.github/` 是开发流程的远端执行面：模板收集意图，trusted policy（可信策略）校验已进入 review 且适用该规则的 PR，lifecycle workflow（生命周期工作流）推进 Project 状态，PR CI 调用仓库脚本建立远端证据。它既不替代 Agent Note，也不决定实现细节。

本页拥有 `.github/` 的精确事件与 policy；它为什么构成仓库 Development Harness 的远端反馈层，见 [可执行反馈](../repo-harness/05-executable-feedback.md)。

> Decide whether the human-review policy applies to a PR.
>
> — DSH [`.github/issue-management/rules.mjs` 的 `requiresPullRequestPolicy()` JSDoc](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/issue-management/rules.mjs)（0008 复核改注：函数实现在 `rules.mjs:60`，`policy.mjs` 现只是分发入口；早期基线它住在 `policy.mjs`）。适用条件由函数体 `return !isDraft && !automated && (reviewRequestCount > 0 || reviewCount > 0)` 给出，见下节代码块；它说明 policy 管的是“已经进入 review 的人类作者 PR”，不是所有 PR，也不是 reviewer 身份。

![GitHub 事件如何进入 policy、Project 和 CI](./figures/github-event-flow.svg)

## 1. 模板固定协作输入

`.github/ISSUE_TEMPLATE/` 提供三种原生 Issue Type：`Bug / Feature / Task`，`config.yml` 关闭空白 Issue。Bug 模板要求 Summary、Reproduction、Current behavior、Expected behavior 和 Environment；Feature 要求 Motivation 与 Behavior；Task 要求 Summary 与 Deliverables。模板问的是可观察行为和交付物，而不是内部类名或函数清单，也不再设置折叠的验收与测试证据区。

`.github/pull_request_template.md` 把同仓库 Issue 引用、变更摘要和验证命令放进 PR body。模板是写作入口，真正的强制范围由 policy 代码决定。

## 2. human-review policy 的精确条件

`requiresPullRequestPolicy()` 返回：

```js
const automated = authorType === 'Bot' || authorType === 'App'
return !isDraft && !automated && (reviewRequestCount > 0 || reviewCount > 0)
```

只有满足该条件时，`validatePullRequest()` 才要求：

- 至少引用一个同仓库 Issue；
- 恰好一个允许的 `kind/*`；
- 至少一个 `area/*`；
- 最多一个 `p0` 至 `p3`，解决型 PR 与所解决 Issue 的最高优先级一致；
- 不使用 legacy、未知 `kind/*` 或 Issue-only 的 `source/*` 标签。

这个名字容易产生两种误读。它约束的是**人类作者 PR 在进入 review 后的 metadata**，不表示每个 PR 都要有 Issue，也不规定语义 reviewer 必须是人。Draft、Bot 和 App PR 不进入这段校验；非平凡仓库变更仍独立受 Agent Note 规则约束（按收窄后的标准：持久决定理由）。

## 3. policy workflow 使用默认分支的可信实现

`.github/workflows/issue-policy.yml` 监听 PR 打开、编辑、同步、重开、标签（含 `unlabeled`）、ready、review request 和 review submit 等事件（workflow `types` 列表）。Job 不执行 PR head 中的 policy，而是检出 repository default branch 的 `.github/issue-management/` 实现集（分发入口 `policy.mjs`，条件与校验函数在 `rules.mjs`），并禁用 checkout credentials 持久化。

这把“待校验输入”和“执行校验的代码”分开：PR 可以改变未来的 policy，但当前 run 使用默认分支的可信版本解释 PR metadata。

## 4. Issue、PR 与 Project 是事件驱动状态机

`.github/workflows/issue-lifecycle.yml` 把 Issue、PR 和 review 事件交给同一个 `policy.mjs lifecycle` 入口（实现在 `rules.mjs` / `lifecycle.mjs`）。配置中的状态顺序是：

```text
Inbox → Backlog → Ready → In progress → In review → Done 与 No action（两个终态）
```

核心自动转换是：Issue 打开进入 `Inbox`；解决该 Issue 的 PR 开始实施时推进到 `In progress`；`review_requested` 推进到 `In review`；由 lifecycle app 写入的 `In review` 收到 `changes_requested` 时退回 `In progress`；Issue 关闭原因决定 `Done` 或 `No action`。普通 approved/commented review 不创建可写 Project token，只有需要改变状态的事件才执行写入步骤。

这套自动化只推进自己拥有的转换，不覆盖所有手工 Project 决策。`Backlog`、`Ready` 等状态仍可由项目管理过程设置。

## 5. PR CI 消费仓库拥有的检查

`.github/workflows/ci.yml` 只监听 `pull_request`，新 head 会取消同一 ref 的旧 run。Workflow 负责 runner、权限、并发、缓存和 job 聚合；实际检查集合由 `package.json` 与 `scripts/run-gates.ts` 的顶层命令拥有。

具体 job 分层、required 聚合、本地证据与 Windows 信号的关系由 [Evidence routing](./04-gates-and-local-checks.md) 统一说明；本页只保留 PR 事件怎样进入 CI，以及 workflow 与仓库检查逻辑怎样分工。

真实 API e2e 使用独立 workflow 和 secrets 条件，并支持手动 dispatch（`.github/workflows/e2e.yml:31` 的 `workflow_dispatch`；0008 复核注记：旧文提到的 E2B provider e2e 已随 0.1.7 线 E2B 组退役消失，现行为 DeepSeek 官方 API 真实请求）。它们为适用变更提供真实 provider 证据，不是无凭据 PR CI 的通用替代。

## 6. 自动 PR 和发布流程属于相邻分支

Dependabot 按 npm、Python `uv` 和 GitHub Actions 三个 ecosystem 创建依赖 PR，并预置 `kind/dependency` 与 `area/infra`；Bot 作者身份使它不进入 human-review policy 的强制范围，但仍触发普通 PR CI。

文档部署、native/Python/npm release 和发布验证也住在 `.github/workflows/`。它们解释“合并后的产物怎样发布”，但不属于每次代码变更的 Issue → PR 主链；专题只在改动触及 built/release path 时把它们纳入相关证据。完整的发布与上线链路由 [Reference 11](./11-release-sequences-and-publish-lanes.md) 单独拥有。

## 证据入口

- DSH [Issue templates](https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.2.0-rc.2/.github/ISSUE_TEMPLATE) 与 [PR template](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/pull_request_template.md)：作者被提示提供哪些意图、验收、Issue 关联和验证信息。
- DSH [Issue management policy](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/issue-management/policy.mjs)：PR metadata 适用条件、Issue 校验和 Project 状态转换函数（实现在 rules.mjs，policy.mjs 为分发入口）。
- DSH [Issue policy workflow](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/issue-policy.yml)：哪些 PR 事件触发 policy，以及为什么检出默认分支的可信实现。
- DSH [Issue lifecycle workflow](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/issue-lifecycle.yml)：哪些 Issue、PR 和 review 事件可以写 Project 状态。
- DSH [PR CI workflow](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/ci.yml)：PR runner、权限、并发、job 依赖与 required 聚合。
- DSH [Dependabot configuration](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/dependabot.yml)：自动依赖 PR 的 ecosystem 与预置 labels。
