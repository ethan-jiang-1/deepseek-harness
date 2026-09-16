# Answer 08 · seam 成熟度：算出来的可替换率，和被它推翻的三个印象

## 方法与基线

机制结论以 [`_digested/`](../../_digested/00-index.md) 全部专题为底（当前基线 `dsh-v0.1.5-rc.2`，commit `fb2c4b9e69`）；本文最初写作时的消化基线是 `0.1.1-rc.2`（`b150a55…`），当时的行级漂移（如 `ctx.agentTeams`、`ctx.authorization` 这些晚于旧基线才出现的行）在 0006 同步后已并入基线。量化底座是 freshness-gated 的生成目录 [`docs/capability-seams.md`](../../docs/capability-seams.md)，数字一律以点数当时的生成表为准。原文写下的两次读数是"当前树读数（commit `3b1a213e9e…`，即 08/09 两篇 FAQ 提交的父提交）"与编辑复核点 `bb90e237f2…`：两处实测都是 28 条 seam、11 条 P≥2、39.3%、15 条单 Provider、2 条零 Provider、3 条零 Consumer，对这两个时点而言并没有写错。本次上游同步复核（2026-09-16）发现：**这些读数在 OLD 基线 `a66e470204`（dsh-v0.1.2-rc.1）时就已经全部过期，而 OLD 与 NEW 的 seam 层读数完全一致**——29 条 seam、12 条 P≥2、14 条单 Provider、3 条零 Provider、2 条零 Consumer。也就是说，这是本文写作时点与 OLD 之间就已存在的**存量失真，不是 `a66e470204 → fb2c4b9e69` 本次跨度引入的**；跨度内只动了 core（39 → 42，seam 层五个数字 OLD = NEW）。下表已按 **NEW 基线读数（commit `fb2c4b9e69`，dsh-v0.1.5-rc.2，2026-09-16 实测）** 重写。

生成表在 NEW 基线共 **72 个 `ctx` 服务**，按其 role 列拆分：**42 core + 29 seam + 1 bundle**（`ctx.agentLoop` 是 bundle）。seam 才是"可替换能力"，本文只在 29 条 seam 上做成熟度计算，core 只在下文"诚实边界"里单独处理。

## 判据：供给侧与需求侧是两个独立的问题

- **供给侧（换得掉吗）**：Provider ≥2 且真实可互换。第二个真实 Provider 出现、Consumer 一行不改，是商品化的直接读数——E2B 组合即范例：`fs-e2b` 与 `subprocess-e2b` 注入同一 `ctx.e2b`，Consumer 不改换整个执行世界（[`capability-seams/00-map`](../../_digested/capability-seams/00-map.md)）。
- **需求侧（换给谁）**：Consumer 覆盖的面数——模型工具、host wire（Remote / gateway 走浏览器）、hooks、内部组合（如 `bash-sandbox` 消费 `subprocess`）。面数 ≥2 说明该能力不是某个单点的私产。
- **L0 可解性**：patch 一行换 provider 常见需求即可解决，说明 Definition 已稳定到不需要新代码。
- **三条反向信号**：**自消费 seam**——Provider 与唯一 Consumer 是同一个包，等于还没有市场；**零 Provider seam**——Definition 立了、连默认实现都没有，API 形状仍可能在第一个实现落地时被改；**零 Consumer seam**——生成表 direct consumers 列为空（`sessionTelemetry`、`sessionTitle` 两条），两条各有出口（telemetry 离进程、title 经 projection），所以只算"待核查"信号，不作赤字结论；同组原先也为空的 `fileReferences` 在 OLD 之前已有 direct consumer `api-session-controller`。
- **一条单位修正**：`ctx.approval` 不能用 Provider 数衡量。answerer 是 `approval/request` waterfall 的 listener，不注册成 Provider（生成表 P 列为空正是这条修正的读数）；它的成熟单位是 answerer 多样性 × 问题形状渲染，见"三个推翻"第 1 条。

## 全景：29 条 seam 的 P/C 表（NEW 基线读数 `fb2c4b9e69`，2026-09-16 实测）

P = implementation 包数，C = direct consumer 包数，按生成表 implementations / direct consumers 两列逗号切分计数；下表按 P 升序、C 降序排列。

| seam | P | C | 标注 |
|---|---|---|---|
| `ctx.approval` | 0 | 3 | 零 Provider（answerer 走 waterfall，不作 Provider）；消费在工具与 ACP 面 |
| `ctx.authorization` | 0 | 1 | 零 Provider（凭据获取流，晚于基线） |
| `ctx.userQuestions` | 0 | 1 | 零 Provider（实现者在 UI 前端） |
| `ctx.sessionPersistence` | 1 | 7 | 单 Provider（`4553c9d957` 移除 sqlite 后端后只剩 jsonl），7 个消费方 |
| `ctx.attachments` | 1 | 4 | 单 Provider，4 个消费方（含 Remote 会话控制器与两个 llm 适配器） |
| `ctx.jobs` | 1 | 4 | 单 Provider，消费全在模型工具一个面 |
| `ctx.credentials` | 1 | 3 | 配置面（`api-settings-controller` 的 Remote 投影 + 两个 llm 适配器） |
| `ctx.settings` | 1 | 3 | 同上 |
| `ctx.sandbox` | 1 | 2 | 组合件（bash/terminal 的 confine 前包装） |
| `ctx.sessionQuery` | 1 | 2 | 单后端（sqlite） |
| `ctx.workflowEngine` | 1 | 2 | 单引擎（worker-thread） |
| `ctx.compaction` | 1 | 1 | **自消费：P 与 C 同一包** |
| `ctx.fileReferences` | 1 | 1 | 单 Provider，消费方 `api-session-controller`（Remote 面） |
| `ctx.lsp` | 1 | 1 | 单后端（stdio host） |
| `ctx.spillStore` | 1 | 1 | 单后端（local） |
| `ctx.terminals` | 1 | 1 | 单后端（bash PTY） |
| `ctx.sessionTelemetry` | 1 | 0 | 单后端，输出离开进程 |
| `ctx.subprocess` | 2 | 7 | 组合件：本地/e2b，7 个消费方全在过程内 |
| `ctx.codeRuntime` | 2 | 1 | 双后端（worker-thread + 实验 Python），`b75eec0967` 加入 |
| `ctx.deepseekLlmApiExtensions` | 2 | 1 | 原文整行漏收的 seam（OLD 时已是 2/1） |
| `ctx.directoryPicker` | 2 | 1 | GUI-only seam（native/browse） |
| `ctx.skills` | 2 | 1 | 双 provider 但**语义不可互换**：`skill-filesystem` 是通用加载器，`skill-badge` 只提供一条官方 badge 技能且出货行 `disabled: true`（`packages/bundle/base/cordis.patch.yml:281`） |
| `ctx.storage` | 2 | 1 | 商品化（json/sqlite 并列注册） |
| `ctx.sessionTitle` | 2 | 0 | 双 provider，经 projection 间接消费 |
| `ctx.shell` | 3 | 4 | 商品化（bash-local/sandbox、pwsh-local） |
| `ctx.llm` | 3 | 2 | 含 1 个测试支持包（见下） |
| `ctx.fs` | 3 | 1 | 商品化（local/sandbox/e2b），消费 1 面 |
| `ctx.web` | 4 | 1 | 同构三搜索 + 一 fetch（见下） |
| `ctx.subagents` | 6 | 3 | 数量最多，语义只有三种位置 |

## 可替换率 = 41.4%，量"能不能换"，不量"换出差异"

12 / 29 = **41.4%**（P≥2 的 seam 占全部 seam 的比例）。它只回答一个问题：某条缝今天有没有第二个真实 Provider 可以无痛替换。至于"换掉之后有没有实质差异"，是另一个问题，没有干净的单数答案——下面四笔账说明的就是这个，它们不改变"能换"的分子，只改变"换了值不值"的解读：

- `ctx.llm` 3 个里 `llm-replay` 是测试支持包——删掉它仍有 deepseek / pi-ai 两个生产 Provider，能换，但生产选择不是 3 个；
- `ctx.web` 4 个是三个同构搜索 API + 一个 fetch，同一失效模式——能换，但换不出差异化；
- `ctx.subagents` 6 个按执行位置只有三类语义（进程内 spawn / fork、进程外 ACP / Codex / Claude Code、SDK 驱动）——能换，但 6 不等于 6 种能力；
- `ctx.shell` 3 个里 pwsh 与 bash 是不同语族，不是同一功能的可互换替代——这条的"商品化"要单独打折。

**"能换"（41.4%）与"换了有差异"是两件事；后者明显更低，且不该被压成一个拿来当标题的百分数。** 分布同样重要：多 Provider 集中在执行世界、持久化与 subagents——最难抄的基础设施；**单 Provider 区才是产品差异所在。"饱和"与"值钱"不重合**：饱和区是竞争者最该重造的，单 Provider 区才是官方该投资的。

## 被数字推翻的三个印象

1. **审批不是"完整 seam 所以饱和"。** 生成表 Provider 列为空（0），direct consumer 3 个（`tools`、`tool-bash`、`acp`）——answerer 是 `approval/request` waterfall 的 listener（ACP 桥只为它自己的 agent 作答），GUI 的交互 answerer 经转发白名单里的 `approval/request` waterfall 到达浏览器（`packages/client/ui-approval/src/client/index.ts:90` 的 `ctx.remote.$on('approval/request', …)`，白名单条目见 `packages/api/remotes/src/remote-events.ts:18`），两者都不注册成 Provider。运行时语义确实完备——`asked/decided` 成对审计、缺 answerer fail-closed、取消语义与审计 id 认领（见 [`user-approval` README](../../packages/interaction/user-approval/README.md) 与 [`Remote 转发白名单`](../../packages/api/remotes/src/remote-events.ts)）——但人类形状只有 diff/文字问答，无表单、多选项、确认单渲染；且 README 明说 sibling listener 的先后顺序不是策略优先级机制，**多方审批编排（谁先看、谁能否决）今天不支持**。真正的缺口是交互形状与多方治理，不是"地基"。
2. **组织/团队编排不是空白。** `ctx.agentTeams`（core）+ tool 已进树（[note](../../.agents/notes/implemented/feature/2026-08-05-agent-teams.md)），晚于消化基线；第三方目录更早出现了该方向的项目。把它列进空白区是过期读数——上游每次同步后，空白判断必须随 `_change_log/` 重核。
3. **web 不算饱和。** 4 个 Provider 同构、Consumer 只有 `tool-web` 一个面、共用同一失效模式（vendor API 可用性）。准确评级是"商品化但无差异化"，不是"做完了"。

## 饱和区：再造它必输的四个组合事实

> 下面四项论证"竞争者要重造什么"，会带进 `sandboxPolicy`、`sessionProjections`、`ctx.agents` spine 几条 **core** 服务作为 seam 的相邻依赖——它们不计入 29 条 seam 的率，只说明重造这四块的门槛。

- **执行世界组合**（shell 3/4 + fs 3/1 + subprocess 2/7 + sandbox + sandboxPolicy）：resolve → confine → spawn 三层，本地 confinement 与 E2B 远程世界共存于同一套 Consumer（[`capability-seams/00-map`](../../_digested/capability-seams/00-map.md)、[`02-一次bash从tool到sandbox`](../../_digested/capability-seams/02-一次bash从tool到sandbox.md)）。再造一个 shell 家族等于重做它的全部消费方。
- **会话底座**（persistence 1/7 + query + projection + title）：竞争者要抄的不是某个存储后端，是 `SESSION_FORMAT_VERSION` 版本纪律、双 SDK 同 PR 投影、冷读阶梯（[`session-and-loop/00-map`](../../_digested/session-and-loop/00-map.md)）。
- **LLM 注册面**：三 wire 协议 + pi-ai 的 route-per-provider 配置，"换 vendor 是配置不是代码"已在 FAQ 03 实证（[FAQ 03](../03_model-vendors/answer.md)）。再造是重写适配层，边际为零。
- **四入口复用 spine**：CLI / Web / ACP / JSON-RPC 共用 `ctx.agents`，ACP 与 SDK 只是投影取舍不同（[`surfaces/02`](../../_digested/surfaces/02-acp与jsonrpc.md)）。

## 缺口区：按信号强度排序的 backlog，每行写明缺什么

1. [缺 Definition+Provider+Consumer] **渠道/通知——三个角色全都缺，且碎片化已经发生。** 全仓库无 IM/email channel 包；`schedule` 明说 session-local delivery only（[README](../../packages/schedule/schedule/README.md)）。外部实测：第三方为同一能力造了 **≥8 个互不兼容的实现**——三种 Telegram 桥、微信（含"聊天/监控/审批"）、飞书、9 渠道大杂烩 `dsh-im`，装法还不统一（`dsh plugin add` 与 `npx github:… install` 并存）。**无官方 Definition 的代价不是没人做，是市场各发明一遍互不互换的协议**（证据见 [research.md](./research.md)），这是全部缺口中信号最强、且已出现负外部性的一条。
2. [缺 Definition（整条 seam）] **长期记忆——官方 seam 为零，却是第三方最热的品类。** `ctx` 服务里没有面向模型的记忆 seam（只有 storage/spill/sessionQuery 等底层）；外部互竞记忆产品至少 5 个（EverOS、MemOS、ReMe、memsearch、OpenViking），外加上下文看板。最热的第三方品类恰好长在官方最空的缝上：要么官方立 Definition 收敛，要么默认让生态各自为政。
3. [缺 Consumer] **审批的人类形状与多方编排——缺 Consumer 面。** 运行时完备（上文），生成表列的 3 个 direct consumer（`tools`、`tool-bash`、`acp`）都在工具执行与自动化桥面，缺的是表单/多选项/确认单渲染器与 answerer 顺序语义；第三方已在用聊天做审批（research.md 渠道条），形状需求正在被市场自行定义。
4. [不缺角色，缺转正] **E2B 转正——Provider 齐、缺转正，且沙箱速成商品。** 三包仍自述实验品（[组 README](../../packages/e2b/README.md) 的现行措辞是 ephemeral、experimental、默认不启用，各包 deferred work 仍写 "this POC"）；seam 已通，差的是生命周期、模板、部署平台。外网读数：E2B $21M、Daytona $24M 融资后，市场已把 E2B/Daytona/Modal 当逐项比价商品——**自营沙箱不是资产，seam 保持供应商中立才是**；"转正"的真实价值是再添一个可替换 Provider 的成熟样本（[证据](./research.md)）。
5. [缺 Provider＋持久层] **workflow 持久化——缺第二 Provider 与持久层。** P=1（worker-thread），无跨会话可恢复的流程状态；而 Temporal 围绕 durable execution 两年两轮融资（$1.72B 估值 → $300M Series D, 2026-02）——这个缺口外部已按独立生意在下注（[证据](./research.md)）。
6. [缺 Provider（host 侧）] **MCP host 侧——整包缺，但"宿主"已被中性化。** 只有 [`mcp-client`](../../packages/mcp/mcp-client/README.md)（把外部 server 工具以 `mcp__…` 挂进 `ctx.tools`）。MCP 已捐赠给 Linux Foundation 治理的 Agentic AI Foundation，~10k server 且 tool-poisoning 实锤——真实差一点不在"宿主"：**经 `ctx.tools` 注册的 MCP 工具自动落在 model-visible ⟺ logged 不变式下，第三方工具免费获得审计**，这是纯客户端给不了的（[证据](./research.md)）。
7. [缺 Consumer] **反馈回路——缺 Consumer。** `messageFeedback` 的反馈不回流进对话，评价→偏好→prompt 治理缺最后一段。
8. [缺 Provider] **authorization 第一个 Provider。** 0 Provider 的新 seam（凭据获取流），Definition 尚未被任何实现压过。

## 诚实边界

1. **"一切皆插件"不递归到底**：Cordis 根 Context、Boot、Loader 先于插件树存在，核心下沉成组合内核而不是消失（[`harness-idea/07`](../../_digested/harness-idea/07-boundaries-costs-fit.md)）。
2. **插件化 ≠ 安全**：`cordis_define`/`cordis_run` 是 opt-in、bash-equivalent trust，同进程代码挡不住直接 import Node API（[`harness-idea/05`](../../_digested/harness-idea/05-dynamic-legibility.md)）。
3. **model-visible ⟺ logged 是硬税**：任何让模型看见的新能力都要配日志重建规则与新的 `SessionEventMap` 成员（[`session-and-loop/00-map`](../../_digested/session-and-loop/00-map.md)）。
4. **core 不是天花板**：42 个 core 里有两类——单一实现的 core 服务（如 `tokenMeter`、`toolResultPruner`：都是公开 ctx 键，唯一消费方是 `compaction-basic`，见 `docs/capability-seams.md:481-482`）与"还没人要求换"的候补 seam。生成器不区分这两类，只能按 role 列与各自 README 自述读；饱和/缺口判断只对 29 条 seam 有效。

## 度量：数字怎么来的，下次怎么自动来

P/C 从生成表 implementations / direct consumers 两列按逗号切分计数，即得 41.4%、14 条单 Provider、3 条零 Provider（`authorization`、`userQuestions`、`approval`）。四个已知坑：provider 计数会掺进测试包与同构包（所以 41.4% 只能读作"至少能换"的下界，不能读作"已商品化"）；consumer 面数需要按消费包所属面二次分类，表列给不出；direct consumers 列为空不代表没人用（`sessionTelemetry` 的输出离开进程、`sessionTitle` 经 projection 被间接消费）；行集随上游漂移（`agentTeams`、`authorization` 是晚于消化基线的两行实例，`deepseekLlmApiExtensions` 则是原文整行漏收的一条 seam）。建议方向：把 provider 角色与 consumer 面分类并入 [`scripts/gen-doc-graphs.ts`](../../scripts/gen-doc-graphs.ts) 的输出闸门，让"可替换率"变成每次 rc 同步自动重算的一行数字，而不是一次性手工点数。
