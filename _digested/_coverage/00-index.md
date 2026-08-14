# `_coverage` — 源码消化覆盖矩阵

维护用索引，不是专题正文。用来判断哪些子系统已经有机制级消化，哪些只在介绍里出现，哪些还没进 `_digested/`。

当前阶段：各专题 `00-map.md` 是图文介绍。机制级正文尚未写。

## 状态

| 状态 | 含义 |
|------|------|
| 机制级覆盖 | 有专题正文解释状态对象、关键算法/数据流、源码入口和边界 |
| 介绍级覆盖 | `00-map.md` 把这一层讲清楚了，并配了 `figures/`，但还没有对源码逐函数核验 |
| 地图级覆盖 | 只在总览或官方文档入口中出现 |
| 部分覆盖 | 有若干机制点被解释，但子系统仍缺完整专题 |
| 待补 | 基本没有进入 `_digested/` |

## 按专题

| 专题 | 状态 | 图 | 源码入口（粗） |
|------|------|----|----------------|
| `system/` | 介绍级 | `six-layers` · `event-domains` · `extend-not-patch` | [`docs/architecture.md`](../../docs/architecture.md) |
| `cordis-runtime/` | 介绍级 | `five-ideas` · `waterfall` · `vendor-stack` | `vendor/cordis/`、`vendor/loader/`、`vendor/include/` |
| `composition/` | 介绍级 | `patch-layers` · `profile-home` | `packages/boot/app-boot/`、`packages/bundle/` |
| `session-and-loop/` | 介绍级 | `turn-step` · `model-visible-logged` · `agent-scope` | `packages/core/{session,agent,agent-loop,scope}/` |
| `capability-seams/` | 介绍级 | `three-roles` · `execution-world` | [`docs/capability-seams.md`](../../docs/capability-seams.md) |
| `tools-prompt-llm/` | 介绍级 | `request-assembly` · `tool-pipeline` | `packages/core/{tools,system-prompt}/`、`packages/llm/` |
| `surfaces/` | 介绍级 | `one-tree-many-doors` · `three-planes` | `apps/cli/`、`packages/{host,client,sdk,acp}/` |

按 `packages/<group>/` 的细表等机制级正文出现后再拆。不要在这里手抄 [`packages/README.md`](../../packages/README.md) 的完整组清单。
