# Typert 类型图与 Remote 生成

核验入口：[`docs/subsystems/typert.md`](../../docs/subsystems/typert.md)、[`docs/api-gateway.md`](../../docs/api-gateway.md)、[`packages/typert/README.md`](../../packages/typert/README.md)。决策记录：`.agents/notes/implemented/architecture/2026-08-02-typert-remote-method-calls.md`、`.agents/notes/implemented/architecture/2026-07-27-compiler-independent-typert-model.md`。

## 一句话

`Typert` 把「Host 上一个 Cordis Service 的方法」变成「Client 上一个具体函数」，全程只过三段：业务包在声明期用 `@Remote` / `@RemoteScope` 标注方法、把 Cordis 服务键绑成 wire `namespace`；build 期 generator 从 Host 的 `ts.Program` 抽出 `TypeGraph`，为同一份契约发出 Host 反射与 Host-for-Client 投影（严格 descriptor、Zod codec、声明合并、声明文件源映射）；运行期 Host 的 `ctx.typertGateway` 按 descriptor 解析活的 Service 并派发，Client 的 `ctx.remote.$mount()` 把同一 descriptor 装成 `remote.<namespace>` 子服务上的具体方法。descriptor 是两侧本地反射、从不上线，wire 只传 endpoint 与 `{ args }`（`docs/subsystems/typert.md:41`、`docs/api-gateway.md:125`）。

## 四个包与两个 core 服务

`packages/typert/README.md:25-30` 给出四包分工，`ctx` 键只有 registry 一个：

| 包 | 角色 | `ctx` 键 |
|----|------|----------|
| `packages/typert/generator` | build 期分析源码类型，发出运行期加载的反射、schema 与 Remote descriptor | — |
| `packages/typert/loader` | 从 Loader 组合自动注册生成的 Host 面产物 | 消费 `ctx.loader` 与 `ctx.typert` |
| `packages/typert/protocol` | 声明 Host 与 Client 共享的 Remote 装饰器、wire descriptor、codec 与 provider 契约 | — |
| `packages/typert/registry` | 运行期存生成的包反射、活的 Zod schema，以及 lookup 与 Context 两个 provider registry | `ctx.typert` |

`ctx.typert` 与 `ctx.typertGateway` 都不是 seam。`docs/capability-seams.md:597` 的生成表把 `ctx.typert` 判为 `core`，owner 是 `typert-registry`，Implementations 列为 `-`，Direct consumers 是 `typert-loader` 与 `api-gateway`，Companion plugins 为 `-`，描述原文是 `Plugins register live zod contributions directly or through dsh-typert-loader; the API gateway consumes invocation descriptors and providers, while other runtime consumers query schemas and reflection metadata at their own edges.`；`docs/capability-seams.md:494` 把 `ctx.typertGateway` 判为 `core`，owner 是 `api-gateway`，Implementations 与 Direct consumers 都是 `-`，描述原文是 `Associates generated Remote descriptors with live Cordis services, resolves registered identities, and exposes unary calls through the shared Connection RPC carrier.`。两行的 Role 列都是 `core`、Implementations 列都是 `-`，即生成表不把任何一个算作三角色 seam。

权威正文是 `docs/subsystems/typert.md`，它自己的生成区从 `:237` 起，`:247` 是 `ctx.typert`、`:313` 是 `ctx.typertGateway`，该区由 `scripts/gen-cordis-catalog.ts` 生成、由 `pnpm run verify-cordis-catalog` 校验新鲜度（`docs/subsystems/typert.md:243`，生成器本身消费 `@deepseek-ai/dsh-typert-generator`：`scripts/gen-cordis-catalog.ts:29`）。

## 声明期

业务包把一个 public、非 static 的实例方法标成 `@Remote` 即可导出；`@Remote('create')` 声明一个与成员名不同的导出名，`@Remote({ mode: 'stream' })` 声明逻辑流，`@RemoteScope(key, exportName?)` 声明 receiver 从某个 scoped Context 解析（`packages/typert/protocol/src/index.ts:174-201`、`:226-233`）。装饰器只调度一个 initializer，把方法名、可选导出名与调用方式追加到 Service 原型上的 versioned descriptor；标记要求公开非静态实例方法且名字是字符串，同一方法上的冲突标记直接抛错（`packages/typert/protocol/src/index.ts:265-282`、`:284-311`）。`remoteMethods(service)` 读回的是脱离原 descriptor 的声明顺序快照，供 Gateway 的 source 模式兜底使用（`packages/typert/protocol/src/index.ts:235-245`）。

**namespace 键归业务包所有。** 服务要么继承 `TypertRemoteService`、在构造函数里把 Cordis 服务键与默认 namespace 一次绑定，要么在已有基类的情况下自己声明 `readonly typertRemote = bindTypertRemote(this, serviceKey)`；`namespace` 缺省就是 Cordis 服务键，需要与协议名不同时才显式传第三参（`packages/typert/protocol/src/index.ts:141-167`、`docs/api-gateway.md:15`）。具体消费者是 `SessionController`：`super(ctx, 'sessionController', { namespace: 'session' })` 让服务键 `sessionController` 与 wire namespace `session` 分离（`packages/api/session-controller/src/index.ts:121`），其 `@Remote('list')`、`@Remote('create')`、`@Remote({ mode: 'stream' })` 等方法落在该 namespace 下（`packages/api/session-controller/src/index.ts:222`、`:243`、`:399`）。未被标记的方法不进入生成的 Client 类型与运行期贡献，也不能经 `ctx.remote` 调用（`docs/api-gateway.md:9`）。

**wire 身份有统一文法。** 每个 namespace、method、lookup、Context 段都要满足 `isTypertRemoteSegment()`，生成的 endpoint 才能原样穿过共享 RPC carrier（`packages/typert/protocol/README.md:94`、`packages/typert/protocol/src/index.ts:20-22`）。registry 用三种稳定键：`<package>#<face>` 包反射、`<package>#<name>` schema、`<namespace>/<method>` endpoint（`packages/typert/registry/README.md:75`、`packages/typert/registry/src/service.ts:48`、`:58`、`:67`）。

**复杂对象与 scoped receiver 靠声明合并。** 业务包扩充 `TypertLookupMap` 与 `TypertContextMap` 两个空 map：前者把一个 Host 对象类型绑到它的 wire 身份，后者把一个 scoped Context kind 绑到 wire 身份；生成的 descriptor 只写这些键，活的解析行为由运行期 provider 提供（`packages/typert/protocol/src/types.ts:34`、`:37`、`docs/subsystems/typert.md:7-9`）。例如 Host 签名里名为 `agent` 的 `Agent` 参数在 wire 上变成 `agentId`，Gateway 在调用业务方法前把 id 解析回 Host 对象（`docs/api-gateway.md:11`）。registry 在 provider 卸载后仍保留 lookup 的 wire 声明，SRC 因此继续把该参数判为 lookup 并以 unavailable 失败，而不会把 wire 值当成普通业务对象接受（`docs/subsystems/typert.md:21`）。失败词汇只有一个类：`RemoteError` 带稳定的 `<domain>/<reason>` 码，`RemoteErrorDetailsMap` 是可声明合并的明细表，调用方按 `code` 判别而不是 `instanceof`（`packages/typert/protocol/README.md:53`、`:64`）。

**包对外只暴露生成的子路径。** 有 Remote 方法（或发布 Typert 面）的包必须在 `package.json` 里声明 `./typert`（Host Loader 用）与 `./remote`（Client 装配用），两层都指向 `lib/` 下的生成文件（`packages/goal/goal/package.json:33-40`、`docs/api-gateway.md:115`）。`packages/goal/goal/package.json:63` 对 `@deepseek-ai/dsh-typert-protocol` 的 `peerDependencies` 就是这条依赖边：业务包只依赖轻量协议包，不依赖 registry、compiler 或 Client 运行时（`packages/typert/protocol/README.md:12`）。

## build 期

generation 是 opt-in 且只发生在 build：包声明 export 条目、跑构建，产物出现在 `lib/`；它从不在活的 agent session 里运行（`packages/typert/generator/README.md:12`、`:28`）。整个 generator 建立在一个分离上：`WorkspaceAnalyzer` 从 face 聚合 tsconfig 播种出的 TypeScript program 读出模型，产出 `FaceModel` 与 `TypeGraph`；`FaceModelEmitter` 只消费该模型、永远拿不到 compiler 节点（`packages/typert/generator/README.md:66`）。`check` 模式对语法/语义诊断、缺失公开标注、私有跨包引用，以及模型无法无损保留的声明合并直接 fail（`packages/typert/generator/README.md:82`）。

单包发出的文件在 `docs/api-gateway.md:109-113` 有逐项归属：

| 文件 | 消费者 | 内容 |
|------|--------|------|
| `typert.host.js` | Host Loader | Host 面运行期反射、严格 invocation descriptor 与 schema 注册值 |
| `typert.host.d.ts` | Host 类型系统 | Host 面生成声明 |
| `typert.remote-client.js` | `api-remotes` | 可 mount 的 `TypertRemoteContribution`，含严格 descriptor 与运行期 codec |
| `typert.remote-client.d.ts` | Client 类型系统 | 对 `TypertRemoteNamespaceMap` 与 `TypertRemoteScopeMap` 的声明合并，加 Client-safe 类型引用 |
| `typert.remote-client.d.ts.map` | 编辑器 | 把生成的方法属性映射回 Host 包里对应的 Remote 方法声明 |

`FaceModelEmitter` 发出的可执行 JS 含受支持的 Zod schema 与 `TYPERT` contribution，声明文件里的 schema 通过包的公开导出被标成 `z.ZodType<SourceType>`；不支持的 Zod 投影以 `TypertEmitError` 指名构造失败，而不是把源码类型摊平或弱化（`packages/typert/generator/README.md:86`、`:44`）。Host 面若含 Remote 方法，额外发出 `typert.remote-client.*` 这份 Host-for-Client 投影（`packages/typert/generator/README.md:86`）。声明源映射让 `ctx.remote.goals.create` 后面的生成属性导航回 Host 源方法，编辑器不会停在生成的 `.d.ts`（`docs/api-gateway.md:113`、`:117`）。源映射只服务编辑期：包 `files` 只要求列出 `typert.remote-client.js` 与 `.d.ts`，`.d.ts.map` 不在其列，且发布校验把 `lib/typert.remote-client.d.ts.map` 判为禁止发布项（`scripts/check-workspace-constraints.ts:236-238`、`scripts/publication-payload.spec.ts:53-54`）。

**新鲜度门禁是「重跑一遍 Host 契约」而不是单独的 verify 脚本。** `scripts/` 里没有 `gen-typert` / `verify-typert`；`scripts/run-gates.ts:629-631` 定义的 `typert-contracts` gate 就是 `pnpm run build:lib:host`，而 `typecheck`、`lint`、`doc-typecheck` 三个消费者显式 `needs: ['typert-contracts']`，各自跑 `*:contracts-ready` 变体（`scripts/run-gates.ts:375-376`）。顺序由契约决定：Host lib 阶段先 `tsc -b tsconfig.host.json` 再 `tsdown --env.DSH_BUILD_FACE host`，generator 在该 tsdown pass 里以 Host 聚合为唯一 program 种子运行；Client lib 阶段随后消费新生成的 Remote 声明与运行期贡献，不再启动 Typert（`docs/api-gateway.md:99`、`:101`；根脚本 `package.json:23-25`）。generator 另外校验每个贡献包的 `package.json`：`./typert`、`./client/typert`，以及有 Remote 方法时的 `./remote` 必须指向精确的生成文件，`files` 必须包含它们，指错或缺失直接 fail build（`packages/typert/generator/README.md:86`、`:44`）；`scripts/check-workspace-constraints.ts:231-238` 在仓库层强制同一份 export/file 映射。改了 Remote 签名（装饰器、导出名、namespace、参数、返回值、lookup、Context、取消签名）后必须按序重跑 `pnpm run build:lib`，只改方法体不重跑（`docs/api-gateway.md:151-157`）。

**source 启动走一条显式的弱化路径。** `node --import tsx/esm` 启动的 Host 不执行 Typert compiler，但装饰器 initializer 仍把方法名与调用方式记在 Service 原型的 versioned descriptor 上，`TypertRemoteService` 或 `bindTypertRemote()` 仍提供显式绑定，所以 Gateway 能在不启动 `ts.Program` 的前提下构造弱化的临时 descriptor（`docs/api-gateway.md:133`）。该路径只从活函数解析简单参数名：命中已注册 lookup 的 `parameter` 就用其 wire 字段并在 Host 解析对象，其余参数只做无环、JSON-safe 检查；`@RemoteScope` 直接用已注册 Host Context provider 的 wire 字段（`docs/api-gateway.md:135`）。Client 端永远从最近一次生成的 `lib/typert.remote-client.*` 拿类型、codec 与注册值，并拒绝 mount 缺少严格 codec 的 SRC descriptor（`docs/api-gateway.md:137`）。

## 运行期

**注册。** Loader 插件让每个在此组合中挂载的、带生成 export 的包自动把 Host 面反射与 schema 贡献给 registry，并在包或插件卸载时撤回；没有该 export 的包被静默跳过，所以把它加进任意组合都是安全的（`packages/typert/loader/README.md:12`、`:51`）。`validateTypertManifest()` 是「build 产物 → 类型化 registry」的模块边界：manifest 必须指名导出它的包、face 为 `host`、持有 zod v4 schema 实例，invocation descriptor 必须用严格 codec，任一失败都点名包与缺陷（`packages/typert/loader/README.md:69`）。注册按 entry 名记账、经 `ctx.typert.register()` 返回的精确 disposer 撤回，在途 import 晚于 owner 消失就丢弃（`packages/typert/loader/README.md:73`、`packages/typert/loader/src/index.ts:383`、`:411-414`）。它只发现 Host 面：Client 运行时要等另一个组合 owner 才能有等价发现（`packages/typert/loader/README.md:114`）。

**registry。** 一次 contribution 是一次原子且 fiber 拥有的提交：`register()` 先校验包面身份、schema 与 invocation descriptor，再用一个 Cordis effect 提交全部内容，重复身份在任何状态变更前于 owning operation 边界失败（`packages/typert/registry/README.md:62`、`packages/typert/registry/src/service.ts:499-519`）。`ctx.typert` 把当前环境 descriptor、显式选中的 Remote 贡献、lookup provider 与 scoped Context provider 分开存放（`docs/subsystems/typert.md:245`），对应 `local` / `remotes` / `lookups` / `contexts` 四个子 registry（`packages/typert/registry/README.md:66-69`）。消费侧读 schema 用 `get(key)` / `resolve(key)` / `list(filter?)`，读包反射用 `getPackage(name, face?)` / `listPackages(filter?)`，`toJSONSchema(key)` 不缓存地把活 Zod schema 投成 JSON Schema（`packages/typert/registry/README.md:40`）。

**Host 派发。** Connection 先解出自己的 carrier envelope，再调用 `ctx.typertGateway`；request 带精确命名的 wire 字段，carrier 的取消信号单独传递（`docs/subsystems/typert.md:266`）。Gateway 只认领两段 endpoint 且有严格 descriptor 或活 SRC 标记的请求，其余交回 404 / 其它 Fetch 路由（`docs/api-gateway.md:125`、`packages/api/gateway/src/index.ts:235` 的 `claimsEndpoint`、`:313`）。解析 descriptor 时先查 `ctx.typert.local.get(endpoint)`；严格定义已被撤回（`hasSeen`）就抛 `gateway/definition-unavailable` 并禁止降级到 SRC，否则才走 SRC 推断（`packages/api/gateway/src/index.ts:748`、`docs/api-gateway.md:131`）。一次调用的准备顺序固定为：解析 descriptor → 校验 `args` 字段与 descriptor 完全一致 → 解析 receiver Context → 从该 Context 取 `descriptor.service` 并校验绑定 → 按 `descriptor.parameters` 逐个解析（JSON、lookup、Context 投影）→ 若声明了 `cancellation` 就在业务参数之后追加信号 → 取 `implementation ?? method` 作为真正调用的成员（`packages/api/gateway/src/index.ts:349` 起的 invokePrepared）。`invoke()` 拒绝 stream descriptor（`:345`），`stream()` 拒绝 unary descriptor（`:374`），两者都抛 `gateway/signature-invalid`（`:352/:387/:794`，末者是 stream 的 SRC-signal 约束）。派发与边界失败一律走 `TypertGatewayError`（类定义 `:162`），其 `gateway/*` 码是普通 `RemoteError` 码，RPC adapter 把结构上可识别的 `RemoteError` 连同 code 与 details 原样透传，只把无法识别的异常折成 `gateway/internal`（`docs/subsystems/typert.md:266`）。权威的码全集见 `docs/subsystems/typert.md:289-311`。

**相关性、取消与逻辑流。** Connection 独占 transport、RPC id、响应信封与请求取消，Gateway 只拥有 Remote 数据协议与业务派发：替换 carrier 不需要改 Remote descriptor 或 Client 编程接口（`docs/api-gateway.md:125`）。封装是 `{ type: 'client-request', rpcId, method, payload }` 与 `{ type: 'server-response', rpcId, result }`，发起方铸 `rpcId`、响应方回显（`packages/client/connection/src/rpc.ts:61-73`；`packages/client/AGENTS.md` 的 `rpcId is strictly bidirectional` 红线）。Client Remote 的实际调用是 `connection.rpc.call('/api', endpoint, { args: prepared.args }, prepared.signal)`，HTTP carrier 把它映射成 `POST /api/<namespace>/<method>`，payload 只有命名的 `args`（`packages/api/gateway/src/client/index.ts`、`docs/api-gateway.md:125`）。逻辑流另走一条与一元 `call` 分开的通道：Client 的 `openRemoteStream` 先看 carrier 是否提供 `connection.rpc.open?.('/api', endpoint, payload, signal)`（进程内或本地 carrier 用它），没有才落到共享的 WebSocket mux（`packages/api/gateway/src/client/index.ts`）。mux 上 Client 为每条流铸一个 `streamId`（`randomUUID()`），发 `{ type: 'open', streamId, endpoint, payload }`，结束时用 `{ type: 'cancel', streamId }`；Host 按 `streamId` 记账、重复 id 抛错、cancel 直接 abort 对应流（`packages/api/gateway/src/stream-server.ts:203` 的重复 id 抛错）；**上行帧（0.1.7 线新增）**为 `open` / `item` / `end` / `cancel`（`packages/api/gateway/src/stream-protocol.ts:235-244`），下行帧仍只有 `item` / `error` / `end`（`:249-254`）。这条 mux 的固定路径是 `/api/remote.mux`（`packages/api/gateway/src/stream-protocol.ts:6`）。`docs/api-gateway.md:5` 现在明写「unary **and stream** Remote methods」，`:161` 的边界段也把 stream 方法编入（Session 事件流、分页、投影等仍在 Remote 方法之外）；0.1.7 线还新增了 **uplink** 面：`mode: 'stream'` 的方法可声明 `RemoteStream<Out, In>`（`packages/typert/protocol/src/types.ts:93`），生成的 Client `RemoteStreamHandle` 暴露 `send`/`end`/`dispose`（`:106-124`），Client 发送的每一项经 Gateway 用生成的 `In` codec 校验后由 Host 方法经 `this.ctx.invocation.uplink<In>()` 读取（`packages/api/gateway/src/index.ts:101-148` 的 UplinkSource 与 `streamInboxBytes` 上限、`:1314` 的 `uplink()`，超限抛 `gateway/uplink-overflow`；`docs/api-gateway.md:58`）——uplink 不进 `args` 也不进参数列表。

**Client 如何把 namespace 挂成 `ctx.remote.<namespace>`。** `ctx.remote` 只暴露被导入的 `/remote` 产物贡献的 namespace（`docs/subsystems/typert.md:346`）。`$mount(contribution)` 在调用者 fiber 里把「注册 descriptor 集」与「装具体方法」做成一次 owned 操作（`packages/api/gateway/src/client/index.ts:201-209`）：先把 contribution 注册进 `ctx.typert.remotes`，再按 `descriptor.namespace` 分组，为每组经 `ownerCtx.plugin()` 起一个 `remote.<namespace>` 子服务，并把该组方法在同一同步窗口内装上去（`packages/api/gateway/src/client/index.ts:239-265`、`:346-378`）。方法是服务上的具体 getter，不是 JavaScript `Proxy`，也没有 Host 业务 Service 类型进入 consumer（`docs/subsystems/typert.md:346`；`packages/api/gateway/src/client/index.ts:566-599`）。子服务名就是 `remote.${namespace}`（`packages/api/gateway/src/client/index.ts:659-661`），其生命周期覆盖它挂载的全部方法；卸载 Client contribution 会同时移除 descriptor 与具体方法、abort 在途调用，并让外部保留的旧方法句柄拒绝后续调用（`docs/api-gateway.md:131`）。直接与 scoped 调用分别出现在 `ctx.remote.<namespace>` 与 `agentCtx.remote.<namespace>`，依赖声明归实际调用方：只有真正读该 namespace 的业务包才在自己的 `inject` 里同时声明 `remote` 与 `remote.<namespace>`（`docs/api-gateway.md:60`）。

**装配只发生在一处。** `packages/api/remotes` 的 Client 端 runtime-import 各业务包的 `/remote` 子路径（现为 **25** 个贡献，0009 复核实数；0009 新增 `product-analytics`、`schedule`、`user-questions`），循环 `await ctx.remote.$mount(contribution)`，并从同一批文件 re-export 声明合并以把类型带进业务代码；卸载按相反顺序展开（`packages/api/remotes/src/client/index.ts:182-195`、`docs/api-gateway.md:76`）。因此「哪些 Host 方法对某个 Client 可见」是 build 期由这个装配清单选定的，而不是运行时发现（`docs/api-gateway.md:78`）。

## 谁定义、谁提供、谁消费

| 面 | owner | 事实 |
|----|-------|------|
| 声明（装饰器、绑定、协议 map、descriptor 类型） | `packages/typert/protocol` | 只声明类型与装饰器标记，不做 TypeScript 分析、不注册 Cordis 服务（`docs/api-gateway.md:88`、`packages/typert/protocol/README.md:12`） |
| 生成 | `packages/typert/generator` | build 期严格分析 Remote 签名、类型图、lookup、Context 与源位置，再发 Host 与 Host-for-Client 产物（`docs/api-gateway.md:87`） |
| `ctx.typert` 实现（core） | `packages/typert/registry` | 存 Host descriptor、schema 与包注册，并持有 lookup / Context provider（`docs/api-gateway.md:88`、`docs/capability-seams.md:597`） |
| 自动注册 | `packages/typert/loader` | 消费 `ctx.loader` 与 `ctx.typert`，只发现、不实现 registry（`packages/typert/README.md:28`、`packages/typert/loader/README.md:28`） |
| `ctx.typertGateway` 实现（core） | `packages/api/gateway` | 认领 endpoint、解析对象或 Context、调用活 Service、校验请求与返回值（`docs/api-gateway.md:88`、`docs/capability-seams.md:494`） |
| Client `ctx.remote` 与 namespace 子服务 | `packages/api/gateway/src/client` | mount 生成 descriptor、发起/校验/取消调用（`docs/api-gateway.md:89`） |
| 选择与 mount 哪些 namespace | `packages/api/remotes/src/client` | 显式选择应用允许的 `/remote` 贡献，并带入对应声明合并（`docs/api-gateway.md:92`） |
| 业务方法契约与 namespace 键 | 各业务包（如 `api-session-controller` 的 `session`、`goal`） | 拥有 `@Remote` 方法与自己的 `/typert`、`/remote` 导出（`packages/api/session-controller/src/index.ts:121`、`packages/goal/goal/package.json:33-40`） |
| RPC carrier | `packages/client/connection` | 提供 RPC、request correlation、信任边界、取消、响应信封与 `/api` HTTP 桥（`docs/api-gateway.md:93`） |

## 阅读顺序

1. [`docs/subsystems/typert.md`](../../docs/subsystems/typert.md)：`TypertLookupMap` / `TypertContextMap` / `InvocationDescriptor` / `TypertRegistryContract` / `TypertClientRemote` 的字面契约，以及 `ctx.typert`、`ctx.typertGateway` 的生成 API 区。
2. [`docs/api-gateway.md`](../../docs/api-gateway.md)：声明、生成、SRC 兜底与运行期调用的端到端参考，含组件职责表与产物表。
3. [`packages/typert/README.md`](../../packages/typert/README.md)：四包分工与各自 README 入口。
4. [`packages/typert/protocol/README.md`](../../packages/typert/protocol/README.md)：装饰器、协议 map、失败词汇与事件转发声明。
5. [`packages/api/gateway/src/index.ts`](../../packages/api/gateway/src/index.ts) 与 [`packages/api/gateway/src/client/index.ts`](../../packages/api/gateway/src/client/index.ts)：Host 派发与 Client mount 两侧的实现。
