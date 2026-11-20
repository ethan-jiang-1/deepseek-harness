# 05 · 测试决策流：按改变的行为选择证据

测试选择从变更可能破坏的行为开始。TypeScript、YAML、persona 和 skill Markdown 都可能改变产品；文件后缀不能决定是否只跑类型检查。先写出可观察的承诺，再选能看见该失败的最低层，并补足真实组合、模型输入和外部结果的观察。

## 从变更到可复核结果

1. **列出受影响的消费者。** 区分配置解析、Loader 组合、实例更新、模型输入、工具执行、持久化与领域交付；写清失败时应留下什么。
2. **选能观察失败的检查。** 局部逻辑优先单测，装配错误使用真实 Loader／进程，发布入口使用 built-artifact 消费者；按主仓政策补充必需录制场景和真实模型证据。
3. **检查断言是否独立。** 描述性目录可从声明生成，产品应有的能力与结果应由需求、外部规则或独立计算确定。对守卫及目标回归，用拒绝样例或短暂注入回归验证它确实会失败，再恢复。
4. **检查实际效果。** 读取真实请求、外部文件、持久化或公开协议；不要只匹配模型“完成了”的文本。工作区比较规则由[快照机制](../mechanisms/10-dsh-snapshot-machinery.md)维护。
5. **报告已获得与缺失的证据。** 记录命令、所测版本和运行模式、实际通过与跳过、未覆盖条件及原因；所选层通过不能代替其他必要层。

负控用于确认检查能识别它声称阻止的回归，尤其适用于新增机械规则和已知故障守卫；这不等于要求每个现有测试在每次变更时重新人为改坏一次。主仓明确要求新增机械检查接入实际 runner，并让改变的接受路径拒绝无效样例。

## 证据与观察对象相配

| 改变的行为 | 需要回答的问题 | 证据选择 |
|---|---|---|
| 配置字段或在线更新 | 候选是否有效，实例是否保留／重建，消费者何时读新值，保存与重启后是什么 | parser 与消费者测试、真实 Loader 更新、设置持久化；影响模型时再检查实际输入 |
| 组合、persona 或 skill | 必需能力和方法是否真正到达模型；当前模型能否适当采用 | 独立精确能力期望、已装配请求、固定流回放，以及真实模型任务 |
| 工具执行与运行协议 | 同一选择下当前执行器、生命周期、日志和外部效果是否正确 | 真实执行器／进程测试、回放、外部结果断言 |
| 发布入口或构建配置 | 安装产物的导出、worker、进程及模块身份是否正确 | 相关构建后通过实际产物入口冒烟；源码 paths 测试不能替代 |

Vitest 工作区导入按 paths 解析到源码；CI 的相关子进程与产物测试显式消费构建输出。两类证据要分别说明，不能用“e2e 通过”隐藏实际运行的是哪一类入口。[分层与选择](../philosophy/02-dsh-testing-tiers-and-selection.md)维护各 tier 的选择规则。

## 方法到达、模型选择与成果质量

指定步骤或固定模型流，可以验证方法加载与执行路径；只给任务目标的真实模型运行，才能观察当前选择。两者都不能仅凭工具调用正确就判定领域结果正确。预设内部的 producer／verifier 也是产品行为，需要接受独立的开发验收。

作为场景设计建议，可为核心承诺保留成对用例：缺必要资料时不编造，补齐资料后能完成；方法不适用时停止或切换，适用时正常工作。分别观察方法与约束是否到达、运行行为是否合理、成果是否符合来源和计算依据，防止一律拒绝也得到高评价。这些是评测设计建议，不代表 DSH 自动提供通用领域评分器。

独立项目的完整 preset 评测方法见 [FAQ 延伸阅读](../../../_faq_on_digested/31_preset-quality/03-behavior-evaluation.md)；主仓必需项仍以原生测试政策为准。

## 源码核验入口

- [测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)：真实入口、外部世界、真实模型、回归负例与必需录制场景。
- [根指令](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md)：机械检查接入顶层 gate、改变的接受路径须拒绝无效样例。
- [原生 Preset 组合测试（文件名沿用旧名）](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/tests/web-agent-presets.e2e.ts)：独立精确工具集合、prompt 与服务位置期望。
- [设置配置测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/tests/configuration.spec.ts)：消费者更新、无效编辑、优先层、revision 与重启。
- [方法分步加载测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-office/tests/progressive-loading.spec.ts)：固定选择下逐步检查实际模型输入。

相关遗漏与跳过见[防漏检查](./04-dsh-testing-anti-omission-mechanisms.md)和[CI 门禁](./07-dsh-ci-gates-and-reliability.md)；插件落地见[测试 playbook](../plugin-testing/14-dsh-plugin-testing-playbook.md)。
