# 卷二导航 · DSH 插件仓库开发与专属 Harness 实战（`02-dsh-plugin-harness`）

## 本卷定位

如果说 [卷一（`01-general-repo-harness/`）](../01-general-repo-harness/00-index.md) 回答的是“任何技术栈的代码库怎样建成对 Coding Agent 友好的仓库”，那么本卷则 **100% 聚焦独立 DeepSeek Harness（DSH）插件仓库的具体工程落地**——把 Cordis 运行时契约、三种标准插件仓拓扑、会话状态存活规律、模型上下文预算以及脱离主仓私有脚本后的插件专属门禁与回放测试一次讲透。

本卷面向正在新建或维护独立 DSH 插件仓的技术负责人与 coding agent。所有 API 名称、配置层序、编译器面规则与生命周期约束均严格锚定 DSH 一手源码、文档与 Skills，既不虚构脚手架命令，也不把 DSH 主仓内部的百包治理流程硬套给外部插件仓。

## 按当前工程任务直接进入

| 你此刻在插件仓遇到的具体问题 | 直达专章与核心交付物 |
|---|---|
| 想先统览插件开发的四层工程结构、研发闭环与六大高频误区 | [`00-index.md`](./00-index.md)：四层架构总表、七步原生交付闭环、证据路由与防踩坑红线 |
| 第 1 天刚建独立插件仓，想在半小时内跑通最小单包 Host Bundle | [`01-new-plugin-repository.md`](./01-new-plugin-repository.md)：单包黄金目录树、三层依赖镜像、Loader 组合测试、打包冒烟与起步 `AGENTS.md` |
| 对 `Fiber`、`PENDING`、`Bundle`、`Profile`、`Preset`、`Oracle` 概念边界拿不准 | [`02-terms-and-mental-models.md`](./02-terms-and-mental-models.md)：运行、分发、变更、验证四大词族详解及 Agent 一行自检法 |
| 插件要读写会话状态，不确定压缩、`resume`/`fork` 后哪些数据还在 | [`03-context-and-drift.md`](./03-context-and-drift.md)：`session log` 投影、`compaction/*` 遮蔽、四类状态存活矩阵与 `SessionEventMap` 扩展义务 |
| 插件需要带 Web 界面槽位（Host+Client），或要拆成多包 Capability Seam | [`04-plugin-repo-topologies.md`](./04-plugin-repo-topologies.md)：单包 / 全栈双树（双 `tsconfig` 编译器面） / 多包接缝三种拓扑与五层配置 `Config.volatile()` |
| 想给仓库里的 Coding Agent 立下绝不写炸 Cordis 生命周期与缓存的硬规矩 | [`05-cordis-contracts-and-model-experience.md`](./05-cordis-contracts-and-model-experience.md)：禁默认导出、禁模块单例、Waterfall `next()`、Quiescent Disposal 与 `Model Experience` 六铁律 |
| 外部插件仓没有主仓内部门禁脚本，怎么搭自己的静态检查、无 Key 回放和 CI | [`06-plugin-gate-and-ci-harness.md`](./06-plugin-gate-and-ci-harness.md)：完整 `verify-plugin.mjs`、防 `PENDING` 竞态测试、`ScriptedLlmAdapter` 无 Key 回放与插件 `ci.yml` |

需要查阅通用仓库级 `AGENTS.md`/ADR 设计思想时，按需对照 [卷一：通用 Agent-Friendly Repo 工程学](../01-general-repo-harness/00-map.md)；需要核实 DSH 主仓某条内部治理或发布规则的原始边界时，按需查阅 [卷三：DSH 主仓研发条款字典](../03-dsh-sdlc-reference/00-map.md)。

## 图文分工

正文承载全部可执行规则、代码模板与边界条件；本卷配套的 11 张 SVG（登记于 [图示清单](./figures/00-index.md)）辅助呈现插件研发闭环、三层分发结构、归属与证据路由、Day-1 建仓步骤、生命周期闭合、交付判断角色、会话上下文分层、三种插件仓拓扑、Cordis 防御契约与四阶验证金字塔。
