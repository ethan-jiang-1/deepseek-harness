# 02 · Issue 与 PR：意图入口和人类 review 边界

## 一句话

DSH 的 Issue 模板先把“外部可观察结果和验收”放在前面；PR 模板要求关联 Issue 并列出变更与验证。真正机械强制 Issue 引用的不是模板注释，而是 `.github/issue-management/policy.mjs`：**只有非 Draft、非 Bot/App、已经请求或已有 review 的人类 PR 才会进入强制范围**。

## 1. Issue 模板

`.github/ISSUE_TEMPLATE/` 有 feature / bug / task / idea / research：

- Feature：一句话预期结果 + 验收条件 + 用户或模型可见变化 + 测试证据
- Bug：复现步骤、实际结果、预期结果、环境、验收条件
- Task：验收条件、交付物、测试证据

来源：`.github/ISSUE_TEMPLATE/feature.md:16-18`、`bug.md:16-20`、`task.md:16-18`

这些模板刻意不要求内部类名或函数列表。Issue 层的价值是固定“做什么、怎样算完成”，而不是提前锁定实现。

## 2. PR 模板

`.github/pull_request_template.md` 要求：

```text
关联 Issue：

<details>
<summary>变更与验证</summary>
- 变更：
- 验证：
</details>
```

模板注释进一步说明：进入评审的非 Draft 人类 PR 至少引用一个同仓库 Issue。

来源：`.github/pull_request_template.md:1-13`

## 3. issue-management/policy.mjs

这是实际执行机器边界的脚本：

- `validateBody()` 检查 details 闭合、默认收起、外露长度、Owner/Assignees 一致性。
- `requiresPullRequestPolicy()` 定义强制范围：

```js
const automated = authorType === 'Bot' || authorType === 'App'
return !isDraft && !automated && (reviewRequestCount > 0 || reviewCount > 0)
```

- `validatePullRequest()` 在强制范围内检查：至少引用一个同仓库 Issue、恰好一个允许的 `kind/*`、至少一个 `area/*`、优先级匹配等。

来源：`.github/issue-management/policy.mjs:122-155, 162-170, 331-380`

限制：policy 不解析“验收条件写得是否充分”。它只保证元数据结构和 Issue 引用，不保证 Issue 的语义质量。

## 4. 标签与状态流转

- Issue Type 是原生英文五种：`Idea / Feature / Bug / Research / Task`。
- PR 使用 `kind/*` + `area/*` + `p0-p3` 等标签；旧版 `kind/bug`、`feature` 等标签被保留为禁用状态。
- Issue lifecycle 把事件映射到 Project 状态：打开 → `Inbox`；PR 进入实施 → `In progress`；`review_requested` → `In review`；`changes_requested` → 回 `In progress`；关闭 → `Done` / `No action`。

来源：`.github/issue-management/config.json`、`.github/issue-management/policy.mjs:40-47, 173-214`、[`2026-08-08-unified-github-label-taxonomy`](../../.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.md)

## 5. 对流程的理解

- Issue 不是每次变更都必经的强制起点；它是人类 PR 进入 review 时的强制引用点。
- Coding agent 任务可以没有 Issue，但非平凡变更仍必须带 Agent Note。
- PR 的“变更与验证”是人类 reviewer 和 CI 的入口证据，不是替代测试。

## 证据入口

- [`.github/ISSUE_TEMPLATE/feature.md`](../../.github/ISSUE_TEMPLATE/feature.md)
- [`.github/ISSUE_TEMPLATE/bug.md`](../../.github/ISSUE_TEMPLATE/bug.md)
- [`.github/ISSUE_TEMPLATE/task.md`](../../.github/ISSUE_TEMPLATE/task.md)
- [`.github/pull_request_template.md`](../../.github/pull_request_template.md)
- [`.github/issue-management/policy.mjs`](../../.github/issue-management/policy.mjs)
- [`.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.md`](../../.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.md)
