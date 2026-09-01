# 开发结构 · 总览

DSH 上一切皆插件（AGENTS.md: "everything is a plugin"）。插件分两个不同的品种：

| | **传统代码插件** | **智能体工作流插件** |
|---|---|---|
| 本质 | 用 TypeScript 扩展 DSH 运行时 | 用编排或文档定义 agent 行为 |
| 插件形式 | Cordis plugin（`name/inject/apply + defineTool`） | 脚本 / skill / Note / 覆层 |
| 存放位置 | `packages/<group>/<pkg>/` | `.agents/workflows/` / `.agents/skills/` / `.agents/notes/` |
| 是否需打包 | ✅ 是（TypeScript → JS） | ❌ 不需要 |
| 验证方式 | `pnpm run test -- --run <pkg>` | 真实模型调用 |

两者可以组合——传统代码插件暴露 tool，工作流脚本用 `agent()` 调用它。但它们是**不同的插件品种**。

- 读 [`developer-journey-plugin.md`](./developer-journey-plugin.md) — 传统代码插件
- 读 [`developer-journey-workflow.md`](./developer-journey-workflow.md) — 智能体工作流插件
- 实例（正走六步闭环）：[`developer-journey.md`](./developer-journey.md)（传统代码插件类型）