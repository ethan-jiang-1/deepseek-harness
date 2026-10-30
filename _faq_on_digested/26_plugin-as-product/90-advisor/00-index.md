# 90 · 动手：把结论落到插件

## 这一篇回答什么

如果你已经读完结论，要开始写插件——尤其**这个插件就是整个应用**——从这里开始。10–33 与 40 是词汇、地图与证据；这一层是施工图：先问什么、按什么顺序做、做完检查什么。

## 两条施工路线

| 你在做什么 | 路线 | 时间 |
|---|---|---|
| **普通插件**（装在别人的 DSH 里，加一个能力） | [91 决策程序](./91-checklist.md)（十八问 + 数据卡）→ [92 路线表](./92-native-reference-architectures.md) 找最接近的 archetype → **另读** [10](../10-foundations/10-taxonomy.md)/[11](../10-foundations/11-five-homes.md)/[12](../10-foundations/12-state-homes.md)/[13](../10-foundations/13-scope-and-keys.md) 选家与键（90 本身不含这些细节） | 半天 |
| **应用型插件**（这个 DSH 就是你的产品） | 本节"应用七问" → [91 六问](./91-checklist.md) → [92](./92-native-reference-architectures.md) → [18 安装升级](../10-foundations/18-install-upgrade.md) 收尾 | 1–2 天 |

**应用型插件的完整走法**见 [93 端到端例子](./93-app-plugin-walkthrough.md)：从 profile 到 workspace 根、配置、账本、启动、安装、卸载，一步不落。

**普通插件的最小阅读集**：91 + 10 §3/§4 + 15 + 18；11/12/13 按需补。90 本身不含家与键的细节，路线里已标“另读”。

## 应用插件七问

按顺序回答，答不出就先别写代码：

1. **这个 DSH 为什么存在？** 一句话说清"用户打开它要完成什么"。这是 P5 承诺（[10 §1](../10-foundations/10-taxonomy.md)）。
2. **模型要不要直接读写项目文件？** 不要 → 架构 I（工具中介）；要 → 架构 II（workspace 化），会话 cwd 必须落在项目里。见 [17 工具面](../10-foundations/17-config-layers.md)。
3. **根从哪来、没有怎么办？** `configured` / `adopted` / `default` / `unresolved` 四状态；弹窗在客户端连上之后。**只有产品使用 DSH 侧栏时**才登记占位，架构 I 不登记。见 [16](../10-foundations/16-startup-resolution.md)。
4. **哪些配置是安装参数、哪些是运行时选择？** 安装参数进 profile patch；运行时选择进全局设置文件；不要 volatile 一个"全局"字段。见 [17](../10-foundations/17-config-layers.md)。
5. **账本里哪些可重建、哪些不可重建？** 索引可删；绑定、游标、已采纳标记要单独文件、单独迁移。见 [15](../10-foundations/15-four-spaces.md)。
6. **怎么装、怎么升、怎么卸？** bundle 成员变化要重启；升级分组合/配置/数据三层；卸载写清四处残留。见 [18](../10-foundations/18-install-upgrade.md)。
7. **用户凭什么信任你？** 少存、秘密只存引用、卸载说明、失败可见。见 [91 反模式](./91-checklist.md)。

> **三份清单的分工**：本节的七问是**决策顺序**（先想）；[91](./91-checklist.md) 的十八问 + 六个工程问题是**检查清单**（照做）；[00-answer](../00-answer.md) 的六问是**叙事版数据卡**（理解）。

## 七步施工顺序

| # | 步骤 | 产出 | 去哪读 |
|---|---|---|---|
| 1 | 定位与承诺 | 一句话 + P0–P5 主承诺 | [10 §1](../10-foundations/10-taxonomy.md) |
| 2 | 选架构 | 工具中介 / workspace 化 / 混合 | [17](../10-foundations/17-config-layers.md) / [92](./92-native-reference-architectures.md) |
| 3 | 定根与启动 | 四状态与占位方案 | [16](../10-foundations/16-startup-resolution.md) |
| 4 | 定配置 | 五层归属 + 字段级二选一 | [17](../10-foundations/17-config-layers.md) |
| 5 | 定账本 | 索引/状态二分 + 键 | [15](../10-foundations/15-four-spaces.md) / [13](../10-foundations/13-scope-and-keys.md) |
| 6 | 选路线 | 最接近的 archetype 路线 | [92 路线表](./92-native-reference-architectures.md) |
| 7 | 收尾 | 数据卡、安装/升级/卸载、测试清单 | [91](./91-checklist.md) / [18](../10-foundations/18-install-upgrade.md) |

> **七步不含客户端插件**：要让用户首启选目录，还要加一个客户端插件 + 两个 Remote（`status`/`adopt`），见 [16 形态 A](../10-foundations/16-startup-resolution.md)。没有它就走 `default` 降级。

## 一页判断

```text
这个 DSH 由我的插件决定吗？
├─ 否 → 普通插件：承诺 → 家 → 键（91 十八问）
└─ 是 → 应用插件
   ├─ 模型只调我的工具吗？
   │  ├─ 是 → 架构 I：项目不必是 workspace；根可任意；沙箱是背景
   │  └─ 否 → 架构 II：会话 cwd 必须落在项目里；沙箱决定一切
   ├─ 根从哪来？ configured / adopted / default / unresolved
   ├─ 配置：安装参数进 profile；运行时选择进全局设置文件
   └─ 收尾：账本二分、卸载四处、数据卡
```

## 五个常见半成品

1. **只做了工具，没做根**：用户不知道项目从哪来，每次都要手选。
2. **根写死在 patch**：换一台机器就失效；没有 `default` 兜底。
3. **账本放进 workspace**：模型（或用户）能改写你的注册表。
4. **配置全做成 volatile**：换 profile 就分裂，"全局"名不副实。
5. **卸载没写**：workspace 登记、`dataRoot`、目录内文件、profile 行四处残留。

## 动手时只需要记住三句

- **先问工具面，再问存哪。**
- **账本里分两类：可重建的索引，不可重建的状态。**
- **安装、升级、卸载是数据设计的一部分，不是发布后补。**

## 一页施工卡

动手时逐项打勾；任何一项答不出，先回对应章节：

- [ ] 一句话定位（P5）：用户打开它要完成什么
- [ ] 选架构：工具中介 / workspace 化 / 混合
- [ ] 根的四状态与占位方案
- [ ] 配置分层：安装参数进 profile，运行时选择进全局设置文件
- [ ] 账本二分：索引（可重建）/ 状态（不可重建），键用路径哈希
- [ ] 数据卡：每块事实一行（承诺 / 空间 / 位置 / 键 / 谁删 / 换机器）
- [ ] 安装：bundle 顺序、`engines.dsh`、重启边界
- [ ] 升级：组合 / 配置 / 数据三层
- [ ] 卸载：workspace 登记、`dataRoot`、目录内文件、profile 行
- [ ] 秘密：只存引用
- [ ] 测试：冷启动四状态、未挂载卷、双 profile、整对象替换、升级、卸载

## 边界

- 本篇是施工顺序与检查表，不重复概念定义；定义见 [10](../10-foundations/10-taxonomy.md)。
- 具体 API 以当前 docs/源码为准；标记规则见 [40-evidence](../40-evidence/00-index.md)。
