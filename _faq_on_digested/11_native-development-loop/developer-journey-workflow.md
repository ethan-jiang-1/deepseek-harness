# 智能体工作流插件（Agent Behavior Plugin）

> 这是 DSH 两种插件之一。另一种是传统代码插件（参见 [`developer-journey-plugin.md`](./developer-journey-plugin.md)）。
>
> 本文和传统代码插件的区别：传统代码插件是 **extend DSH 运行时 with TypeScript**（`package.json`、`tsc`、`defineTool`）；
> 智能体工作流插件是 **define agent behavior with 编排或文档**（不需要打包，不需要 `pnpm test`）。
>
> 它们可以组合——传统代码插件暴露 `defineTool`，工作流插件用 `agent()` 调用它——但它们是**不同的插件品种**。

---

## 0. 一句话结论

智能体工作流插件**不是传统的 npm package**，不需要 `package.json`、`tsconfig.json`、`pnpm install`。
你不用 TypeScript 扩展运行时，你用**纯 JS 编排脚本**或**结构化 Markdown 指令**来定义 agent 在特定场景下怎么行事。

DSH 里"一切皆插件"——这类插件的"安装"不是一个 npm install 动作，而是放进 `.agents/` 下对应的目录，
agent 的 session 就会自动发现它。

---

## 1. 这类插件的四种形态

| 形态 | 你写的是 | 存放位置（仓库内） | 加载方式 |
|---|---|---|---|
| **workflow 脚本** | 一段纯 JS + `agent()`/`pipeline()`/`parallel()` 编排 | 任意路径的 `.js`（`script` 参数直接传入；仓库没有自动发现目录） | 通过 `workflow` tool 传进去执行 |
| **skill（技能）** | 结构化 Markdown（描述 + 指令 + 元数据） | `.agents/skills/<name>/SKILL.md` | session catalog 自动发现；`skill` tool 或 `/name` 手势加载 |
| **Agent Note** | 架构决策记录 Markdown | `.agents/notes/<category>/<name>.md` | 后续 PR 查阅（不加载到运行时） |
| **cordis.yml 覆层** | 一段 YAML 配置 | `<custom>.patch.yml` | `dsh --patch` 或 profile 覆层 |

下面逐个展开。

---

## 2. workflow 脚本

### 2.1 你写的是什么

一段纯 JavaScript（不是 TypeScript），用 `workflow` tool 的五个钩子编排子 agent：

```javascript
// audit-deprecations.js
phase('analysis')
const results = await pipeline(args.files,
  async (file) => agent(`Analyze ${file} for deprecated API usage`, {
    label: `analyze-${file}`,
    schema: { type: 'object', properties: { /*...*/ } }
  }),
  async (prev) => agent(`Based on analysis, suggest fix:\n${prev}`, {
    label: `suggest-${file}`,
  })
)
phase('summary')
log(`Analyzed ${results.length} files`)
return { count: results.filter(Boolean).length, details: results }
```

**钩子**（精确来源：`packages/workflow/tool-workflow/src/index.ts:138-150`）：

| 钩子 | 作用 |
|---|---|
| `agent(prompt, opts?)` | 派一个子 agent（一次 LLM 调用）。可指定 `schema`、`label`、`provider`/`model` |
| `pipeline(items, ...stages)` | 批量 item 依次过多个 stage（无 barrier） |
| `parallel(thunks)` | 并发执行一批函数（barrier） |
| `phase(title)` | 标记进度阶段 |
| `log(message)` | 记录进度消息 |
| `args` | 工具调用时传入的参数 |

### 2.2 插件结构

这就是一个 `.js` 文件。你不需要 `package.json`、不需要 `tsconfig.json`、不需要 `pnpm build`。
它由 `workflow` tool 的 provider 在 worker thread 里执行。

| 场景 | 存放位置 |
|---|---|
| 一次性分析 | 不存——在对话中当场写，用完即弃 |
| 重复使用 | 自己选一个稳定路径存 `.js`（仓库不规定目录），或封装成插件/skill 固化 |
| 分发 | 封装为 **skill**（见第 3 节） |

### 2.3 开发闭环

```
1. 需求    → "我要审计一批文件里的 deprecated API"
2. 写脚本  → pipeline(files, ...agent 调用)
3. 验证    → 跑一轮真实模型：
             dsh --profile headless "run the workflow on src/"
             （只跑一次，看输出合理）
4. 迭代    → 调 prompt / 改 pipeline 结构 → 再跑一轮
5. 沉淀    → 如果发现可复用的编排模式，写成 Agent Note 或 skill
6. 报告    → "跑过，输出见附件"
```

**验证特殊性**：`workflow` 脚本的正确性不是"返回对的 JSON"，而是"agent 之间的编排是否产生正确结果"。
所以最小证据就是一次真实模型调用。每次迭代 5-30 秒（根据子 agent 数量）。DSH 对此的政策：

> "A no-key test proves plumbing; only a with-key run proves the agent works against a real model"
> （[docs/testing.md:25](../../docs/testing.md)）

---

## 3. Skill（技能插件）

### 3.1 你写的是什么

一份结构化 Markdown：

```
.agents/skills/<skill-name>/
  SKILL.md       # 主文件（描述 + 完整指令）
  SKILL.zh.md    # 中文版（可选）
```

**最小结构**（来源 `.agents/skills/` 真实 skill）：

```markdown
# <skill-name>

一句话描述（常驻 session catalog 摘要）。

## 完整指令

行为描述。按需包含前置条件、执行步骤、输出格式。

## Metadata（可选）

YAML frontmatter：provider, model, max_turns 等。
```

### 3.2 加载机制（来源：`packages/skill/tool-skill/src/index.ts`）

- **两层披露**：技能名 + 一句话描述常驻 session catalog。全文在 `skill` 工具调用时按需加载
- **用户的 `/name` 手势**：直接注入 skill

Skill 的"安装"就是放进 `.agents/skills/<name>/`。下次 agent 会话开始时，新 skill 自动出现在 catalog 里。

### 3.3 开发闭环

```
1. 需求    → "需要一个审核 PR 的 skill"
2. 写 skill → 描述行为 + 指令细节
3. 验证    → 在对话中 /name 加载 → 让 agent 试用 → 看产出
4. 迭代    → 调 prompt → 再试
5. 沉淀    → 无 Note 必要（除非发现了值得记录的 prompt 设计模式）
```

### 3.4 Skill 和 workflow 脚本的关系

skill 可以**包含** workflow 脚本的模板。例如一个"跨文件重构"skill，在指令里嵌入模板：

```markdown
# cross-file-refactor

跨文件自动重构。

## 多文件处理模板

当涉及 5+ 文件时，生成以下 workflow 脚本：

```javascript
phase('analysis')
const files = args.files
const analyses = await pipeline(files,
  file => agent(`分析 ${file} 的重构机会`),
)
// ...
```
```

这样当 agent 加载这个 skill 后，碰到需要跨文件重构的场景，它会自动按模板生成 workflow 脚本并执行。

---

## 4. Agent Note（决策记录插件）——只是一种制度插件

```markdown
.agents/notes/implemented/process/
  2026-09-01-decision-log-default-status-in-execute.md
```

Note 是制度上的"插件"——它不是加载到运行时，而是沉淀到仓库里，供后续 PR 查阅。
它同样不需要 `package.json`，不需要打包。

---

## 5. cordis.yml 覆层（配置插件）

```yaml
# custom-profile.patch.yml
plugins/my-tool: npm:@scope/dsh-plugin-my-tools
plugins/sandbox-policy:
  config:
    mode: danger-full-access
```

通过 `dsh --patch custom-profile.patch.yml` 加载。这也是一种"用配置而不是代码"的插件。

---

## 6. 两种插件的关系

| | 传统代码插件 | 智能体工作流插件 |
|---|---|---|
| 插件形式 | TypeScript Cordis plugin（`name/inject/apply`） | 脚本 / skill / Note / YAML 覆层 |
| 开发技能 | TypeScript、Cordis API、`defineTool` | 纯 JS 编排、Markdown 写作 |
| 存放位置 | `packages/<group>/<pkg>/` | 任意 `.js` 路径（`script` 参数）/ `.agents/skills/` / `.agents/notes/` |
| 验证方式 | `pnpm run test -- --run <pkg>` | 真实模型调用 |
| 是否需打包 | ✅ TypeScript → JS | ❌ 不需要 |
| 安装方式 | `--plugin` 或 npm 或 workspace 内置 | 放进 `.agents/` 目录 |
| 组合方式 | 暴露 `defineTool` → 工作流脚本用 `agent()` 调用它 | |

---

## 7. 组合实例

```
项目：在 DSH 上加一个代码审计能力

传统代码插件：
  packages/audit/tool-audit-report/
    src/index.ts   → defineTool 暴露 audit_report tool
                     schema: { severity, file, line, message }
                     render + present: 审计结果 UI 卡片
    tests/         → pnpm run test 验证 execute 逻辑

智能体工作流插件：
  .agents/
    workflows/audit-deprecations.js   → pipeline + agent 做跨文件审计
    skills/code-audit/SKILL.md        → 封装"什么场景跑审计、怎么跑"
    notes/implemented/process/
      2026-09-01-audit-skill-default-model.md → 为什么选这个 model

DSH 运行时中：
  model 看到 audit_report tool（来自传统代码插件）
  当需求匹配 → 加载 code-audit skill → skill 告诉 model 生成
    audit-deprecations.js → workflow tool 执行
  结果通过 audit_report tool 输出（UI 卡片展示）
```

两种插件合作完成一个完整的场景。它们**都是插件**，只是品种不同。

---

## 附录：关键引用

| 问题 | 权威来源 |
|---|---|
| workflow tool 的 DSL 契约 | `packages/workflow/tool-workflow/src/index.ts:138-150` |
| skill 的两层披露机制 | `packages/skill/tool-skill/src/index.ts` |
| skill 的目录结构 | `.agents/skills/` 下已有项目可做模板 |
| Agent Note 格式 | [`.agents/notes/README.md`](../../.agents/notes/README.md) |
| 真实模型测试政策 | [docs/testing.md:25](../../docs/testing.md) |
| 传统代码插件的结构和验证 | [`developer-journey-plugin.md`](./developer-journey-plugin.md) |
| 完整实例（传统代码插件六步闭环） | [`developer-journey.md`](./developer-journey.md) |
