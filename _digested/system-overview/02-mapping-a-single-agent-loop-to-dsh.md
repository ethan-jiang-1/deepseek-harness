# 对照「单一 loop + tools 数组」

> **为什么单独有这一页**：绝大多数熟悉 agent 框架的开发者，心智模型里装的都是「一个 `while` 循环调 LLM，手边挂一个 `tools[]` 数组和一个 `messages[]` 列表」。用这套心智直接读 DSH 很容易处处撞墙——找不到把 `tools` 传给 loop 的入口、看不懂为什么改一个设置能换掉工具实现、也摸不清改行为该改哪里。与其等你在源码里逐个踩空，不如单立这一页做一次**直白的心智搬家**：先把你在旧框架里写的每一行常见代码对照成 DSH 的对应插件/服务，再交代迁过来时最容易违反的三条不变量；读完下表之后，再去对应专题深挖机制才不迷路。

![从单一 loop 迁过来时东西落在哪](./figures/vs-single-loop.svg)

## 逐项搬家

| 你原来可能写的 | 在 dsh |
|----------------|--------|
| 一个 `while` 里调 llm 再跑 tools | `ReactLoopAgent` 插件。换驱动实现 `AgentFactory`，不要 fork 这份源码来加功能。 |
| `tools: [{ name, parameters, execute }]` | `ctx.tools.register`。可见性沿全局层、显式 scope 祖先层和 agent 自有层解析；`restrict` 过滤继承面，同名项由更近层覆盖。执行有三条 waterfall，审批和 timeout 是别人的插件。 |
| `messages` 数组既给 UI 又给下一请求 | `Session` log。UI 订 `session/event`；模型看 `deriveMessages()`。一次 model attempt 只有一条 settlement，assembled message 与 embedded stream 是同一事件的两半；`expandAssistantStream()` 才能拿回逐 token 事实。 |
| `const system = \`You are…\`` | `ctx.systemPrompt.section({ name, order, text })`。稳定前缀在前，但环境事实（Harness 来源路径、Web URL、cwd）已移到最尾；persona 拆成 prefix/suffix 两段。 |
| `if (useDocker) bash = dockerBash` | 远程组合同时替换 `ctx.subprocess` 与 `ctx.fs` provider，并共享 runtime owner；本地 confinement 则换 `ctx.shell` 的 sandbox 子类。tool-bash 源码不动。 |
| CLI `main()` 里 `await loop.run(prompt)` | 各入口都经 `ctx.agents` → `followup`。CLI / Web / Desktop / ACP / SDK 可以处于不同进程和插件树，但复用 `Agent` 接口与 session 语义。 |
| 加功能 = 改 `agent.ts` 中间那段 | 对照 [`01-finding-extension-points-for-new-behavior.md`](./01-finding-extension-points-for-new-behavior.md) 找挂点。改 loop 要同步改 architecture.md。 |
| 换模型 = 换那个 `openai.chat.completions` 调用 | `ctx.llm` 登记 adapter。请求词汇在 `dsh-llm`，不在 loop。 |
| 子 agent = 递归调用同一个 loop 函数 | `ctx.subagents` seam：provider 可以运行进程内 child，也可以通过 ACP / JSON-RPC 驱动独立进程。选哪个后端由 `tool-subagent` 的 `provider`（无默认值的必需字段）与 Web 设置里的插件偏好决定——进程内 child 可续跑，外部后端单次执行自动回报。Codex / Claude Code 这类产品 provider 走官方按需安装通道（`ON_DEMAND_BUNDLES`），装进 profile 后各自注册一个 provider，preset 中不含占位 disabled 行。见 [`../capability-seams/01-subagent-provider.md`](../capability-seams/subagent/01-subagent-provider.md)。session header 的 lineage 不会自动建立 scope 父链；进程内 child 可加入父 agent 正在使用的同一 preset generation，但不继承父 agent 自有层。 |
| 配置 = 一大份 JSON | 空 `cordis.yml` + 有序 patch 层（bundle → profile → home → `--patch`，`docs/architecture.md:27`；参见 [`plugin-system/composition/00-map.md`](../plugin-system/composition/00-map.md)）。 |

## 三条最容易带错的不变量

1. **模型看见的必须能从 log 重建。** 对话内容写成 surface；实际 config、adapterDefaults 与 tools 写进 `request/header`，system prompt 是 surface 节点 `system/message`。只有这两种现有表示都容纳不了的新语义，才新增 `SessionEventMap` 成员。
2. **waterfall 用 `next()` 委托。** 只观察或包装的 middleware 必须调用它；拥有 deny、retry、路由或替换结果的监听器可以直接返回并短路。
3. **产品能力不集中在 loop。** 普通功能注册到所属服务、注册表或事件；贡献由 `ctx.effect` 绑定生命周期，插件卸载时一并撤销。

读完对照，具体机制仍回各专题：runtime 原语、composition 叠层、session 世代与信封、seam 三角色、模型可见面、五个入口。
