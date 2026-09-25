# 运行时查询：不靠猜源码

> **术 · 运行时查询。** 本页是实战：三个查询面各是什么命令、声明面怎么保持可信、inspect 为什么不是沙箱。五维评估里「静与动」维的「agent 靠猜源码行动」症状亮红、或 [`落地总纲`](./06-step-by-step-guide.md) Phase 6 开工时，来这页抄作业。对照面「声明面」（生成 catalog）的设计归 [FAQ 04](../04_root-entry-doc-design/answer.md)。

## 源码只能说明可能性，回答不了「现在」

静态 import 和目录树能说明仓库**可能**提供哪些能力，却不能回答某台机器、某个 profile、某个 session **实际**加载了什么。「糊涂」的一个隐蔽来源，就是 agent 拿着源码结构去猜部署结果，然后按猜错的结果行动。DSH 的对策是 inspectability（可检查性）：**给查询入口，让 agent 用当前状态验证假设，而不是靠猜**。

## 三个查询面，各是什么命令

| 查询 | 回答 | 实际命令/产物 |
|---|---|---|
| 最终配置树是什么 | profile / bundle / patch 叠加后，这台机器实际 boot 什么 | `dsh --profile web --dump-config` |
| 仓库声明了什么静态接口与注册项 | tool schema、config 字段、event dispatch mode、service signature | 生成的 tool/config/persistence/event/capability catalog |
| 当前进程里实际有什么 | 哪个 provider、service、tool 正在生效 | `cordis_inspect_list` / `cordis_inspect_query`（只读、opt-in；`cordis_inspect_self` 已随 #4745 退役） |

三者的关键区别必须守住：**catalog 回答「仓库声明了什么」，不是「当前进程正运行什么」**；实际 provider 与 Fiber 状态要问活运行时。DSH 原话：

> **DSH 原话 ·** 查询最终配置树（[docs/architecture.md](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/docs/architecture.md)）
>
> To see the tree your machine boots:
>
> ```text
> > dsh --profile web --dump-config
> ```

声明面的可信度也是机器保证的：生成 catalog 配 freshness gate，目录与源码有 diff 就红——所以它是可信索引，不是一张可能漂移的手写清单。

## 从哪开始

先做成本最低的一档：一条命令 dump 最终生效配置（`config dump` / `env` 输出 / `make show-config` 等价），让 agent 能问「现在生效的是什么」。声明面索引（配 freshness 检查）在接口清单大到手工维护不动时再加；运行时只读 inspect 工具，多 profile/provider/动态装卸的压力真出现了才碰——普通项目可无限期跳过。

## 边界：inspect 不是沙箱

> **DSH 原话 ·** vm 不是安全边界（[`.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/feature/2026-07-08-self-referential-cordis-toolset.md)）
>
> The vm prevents accidental global pollution; injected filesystem, shell, and network services still have real authority, so it is not a security boundary.

「可查询/可试验」不代表「不需要授权」，也不代表外部副作用能回滚。迁移时别把「给 agent 一个 inspect 工具」当成「给了它一个沙箱」。

## 与其它各篇的关系

- 这条治的「猜部署结果」，是归属（02）在**运行时维度**的延伸：归属管「哪类事实住哪」，查询管「此刻的事实是什么」。
- inspect 工具的可见集属于披露管线（12）层 3 的运行时组装；它的授权边界归 sandbox/approval，与可见性无关。

本页声称的 DSH 事实，上游一手出处集中登记在 [`reference.md`](./reference.md)（本章「11 · 运行时查询」一节）——按需核对，不读不影响理解。
