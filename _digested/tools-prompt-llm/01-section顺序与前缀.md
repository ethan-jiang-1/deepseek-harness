# Prompt section 顺序与前缀稳定

> 基线 `47f943859bef60e4160492346772ded9b24f765a`。`packages/core/system-prompt/src/index.ts`。

模型每一步的 system 文本是注册表当场拼的。顺序就是 KV cache 能不能命中前缀的机械原因。

![section 按 order 升序](./figures/section-order.svg)

## 谁在拼

`SystemPrompt.section` / `context` / tool-schema provider 都走 `dsh-scope` 的层。scoped 同名盖掉全局孪生。重复名或非有限 `order` 抛。登记和卸都会 `emit('system-prompt/change')`（不过滤：全局变化影响每个 scope）。

内置（构造时，与选哪个 loop 无关）：

- `harness:identity`，`order: -100`（可用 config 关掉）
- `deployment:persona`，`PERSONA_ORDER = 0`，文本来自 config.persona

工具包自己登记 `tool:bash` 这类跨调用指导，约定 100–199。其它负 order 也渲染在 persona 之前，所以**更负 = 更靠前 = 更应该稳定**。

## 为什么前缀要稳

提供方 KV cache 按请求前缀匹配。每步都变的东西（时钟、随机提示）若插到 identity 前面，等于每步作废缓存。约定：

- `-100` 附近：产品身份，几乎不变。
- `0`：部署 persona，随 profile 变，不随每一步变。
- `100–199`：工具指导，随 **restrict / 本 agent 可见工具集** 变——换工具集本来就会换前缀。
- 更大的正数：易变动态上下文。`PromptContext` 另有自己的 order，装配进 runtime context 快照，经 `inject` 路径变成 `user/message`，不塞进 system 前缀（loop 把 `joinContextSections` 的结果 project 进 inbox，见 session 专题）。

`config.toolOrder` 排 schema 名字；未列出的走保留名 `TOOL_ORDER_REST`。provider 返回这个保留名会让 assembly 失败。

## `complete` 与 waterfall

`system-prompt/assemble` 是 waterfall，返回值是权威的。但带 `complete: true` 的 section：assembly 仍跑完 waterfall（好让 tools / contexts / variables 被解析），然后**恢复**这一段为唯一 prompt section。监听器加不进、也换不掉该 scope 的系统提示词本体。多于一个有效 complete → assembly 失败。

信号只控制这一次显式 assembly，监听器不得留下来控制后续 turn。

## 和模型可见不变量的交接

拼出来的 system 字符串写入 `request/header`。历史仍是 `deriveMessages()`。下一步若 header 变了，reason 是 `'change'`；新 loop 实例面对已有 header 事件时是 `'resume'`。不在 log 里的片段不该出现在请求里——section 的**文本**每次 assemble 现算，但必须能从当时挂着的插件 + header 快照重建。reload 后若插件树不同，那是 composition 问题，不是「偷偷加了一段没入 log」。
