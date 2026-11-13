# 0015 · 测试专题重组：资产账本、防漏机制与决策程序

**范围**：`_digested/test-strategy/`（13 页 → 16 页；新增 2 张图；重排编号）；跨语料触及 `_digested/00-index.md`、`_digested/_coverage/00-index.md`、`_digested/plugin-system/lifecycle/00-map.md`、`_digested/catalog.json`。
**基线**：不变，仍是 `dsh-v0.2.1-rc.5`（`b830ec95`）；本轮只读产品树，未改动任何产品源码。新增与重写页面的 `verifiedAt` 指向该 commit，其余页面沿用。
**日期**：2026-11-13。

## 为什么改

上一版测试专题是 12 篇机制参考 + 1 篇 probe，回答的是「DSH 有哪些层、快照怎么转、CI 怎么排」。读者（尤其是写 DSH 插件的人）反馈的真实问题是另外三个：

1. **资产怎么分布、为什么是这个形状？** 原来的分层页有数字，但没有把"为什么 95% 的用例在最便宜的层"讲成可判断的经济学。
2. **它如何保证不漏？** 六种机制散在政策、配置、复盘与评审技能里，没有被拼成一张"每种漏对应哪条机制"的表。
3. **怎么定测试面、怎么算够了？** 原来只有决策记录与经验，没有可执行程序；结果是全靠模型临场发挥，无法复核"分布准不准"。

本轮把这三问提到入口，并把机制页降为支撑层。

## 改了什么

1. **重排编号并分组**（16 页）：
   - 一、思想：`01-doctrine`、`02-tiers`；
   - 二、资产与防漏：新增 `03-asset-census`、`04-anti-omission`、`05-decision-procedure`；
   - 三、纪律与编排：`06-rules-ownership`、`07-ci-gates`、`08-reliability`、`09-infrastructure`；
   - 四、机制深潜：`10-snapshot-machinery`、`11-snapshot-external-face`、`12-probe-作为取证动作`；
   - 五、插件落地：`13-plugin-testing`、`14-plugin-testing-playbook`、`15-plugin-testing-contract`。
   旧编号映射：03→06、04→10、05→07、06→08、07→09、08→13、09→14、10→15。
2. **新增 `03-asset-census.md`**：唯一的资产数量登记处。实测 2,150 个 spec 文件、27,757 条 `it`/`test`、110 个 e2e 文件/303 条用例、190 个 web e2e 文件/613 条 e2e 用例（另 14 条归 expected）、250 个快照场景/1,682 文件、10 个 bench 文件、4 个手动诊断文件；给出用例占比（unit 95.67%）与成本模型、自动化边界、包级分布（含 12 个"无包内 spec 但不等于没测"的包）、健康信号与复测命令。新增 `figures/asset-distribution.svg`。
3. **新增 `04-anti-omission.md`**：六个检查面（空间 / 执行 / 类型 / 入口 / 断言 / 可见性）+ 复盘回路；"每种漏对应哪条机制"表；postmortem 0001 的缺口解剖；诚实边界；probe 作为证据选择器的位置。
4. **新增 `05-decision-procedure.md`**：五步程序（分类 → 选层 → 负控 → 验世界 → 判七问并记账）；12 类变更的证据矩阵；PR 证据账本模板；八条反模式；三个 worked example；CI 必需性映射。新增 `figures/decision-procedure.svg`。
5. **重写 `15-plugin-testing-contract.md`**（原"插件作者检查单"）：五级台阶 + 三种采用等级（L0/L1/L2）+ 十条可复制契约 + 同 PR 交付清单 + 插件账本 + 最小 CI 编排 + 五问分布自检 + 缩编对照表 + 三个事故的最小守卫 + 给 agent 的指令块与评审五问。
6. **收拢计数与去重**：把原 `02-tiers` 的"文件形态普查"移入 `03`；`01`、`10`、`11`、`15` 中重复的场景/文件/包数改为定性表述或指向 `03`；`00-map` 不再放数字。
7. **链接与索引**：更新全部内部编号链接、`plugin-system/lifecycle/00-map.md` 的三处入站链接、`_digested/00-index.md` 的描述与入口、`_coverage` 的未覆盖登记；重跑 `render-indexes.mjs` 生成覆盖矩阵。

## 没改什么

- 机制结论：快照世代与四面分工、CI 9 个必需 job 的构成、`process-bound` 的 8 个套件、bench 预算校准、probe 的三种产物，均沿用原结论；只调整了落点与表述。
- 产品源码：零改动。
- `01`、`06`–`14` 的 `status` 仍为 `carried`；只有实际重写/新增的 `00`、`02`、`03`、`04`、`05`、`15` 标为 `reverified`。

## 复核

- **计数**：所有数字用本页记录的命令重跑（`find` + 行首 `it|test` grep）；`27,757` 与发布命令完全一致，`2,150` / `110` / `250` / `1,682` / `10` 为精确值。`95.67%` 的分母为 29,013（unit + e2e + web 去重后的 613 + snapshot + expected；web 的 14 条 expected 只计一次）。
- **事实**：逐一对照 `docs/testing.md`、`vitest*.ts`、`scripts/run-gates.ts`、`.github/workflows/ci.yml`、`e2e.yml`、`packages/AGENTS.md`、`snapshots/AGENTS.md`、4 篇 postmortem 与 2 个测试技能；新增页的英文短引用均可在原文检索。
- **口径声明**：`04` 的"六面 + 回路"、`05` 的五步程序与账本模板、`15` 的十条契约，均在页内标注为本专题的提炼，不冒充仓库成文文件。
- **图**：两张新图用 `rsvg-convert` 渲染目检；修掉了首版的引导线穿字、文字溢出与合计标签重叠。
- **独立复核**：两路只读子代理分别对 `03`/`05` 与 `04`/`15` 逐条反查源码，共报出 12 处实质问题——web/expected 用例双计 14 条、bench 样本数被写成全车道 5、`skip` 语义过宽、`at plan time` 引文归属错、7 个符号链接的构成错、replay 钉死归属错、postmortem 0001 引用面、review 检查层级、`golden` 命名口径、豁免粒度、e2e 车道混合、README 门覆盖面。全部修正后重跑校验。

## 验证

```sh
node _digested/verify.mjs          # 通过：202 md / 119 svg / 25 topics / 176 pages
node _digested/render-indexes.mjs --check
```

覆盖矩阵已由 catalog 重新生成；`verify.mjs` 确认页面清单与文件树双向一致。
