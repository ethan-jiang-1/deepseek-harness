# 渐进披露的完整管线：静态分层 + 运行时按需注入、组装、回收

> **术 · 披露管线。** 渐进披露不是「把文档写短」，是贯穿五层的管线。上下文吃紧（每轮爆炸、长任务活不下来）时来这页抄作业；静态层的组织（tier、骨架）由 [`归属`](./02-legibility-ownership.md) 与 [`入口链`](./07-agents-entry-chain.md) 拥有，本页拥有注入、组装、回收、隔离四层——每层都是 DSH 产品的真实机制，逐层配原话与文件。

## 「写短」只解决供给，「按需分配」是运行时的事

把文档写短只保证了仓库里有分层的好文档。但**分配**是运行时的事：这一轮注入哪些、模型看到什么、超预算了怎么回收、子代理能看什么——没有运行时机制，短文档照样会被全量塞进上下文，或长任务在上下文爆炸里死掉。DSH 把「按需」从写作纪律升级成了五层机器保证，每层管一段：

| 层 | 回答的问题 | DSH 机制 | 可迁移性 |
|---|---|---|---|
| 1 静态组织 | 每种知识住哪、多大、什么时候读 | tier taxonomy、字数预算、AGENTS.md 骨架、catalog | 高（归归属/入口链） |
| 2 按需注入 | 这一轮该把哪些文件/会话注入上下文 | context 插件：agent-instructions、file-reference(+local)、session-reference、time/tmux | 中高 |
| 3 运行时组装 | 这一轮模型实际看到什么（sections/context/tools） | system-prompt assembly、skill catalog 只给摘要、`ctx.tools.restrict` | 中 |
| 4 溢出回收 | 上下文超预算了怎么办 | token meter + compaction + tool-result pruning | 中 |
| 5 隔离边界 | 谁能看到什么 | subagent spawn 不带父历史、fork 只带 seed | 高 |

它们共同回答一个写作纪律答不了的问题：**「按需」的「需」由谁、在什么时刻、以什么预算决定。**

## 层 2 · 按需注入：context 插件

`packages/context/` 下的插件负责「把特定上下文注入模型可见面」，全部有界；除 `agent-instructions` 随默认 bundle 带上（可禁用）外，其余 opt-in：

- **`agent-instructions`**：把 `AGENTS.md`/`CLAUDE.md` 链注入历史。关键是它的加载是 **touch-driven** 的——首次注入 baseline，之后只在成功的 `read`/`write`/`edit` 触达更深目录时才注入 nested 指令；`maxBytes` 限制整条链、`maxSourceBytes` 限制单文件；同目录里 `CLAUDE.md` 与 `AGENTS.md` 内容相同就**只渲染一次**；digest 未变化的文件**不重复注入**。

  > **DSH 原话 ·** 预算与丢弃顺序（[`packages/context/agent-instructions/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/context/agent-instructions/README.md)）
  >
  > Rendering keeps the most specific files first: it drops whole broader files before truncating the most-specific file, and emits a visible `Workspace instruction budget ...` notice naming the omitted and truncated paths. The rendered bytes never exceed `maxBytes`.

  这一条就是入口链「会话态」在运行时的真实实现：文件层面「合适个数」，运行时层面「触达才加载 + 有预算 + 去重」。

- **`file-reference` / `file-reference-local`**：`@file` mention 的发现与共享文法（`ctx.fileReferences`）+ 本地工作区的补全 provider——用户在输入里 `@` 一个文件，它的路径进入上下文，而不是整个文件被静默塞入。
- **`session-reference`**：引用其它会话（`ctx.sessionReferenceResolver`）——mention 一个会话，它的**有界只读快照**成为上下文，不是整段搬运；快照语义与错误分类有专门的[子系统文档](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/session-reference.md)。
- **`time-context`**：当前时间、浏览器时区、每步耗时；**`tmux-context`**：agent 所在的 tmux 会话/窗口/面板位置——「便宜但有用」的事实，每轮注入的成本极低。

  为什么这些都能注入而不失控——[packages/context/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/context/README.md) 说得清楚：

  > **DSH 原话 ·** 注入的持久性与边界（`packages/context/README.md`）
  >
  > Context is durable: injected instructions and references enter session history as user-role messages, so they persist, replay, and compact like other conversation content.

  注入的内容以 user-role 消息进会话历史——**它们和普通对话一样可回放、可压缩**，不享受特权通道（这正是 [`静与动`](./04-static-vs-dynamic.md) 的「模型可见 ⟺ 落日志」在注入层的落实）。

共同点：**注入是有选择、有预算、有去重的，不是把仓库全塞进上下文。**

## 层 3 · 运行时组装：模型每轮看到的「可见面」

`system-prompt` 包把「模型实际看到什么」变成一个每次请求都重新组装的产物：

- `PromptSection`：有序拼接的静态/按需文本段，`complete` 段可以独占整个 prompt。
- `PromptContext`：动态上下文，是 `PromptSection` 的 **cache-safe** 对应物——**只在它变化或被 compaction 移除时才重新 log 完整快照**（KV-cache 友好）。
- `ctx.systemPrompt.tools(provider)`：每次 assembly 决定**本次可见的 tool schema 集**（`ToolProviderResult.schemas`）。
- `suppressRuntimeContext()`：一键抑制所有动态 runtime context。

skill 与 tool 的「摘要 vs 正文」也在这层：

- **skill catalog 只给摘要**：`SkillCatalogSnapshot` 只含 sorted `name` + normalized `description`（默认 ≤500 字符），省略 bodies/paths/sources/providers/routing hints；`get()` 每次调用都向 provider 取完整 body，不缓存。

  > **DSH 原话 ·** catalog 只给摘要（[`docs/subsystems/skills.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/skills.md)）
  >
  > The catalog contains sorted skill `name` and normalized, XML-escaped `description` only; it omits bodies, paths, sources, providers, and routing hints. … loads full skill bodies on demand.

- **tool 可见集按 scope 收缩**：`ctx.tools.restrict()` 让模型只看到当前 scope 相关的工具。

  > **DSH 原话 ·** 工具可见集按 scope 收缩（[`docs/cookbook/extension-cookbook.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/cookbook/extension-cookbook.md)）
  >
  > ToolSearch / progressive disclosure — replace a scoped `ctx.tools.restrict()` registration as the visible set changes.

这层的意义是：**「披露多少」不是写文档时定死的，而是每次请求按 scope、按需、且只在变化时重新计算的。**

## 层 4 · 溢出回收：compaction

渐进披露的另一半是「回收」——已经披露过的内容，超预算了怎么办。DSH 用 `ctx.tokenMeter` 度量，在 `agent/pre-step` 遇到压力或溢出时触发 compaction：

- 先跑 `ctx.toolResultPruner`（对 tool 结果做确定性的 head/middle/tail 裁剪）；
- remeasure 后，若仍需压缩，把选定范围替换为一个 summary；
- **region 边界保留 tool-call/result 配对**（不拆散一个工具的调用与结果）。

  > **DSH 原话 ·** 压力压缩与配对保留（[`docs/subsystems/compaction.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/compaction.md)）
  >
  > Pressure compaction runs at the `agent/pre-step` waterfall before request derivation. … Region boundaries preserve tool-call/result pairing but not whole turns.

这层的意义：**披露不是单向的。** 上下文有预算，超了会被压缩/替换，而不是无限增长或直接报错死掉。

## 层 5 · 隔离边界：subagent

披露还有「谁能看到什么」的边界。DSH 的 subagent 默认**不继承**父对话。DSH 原话：

> **DSH 原话 ·** spawn 不带父历史（[`packages/subagent/subagent-in-process-driver/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/subagent/subagent-in-process-driver/README.md)）
>
> The shared driver sends the task verbatim as the child's user message … Spawn supplies no history; fork supplies its balanced seed.

普通 `spawn` 派生的子代理不带父历史，`fork` 只继承一个平衡过的 seed。这是「乱发挥」的另一道闸：子代理不会被父上下文的全部细节带偏。

**两个必须收窄的读法**（学走形的常见处）：可见工具集影响的是**模型的选择空间**——它让模型不容易顺手选错工具，但不是最终授权，授权由 sandbox 与 approval 机制独立承担；同理，不继承父历史收窄的是**被带偏的输入面**，不是安全沙箱——它不保证子代理接触不到敏感内容，敏感内容的隔离要靠权限层。

## 五层合起来是一条管线，不是五个散点

```text
静态组织（什么该存在、多大、住哪）
  → 按需注入（这一轮把哪些文件/会话拉进上下文，有预算、有去重）
  → 运行时组装（这一轮模型实际看到什么：sections + contexts + tool schemas，变化才重算）
  → 溢出回收（超预算了 prune + summary，保留 tool-call/result 配对）
  → 隔离边界（子代理默认拿不到父上下文）
```

五层各管一段，落到「不糊涂 / 不乱发挥」上的映射是：静态层与注入层决定「该进得来、进不来」（不糊涂），组装层的 tool 可见集收缩与隔离层收窄「模型顺手选错工具、被父上下文带偏」的空间（不乱发挥——注意是收窄选择空间，不是授权边界），回收层决定「超了怎么办」（长任务活下来）。只做其中一层（比如只写短文档，或只做 compaction）都不完整。

## 从哪开始

按压力逐项加，每项独立见效：

1. **上下文爆炸**：给「AGENTS.md 加载器」设 `maxBytes`、去重 `CLAUDE.md`、按 digest 抑制重复——不需要插件架构的等价实现。
2. **流程文档越塞越多**：只给模型 name+description 目录，选中才加载全文（任何 agent host 都能做）。
3. **prompt 每轮全量重算**：改成「有序 sections + 只在变化时重算」——难的是这个 KV-cache 纪律，值得。
4. **长任务死在上下文溢出**：加 compaction 阈值，压缩时绝不拆散一个工具的调用和结果。
5. **子代理被父上下文带偏**：spawn 不带父历史——最便宜的一刀。

scope / waterfall / declaration-merging / `complete` 段独占是 DSH 独有机制，普通项目不必照搬。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「13 · 披露管线」一节）——按需核对，不读不影响理解。
