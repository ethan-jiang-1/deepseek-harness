# Cordis runtime · 被 vendor 的框架

## 一句话

Harness 把 Cordis 源码放进 `vendor/`，rescoped 成 `@deepseek-ai/cordis`，再在上面长产品。读 dsh 之前先分清三件事：**上游原语**、**本仓库记在 `vendor/README.md` 的本地修改**、**产品插件怎么用它们**。

官方入门仍是 [`docs/cordis-primer.md`](../../docs/cordis-primer.md)。这里不重写教程，只把整机真正踩在哪些原语上讲清楚。

## 五条原语

![Cordis 五条原语](./figures/five-ideas.svg)

对读 harness 插件最有用的对照：

| 原语 | 在 dsh 里长什么样 |
|------|-------------------|
| Plugin | `packages/*` 几乎全是插件。函数插件导出 `name` / `inject` / `apply`，不要再给 default export——Loader 会丢掉它的 namespace。 |
| Context | 服务按 `ctx.tools`、`ctx.llm`、`ctx.sessions` 这种 key 查找。扩展插件依赖 Definition，不 import 具体 Provider。可选服务用 `ctx.get(name)`。 |
| inject | 插件声明「我要哪些服务」，没有就等。加载顺序由依赖表达，不是手写 boot 列表。`!!js` 配置也是在 inject 激活之后才求值。 |
| Events | 事件名靠 TypeScript 声明合并。模式（`emit` / `waterfall` / `parallel` / `serial`）是合同的一部分，JSDoc 用 `@mode` 标出来。 |
| Effects | 提示词片段、工具 schema、adapter、监听器都经 `ctx.effect()` / `ctx.on()` 登记。注册表的 `register()` 返回 disposer。插件一卸，贡献撤掉。 |

## waterfall：必须调用 `next()`

dsh 里最容易踩的事件合同就是 waterfall。它是 around-middleware，不是「通知一下」。

![waterfall 必须调用 next()](./figures/waterfall.svg)

`agent/pre-step` 拒绝消息，就是一次合法短路：后面的模型请求不会发生，但（见 session 专题）仍会关掉一个不含 step 的持久 turn。

`agent/turn-stopping` **不是** waterfall，它是 serial，没有 `next()`。用错直觉会把「结束一轮」写成「包装请求」。

## 上游 · 本地修改 · 产品用法

![三件必须分开的事](./figures/vendor-stack.svg)

本地修改不是风格问题。例如 Include 导出 `applyEntryPatches`，并且让同一次 patch 列表里后出现的条目能改到前面 `insert` 进去的行——因为 `dsh` 把 bundle / profile / home / `--patch` 当成**同一层 Include 上的兄弟 patch 列表**。上游若只在循环开始前建一次 id 索引，新插进去的行会变成「表面上看得到、patch 打不中」。

`dsh --dump-config` 必须走同一套算法。产品代码里再手写一份「类似的 patch」，会和真树立即漂移。

`disabled: !!js` 是目前唯一被插值的 entry 元数据字段。其余 metadata 保持字面量。条件组合靠 overlay，不要把环境选择藏进别的字段。

## 源码入口

| 路径 | 角色 |
|------|------|
| `vendor/cordis/` | Context / Fiber / Service / Events |
| `vendor/loader/` | Loader |
| `vendor/include/` | `cordis:include`，patch 算法 |
| `vendor/group/` | `cordis:group`，`isolate` realm |
| `vendor/hmr/` | 配置与模块热更新 |
| [`vendor/README.md`](../../vendor/README.md) | 钉住的 SHA、本地修改清单、同步步骤 |
| [`docs/cordis-primer.md`](../../docs/cordis-primer.md) | 作者向的五条思想 |
| [`docs/cordis-tutorial/`](../../docs/cordis-tutorial/index.md) | 同一套思想的动手教程 |

## 机制级正文

| 文件 | 内容 |
|------|------|
| [`01-五条原语对照源码.md`](./01-五条原语对照源码.md) | Plugin / Context / inject / Events / Effects 对到 `vendor/cordis/src/` |
| [`02-waterfall-与事件合同.md`](./02-waterfall-与事件合同.md) | `waterfall` 源码算法；`agent/pre-step` vs `agent/turn-stopping` |
| [`03-loader-include-与js插值.md`](./03-loader-include-与js插值.md) | `!!js` 两处求值；`applyEntryPatches` 为何能叠 bundle |
| [`04-vendor-本地修改.md`](./04-vendor-本地修改.md) | 产品真正踩着的 vendor 补丁，不是把清单抄一遍 |

介绍篇建立直觉。机制级正文对源码。profile / boot 时序在 [`../composition/01-boot-时序.md`](../composition/01-boot-时序.md)。
