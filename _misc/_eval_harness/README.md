# `_eval_harness` · 五份评估文档的来源与职责

本目录是把 DSH 研究语料**重写**成一套可直接使用的评估方法的结果。五份文档都不要求读者读过任何来源材料——本页只交代它们**从哪儿来、改了什么、改动时改哪一份**。

## 五份是什么

**先粗后细。** 每套评估拆成两份：**粗粒度（coarse-grained）**（第一次过、判断值不值得投入；稳定，基本不动）与**细粒度（fine-grained）**（只对粗判（coarse check）为红或这一轮要动的维度深挖；会持续增补）。

| 文件 | 粒度 | 评什么 | 什么时候用 |
|---|---|---|---|
| [`01-evaluate-development-harness-coarse.md`](./01-evaluate-development-harness-coarse.md) | 粗 | 任何仓库的**开发 Harness**：信息缺口（information gap）、证据级（evidence level）、切片（slice）、两轴（two axes）、成熟度档（maturity level）、十七维粗判（coarse check）、报告格式、自检 | 先跑这份 |
| [`02-evaluate-development-harness-fine.md`](./02-evaluate-development-harness-fine.md) | 细 | 同一对象：每维一句话定义、探针（probe） `PB1`–`PB6`、两轴（two axes）锚点（anchor）、88 条封顶（cap）、伪证（false evidence）与走形（degradation）、第三层反证（falsification） | 粗判（coarse check）为红 / 要动的维度 |
| [`11-evaluate-runtime-harness.md`](./11-evaluate-runtime-harness.md) | 粗 | **运行时 Harness**（仅当这个仓库本身是 agent 产品）：适用性（applicability）三问、五个活体实验（live experiment） `LX1`–`LX5`、两轴（two axes）、成熟度档（maturity level）、十一维粗判（coarse check）、形态裁剪（profile tailoring）、模仿判断 | 仓库本身是 agent 产品时，先跑这份 |
| [`12-evaluate-runtime-harness-fine.md`](./12-evaluate-runtime-harness-fine.md) | 细 | 同一对象：每维一句话定义、探针（probe） `PB1`–`PB5`、两轴（two axes）锚点（anchor）、66 条封顶（cap）、伪证（false evidence）与走形（degradation）、第三层反证（falsification） | 粗判（coarse check）为红 / 要动的维度 |
| [`20-from-gaps-to-plan.md`](./20-from-gaps-to-plan.md) | 处方 | 缺口清单（gap list）怎样变成施工顺序（build order） | 拿到缺口清单（gap list）之后 |

**执行者是 agent，人是读者。** agent 按这些文档跑评估、写 Markdown 报告；人读文档是为了理解判据，读报告是为了复核证据、回答报告末尾的问题、决定下一步，不打分。

**关系。** 诊断（01/11 粗 → 02/12 细）→ 处方（20）。一个普通库可以开发侧满分而运行时侧完全不适用。粗粒度（coarse-grained）给每维一个**粗判档（coarse grade）**，细粒度（fine-grained）把要动的维度钉成**定档（final grade）**；两者冲突时以定档（final grade）为准。

**两套维度各评各的对象。** 开发侧评仓库自己（规则、配置、生成物（generated artifact）、开发工具链、供给 coding agent 的上下文），运行时侧评 agent 产品。判据同源的五对（CP4↔RT9、ST1↔RT2、ST2↔RT7、ST3↔RT1、MT2↔RT3）各自计分、各自排期，不去重，也不互相借证据，规则见 [20 的原则六](./20-from-gaps-to-plan.md#原则六同时评两份时相近的维度各评各的对象)。

### 本目录的处境

本目录在 `_misc/` 下：[_misc/00-index.md](../00-index.md) 的默认口径是"本目录内容不重要，除非任务明确指定不要读取"，`_misc/**` 也不在仓库结构门禁（gate）的扫描范围内（所以改完必须自己跑下面的校验）。因此这五份文档**目前不在仓库的常规入口链上**：要让人或 agent 用上，需要在根入口或 `docs/` 加一行"另见"（尚未做）。文档本身不依赖仓库路由。

### 标识符约定（token）

所有编号都是**两个字母 + 数字**，前缀就是类别——单独看到一个 token 也能判断它指什么：

| 前缀 | 指什么 | 例子 |
|---|---|---|
| `KN` `CP` `EV` `ST` `MT` | 开发 Harness 的五个维度组：知识归位 / 变更路径 / 证据与交付 / 状态与上下文 / 维护与发布 | `KN2 归属`、`MT1 防漂移` |
| `RT` | 运行时 Harness 的维度 | `RT9 工具执行与授权` |
| `PB` | 某一维的探针（probe；所属维度由所在小节决定） | `PB3` |
| `LX` | 五个活体实验（live experiment） | `LX1 回放` |
| `EL` | 证据四级 | `EL0`–`EL3` |
| `IG` | fresh agent 的七类信息缺口（information gap） | `IG4 改动落在哪里` |
| `MG` | 成熟度档（maturity level；两份文档各自定义档名） | `MG2 可重建` |
| `AQ` | 运行时评估的三个适用性（applicability）问题 | `AQ1`、`AQ3` |
| 第一 / 第二 / 第三层 | 三层评估（清点 / 切片（slice） / 反证（falsification）），用中文，不用 token | — |

**为什么不用单字母 + 数字**：`A1`、`B2`、`C3`、`D4`、`E5`、`P1`、`S1` 在别的语境里是纸张规格、通道号、优先级、严重度——人和 agent 都得靠上下文猜，还容易和同一份文档里的组名、证据档、实验编号互相撞。两字母前缀自带类别，且避开了这些常用组合。

---

## 评估依据（knowledge base）

**这一节是给"要拿这套方法去评东西"的人或 agent 看的：先知道判据从哪来，再谈评估。**

本目录的判据全部来自**本仓库内的三处语料**（都可随时回查，不需要外部链接）；**没有使用任何仓库外的二手描述**。逐文件清单见下一节。

| 语料 | 是什么 | 本目录从它取了什么 |
|---|---|---|
| `_agent_ready_development/` | 面向普通仓库的 SDLC 与仓库机制：`repo-harness/` 11 篇、`sdlc-reference/` 13 篇、`sdlc-tutorial/` | 开发维度里**仓库机制那一半**的定义与素材：入口链 / 归属（ownership） / 分类学、流程固化、状态分层、评审与批准的流程素材；"四条不能混淆的边界"的原始表述 |
| `_faq_on_digested/` | 跨材料二次研究（按主题重新提问与回答）：07 转移章法、11 原生开发循环、08/09 插件成熟度（maturity）与商业台阶等 | 七个信息缺口（information gap） `IG1`–`IG7`；**十七维的定义底本**（来源十维 + 补齐的七维）与分阶段验收；反馈分层与"检查必须先被证明会失败"；迁移优先级；模仿判断 |
| `_digested/` | 当前、经核验的 DSH 机制解读：`agent-loop`、`capability-seams`、`composition`、`session-and-loop`、`tools-prompt-llm`、`runtime-profiles`、`surfaces`、`system` 等 | 运行时 Harness 十一维的全部机制清单；组合内核 / 事实源（source of truth） / 投影 / 能力 seam / 扩展点 / 拦截点等术语 |

### 给另一个做评估的 agent

1. **先定位判据来源。** 每份文档的术语是自包含的；但"这条规则为什么这么定""这个 DSH 事实对不对"要回到上表的三处语料查，**不要凭记忆补**。
2. **按粒度走。** 粗粒度（coarse-grained；`01` / `11`）先出评分卡（scorecard）与缺口清单（gap list）；只在粗判（coarse check）为红、或这一轮决定要动的维度上，才翻细粒度（fine-grained；`02` / `12`）走探针（probe）、锚点（anchor）与封顶（cap）。全量细粒度（fine-grained）不是必须的。
3. **例证是可选的。** 开发侧的 DSH 例证钉在 commit `46a7f68b…`，集中在 02 各卡的"例证（可选核对）"段落，只有 01 §1 一处带链接；运行时侧（11/12）不附例证。不核对例证也能完成评估，核对只是加分。
4. **不要用被评估对象自己的文档当证据**（见 01 §2）。这一条同样适用于"评估依据"本身：本页只说明来源，判据要回到上面三处语料。

---

## 原始材料清单

上表三处语料里具体读了哪些文件、用在哪里。[`../_references/`](../_references/00-index.md) 里的外部文章副本没有使用。

### 一、直接通读的（9 份）

| 来源 | 提供了什么 |
|---|---|
| [`_faq_on_digested/07_borrowing-harness-idea/14-two-failures-as-missing-info.md`](../../_faq_on_digested/07_borrowing-harness-idea/14-two-failures-as-missing-info.md) | **七个信息缺口（information gap）**（01 §1）、"不赌聪明赌成本结构"的反转 |
| [`…/07/06-step-by-step-guide.md`](../../_faq_on_digested/07_borrowing-harness-idea/06-step-by-step-guide.md) | 十维评估表、Phase 2–8 的产出与验收、垂直切片（vertical slice）走查五问 |
| [`…/07/09-executable-feedback.md`](../../_faq_on_digested/07_borrowing-harness-idea/09-executable-feedback.md) | 六层反馈表、"检查必须先被证明会失败"、学走形（degradation）的检查 |
| [`…/07/10-transfer-playbook.md`](../../_faq_on_digested/07_borrowing-harness-idea/10-transfer-playbook.md) | 迁移优先级、"四个不能混淆的边界"、外置知识的维护成本（maintenance cost）表 |
| [`…/07/answer.md`](../../_faq_on_digested/07_borrowing-harness-idea/answer.md) | 三条立场、三层模型、症状 → 机制总览表 |
| [`_faq_on_digested/11_native-development-loop/answer.md`](../../_faq_on_digested/11_native-development-loop/answer.md) | **窄证据切片（slice）闭环六步**（01 §3 的第二层）、"轻松"的三个机制来源、代价与边界 |
| [`…/11/question.md`](../../_faq_on_digested/11_native-development-loop/question.md) | 上述闭环的问题框架与范围声明 |
| [`_agent_ready_development/README.md`](../../_agent_ready_development/README.md) | 三个视角的分工与语料自身的结构纪律 |
| [`…/repo-harness/00-index.md`](../../_agent_ready_development/repo-harness/00-index.md) | 五问五答映射表、核心术语表（development harness / legibility / paved road / …） |

### 二、委托全量精读的（五路）

这五路是把整片语料读完、按"每个维度最具体的可观察检查是什么"整理回来的，是开发侧新增七维与运行时侧全部十一维的主要依据：

| 路 | 读了什么 | 用在哪 |
|---|---|---|
| 教程与立场 | `_agent_ready_development/sdlc-tutorial/00-index.md` | 01 §1 三条立场的出处 |
| 仓库机制 | `_agent_ready_development/repo-harness/` 全 11 篇 + 三个目录的 `README`/`00-index` + `_coverage/00-corpus-maintenance.md` + `verify.mjs` | 知识归位组、证据与交付组、状态与上下文组 |
| 转移章法 | `_faq_on_digested/07_borrowing-harness-idea/` 的 01–05、07–09、11–13（11 篇） | 开发十七维（维度集合与粗判（coarse check）在 01，定义、探针（probe）、锚点（anchor）与封顶（cap）在 02）、20 的处置卡（remediation card）、四条边界 |
| 流程参考 | `_agent_ready_development/sdlc-reference/` 全 13 篇 | 补齐的五维：意图入口、评审与批准、发布与版本、分类学、防漂移（drift prevention） |
| 运行时机制 | `_digested/` 的 `agent-loop`、`capability-seams`、`composition`、`session-and-loop`、`tools-prompt-llm`、`runtime-profiles`、`surfaces`、`system` 八组 + `_faq_on_digested/08_plugin-seam-maturity`、`09_plugin-business-ladder` | 11/12 的全部十一维 + 11 §5 的模仿判断 |

### 三、只用来核对边界的

- `scripts/verify-md-links.ts` 的 `PATTERNS` 与翻译配对门禁（gate）的 scope 判定 —— 用来确认 `_misc/**` 不在仓库结构门禁（gate）的扫描范围内（结论：不在，所以本目录改完要自己校验，见下）。

### 四、没有用到的

诚实记录，避免误以为这里是全语料的汇总：

- [`_misc/_references/`](../_references/00-index.md) —— 外部架构分析文章副本，**一份都没读**。
- `_digested/harness-idea/`、`cordis-runtime/`、`experimental/`、`_change_log/` —— 只在运行时机制那一路的转述里间接出现，没有直接进入正文。
- `_faq_on_digested/` 的其余 10 个目录（01–06、10、12–14）—— 未参与。

---

## 每份文档的哪一部分来自哪里

### 01 开发 · 粗粒度（coarse-grained）

| 部分 | 来源 |
|---|---|
| §1 七个信息缺口（information gap） IG1–IG7 | FAQ07/14 的缺口表（原文写作"六个缺口"但列了七行，本目录统一按七个处理；分组见下一节第 7 条） |
| §1 三条立场 | `sdlc-tutorial/00-index.md` |
| §2 证据四级 EL0–EL3 | 本目录的归纳，底子是 FAQ07/09 的"prose 没有约束力（enforcement）、门禁（gate）才有" |
| §3 第二层六步切片（slice） | FAQ11/answer 的窄证据切片（slice）闭环 |
| §4 两轴（two axes）与成熟度档（maturity level）、十七维粗判（coarse check）一览 | **本目录新增**（两轴（two axes）与封顶（cap）机制是新增；"粗判（coarse check）一览"是把各维的"一眼信号"从卡片里提出来） |
| §5 适用性（applicability）裁剪（tailoring）、§6 报告格式、§7 报告自检、§8 短例、附录 A/B | **本目录新增**（短例是构造的，非真实仓库） |

### 02 开发 · 细粒度（fine-grained）

| 部分 | 来源 |
|---|---|
| §3 第三层反证（falsification）四动作 | FAQ07/06 的 Phase 1 第二步 |
| §4 知识归位组四维 | FAQ07 的 02 / 03 / 07 + repo-harness 08 |
| §4 变更路径组四维 | sdlc-reference 09 + FAQ07 的 05 / 11 / 08 |
| §4 证据与交付组四维 | FAQ07 的 01 / 09 + sdlc-reference 的 06 / 10 |
| §4 状态与上下文组三维 | FAQ07 的 04 / 12 / 13 |
| §4 维护与发布组两维 | FAQ07/06 的 Phase 8 + sdlc-reference 的 05 / 11 |
| §4 各维的探针（probe）、锚点（anchor）、封顶（cap）、伪证（false evidence）、走形（degradation） | 同上各组来源，按"每个维度最具体的可观察检查"重写 |
| §5 细粒度（fine-grained）示例、附录 A 封顶规则（cap rules）速查 | **本目录新增**（示例承 01 §8 的构造例子） |

### 11 运行时 · 粗粒度（coarse-grained） / 12 运行时 · 细粒度（fine-grained）

| 部分 | 来源 |
|---|---|
| 11 §0 适用性（applicability）三问、§4 形态裁剪（profile tailoring）、§7 验收 | **本目录新增** |
| 11 §3 十一维粗判（coarse check）一览、11 §2 五个活体实验（live experiment） LX1–LX5（12 引用） | **本目录新增**（实验是把运行时机制那一路整理出的可观察检查改写成"必须真的跑一遍"） |
| 11 §3 / 12 §4 RT1–RT10 | `_digested/` 八组的机制清单，按"组合内核 / 会话事实 / 格式世代 / 循环边界 / 能力 seam / 扩展点 / 模型可见面（model-visible surface） / 入口投影 / 工具执行 / 可执行治理"重分组 |
| 12 §4 RT11 客户端组装纪律（Client composition discipline） | `_digested/surfaces` + `system`（有条件适用：没有 GUI 就标 N/A） |
| 11 §5 模仿判断 | FAQ08 的"饱和与值钱不重合""能换 ≠ 换出差异" + FAQ09 的三层价值与三条失效边界 |
| 12 附录 A 封顶规则（cap rules）速查 | **本目录新增** |
| 11 §8 短例、12 §5 细粒度（fine-grained）复算 | 构造的（12 §5 承 11 §8 的例子） |

### 20 从缺口到计划

| 部分 | 来源 |
|---|---|
| §1 排序原则（ordering principles） | FAQ07/10 的优先级 0–5 + FAQ07/06 的"先诊断后施工"；**原则六（两份评分卡（scorecard）各评各的对象）为本目录新增** |
| §2 症状 → 维度表 | FAQ07/answer 的总览表，按十七维扩充 |
| §3 十七张处置卡（remediation card） | FAQ07/06 的 Phase 2–8 验收 + 各章的"从哪开始""学走形（degradation）的检查" |
| §4 运行时处置卡（remediation card） | 12 的十一维 + 运行时机制那一路整理的边界与失败语义 |
| §5 形态重解释 | **本目录新增**（把 01 §5 的形态表（profile table）逐格落到各维的最小形态（minimum form）上） |
| §6 四条边界与维护成本（maintenance cost）表 | FAQ07/10 + repo-harness 07 |
| §7 循环与停止条件、§8 短例 | **本目录新增**（短例承 01 第 8 节的构造例子） |

---

## 相比来源材料，做了什么改动

不是摘录，是重写。八处实质改动：

1. **把单轴自评换成两轴（two axes） + 封顶规则（cap rules）。** 来源语料是"没有 / 有但不成体系 / 像回事"三档自报；本目录拆成**覆盖面（coverage） × 约束力（enforcement）**，并给每一维配封顶规则（cap rules；例如"任何一条规则指不出唯一 home → 覆盖面（coverage）封顶（cap） 1"）。动机是：一个团队说"我们有归属（ownership）"和"任何人 10 秒内指得出它"是两件事。
2. **补了六个维度，并把来源明确"不单列"的运行时查询提成一维。** 来源的十维里没有：意图入口、评审与批准、目录分类学、发布与版本、维护与防漂移（drift prevention）——这五个在 `sdlc-reference/` 里有素材但没被单列；把散在 09 与 06 里的"负例控制（negative control）"提成一维（它是唯一一个检验其它维度是不是真的的维度）；把来源原文说"由静与动和披露覆盖、不单列"的 **ST3 运行时查询（Inspectability）**独立成一维（"一条命令问出现在生效的是什么"值得单独评）。
3. **去掉了前置依赖。** 每个术语在所在文档里定义；来源里的 DSH 专有名词（Agent Note、paved road、capability seam 等）只在必要时作为例证出现。
4. **补了两份评分卡（scorecard）的合用规则。** 来源语料只讲单份评估；本目录新增原则六（两份评分卡（scorecard）各评各的对象：开发侧评仓库，运行时侧评产品，名字相近的维度不去重、不互借证据）、两套形态词汇的映射（01 §5 与 11 §4 的互相指引），以及快诊（quick check）另抽检 EV2 的规则。
5. **把每套评估拆成粗 / 细两份。** 粗粒度（coarse-grained）回答"值不值得投入、哪几维最痛"，给出粗判档（coarse grade），稳定、基本不动；细粒度（fine-grained）回答"到底该记几档"，给出定档（final grade），会持续增补（新探针（probe）、新封顶（cap）只落 02/12）。动机是：只改一条封顶（cap）不应该碰稳定的粗粒度（coarse-grained）。
6. **把外部引用压到一条。** 来源材料有几十条钉版 DSH 链接；本目录只在 01 的 §1 保留一条原文引文（那句"agent 更信门禁（gate）不信散文"），其余 DSH 事实改写为 02 里不带链接的"例证（可选核对）"段落。**不打开任何链接都能完成评估。**
7. **重排了信息缺口（information gap）的分组。** 来源把 IG4–IG6 归为"乱发挥"；本目录把 IG6（怎么算做对）归到"交付不可信"，与 IG7 同组（01 §1）：缺了它，做错了没人拦、做对了也证明不了，这和"知道了也会做错"是两类问题。
8. **开发侧的状态与上下文组、CP4、MT2 评仓库面。** 来源里 ST1、ST2、CP4、ST3、MT2 的素材取自 DSH（它本身是 agent 产品），混着产品运行时的机制；本目录把它们限定为仓库自己的配置与生成物（generated artifact）、供给 coding agent 的上下文、仓库自动化、开发工具链，MT2 限定为仓库发布物的兼容承诺，产品侧对应的机制只在 RT2、RT7、RT9、RT1、RT3 评。

同时保留了来源材料的自我限定，没有把它们升级成承诺：可读 ≠ 简单、流程文档 ≠ 强制执行、清理 ≠ 事务回滚、可查询 ≠ 安全沙箱。

---

## 维护规则

**一个事实一个家。** 改动时按这张表找 owner，不要在另一份里复制一份：

| 要改的东西 | 改哪一份 |
|---|---|
| 开发 Harness 的维度集合、信息缺口（information gap）、证据级（evidence level）、切片（slice）、通用两轴（two axes）、成熟度档（maturity level）与达标线（pass line）、适用性（applicability）裁剪（tailoring）、产出模板、验收 | `01` |
| 开发 Harness 每维的一句话定义、锚点阶梯（anchor ladder）、探针（probe）、封顶规则（cap rules）、伪证（false evidence）与走形（degradation）、第三层反证（falsification） | `02` |
| 运行时 Harness 的适用性（applicability）三问、维度集合、五个活体实验（live experiment）、通用两轴（two axes）、成熟度档（maturity level）与达标线（pass line）、形态裁剪（profile tailoring）、模仿判断、产出模板、验收 | `11` |
| 运行时 Harness 每维的一句话定义、锚点阶梯（anchor ladder）、探针（probe）、封顶规则（cap rules）、伪证（false evidence）与走形（degradation）、第三层反证（falsification） | `12` |
| 处置手法、排序原则（ordering principles；含原则六）、边界与反模式、形态重解释、收工线（stop line） | `20` |
| 来源说明、目录职责 | 本页 |

**粗粒度（coarse-grained）稳定、细粒度（fine-grained）增补。** 新增探针（probe）、新增封顶（cap）、改某一维的定义或锚点（anchor）只改 `02` / `12`；只有增删维度、改通用两轴（two axes）、成熟度档（maturity level）、适用性（applicability）或形态裁剪（profile tailoring）时才动 `01` / `11`。粗粒度（coarse-grained）与细粒度（fine-grained）之间只允许**名字 + 一行概述**的重复（为了各自可独立阅读），不允许复制整段。

**封顶规则（cap rules）与锚点阶梯（anchor ladder）同步。** 02/12 的封顶（cap）是命中即生效的上限：多数条目是锚点阶梯（anchor ladder）判据的可观察版本，少数比阶梯更严，没有一条比阶梯宽松；锚点（anchor）的约束力（enforcement） 3 一律包含"被证明会失败"的通用条件（见 02 §2、12 §2）。因此改动某一维的锚点阶梯（anchor ladder）时，必须同时检查该维的封顶规则（cap rules）要不要增删改，并在评估者验收里指出**观察它的探针（probe）**（见 01 §7 第 5 条、02 §1 第 4 步）——只改阶梯不改封顶（cap），就可能出现比阶梯更宽松的上限。

### 校验

本目录**不在**仓库结构门禁（gate）的扫描范围内（`scripts/verify-md-links.ts` 的 `PATTERNS` 不含 `_misc/**`），所以改完要自己跑一遍（在任意目录下运行都可以）：

```sh
node _misc/_eval_harness/_audit.mjs
```

[`_audit.mjs`](./_audit.mjs)（退出码非零即有性质被破坏）把这些必须保持为真的性质一次性核对完：**结构与计数**——细粒度（fine-grained）两份的维度数与栏目、每维探针（probe）行数、封顶（cap）正文↔附录（开发 88 条 / 运行时 66 条）、本页写的探针（probe）范围与封顶（cap）条数、附录按维度连续分组、处置卡（remediation card）集合 = 维度集合与栏位、两份伪证（false evidence）清单条数、例证段数量；**引用自洽**——相对链接与锚点（anchor）、小节编号连续、目录↔正文、文内「第 N 节」、跨文档小节引用、附录引用、维度编号与名称对应；**格式与约定**——表列数一致、外链恰一处、代码块内无 Markdown 链接、直引号、token 前缀白名单、旧 token 残留、粗粒度（coarse-grained）不含探针（probe）、封顶（cap）段与封顶（cap）箭头、粗细两份之间无整行复制、无连续分隔线、结尾换行、行尾空白。**它只保证这些机械性质；封顶（cap）是否与阶梯一致、探针（probe）能不能观察、档位判据是否自洽，仍需人工复核。**

本目录七个文件：六份文档 + 本脚本。

改完本页的任一断言前，先回到它引用的来源文件确认——本页的价值全在**它是真的**。
