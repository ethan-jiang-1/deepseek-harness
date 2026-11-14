# Reference · 根入口文档与运行时消费核验清单

本页汇总 [answer.md](./answer.md) 及三篇分论所依据的仓库权威文件与门禁入口，方便按路径直达源码复核。

## 一、静态入口与文档分层（对应 [01-map-and-tiers.md](./01-map-and-tiers.md)）

- **人机入口分流与软链接同源**：
  - [`README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md) / [`README.zh.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.zh.md)：面向人类开发者的起步引导，并在 Development 段显式将 coding agent 分流至 `AGENTS.md`。
  - [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md)（及同目录 symlink `CLAUDE.md`）：常驻指令内核，含首段双路由（`docs/architecture.md` 与 `docs/AGENTS.md`）、版本与会话格式红线、顶层布局、命令速查与全局工程规矩。
  - [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)：修改 `packages/` 前的架构总图，首段附带 [`docs/cordis-primer.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md) 前置引导。
- **文档分层归属（One home per fact）与包级分工**：
  - [`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md)：定义各文档层（Root `AGENTS.md`、`architecture.md`、`subsystems`、`defensive-patterns`、`cookbook`、`Agent Notes`、`Skills`、`Package README`、`Generated reference`）的唯一职责与排斥内容。
  - [`packages/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/AGENTS.md) 与 [`packages/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/README.md)：承载 `packages/` 子树统一规则（同 commit 更新 README/JSDoc、Model Experience 与 Known Limitations 规范）及包分组地图。
- **生成式穷举目录代表**：
  - [`docs/tool-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-catalog.md)（由 `scripts/gen-tool-catalog.ts` 生成）
  - [`docs/config-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md)（由 `scripts/gen-config-catalog.ts` 生成）
  - [`docs/event-producer-consumer.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/event-producer-consumer.md)（由 `scripts/gen-doc-graphs.ts` 生成）

## 二、字数预算与文档门禁（对应 [02-budgets-and-gates.md](./02-budgets-and-gates.md)）

- **常驻入口词数上限配置**：[`scripts/doc-budgets.manifest.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/doc-budgets.manifest.json)（登记 `AGENTS.md`、`docs/AGENTS.md`、`docs/architecture.md`、`docs/cordis-primer.md`、`docs/testing.md`、`packages/AGENTS.md`、`packages/README.md` 七项词数上限）。
- **超预算处置顺序（`Relocate → Condense → Raise`）与引用规范**：[`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md) 中 `Wordcount Budgets` 与引用校验小节。
- **自动化门禁脚本**：
  - [`package.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/package.json) 与 [`scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts)：聚合 `doc-sync` 与 `test:docs` 检查项（含 `verify-md-links`、`verify-doc-budgets`、`verify-tool-catalog`、`verify-config-catalog`、`doc-typecheck`、`verify-translation-pairing` 等）。
  - [`scripts/verify-package-readme-summaries.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-package-readme-summaries.ts)：单包 `README.md` 的 `## Summary` 100 词上限检查。
  - [`scripts/verify-repository-references.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-repository-references.ts)：拦截受维护文档中的裸 commit 哈希与非官方组织仓库链接。

## 三、运行时注入、按需拉取与压力回收（对应 [03-runtime-consumption.md](./03-runtime-consumption.md)）

- **指令链自动注入（Baseline + Touch-Driven）**：[`packages/context/agent-instructions/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/agent-instructions/README.md)（涵盖 `$DSH_HOME/AGENTS.md` 至 `cwd` 的首步注入、一等 `read`/`write`/`edit` 触达深层目录后的增量追补、`maxBytes` 最具体优先裁剪与通知、digest 去重及无后台 watcher 约束）。
- **一等文件与检索工具提示词纪律**：
  - [`packages/fs/tool-fs/src/read.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs/src/read.ts)
  - [`packages/fs/tool-fs-search/src/grep.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs-search/src/grep.ts)
  - [`packages/fs/tool-fs-search/src/glob.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs-search/src/glob.ts)
- **Skill 摘要常驻与正文按需读取**：[`docs/subsystems/skills.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/skills.md)
- **Token 压力度量与上下文压缩回收**：[`docs/subsystems/token-meter.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/token-meter.md)、[`docs/subsystems/compaction.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md)

## 四、关联 FAQ

- [FAQ 01 · 仓库顶层组织与三张关系树](../01_repository-organization/answer.md)
- [FAQ 07 · 外部仓库如何借用 DSH 的地图、门禁与开发闭环](../07_borrowing-dsh-harness-idea/answer.md)（静态入口链裁剪见 [01-repo-map-and-docs.md](../07_borrowing-dsh-harness-idea/01-repo-map-and-docs.md)，运行时与可执行门禁见 [03-executable-gates-and-tests.md](../07_borrowing-dsh-harness-idea/03-executable-gates-and-tests.md)）
