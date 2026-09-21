# Runtime Profiles · 运行时配置

产品源码基线：`fb2c4b9e69`（`dsh-v0.1.5-rc.2`）；本专题结论与该 commit 的项目树一致，跨度对照的 OLD 侧为 `a66e470204`（`0.1.2-rc.1`），`rc.1` → `rc.2` 的增量见 [`_change_log/0007`](../_change_log/0007-0.1.5-rc.1-to-0.1.5-rc.2.md)。

## 一句话

Runtime Profile 决定一个 `dsh` 进程**启动时装入什么**：浏览器应用、一次性无界面任务、JSON-RPC 服务、极简 SDK 还是自动化 ACP 服务。会话存在哪里、用哪个模型、是否接沙箱和审批，也在这里定下来。

这是**进程级的宿主形态**，不是某个会话的工具开关。同一个 Web 进程可以承载多个 Session，每个 Session 自己选 Agent Preset；Profile 只管这棵进程插件树最初长什么样。

下面五个是 **launcher profile**（`dsh --profile <name>`）。此外还有一个**应用自有 profile**（Electron 的 `desktop`），组合方式同源但装载路径不同，见「应用自有 profile」一节与 [`06-desktop.md`](./06-desktop.md)。

## 五个宿主形态

ruofei 文章列了 5 个 Runtime Profile。**它们都是 launcher profile**（`dsh --profile <name>`），统一走 bundle 层叠路径。`PROFILE_TEMPLATES`（`packages/boot/app-boot/src/profile.ts:110-131`）登记：

```ts
web:       ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']
headless:  ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless']
sdk:       ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-sdk-app']
sdk-minimal: ['@deepseek-ai/dsh-sdk-minimal']  // 独立树，不叠 base
acp:       ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-acp-app']
```

rc.1 没有增删任何模板、也没有改名：新增的是从模板派生自定义 profile 的 `dsh --from-default-profile <模板>`（[`../composition/04-profile-创建与保留名.md`](../composition/04-profile-创建与保留名.md)），以及被 Electron 保留、CLI 一律拒绝的 `desktop` 名。

| 名称 | 是什么 | 命令 | 启动机制 | stdout | 进程常驻？ |
|------|--------|------|----------|--------|-----------|
| **web** | 浏览器 GUI + HTTP 服务 | `dsh --profile web` | profile 目录 + bundle 层叠 | 用户终端 | 常驻 |
| **headless** | 一次性 CLI 任务 | `dsh --profile headless "task"` | profile 目录 + bundle 层叠 | 用户终端 | 回答完退出 |
| **sdk** | JSON-RPC SDK 服务 | `dsh --profile sdk` | profile 目录 + bundle 层叠 | JSON-RPC 帧 | 常驻 |
| **sdk-minimal** | JSON-RPC · 工具面收窄 | `dsh --profile sdk-minimal` | profile 目录 + bundle 层叠 | JSON-RPC 帧 | 常驻 |
| **acp** | Agent Client Protocol 服务 | `dsh --profile acp` | profile 目录 + bundle 层叠 | ACP 帧 | 常驻 |

> **历史背景**：在 `0.1.2-alpha.1`（#3248）之前，sdk 和 acp 走独立 app 二进制（`dsh-jsonrpc-agent`、`dsh-acp-demo`），不经过 launcher profile（`dsh-v0.1.1-rc.2:packages/examples/jsonrpc-demo/package.json:16`、`dsh-v0.1.1-rc.2:packages/examples/acp-demo/package.json:16`，两个目录在 `fb2c4b9e69` 已不存在）。从 `0.1.2-alpha.1` 起它们被统一到 `dsh --profile <name>`。旧二进制不再存在；SDK 最小示例使用 `sdk-minimal` profile。所有 profile 现在共享同一套 bundle 层叠、profile 目录、`dsh plugin` 管理等基础设施。

## 共同基底

所有 5 个宿主形态共享 `dsh-base` 或其等效层

| 领域 | 概念级共同能力 | 来源 |
|------|---------------|------|
| LLM 运行时 | 模型适配器、重试 | `dsh-base` 的 `llm`、`llm-deepseek`、`llm-retry` |
| 会话 | 事件日志、持久化、投影 | `dsh-base` 的 `session`、`session-persistence-jsonl`、`session-projection` |
| Agent 核心 | 注册表、loop、提示词 | `dsh-base` 的 `agent`、`agent-loop`、`system-prompt` |
| 工具管线 | 注册、执行、审批 | `dsh-base` 的 `tools`、`tool-*` |
| 沙箱与策略 | 文件系统策略、弹窗审批 | `dsh-base` 的 `sandbox`、`sandbox-policy`、`approval`（sdk-minimal 的 sandbox 策略为 `danger-full-access`，不挂 `fs-local` 与 `approval`，见 [`04-sdk-minimal.md`](./04-sdk-minimal.md)） |
| 子进程 | 进程树管理 | `dsh-base` 的 `subprocess` |
| 子 agent | 后台 / fork 子 agent | `dsh-base` 的 `subagent`、`tool-subagent`（sdk-minimal 无） |
| Goal | 持久完成目标 | `dsh-base` 的 `goal`、`goal-round-driver`、`tool-goal`（sdk 继承 base；仅 sdk-minimal 无） |
| 文件系统 | 受限文件访问 | `dsh-base` 的 `fs-sandbox`、`fs-observation-policy` |

**消息通道**：子代理回传统一为 settle notice + `send_message` steer，fork continuable 没有 child-only section 的 KV 前缀代价——这两条都早于本跨度基线（`a66e470204` 里 `tool-subagent-report` 已不存在，`tool-subagent-fork` 注释已是「preset 层可选 continuable，无需 child-only section」），不是 rc.1 周期内的变化。

**进程级重用**：五个入口都通过 `ctx.agents` 驱动 agent，从 `session/event` 渲染或投影。不是五套 Agent 实现。

### Bundle 层叠（所有 profile 共享）

```text
空 entry list
  + 每个 bundle 的 cordis.patch.yml（profile 里写的顺序）
  + 该 profile 的 cordis.patch.yml
  + Harness home 的 cordis.patch.yml
  + 命令行 --patch
```

## 应用自有 profile

launcher profile 住在 Harness home，由 `loadProfile` 经 `$DSH_HOME/profiles/<name>` 发现并做 shipped 归一化。rc.1 起还有第二种所有者：**应用自己持有的 profile 目录**，用 `loadProfileDirectory(binName, dir, installAnchor, options)`（`packages/boot/app-boot/src/profile.ts:774-804`）直接装载一个**已初始化的绝对目录**——不经过 Harness home 发现、不做 shipped 归一化、也不认 `PROFILE_TEMPLATES`。`loadProfile` 现在只是「解析目录 → `normalizeShippedProfile` → `loadProfileDirectory`」（`:820-836`）。导出见 `packages/boot/app-boot/src/index.ts:37`。

目前的唯一实例是 Electron 的 `desktop`：`$DSH_HOME/profiles/desktop` 这个路径**仍然**在 Harness home 下、仍然叫 `profiles/<name>`，但没有 CLI 能打开它——`desktop` 不是 `PROFILE_TEMPLATES` 成员，CLI 的 boot / dump / `plugin` 三条入口都被 `rejectElectronProfile` 拒绝。它由 `apps/desktop-host/` 自己用 `loadProfileDirectory` 装载，再叠自己打包的覆盖层，最后自己调 `boot()`，不走 `runProfile`。

组合本身与 web 同源（`dsh-base` + `dsh-web-app`），差异全在那层应用私有 overlay 上：disable 掉所有监听端口与浏览器启动相关行，换成 Electron 的目录选择与封装传输。细节见 [`06-desktop.md`](./06-desktop.md)。

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
| **web** | `dsh-web-app` bundle：webserver、web-runtime、client-*（浏览器壳、wire、slots、ui-*）、session-controller 等 Remote 控制器、directory-picker、plugin-inventory、agent-presets（storage/sandbox/typert-gateway 等基础设施在 base）。本次跨度新增 8 条 insert 行：`open-in-app` / `ui-open-in-app` / `workspace-files`（基础设施）、`file-upload`（传输）、`resources` / `ui-sidebar-right` / `ui-sidebar-documentpreview` / `ui-sidebar-files`（浏览器罗盘），详见 [`01-web.md`](./01-web.md) |
| **headless** | `dsh-headless` bundle：`headless-startup`（命令行解析）、`headless-runner`（驱动任务、打印结果） |
| **sdk** | `dsh-sdk-app` bundle：base + 薄协议层（persona override + `sdk-app-startup`（带 `config.profile: sdk`）+ `sdk-jsonrpc-server`，`inject: [sdkAppStartup, loader]`）；工具面**不收窄**，继承 base |
| **sdk-minimal** | `dsh-sdk-minimal` bundle：独立树不叠 base——工具面收窄到**平台选定的一个持久 shell**（非 win32 `persistent-bash` / win32 `persistent-pwsh`）；无 subagent、todo、compaction、web search，也没有任何文件系统工具或服务 |
| **acp** | `dsh-acp-app` bundle：base + 薄自动化层（persona override + `acp-app-startup` + `acp`，`inject: [acpAppStartup]`）；持久化/检查点/查询在 base，不自持 |

共同点变更：base 的默认编辑器面是 `read` / `write` / `edit`（`tool-fs`），`tool-str-replace-editor` 在**本次跨度（`a66e470204` → `183f08e9c6`）内**从全仓 shipped bundle 下线（OLD 基线里 base 仍有该行，`a66e470204:packages/bundle/base/cordis.patch.yml:424-425`；同一提交 `36a4665144` 也删掉了 sdk-app 与 web-app 的对应行）——包还在，但任何 profile 想要 `str_replace_editor` 都必须显式 `insert`（仓库里现存的显式例子是 `snapshots/sdk/persistent-tools/cordis.yml:6-7`）。各 bundle 的 `system-prompt` 也在本次跨度内从单个 `persona` 字段拆成 `personaPrefix`（模型介绍，section 序 0）+ `personaSuffix`（`Your working directory is {{cwd}}.`，`deployment:persona-suffix`，序 10200）两段（`packages/core/system-prompt/src/index.ts:174`、`:177`、`:251`、`:256`；拆分的 `40792330c0` 是 NEW 的祖先、不是 OLD 的祖先）——拆分的目的是把 cwd 这类随机器变化的文本挪到 first-party 复用指令之后、保持 prompt 前缀稳定，不是同义改写（依据 note [`2026-09-06-environment-prompt-suffix`](../../.agents/notes/implemented/bug-fix/2026-09-06-environment-prompt-suffix.md)）。

## 阅读路径

如果对「一个进程怎么启动」还不太清楚，先读 `composition/00-map.md`。如果想知道 ACP 和 SDK 协议的具体保证，然后读 `surfaces/02-acp与jsonrpc.md`。下面每个文件的正文深入 Profile 各自的机制。

| 文件 | 内容 |
|------|------|
| [`01-web.md`](./01-web.md) | web profile：浏览器 GUI、HTTP 服务、browser client |
| [`02-headless.md`](./02-headless.md) | headless profile：一次性 CLI 任务 |
| [`03-sdk.md`](./03-sdk.md) | SDK profile：JSON-RPC 服务 |
| [`04-sdk-minimal.md`](./04-sdk-minimal.md) | SDK minimal 变体：工具面收窄 |
| [`05-acp.md`](./05-acp.md) | ACP profile：自动化协议服务 |
| [`06-desktop.md`](./06-desktop.md) | desktop：Electron 应用自有 profile（第五个 base-backed bundle 组合，CLI 不可达） |

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/boot/app-boot/src/profile.ts` | `PROFILE_TEMPLATES`、`initProfile`、`loadProfile`、`loadProfileDirectory`、launcher 层的 profile 发现 |
| `packages/util/package-manifest/` | `DshManifest`、`DshBundleManifest`、`ProfilePatchReload` 等 manifest 类型（本次跨度从 `app-boot` 迁出） |
| `packages/util/http-proxy/` | `installProxyFromEnvironment`：launcher 在任何行 mount 之前装的进程级出网代理 |
| `packages/bundle/base/cordis.patch.yml` | 所有 launcher profile（除 sdk-minimal 外）共有的核心插件清单 |
| `packages/bundle/web-app/cordis.patch.yml` | web 特有的 browser + host 插件 |
| `packages/bundle/headless/cordis.patch.yml` | headless 特有的 task runner |
| `packages/bundle/sdk-app/cordis.patch.yml` | SDK JSON-RPC 协议层 |
| `packages/bundle/sdk-app/src/index.ts` | `sdk-app-startup` 的 `profile` config（只用于 `--help` 命令语法渲染） |
| `packages/bundle/sdk-minimal/cordis.patch.yml` | SDK 最小化 bundle（独立树） |
| `packages/bundle/acp-app/cordis.patch.yml` | ACP 协议层 |
| `packages/sdk/server/src/index.ts` | JSON-RPC SDK server 插件 |
| `packages/acp/acp/src/index.ts` | ACP 桥插件 |
| `apps/desktop/`、`apps/desktop-host/` | Electron 桌面应用与应用私有的 profile 装载入口（保留名 `desktop`） |
| `_digested/composition/00-map.md` | 启动组合机制（profile 目录、bundle 层叠） |
| `_digested/composition/04-profile-创建与保留名.md` | profile 创建路径与 `desktop` 保留名 |
| `_digested/surfaces/02-acp与jsonrpc.md` | ACP vs JSON-RPC 协议保证对照 |
