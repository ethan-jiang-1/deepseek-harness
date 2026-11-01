# 90 · 证据：DSH 源码与隔离实验

## C：DSH 当前合同

| 主题 | 来源 |
|---|---|
| 启动语法、profile、插件管理、Web 参数、关闭信号 | [`apps/cli/README.md`](../../../apps/cli/README.md)、[`apps/cli/reference/README.md`](../../../apps/cli/reference/README.md) |
| 只有 named profile 是受支持启动、禁止 bin/demo | [`docs/architecture.md`](../../../docs/architecture.md#application-launch)、[`scripts/verify-application-entrypoints.ts`](../../../scripts/verify-application-entrypoints.ts) |
| profile 组合、模板、skipped bundles、fail loud | [`packages/boot/app-boot/README.md`](../../../packages/boot/app-boot/README.md) |
| 插件安装、版本兼容、exemptions | [`packages/boot/plugin-manager/README.md`](../../../packages/boot/plugin-manager/README.md) |
| app 参数解析与优先级 | [`packages/boot/cmdline/README.md`](../../../packages/boot/cmdline/README.md) |
| Web 端口/TLS/public-url/token | [`packages/bundle/web-app/README.md`](../../../packages/bundle/web-app/README.md) |
| Desktop 壳、profile 独占、更新、运行时 | [`apps/desktop/README.md`](../../../apps/desktop/README.md) |
| SDK/ACP 是 profile，不是 bin | [`packages/sdk/README.md`](../../../packages/sdk/README.md)、[`packages/acp/README.md`](../../../packages/acp/README.md) |
| 包/发布合同、bundle vs plugin vs profile | [FAQ 24 包合同](../../24_plugin-publish-and-agent-data-planes/02-package-contract.md)、[可发布形态](../../24_plugin-publish-and-agent-data-planes/01-publishable-forms.md) |
| Desktop 打包/签名/更新 | [`apps/desktop/README.md`](../../../apps/desktop/README.md)、[Windows signing](../../../apps/desktop/windows-signing/README.md) |

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

## 社区样本的位置

社区 profile 产品的安装/启动样本已在 [34](../30-external/34-profile-product-forms.md)/[36](../30-external/36-profile-evidence-ledger.md) 按 `dsh plugin add` 的约定路径整理；本目录不再列非约定启动。需要对照时，只看它们如何把 bundle 装进 profile，不看自建 launcher。

## 还没答案的问题

- 自定义 TUI terminal app bundle 需要哪些 profile/参数契约？
- TUI 的官方边界：CLI 示例有 `tui` profile，但没有 shipped terminal app。
- Windows/macOS 安装器的签名、公证、自动更新最小实现，社区样本各自做到哪一步？
- 远程/手机网关的认证边界（token、cookie、配对码、隧道）是否有一致的威胁模型？

## 边界

- 本目录只采用 DSH 约定内的路径；非约定启动不作为对照对象。
- 实验只覆盖本仓库 checkout、macOS、scratch home；Windows/Linux 的路径、Desktop 壳、安装器没有跑。
- DSH 的启动合同以当前 checkout 的 CLI/Desktop/app-boot 文档与源码为准；版本变化时回到对应 commit。
