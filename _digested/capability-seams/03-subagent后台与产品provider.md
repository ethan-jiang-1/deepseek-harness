# Subagent 受管 activation 与产品 provider opt-in

源码核验入口：`packages/subagent/subagent/`、`packages/subagent/tool-subagent/`、`packages/subagent/tool-subagent-control/`、`packages/boot/app-boot/src/official-bundle-packages.ts`、shipped preset 声明 `packages/bundle/web-app/presets/*.patch.yml`（0.1.7 线起；旧 `packages/preset/agent-presets/presets/*/agent.cordis.yml` 已随重设计删除）。

Consumer 仍然只 inject `ctx.subagents`。执行生命期和「这个产品 provider 装没装」是两件独立的组合决定，不要写进 Definition。

## 受管 activation 取代 `backgroundMode`（0.2.1 线）

`dsh-tool-subagent` 删除 `backgroundMode`、`enableRunInBackground` 与模型参数 `run_in_background`（升级指引 [`subagent-activations`](../../docs/upgrade-guide/v0.2.1-alpha.1/subagent-activations/guide.md)）。每次委派都调 `ctx.subagents.startActivation`（`packages/subagent/tool-subagent/src/index.ts:330`，`delivery: 'parent'`），成功接纳后立即返回 `{ kind: 'activation', subagentId }`（同文件 `:337`）；工具描述写明 "This tool starts an independently managed subagent and immediately returns its id. The runtime notifies you when it finishes."（`:215`）。前台结果与 `{ kind: 'background', jobId }` 都已不存在，subagent 不再经 `job_output` / `job_kill` 收集或停止；中止当前执行走 `interrupt_agent`（`packages/subagent/tool-subagent-control/src/index.ts:75`）。

provider 有没有 `prepareContinuable`（`packages/subagent/subagent/src/types.ts:355`）区分两条后续路径（工具描述 `:216`-`:218`）：本地 child（spawn / fork）可以 `send_message` 继续；外部 provider 执行一次，完成通知带最终答案，不收后续消息。委派深度由 `maxDepth` 控制——非负安全整数（`0` 禁止再委派）或 `'provider-managed'`，数字上限要求 provider 具备 `depthLimit` 能力（`packages/subagent/tool-subagent/src/index.ts:77`、`:98`）。

## preset 组成取代 persona / toolFilter

`dsh-tool-subagent` 拒绝 `persona` 与 `toolFilter` 配置；spawn 用 `agentPreset` 选一份 Agent Preset，`allowedAgentPresets` 让父模型在多个已声明 preset 中挑一个（`packages/subagent/tool-subagent/src/index.ts:96`-`:97`）。不做选择时本地 child 加入父级当前 preset revision；fork 与外部后端拒绝该选项。冷恢复按历史 child descriptor 里记录的 persona 与工具限制挂载，preset 选中还先记一条 `agent-preset/selected`（`packages/subagent/subagent/README.md:65`、`:128`）。升级指引 [`subagent-preset-composition`](../../docs/upgrade-guide/v0.2.1-alpha.1/subagent-preset-composition/guide.md)。

## 相邻 Agent 消息与 steer

Service Definition 的 `sendMessage`（`packages/subagent/subagent/src/index.ts:310`）是模型侧相邻 Agent 消息的入口：目标子代理仍在运行时，消息 steer 它最近的 step；idle 则开一个新 turn，缺席的 direct child 从持久化冷恢复。这条路径不返回答案，只确认消息送达。

标准 `send_message` 工具由 `packages/subagent/tool-subagent-control/` 注册（`packages/subagent/tool-subagent-control/src/index.ts:29`），并经 `packages/subagent/subagent/src/internal.ts` 的 `markAdjacentAgentSendMessageTool` 以 symbol 打上标准工具标记（`packages/subagent/subagent/src/internal.ts:22`）。host 侧协议消息走同一组私有 symbol，但拆成 Queue / Steer 两种语义（见 [`05-subagent-catalog与host交付.md`](./05-subagent-catalog与host交付.md)）。

## 产品 provider 挂在哪

生产 `dsh` 的 `dsh-base` 不依赖、也不挂载可选的 Codex / Claude Code provider。它们按 on-demand bundle 交付（`ON_DEMAND_BUNDLES`，`packages/boot/app-boot/src/official-bundle-packages.ts:5`-`:6`），在 Plugins → Official 里按需装上、restart 后在 host 平面注册一个 dormant 默认 provider，且只使用它自己 pin 的包内平台 CLI。0.2.1 线起被选中的 bundle 同时把委派工具注册成 Host 全局工具（行 id `tool-subagent-codex` / `tool-subagent-claude-code`），每个 preset（含 `minimal`）都能看见它，关闭 bundle 后从下一次请求起消失；`maxDepth: provider-managed` 对这些原生 provider 仍然有效（升级指引 [`native-subagent-bundle-tools`](../../docs/upgrade-guide/v0.2.1-alpha.1/native-subagent-bundle-tools/guide.md)）。

不要把产品 provider 再插进每个 agent 的 isolate realm。tool 行只决定「这个 agent 能不能调用」，不负责再 mount 一份 provider。安装 Bundle 或组合 preset 行都不会启动产品、认证账号、选模型或探测凭据。

## Subagent model routing 通过 DSH SDK

上游 #2868 给 `SubagentProvider` 增加可选 `agentRouteDefaults`（`packages/subagent/subagent/src/types.ts:330`）：provider 据此声明配置化的 route 默认值，`subagent-dsh-sdk` 即其配置的 `deepseek-official` / `deepseek-v4-flash`（`packages/subagent/subagent-dsh-sdk/src/index.ts:126`、`:131`）。调用未指名 provider/model 时落到这组 provider 默认，不是「继承父 agent」；解析走逐调用 `agentOptions` 白名单（provider / model / reasoningEffort / maxTokens）加 route preflight（`packages/subagent/tool-subagent/src/index.ts:308` 的 `preflightChildLlmRoute` 调用），没有「SDK 内置路由」这个对应物。`subagent-dsh-sdk` 无 `prepareContinuable`，它的 child 属外部执行、不进 `send_message` 续聊路径。

## parent-owned 子代理目录

父 Session 的 `subagent/catalog` 事件是 direct-child 发现的持久权威：每个成功创建事实写一条事件，`subagentCatalog` projection 负责物化（`stateVersion: 6`，payload version 0 / 1 / 2，`dsh-chunked-list` 分块存储，fork 用 `inheritedEventCount` 过滤继承段），取代了已删除的 `descriptor-seed.ts`。这改变的是「父如何枚举与恢复 direct child」，不是 activation 的执行与通知路由。投影、写入点与失败语义见 [`05-subagent-catalog与host交付.md`](./05-subagent-catalog与host交付.md)。

## 宿主消息的 Queue / Steer 双交付

host / 浏览器通道可以选 `delivery: 'queue' | 'steer'`：Queue 把消息排成 child 的独立 turn，Steer 插到最近的 step。协议经私有 symbol `deliverSubagentPrompt` 进入，manager 据此分派 `queuePrompt()` / `steerPrompt()`（`packages/subagent/subagent/src/manager.ts:585`、`:604`）。**模型侧 `send_message` 不随这条 host 通道扩展**——它仍然是单一 steer 语义。协议面与 `prompt` Remote 的 `delivery` 字段见 [`05-subagent-catalog与host交付.md`](./05-subagent-catalog与host交付.md)。
