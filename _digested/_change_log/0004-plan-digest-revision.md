# 0004 计划：同步后的消化材料修订

## 原则

- **删**：旧概念不再成立的部分，整段删除或归档
- **改**：概念被演进（改名、加强、语义变化）的部分，修订现有正文
- **扩**：现有框架无法容纳的新概念，增加子目录或新标签页

## 影响总览

| 专题 | 动作 | 规模 | 关键发现 |
|------|------|------|---------|
| `00-index.md` | 改基线 + 更新目录表 | 小幅 | 基线→`dd6322d604` |
| `_change_log/00-index.md` | 补 0004 记录 | 小幅 | 文件列表补入 0004 行 |
| `_coverage/00-index.md` | 全部标记 "需复核" | 小幅 | 八行全部改为需复核，基线更新 |
| `system/` | **改** + **扩** | 中幅 | 扩展表追加 webhook、API Remote、Application Launch 规则 |
| `cordis-runtime/` | **改** + **扩** | 中幅 | vendor 4.0.2 Loader fromInternal 改进 |
| `composition/` | **改** | 中幅 | sdk/acp 变 launcher profile、agent-team profiles 新增 |
| `runtime-profiles/` | **改（大幅重写）** | 大幅 | 核心变化：old "独立 bin vs launcher profile" 二分法瓦解 |
| `session-and-loop/` | **改** | 中幅 | JSONL-only、projection 必须化、ignorable 来回、ToolCallId 重命名 |
| `agent-loop/` | **改（初判有误）** | 中幅 | 源码 +120/-26 行：turnBoundary projection、startsRequestSeries |
| `capability-seams/` | **扩** | 中幅 | Schedule、Webhook 新 seam；API Remote 非三角色通信模式 |
| `tools-prompt-llm/` | **改** | 中幅 | 图片管线 encoding ladder、code-mode→PTC 重命名、pi-ai 升级 |
| `surfaces/` | **改** | 中幅 | 5 入口、路径更新、SVG 4→5 box、`code-mode.ts`→`ptc.ts` |
| `harness-idea/` | **改（大幅超过预期）** | 大幅 | 28 处锚点行号更新、基线声明、6 个 metrics 重算、claims.json |
| `_faq_on_digested/` | **改（初判未覆盖）** | 中幅 | 所有 19 个子目录的基线声明头更新 |
| `0004-plan-digest-revision.md` | 自维护 | 小幅 | 本文件自身更新 |

## 逐专题详细计划与执行日志

### 1. `00-index.md`（根索引）
- [x] 更新产品源码审计基线 → `dd6322d604`
- [x] 更新子目录表：`runtime-profiles/` 行 "Launcher Profile"
- [x] 更新最近合入链接 → `0004`

### 2. `_change_log/00-index.md`
- [x] 文件列表补入 0004 行

### 3. `_coverage/00-index.md`
- [x] 所有八行状态改为 "需复核"
- [x] 基线更新

### 4. `system/`
- [x] 00-map.md：扩展表新增 `webhook/webhook` → `ctx.webhookRuntime` 行
- [x] 00-map.md：官方文档入口新增 `docs/subsystems/webhook.md`
- [x] 01-扩展表非显然落点.md：新增 ignorable 机制历史（#3087 删除→#3325 回滚）
- [x] 01-扩展表非显然落点.md：新增 API Remote 架构说明
- [x] 01-扩展表非显然落点.md：新增 Application Launch 规则

### 5. `cordis-runtime/`
- [x] 00-map.md：vendor 4.0.2 升级标注
- [x] 04-vendor-本地修改.md：新增 `fromInternal` 改进章节（不再按 Node 版本猜 API）

### 6. `composition/`
- [x] 00-map.md：sdk/acp 变 launcher profile 描述
- [x] 00-map.md：`PROFILE_TEMPLATES` 示例扩展到 5 个
- [x] 00-map.md：新增 `dsh-sdk-app`、`dsh-sdk-minimal`、`dsh-acp-app`、`agent-team-profile` 入口
- [x] 00-map.md：模板描述更新（5 个内置 profile）

### 7. `runtime-profiles/` ★ 最需要改的专题
- [x] 00-map.md 大幅改写：sdk/acp/sdk-minimal 全部是 launcher profile
- [x] 00-map.md：删除"独立二进制"二分法描述
- [x] 00-map.md：`PROFILE_TEMPLATES` 更新到 5 个
- [x] 00-map.md：共同基底表格重写（所有 profile 共享 `dsh-base`，不再分两列）
- [x] 00-map.md：旧二进制删除，源码入口改用 `packages/bundle/*/`
- [x] **03-sdk.md 完整重写**：`dsh --profile sdk`、`dsh-sdk-app`
- [x] **04-sdk-minimal.md 完整重写**：`dsh --profile sdk-minimal`、`dsh-sdk-minimal`
- [x] **05-acp.md 完整重写**：`dsh --profile acp`、`dsh-acp-app`

### 8. `session-and-loop/`
- [x] 00-map.md：JSONL-only 持久化说明
- [x] 00-map.md：ToolCallId 重命名记录
- [x] 00-map.md：Projection 必须化（`init(header)`、`Object.is` 比较）
- [x] 01-session-event-map.md：持久化/格式迁移段落新增
- [x] 01-session-event-map.md：ignorable 机制历史补记
- [x] 03-换loop的半径.md：新增第 5 条义务（维护 session projection）

### 9. `agent-loop/`（初判有误，实际有较大变化）
- [x] 不修改正文（agent-loop 的 turnBoundary projection 等变化是内部实现细节，不改变消化材料已覆盖的四层结束边界概念）
- [x] 但确认本文中的 `code-mode.ts` 源码路径改为 `ptc.ts`（在 tools-prompt-llm 中处理）

### 10. `capability-seams/`
- [x] 00-map.md：新增 Schedule seam（`ctx.schedule`）
- [x] 00-map.md：新增 Webhook seam（`ctx.webhookRuntime`）
- [x] 00-map.md：新增 API Remote 非三角色模式
- [x] 00-map.md：subagent model routing 补记
- [x] 00-map.md：源码入口新增 schedule、webhook、api/remotes
- [x] **04-新增seam与Remote.md 新建**：详细说明三个新概念
- [x] 03-subagent后台与产品provider.md：subagent model routing 通过 DSH SDK 补充

### 11. `tools-prompt-llm/`
- [x] 00-map.md：图像编码管线说明（encoding ladder、alpha 感知）
- [x] 00-map.md：`code-mode` → `PTC 模式（原 code-mode）`
- [x] 00-map.md：源码入口补 `llm-pi-ai`、`llm-retry`、`token-meter`、`plugin-package-inventory-deepseek`
- [x] 02-管道审批timeout与chunk.md：源码核验入口 `code-mode.ts` → `ptc.ts`
- [x] 02-管道审批timeout与chunk.md：图像编码管线详细描述
- [x] 02-管道审批timeout与chunk.md：`code-mode` → `PTC 模式（原 code-mode）`

### 12. `surfaces/`
- [x] 00-map.md：5 入口表格（不再 4 个）
- [x] 00-map.md：sdk/acp 变 launcher profile 说明 + 重要变化批注
- [x] 00-map.md：源码入口新增 `packages/api/remotes/`、`packages/typert/`
- [x] 00-map.md：`adding-a-conversation-node.md` 链接改为 `extension-cookbook.md`
- [x] 01-启动面与session流.md：ACP 启动命令改为 `dsh --profile acp`
- [x] 01-启动面与session流.md："四个入口" → "五个入口"
- [x] **SVG 重写**：shared-runtime-spine.svg 4→5 box，标题/描述更新

### 13. `harness-idea/`（大幅超过预期）
- [x] 00-map.md：基线声明更新
- [x] 08-judgement-discipline.md：基线声明更新 + 源码标记行号更新
- [x] **31 处证据锚点全部验证**：逐条在新基线 `dd6322d604` 确认行号
- [x] **28 处实际更新的锚点**行号修正
- [x] **claims.json 基线更新** + 6 个 metrics 重算（N1=1680, N2=1264, N3=19, N4=250, N5=40, N6=210）
- [x] 05-dynamic-legibility.md：`528c682e` → `dd6322d6` 基线标记
- [x] 07-boundaries-costs-fit.md：`528c682e` → `dd6322d6` 基线标记

### 14. `_faq_on_digested/`（初判未覆盖）
- [x] 00-index.md：研究基线更新
- [x] 所有 19 个子目录的 `question.md`/`answer.md`/`research.md` 基线声明头更新
- [ ] 行级引用锚点（56 处）未逐条验证——需后续逐篇重读源码

### 15. 交叉引用修复
- [x] `system/02-对照单一loop.md`："四个入口" → "五个入口"
- [x] 链接修复：`harness-idea/02-legibility.md` dsh-doc-standards → dsh-doc
- [x] `verify.mjs` 基线更新 + 验证通过

## 执行顺序

```text
    改索引 / _coverage
     ↓
system/   cordis-runtime/   （底层概念，先修订）
     ↓
composition/   runtime-profiles/   （组合与宿主，大幅重写）
     ↓
session-and-loop/   agent-loop/   （会话驱动）
     ↓
capability-seams/   （新增 seam + 新建文件）
     ↓
tools-prompt-llm/   （模型可见面，code-mode→PTC）
     ↓
surfaces/   （人对机器入口，SVG 重画）
     ↓
harness-idea/   （31 锚点验证 + 6 metrics 重算）
     ↓
_faq_on_digested/   （基线声明头更新）
     ↓
verify.mjs + 交叉引用修复
```

## 本轮未完成（需后续 session 处理）

1. `_faq_on_digested/` 的 56 处行级引用锚点——需逐篇重读源码验证
2. `agent-loop/` 正文是否需要更新——turnBoundary projection 是内部实现细节，但不排除需要补充说明
3. `runtime-profiles/01-web.md` 和 `02-headless.md` 内容审计——只更新了路径引用，未做内容深核
