# desktop — Electron 应用自有 profile

产品源码基线：`639ed015397290b3745d163aafe02ffee4aa3f84`（`dsh-v0.2.0-rc.2`）；上一消化基线 `46a7f68b09`（`dsh-v0.1.7-rc.1`），增量见 [`_change_log/0009`](../_change_log/0009-0.1.7-rc.1-to-0.2.0-rc.2.md)。

## 一句话

`desktop` 是第五个「base + 产品层」的 bundle 组合（web / headless / sdk / acp 之后；`sdk-minimal` 是不叠 base 的独立树，不算在内），也是唯一的**应用自有 profile**：它不进 `PROFILE_TEMPLATES`、不走 `dsh` CLI、没有 `--profile desktop` 这条路。Electron 壳启动一个 Electron Node 模式的私有子进程（`apps/desktop-host/`，下称 host），host 用 `loadProfileDirectory` 装载 `$DSH_HOME/profiles/desktop`，再经**共享的** `runProfile` 起完整的 web 应用（webserver 监听 `127.0.0.1:19387`），把认证 URL 经 Node IPC 报回壳进程（`apps/desktop-host/src/index.ts:23`、`:25-42`、`:103-104`）。壳窗口加载 `dsh-app://app/` 的打包 Web 入口，把页面里的应用请求转发给这个已认证 Host。

## 归属：保留名 + 独占目录

- profile 目录与锁：`$DSH_HOME/profiles/desktop` 及其下的 `lock`（`apps/desktop/src/paths.ts:17-21`）。`DesktopProjectManager.withLock` 持有该锁完成全部 profile 写事务，并回收陈旧进程留下的死锁文件（`apps/desktop/src/project-manager.ts:93-130`）。
- 组合起点：`WEB_PROFILE = PROFILE_TEMPLATES.web`，desktop profile 的 `dsh.profile.bundles` 就是 web 那两个 bundle（`apps/desktop/src/project-manager.ts:32`，经 `initProfile` 写入 manifest：`:142`、`:167`、`:175`；模板定义 `packages/boot/app-boot/src/profile.ts:179-195`）。用户插件由主窗口 Plugins 页经共享 Web Plugin Manager 追加进同一 manifest（`apps/desktop/README.md:80`）。
- 生产 runtime 由签名应用自带：`resources/app.asar/dsh` 携带完整生产依赖树，core 包不复制进 profile 存储、首启不跑 pnpm（`apps/desktop/README.md:76`、`:77`、`:119`）。
- CLI 的 boot / dump / `plugin` 三条入口一律拒绝这个名字：`rejectElectronProfile`（`apps/cli/src/args.ts:83-87`，错误文案 `:85`），调用点在根命令 action（`:183`，一次覆盖 boot 与 `--dump-config` / `--dump-default-config` / `--dump-config-schema`）与 `plugin` 子命令（`:195`）。`desktop` 也**不是** `PROFILE_TEMPLATES` 成员（`packages/boot/app-boot/src/profile.ts:179-195`），所以 `--from-default-profile desktop` 以「unknown default profile」被拒（`apps/cli/src/profile-boot.ts:106-113`）。

`docs/architecture.md` 把这条归属单独写在 `## Desktop application`（`:51-55`），`:55` 原文是「Desktop defaults to port `19387`; profile configuration can override it.」；`## Application launch`（`:43-49`）仍然只列 5 个 CLI profile、不计 Desktop。

## 装载路径：`loadProfileDirectory` + 共享 `runProfile`

launcher profile 的路径是 `loadProfile` → home 发现 → `normalizeShippedProfile` → 层叠（`packages/boot/app-boot/src/profile.ts:704-722`）。desktop 走的是最后一段：

```ts
// apps/desktop-host/src/index.ts:22-30
const installAnchor = join(runtimeDir, 'node_modules', '@deepseek-ai', 'dsh', 'package.json')
const profile = loadProfileDirectory('dsh', projectDir, installAnchor)
const application = runProfile({
  environment: loadLayeredEnv('dsh'),
  profile: 'desktop',
  resolvedProfile: { profile, installAnchor },
  patchFiles: [],
  args: ['--no-open', '--port', '19387'],
  ...
```

`loadProfileDirectory(binName, dir, installAnchor)`（`packages/boot/app-boot/src/profile.ts:643-689`）接受一个**已初始化的绝对 profile 目录**：不经过 Harness home 发现、不做 shipped 归一化、不认 `PROFILE_TEMPLATES`；它只读该目录 manifest 的 `dsh.profile.bundles`，逐个把 bundle 解析成 patch 层，再读该目录自己的 `cordis.patch.yml` 作 user 层。bundle 的解析锚点是 installAnchor 优先、profile 目录其次（`resolveBundleDir`，`:630-640`）：`dsh-base` / `dsh-web-app` 解析进签名 runtime 树，外部插件解析进 profile 自己 pnpm 装的 `node_modules`。

`runProfile`（`apps/cli/src/profile-boot.ts:244-326`）正是为这类应用自有 profile 留的口：desktop 传入自己的 profile 与安装锚点（`apps/desktop-host/src/index.ts:27-28`）、`patchFiles: []`（`:29`），并把打包 pnpm 与 Electron Node 模式可执行交给 `packageManager`（`:31-41`，`ELECTRON_RUN_AS_NODE: '1'` 在 `:36`），只作用于插件包操作。`composeProfile` 对应用自有 profile 不做模板初始化，只重写空根配置、直接用已装载的 profile（`apps/cli/src/profile-boot.ts:201-202`）。

desktop 与 CLI 组合的三处差异：

- **安装锚点不同**：CLI 用自身 `apps/cli` 的 `package.json`（`apps/cli/src/profile-boot.ts:77`），desktop 用签名 runtime 树里的 `node_modules/@deepseek-ai/dsh/package.json`（`apps/desktop-host/src/index.ts:22`）。同一 `loadProfileDirectory`，解析出的 bundle 位置不同。
- **~~`desktop.cordis.patch.yml` 应用私有覆盖层~~（0.1.7 线随 desktop-host 重构退役）**：旧基线 desktop 在 profile 层之上再叠一份应用私有 patch，disable `webserver` / `web-startup` 等七行、换成无端口的分帧字节管道。现 host 经共享 `runProfile` 起完整 web 应用（webserver 也在树里，`packages/bundle/web-app/cordis.patch.yml:169-174`），`patchFiles: []` 表示没有应用私有 overlay（`apps/desktop-host/src/index.ts:29`）；组合差异改为 Electron 壳侧的资源投递与请求转发（见「进程模型」「传输与认证」）。
- **~~`agent-presets` roots 改写~~（0.1.7 线退役）**：旧机制把 preset 行的 `roots` 改指 dsh 安装内的 `config/agent-presets`。现组合的 preset 行由 `dsh-web-app` bundle 自带（`agent-preset-registry`，`packages/bundle/web-app/cordis.patch.yml:562-565`），host 不再做任何 roots 改写（现文件 122 行）。

## 进程模型

```text
Electron shell
  → 取进程级单实例锁（apps/desktop/src/single-instance.ts:16-20；main.ts:1336）
  → 立即加载 dsh-app://app/ 的打包 Web 入口（共享加载页，等 Host 启动注入）
  → 校验 runtime 描述符 / 准备 profile（不跑 pnpm）
  → spawn Electron Node 模式子进程 @deepseek-ai/dsh-desktop-host
     （--expose-internals；stdio ['ignore','pipe','pipe','ipc']）
  → installOfficeEngineResolution(runtimeDir)（ASAR 下把 libreoffice-kit-* 重定向到 .unpacked）
  → loadProfileDirectory('dsh', projectDir, installAnchor)
  → runProfile(profile 'desktop', patchFiles [], --no-open --port 19387)
     → installProxyFromEnvironment（共享路径，见「与出网代理」）
     → boot：bundle 层 + profile user 层 + home 层 + 遥测开关
  → installDesktopUpdateTaskControl / ctx.plugin(desktopOffice) / installPlatformSessionPublisher
  → url = ctx.connection.authenticatedUrl('http://127.0.0.1:' + webServer.port)
  → IPC ready {url, injections} → 壳换认证 cookie → dsh-app://app 请求转发到 Host
```

壳侧准备不跑 pnpm：`applyRelease` 只校验 `desktop-runtime.json` 描述符、迁移 profile 的 pnpm 设置、`createPluginProfile`（`initProfile` 补齐缺失的 manifest / 空 user patch / pnpm workspace 文件）并摘除旧 link 后端写下的 `.dsh-module-fallback` 投影（`apps/desktop/src/project-manager.ts:83-91`、`:173-176`；`packages/boot/app-boot/src/profile.ts:219-238`、`:250`）。

Node IPC 承载生命周期与控制（事件形状在 `apps/desktop/src/host-process.ts:8-37`，host 侧处理在 `apps/desktop-host/src/index.ts:48-90`）：

| 消息 | 方向 | 内容 |
|------|------|------|
| `ready` | host → 壳 | `{url, injections}`（index 注入表）；壳用 URL 换认证 cookie（`apps/desktop/src/web-document.ts:43-53`） |
| `fatal` | host → 壳 | 消息 + `inspect` 截到 64×1024 字符的完整诊断；退出码 1（`apps/desktop-host/src/index.ts:107-108`、`:110-121`，截断 `:116`、退出码 `:119`） |
| `shutdown` / `shutdown-complete` | 壳 → host → 壳 | `shutdown.shutdown(0)` 后断开 IPC；壳侧 10 s 未退发 SIGTERM、再 5 s SIGKILL（`apps/desktop-host/src/index.ts:52-58`；`apps/desktop/src/host-process.ts:293-300`） |
| `quit-inspection` | 双向 | 壳问普通退出会打断什么；Host 答 active tasks（运行中 agent、排队消息与 running/stopping job）与已排期提醒，2 s 超时视为有活、由壳弹退出确认（host 侧 `apps/desktop-host/src/index.ts:62-77`；壳侧 `apps/desktop/src/host-process.ts:254-258`，超时常量 `:49`） |
| `update-tasks` | 双向 | inspect / lock / unlock；lock 拒新请求（503）、排空已准入请求后检查运行中的 agent 与 job（`apps/desktop-host/src/update-tasks.ts:16-23`、`:28-62`） |
| `platform-session` | host → 壳 | Platform 账户凭据，仅进主进程的 Platform 视图，不进渲染端（`apps/desktop-host/src/platform-session.ts:10-36`；壳侧校验 `apps/desktop/src/host-process.ts:20-23`、`:53-90`） |

Office 组合由 host 在 boot 之后挂载：`ctx.plugin(desktopOffice, { runtimeDir, source, root })`，`root` 固定为 `$DSH_HOME/dsh-runtimes/dsh-primary-runtime`（离线 Python / pnpm 载荷的安装根），`source` 是随包的 `office-skills` 资源目录（`apps/desktop-host/src/index.ts:95-99`；`office.ts:28-38`）。断连即停：`process.once('disconnect', stop)`（`apps/desktop-host/src/index.ts:91`）。

## 与 web profile 的关系

| 维度 | web | desktop |
|------|-----|---------|
| 是不是 launcher profile | 是（`PROFILE_TEMPLATES.web`） | 否；名字被 CLI 拒绝 |
| 谁装载 | `dsh` CLI：`loadProfile` → `runProfile` | host：`loadProfileDirectory` → 同一个 `runProfile`（`apps/cli/src/profile-boot.ts:244`） |
| bundle 组合 | `dsh-base` + `dsh-web-app` | 同左（`initProfile` 用 web 模板写 manifest） |
| profile 目录 | `$DSH_HOME/profiles/web` | `$DSH_HOME/profiles/desktop`（CLI 不可达，Electron 独占 + lock） |
| 端口 | `webserver` 绑 `127.0.0.1:3080`（`ctx.webStartup.port ?? 3080`） | 同一 `webserver` 行；host 以 `--port 19387` 启动，flag 经 `web-startup` 落进同一端口表达式；`webserver.config.port` patch 可覆盖（`docs/architecture.md:55`） |
| 浏览器 | `web-startup` 解析 `--open`，`web-runtime` 打印 URL、可自动打开 | host 以 `--no-open` 启动；URL 走 IPC 交给壳，无浏览器启动 |
| 目录选择 | `directory-picker` auto 行按主机事实解析 native / browse | 同一行共享；native 面的对话框由壳的窗口 IPC 承担（`apps/desktop/src/directory-picker.ts:10-30`） |
| 运行时 patch 重载 | base bundle 的 `hmr` 行（有 `profileContext` 即挂载）监视 profile 与 home 两份 `cordis.patch.yml` 并 reconcile | 同左：desktop 也经 `runProfile`，`profileContext` 在场，同一 watcher 生效（`packages/bundle/base/cordis.patch.yml:28-32`；`packages/boot/hmr/src/index.ts:206-236`）。~~patchReload: live~~（0.1.7 线退役：patch 重载语义从 profile 文件机制改为 base bundle 的 `hmr` 行） |
| `agent-preset` | `agent-preset-registry`，`default: standard` | 同左（同一 bundle 层） |
| client 图 | `packages/client/` 经 `window.__DSH_BOOT__` 注入 | 同一套：静态 dist 由壳从打包资源直接发出，`/plugins/` bundle 经 `dsh-app://app` 转发到 Host |

## 传输与认证

传输就是 web 的 HTTP + Cookie 认证，载体换成了壳：

- Connection 激活时从凭据库装载（没有则生成）32 字节 HMAC 秘钥，持久化在 `credentialKey('client-connection', 'browser-session')` 记录里（`packages/client/connection/src/browser-auth.ts:12`、`:161-178`；挂载点 `packages/client/connection/src/index.ts:137`）。
- 每个进程一个 launch token（按进程 owner 缓存在 `WeakMap`，`browser-auth.ts:52-58`）；`authenticatedUrl` 把 token 追加为查询参数（`:223-227`）。
- 首次 `GET /` 且 token 匹配时，Host 签发 `dsh-auth-<sha256(authority)>` cookie 并 303 到 `./`（`:246-262`）；cookie 载荷是 `v1.{body}.{HMAC-SHA256}`，绑定 authority、默认 30 天（`cookieMaxAgeDays`）、`HttpOnly; SameSite=Strict`（`:106-108`、`:121-123`）。此后请求靠 cookie 认证，其余一律 401（`:287-300`、`:302-310`）。
- 壳在 ready 后用 host 报来的 URL 做一次 token 换 cookie（`apps/desktop/src/web-document.ts:43-53`），此后把 `dsh-app://app` 的应用请求转发到 Host 并只附壳自己持有的 cookie；`set-cookie` 不透传给页面（`:58-64`、`:85`、`:90`）；`/plugins/` bundle 响应改 `no-store`（`:91`）。WebSocket 的 cookie 只对主窗口注入（`apps/desktop/src/main.ts:710-721`）。
- `/api` 请求先过 401/403 准入再进瀑布（`packages/client/connection/src/index.ts:145-152`）；desktop 的 update-tasks 准入锁挂在 `connection/request` 瀑布上（`apps/desktop-host/src/update-tasks.ts:34-44`）。

## 与出网代理：分歧已消除

0.1.7 线之前的基线结论「desktop-host 不装代理、`.env` 代理对 desktop 不生效」已随 desktop-host 重构失效：host 调用的 `runProfile` 在第一个插件挂载前就 `installProxyFromEnvironment`（`apps/cli/src/profile-boot.ts:243-250`），shutdown 时还原（`:254-256`）。desktop 的环境快照同样来自 `loadLayeredEnv('dsh')`（`apps/desktop-host/src/index.ts:26`），所以 `$DSH_HOME/.env` 里豁免的四个代理名对 desktop 与 CLI 生效路径一致。note [`2026-08-27-outbound-proxy-policy`](../../.agents/notes/implemented/architecture/2026-08-27-outbound-proxy-policy.md) 的结论（`runProfile` 一处安装覆盖每个 profile）现在对 desktop 成立；其论据「`loadLayeredEnv` 只有一个调用者」已过时——现在有两个（`apps/cli/src/bin.ts:36`、`apps/desktop-host/src/index.ts:26`）。逐调用点证据见 [`../capability-seams/06-外发代理策略.md`](../capability-seams/06-外发代理策略.md)。

## 源码入口

| 路径 | 角色 |
|------|------|
| `apps/desktop/` | Electron 壳：单实例锁、窗口、`dsh-app://` 协议、请求转发与认证、profile 准备与原生恢复、更新 |
| `apps/desktop-host/` | Electron 私有的 Node 子进程入口：`loadProfileDirectory` + `runProfile` + Office / 平台会话 / 更新任务插件（`private: true`，不随公开包发布） |
| `apps/desktop-host/src/index.ts` | 装载与启动序列全文（122 行）；IPC 消息与 64×1024 字符诊断上限 |
| `apps/desktop/src/host-process.ts` | 壳侧子进程生命周期：spawn、stdio、超时升级、IPC 事件校验 |
| `apps/desktop/src/paths.ts` | `$DSH_HOME/profiles/desktop` 与 lock |
| `apps/desktop/src/project-manager.ts` | profile 准备 / 原生恢复 / 写锁；web 模板 bundle 写 manifest |
| `apps/desktop/src/web-document.ts` | 打包静态资源、token→cookie 交换、请求转发 |
| `packages/boot/app-boot/src/profile.ts` | `loadProfileDirectory`（应用自有 profile 的装载原语）与 `PROFILE_TEMPLATES` |
| `apps/cli/src/profile-boot.ts` | 共享 `runProfile`：代理安装、组合、shutdown |
| `docs/architecture.md` | `## Application launch`（`:43-49`）与 `## Desktop application`（`:51-55`） |

依据 note（在 `implemented/`）：[`2026-09-10-desktop-web-wrapper`](../../.agents/notes/implemented/architecture/2026-09-10-desktop-web-wrapper.md)（本页结构的直接来源）、[`2026-09-11-desktop-electron-node-runtime`](../../.agents/notes/implemented/architecture/2026-09-11-desktop-electron-node-runtime.md)（Electron 即 Node 运行时，`--expose-internals`）、[`2026-09-08-desktop-bundled-runtime-and-external-plugins`](../../.agents/notes/implemented/architecture/2026-09-08-desktop-bundled-runtime-and-external-plugins.md)（捆绑 runtime 与外部插件分存）、[`2026-08-25-electron-desktop-packaging-and-updates`](../../.agents/notes/implemented/architecture/2026-08-25-electron-desktop-packaging-and-updates.md)（发布身份、签名、更新资格）、[`2026-08-27-outbound-proxy-policy`](../../.agents/notes/implemented/architecture/2026-08-27-outbound-proxy-policy.md)（代理结论）。
