# 04 · 边界与判据

前三篇讲了它是什么、为什么要有、怎么运转。这一篇讲**怎么判断**：一条测试算不算 `keyless`，它证明了什么，什么时候它不够。

这一篇是整组里最实用的——前面用来建立理解，这一篇用来做决定。

## 判据只有一条

要判断一条测试是不是 `keyless`，只看一件事：

> **这一遍跑下来，有没有任何请求发到真实的 provider 模型？**

没有 → keyless。有 → 不是。

判据的机械依据在 `vitest.snapshot.config.ts:28`-`:32`：`replay` 与 `refresh` 分支**根本不执行** `process.loadEnvFile()`，只有 `record` 才去读 key。key 不是「没给」，是**程序压根不需要**。

## 由此推出三个反直觉但正确的结论

### 一、假 key 也可以是 keyless

`apps/web/tests/smoke-real.e2e.ts:325` 塞 `DEEPSEEK_API_KEY: 'keyless-web-no-call'`，`apps/cli/tests/headless-shutdown.e2e.ts:91` 塞 `'keyless-shutdown-no-call'`。

环境里明明有 key 变量，这两条仍然算 keyless。为什么这么写？

因为**适配器需要这个变量存在才能启动**。给一个明显是哨兵的假值，同时满足两件事：进程能 boot，真发请求必然失败。它比完全不设更严格——不设变量时适配器可能自跳过，整条用例静默消失；设假值则强制它启动、并在真调用时炸。

所以字符串里的 `no-call` 才是断言，`keyless-` 只是命名习惯。

**判断看它会不会真发请求，不看 `DEEPSEEK_API_KEY` 在不在。**

### 二、会写盘也可以是 keyless

`refresh` 是 keyless 的，但它**会改写**提交进仓的期望输出与会话 fixture（`suite.ts:271`-`:273`）。

keyless 管的是**模型参与**，不管**会不会写文件**。`refresh` 不调模型，所以说它 keyless 成立；它写盘，那是另一回事。

**keyless 不等于只读。**

### 三、生产端反而不是 keyless

`record` 是唯一不 keyless 的档——而它恰恰是 keyless 资产的**生产者**。

`docs/testing.md:55` 那条强制要求（"Every non-trivial model-, protocol-, or human-visible change adds or updates a keyless recorded-session scenario in the same PR"）要求的**产物**是 keyless 的，**生产过程**则不是。

一点记忆法：**keyless 描述资产的消费方式，不描述生产方式。**

## 四种形态，证据强度不同

都叫 keyless，但钉住的东西不一样。混用会得出错的结论：

| 形态 | 机制 | 入口 | 钉住什么 | 强度 |
|---|---|---|---|---|
| **Snapshot replay** | 回放已提交录制，比对组装请求 / 协议输出 / 持久化日志 | `pnpm run test:snapshot` | 组装后的完整转录 | **中高** |
| **Snapshot refresh** | 同样回放，但现场重算期望并写回 | `pnpm run test:snapshot:refresh` | 同上，但会漂移 | 中（需逐份 review diff） |
| **LLM replay 插件** | 挂 `dsh-llm-replay` 顶替真 adapter | 场景 `cordis.snapshot.yml` | 真 agent 真插件，只有模型流回放 | 中 |
| **Assembled expectations** | 不经录制会话回转，直接断言组装后输出 | `pnpm run test:expected` | **只**有组装结果，无模型行为 | **低** |

第三与第四最容易混。`docs/testing.md:12` 对第四种给的关键定语是 **"without a recorded-session round trip"**——它连回放都没有，根本没有模型参与。把 assembled expectation 当成「模型行为已验证」是这个词最常见的误用。

## 边界：它证明什么、不证明什么

原话在 `docs/testing.md:25`：

> **"A no-key test proves plumbing; only a with-key run proves the agent works against a real model."**

| 你想知道 | keyless 够吗 | 为什么 |
|---|---|---|
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

1. **说一条用例 keyless 时**，给得出「它不发真实 provider 请求」的证据：挂了 replay adapter、是 assembled expectation、或跑在 `record` 之外的两档。**给不出就不是 keyless**，只是「碰巧没连上」。
2. **不要拿「没设 key」当 keyless 的证据**。自跳过会让用例静默消失，什么也没证明；`no-call` 哨兵假值反而是更强做法。
3. **不要拿 keyless 结果说「对真模型工作」**。它只到管道层。要那句结论，去跑 with-key。

## 它不是术语

顺带说清它在语言上的位置：`keyless` 在产品树里约 300 处命中、130 多个文件，但没有 `ctx.keyless`、没有 `KeylessMode` 类型、没有 glossary 条目。

它出现在两类位置：**描述与政策句**（`packages/test-support/README.md:12`、五份包 `description`、`AGENTS.md:158`、`docs/testing.md` 四处），以及**测试名与夹具注释**。

它是**形容词**——修饰证据，不命名机制。形容词不需要定义，只需要一个能判真的判据；而那个判据被写在配置文件的注释里，没进任何一份文档。这解释了为什么它被用得如此一致、却从未被说清：**每个作者都从注释学到了同一条判据，但没人把它写成一句话。**

## 下一步

查具体命令与词 → [05 速查](./05-cheatsheet.md)
