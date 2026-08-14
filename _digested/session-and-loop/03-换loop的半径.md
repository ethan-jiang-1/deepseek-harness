# `dsh-agent` 与 `dsh-agent-loop`：换 loop 的半径

> 基线 `47f943859bef60e4160492346772ded9b24f765a`。`packages/core/agent/src/index.ts` `AgentRegistry` / `AgentFactory`、`packages/core/agent/src/runtime-types.ts` `Agent`、`packages/core/agent-loop/src/agent.ts` `ReactLoopAgent`、`packages/core/agent-loop/src/index.ts` `AgentLoop`。

介绍篇写 UI / hook / 工具依赖 `dsh-agent`，不依赖具体 loop。这是**产品合同方向**。这篇把接口、工厂、以及今天谁仍 import `dsh-agent-loop` 写清楚。

![产品面对 ctx.agents](./figures/factory-radius.svg)

## 接口在 agent，驱动在 loop

`ctx.agents` 是 `AgentRegistry`（`dsh-agent`）。它跟踪活着的 agent，做 process-local initiator（`AsyncLocalStorage`），**不**实现 turn。创建委托给 `AgentFactory`：

- `createAgent(ownerCtx, options)` — 调用方提供 `sessionId`；setup 窗口 → commit → 登记 session 与 agent → `agent/session-start` → 才启动驱动。
- `resume(ownerCtx, options)` — 先 `sessionPersistence.prepare`。

loop 插件（`AgentLoop`）构造时 `setFactory(this)`。没有 factory：`no agent factory registered (load an agent-loop plugin)`。ACP 等消费者对着 `ctx.agents` 编程，package 依赖写 `dsh-agent`。

`Agent` 句柄（loop 必须实现）包括：`id` / `options` / `session` / `inbox` / `status` / `ctx`，以及 `followup` / `steer` / `inject` / `cancel` / `runMaintenance` / `whenIdle`。`agent.ctx` 是 `createScope(loopCtx, this)` 之后 `extend({ agent: this })`。scope key 就是这个活对象；没有树状继承。

## setup 窗口

`CreateAgentOptions.setup` 在 agent **未发布**时跑。这里只注册（preset 的 isolate 服务行、scoped 工具），不 `followup`。失败则回滚：已经发出去的 `agent` / `session` 创建通知，会有配对的 `agent/disposed` / `session/disposed`。

`ownerCtx` 是 `create()` 调用方的 fiber，不是 factory 自己的注册 ctx。所有权跟调用方走。

## 换 loop 要保住什么

新驱动只要：

1. 实现 `Agent` + `AgentFactory`，`setFactory`。
2. 仍往同一条 session log 写（同一套 `SessionEventMap` 核心键，同一 surface 规则）。
3. 仍发同一类活扩展点：`agent/pre-step`（waterfall）、`agent/turn-stopping`（serial）、`agent/request`、`agent/status`、inbox 通知。
4. `deriveMessages()` 仍是请求历史的唯一来源。

渲染面、多数 tool、`ctx.commands` 可以不动。

## 今天真实半径大于介绍句

`dsh-base` 把 `@deepseek-ai/dsh-agent-loop` 挂进默认树——换 loop 至少要 patch 掉这一行。

生产包里**直接依赖** `dsh-agent-loop` 的，不止测试工具。例如：`goal-round-driver`、`compaction-basic`、`hooks-claude-code` / `hooks-codex`、若干 subagent provider、`session-checkpoint-policy`、`plan-mode`。它们有的听 loop 假设的 turn 节奏，有的用 `dsh-agent-loop-testkit` 当 devDependency 但 runtime 也写了 loop 包。

UI 包（`client/ui-*`）、`dsh-commands`、多数 tool 的 runtime 依赖停在 `dsh-agent`。这才是「换 loop 渲染面不动」的那一批。

所以：换 loop **不是**改一个文件。半径 = Factory 合同 + 仍写同一条 log + 把默认 bundle 里的 loop 行换掉 + 审计那些 import 了 `@deepseek-ai/dsh-agent-loop` 的生产包。介绍句是设计目标；`package.json` 是当前耦合图。
