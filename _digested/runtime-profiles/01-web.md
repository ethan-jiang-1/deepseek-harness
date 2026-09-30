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

源码启动：`pnpm dsh --profile web`。发行 bin：`dsh web` 是 `--profile web` 的等价形式（help 示例 `apps/cli/src/args.ts:92`）——解析器把首个非 flag、非 `plugin` 的 positional 直通为 `['--profile', ...argv]`（`apps/cli/src/args.ts:201-206`），launcher 父选项与 app 参数按 Commander 常规规则归位（旧 `rejectParentOptions` 拦截已不存在，全仓无此函数；见 [`../composition-boot/04-profile-创建与保留名.md`](../composition-boot/04-profile-创建与保留名.md) 末尾的待判项）。

## Bundle 组合

`PROFILE_TEMPLATES.web` = `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']`

| 层 | 从哪里来 | 作用 |
|----|---------|------|
| `dsh-base` | `packages/bundle/base/` | 所有 profile 共享的核心插件（LLM、session、tools、agent-loop、sandbox、subagent、goal、web 搜索等） |
| `dsh-web-app` | `packages/bundle/web-app/` | Web 特有层：overrides base 行 + 插入 browser client、HTTP server、storage、preset patch（0.1.7 线起旧 agent-presets 退役、改造为声明式 agent-preset + agent-preset-registry，shipped presets 以 `presets/*.patch.yml` 随 bundle 携带） |

### `dsh-web-app` 的 override 行

| id | 做了什么 |
|----|---------|
| `system-prompt` | 设 persona 两段：`personaPrefix`（`You are a coding agent powered by the {{model}} model.`）+ `personaSuffix`（`Your working directory is {{cwd}}.`） |
| `session-query-sqlite` | 设 `:memory:` + `openAt: never`（按需才开 SQLite） |
| `tools` | 透传 `DSH_TOOLS_MODE` 环境变量 |
| `tool-bash`, `tool-pwsh`, `tool-fs`, `tool-skill`, `tool-goal` 等 | **disable** 所有 model-facing 工具行——这些交给会话级 preset 挂载（0.1.7 线起由 bundle 携带的 preset patch 承担）。base 双开 `search`+`fetch`（#3382）后，`tool-web` 的语义是 host 行整行 disable、由 preset 按档位组合两工具（base patch 注释与行，`packages/bundle/base/cordis.patch.yml:462-488`）；shipped 各 preset 的 `tool-web` 均 `fetch: true`，可作对照 |

web-app 的 disable 名单里**没有** `tool-str-replace-editor`：它随 base 的那一行一起在**本次跨度（`a66e470204` → `183f08e9c6`）内**全仓下线（OLD 基线里 web-app 自己那行是 `disabled: true`，见 `a66e470204:packages/bundle/web-app/cordis.patch.yml:350-351`），该 disable 行也随之删除（删 1 个 disable 行、增 8 条 insert 行，insert 行 60 → 68）。

`hmr` 不在上表：web-app 自身没有 `hmr` 行，模块热更新的 disable 来自 base 层（`packages/bundle/base/cordis.patch.yml:27-32`）；Web 的 client 侧热重载由独立的 `client-hmr` 行负责（`packages/bundle/web-app/cordis.patch.yml:202-203`）。

### `dsh-web-app` 的 insert 行

本节行号均指 `packages/bundle/web-app/cordis.patch.yml`（下文 `:N` 即该文件行号）：第一个 insert 块 84 行（`:44` 起）+ 第二个 insert 块 1 行 `agent-preset-registry`（`:561` 起）＝ 85 行，旧文记 18+5+44(+1)=68；差量：`ptc-runtime` 移入 base 层（`packages/bundle/base/cordis.patch.yml:390-391`）、`ui-schedule` 行从本组合移除（出厂组合不含 `time-context`/`schedule`/`ui-schedule` 行，可选实验 bundle `@deepseek-ai/dsh-experimental-schedule-bundle` 从插件管理页插入这三行、出厂关闭，`packages/bundle/web-app/README.md:58`）、新增 19 行中 7 条落 Layer 1（`desktop-product-telemetry`、`product-analytics`、`job-controller`、`terminal-controller`、`ui-settings-account`、`account-controller`、`cordis-inspect-providers`）、12 条落 Layer 3（`shortcuts`、`ui-shortcuts`、`ui-sidebar-terminal`、`ui-sidebar-browser`、`office-to-pdf`、`workspace-changes`、`ui-plugin-manager`、`ui-settings-session-log`、`ui-settings-shell`、`ui-settings-agent-loop`、`ui-settings-subagent`、`ui-settings-web-search`），Layer 2 维持 5 条不变。

**Layer 1 — 基础设施（24 条，`:45-157`）：**
`desktop-product-telemetry`（desktop 专属 OTel 遥测导出，非 desktop profile 整行 disabled，`:45-55`）、`product-analytics`（desktop 专属 client 产品分析，同上 disabled 条件，`:57-62`）、`subagent-model-selection-settings`（`:66-67`）、`message-feedback`（`:69-72`）、`session-log-download`（`/export` 命令加共享下载对话框，`:75-76`）、`open-in-app`（宿主侧应用解析，含 timeout config，`:81-86`）/ `ui-open-in-app`（浏览器半边，`:88-89`）、`workspace`（`:91-92`）、`session-reference`（`:94-95`）、`file-reference-local`（`:97-98`）、`session-stats`（`:102-103`）、`session-turn-outline`（`:107-108`）、`directory-picker`（`:113-114`）、`plugin-inventory`（`:117-118`）、`session-controller`（session 命令、冷读与 Typert Remote 实时控制，`:121-122`）/ `job-controller`（单个后台 job 的观察记录流，roster 搭其上的 session 控制流，`:126-127`）/ `terminal-controller`（`:130-131`）/ `workspace-files`（会话工作区内的有界读取、目录列举与 agent 写入变更流，`:132-133`）/ `ui-settings-account`（Typert Remote 上的配置面读写，settings-domain provider 缺席时报可操作错误，`:137-138`）/ `account-controller`（`:140-141`）/ `settings-controller`（`:143-144`）/ `workspace-controller`（Workspace 命令与 reconnect-safe 投影，`:147-148`）（Remote 控制器）、`cordis-host-runner`（`:150-151`）、`cordis-inspect-providers`（Host inspect providers 进程全局注册一次，各 preset 的 `tool-cordis` 行读取，`:156-157`）
（storage / session-projection-cache / typert-gateway 等结构化存储与 RPC 网关基础设施在 `dsh-base`，非 web-app insert。）

**Layer 2 — 传输层（5 条）：**
`web-startup`（解析命令行 flag 的普通 provider，`webserver`/`web-runtime` 注入其 `webStartup` 服务，`:161-162`）、`webserver`（HTTP 服务，host/port 取自 `webStartup` provider、回退 `127.0.0.1:3080`，gzip，`:169-177`）、`web-runtime`（前端 dist 分发、URL 打印、LAN trust，`:189-196`）、`client-hmr`（client 插件热重载链，常挂、空闲直至重建 watcher 重写 client bundles，`:202-203`）、`file-upload`（Raw Blob / ReadableStream 上传，独立于 Connection 的 RPC 与 generation 服务，`:227-228`）

**Layer 3 — Browser 插件罗盘（`dsh.client` 行，55 条；roster 区块（`:205` 起）第 3 行 `file-upload`（`:227-228`）计入 Layer 2 的传输层）：**
`modules`（node 半边扫本树组装 `window.__DSH_BOOT__` 并 serve `/plugins/<id>/client.js`，同时是 host 行，`:211-212`）、`connection`（web 传输两端：node 半边把 gateway 挂到 webserver 的 `/api` 下，浏览器半边是 fetch/SSE client，`:216-223`）、`api-remotes`（`:230-231`）、`cordis-client-runner`（`:233-234`）、`ui-theme`（`:236-237`）、`locale`（`:239-240`）、`shortcuts`（`:242-243`）、`ui-shortcuts`（`:245-246`）、`ui-layout`（`:248-249`）、`ui-renderer`（`:251-252`）、`ui-session`（`:254-255`）、`resources`（协议 provider 汇成 `useResource` 的统一资源模型，`:258-259`）、`ui-sidebar`（`:261-262`）、`ui-sidebar-right`（右栏停靠面，`:265-266`）、`office-to-pdf`（`:269-270`）、`ui-sidebar-documentpreview`（右栏文档页：有界读 + Markdown/代码/HTML/PDF/Office/纯文本渲染，`:274-275`）、`ui-sidebar-browser`（Web profile 需 opt in、Desktop 保留沙箱 HTTP(S) Browser 标签页，非 desktop 整行 disabled，`:278-280`）、`ui-sidebar-terminal`（`:282-283`）、`ui-sidebar-files`（右栏工作区文件树页，`:285-286`）、`ui-settings`（`:288-289`）、`ui-settings-general`（`:291-292`）、`ui-settings-models`（`:294-295`）、`ui-plugin-manager`（sidebar Plugins 页：经 `pluginManager` Remote 安装/启用/禁用/移除 profile bundles，无 profile 宿主时自报不可用，`:300-301`）、`ui-settings-plugin-inventory`（Settings Plugins 区的只读 Plugin 列表页，sidebar 页未收录的内建 bundle 在此查看，`:305-306`）、`ui-conversation`（`:308-309`）、`ui-approval`（`:311-312`）、`ui-chat`（`:314-315`）、`ui-brand-official`（`:318-319`）、`ui-attachment`（`:321-322`）、`ui-tool`（`:325-326`）、`ui-cordis`（`:328-329`）、`ui-deliverables`（turn 尾部：收尾 assistant 消息下的 changed-files 卡与交付卡，`:334-335`）、`workspace-changes`（按 git working-tree 快照记录每个顶层 turn 的变更文件，其事件由上面的 changed-files 卡渲染，`:339-340`）、`ui-workspace`（`:343-344`）、`ui-workflow-run`（`:348-349`）、`ui-input-trigger`（`:353-354`）、`ui-commands`（`:356-357`）、`ui-skill`（`:359-360`）、`ui-subagent`（`:362-363`）、`ui-reference`（`:365-366`）、`ui-jobs`（`:371-372`）、`ui-goal`（`:375-376`）、`ui-message-feedback`（`:381-382`）、`ui-model-selection`（`:385-386`）、`ui-permission`（`:388-389`）、`ui-agent-preset`（`:393-394`）、`ui-settings-session-log`（`:396-397`）、`ui-settings-plugins`（`:402-403`）、`ui-settings-shell`（`:408-409`）/ `ui-settings-agent-loop`（`:411-412`）/ `ui-settings-subagent`（`:414-415`）/ `ui-settings-web-search`（`:417-418`）（官方配置页 companion 行，按 host-plane namespace 各注册一页进 Plugins 页）、`ui-plan`（`:421-422`）、`ui-user-questions`（`:424-425`）、`ui-trajectory`（`:427-428`）

**Layer 4 — Agent Presets：**
`agent-preset` preset patch（默认 `standard`，可选 `ptc`、`minimal`、`cordis`；0.1.7 线声明式重设计），shipped preset 声明以 `presets/*.patch.yml` 随 bundle 携带（`:558-560` 注释、`package.json` `dsh.bundle.patch` 次序），其行不计入本文件 85 条 insert 行；preset 选择注册表由第二个 insert 块唯一一行 `agent-preset-registry` 承载（`default: standard`，`:561-565`）。

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

- **shipped 模板中唯一支持运行时 patch 重载的 Profile**：`hmr` 插件监视 profile patch 与包清单、`reconcileProfilePatches` 调和、新失败抛错回滚（`packages/boot/hmr/src/index.ts:222-246`；机制见 [`../composition-boot/03-user-patch-hmr.md`](../composition-boot/03-user-patch-hmr.md)）。该「唯一」限 shipped 模板——base 行按 `profileContext` 门控，自定义 launcher profile 默认同样开启。
- **CLI launcher profile 中唯一有 browser 侧的 Profile**：browser 半边（`packages/client/`）通过 `window.__DSH_BOOT__` 初始化，经 `dsh.client` 插件罗盘构造核。Electron desktop 复用**同一套** web 组合与匹配的 client 图（desktop-host 经 `runProfile` 起 `desktop` profile），但它不是 CLI launcher profile（[`06-desktop.md`](./06-desktop.md)）。
- **CLI launcher profile 中唯一使用会话级 preset 的 Profile**：session 级别选择 standard / ptc / minimal / cordis，host 平面不直接挂 model-facing 工具。（desktop 的 preset roots 改写机制已随 0.1.7 线 preset 重设计退役：desktop-host 改为 `loadProfileDirectory` 在安装期组装 profile，`apps/desktop-host/src/index.ts` 现无 roots 改写。）
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
| `_digested/composition-boot/00-map.md` | 启动组合机制 |
| `_digested/surfaces-entrypoints/01-启动面与session流.md` | host/client 共享 session 流 |
