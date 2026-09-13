# 参与阶梯（participation ladder）：从改配置到改 loop

## 问题

「读懂」和「做对」默认了一个读者模型：写 TypeScript 插件的 fresh agent。真实参与 dsh 的人不止这一类：有人只想换掉某个 provider，有人只想给模型加个工具，有人要设计一条全新能力，有人要改 loop 合同。不同参与半径的门、合同、检查半径与爆炸半径都不同。

dsh 把这些路径做成**参与阶梯（participation ladder）**，而不是一个统一的「插件 API」。这也是它比一般插件系统更可参与的原因：参与者可以选摩擦最小的那层。

## 四层阶梯

| 层 | 入口 | 典型动作 | 必须会的知识 | 检查半径 |
|----|------|----------|--------------|----------|
| L0 配置组合 | Profile / Bundle / `cordis.patch.yml` / `--patch` | 换 provider、改默认参数、关插件、插新行 | cordis.yml 语法（含 `!!js`）、entry id、`dsh --dump-config` | `verify-cordis-config`；boot fail loud |
| L1 扩展点插件 | `ctx.tools` / `ctx.commands` / 事件监听 | 加 tool、加 hook、加 section | 插件 shape、`ctx.effect`、事件合同 | JSDoc、coverage、HMR 测试、snapshot（如模型可见） |
| L2 capability seam | Service Definition / Provider / Consumer | 加执行后端、加模型能力、替换整个执行世界 | seam 三角色、Definition 对全部 Consumer 设计 | 三角色完整性、真实组合测试、双 SDK（如碰 loop/session） |

> **seam** — a *swappable capability* with three roles: a **Service Definition** (…never a TypeScript `interface`), one or more **Service Providers**, and one or more **Consumers** that inject the service.
>
> —— `docs/glossary.md:9`（基线 `fb2c4b9e69…`）
| L3 loop / session 合同 | `agent-loop`、`SessionEventMap` | 改驱动、加持久事件、改请求头语义 | loop 义务、日志投影、版本机制 | invariant、双 SDK 投影、snapshot、architecture 同步 |

阶梯的要点不是「层级越高越难」，而是**每层都有明确的升级条件**：L0 解决不了才去 L1；扩展点表达不了才设计 seam；只有改变循环合同本身才改 L3。这正是 [`03`](./03-paved-road.md) 的四问路由在参与者视角的投影。

## 两个轴：进程组合与会话组合

「四种模式」容易被读成四套互斥产品。实际是两条轴 `[源码]`：

- **Runtime Profile**：`web` / `headless` 决定这个进程以什么表层运行。
- **Agent Preset**：`standard` / `ptc` / `minimal` / `cordis` 决定单个会话看到哪些工具、提示词与局部能力。

Profile 是进程级组合，Preset 是会话级组合；一个 Web 进程可以承载不同 preset 的会话。参与时要先分清自己改的是「所有会话都受影响」还是「某一类会话」。`[推断]` 这个两轴读法来自 DSH 文档；仓库落点见 [`docs/architecture.md`](../../docs/architecture.md) 与 [`docs/capability-seams.md`](../../docs/capability-seams.md)。

> Give one session a different capability set | compose an agent preset; a service row there needs an `isolate` realm.
>
> —— `docs/architecture.md:141`（基线 `fb2c4b9e69…`）

## 部署时替换是系统能力，不是源码习惯

L0 最容易被低估。dsh 的 Profile / Bundle / Patch 不是「配置文件」那么简单：**替换实现不需要改启动代码，替换本身成为系统提供的能力。**

> A running `dsh` is a plugin tree composed at boot from ordered layers.
>
> —— `docs/architecture.md:17`（基线 `fb2c4b9e69…`）

> Layers apply to an empty entry list in this order: each bundle in the profile's listed order, then the profile's `cordis.patch.yml`, then the home-level one, then any `--patch` overlay. A patch targets a row by id and replaces its whole config, or inserts new rows.
>
> —— `docs/architecture.md:27`（基线 `fb2c4b9e69…`）

- 配置从空 entry list 开始，按 Bundle → Profile patch → home patch → `--patch` 的顺序叠加；顺序就是数据。
- 后层按 entry id 整份替换 config，或插入新行。
- `dsh --dump-config` 输出的不是「可能加载什么」，而是**这台机器实际会挂什么**；dump 与 boot 共用同一 `applyEntryPatches`（官方落点：`docs/architecture.md:34` 的 dump 命令与 [`vendor/README.md`](../../vendor/README.md) 本地修改清单第 11 条）。
- 用户 patch 的 HMR 是事务性的：候选配置失败时保留上一棵好树（[`vendor/README.md`](../../vendor/README.md) 本地修改清单第 8 条：restores the previous plugin or config when candidate application fails）。

因此静态 import 图只能说明「可能加载什么」，最终配置树才说明「实际是什么」。参与 L0 的最低可核查动作就是读 `dump-config`，而不是读源码目录猜组合。

## 一次贡献的完整生命周期

四层阶梯只回答「从哪扇门进」。进了门之后，非平凡贡献还有一条制度化的生命周期。这条链可以从 DSH 的 `.agents/notes/README.md`、`docs/AGENTS.md` 和 `docs/testing.md` 中直接重建，harness-idea 只引用判断，不重复机制：

> **Every non-trivial change includes at least one Agent Note in the same PR.** Update the owning note or add one; only mechanical/local edits are exempt.
>
> —— `docs/AGENTS.md:39`（基线 `fb2c4b9e69…`）

```text
Issue 验收条件
  → proposed Agent Note（问题、提案、替代方案、验收、风险）
  → Plan Mode 计划评审（完整到另一工程师可直接实现）
  → 实现 + 当前合同（类型 / JSDoc / README / architecture 同步）
  → 测试 / keyless snapshot / 真实入口 smoke
  → implemented Note 改写 + dsh-code-review 语义 review
  → 归档 / 合并 / 删除的后续治理
```

对 fresh agent 的意义：**做对不只发生在 `apply()` 里。** 生命周期把「为什么、放弃了什么、怎么证明」外置到 Issue、Note、Plan、测试与 review，agent 换轮次时不必从 commit 对话里重建设计。

## 不同层有不同的“正确完成”标准

- L0 的完成：`dump-config` 可见、boot 成功、失败大声；
- L1 的完成：贡献随 fiber 卸载、HMR 测试证明清理、模型可见输出有 snapshot；
- L2 的完成：三角色齐全、Consumer 不依赖具体 Provider、换 provider 后真实组合仍通过；
- L3 的完成：模型可见 ⟺ 已记录、双 SDK 同 PR 投影、session 版本机制按规则处理。

这条清单本身分散在 `packages/AGENTS.md`、`docs/testing.md` 与 architecture 文档里；dsh 没有把它们合成一张总表，本页的合成是判断，不是官方术语。

## 结论

参与 dsh 的正确姿势不是「找到一个插件 API」，而是**先选层，再读该层的合同，再跑该层的检查**。层与层之间有升级条件，进程组合与会话组合有两条轴，部署时替换是第一等能力，非平凡贡献有完整生命周期。这样，从「只想改一行配置」到「想换掉 loop」的读者都有路可走，而不是都被逼到同一扇门前。

## 证据入口

- [`docs/architecture.md`](../../docs/architecture.md)（第 17、27 行；profile / bundle / patch 与 dump）
- [`docs/cookbook/extension-cookbook.md`](../../docs/cookbook/extension-cookbook.md)（feature → mechanism 表）
- [`docs/cookbook/adding-a-tool.md`](../../docs/cookbook/adding-a-tool.md)（L1 范本）
- [`docs/cookbook/adding-a-package.md`](../../docs/cookbook/adding-a-package.md)（L2/L3 涉及的新包与同步义务）
- [`docs/development.md`](../../docs/development.md)（包结构、tsconfig、aggregate）
- [`../../AGENTS.md`](../../AGENTS.md)（standing orders 与各层检查）
- [`../../packages/AGENTS.md`](../../packages/AGENTS.md)（包级参与规则）
- [`../../docs/testing.md`](../../docs/testing.md)（第 35 行；完成标准与验证政策）
- [`../../.agents/notes/README.md`](../../.agents/notes/README.md)（Agent Note 生命周期）
- [`docs/glossary.md`](../../docs/glossary.md)（第 5 行；seam / scope / preset 术语）
