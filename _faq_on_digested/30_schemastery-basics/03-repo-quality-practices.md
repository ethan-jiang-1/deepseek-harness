# 03 · 主仓怎样把质量要求变成可检查的事实

## 研究范围：围绕 Schemastery 看 DSH 怎样长期维护配置质量

这里要回答的是：DSH 自身开发时，怎样长期保障 Schemastery 相关配置的正确性，以及以后开发自己的 DSH 插件可以借鉴什么。显性声明和抽象让规则更容易定位；质量还要看类型、解析、Loader、消费者、设置保存和文档是否持续一致。

本篇沿一条配置的完整使用链展开：声明的规则有没有被准确记录，真实入口有没有消费，更新失败时保留什么，保存后是否生效，相关事故怎样转成以后的回归检查。运行时机制是被验证的对象，重点是主仓怎样开发和维护它们。

[本地验证流程](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-pre-push-checks/SKILL.md#L27)要求按影响选择证据，而不是每次运行全部套件。对这个专题，意味着分别使用解析测试、真实 Loader 测试、设置持久化测试和文档生成检查；配置影响模型输入时再补对应会话证据。下面同时交代每项检查的作用与上限。

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

对 Schemastery 的即时配置，可以分清三层证据：

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

## 六、配置影响模型时，再补模型可见证据

Schemastery 解析正确，还不能证明配置变化最终产生了正确的工具声明或提示词。只有配置确实影响这些内容时，才需要继续追查模型请求，不必把所有 Agent 质量问题都放进配置专题。

DSH 从会话日志（Session）构造模型请求，并为录制场景保留提示词、工具 schema 的可读配套文件（sidecar）。这里的录制快照是可重跑的会话轨迹，不是界面截图。这样评审配置改动时，可以比较实际组装后的输入，而不是只看 Config 对象。依据见[请求构造](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent-loop/src/agent.ts#L626)与[输入固定规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/README.md#L85)。

[测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#L53)要求非平凡的模型、协议或用户可见变化在同一 PR 更新组装后的录制场景。涉及工作区修改时，还要[独立比较预期文件树](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md#L15)，不能把回放与实际效果验收当成二选一。

这里的证据上限也明确：固定模型输出的回放可以检查配置消费和流程回归，不能判断新提示词是否让当前模型更会完成任务。如果配置改动声称改善模型表现，还需要真实模型运行和独立任务验收。完整测试分工见 [FAQ 29](../29_keyless-meaning-boundaries/answer.md)。

## 七、真实事故怎样变成长期检查

[文件系统工具事故复盘](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md#L7)直接说明为什么配置语法、真实装配和语义验收缺一不可：当时组合中的表达式没有按作者预想的位置求值，工具始终未注册；快照刷新又把 `UNKNOWN_TOOL` 接受为新预期，测试仍然通过。

修复不仅调整组合，还增加了静态配置检查和拒绝未知工具结果的守卫。可借鉴的是这个开发闭环：从真实配置事故识别错误类别，再让以后同类修改触发明确失败。它不是 Schemastery 字段校验能独自发现的问题，因为错误发生在配置如何被 Loader 消费、功能有没有真正挂载。

[record 与 refresh](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/README.md#L81)也因此必须区分：record 产生新的真实模型轨迹，refresh 用旧轨迹重算当前实现的输出。刷新结果进入 diff 供人判断，不等于已经证明改动正确。独立效果预期不能跟着刷新一起改写。

本次研究还发现较小但真实的漂移：`required()` 注释暗示默认值能补救，而实现先拒绝缺值；设置教程使用当前库没有的 `.check()`。具体证据见[解析语义](./01-schema-and-validation.md)与[研究记录](./research.md)。链接有效、目录新鲜不代表教程语义正确，因此涉及 Schema 操作的说明仍应对照实现并实际运行。

## 八、从验证事实进入设计实践

本篇集中回答当前主仓有哪些执行中的检查、它们覆盖什么。为什么配置所有权和更新入口形成今天的设计、哪些能力被主动放弃，以及以后插件开发怎样采用这些纪律，统一见[配置开发实践](./05-practical-design-disciplines.md)。

> 核验状态见[核验基线登记](../00-baseline.md)。
