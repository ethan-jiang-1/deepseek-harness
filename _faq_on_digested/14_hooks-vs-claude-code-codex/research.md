# research · Claude Code 与 Codex hooks 官方文档留档

> 本篇 FAQ 14 的外部证据留档：背景 agent 于 2026-09-22 对照一手来源（官方文档与官方 repo，逐条 claim 附来源 URL）核验后写入。外部文档随时间漂移——与 DSH 桥 README 声明的撰写基线相比已有一处计数漂移：Claude Code 事件数 30（`hooks-claude-code/README.md` 基线）→ 33（本文），Codex 10（`hooks-codex/README.md` 基线）→ 12。复核外部读数以本文留档为准；DSH 侧机制出处见 [answer.md](./answer.md)。文末「Could NOT verify」记录一手来源查不到的事实。

## External research: hooks in Claude Code and OpenAI Codex CLI (primary sources)

Retrieval date: **2026-09-22 (12:49 UTC)**. All claims below were verified against official documentation and the official GitHub repo on that date. URL notes: `docs.claude.com/en/docs/claude-code/hooks` and `.../hooks-reference` now redirect/merge into the single page **code.claude.com/docs/en/hooks** ("Hooks reference"); the quickstart lives at **code.claude.com/docs/en/hooks-guide**. `developers.openai.com/codex/` redirects to **learn.chatgpt.com** (OpenAI's docs host; every page has an `.md` twin). Codex repo: `github.com/openai/codex`.

---

# 1. Claude Code hooks

Primary sources: <https://code.claude.com/docs/en/hooks> (Hooks reference, fetched as `/hooks.md`), <https://code.claude.com/docs/en/hooks-guide> (Automate actions with hooks).

## 1a. Event table (what each event can do)

Events fall into three cadences: per session (`SessionStart`, `SessionEnd`), per turn (`UserPromptSubmit`, `Stop`, `StopFailure`), and per tool call (`PreToolUse`, `PostToolUse` — both skipped for `EndConversation` calls).

| Event | Fires | Can block? (exit 2) | Model-visible / decision power |
| --- | --- | --- | --- |
| `Setup` | `--init-only`, or `--init`/`--maintenance` in `-p` mode | No (exit code/stderr ignored) | None |
| `SessionStart` | Session begins or resumes (`source`: startup/resume/clear/compact/fork) | No | Plain stdout + `additionalContext` added to context; `initialUserMessage` (creates first turn in `-p`), `sessionTitle`, `watchPaths`, `reloadSkills`; only event that can receive `model` |
| `InstructionsLoaded` | CLAUDE.md / `.claude/rules/*.md` loaded | No (exit ignored) | None |
| `UserPromptSubmit` | Prompt submitted, before processing | Yes — blocks and erases the prompt | Plain stdout + `additionalContext` alongside prompt; `decision:"block"`+`reason` |
| `UserPromptExpansion` | Slash-command expands into prompt | Yes | Same as UserPromptSubmit |
| `PreToolUse` | Before tool call executes | Yes — blocks tool call | `permissionDecision` allow/deny/ask/defer + reason, `updatedInput` (rewrite args), `additionalContext` |
| `PermissionRequest` | About to show a permission prompt | No (exit 2 not honored) | `decision{behavior: allow\|deny, updatedInput, updatedPermissions, message, interrupt}` — answers on user's behalf |
| `PermissionDenied` | Auto mode denies a tool call | No (exit/stderr ignored) | `hookSpecificOutput.retry: true` lets the model retry (ignored for no-verdict denials) |
| `PostToolUse` | After tool succeeds | No (shows stderr to Claude) | `decision:"block"`+reason (feedback next to result), `additionalContext`, `updatedToolOutput` (replaces model-visible result), `classifierContext` |
| `PostToolUseFailure` | After tool fails | No (shows stderr to Claude) | Feedback to Claude |
| `PostToolBatch` | After a parallel tool-call batch, before next model call | Yes — stops loop before next model call | `decision:"block"` |
| `Notification` | Claude Code sends a notification (matcher = type: permission_prompt, idle_prompt, auth_success, elicitation_*, agent_needs_input, agent_completed, quota_auto_resume_*) | No (exit ignored) | `terminalSequence` only |
| `MessageDisplay` | While assistant text streams | No | `displayContent` replaces on-screen text only (model still sees original) |
| `SubagentStart` | Subagent spawned (matcher = agent type) | No | `additionalContext` for the subagent |
| `SubagentStop` | Subagent finishes (matcher = agent type) | Yes — prevents subagent stopping | `decision:"block"`+reason continues subagent; `additionalContext` |
| `TaskCreated` / `TaskCompleted` | Task lifecycle via TaskCreate/complete | Yes — rollback / prevent completion | `decision:"block"` or exit 2 |
| `Stop` | Claude finishes responding | Yes — prevents stopping, continues conversation | `decision:"block"`+reason (becomes next instruction), `additionalContext`; input `stop_hook_active`, `last_assistant_message`, `background_tasks`, `session_crons`; 8-consecutive-block cap (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`) |
| `StopFailure` | Turn ends on API error (matcher = error type) | No (output ignored except `terminalSequence`) | None |
| `TeammateIdle` | Agent-team teammate about to idle | Yes | `continue:false` / exit 2 |
| `ConfigChange` | Settings/skills file changes mid-session (matcher: user_settings, project_settings, local_settings, policy_settings, skills) | Yes — blocks change (except policy_settings) | `decision:"block"` |
| `CwdChanged` | Working directory changes | No | Writes to `CLAUDE_ENV_FILE`; `watchPaths` output |
| `DirectoryAdded` | `/add-dir` or SDK `register_repo_root` | No | None |
| `FileChanged` | Watched file changes (matcher = literal filename watch list) | No | `CLAUDE_ENV_FILE`; `watchPaths` |
| `WorktreeCreate` | Worktree creation (`--worktree`, isolation, background) | Yes — any nonzero exit aborts creation | stdout = worktree path (command) / `hookSpecificOutput.worktreePath` (HTTP) |
| `WorktreeRemove` | Worktree removal | Yes — nonzero exit fails removal | JSON discarded |
| `PreCompact` / `PostCompact` | Before / after compaction (matcher: manual/auto) | PreCompact: yes (blocks compaction); PostCompact: no | `decision:"block"`; inputs `trigger`, `custom_instructions` / `compact_summary` |
| `PreModelSwitch` | Before requested model switch | Yes — blocks switch | `permissionDecision` or `decision:"block"`; inputs `from_model`/`to_model` |
| `PostModelSwitch` | After model changes (incl. auto restore) | No | `additionalContext` next request |
| `Elicitation` / `ElicitationResult` | MCP elicitation opens / user responds (matcher = MCP server name) | Yes — denies / forces decline | `hookSpecificOutput.action` (accept/decline/cancel) + `content`; exit-2 hook's hookSpecificOutput ignored |
| `SessionEnd` | Session terminates (matcher = reason: clear/resume/logout/prompt_input_exit/other; `bypass_permissions_disabled` removed v2.1.234) | No | Advisory; JSON discarded; 1.5 s shared budget (per-hook `timeout` raises it, up to 60 s; `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`) |

## 1b. Configuration format (settings.json)

Locations (all merge additively across levels — entries never replace each other): `~/.claude/settings.json` (user), `.claude/settings.json` (project, committable), `.claude/settings.local.json` (gitignored local), managed policy settings, plugin `hooks/hooks.json`, skill frontmatter, subagent frontmatter. From the docs:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/block-rm.sh",
            "args": []
          }
        ]
      }
    ]
  }
}
```

Handler types: `command`, `http` (`url`, `headers` with `$VAR` interpolation restricted by `allowedEnvVars`), `mcp_tool` (`server`, `tool`, `input` with `${path}` substitution), `prompt` (LLM judge, Haiku default; `ok:true/false` + `reason`, `impossible`, `continueOnBlock`), `agent` (experimental subagent verifier, `ok`/`reason`, 60 s default, ≤50 tool turns). Common fields: `type`, `if` (permission-rule syntax; only tool events `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionDenied`), `timeout` (seconds), `statusMessage`, `once` (skill frontmatter only). Command-only: `args` (exec form, no shell), `async`, `asyncRewake`, `shell` ("bash"|"powershell").

Matcherrules: `"*"`, `""`, or omitted = match all; values of letters/digits/`_`/`-`/space/`,`/`|` = exact or `|`/`,`-separated list; any other character switches to unanchored JavaScript regex. MCP tools are `mcp__<server>__<tool>` (plugin-bundled: `mcp__plugin_<plugin>_<server>__<tool>`).

Disable: `"disableAllHooks": true` (settings precedence applies; per-run `--settings '{"disableAllHooks": true}'`; managed hooks can only be disabled at managed level). Enterprise `allowManagedHooksOnly` restricts to managed hooks. HTTP allowlists: `allowedHttpHookUrls`, `httpHookAllowedEnvVars`. `/hooks` menu is a read-only browser.

## 1c. Execution and control-flow contract

- **Invocation**: JSON on stdin (HTTP hooks: POST body, same JSON; response body uses the same JSON output format). Command hooks: shell form (`sh -c` on macOS/Linux, Git Bash or PowerShell on Windows) unless `args` is set, then exec form (direct spawn, no shell).
- **Common input fields**: `session_id`, `prompt_id` (v2.1.196+), `transcript_path` (written asynchronously; may lag), `cwd`, `scratchpad_dir` (v2.1.257+), `permission_mode` (`default`/`plan`/`acceptEdits`/`auto`/`dontAsk`/`bypassPermissions`), `effort{level}`, `hook_event_name`; plus `agent_id`/`agent_type` inside subagents. Tool events add `tool_name`, `tool_input`, `tool_use_id` (MCP tools also `mcp_server{name,source}` v2.1.274+). `PostToolUse` adds `tool_response`, `duration_ms`. File-tool `tool_input.file_path` is always absolute (Windows: backslashes).
- **Environment**: inherits parent env minus `OTEL_*` (plus scrubbing when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`); `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA` exported (and usable as path placeholders); `CLAUDE_ENV_FILE` available to SessionStart/Setup/CwdChanged/FileChanged hooks (write `export` lines, sourced before Bash commands); `$CLAUDE_EFFORT`; there is no `$CLAUDE_MODEL`.
- **Working directory**: current directory; fallback chain (session start dir → project root → home → temp) if it was deleted. No controlling terminal: hooks and children cannot open `/dev/tty` (use `terminalSequence` output instead).
- **Parallelism**: all matching hooks run in parallel; the same handler defined in several settings files runs once; when multiple PreToolUse hooks return `updatedInput`, the last to finish wins (non-deterministic). PreToolUse decisions precedence: `deny` > `defer` > `ask` > `allow`.
- **Timeouts** (seconds, per handler): default 600 for command/http/mcp_tool (30 for UserPromptSubmit/PreModelSwitch/PostModelSwitch, 10 for MessageDisplay), 30 for prompt, 60 for agent; SessionEnd shares a 1.5 s budget (raise per-hook or via `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`, cap 60). A timed-out sync hook is canceled and its output discarded — a timed-out PreToolUse command/http/mcp_tool hook does **not** block the tool call (it proceeds through the normal permission flow); on PreModelSwitch a canceled hook blocks the switch.
- **Exit codes**: 0 = success (stdout parsed as JSON only if it starts `{` and ends `}`); 2 = blocking error (blocks regardless of JSON; per-event effects in the table above; `PermissionRequest`, `PermissionDenied`, `Notification`, `StopFailure`, `Setup` ignore it); any other code = non-blocking error, action proceeds. JSON is honored on any exit code except where the event discards output; invalid JSON or schema-validation failure is a non-blocking error (action proceeds). Plain-text stdout reaches Claude's context only on `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, `PostModelSwitch`.
- **JSON output fields**: universal `continue` (false stops Claude entirely), `stopReason`, `suppressOutput` (accepted, no effect), `systemMessage`, `terminalSequence` (OSC 0/1/2/9/99/777 + BEL allowlist); top-level `decision:"block"` + `reason`; per-event `hookSpecificOutput` (see table). `additionalContext`, `systemMessage`, `initialUserMessage`, and plain stdout are capped at 10,000 chars — overflow is saved to a session file and replaced with the path plus a 2,000-char preview.
- **Async**: `async: true` (command hooks only) runs in the background; `timeout` not enforced; the hook cannot block or control anything; `additionalContext`/`systemMessage` delivered on the next conversation turn (not shown to the user); `asyncRewake: true` additionally wakes Claude immediately when the hook exits 2. No deduplication across firings.

## 1d. Security model

- Hooks execute shell commands with the user's full permissions (docs warning).
- **Workspace trust**: interactive sessions hold back hooks from every settings file (including `~/.claude/settings.json`) until the trust dialog is accepted; `-p`/SDK sessions never show the dialog and treat the folder as trusted, so a repo's committed `.claude/settings.json` hooks run without trust. Subagent-frontmatter hooks are stricter (project subagent hooks require the trust dialog since v2.1.218).
- `disableAllHooks`, managed-settings hierarchy, `allowManagedHooksOnly`, HTTP URL allowlists.
- A PreToolUse `deny` blocks even in `bypassPermissions` mode and with `--dangerously-skip-permissions` (hooks tighten but cannot loosen past permission deny rules; `allow` does not bypass deny rules or `requiresUserInteraction` MCP tools). PreToolUse fires before permission-mode checks in every mode.
- Prompt hooks use a model judge; the docs caution against out-of-band instruction phrasing in `additionalContext` (prompt-injection defenses).

## 1e. Facts with sources (Claude Code)

- 33 hook events with cadences and full per-event input schemas and decision options; `EndConversation` skips PreToolUse/PostToolUse (https://code.claude.com/docs/en/hooks).
- Hook locations table: user/project/local settings, managed policy, plugin `hooks/hooks.json`, skill frontmatter, subagent frontmatter; hooks merge additively across settings levels (https://code.claude.com/docs/en/hooks).
- Cloud sessions ignore `~/.claude/settings.json` and take hooks from the repo's `.claude/settings.json`, synced plugins, and server-managed settings (https://code.claude.com/docs/en/hooks).
- Matchervale evaluation (exact list vs unanchored JS RegExp), per-event matcher fields, comma support v2.1.191+, hyphen exact-match v2.1.195+ (https://code.claude.com/docs/en/hooks).
- Exit-code contract including "exit 2 is the only code that blocks alone; exit 1 is a non-blocking error" and per-event exit-2 table (https://code.claude.com/docs/en/hooks).
- JSON output schema (continue/stopReason/suppressOutput/systemMessage/terminalSequence), decision-control table per event, updatedInput/updatedToolOutput/updatedPermissions, 10,000-char spill cap (https://code.claude.com/docs/en/hooks).
- Prompt-based hooks (`ok`/`reason`/`impossible`/`continueOnBlock`) and experimental agent-based hooks with 60 s / 50-turn defaults (https://code.claude.com/docs/en/hooks, https://code.claude.com/docs/en/hooks-guide).
- Async hooks: background execution, no timeout enforcement, delivery on next turn, asyncRewake (https://code.claude.com/docs/en/hooks).
- `disableAllHooks` semantics incl. `--settings '{"disableAllHooks": true}'` per-run override and managed-settings hierarchy (https://code.claude.com/docs/en/hooks).
- Workspace-trust gating and the warning that `-p` runs treat folders as trusted (https://code.claude.com/docs/en/hooks).
- Security best practices: quote shell variables, absolute paths, skip `.env`/`.git`, path-traversal checks (https://code.claude.com/docs/en/hooks).
- Reference implementation: `examples/hooks/bash_command_validator_example.py` in anthropics/claude-code (https://code.claude.com/docs/en/hooks).

---

# 2. OpenAI Codex CLI hooks

Primary sources: <https://learn.chatgpt.com/docs/hooks.md> (Hooks), <https://learn.chatgpt.com/docs/config-file/config-reference.md>, <https://learn.chatgpt.com/docs/config-file/config-advanced.md>, <https://learn.chatgpt.com/docs/whats-new.md>, repo <https://github.com/openai/codex> (`docs/config.md`, `codex-rs/hooks/schema/generated/`).

**Codex has a full hooks system as of 2026-09-22** — not just `notify`. Hooks "reached general availability" per the official What's New digest for the week of May 11–15, 2026 (May 14 launch notes). The wire format is generated as JSON Schema per event in the repo at `codex-rs/hooks/schema/generated/` (verified: input schemas for all 12 events; output schemas for all except `session-end`, which is advisory).

## 2a. Event table

| Event | Fires | Can block/modify? | Notable inputs / outputs |
| --- | --- | --- | --- |
| `SessionStart` | Session or subagent starts; matcher on `source` (startup/resume/clear/compact). After compaction of a root session, runs before next model request | No block; `continue:false` ends turn (compact) | Plain stdout = extra developer context; `hookSpecificOutput.additionalContext` |
| `SessionEnd` | Main thread ends (archive/delete open conversation, normal close, or 30 min idle); not for subagents; matcher `reason` = `other` only | No — advisory; always synchronous; output never steers Codex | `reason`; 1 s default timeout, max 3 s |
| `SubagentStart` | Subagent starts; matcher on `agent_type` | No (`continue:false` parsed but ignored) | `agent_id`, `agent_type`; `additionalContext` for the subagent |
| `SubagentStop` | Subagent finishes; matcher on `agent_type` | Yes — `decision:"block"`+reason continues the subagent flow; `continue:false` overrides | `agent_id`, `agent_type`, `agent_transcript_path`, `stop_hook_active`, `last_assistant_message`; JSON stdout required |
| `PreToolUse` | Before tool call; matcher on tool name (`Bash`, `apply_patch`/`Edit`/`Write`, MCP names, other local function tools; `spawn_agent` also matches `Agent`) | Yes — `permissionDecision:"deny"` (+reason), legacy `{"decision":"block","reason"}`, or exit 2 + stderr; `permissionDecision:"allow"` + `updatedInput` rewrites the call (Bash/apply_patch: string `command` field required) | `tool_name`, `tool_use_id`, `tool_input`; `additionalContext` |
| `PermissionRequest` | When Codex is about to ask for approval (shell escalation, managed-network); not for non-approval commands | Yes — `hookSpecificOutput.decision{behavior:"allow"|"deny", message}`; any deny wins, else an allow suppresses the prompt, else normal flow; `updatedInput`/`updatedPermissions`/`interrupt` reserved and **fail closed** | `tool_name`, `tool_input`, optional `tool_input.description` |
| `PostToolUse` | After supported tools produce output (incl. non-zero Bash exits); matcher on tool name | Cannot undo; `decision:"block"`+reason **replaces the tool result** with the feedback and continues; `continue:false` stops normal processing of the result; exit 2 = same as block | `tool_name`, `tool_use_id`, `tool_input`, `tool_response`; `additionalContext`; code-mode: block makes the nested tool promise reject |
| `PreCompact` / `PostCompact` | Before / after chat compaction; matcher on `trigger` (manual/auto) | `continue:false` stops before / after compacting | `trigger` |
| `UserPromptSubmit` | User prompt about to be sent; matcher ignored | Yes — `decision:"block"`+reason or exit 2 blocks the prompt | `prompt`; plain stdout = developer context; `additionalContext` |
| `Stop` | Turn ends; matcher ignored | Yes — `decision:"block"`+reason does **not** reject the turn; Codex auto-creates a continuation prompt using `reason` as the new user prompt; exit 2 same; `continue:false` overrides | `stop_hook_active`, `last_assistant_message`; JSON stdout required |
| `Interrupt` | User interrupts an active main-thread turn; matcher ignored | No — output can't prevent interruption or restart the turn | 1 s default timeout, max 3 s; JSON `{systemMessage}` or plain exit 0 |

Tool coverage: shell (`Bash`), unified exec (`exec_command`), `apply_patch`, MCP tools, and most local function tools (e.g. `update_plan`) all run the hook path; hosted tools (e.g. `WebSearch`) do not; `write_stdin` polls don't re-run `PreToolUse`. Docs caution: "Some specialized tool paths can opt out of the default hook path. Treat tool hooks as a useful guardrail, not a complete enforcement boundary."

## 2b. Configuration format (hooks.json / config.toml)

Discovered "next to active config layers": `~/.codex/hooks.json`, `~/.codex/config.toml`, `<repo>/.codex/hooks.json`, `<repo>/.codex/config.toml`, plus plugin bundles (default `hooks/hooks.json`, overridable via a `hooks` entry in `.codex-plugin/plugin.json`) and managed `[hooks]` in enterprise `requirements.toml` (with `managed_dir` / `windows_managed_dir`). All matching sources load (no replacement by higher-precedence layers); a layer containing both `hooks.json` and inline `[hooks]` is merged with a startup warning. Project-local hooks load only when the project `.codex/` layer is trusted. From the docs:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^Bash$",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/bin/python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/pre_tool_use_policy.py\"",
            "timeout": 30,
            "statusMessage": "Checking Bash command"
          }
        ]
      }
    ]
  }
}
```

```toml
[[hooks.PostToolUse]]
matcher = "Bash"

[[hooks.PostToolUse.hooks]]
type = "command"
command = "python3 ~/.codex/hooks/post_tool_use.py"
async = true
timeout = 120
```

Handler fields: `command` (+ `commandWindows`/TOML `command_windows`), `timeout` (seconds; default 600; `SessionEnd`/`Interrupt` default 1 s, max 3 s), `statusMessage`, `async`, `additionalContextLimit` (per-handler token threshold for `additionalContext`; default 2500; 0 passes full text). Handler types: `command` and `mcp_tool` supported (`server`, `tool`, `input` with `${field.nested}` template expansion); `prompt` and `agent` handlers are **parsed but skipped**. Optional top-level `description` in `hooks.json`.

Feature flag and enterprise controls:

```toml
[features]
hooks = false            # canonical key; codex_hooks is a deprecated alias

allow_managed_hooks_only = true   # requirements.toml only
```

## 2c. Execution and control-flow contract

- **Invocation**: one JSON object on stdin. Commands run with the **session `cwd`** as working directory.
- **Common input fields**: `session_id` (subagent hooks use the parent session id), `transcript_path` (`string|null`; format explicitly not a stable interface), `cwd`, `hook_event_name`, `model` (Codex-specific extension: active model slug), and `turn_id` on turn-scoped events. `permission_mode` (`default`/`acceptEdits`/`plan`/`dontAsk`/`bypassPermissions`) is included on SessionStart, PreToolUse, PermissionRequest, PostToolUse, UserPromptSubmit, SubagentStart, SubagentStop, Stop, Interrupt. Event-specific fields listed in the table above.
- **Parallelism**: matching hooks from multiple files all run; multiple matching command hooks for the same event are launched concurrently. MCP tool hooks run synchronously on an existing MCP connection (never start/reconnect servers; no tool approval; no nested hooks); the shorter of hook/server timeout applies (elicitation wait doesn't count); SessionStart MCP hooks may run before servers are ready (skipped, non-blocking); SessionEnd doesn't support MCP tool hooks.
- **Timeouts**: seconds; default 600 (1 s default / 3 s max for SessionEnd and Interrupt). SessionEnd always runs synchronously.
- **Exit codes / output**: exit 0 with no output = success. JSON output per event; shared fields for SessionStart, PreCompact, PostCompact, UserPromptSubmit, SubagentStop, Stop: `continue`, `stopReason`, `systemMessage`, `suppressOutput` (parsed, not implemented). PreToolUse/PermissionRequest support `systemMessage` only among the shared fields — returning `continue`/`stopReason`/`suppressOutput` there marks the hook run failed, reports the error, and continues the tool call. `permissionDecision:"ask"`, legacy `decision:"approve"`, `updatedMCPToolOutput`, and `suppressOutput` are parsed-but-unsupported on their events (same fail-reported-and-continue behavior). Plain-text stdout is invalid for SubagentStop, Stop, and Interrupt; it is added as developer context for SessionStart, SubagentStart, and UserPromptSubmit, and ignored elsewhere.
- **Large output ("spilling")**: model-visible hook output is capped at roughly 2,500 tokens by default; overflow is saved to `<temp_dir>/hook_outputs/<session_id>/<uuid>.txt` and the model receives a head-and-tail preview plus the file path. Per-handler `additionalContextLimit` adjusts this for `additionalContext` only (0 = full text). Docs warn not to return secrets in hook output (disk spill).
- **Background hooks**: `async: true` — Codex doesn't wait; supported informational output (`additionalContext`, `systemMessage`) is delivered at the next safe point (after the current model request/tool calls, or on the next user turn; a finished background hook never starts a turn). Background hooks cannot block, approve, rewrite, or control the triggering operation. Up to **8 background hooks concurrently per session**; unfinished ones are canceled at session end; SessionEnd hooks always run synchronously.

## 2d. Security model (Codex)

- **Trust review**: before any non-managed hook runs, Codex requires the user to review and trust the exact hook definition; trust is recorded against the hook's current hash, so new or changed hooks are skipped until trusted. `/hooks` in the CLI inspects sources, reviews/trusts/disables hooks; Codex prints a startup warning when review is pending.
- `--dangerously-bypass-hook-trust` runs enabled hooks without persisted trust for one invocation.
- **Managed hooks**: system/MDM/cloud/`requirements.toml` sources are marked managed, trusted by policy, and cannot be disabled from the user hook browser; `allow_managed_hooks_only = true` (requirements.toml only) ignores user/project/session/plugin hooks; pinning `[features].hooks = true` enforces hooks even for users who disabled them locally.
- Project-local hooks load only in trusted projects; user and system hooks load regardless.
- Plugin-bundled hooks also require trust review; plugin hooks receive `PLUGIN_ROOT`/`PLUGIN_DATA` env vars plus compatibility aliases `CLAUDE_PLUGIN_ROOT`/`CLAUDE_PLUGIN_DATA`.
- Tool hooks are explicitly not a complete enforcement boundary (tool paths can opt out).

## 2e. Async / stop-gap mechanisms (Codex)

- **`notify`** (the older extension point, still supported): `notify = ["python3", "/path/to/notify.py"]` in `~/.codex/config.toml` (ignored in project-local config). The program is invoked for notification events — currently only `agent-turn-complete` — and receives the payload as a **single JSON argv argument** with fields: `type`, `thread-id`, `turn-id`, `cwd`, `input-messages`, `last-assistant-message`. (`notify` cannot influence control flow; it is side-channel alerting only.)
- TUI notification alternatives: `tui.notifications`, `tui.notification_method` (`auto`/`osc9`/`bel`), `tui.notification_condition` (`unfocused`/`always`).
- `hooks.json` background (`async`) hooks and the `Interrupt` event are the newer async hooks; hooks metrics `hooks.run` and `hooks.run.duration_ms` (fields `hook_name`, `source`, `status`) exist in the analytics catalog.
- **Dating/changes**: hooks GA week of May 11–15, 2026 (May 14 launch notes). The config reference documents `features.hooks` with `codex_hooks` as a deprecated alias, and the repo's `docs/config.md` documents `allow_managed_hooks_only`. Older Codex versions shipped hooks behind the `codex_hooks` experimental feature flag (the alias's existence is the primary-source trace; exact introduction version not stated in the docs).

## 2f. Facts with sources (Codex)

- Hooks are "an extensibility framework for Codex… run scripts or MCP tools during the agentic loop"; 12 events; concurrent same-event command hooks; trust requirement (https://learn.chatgpt.com/docs/hooks).
- Discovery locations, plugin-bundled hooks, project-trust rule, merge semantics (https://learn.chatgpt.com/docs/hooks, https://learn.chatgpt.com/docs/config-file/config-advanced.md).
- Trust model: hash-recorded trust, `/hooks`, `--dangerously-bypass-hook-trust`, managed hooks from requirements.toml with `managed_dir`/`windows_managed_dir`, `allow_managed_hooks_only` (https://learn.chatgpt.com/docs/hooks; also https://raw.githubusercontent.com/openai/codex/main/docs/config.md).
- Config schema: `[features].hooks` (alias `codex_hooks`), `hooks.<Event>` matcher groups, handler fields `async`/`additionalContextLimit`/`commandWindows`, `notify` key, `allow_managed_hooks_only` (https://learn.chatgpt.com/docs/config-file/config-reference.md).
- Per-event JSON input/output shapes, exit-code 2 usage, unsupported-field behavior, spilling to `<temp_dir>/hook_outputs/...`, 8-background-hook cap (https://learn.chatgpt.com/docs/hooks).
- `notify` payload fields and `agent-turn-complete` example program; `tui.notifications` options (https://learn.chatgpt.com/docs/config-file/config-advanced.md).
- Hooks GA week of May 11–15, 2026 (https://learn.chatgpt.com/docs/whats-new.md).
- Repo: `docs/config.md` is now a stub pointing at developers.openai.com config pages and documents `allow_managed_hooks_only`; generated hook wire schemas live at `codex-rs/hooks/schema/generated/` — listed via the GitHub API on 2026-09-22: input schemas for interrupt, permission-request, post-compact, post-tool-use, pre-compact, pre-tool-use, session-end, session-start, stop, subagent-start, subagent-stop, user-prompt-submit (+ output schemas except session-end) (https://github.com/openai/codex/tree/main/codex-rs/hooks/schema/generated, linked from https://learn.chatgpt.com/docs/hooks#schemas).

---

# Could NOT verify from primary sources

- The exact Codex CLI version number that first shipped hooks (docs give only the GA week, May 2026, and the deprecated `codex_hooks` alias; `learn.chatgpt.com/docs/changelog.md` returned 404 for its `.md` twin).
- Whether Codex hooks fire under `codex exec` (non-interactive) — the hooks page does not state it.
- Claude Code's current release version at retrieval (the docs reference behaviors up to v2.1.274; no independent version check was made).
- Claude Code hook behavior in cloud sessions beyond the documented sources (repo settings, synced plugins, server-managed settings).
- The full `if`-condition engine internals beyond the documented Bash/permission-rule matching table (e.g., PowerShell subcommand parsing).

# Source URL index

- Claude Code: https://code.claude.com/docs/en/hooks · https://code.claude.com/docs/en/hooks-guide · https://code.claude.com/docs/en/hooks.md (full markdown twin)
- Codex: https://learn.chatgpt.com/docs/hooks.md · https://learn.chatgpt.com/docs/config-file/config-reference.md · https://learn.chatgpt.com/docs/config-file/config-advanced.md · https://learn.chatgpt.com/docs/whats-new.md · https://learn.chatgpt.com/llms.txt · https://raw.githubusercontent.com/openai/codex/main/docs/config.md · https://github.com/openai/codex/tree/main/codex-rs/hooks/schema/generated
