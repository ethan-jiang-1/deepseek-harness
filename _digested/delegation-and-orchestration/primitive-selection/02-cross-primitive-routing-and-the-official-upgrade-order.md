# Cross-Primitive Routing and the Official Upgrade Order · 跨原语路由与官方升级阶梯

源码核验入口：`packages/workflow/tool-workflow/src/index.ts`、`packages/experimental/tool-ralph/src/index.ts`、`packages/goal/tool-goal/src/index.ts`、`packages/subagent/subagent-fork-in-process/README.md`、`packages/experimental/agent-team-profile/README.md`、`packages/todo/tool-todo/README.md`、`packages/jobs/README.md`、`packages/bundle/base/cordis.patch.yml`。

本页回答：原语之间**官方怎么互相路由**？从轻到重的升级顺序有没有明文证据？为什么 DSH 把路由放在工具里而不是中心调度器（设计后果见 [`perspectives/03`](../design-perspectives/03-why-primitives-instead-of-a-central-scheduler.md)）？逐原语边界句见 [`selection/01`](./01-per-primitive-usage-sentences-from-tool-descriptions.md)，空白见 [`selection/03`](./03-unspecified-gaps-and-contradictions-in-usage-policy.md)。

## 读完你能回答

- 原语之间怎么互相路由，谁能引用谁？
- 从轻到重的升级阶梯有哪些明文证据？
- 什么信号该升级，什么信号不该？

## 心智模型

核心判断：**选择不是挑工具，是按「循环归谁、承诺多深」排序。**

- 官方给的是各自的边界句与句间互指，不是一张推荐顺序表；阶梯是本组从证据整理出来的。
- 升级不由系统自动完成，要模型或人决定。
- 默认停在能完成工作的最浅一层；更深只在出现明确信号时用。

## 跨原语路由规则汇总

| 关系 | 官方句子（出处） |
|------|------------------|
| workflow → subagent（互斥推荐） | "For one or two delegations, prefer plain subagent calls."（`packages/workflow/tool-workflow/src/index.ts:329`） |
| ralph → goal / subagent / workflow（三分路由） | "Use same-session goal tools for ordinary long-running objectives, and plain subagents or workflows for bounded delegation and fan-out."（`packages/experimental/tool-ralph/src/index.ts:408`） |
| ralph → goal | "Ordinary long-running same-session work belongs to goal tools."（`packages/experimental/tool-ralph/src/index.ts:181`-`182`） |
| goal → 单轮（互斥） | "not for single-turn work"（`packages/goal/tool-goal/src/index.ts:54`） |
| subagent(fresh) ↔ subagent_fork | "Choose fork when… Choose spawn when… or an out-of-process backend when the child must not share this process."（`packages/subagent/subagent-fork-in-process/README.md:32`） |
| agent-teams ↔ subagent/fork（互斥替代） | "The `subagent` and `subagent_fork` tools and overlapping global child controls are disabled."（`packages/experimental/agent-team-profile/README.md:49`） |
| agent-teams → spawn/fork 语义复用 | `spawn_teammate` 的 `context` 参数："fresh starts without Lead history; fork inherits completed Lead turns. Defaults to fresh."（`packages/experimental/tool-agent-team/src/index.ts:202`） |
| todo_write ↔ exit_plan_mode（plan 模式内互斥） | `packages/bundle/base/cordis.patch.yml:340` |
| ask_user_question ↔ 自行查证 | `packages/bundle/base/cordis.patch.yml:342` |
| jobs ↔ 各 producer 工具 | workflow 的背景参数描述指名 `job_output`/`job_kill`（`packages/workflow/tool-workflow/src/index.ts:405`）；subagent 已无 `run_in_background` 与 job 字样 |
| todo_write 并行开关 ↔ 编排原语 | "Set `true` for agents that may run work concurrently (subagents, background commands, workflow fan-out)"（`packages/todo/tool-todo/README.md:36`） |
| workflow → subagent（构成性） | workflow 脚本钩子 `agent(prompt, opts)` 就是 subagent 调用（`packages/workflow/tool-workflow/src/index.ts:161`） |

## 官方升级阶梯（从轻到重的排序证据）

1. **todo_write**（最轻）："skip it for trivial single-step tasks"——多步但不扇出。
2. **subagent**（一两次委派的默认档）："For one or two delegations, prefer plain subagent calls."——官方把 subagent 定为 workflow 之下的默认。
3. **workflow**（规模扇出）："fans out across many independent pieces… instead of delegating turn by turn"——从逐轮委派升级为脚本编排，且需用户显式要求。
4. **ralph**（长程 fresh-agent 循环）：仅人类显式要求，且被官方从 goal 中分出（"Ordinary long-running same-session work belongs to goal tools"）。
5. **goal**（跨轮次长目标的默认档）：不需要用户说出 "goal"，从请求语义推断。
6. **jobs / schedule**（正交平面）：jobs 是执行平面（"without blocking its own turn"，`packages/jobs/README.md:12`），schedule 是时间平面（wall-clock 提醒），不与阶梯竞争而是叠加。
7. **agent-teams**（部署级 opt-in 顶配）：模型侧政策只声明 "Agent Teams is available in this session"；是否启用由 optional bundle 与部署决定。

## 设计后果：选择面 = 安装面

路由知识随工具走，带来三个对插件作者直接有用的推论：①**看不见的原语不会被选中**——没装 `workflow` 的工具行，它的边界句也不在模型视野里；②**替换工具 = 替换策略**，不需要同步任何中心配置，但也不存在一个“总开关”能改全部选择语义；③**没有任何组件替你校验选择是否正确**，选择正确性只能靠证据（声明面、挂载、行为探针，见 [`observation/07`](../completion-and-observation/07-evidence-layers-declaration-mount-mechanism-behaviour.md)）。

## 常见误解

| 你以为 | 实际上 |
|---|---|
| 有一张官方推荐顺序表 | 只有边界句与互指；阶梯是整理出来的 |
| 系统会自动升级原语 | 没有自动升级 |
| 装了更重的原语就该用它 | 默认停在最浅的一层 |

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/workflow/tool-workflow/src/index.ts:158`、`:329`-`333` | workflow description 与 `tool:workflow` 互斥推荐句 |
| `packages/experimental/tool-ralph/src/index.ts:177`-`182`、`:405`-`409` | ralph 边界句与三分路由节 |
| `packages/goal/tool-goal/src/index.ts:52`-`54` | goal 的“长目标默认档 / 不做单轮” |
| `packages/subagent/subagent-fork-in-process/README.md:32` | fresh ↔ fork 的选择句 |
| `packages/experimental/agent-team-profile/README.md:49` | teams 与 subagent/fork 的互斥替代 |
| `packages/todo/tool-todo/README.md:36` | 并行开关与编排原语的关系 |
| `packages/jobs/README.md:12` | jobs 作为执行平面的定位 |
