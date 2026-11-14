# 02 · DSH 插件核心心智模型与防误判词典

## 怎样使用本页

本页不是按字母排序的枯燥 API 手册，而是面向插件架构师与 coding agent 的**防误判概念锚点库**：每个词条用三句话讲透**“它到底是什么 → 写插件时在什么场景撞上它 → Agent 最容易犯什么代码级误判及一行自检法”**。

首次进入 DSH 插件生态时，建议按 **一（运行时原语）→ 二（组合与分发）→ 三（变更与控制边界）→ 四（测试证据与验收）** 的顺序扫读一遍；需要精确方法签名时直接跳往词条末尾链接的一手文档。

## 快速查词索引

| 你正在判断的具体工程问题 | 直达词条 |
|---|---|
| 插件到底长什么样，挂载在哪里？ | [DSH 与 Cordis](#dsh-与-cordis)、[Plugin 与 apply(ctx)](#plugin-与-applyctx)、[Context（ctx）](#contextctx)、[Service（服务）](#service服务) |
| 配置文件怎样变成活插件，为什么没报错却没生效？ | [Loader（加载器）](#loader加载器)、[inject（依赖声明）](#inject依赖声明)、[PENDING（等待依赖）](#pending等待依赖)、[Config（插件配置）](#config插件配置) |
| 热重载和卸载怎样回卷资源，怎样算完整能力接缝？ | [effect 与 disposer](#effect-与-disposer)、[HMR（热模块替换）](#hmr热模块替换)、[Event 与 Tool](#event-与-tool)、[Capability seam](#capability-seam可替换能力) |
| `bundle`、`profile`、`preset` 和 `patch` 到底谁管哪一层？ | [composition（组合）](#composition组合)、[bundle（配置分发包）](#bundle配置分发包)、[profile 与 preset](#profile-与-preset进程入口-vs-会话能力)、[patch 与 overlay](#patch-与-overlay)、[发布产物](#published-artifact发布产物) |
| 改功能时谁是 owner，`Plan`、`Goal` 与权限沙箱什么关系？ | [owner](#owner归属与权威来源)、[Agent Note](#agent-note决定记录)、[完整变更切片](#完整变更切片)、[contract](#contract使用义务)、[Plan Mode](#plan-mode计划模式)、[goal](#goal会话目标)、[sandbox 与 approval](#sandbox-与-approval-policy) |
| 怎样证明插件真能工作，而不是自欺欺人的假绿测试？ | [real composition](#real-composition真实组合)、[snapshot](#snapshot录制会话测试)、[oracle](#oracle独立预期)、[e2e 与 smoke](#e2e-与-smoke)、[gate 与 CI](#gate-与-ci)、[semantic review](#semantic-review语义评审)、[approval](#approval批准)、[merge 与 release](#merge-与-release) |

## 一、插件怎样运行

### DSH 与 Cordis

**DSH（DeepSeek Harness）** 是将模型调用、工具管线、持久会话日志、安全沙箱与多端交互界面全部以插件形态组装起来的 Agent Harness；**Cordis** 则是其底层的依赖注入、类型事件与 Fiber 生命周期框架。写 DSH 插件同时受两层约束：用 Cordis 管理加载与资源回卷，按 DSH 服务契约接入模型与会话。
- **Agent 高频误判与自检**：把 DSH 当成一段系统提示词模板，或绕过 `ctx` 直接手调底层模块内部文件；自检：检查 `import` 是否只指向 `@deepseek-ai/cordis` 与公开的 `@deepseek-ai/dsh-*` 包名。依据：DSH [Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md)。

### Plugin 与 apply(ctx)

**Plugin（插件）** 是挂载后向当前 `Context` 注册工具、监听事件或暴露服务的模块；函数式插件的 `apply(ctx, config)` 在**插件激活时执行一次**（而非模型每轮对话调用一次）。DSH 严格区分两种互斥导出形式：函数式插件具名导出 `name`、`inject`、`Config`、`apply`（严禁加 `export default`）；Service 插件通过 `export default class ... extends Service` 暴露新服务。
- **Agent 高频误判与自检**：在函数式插件末尾画蛇添足写 `export default apply`，导致 `Loader.unwrapExports` 只取 `.default` 而丢掉具名 `inject` 与 `Config`（真实事故见 [`0001-acp-default-export-drops-inject`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md)，双形态样板见 [新仓起步 §2](./01-new-plugin-repository.md#2-建立最小可加载插件)）；自检：单测首行断言 `expect('default' in myFunctionPlugin).toBe(false)`。依据：DSH [包规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/AGENTS.md)与 [首次插件指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md)。

### Context（ctx）

**Context（`ctx`）** 是运行时服务索引、事件总线与生命周期作用域句柄（如 `ctx.tools`、`ctx.sessions`，或限定在单个 Agent 会话上的 `agent.ctx`），**绝不是送给大语言模型的对话上下文窗口（Prompt Context）**。
- **Agent 高频误判与自检**：未在 `inject` 中声明某服务就直接读 `ctx.foo`（当该服务为可选时）；自检：必需依赖写进 `inject` 后读 `ctx.foo`，可选依赖一律显式调用 `ctx.get('foo')` 并处理 `undefined`。依据：DSH [Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md)与 [包规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/AGENTS.md)。

### Service（服务）

**Service** 是占据稳定 `ctx.<key>` 槽位的同进程运行时能力对象（如 `ctx.tools` 工具注册与执行管道、`ctx.llm` 模型流式网关）。插件通过服务键解耦调用方与具体实现，无需关心背后挂的是本地实现还是远端实现。
- **Agent 高频误判与自检**：把运行态可变缓存写在模块顶层 `const cache = new Map()` 而不是收进 Service 实例字段；自检：搜索插件源码顶层是否存在非冻结的可变集合或 `let` 状态。依据：DSH [Services 教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/03-services.md)。

### Loader（加载器）

**Loader** 负责解析 `cordis.yml` / 补丁层中的条目、加载模块、管理条目身份（`id`）、应用配置变更并驱动插件 Fiber 的启停。所谓“走真实 Loader 测试”，就是让 YAML 配置经过真实 `Loader` + `Include` 解析挂载，而非在测试里手工 `new Context()` 后直调 `ctx.plugin(fn)`。
- **Agent 高频误判与自检**：以为 `tsc` 编译通过且手工 `ctx.plugin` 单测变绿就证明插件可被宿主加载；自检：至少有一条测试经 `context.loader.create({ name: 'cordis:include', ... })` 启动插件。依据：DSH [Composition 与 HMR 教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md)。

### inject（依赖声明）

**`inject`** 声明插件激活前必须就绪的 Cordis 服务键名数组（如 `export const inject = ['tools', 'sessions']`）。它只控制运行时激活条件与顺序，**既不自动安装 npm 包，也不替宿主实例化缺失的 Provider**。
- **Agent 高频误判与自检**：改代码新增了 `ctx.llm` 调用，却漏往 `inject` 数组追加 `'llm'`，导致启动竞态偶发空指针；自检：逐一核对 `apply` 体内访问的所有 `ctx.<service>` 键是否 100% 出现在 `inject` 中。依据：DSH [依赖声明指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md#declare-dependencies)。

### PENDING（等待依赖）

**`PENDING`** 是插件 Fiber 等待 `inject` 所需服务上线时的合法挂起态。当配置树里漏挂上游服务提供方时，消费方插件不会抛异常崩溃，而是安静停在 `PENDING`（因为框架允许上游稍后动态挂载）。
- **Agent 高频误判与自检**：看到进程启动零报错就以为插件已经跑起来了；标准三步排障顺序是：先跑 `dsh --profile <name> --dump-config` 核对合成配置行 → 再看启动 stderr 的 `did not activate`、`skippedBundles` 与 `PENDING` 点名 → 最后查 `$DSH_HOME/profiles/<name>/.plugin-manager/logs/` 安装日志。依据：DSH [不加载插件诊断](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md#diagnosing-a-plugin-that-never-loads)与 [启动诊断](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md#profiles)。

### Config（插件配置）

**`Config`** 是插件用 `@deepseek-ai/schemastery` 定义并校验的专属配置对象。DSH 配置按五层顺序叠加，越靠后优先级越高：**`Config` Schema 默认值 → Bundle patch → Profile patch（`cordis.patch.yml`）→ Home patch → 命令行 `--patch`**。只有显式标记了 `Config.volatile()` 的字段才会出现在图形设置页表单中（修改后落入当前 profile patch）。
- **Agent 高频误判与自检**：把需要用户在设置界面实时修改的字段写成普通非 `volatile` 字段，或把 YAML 动态求值标签 `!!js` 误写成单感叹号 `!js`（详见 [`04` §4](./04-plugin-repo-topologies.md)）。依据：DSH [设置服务](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/settings.md)、[添加设置卡](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-settings-card.md) 与 [加载顺序](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md#the-loading-order)。

### effect 与 disposer

**Effect** 是绑定在插件 Fiber 上的受管副作用，**Disposer** 是卸载该副作用的清理函数。`ctx.on()`、`ctx.tools.register()` 等框架方法自带回卷；插件自己启动的定时器、子进程、WebSocket 或临时文件句柄则必须包进 `ctx.effect(() => { ...; return () => cleanup() })`。
- **Agent 高频误判与自检**：在 `disposer` 里只发了 `abort()` 信号却没有 `await` 在途异步写入排空，导致底层连接在消费者写完前提前关闭（完整的 Quiescent Disposal 模式见 [`05` §4](./05-cordis-contracts-and-model-experience.md)）。依据：DSH [Lifecycle 与 effects 教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/02-lifecycle-and-effects.md)。

### HMR（热模块替换）

**HMR（Hot Module Replacement）** 在 Cordis 中指卸载旧插件 Fiber（执行全部 disposer）、重新加载新代码并再次执行 `apply(ctx)`，无需重启整个宿主进程。测试套件中的 **HMR-safety test** 不必真起文件监听器，只需调用 `await targetFiber.dispose()` 并断言注册表零残留、重新挂载不报重复注册错误即可。依据：DSH [HMR 教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md#hot-module-replacement)与 [Testing policy](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)。

### Event 与 Tool

**Event** 是进程内插件与服务间的类型化通知或拦截管道（分 `emit`、`waterfall`、`parallel`、`serial`、`bail` 五种模式）；**Tool** 是暴露给大语言模型按需调用的外部动作接口（经 `defineTool` 定义并走 `ctx.tools` 管线执行）。工具的 `description` 与参数描述直接进入模型请求前缀，而包 `README.md` 和源码 JSDoc 只留在仓库给开发者看。
- **Agent 高频误判与自检**：在 `waterfall` 监听器里做完观察或注解后忘记 `return next()`，把下游所有监听器静默截断（详见 [`05` §3](./05-cordis-contracts-and-model-experience.md)）。依据：DSH [事件教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/04-events.md)与 [添加工具食谱](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md#the-minimal-shape)。

### Capability seam（可替换能力）

**Capability seam** 是由 **Service Definition（纯契约与类型）+ Service Provider（底层实现）+ Consumer（面向接口调用的消费方）** 三角色共同构成的完整可替换能力边界。大多数独立插件只是既有 Seam（如 `dsh-tools`、`dsh-llm`）的 Consumer 或新 Provider，无需动辄新建三包结构；何时才需要拆成多包 Seam 见 [`04` §3](./04-plugin-repo-topologies.md)。依据：DSH [规范术语](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/glossary.md#capability-seam)。

## 二、怎样组合与分发

### composition（组合）

**Composition** 是把选定的核心服务、Provider 与扩展插件连同各自配置组装成一个可运行整体的过程。单个插件文件无法脱离上游服务独自成军；所谓真实组合验证，就是按真实业务链路把最小必需的上游服务与你的插件一起交给 `Loader` 启动测试。依据：DSH [Composition 教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md)。

### bundle（配置分发包）

**Bundle** 是在 `package.json` 中声明了 `dsh.bundle` 字段、自带一份 YAML 配置补丁层的 npm 包（不代表用打包器把所有依赖揉成单文件）。用户执行 `dsh plugin add` 安装 Bundle 时，宿主不仅安装 npm 依赖，还会把它的配置补丁层自动叠进目标 Profile；没有声明 `dsh.bundle` 的普通插件包安装后不会自动激活任何行。依据：DSH [两个概念、两个 manifest](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md#two-concepts-two-manifests)。

### profile 与 preset（进程入口 vs 会话能力）

插件作者最容易混淆这三个以 B/P 开头的组合词——尤其是 **`Profile` 与 `Preset` 根本不在同一个粒度上**：

- **Profile（进程级启动环境）**：声明 `dsh.profile`，决定用户执行 `dsh --profile <name>` 启动整个 Node 宿主进程时按什么顺序叠加哪些 Bundles（例如内置的 `web`、`headless`、`sdk`、`acp`）。任何包都不能既是 Bundle 又是 Profile。
- **Preset（单会话 Agent 能力预设）**：运行在一个已启动进程内部，利用 `Agent.ctx`（会话级作用域上下文）决定**某一个具体 Session 的 Agent** 挂载哪些工具集、系统提示词片段与技能目录（而不会污染同一宿主进程里的相邻会话）；官方发布的预设由对应的 Bundle 携带。
- **Agent 高频误判与自检**：只想给特定类型的子代理或某类会话增减工具，却去改进程级的 Profile 配置；自检：改整机启动装什么看 `Profile`/`Bundle`，改单个会话 Agent 拿什么能力看 `Preset` 与 `agent.ctx`。依据：DSH [发布指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)、[agent preset 说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/README.md) 与 [`dsh-agent` 作用域说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent/README.md)。

### patch 与 overlay

**Patch / Overlay** 指叠加在基础配置树之上的插件增删改指令（如 `insert` 插入新行，或按相同 `id` 覆盖已有行）。必须死记两条硬语义：第一，**按相同 `id` 覆盖已有插件行时，替换的是该行的整个 `config` 对象而非深合并**——原配置里仍需保留的字段必须显式一并写出；第二，通过 `--patch` 传入外部覆盖文件时，宿主模块解析基准目录保持不变，本地未安装的开发插件在外部 patch 中应使用绝对路径。依据：DSH [加载顺序与覆盖](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md#the-loading-order)与 [本地挂载指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md#register-it-in-cordisyml)。

### published artifact（发布产物）

**发布产物** 是经 `pnpm pack` 或发版流水线打出的真实交付包（仅含 `files` 白名单内的编译后 `lib/`、类型声明、补丁 YAML 与静态资源），而非开发机上装满 `devDependencies` 和源码的仓库目录。源码测试全绿绝不证明发布产物闭合。依据：DSH [真实入口测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#test-the-real-entry-path)。

## 三、怎样组织一次变更

### owner（归属与权威来源）

**Owner** 在本体系中首先指**某类事实在仓库里的唯一权威文件，或某项运行时状态/资源的唯一管理实例**（只有在谈项目职责时才指人类维护者）。找到 owner 意味着直接去源头修改并更新引用方，绝不在第二个文件手抄副本。依据：DSH [文档层级表](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md#the-tier-taxonomy-one-home-per-fact)与 [包级归属规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/AGENTS.md)。

### Agent Note（决定记录）

**Agent Note（或插件仓自建的轻量 ADR）** 专门记录代码、类型和模块 `README.md` 无法自明的持久取舍、被拒备选方案与代价；机械重构与局部小修免写。通用模板与长周期取代/归档法则见 [卷一第 10 章](../01-general-repo-harness/10-agent-ready-repo-blueprint.md) 与 [第 11 章](../01-general-repo-harness/11-spec-drift-and-decision-metabolism.md)。依据：DSH [Agent Note 规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md)。

### 完整变更切片

**完整变更切片** 指围绕一个清晰的用户可观察结果，把实现源码、导出类型、`README.md`（含 `Model Experience`）、配置补丁与回归证据放在同一个提交/PR 里一次性闭环交付，不留半拉子工程。依据：DSH [根级开发规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md)。

### contract（使用义务）

**Contract（契约）** 是调用方、实现方或宿主共同依赖的前置条件、后置结果、错误码、卸载清理保证与持久化兼容性承诺，分散承载于 TypeScript 签名、JSDoc、`README.md` 与测试断言中（写文档和注释时切忌把普通返回字段含糊地泛称为“contract”）。依据：DSH [文档标准](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md)。

### Plan Mode（计划模式）

**Plan Mode** 是供会话代理先拟定实施计划并通过 `exit_plan_mode` 交人类确认的软协作状态。**批准 Plan 绝不授予任何文件系统写权限或免除高危动作审批**——硬边界始终由下方的 Sandbox 与 Approval 服务独立把守。依据：DSH [Plan 子系统](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/plan.md)。

### goal（会话目标）

**Goal** 是绑定在单个 Session 上的跨轮持久目标状态（含 `active`、`paused`、`blocked`、`complete` 四种相位；续轮调度由独立的 driver 消费执行）。再次强调：**模型自己把 Goal 标为 `complete` 只是更新了一条会话状态，绝不构成代码已通过验证的客观证据**。依据：DSH [规范词汇](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/glossary.md#goal)与 [`dsh-goal` 说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal/README.md)。

### sandbox 与 approval policy

**Sandbox mode** 仅约束文件系统副作用范围（不自动拦截网络或进程可见性）；**Approval policy** 仅裁决业务代码显式送入 `ctx.approval.request()` 的具体高危动作（仅当返回 `allowed-once` 时才放行当次操作，`never` 策略直接返回 `rejected`）。如果你的插件自身执行高危外部写操作或命令，必须主动接入宿主沙箱或审批服务，框架不会凭空替未接入的裸 Node 调用加锁。依据：DSH [Sandbox 子系统](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/sandbox.md)与 [Approval 子系统](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/approval.md)。

## 四、怎样验证与判断完成

### real composition（真实组合）

**真实组合测试** 通过真实 `Loader` 读取配置挂载插件及其依赖服务，只对最外层的网络模型 API 或非确定性时钟做替身（如脚本化 `LlmAdapter`），从真实的模型请求载荷、会话事件或落盘文件断言结果。依据：DSH [真实入口测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#test-the-real-entry-path)。

### snapshot（录制会话测试）

在本语境下，**snapshot** 特指 **keyless recorded-session（无 Key 会话回放测试）**：用确定性的模型响应流驱动完整会话管线，锁死插件对系统提示词、工具 Schema、工具返回渲染和持久化事件的影响，在没有线上 `DEEPSEEK_API_KEY` 的常规 CI 中也能 100% 复现验证（独立插件仓的轻量无 Key 回放实现见 [`06` §3](./06-plugin-gate-and-ci-harness.md)）。依据：DSH [快照测试要求](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#when-a-snapshot-test-is-required)与 [`snapshots/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md)。

### oracle（独立预期）

**Oracle（独立预期基准）** 是独立于被测代码之外的正确答案真源（例如人工审定并只读保护的 `workspace.expected/` 目录树）。刷新录制快照时绝不能让脚本顺手覆盖 `workspace.expected/`，否则测试就退化成了“拿今天刚跑出来的错误输出当标准答案”。依据：DSH [外部世界验证](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#verify-the-world-not-the-self-report)。

### e2e 与 smoke

**Smoke（冒烟）** 用最小真实路径验证打包安装与启动激活未断链；**real-API e2e** 则连上真实线上模型检验工具描述是否真能被大模型正确理解并调用。无 API Key 时自动跳过的 `test:e2e` 必须在交付报告中如实注记为“已跳过”，严禁混报为已验证通过。依据：DSH [Testing policy](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)。

### gate 与 CI

**Gate（门禁）** 是本地即可秒级运行、违规即非零退出并打印修复坐标的确定性脚本（如插件仓的 `scripts/verify-plugin.mjs`）；**CI** 则是在干净隔离容器中自动执行构建、门禁、测试与 tarball 安装预演的远端流水线。依据：DSH [开发与 CI 指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md)。

### semantic review（语义评审）

**语义评审** 由具备上下文的人类（辅以专门审查 Skill）聚焦核查机器门禁够不着的部分：需求意图是否跑偏、异步卸载是否存在竞态、错误提示是否对用户可行动、破坏性变更是否交代了迁移路径。依据：DSH [`dsh-code-review`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-code-review/SKILL.md)。

### approval（批准）

区分三种完全不同层面的 **approval**：代码仓库的 PR 合并审批、会话中的 `Plan Mode` 方案确认，以及运行时的 `ctx.approval.request()` 敏感动作放行——三者互不替代。依据：DSH [评审归属说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/review-ownership/README.md)与 [Approval 子系统](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/approval.md)。

### merge 与 release

**Merge（合并主干）≠ Release（正式发版）**。代码合入默认分支只更新了源码树；只有经过版本升级、完整构建打包、产物校验与显式发布后，外部用户的 `dsh plugin add` 才会拿到新版本。依据：DSH [发布流程参考](../03-dsh-sdlc-reference/11-release-sequences-and-publish-lanes.md)。

## 继续深入

- [`03-context-and-drift.md`](./03-context-and-drift.md)：深入 DSH 会话日志投影、Compaction 遮蔽与插件跨恢复状态存活规律。
- [`04-plugin-repo-topologies.md`](./04-plugin-repo-topologies.md) 与 [`05-cordis-contracts-and-model-experience.md`](./05-cordis-contracts-and-model-experience.md)：插件仓拓扑选型与六条 Cordis 代码级防坑铁律。
- DSH [`docs/glossary.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/glossary.md)：查询 `Turn`、`Step`、`Goal round`、`Scope` 等宿主规范定义。
