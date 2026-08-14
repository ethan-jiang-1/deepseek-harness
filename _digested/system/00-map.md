# System 地图

## 一句话定位

DeepSeek Harness 当前不是「一个 agent loop + 一堆工具」，而是一台用 Cordis 装起来的插件树：循环、会话、模型适配器、工具注册表本身都是插件，都可以被配置换掉。

```text
没有特权核心可打补丁。
新行为挂到已有扩展点上，而不是改 agent-loop。
```

这个专题只讲这些层怎么拼成一台正在跑的 `dsh`。Cordis 原语、boot 组合、turn 时序、seam 三角色，分别去相邻专题。

本图从 [`docs/architecture.md`](../../docs/architecture.md) 抽出工作用地图。机制级结论必须再对源码核验，核验前不要把下面的分层当成已经消化完的事实。

## 六层工作模型

```text
DeepSeek Harness 当前系统

1. Cordis runtime
   vendor/cordis vendor/loader vendor/include
   ctx / plugin / effect / event / waterfall / fiber

2. Composition
   profile bundles → profile patch → home patch → --patch
   作用在空 entry list 上

3. Product spine
   ctx.sessions ctx.systemPrompt ctx.tools
   ctx.agents ctx.agentLoop
   per-agent scope（agent.ctx）

4. Capability seams
   Service Definition + Provider + Consumer
   换 provider 就换执行世界（fs / subprocess / sandbox 常绑在一起）

5. Turn loop
   turn = 若干 step；step = 一次模型请求 + 它调用的工具
   session log 是模型上下文的源
   model-visible ⟺ logged

6. Surfaces
   CLI / Web / ACP / JSON-RPC
   驱动 ctx.agents，从 session/event 渲染
```

这六层是叠加，不是替代。profile 决定树上有哪些插件；seam 决定某项能力由谁实现；loop 只消费已经挂上的服务和事件。

## 每层回答的问题

| 层 | 它回答的问题 | 主要状态 / 入口 |
|----|--------------|-----------------|
| Cordis runtime | 插件怎么注册、怎么卸、事件怎么传 | `vendor/`，[`docs/cordis-primer.md`](../../docs/cordis-primer.md) |
| Composition | 这一次进程里到底装着哪棵树 | `$DSH_HOME/profiles/<name>`，`dsh --dump-config` |
| Product spine | 会话、提示词、工具、Agent 句柄归谁 | `packages/core/` |
| Capability seams | 换后端时哪些东西必须一起走 | [`docs/capability-seams.md`](../../docs/capability-seams.md) |
| Turn loop | 一轮用户输入如何变成模型和工具调用 | [`docs/architecture.md`](../../docs/architecture.md) Turn flow |
| Surfaces | 人 / 自动化客户端怎么接到同一棵树 | `apps/cli/`、`packages/host/`、`packages/sdk/`、`packages/acp/` |

## 事件域（扩展点的第一刀）

从 architecture 的分类出发，消化时先问「这是哪一类事件」：

| 域 | 何时用 | 例子 |
|----|--------|------|
| Session events | 事实必须活过 reload | `turn/*`、`user/message`、`assistant/*`、`tool/*` |
| Agent events | 观察或拦截正在飞的工作 | `agent/pre-step`、`agent/request`、`agent/turn-stopping` |
| Capability events | 给 seam 挂策略，不 import loop | `fs/*`、`tools/*`、`telemetry/*` |

`agent/pre-step`、`agent/request`、`llm/stream`、以及三条 `tools/*` 是 waterfall：监听者必须 `next()`。`agent/turn-stopping` 是 serial，没有 `next()`。

## 现有专题怎么分工

```text
system/
  先回答：这台机器有哪些层，每层边界在哪。

cordis-runtime/
  再回答：Cordis 原语在这棵 vendor 树里如何被使用和改过。

composition/
  再回答：profile / bundle / patch 如何把空列表变成可启动的 entry 树。

session-and-loop/
  再回答：session log、turn/step、scope、agent-loop 的精确机制。

capability-seams/
  再回答：三角色怎么切包，哪些 seam 共享执行世界。

tools-prompt-llm/
  再回答：模型请求里的 section、schema、adapter、tool pipeline。

surfaces/
  再回答：各入口如何 boot 同一套 spine，又在何处分叉。
```

## 计划中的章节（待消化）

| 文件 | 打算回答 |
|------|----------|
| `01-everything-is-a-plugin.md` | 「没有特权核心」在源码里具体指什么，循环本身如何也是插件 |
| `02-扩展点地图.md` | architecture 那张「Where new behavior goes」对照源码入口 |
| `03-对照常见-agent-harness.md` | 和「单一 loop + tools 数组」类框架的差异，便于迁移直觉 |

## 官方文档入口

- [`docs/architecture.md`](../../docs/architecture.md)
- [`docs/cordis-primer.md`](../../docs/cordis-primer.md)
- [`docs/capability-seams.md`](../../docs/capability-seams.md)
- [`docs/glossary.md`](../../docs/glossary.md)
- [`packages/README.md`](../../packages/README.md)
