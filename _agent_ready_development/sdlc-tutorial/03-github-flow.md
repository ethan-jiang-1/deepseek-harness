# 03 · GitHub Flow：DSH 怎样把协作规则做成代码

## GitHub Flow 解决什么问题

本地 git 能保存 commits，却不能独自回答谁评审了变更、远端检查是否通过、目标分支是否允许合并。GitHub Flow 把这些协作状态放进 Pull Request：

```text
branch → commits → push → Pull Request → CI + review → merge
```

跟着主例（模型 ID 显示，提交 `5124a2a310`，PR #5004）走：作者在分支上完成上一页看到的 7 文件交付组合，push 后创建 PR。**本地与 push 之后的证据由不同机制拥有**——这条分界线是本页的核心。本页打开的模板、workflow 与 policy 都是**现行规范**；PR #5004 当时的远端状态不在 git tree 里（`需查 GitHub`，页尾有完整边界说明）。

## 本地阶段：作者拥有全部证据

Push 之前，每件事都是作者可观察、可复现的：

| 事实 | 本地怎么拥有 | 主例中 |
|---|---|---|
| 改动面 | `git status` / `git diff` | 7 文件，UI 组件 + 文档 + 测试 |
| 行为正确性 | 聚焦测试、红灯对照 | 组件测试两个场景共 6 条断言反转（[04](./04-implementation-and-evidence.md) 有实测） |
| 文档同步 | 双语 README + 配对 hash | 两语言改述 + `README.i18n.yaml` 重录 |

Push 前不机械跑全部命令，而是**选择能覆盖当前 diff 的检查**——这个选择本身就是工程判断，[04](./04-implementation-and-evidence.md) 展开演练。

## Push 之后：`.github/` 接管远端协作

PR 一旦创建，模板、workflow 和 policy 成为协作的骨架。先打开仓库的 [.github/pull_request_template.md](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/pull_request_template.md)，它规定三部分内容：

- **Motivation**：一句话说明要解决的问题，引用同仓库 Issue（`Fixes #NN` 或 `Related #NN`）；
- **Changes**：分别说明命令/配置/API/协议层面与可观察行为层面的变化，没有则写 None；
- **Testing**：每种测试方法一个条目，可复核的证据（输出、截图、日志）放进对应的 Proof 折叠区。

这个模板的用意值得体会：意图（Motivation）放在最前面，证据（Proof）做成结构化的折叠条目——和 [01](./01-follow-a-change.md) 的任务重建、[04](./04-implementation-and-evidence.md) 的证据选择是同一个思路，只是搬到了远端。

### 主例的示意 PR 摘要

PR #5004 的原始页面本语料钉版时无法访问（`需查 GitHub`），以下是**按现行模板重写的示意文本**，不是当时的原文：

> **Motivation**
>
> 模型选择器的候选行显示显示名，同名模型无法区分；用户需要看到原始 model ID。Related issue 未能从 git tree 核实。
>
> **Changes**
>
> - 命令/配置/API/协议：None
> - 可观察行为：获取可用模型的选择器每行显示原始 model ID（等宽字体）；悬停显示模型名称，无名称时回退完整 ID
>
> **Testing**
>
> - `pnpm vitest run packages/client/ui-settings-models/tests/provider-form.client.spec.tsx`：断言选择器显示 id、按名称搜索仍可用
>
>   <details><summary>Proof</summary>交付态 97 绿；旧行为对照 2 红 95 绿（实测记录见 [04](./04-implementation-and-evidence.md)）</details>
>
> - Web e2e 场景更新：真实浏览器勾选 `gpt-6-astra`
>
>   <details><summary>Proof</summary>（e2e 需要浏览器环境，本示意未执行——未运行项要如实分开，见 [04](./04-implementation-and-evidence.md)）</details>

对比真实提交标题 `fix(web): show model IDs in monospace and names on hover (#5004)`：提交信息讲清了改什么，PR 摘要按模板讲清为什么、怎么验证。**两者的分工**：commit message 属于 git 历史，PR body 属于协作页——都可在 GitHub 上查到，但内容义务不同。

## CI 是代码，不是口头约定

CI 的调度由 workflow（GitHub Actions 的流程定义文件）声明：何时触发、在哪些运行器上跑哪些 job（各自独立的一次运行）。打开 [.github/workflows/ci.yml](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/workflows/ci.yml) 看实际结构：

- **触发**：只有 `pull_request`——主分支专属的平台检查放在 `ci-master.yml`，不进 PR 面板；
- **10 个 job**：9 个必需 job——`node-24`（主测试）、`node-24-coverage`（覆盖率门禁）、`node-24-bench`、`node-24-consumers`（构建消费者）、`node-compat`、`python-sdk`、`python-runtime`、`windows-build`、`windows-native-tests`——外加 1 个不进聚合的 `windows-coverage`；
- **并发取消**：同一 PR 有新 push 就自动取消旧运行；
- **聚合**：`all-checks-passed` 这个 job `Needs`（等待）全部 9 个必需 job，把结论合成一个必需的通过判定。

“脚本拥有检查什么，workflow 拥有何时跑、在哪跑、怎么汇总”，说的就是这个具体形态：检查逻辑在 `scripts/run-gates.ts` 等仓库代码里，workflow 只管调度和聚合。

### 模板之外：policy 也是代码

模板提示作者写什么，policy 代码校验它合不合规：Issue 引用、labels（标签）、native Issue Type 由 `.github` 下的 policy 脚本检查；人类作者 PR 的 metadata（元数据）强制条件由 `approval-policy.json` + `check-approval.mjs` 拥有——**评审要求同样是可执行代码**，不是 CONTRIBUTING 里的一句话。主例的 PR 是否触发了这些检查 `需查 GitHub`。

## Review 让人或 agent 检查含义

Reviewer 阅读任务意图、适用时的 Agent Note、diff、当前文档和测试证据，判断它们是否一致。Review 提出问题后，作者继续修改同一分支并 push；PR 自动显示新 diff，CI 也针对新 head 重新运行——所以 review 的结论也要对着**当前** head 读，不是沿用上一次查看的状态。

主例里 reviewer 会问的问题（[05](./05-review-and-merge.md) 让你亲自做一次）：README 说“悬停显示名称”，测试钉住这个行为了吗？——这是语义层面的问题，CI 无法回答。

## Merge：目标分支接收完整交付组合

Required checks（必需检查，即上文的 `all-checks-passed`）通过、评审要求满足、PR 不再是 Draft（草稿状态）时，才能 merge。合并后，目标分支包含上一页看到的完整交付组合——实现、文档、证据——而不是只有代码。

Merge 之后知识怎样归位、谁来验证“合并不等于发布”，见 [05](./05-review-and-merge.md)。

## 这页的演练：现行规范 ≠ 当时历史

本页打开的模板、workflow、policy 都是**现行规范**：演示“今天在这个仓库创建一笔这样的 PR 会经过什么”。PR #5004 当时的 CI 结果、review 讨论、merge 状态，git tree 里不存在，本教程不重建它们。要把它当历史事实使用，须取得该 PR 页面的可信记录——这正是三层证据标注里 `需查 GitHub` 一层的含义。

这一页是**“规则是可执行代码”**的主场：PR 模板、CI workflow、policy 脚本、审批配置——协作的每个环节都是能打开读、能跑起来的文件。通用仓库把这些约定写在 CONTRIBUTING 和会议纪要里，新旧全凭自觉；DSH 的选择是让违规直接红在检查里。

下一篇：[实现与证据](./04-implementation-and-evidence.md)。
