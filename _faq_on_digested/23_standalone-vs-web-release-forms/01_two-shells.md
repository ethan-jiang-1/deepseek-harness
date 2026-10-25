# 01 · 先拆词：`standalone`、官方发布物，以及两者的分工

源码核验基线：工作树 `8d8940e6a3`（产品树 `687f282e86` / `dsh-v0.2.1-rc.2`）。本树与 `apps/` 目录结构一致。

## `standalone` 在本仓库是三个不相干的词

混用会让后面的判断全错，所以先分开：

| 说法 | 实际指 | 与「发布形态」的关系 |
|---|---|---|
| `sdk-minimal` 的 "standalone bundle" | 不叠 `dsh-base` 的独立树（[`docs/architecture.md`](../../docs/architecture.md) 的 `## Application launch`） | 无关：它是 profile，不是安装包 |
| session 的 "standalone events" | 不属于任何 turn 的日志事件（[`docs/subsystems/session.md`](../../docs/subsystems/session.md)） | 无关 |
| 独立安装的 **Desktop App** | `apps/desktop` 的 Electron 壳 + 私有 Host 子进程 | 本文讨论的桌面形态 |

## 官方发布物只有两个

`apps/` 下是 `cli`、`web`、`desktop`、`desktop-host`、`plugin-market-generator`。其中真正「装成一个可运行的应用」的只有两份产物（Python SDK 的 wheel 打包的是同一个 `dsh` 命令，不是另一种应用形态）：

1. **CLI / Web**：npm 包 `@deepseek-ai/dsh`，跑在你自己的 Node 上；`dsh web` 起浏览器界面，`dsh --profile headless/sdk/acp` 起别的入口。
2. **Desktop**：`macOS arm64/x64 + Windows x64` 的安装包，自带 Electron、Node、pnpm、Python 载荷。

`plugin-market-generator` 是市场索引的生成器，不是运行时发布物。

![两个官方发布物](./figures/01-two-shells.svg)

| | Desktop | CLI / Web |
|---|---|---|
| 打包物 | dmg/exe + 更新 feed；自带 Node/pnpm/Python；整棵 dsh runtime 进 asar | npm 包，无自带运行时 |
| 进程 | Electron 壳 + `desktop-host` 子进程，`127.0.0.1`，OS 分配端口 | `node` 进程直接跑 `dsh`，`dsh web` 默认 3080 |
| 谁执行安装 | 壳侧 bundled pnpm | 该 Host 的 pnpm（或 `dsh plugin …` 转发） |
| 插件落点 | `$DSH_HOME/profiles/desktop` | `$DSH_HOME/profiles/web`（或 headless 等） |
| 升级方式 | 应用内更新器 + feed | `npm i -g @deepseek-ai/dsh@latest`，整包替换 |

## 一条分界，四个推论

**Desktop 把运行环境一起打包了；CLI/Web 用的是你的 Node。** 这条分界能直接推出四件事：

1. **Desktop 不读你 nvm 里的全局 dsh**：它解析的是 `app.asar/dsh` 里那棵树，所以「全局 dsh 老了」不影响桌面，「桌面坏了」也不影响你终端里的 `dsh`。
2. **两者的升级节奏互不跟随**：桌面走 feed（当前只有 Nightly/RC），CLI 走 npm 的 `latest`；本机实测 CLI 停在 rc.2、桌面 feed 已是 rc.3。
3. **插件永远落在 profile，但落的是不同 profile**：`profiles/desktop` 与 `profiles/web` 各有自己的 `node_modules`、`pnpm-lock.yaml`、`cordis.patch.yml`。
4. **用户数据默认共享同一个 `$DSH_HOME`**：会话、凭据、工作区表、附件、缓存是「按 home」的，所以想让实验与生产彻底分开，得另做隔离（见 [06 篇](./06_desktop-lab-isolation.md)）。

后续：Desktop 的成熟度与三问见 [02 篇](./02_desktop.md)；社区读数见 [03 篇](./03_community.md)；安装途径见 [04 篇](./04_plugin-paths.md)。
