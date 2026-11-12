# FAQ on Digested · 基于 DSH 源码与官方文档的二次研究

这个目录不是面向学习者的 FAQ。这里的每一个问题是我们在阅读源码、翻官方文档的过程中**自己产生的困惑**，答案需要跨越多个机制面、并结合源码与仓库内文档才能综合出来。

简单说：**一子目录 = 一个探究过的问题，答案是自己综合出来的，不是从某一份材料里直接抄的。**

（涉及运行时行为的结论以 DeepSeek Harness `dsh-v0.2.1-rc.5`（`b830ec950faba0a46dda564be3e2d854afed94f1`）为准。旧 checkout 只用于变更史，不能替代当前源码验证。**当前基线只有一处**：[`00-baseline.md`](./00-baseline.md) 登记 baseline 与各篇核验状态；正文里出现的旧 commit 是历史引用，不是未复核。计数类结论以各篇方法节与点数时的生成目录为准（例如 FAQ 08 的 seam 计数与复核点见该篇方法节）；数字只描述点数时的树，不是产品常量。

> **维护宪章**：[`CORPUS-CHARTER.md`](./CORPUS-CHARTER.md)。改本目录前先读它——引用形态、版本号能写在哪、升级时改什么不改什么、以及为什么这些规则是强制而不是建议。它优先于任何单轮记录。

文件不叫 `README.md`：仓库的 bilingual pairing 门禁会把任意 `README.md` 当成产品文档语料。

## 自包含约定

本目录的每篇答案只依据两类材料：DSH 仓库内的一手内容（`docs/`、`packages/`、`apps/`、根规则与生成目录）和本目录自己的文件。**不链接、不依赖 `_digested/`**：那份语料可以单独取用，也可以作为延伸对照，但它不是本目录结论的依据，缺了它每篇仍然成立。

## 目录结构

```text
_faq_on_digested/
├── 00-index.md            # 你正在看的文件
├── <NN>_<question-slug>/  # 一个问题 = 一个子目录
│   ├── question.md        # 问题描述 + 背景
│   └── answer.md          # 答案 / 分析 / 结论
```

子目录内自由组织。可以是 `question.md` + `answer.md` 两张，也可以合在一起，也可以带代码示例。关键是**引用来源要标注清楚**。

## 命名约定

子目录用英文 slug，简短描述问题主题，例如：

- `plugin-vs-bundle/`
- `loop-swap-radius/`
- `model-visible-equals-logged/`

`NN_` 数字前缀按创建时间排序（01 最早），方便了解问题是按什么次序产生和探究的。

## 术语约定

本目录的承重词优先用 DSH repo 自己的词，并保留英文原文：权威定义在 [`docs/glossary.md`](../docs/glossary.md)，中文版是 [`docs/glossary.zh.md`](../docs/glossary.zh.md)；机制名以 `docs/` 与各包 README 为准。中文只在两种情况下单独出现——repo 已有中文译名（组合包、会话日志、具名组装、一个事实一个家、发行版），或本目录自己的分析装置（下表二，登记后才可用）。

**一、repo 词（本目录照用，不改造）**

| 术语 | 在本目录指什么 |
|---|---|
| seam | Service Definition + Provider + Consumer 三角色齐备的可替换能力；不是单个插件 |
| scope / scope key | 按 agent 划分的注册单位；不是权限、也不是隔离边界 |
| turn / step / round / exchange | 轮次／步骤／Round／交互段；四个层级不混用 |
| goal / Goal Round | 附着在会话上的持久完成目标，及其续行周期 |
| human command | `/goal` 这类由人类适配器执行的斜杠指令，不是模型工具 |
| patch | 按 id 定位 row 并替换整份 config 的一层；不是深合并 |
| roster | profile 的 `dsh.profile.bundles` 有序列表 |
| slot | Client 侧的 UI 挂载点 |
| waterfall | Cordis 的监听器链派发；监听器必须调 `next()` 委托，不调即短路 |

**二、本目录的分析装置**

本目录为了比较和教学造过一些名字——阶梯、比例、平面、卡片一类。它们不是 DSH 的类型、字段或官方命名，因此：

- **不在索引层登记，也不给英文名。** 索引只放 DSH 自己的词；给自造词配英文，会让它们看起来像官方术语。
- **在首次出现的那一页声明。** 固定写法是「这是本篇的说法，不是 DSH 的术语」，并指出它对应哪条 repo 机制。
- **不得替代上面的 repo 词**，也不得让读者以为可以拿去 repo 里搜。
- 一旦发现某个词被读成 DSH 的机制，就在那一页改掉；确实退役的，由 `verify.mjs` 的退役词表守着。

## 已有问题

| 编号 | 问题 | 主回答 |
|------|------|--------|
| 01 | [DSH 的目录为什么这样组织，应该怎样读？](./01_repository-organization/question.md) | [目录设计总模型](./01_repository-organization/answer.md) |
| 02 | [DSH 有没有类似 Claude Code / Codex 的 hooks 机制？三家的 hooks 怎么比？](./02_hooks-vs-claude-code-codex/question.md) | [有，两层：原生拦截扩展点（typed Decision 插件面）+ CC/Codex 兼容桥（7/33 与 5/12 事件的 command 钩子子集）；三家按声明/事件/执行/控制力/审计五轴对照，桥的取舍是"兼容适配器不是力量工具"，外部读数留档 research.md](./02_hooks-vs-claude-code-codex/answer.md) |
| 03 | [四个内置模式（Standard / PTC / Minimal / Creator）各自特殊在哪？](./03_preset-modes-specialty/question.md) | [同一声明式 preset 机制上的四份 bundle patch，各自动宿主一根轴：Standard 三轴不动（31 工具契约 + 三组刻意缺席）、PTC 动呈现层（run_code + 生成 SDK，子调用仍走完整管道）、Minimal 动身份层（complete:true 一句话提示词 + 持久 shell，其余清零）、Creator 动扩展层（运行时检查 + 条件启用 plugin_manager + 三个创作技能）；四模式各一篇分篇 + 5 张 SVG 图解](./03_preset-modes-specialty/answer.md) |
| 04 | [根入口文档：这张地图怎么画出来，跑起来又怎么被消费？](./04_root-entry-doc/question.md) | [静态半：README/AGENTS 读者分流、standing orders 常驻内核、一个事实一个家的 tier taxonomy、生成索引、预算门禁；运行时半：baseline + touch-driven 注入、read/grep/glob 拉取、skill 摘要先给、token meter + compaction 回收；静态预算与运行时预算是同一约束的两端](./04_root-entry-doc/answer.md) |
| 06 | [一次变更从意图到归位，经过哪些载体、哪些段强制？](./06_change-landing-path/question.md) | [docs 是当前合同层；意图 / 决策 / 计划 / 实现 / 合同 / 行为证据 / 交付决定 / review 的落位路径与强制边界；附模型选择器小案例、GitHub Flow 与六层规格静态地图](./06_change-landing-path/answer.md) |
| 07 | [另一个项目想借鉴 DSH 的 Harness 思路，尤其 coding agent 怎么探索、理解项目而不糊涂、不乱发挥，可迁移的东西是什么？](./07_borrowing-dsh-harness-idea/question.md) | [把「糊涂/乱发挥」拆成知识外置、正确路径、可执行反馈三条腿；按优先级迁移，并给一步一步落地路径](./07_borrowing-dsh-harness-idea/answer.md) |
| 08 | ["Everything is a plugin" 落到源码：哪些插件领域已饱和，哪里仍是缺口？（纯技术视角）](./08_plugin-seam-maturity/question.md) | [35 条 seam 的 P/C 全景表与可替换率 42.9%（99 = 58 core + 35 seam + 5 service + 1 bundle，0011 按 `dsh-v0.2.1-rc.2` 生成表实测）、三个被数字推翻的印象、按信号强度排序的缺口 backlog；附找现货的四步流程与三个坑（08/03）](./08_plugin-seam-maturity/answer.md) |
| 10 | [一位烧了 10 亿 token 的用户给 DSH 的三条体感（快就是好 / 要自己改造 / 别用 Pro 多用 vision），在 harness 机制层面对得上什么？](./10_heavy-user-impressions-vs-mechanisms/question.md) | [根本体验 = 一条体验皮（goal/plan）+ 三条根（日志基底 / 委派 spine / 组合层）；主篇展开 goal/plan 机制与"快而小模型为何优秀"的职责拆分论证](./10_heavy-user-impressions-vs-mechanisms/answer.md) |
| 11 | [DSH 支持的开发习惯很多，但哪一种是它"最自然"的？为什么驾驭它写东西会感觉轻松？](./11_native-development-loop/question.md) | [窄证据切片闭环：六步马达 + "轻松"三来源（记忆外包 / 反馈秒级 / 原子回滚）；spec 感是闭环沉淀物而非上游输入；git 历史量化与运行时助推的三路独立验证](./11_native-development-loop/answer.md) |
| 13 | [一个"领域专家"DSH 插件，repo 应该怎样组织？](./13_expert-plugin-repo-organization/question.md) | [五个决策（入口/粒度/DSH 源码/UI 层/spec 流程）× 四个方案（pinned submodule / 树内 / 纯外部 / marketplace），推荐方案 A；共享开发过程（插拔/调试/驱动 agent）见 dev-loop.md，官方安装的保护见 dual-home-isolation.md，命名/标识的"身份 vs 皮肤"分层见 naming-and-identity.md，市场实证见 research.md](./13_expert-plugin-repo-organization/answer.md) |
| 20 | [Agent Note 到底该怎么写、为什么要搞这么复杂？](./20_agent-note-quality-bar/question.md) | [分篇 01–07 按推荐顺序推进：先判该不该写（多数改动不用）、再学怎么写与放哪，然后才是背后的思考（制度在防哪四种失败）、归档判据、移植与三层分工；附录是一篇全程带真实提交号的走查，answer.md 负责一分钟版、目录清单与术语速查，全部结论带真实 Note 与提交作例，出处集中在 reference.md（每条结论对应仓库路径与行号）](./20_agent-note-quality-bar/answer.md) |
| 21 | [`snapshots/` 这套录制会话快照，主仓为什么离不开、插件仓到底需不需要、对插件开发值多少？（对「插件不需要它」这一判断的反查）](./21_recorded-session-snapshots/question.md) | [七篇正文 + 六张图，按「为什么→是什么→能不能用→值多少→怎么组织→怎么做→进不进 git」推进：主仓需要它是因为「组装转录」没有替代品（起点是 178 单测全绿的 ACP 事故）；插件仓能用**机制**——`dsh-llm-replay` 是发布包、接受未经投影的原始运行日志；对插件开发值三样东西（trajectory 回归 / bug 复现 / model-visible 钉住），但上限是「变更探测器 ≠ 正确性 oracle」（postmortem 0002 是「快照为回归背书」的真实事故，四篇 postmortem 里只有一篇拿它当回归 pin）；推荐 L0–L4 阶梯与前六步采用次序：前四阶默认做；进 L4 先按「model-visible 面住在哪」选渲染期望或会话回放；落点判决——独立 agent 运营仓选顶层 `snapshots/` 证据面，`tests/trajectory/` 是降级形态，长在主仓里则都不建](./21_recorded-session-snapshots/answer.md) |
| 22 | [Spec 越堆越多、项目左晃右晃：上下文腐化与规格漂移，DSH 机理上防住了什么？](./22_spec-drift-and-context-rot/question.md) | [七篇正文，三层分开答：运行时（日志只追加、surface 是投影、compaction 遮蔽不删除并逐项记账、goal/plan/todo 外置状态、skills 按需加载、检索与委派隔离）、仓库治理（一个事实一个家、只写当前状态、**决定不可原地改写**、每篇新 Note 强制取代检查、归档冻结与删除判据）、门禁与证据（生成器 `--check` 孪生、`doc-sync` 叶子门禁、快照世代、持久化确认）；另给三次转向的完整走法、五个 git 可核案例、插件仓与传统应用各自的抄法，以及**没防住的部分**（无跨文档语义矛盾检测，语义边界归 review）](./22_spec-drift-and-context-rot/answer.md) |
| 23 | [standalone APP（Desktop）与 CLI/Web 这两份发布物各做到哪一步？插件怎么装，开发期又怎么绕过正式发布？](./23_standalone-vs-web-release-forms/question.md) | [七篇正文 + 六张 SVG 图解：①拆词与两份产物的分工 ②Desktop 成熟度与「隔离 / Linux / macOS」三问（可执行侧天然隔离、数据侧默认共享，独立环境要换 `DSH_HOME`；Linux 明确不支持；Mac 有 arm64/x64 但 Intel 停在 rc.1）③社区数字与原话（四类抱怨与两类认可） ④插件安装三类入口、Desktop 六种装法与生效边界 ⑤四层叠加与三种绕开正式发布的手法 ⑥Desktop 实验室隔离 runbook（`DSH_HOME` + `--user-data-dir` 两个根、`$DSH_HOME` 数据清单、直接双击失效的原因与「反过来」安排、验证清单、仍共享的几处） ⑦全局 CLI 升级的 latest 通道与预检/确认/安装/校验/回滚 runbook；附判据表、五个坑与实测读数](./23_standalone-vs-web-release-forms/answer.md) |
| 24 | [插件怎么才算“能发布”？智能体的只读定义与数据该放在哪？DSH 又认哪些发布形态？](./24_publish-and-release/question.md) | [作者侧：发布物分层、六项检查（拒绝/装后坏/只降级）、六种渠道与 `engines.dsh`、preset 只读定义、数据三归属与 6+2 切法、数据卡设计；发行侧（`release/`）：六轴 owner、profile 三种归属、首用与目录、安装升级卸载、Advisor 施工线](./24_publish-and-release/00-index.md) |
| 25 | [Workspace 到底是不是“启动时的那个目录根”？左侧会话为什么跟它绑定？](./25_workspaces-and-conversations/question.md) | [Workspace 是一条登记记录而不是目录：会话靠 attach 入组、目录只是门票、Ungrouped 是 Client 的减法；六篇正文 + 五张 SVG，附本机 31 个工作区 / 58 条未登记主会话的实测与处置清单](./25_workspaces-and-conversations/answer.md) |
| 27 | [Agent 跑到一半，workflow 还是 Agent Team？运行时编排该怎么选？](./27_runtime-orchestration-choice/question.md) | [五个岔口 + 三把尺子 + 一张诊断表：选择不是挑工具，而是「循环归谁 × 承诺多深」；01 要不要交出去、02 一把还是一批、03 跨轮与 fresh、04 持续协作、05 谁在等，另加 06 症状与迁移、07 为什么不是 DAG 引擎](./27_runtime-orchestration-choice/answer.md) |
| 28 | [DSH 里的「探针」到底做什么？它是 DSH 的术语，还是一套工作法？](./28_probe-usage-and-origin/question.md) | [**从 [00 五级台阶](./28_probe-usage-and-origin/00-ladder.md) 进**：从一句话爬到整套，每级只多一件事；进阶后请看 07 的四个实例（全用主仓原生夹具、真实读取函数、真渲染快照，走“戳了哪儿 → 回来什么 → 为什么是这个结果 → 买到了什么”）；核心结论：不是术语也不是机制，产品树里的 probe 是运行时自检，真正的探针是围绕 DSH 长出来的工作法，靠三条不变量成立](./28_probe-usage-and-origin/answer.md) |
| 29 | [`keyless` 到底是什么意思？它是测试档位、环境状态，还是一条证据的来源？它又解决什么问题？](./29_keyless-meaning-boundaries/question.md) | [**从 [00 导览](./29_keyless-meaning-boundaries/00-index.md) 进**：五分钟建立全貌，不预设前置知识，结尾带读完自检。一句话版——**让真模型跑一次，把回答录下来；以后每次都用录像代替模型，其余一切照旧**。**判据只有一条**：这一遍有没有请求打到真实 provider 模型（假 key 不算破坏、写盘不算破坏、mock 也算）。五篇并列专题：[01 它是什么](./29_keyless-meaning-boundaries/01-what-it-is.md)（名字拆字、三环节、仓库落点）、[02 它解决什么问题](./29_keyless-meaning-boundaries/02-why-it-exists.md)（证据真 × 人能跑 × 结果稳三者不能同时要；postmortem 0001 的账单：178 测全绿 / 覆盖 100% / 全崩）、[03 replay 到底在做什么](./29_keyless-meaning-boundaries/03-how-replay-works.md)（**是跑不是读**；**snapshot 就是日志**）、[04 边界与判据](./29_keyless-meaning-boundaries/04-boundaries.md)（**全组唯一的「证什么/不证什么」表**；四条反直觉结论含 mock 归位；五类测试证据）、[05 速查](./29_keyless-meaning-boundaries/05-cheatsheet.md)（词/命令/决策表/五个常见误解）。只要结论看 [answer](./29_keyless-meaning-boundaries/answer.md)。三张图均配正文且可独立看懂](./29_keyless-meaning-boundaries/answer.md) |

> 09 与 15 已移除：09（自用 owner 的生产力叙事）的主体是商业判断而非机制，其中唯一有外部证据价值的「目录站成与败 + 审计可证明性需求侧证据」已迁到 [`08/research.md`](./08_plugin-seam-maturity/research.md) 的存档节，08 的缺口 backlog 继续引用它；15（loop engineering vs SDD 的方法论对标）的机制落点已被 06（变更落位）与 07（迁移视角）覆盖，其余为外部博客与社区抽样，两者都不产生可执行的工程决策。
> 26 已并入 24：作者侧（包与数据合同）与发行侧（整份 Harness 发行版的六轴与生命周期）合成一个入口，原 26 的正文整体迁到 [`24/release/`](./24_publish-and-release/release/00-answer.md)，包合同一律指回 24 的 01–10 篇，不再复制。
> 05 已并入 04：静态设计与运行时消费合为一篇的两半（先看怎么画，再看怎么被消费），原 `05_root-entry-doc-navigation` 的注入/导航/回收内容成为 [`04/03`](./04_root-entry-doc/03-runtime-consumption.md)。
> 19 已并入 06（其旧编号 02 让位给 hooks 篇）：六层规格与“不能推出的结论”见 [`06/09`](./06_change-landing-path/09-six-layers-and-limits.md)；案例与 GitHub Flow 见 [`06/07`](./06_change-landing-path/07-model-selector-case.md)、[`06/08`](./06_change-landing-path/08-github-flow.md)。
> 17 已并入 08：找现货的四步流程见 [`08/03`](./08_plugin-seam-maturity/03-finding-existing-plugins.md)。
> 18 已并入 23：全局 CLI 升级的 runbook 见 [`23/07`](./23_standalone-vs-web-release-forms/07_global-cli-upgrade.md)。
> 12 已移除：那篇的结论是「index 响应缺 `no-store` → 陈旧缓存导致动态模块 404」，而该修复从未进入产品源码，上游至今也没加缓存头；剩余价值是上游缺口登记与手动 runbook，不构成可维护的 FAQ。其中独立于该结论的「`disabled: true` 对个别 client 行不生效」未解观察已迁到 [`13/dev-loop.md`](./13_expert-plugin-repo-organization/dev-loop.md) 的「拔法」段。

> 原 03（本地多 vendor 研究笔记）已移至 `_misc/_model_vendors/`（由 `_misc/.gitignore` 忽略，不入库：高频改动且可能含账号/密钥材料），编号随本次重排让位给 preset 篇。

## 引用规范

本目录自包含：结论以本目录文件与产品树的一手材料为据，不链接、不引用 `_digested/` 的页面。需要补充细节时，直接引产品树里的文档、包 README、源码或生成目录。

引用源码时标注 commit hash，避免链接随时间失效。

指向 DSH 仓库内容的链接一律用 `blob/master/` 或 `tree/master/`：核对一次，URL 不再随版本变动；换版本时只改陈述核验基线的那一句，不碰引用它的每一行。版本号只在不得不说清楚「这个结论对着哪个版本核过」时出现，且只出现一次。`commit/`、`pull/`、`discussions/` 这类**事件与讨论永久链接**不属此列：它们索引的是一个不可变事件，固定 SHA 本身就是正确的。

引用官方文档用仓库内相对路径，不要把 `docs/` 的正文抄进答案里充数。

FAQ 24 与 07 是 GitHub URL 引用区：目录外引用统一用 GitHub URL（指向 `master`），目录内引用仍用相对路径，以便单独分发。

## 验证

修改本目录后运行：

```sh
node _faq_on_digested/verify.mjs
```

它检查严格 UTF-8、LF 换行与单个结尾换行、相对链接和锚点，拒绝指向 `_digested/` 的链接，并要求指向 DSH 仓库的链接落在默认分支或事件永久链接上（release tag、commit 内容路径与裸 SHA 一律拒绝）。本目录被 `.gitignore` 的本地研究笔记不参与校验：它们不是发布内容。兼容三种历史引用写法：`file.md:47` 行号后缀、仓库根视角裸路径（`docs/…`）、从 DSH 文档摘录的 `docs/` 内裸链接；`node_modules` 内与仓库外的引用降级为警告，不判失败。

宿主门禁的覆盖：`verify-repository-references` 对本地研究语料（`_digested/`、`_faq_on_digested/`、`_dsh_plugin_agent_ready_development/`、`_misc/`）与锁文件跳过 commit 标识符检查，但仍检查组织 URL，因为语料按自身引用规范标注历史 commit，锁文件里的完整性摘要也可能偶然命中对象名；这些都不是维护中的引用。本目录的权威校验器仍是上面的 `verify.mjs`，它检查链接、UTF-8 与锚点；提交号引用按语料规范人工复核。

数字类事实的新鲜度与基线同步复核仍是人工步骤：上游合入后，按产品源码变更与各篇方法节复核 answer/research 的节名与数字，不把「当前 checkout」当成新基线。

## 一个子目录该长什么样

- **问题要明确** — 不是「Harness 是怎么工作的」，而是「换掉 `dsh-agent-loop` 而不换 `dsh-agent` 时，Web UI 还能否从 `session/event` 渲染完整一轮 turn？」
- **答案要综合** — 至少交叉 2 个机制面，或 1 个机制面 + 源码
- **不追求完备** — 回答自己当时的困惑就够了，不全覆盖，不是百科全书
