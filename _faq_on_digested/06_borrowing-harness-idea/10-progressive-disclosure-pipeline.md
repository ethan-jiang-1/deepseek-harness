# 10 · 渐进式披露的完整管线：静态分层 + 运行时按需注入、组装、回收

## 先纠正一个误解

前面 [`02`](./02-legibility-ownership.md)、[`05`](./05-skills-as-procedural-memory.md)、[`09`](./09-agents-entry-chain.md) 讲的渐进披露，其实只覆盖了**静态/仓库层**——文档怎么分层、AGENTS.md 骨架怎么搭、Skills 怎么按需加载。但 DSH 的渐进披露不是「把文档写短」这一件事，它是一条**贯穿五层的管线**：

| 层 | 回答的问题 | DSH 机制 | 可迁移性 |
|---|---|---|---|
| 1 静态组织 | 每种知识住哪、多大、什么时候读 | tier taxonomy、字数预算、AGENTS.md 骨架、catalog | 高（见 02/05/09） |
| 2 按需注入 | 这一轮该把哪些文件/会话注入上下文 | context 插件：agent-instructions、file-reference、session-reference、time/tmux | 中高 |
| 3 运行时组装 | 这一轮模型实际看到什么（sections/context/tools） | system-prompt assembly、skill catalog 只给摘要、`ctx.tools.restrict` | 中 |
| 4 溢出回收 | 上下文超预算了怎么办 | token meter + compaction + tool-result pruning | 中 |
| 5 隔离边界 | 谁能看到什么 | subagent spawn 不带父历史、fork 只带 seed | 高 |

第 1 层已在前几篇写完，这一篇补第 2–5 层。它们共同回答一个之前没明说的问题：**「按需」的「需」到底由谁、在什么时刻、以什么预算决定。**

## 层 2 · 按需注入：context 插件

`packages/context/` 下的插件负责「把特定上下文注入模型可见面」，全部 opt-in、全部有界：

- **`agent-instructions`**：把 `AGENTS.md`/`CLAUDE.md` 链注入历史。关键是它的加载是 **touch-driven** 的——首次注入 baseline，之后只在成功的 `read`/`write`/`edit` 触达更深目录时才注入 nested 指令；`maxBytes` 限制整条链、`maxSourceBytes` 限制单文件；同目录里 `CLAUDE.md` 与 `AGENTS.md` 内容相同就**只渲染一次**；digest 未变化的文件**不重复注入**。

  > Rendering preserves the most specific instruction files first. It drops whole broader files before truncating the most-specific file and emits a visible budget notice… The rendered bytes never exceed `maxBytes`.

  这一条是「AGENTS.md 骨架」（09）在运行时的真实实现：文件层面「合适个数」，运行时层面「触达才加载 + 有预算 + 去重」。

- **`file-reference`**：`@file` grammar，模型按需引用具体文件。
- **`session-reference`**：其它会话的 bounded snapshot（有界快照，不是整段搬）。
- **`time-context` / `tmux-context`**：当前时间 / 位置这类「便宜但有用」的事实。

共同点：**注入是有选择、有预算、有去重的，不是把仓库全塞进上下文。**

## 层 3 · 运行时组装：模型每轮看到的「可见面」

`system-prompt` 包把「模型实际看到什么」变成一个每次请求都重新组装的产物：

- `PromptSection`：有序拼接的静态/按需文本段，`complete` 段可以独占整个 prompt。
- `PromptContext`：动态上下文，是 `PromptSection` 的 **cache-safe** 对应物——**只在它变化或被 compaction 移除时才重新 log 完整快照**（KV-cache 友好）。
- `ctx.systemPrompt.tools(provider)`：每次 assembly 决定**本次可见的 tool schema 集**（`ToolProviderResult.schemas`）。
- `suppressRuntimeContext()`：一键抑制所有动态 runtime context。

skill 与 tool 的「摘要 vs 正文」也在这层：

- **skill catalog 只给摘要**：`SkillCatalogSnapshot` 只含 sorted `name` + normalized `description`（默认 ≤500 字符），省略 bodies/paths/sources/providers/routing hints；`get()` 每次调用都向 provider 取完整 body，不缓存。

  > The catalog contains sorted skill `name` and normalized, XML-escaped `description` only; it omits bodies, paths, sources, providers, and routing hints. … loads full skill bodies on demand.

- **tool 可见集按 scope 收缩**：`ctx.tools.restrict()` 让模型只看到当前 scope 相关的工具。

  > ToolSearch / progressive disclosure — replace a scoped `ctx.tools.restrict()` registration as the visible set changes.

这层的意义是：**「披露多少」不是写文档时定死的，而是每次请求按 scope、按需、且只在变化时重新计算的。**

## 层 4 · 溢出回收：compaction

渐进披露的另一半是「回收」——已经披露过的内容，超预算了怎么办。DSH 用 `ctx.tokenMeter` 度量，在 `agent/pre-step` 遇到压力或溢出时触发 compaction：

- 先跑 `ctx.toolResultPruner`（对 tool 结果做确定性的 head/middle/tail 裁剪）；
- remeasure 后，若仍需压缩，把选定范围替换为一个 summary；
- **region 边界保留 tool-call/result 配对**（不拆散一个工具的调用与结果）。

  > Pressure compaction runs at serial `agent/pre-step` before request derivation. … Region boundaries preserve tool-call/result pairing but not whole turns.

这层的意义：**披露不是单向的。** 上下文有预算，超了会被压缩/替换，而不是无限增长或直接报错死掉。

## 层 5 · 隔离边界：subagent

披露还有「谁能看到什么」的边界。DSH 的 subagent 默认**不继承**父对话：

> The shared driver sends the task verbatim as the child's user message … Spawn supplies no history; fork supplies its balanced seed.

普通 `spawn` 派生的子代理不带父历史，`fork` 只继承一个平衡过的 seed。这是「乱发挥」的另一道闸：子代理不会被父上下文的全部细节带偏，也不会因看到父上下文的敏感内容而越界。

## 五层合起来是一条管线，不是五个散点

```text
静态组织（什么该存在、多大、住哪）
  → 按需注入（这一轮把哪些文件/会话拉进上下文，有预算、有去重）
  → 运行时组装（这一轮模型实际看到什么：sections + contexts + tool schemas，变化才重算）
  → 溢出回收（超预算了 prune + summary，保留 tool-call/result 配对）
  → 隔离边界（子代理默认拿不到父上下文）
```

五层各管一段：静态层决定「该进得来、进不来」，注入/组装层决定「这一轮看到什么」，回收层决定「超了怎么办」，隔离层决定「谁能看到」。只做其中一层（比如只写短文档，或只做 compaction）都不完整——**「不糊涂」靠前两层，「不乱发挥」靠中间两层的边界，长任务能活下来靠回收层。**

## 可迁移要点（按成本排序）

1. **context 注入给预算 + 去重 + 未变化不重复注入**：普通项目给「AGENTS.md 加载器」设 `maxBytes`、去重 `CLAUDE.md`、按 digest 抑制重复——等价实现，不需要插件架构。
2. **catalog/skill 只给摘要，正文 on-demand**：任何 agent host 都能做（给模型一个 name+description 目录，选中才加载全文）。
3. **system prompt 组装成「有序 sections + 只在变化时重算」**：多数 agent 框架都有 prompt 组装，难的是「变化才重算」这个 KV-cache 纪律。
4. **长任务要 compaction 阈值 + 保留 tool-call/result 配对**：超预算时压缩，且绝不拆散一个工具的调用和结果。
5. **子代理默认隔离**：spawn 不带父历史——这是防「子代理被带偏/污染」最便宜的一刀。
6. scope / waterfall / declaration-merging / `complete` 段独占是 DSH 独有机制，普通项目不必照搬。

## 证据入口

- [`../../docs/subsystems/system-prompt.md`](../../docs/subsystems/system-prompt.md)：`PromptSection` / `PromptContext`（cache-safe，变化才 log）/ `ctx.systemPrompt.tools` / `suppressRuntimeContext`。
- [`../../docs/subsystems/skills.md`](../../docs/subsystems/skills.md)：`SkillCatalogSnapshot` summary-only（name + description ≤500）、body on-demand。
- [`../../docs/subsystems/compaction.md`](../../docs/subsystems/compaction.md)：pressure/overflow 触发、tool-result pruning、tool-call/result 配对、token meter。
- [`../../docs/subsystems/token-meter.md`](../../docs/subsystems/token-meter.md)：`ctx.tokenMeter` 的估算与回放。
- [`../../packages/context/agent-instructions/README.md`](../../packages/context/agent-instructions/README.md)：touch-driven 加载、`maxBytes`/`maxSourceBytes`、per-directory dedup、digest 抑制。
- [`../../packages/context/README.md`](../../packages/context/README.md)：五个 context 插件的角色与 opt-in。
- [`../../docs/cookbook/extension-cookbook.md`](../../docs/cookbook/extension-cookbook.md)：`ctx.tools.restrict()` 的 ToolSearch / progressive disclosure 定位。
- [`../../packages/subagent/subagent-in-process-driver/README.md`](../../packages/subagent/subagent-in-process-driver/README.md)：spawn 不带父历史、fork 只带 balanced seed。
