# Research 10 · 调查方法与证据底稿

## 基线

- 消化基线：DeepSeek Harness `dsh-v0.1.2-alpha.3`，commit `dd6322d604e00eec1ba5e0c8541159906a21094a`（[`_digested/00-index.md`](../../_digested/00-index.md)）。
- 本文写入与复核树：commit `08b582ea02cf16812d48e6323c91d784210cf38e`（2026-08-31）。文中行号以此树为准；模型名、默认 catalog、49 种事件词表等部署事实随上游漂移。

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

1. "`dsh-base` 默认挂载 goal/plan/workflow 工具" → `packages/bundle/base/cordis.patch.yml:256-374` 命中 `goal`、`goal-round-driver`、`plan-mode`、`tool-workflow`、`tool-todo`、`tool-goal`。**证实**。
2. "`ui-tool` 全包无 `'image'` 渲染分支" → grep `packages/client/ui-tool/src/` 对 `image` 零命中。**证实**（源码层；运行时间接路径未排除）。
3. 默认 catalog 三模型与 1M 窗口 → `packages/llm/llm-deepseek/README.md:53`。**证实**。
4. `reasoningEffort: off|low|high|max`、省略回退 `high` → `README.md:20,69`。**证实**。
5. `create_goal` 等工具注册于 `packages/goal/tool-goal`，Agent Note 自述 "Codex-shaped UX" → `tool-goal/README.md:5`。**证实**。
6. "dynamic workflow" 非官方术语 → 全仓 grep 仅命中本 FAQ 自身引用的用户原文。**证实**。

## 关键证据文件

- goal：`packages/goal/goal/src/{index,fold,types,domain}.ts`、`packages/goal/goal-round-driver/src/{index,prompt}.ts`、`packages/goal/tool-goal/src/{index,authority}.ts`；notes：`2026-07-19-persisted-same-session-goal-domain.md`、`2026-07-19-same-session-goal-round-driver.md`、`2026-07-19-model-facing-goal-tools.md`（均在 `.agents/notes/implemented/feature/`）。
- plan：`packages/plan/plan-mode/src/index.ts`；plan 策略 section 出厂文本 `packages/bundle/base/cordis.patch.yml:265-280`。
- workflow：`packages/workflow/workflow/README.md`（"No saved or nested workflows"）、`packages/workflow/tool-workflow/src/index.ts`、`packages/workflow/tool-ralph/README.md`。
- vision：`packages/fs/tool-fs/src/read-image.ts`、`packages/attachment/attachment-local/`（README + `normalization.ts`）、`packages/llm/llm-deepseek/{README.md,src/serialize.ts}`、`.agents/skills/record-browser-gif/SKILL.md`。
- 预览/产出物：`docs/cookbook/adding-a-tool.md`（render intent 纪律）、`packages/core/tools/src/presentation.ts`、`packages/client/ui-{tool,primitives,deliverables,workflow-run,attachment,conversation}/README.md`、`packages/host/apiproxy/README.md`（session.export ZIP）。
- 硬税：`docs/architecture.md:107`、`packages/core/agent-loop/src/invariant.ts:39-42`、`packages/core/session/src/{types,known-event-types}.ts`、notes `2026-08-10-session-log-version-mechanism.md`。
- 定制：`packages/preset/agent-presets/README.md`、`packages/bundle/README.md`、`packages/extensions/tool-cordis/README.md`、`packages/client/ui-slots/README.md`、`docs/cookbook/adding-a-conversation-node.md`、`docs/subsystems/skills.md`。

## 已知边界

1. A 路子代理超时未回收；workflow 的 hooks/caps 细节以 `packages/workflow/workflow/README.md` 与 D 路报告为准，未做独立全读。
2. Codex 侧（"3 小时在 codex 是做梦"）未做任何调查，本 FAQ 明确不裁判（answer.md 诚实边界第 1 条）。
3. UI 缺口清单（word/ppt/pdf、artifacts 侧栏、工具卡 image）基于源码 grep 与 README 自述，非运行时实测；`KNOWN_SESSION_EVENT_TYPES` 计数 49 取自 C 路报告的生成文件引用，未逐条点数。
4. 用户原文为转述，说话人的具体配置（是否真开 `max`、是否自定义 catalog）无从核验；本文只判定其说法与机制的相容性。
