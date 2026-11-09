# Evidence Layers: Declaration, Mount, Mechanism and Behaviour · 证据分层

源码核验入口：`packages/preset/agent-preset-registry/src/{index,definition}.ts`、`apps/cli`（`--dump-config`）、`packages/core/session/src/types.ts:241`-`247`、`packages/core/agent-loop/src/agent.ts:616`-`699`、`packages/subagent/subagent/src/{catalog,descriptor}.ts`。

本页回答：**怎么证明一条委派链真的按你写的组合工作？每一层证据能证明什么、不能证明什么？** 图的字段来源见 [`observation/05`](./05-delegation-graph-node-and-edge-projection.md)，终态见 [`observation/02`](./02-terminal-states-and-bounded-retry-authority.md)。

## 一句话

「挂了组合」「跑起来了」「模型照着做了」是三件不同的事。DSH 里有四层可分别取得的证据，**上一层证明不了下一层**；把它们混成一句“测试通过”，就是假绿。

![四层证据：每层只证明自己](./figures/evidence-layers.svg)

## 四层

| 层 | 证据 | 证明 | 不能证明 | 成本 |
|---|---|---|---|---|
| **1 声明面** | preset 的 YAML / `--dump-config` 打出的入口列表 | 你**写下**了什么组合（行、配置、顺序） | 会话实际拿到的工具面；模型会不会用 | 零模型、可进 `pnpm test` 的纯解析/比对 |
| **2 装配** | `agentPresets.register` 的激活结果、`broken` 行、`session/create` 真挂载 | 这棵子树能立起来、依赖在场、服务能解析 | 运行时每个 Agent 的工具面；行为 | 零模型，但要真入口（host/CLI） |
| **3 实际工具面** | `request/header` 的 `tools` 字段（`EpochHeader.tools`） | 这次请求真实发给模型的工具 schema 集合 | 模型选得对不对、用得好不好 | 需要一次真实请求（可录制回放） |
| **4 行为** | 真模型会话/探针的调用序列与参数 | 模型在给定提示下**会**怎么选、怎么用 | 稳定性（单次 ≠ 稳定）；生产分布 | 真模型、按次计费、不进 CI |
| （产品层）**5 呈现** | 真页面 / 金样 / 客户端投影 | 用户看到的流程与状态 | 数据本身是否正确（要靠 1–4） | 浏览器/宿主，单独门禁 |

### 每层的落点

1. **声明面**：`--dump-config` 是 boot-free 的入口列表 YAML（`apps/cli` 的 dump 路径；`packages/boot/app-boot/src/config-schema/document.ts:158` 的说明）；preset 定义的字段与子行在 `packages/preset/agent-preset-registry/src/definition.ts:5`-`11`。它能核对“写下的组合”，不能核对“会话里真的有什么”。
2. **装配**：注册表会在注册时 eager 激活并挂载；激活失败被收敛成 `broken` 并记日志（`agent-preset-registry/src/index.ts:106`-`118`）。`session/create` 能证明“这棵树能起一个 Agent”，不证明工具面。
3. **实际工具面**：`request/header` 的 `tools` 由 `buildRequest` 写入（`packages/core/agent-loop/src/agent.ts:616`-`699`；字段定义 `packages/core/session/src/types.ts:241`-`247`）。它是**每次请求**的快照，能回答“这一刻模型看到了哪些工具”，也能发现“声明了但没注册/被遮蔽”的差异。
4. **行为**：真模型探针要写清假设与判据（例如“委派前是否加载了 policy skill”“选的通道是否符合合同”），一次只证一个假设；失败/未触发如实记。
5. **呈现**：UI 的正确性由“数据是否正确 + 呈现是否符合金样”两部分组成；金样只冻结后者。

## 行为层要跑两遍：强制与自然

同一个行为假设至少要两种输入：

- **强制型**：在提示里明确要求“用 X 通道 / 委派给 Y”，用来证明**链路能通**（工具、寻址、深度的组合没问题）。
- **自然型**：只给任务，不点名通道或 worker，用来证明**提示面内化**（模型自己会选对）。

混跑会把两类故障混成一类：强制型失败是“链路坏了”，自然型失败是“提示面歪了”。报告时分开写，不要把一次混合会话当成两层都通过。

## UI 是验收面（模式，不是 DSH 的词）

DSH 没有“验证 UI”的引擎能力；能成立的做法是把呈现当成独立一层：先做**纯视图模型**（输入是已持久的事实），再做**静态渲染**，最后接**真页面/金样**。三层各自可测：

- 纯模型：给定事件序列，节点/边/状态是否正确（不需要浏览器）。
- 静态渲染：给定模型，文案与布局是否符合金样（不需要模型）。
- 真页面：槽位、页签、滚动与状态是否被破坏（需要宿主/浏览器，单独门禁）。

这条顺序的价值在于：UI 失败时能立刻分清是“数据错”还是“呈现错”，而不是在一个端到端测试里猜。

## 与 `test-strategy/` 的分工

[`test-strategy/`](../../test-strategy/00-map.md) 拥有整个仓库的七层**证据形态**与门禁（哪些测试证明什么、mock 放在哪、CI 怎么防假绿）；本页只拥有**委派面**的四层，回答“这条链的组合/工具面/行为分别怎么证”。要写仓库级测试政策或门禁，去 test-strategy；要证明一条委派链，读本页。

## fake 只证明 fake

用 fake provider / fake service 做的测试证明的是**接线与映射**（消息是否投递、字段是否透传、错误是否正确分类），不证明真实 provider 在场、不证明模型会行动。典型事故：隔离组里拿不到真 provider，fake 版门禁仍然绿，于是“真实装配缺失”被隐藏。判断规则：**这条断言里有没有一个“真实存在”的前提？** 有，就必须加一层真入口证据。

## 单次 ≠ 稳定

一次真跑成功只证明“这条路径在这次输入下走通了”，不证明：
- 模型下次还会这样选；
- 并发/深度上限下的行为；
- 冷恢复后的边与终态。

所以行为证据要标“单次/多次”，并把稳定性问题单列为待证，而不是用一次绿掩盖。

## 一张检查清单（给新能力用）

| 你要证明 | 最少需要的层 |
|---|---|
| preset 里确实有这行、这个配置 | 1 |
| 这个 preset 能挂起来、依赖齐全 | 2（真入口） |
| 子代理这次真的拿到了这些工具 | 3 |
| 模型会在该委派时委派、在结束时收尾 | 4（按假设多次） |
| 用户在页面上看到的状态不是编的 | 3 + 5（数据 + 呈现分开证） |

## 失败面

| 假绿 | 真相 |
|---|---|
| “挂载绿了，所以行为对” | 挂载只证明组合能起；模型行为在另一层 |
| “dump 和预期一致，所以工具面对” | dump 只证声明；实际面在 `request/header.tools` |
| “fake 测试过了，所以 provider 没问题” | fake 绕过了真实 provider 的能力位与错误路径 |
| “跑了一次真模型，绿了” | 单次证据；稳定性未证 |
| “金样过了，所以数据对” | 金样冻结呈现，不校验数据来源 |

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/preset/agent-preset-registry/src/index.ts:106`-`118` | 声明校验、激活失败收敛为 `broken` |
| `packages/preset/agent-preset-registry/src/definition.ts:5`-`11` | 声明面字段全集 |
| `packages/boot/app-boot/src/config-schema/document.ts:158` | `--dump-config` 的语义（入口列表 YAML） |
| `packages/core/session/src/types.ts:241`-`247` | `EpochHeader.tools`：实际工具面 |
| `packages/core/agent-loop/src/agent.ts:616`-`699` | `request/header` 的构建与写入 |
| `packages/subagent/subagent/src/catalog.ts`、`descriptor.ts` | 会话侧可回读的子代身份 |
| `packages/core/system-prompt/src/index.ts:293` | 空文本不进 prompt（能力域证据的一个细节） |
