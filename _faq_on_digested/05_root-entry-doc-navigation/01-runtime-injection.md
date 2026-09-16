# 01 · 根 AGENTS 链怎么进上下文：baseline + touch-driven

## 不是模型“主动读”，是运行时“注入”

`dsh-agent-instructions`（`packages/context/agent-instructions`）是入口文档在运行时的第一推动力：

> At the first eligible `agent/pre-step` of a session, the plugin composes the baseline and folds it into the entering batch right after the claimed messages.
>
> —— `packages/context/agent-instructions/README.md:102`（Main flow）

> At the first request, derived history contains one durable user-role message with the bounded user-global and project instruction chain in broad-to-specific order. Resume reuses that message when its visible baseline is compatible.
>
> —— `packages/context/agent-instructions/README.md:131`（Model Experience · Baseline context）

也就是说，根 `AGENTS.md` 进入模型上下文不是靠模型“想起来去读”，而是插件在会话开始时注入一条 durable 的 user 消息，用 `<system-reminder>` 框住。

## 两次注入：baseline 与 touch-driven

1. **baseline**：每个 live session 的第一个 `agent/pre-step` 组合 baseline。加载顺序是 `$DSH_HOME/AGENTS.md`，再按从项目根到 `session.header.cwd` 的每个目录，加载每个候选文件（基础候选 `AGENTS.md`、`CLAUDE.md`，外加叠加的 `AGENTS.local.md`、`CLAUDE.local.md`）。
2. **touch-driven nested**：插件观察成功的 `read`/`write`/`edit` 调用；触达更深目录后，把该目录的 AGENTS.md 作为“Additional instructions”注入。

> After a successful `read`, `write`, or `edit` call reaches a deeper directory, the next request includes the newly applicable instruction file; a changed file replaces its content, and a file that disappears or duplicates an earlier candidate produces a removal notice.
>
> —— `packages/context/agent-instructions/README.md:32`（What the agent gets）

> **Refresh is touch-driven** — there is no watcher; external edits become visible on the next successful first-party `read`, `write`, or `edit`, when resume reconciles a visible baseline, or when an entering pre-step restores a shadowed baseline.
>
> —— `packages/context/agent-instructions/README.md:215`（Known Limitations）

这意味着“L2 区域入口”在运行时是被触达驱动的：模型没进 `packages/` 之前，`packages/AGENTS.md` 不在上下文里；一读 `packages/` 下的文件，它才被注入。

## 为什么这个顺序是可控的

- **预算**：`maxBytes` 是必填配置（`:61` 的 Config 表），渲染保留最具体文件优先，先丢更宽的文件、再截断最具体文件，且发出可见的 `Workspace instruction budget …` 通知（`:72`）。
- **去重**：同目录里 trim 后内容相同的 `CLAUDE.md`/`AGENTS.md` 只渲染一次（`:32`）；路径未变且 digest 未变的文件不再注入（`:102`）。
- **无 watcher**：磁盘上的外部改动只在下次成功的 `read`/`write`/`edit`、resume 重新对齐 baseline，或进入的 pre-step 恢复被遮蔽的 baseline 时才可见（`:215`）；Summary 把这条写成“It does not watch external edits continuously”（`:12`）。这正是“触达驱动”的另一面：不触达，就不重新读。

## 注入到的“形状”

注入内容用 `<system-reminder>` 框住，明确声明“这些是 workspace instructions，可作指引，但不覆盖 system / developer / 直接用户指令”（模板 `:135-147`；插件拥有完整 framing 的声明在 `:86`）。这是运行时对“AGENTS 是 standing orders 而不是不可违逆的法律”的编码：它和静态层的定位（04 的“常驻层是 standing orders”）是一致的。

## 证据入口

- [`packages/context/agent-instructions/README.md`](../../packages/context/agent-instructions/README.md)：Summary（第 12 行）、What the agent gets（第 32 行）、Configuration（第 36、59-68 行）、Observing the budget（第 72 行）、Design concept（第 86 行）、Main flow（第 102 行）、Model Experience / Baseline context（第 127-147 行）、Known Limitations（第 215 行）
