# 02 · 字数预算与机器门禁：怎么防止入口地图慢慢烂掉？

## 一、为什么“渐进式披露”光靠写作倡议一定失效？

很多团队都提倡文档做“渐进式披露”，但落到日常 PR 里往往撑不过三个月，原因很现实：

1. **读者的前置知识没法提前测量**：同一个入口，修小 bug 的 agent 只想知道跑哪条测试命令，重构扩展点的 agent 却需要摸清整条瀑布流语义。
2. **往根文档加一行永远比找对归属层省事**：每次踩坑大家都想“干脆加进根 `AGENTS.md` 提醒所有人”，积少成多就把常驻入口塞成了大杂烩。
3. **文档与代码天然会漂移**：目录搬家、脚本改名、配置项增删后，手写索引如果没人盯就会悄悄变成假路标。

DSH 的解法是不去考核主观的“好不好懂”，而是把入口质量折算成两道硬约束：**分层容量预算**与**CI 自动校验门禁**。

---

## 二、常驻文档的字数预算与 `Relocate → Condense → Raise` 铁律

在 [`scripts/doc-budgets.manifest.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/doc-budgets.manifest.json) 里，每一份高频进入上下文的入口文档都有明确的词数上限（由 `pnpm run verify-doc-budgets` 强制执行）：

| 受控入口文档 | 当前词数上限（Manifest 口径） | 角色定位 |
|---|---:|---|
| `AGENTS.md` | 2,080 words | 全仓常驻指令内核与顶层路由表 |
| `docs/architecture.md` | 2,410 words | 改 `packages/` 必读的系统架构总图 |
| `docs/AGENTS.md` | 1,430 words | 文档分层、双语与写作规范入口 |
| `docs/testing.md` | 1,350 words | 测试分层、快照与本地校验策略 |
| `packages/README.md` | 994 words | 全仓包分组地图 |
| `packages/AGENTS.md` | 810 words | `packages/` 子树统一开发规矩 |
| `docs/cordis-primer.md` | 600 words | Cordis 最小概念速成页 |

> 此外，普通子目录 `AGENTS.md` 默认不超过 600 词；每个包的 `README.md` 虽然不设全文总词数死线，但开头的 `## Summary` 段被 [`scripts/verify-package-readme-summaries.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-package-readme-summaries.ts) 严格卡在 100 词以内。

更关键的是，当一次改动导致某份常驻文档超预算时，[`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md) 规定了不可跳步的处理顺序：

1. **第一步：Relocate（归位外迁）**——先检查新塞进去的段落是不是其实属于某个子系统文档、包 README、Cookbook 或 Agent Note；如果是，搬回真正的家，原地最多留一行链接。
2. **第二步：Condense（就地瘦身）**——确认确实属于本层常驻事实后，删掉废话、修辞和重复解释，用更精炼的直白语句表达。
3. **第三步：Raise（审慎提额）**——只有在仓库确实新增了顶层板块或核心规矩、挤无可挤时，才允许上调 `doc-budgets.manifest.json` 里的数字，并且必须在 PR 里解释清楚为什么这笔常驻上下文成本非付不可。

这个顺序直接把“渐进式披露”从一句口号变成了每次触发字数红灯时的标准动作：**逼着作者先把细节往深层赶，而不是任由根文件发胖。**

---

## 三、把整套文档看成五级存储层次

合上分层表和预算表再看，DSH 的文档体系其实就是一套按访问频率设计的存储层次：

| 层级 | 类比角色 | 代表文件 | 谁来控制体积与质量 |
|---|---|---|---|
| **L1 常驻层** | CPU 寄存器 / L1 Cache | 根 `AGENTS.md` | `doc-budgets.manifest.json` 硬上限（<= 2,080 词） |
| **L2 区域入口层** | L2 Cache | `docs/architecture.md`、子树 `AGENTS.md` | 各自的词数上限（600–2,410 词） |
| **L3 按需契约层** | 内存页 | `packages/*/*/README.md`、`docs/subsystems/*.md`、`docs/cookbook/*.md` | Summary <= 100 词门禁 + Model Experience / Known Limitations 结构门禁 |
| **L4 穷举查询层** | 磁盘索引表 | `docs/tool-catalog.md`、`config-catalog.md`、`event-producer-consumer.md` 等 | 不占人工写作预算，全自动生成 + 无 diff 新鲜度门禁 |
| **L5 决策与流程层** | 冷备归档与作业手册 | `.agents/notes/`、`.agents/skills/` | 准入门槛 + 冻结归档规则（`archived/` 清单校验） |

---

## 四、五道机器门禁：路标断了，CI 比模型先撞墙

地图画得再清楚，一旦过期就会误导模型。DSH 在 `pnpm run doc-sync` / `pnpm run test:docs` 里摆了五类针对性检查：

1. **防断链与假锚点（`verify-md-links` + `verify-repository-references`）**：校验所有相对文件链接与 `#heading` 锚点真实存在，同时拦截受维护文档里手写裸 commit SHA 或指向非官方个人 fork 的 URL。
2. **防索引过期（`verify-tool-catalog` / `verify-config-catalog` / `verify-doc-graphs` 等）**：重新从源码跑一遍生成器并与已提交文件做 diff，只要改了工具 schema、插件 `Config` 或事件声明却忘重跑生成脚本，门禁立刻报红。
3. **防示例代码腐烂（`doc-typecheck`）**：把文档里受检的 TypeScript 代码块拎出来过编译器，接口签名改了而文档示例没跟上就会编译失败。
4. **防常驻层发胖（`verify-doc-budgets` + `verify-package-readme-summaries`）**：卡死根入口、架构总图与包摘要的词数上限。
5. **防双语脱节与当前态污染（`verify-translation-pairing` 等）**：保证中英文配对文档同步演进，配合只写当前状态（current-state prose）的审查规范，不让过期的迁移台账留在正文里误导读者。

---

## 五、别的仓库最值得优先抄哪几条？

如果你维护的是自己的工程仓库，不需要第一天就把生成器、双语配对和全套脚本全搬过去。性价比最高的最小组合只有五步：

1. **分流人机入口**：`README.md` 给人看，`AGENTS.md` 给模型看，`CLAUDE.md` 直接做成指向 `AGENTS.md` 的软链接；
2. **根 `AGENTS.md` 只写短规矩 + 目录表 + 命令表**：删掉长篇背景介绍，每条规矩带链接指去具体文档；
3. **定下“一个事实一个家”**：配置去配置表、单模块去模块 README、历史取舍去轻量 ADR/Note，不在两处抄同一段话；
4. **给根 `AGENTS.md` 设一条简单的行数/字数红线**：超了先外迁再压缩；
5. **加一个秒级相对链接检查脚本**：保证根入口指出去的每个文件都真实存在。

更详细的分阶段落地手册可接着看 [FAQ 07](../07_borrowing-dsh-harness-idea/04-step-by-step-adoption.md)。
