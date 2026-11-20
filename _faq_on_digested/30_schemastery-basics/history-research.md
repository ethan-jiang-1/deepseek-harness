# Schemastery 配置演进：从历史决策提炼插件开发纪律

本文研究配置声明、实时更新、配置归属、Settings 和 schema 投影的历史选择，供后续插件开发借鉴；不重复同专题的 API 用法，也不评价一般 Agent runtime 质量。最强结论是：一个 Config 声明可以供校验、运行期引用和表单投影使用，但配置的来源、写入位置、提交时刻与投影可信度仍须分别由明确的拥有者负责。

## 证据方法与阅读边界

以下“直接记录”指提交正文、该提交的差异或 Note 明说的理由；“推断与实践”是从这些证据提炼的建议，不冒充作者原意。历史 commit 链接指不可变事件；源码和 Note 链接依语料宪章指向 master。活动 Note 会随实现更新，故历史论断以实际检查的 `git show` 为准；归档 Note 只作冻结历史，不当作现行规范。未修改任何 Note。

本次执行了有界 `git log`、精确 `git show` 和当前源码／测试阅读，没有运行测试。下文“保护”表示检查到的测试断言，不表示本轮测试通过。全历史遍历遇到缺失对象 `3d05fdfbfbd062d61b713147d418be6080572ac2`；仓库不是 shallow，但不能据此声称历史完整。列出的提交和差异均能单独读取；同题提交存在上游与本地重放版本，本文不据重复记录推断两次独立设计。

## 演进链一：Settings 从独立配置来源，变成 profile 的编辑投影

**问题。** 冻结的 [user-settings seam Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/architecture/2026-07-28-user-settings-seam.md#L10-L29) 记录了早期动机：个人偏好缺少统一写入者，构造时读取的插件也无法从普通更新中得到实时值，因此设置服务单独负责存储、校验和传播。它当时明确否决“直接写 Include”作为用户层，理由是用户偏好应该跨组合存续。后来的 [configuration source ownership Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-08-04-configuration-source-ownership.md#L21-L32) 却暴露这个选择的代价：Settings 只能看到已合成的 entry config，不能区分 bundle、用户 patch 和命令行 overlay，存储偏好因此压在全部组合输入之上。

**直接记录的决定与取舍。** 历史提交 [601d6761e49b2d93762332cffb832b95bda22f52](https://github.com/deepseek-ai/deepseek-harness/commit/601d6761e49b2d93762332cffb832b95bda22f52)（#4587）删除独立 settings-file provider，让插件 Config 拥有字段类型、默认值和实时性，Settings 只生成可编辑视图，config-editor 写活动 profile，再走普通 Loader 协调。该提交新增的 [profile-owned Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-09-19-profile-owned-live-configuration.md#L7-L23) 明说拒绝“保留第二份存储再加 adapter”：那仍需处理两个持久化文档在并发写入与重启后的胜负。它也明确放弃了原先跨 profile 的全局偏好；共享偏好若再出现，需要显式共享 Cordis 层和写入目标。

**可执行保护。** 该提交中的真实 profile 测试同时检查：写入后真实消费者变化且 fiber 身份保持；销毁并重启后恢复相同值；两个实例互不影响；高优先级 home 层会遮蔽修改时拒写且文件不变；两个相同 revision 的并发写只有一个成功；编辑其他字段后原始表达式仍存活。对应断言见 [configuration tests](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/tests/configuration.spec.ts#L9-L76)。执行写入的 [config-editor](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/config-editor/src/index.ts#L87-L153) 在锁内重读、协调、校验，先检查最终合成结果是否等于候选，再持久化。

**限度。** “单一来源”不等于字段级继承完美。Note 明说 patch `config` 替换整个 entry：一次局部编辑会把当时的普通字段和所有 volatile 字段写入 profile，后续 bundle 对这些字段的变更因此被固定，直到移除整个 config override；整个 entry reset 与单字段 reset 的后果不同。见 [完整替换的代价](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-09-19-profile-owned-live-configuration.md#L15-L23)。旧文档的导入策略也选择先改名再写入，拒绝的 section 保留在改名文件中，不能把它理解为所有 section 原子迁移。

**推断与可迁移实践。** 新插件先定义“哪份文档拥有这个值、谁有权写、哪一层可以盖过它”，再做设置页。优先把表单设计为已有配置的编辑者，而非增加第二个业务配置服务；若确需全局偏好，明确为独立共享层。测试必须同时覆盖保存、运行中消费与重启，且至少给出一个“保存会无效，所以拒写”的反例。选择整对象覆盖时，把继承被固定的代价视为产品行为。

## 演进链二：volatile 从额外 watcher 协议，收敛到 Entry.update 的提交点

**问题。** 改操作期参数若必须替换插件，会销毁仍有效的服务和 effects；另造 settings 订阅 API 又迫使每个消费者接入第二套实时配置语义。见 [volatile Note 的问题与替代方案](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-09-18-volatile-config-references.md#L7-L25)。

**直接记录的决定与演进。** 历史提交 [3f7016a4226777b2898eb1919f1527ab9915bbcd](https://github.com/deepseek-ai/deepseek-harness/commit/3f7016a4226777b2898eb1919f1527ab9915bbcd)（#4579）的 squash 正文保留了关键中间方案：先做 opt-in volatile-hmr 插件，再删除它。正文给出的原因很具体：独立插件需要“配置已应用”信号，app-boot 与 HMR 各发一次，测试还要手动发；各条 Loader entry 配置协调路径本已经过 `Entry.update`，提交应放在那里；直接 `fiber.update()` 仍保留不同语义。最终把原始差异比较与真正解析分开：比较只读 schema 元数据；候选通过 `internal/config` 和完整校验后，普通有效值仍相等才提交引用，再通知所属 fiber。不能仅靠原始普通字段未改就断定实例可以保持，因为表达式外部依赖可能已变。

**可执行保护。** [Loader 生命周期测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L56-L107) 检查引用身份、另一实例不变、所有引用在一次事件前已提交、非法候选不改运行值、混合更新销毁旧实例。更关键的是 [无 HMR 的 profile／Group／Include 路径](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L420-L471) 也保持实例；[普通表达式有效值变化](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L510-L560) 则必须重挂。这些断言区分了“实现依赖一个 watcher”与“所有更新入口都遵守同一策略”。

**限度。** 这只是满足条件的配置提交，不是通用热替换或全树事务。非法候选可留在 raw config，运行引用仍保持旧值；后续重新激活会再次面对它。普通字段变化、依赖／隔离替换、直接 `fiber.update()` 保留各自生命周期。通知监听器不是提交成功的参与者，监听失败只记录；普通 transform 每次生成新类实例也可能导致重挂。见 [明确列出的后果](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-09-18-volatile-config-references.md#L27-L33)。

**推断与可迁移实践。** 新插件先区分“资源构造参数”与“每次操作读取的参数”，仅后者适合 volatile。可以长期持有引用，值只在一次操作内捕获。审查框架时，数一数有多少调用者需要记得发“更新完成”事件：若它们最终已汇入同一个更新操作，把提交和通知放在那里。保护测试应断言实例／引用身份及通知时序，而不仅断言新值；还要包含相同 raw 表达式得到不同有效值的反例。

## 演进链三：JSON Schema 投影从结构转换，走向显式近似与可信度报告

**问题。** Schemastery 校验可执行 transform、改写容器输入并传播 lazy 元数据。只看静态声明而生成看似精确的 JSON Schema，可能误拒原生接受的输入，也可能让编辑器／Agent 把不完整结果当成权威。

**直接记录的决定与替代方案。** 历史提交 [8c2ff685d45a06ebddd471f06bce4006d7884ce5](https://github.com/deepseek-ai/deepseek-harness/commit/8c2ff685d45a06ebddd471f06bce4006d7884ce5)（#4705）新增投影器及 [validation-policy Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-09-20-config-schema-dump-validation-policy.md#L7-L27)，提交正文记载对 effectful 校验的修正。Note 明确选择：无法静态模拟的变更机制采用放宽并报告 limitation；部分结果仍输出可用 schema，但 `complete: false` 且退出 1；发现过程覆盖 disabled 声明，而不把“能启动”当“声明完整”。拒绝执行 transform 或模拟其写回次序，因为那会运行插件代码并把 projector 绑到原生内部实现。

**可执行保护。** [union 反例测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/tests/schemastery-json-schema.spec.ts#L209-L233) 构造第一分支 transform 将字符串改成数字、随后分支失败，第二分支再因这个改写而成功的输入；投影时回调不得执行，结果必须容纳该输入并说明限制。紧邻的普通 default 反例确认没有写回时不应滥用同样的放宽。历史提交还新增 [CLI 真实入口验收](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/tests/dump-config-schema.expected.e2e.ts)：插件 apply／构造器和表达式设为会抛错的探针，验证没有启动插件；用 Ajv 检查输出以及正反配置；对 partial 结果同时断言可解析 stdout、非零退出和诊断。收集器的 [disabled 与不执行校验测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/tests/config-schema.spec.ts#L131-L213) 进一步固定发现语义。

**限度。** 不挂载插件不等于不执行 JavaScript：导入模块、Config getter 与 lazy builder 仍可能执行。非零退出也不等于 stdout 无用。disabled group/include 的子树规则有例外，不能笼统声称所有禁用后代都被收集。Note 的 `complete` 是该投影策略的可信度标识，不是插件能成功启动的保证。

**推断与可迁移实践。** 从配置生成编辑器、表单或 Agent 输入时，把“产物可解析”“覆盖了多少声明”“能否替代原生校验”作为不同问题。无法精确表达时，先选不误拒合法输入的近似，再给机器可读限制与显式失败状态。最有价值的测试是原生与投影的差分反例，并分别检查投影阶段没有执行哪些回调；不要以正常样例都通过代替语义对齐。

## 演进链四：可发现的 schema 必须描述调用者实际面对的配置树

**问题。** CLI schema dump 已存在，运行中的 Creator 仍缺少 Config 来源。另开 shell 需要已知 profile 名与可执行文件，重跑 boot-free collector 会重装模块解析 interception，而且描述的是文件组合而非正在挂载的树。

**直接记录的决定与替代方案。** 历史提交 [8c146d978fef1874747b03d9580db1b56d09212f](https://github.com/deepseek-ai/deepseek-harness/commit/8c146d978fef1874747b03d9580db1b56d09212f)（#4834）改为遍历 live Loader entries，并复用 app-boot 的单条 projector；理由与被否决的“Host 内重跑 generateConfigSchema”见冻结的 [live-config inspection Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/architecture/2026-09-21-live-config-inspect-provider.md#L8-L26)。提交正文还记录一次实际容量问题：Web profile 全目录超过 50000 字节 spill 上限后，预览不再是 JSON，于是改为分页、限制条数与精确名称过滤。这条理由比“将来可能很大”更强，因为它对应已发生的消费失败。

**可执行保护。** [Config provider 测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/extensions/tool-cordis/tests/config.spec.ts#L65-L126) 区分 Loader id 与树内 patch id、schema／absent／unsupported／inactive／tree 状态，检查分页续点与筛选，禁用后不再给 schema，无 Loader 时明确失败。提交同时修改真实 Web preset e2e，启动后查询 Config provider 并投影 shipped tools 行，避免只证明人工拼装树可用。

**限度。** live 查询不是所有可能配置的全集：inactive 项不提供 schema，运行时创建但不在 Loader 下的 Agent preset 树不在目录中。分页保证目录可分段消费，不代表单个 schema 大小天然有上界。归档 Note 的“无输入返回每项”是概要描述，容量细节应以提交差异及测试为证。

**推断与可迁移实践。** 设计插件可发现能力时，先问调用者面对“可声明的组合”还是“当前挂载实例”，选择对应的数据来源；复用纯投影逻辑，而非复用带启动上下文的整段流程。提供状态和稳定实例标识，避免把同名插件当同一配置对象。对目录型返回值在完整封套形成后测容量，并使下一页无需猜测；文档存在不等于运行中的消费者拿得到它。

## 演进链五：配置恢复能力的复杂度，要由实际消费者与删除反例共同决定

**问题与历史转向。** 冻结的 [hot-reload resilience Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/bug-fix/2026-07-20-config-hot-reload-resilience.md#L8-L30) 曾选择补偿式配置事务，追求失败后恢复旧插件代际；它当时也承认中间 effects 可见，不能承诺无感原子替换。后来的 [nontransactional-loader Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/simplification/2026-09-09-nontransactional-loader.md#L7-L29) 明确改变取舍：通用 Loader 不再拥有候选导入、全树结算与回滚，启动／编辑消费者自行审计实际 activation 结果。

**直接记录的改动。** 历史提交 [2abb542a222032b1ad3c5abd7bb65ffffe15b8de](https://github.com/deepseek-ai/deepseek-harness/commit/2abb542a222032b1ad3c5abd7bb65ffffe15b8de) 调整现有消费者，提交 [d225dbba5034298505246fa81625d30e3db994a4](https://github.com/deepseek-ai/deepseek-harness/commit/d225dbba5034298505246fa81625d30e3db994a4) 再删除 update-result 扩展，改用已有 `internal/update` 观察异步重启错误。它没有机械恢复全部 vendor：Note 记录实际删除反例，移除 Schemastery 条件 exports 会在并发 Web preset 启动复现 `ERR_REQUIRE_ESM_RACE_CONDITION`，恢复 Include 原先写读次序会在 missing-file 初始化测试复现 `ENOENT`，所以保留这些独立必要改动。

**可执行保护与限度。** 后一提交实际修改 app-boot、user-patches、Web boot 和 preset mount 测试，保护显式失败报告、启动审计及 teardown；[当前 Note 的证据说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/simplification/2026-09-09-nontransactional-loader.md#L31-L35) 明说插件失败可以留下新 options 与失败 fiber，不能把等待 Loader 工作完成等同 activation 成功。此后链一的 config-editor 仍可对自己拥有的 profile 文件写入做恢复；这不重新赋予整个 Loader 通用事务保证。

**推断与可迁移实践。** 开发插件时逐个命名“校验失败后保留什么、激活失败后恢复什么、谁审计最终状态”，不要从 `.volatile()` 或 await 推导不存在的事务。删框架扩展时同时做两个判断：是否有当前消费者依赖，以及删除后哪一个真实入口反例会失败。小的兼容性修补可以保留，而昂贵的通用恢复机制可以撤回；前提是失败责任已有具体消费者接住。

## Notes、Skills 与测试各自提供什么证据

Note 保存“为什么这样选、放弃了什么、何时值得重提”；Skill 把经验变成后续调查和实施的操作纪律；源码与测试才能建立具体执行保证。三者不能互相代替：Note 写着保留旧值，不证明所有入口都保留；Skill 要求验证恢复，也不自动赋予 Loader 回滚能力。

这里有一条实际 Skill 演进可核对。历史提交 [c502648827655cd1e824e7aa2474de99706004dc](https://github.com/deepseek-ai/deepseek-harness/commit/c502648827655cd1e824e7aa2474de99706004dc) 重写 simplification discovery，把调查目标明确为“减少被维护的义务”，加入“更小的明确行为能否删除整个子系统”“能否在需要时读取权威值”“完整维护成本由谁承担”等问题，并明确仅把复杂度搬家或增加同步重复定义的检查不算简化。对应 [find-simplifications Skill](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-find-simplifications/SKILL.md#L18-L47) 与前述两次收敛有相同判断结构：删除第二配置存储及跨入口通知责任，同时说清损失的全局偏好或自动恢复能力。这是历史之间的呼应，不是已证明这些配置提交由该 Skill 导致。

当前 [error-handling Skill](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-error-handling/SKILL.md#L14-L26) 把同一纪律写得更直接：catch 只限制异常传播，不撤销修改，只有受影响状态的拥有者能确定安全继续；验证最终状态和可见结果，不能只验证异常被抓住。对未来插件开发，可把它具体化为一次评审动作：分别写出候选 raw config、运行引用和持久化 profile 在每种失败后的状态，再为每条承诺找执行者与反例测试。此处只引用当前操作指导，不主张已追溯该 Skill 的首次形成。

## 最值得迁移的思考方式

这些历史选择支持三条更基础的判断，以下属于研究推断。第一，配置是一个持续被写入、解析、消费并继承的对象，不能只把它当成启动参数类型；拥有者必须包含写入和失败责任。第二，同一份声明可以复用，但不同执行环境需要不同收集入口，近似投影需要公开自己的知识限度。第三，设计纪律最有说服力的证据是反例：不用 HMR 仍更新、普通有效值变化必须重挂、被高层覆盖必须拒写、失败分支改写输入仍被投影接受、删除小修补会在真实启动路径失败。它们比扩大功能清单更能防止未来插件把已经付过代价的问题重新引入。
