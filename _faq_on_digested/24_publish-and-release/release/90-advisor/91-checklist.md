# 91 · 数据卡与发行验收

> 发行版构建路线见 [90 主线](./00-index.md)，六轴定义见 [10](../10-foundations/10-taxonomy.md)，Kanban 文件示例见 [93](./93-app-plugin-walkthrough.md)。

## 每份事实填写一张卡

一行对应一份事实。Owner、Authority、Source、Readers 和 Writers 是不同角色，不要合成一个“数据类别”。

| 字段 | 要回答的问题 |
|---|---|
| Fact | 这是什么事实？用户需要查看、编辑、导出或恢复什么？ |
| Owner | 谁负责记录的生命周期、迁移与删除？ |
| Authority | 哪份数据决定当前真值？派生数据可填“无（derived）”。 |
| Source | 哪份数据、输入或用户操作产生此记录？ |
| Mechanism/path | 通过哪个 API、文件或服务保存？实际位置是什么？ |
| Scope/key | 跟哪个 Session、发行版项目、DSH Workspace、profile、home 或 device 走？如何定位？ |
| Readers | 哪些角色或工具可以读取？ |
| Writers | 哪些角色或工具可以修改？ |
| Rebuildability | 丢失后能否从 Authority 或 Source 重建？成本是什么？ |
| Retention/deletion | 谁备份、迁移、删除或恢复？卸载后保留什么？ |

可以把下面的模板放进发行版 README，并为每份持久事实增加一行：

```markdown
## 数据与保留

| Fact | Owner | Authority | Source | Mechanism/path | Scope/key | Readers | Writers | Rebuildability | Retention/deletion |
|---|---|---|---|---|---|---|---|---|---|
| 看板文件 | 用户 | 文件内容 | 用户编辑和看板操作 | `<header.cwd>/boards/*.md` | 项目目录 | 用户、获准的看板工具 | 用户、获准的看板工具 | 非派生数据 | 用户负责备份和删除 |
| 搜索索引 | 发行版插件 | 无；派生视图 | 看板文件 | Storage domain | 发行版项目 ID | 搜索工具 | 索引器 | 重新扫描文件 | 发行方负责清理 |

共享 DSH 数据：<哪些 home stores 被共享>
运行设置：<profile 内还是共享路径>
卸载：<保留什么，如何删除发行版数据>
迁移与恢复：<支持的版本及恢复方法>
```

第二行示例中，发行版插件负责 search index 的生命周期，但 board files 才是其数据来源；索引是可重建视图，不是业务真值。读者和写入者分别填写，不要因数据保存在 storage domain 就推断访问权限。

## 检查数据输入与存储

- 进入模型请求的内容能否从 Session history 或其他记录来源重建？不要只保存在 Host 内存中。
- Secret 是否使用正确 API？`CredentialRef.resolve` 读取命名的环境变量；`CredentialKey` 访问 credential records，两者用途不同。
- JSON `per-record` storage-domain key 是否符合后端约束？字符必须匹配 `[a-zA-Z0-9_-]+`；路径应使用带前缀的 hash。
- `WorkspaceId` 是否只表示 DSH Workspace registration？删除后重建会产生新 ID，不能作为稳定发行版项目 ID。
- 持久 Session event 是否有兼容的 reader？仅做 TypeScript declaration merging 不建立已发布的 reader compatibility；见[11 存储机制](../10-foundations/11-storage-channels.md)。

## 检查实现与故障恢复

1. **并发写入：** 找出竞争 writer 和协调方式。JSON storage domain 只在单进程内串行调用，不提供跨进程写锁。
2. **失败与恢复：** 覆盖文件缺失、权限错误、坏记录、迁移失败、取消和重启恢复。
3. **项目移动与删除：** 分别说明路径、ID、孤儿记录、Workspace registration 和项目文件如何处理。
4. **保留：** 为 Session history、附件、缓存和发行版数据指定清理 Owner。DSH 没有通用 Session delete API；本地 attachment backend 没有 automatic GC。
5. **Client 状态：** 区分 origin/device 的纯 UI 状态、Session 派生数据和运行设置。
6. **依赖：** 确认目标 profile 可解析所需 API/provider。普通 dependency 不自动加入 Cordis rows；可在 patch 中显式挂载它。若要自动应用某个 package 自带的 `dsh.bundle.patch`，须把该 bundle 选入 profile。外部依赖逐个审核。

## 按六轴验收发行版

六轴各自的机制、读回方式与缺轴症状见 [10](../10-foundations/10-taxonomy.md)。这一节只给可勾选的判据。

| 轴 | 通过判据 | 不通过的典型症状 |
|---|---|---|
| 运行时 | 写清 dsh 从哪来与版本 floor；低版本在写依赖前被拒绝 | 只写“需要 dsh”，装完才发现 API 不存在 |
| profile | 明确是 shipped 模板、自定义具名 profile 还是 application-owned；名字稳定且不占用 `desktop` | 装进 `web` 模板，用户重置后发行版消失 |
| patch 层 | 默认值全在 bundle patch；`--dump-config` 能看到自己的完整 row | 默认值写在代码常量里，部署改不动 |
| app surface | 写清起哪个 app surface、带哪些 client plugins，并在该组合里验证首启 | Web 能起，Desktop 里没有对应入口 |
| Harness home 与数据 | 每份持久事实有数据卡；共享的 `$DSH_HOME` stores、自建目录和卸载保留逐项列出 | 用户以为卸载删干净了，数据还留在 home |
| 生命周期 | 安装走应用内 Plugins 页（CLI 仅 web 自动化）；写明重启要求、回退方式与数据清理责任 | 文档写“可回滚”，实际没有命令级回滚 |

六轴之外还有一条总判据：**改任一条都不用 fork DSH**。若某个决定只能靠改 DSH 源码实现，那不是发行版的可控项，而是对 DSH 的功能请求。

## 检查 profile 发行与启动

1. **组合：** 写明 shipped template 或完整 custom bundle list、package dependencies 和顺序。
2. **工具：** 列出模型可见的发行版工具与通用文件/进程工具；分别核验 provider 和 policy。
3. **项目选择：** 区分 DSH Web 默认 Workspace/picker 与发行版自建的项目选择、取消和恢复。
4. **Workspace：** Session 要加入 Host registration 时传 `workspaceId`；只需起始目录时传绝对 `cwd`。
5. **隔离：** 列出共享的 `$DSH_HOME` stores、path overrides、browser origins 和外部 services。profile 名本身不隔离数据。
6. **升级与卸载：** 说明 profile 重启、数据迁移、保留的用户文件和发行版数据清理方式。

## 检查装配与启动

发行版以聚合、接管或进口形态发行时，装配状态要分层读回；这一节检查装配形态，不替代每份事实的数据卡。样本与机制见 [34](../30-external/34-profile-delivery-forms.md) 与 [35](../30-external/35-profile-assembly-ownership.md)。

1. **四层状态**：包可解析、bundle 在 `dsh.profile.bundles`、row 在 patch、row 当前 enabled/config 生效，是四种状态；分别用 lockfile/版本、profile roster、patch fold 和 effective config dump 读回，不只看安装命令的 exit code。
2. **身份与冲突**：自研 row 用独立 namespace，明确 aggregate 与 standalone 的混装政策；共享库检查单例版本；改变 row id 或 package identity 时给旧身份一个退役窗口。
3. **更新与恢复**：记录更新 owner、consent/idle 门、旧 exact version 与 enabled 状态；失败恢复是补偿流程，要写清 crash window、`restore-failed`/`unknown` 和重启要求。exact direct pin 不等于 transitive lock。
4. **接管与覆盖**：替换宿主内置行时显示 target/scope/owner，区分 `unset`/继承与显式默认，只回滚自有行并保护 foreign edit；旧配置迁移要幂等。
5. **来源、安装与过滤**：外部套件的 source checkout、install record 和 workspace filter 分开存；要可复现就 pin 不可变快照，`lockCommit` 不是冻结；卸载区分 suite、source 与 checkout。
6. **bundle patch**：新增 row 用 `insert:`；`--dump-config` 确认 row 存在，不只看 bundle 是否在 roster。
7. **命令行**：web app args 归 `web-startup`；要加发行版 flag，必须替换 provider 并重实现全部 web flags，或改用 profile-as-mode/非 Web surface。
8. **startup session**：Host `sessionController.create` 只创建/attach；fresh client 可能自动选最新 blank，returning 保持 current；确定性选中要 client `uiWorkspace.openSession`。
9. **版本门**：`engines.dsh`/peer 不匹配安装前拒绝；exemption 只对 exact package + dsh version。
10. **安装通道**：默认写应用内 Plugins 页（web 与 Desktop 同一句）；面向 GUI 的 CLI 命令标“仅 `dsh web`”；headless/SDK/ACP 用 CLI 显式 profile；全文没有 `--profile desktop`。
11. **三个成功**：pnpm 0、dependency 写入、进 `dsh.profile.bundles`；dump 有 row，真启动无 `did not activate`。
12. **失败分级**：bundle skip / row pending 或 import warning / 整体失败；不要按“全有或全无”设计救生逻辑。
13. **home 层**：能覆盖、不能供货；跨 profile 的默认靠各自安装，不要往 home 插未安装包。
14. **首启**：原生只有 token 门；首启可推迟；不依赖 `welcome-notice`；Desktop 有替代路径。

## 安装、更新与移除

安装路径、启动面、命令行所有权与 startup 边界见 [50 生命周期](../50-lifecycle/00-index.md)。

`dsh plugin --profile <name> add <bundle>` 修改 profile bundle list，并返回 package-manager 结果，不返回 Plugin Manager 的 `ChangeResult.application`。CLI 修改后要重启 profile；Plugin Manager 是另一条操作路径，会返回自己的 application result。

创建 Web profile 时按 [93](./93-app-plugin-walkthrough.md) 使用新 profile 名。`--from-default-profile web` 会替换同名 custom profile，包括已安装 dependencies 和用户 patch。目标已存在时先备份或换名；替换提交后，即使应用启动失败也不会回滚旧 profile。

移除 bundle 不删除项目文件、Session history 或发行版自有数据。`workspace.delete` 只删除 Workspace registration。只有确认数据归属并得到用户授权后，才删除发行版数据。

## 常见误区

| 误区 | 正确处理 |
|---|---|
| 把 `WorkspaceId` 当发行版项目 ID | 定义发行版项目 ID；或接受重建 registration 会产生新 ID |
| 把 Workspace registration 当文件权限 | 分别检查访问该路径的 tool、provider 和 policy |
| 把 Session `header.cwd` 当当前工作目录 | 单独记录 `working_directory`；改变它不会改 sandbox roots |
| 把 profile 名当 `$DSH_HOME` 隔离标识 | 使用独立 home，或逐个配置 provider path |
| 认为 bundle removal 会删除业务数据 | 为发行版自有数据说明迁移、保留和清理方式 |

## 边界

- 本页是检查表，不是 API 合同；每项的机制与出处见对应章节与 [reference](../40-evidence/reference.md)。
- 填完数据卡只说明责任写清楚了，不说明实现正确；隔离范围还要按 [92](./92-native-reference-architectures.md) 逐 provider 核对。
- 检查项按交付形态取舍：单插件不需要“四层状态”，没有聚合/接管/进口形态的发行版可以跳过对应小节。
