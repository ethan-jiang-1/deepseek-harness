# 传统代码插件（TypeScript Cordis plugin）

> 这是 DSH 两种插件之一。另一种是智能体工作流插件（参见 [`developer-journey-workflow.md`](./developer-journey-workflow.md)）。
>
> `developer-journey.md` 用 `log_decision` 工具做实例，默认的就是这类插件。

---

## 0. 一句话结论

传统代码插件 = **TypeScript 写的 Cordis plugin + `defineTool` 声明**。
代码放哪有两种选择，DSH 原生（最省力）的是在仓库内开新 `packages/<group>/<pkg>/`，直接享用
workspace 级 typecheck、test runner、门禁、CI 发布管道。

---

## 1. 你在写什么

你写的是一段 TypeScript，打包为 Cordis plugin：

```typescript
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'my-plugin'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'my_tool',
    description: '...',
    parameters: { /* JSON Schema */ },
    output: { schema: {/*...*/}, render: (args, value) => [/*...*/] },
    async execute(args, exec) { /* 你的逻辑 */ },
    presentCall: (args) => ({ card: 'generic', title: '...' }),
    presentResult: (args, result) => ({ card: 'generic' }),
  }))
}
```

**你需要手写**（来源：[`docs/cookbook/adding-a-tool.md`](../../docs/cookbook/adding-a-tool.md)）：
- `parameters` / `output.schema` — 数据契约
- `execute` — 做什么（+ 手检 DSL 无法表达的约束，如非空串）
- `render` — 模型看到什么
- `presentCall` / `presentResult` — UI 卡片（纯函数、无 I/O）

**其余全部派生**：args 自动验证 → schema 自动流入 system prompt → Code Mode 类型自动推导 →
UI card 从 render intent 自动渲染。

---

## 2. 项目结构选择

### 模式 A：在 DSH 仓库内开发（推荐）

```
packages/<group>/<pkg>/
  src/index.ts      # name/inject/apply + defineTool
  tests/            # vitest 自动发现
  README.md         # package contract + Model Experience
  package.json      # @deepseek-ai/dsh-<name>
  tsconfig.json     # extends tsconfig.base.json
```

**注册成本**：`tsconfig.host.json` 加一行 reference。其余自动覆盖。

**验证闭环（窄证据切片）**：

```
1. 核对现场   → 读 cookbook/adding-a-tool.md, 读已有 tool 做模板
2. 判窄 diff  → 新文件 ~6 个 + tsconfig.host.json +1 行（纯增量）
3. 原子修改   → 写 src/index.ts + tests/ + README.md
4. 最小证据   → pnpm run test -- --run packages/<group>/<pkg>/
                pnpm run typecheck
                pnpm run doc-sync
5. 沉淀       → 架构决策才记 Agent Note
6. 报告       → PR 描述列检查结果
```

**轻松来源**：

| 来源 | 体现 |
|---|---|
| 记忆外包 | 复制已有 package 的 tsconfig/package.json；workspace 解析自动找依赖 |
| 反馈秒级 | `pnpm run test -- --run <pkg>` 只跑你的文件 |
| 犯错代价低 | 整 PR 回滚只影响新 package |

### 模式 B：外部独立开发

```
~/projects/dsh-plugin-my-tools/
  package.json        # 依赖 @deepseek-ai/dsh-tools（npm，非 workspace）
  tsconfig.json       # 自己维护
  src/index.ts        # defineTool 代码和模式 A 一样
  tests/              # 自有测试框架
  dist/               # tsc 产出
```

**加载**：

```bash
dsh --plugin ./dist/index.js "记一个决策"
```

**代价**：`defineTool` 契约（execute/purity/output-schema）**仍然必须遵守**，
但失去仓库级 test runner / typecheck / doc-sync / 门禁。窄证据切片仍然是一个好习惯，但不再是"最省力路径"——设施不同了。

### 混合路径（推荐给要发 npm 包的人）

模式 A 开发 + 模式 B 交付：仓库内开 PR → CI publish → `npm install @deepseek-ai/dsh-<name>` → `--plugin` 加载。

---

## 3. 验证全景

| 检查 | 模式 A | 模式 B |
|---|---|---|
| 工具逻辑 | `pnpm run test -- --run <pkg>` | 自己搭 |
| 跨包引用 | `pnpm run typecheck` | `tsc` 仅限自己 |
| README / catalog | `pnpm run doc-sync` | 无等效项 |
| 代码格式 | pre-commit 自动 | 自己配 |
| CI 全量 | 仓库 CI | 自己管 |

---

## 4. 与智能体工作流插件的关系

传统代码插件和智能体工作流插件是**两种不同的插件品种**，不是项目结构变体。

| | 传统代码插件 | 智能体工作流插件 |
|---|---|---|
| 插件形式 | TypeScript Cordis plugin | 脚本 / skill / Note / 覆层 |
| 存放位置 | `packages/<group>/<pkg>/` | `.agents/workflows/` / `.agents/skills/` / `.agents/notes/` |
| 验证方式 | `pnpm run test` | 真实模型调用 |
| 组合方式 | 暴露 tool → 工作流脚本用 `agent()` 调用它 | |

详情参见 [`developer-journey-workflow.md`](./developer-journey-workflow.md)。

---

## 附录：关键引用

| 问题 | 权威来源 |
|---|---|
| 新 package 目录布局 | [cookbook/adding-a-package.md](../../docs/cookbook/adding-a-package.md) |
| tool execute/present 契约 | [cookbook/adding-a-tool.md](../../docs/cookbook/adding-a-tool.md) |
| 如何加载外部 plugin | `dsh --plugin <path>`（`apps/cli/src/bin.ts`） |
| workspace 依赖解析 | pnpm 自动 |
| 外部 plugin 的 cordis.yml | [cordis-primer.md](../../docs/cordis-primer.md) |
| 完整实例推演 | [`developer-journey.md`](./developer-journey.md)（`log_decision` 工具走完全程） |
