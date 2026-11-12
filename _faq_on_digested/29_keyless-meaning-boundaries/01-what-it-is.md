# 01 · 它是什么

这一篇从零讲清 `keyless` 是什么。不预设你之前理解错了什么，只讲事实。

## 名字

`keyless` = `key` + `less`。

这里的 **key 就是模型 provider 的 API key**——`DEEPSEEK_API_KEY`、`EXA_API_KEY`、`PERPLEXITY_API_KEY` 这一族。不是磁盘密钥，不是认证 token。

所以字面意思就一句：**这件事不需要模型 API key。**

为什么不需要？因为**它不调用模型**。

## 核心做法

要让测试覆盖到真实行为，最理想是真调模型。但真调模型有三个硬约束：要 key、要花钱、每次回答还不一样。

`keyless` 的做法是**把这三个约束一次性解决掉**：

> **让真模型跑一次，把它的回答录下来；以后每次都放这段录像，其余全部照跑。**

具体到一次请求：

```text
真调模型（with-key）：
  你的代码 → 组装请求 → 【真模型】→ 说「调用 X 工具」→ 工具执行 → 结果落盘

回放（keyless）：
  你的代码 → 组装请求 → 【录像】  → 说「调用 X 工具」→ 工具执行 → 结果落盘
```

**只换了中间那一格。** 你的代码、请求组装、工具注册与派发、结果写盘——全部是真跑的。

这是理解 `keyless` 最关键的一点：**它不是模拟，也不是简化版。** 它把「模型说了什么」这一件事固定住，其余一切保持真实。`dsh-llm-replay` 的 README 对此的措辞是 *"run the scenario exactly as if the model had produced the recorded output"*——让真 agent 以为模型真答了。

## 它由三部分组成

| 组件 | 做什么 | 花 key 吗 |
|---|---|---|
| **record** | 真调模型跑一次，录下结果 | 花，但只需要一次 |
| **snapshot** | 那份录制去噪后提交进仓库 | 不花 |
| **replay** | 拿 snapshot 当剧本，用当前代码重跑并比对 | 不花 |

三者不是三个档位选一个，是**一条流水线上的三个环节**：`record` 生产，`snapshot` 保存，`replay` 消费。

一句话：**录制一次，验证无限次。**

## 值不值得这样绕

值得，因为绕过去的那一步很贵，而绕开之后**证据的强度几乎没损失**——前提是你理解它损失了什么（见 [04 边界](./04-boundaries.md)）。

具体收益：一份 `record` 的投入，换来的是**每一个提交 PR 的人都跑得起来**的完整流程测试。这个交换在开源协作下几乎是压倒性的，因为大部分人根本拿不到 key。

## 它在仓库里长什么样

`keyless` 不是某一个包，是一组协作的包与配置：

| 位置 | 作用 |
|---|---|
| `packages/test-support/session-snapshot/` | snapshot 套件工厂：场景表、夹具校验、规范化、四个 profile 适配器 |
| `packages/test-support/llm-replay/` | 回放插件：挂上去顶替真 LLM adapter，从 fixture 读流喂给 agent |
| `packages/test-support/loader-smoke/` | 真 Loader 冒烟：无模型地跑真子进程路径 |
| `packages/test-support/llm-mock-server/` | 造故障用的假服务端（**这是 mock，不是 replay**，两者别混） |
| `snapshots/{session,sdk,acp,web}/` | 那批录制资产本身 |
| `vitest.snapshot.config.ts` | 三档 `DSH_SNAPSHOT` 环境的入口 |

`llm-mock-server` 和 `llm-replay` 常被一起提，但它们做的是相反的事：前者**伪造**模型的故障行为（测重试、超时），后者**重放**模型的真实回答（测正常流程）。

## 它不做什么

- **不录制**——`record` 属于流程，`replay` 只消费产物。"this plugin does not record"（`llm-replay` README）
- **不修复**——遇到不合规的 fixture 直接拒绝，绝不修补后继续
- **不改写日志**——回放期间 runtime 照常写**完整**日志；被压缩的只是**输入** fixture
- **不等于无凭据**——环境里可以有假 key（见 [04](./04-boundaries.md)）

## 下一步

- 为什么非得搞这么个东西 → [02 它解决什么问题](./02-why-it-exists.md)
- 回放具体是怎么跑的 → [03 replay 到底在做什么](./03-how-replay-works.md)
- 怎么判断某条测试算不算 keyless → [04 边界与判据](./04-boundaries.md)
