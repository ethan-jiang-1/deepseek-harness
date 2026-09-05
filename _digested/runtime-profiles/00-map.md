# Runtime Profiles · 运行时配置

## 一句话

Runtime Profile 决定一个 `dsh` 进程**启动时装入什么**：浏览器应用、一次性无界面任务、JSON-RPC 服务、极简 SDK 还是自动化 ACP 服务。会话存在哪里、用哪个模型、是否接沙箱和审批，也在这里定下来。

这是**进程级的宿主形态**，不是某个会话的工具开关。同一个 Web 进程可以承载多个 Session，每个 Session 自己选 Agent Preset；Profile 只管这棵进程插件树最初长什么样。

## 五个宿主形态

ruofei 文章列了 5 个 Runtime Profile。**它们都是 launcher profile**（`dsh --profile <name>`），统一走 bundle 层叠路径。`PROFILE_TEMPLATES`（`packages/boot/app-boot/src/profile.ts`）登记：

```ts
web:       ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']
headless:  ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless']
sdk:       ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-sdk-app']
sdk-minimal: ['@deepseek-ai/dsh-sdk-minimal']  // 独立树，不叠 base
acp:       ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-acp-app']
```

| 名称 | 是什么 | 命令 | 启动机制 | stdout | 进程常驻？ |
|------|--------|------|----------|--------|-----------|
| **web** | 浏览器 GUI + HTTP 服务 | `dsh --profile web` | profile 目录 + bundle 层叠 | 用户终端 | 常驻 |
| **headless** | 一次性 CLI 任务 | `dsh --profile headless "task"` | profile 目录 + bundle 层叠 | 用户终端 | 回答完退出 |
| **sdk** | JSON-RPC SDK 服务 | `dsh --profile sdk` | profile 目录 + bundle 层叠 | JSON-RPC 帧 | 常驻 |
| **sdk-minimal** | JSON-RPC · 工具面收窄 | `dsh --profile sdk-minimal` | profile 目录 + bundle 层叠 | JSON-RPC 帧 | 常驻 |
| **acp** | Agent Client Protocol 服务 | `dsh --profile acp` | profile 目录 + bundle 层叠 | ACP 帧 | 常驻 |

> **历史背景**：在 `0.1.2-alpha.1`（#3248）之前，sdk 和 acp 走独立 app 二进制（`dsh-jsonrpc-agent`、`dsh-acp-demo`），不经过 launcher profile。从 `0.1.2-alpha.1` 起它们被统一到 `dsh --profile <name>`。旧二进制不再存在；SDK 最小示例使用 `sdk-minimal` profile。所有 profile 现在共享同一套 bundle 层叠、profile 目录、`dsh plugin` 管理等基础设施。

## 共同基底

所有 5 个宿主形态共享 `dsh-base` 或其等效层

| 领域 | 概念级共同能力 | 来源 |
|------|---------------|------|
| LLM 运行时 | 模型适配器、重试 | `dsh-base` 的 `llm`、`llm-deepseek`、`llm-retry` |
| 会话 | 事件日志、持久化、投影 | `dsh-base` 的 `session`、`session-persistence-jsonl`、`session-projection` |
| Agent 核心 | 注册表、loop、提示词 | `dsh-base` 的 `agent`、`agent-loop`、`system-prompt` |
| 工具管线 | 注册、执行、审批 | `dsh-base` 的 `tools`、`tool-*` |
| 沙箱与策略 | 文件系统策略、弹窗审批 | `dsh-base` 的 `sandbox`、`sandbox-policy`、`approval`（sdk-minimal 的 sandbox 策略为 `danger-full-access` 且另挂 `fs-local`） |
| 子进程 | 进程树管理 | `dsh-base` 的 `subprocess` |
| 子 agent | 后台 / fork 子 agent | `dsh-base` 的 `subagent`、`tool-subagent`（sdk-minimal 无） |
| Goal | 持久完成目标 | `dsh-base` 的 `goal`、`goal-round-driver`、`tool-goal`（sdk 继承 base；仅 sdk-minimal 无） |
| 文件系统 | 受限文件访问 | `dsh-base` 的 `fs-sandbox`、`fs-observation-policy` |

**消息通道**：rc.1 起子代理回传统一为 settle notice + `send_message` steer（`tool-subagent-report` 已删除）；fork continuable 不再有 child-only section 的 KV 前缀代价。

**进程级重用**：五个入口都通过 `ctx.agents` 驱动 agent，从 `session/event` 渲染或投影。不是五套 Agent 实现。

### Bundle 层叠（所有 profile 共享）

```text
空 entry list
  + 每个 bundle 的 cordis.patch.yml（profile 里写的顺序）
  + 该 profile 的 cordis.patch.yml
  + Harness home 的 cordis.patch.yml
  + 命令行 --patch
```

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
| **web** | `dsh-web-app` bundle：webserver、web-runtime、client-*（浏览器壳、wire、slots、ui-*）、session-controller 等 Remote 控制器、directory-picker、plugin-inventory、agent-presets（storage/sandbox/typert-gateway 等基础设施在 base） |
| **headless** | `dsh-headless` bundle：`headless-startup`（命令行解析）、`headless-runner`（驱动任务、打印结果） |
| **sdk** | `dsh-sdk-app` bundle：base + 薄协议层（persona override + `sdk-app-startup` + `sdk-jsonrpc-server`，`inject: [sdkAppStartup, loader]`）；工具面**不收窄**，继承 base |
| **sdk-minimal** | `dsh-sdk-minimal` bundle：独立树不叠 base——工具面收窄到 persistent bash + str_replace_editor；无 subagent、todo、tool-fs、compaction、web search |
| **acp** | `dsh-acp-app` bundle：base + 薄自动化层（persona override + `acp-app-startup` + `acp`，`inject: [acpAppStartup]`）；持久化/检查点/查询在 base，不自持 |

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
| `packages/bundle/base/cordis.patch.yml` | 所有 launcher profile（除 sdk-minimal 外）共有的核心插件清单 |
| `packages/bundle/web-app/cordis.patch.yml` | web 特有的 browser + host 插件 |
| `packages/bundle/headless/cordis.patch.yml` | headless 特有的 task runner |
| `packages/bundle/sdk-app/cordis.patch.yml` | SDK JSON-RPC 协议层 |
| `packages/bundle/sdk-minimal/cordis.patch.yml` | SDK 最小化 bundle（独立树） |
| `packages/bundle/acp-app/cordis.patch.yml` | ACP 协议层 |
| `packages/sdk/server/src/index.ts` | JSON-RPC SDK server 插件 |
| `packages/acp/acp/src/index.ts` | ACP 桥插件 |
| `packages/examples/acp-demo/src/index.ts` | ACP demo 组合的示例（已不是运行时入口） |
| `packages/examples/jsonrpc-demo/` | 旧 SDK demo（已不是运行时入口） |
| `_digested/composition/00-map.md` | 启动组合机制（profile 目录、bundle 层叠） |
| `_digested/surfaces/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证对照 |
