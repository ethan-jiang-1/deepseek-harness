# Tools, prompt, LLM 地图

## 一句话定位

模型每一步看见的东西由插件注册表当场组装：system prompt 的 section，加上 `ctx.tools` 里当前 scope 可见的 schema。请求经 `ctx.llm` 的 adapter 流出；工具调用经 `tools/pre-execute` → `tools/execute` → `tools/post-execute` 瀑布。

这一层是「模型可见面」。它依赖 session log（历史从 log 投影）和 scope（这个 agent 有哪些 tool / section）。

## 这一层回答什么

- prompt section 如何注册、排序、按 scope 过滤。
- tool schema 如何进入请求；restriction 与 scope-local 注册如何合成「这个 agent 的工具集」。
- LLM adapter 怎样挂到 `ctx.llm`；streaming 事件如何变成 `assistant/chunk` / `assistant/message`。
- tool 执行管道的守卫、超时、审批在哪一层，而不是散落在各个 tool 里。
- 面向模型的文本为什么必须从模型视角写（不含 UI / 传输词汇）。

## 源码入口

| 路径 | `ctx` key | 角色 |
|------|-----------|------|
| `packages/core/system-prompt/` | `ctx.systemPrompt` | prompt section 与 tool-schema 组装 |
| `packages/core/tools/` | `ctx.tools` | 作用域工具注册表 + 守卫执行管道 |
| `packages/llm/llm/` | `ctx.llm` | 消息/流词汇 + adapter seam |
| `packages/llm/llm-deepseek/` | | DeepSeek provider |
| `packages/guard/` | | 循环卫生、tool timeout |
| `packages/interaction/` | | 审批 / permission / ask-user |
| [`docs/subsystems/system-prompt.md`](../../docs/subsystems/system-prompt.md) | | section 语义 |
| [`docs/subsystems/tools.md`](../../docs/subsystems/tools.md) | | 工具注册与执行 |
| [`docs/tool-execution-pipeline.md`](../../docs/tool-execution-pipeline.md) | | 管道 |
| [`docs/subsystems/llm-streaming.md`](../../docs/subsystems/llm-streaming.md) | | 流式合同 |
| [`docs/cookbook/adding-a-tool.md`](../../docs/cookbook/adding-a-tool.md) | | 加 tool 的产品步骤 |
| [`docs/cookbook/adding-an-llm-adapter.md`](../../docs/cookbook/adding-an-llm-adapter.md) | | 加 adapter 的产品步骤 |

## 计划中的章节（待消化）

| 文件 | 打算回答 |
|------|----------|
| `01-prompt-组装.md` | section 注册、顺序、scope 过滤、与 tool schema 的汇合点 |
| `02-tool-registry-与-scope.md` | 全局 vs scoped、shadowing、restrict |
| `03-执行管道.md` | pre-execute / execute / post-execute，审批与 timeout 插在哪 |
| `04-llm-adapter.md` | `ctx.llm` 注册、stream waterfall、chunk 如何入 log |
