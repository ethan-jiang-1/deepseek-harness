# 02 · 证明边界、五档证据强度与命令速查

知道了 `keyless` 的判据和回放原理，落到日常写测试与审 PR 时，最核心的实操问题只有两个：**手头这条绿灯到底证明了什么？我现在的改动该跑哪条命令？**

---

## 一、唯一边界表：`keyless` 能证明什么、绝对证明不了什么

[`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md) 用一句话划清了整套体系的分工：**`"A no-key test proves plumbing; only a with-key run proves the agent works against a real model."`**（无密钥测试证明管道没坏；只有带密钥真跑才能证明智能体面对真模型能干活。）

| 你想确认的问题 | `keyless` 够不够？ | 原因与正确做法 |
|---|---|---|
| **插件在真实 Loader 下能不能正常挂载、不丢依赖？** | ✅ **够用** | `test:snapshot` 与 `loader-smoke` 都走真实配置解析与插件装配，能直接拦住 [`postmortem 0001`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md) 那类手搭单测漏掉的加载崩溃 |
| **改动有没有意外破坏发给模型的系统提示词或工具 schema？** | ✅ **够用** | 代表场景钉死了 `system-prompt.expected.md` 与 `tool-schemas.expected.json`，任何模型可见输入的变化都会在快照对比中暴露 |
| **工具派发、权限拦截、沙箱隔离与会话落盘链路通不通？** | ✅ **够用** | 回放期间工具注册表、沙箱子进程、JSONL 持久化与工作区文件比对全部真跑 |
| **SDK / ACP 协议通知与 Web 前端卡片渲染对不对？** | ✅ **够用** | 对应 profile 快照与 `test:web` 会逐条核对协议流、DOM 投影与浏览器 ARIA 快照 |
| **智能体面对真实模型能不能独立完成这项任务？** | ❌ **绝对不够** | 回放里的工具调用决策是录制那天旧模型做出的，不是今天真模型跑出来的；必须跑 `with-key` 的 `pnpm run test:e2e` 或真实 profile 冒烟 |
| **新改写的提示词是不是比原来更聪明、更少犯错？** | ❌ **绝对不够** | 快照回放只能证明提示词文本“变了”或“没变”，无法评估语义效果好坏；必须真调模型评测 |
| **线上模型版本升级或服务端行为变化后，现有提示词还准不准？** | ❌ **绝对不够（且会静默假绿）** | **这是最容易踩的坑**：夹具里躺着的是旧模型的历史输出，哪怕线上新模型对同一提示词已经不再调工具了，本地和 CI 的 `keyless` 快照依然会一片全绿、毫无警报 |

因此，`keyless` 和 `with-key` 从来不是二选一：比如开发一个模型或搜索接入插件时，既要有 `keyless` 测试锁死请求组装、重试容错与会话落盘，也要在 `*.e2e.ts` 里用 `describe.skipIf(!DEEPSEEK_API_KEY)` 挂上连接真实服务商的在线验证。

---

## 二、同属 `keyless` 的五档测试证据（按含金量从高到低）

同样不花 API Key，不同测试形态锁住的事实差了好几个量级。审阅 PR 时切忌拿低档测试的通过记录去背书高档结论：

| 档位 | 测试形态与入口 | 底层拿什么代替真模型 | 真正锁住了什么 | 证据强度与使用注意 |
|---|---|---|---|---|
| **1** | **已入库的录制会话回放**<br/>`pnpm run test:snapshot`<br/>`pnpm run test:web` | [`dsh-llm-replay`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/README.md)（只读回放真模型历史流） | 真实发布 profile 子进程 + 完整组装请求头 + 协议/界面输出 + 持久化日志 + `workspace.expected/` | **最高**——DSH 无密钥回归的主力防线，CI 强制运行只读 `replay` |
| **2** | **本地重算期望的回放刷新**<br/>`pnpm run test:snapshot:refresh`<br/>`pnpm run test:web:refresh` | 同上（跑同一份历史模型流，但把新算出的期望写回磁盘） | 执行链路与第 1 档相同，但期望基线正在被当前代码改写 | **高（仅限开发期更新基线）**——写出后必须逐行人工审阅 `git diff`，否则会把 bug 一并刷成“新标准”（见 [FAQ 21](../21_recorded-session-snapshots/answer.md)） |
| **3** | **包内局部挂载 `llm-replay` 的集成测试**<br/>各包 `tests/` 下的组合用例 | `dsh-llm-replay`（挂载在包级测试 `cordis.yml` 上） | 真实 Loader、真实 `agent-loop` 与目标插件接缝，消费真实历史模型流 | **中高**——适合测单个子系统与循环的交互，但不覆盖顶层发布 profile 的完整默认插件集 |
| **4** | **脚本化假服务端 / 无模型 Loader 冒烟**<br/>`dsh-llm-mock-server`、`dsh-remote-mock`、`dsh-loader-smoke`、带 `'*-no-call'` 假 Key 的启动测试 | 人手编写的固定响应/故障脚本，或压根不触发模型调用 | 限流/断流重试状态机、纯前端 UI 交互、或“真实子进程能正常启停且绝不偷发请求” | **中低**——模型行为是虚构的或不存在的，**严禁拿它声称“模型行为已验证”** |
| **5** | **无会话往返的组装输出断言**<br/>`pnpm run test:expected` | 全程无会话回放（*"without a recorded-session round trip"*） | CLI 帮助文本、配置展开、进程退出码或纯静态组装产物 | **最低**——只证外层壳与静态组装，完全不涉及智能体循环 |

---

## 三、五个常见误区速查

| 常见误区 | 真实情况 |
|---|---|
| **“没设 `DEEPSEEK_API_KEY` 跑绿了，就证明这条测试是 `keyless`”** | 未必。如果用例写了 `skipIf(!DEEPSEEK_API_KEY)`，没配 Key 时它只是**静默跳过（`self-skip`）**，什么都没测到。真正要断言“绝不发请求”的 `keyless` 测试，往往会故意注入 `'keyless-*-no-call'` 哨兵假值防止被跳过。 |
| **“`keyless` 测试是在简化模拟环境里跑”** | 在 `test:snapshot` 里，Loader、插件、权限、沙箱、工具、JSONL 落盘全都是生产级真代码，只替掉了模型网络请求那一格。 |
| **“因为普通日志信息不够，才要额外搞一套 snapshot”** | 因果反了：`snapshot` 就是去噪、拆出提示词/工具 sidecar 后提交进 Git 的会话日志；日志本身完备（`model-visible ⟺ logged`）它才立得住。 |
| **“`keyless` 和 `replay` 是同一个词”** | `replay` 只是 `keyless` 里证据最强的第 1～3 档；第 4～5 档的 mock 服务端、`loader-smoke` 和 `test:expected` 也都是 `keyless`。 |
| **“`keyless` 意味着整套测试完全免费”** | 重复运行（`replay`）确实零 API 开销，但建资产（`record`）和兜底模型真实表现（`test:e2e`）必须花真 Key 和推理费用，只是把一次真调用摊薄到了无数次回归验证上。 |

---

## 四、常用命令与选型速查

| 你手头的场景 | 该跑哪条命令 | 需要真 Key？ |
|---|---|---|
| 改了插件、工具 schema、系统提示词或会话/协议逻辑，本地跑定向快照回归 | `pnpm run test:snapshot -- -t <场景关键词>`（全量：`pnpm run test:snapshot`） | 否 |
| 改了 Web 客户端卡片或交互展示，核对浏览器快照与 ARIA 树 | `pnpm run test:web` | 否 |
| 改动导致期望输出、提示词或工具 schema 有意变化，但旧模型回复流依然有效 | `pnpm run test:snapshot:refresh`（Web 侧：`pnpm run test:web:refresh`），跑完必审 `git diff` | 否 |
| 新增了录制场景，或工具改名/交互步数变化导致旧模型流已对不上 | `pnpm run test:snapshot:record` | **是** |
| 只改了 CLI 参数、静态进程输出或非会话期望文件 | `pnpm run test:expected`（更新期望：`pnpm run test:expected:refresh`） | 否 |
| 改了模型/搜索 Provider、推理参数，或需确认智能体对真模型确实能完成任务 | `pnpm run test:e2e` | **是** |

---

## 五、仓库源码与文档入口

- **测试分层总纲与快照强制策略**：[`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)
- **顶层快照语料归属与目录规范**：[`snapshots/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md)
- **`DSH_SNAPSHOT` 三档入口与 `.env` 按需读取逻辑**：[`vitest.snapshot.config.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/vitest.snapshot.config.ts)
- **无密钥测试基础设施总览**：[`packages/test-support/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/README.md)
- **模型流回放插件契约与 `replay.override.json` 说明**：[`packages/test-support/llm-replay/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/README.md)
- **会话快照套件工厂、去噪归一化与 sidecar 机制**：[`packages/test-support/session-snapshot/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/README.md)、[`packages/test-support/session-snapshot/src/suite.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/src/suite.ts)
- **真实事故复盘（178 单测全绿 / 100% 覆盖率仍漏掉真实 Loader 崩溃）**：[`docs/postmortem/0001-acp-default-export-drops-inject.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md)
- **哨兵假 Key（`*-no-call`）典型用例**：[`apps/web/tests/smoke-real.e2e.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/smoke-real.e2e.ts)、[`apps/cli/tests/headless-shutdown.e2e.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/tests/headless-shutdown.e2e.ts)

> 核验状态见 [核验基线登记](../00-baseline.md)。
