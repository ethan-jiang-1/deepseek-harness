# 参考资料与核验出处（FAQ 23）

本页集中汇总 FAQ 23 各篇引用的 DSH 仓库权威文档、源码路径与外部实测快照说明。

---

## 一、DSH 仓库权威源码与文档入口

### 1. Desktop 桌面壳、打包签名与发布更新
- [`apps/desktop/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md) — 桌面应用整体架构（`dsh-app://app/`、`ELECTRON_RUN_AS_NODE=1`、`127.0.0.1` 随机端口）、`Manage dsh Command…` 终端命令管理、内置 Python/Node/pnpm 离线载荷、窗口隐藏与退出任务排空检查、Nightly 自动更新轮询与恢复策略、壳级 `desktop/settings.json` 及已知限制。
- [`apps/desktop/packaging/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/packaging/README.md) 与 [`apps/desktop/scripts/package-target.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/scripts/package-target.ts) — 受支持的三个桌面发布目标（`mac-arm64 | mac-x64 | win-x64`）、明确排除 Linux（`"Linux is not a supported Desktop release target"`）及打包完整性检查。
- [`apps/desktop/windows-signing/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/windows-signing/README.md) — Windows EV 硬件令牌签名校验规则。
- [`apps/desktop/publishing/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/publishing/README.md) — 更新源目录结构（每次发版生成 `nightly.yml` / `nightly-mac.yml`，仅正式稳定版额外生成 `latest.yml` / `latest-mac.yml`）、固定安装包下载路径与上传审计记录。
- [`apps/desktop/src/paths.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/src/paths.ts) 与 [`apps/desktop/src/project-manager.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/src/project-manager.ts) — `$DSH_HOME/profiles/desktop` 路径归属、首次启动初始化与写锁控制。
- [`apps/desktop/src/login-shell-environment.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/src/login-shell-environment.ts) — 登录 Shell 环境合并策略（`LAUNCHER_OWNED_PREFIXES` 跳过覆盖已传入进程环境的 `DSH_*` 变量）。
- [`apps/desktop-host/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop-host/src/index.ts) — 桌面私有 Host 子进程启动入口。

### 2. CLI 启动器、Profile 四层组装与全局发布通道
- [`apps/cli/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md) 与 [`apps/cli/reference/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/reference/README.md) — 唯一应用启动器 `dsh` 的入口模式、`desktop` 保留名拒绝规则、四层配置叠加优先级（`bundle patches → profile cordis.patch.yml → $DSH_HOME/cordis.patch.yml → --patch`）、`--from-default-profile` 重置语义与 `--dump-config` 静态诊断。
- [`packages/boot/app-boot/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md) 与 [`packages/boot/config-editor/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/config-editor/src/index.ts) — Profile 启动加载、`.env` 环境读取以及设置页在目标行被 Home patch 或命令行 `--patch` 覆写时的保护报错。
- [`apps/web/tests/pin-browse-picker.overlay.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/pin-browse-picker.overlay.yml) — 最小 `--patch` 覆盖文件（禁用默认行并插入替代插件）的仓内实例。
- [`docs/user/guide/public-deployments.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/public-deployments.md) — 使用 `dsh web` 进行反向代理与远程部署的官方指南。
- [`.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md) — npm 三条独立发布序列与 `dist-tag` 映射规则（`alpha` / `canary` / `next` / `latest` 与显式 `--dist-tag` 覆盖）。
- [`docs/upgrade-guide/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/upgrade-guide) — 按目标版本号组织的破坏性变更迁移说明目录。

### 3. 插件管理、市场规范与 `$DSH_HOME` 数据布局
- [`packages/boot/plugin-manager/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md) — 插件安装/卸载/启停、发布版 `package@<version>` 与源码开发态 `link:` 源切换、双源回退（官方 npm 与 `npmmirror`）、pnpm 11 `pendingBuilds` 脚本审批、失败回滚及 `engines.dsh` 版本兼容与豁免机制。
- [`packages/client/ui-plugin-manager/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-plugin-manager/README.md) — 侧栏 Plugins 页面交互说明。
- [`docs/user/guide/plugin-market.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.md) — 自定义插件市场索引格式及官方不内置索引源（`"DSH ships no index source"`）的说明。
- [`docs/user/develop/basic/publish.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md) — 本地 `link:`、`.tgz` 与外部仓库安装验证方法。
- [`packages/util/home-paths/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/home-paths/src/index.ts) 与 [`packages/bundle/base/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml) — `resolveDshHome()` 解析规则与 `sessions/`、`storages/`、`attachments/` 等目录在 `$DSH_HOME` 下的挂载位置。

---

## 二、外部链接与实测快照说明

以下外部链接与时间点观测仅用于佐证发布产物现象、Electron 底层机制与社区讨论反馈，**观测日期不代表本语料当前源码基线**：

- **Electron 单实例锁源码依据**：[Electron `electron_api_app.cc` (`RequestSingleInstanceLock`)](https://github.com/electron/electron/blob/v44.7.0/shell/browser/api/electron_api_app.cc#L1064) — 单实例进程锁基于 `chrome::DIR_USER_DATA` 建立，因此指定独立 `--user-data-dir` 可实现多实例并行启动。
- **官方桌面安装包下载页与更新源实测快照（`2026-10-25`）**：
  - [DeepSeek 官方下载页](https://deepseek.com/en/download/)；固定安装包地址 `https://download.deepseek.com/desktop/dsh-latest-macos-arm64.dmg`、`dsh-latest-macos-x64.dmg`、`dsh-latest-windows-x64.exe`。
  - 当日探测 `dsh-desk/feeds/`：`mac-arm64/nightly-mac.yml` 与 `win-x64/nightly.yml` 均为 `0.2.1-rc.3`，`mac-x64/nightly-mac.yml` 为 `0.2.1-rc.1`，`latest-mac.yml` 返回 404（与尚未发布非 RC 正式版的规则一致）。
  - 当日 macOS 本机验证：使用最小测试 `.app` 验证 `open -g -n -a <app> --env ...` 未将自定义环境变量传入子进程，故隔离手册统一采用直接执行二进制或 `.command` 包装方案。
- **全局 CLI 包元数据实测快照（`2026-09-30`）**：实测 `npm view @deepseek-ai/dsh engines.node` 返回为空，因此 [`upgrade-dsh-global.sh`](./upgrade-dsh-global.sh) 内置了根 `package.json` 的 `^22.19.0 || >=24.0.0` 范围兜底检查。
- **社区讨论抽样快照（访问日期 `2026-10-25`）**：
  - [Hacker News: DeepSeek Harness Desktop for macOS and Windows](https://news.ycombinator.com/item?id=49929489)
  - [Hacker News: DeepSeek Harness developer preview](https://news.ycombinator.com/item?id=49285244)
  - [GIGAZINE 桌面版上线报道（2026-10-05）](https://gigazine.net/gsc_news/en/20261005-deepseek-harness/)

> 核验状态见 [核验基线登记](../00-baseline.md)。
