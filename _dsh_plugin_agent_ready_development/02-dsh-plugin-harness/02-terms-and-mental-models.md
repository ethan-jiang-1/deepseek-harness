# 02 · DSH 插件核心心智模型与防误判词典

## 怎样使用本页

本页不是按字母排序的泛泛名词表，而是专门面向**独立 DSH 插件架构师与主力 Coding Agent** 的**防误判概念锚点库**：每个词条用三句话讲透**“它在 DSH 里到底是什么 → 写插件时在什么场景撞上它 → Agent 最容易犯什么代码级误判及一行自检法”**。

首次进入 DSH 插件生态时，建议按 **一（运行时与双树原语）→ 二（能力与全栈扩展词对）→ 三（组合、配置与分发）→ 四（插件安全与测试真伪边界）** 的顺序扫读一遍；通用的仓库级 `owner`、决策记录 ADR 与语义评审定义由 [卷一](../01-general-repo-harness/00-index.md) 与 [卷三](../03-dsh-sdlc-reference/00-index.md) 拥有，本页不再重复抄写。

## 快速查词索引

| 你正在判断的具体插件工程问题 | 直达词条 |
|---|---|
| 插件长什么样？根 `ctx` 与会话级 `agent.ctx` 差在哪？ | [DSH 与 Cordis](#dsh-与-cordis)、[Plugin 与 apply(ctx)](#plugin-与-applyctx)、[根 Context vs 会话 agent.ctx](#根-context-vs-会话-agentctx)、[Service（服务）](#service服务) |
| 为什么配置写了插件却静默没生效？卸载和热重载怎样回卷？ | [Loader（加载器）](#loader加载器)、[inject（依赖声明）](#inject依赖声明)、[PENDING（等待依赖）](#pending等待依赖)、[effect 与 disposer](#effect-与-disposer)、[HMR（热模块替换）](#hmr热模块替换) |
| 该写 `Tool`、`/Command` 还是 `Skill`？Web 卡片和跨端通信怎么选？ | [Tool vs Command vs Skill](#tool-vs-command-vs-skill)、[Event 五种分发模式](#event-五种分发模式)、[CLI presentResult vs Web presentationMeta](#cli-presentresult-vs-web-presentationmeta)、[Slot 与 Typert @Remote](#slot-与-typert-remote)、[Capability seam](#capability-seam可替换能力) |
| `Bundle`、`Profile`、`Preset`、`Volatile<T>` 和 `patch` 到底谁管哪一层？ | [bundle（配置分发包）](#bundle配置分发包)、[profile 与 preset](#profile-与-preset进程入口-vs-会话能力)、[Config 与 Volatile](#config-与-volatile)、[patch 与 overlay](#patch-与-overlay)、[published artifact（发布产物）](#published-artifact发布产物) |
| `Plan`、`Goal` 与权限沙箱什么关系？怎样证明插件不是“假绿”？ | [Plan Mode vs Sandbox / Approval](#plan-mode-vs-sandbox--approval)、[goal（会话目标）](#goal会话目标)、[real composition（真实组合）](#real-composition真实组合)、[keyless replay 与 oracle](#keyless-replay-与-oracle) |

## 一、运行时与生命周期原语

### DSH 与 Cordis

**DSH（DeepSeek Harness）** 是将模型调用、工具管线、持久会话日志、安全沙箱与多端交互界面全部以插件形态组装起来的 Agent Harness；**Cordis** 则是其底层的依赖注入、类型事件与 Fiber 生命周期框架（注意：Web 端拥有两棵独立的 Cordis 树——Node 侧 Host 树与浏览器侧 Client 树）。
- **Agent 高频误判与自检**：把 DSH 当成一段系统提示词模板，或深掏其他包的未导出内部文件；自检：检查 `import` 是否只指向 `@deepseek-ai/cordis` 与公开的 `@deepseek-ai/dsh-*` 包入口。依据：DSH [Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md)。

### Plugin 与 apply(ctx)

**Plugin（插件）** 是挂载后向当前 `Context` 注册工具、监听事件或暴露服务的模块；函数式插件的 `apply(ctx, config)` 在**插件激活时执行一次**（而非模型每轮对话调用一次）。DSH 严格区分两种互斥导出形式：函数式插件具名导出 `name`、`inject`、`Config`、`apply`（**严禁加 `export default`**）；Service 插件通过 `export default class ... extends Service` 暴露新服务。
- **Agent 高频误判与自检**：在函数式插件末尾多写一句 `export default apply`，导致真实 `Loader.unwrapExports` 只取 `.default` 裸函数而静默丢掉具名 `inject` 与 `Config`（真实事故见 [`0001-acp-default-export-drops-inject`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md)）；自检：单测首行断言 `expect('default' in myFunctionPlugin).toBe(false)`。依据：DSH [包规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/AGENTS.md)。

### 根 Context vs 会话 agent.ctx

**`Context`（`ctx`）** 是运行时服务索引、事件总线与生命周期作用域句柄，**绝不是发给大模型的聊天提示词窗口**。在宿主进程中必须分清两层粒度：顶层插件 `apply(ctx)` 拿到的是**进程级宿主 `ctx`**（注册项对全进程生效）；而每个活会话的 `Agent` 实例拥有派生自根上下文的子作用域 **`agent.ctx`**（在该作用域注册或收窄的工具、提示词与技能仅对该单个会话生效，随 `AgentHandle.dispose()` 自动卸载）。
- **Agent 高频误判与自检**：未在 `inject` 中声明可选服务就直接读 `ctx.foo`，或把单会话临时工具挂到全局 `ctx.tools` 污染其他并发会话；自检：必需依赖进 `inject`，可选依赖一律走 `ctx.get('foo')`；单会话专属能力挂在 `agent.ctx` 或 `Preset` 上。依据：DSH [`dsh-agent` 作用域说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent/README.md)。

### Service（服务）

**Service** 是占据稳定 `ctx.<key>` 槽位的同进程运行时能力对象（如 `ctx.tools`、`ctx.fs`、`ctx.llm`，全量现成服务货架见 [`07` §1](./07-extension-recipes-and-host-services.md#1-先查货架再写代码dsh-官方可注入宿主服务速查表)）。插件通过服务键解耦调用方与具体实现。
- **Agent 高频误判与自检**：把运行态可变缓存写在模块顶层 `const cache = new Map()` 而不是收进 Service 实例字段；自检：搜索插件源码顶层是否存在非冻结的可变集合、`let` 或 `globalThis` 状态。依据：DSH [Services 教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/03-services.md)。

### Loader（加载器）

**Loader** 负责解析 `cordis.yml` / 补丁层中的条目、加载模块、管理条目身份（`id`）、应用配置变更并驱动插件 Fiber 启停。所谓“走真实 Loader 测试”，就是让 YAML 配置经过真实 `Loader` + `Include` 解析挂载，而非在测试里手工 `new Context()` 后直调 `ctx.plugin(fn)`。
- **Agent 高频误判与自检**：以为 `tsc` 编译通过且手工 `ctx.plugin` 单测变绿就证明插件可被宿主加载；自检：至少保留一条经 `context.loader.create({ name: 'cordis:include', ... })` 启动并断言 `FiberState.ACTIVE` 的测试。依据：DSH [Composition 与 HMR 教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md)。

### inject（依赖声明）

**`inject`** 声明插件激活前必须就绪的 Cordis 服务键名数组（如 `export const inject = ['tools', 'fs']`）。它只控制运行时激活条件与顺序，**既不自动安装 npm 包，也不替宿主实例化缺失的 Provider**。
- **Agent 高频误判与自检**：改代码新增了 `ctx.workingDirectory` 调用，却漏往 `inject` 数组追加 `'workingDirectory'`，导致启动顺序竞态空指针；自检：逐一核对 `apply` 体内点号访问的所有 `ctx.<service>` 键是否 100% 出现在 `inject` 中。依据：DSH [依赖声明指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md#declare-dependencies)。

### PENDING（等待依赖）

**`PENDING`** 是插件 Fiber 等待 `inject` 所需服务上线时的合法挂起态。当配置树里漏挂上游服务提供方时，消费方插件不会抛异常崩溃，而是安静停在 `PENDING`。
- **Agent 高频误判与自检**：看到进程启动零报错就以为插件已经生效；标准三步排障见 [`08 · 插件排障与复盘`](./08-troubleshooting-and-postmortems.md)（先跑 `--dump-config` → 再看启动 stderr 的 `did not activate` / `PENDING` → 查 `.plugin-manager/logs/`）。依据：DSH [不加载插件诊断](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md#diagnosing-a-plugin-that-never-loads)。

### effect 与 disposer

**Effect** 是绑定在插件 Fiber 上的受管副作用，**Disposer** 是卸载该副作用的清理函数。`ctx.on()`、`ctx.tools.register()` 等框架方法自带回卷；插件自建的定时器、子进程或网络连接必须包进 `ctx.effect()`，并在卸载时先关准入闸门、等待在途异步写入排空后再释放底层资源（完整 Quiescent Disposal 生成器模式见 [`05` §4](./05-cordis-contracts-and-model-experience.md)）。依据：DSH [Lifecycle 与 effects 教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/02-lifecycle-and-effects.md)。

### HMR（热模块替换）

**HMR** 在 Cordis 中指卸载旧插件 Fiber（执行全部 disposer）、重新加载新产物并再次执行 `apply(ctx)`，无需重启整个宿主进程。测试套件中的 **HMR-safety test** 只需调用 `await targetFiber.dispose()`，断言在途调用安全收尾、注册表零残留且再次挂载不报重复注册冲突。依据：DSH [HMR 教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md#hot-module-replacement)。

## 二、能力扩展与全栈高频混淆词对

### Tool vs Command vs Skill

写扩展前必须分清这三种触发主体截然不同的机制：**Tool**（`ctx.tools.register`）是暴露给**大模型**自主决定调用的动作接口，Schema 每轮占用提示词前缀，执行结果写入会话历史（并自动可供 PTC `await tools.<name>(args)` 编程调用）；**Command**（`ctx.commands.register`）是暴露给**人类用户**在输入框敲 `/name` 直接执行的确定性动作，不创建模型消息、零推理延迟；**Skill**（`ctx.skills`）则是常驻上下文只放名称与短摘要、由模型按需调用 `skill` 工具才把完整操作指南加载进可见面的渐进披露指令集。
- **Agent 高频误判与自检**：把纯确定性状态开关写成 `Tool` 白烧模型轮次，或把几千字冷门指南硬塞进常驻系统提示词；自检：人直接点名执行用 `Command`，模型按需执行外部 I/O 用 `Tool`，长篇情景化 SOP 用 `Skill`。依据：DSH [扩展食谱](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/extension-cookbook.md)与 [Human Commands](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/commands.md)。

### Event 五种分发模式

**Event** 是进程内插件与服务间的类型化通知或拦截管道，严格区分 `emit`（同步广播）、`parallel`（并发等待）、`serial`（串行等待）、`bail`（首个非空裁决即停）和 **`waterfall`**（洋葱圈包装）。
- **Agent 高频误判与自检**：在 `tools/pre-execute` 等 `waterfall` 监听器里做完检查后漏写 `return next()`，把下游所有官方插件静默截断；自检：凡监听 `waterfall` 事件，放行分支末尾必有 `return next()`。依据：DSH [事件教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/04-events.md)。

### CLI presentResult vs Web presentationMeta

工具的**模型可见返回**由 `output.render(args, value)` 决定，而**界面卡片渲染**分两条独立轨道：`defineTool` 上的 `presentCall` / `presentResult` 是供 CLI 与通用适配器消费的纯函数渲染意图；**内置 Web Client 完全不调用 `presentCall`/`presentResult`**——Web 端默认展示通用卡片，若需自定义专属卡片，由服务端 `output.presentationMeta(args, value)` 持久化有界 JSON 摘要到 `result.meta`，再由浏览器插件在 `tool.call.toolview` 槽位按工具名挂载 React 视图（详见 [`07` §2](./07-extension-recipes-and-host-services.md#2-工具-ui-卡片的双轨真相为什么写了-presentresult-在内置-web-里没反应)）。依据：DSH [添加工具食谱](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md#web-client-presentation)。

### Slot 与 Typert @Remote

在全栈插件（Host + Web Client 双树）中：**Slot**（`ctx.slots.register`）是浏览器侧插件将纯展示 React 组件挂载到命名界面位置并接收五份派生 props 的唯一机制（组件内部严禁触碰 `ctx`）；**Typert `@Remote`**（继承 `TypertRemoteService`）则是 Node 侧服务将类型化 RPC 方法与 `<domain>/<reason>` 结构化 `RemoteError` 暴露给浏览器侧 `ctx.remote.<namespace>.<method>()` 的标准跨进程通信桥梁（完整五步代码与客户端 `window.__ModuleLoader__.load` 懒加载构建模板见 [`04` §2](./04-plugin-repo-topologies.md)）。依据：DSH [添加 Remote API 食谱](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-remote-api.md)与 [`packages/client/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/AGENTS.md)。

### Capability seam（可替换能力）

**Capability seam** 是由 **Service Definition（纯契约与请求/结果类型）+ Service Provider（具体底层实现）+ Consumer（只依赖 Definition 的调用方）** 三角色共同构成的完整可替换能力边界。绝大多数独立插件只是既有 Seam 的 Consumer 或新 Provider，只有在确实维护多套演进节奏独立的后端实现时才拆成多包 Workspace（见 [`04` §3](./04-plugin-repo-topologies.md)）。依据：DSH [规范术语](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/glossary.md#capability-seam)。

## 三、组合、配置与分发

### bundle（配置分发包）

**Bundle** 是在 `package.json` 中声明了 `dsh.bundle` 字段、自带一份 YAML 配置补丁层的 npm 包（不代表把所有依赖打成单文件）。用户执行 `dsh plugin add` 安装 Bundle 时，宿主自动安装依赖并将补丁层叠进目标 Profile；未声明 `dsh.bundle` 的普通模块包安装后不会自动激活任何行。依据：DSH [两个概念、两个 manifest](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md#two-concepts-two-manifests)。

### profile 与 preset（进程入口 vs 会话能力）

三个以 B/P 开头的组合词粒度截然不同：**Profile**（声明 `dsh.profile`）是用户通过 `dsh --profile <name>` 启动整个 Node 宿主进程的环境清单（任何包都不能既是 Bundle 又是 Profile）；**Preset** 则运行在已启动进程内部，利用会话级 `agent.ctx` 决定**某一个具体 Session 的 Agent** 挂载哪些工具集、系统提示词与技能目录（由 Bundle 携带分发）。
- **Agent 高频误判与自检**：只想给某类专职子代理裁剪工具，却去改进程级 Profile；自检：整机装什么包看 `Profile`/`Bundle`，单会话 Agent 拿什么能力看 `Preset` 与 `agent.ctx`。依据：DSH [agent preset 说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/README.md)。

### Config 与 Volatile

**`Config`** 是插件用 `@deepseek-ai/schemastery` 定义的启动期校验配置。只有显式调用 `.volatile()` 声明为 **`Volatile<T>`** 的字段才会投影到 Web 图形设置页表单中——插件在每次操作开始时调用 `config.field.get()` 读取当前快照（敏感字段加 `.role('secret')` 防止明文回显），用户保存后自动写回当前 Profile 补丁层并触发 `loader/volatile-update` 热更新，无需重启进程。依据：DSH [活配置表单食谱](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-settings-card.md)。

### patch 与 overlay

**Patch / Overlay** 是按五层优先级（Schema 默认值 → Bundle → Profile → Home → `--patch`）叠加的插件增删改指令。死记两条铁律：① **按相同条目 `id` 覆盖已有行时，替换的是整个 `config` 对象而非逐字段深合并**；② YAML 动态表达式必须写作双感叹号 **`!!js`**（绝非 `!js`），且**仅在插件 `config` 与条目 `disabled` 两个位置求值**，其余元数据一律保持字面量（误用导致的真实故障见 [`08 · Postmortem 0002`](./08-troubleshooting-and-postmortems.md)）。依据：DSH [Loader 配置规范](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md#loader-configuration)。

### published artifact（发布产物）

**发布产物** 是经 `pnpm pack` 打出的真实 `.tgz` 交付包（仅含 `files` 白名单内的 `lib/`、补丁 YAML 与多语言资源）。注意客户端构建铁律：宿主即使在源码开发模式下启动，向浏览器分发的也始终是**编译打包后的 `lib/client.js` 产物**，漏跑构建或 `files` 漏列文件会在用户安装激活时当场报错。依据：DSH [客户端模块构建要求](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/modules/README.md#build-requirements)。

## 四、权限边界与验证真伪

### Plan Mode vs Sandbox / Approval

**Plan Mode** 只是让会话代理先提交方案草稿、经 `exit_plan_mode` 与人类对齐的软协作姿态——**人类批准 Plan 绝不授予任何文件系统写权限，也不免除高危动作审批**！硬安全边界始终由底层的 **Sandbox**（约束文件/子进程写入范围）与 **Approval**（`ctx.approval` 单次动作放行，无回答器时默认安全拒绝）独立把守。你的插件若执行外部写操作或进程调用，必须复用 `ctx.fs` / `ctx.shell` 或主动接入 `ctx.approval`。依据：DSH [Plan 子系统](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/plan.md)与 [Approval 子系统](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/approval.md)。

### goal（会话目标）

**Goal** 是绑定在单个 Session 上的跨轮持久目标状态（`active` / `paused` / `blocked` / `complete`；恢复或分叉会话后自动续跑许可不持久，需顶层显式重开）。**模型把 Goal 标为 `complete` 只是一次状态写入，绝不代表插件代码通过了外部验证**。依据：DSH [`dsh-goal` 说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal/README.md)。

### real composition（真实组合）

**真实组合测试** 通过真实 `Loader` 读取 YAML 挂载你的插件及最小必需上游服务（如 `dsh-system-prompt` + `dsh-tools`），断言所有启用条目进入 `FiberState.ACTIVE` 并经真实管线执行，彻底杜绝手工 `ctx.plugin(...)` 单测漏放默认导出与 `PENDING` 死锁的假绿现象。依据：DSH [真实入口测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#test-the-real-entry-path)。

### keyless replay 与 oracle

**Keyless scripted-turn replay（无 Key 脚本化回放）** 在独立插件仓中仅用确定性 `ScriptedLlmAdapter` 替换最外层模型网络请求，驱动真实 `AgentLoop` 跑完多步工具调用，再拿落盘产物与人工审定、只读保护的 **`workspace.expected/`（独立 Oracle）** 做字节级比对——既能在无 `DEEPSEEK_API_KEY` 的 PR CI 中 100% 复现，又严防录制刷新脚本把 `UNKNOWN_TOOL` 等回归错误顺手刷成“新标准答案”（完整代码见 [`06` §3](./06-plugin-gate-and-ci-harness.md)）。依据：DSH [外部世界验证](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#verify-the-world-not-the-self-report)。

## 继续深入

- [`07-extension-recipes-and-host-services.md`](./07-extension-recipes-and-host-services.md) 与 [`04-plugin-repo-topologies.md`](./04-plugin-repo-topologies.md)：查清宿主现成服务货架、五大扩展配方、全栈 `Typert @Remote` 通信与 `client.js` 打包模板。
- [`05-cordis-contracts-and-model-experience.md`](./05-cordis-contracts-and-model-experience.md)、[`06-plugin-gate-and-ci-harness.md`](./06-plugin-gate-and-ci-harness.md) 与 [`08-troubleshooting-and-postmortems.md`](./08-troubleshooting-and-postmortems.md)：生命周期防坑铁律、四阶门禁代码与 8 大高频故障 1 分钟排障速查。
- DSH [`docs/glossary.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/glossary.md)：查询 `Turn`、`Step`、`Goal round`、`Scope` 等宿主规范定义。
