# `dsh-agent` 与 `dsh-agent-loop`：换 loop 的半径

源码核验入口：`packages/core/agent/src/index.ts` `AgentRegistry` / `AgentFactory`、`packages/core/agent/src/runtime-types.ts` `Agent`、`packages/core/agent-loop/src/agent.ts` `ReactLoopAgent`、`packages/core/agent-loop/src/index.ts` `AgentLoop`。

运行时消费者面向 `dsh-agent` 的 `Agent` 与 `AgentFactory` 编程；composition、demo 和测试包可以显式选择默认 `dsh-agent-loop`。

![产品面对 ctx.agents](./figures/factory-radius.svg)

## 接口在 agent，驱动在 loop

`ctx.agents` 是 `AgentRegistry`（`dsh-agent`）。它跟踪活着的 agent，提供 process-local initiator（`AsyncLocalStorage`），但不实现 turn。创建委托给 `AgentFactory`：

- `createAgent(ownerCtx, options)` — 调用方提供 `sessionId`；setup 窗口 → commit → 登记 session 与 agent → `agent/session-start`。该事件是第一个允许提交启动输入的扩展点；真正的 turn 由 waking input 驱动。
- `resume(ownerCtx, options)` — 先 `sessionPersistence.prepare`。

默认 loop 插件在构造时调用 `ctx.agents.setFactory(this)`。没有 factory 时，`create` / `resume` 抛出 `no agent factory registered (load an agent-loop plugin)`。ACP 等消费者对着 `ctx.agents` 编程，不需要导入 `ReactLoopAgent`。

`Agent` 句柄的字段、驱动方法和生命周期语义由 `dsh-agent` 的公开接口定义。`agent.ctx` 是该 agent 的注册 scope；工具、提示词和监听器在这里登记即可获得 agent-local 生命周期，不应依赖 `ReactLoopAgent` 的私有 `kick` / `turn` / `step`。

## setup 窗口

`CreateAgentOptions.setup` 在 agent 和 session 都未发布时运行。这里只组合 preset 的 isolate 服务行、scoped 工具等贡献，不驱动 agent。setup 或同步 publication commit 失败会撤销 scope，且不会发布任何 id；若后续创建通知或 `agent/session-start` 监听器失败，已经开始的 `session/created` / `agent/created` 通知会由配对的 disposed 通知收束。

`ownerCtx` 是 `create()` 调用方的 fiber，不是 factory 自己的注册 ctx。所有权跟调用方走。

## 兼容现有 surface 的义务

替换驱动必须：

1. 实现 `AgentFactory` 和公开 `Agent` 接口，并用 `ctx.agents.setFactory()` 注册唯一 factory。
2. 保持 session 生命周期和日志语义：turn / step、模型可见输入、tool call / result 与 `request/header` 仍可从同一日志重建。
3. 按 `AgentEventMap` 声明的 mode 和 agent scope 派发实时事件；尤其不能把 waterfall 与 serial 互换。
4. 从 `session.deriveMessages()` 取得请求历史，并让 loop 的请求重建 invariant 能把实际 LLM 请求对回日志。

满足这些接口后，渲染面、按 `agent.ctx` 登记的插件与人类 command 无需知道私有驱动结构。

## 组合与包依赖

默认 profile 由 [`packages/bundle/base/cordis.patch.yml`](../../packages/bundle/base/cordis.patch.yml) 的 `agent-loop` 行挂载 `@deepseek-ai/dsh-agent-loop`，相应安装依赖在 [`packages/bundle/base/package.json`](../../packages/bundle/base/package.json)。替换默认驱动必须一起替换组合行并确保新包可由 profile 解析。

其它包是否直接依赖默认 loop，以各自 `package.json` 和 import 为准；生成的 [`docs/module-graph.md`](../../docs/module-graph.md) 提供源码依赖索引。测试为了组装真实驱动而声明的 devDependency 不会扩大运行时 `Agent` 接口。

替换半径因此由三部分组成：公开 factory / agent 接口、日志与 `agent/*` 语义、默认 profile 的组合行。私有 loop 方法和测试装配不属于兼容接口。
