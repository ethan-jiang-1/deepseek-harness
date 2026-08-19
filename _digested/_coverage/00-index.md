# `_coverage` — 源码消化核验矩阵

本页记录 `_digested` 明确回答了哪些问题、结论住在哪篇机制参考、最后对哪个产品源码 commit 复核。它不按篇数估算“完成度”，也不承诺覆盖未列出的包或行为；完整包组清单由 [`packages/README.md`](../../packages/README.md) 维护。

产品源码基线：`99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`。受影响行的判定见 [`../_change_log/0001-0.1.0-rc.5-to-0.1.0-rc.7.md`](../_change_log/0001-0.1.0-rc.5-to-0.1.0-rc.7.md)。

## 状态

| 状态 | 含义 |
|------|------|
| 已核验 | 结论页已按“最近核验”所列产品 commit 对照源码 |
| 需复核 | 上游同步触及来源，结论尚未重新核验 |
| 未覆盖 | 问题已登记，但还没有机制参考 |

## 核验矩阵

| 专题 | 已核验问题 | 结论页 | 状态 | 最近核验 |
|------|------------|--------|------|----------|
| `system/` | 扩展表中非显然的落点；从单体 loop 迁移时各职责归属 | [`01`](../system/01-扩展表非显然落点.md) · [`02`](../system/02-对照单一loop.md) | 需复核 | `47f943859bef60e4160492346772ded9b24f765a` |
| `cordis-runtime/` | 五条原语；waterfall 派发；Loader/Include 与 `!!js`；产品依赖的 vendor 修改 | [`01`](../cordis-runtime/01-五条原语对照源码.md) · [`02`](../cordis-runtime/02-waterfall-与事件合同.md) · [`03`](../cordis-runtime/03-loader-include-与js插值.md) · [`04`](../cordis-runtime/04-vendor-本地修改.md) | 已核验 | `47f943859bef60e4160492346772ded9b24f765a` |
| `composition/` | profile boot 时序；dump 与 boot 的共同算法和层差；用户 patch HMR 事务 | [`01`](../composition/01-boot-时序.md) · [`02`](../composition/02-dump-与boot-保真.md) · [`03`](../composition/03-user-patch-hmr.md) | 需复核 | `47f943859bef60e4160492346772ded9b24f765a` |
| `session-and-loop/` | session 信封与读时版本；inbox/turn/step 时序；替换默认 loop 的运行时义务 | [`01`](../session-and-loop/01-session-event-map.md) · [`02`](../session-and-loop/02-inbox-与turn-时序.md) · [`03`](../session-and-loop/03-换loop的半径.md) | 已核验 | `47f943859bef60e4160492346772ded9b24f765a` |
| `capability-seams/` | 三种角色与分包装；E2B provider 组合；bash 的本地 confinement 调用链 | [`01`](../capability-seams/01-三角色与分包装.md) · [`02`](../capability-seams/02-一次bash从tool到sandbox.md) | 需复核 | `47f943859bef60e4160492346772ded9b24f765a` |
| `tools-prompt-llm/` | prompt section 与稳定前缀；工具审批/timeout；chunk 与 message 的日志关系 | [`01`](../tools-prompt-llm/01-section顺序与前缀.md) · [`02`](../tools-prompt-llm/02-管道审批timeout与chunk.md) | 需复核 | `47f943859bef60e4160492346772ded9b24f765a` |
| `surfaces/` | 源码与 built 启动面；host session 流；ACP 与 JSON-RPC 的不同投影保证 | [`01`](../surfaces/01-启动面与session流.md) · [`02`](../surfaces/02-acp与jsonrpc.md) | 需复核 | `47f943859bef60e4160492346772ded9b24f765a` |

上游同步先按变更路径定位受影响行，将其改为“需复核”；复核结论、源码入口和图后，再写入新的产品 commit。未受影响的行保留原最近核验值。
