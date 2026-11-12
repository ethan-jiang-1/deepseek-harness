# 核验基线登记

本页是本语料**唯一**的基线家（`CORPUS-CHARTER.md` §2）。各篇正文不再声明「当前基线」，只写「核验状态见维护清单」，或直接链回本页。

判据很简单：同一基线的声明数应为 1。第 2 份起就是维护负债——每轮同步都会多一处要改，而且必然漂移成不一致。

## 当前基线

| 项 | 值 |
|---|---|
| `baseline` | `dsh-v0.2.1-rc.5`（commit `62adbb04417f3214eb4428c4ac28490d7ea0fdcf`） |
| 登记日期 | 2026-11-10 |
| 含义 | 本轮复核时产品树的检出口。**它不等于每篇的核验点**：各篇的 `verifiedAt` 见下表，可以早于 `baseline`，但必须按 `status` 标注，不得写成「已按当前基线核验」 |

## 各篇核验状态

`status` 取值：`reverified`（已按 `baseline` 逐条复核）、`carried`（沿用早期核验，结论未重跑）、`unrecorded`（未登记核验点）。

| 篇 | `verifiedAt` 时的基线 | `status` | 说明 |
|---|---|---|---|
| 01 目录组织 | `dsh-v0.2.1-rc.2` | carried | 结构与包组表按 rc.2 核；`packages/` 分区未变 |
| 02 hooks | rc.2 线 | carried | 桥事件计数属外部文档读数，见该篇 research |
| 03 preset 模式 | rc.2 | carried | 四份 preset 的 wire 工具表按 rc.2 重测 |
| 04 根入口文档 | rc.2 线 | carried | 门禁与预算以 manifest 为准，manifest 本身随树走 |
| 06 变更落位 | rc.2 | carried | 载体路径未变 |
| 07 借鉴 DSH | rc.2 线 | carried | 迁移建议不依赖具体行号 |
| 08 插件 seam | `dsh-v0.2.1-rc.5` | reverified | 生成表按 rc.5 重跑：35 seam / 15 P≥2 / 42.9% / 99 总数，与 rc.2 读数一致 |
| 10 重度用户体感 | `dsh-v0.2.0-rc.2` 线 | carried | goal/plan 机制细节需按 rc.5 抽查 |
| 11 原生开发闭环 | `dsh-v0.1.5-rc.2`（`fb2c4b9e69`） | carried | 制度类结论；git 量化读数未重算 |
| 13 专家插件仓 | rc.2 线 | carried | 组织方案不依赖版本 |
| 20 Agent Note 质量 | `dsh-v0.2.1-rc.2`（`687f282e86`） | reverified（计数） | 计数已按 2026-11-10 实测更新为活跃 692 / 归档 1848 |
| 21 录制会话快照 | `dsh-v0.2.1-rc.2` | carried | `dsh-llm-replay` 结论未变 |
| 22 规格漂移 | rc.2 | carried | 防护清单未变 |
| 23 发布物形态 | 工作树 `8d8940e6a3`（产品树 `687f282e86`） | carried | 含 2026-10-25 本机实测读数 |
| 24 发布与交付 | `dsh-v0.2.1-rc.3`（`1f81c047`） | carried | 包合同与六轴；`release/` 的 T 级实验日期见该目录 |
| 25 Workspace | `dsh-v0.2.1-rc.3`（`1f81c047`） | carried | 含 2026-10-27 本机 `$DSH_HOME` 静态读数 |
| 27 运行时编排 | `dsh-v0.2.1-rc.2` | carried | 五岔口与诊断表未变 |
| 28 探针是什么 | `dsh-v0.2.1-rc.5` | reverified | 不变量与事件（`request/header` / `system/message`）按 rc.5 核；外仓 `probes/` 读数为 2026-11-10 本机静态清点 |
| 29 keyless 的含义与边界 | `dsh-v0.2.1-rc.5` | reverified | 七篇结构（00 导览 + 01–05 正文 + answer 结论页）；判据、三档语义（含 refresh 写会话 fixture）、五类测试证据、两处哨兵假 key、与四类不调真模型的测试包均落在判据内的结论按 rc.5 核；postmortem 0001 读数引该篇原文；无计数类结论 |

## 版本号能写在哪

- **本页**：写当前基线，一处。
- **正文引用历史 commit 作为证据**：可以，但必须明确标为历史（`OLD`、`历史`、删除线、或紧随 `_change_log` / 已归档决策记录），不得写成当前基线。
- **正文引用外部文档的当日读数**：可以，写成「T（日期）」或「live-check 于某日」，不冒充基线。
- **链接 URL**：一律 `blob/master/` 或 `tree/master/`；不把 tag / SHA 写进内容地址。事件与讨论的永久链接（`commit/`、`pull/`、`issues/`）可以固定 SHA。

## 版本升级时改什么

| 动作 | 做不做 |
|---|---|
| 改本页的 `baseline` 一处 | 做 |
| 逐条复核受影响结论 | **做**（这是升级的实质工作） |
| 改各篇正文里的基线副本 | 不做（不应存在） |
| 改链接里的 tag 或 SHA | 不做（链接指向 `master`） |
| 把「换了一批 URL」记成「复核完成」 | 不做（改 URL 不等于复核） |
