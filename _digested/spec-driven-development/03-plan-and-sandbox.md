# 03 · Plan Mode：把计划变成可审批对象

## 一句话

Plan Mode 是 DSH 产品原生的“先规格、后执行”模式：agent 在计划态里只读探索，把计划写成另一位工程师无需再做设计决定即可实现的 decision-complete 文本，再通过 `exit_plan_mode` 交给用户审批。它是**可选**能力，并且是**软引导**——真正的写权限限制由 sandbox 和 approval policy 独立执行。

## 1. 可选与软引导

- `dsh-plan-mode` 是独立包，agent loop 不依赖它。
- 文档明确说 Plan mode 是 soft guidance；sandbox 和 approval policy 不读也不写 plan state，需要强限制时必须单独配置。
- 它贡献 `plan:policy` prompt section、`exit_plan_mode` 工具和 `/plan` 命令。

来源：`docs/subsystems/plan.md:5`、`packages/plan/plan-mode/README.md:5,94`

## 2. coding preset 中的计划合同

`apps/cli/config/agent-presets/code/agent.cordis.yml` 的 plan section 要求：

- 先只读探索，不改文件、不跑会重写文件的 formatter/codegen、不提交。
- 计划必须 decision-complete：目标与成功标准、按 subsystem 分组的修改、public API/schema/data-flow 变化、edge cases/failure modes/tests/acceptance criteria/explicit assumptions。
- 详细到另一位工程师可以不由他来重做设计决定。
- `todo_write` 只在批准后的实现阶段使用；完整计划必须通过 `exit_plan_mode` 提交。
- 如果 review channel 不可用或用户保持 planning，agent 必须留在 plan mode，不能继续实现。

来源：`apps/cli/config/agent-presets/code/agent.cordis.yml:121-131`（同款规则也出现在 standard/cordis preset）

## 3. exit_plan_mode 审批

`exit_plan_mode` 的 execute 路径：

1. 要求存在 calling agent；
2. 要求当前 plan mode active；
3. 校验 plan 是非空 Markdown 且以 `#` 标题开头；
4. 通过 `ctx.userQuestions` 的 `plan-review` 交互展示计划；
5. 只有用户选择 `Approve` 才返回 `{ approved: true }` 并安排退出；
6. `Keep planning` 或自定义反馈是失败调用，把用户反馈带回模型。

来源：`packages/plan/plan-mode/src/index.ts:346-414`、`docs/subsystems/plan.md:33`

## 4. 计划在会话里的位置

- `plan/mode` 是 session log 中的持久状态事件，只记录 `{ active: boolean }`，resume/fork 可恢复。
- 计划正文作为 `exit_plan_mode` 的 `plan` 参数和 review 结果进入 conversation history，不是独立文件 home。
- 因此 Plan Mode 的“spec”不是一份仓库文档，而是一次可审批、可恢复、可留在会话历史的计划对象。

来源：`packages/plan/plan-mode/README.md:9,86`

## 证据入口

- [`docs/subsystems/plan.md`](../../docs/subsystems/plan.md)
- [`packages/plan/plan-mode/README.md`](../../packages/plan/plan-mode/README.md)
- [`packages/plan/plan-mode/src/index.ts`](../../packages/plan/plan-mode/src/index.ts)
- [`apps/cli/config/agent-presets/code/agent.cordis.yml`](../../apps/cli/config/agent-presets/code/agent.cordis.yml)
