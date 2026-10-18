# 为什么懂了就做对：正确路径（paved road）是阻力最小的路径

## 问题

可读不等于做对。很多系统文档写清楚了，动手还是错：因为**正确做法与错误做法的摩擦一样小，甚至错误做法更显眼**——正确写法藏在某个没写下来的约定里，错误写法反而有现成的复制粘贴来源。英文设计词汇里这被称为 paved road（铺好的路）或 pit of success（成功之坑）：正确做法是唯一好走的路。

dsh 的更强版本是：不只让正确路径好走，还让**路径本身可以被检查**。七个机制，编号只为引用。

## 机制一：扩展点路由——先定落点，再动手

任何新行为先过四问（extension routing）`[框架]`：

1. **它是必须回放的事实吗？** 是 → 扩展 `SessionEventMap`，从日志投影。
2. **它要拦截进行中的工作吗？** 是 → `agent/*`、`tools/*` 或能力事件。
3. **它是一项可替换能力吗？** 是 → Service Definition / Provider / Consumer 三角色。
4. **它需要改 Agent Loop 吗？** 通常不需要；先证明现有扩展点无法表达。

这是把 [`docs/architecture.md`](../../docs/architecture.md#where-new-behavior-goes) 的扩展表（行数见 [`claims.json`](./claims.json) 的 N3）压缩成判定顺序。仓库自身的权威表是 architecture 与 [`extension-cookbook`](../../docs/cookbook/extension-cookbook.md)。路由把「放哪」从查表题进一步变成判定题，而且每一步判定都有字面合同。

> New behavior attaches to a documented extension point. Changing the loop itself updates this map.
>
> —— `docs/architecture.md:140`（基线 `687f282e86…`）

## 机制二：四条设计哲学，约束所有新增功能

`[推断]` 本专题从 DSH 文档中提炼出四条设计哲学，并认为它们能经受源码检验：

1. **组合优于继承**：用 Profile / Bundle / Patch 组装产品表层，而不是扩展一个巨型 Application 类（[`docs/architecture.md`](../../docs/architecture.md)）。
2. **扩展点必须有语义**：事件域与分发模式共同定义控制权，不是到处散落的回调（[`docs/cordis-primer.md`](../../docs/cordis-primer.md#cordis-waterfall-semantics)）。
3. **副作用必须有所有者**：服务、监听器与长任务随 Fiber 生命周期存在，卸载路径可验证（[`docs/cordis-primer.md`](../../docs/cordis-primer.md)）。
4. **事实先于视图**：会话日志是唯一真源；模型上下文、UI、fork 与遥测从事件派生（[`docs/architecture.md`](../../docs/architecture.md#session-log)）。

这四条的共同效果是：**每个改动都有位置、有边界、有退路。**

## 机制三：注册即效果（registrations are effects），只有一种生命周期写法

插件的每个贡献都走 `ctx.effect()` / `ctx.on()`，注册返回 disposer，fiber 卸载时贡献一并撤销（HMR 安全由测试证明）。正确写法 = 生命周期正确的写法，**不存在「先这么写、回头补清理」的第二套写法**。

> `execute` runs immediately; the disposers it produces are collected and run (in reverse order) either when the returned disposer is called or when the fiber unloads, whichever comes first.
>
> —— `docs/cordis-api/fiber.md:30`（基线 `687f282e86…`）

诚实说明强制力在哪：这一条是**惯例 + 测试 + review 强制**，不是静态门禁——静态分析管不到「每个贡献是否都走了 effect」。dsh 的对策是把惯例写成 standing order（`AGENTS.md`），把生命周期正确性交给 HMR 测试与运行时卸载路径（机制六记录了这条路上曾经有过的运行时断言层及其退役）。

> **Registrations are effects**: every contribution goes through `ctx.effect()` / `ctx.on()`; a registry's `register()` returns the disposer.
>
> —— `AGENTS.md:133`（基线 `687f282e86…`）

对比：如果一个系统里「正式注册」和「临时挂上去」是两种写法，读者每次都要判断该用哪种——判断就是犯错点。

## 机制四：默认正确，显式优于隐式

- 在 `ctx.tools` 注册一个 tool：schema 自动进 prompt 组装、自动进 PTC 模式的 `ToolArgsMap`、自动有 UI fallback 卡片。什么都不用再碰。
- 换一个 provider：整面产品跟着变，Consumer 一行不改（seam 三角色的承诺）。
- `resolve(request): Spec` 是显式步骤，没有埋在 `run()` 里的 `?? default`。
- 没有 hardcoded tunables：部署参数都是 `Config` 字段，可从 `cordis.yml` 改。
- 可选服务用 `ctx.get(name)` 显式读取，不依赖属性代理的拓扑巧合。
- 误配置在 load 时 fail loud，缺失引用从不静默跳过。

这里不说「约定不存在」——dsh 的约定很多。准确说法是：**没有未记录且影响正确性的隐藏约定**；记录了的约定有门禁、skill 或 review 管着。

## 机制五：失败大声且就近，错误消息教怎么改

agent 的工作方式是「写 → 跑 → 读错误 → 改」。这个循环的收敛速度取决于错误何时出现、离源头多远：

- required-on-read 在编译期拒绝未知事件类型；
- 误配置在 load 时 fail loud；
- `plugin_manager` 的安装校验与 runner 的 guarded registration 会在边界处指出违反的规则（`cordis_define` / `cordis_run` 模型工具已在 0.1.7 线退役，见 [`05`](./05-dynamic-legibility.md)）。

错误发生在源头、消息指明违反的规则。agent 不需要猜测「哪里错了」，只需要按错误消息修。每轮试错都有信息增量。

> **Waterfall listeners MUST call `next()`** to delegate; returning without it short-circuits the chain.
>
> —— `AGENTS.md:136`（基线 `687f282e86…`）

## 机制六：运行时 invariant 机制已整族退役

`0.1.2-rc.1` 曾把这一层收窄成一条纪律：**invariant 只登记「独立观察会分叉」的运行时关系**——publish `./invariant` 仅在该包有可独立观察、会分叉的关系时成立，它检查有所有权的关系（权威事件流或可变数据），不检查 service 存在性、不检查插件元数据；空/忽略 reporter 判 fail（`verify-package-invariants` 强制）。这条纪律在 `dsh-v0.2.1-rc.2` 跨度内结束：commit `f028f25667`（`refactor: remove runtime invariant plugins`，1355 文件、−15409 行）把机制整族删除。

被删除的东西：

- `@deepseek-ai/dsh-invariants` 包本身，以及每个包的 `./invariant` companion 与其测试——**新树里 `/invariant` 路径数量为 0**；
- `scripts/test-invariants.ts` + `.spec.ts`、`scripts/verify-package-invariants.ts`、`scripts/verify-built-package-invariants.mjs` + `.spec.ts`；
- [`scripts/run-gates.ts`](../../scripts/run-gates.ts) 里的 invariant 门禁、`INVARIANT` 编码的 listener rethrow 路径与 scoped-event resolver 生成器；
- `ctx.invariants` 服务（NEW 基线生成表的 99 个服务里已无此项）；
- 根 `AGENTS.md` 的「Runtime invariants assert owned relationships」条令整条，`packages/AGENTS.md` 同步移除。

上一轮收缩中「有真实分叉关系因而幸存」的 `dsh-agent-loop/invariant`——在 loop 构建的每次 `llm/stream` 上独立重建请求并与日志比对——也在这轮删除里消失，**运行时 invariant 机制不再有任何幸存实例**。权威记录是升级指南 [`docs/upgrade-guide/v0.2.0-rc.2/remove-runtime-invariants/guide.md`](../../docs/upgrade-guide/v0.2.0-rc.2/remove-runtime-invariants/guide.md)，两篇机制 note（[`2026-07-19-package-invariant-runtime-contracts`](../../.agents/notes/archived/architecture/2026-07-19-package-invariant-runtime-contracts.md)、[`2026-08-28-omit-unneeded-invariant-companions`](../../.agents/notes/archived/simplification/2026-08-28-omit-unneeded-invariant-companions.md)）都已归档为历史快照。

对 digest 这是一条两段实证：`0.1.2-rc.1` 先证明「连显式空断言都会被上游当噪音裁掉」——可执行化的正确形状是「只在有真关系处断言」，不是「处处有断言」；`f028f25667` 再证明「有真关系」也不足以让运行时断言层留下。它承担的那条关系（**模型可见 ⟺ 已记录**）现在由 `SessionEventMap` 的 required-on-read、`deriveMessages()` 投影与根 [`AGENTS.md:137`](../../AGENTS.md) 条令共同承担，没有运行时比对。

因此「门禁管提交前，invariant 管运行时」的双线读法在 `dsh-v0.2.1-rc.2` 上只剩一条线：**提交前的门禁**。规则要可执行，就得落在门禁与类型上；运行时断言层是这段历史的上一形态。

## 机制七：门禁即教学，且门禁自身被测试

门禁把合同变成可执行的检查，错误信息告诉你怎么补：`verify-export-jsdoc` 缺什么报什么；`doc-typecheck` 让文档里的 TypeScript 必须能编译；`test:coverage` 按文件 100%；snapshot 把模型可见输出钉成基准。

做错不是等人类 review 打回（延迟以天计），而是被机器当场纠正（延迟以秒计）。对 coding agent 而言，门禁就是「资深开发者的即时批注」——不会漏、不会累。

更关键的是**元验证**：dsh 不只相信门禁，还测试门禁本身（[`docs/testing.md`](../../docs/testing.md)）：

- 「A guard only guards if the regression fails it」——新守卫必须证明引入回归会变红；

  > A guard only guards if the regression fails it. ... prove it: introduce the regression, watch red, revert.
  >
  > —— `docs/testing.md:40`（基线 `687f282e86…`）
- 「Verify the world, not the self-report」——e2e 要重新执行命令或读文件，不能相信 agent 自己的输出；
- 真实入口路径：built artifact smoke、Loader 真实组合、snapshot 必须来自可运行示例；
- 每个非平凡模型/协议/人类可见变化，同 PR 更新 keyless snapshot。

这意味着「正确路径可信」不只是因为阻力小，而是因为**路径本身的负例被持续验证**。

**门禁本身要学。** 诚实的一面：[`run-gates.ts`](../../scripts/run-gates.ts) 聚合了数十个具名 gate（准确口径以脚本为准，本专题不手写固定总数），选「该跑哪几个」本身是一个判断。[`dsh-pre-push-checks`](../../.agents/skills/dsh-pre-push-checks/SKILL.md) skill 把它拆小并配工具，但它是 guidance，不是门禁；真正的兜底是 review + CI exhaustive。判断门槛没有被移除，只是从「凭经验」变成「照 skill 走，review 兜底」。

## 总结

dsh 把「正确」编码进系统的**形状**与**检查**：扩展点路由定位置，事件模式定控制权，Fiber 与 effect 定退路，门禁定反馈，元验证定信任。做对不是美德，是路径依赖（path dependence）；而且这条路径本身被负例测试守着。读懂（[`02`](./02-legibility.md)）解决「知道有什么」，形状解决「只能做对」，元验证解决「路径没有被刷绿」。

## 证据入口

- [`docs/architecture.md`](../../docs/architecture.md)（第 69、142 行；事件域与扩展表）
- [`docs/cookbook/extension-cookbook.md`](../../docs/cookbook/extension-cookbook.md)（feature → mechanism 表）
- [`docs/cookbook/adding-a-tool.md`](../../docs/cookbook/adding-a-tool.md)（tool 合同与最小 shape）
- [`docs/upgrade-guide/v0.2.0-rc.2/remove-runtime-invariants/guide.md`](../../docs/upgrade-guide/v0.2.0-rc.2/remove-runtime-invariants/guide.md)（运行时 invariant 机制整族退役的权威记录；原 `packages/core/agent-loop/src/invariant.ts` 实例随之删除，无继任）
- [`2026-08-28-omit-unneeded-invariant-companions`](../../.agents/notes/archived/simplification/2026-08-28-omit-unneeded-invariant-companions.md)（已归档，历史快照；`0.1.2-rc.1` 废除空 companion 的裁定）
- [`2026-07-19-package-invariant-runtime-contracts`](../../.agents/notes/archived/architecture/2026-07-19-package-invariant-runtime-contracts.md)（已归档，历史快照；第 24、30 行。两篇 note 记录的机制已在 `f028f25667` 整族退役）
- [`../../.agents/skills/dsh-pre-push-checks/SKILL.md`](../../.agents/skills/dsh-pre-push-checks/SKILL.md)（选门禁的判断被外置成 guidance）
- [`../../docs/testing.md`](../../docs/testing.md)（第 9、35、37-41、53-55 行；coverage、元验证、真实入口与 snapshot 政策）
- [`../../AGENTS.md`](../../AGENTS.md)（第 133、136、137、143 行；注册即效果、waterfall、model-visible、fail loud）
- [`../../packages/AGENTS.md`](../../packages/AGENTS.md)（包级参与规则）
- [`docs/cordis-primer.md`](../../docs/cordis-primer.md#cordis-waterfall-semantics)（waterfall 控制权）
