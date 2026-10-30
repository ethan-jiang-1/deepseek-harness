# Quality review · 2026-10-27

本轮对 FAQ 26 做了一次结构/一致性自查，并把 20 个平铺文件收进 5 个子目录 + 一个 advisor 入口。这里记录发现的问题、已修项和仍存在的边界。

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
- 去掉 deckline 中心化：具体目录树与个人路径**从正文移除**（证据只留 00-answer 的 R 标注与 `40-evidence`）；[92 §11](../90-advisor/architectures/11-product-instance.md) 的推荐按写路径需求而非示例现状。
- [91](../90-advisor/91-checklist.md) 的"第零步"与六种承诺对齐，客户端本地与每项目运行时降为"不是承诺的运行时选择"。
- 给 [11](../10-foundations/11-five-homes.md)、[12](../10-foundations/12-state-homes.md)、[13](../10-foundations/13-scope-and-keys.md)、[14](../10-foundations/14-artifacts.md)、[31](../30-external/31-external-community-patterns.md) 加了到新骨架的桥接句。

**图**

- `15-four-spaces.svg` 的账本框改为"插件记录：索引可重建 / 绑定不可重建"，与正文一致。

**验证**

- `node _faq_on_digested/verify.mjs`：26 子树 0 违规。

## 10. 2026-10-30 · 拆 92 与旧章重写

- **92 拆分**：拆成总览（九格画布、依赖层级路线表、分篇索引、选型表）与 `90-advisor/architectures/` 下 11 个分篇（01–11）。[00-index](../00-index.md) 的 archetype 链接改指分篇，目录树与章节地图同步。
- **旧章重写**：[21](../20-native/21-native-data-landscape.md) 增加"产品型实例视角"（六个高频落点与 N+ 的含义）；[22](../20-native/22-native-data-history.md) 增加四条历史决定对产品的后果。
- **外部章映射**：[31](../30-external/31-external-community-patterns.md)、[32](../30-external/32-external-adjacent-ecosystems.md)、[33](../30-external/33-external-plugin-patterns.md) 各补"映射到四个空间与六种承诺"。
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
- **[32](../30-external/32-external-adjacent-ecosystems.md)**：把 "映射回 DSH" 与 "映射到四个空间与六种承诺" 合并为一节。
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
