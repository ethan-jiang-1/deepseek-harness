# 01 · 什么时候写、怎么写：准入判据、目录路由与正文骨架

本篇是给 DSH 贡献者与插件开发者的实操手册：从判断“这笔改动到底要不要写”，到选目录、填四段骨架、做提案转正改写与双语三件套同步，一步到位。

---

## 一、准入门槛：现行标准、豁免范围与历史旧规

### 1. 现行唯一判据：只为“持久设计取舍”建档

[`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md#when-to-write-one) 的现行门槛只有一句话：**只有当代码、测试和现有文档无法解释背后的持久设计理由时，才在同一个 PR 里新增或更新 Agent Note。**

这并不是最初的规则。早期仓库曾规定 `"Every non-trivial change MUST add or update at least one Agent Note"`，结果因为几乎任何改动都能自证“非平凡”，导致大量普通功能修补机械建档。历史提交 [`730bcc7c85`](https://github.com/deepseek-ai/deepseek-harness/commit/730bcc7c85) 正式废除了这条旧规，明确指出**行为变化、用户可见性、修改文件数、新增测试本身都不构成写 Note 的理由**。

动手前用两个自检问题就能快速拍板：

- **能不能具体点出一个“半年后维护者看代码极易踩中的错误”？** 比如看到一段看似多余的校验想顺手删掉，或者看到两个相似配置想强行合并。说得出来才写；说不出来就不写。
- **这篇 Note 会不会刚合入就满足归档条件？** 如果答案是“会”，说明它只记录了一次性施工过程而非长效边界，现在就不该写。

### 2. 明确豁免 vs 不能豁免的边界

| 改动类型 | 要不要写 Note | 判别关键 |
|---|---|---|
| 文案、间距、配色、图标、布局、局部组件显隐或状态点增删 | **豁免（不写）** | 纯局部 UI 呈现与交互微调，动机进 PR 描述、行为靠组件测试或 e2e 钉住即可（如历史提交 [`5124a2a310`](https://github.com/deepseek-ai/deepseek-harness/commit/5124a2a310)） |
| 既有契约下的缺陷修复、内部函数抽取、无语义变化的机械重命名 | **豁免（不写）** | 让代码回到既有决定之内，没有确立新规则 |
| 包改名、文件路径迁移、配置键或默认值变更（原取舍未变） | **更新原 Note** | 刷新既有 `implemented/` Note 里的事实，严禁为了凑数重复新建（[`dsh-find-simplifications`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-find-simplifications/SKILL.md) 明确禁止重复建档） |
| 触及持久化格式、通信协议、权限边界、跨组件状态归属或仓库长效约定 | **写（或更新）** | 哪怕只改了十来行代码（如历史提交 [`2e15f2046c`](https://github.com/deepseek-ai/deepseek-harness/commit/2e15f2046c) 放宽重复沙箱模式审批），只要改变了边界就必须记录 |

如果不写 Note，各类信息各有固定去处，绝不会丢：一次性变更背景放 **PR 描述**；系统当前对外契约放 **源码 JSDoc、包 `README` 与 `docs/`**；防回归保证放 **单测与录制快照**；后续待办放 **GitHub Issue**（在代码或文档里写 `#N owns the follow-up`）。

---

## 二、目录路由：3 个生命周期 × 6 个领域分类 + 双语三件套

### 1. 路径语法与“禁建索引”铁律

每篇活跃 Note 的路径固定为 `.agents/notes/{lifecycle}/{class}/yyyy-mm-dd-topic-title.md`：

- **文件名日期**：填该议题**首次提出**的日期（按 Git 历史），不是实现合入日或归档日。
- **禁止集中索引**：[`scripts/agent-note-tree.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/agent-note-tree.ts) 显式拦截任何 `INDEX.md`。原因是手工或生成的集中目录既重复了路径元信息，又会让毫不相干的 PR 在同一个索引文件上频繁冲突、对 Coding Agent 造成过期误导；目录结构加仓库检索本身就是清单。
- **交叉引用**：Note 之间互引一律写相对 Markdown 链接（如 `[sandbox](../../implemented/feature/2026-07-06-sandbox.md)`），绝不写裸文件名或编号，保证门禁可验且移动目录时可追踪。

### 2. 三个生命周期与六个封闭分类怎么选？

顶层生命周期目录只有三个（`archived/` 是冻结归档库，不算活跃状态）：

- **`proposed/`**：尚未动工（或仅部分构建）、需要先评审对齐的大体量方案。
- **`implemented/`**：方案已随代码交付落地（已经想清楚的决定可以直接写进这里，不必先绕道 `proposed/`）。
- **`rejected/`**：经过评估明确否决、但错误方案依然很有诱惑力，留着防后人重提。

第二层分类目录由门禁脚本锁死在六个名称之内（历史提交 [`a767cd357f`](https://github.com/deepseek-ai/deepseek-harness/commit/a767cd357f) 将早期顶层目录统一收口为此封闭集，未知目录名会导致 `verify-agent-note-classification` 直接报错）：

| 分类目录 | 适用范围 | 易混边界提示 |
|---|---|---|
| `architecture` | **交付源码**的结构性决定：包职责拆分、服务接口、运行时模型 | 与 `process` 拿不准时问一句：**改的是发出去的产品源码，还是围着源码转的工具？** 前者归 `architecture` |
| `process` | 围绕源码的**工程工具、门禁策略与协作工作流**（包管理、发布、vendoring、CI 检查） | 不直接改变产品运行时行为的仓库治理规则归这里 |
| `feature` | 面向终端用户或模型的全新能力与交互行为 | 改变了模型可见工具语义或用户可感知功能时选用 |
| `simplification` | 在不新增能力的前提下，删减代码、收敛配置或移除对外表面 | **仓库故意不设 `refactor`**：有对外可观察收敛的归 `simplification`；行为丝毫未变的纯内部搬迁通常走“免写 Note” |
| `bug-fix` | 修复缺陷时确立的新边界，或填补事故复盘（Postmortem）暴露的机制缺口 | 普通修 bug 不用写；只有修法本身立下了新规矩才进这里 |
| `testing` | 测试基础设施、回放框架、覆盖率策略与测试隔离约定 | 专管怎么测，不管具体业务特性 |

真遇到跨界两可的情况，挑最贴近主旨的一个即可；后续发现选偏了，把三件套一起挪目录就能无痛修正，切勿为单篇记录去改门禁白名单新增分类。

### 3. 磁盘上的双语三件套与中文侧细节

因为 DSH 文档实行中英双语同权（[`docs/i18n/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/i18n/README.md)），一篇 Note 在同目录下固定落盘为三个文件：

```text
2026-09-16-sandbox-same-mode.md          ← 英文正文（格式门禁直接校验）
2026-09-16-sandbox-same-mode.zh.md       ← 中文对侧（与英文逐节对应，可先写中文再译英文）
2026-09-16-sandbox-same-mode.i18n.yaml   ← 逐章节内容块哈希记录（由脚本自动生成）
```

写 `.zh.md` 时最容易踩错的是**哪些保留英文、哪些必须翻译**（[`scripts/translation-brief.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/translation-brief.ts) 按英文侧标题生成 slug 键，但靠章节深度对齐两侧文本）：

- **必须原样保留英文的机器标记**：第 1 行前缀 `# Agent Note: `（冒号后的标题正文要翻译），以及第 3 行整行 `Status: ...`（哪怕是 `Status: rejected — <reason>`，整行理由也保持英文不翻）。
- **固定格式行**：第 2、4 行留空；第 5 行语言切换写 `[English](yyyy-mm-dd-topic.md) | 中文`。
- **必须翻译的章节标题**：`## Problem` → `## 问题`、`## Decision` → `## 决策`、`## Alternatives considered` → `## 考虑过的替代方案`、`## Consequences` → `## 影响`（把英文 `## Problem` 直接抄进中文稿属于漏译）。代码块（fenced code blocks）两侧保持逐字一致。

两边改完后，跑一条命令刷新 `.i18n.yaml` 并验证门禁：

```sh
pnpm run verify-translation-pairing --write .agents/notes/implemented/feature/2026-09-16-sandbox-same-mode.md
pnpm run doc-sync
```

---

## 三、正文怎么写才不算凑字数：头部语法、四段骨架与灵魂章节

### 1. 零自由度的前四行与三态骨架

[`scripts/verify-agent-note-format.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-agent-note-format.ts) 对英文正文做严格语法检查：前四行必须是 `# Agent Note: <title>`、空行、`Status: <status>`、空行，且全文只能出现这一处 `Status:` 行（不准加日期或括号备注）。三种生命周期的正文必填章节如下：

| 生命周期 | 第 3 行精确语法 | 必填 `##` 章节（首个二级标题固定为 `## Problem`） | 中间与尾部可选章节 |
|---|---|---|---|
| `proposed/` | `Status: proposed` | `## Problem`、`## Proposal`、`## Alternatives considered`、`## Acceptance criteria`、`## Risks` | 可夹自定义技术章节（拓扑、协议、Schema）；允许使用将来时讨论迁移步骤 |
| `implemented/` | `Status: implemented` | `## Problem`、`## Decision`、`## Alternatives considered`、`## Consequences` | 可夹自定义技术章节，或陈述现在时事实的 `## Testing` / `## Deferred` / `## Related` |
| `rejected/` | `Status: rejected — <一句话理由>` | `## Problem`、`## Proposal`、`## Alternatives considered`（破折号必须是 `—` 加空格） | 冻结保留提案期原有的 `## Acceptance criteria`、`## Plan`、`## Risks` 等全部章节 |

### 2. 看一篇 232 词的满分短范本

好 Note 从来不靠堆字数。[`2026-09-22-workspace-release-ranges.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-09-22-workspace-release-ranges.md) 全文只有 **232 个英文词**，四段干净利落：

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

对照这篇短文，立刻能看清每一段怎么写才到位：

1. **`## Problem` 不剧透方案**：只摆客观现实（三类包发版节奏不同，既要自动吃补丁又不能误升次版本），不出现 `workspace:~` 字样，让没看过代码的读者一秒读懂处境。
2. **`## Alternatives considered` 针针见血**：每个备选方案用加粗短语领起，一两句话直接点破它输在哪里，不写长篇铺垫。
3. **`## Consequences` 交代代价并点名“谁钉死了它”**：既写清附加义务（vendor/native 补丁版必须严守接口兼容），又明确点出门禁脚本与打包测试如何防回退。

### 3. `Alternatives considered` 的两条死规矩

为什么这一节在所有状态下都强制必填？因为**光记决定不记手下败将，就是在请后人翻旧账重提**。写这一节严守两条红线：

- **只记真实考虑过的方案，严禁硬编稻草人凑数**：如果翻来覆去想不出任何像样的备选方案，通常说明这事根本不存在设计取舍——退回第一节，直接免写 Note。（注：`2026-07-05` 格式门禁上线前的极少数老文件带有 `<!-- agent-note-format: alternatives-not-recorded (pre-format Agent Note) -->` 豁免注释，门禁对新日期文件直接报错拒绝，新写时切勿模仿。）
- **把 Code Review 里的否决过程改写成客观技术理由**：按照 [`dsh-trim-cot-leakage`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-trim-cot-leakage/SKILL.md) 的规范，PR 讨论轮次和审稿人意见属于临时会话上下文，落盘时必须提炼成永久成立的技术原因：
  - **错误写法（留着评审流水账）**：`Rejected in review: caching the resolved spec. We keep resolution per-call.`
  - **正确写法（提炼客观死因）**：`**Caching the resolved spec.** Rejected: the spec depends on per-call cwd, so a cache keyed by request would serve stale roots.`

---

## 四、从 `proposed/` 到 `implemented/`：交付时必须改写成现在时

当一篇提前写好的 `proposed/` 提案随代码正式落地时，在同一笔实现 PR 里挪进 `implemented/` **绝不是跑一下 `git mv` 再改个 `Status:` 行就完事**，而是一次彻底的**现在时态改写**：

1. **清除所有提案期标题**：把 `## Proposal` 按实际交付结果改写为现在时的 `## Decision`。门禁正则 `/^## (?:Proposal\b|Plan\b|Migration plan\b|Acceptance criteria\b)/i` 会拒绝任何残留的施工计划标题（`## Risks` 虽未被脚本硬拒，但规范推荐一并折入 `## Consequences`）。
2. **删掉待办清单，保留验证证据与已知缺口**：按 [`dsh-prose-standard`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-prose-standard/SKILL.md) 要求，提案阶段的步骤勾选单要删净，但**“哪几层测试、哪个真实加载入口钉住了这项决定，以及哪块场景因何暂未覆盖”**必须折进 `## Consequences` 或现在时的 `## Testing` 小节里留存。
3. **别拿 Note 链接替代代码本地注释**：在源码 JSDoc 或包 `README` 里，必须先把调用方关心的行为与完成保证就地写清（如 `"Disposal aborts the run and waits for provider quiescence"`），再链向 Agent Note 解释背后的权衡原因，不能只丢一句“详见某篇 Note”让读者跳页猜行为。

> 核验状态见 [核验基线登记](../00-baseline.md)。
