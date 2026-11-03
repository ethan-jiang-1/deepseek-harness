# Client · 浏览器里那棵树

核验入口：[`docs/subsystems/web-client.md`](../../../docs/subsystems/web-client.md)、[`docs/subsystems/client-modules.md`](../../../docs/subsystems/client-modules.md)、[`docs/subsystems/slots.md`](../../../docs/subsystems/slots.md)、[`docs/subsystems/conversation.md`](../../../docs/subsystems/conversation.md)、[`packages/client/AGENTS.md`](../../../packages/client/AGENTS.md)。

## 一句话

Web Client 是浏览器侧一棵由独立载入的插件组装成的 Cordis 应用（`docs/subsystems/web-client.md:5`）；它复用四块基础设施 —— Client Modules 载插件图、API Gateway 做类型化 Host 通信、Slots 组合 React、Conversation 把 Session 窗口变成目标自有的视图 —— 其余规则都是在这四块之上规定「谁拥有一份状态、谁能 import 谁、一个值走哪条通道」。

`packages/client/` 的包目录数量以 [`claims.json`](../../harness-idea/claims.json) 的 `client-package-total` 指标为准；这个数只用来判断「一个目录还是一个族包」，每次同步都会变，不要当常量引用。

## 和 Host 树的不对称

Host 拥有真相，Client 只投影：Host controller 决定耐久状态与 mutation 结果，Client model 维护最新可用的本地投影并编码「延迟响应与替换基线如何合并」；`presentation component` 永远不接收 Cordis `ctx`、transport 对象或另一个 feature 插件的实现（`docs/subsystems/web-client.md:20`）；Host 控制器拥有耐久状态，Client model 只保留可用的本地投影（`:54`）。刷新 / 重连从持久化再 hydrate，仍然读同一条 session 的事件——**client 没有第二份 append-only log**（[`../remote/streams/01`](../remote/streams/01-一条-emit-两条出站链路.md)）。

## 四问：四个孙目录

树怎么长、状态住哪、值怎么变成画面、谁能 import 谁——这四问是把 `packages/client/AGENTS.md` 与 `docs/subsystems/web-client.md` 的规则按问题归并出来的，也是这棵树唯一的查找入口。

| 目录 | 回答 | 文件 |
|------|------|------|
| [`tree/`](./tree/) | 这棵树怎么分层、模块与激活怎么走、怎么启动 | [`01-六层与单向依赖链`](./tree/01-六层与单向依赖链.md)、[`02-模块身份与激活顺序`](./tree/02-模块身份与激活顺序.md)、[`03-浏览器启动与首屏交接`](./tree/03-浏览器启动与首屏交接.md)、[`04-客户端热更新与模块缓存`](./tree/04-客户端热更新与模块缓存.md) |
| [`state/`](./state/) | 谁拥有一份状态、一个值活多久 | [`01-谁拥有一份状态`](./state/01-谁拥有一份状态.md)、[`02-资源模型与-holder-生命周期`](./state/02-资源模型与-holder-生命周期.md)、[`03-会话窗口与-generation`](./state/03-会话窗口与-generation.md)、[`04-workspace-模型`](./state/04-workspace-模型.md) |
| [`view/`](./view/) | 值怎么变成画面、扩展位怎么声明 | [`01-slot-与-props-纪律`](./view/01-slot-与-props-纪律.md)、[`02-conversation-node-纪律`](./view/02-conversation-node-纪律.md)、[`03-右栏-与-document-preview`](./view/03-右栏-与-document-preview.md) |
| [`rules/`](./rules/) | 谁能 import 谁、起包要补什么 | [`01-export-与包内目录`](./rules/01-export-与包内目录.md)、[`02-依赖-构建期环境与三处注册面`](./rules/02-依赖-构建期环境与三处注册面.md)、[`03-样式与本地化`](./rules/03-样式与本地化.md)、[`04-测试阶梯与三道-gate`](./rules/04-测试阶梯与三道-gate.md) |

## 插件作者视角

| 你要做的事 | 先读 | 再读 |
|---|---|---|
| 起一个 `packages/client/<name>` 包 | [`rules/02`](./rules/02-依赖-构建期环境与三处注册面.md)（三处注册面缺一不可） | [`rules/01`](./rules/01-export-与包内目录.md)（export 与目录） |
| 查「我的包为什么没启动 / 停在 boot page」 | [`tree/03`](./tree/03-浏览器启动与首屏交接.md) | [`tree/02`](./tree/02-模块身份与激活顺序.md)（模块身份与激活顺序） |
| 往界面加一个扩展位或按钮 | [`view/01`](./view/01-slot-与-props-纪律.md) | [`tree/01`](./tree/01-六层与单向依赖链.md)（这个位置属于哪一层） |
| 让 Conversation 多一种节点 | [`view/02`](./view/02-conversation-node-纪律.md) | [`view/01`](./view/01-slot-与-props-纪律.md) |
| 加一种右栏内容或一条文件预览 | [`view/03`](./view/03-右栏-与-document-preview.md) | [`state/02`](./state/02-资源模型与-holder-生命周期.md) |
| 读 Host 的状态、调 Host 的命令 | [`state/01`](./state/01-谁拥有一份状态.md) | [`../remote/gateway/02`](../remote/gateway/02-客户端-mount-与装配.md) |
| 加样式或用户可见文案 | [`rules/03`](./rules/03-样式与本地化.md) | — |
| 查「会话或工作区状态为什么不对」 | [`state/03`](./state/03-会话窗口与-generation.md)（会话窗口与重连） | [`state/04`](./state/04-workspace-模型.md)（workspace 行、归档与 pin） |
| 查「改了代码为什么没生效」 | [`tree/04`](./tree/04-客户端热更新与模块缓存.md)（HMR 与缓存修订） | [`rules/02`](./rules/02-依赖-构建期环境与三处注册面.md)（模块身份改了要重启） |

三个最常见的返工：**业务数据放进 entry 的 store**（store 只装查看/交互状态，sessions、frames、connections 留在对象层）；**在组件里直接订阅或 `useSyncExternalStore`**（一切变化都经 framework hook 进来）；**为让测试编译而放宽公开 API**（同包测试直接 import 内部路径）。

## 一棵树，四块基础设施

`Client Modules` 决定插件图与同步 import 能不能物化，Cordis service `inject` 决定插件什么时候激活——两者不可互换（[`tree/02`](./tree/02-模块身份与激活顺序.md)）。`ctx.slots` 是组合的唯一入口，`ctx.remote.<namespace>` 是跨边界调用的唯一入口，资源协议是「用地址读一份内容」的唯一入口。

## 边界

- Host 侧的业务状态、mutation 顺序与访问策略在 `packages/api/*-controller` 的 README 与 [`../remote/`](../remote/00-map.md)；本目录只讲浏览器侧怎么投影与呈现。
- 入口（Web / 桌面怎么把这份产物加载起来）在 [`../../surfaces-entrypoints/`](../../surfaces-entrypoints/00-map.md)。
- 组合、patch 与 HMR 在 [`../../plugin-system/`](../../plugin-system/00-map.md)；本目录假设树已经起来了。

## 上游阅读顺序

1. [`docs/subsystems/web-client.md`](../../../docs/subsystems/web-client.md)：层表、单向依赖链、browser boot、Remote 通信、Client model、重连与包边界。
2. [`packages/client/AGENTS.md`](../../../packages/client/AGENTS.md)：slot/props、reactive read、export、ctx、layering red line、dependency declaration、构建期环境、模块图、Conversation Node、目录制度、样式与本地化、测试阶梯、两份 checklist。
3. [`docs/subsystems/slots.md`](../../../docs/subsystems/slots.md)：四 share 来源表、标准 hooks、inject 隔间、层级树与扩展规则。
4. [`docs/subsystems/client-modules.md`](../../../docs/subsystems/client-modules.md)：`WebBootGraph` wire、scan、bundle route、`rebuilt()` 与缓存修订。
5. [`docs/subsystems/conversation.md`](../../../docs/subsystems/conversation.md)：Context/Location/View 归属、身份与重放、window 更新三条路径、publication。
6. [`docs/web-styling.md`](../../../docs/web-styling.md)：token 与样式归属、组件规则、改系统流程；统一圆角刻度与适用面另见 [`docs/ui-radius.md`](../../../docs/ui-radius.md)（0009 新增）。
7. [`packages/client/hmr/README.md`](../../../packages/client/hmr/README.md)：重载链的两半、失败策略与 `pollIntervalMs`。
8. 三道 gate：[`scripts/verify-client-packages.ts`](../../../scripts/verify-client-packages.ts)（模块请求与环）、[`scripts/verify-client-domain-graph.ts`](../../../scripts/verify-client-domain-graph.ts)（包内层级）、[`scripts/verify-client-ui-i18n.ts`](../../../scripts/verify-client-ui-i18n.ts)（文案归属）。

> 承重词按 [`canon/GLOSSARY.md`](../../canon/GLOSSARY.md) 的 DSH 原文用；本页自己的分类与指标不是 DSH 的词。
