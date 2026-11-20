# 05 · 从配置演变中提炼插件开发纪律

## 为什么还要读历史

显性声明让配置规则可见，但长期质量还取决于开发者要维护多少份规则、多少条更新路径，以及失败后系统究竟保住了什么。本页接在[配置使用链](./02-dsh-consumers-and-lifecycle.md)之后，围绕 Schemastery 的类型、解析、volatile、Settings 和投影，提炼可以迁移到插件仓的做法。当前实现的测试明细统一在[验证证据](./03-repo-quality-practices.md)，这里集中解释为什么这样设计、付出什么代价，以及插件作者怎样决策。历史提交用于说明问题与取舍；当前机制仍以源码、测试和现行文档为准。[历史研究记录](./history-research.md)保留查证范围与出处。

这里的最佳实践是从具体案例归纳出的建议，不是声称 DSH 已经证明它们适用于所有项目。

## 一、先减少需要同步的事实，再增加一致性检查

### DSH 的具体取舍

[历史配置来源决定](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-08-04-configuration-source-ownership.md)处理来源与优先级；后来的[profile 配置决定](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-09-19-profile-owned-live-configuration.md)进一步指出，独立 Settings 注册重复了 schema、默认值、持久化与通知，而且存储设置压过部署 overlay。历史 [#4587](https://github.com/deepseek-ai/deepseek-harness/pull/4587)于是让插件 Config 拥有配置，Settings 只投影可编辑字段并写回 profile，删除另一套 settings 文件实现。

关键不是给两份配置加一个同步器，而是删除第二个业务配置来源。Note 也没有隐去代价：原来的跨 profile 偏好变成 profile 专属；恢复共享偏好需要明确的共享配置层和写入目的地。

### 插件开发纪律

增加一个字段前，先回答：**默认值在哪里定义，运行时读谁，用户修改写哪里，重启后从哪里恢复？** 四个答案应能沿同一条配置链解释。设置页面不再另建一份业务默认值，消费者也不再依次查询 Settings、Config 和自建文件来猜谁优先。

若确实需要独立用户状态，先说明它为什么不是配置、为什么有不同的生命周期；不要把所有数据强塞进 Config。减少事实副本与区分不同领域对象是两件事。

## 二、把正确性放到所有调用者必经的位置

### DSH 的具体取舍

volatile 的历史 [#4579](https://github.com/deepseek-ai/deepseek-harness/pull/4579)合并提交保留了实现迭代说明：曾有独立的 `volatile-hmr` 插件，依赖 app boot 与 HMR 发出“配置已应用”信号，测试也要手工发信号；后来发现各条 Loader entry 配置协调路径本来就经过 `Entry.update`，于是把候选解析、普通有效值比较和引用提交收回该入口，并删除额外插件及通知接线。见[历史提交说明](https://github.com/deepseek-ai/deepseek-harness/commit/3f7016a4226777b2898eb1919f1527ab9915bbcd)及[当前决定](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-09-18-volatile-config-references.md)。

这是同一合并提交记录的开发过程，不应伪装成多个已独立发布的版本。它支持的结论是：团队最终减少了“每个入口都要记得做一次”的义务。

### 插件开发纪律

当 UI 保存、文件监听和程序调用都能改变同一配置时，验证与提交应由拥有状态的公共操作完成；外围只负责触发和展示。评审时可以问：**再增加一个调用者，它必须记住哪些额外步骤，才能保证旧实例不会继续使用错误值？** 如果答案包含若干手工通知、同步缓存或补跑协调，先检查是否把正确性放错了位置。

这不要求插件作者修改 Loader。优先使用现有更新入口；自己的插件服务也按相同原则组织状态修改，避免另造与 Loader 平行的配置更新路径。

## 三、动态字段是生命周期承诺，不能只按 UI 是否方便编辑来决定

[volatile 决定](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-09-18-volatile-config-references.md)从一个具体问题出发：改参数就替换整个插件，会释放仍然有效的服务和 effects；另加 Settings 订阅又制造第二套动态配置。其选择是稳定引用、不可变快照，消费者按操作读取；普通配置仍沿原生命周期重新挂载。

因此声明 `.volatile()` 前，要解释哪个资源继续有效、哪次操作开始使用新值，以及进行中的操作是否保留原参数。对超时、输出预算等操作参数可以按操作捕获；连接地址、资源身份或注册结构改变后是否还能复用旧实例，则需要具体判断。

实战验收不能止于 `.get()` 返回新值。至少检查：实例和引用是否保持身份、下一次操作是否用新值、已开始操作是否遵守原语义、非法候选是否保留旧运行值、普通字段变化是否正确走原生命周期。对应真实 Loader 证据见[第三分篇](./03-repo-quality-practices.md)。

这里也应考虑不必要的影响范围。[插件市场决定](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-10-02-plugin-market-discover.md)解释了为何不把市场字段放到正在管理安装任务的 plugin-manager 上：普通字段编辑会重挂它并中断工作；独立服务用额外包的成本换取配置隔离。这是需要消费路径证据的职责选择，不能简化成“字段越动态越好”或“服务越拆越好”。

## 四、先筛选候选，再解析和比较有效值，最后提交

Schemastery 的解析可能运行 transform、回写输入；Loader 还可能求值表达式。因此把“试着解析一次”当作无副作用的差异比较，会让一次配置编辑意外执行额外逻辑。

volatile 的[历史提交](https://github.com/deepseek-ai/deepseek-harness/commit/3f7016a4226777b2898eb1919f1527ab9915bbcd)和[现行 Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-09-18-volatile-config-references.md)区分了两步：先依据 schema 元数据比较 raw 配置；只有符合即时更新条件时，再经过真实配置 hook 和校验，并确认普通有效值仍相同。不能仅因 raw 只改 volatile 字段，就忽略表达式依赖的普通值已变化。

可迁移的纪律是：**给比较、预览、验证和提交分别定义是否允许执行代码与改变状态。** 不要因为一个 API 名叫 validate、dump 或 diff，就假定它是纯函数。转换函数尽量保持无副作用；需要副作用的业务动作放到有明确所有者的执行阶段。具体解析陷阱见[第一分篇](./01-schema-and-validation.md)。

## 五、不要让“生成了结果”冒充“结果足以作判断”

JSON Schema 投影的历史 [#4705](https://github.com/deepseek-ai/deepseek-harness/pull/4705)面对的困难不是缺少字段映射，而是原生解析含有静态 schema 无法忠实表达的行为。[决定记录](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-09-20-config-schema-dump-validation-policy.md)拒绝执行 transform 来模拟全部原生行为；选择放宽无法精确表达的部分、记录 limitation，并让不完整投影以非零状态报告。

其根本考虑是编辑器和 Agent 会把机器输出作为后续决策依据。一个合法 JSON 文档不等于完整验证器；仅写一条容易忽略的 warning，可能让调用者把近似结果当成权威。

插件作者对导出、预检、表单投影也应分别报告“成功产生了什么”和“还不能证明什么”。例如字段存在性检查不能命名为类型等价检查，配置语法通过不能报告插件已经可用。失败状态和诊断需要让调用者能选择下一步，而不是只供人翻日志猜测。

## 六、失败保证要有范围；更强的自动恢复也有长期成本

[非事务 Loader 决定](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/simplification/2026-09-09-nontransactional-loader.md)记录了一次反向取舍：通用事务重载要长期承担候选导入、生命周期等待、恢复和 Include 序列化等复杂性，因此撤回这套机制，由需要启动成功的消费者在等待结束后明确审计激活结果。见[消费者适配历史提交](https://github.com/deepseek-ai/deepseek-harness/commit/fac0a9181fad869dc5c9b48e1be424f96a6c81ed)。

这不是“回滚不好”。它说明团队按维护成本收窄了 Loader 的保证，而不是在另一层换名字重建同一套事务；Settings 对自己写入的 patch 做恢复，仍是另一个有明确范围的责任。不能从局部恢复推导整棵树或外部副作用都可回滚。

该决定还保留了少量 vendor 修改，并给出反向实验：删掉 Include 初始化修复会重现 `ENOENT`，删掉 Schemastery 条件导出会在真实 Web preset 启动时重现模块加载竞争。证据见[后续清理提交](https://github.com/deepseek-ai/deepseek-harness/commit/d225dbba5034298505246fa81625d30e3db994a4)。裁剪按具体义务与失败证据进行，而非把某次旧 PR 的全部代码一并保留或删除。

插件评审可以要求一句精确的失败说明：失败后，旧运行值、raw config、磁盘文件、插件实例分别是什么状态，谁负责恢复，调用者是否可以继续。随后让测试检查这些状态；只断言抛错或打印日志不够。

## 七、Skills 怎样把这些思考变成开发动作

在本专题里，Note、Skill 与测试承担不同职责：Note 保留为什么选择及放弃什么；Skill 提醒下一次开发怎样调查和验证；源码与实际执行的检查决定要求是否被强制落实。Skill 文本本身不是新的自动保证。

| 已查阅的主仓 Skill | 对配置开发的具体用法 |
|---|---|
| [简化调查](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-find-simplifications/SKILL.md) | 计算删掉了哪些维护义务；给重复配置再加同步器不等于减少义务，搬家也不等于消除复杂性 |
| [错误处理](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-error-handling/SKILL.md) | 捕获异常不等于恢复状态；让状态所有者定义失败后的保证，测试最终状态与可见结果 |
| [生命周期审查](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/cordis-styling-nitpicking/SKILL.md) | 配置触发重挂时，检查旧操作是否已结束、资源与监听者是否活到清理完成，不能仅以发出 abort 为完成 |
| [文档核验](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-doc/SKILL.md) | 对 Config 示例实际解析或挂载；读取 Note 与教程不替代运行，生成目录不替代语义验证 |
| [按范围选择验证](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-pre-push-checks/SKILL.md) | 根据字段、Loader、设置、模型输入或发布入口的影响选择证据，减少无关全量运行并避免漏测真实入口 |

可迁移到小插件仓的是一段可执行的开发流程：修改前画清配置读写路径；设计时减少重复来源与额外更新步骤；实现时明确生命周期和失败保证；验证时从发布入口观察实际消费者；评审时核对能力损失与独立预期。只有反复出现且可机械判定的遗漏，才继续固化为脚本。

## 八、把纪律落到一次插件配置改动里

假设以后开发一个检索插件，要允许用户在线修改超时，同时保持正在使用的服务可用。下面是根据上述案例推导的开发与验收方案，不是 DSH 已实现的另一个示例插件，也没有在本轮创建该插件。

1. **先定时间语义。** 新超时作用于保存后的新操作，已开始操作保留自己的参数；连接资源若不因超时变化而失效，才考虑把这个字段声明为 volatile。先说明这一点，再写设置控件。
2. **只增加一处业务配置声明。** 类型、schema 和文档描述同一个字段；设置页投影它并走现有 profile 写入。执行操作时读取引用，避免启动时复制后永不刷新。
3. **验证完整路径。** 用真实 Loader 加载最终组合，发起操作 A，修改超时，再发起操作 B；检查服务与引用身份、A 和 B 实际采用的参数。然后销毁、重启并确认保存结果。
4. **主动构造会推翻方案的情况。** 提交非法值，确认消费者和文件没有被错误修改；加高优先级 overlay，确认保存不会虚报生效；同时修改普通字段，确认原生命周期仍被遵守。若需要用户决定覆盖语义，也要展示完整 entry 被固定的影响。
5. **评审最终状态，而不只看通过计数。** 把每项承诺对应到真实断言；确认测试没有手动替生产入口补发通知。若声明改善检索效果，另外定义任务效果验收，不能用配置解析通过代替质量提升。

把这个假设插件的验收写成矩阵，可以避免“测过更新了”的笼统结论。下表是未来插件的建议测试，不表示本轮已经执行了并发操作 A/B 或 reset 的全部场景。

| 场景 | 应观察的断言 |
|---|---|
| 只改超时 | 服务与引用身份不变，后续操作采用新值 |
| 操作 A 进行中再保存，随后开始 B | A 保留已捕获参数，B 使用新参数；不能只检查引用里的最终值 |
| 非法设置候选 | 消费者运行值与磁盘内容不因该候选改变 |
| 更高层覆盖 | 保存被拒绝，不能显示已经生效 |
| 同时改普通字段 | 走该插件定义的重挂与资源清理流程 |
| 保存后重启 | 新实例从持久化配置恢复预期值 |
| 删除整个 entry 的 config 覆盖，再改变基础默认值 | 恢复继承；与单字段 reset 的行为明确区分 |

最应留在评审里的问题是：**这个方案让未来每次修改少维护了哪一份事实、少记住了哪一步，同时保住了哪些明确的行为？** 若只是新增更多同步逻辑和注意事项，就还没有获得历史中这些收敛带来的长期收益。

> 核验状态见[核验基线登记](../00-baseline.md)。
