# 01 · 测试思想：让通过结果对应明确的行为

DSH 的测试政策要求证据与失败类相配。Coverage gate 对纳入范围的源码实行 per-file 完整行覆盖，并保留明确的环境例外；行覆盖是必要条件，不能证明插件按发布方式装配、模型获得正确输入或最终任务完成。

## 通过结果各自说明什么

单测检查局部规则，真实 Loader／进程检查装配与生命周期，产物消费者检查发布入口，回放检查已知模型轨迹，真实 API 运行观察当前模型行为。它们各有观察对象，不能只按成本或测试数量比较强弱。[分层与选择](./02-dsh-testing-tiers-and-selection.md)维护具体 tier。

对模型驱动的功能，需要分别判断输入是否到达、机制能否执行、模型如何选择、成果是否满足需求。工具调用成功或内部 verifier 给出通过，都不替代独立的文件、来源、计算或业务结果检查；这也是主仓“验证世界而非自述”原则的用途。

## 把判据放在需求一侧

期望结果来自产品承诺与独立依据。自动生成的目录可以准确描述当前实现，但不能自动决定实现应提供什么；否则实现误删能力时，派生期望也跟着减少。快照更新同样需要审查，工作区的独立期望不会被录制或刷新顺手重写，详见[快照机制](../mechanisms/10-dsh-snapshot-machinery.md)。

回归守卫需要能识别目标错误；新增机械检查还须接到实际执行入口并拒绝无效样例。它不要求每次改动都重新破坏每个已有测试。哪些检查足以支持本次结论，按[决策流](../execution/05-dsh-testing-decision-procedure.md)判断，并如实报告缺失凭据、过滤和平台限制。

## 源码核验入口

- [测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)：coverage 必要但不充分、真实入口与模型、外部结果和录制要求。
- [根指令](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md)：证据与表面相配、机械规则的真实接受路径。
- [原生 Preset 验收测试（文件名沿用旧名）](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/tests/web-agent-presets.e2e.ts)：独立能力期望与实际组合比较。

规则归属见[规则所有权](../execution/06-dsh-testing-rules-ownership.md)；自动执行与评审责任见[防漏检查](../execution/04-dsh-testing-anti-omission-mechanisms.md)。
