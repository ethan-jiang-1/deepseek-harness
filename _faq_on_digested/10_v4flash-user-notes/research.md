# Research 10 · 调查方法与证据底稿

## 基线

- 消化基线：DeepSeek Harness `dsh-v0.1.2-alpha.3`，commit `dd6322d6…`；同步后与 `_digested/` 同一基线 `dsh-v0.1.7-rc.1`，commit `46a7f68b0922371ce7144b668b90e377d8e799f4`（[`_digested/00-index.md`](../../_digested/00-index.md)）。
- 本文写入树：commit `08b582ea02cf16812d48e6323c91d784210cf38e`（2026-08-31）；本次同步复核树为 `46a7f68b09`（工作树 `9c18e3f216`），文中行号已按复核树更新。模型名、默认 catalog、事件词表等部署事实随上游漂移。

## 方法

用户三条体感（转述见 [question.md](./question.md)）被拆成 8 个子命题（answer.md 判定总表），由四路并行子代理分头只读调查，captain 人工复核强论断后综合。初稿曾把 goal/plan 当作三条体感的唯一根；写入 [05](./05-other-roots.md) 前做了反例检验——patch 掉 goal/plan 后，"多路并行 / 可恢复可审计 / 快"仍然存活，只有"敢放手"死亡——据此修正为三根结构（日志基底 / 委派 spine / 组合层），goal/plan 降为最贴近体感的"体验皮"（[04](./04-goal-plan-small-model.md) 主篇 + [05](./05-other-roots.md) 修正篇）。

| 路 | 范围 | 回收的关键事实 |
|---|---|---|
| A（workflow 深挖） | `packages/workflow`、编排原语与 plan 的关系 | 报告未及回收，workflow 事实改由 D 路 + captain 直读覆盖 |
| B（goal/plan/todo） | `packages/goal/*`、`packages/plan/plan-mode`、`packages/todo/tool-todo`、agent-loop | goal 状态机与续轮驱动器全链、`<goal_round>` 提示词、plan/mode 日志态、exit_plan_mode 评审流、todo 整表快照、turn flow 规范图 |
| C（vision/预览/产出物） | `tool-fs`/`attachment-local`/`llm-deepseek`、render intent、`packages/client/*`、session 投影 | read_image 五级预算链、render intent 全目录、UI 已有/缺口清单、`model-visible ⟺ logged` 的 invariant 实体与 ignorable 机制 |
| D（定制扩展） | preset/bundle/extensions/hooks/skill/SDK/ACP | `self-modification` 已更名 `extensions`、四条 UI 挂载路线、workflow 模板载体结论、hooks 兼容面（CC 7/30、Codex 5/10） |

## captain 抽查复核记录

对子代理报告中的强论断逐条 grep 复核：

1. "`dsh-base` 默认挂载 goal/plan/workflow 工具" → `packages/bundle/base/cordis.patch.yml:292-414` 命中 `goal`、`goal-round-driver`、`plan-mode`、`tool-workflow`、`tool-todo`、`tool-goal`。**证实**。
2. "`ui-tool` 全包无 `'image'` 渲染分支" → 写作树 grep `packages/client/ui-tool/src/` 对 `image` 零命中；**该论断已被 0.1.5 跨度内交付推翻**：`image-card-model.ts`、`read-image-row.tsx`、`tool.call.images` slot（`src/client/contract/slots.ts:40`）都在，`ui-tool` 现在渲染工具结果图像。**已修订**（见 [02 第二节](./02-self-built-previews.md)）。
3. 默认 catalog 四模型与 1M 窗口 → `packages/llm/llm-deepseek/README.md:49`（`deepseek-flash` 与 `deepseek-v4-flash-vision-exp` 含 image，`deepseek-v4-flash`、`deepseek-v4-pro` 为 text-only）。**证实**（写作树为三模型）。
4. `reasoningEffort: off|low|high|max`、省略回退 `high` → `README.md:56`、`:83`。**证实**。
5. `create_goal` 等工具注册于 `packages/goal/tool-goal`；"Codex-shaped UX" 实出自 harness 级循环笔记 `.agents/notes/implemented/feature/2026-07-16-harness-level-loop.md:114`（goal 工具笔记 `2026-07-19-model-facing-goal-tools.md:15` 只自述遵循 "Codex's compact goal tool surface"）。**已更正归属**。
6. "dynamic workflow" 非官方术语 → 全仓 grep 仅命中本 FAQ 自身引用的用户原文。**证实**。

## 关键证据文件

- goal：`packages/goal/goal/src/{index,fold,types,domain}.ts`、`packages/goal/goal-round-driver/src/{index,prompt}.ts`、`packages/goal/tool-goal/src/{index,authority}.ts`；notes：`2026-07-19-persisted-same-session-goal-domain.md`、`2026-07-19-model-facing-goal-tools.md` 仍在 `.agents/notes/implemented/feature/`，`2026-07-19-same-session-goal-round-driver.md` 已归档到 `.agents/notes/archived/feature/`、`2026-08-02-goal-round-wrapup-message.md` 归档到 `.agents/notes/archived/bug-fix/`（行号按归档后的正文）。
- plan：`packages/plan/plan-mode/src/index.ts`；plan 策略 section 出厂文本 `packages/bundle/base/cordis.patch.yml:305-315`。
- workflow：`packages/workflow/workflow/README.md`（"No saved or nested workflows"）、`packages/workflow/tool-workflow/src/index.ts`、`packages/workflow/tool-ralph/README.md`。
- vision：`packages/fs/tool-fs/src/read-image.ts`、`packages/attachment/attachment-local/`（README + `normalization.ts`）、`packages/llm/llm-deepseek/{README.md,src/serialize.ts}`、`.agents/skills/record-browser-gif/SKILL.md`。
- 预览/产出物：`docs/cookbook/adding-a-tool.md`（render intent 纪律）、`packages/core/tools/src/presentation.ts`、`packages/client/ui-{tool,primitives,deliverables,workflow-run,attachment,conversation}/README.md`、`packages/session-query/session-log-export/`（session.export ZIP，后代打包见 `src/archive.ts:8`）。
- 硬税：`docs/architecture.md:125`、`packages/core/agent-loop/src/invariant.ts:39-42`、`packages/core/session/src/{types,known-event-types}.ts`、notes `2026-08-10-session-log-version-mechanism.md`。
- 定制：`packages/preset/agent-preset/README.md` 与 `packages/preset/agent-preset-registry/README.md`（0.1.7 线起 preset 重设计的落点；旧 `packages/preset/agent-presets/README.md` 已随重设计删除）、`packages/bundle/web-app/README.md`（shipped preset 声明在 `presets/*.patch.yml`）、`packages/bundle/README.md`、`packages/extensions/tool-cordis/README.md`、`packages/client/ui-slots/README.md`、`docs/subsystems/conversation.md`、`docs/subsystems/skills.md`。

## 已知边界

1. A 路子代理超时未回收；workflow 的 hooks/caps 细节以 `packages/workflow/workflow/README.md` 与 D 路报告为准，未做独立全读。
2. Codex 侧（"3 小时在 codex 是做梦"）未做任何调查，本 FAQ 明确不裁判（answer.md 诚实边界第 1 条）。
3. UI 缺口清单（word/ppt/pdf、artifacts 侧栏）基于源码 grep 与 README 自述，非运行时实测；`KNOWN_SESSION_EVENT_TYPES` 实测 56 种（写作时为 49 种）；"工具卡 image"一项已被 0.1.5 交付移除。
4. 用户原文为转述，说话人的具体配置（是否真开 `max`、是否自定义 catalog）无从核验；本文只判定其说法与机制的相容性。
