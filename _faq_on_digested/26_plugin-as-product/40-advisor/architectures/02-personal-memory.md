# 2 · 个人长期记忆（home ledger / SQLite / 向量）

[← 返回 42 总览](../42-native-reference-architectures.md)

**适用**：跨项目偏好、用户画像、学到的 facts、可检索知识。

**数据卡**

| 项 | 值 |
|---|---|
| 权威 | 插件/用户（看是否可编辑） |
| 作用域 | home / 可选 per-project track |
| 寿命 | 跟 home；换机器不带走（除非同步） |
| 读写者 | 插件写；用户可读/确认；模型经召回 |
| 介质 | Markdown/JSONL/SQLite/向量 |
| 秘密 | 不放；凭据走 credentials |

**路线**

| 路线 | 做法 | 代价 | 选它当 |
|---|---|---|---|
| A 文件树 + 条目 id | `$DSH_HOME/<plugin>/memory/`；`§` 条目 + `[id:]`；锁+tmp/rename | 要自己写合并/锁/清理 | 用户可读、跨设备 git 同步 |
| B SQLite + 迁移表 | 单 DB；`_migrations`；FTS/向量 | 不可读、备份/迁移成本 | 查询/召回为主 |
| C 外部服务（E2，仅参考） | MCP/HTTP/DB | 运维/隐私/网络 | 仅当原生 GAP 且多机/团队/大库 |

**键**：条目 id 稳定；项目轨用 `w_<sha256(realpath)>`；不要用 `workspaceId`。

**生命周期**：写前备份；锁；软删/compact；导出/导入；版本迁移；卸载清理声明。

**失败模式**：孤儿、双写、冲突、embedding 模型变更、向量索引重建成本、秘密泄漏。

**测试**：并发、崩溃、迁移、删除/compact、跨设备合并、召回不可信标记。

**DSH 映射**：home 域或自造 `$DSH_HOME/<plugin>/`；`resolveDshHome()`；不要硬编码。

## 3. 会话归档 / 删除 / 保留
