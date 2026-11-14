# FAQ on Digested · 基于 DSH 源码与官方文档的专题问答集

这里收录的每一个专题，都源自阅读 DeepSeek Harness（DSH）源码与官方文档时遇到的**真实工程困惑**——这些问题没法靠抄某一份 README 直接回答，必须跨多个子系统、结合源码与配置才能把来龙去脉讲透。

一句话定位：**一个子目录回答一个独立问题；先在 `answer.md` 给出说人话的直接结论与选型表，再按需在 `01-*.md` 等分篇展开实例与机制细节。**

> **核验基线**：涉及运行时行为与生成目录读数的结论，统一在 [`00-baseline.md`](./00-baseline.md) 登记基线版本与各篇核验状态（唯一基线家）。正文里出现的旧 commit 是历史事件引用；计数类读数只描述清点时的仓库状态，不是产品常量。
>
> **维护宪章**：[`CORPUS-CHARTER.md`](./CORPUS-CHARTER.md)。修改本目录前请先读它——引用形态、版本号能写在哪、升级时改什么不改什么，均以宪章为准。

本目录内所有文件均不命名为 `README.md`（避免触发主仓产品文档的 bilingual pairing 门禁）。

## 自包含与目录结构

每篇回答只依赖两类材料：DSH 仓库内的一手内容（`docs/`、`packages/`、`apps/`、根规则与生成目录）和本目录自己的文件，**不链接、不依赖 `_digested/`**。

每个专题子目录统一采用单主入口结构：

```text
_faq_on_digested/
├── 00-index.md               # 总目录与约定（当前文件）
├── 00-baseline.md            # 唯一核验基线登记表
├── CORPUS-CHARTER.md         # 语料维护宪章
├── verify.mjs                # 编码、死链、锚点与退役词校验脚本
└── <NN>_<question-slug>/     # 一个独立问题 = 一个子目录
    ├── question.md           # 问题背景与子问题（15–30 行）
    ├── answer.md             # 唯一主回答入口（结论、对比表、边界与分篇导读）
    ├── 01-*.md .. 0N-*.md    # 按需展开的实例走查与机制深挖（可选）
    └── reference.md / research.md  # 权威源码出处或外部一手资料留档（可选）
```

`NN_` 数字前缀按议题创建时间编号（01 最早）；已合并或退役的编号保留历史说明，不强行重排。

## 术语约定

承重概念优先使用 DSH 仓库自己的术语（权威定义见 [`docs/glossary.md`](../docs/glossary.md) 与 [`docs/glossary.zh.md`](../docs/glossary.zh.md)）：

**一、仓库原生术语（直接照用）**

| 术语 | 在本目录指什么 |
|---|---|
| `seam` | `Service Definition + Provider + Consumer` 三角色齐备的可替换能力边界，不是单个插件 |
| `scope` / `scope key` | 按 agent 划分的插件注册单位；不是权限边界，也不是安全沙箱 |
| `turn` / `step` / `round` / `exchange` | 轮次 / 步骤 / Goal 续行轮 / 交互段；四个粒度不混用 |
| `goal` / `Goal Round` | 附着在会话上的持久完成目标及其空闲续跑轮次 |
| `human command` | `/goal`、`/plan` 这类由人类界面适配器直接消费的斜杠指令，不是模型工具 |
| `patch` | 按 `id` 定位插件行并整块替换 `config` 的配置叠层（不是深合并） |
| `roster` | Profile `package.json` 中 `dsh.profile.bundles` 的有序列表 |
| `slot` | Web 客户端的 UI 扩展挂载点 |
| `waterfall` | Cordis 监听器链派发；监听器委托下游必须显式调用 `next()`，不调即短路 |

**二、各篇临时对比用语**

分篇为方便归纳对比偶尔会起通俗统称（如“方案 A–D”、“三张图”），但遵循三条纪律：不在总索引登记英文缩写代号；首次出现时点明这只是行文统称而非 DSH 源码术语；绝不替代上面的仓库原生词。曾引发歧义的旧自造词由 `verify.mjs` 退役词表自动拦截。

---

## 已有问题（共 20 篇）

| 编号 | 问题 | 主回答入口与核心内容 |
|---|---|---|
| 01 | [DSH 的目录为什么这样组织，第一次进仓应该怎么读？](./01_repository-organization/question.md) | [仓库全景导览：顶层六大职责分区、`apps/` 薄壳原则、`packages/<group>/<pkg>/` 二级拆包逻辑，以及静态目录 / 包依赖图 / 运行时三层插件树的对照读法](./01_repository-organization/answer.md) |
| 02 | [DSH 有没有类似 Claude Code / Codex 的 hooks 机制？三家怎么比？](./02_hooks-vs-claude-code-codex/question.md) | [两层 Hooks 体系：原生强类型拦截扩展点（`agent/pre-step`、`tools/pre-execute`、`ctx.tools.guard()`）+ 复用存量 `hooks.json` 的实验兼容桥，附三家配置/控制力/审计横向对照与选型边界](./02_hooks-vs-claude-code-codex/answer.md) |
| 03 | [四个内置模式（Standard / PTC / Minimal / Creator）各自特殊在哪？](./03_preset-modes-specialty/question.md) | [不改一行 Agent 主循环，靠四份声明式 `*.patch.yml` 在同进程 `scope` / `isolate` 中拼出四种模式：31 工具常规主力、`run_code` 代码聚合、极简裸测基线与 `cordis` 自扩展工坊](./03_preset-modes-specialty/answer.md) |
| 04 | [根入口文档：这张地图怎么画出来，跑起来又怎么被消费？](./04_root-entry-doc/question.md) | [静态建图与运行时消费闭环：`README` / `AGENTS` 人机分流、“一个事实一个家”分层、词数预算与五道门禁 + 运行时 `dsh-agent-instructions` 触达推入、工具按需拉取与压力压缩回收](./04_root-entry-doc/answer.md) |
| 06 | [在 DSH 里改一处功能，从想法到合入主干会落成哪些文件？哪些是每次必交的？](./06_change-landing-path/question.md) | [交付落位全景：中间“原子三件套”（代码 + 当前状态文档 + 会报红的行为证据）每次必交，两头载体按需启用；附 7 文件 UI 小改与 Web capability seam 双案例对看及人机权限边界](./06_change-landing-path/answer.md) |
| 07 | [外部项目想借鉴 DSH 让 coding agent 不糊涂、不乱发挥，该抄什么、别照搬什么？](./07_borrowing-dsh-harness-idea/question.md) | [跨项目可迁移骨架：外置可寻址地图、阻力最小的默认接线轨道、秒级非零退出的可执行检查；附中小业务仓 / 多模块仓裁剪对照表与 Day 1 → Month 1+ 分步落地路线](./07_borrowing-dsh-harness-idea/answer.md) |
| 08 | [“Everything is a plugin” 落到源码里：哪些领域已经够用，哪些还是真缺口？](./08_plugin-seam-maturity/question.md) | [插件接缝成熟度盘点：99 个 `ctx` 服务中 35 条可替换 seam 的四档分布、三个常见误判、按真实需求排序的缺口清单，以及写新插件前查现成能力的四步排查法](./08_plugin-seam-maturity/answer.md) |
| 10 | [一位烧掉 10 亿 token 的重度用户给出的三条反直觉体感，在源码机制层面对得上什么？](./10_heavy-user-impressions-vs-mechanisms/question.md) | [三条体感的源码对位：`goal + plan` 外置状态循环放大快小模型、声明式叠层与 Creator 模式支撑随手改造、`read_image` 像素级反馈替代纯文本空想，附推理回传与缓存成本细账](./10_heavy-user-impressions-vs-mechanisms/answer.md) |
| 11 | [为什么很多人觉得“用 DSH 干活很省心、在仓库里改代码也很顺手”？它最自然的开发闭环是什么？](./11_native-development-loop/question.md) | [拆清两个主语：日常使用者省心来自运行时产品姿态（只在拍板处打断、先读后改、技能按需加载、温和纠偏）；仓库贡献顺手来自内外双圈与六步窄证据切片闭环，附新增工具实战走查](./11_native-development-loop/answer.md) |
| 13 | [团队要开发一套“领域专家”DSH 插件，独立仓库应该怎么组织与日常联调？](./13_expert-plugin-repo-organization/question.md) | [领域专家插件仓组织：五个核心决策 × 四种仓库摆法对比（首选“单包起步 + `vendor/dsh` 子模块钉 tag”的方案 A），配套免发版热调试、双 `$DSH_HOME` 物理隔离与第 0 天命名防坑指南](./13_expert-plugin-repo-organization/answer.md) |
| 20 | [Agent Note 到底什么时候才该写、为什么要把格式与归档卡得这么严？](./20_agent-note-quality-bar/question.md) | [Agent Note 实战标准：日常局部/UI 改动默认免写，唯有持久设计取舍才写；详解四段骨架、`Alternatives considered` 核心作用、同 PR 取代检查与 `archived/` 永久哈希封存规则](./20_agent-note-quality-bar/answer.md) |
| 21 | [`snapshots/` 录制会话快照为什么主仓离不开？外部插件仓到底需不需要建？](./21_recorded-session-snapshots/question.md) | [录制会话快照指南：复盘 `postmortem 0001` 组装盲区与 `@deepseek-ai/dsh-llm-replay` 复用方法，给出四类仓库选型表、四步测试阶梯，以及警惕 `postmortem 0002`“快照替 bug 背书”的独立断言铁律](./21_recorded-session-snapshots/answer.md) |
| 22 | [Spec 越堆越多、项目左晃右晃：上下文腐化与规格漂移，DSH 机理上防住了什么？](./22_spec-drift-and-context-rot/question.md) | [防腐化与防漂移三层防线：运行时会话投影与记账压缩、仓库“事实原地刷 / 决定不篡改 / 取代检查 / 归档移出搜索”治理、9 对生成目录门禁，并坦诚划出机器查不出的语义盲区](./22_spec-drift-and-context-rot/answer.md) |
| 23 | [Desktop 桌面端与 CLI/Web 两份发布物各做到哪一步？插件怎么装，怎么搭隔离实验环境与升级 CLI？](./23_standalone-vs-web-release-forms/question.md) | [两份官方发布物对比：可执行与插件按 Profile 天然隔离、用户数据按 `$DSH_HOME` 默认共享；涵盖平台支持边界、6 种装插件入口、四层免发版覆盖、双根实验室隔离与全局 CLI 升级脚本](./23_standalone-vs-web-release-forms/answer.md) |
| 24 | [写一个 DSH 插件或智能体，怎么才算能发布？只读定义与运行期数据各自该放哪？](./24_plugin-publishing-and-data/question.md) | [插件作者发布与数据指南：`dsh.bundle.patch` 唯一可启用交付物、六道安装运行检查与 `engines.dsh` 规则、随包只读 Preset/Skill 注册，以及会话日志 / `$DSH_HOME` 托管存储 / 工作区文件三块数据落点](./24_plugin-publishing-and-data/answer.md) |
| 25 | [Workspace 到底是不是启动时的目录？为什么有的会话进了分组、有的掉进 Ungrouped？](./25_workspaces-and-conversations/question.md) | [Workspace 与侧栏归组真相：拆清进程 `cwd`、不可变 `SessionHeader.cwd`、可变 `ctx.workingDirectory` 与 `workspace.json` 登记簿四件事，讲透四道显式 `attach` 入组门与前端 `Ungrouped` 差集计算](./25_workspaces-and-conversations/answer.md) |
| 26 | [想基于 DSH 给团队交付一套定制工作台（如看板应用），哪些归属必须自己设计？](./26_harness-distribution/question.md) | [定制工作台与发行组装：以 Kanban Studio 为锚点过滤 90% 只需发单 Bundle 的场景，拆解入口封装、Profile 叠层、`$DSH_HOME` 隔离、设置优先级、首启绑定与升级回退六项归属及四层回读自检](./26_harness-distribution/answer.md) |
| 27 | [Agent 跑到一半，该调 `subagent`、`workflow`、`PTC`、`goal` 还是 `agent-team`？运行时编排怎么选？](./27_runtime-orchestration-choice/question.md) | [运行时编排选型手册：先切开会话前环境装配与会话中模型选工具两层主体，再用一张全候选对比表走通五个实战岔口、正交叠用模式与异常/迁移排障](./27_runtime-orchestration-choice/answer.md) |
| 28 | [常听人说“打个探针看一眼”，探针是 DSH 的内置机制，还是一套排障工作法？](./28_probe-usage-and-origin/question.md) | [探针实证工作法：厘清源码同名 `probe` 自检函数与围绕会话日志取证的工作法，结合 `system/message` / `request/header` 分离等细节拆解 4 个主仓真实探针实例与防自欺铁律](./28_probe-usage-and-origin/answer.md) |
| 29 | [`keyless` 在 DSH 测试体系里到底按什么判据界定？它能证明什么、证不了什么？](./29_keyless-meaning-boundaries/question.md) | [`keyless` 唯一判据与边界：只看单次运行有没向真实模型服务商发请求（塞 `*-no-call` 假 Key、跑 `refresh` 写盘都算 `keyless`），解析 `record + replay` 如何破除组装盲区及五档测试证据上限](./29_keyless-meaning-boundaries/answer.md) |

### 历史编号演进说明

- **24 与 26 按受众独立成篇**：`24` 面向插件与智能体包作者（讲单个 Bundle 清单、随包只读定义与运行数据落点）；`26` 面向定制工作台发行方（讲多 Bundle + Profile + 独立 `$DSH_HOME` 的工作台封装与生命周期）。
- **已合并编号**：
  - `05` 已并入 `04`：运行时注入、工具按需拉取与压缩回收见 [`04/03-runtime-consumption.md`](./04_root-entry-doc/03-runtime-consumption.md)。
  - `17` 已并入 `08`：动手写新插件前查找现成能力的四步流程见 [`08/01-finding-existing-capabilities.md`](./08_plugin-seam-maturity/01-finding-existing-capabilities.md)。
  - `18` 已并入 `23`：全局 CLI 安全升级与回滚手册见 [`23/03-isolated-lab-and-cli-upgrade.md`](./23_standalone-vs-web-release-forms/03-isolated-lab-and-cli-upgrade.md#global-cli-upgrade)。
  - `19` 已并入 `06`（原编号 `02` 让位给 hooks 篇）：交付载体分工、双案例对比与 GitHub Flow 门禁见 [`06/answer.md`](./06_change-landing-path/answer.md)、[`06/02`](./06_change-landing-path/02-same-pr-delivery-and-gates.md) 与 [`06/03`](./06_change-landing-path/03-two-real-cases.md)。
- **已移除编号**：
  - `03` 早期本地多供应商测试笔记已迁入被忽略的本地目录，现 `03` 为内置预设模式专题。
  - `09` 与 `15` 因主体属于外部商业判断或方法论综述而非可执行机制已移除；其中具备长期参考价值的社区目录站与审计诉求留档在 [`08/research.md`](./08_plugin-seam-maturity/research.md)。
  - `12`（前端入口缓存头观察）因未构成独立产品机制已移除；其中关于 `disabled: true` 对部分客户端插件行不生效的排障提醒已收入 [`13/02-dev-and-debug-loop.md`](./13_expert-plugin-repo-organization/02-dev-and-debug-loop.md)。

---

## 引用规范

- **自包含与权威链接**：指向 DSH 仓库当前源码与文档的 GitHub 链接统一使用默认分支路径（`blob/master/` 或 `tree/master/`），避免每次发版批量改 URL；引用历史提交、PR 或讨论等不可变事件时使用 `commit/<sha>`、`pull/<n>`、`discussions/<n>` 永久链接。
- **不复制基线版本号**：全语料仅在 [`00-baseline.md`](./00-baseline.md) 声明当前核验基线，各子目录正文不重复抄写当前基线 SHA。
- **可独立分发的专题**：`07`、`24` 与 `26` 对主仓文件统一使用指向 `master` 的 GitHub URL，目录内部与兄弟 FAQ 之间使用相对路径，方便单独发给外部团队阅读。

## 验证命令

修改本目录任何文件后运行：

```sh
node _faq_on_digested/verify.mjs
```

该脚本自动检查：
- 严格 UTF-8 编码、LF 换行符与文件末尾**恰好一个**换行符；
- 禁止出现 `README.md` 文件名；
- 所有相对路径、图片引用与 Markdown `#anchor` 锚点可解析，且 Markdown 表格列数一致；
- 禁止链接 `_digested/`，并校验指向 `deepseek-ai/deepseek-harness` 的 URL 符合 `master` 或不可变事件规范；
- 拦截 `.md` 与 `.svg` 图表中的已退役自造术语。
