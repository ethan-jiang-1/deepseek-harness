# Reference 26 · 出处、API 速查与不确定处

源码核验基线：`dsh-v0.2.1-rc.3`（`1f81c047fc48fa190a683e469daa699857e9afe8`）。行号按该 commit 的树；仓库前移后以符号名为准。

## 零、作者的承诺与平面的对应

| 承诺 | 平面 | 作用域 | 主要 API | 社区样本（外部，未验证） |
|---|---|---|---|---|
| P0 纯引用 | 内容 | 用户给的路径 | `Config` + `ctx.fs` | dsh-memory-snapshot |
| P1 会话派生 | 派生 + 历史 | session | `ctx.sessionProjections` | harness-insights |
| P2 项目内文件 | 内容 | workspace | `ctx.fs` + `present` | dsh-workspace-overlay |
| P3 宿主账本 | 状态 | workspace 键（存 home） | `ctx.storageDomain` | dsh-custom-workspace |
| P4 账号配置 | 状态 + 凭据 | home | `Config.volatile()` / `credentials` | 渠道插件 |
| P5 每项目运行时 | 运行时 | workspace | 无核心实现；社区自建 scope | dsh-workspace-overlay |

这张表是“作者视角 → 架构词汇”的翻译层；下文是架构本身的出处。

## 一、四个平面与权威

| 平面 | 权威 | 证据 |
|---|---|---|
| 内容 | 工作区文件；DSH 不拥有 | `docs/subsystems/filesystem.md`；`packages/fs/fs/src/types.ts`（`FsTarget`、`FsWriteIntent`）；`docs/subsystems/workspace.md` 的删除语义 |
| 历史 | 会话日志；投影可重建 | `docs/subsystems/persistence.md`；`docs/subsystems/session-projection.md`；`docs/subsystems/session.md` |
| 状态 | 宿主域 / Config / 凭据 | `docs/subsystems/storage.md`；`docs/subsystems/settings.md`；`docs/subsystems/credentials.md` |
| 派生 | 投影缓存 / 可丢弃数据 | `packages/session/session-projection/README.md`；`packages/storage/storage-domain/README.md` 的 `layout` / `invalidRecords` |

## 二、结论与证据

| # | 结论 | 证据 |
|---|---|---|
| 1 | 域是静态声明，名字/版本/schema 一处定义 | `packages/storage/storage-domain/src/spec.ts`（`defineDomain`）；`docs/subsystems/storage.md` 的 Declaring a domain |
| 2 | 域读同步、写先落盘再改内存、每域一条写链 | `packages/storage/storage-domain/README.md` 的 Design concept |
| 3 | `domain/changed` 仅进程内；无跨进程 change push | `packages/storage/storage-domain/README.md` 的 Known Limitations |
| 4 | 无自动迁移；`single` 版本不符直接拒绝 | 同上；`docs/subsystems/storage.md` 的 backend contract |
| 5 | `per-record` 支持 `compatibleVersions` 与 `invalidRecords: 'backup-and-skip'` | `docs/subsystems/storage.md` 的 `DomainSpec` |
| 6 | 无跨表事务、二级索引、多段键 | `packages/storage/storage-domain/README.md` 的 Known Limitations |
| 7 | 无通用 cache 服务；只有 `dshCachePath` 路径助手 | `packages/util/home-paths/src/index.ts:170` |
| 8 | settings 只投影 volatile Config 字段，写入 profile patch | `packages/settings/settings/README.md`；`packages/boot/app-boot/src/profile.ts` 的 `PROFILE_PATCH_FILENAME` |
| 9 | 凭据只存引用，逐操作解析，空值等于未配置 | `docs/subsystems/credentials.md` |
| 10 | 附件内容寻址、不可变，落在 `$DSH_HOME/attachments/v1` | `packages/attachment/attachment-local/src/index.ts:176`；`docs/subsystems/attachment.md` |
| 11 | 会话事件只带附件引用，不带 base64/临时路径 | `docs/subsystems/attachment.md` 开篇 |
| 12 | `present` 只记绝对路径，不复制内容，默认 8 个文件 | `packages/deliverables/tool-present/README.md`；`src/types.ts` 的 `deliverables/presented` |
| 13 | `workspace/changes` 只发 `{turn}` 事件，摘要留 Host 内存至会话销毁 | `packages/deliverables/workspace-changes/README.md`；`src/types.ts` |
| 14 | spill 原样保存文本，返回定位符；owner 是会话 | `docs/subsystems/spill.md`；`packages/spill/spill/src/types.ts` |
| 15 | 文件写入支持 `createIfAbsent` / `replaceIfVersion`，省略即无条件覆盖 | `packages/fs/fs/src/types.ts` 的 `FsWriteIntent` |
| 16 | 技能根按项目/用户分层；项目根是最近 `.git` 祖先 | `packages/skill/skill-filesystem/README.md` 的 Roots and priority |
| 17 | `~/.agents` 是跨工具共享根 | `packages/util/home-paths/README.md` |
| 18 | 工作区记录删除不删目录与会话；重加换新 uuid | `packages/workspace/workspace/README.md`；`docs/subsystems/workspace.md` |
| 19 | `workspaceId` 在删除重加后变化 | `packages/workspace/workspace/src/spec.ts`（id 生成）；workspace README 的 re-registration 段 |
| 20 | 会话 cwd 不可变 | `docs/subsystems/persistence.md:356`（immutable header） |
| 21 | 沙箱是能力调用点的策略，不是插件代码的全局权限系统 | `docs/subsystems/filesystem.md`；`packages/fs/tool-fs/src/write.ts`（解析 policy 后传入 fs） |
| 22 | 模型可见 ⟺ 已记录 | 仓库根 `AGENTS.md`；`docs/architecture.md` |

## 三、API 速查

| 需要 | 服务 | 关键方法 |
|---|---|---|
| 工作区文件读写 | `ctx.fs` | `resolve`、`stat`、`readText`、`readBytes`、`writeText`、`watch`、`contains` |
| 结构化宿主状态 | `ctx.storageDomain` | `open(spec)` → `table.get/put/update/delete`、`global.get/set` |
| 用户可调参数 | `ctx.settings` + `Config.volatile()` | 表单 `describe/update/replace/mutate`；插件读自己的 Config ref |
| 秘密 | `ctx.credentials` | `resolve(ref)`、`describe(ref)`、`set/unset`（provider 支持时） |
| 二进制输入 | `ctx.attachments` | `saveImages`、`saveFile`、`imageHostPath` |
| 大文本 | `ctx.spillStore` | `saveText` |
| 会话派生值 | `ctx.sessionProjections` | `register(definition)` |
| 交付声明 | `present` 工具 | `files: [{ path, description? }]` |
| 项目管理 | `ctx.workspaceRegistry`（可选） | `list`、`get`、`resolveByPath` |

## 四、`$DSH_HOME` 里的相关目录

```text
$DSH_HOME/
├── attachments/v1/        # 不可变附件对象
├── cache/                 # 可丢弃缓存（dshCachePath）
├── profiles/<name>/       # package.json + cordis.patch.yml（settings 写这里）
├── sessions/--<cwd>--/    # 会话日志
└── storages/              # 域存储（json 后端；或 sqlite 数据库）
```

`~/.agents` 是刻意的第四个根：`AGENTS.md` 与 `skills/` 供多个 agent 工具共享，不受 `DSH_HOME` 迁移影响。

## 五、证据薄弱处

1. **没有实测多进程并发写 domain。** JSON 后端无文件锁、`domain/changed` 只进程内，是源码与 README 的结论；并发后果未做实验。
2. **没有实测附件清理策略。** “与会话同寿”“可能被保留期清理”来自文档措辞，具体清理周期由部署/后端决定。
3. **没有实测 spill 过期。** 只按 README 的“retention-period cleanup may expire”记录。
4. **没有实测远端文件系统（SSH 等）下的路径/键行为。** 本篇的路径建议以本地 realpath 为准。
5. **“用户会编辑/带走”是产品判断**，不是 DSH 的强制；项目内文件与 home 域两条路都成立，取舍取决于维护成本。
6. **多用户/远程租户**不在本篇范围；`remoteAccess` 只做可见性裁剪，不提供按用户分区的存储。

## 六、社区来源（外部、未验证）

| 来源 | 用来支持什么 | 边界 |
|---|---|---|
| [dsh-memory-snapshot](https://github.com/yzx4036/dsh-memory-snapshot) | P0：零依赖、路径清单、文档原地不动；相对路径按启动目录解析 | 作者自述；钉在 0.2.x |
| [dsh-workspace-overlay](https://github.com/TTTPOB/dsh-workspace-overlay) | P2/P5：`<workspace>/.dsh/cordis.yml`、workspace scope/lease | 第三方实现，非核心 API |
| [dsh-custom-workspace](https://github.com/JeremyGuo/dsh-custom-workspace) | P3：按 workspace 持久化；第三方 settings namespace 缺口 | 旧 `settings.yaml` 写法 |
| [dsh-workspace-memories](https://github.com/lengfengng-tech/dsh-workspace-memories) | P3：默认 home、可 opt-in 项目内；Markdown + 工具写 + 面板；1 MiB/32K 上限 | 作者自述；未审计 |
| [dsh-memory-evolve](https://github.com/csyangwen/dsh-memory-evolve) | P3/P4：五轨记忆、确认队列、git 分支同步 | 作者自述；未审计 |
| [dsh-graphmemory](https://github.com/meyaomiao/dsh-graphmemory) | P3：SQLite + FTS/向量 + LLM 抽取；召回标不可信 | 作者自述；未审计 |
| [dsh-project-context](https://github.com/P02-1010751281/dsh-project-context) | P2：项目内 journal 权威 + Markdown 派生、跨进程锁、回填 | 作者自述；未审计 |
| [harness-insights](https://github.com/mapan0424/deepseek-harness-plugins/tree/main/packages/harness-insights) | P1：只折叠元数据、不存正文、可重建检查点 | 作者声明；未审计 |
| [deepseek-harness-plugins](https://github.com/mapan0424/deepseek-harness-plugins) | P4：渠道配置 `defaultWorkspace` + 凭据放 profile/env | 第三方 monorepo |
| [dshbase](https://dshbase.com/) / [awesome 目录](https://github.com/imsai-sh/awesome-deepseek-harness-plugins) | 生态规模与分类（约 2 万条目录；Memory 436） | 站点自述，未审计 |

## 七、相关阅读

- [FAQ 24 · 数据平面](../24_plugin-publish-and-agent-data-planes/05-data-planes.md)：workspace / home / session 的三分与八条规则。
- [FAQ 25 · Workspace 与 Ungrouped](../25_workspaces-and-conversations/answer.md)：工作区记录、attach、删除语义。
- [FAQ 22 · 上下文腐化](../22_spec-drift-and-context-rot/answer.md)：compaction 遮蔽与日志只追加。
- `docs/subsystems/storage.md`、`session-projection.md`、`attachment.md`、`spill.md`、`deliverables.md`、`settings.md`、`credentials.md`、`filesystem.md`。
