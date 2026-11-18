# 客户端 mount 与装配

> **为什么单独有这一页**：写了 `@Remote` 方法也在 Host 跑起来了，浏览器里 `ctx.remote.<namespace>` 却还是 `undefined` 或报 inject 错——这是插件开发最高频的困惑之一。原因在于 DSH 故意**不做运行期自动服务发现**，Client 侧到底暴露哪些远程方法完全由各包 `/remote` 子路径的显式 `$mount` 决定。本页对应 [`01`](./01-Host-派发与访问控制.md) 的 Host 半边，讲清 Client 这一端如何把静态生成 descriptor 安装成受 fiber 生命期托管的具体 getter 方法，帮你排查「服务端有、客户端看不见」的装配断点。
>
> 核验入口：[`docs/api-gateway.md`](../../../../docs/api-gateway.md)、[`packages/api/gateway/src/client/index.ts`](../../../../packages/api/gateway/src/client/index.ts)、[`packages/api/remotes/src/client/index.ts`](../../../../packages/api/remotes/src/client/index.ts)。

**Client 如何把 namespace 挂成 `ctx.remote.<namespace>`。** `ctx.remote` 只暴露被导入的 `/remote` 产物贡献的 namespace（`docs/subsystems/typert.md:472`）。`$mount(contribution)` 在调用者 fiber 里把「注册 descriptor 集」与「装具体方法」做成一次 owned 操作（`packages/api/gateway/src/client/index.ts:214-221`）：先把 contribution 注册进 `ctx.typert.remotes`，再按 `descriptor.namespace` 分组，为每组经 `ownerCtx.plugin()` 起一个 `remote.<namespace>` 子服务，并把该组方法在同一同步窗口内装上去（`packages/api/gateway/src/client/index.ts:239-265`、`:346-378`）。方法是服务上的具体 getter，不是 JavaScript `Proxy`，也没有 Host 业务 Service 类型进入 consumer（`docs/subsystems/typert.md:472`；`packages/api/gateway/src/client/index.ts:688-700`）。子服务名就是 `remote.${namespace}`（`packages/api/gateway/src/client/index.ts:765-767`），其生命周期覆盖它挂载的全部方法；卸载 Client contribution 会同时移除 descriptor 与具体方法、abort 在途调用，并让外部保留的旧方法句柄拒绝后续调用（`docs/api-gateway.md:134`）。直接与 scoped 调用分别出现在 `ctx.remote.<namespace>` 与 `agentCtx.remote.<namespace>`，依赖声明归实际调用方：只有真正读该 namespace 的业务包才在自己的 `inject` 里同时声明 `remote` 与 `remote.<namespace>`（`docs/api-gateway.md:60`）。

**主装配在一处，但不是唯一 mount 点。** `packages/api/remotes` 的 Client 端 runtime-import 各业务包的 `/remote` 子路径（贡献数由 [`harness-idea/claims.json`](../../../harness-idea/claims.json) 的 `remote-import-count` 指标机械核对，清单以源文件为准），循环 `await ctx.remote.$mount(contribution)`，并从同一批文件 re-export 声明合并以把类型带进业务代码；卸载按相反顺序展开（`packages/api/remotes/src/client/index.ts:203-207`、`docs/api-gateway.md:80`）。`api/remote-access` 与 experimental 的 client 插件（`client-ui-cot-translation`、`client-ui-voice-input`、`client-ui-claude-code-mods`）各自 mount 自己的 `/remote` 贡献，所以「哪些 Host 方法对某个 Client 可见」由这些装配清单一并选定，而不是运行时发现（`docs/api-gateway.md:82`）。

## 插件作者视角

四件事决定你的方法在浏览器侧**存不存在**：

- **没进装配清单就等于不存在。** `ctx.remote` 只暴露被导入的 `/remote` 产物贡献的 namespace（`docs/subsystems/typert.md:472`）；主清单在 `packages/api/remotes`，`api/remote-access` 与几个 experimental client 插件各自 mount 自己的贡献（`docs/api-gateway.md:82`）。
- **inject 要写两个名字。** 真正读该 namespace 的包同时声明 `remote` 与 `remote.<namespace>`（`docs/api-gateway.md:60`）；只写前者，调用点是 `undefined`。
- **句柄有生命周期。** 卸载 Client contribution 会移除 descriptor 与具体方法、abort 在途调用，并让外部保留的旧方法句柄拒绝后续调用（`docs/api-gateway.md:134`）——不要把 `ctx.remote.x.y` 缓存到模块级变量。
- **子服务不是 Proxy。** 方法是服务上的具体 getter（`packages/api/gateway/src/client/index.ts:688-700`），所以类型来自生成的声明合并，而不是运行时反射。
