# 对照「单一 loop + tools 数组」

> 基线 `47f943859bef60e4160492346772ded9b24f765a`。给从那类 harness 迁过来的人：旧直觉落到 dsh 的哪一层。

介绍篇那张「它不是什么」表的展开。不是价值判断，是搬家地图。

![从单一 loop 迁过来时东西落在哪](./figures/vs-single-loop.svg)

## 逐项搬家

| 你原来可能写的 | 在 dsh |
|----------------|--------|
| 一个 `while` 里调 llm 再跑 tools | `ReactLoopAgent` 插件。换驱动实现 `AgentFactory`，不要 fork 这份源码来加功能。 |
| `tools: [{ name, parameters, execute }]` | `ctx.tools.register`。可见性有全局 / scoped / restrict / shadowing。执行有三条 waterfall，审批和 timeout 是别人的插件。 |
| `messages` 数组既给 UI 又给下一请求 | `Session` log。UI 订 `session/event`；模型看 `deriveMessages()`。chunk 与 assembled message 不是同一份。 |
| `const system = \`You are…\`` | `ctx.systemPrompt.section({ name, order, text })`。稳定前缀在前。persona 是配置，不是 loop 常量。 |
| `if (useDocker) bash = dockerBash` | 换 `ctx.subprocess` + `ctx.fs` 的 provider（执行世界），或换 `ctx.shell` 的 sandbox 子类。tool-bash 源码不动。 |
| CLI `main()` 里 `await loop.run(prompt)` | 表面 `ctx.agents` → `followup`。CLI / Web / ACP / SDK 是不同 bundle，同一句柄。 |
| 加功能 = 改 `agent.ts` 中间那段 | 对照 [`01-扩展表对源码.md`](./01-扩展表对源码.md) 找挂点。改 loop 要同步改 architecture.md。 |
| 换模型 = 换那个 `openai.chat.completions` 调用 | `ctx.llm` 登记 adapter。请求词汇在 `dsh-llm`，不在 loop。 |
| 子 agent = 递归调用同一个 loop 函数 | `ctx.subagent` seam：进程内 child、fork、或 ACP 到另一个产品。lineage 在 session header，可见性不继承。 |
| 配置 = 一大份 JSON | 空 `cordis.yml` + 有序 patch 层（profile / bundle / home / `--patch`）。 |

## 三条最容易带错的不变量

1. **模型看见的必须能从 log 重建。** 原来在闭包里塞的「额外 context」这里要 `inject` 或新的 `SessionEventMap` 成员。
2. **waterfall 必须 `next()`。** 原来的 middleware 若是「通知一下」，在 `pre-step` / `tools/execute` 上会把链掐死。
3. **没有特权内核。** 原来「我改 harness 核心吧」的补丁，在这里变成一个插件行。卸载必须能撤掉贡献（`ctx.effect`）。

读完对照，具体机制仍回各专题：runtime 原语、composition 叠层、session 信封、seam 三角色、模型可见面、四个入口。
