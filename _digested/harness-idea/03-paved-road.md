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
> —— `docs/architecture.md:121`（基线 `a66e4702…`）

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
> —— `docs/cordis-api/fiber.md:30`（基线 `a66e4702…`）

诚实说明强制力在哪：这一条是**惯例 + 测试 + review 强制**，不是静态门禁——静态分析管不到「每个贡献是否都走了 effect」。dsh 的对策是把惯例写成 standing order（`AGENTS.md`），把生命周期正确性交给 HMR 测试与运行时 invariant（见机制六）。

> **Registrations are effects**: every contribution goes through `ctx.effect()` / `ctx.on()`; a registry's `register()` returns the disposer.
>
> —— `AGENTS.md:105`（基线 `a66e4702…`）

对比：如果一个系统里「正式注册」和「临时挂上去」是两种写法，读者每次都要判断该用哪种——判断就是犯错点。

## 机制四：默认正确，显式优于隐式

- 在 `ctx.tools` 注册一个 tool：schema 自动进 prompt 组装、自动进 Code Mode 的 `ToolArgsMap`、自动有 UI fallback 卡片。什么都不用再碰。
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
- 运行时 invariant 在请求发出时比对（见机制六）；
- `cordis_mount` 的边界错误会指出违反的规则与可接受写法。

错误发生在源头、消息指明违反的规则。agent 不需要猜测「哪里错了」，只需要按错误消息修。每轮试错都有信息增量。

> **Waterfall listeners MUST call `next()`** to delegate; returning without it short-circuits the chain.
>
> —— `AGENTS.md:109`（基线 `a66e4702…`）

## 机制六：运行时 invariant 体系——规则写成断言，不写成劝告

这是 dsh 独有的、比「门禁」更狠的一层：

- **invariant 只登记「独立观察会分叉」的运行时关系**：publish `./invariant` 仅在该包有可独立观察、会分叉的关系时成立；它检查有所有权的关系——权威事件流或可变数据，不检查 service 存在性、不检查插件元数据——「存在」不代表「关系成立」，断错了对象等于没断。空/忽略 reporter 判 fail（`verify-package-invariants` 强制，纪律见 [`packages/AGENTS.md`](../../packages/AGENTS.md)）。
- **「每个包都登记」的普遍制已被上游废除**：早期纪律是每个包必须带 companion，没有可观察关系就写带 `No runtime invariant:` 标记的空 companion——「absence 是显式结论，不是漏写」是当时被赞美的装置。`0.1.2-rc.1` 上游反转了这个决定：带标记的空 companion 全部删除，无独立关系的包改省略并写进 README 原因（[`2026-08-28-omit-unneeded-invariant-companions`](../../.agents/notes/implemented/simplification/2026-08-28-omit-unneeded-invariant-companions.md)）。对 digest 这是一条罕见的实证：连「显式空断言」都会被上游当噪音裁掉——可执行化的正确形状是「只在有真关系处断言」，不是「处处有断言」。计数口径见 [`claims.json`](./claims.json) 的 N4–N6（用 `git ls-tree` 在基线上重算，prose 不手写固定总数）。
- **实例**：`dsh-agent-loop/invariant` 在 loop 构建的每次 `llm/stream` 上独立重建请求并与日志比对，不一致立刻 fail（非 loop 请求不检查）——它有真实的分叉关系，所以在这次废除中幸存。
- **publish 由双层门把守**：`verify-package-invariants` 的结构门先用 AST 拒掉 `@generated` 标记、default export、空 install 函数和未使用的 failure reporter；结构门通过后，artifact 门把 manifest 声明的 `lib/` 产物放到 staging，在 plain Node 下导入编译产物并复验 Loader 形状——导入了未声明运行时 chunk 的 companion 在发布前就变红（[`2026-07-19-package-invariant-runtime-contracts`](../../.agents/notes/implemented/architecture/2026-07-19-package-invariant-runtime-contracts.md)）。

「模型可见 ⟺ 已记录」如果只是文档里的劝告，一定会在某次重构中失效；它是运行时断言，所以它活着。门禁管「提交前」，invariant 管「运行时」——两条线都断，错误才可能漏出去。

## 机制七：门禁即教学，且门禁自身被测试

门禁把合同变成可执行的检查，错误信息告诉你怎么补：`verify-export-jsdoc` 缺什么报什么；`doc-typecheck` 让文档里的 TypeScript 必须能编译；`test:coverage` 按文件 100%；snapshot 把模型可见输出钉成基准。

做错不是等人类 review 打回（延迟以天计），而是被机器当场纠正（延迟以秒计）。对 coding agent 而言，门禁就是「资深开发者的即时批注」——不会漏、不会累。

更关键的是**元验证**：dsh 不只相信门禁，还测试门禁本身（[`docs/testing.md`](../../docs/testing.md)）：

- 「A guard only guards if the regression fails it」——新守卫必须证明引入回归会变红；

  > A guard only guards if the regression fails it. ... prove it: introduce the regression, watch red, revert.
  >
  > —— `docs/testing.md:39`（基线 `a66e4702…`）
- 「Verify the world, not the self-report」——e2e 要重新执行命令或读文件，不能相信 agent 自己的输出；
- 真实入口路径：built artifact smoke、Loader 真实组合、snapshot 必须来自可运行示例；
- 每个非平凡模型/协议/人类可见变化，同 PR 更新 keyless snapshot。

这意味着「正确路径可信」不只是因为阻力小，而是因为**路径本身的负例被持续验证**。

**门禁本身要学。** 诚实的一面：[`run-gates.ts`](../../scripts/run-gates.ts) 聚合了数十个具名 gate（准确口径以脚本为准，本专题不手写固定总数），选「该跑哪几个」本身是一个判断。[`dsh-pre-push-checks`](../../.agents/skills/dsh-pre-push-checks/SKILL.md) skill 把它拆小并配工具，但它是 guidance，不是门禁；真正的兜底是 review + CI exhaustive。判断门槛没有被移除，只是从「凭经验」变成「照 skill 走，review 兜底」。

## 总结

dsh 把「正确」编码进系统的**形状**与**检查**：扩展点路由定位置，事件模式定控制权，Fiber 与 effect 定退路，门禁与 invariant 定反馈，元验证定信任。做对不是美德，是路径依赖（path dependence）；而且这条路径本身被负例测试守着。读懂（[`02`](./02-legibility.md)）解决「知道有什么」，形状解决「只能做对」，元验证解决「路径没有被刷绿」。

## 证据入口

- [`docs/architecture.md`](../../docs/architecture.md)（第 66、123 行；事件域与扩展表）
- [`docs/cookbook/extension-cookbook.md`](../../docs/cookbook/extension-cookbook.md)（feature → mechanism 表）
- [`docs/cookbook/adding-a-tool.md`](../../docs/cookbook/adding-a-tool.md)（tool 合同与最小 shape）
- [`../../packages/core/agent-loop/src/invariant.ts`](../../packages/core/agent-loop/src/invariant.ts)（运行时 invariant 幸存实例）
- [`2026-08-28-omit-unneeded-invariant-companions`](../../.agents/notes/implemented/simplification/2026-08-28-omit-unneeded-invariant-companions.md)（rc.1 废除空 companion 的裁定，现行权威）
- [`2026-07-19-package-invariant-runtime-contracts`](../../.agents/notes/implemented/architecture/2026-07-19-package-invariant-runtime-contracts.md)（第 24、30 行；note 已被 rc.1 原地改写——现 :24 是「无独立关系即省略 companion 并在 README 记原因」、:30 是「publish 由 `verify-package-invariants` 机械枚举」，原「普遍 companion 制」表述只剩历史意义，rc.1 起被 2026-08-28 裁定取代）
- [`../../.agents/skills/dsh-pre-push-checks/SKILL.md`](../../.agents/skills/dsh-pre-push-checks/SKILL.md)（选门禁的判断被外置成 guidance）
- [`../../docs/testing.md`](../../docs/testing.md)（第 34 行；coverage、snapshot 与元验证）
- [`../../AGENTS.md`](../../AGENTS.md)（第 105、109、110、116 行；注册即效果、waterfall、model-visible、fail loud）
- [`../../packages/AGENTS.md`](../../packages/AGENTS.md)（包级参与规则）
- [`docs/cordis-primer.md`](../../docs/cordis-primer.md#cordis-waterfall-semantics)（waterfall 控制权）
