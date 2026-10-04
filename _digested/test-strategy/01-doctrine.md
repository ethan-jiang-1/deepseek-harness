# 01 — 思想与成文政策：55 行宪法与它的九条教义

> 本篇消化 DSH 的成文测试政策 `docs/testing.md`（55 行、9 节、中英双语），以及 root `AGENTS.md` 里思想级的测试条款。分层细节见 [02](./02-tiers.md)，规矩与所有权见 [03](./03-rules-ownership.md)。

## 现象是什么：一个把测试政策压缩到 55 行的仓库

DSH 仅单元测试就有 1893 个 spec 文件，而它的测试政策只有 55 行。开篇一句自述定位：

> "How this repo tests, tier by tier, and the rules that keep a green suite meaningful."

注意定语——规则的目标不是"让测试变多"，而是 **keep a green suite meaningful（让绿有意义）**。整份文件九节，每节回答一个"绿了为什么还不算数、怎么才算数"的问题。

政策本身遵守一个三层分工：**政策写在哪**（`docs/testing.md`，每层每条规则）、**命令写在哪**（root `AGENTS.md` 的 Commands 节）、**理由写在哪**（linked Agent Notes，如 `.agents/notes/implemented/testing/2026-06-19-real-api-e2e-ci.md`）。政策-命令-理由各只有一个家，这是 DSH 文档体系"one home per fact"纪律在测试上的体现。

测试指导在文档体系里的完整分布（硬事实）：

| 层 | 文件 | 职责 |
|---|---|---|
| 政策 | `docs/testing.md` | 分层定义 + 跨层规则（本篇）；唯一测试策略权威，词预算 1,350 词列管（`wc -w` 口径） |
| 常备条令 | root `AGENTS.md` + `packages/AGENTS.md` | 每个 session 都要在上下文里的测试条款（链接到政策）；包层复述 plugin exports / `ctx.get` / REAL-composition / HMR disposal |
| 所有权 | `snapshots/AGENTS.md` | 快照树的归属规则（[03](./03-rules-ownership.md)） |
| 可靠性纪律 | `.agents/skills/dsh-ci-test-reliability/` | 并发/资源/teardown/flake 分类（[06](./06-reliability.md)） |
| 命令选取 | `.agents/skills/dsh-pre-push-checks/` | 推送前选哪些检查跑（[03](./03-rules-ownership.md)） |
| 决策记录 | `.agents/notes/implemented/testing/`（**33 篇**） | 每条政策"为什么这么定、放弃了什么、要什么验证"的 rationale |
| 事故 | `docs/postmortem/`（**4 篇**：0001 ACP default export / 0002 `!!js` / 0003 替代服务器 / 0004 Landlock 误分类） | 政策的反面教材；唯一允许 war-story 叙事的层 |
| 操作步骤 | `docs/cookbook/` | 加包/加工具/加格式版本时的步骤与验证命令；`reviewing-persistence-type-changes` 进一步要求 type acknowledgement 的 `verification` 字段填真实 vitest 证据——"A recording command's `ok: true` does not replace these checks or the owner's behavior and migration tests" |
| 局部契约 | `packages/test-support/*/README` 等各包 README | 该工具/该包的测试语义与已知限制（[07](./07-infrastructure.md)） |
| vendored 修改 | `vendor/README.md` | 每条本地修改注记覆盖它的 DSH 包测试；同步流程要求重跑 `pnpm run test && pnpm run build` |

一句话职责表：**policy 定"什么算证据"；skill 定"怎么写得可靠、怎么选命令"；note 定"为什么这么定、放弃了什么"；cookbook 定"做某类变更时的步骤"；README/树规则定"这个工具/这棵树的具体规则"；vendor/README 定"每条 vendored 修改由哪些测试覆盖"；postmortem 定"哪类漏网之鱼催生了哪些护栏"；AGENTS 层定"每个会话必须记得的几行"。** `testing.md` 是枢纽：每个 tier 链到 owning note，每条规则链到 rationale；postmortem 0001 同时向上滋养 policy 层（with-key 冒烟主张、"test the real entry path"）与 `packages/AGENTS.md` 常驻层（plugin exports 形态、`ctx.get`）——事故教训被制度化成两层常驻规则。

## 九条教义逐条消化

以下每条：原文关键句（英文短引）→ 说了什么 → 为什么这么定（解释）→ 落在哪里。

### 1. Tiers——分层总纲

政策正文第一节就是分层表：Unit / Coverage gate / Real-API e2e / Owner-local expected output / Performance benchmarks / Snapshot / Web browser snapshot，七层。每层一句话说清"证据是什么、入口命令是什么"。逐层深挖见 [02](./02-tiers.md)。

### 2. How specs execute——执行环境的不变量

> "Forked workers run several spec files at once … the self-hosted runners share one host and one volume. **Only the process is isolated: ports, predictable paths, external namespaces, and inherited children are not.** Own each acquired resource through its teardown, and read a spec that passes only when it runs alone as **a defect in the spec rather than an unstable runner**."

说了什么：CI 的并发模型只隔离进程，不隔离端口、可预测路径、外部命名空间、继承的子进程；每个测试对它获取的每个资源负责到 teardown；**"单跑才绿"被定义为 spec 自身的缺陷**，不许赖 runner。

为什么（解释）：DSH 的 CI 用共享 host/volume 的 self-hosted runner 跑大量并发 job，任何"我占了这个端口/路径/名字"的隐式假设都会变成别人的偶发失败。把"单跑才绿"定性为 spec 缺陷，是把 flake 的责任单向压给测试作者；DSH 的解法是**纪律条文 + 技能**而不是隔离基建。展开见 [06](./06-reliability.md)。

### 3. The with-key policy——"推理在这里是便宜的"

> "**We are DeepSeek — do not ration real-API tests.** A no-key test proves plumbing; only a with-key run proves the agent works against a real model."

> "Highest-value are **smoke tests** that boot a shipped `dsh` profile, send one prompt, and check the world — they catch the 'green unit tests, broken product' class that mocks cannot"（出处事故：`docs/postmortem/0001-acp-default-export-drops-inject.md`，事故原话："The bridge was completely non-functional in production despite **178 green unit tests and 100% line coverage**."）。

> "Self-skip keeps secretless CI and keyless contributors unblocked; **it is not a cost signal**."

说了什么：真 API 测试不设限额；无 key 的测试只能证明管道通，有 key 的运行才能证明 agent 对真模型工作；最高价值的形态是"启动一个 shipped profile、发一条 prompt、检查世界"；各 suite 无 key 自跳过，且自跳过被明确定性为"不是成本信号"——别因为"反正会 skip"就少写。

为什么（解释）：这是**模型厂自研仓库的立场**——推理成本内部化，"确定性离线仿真"的边界被收窄到最小（只 LLM/网络/时钟），预算押在"对真模型冒烟"上。理由仍然是：**测试测的是契约，不是模型智能；而对 DSH 来说，"产品对真模型工作"本身就是契约的一部分。**

### 4. Prefer the real implementation over a mock——mock 只放边界

> "Mock only the expensive or non-deterministic boundary (LLM adapter, network, clock); keep everything downstream real. A hand-rolled stand-in proves the bridge moves bytes, not that the shipping tool behaves as asserted."

> "Bridge tool-call tests keep the real tool registry and pipeline behind the scripted mock model: `makeBridgeHarness()` mounts the loop, session store, tool registry, and JSONL persistence with a `MockAdapter` as the only mock"（`packages/acp/acp/tests/harness.ts`）。

说了什么：mock 白名单只有三类——贵（LLM adapter）、不确定（网络）、不可控（时钟）；边界下游全部用真实现。样板是 ACP 的 `makeBridgeHarness()`：整个 loop、session store、tool registry、JSONL 持久化都是真的，唯一 mock 是 scripted MockAdapter。恢复类测试还要求：按 step 区分 pre/post-chunk 失败、证明失败的 chunk 不产生消息或工具副作用、覆盖 exhaustion / cancellation / policy composition / persistence / status / wire counts / transport-closing idle timeouts / shipping Loader composition。

为什么（解释）：边界画得极窄（只 LLM/网络/时钟），因为边界下游就是它要交付的产品本体。**mock 边界的宽窄 = 你对哪一层拥有交付责任**——DSH 对从 loop 到持久化的每一层都承担交付责任，所以每一层都用真实现。

### 5. Verify the world, not the self-report——验证世界，不是自报

> "An e2e assertion re-runs the command or re-reads the file externally; **a keyword probe on the agent's own output lets a cheating agent pass.** Assert untouched files are byte-identical."

说了什么：e2e 断言必须从外部重跑命令或重读文件；对 agent 自己输出的关键词探测等于给作弊者放行；声称没动的文件要断言字节级相同。配套资源纪律：资源在测试里创建、在 `afterEach` 释放（覆盖 failure/retry/timeout）；共享 fixture 放普通的 `tests/harness.ts`，**绝不 import 另一个 `*.e2e.ts`**——import 一个 spec 会重复注册它的 `describe`、重复真实 API 调用。

为什么（解释）：这条把"被测对象可能在撒谎"写进了断言方法论——agent 说"我写好了文件"不算数，文件系统说了才算；**不信任系统对自己的报告，证据必须落在被测系统之外**。

### 6. Test the real entry path——测真实入口

三层含义（原文依次展开）：

- **产品可见插件必须有 non-unit 的 REAL-composition 测试**："Hand-built `ctx.plugin(...)` suites are insufficient: boot test-only `cordis.yml` through Loader and app/process, mock only external services or nondeterministic inputs, and assert model-visible request/log, durable state, or user-visible output."——手搭插件组装的测试不算数，必须真的走 Loader 启动一份 test-only `cordis.yml`，断言到 model-visible 请求/日志、durable 状态或用户可见输出。
- **guard 必须真的挡得住回归**："A guard only guards if the regression fails it."——对无 `inject` 的 bundle/composition 插件，default export 替换掉必需的 named exports 时 Loader smoke 依然绿；所以要求 `expect('default' in mod).toBe(false)` + `unwrapExports` round-trip 断言，并且 "**prove it: introduce the regression, watch red, revert**"——守卫测试要先亲手制造回归看它变红。
- **real entry path = published artifact**："a package `bin` runs built `lib/bin.js` under plain `node`, exposing failures tsx masks (settle races, module resolution, swallowed load failures)."——bin 入口要在 built 产物上用 plain node 跑；保持 built smokes 绿；配置真缺失时必须断言非零退出。（注：政策此处点名的 `packages/examples/*/tests/built-bin.e2e.ts` 在基线树中已不存在，属文档过期；实际 built 冒烟清单见 [02](./02-tiers.md) 的"集成测试去了哪里"。）

为什么（解释）：这条是 postmortem 0001 的制度化答案。该事故里**两个加载路径 bug 同时漏网**：① 多余的 `export default` 让 Loader 的 `unwrapExports` 解析到裸函数、丢弃整个模块命名空间（inject/name/Config 是兄弟命名导出）→ fiber 空 inject → apply 首行就炸；② 可选服务经 traceable shadow 的属性读取走 ancestor-only fiber walk，而进程内测试的 flat root context 恰好掩盖了这个拓扑。事故复盘的原话点睛："no test exercised the plugin through its real load path or its real call topology"、"Coverage proves lines *ran*; it says nothing about whether the feature works *the way it ships*"。护栏里最硬的一条：无 key e2e 走真实 stdio 子进程，**且验证过恢复 `export default` 时它会变红**——prove-it-red 的实例。单测/tsx 启动会掩盖三类问题：settle 竞态、模块解析差异、被吞掉的加载失败。**"能跑"的证据要取自发布形态，而不是开发形态。**

### 7. Test resolution: source plane only——源码平面解析

> "Every vitest config points vite-tsconfig-paths at `tsconfig.base.json`; bare workspace imports resolve to `src`, never through package `exports` to built `lib/` — **stale artifacts there load a second copy of module singletons.**"

说了什么：所有 vitest 配置统一把 workspace 裸导入解析到 `src`（源码平面），绝不走 `exports` 到 built `lib/`；built 产物只允许显式消费（lib-mode 子进程、built smokes）。

为什么（解释）：**模块单例双份**是 all-plugin 注册表架构特有的坑——如果测试同时加载了 src 和 stale lib 两份模块，注册表、事件表、常量会出现两个互不相识的副本，故障形态诡异。源码/工件两个平面绝不混（DSH 工程纪律 "Source plane vs artifact plane, never mixed"）在测试解析上的投影。

### 8. Test subprocess launch modes——子进程启动模式

三条：CI 与带构建的 lane 上，所有 profile / Cordis-config 子进程一律走 shared dual-mode launcher 从 built `lib/` 启动，"Do not hand-write `--import tsx` for these subprocesses"；不加载 Cordis 的协议/OS fixture 用可擦写 `.ts` 直接 Node 跑（不带 tsx、不带 root paths map）；只有主题就是 source-path resolution 的测试才允许选 `src`，且必须把这份契约写进测试。

为什么（解释）：子进程怎么被启动本身就是被测面之一（见 02 篇"启动模式即证据"）。统一 launcher 让"从 lib 启动"成为可审计的默认，而不是每个测试自己拼启动命令。

### 9. When a snapshot test is required——快照强制条件

> "Every non-trivial model-, protocol-, or human-visible change adds or updates a keyless recorded-session scenario **in the same PR**; package, e2e, mock-only, and rationale evidence does not replace the assembled transcript."

说了什么：非平凡的模型可见/协议/人类可见改动，必须同 PR 增改一个 keyless 录制会话场景；四面分布在 `snapshots/{session,sdk,acp,web}/`；Web 渲染可显式借用另一场景的 canonical session；非录制会话驱动的期望输出留在 owner 本地 `tests/expected/`，不用 `*.snapshot.ts` 后缀；`packages/test-support/session-snapshot` 拥有共享存储规则；agent-loop / session-lifecycle / `SessionEventMap` 改动要同 PR 更新 TypeScript 与 Python 两个 SDK 投影；新 capability seam 与生命周期/转录变体要在**计划时**点名所有需要的层。

为什么（解释）：快照场景是"组装后的完整转录"这一证据形态的唯一来源——包测试、e2e、mock 证据、rationale 都不能替代它（"does not replace the assembled transcript"）。机制展开见 [04](./04-snapshot-machinery.md)。

## 贯穿性思想（解释）

九条之上还有几条不在 `testing.md` 标题里、但贯穿全部测试文档的思想：

1. **证据匹配面，不是测试金字塔。** root `AGENTS.md`："Match evidence to the surface: focused behavior tests, model/user-output snapshots, `doc-sync` for docs, built smokes for published paths, and real-API e2e for providers." 分层的合法性来自"改动的面 ↔ 证据的类型"这张映射表，而不是覆盖率金字塔教条。DSH 文档几乎不用 integration test 这个词——"集成"被拆成 REAL-composition、profile 集成、built smokes、dual-mode 子进程这些更精确的证据类型。
2. **测试描述行为，不描述正确性。** root `AGENTS.md`："Tests describe behavior, not correctness. Change obsolete behavior with its tests; explain why in the PR." 测试是行为规范的可执行记录；行为变了测试跟着变，"过时断言"不是资产是负债。
3. **覆盖率是死代码探测器。** "An uncovered line is often dead code the gate flags for deletion, not a missing test to bolt on. Line coverage is necessary, never sufficient — it proves lines ran, not that the feature works as shipped." per-file 100% 的意图是逼出死代码，不是逼出补测试。
4. **全量套件是 CI 的事。** "Never default to the full suite or repeat a passing check for commit or push." 本地按面选最小证据（`dsh-pre-push-checks` 技能落实），CI 拥有穷尽覆盖与平台矩阵；`test:coverage` 而不是 `test` 才是 CI 覆盖率门。
5. **计划时点名测试面。** root `AGENTS.md`："Plan unit, e2e, and snapshot coverage for capability seams, lifecycle paths, and transcript output; include missing snapshot-harness support in the same change." 测试面是设计的一部分，不是事后补的。
6. **夹具跨平台、修夹具不修归一化器。** "Fixtures replay on macOS/Linux; fix fixtures, not normalizers."——快照归一化器不许为了凑通过而改，保护的不变量是：**不许把证据磨到跟 bug 吻合。**

## 源码锚点

- `docs/testing.md`——本篇逐条对应的原文（55 行，值得整读）
- root `AGENTS.md`——Commands 与 Testing policy 两节
- `packages/acp/acp/tests/harness.ts`——`makeBridgeHarness()`，"唯一 mock 是 MockAdapter" 的样板
- `docs/postmortem/0001-acp-default-export-drops-inject.md`——"green unit tests, broken product" 出处
- `.agents/notes/implemented/testing/2026-06-19-real-api-e2e-ci.md`——with-key e2e 进 CI 的决策记录
- `.agents/skills/dsh-pre-push-checks/SKILL.md`——本地最小证据选择

## 最小例证

1. **立场句式**：读 `docs/testing.md` "The with-key policy" 一节的第一句——以 "We are DeepSeek" 开头。测试政策以厂商身份开头，这本身就是"模型厂自研仓库"的证据。
2. **唯一 mock 数得出来**：读 `packages/acp/acp/tests/harness.ts`，数 `makeBridgeHarness()` 里 mock 的数量——只有 `MockAdapter`；loop / session store / tool registry / JSONL persistence 全是真实现。
3. **prove-it-red 可检索**：在测试里 grep `expect('default' in`——43 个 spec 文件含 `expect('default' in <module>).toBe(false)` 守卫（如 `packages/lsp/tool-lsp/tests/load-path.spec.ts:14`，配套 `unwrapExports` 往返断言）。注意字面串 `expect('default' in mod)` 只出现在 `docs/testing.md` 政策原文里——各测试用被测模块的变量名。
4. **自跳过不是成本信号**：任选一个 e2e suite，看它无 key 时的 self-skip 分支——skip 分支旁边没有任何"记录预算"或"减少调用"的注释，与"do not ration"一致。
