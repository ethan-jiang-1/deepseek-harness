# 07 · 边界、成本与可迁移原则

## Development Harness 没有消除复杂度

DSH 展示的是怎样组织复杂参与知识，而不是怎样让复杂系统变简单。一个 fresh agent 仍需要读 TypeScript、理解需求、选择修改半径并判断证据是否充分；Development Harness 把这些判断分解、提供 owner 和反馈，但不替代它们。

可以把参与成本分成三类：

| 成本 | 含义 | DSH 的处理 |
|---|---|---|
| knowledge barrier（知识门槛） | 不知道规则、位置和历史决定 | AGENTS、architecture、catalogs、Agent Notes 与 Skills 外置知识 |
| literacy barrier（识读门槛） | 不会 TypeScript、GitHub、Cordis 或配置语法 | tutorial、cookbook、范本和 L0 配置入口降低部分成本 |
| judgment barrier（判断门槛） | 不知道哪种设计、证据或风险判断正确 | Skills 缩小问题，tests/gates 提供反馈，review 最终复核 |

第一类可以大幅减少，后两类只能被支持，不能宣称消失。

## 四个不能混淆的边界

1. **可读不等于简单。** Catalog、统一术语和 owner 让复杂系统可查询，但包、事件和生命周期仍然复杂。
2. **Skill 不等于 enforcement（强制执行）。** Skill 是 guidance；可机械规则仍需类型、脚本或 invariant，语义仍需 review。
3. **Plugin disposal 不等于 transaction rollback（事务回滚）。** disposer 撤销拥有的注册与资源，不会自动补偿已经发生的外部写入。
4. **Runtime inspection 不等于 security sandbox（安全沙箱）。** `tool-cordis` 能查询和试验活运行时，但 DSH 明确把它视为 bash-equivalent trust。

> This is an opt-in development tool with bash-equivalent trust, not a security boundary or product default.
>
> — DSH [`self-referential Cordis toolset` Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/a66e4702047846cdaa10c66c9d3df3951f5ea70d/.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md)。这段原文限定了动态自省与修改能力的安全含义。

## 知识外置本身有维护成本

类型、文档、Agent Notes、Skills、生成目录、tests、invariants 和 CI 都需要维护。重复记录会漂移，过长的 standing instructions 会耗尽上下文，无意义的 gate 会制造假安全感，过细的 Skill 会把普通判断固化成仪式。

DSH 用一个事实一个 owner、生成 freshness、文档预算、Agent Note lifecycle 和 negative-control testing 控制这些成本。它们降低维护风险，但不能让外置知识免费。

## 为什么 DSH 的完整结构不适合照搬到所有项目

DSH 同时面对多 profile、多 provider、per-session scope、动态插件生命周期、持久事件投影和多个产品入口。这类 composition pressure（组合压力）使 Plugin、Fiber、Effect、seam 和大量机器检查值得投入。

较小项目若只有一个 loop、少量固定 adapter 和单一入口，可能只需要清晰 architecture map、少数 standing rules、任务 Skills 和针对性 tests。学习 DSH 的第一步应是知识归属与反馈纪律，而不是复制全部包结构。

## 用三个问题检验一个 Development Harness

下面三问是本文从 DSH 归纳出的评估框架，不是 DSH 官方术语：

1. **规则住在哪里？** 只在人脑，还是进入可搜索文档、类型、生成索引和可执行检查？
2. **正确入口是否明确？** 新参与者能否从目标找到 owner、范本和升级条件，还是每次都要猜代码位置？
3. **错误何时被发现？** 编译、load、局部测试、运行时、push 前、CI、review，还是生产之后？

这三问分别测量 knowledge externalization（知识外置）、paved road（正确路径）和 feedback latency（反馈延迟）。它们可以用于其它仓库，而不要求其它仓库采用 Cordis 或“一切皆插件”。

## 值得优先迁移的原则

| 优先级 | 可迁移做法 | 原因 |
|---|---|---|
| 1 | 一个事实一个 owner，根指令只放 standing orders | 先减少冲突和上下文浪费 |
| 2 | 为常见任务提供短入口、范本和明确升级条件 | 先降低“改哪里”的判断成本 |
| 3 | 把可机械规则接入真实接受路径，并证明负例会失败 | 先让反馈可信 |
| 4 | 用 Skills 保存需要上下文判断的工作流程 | 让复杂任务不依赖个人记忆 |
| 5 | 在确有动态组合压力时引入可查询 plugin graph 和完整 seams | 让架构成本与真实需求匹配 |

## 最终判断

DSH 作为 Development Harness 的突出之处，不是拥有最多规则，而是把不同知识放在不同 owner，并把可机械部分连接到实际执行。Coding agent 因而可以从有限入口逐步获取上下文，在明确扩展点上修改系统，通过多层反馈修正错误，再把决定和证据留给后续参与者。

## 证据入口

- DSH [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/a66e4702047846cdaa10c66c9d3df3951f5ea70d/docs/architecture.md)：插件组合、事件日志、seam 和行为归属所面对的组合复杂度。
- DSH [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/a66e4702047846cdaa10c66c9d3df3951f5ea70d/docs/AGENTS.md)：一个事实一个 owner、上下文预算和文档维护纪律。
- DSH [`dsh-code-review`](https://github.com/deepseek-ai/deepseek-harness/blob/a66e4702047846cdaa10c66c9d3df3951f5ea70d/.agents/skills/dsh-code-review/SKILL.md)：Skill 的 guidance 边界和 semantic review 责任。
- DSH [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/a66e4702047846cdaa10c66c9d3df3951f5ea70d/docs/testing.md)：真实入口、negative control 和不同证据层的限制。
- DSH [`@deepseek-ai/dsh-tool-cordis` README](https://github.com/deepseek-ai/deepseek-harness/blob/a66e4702047846cdaa10c66c9d3df3951f5ea70d/packages/extensions/tool-cordis/README.md#trust-stance)：动态自省工具的权限和非安全边界。
