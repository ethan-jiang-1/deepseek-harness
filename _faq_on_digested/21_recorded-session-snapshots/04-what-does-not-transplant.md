# 04 · 什么搬不出去：语料治理、语义守卫，以及「快照会一致地复现 bug」

## 一句话

能搬走的是**回放机制**；搬不走的是**围绕几百个场景长出来的治理**，以及**判断「这条轨迹是否代表正确行为」的那个能力**。后者不但搬不走，而且如果你误以为它跟着夹具一起来了，就会踩主仓踩过的那个坑——**快照套件曾经为一次真实回归背书**。

## 一、结构性的：这些本来就属于主仓

| 搬不走的 | 为什么 | 出处 |
|---|---|---|
| 顶层 `snapshots/` 树的所有权 | 这棵树只放「以提交的会话 JSONL 为回放输入与期望输出」的测试；其他期望输出留在各自的 app / package / script 下 | `snapshots/AGENTS.md:3` |
| 「进程必须经 `dsh` CLI + shipped profile 启动」 | 不许新增应用入口、隐藏 CLI 模式或可执行场景驱动 | `snapshots/AGENTS.md:5` |
| 四面分工（headless / SDK / ACP / Web） | 它依赖主仓的四个 profile 各自拥有的行为证据；插件仓通常只有一个入口 | `docs/testing.md:14` |
| corpus policy | 基线版本、保留角色上限（11）、V0 覆盖名单、baseline/current 多数派——这是为「一个仓库集中维护 210 个场景」设计的配额制度 | `scripts/session-snapshot-corpus-policy.ts:24`（基线 3）、`:25`（保留上限 11）、`:26`（V0 覆盖名单） |
| corpus gate | 只在 `test:snapshot` 里跑；它把 `*.snapshot.ts` 后缀保留给 7 个指定适配器，并检查每目录一个 pin、借用规则、副作用文件对应关系 | `scripts/session-snapshot-corpus.corpus.ts`、`vitest.snapshot.config.ts:52` |
| `dsh-session-snapshot` 这个包 | 它 `import vitest`，**只能在 vitest run 内使用**——想复用得自己写驱动 | `packages/test-support/session-snapshot/src/index.ts:14` 的模块注释；`src/suite.ts:26` 是那条 `import` |

**这不是「主仓小气」**：这些规则每一条都在解决「几百个场景、多个 owner、持续演进」带来的具体问题。一个只有三五条轨迹的插件仓照抄它们，得到的是没人维护的仪式。

## 二、语义守卫：夹具不会替你判断对错

主仓在事故之后补的这类守卫，是**独立于夹具的断言**。最典型的一条：

> `dsh-session-snapshot` rejects structured `UNKNOWN_TOOL` results in fresh runs and committed session fixtures before they can be committed as expected outputs. — [postmortem 0002](../../docs/postmortem/0002-js-expression-disabled-filesystem-tools.md):41

对应的代码是 `packages/test-support/session-snapshot/src/suite.ts:1347`：

```ts
expect(unknownToolCallIds(log.content), `session ${log.id}: snapshot scenarios must not accept UNKNOWN_TOOL`).toEqual([])
```

**插件仓必须自己写这一层。** 对你的插件来说，「语义上不可能」长什么样是不一样的——可能是一个本该存在的投影事件没有出现、一个本该被拒的参数被接受、一个 tool result 里出现 `isError: true`。这些判断只有你知道，夹具不会替你想到。

## 三、最重要的一条：快照是**变更探测器**，不是**正确性 oracle**

这是主仓用一次真实的、**被快照套件放过**的回归换来的教训（[postmortem 0002](../../docs/postmortem/0002-js-expression-disabled-filesystem-tools.md)）：

> The snapshot suite passed because both outputs matched the refreshed fixtures; it proved deterministic replay of the regression rather than successful filesystem behavior. — 同文件:19

> The snapshot framework treated any deterministic transcript as valid behavior. — 同文件:34

> **A snapshot refresh is fixture production, not correctness review.** Semantic impossibilities such as a missing registered tool need assertions independent of the expected output. — 同文件:46

那次事故里，七个文件系统场景调用了根本不存在的工具，日志里是 `UNKNOWN_TOOL`，而**快照刷新把它们当成了新的期望输出**——套件全绿。原因和 [01](./01-why-dsh-needs-it.md) 提到的残余风险是同一个：

> One recorded session serving as both replay input and expected output can reproduce a bad model script consistently. — [2026-08-24 语料决策](../../.agents/notes/implemented/testing/2026-08-24-session-log-snapshot-corpus.md):78

**推论到插件仓**：如果你录制的是一次**已经坏了**的运行，你会把 bug 一致地固化下来，而且以后每次刷新都会继续为它背书。所以：

1. **录制之前先确认这次运行是对的**——用外部事实（文件真的写了吗？命令真的跑了吗？）验证，别信 agent 的自述；
2. **别让「刷新」变成「接受」**——刷新产物要人工过目，且必须有独立断言兜底；
3. 需要世界状态时，学主仓的 `workspace.expected/`：**提交一份独立于转录的终态树**，并让录制流程不许改写它（`snapshots/AGENTS.md:15`）。

## 四、校准：快照到底解决了多少类 bug

把主仓四篇 postmortem 摊开看，快照并不是万灵药：

| 事故 | 事后钉住它的回归面 | 是快照吗 |
|---|---|---|
| [0001](../../docs/postmortem/0001-acp-default-export-drops-inject.md) ACP 导出形态吃掉 `inject` | 真 Loader 子进程 e2e（`apps/cli/tests/profiles/acp/tests/acp.e2e.ts`，无需 key） | **否**——需要的是真子进程，不是回放会话 |
| [0002](../../docs/postmortem/0002-js-expression-disabled-filesystem-tools.md) `!!js` 让文件系统工具永久禁用 | `verify-cordis-config` 静态门 + 显式 overlay + `UNKNOWN_TOOL` 语义守卫 | **快照是共谋**，修的是守卫 |
| [0003](../../docs/postmortem/0003-web-agent-gui-feedback-loop.md) Web agent 用裸 Vite 糊弄验收 | 分层真路径 e2e（`apps/web/tests/vite-entry.e2e.ts` 等） | **否**——轨迹在这里是**事后取证的记录**，不是回归测试 |
| [0004](../../docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md) Landlock 提示行被误判为沙箱失败 | 原生边界单测 + `snapshots/session/partial-landlock-child-failure/` | **是**——这条才是快照作为组装回归 pin 的样例 |

**四篇里只有一篇把快照当作组装回归 pin。** 但要注意 0003 揭示的另一种价值：那条会话日志是复盘时**唯一能还原现场的证据**——trajectory 的取证价值，和它作为回归测试的价值，是两件事。插件仓同样两者都能用。

## 五、工程性的：几件你得自己安排的事

- **录制花真钱。** 主仓的对策是 record / refresh 严格串行、只有 record 读 `.env`、CI 只读（`vitest.snapshot.config.ts:63`）。插件仓要自己定：轨迹多久重录一次、谁有权重录、重录的 diff 谁看。
- **夹具会随格式升版变成历史资产。** 好消息是回放器会在内存里把历史版本迁移到当前版本（`packages/test-support/llm-replay/src/index.ts:200`）；坏消息是主仓那套「加后继、不改前驱、保留世代」的政策**不适用于你**——你只有一条轨迹时，最省事的做法就是重录，而不是维护世代。
- **没有 `dsh session` 子命令可以查轨迹。** CLI 只注册了 `plugin` 一个子命令（`apps/cli/src/args.ts:188`）。可用的读取面是：Web 会话浏览器的会话头菜单「Download session log」或 `/export`（下载 `dsh-session-<id>.zip`，内部是 canonical 命名的 `.jsonl`）、模型侧工具 `session_search` / `session_event_search` / `session_trace` / `session_event_trace` / `session_event_read`、以及 `ctx.sessionQuery` 服务。**手工看的话，它就是 newline-delimited JSON，直接 diff 就行。**
- **并发子代理会绑错脚本。** 回放器按 first-call-order 把活会话绑到录制脚本上，这是它自己声明的已知限制；如果你的插件涉及并发委派，这条轨迹不能当回归基线。

## 这一篇要你记住的

- 语法可以照抄，**判断不能外包**——语义守卫必须由你这个领域的 owner 来写。
- **录制一次坏运行 = 把 bug 固化。**「刷新是生产夹具，不是正确性评审」是主仓用真实事故换来的句子。
- 四篇 postmortem 里只有一篇用快照当回归 pin——**它是重要的一层，不是唯一的一层**。
- 工程细节（录制成本、世代、读取工具、并发绑定）都要自己拍板，没有现成制度可继承。

那么问题就变成：**知道了这些边界之后，插件仓到底该怎么摆？** 见 [05](./05-plugin-repo-organization.md)。
