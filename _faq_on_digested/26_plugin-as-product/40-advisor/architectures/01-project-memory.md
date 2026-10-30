# 1 · 项目记忆（journal + render）

[← 返回 42 总览](../42-native-reference-architectures.md)

**适用**：项目约定、决策、术语、交接；用户要能读/改/提交。

**数据卡**

| 项 | 值 |
|---|---|
| 权威 | 用户/项目（journal 是机器权威，Markdown 是用户入口） |
| 作用域 | workspace / project root |
| 寿命 | 跟仓库；可提交/复制 |
| 读写者 | 用户可编辑；模型经注入/工具读 |
| 介质 | 追加 journal + 渲染 Markdown + 索引 |
| 秘密 | 不放；敏感内容提示用户不要提交 |

**布局**

```text
<project>/.agents/memory/
├── memory.jsonl          # 权威，追加
├── MEMORY.md             # 渲染，用户可改
├── MEMORY.md.lock        # 跨进程锁
├── MEMORY.md.bak-*       # 写前备份
├── INDEX.md              # 机械索引
├── CONTEXT.md            # 工作态摘要
└── .gitignore            # 忽略 session-logs/等本地件
```

**注**：`.agents/` 是社区约定（E1），核心不规定目录名；可换成 `.your-plugin/`。

**键/规则**：journal 追加顺序；`MEMORY.md` 手改且比 journal 新时收编为一条 record；读以 journal 折叠为准；崩溃只让渲染落后。

**路线**

| 路线 | 做法 | 代价 | 选它当 |
|---|---|---|---|
| A journal+render | 如上 | 要实现锁/备份/折叠 | 用户会手改、要崩溃安全 |
| B 纯 Markdown | 只读写 `MEMORY.md` | 并发/手改冲突；无历史 | 单用户、低写入 |
| C 项目 DB | SQLite/JSON | 用户看不见、不能 diff | 结构化查询为主 |

**失败模式**：锁竞争、外部截断、手改与 journal 冲突、索引丢行、`.gitignore` 误伤。

**测试**：并发写、崩溃后渲染落后、手改收编、外部截断、重命名/移动、`.gitignore` 只忽略自己的目录。

**DSH 映射**：`ctx.fs` 写项目；`present` 不必要；per-workspace 无核心家，项目内文件是首选。

## 2. 个人长期记忆（home ledger / SQLite / 向量）
