# 16 · 启动解析：目录从哪来、不存在怎么办

## 这一篇回答什么

产品型实例启动时，workspace 的根目录可能已经存在、可能由产品默认给出、可能用户上次选过但现在不在了。**开机那一刻没有用户可问**，所以"弹窗让用户选"必须被安排到正确的时机。这一篇给四状态、解析顺序、占位（用侧栏时）和三个真实风险。

## 为什么不能在启动时弹窗

| 事实 | 依据 |
|---|---|
| Host 启动时没有浏览器连着 | `webStartup` 开监听，客户端之后才连 |
| 目录选择器是**交互能力**，不是 Host 启动 API | native 后端在宿主显示器上开系统对话框（远端客户端够不着）；browse 后端只供远端客户端的应用内选择器 |
| 客户端只在"registry 为空且无会话"时自动建默认工作区 | 首用默认工作区逻辑 |

所以真实形态是：**Host 先落到一个确定状态，客户端连上后由产品的客户端插件弹窗**。不能阻塞 boot 等用户。

![启动解析：四种状态与占位条件](../figures/16-startup-states.svg)

## 四种状态

```text
1. configured   profile 的 projectsRoot（部署方显式指定）
2. adopted      settings.json 里的 adoptedRoot（用户在弹窗里选过）
3. default      <dataRoot>/workspace（产品默认）
4. unresolved   没有 configured/adopted，且产品选择“先问”
```

`default` 与 `unresolved` 的差别是**策略**，不是目录：产品可以选“自动建默认目录”，也可以选“先标记 `pending`、等用户选”（用侧栏时再登记占位）。`pending` 标记写在 `settings.json`；下次启动读到 `pending` 就继续问，直到用户选定。

| 状态 | 目录存在 | 目录缺失 | 处理 |
|---|---|---|---|
| configured | 直接用 | `mkdir -p`（部署意图） | 失败则 fail loud |
| adopted | 直接用 | **不重建**，转 `missing` → 重新问 | 可能是未挂载的卷 |
| default | 直接用 | `mkdir -p` | 失败则 fail loud |
| unresolved | — | — | 标记 `pending`；用侧栏时登记占位；等客户端弹窗 |

`configured` 与 `adopted` 的差异是刻意的：**配置是"我想要那里"，记忆是"那里曾经在"。** 前者缺了就创建；后者缺了要重新问，不能悄悄用空目录覆盖一个可能只是暂时离线的卷。

命名约定：产品配置里的指针叫 **`projectsRoot`**，用户选择存在 `settings.json` 的 **`adoptedRoot`**；**不要**和 `sandbox-policy.workspaceRoot`（沙箱兜底根）混用。

## 启动算法

```text
boot:
  state = resolve(settings)             # 有 pending 且无 configured/adopted 时保持 unresolved
  if state in {configured, default}: mkdir -p(root)
  if state == adopted and !exists(root): state = missing
  if state in {configured, adopted, default} and isDir(root):
      if 产品要用 DSH 侧栏/会话分组: registry.create(root)
      ledger.mark(root)
  else:
      settings.mark(pending=true)
      if 产品要用 DSH 侧栏:
          placeholder = <dataRoot>/workspace
          mkdir -p(placeholder)
          registry.create(placeholder)   # 挡住 <Documents> 默认工作区
```

**登记 workspace 是可选的，取决于产品是否使用侧栏。** 架构 I（工具中介）通常不登记：产品根只是自己的项目目录，`registry.create` 与沙箱都不参与；架构 II（workspace 化）必须登记，因为会话要靠它拿 cwd。

判据只有一句：**产品是否需要 DSH 侧栏的项目列表/会话分组？** 需要 → 架构 II 登记；不需要 → 架构 I 不登记。

**占位的作用与边界。** 只有当产品**要使用 DSH 侧栏/首用默认工作区**时，占位才有意义：客户端首连只在"registry 为空、且既没有已存会话头也没有存档会话"时才建 `<Documents>/deepseek-harness/default-workspace`；先登记一个占位，这条路径被挡住（前提是占位先落地，见下段）。

**这只在占位先于客户端首连落地时成立**——Loader 行并发启动，先后没有保证（见下文风险 1，**U**）。如果产品不使用侧栏，可以不登记，也不需要占位。

删占位要小心：`workspaceRegistry.delete` 只删登记，目录与已开会话不动；如果用户已经在占位目录里开过会话，删登记会让那些会话变 Ungrouped。安全做法是**保留占位、把用户选的目录追加登记**，让用户自己决定删哪个；所有权判据见 [18](../10-foundations/18-install-upgrade.md) 的卸载一节。

## 弹窗：两种形态

| 形态 | 做法 | 代价 | 适合 |
|---|---|---|---|
| **A 产品自己的 modal** | 产品带一个客户端插件：连上后读插件 Remote 的状态，`pending` 就弹窗；"选择目录"调 `remote.directoryPicker.pick()`，再调插件的 `adopt(path)` | 要写客户端插件与两个 Remote 端点 | 首启体验可控 |
| **B 复用"添加工作区"** | 不弹窗；只登记占位并提示"用左侧 + 添加你的目录"；插件通过 `workspaceController.follow()` 或客户端回调感知并采纳 | 少写 UI，但用户要自己找入口 | 内部工具、迭代早期 |

两种都要回答"用户取消 / 关掉弹窗"：保持占位可用，下次连接再提示，不要卡死。

**默认建议**：早期用 B（复用"添加工作区"，少写客户端插件），首启体验成为产品核心后再上 A。

### 客户端插件的最小契约

形态 A 的产品要写一个客户端插件，最小需要：

1. **一个 `status` Remote**：返回 `{ pending, root }`；客户端连上后先读它。
2. **一个 `adopt(path)` Remote**：把用户选的目录写进 `dataRoot/settings.json`，清 `pending`。
3. **弹窗时机**：在 `ui-workspace` 启动导航之后；客户端插件按模块图拓扑序启动，`ui-workspace` 在 `apply` 里就开导航，不要假设自己先于它。**C**
4. **采纳后切会话**：`ctx.get('uiWorkspace').connectWorkspace(id)` 可切到该目录对应的 workspace；它会创建/复用 blank 会话，用户取消不能回滚。**C** 见[实验 02](../40-evidence/experiments/02-client-connect-workspace.md)。

**形状由你的插件定义**（不是 DSH 合同），最小建议：

```ts
status(): Promise<{ pending: boolean; root: string | null }>
adopt(path: string): Promise<{ root: string }>        // 路径不存在/不是目录 → 抛错
remote.directoryPicker.pick(): Promise<string | undefined>  // 取消 → undefined
```

失败路径：`adopt` 校验失败保留 `pending`，客户端提示后重试；用户取消不改 `pending`，下次连接再问。

打包形态没有唯一答案：客户端插件可以随产品 bundle 一起发（bundle 带客户端入口），也可以单独一个包；前者少一步安装，后者便于独立迭代。**U**（两种形态的加载差异未实测）

## 编排时机

| 时机 | 能做什么 | 不能做什么 |
|---|---|---|
| 启动 `apply`（T1） | 扫根、注册、写脚手架 | 反应不了用户刚选的目录；与客户端首连有竞态 |
| `agent/created` / `session/created`（T2） | 按会话 cwd 采纳、写脚手架；`agent/created` 是 serial，抛错会让会话创建失败 | 只在已有会话时触发；不能改 cwd |
| 客户端选目录后回调（T3） | 立刻采纳、提示 | 要客户端插件；用户取消就没发生 |
| 显式命令/设置页（T4） | 全量重建、修复 | 要用户主动 |

Host 侧**没有** `workspace/created` 事件；唯一增量来源是 `workspaceController.follow()`，它是面向客户端的长流（baseline + upsert/remove），不要当插件事件总线用。

## 选择记在哪

| 载体 | 语义 | 问题 |
|---|---|---|
| **全局设置**（推荐） | `dataRoot` 下的设置文件；`dataRoot` 稳定时跨 profile 一致 | 用户不可见；但正是"弹窗里选的那个" |
| 账本·状态 | 跨项目但不跨 profile 的记录 | 适合会话绑定；不适合"产品根" |
| profile patch | 安装参数 | 运行时选择混进安装文件；插件写自己那一行还要额外接口 |
| DSH registry | "这也是个工作区" | 跨 profile 共享，不能当私有记忆 |

原则：**安装默认值放 profile，用户运行时选择放全局设置。** 账本只放与项目绑定的记录（索引与绑定），不承担"这个产品从哪起步"。

## 无客户端时

headless / SDK / 纯 CLI 没有浏览器：

- 有 `configured` → 用；
- 否则用 `default`，并在启动日志里打一行（例如 `<plugin>: using default workspace <path>`）；
- `pending` 保留，等下一次有客户端时再问。

不要为了"等用户"阻塞启动，也不要因为问不到就起不来。

## 三个真实风险

1. **启动竞态**：Loader 的行并发启动，占位登记与 web 监听没有先后保证。`dsh web` 默认会自动打开浏览器，慢盘或慢插件下，客户端可能在占位登记完成前就连上并建出 `<Documents>` 默认工作区。

缓解：插件行排在 web 行之前、`apply` 里只做 `mkdir` + `create`，并实测一次带自动打开浏览器的冷启动；行是并发启动的，这个顺序只是提高概率。**U（未保证）** 实验设计见[实验 01](../40-evidence/experiments/01-startup-race.md)。
2. **挂载点被物化**：`session.create` 会对 cwd 执行 `mkdir -p`。如果 `adopted` 目录位于未挂载的卷，新建会话会**在挂载点造一个空目录**，卷再挂上时被遮住，现场极难排查。缓解：`missing` 状态不登记该路径，或登记前校验卷存在。**C**
3. **跨 profile 可见**：registry 全 home 共享，产品登记的工作区会出现在通用 `web` 的侧栏里，没有过滤机制。缓解：接受并写进 README，或改走独立 `DSH_HOME`。**C**

## 核对结论

- 客户端插件的加载顺序由**模块图拓扑序**决定（`orderByModuleGraph`，同层按扫描序），不是行序，也不是可控的同步点；`ui-workspace` 在 `apply` 里就启动导航。**C** 所以不要指望弹窗先于默认选择——占位是当前唯一可用的缓解，但不保证（见风险 1）。
- 客户端插件可以调用 `uiWorkspace.connectWorkspace(id)`：服务名 `uiWorkspace`、方法是公开面；顺序不保证，且调用会创建或复用 blank 会话。**C** 见[实验 02](../40-evidence/experiments/02-client-connect-workspace.md)。
- 插件可以用 `ctx.fiber.entry` 定位自己那一行，再调 `ConfigEditor.edit` 回写；仍推荐把运行时选择放全局设置文件。**C** 见[实验 03](../40-evidence/experiments/03-profile-writeback.md)。

## 与其它篇的关系

- 四个空间与账本的键：[15](./15-four-spaces.md)
- 启动配置从哪来：[17](./17-config-layers.md)
- workspace 的登记、删除、首用默认：[workspace 子系统](../../../docs/subsystems/workspace.md)

## 边界

- 单 Host、单 `$DSH_HOME`；客户端行为与浏览器实现相关。
- 启动竞态仍是 **U**，实验设计见[实验 01](../40-evidence/experiments/01-startup-race.md)。
