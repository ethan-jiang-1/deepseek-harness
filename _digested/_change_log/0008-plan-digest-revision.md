# 0008 消化计划：`0.1.5-rc.2` → `0.1.7-rc.1`

**跨度**：`fb2c4b9e69`（`dsh-v0.1.5-rc.2`）→ `46a7f68b09`（`dsh-v0.1.7-rc.1`），3304 commits / 1093 merge PR / 7872 文件——历次最大（0006 的两倍余）。0.1.6 线只有两个 alpha、未出 RC 即跳线；`0.1.5-rc.3` 是 backport RC（3 commits，已是 rc.1 祖先）；按「最后一个 RC」口径目标为 `dsh-v0.1.7-rc.1`。

**本轮起生效的同步口径（重大变更）**：产品源码**整树照搬** upstream tag，本地只保留 `_digested/`、`_faq_on_digested/`、`_dsh_plugin_agent_ready_development/`、`_architecture_referenced/` 四个语料目录；不做任何产品源码层面的内容合并、不保留本地源码补丁。目的：把 upstream 同步压成零合并成本的机械操作。本轮执行时移除了 332 个 ethan-only 产品文件（含旧 `code-runtime`/`e2b` 包、改名前的 `agent-presets`、旧 `settings-file` 等，及本地 `frontend-static` no-store 修复与其 note——该修复未进上游，随整树照搬退役，登记为上游候选缺口）。

## Stage 0 · 机械基座

1. ✅ 整树照搬 merge（`23aa3b253b`），验证产品树与 tag 逐字节一致（4 语料目录除外）。
2. 修 3 个断链：`agent-presets/` → `agent-preset/`（改名）；`code-runtime-python`（上游已删，页面改为标注退役）；`desktop.cordis.patch.yml`（desktop-host 重构，找新落点）。
3. claims.json N1 `1912→2360`、N2 `584→972`、N4 `267→307`、N5 `39→38`、N6 `228→269`；`node _digested/verify.mjs` 全绿。
4. `_dsh_plugin_agent_ready_development` 的 118 条目录外 DSH URL 重钉到 `46a7f68b09`（锚点逐条 `git cat-file` 复核）+ 三个语料各自 `verify.mjs` 全绿。

## Stage 1 · 反向审计（语料既有断言 vs 新树）

1. **path:line 求交**：解析三语料全部 `path:NN` 引用，与 `fb2c4b9e69..46a7f68b09` 变动集求交，命中项逐条分三档处理：行号漂移（改行号）、内容变更（改表述）、结论失效（改结论）。
2. **改名/删除术语表**：跨度内的包名/组名/工具名/服务名改名映射（`agent-presets→agent-preset`、`code-runtime→ptc-runtime` 系、`e2b→sandbox` 系、新增 `ssh`/`mcp` 组等），逐篇扫描文本级提及并替换或标注。
3. **硬数字重测**：seam 生成表读数（FAQ 08）、`dsh-*` skill 数（FAQ 11）、包数/组数、`SESSION_FORMAT_VERSION`（v3→v4 待确认）、事件与服务清单、invariants 政策口径（rc.1 起空 companion 废除，N5/N6 定义已变）。
4. **语境 pin 手工推进**：`session-and-loop/01`、FAQ 06/08/10/11 等 8 个文件的混合上下文行——历史读数保留、当前基线行推进。

## Stage 2 · 正向审计（新树有、语料没有）

1. **结构差分**：+51 包、组级增删（+`browser-use`/`computer-use`/`deliverables`/`document`/`goal`/`jobs`/`mcp`/`ptc-runtime`/`runtime-diagnostics`/`sandbox`/`schedule`/`session-query`/`spill`/`ssh`/`storage`/`workspace`/`feedback`，`host`/`client` 升组；−`code-runtime`/`e2b`）、`docs/subsystems` 新页、新 ctx 服务/工具/事件 → 逐项判定「跨度引入的遗漏」vs「一贯范围选择」。
2. **重点新面深读**（对语料核心论题影响最大的六路）：session 格式 v4 迁移链；`sandbox` containment 面；`computer-use`/`browser-use` 两个新执行面；`jobs`/`goal`/`schedule` 编排面；`mcp` 组与外部生态桥；`runtime-diagnostics` invariant 政策。
3. **0007 挂账复核**：capability-seams 生成器 `mcp-client` 消费者行、tool-cordis note 脱节（该包新增 `fiber-state`/`inspect`/`prompt` 源文件）、`docs/persistence-changes` 是否已出现。

## Stage 3 · 消化产物落盘

逐专题改写/新增页并推进页内 pin；`_coverage/00-index.md` 11 行「需复核」→ 审计后写回 `46a7f68b09`；FAQ 受影响篇重核；`_dsh_plugin_agent_ready_development` 维护页补 0008 条目；`harness-idea` claims 与 00-map 收口。

## Stage 4 · 0008 记录与口径固化

`0008-0.1.5-rc.2-to-0.1.7-rc.1.md`（版本序列、跨度规模、核心变更分类、三语料影响、上游缺口登记、**整树照搬新口径 + 332 文件退役清单 + no-store 退役记录**）；`_change_log/00-index.md` 口径段更新；全部门禁复绿后分批提交。
