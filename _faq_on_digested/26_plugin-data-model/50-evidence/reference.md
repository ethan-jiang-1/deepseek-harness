# Reference 26 · 出处、API 速查与不确定处

源码核验基线：`dsh-v0.2.1-rc.3`（`1f81c047fc48fa190a683e469daa699857e9afe8`）。行号按该 commit 的树；仓库前移后以符号名为准。

## 零、承诺与落点的对应（P0–P4 是承诺）

| 承诺 | 主家 | 作用域 | 主要 API | 社区样本（外部，源码阅读，未安装） |
|---|---|---|---|---|
| P0 纯引用 | 内容 | 用户给的路径 | `Config` + `ctx.fs` | dsh-memory-snapshot |
| P1 会话派生 | 派生 + 历史 | session（可聚合到 workspace） | `ctx.sessionProjections` / `ctx.sessionQuery` | harness-insights |
| P2 项目内文件 | 内容 | workspace / 用户全局 | `ctx.fs` + `present` | dsh-project-context |
| P3 宿主账本 | 状态 | workspace 键（存 home） | `ctx.storageDomain` | dsh-workspace-memories |
| P4 账号/安装配置 | 状态 + 凭据 | home / profile | `Config.volatile()` / `credentials` | 渠道插件 |

P0–P4 是数据承诺。P5“每项目运行时”是运行时 scope 缺口（外部 `workspaceCordis`），P6“客户端本地”是设备落点，它们都不是第六/第七种承诺。

这张表是“作者视角 → 架构词汇”的翻译层；下文是架构本身的出处。

## 一、五个家与权威

| 家 | 权威 | 证据 |
|---|---|---|
| 内容 | 工作区文件；DSH 不拥有 | `docs/subsystems/filesystem.md`；`packages/fs/fs/src/types.ts`（`FsTarget`、`FsWriteIntent`）；`docs/subsystems/workspace.md` 的删除语义 |
| 历史 | 会话日志；投影可重建 | `docs/subsystems/persistence.md`；`docs/subsystems/session-projection.md`；`docs/subsystems/session.md` |
| 状态 | 宿主域 / Config / 凭据 | `docs/subsystems/storage.md`；`docs/subsystems/settings.md`；`docs/subsystems/credentials.md` |
| 派生 | 投影缓存 / 可丢弃数据 | `packages/session/session-projection/README.md`；`packages/session/session-projection-cache/README.md`；`docs/subsystems/session-query.md` |
| 客户端 | 浏览器/设备 | `packages/client/shortcuts/src/client/storage.ts`；`packages/client/ui-shortcuts/README.md`；`packages/client/ui-conversation/src/client/stores.ts` |
| 只读层 | npm 包 | `docs/subsystems/filesystem.md` 的 `extensionUri` 类比；`packages/boot/app-boot/src/profile.ts` 的 profile 目录 |

## 二、结论与证据

| # | 结论 | 证据 |
|---|---|---|
| 1 | 域是静态声明，名字/版本/schema 一处定义；一个名字一个打开句柄 | `packages/storage/storage-domain/src/spec.ts`（`defineDomain`）；`docs/subsystems/storage.md` |
| 2 | 域读同步、写先落盘再改内存、每域一条写链 | `packages/storage/storage-domain/README.md` |
| 3 | `domain/changed` 仅进程内；无跨进程 change push | 同上 Known Limitations |
| 4 | 无自动迁移；`single` 版本不符直接拒绝 | 同上；`docs/subsystems/storage.md` 的 backend contract |
| 5 | `per-record` 支持 `compatibleVersions`；`invalidRecords: 'backup-and-skip'` 只在能 `backupRecord` 的后端生效（JSON per-record），`single`/SQLite 回退为拒绝 | `docs/subsystems/storage.md` 的 `DomainSpec`；`packages/storage/storage/src/backend.ts` |
| 6 | `single` 键是不透明字符串；`per-record` 键必须匹配 `[a-zA-Z0-9_-]+` | `packages/storage/storage/src/backend.ts:97`；`packages/storage/storage-json/src/per-record-unit.ts:38-39` |
| 7 | 无跨表事务、二级索引、多段键 | `packages/storage/storage-domain/README.md` 的 Known Limitations |
| 8 | settings 只投影 volatile Config 字段，命名空间是 profile entry id，写入当前 profile patch 并立即应用 | `packages/settings/settings/README.md`；`packages/settings/settings/src/index.ts`（`describe`、`update`）；`packages/boot/config-editor/README.md` |
| 9 | home patch 与命令行 overlay 优先；表单写入会被拒绝 | `packages/settings/settings/README.md` |
| 10 | 凭据只存引用；`CredentialKey` 记录用 `modifyRecord` 读-改-写；`listRecords` 可发现孤儿；本地 provider 文件在 `$DSH_HOME/.credentials.yaml` | `docs/subsystems/credentials.md`；`packages/credentials/credentials-local/README.md` |
| 11 | 附件内容寻址、不可变，落在 `$DSH_HOME/attachments/v1`；retention-neutral，本地后端不 GC | `packages/attachment/attachment-local/src/index.ts:176`；`packages/attachment/attachment/README.md` |
| 12 | 会话事件只带附件引用，不带 base64/临时路径 | `docs/subsystems/attachment.md` 开篇 |
| 13 | `present` 只记绝对路径，不复制内容；`maxFiles` 默认 8，schema 建议 1–2/最多 4 | `packages/deliverables/tool-present/README.md`；`src/index.ts:23,45-48` |
| 14 | `workspace/changes` 只发 `{turn}` 事件；摘要留 Host 内存；整文件副本在 OS 临时目录；会话销毁即止 | `packages/deliverables/workspace-changes/README.md`；`src/recorder.ts:268-270` |
| 15 | spill 原样保存文本，返回不透明定位符；本地默认 OS 临时目录，`cleanupPeriodDays` 默认 30 | `docs/subsystems/spill.md`；`packages/spill/spill-local/README.md` |
| 16 | 文件写入支持 `createIfAbsent` / `replaceIfVersion`，省略即无条件覆盖 | `packages/fs/fs/src/types.ts` 的 `FsWriteIntent` |
| 17 | 技能根按项目/用户分层；项目根是最近 `.git` 祖先 | `packages/skill/skill-filesystem/README.md` 的 Roots and priority |
| 18 | `~/.agents` 是跨工具共享根，可被 `DSH_AGENTS_HOME` 覆盖 | `packages/util/home-paths/README.md` |
| 19 | 工作区记录删除不删目录与会话；重加换新 uuid | `packages/workspace/workspace/README.md`；`docs/subsystems/workspace.md` |
| 20 | `WorkspaceId` 生成 uuid，路径是独立的 realpath canon | `docs/subsystems/workspace.md` 的 Identity |
| 21 | 会话 cwd 不可变；日志默认 zstd 帧，`compression: 'none'` 才是 JSONL；没有删除 API | `docs/subsystems/persistence.md:356`；`packages/session/session-persistence-jsonl/README.md` |
| 22 | 沙箱是能力调用点的策略，不是插件代码的全局权限系统 | `docs/subsystems/filesystem.md`；`packages/fs/tool-fs/src/write.ts` |
| 23 | 模型可见 ⟺ 已记录 | 仓库根 `AGENTS.md:137`；`docs/architecture.md:124` |
| 24 | 第三方不要新增 `SessionEventMap` 类型；`plugin:` 记录只限 `packages/experimental/` | `docs/subsystems/session.md` 的 Plugin-contributed log-only events；`packages/core/session/README.md:68-76` |
| 25 | `sessionQuery` 是跨会话 live-preferred 读取；base 组合挂 SQLite provider | `docs/subsystems/session-query.md`；`packages/bundle/base/cordis.patch.yml:150-158` |
| 26 | `sessionProjections` 是 live 会话的纯同步 fold；持久检查点由 `session-projection-cache` 负责 | `packages/session/session-projection/README.md`；`packages/session/session-projection-cache/README.md` |
| 27 | `workspaceRegistry` 只在 shipped Web 组合挂载 | `packages/bundle/web-app/cordis.patch.yml:91-92`；headless 组合没有 |
| 28 | 客户端 UI 用 `localStorage` 按源/会话存状态；桌面快捷键写 `userData/keybindings.json` | `packages/client/shortcuts/src/client/storage.ts`；`packages/client/ui-shortcuts/README.md`；`packages/client/ui-conversation/src/client/stores.ts` |
| 29 | 会话导出 ZIP 包含会话树与附件，不包含被 `present` 的工作区文件内容 | `packages/session-query/session-log-export/README.md` |
| 30 | `ctx.workspaceCordis` 是社区 overlay 的服务，不是核心 API | `dsh-workspace-overlay` README 的 API 段 |

## 三、API 速查

| 需要 | 服务 | 关键方法 |
|---|---|---|
| 工作区文件读写 | `ctx.fs` | `resolve`、`stat`、`lstat`、`readText`、`readBytes`、`writeText`、`watch`、`contains` |
| 结构化宿主状态 | `ctx.storageDomain` | `open(spec)` → `table.get/put/update/delete`、`global.get/set`、`close` |
| 用户可调参数 | `ctx.settings` + `Config.volatile()` | 表单 `describe/update/replace/mutate`；`configure` 关闭自动页 |
| 秘密引用 | `ctx.credentials` | `resolve(ref)`、`describe(ref)`、`set/unset` |
| 多字段凭据/授权 | `ctx.credentials` | `readRecord`、`describeRecord`、`listRecords`、`modifyRecord`、`deleteRecord` |
| 二进制输入 | `ctx.attachments` | `saveImage(s)`、`saveFile`、`imageHostPath` |
| 大文本 | `ctx.spillStore` | `saveText` |
| 会话派生值（live） | `ctx.sessionProjections` | `register(definition)`、`snapshot(session)`、`checkpoint(session)` |
| 跨会话读取 | `ctx.sessionQuery` | `listSessions`、`filterSessions`、`readSession`、`filterEvents`、`readSurface`、`searchSessions`、`searchEvents` |
| 交付声明 | `present` 工具 | `files: [{ path, description? }]` |
| 改动 review | `ctx.workspaceChanges` | `summary(sessionId, seq)`、`diff(sessionId, seq, index, signal)` |
| 项目管理 | `ctx.workspaceRegistry`（可选） | `list`、`get`、`resolveByPath`、`create`、`delete` |
| 客户端本地 | 平台 API | `localStorage` / 桌面 `userData`（无 DSH 服务） |

## 四、`$DSH_HOME` 里的相关目录

```text
$DSH_HOME/
├── AGENTS.md              # 用户全局指令
├── skills/                # 跨项目技能
├── .credentials.yaml      # 凭据引用 + 记录（本地 provider）
├── .anonymous-user-id     # 安装级匿名 id
├── attachments/v1/        # 不可变附件对象
├── cache/                 # 可丢弃缓存（dshCachePath）
├── profiles/<name>/       # package.json + cordis.patch.yml（settings 写这里）
├── sessions/--<cwd>--/    # 会话日志（默认 zstd 帧）
└── storages/              # 域存储（默认 JSON 后端）
```

不在 `$DSH_HOME` 的数据：

```text
<workspace>/.dsh/          # 项目配置/技能（社区与核心都可能读）
<workspace>/.agents/       # 项目记忆/技能（社区约定）
~/.agents/                 # 跨工具共享根（DSH_AGENTS_HOME 可覆盖）
OS 临时目录                 # spill、workspace/changes 整文件副本
浏览器 localStorage         # Web 客户端状态
桌面 userData/              # Desktop 客户端状态
```

`~/.agents` 是刻意的第四个根：`AGENTS.md` 与 `skills/` 供多个 agent 工具共享，不受 `DSH_HOME` 迁移影响。

## 五、证据薄弱处

1. **没有实测多进程并发写 domain。** JSON 后端无文件锁、`domain/changed` 只进程内，是源码与 README 的结论；并发后果未做实验。SQLite 的 busy 行为也只按 README 记录。
2. **没有实测附件清理策略。** 本地后端目前保留所有对象；文档明确说 GC 未实现，但“将来会不会清理”没有承诺。
3. **没有实测 spill 过期。** `cleanupPeriodDays` 默认 30，启动时一次性 sweep；长期运行进程不会再次 sweep。
4. **没有实测远端文件系统（SSH 等）下的路径/键行为。** 本篇的路径建议以本地 realpath 为准。
5. **“用户会编辑/带走”是产品判断**，不是 DSH 的强制；项目内文件与 home 域两条路都成立，取舍取决于维护成本。
6. **多用户/远程租户**不在本篇范围；`remoteAccess` 只做授权裁剪，不提供按用户分区的存储。
7. **客户端 `localStorage` 的行为**来自源码阅读（键名、按 session 存），没有做跨浏览器/跨端口的实测。
8. **社区样本没有安装实测。** 2026-10-27 做了 README 与部分源码阅读，并对照本仓 rc.3；星数/目录计数不作为证据。

## 六、外部插件来源（源码阅读，未安装）

| 来源 | 用来支持什么 | 边界 |
|---|---|---|
| [dsh-memory-snapshot](https://github.com/yzx4036/dsh-memory-snapshot) | P0：零依赖、路径清单、文档原地不动；相对路径按启动目录解析 | 作者自述；钉在 0.2.x；其“DSH 只读 `~/.dsh/AGENTS.md`”前提已过时 |
| [dsh-workspace-memories](https://github.com/lengfengng-tech/dsh-workspace-memories) | P3：默认 home、可 opt-in 项目内；Markdown + 工具写 + 面板；1 MiB/32K 上限 | 源码硬编码 `~/.dsh`，忽略 `DSH_HOME`；无锁/原子写；未声明兼容版本 |
| [dsh-memory-evolve](https://github.com/csyangwen/dsh-memory-evolve) | P3/P4：五轨记忆、确认队列、git 分支同步、条目 id 锚点 | README 发布标签与 `package.json` 版本不一致；未审计全部功能 |
| [dsh-graphmemory](https://github.com/meyaomiao/dsh-graphmemory) | P3：SQLite + FTS/向量 + `_migrations` + 凭据引用；召回标不可信 | 0.2.x 对应 DSH 0.1.5-rc；仓库描述有无法核实的来源说法 |
| [dsh-project-context](https://github.com/P02-1010751281/dsh-project-context) | P2：项目内 journal 权威 + Markdown 派生、跨进程锁、备份、回填、设置命名空间 | 作者自述；v0.4.3 按 0.1.7-rc.2 写；没有核出与当前 DSH 冲突的说法 |
| [dsh-workspace-overlay](https://github.com/TTTPOB/dsh-workspace-overlay) | P2/P5：`<workspace>/.dsh/cordis.yml`、`workspaceCordis`/lease、热重载 | 第三方实现，非核心 API；`trustWorkspaceConfig` 默认 true |
| [dsh-custom-workspace](https://github.com/JeremyGuo/dsh-custom-workspace) | P3：按 workspace 持久化外观；自定义 loopback RPC | 旧 `settings.yaml` 写法，对 0.2.x 已过期；目标 0.1.0-rc.6 |
| [harness-insights](https://github.com/mapan0424/deepseek-harness-plugins/tree/main/packages/harness-insights) | P1：只折叠元数据、不存正文、可重建检查点 | 作者声明；绑定投影/持久化 API 的演进；另有独立镜像仓库 |
| [deepseek-harness-plugins](https://github.com/mapan0424/deepseek-harness-plugins) | P4：渠道配置 `defaultWorkspace` + 凭据放 profile/env | 第三方 monorepo；按 0.1.5-rc 验证 |
| [dshbase](https://dshbase.com/) / [awesome 目录](https://github.com/imsai-sh/awesome-deepseek-harness-plugins) | 生态规模与分类 | 站点自述，未审计；计数互相矛盾（13,882 / 20,006 / 23,307） |

## 七、外部生态来源（官方文档，2026-10-27）

| 来源 | 用来支持什么 |
|---|---|
| [VS Code API: ExtensionContext](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext) | `workspaceState`、`globalState`、`secrets`、`storageUri`、`globalStorageUri`、`logUri`、`extensionUri` |
| [VS Code API: Memento](https://code.visualstudio.com/api/references/vscode-api#Memento) | `setKeysForSync` 的整集合替换语义 |
| [VS Code: common capabilities](https://code.visualstudio.com/api/extension-capabilities/common-capabilities#data-storage) | 五种存储选项；memento 明文、secrets 加密 |
| [Obsidian: loadData](https://docs.obsidian.md/Reference/TypeScript+API/Plugin/loadData) | `data.json` 与 `null` 语义 |
| [Obsidian: build a plugin](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin) | `.obsidian/plugins/<id>/` |
| [Claude Code: settings](https://code.claude.com/docs/en/settings#settings-precedence) | 四层设置与优先级 |
| [Claude Code: memory](https://code.claude.com/docs/en/memory#how-claude-md-files-load) | CLAUDE.md 链 |
| [Claude Code: plugins](https://code.claude.com/docs/en/plugins/loading#find-plugins-on-disk) | 插件安装根/数据根/状态与缓存 |
| [Claude Code: uninstall](https://code.claude.com/docs/en/plugins/cli-reference#what-an-uninstall-deletes-and-keeps) | 卸载删除/保留、`--keep-data`、orphan GC |
| [Codex: config](https://learn.chatgpt.com/docs/config-file/config-basic#configuration-precedence) | 配置优先级与 `CODEX_HOME` |
| [Codex: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md#how-codex-discovers-guidance) | 全局 + 逐目录、32 KiB 上限 |
| [MCP architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture) | 无状态协议、`requestState` |
| [Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage) | `local`/`sync`/`session`/`managed` 与配额 |
| [Figma clientStorage](https://www.figma.com/plugin-docs/api/figma-clientStorage/) | 每插件 5 MB、本地、不同步 |
| [Figma pluginData](https://www.figma.com/plugin-docs/api/properties/nodes-setplugindata/) | 文档节点上的插件私有数据 |

## 八、v2 追加证据

| # | 结论 | 证据 | 等级 |
|---|---|---|---|
| 31 | 没有插件数据根；`$DSH_HOME/plugins/<id>/` 只是惯例 | 本机 `$DSH_HOME` 结构；inventory D1/D5；无核心服务 | C/U |
| 32 | 没有 session 删除；`SessionPersistence` 5 方法 | `packages/session/session-persistence/src/*.ts`；`2026-07-24` 提案 out-of-scope | C/P |
| 33 | 附件无 GC 是刻意（引用感知 GC blocker） | `2026-07-22-web-multimodal-image-input-and-durable-attachments` | H/C |
| 34 | spill 默认在 OS temp，不在 `$DSH_HOME` | `spill-local`；`cordis.patch.yml:411` 无 config | C |
| 35 | settings 是 profile 作用域；`settings.yaml` 一次性 import | `2026-09-19-profile-owned-live-configuration` | H/C |
| 36 | session 日志有跨进程 kernel lease；domain JSON 没有 | `session-persistence-jsonl/src/lease.ts`；`storage-json` | C |
| 37 | 没有 per-workspace domain/scope；proposed 明确 out-of-scope | `2026-07-24-domain-kv-storage-and-workspace` | P |
| 38 | 客户端状态分纯 UI 与 session-derived 投影 | `2026-08-25-session-observations-and-projection-owned-client-state` | H/C |
| 39 | 市场至少四种 workspace 表示、三种凭据家、卸载非生命周期 | [33 外部插件案例](../30-external/33-external-plugin-patterns.md)、[research-external](./research-external.md) | S/R |
| 40 | 插件直接改 session log/物理删目录是现实补丁 | session-workspace-organizer、archive-retention、archive-manager | R |

原生来源见 [research-native](./research-native.md)，外部样本见 [research-external](./research-external.md)；本轮改动见 [review-v2](./v2/review.md)。

## 九、相关阅读

- [21 原生 Landscape](../20-native/21-native-data-landscape.md)、[22 原生历史](../20-native/22-native-data-history.md)、[33 外部插件案例](../30-external/33-external-plugin-patterns.md)、[42 原生参考架构](../40-advisor/42-native-reference-architectures.md)。
- [FAQ 24 · 数据平面](../../24_plugin-publish-and-agent-data-planes/05-data-planes.md)：workspace / home / session 的三分与八条规则。
- [FAQ 25 · Workspace 与 Ungrouped](../../25_workspaces-and-conversations/answer.md)：工作区记录、attach、删除语义。
- [FAQ 22 · 上下文腐化](../../22_spec-drift-and-context-rot/answer.md)：compaction 遮蔽与日志只追加。
- `docs/subsystems/storage.md`、`session-projection.md`、`session-query.md`、`attachment.md`、`spill.md`、`deliverables.md`、`settings.md`、`credentials.md`、`filesystem.md`。
