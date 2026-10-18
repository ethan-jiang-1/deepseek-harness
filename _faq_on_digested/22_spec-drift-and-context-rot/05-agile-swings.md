# 05 · 「左晃右晃」在流程里长什么样

提问者描述的状态是：先往一个方向做，想下去之后隔一阵又换方向，项目一直在滚动。这一节回答两个问题：**这套流程到底怎么接住一次转向**，以及**它接不住什么**。

## 一、它不阻止转向，它让转向有唯一现行版本与可回溯历史

产品本身是 pre-stable、按 RC 滚动发布的（`AGENTS.md:5`、`:7`）；流程里没有任何一条规则假设方向稳定。相反，它假定方向会变，于是把「变了之后算谁的、旧的去哪」写死：

- **现行的只有一个**：一篇决定只有一个 owner；「Updating the Agent Note that already owns the decision satisfies the rule; do not create a duplicate.」（`.agents/notes/README.md:48`，`[原文]`）
- **历史只追加**：归档永久冻结、不可编辑（`.agents/notes/README.md:42`）；快照世代、Session 格式世代同样「never move, overwrite, or delete committed generations」（`AGENTS.md:7`，`[原文]`）。
- **转向要指名道姓**：新 Note 落地即触发取代检查（`.agents/notes/AGENTS.md:5`）。

## 二、三个真实案例（当前工作树可核对）

### 案例 A：只取代一部分，其余明文保留

`packages/experimental` 的依赖政策只被取代了其中一段：

> This decision partially supersedes the package-selection coverage of *published dependency faces* (`2026-08-26-published-dependency-faces.md`, 同目录), whose package-selection paragraph links back here; **that note's other decisions remain in force.**

出处：`.agents/notes/implemented/process/2026-10-14-experimental-dependency-policy.md:19`（`[原文]`，加粗为本节所加）。

这正是「左晃右晃」最常出现的形态：**不是整篇作废，而是其中一条判断改了**。规则要求把「还生效的部分」明写出来，而不是让读者猜旧文还剩多少。

### 案例 B：完全取代的记录被合并删除，但保留品被逐条搬走

> This decision consolidates and removes the fully superseded report-tool and child-report-obligation records. It supersedes the `followup` naming choice in *Intent-named subagent continuation operations* (`.agents/notes/archived/simplification/2026-07-27-intent-named-subagent-continuation-operations.md`) and **retains the accepted-order guarantee** in *Child Agent messages precede their settlement notices* (`packages/subagent/subagent/README.md`).

出处：`.agents/notes/implemented/architecture/2026-08-27-adjacent-agent-steer-messaging.md:82`（`[原文]`）。

这一段同时演示了「完全取代」与「部分保留」：命名选择被取代，顺序保证被继承，两条旧记录按合并规则删除。合并的前提是「preserve every unique rationale, alternative, consequence, required verification, and named coverage gap」（`.agents/notes/README.md:50`，`[原文]`）。

### 案例 C：整个方向作废的提案，删除但留下重开条件

> The canceled developer-project, project-editing, and follow-up-capabilities proposals are deleted rather than retained as active or rejected records. This note preserves the motivation they shared, the decision not to ship that product, the capability given up, and the condition for reconsideration.

出处：`.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md:22`（`[原文]`；该 Note 已归档，按规则只作历史快照引用）。

注意它的去向：**提案没有被「留着以后再说」**——留着的是一份移除记录，里面写明「什么条件下可以重新考虑」。这对应 `.agents/notes/README.md:38` 的 keep 判据里那一条：重新引入条件仍然有用时，记录保持现行。

### 更多已核实的转向案例

上面三条覆盖三种形态；git 里还有更完整的样本（每条都用 `git show --stat <hash>` 核过存在性）：

| 案例 | 转向内容 | 记录方式 | 提交 |
|---|---|---|---|
| 提案被否 | 用运行时 schema 注册表替换编译期事件映射的提案，11 周后被否决 | `proposed/` → `rejected/` 改名 + `Status:` 行写出否决理由 | `a7a5be1703`（2026-09-04） |
| 已在跑的组件被移除 | 删掉第一方 SQLite 持久化后端 | 旧 Note 归档（只加一行 `Archived:`）、后继 Note 接管现行叙述、文档同提交改写；后继 Note 明写代价「removes the stronger database/WAL storage option」与重新引入条件（`.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:31`） | `4553c9d957`（2026-08-31） |
| 上线第二天回滚 | 一个性能特性合并次日被 revert | 四组 Note 三件套随实现删除、清单条目一并移除；同时被误删的一条已封存 Note 按原哈希恢复（同样的 sha256 摘要） | `81e05abaab`、`e0427f38e9`（2026-09-17） |
| 部分取代 | Node 原生 TypeScript 启动方式被 tsx ESM 钩子取代，但其中几条子决定仍然有效 | 两篇 Note 头部互相声明取代关系，归档的那篇**逐条点名幸存项**：「The Cordis-config declaration gate … remain current.」（`.agents/notes/archived/architecture/2026-07-28-dsh-native-typescript-source-launch.md:8`） | 现行篇 `.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md:7` |
| 反例：未发布的活被撤 | 撤掉未发布的能力 | 连同它的 Note 三件套与其清单条目一起删除；只有 git 对象留下记录 | `26706559b2`（2026-09-11） |

规模也值得看一眼：`a7a5be1703` 一次性归档 **453 组**已交付三件套（417,882 个英文词）、拒绝 **7** 篇前提已消失的提案、删除 **2** 篇不再能阻止错误的 rejected Note，同时把 201 篇仍有指导价值的留在现行树（提交信息自述，`[原文]`）。这说明「取代检查 + 归档判据」不是纸面规则，而是按规模执行过的动作。

## 三、转向的固定成本，以及为什么「默认不写」是配套的

每转一次向，账面上至少要做：写/改一篇 Note、交叉链接、判分诊（部分取代 / 完全取代 / 拒绝 / 归档）、修所有入链、必要时同时改中英两版与 sidecar。这不是零成本，所以流程的另一半是**把写入门槛抬高**：

- 「Add or update an Agent Note in the same PR only for lasting decision rationale that code, tests, and existing documentation do not explain.」（`.agents/notes/README.md:46`，`[原文]`）
- 「Mechanical or local edits, including local UI presentation and interaction changes, are exempt.」（同处，`[原文]`）
- 数量级的对照（[FAQ 20](../20_agent-note-quality-bar/answer.md) 的实测）：一个月新增约 110 篇 Note，同期非合并提交约 914 个——**默认不写，写是例外**。

所以正确的读法是：**这套制度不是「多写文档」，而是「只在会反复被问的地方写，并且写完就必须管到底」。** 转向的记账成本，正是为了防止语料无成本膨胀。

## 四、转向之后，「现在是什么」住在哪

| 面 | 转向后怎么处理 | 出处 |
|---|---|---|
| 文档（当前合同） | 只写 now，历史不放正文 | `docs/AGENTS.md:40`，`[原文]` |
| implemented Note 的事实（路径、包名、默认值） | 原地改，不追加变更史 | `.agents/notes/implemented/AGENTS.md:7`，`[原文]` |
| implemented Note 的决定 | 不可原地改，必须新开一篇交叉链接 | `.agents/notes/implemented/AGENTS.md:13`，`[原文]` |
| 归档 Note | 冻结，明确「不是现行权威」 | `.agents/notes/README.md:42`，`[原文]` |
| 生成的目录/清单 | 重新生成，不手改 | `docs/AGENTS.md:33`，`[原文]` |

一句话：**转向之后，全仓只有一份「现在」，其余全部被标记成历史。**

## 五、转向发生在 PR 层：改历史，而不是叠补丁

工程侧还有一条与「左晃右晃」直接相关的纪律：

> **Choose PR history deliberately.** Split independent changes and fix the introducing PR before propagation. … Rewrites use `--force-with-lease`, abort on remote movement, never raw `--force`; preserve an in-progress merge-forward checkpoint before taking a newer base.

出处：`AGENTS.md:162`（`[原文]`）。

配合 pre-stable 政策（「update every consumer」，`AGENTS.md:7`），它的效果是：**方向改了就回去修那条引入它的 PR/分支，而不是在它上面叠一个「其实改成另一个方向」的补丁。** 允许重写历史，但要求可验证地重写（`--force-with-lease`、远端动过就中止）。

## 六、它接不住什么

- **没被记录的转向**：如果方向只在对话里改了，没有 issue、没有 commit、没有 Note，那么没有任何机制知道发生过——语料里不会留下矛盾，因为什么也没留下。**流程只能治理进入仓库的东西**，这是使用纪律问题（见 [06](./06-how-to-use.md)）。
- **记录正确但没人读**：取代检查保证「现行唯一」，不保证有人去读它；检索压力是真实成本，仓库把它量化在一个仍处 `proposed/` 的提案里（`.agents/notes/proposed/process/2026-08-20-audience-first-documentation-quality.md:35`，`[原文]`）。
- **反复转向的累积成本**：每次转向都要付一次记账成本，且旧世代只能归档不能消失——**历史越长，语料越大**。仓库选择的是「多而有序」，不是「少而模糊」。
