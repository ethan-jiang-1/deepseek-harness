# Review v1 · 本轮复核发现了什么、改了什么（历史记录）

复核日期：2026-10-27。

> **v1 历史记录**：**编号为 v1 当时**；当前版本见 [review-v2](../v2/review.md)。本文件的计数/链接是当时的快照。基线：`dsh-v0.2.1-rc.3`（`1f81c047fc48fa190a683e469daa699857e9afe8`）。

## 结论

原稿的**方向是对的**：先把“数据承诺”和 DSH 的平面分开，比直接找 API 清楚。但原稿把“承诺”当成了唯一入口，且有几处事实与当前源码不符；社区章也没有核出版本漂移。本轮把它改成：

> **三个坐标（谁拥有、关于谁、活多久/谁看见）→ 五种承诺 → 五个家 → 键 → API。**

并补上了“同一份数据有四种都成立的解法”、客户端本地状态、跨生态对照和一张可抄的数据卡。

## 发现与修正

| # | 级别 | 发现 | 证据 | 修正 |
|---|---|---|---|---|
| 1 | 高 | 原稿只有四个平面（内容/历史/状态/派生），漏掉**客户端本地状态**（`localStorage` / 桌面 `userData`） | `packages/client/shortcuts/src/client/storage.ts`；`packages/client/ui-shortcuts/README.md`；`packages/client/ui-conversation/src/client/stores.ts` | 01 改为“五个家 + 只读层”；新增 2×2 图与客户端图 |
| 2 | 高 | 原稿说附件“与会话事件同寿”“会话清理会影响附件” | `packages/attachment/attachment/README.md`：retention-neutral；本地后端保留一切，GC 未实现 | 04 改为“不可变、本地保留、无自动 GC”，并说明导出 ZIP 会带附件 |
| 3 | 高 | 原稿说 settings“下一次重组时生效” | `packages/boot/config-editor/README.md`：apply immediately；`packages/settings/settings/src/index.ts` | 02 改为“立即应用”，并补充 profile 作用域、home/CLI 覆盖、无 volatile 即无表单 |
| 4 | 高 | 原稿建议 `key: sha256(realpath) 或 realpath 本身` | `packages/storage/storage/src/backend.ts:97`；`storage-json/src/per-record-unit.ts:38-39`：per-record 必须 `[a-zA-Z0-9_-]+` | 03 增加“键的代数”：single 可放路径，per-record 必须哈希；05 反模式补一条 |
| 5 | 中 | 原稿说 `invalidRecords: 'backup-and-skip'` 普遍可用于派生数据 | `docs/subsystems/storage.md`：只有能 `backupRecord` 的后端（JSON per-record）才行；single/SQLite 回退为拒绝 | 01/02 补充后端限制 |
| 6 | 中 | 原稿把“投影”同时放进历史平面和派生平面 | `docs/subsystems/session-projection.md`：投影是日志的派生值 | 01 把历史限定为日志，投影归入派生 |
| 7 | 中 | 原稿把 `workspace/changes` 的内容位置写成“工作区” | `packages/deliverables/workspace-changes/README.md`：摘要留 Host 内存，整文件副本在 OS 临时目录 | 04 改正，并补 `maxFiles`/`maxFileBytes`/`diffTimeoutMs` |
| 8 | 中 | 原稿对第三方 settings 的说法过时：“DSH 不向第三方开放通用 settings namespace” | `packages/settings/settings/README.md`：任意 active profile entry 的 volatile Config 都会出表单；project-context 就是第三方样本 | 06 改为“Config-backed 表单已开放；缺的是与 Loader 条目无关的任意命名空间” |
| 9 | 中 | 原稿没有区分“第三方新增 session event 类型”和 `plugin:` 记录 | `docs/subsystems/session.md`；`packages/core/session/README.md:68-76` | 01/05 明确：第三方不要新增 `SessionEventMap` 类型；`appendPluginRecord` 只限 `packages/experimental/` |
| 10 | 中 | 原稿社区章没有核版本漂移，且把星数/目录条目当规模证据 | 2026-10-27 的 README/源码阅读：memory-snapshot 的 AGENTS.md 前提过期；workspace-memories 忽略 `DSH_HOME`；custom-workspace 的 settings 路径过期；目录计数 13,882/20,006/23,307 不一致 | 06 增加“验证口径”、样本问题列与三处漂移；研究底稿见 [research-v1](./research.md) |
| 11 | 中 | 原稿的“五种承诺”是唯一入口，容易读成“只有一个正确答案” | 原稿自身也承认“同一插件可以组合”，但没有展开 | answer 增加“同一份数据，四种都成立的解法”表；05 的数据卡允许组合 |
| 12 | 低 | `present` 的“默认最多 8 个”与 schema 建议“最多 4 个”混在一起 | `packages/deliverables/tool-present/README.md`；`src/index.ts:23,45-48` | 04 区分“部署可配的强制上限 8”与“模型-facing 建议 1–2/≤4” |
| 13 | 低 | 原稿没有跨生态参照 | VS Code/Obsidian/Claude Code/Codex/MCP/Chrome/Figma 官方文档 | 新增 07 与对照图；明确哪些假设不能迁移 |
| 14 | 低 | 原稿没有一张能被测试逐项断言的数据卡 | 社区 README 的“数据在哪/怎么删”普遍缺失 | 05 增加 README 数据卡模板与测试策略 |

## 结构变化

- `01-four-planes.md` → [01-five-homes.md](../../01-foundations/01-five-homes.md)：五家 + 只读层；补客户端、历史格式、第三方事件边界。
- [02-state-homes.md](../../01-foundations/02-state-homes.md)：domain/settings/credentials 三者的精确边界；补凭据记录、profile 作用域、立即应用、后端限制。
- [03-scope-and-keys.md](../../01-foundations/03-scope-and-keys.md)：作用域表扩到 session/workspace/profile/home/client/external；补键的代数、per-record 键限制、目录移动矩阵。
- [04-artifacts.md](../../01-foundations/04-artifacts.md)：五种引用/导出；修正附件寿命、changes 位置、present 上限。
- [05-checklist.md](../../04-advisor/10-checklist.md)：十四问 + 数据卡 + 五个例子 + 反模式 + 测试。
- [06-external-community-patterns.md](../../03-external/07-external-community-patterns.md)：九个维度 + 十五种手法 + 三处版本漂移 + 产品缺口。
- [07-external-adjacent-ecosystems.md](../../03-external/08-external-adjacent-ecosystems.md)：新增跨生态对照。
- [answer.md](../../00-answer.md)：三坐标、2×2、五种承诺、四种解法、决策树、快问快答。
- [question.md](../../00-question.md)、[reference.md](../reference.md)、[00-index.md](../../../00-index.md)：同步更新。
- 图：`01-five-homes.svg`（重画）、`02-scope-matrix.svg`（补客户端/修正附件）、`03-artifact-refs.svg`（标题/上限/保留）、`04-author-promises.svg`（P1/P4 文案）、`05-community-map.svg`（settings 缺口修正）、新增 `06-ownership-matrix.svg`、`07-ecosystem-matrix.svg`。

## 仍然不确定的

1. 附件将来会不会有 GC；本地后端目前只是“保留一切”。
2. 社区插件的运行时行为；本轮只读 README/源码，没有安装。
3. Claude Code 的具体 OS 凭据后端、Codex 的 rollout 文件布局等；07 已标“未确认”。
4. 多租户/远程隔离；本篇只讨论单 Host、单 `$DSH_HOME`。
5. `workspaceRegistry` 在非 Web 组合中的实际可用性；base/headless 可能没有。

## 跑过的检查

- `node _faq_on_digested/verify.mjs`：通过（211 个 Markdown 文件，链接与锚点可解析）。
- `pnpm run test:docs`：通过（21 个 doc-quick 门禁）。
- `pnpm run verify-repository-references`：通过。
- `git diff --check`：通过。
- 所有新增/修改 SVG 经 `xml.etree` 解析，并用 `rsvg-convert` 渲染目检。
