# 90 · 证据：DSH 源码与隔离实验

## C：DSH 当前合同

| 主题 | 来源 |
|---|---|
| 启动语法、profile、插件管理、Web 参数、关闭信号 | [`apps/cli/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md)、[`apps/cli/reference/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/reference/README.md) |
| 只有 named profile 是受支持启动、禁止 bin/demo | [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md#application-launch)、[`scripts/verify-application-entrypoints.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-application-entrypoints.ts) |
| profile 组合、模板、skipped bundles、fail loud | [`packages/boot/app-boot/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md) |
| 插件安装、版本兼容、exemptions | [`packages/boot/plugin-manager/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md) |
| app 参数解析与优先级 | [`packages/boot/cmdline/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/cmdline/README.md) |
| Web 端口/TLS/public-url/token | [`packages/bundle/web-app/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/README.md) |
| Desktop 壳、profile 独占、更新、运行时 | [`apps/desktop/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md) |
| SDK/ACP 是 profile，不是 bin | [`packages/sdk/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/sdk/README.md)、[`packages/acp/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/acp/README.md) |
| 包/发布合同、bundle vs plugin vs profile | [FAQ 24 包合同](../../02-package-contract.md)、[可发布形态](../../01-publishable-forms.md) |
| Desktop 打包/签名/更新 | [`apps/desktop/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md)、[Windows signing](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/windows-signing/README.md) |

## T：隔离 home 实验（2026-11-01）

所有实验使用 `DSH_HOME=$(mktemp -d)`，不碰用户 profile/Session。

| # | 命令 | 结果 |
|---|---|---|
| 1 | `pnpm dsh --help` | launcher 语法：`dsh [--profile] <name>`、`dsh plugin --profile`、dump flags；示例含 `dsh web`、`dsh headless`、`dsh tui` |
| 2 | `pnpm dsh --profile web --help` | web app 参数：`--host/--port/--tls-cert/--tls-key/--public-url/--trusted-host/--no-open`；`--port 0` 合法 |
| 3 | `--profile web --dump-default-config` | 初始化 `profiles/web/{package.json,cordis.patch.yml,cordis.yml,pnpm-workspace.yaml}`；bundles=base+web-app |
| 4 | profile patch 4123 + home patch 4124 + `--patch` 4125 | dump-config 依次显示 4124 → 4125；home 赢 profile，CLI overlay 最后 |
| 5 | 只写 `port`/`openBrowser` 的 patch | `webserver` required 失败：`$.host missing required value`；整份 config 被替换 |
| 6 | 写全 config、port 4133，启动 `--port 0` | 仍监听 4133；字面值让 `--port` 失效 |
| 7 | 默认 config，启动 `--port 0` | 监听 OS 分配端口，打印 `dsh web: http://127.0.0.1:<port>/?token=…` |
| 8 | `--dump-config --port 8080` | 拒绝：config dumps take no app arguments |
| 9 | `--profile desktop --dump-config` | 拒绝：profile 由 Electron 独占 |
| 10 | `--profile headless`（无任务） | 用例错误：需要 task |
| 11 | `--profile rescue --from-default-profile web`，加 marker，再换 `headless` | marker 被删，bundles 改为 base+headless；破坏性重置 |
| 12 | `dsh plugin --profile test list` | 初始化 base-backed profile；创建 patch/package/pnpm-workspace |
| 13 | `--profile sdk` / `--profile acp` + stdin EOF | 直接 exit 0；stdio surface 以连接生命周期为准 |
| 14 | `--profile plugin --dump-config` | 报 profile 不存在，提示用 `dsh plugin` 初始化 |
| 15 | `--profile web --from-default-profile headless` | 拒绝：shipped 名字不能作为自定义目标 |
| 16 | 本地最小 bundle（`package.json` 声明 `dsh.bundle.patch`，patch 为空）`dsh plugin --profile mini add /tmp/dsh-mini-bundle` | profile 初始化为 base；`dsh.profile.bundles` 含 `@tmp/dsh-mini-bundle`；dependency 为 `link:/tmp/...` |
| 17 | 同一 bundle 的 patch 写成裸 `- id: tmp-startup` | `--dump-config` 报 `patch: entry "tmp-startup" not found`；bundle 仍在 bundles，row 不存在 |
| 18 | patch 改为 `- insert:`，本地 startup 插件读 `ctx.cmdlineArgs` | row 出现并解析成 `file://.../index.js`；boot 后写出 `["--no-open","--port","0"]` |
| 19 | web profile 传 `--project board` | `error: unknown option '--project'`，exit 1 |
| 20 | disable `web-startup` + insert 发行版 provider（解析 `--project/--port/--no-open`，provide `webStartup`） | `--project board --no-open --port 0` 启动成功；插件收到 args，web 正常监听 |
| 21 | startup 插件 `workspaceController.create({path})` + `sessionController.create({workspaceId, agentPreset})` | workspace 注册；session 创建；`attachedSessionIds` 包含新 session；同路径 create 幂等 |
| 22 | 同一插件再试 `workspaceId` + `cwd` 同传、以及 `cwd` only | 同传报 `session.create accepts workspaceId or cwd, not both`；`cwd` only 成功建 session |
| 23 | 本地 bundle 声明 `engines.dsh: ">=9.0.0"`，`dsh plugin add` | 安装被拒：`installation rejected: ... incompatible with dsh 0.2.1-rc.3`；`nothing was installed`；给出 exact-version exemption 命令 |
| 24 | `dsh plugin --profile bad allow-version <pkg>@0.0.1 --dsh-version 0.2.1-rc.3 --accept-risk` 后再 add | 警告“可能破坏应用/数据”；记录 exact package + dsh version；add 成功，bundle 进入 roster |
| 25 | `npm pack` 本地 bundle → `dsh plugin --profile tarball add ./tmp-dsh-startup-0.0.1.tgz` | tarball 含 package.json/cordis.patch/插件文件；add 后 bundles 含该包；row 解析到 profile node_modules 内文件 |
| 26 | 发行版 provider 只实现 project/port/no-open，启动时传 `--public-url/--trusted-host`，再传不存在的 `--tls-cert/--tls-key` | 三组 flag 都被静默忽略；boot 打印 `http://127.0.0.1:<port>/`，无报错——替换 web-startup 漏实现即安全降级 |
| 27 | 完整 provider 解析 host/port/tls/public-url/trusted-host/no-open；启动 `--public-url https://app.example/ --trusted-host app.example`，再用自签证书启动 TLS | 打印 `https://app.example/...`；TLS 启动打印 `https://127.0.0.1:<port>/?token=…`，token URL 返回 303；状态文件含全部值 |
| 28 | 同一 provider 传 `--host 0.0.0.0` | provider 抛 `wildcard host is not supported`，startup failed；说明替换后要自己保留 shipped 的安全校验 |
| 29 | 全新 Playwright context 打开 Host 已 create 新 session 的 Web | UI 自动选中新建的 blank session；localStorage `dsh.sessions.current` 就是它 |
| 30 | 同一 profile：先预置 `dsh.sessions.current` 为旧 session，再 reload | UI 保持旧 session；新建 session 没有被自动选中 |
| 31 | 两个进程同时 `--profile race --from-default-profile web/headless --dump-default-config` | 两个都 exit 0；最终 profile 是一份完整副本（headless）；没有 staging 残留 |
| 32 | 装一个没有 `dsh.bundle` 的普通包：`dsh plugin --profile plain add /tmp/dsh-plain` | exit 0；dependency 写入；`dsh.profile.bundles` 仍只有 base；stderr：`declares no dsh.bundle — installed as a plain dependency, not a profile layer` |
| 33 | 在 home `cordis.patch.yml` 插入一个未安装的包行，启动 web | `--dump-config` 有行；启动 `warning: 1 entry did not activate` + `ERR_MODULE_NOT_FOUND`；**仍打印 token URL、服务照常起** |
| 34 | `dsh plugin --profile desktop list` | 拒绝：`profile "desktop" is managed exclusively by the Electron application`；CLI 不能管理 desktop profile |

## 社区样本的位置

社区 profile 交付的安装/启动样本已在 [34](../30-external/34-profile-delivery-forms.md)/[36](../30-external/36-profile-evidence-ledger.md) 按 `dsh plugin add` 的约定路径整理；本目录不再列非约定启动。需要对照时，只看它们如何把 bundle 装进 profile，不看自建 launcher。

## claim → evidence

| 断言 | 证据 | 级别 |
|---|---|---|
| 只有 named profile 是受支持启动 | architecture / CLI reference | C |
| `dsh plugin` 对自定义名只初始化 base | CLI reference + 实验 12 | C/T |
| `--from-default-profile` 是破坏性重置 | CLI reference + 实验 11 | C/T |
| patch 对 config 是整份替换 | CLI reference + 实验 5 | C/T |
| 字面值让 `--port` 失效 | 实验 6 | T |
| home patch 赢 profile，CLI overlay 最后 | 实验 4 | T |
| `dsh web --port 0` 打印 token URL | 实验 7 | T |
| SDK/ACP 在 stdin EOF 退出 0 | 实验 13 | T |
| `desktop` profile 由 Electron 独占 | CLI reference + 实验 9 | C/T |
| 本地最小 bundle 能进 bundles 列表 | 实验 16 | T |
| bundle patch 必须 `insert`，裸 id 是 override target | 实验 17 | T |
| startup 插件能读 app args 并写文件 | 实验 18 | T |
| web 自定义 flag 被 shipped web-startup 拒绝 | 实验 19 | T |
| 替换 web-startup 可以新增发行版 flag 并提供 webStartup | 实验 20 | T |
| startup 插件能 create workspace/session 并 attach | 实验 21 | T |
| `workspaceId` 与 `cwd` 互斥；`cwd` only 可建 session | 实验 22 | T |
| engines/peer 不匹配会拒绝安装，且 nothing installed | 实验 23 | T |
| exemption 只覆盖 exact package + dsh version | 实验 24 | T |
| 本地 tarball 可安装并解析 patch row | 实验 25 | T |
| 替换 web-startup 漏实现 web flag 会静默降级 | 实验 26 | T |
| 完整替换 provider 可复现 host/port/tls/public-url/trusted-host/no-open | 实验 27 | T |
| 替换后要自己保留 wildcard 拒绝等安全校验 | 实验 28 | T/C |
| Settings UI 的修改写入当前 profile patch | `packages/settings/README.md`：Changes persist through the active profile’s Cordis patch | C |
| Host create 不改变 Client 当前选择 | 返回用户保留 `dsh.sessions.current`；全新 context 实测自动选中新建 blank；selection 在 Client | T/C |
| 确定性选中要 client 调 `uiWorkspace.openSession` | `ClientSessions` 注释 + `uiWorkspace` 合同；未跑 client 插件 | C |
| 并发 `--from-default-profile` 最终留一份完整副本 | 实验 31 | T |
| 无 `dsh.bundle` 的包 exit 0 但 roster 不变 | 实验 32 | T |
| home 层能覆盖、不能供货；服务可带病运行 | 实验 33 | T |
| CLI 不能管理 `desktop` profile | 实验 34 + CLI reference | T/C |
| 应用内 Plugins 页是跨面安装入口 | DSH 源码：installBundle 无 profile 参数；web/Desktop 共用插件页 | C |

## 还没答案的问题

- client 启动插件如何拿到 Host 创建的 sessionId：自己调 remote `session.create`，还是 Host 暴露 ID？
- 替换 `web-startup` 后，shipped 侧新增或改义一个 web flag 时发行版怎么发现（目前只能升级时人工比对，没有运行时信号）？
- 自定义 TUI terminal app bundle 需要哪些 profile/参数契约？
- TUI 的官方边界：CLI 示例有 `tui` profile，但没有 shipped terminal app。
- 应用内安装在 Desktop 上的 `application`/`warnings`/`nextStep` 实际取值；本机没有 Desktop。
- Windows/macOS 安装器的签名、公证、自动更新最小实现，社区样本各自做到哪一步？
- 远程/手机网关的认证边界（token、cookie、配对码、隧道）是否有一致的威胁模型？

## 边界

- 本目录只采用 DSH 约定内的路径；非约定启动不作为对照对象。
- 实验只覆盖 DSH 仓库 checkout、macOS、scratch home；Windows/Linux 的路径、Desktop 壳、安装器没有跑。
- DSH 的启动合同以当前 DSH checkout 的 CLI/Desktop/app-boot 文档与源码为准；版本变化时回到对应 commit。
