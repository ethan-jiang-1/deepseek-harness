# 插件系统 · 三个轴

## 一句话

这里是「插件」这件事本身，分三个轴——**有什么**（inventory）、**怎么变成活树**（composition）、**怎么走完一生**（lifecycle）。三个轴各自独立成篇，共用这个父目录：每个子目录有自己的 `00-map.md`、自己的正文与图，父目录只负责让读者的一个问题能在同一个地方走完。

## 三个轴

| 轴 | 回答的问题 | 入口 | 什么时候读 |
|---|---|---|---|
| **composition** | 一份 profile 怎么叠成运行中的插件树；dump 保真、HMR、启动窗口、首屏交接 | [`composition/00-map.md`](./composition/00-map.md) | 要改启动行为、要理解「装了为什么没生效」 |
| **lifecycle** | 一个插件从打包到卸载要走哪几段，每段结尾什么不可逆 | [`lifecycle/00-map.md`](./lifecycle/00-map.md) | 要发布、安装、升级、卸载一个插件 |
| **inventory** | 现成给了哪些包、服务与工具——能力在哪、以什么形态给、怎么拿（数量以 inventory 页为准） | [`inventory/00-map.md`](./inventory/00-map.md) | 动手写之前先查有没有现货 |

## 为什么放在一个目录

真实的问题经常跨轴：先查货架有没有现成的（inventory），再决定怎么交付（lifecycle），最后调启动与首屏（composition）。三个轴放在一起，读者不必在专题之间跳来跳去找上下文。

## 阅读顺序

| 你的处境 | 顺序 |
|---|---|
| 第一次接触 DSH 的插件机制 | composition → lifecycle → inventory |
| 我要交付一个插件 | lifecycle（打包 → 安装 → 更新 → 卸载）→ inventory（能不能复用） |
| 我的插件装了但没生效 | lifecycle 的定位表 → composition 的准入与窗口 |
| 我要改启动/首屏行为 | composition 的 05 章（启动窗口与首屏交接） |

## 另见：插件怎么对外暴露（不属于三轴）

三个轴讲的是**插件本身**；另有一个面讲**插件对外露出什么**——它贡献给浏览器 UI 的东西、以及它在 wire 上提供的服务。这一面已独立成 [`../two-tree-runtime/`](../two-tree-runtime/00-map.md)：

| 目录 | 讲什么 | 为什么不算进三轴 |
|---|---|---|
| [`client/`](../two-tree-runtime/client/00-map.md) | 浏览器那棵树的运行时与插件纪律 | 是另一棵树的运行时本体，不是 Host 插件的产物 |
| [`remote/`](../two-tree-runtime/remote/00-map.md) | 一个 `@Remote` 声明怎么变成类型化 stub，以及两棵树之间的流 | 讲的是服务如何跨进程暴露，不是插件如何被组装 |

交付这类插件时的打包与安装顺序仍走 [`lifecycle/`](./lifecycle/00-map.md)；本目录只管「怎么组装成树」。

## 三条不变量（三轴共同的底层判断）

三个轴看似分开，但都由同样三条判断支撑。它们解释「为什么必须这么设计」，也是新插件落地时最容易违反的三处：

| 不变量 | 含义 | 违反了会怎样 | 证据 |
|---|---|---|---|
| **组成是算出来的** | 没有一份「最终 cordis.yml」；根配置每次重写成 `[]`，树由层叠计算得出 | 手改根文件或假设某处有一份完整清单，下次启动被覆盖 | [`composition/05`](./composition/05-启动窗口与首屏交接.md) 的叠层三事实 |
| **准入只在宿主拥有的边界上发生** | 版本门在写依赖前拒绝、行级准入在挂树前拒绝、卸载只回收代码 | 期望运行时兜底；或以为卸载会清数据 | [`lifecycle/03`](./lifecycle/03-安装.md) · [`lifecycle/04`](./lifecycle/04-启动.md) · [`lifecycle/07`](./lifecycle/07-卸载与数据留存.md) |
| **一次性由数据担保，不由生命周期担保** | fiber 会因依赖变化反复重进，所以「首启」只能靠可判定的持久凭据 | 用内存变量或 fiber 首次加载当「首启」，重载即重跑 | [`lifecycle/08`](./lifecycle/08-首启与产品初始化.md) |

这三条也是判断「一个新机制该不该加」的尺子：如果需要宿主记住「跑过了」，那多半该记在数据里；如果它依赖某棵树永远不变，那多半会被下一次重组打破。

## 边界

| 问题 | 去哪 |
|---|---|
| 人怎么进来（CLI / Web / 桌面 / ACP / SDK） | [`../surfaces-entrypoints/00-map.md`](../surfaces-entrypoints/00-map.md) |
| fiber 状态机、effect 撤销、事件派发 | [`../two-tree-runtime/framework/00-map.md`](../two-tree-runtime/framework/00-map.md) |
| 同一能力换实现（seam 三角色） | [`../capability-seams/00-map.md`](../capability-seams/00-map.md) |
| 模型每一步看见什么 | [`../tools-prompt-llm/00-map.md`](../tools-prompt-llm/00-map.md) |
| 每种官方启动方式带了哪些插件 | [`../runtime-profiles/00-map.md`](../runtime-profiles/00-map.md) |

## 维护

三个子目录各自维护自己的 `00-map.md` 与图；`_coverage` 由 `catalog.json` 生成；本页只维护跨轴的三件事：阅读顺序、边界表、以及新增对外暴露面时的登记。校验统一跑：

```sh
node _digested/verify.mjs
```

> 承重词按 [`canon/GLOSSARY.md`](../canon/GLOSSARY.md) 的 DSH 原文用；本页自己的分类与指标不是 DSH 的词。
