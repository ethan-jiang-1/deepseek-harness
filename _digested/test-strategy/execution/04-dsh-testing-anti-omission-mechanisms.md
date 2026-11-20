# 04 · 防漏检查：自动执行与评审责任

DSH 用 coverage、类型与目录检查、真实入口测试、外部结果断言和 CI 结果聚合发现不同遗漏。每项机制只检查已经编码并实际执行的条件；遗漏场景、错误需求或不足的领域判据仍可能得到绿灯。

## 各项检查能发现什么

| 检查对象 | 已有规则与证据 | 仍需判断 |
|---|---|---|
| 源码执行范围 | coverage gate 对纳入范围的源码实行 per-file 完整行覆盖，并有明确环境例外 | 行执行过，不代表断言充分、装配正确或产品有用 |
| 组合与发布入口 | 产品可见插件要求非单元 REAL-composition 测试；发布入口另有 built-artifact 冒烟要求 | 手工挂载成功或源码测试通过，不能替代真实 Loader 与产物消费者 |
| 请求与外部结果 | 可见变化更新录制场景，e2e 重读文件或重跑命令 | 调用日志、模型自述和自动更新的期望不能独立证明需求成立 |
| 门禁执行 | 聚合器使阻塞 gate 的失败和依赖跳过影响总结果 | 未注册的检查、未选中的用例或允许的环境跳过不会自动成为失败 |
| 类型与持久化演进 | 声明的持久化类型变更有专门的确认记录，删除持久化根保留 tombstone | 普通代码行删除没有普遍的“墓碑账本”义务 |

精确范围分别由[测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)、[持久化变更规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/persistence-changes/README.md)和[CI 失败语义](./07-dsh-ci-gates-and-reliability.md)维护。对某次变更选哪些检查，见[测试决策流](./05-dsh-testing-decision-procedure.md)。

## 不把检查存在当作已经取证

声明了测试，不代表命令会选中它；命令退出成功，也可能只有过滤、缺凭据或平台跳过。报告应保留所跑命令、实际通过与跳过，以及仍缺的观察。新增机械规则还要接到实际顶层 runner，并以拒绝样例证明对应接受路径会失败。

本地 hook、CI 和语义评审各有责任。pre-push hook 只执行 typecheck；它不会证明 Markdown 方法、YAML 组合或模型选择正确。CI 执行已登记的机械检查，人工审查继续判断需求、设计和结果是否相符；有明确对象与依据的人工验收并不因发生在 CI 之外而无效。

对自动验收的描述应指明判据及执行入口；对尚未自动检查的质量要求，应保留评审责任，不能宣称所有遗漏都会被自动捕获。漏测事故的分析与归档由[规则归属](./06-dsh-testing-rules-ownership.md)及其原始政策维护。

## 源码核验入口

- [测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)：coverage、REAL-composition、真实产物、外部断言与快照要求。
- [Git hooks](https://github.com/deepseek-ai/deepseek-harness/blob/master/lefthook.yml)：本地实际执行范围。
- [门禁聚合器](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts)：已登记 gate 的选择、依赖、失败与跳过。
- [持久化变更记录](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/persistence-changes/README.md)：受声明类型变更与删除根约束的 tombstone。

主仓的完整检查路由另见[SDLC 参考](../../../_dsh_plugin_agent_ready_development/03-dsh-sdlc-reference/04-gates-and-local-checks.md)，不在本页复制命令矩阵。
