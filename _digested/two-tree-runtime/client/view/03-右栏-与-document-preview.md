# 右栏与 document preview

核验入口：[`docs/subsystems/client-resources.md`](../../../../docs/subsystems/client-resources.md)、[`docs/subsystems/sidebar-right.md`](../../../../docs/subsystems/sidebar-right.md)、[`packages/client/resources/README.md`](../../../../packages/client/resources/README.md)。决策记录：`.agents/notes/implemented/architecture/2026-09-05-client-resource-model.md`、`.agents/notes/archived/architecture/2026-09-05-sidebar-tab-types-and-navigation.md`（已归档，只作历史）、`.agents/notes/archived/architecture/2026-09-07-workspace-files-dual-face-package.md`（已归档，只作历史）。

这一页讲两种「用地址读内容」的消费面：资源协议（`dsh-resource://`）与右栏的 tab / slot 体系；holder 生命周期在 [`../state/02`](../state/02-资源模型与-holder-生命周期.md)。

## 右栏

右栏是每个 Session 一个的 docking surface。四个包分工（`docs/subsystems/sidebar-right.md:5`）：

| 包 | 角色 |
|----|------|
| `packages/client/ui-sidebar-right` | 拥有 surface、tab 类型注册表、导航服务 `ctx.sidebarRight` |
| `packages/client/ui-dockkit` | 内部布局引擎；是 `ui-sidebar-right` 的内部依赖，不是稳定接口 |
| `packages/client/resources` | `ctx.resources`、`useResource`、协议到值类型的名册 |
| `packages/api/workspace-files` | Host `ctx.workspaceFiles` + `workspaceFiles` Remote namespace + Client `file` 资源 provider |

`ui-dockkit` 不是 Loader row，而是**浏览器平台静态模块**：`packages/client/web/src/platform.ts:15` 把 `'@deepseek-ai/dsh-client-ui-dockkit'` 列进 `PLATFORM_MODULES`，让 seed、bundle external 与 Vite alias 共用同一个模块身份。

### tab 类型注册

一个 tab 类型是**两条共享 `id` 的注册**：`ctx.sidebarRightTabs.register(definition)` 里的静态定义说明它的 `kind` 开哪些地址，加一条 keyed slot 注册提供 body（key 就是定义的 `id`）。定义是静态的，没有 per-tab / per-session 的运行时钩子。

| 字段 | 含义 |
|------|------|
| `id` | 实现身份，跨所有注册唯一（通常写包名）；body 与 title 都挂在这个 key 下 |
| `kind` | 类型的判别式，也就是 `openTab` 的名字。不唯一：扩展可以接管 builtin 的 kind。出货 kind 是 `guide` / `text` / `files`，0009 起新增 `browser`（builtin，多实例，仅 desktop 挂载，`ui-sidebar-browser`）与 `subagentchat`（builtin，寻址子 agent 会话）；另有 `terminal`（multiple）、`plan`、`scheduleTask`、`changes-review` 四个 builtin 也挂在默认 web-app，共 9 种（`docs/subsystems/sidebar-right.md:41`、`:143-147` 只列前五种；experimental 的 `session-inspector-log` 另计） |
| `patterns` | 可选，识别哪些资源地址；按 kind 打开的页面类型不写。含 `:` 的模式匹配整个地址，不含的匹配 URL path 的任意层级。大小写不敏感，语法是 picomatch 的 POSIX 方言 |
| `priority` | 三个字面带（`packages/client/ui-sidebar-right/src/client/tab-registry.ts:49` 的 `SidebarRightTabPriority`）：`extension`（默认且最高）、`builtin`、`fallback` |
| `canOpen(address)` | 可选的同步否决，每次路由决策都跑 |
| `title(address)` | chip 文本，在开 tab 时捕获进布局记录，之后不再改写 |
| `guide` | 可选的 guide 入口框：`{ order, title(), description?(), icon? }`；省略就不上 guide 页 |

路由是一次带排名的认领：`candidates(address)` 先按带、再按最长命中模式长度、最后按注册顺序排；`claim(address, kind?)` 取第一个候选，或直接取被点名的 `kind`（跳过 glob，`canOpen` 仍生效）。没有任何类型认领的地址会抛错——那是接线错误，不是用户错误。一个 `kind` 可以同时有一条 `builtin` 和一条 `extension` 注册，生效的是 extension；extension 注销后 builtin 复位。

### 导航服务

`ctx.sidebarRight` 只有两个 open，所有进入右栏的路径都走其中之一：`openResource(address, options?)` 收 `dsh-resource://` 地址（对话里的文件链接、tool 行的行号引用、文件树的行），`openTab(kind, options?)` 收页面（strip 的添加控件、guide 入口框）。`openTab` 的页面地址由右栏自己写成 `sidebar://<kind>`（`packages/client/ui-sidebar-right/src/client/contract/seed.ts:46`），调用方从不自己拼。

两个 open 都按同样的步骤执行并记成一条历史：认领 → 已有同 `(kind, address)` 的 tab 则聚焦 → 否则落一个新 tab → 展开列。用户看不见的内容不会被打开，所以折叠状态会在同一步展开。`openResource` 对非 `dsh-resource://` 地址或无人认领的地址抛错，`openTab` 对没有注册的 kind 抛错。

其余操作按「读 / 写」分开：`close(tabId)`、`focus(tabId)`、`split(paneId?)`、`float(tabId, rect?)`、`dock(paneId)` 是写；`active()`、`isExpanded()` 是读，`toggleExpanded()` 是翻转（改状态并记历史，因此同样要求已挂载 surface）。读在没有挂载 Session surface 时返回 `undefined` 或 `false`，写则抛错，而不是写进没人画的 surface。

### slot

右栏声明六个扩展 slot（`packages/client/ui-sidebar-right/src/client/contract/slots.ts:59-105`；`docs/subsystems/sidebar-right.md:99-107` 只列其中四个），它的 document tab 另声明一个 keyed document body：

| Slot | 基数 | 用途 |
|------|------|------|
| `sidebar.right.pane.tab` | keyed by `id`，Session scope | 一个 tab 的 body；按生效实现的 `id` 分发，所以注册者收到它 kind 的每个 tab，docked 或 floating 都是 |
| `sidebar.right.pane.tab.title` | keyed by `id`，Session scope | chip 标题；没有条目时用开 tab 时捕获的 `title(address)` 文本 |
| `sidebar.right.tab.guide` | chain，Session scope | 替换 guide tab 的内容而不替换 tab；第一个不 decline 的条目接管 |
| `sidebar.right.tab.guide.entry` | keyed，Session scope | 一个 provider 的 guide 卡片；缺省回落到标准卡片 |
| `sidebar.right.tab.guide.actions` | list，root scope | guide 的 More 菜单行；有注册才显示 More（rc.3 新增） |
| `sidebar.right.tab.menu.item` | list，Session scope | 内容级动作，追加在 kit 自己的布局动作之后；动作型条目必须调 owner 的 `dismiss()` |
| `sidebar.right.tab.document` | keyed by document `id`，Session scope | document tab 里被选中的文件渲染器；父级拥有共享的加载与工具栏 |

body、title 与 guide 替换都能拿到框架注入的 `useTabInfo()`，返回 `{ sidebar, panel, tab }`；`tab.signal` 在记录消失或插件卸载时 abort，**不**在隐藏或切 Session 时 abort。

### 出货类型与 doc 预览

| kind | 带 | 说明 |
|------|----|------|
| `guide` | `builtin` | `openTab('guide')` 打开；每个贡献的 `guide` 条目一个胶囊，按 `order` 排 |
| `text` | `fallback`，`dsh-resource://file/**`，只认领 Session 地址 | Document Preview 的所有者：用 `useResource<'file'>` 观察元数据，用 Remote 回调读内容，自己拥有渲染器选择、工具栏、per-tab 刷新、滚动与源码导航 |
| `files` | `builtin` | `openTab('files')` 打开；工作区目录树，懒加载 `list`，点文件用 `tab.actions.openResource(fileAddressFor(sessionId, root, path))` 开进自己的 pane |

`text` tab 是共享的 Document Preview owner：它的 root 注册声明 `sidebar.right.tab.document` 并提供 `ctx.documentPreviews`，渲染器在自己的 effect 里注册 `DocumentPreviewDefinition`（唯一 `id`、`extensions`、本地化 `title()`、`loading`、可选 `priority`、可选 `wrap`），再 keyed 到 document slot。渲染器注册表**保留所有**实现（与 tab kind 的接管相反），工具栏列出匹配的备选并按 tab 记住选择；未知扩展名走纯文本。内容按页读 `remote.workspaceFiles.read`（`packages/client/ui-sidebar-documentpreview/src/client/rpc.ts:81` 的分页绑定）、整读走无 `range` 的 `readBytes`（`packages/client/ui-sidebar-documentpreview/src/client/index.ts:99`），HTML 的关联文件读走 `baseFile` 形态的 `readBytes`（`packages/client/ui-sidebar-documentpreview/src/client/html/index.ts:36`），Host 侧解析路径。

文件操作拒绝最终符号链接并强制传输上限，`read` 另要求 UTF-8 文本；失败用 `workspace-file/*` 码。`dsh-api-workspace-files` 同时是双面包：Host 服务 + Client `file` provider，它的 `dsh.client.inject` 列 `api-gateway` 与 `client-resources`（`packages/api/workspace-files/package.json:45-47`）。Session 地址带上授权的 Session 与相对/绝对路径原样交给 Host；裸 `absolute` 地址没有可授权 Session，失败于 `workspace-file/unknown-workspace`，不借用当前或 Tab Session。任何 UI（包括 Global 组件）读同一个完整地址就共享同一条观察流。

## 阅读顺序

1. [`docs/subsystems/client-resources.md`](../../../../docs/subsystems/client-resources.md)：地址、provider、四态、holder 生命周期的权威正文。
2. [`docs/subsystems/sidebar-right.md`](../../../../docs/subsystems/sidebar-right.md)：tab 类型字段表、导航选项、slot 与 owner props、出货类型、Not built 清单。
3. [`packages/client/resources/src/client/contract.ts`](../../../../packages/client/resources/src/client/contract.ts)：`Resources` / `ResourceProvider` / `ResourceSnapshot` 的类型定义。
