# 开发结构 · 在哪写插件，DSH 支持哪几种项目布局

> `developer-journey.md` 用"加一个 `log_decision` 工具"做实例，但它没讲清楚这个新代码**放在哪**、
> **跟仓库是什么关系**、**开发者在什么结构里工作**。本文回答这三个问题，区分两种根本不同的开发模式，
> 并说明窄证据切片闭环在每种模式下长什么样。

---

## 0. 一句话结论

DSH 支持两种开发结构，而 DSH **原生**的（被制度反复强化、最省力的）是**模式 A**——直接在 DSH 仓库内开新 package。

| | 模式 A：仓库内开发 | 模式 B：外部独立开发 |
|---|---|---|
| 代码放哪 | `packages/<group>/<pkg>/` | 任意目录，独立的 git repo 或裸目录 |
| 与 DSH 的关系 | 是 `@deepseek-ai/dsh-*` workspace 的一员 | 独立 npm 包或本地 cordis plugin |
| 加载方式 | 随 DSH 构建自动包含 | 通过 `--plugin path` 或 cordis.yml 加载 |
| 能否用门禁/CI | ✅ 全套 | ❌（或自己搭） |
| 能否跑 owning test | ✅ `pnpm run test -- --run <pkg>` | ❌（无仓库级 test runner） |
| 推荐场景 | 你想成为 DSH 生态的一部分 | 你只是消费 DSH，不想碰仓库结构 |

---

## 1. 模式 A：仓库内开发（DSH 原生的方式）

这是 `developer-journey.md` 默认但没说清的场景。

### 1.1 你在哪写

DSH 仓库的 `packages/` 目录按功能分组：

```
packages/
  core/          核心 API：session, agent-loop, system-prompt, tools
  llm/           大模型能力：Service Definition + DeepSeek providers
  shell/         bash 能力
  fs/            文件系统能力 + policy
  skill/         skill 注册 + catalog
  todo/          todo_write 工具
  goal/          goal 续轮
  subagent/      子 agent 委派
  workflow/      workflow 编排
  interaction/   审批/提问/命令
  decision-log/  ← 你的新 package 在这里（新建组）
  ...
```

你的新 package 放在 `packages/decision-log/tool-decision-log/`。
`decision-log` 是**新组名**——组本身只是一个目录（不含 `package.json`），package 在组下面一层。

### 1.2 这是什么性质的"开发"

你是在 DSH 仓库的 `pnpm workspaces` 里工作。这意味着：

- **依赖关系**：你可以 `import` 同 repo 的任何其他 `@deepseek-ai/dsh-*` package（比如 `@deepseek-ai/dsh-tools`、
  `@deepseek-ai/dsh-session`），pnpm 自动从 workspace 解析
- **构建**：你的 package 被 `tsc -b tsconfig.host.json` 收录（只要你把 `tsconfig.json` 加到 `references`）
- **测试**：你的 `tests/` 被 vitest 的 `projects` 通配符覆盖，`pnpm run test -- --run` 可以单跑
- **发布**：package 的 `npm publish` 由仓库 CI 管理，你不需要管

### 1.3 这个结构对应的闭环长什么样

```
1. 核对现场  → 读 cookbook/adding-a-tool.md, 读一个已有 tool 源码做模板
2. 判窄 diff  → 6 个新文件 + 1 行 tsconfig.host.json
                Δ = 纯增量，zero 改动到已有 package
3. 原子修改   → 写 src/index.ts（defineTool schema/execute/render/presenter）
                写 tests/  （1～2 个 spec 文件）
                写 README.md（package contract + Model Experience）
4. 最小证据   → pnpm run test -- --run packages/decision-log/tool-decision-log/
                pnpm run typecheck
                pnpm run doc-sync
5. 沉淀       → 加一条 Agent Note（架构决策才记）
6. 报告       → PR 描述列 3 个检查结果
```

**关键**：第 4 步能跑 `pnpm run test -- --run <pkg>` 是因为仓库级 vitest 配置已经就绪。
第 2 步能判"纯增量不动已有"是因为 workspace 结构保证了包间边界清晰。

### 1.4 这个结构的"轻松"是从哪来的

| 轻松来源 | 在模式 A 里的体现 |
|---|---|
| 记忆外包 | 不用记 `tsconfig` 怎么写——复制已有 package 的改一下；不用记 import 路径——workspace 解析自动找到 `@deepseek-ai/dsh-tools` |
| 反馈秒级 | `pnpm run test -- --run` 只跑你的文件，不跑全量 |
| 犯错代价低 | 整 PR 回滚只影响你的新 package，不影响任何已有的东西 |

---

## 2. 模式 B：外部独立开发

### 2.1 你在哪写

你可以完全在 DSH 仓库之外开一个项目：

```
~/projects/
  dsh-plugin-my-tools/
    package.json          # 依赖 @deepseek-ai/dsh-tools, 但不必是 workspace 成员
    tsconfig.json         # 你自己维护
    src/
      index.ts            # plugin: name/inject/Config/apply
      decision-log.ts     # defineTool 的实现
    tests/
      decision-log.spec.ts
    dist/                 # tsc 产出
```

### 2.2 怎么加载到 DSH

通过 cordis.yml 的 `--plugin` 参数或 profile 配置：

```bash
dsh --plugin ./dsh-plugin-my-tools/dist/index.js "记一个决策"
```

或者把 `dsh-plugin-my-tools` 发成 npm 包，然后在 profile 的 `cordis.patch.yml` 里引用：

```yaml
plugins/my-tools: npm:@scope/dsh-plugin-my-tools
```

### 2.3 这个结构对应的"闭环"长什么样

```
1. 核对现场  → 读 cookbook/adding-a-tool.md
2. 判 diff   → 你只需要决定：一个 plugin（src/） + 测试（tests/）+ package.json
3. 写 owner  → 写 defineTool（和模式 A 完全一样的 execute/render/presenter 契约）
               唯一区别：import from node_modules 而非 workspace
4. 验证      → 你依赖自有测试框架
               你不再有 pnpm run typecheck 覆盖整个仓库的引用完整性
               你不再有 pnpm run doc-sync
               你不再有仓库门禁（pre-commit/pre-push）
5. 沉淀      → 没有 Agent Note 制度，你自选记录方式
6. 报告      → 随你的项目流程
```

### 2.4 这个结构的代价

**第 4 步"最小证据"不再是理所当然的**。因为：

- 你失去了 `pnpm run test -- --run <pkg>` 的单跑能力（除非自己搭 vitest）
- 你失去了 `typecheck` 对跨 package 引用完整性的验证
- 你失去了 `doc-sync` 对 README 格式的强制
- 你失去了 pre-commit 的 whitespace/lint/vendor guard 自动安全检查

**第 5 步"沉淀"也不再是制度性强制**——没有 Note 门禁，你不会被提醒要记架构决策。
但你写的 `defineTool` 契约（execute/render/presenter 的规则）仍然是必须遵守的；
违反 purity hard rule 会破坏 UI 重放，违反 output.schema 契约会让 Code Mode 调用者困惑。

**所以"窄证据切片闭环"在模式 B 里仍然是一个好的习惯，但不再是"最省力路径"**——因为制度不再替你记着门禁，
你需要自己记。这就是模式 A 和模式 B 最本质的区别。

### 2.5 什么时候选模式 B

| 你应该选模式 B 当... | 你不该选模式 B 当... |
|---|---|
| 你只是想消费 DSH，不想了解仓库结构 | 你的工具需要深度使用 DSH 内部 API（如 session event、agent lifecycle hook） |
| 你的工具是私有的，不打算开源 | 你希望享受 DSH 的 CI 覆盖和发布管道 |
| 你的交付物是一个独立的 npm 包 | 你想让工具成为 DSH 发行版的一部分 |
| 你有自己的测试和 CI 基础设施 | 你希望"只写本质其余免费"的体验最大化 |

---

## 3. 两种模式都用到的同一个核心：`defineTool` 契约

无论模式 A 还是模式 B，你写的 `defineTool` **完全一样**：

```typescript
import { defineTool } from '@deepseek-ai/dsh-tools'

ctx.tools.register(defineTool({
  name: 'log_decision',
  description: 'Record a key decision made during conversation.',
  parameters: {
    key: { type: 'string', required: true, description: 'Stable kebab-case key.' },
    title: { type: 'string', required: true, description: 'One-line summary.' },
    status: { type: 'string', enum: ['proposed', 'accepted', 'rejected', 'deferred'] },
  },
  output: {
    schema: { type: 'object', properties: { key: { type: 'string' }, saved: { type: 'boolean' } } },
    render: (args, value) => [{ type: 'text', text: `${value.key} saved=${value.saved}` }],
  },
  async execute(args, exec) { /* ... */ },
  presentCall: (args) => ({ card: 'generic', title: `log_decision: ${args.key}` }),
  presentResult: (args, result) => ({ card: 'generic' }),
}))
```

- `@deepseek-ai/dsh-tools` 在模式 A 中是 workspace 依赖，在模式 B 中是 npm 依赖
- typescript 类型推导在两个模式下都工作
- `execute` 规则（args 验证、signal、isError）在两个模式下都一样
- `presentCall`/`presentResult` 的纯函数约束在两个模式下都一样

**这就是"声明本质，其余派生"的物理含义**：无论你在哪写，你只写 `defineTool({...})` 这一个声明，
schema → system prompt 自动派生、args 类型自动派生、Code Mode 自动派生、UI card 从 render intent 自动派生。
这部分"免费"和你的项目结构无关。

---

## 4. 混合路径（模式 A 开发 + 模式 B 交付）

实践中还有一种混合玩法：在仓库内开发（享受门禁/CI/test runner），但把产物发布为独立 npm 包。

DSH 的 package 结构天然支持这个：你的 `packages/decision-log/tool-decision-log/` 本身就是一个标准的 npm 包
（`private: false`, 有 `main`/`types`/`exports`），可以被其他项目 `npm install`。

所以你可以：

1. 在仓库内开 PR 加 package（模式 A 的全部好处）
2. PR merge 后 CI 自动发布 `@deepseek-ai/dsh-tool-decision-log` 到 npm
3. 外部项目 `npm install @deepseek-ai/dsh-tool-decision-log` 后通过 `--plugin` 加载

**这是 DSH 生态的推荐路径**：开发时享受制度对齐的"轻松"，交付时不影响外部消费者。

---

## 5. 视觉化：两种模式在 repo 结构中的位置

```
┌─────────────────────────────────────────────────────────┐
│ DSH 仓库根                                              │
│                                                         │
│  packages/                          ← 模式 A 的工作区    │
│    core/tools/                                          │
│    shell/tool-bash/                                     │
│    skill/tool-skill/                                    │
│    decision-log/tool-decision-log/  ← 你的新 package    │
│      src/index.ts                                        │
│      tests/                                              │
│      README.md                                           │
│      package.json                                        │
│                                                         │
│  tsconfig.host.json  ← 注册 +1 行 reference              │
│  lefthook.yml       ← 自动覆盖你的新文件                  │
│  vitest.config.ts   ← 自动发现你的 tests/                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ~/projects/dsh-plugin-my-tools/    ← 模式 B 的工作区     │
│   src/index.ts                                           │
│   tests/                                                 │
│   package.json                                            │
│   tsconfig.json                                          │
│                                                         │
│   # 通过以下命令加载到 DSH：                                │
│   dsh --plugin ./dist/index.js                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 6. 所以 developer-journey.md 默认的是哪个？

它默认的是**模式 A**（仓库内开发），理由从它的措辞就能读出来：

- `packages/decision-log/tool-decision-log/` —— 这显然是仓库内路径
- `tsconfig.host.json` 加一行 reference —— 这是 DSH 仓库特有的注册步骤
- `pnpm run test -- --run ...` —— 这是仓库级 test runner 的命令
- `pre-commit` / `pre-push` hooks 自动生效 —— 这是 lefthook.yml 的功能

**它没有说清楚的是：这个选择本身是需要解释的。** 读完的人应该知道"原来我可以在仓库外写，但那样就享受不到一半的轻松机制了"。

现在补上了。

---

## 附录：关键引用对照

| 结构问题 | 权威来源 |
|---|---|
| 新 package 的目录布局规范 | [cookbook/adding-a-package.md](../../docs/cookbook/adding-a-package.md) |
| tool 的 execute/present 契约 | [cookbook/adding-a-tool.md](../../docs/cookbook/adding-a-tool.md) |
| 如何加载外部 plugin | `dsh --plugin <path>`（`apps/cli/src/bin.ts` 的 `--plugin` 解析） |
| workspace 依赖解析 | pnpm 自动：`@deepseek-ai/dsh-tools` 如果不在 workspace 则 fallback 到 npm |
| 外部 plugin 的 cordis.yml 写法 | [cordis-primer.md](../../docs/cordis-primer.md) |