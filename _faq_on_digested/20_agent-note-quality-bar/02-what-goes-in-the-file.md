# 02 · 怎么写得对：文件里放什么

**第 2 步。** 骨架四段，外加禁用标题清单与真实范例。

## 四段骨架

每篇活跃 Agent Note 的正文长这样，`## Problem` 必须开头：

```markdown
## Problem                 ← 动机：不看解决方案也要能看懂
## Decision                ← 现在时，描述已交付的现实（proposed 时叫 ## Proposal）
…你真正需要的技术章节…        ← 包拓扑、协议约定、schema，自由组织
## Alternatives considered ← 强制：每个真实备选方案及它为什么输
## Consequences            ← 代价与收益都要写
```

头部固定成这样：第 1 行标题，第 2 行空，第 3 行 `Status:`，第 4 行空，然后是语言切换行。中文侧的逐行对照在 [03](./03-note-triplets-on-disk.md)。

```markdown
# Agent Note: <title>

Status: implemented

English | [中文](yyyy-mm-dd-topic-title.zh.md)
```

## 最短的合格成品

[`implemented/process/2026-09-22-workspace-release-ranges.md`](../../.agents/notes/implemented/process/2026-09-22-workspace-release-ranges.md) 全文 232 个词，四段齐全。摘出来看结构：

```markdown
## Problem

DSH packages share one product release. Cordis, its vendored libraries, and Node Addon
System have independent releases; consumers need their patch updates without
automatically accepting a new minor version.

## Decision

Every workspace consumer uses `workspace:*` for DSH targets and `workspace:~` for
targets under `vendor/` or in the `native/system` package family. […] Directory
placement never exempts a consumer.

## Alternatives considered

**Caret vendor ranges.** For stable packages such as Cordis, caret ranges also admit
later minor versions.

**Exact vendor and native ranges.** Exact ranges require a consumer declaration change
to admit each patch release.

## Consequences

Vendor and native patch releases must preserve their consumer-facing APIs and binary
interfaces. […] The workspace gate rejects DSH tilde ranges and vendor/native caret or
exact ranges; packed-manifest tests check the emitted versions.
```

三点值得注意：

1. **`Problem` 里没有出现 `workspace:~`。** 它先讲清楚世界是什么样（三方发布节奏不同），读者不需要知道解决方案就能理解问题。
2. **`Alternatives considered` 是两个加粗引导的短段落**，每个一句话说清「它是什么」和「它为什么输」。这是最常见的形式，不需要长篇论证。
3. **`Consequences` 里带证据。** 最后一句点名了什么检查钉住了这个决定——「把什么钉住了」是必须保留的内容，不是可有可无的收尾。

## `Alternatives considered` 的正确写法

这条是强制的，规则原文的理由只有一句，但它是整套制度的立身之本：

> A decision recorded without what it beat invites re-litigation — the failure Agent Notes exist to prevent.

写法上两条硬约束：

- **只能记录，不能编造。** 真没有备选方案，通常说明这不该是一篇 Note（回到 [01](./01-should-i-write-one.md)）。
- **不写 review 过程，只写理由。** 不要写「review 时被否决了」——那是有时效的会话信息。标准改法是把裁决改写成理由本身：

| 别这样写 | 这样写 |
|---|---|
| Rejected in review: caching the resolved spec. We keep resolution per-call. | **Caching the resolved spec.** Rejected: the spec depends on per-call cwd, so a cache keyed by request would serve stale roots. |

这条改法出自 [`dsh-trim-cot-leakage/references/examples.md`](../../.agents/skills/dsh-trim-cot-leakage/references/examples.md)，它明确把 Alternatives-considered 称作 review 裁决的**受认可归宿**：reviewer 和轮次不属于理由，理由本身属于。

### 旧 Note 的例外

2026-07-05 之前、且备选方案无法从记录中重建的 Note，用这一行精确注释代替整节（门禁只对旧文件接受）：

```markdown
<!-- agent-note-format: alternatives-not-recorded (pre-format Agent Note) -->
```

活跃树里现在只有 **2 篇**用它（`event-domain-semantics.md`、`uniform-agent-note-format.md`），归档树里 6 篇——**说明这条例外是历史遗留通道，不是可用的省事写法。** 另有一条门禁规则收紧了它：注释只对 **2026-07-05 之前**的 Note 有效（`if (hasGrandfather && note.date >= FORMAT_ADOPTED) fail(...)`）。

## implemented 里禁止出现的标题

门禁的正则只有四个（[`verify-agent-note-format.ts:36`](../../scripts/verify-agent-note-format.ts)）：

```js
BANNED_IMPLEMENTED = /^## (?:Proposal\b|Plan\b|Migration plan\b|Acceptance criteria\b)/i
```

命中任意一个，报错原文是（逐字）：

> `## Proposal` is a proposal-era heading; an implemented Agent Note states what is (fold it into Decision/Consequences/Testing)

原因出自 [`docs/AGENTS.md:72`](../../docs/AGENTS.md) 的 slop 清单：**implemented Note 里的 spec-speak**（"should"、迁移计划、验收清单）。

`## Risks` 不在禁用集里。**活跃 implemented 树里现在有 5 篇英文 Note 带着它正常通过了门禁**：`2026-06-15-ptc.md`、`2026-07-14-provider-routed-llm-adapters.md`、`2026-08-24-session-log-snapshot-corpus.md`、`2026-08-25-electron-desktop-packaging-and-updates.md`、`2026-09-17-windows-runtime-signature-cache.md`。README 希望把残余风险折进 `## Consequences`，但**门禁不管**——折进去是写法偏好，不是硬要求。

各章节的合法性一览（README:103 点名了前三个）：

| 章节 | 状态 |
|---|---|
| `## Decision`、`## Consequences` | **必需**，缺了门禁直接拒 |
| `## Alternatives considered` | **必需**。这一节和 grandfather 注释恰好留一个：两个同时出现，或两个都没有，门禁都拒绝。grandfather 注释只对 2026-07-05 之前的 Note 有效 |
| `## Testing`、`## Deferred`、`## Related` | 合法，只要陈述现在时事实 |
| `## Risks` | 合法，门禁不查 |
| 包拓扑、wire contract、schema 等自定义章节 | 合法，夹在必需章节之间自由组织 |

## 需要保留什么、可以删什么

[`dsh-prose-standard`](../../.agents/skills/dsh-prose-standard/SKILL.md) 给了保留清单：

> **Agent Notes:** retain unique rationale, mechanisms, alternatives, consequences, shipped verification evidence, and named coverage gaps. Implemented Agent Notes state shipped reality in the present tense; remove planning checklists, not evidence of what pins the decision.

它的校准例子把「留什么」讲得比规则更清楚：

| 修剪方式 | 结果 |
|---|---|
| 删掉整个 Testing 章节 | **过度修剪**——那是「什么钉住了这个决定」的证据 |
| 保留「单测覆盖发布前后的取消与处置静默；built-entry smoke 覆盖真实 loader 路径；快照覆盖因传输是进程特有而延后」 | **正确**——留下了层级、行为、真实入口和已命名的覆盖缺口 |
| 逐文件走查 fixture 与断言 | **过度细节**——没有增加行为区分 |

同一份 skill 还有一条反向要求：**链接不能替代本地合同**。

| 别这样写 | 这样写 |
|---|---|
| Disposal is documented in the lifecycle Agent Note. | Disposal aborts the run and waits for provider quiescence. See the lifecycle Agent Note for ownership and race handling. |

调用方需要在原地看到行为与完成保证；链接出去的是 rationale。

## 写完之后它还是活的

implemented Note 必须跟着已交付的事实走：

> when the code later moves a file, renames a package, or changes a key/default, the Agent Note is updated in the same change to match

但这条授权只覆盖**事实**（路径、名称、默认值、机制），覆盖不了**决策**：

> A reversal of the decision or its rationale requires a new Agent Note and cross-link

三件事分开记：

| 情况 | 动作 |
|---|---|
| 路径/名称/默认值变了 | 原地改事实，**不追加变更历史** |
| 同一决定有了新理由 | 扩充同一篇 owner，不要新建 |
| 决定被推翻 | **另写一篇**，两篇互链 |
| 新决定完全取代旧决定 | 新 owner 吸收全部独有内容（rationale、alternative、consequence、verification、coverage gap）+ 修复全部入站链接之后，旧篇才可删 |

自我修订史属于 git：不要写「As of v5 of this note, the loader also validates manifests」，直接写「The loader validates manifests」。

## 证据入口

- [`.agents/notes/README.md` 的 "The file format"](../../.agents/notes/README.md)：头部块、三种骨架、Alternatives 强制、生命周期之间的移动。
- [`implemented/AGENTS.md`](../../.agents/notes/implemented/AGENTS.md)：保持 current 的边界，以及「这不是重写决策的许可」。
- [`dsh-prose-standard`](../../.agents/skills/dsh-prose-standard/SKILL.md) 与它的 [`references/examples.md`](../../.agents/skills/dsh-prose-standard/references/examples.md)：保留清单与修剪校准。
- [`dsh-trim-cot-leakage/references/examples.md`](../../.agents/skills/dsh-trim-cot-leakage/references/examples.md)：review 裁决改写成理由的对照。
