# `keyless` 到底是什么意思？

## 一句话

**让真模型跑一次，把它的回答录下来；以后每次都用这段录像代替模型真跑，其余一切照旧。**

## 问题是怎么冒出来的

`keyless` 在 DSH 产品树里到处都在用——根规则、测试政策、四份 vitest 配置、`packages/test-support/` 整组、几十个 `apps/*/tests/` 目录、上百个 `snapshots/*/cordis.snapshot.yml` 的注释。约 300 处命中，130 多个文件。

但**没有任何一处说清它到底断言了什么**。而读下去会发现几处用法互相矛盾：

- `docs/testing.md:11` 说 e2e 用例缺 key 就自跳过，"好让 keyless CI 保持绿色"——照这句，keyless 像是在描述**环境状态**。
- 可 `apps/web/tests/smoke-real.e2e.ts:325` 明确塞进 `DEEPSEEK_API_KEY: 'keyless-web-no-call'`——**环境里有 key**（假的），这一条仍然叫 keyless。
- `packages/test-support/session-snapshot/src/suite.ts:269`-`:274` 把三档并列，注明 `replay` 和 `refresh` **都 keyless**。可是 `refresh` 会**改写**提交进仓的期望输出。
- `vitest.snapshot.config.ts:28` 说 "Replay is **the keyless default**"，而 `record` 分支才去读根 `.env` 拿 key。

如果 keyless 既不是「环境没 key」，又不是「不产出改动」，也不是某个固定档位，那它到底断言了什么？

## 这组页面怎么回答

不是一次答完，而是拆成四层，从「是什么」到「怎么判断」逐层建立：

| 篇 | 回答的问题 |
|---|---|
| [00 导览](./00-index.md) | 五分钟建立全貌，不预设任何前置知识 |
| [01 它是什么](./01-what-it-is.md) | 名字来源、核心做法、由哪几部分组成、在仓库里长什么样 |
| [02 它解决什么问题](./02-why-it-exists.md) | 为什么非得造这么个东西；它挡的是哪一刀；替谁解决问题；明确不解什么 |
| [03 replay 到底在做什么](./03-how-replay-works.md) | 它是「跑」不是「读」；三样东西的角色；snapshot 就是日志 |
| [04 边界与判据](./04-boundaries.md) | 一条测试算不算 keyless、证据强度分级、它证明什么不证明什么 |
| [05 速查](./05-cheatsheet.md) | 词、命令、决策表、五个常见误解 |

## 范围与边界

- 本组只回答「`keyless` 是什么意思、为什么存在、边界在哪」，**不重写**快照机制本身。录制/回放/刷新的完整流程、语料治理与强制政策以 [`docs/testing.md`](../../docs/testing.md) 与 [`snapshots/AGENTS.md`](../../snapshots/AGENTS.md) 为准。
- 快照作为**可移植资产**（外仓能不能用、值多少、怎么组织）是另一个问题，见 [FAQ 21](../21_recorded-session-snapshots/answer.md)。
- 取证动作本身（探针、探前提/探失败/探历史）是另一个问题，见 [FAQ 28](../28_probe-usage-and-origin/answer.md)。
- 引用源码时行号按核验基线，核验状态见 [核验基线登记](../00-baseline.md)。

## 图的清单

四张图各配一篇正文，都能脱离正文单独看懂：

| 图 | 配哪篇 |
|---|---|
| `figures/00-overview.svg` | 导览：是什么 → 为什么 → 怎么运转 → 到哪为止 |
| `figures/02-why-it-exists.svg` | 两个要求能同时满足，三个不能 |
| `figures/03-replay-is-acting.svg` | 旁观 vs 重演；product/存档/动作三角色 |
