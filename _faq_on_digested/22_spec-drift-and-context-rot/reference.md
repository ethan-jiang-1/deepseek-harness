# 出处清单

本篇全部结论的仓库位置。**源码核验基线**：DeepSeek Harness `dsh-v0.2.1-rc.2`，commit `687f282e8625c6b8d11ff58211a90524be2e4317`；所有行号在该工作树实测。历史案例另给提交号，并注明是当前工作树可核对还是仅历史可核。

`[原文]` 与 `[源码]` 的分工：前者是仓库里的直接陈述，后者是从源码或生成物核对出的机制事实。

## 一、上下文与记录面

| 事实 | 位置 | 类型 |
|---|---|---|
| 模型可见即已记录（架构层） | `docs/architecture.md:124` | `[原文]` |
| 同一条不变量（仓规） | `AGENTS.md:137` | `[原文]` |
| 会话只追加记录、压缩只遮蔽不删除 | `packages/core/session/README.md:12` | `[原文]` |
| surface 五类消息事件及其元数据规则 | `docs/subsystems/session.md:298` | `[原文]` |
| `replace` 遮蔽一段 surface 并原位插入 | `docs/subsystems/session.md:338` | `[原文]` |
| 面向人的 transcript 读 append 来源，因为 surface 故意遮蔽 | `docs/subsystems/session.md:358` | `[原文]` |
| `deriveMessages()` 纯函数投影、缓存、冻结 | `docs/subsystems/session.md:668` | `[原文]` |
| 请求信封是日志的纯函数；system prompt 是 surface 节点 | `docs/subsystems/session.md:183` | `[原文]` |
| 状态型事件必须携带完整后态而非增量 | `packages/session/session-projection/README.md:54` | `[原文]` |

## 二、compaction

| 事实 | 位置 | 类型 |
|---|---|---|
| 三个 `compaction/*` 事件是 log-only，summary 走带 `surfaceOp` 的 user/message | `docs/subsystems/compaction.md:11` | `[原文]` |
| `compaction/summary` 记录被遮蔽 seq 与 token 数 | `docs/subsystems/compaction.md:16` | `[原文]` |
| 锁的起止使崩溃留下可检测的孤儿锁 | `docs/subsystems/compaction.md:19` | `[原文]` |
| 原始事件留存、seam 不做重写 | `packages/compaction/compaction/README.md:142` | `[原文]` |
| 压缩缩的是派生历史，压不动 system prompt/工具/前缀 | `packages/compaction/compaction/README.md:161` | `[原文]` |
| 不可分单元无法压缩 | `packages/compaction/compaction/README.md:160` | `[原文]` |
| 只保留摘要文本；压不动前缀 | `packages/compaction/compaction-basic/README.md:12` | `[原文]` |
| 默认触发式与 headroom | `packages/compaction/compaction-basic/README.md:62` | `[原文]` |
| 每个范围从第一条非 system 节点开始 | `packages/compaction/compaction-basic/README.md:113` | `[原文]` |
| 摘要提示词要求保留 intent 一节 | `packages/compaction/compaction-basic/README.md:195` | `[原文]` |
| 压缩目标是「让另一个模型无损接着做」 | `packages/compaction/compaction-basic/README.md:191` | `[原文]` |
| **压缩时丢弃过期事实** | `packages/compaction/compaction-basic/README.md:224` | `[原文]` |
| 工具结果裁剪后原文仍在日志 | `packages/compaction/compaction-tool-result-pruner/README.md:12` | `[原文]` |
| 图片卸载是永久替换 | `packages/compaction/compaction-image-offload/README.md:12` | `[原文]` |
| 无可供模型调用的压缩工具 | `packages/compaction/compaction/README.md:159` | `[原文]` |

## 三、工作状态外置与再锚定

| 事实 | 位置 | 类型 |
|---|---|---|
| goal 跨 turn/resume/fork/重启存活 | `packages/goal/README.md:12`、`:72` | `[原文]` |
| 续跑许可（armed/disarmed）不持久化、每次 `agent/created` 解除 | `packages/goal/README.md:99` | `[原文]` |
| resume/fork 后需显式 rearm | `packages/goal/tool-goal/README.md:116` | `[原文]` |
| `update_goal` 的五个动作与精确 revision 要求 | `packages/goal/tool-goal/README.md:38` | `[原文]` |
| 每轮重发完整目标块，直到被压缩遮蔽 | `packages/goal/goal-round-driver/README.md:108`、`:112` | `[原文]` |
| 续轮要求以现场为准、不要相信早先叙述 | `packages/goal/goal-round-driver/src/prompt.ts:18`-`20` | `[源码]` |
| 终结轮要求只报告本会话真正建立的事实 | `packages/goal/tool-goal/src/wrapup.ts:6` | `[源码]` |
| 没有独立评估器 | `packages/goal/goal/README.md:159`、`packages/goal/goal-round-driver/README.md:125` | `[原文]` |
| plan 状态是单个 log-only 整值事件，resume/fork/压缩靠折叠日志恢复 | `packages/plan/plan-mode/README.md:81`、`:12` | `[原文]` |
| plan 投影按日志折叠 | `packages/plan/plan-mode/src/index.ts:9` | `[源码]` |
| review 的选择：批准 / 继续规划（退回修改） | `packages/plan/plan-mode/README.md`（Use this package 节） | `[原文]` |
| todo 整表快照落日志、跨 turn 与重开存活 | `packages/todo/tool-todo/README.md:12` | `[原文]` |
| **todo 是 log-only UI 状态，永不进入派生历史** | `packages/todo/tool-todo/src/types.ts:30` | `[源码]` |
| 指令基线被遮蔽后会在 pre-step 重新注入 | `packages/context/agent-instructions/README.md:220` | `[原文]` |
| 注入的指令是普通 user/message，随历史重放与压缩 | `packages/context/agent-instructions/README.md:88` | `[原文]` |
| 运行时上下文快照：不变不写、变了追加 | `packages/context/harness-dev-context/README.md:32` | `[原文]` |

## 四、按需加载、检索与隔离

| 事实 | 位置 | 类型 |
|---|---|---|
| skill 目录只含名字 + 截断描述，正文按需加载 | `packages/skill/tool-skill/README.md:12`、`:54` | `[原文]` |
| 目录消息声明「只是摘要，不要据此推断指令」 | `packages/skill/tool-skill/src/index.ts:268` | `[源码]` |
| 目录变更整份替换（含空目录退役旧名） | `packages/skill/tool-skill/README.md:57` | `[原文]` |
| 跨会话检索是 experimental 且默认关闭 | `packages/experimental/session-search/README.md:12`；`packages/experimental/tool-session-query/README.md:12` | `[原文]` |
| 被遮蔽事件仍可检索 | `packages/session-query/session-query-sqlite/README.md:59` | `[原文]` |
| fork 继承一次性前缀快照，后续父级写入不再进入 | `packages/subagent/subagent-fork-in-process/README.md:32`、`:143` | `[原文]` |
| spawn 空会话启动，任务提示必须自足 | `packages/subagent/subagent-spawn-in-process/README.md:12` | `[原文]` |
| 重复调用提醒阈值 3/5/8，只提醒不拦截 | `packages/guard/repeat-tool-reminder/src/index.ts:53`、`:219`；`packages/guard/repeat-tool-reminder/README.md:170` | `[源码]`/`[原文]` |
| 常驻文档词数上限与 manifest | `docs/AGENTS.md:51`、`:59`；`scripts/doc-budgets.manifest.json:2`-`:8` | `[原文]`/`[源码]` |

## 五、Agent Note 流程

| 事实 | 位置 | 类型 |
|---|---|---|
| 决定不可原地改写，只能取代并交叉链接 | `.agents/notes/README.md:48` | `[原文]` |
| 每篇新 Note 强制取代检查 | `.agents/notes/AGENTS.md:5` | `[原文]` |
| implemented Note 事实原地更新、不追加变更史 | `.agents/notes/implemented/AGENTS.md:7` | `[原文]` |
| 决定或理由的反转需要新 Note | `.agents/notes/implemented/AGENTS.md:13` | `[原文]` |
| 完全取代需合并并保全独有理由后删除 | `.agents/notes/README.md:50` | `[原文]` |
| 已交付特性被移除时的合并条件 | `.agents/notes/README.md:52` | `[原文]` |
| 归档三重判据与 keep 判据 | `.agents/notes/README.md:38` | `[原文]` |
| 被拒提案只在还能阻止错误时保留 | `.agents/notes/README.md:14`、`:38` | `[原文]` |
| 归档后永久冻结、不作现行权威 | `.agents/notes/README.md:42`；`.agents/notes/archived/AGENTS.md:3` | `[原文]` |
| 禁止集中索引及其理由 | `.agents/notes/README.md:19` | `[原文]` |
| 备选方案强制记录及其理由（防重吵） | `.agents/notes/README.md:111` | `[原文]` |
| 取代检查放在写作时刻的理由 | `.agents/notes/implemented/process/2026-07-26-frozen-agent-note-archive.md:35` | `[原文]` |
| 归档不进默认搜索的理由（旧事实会压过新事实） | 同文件 `:33`；`.rgignore:2` | `[原文]`/`[源码]` |
| 归档技能的判据是语义的、长度无关、无配额 | `.agents/skills/dsh-archive-agent-notes/SKILL.md:8`、`:23`、`:29` | `[原文]` |
| 语义边界归 review，无自动分级门禁 | `.agents/notes/archived/process/2026-07-19-require-agent-notes-for-non-trivial-changes.md:22` | `[原文]` |
| 现行提案自述维护压力（580 文件 / 637,850 词） | `.agents/notes/proposed/process/2026-08-20-audience-first-documentation-quality.md:35` | `[原文]` |
| 格式门禁拒绝 implemented 中的提案期标题 | `scripts/verify-agent-note-format.ts:74` | `[源码]` |
| 归档门禁：三件套完整、状态行、日期、sidecar 哈希、封存清单 | `scripts/archived-agent-notes.ts:122`-`:195` | `[源码]` |

## 六、文档层级与门禁

| 事实 | 位置 | 类型 |
|---|---|---|
| 一个事实一个家 | `docs/AGENTS.md:15`-`:17`、`:19`-`:34` | `[原文]` |
| 只写当前状态，历史归 commits/PR/Note/postmortem | `docs/AGENTS.md:40` | `[原文]` |
| slop 清单：状态会腐烂、禁止手抄目录等 | `docs/AGENTS.md:65`-`:69` | `[原文]` |
| 生成目录禁止手改、freshness 门禁 | `docs/AGENTS.md:33` | `[原文]` |
| `doc-sync` 叶子门禁清单 | `scripts/run-gates.ts:815`-`:872` | `[源码]` |
| 生成器的 `--check` 孪生 | `package.json:162`-`:216` | `[源码]` |
| 工具目录完整性守卫及其自述 | `docs/tool-catalog.md:8` | `[原文]` |
| 配置目录会拒绝「schema 接受但类型未声明」的字段 | `scripts/gen-config-catalog.ts:872` | `[源码]` |
| 证据要求：可证伪、可重算，不靠手工同步 | `docs/defensive-patterns/README.md:15` | `[原文]` |
| 可机械检查的不变量必须接入顶层门禁 | `AGENTS.md:175` | `[原文]` |
| 文档随代码同一变更更新（review 保证） | `AGENTS.md:177` | `[原文]` |
| pre-stable、相邻迁移、升级指南三条 | `AGENTS.md:5`、`:7`、`:11` | `[原文]` |
| 快照政策：非平凡可见变更需录制场景 | `docs/testing.md:55` | `[原文]` |
| 快照世代只追加、不重命名不删除 | `snapshots/AGENTS.md:7`；`:11` | `[原文]` |
| 持久化变更必须确认 | `docs/persistence-changes/README.md:49`；`:35`、`:40` | `[原文]` |
| 持久化校验的自述限度 | `docs/persistence-changes/README.md:63`、`:78` | `[原文]` |
| 双语门禁的自述限度 | `docs/i18n/README.md:44` | `[原文]` |
| 升级指南门禁只查形状（目录不存在即通过） | `scripts/verify-upgrade-guides.ts:57` | `[源码]` |
| 预算目标与 manifest 上限数值不同 | `docs/AGENTS.md:59`；`scripts/doc-budgets.manifest.json:4`、`:6` | `[源码]` |

## 七、历史案例

| 案例 | 提交 | 可核对位置 |
|---|---|---|
| 提案 11 周后被否决 | `a7a5be1703` | 当前树 `.agents/notes/rejected/architecture/2026-06-16-typed-event-schemas.md:3` |
| 一次性归档 453 组、拒 7 篇、删 2 篇 | `a7a5be1703` | 提交信息（`git log -1 a7a5be1703`） |
| 删除 SQLite 后端并改写文档 | `4553c9d957` | 后继 Note `.agents/notes/implemented/simplification/2026-08-30-jsonl-only-session-persistence.md:31`；归档 Note 的 `Archived:` 行 |
| 部分取代（Node 原生启动 → tsx ESM） | 现行篇 `.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md:7` | 归档篇逐条点名幸存项：`.agents/notes/archived/architecture/2026-07-28-dsh-native-typescript-source-launch.md:8` |
| 特性次日回滚，Note 删除 + 一条封存 Note 按原哈希恢复 | `81e05abaab`、`e0427f38e9` | 提交标题（`git log -1`） |
| 未发布能力撤销，Note 与清单条目同删 | `26706559b2` | 提交标题 |
| 重复描述导致真实漂移事故 | — | `.agents/notes/implemented/architecture/2026-09-19-window-drag-coverage-contract.md:9` |
| 没有 CI 跑真实启动路径，不兼容静默上线 | — | `.agents/notes/implemented/architecture/2026-07-29-dsh-source-launch-tsx-esm.md:11` |
| postmortem 的定义与用途 | — | `docs/postmortem/README.md:7` |
| 插件仓语料的漂移论断 | — | `_dsh_plugin_agent_ready_development/repo-harness/08-repository-taxonomy.md:5`、`02-legibility-and-ownership.md:45`、`:47` |

## 八、本篇实测口径

- **Note 计数**：`find .agents/notes/<lifecycle> -name '*.md' ! -name '*.zh.md' ! -name 'AGENTS.md' ! -name 'CLAUDE.md' | wc -l` → proposed 42、implemented 293、rejected 8、archived 924（活跃合计 343）。中英对照与 `.i18n.yaml` sidecar 不计入。
- **skills 计数**：`.agents/skills/` 下 19 个目录（同一层另有 1 个 `.gitignore`；`ls` 默认不显示点文件，所以 `ls | wc -l` 也是 19）。
- **浅克隆**：`.git/shallow` 158 行；历史边界之外不作断代。
- **未在本篇出现的写法**：仓库内不存在「context rot」这一术语（实测全仓检索无命中）；本篇的「上下文腐化」是为提问者用词保留的中文说法，不是 DSH 的官方词汇。
