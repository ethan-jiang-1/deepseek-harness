# 卷二边界契约 · 独立 DSH 插件仓库开发与专属 Harness 实战（`02-dsh-plugin-harness`）

## 适配场景与读者契约

本卷 **100% 聚焦脱离 DSH 主仓之外的独立插件仓库（Standalone / External DSH Plugin Repository）**，直接服务两类实战角色：

- **场景 A（独立插件作者从 Day 1 建仓到全栈交付）**：需要判断某项业务需求该用 `Tool`、`Command`、`Skill`、五层钩子还是 `Slot + Typert @Remote`，并拿走可直接运行的单包 Host 脚手架、外部仓 `tsdown` 浏览器 `lib/client.js` 打包配置、`Volatile<T>` 热设置表单与宿主 12+ 个现成服务注入配方。
- **场景 B（插件仓内的主力 Coding Agent 与排障值班人）**：需要在没有 DSH 主仓私有 `scripts/` 基建的前提下，为插件仓装上自包含双面门禁 `verify-plugin.mjs`、真实 `Loader` `PENDING` 诊断、基于公开 `LlmAdapter` 的无密钥会话回放 CI，并在遇到静默失效或白屏崩溃时按 1 分钟速查表与四大官方 Postmortem 快速止血。
- **不适用分流**：不写 DSH 插件、只想把自家 Python/Go/TS 业务仓改造成 Agent-Friendly Repo 的团队请读 [卷一：通用 Agent-Friendly Repo 工程学](../01-general-repo-harness/00-map.md)；想查 DSH 主仓自身 PR 审批积分、双语文档站点投影或多家族发布管线的读者请查 [卷三：DSH 主仓 SDLC 字典](../03-dsh-sdlc-reference/00-map.md)。

## 准入与禁入边界

独立插件仓最怕两件事：一是文档写得太虚，真上 TypeScript `strict` 编译或 `dsh web` 就报错；二是把主仓养百个包才需要的重型行政规矩硬塞给外部一两个包的小仓库。因此本卷严守以下准入与禁入红线：

- **必须满足的准入标准（公开包边界 + 严格可编译实操测试）**：
  1. 本卷出现的每一个包名、服务键（如 `ctx.fs`、`ctx.workingDirectory`、`ctx.jobs`）、方法签名（如 `createUserMessage`、`ctx.remote.$mount`）、`package.json#dsh` 字段与打包格式（`window.__ModuleLoader__.load`），都必须严格对齐 DSH `master` 公开导出面与真实源码，**严禁凭印象编造便捷伪代码**。
  2. 给出的每一套验证方案（如 `verify-plugin.mjs`、`assertAllEntriesActive`、`ScriptedLlmAdapter`、`ci.yml`）都必须在**完全脱离 DSH 主仓私有内部脚本与无 `DEEPSEEK_API_KEY` 的外部独立仓库**中自包含闭环运行。
- **严禁混入本卷的内容（Hard Out-of-Scope）**：
  1. **严禁把 DSH 主仓内部治理义务强加给外部插件仓**：外部插件仓不需要双语 `.zh.md` 结对门禁、不需要 `blame` 加权批准机器人、不需要多语言三家族发版脚本，也拿不到官方内置 `BUNDLE_PREVIEWS` 清单特权——凡属主仓自治制度一律留在 [卷三](../03-dsh-sdlc-reference/00-map.md)，本卷提到时只能作为“外部仓免抄边界”点明。
  2. **严禁重复长篇讲授跨语言通用理论**：为什么需要 ADR、为什么门禁胜过散文、存量老仓怎么做通用棘轮迁移，全部由 [卷一](../01-general-repo-harness/00-map.md) 独家拥有；本卷只写这些理念落到 **Cordis + DSH 插件生命周期**上的具体形态。
  3. **严禁脱离真实故障模式写四平八稳的注意事项**：每条防坑红线必须绑定具体失败机制（如 `Loader.unwrapExports` 吞掉具名 `inject`、同 `id` 整块覆盖 `config`、未挂载 `./remote` 就顶层注入 `remote.<ns>` 导致死锁 `PENDING`）。

## 随 DSH 版本更迭重锤时的防跑偏三问

每当 DSH 发版或升级破坏性契约（如 `docs/upgrade-guide/` 新增条目、Session 格式升版、客户端加载协议调整）需要更新本卷时，必须先过以下三道筛子：

1. **公开契约真实性问**：上游这次改动是否改变了外部插件实际消费的**公开导出类型、服务签名、`package.json` 约定、配置合成语义或会话事件兼容性**？若是，必须同步更新本卷对应代码模板与 `verify-plugin.mjs` 规则，绝不只改文字不改代码！
2. **仓外自包含问**：更新后的示例代码或测试配方是否不小心引入了对 DSH 主仓未发布内部路径（如主仓根 `scripts/` 或 `packages/*/tests/` 私有夹具）的隐式依赖？
3. **拓扑最小够用问**：新能力是否优先放进了最轻量的适用拓扑（80% 后端扩展走拓扑 A 单包 Host，有专属 Web 视图才升拓扑 B 双树，有多套独立后端实现才升拓扑 C 多包 Seam），有没有误导小插件作者过度拆包？

## 主入口与直接内容

进入本卷干活时，先从 [`00-index.md`](./00-index.md) 查阅**一页式「业务需求 → 扩展原语 → 推荐拓扑 → 最窄必跑证据」选型总表**，再按当前工程任务直取对应专章：

| 路径 | 覆盖的具体插件工程命题与硬交付物 |
|---|---|
| [`00-index.md`](./00-index.md) | 实战选型总入口：七类扩展需求一页路由表、插件四层工程结构、变更面证据路由与六条防翻车底线 |
| [`01-new-plugin-repository.md`](./01-new-plugin-repository.md) | Day-1 单包建仓：黄金目录骨架、`dsh.bundle` vs `dsh.profile`、`prepare` 安全放行边界、Tarball 冒烟链与插件仓起步 `AGENTS.md` |
| [`02-terms-and-mental-models.md`](./02-terms-and-mental-models.md) | 高频易混词对辨析：`根 ctx vs 会话 agent.ctx`、`Tool / Command / Skill`、`presentResult vs presentationMeta`、`Slot vs Typert @Remote`、`Volatile<T>` |
| [`03-context-and-drift.md`](./03-context-and-drift.md) | 会话状态与压缩纪律：`session log` 唯一权威、Compaction 遮蔽重写、`resume`/`fork`/`spawn` 存活矩阵与 `SessionEventMap` 扩展义务 |
| [`04-plugin-repo-topologies.md`](./04-plugin-repo-topologies.md) | 三种拓扑与全栈闭环：单包 Host、Host+Client 双树（外部仓 `tsdown` 产出 `window.__ModuleLoader__.load` `lib/client.js` + `ctx.remote.$mount` 跨端 RPC）、多包 Seam 与 `Volatile<T>` |
| [`05-cordis-contracts-and-model-experience.md`](./05-cordis-contracts-and-model-experience.md) | 运行时防御与注意力预算：导出互斥、零模块单例、Waterfall `next()`、生成器异步排空卸载与工具 `Model Experience` 四铁律 |
| [`06-plugin-gate-and-ci-harness.md`](./06-plugin-gate-and-ci-harness.md) | 自包含门禁与无密钥回放：支持 Host+Client 双面校验的 `verify-plugin.mjs`、`PENDING` 精准诊断、`ScriptedLlmAdapter` 回放测试与 `ci.yml` |
| [`07-extension-recipes-and-host-services.md`](./07-extension-recipes-and-host-services.md) | 宿主服务货架与五大配方：12+ 个官方可注入服务速查表、生产级 `defineTool`（PTC + 双轨卡片 + `ctx.jobs` + V4 `MessageSourceMap`）、五层钩子与斜杠命令 |
| [`08-troubleshooting-and-postmortems.md`](./08-troubleshooting-and-postmortems.md) | 排障手册与真事故防复发：8 大高频症状 1 分钟排障速查表 + DSH 官方 Postmortem `0001`–`0004` 插件视角深度复盘 |
| [`figures/`](./figures/00-index.md) | 仅服务本卷正文的 13 张插件拓扑、生命周期、选型决策树与验证金字塔 SVG 图示 |
