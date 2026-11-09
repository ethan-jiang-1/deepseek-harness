# Unspecified Gaps and Contradictions in Usage Policy · 用法政策里没说清的部分

源码核验入口：`packages/workflow/workflow/README.md`、`packages/workflow/tool-workflow/src/index.ts`、`packages/subagent/tool-subagent/src/index.ts`、`packages/goal/tool-goal/src/index.ts`、`packages/jobs/tool-jobs/src/index.ts`、`packages/interaction/tool-ask-user/src/index.ts`、`packages/bundle/base/cordis.patch.yml`。

本页回答：官方选择语义**哪里没说、哪里互相矛盾、哪里只是 prompt 约束而非机械约束**？这些空白对插件作者意味着什么？逐原语边界句见 [`selection/01`](./01-per-primitive-usage-sentences-from-tool-descriptions.md)，路由见 [`selection/02`](./02-cross-primitive-routing-and-the-official-upgrade-order.md)。

## 矛盾与空白（官方未说清的部分）

1. **主语不一致**：tool-workflow 的 README 与 prompt section 说 "the **user** explicitly asks"，引擎包 `packages/workflow/workflow/README.md:28` 写 "the **model** explicitly asks for workflow-style orchestration"——引擎包疑似笔误；prompt section 是权威模型可见文本。ralph 用 "the direct human"，workflow 用 "the user"，粒度也不同。
2. **目录渲染与实际组合已一致**：`docs/tool-catalog.md:41` 的 subagent 行写 "Every delegation returns a child id promptly; local children accept follow-ups, while external backends report their single execution automatically."，与 base 组合的 provider 语义对齐。
3. **fresh ↔ fork 无模型级路由**：选择语义只在两个工具各自的 description 与 README 里，没有针对二者的 prompt section 或部署 guidance——工具描述独自承担全部路由。
4. **goal 侧无反向路由**：goal 的描述/README 从不提 ralph、workflow、subagent 或 schedule；路由是单向的（ralph→goal、workflow→subagent），goal 语境下没有官方降级/升级指引。
5. **goal ↔ schedule 无互斥说明**：两者都跨时间推进（objective 续跑 vs wall-clock 提醒），互不提及，无选择 guidance。
6. **「何时转后台」无统一规则**：jobs 的 prompt section 只讲跟踪与收尾纪律；`run_in_background: true` 的决策散落在各 producer 的参数描述里。
7. **ralph 的 explicit-ask 仅是 prompt 约束**：无机械执行；且 shipped 组合里该工具默认 disabled，模型根本看不到。
8. **fork 无并发提示**：continuable 的并发 prompt section（"Start independent delegations with … together in one assistant message and continue useful work while they run."，`packages/subagent/tool-subagent/src/index.ts:370`-`380`）只在该 delegation tool 可见时注册；`subagent_fork` 侧是否出现取决于它是否 visible——两个工具共享同一条 section 生成逻辑。
9. **ask_user_question 的 timed/blocking 二选一**：随部署 mode 切换（`packages/interaction/tool-ask-user/src/index.ts:31` vs `src/timed.ts:27`-`30`），何时该开 timed 无模型级 guidance。

## 空白的设计后果

这不是“文档没写完”的清单，而是**插件作者必须自己补的决策面**：

- **单向路由**意味着没有人在你的链选错时纠正你；选择质量只能靠你自己的合同文本（policy skill / prompt section）和探针。
- **“用户显式要求”只是 prompt 约束**（ralph 甚至默认不装）：把工具的可见性当成授权闸是错的；真正的闸是组合与审批。
- **`run_in_background` 没有统一决策规则**：后台化是每个 producer 自己的参数语义，插件作者不能假设存在一个全局“何时后台”的策略。
- **fresh/fork 没有模型级路由**：两个工具的 description 各自承担全部选择语义，缩短或改写 description 会直接改变模型的选择分布。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/workflow/workflow/README.md:28` | “the model explicitly asks” 与工具侧 “the user explicitly asks” 的主语冲突 |
| `docs/tool-catalog.md:41` | 目录渲染与实际组合已对齐的旁证 |
| `packages/subagent/tool-subagent/src/index.ts:370`-`380` | 只在 delegation tool 可见时注册的并发提示 |
| `packages/experimental/tool-ralph/src/index.ts:177`-`182` | explicit-ask 只是 prompt 约束、默认不装的组合事实 |
| `packages/interaction/tool-ask-user/src/index.ts:31`、`src/timed.ts:27`-`30` | timed/blocking 二选一随部署切换 |
| `packages/bundle/base/cordis.patch.yml:340`、`:342` | plan/todo 顺序与 ask_user 的部署 guidance |
