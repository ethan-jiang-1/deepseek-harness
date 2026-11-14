# 01 · Desktop 与 CLI/Web 各做到哪一步：架构分界、平台支持与社区反馈

很多人第一次看仓库里的 `apps/` 目录，会看到 `cli`、`web`、`desktop`、`desktop-host`、`plugin-market-generator` 五个子包，再加上文档里不时出现的 `standalone` 字样，容易搞不清官方到底发了几套软件。本篇把两份真实应用发布物的工程成熟度、操作系统边界、隔离关系和社区反馈一次摊开。

---

## 一、先拆清词：只有两份可安装应用，且共用同一版本号

首先排掉两个名称干扰项：

- **`sdk-minimal` 的“standalone bundle”**：指 [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md#application-launch) 里不依赖 `dsh-base` 的精简 SDK Profile 模板，不是独立安装包。
- **会话日志里的“standalone events”**：指 [`docs/subsystems/session.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md) 中挂在对话轮次之外的独立事件记录。
- **`plugin-market-generator` 与 Python wheel**：前者只是构建插件市场静态索引的工具；Python SDK 的运行包里面装的依然是同一个 `dsh` CLI 启动器。

真正面向用户分发、能“装成应用”的只有 **Desktop** 和 **CLI / Web（`@deepseek-ai/dsh`）**。两者并不是“桌面壳自己定一套版本号、内核另走一套”，而是遵循严格的**同版本整体发布**原则——[`apps/desktop/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md#key-technical-decisions) 明确写明 Electron 壳与 `@deepseek-ai/dsh` 永远保持完全相同的版本号，哪怕桌面壳一行代码没改，内核升级就是一次完整的 Desktop 发版。

两套壳在工程实现上的核心差异，在于**谁提供运行时底座**：

1. **Desktop 把整套运行环境全包圆了**
   - **渲染与通信**：Electron 主进程加载打包好的 `dsh-app://app/` 前端资源，子进程以 `ELECTRON_RUN_AS_NODE=1` 拉起共享的 Profile 运行器（`desktop-host`），默认监听 `127.0.0.1` 的操作系统随机端口（因此绝不会跟本地 `dsh web` 的 `3080` 端口撞车）。HTTP 与 WebSocket 请求经过主进程认证后转发给该 Host，渲染层拿不到任何裸文件系统、Shell 或原始 Electron IPC 权限。
   - **自带离线工具链**：安装包内嵌独立的 Node.js、pnpm 以及预装好 `numpy`、`pandas`、`python-docx`、`python-pptx`、`openpyxl`、`Pillow` 等依赖库的 Python 环境。首次触发 `load_workspace_dependencies` 工具时，这套环境会直接离线解压到 `$DSH_HOME/dsh-runtimes/dsh-primary-runtime` 下供 Office 技能和工作区脚本使用，完全不要求用户电脑装过 Node 或 Python。
   - **生命周期与更新闭环**：支持关闭窗口退驻后台（Windows 带系统托盘与首次隐藏提示，macOS 留驻 Dock）；按 `⌘Q` 或点退出前会向 Host 查询是否有运行中的智能体、排队消息或定时提醒并弹窗确认。后台按约 10 分钟（±20% 抖动，失败指数退避至 1 小时）轮询更新源；点重启安装前会先锁定新请求、排空在途任务，若停机或替换失败会自动恢复当前版本的 Host。
2. **CLI / Web 轻量复用你本机的 Node 环境**
   - 通过 `npm install -g @deepseek-ai/dsh`（或 `pnpm add -g`）装进你当前的 Node 环境（如 nvm 目录）。
   - `dsh` 是全仓库唯一受支持的 Node 应用启动器：敲 `dsh web` 在本机起 Web 服务（默认 `3080`）并用任意浏览器打开同一套前端界面；敲 `dsh --profile headless "任务"` 跑单次无头任务；敲 `dsh --profile sdk` 或 `acp` 则通过标准输入输出对接自动化客户端。
   - 需要跨机器远程访问、挂 TLS 证书或接反向代理时，只能用 `dsh web`（支持 `--host`、`--port`、`--public-url`、`--trusted-host` 等参数），Desktop 明确不做对外监听。

---

## 二、操作系统与芯片架构支持边界

Desktop 的打包与发布流水线（[`apps/desktop/packaging/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/packaging/README.md)、[`apps/desktop/scripts/package-target.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/scripts/package-target.ts)）把官方支持目标硬性限定在三个值：`mac-arm64`、`mac-x64`、`win-x64`。各平台真实可用状态如下：

| 平台与架构 | Desktop 官方支持 | 工程细节与使用建议 |
|---|---|---|
| **macOS Apple Silicon（`mac-arm64`）** | ✅ 主力同步跟版 | 官方下载页标注需 macOS 13+；完成 Apple 签名、公证与 Hardened Runtime（含麦克风系统权限声明）；自动更新走 `zip` + `nightly-mac.yml`，首次安装走固定地址 `dsh-latest-macos-arm64.dmg` |
| **macOS Intel（`mac-x64`）** | ✅ 支持，但发版偶有滞后 | 同样提供固定下载包 `dsh-latest-macos-x64.dmg` 与签名公证（附带 Rosetta 所需可执行内存权限），但构建推进可能慢于主力（例如 `2026-10-25` 实测快照中，`mac-arm64` 与 `win-x64` 更新源已同步至 `0.2.1-rc.3`，而 `mac-x64` 仍停在 `0.2.1-rc.1`） |
| **Windows x64（`win-x64`）** | ✅ 主力同步跟版 | 采用硬件令牌（EV）对全部可执行文件与 `.dll`/`.pyd` 逐一签名校验；NSIS 安装器限制当前用户目录安装，卸载器会清理 `%APPDATA%` 下的 Electron 数据与更新缓存，但**绝不触碰 `~/.dsh`（或 `DSH_HOME`）里的用户数据** |
| **Windows on ARM（`win32-arm64`）** | ❌ 无原生包 | 解包开发态虽能启动窗口，但内置的 Python 依赖载荷固定为 `x64`，调用 `load_workspace_dependencies` 时可能因架构校验（对比载荷架构与宿主 `process.arch`）被拒绝 |
| **Linux（全架构）** | ❌ 明确不支持 | 打包文档直接写明 `"Linux is not a supported Desktop release target"`，无打包上传脚本也无更新源（`electron-builder-config.mjs` 里残留的 `AppImage` 配置段只是未接线的构建模板）。**Linux 用户请直接使用 `@deepseek-ai/dsh` + `dsh web`**，除缺少原生托盘、自动更新器和随包 Office Python 载荷外，核心 Agent 与插件能力完全一致 |

### 关于更新通道的一个常见误会

有人探测 `https://download.deepseek.com/dsh-desk/feeds/mac-arm64/latest-mac.yml` 看到返回 404，会怀疑是不是更新服务配坏了。其实 [`apps/desktop/publishing/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/publishing/README.md#publish-feeds) 把规则写得很清楚：**每次发版都会发布 `nightly.yml` / `nightly-mac.yml`（当前打包版客户端默认轮询的也是这个固定通道），而 `latest.yml` / `latest-mac.yml` 只有在发布正式稳定版（非预发布版）时才会一并生成**。在 `0.x-rc` 预览阶段，没有 `latest-mac.yml` 是符合预期的。

---

## 三、Desktop 与全局 CLI 共存：哪里天然隔离，哪里默认互通？

在同一台电脑上既用 nvm 装了全局 `@deepseek-ai/dsh`，又装了 Desktop 应用，两者的关系可以精确切分为两层：

1. **可执行层、插件依赖与界面设置：完全独立**
   - Desktop 跑自己的 `app.asar/dsh` 和内置 pnpm，独占 `$DSH_HOME/profiles/desktop` 及它的写锁；全局 `dsh web` 跑 nvm 里的包，读写 `$DSH_HOME/profiles/web`。两边升级互不跟随，在一边装坏了插件也绝不会连累另一边。
   - **应用设置也是按 Profile 分开的**：虽然 [`apps/desktop/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md#known-limitations) 的已知限制里有一句旧表述把 `settings` 列在共享项里，但按当前源码实现，前端设置面板（`configEditor`）实际读写的是各自 Profile 下的 `profiles/<name>/cordis.patch.yml`（`$DSH_HOME` 根下只剩早期版本迁移后留下的 `.imported` 标记）。因此改 Desktop 的设置不会改动 `dsh web` 的设置。
   - **唯一需要注意的命令行开关**：Desktop 菜单里的 `Manage dsh Command…` 会在 macOS 创建 `/usr/local/bin/dsh`（或在 Windows 写入用户 `PATH`），把终端里的 `dsh` 指向桌面端内置运行时。如果你不想让它盖过 nvm 里的 `dsh`，别点安装，或者点 `Remove` 即可无损恢复原状。
2. **用户数据层（`$DSH_HOME`）：默认共享**
   - 只要没改环境变量 `DSH_HOME`，两边默认都指向 `~/.dsh`，共同读写里面的会话历史（`sessions/`）、API 密钥与登录凭据（`.credentials.yaml`）、工作区注册表（`storages/workspace.json`）以及二进制附件（`attachments/`）。
   - 对大多数把 Desktop 和 CLI 当作“同一个工作台的两种入口”的用户来说，这种互通正是想要的效果；但如果你想拿其中一边当“不怕搞坏的插件实验室”，就必须按 [`03-isolated-lab-and-cli-upgrade.md`](./03-isolated-lab-and-cli-upgrade.md) 拆开两个根目录。

---

## 四、社区真实反馈：认可什么，抱怨什么？

结合 GitHub 生态数据与 Hacker News 上的两轮热门讨论（开发者预览贴与桌面版上线贴，以下量化读数均为 `2026-10-25` 实测快照，仅反映当时热度量级：仓库约 26 万 Star、npm `@deepseek-ai/dsh` 周下载约 33.3 万次、GitHub 带 `dsh-plugin` 标签仓库逾 2.2 万个），真实用户对这两份发布物的评价高度集中：

- **最受认可的两点**：
  1. **降低日常启动门槛**：重度用户在保持同一套 Harness 能力的前提下，把“开终端敲命令起服务”变成了“点一下 Dock 图标直接干活”，并且遇到缺顺手小功能（比如快捷键缩放字号）第一反应就是直接让内置 Agent 写个插件补上。
  2. **架构可塑性高**：技术讨论里评价最高的是底层的全插件化 Cordis 组装模型，不少人把它比作“Agent Harness 里的 Emacs”。
- **吐槽最集中的三件事**：
  1. **桌面端默认开启产品分析遥测**：[`apps/desktop/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/README.md#application-overview) 写明桌面端启用了遵循收集策略的产品分析（提供界面实时开关，而纯 `dsh web` 默认不包含该遥测）。在意这一点的用户除了在设置里关掉，也常在首次启动前直接往 `$DSH_HOME/cordis.patch.yml` 写入禁用规则（具体写法见 [`02` 篇](./02-plugin-install-and-dev-bypass.md)）。
  2. **Electron 体积与资源占用争议**：300 MB 级的安装包（含完整 Node + Python 科学计算与文档依赖库）让偏爱轻量原生应用的开发者觉得笨重——这类用户直接退回 `dsh web` 即可避开 Electron 开销。
  3. **官方不内置插件市场带来的找包与信任成本**：由于官方坚持不内置中心化市场源（`"DSH ships no index source"`），社区自发长出了多个第三方插件目录站与 JSON 索引源，质量参差不齐。保守用户倾向于只开官方按需组件（On-demand Official）或用 Creator 模式让模型在本地自写自用，而不轻易安装陌生第三方包。

> 核验状态见 [核验基线登记](../00-baseline.md)。
