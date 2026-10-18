# 04 · 门禁与证据：哪些漂移是机器拒绝的

规则写在纸上会腐烂，这条仓库自己承认。它的对策是把可机械检查的规则变成**失败时非零退出**的命令——这是 [FAQ 02](../02_spec-driven-development/answer.md) 已经论证过的立场，本节只补「针对漂移」的那一半，并标出机器查不到的部分。

## 一、可生成的事实，一律不手写

同一事实的第二份手写副本是漂移的头号来源。DSH 的通用解法是**每个目录类事实都有生成器，并且有一个 `--check` 孪生**，检查「当前文件是否仍等于重新生成的结果」：

| 生成的事实 | 生成 | 校验 |
|---|---|---|
| Cordis API 目录 | `gen-cordis-catalog` | `verify-cordis-catalog` |
| 工具目录 | `gen-tool-catalog` | `verify-tool-catalog` |
| 配置目录 | `gen-config-catalog` | `verify-config-catalog` |
| 持久化目录 | `gen-persistence-catalog` | `verify-persistence-catalog` |
| Session 格式目录 | `gen-session-format-catalog` | `verify-session-format-catalog` |
| 模块关系图 | `gen-module-graph` | `verify-module-graph` |
| 客户端目录 | `gen-client-catalog` | `verify-client-catalog` |
| 依赖目录 | `gen-dependency-catalog` | `verify-dependency-catalog` |
| 官方 bundle 目录 | `gen-official-bundle-catalog` | `verify-official-bundle-catalog` |

出处：`package.json:162`-`216`（`[源码]`）。`docs/AGENTS.md:33` 把这条讲成制度：生成目录是「Exhaustive English sources regenerated from source and freshness-gated」，**禁止手改生成源**（`[原文]`）。插件仓语料给出的理由是：生成目录的角色是 index——「agent 可以按名称查询完整集合，而不必相信一张人工维护、可能已经漂移的表」（[`repo-harness/02-legibility-and-ownership.md:45`](../../_dsh_plugin_agent_ready_development/repo-harness/02-legibility-and-ownership.md)，`[原文]`）。

## 二、`doc-sync`：文档侧的集中入口

`pnpm run doc-sync` 由 `scripts/run-gates.ts` 的 `doc-sync` 模式驱动（`scripts/run-gates.ts:359`；mode 白名单见 `:173`），其叶子清单在 `scripts/run-gates.ts:815`-`:872`。与「漂移」直接相关的成员：

| 门禁 | 拒绝什么 |
|---|---|
| `verify-md-links` | 本地 Markdown 链接指向不存在的目标 |
| `verify-md-wrap` | 一段被拆成多个物理行 |
| `verify-translation-pairing` | 中英对照失配 |
| `verify-repository-references` | 维护文件里出现真实 commit 标识符或不允许的组织 URL——**历史引用必须用 tag 或 PR 号**（`docs/AGENTS.md:77`） |
| `verify-doc-refs` | 包内 TypeScript 注释与字符串里引用的 `docs/`、`.agents/notes/` 路径必须存在（Markdown 侧由 `verify-md-links` 覆盖） |
| `verify-type-equiv` | 文档里粘贴的类型声明与源码漂移 |
| `verify-subsystem-pages` | 子系统页与包组的归属失配 |
| `verify-package-readme-summaries` / `-model-experience` / `-limitations` | 包 README 的必备节缺失或不合格式 |
| `verify-agent-note-classification` / `-format` / `-archived-agent-notes` | Note 的生命周期/类别/格式/封存违规 |
| `verify-doc-budgets` | 常驻文档超过词数上限，或上限清单里缺文件 |
| `verify-upgrade-guides` | **已存在**指南的路径、front matter、小节与词数违规；指南缺位查不出（见 [07](./07-limits.md)） |
| `verify-persistence-changes` / `-releases` / `-formats` | 持久化类型变更的确认记录、发布历史与格式参考过期 |

出处：`scripts/run-gates.ts:823`-`:872`（`[源码]`）。

## 三、证据优先于手工同步

`docs/defensive-patterns/README.md` 的五条习惯里有一条直接写给这个问题：

> **Require evidence.** A claim is falsifiable and recomputable — measured before and after, or checked by a gate — rather than kept in sync by hand.

出处：`docs/defensive-patterns/README.md:15`（`[原文]`）。同一页把「one source of truth」列为第二条：「One read path for a piece of data, one home for a fact, one owner for shared state.」（`:12`，`[原文]`）。

这条原则在行为层的落点是**录制会话快照**：

- 「Every non-trivial model-, protocol-, or human-visible change adds or updates a keyless recorded-session scenario in the same PR」（`docs/testing.md:55`，`[原文]`）。
- 快照的世代纪律与 Note、Session 格式同构：「Record and refresh write version-named outputs without renaming or deleting a committed generation」（`snapshots/AGENTS.md:7`，`[原文]`）；同文件另有一句：「Committed sessions are normalization fixed points.」（`snapshots/AGENTS.md:11`，`[原文]`）

也就是说，**行为漂移会被 diff 抓到**，而抓到的结果本身也是只追加的世代。

## 四、持久化契约：漂移要留下确认记录

根 `AGENTS.md` 开头三条把「已发布数据」单独抬出来（`AGENTS.md:5`-`11`，`[原文]`）：

- 公开 API 是 pre-stable：**更新每一个消费方**，不为旧形态保留兼容层；
- 相邻迁移「may add a version-named successor but never move, overwrite, or delete committed generations; predecessors imply neither fallback nor downgrade support」；
- 每一条对外可感知的破坏性变更必须**立刻**写进升级指南。

配套的可执行面是 `Acknowledge declared persistence-type changes`（`AGENTS.md:9`）与 `docs/persistence-changes/` 的每变更四件套（英文确认、中文对照、双语一致性 sidecar、生成的 after schema），以及 `docs/session-format-status.md` 的 finalization checkpoint（`docs/persistence-changes/README.md:31`-`:38`、`:40`，`[原文]`）。

## 五、机器查不到的部分（明说）

这套门禁**不检查文档之间的矛盾**。它检查链接、格式、预算、配对、生成新鲜度、结构完整性；「这句断言是不是已经和另一篇文档打架」「这篇 Note 还值不值得留」是语义判断。仓库自己写明了这一点：

> Review enforces the semantic boundary. No automated gate attempts to classify a diff as trivial or non-trivial.

出处：`.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:22`（`[原文]`）。归档技能的判据同样是语义的：「Judge every note semantically」（`.agents/skills/dsh-archive-agent-notes/SKILL.md:8`，`[原文]`）。

所以正确的期待是：**门禁负责让漂移「藏不住」（链接断了、生成物对不上、类型粘贴过期、预算超了、快照 diff 了），语义上的对错仍由 review 与 owner 负责。** 这条边界在 [07](./07-limits.md) 展开。
