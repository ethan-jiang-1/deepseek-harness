# FAQ 13 · 一个"领域专家"DSH 插件，repo 应该怎样组织？

## 问题

想写一个 DSH 插件，它是一个**领域专家**：有自己的信息处理流（可能多条，入口形态待定），依赖 DSH 的一些能力包（session、tools、subagent、context、web、skill……），上下文/工具/提示词完全自己安排——核心诉求是让这个专家有一个**很好控制的上下文**；另外可能有 UI 表达。希望整个 repo 能**看到 DSH 本身**，这样 coding agent 可以在 repo 内探索 DSH 的文档和源码，找到最合理的实现答案；也希望开发容易、容易插拔、容易调整，整个过程尽量借力 DSH 已有的流程（preset / bundle / patch / 测试门禁），不行再考虑 OpenSpec 这类外部 spec 流程。

这个问题表面在问"目录怎么摆"，实际同时压着五个决策：

1. **入口形态**：专家的"入口"到底是什么？新可执行程序、新 profile、agent preset、还是 bundle + 插件行？
2. **包的粒度**：一个包还是按 Service Definition / Provider / Consumer 拆？什么时候拆？
3. **DSH 源码放哪**：不进 repo、pinned submodule、workspace 链接、还是直接在 DSH monorepo 里长？
4. **UI 表达走哪层**：工具卡的 card render intent + `presentationMeta`，还是 client 侧专门卡片 / View？
5. **spec 流程**：借 DSH 的 docs-as-contract + notes 纪律，还是上 OpenSpec？

## 回答目标

读完本 FAQ，应当能够：

1. 说出 DSH 对上述五个决策各自已经提供了什么正式载体，哪些不需要发明。
2. 对四种 repo 组织方案（独立 repo + pinned DSH / 在 DSH monorepo 内长 / 纯外部依赖 / marketplace 式多专家 monorepo）说出结构、装法、开发环和取舍（插拔/调试/驱动 agent 的共享细节收敛在 dev-loop，方案文件只写形态带来的增量）。
3. 用市场实证（Claude Code plugins、OpenClaw、MCP servers、Cursor plugins、第三方 DSH 插件）为每个方案的取舍背书。
4. 给一条明确的推荐路径和升级触发条件（什么时候从方案 A 升到 B/D、什么时候引入 OpenSpec）。

## 范围与基线：信息来源

本 FAQ 的信息主要有三条来源，各自独立声明新鲜度：

1. **DSH 机制事实（主来源）**：直接核对 DSH 本仓库工作树（当前基线 `dsh-v0.1.7-rc.1`，commit `46a7f68b09…`）的文档与源码，与 FAQ 01/08 同源同基线——00-index 的 pinned-commit 基线管运行时行为结论的新鲜度，本篇的机制表述（profile/patch 层级、preset、卡片层）均在当前工作树逐条对过源码文档（0008 复核时随 preset 重设计改述）；上游合入后按 `_digested/_change_log/` 复核。涉及的机制文档：`docs/architecture.md`（profile / bundle / patch 层级）、`docs/cookbook/extension-cookbook.md`（扩展形态参考与 feature→机制映射，dev-loop 第 0 阶段探索路由的形态入口）、`packages/preset/agent-preset-registry/README.md`（agent preset 声明式注册表、bundle-patch override）、`docs/cookbook/adding-a-tool.md`（卡片渲染意图与 Web 消费边界）、`docs/subsystems/conversation.md`（View 注册通道）、`packages/boot/app-boot/README.md`（Profiles 与 profile 目录）、`docs/cordis-primer.md`（entry `disabled`）、`.agents/notes/README.md` 及其各目录 `AGENTS.md`（Agent Notes 生命周期与格式）、`scripts/agent-note-tree.ts` / `scripts/verify-agent-note-format.ts`（结构与格式门禁）、`docs/postmortem/README.md`（事故层）、`docs/development.md` / `docs/testing.md` / `lefthook.yml` / `.github/ISSUE_TEMPLATE/` / `packages/plan/README.md` / `packages/todo/README.md`（开发流程与协作反馈面，dev-loop 的依据）、`docs/cordis-tutorial/index.md` 与 `docs/user/develop/`（插件作者文档线，dev-loop 第 0 阶段探索路由的作者侧入口）、`packages/README.md`（组、发布期望与依赖方向规则，option-b 落位与 dev-loop 第 3 阶段设计四问的依据）。
2. **流程模型**：dev-loop 沿 FAQ 06（spec 从意图走到当前合同的完整路径）与 FAQ 11（六步执行闭环）的已核结论展开，不重复论证。
3. **市场实证**：公开 repo 与官方文档，来源 URL 一律记在 [research.md](./research.md)，检索时点为 2026-09；外部 repo 结构随时间漂移，引用时以 research.md 里留档的树为准。

`_dsh_plugin_agent_ready_development/` 语料不在本 FAQ 的证据链里：它与本 FAQ 平行、钉同一基线 `46a7f68b09`，其全部理解也只从 DSH 仓库一手内容挖出（语料根 README 的声明）。该语料 2026-09-24 新增的两篇覆盖了本 FAQ 的相邻题域，可交叉印证、不构成依据——[`repo-harness/08-repository-taxonomy.md`](../../_dsh_plugin_agent_ready_development/repo-harness/08-repository-taxonomy.md)（仓库分类规则：顶层分区各辖其职、包恰属一组、五类维护形态）与 [`repo-harness/09-plugin-author-entry.md`](../../_dsh_plugin_agent_ready_development/repo-harness/09-plugin-author-entry.md)（插件作者文档 tier、bundle/profile 组合模型、插件仓库沿用 DSH 词汇的收益与继承边界）。09 的「插件仓库与 DSH 沿用同一套概念词汇时，coding agent 在两边用同样的检索模式」归纳，与本 FAQ 方案 A「DSH 源码进 repo 让 agent 就地探索」同向。语料再更名、扩篇或 re-pin 时，本 FAQ 的机制结论不随语料变——那些以 DSH 工作树为准，需要跟改的只有这里的交叉引用路径。

## 阅读入口

- 先读：[总答案：五个决策 × 四个方案](./answer.md)
- 哪些名字定了就难改：[身份与皮肤——包名/行 id/ctx 键/工具名/事件名/preset id/settings namespace/面板标题](./naming-and-identity.md)
- 开发过程：[机制层四方案共享；"落地"列按方案 A 的形状写给 A/C/D 家族，C/D 增量就地标记；方案 B 的 repo 即 DSH，流程走原生件、见 option-b](./dev-loop.md)
- 官方安装的 DSH 怎么保护：[双 home 隔离——开发做崩不碰日用](./dual-home-isolation.md)
- 方案 A（推荐起点）：[独立专家 repo + pinned DSH submodule](./option-a-standalone-with-pinned-dsh.md)
- 方案 B：[直接在 DSH monorepo 里长](./option-b-in-dsh-monorepo.md)
- 方案 C：[纯外部依赖、DSH 不进 repo](./option-c-external-dependency-only.md)
- 方案 D：[多专家 marketplace 式 monorepo](./option-d-marketplace-monorepo.md)
- 市场实证与来源：[research.md](./research.md)
- 更多机制细节去哪看：原文的形态参考是 `docs/cookbook/extension-cookbook.md`（工具/钩子/UI/协议驱动四种形态 + feature→机制映射）；逐机制的深度看它周边一圈——`docs/cookbook/adding-a-tool.md`（presenter 词汇表与执行策略选择）、`docs/cookbook/adding-a-package.md`、`docs/subsystems/`（conversation、slots 等类型级合同）；教程线与架构地图沿用信息来源所列 `docs/cordis-tutorial/`、`docs/user/develop/`、`docs/architecture.md`
