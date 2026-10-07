# DSH 插件开发术语：给第一次进入生态的读者

## 怎样使用本页

这是本卷的入门词汇解释，不是 API 清单。每个词回答“是什么、开发插件时为什么会遇到、最容易误解什么”。框架术语遵循 DSH 一手文档；owner、切片、oracle 等常见工程词按本卷上下文说明，不把它们包装成 DSH 新增的正式职位或方法。

首次阅读先了解 **Plugin、Context、Loader、inject、effect、HMR、owner**，再读 bundle/profile 与测试证据。遇到类型、参数或准确状态时，回到对应的一手参考，而不是把本页当实现规格。

## 快速查词

| 你正在遇到的问题 | 术语入口 |
|---|---|
| 插件究竟是什么，运行在哪？ | [DSH 与 Cordis](#dsh-与-cordis)、[Plugin 与 applyctx](#plugin-与-applyctx)、[Context](#contextctx)、[Service](#service服务) |
| 配置如何变成运行中的插件？ | [Loader](#loader加载器)、[inject](#inject依赖声明)、[Config](#config插件配置)、[composition](#composition组合) |
| 保存文件后为何更新，如何清理？ | [effect 与 disposer](#effect-与-disposer)、[HMR](#hmr热模块替换)、[PENDING](#pending等待依赖) |
| 我应该改哪里、记录什么？ | [owner](#owner归属与权威来源)、[Agent Note](#agent-note决定记录)、[完整变更切片](#完整变更切片)、[contract](#contract使用义务) |
| bundle、profile 和插件是一回事吗？ | [bundle](#bundle配置分发包)、[profile](#profile可启动组合)、[patch 与 overlay](#patch-与-overlay)、[发布产物](#published-artifact发布产物) |
| plan、goal 与权限是什么关系？ | [Plan Mode](#plan-mode计划模式)、[goal](#goal会话目标)、[sandbox 与 approval policy](#sandbox-与-approval-policy) |
| 什么证据可以信？ | [real composition](#real-composition真实组合)、[snapshot](#snapshot录制会话测试)、[oracle](#oracle独立预期)、[e2e 与 smoke](#e2e-与-smoke)、[invariant](#invariant运行时不变量) |
| 测试通过，是否就完成了？ | [gate 与 CI](#gate-与-ci)、[semantic review](#semantic-review语义评审)、[approval](#approval批准)、[merge 与 release](#merge-与-release) |

## 一、插件怎样运行

### DSH 与 Cordis

**DSH（DeepSeek Harness）**是把模型、工具、会话、权限与用户界面组合起来的 agent harness。**Cordis**是其底层插件框架，负责插件加载、服务依赖、事件通信和生命周期。写 DSH 插件，既要使用 Cordis 的框架机制，也要遵守自己接入的 DSH 服务或事件的接口义务。

不要把 Cordis 当成另一种模型，也不要把 harness 理解为单独的一段提示词。DSH 的行为来自插件与配置的真实组合。依据：DSH [Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-primer.md)。

### Plugin 与 apply(ctx)

**Plugin（插件）**是加载后向 Context 贡献行为的模块。函数式插件的 `apply(ctx)` 是加载时调用的入口，不是模型每轮都会调用的工具。它可以注册工具、监听事件、提供服务，或安装其他贡献。

DSH 包规则区分两种导出：函数式插件使用具名导出的 `name`、`inject`、`Config`、`apply`，不同时加默认导出；service 插件默认导出其 Service class。最小教程不是所有包的唯一形态。混用两类导出可能让 Loader 丢失函数插件的 namespace 和依赖声明。依据：DSH [包规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/packages/AGENTS.md)与 [首次插件指南](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/user/develop/basic/index.md)。

### Context（ctx）

**Context**是插件访问服务、注册能力与绑定生命周期的对象，代码中通常叫 `ctx`。例如 `ctx.tools` 表示工具服务，不是插件的随意全局变量；`ctx.on()` 注册事件监听，`ctx.effect()` 管理可撤销的注册或资源。

Context 不等于模型的对话上下文窗口。这里的 `ctx` 是运行时对象；模型收到的 messages、prompt sections 和工具 schemas 是另一层信息。可选服务使用 `ctx.get(name)`，不能把未声明注入的 `ctx.<name>` 当成总能访问的属性。依据：DSH [Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-primer.md)与 [包规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/packages/AGENTS.md)。

### Service（服务）

**Service**是通过稳定的 Context key 提供能力的运行时对象，例如工具注册和执行服务、模型服务或会话服务。插件通过声明依赖消费服务，不应为了调用能力直接耦合某个具体 provider 的内部文件。

它不一定是网络微服务；一个同进程 registry 也可以是 Cordis Service。依据：DSH [Services 教程](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/03-services.md)。

### Loader（加载器）

**Loader**把配置中的插件条目解析、挂载并组成运行中的应用。它处理模块引用、entry identity、配置变化和插件生命周期。开发时说“走真实 Loader”，指让配置与模块经过真实加载路径，而不是在测试里手工拼出一个看起来相似的 Context。

Loader 不等于 TypeScript 编译器，也不保证用户行为已正确。路径能解析、插件能加载，仅建立加载这一项事实。依据：DSH [Composition 与 HMR 教程](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/06-composition-and-hmr.md)。

### inject（依赖声明）

**inject**声明插件运行前需要哪些服务，例如 `tools`。框架等待所需服务就绪后加载插件，所以加载顺序由依赖关系表达，不靠作者手工排列一串初始化调用。

它不是 npm dependencies 的替代品：npm dependencies 让模块能解析，inject 让运行时服务准备好。两种依赖都要验证。依据：DSH [首次插件指南的依赖声明](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/user/develop/basic/index.md#declare-dependencies)。

### PENDING（等待依赖）

**PENDING**是 Cordis 插件实例等待依赖的生命周期状态。配置中缺少提供必需服务的插件时，消费者可以一直等待，甚至没有输出；这不一定立即抛出错误，因为 provider 可能稍后加载。

因此，“没看到错误”不等于“插件已运行”。新仓 smoke 应确认插件实际激活并产生目标结果；排查不加载的问题时，先核对 inject 与 provider 是否齐全。依据：DSH [不加载插件的诊断](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/06-composition-and-hmr.md#diagnosing-a-plugin-that-never-loads)。

### Config（插件配置）

**Config**定义插件接受的配置数据与验证方式。部署方会改变的选择应通过配置表达，而不是藏在代码常量、默认分支或仅测试可调用的钩子里。

Config 不等于全部 `cordis.yml`：一个插件的 Config 只拥有该插件的选择；整个文件还包含模块名、entry id、disabled、group 等加载元数据。依据：DSH [配置教程](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/05-config.md)与 [根级开发规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/AGENTS.md)。

### effect 与 disposer

**Effect**在这里指生命周期可撤销的注册或资源管理，不是 UI 框架的 render effect。**Disposer**是撤销它的清理函数：移除监听、取消定时器、关闭连接、撤回工具注册等。`ctx.effect()` 可以取得资源并返回 disposer；`ctx.on()` 等框架 helper 会把注册与清理关联起来。

“用过 ctx”不代表随手创建的所有资源自动受控。自己创建的连接、timer 或后台工作必须有明确的清理 owner；插件卸载后不应留下仍运行的旧资源。依据：DSH [Lifecycle 与 effects 教程](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/02-lifecycle-and-effects.md)。

### HMR（热模块替换）

**HMR = Hot Module Replacement**。在 Cordis 插件开发中，它通过卸载旧实例、清理 effects、加载新代码并再次执行入口，替换正在运行的插件，通常无需重启整个应用。是否自动发生，取决于 HMR 插件、监听路径和所需的开发构建链是否实际配置并运行。

HMR 不等于浏览器刷新，也不意味着任意文件保存都能更新当前产品。源码插件、构建 bundle 与 GUI shell 的更新路径可能不同；先确认自己修改的是哪一层。**HMR-safety test**是卸载贡献实例并验证注册已移除的测试，不必真的启动文件 watcher 才能验证基本清理义务。依据：DSH [HMR 教程](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/06-composition-and-hmr.md#hot-module-replacement)与 [Testing policy](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/testing.md)。

### Event 与 Tool

**Event**是插件或服务间的通信点；不同 dispatch mode 决定监听器怎样观察、委派、串行或并行执行。**Tool**是模型可发现并调用的能力，有名称、描述、参数与结果，并经过真实工具执行管线。

事件监听器不是模型工具；把函数写出来也不等于模型已经能调用它。工具 schema、注册、执行、结果和日志必须一起核对。依据：DSH [事件教程](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/04-events.md)与 [接入 Harness 教程](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/07-into-the-harness.md)。

### Capability seam（可替换能力）

DSH 的 **capability seam**包含 Service Definition、Service Provider 与 Consumer 三种角色：定义能力词汇与接口、实现能力、消费能力。它指完整可替换能力，不是某一个包，也不泛指任意模块边界。

独立插件可能成为已有能力的 provider 或 consumer；不一定需要建立新 seam，也不必为了三种角色机械拆成三个包。依据：DSH [规范术语](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/glossary.md#capability-seam)。

## 二、怎样组合与分发

### composition（组合）

**Composition**是选定插件、provider、依赖与配置，让它们成为一个可运行整体。`cordis.yml`、bundle 和 profile 都参与不同层次的组合；单个插件源码不是完整应用。

“真实组合测试”不是测试所有插件的所有功能，而是按你的用户行为，让相关插件经过实际加载和执行路径。依据：DSH [Composition 教程](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/cordis-tutorial/06-composition-and-hmr.md)。

### bundle（配置分发包）

**Bundle**是带 `dsh.bundle` manifest 的 npm package，贡献一个配置层。该层的 patch 可以插入或覆盖插件行，引用随包交付的插件模块。

Bundle 不是运行中的 profile，也不只是把 JavaScript 打成一个文件的“bundler 输出”。普通 npm 包如果没有 bundle 声明，安装依赖并不自动激活其配置层。依据：DSH [两个概念、两个 manifest](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/user/develop/basic/publish.md#two-concepts-two-manifests)。

### profile（可启动组合）

**Profile**描述用户启动的 DSH 组合：使用哪些 bundles、按什么顺序叠加、最后如何应用用户 patch。Profile manifest 与 bundle manifest 拥有不同职责。

Profile 不等于一个插件，也不等于给某位 agent 的人格定义。修改用户的 profile 是部署组合操作，修改插件代码是实现操作。依据：DSH [发布指南](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/user/develop/basic/publish.md)。

### patch 与 overlay

**Patch**在本语境指修改插件配置树的数据，如插入或覆盖条目；**overlay**常指开发或部署时加在基础组合上的配置覆盖层。它们不是 Git patch，也不是直接修改宿主源码。

不要把 patch 文件所在目录当成全部模块引用的新工作目录。官方本地开发示例明确要求绝对插件路径，因为额外 patch 不改变 profile 的模块解析目录；bundle patch 的相对路径另有规则。依据：DSH [本地挂载指南](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/user/develop/basic/index.md#register-it-in-cordisyml)与 [bundle patch 规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/user/develop/basic/publish.md#the-bundle-manifest)。

### published artifact（发布产物）

**发布产物**是用户实际获取并运行的构建包、模块、配置与资源，而不是开发者的源码工作区。Built/packed smoke 要验证这个形态，以发现源码环境掩盖的依赖、解析和漏打包问题。

Source checkout 测试通过不证明安装包可用；peer dependency 范围也不是已经测试过的兼容范围。依据：DSH [真实入口测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/testing.md#test-the-real-entry-path)与 [插件打包指南](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/user/develop/basic/publish.md)。

## 三、怎样组织一次变更

### owner（归属与权威来源）

**Owner**在 DSH 文档中不是统一的人类职位。它可以指某类事实的权威维护位置、某个行为的拥有插件或服务，也可以指资源与测试场景的维护责任。关键问题是“谁拥有这个事实或行为，正确修改应该发生在哪里”。

例如插件 README 拥有当前使用义务，源码拥有实现，测试场景拥有输入和断言，Agent Note 拥有其他材料无法解释的持久取舍。这里的“一个事实一个家”不等于“一项功能一个文件”。人的项目负责人或本仓库用户也可能被称为 owner，必须看上下文，不能混为一类。依据：DSH [文档层级](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/AGENTS.md#the-tier-taxonomy-one-home-per-fact)与 [包的 owner 规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/packages/AGENTS.md)。

### Agent Note（决定记录）

**Agent Note**保存代码、测试和已有文档不能充分说明的持久决定理由，包括真实替代方案、为何未采用、代价与需要保留的验证。它服务未来维护者，不是每次变更都要填写的过程表。

`proposed` 表达待实现前评审的提案，`implemented` 描述已交付决定，`rejected` 保存仍有防错价值的否决，`archived` 是冻结历史。Implemented Note 不是当前 API 的唯一说明，proposed 目录也不是通用任务看板。依据：DSH [Agent Note 规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/notes/README.md)。

### 完整变更切片

本卷的**完整切片**是一次范围清楚的用户行为变更，同时携带受影响的实现、文档、配置消费者与证据。它是对 DSH 交付原则的归纳，不是官方产品对象。

“窄”指行为范围清楚，不指只准改一个文件；“完整”也不表示每次都要跑全部测试。依据：DSH [根级验证与文档规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/AGENTS.md)与 [聚焦证据 Skill](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/skills/dsh-pre-push-checks/SKILL.md)。

### contract（使用义务）

**Contract**是调用者、实现者或维护者依赖的前置条件、结果保证、失败行为、生命周期或兼容承诺。例如“所需服务就绪后加载”“卸载时撤销注册”“错误配置明确失败”。

它不是必须存在的一份 spec 文件，也不是任意模块形状的别名。插件 contract 通常分布在类型、JSDoc、README、源码与行为测试中。依据：DSH [文档规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/AGENTS.md)。

### Plan Mode（计划模式）

**Plan Mode**是可选的会话协作状态：为模型加入部署提供的计划引导，通过 `exit_plan_mode` 交给用户审阅完整计划。它回答本次准备怎样实施，可包含假设、影响面和验证安排。

Plan Mode 本身不禁止文件、进程或网络操作。计划认可不是扩大操作权限；权限由 sandbox 和 approval policy 独立执行。依据：DSH [Plan subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/subsystems/plan.md)。

### goal（会话目标）

**Goal**是绑定到既有 Session 的一个持久完成目标，可跨轮、恢复和重启保留。Goal 服务保存状态；何时续轮由其他 consumer/driver 决定，不是 goal 服务自己安排工作。

`complete` 是目标状态，不是独立完成认证。Goal 不是 feature 看板、并行目标数据库或任意需求的自动评估器。依据：DSH [规范词汇](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/glossary.md#goal)与 [goal 限制](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/packages/goal/goal/README.md#known-limitations-and-deferred-work)。

### sandbox 与 approval policy

**Sandbox**限制操作可产生的文件、进程等效果；**approval policy**决定哪些受限操作需要显式授权。它们管理可执行权限，不判断方案质量或用户行为是否达到需求。

不要因为用户批准 Plan 就认为所有文件、网络或进程操作都获准。依据：DSH [sandbox subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/subsystems/sandbox.md)与 [approval subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/subsystems/approval.md)。

## 四、怎样验证与判断完成

### real composition（真实组合）

**真实组合测试**让相关插件通过真实 Loader、配置和应用/进程入口运行，只 mock 外部服务或非确定性输入，再从模型请求、持久状态或用户可见结果断言行为。

它不是“完全不能 mock”，也不是只有单元测试全部通过就算集成。DSH 主仓对 product-visible 插件要求 non-unit real composition；独立仓借用的是这项验证原则，不自动得到主仓的测试基础设施。依据：DSH [真实入口政策](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/testing.md#test-the-real-entry-path)。

### snapshot（录制会话测试）

DSH 本卷谈的 **snapshot** 主要是 recorded-session scenario：提交的 Session JSONL 提供用户输入、模型回放与预期持久结果，相关界面还可以保留协议或渲染证据。**Replay**回放已有数据验证结果；**record/refresh**按指定方式更新录制资产。

它不是泛指任何截图，也不是仅让测试框架重新生成一个文本文件。非会话驱动的 UI 或 CLI expected output 由所属 app/package/script 维护。**Keyless**表示回放验证无需真实 API key，不表示首次录制或真实模型能力测试都无需 key。依据：DSH [Testing tiers](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/testing.md#tiers)与 [录制场景规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/snapshots/AGENTS.md)。

### oracle（独立预期）

**Oracle**是测试判定结果的依据，例如应出现的文件内容、外部命令结果或已审阅的 expected tree。这是通用测试词，不是 DSH 新服务名。

“独立”指不能让被测输出的更新动作顺便改掉判断标准。DSH 的 workspace 变更场景重新读取实际工作区并比较 `workspace.expected/`；record/refresh 不改写该目录。模型自报“我写好了”不是文件已正确写出的证据。依据：DSH [外部世界断言](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/testing.md#verify-the-world-not-the-self-report)与 [snapshot owner 规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/snapshots/AGENTS.md)。

### e2e 与 smoke

**E2e（end-to-end）**从支持的外部入口走到可观察结果，验证跨越相关组成部分的行为。DSH 的 **real-API e2e**还使用真实 provider API，与只替换模型边界的 keyless 回放不同。

**Smoke**是范围较小但路径真实的冒烟检查，例如安装后通过支持的 profile 完成一个可观察任务。Smoke 不等于完整覆盖；没有 key 而 self-skip 的测试也不能报成已验证真实模型。依据：DSH [Testing policy](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/testing.md)。

### invariant（运行时不变量）

**Invariant**检查同一 owner 管理的关系中，可能发生偏离的独立观察是否仍一致。只有存在真实可分叉关系时，DSH 包才应发布 `./invariant`。

“服务存在”“插件 metadata 正确”或固定示例检查不能替代关系验证，不应该为了形式添加空 invariant。它也不是每个插件都必须加的文件。依据：DSH [包 invariant 规则](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/packages/AGENTS.md)。

### gate 与 CI

**Gate**是能执行、违反规则时非零退出的检查；**CI**是自动触发、在规定环境运行这些检查并汇总结果的持续集成流程。测试、构建、格式与依赖一致性都可以进入对应检查。

Gate 是判断逻辑，CI 还拥有何时、在哪运行。绿灯只证明已执行的检查通过，不证明任意自然语言需求都满足。独立仓须选择自己的检查，不会自动继承 DSH 主仓的矩阵。依据：DSH [开发与 CI 文档](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/development.md)。

### semantic review（语义评审）

**语义评审**把意图、实现、当前文档、持久理由和测试证据对齐，判断它们是否真的说明了同一个用户结果。它需要追踪真实入口、失败路径、生命周期与未覆盖的声称，可由具备上下文的人或 agent 完成。

它不是再跑一次 linter，也不能仅凭“CI 全绿”下结论。依据：DSH [code review Skill](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.agents/skills/dsh-code-review/SKILL.md)。

### approval（批准）

**批准**有不同语境：PR review/approval 规则决定当前变更是否满足合并资格；用户操作授权决定受限动作能否执行；Plan review 决定是否接受实施方案。

三者不能混用。DSH 主仓的 weighted approval 是 PR 门槛，不是插件质量评分或权限系统；独立插件仓可以选择自己的 review 规则。依据：DSH [review ownership](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/.github/review-ownership/README.md)与 [approval subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/subsystems/approval.md)。

### merge 与 release

**Merge**把变更并入目标分支；**release**产生用户可取得的版本和发布产物。合并后仍可能没有构建、打包、发布或安装验证。

因此 merge 不等于 release，源码在主分支也不等于用户安装的产物已更新。独立插件仓对自己的版本、构建产物和兼容承诺负责。依据：DSH [发布流程参考](../sdlc-reference/11-release.md)。

## 继续阅读

- [开发模型总览](./00-index.md)：把这些词放回完整开发闭环。
- [新仓起步](./01-new-plugin-repository.md)：从最小插件到真实组合与安装验证。
- DSH [规范 glossary](https://github.com/deepseek-ai/deepseek-harness/blob/580646c14fb998532a6ef19bb4cc4009cd74b786/docs/glossary.md)：进一步了解 scope、turn、step、goal round 等规范术语；本页不维护第二份 API 词典。
