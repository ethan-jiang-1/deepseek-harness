# `_eval` · 三份评估文档的来源与职责

本目录是把 DSH 研究语料**重写**成一套可直接使用的评估方法的结果。三份文档都不要求读者读过任何来源材料——本页只交代它们**从哪儿来、改了什么、改动时改哪一份**。

## 三份是什么

| 文件 | 评什么 | 谁用 |
|---|---|---|
| [`01-evaluate-development-harness.md`](./01-evaluate-development-harness.md) | 任何仓库的**开发 Harness**：fresh agent 能不能读懂、改对、验证、交付 | 所有人 |
| [`02-evaluate-runtime-harness.md`](./02-evaluate-runtime-harness.md) | **运行时 Harness**：仅当这个仓库本身是 agent 产品时，评它的会话、循环、工具、扩展点、多入口 | 做 harness 的人 |
| [`03-from-gaps-to-plan.md`](./03-from-gaps-to-plan.md) | 前两份产出的**缺口清单**怎样变成施工顺序 | 所有人 |

三份的关系是**诊断 → 诊断 → 处方**：01 和 02 各评一个对象（一个普通库可以 01 满分而 02 完全不适用），03 是它们共同的下游。01 与 02 自包含；03 的开发 Harness 一半（§1–§3、§5–§8）自包含，运行时一半（§4）依赖 02 的三个适用性问题与五个活体实验。互链只是"另见"。

### 本目录的处境

本目录在 `_misc/` 下：[_misc/00-index.md](../00-index.md) 的默认口径是"本目录内容不重要，除非任务明确指定不要读取"，`_misc/**` 也不在仓库结构门禁的扫描范围内（所以改完必须自己跑下面的校验）。因此这三份文档**目前不在仓库的常规入口链上**：要让人或 agent 用上，需要在根入口或 `docs/` 加一行"另见"（尚未做）。文档本身不依赖仓库路由。

有四对维度评的是同一批机制（B4↔R9、D1↔R2、D2↔R7、D3↔R1）：同时评两份时只在运行时侧计分，规则见 [03 的原则六](./03-from-gaps-to-plan.md#原则六同时评两份时同一机制只处置一次)。

---

## 原始材料从哪来

全部素材来自本仓库的两套研究语料：`_agent_ready_development/`（面向普通仓库的 SDLC 与仓库机制）与 `_faq_on_digested/`、`_digested/`（DSH 机制解读）。**没有使用任何仓库外的二手描述**，也没有使用 [`../_references/`](../_references/00-index.md) 里那些外部文章副本。

### 一、直接通读的（9 份）

| 来源 | 提供了什么 |
|---|---|
| [`_faq_on_digested/07_borrowing-harness-idea/14-two-failures-as-missing-info.md`](../../_faq_on_digested/07_borrowing-harness-idea/14-two-failures-as-missing-info.md) | **七个信息缺口**（01 的公理层）、"不赌聪明赌成本结构"的反转 |
| [`…/07/06-step-by-step-guide.md`](../../_faq_on_digested/07_borrowing-harness-idea/06-step-by-step-guide.md) | 十维评估表、Phase 2–8 的产出与验收、垂直切片走查五问 |
| [`…/07/09-executable-feedback.md`](../../_faq_on_digested/07_borrowing-harness-idea/09-executable-feedback.md) | 六层反馈表、"检查必须先被证明会失败"、学走形的检查 |
| [`…/07/10-transfer-playbook.md`](../../_faq_on_digested/07_borrowing-harness-idea/10-transfer-playbook.md) | 迁移优先级、"四个不能混淆的边界"、外置知识的维护成本表 |
| [`…/07/answer.md`](../../_faq_on_digested/07_borrowing-harness-idea/answer.md) | 三条立场、三层模型、症状 → 机制总览表 |
| [`_faq_on_digested/11_native-development-loop/answer.md`](../../_faq_on_digested/11_native-development-loop/answer.md) | **窄证据切片闭环六步**（01 的第二层）、"轻松"的三个机制来源、代价与边界 |
| [`…/11/question.md`](../../_faq_on_digested/11_native-development-loop/question.md) | 上述闭环的问题框架与范围声明 |
| [`_agent_ready_development/README.md`](../../_agent_ready_development/README.md) | 三个视角的分工与语料自身的结构纪律 |
| [`…/repo-harness/00-index.md`](../../_agent_ready_development/repo-harness/00-index.md) | 五问五答映射表、核心术语表（development harness / legibility / paved road / …） |

### 二、委托全量精读的（四路）

这四路是把整片语料读完、按"每个维度最具体的可观察检查是什么"整理回来的，是 01 新增五维与 02 全部十一维的主要依据：

| 路 | 读了什么 | 用在哪 |
|---|---|---|
| 仓库机制 | `_agent_ready_development/repo-harness/` 全 11 篇 + 三个目录的 `README`/`00-index` + `_coverage/00-corpus-maintenance.md` + `verify.mjs` | 01 的 A 组（入口链、归属、分类学）、C 组（反馈分层、负例控制）、D 组 |
| 转移章法 | `_faq_on_digested/07_borrowing-harness-idea/` 的 01–05、07–09、11–13（11 篇） | 01 全部十七维的定义与探针、03 的处置卡、四条边界 |
| 流程参考 | `_agent_ready_development/sdlc-reference/` 全 13 篇 | 01 补齐的五维：意图入口、评审与批准、发布与版本、分类学、防漂移 |
| 运行时机制 | `_digested/` 的 `agent-loop`、`capability-seams`、`composition`、`session-and-loop`、`tools-prompt-llm`、`runtime-profiles`、`surfaces`、`system` 八组 + `_faq_on_digested/08_plugin-seam-maturity`、`09_plugin-business-ladder` | **02 的全部十一维** + 02 第 5 节的模仿判断 |

### 三、只用来核对边界的

- `.rgignore`、`scripts/verify-md-links.ts`、`scripts/translation-pairing.manifest.json` —— 用来确认 `_misc/**` 不在仓库结构门禁的扫描范围内（结论：不在，所以本目录改完要自己校验，见下）。

### 四、没有用到的

诚实记录，避免误以为这里是全语料的汇总：

- [`_misc/_references/`](../_references/00-index.md) —— 外部架构分析文章副本，**一份都没读**。
- `_digested/harness-idea/`、`cordis-runtime/`、`experimental/`、`_change_log/` —— 只在第四路的转述里间接出现，没有直接进入正文。
- `_faq_on_digested/` 的其余 12 个目录（01–06、10、12–14）—— 未参与。

---

## 每份文档的哪一部分来自哪里

### 01 开发 Harness

| 部分 | 来源 |
|---|---|
| §1 七个信息缺口 G1–G7 | FAQ07/14 的缺口表（原文写作"六个缺口"但列了七行，本目录统一按七个处理） |
| §1 三条立场 | `sdlc-tutorial/00-index.md` |
| §2 证据四级 | 本目录的归纳，底子是 FAQ07/09 的"prose 没有约束力、门禁才有" |
| §3 第二层六步切片 | FAQ11/answer 的窄证据切片闭环 |
| §3 第二层五问走查 | FAQ07/06 的 Phase 1 第二步 |
| §4 A 组四维 | FAQ07 的 02 / 03 / 07 + repo-harness 08 |
| §4 B 组四维 | sdlc-reference 09 + FAQ07 的 05 / 11 / 08 |
| §4 C 组四维 | FAQ07 的 01 / 09 + sdlc-reference 的 06 / 10 |
| §4 D 组三维 | FAQ07 的 04 / 12 / 13 |
| §4 E 组两维 | FAQ07/06 的 Phase 8 + sdlc-reference 的 05 / 11 |
| §4 **两轴与封顶规则** | **本目录新增**（来源语料只有单轴三档自评，没有封顶机制） |
| §5 适用性裁剪 | **本目录新增** |
| §7 评估者自身的验收、§8 短例 | **本目录新增**（短例是构造的，非真实仓库） |

### 02 运行时 Harness

| 部分 | 来源 |
|---|---|
| §0 适用性三问、§4 形态裁剪、§7 评估者验收 | **本目录新增** |
| §2 五个活体实验 | **本目录新增**（把第四路整理出的可观察检查改写成"必须真的跑一遍"的五个实验） |
| §3 R1–R10 | `_digested/` 八组的机制清单，按"组合内核 / 会话事实 / 格式世代 / 循环边界 / 能力 seam / 扩展点 / 模型可见面 / 入口投影 / 工具执行 / 可执行治理"重分组 |
| §3 R11 客户端组装纪律 | `_digested/surfaces` + `system`（有条件适用：没有 GUI 就标 N/A） |
| §5 模仿判断 | FAQ08 的"饱和与值钱不重合""能换 ≠ 换出差异" + FAQ09 的三层价值与三条失效边界 |
| §8 短例 | 构造的 |

### 03 缺口到计划

| 部分 | 来源 |
|---|---|
| §1 排序原则 | FAQ07/10 的优先级 0–5 + FAQ07/06 的"先诊断后施工"；**原则六（两份评分卡同时适用时的去重规则）为本目录新增** |
| §2 症状 → 维度表 | FAQ07/answer 的总览表，按十七维扩充 |
| §3 十七张处置卡 | FAQ07/06 的 Phase 2–8 验收 + 各章的"从哪开始""学走形的检查" |
| §4 运行时处置卡 | 02 的十一维 + 第四路整理的边界与失败语义 |
| §6 四条边界与维护成本表 | FAQ07/10 + repo-harness 07 |
| §7 循环与停止条件、§8 短例 | **本目录新增**（短例承 01 第 8 节的构造例子） |

---

## 相比来源材料，做了什么改动

不是摘录，是重写。五处实质改动：

1. **把单轴自评换成两轴 + 封顶规则。** 来源语料是"没有 / 有但不成体系 / 像回事"三档自报；本目录拆成**覆盖面 × 约束力**，并给每一维配封顶规则（例如"任何一条规则指不出唯一 home → 覆盖面封顶 1"）。动机是：一个团队说"我们有归属"和"任何人 10 秒内指得出它"是两件事。
2. **补了五个维度。** 来源的十维里没有：意图入口、评审与批准、目录分类学、发布与版本、维护与防漂移——这五个在 `sdlc-reference/` 里有素材但没被单列。另外把散在 09 与 06 里的"负例控制"提成一维，因为它是唯一一个检验其它维度是不是真的的维度。
3. **去掉了前置依赖。** 每个术语在本页定义；来源里的 DSH 专有名词（Agent Note、paved road、capability seam 等）只在必要时作为例证出现。
4. **补了两份评分卡的合用规则。** 来源语料只讲单份评估；本目录新增 01/02 同时适用时的去重规则（原则六）、两套形态词汇的映射（01 §5 与 02 §4 的互相指引），以及 01 快诊对 C2 的高估提示。
5. **把外部引用压到一条。** 来源材料有几十条钉版 DSH 链接；本目录只在 01 的 §1 保留一条原文引文（那句"agent 更信门禁不信散文"），其余 DSH 事实改写为不带链接的"例证（可选核对）"段落。**不打开任何链接都能完成评估。**

同时保留了来源材料的自我限定，没有把它们升级成承诺：可读 ≠ 简单、流程文档 ≠ 强制执行、清理 ≠ 事务回滚、可查询 ≠ 安全沙箱。

---

## 维护规则

**一个事实一个家。** 改动时按这张表找 owner，不要在另一份里复制一份：

| 要改的东西 | 改哪一份 |
|---|---|
| 开发 Harness 的维度定义、探针、两轴锚点、封顶规则、成熟度档判据、适用性裁剪（§5） | `01` |
| 运行时 Harness 的维度定义、探针、两轴锚点、封顶规则、成熟度档判据、形态裁剪（§4）、五个活体实验（§2，含 X1–X5 定义）、模仿判断 | `02` |
| 处置手法、排序原则（含原则六去重规则）、边界与反模式、形态重解释（§5）、停止条件 | `03` |
| 01 与 02 重合的四对机制的处置归属（B4↔R9、D1↔R2、D2↔R7、D3↔R1） | `03`（原则六：只在运行时侧计分） |
| 来源说明、目录职责 | 本页 |

三份之间只允许**一行定义 + 名字**的重复（为了各自可独立阅读），不允许复制整段。跨文档链接已全部校验。

### 校验

本目录**不在**仓库结构门禁的扫描范围内（`scripts/verify-md-links.ts` 的 `PATTERNS` 不含 `_misc/**`），所以改完要自己跑一遍：

```sh
# 相对链接与锚点（GitHub slug 规则）
node - <<'EOF'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
const slug = h => h.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/ /g, '-')
const files = ['README.md','01-evaluate-development-harness.md','02-evaluate-runtime-harness.md','03-from-gaps-to-plan.md']
const anchorsOf = t => { const s = new Set()
  for (const l of t.split('\n')) { const m = /^(#{1,6})\s+(.*)$/.exec(l); if (m) s.add(slug(m[2]))
    const a = /<a id="([^"]+)"/.exec(l); if (a) s.add(a[1]) } return s }
const cache = new Map(); const get = p => { if (!cache.has(p)) cache.set(p, readFileSync(p,'utf8')); return cache.get(p) }
let bad = 0
for (const f of files) { const t = get(f), own = anchorsOf(t)
  for (const l of [...t.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1])) {
    if (/^https?:/.test(l)) continue
    const [p, frag] = l.split('#'); const target = p ? resolve(dirname(f), p) : resolve(f)
    if (!existsSync(target)) { console.log('MISSING FILE  ', f, l); bad++; continue }
    if (frag && !(target === resolve(f) ? own : anchorsOf(get(target))).has(frag)) { console.log('MISSING ANCHOR', f, l); bad++ } } }
console.log(bad ? bad + ' PROBLEMS' : 'ALL LINKS OK')
EOF

# 编码与结尾换行
for f in *.md; do file "$f"; tail -c 1 "$f" | od -c | head -1; done
```

改完本页的任一断言前，先回到它引用的来源文件确认——本页的价值全在**它是真的**。
