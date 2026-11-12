# 05 · 速查

词、命令、判据。不用读懂背景，查就行。

## 一句话各归各位

| 词 | 一句话 | 别混成 |
|---|---|---|
| **key** | 模型 provider 的 API key | 磁盘密钥、认证 token、加密密钥 |
| **keyless** | 这一遍没有请求发到真实 provider 模型 | 「环境没 key」「离线测试」 |
| **with-key** | 真调 live provider API 的那一遍 | 「更高级的 keyless」 |
| **record** | 真调模型跑一次，产出 fixture。**要 key** | keyless —— 它**不是** |
| **snapshot** | 提交进仓库的那份 session log | 「比日志更多的东西」——它**就是**日志 |
| **replay** | 拿 snapshot 当剧本，**用当前代码重跑一遍** | 「读日志」——它**是跑** |
| **refresh** | 回放并现场重算期望输出与会话 fixture | replay —— 它也回放，但**会写盘** |
| **fixture** | 那份录制的 session log，既是输入也是期望 | 「测试数据」——它同时是两个角色 |
| **plumbing** | keyless 能证的那一层：组装、派发、持久化 | 「智能体能干活」——那要 with-key |
| **self-skip** | 缺凭据时用例自己跳过 | 「省钱」——是不堵住无凭据贡献者 |

## 命令

| 命令 | 做什么 | 花 key |
|---|---|---|
| `pnpm run test:snapshot` | 回放全部录制场景并比对（**默认档**） | 否 |
| `pnpm run test:snapshot:record` | 真调模型重录 fixture 与期望输出 | **是** |
| `pnpm run test:snapshot:refresh` | 回放并重算 stdout 期望输出**与会话 fixture**（不改模型流） | 否 |
| `pnpm run test:expected` | 断言组装后的 CLI/进程输出（**不回放**，走另一份 config） | 否 |
| `pnpm run test:e2e` | 真调 live provider API | **是** |

`DSH_SNAPSHOT` 环境变量对应三档：`replay`（默认）/ `record` / `refresh`。只有 `record` 会读根 `.env`。

## 三档关系

```text
record   → 花 key，真调模型，产出 fixture                    ← 生产端，不是 keyless
replay   → 不花 key，不调模型，比对 fixture                  ← keyless，默认档
refresh  → 不花 key，不调模型，重写期望输出与会话 fixture    ← keyless，但会写盘
```

三档都读 `DSH_SNAPSHOT`，共用 `vitest.snapshot.config.ts`。`test:expected` 不在这条流水线上：它走 `vitest.expected.config.ts`，完全没有快照会话。

## 判据

**一条测试算不算 keyless，只看一件事：这一遍有没有请求发到真实 provider 模型。**

不看 `DEEPSEEK_API_KEY` 在不在（哨兵假值也算 keyless），不看会不会写盘（`refresh` 算），不看是不是生产端（`record` 才是生产端，它不算），也不看模型从哪来（录像算，mock 服务端也算）。

这条判据判的是**有没有花 key**，不是**证据有多强**。强度见本页末的「五类测试证据」。

## 决策表：我该用哪个

| 我要做什么 | 用哪个 |
|---|---|
| 改动可能影响模型看到的东西（tool schema、system prompt） | `test:snapshot`，并检查 `request/header` diff |
| 模型行为变了，需要更新录制 | `test:snapshot:record`（要 key） |
| 只改了期望输出的格式，模型流仍然有效 | `test:snapshot:refresh` |
| 只想验 CLI 组装与进程输出，不涉及模型 | `test:expected` |
| 要证明智能体对着真模型能完成任务 | `test:e2e`（with-key，无替代） |
| 要验新提示词效果是不是更好 | 必须真调 + 人工评估，keyless 给不了 |
| 复现用户报的 bug | 固化那次日志 → `test:snapshot` 反复重跑 |

## 它证什么、不证什么

| | keyless |
|---|---|
| 请求组装正确 | ✅ |
| 工具派发链路通 | ✅ |
| 结果正确落盘 | ✅ |
| 智能体能完成任务 | ❌ 必须 with-key |
| 新 prompt 更好 | ❌ 只能证「没变」 |
| 模型升级后仍准确 | ❌ **会假绿** |

## 五个常见误解

| 误解 | 实际 |
|---|---|
| 「keyless 是降级版测试」 | 是同一套真流程，只换掉模型那一段 |
| 「我不用跑，看日志就行」 | **必须跑**，用今天的代码重新执行 |
| 「日志不够才要 snapshot」 | **snapshot 就是日志**，去噪后提交进仓的那份 |
| 「keyless 就等于 replay」 | `replay ⊂ keyless`；`refresh`、`test:expected`、mock 类测试也算 |
| 「keyless 是免费的」 | 它指**运行方式不花 key**；建资产要花——`record` 与 `test:e2e` 都要 key 和费用 |

## 五类测试证据

判据只回答「花不花 key」——把 `record` 和 `test:e2e`（要 key）与其余五类（不要 key）分开。同在判据内的几档，能证的东西差得很远：

| 形态 | 入口 | 钉住什么 | 强度 |
|---|---|---|---|
| Snapshot replay | `test:snapshot` | 组装后的完整转录 + 持久化日志 | **高** |
| Snapshot refresh | `test:snapshot:refresh` | 同上，但会漂移，需逐份 review diff | 中 |
| LLM replay 插件 | 场景 `cordis.snapshot.yml` | 真 agent 真插件，只有模型流回放 | 中 |
| Mock 服务端 / loader-smoke | `llm-mock-server`、`loader-smoke` | 假模型行为或**完全没有模型** | 低 |
| Assembled expectations | `test:expected` | **只**有组装结果，无模型行为 | **低** |

前三行是 keyless；后两行也是 keyless，但**不要**拿它们说「模型行为已验证」。展开见 [04](./04-boundaries.md#五类形态证据强度不同)。

## 关键出处

| 事实 | 位置 |
|---|---|
| 三档定义与「replay 是 keyless 默认」 | `vitest.snapshot.config.ts:28`-`:32` |
| `mode` 三值语义，**含 refresh 写会话 fixture** | `packages/test-support/session-snapshot/src/suite.ts:269`-`:274` |
| refresh 会写 stdout、sidecar 与可比会话输出 | `packages/test-support/session-snapshot/README.md`「Understand the implementation」 |
| 「无 key 证管道，with-key 证智能体」 | `docs/testing.md:25` |
| 每个非平凡改动要更新 keyless 场景 | `docs/testing.md:55` |
| assembled expectation 不走回放 | `docs/testing.md:12` |
| 假 key 哨兵两例 | `apps/web/tests/smoke-real.e2e.ts:325`、`apps/cli/tests/headless-shutdown.e2e.ts:91` |
| postmortem 0001（178 绿 / 100% 覆盖 / 全崩） | `docs/postmortem/0001-acp-default-export-drops-inject.md` |
| 回放插件不录制、不修复 | `packages/test-support/llm-replay/README.md` |
| mock 服务端不调真模型 | `packages/test-support/llm-mock-server/README.md` |
