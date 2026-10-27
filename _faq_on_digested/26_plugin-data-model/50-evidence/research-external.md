# Research External v2 · 外部插件证据表

> 本文件是外部插件/社区模式的参考证据，不是 DSH 合同，也不是长期依赖建议。长期优先使用 DSH 原生核心/原生插件；外部插件只借模式。

## 1. 市场样本（约 97 候选，15 深读）

### 1.1 分类

| 批次 | 候选 | 深读 |
|---|---|---|
| memory/session | 23 | 8 |
| workflow/tools/notify | 19 | 6 |
| runtime/account/UI/theme | 55 | 10 |

### 1.2 深读名单

memory-evolve、project-context、graphmemory、workspace-memories、kb-manager、mnemon、session-workspace-organizer、archive-retention、codex-sync、claude-move、agent-mailbox、workspace-overlay、PromptRecall、credentials-mysql、custom-workspace。

### 1.3 市场关键结论

| 结论 | 样本 | 等级 |
|---|---|---|
| 没有统一 workspace-scoped 数据家；至少 4 种表示 | workspace-overlay/custom-workspace/session_folders/workspace-memories | S/R |
| 没有统一插件数据根；各自造 `~/.dsh/<plugin>/` | memory-evolve/project-context/PromptRecall/kb-manager/beauty-persist | S/R |
| 没有 session delete；插件物理删日志 | archive-retention/archive-manager/archive-purge/session-workspace-organizer | R |
| 直接改日志 header 是现实需求 | session-workspace-organizer | R |
| 凭据三种互斥家 | codex-keychain/credentials-mysql/credential-manager/api-key-pool | S/R |
| 客户端状态默认 localStorage；跨 origin 丢失 | beauty-persist/PromptRecall/theme 8/8 | S/R |
| 卸载不是数据生命周期 | credential-manager/cursor-theme/archive-manager | R |
| 迁移只出现在严肃数据 | credentials-mysql/task-board/kb-manager/project-context | S/R |
| 声明质量与数据风险无关 | 55 个只有 1 个 `engines.dsh` | S/R |

## 2. 未确认清单

- 任何第三方插件的运行时行为（未安装）。
- `dsh-mnemon`、`dsh-agent-mailbox`、`dsh-codex-sync` 的具体持久化落点/并发；标 U。
- `dsh-local-vector-memory`、`dsh-memory-fortress` 的仓库/源码；标 R/U。
- 本机 `$DSH_HOME` 中 `auto-approval-llm/`、`clutch-dsh-worktree/`、`company-workspace/` 的归属；标 U。
- schedule 域的磁盘 id；`cache/` 的所有权；storage-domain 的版本字段；标 U。
- 浅克隆导致 2026-06 前历史缺失；H 早期事件强度不足。

## 3. 来源

- DSH docs/source：`docs/subsystems/*`、`packages/storage|session|workspace|attachment|spill|settings|credentials|deliverables|session-query`、`.agents/notes/*`。
- 市场：awesome-deepseek-harness-plugins、dshbase、GitHub raw README/package.json/tree、少量源码。
- 跨生态：见 [32](../30-external/32-external-adjacent-ecosystems.md) 的官方文档链接。
