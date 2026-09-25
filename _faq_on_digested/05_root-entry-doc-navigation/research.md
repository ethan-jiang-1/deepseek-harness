# Research · 运行时文档消费：证据原文与来源

## 1. agent-instructions：入口链被注入，不是被主动读

> `dsh-agent-instructions` gives agents workspace guidance from user-global and project-level `AGENTS.md`-compatible files. It loads the applicable chain for the first request. It does not watch external edits continuously: successful filesystem operations discover newly relevant nested files and make later changes or removals visible, while session resume reconciles the baseline.

来源：`packages/context/agent-instructions/README.md:12`（基线 `46a7f68b09…`）

## 2. baseline 注入的时机与顺序

> At the first eligible `agent/pre-step` of a session, the plugin composes the baseline and folds it into the entering batch right after the claimed messages.

来源：`packages/context/agent-instructions/README.md:102`（基线 `46a7f68b09…`）

> The first request includes one durable baseline message with the user-global `$DSH_HOME/AGENTS.md` followed by the project chain — every existing candidate file from the project root down to the session working directory, in broad-to-specific order.

来源：`packages/context/agent-instructions/README.md:32`（基线 `46a7f68b09…`）

## 3. touch-driven：触达更深目录才注入 nested

> After a successful `read`, `write`, or `edit` call reaches a deeper directory, the next request includes the newly applicable instruction file; a changed file replaces its content, and a file that disappears or duplicates an earlier candidate produces a removal notice.

来源：`packages/context/agent-instructions/README.md:32`（基线 `46a7f68b09…`）

> Successful first-party `read`, `write`, and `edit` calls contribute touches that bubble up through parent execution tokens; once the enclosing step is durable, a projection reconciles the visible session state against the inbox and queues additions, replacements, or removals.

来源：`packages/context/agent-instructions/README.md:102`（基线 `46a7f68b09…`）

## 4. 注入的模型可见形状

> The plugin owns the complete `<system-reminder>` framing and every injected message reaches the model verbatim.

来源：`packages/context/agent-instructions/README.md:101`（基线 `46a7f68b09…`）

> The following workspace instructions may be relevant to your work. Use them as guidance when applicable. More specific instructions take precedence over broader ones. They do not override system, developer, or direct user instructions.

来源：`packages/context/agent-instructions/README.md:135-147`（Baseline instruction template）（基线 `46a7f68b09…`）

## 5. 预算与去重

> Only `maxBytes` is required — it caps the complete rendered baseline so each deployment chooses its prompt budget explicitly.

来源：`packages/context/agent-instructions/README.md:36`（基线 `46a7f68b09…`）

> Rendering keeps the most specific files first: it drops whole broader files before truncating the most-specific file, and emits a visible `Workspace instruction budget ...` notice naming the omitted and truncated paths. The rendered bytes never exceed `maxBytes`.

来源：`packages/context/agent-instructions/README.md:72`（基线 `46a7f68b09…`）

> An unchanged path with an unchanged digest is never injected again.

来源：`packages/context/agent-instructions/README.md:102`（基线 `46a7f68b09…`）

> Sibling files whose content matches after trimming render once, so a `CLAUDE.md` that duplicates its `AGENTS.md` is not repeated.

来源：`packages/context/agent-instructions/README.md:32`（基线 `46a7f68b09…`）

> **Refresh is touch-driven** — there is no watcher; external edits become visible on the next successful first-party `read`, `write`, or `edit`, when resume reconciles a visible baseline, or when an entering pre-step restores a shadowed baseline.

来源：`packages/context/agent-instructions/README.md:215`（基线 `46a7f68b09…`）

## 6. 导航工具把自己的纪律写进提示词

> Use the read tool — not shell commands like cat — to inspect text files. Results include line numbers. Use offset and limit to continue reading large files.

来源：`packages/fs/tool-fs/src/read.ts:74`

> Use the grep tool — not shell grep or rg — to search file contents. Use read on a matched file when you need surrounding context.

来源：`packages/fs/tool-fs-search/src/grep.ts:280-281`

> Use the glob tool — not shell find — to discover files by path pattern. …

来源：`packages/fs/tool-fs-search/src/glob.ts:305-306`

## 7. skill：摘要先给，正文按需、不缓存

> The catalog contains sorted skill `name` and normalized, XML-escaped `description` only; it omits bodies, paths, sources, providers, and routing hints.

来源：`docs/subsystems/skills.md:229`

> The model-facing `skill({ name })` tool … rereads the complete definition … and returns a tool result containing `<skill_content …>`, `<skill_resources>`, and `<skill_instructions>`.

来源：`docs/subsystems/skills.md:233`

> Full definitions are not cached by the registry. Each `get()` calls the winning provider…

来源：`docs/subsystems/skills.md:192`

## 8. 回收：度量 + compaction

> Pressure compaction runs at the `agent/pre-step` waterfall before request derivation. … Region boundaries preserve tool-call/result pairing but not whole turns, allowing early closed steps of one oversized turn to compact.

来源：`docs/subsystems/compaction.md:101`

> `ctx.tokenMeter` … exposes one detached replay snapshot for request pressure and positional surface pricing.

来源：`docs/subsystems/token-meter.md:5`

## 9. README 是被维护出来的

> Update package README and JSDoc contracts in the same commit as behavior, and verify them against code with dsh-prose-standard.

来源：`packages/AGENTS.md:26`

> Package READMEs document model, token, and KV-cache effects using the canonical Model Experience format.

来源：`packages/AGENTS.md:27`

> Package READMEs put durable consumer gaps and non-obvious maintainer constraints under `## Known Limitations and Deferred Work`.

来源：`packages/AGENTS.md:28`

## 已核对的相关消化材料

- `_faq_on_digested/04_root-entry-doc-design/answer.md`：静态设计（本问题的另一半）
- `_faq_on_digested/07_borrowing-harness-idea/13-progressive-disclosure-pipeline.md`：完整五层管线（迁移视角，含 context 注入、system-prompt 组装、compaction、subagent 隔离）
