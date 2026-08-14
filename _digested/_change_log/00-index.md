# Change Log · 上游同步记录

这个目录记录每次从 `upstream`（`deepseek-ai/deepseek-harness`）同步到本地 `ethan` 的变更摘要。每条记录包含：

- 版本跨度（from → to）
- commit hash 范围
- 提交数量（能数清时）
- 核心变更分类
- 对 `_digested/` / `_faq_on_digested/` 的影响

```text
_change_log/
├── 00-index.md
├── 0000-baseline.md          # 研究起点，不是一次同步
└── 0001-<from>-to-<to>.md    # 之后每次合入写一条
```

编号递增。`0000` 只钉住开始消化时的 checkout；真正的 sync 从 `0001` 起。
