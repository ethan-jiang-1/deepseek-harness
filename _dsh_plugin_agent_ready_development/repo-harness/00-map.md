# 卷一 · 通用 Agent-Friendly Repo 工程学（Development Harness）

## 定位

本卷面向**任意编程语言与技术栈**的软件团队、架构师与技术负责人，系统回答一个核心问题：**当写代码、补测试、修报错的主力变成 coding agent，人类退居方向盘时，一座代码仓库在结构上到底该怎么设计，才能让零历史进场的 agent 读得准、改得对、不把代码库写腐化？**

阅读本卷**不需要写一行 DSH 插件代码**。DeepSeek Harness（DSH）在这里扮演的角色是经过高强度自举验证的工业级解剖标本：每一章都先拆解 DSH 主仓的真实机制与一手源码证据，再剥离框架耦合，提炼出可直接迁移到 Python、Go、Rust、Java 或 TypeScript 仓库的通用结构模式与落地模板。如果你需要开发独立的 DSH 插件仓库，请直接前往专门服务插件工程实战的 [卷二：DSH 插件仓库开发与专属 Harness](../native-development-model/00-map.md)；需要查阅 DSH 主仓某条流程的精确条款与例外时，按需查阅 [卷三：SDLC Reference](../sdlc-reference/00-map.md)。

## 主入口

从 [`00-index.md`](./00-index.md) 进入，可按 `01` 至 `11` 顺序通读，也可按痛点直接跳读对应专章。

## 直接内容

| 路径 | 职责 |
|---|---|
| [`01-follow-a-fresh-agent.md`](./01-follow-a-fresh-agent.md) 至 [`11-spec-drift-and-decision-metabolism.md`](./11-spec-drift-and-decision-metabolism.md) | 覆盖零历史参与回路、知识归属与双轨索引、任务级 Skills、爆炸半径阶梯、八类反劣化门禁、动态可检查四面镜、机器盲区与成本、仓库分类学与代码契约、可扩展平台生态可读性、通用新仓蓝图与四件套模板，以及长周期防规格漂移与决策新陈代谢 |
| [`figures/`](./figures/00-index.md) | 只服务本卷正文的 11 张架构与机制 SVG 图示 |
