# Research · Claude Code 与 OpenAI Codex CLI Hooks 官方文档核验留档

本页保存 [answer.md](./answer.md) 横向对比所依据的外部一手资料快照（检索时间：**2026-09-22 12:49 UTC**，来源为 Claude Code 与 OpenAI Codex CLI 官方文档及 `openai/codex` 官方仓库 schema）。

> **关于事件计数的说明**：外部产品文档持续演进。DSH 两个桥包 README 撰写时对照的官方基线分别是 Claude Code 30 个事件、Codex 10 个事件；截至本次检索核验，官方文档已演进至 **Claude Code 33 个事件、Codex 12 个事件**。下方保留逐事件的英文一手核验记录与出处链接，供后续复核对照。

---

## 1. Claude Code hooks

Primary sources: <https://code.claude.com/docs/en/hooks> (`Hooks reference`, fetched as `/hooks.md`), <https://code.claude.com/docs/en/hooks-guide> (`Automate actions with hooks`).

### 1a. Event table (33 events)

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

### 1b. Configuration format (`settings.json`)

Locations (all merge additively across levels — entries never replace each other): `~/.claude/settings.json` (user), `.claude/settings.json` (project, committable), `.claude/settings.local.json` (gitignored local), managed policy settings, plugin `hooks/hooks.json`, skill frontmatter, subagent frontmatter:

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

- **Handler types**: `command`, `http` (`url`, `headers` with `$VAR` interpolation restricted by `allowedEnvVars`), `mcp_tool` (`server`, `tool`, `input` with `${path}` substitution), `prompt` (LLM judge, Haiku default; `ok:true/false` + `reason`, `impossible`, `continueOnBlock`), `agent` (experimental subagent verifier, `ok`/`reason`, 60 s default, <=50 tool turns).
- **Common fields**: `type`, `if` (permission-rule syntax on tool events), `timeout` (seconds), `statusMessage`, `once` (skill frontmatter only). Command-only: `args` (exec form, no shell), `async`, `asyncRewake`, `shell` (`"bash"` | `"powershell"`).
- **Matcher rules**: `"*"`, `""`, or omitted = match all; letters/digits/`_`/`-`/space/`,`/`|` = exact or `|`/`,`-separated list; any other character switches to unanchored JavaScript regex.
- **Disable / enterprise controls**: `"disableAllHooks": true`, `allowManagedHooksOnly`, `allowedHttpHookUrls`, `httpHookAllowedEnvVars`.

### 1c. Execution, control-flow, and security contract

- **Invocation**: JSON on stdin (HTTP hooks: POST body). Command hooks use shell form (`sh -c` on macOS/Linux) unless `args` is set (exec form).
- **Common input fields**: `session_id`, `prompt_id`, `transcript_path` (written asynchronously; may lag), `cwd`, `scratchpad_dir`, `permission_mode`, `effort{level}`, `hook_event_name`, plus `agent_id`/`agent_type` inside subagents. Tool events add `tool_name`, `tool_input`, `tool_use_id`; `PostToolUse` adds `tool_response`, `duration_ms`.
- **Environment**: inherits parent env minus `OTEL_*`; exports `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `$CLAUDE_EFFORT`, and `CLAUDE_ENV_FILE` on `SessionStart`/`Setup`/`CwdChanged`/`FileChanged`.
- **Parallelism**: all matching hooks run in parallel; identical handlers across settings files deduplicate; parallel `updatedInput` uses last-finisher-wins (non-deterministic). Precedence: `deny` > `defer` > `ask` > `allow`.
- **Timeouts**: default 600 s for `command`/`http`/`mcp_tool` (30 s for `UserPromptSubmit`/`PreModelSwitch`/`PostModelSwitch`, 10 s for `MessageDisplay`), 30 s for `prompt`, 60 s for `agent`; `SessionEnd` shares a 1.5 s budget (up to 60 s). A timed-out `PreToolUse` hook does **not** block the tool call.
- **Exit codes & output**: `0` = success; `2` = blocking error; any other code = non-blocking error. Universal JSON output fields: `continue` (`false` stops Claude entirely), `stopReason`, `suppressOutput`, `systemMessage`, `terminalSequence`, `decision: "block"` + `reason`, and `hookSpecificOutput`. Text caps at 10,000 chars with disk spill + 2,000-char preview.
- **Workspace trust**: interactive sessions hold back hooks until workspace trust is accepted; `-p` / SDK sessions treat the folder as trusted without showing a dialog. `PreToolUse` `deny` blocks even under `bypassPermissions`.

---

## 2. OpenAI Codex CLI hooks

Primary sources: <https://learn.chatgpt.com/docs/hooks.md>, <https://learn.chatgpt.com/docs/config-file/config-reference.md>, <https://learn.chatgpt.com/docs/config-file/config-advanced.md>, <https://learn.chatgpt.com/docs/whats-new.md>, repo <https://github.com/openai/codex> (`codex-rs/hooks/schema/generated/`).

Codex hooks reached general availability in May 2026 (week of May 11–15, 2026 launch notes), with generated wire JSON Schemas for all 12 events in `codex-rs/hooks/schema/generated/`.

### 2a. Event table (12 events)

| Event | Fires | Can block/modify? | Notable inputs / outputs |
| --- | --- | --- | --- |
| `SessionStart` | Session or subagent starts; matcher on `source` (`startup`/`resume`/`clear`/`compact`) | No block; `continue:false` ends turn (compact) | Plain stdout = extra developer context; `hookSpecificOutput.additionalContext` |
| `SessionEnd` | Main thread ends; not for subagents; matcher `reason` = `other` only | No — advisory; always synchronous | `reason`; 1 s default timeout, max 3 s |
| `SubagentStart` | Subagent starts; matcher on `agent_type` | No (`continue:false` parsed but ignored) | `agent_id`, `agent_type`; `additionalContext` for the subagent |
| `SubagentStop` | Subagent finishes; matcher on `agent_type` | Yes — `decision:"block"`+reason continues subagent; `continue:false` overrides | `agent_id`, `agent_type`, `agent_transcript_path`, `stop_hook_active`, `last_assistant_message`; JSON stdout required |
| `PreToolUse` | Before tool call; matcher on tool name | Yes — `permissionDecision:"deny"`, legacy `{"decision":"block","reason"}`, or exit 2; `permissionDecision:"allow"` + `updatedInput` rewrites args | `tool_name`, `tool_use_id`, `tool_input`; `additionalContext` |
| `PermissionRequest` | When Codex is about to ask for approval (shell escalation, managed-network) | Yes — `hookSpecificOutput.decision{behavior:"allow"\|"deny", message}`; reserved fields fail closed | `tool_name`, `tool_input`, optional `tool_input.description` |
| `PostToolUse` | After supported tools produce output | Cannot undo; `decision:"block"`+reason replaces tool result with feedback; `continue:false` stops result processing | `tool_name`, `tool_use_id`, `tool_input`, `tool_response`; `additionalContext` |
| `PreCompact` / `PostCompact` | Before / after chat compaction; matcher on `trigger` (`manual`/`auto`) | `continue:false` stops before / after compacting | `trigger` |
| `UserPromptSubmit` | User prompt about to be sent; matcher ignored | Yes — `decision:"block"`+reason or exit 2 blocks the prompt | `prompt`; plain stdout = developer context; `additionalContext` |
| `Stop` | Turn ends; matcher ignored | Yes — `decision:"block"`+reason auto-creates a continuation prompt using `reason`; `continue:false` overrides | `stop_hook_active`, `last_assistant_message`; JSON stdout required |
| `Interrupt` | User interrupts an active main-thread turn; matcher ignored | No — cannot prevent interruption or restart turn | 1 s default timeout, max 3 s; JSON `{systemMessage}` or exit 0 |

### 2b. Configuration format (`hooks.json` / `config.toml`)

Discovered next to active config layers (`~/.codex/hooks.json`, `~/.codex/config.toml`, `<repo>/.codex/hooks.json`, `<repo>/.codex/config.toml`), plugin bundles (`hooks/hooks.json`), and enterprise `requirements.toml`. All matching sources merge additively; project-local hooks load only when the project `.codex/` layer is trusted.

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

- **Handler types**: `command` and `mcp_tool` supported; `prompt` and `agent` handlers are parsed and skipped.
- **Legacy side-channel**: `notify = ["python3", "/path/to/notify.py"]` in `~/.codex/config.toml` remains supported for `agent-turn-complete` alerting (single JSON argv argument, no control-flow power).

### 2c. Execution, spilling, and security contract

- **Invocation & parallelism**: JSON on stdin in session `cwd`; matching command hooks on the same event run concurrently; up to 8 background (`async: true`) hooks concurrently per session.
- **Unsupported fields**: `permissionDecision: "ask"`, legacy `decision: "approve"`, `updatedMCPToolOutput`, and `suppressOutput` are parsed-but-unsupported (reported as hook error and execution continues).
- **Large output spilling**: model-visible hook output caps at ~2,500 tokens by default (`additionalContextLimit` adjusts `additionalContext`); overflow spills to `<temp_dir>/hook_outputs/<session_id>/<uuid>.txt` with a head-and-tail preview.
- **Hash-based trust review**: before any non-managed hook runs, Codex requires reviewing and trusting the exact hook definition hash via `/hooks` (unless `--dangerously-bypass-hook-trust` is passed for a single run). Enterprise `allow_managed_hooks_only = true` in `requirements.toml` locks execution to managed hooks.
- **Guardrail caveat**: hosted tools (such as `WebSearch`) and `write_stdin` polls do not run the hook path; Codex docs explicitly note that specialized tool paths can opt out of the default hook path.

---

## 3. Unverified edge details from primary sources

At retrieval time, primary docs did not state:
- The exact Codex CLI semver that first introduced experimental `codex_hooks` prior to May 2026 GA.
- Whether Codex hooks fire identically under non-interactive `codex exec`.
- Internal `if`-condition parser specifics on PowerShell subcommands in Claude Code beyond the documented permission-rule matching table.
