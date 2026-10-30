# 8 · 每项目运行时

[← 返回 92 总览](../92-native-reference-architectures.md)

**适用**：每 workspace 一套 Cordis 配置/preset/MCP。

**数据卡**

| 项 | 值 |
|---|---|
| 权威 | 项目配置（输入） |
| 作用域 | workspace |
| 寿命 | 跟目录；运行时 scope 随租约 |
| 读写者 | 用户编辑；插件读；模型经工具 |
| 介质 | `<workspace>/.dsh/cordis.yml`；内存 lease |
| 秘密 | 配置里不放值；env 要 scrub |

**路线**

| 路线 | 做法 | 代价 | 选它当 |
|---|---|---|---|
| A read-only 配置 + lease | `write()` no-op；canonical path；最后租约 dispose | 需要 trust 模型；无核心 API | 每项目 MCP/preset |
| B 项目内脚本 | 插件自己解析 | 重复造 Loader | 简单场景 |
| C 等待核心 scope | 不实现 | 受限 | 核心提供后 |

**注**：`<workspace>/.dsh/cordis.yml` 是社区约定（E1），核心不规定每项目配置目录。

**硬规则**：配置是输入不是输出；默认不要 trust 仓库配置；热重载要 drain/rollback；日志不含 config/env。

**测试**：lease 生命周期、热重载失败回滚、trust=false、MCP 进程清理、路径移动。

**DSH 映射**：扩展插件（E1）的 `ctx.workspaceCordis`；核心没有 per-workspace 实例。

## 9. 客户端 UI 状态
