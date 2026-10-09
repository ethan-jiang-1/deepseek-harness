# 02 · 一份 `session.jsonl` 到底是什么：它就是 trajectory

## 一句话

**是的，它就是 trajectory——而且是比通常意义的 trajectory 更完整的一种**：一行一个事件、首行是 header，里面按顺序记着 turn/step 边界、模型**实际收到**的请求头、模型的完整输出流、每一次工具调用与结果。它同时还有两个普通 trajectory 没有的性质：**可重放**（回放器能从中反推出模型脚本）和**可断言**（跑完之后的持久化结果要和它比对）。

这一篇只做一件事：把这份文件拆开，让你看清楚它有什么、缺什么。因为「插件能不能用」完全取决于这两点。

## 实测：一条最小 trajectory 长什么样

`snapshots/session/bash-tool-turn/` 的一次运行，按行顺序展开如下（本工作树实测）：

```text
session                  ← header：版本、id、cwd、delegationDepth
permission/preset        ← 权限预设
sandbox/mode             ← 沙箱模式
approval/policy          ← 审批策略
agent/inbox/spliced      ← 用户输入入队
turn/start               ← turn 1 开始
agent/inbox/spliced      ← 输入被消费、从队列移除
step/start               ← step 1 开始
system/message           ← 系统提示词（surface node 0）
user/message ×2          ← 用户消息 + 运行上下文
request/header           ← 模型收到的请求头：config + tools
request/context          ← provider/model
session/title            ← 标题
assistant/message        ← 模型输出：reasoning + tool-call 两块
tool/call                ← bash("echo TERMINAL_OK")
tool/result              ← isError=false
step/end
step/start               ← step 2
assistant/message        ← 模型输出：reasoning + text
step/end
turn/end
```

22 行，一次完整的「用户提问 → 模型决定调工具 → 工具执行 → 模型总结」闭环。**这不是日志摘要，这是可回放的轨迹。**

更重的一些场景事件类型更多，但结构相同。三个实测样本：

| 夹具 | 行数 | 事件类型 |
|---|---|---|
| `session/bash-tool-turn/session.v4.jsonl` | 22 | 17 种，含 `tool/call` + `tool/result` |
| `session/agent-instructions/session.v3.jsonl` | 39 | 20 种，含 `compaction/start`+`summary`+`end`、两次 `request/header` |
| `session/subagent-multi/session.jsonl` | 50 | 含 `assistant/chunk`×18、`reasoning-chunks`、`tool-call-chunks`、`text-chunks` |

模型流有两种记法，取决于世代（`docs/testing.md:17`）：**V0 / V1 的历史夹具**把流记成显式的 `assistant/chunk` 行（实测 `snapshots/session/text-turn/session.v1.jsonl` 有 8 条 `assistant/chunk` + 1 条 `reasoning-chunks`）；**V3 / V4 的较新夹具**一行一事件，流以紧凑形式内嵌在 `assistant/message` / `assistant/attempt` 里（实测 `snapshots/session/bash-tool-turn/session.v4.jsonl` 没有任何 chunk 行）。回放两边都认——README 的说法是「Replay expands the compact stream on each current-view `assistant/message` or `assistant/attempt`」。

## 它比「一份 trajectory」多出来的三样东西

### 1. 模型真正收到的请求头

`request/header` 是这一层的核心资产。它记的是**组装之后**发给模型的东西：provider/model、工具目录、以及（在按 pin 提交的场景里）系统提示词。

这条设计的全部意义在 [01](./01-why-dsh-needs-it.md) 讲过：只有真夹具能钉住组装后的完整集合。所以：

- `system/message` 事件的正文被替换成 `{{system}}`，完整提示词落在 sidecar `system-prompt.expected.md`；
- `request/header` 里的工具 schema 被替换成 `{{tools}}`（**保留字段存在性**），完整目录落在 `tool-schemas.expected.json`；
- 两者都通过 `scrubSystemPrompts` / `scrubToolSchemas` 完成，且这些变换是**幂等**的（`packages/test-support/session-snapshot/src/normalize.ts:515`、`:531`、`:546`）。

**注意方向**：脱敏是把「体积」搬去 sidecar，不是把「内容」删掉。原文一条不少，只是换了个更好审阅的位置——这也是为什么它没有违反可重建性。

### 2. 身份 token：保留关系，去掉噪声

`{{session:1}}`、`{{message:1}}`、`{{cwd}}` 这类 typed token 不是随机 UUID，而是**首次出现顺序**的编号。所以父子会话的对应关系、消息之间的引用关系，在 fixture 里是可读的，而不是一堆哈希。

生成路径：`redactSessionSnapshotIds()`（`packages/test-support/session-snapshot/src/identity.ts`）+ `tokenizeSessionFixtureCwd()`。

### 3. 它是「投影」，不是「字节录像」

提交进仓的夹具**省略顶层 `seq` / `time` 包络**，回放时用确定性的稠密序号和零时间戳补回来。理由是本地插入一个事件会导致后续一大段重新编号，产生纯噪声 diff。

代价是：**夹具不是逐字节的现场复现**。这一点在插件仓自建夹具时会变成一个具体选择——见 [03](./03-what-a-plugin-can-reuse.md) 和 [04](./04-what-does-not-transplant.md)。

## 它缺什么：四类「日志里根本不存在」的失败

回放器从 `assistant/message` / `assistant/attempt` 的持久化结果**推导**模型脚本。这个推导有个结构性盲区（`packages/test-support/llm-replay/README.md` 的 Design 一节）：

> a non-empty stream without a `finish` chunk is the fingerprint of a thrown `stream()` and must be expressed through an override sidecar.

也就是说，有几类东西**推不出来、只能另写**：

1. **首个 chunk 之前就抛出**（pre-2xx 不接受）：持久化的 Assistant 结算里没有带异常信息的流成员。
2. **接受之后再抛出**（post-2xx 失败）：需要一个部分流加上一个异常。
3. **取消 / 挂起**：需要一个「不终止」的流，而不是一个有限前缀。
4. **注入重试**：要在一个已经推导出来的脚本中间插一次瞬时失败。

这四类都由 `replay.override.json` 表达，条目三种、文档两种，在 [06](./06-bug-reproduction-playbook.md) 里逐个拆。

**这件事对插件仓的意义是正面的**：你不需要为了复现一个「provider 401」「用户中途取消」「流挂住」的 bug 去搭一套新的 mock 基础设施——这个 sidecar 就是为这几类场景设计的。

## 三种粒度，按需取用

看完整份文件之后，可以按三层取用，成本递增：

| 粒度 | 拿它做什么 | 需要的文件 |
|---|---|---|
| **单条事件** | 断言某个事件存在、顺序正确、字段对 | 只要 `session.jsonl` |
| **请求头** | 钉住「我给模型加了什么」（新工具、prompt 注入、投影事件） | `session.jsonl` + `{{system}}` / `{{tools}}` 对应的 sidecar |
| **整条轨迹** | 无 key 重放整轮，当作回归基线 | `session.jsonl`（原始带包络的也可以，见 [03](./03-what-a-plugin-can-reuse.md)）+ 一段挂载 `dsh-llm-replay` 的配置 |

**粒度越高，越接近「主仓那套」；粒度越低，越像普通测试。** 插件仓绝大多数情况停在前两层就够了——这是 [05](./05-plugin-repo-organization.md) 那条阶梯的核心判断。

## 它属于哪个格式版本

`session` header 里的 `version` 字段就是 `SESSION_FORMAT_VERSION`。本工作树的行为：

- **checkout writer**：`SESSION_FORMAT_VERSION = 4`（`packages/core/session/src/types.ts:89`，是代码里唯一手维护的当前写入版本号）；
- **仓库的发布记录**：`docs/session-format-status.md:46` 仍写着 `latestReleasedVersion: 3`（证据 tag `dsh-v0.1.5-alpha.1`），而 `:32` 的定稿记录是 4；本基线 tag `dsh-v0.2.0-rc.2` 的 writer 已经是 4，所以那条发布记录落后于实际发布，不要拿它当「现在装到的 CLI 写哪个版本」的依据。

回放器接受历史版本：解析时会经 build-static 的 format catalog **在内存里迁移**到当前版本再暴露事件（`packages/test-support/llm-replay/src/index.ts:200` 起的 `parseSessionLog`）。这意味着**你录的夹具不会因为 DSH 升版就作废**——它会被就地升级后重放。

但这条保证有边界，独立夹具 owner 要自己承担的部分写在 [04](./04-what-does-not-transplant.md)。

## 这一篇要你记住的

- `session.jsonl` 就是 trajectory，而且带「可重放」与「可断言」两个额外性质。
- 它记的是**模型真正收到的请求头**——这是它不可替代的原因，也是插件最该借用的一层。
- 它缺三类失败（纯抛出 / 取消挂起 / 注入重试），由 `replay.override.json` 补。
- 脱敏是「搬走体积」不是「删掉内容」；省掉的只有 `seq` / `time` 包络。
- 它是**按需取用**的三层粒度，不是必须整体接受的一套制度。
