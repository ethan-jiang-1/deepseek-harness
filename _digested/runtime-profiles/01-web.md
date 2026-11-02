# web — 浏览器 GUI

## 一句话

`dsh --profile web` 启动一个常驻 HTTP 服务，提供完整的浏览器 IDE（会话、聊天、文件、设置、工具栏、插件管理）。是 DSH 产品中最完整的宿主形态。

## 怎么跑

```sh
dsh --profile web
dsh --profile web --port 8080          # 换端口
dsh --profile web --no-open            # 不自动打开浏览器
dsh --profile web --patch my.yml       # 叠加 patch
```

源码启动：`pnpm dsh --profile web`。发行 bin：`dsh web` 是 `--profile web` 的等价形式（help 示例 `apps/cli/src/args.ts:92`）——解析器把首个非 flag、非 `plugin` 的 positional 直通为 `['--profile', ...argv]`（`apps/cli/src/args.ts:206-208`），launcher 父选项与 app 参数按 Commander 常规规则归位（旧 `rejectParentOptions` 拦截已不存在，全仓无此函数；见 [`../plugin-system/composition/04-profile-创建与保留名.md`](../plugin-system/composition/04-profile-创建与保留名.md) 末尾的待判项）。

## Bundle 组合

`PROFILE_TEMPLATES.web` = `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']`

| 层 | 从哪里来 | 作用 |
|----|---------|------|
| `dsh-base` | `packages/bundle/base/` | 所有 profile 共享的核心插件（LLM、session、tools、agent-loop、sandbox、subagent、goal、web 搜索等） |
| `dsh-web-app` | `packages/bundle/web-app/` | Web 特有层：overrides base 行 + 插入 browser client、HTTP server、storage、preset patch（旧 agent-presets 已退役，改为声明式 agent-preset + agent-preset-registry；shipped presets 以 `presets/*.patch.yml` 随 bundle 携带） |

### `dsh-web-app` 的 override 行

| id | 做了什么 |
|----|---------|
| `system-prompt` | 设 persona prefix：`personaPrefix`（`You are a coding agent powered by the {{model}} model.`，`:17-20`）。shipped 组合不设 `personaSuffix`；执行目录由 `ctx.workingDirectory` 供给 |
| `session-query-sqlite` | 设 `:memory:` + `openAt: never`（按需才开 SQLite） |
| `tools` | 透传 `DSH_TOOLS_MODE` 环境变量 |
| `tool-bash`, `tool-pwsh`, `tool-fs`, `tool-skill`, `tool-goal` 等 | **disable** 由会话级 preset 接管的 model-facing 工具行（由 bundle 携带的 preset patch 承担）；`working_directory` 是例外——base 的 `tool-working-directory` 行保留在 host 平面。base 双开 `search`+`fetch`（#3382）后，`tool-web` 的语义是 host 行整行 disable、由 preset 按档位组合两工具（base patch 注释与行，`packages/bundle/base/cordis.patch.yml:454-466,486-490`）；shipped 各 preset 的 `tool-web` 均 `fetch: true`，可作对照 |

web-app 的 disable 名单里**没有** `tool-str-replace-editor`：它和 base 的那一行都不在 shipped bundle 里，web-app 自己的 disable 行也随之删除。

`hmr` 不在上表：web-app 自身没有 `hmr` 行，模块热更新的 disable 来自 base 层（`packages/bundle/base/cordis.patch.yml:27-32`）；Web 的 client 侧热重载由独立的 `client-hmr` 行负责（`packages/bundle/web-app/cordis.patch.yml:218-219`）。

### `dsh-web-app` 的 insert 行

本节行号均指 `packages/bundle/web-app/cordis.patch.yml`；按行 id 检索，不再逐行钉行号。当前快照：第一个 insert 块 90 行（25 + 6 + 59），第二个 insert 块 1 行 `agent-preset-registry`，共 91 行。`ptc-runtime` 仍是 base 层行（`packages/bundle/base/cordis.patch.yml:397-398`）。

**Layer 1 — 基础设施（25 条，`:45-164`）：**

- `desktop-product-telemetry`：desktop 专属 OTel 遥测导出，非 desktop profile 整行 disabled
- `product-analytics`：desktop 专属 client 产品分析，同上 disabled 条件
- `subagent-model-selection-settings`
- `message-feedback`
- `session-log-download`：`/export` 命令加共享下载对话框
- `open-in-app`：宿主侧应用解析，含 timeout config
- `ui-open-in-app`：浏览器半边
- `workspace`
- `session-reference`
- `file-reference-local`
- `session-stats`
- `session-turn-outline`
- `directory-picker`
- `plugin-inventory`
- `session-controller`：session 命令、冷读与 Typert Remote 实时控制
- `job-controller`：单个后台 job 的观察记录流，roster 搭其上的 session 控制流
- `terminal-controller`
- `workspace-files`：会话工作区内的有界读取、目录列举与 agent 写入变更流
- `schedule`：Schedule 服务主机行，随出厂组合直接挂载
- `ui-settings-account`：Typert Remote 上的配置面读写，settings-domain provider 缺席时报可操作错误
- `account-controller`
- `settings-controller`
- `workspace-controller`：Workspace 命令与 reconnect-safe 投影（Remote 控制器）
- `cordis-host-runner`
- `cordis-inspect-providers`：Host inspect providers 进程全局注册一次，各 preset 的 `tool-cordis` 行读取（storage / session-projection-cache / typert-gateway 等结构化存储与 RPC 网关基础设施在 `dsh-base`，非 web-app insert。）

**Layer 2 — 传输层（6 条）：**

- `web-startup`：解析命令行 flag 的普通 provider，`webserver`/`web-runtime` 注入其 `webStartup` 服务
- `webserver`：HTTP 服务，host/port 取自 `webStartup` provider、回退 `127.0.0.1:3080`，gzip，拒绝通配绑定
- `web-runtime`：前端 dist 分发、URL 打印，并 provide 新 core 服务 `ctx.webApp` 的 `getAdvertisedUrl()`
- `harness-dev-context`：给检视/扩展本 GUI 的 agent 提供无值 prompt section 与可选 runtime context
- `client-hmr`：client 插件热重载链，常挂、空闲直至重建 watcher 重写 client bundles
- `file-upload`：Raw Blob / ReadableStream 上传，独立于 Connection 的 RPC 与 generation 服务

**Layer 3 — Browser 插件罗盘（59 条，`dsh.client` 行；`file-upload` 计入 Layer 2）：**

- `modules`：node 半边扫本树组装 `window.__DSH_BOOT__` 并 serve `/plugins/<id>/client.js`，同时是 host 行
- `connection`：web 传输两端：node 半边把 gateway 挂到 webserver 的 `/api` 下，浏览器半边是 fetch/SSE client
- `api-remotes`
- `cordis-client-runner`
- `ui-theme`
- `locale`
- `shortcuts`
- `ui-shortcuts`
- `ui-layout`
- `ui-renderer`
- `ui-session`
- `resources`：协议 provider 汇成 `useResource` 的统一资源模型
- `ui-sidebar`
- `ui-sidebar-right`：右栏停靠面
- `office-to-pdf`
- `ui-sidebar-documentpreview`：右栏文档页：有界读 + Markdown/代码/HTML/PDF/Office/纯文本渲染
- `ui-sidebar-browser`：Web profile 需 opt in、Desktop 保留沙箱 HTTP(S) Browser 标签页，非 desktop 整行 disabled
- `ui-sidebar-terminal`
- `ui-sidebar-files`：右栏工作区文件树页
- `ui-settings`
- `ui-settings-general`
- `ui-settings-models`
- `ui-plugin-manager`：sidebar Plugins 页：经 `pluginManager` Remote 安装/启用/禁用/移除 profile bundles，无 profile 宿主时自报不可用
- `ui-settings-plugin-inventory`：Settings Plugins 区的只读 Plugin 列表页，sidebar 页未收录的内建 bundle 在此查看
- `ui-conversation`
- `ui-approval`
- `ui-chat`
- `ui-brand-official`
- `ui-attachment`
- `ui-tool`
- `ui-cordis`
- `ui-deliverables`：turn 尾部：收尾 assistant 消息下的 changed-files 卡与交付卡
- `workspace-changes`：按 git working-tree 快照记录每个顶层 turn 的变更文件，其事件由上面的 changed-files 卡渲染
- `ui-workspace`
- `ui-workflow-run`
- `ui-input-trigger`
- `ui-commands`
- `ui-skill`
- `ui-subagent`
- `ui-reference`
- `ui-secret-mask`：对已发送用户文本里识别出的凭据做显示掩码，交互消息内可逐值揭示
- `ui-jobs`
- `ui-schedule`：Schedule 任务页，随出厂组合直接挂载
- `ui-goal`
- `ui-message-feedback`
- `ui-model-selection`
- `ui-deepseek-model-label-1017`：临时 1017 徽标
- `ui-permission`
- `ui-agent-preset`
- `entry-customization`：左栏 / Conversation View / 右栏 guide 三处 More 菜单的 browse 与 Creator 草稿入口
- `ui-settings-session-log`
- `ui-settings-plugins`
- `ui-settings-shell`
- `ui-settings-agent-loop`
- `ui-settings-subagent`
- `ui-settings-web-search`：官方配置页 companion 行，按 host-plane namespace 各注册一页进 Plugins 页
- `ui-plan`
- `ui-user-questions`
- `ui-trajectory`

**Layer 4 — Agent Presets：**
`agent-preset` preset patch（默认 `standard`，可选 `ptc`、`minimal`、`cordis`；声明式重设计），shipped preset 声明以 `presets/*.patch.yml` 随 bundle 携带（`:587-589` 注释、`package.json` `dsh.bundle.patch` 次序），其行不计入本文件 91 条 insert 行；preset 选择注册表由第二个 insert 块唯一一行 `agent-preset-registry` 承载（`default: standard`，`:590-594`）。

## 进程模型

```
dsh --profile web
  → resolveProfileDir('web')
  → initProfile(dir, ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'])
  → loadProfile → 叠 bundle + user patch + --patch
  → boot() → 启动 Loader 插件树
  → webserver 绑定端口，打印 URL
  → 等待 browser 连接、用户操作
  → 进程常驻，直到 SIGINT / SIGTERM
```

## 独特之处

- **shipped 模板中唯一支持运行时 patch 重载的 Profile**：`hmr` 插件监视 profile patch 与包清单，`HmrService.reconcileProfile()` 调 app-boot 的 `recomposeProfile` 完成重组合，新失败抛错回滚（`packages/boot/hmr/src/index.ts:925`、`packages/boot/app-boot/src/index.ts:307`；机制见 [`../plugin-system/composition/03-user-patch-hmr.md`](../plugin-system/composition/03-user-patch-hmr.md)）。该「唯一」限 shipped 模板——base 行按 `profileContext` 门控，自定义 launcher profile 默认同样开启。
- **CLI launcher profile 中唯一有 browser 侧的 Profile**：browser 半边（`packages/client/`）通过 `window.__DSH_BOOT__` 初始化，经 `dsh.client` 插件罗盘构造核。Electron desktop 复用**同一套** web 组合与匹配的 client 图（desktop-host 经 `runProfile` 起 `desktop` profile），但它不是 CLI launcher profile（[`06-desktop.md`](./06-desktop.md)）。
- **CLI launcher profile 中唯一使用会话级 preset 的 Profile**：session 级别选择 standard / ptc / minimal / cordis，host 平面除 `working_directory` 外不直接挂 model-facing 工具。（desktop 的 preset 由 `loadProfileDirectory` 在安装期组装，host 不再改写 roots。）
- **stdout 给用户**：可以装 logger、打印 URL、输出诊断信息。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/bundle/web-app/cordis.patch.yml` | Web 特有 patch 层 |
| `packages/bundle/web-app/src/startup.ts` | 命令行 flag 解析 |
| `packages/boot/app-boot/src/profile.ts` | `PROFILE_TEMPLATES.web`、launcher 组合 |
| `apps/cli/src/bin.ts` | 产品 bin 分发 |
| `packages/client/` | 浏览器半边 |
| `packages/host/` | API gateway + HTTP |
| `_digested/plugin-system/composition/00-map.md` | 启动组合机制 |
| `_digested/surfaces-entrypoints/01-启动面与session流.md` | host/client 共享 session 流 |
