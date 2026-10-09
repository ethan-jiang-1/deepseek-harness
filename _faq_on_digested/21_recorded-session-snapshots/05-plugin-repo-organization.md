# 05 · 插件仓该怎么组织：一条按需启用的阶梯，而不是一棵照抄的树

![插件仓的证据阶梯：上半是 L4 的五条触发条件与不建的判据；下半是从 L0 导出形态守卫、L1 行为 spec、L2 HMR-safety、L3 REAL composition 逐级抬高的四阶（默认都做），到按需启用的 L4 行为回归证据面（会话回放或渲染期望，落点见正文）；底部是六个不要做](./figures/ladder.svg)

## 一句话推荐

**默认不做 L4；做了之后，独立插件仓选顶层 `snapshots/` 证据面（形状二），`tests/trajectory/`（形状一）只是它的降级形态——不是并列选项。** 前四阶（导出守卫 → 行为 spec → HMR → REAL composition）默认都做；L4 按触发条件启用，因为它贵在维护（有人重录、有人看 diff），而不贵在建。

**为什么形状二更好**（两个真实插件仓——`ai_dsh_deep_research` 与 `ai_dsh_assitant`，仓外路径仅参考——在互不知情的情况下都收敛到它，这不是巧合）：

1. **边界是功能性的，不只是文档。** DSH 的指令装载器**按目录链加载 `AGENTS.md`**：agent 进了 `snapshots/` 才读它的边界规则。放在 `tests/trajectory/` 里，这层约束对 agent 不生效，只靠人记得去读。
2. **与主仓形状同构，识别零成本。** 从 DSH 世界来的 agent / skill 看到顶层 `snapshots/` + 一场景一目录 + manifest，不需要任何解释就知道这是什么、怎么读。
3. **第二类证据出现时有归口。** 渲染期望、会话回放、将来的探针/视觉证据同属「录一次、重放比对、diff 人工过目」，一个边界统管；散在 `tests/` 里则每加一类都要重新立一次规矩。

它的代价只有两样：一页边界声明，加一句防撞车声明（见形状二）。

## 推荐阶梯

| 阶 | 证据 | 默认 | 成本 | 样板（主仓） |
|---|---|---|---|---|
| **L0** | 导出形态守卫：`expect('default' in mod).toBe(false)` + `unwrapExports` round-trip | **必做** | 一行断言 | `packages/lsp/tool-lsp/tests/load-path.spec.ts:15` |
| **L1** | 行为 spec：挂**真依赖服务**，只把最外层包装换成假体；从注册后的真入口调 | **必做** | 低 | `packages/todo/tool-todo/tests/tool-todo.spec.ts` |
| **L2** | HMR-safety：dispose 你的 fiber，断言贡献消失 | **必做**（有注册表贡献时） | 低 | `tool-todo/tests/projection.spec.ts` |
| **L3** | REAL composition：真 Loader 读临时 `cordis.yml` boot 你的插件，断言 Config 的**两脸**（模型可见措辞 + 接受行为） | **必做** | 中 | `tool-todo/tests/loader-composition.spec.ts` |
| **L4** | **行为回归证据面**：会话回放（轨迹夹具）或渲染期望，无 key 重放比对 | **按需** | 中高（要维护） | `snapshots/session/deepseek-messages-invalid-tool-history/` |

L0–L3 的细节与为什么这么排，见 [_digested/test-strategy/08](../../_digested/test-strategy/08-plugin-testing.md) 的台阶模型和 [10 的检查单](../../_digested/test-strategy/10-plugin-testing-checklist.md)；本文只补 L4 的外部版本。

## 采用次序：先做什么、后做什么

1. **先 L0–L3，后 L4。** 轨迹/渲染期望是最后一阶。跳过前四阶直接建 L4，等于用最贵的证据补最便宜的缺口——L3 挡住的事故比 L4 多得多（[04](./04-what-its-worth.md) 的校准表：四篇 postmortem 里三篇靠的是 L0/L3/e2e）。
2. **进 L4 时，按「model-visible 面住在哪」选第一类证据。** 面在 **UI 渲染**（toolview / 面板 / 状态页签）→ 先建**渲染期望**（实测 ~15s/次拍摄+比对，最便宜的 L4）；面在**组装**（prompt / 工具 schema / 注入正文）→ 先建**会话回放**（证据在日志的请求侧，keyless 就能产出）。两类都有 → 渲染期望先行，会话回放按触发条件来。
3. **边界先立，内容按触发来。** 第一类证据落地当天就写边界（`AGENTS.md` + 状态 `README.md`），不等树满——边界是整棵树里最便宜的东西，后补的边界永远补不齐历史。
4. **每个守卫先红后绿才算存在。** 验收仪式：污染期望 → 比对红、exit 1 → 还原 → 复绿。没红过的守卫按不存在算（自审时连「恰好覆盖」式的恒真断言都要抓出来）。
5. **重录优先于刷新。** `recording: live` 声明下，旧 canned 输出 + 新注入正文拼在一起的夹具是失真的；`--update-expected` 只许重写金标准、不许放宽比对或加归一化凑绿。
6. **类目只在有持久消费者时建。** 不预建空桶——探针、视觉、归档桶都等真实消费者出现再立（主仓同款纪律：`snapshots/AGENTS.md:3`）。

## L4 的触发条件（命中任意一条才建）

| 触发 | 为什么只有它能覆盖 | 建什么 |
|---|---|---|
| 你改了**模型可见面**：工具描述、system prompt 注入、工具 schema、投影事件 | 只有真夹具能钉住「组装之后实际发出去的东西」（[01](./01-why-dsh-needs-it.md)） | 一条 **`live`** 轨迹 + 对 `request/header` 的断言 |
| 你修了一个**只在真模型流下出现**的 bug | 固定流之后仍复现 → 是产品 bug；这是唯一稳定的复现方式 | 一条 **`authored`** 轨迹 + 独立 oracle |
| bug 属于**日志重建不出来**的失败：提供方抛错 / 取消 / 挂起 / 注入重试 | 持久化的结算里根本没有这些信息 | `authored` 轨迹 + `replay.override.json`（见 [06](./06-bug-reproduction-playbook.md)） |
| 你在跟 DSH 版本升级，想确认插件行为没漂 | 同一份轨迹在新版本上重放 = 世代模型的私人缩小版 | 一条 `live` 轨迹 |
| 你的模型可见面主要是 **UI 渲染**（toolview / 面板 / 状态页签） | 此时比会话回放更贴的是**渲染期望**：真渲染一次的 DOM 证据比对 | 一个渲染期望场景（harness + `expected.dom.json`） |

**不建的判据同样重要**：实现细节重构、纯 UI 样式、只影响内部 API 的改动、以及**涉及并发子代理委派**的场景（回放按 first-call-order 绑定脚本，并发会不确定——这是回放器自己声明的已知限制）。

## 落点选型：三种情况

| 你的仓 | 落点 |
|---|---|
| **方案 B**：长在 DSH monorepo 里 | **都不建**。直接按主仓形状往 `snapshots/session/<你的场景>/` 加场景、用 `cordis.snapshot.yml` patch 挂插件（见文末衔接） |
| **方案 A / C**：独立插件仓，且由 agent 运营（有根 `AGENTS.md` 指令链） | **形状二**：顶层 `snapshots/` 证据面 |
| 小仓、单包、非 agent 运营，且确定不会长出第二类证据 | **形状一**：`tests/trajectory/`；一旦第二类证据出现，升级成形状二（边界先立） |

### 五条不变量（无论哪种落点）

1. **边界声明在先。** 这棵树收什么、不收什么，有一条写下来的边界：单元 / CLI / generator 的纯函数期望**跟 owning 层走**，集中目录只收真正同类的证据（主仓同款原则：`snapshots/AGENTS.md:3`）。
2. **声明真的驱动一个消费者。** manifest 被代码读取并校验，缺字段/串角色/路径越界 fail-loud——不是给人看的摆设。没有消费者的声明只是第二份会腐烂的状态。
3. **判据集由消费者固定。** 声明只能确认、不能削减比对面；「能少比就少比」正是主仓 postmortem 0002 的事故形态。比对面每一条独立报告、独立可红。
4. **录制身份跟着夹具走。** 录制时的本仓 commit、vendor pin、录制时间落进 manifest 或 README；缺失如实标 `unknown`，不许猜填。没有它，半年后没人知道这条轨迹对着哪个代码版本才成立。
5. **归一化只抹确实挥发的身份。** 端口、临时路径这类真挥发的可以 token 化，其余（SHA、URL、日期、正文）逐字比对；为凑绿新增归一化就是事故源。

### 形状一 · `tests/trajectory/`

```text
your-plugin-repo/
├── src/
├── cordis.yml                          # 你日常开发就有的配置
└── tests/
    ├── load-path.spec.ts               # L0
    ├── <plugin>.spec.ts                # L1
    ├── projection.spec.ts              # L2
    ├── loader-composition.spec.ts      # L3
    └── trajectory/                     # L4：命中触发条件才建
        ├── README.md                   # 每条轨迹：来源 / 触发什么 / 防什么 / 怎么重录
        ├── record.patch.yml            # 录制层 overlay：compression: none（见 03）
        ├── replay.patch.yml            # 回放层 overlay：关真 provider + 挂 llm-replay（见 03）
        ├── record.ts                   # 录制入口（要 key，人工跑，不进 CI）
        ├── replay.e2e.ts               # 无 key 回放 + 断言（进 CI）
        └── fixtures/
            ├── <feature-slug>/
            │   └── session.jsonl       # live：真跑一次留下
            └── <bug-slug>/
                ├── session.jsonl       # authored：手写的最小轨迹
                ├── replay.override.json  # 可选：抛 / 挂 / 重试
                └── world.expected.json   # 可选：独立于转录的外部事实
```

`world.expected.json`（涉及文件系统/进程副作用时）很值——一个 `{"confineCalls":1,"spawnCalls":0}` 式计数器比任何转录文字都可靠（主仓样板：`snapshots/session/background-confinement-failure/workspace.expected/confinement-audit.json`）。

### 形状二 · 顶层 `snapshots/` 证据面

```text
your-plugin-repo/
├── AGENTS.md                           # 根指令链
├── cordis.yml
└── snapshots/
    ├── AGENTS.md                       # 本树边界：收什么、不收什么（进目录才装载，功能性）
    ├── README.md                       # 状态页：哪些类已建、哪些按触发条件等待；声明本 manifest 非 DSH schema
    ├── replay/<face>/                  # 会话回放类（触发后建）
    │   ├── snapshot.json               # 本仓自己的 manifest：case 集 + 录制身份
    │   ├── <case-slug>/session.vN.jsonl
    │   └── ui.expected.md              # 可选：渲染金标准（独立编写才算 oracle）
    └── web-face/<scenario>/            # 渲染期望类（面在 UI 时先建的那类）
        ├── snapshot.yml                # 场景契约：profile / 录制 / 比对面 / runner
        ├── expected.dom.json           # DOM 证据（不是像素；PNG 只作人工审阅副页）
        └── README.md                   # 怎么跑 / 比对什么 / 成本台账 / prove-it-red 记录
```

两个真实实例（仓外路径，仅参考）：`ai_dsh_deep_research/snapshots/`——四角色组装面回放，五条判据由消费者固定、覆盖自守双向报红、录制身份逐 case 校验、工具 schema 全等比对；`ai_dsh_assitant/snapshots/`——`web-face/` 两个渲染期望场景（实测成本台账 + prove-it-red 记录在案），**会话回放刻意未建**，升级触发条件写进 README。

形状二的**代价**要直说：命名会与主仓撞车（`snapshot.yml` / `snapshot.json`）。从 DSH 世界来的 agent 会带着主仓 schema 的先验来读它——README 必须显式声明「本 manifest 不是 DSH 的 `snapshot.yml`，字段由本仓消费者定义」，否则先验错位就是误报源。

## 明确不要做的六件事

1. **不要照抄主仓的治理**：corpus policy、corpus gate、四面分工、record/refresh 写回——那是「一个仓库集中维护 210 个场景」的配额与所有权制度（[04](./04-what-its-worth.md)）。**自定义一份 manifest + 自己的消费者是对的**（形状二正是这么做的）；错的只是把主仓的规模制度搬进一个三五条轨迹的仓。
2. **不要依赖 `@deepseek-ai/dsh-session-snapshot`。** 它 `import vitest`、面向语料级守卫；插件仓需要的是 `@deepseek-ai/dsh-llm-replay`（见 [03](./03-what-a-plugin-can-reuse.md)）。
3. **不要手写模型 chunk 当唯一真相。** 主仓明确否决过「手写 `llm.json`」，理由是这样夹具就不是系统的真实产物了（[01](./01-why-dsh-needs-it.md)）。手写应该只用于**最小复现场景**，不是常规做法。
4. **不要把用户日志直接提交进仓。** 用 `authored` 重写最小版本（[03](./03-what-a-plugin-can-reuse.md) 的 `live` / `authored` 一节）。
5. **不要只有轨迹、没有语义断言。** [04](./04-what-its-worth.md) 的事故就是「套件为回归背书」。
6. **不要指望它替代 with-key e2e。** 轨迹证明「组装转录没变」，不证明「对今天的真模型还能工作」。

## 和已有组织方案怎么衔接

- **[FAQ 13 专家插件 repo 组织](../13_expert-plugin-repo-organization/answer.md)** 回答的是「repo 放哪、DSH 源码怎么引、UI 怎么分层、spec 流程怎么走」；本篇是它没覆盖的一格：**测试证据里最贵的那一阶在外部仓怎么落地**。四个方案（A pinned submodule / B 树内 / C 纯外部 / D marketplace）都适用同一套 L0–L4 阶梯，落点按上表三情况选。
- **方案 B 的 L4 直接按主仓形状写**：在 `snapshots/session/<你的场景>/` 下加场景、在 `cordis.snapshot.yml` 里用 patch 挂你的插件（主仓做法见 [08](../../_digested/test-strategy/08-plugin-testing.md) 台阶五与 [09](../../_digested/test-strategy/09-plugin-testing-playbook.md) 末节）。**过渡路径**是从私有轨迹「翻译」成主仓场景，而不是把私有目录搬进去。
- **[_dsh_plugin_agent_ready_development](../../_dsh_plugin_agent_ready_development/README.md)** 讲的是独立插件仓如何沿用 DSH 的开发机制（意图 / owner / 证据 / 交付判断）；本篇可以看作它在**测试证据**这一格上的补充。

## 这一篇要你记住的

- **次序**：先 L0–L3 后 L4；进 L4 先按「面住在哪」选渲染期望或会话回放；边界先立、内容按触发来；每个守卫先红后绿；重录优先于刷新；类目按消费者长。
- **落点**：独立 agent 运营仓选形状二（顶层 `snapshots/` 证据面），形状一是降级形态，方案 B 两个都不建。不变量是五条性质，不是路径。
- 只依赖 `dsh-llm-replay`，不依赖 `dsh-session-snapshot`。
- 独立 oracle 和语义断言不是可选项——它们是这条轨迹值不值得存在的前提。
