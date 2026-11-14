# 01 · 动手写代码之前：Issue、Agent Note 与 Plan Mode 什么时候出场？

在正式改源码之前，DSH 提供了三样用来把“要干什么、为什么这么干、打算怎么改”想清楚的工具：**GitHub Issue**、**`proposed/` Agent Note** 和 **Plan Mode**。关键在于，它们三个**都不是无脑必选项**，各自有非常明确的触发条件。

---

## 一、GitHub Issue：只定外部表现，不定内部类名

仓库在 `.github/ISSUE_TEMPLATE/` 下只保留了 **Bug**、**Feature** 和 **Task** 三种模板（早期的 Idea 和 Research 模板已合并进 Task）。其中 Feature 模板精简到了只有两节：

- `## Motivation`（为什么要做）
- `## Behavior`（用户或调用方能观察到的预期行为）

注意这里刻意去掉了“修改哪些内部函数”以及“验收测试清单”（测试证据统一放到后续 PR 的 `Testing` 节里交卷）。这样即使编码中途发现内部实现路径要换，最初对齐的外部目标也不会跑偏。

**机器什么时候强制查 Issue？** 打开 [`.github/issue-management/rules.mjs`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/issue-management/rules.mjs) 里的 `requiresPullRequestPolicy()` 就能看到精确判据：只有当一个 PR **不是草稿（`!isDraft`）、作者不是机器人（`!automated`），并且已经发起或收到了 Review** 时，策略脚本才会强制要求 PR 正文至少关联一个同仓库 Issue（`Fixes #NN` 或 `Related #NN`）。同时，脚本只校验关联和标签元数据齐全，不会去替人评判 Motivation 写得好不好。

---

## 二、Agent Note：从“非平凡必写”收窄为“有持久取舍才写”

`.agents/notes/` 目录用四个子文件夹直接对应决策的生命周期：

```text
proposed/     ← 还没做（或只做了一部分）、需要先评审方案的重大提案
implemented/  ← 已经随代码交付的现行决定（随后续代码演进同步维护）
rejected/     ← 明确否决的方案（只在未来别人也很容易重踩同一诱人误区时保留）
archived/     ← 已失去未来决策参考价值的冻结历史（不再作为现行依据）
```

### 1. 什么时候先写 `proposed/`？

只有跨子系统的大改动、需要先对齐方向再投入开发的工作，才会先提一份 `proposed/` Note。它的固定章节是 `Problem / Proposal / Alternatives considered / Acceptance criteria / Risks`。其中最值钱的是 **`Alternatives considered`（考虑过并淘汰的备选方案）**——它逼着作者（尤其是 Coding Agent）交代清楚“为什么没走另外两条看似可行的路”，防止后来人反复翻旧账。

### 2. 现行写入门槛（别用老皇历！）

翻历史材料时很容易看到一句已经被废止的旧规矩：~~“每个非平凡变更都必须附带 Agent Note”~~。在早期实践中，团队发现“非平凡”根本没法划界，结果导致大量普通功能改动为了合规硬凑流水账 Note。

提交 [`730bcc7c85`](https://github.com/deepseek-ai/deepseek-harness/commit/730bcc7c85) 把 [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md#when-to-write-one) 的门槛正式收窄为：**只有当代码、测试和现有文档无法解释背后的持久设计理由时，才在同一 PR 新增或更新 Agent Note；机械修改与局部调整（包括局部 UI 呈现与交互改动）一律豁免。**（详见 [FAQ 20](../20_agent-note-quality-bar/answer.md)。）

拿仓库里两笔真实提交并排一比就彻底明白了：

- **豁免不写 Note 的真实例子**：提交 [`5124a2a310`](https://github.com/deepseek-ai/deepseek-harness/commit/5124a2a310)（把模型选择器的候选行从显示名称改成显示等宽原始 ID，悬停看名称）。行为在组件代码里、合同在包 `README` 里、回归断言在单测和 e2e 里，没有任何“无处安放的深层架构取舍”，所以 **0 个 Note 完全合规**。
- **必须写 Note 的真实例子**：提交 [`ccaa0dc11c`](https://github.com/deepseek-ai/deepseek-harness/commit/ccaa0dc11c)（解决 pnpm 子进程长达 22 分钟占住 profile 锁的缺陷）。光看修完后的退出信号和有界排水代码，后来人绝对看不出当时为什么否掉了另外五条看似更简单的修复路线、以及主动接受了什么边界代价——这类理由就必须写进 Agent Note。

---

## 三、Plan Mode：服务当前会话的“一次性施工蓝图”

当任务比较复杂、希望让 Agent 先摸清代码再动手时，可以通过 `/plan` 开启 [`plan-mode`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/plan/plan-mode/README.md)：

1. Agent 先只读勘察相关代码，不直接改文件；
2. 产出一份以 `#` 标题开头的完整 Markdown 实施计划——要求细化到“另一位工程师拿到就能直接写代码，无需再做设计决定”（涵盖目标、按子系统划分的改动、公开 API/schema/数据流、异常边界与测试方案）；
3. 调用 `exit_plan_mode` 把计划呈递给用户审批；用户点同意返回 `{ approved: true }` 后才正式切入编码，如果点退回修改，用户的反馈会作为调用失败信息带回给模型继续打磨。

理解 Plan Mode 要抓准三个边界：

- **它是可选的提示词软引导，不是安全沙箱**：核心循环并不依赖它，它靠注入文本引导模型先不动手；真正管文件能不能写的仍然是独立的 `sandbox-policy` 和 `approval` 机制。
- **计划留在聊天记录里，不进 Git 树**：计划正文作为 `exit_plan_mode` 的参数保存在当前会话历史里（会话日志只记 `plan/mode` 状态切换），所以翻仓库的 Git 提交是看不到历史 PR 用没用过 Plan Mode 的。
- **它跟 Agent Note 时间维度不同**：Plan 管的是**“今天这轮对话里怎么一步步把活干完”**，干完就翻篇；Agent Note 管的是**“半年后别人维护这块代码时，需要知道当初为什么这么定”**。
