# Research · 运行时文档消费：证据原文与来源

## 1. agent-instructions：入口链被注入，不是被主动读

> Per-session workspace instruction loading for `AGENTS.md`-compatible files. The plugin injects the initial user-global and project instruction chain into durable history, then discovers nested files and reports later changes or removals after successful filesystem tool calls.

来源：`packages/context/agent-instructions/README.md:5`（基线 `528c682e…`）

## 2. baseline 注入的时机与顺序

> The first eligible `agent/pre-step` of each live session composes the baseline. … The loader reads `$DSH_HOME/AGENTS.md` followed by, in each directory from the project root to `agent.session.header.cwd`, every existing base candidate and then every existing local-overlay candidate.

来源：`packages/context/agent-instructions/README.md:9`

## 3. touch-driven：触达更深目录才注入 nested

> The plugin also observes immutable `tools/result` outcomes for successful first-party `read`, `write`, and `edit` calls. Each accepted touch checks newly reached descendant scopes and every previously loaded scope.

来源：`packages/context/agent-instructions/README.md:11`

## 4. 注入的模型可见形状

> Baseline instructions are durable user-role messages framed with the familiar system-reminder pattern … Instructions from: AGENTS.md …

来源：`packages/context/agent-instructions/README.md:17-31`

## 5. 预算与去重

> `maxBytes` is required so each deployment makes its prompt-budget choice explicitly.

来源：`packages/context/agent-instructions/README.md:70`

> Rendering preserves the most specific instruction files first. It drops whole broader files before truncating the most-specific file and emits a visible `Workspace instruction budget …` notice… The rendered bytes never exceed `maxBytes`.

来源：`packages/context/agent-instructions/README.md:76`

> An unchanged path and SHA-1 content digest is not injected again.

来源：`packages/context/agent-instructions/README.md:53`

> There is no file watcher, so an on-disk change becomes visible at the next successful `read`, `write`, or `edit` touch…

来源：`packages/context/agent-instructions/README.md:55`

## 6. 导航工具把自己的纪律写进提示词

> Use the read tool — not shell commands like cat — to inspect text files. Results include line numbers. Use offset and limit to continue reading large files.

来源：`packages/fs/tool-fs/src/read.ts:72`

> Use the grep tool — not shell grep or rg — to search file contents. Use read on a matched file when you need surrounding context.

来源：`packages/fs/tool-fs-search/src/grep.ts:278`

> Use the glob tool — not shell find — to discover files by path pattern. …

来源：`packages/fs/tool-fs-search/src/glob.ts:303`

## 7. skill：摘要先给，正文按需、不缓存

> The catalog contains sorted skill `name` and normalized, XML-escaped `description` only; it omits bodies, paths, sources, providers, and routing hints.

来源：`docs/subsystems/skills.md:231`

> The model-facing `skill({ name })` tool … rereads the complete definition … and returns a tool result containing `<skill_content …>`, `<skill_resources>`, and `<skill_instructions>`.

来源：`docs/subsystems/skills.md:235`

> Full definitions are not cached by the registry. Each `get()` calls the winning provider…

来源：`docs/subsystems/skills.md:194`

## 8. 回收：度量 + compaction

> Pressure compaction runs at serial `agent/pre-step` before request derivation. … Region boundaries preserve tool-call/result pairing but not whole turns.

来源：`docs/subsystems/compaction.md:86`

> `ctx.tokenMeter` … exposes one detached replay snapshot for request pressure and positional surface pricing.

来源：`docs/subsystems/token-meter.md:5`

## 9. README 是被维护出来的

> A package's README and JSDoc are part of the change: altered behavior (config keys, defaults, error codes, wire fields) updates them in the same commit.

来源：`packages/AGENTS.md:25`

> Package READMEs document model, token, and KV-cache effects using the canonical Model Experience format.

来源：`packages/AGENTS.md:27`

> Package READMEs put durable consumer gaps and non-obvious maintainer constraints under `## Known Limitations and Deferred Work`.

来源：`packages/AGENTS.md:28`

## 已核对的相关消化材料

- `_faq_on_digested/04_root-entry-doc-design/answer.md`：静态设计（本问题的另一半）
- `_faq_on_digested/07_borrowing-harness-idea/10-progressive-disclosure-pipeline.md`：完整五层管线（迁移视角，含 context 注入、system-prompt 组装、compaction、subagent 隔离）
