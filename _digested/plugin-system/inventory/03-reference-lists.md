# 五张横切清单

> [!IMPORTANT]
> 本专题作为「反查索引」，将分散在各包的 `ctx` 服务、模型工具与命令收拢至此，避免重复造轮子。

## 清单索引

| 需求侧面 | 索引表 |
|---|---|
| 核心 `ctx` 服务 | 3.1节 (99条全集) |
| 模型工具暴露面 | 3.2节 (按 profile) |
| Bundle 清单 | 3.3节 (组装定义) |
| Preset 模式 | 3.4节 (四种模式) |
| 技能组件 | 3.5节 (开发工具) |

## 3.1 ctx 服务清单 (Watchpoints)

*   **[Watchpoint]**：若 P:C 比率异常或 P=0，检查是否缺少 Provider 注册或该服务仅用于占位。

## 3.2 模型工具可见性

不同 `profile` 暴露的工具集差异：
*   **base**：默认全集。
*   **web**：Host 端移除工具，按 Preset 重新编排。
*   **minimal**：仅挂载最精简工具集。

## 3.3 交付单元 (Bundle)

*   `dsh-base`：核心 patch 层。
*   `dsh-web-app`：Web 交互层。
*   `dsh-headless`：一次性任务。

> [!NOTE]
> 查看 `catalog.json` 获取最新的包数与覆盖状态。
