# 01 · Agent Note：DSH 的决策主键

## 一句话

Agent Note 是 DSH 里最接近“spec”的持久记录：它保存代码和文档无法承载的 **why 与 what we gave up**，并且用路径、格式、门禁把一个决策从 `proposed/` 推进到 `implemented/`、必要时进入 `rejected/` 或冻结到 `archived/`。

## 1. 路径编码

每条 Agent Note 的路径都是 `{lifecycle}/{class}/yyyy-mm-dd-topic-title.md`：

- `lifecycle`：`proposed/`、`implemented/`、`rejected/`、`archived/`
- `class`：`feature`、`bug-fix`、`simplification`、`architecture`、`process`、`testing`
- 日期是主题**首次提出**的日期，不是实现日期

来源：`.agents/notes/README.md:9`

## 2. 生命周期

| 状态 | 含义 | 是否当前权威 |
|---|---|---|
| `proposed/` | 重大未来工作；尚未构建或只部分构建 | 是提案 |
| `implemented/` | 已交付，且随代码事实保持 current | 是当前决定 |
| `rejected/` | 被否决，保留仅当能阻止诱人的错误 | 否 |
| `archived/` | 已封存的 implemented 历史快照 | 否，冻结 |

关键规则：

- 每个**非平凡变更**必须在同一 PR 中新增或更新至少一个 Agent Note。
- 更新已经拥有该决策的 Note 即可，不重复创建。
- 完全被取代的 implemented note 可合并到当前 owner 并删除，但必须保留独有 rationale/alternatives/consequences/verification，并修复入站链接。
- 只有 implemented note 能进 archive；proposed 过时应该转 rejected。
- archive 后永久冻结，视为历史而非现行权威。

来源：`.agents/notes/README.md:11-13, 38-42, 46-52`

## 3. 分类

分类是封闭集合，由 `scripts/agent-note-tree.ts` 门禁拒绝未知目录：

- `feature`：新的用户/模型可见能力
- `bug-fix`：修正缺陷或 postmortem 暴露的缺口
- `simplification`：不增加能力地移除代码/行为/范围
- `architecture`：交付源码的结构性决定
- `process`：代码周边的工作流/工具/门禁
- `testing`：测试基础设施与策略

`refactor` 被有意排除，因为它与 `simplification` 重叠。

来源：`.agents/notes/README.md:21-34`

## 4. 文件格式门禁

`pnpm run verify-agent-note-format` 作为 `doc-sync` 的一部分强制：

- 前三行固定为 `# Agent Note: <title>`、空行、`Status: <status>`；
- 状态必须与所在 lifecycle 文件夹一致；
- body 必须以 `## Problem` 开头；
- **proposed** 用 `## Proposal / ## Alternatives considered / ## Acceptance criteria / ## Risks`；
- **implemented** 用 `## Decision / ## Alternatives considered / ## Consequences`，禁止 `Proposal / Plan / Migration plan / Acceptance criteria`；
- **rejected** 保留提案体，仅在 `Status:` 行加拒绝原因；
- `## Alternatives considered` 是强制节，除非是 pre-format 的合法 grandfather 注释。

来源：`.agents/notes/README.md:56-103`

## 5. proposed → implemented：同一变更里改写时态

> Moving a file between lifecycle folders means updating the `Status:` line and re-satisfying that folder's skeleton in the same change — the gate fails the move otherwise.

来源：`.agents/notes/README.md:121`

也就是说：

- 未来式 `Proposal` 改成现在式 `Decision`
- `Acceptance criteria` 和 `Risks` 折入 `Consequences`，或现在式 `Testing / Verification`
- 计划/迁移步骤删除，只保留实际交付内容

这不是“实现完顺手改个状态”的仪式；它是让 implemented note 描述 shipped reality 的关键机制。相关 enforce 在 `dsh-code-review` 的 manual check 中也有：实现 proposed note 时必须在同一 diff 移动并改写。

## 6. archive 与 supersession

- archive 必须是完整 triplet（`.md`、`.zh.md`、`.i18n.yaml`）一起移动。
- 归档只允许插入 `Archived: YYYY-MM-DD` 并重录 sidecar hash，不编辑正文。
- `verify-archived-agent-notes` 用 append-only manifest 封存每个文件 SHA-256；文档门禁跳过 archive 源。
- **写新 note 时必须做 supersession check**：主动找覆盖同一决策/机制的旧 note，完整取代的 implemented 在同 PR 归档，部分取代的保留并 cross-link，过时 proposal 转 rejected。

来源：`.agents/notes/README.md:36-42`、`.agents/notes/archived/AGENTS.md`、`.agents/skills/dsh-archive-agent-notes/SKILL.md`

## 证据入口

- [`.agents/notes/README.md`](../../.agents/notes/README.md)
- [`.agents/notes/implemented/AGENTS.md`](../../.agents/notes/implemented/AGENTS.md)
- [`.agents/notes/archived/AGENTS.md`](../../.agents/notes/archived/AGENTS.md)
- [`.agents/skills/dsh-archive-agent-notes/SKILL.md`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md)
- [`.agents/notes/implemented/process/2026-07-05-uniform-agent-note-format.md`](../../.agents/notes/implemented/process/2026-07-05-uniform-agent-note-format.md)
