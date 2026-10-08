# 答案：先读哪一篇

## 一分钟版

**Agent Note 是「为什么这样做、当时放弃了什么」的存档。** 代码说明现在做什么，测试说明什么行为被钉住，PR 说明这次改了什么——三样都说不清「为什么不是另一条路」的时候，才写一篇 Note。

`.agents/notes/AGENTS.md` 给了它最省事的定义：**「Agent Notes 本质上是 agent 写的 RFC」**。它的格式、类型、生命周期，都是为了同时满足两个条件：

1. 写它们和读它们的主要是 **agent 而不是人**——所以必须是稳定、可检索、可机械检查的结构，而不是散文；
2. 语料会**长期增长**（当前活跃 578 篇、归档 641 篇）——所以必须有归档、删除和重复检查，否则两年后没人找得到东西。

**最重要的一句话：大多数改动不需要 Note。** 2026-09-18 之后的一个月里新增约 110 篇 Note，同期非合并提交约 914 个。默认是不写，写是例外——判据见 [01](./01-should-i-write-one.md)。

## 目录里都有什么

编号只给**分篇正文**（01–07），`question.md` / `answer.md` 是入口，三个附录不带编号。这是全目录的清单：

| 文件 | 种类 | 作用 |
|---|---|---|
| `question.md` | 入口 | 问题与范围声明；导航表只在本文维护 |
| `answer.md` | 入口 | 就是本页：一分钟版、阅读路线、术语速查 |
| `01` | 正文 | **要不要写**——先回答这个 |
| `02` | 正文 | **怎么写**——文件里放什么 |
| `03` | 正文 | **放在哪**——磁盘上的三件套 |
| `04` | 正文 | **背后的思考**——为什么是这套制度 |
| `05` – `07` | 正文 | 维护、移植、每条要求写在哪个文件（`07` 是索引，细节在 `reference.md`） |
| `walkthrough.md` | 附录 | 抽一次真实改动走完全程；想先看全貌就读它 |
| `reference.md` | 附录 | **全部出处**：每条结论对应的仓库路径、行号与实测口径 |
| `self-audit.md` | 附录 | 关于这组页面本身的对抗性自查，不是你要读的问题 |
| `figures/*.svg` | 素材 | 三张图，由对应正文嵌入 |

**编号只覆盖 01–07，而且顺序就是推荐顺序：先决定要不要写，再学怎么写和放哪，然后才是背后的理由。** 三个附录刻意不带编号——`walkthrough.md` 是可选的纵切演示，`reference.md` 与 `self-audit.md` 是查阅用的元文档，都不该和正文抢位置。

## 按什么顺序读

**按顺序读就是最省力的路径**，每一步都为下一步做铺垫：

| 顺序 | 读哪一篇 | 它回答的问题 |
|---|---|---|
| 1 | [01 该不该写一篇](./01-should-i-write-one.md) | 这次改动要不要写 Note？（多数不用） |
| 2 | [02 怎么写得对](./02-what-goes-in-the-file.md) | 决定要写了，往文件里放什么？ |
| 3 | [03 放在哪里](./03-note-triplets-on-disk.md) | 放哪个文件夹？为什么是三个文件？ |
| 4 | [04 背后的思考](./04-why-this-design.md) | 为什么要有状态、类型、归档这些手续？ |
| 5 | [05 写完之后](./05-keep-archive-delete.md) | 旧 Note 什么时候该归档或删除？ |
| 6 | [06 移植到别的仓库](./06-port-to-another-repo.md) | 我想在自己的仓库里也搞一套，抄哪些？ |
| 7 | [07 完整溯源表](./07-where-skills-add-requirements.md) | 这些要求各自写在哪个文件、哪一行？ |
| — | [reference.md 全部出处](./reference.md) | 附录：想核对原文、或想知道某个数字怎么数出来的 |

**多数人只走前三步：要不要写、怎么写、放哪里。** `04` 留到你心里冒出「何必这么麻烦」的时候再读——它专门回答这个。

想先看全貌再去读分篇，就到附录 [跟着一次真实改动走一遍](./walkthrough.md)。

## 术语速查

第一次遇到这些词时回来查一眼：

| 词 | 白话 |
|---|---|
| **Agent Note** | agent 自己写的 RFC：记录一个决定、它的备选方案和后果 |
| **lifecycle（生命周期）** | Note 的状态文件夹：`proposed/` 待评审、`implemented/` 已交付、`rejected/` 已否决 |
| **class（类型）** | 检索标签，六个：`feature`、`bug-fix`、`simplification`、`architecture`、`process`、`testing` |
| **triplet（三件套）** | 一篇 Note 在磁盘上是三个文件：`.md` + `.zh.md` + `.i18n.yaml` |
| **sidecar** | 指 `.i18n.yaml`：逐章节记录中英两版是否同步 |
| **supersession（取代）** | 新 Note 顶掉旧 Note 的决定。完全取代才合并归档；部分取代两篇都留、互相链接 |
| **grandfather 注释** | 2026-07-05 之前的老文件可以用一行注释代替 `## Alternatives considered`；新文件不允许 |
| **gate（门禁）** | 会以非零退出码失败的脚本，如 `verify-agent-note-format`、`verify-translation-pairing` |
| **`doc-sync`** | 文档门禁总入口，上面两个门禁都在里面 |

## 一句话记住三件事

1. **写之前先问「我不写会怎样」。** 答案是「下一个人会重新提出一个已经被否掉的方案」，才写。
2. **`## Alternatives considered` 不可省。** 记录决策却不记录它击败了什么，就是在邀请重新开讼——这是整套制度要防的那个失败。
3. **写完之后它是活的。** 代码改名、换默认值，Note 跟着改；决策本身要反转，就另写一篇互链，不要偷偷改写历史。

## 与相邻文档的分工

| 想知道 | 去哪里（都在本仓库内） |
|---|---|
| Note 的制度原文：何时写、路径、骨架、归档 | [`.agents/notes/README.md`](../../.agents/notes/README.md) |
| Note 的身份与 supersession 检查要求 | [`.agents/notes/AGENTS.md`](../../.agents/notes/AGENTS.md) |
| 文档标准、tier 表与 slop 清单 | [`docs/AGENTS.md`](../../docs/AGENTS.md) |
| 归档件的冻结规则 | [`.agents/notes/archived/AGENTS.md`](../../.agents/notes/archived/AGENTS.md) |
| 保留 / 归档 / 删除的判定流程与校准例子 | [`.agents/skills/dsh-archive-agent-notes/SKILL.md`](../../.agents/skills/dsh-archive-agent-notes/SKILL.md) |
| 多语言三件套政策 | [`docs/i18n/README.md`](../../docs/i18n/README.md) |
| 会失败的门禁脚本 | [`scripts/verify-agent-note-format.ts`](../../scripts/verify-agent-note-format.ts)、[`scripts/agent-note-tree.ts`](../../scripts/agent-note-tree.ts)、[`scripts/verify-translation-pairing.ts`](../../scripts/verify-translation-pairing.ts) |

本组 FAQ 只引用上面这类**仓库根部的内容**；它不引用任何其他 FAQ 目录或仓库外的下划线目录。

---

*基线：工作树 `caf78ed639`，2026-10-08 实测；数量类事实会随仓库变化，上游改动规则文件后需重新核对行号。本组页面的自查记录见 [self-audit.md](./self-audit.md)。*
