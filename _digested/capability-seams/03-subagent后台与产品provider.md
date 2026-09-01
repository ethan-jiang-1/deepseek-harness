# Subagent 后台策略与产品 provider opt-in

源码核验入口：`packages/subagent/tool-subagent/`、`packages/bundle/base/README.md`、`apps/cli/config/agent-presets/*/agent.cordis.yml`。

Consumer 仍然只 inject `ctx.subagents`。后台生命周期和「这个产品 provider 装没装」是两件独立的组合决定，不要写进 Definition。

## `backgroundMode`

`dsh-tool-subagent` 的配置同时选择后台路由，以及省略 `run_in_background` 时的默认行为。

| 值 | 省略参数时 | 显式后台 | 返回值 | 后续谁管 |
|----|------------|----------|--------|----------|
| `one-shot`（默认） | 前台等待 | 父级拥有的普通 Task | `{ kind: 'background', jobId }`，文案 `started background subagent job <id>` | 通用 `job_output` / `job_kill` |
| `continuable` | 后台跑 | 前台等待要显式 `false` | `{ kind: 'continuable', subagentId }`，文案 `started subagent <id>` | child 自己的 turn；transcript 按 id 读；可选 `send_message` |

`continuable` 要求 provider 具备 `prepareContinuable`，调用 `ctx.subagents.startContinuable()`，在 inbox 接受时结算：此后 child 拥有自己的轮次，这个 tool 调用既不等待也不收集结果。`one-shot` 即使 provider 能 continuable，后台也走 Job，不走可续 child。

`enableRunInBackground: false` 隐藏参数，并拒绝强制后台调用。取消不能把产品 provider 的启动/回滚 `AggregateError` 改写成干净的 `killed` Job。

shipped preset 里，`subagent_fork` 用 `backgroundMode: continuable`；Codex / Claude Code 的 tool 行用 `one-shot`，并且默认 `disabled: true`。

## 产品 provider 挂在哪

生产 `dsh` 的 `dsh-base` 不依赖、也不挂载可选的 Codex / Claude Code provider。它们是独立的 Profile Bundle，用 `dsh plugin --profile <name> add @deepseek-ai/dsh-subagent-codex` 装进 profile；每个 Bundle 拥有自己的 host 可用性，restart 后在 host 平面注册一个 dormant 默认 provider，且只使用它自己 pin 的包内平台 CLI。要启用时：

1. 安装对应 Bundle 并 restart，让 Host 注册该 provider（进程级单例）。
2. 复制 shipped preset，去掉对应 tool 行的 `disabled`，让从这个 preset 组成的 agent 看见委托工具。

不要把产品 provider 再插进每个 agent 的 isolate realm。tool 行只决定「这个 agent 能不能调用」，不负责再 mount 一份 provider。安装 Bundle 或组合 preset 行都不会启动产品、认证账号、选模型或探测凭据。

## Subagent model routing 通过 DSH SDK

上游 #2868 使 subagent 可通过 DSH SDK 进行动态 model routing。`subagent-dsh-sdk` provider 将 child model 选择委托给 SDK 内置路由，而不是在 provider 实现中硬编码 DeepSeek 或 Claude 的名称。这使 `send_message` 继承父 agent 的 model 选择，而不再依赖 provider 的默认 model。

`subagent-dsh-sdk` provider 在 `packages/subagent/subagent-dsh-sdk/` 中实现，`packages/subagent/tool-subagent/` 的 `backgroundMode` 策略不受影响。
