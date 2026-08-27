# Answer 09 · 卖的不是插件，是可证明：三层阶梯的三层买单理由

## 一句话重写

上一版定位（"开发者买能力、Agent 用角色、企业买流程"）描述的是**谁在操作**，没有回答**为什么付钱**。本次核查后的答案：**DSH 唯一不能被"换个框架"拿走的资产，是审计可证明性。** model-visible ⟺ logged 是运行时不变式而非文档承诺；审批的 `asked/decided` 是成对审计事件；answerer 缺位 fail-closed；会话格式有版本纪律（[`session-and-loop/00-map`](../../_digested/session-and-loop/00-map.md)、[`user-approval` README](../../packages/interaction/user-approval/README.md)）。任何第三方插件只要挂上树，就**自动获得这条审计尾迹**——它干过的每一件模型可见的事都能从日志重建。模型能力会商品化，插件功能会商品化，"这台 agent 做过什么、谁批的、能否重建"不会。企业买的是这一层，不是又一个 dev tool。

三层阶梯因此改写成三层买单理由：

| 层 | 买单人 | 买什么 | 为什么是 DSH |
|---|---|---|---|
| 能力 | 开发者 / 团队 | 最省事的合规工具集 | 换 Provider 不换审计：执行世界、持久化、subagents 已有 11/28 条 seam 可替换（[FAQ 08](../08_plugin-seam-maturity/answer.md)） |
| 角色 | 垂直服务商 | 带账本的岗位包 | persona = bundle + preset + patch 的组合，diff 不进 `packages/`；按席位/效果定价，不做免费上架等分成（GPT Store 教训，见下） |
| 流程 | 合规压力行业（金融 / 医疗 / 政务外包） | 可重建、可审批、可外联的 AI 流程 | EU AI Act Art.12/19 强制事件日志与留存；Gartner 预计 2027 年底前 >40% agentic 项目因风险控制不足被取消——可重建性是合规刚需，不是锦上添花（[证据](./research.md)） |

## 生态证据：这次补上"目录的实际内容"，而不是目录的自报口径

上一版只引用了商店的自报数。2026-08-27 的实拉有四个互相打架的计数（[evidence](./01-生态证据与历史先例.md)，方法在 [research](../08_plugin-seam-maturity/research.md)）——GitHub tag 11,916 → 商店自报 5,886 → 策展列表自报 ~3,300 → 四档实测精选 **306**。**从 11,916 到 306，压缩率 2.6%，这就是"策展"此刻的市场价值量：目录易得，可验证的精选稀缺。**

更有用的是 top 仓库的实际内容，七条读数：

1. **渠道被市场抢建了 ≥8 个互不兼容版本**（三种 Telegram 桥、微信"聊天/监控/**审批**"、飞书桥、9 渠道 `dsh-im`）。"人不在场也能到达"不是假说，是有货品无标准。实验 A 因此**从"验证需求"改为"定标准"**：官方 Definition 能不能收编在野方言。
2. **记忆是第三方最热品类（≥5 个互竞）而官方 seam 为零**——市场最想买的东西，长在官方最空的缝上（[FAQ 08](../08_plugin-seam-maturity/answer.md) 缺口第 2 位）。
3. **多宿主是常态**：`EchoBird` 一行安装覆盖 15 个 agent；同一批插件在 Claude Code / Codex 上也装。官方不能指望插件数量构成独占优势，只能靠别的。
4. **审计楔子已被第三方试探**：`sandbase-harness` 把 "audit/replay" 直接写进 README 卖点。需求是真的、不专属；官方"可重建"是 gate 强制的不变量，第三方只是 README 语句——先发优势在于机器可检查，不在于口号。
5. **策展已经开始商业化**：第三方列表有"容器实装 + 四档判定"的信任品。第三方已经卖"实测过"——官方信任制品（invariant + coverage + fail-loud）的对标物出现了。
6. **楔子已被竞品产品化**：NanoClaw + Vercel 已发布跨 15 个聊天软件的 agent 审批对话；n8n、Temporal 都有"暂停等人类批"的官方教程；而 Claude Code 至今缺权限提示的推送（[证据](./research.md)）。结论很清楚：**"从聊天里审批"是现货不是空白**；现货里没人做的是成对 ask/decide 审计事件 + fail-closed + 整请求可重建——差异化在账本，不在聊天窗口，而这恰好是 DSH 运行时已有的语义。
7. **监管给这个叙事钉了时间表**：EU AI Act Art.12（自动事件记录）/ Art.19（≥6 个月留存）已是法条文本，一般适用 2026-08-02，高风险义务被 Digital Omnibus 推到 ~2027-12——**"日志可重建"从卖点变成法务项的时间窗就是这两年**（[证据](./research.md)）。

## 三个记忆点（每句背一个机制）

1. **换 Provider，不换审计。** Consumer 依赖 Definition、绝不依赖具体 Provider；本地 bash → 云沙箱 → 企业内网是替换不是重写，审计事件跟着 Definition 走（[`capability-seams/00-map`](../../_digested/capability-seams/00-map.md)）。
2. **第三方负责"多"，官方负责"真"。** 官方的信任制品是可执行的：包级 invariant、每文件 100% 覆盖率、keyless snapshot、双 SDK 同 PR 投影、fail-loud 门禁。市场做长尾，官方做证明器。
3. **上架的插件自带账本。** 模型可见 ⟺ 已记录是 loop 构建期检查；审批是成对审计事件。插件可以想干什么干什么，但它干过的每一件事都可重建。

30 秒电梯稿（v3）：

> 别人卖 Agent，我们卖"这个 Agent 敢被审计"。Harness 里每个功能都是插件，而每个插件都自动带账本：模型看见的每一件事都能从日志重建，每一次审批都留下"谁问、谁答"的成对记录，没人可答就直接拒绝。这个内核在聊天机器人世界跑过一轮——Koishi 用 Cordis 四年长出了四千多个第三方插件。现在我们把同一个"官方写不完、市场自己长"的机制搬到 agent 上，再加上 Koishi 没有的那一层：审计。开发者换模型、换沙箱、换渠道，都只是换 Provider，账本不动。

## 业务阶梯：从"谁在操作"改成"谁在买单"

| 层 | 今天在操作的人 | 买单人 | 变现单位 | 缺的产品工程 |
|---|---|---|---|---|
| L0 配置组合 | 工程师（cordis.patch.yml / --patch） | 小团队 | 组合包月 | preset / 权限 / patch 的点选界面（把识字门槛从 cordis.yml 再降到点选） |
| persona（两轴组合） | 垂直服务商打包 bundle+preset | 专业协作团队 | 岗位包 | 官方目录 + 审核故事（`cordis_mount` 明确不是安全边界） |
| 企业流程 | 平台 / 安全团队 | 合规压力行业 | 审计 + 渠道 + 治理 | IM answerer、表单渲染、多 answerer 编排 |

诚实一句：**"UI 化 L0"不是现有阶梯的附赠，是一整笔产品工程投入。** 审批 answerer UI、preset 选择器、patch 可视化各对应一个已有 seam 的交互面，上一版把它说轻了。三道门槛的真实状态（知识门槛已外置、识字门槛部分降低、判断门槛被拆小仍在）见 [`harness-idea/07`](../../_digested/harness-idea/07-boundaries-costs-fit.md)。

## 四块拼图：已有 / 缺 / 卖点 / 若不做谁来做

| 拼图 | 已有（机制事实） | 缺 | 卖点一句话 | 若不做，谁在做 |
|---|---|---|---|---|
| 渠道面 | apiproxy 把审批请求 wire 派发到浏览器 UI，审计 id 认领语义完备（[源码](../../packages/host/apiproxy/src/api-proxy.ts)） | 任何官方 IM answerer；官方 seam 的三角色全缺 | 人不在场，决策在场 | **已做出 ≥8 个互不兼容方言；NanoClaw/Vercel 已卖 15 渠道审批产品** |
| 审批形状 | 运行时完备：fail-closed、审计对、取消语义（[README](../../packages/interaction/user-approval/README.md)） | 表单 / 多选项 / 确认单渲染；多 answerer 顺序语义 | 把"你同意吗"升级成"请确认这三项" | GUI 组件层，最贴近官方自己 |
| 治理打包 | 四件套：log 重建不变式、landlock、凭据引用、`SESSION_FORMAT_VERSION` | 审计的消费端（导出 / 检索 / 报告界面） | 每个请求可从日志重建 = 天生审计底座 | 安全厂商会抢 |
| 角色包与市场 | preset isolate realm、scope restrict 交集、dormant provider 商店范本（Codex bundle，[`capability-seams/03`](../../_digested/capability-seams/03-subagent后台与产品provider.md)） | 官方目录 + 审核 + 签名 | 雇一个 Agent = 装一个带账本的岗位包 | **商店方已经先行（第三方目录站）** |

## 四个实验 v2：判据 + 杀档线

| 实验 | 通过判据 | 杀档线（停） |
|---|---|---|
| A 渠道 spike：复用 approval + userQuestions 做官方 IM answerer | IM 里完成审批往返，且 `asked/decided` 成对可重建，重建耗时 < 15 分钟；竞品（NanoClaw）已卖"聊天审批"，本实验有效的前提是**审计对上赢**，不是聊天窗口赢 | 试点方只要"能跑"不要"可证明"，或 IM 平台不批 bot |
| B E2B 转正 | 同一任务本地→云端零工具 diff 跑通、5 个工具全通 | E2B 生命周期成本超过自建维护，或平台依赖不可控 |
| C persona 包换题材：带审批的采购/报销助理（弃用周报：无付费意愿） | 全部由 preset + bundle + patch 表达，diff 不进 `packages/`，HMR 回退演示 live 生效 | 没有垂直服务商愿按岗位包付费 |
| D 可替换率入闸 | 统计并入 gen-doc-graphs 输出，每 rc 自动重算（第一版 39.3% 已手工算出，见 [FAQ 08](../08_plugin-seam-maturity/answer.md)） | 连续两个 rc 没人引用该数字做决策 |

## 三个能杀死这套叙事的条件（决策闸门，不是修辞）

1. 官方渠道 seam 发布后六个月内，在野的 ≥8 个方言无人迁移——市场只认自己的约定，"官方标准"不值钱；
2. 试点企业愿为"能跑"付费、不愿为"可证明"付溢价——审计溢价不成立，回到 dev-tool 定价；
3. 模型厂商或 NanoClaw 类产品自带闭环审计——可证明性被上游/竞品吸收，seam 层只剩渠道价值。

任何一条成立，治理溢价叙事降级为开发者工具生意。

## 边界与对称性

- **审计是双刃**：同一张日志既约束插件，也约束官方模型——监管会用证据链审 DeepSeek 自己。卖治理必须先接受这份对称性，否则叙事在第一次事故后就崩。
- **GPT Store 的教训必须写进角色包设计**：无分成（收益共享从未走出小范围试点）+ 无门禁 = 克隆垃圾场，最终对个人用户收紧。角色包市场不能做成"免费上架等分成"；行业已转向按席位/headcount/效果定价（Lindy 类 $30–50/mo 起步、agent 按人定价的讨论），且 Koishi/Dify 的既有商店都是"注册表 + 薄目录、不碰支付"——**目录不赚钱，信任层赚钱**。
- Koishi 只验证"市场会长出来"，不验证"企业会买治理"；企业级信任是 DSH 的新命题，旧胜仗不能充数。
- `cordis_mount` 不是安全边界；"Agent 写插件上架"的审核故事一天没有，角色包市场一天不能开卖。
