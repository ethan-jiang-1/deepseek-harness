# 静与动：read-only 层与动态层的分界

> **道 · 静与动。** 本页回答 agent 开发里最容易糊涂的问题：哪些东西是 read-only 的、哪些每轮都在变、边界由谁管。静态层怎么组织见 [`归属`](./02-legibility-ownership.md)；动态层在运行时怎么被消费见 [`披露管线`](./12-progressive-disclosure-pipeline.md)——本页拥有的是**分界本身**。

## 为什么要有这道

传统代码里这件事不用想：代码是静态的（编译进产物），内存是动态的（进程私有），界限由语言和操作系统替你管。agent 开发多出两样东西，界限没人替你管了：

- **模型每轮看到的上下文**——既不是代码也不是内存，是每次请求重新组装出来的（system prompt、工具清单、历史）；
- **会话状态**——跨轮存活、事后要能回放，既不能当临时变量丢，也不能当静态文件存。

于是「数据放哪、状态谁管、变了谁通知」全成了设计决定。放错了的典型症状：同一个事实存两处（分叉）、会话回放不出来（不可调试）、agent 每轮重新发明上轮刚学的东西（健忘）。

## DSH 怎么应对：四层，每层一种变化速度

| 层 | 变化速度 | DSH 承载者 | 谁能改 | 丢失的代价 |
|---|---|---|---|---|
| **规则/地图** | 跨版本不变 | `AGENTS.md`、包 README、Agent Note、tier 表 | 只走 PR，merge 才生效 | 高——漂移即 agent 读错 |
| **配置** | 部署时定，运行时显式变更 | `cordis.yml` + overlays + settings 文档（`op: set/unset`，schema 校验，错配 fail loud） | 显式 mutate 操作 | 中——可从文档恢复 |
| **事实源** | 会话内只追加 | session log——每个事件一条，格式带版本号，可整段回放 | 系统追加，不改不删 | 极高——回放不了就没法调试 |
| **派生** | 每轮重算 | snapshot store、system prompt 组装、工具可见集、compaction | 从事实源派生 | 低——丢了能重建 |

关键读法：**越往下越「活」，越往上越「稳」；每一层只被上一层（或显式操作）修改，从不被下层绕过。** 会话里的派生数据永远写不进事实源之上的层——想升级，走显式动作（下文第三条纪律）。

## DSH 怎么落地：三条切换纪律（原话与实物）

**1. 动态的只从事实源派生，不在第二处存真。** DSH 的 packages 规则原文：

> Publish state only at its commit point. … derive caches, prompts, UI echoes, replay, and query views from one authoritative source.

落地形态：客户端的 store 全是快照派生——会话数据在对象层，store 只承载查看/交互状态；UI 回显、回放视图、查询全都从同一个权威源算出来。派生层丢了无所谓，重建就行；**两处存真才是事故**——分叉了没人知道哪边对。

**2. 模型可见的必须落事实源。** 根 AGENTS.md 的规则原文：

> Model-visible ⟺ logged: anything that reaches a model request must be reconstructable from the session log; a new model-visible input requires a session event.

落地形态：每轮组装出的 prompt 快照、工具清单，变化时重新记录进 session log——所以一次会话能整段回放，「模型当时到底看到了什么」永远答得出来。组装面再花哨（缓存、压缩、可见集收缩），只要这条在，回放就可信。

**3. 动态里产生的持久事实，要升级回静态层。** 会话里做出的决定 → merge 后写 Agent Note / 改 README（知识归位）；会话里改的配置 → settings 文档的 `set` 操作（配置层留档）。反例是让决定只活在会话历史里——**下个会话的 agent 读不到上个会话的聊天记录**，不回写静态层，它就每轮重新发明一遍。这正是 [`变更闭环`](./01-sdlc-change-loop.md) 最后一环「合并后知识归位」的静态/动态版表述。

## 怎么迁移到你的项目

| 层 | 普通项目最小承载者 | 验收 |
|---|---|---|
| 规则/地图 | 短 `AGENTS.md` + README，只走 PR | 会话进行中改不动它 |
| 配置 | 一份 config 文件 + 显式 reload | 改配置有校验、有报错，不错配静默 |
| 事实源 | 任务/会话日志：append-only、带版本 | 重开进程能回放整段历史 |
| 派生 | 每轮从日志重建的上下文 | 删掉派生层，功能照常 |

## 学走形的检查

- **把派生当事实源存**——两处「真」，分叉只是时间问题。检验法：这个数据丢了大不大？丢了不心疼的，就不是事实源。
- **动态层走私**——上下文组装、工具结果绕过日志直接进模型。检验法：拿日志回放，回放不出模型当时看到的内容就是缺口。
- **不回写**——会话里敲定的方案、踩过的坑，不落 Note/README。检验法：新会话的 agent 是否重复提出已否决的方案（[`决策记录`](./03-decision-notes.md) 的负知识就是防这个的）。

## 证据入口

- [根 `AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/AGENTS.md)：model-visible ⟺ logged 的原始规则。
- [`packages/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/AGENTS.md)：commit point 发布与单权威源派生。
- [session log 机制](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/session-format-status.md)：格式版本与已发布会话数据的迁移纪律。
- [system-prompt 子系统](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/subsystems/system-prompt.md)：`PromptContext` 作为 cache-safe 的动态层——变化或被压缩时才重新记录快照。
- [SDLC Tutorial 05](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-tutorial/05-review-and-merge.md)：合并后知识归位——第三条纪律的完整演示。
