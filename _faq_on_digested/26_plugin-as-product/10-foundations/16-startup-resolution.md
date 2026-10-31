# 16 · 首次启动与项目目录：DSH 行为和产品自建策略

## 这一篇回答什么

产品作者必须区分 DSH Web 的默认 Workspace、Session 的初始工作目录、有效 working directory，以及产品自己管理的项目根。本篇记录 DSH 首用流程，并给产品自建目录选择的决策要求；项目选择 UI、API 和保存格式都由产品定义。

## 四种目录不是一个根

| 名称 | Owner | 用途 |
|---|---|---|
| **产品项目根** | 产品 | 产品工具索引或业务数据所对应的目录，可以不登记为 DSH Workspace |
| **DSH Workspace path** | Workspace registry | Web 项目导航、Workspace Session 分组和 Workspace 操作 |
| **Session `header.cwd`** | Session header | Session 创建时记录的原始工作目录；默认作为 sandbox policy 的 workspace root |
| **有效 working directory** | Session working-directory service | 当前 Session 后续相对文件操作和新进程的工作目录；可以改变 |

只需指定 Session 工作目录时，传绝对 `cwd` 即可。若还要把 Session 放入 DSH Workspace 分组，传已有 registration 的 `workspaceId`；Host 从中取得 canonical path，并将 Session attach 到 Workspace。两者不能同时提供。Session header 保存绝对初始 cwd。`WorkspaceId` 是 registration ID，不是 path、权限 token 或产品 project ID。改变有效 working directory 不会更改原始 Session header cwd、Workspace membership 或 sandbox writable roots。[Working Directory](../../../docs/subsystems/working-directory.md) 说明运行语义；[Workspace](../../../docs/subsystems/workspace.md) 说明登记语义。

## DSH Web 首用流程

Web 的 `ui-workspace` 在 Workspace 与 Session 列表都就绪后检查是否为空。只有 Workspace registry 为空且没有任何 live 或 persisted Session 时，Client 才请求 `workspace.initializeDefault()`。Host 在 Documents 下解析 `deepseek-harness/default-workspace`；Workspace registry 创建并登记该目录。随后 Client 为该 Workspace 创建或复用 blank Session。`initializeDefault()` 本身不创建 Session。

默认路径属于 Host 账户，而非远端浏览器。Linux Documents 目录不可用时，初始化会失败并显示提示“无法创建默认工作区，请通过‘选择工作区’选择文件夹”；用户可在当前 UI 通过 Workspace picker 立即恢复。失败后的默认初始化可在后续启动再次尝试；DSH 不会静默切换到产品定义的 `<dataRoot>/workspace`。

这个首用流程是 DSH Web 的当前行为，不是所有 profile 的启动保证。Headless 和 SDK profile 不运行 Web Client 的这段流程。产品若修改或替换 Web Workspace UI，应在实际 bundle composition 中验证其首次启动、Session 创建和错误恢复；不要依赖 Loader 行顺序或 placeholder registration 作为同步保证。

## Workspace 何时需要登记

当产品使用 DSH Web 的 Workspace 列表、会话分组或 Workspace operation 时，使用现有目录选择流程登记路径。`workspace.create({ path })` 要求目录已存在且是绝对路径；它规范化路径并保存 registration，不创建用户项目目录。

若产品只需要一个 Session 在指定项目目录工作，可创建 `session.create({ cwd })` 而不注册 DSH Workspace。若产品工具自己选择项目目录，它可以从当前 Session、显式产品记录或用户输入确定项目身份，但这属于产品设计，不是 Workspace registry 提供的项目选择器。

Workspace registration 不提供文件 API或模型权限。模型是否能调用 `read`、`write`、`bash` 等工具取决于 preset；工具如何解析文件、是否使用 sandbox policy，由具体 consumer 与 provider 决定。

## 用户选择目录

Web Workspace picker 复用 DSH 的 picker capability：本机可用 native capability 时，`directoryPicker.pick()` 返回 Host 系统选择的目录；remote、SSH、非 loopback 或无法使用 native chooser 的部署会采用 browse capability，Client 用 `directoryPicker.list()` 浏览并可通过 `directoryPicker.createDirectory()` 创建子目录。选择完成后，现有 Workspace picker 调用 `workspace.create({ path })`。这不是产品独占的流程。

产品可以定义自己的 onboarding UI 和 Remote 来保存产品设置，但这些 API 与保存格式由产品拥有。若使用 DSH Workspace picker，应调用其实际支持的 verbs，不要假设 native-only `pick()` 在 browse 部署中可用。

## 产品自建项目目录

如果产品需要自己的项目选择，在 Client 可交互后提供选择 UI；Host boot 不应等待用户。先按优先级检查：

1. 部署者配置了固定目录时，使用该目录；缺失或不可用时按产品自己的创建策略处理，不能静默换到其他目录。
2. 否则检查产品保存的用户选择。路径若已缺失，进入重新选择流程，不要在原路径创建一个空目录。若产品保留旧路径供恢复提示，重新选择状态必须优先于旧值。
3. 只有产品明确承诺默认位置时，才创建并使用产品默认目录。
4. 没有可用路径且产品要求用户选择时，等待 Client；取消保持可恢复状态，不阻塞 Host boot。

DSH Web 有自己的 Documents 默认 Workspace 和 Workspace picker；产品自建路径选择与保存不属于这些 DSH 功能。检查路径时区分缺失、权限失败、非目录和 volume mount 不可用。Session creation 可能创建 cwd 目录，因此不要对未经验证的用户选择直接创建 Session。

## 产品目录与 DSH Workspace 的关系

一个产品项目可映射到一个 DSH Workspace，也可只作为产品自己的目录。若映射到 DSH Workspace，Session 的初始 `header.cwd` 应与 Workspace path 匹配，Workspace registry 据此分组；产品需注意 DSH Web 自动创建的 Documents Workspace 仍属于该 profile 所在 home 的共享 registry。

产品自建的设置路径由产品 Config 或显式环境值决定。若设置文件位于 `$DSH_HOME` 下，使用稳定且文档化的产品路径，并在备份、迁移和卸载说明中列出。DSH 没有通用的每插件 data root；profile 名也不会过滤或隔离 home 数据。

## 用户取消、首次失败与无 Client

- Web `initializeDefault` 因 Documents lookup 或目录创建失败时，当前 UI 显示 Choose workspace 提示，不会在同一次运行自动改用产品默认目录。
- 用户取消 DSH picker 时，不创建 Workspace；用户之后可再次打开 picker。
- 产品自建目录选择应处理取消、超时、失联与重试；相关保存状态由产品定义。
- Headless/SDK profile 没有浏览器 Workspace picker。产品若需要目录，必须从 CLI 参数、profile Config、环境或既有配置取得；不得等待一个不存在的 Client。

## 边界

- DSH 当前 Web 首用目录是 Documents 下的 `deepseek-harness/default-workspace`；产品的 `dataRoot/workspace` 是另一项自建配置。
- DSH Workspace registration 不负责创建通过 picker 选择的目录，不删除项目内容，也不决定模型权限。
- 产品目录选择 API 与跨 profile 设置由产品维护，不属于 DSH Workspace contract。
- 本篇记录的首用 eligibility 是空 Workspace registry 且无 Session history；空侧栏本身不代表首次启动。
