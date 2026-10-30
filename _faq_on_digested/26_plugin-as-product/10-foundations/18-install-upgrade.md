# 18 · 安装、升级与卸载：产品实例的生命周期

## 这一篇回答什么

标题里承诺了"安装"：一个产品型实例怎么出现、装了什么、哪些变更要重启、兼容性怎么判、升级时哪三层要分别处理、卸载后会留下什么。这一篇把这些收口。

## 安装：profile 是怎么出现的

```sh
dsh plugin --profile <name> add <bundle-package>
```

- profile 缺失时先初始化：五个随附模板名（`acp` / `web` / `headless` / `sdk` / `sdk-minimal`）用自己的 bundles；**其他名字只有 `@deepseek-ai/dsh-base`**。所以自定义产品 profile 要把 `@deepseek-ai/dsh-web-app` 也加进 bundles，才复现 Web 组合。**C**
- 命令把参数转发给 pnpm，profile 目录是工作目录；`add`/`remove`/`update`/`why` 都可用。**C**
- 每次成功后，`dsh.profile.bundles` 按安装状态重算：声明了 `dsh.bundle.patch` 的依赖进层叠，没有声明的只留作普通依赖并给一次警告。**C**
- bundle 名解析有两个锚点：先 dsh 安装自身，再 profile 的 `node_modules`。**C**
- **没有 `extends: web` 这种继承**：复现某组合的唯一方式是照它的 bundles 顺序列一遍；产品 bundle 放最后，才能按 id 覆盖前面的行。

分发形态三选一（详见 [24](../../24_plugin-publish-and-agent-data-planes/answer.md)）：只发 bundle 包、只发 patch 片段、或自带壳（Desktop 就是自己 `loadProfileDirectory` + `runProfile` 的先例）。

## 变更边界：什么要重启、什么热重载

| 变更 | 生效方式 | 依据 |
|---|---|---|
| bundle 成员（add / remove / update） | **必须重启该 profile**：运行中的实例保留启动时的 bundle 集合 | **C** |
| profile / home 的 `cordis.patch.yml` | 启用 HMR 时热重载；否则下次启动 | **C** |
| `dataRoot` 下的账本与全局设置 | 插件自己读，保存即生效 | **C** |
| workspace 登记 | 立即（registry 写入） | **C** |

产品升级最常见的坑：以为 `update` 完就生效。**bundle 层变化一定重启**；只有用户 patch 的编辑才是热重载。

## 兼容：`engines.dsh` 与豁免

- bundle 可以在 `package.json` 里声明 `engines.dsh`；不匹配或读不出时，**跳过这个 bundle**，在 stderr 打 `skipping profile bundle ...`，profile 仍然启动。**C**
- 这是"降级启动"而不是数据损坏：会话、凭据、账本都还在，但产品可能少了几行插件。
- 豁免通道：`dsh plugin --profile <name> allow-version <pkg@version> --dsh-version <exact> --accept-risk`；`version-exemptions` 查看，`revoke-version` 撤销。**C**
- 产品侧要做的：把 `engines.dsh` 写进 manifest，别让用户靠猜。

## 升级：三层分别处理

| 层 | 怎么升 | 风险 |
|---|---|---|
| **组合** | `dsh plugin update` 或升级 dsh 本身 | 成员变化要重启；旧 bundle 可能被跳过 |
| **配置** | 对比新旧 bundle patch，把差异合并进 profile patch | patch 是整对象替换：只写一个键会丢其余默认值（见 [17](./17-config-layers.md)） |
| **数据** | `dataRoot` 的 `schemaVersion`、workspace 内容 | 版本不符 fail loud；迁移必须自己写 |

纪律：

1. **升级不改写用户的 profile patch**（`dsh plugin` 只维护 `package.json` 与 bundles）。
2. **升级不静默重建数据**：版本不符要么迁移，要么报错。
3. 升级前备份 profile patch 与 `dataRoot`；回滚按同样的三层次序做。

## 卸载：四处残留

| 残留 | 位置 | 谁清 |
|---|---|---|
| workspace 登记 | `$DSH_HOME/storages/workspace.json` | 用户或产品：`delete` 只删登记，目录与会话不动 |
| 账本与全局设置 | `$DSH_HOME/<plugin>/` | 卸载说明必须列出这个路径 |
| 目录内 marker / 脚手架 | 用户目录 | 说明里写清哪些文件是产品写的 |
| profile patch 里的行 | `profiles/<name>/cordis.patch.yml` | `dsh plugin remove` 只动包；用户自己的 patch 要手删，否则剩下 unmatched 行 |
| 会话 | `$DSH_HOME/sessions` | **没有删除 API**；只能归档 |

`dsh plugin remove` 会移除依赖并从 bundles 列表里去掉；bundle 自己层里的行随层消失，**但用户复制到 profile patch 里的行不会自动消失**——每次启动会报 unmatched 目标。

## 失败与半装

| 失败点 | 发生什么 | 产品要做什么 |
|---|---|---|
| 安装失败 / 取消 | `package.json` 与 `pnpm-lock.yaml` 回滚到 pnpm 前的快照；`node_modules` 里可能留下下载文件 | 重试前先读 profile 的实际状态，不要假设"没装" |
| `engines` / peer 不满足 | 在 pnpm 之前就拒绝，不下载、不跑构建脚本 | 把 `engines.dsh` 写清楚，别让用户走到这一步 |
| git / tarball 装后判定失败 | 恢复 manifest 与 lockfile 并重装恢复后的状态；持久化日志在 `.plugin-manager/logs` | 让用户先看到日志路径，再决定是否重试 |
| 移除失败 | 依赖可能处于半改状态 | 不要让"remove"成为唯一清理路径；文档给手动步骤 |
| 启动时 bundle 被跳过 | profile 仍启动，产品少几行插件 | 在 README 写"看到 skipping profile bundle 时怎么查" |

**半装不是罕见情况。** 产品要能回答："用户看到界面一半功能没了，第一步查哪里？"答案通常是 `dsh --dump-config` 加上 stderr 的 skipping 行。

## 回滚演练

升级前按三层备份，回滚按相反顺序：

```text
组合：profiles/<name>/package.json + pnpm-lock.yaml（或 bundle 版本号）
配置：profiles/<name>/cordis.patch.yml
数据：$DSH_HOME/<plugin>/（整个 dataRoot）
```

- 回滚 bundle：把版本钉回旧值并重装；bundle 成员变化后重启。
- 回滚配置：还原 patch；若产品写过 patch（不应该），以备份为准。
- 回滚数据：只在升级已经改过 `dataRoot` 时做；先停 Host，再换目录。
- 每次回滚后用 `dsh --dump-config` 确认组合回到旧形状。

## dataRoot 迁移

1. 文件里必须有 `schemaVersion`；
2. 升级时先备份整个 `dataRoot`；
3. 版本不符：要么执行一次性迁移（写迁移标记、失败可重试），要么 **fail loud**；
4. **绝不静默重建**——空账本会让"项目丢了"看起来像"产品正常"；
5. 用一份 `dataRoot` 副本演练迁移，再在真实目录上跑。

## 卸载验收

- [ ] workspace 登记已删（`delete` 只删登记，目录还在）
- [ ] `$DSH_HOME/<plugin>/` 已删或明确保留
- [ ] 目录内产品写的文件（marker、脚手架）已列出并清理
- [ ] profile patch 里没有剩下指向已卸载 bundle 的行（否则每次启动报 unmatched）
- [ ] 会话已归档；**不要**物理删 `sessions/`
- [ ] `.plugin-manager/logs` 与下载残留已说明

## 检查清单

- [ ] `engines.dsh` 已声明，且与目标 dsh 版本范围一致
- [ ] 产品 bundle 排在 bundles 列表最后，能覆盖 base/web-app 的行
- [ ] 文档写了"装完之后要重启"（bundle 成员变化）
- [ ] 升级路径覆盖组合、配置、数据三层
- [ ] `dataRoot` 有 `schemaVersion` 与迁移或明确的 fail loud
- [ ] 卸载说明列出 workspace 登记、`dataRoot`、目录内文件、profile patch 四处
- [ ] 不在升级时改写用户的 profile patch，不在卸载时物理删会话日志

## 边界

- 只讨论单机、单 `$DSH_HOME`；多机同步、私有 registry 的运维不在本篇。
- 安装第三方 bundle 的构建批准（pnpm `allowBuilds`）属于安装器细节，见 [CLI 参考](../../../apps/cli/reference/README.md)。
- 保留 profile 名 `desktop` 由应用自己拥有，不走 `dsh` 的插件命令。
