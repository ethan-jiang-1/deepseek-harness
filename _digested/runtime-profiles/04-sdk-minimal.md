# sdk-minimal — JSON-RPC 极简变体

## 一句话

sdk-minimal 是 SDK 的极简版本，工具面大幅收窄，用于 Python SDK 的捆绑单文件运行时（`dsh-jsonrpc-agent-pkg`）。模型只看到 persistent bash + str_replace_editor，没有 subagent、tool-fs、todo_write、compaction。

## 怎么跑

```sh
# Python SDK 捆绑运行时
python -m dsh run --scenario sdk-minimal --exe dist-exe/dsh-jsonrpc-agent-pkg-macos-arm64

# 直接通过 cordis.yml
dsh-jsonrpc-agent ./minimal.cordis.yml
```

sdk-minimal 也不是 `PROFILE_TEMPLATES` 中的一个名字。它是一个具体的 `cordis.yml` 组合（`examples/jsonrpc-agent/minimal.cordis.yml`），与 sdk 共用同一个 `dsh-jsonrpc-agent` bin。

## 组合构成

`examples/jsonrpc-agent/minimal.cordis.yml` 是完整的 standalone 组合：

| id | 插件 | 作用 |
|----|------|------|
| `sdk-jsonrpc-server` | `@deepseek-ai/dsh-sdk-jsonrpc-server` | JSON-RPC 协议处理器，`maxTokensAsSuccess: false` |
| `llm-deepseek` | `@deepseek-ai/dsh-llm-deepseek` | LLM 适配器，`DSH_MODEL` 选模型 |
| `sandbox` | `@deepseek-ai/dsh-sandbox-local` | 沙箱 |
| `sandbox-policy` | `@deepseek-ai/dsh-sandbox-policy` | `mode: danger-full-access` |
| `subprocess` | `@deepseek-ai/dsh-subprocess-local` | 子进程管理 |
| `pty` | `@deepseek-ai/dsh-terminal` | 持久 PTY |
| `terminal-bash` | `@deepseek-ai/dsh-terminal-bash` | 持久 bash（5 分钟 timeout） |
| `fs-local` | `@deepseek-ai/dsh-fs-local` | 裸本地文件系统 |
| `agent-spine` | `@deepseek-ai/dsh-agent-spine-demo` | agent 核心，但配置大幅收窄 |

其中 `agent-spine` 的配置：

```yaml
includeHarnessIdentity: false     # 不加 DSH 身份标识
includeRuntimeContext: false      # 不加运行时上下文快照
persona: "You are a helpful software engineer assistant."
workspaceContext: false           # 不加 AGENTS.md/CLAUDE.md
skills:
  enabled: false                  # 无技能系统
toolBash: false                   # 不用 base 的 bash（用 persistent bash）
toolJobs: false                   # 无 job 工具
```

以及独有的工具行：

| id | 插件 | 作用 |
|----|------|------|
| `persistent-bash` | `@deepseek-ai/dsh-tool-bash-persistent` | 持久 bash shell（5 分钟 timeout，状态跨命令保持） |
| `str-replace-editor` | `@deepseek-ai/dsh-tool-str-replace-editor` | 字符串替换编辑器 |
| `sessions` | `@deepseek-ai/dsh-session-persistence-jsonl` | JSONL 持久化，`compression: none` |

## 与 sdk 的差异

| 维度 | sdk | sdk-minimal |
|------|-----|-------------|
| `maxTokensAsSuccess` | `true`（环境变量控制） | `false` |
| `tool-bash` | 普通 foreground bash | persistent bash（PTY，5 分钟） |
| `tool-fs` | `read` / `write` / `edit` 完整工具 | **无**（用 str_replace_editor 代替） |
| `str_replace_editor` | 无（sdk 没有 `str-replace-editor` 行，靠 `tool-fs` 读写文件） | 有（且是 editor 的唯一来源） |
| `subagent` | 有 | **无** |
| `tool-todo` | 有 | **无** |
| `compaction` | `compaction-basic` | **无** |
| `sandbox` 策略 | 无（`fs-local` 直接暴露） | `danger-full-access` |
| `session-checkpoint` | 有 | **无** |
| `token-meter` | 有 | **无** |
| 系统提示词 | `"You are a coding agent."` | `"You are a helpful software engineer assistant."` |
| `includeHarnessIdentity` | 默认 true | `false` |
| `includeRuntimeContext` | 默认 true | `false` |

## 独特之处

- **Python SDK 捆绑运行时的默认组合**：`scripts/smoke-python-runtime.py` 的 `sdk-minimal` 场景把 model-visible 输出钉在 `scripts/snapshots/python-sdk-single-exe/minimal/model-visible.json`。
- **工具面最窄的 Profile**：模型只看到 persistent bash + str_replace_editor 两个工具。
- **`danger-full-access`**：没有沙箱保护，仅用于 disposable checkout 或容器。
- **持久 PTY**：bash 状态跨命令保持（`cd` 后 pwd 仍在新目录），5 分钟 timeout。
- **`maxTokensAsSuccess: false`**：token 限制的 turn 报错而不软成功。

## 源码入口

| 路径 | 角色 |
|------|------|
| `examples/jsonrpc-agent/minimal.cordis.yml` | 极简组合定义 |
| `examples/jsonrpc-agent/minimal.py` | Python SDK 运行脚本 |
| `scripts/smoke-python-runtime.py` | smoke 测试（含 `minimal/model-visible.json` 快照） |
| `python/development.md` | 开发说明 |
| `_digested/surfaces/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证对照 |
