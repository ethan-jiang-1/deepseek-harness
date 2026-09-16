# `_coverage` — 源码消化核验矩阵

本页记录 `_digested` 明确回答了哪些问题、结论住在哪篇机制参考、最后对哪个产品源码 commit 复核。它不按篇数估算“完成度”，也不承诺覆盖未列出的包或行为；完整包组清单由 [`packages/README.md`](../../packages/README.md) 维护。

产品源码基线：`183f08e9c6dde7e36cd2318eaee70b0da08fb35e`（`dsh-v0.1.5-rc.1`）。受影响行的判定见 [`../_change_log/0006-0.1.2-rc.1-to-0.1.5-rc.1.md`](../_change_log/0006-0.1.2-rc.1-to-0.1.5-rc.1.md)。

「最近核验」列写的是该专题最后对到的产品 commit，可能**小于等于**产品源码基线：上游同步并未触及某个专题时，其核验值沿用上一轮，不会被基线更新。这不是口径不一致，只说明该专题的入口在本次同步中无 diff。0005 复核后当时的九行曾全部对齐 `a66e470204`；0006 跨度（1512 个提交，含 session 格式升到 v3、客户端资源面、subprocess containment、约 700 篇 Note 归档）触及全部专题，故全部重新标为「需复核」，逐专题审计后写回新值。矩阵本轮同时补上了此前从未登记的 `runtime-profiles/`，现为十行；十行现已全部回到 `183f08e9c6`，其中九行的复核由专题子代理逐条打开源码完成，`surfaces/` 行的结论页同时补齐了本轮新增的 `03`、`04` 两篇。

## 状态

| 状态 | 含义 |
|------|------|
| 已核验 | 结论页已按“最近核验”所列产品 commit 对照源码 |
| 需复核 | 上游同步触及来源，结论尚未重新核验 |
| 未覆盖 | 问题已登记，但还没有机制参考 |

## 核验矩阵

| 专题 | 已核验问题 | 结论页 | 状态 | 最近核验 |
|------|------------|--------|------|----------|
| `system/` | 扩展表中非显然的落点；从单体 loop 迁移时各职责归属 | [`01`](../system/01-扩展表非显然落点.md) · [`02`](../system/02-对照单一loop.md) | 已核验 | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` |
| `cordis-runtime/` | 五条原语；waterfall 派发；Loader/Include 与 `!!js`；产品依赖的 vendor 修改 | [`01`](../cordis-runtime/01-五条原语对照源码.md) · [`02`](../cordis-runtime/02-waterfall-与事件合同.md) · [`03`](../cordis-runtime/03-loader-include-与js插值.md) · [`04`](../cordis-runtime/04-vendor-本地修改.md) | 已核验 | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` |
| `composition/` | profile boot 时序；dump 与 boot 的共同算法和层差；用户 patch HMR 事务；profile 创建路径与保留名 | [`01`](../composition/01-boot-时序.md) · [`02`](../composition/02-dump-与boot-保真.md) · [`03`](../composition/03-user-patch-hmr.md) · [`04`](../composition/04-profile-创建与保留名.md) | 已核验 | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` |
| `runtime-profiles/` | 五个 Launcher Profile 的共同基底与差异；桌面这一应用自有组合 | [`00`](../runtime-profiles/00-map.md) · [`01`](../runtime-profiles/01-web.md) · [`02`](../runtime-profiles/02-headless.md) · [`03`](../runtime-profiles/03-sdk.md) · [`04`](../runtime-profiles/04-sdk-minimal.md) · [`05`](../runtime-profiles/05-acp.md) · [`06`](../runtime-profiles/06-desktop.md) | 已核验 | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` |
| `session-and-loop/` | session 世代与迁移机制；inbox/turn/step 时序；替换默认 loop 的运行时义务 | [`01`](../session-and-loop/01-session-event-map.md) · [`02`](../session-and-loop/02-inbox-与turn-时序.md) · [`03`](../session-and-loop/03-换loop的半径.md) · [`04`](../session-and-loop/04-格式世代与迁移.md) | 已核验 | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` |
| `capability-seams/` | 三种角色与分包装；E2B provider 组合；bash 的本地 confinement 调用链与原生 containment；subagent 后台、目录与宿主交付；外发代理这类「刻意不是 seam」的进程级策略 | [`01`](../capability-seams/01-三角色与分包装.md) · [`02`](../capability-seams/02-一次bash从tool到sandbox.md) · [`03`](../capability-seams/03-subagent后台与产品provider.md) · [`04`](../capability-seams/04-新增seam与Remote.md) · [`05`](../capability-seams/05-subagent-catalog与host交付.md) · [`06`](../capability-seams/06-外发代理策略.md) · [`07`](../capability-seams/07-原生containment与native-system.md) | 已核验 | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` |
| `tools-prompt-llm/` | prompt section 顺序与稳定前缀；system prompt 作为 surface 节点；in-history 替换能力；工具审批/timeout；chunk 到 settlement 的日志关系；内容块投影 | [`01`](../tools-prompt-llm/01-section顺序与前缀.md) · [`02`](../tools-prompt-llm/02-管道审批timeout与chunk.md) · [`03`](../tools-prompt-llm/03-system-prompt作为surface节点.md) · [`04`](../tools-prompt-llm/04-in-history提示词替换.md) · [`05`](../tools-prompt-llm/05-chunk到settlement.md) · [`06`](../tools-prompt-llm/06-文件块与内容块投影.md) | 已核验 | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` |
| `surfaces/` | 源码与 built 启动面；host session 流；ACP 与 JSON-RPC 的不同投影保证；桌面这一第五入口；客户端资源模型与右栏 | [`01`](../surfaces/01-启动面与session流.md) · [`02`](../surfaces/02-acp与jsonrpc.md) · [`03`](../surfaces/03-桌面入口.md) · [`04`](../surfaces/04-客户端资源模型与右栏.md) | 已核验 | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` |
| `agent-loop/` | step/turn/activity/goal 四层结束边界；goal 创建的三条路径与状态机（含模型通道的 `paused` 禁令）；Goal Round Driver 的自动续轮、竞态栅栏与重启后 re-arm；Agent 运行时身份与 initiator 权限判据 | [`00`](../agent-loop/00-map.md) · [`01`](../agent-loop/01-goal-lifecycle.md) · [`02`](../agent-loop/02-goal-round-driver.md) · [`03`](../agent-loop/03-activity-vs-goal-boundaries.md) · [`04`](../agent-loop/04-agent-runtime-identity.md) | 已核验 | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` |
| `experimental/` | python 子进程后端；Agent Teams 服务/工具/双 profile（含 public 例外边界）；Inspector CDP 调试面 | [`00`](../experimental/00-map.md) · [`01`](../experimental/01-code-runtime-python.md) · [`02`](../experimental/02-agent-teams.md) · [`03`](../experimental/03-inspector.md) | 已核验 | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` |

上游同步先按变更路径定位受影响行，将其改为“需复核”；复核结论、源码入口和图后，再写入新的产品 commit。未受影响的行保留原最近核验值。0006 一轮已完成全部十行的重写入，本矩阵当前没有“需复核”行。
