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
├── 0000-baseline.md                    # 研究起点，不是一次同步
├── 0001-0.1.0-rc.5-to-0.1.0-rc.7.md    # 第一次合入
├── 0002-0.1.0-rc.7-to-0.1.1-rc.1.md    # 第二次合入
├── 0003-0.1.1-rc.1-to-0.1.1-rc.2.md    # 第三次合入
├── 0004-0.1.1-rc.2-to-0.1.2-alpha.3.md   # 第四次合入（最大，1155 commits）
├── 0004-plan-digest-revision.md          # 本次同步的消化材料修订计划
```

编号递增。`0000` 只记录开始消化时的 checkout；同步记录从 `0001` 起。

每次 sync 同时执行以下维护动作：

1. 在本目录新增一条记录，写清产品源码 commit 范围和触及的专题。
2. 更新 [`../00-index.md`](../00-index.md) 的产品源码审计基线。
3. 在 [`../_coverage/00-index.md`](../_coverage/00-index.md) 将受影响专题标为“需复核”；完成源码、图和链接审计后再更新其最近核验 commit。
4. 运行 `node _digested/verify.mjs`。
