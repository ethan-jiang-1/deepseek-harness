# `_coverage` — 源码消化核验矩阵

本页记录 `_digested` 明确回答了哪些问题、结论住在哪篇机制参考、最后对哪个产品源码 commit 复核。它不按篇数估算“完成度”，也不承诺覆盖未列出的包或行为；完整包组清单由 [`packages/README.md`](../../packages/README.md) 维护。

<!-- catalog:coverage:start -->
产品源码基线：`b830ec950faba0a46dda564be3e2d854afed94f1`（`dsh-v0.2.1-rc.5`）。本块由 [`render-indexes.mjs`](../render-indexes.mjs) 从 [`catalog.json`](../catalog.json) 生成；不要手改。

## 专题总览

| 专题 | 范围 | 页数 | 已核验 | 沿用 | 未登记 |
|---|---|---:|---:|---:|---:|
| [`system-overview/`](../system-overview/00-map.md) | 按下回车之后，插件怎么拼成一次能跑的对话；扩展点、单 loop 对照与门禁/基准。 | 4 | 0 | 4 | 0 |
| [`two-tree-runtime/`](../two-tree-runtime/00-map.md) | 同一套 Cordis 在 Node 与浏览器各长一棵树，中间是类型化的线；一条会话事件穿过两棵树。 | 3 | 3 | 0 | 0 |
| [`two-tree-runtime/framework/`](../two-tree-runtime/framework/00-map.md) | 两棵树共用的框架本体：五原语、waterfall、Loader/Include、vendor 本地修改。 | 6 | 2 | 4 | 0 |
| [`two-tree-runtime/client/`](../two-tree-runtime/client/00-map.md) | 分层与单向依赖、模块身份与激活、浏览器启动、状态所有权、资源与视图、插件纪律。 | 16 | 5 | 11 | 0 |
| [`two-tree-runtime/remote/`](../two-tree-runtime/remote/00-map.md) | Typert 声明、Gateway 派发、载体与认证、两条出站链路与 wire 校验。 | 9 | 6 | 3 | 0 |
| [`runtime-profiles/`](../runtime-profiles/00-map.md) | 一次启动装入什么：五个 launcher profile 与 desktop 应用自有 profile 的组合、差异与装载路径。 | 7 | 2 | 5 | 0 |
| [`session-and-loop/`](../session-and-loop/00-map.md) | 会话存在哪、怎么读回来：事件映射、inbox/turn 时序、换 loop 的半径、格式世代。 | 5 | 0 | 5 | 0 |
| [`agent-loop/`](../agent-loop/00-map.md) | 一次对话怎么推进与收尾：turn/step/activity/goal 边界、goal 状态机与自动续轮。 | 5 | 0 | 5 | 0 |
| [`delegation-and-orchestration/`](../delegation-and-orchestration/00-map.md) | 入门三页 + 两条座位：驾驶座看原语机制与选择，作者座看组合、合同、终态与观测；含九条陷阱与源码入口。 | 4 | 4 | 0 | 0 |
| [`delegation-and-orchestration/delegation-primitives/`](../delegation-and-orchestration/delegation-primitives/00-map.md) | 每个原语是什么、保证什么、隔离什么、谁推进、怎么结算。 | 8 | 2 | 6 | 0 |
| [`delegation-and-orchestration/primitive-selection/`](../delegation-and-orchestration/primitive-selection/00-map.md) | 官方边界句、互路由、升级阶梯、没说清的部分。 | 4 | 3 | 1 | 0 |
| [`delegation-and-orchestration/preset-composition-and-contract-placement/`](../delegation-and-orchestration/preset-composition-and-contract-placement/00-map.md) | 能力面怎么组合、怎么收窄、合同放哪、深度与通知怎么叠加。 | 7 | 7 | 0 | 0 |
| [`delegation-and-orchestration/completion-and-observation/`](../delegation-and-orchestration/completion-and-observation/00-map.md) | 五个完成时刻、谱系、状态三分、workflow 可复现性，及后续图投影与证据分层。 | 8 | 4 | 4 | 0 |
| [`delegation-and-orchestration/design-perspectives/`](../delegation-and-orchestration/design-perspectives/00-map.md) | 为什么是这个形状、外部叙事逐条对照、九条陷阱。 | 5 | 3 | 2 | 0 |
| [`capability-seams/`](../capability-seams/00-map.md) | 同一能力有多个实现时怎么换而不改调用方；从 bash 到 SSH、MCP、hooks 与新执行面。 | 11 | 0 | 11 | 0 |
| [`plugin-system/`](../plugin-system/00-map.md) | 插件系统的三个轴：有什么、怎么成树、怎么走完一生；对外暴露另见 two-tree-runtime。 | 1 | 1 | 0 | 0 |
| [`plugin-system/composition/`](../plugin-system/composition/00-map.md) | 一份 profile 怎么叠成运行中的插件树；dump、HMR、启动窗口与首屏交接。 | 6 | 1 | 5 | 0 |
| [`plugin-system/lifecycle/`](../plugin-system/lifecycle/00-map.md) | 插件从打包到卸载的七段；安装、启动、首启、配置、诊断、信任与端到端。 | 13 | 5 | 8 | 0 |
| [`plugin-system/inventory/`](../plugin-system/inventory/00-map.md) | 现成包、服务与工具的横切清单、复用出路与分类法。 | 6 | 0 | 6 | 0 |
| [`experimental/`](../experimental/00-map.md) | 已评估但未承诺产品支持的实验能力：Python 子进程、Agent Teams、Inspector。 | 4 | 0 | 4 | 0 |
| [`tools-prompt-llm/`](../tools-prompt-llm/00-map.md) | 模型每一步看见什么：工具清单、系统提示词、历史投影与内容块。 | 7 | 0 | 7 | 0 |
| [`surfaces-entrypoints/`](../surfaces-entrypoints/00-map.md) | 人/程序从哪里进：CLI、headless、Web、ACP、SDK、桌面，以及它们复用的 runtime spine。 | 4 | 2 | 2 | 0 |
| [`test-strategy/`](../test-strategy/00-map.md) | DSH 怎么测：资产分布与成本、防漏机制、选层决策程序、CI 门禁、快照机制，以及插件项目的测试契约。 | 16 | 7 | 9 | 0 |
| [`development-flow/`](../development-flow/00-map.md) | DSH 的决策文档怎么立项、落地、忘记与回写：两轴路径编码、三生命周期义务、三个 leaf 门禁、状态转换的改写纪律、归档四分法与封印、命名与工程习惯、元环回写、六类执法者与诚实缺口。 | 9 | 9 | 0 | 0 |
| [`harness-idea/`](../harness-idea/00-map.md) | 判断层：dsh 这种 harness 形态做对了什么、边界与成本在哪、反馈如何回写。 | 10 | 0 | 10 | 0 |
| [`canon/`](../canon/00-map.md) | 宪章层：每个承重词的 repo 原文、它排除的写法、常规流程的名字与边界，以及生态做法的证据等级。 | 7 | 0 | 0 | 7 |

## 页面明细

### `system-overview/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../system-overview/00-map.md) | map | 沿用 | 687f282e86 | 页面声明 |
| [`01-扩展表非显然落点`](../system-overview/01-扩展表非显然落点.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`02-对照单一loop`](../system-overview/02-对照单一loop.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`03-门禁与性能基准`](../system-overview/03-门禁与性能基准.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |

### `two-tree-runtime/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../two-tree-runtime/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-一条会话事件穿过两棵树`](../two-tree-runtime/01-一条会话事件穿过两棵树.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`02-桌面-同一个形状的第三个落脚点`](../two-tree-runtime/02-桌面-同一个形状的第三个落脚点.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `two-tree-runtime/framework/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../two-tree-runtime/framework/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-五条原语对照源码`](../two-tree-runtime/framework/01-五条原语对照源码.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`02-waterfall-与事件合同`](../two-tree-runtime/framework/02-waterfall-与事件合同.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`03-loader-include-与js插值`](../two-tree-runtime/framework/03-loader-include-与js插值.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`04-vendor-本地修改`](../two-tree-runtime/framework/04-vendor-本地修改.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`05-group与isolate-realm`](../two-tree-runtime/framework/05-group与isolate-realm.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `two-tree-runtime/client/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../two-tree-runtime/client/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`rules/01-export-与包内目录`](../two-tree-runtime/client/rules/01-export-与包内目录.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`rules/02-依赖-构建期环境与三处注册面`](../two-tree-runtime/client/rules/02-依赖-构建期环境与三处注册面.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`rules/03-样式与本地化`](../two-tree-runtime/client/rules/03-样式与本地化.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`rules/04-测试阶梯与三道-gate`](../two-tree-runtime/client/rules/04-测试阶梯与三道-gate.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`state/01-谁拥有一份状态`](../two-tree-runtime/client/state/01-谁拥有一份状态.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`state/02-资源模型与-holder-生命周期`](../two-tree-runtime/client/state/02-资源模型与-holder-生命周期.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`state/03-会话窗口与-generation`](../two-tree-runtime/client/state/03-会话窗口与-generation.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`state/04-workspace-模型`](../two-tree-runtime/client/state/04-workspace-模型.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`tree/01-六层与单向依赖链`](../two-tree-runtime/client/tree/01-六层与单向依赖链.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`tree/02-模块身份与激活顺序`](../two-tree-runtime/client/tree/02-模块身份与激活顺序.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`tree/03-浏览器启动与首屏交接`](../two-tree-runtime/client/tree/03-浏览器启动与首屏交接.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`tree/04-客户端热更新与模块缓存`](../two-tree-runtime/client/tree/04-客户端热更新与模块缓存.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`view/01-slot-与-props-纪律`](../two-tree-runtime/client/view/01-slot-与-props-纪律.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`view/02-conversation-node-纪律`](../two-tree-runtime/client/view/02-conversation-node-纪律.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`view/03-右栏-与-document-preview`](../two-tree-runtime/client/view/03-右栏-与-document-preview.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |

### `two-tree-runtime/remote/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../two-tree-runtime/remote/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`connection/01-载体-rpcId-与逻辑流`](../two-tree-runtime/remote/connection/01-载体-rpcId-与逻辑流.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`connection/02-认证与浏览器宿主`](../two-tree-runtime/remote/connection/02-认证与浏览器宿主.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`gateway/01-Host-派发与访问控制`](../two-tree-runtime/remote/gateway/01-Host-派发与访问控制.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`gateway/02-客户端-mount-与装配`](../two-tree-runtime/remote/gateway/02-客户端-mount-与装配.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`streams/01-一条-emit-两条出站链路`](../two-tree-runtime/remote/streams/01-一条-emit-两条出站链路.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`streams/02-三类帧与-wire-校验`](../two-tree-runtime/remote/streams/02-三类帧与-wire-校验.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`typert/01-声明期-装饰器与-namespace`](../two-tree-runtime/remote/typert/01-声明期-装饰器与-namespace.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`typert/02-类型图与两族产物`](../two-tree-runtime/remote/typert/02-类型图与两族产物.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `runtime-profiles/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../runtime-profiles/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-web`](../runtime-profiles/01-web.md) | mechanism | 沿用 | b830ec950f | 专题声明 |
| [`02-headless`](../runtime-profiles/02-headless.md) | mechanism | 沿用 | b830ec950f | 专题声明 |
| [`03-sdk`](../runtime-profiles/03-sdk.md) | mechanism | 沿用 | b830ec950f | 专题声明 |
| [`04-sdk-minimal`](../runtime-profiles/04-sdk-minimal.md) | mechanism | 沿用 | b830ec950f | 专题声明 |
| [`05-acp`](../runtime-profiles/05-acp.md) | mechanism | 沿用 | b830ec950f | 专题声明 |
| [`06-desktop`](../runtime-profiles/06-desktop.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `session-and-loop/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../session-and-loop/00-map.md) | map | 沿用 | 687f282e86 | 页面声明 |
| [`01-session-event-map`](../session-and-loop/01-session-event-map.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`02-inbox-与turn-时序`](../session-and-loop/02-inbox-与turn-时序.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`03-换loop的半径`](../session-and-loop/03-换loop的半径.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`04-格式世代与迁移`](../session-and-loop/04-格式世代与迁移.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |

### `agent-loop/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../agent-loop/00-map.md) | map | 沿用 | 687f282e86 | 页面声明 |
| [`01-goal-lifecycle`](../agent-loop/01-goal-lifecycle.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`02-goal-round-driver`](../agent-loop/02-goal-round-driver.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`03-activity-vs-goal-boundaries`](../agent-loop/03-activity-vs-goal-boundaries.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`04-agent-runtime-identity`](../agent-loop/04-agent-runtime-identity.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |

### `delegation-and-orchestration/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../delegation-and-orchestration/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-one-task-five-ways`](../delegation-and-orchestration/01-one-task-five-ways.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`02-terms-and-planes`](../delegation-and-orchestration/02-terms-and-planes.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`03-newcomer-questions`](../delegation-and-orchestration/03-newcomer-questions.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `delegation-and-orchestration/delegation-primitives/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../delegation-and-orchestration/delegation-primitives/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-scripted-workflow-and-sandboxed-fan-out`](../delegation-and-orchestration/delegation-primitives/01-scripted-workflow-and-sandboxed-fan-out.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`02-bounded-delegation-with-fresh-and-forked-subagents`](../delegation-and-orchestration/delegation-primitives/02-bounded-delegation-with-fresh-and-forked-subagents.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`03-fresh-agent-iteration-loop-and-round-handoff`](../delegation-and-orchestration/delegation-primitives/03-fresh-agent-iteration-loop-and-round-handoff.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`04-cross-round-goals-and-the-round-driver`](../delegation-and-orchestration/delegation-primitives/04-cross-round-goals-and-the-round-driver.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`05-background-jobs-and-wall-clock-schedules`](../delegation-and-orchestration/delegation-primitives/05-background-jobs-and-wall-clock-schedules.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`06-persistent-teams-with-a-shared-task-board`](../delegation-and-orchestration/delegation-primitives/06-persistent-teams-with-a-shared-task-board.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`07-shipped-mount-state`](../delegation-and-orchestration/delegation-primitives/07-shipped-mount-state.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `delegation-and-orchestration/primitive-selection/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../delegation-and-orchestration/primitive-selection/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-per-primitive-usage-sentences-from-tool-descriptions`](../delegation-and-orchestration/primitive-selection/01-per-primitive-usage-sentences-from-tool-descriptions.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`02-cross-primitive-routing-and-the-official-upgrade-order`](../delegation-and-orchestration/primitive-selection/02-cross-primitive-routing-and-the-official-upgrade-order.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`03-unspecified-gaps-and-contradictions-in-usage-policy`](../delegation-and-orchestration/primitive-selection/03-unspecified-gaps-and-contradictions-in-usage-policy.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `delegation-and-orchestration/preset-composition-and-contract-placement/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../delegation-and-orchestration/preset-composition-and-contract-placement/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-channel-capability-differences-and-inheritance`](../delegation-and-orchestration/preset-composition-and-contract-placement/01-channel-capability-differences-and-inheritance.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`02-preset-composition-as-a-static-self-contained-model`](../delegation-and-orchestration/preset-composition-and-contract-placement/02-preset-composition-as-a-static-self-contained-model.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`03-worker-profiles-and-the-only-narrowing-lever`](../delegation-and-orchestration/preset-composition-and-contract-placement/03-worker-profiles-and-the-only-narrowing-lever.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`04-contract-placement-between-policy-and-engine`](../delegation-and-orchestration/preset-composition-and-contract-placement/04-contract-placement-between-policy-and-engine.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`05-ownership-depth-and-notification-channels`](../delegation-and-orchestration/preset-composition-and-contract-placement/05-ownership-depth-and-notification-channels.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`06-depth-concurrency-and-capacity-limits`](../delegation-and-orchestration/preset-composition-and-contract-placement/06-depth-concurrency-and-capacity-limits.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `delegation-and-orchestration/completion-and-observation/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../delegation-and-orchestration/completion-and-observation/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-acceptance-visibility-quiescence-and-disposal`](../delegation-and-orchestration/completion-and-observation/01-acceptance-visibility-quiescence-and-disposal.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`02-terminal-states-and-bounded-retry-authority`](../delegation-and-orchestration/completion-and-observation/02-terminal-states-and-bounded-retry-authority.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`03-session-lineage-and-agent-incarnation`](../delegation-and-orchestration/completion-and-observation/03-session-lineage-and-agent-incarnation.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`04-persistent-facts-derived-projections-and-live-authority`](../delegation-and-orchestration/completion-and-observation/04-persistent-facts-derived-projections-and-live-authority.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`05-delegation-graph-node-and-edge-projection`](../delegation-and-orchestration/completion-and-observation/05-delegation-graph-node-and-edge-projection.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`06-workflow-reproducibility-cancellation-and-missing-results`](../delegation-and-orchestration/completion-and-observation/06-workflow-reproducibility-cancellation-and-missing-results.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`07-evidence-layers-declaration-mount-mechanism-behaviour`](../delegation-and-orchestration/completion-and-observation/07-evidence-layers-declaration-mount-mechanism-behaviour.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `delegation-and-orchestration/design-perspectives/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../delegation-and-orchestration/design-perspectives/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-graph-computation-essence-invariant-derivation-and-execution`](../delegation-and-orchestration/design-perspectives/01-graph-computation-essence-invariant-derivation-and-execution.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`02-external-narratives-versus-source-truth`](../delegation-and-orchestration/design-perspectives/02-external-narratives-versus-source-truth.md) | mechanism | 沿用 | 687f282e86 | 矩阵沿用 |
| [`03-why-primitives-instead-of-a-central-scheduler`](../delegation-and-orchestration/design-perspectives/03-why-primitives-instead-of-a-central-scheduler.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`04-nine-traps-in-delegation-surfaces`](../delegation-and-orchestration/design-perspectives/04-nine-traps-in-delegation-surfaces.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `capability-seams/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../capability-seams/00-map.md) | map | 沿用 | 687f282e86 | 页面声明 |
| [`01-三角色与分包装`](../capability-seams/01-三角色与分包装.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`02-一次bash从tool到sandbox`](../capability-seams/02-一次bash从tool到sandbox.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`03-subagent后台与产品provider`](../capability-seams/03-subagent后台与产品provider.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`04-新增seam与Remote`](../capability-seams/04-新增seam与Remote.md) | mechanism | 沿用 | 687f282e86 | 页面声明 |
| [`05-subagent-catalog与host交付`](../capability-seams/05-subagent-catalog与host交付.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`06-外发代理策略`](../capability-seams/06-外发代理策略.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`07-原生containment与native-system`](../capability-seams/07-原生containment与native-system.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`08-外部生态桥：MCP与hooks`](../capability-seams/08-外部生态桥：MCP与hooks.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`09-ssh远程执行族`](../capability-seams/09-ssh远程执行族.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`10-新执行面与编排seam`](../capability-seams/10-新执行面与编排seam.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |

### `plugin-system/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../plugin-system/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |

### `plugin-system/composition/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../plugin-system/composition/00-map.md) | map | 沿用 | 687f282e86 | 页面声明 |
| [`01-boot-时序`](../plugin-system/composition/01-boot-时序.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`02-dump-与boot-保真`](../plugin-system/composition/02-dump-与boot-保真.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`03-user-patch-hmr`](../plugin-system/composition/03-user-patch-hmr.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`04-profile-创建与保留名`](../plugin-system/composition/04-profile-创建与保留名.md) | mechanism | 沿用 | 687f282e86 | 专题声明 |
| [`05-启动窗口与首屏交接`](../plugin-system/composition/05-启动窗口与首屏交接.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `plugin-system/lifecycle/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../plugin-system/lifecycle/00-map.md) | map | 沿用 | 1f81c047fc | 页面声明 |
| [`01-打包`](../plugin-system/lifecycle/01-打包.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |
| [`02-分发`](../plugin-system/lifecycle/02-分发.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |
| [`03-安装`](../plugin-system/lifecycle/03-安装.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |
| [`04-启动`](../plugin-system/lifecycle/04-启动.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |
| [`05-特殊初始化`](../plugin-system/lifecycle/05-特殊初始化.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |
| [`06-更新与启停`](../plugin-system/lifecycle/06-更新与启停.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |
| [`07-卸载与数据留存`](../plugin-system/lifecycle/07-卸载与数据留存.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |
| [`08-首启与产品初始化`](../plugin-system/lifecycle/08-首启与产品初始化.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`09-配置与设置面`](../plugin-system/lifecycle/09-配置与设置面.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`10-诊断地图`](../plugin-system/lifecycle/10-诊断地图.md) | playbook | 已核验 | b830ec950f | 页面声明 |
| [`11-信任与执行边界`](../plugin-system/lifecycle/11-信任与执行边界.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`12-从零到一个能跑的插件`](../plugin-system/lifecycle/12-从零到一个能跑的插件.md) | playbook | 已核验 | b830ec950f | 页面声明 |

### `plugin-system/inventory/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../plugin-system/inventory/00-map.md) | map | 沿用 | 1f81c047fc | 页面声明 |
| [`01-capability-tour`](../plugin-system/inventory/01-capability-tour.md) | mechanism | 沿用 | 1f81c047fc | 矩阵沿用 |
| [`02-plugin-catalog`](../plugin-system/inventory/02-plugin-catalog.md) | mechanism | 沿用 | 1f81c047fc | 矩阵沿用 |
| [`03-reference-lists`](../plugin-system/inventory/03-reference-lists.md) | mechanism | 沿用 | 1f81c047fc | 矩阵沿用 |
| [`04-reuse-paths-and-gaps`](../plugin-system/inventory/04-reuse-paths-and-gaps.md) | mechanism | 沿用 | 1f81c047fc | 矩阵沿用 |
| [`05-taxonomy-and-design`](../plugin-system/inventory/05-taxonomy-and-design.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |

### `experimental/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../experimental/00-map.md) | map | 沿用 | 687f282e86 | 页面声明 |
| [`01-code-runtime-python`](../experimental/01-code-runtime-python.md) | experiment | 沿用 | 687f282e86 | 专题声明 |
| [`02-agent-teams`](../experimental/02-agent-teams.md) | experiment | 沿用 | 687f282e86 | 专题声明 |
| [`03-inspector`](../experimental/03-inspector.md) | experiment | 沿用 | 687f282e86 | 专题声明 |

### `tools-prompt-llm/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../tools-prompt-llm/00-map.md) | map | 沿用 | 687f282e86 | 页面声明 |
| [`01-section顺序与前缀`](../tools-prompt-llm/01-section顺序与前缀.md) | mechanism | 沿用 | 687f282e86 | 页面声明 |
| [`02-管道审批timeout与chunk`](../tools-prompt-llm/02-管道审批timeout与chunk.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |
| [`03-system-prompt作为surface节点`](../tools-prompt-llm/03-system-prompt作为surface节点.md) | mechanism | 沿用 | 687f282e86 | 页面声明 |
| [`04-in-history提示词替换`](../tools-prompt-llm/04-in-history提示词替换.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |
| [`05-chunk到settlement`](../tools-prompt-llm/05-chunk到settlement.md) | mechanism | 沿用 | 687f282e86 | 页面声明 |
| [`06-文件块与内容块投影`](../tools-prompt-llm/06-文件块与内容块投影.md) | mechanism | 沿用 | 1f81c047fc | 页面声明 |

### `surfaces-entrypoints/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../surfaces-entrypoints/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-启动面与session流`](../surfaces-entrypoints/01-启动面与session流.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`02-acp与jsonrpc`](../surfaces-entrypoints/02-acp与jsonrpc.md) | mechanism | 沿用 | b830ec950f | 矩阵沿用 |
| [`03-桌面入口`](../surfaces-entrypoints/03-桌面入口.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `test-strategy/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../test-strategy/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-doctrine`](../test-strategy/01-doctrine.md) | mechanism | 沿用 | 639ed01539 | 专题声明 |
| [`02-tiers`](../test-strategy/02-tiers.md) | mechanism | 已核验 | b830ec950f | 专题声明 |
| [`03-asset-census`](../test-strategy/03-asset-census.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`04-anti-omission`](../test-strategy/04-anti-omission.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`05-decision-procedure`](../test-strategy/05-decision-procedure.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`06-rules-ownership`](../test-strategy/06-rules-ownership.md) | mechanism | 沿用 | 639ed01539 | 专题声明 |
| [`07-ci-gates`](../test-strategy/07-ci-gates.md) | mechanism | 沿用 | 639ed01539 | 专题声明 |
| [`08-reliability`](../test-strategy/08-reliability.md) | mechanism | 沿用 | 639ed01539 | 专题声明 |
| [`09-infrastructure`](../test-strategy/09-infrastructure.md) | mechanism | 沿用 | 639ed01539 | 专题声明 |
| [`10-snapshot-machinery`](../test-strategy/10-snapshot-machinery.md) | mechanism | 沿用 | 639ed01539 | 专题声明 |
| [`11-snapshot-external-face`](../test-strategy/11-snapshot-external-face.md) | mechanism | 沿用 | 639ed01539 | 专题声明 |
| [`12-probe-作为取证动作`](../test-strategy/12-probe-作为取证动作.md) | mechanism | 已核验 | b830ec950f | 专题声明 |
| [`13-plugin-testing`](../test-strategy/13-plugin-testing.md) | playbook | 沿用 | 639ed01539 | 专题声明 |
| [`14-plugin-testing-playbook`](../test-strategy/14-plugin-testing-playbook.md) | playbook | 沿用 | 639ed01539 | 专题声明 |
| [`15-plugin-testing-contract`](../test-strategy/15-plugin-testing-contract.md) | playbook | 已核验 | b830ec950f | 页面声明 |

### `development-flow/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../development-flow/00-map.md) | map | 已核验 | b830ec950f | 页面声明 |
| [`01-lifecycle`](../development-flow/01-lifecycle.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`02-gates`](../development-flow/02-gates.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`03-transitions`](../development-flow/03-transitions.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`04-forgetting`](../development-flow/04-forgetting.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`05-writeback-loop`](../development-flow/05-writeback-loop.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`06-honest-gaps`](../development-flow/06-honest-gaps.md) | analysis | 已核验 | b830ec950f | 页面声明 |
| [`07-naming-and-house-style`](../development-flow/07-naming-and-house-style.md) | mechanism | 已核验 | b830ec950f | 页面声明 |
| [`08-enforcement-sites`](../development-flow/08-enforcement-sites.md) | mechanism | 已核验 | b830ec950f | 页面声明 |

### `harness-idea/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../harness-idea/00-map.md) | map | 沿用 | 687f282e86 | 矩阵沿用 |
| [`01-role-and-substrate`](../harness-idea/01-role-and-substrate.md) | analysis | 沿用 | 687f282e86 | 矩阵沿用 |
| [`02-legibility`](../harness-idea/02-legibility.md) | analysis | 沿用 | 687f282e86 | 矩阵沿用 |
| [`03-paved-road`](../harness-idea/03-paved-road.md) | analysis | 沿用 | 687f282e86 | 矩阵沿用 |
| [`04-participation-paths`](../harness-idea/04-participation-paths.md) | analysis | 沿用 | 687f282e86 | 矩阵沿用 |
| [`05-dynamic-legibility`](../harness-idea/05-dynamic-legibility.md) | analysis | 沿用 | 687f282e86 | 矩阵沿用 |
| [`06-tech-and-language-fit`](../harness-idea/06-tech-and-language-fit.md) | analysis | 沿用 | 687f282e86 | 矩阵沿用 |
| [`07-boundaries-costs-fit`](../harness-idea/07-boundaries-costs-fit.md) | analysis | 沿用 | 687f282e86 | 矩阵沿用 |
| [`08-judgement-discipline`](../harness-idea/08-judgement-discipline.md) | analysis | 沿用 | 687f282e86 | 矩阵沿用 |
| [`09-feedback-loop`](../harness-idea/09-feedback-loop.md) | analysis | 沿用 | 687f282e86 | 矩阵沿用 |

### `canon/`

| 页面 | 角色 | 状态 | 最近核验 | 来源 |
|---|---|---|---|---|
| [`00-map`](../canon/00-map.md) | map | 未登记 | — | — |
| [`GLOSSARY`](../canon/GLOSSARY.md) | analysis | 未登记 | — | — |
| [`02-judgements`](../canon/02-judgements.md) | analysis | 未登记 | — | — |
| [`03-retired`](../canon/03-retired.md) | analysis | 未登记 | — | — |
| [`04-writing`](../canon/04-writing.md) | analysis | 未登记 | — | — |
| [`10-process`](../canon/10-process.md) | analysis | 未登记 | — | — |
| [`11-ecosystem`](../canon/11-ecosystem.md) | analysis | 未登记 | — | — |
<!-- catalog:coverage:end -->

## 状态说明

| 状态 | 含义 |
|------|------|
| 已核验 | 页面自己登记了当前基线，结论按该 commit 对照过源码 |
| 沿用 | 页面登记的是更早的 commit，或核验点来自专题声明 / 矩阵沿用；结论未按当前基线重核 |
| 未登记 | 没有页面级或专题级核验记录 |
| 需复核 | 上游同步触及来源，尚未重新核验 |

「最近核验」是页面自己的记录点，可以早于产品基线；`来源` 说明它来自页面声明、专题声明还是矩阵沿用。`沿用` 不等于按当前基线核过。状态由 [`catalog.json`](../catalog.json) 的 `verifiedAt` / `status` 派生，本页不手工维护。

## 怎么读

- **专题总览**回答「这个专题覆盖什么、当前有多少页已核验 / 沿用 / 未登记」。
- **页面明细**回答「这一页最后对到哪个 commit、这个记录点来自哪里」。
- 要判断一条结论是否仍可信，先看页面的 `最近核验` 与 `来源`，再按 [`../_change_log/`](../_change_log/00-index.md) 的跨度记录判断来源路径是否被触及。
- 轮次叙事、受影响文件清单与修复记录在 [`../_change_log/`](../_change_log/00-index.md)；本页只保留当前矩阵。

## 覆盖方式

反向核验（引用对不对）与正向覆盖（有没有漏）是两件事，本语料两件都做：

1. **反向**：`ref-sweep.mjs` 把全部 `path:line` 引用解析成仓库相对路径，逐条检查路径存在、行号在文件长度内，并可对带引文的 `> ——` 行做锚点漂移核对。报告是候选不是门禁；历史路径、冻结存档与注记过的退役面按 [`../_change_log/0009-independent-recheck.md`](../_change_log/0009-independent-recheck.md) 的三态口径分诊。
2. **正向**：把项目树摊开与语料求差，逐项判定「已补齐」「登记为已知未覆盖」「确认覆盖良好」三类。`verify.mjs` 现在强制页面清单与文件树双向一致，漏登记会直接失败；生成目录、扩展面与文件级回归的判定方法见 [`../_change_log/0011-0.2.0-rc.2-to-0.2.1-rc.2.md`](../_change_log/0011-0.2.0-rc.2-to-0.2.1-rc.2.md) 的「反查纪律」节。

## 已知未覆盖

这些是**真实存在且有 owner 的机制**，本语料目前不覆盖，登记在此以免被读成遗漏。每项都给了权威入口。

| 未覆盖项 | 权威入口 | 为什么不在本语料 |
|----------|----------|------------------|
| 门禁系统自身的 mode 分类与阻断语义（`scripts/run-gates.ts` 的 18 个 mode，0009 新增 `ci-unit`、`allowFailure`/`quick`） | `scripts/run-gates.ts`、`scripts/AGENTS.md`；聚合清单与调度语义已由 `test-strategy/07-ci-gates.md` 承载，机制级概述见 `system-overview/03-门禁与性能基准.md` | 逐 mode 的完整语义仍以 `run-gates.ts` 为权威，语料不逐条展开 |
| 录制会话快照的所有权与规范化规则 | `snapshots/AGENTS.md`；所有权七条与规范化机制已由 `test-strategy/06-rules-ownership.md`、`test-strategy/10-snapshot-machinery.md` 承载 | 原登记撤销：义务已由 test-strategy 专题成页 |
| Python 发行物（SDK / runtime 拆分、单文件可执行、wheel 的发行机制） | `python/README.md`、`python/development.md` | 测试面（pytest、单 exe 快照、installed-wheel 黑盒 CI）已由 `test-strategy/09-infrastructure.md` 承载；发行物拆分与打包机制仍未覆盖 |
| PR 历史的当前契约（官方 stack 对象、`gh stack merge`、lease 重写） | `AGENTS.md` 的「Choose PR history deliberately」、`dsh-merging-stacked-prs` skill | `_faq_on_digested/11` 记的是历史观察，非当前契约 |
| GitHub 标签法与加权审批 | `AGENTS.md` 的 Labels 行、`docs`/`.github/issue-management/policy.mjs`、`.github/review-ownership/` | 同上 |
| 根级政策文档 `SAFETY.md` / `BRAND_GUIDELINES.md` | 仓库根 | 非机制 |
| `docs/rescope.md` 的 vendored 包命名映射权威 | `docs/rescope.md`、`vendor/README.md` | 概念已覆盖（`two-tree-runtime/framework/00-map.md`），文件名未引 |
| `docs/graph-atlas.md` 作为生成目录之一 | `docs/graph-atlas.md` | 生成目录枚举里漏列 |
| `docs/ui-radius.md` 与 `docs/deepseek-llm-api-wire-extensions.md` 的逐条细则 | 两页本体；权威入口已挂 `two-tree-runtime/client/rules/03`、`tools-prompt-llm/00-map.md` | 语料只引权威入口，不逐条展开视觉 token 与线协议字段 |
| 未挂载 shipped 组合的工具族与零落点事件键：`tool-session-query` 5 工具、`tool-terminal` 6 工具、`list_subagent_models`、`lsp` 工具名；事件键 `session/title(-llm-request)`、`web/deepseek-search-llm-request`、`llm/retry(-started)` | `packages/experimental/tool-session-query/src/index.ts:65-108`、`packages/experimental/tool-terminal/src/index.ts:163-390`、`packages/subagent/tool-subagent/src/list-models.ts:87`、`packages/lsp/tool-lsp/src/index.ts:109`、`packages/core/session/src/known-event-types.ts:22-82` | 整族零落点但机制近邻有承载（`capability-seams/10`、`runtime-profiles/01-web`）；事件名零落点、机制旁及 |
| 配置字段级落点：`compaction-basic` 的 `thresholdRatio`、`deepseek-account-platform` 的 `platformOrigin` | `docs/config-catalog.md` | 机制页有落点（`tools-prompt-llm/03`、`capability-seams/10`），字段名不逐一收录 |
| 既有面（0009 前即无落点，属既有范围选择）：`ctx.shellEnv` 的 DSH_* 注册表、`ctx.sessionSkillCatalog`（Host 侧 skills namespace 适配器）、`identity/anonymous-user-id`、`compaction/command-compact` | `packages/shell/shell-env/`、`packages/api/session-controller/src/skill-catalog.ts:24`、`packages/identity/anonymous-user-id/`、`packages/compaction/command-compact/` | 机制近邻有承载（`capability-seams/02` bash 链、`runtime-profiles/01-web` 的 ui-skill、遥测事实行、`tools-prompt-llm/03` 压缩机制） |
| `native/` 的 Windows job 名与 source-of-record 表述 | `native/README.md`、`.github/workflows/node-addon-system.yml` | 区域级已覆盖，未到 job 级 |
| `client/hmr`、`client/locale`、`client/store` 等平台包的内部机制 | 各自 package README | 属客户端基础设施，`two-tree-runtime/client/` 的 rules 覆盖其对外纪律 |
| ssh 各 provider 的逐行传输合同（master channel、TLS-PSK、心跳租约的深读） | `packages/ssh/`、`capability-seams/09-ssh远程执行族.md`（本语料已有族级页） | 0008 独立复核补的是族级机制页；逐条 wire 细节待有需要再扩 |
| browser-use / computer-use driver 的内部契约（stagehand-native / MCP 挂载细节） | `packages/browser-use/`、`packages/computer-use/`、`capability-seams/10-新执行面与编排seam.md`（地图页） | 同上——地图先行，深读待该面有真实使用压力 |
