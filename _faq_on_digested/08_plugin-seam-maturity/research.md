# Research 08 · 外部生态证据：无官方 seam 时的市场自组织（2026-08-27）

本文件是 Answer 08 的外部证据层：机制结论以产品树为底，这里只收集"从代码里看不见"的生态事实，全部为当日检索/抓取，来源按条标注。

## 目录清查：同一生态，五个互相打架的读数

- GitHub Search API，`topic:dsh-plugin`：**11,916** 个仓库（2026-08-27 实时查询）。
- 目录站 dsh.deepseek404.com 自报：**5,886** 个（页面抓取）。
- 社区目录站 imsai-sh 自报：**11,424** 个索引（README live-fetch，见 FAQ 09 research）。
- 策展列表 `kejixiaoliang/awesome-dsh-plugins` 自报生态参照：**~3,300+** 个（README Stats 节）。
- 同一列表人工策展入库：**306** 个、14 类。

五个读数里，三个"自报目录"口径（11,916 / 5,886 / ~3,300）就相差 3.6 倍，而两个目录站之间（5,886 vs 11,424）又差近 2 倍。差异来源：tag 可被任何项目自加（下条证据）、目录站按 tag 收录但分类学不足（58% 落"其他"）、策展列表做相关性过滤（`kejixiaoliang`）与容器实装四档实测（`AdamPlatin123`，见下）。**从最大自报 11,916 到人工策展 306 的压缩率 2.6%**，就是"策展"当前的市场价值量：目录易得，可验证的精选稀缺。

## Tag 滥用：多数高星"dsh-plugin"仓库不是插件

top 80（按星）样本中，55/80 创建于 developer preview（2026-08-13）之前，且 a描述大量是多 agent 生态项目：Volcengine OpenViking（记忆库）、WeKnora（RAG）、NocoBase（no-code）、MemOS、reactive-resume、PicGo 等，描述里写"supports DeepSeek Harness"或仅作为众多兼容目标之一。真实 DSH 原生插件与泛 agent 项目混在同一 tag 下，任何"按 tag 数市场"的叙事都必须先扣掉这部分。

## 第三方在无官方 seam 处自组织出了四样东西

1. **分发**：三个 awesome 列表、两个可视化商店（dsh.deepseek404.com、whalehub-dsh.vercel.app）、**开进 DSH 内部的商店**（`dsh-market/dsh-market`，"browse, search, one-click install"）、桌面打包（anywhere-labs/dsh-desktop、dsh-tauri-desk）。
2. **策展/信任**：`AdamPlatin123/awesome-dsh-plugins` 自称"多路自动发现 9000+ 候选、容器真实安装路径运行级实测（四档判定）、精选 Top 50"。第三方已经在卖"实测过"这个信任品。
3. **标准**：`yjh051108/dsh-routing-suite`（injector + router-standard，声称实测 P1-P23）；awesome 列表发明了仓库托管插件格式 `.dsh-plugin` 与 `github:<owner>/<repo>` 约定。
4. **渠道**：见下条，碎片化最重的一块。

## 渠道碎片的现场（对 Answer 08 backlog 第 1 位的直接证据）

第三方渠道实现的**互不兼容重复建设**，来自 `kejixiaoliang/awesome-dsh-plugins` 的通知/渠道类（19 枚）抽样：

- Telegram：LoserFox/telegram、ben7am1n/dsh-telegram、congchuanling-dot/DSH-Telegram-Relay——**三种**对话/认证/通知方言；
- 微信：dsh-chatnode-wechat（iLink 网关，"聊天/监控/**审批**"，⭐7）；
- 飞书：dsh-lark-bridge（双向控制器）；
- 多通道网关：dsh-onlyne（QQ/微信/飞书/TG）、**dsh-im（9 渠道：飞书/微信/钉钉/企微/QQ/Slack/Telegram/Discord/WhatsApp，⭐888）**；
- 通知侧：dsh-notification、dsh-notify-windows、dsh-win-notify、dsh-web-ui-notify、dsh-session-notification、dsh-bell-notify、task-chime（"**审批/权限请求**与任务完成提示音"）。

两个观察：其一，**同一能力被发明了 ≥8 次**，装法还不统一（`dsh plugin add …` 与 `npx -y github:xmanrui/dsh-im install` 并存）——没有官方 Definition 的代价不是"没人做"，是"各做各的协议，之后无法互换"；其二，**第三方已把"审批从聊天里做人"预做了**（chatnode-wechat 的"审批"、task-chime 的审批提示），Answer 09 实验 A 的市场先行形态在此。

## 记忆是竞争最热、官方 seam 为零的类别

top 列表里互竞的第三方记忆/上下文产品至少 5 个：EverOS、MemOS、ReMe、（zilliztech）memsearch、OpenViking——外加 dsh-context（上下文看板）。而官方 `ctx` 服务里**没有面向模型的长期记忆 seam**（只有 storage/spill/sessionQuery 等底层）。最热的第三方品类恰好长在官方最空的缝上，这是 Answer 08 缺口清单应补的一条。

## 多宿主是常态，DSH 只是目标之一

EchoBird（⭐3.1K）一行文案覆盖 Claude Code / Codex / Grok / DeepSeek / Kimi Code / Qwen Code / Aider / OpenCode / MiMo Code / ZCode / OpenClaw / Pi 等 15 个 agent；petdex、"Vibe-Skills"、voyager 等同样多宿主分发。推论：官方不能指望"插件数量"构成独占优势——同一批插件在别的 harness 上也装。Answer 09 的审计叙事必须以此为背景。

## 治理/审计卖点已被第三方试探

`sandbaseai/sandbase-harness`（⭐634）："Local-first AI agent runtime with sandboxed sessions, MCP tools, memory, credentials, **audit/replay**, and a built-in console"。外部已有人把 audit/replay 当卖点写进 README——审计楔子是真实需求，但不专属 DSH；先发优势要靠官方把"可重建"做成被 gate 强制的不变量（Answer 08 诚实边界第 3 条），而不是写在 README 上。

## 引用纪律

以上为 2026-08-27 快照与搜索读数，star 数为当日值且快速漂移；"官方公众号收录"这类第三方自述未经核实，不进入答案正文。

## 补：沙箱商品化、持久流程融资、MCP 中性化（2026-08-28 外网检索）

- **沙箱供应在商品化**：E2B 以 "Cloud for AI Agents" 拿 $21M Series A（Insight Partners，2025-07，公司博客），Daytona 2026-02 拿 $24M Series A 做 agent-native compute；公开对比文章把 E2B/Daytona/Modal 当逐项比价的采购选项。推论：自营沙箱不是 moat，**seam 保持供应商中立**才是 DSH 该守的东西——E2B 转正的价值是"又一个可替换 Provider 的成熟样本"，不是平台资产。
- **跨会话持久流程是被融资的缺口**：Temporal 围绕 durable execution 先 $146M（$1.72B 估值，2025-03）再 $300M Series D（2026-02，"make agentic AI real"）。外网把"agent 下的持久流程"当作独立生意，而 DSH 的 `workflowEngine` 还是单 Provider 无持久层——缺口区的第 5 位有外部融资背书。
- **MCP 已被中性化，审计价值反而上升**：MCP 于 2025 年末捐赠给 Linux Foundation 治理的 Agentic AI Foundation；跟踪者报 ~10k server / 97M 累计下载；Invariant Labs 实证 MCP tool-poisoning（恶意 server 描述劫持 agent 行为）。"成为最好的 MCP host"这个定位已被协议中性化稀释；真实差一点是 harness 级的来源可审计性——经 `mcp-client` 注册的 MCP 工具走 `ctx.tools`，自动落在 model-visible ⟺ logged 不变式下，等于**每一个第三方 MCP 工具免费获得审计**，这是纯客户端做不到的价值。

源 URL 与校验方式（检索/复核日 2026-08-27/28；标 live-check 的链接当日返回 200；标 search 的只用于方向性事实）：

- 沙箱：E2B $21M Series A（Insight Partners，2025-07，公司博客）、Daytona $24M Series A（2026-02）。
- 持久流程：Temporal $146M（$1.72B 估值，2025-03）与 $300M Series D（2026-02）。
- MCP：捐赠 Agentic AI Foundation（[公告](https://modelcontextprotocol.info/blog/joins-agentic-ai-foundation/)，live-check）；tool-poisoning 实证见 [Invariant Labs](https://invariantlabs.ai/blog/toxic-flow-analysis)（live-check）。

## 补：目录站的成与败，以及"审计可证明性"的需求侧证据（2026-08-27 迁移存档）

本节原属已删除的「自用生产力」篇，因 08 的缺口 backlog 与 09 的响应设计依赖它，迁到此处作为外部证据。

- **GPT Store（反面范本）**：收益分成从未超越一个小范围美国试点（[官方 FAQ](https://help.openai.com/ru-ru/articles/9119255-monetizing-your-gpt-faq)、[社区线程](https://community.openai.com/t/what-is-the-status-with-gpt-store-revenue-share/839172/4)，primary）；2026-08 中旬起对个人用户收紧 Custom GPT（[报道](https://chatgptaihub.com/openai-ends-custom-gpts-personal-plans-plus-pro-free-users-august-2026/)，live-check）。克隆/垃圾内容刷爆目录。**结论：无分成 + 无门禁的目录 = 垃圾场。**
- **Koishi 商店（正面范本）**：官方市场只是 npm 之上的薄目录，发布到 npm 的 `koishi-plugin-*` 约 3 天自动同步（[官方论坛](https://forum.koishi.xyz/t/topic/12557/4)，primary）——**注册表即市场、目录不碰支付**；npm 最新 v4.18.11、月下载 ~21.4k（窗口 2026-08-13..2026-09-11，[registry API](https://registry.npmjs.org/koishi)），2026-09-16 live-check。
- **Dify**：官方 Marketplace 走精选目录 + Git 镜像仓库（[aliyun/dify-plugins](https://github.com/aliyun/dify-plugins)，primary）——开源 agent 框架的一致收敛形态是"免费精选目录"。
- **平台商店货币化在退潮**：Chrome Web Store 移除内置支付、只剩 $5 开发者费（[官方废弃文档](https://developer.chrome.com/docs/webstore/cws-payments-deprecation)，primary）；Open VSX 以第三方注册表身份赢得用户群，但因审查轻出现恶意包（[Eclipse 博客](https://blogs.eclipse.org/post/thomas-froment/cant-download-vsix-vs-code-use-openvsx)）。**结论：目录赚不到钱也守不住信任；信任只能靠可核对的来源 + 机器检查。**
- **法定义务侧（primary）**：EU AI Act Art. 12 要求高风险系统技术上允许自动记录事件，Art. 19 要求 ≥6 个月日志留存，Arts. 11/18 要求技术文档留存 10 年（[Art.12 镜像](https://artificialintelligenceact.eu/article/12/)）；GPAI 义务 2025-08-02 生效、一般适用 2026-08-02，高风险义务经 Digital Omnibus 推迟向 2027-12（[时程说明](https://onvlaw.ro/ai-act-delayed/)，search，未逐字复核正文）。 **日志/留存是法定义务不是卖点话术。**
- **需求侧（vendor 口径）**：Gartner 预测到 2027 年底前 >40% 的 agentic AI 项目将被取消，原因是 agent 经济学与风险控制不足（[官方预测](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)，2026-08 复核时 403，仅保留 search 来源）。
- **"从聊天里批 agent"已是现货**：NanoClaw + Vercel 跨 15 个消息应用做策略设置与审批对话（[VentureBeat](https://venturebeat.com/orchestration/should-my-enterprise-ai-agent-do-that-nanoclaw-and-vercel-launch-easier-agentic-policy-setting-and-approval-dialogs-across-15-messaging-apps)，secondary）；n8n 的 human-in-the-loop（[官方文档](https://docs.n8n.io/build/integrate-ai/ai-examples/human-in-the-loop-for-tools)）、Temporal 的 durable Signal 审批（[AI cookbook](https://docs.temporal.io/ai-cookbook/human-in-the-loop-python)）；Claude Code 的权限提示 webhook 诉求（[#29827](https://github.com/anthropics/claude-code/issues/29827)，primary）2026-04-30 以 not planned 关闭。**现货里没人做的是"成对的 ask/decide 审计事件 + fail-closed + 整请求可重建"——差异化在账本，不在聊天窗口。**
- **观测/追踪已是拥挤品类（备料，不进主线）**：LangSmith、Langfuse、Helicone、Braintrust、Phoenix、W&B Weave、AgentOps 均在 2026 年的 LLM/agent 可观测性对比清单内（secondary 综述）；DeepInspect 的定位语是 "Replaying What an Agent Did and Authorizing What It May Do"。这批厂商的买家是开发团队与合规部门，不是自用 owner 的赛场。
