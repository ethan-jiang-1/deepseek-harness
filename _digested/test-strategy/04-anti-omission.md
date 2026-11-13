# 04 — 防漏：测试资产如何保证"不漏东西"

> 本页回答本专题的第一问：DSH 不靠"多写测试"来防漏，而是把"漏"降解成**可见的红灯、显式的豁免、可见的跳过**，再加一个记住教训的回路。分层与数量见 [02](./02-tiers.md) / [03](./03-asset-census.md)；把这套机制落到一个新变更上的程序见 [05](./05-decision-procedure.md)。

## 一句话

测试资产不能证明"没漏"，只能让漏**可见、可判、可追**。DSH 的做法是把"够了没有"拆成六个互不替代的检查面——空间、执行、类型、入口、断言、可见性——再加一条复盘回路；每个面都有机械或半机械的载体，而不是靠作者自觉。

> 说明：「六面 + 回路」是本专题的归纳框架，不是 DSH 的术语；每个机制的原词、载体与出处见下表与文末源码锚点。

## 六个检查面 + 一个回路（硬事实）

| # | 机制 | 它把哪种"漏"变成什么 | 载体 |
|---|---|---|---|
| M1 | **空间完备**：后缀 + 目录唯一决定一个测试属于哪条车道 | "有一份测试没人跑" → 很难：常规后缀被 include/exclude 穷尽；新造后缀必须同时改配置，否则不会被任何车道选中 | 9 份根部 vitest 配置（8 份运行配置 + shared，[02](./02-tiers.md)） |
| M2 | **执行下限**：`packages/*/*/src` 每文件 100% statements/branches/functions/lines | "这行没测" → 红；确实不可达 → 进豁免账本（逐文件或逐包），带理由与移除条件 | `vitest.config.ts` 的 thresholds 与 exclude 清单 |
| M3 | **变更类触发**：某几类变更必须带某几种证据 | "忘了测这类东西" → 规则不允许：模型/协议/人可见变更必须同 PR 加强制快照；product-visible 插件必须有 REAL composition；每个 registry 必须有 HMR-safety；每条验收规则必须有负控 | `docs/testing.md`、`packages/AGENTS.md`、root `AGENTS.md` |
| M4 | **真实入口**：证据必须来自产品实际启动的那条路 | "测了个手搭的假货" → 可见：hand-built `ctx.plugin(...)` 明确不算组装证据；published artifact 走 built `lib/` + plain `node` | `docs/testing.md` "Test the real entry path" |
| M5 | **反自报**：断言验证外部世界，不验证被测者的自述 | "agent 说成功" → 不算：重跑命令、重读文件、断言未改动文件逐字节相同 | `docs/testing.md` "Verify the world, not the self-report" |
| M6 | **跳过可见**：跳过是空缺，不是通过 | "静默 skip" → 红：CI 把必需的 skipped job 判失败；缺 secret 的 preflight 硬失败；快照 CI 只读 replay | `.github/workflows/ci.yml`、`e2e.yml`、`vitest.snapshot.config.ts` |
| M7 | **复盘回路**：每次真实漏测都换来一条新守卫 | "同类漏再犯" → 有记忆：postmortem 列 guardrails，Agent Note 记决策，政策随之增长 | `docs/postmortem/0001`–`0004` + `.agents/notes/implemented/testing/` |

**探针在这套结构里的位置。** `probe` 本身不是测试资产，而是**证据选择器**：它决定这条用例跑不跑、这个文件豁免不豁免、这个平台要不要 skip。一旦选择器与它守护的判断不同源，就会出现"用例其实要跑、却被豁免掉"的假绿——所以 DSH 要求豁免探针跑的是用例自己的判据（[12](./12-probe-作为取证动作.md)）。这也是 M6 的一部分：跳过必须由**同一个**判据产生，否则"可见的跳过"仍然是错的。

## 从资产本身能读出的四件事（解释）

测试资产不只是"一堆测试文件"。在 DSH，资产的文件布局本身就是一份可读的制度：

1. **命名与目录 = 层与所有权。** 看到 `*.e2e.ts` 就知道它属于跨进程车道（真模型、built 产物或 Loader 冒烟都在这条车道，unit 不在）；看到 `snapshots/` 就知道它必须由录制会话驱动；看到 `tests/harness.ts` 就知道它是共享 fixture、刻意不被任何 include 选中（避免 import 一个 spec 却重复注册 `describe`、重复真实 API 调用）。文件名甚至被单独的门守护：`expected-filenames` workflow 禁止 `golden` 命名，要求改用 `expected` 一类准确术语——**命名即所有权**。
2. **豁免清单 = 已知空洞的账本。** `vitest.config.ts` 的 coverage exclude 不是"排除麻烦"，而是逐条列出为什么现在不测（多数逐文件，也有整包）：平台条件（Windows-only 代码在 Linux lane 盖不到）、GUI 债务（`TODO(gui)` 逐文件/逐目录列举）、外部执行面（Worker/浏览器/子进程里跑、v8 父进程覆盖看不到）。**一个豁免条目就是一条公开承认的空洞**；关键不是逐文件还是逐包，而是理由、影响面和移除条件是否写清——DSH 自己就有整包豁免（typert、self-modification、部分 client UI），但每条都有理由，部分还带 `TODO(...)` 移除条件。
3. **门注册表 = 什么被强制。** `scripts/run-gates.ts` 把"哪些检查、依赖谁、失败是否阻断"写成数据；CI 的 `all-checks-passed` 再把它收敛成 9 个必需 job。读这个注册表就能知道：在这个仓库里，"绿"具体由哪些证据组成。
4. **复盘引用 = 哪些资产是付过学费的。** `postmortem 0001` 被 `packages/AGENTS.md` 的插件导出规则与 `ctx.get` 规则直接回指；REAL-composition 规则和导出守卫测试是同一事故在测试面上的沉淀。读到这些规则就知道它们不是风格偏好，而是一次真实事故的化石。

## 每种漏的对应机制（对照表）

| 漏的类型 | 它长什么样 | 对应机制 | 为什么其他机制盖不住 |
|---|---|---|---|
| 代码没被执行 | 分支从未跑到 | M2 覆盖率 | 其他机制都不要求"每一行都跑" |
| 执行了但没断言 | 测试跑过、断言很弱 | M3 负控 + M5 世界验证 + 评审 | 覆盖率只证明"跑过" |
| 入口不对 | hand-mount 全绿、Loader 一装就崩 | M4 真实入口 | 进程内单测结构上看不见 Loader |
| 组装没测 | 单测绿、产品坏 | M3 强制快照 + M4 profile 测试 | 组件正确不等于组装正确 |
| 模型可见输出漂移 | 工具 schema / system prompt / 转录变了没人发现 | M3 强制快照 | 单元测试不断言完整转录 |
| 平台差异 | 只在 Windows/macOS 崩 | CI 平台矩阵 + 显式 platform skip | 单一平台证据不覆盖另一平台 |
| 外部世界没验 | agent 自报成功 | M5 反自报 | 断言自报永远会通过 |
| 假绿（跳过/刷新） | 全跳过显示绿；refresh 接受错误 | M6 跳过语义 + 人工 review | 没有可见性就无法区分"通过"与"没跑" |
| 同类复发 | 修完又犯 | M7 复盘回路 | 单次修复不改变下一次的行为 |

## 一个失败解剖：178 个绿测试与 100% 覆盖率（postmortem 0001）

这是本专题最重要的一条证据，因为它把"防漏"从口号变成了可验证的缺口分析：

- **事实**：ACP server 在真实编辑器连接瞬间崩溃（`cannot get property "agents" without inject`），而当时有 178 个绿色单测和 100% 行覆盖率。
- **为什么没抓到**：所有测试都通过一条不会触及**插件真实加载方式**和**服务真实解析方式**的路径挂载插件。两个 bug 分别藏在 `export default` 让 Loader 丢弃 `inject`、以及可选服务在 shadow 边界上的解析——这两条都不在进程内手搭的路径上。
- **补了什么**：keyless 的真实 Loader 覆盖（M4）、插件导出形态与 `ctx.get` 的包级规则（M3）、以及后续的导出守卫测试。覆盖率没有增加，增加的是**入口真实性**和**变更类规则**。
- **可迁移的结论**：M2 只能证明"代码被执行"，证明不了"产品被组装"。缺少 M4 时，覆盖率越高越危险——它给人一种"已经测过了"的错觉。

第二篇 postmortem（0002）补的是另一半：快照 refresh 把 `UNKNOWN_TOOL` 的失败转录接受成了新期望。修复不是"少刷新"，而是给文件系统场景独立的 `fs.cordis.yml` overlay、加 `verify-cordis-config` 静态门，并让快照工具在提交前拒绝 `UNKNOWN_TOOL` 结果（fixture 生产不等于正确性 review）。它说明 **M2+M3 也会骗人：一个确定性的错误转录仍然是错误**，所以 M5（验证世界）和 M7（复盘）必须同时在。

## 诚实边界：这套机制盖不住什么

- **覆盖率是必要非充分。** 政策原话："Line coverage is necessary, never sufficient — it proves lines ran, not that the feature works as shipped."
- **快照会固化错误。** postmortem 0002 证明：只要 refresh 被接受，确定性的错误就会变成"期望"。所以每个 diff 必须人工 review，且 mutating 场景的世界树由独立 oracle 比对、record/refresh 永不改写。
- **probe 可能比它守护的判断更宽。** 覆盖率豁免的 pwsh probe 必须与用例自己的跳过判据同源，否则会出现"用例其实要跑、却被豁免掉"的假绿（[12](./12-probe-作为取证动作.md)）。
- **语义正确性最终靠评审。** 所以 `dsh-code-review` 技能把 "Test strength"、"Negative controls"、"Real entry path"、"Transcript changes" 列为评审必查项（manual checks），而不是交给自动化门。

防漏因此不是某一条机制，而是**六个面同时存在、回路持续供血**：少一个面，就有一种漏法能穿过其余五个；少了回路，同类漏会在下一轮重演。

## 对插件项目的含义

你不需要复制 DSH 的资产规模，但可以复制这些面的**最小形态**：

| 面 | 插件仓里的最小形态 | 成本 |
|---|---|---|
| M1 空间 | `tests/*.spec.ts` / `tests/*.e2e.ts` / `snapshots/` 三个互斥目录，配置各自认领 | 一次配置 |
| M2 执行 | `src/**` 每文件 100%（或逐条列豁免与理由） | 持续成本，最高回报 |
| M3 类型 | 导出守卫、dispose 测试、REAL composition、模型可见变更配 transcript | 每个插件 3–5 个测试 |
| M4 入口 | 一份 test-only `cordis.yml` 走真 Loader；发布包加 built smoke | 一个测试 |
| M5 世界 | 断言文件/日志/持久状态，而不是返回值自述 | 写测试时的一句话 |
| M6 可见 | 缺 key/缺前置时跳过并打印原因；必需 job 的 skip 判失败 | 一次 CI 配置 |
| M7 记忆 | 每次线上/评审漏测，补一条永久回归测试并写进仓库规则 | 事件驱动 |

完整的采用阶梯与账本模板见 [15](./15-plugin-testing-contract.md)；把这套机制落到一次具体变更上的程序见 [05](./05-decision-procedure.md)。

## 源码锚点

- `docs/testing.md`——M2–M6 的政策原文（Tiers、Verify the world、Test the real entry path、How specs execute）
- `vitest.config.ts`——M2 的阈值、exclude 账本与豁免理由
- `.github/workflows/ci.yml` 的 `all-checks-passed`——M6 的 "skipped = failure" 语义
- `.github/workflows/e2e.yml`——M6 的 preflight 硬失败
- `snapshots/AGENTS.md`——M3/M5 在快照树上的所有权与世界树规则
- `docs/postmortem/0001-acp-default-export-drops-inject.md`、`0002-js-expression-disabled-filesystem-tools.md`——M4/M5/M7 的失败证据
- `.agents/skills/dsh-code-review/SKILL.md` 的 "Test strength / Negative controls / Real entry path / Transcript changes"

## 最小例证

1. **M1 可证伪**：把一个 `*.spec.ts` 改名 `*.e2e.ts`，它立刻从 unit 车道消失、出现在 e2e 车道——没有第三种归属。
2. **M2 可审计**：打开 `vitest.config.ts` 的 coverage exclude，绝大多数条目都能读到理由（平台、GUI 债务、外部执行面）；找不到理由的豁免就是缺口。
3. **M6 可验证**：读 `ci.yml` 的 `all-checks-passed`——`skipped` 与 `failure`、`cancelled` 一起判失败；跳过不是通过。
4. **M7 可追溯**：`grep -rn "postmortem/0001" packages/AGENTS.md docs/testing.md`——一条事故如何变成三条常驻规则。
