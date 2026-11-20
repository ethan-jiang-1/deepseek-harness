# 03 · 主仓怎样把质量要求变成可检查的事实

## 我的判断：重点是对照运行中的事实

DSH 的质量做法有明显的软件工程基础：运行时校验、集成测试、生成文件检查、兼容性管理都不是 Agent 独有技术。值得借鉴的是它们如何围绕全插件运行时与模型交互组织起来，尤其是**声明是否真的被消费、功能是否真的从交付入口启动、模型实际看见什么、外部效果是否真的发生**。

Schemastery 是其中的配置解析环节。它能拒绝错误字段值，却不能独自证明插件装配正确、修改安全提交、提示词有效或任务完成。下面分别看主仓怎样补这些证据，以及仍有哪些上限。

## 一、让配置规则有归属，再验证归属没有被绕开

配置的质量不只在于值的类型，还在于值从哪里来、谁决定优先级。一个字符串即使通过 schema，也可能来自错误的配置路径。

[配置来源检查](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-config-source-ownership.ts#L12)扫描随产品发布的部分 YAML，对 `apiKey/baseURL/apiKeyEnv/authToken/headers` 的普通单行 `!!js` 写法报错。它防止组合文件绕过适配器、凭据服务和环境快照的来源解析职责。这项检查接入了 [doc-sync 的执行清单](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts#L849)。

**可借鉴的是检查职责绕过，而不只是检查数据类型。** 如果一个插件仓有自己的凭据和端点选择机制，应该检查发布组合有没有偷偷绕开它。

但这个脚本的当前实现只是固定路径范围内的逐行正则，不是完整 YAML 分析；[测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-config-source-ownership.spec.ts#L13)也只覆盖一个普通端点内联案例。因此我不会把它描述成“所有配置来源都被严格证明正确”。规则写得广，执行器可能只覆盖其中一部分，阅读时必须看实际扫描和拒绝条件。

## 二、配置类型与文档不能各维护一份想象

DSH 插件既有运行时 schema，也有静态 Config 类型。两份声明如果脱节，插件接受的字段可能在接口和文档中找不到。

[配置目录生成器](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/gen-config-catalog.ts#L502)静态遍历可识别的 schema 表达式，取得包括嵌套字段在内的路径，再到声明的 Config 类型中查找。它还跟踪一部分跨文件别名、导入和组合，避免拆文件后检查悄悄失明。[对应测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/gen-config-catalog.spec.ts#L73)会加入 schema 中有、类型中没有的字段，验证生成失败。

生成器使用入口、类型、JSDoc 和 schema 共同生成配置目录；`--check` 比较生成结果和已提交文件，不新鲜就失败。检查由 [doc-sync](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts#L834)调用，不能说成它会自动修正文档。

**这里的保证是字段存在性和产物新鲜度，不是所有语义等价。** [lookupPath 的说明与实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/gen-config-catalog.ts#L399)明确叫 PRESENCE check：字段名找到了，不代表已比较数字/字符串、required、default、范围或转换；无法解析的类型可能返回 unknown。对默认值和空值的结论，仍需类型检查、解析实现和行为测试。

可迁移的做法是：先明确你要防哪一种漂移，再让生成器或检查器对那一种漂移报错。不要因为存在一个代码生成工具，就把它宣传成完整的一致性证明。

## 三、测试配置怎样流经真实 Loader

在普通函数单测里，测试作者可能已经把依赖和配置拼好了；而实际用户从模块导出、Loader、依赖等待和配置解析进入系统。两者经过的代码不同。

这不是抽象风险。[ACP 事故复盘](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md#L7)记录了单测和行覆盖率都很好，但一个默认导出让 Loader 丢掉具名导出的依赖声明，实际连接失败。手动挂载测试绕开了真实加载路径。

现在的[测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#L37)要求产品可见插件拥有真实组合测试，并进一步区分源码测试与发布产物测试。源码中的包映射能跑通，不自动证明用户安装后的构建入口也能跑通。

对 Schemastery 的即时配置，可以分清两类证据：

| 证据 | 实际检查什么 |
|---|---|
| [volatile schema 用例](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/volatile-config.spec.ts#L9) | 缺省与默认值、输出类型、序列化重建、快照复制冻结、非法声明路径 |
| [Loader 更新用例](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L22) | 真正创建 Loader 条目、更新配置、检查引用与实例身份、事件和普通更新流程 |
| [Group/Include 组合用例](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L420) | 通过 boot 和 profile patch 更新真实子树，检查免重挂与混合修改的重挂行为 |

第一行不是后两行的替代品。甚至测试文件的介绍性注释也不能代替阅读它究竟挂载了什么。可借鉴的原则是：**证据要走过你声称可靠的入口和生命周期。**

## 四、验证更新的提交次序，而不只验证最终值

即时更新除了值正确，还涉及旧实例是否被错误释放、其他实例是否受影响、订阅者有没有读到一半新一半旧的字段。

[Loader 回归测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L56)验证多个引用都提交后才发一次局部通知、另一个实例不变、同值不通知；[无效与混合修改测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L85)验证无效候选保留旧引用，普通字段同时改变时走正常生命周期。这些断言约束的是观察者实际能看到什么。

这里也有上限：保留旧运行值不等于回滚整个配置树。[另一个用例](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L473)明确验证失败条目的新 raw config 仍保留，健康条目可以继续提交。因此它提供的是具体实例的运行值保护，不是整个配置文件的数据库式全成全败事务。

这种精确区分值得借鉴。写“失败保留旧值”时，必须交代保留的是内存引用、原始配置、磁盘文件，还是整棵树，不能只用“安全更新”四个字概括。

## 五、设置修改要检查磁盘、消费者和重启恢复

设置页面显示保存成功，仅能证明某个响应返回成功。主仓还验证保存后的实际消费者、持久化文件以及重新启动后的状态。

[配置测试夹具](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/tests/configuration-fixture.ts#L19)创建临时 profile、真实 bundle 和 patch，再启动真实 ConfigEditor、Settings、默认模型消费者。[业务用例](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/tests/configuration.spec.ts#L9)修改模型选择后，检查插件身份不变、消费者读到新值、磁盘 patch 正确，最后销毁并重新启动检查恢复。

同一组测试还验证了这些失败情况：

- 无效值与非即时字段修改被拒，磁盘内容不变。
- 更高优先级的 home 配置遮蔽修改时拒绝保存，避免显示保存成功但实际不生效。
- 相同 revision 的并发修改只有一个成功，外部变化后拒绝陈旧修订。
- 修改数组字段时，不会丢掉前端响应中已脱敏的秘密字段。
- 配置结构合法但插件激活失败时，恢复原 patch 和原有效设置。

依据见[configuration 用例](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/tests/configuration.spec.ts#L22)。实现位置是[SettingsForms 的写入路径](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/src/index.ts#L377)和[ConfigEditor](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/config-editor/src/index.ts#L87)：锁内重读与校验、检查层覆盖、原子写文件、协调应用，失败时恢复。

我的判断是，这类测试比只增加“合法值返回 true”的单测更有工程价值，因为它检验了跨组件共同承诺。恢复操作仍可能面对磁盘故障或再次激活失败；当前实现不等于对进程崩溃、任意外部副作用提供完整事务保证。

## 六、模型可见变化要留下可重建、可比较的证据

配置会影响工具集、提示词和请求参数。如果只检查 Config 解析结果，就无法证明最终发给模型的内容正确。

DSH 的[录制会话规范](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md#L5)要求从真实 CLI/profile 进入，并为提示词和工具 schema 保留可读 sidecar；涉及工作区修改时，单独比较完整预期文件树，record/refresh 不改写这份独立预期。模型自称成功、工具结果文字声称成功，都不能替代外部效果检查。

这种做法有两个用途：一是让当前代码按历史模型输出重新走真实流程；二是让模型可见输入和持久化结果的变化进入评审 diff。[测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#L53)要求非平凡的模型、协议或用户可见变化在同一 PR 更新相应场景。

但录制回放使用固定的模型输出，不会重新测量当前线上模型的智能或回答风格。DSH 自己的[真实 API 测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#L23)明确区分无密钥流程证据与真实模型运行。我的判断是：应把这两种证据组合使用，不能以回放确定性代替语义正确性。

## 七、实际发现的粗糙处同样值得记录

主仓有严格规则，并不意味着规则、实现、注释和教程始终一致。本次追查已经发现可以具体复核的差异。

| 观察 | 依据 | 对质量判断的意义 |
|---|---|---|
| `required()` 注释暗示默认值能补救，但实现先拒绝缺值 | [声明注释](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L159)、[实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L533)、[测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/tests/schemastery-json-schema.spec.ts#L25) | 注释必须与实现和测试交叉核实 |
| 设置教程提到 `.check()`，当前 Schemastery 未定义这个 API | [教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-settings-card.zh.md#L30)、[库的声明与实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L135) | 文档完整和链接有效不等于操作示例真实可用 |
| 来源检查只识别特定单行写法 | [检查器](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-config-source-ownership.ts#L22) | 执行器的覆盖范围要单独检查 |
| Config 目录只检查字段存在性 | [字段查找](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/gen-config-catalog.ts#L399) | 不能升级为类型与运行时语义全等的保证 |

这些发现不是对整套做法的否定。它们说明可靠的评价应该同时列出执行机制、反例和覆盖上限；自动检查继续补充人工判断，人工判断也继续检查自动化没有覆盖的事实。

## 八、插件作者可以怎样借鉴

不必把主仓所有门禁搬过去。先围绕自己的一个配置变化形成最小完整证据，再根据真实事故和风险扩展。

1. 在拥有配置的插件中定义 schema 与类型，明确默认值、必填项和额外业务检查。
2. 写能拒绝错误输入的窄测试，覆盖最可能被误用的规则，而不重复每条普通赋值。
3. 通过真实 Loader/发布入口加载一次，检查导出、依赖与配置确实被消费。
4. 若支持即时设置，检查实际消费者、引用身份、失败保留、磁盘和重启恢复。
5. 若改变模型或用户可见行为，检查真实组装结果，并选择对应回放或外部效果证据；需要证明真实模型能力时再跑真实 API。
6. 对反复出现的机械遗漏建立有反例测试的检查器，并把其范围写清；其余判断留在明确的评审标准中。

借鉴的核心是让“这次改动为什么可信”有可重算的回答；配置 schema、检查脚本和覆盖率都只是其中一部分。对更宏观的质量归纳，见[逐项评估](./04-assessing-quality-claims.md)。

> 核验状态见[核验基线登记](../00-baseline.md)。
