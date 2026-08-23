# 为什么懂了就做对：正确路径（paved road）是阻力最小的路径

## 问题

可读不等于做对。很多系统文档写清楚了，动手还是错：因为**正确做法与错误做法的摩擦一样小，甚至错误做法更显眼**——正确写法藏在某个没写下来的约定里，错误写法反而有现成的复制粘贴来源。英文设计词汇里这被称为 paved road（铺好的路）或 pit of success（成功之坑）：正确做法是唯一好走的路。

dsh 的设计让正确做法的摩擦最小。六个机制：

## 机制一：注册即效果（registrations are effects），只有一种写法

插件的每个贡献都走 `ctx.effect()` / `ctx.on()`，注册返回 disposer，fiber 卸载时贡献一并撤销（HMR 安全由测试证明）。正确写法 = 生命周期正确的写法，**不存在「先这么写、回头补清理」的第二套写法**。

对比：如果一个系统里「正式注册」和「临时挂上去」是两种写法，读者每次都要判断该用哪种——判断就是犯错点。dsh 把判断删掉了。

## 机制二：默认正确，少做即对

- 在 `ctx.tools` 注册一个 tool：schema 自动进 prompt 组装、自动进 Code Mode 的 `ToolArgsMap`、自动有 UI fallback 卡片。什么都不用再碰。
- 换一个 provider：整面产品跟着变，Consumer 一行不改（seam 三角色的承诺）。
- 扩展表里「加模型提供方」的答案就是一行：「在 `ctx.llm` 注册 adapter」。

「做对」经常等于「少做」。系统替你完成的默认行为越多，你能做错的表面越少。

## 机制三：显式优于隐式（explicit over implicit），没有隐藏约定

- `resolve(request): Spec` 是显式步骤，没有埋在 `run()` 里的 `?? default`（[`../capability-seams/00-map.md`](../capability-seams/00-map.md)）。
- 没有 hardcoded tunables：部署参数都是 `Config` 字段，可从 `cordis.yml` 改。
- 可选服务用 `ctx.get(name)` 显式读取，不依赖属性代理的拓扑巧合。
- 误配置在 load 时 fail loud，缺失引用从不静默跳过。

做对不需要知道任何隐藏约定——**因为约定不存在**。这是「读懂了就做对」的底气：不是读者运气好猜中了，而是没有可猜错的东西。

## 机制四：失败大声且就近，试错收敛快

agent 的工作方式是「写 → 跑 → 读错误 → 改」。这个循环的收敛速度取决于错误何时出现、离源头多远：

- required-on-read 在编译期拒绝未知事件类型；
- 误配置在 load 时 fail loud；
- 运行时 invariant 在 loop 构建的每次 `llm/stream` 上重建请求并与日志比对（非 loop 请求不检查），不一致立刻 fail（`packages/core/agent-loop/src/invariant.ts`）。

错误发生在源头、消息指明违反的规则（「diverges from the folded request header」）。agent 不需要猜测「哪里错了」，只需要按错误消息修。每轮试错都有信息增量。

## 机制五：门禁即教学（gates as teaching），反馈延迟趋近于零

门禁把合同变成可执行的检查，错误信息告诉你怎么补：

- `verify-export-jsdoc`：每个导出必须有 JSDoc，缺了就报，报的就是缺什么。
- `doc-typecheck`：文档里的 TypeScript 必须能编译。
- `test:coverage`：per-file 100%——你写的每行都要被测到，测不到就是红的。
- snapshot：模型可见输出钉成基准，改行为必须改基准（[`docs/testing.md`](../../docs/testing.md)）。

做错不是等人类 review 打回（延迟以天计），而是被机器当场纠正（延迟以秒计）。对 coding agent 而言，门禁就是「资深开发者的即时批注」——不会漏、不会累。

## 机制六：对称消除歧义（ambiguity）

歧义是犯错之源。dsh 系统性封死「这里也可以、那里也可以」的岔路口：

- seam 永远是三角色（Definition / Provider / Consumer），一个角色不是 seam；
- closed union 以 `assertNever` 结尾，新分支必须显式处理；
- 一个事实一个家，一个概念一个词；
- 一个包只进一个 compiler aggregate（`api/remotes` 是唯一例外）。

每封死一个岔路口，读者就少做一次二选一；二选一是 agent 犯错的主要来源，因为它需要「判断」，而判断需要背景知识。

## 附：范本（template）即教科书

`docs/cookbook/adding-a-tool.md` 给出 26 行最小 shape（`defineTool` 的 name / description / parameters / output / execute）；`packages/shell` 家族是生产级三包范本；cookbook 覆盖加 package、tool、LLM adapter、Chat node、settings card 的 step-by-step + verify 步骤。

复制范本 = 正确实现，因为范本走的正是门禁要求的路径。新读者不需要发明写法，只需要填空。

## 总结

dsh 把「正确」编码进系统的**形状**（形状上只有一条路），而不是编码进文档的**劝告**。做对不是美德，是路径依赖（path dependence）。这是「读懂了就做对」的完整机制：读懂（[`02`](./02-legibility.md)）解决「知道有什么」，形状解决「只能做对」。

## 证据入口

- [`docs/cookbook/adding-a-tool.md`](../../docs/cookbook/adding-a-tool.md)（tool 合同与最小 shape）
- [`../../packages/core/agent-loop/src/invariant.ts`](../../packages/core/agent-loop/src/invariant.ts)（运行时 invariant）
- [`docs/tool-execution-pipeline.md`](../../docs/tool-execution-pipeline.md)（三条 waterfall 管道）
- [`../composition/00-map.md`](../composition/00-map.md)（patch 层：误配置 fail loud）
- [`../session-and-loop/01-session-event-map.md`](../session-and-loop/01-session-event-map.md)（required-on-read）
- [`../../docs/testing.md`](../../docs/testing.md)（coverage 与 snapshot 政策）
