# 实验 02 · 客户端插件能否调用 `uiWorkspace.connectWorkspace`

**状态**：已收口（源码）。等级 **C**。

## 假设

第三方客户端插件可以拿到 `uiWorkspace` 服务并调用 `connectWorkspace(id)`，把界面切到指定工作区。

## 命令

```sh
grep -n "class UiWorkspaceService\|super(ctx, 'uiWorkspace')\|connectWorkspace(" packages/client/ui-workspace/src/client/navigation.ts
grep -n "connectWorkspace" packages/client/ui-workspace/src/client/navigation.ts | head
```

## 预期

如果服务以 `uiWorkspace` 名字注册、方法是公开的，则任何客户端插件都能通过 `ctx.get('uiWorkspace')` 调用。

## 实际

- `UiWorkspaceService extends Service`，构造函数 `super(ctx, 'uiWorkspace')`（[navigation.ts](../../../../packages/client/ui-workspace/src/client/navigation.ts) 的 `UiWorkspaceService` 符号）。
- `connectWorkspace(workspaceId, options?)` 是实现 `UiWorkspace` 接口的公开方法；内部走 `connectBlank` → `createNamed({ workspaceId, ... })`。
- 客户端插件通过 `ctx.get('uiWorkspace')` 取服务（服务名即注册名），不需要额外导出。

## 结论

**可以调用**：服务名 `uiWorkspace`、方法 `connectWorkspace` 都是公开面。两个限制：

1. **顺序**：`ui-workspace` 必须先 apply；在它之前调用的插件拿不到服务。
2. **语义**：调用会创建或复用一个 blank 会话，不是单纯"导航"；用户取消不能回滚已建的 blank。

## 改了哪篇

[16](../../10-foundations/16-startup-resolution.md) 的"待核实"第 2 条从 **U** 改为 **C**，并保留"顺序不保证"。
