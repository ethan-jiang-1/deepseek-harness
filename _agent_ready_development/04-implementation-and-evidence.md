# 04 · 实现与证据：不只提交代码

## 一个可交付变更包含什么

Implementation（实现）改变系统；documentation（文档）说明交付后的系统；tests（测试）和其它 evidence（验证证据）让关键行为可以重复检查；Agent Note 保存决定理由。非平凡变更通常需要这四部分在同一个 PR 中对齐。

“测试通过”不等于“变更完整”。如果 public API、配置、错误行为或模型可见输出发生变化，当前 README、JSDoc 或 docs 也必须更新；如果决定改变，owning Agent Note 也必须更新。

## 先问什么可能回归

Relevant evidence（相关证据）不是命令数量，而是能在目标 regression（回归）出现时失败的检查。

| 改动 | 常见证据 | 它主要证明什么 |
|---|---|---|
| package 或 script 行为 | focused unit/integration test（聚焦单元或集成测试） | 受影响逻辑仍满足预期 |
| 用户、CLI、编辑器或模型可见输出 | snapshot 或 runnable scenario（可运行场景） | 实际展示内容没有意外漂移 |
| 文档、Agent Note、目录或链接 | `doc-sync` | 结构、链接、配对和生成内容满足规则 |
| public export、build、worker 或 bin | build、hygiene、built smoke | 发布形态可被真实入口消费 |
| real provider（真实提供方）行为 | 有凭据的 e2e（端到端测试） | 真实外部服务路径有效 |

一项检查只应被描述为它实际证明的内容。没有凭据而 self-skip 的 e2e，不能算真实 provider 已验证；mock test 也不能替代真实入口证据。

## 本地检查和 PR CI 是两层

Local checks（本地检查）针对当前 outgoing diff（待推送差异）选择最小可信证据，目的是在 push 前尽快抓住相关回归。

PR CI 在远端运行更完整的 matrix（检查矩阵），覆盖共享规则、构建消费者和平台信号。它防止本地环境或证据选择遗漏仓库级问题。

两者不是二选一：本地检查提供快速、针对性的反馈；CI 提供统一、远端和更广的信号。精确 scope 解析、coverage 选择和 CI job 拓扑见 [证据路由高级参考](./advanced/04-gates-and-local-checks.md)。

## Plan Mode 不执行权限

Plan Mode 可以要求 agent 先探索、写完整计划并等待用户审批。它影响协作方式和模型 guidance（引导文本），不直接阻止文件、网络或进程操作。

Sandbox mode（沙箱模式）决定环境允许访问什么，approval policy（审批策略）决定哪些操作需要用户授权。这三个机制彼此配合，但职责不同。内部 event（事件）和审批时序见 [Plan Mode 高级参考](./advanced/03-plan-and-sandbox.md)。

## Push 前的完成判断

准备 push 时，至少能清楚回答：

- 外部结果和验收条件在哪里；
- 哪个 Agent Note 拥有决定；
- 当前文档是否描述交付后的行为；
- 哪项证据会在目标回归上失败；
- 实际运行了哪些相关命令，哪些证据仍交给 CI。

下一篇进入评审和合并：[`05-review-and-merge.md`](./05-review-and-merge.md)。
