# 10 · DSH 自己的常规流程

> DSH 把自己的开发流程写成了仓库规则：改代码必须改文档、破坏性改动当场记、已提交的世代不动、验证选最窄证据。这六条是流程的**名字与原文**——流程的完整机制（Agent Note 生命周期、门禁、归档与回写）归 [`../development-flow/`](../development-flow/00-map.md)，那里把它当作一套 SDLC 深挖。每条只给两句：**它怎么说**（逐字引用）、**因此怎么写**（对语料的约束）。机制细节归各专题，这里不重复。

## 改代码就改文档

**它怎么说**：「Docs accompany every code change: update affected README and JSDoc contracts together.」（[AGENTS](../../AGENTS.md)）

**因此怎么写**：讲某机制的页面改了口径时，同批改它引用的 README 与注释；只改一边等于没改。

## 破坏性改动当场记

**它怎么说**：「Record each externally perceptible breaking change immediately」；「Public APIs are pre-stable; update every consumer.」（[AGENTS](../../AGENTS.md)）

**因此怎么写**：CLI、profile、`cordis.yml`、持久化数据、SDK 或 wire 契约一变，页面要指到对应的升级指南。

## 已提交的世代不动

**它怎么说**：Adjacent migration「may add a version-named successor but never move, overwrite, or delete committed generations; predecessors imply neither fallback nor downgrade support. SQLite uses monotonic `SCHEMA_VERSION`.」（[AGENTS](../../AGENTS.md)）

**因此怎么写**：写历史时按「追加」写；不要描述成「升级时会被改写」。

## 选最窄的证据

**它怎么说**：「narrowest available test or purpose-built check that would fail for its regression」（[pre-push-checks](../../.agents/skills/dsh-pre-push-checks/SKILL.md)）

**因此怎么写**：讲「怎么验」时给出那条具体的测试或检查，不要写「跑一遍全部」。

## 新检查要先证明它会红

**它怎么说**：「prove each changed acceptance path rejects an invalid case」（[AGENTS](../../AGENTS.md)）

**因此怎么写**：说某个 gate 有效，要能指出它拒绝过什么；指不出就是没验过。

## 模型可见就是已记录

这条不变量本身的原文与写作约束归 [`02-judgements`](./02-judgements.md#3-模型看得见就等于记下来了) 判断三（不在此重复引文）。流程侧后果：新增模型可见输入时，session event 与受影响的快照要在同一个改动里落地。

## 怎么用这篇

- 这里只有六条，都是 DSH 写下来的；本语料自己的流程编排（比如某篇的施工顺序）不在此列。
- 「因此怎么写」是推论，引用时引第一段。
- 生命周期机制本身归 [`../session-and-loop/`](../session-and-loop/00-map.md)，组合与启动归 [`../plugin-system/`](../plugin-system/00-map.md)。
