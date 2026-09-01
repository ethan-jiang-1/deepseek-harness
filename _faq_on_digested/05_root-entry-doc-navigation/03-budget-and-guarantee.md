# 03 · 运行时预算/回收，以及 README 怎么保证被读到/被维护

## 超预算了怎么办：度量 + 回收

注入有 `maxBytes`（01 已述），整个上下文还有 `ctx.tokenMeter` 度量，超了由 compaction 回收：

> Pressure compaction runs at serial `agent/pre-step` before request derivation. … Region boundaries preserve tool-call/result pairing but not whole turns.
>
> —— `docs/subsystems/compaction.md:86`

> `ctx.tokenMeter` … exposes one detached replay snapshot for request pressure and positional surface pricing.
>
> —— `docs/subsystems/token-meter.md:5`

这条回收链是“按需披露”的另一半：披露不是单向的，塞多了会被剪裁/摘要，而且**不拆散一个 tool-call/result 配对**。所以长任务里，模型“读过但已过期”的内容会被回收，而不是无限增长。

## README 怎么保证“被读到”和“被维护”

原 04 的子问题 6（“coding agent 会主动读 README 吗？怎么保证被读到、被维护”）在这里有动态的答案，分两问：

**被读到**——靠运行时注入 + standing order 的合力（见 02）：指令链 push、README pull，模型改包时 standing order 要求它读该包 README。

**被维护**——靠门禁，不靠自觉：

> A package's README and JSDoc are part of the change: altered behavior (config keys, defaults, error codes, wire fields) updates them in the same commit.
>
> —— `packages/AGENTS.md:25`

> Package READMEs document model, token, and KV-cache effects using the canonical Model Experience format.
>
> —— `packages/AGENTS.md:27`

两道机器兜底：

1. `doc-sync` 检查 README / JSDoc / 生成目录是否与代码同步；
2. `dsh-code-review` 与 `dsh-prose-standard` 语义 review 把“改了代码没改 README”判为问题。

所以“被读到”有运行时 push/pull 保证，“被维护”有门禁保证。模型不读、不维护 README 时，更大的可能是 CI 已经红了——这跟 04 的“地图是机器检查的”是同一套逻辑，只是落点从“地图”移到了“消费地图的行为”。

## 静态预算与运行时预算是一回事

04 的字数预算（根 AGENTS ≤ 1600 词）和 05 的 `maxBytes` 是同一个约束的两端：静态层决定“每层最多放多少”，运行时层决定“每次最多注入多少”。两者都不度量“模型懂没懂”，而是度量**容量**——一个是文档的容量，一个是上下文的容量。

## 证据入口

- [`docs/subsystems/compaction.md`](../../docs/subsystems/compaction.md) 第 86 行
- [`docs/subsystems/token-meter.md`](../../docs/subsystems/token-meter.md) 第 5 行
- [`packages/AGENTS.md`](../../packages/AGENTS.md) 第 25-27 行
