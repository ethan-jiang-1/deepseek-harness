# 用户 patch 的 HMR

> [!IMPORTANT]
> HMR (Hot Module Replacement) 机制允许在不重启进程的情况下，动态换入新的组合 patch。它通过原子切换确保「新配置要么全生效，要么回滚」。

![热更新架构](./figures/live-recompose.svg)

## 核心机制：原子换入

*   **监视目标**：profile 的 `cordis.patch.yml`、home 层 patch 和 `package.json` (bundle清单)。
*   **原子切换 (Watchpoints)**：`hmr.reconcileProfile()` 调和配置，利用串行队列避免并发竞态。
*   **[Watchpoint]**：如果监视失败或原子切换锁定超时，检查 `appReady` 状态。

## 刷新流程

1.  **指纹比对**：重读文件内容，变动触发 `reconcile`。
2.  **原子 Compose**：调用 `recomposeProfile`，计算新运行时解析表。
3.  **失败大声**：仅对「新引入或变化」的失活条目报错。旧的 failure 保留警告，不阻断刷新。

> [!TIP]
> 仅 launcher profile 默认开启**配置重载**。headless/sdk 等一次性使用场景通常显式关断。

## 源码入口

| 路径 | 角色 |
|---|---|
| `packages/boot/hmr/src/index.ts` | 插件监视与串行队列管理 |
| `packages/boot/app-boot/src/index.ts` | `recomposeProfile` 逻辑 |
| `apps/cli/tests/profile-hmr.spec.ts` | 热替换行为测试 |
