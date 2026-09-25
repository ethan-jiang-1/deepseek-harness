# 决策记录（Notes/ADR）：受控演进的设计记忆

> **道 · 决策记录。** 本页拥有决策记录的完整逻辑：为什么需要它、DSH 怎么应对、怎么落地、怎么迁。[`归属`](./02-legibility-ownership.md) 讲了当前事实与决策理由分家；DSH 侧的精确生命周期（状态目录、supersession、冻结归档）由 [Agent Note lifecycle 参考](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md) 拥有。

## 为什么要有这道

每个做过设计的人都知道「为什么当时选了这条路」的价值，也知道它有多容易丢。agent 参与开发后，丢失被放大了三倍：

- **agent 没参与当时的讨论。** 「静默超时还是总时长上限」这种取舍，人讨论过就记住了；agent 每次都是新来的，没人告诉它，它就把已被否定的路重新提一遍——不是它蠢，是负知识没有地方可读。
- **代码只回答「现在是什么」，从不回答「为什么不是别的」。** 源码展示当前方案；被放弃的方案、放弃的理由、接受的代价，在代码里一个字都没有。
- **口头传统对 agent 无效。** 人可以问老员工「当年为什么不用 X」；agent 听不到走廊对话，它的「问」只能是读文件。

所以需要一类专门的知识载体：**存「为什么」而不是「是什么」，存取舍而不是实现，而且要能跟着决定一起演进**——决定被取代时它要跟着被取代，不能留着一堆过时的「为什么」冒充现行。这就是决策记录这道。

## DSH 怎么应对

DSH 的应对可以压成三条：

1. **一条判据定去留**：存在真实的替代方案和持久取舍才写——代码、测试和现有文档解释不了「为什么选当前方案、放弃了什么」的事实，才需要决策记录。diff 大小无关。
2. **目录即状态**：`proposed/`（待评审）、`implemented/`（已交付）、`rejected/`（已否决）、`archived/`（冻结历史）——「已否决」「已过时」「现行」一眼可分，过时的理由永远不会冒充当前权威。
3. **取代有纪律**：决定反转时新增记录并交叉链接，不原地改写；完全取代前必须先吸收旧记录的全部独有内容——否则删掉的不是文档，是别人踩过的坑。

## DSH 怎么落地

**两个对比例（同在 DSH，一个不写、一个必写）：**

- **例一（局部修补，不写）**：UI 呈现修复——模型选择器从显示名称改为显示 model ID。局部呈现修改，豁免决策记录：行为归源码与测试，当前合同归 README，「为什么显示 ID」读完源码和 README 就完整。改动小**不是**豁免理由——「没有持久取舍」才是。
- **例二（持久取舍，必写）**：进程竞态修复——静默的 pnpm 子进程长期占用 profile lock。它的决策记录承载了源码放不下的东西：为什么用「静默超时」而不用「总耗时阈值」（慢机器上的合法构建会被总时长误杀）、五条被否决的路线及否决原因、接受的代价（静默的健康构建可能被误杀）。这笔 28 文件的修复，就算再小十倍，这些取舍也存在，所以必须写。

**状态与取代的实物**：`.agents/notes/` 目录树本身就是状态机（打开仓库就能读出四态）；每条记录是双语三件套（`xx.md` + `xx.zh.md` + hash 配对），新决策触发 supersession 检查是 `.agents/notes/AGENTS.md` 里的常驻指令；归档判断不靠字数年龄，走 [`dsh-archive-agent-notes`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-archive-agent-notes/SKILL.md) 的校准工作流。pnpm 案的完整记录（Problem/Decision/真实 Alternatives/Testing/Consequences 五节）见 [bounded-pnpm-runs](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/implemented/bug-fix/2026-09-23-bounded-pnpm-runs.md)。

## 怎么迁移到你的项目

**状态转换的条件**（普通项目不必抄目录，但纪律要抄）：

| 转换 | 条件 |
|---|---|
| proposed → implemented | 决定交付时，把提案改写成已交付事实（不是留在提案语气上） |
| proposed → rejected | 否决时记录否决原因；只有当它仍能防住一个可信的错误时才保留 |
| implemented → archived | 决定完成、理由不再指导未来、但有历史价值时冻结；冻结后不是当前权威 |
| implemented → 新记录取代 | 决定反转时**新增**记录并交叉链接，不原地改写旧决定 |

**最小 ADR 模板**（五节，普通项目可直接用）：

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

两条硬纪律：**备选必须是真实存在过的**——编造落选方案让记录失去全部可信度；**验证指到真实检查**——没有就如实写「暂无」，不要凑数。

普通项目不必照搬的部分：双语三件套（除非真的双语平等）、六类分类目录（两三类通常够用）、格式门禁（先有纪律，量大了再上机器）。

**学走形的检查**：两种方向都要防——没有备选的修补硬写记录（机械建档，很快没人再读）；有真实取舍的变更不写（知识丢失，agent 下个会话重新提出被否定的方案）。检验法就一句：新会话的 agent 还会不会提那个已被否定的方案？会，就是缺口。

**取代的两档**：部分取代——新旧并存、交叉链接，各自拥有自己那部分理由；完全取代——先吸收再删除，理由同上。**归档按「未来决策价值」判断**，不按字数年龄；归档的历史记录是冻结快照，永远不再编辑、不作为当前权威引用——想引用它说明历史时，链接过去并注明是历史。

## 证据入口

- [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/notes/README.md)：DSH 决策记录的原始规则（豁免条款、取代、归档）。
- [Agent Note lifecycle 参考](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-reference/01-agent-note-lifecycle.md)：状态转换、supersession 与冻结的精确条件。
- [SDLC Tutorial 02](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/_agent_ready_development/sdlc-tutorial/02-specs-and-decisions.md)：两个对比例（局部修补豁免 vs 持久取舍必写）的完整走查，含目录树实物。
- [`.agents/skills/dsh-archive-agent-notes/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/.agents/skills/dsh-archive-agent-notes/SKILL.md)：DSH 归档判断的校准工作流（按未来决策价值，不按字数年龄）。
