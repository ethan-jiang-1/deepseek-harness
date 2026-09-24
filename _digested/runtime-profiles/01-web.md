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

源码启动：`pnpm dsh --profile web`。发行 bin：`dsh web` 是 `--profile web` 的 alias（`apps/cli/src/args.ts:175`）。alias 走自己的参数直通路径，不接受 launcher 父选项 `--from-default-profile`——出现在 `dsh --from-default-profile x web` 里会被 `rejectParentOptions` 拒绝，写在 `dsh web` 之后则作为 app 参数落到 `ctx.cmdlineArgs`（见 [`../composition/04-profile-创建与保留名.md`](../composition/04-profile-创建与保留名.md) 末尾的待判项）。

## Bundle 组合

`PROFILE_TEMPLATES.web` = `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']`

| 层 | 从哪里来 | 作用 |
|----|---------|------|
| `dsh-base` | `packages/bundle/base/` | 所有 profile 共享的核心插件（LLM、session、tools、agent-loop、sandbox、subagent、goal、web 搜索等） |
| `dsh-web-app` | `packages/bundle/web-app/` | Web 特有层：overrides base 行 + 插入 browser client、HTTP server、storage、preset patch（0.1.7 线起 agent-presets 改造为声明式 agent-preset + agent-preset-registry，shipped presets 以 `presets/*.patch.yml` 随 bundle 携带） |

### `dsh-web-app` 的 override 行

| id | 做了什么 |
|----|---------|
| `system-prompt` | 设 persona 两段：`personaPrefix`（`You are a coding agent powered by the {{model}} model.`）+ `personaSuffix`（`Your working directory is {{cwd}}.`） |
| `session-query-sqlite` | 设 `:memory:` + `openAt: never`（按需才开 SQLite） |
| `tools` | 透传 `DSH_TOOLS_MODE` 环境变量 |
| `tool-bash`, `tool-pwsh`, `tool-fs`, `tool-skill`, `tool-goal` 等 | **disable** 所有 model-facing 工具行——这些交给会话级 preset 挂载（0.1.7 线起由 bundle 携带的 preset patch 承担）。base 双开 `search`+`fetch`（#3382）后，`tool-web` 的语义是 host 行整行 disable、由 preset 按档位组合两工具（base patch 注释与行，`packages/bundle/base/cordis.patch.yml:462-488`）；shipped 各 preset 的 `tool-web` 均 `fetch: true`，可作对照 |

web-app 的 disable 名单里**没有** `tool-str-replace-editor`：它随 base 的那一行一起在**本次跨度（`a66e470204` → `183f08e9c6`）内**全仓下线（OLD 基线里 web-app 自己那行是 `disabled: true`，见 `a66e470204:packages/bundle/web-app/cordis.patch.yml:350-351`），该 disable 行也随之删除（删 1 个 disable 行、增 8 条 insert 行，insert 行 60 → 68）。

`hmr` 不在上表：web-app 自身没有 `hmr` 行，模块热更新的 disable 来自 base 层（`packages/bundle/base/cordis.patch.yml:21-25`）；Web 的 client 侧热重载由独立的 `client-hmr` 行负责（`packages/bundle/web-app/cordis.patch.yml:167`）。

### `dsh-web-app` 的 insert 行

**Layer 1 — 基础设施（18 条）：**
`subagent-model-selection-settings`、`ptc-runtime`（PTC worker；0.1.7 线自 code-runtime 改名）、`message-feedback`、`session-log-download`、`open-in-app`（宿主侧应用解析，含 timeout config，`:62-70`）/ `ui-open-in-app`（浏览器半边，`:72-73`）、`workspace`、`session-reference`、`file-reference-local`、`session-stats`、`session-turn-outline`、`directory-picker`、`plugin-inventory`、`session-controller` / `settings-controller` / `workspace-controller`（Remote 控制器）、`workspace-files`（会话工作区内的有界读取、目录列举与 agent 写入变更流，`:109-111`）、`cordis-host-runner`
（storage / session-projection-cache / typert-gateway 等结构化存储与 RPC 网关基础设施在 `dsh-base`，非 web-app insert。）

**Layer 2 — 传输层（5 条）：**
`web-startup`（解析命令行 flag）、`webserver`（HTTP 服务，默认 `127.0.0.1:3080`）、`web-runtime`（前端 dist 分发、URL 打印、LAN trust）、`client-hmr`（client 插件热重载）、`file-upload`（Raw Blob / ReadableStream 上传，独立于 Connection 的 RPC 与 generation 服务，`:190-193`）

**Layer 3 — Browser 插件罗盘（`dsh.client` 行，44 条；第 45 条 `file-upload` 计入 Layer 2 的传输层）：**
`modules`、`connection`、`api-remotes`、`cordis-client-runner`、`ui-theme`、`locale`、`ui-layout`、`ui-renderer`、`ui-session`、`resources`（协议 provider 汇成 `useResource` 的统一资源模型，`:216-218`）、`ui-sidebar`、`ui-sidebar-right`（右栏停靠面，`:223-225`）、`ui-sidebar-documentpreview`（右栏文档页：有界读 + Markdown/代码/HTML/PDF/纯文本渲染，`:228-231`）、`ui-sidebar-files`（右栏工作区文件树页，`:233-235`）、`ui-settings`、`ui-settings-general`、`ui-settings-models`、`ui-settings-plugin-inventory`、`ui-conversation`、`ui-approval`、`ui-chat`、`ui-brand-official`、`ui-attachment`、`ui-tool`、`ui-cordis`、`ui-workflow-run`、`ui-deliverables`、`ui-workspace`、`ui-input-trigger`、`ui-commands`、`ui-skill`、`ui-subagent`、`ui-reference`、`ui-schedule`（disabled）、`ui-jobs`、`ui-goal`、`ui-message-feedback`、`ui-model-selection`、`ui-permission`、`ui-agent-preset`、`ui-settings-plugins`、`ui-plan`、`ui-user-questions`、`ui-trajectory`

**Layer 4 — Agent Presets：**
`agent-preset` preset patch（默认 `standard`，可选 `ptc`、`minimal`、`cordis`；0.1.7 线声明式重设计）

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

- **shipped 模板中唯一支持运行时 patch 重载的 Profile**：`composeLive` 夹住用户层，候选失败保留上一棵好树。该「唯一」限 shipped 模板——自定义 profile 默认同样是 live（`packages/boot/app-boot/src/profile.ts:142`）。
- **CLI launcher profile 中唯一有 browser 侧的 Profile**：browser 半边（`packages/client/`）通过 `window.__DSH_BOOT__` 初始化，经 `dsh.client` 插件罗盘构造核。Electron desktop 复用**同一套** `dsh-web-app` 组合与匹配的 client 图（`apps/desktop/src/project-manager.ts:105`），但它不是 CLI launcher profile（[`06-desktop.md`](./06-desktop.md)）。
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
| `_digested/composition/00-map.md` | 启动组合机制 |
| `_digested/surfaces/01-启动面与session流.md` | host/client 共享 session 流 |
