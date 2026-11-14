# 答案 29 · `keyless` 是一条判据，不是一档环境

> **第一次来？只看 [00 导览](./00-index.md)。** 那一页五分钟建立全貌，不预设任何前置知识。
>
> 这一页是给「已经知道大概是什么、想直接要那句话」的人用的。

## 最短的回答

**`keyless` 只断言一件事：这一遍跑下来，没有任何请求发到真实的 provider 模型。**

不是「环境里没有 key」，不是「不写文件」，不是「某个固定档位」，也不是「便宜或免费的测试」。判据是**这一次运行有没有触达真模型**，其余一切——有没有假 key、会不会写盘、是不是生产端——都不影响判定。

- **它怎么做到**：让真模型跑一次并录下回答，以后每次用录像代替那一次网络请求；代码、插件、工具派发、落盘全部真跑。换句话说，**只换掉「模型说了什么」这一格**。
- **它为什么存在**：真调用要 key（外部贡献者没有）、mock 又测不出真管道（postmortem 0001：178 测试全绿 / 覆盖率 100% / 功能全崩）。它把「跑一遍」切成 `record` 与 `replay` 两半，让昂贵的一半发生一次。
- **它到哪为止**：只证管道，不证智能体能干活；对模型升级完全不敏感，**过期时不报警**。原话在 `docs/testing.md:25`。

## 按问题找（不用通读）

| 你的问题 | 去哪 |
|---|---|
| 完全没概念，想要五分钟全貌 | [00 导览](./00-index.md) |
| 名字怎么来的、由哪些部分组成、在仓库哪里 | [01 它是什么](./01-what-it-is.md) |
| 为什么非得造这么个东西，它挡的是哪一刀 | [02 它解决什么问题](./02-why-it-exists.md) |
| 「回放」到底是读还是跑 | [03 replay 到底在做什么](./03-how-replay-works.md) |
| 这条测试算不算 keyless、它证明了什么 | [04 边界与判据](./04-boundaries.md) |
| 查词、查命令、查决策 | [05 速查](./05-cheatsheet.md) |

## 四句话把边界钉住

这四句是整组最容易记错的地方，展开在 [04](./04-boundaries.md)：

1. **假 key 也算 keyless。** `apps/web/tests/smoke-real.e2e.ts:325` 塞 `DEEPSEEK_API_KEY: 'keyless-web-no-call'`——变量在，但真发请求必然失败。断言藏在 `no-call` 三个字里，不在变量名上。
2. **会写盘也算 keyless。** `refresh` 不调模型，但它会重写 stdout 期望输出**和**可比的会话 fixture。
3. **mock 也算 keyless。** 判据只问「有没有打到真 provider」，不问你用录像还是假服务端。`llm-mock-server`、`remote-mock` 都不调真模型，所以都落在判据内——但它们**不是 replay**，证据强度差一档。
4. **生产端反而不算。** `record` 是唯一不 keyless 的档，而它恰恰是 keyless 资产的生产者。**keyless 描述消费方式，不描述生产方式。**

## 它不是什么

| 说法 | 为什么不对 |
|---|---|
| 「keyless 是降级版测试」 | 同一套真流程，只换掉模型那一段 |
| 「看日志就行，不用跑」 | 必须用**今天的代码**重演，旧日志里是旧代码 |
| 「日志不够才要 snapshot」 | 因果相反：**snapshot 就是日志**，去重后提交进仓的那份 |
| 「keyless 就等于 replay」 | `replay ⊂ keyless`；`refresh`、`test:expected`、mock 类测试也在里面 |
| 「keyless 是免费的」 | 它指运行方式不花 key；建资产要花——`record` 和 `test:e2e` 都要 key 和费用 |

## 不在本组

- 快照机制本身的完整流程、语料治理与强制政策 → [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)、[`snapshots/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md)。
- 快照作为**可移植资产**（外仓能不能用、值多少、怎么组织）→ [FAQ 21](../21_recorded-session-snapshots/answer.md)。
- **取证动作**本身（探针、探前提/探失败/探历史）→ [FAQ 28](../28_probe-usage-and-origin/answer.md)。
