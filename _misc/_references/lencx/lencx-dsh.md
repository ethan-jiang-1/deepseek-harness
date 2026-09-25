# DSH 核心原理

**DEEPSEEK HARNESS · CORE TECHNOLOGY SHARING**

> DSH · Cordis 微内核、可逆插件树，以及为什么动态运行时仍然选择 Node.js

AUTHOR / LENCX · 40 MIN / TECH TALK · 2026.08 · ARCHITECTURE × RUNTIME

来源：`lencx-dsh.pdf` · <https://github.com/lencx/Minke>

---

## 三个结论，先放在桌面上

*00 / ANSWERS FIRST*

| CORE | RUNTIME | CONTRAST |
| --- | --- | --- |
| **DSH 的核心不是 Loop** | **Node.js 是语义选择** | **Pi 与 DSH 放置复杂度的位置不同** |
| 核心是一套运行时语法：Context、Plugin、Fiber、Event 与 Effect。 | 动态加载、代理对象、类型扩展与 npm 分发，和插件模型处在同一种语言里。 | Pi 用显式循环 + 产品级 Extension API；DSH 用运行时微内核 + 深层可替换服务。 |
| **234** manifests<br>dsh-v0.1.1-rc.1 Git tag packages 快照 | **1** concrete loop<br>默认实现存在，但它本身也是插件 | **0** privileged core<br>没有必须打补丁才能扩展的特权内核 |

---

## Part I · 先把“核心”找对

*FIND THE REAL CORE*

模型调用只是一条执行路径；真正承重的是组合、依赖、生命周期与事实记录。

---

## 一次 LLM 请求很短，产品生命周期很长

*01 / REFRAME*

**THE VISIBLE LOOP**

`prompt → model → tool → model`

这是演示里最容易被看见的一条线，却不是系统里最难维护的部分。

| 组合 | 替换 |
| --- | --- |
| Web、Headless、桌面端如何共享能力，但拥有不同表层？ | 本地文件系统如何切到远程沙箱，而不改模型工具？ |

| 所有权 | 重建 |
| --- | --- |
| 插件重载、依赖消失、会话关闭时，谁清理进程与监听器？ | UI、模型上下文、fork、遥测如何从同一事实源派生？ |

---

## Cordis 是 DSH 的运行时语法

*02 / MENTAL MODEL*

| Context | Plugin | Fiber | Event | Effect |
| --- | --- | --- | --- | --- |
| 能力地址空间与作用域 | 最小贡献单元<br>函数 / 类 / 对象 | 依赖驱动的运行时实例 | 有分发语义的扩展点 | 带所有者的可逆副作用 |

**DSH 不是“在 Cordis 上运行”；DSH 的产品结构就是一棵 Cordis 插件树。**

---

## 运行中的 DSH，是从空根叠出来的一棵树

*03 / COMPOSITION*

Profile 决定“这次运行是谁”；Bundle 与 Patch 决定“它由哪些插件组成”。

**ORDER IS DATA** — 配置层有确定顺序；插件启动顺序则由 `inject` 依赖决定。

Patch 层（从底到顶，调用期 overlay 最后生效）：

- `--patch` — 调用期 overlay，最后生效
- `home patch` — 跨 profile 的个人覆盖
- `profile patch` — 具名组装的本地差异
- `web / headless` — 产品表层组合包
- `dsh-base` — 模型、工具、存储、策略、凭据

---

## Part II · 动态，但必须可控

*CORDIS RUNTIME PRIMITIVES*

动态插件系统的价值不在于“随时加载”，而在于依赖、作用域与拆除仍然具有结构。

---

## Context 不是字典，而是能力地址空间

*04 / CONTEXT*

对插件而言，`ctx` 是唯一入口：读服务、挂插件、监听事件、注册 effect。

**运行时是 Proxy** — 普通属性读取进入服务解析器；子 Context 通过原型继承能力，而不修改父级。

**类型来自声明合并** — 插件扩展 Context 与事件词汇，动态表面仍然保留静态提示。

`ctx` 周围的能力命名空间：

- `sessions` / `event log`
- `llm` / `adapters`
- `tools` / `registry`
- `agents` / `runtime`
- `fs` / `provider`
- `approval` / `policy`

---

## 插件只描述贡献，不负责启动世界

*05 / PLUGIN CONTRACT*

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'audit-session'
export const inject = ['sessions'] as const

export function apply(ctx: Context) {
  return ctx.on('session/event', (event) => {
    ctx.logger('audit').debug(event.type)
  })
}
```

- **SHAPE** — 函数、类，或带 `apply()` 的对象。
- **DEPENDENCY** — `inject` 缺失时等待，不靠配置文件位置碰运气。
- **OWNERSHIP** — 返回的 disposer 与当前 Fiber 绑定。

*示例为演示化简版；真实事件签名由各约定包通过 TypeScript 声明合并提供。*

---

## 把“插件实例”变成一个状态机

*06 / FIBER LIFECYCLE*

`PENDING → LOADING → ACTIVE → FAILED → UNLOADING → DISPOSED`

| 状态 | 含义 |
| --- | --- |
| PENDING | 等待 inject 的服务全部可用 |
| LOADING | 校验配置并执行插件入口 |
| ACTIVE | 贡献已发布，effect 被收集 |
| FAILED | 启动错误可见，不静默跳过 |
| UNLOADING | 等待异步 disposer 完成 |
| DISPOSED | 从父 Fiber 与 registry 分离 |

**依赖驱动，而非列表驱动** — 依赖出现 → 激活；依赖实现改变 → 卸载并重载。

**热更新不是旁路** — HMR 复用同一套 unload / reload 语义，而不是另造生命周期。

---

## 每一个副作用，都必须能倒放

*07 / REVERSIBLE EFFECTS*

注册不是写入全局；注册是创建一个有所有者的 effect。

监听器、服务、进程、计时器与资源句柄都随 Fiber 收集；卸载时按 LIFO 顺序释放。

这使热更新、依赖替换、会话关闭共享同一条拆除路径。

- register：`01 → 02 → 03 → 04 → flush barrier`（listener / service / process …）
- dispose（LIFO）：`04 → 03 → 02 → 01`

---

## “事件”不是一种语义，而是四种控制权

*08 / EVENT SEMANTICS*

| 分发模式 | 控制权 | 典型事件 |
| --- | --- | --- |
| `waterfall` | 包裹 / 改写 / 截断 | agent/pre-step · agent/request · tools/execute · llm/stream |
| `serial` | 有序检查点 | agent/turn-stopping |
| `parallel` | 全部必须获得机会 | session/flush |
| `emit` | 同步通知 | inbox · lifecycle · diagnostics · observation |

事件名描述“发生什么”，分发模式规定“插件拥有什么控制权”。

---

## Waterfall 是可组合的“控制平面”

*09 / WATERFALL*

| 插件 | 角色 |
| --- | --- |
| `policy` | 检查权限，可直接拒绝 |
| `compaction` | 在请求前替换上下文表面 |
| `routing` | 改写模型或短路到替代实现 |
| `telemetry` | 包裹 `next()`，记录耗时与结果 |
| `builtin` | 默认行为，位于最内层 |

不调用 `next()` = 截断。

```ts
ctx.on('agent/request', async (request, next) => {
  const started = performance.now()
  try {
    return await next()
  } finally {
    record(performance.now() - started)
  }
})
```

**最常见的错误** — 忘记调用 `next()` 不是“什么都没做”，而是明确否决剩余链路与内建行为。

---

## 同一棵树里，可以存在不同的能力世界

*10 / SCOPE*

**root context**

`ctx.fs = local` · `ctx.llm = registry` · `ctx.tools` · `ctx.sessions`

**agent preset context** — `isolate('fs') + intercept('tools')`

`inherit ctx.llm` · `inherit ctx.sessions` · `ctx.fs = remote` · `tools.policy = strict`

`extend()` 继承，`isolate()` 改变服务解析域，`intercept()` 向下游合并配置。

---

## Part III · 从插件原语到 Agent 产品

*HOW DSH USES THE RUNTIME*

服务回答“能力是什么”，事件回答“何时可以介入”，会话日志回答“发生过什么”。

---

## 可替换能力，不等于一个 interface

*11 / CAPABILITY SEAM*

| 角色 | 职责 | 示例 |
| --- | --- | --- |
| 01 · CONTRACT — **Service Definition** | 拥有 `ctx.<key>`、词汇类型与稳定约定。 | `dsh-shell` |
| 02 · IMPLEMENTATION — **Service Provider** | 同一约定之后，可以存在本地、沙箱或远程实现。 | `bash-local` · `bash-sandbox` · future: `remote executor` |
| 03 · PRODUCT API — **Consumer** | 模型或其他插件实际编程所面对的接口。 | `tool-bash` |

**Provider 与 Consumer 独立演进：更换执行世界，不必扰动模型看到的工具 schema。**

---

## Agent Loop 是事件与能力的编排器

*12 / ONE TURN*

`turn/start → agent/pre-step → step/start → agent/request → llm/stream → tools/* → turn/end`

| 事件 | 动作 |
| --- | --- |
| `turn/start` | 领取 inbox |
| `agent/pre-step` | 拒绝或改写输入 |
| `step/start` | 记录进入消息 |
| `agent/request` | 组装并路由请求 |
| `llm/stream` | 记录 chunk/message |
| `tools/*` | pre → execute → post |
| `turn/end` | flush / idle |

- **持久事实** — `turn/*`、`step/*`、`message`、`tool` 事件。
- **实时控制** — `agent/*` 负责 inbox、状态、请求与 steering。
- **能力扩展点** — `llm/*`、`tools/*`、`fs/*` 不导入循环。

---

## 模型可见，即已记录

*13 / EVENT-SOURCED SESSION*

`turn/start → user/message → assistant/chunk* → assistant/message → tool/call → tool/result → turn/end`

↓ derive / project ↓

| 投影 | 方式 |
| --- | --- |
| LLM history | `deriveMessages()` |
| UI | stream replay |
| fork | new session seed |
| telemetry | trace & usage |
| persistence | buffer + flush |

状态与日志不是两份真相：日志本身就是事实，其他视图都是投影。

---

## 替换两个 Provider，迁移一整个执行世界

*14 / REPLACE A WORLD*

**Local world**

- `ctx.fs → fs-local`
- `ctx.subprocess → local`
- bash / PTY / LSP
- tool schemas unchanged

**Remote sandbox**

- `ctx.fs → fs-e2b`
- `ctx.subprocess → e2b`
- bash / PTY / LSP move together
- Consumers stay stable

这就是 seam 的杠杆：替换少量提供方，让多个消费能力同步迁移，而不是复制整条产品链。

---

## 四条原则，约束所有新增功能

*15 / DESIGN PHILOSOPHY*

1. **组合优于继承** — 用 Profile / Bundle / Patch 组装产品表层，而不是扩展一个巨型 Application 类。
2. **扩展点必须有语义** — 事件域与分发模式共同定义控制权；不是到处散落的回调。
3. **副作用必须有所有者** — 服务、监听器与长任务随 Fiber 生命周期存在，卸载路径可验证。
4. **事实先于视图** — 会话日志是唯一真源；模型上下文、UI、fork 与遥测从事件派生。

判断新增行为放在哪里：先找已有事件或能力 seam，最后才考虑修改 Loop。

---

## Part IV · 运行时选择，是架构选择

*WHY NODE.JS*

DSH 优先优化的是扩展速度、语义贴合与生态可组合性，而不是把每一条路径压到最低指令数。

---

## 先问：系统的主成本在哪里？

*16 / DECISION AXIS*

| CPU / memory hot path | Mixed systems boundary | Dynamic control plane |
| --- | --- | --- |
| 编解码、索引、隔离器、密集计算 | 协议、进程、网络、持久化 | 插件、配置、策略、工具与 UI 组合 |

**DSH 的中心落在右侧：I/O 驱动的动态控制平面。**

推论：语言运行时首先要降低扩展与组合成本；热点可以沿能力 seam 下沉，而不必重写控制平面。

---

## 让插件模型保持“语义局部”

*17 / SEMANTIC FIT*

| 特性 | 作用 |
| --- | --- |
| `Proxy` | 动态服务解析 — `ctx.foo` 读取即进入作用域化解析器。 |
| `prototype` | 廉价子 Context — 继承能力，局部 shadow，不复制整个容器。 |
| `declaration merging` | 开放类型词汇 — 插件可以扩展 Context 与 Events，同时保留编辑器提示。 |
| `ESM + npm` | 代码即分发单元 — 模块指定符、依赖图、Profile 安装共享同一生态。 |
| `async iterable` | 流式天然 — LLM chunk、工具更新与异步 disposer 使用同一模型。 |
| `TS across host/client` | 协议词汇复用 — Host SDK、Web client 能共享类型与 schema。 |

这些能力并非其他语言做不到；差别在于 DSH 不需要在边界上重新翻译自己的动态语义。

---

## 不是“谁更强”，而是谁更贴近这组约束

*18 / TRADE-OFF MATRIX*

| 决策维度 | Node.js / TypeScript | Python | Rust |
| --- | --- | --- | --- |
| 动态插件加载 | 原生贴合 ESM / npm | 原生贴合 import / PyPI | 需设计 ABI / WASM / 嵌入 |
| Cordis 语义映射 | 直接 Proxy / Symbol / 原型 | 可重建，但语义不同 | 重构，而非翻译 |
| Host / Web 类型复用 | 同一词汇 | 需要协议层 | 需要绑定 / 生成 |
| CPU / 内存可预测性 | 一般 | 一般 | 优势明显 |
| AI / 数据科学生态 | 应用层强 | 最强 | 系统层强 |
| 动态扩展迭代速度 | 约束下最优 | 高 | 边界更显式 |

*这是面向 DSH dsh-v0.1.1-rc.1 约束的定性矩阵，不是通用语言排名。*

---

## Rust 最有价值的位置：seam 之后，而不是 Cordis 之内

*19 / RUST BOUNDARY*

| TS control plane | STABLE SERVICE CONTRACT | Native data plane |
| --- | --- | --- |
| 插件发现与配置组合 | | OS sandbox / launcher |
| 策略、事件与工具 schema | | 高吞吐解析与索引 |
| Agent / session 生命周期 | | 加密、压缩、编解码 |
| Web / SDK 协议词汇 | | 需要强资源上界的 worker |

只有当 profiling、隔离或分发约束给出证据时才下沉；通过进程、N-API、WASM 或稳定协议接入。

---

## Part V · 同做 Agent Harness，选择不同的复杂度容器

*DSH × PI-MONO*

Pi 把复杂度收敛进显式 Agent 与 Extension API；DSH 把复杂度分散进可组合的运行时协议。

> BASELINE / DSH dsh-v0.1.1-rc.1 · PI-MONO v0.84.2

---

## Pi 扩展一个产品；DSH 组合一个运行时

*20 / ARCHITECTURE CONTRAST*

**Pi / PI-MONO — 显式 Loop + Extension API**

| 层 | 内容 |
| --- | --- |
| 产品 | coding agent · TUI / RPC / SDK |
| ExtensionRunner | tools / commands / hooks / UI |
| Agent | mutable state + queues |
| `agentLoop()` | 直接、可读的控制流 |

**DSH — Plugin Tree + Runtime Protocol**

| 层 | 内容 |
| --- | --- |
| profile | web / headless / custom surface |
| plugins | 每个产品部分都可替换 |
| services + events | 依赖与控制权协议 |
| Cordis | Context / Fiber / Effect |

---

## 同样新增“远程执行”，两边怎么走？

*21 / SAME CHANGE, DIFFERENT PATH*

**PI-MONO · PRODUCT EXTENSION**

| 关注点 | 做法 |
| --- | --- |
| Extension | 注册或替换 tool |
| Tool.execute | 路由到 SSH / VM / RPC |
| Lifecycle | 在 `session_shutdown` 显式关闭 |
| Security | 真实边界放在容器 / VM |

**DSH · CAPABILITY REPLACEMENT**

| 关注点 | 做法 |
| --- | --- |
| Definition | 复用 `ctx.fs` / `ctx.subprocess` |
| Provider | 替换为 remote implementations |
| Lifecycle | Fiber 自动拥有连接与 disposer |
| Consumer | bash / PTY / LSP 保持不变 |

Pi 让一项需求更快抵达用户；DSH 让同一替换跨多个 Consumer 保持结构一致。

---

## 两者都记录会话，但“真相模型”不同

*22 / STATE & LIFECYCLE*

| 关注点 | DSH | PI-MONO |
| --- | --- | --- |
| 运行时状态 | SessionEvent log-first，消息由日志派生 | Agent state-first，持有可变 messages 与 queues |
| 持久结构 | 仅追加事件流；fork 以已有日志初始化新会话 | JSONL entry tree；id/parentId 在单文件内分支 |
| 运行时事件 | 扩展控制协议 + 持久事实，两类事件域显式分离 | Agent/Extension 事件驱动 UI、拦截与产品行为 |
| 资源所有权 | Fiber effect 收集，逆序、可等待、依赖驱动拆除 | Extension 显式处理 `session_shutdown`，重载后旧 ctx 失效 |
| 优先优化 | 结构化替换与回放不变量 | 控制流可读性与扩展上手速度 |

*pi-mono 的 session 同样是持久日志；“state-first”特指 Agent runtime 的工作模型，而不是否定其 JSONL 历史。*

---

## 选择哪一个，取决于你要承受哪种变化

*23 / FIT, NOT WINNER*

**CHOOSE PI-MONO WHEN — 产品边界清晰，迭代速度优先**

- 终端 Coding Agent 是中心产品
- 希望用一个 Extension API 完成大多数定制
- 希望 Loop 控制流直接、SDK 嵌入简单
- 愿意把真实隔离交给容器、VM 或外部工具

**CHOOSE DSH WHEN — 部署形态多样，替换深度优先**

- 同一核心需要 Web、Headless、Desktop 等 profile
- 服务实现、策略与消费方需要独立演进
- 插件重载与资源所有权必须结构化
- 回放、fork、持久化依赖严格事件不变量

还可以组合：把彼此当作进程 / RPC / agent provider，而不是强行统一两套内核。

---

## DSH 的灵活性不是免费的

*24 / HONEST COSTS*

| 成本 | 失控时的症状 | 架构护栏 |
| --- | --- | --- |
| 间接控制流 | 一次请求跨多个 waterfall listener，定位困难 | 事件词汇表、生产/消费映射、trace 与组合测试 |
| 包与接线数量 | 为了“未来可能替换”过早拆分 | 只有出现第二个 Provider / Consumer 时才建立独立 seam |
| 动态模块加载 | Node 版本与 ESM hook 变化影响启动 / HMR | 统一 tsx/esm 启动向量 + Node compatibility smoke |
| 可信插件 | 插件代码拥有 Host 权限，误把 isolate 当安全边界 | Profile 信任边界 + sandbox/approval seam + OS 隔离 |
| Waterfall 语义 | 忘记 next() 导致默认行为被截断 | 文档、类型、契约测试与最小事件表面 |

---

## 新功能落在哪里？用四个问题判断

*25 / EXTENSION ROUTING*

1. **它是必须回放的事实吗？** 是 → 扩展 SessionEventMap，从日志投影。否 → 继续判断。
2. **它要拦截进行中的工作吗？** 是 → `agent/*`、`tools/*` 或能力事件。否 → 继续判断。
3. **它是一项可替换能力吗？** 是 → Definition / Provider / Consumer。否 → 普通插件贡献。
4. **它需要改 Agent Loop 吗？** 通常不需要；先证明现有扩展点无法表达。

一项好扩展的完成标志：卸载后，它留下的行为与资源都消失。

---

## DSH 的核心，是让变化有位置、有边界、有退路

*26 / CLOSING SYNTHESIS*

`plugin composition` + `reversible ownership` + `recorded facts`

- Node.js 负责动态控制平面；Native 代码只在证据明确的 seam 之后发力。
- Pi 展示了“保持产品内核极小”的另一条路；DSH 选择的是“让运行时本身可组合”。

---

## Appendix · Deno：可参考的分层，不是 DSH 主线

*ARCHITECTURE REFERENCE*

Deno Rust + V8 的价值在于建立清晰 Host 边界；它并不意味着要用 Rust 重新实现动态插件语义。

---

## Deno 证明的是“分层可行”，不是“Rust 可以消除动态性”

*A1 / DENO PATTERN*

**REFERENCE VALUE**

| 层 | 职责 |
| --- | --- |
| CLI / runtime | 权限、模块、任务与产品入口 |
| ext/* | Web API 与原生能力扩展 |
| deno_core | JS ↔ Rust 的 op 边界 |
| V8 | JavaScript 语言与对象模型 |
| Tokio / Rust | 异步系统运行时与 native 实现 |

**V8 保留 JS 语义** — Rust 提供宿主能力、调度与系统边界；JavaScript 仍然是用户代码与生态表面。

**DSH IMPLICATION — 先抽 Host seam** — 如果未来采用 Deno 风格，应迁移 ops / providers，而不是逐行翻译 Cordis。

*近期 Deno 对 Node module hooks 的兼容在推进；Cordis 的 loader/HMR 仍应通过真实兼容测试验证，不能从 API 名称推断“完美兼容”。*

---

## Afterword · Minke 把 Harness 变成一个完整工作空间

*MINKE*

它解决的不是“再做一个聊天窗口”，而是让 Agent 的对话、项目与真实执行能力不再散落在多个应用里。

**THE PROBLEM** — Agent 能力很强，工作流却被切碎：对话在聊天窗口，代码在编辑器，命令在终端，资料在浏览器；远程继续工作又常常退回屏幕共享。

1. **同屏工作空间** — Conversation、Files、Terminal、Browser、Plugins 与 Session 保持在同一上下文。
2. **真实远程能力** — Minke Host 投射文件、终端与任务能力，而不是把 Electron 窗口变成一段屏幕视频。
3. **可演进产品层** — 固定 DSH 版本，通过 Profile Bundle / overlay 扩展，并以兼容门禁守住边界。

Minke = DSH 的本地优先桌面工作空间。

DSH 解决“运行时如何组合”；Minke 解决“这些能力如何成为每天可用的产品”。

---

## 让 Agent 回到真实工作里

*END / THANK YOU*

DSH 让变化有边界，Minke 让能力真正落地。

感谢聆听。期待一起继续构建。
