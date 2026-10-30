# Research v1 · 外部核验底稿（历史记录）

> **v1 历史记录**：记录第一轮外部核验；**编号为 v1 当时**。当前版本见 [research-external](../research-external.md) 与 [09 外部插件模式](../../30-external/33-external-plugin-patterns.md)。不要把它当当前合同。

这一份是 [06](../../30-external/31-external-community-patterns.md) 与 [07](../../30-external/32-external-adjacent-ecosystems.md) 的底稿，记录“读到了什么、核到什么程度、哪些没确认”。正文只保留结论；这里保留来源与反例，方便下次复核。

## 方法与边界

- **DSH 侧**：对照本仓 `dsh-v0.2.1-rc.3`（`1f81c047fc48fa190a683e469daa699857e9afe8`）的 docs 与源码。
- **社区侧**：2026-10-27 抓取九个仓库的 README，能读源码的读了源码；**没有安装、没有运行**，所以“已验证”只代表源码层面能对上。
- **相邻生态**：只取官方文档/API reference；VS Code、Obsidian、Claude Code、Codex、MCP、Chrome、Figma、JetBrains。标注“未确认”的是官方文档没有明说、只能从行为推断的部分。
- **星数/目录计数不作证据**：不同目录的计数互相矛盾（13,882 / 20,006 / 23,307），星数也有异常（某个目录仓库 stars == forks == 329）。

## 一、DSH 社区核验

### 1.1 样本与数据模型

| 插件 | 数据模型（源码/README 能支持的） | 核出的问题 |
|---|---|---|
| `dsh-memory-snapshot` | 无自有存储；`files` 每次装配系统提示词时全文重读；无写入通道 | 它说“DSH 只读 `~/.dsh/AGENTS.md`”不成立：还有 `<agentsHome>/AGENTS.md`（`DSH_AGENTS_HOME`，默认 `~/.agents`） |
| `dsh-workspace-memories` | 默认 `~/.dsh/workspace-memory/<workspace-key>/`，可选 `<workspace>/.dsh/memory/`；工具写 + 侧栏面板 | 源码硬编码 `path.join(os.homedir(), '.dsh', …)`，**忽略 `DSH_HOME`**；普通 `fs.writeFile`，无锁/原子写；未声明 DSH 兼容版本 |
| `dsh-memory-evolve` | `~/.dsh/memories/` 文件树；`§` 条目 + 隐藏 `[id:…]` 合并锚点；锁 10 s 陈旧/5 s 等待/25 ms 重试；tmp → rename → `.bak`；git 同步是显式批处理 | `package.json` 是 `0.1.0`/`private`，README 却按 `v26081302` 之类标签发版；兼容性只按快照标签声明 |
| `dsh-graphmemory` | `~/.dsh/graph-memory/graph-memory.db`；`node:sqlite` + WAL；`_migrations(v, at)`；`gm_*` 七张表；`embedding.apiKeyEnv` 只收引用 | 0.2.x 对应 DSH 0.1.5-rc.1/rc.2，版本映射容易装错；仓库描述里的“2026-04 清华”早于仓库创建（2026-09-04） |
| `dsh-project-context` | `<project>/.agents/memory/` + `.agents/skills/`；`memory.jsonl` 权威、`MEMORY.md` 派生；`MEMORY.md.lock`/`session-index.lock` 30 s 陈旧；备份最新 5 份；inode+字节数+mtime 三件套；`session-logs/` 是 DSH 会话的项目内副本；`.gitignore` 托管 | 没有核出与当前 DSH 冲突的说法；200 行索引上限会丢行，它自己保留旧索引兜底 |
| `dsh-workspace-overlay` | `<workspace>/.dsh/cordis.yml` 是只读输入（`write()` no-op）；`ctx.workspaceCordis` + canonical path lease；150 ms debounce；最后一个租约释放时 dispose | `trustWorkspaceConfig` 默认 `true`：克隆一个仓库就可能挂载并执行代码；服务名是 `ctx.workspaceCordis`，不是 `ctx.workspaceRegistry` |
| `dsh-custom-workspace` | `custom-workspace` 设置命名空间 + loopback `/custom-workspace` RPC；按 workspace 持久化外观 | README 的 `$DSH_HOME/settings.yaml` 对 0.2.x 已过期：settings 写 profile patch，home `settings.yaml` 只导入一次并改名 `.imported`；目标仍是 0.1.0-rc.6 |
| `harness-insights` | 无插件自有存储；只折叠 `assistant/message.usage`、provider/model、`tool/call.name`、时间戳；持久化的是 Harness 拥有的派生检查点 | 绑定投影/持久化 API 演进；同一包还有一个独立镜像仓库，URL 不唯一 |
| 渠道插件（mapan0424 monorepo） | profile/env + `defaultWorkspace`；凭据只存引用 | 按 0.1.5-rc.1 验证；一个默认 workspace 套所有项目 |

### 1.2 三处版本漂移

1. **memory-snapshot 的 AGENTS.md 前提**：当前 DSH 的用户全局链是 `$DSH_HOME/AGENTS.md` 然后 `<agentsHome>/AGENTS.md`；它只提了前者。这不影响“只读注入”的模式，但影响它给用户的解释。
2. **workspace-memories 的 home 路径**：README 说“DSH data directory”，源码却硬编码 `~/.dsh`。`DSH_HOME` 是 DSH 明确支持的（`packages/util/home-paths`），硬编码会让换 home 的用户数据分裂。
3. **custom-workspace 的 settings 路径**：0.1.0-rc.6 的 `settings.yaml` 写法在 0.2.x 已迁到 profile patch；它的 README 没更新。

### 1.3 社区里值得借的手法（已并入 06）

- journal 权威 + 渲染派生、锁内备份、原子写（project-context、memory-evolve）。
- 条目 id 做跨设备合并锚点，git 只做同步传输（memory-evolve）。
- SQLite + `_migrations` + 凭据引用（graphmemory）。
- 项目配置作为只读输入，`write()` no-op（workspace-overlay）。
- 派生-only 检查点，升级后重建（insights、session_projcache）。
- 软删除 + compact + confirm token + 召回标不可信（kb-manager，源码阅读）。
- 分层 sources → 单一 per-turn View（mnemon，源码阅读）。
- 只改 zstd 首帧 header 的 `cwd`，有 live session 就拒绝（session-workspace-organizer，源码阅读；不建议普通插件模仿）。

## 二、相邻生态核验

### VS Code

- 五个文档化选项：`workspaceState`、`globalState`、`storageUri`、`globalStorageUri`、`secrets`；`logUri` 单列；`extensionUri` 是只读安装根。
- `storageUri` 是工作区专属，没打开文件夹时 `undefined`，目录可能还不存在，创建是扩展的事；`globalStorageUri`/`logUri` 同样“可能不存在”。
- `setKeysForSync(keys)` 定义**整个**同步集合：空数组停止同步，非空替换全部键。
- `secrets` 加密（桌面 Electron `safeStorage`，Web DKE），不同步；文档明确说 memento 是明文，不能放秘密。
- 卸载：扩展目录删除；`scripts["vscode:uninstall"]` 可选；`globalStorageUri` 是否自动删除**未确认**。

来源：[ExtensionContext](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext)、[Memento](https://code.visualstudio.com/api/references/vscode-api#Memento)、[common capabilities](https://code.visualstudio.com/api/extension-capabilities/common-capabilities#data-storage)、[remote extensions](https://code.visualstudio.com/api/advanced-topics/remote-extensions#persisting-secrets)。

### Obsidian

- `loadData()`/`saveData()` 读写插件目录里的 `data.json`；`loadData()` 在从未保存时返回 `null`。
- 插件在 `<vault>/.obsidian/plugins/<id>/`；`.obsidian` 是 vault 的一部分，配置文件夹名可改；移动 vault 会带着它。
- 全局设置放在 OS 配置目录；`SecretStorage`（1.11.4）按 vault 隔离，值不写进 `data.json`。
- 卸载删除 `data.json` 是**推断**（它在插件目录里），官方文档没有明说。

来源：[loadData](https://docs.obsidian.md/Reference/TypeScript+API/Plugin/loadData)、[build a plugin](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)、[configuration folder](https://help.obsidian.md/Files+and+folders/Configuration+folder)、[manage vaults](https://help.obsidian.md/Files+and+folders/Manage+vaults)、[store secrets](https://docs.obsidian.md/Plugins/Guides/Store+secrets)。

### Claude Code

- 设置：`~/.claude/settings.json`、项目 `.claude/settings.json`、`.claude/settings.local.json`、managed；优先级 managed > CLI > project-local > project > user。
- CLAUDE.md：managed policy → `~/.claude/CLAUDE.md` → `./CLAUDE.md`/`.claude/CLAUDE.md` → `./CLAUDE.local.md`，broad→specific 拼接。
- transcript：`~/.claude/projects/<project>/<session>.jsonl`，明文，默认 `cleanupPeriodDays: 30`。
- 插件：`${CLAUDE_PLUGIN_ROOT}` 是版本化安装目录；`${CLAUDE_PLUGIN_DATA}` 指向 `~/.claude/plugins/data/<id>/`，跨版本稳定。
- 状态与缓存分开：`installed_plugins.json` / `known_marketplaces.json` vs `cache/`。
- 卸载：最后一个 scope 删除 options + secrets + data，除非 `--keep-data`；旧版本 `.orphaned_at` + 14 天 GC；启动时清理 orphan。
- MCP scopes：local/project/user，优先级 local > project > user，整条 entry 胜出。

来源：[settings](https://code.claude.com/docs/en/settings#settings-precedence)、[memory](https://code.claude.com/docs/en/memory#how-claude-md-files-load)、[plugins loading](https://code.claude.com/docs/en/plugins/loading#find-plugins-on-disk)、[uninstall](https://code.claude.com/docs/en/plugins/cli-reference#what-an-uninstall-deletes-and-keeps)、[MCP](https://code.claude.com/docs/en/mcp#mcp-installation-scopes)。

### Codex

- 用户 `~/.codex/config.toml`（`CODEX_HOME` 可换根）；项目 `.codex/config.toml` 从根到 cwd 逐层加载，**只有受信项目**才加载。
- 优先级 CLI > project > profile > user > cloud > `/etc/codex` > defaults；不可信项目跳过 `.codex/` 的 config/hooks/rules。
- `AGENTS.md`：全局一个文件 + 每个目录一个，root→cwd 拼接，32 KiB 上限。
- `auth.json` 可明文或 OS keychain；会话在 `~/.codex/sessions`，`history.jsonl` 是历史记录。
- hooks 信任按内容哈希记录；文件改了要重新信任。
- 卸载移除 bundle；单独接入的 MCP 连接保留。
- rollout 文件布局、MCP OAuth token 位置、CLI 插件安装路径**未确认**。

来源：[config basics](https://learn.chatgpt.com/docs/config-file/config-basic#configuration-precedence)、[AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md#how-codex-discovers-guidance)、[hooks](https://learn.chatgpt.com/docs/hooks)、[MCP](https://learn.chatgpt.com/docs/extend/mcp)、[plugins](https://learn.chatgpt.com/docs/plugins)。

### MCP

- 当前 revision `2026-07-28` 明确说“MCP is a stateless protocol: every request is self-contained and carries its own protocol version and capabilities”。
- 多轮请求之间的状态用不透明 `requestState`；resources 有 `cacheScope`（public/private）。
- Roots 和 Sampling 在这个 revision 已弃用（SEP-2577，至少 12 个月宽限）。
- MCP 不定义客户端配置作用域或存储位置。

来源：[architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)、[resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)、[roots](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)、[sampling](https://modelcontextprotocol.io/specification/2026-07-28/client/sampling)。

### Chrome

- `storage.local`：约 10 MB，移除扩展时清除；`unlimitedStorage` 可申请更大。
- `storage.sync`：约 100 KB 总量、8 KB/项、512 项、1800 次写/小时、120 次/分钟。
- `storage.session`：内存，扩展重载/更新/浏览器重启即清，默认对 content script 隐藏；官方建议用它存临时秘密。
- `storage.managed`：企业策略只读。
- `sync` 在卸载时是否清理**未确认**。

来源：[storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)。

### Figma

- `clientStorage`：按插件 ID、按用户、本地、5 MB、不同步；“stability, not security”，插件 ID 变了就丢。
- `pluginData`：挂在文档节点上，只有当前插件能读，100 KB/条。
- `sharedPluginData`：带 namespace，所有插件可读，100 KB/条。
- 卸载清理**未文档化**。

来源：[clientStorage](https://www.figma.com/plugin-docs/api/figma-clientStorage/)、[setPluginData](https://www.figma.com/plugin-docs/api/properties/nodes-setplugindata/)、[setSharedPluginData](https://www.figma.com/plugin-docs/api/properties/nodes-setsharedplugindata/)。

### JetBrains（部分）

- IDE 有 config/plugins/system/logs 四类目录，可用 `idea.config.path` 等重定位；config+plugins 跨大版本保留，caches/logs 180 天后自动删除。
- `.idea` 的项目级存储**未确认**。

来源：[IDE directories](https://www.jetbrains.com/help/idea/directories-used-by-the-ide-to-store-settings-caches-plugins-and-logs.html)。

## 三、未确认清单

- VS Code `globalStorageUri` 卸载时是否自动删除；Settings Sync 对已移除扩展状态的处理；磁盘上的 global/workspace storage 路径（官方文档故意不写）。
- Obsidian `data.json` 卸载删除（推断）；vault 移动后 secret 的行为。
- Claude Code 的具体 OS 凭据后端；`pluginConfigs` 的内容；最后一个 scope 卸载后的 cache 处理。
- Codex 的 rollout 文件名布局、MCP OAuth token 位置、CLI 插件安装路径与数据保留。
- Chrome `storage.sync` 卸载清理。
- Figma 卸载清理。
- JetBrains `.idea` / `PersistentStateComponent`。
- 任何社区插件的运行时行为；npm 可用性（抓取时 npmjs.com 返回 403）。
- 目录计数（13,882 / 20,006 / 23,307）没有一个是 census。

## 四、这些结论怎么进入正文

- 06 的“九个维度”与“十五种手法”：只保留源码能对上的机制；把三处漂移写成显式警告，不把社区代码当 API 合同。
- 07 的对照表：只保留官方文档能支持的名字；`logUri` 而不是 `logsUri`，没有 `globalStorageHome`；Claude Code 的 `PLUGIN_ROOT`/`PLUGIN_DATA` 与 orphan GC 作为“稳定数据根 + 卸载契约”的直接参照。
- answer 的五种承诺：把“客户端本地”提为一个独立家，但明确它不适合共享/模型可见数据；把 P2 扩成“项目内或用户全局”，避免把用户内容一律塞进项目。
