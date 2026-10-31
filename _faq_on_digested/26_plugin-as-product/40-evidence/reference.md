# Reference 26 · DSH 出处与研究边界

当前 DSH 行为以本 checkout 的 `docs/`、package README、公开类型与实现为准。部分 home 文件清单和本机观测记录来自原研究样本，只说明该样本，不是产品默认值。

## 数据 owner 与 DSH mechanism

| 数据事实 | 常见 owner | DSH mechanism examples |
|---|---|---|
| 用户已有文件 | 用户 | Config/path + `ctx.fs` |
| Session 可见历史 | Session | Session persistence、projections、`sessionQuery` |
| 项目文件与交付物 | 用户 | `ctx.fs`、`present` |
| 产品索引/状态 | 产品 plugin | `ctx.storageDomain` 或产品自建存储 |
| Profile-local 配置 | 用户/部署者 | `Config.volatile()` / Settings |
| Secret value | Credentials provider | `CredentialRef.resolve` |
| Plugin-owned credential record | Plugin/provider | `CredentialKey` records API |
| Pure client UI state | Browser/device | browser storage / desktop userData |

产品 profile 是运行组合，不是数据隔离单位。作者逐块填写 [91 数据卡](../90-advisor/91-checklist.md)，分别记录各项数据属性。

## 复核方式

| 等级 | 来源 |
|---|---|
| **T** | [experiments](./experiments/00-index.md) 中记录的实际命令与输出；仅支持该次观测范围 |
| **C** | 当前 DSH docs、类型或实现；优先读取 owner package README 和源码 |
| **H** | 历史决策或旧 checkout；不能代替当前行为 |
| **P** | 未实现提案，不作当前合同 |
| **S** | 第三方源码阅读，未安装/未运行 |
| **R** | 第三方 README/作者声明，未独立验证 |
| **U** | 尚未核实或未执行 |

操作性 DSH 声明以当前实现和可重现实验为准。外部源码/README 只能支持 S/R 级结论。

## 关键 DSH 机制与出处

| # | 机制 | 主要来源 |
|---|---|---|
| 1 | Profile 按 ordered bundle patches、profile patch、home patch、CLI overlays 合成；row config 整体替换 | [CLI reference](../../../apps/cli/reference/README.md#profile-boot)、`vendor/include/src/index.ts` |
| 2 | Shipped Web template 与 custom profile 默认 bundle list | `packages/boot/app-boot/src/profile.ts`、[CLI reference](../../../apps/cli/reference/README.md#profile-boot) |
| 3 | CLI `dsh plugin` 更新 profile package/bundle list 并返回退出状态 | [CLI plugin management](../../../apps/cli/reference/README.md#plugin-management)、`apps/cli/src/plugin.ts` |
| 4 | Session create 可传 `workspaceId` 或 `cwd`；Workspace membership 按初始 header cwd 验证 | `packages/api/session-controller/src/types.ts`、`src/commands.ts`、`packages/workspace/workspace/src/entity.ts` |
| 5 | Workspace 是 Host-side capability，不提供模型文件工具或拥有目录 | [Workspace subsystem](../../../docs/subsystems/workspace.md)、[workspace README](../../../packages/workspace/workspace/README.md) |
| 6 | DSH Web first-use eligibility 与 Documents default path | `packages/client/ui-workspace/src/client/navigation.ts`、`packages/api/workspace-controller/src/default-directory.ts`、`packages/workspace/workspace/src/index.ts` |
| 7 | Native picker `pick` 与 browse picker `list/createDirectory` 是不同 capabilities | `packages/api/workspace-controller/src/directory-picker.ts`、[adaptive picker README](../../../packages/host/directory-picker-auto/README.md) |
| 8 | Sandbox policy 每次调用解析；`workspace-write` 还允许平台临时路径 | [Sandbox subsystem](../../../docs/subsystems/sandbox.md)、`packages/sandbox/sandbox/src/roots.ts` |
| 9 | `working_directory` 不改变 Session 初始 cwd 或 sandbox roots | [Working Directory subsystem](../../../docs/subsystems/working-directory.md) |
| 10 | File sandbox fence 约束接入该 backend 的写操作；Host plugin code 不自动进入 Session sandbox | [Filesystem subsystem](../../../docs/subsystems/filesystem.md)、[`dsh-fs-sandbox`](../../../packages/fs/fs-sandbox/README.md) |
| 11 | `Config.volatile()` Settings 写当前 profile；home patch 与 CLI overlays 另有优先级 | [`dsh-settings`](../../../packages/settings/settings/README.md)、[`dsh-config-editor`](../../../packages/boot/config-editor/README.md) |
| 12 | `CredentialRef.resolve` 与 `CredentialKey` records API 是不同接口 | [Credentials subsystem](../../../docs/subsystems/credentials.md)、`packages/credentials/credentials/src/types.ts` |
| 13 | Storage domain 是静态 package schema；JSON per-record key 使用安全字符 | [Storage subsystem](../../../docs/subsystems/storage.md)、`packages/storage/storage-json/src/per-record-unit.ts` |
| 14 | Workspace deletion 只移除 registration；Session history 和用户目录保留 | [Workspace README](../../../packages/workspace/workspace/README.md)、`packages/workspace/workspace/src/index.ts` |
| 15 | 附件本地 backend 没有自动 GC；`present` 只记录 path | [Attachment](../../../docs/subsystems/attachment.md)、[Deliverables](../../../docs/subsystems/deliverables.md) |
| 16 | `$DSH_HOME` 外还可能有 `DSH_AGENTS_HOME`、browser origin 和 OS state | [home paths](../../../packages/util/home-paths/README.md)、[92 隔离矩阵](../90-advisor/92-native-reference-architectures.md#profile-数据隔离) |
| 17 | Session event vocabulary 可在类型层扩展；独立 package 还需满足 released reader/format compatibility | [Session subsystem](../../../docs/subsystems/session.md)、[session format status](../../../docs/session-format-status.md)、`packages/session/session-persistence/src/storage-contract.ts` |

## 运行命令的观测

隔离 `$DSH_HOME` 下的 Web template 初始化和本地 bundle append 见 [实验 05](./experiments/05-profile-bundle-install.md)。它验证 profile manifest 与 `--dump-config` composition，不验证产品代码或完整 Web runtime。

本机 `$DSH_HOME` 目录树、Workspace JSON 和 Session 文件只代表记录它们的运行样本。其他 provider path 以对应 package README/config catalog 为准。

## 外部研究

第三方 package、插件与 DSH 外部生态样本见 [research-external](./research-external.md)、[31](../30-external/31-external-community-patterns.md)、[32](../30-external/32-external-ecosystem.md) 和 [33](../30-external/33-external-plugin-patterns.md)。S/R/U 证据不建立 DSH API、兼容性或安装行为。

## 边界

- 当前 DSH 行为以 checkout owner 文档和实现为准；提交号与旧版状态只用于来源识别。
- 社区样本未安装运行，不作具体 package 的 dependency 背书。
- 本 FAQ 讨论单 Host，不提供多租户或跨机器同步方案。
