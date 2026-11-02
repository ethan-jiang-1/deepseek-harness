# workspace 模型

核验入口：[`docs/subsystems/web-client.md`](../../../../docs/subsystems/web-client.md) 的「Workspaces」、[`packages/api/workspace-controller/README.md`](../../../../packages/api/workspace-controller/README.md)、[`packages/api/workspace-controller/src/client/`](../../../../packages/api/workspace-controller/src/client/)（`model.ts` / `service.ts`）。

会话窗口之外的另一份客户端状态：workspace 行、它们的顺序、归档与 pin。它和会话窗口共用同一套「完整 baseline + 增量 + generation 整体替换」的写法。

## 两个对象

| 对象 | 入口 | 拥有什么 |
|------|------|----------|
| `ClientWorkspaceModel` | `packages/api/workspace-controller/src/client/model.ts:62` | 浏览器侧的行、Workspace 顺序、归档与 pin 的 Session id 数组、命令回显，以及 stream/unary 竞态消解 |
| `WorkspaceController` | `service.ts:118` | 把模型暴露成 `ctx.workspaces`；UI 侧由 `ui-workspace` 贡献 `useWorkspaces` 与导航回调（`docs/subsystems/web-client.md:52`） |

## 流的形状

每个 stream generation 先给一份**完整 baseline**，之后是 `upsert` / `remove` / `order` / `archived` / `pinned` 五类增量；重连时用新 baseline 整体替换模型（`docs/subsystems/web-client.md:52`）。这和会话窗口的「generation 替换」是同一条纪律：增量永远在 baseline 之上，不存在「残缺状态 + 补丁」的中间态。

命令有两条回执路径：unary 响应，以及随后的 stream 增量。两者可能乱序到达，所以「命令回显」由模型统一合并，而不是由调用方各自对账（`:52`）。

## 归档与 pin

归档行**保留它在顺序里的位置**，渲染成灰色、不能打开，直到通过 `unarchiveSession` 恢复（`packages/api/workspace-controller/src/index.ts:169`）；完整归档集合经 unary 响应与 `archived` 增量一起到达客户端。显示顺序是浏览器本地的，并且**包含隐藏的归档**；pin 把某个 Session 在这条完整顺序里前移，取消 pin 不会把它放回原位（`docs/subsystems/web-client.md:52`）。

## 它不是第二份真相

Host 侧决定 durability 与 mutation 顺序：`archiveSession` / `unarchiveSession` / `pinSession` 都是 Host 上的 `@Remote` 命令（`packages/api/workspace-controller/src/index.ts:159`、`:169`、`:179`），客户端模型只维护最新可用投影。所以「本地把数组改了、界面对了」不代表 Host 上真的发生了这件事。

## 插件作者视角

- 读 workspace 状态用 `ctx.workspaces` 或 `ui-workspace` 给的 `useWorkspaces`，不要自己再开一条 follow。
- 改状态走 Host 命令（`archiveSession` / `unarchiveSession` / `pinSession`）；不要直接改模型里的数组或本地重排。
- 不要复制 `archived` / `pinned` 数组进自己的 store：generation 替换之后副本就过期了，判断「这行能不能打开」应每次都问模型。
