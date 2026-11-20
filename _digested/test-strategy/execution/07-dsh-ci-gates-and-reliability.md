# 07 · CI 门禁：执行范围、跳过与结果聚合

CI 把已登记的检查放到相应构建与平台环境执行。门禁聚合器定义 leaf、依赖与退出结果，workflow 定义触发、runner、凭据和 job 聚合；Git hooks 只承担局部检查。绿色结果的含义取决于实际选中并执行的检查，不能扩展成所有模型行为或领域结果已经验收。

## 编排的归属

| 位置 | 负责的事实 |
|---|---|
| `scripts/run-gates.ts` | 聚合模式、leaf 依赖、并发、失败／跳过、阻塞与观察性结果 |
| `.github/workflows/ci.yml` | PR 所需平台与 job；`all checks passed` 汇总它列出的依赖 |
| `.github/workflows/ci-master.yml` | master 和手动平台检查、备用 runner 演练 |
| `.github/workflows/e2e.yml` | 真实 API job 的可信事件条件、凭据预检、构建与 provider 运行 |
| `lefthook.yml` | staged 检查及 pre-push typecheck；不替代完整 CI 或行为验收 |

[门禁与性能总览](../../system-overview/03-quality-gates-and-performance-benchmarks.md)解释聚合器和检查家族；本页只解释结果可支持的结论，不复制完整 job 和命令清单。精确矩阵以 workflow 与脚本为准。

## 几种“跳过”不能混为一谈

| 情况 | 原生处理 | 可报告什么 |
|---|---|---|
| 本地或 secretless 环境没有 provider key | 对应真实 API suite 可 self-skip | 该模型行为未验证；不能算真实 API 通过 |
| 可信事件的真实 API job 应获得 key，却没有 | `e2e.yml` 的 preflight 失败 | 凭据或 job 配置失败，阻止全跳过的假绿 |
| fork／Dependabot 等没有授权 secret 的 PR | 真实 API workflow 的 job 条件跳过 | 未获得真实 API 证据；不是所有 skip 都应判红 |
| gate 的依赖失败，或 fail-fast 中止 | 聚合器记录该 gate 为 skipped；阻塞 gate 失败／跳过使 aggregate 失败 | 检查未完成，不能说已经通过 |
| PR verdict 列出的必需 job 失败、取消或跳过 | `all checks passed` 在其运行条件成立时失败 | 该聚合所需 job 没有全部成功；它不检查未列入的 workflow |
| 显式观察性 gate | 按 `allowFailure` 保留结果，不使所属聚合失败 | 观察结果可见，不构成该项阻塞验收 |

平台条件、测试名称过滤和缺依赖也可能使个别测试未执行。job 的成功状态不自动保证每个目标用例实际运行；报告要保留测试运行与跳过明细。新增专属 lane 如要求不得 self-skip，需有该 lane 自己的检查，不能把这条要求推广到所有本地命令。

## 本地证据与 CI 的交接

本地按变更运行相关检查，CI 承担登记的完整矩阵。工作区源码测试与消费构建产物的子进程分别取证；快照 lane 通过当前构建的真实入口回放，仍不证明模型会作新的选择。主仓对非平凡模型、协议或人可见变更要求在同一 PR 更新录制场景，详见[原生政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#when-a-snapshot-test-is-required)；回放的证明范围见[快照机制](../mechanisms/10-dsh-snapshot-machinery.md)。

失败报告应区分断言退化、runner／凭据缺失和测试资源缺陷，保留各自事实；重试成功不解释首次失败。[可靠性与 flake 归因](./08-dsh-testing-reliability-and-flake-analysis.md)维护资源与 teardown 的细则。选择检查与报告空缺见[决策流](./05-dsh-testing-decision-procedure.md)。

## 源码核验入口

- [门禁实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts)：`runAggregate`、`runGates`、`allowFailure`、`snapshotGate`；[对应测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.spec.ts)验证依赖与失败传播。
- [PR workflow](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/workflows/ci.yml)、[master workflow](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/workflows/ci-master.yml)：实际触发、平台与 verdict 依赖。
- [真实 API workflow](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/workflows/e2e.yml)与[e2e 配置](https://github.com/deepseek-ai/deepseek-harness/blob/master/vitest.e2e.config.ts)：可信事件、缺 key 与实际模型检查。
- [Git hooks](https://github.com/deepseek-ai/deepseek-harness/blob/master/lefthook.yml)与[测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)：本地检查范围与真实 API、组合、产物证据。

完整主仓检查路由见[SDLC 参考](../../../_dsh_plugin_agent_ready_development/03-dsh-sdlc-reference/04-gates-and-local-checks.md)。
