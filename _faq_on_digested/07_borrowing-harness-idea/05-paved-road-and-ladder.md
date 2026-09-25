# 正确路径与参与阶梯：改哪里

> **道 · 正确路径。** 本页拥有「改哪里」的归属判断：归属表（代码面的静态地图）、L0–L3 参与阶梯（新行为该接哪层）与五问（面对新行为依次问）。

## 读懂了还不够，还得知道从哪里改

「不糊涂」解决的是「看懂系统」；「不乱发挥」的第一半是「知道改哪里」。文档能让 agent 理解系统，却不会自动阻止它**在错误的地方插代码、或发明一套新接入方式**。DSH 的对策是 paved road（正确路径）：为常见变化提供首选扩展点、生产范本、生命周期规则和对应证据，让「做对」成为阻力最小路径。

## 先问归属，再谈实现

DSH 把「改哪里」从一个仓库经验问题变成一个可核对的设计判断。它的 architecture 里有一张「Where new behavior goes」归属表，把常见目标映射到机制：

> New behavior attaches to a documented extension point. Changing the loop itself updates this map.

对一个 fresh agent，第一个设计判断不是「在哪个 loop 函数里插代码」，而是「这个功能属于哪一类」——工具注册？可替换能力？还是真的要动核心循环？**归属问题先于实现问题，这是「不乱发挥」的第一道闸。**

### 落地实物：这张表真的存在，而且每行都能打开

归属表不是抽象建议，它在 [docs/architecture.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/architecture.md) 里就是一张两列的 Markdown 表，摘三行原样：

| Goal | Mechanism |
|---|---|
| Add a model provider | register its adapter on `ctx.llm` |
| Add a model-facing capability | register on `ctx.tools`; its schema joins prompt assembly |
| Give one session a different capability set | compose an agent preset; a service row there needs an `isolate` realm |

每行右边都是**具体的注册 API**，不是「找相关模块」这类需要再解释的指引。配套的 [extension cookbook](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/cookbook/extension-cookbook.md) 给每个扩展点一份「怎么做」的操作页。

普通项目的归属表照这个标准写：**「目标 → 机制」两列，右边必须是新参与者能直接执行的动作**（改哪个文件、调哪个注册函数、配哪段配置），不能是「参考架构文档」这类二级指引。写完自测：拿一个真实需求问自己（或问 agent），只看这张表能不能答出改哪里。

**学走形的检查**：两种典型走形——归属表变成审批流程（「申请→批准→实施」），偏离了它「降低判断成本」的本意；或阶梯变成等级制（L3 比 L0「高级」），忘了它只按影响半径分层，不按价值排序。

## 四级参与阶梯（一个可迁移的学习模型）

不同改动半径有不同首选入口。下面的 participation ladder 是 repo-harness 语料从 DSH 归纳出的学习模型，不是 DSH 的官方分级名称，但分级逻辑可以原样搬到任何项目：

| 层级 | 首选入口 | 典型变化 | 升级条件 |
|---|---|---|---|
| L0 组合 | 配置 / profile / patch | 换 provider、改参数 | 配置表达不了新行为 |
| L1 扩展点 | tool / command / listener | 新增工具、命令、拦截 | 需要一项可替换的完整能力 |
| L2 capability seam | Service Definition + Provider + Consumer | 新 filesystem / LLM / sandbox 后端 | 现有扩展点和 seam 都表达不了 loop 驱动 |
| L3 core loop | 修改 `agent-loop` | 改变默认循环驱动 | 现有扩展点和 seam 都表达不了所需行为 |

关键纪律：**阶梯不是价值排序。** L0 的部署替换是完整能力，L3 也不是「更先进」，只是影响半径最大、同步义务最多。乱发挥的典型形态，就是「本可用 L0/L1 表达，却一路爬到 L3 改核心」。

## 用五个归属问题缩小选择

面对新行为，依次问（这五问可以照搬，只是把「扩展点/seam/loop」换成你项目的对应物）：

1. 它只是替换配置或组合吗？是 → 留在 L0。
2. 它能由现有扩展点表达吗？是 → 留在 L1。
3. 它是一项需要可替换实现、由稳定接口消费的完整能力吗？是 → 设计完整 seam，进 L2。
4. （横切义务，**无论选哪一层都要检查**，不是升级判据）它是否新增「**模型可见**」的事实？是 → 必须同步扩展 `SessionEventMap` 并从 log 投影出来（模型可见 ⟺ 落日志，`docs/architecture.md:125`）；只影响 UI 或进程内状态的输入不需要新事件，用各自的 snapshot/frame 表达。
5. 现有扩展点和 seam 都表达不了所需驱动吗？此时才论证 L3。

## 生命周期只有一套所有权

乱发挥的另一个来源是「临时注册」和「正式注册」两套清理协议。DSH 规定：注册 tool、service、listener 或其它贡献时，`ctx.effect()` / `ctx.on()` 把贡献归属于当前 Fiber；插件卸载、HMR 或显式 dispose 走同一条清理路径。

> There is no privileged core to patch: you extend dsh by mounting a plugin beside the others, and registrations are effects that unwind when their plugin unloads.

这句的可迁移含义是：**贡献要有一套统一的所有权与清理机制**，agent 不用在「临时」和「正式」之间二选一。普通项目未必需要插件/Fiber，但「谁注册、谁负责撤销」这条纪律几乎总是适用。

## Seam 是完整能力，不是一个接口文件

DSH 把 capability seam 定义为三角色——Service Definition、一个或多个 Provider、一个或多个 Consumer；Definition 服务全部当前 Consumer，Consumer 依赖 Definition 而非具体 Provider。这个分工让「换 provider」成为部署选择。**但要警惕过度迁移**：只有当变化确实需要替换能力时才进 L2；为局部工具制造多包结构，是普通项目照搬 DSH 时最常见的浪费（详见 [`08-transfer-playbook.md`](./08-transfer-playbook.md)）。

## 可迁移要点

1. 写一张「目标 → 机制」归属表：先路由，再实现。
2. 把改动按半径分层，明确每层的升级条件——阻止「本可配置表达、却改到核心」。
3. 贡献要有统一的所有权与清理机制（谁注册谁撤销）。
4. seam/插件是「组合压力」的产物，不是所有项目都该造；先问「我真的要可替换吗」。

## 证据入口

- [`_agent_ready_development/repo-harness/04-paved-road-and-participation.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/repo-harness/04-paved-road-and-participation.md)：参与阶梯、五个归属问题、生命周期单一所有权。
- [`_digested/harness-idea/03-paved-road.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_digested/harness-idea/03-paved-road.md)：正确路径为什么是阻力最小路径、路径自身被测试。
- [`_digested/harness-idea/04-participation-paths.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_digested/harness-idea/04-participation-paths.md)：不同参与半径的门、合同与检查半径。
- [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/architecture.md)：Where new behavior goes 归属表与扩展点。
- [`docs/glossary.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/glossary.md)：capability seam 三角色的规范定义。
- [`docs/cookbook/extension-cookbook.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/cookbook/extension-cookbook.md)：feature 到机制与操作指南的细化入口。
