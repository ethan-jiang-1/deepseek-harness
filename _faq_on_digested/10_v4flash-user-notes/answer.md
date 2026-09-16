# Answer 10 · 三条体感的机制判定：一条机制使然，一条混合，一条方向对但归因要拆开

## 方法与基线

用户原文是转述（见 [question.md](./question.md)），本篇不考据说话人，只把三条体感当成**待验证命题**，逐条对照源码与 [`_digested/`](../../_digested/00-index.md)。机制结论以消化基线 DeepSeek Harness `dsh-v0.1.2-alpha.3`（commit `dd6322d6…`）为底；写作时的复核树是 `08b582ea02…`，本次同步已按 `dsh-v0.1.5-rc.1`（commit `183f08e9c6`）重核，引用的行号以该树为准。调查方式：四路并行子代理分别深挖 workflow 编排、goal/plan/todo 三件套、vision 与预览产出物链路、定制扩展机制，captain 对其中的强论断逐条用 grep 抽查复核。0.1.5 复核的最大修正是写作时的一条强论断——"`ui-tool` 全包无 image 渲染分支"——已被跨度内交付推翻（见 [02 第二节](./02-self-built-previews.md)）。证据底稿在 [research.md](./research.md)。

三条体感恰好各落在 harness 的一层：**模型路由层**（第 1、3 条）、**驱动循环层**（第 1 条）、**宿主投影层**（第 2 条）。这个分层本身就是第一个发现：说话人没有把三件事混成一团"体验"，而 FAQ 的价值是把每一层拆到机制。

## 判定总表

| # | 体感 | 判定 | 一句话依据 |
|---|---|---|---|
| 1a | "快就是好，V4 Flash 足够优秀，思考开在 Max" | **机制使然 + 需补成本账** | Flash 是默认 catalog 首位、`reasoningEffort` 支持 `off\|low\|high\|max`（省略回退 `high`），且生效值落 `request/header`；但 max 档在长会话里背着 reasoning 回传税（[01](./01-fast-is-good.md#第二节-思考开在-max的机制与它-hidden-的-token-账)） |
| 1b | "开箱已有 goal、plan" | **逐字成立** | `dsh-base` 第一层 bundle 就挂 `goal`/`goal-round-driver`/`tool-goal`/`tool-todo`/`tool-workflow`/`plan-mode`（`packages/bundle/base/cordis.patch.yml:292-414`） |
| 1c | "用 plan 打造 dynamic workflow" | **可复述但需校正** | "dynamic workflow" 不是官方术语；官方原语是 `workflow` 工具（只接受 caller-supplied script）+ plan 模式（日志化评审姿态）+ goal 续轮（自动驾驶），三者零耦合，"dynamic" 发生在模型把批准后的 plan 翻译成一次性编排脚本的那一步（[01](./01-fast-is-good.md#第四节-dynamic-workflow这个造词的机制解读)） |
| 1d | "重构 3 小时看到效果，在 codex 简直是做梦" | **机制上可解释，不代为裁判** | 3 小时的**下限**由 harness 结构给出：goal 轮次默认 256 轮自动续、workflow `parallel()/pipeline()` fan-out、后台 subagent、会话持久可恢复；harness 保证的是"不空转、可并行、可恢复"，上限仍归模型（[01](./01-fast-is-good.md#第五节-3-小时的下限与上限)） |
| 2a | "多路并行、diff 预览、markdown 预览要自己打造" | **已存在，无需自造** | 并行有三层（workflow 编排 / 后台 subagent / 工具池 `maxParallelToolCalls`）；diff 与 markdown 渲染是官方 render intent + `ui-primitives` 已交付能力（[02](./02-self-built-previews.md#第一节-逐项判定用户清单里哪些已经是官方交付)） |
| 2b | "word 预览、ppt 预览、codex 式右侧边栏产出物要自己打造" | **真缺口，且自建有硬税** | 无对应事件、无渲染器、无挂载点；且新增一种用户可见产物 = 新增 `SessionEventMap` 成员（默认 required-on-read），这是 `model-visible ⟺ logged` 制度的 UI 侧镜像（[02](./02-self-built-previews.md#第三节-真缺口与自建的硬税)） |
| 2c | "官方已经有了很多实践，不多多试试" | **成立，且比说话人以为的更多** | 会话流业务卡（ConversationNodeDefinition）、布局槽（`shell.overlay`/`rightbar`）、`cordis_define/cordis_run` 运行时动态挂 UI、workflow 模板的 tool-ralph 模式，四条路全是官方铺好的（[02](./02-self-built-previews.md#第四节-官方实践的位置)） |
| 3 | "别用 V4 Pro，多用 vision" | **方向成立，机制修正三点** | vision 是 catalog 条目属性（0.1.5 默认 catalog 有两个 image-capable 条目：`deepseek-flash`、`deepseek-v4-flash-vision-exp`），不是所有模型都能看图；DSH 没有"指向 URL 看一眼"的能力——视觉入口只有文件路径；V4 Pro 并未被 harness 禁用，"别用"是经济学判断不是机制限制（[03](./03-flash-pro-vision.md)） |

## 根本体验的层次：一条体验皮，三条根

把三条体感放到足够深的机制上，得到的是一个三根结构，不是单一解释：

- **体验皮（最贴近体感）**：goal/plan 把"长任务自主"从提示词层提升到状态与授权层——预算有上限、完成有证据门、阻塞有 3 轮下限、恢复必须过人手；"敢让它自己跑三小时"由此从模型勇气变成系统属性。完整展开见主篇 [04](./04-goal-plan-small-model.md)。
- **根 1（日志基底）**：`goal/change`、`plan/mode`、`tool-workflow/*` 全是 `SessionEventMap` 成员，model-visible ⟺ logged 有运行时不变量机械断言；goal 自己的设计笔记承认 *"session log is the only durable source of truth"*——goal/plan 自己就是日志的下游。凡是日志里已有的，体验就是现成的；凡是日志里没有的，就要连制度一起补（第 2 条的真缺口正是这面镜子）。
- **根 2（委派 spine）**：`ctx.subagents` 以 6 个 Provider 居全部 seam 之首，goal 域 4 包 + workflow 组 4 包 + experimental agent-team——"分给很多小执行者、汇回一本日志"是官方投资最重的方向；时间维度（goal 轮次）× 空间维度（fan-out）两条拆分轴，把每个叶子节点切成小模型的最优工作区。
- **根 3（组合层）**："开箱"二字住在这里——默认姿态是 bundle 层的组合决策；`packages/extensions`（原 self-modification）更进一步，让 harness 用自己改自己。

三条根缺一，体感都不成立；反例检验（patch 掉 goal/plan 后哪些体感会死、哪些存活）与展开见 [05](./05-other-roots.md)。这也对应 [`harness-idea/05-dynamic-legibility`](../../_digested/harness-idea/05-dynamic-legibility.md) 的论点：可读性不是 UI 恩赐，是日志结构的推论。

## 诚实边界

1. **Codex 侧未验证。** "在 codex 简直是做梦"是对另一个产品的体感，本文不代为裁判；只指出一个有趣的对向事实：DSH 的 harness 级循环 Agent Note 自述 "Codex-shaped UX"（`.agents/notes/implemented/feature/2026-07-16-harness-level-loop.md:114`；goal 工具笔记只说自己 "follow Codex's compact goal tool surface"，见 `2026-07-19-model-facing-goal-tools.md:15`），且 `packages/hooks` 为 Claude Code（7/30 事件）与 Codex（5/10 事件）的 hook 配置提供了兼容桥——DSH 对这两个竞品的姿态是吸收其 UX、兼容其生态，而不是无视。
2. **"3 小时"是单一说不通不出错的样本。** 本篇解释了机制下限，但不为具体任务的耗时背书；速度还取决于任务结构（可并行度）、上下文新鲜度与 cache 命中（路由或前缀一变即失效，`packages/llm/llm-deepseek/README.md:163`）。
3. **UI 缺口清单基于源码与 README，非运行时实测。** 写作时的一条强论断"`ui-tool` 全包无 `'image'` 分支"已被 0.1.5 的 image 卡交付推翻（`packages/client/ui-tool/src/client/tool/models/image-card-model.ts`、`tool.call.images` slot）；保留这条修正记录，是因为它正是"源码复核必须随同步重跑"的样本。
4. **模型命名与档位是部署事实，不是 harness 承诺。** `deepseek-flash`/`deepseek-v4-flash`/`-pro`/`-flash-vision-exp` 是 `llm-deepseek` 省略 `models` 时的默认 catalog（`packages/llm/llm-deepseek/README.md:49`），catalog 只提供建议，未列出 id 原样透传，上游换名时本篇的模型名会过期。

## 分篇

- [04-goal-plan-small-model.md](./04-goal-plan-small-model.md) —— **主篇**：goal/plan 机制源码级全展开；"快而小模型为何优秀"的职责拆分论证（步内归 max 思考，步间归日志）。
- [05-other-roots.md](./05-other-roots.md) —— **根的修正**：goal/plan 不是唯一根；日志基底、委派 spine、组合层三根结构与反例检验。
- [01-fast-is-good.md](./01-fast-is-good.md) —— 证据篇（论断 1）：快的三层机制、"dynamic workflow" 造词解读、3 小时的下限与上限、max 档的 token 账。
- [02-self-built-previews.md](./02-self-built-previews.md) —— 证据篇（论断 2）：预览清单逐项判定、真缺口、自建四条路、`model-visible ⟺ logged` 的 UI 硬税。
- [03-flash-pro-vision.md](./03-flash-pro-vision.md) —— 证据篇（论断 3）：catalog 四模型、vision 验证回路、read_image 预算全链、Pro 的真实位置。
