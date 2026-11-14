# DSH Plugin Agent-ready Development

当干活的主力从人变成 coding agent、人类退居方向盘把控意图与验收时，代码库本身必须从“只给人读的源码夹”演进为一套让 agent 零历史进场也能低摩擦定位知识、受确定性门禁约束、并留下可核验交付证据的 **Agent-friendly Repository（代理友好型仓库）**。DeepSeek Harness（DSH）恰好是一个用自身体系自举演进的工业级样本：它既是运行编码代理的产品框架（coding harness），又把自己的仓库建设成了一套高密度的开发框架（development harness）。

如果把“通用的仓库开发 Harness 思想”和“写 DSH 插件的具体代码套路”混在同一篇正文里讲，两边都会受委屈——抽象思想不敢拔高，插件实操又不敢写细。因此本语料直接把物理目录按逻辑递进编为 `01`、`02`、`03` 三卷，做到**看一眼目录树就知道哪一卷归谁读、每一类事实只住一个家**：

```text
_dsh_plugin_agent_ready_development/
├── 00-index.md                  # 总入口：三类外部读者速通与完整落地处方、五条底层跃迁与实践总索引
├── CORPUS-CHARTER.md            # 语料维护宪章：无版本外链、唯一基线家、单一事实归属与机器强制契约
├── 01-general-repo-harness/     # 卷一（通用工程学 · 12 章 + 导航）：跨语言 Agent-Friendly Repo 设计与老仓改造（零 DSH 代码）
├── 02-dsh-plugin-harness/       # 卷二（插件实战 · 8 章 + 导航）：独立 DSH 插件仓扩展配方、全栈打包/RPC 与专属门禁排障
├── 03-dsh-sdlc-reference/       # 卷三（主仓字典 · 12 篇 + 导航）：DSH 主仓原生研发流程精确条款、六阶段串联与借鉴切面
├── _coverage/                   # 唯一维护账本：核验版本基线、45 页入库双向清单、触发路径与历轮记录
└── verify.mjs & verify.test.mjs # 零依赖自包含校验器与 25 项正负例回归测试
```

- **卷一 · [`01-general-repo-harness/`](./01-general-repo-harness/00-map.md)（通用 Agent-Friendly Repo 工程学，12 章）**：面向任意编程语言（Python / Go / Java / Rust / TypeScript）的技术负责人与架构师。**完全不要求你写一行 DSH 代码**——把 DSH 当作解剖标本，系统拆解知识归属、渐进披露、任务级 `SKILL.md`、爆炸半径阶梯、八类机械门禁、多仓平台可读性、防规格漂移，以及**新建空仓四件套模板（`10`）**与**存量老仓库不停工棘轮改造指南（`12`）**。
- **卷二 · [`02-dsh-plugin-harness/`](./02-dsh-plugin-harness/00-map.md)（DSH 插件仓库开发与专属 Harness 实战，8 章）**：面向新建或维护独立 DSH 插件仓的开发者与 coding agent。不再重复通用大道理，直接给齐能力选型路由表、12+ 个宿主可注入服务货架、五大扩展原语配方（含 PTC 与 CLI/Web 双轨工具卡片）、三种标准拓扑（含外部仓 `window.__ModuleLoader__.load` 客户端打包模板与 `TypertRemoteService` 跨端 RPC）、Cordis 六条防坑铁律、插件专属 `verify-plugin.mjs`、无 Key 脚本化回放测试，以及 **8 大故障 1 分钟排障表与 Postmortem `0001`–`0004` 深度拆解**。
- **卷三 · [`03-dsh-sdlc-reference/`](./03-dsh-sdlc-reference/00-map.md)（DSH 主仓原生研发条款与一手证据字典，12 篇）**：按全生命周期六阶段串联并逐题记录 DSH 主仓库在意图入口、Agent Note 生命周期、`Plan` 与权限隔离、证据路由、契约资产、语义评审、加权批准与多通道发布上的原始规则，每篇顶部均配有 **`> **外部借鉴切面**`** 帮你一秒区分主仓专属参数与可迁移工程不变量。

> **维护宪章**：[`CORPUS-CHARTER.md`](./CORPUS-CHARTER.md)。改本目录前先读它——引用形态、版本号能写在哪、升级时改什么不改什么、每个事实的家在哪，以及为什么这些规则由 `verify.mjs` 机器强制执行。它优先于任何单轮记录。

## 对号入座：三类外部读者的“30 分钟速通”与“完整落地”路线图

无论你是第一次打开本语料的外部技术负责人、正在写代码的插件开发者/Agent，还是研究 AI 原生研发治理的平台架构师，直接按下表选定你的入口：

| 你的角色与当前目标 | 30 分钟速通必读（抓核心骨架） | 完整落地路径与可直接拷走的工程资产 |
|---|---|---|
| **角色 A · 通用研发负责人 / 架构师**<br/>*（不写 DSH 代码，想把自家新仓库或几万行存量老仓库改造成 Agent-Friendly Repo）* | [`01/00-index.md`](./01-general-repo-harness/00-index.md) → [`01/10 · 新仓蓝图`](./01-general-repo-harness/10-agent-ready-repo-blueprint.md) → [`01/12 · 存量老仓改造`](./01-general-repo-harness/12-brownfield-repo-migration.md) | 按 `12` 的 **10 项体检打分表**诊断现仓，Day 1 落 150 行 `AGENTS.md`（参考 `01`/`02`），Week 1 拷走 **`scripts/ratchet-check.mjs` 指纹棘轮脚本**锁死历史坏味道只减不增（配合 `05` 八类门禁），Month 1 补齐按需 `SKILL.md`（`03`）、多仓契约同步（`09`）与防规格漂移代谢机制（`11`） |
| **角色 B · 独立 DSH 插件作者与主力 Coding Agent**<br/>*（要交付可安装、可热更、带 CLI/Web 体验与自动化门禁的 DSH 插件仓）* | [`02/00-index.md`](./02-dsh-plugin-harness/00-index.md)（先查能力选型总表） → [`02/01 · 单包起步`](./02-dsh-plugin-harness/01-new-plugin-repository.md) → [`02/07 · 服务货架与扩展配方`](./02-dsh-plugin-harness/07-extension-recipes-and-host-services.md) | 写全栈 Web 界面与跨端 RPC 时直接拷走 [`04`](./02-dsh-plugin-harness/04-plugin-repo-topologies.md) 的 **`tsdown.config.ts`（`window.__ModuleLoader__.load` 打包）与 `TypertRemoteService` 五步模板**；把 [`05`](./02-dsh-plugin-harness/05-cordis-contracts-and-model-experience.md) 六大契约与 [`06`](./02-dsh-plugin-harness/06-plugin-gate-and-ci-harness.md) 的 **`verify-plugin.mjs` + `ScriptedLlmAdapter` 无 Key 回放 + `ci.yml`** 装入仓库；遇故障直查 [`08 · 排障与 Postmortem`](./02-dsh-plugin-harness/08-troubleshooting-and-postmortems.md) |
| **角色 C · AI 研发效能与平台治理研究者**<br/>*（想深究百包级自举仓库如何靠机械策略、契约证据与人机分工运转）* | [`03/00-index.md`](./03-dsh-sdlc-reference/00-index.md)（看六阶段生命周期串联图） → [`03/12 · Agent 契约证据`](./03-dsh-sdlc-reference/12-agent-contract-evidence.md) → [`03/06 · 语义评审`](./03-dsh-sdlc-reference/06-review-and-human-role.md) | 按需深挖 [`03/01`](./03-dsh-sdlc-reference/01-agent-note-lifecycle.md)（决策生命周期）、[`03/03`](./03-dsh-sdlc-reference/03-plan-and-sandbox.md)（计划与沙箱硬隔离）、[`03/02`](./03-dsh-sdlc-reference/02-issue-pr-lifecycle.md) 与 [`03/10`](./03-dsh-sdlc-reference/10-approval-gate.md)（默认分支可信策略与 `blame` 加权批准），以及 [`01/07 · 机器盲区与维护账本`](./01-general-repo-harness/07-boundaries-and-costs.md) |

## 五条底层认知跃迁：当主力变成 Agent、人类只握方向盘

在进入任何具体脚本、目录或插件代码之前，DSH 的工程实践背后立着五条反直觉但极度务实的底层判断：

1. **会话是易失缓存，仓库才是持久内存。** 长会话一定会经历上下文压缩（遮蔽旧事件并按“现在还成立吗”重写摘要），留在聊天窗口里的口头约定迟早蒸发，更不能把编码会话的临时推理残渣（如 `no longer`、`this PR adds`）泄漏进仓库注释；凡是下一个 fresh agent 还会再问的契约、默认值、角色边界与取舍理由，必须在同一次变更中落入仓库的唯一权威位置（[规格漂移与决策新陈代谢](./01-general-repo-harness/11-spec-drift-and-decision-metabolism.md)、[DSH 会话上下文纪律](./02-dsh-plugin-harness/03-context-and-drift.md)）。
2. **散文约定必会腐化，非零退出的机械门禁才是硬治理。** Agent 遵守非零退出码的可靠性远高于遵守礼貌的文字规范；凡是可机械判定的承诺（依赖拓扑、导出契约、禁用逃逸强转、生成物新鲜度、常驻文档词数上限）都应下沉为带负例验证（亲手造回归看红灯再撤回）的可执行门禁，存量老仓则通过**只减不增的指纹棘轮**平滑收口（[可执行反馈与八类门禁](./01-general-repo-harness/05-executable-feedback.md)、[存量老仓渐进改造](./01-general-repo-harness/12-brownfield-repo-migration.md)）。
3. **“现在是什么”与“为什么不走那条路”必须物理分家。** 源码、类型、README 与生成目录只用现在时陈述当前状态，绝不夹带变更史；代码和文档表达不了的持久取舍与**被击败的真实备选方案（负知识）**单独进入带生命周期（`proposed` / `implemented` / `rejected` / 冻结 `archived`）与强制取代检查的决策记录，既防止新 agent 把历史争论误当现行 API，又阻止它反复重踩已证伪的诱人死路（[可读性与知识归属](./01-general-repo-harness/02-legibility-and-ownership.md)、[Agent Note 生命周期](./03-dsh-sdlc-reference/01-agent-note-lifecycle.md)）。
4. **渐进披露（Progressive Disclosure）保护上下文注意力与前缀缓存。** 把整座仓库的规则或冗长工具说明塞进常驻上下文只会稀释注意力并击穿 Prompt Cache；根与子树 `AGENTS.md` 受词数预算硬锁约束、只保留每轮必守的短指令与跳转指针，穷举清单交给源码生成器，复杂操作流程封装进按需匹配加载的 `SKILL.md`（[Skills 专章](./01-general-repo-harness/03-skills-as-procedural-memory.md)、[仓库分类学 §7](./01-general-repo-harness/08-repository-taxonomy.md#7-代码与模块契约防-agent-写腐化的三道防线)）。
5. **人类把控方向靠四个精确控制面，而不是替 Agent 盯每一行语法。** “人把控方向（Human-on-the-Loop）”在工程上拆解为四个不可下放给机器全自动自证的交接点：① 意图入口只规定外部可观察行为与验收条件，不预先写死内部函数名；② 动工前审阅重大取舍的备选方案与当次会话 `Plan`，并让计划软引导与 `Sandbox`/`Approval` 硬权限物理隔离；③ 长程任务用持久 `Goal` 续接，恢复后显式 `rearm`、遇阻停在 `blocked` 交还人类改向；④ 完成判断依靠独立于被测实现的外部世界 `Oracle`、对齐意图的 `Semantic Review` 以及人工触发的发布扳机（[通用 Agent-Friendly Repo 蓝图](./01-general-repo-harness/10-agent-ready-repo-blueprint.md)）。

## 十六项可抽取工程实践总索引（按痛点直达唯一 Owner）

无论你处于哪条路线，以下十六项高价值工程实践都可以按当前痛点直接跳转到其唯一展开位置（本语料严守“一个事实一个家”，不跨卷复制长篇细则）：

| 所属层面 | 可抽取的工程实践 | 专治的 Agent 典型失控痛点 | 唯一展开位置（Owner 页） |
|---|---|---|---|
| **通用仓库 Harness** | 分层 `AGENTS.md` + 词数预算锁 + 双轨索引（生成目录 vs 路径树） | 根指令越堆越肥、手工集中索引并发冲突腐烂 | [可读性与知识归属](./01-general-repo-harness/02-legibility-and-ownership.md) |
| **通用仓库 Harness** | 按需加载的任务级 `SKILL.md` 与常驻规则/确定性门禁三分法 | 复杂评审与选测流程靠口口相传，或写成没人看的长文 | [Skills 专章](./01-general-repo-harness/03-skills-as-procedural-memory.md) |
| **通用仓库 Harness** | 改动爆炸半径四级阶梯（L0 配置 → L1 扩展点 → L2 Seam → L3 主干） | Agent 每次加功能都直接改核心循环，模块越改越耦 | [正确路径与爆炸半径阶梯](./01-general-repo-harness/04-paved-road-and-participation.md) |
| **通用仓库 Harness** | 专治 Agent 恶习的八类机械门禁模式 + Prove-Red 负例控制 | 类型强转糊弄编译、跨层私引、手改生成物、死守卫永绿 | [可执行反馈](./01-general-repo-harness/05-executable-feedback.md) |
| **通用仓库 Harness** | 动态可观测四面镜（合成配置导出、生成目录、只读自省、事件日志） | Agent 光读静态源码瞎猜多层配置叠加与活进程状态 | [动态可检查性](./01-general-repo-harness/06-runtime-inspection.md) |
| **通用仓库 Harness** | 五种内容维护形态 + 16 类角色后缀命名 + 边界显式 `resolve` | 乱造 `Manager/Helper/utils` 垃圾桶、同进程到处塞冗余防御 | [仓库分类学](./01-general-repo-harness/08-repository-taxonomy.md) |
| **通用仓库 Harness** | 可扩展底座与下游多仓协同的四条显式契约（机器清单 + 自有测试基座） | 下游仓库的 Agent 深掏上游私有文件、瞎猜兼容矩阵 | [可扩展平台与多仓协同](./01-general-repo-harness/09-platform-and-multi-repo-legibility.md) |
| **通用仓库 Harness** | 人类四方向控制面 + 三级规模裁剪表 + 通用新仓四件套起步模板 | 小团队盲目照搬大厂重流程被反噬，或新仓不知从何搭起 | [通用 Agent-Friendly Repo 蓝图](./01-general-repo-harness/10-agent-ready-repo-blueprint.md) |
| **通用仓库 Harness** | 事实原地更新 + 清理推理残渣（CoT Leakage）+ 决定取代归档新陈代谢 | 半年后文档充满 `used to` 与冲突旧规格，没人敢删历史文件 | [规格漂移与决策新陈代谢](./01-general-repo-harness/11-spec-drift-and-decision-metabolism.md) |
| **通用仓库 Harness** | 存量老仓库 10 项体检打分表 + 三阶段不停工改造 + 指纹棘轮止血脚本 | 面对几万行历史债务无从下手，一上硬门禁就全仓爆红停摆 | [存量老仓库渐进改造实战](./01-general-repo-harness/12-brownfield-repo-migration.md) |
| **DSH 插件仓实战** | Day-1 单包 Host Bundle 脚手架、`dsh.bundle` 安全边界与打包冒烟链 | 新建插件仓配错依赖层级、误用 `postinstall` 脚本或安装静默失效 | [新建独立 DSH 插件仓](./02-dsh-plugin-harness/01-new-plugin-repository.md) |
| **DSH 插件仓实战** | 宿主 12+ 可注入底座服务货架 + 五大真实扩展配方（PTC 与双轨卡片） | 重复手搓文件/子进程绕过沙箱，或写了 `presentResult` 以为 Web 会生效 | [宿主服务货架与扩展配方](./02-dsh-plugin-harness/07-extension-recipes-and-host-services.md) |
| **DSH 插件仓实战** | 全栈双树插件 `tsdown` lazy-CJS 客户端打包、`TypertRemoteService` 与 `Volatile<T>` | 拿裸 `tsc` 编 `client.js` 白屏、挂子路径丢客户端或前后端手搓裸 JSON | [插件拓扑、打包与跨端通信](./02-dsh-plugin-harness/04-plugin-repo-topologies.md) |
| **DSH 插件仓实战** | Cordis 生命周期六条防坑铁律与工具 `Model Experience` 设计 | `export default` 吞掉 `inject`、Waterfall 漏调 `next()`、单例污染并发会话 | [Cordis 契约与模型体验](./02-dsh-plugin-harness/05-cordis-contracts-and-model-experience.md) |
| **DSH 插件仓实战** | 插件仓双面 `verify-plugin.mjs`、防 `PENDING` 测试与无 Key 回放 CI | 外部插件仓缺少主仓私有基建，测不出 `PENDING` 死等与打包缺口 | [插件门禁、回放与 CI Harness](./02-dsh-plugin-harness/06-plugin-gate-and-ci-harness.md) |
| **DSH 插件仓实战** | 8 大高频插件故障 1 分钟排障表 + Postmortem `0001`–`0004` 防复发铁律 | 单测 100% 绿上线却崩、裸起 Vite 假验收、子进程退出码与沙箱告警误拼 | [插件排障与真实事故复盘](./02-dsh-plugin-harness/08-troubleshooting-and-postmortems.md) |

## 目标读者与四类陈述边界

本语料严格区分四类陈述，避免读者把 DSH 内部制度误当成外部强制义务：**运行时事实**描述 DSH 与 Cordis 的接口和真实运行行为；**主仓要求**说明 DSH 自身 monorepo 的贡献、测试与发布规则；**可迁移工程建议**是本语料面向外部通用仓库与独立插件仓提炼的结构做法；**仓库自定**包括外部团队自己的组织审批、分支策略与发版节奏。主仓要求不会因使用 DSH 或借鉴其思想就自动落到外部仓库头上。

DSH 没有正式宣布采用某套冠名方法论；本语料只以 DSH 固定版本的仓库源码、文档、规则、测试、Skills、workflows 和 git 历史作为唯一一手证据源，其他研究材料不参与证据链。

## 独立使用与发行

复制本目录的全部内容并保留相对目录结构，即可在任意环境独立阅读并运行自包含校验器；不需要宿主仓库的其他研究目录或任何当前会话上下文。必要概念在各卷入口自包含解释，跨卷链接仅供按需深挖。核对一手源码需访问 DSH 仓库或备一份对应版本的本地 checkout。

## 三卷与维护目录总表

| 路径 | 核心职责 | 何时修改或复核它 |
|---|---|---|
| [`01-general-repo-harness/`](./01-general-repo-harness/00-map.md) | **卷一（通用工程学，12 章 + 导航）**：解剖仓库如何成为面向 coding agent 的开发环境，提炼通用防腐化架构、八类门禁模式、新仓模板与存量老仓棘轮改造指南 | 仓库知识归属、Skills、机械门禁、动态自省、多仓协同、分类规则或防漂移/迁移模式演进时更新 |
| [`02-dsh-plugin-harness/`](./02-dsh-plugin-harness/00-map.md) | **卷二（DSH 插件仓实战，8 章 + 导航）**：覆盖独立插件仓脚手架、宿主服务与五大扩展配方、全栈双树打包与跨端 RPC、Cordis 契约、专属门禁回放及排障复盘 | DSH 插件打包/加载契约、宿主服务、Host/Client 双树、Typert RPC、生命周期规则或 Postmortem 演进时复核 |
| [`03-dsh-sdlc-reference/`](./03-dsh-sdlc-reference/00-map.md) | **卷三（主仓参考字典，12 篇 + 导航）**：按六阶段串联并精确记录 DSH 主仓变更主线各环节的条件、状态机与例外，框定外部借鉴切面 | 上游 workflows、policy、Note 规则、契约证据、评审或发布机制变化时按 `_coverage` 触发路径修订 |
| [`_coverage/`](./_coverage/00-index.md) | **唯一维护账本**：登记当前核验版本基线、全量 45 页入库双向清单、已核验来源、重审触发路径与历轮修订记录 | 每次版本同步、新增/调整页面或升级校验规则时同步维护清单并追加日期记录 |
| [`verify.mjs`](./verify.mjs) & [`verify.test.mjs`](./verify.test.mjs) | **零依赖自包含门禁与正负例回归测试**：守护编码、单尾换行、相对链接与锚点、表格列数、入库页面双向清单、轮次黑话与动态计数隔离、共享宪章哈希及 SVG 几何/无障碍规范 | 结构或校验规则演进时修改脚本，并在 `verify.test.mjs` 同步新增通过真实入口执行的正/负例断言 |

## 验证

修改本目录后，使用 Node.js（Node 22+）运行自包含校验器。位于本目录时执行 `node verify.mjs`，位于宿主仓库根目录时执行：

```sh
node _dsh_plugin_agent_ready_development/verify.mjs
```

修改验证规则或页面结构后，同步运行 `node _dsh_plugin_agent_ready_development/verify.test.mjs`。脚本仅使用 Node 内置模块，不依赖 pnpm、宿主脚本、Git 或网络；宿主仓库附加检查与 SVG 渲染看图验收规范见[维护页](./_coverage/00-corpus-maintenance.md)。
