# DSH 原生开发流程：owner、证据与交付判断

## 流程由不同职责共同组成

独立插件仓的一笔变更可以借助 DSH 的原生机制组织：明确可观察结果，找到插件行为的实现 owner，判断是否有需保存的长期取舍，同批修改实现、用户文档与证据，再用匹配的检查和语义评审判断结果。这里解释的是 DSH 仓库中可核对机制对独立插件开发的适用部分，不是官方规定的统一阶段或方法名。

流程中的条件入口取决于它需要承载的事实。Issue 或直接任务上下文表达意图；持久决定理由需要 owning Agent Note，机械和局部编辑可以豁免；Plan Mode 是可选的实施计划与批准交互。不存在每次改动都要经过全部载体的要求。精确条件见 [意图入口](../sdlc-reference/09-intake-and-work-items.md)、[Agent Note 生命周期](../sdlc-reference/01-agent-note-lifecycle.md) 和 [Plan 与权限](../sdlc-reference/03-plan-and-sandbox.md)。

## Owner 让参与者找到修改与查证的位置

> Each fact has one home: the tier whose job it is; elsewhere, link there.
>
> — DSH [文档层级规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/AGENTS.md#the-tier-taxonomy-one-home-per-fact)。

Owner 的含义随拥有的对象变化。知识的 owner 是事实的权威维护位置；行为的 owner 是实现该职责的插件或服务；注册与资源的 owner 负责释放；测试场景的 owner 维护输入、预期和录制结果。这些用法共有一个要求：参与者必须能找到实际负责的位置，修改那里，并同步受影响的消费者或派生物。它不是一套统一的人员职位。

| 要确认的事实 | 首要维护位置 | 交付时要核对的关系 |
|---|---|---|
| 为什么改、外部结果是什么 | Issue 或任务上下文 | 实现与证据是否回答原始意图 |
| 为什么采用当前方案、放弃什么 | owning Agent Note | 记录是否对应实际交付的决定 |
| 当前行为与使用义务是什么 | 源码、类型、JSDoc、所属 README | 文档与接口是否描述实际行为 |
| 哪个场景固定住行为 | 所属 tests、expected output 或 recorded-session scenario | 断言是否能拒绝目标回归 |
| 交付有哪些实际验证结果 | PR Testing/Proof 与当前 CI | 证据是否对应当前 diff 和 head |

一个事实一个家并不要求一个 feature 只改一个文件。代码、当前文档和测试分别表达实现、使用义务和可观察证据；它们必须在同一变更保持一致。Owner 的价值是让 fresh agent 无需读取先前对话，也能定位这些事实。详细知识分工见 [可读性与知识归属](../repo-harness/02-legibility-and-ownership.md)。

## 完整切片与最小检查配合

完整交付要求受影响的实现、插件用户文档、配置消费者和行为证据同批修改；聚焦验证要求按实际 diff 选择会拒绝目标回归的最小可信检查。独立插件仓不必复制 DSH 主仓的 CI 矩阵，但不能因此省略自身支持入口的组合验证。

> Every behavior change needs the narrowest available test or purpose-built check that would fail for its regression.
>
> — DSH [推送前检查 Skill](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/skills/dsh-pre-push-checks/SKILL.md#select-relevant-evidence)。

因此，窄 diff 不是只改实现，最小测试也不是减少声称行为的证据。公共接口、生命周期和模型可见输出变化可能需要跨多个 owner 修改。检查选择、base 变化后的重新判断和失败处理由 [证据路由](../sdlc-reference/04-gates-and-local-checks.md) 定义。

## 测试资产必须有观察对象与独立预期

DSH 在计划时要求新能力、生命周期路径与 transcript 变体明确所需测试层。测试层按可观察对象分工，不能机械排列成每笔变更固定执行的阶段；仓库没有要求所有开发采用 test-first 顺序。

局部测试固定所属行为，真实组合测试验证 Loader 与 app/process 组装后的结果，录制会话场景固定模型、协议或用户可见输出，真实 API 测试检验实际模型与外部服务，不变量检查比较可能发生偏离的独立观察。任何一层都只能建立它实际断言的属性。政策来源是 DSH [Testing policy](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/testing.md)，反馈层的范围见 [可执行反馈](../repo-harness/05-executable-feedback.md)。

测试 owner 同时承担预期的维护纪律。[Recorded-session 规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/snapshots/AGENTS.md)要求只有场景 owner 记录或刷新所选 Session，共享引用只读且无环；工作区变更与独立的预期目录比较，record/refresh 不改写该预期。这样更新录制资产与接受新的外部行为是可分别检查的动作。

> An e2e assertion re-runs the command or re-reads the file externally; a keyword probe on the agent's own output lets a cheating agent pass.
>
> — DSH [核对外部结果规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/testing.md#verify-the-world-not-the-self-report)。

测试资产可复用的核心在于读者能确认：它观察哪个行为，经过什么真实入口，预期来自哪里，目标回归出现时为何会失败。文件存在、覆盖率为绿或模型报告成功都不能单独回答这些问题。

## 评估分工决定怎样接受结果

| 判断机制 | 它建立什么 | 还需要谁提供什么 |
|---|---|---|
| 测试、snapshots 与 CI | 已执行场景、构建、格式与平台的规定属性 | review 核对场景与意图是否匹配 |
| 语义 review | 实现、文档、取舍与证据是否符合需求 | 作者提供可复核的实际执行结果 |
| 批准规则 | 当前 PR 是否满足批准门槛 | 测试与 review 提供各自质量判断 |
| 显式用户交互 | 需要用户决定的范围、计划或操作已获授权 | 相关验证继续建立结果证据 |

DSH 不要求所有语义判断都由人完成；具备上下文的 agent 也可以 review。需要显式用户选择的动作、扩大既有授权范围的决定必须通过相应交互。评审职责见 [语义评审](../sdlc-reference/06-review-and-human-role.md)，批准状态见 [批准门槛](../sdlc-reference/10-approval-gate.md)。

Goal 的职责是保存同一会话的目标并支持持续推进。它可以要求模型收集证据，但状态变为 complete 本身不建立需求已满足的证明。DSH [goal 服务的限制](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/packages/goal/goal/README.md#known-limitations-and-deferred-work)将独立完成评估留给策略层。开发流程通过测试、实际结果和语义 review 判断交付，goal 负责让工作接续；两者各有职责。

## 从新仓库开始

先用 DSH [首次插件指南](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/user/develop/basic/index.md)建立最小可加载模块，按任务读取 [Cordis 教程](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/index.md) 与 [插件作者入口](../repo-harness/09-plugin-author-entry.md)，再为独立仓逐步补齐自身的 package/config、真实组合测试和用户可见预期。插件以本地模块加载、配置 bundle 发布和仓库如何组织是不同层次，不能由运行时插件示例推出唯一仓库模板。插件仓的具体目录、依赖固定方式与是否放入 DSH monorepo 属于独立的仓库组织决策，不是运行时插件接口的要求。

一笔交付结束后，新的参与者应能从当前文档与实现确认行为，从必要的 owning Note 找到持久取舍，从测试资产找到固定行为的证据。若提案已实现，Note 在同一变更移动并改写为实际交付的现在式决定；它不保留过期实施清单冒充当前事实。具体生命周期由 [Agent Note 参考](../sdlc-reference/01-agent-note-lifecycle.md) 拥有。

这解释了 DSH 原生流程的控制力来源：意图、实现、证据与接受决定相互核对，并且各自有能被重新找到的维护位置。插件仓借用这套流程时，首先应确认这些关系实际成立；DSH 自身的标签、批准积分和发布矩阵按各自适用范围使用，不自动成为外部插件仓的制度。
