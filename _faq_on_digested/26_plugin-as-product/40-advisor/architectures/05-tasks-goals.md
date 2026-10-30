# 5 · 任务 / 待办 / 目标状态

[← 返回 42 总览](../42-native-reference-architectures.md)

**适用**：跨会话任务、项目待办、目标轮次、定时提醒。

**数据卡**

| 项 | 值 |
|---|---|
| 权威 | 会话日志（session 级）或 home 域（跨会话） |
| 作用域 | session / workspace / home |
| 寿命 | 跟会话 / 跨会话 |
| 读写者 | 模型/用户；客户端展示 |
| 介质 | session events + projection；或 domain table |
| 秘密 | 一般无 |

**路线**

| 路线 | 做法 | 代价 | 选它当 |
|---|---|---|---|
| A session 事件 + projection | 现有 todo/goal/plan | 只限会话；不能跨会话查询 | 会话内任务 |
| B home 域 + 项目键 | `tasks` table；`w_<hash>`；状态机 | 要清理/迁移；客户端要 UI | 跨会话项目任务 |
| C 项目内文件 | Markdown/JSON | 用户可改；并发冲突 | 用户可见任务板 |

**失败模式**：状态机非法迁移、重复任务、跨会话 ID、时区/重复规则、删除残留。

**测试**：状态迁移、并发更新、跨会话、重复/取消、时区、归档。

**DSH 映射**：session 级用事件/投影；跨会话用 `ctx.storageDomain`；schedule 是独立域。

## 6. 交付物 / 文档
