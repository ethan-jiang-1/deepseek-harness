# 源码启动、built bin，以及 host 如何推同一条 session 流

源码核验入口：根 `package.json` 的 `dsh` script、`apps/cli/package.json` `bin`、`apps/cli/src/bin.ts`、`packages/api/session-controller/`（Web host 会话流）、`packages/api/remotes/`（Host 事件转发白名单）。

五个 Launcher Profile 可以 boot 不同的 bundle 或组合，因此不一定共享同一进程或同一棵 Cordis 树；它们复用 `ctx.agents`、session log 和事件语义。桌面应用不在其中：`dsh --profile desktop` 被显式拒绝，它由 Electron 壳启动私有 host，见 [`03-桌面入口.md`](./03-桌面入口.md)。

![pnpm dsh 走 tsx ESM](./figures/source-vs-built.svg)

## 三条启动面

| | 命令 | 解析 |
|--|------|------|
| 源码 | `node --import tsx/esm apps/cli/src/bin.ts`（`pnpm dsh`） | tsconfig `paths` → `packages/*/src`。碰到的模块必须是 ESM |
| 发行 | `apps/cli/lib/bin.js`（`package.json` `"bin": { "dsh": "lib/bin.js" }`） | 普通 Node 解析 built `lib/` |

第三条 Desktop：Electron 壳 `apps/desktop`（`@deepseek-ai/dsh-desktop`）包住 Web UI，私有 `apps/desktop-host`（`@deepseek-ai/dsh-desktop-host`）是 Node 子进程 host，0.1.7 线起经 `runProfile` 起 `desktop` profile 的完整 web 应用（webserver 监听 `127.0.0.1:19387`，认证 URL 交给窗口），CLI 仍拒绝 `dsh --profile desktop`（`rejectElectronProfile`，`apps/cli/src/args.ts:83`）。完整差异见 [`03-桌面入口.md`](./03-桌面入口.md)。

不要混用：源码启动测到的「能 import 到 src」不代表发行物里裸插件名能解析。profile 的安装闭包解析现由 runtime-resolution 拦截层承担（runtime-resolution / LinkedRoot，`packages/boot/app-boot/src/profile.ts:431-464` 的 `createRuntimeResolution`），见 composition 专题。

`bin.ts` 分发：普通任务 `runProfile`、`plugin` `runPlugin`、dump（`--dump-config`/`--dump-default-config`）`runDumpConfig`。dump 与 boot 的层差（launcher 派生层、不求值 `!!js`）不是入口差异，见 [`../composition-boot/02-dump-与boot-保真.md`](../composition-boot/02-dump-与boot-保真.md)。

ACP：`dsh --profile acp`。launcher profile，stdout 留给协议帧。

## host / client 共享 `session/event`

![session 事件从 append 走到浏览器 slots](./figures/session-mux.svg)

运行时：`Session.append` 之后 Cordis `emit('session/event', session, event)`。这不是 log 事件本身——catalog 写明 log 事件经这一次 emit 到达监听器。

同一条 emit 有两条互不相同的出站链路。旧页把它们并成了一条，NEW 下必须分开写：

- **session 事件 → 浏览器**：`packages/api/session-controller/` 的 `follow` Remote stream 在 `packages/api/session-controller/src/history.ts:146` 订阅 `session/event`，把开窗快照与按序事件帧交给客户端。同一包 `packages/api/session-controller/src/index.ts:186` 的同名订阅只做 selection 记账与 `api-session/activity` 派生（`:196`），**不转发事件体**。
- **Host 侧非 session 事件 → 浏览器**：`packages/api/remotes/` 的转发循环按白名单 `API_REMOTE_FORWARDED_EVENTS` 转发 `api-session/*`、`approval/request`、`user-questions/request`、`cordis/*`、`settings/document-updated` 等。

白名单里**没有** `session/event`，NEW 与 OLD 皆然——浏览器拿 session 事件从来不靠它。

浏览器半边（`packages/client/`）订阅读这些帧，slots / `ConversationNodeDefinition` 渲染。client **没有**另一份 append-only log。刷新 / 重连从持久化再 hydrate，仍然是同一条 session 的事件。

Host 把每一个已登记的 settings namespace 交给 Web；插件自己登记 Host schema 与浏览器卡片。事件转发白名单集中在 `packages/api/remotes/src/remote-events.ts:20-47`，本基线是 **27 条**（0008 跨度内新增：`agent-preset/selected`、`commands/change`、`credentials/reference-updated`、`cordis/inspect-query(-resolved)`、`permission-presets/catalog-changed`、`plugin-manager/changed|install-log|install-state`；0009 跨度内新增：`deepseek-account/session-expired`、`deepseek-account/model-sign-in-required`、`credentials/record-updated`、`schedule/changed`；`goal/activation-changed` 在 `:33`，`mode: 'emit'`）；`packages/api/session-controller/src/remote-events.ts` 的同名文件只是 5 个 `api-session/*` 事件的 `TypertRemoteEventSelection` 模块扩充声明，不是白名单。含图的 Web prompt 不再由 session-controller 直接批量准入：它经 `ctx.attachments.admitPromptContent(...)`（`packages/api/session-controller/src/commands.ts:354`）走到 attachment capability 内部（`packages/attachment/attachment/src/index.ts:114` 的 `admitPromptContent`，图像批交给 `packages/attachment/attachment/src/admission.ts` 的 `admitEncodedImages`），session-controller 保留图像模态检查与 `session/attachment-invalid` 映射。历史分页仍按 `sourceEventSeqs` 取分组起点，避免大 transcript 上的调用栈溢出。

### Web 会话流的三类帧

客户端 `follow` 读到的帧有三类，`packages/api/session-controller/src/types.ts:552` 的 `SessionFollowFrame` 是它们的并集：

| 帧 | 来源 | 说明 |
|----|------|------|
| 开窗快照 | durable log | 含可选 `assistantStream` 基线（`:507` 的 `SessionAssistantStreamBaseline`） |
| durable event | durable log | 逐条 session 事件，gap-free |
| `assistant-stream` | 进程内 | 仅当请求位 `assistantStream: true`（`:490`）时追加；不是 log 的第二个副本 |

客户端在 `packages/api/session-controller/src/client/transport.ts:181` 显式 opt-in。host 侧累积器是 `packages/api/session-controller/src/assistant-stream.ts`：「Process-local assistant state retained for reconnecting Web followers」。每次接受的 revision 物化一份不可变重连基线（同文件 `:21` 的 `EMPTY_BASELINE`、`:84` 的 `snapshot()`），客户端在 `packages/api/session-controller/src/client/sessions/session.ts:677` 以 `replace(entries, assistantStream)` 合并。它承担的是「重连时把正在流式输出的 assistant attempt 接回来」，不是把 raw chunk 补进 durable log。

客户端对 wire 事件另有一层逐字段白名单：`assertSessionWireEvent()`（`packages/api/session-controller/src/client/session-wire-event.ts:14`）先限定 `type/seq/time/data/ignorable/surfaceOp/sourceEventSeqs`（`:20-33`），再跑 `validateSurfaceMetadata` 与 `validateSessionEventData`（`:44-45`），**不**重写或规范化 wire 字段，也不在这里做范围或来源存在性检查（那需要 durable log，属 Host）。三个调用点都在 `packages/api/session-controller/src/client/transport.ts`：`:185`（history page）、`:217`（live 帧）、`:233`（prepend page）。

### 传输层：Web 与桌面同用 mux

Web 用 `/api/remote.mux` 这一条 WebSocket 按 `streamId` 复用任意多条可独立取消的逻辑流（`packages/api/gateway/src/stream-protocol.ts:6`）；多会话就是多条并发的 `session.follow` 流（每 Session 一条，follow 调用在 `packages/api/session-controller/src/client/transport.ts:179`），不是一条会话级 channel。

桌面 0.1.7 线起与 web 共用同一传输模型：desktop-host 经 `runProfile` 起 web 应用，webserver 监听 `127.0.0.1:19387`，host 把 `ctx.connection.authenticatedUrl(...)` 交给 Electron 窗口加载（`apps/desktop-host/src/index.ts:103-104`）。~~旧的「无监听端口 + `__DSH_TRANSPORT__.openStream` 注入 + framed byte pipes」传输~~（0.1.7 线随 desktop-host 重构退役：`apps/desktop-host/src/wire.ts` 已不存在）。完整差异见 [`03-桌面入口.md`](./03-桌面入口.md)。

**浏览器认证面**（web 与桌面同一条链）：入口 URL 是一次性 process-token URL——`authenticatedUrl(baseUrl)` 把启动 token 拼进 query（`packages/client/connection/src/browser-auth.ts:223`）；浏览器首个请求用它换取 `dsh-auth-` 前缀的 HMAC 签名 cookie（`:16` 的 `COOKIE_PREFIX`，HMAC secret 持久化在 credentials 体系 `client-connection/browser-session` 记录下，`:12` 的 `AUTH_RECORD_KEY`）；此后未认证请求一律 401（`packages/client/connection/src/rpc-host.ts:107`）。web 的 stdout 行已改为 `dsh web: ${authenticatedUrl} (LAN: ${lanUrl})`——两个地址都带各自的认证 token（`packages/bundle/web-app/src/index.ts:271`）。

Python 捆绑 runtime 的 `minimal` smoke 把组装后的 system prompt、tool schema 和 model-visible messages 钉在 `scripts/snapshots/python-sdk-single-exe/minimal/model-visible.json`。

加 Web Chat 节点：在 **client** 上把 `ConversationNodeDefinition` 经 `ctx.uiConversation.events.register(definition)` 登记（`packages/client/ui-chat/src/client/conversation-nodes/tool.ts:305`、`packages/client/ui-trajectory/src/client/trajectory-assistant-definition.ts:465`），并把 keyed renderer 登记到 `conversation.chat.node` slot。聚合快照视图才走 `ctx.uiConversation.views.register(...)`（`packages/client/ui-chat/src/client/conversation-nodes/chat-snapshot-builder.ts:1214`）；服务键是 `'uiConversation'`（`packages/client/ui-conversation/src/client/conversation/assembly.ts:201`），host 没有这些 client registry。加右栏内容类型走资源协议，见 [`04-客户端资源模型与右栏.md`](./04-客户端资源模型与右栏.md)。不要在入口里再跑一套 loop。

## 三条命令平面（入口侧怎么接）

人敲 `/goal`：`ctx.commands` 适配器直接分派，`command/run` / `command/done` 入 log（通常 log-only）。不过模型 turn。

模型调 `bash`：`ctx.tools` 管道，call/result 入 log，result 在 surface 上。

那次 spawn：`ctx.shell` → subprocess / sandbox。入口代码不该自己 `child_process.spawn`。
