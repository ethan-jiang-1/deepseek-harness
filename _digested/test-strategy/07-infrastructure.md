# 07 — 测试基建：test-support 七件套、横切 helper 与 Python 面

> 本篇盘点 DSH 的测试基础设施：`packages/test-support/` 七件套、两个横切 helper、benchmarks 支撑、vitest setup 三件套、Python 侧。各工具服务哪些层见 [02](./02-tiers.md)；快照 owning 工具的规则细节见 [04](./04-snapshot-machinery.md)。

## 现象是什么：一个"待晋升"的基建组

`packages/test-support/` 组 README 的自我定位："每个包都是支持层基础设施；**当某个包获得产品约定与产品消费方时，它就会移出本组**"——测试基建被当作过渡层治理，不沉淀成第二产品。七件套 + 两个横切 helper 构成全部测试 harness 基建。

## 七件套逐个（硬事实）

| 包 | 一句话 | 关键契约 |
|---|---|---|
| `session-snapshot` | 快照层 owning 工具 | 封闭 manifest、类型化身份重绘、normalizer、workspace 比较、fixture 守卫、四协议适配器；包入口 import vitest，只能在 vitest 内用（[04](./04-snapshot-machinery.md)） |
| `agent-loop-testkit` | AgentLoop 依赖栈装配 | `mountAgentLoopTestDependencies()` 按固定顺序挂六服务（LLM→会话→投影注册表→系统提示词→工具注册表→agent 注册表）、**停在 AgentLoop 之前**（调用方控制 loop 加载）；不挂任何 LLM 适配器 |
| `llm-mock-server` | 可脚本 Messages 兼容 HTTP/SSE 故障服务器 | 每个已接受 `/v1/messages` 请求按 FIFO 消费下一个行为（校验先于游标推进）；带种子加权 `random` 行为支持可复现混合故障压力 |
| `llm-replay` | 无 key 回放插件 | `file/overrideFile/childFiles` 缺省取 `$DSH_SNAPSHOT_*`；嵌套 agent 按 first-call-order 绑定；`assertConsumed()` 把静默 underrun 变明确诊断 |
| `loader-smoke` | 双模式子进程启动器 | `runLoaderSmoke`：`DSH_EXAMPLE_MODE=lib`（CI）跑 built `lib/` 经真实包 exports；src 模式 tsx + `TSX_TSCONFIG_PATH` 零构建；隔离 cwd/DSH 主目录、deadline、只清理自建 |
| `remote-mock` | 端点具名 Remote mock | `mock.remote.<ns>.<method>`（缓存的原生 Vitest spy）；同一组函数应答**直接调用与真实 Connection 流量**；`assertNoUnmatched()` 收尾报漏配 |
| `client-runtime` | jsdom 测试台两档 | slot 档驱动生产 slot/store/带类型 Session fixture（"绝不重实现"）；整体档深导入 `src/assembly/`、从 bundle 现读 web roster、经生产 `bootClient` 启动 |

三个值得单独记的设计：

1. **llm-mock-server 是故障注入服务器，不是"让测试通过"的 stub。** 行为表：`connection_reset` / `stream_disconnect` / `stall` / `malformed_json` / `rate_limit` / `auth_error` / `context_overflow` / `slow_success` / `tool_call_success` / 带种子加权 `random`……把**真实 DeepSeek 适配器**指向它的 base URL，即可无密钥检验恢复策略（[01](./01-doctrine.md) 教义 4 的恢复测试要求：exhaustion / cancellation / transport-closing idle timeouts 等）。
2. **remote-mock 的 #remote-proxy 类型规则**：交付 Remote/mock 改动前必须 `pnpm run typecheck` 生成并检查真实 Client 类型——"无构建测试通过或推断为 `any` 都不是严格类型证据"。**mock 的类型诚实也有门。**
3. **client-runtime 的 roster 现读**：整体档从 `dsh.bundle.patch` 用启动器自己的 `entryListSchema` 现读 bundle roster，"bundle 一改下次测试即见"——不维护会漂移的手抄清单；`remoteDefaultResponses` 列出 roster 启动时会打的每个端点并注明调用方，插件新增 boot 调用会让 spec 在 dispose() 失败直到补行。

## 两个横切 helper

- `runLoaderSmoke`（`dsh-loader-smoke`）：所有 profile/snapshot 套件共用的子进程启动器（双模式，[02](./02-tiers.md) 启动模式表）；配套 `runFixtureTurn` 进程内 agent driver（任务经持久收件箱、转发规范事件、返回最终 assistant 文本）。
- `mountAgentLoopTestDependencies`（`dsh-agent-loop-testkit`）：进程内一次挂全依赖栈；三档选择规则——测生产 loop 用 `mountAgentLoopTestHarness()`（真 loop + 真 Agent + Inbox 认领）；只测队列消费方用 `createInboxStub()`（进程内数组、**绝不写 Session**）；待处理输入不应被访问用 `unsupportedInbox()`（首个意外依赖处抛错）。

## benchmarks 支撑与 vitest setup

- `benchmarks/support/built-worker.ts`：spawn 前从子进程 env 删除 `NODE_OPTIONS` 与 `TSX_TSCONFIG_PATH`、拒绝非 `.dsh-build/` 编译产物入口（[02](./02-tiers.md) "四层落实"）。
- `benchmarks/support/calibration.ts`：`CI_TIME_SCALE = 2` × `PERFORMANCE_BUDGET_HEADROOM = 1.25`；预算是 reviewed source constants，环境变量不得覆盖。
- vitest setup 三件套：`scripts/test-proxy-environment.ts`、`test-invariants.ts`、`test-dom-environment.ts`——unit 层全部 project 共用。

## Python 面（双 SDK 投影的另一半）

- `python/sdk/tests/`：`uv run --project python/sdk pytest`（无 tox）。两个值得记的样本：
  - `test_smoke_model.py` **直接从 `packages/core/session/src/types.ts` 读出 `SESSION_FORMAT_VERSION`**——跨语言把会话格式版本钉死：TS 侧改版本号，Python 测试立刻红。
  - `test_account_provider_snapshot.py` **复用 TS 侧场景的 `cordis.yml` 作 patch**，用真 Python SDK 对着 built CLI（`apps/cli/lib/bin.js`）跑，`DSH_SNAPSHOT: 'replay'`，比较 final_response / finish_reason / turn-end reason——"双 SDK 投影"不是比喻，是**同一场景资产驱动两个 SDK**。
- `scripts/snapshots/python-sdk-single-exe/`：7 个场景（minimal / advanced / restart / minimal-in-history / dynamic-tools / scheduler-recovery / authoring），由 `scripts/smoke-python-runtime.py` 驱动（`--update-snapshots` 重录），钉死单可执行 Python runtime 的 model-visible 输出（含 win-x64 变体）与父/子 session 日志（多代保留）；Python-runtime CI 拥有。
- 手动冒烟与 pytest 分离：`manual_sdk_agent_smoke.py` 的 docstring 明说 "This manual test is not collected by pytest"。
- **installed-wheel 黑盒 CI**（`build-exe-for-python-sdk.yml` + ci.yml 的 python-runtime job）：Python 侧的 built smoke——选中目标在全新 Python 3.10 venv 里安装 SDK 与 runtime wheel，在 checkout 之外运行（`PYTHONPATH`、`DSH_RUNTIME_MODE` 未设），先证明模块与可执行确实来自发行版，再跑全部 keyless 场景；trusted PR/master 额外跑 `--scenario sdk-live --installed-wheel`，花 key 做两轮工具调用并以外部字节比对收尾；缺 secret 硬失败而非自跳，fork/Dependabot 只跑 keyless 路径。这是 [01](./01-doctrine.md) 教义 6c（"real entry path = published artifact"）在 Python 发行物上的对位（决策记录：`.agents/notes/implemented/testing/2026-08-23-installed-python-wheel-black-box-ci.md`）。

## 为什么这么定（解释）

1. **基建组的"晋升"语义防测试债。** test-support 不是杂物间：包一旦获得产品约定与消费方就移出。DSH 把可复用 harness 抽成组级包，代价是每个包维护 README 契约与已知限制清单——这笔账被显式接受。
2. **每个 harness 的 README 都带"已知限制"节——mock 的不自欺清单。** llm-mock-server："随机权重建模测试压力，非生产事故频率"、"请求脚本按到达顺序执行"；remote-mock："仅进程内载体（无 HTTP/WS）、值按引用传递、不做值校验"；client-runtime："整体档不跑生成的 Remote 客户端（仍由 built-artifact e2e 覆盖）"。**每个替身都写明自己证明不了什么**——与 [01](./01-doctrine.md) 教义 4（mock 只放边界）的闭环：不仅限制 mock 的数量，还公开 mock 的边界。
3. **跨语言钉死用源码本身。** Python 测试读 TS 源文件里的常量而不是复制一份——单一事实源跨语言生效，这正是"双 SDK 投影同 PR 更新"规则在基建上的落点。

## 源码锚点

- `packages/test-support/README.zh.md` + 七个子包 README（各含使用规则与已知限制）
- `packages/test-support/session-snapshot/src/`——9 文件分工（harness/launcher/manifest/session-files/normalize/identity/workspace/suite）
- `packages/test-support/llm-replay/tests/session-format-corpus.spec.ts`——三棵树的语料校验
- `packages/test-support/loader-smoke/tests/fixtures/production-profile.ts`——profile 集成 driver
- `python/sdk/tests/test_smoke_model.py` / `test_account_provider_snapshot.py`
- `python/development.md`——installed-wheel 黑盒 CI 与 Python 发行物测试面
- `.github/workflows/build-exe-for-python-sdk.yml`——wheel 构建与 installed-wheel 测试 lane
- `scripts/smoke-python-runtime.py` + `scripts/snapshots/python-sdk-single-exe/`

## 最小例证

1. **晋升条款是现在时政策**：读 `packages/test-support/README.zh.md`——"当某个包获得产品约定与产品消费方时，它就会移出本组"，无例外口吻。
2. **跨语言钉死可验证**：读 `python/sdk/tests/test_smoke_model.py` 头部——从 `types.ts` 读 `SESSION_FORMAT_VERSION` 的逻辑就在前 20 行。
3. **限制清单普遍存在**：任读 llm-mock-server / remote-mock / client-runtime 的 README 末节——"限制 / known limitations"小节全部在位，且内容是具体的（指名机制而非套话）。
