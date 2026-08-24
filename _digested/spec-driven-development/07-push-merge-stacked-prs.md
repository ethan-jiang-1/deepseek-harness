# 07 · Push、改写历史与 stacked PR

## 一句话

DSH 对 git 历史的操作不是“随便 force push”，而是：**普通 push 前用 `dsh-pre-push-checks` 选最小证据；改写历史只允许 `--force-with-lease`，禁止 raw `--force`；依赖 PR 链必须走 GitHub 官方 stack 对象和 `gh stack merge`**。

## 1. 历史改写规则

根 `AGENTS.md` 明确：

- Standalone PR 和 official stacks 可以在 review 后 merge-forward 或 rebase。
- Rewrites use `--force-with-lease`；abort on remote movement，never raw `--force`。
- 在 merge-forward 进行中如果 base 前进了，保留 checkpoint 后再合入新 tip。
- 不重复运行已通过的 check；push 后要验证 remote ref 匹配 local HEAD。

来源：`AGENTS.md:128`、`.agents/skills/dsh-pre-push-checks/SKILL.md`

## 2. dsh-merging-stacked-prs：官方 stack 优先

skill 的核心约束：

- 依赖 PR 必须使用 GitHub 官方 stacked-PR 特性，不能靠手动 merge + retarget 模拟。
- 如果 `gh stack` 不可用或跨 fork，硬停，不用 fallback。
- 用 GraphQL 查询 `PullRequest.stack` 和 `stackEntry.position` 作为 stack membership 权威，不能只靠 base branch 推断。
- `gh stack link` 只能自动处理同作者且可加的链；不同作者/冲突顺序先问用户。
- 刷新优先用 native cascading rebase（`gh stack sync`）或 incremental merge-forward，二选一。
- merge 使用 `gh stack merge <stack-number> --yes --merge`，不要逐 PR `gh pr merge`。
- 合并后核对每个 PR `MERGED`；删除分支必须在对应 PR 已 merged 且没有 open PR 还以它为 base 之后。

来源：`.agents/skills/dsh-merging-stacked-prs/SKILL.md`

## 3. Post-sync validation

`gh stack sync` 是一次性 fetch、rebase、push，所以不能在发布前插入本地验证。skill 要求：

1. 先清空 worktree、记录官方 stack order 和 exact remote heads；
2. sync 后重新查询每个 branch head、官方 stack order；
3. 对每个被改写的 layer 跑相关证据；
4. 全部通过前 keep PR unmerged，报告验证 pending；
5. 如果失败，保留 lease-protected published heads，修复后发布 correction。

来源：`.agents/skills/dsh-pre-push-checks/SKILL.md` 的 Post-sync validation 段

## 4. 相关 process notes

- `2026-08-02-native-github-stacks-and-optional-rebases`：为什么选 native stacks 和允许 rebase 的边界。
- `2026-07-26-incremental-pr-base-retargeting`：merge-forward 时 base 前移的 checkpoint 规则。
- `2026-08-10-event-directed-pr-review-status`：review 事件如何驱动 Project 状态。

来源：`.agents/notes/implemented/process/2026-08-02-native-github-stacks-and-optional-rebases.md`、`.agents/notes/implemented/process/2026-07-26-incremental-pr-base-retargeting.md`、`.agents/notes/implemented/process/2026-08-10-event-directed-pr-review-status.md`

## 证据入口

- [`.agents/skills/dsh-pre-push-checks/SKILL.md`](../../.agents/skills/dsh-pre-push-checks/SKILL.md)
- [`.agents/skills/dsh-merging-stacked-prs/SKILL.md`](../../.agents/skills/dsh-merging-stacked-prs/SKILL.md)
- [根 `AGENTS.md`](../../AGENTS.md)
- `.agents/notes/implemented/process/2026-08-02-native-github-stacks-and-optional-rebases.md`
