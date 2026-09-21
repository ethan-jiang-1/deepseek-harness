# 0006 计划：同步后的消化材料修订

本文件是 [`0006-0.1.2-rc.1-to-0.1.5-rc.1.md`](./0006-0.1.2-rc.1-to-0.1.5-rc.1.md) 的配套修订计划，格式沿用 [`0004-plan-digest-revision.md`](./0004-plan-digest-revision.md)。

## 原则

- **删**：结论被新机制推翻的整句/整节，删掉或不留误导性表述；本跨度没有需要整页删除的消化页。
- **改**：机制被演进（改名、收窄、语义反转）的部分，修订现有正文与行锚。
- **扩**：现有页面结构容纳不下的新机制面，新增机制参考页并在同目录 `00-map.md` 登记。

## 影响总览

| 专题 | 动作 | 规模 | 关键发现 |
|------|------|------|----------|
| `00-index.md` / `_coverage/` / `_change_log/` | 改 | 小 | 基线 → `183f08e9c6`；九行转「需复核」；新增 0006 记录与本计划 |
| `session-and-loop/` | **改（最大）+ 扩** | 大 | `SESSION_FORMAT_VERSION` 0→3 与迁移链；`assistant/chunk` 退役；`system/message`；读方向语义反转；新增 `04` |
| `tools-prompt-llm/` | **改 + 扩** | 大 | section order 重排（-900/-800 → 10000/10100，persona 拆 prefix/suffix）；「更负更稳」规律失效；chunk→settlement；PTC 改名补齐日志层；新增 `03`–`06` 四页 |
| `agent-loop/` | 改 + 扩 | 中 | goal resume 模型通道收紧（`paused` 抛 `GOAL_TOOL_RESUME_PAUSED`）；activity initiator 边界；行号整体 +12；新增 `04` |
| `capability-seams/` | 改 + 扩 | 大 | parent-owned subagent 目录与 host Queue/Steer；外发代理策略；原生 containment；Remote namespace 12→15；新增 `05`–`07` |
| `composition/` | 改 + 扩 | 中 | `--from-default-profile`；`runProfile` 第 0 步装代理；home `.env` 代理名豁免；新增 `04` |
| `runtime-profiles/` | 改 + 扩 | 中 | sdk-minimal 收窄为平台选定单一持久 shell；`str_replace_editor` 全面下线；desktop 第五个组合；新增 `06` |
| `surfaces/` | 改 + 扩 | 大 | 入口 4→5（Desktop）；客户端资源模型与右栏；session 流两类帧；Remote 白名单 18→19；新增 `03`、`04` |
| `system/` | 改 | 中 | 扩展表落点、loop 对照页随 header/system prompt 迁移改写 |
| `cordis-runtime/` | 改（一句话） | 小 | vendor 跨度内零 diff，补记以免下次误判 |
| `experimental/` | 改 | 中 | Agent Teams 五包转 public 并进入 release 家族；工具 10→9 |
| `harness-idea/` | 改 | 中 | Note 批量归档事件的解释；claims 六指标重算；证据锚点复核 |
| `_faq_on_digested/` | 改 | 中 | 01、03、08、11 需改；02、07、10 随基线复核；**04、05 明确无需改动** |

## 新增页面（16 个专题文件 = 14 个机制页 + 2 张图）

| 新页面 | 专题 | 承载 |
|--------|------|------|
| `session-and-loop/04-格式世代与迁移.md` | 世代与迁移 | 写者权威、catalog 链、四代差异、读方向四条语义、读准备/写发布时序 |
| `session-and-loop/figures/session-generations.svg` | 世代与迁移 | v0→v1→v2→v3 stage 管线 |
| `tools-prompt-llm/03-system-prompt作为surface节点.md` | 模型可见面 | `system/message`、header 去 `system`、三种路由 |
| `tools-prompt-llm/04-in-history提示词替换.md` | 模型可见面 | `SystemPromptUpdate='in-history'` 能力面 |
| `tools-prompt-llm/05-chunk到settlement.md` | 模型可见面 | attempt 级结算与内嵌流；`agent/assistant-stream` 非 WAL |
| `tools-prompt-llm/06-文件块与内容块投影.md` | 模型可见面 | 文件无条件投影 vs 图像条件投影 |
| `agent-loop/04-agent-runtime-identity.md` | 循环与身份 | `AgentSetup`/`parentAgent`/initiator 权限判据 |
| `capability-seams/05-subagent-catalog与host交付.md` | 委派 seam | parent-owned 目录与 Queue/Steer 双交付 |
| `capability-seams/06-外发代理策略.md` | 进程级库 | 为什么刻意不是 seam；唯一安装点与豁免 |
| `capability-seams/07-原生containment与native-system.md` | 进程 seam | 受管范围、两条 native 路径、flock 写租约 |
| `composition/04-profile-创建与保留名.md` | 启动组合 | `--from-default-profile` 与 `desktop` 保留名 |
| `runtime-profiles/06-desktop.md` | 运行时组合 | Electron 第五个组合，不属 launcher profile |
| `surfaces/03-桌面入口.md` | 入口面 | `dsh-app://`、fd 管道、`openStream` 旁路 |
| `surfaces/04-客户端资源模型与右栏.md` | 入口面 | 地址/provider/四态/pin/右栏 tab |

（上表 14 行为机制页与图；另有 `_faq_on_digested/03_model-vendors/DSH_systemPromptUpdate能力面.md` 与两张 surfaces 图 `surfaces/figures/entry-surfaces-count.svg`。加上本计划与 0006 记录两个 change-log 文件，本次新增文件合计 18 个。）

## 逐专题执行清单

> **执行状态：全部完成。** 下列条目在 0006 的两轮核验（首轮按上游 diff 定位、第二轮按专题穷举六路只读子代理）中逐条落地并复核，「新建」类条目的页面与图都已存在。与计划初判不同的一点：`_faq_on_digested/` 的 **04/05 并非「不动」**——两页的入口引文与三个工具提示词引用在第二轮被查出失据，已按新工作树重写（见 `0006` 的「后续完成」第 3 条与提交 `6dae831266`）。

### `session-and-loop/`
- [x] `01-session-event-map.md`：删三句与新基线冲突的表述（「没有 `formatRegistry`」「未发布期间不承诺兼容」「版本更低时同样拒绝」）；节标题 `## SESSION_FORMAT_VERSION = 0` 改为当前写入器版本；`SurfaceEventType` 三 → 四；`{op:'replace'}` 加 `startSeq/endSeq`；删 `sourceEventSeqs` 承载 chunk 的说法
- [x] `00-map.md`：第 43 行 blockquote 整段重写；机制表登记新页 `04`
- [x] `02-inbox-与turn-时序.md`：`step()` 伪代码按当前流程重写；源码入口改 `packages/core/agent-loop/src/inbox.ts`；删「pre-splice 观察者可用归一化坐标找回被删消息」
- [x] `03-换loop的半径.md`：新增「兼容当前世代规范信封」义务
- [x] 新建 `04-格式世代与迁移.md` 与 `figures/session-generations.svg`
- [x] 图：`figures/event-envelope.svg`、`figures/turn-step.svg`、`system/figures/event-domains.svg`、`tools-prompt-llm/figures/chunk-to-message.svg`、`request-assembly.svg`

### `tools-prompt-llm/`
- [x] `01-section顺序与前缀.md`：persona 拆 prefix/suffix；删「其它负 order 也渲染在 persona 之前」；补 10000+ 环境事实档
- [x] `02-管道审批timeout与chunk.md`：PTC 日志层改名；「chunk → message」整节重写为「settlement → message」；补文件块投影
- [x] `00-map.md`：header 描述、provider headers 双轨、机制表登记
- [x] 新建 `03`–`06` 四页
- [x] `system/02-对照单一loop.md`：chunk/header/persona 三处

### `agent-loop/`
- [x] `01-goal-lifecycle.md`：resume 允许集加限定；`GOAL_TOOL_RESUME_PAUSED`；行号族
- [x] `02-goal-round-driver.md`：`readyToDrive` 补 `FiberState.ACTIVE`；新增「host pause 与 revision 栅栏」小节；行号 +12
- [x] `03-activity-vs-goal-boundaries.md`：四层关停位置整列替换；`turn/end` reason 补 `hook`/`legacy`；通信通道补 `goal/activation-changed`
- [x] 新建 `04-agent-runtime-identity.md`

### `capability-seams/`
- [x] `02-一次bash从tool到sandbox.md`：失败合同措辞 + 原生 containment
- [x] `04-新增seam与Remote.md`：namespace 12→15；message-feedback 改 canonical log
- [x] `03-subagent后台与产品provider.md`：行锚 + 时间归属修正 + 两个新小节（目录、Queue/Steer）
- [x] 新建 `05`、`06`、`07`
- [x] `experimental/00-map.md`（public 例外）、`02-agent-teams.md`（10→9 工具）、`01`（行锚）、`cordis-runtime/04`（vendor 零改动备注）

### `composition/` 与 `runtime-profiles/`
- [x] `sdk-minimal` 工具面重写（平台选定 shell、去 `fs-local`/`str-replace-editor`）
- [x] `persona` → `personaPrefix`/`personaSuffix` 覆盖 5 个 profile 页
- [x] home `.env` 代理名豁免；`runProfile` 第 0 步装代理
- [x] 新建 `composition/04`、`runtime-profiles/06-desktop.md`
- [x] 行号批量刷新（见专题报告清单）

### `surfaces/`
- [x] `00-map.md`：入口 4→5、三行包描述、机制表登记两页
- [x] `01-启动面与session流.md`：拆两条事件链路；白名单 18→19；补两类帧
- [x] `02-acp与jsonrpc.md`：仅行号（结论不变）
- [x] 新建 `03`、`04`；重绘 `figures/shared-runtime-spine.svg`（5 方框）、`figures/session-mux.svg`（去 apiproxy，OLD 即已过时）

### `system/`
- [x] `01-扩展表非显然落点.md`：ignorable 基线锚、Remote +3 namespace、Typert identity 删除
- [x] `02-对照单一loop.md`：见 tools 专题

### `harness-idea/` 与 `_faq_on_digested/`
- [x] Note 归档事件写进判断纪律相关页（批量归档 = 冻结已实现记录，不是删除）
- [x] `claims.json` 六指标按新基线重算（N1–N6），baseline 更新
- [x] 断链与行锚复核；FAQ 01/03/08/11 内容修订；02/06/07/09/10 基线复核；**04/05 不动**

## 执行顺序

```text
机械修复（断链 20 处 + FAQ 存量断链 3 处）        ← 已完成
     ↓
索引 / _coverage / _change_log 0006 + 本计划       ← 已完成
     ↓
session-and-loop/（格式世代，被最多页面引用）
     ↓
tools-prompt-llm/  agent-loop/  capability-seams/
     ↓
composition/  runtime-profiles/  surfaces/
     ↓
harness-idea/  _faq_on_digested/
     ↓
_coverage 逐专题翻回「已核验」+ verify + 独立复审
```

## 计划外收尾

- ~~上游文档缺口五条只登记，不代上游修~~ → **已在 0007 就地修复**（根 `AGENTS.md` 布局块、`packages/session/README.md` 漏登记 v2→v3、`packages/preset/agent-presets/README.md` 仍提已删的 `code` preset、`packages/client/README.md` 漏登记三个包；`docs/persistence-changes/` 在本基线确实不存在，属「不要提前引用」而非缺陷）。发现时的现场记录保留在 `0006` 的「顺带核出的上游文档缺口」一节。
- ~~`0.1.5-rc.2` / `0.1.6-alpha.1` / `upstream/master` 未同步~~ → **口径澄清**：同步到**最后一个 RC**。`0.1.5-rc.2` 已由 [`0007`](./0007-0.1.5-rc.1-to-0.1.5-rc.2.md) 合入；`0.1.6-alpha.1` 与 `upstream/master` 是 alpha / 主干，按口径**有意不同步**，不再是待办。

> 本计划列出的修订项与两项曾挂账的收尾（`_agent_ready_development/` re-pin、`harness-idea/` claims 与 FAQ 逐篇复核）**均已完成**，结果见 [`0006`](./0006-0.1.2-rc.1-to-0.1.5-rc.1.md) 的「后续完成」与「第二轮全量核验」两节。
