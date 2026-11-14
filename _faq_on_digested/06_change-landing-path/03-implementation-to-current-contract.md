# 03 · 中游：实现、docs/types/README、tests/snapshots

## 1. 实现与合同同步

实现不是“先写代码”。DSH 要求代码和当前合同同一变更更新：

> Update package README and JSDoc contracts in the same commit as behavior, and verify them against code with dsh-prose-standard.

来源：`packages/AGENTS.md:27`

> The owning subsystems page updates in the same change that reshapes a documented type.

来源：`docs/AGENTS.md:44`

也就是说，`docs/`、package README、JSDoc 是在这里作为**结果**被写回。

## 2. docs 只写 now，不写过程

> **Document current state.** Keep history in commits, PRs, Agent Notes, postmortems, or scoped persistence records. Other prose names live mechanisms, not changes or stack positions.

来源：`docs/AGENTS.md:40`

所以 docs 更新时，写的是实现后的当前机制，不写“我们以前怎样，现在改成怎样”。

## 3. 生成目录由生成器刷新

tool-catalog、config-catalog、persistence-catalog、event-producer-consumer、module-graph、cordis API 都是从源码生成并 freshness-gated。

模型不需要手动维护这些穷举面；实现后运行生成器，再让 gate 检查没有 diff。

## 4. tests / snapshots 是行为证据

`docs/testing.md` 把行为验收分成多层：

- 产品可见插件需要 REAL-composition test，不能只测手搭 `ctx.plugin(...)`；
- 模型/协议/人类可见变化必须更新 keyless snapshot；
- `verify the world, not the self-report`；
- 真实入口路径要测 built artifact 和真实 Loader 组合；
- guard 必须证明引入回归会红。

> Every non-trivial model-, protocol-, or human-visible change adds or updates a keyless recorded-session scenario in the same PR.

来源：`docs/testing.md:55`

## 中游小结

```text
实现（源码行为）
  + types / JSDoc
  + package README
  + architecture / subsystems
  + generated catalogs
  + tests / snapshots
```

这些都是同一变更的多个面，不是依次补交的多个 PR。`docs/` 在这里作为实现后的当前合同被写回。

## 证据入口

- [`packages/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/AGENTS.md) 第 27-29 行
- [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md) 第 40、44 行
- [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md) 第 27-55 行
- [`docs/tool-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-catalog.md) 第 1-2 行
- [`docs/config-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md) 第 1-2 行

## 5. 证据对照与红灯

“测试通过”不等于“变更完整”。主例（模型 ID 显示，[07](./07-model-selector-case.md)）的 7 个文件可以逐面核对证据：

| 变更面 | 证据 | 它证明什么 |
|---|---|---|
| 组件行为：候选行从显示名换成 `{candidate.id}` | 组件测试两个场景的断言反转 | 可访问名从 `Fresh` 变 `fresh`；旧显示名不再出现 |
| 搜索行为：按名称搜索仍可用 | 同一测试文件的搜索场景 | 显示换了，搜索没坏 |
| 真实入口：Web 设置页 | e2e 场景更新 | 真实浏览器里勾选 `gpt-6-astra` 走通 |
| 当前合同：README 双语 | 两语言同步改述 + `README.i18n.yaml` 重录 | 文档与行为一致、中英相等 |
| 等宽字体 + 悬停名称 | **只有 README 声明** | 无断言覆盖，如实标记为证据缺口 |

“测试会在旧行为上失败”要靠实测，不能靠文件名承诺：保留新测试、只回滚实现，聚焦组件测试跑出 **2 红 95 绿**。第一次实验曾跑出 97 全绿——因为 `git revert` 把源码和测试一起回滚了；这正说明红灯对照必须只回滚实现。

未运行项要如实分开：e2e 需要浏览器环境、`doc-sync` 与远端 CI 由正式交付执行；mock 测试不能替代真实入口的证据。

## 6. 本地检查与 PR CI 是两层

本地检查针对当前待推送的 diff 选最小可信证据，push 前抓住相关回归；PR CI 在远端跑完整矩阵。两层不是二选一：本地快、有针对性；CI 统一、覆盖广。证据路由的精确方法见 [`dsh-pre-push-checks`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-pre-push-checks/SKILL.md)。
