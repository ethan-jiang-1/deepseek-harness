# 运行时用户旅程 · 可执行的 DSH 开发循环，从入口点到报告的证据

基线：行为从当前 checkout 读取。配置声明来自已发布的组合层
（`packages/bundle/base/cordis.patch.yml` → `packages/bundle/web-app/cordis.patch.yml` →
`packages/preset/agent-presets/presets/standard/agent.cordis.yml`），由 `apps/cli/src/profile-boot.ts` 在空 profile 根之上
（`PROFILE_ROOT_CONFIG`, `apps/cli/src/profile-boot.ts:84-88`）应用。UI 可见的声明仅来自
test/snapshot golden 文件（`apps/web/tests/`）；以下内容均非来自我未读的截图推断。
所有路径相对于仓库根。

受众说明：本文与 [answer.md](./answer.md) 回答的是**不同的问题**。answer.md 从 skills、git 历史和默认行为
论证 DSH 让哪种开发习惯最自然（窄证据切片闭环）。本文重构人类在要求 DSH 修改仓库时所观察的**机械可观察的运行时循环**，
并区分什么是由 harness 强制的（defaults）、什么是由仓库建议的（contributor policy）、
什么是仓库恰好做了的（history-based convention）。修正一节纠正 answer.md 模糊这三层界限的地方。

## 1. 入口点与会话如何启动

只有一个 `dsh` 二进制文件（`apps/cli/package.json` `bin.dsh: lib/bin.js`）。`apps/cli/src/bin.ts` 解析
`--profile` / `--plugin` / `--dump-config` 分发（bin.ts:31-61）。每个真实的面都是一个 *profile*：Web 是
`dsh --profile web`，CLI/headless 是另一个 profile，ACP/JSON-RPC 是各自的 profile 或运行时面
（ACP：`dsh --profile acp` / `packages/bundle/acp-app`；JSON-RPC：`packages/sdk/`）。没有独立的 Web 二进制：浏览器由 host 提供，
前端是一个由 Node 端组合进 `window.__DSH_BOOT__` 的模块表
（`packages/bundle/web-app/cordis.patch.yml:170-177`）。

组合是分层的：空 profile 根（`profile-boot.ts:84-88`）→ bundle patches 按
`dsh.profile.bundles` 顺序 → profile 的 `cordis.patch.yml` → 任何 `--patch` 覆层 → 用户层
（`$DSH_HOME/cordis.patch.yml`）。行按 id 寻址，最后写入者胜。

共享核心（`packages/bundle/base/cordis.patch.yml`）在任何 UI 之前就已安装了 DSH session 的身份：
`system-prompt` personaPrefix 默认为空（`:465-468`），`agent-default-model` = deepseek-official /
deepseek-flash（`:75-79`），`sandbox-policy` mode = `process.env.DSH_PERMISSION_MODE ?? 'workspace-write'`
且 `workspaceRoot = process.cwd()`（`:208-212`），`approval` policy = `'never'` 仅在解析的 mode 是
`danger-full-access` 时，否则为 `'ask'`（`:224-227`），`permission-presets` 表（workspace-write+ask,
danger-full-access+never）（`:229-241`）。

在 Web 中，agent 平面移到了 **agent preset** 后面：tool-bash/fs/skill/subagent/goal/todo
等基础行被禁用（`packages/bundle/web-app/cordis.patch.yml:368-471`），而 `agent-presets default: standard`
（`:480-484`）选择完整的 coding agent preset（`packages/preset/agent-presets/presets/standard/agent.cordis.yml`）。
因此 *实际的* Web 默认组合是 base + web + standard preset。这点很重要：answer.md 归因于 base 的几个行为
（plan-mode, fork background mode, tool presentation）实际上是由 standard preset 设置的，且与 base 行不同。

模型对自身的认知来自 persona 节（order 0）和 identity 节（order -1000,
`You are an AI agent powered by DeepSeek Harness.`, `packages/core/system-prompt/src/index.ts:419-424`）。
Web/standard 将 persona 覆盖为
`You are a coding agent powered by the {{model}} model. Your working directory is {{cwd}}.`
（`web-app/cordis.patch.yml:16-20`, standard preset）。`{{model}}`/`{{cwd}}` 从 agent route 和
session header 解析（`agent-loop/src/index.ts:421-423`），这恰好是 Web 用户在会话开始时看到的字符串。

## 2. 可观察的循环，端到端（用户请求 → 报告的证据）

请求成为 `ReactLoopAgent` 内部的一个 turn
（`packages/core/agent-loop/src/agent.ts`）。每个 turn：`turn/start`（agent.ts:278）→ 每步 `preStep`
（agent.ts:240-250）认领 user messages，组装 system prompt，并追加动态的
runtime-context snapshot，然后运行 `agent/pre-step` waterfall，plan-mode、skills 和 agent-instructions
在此注入其材料 → `step/start`（agent.ts:302）→ model request 流式传输，追加为
`assistant/message`（agent.ts:474-483；流内容自 `f99b06eaed` 起内嵌于该事件）→ 如果 assistant 发出了 tool calls，
`executeToolCalls` 运行它们（agent.ts:488-491, `tool-calls.ts`）→ `step/end` → `turn/end`（agent.ts:339）。
turn 以 `completed`、`max-tokens`、`aborted`、`error`、`blocked` 或 `interrupted`（崩溃留下的孤儿 turn）结束。每个 request header、message、tool call
和 result 都是一个 session event，因此运行过程仅从日志就可重建（"model-visible ⟺ logged" invariants）。

用户看到的反馈是 rendered tool cards（第 7 节）、composed question/approval/plan/todo
界面（第 5–6 节）以及 session-event 派生面板的并集。

## 3. 人类按界面实际观察到什么（全部来自 tests/snapshots）

- **Approval prompt**（仅在 sandbox escalation 时）：一个 composer-takeover 面板 `[data-approval-key]`，区域
  `Waiting for approval`，组 `Approval details` 含 escalation reason + command，按钮
  `Reject` / `Allow once`；回答 `Allow once` 授予单次使用（`approval-composer.e2e.ts:81-138`,
  `snapshots/web/approval-composer/ui.expected.md`）。切换 access mode 显示一个 chip
  `Access mode, current: Read Only` / `Workspace Write` / `Full access`
 （`permission-policy-context.e2e.ts:102-114`）。启用 `Full access`
  需要风险对话框 `确认启用完全权限？`，内含一个未确认前禁用的 `启用完全权限` 和一个
  `我已了解风险，并愿意继续` checkbox（`access-confirmation.e2e.ts:53-72`）。
- **Plan mode review**（仅在 plan mode 中）：`/plan <task>` 进入 plan mode；`exit_plan_mode` 渲染一个 decision
  card `[data-plan-review-key]` 含 `Plan review`、侧栏 `Plan awaiting review` 和按钮
  `Approve` / `Refuse` / `Chat about it`（`plan-review.e2e.ts:80-97`,
  `snapshots/web/plan-review/review.expected.md`）。控制 chip `Plan mode on, press to turn off` 和菜单选项
  `plan Enter or leave plan mode` 存在（`plan-control-row.e2e.ts:48`, `lifecycle-chrome.e2e.ts:147`）。
- **Todo**：一个 `todo_write` tool 行和一个 dock plan strip；golden 文件固定了
  `title=Update to-do list`、`summary=1/4 completed · …`、`suffix=+1` 和 `panel=1 completed · 2 in progress ·
  1 pending` 及按状态分类的项（`apps/web/tests/expected/todo-row/parallel-plan.expected.txt`）。
- **Skill loading**：session catalog 是一个 `system-reminder` `<available_skills>` 块
  （`packages/skill/tool-skill/src/index.ts:254-277`）；一个 `skill` tool 行 `Skill editing-cordis-compositions`
  展开为 `Instructions` + `<skill_content name="…">`；用户的 `/name` 手势直接注入 skill
  （`skill-tool-row.e2e.ts:56-67`, `skill-user-invoke.e2e.ts:118-133`）。
- **Goal bar**：`[data-goal-bar]` 显示 `Ongoing Goal <objective>` 含 `Pause goal` / `Edit goal` / `Clear goal`；
  `/goal` 命令输入提示 `Usage: /goal [<objective>|clear|edit <objective>|pause|resume]`
  （`apps/web/tests/expected/goal-bar/active.expected.md`, `apps/web/tests/expected/goal-command-presentation/ui.expected.md`）。
- **Background work**：session-header 列表 `Background jobs` 显示 `bash sleep 45 running …` 然后
  `signal: SIGTERM …`（settled golden）；触发器变为 `1 background job running` → `1 background job`
  （`background-job-list.e2e.ts:80-121`）。Subagent 作为 `Subagent sessions` 树项出现，标记为
  `continuable`/`one-shot`，状态 `not running`；当 parent 离线时 composer 被禁用但
  `Stop generating` 保持启用（`snapshots/web/subagent-conversation/tree.expected.md`,
  `snapshots/web/subagent-interrupt/offline-composer.expected.md`）。
- **Question composer**（`ask_user_question`）：专用 card `[data-question-key]` 含问题文本、
  每个选项的 checkbox、`Type your answer`、`Skip this question`、`Submit`；侧栏 `Waiting for answer`
  （`question-composer.e2e.ts:103-192`, `snapshots/web/question-composer/ui.expected.md`）。
- **Reported evidence**：tool results 携带 `isError`、一条消息和一个可选的 `meta` 呈现 payload，
  持久化到日志（`tool-calls.ts:267-288`）；子会话不再有独立的 `report` 工具（`tool-subagent-report`
  已删除），其 epoch 结束时由运行时把 outcome 与 final assistant message 作为 settle notice
  交回直接父会话（`packages/subagent/subagent/src/continuation-messages.ts:129-134`、`docs/subsystems/subagent.md:202`）。

## 4. Defaults vs contributor policy vs history-based convention

这是用户要求的关键区分。DSH 的"native development loop"是三层叠加的东西。

**Defaults — harness 运行时强制的内容，与仓库无关。**
- Session permission = `workspace-write` + `ask`，fail-closed（`base/cordis.patch.yml:208-241`）。
- 默认模型 `deepseek-flash`（`base/cordis.patch.yml:75-79`）。
- Plan mode 默认**未激活**；它通过 `/plan on` 或 `exit_plan_mode` 激活
  （`plan-mode/src/index.ts:130-135` 以 `active: false` 初始化；`:136-140` 在切换前原样返回状态）。
- `todo_write` 存在且 `allowParallelInProgress: true`（base `:401-404`, standard preset）。
- Skills：catalog 摘要常驻，全文通过 `skill` tool 按需加载；`/name` 用户手势
  直接注入（`tool-skill/src/index.ts:81-160, 177-204`）。
- 委派：`subagent` 是 `backgroundMode: continuable` → 默认 background，返回 durable id
  （`tool-subagent/src/index.ts:287-305, 385-386`）；child 的交付由运行时在 settle 时以 notice
  送回父会话（`packages/subagent/subagent/src/continuation-messages.ts:129-134`），不再是"子会话必须调用 `report` 工具"的约束。
- Filesystem：`edit` 需要先前的权威 `read`（否则 `FS_NOT_OBSERVED`），而 `write` 是
  `createIfAbsent`/`replaceIfVersion` 基于已观察版本 —— 在**每种** mode 下都生效的 read-before-write 门禁
  （`fs-observation-policy/src/index.ts:65-88`）。
- Tool presentation 默认是 `native`（schema 默认；base `:458-461`，`agent-tool-presentation` 需要
  `mode` 且 Web 行将其留给 `DSH_TOOLS_MODE`）。
- Git hooks，由 postinstall 安装（`lefthook.yml:3`）：`pre-commit` 运行 translation-pairing、archived-note
  guard、staged lint、third-party-notices regen、whitespace、vendor-manifest guard（`lefthook.yml:5-38`）；
  `pre-push` 只运行 `pnpm run typecheck`（`lefthook.yml:52-55`）。
- CI 拥有 exhaustive coverage 和 platform matrix；coverage gate 是 `test:coverage`（per-file 100%），不是
  `test`（`AGENTS.md`, `docs/testing.md`, `scripts/run-gates.ts:612-645`）。

**Contributor policy — AGENTS.md + `dsh-*` skills *建议*的内容（作为 workspace instructions 读取，不由
harness 强制执行）。** 通过 `agent-instructions` 访问，它加载 AGENTS.md 兼容文件到 durable context
（`packages/context/agent-instructions/src/index.ts`），以及通过 skill catalog。关键规则：
- 除了 hooks 之外没有 universal local baseline；运行会为此回归而失败的最窄测试；不默认跑全套；
  不为 commit 或 push 重复已通过的检查（`dsh-pre-push-checks/SKILL.md:29-41`, `AGENTS.md`）。
- 只报告实际跑过的命令；将待定检查报告为待定；报告已检查范围、明确变更、故意保留、
  推迟案例和实际运行的检查（`AGENTS.md`, `dsh-prose-standard`, `dsh-pre-push-checks`）。
- 每个非平凡的变更必须添加一个 Agent Note；生成的目录永不手编；测试描述行为而非正确性
  （`AGENTS.md`, `dsh-doc`）。
- 全量本地预演仅通过显式请求、用于 CI 诊断或不可约的仓库范围变更
  （`dsh-pre-push-checks/SKILL.md:66-68`）。

以上均非 harness 默认值。如果模型选择运行 `pnpm run test`，运行时会很乐意执行；没有任何东西阻止它。
"narrowest evidence" 是模型读取的指导，而不是循环强制的不变量。

**History-based convention — 仓库实际做的事（从 git 可量化，不是强制执行的）。** 来自现有的
[research.md](./research.md) git 检查（写作基线 `0a53fb55be` 的最近 100 个 PR landing merge）：88% 的抽样 PR 涉及 `.agents/notes/`，96% 涉及 tests，90%
涉及 src；整 PR revert 是常态（例如 #2903 以镜像切片方式 revert #2608）；merge-forward
checkpoint 和 stacked/lettered worktree 与纯 `fix/`/`feat/` PR 并存；机器辅助的工作计入
操作者名下。这是观察到的实践，不是任何代码强制执行的规则。

因此对"哪条路最自然"的诚实回答是：harness 给你一个 *default loop*
（workspace-write+ask, plan opt-in, todo, skills, background delegation, read-before-edit, narrow hooks, CI-owned
coverage）。仓库然后增加一个 *policy layer*（minimal evidence, Agent Notes, report-truthfully），模型将其作为
instructions 读取。Git 历史显示该 policy 被实践了（convention）。answer.md 描述的"narrow-evidence slice loop"
是 **policy + convention 层**，而不是 harness default loop。

## 5. 证据矩阵

| 用户可观察的表面 | 证据（类型, file:line / baseline） | 层 |
|---|---|---|
| Approval 面板（escalation） | e2e `approval-composer.e2e.ts:81-138`; baseline `snapshots/web/approval-composer/ui.expected.md`（"Waiting for approval", "Reject", "Allow once"） | Default |
| Access-mode chip / Full-access 风险对话框 | e2e `permission-policy-context.e2e.ts:102-114`; `access-confirmation.e2e.ts:53-72` | Default |
| 模型可见的策略语句 | `permission-policy-context.e2e.ts:135-145`（"Approval policy: ask."）；沙箱拒绝串在 `:161-162` | Default |
| Plan review card | e2e `plan-review.e2e.ts:80-97`; baseline `snapshots/web/plan-review/review.expected.md`（Approve/Refuse/Chat about it; 侧栏 "Plan awaiting review"） | Default（opt-in mode） |
| Plan 控制 chip / 菜单 | e2e `plan-control-row.e2e.ts:48`; `lifecycle-chrome.e2e.ts:147` | Default（opt-in mode） |
| Todo 行 + dock plan strip | jsdom baseline `apps/web/tests/expected/todo-row/parallel-plan.expected.txt` | Default |
| Skill catalog + loader 行 | e2e `skill-tool-row.e2e.ts:56-67`; `skill-user-invoke.e2e.ts:118-133`; 源码 `tool-skill/src/index.ts:254-277` | Default |
| Goal bar | baseline `apps/web/tests/expected/goal-bar/active.expected.md`; `apps/web/tests/expected/goal-command-presentation/ui.expected.md` | Default（opt-in tool call / `/goal`） |
| Background job 列表 / subagent 树 | baseline `snapshots/web/background-job-list/running.expected.md`; `snapshots/web/subagent-conversation/tree.expected.md`; `snapshots/web/subagent-interrupt/offline-composer.expected.md` | Default |
| Question composer | e2e `question-composer.e2e.ts:103-192`; baseline `snapshots/web/question-composer/ui.expected.md` | Default |
| Tool feedback card 种类 | `presentation.ts`（generic/terminal/diff/search/read/web）; `terminal-card`, `grep-card`, `ptc-round`, `bash-abort-row`, `cordis-tool-round` goldens | Default |
| read-before-edit / no-clobber | 源码 `fs-observation-policy/src/index.ts:65-88` | Default |
| Pre-commit hooks | `lefthook.yml:5-38` | Default（repo-level） |
| Pre-push = typecheck only | `lefthook.yml:52-55` | Default（repo-level） |
| CI 拥有 coverage + platform matrix; coverage gate = test:coverage | `scripts/run-gates.ts:316-332, 612-645`; `ci.yml` lanes | Default（repo-level） |
| "Narrowest test / never full suite" | `dsh-pre-push-checks/SKILL.md:29-41` | Contributor policy |
| "Report only commands run" | `AGENTS.md`（SKILL.md:8, 33 携带 "CI owns …" 框架）；字面句子在 AGENTS.md | Contributor policy |
| "Agent Note per non-trivial change" | `AGENTS.md`; `.agents/notes/README.md` | Contributor policy |
| 整 PR revert / note 承载的切片 / merge-forward | git（`research.md` 第二路） | History convention |

## 6. 对 answer.md 的证伪与精炼

现有的 [answer.md](./answer.md) 是一个关于"最自然的*习惯*"的论证；它与运行时大体一致，但其四个运行时主张
是错误的或夸大的。

1. **Plan mode 不是默认，且"explore first"不是运行时立场。** answer.md §"runtime 合成姿态"
   （research.md 第 48 行）将"先勘察、再计划、批准后 todo 驱动执行"解读为运行时默认。但 plan mode 是
   未激活的，直到 `/plan on` 或模型调用 `exit_plan_mode`（`plan-mode/src/index.ts:130-135, 136-140`）。在
   默认会话中，模型可以在 workspace-write 范围内立即编辑。真正的默认部分是的 *filesystem* read-before-edit 门禁
   （`fs-observation-policy`），它在每种 mode 下都生效。所以"先勘察"部分是一个引擎不变量，部分是一个 opt-in
   plan-mode 指令——answer.md 将它们混淆了。

2. **"人在决策点在环"夸大了。** 默认是 `workspace-write` + `ask`。普通的工作区内写操作根本不需要批准；
   模型直接编辑。人只在 sandbox escalation（approval 面板）、模型自己调用 `ask_user_question`、
   plan review（opt-in）以及切换到 Full access 时才被打断。answer 的"人在决策点在环，其他时候不打扰"
   仅在这些点上成立，而非在每个决策点。

3. **Plan-review 按钮不是 "Approve / Keep planning"。** 插件的 seam 默认是 `Approve` /
   `Keep planning`（`plan-mode/src/index.ts:71-75, 306-309`），但 Web decision card 渲染的是
   `Approve` / `Refuse` / `Chat about it`（`snapshots/web/plan-review/review.expected.md`；刻意不是
   通用 question flow，`plan-review.e2e.ts:84-85`）。`Keep planning` 是通用通道的 fallback 标签，不是
   Web 用户看到的。在 `apps/web/tests/**` 中**不存在** `Keep planning` 字符串。

4. **"Fork stays one-shot" 与已发布的 Web preset 矛盾。** Base 注释说 fork 是 one-shot
   的，`backgroundMode: one-shot`（`base/cordis.patch.yml:356-367`），但 standard preset 声明
   `tool-subagent-fork` 时 `backgroundMode: continuable`（`standard/agent.cordis.yml`）。因此 Web 默认的 fork
   是 background-by-default 的，和 `subagent` 一样，不是 foreground。"Background-priority delegation"（research.md
   旁注）在 Web 中适用于两个工具，但 base 的 one-shot 声明不是 Web 默认。

5. **层分类。** 最尖锐的修正：answer.md 将"窄证据切片闭环"命名为 *the* DSH native habit，但该闭环是这个 *repo*
   的 contributor policy + history convention，而不是 harness 默认。Harness 默认循环是第 4 节中的
   permission/todo/plan/skills/delegation/read-before-edit/CI ownership 骨架。运行时从不动用
   "narrowest test"或"Agent Note"；那些是模型读取的指令以及 git 历史显示贡献者遵循的实践。

## 7. 诚实边界

- 上述 UI 文案来自英文 golden snapshots，除非另有说明（`access-confirmation` 有中文 goldens）。
- Plan-review card 的第三个操作是 `Chat about it`（不是 `Keep planning`）——已核实，而非猜测。
- 没有测试/snapshot 断言 approval `reason` 的*确切* *prompt* 文本，超过 `ui.expected.md` 的那一行，
  也没有 skill-catalog 摘要的精确文本，超过 `<available_skills>` 框架和 `skill-invocation-policy` 菜单选项。
- `pin-browse-picker.overlay.yml`、`goal-bar.overlay.yml` 和 `goal-multi-turn-actions/replay.override.json` 是
  配置/固定文件，不是 UI 文案。
