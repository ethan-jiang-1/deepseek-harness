# sdk-minimal — JSON-RPC 极简变体

## 一句话

`sdk-minimal` 是 SDK 的极简版本，工具面大幅收窄，用于 Python SDK 的捆绑单文件运行时（`dsh --profile sdk-minimal`）。模型只看到 persistent bash（win32 为 persistent pwsh），没有 subagent、tool-fs、todo_write、compaction。

## 怎么跑

```sh
# Python SDK 捆绑运行时
python -m dsh run --scenario sdk-minimal --exe dist-exe/deepseek-harness-sdk-runtime-macos-arm64

# 直接通过 profile
dsh --profile sdk-minimal
```

`sdk-minimal` 是 `PROFILE_TEMPLATES` 中的一个名字（只挂 `@deepseek-ai/dsh-sdk-minimal` 一个 bundle）。它是唯一**不叠 `dsh-base`** 的 profile：`dsh-sdk-minimal` bundle 自己持有完整的极简工具树。

## 组合构成

`dsh-sdk-minimal` bundle 的 `cordis.patch.yml` 是完整的 standalone 组合：

| id | 插件 | 作用 |
|----|------|------|
| `sdk-jsonrpc-server` | `@deepseek-ai/dsh-sdk-jsonrpc-server` | JSON-RPC 协议处理器，`maxTokensAsSuccess: false` |
| `llm-deepseek` | `@deepseek-ai/dsh-llm-deepseek` | LLM 适配器，实配 `apiKeyEnv: DEEPSEEK_API_KEY`、`defaultContextWindow`（`DSH_CONTEXT_WINDOW`）、`streamIdleTimeoutMs: 172800000`；模型选择不在 bundle——Python 示例脚本把它作 `--model` 默认值（`python/sdk/examples/minimal.py:27`） |
| `sandbox` | `@deepseek-ai/dsh-sandbox-local` | 沙箱 |
| `sandbox-policy` | `@deepseek-ai/dsh-sandbox-policy` | `mode: danger-full-access` |
| `subprocess` | `@deepseek-ai/dsh-subprocess-local` | 子进程管理 |
| `pty` | `@deepseek-ai/dsh-terminal` | 持久 PTY |
| `terminal-bash` | `@deepseek-ai/dsh-terminal-bash` | 持久 bash（5 分钟 timeout） |
| `terminal-pwsh` / `persistent-pwsh` | `@deepseek-ai/dsh-terminal-bash`（`shellDialect: pwsh`）/ `@deepseek-ai/dsh-tool-pwsh-persistent` | win32 平台孪生行：`disabled: !!js process.platform !== 'win32'`，bash 侧反向 `=== 'win32'` |

以及独有的工具行：

| id | 插件 | 作用 |
|----|------|------|
| `persistent-bash` | `@deepseek-ai/dsh-tool-bash-persistent` | 持久 bash shell（5 分钟 timeout，状态跨命令保持） |
| `sessions` | `@deepseek-ai/dsh-session-persistence-jsonl` | JSONL 持久化，`compression: none` |

## 与 sdk 的差异

| 维度 | sdk | sdk-minimal |
|------|-----|-------------|
| `maxTokensAsSuccess` | `true`（环境变量控制） | `false` |
| `tool-bash` | 普通 foreground bash | persistent bash（PTY，5 分钟） |
| `tool-fs` | `read` / `write` / `edit` 完整工具 | **无** |
| `subagent` | 有 | **无** |
| `tool-todo` | 有 | **无** |
| `compaction` | `compaction-basic` | **无** |
| `sandbox` 策略 | 有（sdk 继承 base：sandbox-policy 默认 `workspace-write`） | `danger-full-access` |
| `session-checkpoint` | 有 | **无** |
| `token-meter` | 有 | **无** |
| 系统提示词 | `"You are a coding agent powered by the {{model}} model. Your working directory is {{cwd}}."` | `DSH_SYSTEM_PROMPT` 覆盖，缺省 `"You are a helpful software engineer assistant."` |
| `includeHarnessIdentity` | 默认 true | `false` |
| `includeRuntimeContext` | 默认 true | `false` |

## 独特之处

- **Python SDK 捆绑运行时的默认组合**：`scripts/smoke-python-runtime.py` 的 `sdk-minimal` 场景把 model-visible 输出钉在 `scripts/snapshots/python-sdk-single-exe/minimal/model-visible.json`。
- **工具面最窄的 Profile**：模型只看到 persistent bash（win32 为 persistent pwsh）一个工具。
- **`danger-full-access`**：没有沙箱保护，仅用于 disposable checkout 或容器。
- **持久 PTY**：bash 状态跨命令保持（`cd` 后 pwd 仍在新目录），5 分钟 timeout。
- **`maxTokensAsSuccess: false`**：token 限制的 turn 报错而不软成功。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/bundle/sdk-minimal/cordis.patch.yml` | 极简组合定义 |
| `scripts/smoke-python-runtime.py` | smoke 测试（含 `minimal/model-visible.json` 快照） |
| `python/development.md` | 开发说明 |
| `_digested/surfaces/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证对照 |
