# 07 · 可迁移优先级、三问框架与边界成本

## 先排序：什么值得先搬

前面的机制不是同等重要、也不是同等便宜。repo-harness 语料已经给出一张按优先级排序的可迁移清单，这是本 FAQ 最该直接照用的结论：

| 优先级 | 可迁移做法 | 原因 |
|---|---|---|
| 1 | 一个事实一个 owner，根指令只放 standing orders | 先减少冲突和上下文浪费 |
| 2 | 为常见任务提供短入口、范本和明确升级条件 | 先降低「改哪里」的判断成本 |
| 3 | 把可机械规则接入真实接受路径，并证明负例会失败 | 先让反馈可信 |
| 4 | 用 Skills 保存需要上下文判断的工作流程 | 让复杂任务不依赖个人记忆 |
| 5 | 在确有动态组合压力时引入可查询 plugin graph 和完整 seams | 让架构成本与真实需求匹配 |

注意第 5 项被刻意排在最后：**插件图、seam 三角色、完整运行时 inspect 是「组合压力」的产物，不是普通项目的默认项。** 前三项几乎零架构依赖，是大多数项目真正的第一桶金。

## 三个问题检验任何一个 Development Harness

这是从 DSH 归纳出的评估框架（不是 DSH 官方术语），可以拿来测你自己的项目，也可以用来判断「我现在卡在哪一步」：

1. **规则住在哪里？** 只在人脑，还是进入了可搜索文档、类型、生成索引和可执行检查？
2. **正确入口是否明确？** 新参与者能否从目标找到 owner、范本和升级条件，还是每次都要猜代码位置？
3. **错误何时被发现？** 编译、load、局部测试、运行时、push 前、CI、review，还是生产之后？

三问分别测量 **knowledge externalization（知识外置）**、**paved road（正确路径）**、**feedback latency（反馈延迟）**。三问都不需要 Cordis 或「一切皆插件」，可以原样用于任何仓库。

## 四个不能混淆的边界

照搬时最容易翻车的是把「相似」当「等同」：

1. **可读 ≠ 简单。** owner、catalog、统一术语让复杂系统**可查询**，但包、事件和生命周期仍然复杂。
2. **Skill ≠ enforcement。** Skill 是 guidance；可机械规则仍需类型/脚本/invariant，语义仍需 review。
3. **清理 ≠ 事务回滚。** disposer 撤销它拥有的注册与资源，不会自动补偿已经发生的外部写入。
4. **运行时查询 ≠ 安全沙箱。** `tool-cordis` 的 vm 只防意外全局污染，注入服务仍有真实权限，不是安全边界。

## 知识外置本身有维护成本

类型、文档、决策记录、Skills、生成目录、测试、invariant、CI 都要维护。**外置不是免费的**，DSH 用几样纪律控制成本：一个事实一个 owner（防漂移）、生成 freshness（防索引过期）、文档预算（防常驻层膨胀）、决策记录 lifecycle（防「过时理由仍被当权威」）、negative-control testing（防假门禁）。

普通项目最容易犯的错，是**在还不存在组合压力时，提前造一整套插件/生成目录/invariant 架构**——结果维护成本吃掉了可读性收益。`07-boundaries-and-costs` 语料说得直接：

> 较小项目若只有一个 loop、少量固定 adapter 和单一入口，可能只需要清晰 architecture map、少数 standing rules、任务 Skills 和针对性 tests。学习 DSH 的第一步应是知识归属与反馈纪律，而不是复制全部包结构。

## 可迁移要点

1. 按上表优先级 1→4 推进，第 5 项「确有压力才做」。
2. 用三问框架给自己的项目打分，找出「卡在知识外置 / 正确路径 / 反馈延迟」哪一档。
3. 每引入一样外置知识，就问一句「谁维护它、漂移了谁发现」。
4. 守住四个边界：可读≠简单、Skill≠enforcement、清理≠回滚、查询≠沙箱。
5. 防漂移是持续动作，不是一次性装修：verify 脚本 + 基线钉 + 改事实只改 home（落地清单见 [`08`](./08-step-by-step-guide.md) Phase 7）。

## 证据入口

- [`../../_agent_ready_development/repo-harness/07-boundaries-and-costs.md`](../../_agent_ready_development/repo-harness/07-boundaries-and-costs.md)：优先级清单、三问框架、四个边界、成本。
- [`../../_digested/harness-idea/07-boundaries-costs-fit.md`](../../_digested/harness-idea/07-boundaries-costs-fit.md)：哪些原则与智能无关、这个形状何时划算、代价是什么。
- [`../../_digested/harness-idea/08-judgement-discipline.md`](../../_digested/harness-idea/08-judgement-discipline.md)：本 FAQ 判断的出处纪律（分布内通式 vs 分布外事实）。
