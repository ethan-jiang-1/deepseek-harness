# 17 · 配置、工具与文件权限

## 这一篇回答什么

本篇区分 DSH patch 合成、插件 Config/Settings、产品自建运行时设置，以及模型文件工具的权限。它们不能统称为同一条“配置链”：patch 决定启动 composition，插件决定如何读取其他持久设置，工具 provider 决定如何访问文件。

## DSH patch 合成顺序

DSH 按下列顺序合成 profile entry：

```text
ordered bundle patches
→ profile cordis.patch.yml
→ $DSH_HOME/cordis.patch.yml
→ 每个 --patch overlay（按命令行顺序）
```

后续 patch 可覆盖 entry 或插入 rows。覆盖既有 row 的 `config` 是**整对象替换**，不是深合并。Profile Config schema 会为具有定义默认值的字段填充默认；只有写在低层 patch、且没有 schema/code default 的字段，不会因为高层只改另一个字段而继续继承。

| 来源 | 作用域 | 适合内容 |
|---|---|---|
| Bundle patch | profile composition | 产品 bundle 的默认 rows/config |
| Profile patch | 当前 profile | 用户或 Settings 保存的 profile-local 覆盖 |
| Home patch | 同一个 `$DSH_HOME` 下的 profile | 机器级配置，优先于 profile patch |
| `--patch` | 一次启动 | 临时部署/调试覆盖 |
| Config schema defaults | plugin entry config | 字段缺失时的代码默认，不是 patch layer |
| 产品运行时存储 | 产品自己定义的作用域 | 文件或 domain 值，不自动参与 patch precedence |

### 整对象替换的影响

若 bundle 在 `config` 内设置多个字段，profile patch 只提供部分 `config`，整个低层 config object 会被替换。Schema 有默认值的字段会按 Schema 规则补默认；仅存在于 bundle patch 的非默认值会丢失。覆盖 row 时要么提供完整配置，要么将可依赖的默认值声明在 Config schema/code defaults 中。

产品 bundle 应拥有自己需要覆盖的 row，并声明其完整 `config`。不要假设 Settings 的字段更新会合并回所有低层 bundle values；Config Editor 写入的是当前 profile patch。

## Config 与 Settings 的作用域

Config 声明插件 row 的配置字段。`Config.volatile()` 字段可以出现在 DSH Settings 表单；保存后写入**当前 profile** 的 `cordis.patch.yml`。因此：

- profile-local model/default/tool choices 可使用 Config/Settings。
- 同一 `$DSH_HOME` 下的另一个 profile 不会自动共享该字段。
- Home patch 对该 home 的 profiles 生效，并且优先于 profile patch；若它覆盖 Settings 正在编辑的 entry/字段，Settings 写入可能被拒绝或不能成为有效值。

若产品需要跨 profile 共享运行时设置，选择产品自建文件或产品拥有的 home-level storage-domain singleton。`dataRoot` 可以是产品 Config 的字段名，但不是 DSH API。共享文件需明确 owner、路径稳定性、文件 schema、并发、备份、迁移和卸载责任。

对同一字段，指定一个权威写入入口。不要让 Settings 和产品文件互相覆盖且不解释优先级。

## 模型工具和 sandbox policy

Preset 决定模型可调用哪些工具；Workspace registration 不授予文件工具。模型能否读写某路径，还取决于对应 tool provider 及其 policy。DSH 的 `workspace-write` policy 以 Session 初始 `header.cwd` 为 sandbox workspace root，并允许 `/tmp` 与 `os.tmpdir()`；它不是唯一可写路径。读取不会被这个写入 fence 限制。

`working_directory` 改变 Session 的有效目录，但不修改 `header.cwd`，也不会扩大 sandbox writable roots。若产品需要 sandboxed 通用文件工具从项目目录开始工作，应以 Workspace 创建 Session，或通过 Session Controller 提供显式 `cwd`。是否登记 Workspace 则由是否需要 DSH 导航/分组决定。

Host plugin 代码在 DSH 进程中运行。它直接调用 `node:fs` 不受 Session sandbox 自动约束；直接调用 `ctx.fs` 时也不能假设拥有与 `tool-fs` 相同的 policy，除非插件明确传入 policy 且组合提供相应执行机制。产品工具需自行验证目标 project、用户授权和写入范围。

| 能力 | 由谁决定 | 关键边界 |
|---|---|---|
| 模型能调用哪些工具 | agent preset | 未挂载的工具不在该 Agent tool set 中 |
| Session 初始目录 | `workspaceId` 或显式 `cwd` | `workspaceId` 与 `cwd` 不可同时传入 |
| Sandbox 主根 | 调用时解析的 Session `header.cwd`；无 cwd 时使用配置 fallback | `working_directory` 不会改此根 |
| sandboxed 写入范围 | sandbox mode 与平台 provider | `workspace-write` 还允许平台临时根；后端可能报告 partial enforcement |
| Host 插件文件写入 | 插件代码与部署运行账户 | 不因 Session policy 自动受限 |

具体合同见 [Sandbox](../../../docs/subsystems/sandbox.md)、[Filesystem](../../../docs/subsystems/filesystem.md)、[Working Directory](../../../docs/subsystems/working-directory.md) 与 [`dsh-fs-sandbox`](../../../packages/fs/fs-sandbox/README.md)。

## 秘密

`CredentialRef` 表示一个环境变量名；调用方通过 credentials provider 的 `resolve(ref)` 获取当前值。`CredentialKey` 表示插件拥有的一条 credential record；调用方用 records API 读取或读改写它，不能将 `CredentialKey` 传给 `resolve` 当作环境变量引用。

不要把秘密明文写入 Config、普通 domain、产品设置文件、日志或模型上下文。凭据文件的 OS 权限不防止同一 OS 用户运行的 Host plugin 或 model tool 访问文件系统。

## 检查清单

- [ ] 使用实际组合的有序 bundle list，并写明覆盖 row 的 owner。
- [ ] Profile patch、home patch 与 CLI overlays 的优先级写清楚。
- [ ] 说明整对象替换及哪些默认值来自 schema/code、哪些只在 bundle patch。
- [ ] Settings 表单字段仅用于预期的 profile scope。
- [ ] 若产品设置跨 profile 共享，声明实际文件/domain 路径及生命周期 owner。
- [ ] 每个可见模型工具对应正确 preset、provider 和权限策略。
- [ ] 将 Session header cwd、有效 working directory、Workspace registration 和 product project root 分开记录。
- [ ] Host 插件直接写文件时有产品级路径与用户授权检查。
- [ ] 以 `CredentialRef` 解析环境名；以 `CredentialKey` records API 操作插件拥有的记录。
- [ ] README 说明隔离范围、备份、迁移、卸载和失败恢复。

## 边界

- Patch precedence 与 entry config replacement 是 DSH composition 机制；产品运行时文件/domain 的读取顺序由产品拥有。
- 本篇不定义产品级 `dataRoot`、Workspace root resolver 或数据隔离 API。
- DSH Profile 属于同一 `$DSH_HOME` 时，共享与否按每个 provider/store 的路径和客户端 origin 判断，不能从 profile 名推断。
