# FAQ on Digested · 基于 DSH 源码与官方文档的二次研究

这个目录不是面向学习者的 FAQ。这里的每一个问题是我们在阅读源码、翻官方文档的过程中**自己产生的困惑**，答案需要跨越多个机制面、并结合源码与仓库内文档才能综合出来。

简单说：**一子目录 = 一个探究过的问题，答案是自己综合出来的，不是从某一份材料里直接抄的。**

> **当前研究基线**：涉及运行时行为的结论以 DeepSeek Harness `dsh-v0.2.1-rc.5`（`b830ec950faba0a46dda564be3e2d854afed94f1`）为准。旧 checkout 只用于变更史，不能替代当前源码验证。各篇文件头声明的「源码核验基线」是该篇结论最后一次逐条对过的 commit；正文里出现的旧 commit 是历史引用，不是未复核。计数类结论以各篇方法节与点数时的生成目录为准（例如 FAQ 08 的 seam 计数与复核点见该篇方法节）；数字只描述点数时的树，不是产品常量。

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

## 已有问题

| 编号 | 问题 | 主回答 |
|------|------|--------|
| 01 | [DSH 的目录为什么这样组织，应该怎样读？](./01_repository-organization/question.md) | [目录设计总模型](./01_repository-organization/answer.md) |
| 04 | [DSH 根入口文档的静态设计：这张地图是怎么画出来的？](./04_root-entry-doc-design/question.md) | [根入口分流、tier 路由、预算门禁与可迁移原则](./04_root-entry-doc-design/answer.md) |
| 05 | [DSH 跑起来之后，根入口文档是怎么被消费的？](./05_root-entry-doc-navigation/question.md) | [指令注入、工具导航、按需加载与运行时预算](./05_root-entry-doc-navigation/answer.md) |
| 06 | [一次变更从意图到归位，经过哪些载体、哪些段强制？](./06_change-landing-path/question.md) | [docs 是当前合同层；意图 / 决策 / 计划 / 实现 / 合同 / 行为证据 / 交付决定 / review 的落位路径与强制边界；附模型选择器小案例、GitHub Flow 与六层规格静态地图](./06_change-landing-path/answer.md) |
| 07 | [另一个项目想借鉴 DSH 的 Harness 思路，尤其 coding agent 怎么探索、理解项目而不糊涂、不乱发挥，可迁移的东西是什么？](./07_borrowing-dsh-harness-idea/question.md) | [把「糊涂/乱发挥」拆成知识外置、正确路径、可执行反馈三条腿；按优先级迁移，并给一步一步落地路径](./07_borrowing-dsh-harness-idea/answer.md) |
| 08 | ["Everything is a plugin" 落到源码：哪些插件领域已饱和，哪里仍是缺口？（纯技术视角）](./08_plugin-seam-maturity/question.md) | [35 条 seam 的 P/C 全景表与可替换率 42.9%（99 = 58 core + 35 seam + 5 service + 1 bundle，0011 按 `dsh-v0.2.1-rc.2` 生成表实测）、三个被数字推翻的印象、按信号强度排序的缺口 backlog；附找现货的四步流程与三个坑（08/03）](./08_plugin-seam-maturity/answer.md) |
| 09 | [同一棵插件树对一个自用 owner（个人 / 小团队）的生产力在哪，怎样讲清楚？（自用生产力视角）](./09_plugin-business-ladder/question.md) | [敢放手 + 省手 + 可复用三层价值；自用 owner 最值的几类插件；L0–L3 参与阶梯；四个 owner 能自证的实验](./09_plugin-business-ladder/answer.md) |
| 10 | [一位烧了 10 亿 token 的用户给 DSH 的三条体感（快就是好 / 要自己改造 / 别用 Pro 多用 vision），在 harness 机制层面对得上什么？](./10_heavy-user-impressions-vs-mechanisms/question.md) | [根本体验 = 一条体验皮（goal/plan）+ 三条根（日志基底 / 委派 spine / 组合层）；主篇展开 goal/plan 机制与"快而小模型为何优秀"的职责拆分论证](./10_heavy-user-impressions-vs-mechanisms/answer.md) |
| 11 | [DSH 支持的开发习惯很多，但哪一种是它"最自然"的？为什么驾驭它写东西会感觉轻松？](./11_native-development-loop/question.md) | [窄证据切片闭环：六步马达 + "轻松"三来源（记忆外包 / 反馈秒级 / 原子回滚）；spec 感是闭环沉淀物而非上游输入；git 历史量化与运行时助推的三路独立验证](./11_native-development-loop/answer.md) |
| 12 | [dsh web 多开窗口卡住：第 4 个就卡，是启动有并发限制吗？](./12_dsh-web-stuck-windows/question.md) | [不是并发：rev 轮换 + 陈旧缓存 index → 动态模块全 404；诊断机制仍成立，但「index 加 `no-store`」修复已随 0008 整树照搬退役，登记为上游候选缺口；runbook 保留为手动处置路径](./12_dsh-web-stuck-windows/answer.md) |
| 13 | [一个"领域专家"DSH 插件，repo 应该怎样组织？](./13_expert-plugin-repo-organization/question.md) | [五个决策（入口/粒度/DSH 源码/UI 层/spec 流程）× 四个方案（pinned submodule / 树内 / 纯外部 / marketplace），推荐方案 A；共享开发过程（插拔/调试/驱动 agent）见 dev-loop.md，官方安装的保护见 dual-home-isolation.md，命名/标识的"身份 vs 皮肤"分层见 naming-and-identity.md，市场实证见 research.md](./13_expert-plugin-repo-organization/answer.md) |
| 14 | [DSH 有没有类似 Claude Code / Codex 的 hooks 机制？三家的 hooks 怎么比？](./14_hooks-vs-claude-code-codex/question.md) | [有，两层：原生拦截扩展点（typed Decision 插件面）+ CC/Codex 兼容桥（7/33 与 5/12 事件的 command 钩子子集）；三家按声明/事件/执行/控制力/审计五轴对照，桥的取舍是"兼容适配器不是力量工具"，外部读数留档 research.md](./14_hooks-vs-claude-code-codex/answer.md) |
| 15 | [用 DSH 开发插件，为什么感觉接近 loop engineering，又不如 SDD 看得清进度？](./15_loop-engineering-vs-sdd/question.md) | [执行循环已经出现，取题与判断仍要由人设计；DSH 运行时、仓内纪律、插件仓自定流程分开看；Osmani 2026-06 原文为体感提供直接参照，SDD 产物可成为循环的记忆与审阅点；公开社区抽样不推断私有工作方式](./15_loop-engineering-vs-sdd/answer.md) |
| 16 | [四个内置模式（Standard / PTC / Minimal / Creator）各自特殊在哪？](./16_preset-modes-specialty/question.md) | [同一声明式 preset 机制上的四份 bundle patch，各自动宿主一根轴：Standard 三轴不动（31 工具契约 + 三组刻意缺席）、PTC 动呈现层（run_code + 生成 SDK，子调用仍走完整管道）、Minimal 动身份层（complete:true 一句话提示词 + 持久 shell，其余清零）、Creator 动扩展层（运行时检查 + 条件启用 plugin_manager + 三个创作技能）；四模式各一篇分篇 + 5 张 SVG 图解](./16_preset-modes-specialty/answer.md) |
| 20 | [Agent Note 到底该怎么写、为什么要搞这么复杂？](./20_agent-note-quality-bar/question.md) | [分篇 01–07 按推荐顺序推进：先判该不该写（多数改动不用）、再学怎么写与放哪，然后才是背后的思考（制度在防哪四种失败）、归档判据、移植与三层分工；附录是一篇全程带真实提交号的走查，answer.md 负责一分钟版、目录清单与术语速查，全部结论带真实 Note 与提交作例，出处集中在 reference.md（每条结论对应仓库路径与行号）](./20_agent-note-quality-bar/answer.md) |
| 21 | [`snapshots/` 这套录制会话快照，主仓为什么离不开、插件仓到底需不需要、对插件开发值多少？（对「插件不需要它」这一判断的反查）](./21_recorded-session-snapshots/question.md) | [七篇正文 + 六张图，按「为什么→是什么→能不能用→值多少→怎么组织→怎么做→进不进 git」推进：主仓需要它是因为「组装转录」没有替代品（起点是 178 单测全绿的 ACP 事故）；插件仓能用**机制**——`dsh-llm-replay` 是发布包、接受未经投影的原始运行日志；对插件开发值三样东西（trajectory 回归 / bug 复现 / model-visible 钉住），但上限是「变更探测器 ≠ 正确性 oracle」（postmortem 0002 是「快照为回归背书」的真实事故，四篇 postmortem 里只有一篇拿它当回归 pin）；推荐 L0–L4 阶梯与前六步采用次序：前四阶默认做；进 L4 先按「model-visible 面住在哪」选渲染期望或会话回放；落点判决——独立 agent 运营仓选顶层 `snapshots/` 证据面，`tests/trajectory/` 是降级形态，长在主仓里则都不建](./21_recorded-session-snapshots/answer.md) |
| 22 | [Spec 越堆越多、项目左晃右晃：上下文腐化与规格漂移，DSH 机理上防住了什么？](./22_spec-drift-and-context-rot/question.md) | [七篇正文，三层分开答：运行时（日志只追加、surface 是投影、compaction 遮蔽不删除并逐项记账、goal/plan/todo 外置状态、skills 按需加载、检索与委派隔离）、仓库治理（一个事实一个家、只写当前状态、**决定不可原地改写**、每篇新 Note 强制取代检查、归档冻结与删除判据）、门禁与证据（生成器 `--check` 孪生、`doc-sync` 叶子门禁、快照世代、持久化确认）；另给三次转向的完整走法、五个 git 可核案例、插件仓与传统应用各自的抄法，以及**没防住的部分**（无跨文档语义矛盾检测，语义边界归 review）](./22_spec-drift-and-context-rot/answer.md) |
| 23 | [standalone APP（Desktop）与 CLI/Web 这两份发布物各做到哪一步？插件怎么装，开发期又怎么绕过正式发布？](./23_standalone-vs-web-release-forms/question.md) | [七篇正文 + 六张 SVG 图解：①拆词与两份产物的分工 ②Desktop 成熟度与「隔离 / Linux / macOS」三问（可执行侧天然隔离、数据侧默认共享，独立环境要换 `DSH_HOME`；Linux 明确不支持；Mac 有 arm64/x64 但 Intel 停在 rc.1）③社区数字与原话（四类抱怨与两类认可） ④插件安装三类入口、Desktop 六种装法与生效边界 ⑤四层叠加与三种绕开正式发布的手法 ⑥Desktop 实验室隔离 runbook（`DSH_HOME` + `--user-data-dir` 两个根、`$DSH_HOME` 数据清单、直接双击失效的原因与「反过来」安排、验证清单、仍共享的几处） ⑦全局 CLI 升级的 latest 通道与预检/确认/安装/校验/回滚 runbook；附判据表、五个坑与实测读数](./23_standalone-vs-web-release-forms/answer.md) |
| 24 | [插件怎么才算“能发布”？智能体的只读定义与数据该放在哪？DSH 又认哪些发布形态？](./24_plugin-publish-and-agent-data-planes/question.md) | [00-index 决策入口 + 十篇正文 + 十张 SVG + 证据登记：把 plugin / bundle / profile / preset / skill / client / MCP 拆成四个管道；发布六项检查（三种失败方式：拒绝/跳过、装后坏、只降级）；npm / Git / tarball / link / 市场 / 官方目录六种来源与 `engines.dsh` 判定；agent = Host loop + preset + session，preset 为何运行时不被改写、改它为何只影响新 Agent；数据三归属（workspace / home（`$DSH_HOME` + `~/.agents`）/ session）与八条规则，09 再给 6+2 数据平面、六种切法与迁移清单，10 给数据设计顾问（数据卡、原生能力地图、作用域/键、生命周期/迁移）；07 给 T0–T8 测试矩阵与一小时/一天/一周预算（真实安装形状、录制回放、数据隔离、供应链），08 把打包拆成分发/组合/定义/资源四种性质并对照 Dify、Hugging Face、MCP、Claude Code、VS Code；附可照抄骨架、检查表、C/H/P/S/R/U 证据分级，并纠正 `agent.cordis.yml` 与 `dsh.compatibility` 两处旧写法](./24_plugin-publish-and-agent-data-planes/00-index.md) |
| 25 | [Workspace 到底是不是“启动时的那个目录根”？左侧会话为什么跟它绑定？](./25_workspaces-and-conversations/question.md) | [Workspace 是一条登记记录而不是目录：会话靠 attach 入组、目录只是门票、Ungrouped 是 Client 的减法；六篇正文 + 五张 SVG，附本机 31 个工作区 / 58 条未登记主会话的实测与处置清单](./25_workspaces-and-conversations/answer.md) |
| 26 | [一组插件怎样交成一份完整可控的 Harness 发行版：组合、目录、数据与生命周期](./26_harness-release/00-question.md) | [发行版按六轴拆：运行时、profile、patch 层、app surface、Harness home 与数据、生命周期；六轴都有明确 owner 才算完整。profile 只决定起哪个 app surface，不是数据隔离边界。术语来源分 REPO 与本目录两栏，自造词只有 发行版（distribution）／发行方／六轴，存储与资产两个视角改用 repo 机制名（files、session log、storage domain、client state）与 asset owner。每份事实用数据卡分别记 owner、authority、source、机制与作用域，并把 Session cwd、Workspace registration、模型工具面和 home scope 分开。含原生/外部参考、证据边界，以及 50 作者面规范与 90–93 施工路线。](./26_harness-release/00-index.md) |
| 27 | [Agent 跑到一半，workflow 还是 Agent Team？运行时编排该怎么选？](./27_runtime-orchestration-choice/question.md) | [五个岔口 + 三把尺子 + 一张诊断表：选择不是挑工具，而是「循环归谁 × 承诺多深」；01 要不要交出去、02 一把还是一批、03 跨轮与 fresh、04 持续协作、05 谁在等，另加 06 症状与迁移、07 为什么不是 DAG 引擎](./27_runtime-orchestration-choice/answer.md) |

> 02 与 19 已并入 06：六层规格与“不能推出的结论”见 [`06/09`](./06_change-landing-path/09-six-layers-and-limits.md)；案例与 GitHub Flow 见 [`06/07`](./06_change-landing-path/07-model-selector-case.md)、[`06/08`](./06_change-landing-path/08-github-flow.md)。
> 17 已并入 08：找现货的四步流程见 [`08/03`](./08_plugin-seam-maturity/03-finding-existing-plugins.md)。
> 18 已并入 23：全局 CLI 升级的 runbook 见 [`23/07`](./23_standalone-vs-web-release-forms/07_global-cli-upgrade.md)。

> 03 为本地多 vendor 研究笔记，已移至 `_misc/_model_vendors/`（由 `_misc/.gitignore` 忽略，不入库：高频改动且可能含账号/密钥材料）；编号保持不变，便于与历史引用对齐。

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
