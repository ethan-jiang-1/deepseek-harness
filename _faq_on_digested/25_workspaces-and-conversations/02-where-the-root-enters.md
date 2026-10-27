# 02 · 四个“根”：启动目录到底在哪一步起作用

## 这一篇回答什么

“根”在 DSH 里至少指四样东西，它们都能被叫作“工作目录”，但只有两个跟左侧分组有关。把四个拆开之后，H1（工作区 = 启动目录）错在哪一步就一目了然了。

## 四个根

| # | 名字 | 由谁决定 | 生命周期 | 用途 |
|---|---|---|---|---|
| ① | `process.cwd()` | 启动进程的人 | 一个进程一个值 | 缺省 cwd；沙箱兜底；headless 会话的目录（不经工作区层） |
| ② | `workspace.path` | 工作区记录 | 持久，直到记录被删 | 工作区身份；新建会话的 cwd 来源 |
| ③ | `SessionHeader.cwd` | 会话创建方 | 写入后不可变 | 入组门票；工具目录；沙箱边界 |
| ④ | `$DSH_HOME` | 环境变量或默认 `~/.dsh` | 持久 | 存放记录与日志；决定“哪一套侧栏” |

![四个根](./figures/01-four-roots.svg)

### ① 进程根：只在“没票”的时候兜底

`process.cwd()` 在产品代码里出现的位置很少，且都不是分组逻辑：

- `SessionCommandController` 的构造参数 `defaultCwd` 就是 `process.cwd()`（`packages/api/session-controller/src/index.ts:163`）。它只在 `session.create` **既没有 `workspaceId`、也没有 `cwd`** 时生效（`commands.ts:124` 的 `??` 链）。
- 沙箱策略的 `workspaceRoot` 配置默认值也是 `process.cwd()`，base 组合显式写成 `!!js process.cwd()`（`packages/bundle/base/cordis.patch.yml:247`）。但 `resolve()` 的真实规则是：**会话有 cwd 就用会话的，配置值只给无 cwd 的会话和 agentless 调用兜底**（`packages/sandbox/sandbox-policy/src/index.ts:168`）。
- headless / SDK 路径没有工作区登记这一步，会话 cwd 由调用方给；CLI 的默认值就是启动目录。

**它不决定左侧分组**：工作区记录里没有“进程 cwd”这个字段，Client 的投影里也没有。换个目录启动 `dsh web`，读到的还是同一个 `workspace.json`。

### ② 登记根：工作区自己的目录

`workspace.path` 是记录里唯一与文件系统绑定的字段。它做两件事：

1. **身份**：同一 realpath 只能有一条记录；标题可以重名，路径不能重复。
2. **工厂**：GUI 新建会话时，Host 用 `workspace.path` 作为会话的 cwd（`commands.ts:124`），然后把它写进日志头。

它不做的事：不监视目录、不拥有目录里的文件、不因为目录搬走而改写自己；`status()` 只是临时问一句“还在不在”。

### ③ 会话根：一张一次性门票 + 一条长期边界

`header.cwd` 在会话创建时写入，之后不可变（worktree 移动、目录改名都不会改写它）。它同时是：

- **门票**：attach 时 realpath 必须等于工作区路径（`workspace/src/entity.ts:110`）；
- **工具目录**：模型执行的 bash / 文件工具默认在这里；
- **沙箱边界**：`workspace-write` 的可写根就是它（`sandbox-policy/src/index.ts:168`）。

这也解释了为什么“把会话建在同一目录”不会自动入组：cwd 只是门票，进不进组要看有没有人拿着票去登记。

### ④ 数据根：这一整套侧栏住在哪

`$DSH_HOME`（默认 `~/.dsh`）里与本章有关的两处：

```text
$DSH_HOME/
├── storages/workspace.json          # 记录、顺序、归档、置顶、首启身份
└── sessions/
    └── --<normalized-cwd>--/        # 按 cwd 分区的可读目录名
        └── <encoded-session-id>/    # 每个会话一个目录，日志在里面
```

会话日志的分区名来自 cwd（`projectKey`，`packages/session/session-persistence-jsonl/src/format.ts:225`），但**分区只是存储布局，不是分组依据**：侧栏列的是所有分区里的会话，再由账户决定它们去哪一节。所以会出现“日志按 cwd 分区、界面按账户分组”这种看似错位的现象——它们本来就是两套东西。

换 home 等于换一整套：记录、日志、归档与置顶全变。同一个 home 开多个窗口则共享记录，各自只保存展开、本地顺序与筛选。

## 首启的默认工作区：第四个“不是启动目录”

当 registry 为空、且没有任何会话（含归档）时，Client 会调用 `workspace.initializeDefault()`，Host 解析系统 Documents 目录，在 `<Documents>/deepseek-harness/default-workspace` 下创建目录并登记一条工作区（`packages/api/workspace-controller/src/default-directory.ts:77`）。

三个细节：

- 标题取**请求路径**的最后一段（固定是 `default-workspace`），不取 realpath 后的名字，所以路径上的符号链接不会改标题；
- 显示时 `workspaceDisplayTitle` 把仍带这个自动标题的记录换成当前语言的“默认工作区”，只影响屏幕；
- 一旦登记过，身份就固定；即使之后删掉这条记录，也不会再自动创建（`defaultWorkspaceId` 会保留）。

它在 Documents 下，不在启动目录下——这是 H1 最直接的反例。

## 一个走查：从启动到一次工具调用

假设进程从 `/Users/bowhead/deepseek-harness` 启动，用户在左侧选中 `ai_dsh_assitant` 的工作区，点“＋”新建会话，然后让模型跑 `ls`：

| 步骤 | 用的是哪个根 |
|---|---|
| 启动 Web Host | ① = `/Users/bowhead/deepseek-harness`（只影响缺省值） |
| 读左侧 | ④ 的 `workspace.json` → 31 条记录、顺序、账户 |
| 点“＋” | Client 发 `session.create { workspaceId }` |
| Host 建会话 | ② 的 `path` → 写成 ③ 的 `header.cwd` |
| attach | 用 ③ 校验 ②，通过后写账户 |
| 模型跑 `ls` | 工具目录 = ③；沙箱可写根 = ③ |
| 左侧刷新 | 读 ④ 的账户 + 会话列表，重新投影 |

整条链里，① 只出现在第一行。把它换成任何目录，除“第一行”外其余各行都不变。

## 改什么，会变什么

| 你改的 | 会变 | 不会变 |
|---|---|---|
| 启动目录 | 无 workspaceId/cwd 的新会话 cwd；沙箱兜底（无 cwd 时） | 已登记工作区、侧栏分组、已有会话的 cwd |
| 工作区标题 | 左侧显示名、搜索结果里的工作区名 | 路径、账户、会话日志 |
| 工作区路径（删了重加） | 变成一条新记录，旧会话不入组 | 旧目录、旧日志、旧会话 |
| 会话 cwd（只能新建时定） | 门票、工具目录、沙箱边界 | 已写好的日志与事件 |
| `$DSH_HOME` | 整套记录与日志 | 目录里的项目文件 |

## 边界

- 本节只讨论 cwd 的“目录”语义；同一进程里还有 `DSH_PERMISSION_MODE` 等策略，会改变可写范围但不改变根。
- 远程访问会按权限裁剪可见工作区与会话，那是另一层过滤；它不改变“根”的定义。
- `process.cwd()` 在测试、脚本与子进程里可能被显式覆盖；本篇说的是产品组合里写死的那些位置。
