# 技术选型与语言贴合：dsh 为什么容易被 coding agent 消化

## 问题

「dsh 的技术栈容易被 coding agent 消化」不是一个单一原因，而是三层选择叠在一起。把三层分开，才能避免两种错误：一种是「全是 agent 友好设计」的事后美化，另一种是「只是用了主流栈」的过度简化。

## 第一层：先验密度——骑在 LLM 熟悉的高密度区

TypeScript、ESM、pnpm、vitest、lefthook、oxlint，都是 coding agent 最可能已经见过的工具——这一句是 `[框架]` 分布假设，不是源码事实。仓库内能直接作为证据的是生态熟悉度：

[`2026-06-16-pnpm-over-yarn`](../../.agents/notes/implemented/process/2026-06-16-pnpm-over-yarn.md) 明说，对于一个 **built primarily by agents** 的仓库，「the package manager most tools and people expect」有真实价值：更少的意外、更常见的失败路径、更多可复制粘贴的答案。

> For a repo that is built primarily by agents and read by occasional human contributors, "the package manager most tools and people expect" has real value: fewer surprises, better-trodden failure paths, more copy-pasteable answers.
>
> —— `.agents/notes/implemented/process/2026-06-16-pnpm-over-yarn.md:9`（基线 `a66e4702…`）

但注意证据边界：`2026-06-17-ts-build-config` 也常被拿来当「技术选型」证据，它的实际理由是 **tsc 与 oxc/tsdown 的编译语义差异和 declaration 正确性**，不是「agent 更熟 TypeScript」。不要把每个技术决定都归因为 agent 友好。

## 第二层：语义贴合——语言特性和运行时模型同构

`[推断]` 本专题从 DSH 的语言特性和插件模型中观察到：dsh 的主成本在 **dynamic control plane**，不在 CPU hot path；Node.js/TypeScript 的价值首先不是生态，而是语言语义与插件模型处在同一种语言里：

- `Proxy` → `ctx.foo` 的读取进入作用域化服务解析器；
- prototype → 子 Context 廉价继承能力，局部 shadow 而不复制容器；
- declaration merging → 插件可以扩展 Context 与事件词汇，同时保留静态类型提示；
- ESM + npm → 模块指定符、依赖图、Profile 安装共享同一生态，代码即分发单元；
- async iterable → LLM chunk、工具更新与异步 disposer 使用同一模型；
- TS across host/client → Host、Web client 共享协议类型与 schema。

本专题把这条作为**分析框架**，不是源码事实；具体语义要回 [`docs/cordis-primer.md`](../../docs/cordis-primer.md) 核。它的可迁移结论是：**当架构的主要词汇（服务解析、作用域、开放类型、可逆生命周期）能被语言原生表达时，读者要跨的翻译层就少一层。** 这也是「容易读懂」的一部分，且与「LLM 熟不熟 TS」是两回事。

> A context is a proxy: normal property reads go through the service resolver, while `extend()`, `isolate()`, and `intercept()` create scoped child contexts without mutating their parent.
>
> —— `docs/cordis-api/context.md:10`（基线 `a66e4702…`）

> **Typed events use declaration merging** and merge-extensible maps.
>
> —— `AGENTS.md:107`（基线 `a66e4702…`）

## 第三层：低密度但承重的技术，本地化或生成化

dsh 不是只用主流技术。真正承重但不在 LLM 先验高密度区的部分，用了两种策略：

1. **vendor 进树并本地拥有**：Cordis 被 vendor 进 `vendor/`，带 upstream SHA、本地修改日志和 sync 流程。`[原文]` 注意 [`2026-06-11-vendor-cordis-as-source`](../../.agents/notes/archived/process/2026-06-11-vendor-cordis-as-source.md) 的决策理由是 **RC 框架 internals 的正确性、可 pin、可修**，不是「Cordis 太 niche、agent 不会」。把动机说成「分布外所以搬进来」是事后解释；更准确的效果是：搬进来之后，agent 不需要依赖模糊的外部知识，框架层可审计、可修。

> DeepSeek Harness is built on the Cordis framework. Cordis core was at 4.0.0-rc.6 (a release candidate) when this repo started; the harness depends on framework internals (fiber lifecycle, effect disposal, waterfall dispatch) whose exact behavior matters to the agent loop's correctness guarantees.
>
> —— `.agents/notes/implemented/process/2026-06-11-vendor-cordis-as-source.md:9`（基线 `a66e4702…`）
2. **生成合同面**：把源码事实变成 freshness-gated 的 catalog（[`02`](./02-legibility.md) 机制五）。agent 不需要懂全部 Cordis 或全部包，只需要查生成的 API、事件、配置与模块图。

`[推断]` native Landlock、Python SDK 等边界在仓库布局中同样显式分层：TS 控制平面之外的东西放在独立发行物或 seam 之后，不混进插件模型。仓库侧可见的是 `native/`、`python/` 顶层边界，以及 vendor / npm 依赖的分离（[`vendor/README.md`](../../vendor/README.md)）。新实例是 [`packages/experimental/code-runtime-python`](../../packages/experimental/code-runtime-python/README.md)（#1148）：CPython 子进程后端实现 `dsh-code-runtime` seam，把 TS 控制平面之外的执行世界放进独立包边界——experimental 分组的私有原型，不进默认组合。

## 三层的合成判断

```text
先验密度高（主流工具）
  × 语义贴合（语言能原生表达运行时语法）
  × 低密度承重件被 vendor / 生成 / 独立边界包住
  = coding agent 面对的是一张不需要外部行话也能消费的合同面
```

`[框架]` 这个公式是本专题的判断，不是仓库官方术语。它比「技术栈选在 LM 训练分布的高密度区」多解释两件事：为什么不只是生态熟悉，以及为什么 niche 框架没有杀死可读性。

## 与 OOD 知识的关系

选型只能降低「需要 OOD 知识」的面积，不能消灭它。剩下的分布外知识——设计意图、被拒方案、本地 vendor 修改的理由——必须靠搬运与检查进入仓库：Agent Notes、vendor manifest、生成目录和门禁都是搬运通道。这个主题的完整纪律见 [`08`](./08-judgement-discipline.md)。

## 证据入口

- [`2026-06-16-pnpm-over-yarn`](../../.agents/notes/implemented/process/2026-06-16-pnpm-over-yarn.md)（第 9 行；生态熟悉度的直接证据）
- [`2026-06-17-ts-build-config`](../../.agents/notes/implemented/process/2026-06-17-ts-build-config.md)（第 11 行；技术决定但理由不是 agent 友好：证据边界）
- [`2026-06-11-vendor-cordis-as-source`](../../.agents/notes/archived/process/2026-06-11-vendor-cordis-as-source.md)（第 9 行；vendor 的真实理由）
- [`../../vendor/README.md`](../../vendor/README.md)（manifest 与本地修改日志）
- [`docs/cordis-primer.md`](../../docs/cordis-primer.md)（五条原语的语义落点）
- [`docs/architecture.md`](../../docs/architecture.md)（插件树与组合层）
- [`docs/development.md`](../../docs/development.md)（TypeScript 构建边界）
- [`../../package.json`](../../package.json)（pnpm / TS / vitest / lefthook 的仓库落点）
