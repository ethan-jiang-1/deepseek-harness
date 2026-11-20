# 用户 patch 的 HMR

HMR 让常驻 profile 重读 patch 与 bundle 清单，在同一进程内重新组合 Loader 树。更新按队列串行执行；失败后能否继续使用上一代，取决于是否已开始应用 Include 更新。**串行执行不提供全树事务回滚。**

![配置重载的队列与应用分界](./figures/live-recompose.svg)

## 监视与串行协调

配置监视覆盖 profile 的 `cordis.patch.yml`、home 层同名 patch，以及 profile 的 `package.json`。清单通知只有 bundle 列表变化才触发刷新；patch 通知重读当前输入，并用内容指纹跳过重复输入。删除用户 patch 是合法变化：下一代组合不再包含该层。

`watchConfig` 等待应用 ready，再把刷新放进 `hmr.runExclusive`；配置重载、模块替换和调用方配置写入共用这条队列。`reconcileProfile()` 必须在队列内调用，嵌套 `runExclusive` 会拒绝。单次操作失败不会阻塞后续排队操作；队列不负责撤销已执行的变更。

profile 是否默认启用监视由组合声明决定；一次性入口的限制见[更新与启停](../lifecycle/06-update-and-stop.md#startup-only-面的限制)。

## 重新组合与失败范围

`recomposeProfile` 计算候选解析映射、准备 patch，再更新根 Include。它可能先停止新组合移除的行；HMR 也可能先停止待替换模块的条目。**应用分界在调用 `entry.update` 之前：此时 `applying` 已置为 `true`。** 后续 Loader 更新或激活审计抛错，都不进入恢复旧行的分支。

| 阶段 | 失败或结果 | 运行状态与恢复范围 |
|---|---|---|
| 读取与解析输入 | patch 不合法，候选无法形成 | 尚未应用新 patch 集；现有树继续保留，文件仍需修正。启动时遇到同样错误会阻止启动 |
| Include 更新开始前 | 解析映射发布或 patch 准备失败；映射迁移要求重启 | 不应用候选 patch 集；把预先移除的行按原位置放回，并重启此前停止的条目。恢复自身失败会记录 warning，不能保证实例身份或外部副作用复原 |
| Include 更新开始后 | 更新拒绝、新增或变化条目激活失败、原来运行的条目重启失败 | 报错，但不全局恢复旧 patch 集；已经应用的配置、已停止的旧插件和其他条目的变化可能保留 |
| 激活审计通过 | 没有本次必须拒绝的失败 | 发出 `app-boot/config-reload`，返回现有失活条目的诊断；事件不带配置或 diff |

激活审计会比较更新前后的条目、配置和失败诊断。新引入或变化的失败会拒绝；本次要求启用的条目失活、此前运行的条目替换后失败，也会拒绝。未变化的旧失败返回 warning，由 HMR 记录；单纯等待依赖服务通常也是 warning，除非该条目被明确要求启用。因此，刷新报错不表示树已还原，刷新完成也不表示所有声明行都已 active。

![候选拒绝与应用后失败的不同后果](./figures/last-good-tree.svg)

## Settings 的局部恢复

设置编辑器另外拥有保存失败的处理：写入 profile patch 后，如果协调失败，会尝试恢复旧文件并用旧 patch 集再次协调；恢复动作本身也可能失败。这是该写入入口的局部补救，不能推广为 watcher 重载或插件外部副作用的事务保证。配置保存与继承归[配置与设置面](../lifecycle/09-configuration-and-settings.md)。

## 症状 → 检查位置

| 症状 | 先检查什么 |
|---|---|
| 文件改了但未刷新 | 本 profile 是否挂载 HMR、应用是否 ready、监视路径是否正确；清单仅改依赖不会触发 bundle 刷新 |
| YAML 修正前仍看到旧值 | 读取 / 解析阶段是否拒绝了候选；对照本页失败范围 |
| 刷新报错后部分新值已生效、旧插件不再运行 | 是否已越过 Include 更新分界；检查激活诊断，修正后再次协调，不假定旧树已恢复 |
| 操作排队或写入冲突 | [更新与启停的串行队列与写锁](../lifecycle/06-update-and-stop.md#一条串行队列) |
| 设置保存报错 | [配置与设置面](../lifecycle/09-configuration-and-settings.md)，并检查局部恢复是否也失败 |

## 源码核验入口

| 来源 | 核验内容 |
|---|---|
| [HMR 服务](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/hmr/src/index.ts) | `runExclusive`、`watchConfig`、输入指纹与 `reconcileProfile` |
| [app-boot](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/index.ts) | `recompose` 的应用分界、激活审计与应用前恢复 |
| [配置编辑器](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/config-editor/src/index.ts) | `edit` 的旧文件恢复与再次协调 |
| [队列测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/hmr/tests/coordination.spec.ts) | 串行执行、嵌套拒绝与失败后继续使用 |
| [重载测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/hmr/tests/reconciliation.spec.ts) | 激活失败后的候选配置保留、解析失败与后续修复 |
| [激活审计测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/tests/user-patches.spec.ts) | 未变化旧失败的 warning、变化后的相同失败拒绝 |
