# Cordis runtime 地图

## 一句话定位

Harness 把 Cordis 源码 vendor 进 `vendor/`，rescoped 成 `@deepseek-ai/cordis`，再在上面长产品。消化 dsh 之前，必须能分清三件事：上游 Cordis 原语、本仓库记在 `vendor/README.md` 的本地修改、产品插件如何使用这些原语。

## 这一层回答什么

- 一个 plugin 是怎样挂到 `ctx` 上的（function plugin vs `Service` 子类）。
- 注册为什么必须是可逆 effect（`ctx.effect()` / `ctx.on()`）。
- `emit` / `waterfall` / `parallel` / `serial` 各自的合同。
- Loader / Include 如何把 YAML entry 变成 fiber 树，`!!js` 在哪一层求值。
- 本仓库相对上游 Cordis 改了什么——那些改动是产品能 boot 的前提，不是无关洁癖。

## 源码入口

| 路径 | 角色 |
|------|------|
| `vendor/cordis/` | `@deepseek-ai/cordis`，Context / Fiber / Service / Events |
| `vendor/loader/` | Cordis Loader |
| `vendor/include/` | `cordis:include`，patch 算法（含导出的 `applyEntryPatches`） |
| `vendor/group/` | `cordis:group`，`isolate` realm |
| `vendor/hmr/` | 配置与模块热更新 |
| [`vendor/README.md`](../../vendor/README.md) | 钉住的 upstream SHA、本地修改清单、同步步骤 |
| [`docs/cordis-primer.md`](../../docs/cordis-primer.md) | 产品侧对作者的五条思想 |
| [`docs/cordis-tutorial/`](../../docs/cordis-tutorial/index.md) | 同一套思想的动手教程 |

官方 primer 已经够用来写插件。本专题要消化的是：**vendor 树的真实代码 + 本地修改为什么存在**。不要在这里重写 primer。

## 计划中的章节（待消化）

| 文件 | 打算回答 |
|------|----------|
| `01-五条原语对照源码.md` | plugin / ctx / inject / events / effects 对到 `vendor/cordis/src/` 的类型与方法 |
| `02-waterfall-与事件合同.md` | `next()` 语义、`@mode`、declaration merging |
| `03-loader-include-patch.md` | entry、`!!js`、patch 不跨 include 边界 |
| `04-vendor-本地修改.md` | 按 `vendor/README.md` 逐条核验：fiber 卸载、Loader 事务、patch 保真 |

## 阅读时先抓住的边界

- 每个 harness 包把 `@deepseek-ai/cordis` 当 peer。改 vendor 行为等于改整个产品的运行时。
- Include 的 patch 列表是组合的机械核心；`dsh --dump-config` 必须走同一套 `applyEntryPatches`，不能另写一份算法。
- `disabled: !!js` 是目前唯一被插值的 entry 元数据字段。其余 metadata 保持字面量。
