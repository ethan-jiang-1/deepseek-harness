# vendor 本地修改：产品踩在哪些补丁上

> 基线 `47f943859bef60e4160492346772ded9b24f765a`。权威清单是 [`vendor/README.md`](../../vendor/README.md)「Local modifications」，同步上游时必须逐条重放或退役。这里不抄清单，只解释 **dsh 组合模型真正依赖的几条**。

介绍篇把本地修改画成中间那一栏。这篇说明：没有它们，profile 叠层、dump 保真、热更新失败回滚会直接坏掉。

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

## 同步时怎么对待这篇

上游若合入了等价行为，退役对应清单条目，并改这篇的「产品依赖」段落。不要在产品包里绕过这些补丁另写生命周期——那是在复制一份会漂的 Cordis。
