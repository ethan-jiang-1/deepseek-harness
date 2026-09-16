# Subagent 后台策略与产品 provider opt-in

源码核验入口：`packages/subagent/tool-subagent/`、`packages/bundle/base/README.md`、`packages/preset/agent-presets/presets/*/agent.cordis.yml`。

Consumer 仍然只 inject `ctx.subagents`。后台生命周期和「这个产品 provider 装没装」是两件独立的组合决定，不要写进 Definition。

## `backgroundMode`

`dsh-tool-subagent` 的配置同时选择后台路由，以及省略 `run_in_background` 时的默认行为。

| 值 | 省略参数时 | 显式后台 | 返回值 | 后续谁管 |
|----|------------|----------|--------|----------|
| `one-shot`（默认） | 前台等待 | 父级拥有的普通 Task | `{ kind: 'background', jobId }`，文案 `started background subagent job <id>` | 通用 `job_output` / `job_kill` |
| `continuable` | 后台跑 | 前台等待要显式 `false` | `{ kind: 'continuable', subagentId }`，文案 `started subagent <id>` | child 自己的 turn；transcript 按 id 读；可选 `send_message` |

`continuable` 要求 provider 具备 `prepareContinuable`，调用 `ctx.subagents.startContinuable()`，在 inbox 接受时结算：此后 child 拥有自己的轮次，这个 tool 调用既不等待也不收集结果。`one-shot` 即使 provider 能 continuable，后台也走 Job，不走可续 child。

`enableRunInBackground: false` 隐藏参数，并拒绝强制后台调用。取消不能把产品 provider 的启动/回滚 `AggregateError` 改写成干净的 `killed` Job。

shipped preset 里，主 `subagent` 行（`provider: spawn`）与 `subagent_fork` 行都用 `backgroundMode: continuable`（`packages/preset/agent-presets/presets/cordis/agent.cordis.yml:175`，alpha.3 起即如此；同行 `:174` 现在是 `modelSelectionSettings: true`）；Codex / Claude Code 的 tool 行用 `one-shot`，并且默认 `disabled: true`。

## 相邻 Agent 消息与 steer

Service Definition 的 `sendMessage`（`packages/subagent/subagent/src/index.ts:246-253`，模块 doc 原话 "steers between adjacent Agents without exposing whether a child is resident"）是模型侧相邻 Agent 消息的入口：目标子代理仍在运行时，消息 steer 它最近的 step；idle 则开一个新 turn。这条路径不返回答案，只确认消息送达（tool 文案见 `packages/subagent/tool-subagent/src/index.ts:386`）。

标准 `send_message` 工具由 `packages/subagent/tool-subagent-control/` 注册，并经 `packages/subagent/subagent/src/internal.ts` 的 `markAdjacentAgentSendMessageTool` 以 symbol 打上标准工具标记（`packages/subagent/tool-subagent-control/src/index.ts:29`）。host 侧协议消息走同一个内部符号点，但拆成 Queue / Steer 两种语义；它仍是私有的 symbol-keyed 方法，不扩大公开 Definition（见下节与 [`05-subagent-catalog与host交付.md`](./05-subagent-catalog与host交付.md)）。

`tool-subagent-report` 包在 **0.1.2-rc.1 基线（`a66e470204`）之前**就已删除（merge `b91e7ce3` 是 OLD 的祖先），本次 0.1.2-rc.1 → 0.1.5-rc.1 跨度内它始终不存在——旧账不要记到这次同步头上。后台子代理跑完后的回传由 runtime settle notice 承担（`packages/subagent/tool-subagent/src/index.ts:386`："When that run settles, the runtime sends the parent a notice containing its outcome and any final assistant message"），child 不再需要 child-only `report` tool。随之消失的还有 fork continuable 的 KV 前缀代价机制：`packages/bundle/base/cordis.patch.yml` 的 `tool-subagent-fork` 注释由「continuable 引入 child-only `report` tool + prompt section 使继承前缀失效」改为「preset 层可选 continuable，无需 child-only section」。

## 产品 provider 挂在哪

生产 `dsh` 的 `dsh-base` 不依赖、也不挂载可选的 Codex / Claude Code provider。它们是独立的 Profile Bundle，用 `dsh plugin --profile <name> add @deepseek-ai/dsh-subagent-codex` 装进 profile；每个 Bundle 拥有自己的 host 可用性，restart 后在 host 平面注册一个 dormant 默认 provider，且只使用它自己 pin 的包内平台 CLI。要启用时：

1. 安装对应 Bundle 并 restart，让 Host 注册该 provider（进程级单例）。
2. 复制 shipped preset，去掉对应 tool 行的 `disabled`，让从这个 preset 组成的 agent 看见委托工具。

不要把产品 provider 再插进每个 agent 的 isolate realm。tool 行只决定「这个 agent 能不能调用」，不负责再 mount 一份 provider。安装 Bundle 或组合 preset 行都不会启动产品、认证账号、选模型或探测凭据。

## Subagent model routing 通过 DSH SDK

上游 #2868 给 `SubagentProvider` 增加可选 `agentRouteDefaults`（`packages/subagent/subagent/src/types.ts:361`）：provider 据此声明配置化的 route 默认值，`subagent-dsh-sdk` 即其配置的 `deepseek-official` / `deepseek-v4-flash`（`packages/subagent/subagent-dsh-sdk/src/index.ts:136`、`:141`）。调用未指名 provider/model 时落到这组 provider 默认，不是「继承父 agent」；解析走逐调用 `agentOptions` 白名单（provider / model / reasoningEffort / maxTokens）加 route preflight（`packages/subagent/tool-subagent/src/index.ts:502` 的 `preflightChildLlmRoute` 调用），没有「SDK 内置路由」这个对应物。`subagent-dsh-sdk` 无 `prepareContinuable`，它的 child 不进 `send_message` / continuable 路径。该 provider 在 `packages/subagent/subagent-dsh-sdk/` 中实现，`packages/subagent/tool-subagent/` 的 `backgroundMode` 策略不受影响。

## parent-owned 子代理目录

父 Session 的 `subagent/catalog` 事件现在是 direct-child 发现的持久权威：每个成功创建事实写一条事件，`subagentCatalog` projection 负责物化（state version 2，`dsh-chunked-list` 以 64 项分块存储，fork 用 `inheritedEventCount` 过滤继承段）。它取代了已删除的 `descriptor-seed.ts`（`seedDescriptorTurn` 机制不存在了）。这只改变「父如何枚举与恢复 direct child」，不影响 `backgroundMode` 的 one-shot / continuable 路由。投影、写入点与失败语义见 [`05-subagent-catalog与host交付.md`](./05-subagent-catalog与host交付.md)。

## 宿主消息的 Queue / Steer 双交付

host / 浏览器通道现在可以选 `delivery: 'queue' | 'steer'`：Queue 把消息排成 child 的独立 turn，Steer 插到最近的 step。协议经私有 symbol `deliverSubagentPrompt` 进入，`SubagentInbox.deliver` 据此分派 `followup()` / `steer()`，并在 activation 正在关闭时以 `ACTIVATION_CLOSING` 拒绝。**模型侧 `send_message` 不随这条 host 通道扩展**——它仍然是单一 steer 语义。协议面与 `prompt` Remote 的 `delivery` 字段见 [`05-subagent-catalog与host交付.md`](./05-subagent-catalog与host交付.md)。
