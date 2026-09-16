# Subagent direct-child 目录与宿主消息交付

## 一句话

subagent seam 在本跨度长出两条新契约面：父 Session 的 `subagent/catalog` 事件成为 direct-child 发现的**持久权威**（取代已删除的 descriptor seed），host 协议消息的交付拆成 **Queue / Steer 两种语义**（模型侧 `send_message` 仍是单一 steer，不随之扩展）。

## 源码核验入口

| 路径 | 角色 |
|------|------|
| `packages/subagent/subagent/src/catalog.ts` | `subagent/catalog` 事件、`subagentCatalog` projection、目录写入函数 |
| `packages/subagent/subagent/src/index.ts` | 注册 projection；one-shot 成功后的目录写入；`prompt` Remote 的 `delivery` |
| `packages/subagent/subagent/src/continuation.ts` | continuable 创建路径的目录写入；Queue / Steer 的投递实现 |
| `packages/subagent/subagent/src/inbox.ts` | `SubagentDelivery`、`SubagentInbox.deliver` |
| `packages/subagent/subagent/src/internal.ts` | host 交付的 symbol-keyed 私有协议面 |
| [`2026-09-01-parent-owned-subagent-catalog`](../../.agents/notes/implemented/architecture/2026-09-01-parent-owned-subagent-catalog.md) | 目录决策（implemented，现行） |

## parent-owned 子代理目录

**事件即权威。** 父 Session 的 required 事件 `subagent/catalog` 一条只记一个成功创建事实：`childId`、`childCreatedAt`、`mode`（one-shot / continuable）与 mode 决定的 `label`（`packages/subagent/subagent/src/catalog.ts:20-42`）。注册在父 Session 上的只有成功创建；没有补偿事件，也没有回滚协议。远端 one-shot run 若没有本地 Session，就不进这份目录。

**Projection。** `subagentCatalogProjectionDefinition`（`packages/subagent/subagent/src/catalog.ts:116`）在 subagent 插件的 projection 注入里注册（`packages/subagent/subagent/src/index.ts:212-216`），key 为 `subagentCatalog`，state version 为 2。存储委托给 `dsh-chunked-list`：64 项一块，append 最多复制块头部（有界 O(1)），遍历按 oldest → newest 保持父目录事件顺序（O(D)）。projection checkpoint 一次性克隆状态；写缓存仍是异步的，沿用既有的创建 / turn 结束 / 释放三个强制点。

**Fork 隔离。** projection 初始化时接收精确的 `Session.inheritedEventCount`，fold 忽略 offset 以下的事件，因此 fork 出来的子 Session 不会把继承段里的目录事实当成自己的（`packages/subagent/subagent/src/catalog.ts:119-123`）。state 保存继承 offset 而不保存每个事件 seq，因为接受与否在 fold 期就已决定。

**非法事实即拒绝恢复。** 目录事件走严格 schema，包括不支持的 payload 版本在内，任何非法 own fact 都让 projection 恢复失败——静默丢弃一条 required 事实会返回不完整的目录。

**两个写入点。** `establishCatalogChild`（`packages/subagent/subagent/src/catalog.ts:134`）在 src 里只有两个调用点：

1. one-shot：provider 返回本地 child 之后、run 交到调用方之前写入（`packages/subagent/subagent/src/index.ts:571`，调用方即同文件 `:566-586` 的 `start`）。写入失败就 dispose 这个 run 并把目录错误抛给调用方——没有调用方会收到这个 run。
2. continuable：先接纳首条 prompt，再在接纳回调里写目录（`packages/subagent/subagent/src/continuation.ts:182`，回调在 `submitMaterialized` 的 inbox 接纳之后运行）；任一环节失败都 dispose activation 并抛错。

**取代了什么。** 旧机制是 `descriptor-seed.ts` 的 `seedDescriptorTurn`——在 NEW 里该文件与导出都已删除。child header 与 `subagent/descriptor` 仍是恢复与组合的权威；目录只负责「父如何枚举与恢复自己的 direct child」。

**核对边界。** `dsh-chunked-list` 有自己的行为测试（`packages/util/chunked-list/tests/chunked-list.spec.ts`），本页只引它的块容量与遍历顺序，不复述其测试。`subagentCatalog` 投影目前在仓库内**没有 `stateOf` 读取点**：除注册点外只出现在 `SessionProjectionMap` 的类型合并（`packages/subagent/subagent/src/projection-types.ts:65`）与 `packages/subagent/subagent/tests/catalog.spec.ts`，Web 端（`packages/client`、`packages/web`、`apps/web`）不消费它——所以「父如何枚举 direct child」这条权威今天是给投影消费者与测试用的，没有 UI 读点。

## 宿主消息的 Queue / Steer 双交付

**两种语义。** `SubagentDelivery` 直接取 wire 请求的 `delivery` 字段（`packages/subagent/subagent/src/inbox.ts:13`）：

- `queue`：排成 child 的一个独立 turn（`agent.followup()`）；
- `steer`：插到 child 最近的 step（`agent.steer()`）。

`SubagentInbox.deliver` 是唯一分派点（`packages/subagent/subagent/src/inbox.ts:46-55`）；activation 正在关闭时抛 `ACTIVATION_CLOSING`，消息不被接受。

**私有协议面。** host 侧不新增公开 Service 方法，而是走进程稳定的 symbol `deliverSubagentPrompt = Symbol.for('dsh.subagent.deliverPrompt')` 与 `HostPromptDeliverer` 接口（`packages/subagent/subagent/src/internal.ts:42-54`），由 `queueHostSubagentPrompt`（固定传 `'queue'`）与 `steerHostSubagentPrompt`（固定传 `'steer'`）两个导出包装（`:66-110`）。这样 host adapter 能保留自己的 provenance，既不扩大公开 Definition，也不冒充 Agent sender。服务侧的私有实现按 `delivery` 分派到 continuation manager 的 `queuePrompt` / `steerPrompt`（`packages/subagent/subagent/src/index.ts:255-278`；实现同包子路径 `continuation.ts:243`、`:262`）。

**Remote 面。** `prompt` Remote 的请求新增 `delivery` 字段（`packages/subagent/subagent/src/control-types.ts:106`）并参与校验（`packages/subagent/subagent/src/index.ts:412-463`）；附件准入先于交付，所以 child inbox 只会收到已被 Host 持久化的引用。

**模型侧不动。** `send_message` 仍然是「永远 steer」的单一语义：Service Definition 的 `SubagentRuntime.sendMessage`（`packages/subagent/subagent/src/index.ts:246-253`）委托 continuation manager 的 `sendMessage`（`packages/subagent/subagent/src/continuation.ts:202`），标准工具由 `packages/subagent/tool-subagent-control/src/index.ts:29` 注册。host 通道的 Queue 能力只服务「人发的每条 prompt 应是独立 turn」这类 host provenance 需求，不是模型 tool 的扩展。

## 与 03 的分工

`backgroundMode`（one-shot / continuable）、产品 provider 的 host 平面 opt-in、model routing 仍在 [`03-subagent后台与产品provider.md`](./03-subagent后台与产品provider.md)；本页只承载目录与交付两条新契约面。`SubagentProvider.agentRouteDefaults` 与 route preflight 的行锚也已在 03 更新。
