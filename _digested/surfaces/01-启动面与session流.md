# 源码启动、built bin，以及 host 如何推同一条 session 流

源码核验入口：根 `package.json` 的 `dsh` script、`apps/cli/package.json` `bin`、`apps/cli/src/bin.ts`、`packages/host/apiproxy/src/api-proxy.ts`。

四个入口可以 boot 不同的 bundle 或叶子 `cordis.yml`，因此不一定共享同一进程或同一棵 Cordis 树；它们复用 `ctx.agents`、session log 和事件语义。

![pnpm dsh 走 tsx ESM](./figures/source-vs-built.svg)

## 两条启动面

| | 命令 | 解析 |
|--|------|------|
| 源码 | `node --import tsx/esm apps/cli/src/bin.ts`（`pnpm dsh`） | tsconfig `paths` → `packages/*/src`。碰到的模块必须是 ESM |
| 发行 | `apps/cli/lib/bin.js`（`package.json` `"bin": { "dsh": "lib/bin.js" }`） | 普通 Node 解析 built `lib/` |

不要混用：源码启动测到的「能 import 到 src」不代表发行物里裸插件名能解析。profile 的 `healProfilesModuleFallback` 是为任意 profile 目录解析安装闭包，见 composition 专题。

`bin.ts` 分发：普通任务 `runProfile`，`--dump-config` `runDumpConfig`。dump 与 boot 的层差（launcher 派生层、不求值 `!!js`）不是入口差异，见 [`../composition/02-dump-与boot-保真.md`](../composition/02-dump-与boot-保真.md)。

ACP demo：`node --import tsx packages/examples/acp-demo/src/bin.ts --config examples/acp-agent/cordis.yml`。叶子配置，不是 `web`/`headless` 模板。stdout 留给协议帧。

## host / client 共享 `session/event`

![host 把 session/event 推上 mux](./figures/session-mux.svg)

运行时：`Session.append` 之后 Cordis `emit('session/event', session, event)`。这不是 log 事件本身——catalog 写明 log 事件经这一次 emit 到达监听器。

`dsh-host-apiproxy` 听同一条事件，打成 mux 帧 `{ type: 'session/event', sessionId, event, view? }`。`view` 是 tool 展示投影（terminal / diff 卡片），从 `presentResult` 一类纯函数来，不是第二份事实。

浏览器半边（`packages/client/`）订阅读这些帧，slots / `ConversationNodeDefinition` 渲染。client **没有**另一份 append-only log。刷新 / 重连从持久化再 hydrate，仍然是同一条 session 的事件。

加 Web Chat 节点：在 **client** 上把 `ConversationNodeDefinition` 登记到 `ctx.conversationEvents`，并把 keyed renderer 登记到 `conversation.chat.node` slot。聚合快照视图才登记到 `ctx.conversationViews`；host 没有这些 client registry。不要在入口里再跑一套 loop。

## 三条命令平面（入口侧怎么接）

人敲 `/goal`：`ctx.commands` 适配器直接分派，`command/run` / `command/done` 入 log（通常 log-only）。不过模型 turn。

模型调 `bash`：`ctx.tools` 管道，call/result 入 log，result 在 surface 上。

那次 spawn：`ctx.shell` → subprocess / sandbox。入口代码不该自己 `child_process.spawn`。
