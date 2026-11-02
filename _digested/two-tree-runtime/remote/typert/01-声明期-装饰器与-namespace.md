# 声明期：装饰器、namespace 与三个 core 服务

核验入口：[`docs/subsystems/typert.md`](../../../../docs/subsystems/typert.md)、[`docs/api-gateway.md`](../../../../docs/api-gateway.md)、[`packages/typert/README.md`](../../../../packages/typert/README.md)。决策记录：`.agents/notes/implemented/architecture/2026-08-02-typert-remote-method-calls.md`、`.agents/notes/implemented/architecture/2026-07-27-compiler-independent-typert-model.md`。

这一页讲声明期：一个方法怎么被标成 Remote、namespace 从哪来、复杂对象与 scoped receiver 怎么过声明合并。

## 四个包与三个 core 服务

`packages/typert/README.md:25-30` 给出四包分工，`ctx` 键只有 registry 一个：

| 包 | 角色 | `ctx` 键 |
|----|------|----------|
| `packages/typert/generator` | build 期分析源码类型，发出运行期加载的反射、schema 与 Remote descriptor | — |
| `packages/typert/loader` | 从 Loader 组合自动注册生成的 Host 面产物 | 消费 `ctx.loader` 与 `ctx.typert` |
| `packages/typert/protocol` | 声明 Host 与 Client 共享的 Remote 装饰器、wire descriptor、codec 与 provider 契约 | — |
| `packages/typert/registry` | 运行期存生成的包反射、活的 Zod schema，以及 lookup 与 Context 两个 provider registry | `ctx.typert` |

`ctx.typert` 与 `ctx.typertGateway` 都不是 seam。`docs/capability-seams.md:647` 的生成表把 `ctx.typert` 判为 `core`，owner 是 `typert-registry`，Implementations 列为 `-`，Direct consumers 是 `typert-loader` 与 `api-gateway`，Companion plugins 为 `-`，描述原文是 `Plugins register live zod contributions directly or through dsh-typert-loader; the API gateway consumes invocation descriptors and providers, while other runtime consumers query schemas and reflection metadata at their own edges.`；`docs/capability-seams.md:648` 把 `ctx.typertGateway` 判为 `core`，owner 是 `api-gateway`，Implementations 与 Direct consumers 都是 `-`，描述原文是 `Associates generated Remote descriptors with live Cordis services, resolves registered identities, and exposes unary calls through the shared Connection RPC carrier.`。两行的 Role 列都是 `core`、Implementations 列都是 `-`，即生成表不把任何一个算作三角色 seam。0011 在同一张表里新增了第三条相关 `core` 行 `ctx.remoteAccess`（`:649`，owner `api-remote-access`）——Remote 方法级访问控制，见下文「运行期」。

权威正文是 `docs/subsystems/typert.md`，它自己的生成区从 `:502` 起（`<a id="cordis-surface">`），`:590` 是 `ctx.typert`、`:654` 是 `ctx.typertGateway`（同区 `:508` 是 0011 新增的 `ctx.remoteAccess`），该区由 `scripts/gen-cordis-catalog.ts` 生成、由 `pnpm run verify-cordis-catalog` 校验新鲜度（`docs/subsystems/typert.md:504`，生成器本身消费 `@deepseek-ai/dsh-typert-generator`：`scripts/gen-cordis-catalog.ts:29`）。

## 业务包怎么标注

业务包把一个 public、非 static 的实例方法标成 `@Remote` 即可导出；`@Remote('create')` 声明一个与成员名不同的导出名，`@Remote({ mode: 'stream' })` 声明逻辑流，`@RemoteScope(key, exportName?)` 声明 receiver 从某个 scoped Context 解析（`packages/typert/protocol/src/index.ts:278-313`、`:365-390`）。装饰器只调度一个 initializer，把方法名、可选导出名与调用方式追加到 Service 原型上的 versioned descriptor；标记要求公开非静态实例方法且名字是字符串，同一方法上的冲突标记直接抛错（`packages/typert/protocol/src/index.ts:265-282`、`:284-311`）。`remoteMethods(service)` 读回的是脱离原 descriptor 的声明顺序快照，供 Gateway 的 source 模式兜底使用（`packages/typert/protocol/src/index.ts:235-245`）。

**namespace 键归业务包所有。** 服务要么继承 `TypertRemoteService`、在构造函数里把 Cordis 服务键与默认 namespace 一次绑定，要么在已有基类的情况下自己声明 `readonly typertRemote = bindTypertRemote(this, serviceKey)`；`namespace` 缺省就是 Cordis 服务键，需要与协议名不同时才显式传第三参（`packages/typert/protocol/src/index.ts:232-243`、`docs/api-gateway.md:15`）。具体消费者是 `SessionController`：`super(ctx, 'sessionController', { namespace: 'session' })` 让服务键 `sessionController` 与 wire namespace `session` 分离（`packages/api/session-controller/src/index.ts:158`），其 `@Remote('list')`、`@Remote('create')`、`@Remote({ mode: 'stream' })` 等方法落在该 namespace 下（`packages/api/session-controller/src/index.ts:222`、`:300`、`:536`）。未被标记的方法不进入生成的 Client 类型与运行期贡献，也不能经 `ctx.remote` 调用（`docs/api-gateway.md:9`）。

**wire 身份有统一文法。** 每个 namespace、method、lookup、Context 段都要满足 `isTypertRemoteSegment()`，生成的 endpoint 才能原样穿过共享 RPC carrier（`packages/typert/protocol/README.md:94`、`packages/typert/protocol/src/index.ts:20-22`）。registry 用三种稳定键：`<package>#<face>` 包反射、`<package>#<name>` schema、`<namespace>/<method>` endpoint（`packages/typert/registry/README.md:75`、`packages/typert/registry/src/service.ts:48`、`:58`、`:67`）。

**复杂对象与 scoped receiver 靠声明合并。** 业务包扩充 `TypertLookupMap` 与 `TypertContextMap` 两个空 map：前者把一个 Host 对象类型绑到它的 wire 身份，后者把一个 scoped Context kind 绑到 wire 身份；生成的 descriptor 只写这些键，活的解析行为由运行期 provider 提供（`packages/typert/protocol/src/types.ts:34`、`:37`、`docs/subsystems/typert.md:7-9`）。例如 Host 签名里名为 `agent` 的 `Agent` 参数在 wire 上变成 `agentId`，Gateway 在调用业务方法前把 id 解析回 Host 对象（`docs/api-gateway.md:11`）。registry 在 provider 卸载后仍保留 lookup 的 wire 声明，SRC 因此继续把该参数判为 lookup 并以 unavailable 失败，而不会把 wire 值当成普通业务对象接受（`docs/subsystems/typert.md:21`）。失败词汇只有一个类：`RemoteError` 带稳定的 `<domain>/<reason>` 码，`RemoteErrorDetailsMap` 是可声明合并的明细表，调用方按 `code` 判别而不是 `instanceof`（`packages/typert/protocol/README.md:53`、`:64`）。

**包对外只暴露生成的子路径。** 有 Remote 方法（或发布 Typert 面）的包必须在 `package.json` 里声明 `./typert`（Host Loader 用）与 `./remote`（Client 装配用），两层都指向 `lib/` 下的生成文件（`packages/goal/goal/package.json:29-40`、`docs/api-gateway.md:118`）。`packages/goal/goal/package.json:59` 对 `@deepseek-ai/dsh-typert-protocol` 的 `peerDependencies` 就是这条依赖边：业务包只依赖轻量协议包，不依赖 registry、compiler 或 Client 运行时（`packages/typert/protocol/README.md:12`）。
