# 开发旅程 · 按 DSH 原生思维做一个插件（实例推演）

> 本文是 [窄证据切片闭环](./answer.md) 的**实例化**：选一个具体的小插件，模拟开发者（人或 agent）沿着六步闭环从头走到尾，
> 每一步看到什么、做什么、验证什么。途中会反复撞见"轻松"的三个机制来源。
>
> 场景设定：你接到了一个需求——"在 DSH 对话里加一个 `log_decision` 工具，让 agent 能在讨论中随时记录关键决策，
> 并且在 UI 上能看到一个决策日志卡片"。

---

## 1. 需求拆解：先清"我要做什么"

需求原文："在对话里记决策，UI 上能看到日志。"

转译成 DSH 的术语（这一步本身就是窄证据切片的第一步——**核对现场/术语映射**）：

| 需求短语 | DSH 等效 |
|---|---|
| "在对话里" | 一个 tool（模型可见、对话中调用） |
| "记决策" | `defineTool` + 持久化到 session 事件 |
| "UI 上能看到" | `presentCall` / `presentResult` 声明 card kind |
| "日志卡片" | `generic` card + `locations`（指向源文件） |

还不需要写代码。这一步只是把需求投射到仓库已有的概念上。所有术语都在 [docs/glossary.md](../../docs/glossary.md) 和
[cookbook/adding-a-tool.md](../../docs/cookbook/adding-a-tool.md) 里有一个家。

**节省的意志力**：不需要自己发明架构——capability seam（Service Definition / Provider / Consumer）模式是强制的，
tool 必须走 `defineTool`，UI card 必须走 `presentCall`/`presentResult` + 纯函数约束。
正确路径已经被制度画好了。

---

## 2. 第 1 步：核对现场——先读，不猜

开发者（以下用"你"）要做的是：**不信任记忆，先读权威来源**。

你打开：

1. **[cookbook/adding-a-tool.md](../../docs/cookbook/adding-a-tool.md)** —— 94 行的参考。你发现全部"免费"的东西：
   - args 自动类型化 + 验证
   - schema 自动流入 system prompt
   - effect 式注册，dispose 即注销
   - Code Mode 免费可达
   - UI card 从 render intent 派生
   - **但你仍然要手写**：`execute` 体内非空串校验、`signal` 取消、`isError` 语义、纯函数 presenter 的 purity hard rule

2. **[docs/development.md](../../docs/development.md)** —— 确认新 package 的 tsconfig 注册流程。你发现
   packages 分 Host/Client 两个 aggregate，一个普通 tool plugin 属于 Host，只需要加一行 `references` 到 `tsconfig.host.json`。

3. **一个真实的最小 plugin 做模板** —— 你 `cat packages/goal/tool-goal/src/index.ts` 看了下结构。大概 100 行，
   和你想要的东西规模相当。

**你做了一件事，但没写任何代码**：把需要读的源头读完了。这不是浪费时间——后面每步的判断都基于这里的权威信息，
而不是猜测。**这是"核对现场"：任何叙述——自己的记忆、别人的说法、上一轮的产出——都不是权威。**

---

## 3. 第 2 步：判定窄 diff——真正要动的文件

你要加的是一个**单 package 单 plugin**。照 [cookbook/adding-a-package.md](../../docs/cookbook/adding-a-package.md)
的 checklist，新 package 需要：

```
packages/decision-log/tool-decision-log/
  package.json        # copy from tools, adjust name/deps
  tsconfig.json       # extends tsconfig.base.json, ref cordis + schemastery + dsh-tools + dsh-session
  src/index.ts        # plugin: name/inject/Config/apply, defineTool
  README.md           # package contract + Model Experience
  tests/              # test file + integration
```

此外，根配置需要改一行：

- `tsconfig.host.json`：加一行 `{ "path": "./packages/decision-log/tool-decision-log" }` 到 `references`

没了。**这就是你的 diff**：约 6 个新文件 + 1 行根配置。

**判定窄 diff 的含义**：你不去动 AGENTS.md、不改 CI 配置、不改任何已有 package 的代码、
不碰 docs/architecture.md。这个变更的 owner 面就是**新 package 自身**。它的影响面是：

- 模型可见：多了一个 `log_decision` tool
- UI 可见：多了一种 tool card（generic + locations）
- 仓库可见：多了 1 个 package + 1 个 tsconfig reference

其他一切不变。这就叫**窄**。

---

## 4. 第 3 步：原子修改 owner 面——写源头，不编派生物

你开始在 `src/index.ts` 里写工具的"不可派生本质"。以下是关键决策点，每一步都对应 [adding-a-tool.md](../../docs/cookbook/adding-a-tool.md) 的某条规则：

### 4.1 定义 schema（参数的不可派生本质）

```typescript
parameters: {
  key: { type: 'string', required: true, description: 'Stable key for this decision, kebab-case.' },
  title: { type: 'string', required: true, description: 'One-line summary of the decision.' },
  rationale: { type: 'string', description: 'Why this decision was made. Optional on first call, appendable later.' },
  status: { type: 'string', enum: ['proposed', 'accepted', 'rejected', 'deferred'], description: 'Current status (default: proposed).' },
  tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags for grouping/filtering.' },
}
```

这里你**手检**了几个 DSL 无法表达的约束（adding-a-tool.md:42）：`key` 必须非空、kebab-case 格式在 `execute`
里用 regex 验证；`title` 必须非空。DSL 能做的（type、required、enum）自动由 harness 在 execute 前验证。

### 4.2 定义 output schema + render（返回值与 UI 的不可派生本质）

```typescript
output: {
  schema: {
    type: 'object',
    properties: {
      key: { type: 'string', required: true },
      saved: { type: 'boolean', required: true },
      totalDecisions: { type: 'integer', required: true },
    },
  },
  render: (_args, value) => [{
    type: 'text',
    text: `Decision "${value.key}" ${value.saved ? 'saved' : 'updated'} (${value.totalDecisions} total).`,
  }],
}
```

### 4.3 声明 UI card（presentation 的不可派生本质）

```typescript
presentCall(args): ToolCallView {
  return {
    card: 'generic',
    title: `log_decision: ${args.key}`,
    kind: 'search',    // icon hint: a log entry
    locations: args.sourceFile ? [{ path: args.sourceFile }] : undefined,
  }
}
presentResult(args, { content, isError, meta? }): ToolResultView {
  return { card: 'generic', content: meta?.summary ?? 'Decision logged.' }
}
```

**纯函数规则**（adding-a-tool.md:86）：你不在 presenter 里读文件、不读 session state、不用 `Date.now()`。
presenter 只从 `args` 和 `result` 派生。UI 适配器负责加时间戳上下文。

### 4.4 持久化与 execute 体

你决定把决策记录为 session event（`session.append('decision-log/entry', { ... })`），这样：
- 日志可重放（model-visible ⟺ logged）
- UI 从 session projection 读取
- 不需要额外数据库

```typescript
async execute(args, exec) {
  // 手检 DSL 无法表达的规则
  if (!/^[a-z][a-z0-9-]*$/.test(args.key)) throw new Error('key must be kebab-case')
  if (args.title.trim().length === 0) throw new Error('title must be non-empty')

  // effect 式持久化
  const entry = { key: args.key, title: args.title, ... }
  exec.agent.session.append('decision-log/entry', entry)

  return { key: args.key, saved: true, totalDecisions: count }
}
```

### 4.5 注册效果

```typescript
export const name = 'tool-decision-log'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({ /* 上面的全部 */ }))
}
```

**没有手动维护的生成物**：不需要手写 system prompt 片段（schema 自动流入）、不需要手写 type 声明（从 schema 推导）、
不需要维护 catalog 条目（生成目录自动收录）。你做且只做了**无法被派生的那部分**。

---

## 5. 第 4 步：最小匹配证据——跑"会为这次回归而失败"的检查

工具写完了（# 4 步是迭代的——写一段、验证一段，但这里为了叙事方便合在一起说）。现在验证。

**关键原则**（pre-push-checks SKILL.md:29）：没有 universal local baseline，只跑**会为这次回归而失败**的最小检查。

### 回归定义

这个变更的可能回归是什么？

| 回归 | 会被什么抓到 |
|---|---|
| tool schema 解析不对（`execute` 收不到正确 args） | owning test: `execute` 用合法和非法 args 各调一次 |
| UI presenter 渲染挂掉（纯函数抛异常） | snapshot: mock call args 渲染出期望卡片 |
| package 没注册好（`ctx.tools.register` 失败） | `typecheck`（引用类型不匹配）+ `build` + smoke |
| session event 读写契约 | 最小：一个单元测试写一条 event 再读回来 |
| i18n 配对缺失 | 不需要——这个 plugin 还没有 `.zh.md` |

### 实际跑的检查

```bash
# 1. 写 owning test
# 在 tests/tool-decision-log.spec.ts 里：
#   - 用合法 args 调 execute → 断言返回 { key, saved, totalDecisions }
#   - 用非法 args（空 key）→ 断言抛 Error
#   - 用 mock args 调 presentCall → 断言 card kind = 'generic', title 含 key
pnpm run test -- --run tests/tool-decision-log.spec.ts
# 约 8 秒。通过。

# 2. typecheck（pre-push hook 会跑的，但你在本地先验证一次以防 hook 拦）
pnpm run typecheck
# 约 30 秒（因为 host build）。通过。

# 3. doc-sync（因为你加了新 package README）
pnpm run doc-sync
# 约 5 秒。通过。
```

**你实际跑了 3 个检查，花了不到 1 分钟**。没有跑 `pnpm run test`（全量 5 分钟+）、没有跑 `pnpm run lint`（不涉及 lint 规则变更）、
没有跑 `pnpm run build`（typecheck 已经够验证引用完整性）。你只跑了**会为这次回归而失败的那 3 个检查**。

**hooks 也在帮你**：
- `pre-commit` 自己跑了 oxlint fix + whitespace + vendor manifest（自动完成，你不需要记）
- `pre-push` 跑了 `pnpm run typecheck`（但你已经跑过了，只是会被重跑一次——不亏）

这就是"反馈延迟被刻意压到最小"（第三节）：一次典型迭代 = 改 2 个文件 → 跑 owning test 8 秒 → 出结果。
改了再跑，成本低到愿意跑。**迭代成本低，人才会真的守规矩。**

---

## 6. 第 5 步：沉淀——加一条 Note

你发现了一个值得记录的点：`log_decision` 的 `status` 字段用了 `enum`，但 DSL 不保证 `proposed` 是默认值。
你在 `execute` 里补了 `?? 'proposed'`，并且觉得这个"默认值由 execute 保证而不是 schema 保证"的模式
值得记一条 Agent Note。

你在 `.agents/notes/implemented/process/` 下加了一条：

```markdown
# 2026-09-01-decision-log-default-status-in-execute.md

## Decision

`log_decision`'s `status` parameter omits the default in the schema and applies `?? 'proposed'`
in `execute` instead. Rationale: enum defaults serialise into system-prompt assembly as visible
values, which would waste tokens telling the model something it can infer; the execute body is
the correct single source of truth for the runtime default.

## Alternatives considered

- Schema-level `default: 'proposed'` → wastes ~30 tokens per turn in system prompt for a value
  the model almost never needs to override. Rejected.
```

**为什么只记这一条？** 不需要把所有的东西都记 Note（accretion 是敌人）。架构决策才记——"为什么默认值放 execute 而不是 schema"
是可能被挑战的判断。其他一切（怎么注册 tool、怎么声明 card）已经是 cookbook 和代码自身的契约了。

**不做什么**：你没有去改 `AGENTS.md`、没有加 gate 脚本、没有修改 CI 配置。这个 change 还太小，不值得
增加每 PR 合规成本。

---

## 7. 第 6 步：只报告实际跑过的

现在去开 PR。你的 PR 描述是：

```
## tool-decision-log: record key decisions during conversation

New plugin: `log_decision` tool + generic UI card + session-event persistence.

### Changes
- packages/decision-log/tool-decision-log/ （new, 6 files）
- tsconfig.host.json （+1 reference）

### Checks run
- `pnpm run test -- --run packages/decision-log/tool-decision-log/tests/` ✅
- `pnpm run typecheck` ✅
- `pnpm run doc-sync` ✅
- Agent Note: `2026-09-01-decision-log-default-status-in-execute.md`

Pending: CI will run coverage gate + platform matrix.
```

**只报告实际跑过的**：没有声称跑过 `test:coverage`（CI 的事）、没有声称跑过 `pnpm run build`（typecheck 已经够）、
没有声称"fully tested"（那是对模糊性的作弊）。

---

## 8. 两个回路：开发者 vs agent 的分工

上面 2-7 节的描述看起来是一个人在终端干活。但真实情况更可能是：

**人类指挥者回路**（外层）：

1. 你说："给对话加一个决策记录工具，能记决策，UI 能看到日志。"
2. agent（你）**把这个需求切成窄片**：先识别这是一个"加一个 tool plugin"而不是"改三个 package"。
3. 你告诉 agent："按 adding-a-tool.md 做，只改新 package，不改已有的。"
4. agent 走 2-7 步的**六步执行闭环**。
5. 你**只审"会为这次回归而失败"的最小证据**：owning test 过得去吗？UI card snapshot 对吗？Note 合理吗？
6. 通过 → merge。不通过 → 整 PR 回滚，重新切更窄的片。

**agent 执行者回路**（内圈）：

1. 核对现场（读 cookbook、读模板）
2. 判定窄 diff（新 package + 1 行 config）
3. 原子修改 owner 面（写 schema、execute、render、presenter）
4. 最小匹配证据（owning test + typecheck + doc-sync）
5. 沉淀（写 Note，只记架构决策）
6. 只报告实际跑过的（PR 描述列检查清单）

**"轻松"在这里分两个主语**：
- 对 agent：默认路径就是正确路径——读 cookbook → 写 `defineTool` → 跑 owning test → 结束。
  制度把每一步的备选路径都堵死了（你不写 effect 式注册就跑不了、你不声明 card kind 就没有 UI），
  所以乖乖走默认路径就是最省力的。
- 对人：你**不需要记语法**（schema 怎么写？看 cookbook）、**不需要记门禁**（pre-commit 替你跑了 lint）、
  **不需要猜架构**（capability seam 已经定好了）。你只需要切一个清晰的片、把意图说清、审最小证据。
  **犯错了可以整 PR 回滚**——不需要在堆叠的 patch 里做外科手术。

---

## 9. 回头看"轻松"的三个来源

| 机制 | 在这个例子里长什么样 |
|---|---|
| **记忆外包**（规则在门禁里，不在脑子里） | 你不会忘记 `presentResult` 的 purity hard rule——如果违反了，UI 重放会诡异出错，而你读 cookbook 时已经见过那条规则。门禁（pre-commit）替你记了 whitespace 和 vendor manifest。typecheck 替你记了 import 是不是对的。 |
| **反馈延迟最小**（秒级本地验证） | 改 2 个文件 → 跑 owning test 8 秒。不需要等 5 分钟的全量测试才知道 schema 写没写对。 |
| **犯错代价低**（整 PR 回滚） | 如果 merge 后发现 `log_decision` 的 schema 设计有问题（比如 `status` enum 漏了一个值），一个 revert commit 就完全撤销整个切片。不需要发 hotfix、不需要在 revert 的同时保留别的功能。 |

这三个合流的效果：**正确路径 = 最省力路径**。你不需要意志力来"遵守规矩"——规矩已经被结构内化了。

---

## 10. 诚实的边界

这个旅程美化了一些东西。以下是它隐去的摩擦：

1. **冷缓存的首轮 typecheck**：第一次 `pnpm run typecheck` 在 40+ package workspace 上约 30 秒，
   不是"秒级"。但后续增量 typecheck 很快，而且大部分开发在增量上。

2. **Note 的篇幅税**：你只写了一小段 Note。但如果这是一个更大的变更（比如改了 capabilty seam），
   Note 三件套（.md + reasoning 过程 + 验收条件）可能比代码本身还长。88% PR 含 Note，
   意味着大多数变更要付这个税。

3. **纯函数 presenter 的约束是硬的**：你不能在 presenter 里读文件系统来获取"当前文件内容"来生成 diff。
   正确的做法是把 diff 信息放在 `presentationMeta` 里持久化。这个约束是对的，但初次接触时会觉得反直觉。

4. **"窄证据"是 median，不是 guarantee**：横切变更（比如改整个 capabilty seam）需要跑更多检查。
   pre-push-checks SKILL.md:62-64 有专门的 Full local rehearsal 路径。

5. **这个 plugin 的"decision"持久化用了 session event**，但 session event 不是数据库。
   如果后面需要跨 session 查询"所有 accepted 的决策"，需要换持久化方案。没有"免费"地获得查询能力。

---

## 11. 对应的关键引用（方便交叉查阅）

| 旅程中的动作 | 哪个检查/制度在约束/驱动它 |
|---|---|
| 先读 cookbook 再写代码 | 核心认识论：**任何叙述不是权威，外部可验证状态才是**（继承自 FAQ 10 goal 轮提示词 == trim-cot-leakage HEAD 测试） |
| 只加新 package，不改已有的 | 窄 diff 原则：`change-scope NEVER guesses or fetches a base`（pre-push-checks SKILL.md:25） |
| output schema 设计成可编程 API | `output.schema` is a useful programmatic API（adding-a-tool.md:65） |
| presenter 是纯函数 | `Purity — these run on live streaming AND on session-log REPLAY`（adding-a-tool.md:86） |
| 只跑 owning test + typecheck + doc-sync | `Never default to the full suite`（AGENTS.md） |
| 只记一条 Note，不记全部 | accretion 是敌人（AGENTS.md / dsh-archive-agent-notes） |
| PR 描述列检查清单 | `report only commands run`（AGENTS.md） |
| 错了整 PR 回滚 | git 历史证据（#2903 67-file mirror revert #2608） |
| schema 默认放 execute 不放 schema | 契约设计原则：`Explicit > implicit at package boundaries`（AGENTS.md），且 token 经济：模型可见即成本 |

---

## 12. 总结：DSH 原生思维 = 从"做什么"到"做完了"的默认路径

```
需求 → 核对(读 cookbook/模板) → 判窄(新 package，不动已有的)
       → 写 owner(defineTool schema/execute/render/presenter)
       → 最小证据(owning test + typecheck + doc-sync)
       → 沉淀(一条 Note: status 默认放 execute)
       → 报告(PR 描述列 3 个检查) → merge
```

全程没有：
- 没有先写大篇幅 spec 文档再实现
- 没有全量验证仪式
- 没有兼容 shim
- 没有手工维护的生成目录

全程有的：
- 每次迭代不到 1 分钟验证
- 错误可以整切片回滚
- 写的人只需要声明不可派生的本质
- 规则由门禁和 cookbook 记住，不在脑子里

这就是 DSH 最自然的开发习惯——**窄证据切片闭环**——在"做一个有 UI 卡的对话工具"这个具体需求上的全貌。
"轻松"不是因为没有约束，而是因为约束被设计成了默认路径。