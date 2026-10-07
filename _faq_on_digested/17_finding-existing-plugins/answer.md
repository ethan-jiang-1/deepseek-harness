# Answer 17 · 先查货架：找现成轮子的四步流程，与三个过去踩的坑

## 方法与基线

机制结论以 [`_digested/plugin-inventory/`](../../_digested/plugin-inventory/00-map.md) 专题为底（基线 `dsh-v0.2.0-rc.2`，commit `639ed01539`），并与 [`08`](../08_plugin-seam-maturity/answer.md)（seam 成熟度）、[`09`](../09_plugin-business-ladder/answer.md)（自用价值与参与阶梯）、[`16`](../16_preset-modes-specialty/answer.md)（四模式差异）交叉。计数均可由生成目录与 bundle patch 行号复核。

## 答案：四步流程

**第一步，查货架（有什么）。** 打开 [`plugin-inventory/02-plugin-catalog.md`](../../_digested/plugin-inventory/02-plugin-catalog.md)：316 个包按 54 个组列出，每包标注形态（Def / Impl / Tool / cmd / UI / adapter / lib / 驱动）、默认可见性（base / web / min / preset / opt / —）、Config 字段数与一句话职责。组序与 `packages/README.md` 一致，可直接对照源码目录；新手先读 [`01-capability-tour.md`](../../_digested/plugin-inventory/01-capability-tour.md) 的八类地图与场景再回来查。

**第二步，按「要什么」对横切清单（以什么形态给）。** [`03-reference-lists.md`](../../_digested/plugin-inventory/03-reference-lists.md) 回答形态问题：要服务查 92 个 `ctx` 键（55 core + 33 seam + 3 service + 1 bundle，`docs/capability-seams.md:580-671`）；要模型工具查逐 profile 暴露表（base 层 25 个左右固定名、web 预设由四 preset 各自决定、sdk-minimal 只有持久 shell＋`run_code`）；要打包查 10 个 bundle；要模式查四 preset；要技能查 15 个 skill。

**第三步，判可见性（默认拿不拿得到）。** 同一个包在哪一层被拿到由 patch 行决定，[`plugin-inventory/05`](../../_digested/plugin-inventory/05-taxonomy-and-design.md) 的可见性光谱把位置分成五档：base 出厂即见 → web-app 层 → preset 会话级 → OPTIONAL_BUNDLES 默认关 → 未挂载现货。两个常见误判在此消解：`tool-str-replace-editor`「不见了」其实是全仓下线改为显式 insert；全文搜索「没有」其实是 `session-query-sqlite` 出厂 `openAt: never`。

**第四步，选出路（怎么拿）。** 按代价从低到高：调配置 → patch 换 Provider → `dsh plugin --profile <name> add` 挂现货 → 写胶水插件消费现成服务（109 行的 `tool-present` 是官方样本：`inject = ['tools', 'fs', 'sessionProjections']`，`packages/deliverables/tool-present/src/index.ts:23-26`）。四条出路的带行号实例在 [`04-reuse-paths-and-gaps.md`](../../_digested/plugin-inventory/04-reuse-paths-and-gaps.md)。

## 必须自写的判定

[`04`](../../_digested/plugin-inventory/04-reuse-paths-and-gaps.md) 末节的缺口清单是唯一白名单：`ctx.approval` / `ctx.userQuestions` / `ctx.authorization` 三个零 Provider seam（headless 部署的审批与提问、新凭据流）、browserUse / computerUse / speechToText 的非实验 Provider、第三家 LLM adapter。写之前先对照 [`08`](../08_plugin-seam-maturity/answer.md) 的信号（自消费、零 Provider、P≥2）确认缺口是真的，再按 [`09`](../09_plugin-business-ladder/answer.md) 的 L0–L3 阶梯确认代价值得。

## 三个过去踩的坑（为什么原来没头绪）

1. **把 `packages/` 当货架平铺**。316 个包里 util 17 包与 test-support 7 包是纯库和测试基建，不是插件位；九种形态的分法（[`05`](../../_digested/plugin-inventory/05-taxonomy-and-design.md)）先告诉你哪些格子是「插件位」。
2. **只看 base 层就下结论「没有」**。货架现货大量藏在光谱右侧：`tool-lsp`、`tool-terminal`、`tool-session-query`（5 个检索工具）、`web-search-exa`、`mcp-client`、`hooks-codex` 都默认不挂载——「默认看不到」≠「没有」。
3. **以为接新模型必须写 adapter**。`llm-pi-ai` 以休眠态随 base 挂载，settings 出现 `llm-pi-ai:` 段即注册多 Provider routes（`packages/llm/llm-pi-ai/src/index.ts:243-274`）；catalog 替换走 `cordis.yml` 的 `models` 列表（`packages/llm/llm-deepseek/src/config.ts:88`）。先调配置，最后才写 adapter。

## 阅读地图

 [`plugin-inventory/00`](../../_digested/plugin-inventory/00-map.md)（消化路线＋组装漏斗）→ [`01`](../../_digested/plugin-inventory/01-capability-tour.md)（八类能力与场景）→ [`02`](../../_digested/plugin-inventory/02-plugin-catalog.md)（货架图鉴）→ [`03`](../../_digested/plugin-inventory/03-reference-lists.md)（横切清单）→ [`04`](../../_digested/plugin-inventory/04-reuse-paths-and-gaps.md)（出路与缺口）→ [`05`](../../_digested/plugin-inventory/05-taxonomy-and-design.md)（分类法与设计取舍）；官方插件作者教程在 [`_dsh_plugin_agent_ready_development/repo-harness/09`](../../_dsh_plugin_agent_ready_development/repo-harness/09-plugin-author-entry.md)，仓库组织方案在 [`13`](../13_expert-plugin-repo-organization/answer.md)。
