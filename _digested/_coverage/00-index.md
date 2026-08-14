# `_coverage` — 源码消化覆盖矩阵

维护用索引，不是专题正文。用来判断哪些子系统已经有机制级消化，哪些只在介绍里出现，哪些还没进 `_digested/`。

当前阶段：主干七个专题的 `00-map.md` 均为图文介绍，且都已有机制级正文（覆盖「以后深挖」列出的点）。按 `packages/<group>/` 再拆细表仍未做。

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
| `system/` | 部分覆盖（01–02 机制级） | 介绍三图 + `vs-single-loop` | [`docs/architecture.md`](../../docs/architecture.md) |
| `cordis-runtime/` | 部分覆盖（01–04 机制级） | 介绍三图 + `primitives-source` · `waterfall-compose` · `pre-step-chain` · `js-eval-timing` · `insert-then-patch` | `vendor/cordis/`、`vendor/loader/`、`vendor/include/` |
| `composition/` | 部分覆盖（01–03 机制级） | 介绍两图 + `boot-sequence` · `fail-loud` · `dump-vs-boot` · `live-recompose` · `last-good-tree` | `packages/boot/app-boot/`、`apps/cli/src/profile-boot.ts` |
| `session-and-loop/` | 部分覆盖（01–03 机制级） | 介绍三图 + `event-envelope` · `inbox-wake` · `factory-radius` | `packages/core/{session,agent,agent-loop,scope}/` |
| `capability-seams/` | 部分覆盖（01–02 机制级） | 介绍两图 + `roles-split` · `bash-spawn-trace` | `packages/shell/`、`packages/{fs,subprocess,e2b}/` |
| `tools-prompt-llm/` | 部分覆盖（01–02 机制级） | 介绍两图 + `section-order` · `chunk-to-message` | `packages/core/{tools,system-prompt}/`、`packages/llm/`、`packages/guard/` |
| `surfaces/` | 部分覆盖（01–02 机制级） | 介绍两图 + `source-vs-built` · `session-mux` | `apps/cli/`、`packages/{host,client,sdk,acp}/` |

按 `packages/<group>/` 的细表等机制级正文出现后再拆。不要在这里手抄 [`packages/README.md`](../../packages/README.md) 的完整组清单。
