# 18 · profile bundles：安装、更新与数据退出

## 这一篇回答什么

DSH profile 决定一个应用组合由哪些 bundles 和 patches 构成。plugin package 的安装、profile layer 的选择、当前进程是否重组以及发行版数据清理是不同操作；本篇说明它们各自的 owner。

## 安装通道与 profile

安装有三个通道，只有应用内那条跨面：

| 通道 | 谁执行 | profile 从哪来 | 跨面 |
|---|---|---|---|
| 应用内 Plugins 页 / `plugin_manager` 工具 | 正在运行的宿主 | 当前 profile，**无参数** | **是**：web 与 Desktop 同一句 |
| `dsh plugin --profile <p> …` | CLI，转发 pnpm | 显式指定；首次使用自动初始化 | 面绑定：web/headless/sdk 等，不能 `desktop` |
| Electron carrier | Desktop | 只能它碰 `desktop` | 否：第三方拿不到 |

**默认安装写应用内 Plugins 页。** 面向 GUI 的 CLI 只作 web 自动化，必须标“仅 `dsh web`”；headless/SDK/ACP 没有 Plugins 页，才用 CLI 显式 profile。`dsh --profile desktop` 与 `dsh plugin --profile desktop` 都被拒绝，只有 Electron carrier 用程序化开关能管理。

“装成功”有三个独立状态：

| 状态 | 怎么核 |
|---|---|
| pnpm 成功 | exit 0 + `+ <pkg>` |
| dependency 写入 | `profiles/<p>/package.json.dependencies` |
| 成为 profile 层 | `dsh.profile.bundles` 含该 bundle |

只有第三个让功能存在。没有声明 `dsh.bundle.patch` 的包，两条通道结果不同：CLI `dsh plugin` 是 exit 0、dependency 写入、roster 不变，只给一句 stderr `declares no dsh.bundle — installed as a plain dependency, not a profile layer`；应用内 Plugins 页先装后判，以 `not-bundle` 失败并把 `package.json` 与 lockfile 回滚。

### CLI 自动化路径（web/headless/sdk）

新 profile 经 `dsh plugin --profile <name> add <package>` 初始化时，shipped profile name 使用对应 template；其他 profile 默认只有 `@deepseek-ai/dsh-base`。该命令随后将参数转交 pnpm。

若目标是 Web 发行版，且要用 CLI 自动化，先从 Web template 初始化自定义 profile：

```sh
dsh --profile kanban --from-default-profile web --dump-default-config
```

再安装发行版 bundle：

```sh
dsh plugin --profile kanban add <bundle-spec>
```

自定义 Web profile 需要 ordered bundles `@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app` 和发行版 bundle。`dsh plugin` 安装后会把新 bundle 追加到 profile list；没有 `dsh.bundle.patch` 的 dependency 只作为普通 package，不贡献 profile layer。完整 package/patch 合同见 [app-boot profile reference](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md#profiles) 与 [CLI profile reference](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/reference/README.md#plugin-management)。

profile 使用 DSH installation 与 profile node_modules 两个来源解析 bundle 名。若后加入的发行版 bundle 要覆盖前面的 row，应将它放在 bundle list 后方并使用相同 row id。

### bundle patch、tarball 与并发替换

- 裸 `- id: …` 是 **override target**，不是新增 row。目标不存在时 `--dump-config` 只报 `patch: entry "…" not found`；bundle 仍在 `dsh.profile.bundles`，但 row 不存在、插件不跑。新增 row 必须写 `- insert:`。
- 本地 tarball 可直接 `dsh plugin --profile <name> add ./x.tgz`；产物要含 `package.json`、`dsh.bundle.patch` 与插件文件。
- 并发执行 `--from-default-profile` 时，至少一个成功，最终目录是一份完整副本；实测两个进程都成功、最后写入者生效，未留 staging。

实测与模板见 [50 生命周期](../50-lifecycle/40-profile-integration.md)，阶段判据见 [37](../30-external/37-lifecycle-stages.md)。

## 安装完成后何时生效

CLI `dsh plugin` 运行 pnpm 并更新磁盘上的 dependency/bundle list；它返回退出码，不返回 `ChangeResult.application`，而且在另一个进程里操作——**宿主不知道**。修改 bundle membership 后必须重启该 profile。

应用内安装由宿主自己执行，可能返回 `restart-required`（例如 `no-hmr`）；只有该接口明确 `applied` 时才是 HMR 生效。不要把 CLI 的 exit 0 或 Plugin Manager 的返回值套用到另一条路径。

profile/home patch 的生效方式取决于已启动 composition 是否配置 patch reload。Config editor 对 profile patch 的写入还受高优先级 home patch 和 CLI overlay 影响；详见 [17](./17-config-layers.md)。

## 兼容性与跳过 bundle

DSH 按 bundle/package manifest 声明检查其 DSH 兼容范围。无法读取或不兼容的 bundle 可能在 composition 时被跳过并产生诊断；其余 profile rows 仍可能运行，所以“profile 能启动”不等于发行版所有功能都可用。

安装期还有一道门：应用内安装与 `dsh plugin` 都检查 `engines.dsh`/peer，不匹配时在写入 package 依赖前拒绝并明确 `nothing was installed`（profile 脚手架可能已经初始化，例如首次使用时）。exemption 只对 exact package + exact dsh version：`dsh plugin --profile <name> allow-version <pkg>@<version> --dsh-version <dsh-version> --accept-risk`；它是风险接受，不是兼容证明。

bundle 作者应在 `package.json` 声明准确的 `engines.dsh` 或 DSH peer ranges，按实际 package composition 和支持范围选择其一。发行版 README 应说明如何检查 startup diagnostics 与有效 composition。若核心 bundle 被跳过时必须阻止用户使用，该 fail-loud 检查需由能在相关 bundle 被跳过时仍运行的机制负责；发行版 bundle 不能检查自身是否成功加载。

## 升级：区分三类事实

| 类别 | Owner | 作者要处理什么 |
|---|---|---|
| bundle composition | DSH profile / package manager | 检查依赖版本、bundle 顺序和当前进程生效边界 |
| 用户 patch | 用户与 profile | 保持或迁移 row override；记住 patch 对整份 `config` 替换 |
| 发行版数据 | 发行方或用户 | 提供 schema version、迁移、备份、失败恢复与保留策略 |

bundle 更新不应静默重写用户的 profile patch。发行版数据不兼容时应迁移或报告可恢复错误，不要静默建一个空数据根冒充成功。

外部样本的更新补偿、四层装配状态与恢复失败语义见 [35](../30-external/35-profile-assembly-ownership.md)；那是对照，不是 DSH 合同。

## 卸载与保留

安装/启动/分发与安装文档的发行方侧选择见 [50 生命周期](../50-lifecycle/00-index.md)。

应用内 Plugin Manager 或 `dsh plugin remove` 删除 profile dependency，并从 bundle list 移除相应 layer；它不会自动删除任意发行版文件或业务记录。DSH Workspace deletion 仅删除 registration、排序和分组关系，不删除目录或 Session history。会话日志没有通用 delete API，附件本地 backend 没有自动 GC。

发行版卸载说明按 owner 列出：

- 用户项目目录和文件：通常保留；除非用户明确请求并通过独立删除流程确认，不应由 bundle removal 擅删；
- 发行版自建数据目录/domain：写明路径、备份、迁移和显式删除方法；
- DSH Workspace registration：只在发行版能可靠识别自己创建的 Workspace 时提示用户移除；registration 没有发行方 owner 字段；
- profile patch、Settings、credentials、Session history、attachments 和 browser storage：分别说明它们不是 bundle removal 的自动清理范围。

## 边界

- `dataRoot` 是发行版可定义的 Config 字段，不是 DSH 通用服务。
- profile、Workspace、Session 和发行版数据有独立 owner 与生命周期。
- CLI package management 与 Plugin Manager 的返回值、HMR 和 restart 语义不同。
