# Runtime Profiles · 运行时配置

## 一句话

Runtime Profile 决定一个 `dsh` 进程**启动时装入什么**：浏览器应用、一次性无界面任务、JSON-RPC 服务、极简 SDK 还是自动化 ACP 服务。会话存在哪里、用哪个模型、是否接沙箱和审批，也在这里定下来。

这是**进程级的宿主形态**，不是某个会话的工具开关。同一个 Web 进程可以承载多个 Session，每个 Session 自己选 Agent Preset；Profile 只管这棵进程插件树最初长什么样。

## 五个宿主形态

ruofei 文章列了 5 个 Runtime Profile，但它们在代码里分属两种不同的机制——**真正的 profile 目录**（走 launcher 的 bundle 层叠）和**独立 app 二进制**（加载外部 `cordis.yml`）。表格把它们放在一起是因为概念上它们都回答「进程启动时装入什么」。

| 名称 | 是什么 | 命令 / Bin | 启动机制 | stdout 给谁 | 进程常驻？ |
|------|--------|------------|----------|------------|-----------|
| **web** | 浏览器 GUI + HTTP 服务 | `dsh --profile web` | profile 目录 + bundle 层叠 | 用户终端 | 常驻 |
| **headless** | 一次性 CLI 任务 | `dsh --profile headless "task"` | profile 目录 + bundle 层叠 | 用户终端 | 回答完退出 |
| **sdk** | JSON-RPC SDK 服务 | `dsh-jsonrpc-agent ./cordis.yml` | 独立 bin + 外部 `cordis.yml` | JSON-RPC 协议帧 | 常驻 |
| **sdk-minimal** | JSON-RPC · 工具面收窄 | 同上，换 `minimal.cordis.yml` | 独立 bin + 外部 `cordis.yml` | JSON-RPC 协议帧 | 常驻 |
| **acp** | Agent Client Protocol 服务 | `dsh-acp-demo --config ./cordis.yml` | 独立 bin + 外部 `cordis.yml` | ACP 协议帧 | 常驻 |

### 哪几个是真正的 profile 目录

源码 `PROFILE_TEMPLATES`（`packages/boot/app-boot/src/profile.ts:114`）只登记了 web 和 headless：

```ts
web:     ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']
headless: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless']
```

- **web** 和 **headless** 是「launcher profile」：`dsh --profile <name>` 自动初始化 `$DSH_HOME/profiles/<name>/`，有 `package.json`、`cordis.patch.yml`、`pnpm-workspace.yaml`。用户可以用 `dsh plugin --profile <name> add` 加 bundle。启动时叠 bundle patch 层 → 用户 patch → 命令行 patch。
- **sdk**、**sdk-minimal**、**acp** 是**独立 app 二进制**，载入自己持有的 `cordis.yml`。它们没有 `$DSH_HOME/profiles/<name>` 目录，不走 launcher 的 profile 组合路径，没有 bundle 层叠机制。ruofei 把它们统称 Runtime Profile，是从「可运行的宿主形态」这个概念层次说的，不是代码里的 `PROFILE_TEMPLATES`。

## 共同基底

所有 5 个宿主形态共享同一套**底层运行时概念和能力**，但不是同一份 bundle 代码：

| 领域 | 概念级共同能力 | web/headless 的来源 | sdk/acp 的来源 |
|------|---------------|-------------------|---------------|
| LLM 运行时 | 模型适配器、重试 | `dsh-base` 的 `llm`, `llm-deepseek`, `llm-retry` | `dsh-agent-spine-demo` 的 `LlmRuntime` + 自己声明 `llm-deepseek` |
| 会话 | 事件日志、持久化、投影 | `dsh-base` 的 `session`, `session-persistence-jsonl`, `session-projection` | `dsh-agent-spine-demo` 的 `SessionStore` + 自己声明 `session-persistence-jsonl` |
| Agent 核心 | 注册表、loop、提示词 | `dsh-base` 的 `agent`, `agent-loop`, `system-prompt` | `dsh-agent-spine-demo` 的 `AgentRegistry`, `AgentLoop`, `SystemPrompt` |
| 工具管线 | 注册、执行、审批 | `dsh-base` 的 `tools`, `tool-*` | `dsh-agent-spine-demo` 的 `ToolRuntime` + 自己声明 `tool-*` |
| 沙箱与策略 | 文件系统策略、弹窗审批 | `dsh-base` 的 `sandbox`, `sandbox-policy`, `approval` | sdk 不用沙箱（直接 `fs-local`）；acp 通过 `dsh-agent-spine-demo` 可配 |
| 子进程 | 进程树管理 | `dsh-base` 的 `subprocess` | `dsh-agent-spine-demo` 的 `subprocess` 或自己声明 |
| 子 agent | 后台 / fork 子 agent | `dsh-base` 的 `subagent`, `tool-subagent` | sdk 有 `subagent`；sdk-minimal 无；acp 通过 `dsh-agent-spine-demo` 可配 |
| Goal | 持久完成目标 | `dsh-base` 的 `goal`, `goal-round-driver`, `tool-goal` | sdk 无；acp 通过 `dsh-agent-spine-demo` 可配 |
| 文件系统 | 受限文件访问 | `dsh-base` 的 `fs-sandbox`, `fs-observation-policy` | 各自己声明 `fs-local` 或 `fs-sandbox` |

**进程级重用**：五个入口都通过 `ctx.agents` 驱动 agent，从 `session/event` 渲染或投影。不是五套 Agent 实现。

### 只有 web/headless 有的 bundle 层叠

launcher profile 的层叠顺序：

```
空 entry list
  + 每个 bundle 的 cordis.patch.yml（profile 里写的顺序）
  + 该 profile 的 cordis.patch.yml
  + Harness home 的 cordis.patch.yml
  + 命令行 --patch
```

sdk 和 acp 不走这个路径。它们由 `boot()` 直接加载单层 `cordis.yml`，没有 bundle 叠加、没有 profile 目录、没有 `dsh plugin` 管理。

## 决定 Profile 差异的三条轴

### 1. 进程生命周期

| Profile | 生命周期 |
|---------|---------|
| web | 常驻 HTTP 服务，等 browser 连接和关闭 |
| headless | 回答一条任务，打印最终消息，exit 0 |
| sdk / sdk-minimal | 常驻 stdio JSON-RPC 服务，`shutdown` 请求 exit 0 |
| acp | 常驻 stdio ACP 服务，stdin end 或 dispose exit 0 |

### 2. stdout 的归属

stdout 给谁，决定了能不能装 logger、能不能写 HMR 信息：

| Profile | stdout 用途 | 是否能装 logger |
|---------|------------|---------------|
| web | 用户可见（启动 URL、日志） | 可以 |
| headless | 最终 assistant 回复 | 可以（结束后退出） |
| sdk / sdk-minimal | JSON-RPC 协议帧，纯数据管道 | **不能**装 stdout logger，否则污染协议 |
| acp | ACP 协议帧，纯数据管道 | **不能**装 stdout logger |

### 3. 运行时 patch 重载（HMR）

| Profile | 运行时 patch 重载 |
|---------|-----------------|
| web | **支持**（`composeLive` 夹住用户层，候选失败保留上一棵好树） |
| headless | startup-only（一次性任务，重载无意义） |
| sdk / sdk-minimal | startup-only（协议已开始，重载打散生命周期） |
| acp | startup-only（同 SDK） |

ruofei 文章原话：「`headless`、`sdk`、`sdk-minimal` 和 `acp` 只在启动时应用一次。」

## 各 Profile 的独有插件

| Profile | 独有插件 / bundle |
|---------|------------------|
| **web** | `dsh-web-app` bundle：webserver、client-*（浏览器壳、wire、slots、ui-*、connection）、storage、workspace、host 工具（apiproxy、host-runner、plugin-inventory）、agent-presets |
| **headless** | `dsh-headless` bundle：`headless-startup`（命令行解析）、`headless-runner`（驱动任务、打印结果） |
| **sdk** | `@deepseek-ai/dsh-sdk-jsonrpc-server`：JSON-RPC 协议处理器、`inject: ['agents']`、get-or-create agent 按 sessionId |
| **sdk-minimal** | 同 SDK server + 工具面大幅收窄：只有 persistent bash + str_replace_editor；无 subagent、todo、tool-fs、compaction、web search |
| **acp** | `@deepseek-ai/dsh-acp`：ACP 协议处理器（`AgentSideConnection`）、`inject: ['agents']`、session/new 创建 agent、session/prompt 等到 idle 才返回 |

## 阅读路径

如果对「一个进程怎么启动」还不太清楚，先读 `composition/00-map.md`。如果想知道 ACP 和 SDK 协议的具体保证，然后读 `surfaces/02-acp与jsonrpc.md`。下面每个文件的正文深入 Profile 各自的机制。

| 文件 | 内容 |
|------|------|
| [`01-web.md`](./01-web.md) | web profile：浏览器 GUI、HTTP 服务、browser client |
| [`02-headless.md`](./02-headless.md) | headless profile：一次性 CLI 任务 |
| [`03-sdk.md`](./03-sdk.md) | SDK profile：JSON-RPC 服务 |
| [`04-sdk-minimal.md`](./04-sdk-minimal.md) | SDK minimal 变体：工具面收窄 |
| [`05-acp.md`](./05-acp.md) | ACP profile：自动化协议服务 |

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/boot/app-boot/src/profile.ts` | `PROFILE_TEMPLATES`、`initProfile`、`loadProfile`、launcher 层的 profile 发现 |
| `packages/bundle/base/cordis.patch.yml` | web/headless 共有的核心插件清单（451 行） |
| `packages/bundle/web-app/cordis.patch.yml` | web 特有的 browser + host 插件、agent-plane 行 disable |
| `packages/bundle/headless/cordis.patch.yml` | headless 特有的 task runner |
| `packages/sdk/server/src/index.ts` | JSON-RPC SDK server 插件 |
| `packages/acp/acp/src/index.ts` | ACP 桥插件 |
| `examples/jsonrpc-agent/cordis.yml` | sdk 的完整组合示例 |
| `examples/jsonrpc-agent/minimal.cordis.yml` | sdk-minimal 组合示例 |
| `packages/examples/acp-demo/src/index.ts` | ACP demo 组合插件 |
| `_digested/composition/00-map.md` | 启动组合机制（profile 目录、bundle 层叠） |
| `_digested/surfaces/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证对照 |
