# PTC 模式分篇 · 把"模型调用工具"换成"模型写程序调用工具"

## PTC 是什么？和 Cloudflare 的 Code Mode 什么关系？

PTC = **Programmatic Tool Calling**（GUI 文案原话，[`guide-locales.ts`](../../packages/client/ui-agent-preset/src/client/guide-locales.ts)）。设计出发点记录在 [PTC mode Note](../../.agents/notes/implemented/feature/2026-06-15-ptc.md)：原生呈现下每个工具调用都要一次完整的模型往返，且**每个中间 `tool-result` 都整份回到上下文**；而 LLM 写代码的经验远多于写人工构造的 tool-call 轨迹（Cloudflare [Code Mode](https://blog.cloudflare.com/code-mode/) 的观察）。于是把呈现翻过来：模型写一个 TypeScript 程序，程序通过生成的 SDK 调工具，**只有程序 print 或 return 的内容回到上下文**。历史上这个能力叫 code-mode，`3ca9c7d489` 改名 ptc（会话格式的既有词汇除外）。

## 预设里那一行到底做了什么？

[`ptc.patch.yml`](../../packages/bundle/web-app/presets/ptc.patch.yml) 相对 standard 的机制性差异只有一行：

```yaml
- id: tool-presentation
  name: '@deepseek-ai/dsh-agent-tool-presentation'
  config:
    mode: ptc
```

`mode` 是 `ToolRuntime`（`dsh-tools`）自己的配置（`'native' | 'ptc' | 'both'`，默认 native）；这个包只是把选择搬进 preset scope 的 `ctx.tools.presentAs()`。效果（Note「The registry owns the mode」节）：

- **wire 工具表只剩 `run_code`**（保留的呈现传输层，带 `{ code, description }` 两个必填参数），外加系统提示词里一份生成的 `.d.ts` SDK 与用法说明；
- `run_code` 在注册/限制层之外，**restriction 不可能误删 PTC 模式的唯一入口**；
- 声明是 per-agent 的：native Agent 与 PTC Agent 同进程并存，互不共享工具目录（[`packages/core/agent-tool-presentation/README.md`](../../packages/core/agent-tool-presentation/README.md)）；
- 选 `ptc`/`both` 要求组合里有兼容的 `ctx.ptcRuntime`（TS 运行时由 `dsh-ptc-runtime-node` 提供）；没有就在 **mount 时**拒绝这份 preset，把失败放在操作员能行动的位置，而不是会话第一次请求时。

## 模型实际看到什么、结果怎么回来？

- 工具在可见 store 里照常存在（fs、search、subagent、web、todo、ask-user……都还在 preset 里），只是投影成 SDK 里的函数声明；SDK 按字典序排列保证字节稳定，利于 provider 缓存。
- 程序是 async 函数体，`await tools.name(args)` 调用；SDK 明示合同：只读调用可用 `Promise.all` 重叠，互斥调用按提交顺序串行，有依赖就 `await`。
- **只有 print/return 进上下文**；子工具若返回 image block，不会嵌进父 tool 结果，而是在 `run_code` 结束后 defer 成一条 user message（[`../_digested/tools-prompt-llm/00-map.md`](../../_digested/tools-prompt-llm/00-map.md)「历史」节）。

## 子调用还受管吗？（权限、审计、并发）

受管，而且走的是**同一条完整管道**。Note「The run_code tool and the dispatch bridge」+ e2e 钉住的行为：

- 每个子调用过完整 pipeline：`tools/pre-execute` → 单调 guards → `tools/execute` → `tools/post-execute` → `finalizeContent` → `tools/result`；权限插件能在程序运行前检查程序文本，子调用逐个受审批约束。
- 每次子 dispatch 写一对 log-only 的 `tool/ptc-dispatch-start` / `tool/ptc-dispatch` 事件（父/子 call id、工具、参数、完整渲染结果），**不进模型历史但持久化**，Web 从这里渲染嵌套子行（[`apps/web/tests/ptc-round.e2e.ts`](../../apps/web/tests/ptc-round.e2e.ts)）。子 call id 形如 `<parent>:ptc:<n>`（[`packages/core/tools/src/ptc.ts`](../../packages/core/tools/src/ptc.ts)）。
- 并发有界不串行：每run 一个 dispatch 队列，按提交顺序启动，相邻的并发安全调用可重叠至 `maxParallelSubCalls`（默认 10，`1` 即恢复串行；[`packages/core/tools/src/index.ts`](../../packages/core/tools/src/index.ts)）；互斥调用独占。
- **沙箱升级走既有审批**：程序先在读只沙箱下被拒（EPERM/EROFS），显式以 `sandbox_permissions: "workspace-write"` 重试并给出 justification，批准前文件不落盘（[`apps/web/tests/ptc-escalation.e2e.ts`](../../apps/web/tests/ptc-escalation.e2e.ts)）。执行体是 fresh Node 进程，跑在调用 Session 的文件沙箱策略下（[`packages/ptc-runtime/ptc-runtime-node/README.md`](../../packages/ptc-runtime/ptc-runtime-node/README.md)）。

## 为什么 PTC 预设把 workflow 工具禁了？

事实：`ptc.patch.yml` 里 `workflow-ptc`、`tool-workflow`（以及本来默认就禁的 `tool-ralph`）都是 `disabled: true`；GUI guide 也只陈述现状——"当前 PTC 预设未启用 workflow 工具"。仓库里**没有**书面 rationale，以下是我的推断（标注为推断）：workflow 工具本身就是"模型写一个 JS 编排程序跑在 PTC runtime 里"的另一个入口（[`packages/workflow/workflow-ptc/README.md`](../../packages/workflow/workflow-ptc/README.md)），与 `run_code` 供给模型的"写程序组织调用"能力重叠；单入口省掉模型在两种编排原语间做策略选择。guide 文案把它写成 current state 而非永久承诺，说明这是可翻的开关。**引用时按事实（禁用 + 无书面理由）转述，不要把我的推断当成设计声明。**

## 什么时候选它？边界在哪？

- 适用面（guide 原文）：批量调用工具后要**筛选、整理、去重、统计、汇总**的任务——中间数据在程序里聚合，只有汇总回模型。guide 同时明确：Standard 也能写脚本批量处理，**"批量任务并不必须使用 PTC"**。
- 已知边界：配置了 native 能力名的 `systemPrompt.toolOrder` 在 `mode: 'ptc'` 下**每次组装都被拒**（那些名字不在该模式的 wire 校验宇宙里，视为正确行为）；SDK 声明前缀可以和原生 schema 一样大，`'both'` 双份更贵（内置预设没用 `'both'`）；嵌套工具与审批等待消耗程序的 elapsed 预算。
