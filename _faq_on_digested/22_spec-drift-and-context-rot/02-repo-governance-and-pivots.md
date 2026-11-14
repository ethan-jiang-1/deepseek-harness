# 02 · 仓库文档与决策治理：怎么接住频繁转向与几百篇存量堆积？

一旦关掉聊天窗口，决定项目会不会越改越乱的就不再是会话压缩，而是仓库里的文档和决策记录。很多人担心的正是这件事：**敏捷迭代里先往东做、隔两周改往西，仓库里的 Spec 和 Note 会不会叠成一堆互相打架的烂账？DSH 的 Note 流程到底考虑过这件事没有？**

答案非常明确：**不仅考虑了，而且整套制度就是按“方向一定会变、记录一定会攒多”这个前提设计的。**（关于单篇 Agent Note 该怎么写的格式细节见 [FAQ 20](../20_agent-note-quality-bar/answer.md)，本篇聚焦它怎么防漂移、怎么管转向和清存量。）

---

## 一、现状文档防漂移：一个事实一个家，正文只写“现在”

在看决策记录之前，[`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md) 先用两条死规矩斩断了日常文档腐烂的源头：

1. **一个事实只有一个权威落点（One home per fact）**：
   同一条规则、默认配置或包列表绝不允许在两份文档里各写一遍。发现重复表述时，只留真正的归属处，其余地方一律改成链接；凡是源码或生成器能算出来的目录、JSDoc 和包清单，严禁手工摘抄进文档。
2. **现状文档只写当前 HEAD（`Document current state`）**：
   `docs/` 和各个包的 `README.md` 里**严禁写演进历史，也严禁标“已实现！”“二期规划中……”这类进度标签**——仓库直言“状态标签必腐烂，目录结构与 `package.json` 自己就带着真实状态”。谁想知道以前长什么样去翻 Git 提交，想知道某次故障怎么回事看 [`docs/postmortem/`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/README.md)，想知道当初为什么选 A 不选 B 才去翻 `.agents/notes/`。

把“现在是什么”和“当初为什么这么定”彻底分居，好处立竿见影：方向一改，现状文档干脆利落地直接改成新接口，完全不用背历史解释包袱。

---

## 二、Agent Note 接住“左晃右晃”的三条硬纪律

那专门记录“为什么这么定”的 `.agents/notes/` 呢？如果项目掉头了，直接把旧 Note 改写成新方案行不行？或者干脆不管旧 Note、直接再写一篇新的行不行？**两条路在 DSH 里全被堵死了。**

### 纪律 1：事实原地刷新，但决定绝不原地篡改

[`.agents/notes/implemented/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/AGENTS.md) 和 [`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md) 把一次修改严密拆成了两半：

- **实现细节（文件路径、符号名、默认参数）变了 → 原地刷新旧 Note**：随改代码的同一个 PR 直接把现行 Note 里的旧路径改对，且不许在文末追加“某月某日改成某某”的流水账。
- **核心决定或背后的取舍理由反转了 → 严禁原地改写，必须新开一篇并双向互链**：如果把当初主张“往东走”的文档原地涂改成“往西走”，东向阶段踩过的坑、放弃过的备选方案和当时的约束就人间蒸发了，半年后新人接手又会把老弯路重吵一遍。同理，每篇 Note 强制要求写清“淘汰了哪些备选方案”，就是为了防失忆翻旧账。

### 纪律 2：每新增一篇 Note，同 PR 强制触发“取代检查”（Supersession Check）

[`.agents/notes/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/AGENTS.md) 规定：**只要新建一篇 Agent Note，作者必须在同一个 PR 里搜索活跃目录，找出所有涉及同一机制的老 Note 并当场分诊处理。**

为什么非得在写新方案的当下干这件苦差事，而不是攒到季度末搞“文档大扫除”？仓库在归档制度的设计记录（[`2026-07-26-frozen-agent-note-archive.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md)）里写明了淘汰“定期审计”方案的原因：**写替代方案的作者在当下对新旧边界和重叠部分最清楚；一旦拖延，活跃目录里就会同时躺着两份互相打架的权威记录，事后再找外人甄别成本翻倍。**

### 纪律 3：按“未来决策价值”分五条去路，冻结归档自动移出默认搜索

DSH 主仓历史上的 Note 总量早已破千篇。如果全堆在活跃目录里，一方面每次重构改包名都要连带刷新几百篇文档里的路径、代码块和双语哈希（仓库提案 [`2026-08-20-audience-first-documentation-quality.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/proposed/process/2026-08-20-audience-first-documentation-quality.md) 曾实测活跃树维护面一度高达 580 个文件、63.7 万词），另一方面旧方案的关键词还会在搜索时喧宾夺主。

因此，仓库配合 [`dsh-archive-agent-notes`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-archive-agent-notes/SKILL.md) 技能，按**“对未来的开发决策还有没有指导用处”**（明确禁止按年份一刀切或凑清理配额）给定了五条清晰去向：

| 场景与状态 | 怎么处理 | 背后的防漂移考量 |
|---|---|---|
| **1. 只改了一半（部分取代）** | 新旧两篇都留在 `implemented/` 现行树（或旧篇归档），双向交叉链接，并**点名写清旧篇哪几条依然有效** | 防止读者看到新篇就误以为旧篇所有约束全废了 |
| **2. 彻底换代（100% 完全取代）** | 先把旧篇里独有的理由、淘汰备选、代价和测试缺口完整并入新 owner、修平所有入站链接，然后**将旧篇三件套直接删除** | 现行口径彻底合一，又不靠“自己去翻 Git 历史”赌运气留存理由 |
| **3. 方向未落地就作废（提案否决）** | 绝不归档提案！从 `proposed/` 移入 `rejected/`，只在 `Status:` 行写明否决原因并冻结正文；等将来连“防止别人再犯同样错误”的警示作用都没了，整组删掉 | 把“曾经想过但证伪的路”跟“真正上过线的历史”严格分开 |
| **4. 已完成、理由不再指导未来工作** | 英文原稿、中文对照与 `.i18n.yaml` 三件套整体移入 `archived/{kind}/`，加上 `Archived:` 日期并写入封存哈希清单，**从此永久冻结、严禁任何修改，且不作现行权威** | 卸下后续规则演进重刷旧文的维护税；同时 [`.rgignore`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.rgignore) 默认屏蔽 `/.agents/notes/archived/`，防止过期词条在搜索里压过现行文档 |
| **5. 琐碎改动与无价值旧账** | 日常局部修改、机械重构与小 UI 调整**默认不写 Note**；历史上误写的纯小 UI 或纯机械记录直接删除；严禁建集中 `INDEX.md` | 从源头压住增量（主仓实测非合并提交里只有约一成会动到 Note），不建总索引避免无关 PR 抢改同一文件撞冲突 |

在分支与 PR 层面，根 [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md) 还有一条配套工程纪律：开发途中发现方向歪了，优先回到引入该设计的源头 PR 用 `--force-with-lease` 修正历史，或者把已合入的问题 PR 整单镜像 revert，而不是在错底座上叠一层“其实又改回去了”的补丁。

---

## 三、六个真实“掉头”案例：在仓库和 Git 里长什么样？

纸面规则好写，真遇到架构大转弯时团队有没有照办？下面六个在当前仓库和 Git 历史里随时可查的真实样本，完整覆盖了敏捷项目里最常见的几种“左晃右晃”（核验命令见 [`reference.md`](./reference.md)）：

1. **只推翻其中一小块（部分取代，明文圈出幸存条款）**
   制定实验包依赖政策（[`2026-10-14-experimental-dependency-policy.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/process/2026-10-14-experimental-dependency-policy.md)）时，团队修改了早先《已发布依赖面》（`2026-08-26-published-dependency-faces.md`）里关于包筛选的规则。新 Note 在开头直接点名：本次仅部分取代该文选包段落（对方同段也链回本文），**“那篇 Note 的其余所有决定继续有效”**。同样，当源码启动方式从 Node 原生 TS 切换为 `tsx/esm` 钩子时，现行篇（[`2026-07-29-dsh-source-launch-tsx-esm.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md)）与归档旧篇（[`2026-07-28-dsh-native-typescript-source-launch.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/architecture/2026-07-28-dsh-native-typescript-source-launch.md)）双向互链，归档篇头部逐一列出了哪些 Cordis 配置门禁依然现行有效。
2. **彻底重构通信模型（合并吸收后删旧篇，守住核心不变量）**
   子智能体邻接通信重构（[`2026-08-27-adjacent-agent-steer-messaging.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-08-27-adjacent-agent-steer-messaging.md)）废除了早期的子汇报工具与 `followup` 命名，但把原先最有价值的“子智能体消息必定先于结算通知送达”顺序保证沉淀进了 [`subagent` 包 README](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/README.md)，随后将完全被取代的两份旧记录合并删除——仓库里不留废稿，关键承诺也没丢。
3. **砍掉已上线的重型存储后端（旧篇归档 + 新篇坦陈代价与重开条件）**
   早期会话持久化同时维护过第一方 SQLite 后端，后来提交 [`4553c9d957`](https://github.com/deepseek-ai/deepseek-harness/commit/4553c9d957) 拍板彻底砍掉 SQLite、统一收敛为 JSONL 日志。同一个提交里：旧 SQLite Note 加 `Archived:` 冻结归档，新篇 [`2026-08-30-jsonl-only-session-persistence.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md) 接管现行口径，受影响架构文档同步擦干净，并且在新篇里诚实写下“放弃了更强的数据库/WAL 存储选项”这一代价以及未来什么条件下才值得重议。
4. **整条产品支线喊停（删掉未落地提案，只留一篇写明重开条件的移除记录）**
   团队决定放弃交付独立 SDK 项目编辑工具链（[`2026-08-11-remove-sdk-project-toolchain.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/simplification/2026-08-11-remove-sdk-project-toolchain.md)）时，没有把三篇悬在半空的关联提案留着充数，而是直接删除，只在一篇移除记录里保留了当初共享的动机、放弃的能力以及重新考虑的前提条件。
5. **长周期提案证伪与一次性规模化清仓**
   一份“用运行时 schema 注册表替换编译期事件映射”的提案挂了 11 周后被证伪，在提交 [`a7a5be1703`](https://github.com/deepseek-ai/deepseek-harness/commit/a7a5be1703) 中移入 [`rejected/`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/rejected/architecture/2026-06-16-typed-event-schemas.md) 并在 `Status:` 行钉死否决理由。同一次提交按语义判据一次性归档了 **453 组**已完成三件套（逾 41 万英文词）、否决 7 篇前提消失的旧提案、删掉 2 篇已无警示意义的旧否决稿，只把 201 篇仍有指导价值的记录留在活跃树里——证明这套容量治理在百人/多 Agent 规模下真能跑通。
6. **次日闪电回滚与未发版能力撤回（连代码带 Note 干净退场）**
   某项客户端代码块预览优化合入次日被提交 [`81e05abaab`](https://github.com/deepseek-ai/deepseek-harness/commit/81e05abaab) 整单 revert，随附的四组 Note 三件套及归档清单条目一并删除（期间误删的一条已封存图表预览 Note 紧接着在 [`e0427f38e9`](https://github.com/deepseek-ai/deepseek-harness/commit/e0427f38e9) 按原 `sha256` 哈希原样恢复）；而从未正式发布过的内部探针残留被撤回时（[`26706559b2`](https://github.com/deepseek-ai/deepseek-harness/commit/26706559b2)），代码、Note 三件套和清单条目同提交一扫而空，绝不给未发版废案留历史牌位。

一句话总结仓库层的答卷：**方向怎么晃都不怕，只要每次转弯都把“现在的唯一真相”擦亮、把“淘汰老路的理由”归档封好，项目就不会因为敏捷迭代而烂成一锅粥。**
