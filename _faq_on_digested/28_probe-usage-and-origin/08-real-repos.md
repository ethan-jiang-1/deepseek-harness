# 28/08 · 仓外校准 + 主仓原生对应：两种现场对照

> **查询手册，不是读物。** 想抄别人的组织方式时看 —— 那是 [00 第 6 级](./00-ladder.md) 的延伸。
>
> 一节实地读数，不是产品合同。前半是四个插件仓（都在本机、仓外），后半是同一种工作法在主仓自己的原生落点——两部分对照着看，才能看出哪些是「DSH 给的」、哪些是「用的人自己长出来的」。

## 先分清：作者是在仓内还是仓外

| | 主仓自己怎么做（本仓库内） | 插件仓自己怎么做（仓外） |
|---|---|---|
| 形状 | `snapshots/<lane>/<scenario>/`：一份轨迹 + sidecar + `snapshot.yml` | `probes/<域>/*-probe.mjs`：一个脚本 + 一张表 |
| 消费方式 | `pnpm run test:snapshot` / `test:web`，CI 门禁 | 人跑、agent 跑，**不进任何门禁** |
| 有无基线 | 有；缺基线必须报错 | 多数无；产出是观察 |
| 谁写期望 | `DSH_SNAPSHOT=refresh`，唯一的写路径 | 不写，看完就下结论 |
| 定位 | 回归证据面 | 调试面 / 观察面 |

一句话：**主仓把探针活到了毕业，插件仓大多停在观察。** 两边共享同一份产物形状（一次真运行的记录），区别只在「有没有 base」——这正是 [07](./07-worked-examples.md) 开头那张目录图的意思。

## 四个仓的分工

| 仓 | 探针目录 | 定位（取自各仓自己的 AGENTS / README） | 规模读数 |
|---|---|---|---|
| `ai_dsh_assistant` | `dev/probes/{session,web}` | 会话侧 patch 与浏览器侧驱动分开；web 侧再分「自编排 / 只要一个 URL / 只要一个已起服务」三类 | 约 30 个 `.mjs` + 4 个 `.patch.yml` |
| `ai_dsh_company` | `probes/{team,fs-taskboard,browser-visual,session-context}` | 「调试面：窄机制与视觉探针，按机制域四子目录」 | 约 55 个 `*-probe.mjs` |
| `ai_dsh_bsimulation` | `probes/{e2e,cdp,session}` | 「live observation (page render, page turn, session log)」 | 3 个子目录，含 9 个 e2e 驱动 |
| `ai_dsh_company` 证据侧 | `snapshots/probes/<场景>/<轮次>/` | 排练 / 探针产物不进 `deliverables/`，落证据目录 | 按场景与轮次归档 |

四仓的目录名各不相同（`dev/probes`、`probes`、按机制域再分四层），但**分层结构完全一致**：装配面 / 渲染面 / 行为面 / 领域机制面。这种「不同的人独立收敛到同一组分类」本身就是一个信号——分类不是谁规定的，是问题种类逼出来的。

## 十条可移植的做法

下表每一行都能在 03 的原文里找到对应句子，这里只做归档，便于抄。

| # | 做法 | 出处 |
|---|---|---|
| 1 | 「探针不是门禁」，一句写在目录 README / AGENTS 里 | `ai_dsh_bsimulation` 的 AGENTS 目录表：「probes — debugging only」 |
| 2 | 「探针结果是观察，不是成功主张」 | `ai_dsh_bsimulation/probes/README.md` 末行 |
| 3 | 探针表分三列：**证明什么 / 不证明什么 / 怎么跑** | `ai_dsh_bsimulation/probes/session/README.md` 的表头 |
| 4 | 缺前置一律 `BLOCKED`（exit 2），不冒充 PASS | `ai_dsh_assistant/dev/probes/web/README.md` |
| 5 | 一个输出路径只留一张图（成功或失败，绝不并存） | `ai_dsh_bsimulation/probes/README.md` 的两条 evidence rule |
| 6 | 文件头必须写「为什么存在」，一次性探针注明服务哪条已归档验收行 | `ai_dsh_assistant/dev/probes/web/README.md` 的「战役一次性探针」节 |
| 7 | 能进基线的不另立脚本：能进场景的探针不要写新脚本 | 同文件「加一个新探针」节 |
| 8 | 探针判决 JSON 带 `sessionId`，日志按差分取、不按「最新」取 | `pnpm session --recent` 与各 `*-probe.mjs` 的判决输出 |
| 9 | 证据目录固定 + `verdict.json` + 截图 + console 日志 | `ai_dsh_company/docs/guides/cdp-probe.md` |
| 10 | 通用驱动与仓库场景分两层：驱动可整段拷走，场景自带选择器与断言 | 同文件「架构（两层）」表 |

第 10 条值得单独说：把 `cdp-driver`（起无头 Chrome、CDP 连接、evaluate 超时竞速、清理）与 `cdp-probe`（本仓选择器与断言）拆开之后，驱动层被另一个仓「逐字可用」地拷走了。**探针的可移植性取决于这条切法**——通用机制留一层，业务断言留另一层，这是所有探针目录里最值钱的一条架构决定。

## 探针文件头的真实长相

外仓的常驻探针开头几乎都是同一个模板，值得照抄（下图把路径换成占位符，形状逐字保留）：

```text
// 状态：常驻
// <什么机制>探针（立项日期、归属）
// 何时跑：<改动面>改动时；真模型 ≈$<花费>、<哪个场地>
//
// 为什么猎它：<那条约定或机制的假设缺口是什么>
// 判据（<日期> 校准版 vN）：
//   B1（通过判据）：…
//   B2（发现判据）：… = FAIL ⇒ <缺口的名字>
//   观察：…
// 用法：<一条命令>
// 退出码：0 = …；1 = …；2 = 环境失败。
```

这个模板解决了本篇 06 判据一的全部问题：**谁在什么条件下跑、通过意味着什么、失败意味着什么、环境不通怎么办**，四件事一行不落。它也解释了为什么这些仓的探针能长期活着——**每一条都能被下一个 agent 在三十秒内读懂并决定跑不跑**。

## 与录制会话快照的关系

四个仓里有两个把探针产物与快照分开存放（`probes/` vs `snapshots/`），另有一个直接把探针产物落进 `snapshots/probes/<场景>/<轮次>/`。分歧本身说明一件事：

> **探针与快照共享同一份产物形状（一次真运行的证据），区别只在「有没有基线」。**

一旦某条探针的事实稳定下来、需要防回归，它就是快照的候选——这正是 [FAQ 21](../21_recorded-session-snapshots/answer.md) 的 L0–L4 阶梯里 L4 的入口条件之一：**同一个模型可见面第三次靠手工探针钉回归，就该建基线**。
