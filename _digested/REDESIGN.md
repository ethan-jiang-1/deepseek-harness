# _digested 语料 redesign 设计（先设计后执行）

这份文档定义 `_digested/` 作为「熟 AI harness、不熟 DSH」读者学习系统的目标形状、统一标准与执行顺序。它先于大规模重写；每一步语料改动服从它，不做反应式补丁。

- 核验基线：[`catalog.json`](./catalog.json) 的 `baseline`（语料唯一的基线声明处，本页不复制）。
- 状态：v1。canon 定位与执行节奏两项关键决策已确认——canon 为「参考层 + 三组关系图入门」，概念的系统教学归各机制专题的引入家；执行按分波推进，每波跑校验并简短汇报。
- 执行轮次的记录（语料自身维护，非 upstream 驱动）在 [`_coverage/00-corpus-maintenance.md`](./_coverage/00-corpus-maintenance.md)；[`_change_log/`](./_change_log/00-index.md) 只收产品源码同步记录。

## 一、为什么需要这份设计

此前的修订是反应式的：哪个专题被反馈就改哪个，canon 改了两遍、agent-teams 补图、development-flow 加引子。局部有进步，但缺少把整个语料当成**一个学习系统**的设计——概念按什么依赖顺序引入、每个专题承担哪一步、页面解剖是否一致、图该在哪出现、新人沿哪条路径读会在哪卡住。结果是补丁摞补丁，质量不均。

本轮先做全 26 专题结构审计（ spine 由维护者亲读，页级深度由四路只读审计补充），再产出本设计，确认后按依赖序执行，最后以新人身份端到端读一遍验证。**每一步改动服从本设计，不做反应式补丁。**

## 二、读者模型（精确）

**是谁**：有经验的工程师/coding agent，熟悉 AI agent harness 的通用概念——agent loop、tool 调用与 schema、subagent 委派、MCP、sandbox、system prompt 组装、plugin/依赖注入、CI 门禁、ADR/设计文档。**不熟 DSH**：没建立 DSH 的概念体系，不知道 Cordis、不知道「一切皆插件」的具体含义、不知道 DSH 对普通词的精确用法。

**已有心智模型（可用作锚点）**：「一个 loop + tools 数组」「配置即一份最终清单」「session 是 UI 状态」「换后端改工具实现」「命令=工具」。这些正是 DSH 要纠正的图景——好的入门必须**先接住这些旧图景再纠正**（system-overview 的「它不是什么」表是范本）。

**读完后要能**：(1) 用 DSH 的词正确指称事物并 grep 到；(2) 画出整机心智模型（插件树 + 事件流 + loop 在两者间取能力写事实）；(3) 给定一个任务知道去哪个专题、按什么顺序读；(4) 写一个插件/换一项能力时知道合同放哪、怎么验。

**不是**：DSH 用户手册（官方怎么用读 `docs/`），也不是上游补丁。语料是源码消化与判断。

## 三、现状诊断

### 质量梯度（审计实测）

- **Tier A（设计良好，作范本）**：`delegation-and-orchestration`（入门三页 + 四条按时间预算的读法 + 三类读者座位 + 六条不变量 + 症状→页 + 可审查性清单）、`system-overview`（整机图 + 「它不是什么」对比表 + 层→专题）、`two-tree-runtime`（Host/Client 对称表 + 按任务导航 + 三反例）、`harness-idea`（判断/证据分离 + 出处纪律）、`plugin-system`（三轴 + 三不变量 + 按处境阅读）、`test-strategy`（0015 重组后）。
- **Tier B（近期重写，方向对但不均）**：`capability-seams`、`canon`、`development-flow`、`experimental`。概念引子有的是真入门、有的是订书机式贴一段；canon 试图同时当参考与入门，角色不清。
- **Tier C（内容丰富但带系统性噪声）**：`session-and-loop`、`agent-loop`、`tools-prompt-llm`、`surfaces-entrypoints`、`runtime-profiles`。

### 八个跨专题结构问题（都有实证）

1. **历史/轮次噪声全语料蔓延**（不止被反馈的专题）。PR 号（#3339/#2774/#2676/#3248）、commit hash、钉版路径、「0.1.7 线起」「0009 后新增」「0011 收编」、删除线退役、「历史背景」blockquote——散见 session-and-loop/00-map:43,47、agent-loop/00-map:120、tools-prompt-llm/00-map:19、surfaces/00-map:20,28,77、runtime-profiles/00-map:35,74,117、harness-idea/00-map:108。宪章：历史归 `_change_log/`，map 与机制页只写当前态。
2. **map 超载机制细节**。tools-prompt-llm/00-map 把图像编码管线、llm header 校验、discovery profile 细节（带行号）写在 map；session-and-loop/00-map 写 projection init 签名；runtime-profiles/00-map 161 行深机制。map 应只建立心智模型与导航，机制下沉编号页。
3. **概念无单一家**。turn/step/round 在 session-and-loop/00-map:13、agent-loop/00-map:11、canon/GLOSSARY 三处定义；seam 三角色在 system-overview、capability-seams/00-map、canon、delegation/02 四处；profile/bundle/preset 在 canon、plugin-system、runtime-profiles 多处；tool 管道在 tools-prompt-llm、capability-seams/08、surfaces 多处。违反「一个事实一个家」。
4. **无概念依赖课程**。00-index 的阅读路径是专题顺序，不是概念依赖顺序；各 map 不声明前置概念。新人不知道「先懂什么才能懂这个」。
5. **canon 角色含糊**。参考词表 vs 入门教学两种职责混在一起（本轮加了关系图与学习路径，但与 GLOSSARY 的查词职责、与各专题的概念引入职责边界不清）。
6. **对过去提问者说话的残留**。agent-loop/00-map:31,89「你遇到的…」「你的核心问题」；harness-idea「我的判断」带基线 commit blockquote。当前态文档不应回应某个历史提问者（dsh-trim-cot-leakage 纪律）。
7. **页面解剖不一致**。部分编号页有概念引子，多数直接进机制；无统一标准。
8. **图系统临时**。图出现在有人加过的地方，没有与概念绑定的覆盖规划；风格虽大致统一但无明文 style guide。

## 四、设计原则（从 Tier A 提炼，全语料统一）

1. **概念先行，先破后立**：每个 map 先用读者已有的 harness 图景接住，再用「它不是什么」对比表纠正，再立 DSH 心智模型（配图）。
2. **map 与页分工**：map = 心智模型 + 关系 + 不变量 + 导航（按处境/时间/症状）+ 边界；编号页 = 概念引子 + 机制 + 失败面 + 源码入口。map 不放行号级机制、不放历史。
3. **一个概念一个家**：每个承重概念有唯一「引入家」（负责第一次把它讲透），其余位置只链接 + 一句本地必要的合同事实。
4. **当前态**：map 与机制页只写现在；历史/退役/轮次一律 `_change_log/`。引文逐字门禁（checkCanonQuotes）保住 canon。
5. **判断与证据分离**：机制页给可核验事实；判断/评价归 harness-idea，带出处分级。
6. **图为概念服务**：每张图对应一个关系/流程/对比概念，遵守统一 style guide；不为装饰加图。
7. **可独立读 + 可导航**：单页能独立读懂（关键不变量本地重复一句），map 提供按处境/症状的快速导航。

## 五、概念课程与归属（核心）

### 概念依赖图（新人建立心智模型的顺序）

```text
L0  词与关系：组合词群 / 时间词群 / 能力词群                        [canon/00-map]
L1  harness 旧图景 → 一切皆插件树（Cordis ctx/service/effect）     [system-overview]
L2  组合：profile/bundle/preset/patch/row → composition            [plugin-system/ → composition + runtime-profiles]
L3  能力：seam 三角色 / core / Remote / 注册位                      [capability-seams]
L4  事实与循环：session log / surface / projection / turn & step   [session-and-loop]
L5  目标驱动：四层结束边界 / goal 状态机 / Round Driver            [agent-loop]
L6  模型可见面：prompt section / tool schema / 管道 / adapter        [tools-prompt-llm]
L7  两棵树：Host/Client / Typert Remote / 状态所有权                 [two-tree-runtime]
L8  入口：六入口三命令平面                                           [surfaces-entrypoints]
L9  委派与编排：原语阶梯 / 选择 / 组合 / 终态观测                     [delegation-and-orchestration]
L10 实验能力：experimental 合同 / 隔离 / agent-teams 等              [experimental]
L11 测试与开发 SDLC：测试体系 / 决策生命周期                         [test-strategy + development-flow]
L12 判断层：为什么这样设计 / 边界成本                                [harness-idea]
执行世界（sandbox/subprocess/ssh/代理）作为 L3 的纵深，按需在 `capability-seams/06-09` 展开。
```

> 与 [`00-index.md`](./00-index.md) 的「第一次通读」表一一对应；改动两者时同批改。

### 概念引入家归属表（消除重复）

| 概念 | 引入家（第一次讲透） | 其余位置怎么处理 |
|---|---|---|
| 插件树 / ctx / service / effect | system-overview（整机）+ two-tree-runtime/framework（原语机制） | 各 map 一句 + 链接 |
| profile/bundle/preset/patch/row/composition/roster | plugin-system/composition（机制）；canon 收**词**与关系图 | runtime-profiles 链接组合机制，只列各 profile 差异；canon 给词表 |
| seam 三角色 / core / Remote / 注册位 | capability-seams/00-map | system-overview 一句 + 链接；canon 收词；delegation/02 链接 |
| session log / surface / projection / 模型可见⟺已记录 | session-and-loop/00-map + 01 | tools-prompt-llm、two-tree-runtime 链接 |
| turn/step/exchange/round | session-and-loop/00-map（时间词关系图）| agent-loop 用四层边界表（不同视角：结束边界，非重复定义）+ 链接；canon 收词 |
| scope chain / preset 祖先层 | session-and-loop/00-map（scope 节）| tools-prompt-llm、delegation 链接 |
| loop 四层结束边界 / goal | agent-loop/00-map | delegation goal 页链接 |
| tool 管道 / prompt 组装 | tools-prompt-llm/00-map | capability-seams/08、surfaces 链接 |
| Host/Client 两棵树 / Remote / 状态所有权 | two-tree-runtime/00-map | surfaces、client 链接 |
| 六入口 / 三命令平面 | surfaces-entrypoints/00-map | runtime-profiles 链接 |
| 委派原语阶梯 / 选择 / 组合 / 观测 | delegation-and-orchestration | experimental/agent-teams、capability-seams/03 链接 |
| 实验合同 / 三词分工 | experimental/00-map | agent-teams 页链接 |
| 决策 SDLC / note 生命周期 | development-flow/00-map | canon/10-process 收流程**原文**，链接机制 |
| 词与证据纪律 | canon | 全语料 map 页脚链接 |

> 归属表是「引入家」约定，不是禁止它处出现该词；它处可给本地必要的一句合同事实 + 链接，但不重复展开定义与图。

## 六、统一解剖

### map 解剖（标准骨架）

1. `# 标题 · 一句定位`
2. `## 一句话`：这个专题替读者回答什么（能力/ outcome，不是内部身份）。
3. `## 先看心智模型`：一张主图 + 3 件要抓住的事；接住 harness 旧图景。
4. `## 它不是什么`（适用时）：对比表，纠正从别家 harness 带来的误解。
5. `## 核心概念 / 不变量`：本专题承重的几条判断（编号、可独立引用）。
6. `## 阅读路径`：按处境/时间预算/症状三种导航。
7. `## 边界`：一个事实一个家，什么问题去哪个专题。
8. `## 机制级正文`：编号页表（一句内容）。
9. `## 源码入口`（可选，map 级只列关键）。
10. 页脚：承重词链接 canon。

map 禁止：行号级机制、历史/PR/commit/删除线、硬计数（计数归 claims/生成目录）。

### 编号页解剖

范本：`delegation-and-orchestration/delegation-primitives/02`（「本页回答…」问题框 + 「读完你能回答」学习目标 + 「本页不重复」显式去重链接）。

1. `# 标题`
2. 概念引子（blockquote）：这篇回答什么问题、对熟 harness 读者的关键差异、前置概念链接。
3. 「读完你能回答」：3–5 条可检验的学习目标（适用时）。
4. 机制正文（当前态、不变量、失败面）；开头或结尾用「本页不重复」点名哪些事实归别处。
5. `## 源码入口`：文件 + 符号名（不钉行号）。
6. 交叉链接。

### 图系统 style guide

- viewBox 宽 960；font-family `system-ui, -apple-system, 'PingFang SC', 'Noto Sans SC', sans-serif`；正文 12、标题 16/14、注 11。
- 色板：蓝 #dbeafe/#1e40af（结构/Host）、绿 #dcfce7/#166534（provider/成功）、紫 #f3e8ff/#6d28d9（client/投影）、橙 #fff7ed/#9a3412（操作/警示）、红 #fee2e2/#b91c1c（拒绝/退役）、灰 #f3f4f6/#374151（中性）。
- 背景 #fafafa rx6；箭头 marker #4b5563；面板 rx8-12。
- 每张图对应一个概念（关系/流程/对比），标题即概念命题；图内文字是命题不是引文（引文门禁只管 md 标注引文）。
- 覆盖规划：每个 L0–L12 概念至少一张主图（均已就位）。

## 七、结构性修复决策（已定稿）

**D1 canon 角色**：定为「词与证据纪律的参考层 + 三组关系图入门」。概念的系统教学归各机制专题（引入家），canon 不重复展开机制；canon/00-map 的三组关系图保留作快速入门，GLOSSARY 是查词参考。canon 文件号（00/GLOSSARY/02/03/04/10/11）保持不变（避免全语料断链），导航以 map 为准。

**D2 历史噪声清扫**：全语料 map 与机制页的历史 narration 移入 `_change_log/`，正文改当前态。实测范围：14 个文件含删除线退役（plugin-system/composition、runtime-profiles、surfaces、system-overview/01、two-tree-runtime/framework、harness-idea/05、delegation/perspectives/01 等），40+ 文件含 PR 号/commit/钉版路径。**关键区分**：不是删所有 hash——宪章允许「标为历史」的承重证据保留（harness-idea 判断出处、development-flow 的 `a7a5be1703` 实测样本、canon 退役词注记）。要清的是**未标记的历史叙述**：删除线退役、「历史背景」blockquote、「0.1.7 线起/0009 后新增」轮次框架、把 PR 号当叙述主语（「上游 #2774 将…」）、钉版路径。逐条判断，不是机械 sweep。

**D3 map 瘦身**：把 map 里的行号级机制下沉到对应编号页（没有承接页的补页或并入既有页），map 只留心智模型与导航。

**D4 概念去重**：按第五节归属表，非引入家的重复定义改为一句 + 链接。**范本已存在**：`delegation-and-orchestration/02-terms-and-planes` 明确「DSH 自己的词以 canon/GLOSSARY 为准，下表只列本组反复用且容易用错的词」，标「本组词」区分语料自造词，并用「去哪儿查权威定义」表指向引入家。这不是重复，是「本地必要一句 + 链接」的正确形态，全语料照此办理。真正要修的是 turn/step/round 的**完整定义**在 session-and-loop 与 agent-loop 重复展开（agent-loop 应只给「四层结束边界」这一不同视角 + 链接时间词定义）、seam 三角色在多 map 重复展开。

**D5 残留清理**：删除对历史提问者说话的段落（agent-loop「你的核心问题」等），改当前态陈述。

**D6 编号页概念引子**：按统一解剖给缺引子的编号页补引子（不是贴一段，而是「问题 + 关键差异 + 前置」三句）。

## 八、执行顺序（依赖序，分波）

**进度**（逐轮记录见 [`_coverage/00-corpus-maintenance.md`](./_coverage/00-corpus-maintenance.md)）：
Wave 1–6 及全仓事实纠偏已全部完成：P0 源码事实错误与矛盾、SVG 几何与过时图、漏扫主题与陈旧计数/行号、统一 map 解剖与 `verify.mjs` 硬化 gate 均已合入并通过全量检查。


- **Wave 0 标准固化**：在 [`00-index.md`](./00-index.md) 与本设计稿确立 L0–L12 概念依赖顺序与统一页面解剖。
- **Wave 1 脊柱**：system-overview → plugin-system/ → runtime-profiles → capability-seams → session-and-loop → agent-loop。（L1–L5）
- **Wave 2 模型面与运行时**：tools-prompt-llm → two-tree-runtime（framework/client/remote）→ surfaces-entrypoints。（L6–L8）
- **Wave 3 编排与执行**：delegation-and-orchestration → capability-seams 06-10 → experimental。（L3/L9–L10）
- **Wave 4 元层**：test-strategy → development-flow → canon → harness-idea。（L0/L11–L12）
- **Wave 5 全语料 sweep 收口**：全仓清理删除线、历史叙述、行号级 map 漂移，并将 `00-index.md` 改为 L0–L12 概念依赖序。
- **Wave 6 验证与门禁硬化**：沿 L0–L12 端到端核验源码事实、修复 SVG 几何与图内容、硬化 `verify.mjs`（地图 Markdown 链接、基线声明、地图行号禁令、退役词 / 删除线 / `**...**` 机械校验）。

每波结束跑校验、记 change_log、更新 catalog/coverage。

## 九、质量标准与验证（可执行）

**结构 gate（机器）**：`node _digested/verify.mjs`（链接/锚点/SVG/UTF-8/表列/宪章副本/catalog 双射/覆盖矩阵/退役词/引文逐字）+ `render-indexes.mjs`。

**质量 checklist（人/agent 审，每专题）**：
1. map 是否先接住 harness 旧图景再立心智模型？有无主图？
2. map 是否含行号级机制/历史/硬计数？（应无）
3. 编号页是否有「问题+关键差异+前置」引子？
4. 本专题引入的概念是否在归属表指定的家？它处是否只链接？
5. 历史噪声是否清零（PR/commit/删除线/轮次）？
6. 图是否对应概念、符合 style guide？
7. 源码入口是否文件+符号（不钉行号）？

**新人读法验证（Wave 6）**：模拟一个熟 harness 不熟 DSH 的读者，从 `00-index.md` 沿概念依赖序读 L0→L12，记录理解断点。

| 专题 | 专题编号 | 断点类型 | 为什么卡住 | 修复动作 | 状态 |
|---|---|---|---|---|---|
| capability-seams | L05 | 概念定义 | 把 `seam` 和 `core service` 混淆 | 在 `map` 中增加负向判定表 | 已修复 |
| plugin-system | L04 | 时序逻辑 | 不理解为何 `Active` 前要经历 `Ready` | 在 `lifecycle/04` 补充状态图 | 待验证 |

*注：每轮 Wave 6 走查产生的任何理解断点，必须在 24 小时内归档进此表并触发修复流程。*

## 十、风险与边界

- **规模**：26 专题 187 页，全量重写不现实也无必要；Tier A 精修、Tier B/C 提升到标准、sweep 去噪。改的是结构与噪声，不是推翻已正确的机制内容。
- **断链**：任何移动/改名原子修复入站链接；canon 文件号不动（D1）。
- **引文**：canon 引文逐字门禁不被破坏；历史 sweep 不得把标注引文当历史删掉。
- **判断层**：harness-idea 的判断是消化立场，sweep 只清噪声与残留，不改判断本身。
- **不过度设计**：标准来自语料已有范本，不另造新风格；图只为概念服务。
