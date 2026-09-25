# 正确路径与参与阶梯：改哪里

> **道 · 正确路径。** 本页拥有「改哪里」的完整逻辑：为什么需要正确路径、DSH 怎么应对、怎么落地、怎么迁。归属表（代码面的静态地图）、L0–L3 参与阶梯与五问是三个核心工具。

## 为什么要有这道

agent「读懂了系统」和「改对了地方」是两件事。知识外置解决前者，但拦不住后者——看几个真实的失败形态：

- **在错误的位置插代码。** 明明有现成的扩展点，agent 偏往核心函数里硬塞——不是它存心搞破坏，是它没有「这类改动应该落在哪一层」的判断依据，只能按表面相似性选位置。
- **发明一套新接入方式。** 仓库明明有注册机制，agent 自己造一个 if-else 旁路——绕过了所有约束、生命周期和检查，还自我感觉良好。
- **能用配置解决的，动核心。** 影响半径从一行配置放大到全局行为，检查、回滚、评审的成本全部翻倍。

根子上的原因：**「改哪里」在多数项目里是一个经验问题**——靠老员工的直觉、靠踩过的坑。agent 没有这些积累，每次都是第一次。经验问题不能靠「更聪明的模型」解决，只能变成**可核对的设计判断**：让「这个改动属于哪一类、首选落在哪一层」有表可查、有顺序可问。这就是正确路径这道。

## DSH 怎么应对

DSH 的对策是 paved road（正确路径）：为常见变化提供首选扩展点、生产范本、生命周期规则和对应证据，让「做对」成为阻力最小的路径。核心原则一句话：

> New behavior attaches to a documented extension point. Changing the loop itself updates this map.

（来源：[docs/architecture.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/architecture.md) 的 Where new behavior goes 一节）

加上两个配套设计：**参与阶梯**（改动按影响半径分层，每层有首选入口和升级条件——阻止「本可配置表达、却改到核心」）和**单一所有权**（注册即效果，谁注册谁清理，没有「临时/正式」两套协议）。

## DSH 怎么落地

**归属表是一张真实存在的表**，在 [docs/architecture.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/architecture.md) 里就是两列 Markdown，摘三行原样：

| Goal | Mechanism |
|---|---|
| Add a model provider | register its adapter on `ctx.llm` |
| Add a model-facing capability | register on `ctx.tools`; its schema joins prompt assembly |
| Give one session a different capability set | compose an agent preset; a service row there needs an `isolate` realm |

每行右边都是**具体的注册 API**，不是「找相关模块」这类需要再解释的指引。配套的 [extension cookbook](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/cookbook/extension-cookbook.md) 给每个扩展点一份「怎么做」的操作页。

**没有特权核心可 patch**——扩展就是挂一个插件，注册即归属当前生命周期：

> There is no privileged core to patch: you extend dsh by mounting a plugin beside the others, and registrations are effects that unwind when their plugin unloads.

**四级参与阶梯**（repo-harness 语料从 DSH 归纳的学习模型，非官方分级名称，分级逻辑可原样搬到任何项目）：

| 层级 | 首选入口 | 典型变化 | 升级条件 |
|---|---|---|---|
| L0 组合 | 配置 / profile / patch | 换 provider、改参数 | 配置表达不了新行为 |
| L1 扩展点 | tool / command / listener | 新增工具、命令、拦截 | 需要一项可替换的完整能力 |
| L2 capability seam | Service Definition + Provider + Consumer | 新 filesystem / LLM / sandbox 后端 | 现有扩展点和 seam 都表达不了 loop 驱动 |
| L3 core loop | 修改 `agent-loop` | 改变默认循环驱动 | 现有扩展点和 seam 都表达不了所需行为 |

关键纪律：**阶梯不是价值排序。** L0 的部署替换是完整能力，L3 也不「更先进」，只是影响半径最大、同步义务最多。乱发挥的典型形态，就是「本可用 L0/L1 表达，却一路爬到 L3 改核心」。

**面对新行为依次问五问**（可照搬，把「扩展点/seam/loop」换成你项目的对应物）：它只是替换配置吗？能由现有扩展点表达吗？是需要可替换实现的完整能力吗？是否新增「模型可见」事实（是 → 必须同步扩展事件并落日志）？现有扩展点和 seam 都表达不了吗——此时才论证改核心。

## 怎么迁移到你的项目

普通项目的归属表照 DSH 的标准写：**「目标 → 机制」两列，右边必须是新参与者能直接执行的动作**（改哪个文件、调哪个注册函数、配哪段配置），不能是「参考架构文档」这类二级指引。写完自测：拿一个真实需求问自己（或问 agent），只看这张表能不能答出改哪里。再配 2–3 个最常见任务的 cookbook（短入口 + 范本 + 升级条件）。

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

## 与其它各篇的关系

- **五问的完整版**（含「模型可见 ⟺ 落日志」的横切义务）：问 4 是横切检查不是升级判据——新增模型可见事实就必须同步扩展事件并从日志可回放，无论改动落在哪一层；细则见 [`静与动`](./04-static-vs-dynamic.md)。
- **生命周期单一所有权**：注册 tool、service、listener 走 `ctx.effect()` / `ctx.on()`，插件卸载走同一条清理路径——「谁注册、谁负责撤销」这条纪律几乎总是适用，不需要插件架构也成立。
- **capability seam 是完整能力不是一个接口文件**（三角色：Definition + Provider + Consumer）：只有确实需要替换能力时才进 L2；为局部工具制造多包结构是照搬 DSH 最常见的浪费，见 [`迁移清单`](./08-transfer-playbook.md)。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「05 · 正确路径」一节）——按需核对，不读不影响理解。
