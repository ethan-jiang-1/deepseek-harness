# Test Strategy · 测试证据、执行范围与结果验收

本专题帮助读者判断一次通过到底说明了什么：局部逻辑、真实组合、模型输入、固定轨迹、当前模型选择与最终成果分别需要证据。主仓政策由原生文档和执行脚本维护；本专题解释它们的职责与限制，不把绿色 CI 扩展成通用质量保证。

## 按问题进入

| 问题或症状 | 阅读入口 |
|---|---|
| 改了代码、YAML 或方法 Markdown，该选什么检查？ | [测试决策流](./execution/05-dsh-testing-decision-procedure.md) |
| Coverage 已满，产品为什么仍可能坏？ | [测试思想](./philosophy/01-dsh-testing-philosophy-and-doctrine.md)、[防漏检查](./execution/04-dsh-testing-anti-omission-mechanisms.md) |
| 回放通过，能证明新 prompt／skill 有效吗？ | [快照机制与能力限制](./mechanisms/10-dsh-snapshot-machinery.md) |
| 刷新为什么不能自动更新所有期望？ | [独立工作区期望与写模式](./mechanisms/10-dsh-snapshot-machinery.md#请求-sidecar-与独立工作区期望) |
| 缺 key 或平台跳过，应算通过还是失败？ | [CI 执行与跳过语义](./execution/07-dsh-ci-gates-and-reliability.md) |
| 插件怎样证明真实组合和外部效果？ | [插件测试 playbook](./plugin-testing/14-dsh-plugin-testing-playbook.md)、[插件测试契约](./plugin-testing/15-dsh-plugin-testing-contract.md) |
| 独立运行通过，并发 CI 却偶发失败？ | [可靠性与 flake 归因](./execution/08-dsh-testing-reliability-and-flake-analysis.md) |

## 阅读顺序与页面归属

### 思想与分层

- [01 · 测试思想](./philosophy/01-dsh-testing-philosophy-and-doctrine.md)：独立判据及通过结果的范围。
- [02 · 分层与选择](./philosophy/02-dsh-testing-tiers-and-selection.md)：tier、后缀与运行选择。

### 执行与防漏

- [03 · 资产分布](./execution/03-dsh-testing-asset-census.md)：资产类别和分布判据。
- [04 · 防漏检查](./execution/04-dsh-testing-anti-omission-mechanisms.md)：自动检查、未覆盖条件与评审责任。
- [05 · 测试决策流](./execution/05-dsh-testing-decision-procedure.md)：从改变的行为选择证据，区分方法到达、模型选择和成果质量。
- [06 · 规则所有权](./execution/06-dsh-testing-rules-ownership.md)：政策与各类规则的原始归属。
- [07 · CI 门禁](./execution/07-dsh-ci-gates-and-reliability.md)：本地、workflow 与 gate 的执行和结果。
- [08 · 可靠性](./execution/08-dsh-testing-reliability-and-flake-analysis.md)：共享资源、归因与 teardown。
- [09 · 基建职责](./execution/09-dsh-testing-infrastructure.md)：测试支撑与 expected output 的归属。

### 回放与取证机制

- [10 · 快照机制](./mechanisms/10-dsh-snapshot-machinery.md)：固定决策、当前执行、请求 sidecar、独立工作区及世代规则的统一说明。
- [11 · 快照对外面](./mechanisms/11-dsh-snapshot-external-face.md)：公开包、夹具输入与仓外接线事实。
- [12 · 探针取证](./mechanisms/12-dsh-probe-and-evidence-collection.md)：探针可提供的记录与限制。

### 插件落地

- [13 · 插件测试政策](./plugin-testing/13-dsh-plugin-testing-policy.md)：主仓对插件证据的要求。
- [14 · 测试 playbook](./plugin-testing/14-dsh-plugin-testing-playbook.md)：真实组合与消费者检查。
- [15 · 插件测试契约](./plugin-testing/15-dsh-plugin-testing-contract.md)：插件仓的合同与证据组织。

## 源码核验入口

[测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)定义原生要求，[门禁脚本](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts)与[workflows](https://github.com/deepseek-ai/deepseek-harness/tree/master/.github/workflows)定义实际执行。完整独立 preset 评测设计属于[延伸阅读](../../_faq_on_digested/31_preset-quality/03-behavior-evaluation.md)，不在运行机制专题复制评测平台或通用评分制度。
