# Agent Note 的质量要求到底写在哪、要求什么？

## 问题

`.agents/skills/` 里并没有一份叫「写 Agent Note」的 skill，但几乎每条与产出有关的 skill 都会在某一句话上引用 Note 规则，并且各自追加一条不同的要求。那么：**一份 Agent Note 的质量要求，真正的 owner 是谁？skill 往里加的是哪几条？把 `.agents/notes/` 换成插件仓根目录下的 `notes/` 之后，哪些要求仍然成立、哪些是 DSH 自己的门禁产物？**

这个问题关心的不是「怎么写一篇好文档」，而是：当我要在一个新仓库里复制这套决策记录制度时，**照抄什么、判断什么、放弃什么**。

## 范围

本文只回答内容与结构要求，不回答「Agent Note 应该放在哪个目录」——目录名与位置是可替换的，`{lifecycle}/{class}/yyyy-mm-dd-topic-title.md` 这条路径语法才是要求本身。

源码核验基线：本仓库工作树 `caf78ed639`。上表与下文引用的规则文件在该 commit 与 `_digested/` 基线 `639ed015397290b3745d163aafe02ffee4aa3f84`（`dsh-v0.2.0-rc.2`）之间逐文件 `git diff` 无差异，因此结论对两个基线同时成立；行号以工作树为准。

## 入口

- 直接要结论与溯源表：进入 [`answer.md`](./answer.md)。
- 只想知道「哪些必须照抄、哪些必须自己发明」：直接读 answer 的「可迁移性」一节。
- 想核对原始出处：answer 的引用与溯源表给出每个论断对应的文件与行号。

## 证据边界

- 本文的每一条规范都能在仓库里指出 owner 文件与行号；找不到 owner 的说法（例如「Note 必须写够多少字」）被明确列为不存在的要求，而不是由本文补造。
- 本文引用的是当前工作树，不是 DSH 的产品行为；上游改动规则文件后，行号与措辞需按 `_digested/_change_log/` 的复核流程重对。
- `_faq_on_digested/06_change-landing-path/` 与 `_faq_on_digested/11_native-development-loop/` 里出现的 "Every non-trivial change MUST add or update at least one Agent Note in the same PR" 是**规则收窄之前的历史引文**：该标准已于 2026-09-17 被提交 `730bcc7c85` 改写为「只有具备持久维护价值的决策才写 Note」。本文只说明现状，不改写那两篇的历史语境。
- 本文不覆盖归档执行细节（triplet 搬迁、seal 清单、`--write` 重录）的完整操作步骤，那属于 [`dsh-archive-agent-notes`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md) 的职责；这里只说明它对「质量」提出的两条硬约束。
