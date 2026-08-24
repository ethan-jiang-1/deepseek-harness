# 05 · prose / 文档 / 翻译纪律：当前状态与机器检查

## 一句话

DSH 的文档不是“把历史写下来”，而是 **current state, not change history**。`.agents/skills/dsh-doc-standards`、`dsh-prose-standard`、`dsh-trim-cot-leakage`、`dsh-translate-docs`、`dsh-doc-site-sync` 分别负责放置、语义、去 CoT 泄漏、双语配对和文档站投影。

## 1. 文档标准：一个事实一个家

`docs/AGENTS.md` 的 tier taxonomy 决定事实住哪：

- Root `AGENTS.md`：standing orders，一至三行并链接 home
- `docs/architecture.md`：有序地图
- `docs/subsystems/`：子系统参考
- Package README：每包合同
- Agent Notes：为什么、放弃什么、当前决定
- Generated catalogs：从源码生成、freshness-gated，禁止手改

写作规则包括：

- **Document current state, not change history.** 避免 previously/now/no longer、PRs、commits、stack positions。
- One physical line per paragraph。
- 每个非平凡变更至少一个 Agent Note。
- owning subsystems page 随 documented type 的变更一起更新。
- 有 word budget 门禁，超了按 relocate → condense → raise 处理。

来源：`docs/AGENTS.md:7-45,47-57`

## 2. dsh-doc-standards：放置与审计

skill 的流程：

1. 先做结构 pass：定位文档、设置允许的 detail 层级、把下级细节链接到 owning descendant。
2. 区分 tutorial / reference；tutorial 要排前置知识。
3. 用 slop checklist 审计：reasoning transcript、重复、手写 catalog、status 注解、spec-speak in implemented Agent Note。
4. 移动文档是原子操作：删旧家、加新家、同一 change 修所有入站链接。
5. `verify-doc-budgets` 红时按 relocate/condense/raise 顺序。

来源：`.agents/skills/dsh-doc-standards/SKILL.md`

## 3. dsh-prose-standard：保住完整命题再删

它要求：保留 actor/action、condition/timing/ordering、modality、negative guarantee、ownership/side effect/failure/consequence。长度不是目标。

- 按位置覆盖：public JSDoc、internal comments、module comments、tests、cookbook、READMEs、Agent Notes、postmortems、prompts、diagnostics。
- 范围上总是排除 `vendor/` 和 `.agents/notes/archived/`。
- “contract/boundary/shape/surface/seam/gate/vocabulary”不是禁词，但要先用更精确的词。

来源：`.agents/skills/dsh-prose-standard/SKILL.md`

## 4. dsh-trim-cot-leakage：去掉作者视角

它处理的是“只有作者会话能解析”的文本：dead design-session citations、stack/PR vantage、change narration、review choreography、control-flow narration、hedges、language slips。

保留这些：Issue 引用、Agent Note/postmortem 里的 merged-PR/issue citations、suppression justifications、counterfactual regression pins、runtime old/new states、外部标准段落。

来源：`.agents/skills/dsh-trim-cot-leakage/SKILL.md`

## 5. 翻译：显式调用 + briefing-driven

- `dsh-translate-docs` 是 `disable-model-invocation: true`、`user-invocable: true`；只有用户显式调用才运行。
- 日常中文/英文配对更新走 lightweight routine path，不进入此 skill。
- 更新路径先生成 `gen-translation-brief`，让子代理只读 briefing、做最小 diff 翻译。
- 整篇翻译路径要求先读 terminology/rules/prompt，再 Pass 1 写、Pass 2 核、通读对侧。
- 配对由 `verify-translation-pairing --write <pair>` 记录双端 blob hash，`doc-sync` 做全库检查。

来源：`.agents/skills/dsh-translate-docs/SKILL.md`、`AGENTS.md:143`

## 6. 文档站是投影

- 仓库 Markdown 是唯一可编辑源。
- `website/docs.ts` 选择页面，`scripts/project-doc-site.ts` 生成 `website/.generated/`。
- 布局、移动、删除页面通过 `dsh-doc-site-sync` 同步；`docs:build` 会检查缺失页面。
- 英文/中文源文件仍按 `foo.md` / `foo.zh.md` / `foo.i18n.yaml` 配对，不创建 `zh-CN/` 目录。

来源：`.agents/skills/dsh-doc-site-sync/SKILL.md`

## 证据入口

- [`docs/AGENTS.md`](../../docs/AGENTS.md)
- [`.agents/skills/dsh-doc-standards/SKILL.md`](../../.agents/skills/dsh-doc-standards/SKILL.md)
- [`.agents/skills/dsh-prose-standard/SKILL.md`](../../.agents/skills/dsh-prose-standard/SKILL.md)
- [`.agents/skills/dsh-trim-cot-leakage/SKILL.md`](../../.agents/skills/dsh-trim-cot-leakage/SKILL.md)
- [`.agents/skills/dsh-translate-docs/SKILL.md`](../../.agents/skills/dsh-translate-docs/SKILL.md)
- [`.agents/skills/dsh-doc-site-sync/SKILL.md`](../../.agents/skills/dsh-doc-site-sync/SKILL.md)
