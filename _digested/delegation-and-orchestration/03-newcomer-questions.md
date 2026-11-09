# Questions Newcomers Ask · 新手十二问

本页事实的源码入口在页末。每问只给结论与一句理由，深读指向机制页。

> 本页用到的词（Agent、child、Session、Activation、PTC、preset、能力面）在 [`02` 词与平面](./02-terms-and-planes.md) 有逐条定义；这里不重复。

## 一句话

这十二个问题覆盖了新人第一次用委派时 90% 的困惑，而且大多不是「怎么用」，是**「它到底在哪」**：在哪个上下文、哪个进程、哪个平面。

## 十二问

### 1. 子代理看得到我们刚才的对话吗

默认看不到。`subagent`（fresh）只拿你写进 `prompt` 的内容；要让它带着对话往下做，用 `subagent_fork`——它继承父**已完成轮次**的前缀，当前进行中的那一轮看不到。

历史与权限是两件事：fork 虽然带历史，工具面、权限与 cwd 仍然按 child 自己的组合与捕获规则来。深读 [`primitives/02`](./delegation-primitives/02-bounded-delegation-with-fresh-and-forked-subagents.md)。

### 2. 我关掉 dsh，子代理还在跑吗

不跑。运行在执行面，进程结束就结束。但 child 是 durable 会话：回到原会话后，父仍可用 `send_message` 让它**冷恢复**（不经过任何 provider）。

后台 job 不同：注册表与输出 ring 在内存，进程没了就没了；只有已经写进 Session 的事件还在。深读 [`primitives/05`](./delegation-primitives/05-background-jobs-and-wall-clock-schedules.md)。

### 3. 为什么子代理拿到了父的全部工具

因为 shipped 组合里没有任何 per-child 工具过滤。child 的工具面是按父的 preset 重新 join 出来的，所以看起来「什么都没变」。

能收窄的只有一条现役路径：给 spawn 行钉一个更薄的 preset。深读 [`composition/03`](./preset-composition-and-contract-placement/03-worker-profiles-and-the-only-narrowing-lever.md)。

### 4. 能不能让子代理用更便宜的模型

只有当那个工具行开启了模型选择时，参数面里才会出现 `provider` / `model` / `reasoning_effort`。base 的 `subagent` 行没开，web preset 开了；shipped 的 `subagent_fork` 行也不开——它要保持与父同路由以复用前缀缓存。工具本身支持对继承上下文的 provider 开启模型选择，但会警告前缀复用可能失效。

外部 provider（Codex、Claude Code、ACP、SDK）自管运行时，能力位更少，参数面也不同。深读 [`composition/01`](./preset-composition-and-contract-placement/01-channel-capability-differences-and-inheritance.md)。

### 5. 子代理失败会自动重试吗

不会。委派、workflow run、job 都不自动重试；**重试是父代理自己写的策略**，要有上限、要有停止条件。

模型请求层的 retry 是另一层：那是 LLM provider 对一次请求的处理，与「这次委派失败了要不要再来一次」无关。深读 [`observation/02`](./completion-and-observation/02-terminal-states-and-bounded-retry-authority.md)。

### 6. workflow 里的 `null` 是什么

局部失败：子代理自己没跑完（`stopReason` 非 `completed`），或某个 stage / thunk 抛错。`parallel` 与 `pipeline` 把这类失败降到那一项，其余项照跑。

fatal 不会变成 `null`：写错的选项、非法 schema、触到 cap 都会杀掉整个脚本。这两级是刻意分开的。深读 [`primitives/01`](./delegation-primitives/01-scripted-workflow-and-sandboxed-fan-out.md)。

### 7. workflow 里 `log()` 的内容模型能看到吗

前台看不到：父对话只收脚本的返回值。后台更明确：`log()` 进 job 输出 ring 的 `log` channel，而模型的 `job_output` 不渲染这个 channel——它只给人看。

所以「进度看得见」与「模型知道进度」是两件事。深读 [`primitives/01`](./delegation-primitives/01-scripted-workflow-and-sandboxed-fan-out.md) 的后台模式节。

### 8. goal 明明做完了，为什么还在开下一轮

因为「做完」是你说的，不是工具状态说的。停自动续跑的路径不止一条：`complete`（模型自报）、`blocked`、人显式 `pause`，或轮次到上限——其中只有 `complete` 声称做完了，而它也只是自报，不证明目标达成。深读 [`primitives/04`](./delegation-primitives/04-cross-round-goals-and-the-round-driver.md)。

### 9. resume 之后 goal 为什么不动了

因为 resume / fork 之后，active goal 是 **disarmed** 的：目标还在，续跑许可没了。要显式 `resume` 才继续。

这是有意的：恢复出来的会话不该自动接着烧钱。深读 [`primitives/04`](./delegation-primitives/04-cross-round-goals-and-the-round-driver.md)。

### 10. 装了 Team，为什么 `subagent` 工具没了

因为 Team 的组合 patch 把四行 disable 了：`tool-subagent`、`tool-subagent-fork`、`tool-subagent-control`、`tool-subagent-list-agents`。直接委派改由 `spawn_teammate` 与成员级消息承担。

底层 subagent 服务没有消失，workflow 仍然用它；消失的是**模型可见的那几个工具**。深读 [`primitives/06`](./delegation-primitives/06-persistent-teams-with-a-shared-task-board.md)。

### 11. 怎么证明「模型真的会选 workflow」

要分层证明，不能一步到位：工具声明里有 → 组合把它挂上 → 某次请求的有效工具面里有 → 行为里真的调了。前两层绿不推出后两层。

挂载绿只证明挂载。深读 [`observation/07`](./completion-and-observation/07-evidence-layers-declaration-mount-mechanism-behaviour.md)。

### 12. 到底能套几层

深度是**绝对量**：child = parent 深度 + 1，默认上限 1，所以默认只有一层。`subagent` 工具把 `maxDepth` 传给服务；workflow 的 `agent()` 不传这个上限，**但分支 child 仍然计数**——在分支里再 spawn，撞的还是同一个绝对上限。

「没有闸」不等于「不计层」。深读 [`composition/06`](./preset-composition-and-contract-placement/06-depth-concurrency-and-capacity-limits.md)。

## 一条共同线索

十二问里多数先落在**执行面**：谁在跑、拿到什么上下文、怎么停（2、5、6、7、9、10、12）。少数在**持久面**（活过进程吗：2、8、9）与**观测面**（看见的是不是事实：11）。第 3、4 问属于**组合**：它们问的是这个组合给了它什么能力面。

同一个困惑常常横跨两面——先分清平面，答案通常只剩一句。判平面的方法见 [`02`](./02-terms-and-planes.md)。

## 本页事实的出处

| 事实 | 出处 |
|---|---|
| fresh / fork 的历史边界 | `packages/subagent/tool-subagent/src/index.ts:113`-`137` |
| 冷恢复不经过 provider | `packages/subagent/subagent/src/manager.ts:1254`-`1329` |
| job 进程内、随 harness 结束 | `packages/jobs/jobs-local/README.md:12`、`:61` |
| child 按父 preset 重建工具面；shipped 组合不配 toolFilter | `packages/subagent/subagent/src/child-agent.ts:186`-`218`、`packages/subagent/tool-subagent/src/index.ts:147`-`151` |
| 模型选择参数的出现条件 | `packages/subagent/tool-subagent/src/index.ts:214`-`262`、`packages/bundle/web-app/presets/cordis.patch.yml:92`-`103` |
| workflow 的 `null` 与 fatal 两级 | `packages/workflow/workflow/src/index.ts:121`-`148` |
| `log` channel 仅人可见 | `packages/workflow/tool-workflow/src/record.ts:1`-`6` |
| goal 的创建语义与 resume / fork 后的 disarm | `packages/goal/tool-goal/src/index.ts:51`-`54`、`:117` |
| Team 的四个 disable 行 | `packages/experimental/agent-team-profile/cordis.patch.yml:3`-`14` |
| 证据分层 | `docs/testing.md`、[`observation/07`](./completion-and-observation/07-evidence-layers-declaration-mount-mechanism-behaviour.md) |
| 深度的绝对量与 workflow 分支计数 | `packages/subagent/subagent/src/child-agent.ts:49`-`58`、`packages/subagent/subagent/src/index.ts:196`、`packages/subagent/subagent/src/depth.ts:20`-`35`、`packages/workflow/workflow-ptc/src/host.ts:203`-`219` |
