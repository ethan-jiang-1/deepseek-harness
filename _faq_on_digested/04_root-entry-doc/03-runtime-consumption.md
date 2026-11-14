# 03 · 运行时消费：注入、按需导航、预算与回收

## 不是模型「主动读」，是运行时「注入」

`dsh-agent-instructions`（`packages/context/agent-instructions`）是入口文档在运行时的第一推动力：

> At the first eligible `agent/pre-step` of a session, the plugin composes the baseline and folds it into the entering batch right after the claimed messages.
>
> —— `packages/context/agent-instructions/README.md:103`（Main flow）

> At the first request, derived history contains one durable user-role message with the bounded user-global and project instruction chain in broad-to-specific order. Resume reuses that message when its visible baseline is compatible.
>
> —— `packages/context/agent-instructions/README.md:132`（Model Experience · Baseline context）

根 `AGENTS.md` 进入模型上下文不是靠模型「想起来去读」，而是插件在会话开始时注入一条 durable user 消息，用 `<system-reminder>` 框住。

## 两次注入：baseline 与 touch-driven

1. **baseline**：每个 live session 的第一个 `agent/pre-step` 组合 baseline。加载顺序是 `$DSH_HOME/AGENTS.md`，再按从项目根到 `session.header.cwd` 的每个目录加载候选文件（基础候选 `AGENTS.md`、`CLAUDE.md`，外加叠加的 `AGENTS.local.md`、`CLAUDE.local.md`）。
2. **touch-driven nested**：插件观察成功的 `read`/`write`/`edit` 调用；触达更深目录后，把该目录的 AGENTS.md 作为 Additional instructions 注入。

> After a successful `read`, `write`, or `edit` call reaches a deeper directory, the next request includes the newly applicable instruction file; a changed file replaces its content, and a file that disappears or duplicates an earlier candidate produces a removal notice.
>
> —— `packages/context/agent-instructions/README.md:34`（What the agent gets）

> **Refresh is touch-driven** — there is no watcher; external edits become visible on the next successful first-party `read`, `write`, or `edit`, when resume reconciles a visible baseline, or when an entering pre-step restores a shadowed baseline.
>
> —— `packages/context/agent-instructions/README.md:220`（Known Limitations）

这意味着 L2 区域入口在运行时是触达驱动的：模型没进 `packages/` 之前，`packages/AGENTS.md` 不在上下文里；一读 `packages/` 下的文件，它才被注入。

顺序可控靠三条：

- **预算**：`maxBytes` 是必填配置（`:64` 的 Config 表），渲染保留最具体文件优先，先丢更宽的文件、再截断最具体文件，并发出可见的 `Workspace instruction budget …` 通知（`:74`）。
- **去重**：同目录里 trim 后内容相同的 `CLAUDE.md`/`AGENTS.md` 只渲染一次（`:34`）；路径未变且 digest 未变的文件不再注入（`:103`）。
- **无 watcher**：外部改动只在下次成功的 `read`/`write`/`edit`、resume 重新对齐 baseline、或进入的 pre-step 恢复被遮蔽的 baseline 时才可见（`:220`；Summary 写作 `:12`）。这就是触达驱动的另一面：不触达，就不重新读。

注入内容用 `<system-reminder>` 框住，明确声明这些是 workspace instructions，可作指引但不覆盖 system / developer / 直接用户指令（模板 `:136-151`；插件拥有完整 framing 的声明在 `:88`）。这是运行时对「AGENTS 是 standing orders 而不是不可违逆的法律」的编码，与静态层定位一致。

## 按需导航：注入只覆盖指令链，正文靠工具拉取

`dsh-agent-instructions` 只注入 `AGENTS.md`/`CLAUDE.md` 指令链，不注入 package README、architecture、catalog、skill 正文。这些按需合同由模型用第一方工具主动拉取，而三个导航工具的提示词把纪律直接写进了工具：

> Use the read tool — not shell commands like cat — to inspect text files. Results include line numbers. Use offset and limit to continue reading large files.
>
> —— `packages/fs/tool-fs/src/read.ts:74`（`text: ({ scope }) =>` 在 `:72`，正文在 `:74`）

> Use the grep tool — not shell grep or rg — to search file contents.
>
> —— `packages/fs/tool-fs-search/src/grep.ts:280`

只有在 `read` 也注册时，才追加 "Use read on a matched file when you need surrounding context."（同文件 `:281` 的条件分支）。

> Use the glob tool — not shell find — to discover files by path pattern. …
>
> —— `packages/fs/tool-fs-search/src/glob.ts:302`

所以怎么走图在运行时是被工具提示词约束的：读文件用 read（带行号、可 offset/limit），搜内容用 grep，找文件用 glob。工具给的是结构化、有界的结果，而不是 shell 的自由文本。

**skill：摘要先给，正文后取。** `dsh-tool-skill` 注入的 skill catalog 只含 name + description：

> The catalog contains sorted skill `name` and normalized, XML-escaped `description` only; it omits bodies, paths, sources, providers, and routing hints.
>
> —— `docs/subsystems/skills.md:229`

只有模型调用 `skill({ name })` 时才加载完整正文（`docs/subsystems/skills.md:233`），且正文不进 registry 缓存、每次 `get()` 现取（同文件 `:192`）。这就是 L5 在运行时的实现：常驻的只是技能名 + 一句描述，正文按需、不缓存。

**package README 是 pull 不是 push。** 注入只认 `AGENTS.md`/`CLAUDE.md` 候选，README 靠两条路径被拉到：① 注入的根/子树 AGENTS 把模型指到 `packages/<group>/<pkg>/README.md`（[01](./01-map-and-tiers.md) 的地图）；② 注入的 `packages/AGENTS.md:27` 要求在同一 commit 里更新 package README 与 JSDoc 合同，模型改某个包时这条 standing order 让它去读该包 README。诚实答案是：**指令链是 push 的，合同是 pull 的**——前者不靠自觉，后者靠 standing order + 路由把模型引到正确文件前。

## 回收：超预算的度量与剪裁

注入有 `maxBytes`，整个上下文还有 `ctx.tokenMeter` 度量，超了由 compaction 回收：

> Pressure compaction runs at the `agent/pre-step` waterfall before request derivation. … Region boundaries preserve tool-call/result pairing but not whole turns, allowing early closed steps of one oversized turn to compact.
>
> —— `docs/subsystems/compaction.md:101`

> `@deepseek-ai/dsh-token-meter` exposes one detached replay snapshot for request pressure and positional surface pricing.
>
> —— `docs/subsystems/token-meter.md:5`

披露不是单向的：塞多了会被剪裁/摘要，而且不拆散一个 tool-call/result 配对。长任务里「读过但已过期」的内容会被回收，而不是无限增长。

## 静态预算与运行时预算是一回事

[01](./01-map-and-tiers.md) 的字数预算（根 AGENTS ≤ 2080 词，manifest 口径）与本页的 `maxBytes` 是同一个约束的两端：静态层决定「每层最多放多少」，运行时层决定「每次最多注入多少」。两者都不度量「模型懂没懂」，而是度量容量——一个是文档容量，一个是上下文容量。

## README 怎么保证被读到、被维护

- **被读到**：运行时注入 + standing order 的合力（见上）。指令链 push、README pull。
- **被维护**：靠门禁，不靠自觉。`packages/AGENTS.md:27` 要求 README 与 JSDoc 与行为同 commit 更新，`:28` 要求用 canonical Model Experience 格式记录 model/token/KV-cache 影响；两道机器兜底是 `doc-sync` 检查同步，以及 `dsh-code-review` / `dsh-prose-standard` 把「改了代码没改 README」判为问题。

这与静态层「地图是机器检查的」是同一套逻辑，只是落点从地图移到了消费地图的行为。

## 证据入口

- [`packages/context/agent-instructions/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/agent-instructions/README.md)：Summary（12）、What the agent gets（32-34）、Configuration（36、44-48、62-68）、Observing the budget（72-74）、Design concept（86-88）、Main flow（101-103）、Model Experience / Baseline context（126-151）、Known Limitations（212、220）
- [`packages/fs/tool-fs/src/read.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs/src/read.ts) 第 74 行
- [`packages/fs/tool-fs-search/src/grep.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs-search/src/grep.ts) 第 280-281 行
- [`packages/fs/tool-fs-search/src/glob.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs-search/src/glob.ts) 第 302 行
- [`docs/subsystems/skills.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/skills.md) 第 192、229、233 行
- [`docs/subsystems/compaction.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md) 第 101 行
- [`docs/subsystems/token-meter.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/token-meter.md) 第 5 行
- [`packages/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/AGENTS.md) 第 27-29 行
