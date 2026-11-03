# 11 · 外部说法的定级与写法

DSH 之外的说法（第三方包、作者声明、社区文章）不是 DSH 的合同。这篇只定一件事：**怎么说它们，才不会被读成 DSH 的机制**。外部事实本身归各专题，不在这里复述。

## 两条已有原文支撑的边界

**它怎么说**：「Application-owned npm projects, such as Electron's reserved Desktop profile, use `loadProfileDirectory` to load an already initialized directory without exposing it through CLI profile lookup.」（[app-boot](../../packages/boot/app-boot/README.md)）

**因此怎么写**：讲哪个应用拥有 profile 时，用 `application-owned` 这个说法和入口名，不要泛化成「应用层」。

**它怎么说**：「A bundle is not a row.」（[app-boot](../../packages/boot/app-boot/README.md)，上下文见 `skippedBundles` 一段）

**因此怎么写**：bundle 与 row 是两个层级；说「装了就有功能」时，要落到 row 是否启用。

## 定级

| 级别 | 是什么 | 能不能推出 DSH 的行为 |
|---|---|---|
| **原文** | `docs/`、包 README、`AGENTS.md`、源码里的句子 | 能；只有这一档能 |
| **译** | 上述英文的中译 | 能，但引用时给原文 |
| **外部** | 第三方 README、作者声明、社区文章 | 不能；只能说明「有人这么说」 |
| **未确认** | 听说过、没核过 | 不能；不能当论据 |

写法：外部材料必须带级别；**不得使用「DSH 的做法是……」这类句式**，除非同时给了原文出处。

## 一个真实的反例

`paved road` 听起来像 DSH 的术语，但 repo 里 grep 不到；DSH 自己的原话是「New behavior attaches to a documented extension point」（[architecture](../../docs/architecture.md)）。

这类错误的共同点：**话是对的，但归属错了**。读者不会去核对，他们会按「DSH 这么设计的」去引用。

## 对策只有一条

凡是加引号的「DSH 原话」，必须能在 repo 里点到。点不到就二选一：

1. 改成「外部生态常说……」，并补一句 DSH 自己的原话；
2. 删掉。

## 边界

- 本篇不评价任何第三方包的质量，也不承诺外部依赖可用。
- 生态样本的逐条证据归 [`../harness-idea/`](../harness-idea/00-map.md) 与各专题；本篇只管称呼与定级。
