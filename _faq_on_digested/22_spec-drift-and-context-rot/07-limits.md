# 07 · 它没防住什么

一篇只讲「DSH 有 A、B、C」的答案会误导人。这一节列的是**本基线实测到的空白**，每条都给出可核对的位置。

## 一、没有跨文档的语义矛盾检测

仓库里所有自动比较都是「文档 vs 权威来源」：生成物 vs 生成器、引用路径 vs 文件系统、链接 vs 目标与锚点、预算 vs manifest。**没有任何门禁比较两份叙述是否互相矛盾。** 唯一一处「文档之间互相比较」是英文与中文对照（`docs/i18n/README.md:30`），而它自己就写着限度：

> It checks hashes and Markdown structure; **it cannot judge whether the two sides say the same thing**, or whether the wording is accurate, well-termed, and natural — that is the reviewer's half of the contract.

出处：`docs/i18n/README.md:44`（`[原文]`，加粗为本节所加）。

同类自述还有两处：持久化校验「cannot establish how the record was authored or whether a human reviewed it」（`docs/persistence-changes/README.md:63`），以及「does not prove that the checkpoints and their authority record were never edited together」（同文件 `:78`）。

## 二、「保持现行」是规则，不是门禁

- implemented Note 必须「kept current with what actually shipped」（`.agents/notes/README.md:13`），但 `verify-agent-note-format` 查的是**结构**：状态行语法、必备小节、禁止提案期标题（`scripts/verify-agent-note-format.ts:59`、`:74`、`:81`）。它不会发现一篇 Note 的事实已经过期。
- 文档必须与代码同一变更更新（`AGENTS.md:177`「Docs accompany every code change」），但这条**没有门禁**，靠 review。
- 破坏性变更必须立刻写升级指南（`AGENTS.md:11`），而 `verify-upgrade-guides` 只校验**已存在**指南的路径、front matter、小节与词数——目录不存在时它直接通过（`scripts/verify-upgrade-guides.ts:57`）。**「这次破坏性变更到底有没有写指南」不是机器判断的。**
- 判据是语义的，仓库自己也这么说：「Review enforces the semantic boundary. No automated gate attempts to classify a diff as trivial or non-trivial.」（`.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:22`，`[原文]`）

## 三、连「同一件事的两个副本」也有漏网的

`docs/AGENTS.md:59` 用文字列了预算目标（`architecture.md` ≤ 2,400；`testing.md` 1,300），而 `scripts/doc-budgets.manifest.json:4`、`:6` 存的是 2410 与 1350。文档把这些称作 **Targets**（目标），门禁管的是 manifest 里的 **ceilings**（上限），所以两者数值不同**可能是刻意留出的余量**——但没有任何门禁核对这一对数字是否一致（实测位置：`docs/AGENTS.md:59`、`scripts/doc-budgets.manifest.json:4`、`:6`，`[源码]`）。

这个例子值得留着：**它就是「手写数字 vs 权威来源」的活标本**，出现在一份专门讲这件事的文档里。

## 四、冻结归档的「append-only」不是单调账本

`.agents/notes/archived/AGENTS.md:7` 描述用 `--write` 「append new artifact hashes」；实际语义是**封存内容的哈希不可变**，而当一组已封存的三件套被整体删除时，它的清单条目也会被移除（git 历史可核：`81e05abaab` 移除 3 条、`26706559b2` 移除 6 条、`e974a655a0` 移除 3 条，均为 0 插入）。换句话说：**它保护的是「已封存的内容不被改写」，不是「条目永不消失」。**

## 五、记录只覆盖进入仓库的东西

整套机制处理的都是已经进入 issue / commit / Note / 文档的内容。**只在对话里说过一句「我们改用另一个方向」，没有任何载体**，那就没有任何机制会发现——语料里不会留下矛盾，因为什么也没留下。这不是缺陷，是边界；对应的是使用纪律（[06](./06-how-to-use.md)）。

## 六、运行时侧的三条边界

- **没有语义偏离检测器。** goal 域与续轮 driver 都写明「No independent evaluator」（`packages/goal/goal/README.md:159`、`packages/goal/goal-round-driver/README.md:125`，`[原文]`）。重复调用提醒只按「同名 + 参数规范一致」计数，且只提醒不拦截（`packages/guard/repeat-tool-reminder/src/index.ts:53`、`:219`，`[源码]`）。
- **压缩有损，而且不是所有东西都能压。** 只保留摘要文本，压不动 system prompt、工具与 session 前缀，也切不开一个不可分单元（`packages/compaction/compaction-basic/README.md:12`；`packages/compaction/compaction/README.md:160`-`161`，`[原文]`）。图片卸载在能力不可用时是**永久替换**（`packages/compaction/compaction-image-offload/README.md:12`，`[原文]`）。
- **跨会话记忆默认关闭。** 检索早先 session 的能力是 experimental 且默认不挂（`packages/experimental/session-search/README.md:12`、`packages/experimental/tool-session-query/README.md:12`，`[原文]`）；fork 也不共享后续上下文，只是一次性快照（`packages/subagent/subagent-fork-in-process/README.md:143`，`[原文]`）。

## 七、本文自身的证据边界

- **本仓库是浅克隆**：`.git/shallow` 有 158 个边界提交，边界之外的历史无法核对。本文引用的历史案例都取了当前工作树仍存在、且可从 `upstream/master` 可达的提交；凡是解析到 graft 根（`92f8fb6c4a`）的，一律不作为「某年某月做的决定」的证明。
- **无法证明上游从未重写过历史**：本地没有 upstream 的 reflog，也没有 PR 讨论。
- **本语料与主仓有一条已知冲突**：`_faq_on_digested/` 的引用规范要求在引用源码时标注 commit hash（见本目录 `00-index.md` 的「引用规范」），而主仓的 `verify-repository-references` 恰好拒绝维护文件中出现真实 commit 标识符。实测该门禁在本基线对 `_faq_on_digested/`、`_misc/`、`python/sdk/uv.lock` 已是红的（非本篇引入）；本语料按自身规范继续标注提交号，这一冲突在语料层面登记，不在本篇解决。
- **「现行」判定有时间戳**：全部结论对照 `dsh-v0.2.1-rc.2`（`687f282e8625c6b8d11ff58211a90524be2e4317`）。下一轮同步后，数字、路径与本篇的判断都要按 `_change_log/` 重测。
