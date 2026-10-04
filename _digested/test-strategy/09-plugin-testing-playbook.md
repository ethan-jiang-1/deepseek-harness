# 09 — 插件测试实战：五个真实插件的测试组合解剖

> 本篇读仓库里的真插件测试套件，提炼可照抄的组合模式。[08](./08-plugin-testing.md) 给出台阶模型（导出守卫 → 行为 spec → 注册生命周期 → REAL composition → 组装转录），本篇按五个插件类型各解剖一套真实组合。基线 `639ed01539`。

## 现象是什么：组合的形状跟着"插件承诺"走

没有两套插件测试长得一样，但差异不是随机的——**插件承诺什么，测试组合就长什么样**：工具插件承诺行为与 Config，provider 插件承诺可选性与实例拓扑，toolview 承诺组装面与文案，guard 插件承诺"什么时不做"，LLM-backed 插件承诺"对真模型工作"。以下五套真实组合各自兑现一种承诺；写自己的插件时按承诺挑组合，而不是按文件数抄。

## 一、工具插件全家桶：`tool-todo`（五文件各司其职）

`packages/todo/tool-todo/tests/` 是"一个工具插件该有的全部测试文件"的最小完备样例：

| 文件 | 测什么 | 关键手法 |
|---|---|---|
| `tool-todo.spec.ts` | 注册后的工具行为 | 挂真 `ToolRuntime`/`SystemPrompt`/`SessionProjectionRegistry`，**只把 parent Agent 换成带真 Session 的假包装**；从 `ctx.tools.execute()` 真入口调 `todo_write`，断言 schema 形状、参数校验、错误结果、session log 副作用 |
| `integration.spec.ts` | 穿过 agent-loop 的端内行为 | `mountAgentLoopTestDependencies(ctx)` 挂全依赖栈 + 从 `core/agent-loop/tests/mock-adapter.ts` 复用 `MockAdapter` 脚本化模型回复（源码平面跨包导入，[02](./02-tiers.md)）——模型说"调 todo_write"，断言工具真被调、结果真回填 |
| `loader-composition.spec.ts` | Config 真实可配置性 | 进程内真 `Loader`+`Include` boot 临时 `cordis.yml`；同一个 flag 断言**两脸**：模型可见 description 措辞随 `allowParallelInProgress` 变、并行写被拒/放行 |
| `projection.spec.ts` | 投影提供者 + HMR-safety | `todos` projection 的读路径；dispose 贡献 fiber 断言清理（`(HMR safety)`） |
| `invariant.spec.ts` | 快照不变量 | 插件发布 `./invariant` 子路径导出，挂 `InvariantRegistry, { enabled: true }` 测历史/在线并行快照的接受性 |

台阶映射：`tool-todo.spec` 与 `integration.spec` 是**台阶二的两遍**（直调注册入口 / 穿 loop 端到端）；`projection.spec` 是台阶三；`loader-composition.spec` 是台阶四的进程内级；`todo-write` 录制场景（`snapshots/session/todo-write/`）兑现台阶五。分工逻辑：**三遍测的不是同一个对象**——工具体、事件序列、组装语义各归各，不是重复。

## 二、provider 插件：`subagent-codex`（可选性 + 拓扑）

`packages/subagent/subagent-codex/tests/loader-composition.e2e.ts` 单文件单用例，断言密度极高：

- **可选性**：`PATH: ''` 启动——"Loading the optional package must not probe or start a Codex binary"（可选依赖缺席时不探测、不启动）；
- **拓扑**：Bundle default + 两个命名实例（`codex-primary`/`codex-secondary`）+ 各自的 capabilities JSON（`agentOptions`/`outputSchema`/`depthLimit`/`toolFilter`/`persona` 逐项断言——本例三实例全 false）+ `inheritsParentContext`；
- **结构来自产品面**：patch 路径从 `package.json` 的 `dsh.bundle.patch` 现读，"Codex package must declare a Bundle patch" 缺失即 throw；
- **CI 挂载**：此文件在 built-bin-smoke 门的 16 文件清单里（[05](./05-ci-gates.md)），CI 用 built `lib/` 以 `DSH_EXAMPLE_MODE=lib` 再跑一遍。

同族样板：`subagent-{claude-code,dsh-sdk,acp}`、`host/product-telemetry-otel`、`session/session-telemetry-otel` 的 `loader-composition.e2e.ts`——可选服务插件全部用这个模式。

## 三、client toolview 插件：`ui-tool` 的 ask-question-row

`packages/client/ui-tool/tests/ask-question-row.client.spec.tsx`（jsdom pragma）展示 client 侧的三条纪律：

- **验收清单式文件头**：docstring 逐条列出本文件断言的验收点（`waiting` 摘要、settled 后从结果 JSON 读 answered-count、skipped 排除、ASK_CANCELLED/ASK_ABORTED 的可读问题列表、reopen 动作、interrupted/failed 共享 ToolRow 语义、畸形结果兜底）——测试文件自己就是验收记录；
- **locale-owned**：经 `makeTranslate` + 各包 zh 词典断言用户可见文案，不硬编码字符串（`verify-client-ui-i18n` 门在 CI 拦截违规）；
- **export 纪律就地引用**：`// Export discipline: packages/client/AGENTS.md.`——测试注释回指规则原文。

同族：`assembly-surfaces.client.spec.tsx`——头注释自述 "Tool assembly acceptance through the real ui-conversation host"：经 `SlotTestRuntime` 与真实 ui-conversation host 断言 toolview 组装（chat / conversation / tool 三方 `apply`/`inject` 协同、shipped 中文文案、locale 钉在 zh-CN）。

## 四、guard 插件：`timeout-policy`（信号语义矩阵）

`packages/guard/timeout-policy/tests/timeout-policy.spec.ts` 展示"守卫类插件"的测法——**把政策语义展开成互斥分支矩阵**：

- `delegation`：无预算的工具原样透传（不碰 `exec.signal`）；快返回的预算工具保有自己的结果；
- `signal restoration`：包装后 caller signal 在 post-execute 恢复；
- `TOOL_TIMEOUT replacement (deadline wins)`：deadline 先到→工具结果被替换为 `TOOL_TIMEOUT`；provider abort 先到→保留 registry ABORTED（"upstream cancel, not our timeout"）；两者竞态的先后序各有独立用例。

guard 插件的测试对象不是"它做了什么"而是"**它什么时不做**"（透传/恢复/保留）——分支矩阵必须含"不触发"的负例。这正是 [01](./01-doctrine.md) 教义 6b "A guard only guards if the regression fails it" 的测试形态：每个分支都对应一条会被某回归破坏的边界。

## 五、LLM-backed 插件：`session-title-llm`（脚本化模型 + with-key 对）

`packages/session/session-title-llm/tests/llm.spec.ts` 展示"模型是依赖"的插件测法：

- **RecordingAdapter**：子类化真 `LlmAdapter`，按脚本产出 `StreamChunk` 并记录收到的 `GenerateOptions`——断言模型请求本身（消息形状、signal）而不只是最终结果；
- **CooperativeAdapter**：挂起直到 signal，以 `signal.reason` reject——精确演练取消路径的 reason 传播；
- **Config 校验与超时码分开测**：`resolveSessionTitleLlmConfig` 的边界（`timeoutMs` 不得超过 `MAX_TIMER_DELAY_MS`，逐条 toThrow）与超时结果码 `SESSION_TITLE_TIMEOUT_CODE` 各有断言；
- **keyless spec + with-key e2e 成对**：provider 插件 `session-title-first-prompt-llm`（其 src 使用本包的共享 LLM 标题机制）在 `provider.e2e.ts` 用 `describe.skipIf(!DEEPSEEK_API_KEY)` 对真模型跑——离线证明逻辑、在线证明"对真模型工作"（[01](./01-doctrine.md) 教义 3 的成对形态）。

## 快照场景怎么"带上"一个插件（[04](./04-snapshot-machinery.md) 的插件视角）

场景 patch `snapshots/session/agent-instructions/cordis.snapshot.yml` 的三手：

1. `disabled: true` 禁掉真实 provider（`dsh-llm-deepseek-api-key`）——回放模型流接管；
2. 场景 `config:` 覆盖被测插件的参数（`agent-instructions.maxBytes: 65536`、`projectRootMarkers`）；
3. 基础设施插件经 `!!js` 表达式落位（`session-persistence-jsonl.root: !!js dshHomePath('sessions')`——cordis.yml 允许 `!!js` 于 plugin `config`，[01](./01-doctrine.md)）。

结果：**真实插件 + 场景配置 + 回放模型流**进 210 个录制场景——插件的 model-visible 面在每个 PR 被无 key 复验。

## 为什么这么定（解释）

1. **组合的形状跟着"插件承诺"走**：工具插件承诺行为与 Config（五件套）；provider 插件承诺可选性与拓扑（loader-composition + capabilities JSON）；toolview 承诺组装面与文案（assembly-surfaces + locale）；guard 承诺"不做什么"（负例矩阵）；LLM-backed 承诺对真模型工作（成对 spec/e2e）。**先写承诺，再挑组合**。
2. **测试文件的注释密度是有意的**：tool-todo.spec 解释"为什么只 stand-in agent wrapper"，subagent-codex 解释"为什么 PATH 为空"——每个 stand-in 都写明自己证明不了什么，与 [07](./07-infrastructure.md) 的"mock 不自欺清单"同一条纪律落到测试代码里。

## 源码锚点

- `packages/todo/tool-todo/tests/`——五件套
- `packages/subagent/subagent-codex/tests/loader-composition.e2e.ts`（含 `fixtures/loader/driver.ts` + `codex.patch.yml`）
- `packages/client/ui-tool/tests/ask-question-row.client.spec.tsx`、`assembly-surfaces.client.spec.tsx`
- `packages/guard/timeout-policy/tests/timeout-policy.spec.ts`
- `packages/session/session-title-llm/tests/llm.spec.ts` + `packages/session/session-title-first-prompt-llm/tests/provider.e2e.ts`
- `snapshots/session/agent-instructions/cordis.snapshot.yml`
- `packages/core/agent-loop/tests/mock-adapter.ts`——跨包复用的 scripted 模型

## 最小例证

1. **五件套可数**：`ls packages/todo/tool-todo/tests/`——5 个 spec 各占一个台阶。
2. **可选性可复现**：`grep -n "PATH: ''" packages/subagent/subagent-codex/tests/loader-composition.e2e.ts`。
3. **成对形态可检索**：`grep -rn "skipIf(!process.env.DEEPSEEK_API_KEY)" packages/session --include="*.e2e.ts"`。
