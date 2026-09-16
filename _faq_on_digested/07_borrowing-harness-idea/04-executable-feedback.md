# 04 · 可执行反馈（解决「乱发挥」的做错被抓住）

> **状态：跨状态（反馈时点光谱）** —— 六层反馈的轴是「错误在哪里被发现」：编译/load/snapshot 在构建与提交期（静态端），invariant 在活系统中（运行时端）；它不是文档的静态/动态轴。

## 规则只可读，乱发挥就得等 review 才被抓

正确路径只能降低「改错地方」的概率，拦不住「改错了还自认为对」。DSH 的解法是把「可机械判断的规则」接到真实执行路径，让错误在离来源最近的地方出现。这是本 FAQ 里**「不乱发挥」一侧杠杆最高、收益最直接**的一条（在 [`08`](./08-step-by-step-guide.md) 的实施顺序里，它排在「立规矩的 owner」之后：Phase 1「收益最高」，Phase 4「回报第二高」）。

> Every mechanically checkable AGENTS.md promise gets a command that exits non-zero. CI invokes the exhaustive set, while Git hooks reserve their latency budget for cheap local defects.

## 六层反馈各自证明什么

| 反馈层 | 典型机制 | 能证明 | 不能单独证明 |
|---|---|---|---|
| 编译期 | strict TypeScript、closed union | 类型关系、穷举分支成立 | 运行时组合正确 |
| Load / parser | config schema、引用解析、fail loud | 输入在最早可解析点合法 | 行为满足意图 |
| 局部行为 | unit tests、focused coverage | 模块正例、错误、生命周期 | 已发行入口与完整输出 |
| 组装行为 | snapshots、real composition、e2e | 真实入口产生预期外部结果 | 设计选择合理 |
| 运行时关系 | package invariant | 活系统中的 owner relationship 持续成立 | 没有可观察关系的纯函数性质 |
| 语义判断 | code review、用户验收 | 意图、架构、风险是否对齐 | 每个机械细节都已执行 |

关键纪律：**每层只拥有自己能观察的性质，绿色一层不代表其它层也绿。** coverage 为绿不代表产品工作，snapshot 为绿不代表 API 合理，review 也不该手工重复已经由绿色 gate 精确拒绝的格式问题。

## 负例控制：证明检查真的会失败

一个只读的规则写得再漂亮也没用，关键是**它接的检查真的能拦人**。DSH 要求新检查经过 negative control：

> A guard only guards if the regression fails it. … and prove it: introduce the regression, watch red, revert.

同一原则也要求 e2e 「verify the world, not the self-report」——测试重新读文件、跑命令、看持久状态，而不是相信 agent 声称自己完成了任务。这两条几乎零成本、完全可迁移，是「乱发挥」最早被抓住的地方。

## 本地检查与 CI 按成本和范围分工

`dsh-pre-push-checks` 先解析 outgoing scope（待推送范围），再为受影响行为选**最小可信证据**；Git hooks 保留低延迟检查，CI 执行穷举覆盖和平台矩阵。分工的目的不是降低本地标准，而是**让反馈按成本分层：开发循环先拿到相关红灯，远端再验证跨平台和仓库级完整性。**

## invariant 检查「关系」，不检查「存在」

一个有效的 runtime invariant 比较 package 拥有的权威事件流或可变数据关系（例如 `model-visible ⟺ logged`：模型可见内容必须能被 session log 重建）。没有这类关系时 DSH **不发布** `./invariant`，而是在包 README 写明该包特有的省略原因——因为**「这里没有可观察关系」和「漏了检查」是两种不同状态**，前者用「省略 + README 理由」表达而不是留一个空 companion；空 installer 被 `verify-package-invariants` 拒绝；而「为满足形式去断言 service 存在、插件元数据、effect 或固定例子」是 `AGENTS.md` 的成文纪律（`docs/subsystems/invariants.md` 称之为 convention），门禁本身不检查这四类（`packages/AGENTS.md:19`、[`2026-08-28-omit-unneeded-invariant-companions`](../../.agents/notes/implemented/simplification/2026-08-28-omit-unneeded-invariant-companions.md)）。

## 可迁移要点

1. **每一条可机械判断的规则，配一个 `exit non-zero` 的命令。** 这是「不乱发挥」的最高杠杆。
2. 反馈分层写清楚：每层证明什么、不证明什么——避免「一个绿灯就放行」。
3. 新检查必须做负例控制（引入回归 → 看红 → 还原），否则可能是永远为绿的摆设。
4. 本地跑相关检查、CI 跑穷举——先拿相关红灯，别一上来跑全套。
5. invariant 是锦上添花，不是普通项目的第一步；没有可观察关系就诚实写空，不造假断言。

## 证据入口

- [`../../_agent_ready_development/development-harness/05-executable-feedback.md`](../../_agent_ready_development/development-harness/05-executable-feedback.md)：六层反馈、invariant、负例控制、本地 vs CI。
- [`../../_digested/harness-idea/03-paved-road.md`](../../_digested/harness-idea/03-paved-road.md)：门禁自身被测试的元验证。
- [`../../docs/testing.md`](../../docs/testing.md)：test tiers、真实入口、negative control、snapshot 义务。
- [`../../.agents/skills/dsh-pre-push-checks/SKILL.md`](../../.agents/skills/dsh-pre-push-checks/SKILL.md)：按 outgoing scope 选证据，而不是固定跑全套。
- [`../../scripts/run-gates.ts`](../../scripts/run-gates.ts)：仓库检查逻辑的聚合入口。
