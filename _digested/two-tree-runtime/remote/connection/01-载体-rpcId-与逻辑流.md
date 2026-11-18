# 载体、rpcId 与逻辑流

> **为什么单独有这一页**：讨论前端调后端时，人很容易把「传输怎么连上（WebSocket / HTTP / 进程内）」和「业务方法怎么派发（Gateway / Typert）」搅在一起，结果一换宿主载体或要支持取消/双向流就改崩接口。DSH 刻意把**线本身（Connection）**和**线上面的业务协议（Gateway）**切成正交两层：所有逻辑流复用一条 WebSocket mux、请求响应严格按双向 `rpcId` 对账、上行/下行流独立检验。本页只讲「线与帧怎么传输」（业务派发看 [`../gateway/01`](../gateway/01-Host-派发与访问控制.md)）。
>
> 核验入口：[`docs/api-gateway.md`](../../../../docs/api-gateway.md)、[`packages/api/gateway/src/stream-protocol.ts`](../../../../packages/api/gateway/src/stream-protocol.ts)、[`packages/client/connection/src/rpc.ts`](../../../../packages/client/connection/src/rpc.ts)。

**相关性、取消与逻辑流。** Connection 独占 transport、RPC id、响应信封与请求取消，Gateway 只拥有 Remote 数据协议与业务派发：替换 carrier 不需要改 Remote descriptor 或 Client 编程接口（`docs/api-gateway.md:126`）。封装是 `{ type: 'client-request', rpcId, method, payload }` 与 `{ type: 'server-response', rpcId, result }`，发起方铸 `rpcId`、响应方回显（`packages/client/connection/src/rpc.ts:79-92`；`packages/client/AGENTS.md` 的 `rpcId is strictly bidirectional` 红线）。Client Remote 的实际调用是 `connection.rpc.call('/api', endpoint, { args: prepared.args }, prepared.signal)`，HTTP carrier 把它映射成 `POST /api/<namespace>/<method>`，payload 只有命名的 `args`（`packages/api/gateway/src/client/index.ts`、`docs/api-gateway.md:125`）。逻辑流另走一条与一元 `call` 分开的通道：Client 的 `openRemoteStream` 先看 carrier 是否提供 `connection.rpc.open?.('/api', endpoint, payload, signal)`（进程内或本地 carrier 用它），没有才落到共享的 WebSocket mux（`packages/api/gateway/src/client/index.ts`）。mux 上 Client 为每条流铸一个 `streamId`（`randomUUID()`），发 `{ type: 'open', streamId, endpoint, payload }`，结束时用 `{ type: 'cancel', streamId }`；Host 按 `streamId` 记账、重复 id 抛错、cancel 直接 abort 对应流（`packages/api/gateway/src/stream-server.ts:216` 的重复 id 抛错）；上行帧为 `open` / `item` / `end` / `cancel`（`packages/api/gateway/src/stream-protocol.ts:235-244`），下行帧只有 `item` / `error` / `end`（`:249-254`）。这条 mux 的固定路径是 `/api/remote.mux`（`packages/api/gateway/src/stream-protocol.ts:7`）。`docs/api-gateway.md:5` 明写「unary **and stream** Remote methods」，`:164` 的边界段也把 stream 方法编入（Session 事件流、分页、投影等仍在 Remote 方法之外）。**uplink** 面：`mode: 'stream'` 的方法可声明 `RemoteStream<Out, In>`（`packages/typert/protocol/src/types.ts:147`），生成的 Client `RemoteStreamHandle` 暴露 `send`/`end`/`dispose`（`:160-178`），Client 发送的每一项经 Gateway 用生成的 `In` codec 校验后由 Host 方法经 `this.ctx.invocation.uplink<In>()` 读取（`packages/api/gateway/src/index.ts:106-115` 的 UplinkSource、`:148` 的 `DEFAULT_STREAM_INBOX_BYTES` 上限与 `:1462-1471` 的 `uplink()`，超限抛 `gateway/uplink-overflow`）——uplink 不进 `args` 也不进参数列表。

## 传输层：Web 与桌面同用 mux

Web 用 `/api/remote.mux` 这一条 WebSocket 按 `streamId` 复用任意多条可独立取消的逻辑流（`packages/api/gateway/src/stream-protocol.ts:6`）；多会话就是多条并发的 `session.follow` 流（每 Session 一条，follow 调用在 `packages/api/session-controller/src/client/transport.ts:179`），不是一条会话级 channel。

桌面与 web 共用同一传输模型：desktop-host 经 `runProfile` 起 web 应用（webserver 以 `--port 0` 启动、端口由 OS 分配），host 把 `ctx.connection.authenticatedUrl(...)` 交给 Electron 窗口加载（`apps/desktop-host/src/index.ts`）。完整差异见 [`03-桌面入口.md`](../../../surfaces-entrypoints/03-桌面入口.md)。

## 插件作者视角

- **不要自己 `fetch`。** 取消、`rpcId` 相关性、信任边界都在 carrier 里；绕开它等于把这三样一起丢掉（`docs/api-gateway.md:126`）。
- **`rpcId` 严格双向。** initiator mint、responder echo，mint 只发生在 Connection（`packages/client/AGENTS.md` 的红线）——业务代码不该自己铸 id。
- **流的身份是 `streamId`，不是 `rpcId`。** Client 为每条流铸一个 `streamId`，Host 按它记账、重复 id 抛错、`cancel` 直接 abort 对应流（`packages/api/gateway/src/stream-server.ts:203`）。
- **uplink 不进 `args`。** 上行项经生成的 `In` codec 校验后由 Host 用 `this.ctx.invocation.uplink<In>()` 读取，超限抛 `gateway/uplink-overflow`（`docs/api-gateway.md:58`）。
