# 审计历史与已知缺口

> **本文件不是当前行为的 owner。** 当前结论在正文（`10`–`90`）与 [reference](./reference.md)；这里只记“哪一轮改了什么、还留了什么洞”。
>
> 2026-10-27 至 10-30 的早稿用过一套已废弃的说法（“承诺 P0–P5”“六种承诺”“架构 I/II”“`dataRoot` 作为 DSH 机制”“占位 registration”“`adoptedRoot`/`projectsRoot`”）。这些概念已从正文删除：`dataRoot` 现在只作为**发行版自定义 Config 字段名**出现，DSH 没有这个 API；“承诺”分类被**数据卡**（[91](../90-advisor/91-checklist.md)）取代。需要追溯当时的写法，看 git 历史。

## 1. 仍然开放的缺口

| # | 缺口 | 现状 | 影响 |
|---|---|---|---|
| 1 | 外部插件全部未安装、未运行 | 只有 `[SRC]`/`[R]`，34–36 的八个包另有 `[OBS]` 级 registry 核对（只证发行物与 manifest） | 任何“行为”结论都不能当合同；依赖前须另行核兼容、license、数据生命周期 |
| 2 | 应用内 Plugins 页与 Desktop 通道未实测 | 本机没有 Desktop；应用内安装只在源码层读过 | 34–37 谈的跨面安装是 `C`，不是 `T` |
| 3 | 启动竞态未执行 | [实验 01](./experiments/01-startup-race.md) 仍为 **U** | “发行版 onboarding 与 default Workspace 谁先”没有观测证据 |
| 4 | 两个 profile 样本源码未 pin | `dsh-plugins-plus` 0.2.0 的 `gitHead` 指向别的 manifest；`better-session` 无 tag/无 `gitHead` | 这两家的机制只能当概念参考（`[R]`/`U`） |
| 5 | 37 的 16 张阶段样本未重跑 | 每行一个 S/R 字母 + 一列“本篇没验证的那一步” | 沿用原册结论，本篇不背书其运行行为 |
| 6 | 浅克隆 | 2026-06 之前的 git 历史不可用 | 早期事件只能靠 Agent Note 与 docs 复述（`H` 不等于可 git 复核） |
| 7 | 本机读数只代表那台机器 | 实验 04 的目录结构、`$DSH_HOME` 规模 | 不能当发行版默认值或容量规划依据 |

## 2. 仍然生效的约定

- **证据分级**：`T` 可复现命令+输出、`C` 当前合同（docs/源码）、`H` 历史、`P` 提案、`S` 第三方源码、`R` 第三方 README、`U` 未确认；外部章另用 `[SRC]`/`[R]`/`[DSH]`/`[TEST]`/`[CI]`/`[OBS]`，本轮没有 `[RUN]`。
- **外部样本不支撑 C**：第三方源码/README 只能到 S/R。
- **一个事实一个家（one home per fact）**：每个数据事实只有一个权威，其他通道只存引用（[11](../10-foundations/11-storage-channels.md)）。
- **数据卡是唯一记录格式**：owner / authority / source / mechanism / scope·key / readers / writers / rebuildability / retention（[91](../90-advisor/91-checklist.md)）。
- **分章不重复 owner**：机制细节归 10-foundations 与 50-lifecycle，外部样本归 31–37，施工流程归 90–93。

## 3. 轮次索引

只记方向与产出，不重述过程。

| 日期 | 本轮做了什么 |
|---|---|
| 2026-10-27 | 语料从 20 个平铺文件重组为分层目录；建立“原生 / 外部 / 证据 / 施工”四段；引入数据卡前身与证据分级。 |
| 2026-10-30 | 方向从“插件数据放哪”改为“插件即产品”；新增 15 四个空间、16 首启、17 配置分层、18 安装升级；叫停 `dataRoot` 之类的伪 DSH 抽象。 |
| 2026-10-30 | 21/22 补产品视角；31–33 补统一角色横幅；92 的分篇合并回单篇（分篇维护成本高于收益）。 |
| 2026-10-31 | 主文统一为“数据卡”；P0–P5 分类移除；外部章明确“样本不构成依赖禁令或背书”。 |
| 2026-11-01 | 30-external 扩为 31–36（形态 / 装配 / 台账）；新增 [37 生命周期](../30-external/37-lifecycle-stages.md)；[50 生命周期](../50-lifecycle/00-index.md) 补 34 条隔离实测。 |
| 2026-11-01 | 全树按 DSH 约定 review：CLI 语法、运行时来源计数、Host/Client 分层、未验证断言降级。 |
| 2026-11-01 | 与 repo 逐条复核（结论见 §1）：修正 `dsh.compatibility` 伪字段、无 bundle 包的双通道行为、web flag 静默后果；拆清 34/35 的重复机制段。 |
| 2026-11-01 | [50 生命周期](../50-lifecycle/00-index.md) 改为**插件作者的生命周期规范**：加最短路径五步与生命周期规矩总表；新增 [75 插件 README](../50-lifecycle/75-plugin-readme.md) 与其宿主读取字段图；目录由 `50-launch` 改名（launch 只覆盖启动，实际覆盖打包到卸载）；修正五处"可回滚"与一处已退役的"事务性重载"，并把初始化/特殊初始化/卸载三段的机制指回 10-foundations。 |
| 2026-11-02 | 交付单位从“产品 profile / 插件即产品”改为 **Harness 发行版**，目录原为 `26_harness-release`，已并入 24；[10](../10-foundations/10-taxonomy.md) 由概念页改为**六轴定义页**（运行时、profile、patch 层、app surface、Harness home 与数据、生命周期），每轴给 owner、DSH 机制、读回方式与缺轴症状；[50/10](../50-lifecycle/10-model.md) 的“三样东西”对齐六轴；全语料去掉 `产品型插件`／`产品 profile`／`产品 bundle`／`产品 project` 复合词；新增术语来源表，把 `Harness 发行版`／`发行方`／`六轴` 标为本目录自造，其余词沿用 repo 定义，`产品` 只保留为对第三方样本的形容词（产品级、产品领域）。 |
| 2026-11-02 | 术语第二回合：退役“五个家／四个空间”及其派生简称，按 repo 机制名重写（files、session log、storage domain、client state）并保留资产 owner 视角；`11-five-homes.md`→[11-storage-channels.md](../10-foundations/11-storage-channels.md)、`12-state-homes.md`→[12-state-storage.md](../10-foundations/12-state-storage.md)、`15-four-spaces.md`→[15-asset-owners.md](../10-foundations/15-asset-owners.md)，两张同名图同步改名；消掉 `DSH 发行版` 变体，`Harness 发行版` 只留在首次定义、单插件对比与章标题；承重词保留英文，自造词在台账配英文锚点；`verify.mjs` 增加退役词扫描与台账登记检查。 |

## 4. 样本去重

同名仓库与其镜像在筛选中被排除；本目录没有保留逐条排除清单，因此不把“已去重”当作可复核结论。

## 5. 复核方式

- 结构：`node _faq_on_digested/verify.mjs`（26 子树 0 失败；全量失败只来自 26 之外的本地 worktree）。
- 事实：DSH 侧逐条对 `docs/`、package README 与源码；外部侧只能对固定 tag/commit 的源码与 README。
- 计数：本章的数字（落点、事件、案例、样本）用枚举表格行复核，不用估读。

## 6. 已知的表述风险（不修，但要知道）

- 外部章的版本、下载量、星标会漂移；引用时回到各仓库当前 README。
- 本目录讨论单 Host；多租户、跨机器同步、统一对象存储都在范围外。
- `present`、附件、spill、changes 的行为随 package 演进；以对应 README 为准。
