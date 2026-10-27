# Answer 25 · 左侧那一列不是目录树，是一份登记簿的投影

## 一分钟结论

**Workspace 是一条 Host 侧的持久记录，不是进程的启动目录。**

一条记录只有四样东西：生成的 uuid、`fs.realpath` 规范化后的绝对路径、显示标题、一个有序的会话 id 数组（账户）。它存在 `$DSH_HOME/storages/workspace.json`，随 home 走，不随进程走；模型完全看不见它（不注册工具、不注入提示词、不写会话事件）。

**会话进组靠登记，不靠目录匹配。**

创建时带 `workspaceId`，Host 才把 `workspace.path` 写成会话的 `header.cwd`，再调用 `attachSession` 前插进账户；分叉会继承父会话的工作区；首次启动会按目录把历史会话扫进来一次。除此之外没有第五道门——把会话建在同一个目录下、重启 Host、刷新页面，都不会让一个未登记的会话自动归队。入组校验只有一张门票：日志头的 cwd 经 realpath 后必须等于工作区路径。

**Ungrouped 不是 Host 的记录，是 Client 的一个减法。**

左侧把“不在任何 `workspace.sessionIds` 里的可见会话”收进末尾的未分组桶，桶的 key 是空字符串，标签来自字典，顺序只存在浏览器本地。它不是回收站，也没有工作区菜单；里面的会话照样能打开、继续、分叉、归档。

**产品代码只在两个地方读取启动目录**：创建会话既没给 `workspaceId` 也没给 `cwd` 时的默认值（`process.cwd()`），以及沙箱 `workspaceRoot` 的兜底。headless/CLI 是另一条路径，直接把启动目录当作会话 cwd，不经过工作区层。它从未进入左侧分组的数据流。

![四个根](./figures/01-four-roots.svg)

## 两个假想，对了一半

| 假想 | 实际 | 差在哪 |
|---|---|---|
| H1：Workspace = 启动时的工作目录根 | 工作区是 home 里的一条登记记录；启动目录只是“缺省工厂” | 记录可以指向任何已存在的目录，与本次进程从哪启动无关；同一 home 下可以有几十个工作区 |
| H2：Conversation 与这个根强相关 | 与本会话**登记进去的那个工作区**强相关；与启动目录无关 | 关系是写进账户的引用，不是对目录的实时查询；同一目录的会话可以一半在组里、一半在 Ungrouped |

这套设计并不古老：设计记录写明，在 workspace 实体出现之前，侧栏分组就是按 cwd 推导的视觉分组；现在归属是 workspace 自己的事实。**你的直觉对应的是旧实现。**

把这两句话再压一下：

> **目录是入组时的门票，账户才是成员资格；启动目录连门票都不是，它只是没票时的默认目的地。**

## 四个“根”各管什么

| 名字 | 谁写 | 管什么 | 会不会决定左侧分组 |
|---|---|---|---|
| `process.cwd()` | 启动进程的人 | 缺省 cwd；沙箱兜底；headless 会话的全部目录 | **不会** |
| `workspace.path` | 工作区记录（创建时 realpath） | 工作区身份；新建会话的 cwd 来源 | **会**（节的身份与顺序） |
| `SessionHeader.cwd` | 会话创建时写入，此后不可变 | 入组门票；工具执行目录；沙箱可写边界 | **会**（但只通过账户引用） |
| `$DSH_HOME` | 环境变量或默认 `~/.dsh` | 存放 `workspace.json` 与会话日志；决定“哪一套侧栏” | **间接**（换 home = 换一整套） |

首启还有一个容易误认的默认值：当 registry 为空、且没有任何会话时，GUI 会调用 `initializeDefault`，把默认工作区建在 `<Documents>/deepseek-harness/default-workspace`，标题是固定段名 `default-workspace`，显示时再按当前语言本地化。它同样不是启动目录。

## 六篇分读

| # | 分篇 | 一句话 |
|---|---|---|
| 01 | [记录模型](./01-what-a-workspace-is.md) | 一条记录、一个账户、一个 registry；持久形状、启动顺序、三条不变量 |
| 02 | [四个根](./02-where-the-root-enters.md) | 进程根 / 登记根 / 会话根 / 数据根各管什么；启动目录真正出现的位置 |
| 03 | [入组路径](./03-how-a-session-joins.md) | 四道门与一张门票；bootstrap 只跑一次；删除与重加；目录丢失时谁还留着 |
| 04 | [Ungrouped](./04-ungrouped.md) | 一个减法；四种来源；为什么插件测试最容易掉进去；本机实测 |
| 05 | [左侧解剖](./05-sidebar-anatomy.md) | 节顺序、行顺序、置顶、归档、空白会话、三种分组方式，谁算的 |
| 06 | [怎么处置](./06-what-to-do.md) | 看到 Ungrouped 该做什么；插件作者、测试作者、普通用户的三种做法 |

## 本机实测（2026-10-27，静态读取 `$DSH_HOME`）

这些数字只描述这台机器，不是产品常量；列出来是为了让“目录一样、命运不同”可核对。

| 读数 | 值 | 口径 |
|---|---|---|
| 工作区记录 | 31 | `workspace.json` 的 `workspaces` 表 |
| 已登记会话 id | 935 | 31 条记录的 `sessionIds` 并集 |
| 磁盘会话目录 | 3864 | `sessions/--<cwd>--/<id>/` 计数 |
| 其中 subagent 子会话 | 2890 | 日志头 `origin=subagent` 或有 `parentSession` |
| 主会话 | 974 | 总数减 subagent |
| 主会话中已登记 | 916 | 与账户并集求交 |
| 主会话中未登记 | **58** | 916 + 58 = 974 |
| cwd 分区 | 35 | `sessions/` 下的 `--…--` 目录数 |
| 归档 / 置顶 | 67 / 0 | 全局集合 |

58 条的分布：**31 条在 `/Users/bowhead/deepseek-harness`**（这个目录明明有工作区），25 条在 `ait_exam_4fun`（这个目录没有工作区），2 条在两个 worktree 目录。这一条分布本身就是证据：如果分组是“按目录实时匹配”，前 31 条不可能留在 Ungrouped。

## 快问快答

| 问题 | 短答 |
|---|---|
| 换一个目录启动 `dsh web`，左侧会变吗？ | 不会。记录在 home 里；启动目录只影响“没有 workspaceId 的会话”的缺省 cwd。 |
| 删掉工作区，会话会没吗？ | 不会。只删注册、顺序与账户；目录、文件、日志、正在跑的会话都不动。会话立刻变成 Ungrouped。 |
| 再把同一目录加回来，旧会话会回来吗？ | 不会。那是一条新的空工作区；bootstrap 不会重跑。 |
| 把目录挪走再挪回来，成员资格会恢复吗？ | 已登记的成员在目录彻底丢失（ENOENT）时保留账户；目录回来就照旧显示。未登记的新会话不能靠挪目录入组。 |
| Ungrouped 里的会话能继续用吗？ | 能。能打开、继续、分叉、归档；只是没有工作区菜单，也不会出现在某个“＋”下。 |
| 为什么 Ungrouped 没有“…”菜单和悬浮卡片？ | 它没有 backing Workspace：没有标题、路径、创建时间，也没有可重命名/删除的对象。 |
| 为什么空白会话只看到一条？ | 未选中的空白会话被可见性规则挡掉，只保留当前那一行“新会话”占位。 |
| 为什么 subagent 不算进 Ungrouped？ | 侧栏可见性直接排除 `origin=subagent`；它们再“没归属”也不会渲染。 |
| 同一个 home 开两个窗口，分组会同步吗？ | 会。记录与增量来自 Host 的同一条 `workspace/follow` 流；展开状态、本地顺序、筛选各窗口各自保存。 |
| 换 `DSH_HOME` 会怎样？ | 换一整套：workspace 记录、会话日志、归档与置顶全在 home 里。 |
| 左侧一行是“Conversation”吗？ | 行是 Session；Conversation 是打开会话后的事件装配层，不参与分组。 |
| 两个目录同名会怎样？ | 注册表允许重名；通过 API 重命名会以 `workspace/name-conflict` 拒绝，客户端也会先拦截。 |
| 工作区记录会进模型上下文吗？ | 不会。零 token；模型只感知会话自己的 cwd（沙箱边界与工具目录）。 |

## 一个反直觉的结论

**“Ungrouped 越来越多”不是分组坏了，而是登记模型在按设计工作。**

bootstrap 只在 `initialized = false` 时运行一次；之后没有任何“按目录补收”的后台任务。用 headless、SDK、插件测试、自动化脚本创建的会话，只带 cwd、不带账户，于是必然落在 Ungrouped。这不是遗漏，而是“归属由显式动作产生”的另一面：删除工作区之所以安全（不删会话、不删文件），正是因为它只动账户，不动任何实体。

代价是：**账户不会自愈**。想修复，只有三条路——显式 attach、重新建一条工作区再逐条登记、或者换一个新 home 从干净状态开始（见 [06](./06-what-to-do.md)）。

## 证据与边界

- 记录模型与生命周期：`packages/workspace/workspace/src/index.ts`（启动 199、创建 238、首启 258、删除 585、bootstrap 650）、`src/entity.ts:110`（attach）、`src/spec.ts:57`（持久形状）。
- 会话创建：`packages/api/session-controller/src/commands.ts:111`（create）、`:124`（cwd 来源）、`:140`（attach）、`:300` 附近（fork attach）；`src/index.ts:163`（`process.cwd()` 缺省）。
- 沙箱边界：`packages/sandbox/sandbox-policy/src/index.ts:168`；组合默认值 `packages/bundle/base/cordis.patch.yml:247`。
- 左侧推导：`packages/client/ui-workspace/src/client/tree.ts:18`（UNGROUPED_KEY）、`:244`（可见性）、`:334`（分组）、`:436`（deriveGroups）。
- 列表可见性：`packages/api/session-controller/src/list.ts:144`。
- 产品合同：`docs/subsystems/workspace.md`、`packages/workspace/workspace/README.md`、`packages/api/workspace-controller/README.md`。

边界：

- 本机读数是一次静态扫描（日志头 + `workspace.json`），不是 GUI 的实时行数；UI 还会隐藏未选中的空白会话，所以“58”是可解释的上界。
- 没有对远程访问裁剪、Desktop 多进程共享 home 的并发写做实测；05 篇只说明可见性过滤存在。
- 工作区记录没有跨进程协调（JSON 后端没有锁）；同时开两个写同一 home 的 Host 不在本篇保证范围内。
