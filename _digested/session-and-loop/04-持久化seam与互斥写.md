# SessionPersistence：持久化 seam 与互斥写

源码核验入口：`packages/session/session-persistence/src/`（`index.ts` 抽象 Service、`handle.ts`、`storage-contract.ts`、`errors.ts`、`revision.ts`）、`packages/session/session-persistence-jsonl/src/`（`lease.ts`、`storage.ts`、`index.ts`、`format.ts`）、`packages/session/session-checkpoint-policy/`、`docs/subsystems/persistence.md`。

本篇说明 session log 落盘的那条 seam：抽象 Service 的五个方法、所有日志读写经过的 `SessionHandle`、进程内单写者与 shipped provider 叠在其上的跨进程租约，以及崩溃后谁来补全。

## 五个方法，零个按 id 的读写

`ctx.sessionPersistence` 是这条 seam 的键。抽象 `SessionPersistence`（`packages/session/session-persistence/src/index.ts:147-198`）只有五个方法：`create(header)`、`open(id, 'write' | 'read')`、`flush()`、`stat(id)`、`list()`。

没有「按 id 追加」或「按 id 加载」的方法。除 `stat`/`list` 外，每一次日志读写都经过 `create`/`open` 返回的 `SessionHandle`——这是 handle seam 与「一组静态方法」的分界。`agent-loop` 是生产上的 session 发布点，它在发布前取得该 session 的写 handle，因此组合里其它部分不需要知道持久化的存在。

`flush()` 是后端级持久化屏障：排空每一个活跃写 handle 已路由的事件并按 session 物化。单个 session 失败以 `AggregateError` 汇总，不中断整轮；扫掠中途被关闭的 handle 算作已 flush，因为 close 自身就是耐久排空。`stat` 只读 header 与 revision（可选 `eventCount`/`sizeBytes`），不读日志体。

## SessionHandle

| 方法 | 语义 |
|------|------|
| `read(offset?, length?)` | 返回 `{ eventState, events }`；`eventState` 区分独占的 `detached` 与可能同时被后端缓存持有的 `shared-frozen` 事件图，两种都可直接采用，需要可变副本的消费者自行克隆 |
| `append(events)` | 追加一批连续事件，首个 `seq` 必须等于已存的 next-seq，否则拒绝；解析即「已接受并有序」，只有解析的 `flush` 才承诺崩溃后仍在（shipped JSONL 后端事实上每批立即落盘） |
| `flush()` | 持久化屏障；同时物化一个空 session，使它可被 `list` 列出 |
| `close()` | 幂等且不可取消：读 handle 释放本地资源，写 handle 完成待决持久化并释放写所有权 |

读永不返回撕裂尾（torn tail）；同一 handle 的后续读不会看到比先前读更旧的状态；写 handle 能读到自己的成功追加。`append` 或 `flush` 一旦解析，同一后端实例上此后开始的读——任何 handle，或经 `stat`/`list`——至少观察到该前缀。

## 写入路径

后端拥有活写路径：它一次性安装 session 监听器，按 id 把每个已发布 session 的事件路由到该 session 的活跃写 handle。

`session/event` 复制进一个固定时长的批窗口：首批事件启动窗口，后续事件加入但不重置截止；到期把待决前缀排空进 handle 的变更链，排空期间到达的事件合并进下一批并保持顺序。`session/flush` 取消等待、排空到静止，再跑 `handle.flush()`——所以 loop 把它当作下一 turn 之前的排序与错误观察检查点。`session/disposed` 做最终排空并关闭 handle。

没有活跃写 handle 的已发布 session **不持久化任何东西**；只有 handle 取得的 session 才落盘，`ctx.sessions.create` 加 `session/flush` 本身不存储。

被拒绝的后台排空保留它的事件并暂停自动路径，显式 flush、写者关闭或后端拆除会立即重试并大声拒绝。

## 所有权：进程内声明，provider 补跨进程

`create` 与 `open(id, 'write')` 取进程内单写者所有权：占用中再开写抛 `SessionAlreadyOwnedError`，对已存在的 id `create` 抛 `SessionAlreadyExistsError`，在读 handle 上变更抛 `SessionReadOnlyError`——一种 handle 类型，运行时拒绝。对已关闭 handle 的任何操作抛 `SessionHandleClosedError`；`SessionOwnershipLostError` 标记所有权已永久失去的写 handle（关闭后重开）。

抽象 Service 只承诺到这一步，其 README 的 Known Limitations 也据此写着跨进程租约尚未落地。shipped JSONL provider 在 handle 形状之上把它补了出来（`packages/session/session-persistence-jsonl/src/lease.ts`）：仲裁者是内核——POSIX 在日志旁的 `session.lock` 上取非阻塞 `flock(2)`（经 `@deepseek-ai/node-addon-system/flock` 的 `tryLockExclusive`），Windows 持一个由该路径派生的命名内核信号量；两者**都不是文件锁或句柄锁**，所以读者、搜索与目录删除在锁被持有时照常进行。

争用映射为 `SessionAlreadyOwnedError`。持有者的描述符或最后一个对象句柄关闭时内核即释放，**包括进程死亡**，所以崩溃的持有者不会阻塞后继者。活但卡死的持有者会一直持有：没有过期时间，因为过期会把一个停滞写者的续写变成日志撕裂。POSIX 锁认 inode 不认路径，所以加锁后持有者校验被锁 inode 仍是锁路径上的那个文件，否则重试——被删除并重建的锁文件带新 inode，锁在孤立 inode 上不证明任何事。释放不移除 POSIX 锁文件。浏览器 worker 把 native flock 入口打桩为立即成功：它单进程，进程内声明已排除所有写者。

## 崩溃恢复

持久化返回物理上有效的日志，语义修复属于读者。崩溃在 turn 中途的 session 保留它未关闭的最后一个 turn——单个 turn 可以很大，且那些事件在崩溃前已耐久追加；只有从未确认的撕裂尾的不完整片段被丢弃，从其中恢复出的完整记录会在 handle 第一次新追加之前由写路径耐久重写。

resume（agent-loop）经它的写 handle 读已存日志，算出 `interruptedTurnClosers`——合成的 `tool/result` 错误、任何打开的 `step/end`、`turn/end {interrupted}`——并作为普通批次经同一 handle 追加。只读观察者（session-query）在内存中做同样的平衡，不写盘。合成 closer 是唯一的崩溃故事：没有「续上被中断的 turn」这种部分恢复。

## 格式与迁移的位置

`SessionHandle` 只暴露由 `SESSION_FORMAT_VERSION` 标识的当前逻辑记录。provider 必须在返回 handle 之前转换任何受支持的历史存储，shipped JSONL provider 经它的静态 catalog 迁移受支持的历史代（机制见 [`01-session-event-map.md`](./01-session-event-map.md)）。更新的格式指示操作者升级 harness。本 build 不认识的事件类型，除非信封标记 `ignorable`，否则拒绝；已提交前缀的损坏抛 `SessionPersistenceCorruptionError`。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/session/session-persistence/` | 抽象 Service、`SessionHandle` 契约、共享校验（`storage-contract`）、稳定错误类 |
| `packages/session/session-persistence-jsonl/` | shipped 后端：每 session 一个 zstd 拼接容器日志 + 跨进程租约 |
| `packages/session/session-checkpoint-policy/` | 在语义边界经 `session/flush` 落盘 |
| [`docs/subsystems/persistence.md`](../../docs/subsystems/persistence.md) | 服务契约、handle 语义、flush 检查点与崩溃恢复的完整面 |
| [`2026-08-27-handle-based-session-persistence`](../../.agents/notes/implemented/architecture/2026-08-27-handle-based-session-persistence.md) | handle seam 的设计与所有权模型 |

写入的格式面见 [`01-session-event-map.md`](./01-session-event-map.md)；loop 如何在 turn 边界使用 `session/flush` 见 [`02-inbox-与turn-时序.md`](./02-inbox-与turn-时序.md)。
