# 16 · 启动解析：目录从哪来、不存在怎么办

## 这一篇回答什么

产品型实例启动时，workspace 的根目录可能已经存在、可能由产品默认给出、可能用户上次选过但现在不在了。**开机那一刻没有用户可问**，所以"弹窗让用户选"必须被安排到正确的时机。这一篇给四状态、解析顺序、占位防抢占和三个真实风险。

## 为什么不能在启动时弹窗

| 事实 | 依据 |
|---|---|
| Host 启动时没有浏览器连着 | `webStartup` 开监听，客户端之后才连 |
| 目录选择器是**交互能力**，不是 Host 启动 API | native 后端在宿主显示器上开系统对话框（远端客户端够不着）；browse 后端只供远端客户端的应用内选择器 |
| 客户端只在"registry 为空且无会话"时自动建默认工作区 | 首用默认工作区逻辑 |

所以真实形态是：**Host 先落到一个确定状态，客户端连上后由产品的客户端插件弹窗**。不能阻塞 boot 等用户。

## 四种状态

```text
1. config.workspaceRoot      部署/安装层显式指定   → configured
2. ledger.root               用户上次在弹窗里选的   → adopted
3. $DSH_HOME/<plugin>/workspace   产品默认          → default
4. 以上都没有                                     → unresolved
```

每一步都要核实目录是否存在、是不是目录：

| 状态 | 目录存在 | 目录缺失 | 处理 |
|---|---|---|---|
| configured | 直接用 | **`mkdir -p`**（部署意图就是要建） | 失败则 fail loud |
| adopted | 直接用 | **不重建**，转 `missing` → 重新问 | 可能是未挂载的卷 |
| default | 直接用 | **`mkdir -p`** | 失败则 fail loud |
| unresolved | — | — | 进"待选"状态 |

`configured` 与 `adopted` 的差异是刻意的：**配置是"我想要那里"，记忆是"那里曾经在"。** 前者缺了就创建；后者缺了要重新问，不能悄悄用空目录覆盖一个可能只是暂时离线的卷。

## 启动算法

```text
boot:
  state = resolve()                     # 上表
  if state in {configured, default}: mkdir -p(root)
  if state == adopted and !exists(root): state = missing
  if state in {configured, adopted, default} and isDir(root):
      registry.create(root)             # 幂等
      ledger.mark(root)
  else:
      placeholder = $DSH_HOME/<plugin>/workspace
      mkdir -p(placeholder)
      registry.create(placeholder)      # 关键：让首用默认工作区失效
      ledger.mark(placeholder, pending=true)
```

**占位登记是防抢占的核心。** 客户端首连只有在"registry 为空且没有任何会话"时才走 `initializeDefault`（会在 `<Documents>/deepseek-harness/default-workspace` 建目录）。启动时先登记一个占位工作区，这条路径就永久失效。**C**

删占位要小心：`workspaceRegistry.delete` 只删登记，目录与已开会话不动；如果用户已经在占位目录里开过会话，删登记会让那些会话变 Ungrouped。安全做法是**保留占位、把用户选的目录追加登记**，让用户自己决定删哪个。

## 弹窗：两种形态

| 形态 | 做法 | 代价 | 适合 |
|---|---|---|---|
| **A 产品自己的 modal** | 产品带一个客户端插件：连上后读插件 Remote 的状态，`pending` 就弹窗；"选择目录"调 `remote.directoryPicker.pick()`，再调插件的 `adopt(path)` | 要写客户端插件与两个 Remote 端点 | 首启体验可控 |
| **B 复用"添加工作区"** | 不弹窗；只登记占位并提示"用左侧 + 添加你的目录"；插件通过 `workspaceController.follow()` 或客户端回调感知并采纳 | 少写 UI，但用户要自己找入口 | 内部工具、迭代早期 |

两种都要回答"用户取消 / 关掉弹窗"：保持占位可用，下次连接再提示，不要卡死。

## 选择记在哪

| 载体 | 语义 | 问题 |
|---|---|---|
| **账本** `dataRoot` 下的文件（推荐） | 插件自己的运行时状态 | 用户不可见；但正是"弹窗里选的那个" |
| profile patch | 安装参数 | 运行时选择混进安装文件；插件写自己那一行还要额外接口 |
| DSH registry | "这也是个工作区" | 跨 profile 共享，不能当私有记忆 |

原则：**安装默认值放 profile，用户运行时选择放账本。** 两者可以指向同一目录，但权威只有一个——账本有记录就以账本为准，profile 只提供默认。

## 无客户端时

headless / SDK / 纯 CLI 没有浏览器：

- 有 `configured` → 用；
- 否则用 `default`，并在启动日志里打一行（例如 `deck-studio: using default workspace <path>`）；
- `pending` 保留，等下一次有客户端时再问。

不要为了"等用户"阻塞启动，也不要因为问不到就起不来。

## 三个真实风险

1. **启动竞态**：Loader 的行并发启动，占位登记与 web 监听没有先后保证。慢盘下客户端可能先连上并建出 `<Documents>` 默认工作区。缓解：插件行放在 web 行之前、`apply` 里只做 `mkdir` + `create`，并实测一次冷启动。**U（未保证）**
2. **挂载点被物化**：`session.create` 会对 cwd 执行 `mkdir -p`。如果 `adopted` 目录位于未挂载的卷，新建会话会**在挂载点造一个空目录**，卷再挂上时被遮住，现场极难排查。缓解：`missing` 状态不登记该路径，或登记前校验卷存在。**C**
3. **跨 profile 可见**：registry 全 home 共享，产品登记的工作区会出现在通用 `web` 的侧栏里，没有过滤机制。缓解：接受并写进 README，或改走独立 `DSH_HOME`。**C**

## 待核实

- 产品客户端插件能否在 `ui-workspace` 的 `restoreSelection` 之前完成弹窗决策（顺序无保证；占位方案让顺序变得不重要）。**U**
- 客户端插件能否调用 `uiWorkspace.connectWorkspace(id)` 切到新目录。**U**
- 插件把自己的选择写回 profile patch 的受支持通道对"自己那一行"是否可达（因此推荐账本）。**U**

## 与其它篇的关系

- 四个空间与账本的键：[15](./15-three-spaces.md)
- 启动配置从哪来：[17](./17-config-layers.md)
- workspace 的登记、删除、首用默认：[workspace 子系统](docs/subsystems/workspace.md)
