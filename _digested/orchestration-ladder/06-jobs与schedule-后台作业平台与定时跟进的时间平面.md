# jobs 与 schedule：后台作业平台与定时跟进的时间平面

源码核验入口：`packages/jobs/jobs/`（`README.md`/`src/index.ts`）、`packages/jobs/jobs-local/`、`packages/jobs/tool-jobs/src/index.ts` 与 `README.md`、`packages/shell/tool-bash/src/index.ts`、`packages/schedule/schedule/`（`README.md`/`src/tools.ts`）、`packages/schedule/README.md`、`packages/boot/app-boot/src/profile.ts`。

本页回答：JobRegistry 这个后台作业平台给了什么保证（id、隔离、结算、通知）？谁是 producer？"何时转后台"的官方边界？schedule 的时序语义与交付形态？工具描述里的跟踪纪律（不忙轮询、收尾前收集）见 [`02-什么时候用哪个原语-官方选择决策语义全景.md`](./02-什么时候用哪个原语-官方选择决策语义全景.md)；workflow 与 subagent 两个 producer 的接入细节见 [`01`](./01-workflow-模型编写的JS编排脚本与子代理扇出机制.md) 与 [`03`](./03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md)。

## 为什么是这个形状：设计考量

**为什么是抽象平台合同而不是各工具自己做后台**：没有统一 JobRegistry，每个工具（bash、subagent、workflow）都要自己解决「agent 继续干活时工作挂着、完成了怎么通知、谁有权读停」——四套实现、四种通知语义、四种隔离规则。DSH 把它抽成一个**合同与实现分包**的抽象服务：直接加载 `JobRegistry` 实现类即 throw（组合配错在装载时就失败，而不是运行时静默缺功能）；一个进程一个 registry、owner 相对应答；注册的 job **活得比 producer 和 controller 的 fiber 都长**（`packages/jobs/jobs/README.md` 设计哲学节）。「owner 围栏是授权不是保密」是个精确的取舍声明：id 可预测（`bash-1`），所以边界设计成权限检查而不是隐藏——它防的是**误操作与越权**，不防偷窥。schedule 的交付形态同样是考量结果：提醒**作为原会话里的普通 follow-up message** 交付（不是邮件/短信/推送）——提醒的价值在于带着会话上下文回来继续干活，而不是把你拉走；交付只在 Session 确认 `session/flush` 后 commit——**正确性优先于恰好一次**：崩溃后宁可重投一次，也不交付一个没落盘的提醒。

## JobRegistry：后台作业的平台合同

jobs 不是某个工具的私有功能，而是一个**抽象服务合同**（`packages/jobs/jobs/README.md:12`）：`JobRegistry` 是抽象 Cordis 服务，直接加载实现类即 throw（组合配错在装载时就失败）；`jobs-local` 是 shipped 的进程内实现——**job 随 harness 进程死亡，跨重启的持久执行需要别的后端实现同一合同**（`README.md:33`）。

一个 job 给你什么（`packages/jobs/jobs/README.md:30`-`32`）：

- **稳定 id** `<kind>-N`（如 `bash-1`），producer 注册时给 kind + 一行 label；
- **状态投影**：`running` → `stopping` → 终态 `completed`/`killed`/`failed`，每次读都是新鲜投影；
- **结算经事件流播报**，`tool-jobs` 把它变成会话内通知——不需要轮询；
- **有界输出**：producer 可选字节上限，模型侧每次完整读取或通知都有界。

**owner 隔离是授权不是保密**（`packages/jobs/jobs/README.md:36`-`38`）：job 属于启动它的 agent session，别的 agent 不能读不能停；id 可预测（`bash-1`），所以围栏的意义在授权。无 owner 的 job 对任何 caller 开放、活到 service dispose。

**first-wins 结算 + `awaited` 防重播**（`packages/jobs/jobs/README.md:87`）：一个终局记录、释放全部 waiter、再一轮 contained 事件投递；`settled` 事件报告它是否释放了一个 live `wait`（`awaited`）——所以 `tool-jobs` **从不播报一个等待者已经收集过的完成**（无论是 `job_output` 的 wait 还是 shell 工具等自己前台命令的 wait）。

**输出环的两个受众**（`packages/jobs/jobs/README.md:31`）：producer 用 pull sources（registry 按自己节奏泵的非消费 offset 读者）或经 `JobHandle` 推块，都落进有界 ring——**`stdout`/`stderr` 块进模型，`log` 块只进观察者**（这就是 workflow mirror 的 log 通道不进 `job_output` 渲染的平台根源，[`01`](./01-workflow-模型编写的JS编排脚本与子代理扇出机制.md)）。观察者按绝对字节偏移读留存块、推进有信号；`readAt` 不消费任何东西、对模型不可见；`updateProgress` 把活进度行发布进每个投影直到结算。

**归档联动**（`packages/jobs/jobs/README.md:96`）：`workspace/session-activity` 把该 Session 拥有的 running/stopping job 报成 `job` 家族；`workspace/session-stop` 以 reason `session archived` 逐个 kill（一个 producer 取消时抛错只记日志，其余 job 继续停）；无主 job 永不为某个 Session 报告或停止。

## 四个 shipped producer 与 controller 要求

| producer | job kind | 接入点 |
|----------|----------|--------|
| bash | `bash`（`packages/shell/tool-bash/src/index.ts:278`；后台启动 `:509` 返回 `{kind:'background', jobId}`） | `run_in_background` 参数 |
| pwsh | 同构（`packages/shell/tool-pwsh/src/index.ts:44` 的 `JobKindMap`） | 同上 |
| subagent（one-shot 显式后台） | `subagent`（[`03`](./03-subagent与subagent-fork-有界委派的隔离继承与continuable控制面.md)：`jobs.start({kind:'subagent', owner: parent.id, run})`，无 output sources） | `run_in_background` 参数 |
| workflow | `workflow`（[`01`](./01-workflow-模型编写的JS编排脚本与子代理扇出机制.md)：`JobKindMap` 声明合并 + mirror 写 ring） | `run_in_background` 参数 |

kind 都经 `JobKindMap` **声明合并**注册——加一个 producer 不改 registry。**controller 是启动的闸门**（`packages/jobs/jobs/README.md:40`-`42`）：producer 只能在"有服务该 owner 的 controller 在场"时启动（加载 `tool-jobs` 即挂上一个）；没有 controller 的组合 `start()` 直接失败并**点名缺失的组件**——绝不启动一个 agent 永远收不回也停不掉的工作。

## 通知经济学：完成什么时候打断你

`tool-jobs` 的投递策略（`packages/jobs/tool-jobs/README.md:40`-`42`、`:55`-`57`）：

| owner 状态 | 投递方式 | 效果 |
|-----------|---------|------|
| busy（turn 进行中） | 注入**下一个 step** | **inbox 持有通知时 turn 无法关闭——多个 job 同时结算只花一个 step，而不是每个一个 turn** |
| idle | 唤醒一个 follow-up turn | 未领取的通知 = 模型永远不会知道的完成，必须开 turn |

三种不播报：`awaited`（等待者已收集）、模型自己 `job_kill` 过的、owner/service teardown 造成的（没人读）。

**`maxConsecutiveWakes` 界定自激链**（`packages/jobs/tool-jobs/README.md:42`）：醒来的 turn 可能启动那个"完成时会再唤醒它"的 job——每个 owner 被唤醒这么多次后，后续通知降级为注入；**领取任何用户消息即恢复预算**；默认无上限。超过上限的通知静默等待下一次用户输入——依赖唤醒完成工作的会话会停在预算处。`completionDelivery: 'quiet'` 让 idle owner 也走注入通道（确定性 transcript 需要）。`waitTimeoutMs` 上限 600,000（模型给的更长 wait 被 clamp）；超时的 wait 返回 `[status: running]` 且 job 活着——**超时不是失败**。

## schedule：wall-clock 时间平面

形态与持久性（`packages/schedule/schedule/README.md:12`、`packages/schedule/README.md:12`）：

- due reminder = **原会话里的普通 follow-up message**——不是邮件、短信、推送；
- 任务**跨 Host 重启保留**；**到期交付时 Host 会冷恢复对应 Session**；一次交付只在 Session 确认 `session/flush` 后才 commit——这就是工具描述里 "Delivery can repeat after crash" 的根源（崩溃后重投）；
- catch-up 规则：recurring 任务停机后**只交付最新一次错过的发生**。

六种时序选择器（`packages/schedule/schedule/README.md:31`-`40` 的表）：`after_seconds`（正安全整数延迟）/ `at`（严格未来绝对时刻，显式时区）/ `every_seconds`（固定间隔 **≥60s**，对齐创建时刻）/ `daily` / `weekly`（ISO 星期 1-7）/ `cron`（**五字段 Vixie**，显式 IANA zone）。DST 规则：本地不存在的时刻跳过、重叠取更早且每天只一次；`every_seconds: 86400` 是固定间隔，不等于 daily 的 wall-clock 语义。`title` 必填（trim 后非空、≤120 字符、**从不从 instruction 派生**）。

绑定与操作边界（`packages/schedule/schedule/README.md:50`-`56`）：reminder 绑定**创建它的 Agent Session**；`schedule_list` 只返 active；这些操作**不激活任何 Agent、不读 Session 日志**；显式删除 = 停未来交付 + 删任务行 + 删交付记录，**已进队列的消息不撤回**。update 是 **complete-record CAS**（与创建/删除同一 FIFO）：可跨 kind（daily 改 cron）、保留 id/绑定/状态/历史，等价归一化规则是 no-op，冲突返回 `schedule_conflict` 不覆写。

**与 Session 归档互锁**（`packages/schedule/schedule/README.md:54`）：有 active reminder 的 Session **归档被拒**，直到它们停止；选择停止 = 删除全部 active reminder；unarchive 不复活它们。

**启用面**（`packages/schedule/schedule/README.md:26`-`29`；`packages/boot/app-boot/src/profile.ts:217`）：shipped Web 组合默认**没有** schedule 行——从 Plugins 页（Official 组）启用 experimental optional bundle `dsh-experimental-schedule-bundle`，或写进 profile 的 `dsh.profile.bundles`；`deliveryHistoryDays` 默认 30、`deliveryHistoryRecords` 默认 200；**headless/SDK-only 组合不能单独挂 schedule**——交付依赖 Host Web Session controller 与 Session 持久化后端。

## jobs 与 schedule 与 goal：三个正交平面

| 平面 | 驱动 | 注入通道 |
|------|------|---------|
| jobs（执行平面） | 工作完成时 | 完成通知（busy→step 注入 / idle→唤醒 turn） |
| schedule（时间平面） | wall-clock 到期 | Host 冷恢复 Session 后的 follow-up message |
| goal（目标平面） | objective + idle | Round Driver 的 `<goal_round>` prompt（[`05`](./05-goal-驾驶座用法-objective写法轮预算与终结纪律.md)） |

三条注入通道互相独立：一个 goal round 里可以收 job 完成通知（step 注入不开新 turn），一个 schedule 到期可以唤醒一个 goal 活跃中的 idle agent。官方对「goal vs schedule 怎么选」没有明文路由（[`02`](./02-什么时候用哪个原语-官方选择决策语义全景.md) 矛盾与空白第 5 条）——实操判据：**持续推进到完成用 goal，固定时刻提醒用 schedule**，两者可并存于同一 Session。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/jobs/jobs/README.md` | 平台合同全景：id/owner/first-wins/ring/归档联动 |
| `packages/jobs/jobs/src/index.ts` | 抽象 `JobRegistry` 服务 |
| `packages/jobs/tool-jobs/README.md:40`-`57` | 通知经济学、maxConsecutiveWakes、wait clamp、配置表 |
| `packages/jobs/tool-jobs/src/index.ts:250`-`254` | `tool:jobs` 跟踪纪律 prompt 节 |
| `packages/shell/tool-bash/src/index.ts:278`、`:509` | bash producer：kind 'bash' 与后台启动 |
| `packages/schedule/schedule/README.md` | 六选择器/DST/CAS update/归档互锁/启用面 |
| `packages/schedule/schedule/src/tools.ts:169`-`182` | 四个工具的模型可见描述 |
| `packages/schedule/README.md:12` | 「follow-up message，不是通知推送」形态边界 |
| `packages/boot/app-boot/src/profile.ts:213`-`218` | `OPTIONAL_BUNDLES`：schedule 是 experimental optional |
