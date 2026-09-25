# 12 · 决策记录（Notes/ADR）：受控演进的设计记忆

> **定位：迁移章。** [02](./02-legibility-ownership.md) 讲了「当前事实 vs 决策理由分开」的地基；本页把决策记录本身讲完整：何时值得写、状态怎样变化、取代与归档怎么处理、普通项目的最小模板长什么样。DSH 侧的精确生命周期（状态目录、supersession、冻结归档）由 [Agent Note lifecycle 参考](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md) 拥有。

## 何时值得写：一条判据，两个对比例

判据只有一条：**存在真实的替代方案和持久取舍**——代码、测试和现有文档解释不了「为什么选当前方案、主动放弃了什么」。

**例一（局部修补，不写）：** DSH 有一笔 UI 呈现修复——模型选择器从显示名称改为显示 model ID。局部呈现修改，豁免决策记录：行为归源码与测试，当前合同归 README，回归证据归测试，「为什么显示 ID」读完源码和 README 就完整。改动小**不是**豁免理由——是「没有持久取舍」才是。

**例二（持久取舍，写）：** DSH 有一笔进程竞态修复——静默的 pnpm 子进程长期占用 profile lock。它的决策记录承载了源码放不下的东西：为什么用「静默超时」而不用「总耗时阈值」（慢机器上的合法构建会被总时长误杀）、五条被否决的路线及否决原因、接受的代价（静默的健康构建可能被误杀）。这笔 28 文件的修复，就算再小十倍，这些取舍也存在，所以必须写。

对照两例可以看出：**diff 大小与是否写记录无关，「有没有真实备选被放弃」才有关。** 没有备选的修补硬写记录，是机械建档；有真实取舍的变更不写，是知识丢失——两种失败方向都要防。

## 状态：让「已否决」「已过时」「现行」一眼可分

DSH 的做法是目录即状态：`proposed/`（待评审）、`implemented/`（已交付）、`rejected/`（已否决）、`archived/`（冻结历史）。普通项目不必抄目录结构，但要抄这条纪律：**每条记录标状态，状态的转换有条件**——

| 转换 | 条件 |
|---|---|
| proposed → implemented | 决定交付时，把提案改写成已交付事实（不是留在提案语气上） |
| proposed → rejected | 否决时记录否决原因；只有当它仍能防住一个可信的错误时才保留 |
| implemented → archived | 决定完成、理由不再指导未来、但有历史价值时冻结；冻结后不是当前权威 |
| implemented → 新记录取代 | 决定反转时**新增**记录并交叉链接，不原地改写旧决定 |

## 取代与归档：最容易被轻慢的两个动作

**部分取代**：新旧并存、交叉链接——各自拥有自己那部分理由。

**完全取代**：新记录必须先**吸收**旧记录的全部独有内容（理由、备选、后果、验证缺口），才能删除旧记录；否则删掉的不是文档，是别人踩过的坑。

**归档**：按「未来决策价值」判断，不按字数或年龄。归档的历史记录是冻结快照，永远不再编辑、不作为当前权威引用——想引用它说明历史时，链接过去并注明是历史。

## 最小 ADR 模板（普通项目可直接用）

```markdown
# ADR-NN · <一句话标题>

状态：proposed | implemented | rejected | archived
日期：YYYY-MM-DD

## 问题
<什么场景下要做什么决定；让没参与讨论的人能看懂>

## 决定
<选了什么；写成已交付事实，不是提案语气>

## 备选
- <被否决的方案>：<为什么不行（真实存在过、认真考虑过的才写）>

## 后果
- 接受的代价：<>
- 换来的收益：<>

## 验证
<什么证据钉住这个决定覆盖的行为>
```

两条硬纪律：**备选必须是真实存在过的**，编造落选方案让记录失去全部可信度；**验证指到真实检查**，没有就如实写「暂无」，不要凑数。

## 普通项目不必照搬的部分

双语三件套（`xx.md` + `xx.zh.md` + hash 配对）——除非你的项目真的双语平等；六类分类目录（architecture/bug-fix/feature/process/simplification/testing）——类别跟着你的决策类型走，两三类通常够用；`verify-agent-note-format` 级的格式门禁——先有纪律，量大了再上机器。

## 可迁移要点

1. 一条判据定去留：真实替代方案 + 持久取舍，与 diff 大小无关。
2. 每条记录有状态，转换有条件；已否决只保留仍能防错的。
3. 完全取代前先吸收全部独有内容；归档按未来决策价值，冻结后不作权威。
4. 备选必须真实，验证必须指到真实检查，缺了就如实写。
5. 模板从最小开始：问题、决定、备选、后果、验证——五节够用很久。

## 证据入口

- [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/README.md)：DSH 决策记录的原始规则（豁免条款、取代、归档）。
- [Agent Note lifecycle 参考](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md)：状态转换、supersession 与冻结的精确条件。
- [SDLC Tutorial 02](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-tutorial/02-specs-and-decisions.md)：两个对比例（局部修补豁免 vs 持久取舍必写）的完整走查，含目录树实物。
- [`.agents/skills/dsh-archive-agent-notes/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-archive-agent-notes/SKILL.md)：DSH 归档判断的校准工作流（按未来决策价值，不按字数年龄）。
