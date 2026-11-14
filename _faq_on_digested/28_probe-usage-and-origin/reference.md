# 附录 · 全部出处

> 本篇的每一条结论对应的仓库路径与一手材料。行号随树漂移，故多以「文件 + 节名 / 符号名」定位；确需行号的地方按当时读数给出。核验基线见 [核验基线登记](../00-baseline.md)。

## 一、探针是什么 / 它不是产品机制（[01](./01-what-a-probe-is.md)、[03](./03-why-the-word.md)）

| 结论 | 出处 |
|---|---|
| 产品树无「探针」机制；同名的是运行时自检 | `ctx.pluginRegistryProbe` 与 `registryProbe*` 配置——[`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md) 的 seam 表、[`docs/config-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md) 的 Registry-probe 一节、[`docs/subsystems/boot.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/boot.md) 的 `ctx.pluginRegistryProbe` 节 |
| 「并发比较公共安装源响应」 | [`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md) 的服务表行 |
| Sandbox 功能性探针仲裁多 runner 链 | [`docs/subsystems/sandbox.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/sandbox.md) 的首段合同句 |
| `landlock --probe` 是启动器自检模式 | `packages/experimental/webworker-runtime/src/shell/process/landlock.ts`（`parseLandlockArguments`，`{ kind: 'probe' }`） |
| 进程存活探针（`process.kill(target, 0)`） | `packages/boot/plugin-manager/src/run-tree.ts` 的 `run-tree` JSDoc |
| 「探针不是门禁」的一句话定位 | 仓外 `ai_dsh_bsimulation` 的 AGENTS 目录表与 `probes/README.md` 首行「Probes are not gates」 |
| 「探针结果是观察，不是成功主张」 | 仓外 `ai_dsh_bsimulation/probes/README.md` 末行 |

## 二、与测试的分工（[02](./02-probe-vs-tests.md)）

| 结论 | 出处 |
|---|---|
| 五层测试分层（unit / coverage / e2e / expected / snapshot / web） | [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md) 的 Tiers 一节 |
| 「覆盖率证明行跑过，不证明按发布形态工作」 | 同上，Coverage gate 条 |
| 「只有真夹具能钉住组装后的提示词与工具集合」 | [`.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md) |
| 「绿单测、坏产品」事故起点 | [`docs/postmortem/0001-acp-default-export-drops-inject.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md) |
| 「验证世界，不是验证自报」 | [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md) 的 Verify the world, not the self-report 一节 |
| 快照是变更探测器、不是正确性 oracle | [FAQ 21](../21_recorded-session-snapshots/04-what-its-worth.md) |

## 三、探针为什么成立的三条不变量（[04](./04-principles.md)）

| 结论 | 出处 |
|---|---|
| root 不变量 Model-visible ⟺ logged | 根 [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md) 的 Conventions 一节；展开见 [`.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md) |
| `request/header` 记录 envelope 与组装后的工具 schema；`foldRequestHeader` 取最新快照 | [`docs/subsystems/session.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md) 的 The request header event: `request/header` 一节 |
| 渲染后的 system prompt **不在** header，而是 surface 节点 0 的 `system/message` | 同上 |
| 会话是 append-only 的事件日志，消息历史由日志派生 | [`docs/subsystems/session.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md) 首段 |
| 给 session log 瘦身会破坏可重建性（已否决） | [`.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md) |
| `dsh-llm-replay` 是发布包，用录制日志替掉真 adapter | [`packages/test-support/llm-replay/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/README.md) 的 Summary 与 Mounting it 两节 |
| `replay.override.json` 表达日志重建不出来的四类失败 | 同上，Summary 一节 |
| 快照同时是回放输入与期望输出 | [`snapshots/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md)；[FAQ 21](../21_recorded-session-snapshots/02-what-a-trajectory-is.md) |

## 四、分类与写法（[05](./05-kinds.md)、[06](./06-how-to-write-one.md)）

| 结论 | 出处 |
|---|---|
| 探针回答「did it actually ride in the request?」，循环六步 | 仓外 `ai_dsh_assistant/.agents/skills/repo-live-probe/SKILL.md` |
| 「不调工具、只用眼前的上下文回答」的取证写法 | 同上，第 3 步与 Hard-won details |
| 「工具使用会藏住常驻状态」 | 同上，Hard-won details 末条 |
| one-shot 只有一个请求 | 同上，Hard-won details 首条 |
| 会话按差分取、不按「最新」取 | 同上，第 4 步 |
| 探针补丁必须镜像它替代的那一行；行 id 写错的静默失效 | 仓外 `ai_dsh_assistant/dev/probes/session/preset-runner-replay.patch.yml` 文件头注释 |
| 裸脚本塞进 `file` 导致整行不 activate | 同上 |
| session 探针表分「Proves / Does not prove」两列 | 仓外 `ai_dsh_bsimulation/probes/session/README.md` 的探针表 |
| `BLOCKED` = exit 2，不冒充 PASS | 仓外 `ai_dsh_assistant/dev/probes/web/README.md` 的「前置：三类探针」节 |
| 只留一张图（成功或失败，绝不并存） | 仓外 `ai_dsh_bsimulation/probes/README.md` 的 evidence rules |
| 一次性探针进「战役」档、不进命令清单 | 仓外 `ai_dsh_assistant/dev/probes/web/README.md` 的「战役一次性探针」节 |
| 能进场景的不新立脚本 | 同上「加一个新探针」节 |
| 判据会被校准、旧判据会把正确行为判红 | 仓外 `ai_dsh_company/probes/session-context/date-rule-probe.mjs` 文件头 |
| 三档退出码 0 / 1 / 2 的含义 | 同上；`ai_dsh_company/probes/team/claim-race-probe.mjs` 文件头 |
| 通用驱动与仓库场景分两层、驱动可整段拷走 | 仓外 `ai_dsh_company/docs/guides/cdp-probe.md` 的「架构（两层）」表 |
| 证据目录固定 + `verdict.json` + 截图 + console | 同上「本仓用法」节 |
| 按意图选入口（先查组合，再验装配，再验 Web，最后真模型） | 仓外 `ai_dsh_assistant/docs/dev.md` 第六节 |
| 红线先行 / 场景先行 | 仓外 `ai_dsh_company/docs/guides/dev-loop.md` 的「④ 证据是什么」行 |

## 五、探针族的毕业路径（[04](./04-principles.md)、[08](./08-real-repos.md)）

| 结论 | 出处 |
|---|---|
| L0–L4 证据阶梯，L4 按触发条件启用 | [FAQ 21](../21_recorded-session-snapshots/05-plugin-repo-organization.md)，图见 `21_recorded-session-snapshots/figures/ladder.svg` |
| 「同一 model-visible 面第三次靠手工探针钉回归」是建基线的触发条件 | 同上（05 的触发条件表） |
| 探针产物与快照产物形状相同，差别只在有无基线 | [FAQ 21](../21_recorded-session-snapshots/04-what-its-worth.md)、[08](./08-real-repos.md) 末节 |

## 六、探针与探索式测试（[09](./09-exploratory-testing.md)）

> 本篇是本目录里**唯一一节外部概念**：「探索式测试」不是 DSH 术语，也不是 DSH 对待测试的分层；下面只列 DSH 侧可核的落点。

| 结论 | 出处 |
|---|---|
| 「验证世界，不是验证自报」（探索取证的根本依据） | [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md) 的 Verify the world, not the self-report 一节 |
| postmortem 0002：确定性转录被当成合法行为，刷新把它固化成正确 | [`docs/postmortem/0002-js-expression-disabled-filesystem-tools.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md) 第 19、34、46 行 |
| 语义不可能必须由**独立于期望输出**的断言捕获 | 同上，第 46 行 |
| `UNKNOWN_TOOL` 语义守卫（主仓已内置） | `packages/test-support/session-snapshot/src/suite.ts` |
| 独立 oracle：`workspace.expected/` 终态树，录制流程不得改写 | [`snapshots/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md) |
| 录制前先确认这次运行是对的 | [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)； [FAQ 21/04](../21_recorded-session-snapshots/04-what-its-worth.md) |
| postmortem 0003：agent 用裸 Vite 糊弄验收，轨迹是**事后取证**而非回归测试 | [`docs/postmortem/0003-web-agent-gui-feedback-loop.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0003-web-agent-gui-feedback-loop.md) |
| 探索用到的四个接口：日志 / 请求侧 / 渲染 / 副作用 | 分别见本篇第一、三节，与 [07](./07-worked-examples.md) 的四个实例一一对应 |
| 造条件的三条真实写法（视口 / 真并发 / 注入 hang・throw） | [FAQ 21/05](../21_recorded-session-snapshots/05-plugin-repo-organization.md)；仓外 `ai_dsh_company/probes/team/claim-race-probe.mjs` 、`ai_dsh_assistant/dev/probes/web/` |
| 判据校准与被推翻的记录 | 仓外 `ai_dsh_company/probes/session-context/date-rule-probe.mjs` 文件头 |

## 八、沉淀成资产（[11](./11-what-probes-deposit.md)）

> 这一节的读数全部来自 `ai_dsh_company` 的 `entry-probe` 链，是一个仓的具体做法，不是 DSH 规范。

| 结论 | 出处 |
|---|---|
| 五层沉淀物的真实文件与行数 | `run/entry-probe.patch.yml`（14）、`tools/lib/entry-probe.mjs`（129）、`snapshots/probes/entry-probe/<日期>/`、`checks/smoke/entry-probe-smoke.mjs`（163）、`tests/harness/session/entry-probe.spec.ts`（189，16 个 `it()`） |
| 判据被抽成纯函数，探针与单测共用 | `tools/lib/entry-probe.mjs` 的 `ENTRY_QUESTIONS` / `evaluateEntryProbe()` / `assertCodingBaseline()` |
| 标本带来源 SHA-256 与 session id | `snapshots/probes/entry-probe/2026-10-27/answer-*.md` 头部 |
| 「语义审阅：未执行，不代表零过期或零矛盾」 | 同上头部 |
| 真模型档自己声明 `不进 pnpm test` | `checks/smoke/entry-probe-smoke.mjs` 文件头第 2–6 行 |
| 测试从事实源现拉答案，不抄第二份 | `tools/lib/entry-probe.mjs` 的 Q4 注释；`entry-probe.spec.ts` 的「AGENTS.md 簿记可解析」用例 |
| 16 个用例逐条对应真实事故 | 同上 spec，尤其 `expectedTag`、`缺题蒙混`、`JSON 语法错误报位置` 三条 |
| 场景必须声明 `workspace.expected/` 是 authored fixture，不是独立 oracle | `snapshots/README.md` 的规则一节 |
| 「能进基线的不另立脚本」 | [08](./08-real-repos.md)；仓外 `ai_dsh_assistant/dev/probes/web/README.md`「加一个新探针」节 |

## 七、图清单

| 图 | 出处篇 | 画的是什么 |
|---|---|---|
| [one-page.svg](./figures/one-page.svg) | [00](./00-ladder.md)、本页 | 黑箱链 + 五个下钩位置 + 一次运行的三种归宿 |
| [ladder.svg](./figures/ladder.svg) | [00](./00-ladder.md) | 五级台阶，每级只多一件事，含两支可跳过的旁支 |
| [probe-evidence-layers.svg](./figures/probe-evidence-layers.svg) | [02](./02-probe-vs-tests.md) | 四层证据各连什么、三个空洞、三条不变量、毕业路径 |
| [anatomy-of-a-probe.svg](./figures/anatomy-of-a-probe.svg) | [07](./07-worked-examples.md) | 日志时间线上被打的四个点 |
| [scenario-directory.svg](./figures/scenario-directory.svg) | [07](./07-worked-examples.md) | 一个场景目录与四道毕业门 |
| [exploratory-loop.svg](./figures/exploratory-loop.svg) | [09](./09-exploratory-testing.md) | 六步探索循环 × 四个观测接口 × 搜索空间边界 |
| [exploration-steps.svg](./figures/exploration-steps.svg) | [09](./09-exploratory-testing.md) | 六步逐步展开：你自己做的 / 探针交给你的 / 没有探针会怎样 |
| [llm-in-the-loop.svg](./figures/llm-in-the-loop.svg) | [10](./10-probe-and-llm.md) | 七步责任带（LLM 蓝 / 探针绿 / 判定橙 / 人灰）+ 两个消费者对比 + 83 条实测 |
| [deposit-layers.svg](./figures/deposit-layers.svg) | [11](./11-what-probes-deposit.md) | 一次运行掉出的五层资产 + 观测与资产的界线 + 16 个用例的来源 + 四道闸 |

## 证据薄弱处

- **四个插件仓的规模读数是本机静态计数**（`ls`/目录清点），不是产品指标，也会随各仓演进而变化。它们的作用是证明「不同的人独立收敛到同一套分层」，不是给出可引用的常量。
- **外仓探针文件头里的花费数字**（`≈$0.05`、`≈$0.1–0.2`）是各自仓的当日读数，本篇只引用其量级判断（真模型探针按次计费），不作为定价依据。
- **「探针」一词的跨领域词源**（硬件 / kprobe / liveness probe）是常识性归纳，非 DSH 文档内容；本篇用它说明「这个词不是 DSH 造的」，不涉及任何产品行为。
- **11 节的五层沉淀链是单一仓的具体做法**（`ai_dsh_company/entry-probe`），行数是 2026-11-12 的静态读数；它证明「一个探针会长出这五层」，不证明每个仓都长成这样。
