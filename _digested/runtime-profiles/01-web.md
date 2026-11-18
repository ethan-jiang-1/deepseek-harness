# web — 浏览器 GUI

## 一句话

`dsh --profile web` 启动一个常驻 HTTP 服务，提供完整的浏览器 IDE（会话、聊天、文件、设置、工具栏、插件管理）。是 DSH 产品中最完整的宿主形态。

**为什么单独设这一形态**：与只跑单次任务的 `headless` 或纯 stdio 协议入口不同，`web` 在 `dsh-base` 之上整层叠出 `dsh-web-app`（UI 控制器、浏览器前端、设置卡片、插件管理器与预设开关），让同一套 agent runtime 既服务人类交互界面，又把 agent 工具的选择权从固定启动配置下放到每个会话的 `preset` 里——想改界面、设置表单或浏览器行为时，对照本页的叠层差异能第一时间定位它多装了什么、又关掉了 base 的哪些默认行。

## 怎么跑

```sh
dsh --profile web
dsh --profile web --port 8080          # 换端口
dsh --profile web --no-open            # 不自动打开浏览器
dsh --profile web --patch my.yml       # 叠加 patch
```

源码启动：`pnpm dsh --profile web`。发行 bin：`dsh web` 是 `--profile web` 的等价形式（help 示例 `apps/cli/src/args.ts:92`）——解析器把首个非 flag、非 `plugin` 的 positional 直通为 `['--profile', ...argv]`（`apps/cli/src/args.ts`），launcher 父选项与 app 参数按 Commander 常规规则归位。

## Bundle 组合

`PROFILE_TEMPLATES.web` = `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']`

| 层 | 从哪里来 | 作用 |
|----|---------|------|
| `dsh-base` | `packages/bundle/base/` | 所有 profile 共享的核心插件（LLM、session、tools、agent-loop、sandbox、subagent、goal、web 搜索等） |
| `dsh-web-app` | `packages/bundle/web-app/` | Web 特有层：overrides base 行 + 插入 browser client、HTTP server、storage、声明式 `agent-preset` + `agent-preset-registry`；shipped presets 以 `presets/*.patch.yml` 随 bundle 携带 |

### `dsh-web-app` 的 override 行

| id | 做了什么 |
|----|---------|
| `system-prompt` | 设 persona prefix：`personaPrefix`（`You are a coding agent powered by the {{model}} model.`，`:17-20`）。shipped 组合不设 `personaSuffix`；执行目录由 `ctx.workingDirectory` 供给 |
| `session-query-sqlite` | 设 `:memory:` + `openAt: never`（按需才开 SQLite） |
| `tools` | 透传 `DSH_TOOLS_MODE` 环境变量 |
| `tool-bash`, `tool-pwsh`, `tool-fs`, `tool-skill`, `tool-goal` 等 | **disable** 由会话级 preset 接管的 model-facing 工具行（由 bundle 携带的 preset patch 承担）；`working_directory` 是例外——base 的 `tool-working-directory` 行保留在 host 平面。base 分别挂出 `search` 与 `fetch` 后，`tool-web` 的 host 行整行 disable、由 preset 按档位组合两工具（base patch 注释与行，`packages/bundle/base/cordis.patch.yml:454-466,486-490`）；shipped 各 preset 的 `tool-web` 均 `fetch: true`，可作对照 |

`tool-str-replace-editor` 不在 `web-app` 的 disable 名单中（它与 `base` 均不挂载该插件）。

`hmr` 不在上表：web-app 自身没有 `hmr` 行，模块热更新的 disable 来自 base 层（`packages/bundle/base/cordis.patch.yml:27-32`）；Web 的 client 侧热重载由独立的 `client-hmr` 行负责（`packages/bundle/web-app/cordis.patch.yml:218-219`）。

### `dsh-web-app` 的 insert 行

权威目录是 [`packages/bundle/web-app/cordis.patch.yml`](../../packages/bundle/web-app/cordis.patch.yml) 本身（按行 id 检索；`ptc-runtime` 仍是 base 层行）。这里只给四层概念与带行为语义的关键行，不逐行抄清单：

**Layer 1 — 基础设施（host 服务与 Remote 控制器）**

- `desktop-product-telemetry` / `product-analytics`：desktop 专属，非 desktop profile 整行 disabled
- `session-log-download`：`/export` 命令加共享下载对话框
- `open-in-app` + `ui-open-in-app`：宿主侧应用解析与浏览器半边
- `session-controller` / `job-controller` / `terminal-controller` / `workspace-controller`：session、job、terminal、workspace 的 Remote 控制面（roster 搭 session 控制流）
- `workspace-files`：会话工作区内的有界读取、目录列举与 agent 写入变更流
- `schedule`：Schedule 服务主机行，随出厂组合直接挂载
- `ui-settings-account`：Typert Remote 上的配置面读写，settings-domain provider 缺席时报可操作错误
- `cordis-inspect-providers`：Host inspect providers 进程全局注册一次，各 preset 的 `tool-cordis` 行读取

**Layer 2 — 传输层**

- `web-startup`：解析命令行 flag 的普通 provider，`webserver`/`web-runtime` 注入其 `webStartup` 服务
- `webserver`：HTTP 服务，host/port 取自 `webStartup` provider、回退 `127.0.0.1:3080`，gzip，拒绝通配绑定
- `web-runtime`：前端 dist 分发、URL 打印，并提供 `ctx.webApp` 的 `getAdvertisedUrl()`
- `harness-dev-context`：给检视/扩展本 GUI 的 agent 提供无值 prompt section 与可选 runtime context
- `client-hmr`：client 插件热重载链，常挂、空闲直至重建 watcher 重写 client bundles
- `file-upload`：Raw Blob / ReadableStream 上传，独立于 Connection 的 RPC 与 generation 服务

**Layer 3 — Browser 插件罗盘**（`modules` 起、`ui-*` 为主；两条 host-only 例外见下）

- `modules`：node 半边扫本树组装 `window.__DSH_BOOT__` 并 serve `/plugins/<id>/client.js`，同时是 host 行
- `connection`：web 传输两端：node 半边把 gateway 挂到 webserver 的 `/api` 下，浏览器半边是 fetch/SSE client
- `resources`：协议 provider 汇成 `useResource` 的统一资源模型
- `ui-sidebar-right` + `ui-sidebar-documentpreview`：右栏停靠面与文档页（有界读 + Markdown/代码/HTML/PDF/Office 渲染）；`office-to-pdf` 与 `workspace-changes` 是罗盘里两条 host-only 行
- `ui-sidebar-browser`：Web profile 需 opt in、Desktop 保留沙箱 HTTP(S) Browser 标签页，非 desktop 整行 disabled
- `ui-sidebar-files`：右栏工作区文件树页
- `ui-plugin-manager`：sidebar Plugins 页，经 `pluginManager` Remote 安装/启用/禁用/移除 profile bundles，无 profile 宿主时自报不可用；`ui-settings-plugin-inventory` 是 Settings 侧的只读补充
- `ui-deliverables` + `workspace-changes`：turn 尾部的 changed-files 卡与交付卡、按 git working-tree 快照记录每 turn 变更
- `ui-secret-mask`：对已发送用户文本里识别出的凭据做显示掩码，交互消息内可逐值揭示
- `ui-schedule`：Schedule 任务页，随出厂组合直接挂载
- `ui-settings-web-search`：官方配置页 companion 行，按 host-plane namespace 各注册一页进 Plugins 页
- `entry-customization`：左栏 / Conversation View / 右栏 guide 三处 More 菜单的 browse 与 Creator 草稿入口

**Layer 4 — Agent Presets**：`agent-preset` preset patch（默认 `standard`，可选 `ptc` / `minimal` / `cordis`；`cordis` 的显示名是 Creator mode / 创造模式），shipped preset 声明以 `presets/*.patch.yml` 随 bundle 携带；preset 选择注册表由 `agent-preset-registry` 行承载（`default: standard`）。preset 机制归 [`../plugin-system/composition/`](../plugin-system/composition/00-map.md)。

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

- **shipped 模板中唯一支持运行时 patch 重载的 Profile**：`hmr` 插件监视 profile patch 与包清单并原子换入新 patch 集，新失败抛错回滚（机制归 [`../plugin-system/composition/03-user-patch-hmr.md`](../plugin-system/composition/03-user-patch-hmr.md)）。该「唯一」限 shipped 模板——base 行按 `profileContext` 门控，自定义 launcher profile 默认同样开启。
- **CLI launcher profile 中唯一有 browser 侧的 Profile**：browser 半边（`packages/client/`）通过 `window.__DSH_BOOT__` 初始化，经 `dsh.client` 插件罗盘构造核。Electron desktop 复用**同一套** web 组合与匹配的 client 图（desktop-host 经 `runProfile` 起 `desktop` profile），但它不是 CLI launcher profile（[`06-desktop.md`](./06-desktop.md)）。
- **CLI launcher profile 中唯一使用会话级 preset 的 Profile**：session 级别选择 standard / ptc / minimal / cordis，host 平面除 `working_directory` 外不直接挂 model-facing 工具。（desktop 共享同一 `dsh-web-app` 层携带的 `presets/*.patch.yml` 并经 `agent-preset-registry` 按会话挂载，host 只经 `loadProfileDirectory` 装载 profile 本身的 bundle 与 `cordis.patch.yml`，不额外改写根配置。）
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
