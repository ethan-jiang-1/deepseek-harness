# 插件系统 · 三个轴

产品源码基线：`b830ec950faba0a46dda564be3e2d854afed94f1`（`dsh-v0.2.1-rc.5`）。

## 一句话

这里是「插件」这件事本身，分三个轴——**有什么**（inventory）、**怎么变成活树**（composition）、**怎么走完一生**（lifecycle）。三个轴各自独立成篇，共用这个父目录：每个子目录有自己的 `00-map.md`、自己的正文与图，父目录只负责让读者的一个问题能在同一个地方走完。

## 三个轴

| 轴 | 回答的问题 | 入口 | 什么时候读 |
|---|---|---|---|
| **composition** | 一份 profile 怎么叠成运行中的插件树；dump 保真、HMR、启动窗口、首屏交接 | [`composition/00-map.md`](./composition/00-map.md) | 要改启动行为、要理解「装了为什么没生效」 |
| **lifecycle** | 一个插件从打包到卸载要走哪几段，每段结尾什么不可逆 | [`lifecycle/00-map.md`](./lifecycle/00-map.md) | 要发布、安装、升级、卸载一个插件 |
| **inventory** | 现成给了 343 个包、99 个服务、33 个工具包——能力在哪、以什么形态给、怎么拿 | [`inventory/00-map.md`](./inventory/00-map.md) | 动手写之前先查有没有现货 |

## 为什么放在一个目录

真实的问题经常跨轴：先查货架有没有现成的（inventory），再决定怎么交付（lifecycle），最后调启动与首屏（composition）。三个轴放在一起，读者不必在专题之间跳来跳去找上下文。

## 阅读顺序

| 你的处境 | 顺序 |
|---|---|
| 第一次接触 DSH 的插件机制 | composition → lifecycle → inventory |
| 我要交付一个插件 | lifecycle（打包 → 安装 → 更新 → 卸载）→ inventory（能不能复用） |
| 我的插件装了但没生效 | lifecycle 的定位表 → composition 的准入与窗口 |
| 我要改启动/首屏行为 | composition 的 05 章（启动窗口与首屏交接） |

## 边界

| 问题 | 去哪 |
|---|---|
| 人怎么进来（CLI / Web / 桌面 / ACP / SDK） | [`../surfaces-entrypoints/00-map.md`](../surfaces-entrypoints/00-map.md) |
| fiber 状态机、effect 撤销、事件派发 | [`../cordis-runtime/00-map.md`](../cordis-runtime/00-map.md) |
| 同一能力换实现（seam 三角色） | [`../capability-seams/00-map.md`](../capability-seams/00-map.md) |
| 模型每一步看见什么 | [`../tools-prompt-llm/00-map.md`](../tools-prompt-llm/00-map.md) |
| 每种官方启动方式带了哪些插件 | [`../runtime-profiles/00-map.md`](../runtime-profiles/00-map.md) |

## 维护

三个子目录各自维护自己的 `00-map.md`、`_coverage` 行与图；本页只维护跨轴的三件事：阅读顺序、边界表、以及新增子轴时的登记。校验统一跑：

```sh
node _digested/verify.mjs
```
