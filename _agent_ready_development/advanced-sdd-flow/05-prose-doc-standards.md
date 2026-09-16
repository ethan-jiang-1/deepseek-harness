# Advanced 05 · Documentation ownership（文档所有权）

## 一句话

DSH 把“现在是什么”和“为什么这样决定”分开维护：当前 API、行为与限制进入 owning documentation（拥有该事实的文档）、README 或 JSDoc，rationale（决定理由）与 alternatives（备选方案）进入 Agent Notes，变更过程留在 git/PR。Bilingual pairing（双语配对）让两种语言同步演进，文档站从 manifest（清单）指定的 canonical Markdown source（规范 Markdown 源）投影；两者都不创建脱离原 owner 的第二套手编事实。

> Each fact has one home: the tier whose job it is; elsewhere, link there.
>
> — DSH [`docs/AGENTS.md` 的 “The tier taxonomy”](https://github.com/deepseek-ai/deepseek-harness/blob/183f08e9c6dde7e36cd2318eaee70b0da08fb35e/docs/AGENTS.md#the-tier-taxonomy-one-home-per-fact)。这条规则解释为什么当前行为、决定理由、操作步骤和生成目录必须分属不同 owner。

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

这套 tier 怎样帮助 fresh agent 在有限上下文中找到权威知识，见 [可读性与知识归属](../development-harness/02-legibility-and-ownership.md)；本页继续拥有 DSH 文档修改的具体规则。

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

这些 Skills 在各自任务中拥有具体判断步骤；Skill 作为程序化工作记忆的共同角色见 [Skills 专章](../development-harness/03-skills-as-procedural-memory.md)。

## 5. 文档站只做投影

`website/docs.ts` 是公开页面 allowlist，`scripts/project-doc-site.ts` 将仓库 Markdown 投影到 disposable `website/.generated/`，VitePress 再构建页面、raw Markdown twins 和 `llms.txt`。源文件仍以 sibling English/Chinese pair 存放，不创建 `zh-CN/` source tree。

一个 repo-relative link 若指向 manifest 页面会改写为站点 route；未发布但存在的目标会变成 GitHub source link；图片复制到生成树；不存在的目标使 projection 失败。发布、移动或删除页面需要 `dsh-doc` 的网站发布流程，普通未映射文档编辑不需要改网站 manifest。

## 证据入口

- DSH [文档标准](https://github.com/deepseek-ai/deepseek-harness/blob/183f08e9c6dde7e36cd2318eaee70b0da08fb35e/docs/AGENTS.md)：tier owner、tutorial/reference 区分、当前状态写作与字数预算。
- DSH [`dsh-doc` skill](https://github.com/deepseek-ai/deepseek-harness/blob/183f08e9c6dde7e36cd2318eaee70b0da08fb35e/.agents/skills/dsh-doc/SKILL.md)：文档放置、语料审计、校验流程，以及 canonical docs 到 VitePress projection 的网站发布路径。
- DSH [`dsh-prose-standard` skill](https://github.com/deepseek-ai/deepseek-harness/blob/183f08e9c6dde7e36cd2318eaee70b0da08fb35e/.agents/skills/dsh-prose-standard/SKILL.md)：完整命题与各类 prose 必须覆盖的行为、失败和所有权。
- DSH [`dsh-trim-cot-leakage` skill](https://github.com/deepseek-ai/deepseek-harness/blob/183f08e9c6dde7e36cd2318eaee70b0da08fb35e/.agents/skills/dsh-trim-cot-leakage/SKILL.md)：怎样识别并移除作者会话视角。
- DSH [`dsh-translate-docs` skill](https://github.com/deepseek-ai/deepseek-harness/blob/183f08e9c6dde7e36cd2318eaee70b0da08fb35e/.agents/skills/dsh-translate-docs/SKILL.md)：只有显式调用才进入的整篇翻译扩展流程。
