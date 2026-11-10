# 20 · 安装路径：运行时从哪来，profile 怎么初始化

## 运行时来源

| 来源 | dsh 从哪来 | profile 在哪 | 更新归谁 | 代价 |
|---|---|---|---|---|
| npm 全局 | `@deepseek-ai/dsh` | `$DSH_HOME/profiles/<name>` | 用户/发行版 updater 跑 npm | 需要 Node；全局版本漂移；多副本 |
| 官方 Desktop | 应用内置 `resources/app.asar/dsh` | `profiles/desktop`（Electron 独占） | Desktop Nightly feed + 签名安装器 | 不能换 dsh 版本；CLI 不能 boot |
| Python wheel | wheel 内置 `dsh` CLI | 显式 `DSH_HOME` 的 profile | Python 包/发行方 | SDK/ACP 为主；同一 runtime 也打包 `dsh web` 资产，但不是 Python 侧默认用法 |
| 源码树 | `pnpm dsh`（tsx） | 同一个 home | 开发者/发行方 | 需要 build；缺前端会启动失败 |

这四种来源共用同一套 profile 组合和同一个 `dsh` launcher；差别是**谁提供运行时、谁负责版本与签名**。容器/镜像属于部署包装，见 [60](./60-packaging.md)。

![四种运行时来源与容器部署](./figures/20-install-ownership.svg)

## 安装状态机

安装不是“跑完 add 就结束”，而是五个检查点：运行时 → profile → bundle → dump → boot。每一步都有独立读回；失败停在该步，不要用一个 exit code 代表全部。

![安装状态机：五个检查点](./figures/20-install-sequence.svg)


## 安装通道

| 通道 | 谁执行 | profile 从哪来 | 跨面吗 |
|---|---|---|---|
| 应用内 Plugins 页 / `plugin_manager` 工具 | 正在运行的宿主 | **当前 profile，无参数** | **是**：web 与 Desktop 同一句 |
| `dsh plugin --profile <p> …` | CLI，转发 pnpm | 显式指定；首次自动初始化 | 面绑定：可管理 web/headless/sdk 等，不能 `desktop` |
| Electron carrier | Desktop | 只能它碰 `desktop` | 否：第三方拿不到 |

对 web/Desktop，默认安装写应用内 Plugins 页；headless/SDK/ACP 没有 Plugins 页，用 CLI 显式 profile。CLI 不能管理 `desktop`。**不要在安装说明里只写 `--profile web` 而不提 Desktop**：Desktop 用户会装进 `profiles/web`，App 用 `profiles/desktop`，报告成功但界面没有。

“装成功”有三个独立状态（pnpm 成功 / dependency 写入 / 进入 `dsh.profile.bundles`），只有第三个让功能存在；状态判据的完整机制见 [18](../10-foundations/18-install-upgrade.md)。无 `dsh.bundle.patch` 的包，CLI 通道 exit 0、roster 不变、只给一句 stderr warning；应用内通道以 `not-bundle` 失败并回滚 manifest（实验见 [90](./90-evidence.md)）。

## profile 初始化

| 入口 | 行为 |
|---|---|
| 应用内 Plugins 页 | 当前 profile 已存在；装 bundle 只改该 profile 的依赖与 `dsh.profile.bundles` |
| 首次 boot/dump shipped profile | 从模板自动初始化：`web`=base+web-app（live patches），`headless`=base+headless，`sdk`=base+sdk-app，`sdk-minimal`=standalone，`acp`=base+acp-app（后四者 startup-only） |
| 自定义 profile 缺失 | 失败并提示 `dsh plugin --profile <name> add <package>` |
| `dsh plugin --profile <name> …` | 缺失时初始化 base-backed profile，再转发 pnpm |
| `--from-default-profile <template>` | 用 shipped 模板替换自定义 profile；删除原依赖与用户 patch；staging + previous 恢复；shipped 名字不能当目标 |
| `--dump-*` | 初始化缺失的 profile 文件，再打印组合 |

`--from-default-profile` 是**破坏性重置**，不是升级：新 manifest 的 dependencies 为空、用户 patch 为空，模板后续变化不会回写。

注意：`dsh plugin` 对自定义名字只初始化 **base**；Web/SDK/ACP 发行版要么首次用 `--from-default-profile <template>` 建 profile，要么显式把对应 app bundle 加进去。不要用 base-only profile 期待 Web 界面。

## bundle 安装（CLI，面绑定）

应用内 Plugins 页是默认安装路径；CLI 是面绑定自动化：可管理显式非 `desktop` profile，面向 GUI 时只作 web 自动化。

```sh
dsh plugin --profile <name> add <package-or-git-spec>
dsh plugin --profile <name> list
dsh plugin --profile <name> remove <package>
```

- 命令把参数转发给 profile 目录里的 pnpm；`add`/`remove`/`update`/`why` 等 pnpm verb 都可用，pnpm 必须在 PATH。
- 相对路径 spec 以调用目录为锚；`add .` 装的是当前 checkout。
- 每次成功后按已安装依赖 reconcile `dsh.profile.bundles`：声明 `dsh.bundle.patch` 的包进入层栈，无声明的只是普通依赖，移除依赖则退出层栈。
- **bundle membership 变化要重启 profile**；普通 profile/home patch 的改动可被 HMR 应用。本地 bundle 同样走 `dsh plugin add /path`，声明了 `dsh.bundle.patch` 就会进入 bundles 列表（实验见 [90](./90-evidence.md)）。
- git 源安装会跑 `prepare`，pnpm ≥10 需要 `allowBuilds` 允许；built tarball/local checkout 不需要。
- 安装和启动都校验 `engines.dsh` 或 DSH peer range；不兼容要显式 exact-version exemption。

### bundle patch：insert 还是 override target

发行版 bundle 的 patch 里，裸 `- id: …` 是 **override target**，不是新增 row。目标不存在时 `--dump-config` 只报：

```
patch: entry "tmp-startup" not found
```

此时 bundle 仍在 `dsh.profile.bundles`，看起来“装上了”，但 row 不存在、插件不跑。新增 row 必须写 `- insert:`：

```yaml
- insert:
    - id: acme-startup
      name: './startup.js'
```

实测：裸 id 无 row；改成 insert 后 row 出现并解析成 `file://…/startup.js`，插件在 boot 时读到 args。**bundle 在 roster ≠ patch 生效。**

### 版本门与 exemption

bundle 声明 `engines.dsh`/peer 范围后，安装和启动都会校验。不匹配时 `dsh plugin add` **在安装前拒绝**：

```
installation rejected: Plugin ... is incompatible with dsh 0.2.1-rc.3:
requirements {"engines.dsh":">=9.0.0"}. ... nothing was installed.
```

要显式接受风险，只能对 exact package + exact dsh version 授权：

```sh
dsh plugin --profile <name> allow-version <pkg>@<version> --dsh-version <dsh-version> --accept-risk
```

然后重跑 add；stderr 会警告可能崩溃/损坏数据。exemption 不是兼容性证明，也不会覆盖其它版本。

## 各来源与容器部署

**npm**：全局安装最接近 `dsh --profile web` 的默认路径。发行版 updater 只更新自己发布的 bundle/安装器；dsh 运行时更新交给 npm/包管理器，不要造第二套运行时更新。社区 `dsh-updater-npm` 只作为多副本保护样本，不是 DSH 更新合同。多副本、PATH、Node 版本是主要故障源。

**Desktop**：安装器拥有应用、运行时和 `profiles/desktop`；内置 CLI 在应用关闭时可用，npm 安装的 dsh 不能改 Desktop profile，Desktop 安装的命令可以。Desktop 首次启动用 Web 模板初始化 profile；核心包从 asar 解析，不复制进 profile。

**Python wheel**：把同一 `dsh` CLI 打包成 `deepseek-harness-sdk-runtime-<platform>-<arch>`；客户端默认用显式 home 启动 `dsh --profile sdk`，minimal 示例用 `sdk-minimal`。

**源码树**：`pnpm run build` 后 `pnpm dsh`；缺 Typert host artifacts 会在 boot 时模块解析失败，缺前端/client bundles 会提示 build；launcher 不检查新鲜度，旧 bundle 可能继续跑旧浏览器代码。

**容器**：本质是 Web surface 的包装；绑定一个具体本地 IP（wildcard 被拒），用 `--public-url` 广告外部根，再用 `--trusted-host` 放行代理 authority，TLS 由 listener 或前置代理负责。

## 实验（T）

| 实验 | 结果 |
|---|---|
| `DSH_HOME=$(mktemp -d) dsh --profile web --dump-default-config` | 初始化 `profiles/web/{package.json,cordis.patch.yml,cordis.yml,pnpm-workspace.yaml}`，bundles 为 base+web-app |
| `dsh plugin --profile test list` | 初始化 base-backed `profiles/test` 并创建 patch/package/pnpm-workspace |
| `dsh --profile rescue --from-default-profile web` 后加 marker，再用 `headless` 替换 | marker 被删除，bundles 变为 base+headless，patch 重置 |
| `dsh --profile plugin --dump-config` | 报 profile 不存在，提示用 `dsh plugin --profile plugin add …` |
| `dsh --profile web --from-default-profile headless` | 拒绝，shipped 名字不能作为自定义目标 |

## 失败模式

- 把 `--from-default-profile` 当升级：用户依赖、patch、本地数据链接被删。
- 安装成功但没重启：bundle 已写入磁盘，运行中的 profile 仍是旧 membership。
- git 源没有 build 允许：第一次 `add` 失败，需要把 key 写进 profile 的 `pnpm-workspace.yaml`。
- 引擎/peer 不匹配：安装/启动失败；exemption 是显式风险，不是推荐路径。
- Desktop profile 被 CLI 写入：`desktop` 是保留名，CLI 不能 boot；npm CLI 也不能管理它的插件。
- 源码树没 build：缺 host/front-end artifacts，启动失败或跑旧前端。
