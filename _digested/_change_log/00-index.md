# Change Log · 上游同步记录

这个目录记录每次从 `upstream`（`deepseek-ai/deepseek-harness`）同步到本地 `ethan` 的变更摘要。每条记录包含：

- 版本跨度（from → to）
- commit hash 范围
- 提交数量（能数清时）
- 核心变更分类
- 对 `_digested/` / `_faq_on_digested/` 的影响

`_change_log/` 下的记录，按编号递增：

- [`0000-baseline.md`](./0000-baseline.md)——研究起点，不是一次同步
- [`0001-0.1.0-rc.5-to-0.1.0-rc.7.md`](./0001-0.1.0-rc.5-to-0.1.0-rc.7.md)——第一次合入
- [`0002-0.1.0-rc.7-to-0.1.1-rc.1.md`](./0002-0.1.0-rc.7-to-0.1.1-rc.1.md)——第二次合入
- [`0003-0.1.1-rc.1-to-0.1.1-rc.2.md`](./0003-0.1.1-rc.1-to-0.1.1-rc.2.md)——第三次合入
- [`0004-0.1.1-rc.2-to-0.1.2-alpha.3.md`](./0004-0.1.1-rc.2-to-0.1.2-alpha.3.md)——第四次合入（最大，1155 commits）
- [`0004-plan-digest-revision.md`](./0004-plan-digest-revision.md)——第四次同步的消化材料修订计划
- [`0005-0.1.2-alpha.3-to-0.1.2-rc.1.md`](./0005-0.1.2-alpha.3-to-0.1.2-rc.1.md)——第五次合入（305 commits）
- [`0006-0.1.2-rc.1-to-0.1.5-rc.1.md`](./0006-0.1.2-rc.1-to-0.1.5-rc.1.md)——第六次合入（1512 commits；session 格式升到 v3、客户端资源面、subprocess containment、约 700 篇 Note 归档）
- [`0006-plan-digest-revision.md`](./0006-plan-digest-revision.md)——第六次同步的消化材料修订计划
- [`0007-0.1.5-rc.1-to-0.1.5-rc.2.md`](./0007-0.1.5-rc.1-to-0.1.5-rc.2.md)——第七次合入（4 commits；最后一个 RC，feedback 提交对称化）
- [`0008-plan-digest-revision.md`](./0008-plan-digest-revision.md)——第八次同步的消化计划（五阶段）
- [`0008-0.1.5-rc.2-to-0.1.7-rc.1.md`](./0008-0.1.5-rc.2-to-0.1.7-rc.1.md)——第八次合入（3304 commits，历次最大；session 格式升 v4、sandbox 组转正、整树照搬口径自本卷生效；页尾附 0008 独立复核勘误节）
- [`0008-independent-recheck.md`](./0008-independent-recheck.md)——0008 轮语料维护的独立反查（五路并行审计 + 修复执行记录；约 60 处过期断言、20 处缺落点、3 孤儿页、4 处口径矛盾）
- [`0009-0.1.7-rc.1-to-0.2.0-rc.2.md`](./0009-0.1.7-rc.1-to-0.2.0-rc.2.md)——第九次合入（794 commits；session 格式保持 v4、Schedule 转正为 bundle、账号/模型面大改、user-questions timed waits、llm 动态工具更新；语料反查随同步执行，另完成独立反查，见 [`0009-independent-recheck.md`](./0009-independent-recheck.md)）
- [`0010-ledger-and-pin-recheck.md`](./0010-ledger-and-pin-recheck.md)——0010 轮**同基线换角反查**（变更三账本＋merge 主题正查＋无引文行号钉专项；约 60 处漂移重锚、图鉴补 acp/sdk 两节、subprocess 计数与 release 间隔口径回归）

编号递增。`0000` 只记录开始消化时的 checkout；同步记录从 `0001` 起。

**选基线的口径**：只同步 **RC 或 final release**，目标是当前的**最后一个 RC**（若该版本线已出 final release，则同步到 final release）。alpha、beta 一律**不同步**——除非明确指定，否则即使 upstream 长期停在 alpha 阶段也不追，避免同步负担失控。0006 曾按 npm `latest` 选到 `0.1.5-rc.1`；0007 改成「最后一个 RC」并推进到 `0.1.5-rc.2`。0008 起执行方式简化为**整树照搬**：产品源码完全等于 upstream tag（不做内容合并、不留本地源码补丁），本地只维护 `_digested/`、`_faq_on_digested/`、`_agent_ready_development/`、`_misc/` 四个目录；唯一保留的本地口径行是 pairing manifest 对 `_agent_ready_development/` 的排除。

每次 sync 同时执行以下维护动作：

1. 在本目录新增一条记录，写清产品源码 commit 范围和触及的专题。
2. 更新 [`../00-index.md`](../00-index.md) 的产品源码审计基线。
3. 在 [`../_coverage/00-index.md`](../_coverage/00-index.md) 将受影响专题标为“需复核”；完成源码、图和链接审计后再更新其最近核验 commit。
4. 运行 `node _digested/verify.mjs`。
