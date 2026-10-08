# 01 · 该不该写一篇

## 先记住门槛

> Add or update an Agent Note in the same PR only for lasting decision rationale that code, tests, and existing documentation do not explain.

判据只有一条：**你能指出一个未来维护者可能犯的具体错误，以及代码、测试和现有文档没有说明的非显然约束或真实取舍。**

这条门槛是 2026-09-17 提交 `730bcc7c85`（"require lasting rationale before creating agent notes"）改出来的。改之前是一句更粗暴的话：

> Every non-trivial change MUST add or update at least one Agent Note in the same PR.

判据从「变更非平凡」换成「决策有持久价值」，原因很直接：**「非平凡」无法执行。** 任何改动都能论证自己非平凡，结果是每个行为变更都机械建档，语料被低价值记录填满。现在这条标准明确写了：行为变化、用户可见性、文件数量、新增测试**本身都不构成理由**；普通的变更理由写进 PR 描述，当前行为写进它既有的文档。

> 如果你在旧材料里看到 "Every non-trivial change MUST…"，那是收窄之前的历史引文，不是现行规则。`_faq_on_digested/06` 与 `11` 里的引用就属于这一类，本文不改写它们的历史语境。

## 三十秒自检

按顺序问，任何一个「否」就停：

1. **我不写会怎样？** 如果答案是「下一个人会重新提出一个已经被否掉的方案」，写。「这次改动没被记录下来」不算——那是 git 的职责。
2. **我说得出被击败的备选方案吗？** 说不出来，通常意味着这个决定没有取舍，只有实现步骤。
3. **仓库里已经有一篇 Note 拥有这个决定吗？** 有就**更新它**，不要新建。重复 Note 是明确禁止的——[`dsh-find-simplifications`](../../.agents/skills/dsh-find-simplifications/SKILL.md) 甚至专门写了「do not create duplicate notes to preserve candidate counts」。
4. **这篇 Note 会不会刚落地就够格归档？** 会的话，现在就别写。

## 三个真实例子

### 该写：一个反直觉的安全边界

[`implemented/feature/2026-09-16-sandbox-same-mode.md`](../../.agents/notes/implemented/feature/2026-09-16-sandbox-same-mode.md)（171 词）

改动本身极小——`approveEscalation` 在请求的模式已经生效时直接返回。但如果不写 Note，下一个人看到「重复请求危险模式却不拒绝」，**很可能会把它当成权限校验的漏洞补上**。Note 记录的正是那条非显然的理由：

> Rejecting the call prevents authorized work without preventing any permission increase.

它不但说明了为什么，还顺带记下了与旧决定的**部分取代关系**：「This partially supersedes the non-widening rejection in the sandbox decision (`2026-07-06-sandbox.md`); its confinement and per-call approval decisions remain active.」——这就是「不写会怎样」的具体形态。

### 该写：一条长期约定

[`implemented/process/2026-09-22-workspace-release-ranges.md`](../../.agents/notes/implemented/process/2026-09-22-workspace-release-ranges.md)（232 词）

一条依赖版本号写法的规定，为什么值得一篇 Note？因为它解释了 `workspace:*` 与 `workspace:~` 的分界线来自**发布节奏的差异**（DSH 包共用一个产品发布，vendor 与 native 各自独立发布），并且写明「Directory placement never exempts a consumer」。没有这段，下一个人只会看到一堆长得不一样、看不出规律的范围符号，然后按自己的直觉统一它们。

### 不该写：改动记录得再清楚也不必写

DSH 自己在提交 `5124a2a310`（PR #5004，7 个文件、+15/−14）里改了模型设置列表的呈现——选择器显示原始 model ID、悬停显示名称——**没有新增 Agent Note**。因为它是局部 UI 呈现改动，理由放进 PR 描述就够，行为由组件测试和 e2e 钉住。

这个反例比抽象地说「Note 有时可选」更有用：**它演示了一次完整、合格、但不需要 Note 的交付。**

## 明确豁免：机械与局部编辑

规则原文的豁免写得很具体：

> Mechanical or local edits, including local UI presentation and interaction changes, are exempt.

局部 UI 改动默认不写新 Note，包括文案、间距、颜色、图标、状态指示、布局和可见性条件。但**UI 代码不是一张空白豁免**：

> Changes involving persistence, protocols, permissions, cross-component state ownership, or shared interaction rules still use the lasting-value test above.

即：一旦碰到持久化、协议、权限、跨组件状态归属或共享交互规则，还是要回到上面那个判据。校准例子是——去掉一个冗余的状态点、同时保留转换指示，理由能放进 PR 描述、测试能抓住行为，就不需要 Note。

## 不该写 Note 时，理由放哪

| 内容 | 归宿 |
|---|---|
| 这次改了什么、为什么这么改（一次性） | PR 描述 |
| 系统现在做什么 | 源码、JSDoc、package README、docs |
| 什么行为被钉住了 | 测试、snapshot |
| 打算以后做什么 | Issue（`#N owns the follow-up` 在任何表层都是持久引用） |
| 为什么会这样设计、放弃了什么 | **Agent Note** |

这张表本身就是判据的另一种说法：**只有当最后一行是唯一能装下它的地方时，才写 Note。**

## 证据入口

- [`.agents/notes/README.md` 的 "When to write one"](../../.agents/notes/README.md)：门槛、豁免、重复与更新的规则。
- 提交 `730bcc7c85`（2026-09-17）：把「非平凡变更必须写」改写成「只有持久决定理由才写」的那次改动。
- [`_dsh_plugin_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md`](../../_dsh_plugin_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md) 第 1 节：从哪开始写、什么时候该更新既有 owner。
