# 18 · Profile bundles：安装、更新与数据退出

## 这一篇回答什么

DSH profile 决定一个应用组合由哪些 bundles 和 patches 构成。Plugin package 的安装、profile layer 的选择、当前进程是否重组以及产品数据清理是不同操作；本篇说明它们各自的 owner。

## 创建 profile 与安装 bundle

新 profile 经 `dsh plugin --profile <name> add <package>` 初始化时，shipped profile name 使用对应 template；其他 profile 默认只有 `@deepseek-ai/dsh-base`。该命令随后将参数转交 pnpm。

若目标是 Web 产品，先从 Web template 初始化自定义 profile：

```sh
dsh --profile kanban --from-default-profile web --dump-default-config
```

再安装产品 bundle：

```sh
dsh plugin --profile kanban add <bundle-spec>
```

自定义 Web profile 需要 ordered bundles `@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app` 和产品 bundle。`dsh plugin` 安装后会把新 bundle 追加到 profile list；没有 `dsh.bundle.patch` 的 dependency 只作为普通 package，不贡献 profile layer。完整 package/patch 合同见 [app-boot profile reference](../../../packages/boot/app-boot/README.md#profiles) 与 [CLI profile reference](../../../apps/cli/reference/README.md#plugin-management)。

profile 使用 DSH installation 与 profile node_modules 两个来源解析 bundle 名。若后加入的产品 bundle 要覆盖前面的 row，应将它放在 bundle list 后方并使用相同 row id。

## 安装完成后何时生效

CLI `dsh plugin` 运行 pnpm 并更新磁盘上的 dependency/bundle list；它返回退出码，不返回 `ChangeResult.application`。修改 bundle membership 后重启该 profile，以使用新的 composition。

Web/agent Plugin Manager 是不同的调用路径。启用 HMR 的 profile 可能应用可热加载的变更并返回 `ChangeResult.application: 'applied'`；只在该接口返回 `restart-required` 时按其结果告知重启。用户不应将 Plugin Manager 的返回值套用到 CLI 命令。

Profile/home patch 的生效方式取决于已启动 composition 是否配置 patch reload。Config editor 对 profile patch 的写入还受高优先级 home patch 和 CLI overlay 影响；详见 [17](./17-config-layers.md)。

## 兼容性与跳过 bundle

DSH 按 bundle/package manifest 声明检查其 DSH 兼容范围。无法读取或不兼容的 bundle 可能在 composition 时被跳过并产生诊断；其余 profile rows 仍可能运行，所以“profile 能启动”不等于产品所有功能都可用。

bundle 作者应在 `package.json` 声明准确的 `engines.dsh` 或 DSH peer ranges，按实际 package composition 和支持范围选择其一。产品 README 应说明如何检查 startup diagnostics 与有效 composition。若核心产品被跳过时必须阻止用户使用，该 fail-loud 检查需由能在相关 bundle 被跳过时仍运行的机制负责；产品 bundle 不能检查自身是否成功加载。

## 升级：区分三类事实

| 类别 | Owner | 作者要处理什么 |
|---|---|---|
| Bundle composition | DSH profile / package manager | 检查依赖版本、bundle 顺序和当前进程生效边界 |
| 用户 patch | 用户与 profile | 保持或迁移 row override；记住 patch 对整份 `config` 替换 |
| 产品数据 | 产品 owner 或用户 | 提供 schema version、迁移、备份、失败恢复与保留策略 |

Bundle 更新不应静默重写用户的 profile patch。产品数据不兼容时应迁移或报告可恢复错误，不要静默建一个空数据根冒充成功。

外部产品型样本的更新补偿、四层装配状态与恢复失败语义见 [35](../30-external/35-profile-assembly-ownership.md)；那是对照，不是 DSH 合同。

## 卸载与保留

`dsh plugin remove` 删除 profile dependency，并从 bundle list 移除相应 layer；它不会自动删除任意产品文件或业务记录。DSH Workspace deletion 仅删除 registration、排序和分组关系，不删除目录或 Session history。会话日志没有通用 delete API，附件本地 backend 没有自动 GC。

产品卸载说明按 owner 列出：

- 用户项目目录和文件：通常保留；除非用户明确请求并通过独立删除流程确认，不应由 bundle removal 擅删；
- 产品自建数据目录/domain：写明路径、备份、迁移和显式删除方法；
- DSH Workspace registration：只在产品能可靠识别自己创建的 Workspace 时提示用户移除；registration 没有产品 owner 字段；
- profile patch、Settings、credentials、Session history、attachments 和 browser storage：分别说明它们不是 bundle removal 的自动清理范围。

## 边界

- `dataRoot` 是产品可定义的 Config 字段，不是 DSH 通用服务。
- Profile、Workspace、Session 和产品数据有独立 owner 与生命周期。
- CLI package management 与 Plugin Manager 的返回值、HMR 和 restart 语义不同。
