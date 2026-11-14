# 07 · Harness 经济学：维护成本、四组等价误区与机器六大盲区

## 仓库开发 Harness 拆解了复杂度，但没有让复杂度凭空消失

把导航、工作流和门禁外置进仓库后，团队很容易产生另一种幻觉：只要规则和脚本铺得够满，coding agent 就能全自动交付完美系统，人类再也不用操心。事实恰恰相反——**Repository Development Harness 的本质是重组参与知识的加载成本与错误发现时机，而不是消灭软件工程本身的认知难度**。

任何参与者（无论是零历史 coding agent 还是新入职工程师）改一座真实代码库时，都同时面对三类性质截然不同的门槛：

| 参与门槛 | 阻力来源 | 仓库开发 Harness 能做到什么 | 绝对不能夸大承诺什么 |
|---|---|---|---|
| **1. 知识门槛（Knowledge Barrier）** | 不知道规矩在哪、新功能挂哪、当年为什么否掉某方案 | 通过 `AGENTS.md`、架构路由表、生成目录、决策记录与 Skills **大幅削平（可压降 80% 以上）** | 不能替读者跳过阅读目标模块契约的过程 |
| **2. 识读门槛（Literacy Barrier）** | 对所用编程语言、并发模型、配置语法或领域协议不熟 | 通过分层教程、标准生产范本（Paved Road）和 L0 配置入口降低上手摩擦 | 不能消除异步竞态、类型系统与分布式边界本身的精确性要求 |
| **3. 判断门槛（Judgment Barrier）** | 不确定哪种抽象拆法更耐演进、测试证据是否真正覆盖风险 | 用 Skills 提供调查框架、用多层门禁排除低级错误，把人类注意力聚焦到核心取舍 | **永远无法由机器自证完成**——最终意图对齐与风险承担仍归人类 |

## 四组最容易踩坑的“致命等价误区”

在推广 Agent-Friendly Repo 时，必须向团队和 agent 反复重申四条绝不能画等号的物理边界：

1. **可读（Legible）≠ 简单（Simple）。** 生成目录、角色后缀词典与单一事实归属让拥有上百个包的系统变得“可精准定位”，但多会话并发、跨进程通信与异步卸载本身依然复杂。
2. **Skill 引导（Guidance）≠ 门禁强制（Enforcement）。** `SKILL.md` 依然是自然语言散文，agent 在长上下文下仍可能漏步或误判；凡是可确定性判定的底线必须下沉为退出码非零的静态检查或测试，凡是涉及架构取舍的结论必须经过语义评审。
3. **组件卸载（Disposal）≠ 事务回滚（Transaction Rollback）。** 统一清理协议（disposer）只保证回收当前组件注册在内存里的服务、监听器和句柄，绝不会自动撤销已经发出去的 HTTP 请求、已经修改的外部数据库或已经落盘的用户文件。
4. **运行时自省或 `vm` 隔离 ≠ 安全沙箱（Security Sandbox）。** 只读查询工具不能修改业务状态，动态求值所用的独立 `vm` 上下文也仅仅隔离了全局变量污染，绝非权限围栏：

> The vm prevents accidental global pollution; injected filesystem, shell, and network services still have real authority, so it is not a security boundary.
>
> — DSH [`Cordis runtime inspection and runner isolation` 已归档 Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/feature/2026-07-08-self-referential-cordis-toolset.md)。只要把具备真实 I/O 能力的服务句柄传给一段代码，它就拥有真实的宿主权限；安全隔离必须依靠专门的进程沙箱与审批策略。

## 机器门禁在原理上绝对查不到的六类语义盲区

既然可机械检查的规则都已经接进了门禁，那么“CI 全绿”到底还漏掉了什么？梳理 DSH 全套现行门禁的自述边界后，可以精确锁定**自动化检查在原理上覆盖不到的六块语义盲区**——它们正是人类 Code Review 必须亲自接管的责任清单：

1. **跨文档与跨语言叙述的语义矛盾。** 门禁能核对链接不断、锚点存在、章节结构一致、生成区未手改，却无法判断两段合法散文是否在说相反的话。就连 DSH 最严密的双语配对门禁也在文档中坦白了这一极限：

> It checks hashes and Markdown structure; it cannot judge whether the two sides say the same thing, or whether the wording is accurate, well-termed, and natural — that is the reviewer's half of the contract, per translation-rules.md.
>
> — DSH [`docs/i18n/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/i18n/README.md)。哈希一致只证明“有人确认过这对文本”，确认本身是否忠实准确，全靠评审把关。

2. **“这次改动算不算非平凡（Non-trivial）”、该不该补决策记录。** 决策记录格式门禁只能检查已存在文件的标题和状态行，绝不可能识别一个没有写决策记录的 PR 是不是偷偷改了跨包契约：

> Review enforces the semantic boundary. No automated gate attempts to classify a diff as trivial or non-trivial, so this policy adds no gate stage or runtime.
>
> — DSH [`Require an Agent Note for every non-trivial change` 已归档 Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md)。同样，某篇既有文档里的描述是否已被新代码推翻但语法依然合法，也只能靠人或语义审查发现。

3. **破坏性变更“有没有漏写升级指南”。** 例如 DSH 的 [`scripts/verify-upgrade-guides.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-upgrade-guides.ts) 只校验已创建的升级指南路径、frontmatter、必需小节与 500 词上限；如果开发者破坏了外部配置表面却压根没新建指南文件，或者整个 `docs/upgrade-guide` 目录为空，脚本会直接返回零违规通过。
4. **散文里手写的字面数字与机器配置之间的暗中脱节。** 门禁读取的是结构化配置清单（如 `scripts/doc-budgets.manifest.json` 里的实际 `ceiling`），但不会去解析散文段落里手写的说明性数字（例如 `docs/AGENTS.md` 正文把常驻预算描述为写作 `target`，数值与 manifest 里的硬 `ceiling` 并不相同）。任何写进散文正文的硬编码计数，天然游离在静态门禁之外。
5. **长程执行过程中的目标语义跑偏。** 运行时没有独立的“真理裁判器”能自动识别 agent 当前忙活的代码是不是已经偏离了用户最初的业务意图；DSH 的持久目标模块（[`packages/goal/goal/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal/README.md) 与 [`goal-round-driver` README](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal-round-driver/README.md)）明确只负责状态持久化与续轮调度，把“做得对不对”留给真实测试证据与顶层人类监督。
6. **未入库或随回滚一并删除的探索转向。** 仓库治理机制只管得住已经落进工作树的文件：在对话里讨论过但未提 Issue 也未写决策记录的方案否定，在仓库里不会留下任何防重犯护栏；随功能回滚一并删除的文档与记录也只存在于底层 Git 历史对象中。

## Harness 自身的维护经济学：投入必须匹配组合压力

外置每一条规则、每一份生成目录和每一个门禁都要持续付维护税：常驻文档超重会挤占上下文窗口，过细的门禁会拖慢重构，没人清理的决策记录会淹没检索结果。DSH 之所以愿意承担全套基础设施成本，是因为它同时承受着多端入口、上百个插件包、多语言 SDK 同步和持久化格式兼容的极高 **composition pressure（组合压力）**。

如果你维护的是一个只有单一入口、三五个模块的轻量服务，照搬重型体系只会自我内耗。在动手建设前，先用下面三个成本收益问题给你的仓库做一次体检（按项目规模分 Tier 1–3 渐进裁剪的具体清单与起步模板见 [第 10 章](./10-agent-ready-repo-blueprint.md)）：

1. **团队高频返工的知识住在哪里？** 是每次在 PR 评论区重复教同一遍，还是已经放进了单点权威文件并配上了非零退出的检查？
2. **新需求的落点用不用猜？** 一个零历史 coding agent 能否在两跳链接内找到扩展点、标杆文件与必跑测试？
3. **错误在第几分钟暴露？** 是在本地保存/提交后的几秒内带 `file:line` 报错拦截，还是等半小时 CI 甚至三天后人工 review 才被打回？

把资源精准投在“高频重犯、机器可判、报错即导航”的刀刃上，同时让人类 reviewer 死守上面那六块机器盲区——这就是 Agent-Friendly Repo 最健康的经济学平衡点。

## 证据入口

- DSH [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) 与 [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md)：高组合压力系统的分层复杂度与文档维护预算边界。
- DSH [`Cordis runtime inspection and runner isolation` 已归档 Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/feature/2026-07-08-self-referential-cordis-toolset.md) 与 [`@deepseek-ai/dsh-tool-cordis` README](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/extensions/tool-cordis/README.md#known-limitations-and-deferred-work)：运行时只读自省与 `vm` 隔离不构成安全沙箱的明确声明。
- DSH [`docs/i18n/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/i18n/README.md)、[`Require an Agent Note for every non-trivial change` 已归档 Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md) 与 [`scripts/verify-upgrade-guides.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-upgrade-guides.ts)：双语结构门禁、非平凡变更界定与升级指南门禁各自声明的机器检查上限。
- DSH [`packages/goal/goal/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal/README.md)、[`dsh-code-review`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-code-review/SKILL.md) 与 [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)：长程运行状态与人类语义评审、外部世界验证的责任分界。
