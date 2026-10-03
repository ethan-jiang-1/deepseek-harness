# 02 — 测试分层全景：七层宪法层与广义测试面

> 本篇回答"DSH 有哪些测试层、每层测什么、怎么被选中"。分层依据见 [01](./01-doctrine.md) 的"证据匹配面"；快照机制深挖见 [04](./04-snapshot-machinery.md)，CI 编排见 [05](./05-ci-gates.md)。

## 现象是什么：不按"单元/集成/端到端"三分

`docs/testing.md` 的 Tiers 节定义了 **7 个宪法层**：Unit / Coverage gate / Real-API e2e / Owner-local expected output / Performance benchmarks / Snapshot / Web browser snapshot。root `package.json` 里还有约 15 个 test*/check* 脚本对应的**广义测试面**（web-perf、web-stress、gui、政策测试、文档门禁、平台矩阵……）。

关键的阅读姿势：**这不是经典测试金字塔的 unit/integration/e2e 三分法**。DSH 按两个轴分层——**证据形态**（assembled transcript？外部世界检查？built 产物冒烟？浏览器回放证据？性能预算？政策断言？）和**入口真实性**（src 就近单测？test-only cordis.yml 走 Loader？shipped profile？built lib？）。"integration test"这个词在 DSH 文档里几乎不存在，它被拆成了更精确的证据类型（见"'集成测试'去了哪里"）。

## 后缀即层：文件名选中机制（硬事实）

**一个测试文件属于哪一层，由它的后缀 + 所在目录唯一决定**，8 份根部 vitest 配置各自认领自己的模式：

| 后缀 / 位置 | 层 | 选中它的配置 |
|---|---|---|
| `packages/*/*/tests/**/*.spec.ts(x)`、`apps/*/tests/**`、`scripts/**/*.spec.ts`、`website/tests/**` | Unit（+覆盖率） | `vitest.config.ts` |
| `packages/*/*/tests/**/*.e2e.ts`、`apps/{cli,desktop}/tests/**/*.e2e.ts` | Real-API e2e | `vitest.e2e.config.ts` |
| `apps/cli/tests/**/*.expected.e2e.ts` | Owner-local expected | `vitest.expected.config.ts` |
| `scripts/session-snapshot-corpus.corpus.ts`、`snapshots/**/*.snapshot.ts` | Snapshot | `vitest.snapshot.config.ts` |
| `apps/web/tests/**/*.{e2e,snapshot}.ts` | Web 浏览器 | `vitest.web.config.ts` |
| `apps/web/tests/**/*.perf.ts`、`**/*.perf.client.ts` | Web 性能诊断（手动） | `vitest.web.perf.config.ts` |
| `apps/web/stress-tests/**/*.stress.ts` | Web 压力（opt-in） | `vitest.web-stress.config.ts` |
| `benchmarks/**/*.bench.ts`、`*.bench.client.ts` | CI 性能门禁 | `vitest.bench.config.ts` |

注意 e2e 配置显式 **exclude `*.expected.e2e.ts`**（归 expected 层）和 inspector 的 `client-browser.e2e.ts`（归 web 层）——层的边界在后缀文法里是互斥的。8 份配置全部用同一个 `tsconfig.base.json` 门面做 vite-tsconfig-paths 解析（源码平面，[01](./01-doctrine.md) 教义 7）。

## 逐层深挖

### 1. Unit——就近、行为、永久契约

- **位置纪律**："tests stay with the code area they exercise"——测试跟它测的代码住在一起；仓库级脚本测试住 `scripts/**/*.spec.ts`。
- **强制模式一：HMR-safety**。"Every registry gets an HMR-safety test (dispose the contributing fiber, assert cleanup)"——每个注册表都必须有"卸载贡献 fiber 后断言清理干净"的测试。这是 all-plugin 架构的独有要求：插件能热插拔，注册就必须可撤销。
- **强制模式二：契约回归永久化**。边界、错误路径、事件顺序、并发竞态优先；契约回归测试是永久资产（样板 `packages/core/agent-loop/tests/contract-regressions.spec.ts`）。
- **执行形态**：两个内联 project（`thread-safe` / `process-bound`）全部 `pool: 'forks'`——理由写在注释里：Node 24 的 CJS lexer 在 worker 线程上崩溃。8 个动进程级全局状态的套件（session-persistence-jsonl、subagent-acp、process-exit、spawn、time-context、llm-pi-ai adapter、app-boot、workflow-ptc）单独成 `process-bound` project；`execArgv` 带 `--no-webstorage` 防进程级 Web Storage 遮蔽 jsdom。`.tsx` 客户端组件用每文件 `@vitest-environment` pragma 声明 jsdom。
- setup 三件套：`scripts/test-proxy-environment.ts`、`test-invariants.ts`、`test-dom-environment.ts`。

### 2. Coverage gate——per-file 100%，死代码探测器

- 门是 `test:coverage`（不是 `test`）：v8 provider，对 `packages/*/*/src` 的**每个文件** 100% statements/branches/functions/lines。配置注释的原话："**100% or it doesn't merge** (docs/testing.md: excessive tests are welcome)"——门只惩罚未覆盖，从不惩罚多测。
- 政策原话："An uncovered line is often dead code the gate flags for deletion, not a missing test to bolt on. Line coverage is necessary, never sufficient — it proves lines ran, not that the feature works as shipped."
- 失败报告：自定义 `uncoveredLocationsReporter` 打印每条未覆盖的 `path:line:col`——失败信息直接可定位。
- **分区模式**：`DSH_COVERAGE_PARTITIONS` 下多个单 worker Vitest 进程各出 blob，合并成一份报告后**统一**判门（分区内不判）；分区权重来自 `.coverage-times.json` 实测时长。CI 上豁免重型套件跑不插桩旁路（预算 1/3）。
- **豁免全部显式且有理由**：平台条件豁免（win32 上排除 POSIX shell 包、Linux lane 永远盖不到的 win32 专属代码）；GUI debt 豁免（带 `TODO(gui)` 注释逐文件列举）；typert 整包豁免（正确性由未插桩套件保证）；**pwsh 探测式豁免**——配置加载时实际 spawn 探测 pwsh，探测失败的豁免条件与套件自跳过条件（`hasPwsh`）严格一致，防"探测比套件窄"的错配。

### 3. Real-API e2e——with-key，无 key 自跳过

- 证据对象：live provider API——DeepSeek 模型 + 各 provider 自己 key 门控的冒烟（`EXA_API_KEY`、`PERPLEXITY_API_KEY`…）；各 suite 缺自己的 key 就 skip（"keyless CI stays green"）。
- 执行形态：读根 `.env`；testTimeout 120s / hookTimeout 30s / **retry 2**（注释：真实模型调用的瞬态抖动——全体系唯一显式 retry 的层，见 [06](./06-reliability.md)）；`DSH_E2E_MAX_WORKERS` 默认 4；**无 coverage**（注释：单元层拥有覆盖率门——覆盖率不重复计税）。
- profile 级集成测试住 `apps/cli/tests/profiles/`；包特定组装留在包测试。

### 4. Owner-local expected——无录制往返的进程期望

- 定位："keyless assembled CLI/process expectations **without a recorded-session round trip**"——同样断言组装后输出，但不走录制会话回放。
- 形态：驱动 `*.expected.e2e.ts` 只收 `apps/cli/tests/`；CI 跑 built exports；maxWorkers=min(5, CPU)；刷新走 `DSH_SNAPSHOT=refresh`。
- 分工："Package/script expectations use `test`, while browser expectations use `test:web`"。

### 5. Benchmarks——用户路径性能门

- `benchmarks/` 按用户路径分组（不镜像包树），每组一个门：session-open（200 turns × 625 deltas = 127,400 事件）、agent-continuation、terminal-io（128KiB vs 4MiB 容量比 32×，ingest 时间比 ≤4×）、active-stream-reconnect（10 万 delta 重建 ≤63ms）、conversation-fold（50 万 delta 压 1,600 compact records，fold ≤40ms）、long-session-browser（Playwright + 240-turn 浏览器历史）。
- **"timed code runs under plain Node, never TSX" 的四层落实**：① `tsdown` 编译 worker 且 `neverBundle: [/^@deepseek-ai\//]`（工作区包保持 external、解析到 built lib/）；② spawn 前从子进程 env **删除 `NODE_OPTIONS` 与 `TSX_TSCONFIG_PATH`**；③ `assertBuiltBenchmarkRuntime` 三重拒绝（非 `.dsh-build/` 入口、execArgv 出现 tsx loader、包入口没 resolve 成 `/lib/*.js`）；④ `maxWorkers: 1` + 串行，测量不共享 CPU。
- **预算是审查过的源常量，环境变量不得覆盖**：`CI_TIME_SCALE = 2`（x64 CI 相对 arm64 参考机）× `PERFORMANCE_BUDGET_HEADROOM = 1.25`；每个 bench 带内嵌校准测试，用录制的 hosted 采样断言预算常量本身（如 `expect(REOPEN_OPEN_BUDGET_MS).toBe(63)`）并拒绝合成回归样例——**预算数字自己也有测试**。
- 合成固定输入（禁止真实会话/用户材料/网络）；参考机期望与 CI time scale 分开记录；堆预算独立于计时（如 retained heap ≤16MiB）。

### 6. Snapshot——录制会话回放（keyless）

一句话机制：顶层场景的最高录制父代提供用户输入与模型回放，其持久化结果就是期望值。四面分工：headless 拥有一次性行为、SDK 拥有持久控制、ACP 拥有自动化协议行为、Web 在同一 Session 旁保留浏览器/ARIA 证据。执行形态：replay 并行、record/refresh 严格串行、只有 record 读 `.env`。细节全部在 [04](./04-snapshot-machinery.md)。

### 7. Web browser snapshot——浏览器证据比对

- 命令先构建 plugin CSS，再在 Chromium 里比对 session 驱动的 `snapshots/web/` 与 UI-only 的 `apps/web/tests/expected/`；model/reasoning picker 额外跑 WebKit；Linux PR 必过门。
- 本地 `fileParallelism: false` 串行；CI 经 `run-web-snapshots.ts` 先串行跑两个改写共享树的 HMR/Client-plugin 覆盖、再并行其余；CI 钉只读 `DSH_SNAPSHOT=replay`，record/refresh 只在本地，每个 diff 人工 review。
- DSH 认为浏览器证据值得花这份 CI 成本：确定性不靠绕开真实浏览器，而靠"录制回放 + CI 只读 `DSH_SNAPSHOT=replay` + 每个 diff 人工 review"来控制。

## 宪法之外的广义测试面（硬事实，散在 package.json / run-gates.ts）

| 面 | 命令 | 一句话 |
|---|---|---|
| Web 性能诊断 | `test:web:perf` | `--expose-gc` 手动 lane，**不在任何 CI 执行清单内** |
| Web 压力 | `test:web:stress` | opt-in，无默认配置包含 stress 文件 |
| GUI | `test:gui` | `packages/client` + `packages/host` 的 vitest |
| 政策测试 | `test:approval-policy` / `test:issue-management` | `node --test` 直跑 `.github/` 下的 `.mjs`（见下） |
| 文档门禁 | `doc-sync` / `doc-typecheck` / `test:docs` | 约 40 个文档门叶子（type-equivalence、doc-budgets、markdown-links…） |
| 平台矩阵 | `check:windows-wine` / `check:node-compat` | Wine 上的 Windows 门（master-only）、Node 版本兼容 |
| 静态质量 | `typecheck` / `lint` / `duplication` / `hygiene` | 类型/风格/克隆检测/发布卫生 |
| 发布面 | `check:ci:artifacts` / `check:ci:consumers` | publint、node-next-types、built-invariants、built-bin-smoke |

**政策测试为什么用 `node --test` 而不是 vitest**：被测对象是 `.github/` 下的 GitHub 自动化脚本——纯 `.mjs`，生产路径是 Actions 运行器里系统 Node 直接执行；测试用同一解释器、零依赖（`node:test` + 内建 `t.mock.method`），且 `.github/` 本来就不在任何 vitest include 模式内。**测试运行器与生产运行器同构**——这是 [01](./01-doctrine.md) 教义 6（测真实入口）在测试基建自身上的应用。

## "集成测试"去了哪里（解释）

经典 integration test 在 DSH 被拆成三种**入口真实性递增**的证据：

1. **REAL-composition 测试**：boot 一份 test-only `cordis.yml`，走真 Loader、真 app/process 组装，mock 只限外部服务与非确定输入（[01](./01-doctrine.md) 教义 6a）。测的是"组装后插件还工作"。
2. **Profile 级集成测试**（`apps/cli/tests/profiles/`）：启动 shipped profile 跑真实任务流。测的是"发布形态的组装"。
3. **Built smokes**：`bin` 走 built `lib/bin.js` + plain node 冒烟。实际清单：`apps/cli/tests/built-bin.e2e.ts`（1321 行，`runBuiltBin()` 用 execa 直接跑 `apps/cli/lib/bin.js`，31 个用例：参数错误、profile 生命周期标记、patch 热重载、mock-backed ACP turn、config dump）+ 各包 `built-lib.e2e.ts`（lsp-stdio、api/job-controller、api/remotes、experimental/{agent-team,inspector,webworker-packer}、ptc-runtime-node 等）；CI 的 built-bin-smoke 门聚合 18 个 built 消费者 e2e（`DSH_EXAMPLE_MODE=lib`）。`packages/lsp/lsp-stdio/tests/built-lib.e2e.ts` 的头注释说得最直白："plain Node imports … by name through their exports maps … Unit tests use `src/`; **this pins the downstream `lib/` path**. Skips when `lib/` is absent; CI runs it after the build"。
   > 注：`docs/testing.md` 引用的 `packages/examples/*/tests/built-bin.e2e.ts` 在基线树中**已不存在**——文档过期，实际清单以本条为准。

三者的共同点：**都不信任手搭的组装**（"Hand-built `ctx.plugin(...)` suites are insufficient"），集成证据必须取自真实入口。

## 启动模式即证据（解释）

一个子进程怎么被启动，本身就是被测契约的一部分（[01](./01-doctrine.md) 教义 7/8）：

| 启动模式 | 谁用 | 证明什么 |
|---|---|---|
| src 就近解析（vite-tsconfig-paths → `tsconfig.base.json`） | 全部 vitest 层 | 源码平面上行为正确；不会加载 stale lib 双份单例 |
| built `lib/` + shared dual-mode launcher | CI / 带构建 lane 的 profile、Cordis-config 子进程 | 发布形态的组装与启动 |
| 可擦写 `.ts` + plain Node（无 tsx、无 paths map） | 不加载 Cordis 的协议/OS fixture | fixture 逻辑本身，零转译层干扰 |
| 编译 worker + 净化 env + plain Node | benchmarks | 纯净计时（四层拒绝机制见上） |

## 文件形态普查（按基线树、各配置 include 模式实测）

| 后缀 / 形态 | 计数 | 备注 |
|---|---|---|
| `*.spec.{ts,tsx}`（unit） | **1893** | packages 1358 `.ts` + 265 `.tsx`、apps 143+1、scripts 121、website 5 |
| `*.e2e.ts`（e2e 车道） | **91** | 按 `vitest.e2e.config.ts` 的 include（`packages/*/*/tests/**`、`apps/{cli,desktop}/tests/**`）减 exclude（`*.expected.e2e.ts` 与 inspector 的 `client-browser.e2e.ts`）实测；物理总数 270，归 web 车道的 161 个与归 expected 层的 18 个不在内 |
| `*.expected.e2e.ts` | **18**（apps/cli）+ 8（apps/web，归 web 车道） | 另有 1 个 `*.expected.spec.ts` 走 unit——"Package/script expectations use `test`"的实例 |
| `*.snapshot.ts` 驱动 | **3** + 1 corpus | 场景数据面：snapshots/session **122**、sdk **24**、acp **9**、web **55** = **210 个录制场景** |
| `*.bench.ts` / `*.bench.client.ts` | 5 + 2 | |
| `*.perf.ts` / `*.perf.client.ts` | 2 / 1 | packages 下 1 个**不在任何配置 include 里**（纯手动诊断，"package-local `.perf.ts` stays diagnostic"的实例） |
| `*.stress.ts` | 1 | opt-in |
| `tests/harness.ts` | 8 | 共享 fixture，**刻意不被任何 include 选中** |
| built 冒烟（`built-*.e2e.ts`） | ~15 | 散在 e2e include 内；无 key、lib 缺失自跳 |

**写法惯例（硬事实）**：

- **命名**：英文行为命题、现在时、**无 "should"**——`describe('disposal leaves the two-state status contract balanced')`、`it('removes contributions when the contributing fiber is disposed (HMR safety)')`。"Tests describe behavior, not correctness" 的文体化。
- **HMR-safety 模式**（全仓 72 处 `(HMR safety)`）：子 fiber 注册贡献 → 断言存在 → `await fiber.dispose()` → 断言移除（服务自身 built-in 不受影响）。契约回归样板 `contract-regressions.spec.ts`（1552 行、14 个 describe）每条测试钉死一个边界/身份/生命周期契约，注释直接回指原始 bug（如 "The key assertion from the original bug report: after disposal, no assistant/attempt or assistant/message appears"）。
- **tests/harness.ts 模式**：共享 fixture 刻意放在 include 模式之外——import 它不会重复注册别人的 `describe`、不会重复真实 API 调用；代码里有就地注释（`packages/fs/tool-fs/tests/harness.ts`："This helper lives outside the e2e glob so imports do not register tests"）。
- **spec 与 e2e 的实际写法差**（抽样对比）：spec = 进程内真 Cordis 组合 + MockAdapter，断言事件序列 / registry 状态；e2e = `describe.skipIf(!process.env.DEEPSEEK_API_KEY)` 自跳过（packages 侧 34 处，部分套件再加用例内双保险 throw）+ 真 provider + 180s 超时 + **进程外读文件断言**（verify the world）+ session log 里真实 tool/call 名单核对，不信 agent 自述。
- **client 组件 spec**：文件首行 `// @vitest-environment jsdom` pragma + testing-library + fake timers；断言用户可见行为而非 class 名。
- **两个横切 helper**：`runLoaderSmoke`（`@deepseek-ai/dsh-loader-smoke`，双模式 src/lib 子进程启动器，所有 profile/snapshot 套件共用）与 `mountAgentLoopTestDependencies`（`@deepseek-ai/dsh-agent-loop-testkit`，进程内一次挂全 agent-loop 依赖栈）。

## 源码锚点

- `docs/testing.md` Tiers 节——七层的官方定义
- 根部 8 份 `vitest.*.config.ts`——后缀→层的选中机制、各层执行参数
- root `package.json` scripts + `scripts/run-gates.ts`——广义测试面全表
- `packages/core/agent-loop/tests/contract-regressions.spec.ts`——契约回归样板
- `benchmarks/AGENTS.md` + `benchmarks/support/{built-worker,calibration}.ts`——性能门纪律与预算校准
- `.github/review-ownership/*.test.mjs`——政策测试样本

## 最小例证

1. **后缀即层可证伪**：把一个 `*.spec.ts` 改名 `*.e2e.ts`，它立刻从 unit 层消失、出现在 e2e 层——include/exclude 模式互斥且穷尽了测试文件空间。
2. **覆盖例外是显式的**：读 `vitest.config.ts` 的豁免清单——每条带平台条件或 `TODO(gui)` 注释；pwsh 豁免的探测条件与套件自跳过条件写在同一处。
3. **预算常量有测试**：读任一 `benchmarks/*.bench.ts` 的校准段——`expect(...).toBe(63)` 一类断言把预算数字本身钉进套件。
