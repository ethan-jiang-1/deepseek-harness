# 4 · 知识库 / RAG

[← 返回 42 总览](../42-native-reference-architectures.md)

**适用**：文档导入、分块、向量+FTS、引用、删除、快照。

**数据卡**

| 项 | 值 |
|---|---|
| 权威 | KB 目录（文档/块/索引） |
| 作用域 | home / 每 KB |
| 寿命 | 跟 KB；可导出/导入 |
| 读写者 | 用户导入/查询；模型经工具；召回不可信 |
| 介质 | 每 KB SQLite（sqlite-vec+FTS5）+ 原文件 |
| 秘密 | 导入路径白名单；SSRF guard；不放凭据 |

**布局**

```text
$DSH_HOME/<plugin>/<kb-id>/
├── kb.db              # docs/chunks/vectors/FTS/audit/jobs
├── inbox/             # 允许导入的本地路径
├── snapshots/         # 可恢复快照
└── exports/           # kbpack/JSON
```

**生命周期**：异步 job（import/rebuild/compact）；软删可恢复；`confirm_token` 两步删除；compact 物理回收；schema 版本 fail-closed；快照/导出/导入去重。

**失败模式**：job 崩溃、embedding 变更、索引膨胀、删除残留、SSRF、提示注入。

**测试**：导入白名单、SSRF、软删/恢复、compact、job 恢复/取消、快照/导出、召回 untrusted。

**DSH 映射**：无 KB 服务；自造目录；搜索/索引是派生；不要把 KB 当 session log。

## 5. 任务 / 待办 / 目标状态
