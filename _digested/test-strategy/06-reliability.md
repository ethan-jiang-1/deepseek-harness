# 06 — 测试可靠性纪律：共享世界上让偶发失败无处藏身

> 本篇消化 DSH 的测试可靠性体系：执行环境的不变量（`docs/testing.md` "How specs execute"）、编排层的兜底（[05](./05-ci-gates.md) 的可靠性面）、以及 `dsh-ci-test-reliability` 技能的纪律条款。flake 的定义、归因与修法都在这层。

## 现象是什么：共享执行世界 + 单向归因

DSH 的测试可靠性问题被显式建模为：**大量并发 spec 文件跑在共享一个 host、一个 volume 的 self-hosted runner 上，只有进程边界是隔离的**。端口、可预测路径、外部命名空间、继承的子进程——全部共享。

政策原话（`docs/testing.md`）：

> "Forked workers run several spec files at once, the coverage gate splits into concurrent partitions beside the other gates in its job, and the self-hosted runners share one host and one volume. **Only the process is isolated: ports, predictable paths, external namespaces, and inherited children are not.** Own each acquired resource through its teardown, and read a spec that passes only when it runs alone as **a defect in the spec rather than an unstable runner**."

三个要点：环境是共享的（成本选择）；责任是单向的（每个测试对自己获取的资源负责到 teardown）；**归因是单向的（"单跑才绿"永远算 spec 的缺陷，不许赖 runner）**。第三条是整个可靠性纪律的宪法条款——它堵死了"在我机器上时好时坏"这类不可证伪的辩解。

## forked pool 的工程理由（硬事实）

`vitest.config.ts` 的两个内联 project（`thread-safe` 与 `process-bound`）全部用 `pool: 'forks'`，不是默认的 worker threads。理由写在配置注释里：**Node 24 的 CJS lexer 在 worker 线程上崩溃**。另外 8 个进程绑定套件（session-persistence-jsonl、subagent-acp、process-exit、spawn、time-context、llm-pi-ai adapter、app-boot、workflow-ptc）单独成 `process-bound` project；`execArgv` 统一带 `--no-webstorage`（防进程级 Web Storage 状态遮蔽 jsdom storage）。

## 编排层的可靠性兜底（硬事实，散在配置与 run-gates）

可靠性不靠口号，靠一组显式调参和互斥规则：

| 机制 | 事实 | 保护什么 |
|---|---|---|
| **e2e 层唯一显式 retry** | `vitest.e2e.config.ts` `retry: 2`，注释"真实模型调用的瞬态抖动" | 只对"外部世界抖动"宽容 |
| timeout 校准 | `DSH_COVERAGE_TEST_TIMEOUT_MS=90000`（托管共享 lane 上 5s 默认会超，workflow 注释附 run 编号证据） | 共享 runner 的时限不是本机的时限 |
| 并发压低 | ci- 模式注入 `DSH_SNAPSHOT_MAX_WORKERS=1` 等一整套 worker 上限 | 共享 host 上的邻居礼貌 |
| 写路径互斥 | `ci-consumers` 的 web-snapshot 用 `after` 等全部 build-artifact readers settle——**HMR 测试会启动 dev:web 改写共享 `lib/` 与 `apps/web/dist/`** | 同树读写的物理冲突 |
| web 快照分批 | `run-web-snapshots.ts` 先**串行**跑两个会改写共享树的 HMR/Client-plugin 覆盖，成功后再并行其余 | 同上，且失败早停 |
| 快照写模式串行 | record/refresh 严格串行（record 花 API 配额、refresh 并发写坏期望） | 期望资产的写完整性 |
| fail-fast 杀进程树 | `DSH_GATE_FAIL_FAST=1` 首败中止并杀整棵进程树（进程组负 pid / `taskkill /T /F` / SIGKILL 升级） | 不留孤儿进程污染共享 host |
| 基准独占 | `vitest.bench.config.ts` `maxWorkers: 1` + 串行；bench job 用独立空闲 runner | 测量不共享 CPU |
| 进程绑定套件隔离 | 8 个套件单独 project、Windows native-tests `--no-file-parallelism` | 进程级全局状态不互踩 |

## 可靠性纪律技能（`dsh-ci-test-reliability`）

技能拥有隔离与可靠性决策，边界明确："it does not replace the repository's test-tier policy or select every command for a push"——tier 选择归 testing.md，命令选择归 pre-push skill，测试设计归本技能。核心条款：

**执行拓扑四层**：同一文件内的 tests → 不同文件/worker → 同 job 内独立进程 → 共享宿主的不同 Actions job。"Process isolation does not isolate host ports, predictable filesystem paths, external services, databases, sockets, or inherited child processes." 每个被获取资源五要素：owner、原子分配机制、可观察就绪信号、注册的清理、静默完成信号。且："Do not serialize an entire suite merely because one fixture lacks isolation. Narrow the exclusive scope or change the resource allocation first."——**不许用一个 fixture 的隔离缺陷给整套件判串行**。

**原子分配**：网络 fixture 用 `listen(0)` 并在 listening 事件后才读分配地址，"Never scan for a free port and bind it later"（TOCTOU）；`mkdtemp` 私有 per-test 临时根；路径不能预存时排他创建；稳定录制标识与临时传输地址分离。仅作 parser 输入或预期值的字面路径/URL **不是**被获取资源，不要改写。

**进程级全局状态**：env / cwd / fake timers / locale / tz / module mocks / registries / console hooks / 全局 fetch 拦截，全部当独占可变资源。恢复六步：记录原值缺失还是存在 → 恢复精确状态 → 立即注册恢复 → 最小作用域 try/finally → afterEach 兜底 → 只拦截 fixture 拥有的最窄精确请求。

**平台语义**：写回值仅在断言容忍写回失败时安全（NTFS 100ns tick 不保毫秒往返）；Windows 环境变量名大小写不敏感（http_proxy/HTTP_PROXY 合一）；异步释放文件句柄 → rename/remove 用按实测竞争定界的有界重试；无 POSIX 权限/信号语义 → **显式平台 skip 并说明原因**，而非全局弱化断言。

**超时预算**："A `describe` or case timeout overrides the runner's `--testTimeout` instead of yielding to it"——写一个比 lane 预算小的值反而是**降低** CI 已给的预算；hook 预算随测试预算一起提；测超时本身时外层等待要远大于被测超时。

**按状态同步**："A fixed sleep is not evidence that setup completed or cleanup settled"——等显式就绪事件/握手/状态迁移/owned promise/外部可观察条件；timeout 只用来界定等待、**绝不作为断言成立的条件**；时间为被测对象时注入/伪造时钟并恢复真实 timers。

**释放到静默**：获取后立即注册清理（断言失败也释放）；"Calling `abort()`, `close()`, or `kill()` without awaiting the owned completion signal is incomplete teardown."

**证明目标回归**：可行时先观察回归在修复前变红；竞态用 barrier 证明重叠，"repeated execution alone is not a race test"；宿主资源（端口/共享路径/子进程）用并发独立进程证明跨进程隔离；"Stress runs supplement a deterministic regression; they do not replace one."

**拒绝的 flake 掩盖修法**：加超时不指认等待状态、加重试、全文件串行、吞错误/unhandled rejection、弱化断言、normalize 掉不稳定行为、清理/断言前 sleep——都不是根因修复。重试只对 documented transient external-provider 测试有效（真实 API 政策），且只留在外部边界。"Restoring a budget is not masking"——把 suite 恢复到 lane 原有预算、或按实测竞争定界有界重试、指名被等待的工作，不算掩盖。

**flake 诊断工作流**（`references/ci-flake-diagnosis.md`）：八类分类**按证据分、不按最终修复分**——host-resource collision / incomplete lifecycle / process-global contamination / load-sensitive synchronization / platform or entry-path mismatch / product concurrency defect / external-provider transience / runner infrastructure（最后一类需要直接 runner 证据；自托管池无宿主指标时，"one signature repeating across unrelated branches on one pool is evidence of shared-host contention even when the host cannot be inspected"）。**五级复现阶梯**：单测试进程 → 并发 tests/files → 多个独立 Vitest 进程 → owning gate 的配置 worker 数 → 共享宿主资源的独立 job/runner；只升到能复现签名的第一级，匹配活动配置/knob/平台，"Do not lower a production timeout or add random load merely to manufacture a different failure."。两句硬话定调："One passing rerun does not prove an infrastructure fault, and one timeout does not prove a product race."；完成判据里写明 "Do not run until a test happens to pass and call that result stable."

这套纪律不是纸面文章：2026 年 9 月的连续决策笔记（observation-waits-on-observed-state、web-lane-assertions-name-their-input-state、detail-close-waits-on-observed-state、ci-readiness-and-completion 等）是它的实战记录——每一起 CI 竞态都被按"**断言等待它断言的完成条件**"修（等真实的状态迁移，而不是加大 timer / retry / 串行化），且每篇笔记都带负控制（注入延迟重现原失败签名、修复后通过）。

## 为什么这么定（解释）

1. **"纪律 + 调参"而不是"容器级隔离"。** 共享 host/volume 是 runner 成本上的选择；代价被显式转嫁给测试作者的责任条款（own each acquired resource through its teardown）。DSH 选择了更便宜的一面：**先写责任规则，基建只在规则不够的地方补**。
2. **retry 只给 e2e 是诚实的分层。** 确定性层（unit/snapshot/expected/bench）不允许 retry——retry 会掩盖竞态；只有面对真模型（物理上存在瞬态抖动）的层接受 retry，且写明理由。**"对什么宽容"本身被纪律化。**
3. **归因单向化防 flake 腐败。** "单跑才绿 = spec 缺陷"把环境从怀疑名单里永久移除。没有这条，"时好时坏"会演化成互相甩锅的灰色地带；有了它，对 flaky 的零容忍落成一句可执行的归因规则。
4. **写路径全部显式互斥。** 共享树的三个写者（HMR 测试、dev:web、refresh）都被编排层用 after/串行隔开——可靠性问题的解法一半在测试内（teardown 责任），一半在测试外（谁先谁后）。

## 源码锚点

- `docs/testing.md` "How specs execute"——环境不变量与归因条款
- `vitest.config.ts`——forks pool 理由、process-bound project、`--no-webstorage`
- `vitest.e2e.config.ts`——retry: 2 及其注释
- `scripts/run-gates.ts`——worker env 注入、fail-fast 进程树终止
- `scripts/run-web-snapshots.ts`——串行先行再并行
- `.github/workflows/ci.yml`——timeout 校准的 run 编号证据注释
- `.agents/skills/dsh-ci-test-reliability/SKILL.md`——纪律技能本体

## 最小例证

1. **retry 只有一处**：grep 8 份 vitest 配置里的 `retry`——只有 e2e 配置有，且带理由注释；确定性层的配置里没有。
2. **进程绑定清单可数**：读 `vitest.config.ts` 的 `processBoundTests`——恰好 8 个套件被点名，每个都是"会动进程级全局状态"的类型（persistence/spawn/exit/time/boot）。
3. **timeout 证据留档**：读 ci.yml coverage job 的注释——`DSH_COVERAGE_TEST_TIMEOUT_MS` 的取值旁边写着具体 run 编号，"为什么是 90000"可回溯。
