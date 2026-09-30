# Plugin inventory · 现成插件货架

产品源码基线：`639ed015397290b3745d163aafe02ffee4aa3f84`（`dsh-v0.2.0-rc.2`）；本专题是**快照式清单**：包数、服务数、组合成员随每次 upstream 同步漂移，重测义务登记在 [`_coverage/`](../_coverage/00-index.md) 的本专题行；引用生成目录与 bundle patch 时给区块级行号，结构变化以生成目录为真源。

## 一句话

动手写插件之前先查这里：dsh 出厂自带 316 个包、92 个 `ctx` 服务、30 个工具包，绝大多数能力已经有现货。本专题回答「我要的能力现成给了没有、以什么形态给、怎么拿到」，以及「哪些真的要自己写」。

## 新人消化路线（按顺序走，带时间预算）

| 步骤 | 页 | 花多久 | 你会得到 |
|------|----|--------|----------|
| 1. 立地图 | 本页＋漏斗图 | 5 分钟 | 组装三层（bundle → profile → preset）的心智模型 |
| 2. 走场景 | [`01 八类能力与场景`](./01-capability-tour.md) | 15 分钟 | 全部能力分八类的地图＋四个「不用写插件」的场景走一遍 |
| 3. 按需查表 | [`02 图鉴`](./02-plugin-catalog.md) · [`03 清单`](./03-reference-lists.md) | 按需 | 316 包逐组明细；92 服务 / 工具 / bundle / preset / skills 横切清单 |
| 4. 动手前 | [`04 出路与缺口`](./04-reuse-paths-and-gaps.md) | 10 分钟 | 四条出路选型＋必须自写的缺口白名单 |
| 深挖 | [`05 分类与思考`](./05-taxonomy-and-design.md) | 20 分钟 | 九形态 × 四 role 的分类法与背后的设计决定 |

![组装漏斗](./figures/assembly-funnel.svg)

## 复用决策路径（动手前的四问）

1. **查货架** → [`02`](./02-plugin-catalog.md)：这个能力有了吗？
2. **对清单** → [`03`](./03-reference-lists.md)：它以什么形态给？默认看得到吗？
3. **选出路** → [`04`](./04-reuse-paths-and-gaps.md)：调配置 / patch 换 Provider / 挂现货包 / 写胶水，按代价排序。
4. **确认缺口** → [`04`](./04-reuse-paths-and-gaps.md) 末节：零 Provider 的 seam 与 experimental 面，才是「必须自写」的候选。

## 与其他专题的分工

| 问题 | 去哪 |
|------|------|
| 有哪些现成的、从哪拿 | 本专题 |
| 换一个实现、三角色怎么分装 | [`capability-seams/`](../capability-seams/00-map.md) |
| 启动时怎么挂成一棵树 | [`composition-boot/`](../composition-boot/00-map.md) |
| 某种启动方式带了什么 | [`runtime-profiles/`](../runtime-profiles/00-map.md) |
| 生成目录怎么当量化底座 | [`harness-idea/05`](../harness-idea/05-dynamic-legibility.md) |
| 「我想做 X，dsh 有现成的吗」 | 步骤 2 → [`01`](./01-capability-tour.md) 走场景 |
| 「找到了，怎么用上 / 是不是要自己写」 | 步骤 4 → [`04`](./04-reuse-paths-and-gaps.md) |
| 「分类怎么定的、背后在设计什么」 | 深挖 → [`05`](./05-taxonomy-and-design.md) |
