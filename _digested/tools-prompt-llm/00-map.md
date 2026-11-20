# 模型可见面 · 组装与管道

## 一句话

模型每一步看见的东西由插件注册表当场组装：系统提示词（`ctx.systemPrompt`）、工具定义（`ctx.tools`）与会话历史投影。请求经 `ctx.llm` 的 adapter 流出。

所有与模型可见性相关的概念判定与实现细节，统一收口至 [`../CONCEPT_INDEX.md`](../CONCEPT_INDEX.md) 和各机制页。

## 心智模型

![模型可见面组件组装](./figures/request-assembly.svg)

三股信息流汇合：
1. **System Prompt Sections**: 按 scope 过滤、按顺序拼装。
2. **Tool Schemas**: 按 scope 过滤，动态可见。
3. **History**: 从 surface 投影，含图像与文件块（编码与预算详见各机制页）。

## 关键架构决策与不变量

| 决策点 | 架构契约 | 归属页 |
|---|---|---|
| 工具执行流 | 遵循 Pipeline 契约（pre → execute → post） | [`02`](./02-tool-pipeline-approval-and-timeouts.md) |
| 系统提示词稳定性 | 前缀稳定，section 按顺序组装 | [`01`](./01-prompt-section-order-and-prefix-stability.md) |
| 模型可见数据 | 所有模型看见的数据，必须能在 session log  reconstruct | [`03`](./03-system-prompts-as-session-surface-nodes.md) |

## 阅读路径与机制查找

请参照本目录下的编号页进行机制深潜。

| 你的问题 | 去哪 |
|---|---|
| system prompt 顺序 / 前缀 | [`01`](./01-prompt-section-order-and-prefix-stability.md) |
| 调用管道细节 / 审批 / timeout | [`02`](./02-tool-pipeline-approval-and-timeouts.md) |
| session 投影细节 | [`03`](./03-system-prompts-as-session-surface-nodes.md) |
| 提示词替换 (In-history) | [`04`](./04-in-history-system-prompt-updates.md) |
| 结算与回放 | [`05`](./05-streaming-chunks-and-attempt-settlement.md) |
| 图像/文件块 | [`06`](./06-file-and-image-content-projection.md) |
| Skill 目录没变，正文或实际方法却变了 | [`07`](./07-skill-input-lifecycle.md)：发现、两条加载路径、正文更新与历史保留 |

---
> 承重词按 `canon/GLOSSARY.md` 的 DSH 原文用；本页自己的分类与指标不是 DSH 的词。
