# 01 · 根 AGENTS 链怎么进上下文：baseline + touch-driven

## 不是模型“主动读”，是运行时“注入”

`dsh-agent-instructions`（`packages/context/agent-instructions`）是入口文档在运行时的第一推动力：

> Per-session workspace instruction loading for `AGENTS.md`-compatible files. The plugin injects the initial user-global and project instruction chain into durable history, then discovers nested files and reports later changes or removals after successful filesystem tool calls.
>
> —— `packages/context/agent-instructions/README.md:5`

也就是说，根 `AGENTS.md` 进入模型上下文不是靠模型“想起来去读”，而是插件在会话开始时注入一条 durable 的 user 消息，用 `<system-reminder>` 框住。

## 两次注入：baseline 与 touch-driven

1. **baseline**：每个 live session 的第一个 `agent/pre-step` 组合 baseline。加载顺序是 `$DSH_HOME/AGENTS.md`，再按从项目根到 `session.header.cwd` 的每个目录，加载每个候选文件（默认 `AGENTS.md`、`CLAUDE.md`）。
2. **touch-driven nested**：插件观察成功的 `read`/`write`/`edit` 调用；触达更深目录后，把该目录的 AGENTS.md 作为“Additional instructions”注入。

> The plugin also observes immutable `tools/result` outcomes for successful first-party `read`, `write`, and `edit` calls. Each accepted touch checks newly reached descendant scopes…
>
> —— `packages/context/agent-instructions/README.md:11`

这意味着“L2 区域入口”在运行时是被触达驱动的：模型没进 `packages/` 之前，`packages/AGENTS.md` 不在上下文里；一读 `packages/` 下的文件，它才被注入。

## 为什么这个顺序是可控的

- **预算**：`maxBytes` 是必填配置，渲染保留最具体文件优先，先丢更宽的文件、再截断最具体文件，且发出可见的预算通知（README.md:70、76）。
- **去重**：同目录里内容相同的 `CLAUDE.md`/`AGENTS.md` 只渲染一次（content-identical 折叠）；digest 未变的文件不重复注入（README.md:53、70）。
- **无 watcher**：磁盘上的外部改动只在下次成功的 `read`/`write`/`edit`、resume 或 shadowed baseline 恢复时才可见（README.md:55）。这正是“触达驱动”的另一面：不触达，就不重新读。

## 注入到的“形状”

注入内容用 `<system-reminder>` 框住，明确声明“这些是 workspace instructions，可作指引，但不覆盖 system / developer / 直接用户指令”（README.md:19-31）。这是运行时对“AGENTS 是 standing orders 而不是不可违逆的法律”的编码：它和静态层的定位（04 的“常驻层是 standing orders”）是一致的。

## 证据入口

- [`packages/context/agent-instructions/README.md`](../../packages/context/agent-instructions/README.md)：Lifecycle（第 9、11 行）、Prompt Shape（第 19-31 行）、State And Refresh（第 53、55 行）、Configuration（第 70 行）、Budgeting（第 76 行）
