# 动态可读性（dynamic legibility）：dsh 可以回答，也可以试验

## 问题

静态文档再全，也有两个解决不了的问题：读者不知道**这次运行实际是什么**，以及读者想**验证一个假设**。多数系统此时只能靠人回答。dsh 把这两件事也做成了系统能力。

## 查询面一：`dsh --dump-config` 输出实际运行的树

静态 import 图只说明「可能加载什么」；Profile、Bundle、Patch、realm 与条件表达式共同决定实际拓扑。`dsh --dump-config` 把 boot 会用到的组合按 `applyEntryPatches` 打印出来，且与 boot 共用同一算法，不另写一份会漂移的实现（官方落点：`docs/architecture.md:34` 与 [`vendor/README.md`](../../vendor/README.md) 本地修改清单第 11 条）。

对读者来说，这是**部署时组合的运行时答案**：不知道哪个 provider 生效，先 dump；问题报告缺最终配置树，常常连复现对象都没描述完整。

## 查询面二：生成目录是合同面的索引

生成的 `tool-catalog`、`config-catalog`、`persistence-catalog`、`event-producer-consumer`、`module-graph`、`capability-seams`、`cordis-api` 都是 freshness-gated 的索引。它们的作用不是给人通读，而是让「查」成为可靠动作：读者不必记住包清单或事件表，只要知道去哪查。

## 查询面三：`cordis_inspect` 问活运行时

静态索引只覆盖源码平面；运行时可能还有临时插件、pending fiber、实际服务提供者（service provider）。[`2026-07-08-self-referential-cordis-toolset`](../../.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md) 给了模型一个只读的 `cordis_inspect`：

- `plugins`：当前每个活 fiber；
- `services`：每个 `ctx` 服务的提供者；
- `tools`：模型现在能调用什么；
- `api` / `events`：带签名和原始 JSDoc 的服务与事件合同；
- `temporary`：`cordis_mount` 挂载的临时插件子集。

它服务的 API 目录不是手写表，而是由源码生成、`verify-cordis-api` freshness-gated 的 catalog，运行时再与 live runtime 求交集。**读者不是只能读文档，还能问系统「现在有什么、签名是什么」。**

## 查询面四：Session 读意图 API

会话日志的读取同样有显式定价：`seq` 以 O(1) 读当前事件数，`eventAt(seq)` 以 O(1) 读单个事件，`snapshotEvents(from, to)` 显式物化冻结数组，全量快照缓存到下次 append。事件 seq 与日志 offset 也分成两个品牌类型（`SessionSeq` / `SessionLogOffset`，commit `27bf1039`）：一个指已存在的事件，一个指日志间隙或读取位置，混用会被编译器拒绝（[`2026-08-21-session-log-read-intent`](../../.agents/notes/archived/architecture/2026-08-21-session-log-read-intent.md)）。

## 试验面：`cordis_mount` / `cordis_unmount`

查询之后可以试验：在显式启用 `dsh-tool-cordis` 的组合里，模型可以在当前进程挂一个内存临时 Plugin，然后卸载到 quiescence。这不是默认能力。

- 挂载代码经过统一 schema 校验；错误在边界处失败，并给出可接受写法。
- 临时插件通过普通 `provide` / `inject` 语义互相组合，卸载后所有 contribution 消失。
- 挂载/卸载本身经 `tool/call` / `tool/result` 可见；工具集变化又落在 `request/header` 里，仍满足模型可见 ⟺ 已记录。
- 临时插件不落盘、不自动保存、不跨 resume；要保留就回到 [`04`](./04-participation-paths.md) 的正规参与路径。

这条试验面让「不懂行」的读者可以用最小代价验证「如果我这样注册，会发生什么」，而不必猜源码。`[原文]` 同时要记住它是 **opt-in、bash-equivalent trust**，不是安全边界，也不应进默认产品组合。

> This is an opt-in development tool with bash-equivalent trust, not a security boundary or product default.
>
> —— `.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md:17`（基线 `fb2c4b9e69…`）

> `cordis_inspect` sections are `services` ... `api` ... `events` ... and `temporary` ...
>
> —— 同上文件 `:27`（基线 `fb2c4b9e69…`）

## 动态不等于模型面不稳定

一个常见怀疑：运行时动态装卸插件，是否会让每轮 prompt 都变、缓存全废。dsh 的处理是**把「动态变化」和「模型可见变化」分开**：

- 每 step 重新读取插件图，但 prompt section、工具 schema、历史前缀稳定时，重新组装仍得到相同前缀；
- 真正使模型面失效的是变化穿透到请求：工具集改变、section 改写、模型切换、compaction 替换历史；
- `request/header` 快照记录实际生效的请求面，模型可见 ⟺ 已记录由 invariant 断言。

`[推断]` 这个「动态控制平面（dynamic control plane） vs 稳定模型面（stable model surface）」的区分可以从 DSH 的 turn flow 与 request/header 机制推出；仓库落点见 [`docs/architecture.md`](../../docs/architecture.md) 的 turn flow。它说明 dsh 的运行时动态没有牺牲读者最需要的稳定性——变化有明确的可见边界。

> **Model-visible means logged.** Anything that reaches a model request must be reconstructable from the log, and a runtime invariant asserts it.
>
> —— `docs/architecture.md:121`（基线 `fb2c4b9e69…`）

> The loop builds each request from logged state. `EpochHeader` records call config, marks the fields supplied by adapter defaults, and records the authoritative returned tool order ... through full `request/header` snapshots. The rendered prompt is derived history ... so the header and the derived history together make the request reconstructable from the session log.
>
> —— `docs/subsystems/llm-streaming.md:704`（基线 `fb2c4b9e69…`）

## 结论

静态可读性（[`02`](./02-legibility.md)）解决「知道有什么」；动态可读性解决「这次运行是什么」和「我的假设成不成立」。dump 问组合，生成目录问源码合同，`cordis_inspect` 问活运行时，读意图 API 问日志，`cordis_mount` 做最小试验。五者合起来，coding agent 就有了一个不需要资深同事在场的问答回路。

`[推断]` 一个可执行的阅读路径是：先看 `dsh --dump-config` 输出的配置树，再追踪 `ctx.provide` / `inject`、Context realm 与 Fiber effect，最后沿 Session event 到 `deriveMessages()` 检查模型实际看到什么。落点分别在 [`docs/architecture.md`](../../docs/architecture.md)、[`docs/cordis-api/context.md`](../../docs/cordis-api/context.md)、[`docs/cordis-api/fiber.md`](../../docs/cordis-api/fiber.md)、[`docs/subsystems/session.md`](../../docs/subsystems/session.md)。

## 证据入口

- [`docs/architecture.md`](../../docs/architecture.md)（第 121 行；model-visible ⟺ logged）
- [`docs/config-catalog.md`](../../docs/config-catalog.md) / [`docs/tool-catalog.md`](../../docs/tool-catalog.md) / [`docs/persistence-catalog.md`](../../docs/persistence-catalog.md)（生成目录实例）
- [`docs/event-producer-consumer.md`](../../docs/event-producer-consumer.md)（事件索引）
- [`2026-07-08-self-referential-cordis-toolset`](../../.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md)（第 17、23、27 行；inspect / mount / unmount 的合同与边界）
- [`../../packages/extensions/tool-cordis/README.md`](../../packages/extensions/tool-cordis/README.md)（工具包合同）
- [`docs/tool-execution-pipeline.md`](../../docs/tool-execution-pipeline.md)（工具执行管道）
- [`2026-07-05-reconstructable-requests`](../../.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md)（请求面变化与重建）
