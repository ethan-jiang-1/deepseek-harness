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

## 范围与基线

DSH 侧机制结论以本仓库工作树（`dsh-v0.1.5-rc.2` 基线之后的 `ethan` 分支工作树）为准，与 FAQ 01/08 同源——00-index 的 pinned-commit 基线管运行时行为结论的新鲜度，本篇的机制表述（profile/patch 层级、preset、卡片层）均在当前工作树逐条对过源码文档；上游合入后按 `_digested/_change_log/` 复核。涉及的机制文档：`docs/architecture.md`（profile / bundle / patch 层级）、`packages/preset/README.md` 与 `packages/preset/agent-presets/src/index.ts`（agent preset、roster 根发现）、`docs/cookbook/adding-a-tool.md`（卡片渲染意图与 Web 消费边界）、`docs/subsystems/conversation.md`（View 注册通道）、`packages/boot/app-boot/README.md`（Profiles 与 profile 目录）、`docs/cordis-primer.md`（entry `disabled`）。市场调研结论来自公开 repo 与文档，来源 URL 一律记在 [research.md](./research.md)，检索时点为 2026-09；外部 repo 结构随时间漂移，引用时以 research.md 里留档的树为准。

## 阅读入口

- 先读：[总答案：五个决策 × 四个方案](./answer.md)
- 哪些名字定了就难改：[身份与皮肤——包名/行 id/ctx 键/工具名/事件名/preset id/settings namespace/面板标题](./naming-and-identity.md)
- 开发过程（四方案共享）：[插拔、调试、驱动 coding agent、DSH 推荐流程](./dev-loop.md)
- 官方安装的 DSH 怎么保护：[双 home 隔离——开发做崩不碰日用](./dual-home-isolation.md)
- 方案 A（推荐起点）：[独立专家 repo + pinned DSH submodule](./option-a-standalone-with-pinned-dsh.md)
- 方案 B：[直接在 DSH monorepo 里长](./option-b-in-dsh-monorepo.md)
- 方案 C：[纯外部依赖、DSH 不进 repo](./option-c-external-dependency-only.md)
- 方案 D：[多专家 marketplace 式 monorepo](./option-d-marketplace-monorepo.md)
- 市场实证与来源：[research.md](./research.md)
