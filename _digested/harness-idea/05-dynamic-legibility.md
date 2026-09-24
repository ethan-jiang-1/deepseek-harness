# 动态可读性（dynamic legibility）：dsh 可以回答，也可以试验

## 问题

静态文档再全，也有两个解决不了的问题：读者不知道**这次运行实际是什么**，以及读者想**验证一个假设**。多数系统此时只能靠人回答。dsh 把这两件事也做成了系统能力。

## 查询面一：`dsh --dump-config` 输出实际运行的树

静态 import 图只说明「可能加载什么」；Profile、Bundle、Patch、realm 与条件表达式共同决定实际拓扑。`dsh --dump-config` 把 boot 会用到的组合按 `applyEntryPatches` 打印出来，且与 boot 共用同一算法，不另写一份会漂移的实现（官方落点：`docs/architecture.md:36` 与 [`vendor/README.md`](../../vendor/README.md) 本地修改清单第 11 条）。

对读者来说，这是**部署时组合的运行时答案**：不知道哪个 provider 生效，先 dump；问题报告缺最终配置树，常常连复现对象都没描述完整。

## 查询面二：生成目录是合同面的索引

生成的 `tool-catalog`、`config-catalog`、`persistence-catalog`、`event-producer-consumer`、`module-graph`、`graph-atlas`、`capability-seams`、`cordis-api` 都是 freshness-gated 的索引。它们的作用不是给人通读，而是让「查」成为可靠动作：读者不必记住包清单或事件表，只要知道去哪查。

## 查询面三：`cordis_inspect_*` 问活运行时

静态索引只覆盖源码平面；运行时可能还有临时插件、pending fiber、实际服务提供者（service provider）。[`2026-07-08-self-referential-cordis-toolset`](../../.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md) 给了模型一组**只读**的 inspect 工具——注意该 note 里写的「current names are cordis_inspect, cordis_mount, cordis_unmount」已经过期，0.1.7 线（#4745）起只注册两个只读名字：`cordis_inspect_list`、`cordis_inspect_query`（`packages/extensions/tool-cordis/src/index.ts:23,42`；`docs/tool-catalog.md`），变更类工具退役、持久安装归 plugin_manager（详见下文试验面一节）。

三个只读工具各有分工：`cordis_inspect_list` 列当前有哪些 Provider 与插件；`cordis_inspect_query` 按 `platform`（host / client）+ `provider` + `method`（+ 可选 `input`）向某个 Provider 的 manifest 方法发起**参数化查询**；`cordis_inspect_self` 不带参数列全部当前 Plugin，带 `pluginId`/`packageId` 则返回该 Plugin 的源码与诊断。旧版那种「一次调用列出 `plugins`/`services`/`tools`/`api`/`events`/`temporary` 各节」的单一 `cordis_inspect` 已不存在。

它服务的 API 目录不是手写表，而是由源码生成、freshness-gated 的 catalog（`pnpm run verify-cordis-catalog`，`doc-sync` 的一员），运行时再与 live runtime 求交集。**读者不是只能读文档，还能问系统「现在有什么、签名是什么」。**

## 查询面四：Session 读意图 API

会话日志的读取同样有显式定价：`0.1.2-rc.1` 起 `session.events` 数组读取退役，读操作按成本拆开——`seq` 以 O(1) 读当前事件数，`eventAt(seq)` 以 O(1) 读单个事件，`snapshotEvents(from, to)` 显式物化冻结数组，全量快照缓存到下次 append。事件 seq 与日志 offset 也分成两个品牌类型（`SessionSeq` / `SessionLogOffset`，commit `27bf1039`）：一个指已存在的事件，一个指日志间隙或读取位置，混用会被编译器拒绝（[`2026-08-21-session-log-read-intent`](../../.agents/notes/archived/architecture/2026-08-21-session-log-read-intent.md)，已归档，历史快照；这套读取 API 的现行 owner 是 [`docs/subsystems/session.md`](../../docs/subsystems/session.md) 与 [`packages/core/session/src/index.ts`](../../packages/core/session/src/index.ts)）。

## 试验面：只读自省 + 程序化 runner + plugin_manager

查询之后可以试验。这条面的形状在本仓库经历了三次演化（0008 复核）：早期 note 设想的单一 `cordis_inspect` 加 `cordis_mount` / `cordis_unmount`（从未注册过）；0006/0007 时代的七个模型工具（`cordis_inspect_list/query/self` + `cordis_define/run/stop/undefine`）；`dsh-v0.1.7-rc.1`（#4745 精简创造模式）收敛为现在的三件套——

- **两只读模型工具**：`cordis_inspect_list` / `cordis_inspect_query`（`packages/extensions/tool-cordis/src/index.ts:23,42`）暴露只读运行时发现；查询纪律写在工具描述里（先发现 provider 与方法，再按返回 schema 查询，不能猜名称、不能把 Inspect method 当业务 Service）。catalog 生成器拒绝 freshness 漂移，详查避免为完整 API 声明付每请求的账。
- **程序化 runner**：`cordis-host-runner` / `cordis-client-runner` 保留生命周期与浏览器消费者的编程 API，不再暴露为模型工具。Host definition 在 fresh vm realm 里求值、拿 context façade（服务访问要声明注入、框架内部隐藏、注册归属 definition 自己的 fiber），但 vm 只防意外全局污染——注入的 fs/shell/network 服务仍有真实权限，**不是安全边界**。
- **持久安装走 `plugin_manager`**：agent 写的持久化安装、审批与 profile 持久化归 Creator persistent plugin decision（`.agents/notes/implemented/architecture/2026-09-16-creator-persistent-plugin-management.md`）；现行 note 明言 "Shipped model tools do not create or mutate runner definitions"（`2026-07-08-self-referential-cordis-toolset.md:17`）。定义仍是进程内的，重启与 resume 不从历史调用重建。

> The vm prevents accidental global pollution; injected filesystem, shell, and network services still have real authority, so it is not a security boundary.
>
> —— `.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md:14`（基线 `46a7f68b09…`；该 note 已被上游整篇重写为 "Cordis runtime inspection and runner isolation"，与两工具现状对齐，0007 登记的脱节缺口随之关闭）

`[原文]` 同时要记住它是 **opt-in、bash-equivalent trust**：能自动 install 与「可信」是两件事，这条面也不应进默认产品组合。

## 动态不等于模型面不稳定

一个常见怀疑：运行时动态装卸插件，是否会让每轮 prompt 都变、缓存全废。dsh 的处理是**把「动态变化」和「模型可见变化」分开**：

- 每 step 重新读取插件图，但 prompt section、工具 schema、历史前缀稳定时，重新组装仍得到相同前缀；
- 真正使模型面失效的是变化穿透到请求：工具集改变、section 改写、模型切换、compaction 替换历史；
- `request/header` 快照记录实际生效的请求面，模型可见 ⟺ 已记录由 invariant 断言。

`[推断]` 这个「动态控制平面（dynamic control plane） vs 稳定模型面（stable model surface）」的区分可以从 DSH 的 turn flow 与 request/header 机制推出；仓库落点见 [`docs/architecture.md`](../../docs/architecture.md) 的 turn flow。它说明 dsh 的运行时动态没有牺牲读者最需要的稳定性——变化有明确的可见边界。

> **Model-visible means logged.** Anything that reaches a model request must be reconstructable from the log, and a runtime invariant asserts it.
>
> —— `docs/architecture.md:125`（基线 `46a7f68b09…`）

> The loop builds each request from logged state. `EpochHeader` records call config, ... and records the authoritative returned tool order ... through full `request/header` snapshots. The rendered prompt is derived history — the `system/message` at surface node 0, plus any later system node an `in-history` route appended — so the header and the derived history together make the request reconstructable from the session log.
>
> —— `docs/subsystems/llm-streaming.md:704`（基线 `46a7f68b09…`）

## 结论

静态可读性（[`02`](./02-legibility.md)）解决「知道有什么」；动态可读性解决「这次运行是什么」和「我的假设成不成立」。dump 问组合，生成目录问源码合同，`cordis_inspect_list` / `cordis_inspect_query` 问活运行时，读意图 API 问日志，`plugin_manager` 安装 bundle 做持久试验。五者合起来，coding agent 就有了一个不需要资深同事在场的问答回路。

`[推断]` 一个可执行的阅读路径是：先看 `dsh --dump-config` 输出的配置树，再追踪 `ctx.provide` / `inject`、Context realm 与 Fiber effect，最后沿 Session event 到 `deriveMessages()` 检查模型实际看到什么。落点分别在 [`docs/architecture.md`](../../docs/architecture.md)、[`docs/cordis-api/context.md`](../../docs/cordis-api/context.md)、[`docs/cordis-api/fiber.md`](../../docs/cordis-api/fiber.md)、[`docs/subsystems/session.md`](../../docs/subsystems/session.md)。

## 证据入口

- [`docs/architecture.md`](../../docs/architecture.md)（第 125 行；model-visible ⟺ logged）
- [`docs/config-catalog.md`](../../docs/config-catalog.md) / [`docs/tool-catalog.md`](../../docs/tool-catalog.md) / [`docs/persistence-catalog.md`](../../docs/persistence-catalog.md)（生成目录实例）
- [`docs/event-producer-consumer.md`](../../docs/event-producer-consumer.md)（事件索引）
- [`2026-07-08-self-referential-cordis-toolset`](../../.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md)（第 17、23、27、37、43、59 行；inspect / mount / unmount 的合同、边界校验与进程内存语义）
- [`../../packages/extensions/tool-cordis/README.md`](../../packages/extensions/tool-cordis/README.md)（工具包合同）
- [`docs/tool-execution-pipeline.md`](../../docs/tool-execution-pipeline.md)（工具执行管道）
- [`2026-07-05-reconstructable-requests`](../../.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md)（请求面变化与重建）
