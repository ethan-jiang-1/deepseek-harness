# vendor 本地修改：产品踩在哪些补丁上

源码核验入口：[`vendor/README.md`](../../vendor/README.md)「Local modifications」及其列出的 vendored 文件。上游同步必须逐条重放或退役；本篇只解释 dsh 组合模型直接依赖的修改。

这些修改支撑 profile 叠层、dump 保真和热更新失败回滚。

## 先登记 effect wrapper，再跑 setup

`Fiber.effect()`（`vendor/cordis/src/fiber.ts`）把 wrapper 推进 `_disposables` **之后**才 `_execute(runner)`。

setup 期间插件会再 `ctx.on` / `ctx.effect`。若此时有人开始卸（配置失败、父 fiber 卸、HMR），卸载快照必须已经包含这条正在 setup 的 effect，才能等到 setup 结束并把已经收集的 disposer 跑掉。

`state === UNLOADING` 时拒绝新 effect（`INACTIVE_EFFECT`）。`PENDING` / `LOADING` 仍允许：等 inject 的时候登记东西是合法的。

公开 disposer 单次；`effectInertia` 让外层能 join 已经开始的清理。HMR 和 Loader 事务回滚都假设「卸一条 fiber = 等到它的 effect 树安静」。

## Loader / Include 事务

清单第 8 条：改名的 entry 先 import 再 dispose；候选失败则恢复上一份插件或 config。Include 先在脱离的候选上读、校验、apply patch，调和成功才提交缓存内容。

产品侧的对应物：用户 `cordis.patch.yml` 写坏时，**上一棵好树继续跑**，HMR 发 `hmr/config-update-failed`。这不是「宽容配置」，是事务失败不提交。

## `applyEntryPatches` 导出 + insert 索引

清单第 11 条。两件产品合同：

1. dump-config **必须**调用 Include 自己的函数，禁止再写一份 YAML patch。
2. 同列表里后出现的 patch 必须能改到前面 insert 的行。见 [`03-loader-include-与js插值.md`](./03-loader-include-与js插值.md)。

`!!js` 方言作为 `entryListSchema` 一并导出，dump 才能把表达式原样打出来而不是先求值。

## Include 串行队列 + HMR `ignoreInitial`

清单第 12 条。首次 apply 和 watcher 的 initial `add` 若并行，会在同一组 entry 上交错 create 与 rollback，Include fiber 卸不完。队列把所有子树变异串起来；主 watcher `ignoreInitial: true`，避免把 boot 刚读过的文件再宣布一遍。`registerConfig()` 自己的 watcher 仍 `ignoreInitial: false`，因为登记时已经在磁盘上的用户 patch 必须 apply 一次。

## 惰性 `internal/config`

清单第 15 条（移植 cordis#41）。fiber 保留原始 config，inject 激活后才通过 `internal/config` 插值。provider 替换会按新 ctx 再求。Include/Group 声明 `EntryGroup.key`，自己的列表保持字面量。

没有这条，`!!js` 会在错误的 ctx 上、在依赖还没 provide 时求值，或者把嵌套行的表达式提前吃掉。

## `disabled: !!js` 每次判定

清单第 18 条。`disabled` 是唯一插值的 metadata。原始节点留在 options，写回仍是 `!!js`。

## vendor 4.0.2：Loader `fromInternal` 改进

vendor 4.0.2 = 本地修改 + 纯版本 bump，两笔独立改动：行为修改是清单第 19 条——`vendor/loader/src/internal.ts` 的 Node 原生加载器探测（PR #3311，675efe73f2 `fix: node 24.9 internal issue`，diff +20/-8）；#3318（release/vendor-4.0.2）只把九个 vendored `package.json` 的版本号 bump，vendor 源码与 manifest SHA 未动。

- **Node 原生加载器探测不再依赖版本号**：旧实现根据 `process.versions.node` 的 major version 判断加载器 API 版本（`major>=24 → v2`、`major>=22 → v1`），这对 `24.0~24.11.1` 误判——它们属于 `>=24` 的 major 值但实际是 v1 API。新实现改为检查加载器拥有的 API 方法（`getOrCreateModuleJob` → v2、`getModuleJobForImport` → v1），不存在则返回 `undefined`。上游 4.0.2 的判断本身仍是版本号——探测改进是本地修改，不是上游行为。
- 包版本号 bump（#3318）：`cordis` 4.0.1→4.0.2、`cosmokit` 1.8.2→1.8.3、`group` 1.0.1→1.0.2、`hmr` 1.0.16→1.0.17、`include` 1.0.6→1.0.7、`loader` 1.0.2→1.0.3、`logger-console` 1.0.1→1.0.2、`schemastery` 3.18.1→3.18.2、`timer` 1.1.3→1.1.4。不影响行为。

跨度 0006（`a66e470204` → `183f08e9c6`，即 `dsh-v0.1.5-rc.1`）内 `vendor/` **零改动**：`git diff a66e470204..183f08e9c6 -- vendor/` 输出为空，九个 vendored 包的版本与上列 19 条本地修改逐条原样保留。下一次上游同步不必从本页重放任何条目，只需按下面那条双核对规则确认版本列。

这项修改支撑 Node 24.x 范围兼容性。另提醒：[`vendor/README.md`](../../vendor/README.md) manifest 的版本列（`4.0.0-rc.7` / `1.0.0-rc.5` / `1.0.0` / `3.18.0` / `1.1.2`）自初始导入后未与各 `vendor/*/package.json`（`4.0.2` / `1.0.3` / `1.0.2` / `3.18.2` / `1.1.4`）同步，后续 vendor 同步应以 package.json + manifest SHA 双核对，README 版本列不作权威。

## 上游同步要求

上游合入等价行为时，退役 [`vendor/README.md`](../../vendor/README.md) 中对应的本地修改，并同步更新本页的产品依赖。产品包不得绕过这些修改另写一套 Cordis 生命周期。
