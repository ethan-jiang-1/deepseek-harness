# `_coverage` — 源码消化覆盖矩阵

维护用索引，不是专题正文。用来判断哪些子系统已经有机制级消化，哪些只在地图里出现，哪些还没进 `_digested/`。

骨架阶段全部是「地图级」或「待补」。有机制级正文后再改状态。

## 状态

| 状态 | 含义 |
|------|------|
| 机制级覆盖 | 有专题正文解释状态对象、关键算法/数据流、源码入口和边界 |
| 地图级覆盖 | 只在 `00-map.md`、总览或官方文档入口中出现 |
| 部分覆盖 | 有若干机制点被解释，但子系统仍缺完整专题 |
| 待补 | 基本没有进入 `_digested/` |

## 按专题

| 专题 | 状态 | 源码入口（粗） |
|------|------|----------------|
| `system/` | 地图级 | [`docs/architecture.md`](../../docs/architecture.md) |
| `cordis-runtime/` | 地图级 | `vendor/cordis/`、`vendor/loader/`、`vendor/include/` |
| `composition/` | 地图级 | `packages/boot/app-boot/`、`packages/bundle/` |
| `session-and-loop/` | 地图级 | `packages/core/{session,agent,agent-loop,scope}/` |
| `capability-seams/` | 地图级 | [`docs/capability-seams.md`](../../docs/capability-seams.md)、各 `packages/<group>/` |
| `tools-prompt-llm/` | 地图级 | `packages/core/{tools,system-prompt}/`、`packages/llm/` |
| `surfaces/` | 地图级 | `apps/cli/`、`packages/{host,client,sdk,acp}/` |

按 `packages/<group>/` 的细表等机制级正文出现后再拆。不要在这里手抄 [`packages/README.md`](../../packages/README.md) 的完整组清单。
