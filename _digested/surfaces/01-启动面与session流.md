# 源码启动、built bin，以及 host 如何推同一条 session 流

源码核验入口：根 `package.json` 的 `dsh` script、`apps/cli/package.json` `bin`、`apps/cli/src/bin.ts`、`packages/api/session-controller/`（Web host 会话流；`packages/host/apiproxy/` 已整体删除）。

五个 Launcher Profile 可以 boot 不同的 bundle 或组合，因此不一定共享同一进程或同一棵 Cordis 树；它们复用 `ctx.agents`、session log 和事件语义。

![pnpm dsh 走 tsx ESM](./figures/source-vs-built.svg)

## 两条启动面

| | 命令 | 解析 |
|--|------|------|
| 源码 | `node --import tsx/esm apps/cli/src/bin.ts`（`pnpm dsh`） | tsconfig `paths` → `packages/*/src`。碰到的模块必须是 ESM |
| 发行 | `apps/cli/lib/bin.js`（`package.json` `"bin": { "dsh": "lib/bin.js" }`） | 普通 Node 解析 built `lib/` |

不要混用：源码启动测到的「能 import 到 src」不代表发行物里裸插件名能解析。profile 的 `healProfilesModuleFallback` 是为任意 profile 目录解析安装闭包，见 composition 专题。

`bin.ts` 分发：普通任务 `runProfile`，`--dump-config` `runDumpConfig`。dump 与 boot 的层差（launcher 派生层、不求值 `!!js`）不是入口差异，见 [`../composition/02-dump-与boot-保真.md`](../composition/02-dump-与boot-保真.md)。

ACP：`dsh --profile acp`。launcher profile，stdout 留给协议帧。

## host / client 共享 `session/event`

![host 把 session/event 推上 mux](./figures/session-mux.svg)

运行时：`Session.append` 之后 Cordis `emit('session/event', session, event)`。这不是 log 事件本身——catalog 写明 log 事件经这一次 emit 到达监听器。

`packages/api/remotes/` 注册的 Host 转发循环订阅同一条 `session/event`（rc.1 起 apiproxy 包已删除），按白名单 `API_REMOTE_FORWARDED_EVENTS` 转发给浏览器/Web；tool 展示投影（terminal / diff 卡片）仍从 `presentResult` 一类纯函数派生，不是第二份事实。

浏览器半边（`packages/client/`）订阅读这些帧，slots / `ConversationNodeDefinition` 渲染。client **没有**另一份 append-only log。刷新 / 重连从持久化再 hydrate，仍然是同一条 session 的事件。

Host 把每一个已登记的 settings namespace 交给 Web；插件自己登记 Host schema 与浏览器卡片。事件转发白名单集中在 `API_REMOTE_FORWARDED_EVENTS`（`packages/api/remotes/src/remote-events.ts:16`，18 条转发事件；alpha.3 起就在这里），`packages/api/session-controller/src/remote-events.ts` 的同名文件只是 5 个 `api-session/*` 事件的 `TypertRemoteEventSelection` 模块扩充声明，不是白名单。不再有 apiproxy 的自维护暴露面。含图的 Web prompt 走 `attachments.admitEncodedImages` 批量准入（含 canonical base64 校验），再写成带 attachment 引用的 content block。历史分页按 `sourceEventSeqs` 取分组起点，避免大 transcript 上的调用栈溢出。

Python 捆绑 runtime 的 `minimal` smoke 把组装后的 system prompt、tool schema 和 model-visible messages 钉在 `scripts/snapshots/python-sdk-single-exe/minimal/model-visible.json`。

加 Web Chat 节点：在 **client** 上把 `ConversationNodeDefinition` 登记到 `ctx.conversationEvents`，并把 keyed renderer 登记到 `conversation.chat.node` slot。聚合快照视图才登记到 `ctx.conversationViews`；host 没有这些 client registry。不要在入口里再跑一套 loop。

## 三条命令平面（入口侧怎么接）

人敲 `/goal`：`ctx.commands` 适配器直接分派，`command/run` / `command/done` 入 log（通常 log-only）。不过模型 turn。

模型调 `bash`：`ctx.tools` 管道，call/result 入 log，result 在 surface 上。

那次 spawn：`ctx.shell` → subprocess / sandbox。入口代码不该自己 `child_process.spawn`。
