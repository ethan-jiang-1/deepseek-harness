# sdk-minimal — JSON-RPC 极简变体

## 一句话

`sdk-minimal` 是 SDK 的极简版本，工具面大幅收窄，用于 Python SDK 的捆绑单文件运行时（`dsh --profile sdk-minimal`）。模型看到**三个工具**：一个由平台选定的持久 shell（非 win32 → `persistent-bash`；win32 → `persistent-pwsh`）、`read_image`、`working_directory`；没有 subagent、skill、todo、web search。

## 怎么跑

```sh
# Python SDK 捆绑运行时的 keyless smoke（python/development.md:32-35）
uv run --project python/sdk python scripts/smoke-python-runtime.py \
  --scenario sdk-minimal --exe dist-exe/deepseek-harness-sdk-runtime-macos-arm64

# 直接通过 profile
dsh --profile sdk-minimal
```

`sdk-minimal` 是 `PROFILE_TEMPLATES` 中的一个名字（只挂 `@deepseek-ai/dsh-sdk-minimal` 一个 bundle，`packages/boot/app-boot/src/profile.ts:192-194`）。它是唯一**不叠 `dsh-base`** 的 profile：`dsh-sdk-minimal` bundle 的 `cordis.patch.yml` 是一个 `insert`，自己持有完整（虽已收窄）的工具树。0011 起这棵树重新挂上了受限文件面与目录上下文（`filesystem`、`attachment-local`、只开 `read_image` 的 `tool-fs`、`working-directory` / `tool-working-directory`、`token-meter`、`compaction-basic`、`image-offload`、`mcp-resources`），同时删掉五个 invariant 行。

## 组合构成

`dsh-sdk-minimal` bundle 的 `cordis.patch.yml` 是完整的 standalone 组合，按文件顺序：

| id | 插件 | 行 | 作用 |
|----|------|----|------|
| `sdk-app-startup` | `@deepseek-ai/dsh-sdk-app` | `:6-9` | 带 `config: { profile: sdk-minimal }`；该 config 只用于 `dsh --profile <name> --help` 的命令语法渲染 |
| `sdk-jsonrpc-server` | `@deepseek-ai/dsh-sdk-jsonrpc-server` | `:11-15` | JSON-RPC 协议处理器，`maxTokensAsSuccess: false` |
| `llm-deepseek` | `@deepseek-ai/dsh-llm-deepseek` | `:26-31` | LLM 适配器，实配 `apiKeyEnv: DEEPSEEK_API_KEY`、`defaultContextWindow`（`DSH_CONTEXT_WINDOW`）、`streamIdleTimeoutMs: 172800000`；模型选择不在 bundle——Python 示例脚本把它作 `--model` 默认值（`python/sdk/examples/minimal.py:27`） |
| `deepseek-llm-api-extensions` / `session-log-deepseek` / `plugin-package-inventory-deepseek` | `@deepseek-ai/dsh-deepseek-llm-api-extensions` / `@deepseek-ai/dsh-session-log-deepseek` / `@deepseek-ai/dsh-plugin-package-inventory-deepseek` | `:17-18`、`:20-21`、`:23-24` | DeepSeek 专属的请求扩展、会话日志元数据与插件清单行，只在这份独立树里显式自持 |
| `sandbox` | `@deepseek-ai/dsh-sandbox-local` | `:33-34` | 沙箱 |
| `filesystem` / `attachment-local` / `tool-fs` | `@deepseek-ai/dsh-fs-local` / `@deepseek-ai/dsh-attachment-local` / `@deepseek-ai/dsh-tool-fs` | `:38-39`、`:41-42`、`:44-50` | 0011 新增：受限文件服务 + attachment store + 只暴露 `read_image` 的 tool-fs（`read` / `write` / `edit` 均为 `false`，`readImage: true`） |
| `working-directory` / `tool-working-directory` | `@deepseek-ai/dsh-working-directory` / `@deepseek-ai/dsh-tool-working-directory` | `:52-53`、`:55-56` | 0011 新增：新 seam `ctx.workingDirectory` 与 `working_directory` 工具（`Session.header.cwd` 只留原始项目身份） |
| `session-projection` | `@deepseek-ai/dsh-session-projection` | `:58-59` | 共享投影注册表（早于本跨度，OLD 基线里已有且逐字相同），`sandbox-policy` 与 `terminal-bash` 通过它的 units 折叠 sandbox-mode 状态，并把它作为硬注入 |
| `token-meter` / `compaction-basic` / `image-offload` | `@deepseek-ai/dsh-token-meter` / `@deepseek-ai/dsh-compaction-basic` / `@deepseek-ai/dsh-compaction-image-offload` | `:61-62`、`:64-65`、`:67-68` | 0011 新增：token 计量、基础压缩与图像卸载 |
| `sandbox-policy` | `@deepseek-ai/dsh-sandbox-policy` | `:70-74` | `mode: danger-full-access`、`workspaceRoot: !!js process.cwd()` |
| `subprocess` | `@deepseek-ai/dsh-subprocess-local` | `:76-77` | 子进程管理 |
| `pty` | `@deepseek-ai/dsh-terminal` | `:79-80` | 持久 PTY |
| `terminal-bash` / `terminal-pwsh` | `@deepseek-ai/dsh-terminal-bash` | `:82-86`、`:88-93` | win32 平台孪生行：`disabled: !!js process.platform === 'win32'` / `!== 'win32'`，各带 `timeoutMs: 300000`（pwsh 侧另有 `shellDialect: pwsh`） |
| 内核块 | 见下 | `:95-138` | `timer`、`llm`、`session`、`session-title`、`system-prompt`、`tools`、`mcp-resources`、`agent`、`llm-retry`、`jobs`、`agent-loop`（`invariants` / `session-invariant` / `agent-invariant` / `scope-invariant` / `agent-loop-invariant` 五行 0011 随运行时 invariant 机制整族退役删除，无继任） |
| `persistent-bash` | `@deepseek-ai/dsh-tool-bash-persistent` | `:140-152` | 非 win32 的持久 bash shell（5 分钟 timeout，状态跨命令保持） |
| `persistent-pwsh` | `@deepseek-ai/dsh-tool-pwsh-persistent` | `:154-166` | win32 的持久 PowerShell（5 分钟 timeout） |
| `sessions` | `@deepseek-ai/dsh-session-persistence-jsonl` | `:168-172` | JSONL 持久化，`compression: none` |

两处 `description` 里的网络说明不一致：bash 侧写的是「Network access depends on the task environment. Prefer configured mirrors/proxies when they are available.」（`:148`，0008 跨度内从「无互联网，有 apt/pip 镜像」改过来），pwsh 侧仍写「You don't have access to the internet via this tool.」（`:162`，未同步改写）。

`tool-str-replace-editor` 与 `fs-local` 两行曾在 **0008 跨度（`a66e470204` → `183f08e9c6`）内**从这份组合里删除——OLD 基线（`0.1.2-rc.1`）里它们分别是 `a66e470204:packages/bundle/sdk-minimal/cordis.patch.yml:159-160` 与 `a66e470204:packages/bundle/sdk-minimal/cordis.patch.yml:68-69`。`package.json` 依赖同步去掉了 `@deepseek-ai/dsh-tool-str-replace-editor` 与 `@deepseek-ai/dsh-fs-local`：编辑器提供第二个文件改写接口、并把完整 schema 塞进每次 minimal 请求，而 shell 已经能查文件、改文件；`fs-local` 则没有任何 minimal 行消费它（依据归档 note [`2026-09-03-minimal-profiles-persistent-shell-only`](../../.agents/notes/archived/simplification/2026-09-03-minimal-profiles-persistent-shell-only.md)）。**0011 把 `fs-local` 以 `filesystem` 行重新挂回**：目录上下文收编后 `working-directory` 与只开 `read_image` 的 `tool-fs` 需要受限文件服务与 attachment store；`tool-str-replace-editor` 至今没有任何 minimal 行重新引入。

## 与 sdk 的差异

| 维度 | sdk | sdk-minimal |
|------|-----|-------------|
| `maxTokensAsSuccess` | `true`（环境变量控制） | `false` |
| `tool-bash` | 普通 foreground bash | 平台选定的持久 shell（PTY，5 分钟） |
| 模型可见工具数 | base 的完整工具面 | **3 个**（`bash` 或 `pwsh` + `read_image` + `working_directory`；0011 前是 1 个） |
| `tool-fs` | `read` / `write` / `edit` 完整工具 + `tool-fs-search` | 有行但只开 `readImage`（`read` / `write` / `edit` 均为 `false`），即只暴露 `read_image`；文本读写一律走 shell |
| `str_replace_editor` | **无**（base 在 0008 跨度下线该行；要它必须显式 `insert`） | **无**（同上） |
| 文件系统服务 | 有（base 的 `fs-sandbox`、`fs-observation-policy`） | 有 `filesystem`（`fs-local`）与 `attachment-local`，但没有 `fs-sandbox` / `fs-observation-policy` 这两层策略 |
| `subagent` | 有 | **无** |
| `tool-todo` | 有 | **无** |
| `compaction` | `compaction-basic` | 有 `compaction-basic` + `image-offload`（0011 前无） |
| `sandbox` 策略 | 有（sdk 继承 base：sandbox-policy 默认 `workspace-write`） | `danger-full-access`（0011 起同时挂 `fs-local` 作受限文件服务） |
| `session-checkpoint` | 有 | **无** |
| `token-meter` | 有 | 有（0011 前无） |
| 系统提示词 | 只有 `personaPrefix`（0011 起 shipped 组合一律不设 `personaSuffix`） | 只有 `personaPrefix`，`DSH_SYSTEM_PROMPT` 覆盖，缺省 `"You are a helpful software engineer assistant."`；不设 suffix |
| `includeHarnessIdentity` | 默认 true | `false` |
| `includeRuntimeContext` | 默认 true | `false` |

## 独特之处

- **Python SDK 捆绑运行时的默认组合**：`scripts/smoke-python-runtime.py` 的 `sdk-minimal` 场景把 model-visible 输出钉在 `scripts/snapshots/python-sdk-single-exe/minimal/model-visible.json`（win32 对应 `minimal/win-x64/model-visible.json`）。0011 重录后 Linux/macOS 三条请求各广告 `bash`、`read_image`、`working_directory` 三个工具，win-x64 各广告 `pwsh`、`read_image`、`working_directory`；系统段仍只有 `You are a helpful software engineer assistant.`（rc.1 那次重录是单工具 schema）。
- **工具面最窄的 Profile**：模型只看到一个平台选定的持久 shell，加上 `read_image` 与 `working_directory` 两个不带文件改写权的工具。
- **`danger-full-access`**：没有沙箱保护，仅用于 disposable checkout 或容器。`workspaceRoot: !!js process.cwd()` 仍成立——它只是 sandbox-policy 的根；0011 起 `filesystem`（`fs-local`）重新在树里，但仍没有文件改写工具，也没有 `fs-sandbox` / `fs-observation-policy` 策略层。
- **持久 PTY**：bash / pwsh 状态跨命令保持（`cd` 后 pwd 仍在新目录），5 分钟 timeout。
- **`maxTokensAsSuccess: false`**：token 限制的 turn 报错而不软成功。
- **内核行显式化**：不像 base-backed profile 那样靠 `dsh-base` 提供 `timer` / `llm` / `session` / `agent` / `agent-loop` 等服务行，这份组合逐行自持（`:95-138`），只省略它不用的可选 producer。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/bundle/sdk-minimal/cordis.patch.yml` | 极简组合定义 |
| `packages/bundle/sdk-minimal/package.json` | 依赖清单（0008 跨度去掉 `dsh-fs-local` / `dsh-tool-str-replace-editor`；0011 重新加回 `dsh-fs-local`、`dsh-attachment-local`、`dsh-tool-fs`、`dsh-working-directory`、`dsh-tool-working-directory`、`dsh-token-meter`、`dsh-compaction-basic`、`dsh-compaction-image-offload`、`dsh-mcp-resources`） |
| `packages/bundle/sdk-app/src/index.ts` | `sdk-app-startup` 的 `profile` config 与 `--help` 命令语法 |
| `packages/boot/app-boot/src/profile.ts` | `PROFILE_TEMPLATES['sdk-minimal']` |
| `scripts/smoke-python-runtime.py` | smoke 测试（含 `minimal/model-visible.json` 快照） |
| `scripts/snapshots/python-sdk-single-exe/minimal/` | model-visible 快照（0011 起每请求三个工具；含 `win-x64/`） |
| `python/development.md` | 开发说明 |
| `_digested/surfaces-entrypoints/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证对照 |

依据 note（0011 起全部在 `archived/`）：[`2026-09-03-minimal-profiles-persistent-shell-only`](../../.agents/notes/archived/simplification/2026-09-03-minimal-profiles-persistent-shell-only.md)、[`2026-09-05-base-default-file-editor`](../../.agents/notes/archived/simplification/2026-09-05-base-default-file-editor.md)、[`2026-08-11-minimal-profiles-bare-two-tool-runtime`](../../.agents/notes/archived/feature/2026-08-11-minimal-profiles-bare-two-tool-runtime.md)；[`2026-08-24-standalone-sdk-minimal-profile`](../../.agents/notes/archived/architecture/2026-08-24-standalone-sdk-minimal-profile.md) 与 [`2026-08-23-python-sdk-dsh-profile-runtime`](../../.agents/notes/archived/architecture/2026-08-23-python-sdk-dsh-profile-runtime.md) 同样只作历史。0011 的目录上下文收编见升级指南 [`working-directory`](../../docs/upgrade-guide/v0.2.1-alpha.1/working-directory/guide.md)。
