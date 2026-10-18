# Subagent direct-child 目录与宿主消息交付

## 一句话

subagent seam 的这两条契约面在 0.2.1 线换了实现文件而语义未变：父 Session 的 `subagent/catalog` 事件仍是 direct-child 发现的**持久权威**（取代已删除的 descriptor seed），host 协议消息的交付仍拆成 **Queue / Steer 两种语义**（模型侧 `send_message` 仍是单一 steer，不随之扩展）。

## 源码核验入口

| 路径 | 角色 |
|------|------|
| `packages/subagent/subagent/src/catalog.ts` | `subagent/catalog` 事件、`subagentCatalog` projection、两个目录写入函数 |
| `packages/subagent/subagent/src/index.ts` | 注册三个投影；`prompt` Remote（`@Remote('prompt')`）；`deliverSubagentPrompt` 的公开私有分发 |
| `packages/subagent/subagent/src/manager.ts` | 本地 / 外部 activation 的创建、目录写入点、Queue / Steer 的实际投递 |
| `packages/subagent/subagent/src/control-types.ts` | `SubagentDelivery`、`SubagentPromptRequest` |
| `packages/subagent/subagent/src/internal.ts` | host 交付的 symbol-keyed 私有协议面 |
| [`2026-09-01-parent-owned-subagent-catalog`](../../.agents/notes/implemented/architecture/2026-09-01-parent-owned-subagent-catalog.md) | 目录决策（implemented，现行） |

**0.2.1 线的文件搬家**：`src/continuation.ts` 与 `src/inbox.ts` 已删除（本地创建路径并入 `src/manager.ts`，投递语义并入 `src/control-types.ts`），页面正文按新落点引用。

## parent-owned 子代理目录

**事件即权威。** 父 Session 的 required 事件 `subagent/catalog` 一条只记一个成功创建事实：`childId`、`childCreatedAt`、`mode` 与 mode 决定的 `label`，payload 分三个版本——v0 记本地 one-shot / continuable（`SUBAGENT_CATALOG_VERSION = 0`，`packages/subagent/subagent/src/catalog.ts:21`），v1 增加 `unknown`，v2 记外部执行（`mode: 'external'`，`:154`；联合类型见 `:28`-`:36`）。注册在父 Session 上的只有成功创建；没有补偿事件，也没有回滚协议。

**Projection。** `subagentCatalogProjectionDefinition`（`packages/subagent/subagent/src/catalog.ts:121`）在 subagent 插件的 projection 注入里注册（`packages/subagent/subagent/src/index.ts:228`，与 `subagentTiming`、`subagentIdentity` 同批），key 为 `subagentCatalog`，`stateVersion` 为 6。存储委托给 `dsh-chunked-list`：64 项一块，append 最多复制块头部（有界 O(1)），遍历按 oldest → newest 保持父目录事件顺序（O(D)）。projection checkpoint 一次性克隆状态；写缓存仍是异步的。

**Fork 隔离。** projection 初始化时接收精确的 `Session.inheritedEventCount`（`packages/subagent/subagent/src/catalog.ts:124`），fold 忽略 offset 以下的事件（`:126`），因此 fork 出来的子 Session 不会把继承段里的目录事实当成自己的。state 保存继承 offset 而不保存每个事件 seq，因为接受与否在 fold 期就已决定。

**非法事实即拒绝恢复。** 目录事件走严格 schema（`stateSchema` 与逐事件的 `eventDataSchema.parse`，`packages/subagent/subagent/src/catalog.ts:95`、`:127`），包括不支持的 payload 版本在内，任何非法 own fact 都让 projection 恢复失败——静默丢弃一条 required 事实会返回不完整的目录。

**两个写入点**（都在 `packages/subagent/subagent/src/manager.ts`）：

1. 本地（spawn / fork）：在 activation 物化、首条 prompt 被 inbox 接纳之后的回调里写（`manager.ts:467` 调 `establishCatalogChild`，声明见 `catalog.ts:139`）；写入失败就 dispose 这次 activation 并把目录错误抛给调用方。
2. 外部执行：仅在 `delivery === 'parent'` 时写（`manager.ts:506` 调 `establishExternalCatalogChild`，声明见 `catalog.ts:162`）；`caller` 交付不产生父级目录事实。

**取代了什么。** 旧机制是 `descriptor-seed.ts` 的 `seedDescriptorTurn`——该文件与导出都已删除。child header 与 `subagent/descriptor` 仍是恢复与组合的权威；目录只负责「父如何枚举与恢复自己的 direct child」。

**核对边界。** `dsh-chunked-list` 有自己的行为测试（`packages/util/chunked-list/tests/chunked-list.spec.ts`），本页只引它的块容量与遍历顺序，不复述其测试。`subagentCatalog` 投影目前在生产代码里**没有 `stateOf` 读取点**：除注册点外只出现在 `SessionProjectionMap` 的类型合并（`packages/subagent/subagent/src/projection-types.ts:72`，entry 联合在 `:10`）与测试（`packages/subagent/subagent/tests/catalog.spec.ts`，以及 `packages/subagent/subagent/tests/service.spec.ts:124`、`:128` 的 `snapshot` / `stateOf` 断言），Web 端（`packages/client`、`packages/web`、`apps/web`）不消费它——所以「父如何枚举 direct child」这条权威今天是给投影消费者与测试用的，没有 UI 读点。

## 宿主消息的 Queue / Steer 双交付

**两种语义。** `SubagentDelivery` 直接取 wire 请求的 `delivery` 字段（`packages/subagent/subagent/src/control-types.ts:91`，字段 `:102`）：

- `queue`：排成 child 的一个独立 turn（`agent.followup()`）；
- `steer`：插到 child 最近的 step（`agent.steer()`）。

实际分派在 `SubagentManager.deliver()`（`packages/subagent/subagent/src/manager.ts:615`，两条分支 `:626`-`:627`）；activation 正在关闭时以 `ACTIVATION_CLOSING` 拒绝（`:619`），消息不被接受。服务侧的私有实现按 `delivery` 选 `queuePrompt()` / `steerPrompt()`（`manager.ts:585`、`:604`；分发见 `packages/subagent/subagent/src/index.ts:339`-`:342`）。

**私有协议面。** host 侧不新增公开 Service 方法，而是走进程稳定的 symbol `deliverSubagentPrompt = Symbol.for('dsh.subagent.deliverPrompt')` 与 `HostPromptDeliverer` 接口（`packages/subagent/subagent/src/internal.ts:42`-`:54`），由 `queueHostSubagentPrompt`（固定传 `'queue'`）与 `steerHostSubagentPrompt`（固定传 `'steer'`）两个导出包装（`:66`、`:94`）。这样 host adapter 能保留自己的 provenance，既不扩大公开 Definition，也不冒充 Agent sender。

**Remote 面。** `prompt` Remote 的请求带 `delivery` 字段并参与校验（`packages/subagent/subagent/src/index.ts:447`-`:450`，投递处 `:494`）；附件准入先于交付，所以 child inbox 只会收到已被 Host 持久化的引用。

**模型侧不动。** `send_message` 仍然是「永远 steer」的单一语义：Service Definition 的 `SubagentRuntime.sendMessage`（`packages/subagent/subagent/src/index.ts:310`）委托 manager 的同名方法（`packages/subagent/subagent/src/manager.ts:543`），标准工具由 `packages/subagent/tool-subagent-control/src/index.ts:29` 注册。host 通道的 Queue 能力只服务「人发的每条 prompt 应是独立 turn」这类 host provenance 需求，不是模型 tool 的扩展。

## 与 03 的分工

委派工具的受管 activation 语义（`startActivation`、完成通知、`interrupt_agent`）、产品 provider 的 host 平面 opt-in、preset 组成与 model routing 仍在 [`03-subagent后台与产品provider.md`](./03-subagent后台与产品provider.md)；本页只承载目录与交付两条契约面。
