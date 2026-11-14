# Research 08 · 外部生态与行业参照记录

本页保留支撑 [`answer.md`](./answer.md)“缺口排序”与“护城河判断”的外部调研数据。机制结论一律以仓库源码为准；本页的社区仓库数、Star 数与外部融资信息均为检索当日快照（2026-08-27 / 08-28，部分注册表数据于 2026-09-16 复核），仅用于说明生态自发演化的方向。

---

## 一、社区插件目录实测：标签水分极大，精选策展稀缺

同一时间按不同口径清点“DSH 插件数量”，会得到五个差距悬殊的数字（2026-08-27 快照）：

- GitHub 搜索 `topic:dsh-plugin`：**11,916** 个仓库
- 社区目录站 `imsai-sh` 自报索引：**11,424** 个
- 社区目录站 `dsh.deepseek404.com` 页面抓取：**5,886** 个
- 策展仓库 `kejixiaoliang/awesome-dsh-plugins` 统计参照：**~3,300+** 个
- 同一策展仓库经人工筛选实际入库：**306** 个（分属 14 个类别）

**为什么差出近 40 倍？** 抽查 Star 排名前 80 的 `topic:dsh-plugin` 仓库，有 55 个其实早在 DSH 开发者预览版（2026-08-13）之前就已经建仓了，大量是泛 Agent 生态老项目（如 OpenViking、WeKnora、NocoBase、MemOS、PicGo 等）顺手挂上了兼容标签。从 11,916 个标签仓库到 306 个真正能装能用的插件（压缩率 **2.6%**），说明光靠抓 GitHub 标签凑出来的“插件数量”没有参考价值，**基于真实安装验证的精选目录**才是稀缺品（例如社区里已经出现主打“容器内实装四档测试、精选 Top 50”的策展列表）。

同时，头部热门工具普遍采取**多宿主分发**（例如某高星技能项目一行简介同时兼容 Claude Code、Codex、DSH、Kimi Code、OpenCode 等十几个宿主）。这意味着单靠“第三方插件总数”构不成任何一家 Harness 的独占壁垒。

---

## 二、官方没立 seam 的地方，社区正在发生什么？

### 1. IM 与通知渠道：同一个轮子被重复造了至少 8 遍

从 `kejixiaoliang/awesome-dsh-plugins` 的通知与渠道分类（19 个项目）抽样，能直观看到没有官方标准接口时的碎片化现场：

- **Telegram 桥就有三套**：`LoserFox/telegram`、`ben7am1n/dsh-telegram`、`congchuanling-dot/DSH-Telegram-Relay`，认证配置与对话指令各说各话。
- **单渠道桥**：微信（`dsh-chatnode-wechat`，走网关做聊天、监控与**手机端审批**）、飞书（`dsh-lark-bridge`）。
- **多通道聚合网关**：`dsh-onlyne`（QQ/微信/飞书/TG）、`dsh-im`（一口气塞进飞书/微信/钉钉/企微/QQ/Slack/TG/Discord/WhatsApp 九个渠道）。
- **桌面与提示音通知**：`dsh-notification`、`dsh-notify-windows`、`dsh-web-ui-notify`、`task-chime`（专门针对**审批请求**与任务完成发提示音）等 7 个独立包。

连安装方式都裂成了两派：有的走标准 `dsh plugin add`，有的让用户跑 `npx -y github:... install`。同时，不止一个社区项目已经把“在聊天软件里点按钮批权限”做出来了，直接印证了“渠道接入 + 审批交互扩展”是一体两面的高频刚需。

### 2. 长期记忆：社区竞争最拥挤、官方 seam 却为空

高星列表里互相竞争的第三方记忆与上下文插件至少有 5 家（EverOS、MemOS、ReMe、memsearch、OpenViking），外加第三方上下文面板；而官方 `ctx` 服务里只有底层 `storage`、`spillStore` 和 `sessionQuery`，没有任何面向模型的记忆抽象。这是最典型的“生态最热处恰好是官方空白处”。

---

## 三、行业侧参照：沙箱商品化、持久工作流与 MCP 审计

- **云端沙箱正在变成标准大宗商品**：E2B（2025-07 获 \$21M A 轮）与 Daytona（2026-02 获 \$24M A 轮）等厂商把云端 Agent 沙箱做成了按项比价的标品服务。对 DSH 而言，亲自下场造云沙箱不是护城河，保持 `fs` / `subprocess` / `sandbox` 接缝的中立可替换性才是正确站位。
- **跨会话持久执行有独立商业验证**：Temporal 围绕 Agent 时代的 durable execution 连续获得大额融资（2025-03 估值 \$1.72B，2026-02 获 \$300M D 轮）；对照之下，DSH 目前单线程内存态的 `workflowEngine` 在长周期可恢复任务上仍有明显演进空间。
- **MCP 协议中立化后，竞争力转向“可审计性”**：MCP 已于 2025 年末移交 Linux Foundation 旗下的 Agentic AI Foundation（[官方公告](https://modelcontextprotocol.info/blog/joins-agentic-ai-foundation/)），社区虽有上万个 Server，但安全机构早已实证过恶意描述劫持行为的 Tool Poisoning 风险（[Invariant Labs 分析](https://invariantlabs.ai/blog/toxic-flow-analysis)）。当所有客户端都能连 MCP 时，DSH 让第三方 MCP 工具自动落入会话日志审计（`model-visible ⟺ logged`）和 `asked/decided` 成对审批账本，反而成了纯客户端工具给不了的硬保障。
- **插件市场形态的前车之鉴**：GPT Store 因刷榜泛滥与缺乏分成闭环走向收缩，Chrome Web Store 也早已下线内置支付（[官方文档](https://developer.chrome.com/docs/webstore/cws-payments-deprecation)）；反观开源生态里跑通的 Koishi 插件市场（直接基于 npm 包自动同步的薄目录，[论坛说明](https://forum.koishi.xyz/t/topic/12557/4)）与 Dify Marketplace（[`aliyun/dify-plugins`](https://github.com/aliyun/dify-plugins) 精选仓库），都指向同一个结论——**开源 Agent 插件生态不靠抽成商店赚钱，靠的是“npm 标准分发 + 机器门禁 + 精选可信目录”。**
