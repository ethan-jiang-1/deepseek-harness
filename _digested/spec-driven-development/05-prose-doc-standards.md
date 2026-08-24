# 05 · 当前文档、决定理由与发布投影

## 一句话

DSH 把“现在是什么”和“为什么这样决定”分开维护：当前 API、行为与限制进入 owning docs/README/JSDoc，rationale 与 alternatives 进入 Agent Notes，变更过程留在 git/PR。翻译和文档站都从 canonical Markdown 派生，不创建第二个内容 owner。

## 1. 一个事实先找 owner

`docs/AGENTS.md` 的 tier taxonomy 按读者任务分配事实：

| tier | 拥有 |
|---|---|
| root/subtree `AGENTS.md` | 每次会话或子树必须遵守的 standing orders |
| `docs/architecture.md` | 组合、主干、扩展点与 capability seam 的有序地图 |
| `docs/subsystems/` | 子系统 types、semantics 与生成的 Cordis API |
| package README | 每个包的 config、行为、失败、限制、extension points 与 Model Experience |
| Agent Notes | 决定或提案的 rationale、alternatives、consequences 与 required verification |
| generated catalogs | 从 source/JSDoc 生成的穷举 reference |
| cookbook / `docs/user/` | contributor procedure / product-facing guide |

高层文档只概括直接子项的 purpose、responsibility 和 high-level behavior；更低层细节链接到 owning descendant。生成目录改 owner source 或 generator，不能手改产物。

## 2. 当前状态写作不是变更日志

Durable prose 直接陈述当前 actor、行为、条件、时机、modality、失败、所有权和后果，不保留 `previously / now / no longer`、PR stack 位置、review 对话或实现过程。非显然 rationale 若能阻止误用，放进 owning Agent Note 后从当前文档链接过去。

`dsh-prose-standard` 的编辑单位是完整命题，而不是词数。删改前要保留每个 load-bearing clause；短文本若丢掉 negative guarantee、exception 或 consequence，仍然是退化。

`dsh-trim-cot-leakage` 用一个判定问题检查作者视角：读者只拿到 HEAD、没有会话 transcript、PR thread 或未提交 draft 时，能否解析每个引用并核验每个 claim？不能就把仍有价值的事实改写成 repository vantage，其余 session narration 删除。

## 3. 文档变更的最短闭环

1. 定位事实的 owner、直接 children 和文档类型；reference 支持查找，tutorial 按前置知识引向可观察结果。
2. 先更新 owner，再更新必要的摘要、JSDoc、README 或 paired counterpart。
3. 对 prose 做语义审查：位置、完整命题、重复、current-state 视角和术语都不能由 lint 证明。
4. 运行 `doc-sync`；JSDoc 或 generator owner 改动时重生成受影响 catalogs。
5. 需要发布到 VitePress 时只修改 canonical source 与 `website/docs.ts` manifest，不编辑 `website/.generated/`。

文档 move 是原子操作：同一变更移除旧 home、新增新 home，并修复全部入站 Markdown 和 TypeScript 引用。

## 4. 双语 pairing 的日常路径与扩展路径

已配对的 `foo.md`、`foo.zh.md` 和 `foo.i18n.yaml` 在任一语言改动后都要同步 counterpart，并用 scoped `verify-translation-pairing --write <pair>` 重录两端 hash。日常小改遵循 `docs/AGENTS.md` 的 lightweight routine，保留未触及段落的既有译文。

`dsh-translate-docs` 是显式用户调用的扩展 workflow，不会因普通文档编辑自动运行。它用于 briefing-driven 更新或新 pair 的整篇翻译；普通审阅也不能以“需要翻译”为由自行触发它。Archived Agent Notes 的 triplet 已冻结，不属于翻译工作。

## 5. 文档站只做投影

`website/docs.ts` 是公开页面 allowlist，`scripts/project-doc-site.ts` 将仓库 Markdown 投影到 disposable `website/.generated/`，VitePress 再构建页面、raw Markdown twins 和 `llms.txt`。源文件仍以 sibling English/Chinese pair 存放，不创建 `zh-CN/` source tree。

一个 repo-relative link 若指向 manifest 页面会改写为站点 route；未发布但存在的目标会变成 GitHub source link；图片复制到生成树；不存在的目标使 projection 失败。发布、移动或删除页面才需要 `dsh-doc-site-sync`，普通未映射文档编辑不需要改网站 manifest。

## 6. `_digested/` 的边界

`_digested/` 是研究分支上的源码消化语料，不是 official product docs、双语 pair 或网站发布源。它沿用 current-state、one-home、可核验链接和完整命题纪律，但由 `_digested/verify.mjs` 维护自身 Markdown/SVG 完整性，不应为了这批研究页创建 `docs/*.zh.md`、pairing sidecar 或 `website/docs.ts` entry。

历史案例是这个语料的明确例外类型：它可以叙述 commit 顺序，但必须标出能证明和不能证明的事实，不能让旧格式冒充现行规则。

## 证据入口

- [文档标准](../../docs/AGENTS.md)
- [`dsh-doc-standards`](../../.agents/skills/dsh-doc-standards/SKILL.md)
- [`dsh-prose-standard`](../../.agents/skills/dsh-prose-standard/SKILL.md)
- [`dsh-trim-cot-leakage`](../../.agents/skills/dsh-trim-cot-leakage/SKILL.md)
- [`dsh-translate-docs`](../../.agents/skills/dsh-translate-docs/SKILL.md)
- [`dsh-doc-site-sync`](../../.agents/skills/dsh-doc-site-sync/SKILL.md)
- [`_digested` index](../00-index.md)
