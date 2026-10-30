# 07 · 启动时目录不存在：解析顺序与首启弹窗

这一篇把"插件即产品"的目录模型收敛成一个可以照着写代码的状态机。**前提模型**（已与负责人对齐）：

```text
插件包（只读）        提示词、模板、种子、预设风格 —— 随 npm 版本走
    ↓ 复制/引用
workspace（可读可改） 用户的项目内容 —— 要么 home 下的默认目录，要么用户指定
    ↓ 派生
账本（可重建）        索引、游标、会话绑定 —— 键是 workspace 路径
```

也就是说：**插件和普通 harness 一样需要 workspace，只是它的默认 workspace 由产品自己给，用户也可以换。** 剩下的唯一问题是"启动时那个目录不存在怎么办"。

## 硬事实：开机那一刻没有用户可问

| 事实 | 依据 |
|---|---|
| Host 启动时没有浏览器连着 | `webStartup` 开监听，客户端之后才连 |
| 目录选择器是**交互能力**，不是 Host 启动 API | `ctx.directoryPicker` 的 native 后端在**宿主显示器**上开系统对话框（远端客户端够不着），browse 后端供远端客户端的应用内选择器使用 |
| 客户端只在"空 registry 且无会话"时自动建默认工作区 | [navigation.ts:463](../../packages/client/ui-workspace/src/client/navigation.ts) |

所以"启动时弹窗"实际是：**Host 先落到一个确定状态，客户端连上后由产品的客户端插件弹窗**。不能阻塞 boot 等用户。

## 目录解析：四种状态

```text
1. config.workspaceRoot      部署/安装层显式指定      → configured
2. ledger.root               用户上次在弹窗里选的      → adopted
3. $DSH_HOME/<plugin>/workspace   产品默认             → default
4. 以上都没有                                        → unresolved
```

每一步都要核实目录是否存在、是不是目录：

| 状态 | 目录存在 | 目录缺失 | 处理 |
|---|---|---|---|
| configured | 直接用 | **mkdir -p**（部署意图就是要建） | 失败则 fail loud |
| adopted | 直接用 | **不重建**，转 `missing` → 重新问 | 可能是未挂载的卷 |
| default | 直接用 | **mkdir -p** | 失败则 fail loud |
| unresolved | — | — | 进"待选"状态 |

`configured` 与 `adopted` 的差异是刻意的：**配置是"我想要那里"，记忆是"那里曾经在"。** 前者缺了就创建，后者缺了要重新问，不能悄悄用空目录覆盖一个可能只是暂时离线的卷。

## 启动算法（含防抢占）

```text
boot:
  state = resolve()                       # 上表
  if state in {configured, default}:
      mkdir -p(root)
  if state == adopted and !exists(root):
      state = missing
  if state in {configured, adopted, default} and isDir(root):
      registry.create(root)               # 幂等；同时让 DSH 首用默认工作区失效
      ledger.mark(root)
  else:
      placeholder = $DSH_HOME/<plugin>/workspace
      mkdir -p(placeholder)
      registry.create(placeholder)        # 关键：registry 非空 → initializeDefault 不生效
      ledger.mark(placeholder, pending=true)
```

**`registry.create(placeholder)` 这一步是防抢占的核心。** 客户端首连时只有在"registry 为空且没有任何会话"时才走 `initializeDefault`（会在 `<Documents>/deepseek-harness/default-workspace` 建目录）。启动时先登记一个占位工作区，这条路径就永久失效；用户答完弹窗后，再决定保留还是删掉占位。

删占位要小心：`workspaceRegistry.delete` 只删登记，目录与已开会话不动；如果用户已经在占位目录里开了会话，删登记会让那些会话变 Ungrouped。安全做法是**保留占位、把用户选的目录追加登记**，让用户自己决定删哪个。

## 弹窗：两种形态

| 形态 | 做法 | 代价 | 适合 |
|---|---|---|---|
| **A 产品自己的 modal** | 产品带一个客户端插件：连上后读插件 Remote 的 `workspaceStatus()`，`pending` 就弹窗；"选择目录"调 `remote.directoryPicker.pick()`，再调插件的 `adopt(path)` | 要写客户端插件与两个 Remote 端点 | 首启体验可控 |
| **B 复用"添加工作区"** | 不弹窗；产品只登记占位并提示"用左侧 + 添加你的目录"；插件通过 `workspaceController.follow()` 或客户端回调感知新工作区并采纳 | 少写 UI，但用户要自己找入口 | 内部工具、迭代早期 |

两种都要回答"用户取消 / 关掉弹窗"：保持占位目录可用，下次连接再提示，不要卡死。

## 选择记在哪：账本，不是 profile

| 载体 | 语义 | 问题 |
|---|---|---|
| **账本** `dataRoot/settings.json`（推荐） | 插件自己的运行时状态 | 用户不可见；但正是"弹窗里选的那个" |
| profile patch | 安装参数 | 运行时选择混进安装文件；插件写自己那一行还要额外接口 |
| DSH registry | "这也是个工作区" | 跨 profile 共享，不能当私有记忆 |

原则：**安装默认值放 profile，用户运行时选择放账本。** 两者都可以指向同一个目录，但权威只有一个——如果账本里有记录，就以账本为准，profile 只提供默认。

## 无客户端时的降级

headless / SDK / 纯 CLI 没有浏览器，弹不出来。此时：

- 有 `configured` → 用；
- 否则用 `default`，并在启动日志里打一行 `deck-studio: using default workspace <path>`；
- `pending` 状态保留，等下一次有客户端时再问。

不要为了"等用户"阻塞启动；也不要因为问不到就把产品起不来。

## 写进插件时要改的三处

1. **`dataRoot` 与 workspace 分开**：账本放 `dataRoot`，模型可写的项目内容放 workspace。**不要把账本目录本身登记成 workspace**，否则模型能改写自己的注册表。
2. **包内模板只读**：`seeds/` 之类随包发布，bootstrap 时**复制**到 workspace（或由工具读取），升级时**不覆盖**用户改过的副本，只做版本比对与提示。
3. **登记与删除都走 registry**：`create` 幂等；删除只删登记、不删目录；把这条写进 README 的卸载说明。

## 待核实

- 产品的客户端插件能否在 `ui-workspace` 的 `restoreSelection` 之前完成弹窗决策（顺序无保证；占位方案让顺序变得不重要）。**U**
- 客户端插件能否调用 `uiWorkspace.connectWorkspace(id)` 切到新目录；若不能，就让用户点一下侧栏。**U**
- 插件把自己的选择写回 profile patch 的受支持通道（`configEditor` / settings 表单）对"插件自己的那一行"是否可达。**U**

## 成立性检验（已核对源码）

| 断言 | 结论 | 依据 |
|---|---|---|
| Host 启动时没有用户可问，弹窗必须发生在客户端 | 成立 | picker 是交互能力；native 在宿主显示器、browse 供远端客户端 |
| 先登记占位工作区能挡住 `<Documents>` 默认工作区 | 成立 | `initializeDefault` 在 `workspaceIds` 非空时直接返回 undefined |
| 账本目录不能同时是模型可写的 workspace | 成立（有前提） | 仅当 preset 挂了通用写工具时才有风险；否则模型根本写不了 |
| "workspace 可读可改"由 workspace 决定 | **不成立** | 可写性来自 preset 的工具面；workspace 只给 cwd 与沙箱根 |

### 三个真实风险

1. **启动竞态**：Loader 的行并发启动，插件登记占位与 web 服务开监听没有先后保证。慢盘/慢网络下，客户端可能先连上并建出 `<Documents>` 默认工作区。缓解：插件行放在 web 行之前、`apply` 里只做 `mkdir` + `create`（不做扫描），并实测一次冷启动。**未保证**
2. **挂载点被物化**：`session.create` 会对 cwd 执行 `mkdir -p`。如果 `adopted` 目录位于未挂载的卷（如外置盘），新建会话会**在挂载点创建一个空目录**，卷再挂上时把它遮住，现场很难看出来。缓解：`state=missing` 时不登记、不允许在该路径建会话，或登记前 stat 校验卷存在。
3. **跨 profile 可见**：registry 是全 home 共享的。Deckline 的占位与项目目录会出现在通用 `web` 的侧栏里，没有过滤机制。缓解：接受（并在 README 说明），或改走独立 `DSH_HOME`。

### 结论

模型成立，可以推进；但 FAQ 里必须把"可写性来自 preset 工具面，不来自 workspace"写在显眼位置，否则会重复一个很自然的误解。
