# Tools, prompt, LLM · 模型可见面

## 一句话

模型每一步看见的东西由插件注册表**当场组装**：`ctx.systemPrompt` 的 section，加上 `ctx.tools` 里当前 scope 可见的 schema，历史则从 session log 投影。请求经 `ctx.llm` 的 adapter 流出；工具调用走三条 waterfall 管道。

这一层是「模型可见面」。它依赖 [session log 与 scope](../session-and-loop/00-map.md)。

## 一步请求从哪来

![一步模型请求的组装](./figures/request-assembly.svg)

三股汇合：

1. **Prompt sections** — 插件往 `ctx.systemPrompt` 注册片段（身份、persona、工作区指令、时间……），按顺序、按这个 agent 的 scope 过滤后拼起来。
2. **Tool schemas** — `ctx.tools` 里该 scope 还看得见的工具。`restrict` 先过滤全局集，shadowing 再覆盖同名，scope-local 最后合并。被滤掉的工具：提示词里没有，执行也拒绝，和「不存在」无法区分。
3. **历史** — `deriveMessages()` 从 log 投影。`inject` 的材料等下一次获准请求。不在 log 里的东西不该出现在请求里。

面向模型的文字从**模型视角**写：提示词、schema、结果、诊断里只有任务相关概念，没有 UI、传输、实现词汇。

加模型提供方：在 `ctx.llm` 上注册 adapter。加面向模型的能力：在 `ctx.tools` 上注册，它的 schema 会自动加入组装。都不必改 loop。

## 工具执行管道

![工具执行管道](./figures/tool-pipeline.svg)

```text
tool/call（入 log）
  → tools/pre-execute     审批、改 argv，必须 next()
  → tools/execute         真正执行；timeout 也挂在这
  → tools/post-execute    包装结果
tool/result（入 log）
```

守卫在管道上统一执行，不散落在每个 tool 里。拒绝路径要穿过执行器来测，不能只靠「schema 里不写这个字段」假装禁掉。

和人相关的两条容易混：

- **审批 / permission / ask-user** 挂在 interaction 与这条管道上，仍然是模型 turn 的一部分。
- **人敲的 slash command** 走 `ctx.commands`，**不经过模型 turn**。那是另一个平面，见 [surfaces](../surfaces/00-map.md)。

tool 的 UI 渲染意图是设计的一部分，一开始就要定：`generic` / `terminal` / `diff`。展示方法是 `args` 的纯函数。

## 源码入口

| 路径 | `ctx` key | 角色 |
|------|-----------|------|
| `packages/core/system-prompt/` | `ctx.systemPrompt` | section 与 schema 组装 |
| `packages/core/tools/` | `ctx.tools` | 作用域注册表 + 守卫管道 |
| `packages/llm/llm/` | `ctx.llm` | 消息/流词汇 + adapter seam |
| `packages/llm/llm-deepseek/` | | DeepSeek provider |
| `packages/guard/` | | 循环卫生、execute 截止时间 |
| `packages/interaction/` | | 审批、permission、ask-user |
| [`docs/tool-execution-pipeline.md`](../../docs/tool-execution-pipeline.md) | | 管道 |
| [`docs/cookbook/adding-a-tool.md`](../../docs/cookbook/adding-a-tool.md) | | 加 tool |
| [`docs/cookbook/adding-an-llm-adapter.md`](../../docs/cookbook/adding-an-llm-adapter.md) | | 加 adapter |

## 以后深挖

- section 注册顺序、与 KV cache 有关的前缀稳定性。
- 管道上审批与 timeout 的具体监听器。
- streaming chunk 如何变成 log 里的 `assistant/chunk` / `assistant/message`。
