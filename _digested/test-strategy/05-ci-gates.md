# 05 — CI 门禁与平台矩阵：编排、必需性与防假绿

> 本篇消化 DSH 的 CI 编排层：`scripts/run-gates.ts`（门禁注册表）、`.github/workflows/`（lane 结构）、Wine 与热备演练。分层定义见 [02](./02-tiers.md)，政策见 [01](./01-doctrine.md)，可靠性纪律见 [06](./06-reliability.md)。
> 门禁聚合器与 leaf 家族的机制概述由 [`system-overview/03-门禁与性能基准.md`](../system-overview/03-门禁与性能基准.md) 承载，本篇不重复家族图。

## 现象是什么：一个 1687 行的门禁注册表

DSH 的 CI 不是一堆散装的 workflow 步骤，而是一个**可编程门禁图**：`scripts/run-gates.ts`（commit `68724b375` 时 1687 行）注册了 **18 个聚合模式**，每个模式是一张带依赖关系的门禁 DAG。workflow 只是调用入口，门禁的拓扑、并发、失败语义全部由这张注册表统一声明。

18 个聚合：`ci-primary`、`ci-linux-primary`、`ci-static`、`ci-lint-contracts-ready`、`ci-coverage`、`ci-unit`、`ci-bench`、`ci-snapshot`、`ci-artifacts`、`ci-consumers`、`ci-windows-blocking`、`ci-windows-complete`、`ci-windows-observational-ready`、`node-compat`、`check-all`、`hygiene`、`doc-sync`、`doc-quick`。

## 调度语义（硬事实）

| 语义 | 含义 |
|---|---|
| `needs` | 前置门必须 passed 才启动 |
| `after` | 无论成败都要等它 settle（用于互斥资源共享） |
| `allowFailure` | 保留失败结果但不阻塞（观察性门的实现） |
| 有界并发 | 默认 min(门数, CPU)；本地模式（check-all/hygiene/doc-sync/doc-quick）cap 4 |
| `DSH_GATE_FAIL_FAST=1` | 首败中止并**杀整棵进程树**（POSIX 进程组负 pid、Windows `taskkill /T /F`、5s SIGKILL 升级） |

ci- 模式统一注入 worker 环境变量（线程数、快照并发=1、覆盖分区=插桩份额 2/3 等），保证"本地跑同一模式"与 CI 同参数。

## 主要聚合的内容链（摘要）

- **ci-primary**（`check:ci`）：17 个共享静态门（runtime-closure、package-invariants、cordis-config、client-ui-i18n、no-unknown-casts、approval-policy、issue-management 等）→ typert-contracts → typecheck/lint/duplication → coverage → node-compat smokes → snapshot → 文档门叶子 → build → publint → node-next-types → built-package-invariants → built-bin-smoke。
- **ci-linux-primary** = ci-primary + webSnapshotGate（Linux PR 的 web 快照必过门在这里挂上）。
- **ci-coverage**：`build:native-system` 后两路并行——①插桩覆盖（分区模式经 `run-coverage-partitions.ts`：多个单 worker Vitest 进程各出 blob，**合并成一份报告后统一判 per-file 100% 门**；分区权重来自 `.coverage-times.json` 的实测时长，Windows job 有对应 GitHub cache）；②豁免重型套件不插桩跑。预算分配：总量的 1/3 给豁免门。
- **ci-unit**：全量无插桩清单（streamOutput 供 15~30 分钟日志带时间戳）。
- **ci-bench**：单门 `test:bench`（build:bench + build:web + built 运行）。
- **ci-consumers**：build、node-compat、publint、snapshot、expected-output、web-snapshot、built-bin-smoke 等"消费 built 产物的面"；其中 web-snapshot 用 `after` 等全部 build-artifact readers settle——**HMR 测试会启动 dev:web 改写共享 `lib/` 与 `apps/web/dist/`**，必须互斥。
- **built-bin-smoke**：`DSH_EXAMPLE_MODE=lib` 下跑 18 个 built 消费者 e2e 文件。注释原话：这是 "package 名导入在 plain Node 下能到达 `lib/` 入口" 的**唯一自动证明**——发布面的守门人（对应 [01](./01-doctrine.md) 教义 6c）。

## CI 工作流结构（硬事实）

### ci.yml（pull_request 专用）

9 个必需 job 经 **`all-checks-passed` 单一 required check** 聚合（分支保护只认它一个；任何 failure/cancelled/skipped 都判红）：

| job | 跑什么 | 备注 |
|---|---|---|
| node-24（static） | `check:ci:static` | FAIL_FAST=1 |
| node-24-coverage | `check:ci:coverage` | `DSH_COVERAGE_TEST_TIMEOUT_MS=90000`（托管 lane 上 5s 默认会超，有 run 编号证据） |
| node-24-bench | `check:ci:bench` | **独立 ubuntu-24.04 托管 runner**——wall-clock 预算需要空闲机器，不并入并发聚合 |
| node-24-consumers | `check:ci:consumers` | 装 chromium+webkit |
| node-compat（矩阵） | `check:node-compat` + loader-shape spec | node 22.19 / **24.9**（钉在 24.0–24.11.1 的 v1 internal loader 区间，避免与其他 job 的最新 24 重复）/ 26 |
| python-sdk | unittest（review-ownership 的 Python 端）+ pytest 全量 keyless | |
| python-runtime | build-exe（linux/win x64） | 双 SDK 投影的 Python 面 |
| windows-build | `check:ci:windows-blocking`（必需）+ `check:ci:windows-observational-ready`（continue-on-error 观察性） | ReFS 卷检测 + `--package-import-method=clone` |
| windows-native-tests | 4 个 Windows 绑定套件 `--no-file-parallelism` | 2vcpu 小 runner 上的 file-serial |

**windows-coverage 不在 `all-checks-passed` 的 needs 里**——对 PR 判定是观察性。runner 池可用仓库变量（`DSH_CI_FAILOVER_LINUX`/`_WINDOWS`）在企业池 / selfhosted / blacksmith 之间切换，Linux 三大 job 共用同一开关。

### ci-master.yml（push master + 手动 dispatch，不进 PR 面板）

- **windows（Wine）**：ubuntu + Wine 跑 `scripts/wine-windows-gates.sh`——在 Linux 上用真 win-x64 Node 跑两个 blocking 门。工作树不动（tracked+untracked-unignored 全部 tar 快照进 scratch）；Wine 专属覆盖（hoisted linker + win32-x64 supportedArchitectures）只附加到快照的 pnpm-workspace.yaml，`--frozen-lockfile` 仍有效；Node zip 下载并 SHA-256 校验；pnpm hoisted rename race 最多干净重试 3 次；Wine 下 Node 不能接管道 stdio，全部经文件。
- **serial-linux-selfhosted / serial-windows**：**热备演练**——每次 master push 在持久 VM 上**全串行**（一切并发=1）跑必需 lane（`check:ci:linux-primary` / `check:ci:windows-complete`），持续证明备用环境能接管必需 lane。
- **runner 基准矩阵**：手动 dispatch，4~96 核 × Linux/Windows，分别测单 lane 与整合拓扑的 wall-clock。

### e2e.yml（真 DeepSeek API）

触发：dispatch + push main/master + PR + nightly（cron 错开整点）。fork 与 Dependabot PR 在 job `if:` 跳过（secrets 被扣留；skipped job 报 SUCCESS，可安全设为 required）。**preflight 步骤对缺 `DEEPSEEK_API_KEY` 硬失败**——防"全跳过的假绿"。`DEEPSEEK_BASE_URL` 钉死官方端点（防 stray `.env` 重定向）。头注释的安全红线：**绝不改 `pull_request_target`**（fork 代码将带 secrets 执行 = key 泄漏向量）。

### expected-filenames.yml / sandbox.yml / pi-ai-provider-e2e.yml

- **expected-filenames**：PR 改动了文件名含 `golden` 的文件时触发，强制改名 `expected`——命名即所有权（[03](./03-rules-ownership.md)）。
- **sandbox**（master-only）：OS×sandbox 矩阵（bwrap / landlock×2 / seatbelt）每腿跑专属 e2e 并 **grep `Test Files 2 passed (2)`——自跳过即失败**；landlock 腿加跑 packed-install（pack→install→confine 发布路径演练）；另有 macOS `unit-darwin` 奇偶校验。
- **pi-ai-provider-e2e**：仅手动 dispatch（花外部 provider token），双 key preflight。

## 防假绿机制（本篇亮点）

DSH 的 CI 设计里有一组专门对付"测试自己骗自己"的机制，与 [01](./01-doctrine.md) 的 verify-the-world 教义同源：

1. **缺 key 硬失败**（e2e.yml preflight）：with-key lane 的 key 缺失不降级为全 skip 的绿，而是显式红。
2. **自跳过即失败**（sandbox.yml）：跑之前先数"应该过的文件数"，套件悄悄自跳过会被 grep 拦下。
3. **skipped 判红**（all-checks-passed）：聚合门把 skipped 与 failure 同等对待——"没跑"不算"过了"。
4. **观察性显式化**（allowFailure / continue-on-error / 不进 needs）：不能稳定跑的门（windows-coverage、windows observational）不混进必需判定，但结果保留可见。
5. **runner 可信性演练**（serial-* 热备）：备用执行环境每周被真实跑一遍必需 lane，"换池子会炸"的风险被持续证伪。

对照：Pi 生态的对应物是 hook 契约 `evidence.json` 字节锁 + CI 禁改证据（pi-mono FAQ 11 第 05 案）。两家用不同工具保护同一件事：**证据链上任何"悄悄少测了"的路径都要被封死。**

## 与政策的一致性（解释）

- root `AGENTS.md` 的 "CI owns exhaustive coverage and the platform matrix" 在这里兑现：本地按面选最小证据（[03](./03-rules-ownership.md) pre-push 纪律），穷尽与矩阵是 CI 的财产。矩阵 = OS（Linux/Windows/macOS/Wine）× Node（22.19/24.9/26）× runner 池（企业/自托管/blacksmith）× 浏览器（chromium/webkit）。
- **自托管共享 host 的连锁反应**：testing.md "self-hosted runners share one host and one volume"（[06](./06-reliability.md)）在这里表现为大量"并发压低 + timeout 抬升"的调参（`DSH_SNAPSHOT_MAX_WORKERS=1`、coverage timeout 90000、consumers 的 web-snapshot 互斥）——编排层在替测试纪律兜底。
- **门禁注册表是单一事实源**：workflow 只引用 `check:ci:*` 模式名，本地与 CI 跑同一张图——"我本地复现 CI 失败"不需要重建 workflow。

## 源码锚点

- `scripts/run-gates.ts`——18 个聚合、调度语义、注入 env、fail-fast
- `scripts/run-coverage-partitions.ts` + `scripts/coverage-partitions.ts`——分区→blob→合并判门
- `scripts/run-web-snapshots.ts`——HMR 串行先行再并行
- `scripts/wine-windows-gates.sh`——Wine 门（快照树 / hoisted / SHA-256 / 重试）
- `.github/workflows/ci.yml`（含 all-checks-passed L700-726、failover 变量注释）
- `.github/workflows/ci-master.yml`、`e2e.yml`、`sandbox.yml`、`expected-filenames.yml`、`pi-ai-provider-e2e.yml`
- `benchmarks/AGENTS.md` 与 `benchmarks/support/{built-worker,calibration}.ts`

## 最小例证

1. **单一 required check 可验证**：读 `.github/workflows/ci.yml` 的 `all-checks-passed` job——`needs` 列 9 个 job，`if: failure() || cancelled() || skipped()` 三条件判红。
2. **自跳过即失败的 grep**：读 `sandbox.yml` 的 run-guard 步骤——`grep "Test Files  2 passed (2)"`，把"预期 2 个文件都真跑了"写成机器检查。
3. **分区权重是实测的**：找 `.coverage-times.json` 的 GitHub cache 配置（windows-coverage job）——分区大小不是拍的，是上一轮实测时长。
