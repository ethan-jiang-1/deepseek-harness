# 01 · 用户选了一个目录之后：逐帧看 DSH 在哪里留了什么

这一篇只回答一个事实问题：**在 `DSH web` 里点"添加工作区"、选中一个目录，然后开一个会话，DSH 到底在哪些地方写下了什么？** 结论先行——**目录里什么都不写，profile 里也什么都不写**；所有知识落在 `$DSH_HOME` 和浏览器本地。**C**

## 逐帧

| 帧 | 发生在哪 | 动作 | 写入了什么 |
|---|---|---|---|
| 1 | 浏览器 | 用户点目录选择器，`directoryPicker.pick()` 或浏览列表 | 无（[navigation.ts:391](../../packages/client/ui-workspace/src/client/navigation.ts)） |
| 2 | 浏览器 | `createWorkspace({ path })`（[WorkspacePicker.tsx:131](../../packages/client/ui-workspace/src/client/WorkspacePicker.tsx)） | 无 |
| 3 | Host | Remote `workspace/create` → `WorkspaceController.create` → `ctx.workspaceRegistry.create(path)` | 无（先校验） |
| 4 | Host | `realpathNormalize` 规范化；路径必须**已存在**且是目录，否则拒绝；同一个 canonical path 幂等返回既有记录（[workspace/src/index.ts:236](../../packages/workspace/workspace/src/index.ts)） | 无 |
| 5 | Host | 新记录：`id`（uuid）、`path`（canonical）、`title`（路径末段）、`createdAt/updatedAt`、空 `sessionIds`；**插到 durable 顺序最前面** | `$DSH_HOME/storages/workspace.json`（domain `workspace` v2，single 布局；[spec.ts:76](../../packages/workspace/workspace/src/spec.ts)、[base 根](../../packages/bundle/base/cordis.patch.yml)） |
| 6 | 浏览器 | `follow()` 流收到 `upsert`，列表出现这个工作区 | 无 |
| 7 | 浏览器 | 用户点开它 → `connectWorkspace` → `session.create({ workspaceId })`（[navigation.ts:194](../../packages/client/ui-workspace/src/client/navigation.ts)） | 无 |
| 8 | Host | `cwd = workspace.path`（[commands.ts:124](../../packages/api/session-controller/src/commands.ts)）；`mkdir -p cwd`（[agent.ts:565](../../packages/api/session-controller/src/agent.ts)）——目录已存在时是空操作 | 无 |
| 9 | Host | 会话以 `SessionHeader.cwd` 写入日志（不可变） | `$DSH_HOME/sessions/...`（[base](../../packages/bundle/base/cordis.patch.yml)） |
| 10 | 浏览器 | 当前会话选择写入本地存储，键 `dsh.sessions.current`（[navigation.ts:159](../../packages/client/ui-workspace/src/client/navigation.ts)） | 浏览器 `localStorage` |
| 11 | **用户目录** | — | **没有任何写入。** 没有 marker，没有 `.dsh/`，没有索引 |

第 11 帧是重点：`workspaceRegistry.create` 只 `stat` 校验，从不创建文件；唯一会 `mkdir` 的是首用默认工作区的 `initializeDefault`（[workspace/src/index.ts:259](../../packages/workspace/workspace/src/index.ts)）。

## 所有权 × 删除 × 迁移

| 事实 | 权威落点 | 作用域 | 谁删 | 换 profile | 换 `$DSH_HOME` / 换机器 |
|---|---|---|---|---|---|
| "这个目录是一个工作区" | `$DSH_HOME/storages/workspace.json` | home | 用户删登记（`delete` 只删登记，目录与会话不动） | **还在**（共享同一份） | **丢**，要重选 |
| 工作区标题、显示顺序 | 同上 | home | 同上 | 还在 | 丢 |
| 会话属于这个目录 | 会话日志 `header.cwd` | home | 无删除 API | 还在 | 丢（除非导出） |
| 当前打开哪个会话 | `localStorage: dsh.sessions.current` | 浏览器/设备 | 清站点 | 不在 | 不在 |
| 目录里的内容 | 用户目录 | 用户 | 用户 | 跟目录走 | 跟目录走（若同步/git） |
| 插件自己的索引/游标 | 插件 domain 或自造目录 | home 或目录 | 插件 | 看配置 | 看配置 |
| 产品参数（`projectsRoot`、`displayName`） | `profiles/<name>/cordis.patch.yml` | profile | 安装方/用户 | 只在该 profile | 不跟目录走 |

## 三个直接后果

**① 目录没有自描述锚点。**
同一份代码库在 A 机器和 B 机器被选中，会得到两个全新的 `WorkspaceId`，两次互不相关的登记，彼此没有任何"这是同一个项目"的依据。DSH 里唯一稳定的项目标识是 **canonical path 字符串**，而它只在同一台机器、同一份 `$DSH_HOME` 内一致。想跨 home 携带，只能自己在目录里放 marker（代价：污染仓库、要用户同意），或依赖内容哈希（git remote + 相对路径）这类外部事实。

**② 同一份 home 下，所有 profile 共享同一个工作区列表。**
`workspace` domain 落在 `$DSH_HOME/storages`，没有按 profile 分区，也没有过滤接口。`deckline` 与 `web` 看到的是同一排工作区。如果产品实例只想看到 `projectsRoot` 下的项目，**过滤只能在插件/客户端层自己做**。

**③ 用户的选择只活在一台机器的 home + 一个浏览器里。**
换机器、换 `DSH_HOME`、甚至换浏览器源，选择都要重来；而目录内容本身不受影响。这就是"用户知道目录在哪、DSH 不知道"的根源。

## 由此得到的设计问题

如果产品希望"用户选过的目录，下次启动还在，而且是我这个产品的一套"，就必须显式选择把这条知识存在哪里：

| 载体 | 自描述 | 跨 home/机器 | 污染目录 | 适合 |
|---|---|---|---|---|
| 只用 DSH registry | 否 | 否 | 否 | 零成本起步 |
| 插件 domain（键 = 路径哈希） | 半（插件知道） | 否 | 否 | 产品自己的索引/游标 |
| 目录内 marker 文件 | 是 | 是 | 是 | 需要携带、需要外部工具也认 |
| profile patch | 半（安装参数） | 否 | 否 | `projectsRoot`、displayName 这类"装一次"的参数 |
| 会话日志 | 否 | 否 | 否 | 只说明"发生过一次会话"，不是项目目录 |


## 现实样本：`deckline` 现在把知识放在哪

本机已经有一个在跑的插件即产品实例，正好可以对照（只读观察，2026-10-30）：

```text
~/.dsh/profiles/deckline/
├── package.json          # bundles: dsh-base → dsh-web-app → dsh-plugin-deck-studio
└── cordis.patch.yml      # provider/模型/preset 默认值；未覆盖 deck-studio 行（用插件默认）

~/.dsh/deckline/          # 插件 dataRoot（默认 $DSH_HOME/deckline）
├── decks/                # 每个 deck 的工作目录（script/slides/versions）
├── projects/<id>/source  # 项目内容（当前实现；可由 projectsRoot 改写落点）
├── decks-registry.json   # 账本：id/label/sourceRoot/意图/风格
├── designs-registry.json
├── session-bindings.json # 会话 → deck/design 的绑定
├── events.jsonl + events/
└── resources/            # 跨 deck 共享素材
```

几条与本文直接相关的事实：

1. **插件有自己的账本根** `dataRoot`，默认落在 `$DSH_HOME/deckline`，可用 `dataRoot` / `DSH_DECK_DATA_ROOT` 改。
2. **`projectsRoot` 已经存在**，但语义很窄："新建 deck 项目直接建在 `<projectsRoot>/<目录名>/`"；留空则用内部的 `decks/` + `projects/`。
3. **会话与项目的关联不是 cwd，而是插件自己的 `session-bindings.json`**。解压一个已绑定会话的头部可见：`cwd: /Users/bowhead/ai_dsh_deep_research`、`agentPreset: deck-studio`、`sandbox/mode: workspace-write`、`approval/policy: ask`。会话落在一个与 deck 项目无关的目录里。
4. **所有写盘都走插件代码的 `node:fs`**（`deck-workspace.js` 等），模型调用的是 `deck_*` 工具，不是 `write`/`bash`。

也就是说：当前设计**根本不需要模型对项目目录有写权限**，沙箱问题被"工具中介写"绕开了。这正是第 04 篇要摆到第一位的分叉：**项目目录是 DSH workspace，还是插件的私有数据面？**

下一章把"`projectsRoot` 到底是什么"拆开，再决定这些载体怎么组合。
