# Inspector：CDP 调试面

本页是 experimental 专题的第三个面——「调试面」形状的定位与启用总述见 [`00-map.md`](./00-map.md)；本页讲 Host / Client / Worker / shared 四个子目录怎么组成一个跨 realm 的 CDP hub。

## 四个子目录职责

职责按执行环境切（`packages/experimental/inspector/README.md:55`，与源码树核对一致）：`src/host/` 与 `src/client/` 是镜像的适配器入口（各自的 plugin / bridge / inspection / cdp），`src/worker/` 只含 Worker 线程编排与 Chrome 协议状态，`src/shared/` 是环境无关的 Cordis 与网络模型、realm 后端接口和内部桥协议；Worker 侧的 Host/Client 适配器镜像在 `src/worker/realms/`，其中 Client 适配器也在 Worker 里执行。

## 暴露面

Host 与 Client 的 Console 上下文、Host Sources 与断点/续跑、捕获的 Host fetch（`captureFetch` 默认开、不脱敏——`packages/experimental/inspector/src/index.ts:80` 默认 `true`，`README.md:136` 明说记录完整 URL、全部头、请求与响应体且不脱敏）、共享 Cordis 树投影进 Elements，外加不依赖 CDP 的语义查询 `ctx.inspector.cordis.getTree()`（`packages/experimental/inspector/src/shared/cordis/reader.ts:12`；README `:118` 说明它读 Worker 的最新快照、不建 CDP 会话）。Client 侧只声明 Runtime + Console + 只读 Sources：`Debugger.enable` 只发布构建出的 `lib/client.js` 目录，Client 脚本断点/单步不支持，全局 pause/resume 只控制 Host debugger（`packages/experimental/inspector/README.md:59`、`:164`）。方向与宿主相反——生产者只发内部观察记录，Worker 校验每帧、持有全部源状态并翻译成标准 CDP 域，Worker 从不触碰活的 Cordis 对象（前引 inspector README `:63`、`:118`）。

## 连接方式

Host 插件 `apply` 起 Worker、`ctx.provide('inspector', …)`（`packages/experimental/inspector/src/host/plugin.ts:84`）、经 `webserver/index-inject` 往 index.html 注入 `__DSH_INSPECTOR__` 引导（`:85`-`:87`）、随后打印 devtools 前端 URL（`:168`）；插件声明 `inject = ['webServer', 'connection']`、插件名 `experimental-inspector`（`packages/experimental/inspector/src/index.ts:60`、`:63`），它提供的服务键是 `inspector`（`host/plugin.ts:84` 的 `ctx.provide('inspector', …)`）。Client 插件读注入的 `globalThis.__DSH_INSPECTOR__`，缺失直接抛错（`packages/experimental/inspector/src/client/plugin.ts:58`、`:48`），带随机 subprotocol token（`dsh-inspector-v<version>-<base64url>`，`packages/experimental/inspector/src/host/bridge/controller.ts:188`）直连 Worker 的 `/ingest` WebSocket（`:235`）；Chrome DevTools 连 Worker 的 `ws://…/devtools/page/<id>` CDP socket（`:232`-`:233`）；每个 DevTools 连接在 Worker 里挂一条 `node:inspector.Session` 回 Host 主线程（`connectToMainThread`，`packages/experimental/inspector/src/worker/realms/host/bridge.ts:87`），所以 Host JS 暂停时 Console/Sources 仍可用。端口默认 9230、被占向上顺延（`index.ts:75`）；bind 地址被 schema 锁死 `z.const('127.0.0.1')`（`:74`），CDP socket 本身无 token、唯一访问控制就是 loopback（同 README `:147`）。启用：Web 插件页一键开 `inspector-profile`（`OPTIONAL_BUNDLES` 十二个之一，`packages/boot/app-boot/src/profile.ts:223`-`:236`；它在 `disabled: false` 的同时挂 `session-inspector` 并默认开 fetch capture），或源码态 `pnpm run demo:inspector`（`package.json:209`，`cordis.source.patch.yml`）。

## 源码入口

| 文件 | 一句话 |
|---|---|
| `packages/experimental/inspector/src/index.ts` | 包入口：`ctx.inspector` 声明、Config schema（host 锁 loopback、port 默认 9230） |
| `packages/experimental/inspector/src/host/plugin.ts` | Host 面：起 Worker、provide 服务、注入 client bootstrap |
| `packages/experimental/inspector/src/host/bridge/controller.ts` | Worker 启动与 endpoint/token 装配 |
| `packages/experimental/inspector/src/worker/server.ts` | Worker 装配：source registry、Network/DOM/Runtime 域、endpoints |
| `packages/experimental/inspector/src/worker/realms/host/bridge.ts` | 每 DevTools 连接一条 `node:inspector.Session` |
| `packages/experimental/inspector/src/client/plugin.ts` | Client 面：读 `__DSH_INSPECTOR__`、连 `/ingest` |

Web host/client 的启动面与注入路径见 [`../surfaces-entrypoints/00-map.md`](../surfaces-entrypoints/00-map.md)。
