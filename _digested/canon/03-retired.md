# 03 · 退役词与本地装置

两种词需要在这里留档：**已经退役的**（曾经在语料里用过、现在不许再用）和**本卷自造的**（没有 repo 对应，但为了分析必须起个名字）。

## 一、退役词

退役不是风格偏好，每一条都对应过一次返工：读者按字面理解成一个 DSH 机制，而它并不存在。

| 退役词 | 为什么会造出来 | 为什么必须退役 | 换成 |
|---|---|---|---|
| 产品型插件 / 产品 profile / 产品 bundle | 想强调「这不是普通插件」 | `product` 在 repo 里指整台运行的 dsh，不修饰单个对象 | 说清是 bundle、profile 还是整份组合 |
| 入口 profile / 应用面 | 想区分「用哪个 profile 起」和「起哪个面」 | 两个字都是中文自造；repo 的原词是 `profile` 与 `app surface` | `profile`、`app surface` |
| 五个家 / 内容家 / 历史家 / 状态家 / 派生家 / 客户端家 | 给数据落点分五类，需要一个短名 | 「家」是隐喻；repo 只有 `Harness home` 这个具体路径概念 | 直接写机制：files、session log、storage domain、derived、client state |
| 四个空间 | 想按资产 owner 分类 | 与「五个家」同构，且没有 repo 依据 | 说清是哪几类资产、各自由谁拥有 |
| 一个事实一个权威 | 转写 `one home per fact` 时改的词 | repo 原词是 `one home per fact`，语料把它换成了自己的说法 | **一个事实一个家（one home per fact）** |
| 入口链 / 变更闭环 / 落地总纲 一类 | 给流程起名 | 只有在同一页里才成立，跨页就变成另一个东西 | 无编号时直接用 `tier taxonomy`、「同一变更交付代码与文档」等机制说法 |

判据：**退役词不能在正文里解释机制，只能在「不要写成」那一栏出现。**

## 二、本地装置登记

带「★」的是本卷的编排或指标，不是 DSH 的类型、字段或官方命名。它们可以出现，但必须自报家门，且不能替代 [`GLOSSARY`](./GLOSSARY.md) 里的 repo 词。

| 装置 | 英文锚点 | 它对应的 repo 机制 | 使用边界 |
|---|---|---|---|
| ★ 参与阶梯 L0–L3 | participation ladder | 调配置 → patch → 挂包 → 写胶水；四者都是既有扩展点 | 非官方分级，跨页引用要带这句 |
| ★ 七层证据形态 | test tiers | `docs/testing.md` 的 required tier 与各级检查 | 层数本身是本卷编排 |
| ★ 可替换率 | replaceability rate | `docs/capability-seams.md` 的 implementations 与 direct consumers 两列 | 指标是本卷的，字段是 repo 的 |
| ★ 供给侧／需求侧 | Service Providers / Consumers | 同上两列 | 写「Provider 数」「Consumer 数」时用 repo 字段名 |
| ★ 饱和区／缺口区 | saturated / gap | 无；由上面两列的读数划分 | 是读数结论，不是机制名 |
| ★ 三把尺子 | 无 | 谁决定下一步／承诺深度／选择住在哪 | 本卷分析词；repo 无对应字段，不得写成「DSH 的」 |
| ★ 6+2 平面 | data planes | bundle patch、package、workspace、`$DSH_HOME`、session log、`ctx.storageDomain`、cache、credentials | repo 的 `plane` 只用于 command plane；首现要带机制清单 |
| ★ 数据卡 | data card | 无；十格记录 owner、authority、path、scope/key 等 | 模板名，不是 DSH 类型 |
| ★ 存储通道（五类） | storage channel | files、session log、storage domain、derived、client state | 分类是本卷的；每个格子里的机制名是 repo 的 |

## 三、登记规则

1. **先登记，后使用**。没登记就出现在正文里的装置，被视为造词。
2. **不得与 repo 词撞车**。反例：把「谁决定下一步」叫「循环」，会和 `agent loop` 混在一起；把安装期拒绝叫「gate」，会和 `quality gate` 混在一起。
3. **不得冒充定义**。装置可以说「本篇把它分成三层」，不能说「DSH 的三层是……」。
4. **不登记编号式编排**。像「三棵树」「四仓」「六步」这类，只要首次出现处说明是本文的组织方式即可。

## 四、怎么判断一个词该不该退役

问三个问题，有一个答「是」就该退役或登记：

1. 它能被误当成 DSH 的类型、字段、命令或官方命名吗？
2. 它在两页里指的不是同一件事吗？
3. 删掉它以后，那句话的意思变模糊了吗？（不变 → 它只是修辞，不必留）
