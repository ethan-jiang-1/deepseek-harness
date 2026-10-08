# Agent Note 到底该怎么写、为什么要搞这么复杂？

先读 [`answer.md`](./answer.md) 的一分钟版。那一页有阅读顺序和术语表；下面是这组页面要回答的问题。

## 问题

第一次打开 `.agents/notes/` 的人通常会同时冒出四个疑问：

1. **要不要写？** 每个改动都要留一篇吗，还是只有重大决定才要？
2. **写什么？** 一篇文章里到底必须有哪些段，哪些话是多余的？
3. **为什么有三个状态、六个类型、还有一层 `archived/`？** 分类是不是形式主义？
4. **旧 Note 怎么办？** 会不会越堆越多，两年后没人找得到？

还有一个更根本的问题藏在后面：这些要求散落在 `.agents/skills/`、`.agents/notes/README.md`、根 `AGENTS.md`、`docs/AGENTS.md` 和各种门禁脚本里，**谁是权威？**

这个问题关心的不是「怎么写一篇好文档」，而是：当我要在一个新仓库里复制这套决策记录制度时，**照抄什么、判断什么、放弃什么**。

## 范围

本文只回答内容与结构要求，不回答「Agent Note 应该放在哪个目录」——目录名与位置是可替换的（DSH 放在 `.agents/notes/`，外部插件仓通常放在仓库根部的 `notes/`），`{生命周期}/{类型}/yyyy-mm-dd-topic-title.md` 这条路径语法才是要求本身。

源码核验基线：本仓库工作树 `caf78ed639`。下文引用的规则文件、门禁脚本与 skill 全部位于本仓库根目录（`.agents/`、`docs/`、`scripts/`），行号以该工作树为准。本文不引用仓库外的任何目录。

## 入口

导航表只在 [`answer.md`](./answer.md) 一处维护——两份清单一定会漂移，这也是 Agent Note 树禁止 `INDEX.md` 的同一条理由（展开见 [04 背后的思考](./04-why-this-design.md)）。

## 证据边界

- 本文的每一条规范都能在仓库里指出 owner 文件与行号；找不到 owner 的说法（例如「Note 必须写够多少字」）被明确列为不存在的要求，而不是由本文补造。
- 本文引用的是当前工作树，不是 DSH 的产品行为；上游改动规则文件后，行号与措辞需按该文件本身重新核对。
- "Every non-trivial change MUST add or update at least one Agent Note in the same PR" 是**规则收窄之前的历史表述**：该标准已于 2026-09-17 被提交 `730bcc7c85` 改写为「只有具备持久维护价值的决策才写 Note」。本文只陈述现状。
- 数量类事实按工作树实测（活跃 578 篇、归档 641 篇），会随仓库变化；结构类结论不受影响。
- 归档时搬迁三件套、插入 `Archived:` 行、重录 sidecar 的步骤写在 [05](./05-keep-archive-delete.md)。校准例子和哈希清单的例外以 [`dsh-archive-agent-notes`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md) 为准。
