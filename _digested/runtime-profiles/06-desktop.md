# desktop — Electron 应用自有 profile

## 一句话

`desktop` 是第五个「base + 产品层」的 bundle 组合（web / headless / sdk / acp 之后；`sdk-minimal` 是不叠 base 的独立树，不算在内），但**不是** launcher profile：它不进 `PROFILE_TEMPLATES`、不走 `dsh` CLI、也没有 `--profile desktop` 这条路。Electron 壳启动一个私有的 Node 子进程（`apps/desktop-host/`），由后者用 `loadProfileDirectory` 直接装载 `$DSH_HOME/profiles/desktop`，叠上自己打包的覆盖层，自己 `boot()`。组合本体复用 web 的两个 bundle，覆盖层把「监听端口、浏览器启动、`open-in-app`、`directory-picker`」全部关掉，换成 Electron 原生的目录选择与进程间传输。

## 归属：保留名 + 独占目录

- profile 目录：`$DSH_HOME/profiles/desktop`（`apps/desktop/src/paths.ts:34`），与 CLI profile 同属一个 Harness home 下的 `profiles/`。
- 组合起点：`DESKTOP_PROFILE_BUNDLES = ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']`（`apps/desktop/src/project-manager.ts:105`）——**就是 web 那两个 bundle**。GUI 安装的 desktop 插件 bundle 追加在其后（`apps/desktop/src/project-manager.ts:274-303` 校验并重写 `dsh.profile.bundles`，seed manifest 在 `:694`，开发工程元数据在 `:720`）。
- 共享边界：CLI 与 Desktop 共享 `$DSH_HOME` 下的产品数据（会话、设置、凭据、工作区），但**从不共享**可执行包、插件激活、lockfile 或 `node_modules`；Desktop 用自带的 pnpm 与私有 store 管理自己的 profile。
- CLI 的三个 profile 入口一律拒绝这个名字：`rejectElectronProfile`（`apps/cli/src/args.ts:68-71`）大小写不敏感地把 `desktop` 判为 Electron 专属，调用点只有两个——根命令 action（`:159`，一次覆盖 boot 与 `--dump-config` / `--dump-default-config`）与 `plugin` 子命令（`:198`）。`desktop` 也**不是** `PROFILE_TEMPLATES` 成员，所以 `--from-default-profile desktop` 会以「未知模板」被拒（[`../composition/04-profile-创建与保留名.md`](../composition/04-profile-创建与保留名.md)）。

`docs/architecture.md` 把这条归属单独写在 `## Desktop application`（`:49-53`），而 `## Application launch`（`:41-47`）仍然只列 5 个 CLI 应用、不计 Desktop。

## 装载路径：`loadProfileDirectory`

launcher profile 的路径是 `loadProfile` → `$DSH_HOME/profiles/<name>` 发现 → `normalizeShippedProfile` → 层叠。desktop 走的是**后半段**：

```ts
// apps/desktop-host/src/index.ts:152-178（desktopPatches）
const profile = loadProfileDirectory('dsh desktop', projectDir, join(dshRoot, 'package.json'))
const layers = [
  ...profile.layers.map(layer => layer.patches),
  profile.patches,                                   // profile 自己的 cordis.patch.yml
  loadOverlayPatches('dsh desktop', DESKTOP_PATCH),  // 应用私有覆盖层
]
// 组合里有 agent-presets 行时，把它的 roots 改指到 dsh 安装内的 config/agent-presets
```

`loadProfileDirectory(binName, dir, installAnchor, options)`（`packages/boot/app-boot/src/profile.ts:774-804`）接受一个**已初始化的绝对 profile 目录**，不经过 Harness home 发现、不做 shipped 归一化、也不认 `PROFILE_TEMPLATES`；它只读磁盘上的 manifest，按 `dsh.profile.bundles` 逐个解析 bundle patch，再读该目录的 `cordis.patch.yml`。`loadProfile` 现在只是「解析目录 → `normalizeShippedProfile` → `loadProfileDirectory`」（`:820-836`），导出见 `packages/boot/app-boot/src/index.ts:37`。

desktop 与 CLI 组合的三处差异：

- **生产环境拒绝 profile 之外的 bundle**：`desktopPatches` 遍历 `profile.layers`，非链接包（`allowLinkedPackages !== true`）时要求每个 `layer.packageDir` 落在 profile 目录内，否则抛 `profile bundle … resolved outside the desktop profile`（`apps/desktop-host/src/index.ts:153-158`）。这挡住了 CLI 维护的 `$DSH_HOME/profiles/node_modules` 回落——Electron 的依赖必须来自它自己的 `node_modules`。
- **`agent-presets` 的 roots 改写**：若组合里存在 `agent-presets` 行，把它 `roots` 指向 dsh 安装内的 `config/agent-presets`（`apps/desktop-host/src/index.ts:165-175`）。这不是 launcher 派生层，是 desktop 自己组合的结果；CLI 侧的 shipped preset root 机制不变（见 [`../composition/01-boot-时序.md`](../composition/01-boot-时序.md)）。
- desktop 自己**不调** `runProfile`：写完根配置、`loadLayeredEnv('dsh desktop')`，再直接 `boot('dsh desktop', rootConfig, structuredClone(desktopPatches(...)), prepare)`（`apps/desktop-host/src/index.ts:283-296`）。

## 覆盖层：关掉端口，换成原生选择器

`apps/desktop-host/config/desktop.cordis.patch.yml` 全文 34 行，路径常量在 `apps/desktop-host/src/index.ts:94`（`DESKTOP_PATCH`）。

| 动作 | 行 | 目标 |
|------|----|------|
| disable | `:3-4` | `web-startup`（不再解析 web 的命令行 flag） |
| disable | `:6-7` | `webserver`（**不开监听端口**） |
| disable | `:9-10` | `web-runtime`（不再分发前端 dist、不打印 URL） |
| disable | `:12-13` | `client-hmr`（client 插件热重载归 Electron 的资源管线） |
| disable | `:15-16` | `open-in-app`（宿主侧应用解析） |
| disable | `:18-19` | `ui-open-in-app`（浏览器半边） |
| disable | `:21-22` | `directory-picker`（`@deepseek-ai/dsh-host-directory-picker-auto` 的自动选择，改由下面的原生行承担） |
| override | `:24-27` | `connection`：`inject: [credentials]` + `config: {}`——Connection 只留 RPC / Fetch 注册表，不依赖 `webServer` |
| insert | `:29-34` | `directory-picker-native`（`@deepseek-ai/dsh-host-directory-picker-native`）+ `ui-directory-picker-native` |

结果就是「无监听端口、无浏览器启动」的 web 组合：`docs/architecture.md:53` 的原文是「the desktop composition opens no Web server or loopback port」。传输改由 Electron 与私有 Node 子进程之间的分帧字节管道承担（一元 RPC、Remote 流、版本匹配的 client 资源），Node IPC 只留给生命周期控制，渲染进程经 `dsh-app://` 拿资源。

## 进程模型

```text
Electron shell
  → 取得进程级单实例锁
  → 校验 release 身份 / 安装 seed（staging → 健康检查 → 激活 / 回滚）
  → 启动私有 Node 子进程 @deepseek-ai/dsh-desktop-host
    → loadLayeredEnv('dsh desktop')
    → loadProfileDirectory('dsh desktop', projectDir, dshRoot/package.json)
    → 叠 desktop.cordis.patch.yml，改写 agent-presets.roots
    → boot('dsh desktop', desktop.cordis.yml, patches, prepare)
    → 不挂 webserver；经分帧字节管道对外服务
  → dsh-app:// 提供匹配的 client 资源
```

desktop 的根配置文件名与 CLI profile 不同：`desktop.cordis.yml`，内容是注释加 `[]`，由包事务自己拥有（`apps/desktop-host/src/index.ts:95-96`）。它同样只是一个空 include 根。

## 与 web profile 的关系

| 维度 | web | desktop |
|------|-----|---------|
| 是不是 launcher profile | 是（`PROFILE_TEMPLATES.web`） | 否 |
| 谁装载 | `dsh` CLI 的 `runProfile` | `apps/desktop-host/` 自己 `boot()` |
| bundle 组合 | `dsh-base` + `dsh-web-app` | 同左，另加应用私有覆盖层 |
| profile 目录 | `$DSH_HOME/profiles/web` | `$DSH_HOME/profiles/desktop`（CLI 拒绝访问） |
| 端口 | `webserver` 绑 `127.0.0.1:3080` | 无监听端口 |
| 浏览器 | `web-startup` + `web-runtime` 打印 URL、可自动打开 | 无 browser 启动；`dsh-app://` 由 Electron 提供 |
| 目录选择 | `directory-picker`（`@deepseek-ai/dsh-host-directory-picker-auto`） | disable 自动行，显式挂 `directory-picker-native` + `ui-directory-picker-native` |
| 运行时 patch 重载 | `patchReload: live`（用户层 HMR） | 无 `patchReload` 语义；profile 变更由 Electron 的包事务整体替换 |
| `agent-presets` | 挂载，`default: standard` | 同样挂载，`roots` 指向 dsh 安装内的 `config/agent-presets` |
| client 图 | `packages/client/` 经 `window.__DSH_BOOT__` | 复用同一套，由 Electron 的 `dsh-app://` 投递 |

## 与出网代理 note 的偏差

`desktop-host` **不安装出网代理**。`apps/desktop-host/src/index.ts:287` 调 `loadLayeredEnv('dsh desktop')`，`:289` 起把该环境交给 `boot()`（`:294` 经 `DSH_LAUNCH_ENVIRONMENT_KEY` 提供），全程没有调用 `installProxyFromEnvironment`；`apps/desktop/src/` 里也没有任何代理相关代码。仓库中该函数的非测试调用点只有 `apps/cli/src/profile-boot.ts:287`，即只覆盖 `dsh --profile …` 这条路径。

这与 note [`2026-08-27-outbound-proxy-policy`](../../.agents/notes/implemented/architecture/2026-08-27-outbound-proxy-policy.md) 的推论不符：note 由「`loadLayeredEnv` 只有一个调用者」推出「这一处就覆盖每个 profile」，而 `loadLayeredEnv` 现在有两个调用者（`apps/cli/src/bin.ts:35` 与 `apps/desktop-host/src/index.ts:287`）。可观察后果是 `.env` 层声明的代理对 desktop 不生效，Electron 内的模型与 web 请求走 Node 默认出网路径；note 未记录这一分歧。

## 源码入口

| 路径 | 角色 |
|------|------|
| `apps/desktop/` | Electron 壳：窗口与子进程生命周期、分帧字节管道、`dsh-app://`、保留 profile 所有权、插件 GUI、更新与回滚 |
| `apps/desktop-host/` | Electron 私有的 Node 子进程入口与组合覆盖层（不随公开 CLI 包发布） |
| `apps/desktop-host/config/desktop.cordis.patch.yml` | desktop 覆盖层全文 |
| `apps/desktop-host/src/index.ts` | `DESKTOP_PATCH`、`desktopPatches`、`boot('dsh desktop', …)` |
| `apps/desktop/src/paths.ts` | `$DSH_HOME/profiles/desktop` 与 Electron 私有 store |
| `apps/desktop/src/project-manager.ts` | `DESKTOP_PROFILE_BUNDLES`、seed 安装与插件 bundle 追加 |
| `apps/desktop/README.md` | 桌面应用的技术决策与安装归属 |
| `docs/architecture.md` | `## Application launch`（不含 Desktop）与 `## Desktop application` |
| `packages/boot/app-boot/src/profile.ts` | `loadProfileDirectory`（应用自有 profile 的装载原语） |
| `_digested/composition/04-profile-创建与保留名.md` | 保留名 `desktop` 的 CLI 拒绝点 |

依据 note（在 `implemented/`）：[`2026-08-25-electron-desktop-packaging-and-updates`](../../.agents/notes/implemented/architecture/2026-08-25-electron-desktop-packaging-and-updates.md)（保留 profile、`loadProfileDirectory` 用途、无监听端口）、[`2026-08-27-outbound-proxy-policy`](../../.agents/notes/implemented/architecture/2026-08-27-outbound-proxy-policy.md)。
