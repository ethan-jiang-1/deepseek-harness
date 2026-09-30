# 02 · 规格不是一份文件

## 从一个问题开始

“规格在哪里？”在 DSH 中没有单一文件答案。更准确的问题是：“我现在想确认哪一种事实？”

一个 Issue 可以说明用户想得到什么，却不适合保存长期架构理由；一个 Agent Note 可以解释决定，却不应复制当前 API；测试可以证明一个场景，却不能解释为什么选择这个设计。把所有内容塞进同一份 spec，会让每类事实失去合适的更新时机。

## 六种问题，六类位置

| 你要确认什么 | 主要位置 | 主例（模型 ID 显示）中的落点 | pnpm 锁案例中的落点 |
|---|---|---|---|
| 为什么做、怎样算完成 | Issue 或任务上下文 | 教学重建的任务描述 | Note 的 Problem 节：22 分钟的锁持有 |
| 为什么这样决定 | Agent Note | **豁免**：无持久取舍 | [`bounded-pnpm-runs`](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/notes/implemented/bug-fix/2026-09-23-bounded-pnpm-runs.md) |
| 这一次准备怎样实现 | Plan Mode 会话；可选 | 未用 | 未用 |
| 交付后的系统是什么 | 源码、README、JSDoc（代码内的文档注释） | 组件 + 样式 + 双语 README | `operations.ts` + 包 README |
| 什么能抓住回归 | tests、snapshots（录制会话的回放证据） | 组件测试 + e2e | 真实子进程测试 |
| PR 现在能否推进 | GitHub checks、review | `需查 GitHub` | `需查 GitHub` |

这就是 distributed specification（分布式规格）：每类事实有自己的 owner（主要维护位置），它们通过同一个变更保持一致。

## Agent Note：目录本身就是流程

打开 `.agents/notes/` 看一眼，生命周期状态就是目录名：

```text
.agents/notes/
├── implemented/            ← 已交付决定，按类别分家
│   ├── architecture/  bug-fix/  feature/
│   ├── process/  simplification/  testing/
│   └── <name>.md + <name>.zh.md + <name>.i18n.yaml   ← 双语三件套
├── proposed/               ← 待评审提案
├── rejected/               ← 驳回记录（只在仍能防一个可信错误时保留）
├── archived/               ← 冻结历史，不作当前权威
└── README.md + README.zh.md + README.i18n.yaml        ← 规则本身也是三件套
```

三件套的第三件（`.i18n.yaml`）记录两份语言的 git blob hash——连“中英文档相等”这个纪律都被可执行配对钉住，与主例 README 的配对方式完全相同。一个 agent 不需要读完整规则就能从目录树读出：决定分六个类别、有四种状态、双语平等。

**Agent Note 只拥有决定**：承载持久决定理由的变更（代码、测试与现有文档都无法解释“为什么选当前方案”与“主动放弃了什么”这两类事实的变更）都要新增或更新 owning Agent Note；机械或局部编辑（含局部 UI 呈现）豁免。它有两个常见起点——决定仍需实现前评审时创建 proposed；决定已明确并随当前变更交付时直接 implemented。生命周期、取代和冻结归档规则属于 Reference 层机制，见 [Agent Note lifecycle](../sdlc-reference/01-agent-note-lifecycle.md)。

## 两笔真实修改并排看

**不需要 Note 的小 UI 修复**（主例，提交 `5124a2a310`）：显示从名称换成 ID，是局部呈现修改。任务、当前合同、回归证据各自有 owner（Issue/任务上下文、双语 README、组件测试与 e2e）；没有任何“为什么选当前方案、放弃了什么”的事实需要独立保存——选择器显示 ID 的理由，读完源码和 README 就完整了。

**需要 Note 的进程竞态修复**（提交 `ccaa0dc11c`）：插件管理器（`packages/boot/plugin-manager`，负责安装/移除插件包）里，静默的 pnpm 子进程长期占用 profile lock（DSH profile 目录的写锁）。打开它的 [Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/notes/implemented/bug-fix/2026-09-23-bounded-pnpm-runs.md)，看它承载了什么：

- **Problem**：22 分钟的锁持有、该进程之后所有管理调用排队等待、pnpm 11.13.0 的 worker-pool 缺陷；
- **Decision**：run 以进程退出为完成信号、2000 ms 有界排水、静默超时终止整棵进程树；
- **真实 Alternatives**：五条被否决的路线，每条都写明否决原因（“Terminate only the pnpm process”一条还注明了复现方式）；
- **Testing**：四个测试文件分别钉住什么行为；
- **Consequences**：接受哪些代价（静默的健康构建会被误杀、报告最多晚 `idleTimeoutMs`）。

这些事实没有别的地方可放：源码只能显示现在的行为，测试只能证明场景，README 不解释“为什么不用总耗时阈值”。**Note 是未来为什么，源码是现在是什么。** 配套的 [operations-process.spec.ts](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/packages/boot/plugin-manager/tests/operations-process.spec.ts) 用真实子进程验证最关键的路径——一个故意占着管道不放的后代进程，会在操作返回前连同整棵进程树一起被停掉。

## Plan 与 Agent Note 面向不同时间

Plan（计划）回答“这一次准备怎样做”，可以写具体文件、步骤、验证和未确定假设，服务当前会话。Agent Note 回答“仓库为什么长期采用这个决定”，服务未来维护者。一个 Plan 可以在实施中变化；implemented Note 只描述实际交付的决定。两者可能来自同一次设计讨论，但不能互相替代。

Plan Mode 提供计划状态和用户审批交互，本身不限制文件、网络或进程访问；权限控制由 sandbox mode（沙箱模式）和 approval policy（审批策略）各自独立承担。精确状态和审批时序见 [Plan Mode 参考](../sdlc-reference/03-plan-and-sandbox.md)。

## 练习

回到主例：如果这笔修改不是“显示 ID”而是“选择器的候选数据源从 adapter catalog（adapter 提供的已安装模型本地目录）换成网络端点”，你需要写 Note 吗？先问两个问题：这次修改是否放弃了某个正在工作的方案（catalog 直读）？一年后有人问“为什么选择器不打网络请求”，答案在源码和 README 里完整吗？

**判据**：需要 Note 的信号是**存在真实的替代方案和持久取舍**，不是 diff 大小。

这一页是三条立场交汇的地方：**每类事实有唯一 owner**——六类位置表就是它的完整展开；**agent 是一等参与者**——`.agents/notes/` 的目录树让没来过的 agent 不读规则全文也能读出生命周期；**规则是可执行代码**——连“中英文档相等”都被 hash 配对钉死。通用仓库把这些寄托在贡献文化和资深工程师的脑子里；DSH 把它们做进文件结构和可运行的检查。

下一篇进入协作部分：[GitHub Flow](./03-github-flow.md)。
