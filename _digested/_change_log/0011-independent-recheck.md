# 0011 独立反查

**范围**：`_digested`、`_faq_on_digested`、`_dsh_plugin_agent_ready_development`、`_misc` 四个语料，对照新基线 `687f282e8625c6b8d11ff58211a90524be2e4317`（`dsh-v0.2.1-rc.2`）。
**日期**：2026-10-18。
**口径**：沿用 0008/0009 的独立反查方式——**按维度而非按目录切**，与批次吸纳（按专题切）正交，避免同一视角重复。

## 为什么要做

九个吸纳批次各自只对自己清单内的文件负责，而清单是**按「该文件是否引用了变动的产品路径」推导**的。这个推导方式有三类系统性盲区，本卷实测全部命中：

| 盲区 | 表现 | 实测规模 |
|---|---|---|
| **按数字陈述、不引用变动路径** | 文件用数字陈述某个会随同步漂移的量，却一个变动路径都不引用 | **14 个文件**，其中 **6 张 SVG** |
| **引用已整族删除的机制** | 删除是「整包/整族消失」而非「路径迁移」，不在变动路径交集里 | 引用已删 invariant 面的 39 个文件中，**12 个**不在清单内 |
| **引文本身不可溯源** | 措辞通顺、标注齐全，但那句话从不存在 | **2 条假引文** |

前两类靠扩大扫描面能防，第三类只能逐条回溯。

## 方法与读数

五个检查器，各自补 `verify.mjs` 的一处判据空隙（`verify.mjs` 查链接、锚点、SVG 结构、UTF-8、孤立页、退役术语、claims 指标，但都不查下列五项）：

| 维度 | 工具 | 反查前 | 反查后 |
|---|---|---|---|
| **D1 引用反查** | `_digested/ref-sweep.mjs` | 路径不存在 219 / 行号越界 15 / 引文漂移 28 | **27 / 5 / 0** |
| **D2 正向覆盖** | 自建（产品树新增面在语料有无落点） | 应补未补 **20** | **0** |
| **D3 硬数字残留** | 自建（旧基线数字是否仍以现行口吻出现） | **75 处 / 25 文件** | **7 处 / 3 文件**（全部判定为合法写法） |
| **D4 钉版锚点** | 自建（`#fragment` 是否解析到标题或 HTML 锚点） | — | **47 / 47 全解析** |
| **D5 文风纪律** | 自建（「一段一物理行」） | `11_native-development-loop/` 目录存量 **90 处** | **0**（检查器修正后） |

四个 `verify.mjs` 最终全部通过：

```
_digested                            passed (125 Markdown / 2 scripts / 76 SVG / 13 claims / 4 metrics)
_faq_on_digested                     passed (162 Markdown, links and anchors resolve)
_dsh_plugin_agent_ready_development  passed (35 Markdown / 2 scripts / 26 SVG)
_misc                                passed
```

## 反查的发现

下面四节里，**一、三、四是存量缺陷**（前述三类盲区各自的实例），**二是对共享事实基线的独立复算**（结论是无误）。

### 一、两条从未（或几乎从未）存在的引文

**（1）带历史标注的假引文。** `_faq_on_digested/04_root-entry-doc-design/` 的 `research.md:73` 与 `02-tier-routing-and-indexes.md:81` 引用：

> Link repository references with relative Markdown paths, never bare filenames or Agent Note numbers. `verify-md-links` rejects missing targets and dead `#fragment` anchors.

标注来源为 `` `docs/AGENTS.md:75`（基线 `46a7f68b09…`） ``。核验结果：该句在 `46a7f68b09:docs/AGENTS.md`（第 75 行为空行）、`639ed01539:docs/AGENTS.md`、现行 `docs/AGENTS.md` 中**均不存在**；在 `docs/`、`.agents/`、`packages/`、`apps/`、`scripts/` 全范围搜索 **0 命中**。现行等价条文在 `docs/AGENTS.md:77`，措辞完全不同。

危害在于标注本身：`（基线 46a7f68b09…）` 让读者推断「当年确实这么写，只是后来改了」，因而**不会去核**。

**（2）只存活 7 分钟的假引文。** `_faq_on_digested/20_agent-note-quality-bar/01-should-i-write-one.md` 把 *"Changes involving persistence, protocols, permissions… lasting-value test above"* 当**现行规则原文**引用。追查发现该句只在 `730bcc7c85` → `926534c44b` 之间存活了 **7 分钟**，在任何语料基线上都不存在。

**由此新增两条反查纪律**（已写入 [`0011`](./0011-0.2.0-rc.2-to-0.2.1-rc.2.md)）：

- **历史标注本身也要被核验**：凡带 `（基线 <commit>…）` 的引文，都要在该 commit 的树上逐字找到；找不到的，无论标注多可信，都按「引文错误」处理——改归属与措辞，而不是改行号。
- **引文的搜索面要覆盖全仓可能来源**，而不是核验者猜的那个文件。（本轮一度因只搜 `AGENTS.md` 而误判一条**正确**的引文为伪造，见下节。）

### 二、`ctx` 服务面与 seam 读数的独立复算

用 `docs/capability-seams.md` 生成表在 NEW 基线上逐行复算，与共享事实基线逐项吻合：**99 = 58 core + 35 seam + 5 service + 1 bundle**；seam 层 **35 条、P≥2 15、单 Provider 17、零 Provider 3、零 Consumer 2、可替换率 15/35 = 42.9%**；P/C 全表 35 行逐行一致。

**正向覆盖**独立印证：本跨度新增的 8 个 `ctx` 服务、3 个工具（`working_directory`、`create_worktree`、`plugin_market`）、3 个 Session 事件键（`job/registered`、`job/settled`、`working-directory/change`）、10 个搬迁包、**29 个真新增包**，语料**全部已有落点**——真新增包的零命中从 20 一路降到 **0**。中途曾判为「刻意不覆盖」的两个纯 UI 实验包（`experimental/client-ui-claude-code-mods`、`client-ui-cot-translation`）在收尾轮也由专题补上了落点。

两条独立线索互相印证：新增工具各自对应新增 `ctx` 服务、新增事件键各自对应新增 persistence ack。

### 三、一处语料自身的计数口径矛盾

`20_agent-note-quality-bar` 的 Note 计数在 `implemented` 侧排除了目录自身的 `AGENTS.md`/`CLAUDE.md`（295 → 293），但在 `archived` 侧**没有**排除 `archived/AGENTS.md`（925 而非 924）——**同一张表里两侧口径不一致**。该目录的 `reference.md` 只说了「不含 `.zh.md` 与 `.i18n.yaml`」，未提导航文件。

按语义判定：六类分项 `177+40+34+11+18+13 = 293` 本身就排除了那两个文件，且「篇」指 Note、`AGENTS.md` 是目录导航与指令文件——故正确口径是**排除目录自身的 `AGENTS.md`/`CLAUDE.md`/`README.md`**，`archived` 应为 **924**。已统一 5 处读数并把排除项写进 `reference.md` 的计数规则行。

同一张图（`states-and-classes.svg`）的四个状态框计数也仍是旧值（39/525/14/641），已按新口径改为 **42/293/8/924**，并使图内三者互洽：`42+293+8 = 343`（三状态合计）、`177+40+34+11+18+13 = 293`（六类分项 = implemented 框）。

### 四、发布状态翻转（数字没变、状态变了）

`docs/session-format-status.md` 的 `latestReleasedVersion` 已从 **3 前进到 4**（evidence tag `dsh-v0.2.0-rc.2`）。语料里凡写「V4 已定型但尚未发布／记录落后于发布」的判断，本轮起都是**真过期**。这类缺陷机器扫不出——`SESSION_FORMAT_VERSION = 4` 这个数字自 0008 起没变过。

## 残余项的逐条判定

反查不追求「检查器归零」——那会把合法的历史叙述改坏。正确判据是**每一处命中都被判定过**。

**D1 残余 27 条**：概念性占位符误报 8（`foo.md`、`….md`、`yyyy-mm-dd-topic-title.zh.md`、`implemented/architecture/2026-…-….md`）；冻结变更卷里的历史路径 4（行内代码形式，非链接）；带退役注记的历史引用 6（`packages/e2b/*`、`packages/preset/agent-presets/*`，均在文内标了退役轮次）；引文内嵌的上游相对链接 4（`cordis-primer.md`、`cordis-tutorial/index.md`，引自 `docs/architecture.md:5`，那两个链接相对 `docs/` 合法）；owner 属另一仓的路径 1（`scripts/verify.mjs`）。真实待修 **4 处**（`_coverage/00-index.md` 的 `tool-terminal`/`tool-session-query` 旧路径）已在本轮修掉。

**D3 残余 7 处 / 3 文件**：**全部判定为合法写法**，逐条如下——

| 文件 | 性质 |
|---|---|
| `_digested/_coverage/00-index.md` | 叙述里的「316 → 342」演进写法（旧值是叙述的一部分） |
| `_faq_on_digested/08_plugin-seam-maturity/answer.md` | 0008/0009 两轮的历史读数，按三态口径**必须保留** |
| `_dsh_plugin_agent_ready_development/_coverage/00-corpus-maintenance.md` | 按日期记录的历史条目（含「从 15 个变为 19 个」里的旧值） |

检查器另排除了一类噪音：**SVG/XML 元素行里的数字是坐标与尺寸**（`x="351"`、`d="M351 337"`），不是语料断言——规则改为「以 `<` 开头的元素行不参与数字匹配」后，这部分误报从 7 处降为 0。

**D5 残余 0 处**：反查中途曾报 3 处（`11_native-development-loop/developer-journey-workflow.md:158/159/162`），批次判断为「检查器把内层 info string 行误当作围栏闭合」——**该判断经复核成立**。实测该文件在 147 行开 ```markdown，156 行是**内层**的 ```javascript；检查器原按「任意 ``` 行都翻转围栏」判定，于是把内层开围栏误当闭合，使 157–162 行落入「正文」区间。按 CommonMark「**闭合围栏不能带 info string**」修正后归零。

这条与 D3、D1 的两次误判同类：**检查器报的红要先怀疑检查器**。本卷共修正自建工具六处缺陷（子串匹配过松、`Set` 去重、要求完整路径而非包名、行号区间误判、只打印前 25 条、围栏状态机），每一处都是靠「拿已知正确的样本回测」发现的。

## 本卷未覆盖

- **`scripts/verify-*` 之外的仓库级门禁未重跑**（`doc-sync`、`pnpm run build` 等）。本卷只对四个语料自身的校验器与上述五个补充检查器负责。
- **`_misc/_references/` 的正文按冻结政策未动**，只更新了基线行；其内容与当前源码的差异属**有意的历史快照**。
- **npm registry 未复测**（本机 `~/.npm` 缓存权限受限）。`_faq_on_digested/21` 的 `next: 0.2.1-rc.2` 是按本基线 `package.json` 版本推定，已在页内标注需有网环境复测。
- **`_digested/_change_log/` 的编号卷整体未改**（历史记录），仅按「冻卷里 Markdown 链接要修、行内代码历史引用保留」的判据修掉其中唯一一条坏链接。

## 结论

四个语料校验器全绿；覆盖矩阵 15 行写回 `687f282e86` 并标「已核验」；「应补未补」的新面落点为 **0**；引文漂移 **0**。

本轮真正的产出不是这些数字，而是**三条可复用的反查纪律**与五个补判据空隙的检查器——它们针对的是「按路径求交」这一推导方式本身的三类盲区，而这三类在本轮之前从未被系统性检查过。
