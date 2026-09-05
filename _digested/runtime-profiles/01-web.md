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

源码启动：`pnpm dsh --profile web`。发行 bin：`dsh web` 是 `--profile web` 的 alias。

## Bundle 组合

`PROFILE_TEMPLATES.web` = `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']`

| 层 | 从哪里来 | 作用 |
|----|---------|------|
| `dsh-base` | `packages/bundle/base/` | 所有 profile 共享的核心插件（LLM、session、tools、agent-loop、sandbox、subagent、goal、web 搜索等） |
| `dsh-web-app` | `packages/bundle/web-app/` | Web 特有层：overrides base 行 + 插入 browser client、HTTP server、storage、agent-presets |

### `dsh-web-app` 的 override 行

| id | 做了什么 |
|----|---------|
| `system-prompt` | 设 persona 文本 |
| `session-query-sqlite` | 设 `:memory:` + `openAt: never`（按需才开 SQLite） |
| `tools` | 透传 `DSH_TOOLS_MODE` 环境变量 |
| `tool-bash`, `tool-pwsh`, `tool-fs`, `tool-skill`, `tool-goal` 等 | **disable** 所有 model-facing 工具行——这些交给 `agent-presets` 在会话级别挂载。base 双开 `search`+`fetch`（#3382）后，`tool-web` 的语义是 host 行整行 disable、由 agent-presets 按 preset 组合两工具（base patch 注释，`packages/bundle/base/cordis.patch.yml:436-438`）；shipped 各 preset（cordis/ptc/standard）的 `tool-web` 均 `fetch: true`，可作对照 |

`hmr` 不在上表：web-app 自身没有 `hmr` 行，模块热更新的 disable 来自 base 层（`packages/bundle/base/cordis.patch.yml:19-26`）；Web 的 client 侧热重载由独立的 `client-hmr` 行负责（`packages/bundle/web-app/cordis.patch.yml:148-149`）。

### `dsh-web-app` 的 insert 行

**Layer 1 — 基础设施：**
`subagent-model-selection-settings`、`code-runtime`（PTC worker）、`message-feedback`、`session-log-download`、`workspace`、`session-reference`、`file-reference-local`、`session-stats`、`session-turn-outline`、`directory-picker`、`plugin-inventory`、`session-controller` / `settings-controller` / `workspace-controller`（Remote 控制器）、`cordis-host-runner`
（storage / session-projection-cache / typert-gateway 等结构化存储与 RPC 网关基础设施在 `dsh-base`，非 web-app insert。）

**Layer 2 — 传输层：**
`web-startup`（解析命令行 flag）、`webserver`（HTTP 服务，默认 `127.0.0.1:3080`）、`web-runtime`（前端 dist 分发、URL 打印、LAN trust）、`client-hmr`（client 插件热重载）

**Layer 3 — Browser 插件罗盘（`dsh.client` 行）：**
`modules`、`connection`、`api-remotes`、`cordis-client-runner`、`ui-theme`、`locale`、`ui-layout`、`ui-renderer`、`ui-session`、`ui-sidebar`、`ui-settings`、`ui-settings-general`、`ui-settings-models`、`ui-settings-plugin-inventory`、`ui-conversation`、`ui-approval`、`ui-chat`、`ui-brand-official`、`ui-attachment`、`ui-tool`、`ui-cordis`、`ui-workflow-run`、`ui-deliverables`、`ui-workspace`、`ui-input-trigger`、`ui-commands`、`ui-skill`、`ui-subagent`、`ui-reference`、`ui-schedule`（disabled）、`ui-jobs`、`ui-goal`、`ui-message-feedback`、`ui-model-selection`、`ui-permission`、`ui-agent-preset`、`ui-settings-plugins`、`ui-plan`、`ui-user-questions`、`ui-trajectory`

**Layer 4 — Agent Presets：**
`agent-presets`（默认 `standard`，可选 `ptc`、`minimal`、`cordis`）

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

- **shipped 模板中唯一支持运行时 patch 重载的 Profile**：`composeLive` 夹住用户层，候选失败保留上一棵好树。该「唯一」限 shipped 模板——自定义 profile 默认同样是 live（`packages/boot/app-boot/src/profile.ts:169`）。
- **唯一有 browser 侧的 Profile**：browser 半边（`packages/client/`）通过 `window.__DSH_BOOT__` 初始化，经 `dsh.client` 插件罗盘构造核。
- **唯一使用 `agent-presets` 的 Profile**：session 级别选择 standard / ptc / minimal / cordis，host 平面不直接挂 model-facing 工具。
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
| `_digested/composition/00-map.md` | 启动组合机制 |
| `_digested/surfaces/01-启动面与session流.md` | host/client 共享 session 流 |
