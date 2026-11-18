# 语料维护账本（非 upstream 驱动）

这个目录页记录 `_digested/` **自身的维护轮次**：读者反馈驱动的重写、redesign 波次、门禁新增。它按轮追加，只说明这轮改了什么、为什么；机制页本身永远只写当前态。

与 [`../_change_log/00-index.md`](./00-index.md) 的分工：**那边只收产品源码同步**（upstream release tag 对齐、跨度审计与修复）；语料自身的重组与重写记在这里。两边都不进 `catalog.json` 的核验矩阵。

> 核验基线：[`../catalog.json`](../catalog.json) 的 `baseline`（唯一声明处）。各轮引用的行号与计数以该轮执行时的树为准；正文不复制基线。

---

## M12 · 2026-11-18 · 全仓源码核验纠偏 + SVG 几何重绘 + 漏扫专题收口 + 门禁硬化

**性质**：对 M1–M11 后的 `_digested/` 做全仓逐专题源码核对、图表几何审查与门禁补盲（严格限于 `_digested/`）。

1. **P0 源码事实纠偏与页内破损修复**：
   - `capability-seams/04`、`00-map`、`three-roles.svg` / `roles-split.svg`：修正 `TypertRemoteService` Host Remote 控制面（`ctx.<key>`、Scoped Remote `request.agent` 校验、`apply` 挂载入口与 `ctx.directoryPickerController`），样本包改用 `dsh-user-approval`（`dsh-llm` 为注册表形态 Definition）。
   - `plugin-system/composition/03`、`04`、`00-map`：修正 HMR 刷新走 `hmr.reconcileProfile()` → `recomposeProfile()`（区分 `config-editor` 的 `reconcileProfilePatches`），及 `initializeProfileFromDefault` / `rejectElectronProfile` 对 `desktop` 的语义；`runtime-profiles/01-web` 修正 desktop preset 来自 `dsh-web-app` `presets/*.patch.yml` 与 `agent-preset-registry`。
   - `agent-loop/02`：修正 `RoundAttempt` 实际状态模型（`phase: 'queued' | 'claimed' | 'admitted'` + 正交布尔字段）与 host pause 竞态栅栏精确条件；`harness-idea/04` 清除 H1 前残留引用碎片。
   - `tools-prompt-llm/`（01–06 + map + `chunk-to-message.svg`）：修正 PTC deferred image 的 `source: { kind: 'ptc-mode' }`、工具增删无条件写 `developer/message`、`Schemastery` 配置校验、`complete: true` 位于 `assemble()` 及 `request-pricing.ts` 常量；完成 `02`（工具管道/审批/timeout）与 `05`（chunk 到 settlement）拆分迁页并重写 `03` 为当前态。
   - `surfaces-entrypoints/03`：修正 `packages/bundle/web-app/cordis.patch.yml` 的 desktop 条件行数（3 处）并解除引文误绑。
2. **SVG 几何修复与图更新**（11 张，全量 SVG 几何检查 0 问题）：修复文字越界、箭头穿字、双栏碰撞与节点裁切（`class-map.svg`、`gaps-register.svg`、`two-axes-lifecycle.svg`、`flat-tree-load.svg`、`canon-loop.svg`、`initiator-boundary.svg`、`loading-paths.svg`、`team-anatomy.svg`、`six-layers.svg` 补入 `桌面`、`chunk-to-message.svg` 剥离无关工具线）；按 L0–L12 依赖主干重绘 `_digested/figures/topics.svg`。
3. **跨专题清理与漏扫收口**：
   - `system-overview/00-map` / `01`：将 `experimental/webhook` 剥离 7 包核心主干列表；清除 `01` 中 `#3087/#3325/#2948` 与跨度增量叙事并补齐 `## 源码入口`；`surfaces-entrypoints/00-map`、`agent-loop/00-map` 与 `two-tree-runtime/*` map 清零仓库 `:line` 钉死（全语料 `00-map.md` `:line` 钉死归 0）。
   - `two-tree-runtime/`、`plugin-system/`、`session-and-loop/`、`agent-loop/`：清除残留 `NEW/OLD`、`applyQueue 已删除`、重复节、过时版本/跨度注记。
   - 深扫 `test-strategy/`、`development-flow/`、`harness-idea/`：修正 `(HMR safety)` 实测计数（`67` → `72`）、补全 `docs/testing.md` 行数指针、`development-flow/00-map`（`十个问题，九篇入口`）与 `06`（`六条缺口`）、`08-reliability` 与 `07-naming-and-house-style` 引文漂移、`harness-idea/02` 的 `notes/README.md` `only-for` 口径，清除未标历史的轮次/commit/外部本地路径残留。
   - `experimental/` & `delegation-and-orchestration/`：修正 `experimental/04` 对 `isReleaseMemberDirectory` 与 `checkExperimentalDependencyIsolation` 的阐释并补 `## 源码入口`；`experimental/02` 补 `wait_agent` 的 `noProgress` 短路与 JSON UTF-8 字节预算；`delegation-primitives/06` 替换虚构 `POLICY` 符号为 `teamPolicy` / `team:policy` 并校对行号。
4. **文档治理与 `verify.mjs` 硬化**：
   - 协调 `REDESIGN.md`（L0–L12、Wave 1–6、187 页、`00-index` 对齐）并修正 `canon/GLOSSARY.md:31` 为 `**原文**`。
   - `verify.mjs` 硬化：`checkCanonQuotes` 对齐 `**原文**` 范围而不误拦纯中译 `**译**`；`checkMapLinks` 改为强制 Markdown 链接语法；`checkBaselineDeclarations` 增拦 `<sha> 基线` / `NEW 基线` / `当前 0.2.x-rc.x`；新增 `checkCorpusHygiene` 强制 `00-map.md` 无 `:line`、无 `~~`、无 `NEW/OLD`、无维护轮次叙事、SVG `<text>` 无 `**...**`。9 组变异自测均按预期报红、还原后全绿；`catalog.json` 仅为本轮逐行对过源码的 16 页更新 `reverified`（其余保留 `carried`）。

---

## M11 · 2026-11-18 · 抽查三专题 + 基线声明门禁扩展

**性质**：补齐 M9/M10 之后剩余的三处「只抽查未深挖」专题（development-flow / test-strategy / harness-idea），并按宪章 §2 加一道机器检查。

1. **harness-idea 的 31 处页级基线声明**：正文引文的核验标记原写「基线 `687f282e86…`」——这正是宪章 §2 禁止的形式（「基线」一词保留给 `catalog.json` 的唯一声明）。全部改为「当时核验 `687f…`」，00-map 的解释句同步改写并点明「不是当前基线」。
2. **门禁扩展**：`checkBaselineDeclarations` 除原有的 `产品源码基线：` / `专题基线：` 两种形状，新增「提交号被当作基线陈述」（`基线 <sha>`）——这使「引文取证点」与「当前基线」在机器层面不再混淆。**变异自测**：把一处「当时核验」改回「基线」，门禁报 `a commit id is presented as a baseline`；还原后绿。
3. **三专题解剖核对**：development-flow（8 节 + 1 图）、test-strategy（7 节 + 1 图）、harness-idea（10 节 + 1 图）均有「一句话 → 概念 → 导航 → 边界」骨架，符合统一解剖；未做整页重写（它们已是 Tier A，两轮走查也未在其中报出断点）。
4. **00-index 收尾**：`## 分支纪律`（分支表 + 同步口径）从阅读路径之前移入文末「维护须知」；读者路径现在依次是 30 秒看懂 → 与同级目录的关系 → 子目录 → 术语速查 → 阅读路径 → 概念依赖主干 → 按任务找 → 验证。

**验证**：verify.mjs 全绿（216 md / 140 svg / 187 页）；基线门禁变异测试通过；页级基线声明 0 处。

---

## M10 · 2026-11-18 · 验证性复读收口

**性质**：M9 的收尾。第二个只读子代理逐项复核 M9 报出的 7 处矛盾与 5 项 top fix，判定 9 项 CLOSED、4 项未闭合，本轮全部关闭：

1. **C1**（`tools/*` 计数）：`tools-prompt-llm/00-map.md` 的 `:5` 与 `:78` 仍按「三条」——改为四条的完整表述（三条在调用管道上 + `ptc-dispatch-log` 观察 PTC 子调度 + `tools/result` 是同步通知）。全语料「四条 tools」4 处、「三条 tools」0 处。
2. **C4**（realm 限定）：`capability-seams/00-map.md` 承重不变量第 2 条重述时丢了 realm 限定，与同页正文冲突——补回。
3. **C7c**（`55 行`）：`test-strategy/00-map.md:25` 仍写「55 行政策」且 `03-asset-census` 并无该数——删数字，改「政策本身说了什么」。
4. **E2**（GLOSSARY 读法）：`GLOSSARY.md:3` 的「五分钟读法」仍只扫两组，与 canon/00-map 的「三节都扫」不一致——改三节并说明第三组为什么必须首读。
5. 附注项：`agent-loop`「**创建** Goal 的四条路径」标题与第三行「不创建，只延续」措辞冲突——改「**产生** Goal 的四条路径」。

**最终验收**：
- `node _digested/render-indexes.mjs && node _digested/verify.mjs` → 全绿（216 md / 140 svg / 187 页 / 26 专题 / 13 claims + 14 指标）。
- **引文门禁未被削弱**：变异自测——把 GLOSSARY 一条 `原文` 的一个词改掉，`checkCanonQuotes` 报 `not verbatim` 并阻止通过；还原后恢复绿。
- **改动范围**：117 个文件，其中 114 在 `_digested/`；另外 3 个是 `_faq_on_digested` / `_dsh_plugin_agent_ready_development` / `_misc` 的 `CORPUS-CHARTER.md` 副本——宪章 §5 要求四份逐字一致，`checkCharterCopies` 校验通过。
- **产品源码零改动**（`git status` 无 `packages/`、`apps/`、`docs/`、`scripts/` 变更）。

---

## M9 · 2026-11-18 · Wave 6：首次读者走查 + 七处矛盾修复 + Cordis 入门

**性质**：[`../REDESIGN.md`](../REDESIGN.md) 完成判据 (3) 的执行。方法：一个只读子代理扮演「熟 harness、不熟 DSH」的读者，只读 15 个 map 页（L0–L12 路径），逐站报「能否建立正确心智模型」。报告给出 4 个「否」、7 处跨文件矛盾、15 个首次使用无定义的词。本轮逐条处置。

1. **七处矛盾按源码裁定并修复**：
   - `tools/*` 计数：**四条 waterfall**（`pre-execute` / `execute` / `post-execute` 在调用管道上，`ptc-dispatch-log` 观察 PTC 子调度），`tools/result` 是同步通知不是 waterfall。四份权威交叉核对（`packages/core/tools/src/index.ts:191`、`:365`、`docs/tool-execution-pipeline.md:6` 的「three waterfalls」指的是调用管道、`_change_log/0007` 记录的当年修订）——四页统一为「四条 + 明确各自归属」。**教训**：本轮最初误改成「三条」，被 0007 的历史记录纠正。
   - `step` 与 attempt 的关系：GLOSSARY 补「一次逻辑请求周期，重试在同一 step 内表现为多次 attempt」。
   - `scope`「扁平两层」歧义：改为「**归属**扁平（全局 / 一个 scope key），**查找**沿 parent chain 走」——两者都保留，明确区分。
   - 一个 `ctx.<key>` 多实例：capability-seams 补「**每个 isolate realm 内**只有一个实现」，并解释 preset 用 realm 隔离。
   - profile 住不住 `$DSH_HOME`：GLOSSARY 区分 launcher profile（home 发现）与应用自有 profile（同路径、`loadProfileDirectory` 直装、CLI 不可达）。
   - Remote 在不在 `ctx` 上：改为「没有 **Host 侧** `ctx.<key>`」；Client 侧的 `ctx.remote.<ns>` 是另一回事。
   - 同文件计数：agent-loop「三种创建路径」改四条；runtime-profiles 的「五个 base-backed」算式重写（launcher 五 vs base-backed 五，两端差异说明）；test-strategy 删「55 行」与「本页不复制数字」的自相矛盾。
2. **头号断点：Cordis 五个词**。`system-overview/00-map.md` 新增开篇「先修：Cordis 的五个词」表（ctx / Service / Fiber / effect / Loader）＋三条推论，并回链 framework/01 与 composition。canon 的三组词入口加一句「若还不熟 ctx/Service/Fiber 先看那张表」。
3. **GLOSSARY 读法自指修复**：canon 首读路径从「扫两节」改为「**三节都扫**」，并说明第三组是每天都会用到的词；补一句「不要留到查词时」。
4. **十个承重词补首次使用定义**（8–15 字同位语）：`isolate` realm、PTC、driver activity、claim（认领）、五原语显式列举、Activation、七层、settlement/attempt 引用 05。
6. **六层在正文里点名**：`system-overview` 原来只在 SVG 里画了六层、正文只提第 2/4/5 层，读者无法复述；改为正文表格逐层点名（Cordis 基座 / 组合 / 产品主干服务 / 能力 seam / turn loop / 入口与投影）。
5. **读者入口与维护入口分开**：`00-index.md` 开头 1,326 字符的维护 blockquote（分支/同步/本地补丁/`_misc`）下移为文末「维护须知」，开头只留一行「改之前读宪章 + 基线看 catalog」。

**M9 续**：最后三处轮次注记清零（`system-overview/03` 的「0009 跨度新增」与「0008 跨度内的扩充面」、`composition/04` 的「0.1.7 线起」、`inventory/05` 的「0.2.1 线把 X 整包解散」→ 均为当前态表述）。

**验证**：verify.mjs 全绿（216 md / 140 svg / 187 页）。**全语料口径**：删除线 0、非证据性轮次注记 0、孤儿页 0，共改动 116 个文件。

---

## M8 · 2026-11-18 · Wave 5 起步：全语料删除线归零 + 00-index 概念依赖主干

**性质**：[`../REDESIGN.md`](../REDESIGN.md) Wave 5 的开头部分（D2 sweep 收口、阅读路径改写）。

1. **全语料删除线归零**（D2 完成标志）：最后一处 `harness-idea/05` 的 `cordis_inspect_self` 退役删除线改写为**负知识**陈述（「没有一次调用列出全部…的单一 inspect 工具」），符合该专题自己的负知识体例；其余专题此前各轮已清。核验：`grep -rl '~~'` 在 `_change_log`/`_coverage` 之外为 0。
2. **残留轮次注记清扫**（5 个文件）：`inventory/03` 的「0.2.1 线新增」×2 与「上一轮 0009 复核为 15/33」派生比率对比（改为可替换率的定义 + 逐行表为准）；`system-overview/01` 的「0.1.7 线起机制是」「原名 agent-presets，0.1.7 线改名」「本跨度又加上」；`composition/02` 的「0.1.7 线新增」「0.1.7 线起 shipped preset root 机制退役…只适用于 0.1.5 线」。`delegation-primitives/03` 与 `agent-loop/02` 的「上一轮」经判定指迭代轮次（假阳性），保留。harness-idea 的轮次注记是**判断的证据锚点**，按宪章 §2 保留不动。
3. **00-index 阅读路径改写为概念依赖主干**（L0–L12 十二步表）：每步给「读哪个 map」+「读完之后你应该能回答什么」，取代原来按目录顺序的 `text` 框图；三个导航节明确分工（按问题找 / 第一次通读的主干 / 按任务找），消除三节重叠。

**验证**：verify.mjs 全绿（216 md / 138 svg / 187 页）；删除线残量 0；轮次注记残量 0（非证据锚点）。

**M8 续**：新增两张概念图补审计排出的图缺口——`tools-prompt-llm/figures/in-history-vs-replace.svg`（全专题最易混的按能力分路，含「判据只一条」结论）与 `plugin-system/figures/three-axes.svg`（父 map 三轴 + 三条跨轴不变量）。REDESIGN 的 L0–L12 阶梯与 00-index 的「第一次通读」表对齐（canon 进 L0），并加双向同步提醒。

---

## M7 · 2026-11-18 · Wave 2 收尾 + Wave 3：two-tree、experimental、canon 去重

**性质**：[`../REDESIGN.md`](../REDESIGN.md) Wave 2 的 two-tree-runtime 三个子专题、Wave 3 的 experimental 与 canon 收口。

1. **two-tree-runtime 全专题去噪**（framework / client / remote 三子树共 14 个文件）：framework/03 的事务重载 strikethrough 段改当前态；framework/04 删 vendor 版本史链（4.0.2→4.0.3→4.0.4→4.0.5 四个 SHA）、「0008/0011 跨度新增哪几条本地修改」账目、双核对规则的轮次框架，改为「逐条清单 + 变化账目归 `_change_log/`」；framework/00-map 的 24 条本地修改变化 blockquote 压成三行；client 六处「0009 起新增/0009 新增」改当前态；remote 四处删除线（`__DSH_TRANSPORT__` 旧传输）、「上行帧（0.1.7 线新增）」、「28 条事件白名单 + 逐跨度新增清单」、「26 个贡献（按 rc.5 实测）+ 逐轮新增」——分别改当前措辞、单家链接、claims 指标引用。残噪 grep 归零。
2. **experimental 新增 `04-实验合同与隔离.md`**（审计：政策常量没有编号页可下沉）：命名与发布政策（前缀、保留旧名 11 项例外、private 名单为空 ⇒ 全组 public）、三道隔离检查（目录正则 / 默认组合隔离 / 落点核验）、反向的产品用途检查、以及「这套隔离不意味着什么」三条。00-map 的两段政策墙压成一句 + 链接，删 `ctx.invariants` 退役句，阅读路径补 04。catalog 登记（187 页）。
3. **experimental/02 补启动场景**（审计 P1：新人从不知道 Team 跑起来什么样）：新增「跑起来是什么样」六步（建队→建任务→派工→推进→等待→收尾）+ 边界三条（ready≠完成、wait 只报超时、中断不释放任务）。01 的页名注记去掉轮次框架。
4. **canon 02/10 去重**（审计 P0：canon 违反自己的判断 2）：两条逐字重复引文各留一个家——「破坏性改动当场记」的引文归 10-process（02 改为不带引文的指针），「模型可见⟺已记录」的引文归 02（10 改为指针）。02 的角色从「为什么长这样」的最短答案**收回为写作判据**，写明遴选判据三条（原文出自三份权威、约束别人怎么描述 DSH、违反会产生可指认错误），删「所有机制页规则都能追溯到其中一条」的过度断言；00-map 首读路径不再把 02 当入门第三步（改指向 system-overview）。
5. **GLOSSARY 三处释义修复**：storage domain 补 hub/后端/data form 三层分工（原 gloss「插件状态的原生落点」接不上引文）；scope 解释扁平两层的具体含义 + 链 session 机制；keyless 拆掉论文墙、链 test-strategy。

**验证**：verify.mjs 全绿（216 md / 138 svg / 187 页）；two-tree 残噪 grep 归零；canon 引文逐字门禁保持绿。

---

## M6 · 2026-11-18 · Wave 2：tools-prompt-llm 与 surfaces 全量手术

**性质**：[`../REDESIGN.md`](../REDESIGN.md) Wave 2 的 tools-prompt-llm 与 surfaces-entrypoints 两专题；two-tree-runtime 三个子专题留下轮。

1. **tools/02 就地去重并更名**（不再承担 settlement/图像）：标题改「工具管道、审批与 timeout」；settlement 六步序列、ReplayEnvelope、max-tokens 截断、token-meter 合同**迁入 05**（05 成为 settlement 完整家并补 step() 结算序列）；图像序列化、encoding ladder、PTC defer **迁入 06**；02 留 3 行指针。catalog 标题与 map 行同步。
2. **tools/05 去历史前置**：「旧表示被推翻」节改为当前合同（一次 attempt 一条 settlement）；「534 行行数未变」维护噪声删；耐久性代价去 v1/v2 对照；格式迁移段（写者版本数、六个包、v2→v3/v3→v4 内容）改为单句链接 session-and-loop/04（家已归 04）。
3. **tools/06 改当前态并收编**：「超预算处置在 0.2.0 线反转」反转叙事改为五条当前合同（预算/超预算/Files API/编码阶梯/PTC defer）；「新旧对比里最容易写反」reviewer 注记删。
4. **tools/01/03/04 变更叙述清理**：「0.2.1 线新增」「这次搬迁 3→4→5」计数史、「EpochHeader 不再有 system」「change 的含义变了」等改当前态直陈；「0012 起」「0.2.0 线迁到」全清。
5. **surfaces**：02 的「沿用上一轮的页面记录」轮次注记、`assistant/chunk` 死词汇（页内自相矛盾）、钉死的 SDK 版本号、SESSION_FORMAT_VERSION 手抄——分别改为请求面枚举、当前措辞、package.json 链接、04 单家链接；03 的三段删除线 OLD 块（extraResources 旧布局、七行 overlay、fd3/fd4 分帧管道）与「0.1.7 线重构」历史前置全部删除，改当前态直陈；map 的三处删除线/退役注记同步清理；「0009 起」×3 清零。
6. **正面资产保留**：02 的「保证 / 故意不保证 / 对照表」三段式、03 的「三个否定」表与认证链、01↔runtime-profiles 双向单点委托均未动。

**验证**：verify.mjs 全绿（215 md / 138 svg / 186 页）；tools 专题 change-narration grep 归零（0.1.7/0.2.0/0.2.1 线、0009/0012 起、删除线均无残留）。

---

## M5 · 2026-11-18 · Wave 1 收尾 + Wave 2 起步

**性质**：[`../REDESIGN.md`](../REDESIGN.md) Wave 1 残留项清零，tools-prompt-llm map 先行。

1. **agent-loop/02**：「你感受到的…效果超级好」Q&A 残留改当前态；ASCII 树前加**四段散文摘要**（触发→校验→注入→结算）并首次显式定义 **attempt 预约状态机**（queued/claimed/stale/cancelled，与 session 侧 `assistant/attempt` 同名不同义消歧）。
2. **agent-loop/04**：从「旧基线/新基线」差分改写为当前态——「为什么没有 ctx.agent」保留设计对比但去历史框架；新增 initiator-boundary.svg（边界内/边界外两栏 + host/model pause 判据）；「本跨度未改」等账目句删除。
3. **capability-seams/04 瘦身**（76→59 行）：Schedule 机制砍到论点+链接（平台合同归 delegation-primitives/05、挂载行归 runtime/01）；feedback/telemetry 段压缩为 3 行；26 项 Remote 清单改链 `client/index.ts` 并保留「贡献数≠namespace 数」教学点；fileUploads 的升级判据升成正文决策规则（何时 core→seam）。
4. **system-overview/01**：删除线退役句改当前态并链 capability-seams/04。
5. **canon/GLOSSARY 补承重词**（全部逐字引文，过引文门禁）：surface（五类进投影的事件）、followup/steer/inject（三入口别名）、initiator（因果归属，非授权）、goal activation（phase 持久 / activation 进程内的两轴）。attempt 消歧放 agent-loop/02（repo 无词表原文，不入 GLOSSARY）。
6. **tools-prompt-llm/00-map**（Wave 2 首项）：机制墙（scope 豁免行号、图像管线全段、encoding ladder 引文块、pi-ai 配置三段带行号）压缩为概念+链接（图像归 06、替换分路归 04）；**工具管道按权威文档补全** monotonic guards 与 projectContent/finalizeContent 两段（原 home 漏、借用方反而全的问题）；补「按问题找」导航与先修概念链接。

**验证**：verify.mjs 全绿（215 md / 138 svg / 186 页；新增 initiator-boundary.svg 渲染通过；GLOSSARY 新引文过逐字门禁）。

---

## M4 · 2026-11-18 · Wave 1 右半：session-and-loop、agent-loop、capability-seams 分类统一

**性质**：[`../REDESIGN.md`](../REDESIGN.md) Wave 1 右半执行（04 旧新差分重写、02 摘要与泳道图、04 瘦身、GLOSSARY 承重词、system-overview 精修留下一轮）。

1. **session-and-loop**：map 拆机制墙（:39 五机制单段 → 三条不变量；SQLite 删除史 blockquote → 当前态一句；「Projection 必须化」→「Projection 注册表」当前态三合同）；**surface 补散文定义**（本专题第一承重词，原先全专题无一句定义）；补「按问题找」（含 agent-loop 前向链，原先零链接）。01：品牌分型/ignorable 考证/v4 框架去史，版本节（bump/读方向/世代不可变）整段归 04（01 更名「SessionEventMap 与 required-on-read」）；04 吸收 JSONL-only 与 seedLength 约束、删「本跨度」账目与手抄 8 文件名（改链生成目录）。02：核验入口去搬迁史，「两个队列三种入口」概念前置（buildCell 细节与 cell 定义后置成「折叠细节」），invariant 讣告删。03：invariant 讣告删、projection 改当前态合同、读意图段去 PR/hash 框架。
2. **agent-loop**：map（122→94 行）去 Q&A 残留（「你的核心问题/你看到的效果」）、description 引文下沉 01、ASCII 状态机改嵌 goal-state-machine.svg、ASCII 代码栈压成四行分层（事件族归 session 链接）、invariant 讣告换「症状 → 页」表；01 的 Q&A vantage 全清（标题「三种路径」→「四条路径」与 map 对齐，补路径四 Host Remote）；03 删 OLD 基线 git show 取证句与旧事件名注记。
3. **capability-seams 分类统一**（审计 P1）：判定程序（两问：有无第二实现？按能力合同还是通信协议切？）升入 00-map 正文，四形状表与 shapes.svg 同构（seam 含注册位变体 / core 可带适配器 / Remote / 刻意的进程级库）；01 的第三套三分（spine/bundle 组合点，未定义词）改用统一判定程序；04「为什么这很重要」措辞对齐。02 补「失败种类 → 结算 → 模型可见」表（兑现引子承诺）。00-map 补五条承重不变量与「症状 → 页」；「唯一的能力接口」改为「唯一可注入的能力接口」+ 事件面一句（与 framework 不再矛盾）。
4. **00-index**：阅读路径与推荐主干补 agent-loop 入口（goal 机制之家原先几乎不可达）。lifecycle/08 的「见 09 行」歧义引用（现与 class 页撞号）改「本页该节」。

**验证**：verify.mjs 全绿（215 md / 137 svg / 186 页，本波未新增图）。

---

## M3 · 2026-11-18 · Wave 1 左半：组合/家裁定 + runtime-profiles 与 composition 重建

**性质**：[`../REDESIGN.md`](../REDESIGN.md) Wave 1 的左半执行（system-overview 精修与 session-and-loop / agent-loop / capability-seams 分类统一留 Wave 1 右半）。

1. **层叠单家裁定落地**（审计 D4 头号项）：宪章 §6（四份副本同步改）拆为「组合层叠算法与 patch 语义 → plugin-system/composition」「per-profile 组合事实、PROFILE_TEMPLATES、各 profile 差异 → runtime-profiles」。据此去重：bundle 层叠栈 4 副本收敛（composition map 保留顺序+两规则，算法实现链 framework/03；runtime map 保留模板清单）；PROFILE_TEMPLATES 3 处行号副本收敛为 runtime map 单家（composition map、composition/04、surfaces map 改链接）；#3382 双开事实收敛到 runtime/01（composition map 删）；HMR 机制 3 份收敛到 composition/03（runtime map 留 per-profile 矩阵、runtime/01 与 runtime/06 改链接）；desktop 退役 OLD 块删除（runtime/06 改当前态「差异只有安装锚点一处活」）。
2. **runtime-profiles/00-map 重写**（161 行 → 概念先行版）：删历史背景块、离题 settle-notice 句、函数链行号墙、插件名枚举（下沉 01/04/06）；两个「五个」显式消歧；新增 loading-paths.svg（launcher vs 应用自有双装载路径）；链 two-tree desktop-shape.svg；补按问题找导航。01-web 的 91 行手抄目录降级为四层概念+带注释关键行（177→112 行），删 25/6/59/91 计数与待判项引用；04 删 invariant 讣告、硬计数改快照引用、维护者措辞改读者措辞；06 删两段删除线退役与「分歧已消除」信念修正史（改当前态一节）、122 行计数、依据 note 标注失实。
3. **composition/00-map 重写**（参考墙 → 概念地图）：patch 规则保留为两行概念+链接；preset 段落加 cordis↔Creator 桥接（术语断裂修复，locales.ts 已核）；PTC 差异去轮次框架；env 分层下沉 01；OPTIONAL/ON_DEMAND 清单改链接；补先修概念（framework）、按问题找导航；源码入口删删除线行。01-boot 删 healProfilesModuleFallback 删除线与 0.1.5 线保留段；03 的「0.1.7 线机制换代」节改「机制形状」+ 链 0008（换代史归 change_log）；04 删 patchReload 删除线、rc.1/0009 轮次注记、positional 直通的反转叙事；05 的层序反向引用重定向。
4. **canon/GLOSSARY** preset 行补 cordis↔Creator 桥接。

**验证**：verify.mjs 全绿（215 md / 137 svg / 186 页）；charter 四副本哈希一致（verify 内建）；loading-paths.svg 渲染通过。

---

## M2 · 2026-11-18 · redesign Pass A + class 独立页 + 账本分家

**性质**：[`../REDESIGN.md`](../REDESIGN.md) 执行的一部分（Pass A 事实修正 + development-flow 补页），外加本轮用户指出的一处结构修正。

1. **P0 事实修正**（四路审计裁定，逐条对源码复核）：
   - `capability-seams`：`dsh-llm` 被三处误当「一包兼多角色」样本（源码入口表、`three-roles.svg`、`roles-split.svg`）——它的 Adapter 注册点就是注册表形态的 Definition，Consumer（agent-loop、compaction-basic）在别的包。正确样本换成 `dsh-user-approval`（Definition 与实现同包）；00-map 与 01 正文同步改写并明说 llm 演示的是「注册表形态 Definition」。
   - `experimental/02-agent-teams`：删去无出处且误导的「禁止自发消息」（owner README/teamPolicy/sendMessage JSDoc 均无此措辞，peer 互发正是设计要点），改为有出处的事实（每次发送都是成员工具调用经服务发出；服务方法收 exact live calling Agent）；补 sender-framed 释义（发送者名字计入字节预算）。
   - `development-flow/00-map` 一句话的「都有机器判据」过度断言改为诚实版（形状有门禁、判断靠校准，链 06）。
   - `development-flow/01` 的 `agent-note-tree.ts:46-84` 行号钉（实际跨度 41-83，且违反本语料「文件+符号」纪律）改为符号引用。
   - `plugin-system/composition/03` 的 desktop HMR 陈旧断言（「调用侧不传 ready、不挂 watcher」）按源码改写：`runProfile` 内部无条件提供并提交 `appReady`，desktop-host 走同一条 `runProfile`，profile patch 热更行为与 web 相同（与 `runtime-profiles/06`、lifecycle map 一致）；该闸真正拦的是绕过 `runProfile` 自行挂 `hmr` 行的宿主；webworker 宿主根本不挂 hmr 行（旧句删）。
2. **development-flow 新增 09-class 页**（用户要求：class 讲清楚、单独成页、图文并茂）：
   - 找到并引入历史决定 [`2026-06-20-agent-note-classification`](../../.agents/notes/archived/process/2026-06-20-agent-note-classification.md)（已归档；现行 README 摘掉了指向它的链接）：第二轴、路径编码 vs 元数据行、refactor 否决、双门禁，原话引入。
   - 新图 `class-map.svg`：六类按「改交付源码 / 围绕代码」两栏 + 分界线 + refactor 缺席 + feature 特判 + 闭集执行。
   - 从 01 迁入 class × lifecycle 矩阵、语义强度、处置频率（01 改为指针；06 缺口二的矩阵指向同步改）。
3. **重画 `two-axes-lifecycle.svg`**（用户指出质量問題）：旧版两条转换箭头横穿中间盒子、四盒高度不齐、删除路径起点画在盒内。新版改为无交叉拓扑——主线（proposed→implemented→archived）在上，两个出口（rejected、删除）在下，全部箭头不穿盒。
4. **账本分家**（用户裁定：`_change_log/` 只收 repo/upstream 变化驱动的记录）：
   - 删除误入 `_change_log/` 的 `0016-seams-canon-sdlc-revision.md`（内容并入本页 M1）与 `0017-corpus-redesign-plan.md`（上移为语料根 [`../REDESIGN.md`](../REDESIGN.md)）；`_change_log/00-index.md` 去掉 0016 条目并写明分工。
   - `verify.mjs` 的 catalog 双射豁免加入 `REDESIGN.md`（与 `00-index.md`、`CORPUS-CHARTER.md` 同级的治理文档）。

## M1 · 2026-11-18 · 四专题「概念先行」重写（用户反馈驱动）

**范围**：`capability-seams/`（11 页 + 4 图）、`canon/`（7 页 + 1 图）、`development-flow/`（9 页 + 1 图）、`experimental/`（00-map、02-agent-teams）；触及 `00-index.md`、`catalog.json`、`_coverage/00-index.md`。基线不变（rc.5），只读产品树。

**为什么改**：用户反馈三专题读起来苦涩、夹历史噪声，读者假定为「熟 AI harness、不熟 DSH」；另问 agent-team 是否仍 experimental。

**改了什么**（要点）：各专题 map 重写为概念先行（先接旧图景再立心智模型）；机制页统一加概念引子、删同步轮次注记与删除线历史、行号引用改文件+符号；canon 修复七处引文漂移（repo 装饰变化导致 grep 不到）并新增引文逐字门禁 `checkCanonQuotes`（三种失败模式已用变异用例证明会红）；development-flow 定框为决策 SDLC 并新增 sdlc-overview 图；experimental/02 删 0008 注记、补 team:identity；00-map 写明 experimental/optional 互不蕴含（agent-team 仍是 experimental，同时以可选 bundle 出货，本地最新 tag 亦未迁出）。同期顺手修的过期读数：07「1275 篇」→1270、tree.ts 84→83 行、主题前缀 8/7/7→24/21/21（实测）。

**M2 对 M1 的修正**：四路深审认定 M1 是「新引子 + 旧正文」两层皮——去重（D4）、map 瘦身（D3）、分类统一未做，并抓出 M1 遗留/引入的事实错误（见 M2 第 1 条）。结构性欠账移交 [`../REDESIGN.md`](../REDESIGN.md) 的波次执行。
