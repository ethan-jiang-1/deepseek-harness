# 卷一边界契约 · 通用 Agent-Friendly Repo 工程学（`01-general-repo-harness`）

## 适配场景与读者契约

本卷是整套语料中**完全脱离 DSH 运行时依赖**的通用仓库工程学层，专供使用 **Python、Go、Rust、Java 或 TypeScript** 等任意技术栈的研发负责人、架构师与平台工程师在以下两类场景直接落地：

- **场景 A（从零搭建 AI 原生新仓库）**：主力编码工作即将交给零历史进场的 Coding Agent，人类退居方向盘把控意图与验收，需要在第 1 天立起分层 `AGENTS.md`、任务级 `SKILL.md`、防恶习确定性门禁与人类四道方向控制面（直达 [`10-agent-ready-repo-blueprint.md`](./10-agent-ready-repo-blueprint.md)）。
- **场景 B（不停工改造几万行存量业务老仓）**：代码库已有大量历史坏味道与隐性耦合，一开全局硬门禁就全仓爆红停摆，需要用 **10 项体检打分表**定位出血点，并用**零后门精确指纹单调棘轮（只减不增）**在 4 周内分批止血收口（直达 [`12-brownfield-repo-migration.md`](./12-brownfield-repo-migration.md)）。
- **不适用分流**：如果你正在开发运行在 DSH 宿主上的插件仓库，不需要在本卷找 API——请直接前往 [卷二：独立 DSH 插件仓实战](../02-dsh-plugin-harness/00-map.md)；如果你只想核查 DSH 主仓某条内部 CI 或发版规则的原始条文，直接检索 [卷三：DSH 主仓 SDLC 字典](../03-dsh-sdlc-reference/00-map.md)。

## 准入与禁入边界

为防止随上游版本反复迭代把本卷敲打成“半吊子插件文档”或“四平八稳的管理鸡汤”，本卷执行非黑即白的准入守门规则：

- **必须满足的准入标准（去框架剥离测试）**：每一章先以 DSH 主仓的真实源码、门禁或演化史作工业级解剖标本，但**把所有 DSH 英文引证遮住后，提炼出的目录拓扑、角色命名、门禁算法（如 `ratchet-check.mjs`）与治理动作必须在一座完全没装 Node.js 和 Cordis 的纯 Go / Python 仓库里 100% 成立且可直接执行**；并且必须写明不同团队规模（1–3 人小仓 vs 多团队平台仓）的裁剪边界，明确指出什么规模下强上重机制反而有害。
- **严禁混入本卷的内容（Hard Out-of-Scope）**：
  1. **严禁混入 DSH 插件开发实现细节**：任何只有安装 `@deepseek-ai/*` 才有意义的扩展 API（`defineTool`、`TypertRemoteService`、`presentResult`、`tool.call.toolview`）、打包字段（`dsh.bundle`、`dsh.client`、`window.__ModuleLoader__`）或插件 `PENDING` 排障步骤，一律归属 [卷二（`02-dsh-plugin-harness/`）](../02-dsh-plugin-harness/00-map.md)。
  2. **严禁混入 DSH 主仓专属行政与发布细则**：主仓特有的 `blame` 加权批准积分公式、双语 `.zh.md` 强制配对清单、三条多语言发布序列或 GitHub Project 字段状态机细节，一律归属 [卷三（`03-dsh-sdlc-reference/`）](../03-dsh-sdlc-reference/00-map.md)。
  3. **严禁混入无法证伪的正确废话**：凡是不能落成具体文件路径、词数上限、退出码检查、职责矩阵或明确反例的空泛倡议，一律拒收。

## 随 DSH 版本更迭重锤时的防跑偏三问

后续跟进 DSH 新版本同步并准备修改本卷前，逐条回答以下三问；任一回答为“否”则立即转投卷二/卷三或放弃修改：

1. **跨语言可迁移问**：上游这次变更折射出的是不是一条**跨语言通用的 Agent 防腐化或人机协同规律**（例如新的机械门禁模式、新的决策淘汰机制、新的跨仓契约设计），而不是某个具体 DSH 包的参数调整？
2. **唯一归属问**：这条通用规律在本卷现有的 `01`–`12` 中是否已有唯一精准的归属章（原地更新现行事实），而不是顺手在两章里各塞一半造成多处维护负债？
3. **成本与盲区对称问**：写出这项机制的收益时，是否同时交代了它的**维护成本、适用门槛或机器查不到的语义盲区**，避免诱导外部小团队盲目照搬大仓重武器？

## 主入口与直接内容

面向本卷读者的六个核心问题路由、全卷 12 章导读地图与核心术语表位于 [`00-index.md`](./00-index.md)。

| 路径 | 职责边界 |
|---|---|
| [`00-index.md`](./00-index.md) | 读者实战总入口：传统仓库遇上 Agent 的退化机理、六大正交生存问题路由表与 `01`–`12` 全卷导读 |
| [`01-follow-a-fresh-agent.md`](./01-follow-a-fresh-agent.md) 至 [`09-platform-and-multi-repo-legibility.md`](./09-platform-and-multi-repo-legibility.md)、[`11-spec-drift-and-decision-metabolism.md`](./11-spec-drift-and-decision-metabolism.md) | 通用机制解剖层：零历史六步回路、知识唯一归属与双轨目录、按需 `SKILL.md`、爆炸半径四级阶梯、八类反劣化门禁、动态可检查四面镜、机器六大盲区、仓库分类学与代码契约、多仓平台协同可读性、长周期防规格漂移与决策代谢 |
| [`10-agent-ready-repo-blueprint.md`](./10-agent-ready-repo-blueprint.md)、[`12-brownfield-repo-migration.md`](./12-brownfield-repo-migration.md) | 通用落地手册层：新建空仓四件套起步模板与三级规模裁剪表（`10`）、存量业务老仓 10 项体检打分表与三阶段指纹棘轮改造实战（`12`） |
| [`figures/`](./figures/00-index.md) | 仅服务本卷正文的 12 张通用架构与机制 SVG 图示 |
