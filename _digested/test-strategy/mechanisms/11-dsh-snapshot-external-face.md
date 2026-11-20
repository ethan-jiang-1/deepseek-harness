# 11 · 快照机制的对外面：发布包、夹具与接线

外部插件仓可以消费公开发布的 `@deepseek-ai/dsh-llm-replay` 和 `@deepseek-ai/dsh-session-snapshot`，但安装包本身不会提供该仓的场景、真实入口或验收判据。本页说明发布与接线事实；固定决策、当前执行、sidecar、独立工作区期望和写模式由[快照机制](./10-dsh-snapshot-machinery.md)统一解释。

## 发布与夹具输入

两个 test-support 包都声明 `publishConfig.access: "public"`，随产品版本矩阵发布。公开发布说明它们可被仓外依赖，不能据此把主仓内部场景目录和脚本视为稳定的外部接口；使用方式与限制以各包说明和导出为准。

回放器接受投影后的 Session JSONL，也接受带完整包络的原始日志；单份夹具不能混用两种正文表示，首行必须是带合法版本的 Session 对象。历史输入通过格式目录向前迁移，较新格式不能交给较旧运行时处理。版本与世代规则见[机制页](./10-dsh-snapshot-machinery.md#世代历史输入与当前-writer)。

普通回放文件必须是解析器能读取的明文 JSONL。会话持久化可压缩，不能把压缩文件直接作为文本夹具；导出或配置为明文后，仍需检查版本、规范化与场景资产。`file` 接受 Session 日志，裸 `ReplayEntry[]` 脚本属于 `overrideFile` 的整脚本替换形态。

## 挂载与消费诊断

`dsh-llm-replay` 是具名导出的 function 插件，注入 `llm`，配置字段为 `file`、`overrideFile`、`childFiles`、`providers`、`paceMs`。显式配置优先于对应环境变量，因此可由普通 Cordis 组合挂载。`providers` 非空时注册回放 adapter；为空时通过 `llm/stream` waterfall 截获模型流。

编程式 `installLlmReplay` 返回的 `assertConsumed()` 能检查录制脚本是否全部消费；普通插件挂载不暴露这个句柄。外部测试驱动需要自己选择可观察的完成与消费条件，不能只凭进程退出就断言全部录制步骤发生。

## 与组合层交界的接线问题

| 症状 | 核查对象 |
|---|---|
| 仍有真实 provider 接流 | 相关真实 adapter 挂载行是否都禁用，回放 adapter／waterfall 是否在预期组合中 |
| 加了 patch，实际组合未变 | 挂载行的 id／name 与生效顺序；dump 只核查组合，不证明运行激活和配置有效 |
| overlay 后配置字段丢失 | `config` 的整键替换规则，不能按深合并推断结果 |
| 模型脚本被意外提前消费 | 标题生成等其他 `llm/stream` 消费者是否也在组合内 |

组合与 dump 的完整语义归[组合专题](../../plugin-system/composition/00-map.md)和[dump／boot 对照](../../plugin-system/composition/02-dump-and-boot-fidelity.md)。外部驱动应通过真实产品入口运行；把模型流替换成回放，不应同时把被测工具换成只返回成功的替身。

## 外部仓如何采用

发布包提供机制，场景所有权和独立结果仍属于消费仓。先选择该仓要验证的真实入口和失败类，再决定回放与真实模型证据各承担什么；主仓私有脚本、行政规则和完整 CI 矩阵不会随依赖安装自动获得。

开发脚手架与门禁建议见[独立插件仓的 CI Harness](../../../_dsh_plugin_agent_ready_development/02-dsh-plugin-harness/06-plugin-gate-and-ci-harness.md)，本页结论不依赖该延伸材料。主仓的验收要求见[测试决策流](../execution/05-dsh-testing-decision-procedure.md)。

## 源码核验入口

- [回放包元数据](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/package.json)、[快照包元数据](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/package.json)：公开发布与导出。
- [回放实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/src/index.ts)：`parseSessionFixture`、`apply`、`installLlmReplay` 与消费断言；[包说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/README.md)维护配置用法。
- [快照包说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/README.md)：适配器、资产与存储要求。
- [基础组合](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml)、[标题消费者](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/session-title-first-prompt-llm/src/index.ts)：回放之外仍可能存在的模型调用方。
- [持久化说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/session-persistence-jsonl/README.md)：压缩与日志存储；[测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)：真实入口与外部结果断言。
