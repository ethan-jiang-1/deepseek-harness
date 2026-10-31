# Quality review · 2026-10-27

> 早期两轮工作底稿（v1/v2）已从语料移除；下文提到 v1/v2 指当时的记录，文件本身看 git 历史。
>
> 下文提到的 `90-advisor/architectures/` 分篇后来合并回 [92](../90-advisor/92-native-reference-architectures.md)，目录已删；需要追溯看 git 历史。

这是按日期记录的结构与一致性审查历史；较早条目不代表当前合同。当前事实与数据卡模板见目录正文和 [reference](./reference.md)。最近一次复核与验证范围见末尾的 2026-10-31 条目。

## 1. 结构

| 之前 | 现在 |
|---|---|
| 20 个 `.md` 平铺在根目录 | `00-index` + `00-question` + `00-answer`，其余按 `10-foundations` / `20-native` / `30-external` / `90-advisor` / `40-evidence` 分组 |
| 计划、v1 研究、v2 研究、review 混在一起 | `40-evidence/v1/`、`40-evidence/v2/`、`research-native`、`research-external` 分开 |
| 没有单一入口 | 新增 [00-index](../00-index.md)：30 秒结论、八格画布、十条原则、archetype 快速索引、按问题分流、阅读路线；[40-evidence/00-index](00-index.md) 区分当前证据与 v1/v2 历史 |

设计目标：**入口像 data architecture advisor，细节像 reference**。根入口负责“先想什么、按什么顺序读”，子目录负责“具体怎么放”。

## 2. 发现与修正

| # | 问题 | 严重度 | 修正 |
|---|---|---|---|
| 1 | 20 个文件平铺；章节编号与目录/阅读顺序不一致 | 高 | 按类型分 5 个子目录；按阅读顺序重排为 11–14 foundations、21–22 native、31–33 external、91–92 advisor；`00-index` 定义路线；图名同步 |
| 2 | “平面”与“家”混用 | 中 | 原生章节统一为“家”；11 首段注明“家（也可叫平面）”；历史 v1 保留“平面”作为历史用语 |
| 3 | `00-question` 说“客户端是第六个家”，但五个家里已经包含客户端 | 高 | 改为“客户端是另一种落点，不是第六种承诺”；五个家仍为内容/历史/状态/派生/客户端 |
| 4 | `13` 的“会话 cwd 不可变”与 `working_directory` 可改冲突；同段还重复一条 bullet | 高 | 改为 `header.cwd` 不可变（项目归属锚点），当前工作目录可由 `working_directory` 改；删除重复 bullet |
| 5 | `reference` 的“七之二”编号、社区来源标题与 native/external 分层不一致 | 中 | 改为“六、外部插件来源”“七、外部生态来源”“八、v2 追加证据”“九、相关阅读” |
| 6 | `31` 用“上一版”指代 v1，对新读者不清楚 | 低 | 改为“本 FAQ 第一版”；31 明确是外部参考 |
| 7 | 92 的“DSH 映射：社区 workspaceCordis”在原生章节里未标外部 | 低 | 改为“外部插件（E1）的 workspaceCordis” |
| 8 | 22 的“社区插件直接改日志”未标外部 | 低 | 改为“外部插件（E1）” |
| 9 | `40-evidence/v2/plan` 状态仍写“待 review，只写计划” | 低 | 改为“已执行”，记录探针降级 |
| 10 | `research-v1` / `review-v1` 与 v2 文件混在根目录 | 中 | 移入 `40-evidence/v1/`，v2 移入 `40-evidence/v2/`；文件名区分 |
| 11 | 绝对路径/相对链接在移动后可能断 | 高 | 移动时用脚本解析每个本地链接，按新目录重算相对路径；`verify.mjs` 223 个文件通过 |
| 12 | 21/22/33/92 图注与原生/外部分层不完全一致 | 低 | 21 原生 landscape；22 原生时间线；33 明确外部参考；92 原生优先 |

### 2.1 稀疏编号后的复检（2026-10-27 第二轮）

| # | 问题 | 严重度 | 修正 |
|---|---|---|---|
| 13 | `21` 把 33 个家都叫“原生”，但 L2 含 `PLUGIN-DATA` 无主区 | 中 | 改为“33 个 DSH 侧数据落点（含无主/边界）”；`00-index`、quality-review 同步 |
| 14 | `00-index` 写“21 只放原生；33 只放外部”，漏了 31/32 也是外部 | 中 | 改为“31/32/33 只放外部” |
| 15 | 稀疏编号后，`00-question` 阅读顺序仍用 `[01]/[02]/[03]/[04]` 标签 | 中 | 改为 11/12/13/14；`31` 的自引用改为 32 |
| 16 | quality-review 说 archetype 锚点依赖“11 的标题” | 低 | 改为依赖 92 的标题；v2 的 33 家表述加“含无主/边界” |
| 17 | 图名与章节号在稀疏编号后需再次对齐 | 低 | 11/13/14/21/22/31/32/33/92 图名全部同步；链接 223 个通过 |
| 18 | `92` 把 `localStorage` / `ctx.storageDomain` / `present` 的 N 级别混在一起 | 中 | 客户端 `localStorage` 标平台（不是 N0）；`storageDomain` N0 + backend N1；`present` N1 |
| 19 | `21`/`31`/`33` 仍有“10/08 外部模式”的旧标签；31/33 标题都叫“外部插件模式” | 中 | 改为 21/31/32/33；31 叫“外部社区模式”，33 叫“外部插件案例” |
| 20 | `21` 的“两类不可变对象”把请求图/缓存/暂存也归为永久权威 | 中 | 改为“附件对象/缓存”；对象内容寻址，请求图/缓存/暂存是派生/可清 |
| 21 | `92` 的 §2/§4 布局硬编码 `~/.dsh`，与“不要硬编码 home”冲突 | 中 | 改为 `$DSH_HOME/<plugin>/...`；§4 注明自造目录无核心契约 |
| 22 | `91` 数据卡用 `.agents/memory.md` 当 N0 示例，容易被读成原生路径 | 低 | 改为 `<project>/.your-plugin/memory.md`，并注明 `.agents` 是 E1 约定 |
| 23 | `40-evidence` 文件多，当前证据与 v1/v2 历史没有局部入口 | 中 | 新增 `40-evidence/00-index.md`：当前证据、v1/v2 历史、阅读顺序、标签 |
| 24 | `90-advisor` 只写“原生优先”，没有把原生核心 / 原生插件 / 扩展插件分开；扩展插件发布成本没讲 | 高 | `91` 增加依赖层级表与 Q18；`92` 增加 N0/N1/N2/N+/E1/E2 与“不把 E1 写进 dependencies”的发布规则；`00-index`/`00-answer` 同步 |


### 2.2 独立审计补充（2026-10-27 第三轮）

| # | 问题 | 严重度 | 修正 |
|---|---|---|---|
| 25 | `reference` 把 P5/P6 也列进“承诺”，与 `00-answer` 五种承诺冲突 | 高 | 表只留 P0–P4；P5/P6 改为“运行时/客户端落点，不是承诺”；31 的选型表同步改列名 |
| 26 | `31` 的 #14/#16 是同一“软删+compact”手法，十八种实为十七种 | 高 | #16 换成“导出/导入包（manifest + 去重）”，保持十八种且不重复 |
| 27 | `research-external` 深读列 8+6+10=24，与“15 深读”冲突 | 高 | 改为 8/4/3，合计 15 |
| 28 | `91` 说“再加两个工程问题”，实际 13–18 共六条 | 中 | 改为“六个” |
| 29 | `91` 编号顺序把客户端放 P4 之后，判断图却放在 P2 之后 | 中 | 两处都改为 P2 → 客户端 → P3 → P4 → P5 |
| 30 | `21` 的 1,272 与 298+42+925=1,265 不一致 | 中 | 改为“约 1,265”，并让 research-native 同步 |
| 31 | `research-native` 指向不存在的 `01-dsh-inventory.md` | 中 | 改为“本文件 §5 附录” |
| 32 | `12`/`33` 残留“03 篇/04 报告/02/03”旧编号；`05-evidence` 空目录 | 低 | 改为 13/research-external；删除空目录 |
| 33 | `00-index` 的 MCP/偏好/项目索引分流指向错节，且缺无匹配回退 | 中 | 改指 92 §8 / §2 / 91 例1；加“无匹配读 21 表 L1”回退；补 22 §3/11 家锚点 |
| 34 | `92` 的 C 路线和“选型表”把外部服务放在“次选”，容易被读成推荐 | 高 | C 路线标 E2 仅参考；“次选”改为原生；外部移到“最后/避免”；`00-answer` D 加“仅 A/B/C 都不够” |
| 35 | `91` 例 2 / 数据卡用 `.agents` 当原生示例 | 低 | 主路径改 `.your-plugin`，注明 `.agents` 是 E1 约定 |
| 36 | `21` 的 N0/N1/N2 标签与 advisor 用词不完全一致 | 低 | 统一为 N0 原生核心 / N1 原生插件 / N2 原生实验 |


## 3. 一致性检查

### 计数

| 数字 | 位置 | 一致性 |
|---|---|---|
| 33 个 DSH 侧数据落点（含无主/边界） | 21 表 L2（代表）+ research-native 33 行完整清单 | 一致 |
| 12 个 archetype | 21 表 L1 | 一致 |
| 10 个参考架构 | 92、00-index | 一致 |
| 15 个外部深读 | 33、research-external | 一致 |
| 18 种手法 | 31、00-answer、00-index | 一致 |
| 18 问 | 91、00-index | 一致 |
| 22 个时间线事件 | 22、research-native | 一致（research-native §5 另有 44 条全量事件；口径不同：22 是“关键事件”） |

### 术语

- 原生章节统一“家”；“平面”只在问题标题、v1 历史记录、11 的同义说明里出现。
- 外部内容统一标 **E1**（社区插件）/ **E2**（外部服务）；原生标 **N0/N1/N2**。
- “社区”在原生/advisor 章节只以“外部插件（E1）”出现；31/32/33 是外部专章。

### 权威与派生

- 11/12/13 都明确“一个事实一个权威”；21/22 把 workspace 权威、projcache 派生分开；92 每个 archetype 都写权威。
- 22 明确 `session_projcache` 与 `workspace.json` 同目录同后端是“派生/权威未声明”的风险；92 在会话归档/索引处重复提示。

### 逻辑自洽

- `header.cwd`（不可变、项目归属）与 `working_directory`（可改、当前工作根）已分开。
- session 日志有跨进程 kernel lease；domain JSON 没有跨进程锁；12/13/21 都按这一区分表述。
- settings 是 profile 作用域，不是账号；12/22/92 一致。
- 附件无 GC 是刻意（引用感知 GC blocker），不是遗漏；14/22 一致。
- 客户端分两层：纯 UI（localStorage）vs session-derived（projection）；11/21/92 一致。
- 原生优先：21 只放原生，31/32/33 只放外部，92 路线表标 N0/N1/N+/E；31/32 明确外部参考。

## 4. 仍存在的重叠（有意保留）

- **21 原生 landscape**：回答“DSH 自己有哪些家”。
- **22 原生历史**：回答“这些家怎么长出来”。
- **31 外部社区模式**：模式库，按九个维度组织，回答“别人怎么做”。
- **32 外部生态对照**：VS Code/Claude Code 等，回答“别的生态怎么切同一道题”。
- **33 外部插件案例**：15 个案例，回答“具体插件怎么补缺口、哪些反模式”。
- **42 原生参考架构**：回答“我该选哪条路”。

外部三者视角不同，但都涉及外部样本；00-index 的阅读路线明确“原生优先、外部只读”。如果你希望更瘦，可以下一步把 31 的“v2 市场补充”并入 33，或把 32 压成一张表；本轮先保留，因为它们是不同问题。

## 5. 仍不确定 / 质量边界

- 外部插件没有安装实测；S 只代表源码阅读，R/U 仍是作者声明/未确认。
- 本仓库浅克隆，2026-06 前历史靠 Note/docs 复述。
- `00-index` 的 archetype 锚点依赖 92 的标题；若改标题需同步。
- 40-evidence/v1/ 是历史记录，不应作为当前合同；文件头已标 v1，个别旧表述（如“十五种手法”）作为历史保留。
- 92 仍是 392 行的长章；10 个 archetype 暂未拆成独立文件。若后续继续增长，建议按 archetype 拆分到 `90-advisor/architectures/`。（2026-10-30 已拆分，见 §9）
- 社区样本的版本兼容声明会随 RC 漂移；本目录只保证“写作时点的源码阅读”。

## 6. 本轮验证

- `node _faq_on_digested/verify.mjs`：223 个 Markdown，链接/锚点全部可解析。
- `pnpm run test:docs`：21 个 doc-quick 门禁通过。
- `pnpm run doc-sync`：43 个门禁通过（最终结构）。
- `pnpm run verify-repository-references`：通过。
- `git diff --check`：通过。
- SVG XML 解析 + `rsvg-convert` 目检。

## 7. 建议的下一步

1. 按 00-index 的阅读路线走一遍，确认 advisor 入口是否讲清了“先想什么”。
2. 决定是否把 31/32/33 的外部材料再压缩，或保持“模式库 / 生态对照 / 案例”三分。
3. 决定是否把 92 拆成 `90-advisor/architectures/` 下的 10 个文件。
4. 确认后整理成一次 `docs(corpus): ...` 提交。

## 8. 2026-10-30 · 插件即产品轮

本轮把 FAQ 26 从"插件数据放哪"重做为"当一个插件就是整个 DSH"，来源是调研稿（已并入本篇后从 `_misc/` 移除）与一个工作台类实例的运行时读数。

**改动**

- 目录改名 `26_plugin-data-model/` → `26_plugin-as-product/`，`_faq_on_digested/00-index.md` 同步。
- 重写 [00-question](../00-question.md)、[00-answer](../00-answer.md)、[00-index](../00-index.md)：四空间、工具面、启动四状态、六种承诺（新增 P5 产品实例）。
- 新增 [15 四个空间](../10-foundations/15-four-spaces.md)、[16 启动解析](../10-foundations/16-startup-resolution.md)、[17 配置分层](../10-foundations/17-config-layers.md)。
- 回填 [11](../10-foundations/11-five-homes.md)（六种承诺）、[12](../10-foundations/12-state-homes.md)（产品全局设置不是 settings）、[13](../10-foundations/13-scope-and-keys.md)（实例不是第七个作用域 + 三把键）、[21](../20-native/21-native-data-landscape.md)（第三层视角）、[31](../30-external/31-external-community-patterns.md)（P5 旧引用）、[91](../90-advisor/91-checklist.md)（六问 + 反模式）、[92](../90-advisor/92-native-reference-architectures.md)（§11 产品实例 / 九格画布）、[reference](./reference.md)（P0–P5）。

**新增证据等级**

- **R（运行时实测）**：`$DSH_HOME/storages/workspace.json` 为 domain `workspace` v2；已绑定会话头含 `cwd`/`agentPreset`/`sandbox/mode`/`approval/policy`；该样本插件的落盘全走 `node:fs`；其 preset 不含 `tool-fs`/`tool-bash`；profile 未覆盖产品那一行。
- **C（源码）**：`applyEntryPatches` 的整对象替换、config-editor 写完整对象、`initializeDefault` 的空 registry 条件、`session.create` 的 `mkdir -p`。

**验证**

- `node _faq_on_digested/verify.mjs`：26 子树 **0 违规**（链接与锚点）。
- 全量运行仍有 20 条，全部来自被 `_faq_on_digested/.gitignore` 排除的本地 `03_model-vendors/03_model-vendors-worktree/`，属既有本地残留，不在提交范围。
- `node _misc/verify.mjs`：通过。

**未完成/边界**

- 图：旧的 `00-author-promises.svg`（只画 P0–P4）已由 `00-promises-six.svg` 取代并删除；新增 `15-four-spaces.svg`，两图都用 `rsvg-convert` 目检过。
- 启动竞态、客户端插件调用顺序、Windows ACL 仍标 **U**，见 [16](../10-foundations/16-startup-resolution.md) 的"待核实"。
- 16/17 的"配置五层"与 `_misc` 08 的"四层 + 全局设置"口径一致，但 `_misc` 是调研稿，不作为合同。

## 9. 2026-10-30 · 系统性复核（方向变更后）

方向从"插件数据模型"改成"插件即产品"后做的第二轮结构复核，目标是消除潜在矛盾与叙事漂移。

**结构**

- 叙事骨架统一为「承诺 → 空间 → 家 → 启动/配置」，在 [00-index](../00-index.md) 新增"怎么读：四套词汇的关系"；[00-answer](../00-answer.md) 的章节重排为 承诺 → 空间 → 工具面，并统一 H1 为"承诺、空间、工具面与启动状态机"。
- 修正空间模型矛盾：账本不再是"可重建"的同义词，拆成**可重建索引**与**不可重建状态**（绑定、游标、已采纳标记）两类，见 [15](../10-foundations/15-four-spaces.md)；"用户选定的根"归位到全局设置，[16](../10-foundations/16-startup-resolution.md) 同步。
- 新增 [18 安装升级](../10-foundations/18-install-upgrade.md)：profile 创建、bundle 重启边界、`engines.dsh` 跳过与豁免、三层升级、卸载四处残留。
- 去掉 deckline 中心化：具体目录树与个人路径**从正文移除**（证据只留 00-answer 的 R 标注与 `40-evidence`）；[92](../90-advisor/92-native-reference-architectures.md) 的推荐按写路径需求而非示例现状。
- [91](../90-advisor/91-checklist.md) 的"第零步"与六种承诺对齐，客户端本地与每项目运行时降为"不是承诺的运行时选择"。
- 给 [11](../10-foundations/11-five-homes.md)、[12](../10-foundations/12-state-homes.md)、[13](../10-foundations/13-scope-and-keys.md)、[14](../10-foundations/14-artifacts.md)、[31](../30-external/31-external-community-patterns.md) 加了到新骨架的桥接句。

**图**

- `15-four-spaces.svg` 的账本框改为"插件记录：索引可重建 / 绑定不可重建"，与正文一致。

**验证**

- `node _faq_on_digested/verify.mjs`：26 子树 0 违规。

## 10. 2026-10-30 · 拆 92 与旧章重写

- **92 拆分**：拆成总览（九格画布、依赖层级路线表、分篇索引、选型表）与 `90-advisor/architectures/` 下 11 个分篇（01–11）。[00-index](../00-index.md) 的 archetype 链接改指分篇，目录树与章节地图同步。
- **旧章重写**：[21](../20-native/21-native-data-landscape.md) 增加"产品型实例视角"（六个高频落点与 N+ 的含义）；[22](../20-native/22-native-data-history.md) 增加四条历史决定对产品的后果。
- **外部章映射**：[31](../30-external/31-external-community-patterns.md)、[32](../30-external/32-external-ecosystem.md)、[33](../30-external/33-external-plugin-patterns.md) 各补"映射到四个空间与六种承诺"。
- **18 加深**：[18](../10-foundations/18-install-upgrade.md) 补失败与半装、回滚演练、`dataRoot` 迁移、卸载验收。
- **证据标注**：[12](../10-foundations/12-state-homes.md)、[13](../10-foundations/13-scope-and-keys.md)、[91](../90-advisor/91-checklist.md)、[92](../90-advisor/92-native-reference-architectures.md) 补行内 `C` 标注。
- **验证**：`node _faq_on_digested/verify.mjs` 在 26 子树 0 违规（38 篇 Markdown）。

## 11. 2026-10-30 · 二阶段：概念层与基础四章

- **概念层**：新增 [10 概念层](../10-foundations/10-taxonomy.md)——承诺→空间→家→作用域/键、三条横切、"一章一个事实"分工表、五条常见混淆；[00-index](../00-index.md) 的读法改为引用它，两种读者路线同步。
- **基础四章**：[11](../10-foundations/11-five-homes.md)–[14](../10-foundations/14-artifacts.md) 各加"产品型实例里怎么用"，开头定位到概念层；删除与新层重复的解释。
- **去重**：[15](../10-foundations/15-four-spaces.md) 的可写性段落收成一句并指向 [17](../10-foundations/17-config-layers.md)；[00-answer](../00-answer.md) 的承诺速查表标注权威定义在 10/13。
- **术语**：00-index 术语表修正"账本=可重建"的旧口径，新增"产品型实例"与"账本·索引/状态"。
- **参考层**：[21](../20-native/21-native-data-landscape.md) 的落点表加"四空间"列；[22](../20-native/22-native-data-history.md) 加"22 个事件按空间归组"；[31](../30-external/31-external-community-patterns.md)–[33](../30-external/33-external-plugin-patterns.md) 补统一角色横幅（外部参考层）。
- **图**：新增 `10-taxonomy-flow.svg` 与 `16-startup-states.svg`；旧 `00-ownership-matrix.svg`（只画 P0–P4）退役并删除，00-question/00-answer 改用新图。
- **验证**：`node _faq_on_digested/verify.mjs` 在 26 子树 0 违规；两张新图 `rsvg-convert` 目检。

## 12. 2026-10-30 · 收尾：外部参考压缩、事件映射、答案收紧

- **[31](../30-external/31-external-community-patterns.md)**：删掉独立的 "v2 市场补充" 小节，把五条观察折进维度三（凭据三种家、卸载非生命周期）、维度八（迁移只在严肃数据）、维度九（客户端跨源、声明质量）；补一条指向 33 的深读链接。
- **[32](../30-external/32-external-ecosystem.md)**：把 "映射回 DSH" 与 "映射到四个空间与六种承诺" 合并为一节。
- **[33](../30-external/33-external-plugin-patterns.md)**：把 "横向模式" 与 "五个作者在补的缺口" 合并为 "横向模式与缺口"（表 + 五条收敛）。
- **[22](../20-native/22-native-data-history.md)**：时间线表新增 "层/空间" 列，22 个事件逐条标注。
- **[00-answer](../00-answer.md)**：211 → 179 行；选型压成"第 0 问 + 承诺速查"，主要 API 表改为指向 10/15/91，三种架构表压成一句摘要 + 92 §11 链接。
- **验证**：`node _faq_on_digested/verify.mjs` 在 26 子树 0 违规。

## 13. 2026-10-30 · 证据等级与实验收口

- **图例统一**：T（可复现命令+输出）/ C（源码或 docs 合同，尽量给符号）/ H / P / S（第三方源码）/ R（第三方 README）/ U。修正了 `R` 的双重含义（00-answer 曾用它表示运行时实测）；四处图例与引用约定同步（00-index、00-question、22、40-evidence/00-index、21/92 的提及）。
- **实验层**：新增 [experiments/](./experiments/00-index.md)。实验 02（客户端调 `uiWorkspace.connectWorkspace`）与 03（插件经 `ctx.fiber.entry` + `ConfigEditor.edit` 回写自己那一行）已用源码收口为 **C**；实验 01（启动竞态）给出可证伪设计与阻塞原因，维持 **U**。[16](../10-foundations/16-startup-resolution.md) 的三条待核实同步更新。
- **本机观测（T）**：experiments §04 记录了两条可直接粘贴的命令与输出（workspace domain v2；会话 V4 首帧含 `cwd`/`agentPreset`），个人值已脱敏；[00-answer](../00-answer.md) 的 R 标记随之改为 T。
- **外部边界**：[31](../30-external/31-external-community-patterns.md) 与 [33](../30-external/33-external-plugin-patterns.md) 的边界写明“外部源码与 README 不得支撑 C 级结论”；[reference](./reference.md) 增加“复核方式（按等级）”一节。
- **刻意不做**：不引入 probe 脚本、不做第三方安装实测——这些是一次性只读命令，写进文档即可复现；维护脚本的成本高于收益。
- **验证**：`node _faq_on_digested/verify.mjs` 在 26 子树 0 违规。

## 14. 2026-10-30 · 凸显施工图（90-advisor）

- 新增 [90 动手](../90-advisor/00-index.md)：两条施工路线（普通插件 / 应用型插件）、应用七问、七步顺序、一页判断与五个半成品反例。
- 新增 [93 端到端例子](../90-advisor/93-app-plugin-walkthrough.md)：一个看板应用从 profile、架构、根、配置、账本、安装升级到卸载的完整走法。
- [00-index](../00-index.md) 在定义后加"要动手写插件？直接去 90"的入口；阅读路线首条改为"要动手写插件"；分流表、目录树、章节地图补 90/93。
- [91](../90-advisor/91-checklist.md) 与 [92](../90-advisor/92-native-reference-architectures.md) 顶部加施工入口链接；`_faq_on_digested/00-index.md` 的 26 行补指向。
- 验证：`node _faq_on_digested/verify.mjs` 在 26 子树 0 违规。

## 15. 2026-10-30 · 信噪比与施工入口

- **必读三篇**：00-index 顶部新增"00-answer → 90 动手 → 91 检查表"；其余按需查、不必通读。
- **读法合并**：原来的"阅读路线 / 信号标记 / Agent 使用方式"三节收成"读法"一节（按时间预算、按角色、信号、Agent 四小节），00-index 从 247 → 212 行。
- **目录结构压缩**：41 行的完整文件树改为 8 行目录级概览；精确文件清单保留在"章节地图"。
- **施工入口**：[90 动手](../90-advisor/00-index.md) 新增"一页施工卡"（11 项检查），入口自足。
- **一致性修补**：[91](../90-advisor/91-checklist.md) 补上"P3 宿主账本再分索引/状态"——这是账本二分在检查表中的缺口。
- **复核**：链接与锚点 0 违规；章节地图 20 行覆盖 18 章 + 00 两篇；术语（四个空间/五个家/账本·索引·状态/工具面）在正文一致。

## 16. 2026-10-30 · L2 读者测试与结构修补

- **读者测试**：三个子代理分别扮演新插件作者、产品型实例作者、审稿人，只读施工路径并产出计划。前两个已返回（各 8 条卡点）；审稿人仍在运行。
- **启动状态机重写**（[16](../10-foundations/16-startup-resolution.md)）：`unresolved` 原来没有可达条件、`pending` 不参与解析；现在明确 `default` 与 `unresolved` 是策略差异，`pending` 写 `settings.json` 并在下次启动强制 unresolved。`adopted` 存 `settings.json` 的 `adoptedRoot`、配置指针统一叫 `projectsRoot`，不再与 `sandbox-policy.workspaceRoot` 混用。
- **占位断言降级**：16/00-answer/00-index 不再写"才能挡住""确定做法"，改为"可以挡住、是概率性缓解（U，见风险 1）"。
- **workspace 登记可选**：架构 I 不登记 registry，只有用侧栏/会话分组的架构 II 才登记；00-answer 定义与推论、15 的角色表、93 §4 同步。
- **客户端插件契约**：16 新增最小契约（status/adopt 两个 Remote、弹窗时机、`connectWorkspace`）；93 与 90 七步补"不含客户端插件"的说明。
- **安装/卸载**：18 补 bundle 重算保序与追加规则、P5 缺失行 fail loud、卸载所有权判据；15/91 统一 domain 与 dataRoot 的取舍。
- **L1**：>240 字段落清零；各章具备"这一篇回答什么"与"边界"；跨文重复只剩结构性的回链与边界句。
- **历史底稿**：v1/v2 已移除（结论吸收进正文，git 历史保留），引用改指 quality-review。
- 验证：`node _faq_on_digested/verify.mjs` 在 26 子树 0 违规。

## 17. 2026-10-30 · 审稿人复核：10 条全修

- **重启语义**（[18](../10-foundations/18-install-upgrade.md)）：原文"bundle 成员必须重启"与源码不符——`plugin-manager` 在有 HMR 时返回 `application: 'applied'`，无 HMR 才 `restart-required`/`no-hmr`；base/web 默认启用 HMR，headless 显式禁用。改为"以 `ChangeResult.application` 为准"，同步 18 的清单、93 的安装/升级与 00-index 的表述。
- **占位条件**：90 的七问第 3 问与 93 的规则把占位写成无条件；改为"仅使用 DSH 侧栏时登记"，93 注明架构 I 不适用。
- **项目根 vs workspace**：定义式仍是"workspace 根"，在 00-answer/00-index/00-question/91 的定义处补注"产品自己的项目根（`projectsRoot`），只有架构 II 登记为 DSH workspace"。
- **配置链**：[17](../10-foundations/17-config-layers.md) 的两条优先级链合并为一条（代码默认 → bundle → profile → home → `--patch`），`dataRoot` 设置文件标为链外运行时存储。
- **账本二分**：15 的"可重建账本"改为"可重建的项目索引（绑定另存）"；00-answer 的"只存索引"改为"索引与绑定"。
- **占位路径**：统一为 `<dataRoot>/workspace`（16/91/00-answer/93），与 default 根一致。
- **模型写判据**：15 的捷径改为"通用文件工具直接改 → 会话 cwd 内；仅经插件工具改 → 不必是 workspace"。
- **dataRoot 前提**：00-answer/00-index/15/16/93 的"跨 profile 一致"补"`dataRoot` 稳定时"。
- **重复表**：10 的四空间表删除，只留一句总结 + 链 15；00-answer 的全局设置行与 15 对齐（加 endpoint）。
- **根相对链接**：00-answer/00-index/15/16/17 的 `docs/`、`vendor/`、`packages/` 链接补足 `../../` 或 `../../../`，现在可点。
- **N+**：00-index 与 92 标明 N+ 是实现方式，不是第六个依赖级别；路线表标题补 N2 只参考。
- 验证：`node _faq_on_digested/verify.mjs` 在 26 子树 0 违规。

## 18. 2026-10-30 · L4 证据抽查与图口径

- **证据抽查（5 条最重的 C）**，逐条对到符号：
  1. `applyEntryPatches` 整对象替换：`vendor/include/src/index.ts:122` `target[key] = value`。
  2. `engines.dsh` 跳过 bundle 并写 stderr：`packages/boot/app-boot/src/profile.ts:120` `skipping profile bundle ...`。
  3. `workspace.delete` 只删登记、保留目录与会话：`packages/workspace/workspace/src/index.ts:310` 的 JSDoc 与实现。
  4. 设置页只接受 volatile 字段：`packages/settings/settings/src/index.ts:388` `isVolatilePath`。
  5. 会话 cwd 的公开读取：`packages/session/working-directory/src/index.ts:122` `WorkingDirectoryService.get(session)`。
- **图口径**：[15 四空间](../figures/15-four-spaces.svg) 的账本位置标注"默认 `$DSH_HOME/<plugin>/`"、全局设置标注"`dataRoot` 稳定时一致"；[16 启动](../figures/16-startup-states.svg) 的 default 根改为 `<dataRoot>/workspace`、占位改为"需侧栏"并弱化"挡住"为概率性；两张图用 `rsvg-convert` 重渲染确认无溢出。
- 验证：`node _faq_on_digested/verify.mjs` 在 26 子树 0 违规。

## 19. 2026-10-30 · 复测修复与 architectures 合并

- **轻量复测**（普通插件、产品实例各一轮）各报 5 条，已修：
  - **P2 项目内文件卸载不删**：写进 [15](../10-foundations/15-four-spaces.md)、[18](../10-foundations/18-install-upgrade.md)、[91](../90-advisor/91-checklist.md) 的数据卡。
  - **数据卡列错位**：91 的表头 9 列、分隔行 8 列，已补齐；93 的压缩卡片加注"完整模板见 91"。
  - **插件 `node:fs` 与沙箱**：17/00-answer 写明插件代码不受会话沙箱约束，架构 I 的写边界是进程账户权限。
  - **何时不必建账本**：15 补判据（项目内文件本身可作身份时先用文件）。
  - **侧栏判据**：16 补"是否需要侧栏的项目列表/会话分组"；A/B 形态给默认建议（早期 B，产品化后 A）。
  - **扫描 vs 登记**：91 第 22 问补默认建议（账本索引为权威，readdir 只做发现/修复）。
  - **占位删/留**：18 补"无会话删、有会话保留并追加"。
  - **engines 自检悖论**：18 明确产品插件无法自检，需 profile 里的常驻 launcher 行或独立小包。
  - **普通插件最小阅读集**：90 补"91 + 10 §3/§4 + 15 + 18"。
- **architectures 合并**：按反馈删除 `90-advisor/architectures/` 的 11 个分篇（目录价值低于维护成本），唯一独有的"数据面 S1/S2/S3"折进 [92](../90-advisor/92-native-reference-architectures.md)；92 的"分篇索引"删除，引用全部改指 92；10/00-index/90/93/21/31/33/quality-review 同步。
- 验证：`node _faq_on_digested/verify.mjs` 在 26 子树 0 违规。

## 20. 2026-10-30 · 最终审计（L4 收口）

- **段落阈值**：按验收标准把剩余 200–240 字符的段落也按句号拆开，非列表段落 **>200 字符为 0**。
- **表格**：全语料表格分隔行与表头列数一致（91 的 9 列卡片是唯一一处错位，已修）。
- **骨架**：10–18、21–22、31–33、91–93 全部含"这一篇回答什么"与"## 边界"。
- **架构目录**：`90-advisor/architectures/` 已删除（11 篇）；数据面 S1/S2/S3 折进 92；00-index 的重复 archetype 表删除，改为一段指针。
- **读者测试**：两轮轻量复测各 5 条、全部修复；终测代理超时中断，未产生新卡点证据。已修项：P2 卸载不删、数据卡列错位、插件 node:fs 与沙箱、何时不必建账本、侧栏判据、A/B 默认建议、扫描权威默认、占位删/留、engines 自检悖论、普通插件最小阅读集。
- 验证：`node _faq_on_digested/verify.mjs` 在 26 子树 0 违规；`git diff --check` 通过。

## 21. 2026-10-30 · 最小复测与最后三修

- 最小复测（只读 90 入口/93/18）报 3 条：bundle 包本体结构缺失（高）、Remote 形状缺失（中）、客户端产物升级（低）。
- [18](../10-foundations/18-install-upgrade.md) 新增"bundle 包本体"：`package.json` 的 `dsh.bundle.patch` 声明、patch 文件位置与"无声明只是普通依赖"；变更表补客户端产物行（**建议 U**）。
- [16](../10-foundations/16-startup-resolution.md) 的客户端契约补最小形状：`status()`/`adopt(path)`/`directoryPicker.pick()` 的返回与失败路径，明确"形状由插件定义、不是 DSH 合同"。
- 最终审计：`verify` 26 子树 0；非列表段落 >200 字符 0；表格列数一致；骨架齐全；`architectures/` 已删且引用清零。

## 22. 2026-10-30 · 删除后的系统复核

- **术语**：21 的"12 个 archetype"改为"12 类数据场景"，与 92 的 11 个插件 archetype 区分；92 开头加了一句"两套视角不是同一套编号"。
- **92 的措辞**："已合并回本篇与各基础章"改为"已删除；共性结论在路线表与选型表"——分篇内容并未保留，原说法不实。
- **占位措辞**：16/92/93/00-index 残留的"占位防抢占"改为"占位（需侧栏）"；16 的开机策略句补"用侧栏时再登记占位"。
- **索引链接**：00-index 分流表里把 92 当泛化兜底的三行改回具体章（14/15、91/18、11/13）；"92 对应 archetype"改为"92 路线表"。
- **目录树**：40-evidence 描述从"与历史"改为"与审计"（v1/v2 已删）。
- 扫描：链接/锚点 0 违规；跨文重复只剩回链、角色横幅、定义注、边界句；表格列数一致；非列表段落 >200 字符 0。

## 23. 2026-10-30 · 复核补丁

- [15](../10-foundations/15-four-spaces.md) 的归属表把账本位置写成 `dataRoot`，与"优先 storageDomain"冲突；两行改为"优先 storageDomain；产品实例可 dataRoot"，会话行改为"账本位置"。
- [40-evidence/00-index](../40-evidence/00-index.md) 的 experiments 行说"三个 U"，但 02/03 已收口为 C；改为"待确认项的实验记录（02/03 已收口为 C）"。
- 验证：verify 26 子树 0；>200 字符非列表段落 0；表格列数一致。

## 24. 2026-10-31 · 当前合同复核

- 主文以一张数据卡分列 owner、authority、source (input/operation)、mechanism/path、scope/key、readers、writers、rebuildability 和 retention。P0–P4 标签分类已移除；产品资产 owner 与 DSH 存储机制分别在 15、11–13 作为查询参考。
- 91 分列 Owner、Authority、Source/input、Readers 与 Writers；项目搜索索引标明 authority 为 none（derived），来源为项目文件。93 将假想产品的测试条件标成实现后的 acceptance criteria，并分开列本仓库可复现实验。92 矩阵只列 DSH 机制、产品选项和额外维护责任。
- 21 图题统一为“12 类数据场景”，与其正文表一致。
- 外部研究样本不构成依赖禁令或 package 背书；产品可依赖经审核的 package。`--from-default-profile` 替换目标 profile 的依赖与用户 patch，93 要求使用新名称或预先备份。
- 临时 `$DSH_HOME` 下执行 `dsh --profile kanban --from-default-profile web --dump-default-config` 后，manifest 只列 base + web-app、dependencies 为空，旧用户 patch 替换为空 patch。未构建时 source Web launch 因缺少 `dsh-client-ui-entry-customization/lib/client.js` 失败。随后 `pnpm run build` 通过；隔离 profile 输出 tokenized `dsh web:` URL，该 URL 返回 HTTP 303；带上响应 cookie 跟随 redirect 后，根页面返回 HTTP 200 `text/html`。它未验证浏览器渲染或 Kanban 产品行为。93 将产品特定验收与本仓库可复现实验分开。
- Profile composition 实验 05 通过。`pnpm run test:docs` 通过 21/21 gates，`pnpm run doc-sync` 通过 43/43 gates，`pnpm run lint` 成功，`git diff --check` 通过。lint 提示一个 `packages/experimental/client-ui-cot-translation` 中未使用的 disable directive，与本目录无关。
- 整个 FAQ corpus verifier 报告的失败位于 26 目录之外的 03_model-vendors worktree；不能据此称整个 corpus 通过。

## 25. 2026-11-01 · 30-external 扩为 31–36

- **结构**：30-external 从 31–33 扩为 31–36——31 单插件模式、32 数据设计、33 案例、34 profile 形态、35 装配状态与所有权、36 证据台账。00-index 的章节地图与 31–33/34–36 的分工说明同步。
- **标签**：34–36 的 `[SRC]`/`[DSH]`/`[TEST]`/`[CI]`/`[RUN]` 在 00-index 证据段映射到既有的 S/C/未执行/未运行，避免与 31–33 的 S/R/U 冲突。
- **90-advisor**：90 增加“先定形态”入口并调整下一步顺序；91 新增“检查 profile 发行形态”；92 与 93 回链 34/35；18 增加更新补偿与四层状态的对照。
- **验证**：verify 26 子树 0；全量失败仍在 03_model-vendors 既有断链。
