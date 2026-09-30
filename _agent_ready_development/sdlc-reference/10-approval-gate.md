# Reference 10 · Approval gate（加权批准与合并门槛）

## 一句话

一个 PR 能不能合，由三层互补门禁共同回答：issue-management policy 校验进入 review 的人类 PR 的 metadata（Reference 02）；`weighted-approval` workflow 把批准分数发布成 commit status，branch rules 要求它 success（本页）；semantic review 由人或 agent 按 `dsh-code-review` 判断语义（Reference 06）。分数由 write/admin 评审人的固定权重（1 或 2 分，1 分批准可被 blame 归属加权放大）与作者历史信用（封顶 1.1 分）组成，`/delegate` 命令可把一位评审人的积分转给另一位。

> The `weighted-approval` workflow publishes an approval score for branch rules. Reviewers are chosen manually; an eligible delegation command requests review from its recipient.
>
> — DSH [`.github/review-ownership/README.md` 的 Summary](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/review-ownership/README.md)。仓库把"谁批准、批准多少分"做成了可复核的评分系统，而不是单一的 approve 按钮。

## 1. 评分规则

`weighted-approval` workflow 暴露两个 PR 检查：`weighted approval publisher` job 报告评估与状态发布是否完成；名为 `weighted approval` 的 commit status 承载批准决定。Branch rules 只要求后者，且以 GitHub Actions 作为 expected source——context-only 要求可能接受其它集成发布的同名状态。评分参数住在 [`approval-policy.json`](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/review-ownership/approval-policy.json)：`requiredPoints: 2`、`defaultPoints: 1`，六位评审人（`07akioni`、`imccyu`、`tianyicui`、`tianyicui-bot`、`turtle1999`、`turtle2099`）各 2 分。基础规则：

| 事实 | 规则 |
|---|---|
| 谁的批准算数 | calculated base repository permission 为 write 或 admin 的评审人；作者自己的 review 不算 |
| 2 分评审人 | policy JSON 点名的六位；其权重不受归属影响 |
| 1 分批准的加权 | `min(2, 1 + 4 × ownedLines / totalLines)`——按 merge base 处 live base 与 reviewed head 的 `git blame`，把旧生产代码行的归属记到评审人头上（0%、12.5%、25% 归属 ≈ 1、1.5、2 分，封顶 2） |
| 生产代码定义 | `packages/`、`apps/`、`python/`、`native/` 下 `src/` 的受支持代码文件，加上 Desktop renderer、Python interpreter scripts 与 committed runtime/packer launchers；排除文档、测试、fixtures、snapshots、test support、examples、generated source、依赖、vendored 代码、声明、注释与空行 |
| 作者信用 | `min(100, mergedPRCount) × 11 / 1000`（100 个已合并 PR 封顶 1.1 分），按不可变 account ID 统计本仓库历史、不计当前 PR；不能单独满足 2 分 |

评分用未舍入值加 `1e-12` 容差判定，展示最多三位小数；评审人分数加作者信用已达门槛、或存在 blocking review 时，跳过 blame 归因。Pygments lexer 区分注释与字符串的分类器在 [`blame-production.py`](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/review-ownership/blame-production.py)，按 old path 归因，改名或移动文件不能把旧行移出分母。

## 2. 状态机：pending、success、error

`weighted-approval` workflow 监听 `pull_request_target`（opened、synchronize、reopened、ready_for_review、converted_to_draft、edited）、含 `/delegate` 的 issue_comment，以及零权限的 [`weighted-approval-review-event`](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/workflows/weighted-approval-review-event.yml)（review submitted/edited/dismissed）经 `workflow_run` 转交的 review 事件。publisher 在安装任何依赖之前先把 head 标成 `pending`（撤销旧状态），评估失败发布 `error`，正常评估：

- **pending**：总分低于 2；PR 是 draft；任何 write/admin 评审人存在有效的 `CHANGES_REQUESTED`。blocking review 使状态停在 pending，即使已计分数达到门槛。
- **success**：达到 2 分、PR ready、无上述 blocker。
- **error**：评估或依赖安装失败（绝不保留上一次的 success）。

每个评审人只贡献 GitHub 当前返回的 `APPROVED` 或 `CHANGES_REQUESTED`；`DISMISSED` 清空其 standing decision，comment-only 与 pending 不构成决定。workflow 自己不按 review commit 失效旧批准——stale review 与 latest-push 要求由仓库原生 PR rules 拥有。master push 不在订阅列表里。

## 3. `/delegate`：积分转移

> Post `/delegate @username` as the entire text of a PR conversation comment to transfer your reviewer points to that user's effective `APPROVED` decision on this PR.
>
> — DSH [review-ownership README 的 Delegating points](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/review-ownership/README.md#delegating-points)。

要点：命令必须是评论文本的全部内容（引号、代码块、混排文本都不算）；双方都须有 write/admin 权限且都不是 PR 作者；评估时系统 dismiss 发送者现有的 APPROVED/CHANGES_REQUESTED review，并向尚未批准的接收者发起 review request——接收者批准之前，发送者的分数不计。发送者随后提交任何 review（包括用 "Add single comment" 产生的 comment-only review）即自动收回积分；同一发送者的最新有效命令获胜，编辑旧评论不改变顺序，删除最新命令可恢复更早的一条；`/delegate @自己` 用于恢复自己的决定。委托不可转发（接收者只能转出自己的固有分数），作者信用不可委托，其他评审人的 blocking review 仍然阻塞 PR。

## 4. 信任边界

> SECURITY: the status-writing job executes policy from the trusted default branch and reads pull-request reviews and comments only as API data.
>
> — DSH [`weighted-approval.yml` 的 checkout 注释](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/workflows/weighted-approval.yml#L32)。所有步骤 pin commit SHA；job 不 checkout 也不执行 PR 代码、不使用仓库 secrets（唯一的历史抓取凭据只存在于 Git 子进程环境）；approval policy 的变更必须先 merge 进默认分支才对自己之后的 run 生效。review-event workflow 权限为空，只经 run title 传递一个十进制 PR 号，publisher 会拒绝无效 title 和无法解析到当前 PR head 的编号。

评分与委托的 rationale 分别由三篇 Agent Note 拥有：[production blame approval weight](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/notes/implemented/process/2026-09-11-production-blame-approval-weight.md)、[PR approval delegation](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/notes/implemented/process/2026-09-15-pr-approval-delegation.md)、[author approval credit](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/notes/implemented/process/2026-09-16-author-approval-credit.md)。

## 5. merge 在历史上呈现的形态

在可复核的 git 历史窗口内（2026-07-30 之后的产品线，约 8300 个 commit），产品变更的主落地形态是 **GitHub merge commit**：约三分之一的 commit 是 merge，PR merge 标题携带 PR 号（例如 `46a7f68b09` "Merge pull request #5073 from deepseek-harness/rel/dsh-0.1.7-rc.1"）。次要形态是自定义标题的 2 父 merge（`07ad70817f` "fix(plugins): deny incompatible bundles … (#5061)"）与少数 squash 成单 commit 的落地。PR 大小分布很宽：最近 100 个 PR merge 的样本中，commit 数中位数为 3、众数为 1（约三分之一的 PR 是单 commit），大 PR 可达数十个 commit。review 中途把 master merge-forward 进分支是常规操作（`312341970c` "Merge master into fix/zoom-rerender"）。分支命名并存两类前缀：类型前缀（`feat/`、`fix/`、`rel/`）与执行者命名空间（`worktree/`、`codex/`、`turtle/`、`ihsiang/`），常带日期后缀（`fix/preset-ui-20260921`）。依赖式 PR 栈的落地纪律见 [Reference 07](./07-push-merge-stacked-prs.md)。

## 6. 三道门禁各管什么

| 门禁 | 回答 | 不回答 |
|---|---|---|
| issue-management policy（Reference 02） | 进入 review 的人类 PR 的 Issue 引用、kind/area/priority 元数据是否合规 | 批准分数、语义质量 |
| weighted approval（本页） | 具备写权限的人是否已按加权规则累计出 2 分批准，无 blocking review | 实现是否正确、意图是否合理 |
| semantic review（Reference 06） | 实现、文档、证据是否真的符合意图与决定 | 替代运行检查或用户决定 |

三道都过，PR 才是 GitHub 眼中可 merge 的状态；任何一道失败，作者继续在同一分支修正并 push。

## 证据入口

- DSH [`.github/review-ownership/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/review-ownership/README.md)：评分、加权、委托、安全与验证的权威说明。
- DSH [`approval-policy.json`](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/review-ownership/approval-policy.json)：门槛与评审人权重的 policy 数据。
- DSH [`weighted-approval.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/workflows/weighted-approval.yml) 与 [`weighted-approval-review-event.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/workflows/weighted-approval-review-event.yml)：事件订阅、pending-first 顺序与信任边界。
- DSH [production blame approval weight Note](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/notes/implemented/process/2026-09-11-production-blame-approval-weight.md)、[PR approval delegation Note](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/notes/implemented/process/2026-09-15-pr-approval-delegation.md)、[author approval credit Note](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/notes/implemented/process/2026-09-16-author-approval-credit.md)：三个评分机制的决策记录。
- DSH [`blame-production.py`](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/review-ownership/blame-production.py)：生产代码行的分类器。
- DSH [`dsh-code-review` skill](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/skills/dsh-code-review/SKILL.md)：语义评审层的工作方式。
