# 会话窗口与 generation

> **为什么单独有这一页**：浏览器端展示长会话时，既不能每次重连都全量覆盖让滚动条和输入框闪烁重挂，又不能在 WebSocket 断线或历史分页拉取时靠局部补丁慢慢拼出空洞或错序。DSH 用「三层对象分工（`ClientSessions` / `SessionManager` / `Session`）+ 整段可替换的连续事件窗口 + `generation`」解开了这组矛盾。本页专门把这三个对象的边界以及 generation 换代时窗口如何衔接说透，理解它才能明白为什么界面不闪烁、断线后又能无缺口续接。
>
> 核验入口：[`docs/subsystems/web-client.md`](../../../../docs/subsystems/web-client.md) 的「Sessions」、[`packages/api/session-controller/README.md`](../../../../packages/api/session-controller/README.md)、[`packages/api/session-controller/src/client/sessions/`](../../../../packages/api/session-controller/src/client/sessions/)（`service.ts` / `manager.ts` / `session.ts`）。

## 三个对象

| 对象 | 入口 | 拥有什么 |
|------|------|----------|
| `ClientSessions` | `packages/api/session-controller/src/client/sessions/service.ts:234` | `ctx.sessions`：引用、source 计数、Session scope 与稳定的 `SessionBinding`；只投影目录状态，**不**选一个全局当前 Session（`docs/subsystems/web-client.md:44`） |
| `SessionManager` | `manager.ts:84` | 列表 baseline、live list/control 更新、懒建 Session、projection store、subagent 目录，以及 pull 与后续更新之间的冲突排序（`:45`） |
| `Session` | `session.ts:96` | 一份连续的 `SessionEventLikeEntry` 窗口、分页、follow、prompt/control 状态，以及给 adapter 的 observable 快照（`:46`） |

## 一份窗口怎么建立、怎么被替换

1. 首次打开拉 tail page；这一步幂等——在途或已打开都返回同一个 promise（`session.ts:393`）。
2. durable 路径打开 `follow()`：首帧含当前 header、tail page、cursor 与完整 projection baseline。history 记录带 `event` / `chunks` 判别式与对齐的内层 `event`，journal 在保留前逐段校验 inclusive 逻辑 seq（`docs/subsystems/web-client.md:48`）。
3. 每个 physical generation 用这份 snapshot **原子替换**整个保留窗口，之后 live 事件按 seq append；`page()` 只服务更旧历史与补洞（同上）。
4. 往更旧翻：prepend 一个 Turn 对齐页（至少 50 条消息、两个 Turn 起点，上限 500，`session.ts:405`）；跳转加载器继续向前翻，直到窗口覆盖目标 seq（`:427`）。
5. assistant 流另走一条：客户端用 `replace(entries, assistantStream)` 把重连基线合进窗口（`session.ts:677`），不把 raw chunk 写进 durable log。

## 它不是第二份真相

Host controller 决定耐久状态与 mutation 结果；Client model 只维护最新可用的本地投影，并编码「延迟响应与替换基线如何合并」（`docs/subsystems/web-client.md:54`）。所以窗口可以被整段替换，而 UI 不能因此丢对象身份——`SessionBinding` 与 observable snapshot 的引用稳定性就是这条的机械保证。

## 插件作者视角

- **读历史**：拿 `ctx.sessions` 上的 `SessionBinding` 与 snapshot；不要自己再开一条 `follow`，重连、补洞、竞态都归 `Session` 管。
- **不要缓存窗口**：把 entries 复制进 entry 的 store 或 local state，generation 替换之后就永久过期。
- **新事件类型的三道门**：先在 Host 侧成为 durable session event（model-visible ⟺ logged），再过客户端 wire 白名单（[`../../remote/streams/02`](../../remote/streams/02-follow-frame-types-and-session-wire-validation.md)），最后才谈渲染（[`../view/02`](../view/02-conversation-node-definitions-and-incremental-rendering.md)）。
