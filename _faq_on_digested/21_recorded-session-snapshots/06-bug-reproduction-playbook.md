# 06 · Bug 复现怎么做：从一次真实失败到一条永久轨迹

## 一句话

**做法是把「复现」从「再跑一次试试」变成「重放一条固定的流」。** 具体分三档，代价递增：复用一条现成轨迹 → 手写一条最小 `authored` 轨迹 → 再加 `replay.override.json` 表达日志里根本没有的失败形态。主仓那 32 份 override sidecar 覆盖了其中两类失败，可以直接照抄格式。

## 判据：什么时候值得为它建一条轨迹

不是所有 bug 都值得。按这个顺序问：

1. **这个 bug 需要真模型（或真模型流）才能出现吗？** 如果去掉模型也复现得出来，用单元测试更快——**不要**为了它建轨迹。
2. **它是一个「组装后」的现象吗？** 请求头变了、工具没被注册、投影事件少了、流被取消时收尾错了——这些只有真装配 + 真轨迹看得见。
3. **同样的输入会稳定重现吗？** 模型本身不确定，所以答案取决于你**固定模型流**之后还复现不重现。固定流之后仍复现 → 是产品 bug，值得建轨迹；固定流之后不重现 → 是模型行为问题，轨迹帮不上。
4. **它值得一条长期资产吗？** 一条轨迹要有人重录、有人看 diff。如果一个 bug 修完就再也不会回来（一次性的迁移问题），写在 PR 描述里就够了。

## 三档做法

| 档 | 怎么做 | 代价 | 适用 |
|---|---|---|---|
| **一、复用现成轨迹** | 把你自己的开发机轨迹（或一条已有的场景夹具）挂进 CI，回放比对 | 最低：只要一个文件 + 一段配置 | 修完之后想加一道回归闸 |
| **二、手写最小 `authored` 轨迹** | 只写触发 bug 所需的那几行事件（像 `snapshots/session/error-finish/` 的 `session.jsonl` 只有 16 行） | 中：要懂事件文法 | 从用户报告复现（**避免提交用户数据**，见 [03](./03-what-a-plugin-can-reuse.md)） |
| **三、加 override sidecar** | 用 `replay.override.json` 表达日志重建不出来的失败 | 中高：要懂 `ReplayEntry` 的条目与文档形态 | provider 抛错 / 取消 / 挂起 / 注入重试 |

主仓用 `snapshot.yml` 的 `recording: live | authored` 区分一、二档，并且 `authored` 的场景**永不被 record 覆盖**：

> In RECORD mode, only re-run the `recorded` (live-API) scenarios; the `authored` ones (sidecar-driven errors/cancel) are never re-recorded. — `packages/test-support/session-snapshot/src/suite.ts:1307`

这个区分对插件仓同样值得照抄：**手工构造的失败场景不应该被一次「重新录制」冲掉**。

## 第三档：条目三种、文档两种

`ReplayEntry` 的完整类型（`packages/test-support/llm-replay/src/index.ts:64`）：

```ts
type ReplayEntry =
  | { kind: 'chunks'; chunks: StreamChunk[] }
  | { kind: 'throw'; chunks: StreamChunk[]; message: string; code: string; accepted?: boolean }
  | { kind: 'hang'; readyFile?: string }
type ReplayOverrideDoc = ReplayEntry[] | { patches: { at: number; entry: ReplayEntry }[] }
```

| 写法 | 表达什么 | 主仓提交在案的样例 |
|---|---|---|
| `[{kind:'throw', chunks:[], message, code}]` | **首个 chunk 之前就抛**：pre-2xx 未接受 | `snapshots/session/error-finish/replay.override.json`：`{"kind":"throw","chunks":[],"message":"simulated provider error (HTTP 401)","code":"AUTH"}` |
| `[{kind:'throw', chunks:[…], accepted:true}]` | **已接受之后再抛**：post-2xx 失败 | **无**（只有单元测试：`packages/test-support/llm-replay/tests/llm-replay.spec.ts:1559`） |
| `[{kind:'hang', readyFile}]` | **挂起不终止**，等外部决定性取消；`readyFile` 是回放器在等待前写下的标志文件 | `snapshots/acp/cancel/replay.override.json`：`{"kind":"hang","readyFile":".dsh-snapshot-stream-ready"}` |
| `{patches:[{at, entry}]}` | **在推导出的脚本上打补丁**：保留每个已推导的调用，只替换指定下标；`at` 等于脚本长度即「在最后追加一次重试」 | 形态本身有样例（`snapshots/web/{file-upload-round,goal-multi-turn-actions,lifecycle-chrome}/replay.override.json`）；**「注入瞬时失败再重试」的组合没有样例**（单元测试：`tests/llm-replay.spec.ts:1239`、`:1247`） |

两条容易踩的规则：

- **`chunks` 为空且不写 `accepted` ⇒ 默认为 pre-2xx 未接受**；要表达 post-2xx 失败必须显式写 `accepted: true`（`packages/test-support/llm-replay/README.md` 的 Failure modes and overrides 一节）。
- **字段是封闭的**：解析器用 `hasExactKeys` 拒绝多余字段（`packages/test-support/llm-replay/src/index.ts:695`）。写错字段名会直接报错，不会静默忽略——这是好事。

## 一个真实案例走查：格式兼容性 bug

主仓有一条完整、可核对的样例，正好是「用一个不可重建的历史状态钉住一个 bug」：

**现象**：会话历史里存在一条**参数不是合法 JSON** 的工具调用（`{"command":"echo "QUOTED""}`）。当这段历史被重新序列化进 DeepSeek Messages 协议时，请求直接抛 `LlmError(… 'INVALID_REQUEST')`，第二轮模型调用永远发不出去。

**修法**：`serialize.ts#toolInput()` 不再抛错，改成对无法表达的历史参数使用空输入，持久化内容不变。

**验证它的轨迹**：`snapshots/session/deepseek-messages-invalid-tool-history/`——`recording: authored`，22 行；第 15 行的 `assistant/message` 里带着那条畸形参数，第 16 行是 `tool/call`，第 17 行是它的错误结果 `Error: invalid arguments: "arguments" must be an object`，第 20 行的第二次 `assistant/message` 必须仍然是 `DONE`。

**它为什么钉得住**：如果这个 bug 回来了，第二次模型调用根本不会发生——夹具被少消费一次，`assertConsumed()` 会**明确报错**而不是静默通过：

```
llm-replay: fixture not fully consumed — …; the scenario drove fewer model calls than recorded
```

（`packages/test-support/llm-replay/src/index.ts:1119`。反方向的「调用比录制多」则由 `script exhausted — session requested model call #N` 捕获，`:1078`。）

这个案例值得学的三点：

1. **触发条件是一个「不可重建的历史状态」**——正是轨迹擅长、单元测试不擅长的地方；
2. **断言点在「流程能不能走下去」**，而不只是「输出的字对不对」；
3. **它和修复提交在同一个 commit 里落地**（`1f030b3c1c5aa7164a42f483075c80fe29559f41`，2026-09-16）。

同类的 commit / 轨迹配对还有：`82c6a5e4f4`（assistant block 进 Messages 历史）、`b79a227cec`（Linux 启动前取消）、`61c548e200`（重复权限模式）、`73e38e1758`（前台截止时间包含 confinement 准备）。**每一个都是「修 bug 的同一次提交里新增一个 authored 场景」。**

## 五步流程（插件仓版）

1. **固定现场。** 先把这条轨迹留下来（自己的开发机日志，或据此手写最小版本）。**先确认这次运行本身是对的**——见下面的反面教材。
2. **写断言。** 问：bug 回来时，**什么会变**？是第二次模型调用发不出去？是某个工具结果从 `isError:false` 变成 `true`？是终态文件没被写？**这个断言要和转录独立**。
3. **建独立 oracle（如果涉及世界状态）。** 学 `snapshots/session/background-confinement-failure/workspace.expected/confinement-audit.json`：`{"confineCalls":1,"spawnCalls":0}`——一个**机器可检查的、独立于会话转录的**外部事实。缺了它，你只有「agent 说自己做到了」。
4. **加轨迹到 CI。** 无 key 回放，作为常规测试跑。
5. **写一句它防什么。** 轨迹目录的 `README.md` 里写清：这条轨迹从哪来、触发什么失败、bug 回来时哪个断言会红。主仓用 `snapshot.yml` 的 `recording` 字段和 commit message 承担这件事；你的插件仓用一页 README 就够。

## 反面教材：不要把「坏的运行」录进去

[04](./04-what-does-not-transplant.md) 讲过的 postmortem 0002 在这里要再说一次，因为**它正是「录了一条 bug」的现场**：

- 七个文件系统场景调用的工具根本没注册，日志里是 `UNKNOWN_TOOL`；
- 快照刷新把这些结果**当成新的期望输出**收下了；
- 套件全绿，事故上线。

> The snapshot framework treated any deterministic transcript as valid behavior. — [postmortem 0002](../../docs/postmortem/0002-js-expression-disabled-filesystem-tools.md):34

**落到插件仓的操作规则：录制/刷新之后，必须有人看 diff，并且必须有一条语义断言能独立于这个 diff 说「这不可能」**（旧事故的形态是「工具不存在」，你的插件会有自己的形态）。

## 与 with-key e2e 的分工

两者不是二选一，而是**一次录制、长期回放**：

| | with-key e2e | 轨迹回放 |
|---|---|---|
| 花 key | 是，每次都花 | 只在录制时花一次 |
| 确定性 | 不确定（真模型） | 确定（固定流） |
| 证明什么 | 「现在对真模型还能工作」 | 「组装转录没有意外变化」 |
| 什么时候跑 | 定期 / 发版前 / 改 provider 时 | 每个 PR |

主仓的立场写得很直白（`docs/testing.md:25`）：**「inference is cheap here」，不要吝啬真 API 测试**——但 PR CI 没有 key，所以两者互补、谁也替代不了谁。插件仓如果只有回放，会漏掉「模型换代导致插件行为退化」这一类；只有 with-key，则每次都在赌不确定性。

## 这一篇要你记住的

- 先问「这个 bug 需要真模型流吗」，不需要就别建轨迹。
- 三档做法按代价选，**`authored` 场景不该被重新录制冲掉**。
- override 能表达四类日志重建不出来的失败（pre-2xx 抛 / post-2xx 抛 / 挂起 / 注入重试）；其中**提交在案的样例只有 pre-2xx 抛与挂起两类**，另两类照单元测试的写法自己写。
- **断言要独立于转录**；涉及世界状态就建独立 oracle。
- **录制前先确认运行是对的**——否则你是在把 bug 固化成期望值。
