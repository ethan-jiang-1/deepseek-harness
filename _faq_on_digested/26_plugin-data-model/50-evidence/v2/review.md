# Review v2 · 第二轮发现了什么、改了什么

> **编号为 v2 当时的编号**（05–11）；重组后的编号见 [00-index](../../00-index.md)。本文件保留当时的叙述，链接已指向新路径。

## 文件命名：原生 vs 外部

| 文件 | 内容 | 长期策略 |
|---|---|---|
| `08-native-data-landscape.md` | DSH 原生核心/随包插件/experimental 的数据家 | 首选 |
| `09-native-data-history.md` | DSH 原生数据演进史 | 首选 |
| `10-external-plugin-patterns.md` | 外部社区插件/服务模式（E1/E2） | 只借模式，不作依赖 |
| `11-native-reference-architectures.md` | 原生优先的 10 个参考架构 | 首选 |
| `research-native-v2.md` / `research-external-v2.md` | 两套证据 | 分开引用 |
| `review-v2-native-vs-external.md` | 本轮 review | — |

原则：**N0 核心 / N1 随包插件 / N2 experimental / E1 外部插件 / E2 外部服务**；长期优先 N0/N1，外部只作参考。

## 结论

第一轮把 FAQ 26 从“找 API”改成了“先定承诺，再选家”，方向成立。第二轮用**DSH 历史 + 约 97 个市场候选（15 个深读）**压力测试后，模型需要三处修正：

1. **“五个家”要加边界**：外部服务、OS 临时、无主插件目录、session-derived 客户端投影，都不是原来的五个家能完全覆盖的。
2. **“没有插件数据根”是当前最大的结构性缺口**，不是“插件作者没想到”。
3. **“删除/保留/卸载”是系统性空白**：session 无删除、附件无 GC、插件无卸载契约；社区已经在用高风险方式补。

## 新发现（按重要性）

| # | 发现 | 证据 | 影响 |
|---|---|---|---|
| 1 | **没有插件数据根**：`$DSH_HOME/plugins/<id>/` 只是惯例；根下已有 `auto-approval-llm/`、`clutch-dsh-worktree/`、`company-workspace/` 等无主目录 | 本机 `$DSH_HOME` 结构；inventory D1/D5 | answer/01/08/11 |
| 2 | **没有 session 删除**：`SessionPersistence` 只有 create/open/stat/list/flush；workspace 删除明确不删日志 | `packages/session/session-persistence`；`2026-07-24` 提案 out-of-scope | 01/04/08/09/11 |
| 3 | **附件无 GC 是刻意**：引用感知 GC 需要单独模型；按年龄删会删掉分叉/恢复仍引用的对象 | `2026-07-22` note；`attachment` README | 04/09/11 |
| 4 | **spill 不在 `$DSH_HOME`**：默认 OS temp，启动 sweep；跨进程不可见 | `spill-local`；inventory SPILL | 04/08/09 |
| 5 | **settings 是 profile 作用域，不是账号**：`settings.yaml` 一次性 import；跨 profile 共享被刻意拒绝 | `2026-09-19-profile-owned-live-configuration` | 02/09/11 |
| 6 | **session 有跨进程 lease，domain JSON 没有**：v1 的“跨进程没有锁”要分介质说 | `lease.ts`；`storage-json` | 02/03/09 |
| 7 | **没有 per-workspace plugin state**：`DomainSpec` 无 scope；proposed 明确 out-of-scope | `2026-07-24` note | 03/08/11 |
| 8 | **客户端状态要拆两层**：纯 UI（localStorage）vs session-derived（projection） | `2026-08-25-session-observations...` | 01/05/08/11 |
| 9 | **社区有四种互不兼容的 workspace 表示**：canonical path scope、settings key、storage-domain folder、workspaceId key | 02/04/10 | 03/08/10/11 |
| 10 | **社区有三种互斥的凭据家**：OS keychain、ctx.credentials、明文 JSON/settings | 04/10 | 02/06/10/11 |
| 11 | **卸载不是数据生命周期**：credential-manager 留 metadata+secrets；archive-manager 物理删日志；cursor-theme 改 OS 状态 | 02/04/10 | 05/08/10 |
| 12 | **直接改 session log 是现实需求**：workspace 搬家/每会话输出目录；插件重写 zstd 首帧 cwd | session-workspace-organizer README | 09/10/11 |
| 13 | **迁移只出现在“严肃数据”**：credentials-mysql、task-board、kb-manager、project-context；多数插件没有迁移 | 02/04/10 | 05/10 |
| 14 | **声明质量与数据风险无关**：55 个 runtime/account/UI 样本只有 1 个声明 `engines.dsh` | 04 | 06/10 |

## 模型修正

### 1. 五个家 → “五个家 + 三个边界”

保留：内容、历史、状态、派生、客户端。

新增边界（不是平等的家，但作者必须知道）：

- **外部服务**：MCP/HTTP/DB/对象存储；权威在外部，DSH 只存引用/配置。
- **OS 临时**：spill、workspace-changes 快照、浏览器上传暂存；进程/会话级，可能被系统清理。
- **无主插件目录**：`$DSH_HOME/plugins/<id>/` 或根下自造目录；没有 DSH 契约，卸载/迁移/清理全靠作者。

### 2. 客户端家拆成两层

- **纯 UI 状态**：布局、快捷键、折叠、最近选择 → localStorage/userData，可丢弃。
- **session-derived 客户端事实**：标题、模型、preset、subagent → `SessionProjectionMap`，必须能从日志重建。

两者混用，就会出现“标题存 localStorage、换浏览器丢”或“布局存 domain、服务端为每个浏览器存一份”的错误。

### 3. P4 拆成 profile 配置 / home 单例 / credentials

- **profile 配置**：`Config.volatile()` → 当前 profile patch；换 profile 就丢。
- **home 单例**：跨 profile 共享；要自己建域/键。
- **credentials**：引用/记录；不是配置。

“账号配置”不是一个家，是三种不同寿命/作用域的合称。

### 4. “删除/保留”要成为一等设计问题

每个 archetype 的数据卡必须回答：

- 谁删？什么时候删？
- 删了会不会影响分叉/恢复/搜索索引/附件引用？
- 卸载留下什么？
- 有没有审计/宽限/恢复？

没有答案，就不是“数据放哪”的问题，而是“数据会永远留下”。

## 改了什么

- 新增 [08 原生 landscape](../../20-native/21-native-data-landscape.md)：七轴、12 archetype、33 个原生家、原生模式 × 成熟度、十个原生观察。
- 新增 [09 原生历史](../../20-native/22-native-data-history.md)：22 个时间线事件、12 个数据簇、七个反复张力、欠账清单。
- 新增 [10 外部插件模式](../../30-external/33-external-plugin-patterns.md)：15 个案例、横向模式、五个“作者在补什么”、反模式。
- 新增 [11 原生参考架构](../../40-advisor/42-native-reference-architectures.md)：10 个 archetype 的数据卡/布局/路线/测试/DSH 映射。
- 新增 [research-native](../research-native.md) 与 [research-external](../research-external.md)：原生/外部两套证据。
- 更新 [answer.md](../../00-answer.md)、[01](../../10-foundations/11-five-homes.md)、[02](../../10-foundations/12-state-homes.md)、[03](../../10-foundations/13-scope-and-keys.md)、[04](../../10-foundations/14-artifacts.md)、[05](../../40-advisor/41-checklist.md)：补历史注脚、profile/account 区分、无插件数据根、无 session 删除、附件 GC 刻意、client 两层、workspace 无核心家。
- 图：`08-native-landscape.svg`、`09-native-timeline.svg`、`10-external-market-map.svg`、`11-native-reference-architectures.svg`。

## 仍然开放

- 是否应该给 DSH 增加“插件数据根”/“workspace-scoped state”/“session delete + GC”，这是产品决策；本篇只给证据与代价。
- 第三方插件的运行时行为没有实测；`S` 只代表源码阅读。按“长期原生、外部只借鉴”的方向，**没有安装任何外部插件**；原计划的 5 个运行时探针降级为源码阅读 + 原生 `$DSH_HOME` 结构读数。
- `mnemon`、`agent-mailbox`、`codex-sync` 的具体落点未核；标 U。
- 本机 `$DSH_HOME` 的无主目录归属未核；标 U。
- 浅克隆导致 2026-06 前历史缺失；早期 H 结论强度有限。
