# SDLC Reference · 精确机制与例外流程

## 什么时候读这里

这里是 SDLC Reference（SDLC 流程的精确参考），面向需要核对精确条件、内部状态或少见流程的读者。各页支持按问题查找，不要求从 `01` 顺序读到 `11`。

本目录直接回答“具体由哪个文件执行”“边界条件是什么”“失败后怎样处理”，不要求先阅读其它卷。需要关系综合时可选读 [DSH 原生开发模型](../native-development-model/00-index.md)。

**本目录记录的是“DSH 眼里的 SDLC”落到条文后的形态。** Tutorial 开篇的三条立场，在这里各有对应的一组机制：

1. **agent 是一等参与者** → 面向 agent 的可发现性与状态机：Agent Note 生命周期（`01`）、意图入口与非 Issue 意图载体（`09`）、git 历史能证明什么（`08`）；
2. **规则是可执行的代码** → 每条规则的可执行实现：trusted policy 与 workflow 拆分（`02`）、gates 与检查路由（`04`）、双语 pairing 与文档门禁（`05`）、加权批准的 policy 实现（`10`）；
3. **每类事实有唯一的 owner** → 事实归属与不越界条件：Note 与 Plan 各自拥有什么（`01`、`03`）、文档 owner（`05`）、评审职责边界（`06`）、发布 lane 归属（`11`）。

本目录只拥有复杂变更的流程机制。DSH 怎样通过仓库结构、Skills、可执行反馈和运行时查询帮助 coding agent 修改自身，由独立的 [Development Harness 专题](../repo-harness/00-index.md) 说明；流程页只在任务需要时链接相应概念，不重复那条叙事。

![条件入口、共享交付核心与远端协作状态](./figures/change-control-map.svg)

## 参考目录

| 页面 | 适用问题 | 新手阶段可以暂时忽略 |
|---|---|---|
| [`01-agent-note-lifecycle.md`](./01-agent-note-lifecycle.md) | proposed、implemented、rejected、archived 的转换、supersession（取代关系）与冻结 triplet | sidecar hash、完整取代条件 |
| [`02-issue-pr-lifecycle.md`](./02-issue-pr-lifecycle.md) | trusted policy（可信策略）、Project lifecycle（项目生命周期）、CI workflow 和 Dependabot | policy 函数条件、runner/job 拆分 |
| [`03-plan-and-sandbox.md`](./03-plan-and-sandbox.md) | `plan/mode` event、pending transition（待提交转换）和审批时序 | session log payload、pre-step 时机 |
| [`04-gates-and-local-checks.md`](./04-gates-and-local-checks.md) | outgoing scope（待推送范围）、focused coverage（聚焦覆盖率）和远端矩阵 | exact base、job topology |
| [`05-prose-doc-standards.md`](./05-prose-doc-standards.md) | 文档 owner、双语 pairing（配对）和 VitePress projection（站点投影） | generator 与 manifest 细节 |
| [`06-review-and-human-role.md`](./06-review-and-human-role.md) | 高风险 semantic review、findings 和 review 状态失效 | 生命周期、安全与真实入口清单 |
| [`07-push-merge-stacked-prs.md`](./07-push-merge-stacked-prs.md) | branch rewrite（分支改写）与 Stacked Pull Requests（依赖式 PR 栈） | GraphQL stack membership、partial landing |
| [`08-example-web-seam.md`](./08-example-web-seam.md) | git 历史能够证明和不能证明哪些流程事实 | 历史 commit 与现行格式差异 |
| [`09-intake-and-work-items.md`](./09-intake-and-work-items.md) | 意图从哪里进来：外部 Discussions 边界、Issue 模板、Project 生命周期、标签分工与非 Issue 意图载体 | policy 函数细节、模板演进史 |
| [`10-approval-gate.md`](./10-approval-gate.md) | merge 的真实门槛：weighted approval 加权批准、`/delegate` 积分转移与 branch rules | blame 分类器、委托的完整状态机 |
| [`11-release.md`](./11-release.md) | merge 之后怎样上线：三条 release 序列、bump 与 tag、rehearsal 与 publish 分离、各发布 lane | registry 三态参数、Desktop/Python 细节 |

按生命周期找页：意图入口读 `09`；决定、计划与实现读 `01`–`05`；评审读 `06`；依赖栈与落地读 `07`；批准门禁读 `10`；发布上线读 `11`；历史证据的边界读 `08`。

## 使用方式

按问题进入一篇对应 reference；页面末尾的“证据入口”链接到 owning source、policy、workflow、skill 或 Agent Note；需要判断固定基线中的仓库事实时，以这些来源为准。
