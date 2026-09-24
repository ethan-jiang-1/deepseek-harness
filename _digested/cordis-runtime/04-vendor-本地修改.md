# vendor 本地修改：产品踩在哪些补丁上

源码核验入口：[`vendor/README.md`](../../vendor/README.md)「Local modifications」（现 **22** 条编号条目）及其列出的 vendored 文件。上游同步必须逐条重放或退役；本篇只解释 dsh 组合模型直接依赖的修改。

这些修改支撑 profile 叠层、dump 保真、profile patch 热更新与 volatile 配置。

## 先登记 effect wrapper，再跑 setup

`Fiber.effect()`（`vendor/cordis/src/fiber.ts`）把 wrapper 推进 `_disposables` **之后**才 `_execute(runner)`。

setup 期间插件会再 `ctx.on` / `ctx.effect`。若此时有人开始卸（配置失败、父 fiber 卸、HMR），卸载快照必须已经包含这条正在 setup 的 effect，才能等到 setup 结束并把已经收集的 disposer 跑掉。

`state === UNLOADING` 时拒绝新 effect（`INACTIVE_EFFECT`）。`PENDING` / `LOADING` 仍允许：等 inject 的时候登记东西是合法的。

公开 disposer 单次；`effectInertia` 让外层能 join 已经开始的清理。HMR 与 Loader 的替换路径都假设「卸一条 fiber = 等到它的 effect 树安静」。

## Loader / Include：**非事务**的文件刷新与 patch 重放

清单第 8 条（0.1.7 线重写）：Include 校验顶层 entry 数组后才缓存解析内容、记录刷新失败、文件或 Include config 变更后重放 patch、veto restart 时更新 Include config、仅 ENOENT 后才用 `initial`。这些解析保护让坏文件**保住正在跑的树**；但同一行明写：**Loader 的 entry/group/tree 变更走钉死的 eager、非事务实现，不恢复先前的插件或 options，插件激活失败可能留下部分应用的树**。~~旧第 8 条的「Include 事务：候选失败恢复上一份插件或 config、改名 entry 先 import 再 dispose」~~（0.1.7 线随事务性重载退役退役——commit `e07f41d5fd` 回滚事务重载、`2abb542a22` 适配非事务 Loader，note `2026-09-09-nontransactional-loader.md`；编号已被现第 8 条复用）。

产品侧的对应物：用户 `cordis.patch.yml` 写坏时，解析保护保住树；`hmr` 插件的 `reconcileProfilePatches` 只对**本次新引入**的失活抛错（见 [`../composition/03-user-patch-hmr.md`](../composition/03-user-patch-hmr.md)），但这个「事务」是 hmr/app-boot 层的组合语义，不是 vendor Include 内置的回滚。

## `applyEntryPatches` 导出 + insert 索引

清单第 11 条。两件产品合同：

1. dump-config **必须**调用 Include 自己的函数，禁止再写一份 YAML patch。
2. 同列表里后出现的 patch 必须能改到前面 insert 的行（applyEntryPatches 逐行索引 insert）。见 [`03-loader-include-与js插值.md`](./03-loader-include-与js插值.md)。

`!!js` 方言作为 `entryListSchema` 一并导出，dump 才能把表达式原样打出来而不是先求值。

## watcher 就绪与 `ignoreInitial` 分工

清单第 9 条（原队列条目的现位置）：主 watcher `ignoreInitial: true`，避免把 boot 刚读过的文件再宣布一遍；watch base 先 realpath、框架模块先分类挂监听再报就绪、config 路径按 canonical 与配置两种拼写比对（Windows 短名与别名下保住模块缓存身份）。**profile patch 的精确监视归产品侧 `packages/boot/hmr/src/watch-config.ts`**（其自身 `ignoreInitial: false`——登记时已在磁盘的用户 patch 要 apply 一次）。~~旧「Include 串行队列（applyQueue）」条目~~：include 源里已无该队列（仅剩持久化写队列 `writeQueue`），旧编号内容不复存在。

## 持久化防抖写（第 14 条）

Include 的配置文件写串行化并跟踪：瞬时 `EACCES`/`EBUSY`/`EPERM` rename 失败有界退避重试、异步 timer rejection 被观察、teardown 前后 drain；终态写失败保留在队列、`Include.stop()` 重抛而不是谎报持久化完成。Windows 上 child dispose 后目的地句柄短暂滞留的场景就是这条修的。

## 惰性 `internal/config`

清单第 15 条（移植 cordis#41）。fiber 保留原始 config，inject 激活后才通过 `internal/config` 插值。provider 替换会按新 ctx 再求。Include/Group 声明 `EntryGroup.key`，自己的列表保持字面量。

没有这条，`!!js` 会在错误的 ctx 上、在依赖还没 provide 时求值，或者把嵌套行的表达式提前吃掉。

## `disabled: !!js` 每次判定

清单第 18 条。`disabled` 是唯一插值的 metadata。原始节点留在 options，写回仍是 `!!js`。

## vendor 4.0.4：版本与 0008 跨度的真实变化

`vendor/cordis` 现为 **4.0.4**；各包发布版本（`vendor/*/package.json`）：cordis 4.0.4、loader 1.0.5、include 1.0.9、group 1.0.4、timer 1.1.6、hmr 1.0.19、logger-console 1.0.4、schemastery 3.18.4、cosmokit 1.8.5。版本史：4.0.2 → 4.0.3（`efa63a7fc4`，纯 bump）→ 4.0.4（`d0dca04e22`，纯 bump）；**0008 跨度内 vendor 源码的实质变化是本地修改新增的 #16 / #20 / #21 / #22 与第 8/9/12 条的重写**，不是上游版本带来的。

- **#16**：`cordis/package.json` 把 `src` 加进 `files`（cordis 声明 `"./src/*"` exports，tarball 缺 src 会发布指空文件的 export map；release 变更判定也读 `files`）。
- **#20**：`loader/src/config/entry.ts` fiber identity——保存 registry 结果 context 里的原始 fiber 而不是 PromiseLike 包装，配置更新与服务通知因此改同一份生命周期状态，同时更新 provider 与 consumer 不会把 consumer 钉在 `PENDING`。
- **#21**：`cordis/src/logger.ts` exporter disposal——每个 disposer 持有自己的注册 id，移除早先的 exporter 不会删掉后来的 console / telemetry exporter。
- **#22**：volatile config（cosmokit + schemastery + cordis + loader 四处）：cosmokit 提供不可变引用与框架代持的 commit（`deepEqual` 把两个引用视为相等、数组逐位比较、URL 按 href 归一）；schemastery 增加 `.volatile()`、默认值/可选推断、引用感知 simplify；loader 的 `Entry.update` 对 active fiber 上的纯 volatile 变更走 `equalExceptVolatile`（`config/diff.ts`）+ `Entry._commitVolatile` 重解析并发出实例本地的 `loader/volatile-update`（`loader/src/index.ts` 声明），普通值变化仍走普通 remount。

**上游同步要求随 0008 改写**：~~0006 跨度「vendor 零改动、无需重放」的结论~~已被本跨度推翻——`git diff fb2c4b9e69..46a7f68b09 -- vendor/` 大量命中（事务重载退役 + 新增四条），下一次同步**必须**按 22 条清单逐条重放或退役，并按下面那条双核对规则确认版本列。

版本核对提醒仍然成立：[`vendor/README.md`](../../vendor/README.md) manifest 的版本列（`4.0.0-rc.7` / `1.0.0-rc.5` / `1.0.0` / `3.18.0` / `1.1.2`）与各 `vendor/*/package.json`（`4.0.4` / `1.0.5` / `1.0.9` / `3.18.4` / `1.1.6`）**按设计就不同**：manifest 那一列记录的是 pinned 上游快照版本，`package.json` 的 `version` 是本仓的发布版本（`docs/rescope.md:25`；`scripts/release/families.ts` 的 vendor family 只 bump `vendor/*/package.json`）。不要把两列不一致读成漏同步。

## 上游同步要求

上游合入等价行为时，退役 [`vendor/README.md`](../../vendor/README.md) 中对应的本地修改，并同步更新本页的产品依赖。产品包不得绕过这些修改另写一套 Cordis 生命周期。
