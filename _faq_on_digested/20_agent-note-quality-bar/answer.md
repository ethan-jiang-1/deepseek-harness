# 答案：先读哪一篇

## 一分钟版

**Agent Note 是「为什么这样做、当时放弃了什么」的存档。** 代码说明现在做什么，测试说明什么行为被钉住，PR 说明这次改了什么——三样都说不清「为什么不是另一条路」的时候，才写一篇 Note。

至于它长什么样：`.agents/notes/AGENTS.md` 第一句给了最省事的定义——**「Agent Notes 本质上是 agent 写的 RFC」**。后面所有格式、类型、生命周期，都是为了同时满足两个苛刻条件：

1. 写它们和读它们的主要是 **agent 而不是人**——所以必须是稳定、可检索、可机械检查的结构，而不是散文；
2. 语料会**长期增长**（当前 1,221 篇）——所以必须有归档、删除和重复检查，否则两年后没人找得到东西。

「类型很多」不是分类癖，是「谁是 agent 读者」和「语料会长多大」这两个约束的直接后果，出处可查：见 [04 为什么有那么多类型](./04-why-so-many-types.md)。

## 按你需要什么来读

| 你的处境 | 读哪一篇 | 一句话 |
|---|---|---|
| 「我这个改动要不要写 Note？」 | [01 该不该写一篇](./01-should-i-write-one.md) | 说得出「未来某人会犯的具体错误」才写；机械与局部 UI 改动豁免 |
| 「要写了，往里面填什么？」 | [02 文件里放什么](./02-what-goes-in-the-file.md) | `Problem / Decision / Alternatives considered / Consequences` 四段，附真实范例 |
| 「文件放哪、为什么有三个文件？」 | [03 磁盘上的三件套](./03-note-triplets-on-disk.md) | `{生命周期}/{类型}/日期-标题` + 中英对照 + 哈希记录 |
| 「为什么有那么多类型和状态？」 | [04 为什么有那么多类型](./04-why-so-many-types.md) | 六个类型是旧目录改名后的快照；`archived/` 不是状态而是冷藏库 |
| 「旧 Note 会不会越堆越多？」 | [05 留下、归档还是删除](./05-keep-archive-delete.md) | 按「还能不能指导未来」判断，不按字数年龄 |
| 「我想在自己的仓库里也搞一套」 | [06 移植到别的仓库](./06-port-to-another-repo.md) | 八条照抄、五条可以自己发明、三个最容易抄错的点 |
| 「这些要求到底写在哪几个文件？」 | [07 skill 往里加了什么](./07-where-skills-add-requirements.md) | 完整溯源表，每行对应一个文件与行号 |

想先看一个完整样本再回来：直接翻 [`implemented/process/2026-09-22-workspace-release-ranges.md`](../../.agents/notes/implemented/process/2026-09-22-workspace-release-ranges.md)——232 个词、四段齐全，是这套格式最短的合格成品之一。

## 一句话记住三件事

1. **写之前先问「我不写会怎样」。** 答案如果是「下一个人重新提一个已经被否掉的方案」，就写；如果只是「这次改动没记录下来」，就不写。
2. **`## Alternatives considered` 不可省。** 记录决策却不记录它击败了什么，就是在邀请重新开讼——这是整套制度要防的那个失败。
3. **写完之后它是活的。** 代码改名、换默认值，Note 跟着改；决策本身要反转，就另写一篇互链，不要偷偷改写历史。

## 与相邻文档的分工

| 想知道 | 去哪里 |
|---|---|
| Note 在一个仓库里排在什么位置、和 README / docs / Skill 怎么分工 | [`_faq_on_digested/06`](../06_change-landing-path/answer.md) 与 [`_dsh_plugin_agent_ready_development/repo-harness/02`](../../_dsh_plugin_agent_ready_development/repo-harness/02-legibility-and-ownership.md) |
| 保留 / 归档 / 删除的具体判定流程与校准例子 | [`.agents/skills/dsh-archive-agent-notes/SKILL.md`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md) |
| 完整规则原文 | [`.agents/notes/README.md`](../../.agents/notes/README.md) |
