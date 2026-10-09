# 答案：先读哪一篇

## 一分钟版

**我原来的判断错了一半。** 「插件仓不需要这套东西」在**语料治理**上成立，在**机制**上不成立。

拆成三层看：

1. **主仓为什么需要它** —— 它买到的是「组装后的完整转录」这一种没有替代品的证据：模型实际收到了什么、说了什么、落了什么盘。起点是一次事故：一个 178 个单测全绿、100% 行覆盖、生产完全不能用的插件。
2. **插件仓能不能用** —— **能**。`@deepseek-ai/dsh-llm-replay` 是发布在 npm 上的普通插件（`next` 通道就是本基线 `0.2.0-rc.2`），它接受**未经投影的原始运行日志**。所以「真跑一次 → 留下 `session.jsonl` → 以后无 key 重放」这条路是通的，而且正好用在**你猜的那两件事**上：**trajectory** 和 **bug 复现**。
3. **什么搬不出去** —— 顶层 `snapshots/` 的所有权、四面分工、corpus policy、`dsh-session-snapshot` 那套语料级守卫，都服务「一个仓库集中维护 210 个场景」这个规模。更重要的是一条教训：**快照是变更探测器，不是正确性 oracle**——主仓有一次真实事故，是快照套件为回归背了书。

**所以推荐的答案不是「用」或「不用」，而是一条阶梯**：L0–L3（导出守卫 → 行为 spec → HMR → REAL composition）默认全做；**L4「轨迹夹具」按触发条件启用**，放在 `tests/trajectory/` 下，一个目录一条轨迹。它**不是必需项，但也绝不是禁区**。

一句话记法：**机制可以拿，制度不要抄，判断不能外包。**

## 目录里都有什么

| 文件 | 种类 | 回答什么 |
|---|---|---|
| `question.md` | 入口 | 问题怎么冒出来的、结论先说、范围与基线 |
| `answer.md` | 入口 | 就是本页：一分钟版、阅读顺序、术语速查 |
| [01](./01-why-dsh-needs-it.md) | 正文 | **主仓为什么需要它**——事故起点、被否决的替代方案、与「model-visible ⟺ logged」的关系 |
| [02](./02-what-a-trajectory-is.md) | 正文 | **一份 `session.jsonl` 到底是什么**——完整事件序列、脱敏是搬体积不是删内容、缺哪三类失败 |
| [03](./03-what-a-plugin-can-reuse.md) | 正文 | **插件仓能复用什么**——三条硬证据、最小可用设置、trajectory 与 bug 复现三种用法 |
| [04](./04-what-does-not-transplant.md) | 正文 | **什么搬不出去**——语料治理、语义守卫、以及「快照会一致地复现 bug」 |
| [05](./05-plugin-repo-organization.md) | 正文 | **推荐怎么组织**——L0–L4 阶梯、触发条件、目录形状、六个不要做 |
| [06](./06-bug-reproduction-playbook.md) | 正文 | **bug 复现怎么做**——三档做法、override 的条目与文档形态、一个真实案例走查 |
| `reference.md` | 附录 | **全部出处**：每条结论对应的仓库路径、行号与实测口径；含「证据薄弱处」 |

## 按什么顺序读

**按顺序读是最省力的路径**，每一步都为下一步铺垫：

| 顺序 | 读哪一篇 | 它回答的问题 |
|---|---|---|
| 1 | [01 主仓为什么需要它](./01-why-dsh-needs-it.md) | 这东西到底买到了什么？不给会怎样？ |
| 2 | [02 它是 trajectory 吗](./02-what-a-trajectory-is.md) | 一份录制里有什么、缺什么？ |
| 3 | [03 插件仓能复用什么](./03-what-a-plugin-can-reuse.md) | 我能不能用？最小设置长什么样？ |
| 4 | [04 什么搬不出去](./04-what-does-not-transplant.md) | 边界在哪？我会踩什么坑？ |
| 5 | [05 插件仓该怎么组织](./05-plugin-repo-organization.md) | 我到底该建还是不建？怎么摆？ |
| 6 | [06 bug 复现 playbook](./06-bug-reproduction-playbook.md) | 决定要建了，具体怎么做一条？ |
| — | [reference.md 全部出处](./reference.md) | 想核对原文、或想知道某个数字怎么数出来的 |

**只想解决「我要不要建」这个问题的话，读 03 + 05 就够了**（05 的触发条件表是决策点）。04 和 06 是动手时才需要的：04 告诉你别踩哪个坑，06 告诉你怎么做。

## 术语速查

| 词 | 白话 |
|---|---|
| **snapshot（快照）** | 这里特指「录制会话回放」：真跑一次，把持久化的会话日志提交进仓，以后无 key 回放比对 |
| **trajectory** | 本文用它指 `session.jsonl` 这份完整轨迹：turn/step 边界、模型收到的请求头、模型流、每次工具调用与结果 |
| **fixture（夹具）** | 就是那份 `session.jsonl`；它同时是**回放输入**和**期望输出** |
| **projected / complete** | 夹具每一行要么省略 `seq`/`time` 包络（projected，主仓提交的形态），要么都带（complete，原始运行日志）——**不能混**。两种形态都接受 |
| **`replay.override.json`** | 补充 sidecar：表达日志里重建不出来的四类失败（pre-2xx 抛 / post-2xx 抛 / 挂起 / 注入重试）；条目三种、文档两种 |
| **`recording: live` / `authored`** | live = 真跑采集；authored = 手写最小轨迹（**不会被重新录制覆盖**） |
| **pin（header pin）** | 由某个场景独占拥有的 prompt / schema sidecar，避免几十条巨型 JSON 反复重写 |
| **`DSH_SNAPSHOT_FILE` / `_OVERRIDE` / `_CHILD_FILES`** | 回放器找夹具的环境变量；也可以用插件 `config` 的 `file` / `overrideFile` / `childFiles`（这是插件读的全部 env 面） |
| **`compression: 'none'`** | 录制时**必须**打开的设置：会话日志默认是 `zstd` 压缩的，而回放器只读明文 JSONL |
| **model-visible ⟺ logged** | 根 `AGENTS.md` 的不变量：任何到达模型请求的东西都必须能从会话日志重建 |
| **corpus policy** | 主仓的语料配额制度（基线版本、保留角色上限、V0 覆盖名单）——**插件仓不要抄** |
