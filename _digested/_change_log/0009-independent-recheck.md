# 0009 独立反查：四个语料目录 vs 产品源码

反查日期：2026-09-30。产品基线：`639ed015397290b3745d163aafe02ffee4aa3f84`（`dsh-v0.2.0-rc.2`）。先验证整树照搬成立：`git diff 639ed01539 HEAD` 排除四个语料目录后仅剩 `scripts/translation-pairing.manifest.json` 一行排除项与未跟踪的 `.pi/` 记录，产品源码与 tag 逐字节一致（三条审计线独立复核）。

本页是对 [`0009-0.1.7-rc.1-to-0.2.0-rc.2.md`](./0009-0.1.7-rc.1-to-0.2.0-rc.2.md) 所述语料反查的**独立反查**，不替代该记录。全部证据为工作树实读（文件:行），未采信记录自述。与 0009 六路切片的方法差异：本轮**按维度而非按目录切**——D0 机械完整性、D1 孤儿引用全量反查（不与变更跨度求交）、D2 实体正向覆盖（三路切片：包与 ctx 服务、扩展面实体、文档与结构面）、D3 硬数字重测（两路切片：_digested、_agent_ready_development+_misc）、D4 基线与口径一致性。

前置事实：三个语料 `verify.mjs` 在反查时全绿（`_digested` 87 MD / `_faq_on_digested` 126 MD / `_agent_ready_development` 37 MD；`_misc` 无校验脚本，本轮用临时全量链接扫描覆盖，固化待办见文末）。即现有门禁（UTF-8、换行、相对链接、锚点、基线常量）**不覆盖内容新鲜度**——下述全部问题存在于绿门禁之下。

## 总体结论

0009 的六路切片在「与 794-commit 变更跨度求交能命中的地方」质量高：ctx 服务 92、Remote 白名单 27、OPTIONAL_BUNDLES 4、skills 15、run-gates 18、experimental 21 包、FAQ 08 重测、surfaces 的 desktop/telemetry 新面，本轮全部复测为已同步。但独立反查确认约 **22 处过期断言、8 处新面缺落点、5 处口径矛盾/自相矛盾**，集中在三处：0009 自述「中途代理模型故障切换」的受影响切片（capability-seams/00-map、runtime-profiles/01-web、composition/04、_coverage、surfaces/05）、**跨度求交抓不到的存量过期**（0009 之前就错、本轮才被抓到：harness-idea/02 与自家 claims.json 矛盾、capability-seams/00-map 的 schedule 段整段基于 0008 前认知）、以及无机械门禁的组合枚举正文（01-web 的 web-app insert 行枚举 68 ≠ 实数 85）。

## 为什么 0009 会漏（过程层）

1. **变更跨度求交是反向审计的唯一入口**。0009 用「4154 个变动文件与语料引用求交」，凡 0009 跨度没碰的断言即使已过期也不在交集里——harness-idea/02 的语料库三数（1912/584/1257）实为 0.1.5-rc.2 读数且与同目录 claims.json（N1=2360、N2=972）同仓矛盾，即属此类存量失真。
2. **切片中途代理故障切换的尾巴**。0009 记录自述 capability-seams/tools-prompt-llm/surfaces 等切片中途换代理重跑；本轮过期断言恰好聚集在 capability-seams/00-map（schedule 段四个子断言全过期）、composition/04、_coverage、surfaces/05——与故障切换的受影响切片重合。
3. **组合枚举正文没有机械门禁**。web-app insert 行的 Layer 枚举是裸短名散文（无 path:line），链接门禁看不见它；0008-0009 的 19 个新行全部漏收。
4. **「有落点」判定依赖名字级 grep**。89 个零命中包中 22 个靠 01-web 的裸短名枚举才「有落点」——枚举本身过期时，落点判定随之失真。
5. **口径行是手工散文**。`_digested/00-index.md` 的「三个语料目录」与四目录现实、`_change_log/00-index.md` 的「语料反查待执行」状态句，都是上一轮写完后现实继续前进的搁浅句。

## _digested

### A. 重写级

| # | 位置 | 现状断言（改前） | 源码事实 | 处置 |
|---|------|------------------|----------|------|
| A1 | `capability-seams/00-map.md:43`（整段） | 「不是 Service seam——没有 `ctx.schedule`」；三个工具；`scheduleProjectionDefinition`；「提醒经 session event log 持久化」 | `ctx.schedule` 以 core role 进生成表（`docs/capability-seams.md:643`）；四个工具（+`schedule_update`，`tools.ts:493`）；`scheduleProjectionDefinition` 全仓 0 命中（#4335 退役，接替 `storage.ts`/`domain.ts`/`delivery-history.ts`/`update.ts`）；任务经 host 存储域独立持久化（`index.ts:101,126` inject `storageDomain`） | 整段重写，页头基线随修改升 rc.2 |
| A2 | `capability-seams/10-新执行面与编排seam.md:25` | 「`llm-deepseek` 优先解析账号 token，无账号则落回 key（`llm-deepseek/src/index.ts:95` 的 `resolveAccountToken`）；登出保留 API key」 | 0009 拆分后：`llm-deepseek-account` 每请求 `resolveToken`，取不到抛 `ACCOUNT_SIGN_IN_REQUIRED` 不落回 key（`llm-deepseek-account/src/index.ts:21-23`）；裸 key 走独立 adapter | 重写 |
| A3 | `runtime-profiles/01-web.md:40-53`（insert 行小节） | Layer 1=18、Layer 2=5、罗盘 44(+1)＝68 行 | 第一 insert 块 84 行 + 第二块 1 行＝85；`ptc-runtime` 移入 base、`ui-schedule` 移除、19 个 0008-0009 新行未收录 | 按现树逐行重列（本轮补做） |

### B. 点改级

- `surfaces/05:3`：client 包目录 68 → **63**（68 = 63 目录 + 5 个文件误数）。
- `capability-seams/04:40`、`00-map:53`：「FAQ 08 的 29 条 seam 表」→ **33 条**。
- `capability-seams/04:67`：workspaceFiles「7 个 Remote 方法」→ **5 个**（read/readBytes/stat/list/changes）。
- `harness-idea/02:70`：语料库三数 1912/584/1257 → **2360/972/1279**（旧数是 0.1.5-rc.2 读数，与 claims.json N1/N2 矛盾）。
- `experimental/00-map:7`：「六个家族」→ **五个家族**（与 ：15 标题统一）。
- `session-and-loop/01:78`：source-kind 联合锚点 `packages/core/session/src/message.ts:108-115`（文件已不存在）→ **`packages/llm/llm/src/message.ts:110-115` 的 `MessageSourceMap`**。
- `composition/04:17`、`experimental/00-map:11`：OPTIONAL_BUNDLES「两个/`:190-193`」→ **四包/`:213-218`**（同页 `:42`/`:42` 已是现行口径，页内自相矛盾）。
- `_coverage/00-index.md:67`：run-gates「17 个 mode」→ **18**（`ci-unit`，源码与 system/03 均已 18）。
- `surfaces/01:39`：白名单锚点区间 `:20-46` → **`:20-47`**（27 条计数正确，区间少含末行）。

### C. 缺落点（补挂权威入口）

- `docs/ui-radius.md`——**0009 跨度唯一新增顶层 docs 页**，四语料零命中、0009 六片审计底稿未提及；本轮挂入 `surfaces/05` 权威清单。
- `docs/deepseek-llm-api-wire-extensions.md`——存量页整页零命中；挂入 `tools-prompt-llm/00-map`。
- `load_workspace_dependencies` 工具——已挂载进 sdk profile（`sdk-app/cordis.patch.yml:31`）却零命中；挂入 `runtime-profiles/03-sdk:28`。

### D. 登记（缺落点但不追，进 `_coverage/00-index.md` 已知未覆盖表）

本轮新增四行登记：生成目录细则两页（ui-radius、wire-extensions）、未挂载工具族与零落点事件键（tool-session-query 5 工具、tool-terminal 6 工具、`list_subagent_models`、`lsp` 工具名；事件键 `session/title(-llm-request)`、`web/deepseek-search-llm-request`、`llm/retry(-started)`）、配置字段级两条（`thresholdRatio`、`platformOrigin`）、既有面四项（`ctx.shellEnv`、`ctx.sessionSkillCatalog`、`identity/anonymous-user-id`、`compaction/command-compact`——均 0009 前既有，属范围选择）。同时**移除两条已失真的旧登记**：rescope 与 graph-atlas 的「文件名未引/枚举漏列」现状不再成立（正文现均有引用）。

### E. 口径

- `_digested/00-index.md:5,18,21`：「三个语料目录」→ **四个**（`_misc` 纳入同步纪律；`_references` 冻结存档只随轮更新基线行、`_scratch` 不跟踪）。
- `_change_log/00-index.md:26`：「语料反查待执行，全部专题标『需复核』」→ 已完成（矩阵十一行写回已核验；本页即独立反查记录）。
- `capability-seams/00-map.md:3` 头部基线随修改升 rc.2。其余六个 00-map 头部仍钉 `46a7f68b09`——按「未改动文件头不动」政策保留，但 0009 政策与本轮证据（A1 恰是页头未动而正文过期）说明该张力真实存在，**后续轮次建议：正文被改到的页一律随改升头**。

## _agent_ready_development 与 _misc

- `sdlc-reference/11-release.md:17`：dsh 版本基线「`0.1.7-rc.1`」→ **`0.2.0-rc.2`**（0009 re-pin 漏改的版本串）。
- `sdlc-reference/11-release.md:27` 与 `_coverage/00-corpus-maintenance.md:120`：release 间隔「约 19–41 分钟」→ **约 24–41 分钟**（旧读 19 来自以 release commit 而非 merge commit 为端点的口径）。
- `sdlc-reference/10-approval-gate.md:53` 与 `_coverage:120`：PR merge 样本「众数 1、约三分之一单 commit」→ **众数 2、约五分之一**（最近 100 个 PR merge 重测，含/不含 merge-forward 两口径同结果）。
- `sdlc-tutorial/02:38`：Note「五个类别」→ **六个**（与同页目录树、`agent-note-tree.ts:19` 一致）。
- `sdlc-tutorial/03:65,67` 与 `04:73`：PR CI「9 个 job」→ **10 个 job（9 必需 + 不进聚合的 windows-coverage）**；`sdlc-reference/04:60` 同步删去「独立 observational job」（observational gates 在 required Windows build job 内）。
- `sdlc-reference/09:75`：15 个 Skill「以 Use 开头」→ **多数以 Use 开头**（实测 9/15）。
- `_misc/_eval_harness/README.md:64`：例证钉版 `46a7f68b…` → **`580646c14f…`**。
- `_eval_harness/02:366`：「发布到 npm 的只有一个 job」→ **每条发布序列一个**（全仓 3 个 workflow 挂 npm-publish 环境）。
- `repo-harness/08:68`：pairing manifest「定义三组豁免」→ **与门禁发现范围逻辑共同定义**（manifest `excluded` 只列工作文档类条目）。
- `_coverage:165`：钉版口径勘误——「113 个唯一 URL」实为唯一**路径**数，唯一 URL 130、出现 243，按本页 :3 口径统一。
- `_coverage:30`：2026-09-24 历史条目加勘误注记——「英文计数」实为 en+zh 合计（rc.1 英文实测 486/639/14；proposed 39 为英文口径）。
- 钉版纪律复核：范围内唯一 40-hex `580646c14f…`（250 处）`git cat-file -t` 为 commit ✓；113 个钉版路径**全量**（非抽查）`git cat-file -e` 全部存在；29 个锚点全解析；内容一致性抽查 5/5 逐字吻合。

## _faq_on_digested（待办，本轮避让未动）

另一个会话正在本目录工作（FAQ 06 收尾），以下登记为 FAQ 批次待办：

1. `00-index.md:7` 「当前研究基线」仍钉 `dsh-v0.1.7-rc.1`（`46a7f68b09`）且自称「与 `_digested/` 同一基线」——已过期且自相矛盾（FAQ 08 answer 已自行改钉 rc.2）。
2. FAQ 03（model-vendors）：`llm-deepseek/src/index.ts` 5 处行号越界（0009 拆分后文件仅 42 行）。
3. FAQ 11 `answer.md:59`：`.agents/notes/README.md:42` 锚点内容不符（该句现行权威在根 `AGENTS.md`）。
4. FAQ 12：已归档 note 路径 `.agents/notes/implemented/bug-fix/2026-09-13-served-index-must-not-be-cached.md` 需按归档政策改钉。
5. FAQ 06 的 `docs/rfc/*` 引用与 FAQ 13/14/15 的历史/假设性引用语境复核。

## 交叉发现（记录不改）

- `packages/workflow/workflow-worker-thread/` 是无 `package.json` 的残留目录（仅 lib/、node_modules/），不参与包计数。
- `_change_log/0009-span-fact-inventory.md` 的 9 个新增包清单与 `git diff --diff-filter=A` 实测完全一致；其中 4 个（shortcuts、ui-shortcuts、ui-settings-session-log、code-language）仅有变更记录级点名，无机制页——按语料「问题驱动」口径暂不追。
- `harness-idea/08:71`、`02:71` 的 seal 数 1884 为 0008 叙事口径（钉基线实测 1917、现 1923），作为历史读数保留。
- `capability-seams/07:39` 的「两个 Linux 包」措辞在 win32 包退役后含混，历史注记保留。

## 遗留待办（衔接后续轮次）

1. **FAQ 批次**（上节五项）——等 `_faq_on_digested` 并行会话结束。
2. **`_digested` 入口可读性**：00-index README 化（30 秒框架句 + 大白话子目录表 + 术语速查）；子目录改名最小集（`system-overview`、`composition-boot`、`surfaces-entrypoints`）——改名半径约 57 文件/目录，须在 FAQ 会话结束后独立执行。
3. **新专题**：`_digested/plugin-inventory/`（利用现成插件的清单与复用地图）+ `_coverage` 矩阵新行 + FAQ 17。
4. **D1 扫描固化**：本轮的全量引用反查与引文-锚点漂移脚本（临时目录执行）应固化进语料目录，使每次同步后可机械复跑。
5. **`_misc` 校验脚本**：`_misc` 目前无 verify.mjs，链接检查依赖临时扫描；后续补一个最小校验脚本。
