# 10 · DSH 自己的常规流程

这些是 DSH 仓库对自己规定的做法。每条只给两句：**它怎么说**（逐字引用）、**因此怎么写**（对语料的约束）。机制细节归各专题，这里不重复。

## 改代码就改文档

**它怎么说**：「Docs accompany every code change: update affected README and JSDoc contracts together.」（[AGENTS](../../AGENTS.md)）

**因此怎么写**：讲某机制的页面改了口径时，同批改它引用的 README 与注释；只改一边等于没改。

## 破坏性改动当场记

**它怎么说**：「Record each externally perceptible breaking change immediately in an upgrade guide.」；「Public APIs are pre-stable; update every consumer.」（[AGENTS](../../AGENTS.md)）

**因此怎么写**：CLI、profile、`cordis.yml`、持久化数据、SDK 或 wire 契约一变，页面要指到对应的升级指南。

## 已提交的世代不动

**它怎么说**：「[Adjacent migration] may add a version-named successor but never move, overwrite, or delete committed generations; predecessors imply neither fallback nor downgrade support. SQLite uses monotonic `SCHEMA_VERSION`.」（[AGENTS](../../AGENTS.md)）

**因此怎么写**：写历史时按「追加」写；不要描述成「升级时会被改写」。

## 选最窄的证据

**它怎么说**：「narrowest available test or purpose-built check that would fail for its regression」（[pre-push-checks](../../.agents/skills/dsh-pre-push-checks/SKILL.md)）

**因此怎么写**：讲「怎么验」时给出那条具体的测试或检查，不要写「跑一遍全部」。

## 新检查要先证明它会红

**它怎么说**：「prove each changed acceptance path rejects an invalid case」（[AGENTS](../../AGENTS.md)）

**因此怎么写**：说某个 gate 有效，要能指出它拒绝过什么；指不出就是没验过。

## 模型可见就是已记录

**它怎么说**：「Model-visible means logged. Every model request must be reconstructable from the log. New model-visible inputs require session events.」（[architecture](../../docs/architecture.md)）

**因此怎么写**：讲「模型能看到 X」时，同句给出它对应的会话事件。

## 怎么用这篇

- 这里只有六条，都是 DSH 写下来的；本语料自己的流程编排（比如某篇的施工顺序）不在此列。
- 「因此怎么写」是推论，引用时引第一段。
- 生命周期机制本身归 [`../session-and-loop/`](../session-and-loop/00-map.md)，组合与启动归 [`../plugin-system/`](../plugin-system/00-map.md)。
