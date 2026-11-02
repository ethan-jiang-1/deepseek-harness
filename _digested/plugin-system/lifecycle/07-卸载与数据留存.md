# 卸载与数据留存：删掉什么、留下什么

## 一句话

插件卸载只回收**代码与 patch 层**。数据、Session 历史、Workspace 注册、凭据、设置，一律不随插件消失——DSH 没有统一的数据卸载契约，末节说明这条空白的形状。所以「移除」这个词在插件管理面上只指包与层，不指数据。

## 三个拒绝，四种动作

`removeBundle`（`packages/boot/plugin-manager/src/index.ts:686`）先过三道闸，再按固定顺序做四件事。

**三道拒绝**：

| 错误码 | 触发条件 |
|--------|----------|
| `not-removable` | bundle 不存在，或它标记为不可移除（管理组件、随装出货的可选档） |
| `stop-profile` | 没有 HMR，且该 bundle 撑起了当前进程（启动时就在跑，或它的行还有活 fiber） |
| `bundle-in-use` | 取消选择并重载之后，仍有一行贡献处于活动状态 |

**四种动作，顺序不可交换**：

```text
1. 从 dsh.profile.bundles 取消选择，重载（插件停掉、行离开树）
2. 确认没有贡献还活着
3. pnpm remove
4. 发布新的运行时解析表（无 HMR 且有启动 bundle 仍在跑时跳过）
```

第 1、2 步合起来就是文档所说的「卸载运行时贡献」：重载完成停用，随后再确认一次。这样 `pnpm remove` 动文件系统时，树上已经没有指向这些模块的行。

`pnpm remove` 有一个 registry 细节：它不认 `--registry` 选项，只认通用配置项，而 pnpm 会拿默认 registry 校验 lockfile 里的 tarball URL。所以移除一个从别的 registry 装来的包，会失败在 `ERR_PNPM_TARBALL_URL_MISMATCH`。实现的处理是记住「本进程从哪个 registry 装的这个包」；进程启动前就已安装的包，用「安装时先问的那个 registry」。

## 失败停在哪

- **任一步失败就停在失败的那一步**，保留已完成的部分，保留剩余依赖供重试，**不重新启用该 bundle**。
- `pnpm remove` 失败不恢复到「已选择」状态；发布失败也不把删掉的包装回来。
- 恢复路径只重写两个快照文件（`package.json` 与 `pnpm-lock.yaml`）。

于是「半卸载」是合法终态：层没了、包还在。用户重跑一次移除，或者回到启用。

## 退休 bundle 是特例

`RETIRED_BUNDLES`（`packages/boot/app-boot/src/profile.ts:206`）记录产品已经不再发布、但用户 profile 里可能还留着的名字——目前一条：`@deepseek-ai/dsh-experimental-schedule-bundle`，Schedule 改由 Web 组合自己挂载。

它们的移除**只做第一步**：从选择列表里去掉，不跑 pnpm。名字既不在依赖里、也不在安装里，`pnpm remove` 无事可做。`loadProfileDirectory` 装载时也会清掉退休成员（`packages/boot/app-boot/src/profile.ts:676` 的 `dropRetiredBundles`），只有列表里确实有它时才回写清单——装载因此可能改动磁盘。

## 留下的到底是什么

| 留下的东西 | 位置 | 谁负责清理 |
|------------|------|------------|
| 用户 `cordis.patch.yml` | profile 目录 | 用户自己 |
| 诊断日志 | `<profile>/.plugin-manager/logs/` | 用户自己 |
| pnpm 下载的残留文件 | `node_modules`、pnpm store | `node_modules` 由下一次包操作 prune；全局 content-addressed store 不会随安装清理，需要 `pnpm store prune` |
| 插件自己写的数据 | 取决于插件 | **没有机制** |
| Session 历史 | Harness home | Session 生命周期，与插件无关 |
| Workspace 注册 | Harness home | workspace 服务 |
| 设置 | 活跃 profile 的 patch / 插件的存储域 | 各服务的 owner |

最后三行是这个页面最重要的部分：**插件是代码的交付单位，不是数据的交付单位**。

## 整个应用卸载时

desktop 的 Windows 卸载器是唯一一个明确写了「删什么」的实现（这套行为只在 Windows 生效）：

- 删：Electron 的 user-data 目录（浏览器存储与缓存）、`%APPDATA%` 下的产品目录、`%LOCALAPPDATA%` 下的更新下载缓存，以及卸载后 `%APPDATA%` 下变空的作用域目录。
- **不删**：Harness home（`~/.dsh` 或 `DSH_HOME`）——Session、设置、凭据、插件都在那里。若 `DSH_HOME` 作为 Windows 环境变量发布，卸载器还会额外保护任何与它重叠的目标。
- 原地更新（`--updated`）与 `/KEEP_APP_DATA` 连上面那些 Electron 数据也保留。

移除动作走原生 helper，它拒绝受保护的 Windows 目录与和安装路径或 home 重叠的路径、要求固定本地盘、保留 linked root、不进入 reparse point 的目标、锁住的文件跳过但继续删兄弟节点。残留不阻止卸载，也不上报。

## 一条诚实的空白

DSH 没有「插件卸载时清理自己的数据」的契约：没有反注册钩子，没有数据归属声明，没有配额与按插件 id 隔离的数据根。

- 想让数据随插件消失，必须在卸载动作发生时由宿主回调插件——DSH 没有这个调用点。
- 想让数据在重装后延续，反而是默认行为。

设计新的插件数据面时，必须把这个不对称写进自己的文档，而不是假设宿主会代劳。

## 收束：七段的全貌

到这里七段走完了。回头看，整条链只有一个贯穿的立场：**DSH 只在拥有所有权的边界上准入与撤销**。版本门在写依赖前拒绝，坏配置在挂树前拒绝，运行中的替代靠 effect 撤销，卸载回收代码而放过数据。越过这些边界的部分——构建脚本、插件自己的数据、外部 provider 的进程——由各自的 owner 承担，宿主只报告，不代管。这是本专题的归纳读法，不是某一份文档的原话；机制证据在各页的锚点里。

回到 [`00-map.md`](./00-map.md)。

## 自证配方

```sh
dsh plugin --profile <p> list                 # 移除前：bundle 在列表里
dsh plugin --profile <p> remove <bundle>      # 移除
dsh plugin --profile <p> list                 # 移除后：不在列表里
ls -la "$DSH_HOME"                            # 数据目录仍在
```

判据：移除只改 `package.json` 的依赖与 `dsh.profile.bundles`；`cordis.patch.yml`、Session、Workspace 注册与插件数据都不动。若你以为删了但 `$DSH_HOME` 里还在，那不是 bug，是设计。
