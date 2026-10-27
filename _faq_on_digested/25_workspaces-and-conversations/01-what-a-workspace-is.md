# 01 · 一条工作区记录：id、路径、标题、账户

## 这一篇回答什么

Workspace 在源码里到底是一个什么对象？它凭什么“记得”会话？记录存在哪里、什么时候被读写？为什么它不会跟模型发生关系？

## 它不是目录，是目录上的一条记录

`Workspace` 接口的数据字段与动作都不多（`packages/workspace/workspace/src/types.ts`）：

| 字段 | 语义 |
|---|---|
| `id` | 生成的 uuid，**不是路径**。路径会被规范化改写，引用锚点必须稳定 |
| `path` | 创建时对入参做 `fs.realpath` 的结果：尾斜杠、`..`、符号链接全部解开；此后永不改写，哪怕目录消失 |
| `title` | 显示名，默认取路径最后一段；注册表允许重名（不同目录可以有同一个 basename），但重命名 API 会拒绝同名；改标题不动路径 |
| `createdAt` / `updatedAt` | ISO-8601；创建算一次变更，之后每次成功写入都刷新 |
| `sessionIds` | **有序账户**：成员资格的唯一真相；数组顺序是手动排序模式的基础顺序 |

四个动作分别是 `setTitle`、`attachSession`、`insertSessionBefore`、`detachSession`，外加一个不写盘的 `status()`（实时看目录还在不在，返回 `'ok'` 或 `'missing-dir'`）。

一个容易忽略的取舍：**路径唯一性用字符串相等**。因为两边都先过 realpath，指向同一目录的符号链接会被判为“已拥有”并直接返回旧记录；反过来，拼写不同但 realpath 相同的路径也不会产生第二条。

## 账户是真相，目录只是门票

成员资格写在 `sessionIds` 数组里，不是每次从会话的 cwd 推导。读的时候会做一次校验：

- 成员的 cwd 经 realpath 后**等于** `workspace.path` → 正常返回；
- 目录彻底丢失（`ENOENT`，含悬空符号链接）→ **保留**账户，因为目录可能只是被临时移走；
- cwd 缺失、不是目录、或与路径不等 → 读取时过滤掉，**下一次成功写入时从盘上剪掉**。

这条规则有一个重要副作用：**过滤只影响“显示为成员”，不会把会话转给别的工作区**。所以一个会话要么属于某条记录，要么不属于任何记录；不存在“自动改嫁”。

`attachSession` 是唯一的入组写入口。它先做一次完整校验（会话存在、日志头有 cwd、realpath、是目录、与 `path` 相等），通过后把 id **前插**到数组头部；已经登记过的 id 不改变账户，但这次写入仍会顺手剪掉记录里已失效的候选，没有可剪的就完全不写。API 还提供 `insertSessionBefore(sessionId, beforeSessionId?)`（语义像 DOM 的 `insertBefore`），但当前 GUI 的会话拖拽只保存浏览器本地顺序，不调用它；写 Host 顺序的是工作区拖拽的 `insertBefore`。

## registry 负责“有哪些工作区、按什么顺序”

`ctx.workspaceRegistry` 是宿主侧服务，不是 agent-loop 的一部分：

| 动作 | 行为 |
|---|---|
| `create(path, title?)` | 要求全限定路径；realpath 后拒绝不存在或不是目录的路径；同一规范化路径已存在则**原样返回**旧记录；新记录前插到全局顺序 |
| `get(id)` / `list()` | 同步读缓存；`list()` 严格按 `workspaceIds` 返回 |
| `resolveByPath(path)` | 同一套 realpath 规范，只解析不创建 |
| `delete(id)` | 只删注册、顺序项与账户；目录、用户文件、活会话、持久日志都不动；未知 id 返回 `false` |
| `insertBefore(id, beforeId?)` | 改显示顺序，DOM 语义 |

`delete` 的“不删任何实体”不是实现偷懒，而是产品承诺：README 明说 “Removing a project leaves its folder, files, and session histories in place”，那些会话随之变成 Ungrouped。`create` 也不建立目录所有权——未来若要有破坏性文件操作，必须另外命名、另外确认、另外做所有权与安全检查。

## 持久形状：一张表 + 一个全局状态

工作区域由 `defineDomain` 声明（`packages/workspace/workspace/src/spec.ts:76`），版本 2：

```text
domain: workspace (version 2)
├── table: workspaces              # key = WorkspaceId
│   └── { path, title, sessionIds, createdAt, updatedAt }
└── global
    ├── initialized: boolean       # bootstrap 是否已经跑过（关键）
    ├── workspaceIds: WorkspaceId[] # 权威显示顺序
    ├── archivedSessionIds: SessionId[]  # 全局归档集合
    ├── pinnedSessionIds: SessionId[]    # 全局置顶集合（最近置顶在前）
    ├── defaultWorkspaceId?: WorkspaceId # 首启身份，删了也不允许再自动创建
    └── pendingMutation?: { operation: 'create' | 'delete', workspaceId }
```

物理位置是 `$DSH_HOME/storages/workspace.json`：base 组合把 `dsh-storage-json` 的 `root` 配成 `dshHomePath('storages')`，`storage-domain` 路由到 `json` 后端，unit 名就是域名。文件是单文件整包 JSON，所以能直接打开看；本机实测就是 `{"unit": {"name": "workspace", "version": 2}, "global": {...}, "tables": {...}}` 这个形状。

`pendingMutation` 是崩溃安全的支点：创建与删除都要写“记录 + 顺序”两处，先落一个标记，启动时只按标记完成或回滚那一次操作；没有标记却出现记录与顺序不一致，按损坏直接报错（fail loud），而不是猜。

## 启动时序：先修，再验，最后才可能扫历史

`Service.init`（`packages/workspace/workspace/src/index.ts:199`）的顺序是固定的：

1. 打开 workspace 域，拿到表与全局状态；
2. `recoverPendingMutation()`：有标记就完成/回滚被中断的那一次；
3. `validateStoredState()`：重复路径、同一个会话被两条记录登记、顺序漂移，全都拒绝启动；
4. **仅当 `initialized === false`**：读全部会话日志头，按规范化 cwd 分组，一组建一条工作区，最后写 `initialized: true`；
5. 重建按 `workspaceIds` 排序的实体缓存。

第 4 步就是“历史 bootstrap”。它只读 `id / cwd / createdAt` 三个头字段，从不读事件体；目录不存在或没有 cwd 的会话不入组。标记最后写，所以中断的 bootstrap 可以安全续跑；而一旦 initialized 为真，**再也不会重扫**。

依赖也是强制的：`storageDomain` 与 `sessionPersistence` 缺一不可；任何一方不可用时，插件保持 pending，而不是把“读不到历史”当成“历史为空”（`docs/subsystems/workspace.md`）。

## 它和模型没有关系

包的 Model Experience 写得很干脆：没有任何工具、没有提示词注入、没有会话事件，“no request field ever carries this package's data”，直接 token 成本为零，也不会影响前缀缓存。

模型能看到的是**会话自己的 cwd**：它出现在沙箱策略与工具执行目录里（02 篇）。工作区记录只是宿主用来组织这些会话的簿记，模型既不知道它存在，也不知道自己“属于”哪一条。

## 三条不变量

1. **id 稳定、路径规范**：引用工作区永远用 uuid；比较路径永远用 realpath 后的字符串。
2. **账户唯一**：一个会话最多被一条记录登记；读取时会过滤，写入时会拒绝重复登记。
3. **删除无副作用**：任何“删工作区”的动作都不触碰目录、文件、日志与活会话；想删实体是另外的能力（当前不存在）。

## 边界

- 记录没有跨进程协调：JSON 后端没有文件锁，同一 home 同时开两个写者不在保证范围内。
- 记录不监视目录：外部进程删掉目录后，UI 要到下次刷新/重启才反映 `missing-dir`。
- `title` 的 `create(path, title?)` 形参已经没有生产调用方（源码里有 TODO），当前创建路径只传路径。
