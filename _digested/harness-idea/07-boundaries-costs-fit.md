# 边界、成本与适用条件：原则与智能无关，形状与压力有关

## 重述前提

[`01`](./01-role-and-substrate.md) 的结论是：可参与性 = 参与规则被字面外置并可执行的程度，剩下的门槛是「识字」加一小撮有工具支持的判断。本页检验这个前提是否依赖「背后是 LLM」——结论是：**原则不依赖，形状依赖；形状同时依赖生产方式与组合压力。**

## 合同面被多重消费，LLM 只是其中一个消费者

![合同面：多个消费者，漂移先撞机器](./figures/contract-surface.svg)

「LLM 读懂」常被当成对合同面的一次测试。但更准确的说法是：**合同面从来不是只给 LLM 读的**。同一面被这些消费者同时消费：

- **编译器**：类型、`assertNever`、declaration merging——编译期拒绝；
- **门禁与生成器**：`verify-*`、freshness gates——提交前红灯，目录从源码生成；
- **双 SDK**：TypeScript 与 Python 都必须投影同一个 loop 与 `SessionEventMap`（[`2026-07-27-typescript-sdk-and-sdk-subagent-backend`](../../.agents/notes/implemented/feature/2026-07-27-typescript-sdk-and-sdk-subagent-backend.md)）；
- **harness 自身**：self-modification——agent 检视、挂载自己的插件（[`2026-07-08-self-referential-cordis-toolset`](../../.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md)）；
- **人类读者与 LLM 读者**。

这个结构带来一个比「LLM 探针」更硬的检验：**规则漂移会先撞上机器，而不是先撞上读者。** LLM 的可读性只是这个面完整性的一个读数，而且是个宽松的读数——LLM 读不懂只说明「参与规则不在系统里」；机器消费不到才说明「规则根本没法执行」。

## LLM 是合同面的探针之一

coding agent 是「没有免费部落知识通道」的读者的极端情形。这带来一个可检验的推论：

- 它能读懂 dsh 并做对，是合同面完整性的**强证据**——不是证明；
- 它读不懂的系统，不代表系统不好，只代表**参与规则至少没有以它能消费的形式完整外置**；模型能力、上下文预算和提示方式也可能是原因。

LLM 于是成为合同面的探针——之一，不是唯一，也不是最严格的。dsh 对 agent 可读不是巧合，也不是设计宣言，是生产方式的产物（[`01`](./01-role-and-substrate.md)）。

## 原则与智能无关

**原则**（把参与规则字面化、可执行化）的成立条件是「读者能读字面合同」——这个条件对任何足够强的 reader 都成立：

- 换更强的模型：合同面只会被读得更透；
- 换非 LLM 的读者（脚本、编译器、未来的自动化工具）：合同面同样可消费，因为它是字面结构，不是暗示；
- 换人类读者：照常成立，人类只是多了一条「问」的通道，用不用都行。

## 形状与生产方式有关，也与组合压力有关

**生产方式**塑形：gates over prose、Agent Notes 语料库、vendor 进树、skills，这些是 agent 写作主体留下的形状；`[推断]` 纯人类团队同样想外置知识，大概率不会长出 1486 个 note 文件和几十个 gate。

**组合压力**决定值不值：dsh 选择「组合一个运行时」而不是「扩展一个产品」。这个选择只有在多宿主、多 provider、会话级隔离、运行时装卸和第三方生态同时出现时才划算。`[外部观点]` lencx 与 Pi 的对比把这点说得最清楚：Pi 扩展一个产品，dsh 组合一个运行时；没有统一胜负，只有「你要承受哪种变化」。

所以准确的说法不是「与智能无关」，而是：**原则与智能无关；形状与生产方式有关；形状的性价比与组合压力有关。**

## 什么会杀死可参与性：反面清单

本页是 [`02`](./02-legibility.md) 与 [`03`](./03-paved-road.md) 的镜像。用这张表检验任何 harness：规则住在哪层、正确与错误路径的摩擦差多少、错误何时被发现。

| 杀死可参与性的设计 | 表现 | dsh 的反制 |
|--------------------|------|-----------|
| 隐藏默认值 | `?? default` 埋在 `run()` 里 | `resolve(request): Spec` 显式步骤；参数都是 `Config` 字段 |
| 部落知识 | 正确写法只在 review 口头传递 | `AGENTS.md` 字面规则；cookbook 范本；门禁强制执行 |
| 文档漂移 | 手抄 catalog、文档与源码各说各话 | 目录从源码生成 + freshness gate |
| 特殊案例 | 每加一个功能都要改 loop | 扩展表 + 四问路由：一切新行为先找扩展点 |
| 歧义 | 两个词指一个东西、两条路都能做 | glossary 一词一义；closed union；`assertNever` |
| 失败沉默 | 误配置静默跳过、错误离源头远 | fail loud at load；required-on-read；错误消息指明规则 |
| 反馈缺失 | 写错直到人类 review 才发现 | `verify-*`、per-file 100% 覆盖率、snapshot、运行时 invariant |
| 无范本 | 正确写法只存在于某个 300 行文件里 | `defineTool` 最小 shape；shell 三包生产级范本 |
| 判断二选一 | 正式注册与临时挂载是两种写法 | 注册即效果，只有一种生命周期写法 |
| 无元验证 | 门禁能被刷绿、测试相信自报 | 「guard 必须被负例证明」；verify the world；真实入口 smoke |
| 负知识缺失 | 被否方案和已知限制只在人脑里 | rejected notes；空 invariant 显式理由；README Known Limitations |
| 上下文预算爆炸 | 规则多到读不完、装不进上下文 | 规则分层 + 一个事实一个家 + `verify-doc-budgets` 字数预算 |
| 无基线漂移 | 判断不钉 commit，上游改了没法复核 | 本专题：全部判断钉 `528c682e…` 基线 + 证据锚点 |
| 分布洗钱 | 人类播种的洞察被磨成模型输出，出处丢失 | 本专题：判断标注出处（`[原文]` / `[源码]` / `[推断]` / `[框架]` / `[外部观点]`） |

## 用三个问题检验一个 harness

1. **规则在哪层？** 人脑（部落知识）→ 文档（可读不可执行）→ 系统（类型、表、门禁、运行时检查）。dsh 的答案：尽可能第三层，且系统层被多个机器消费者消费。
2. **正确路径与错误路径的摩擦差多少？** 差越大，读者越容易做对。dsh 的答案：关键分叉上有默认、显式和受检查的路径；替代路径也是被记录的选择，而不是隐藏岔路。
3. **错误何时被发现？** 当场（编译期 / load / 运行时检查）→ 提交前（门禁）→ review（以天计）→ 生产。dsh 的答案：当场 + 提交前 + 门禁自身被负例测试。

把这三个问题用在任何「对 agent 不友好」的系统上，答案几乎总是：规则在文档与人脑之间、正确路径与错误路径摩擦相等、错误在生产才暴露。这不是玄学，是知识外置程度的三个读数。

## 诚实成本：灵活性不是免费的

`[外部观点]` lencx 的成本清单比「规则太多」更接近代码现实，本专题逐条核对 dsh 侧证据：

| 成本 | 表现 | dsh 侧证据 |
|------|------|-----------|
| 静态代码 ≠ 实际系统 | import 图只说明可能性，最终拓扑要看 profile/patch/realm | `dsh --dump-config` 是排障第一证据；[`../composition/00-map.md`](../composition/00-map.md) |
| 动态依赖放大因果链 | provider 变化引发一组 consumer 重载，排障要看 fiber epoch 与收敛 | HMR 事务与生命周期测试；[`../composition/03-user-patch-hmr.md`](../composition/03-user-patch-hmr.md) |
| 可逆 ≠ 事务 | effect 能回收声明过的资源，不能补偿网络消息、文件写入、支付 | Cordis effect 语义；[`../cordis-runtime/01-五条原语对照源码.md`](../cordis-runtime/01-五条原语对照源码.md) |
| 插件化 ≠ 安全 | `inject` 约束 Context 使用，阻止不了同进程代码直接 import Node API | self-modification 明确是 opt-in、bash-equivalent trust；[`05`](./05-dynamic-legibility.md) |
| 元框架与本地分叉成为新核心 | Cordis 根、Loader、Boot 必须先存在；vendor 带本地修改与 sync 成本 | [`vendor/README.md`](../../vendor/README.md)；[`../cordis-runtime/04-vendor-本地修改.md`](../cordis-runtime/04-vendor-本地修改.md) |
| 性能代价仍缺少量化 | 没有运行时开销或大规模插件图的对照基准 | 本专题不补数字，只记为开放问题 |
| 外置本身有维护税 | 1486 个 note 文件、门禁、100% coverage、根 AGENTS 上下文预算 | 本页保留判断：可参与性 = 外置程度 ÷ 外置成本 |

成本不为零，dsh 的选择是把分母花在「机器可检查」上，而不是花在「人可读不可执行」的散文上。但这个选择只在组合压力足够大时划算。

## 「一切皆插件」的边界

「一切皆插件」适合描述 dsh 的应用能力组织方式，不适合当作递归到底的字面事实：Cordis 根 Context 在构造时直接建立根 Fiber、Reflect、Registry、Events 与 Logger service；Boot 与 Loader 也先于应用插件树存在。核心没有消失，而是从 Agent 业务逻辑下沉成了**组合内核**。`[外部观点]` 这个边界由 lencx 明确，本专题把它当作对 [`01`](./01-role-and-substrate.md) 的必要修正。

## 结论

- **原则**（字面化、可执行化）与智能无关；
- **形状**由生产方式塑形；
- **性价比**由组合压力决定；
- **LLM 可读**是合同面完整性的宽松探针，不是设计目标；
- **成本**来自同一套统一语义，可逆不等于事务、插件化不等于安全、静态代码不等于实际系统。

因此 harness-idea 的最终判断不是「所有 harness 都该学 dsh」，而是：**如果你的主要复杂度是组合关系，dsh 的形状值得学；如果只是想要一个清晰的 loop + 扩展 API，先学它的外置纪律，不必搬它的运行时。**

## 证据入口

- [`../capability-seams/00-map.md`](../capability-seams/00-map.md)（换 provider 不换 Consumer：合同在 Definition）
- [`../composition/00-map.md`](../composition/00-map.md)（不写代码的组合层：patch 与 `!!js`）
- [`docs/architecture.md`](../../docs/architecture.md)（扩展表：文档到规则的机器可查路径）
- [`2026-07-08-self-referential-cordis-toolset`](../../.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md)（harness 自身消费合同面与安全边界）
- [`2026-07-27-typescript-sdk-and-sdk-subagent-backend`](../../.agents/notes/implemented/feature/2026-07-27-typescript-sdk-and-sdk-subagent-backend.md)（双 SDK 投影同一 loop）
- [`2026-07-05-reconstructable-requests`](../../.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md)（「模型可见 ⟺ 已记录」作为设计决策而非纪律）
- [`../../AGENTS.md`](../../AGENTS.md)（不变量陈述与门禁清单）
- [`docs/AGENTS.md`](../../docs/AGENTS.md)（tier taxonomy：一个事实一个家；字数预算）
- [`../cordis-runtime/02-waterfall-与事件合同.md`](../cordis-runtime/02-waterfall-与事件合同.md)（waterfall 合同被违反时的行为）
- [`../composition/01-boot-时序.md`](../composition/01-boot-时序.md)（fail loud 的两段失败标签）
- [`2026-06-11-quality-gates`](../../.agents/notes/implemented/process/2026-06-11-quality-gates.md)（门禁成本的源头记录）
- [`../../_architecture_referenced/lencx/lencx-dsh.md`](../../_architecture_referenced/lencx/lencx-dsh.md)（成本清单、Pi 对比、一切皆插件边界的外部表述）
