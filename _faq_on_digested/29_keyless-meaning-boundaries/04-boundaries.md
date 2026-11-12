# 04 · 边界与判据

前三篇讲了它是什么、为什么要有、怎么运转。这一篇讲**怎么判断**：一条测试算不算 `keyless`，它证明了什么，什么时候它不够。

这一篇是整组里最实用的——前面用来建立理解，这一篇用来做决定。**全组「它证什么、不证什么」只有这里一处**，其他篇只引用。

## 判据只有一条

要判断一条测试是不是 `keyless`，只看一件事：

> **这一遍跑下来，有没有任何请求发到真实的 provider 模型？**

没有 → keyless。有 → 不是。

判据的机械依据在 `vitest.snapshot.config.ts:28`-`:32`：`replay` 与 `refresh` 分支**根本不执行** `process.loadEnvFile()`，只有 `record` 才去读 key。key 不是「没给」，是**程序压根不需要**。

注意这条判据判的是**花不花 key**，不是**证据强不强**。两者分离，所以下面四个结论都不反直觉——它们只是在提醒你：判据的边界比你以为的宽。强度排名在[本节末](#五类形态证据强度不同)。

## 四个反直觉但正确的结论

### 一、假 key 也可以是 keyless

`apps/web/tests/smoke-real.e2e.ts:325` 塞 `DEEPSEEK_API_KEY: 'keyless-web-no-call'`，`apps/cli/tests/headless-shutdown.e2e.ts:91` 塞 `'keyless-shutdown-no-call'`。

环境里明明有 key 变量，这两条仍然算 keyless。为什么这么写？

因为**适配器需要这个变量存在才能启动**。给一个明显是哨兵的假值，同时满足两件事：进程能 boot，真发请求必然失败。它比完全不设更严格——不设变量时适配器可能自跳过，整条用例静默消失；设假值则强制它启动、并在真调用时炸。

所以字符串里的 `no-call` 才是断言，`keyless-` 只是命名习惯。

**判断看它会不会真发请求，不看 `DEEPSEEK_API_KEY` 在不在。**

### 二、会写盘也可以是 keyless

`refresh` 是 keyless 的，但它**会改写**提交进仓的期望输出与会话 fixture（`suite.ts:271`-`:273`；`session-snapshot` README 更具体：写 stdout、自有 prompt/tool-schema sidecar，以及一份新生成的当前格式可比会话日志）。

keyless 管的是**模型参与**，不管**会不会写文件**。`refresh` 不调模型，所以说它 keyless 成立；它写盘，那是另一回事。

**keyless 不等于只读。**

### 三、mock 也可以是 keyless——但它不是 replay

判据只问「有没有打到真 provider」，不问你用什么顶替模型。所以：

| 包 | 顶替了什么 | 算 keyless 吗 | 算 replay 吗 |
| --- | --- | --- | --- |
| `dsh-llm-replay` | 真模型的**真实历史回答** | 算 | **算** |
| `dsh-llm-mock-server` | 脚本写的**故障行为**（限流、超时、畸形块） | 算 | 不算 |
| `dsh-remote-mock` | 整个 Host（浏览器端测试） | 算 | 不算 |
| `dsh-loader-smoke` | 什么也不顶替，**根本没有模型** | 算 | 不算 |

四条都不花 key，所以四条都在判据内。但「算 keyless」和「能证明模型行为」是两件事：只有 replay 的回放内容是**模型真的说过的**。

`llm-mock-server` 和 `llm-replay` 常被一起提，方向却相反：前者**伪造**模型的故障行为（测重试、超时），后者**重放**模型的真实回答（测正常流程）。

### 四、生产端反而不是 keyless

`record` 是唯一不 keyless 的档——而它恰恰是 keyless 资产的**生产者**。

`docs/testing.md:55` 那条强制要求（"Every non-trivial model-, protocol-, or human-visible change adds or updates a keyless recorded-session scenario in the same PR"）要求的**产物**是 keyless 的，**生产过程**则不是。

一点记忆法：**keyless 描述资产的消费方式，不描述生产方式。**

## 五类形态，证据强度不同

判据不排名。同样是 keyless，钉住的东西不一样，混用会得出错的结论：

| 形态 | 机制 | 入口 | 钉住什么 | 强度 |
| --- | --- | --- | --- | --- |
| **Snapshot replay** | 回放已提交录制，比对组装请求 / 协议输出 / 持久化日志 | `pnpm run test:snapshot` | 组装后的完整转录 | **高** |
| **Snapshot refresh** | 同样回放，但现场重算期望并写回 | `pnpm run test:snapshot:refresh` | 同上，但会漂移 | 中（需逐份 review diff） |
| **LLM replay 插件** | 挂 `dsh-llm-replay` 顶替真 adapter | 场景 `cordis.snapshot.yml` | 真 agent 真插件，只有模型流回放 | 中 |
| **Mock / loader-smoke** | 脚本化故障服务端，或不起模型的真 Loader | `llm-mock-server`、`loader-smoke` | 假模型行为，或**完全没有模型** | 低 |
| **Assembled expectations** | 不经录制会话回转，直接断言组装后输出 | `pnpm run test:expected` | **只**有组装结果，无模型行为 | **低** |

第三到第五最容易互相冒充。`docs/testing.md:12` 对最后一种给的关键定语是 **"without a recorded-session round trip"**——它连回放都没有，根本没有模型参与。把 assembled expectation 当成「模型行为已验证」，是这个词最常见的误用。

## 边界：它证明什么、不证明什么

原话在 `docs/testing.md:25`：

> **"A no-key test proves plumbing; only a with-key run proves the agent works against a real model."**

| 你想知道 | keyless 够吗 | 为什么 |
| --- | --- | --- |
| 代码有没有搞坏请求组装 | ✅ 够 | `request/header` 是断言点 |
| 模型有没有看到新加的工具描述 | ✅ 够 | 同上 |
| 工具派发链路有没有断 | ✅ 够 | 真管道真执行 |
| 结果有没有正确落盘 | ✅ 够 | 完整日志可逐字节比对 |
| **智能体对真模型能不能完成这个任务** | ❌ **不够** | 录像里是别人跑的结果 |
| **新提示词是不是更好了** | ❌ **不够** | 回放只能证「没变」，证不了「更好」 |
| **模型升级后还准不准** | ❌ **不够** | **录像会过期，且过期时不报警** |

最后一条最危险，因为它不表现为失败，表现为**假绿**。模型换了、能力变了、提示词不再灵了，快照照样全绿。

## 与 with-key 是分工，不是替代

`docs/testing.md:25` 紧接着那句 "Self-skip … is not a cost signal" 说明了另一半：自跳过不是省钱，是不把没凭据的贡献者堵在门外。

实际代码里这对关系长这样：插件在 `provider.e2e.ts` 用 `describe.skipIf(!DEEPSEEK_API_KEY)` 对真模型跑一遍（在线证明能用），同包的 spec 走 keyless（离线证明逻辑）。**两个都要有。**

## 可判真的三条用法

写测试或审 PR 时用：

1. **说一条用例 keyless 时**，给得出「它不发真实 provider 请求」的证据：挂了 replay adapter、用了 mock 服务端、是 assembled expectation、或跑在 `record` 之外的两档。**给不出就不是 keyless**，只是「碰巧没连上」。
2. **不要拿「没设 key」当 keyless 的证据**。自跳过会让用例静默消失，什么也没证明；`no-call` 哨兵假值反而是更强做法。
3. **不要拿 keyless 结果说「对真模型工作」**。它只到管道层。要那句结论，去跑 with-key。

## 它在语言上的位置

`keyless` 在产品树里约 300 处命中、130 多个文件，但没有 `ctx.keyless`、没有 `KeylessMode` 类型、没有 glossary 条目。

它出现在两类位置：

- **描述与政策句**——修饰一份**产物或一套跑法**：`packages/test-support/README.md:12`（"deterministic, keyless ways"）、`llm-replay` 与 `loader-smoke` 的 `description`、`AGENTS.md:158`、`docs/testing.md` 的四处。
- **测试名与夹具注释**——修饰**这一条用例**：`keyless-web-no-call`、`keyless-shutdown-no-call` 这类哨兵值，以及 `cordis.snapshot.yml` 的注释。

两处的语法位置不同，判据相同：**都是「这一遍不发真请求」**。所以拿到一个修饰 `keyless` 的名词，先问它指的是产物、跑法，还是单条用例——三者共用一条判据，不需要三套定义。

没有类型与术语条目，不表示它含糊；它是一条**形容词式的判据**：修饰证据，不命名机制。判据本身被写在 `vitest.snapshot.config.ts` 的注释里，没进任何一份政策文档——这就是为什么每个作者用得都一致，却没人能一句话说清。

## 下一步

查具体命令与词 → [05 速查](./05-cheatsheet.md)
