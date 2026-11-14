# Reference 07 · DSH 权威文件入口与对照索引

本页集中整理本组文章引用的 DSH 仓库一手规则文件、门禁脚本、真实历史提交与相关专题入口。指向 DSH 产品树的文件均采用默认分支 `master` 链接，可单独取阅核对。核验状态见 [核验基线登记](../00-baseline.md)。

---

## 一、仓库地图、文档分层与字数预算（对应 `01`）

- **根指令入口与包级约定**：[`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md)（常驻规则、目录布局、常用命令及 `CLAUDE.md` 软链接约定）、[`packages/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/AGENTS.md)、[`packages/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/README.md)
- **架构总图与改动路由表**：[`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)（含 `Where new behavior goes` 扩展入口表与 `--dump-config` 配置树查看命令）、[`docs/glossary.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/glossary.md)
- **文档分层标准（`One home per fact` 与 `Document current state`）**：[`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md)
- **常驻文档字数预算与棘轮门禁**：[`scripts/doc-budgets.manifest.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/doc-budgets.manifest.json)、[`scripts/verify-doc-budgets.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-doc-budgets.ts)
- **自动生成目录实例**：[`docs/tool-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-catalog.md)、[`docs/config-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md)、[`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md)

---

## 二、决策记录（Agent Note）与同提交交付闭环（对应 `02`）

- **决策记录生命周期、准入门槛与四段骨架**：[`.agents/notes/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/README.md)
- **归档与清理判定流程**：[`.agents/skills/dsh-archive-agent-notes/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-archive-agent-notes/SKILL.md)
- **PR 交付三栏模板**：[`.github/pull_request_template.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/pull_request_template.md)
- **正反真实历史提交对照**：
  - 局部 UI 呈现修改豁免决策记录（模型选择器显示原始 ID，7 文件原子闭环）：提交 [`5124a2a310`](https://github.com/deepseek-ai/deepseek-harness/commit/5124a2a310a904d28118609c41d89f26440b946b)（PR [`#5004`](https://github.com/deepseek-ai/deepseek-harness/pull/5004)）
  - 含持久设计取舍与 5 条被否备选方案必写记录（静默超时回收卡死 `pnpm` 子进程）：提交 [`ccaa0dc11c`](https://github.com/deepseek-ai/deepseek-harness/commit/ccaa0dc11c) 与对应归档记录 [`2026-09-23-bounded-pnpm-runs.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/bug-fix/2026-09-23-bounded-pnpm-runs.md)

---

## 三、可执行快门禁、分层测试与按需技能（对应 `03`、`04`）

- **为什么机械门禁优于散文约定**：归档决策记录 [`2026-06-11-quality-gates.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-06-11-quality-gates.md)
- **顶层门禁聚合器与本地快钩子**：[`scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts)、[`lefthook.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/lefthook.yml)、归档记录 [`2026-07-22-fast-local-git-hooks.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-07-22-fast-local-git-hooks.md)
- **测试分层、红灯对照与真实世界断言**：[`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)、[`docs/defensive-patterns/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/defensive-patterns/README.md)
- **按需加载技能（Skills）与扩展操作手册**：[`.agents/skills/dsh-pre-push-checks/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-pre-push-checks/SKILL.md)、[`.agents/skills/dsh-code-review/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-code-review/SKILL.md)、[`packages/skill/tool-skill/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/tool-skill/README.md)、[`docs/cookbook/extension-cookbook.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/extension-cookbook.md)

---

## 四、自研 Agent 运行时机制参考（按需选读）

- **指令按触达目录动态注入与字节预算**：[`packages/context/agent-instructions/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/agent-instructions/README.md)、[`packages/context/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/README.md)
- **工具执行统一管线与契约**：[`docs/tool-execution-pipeline.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md)、[`docs/subsystems/tools.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/tools.md)
- **系统提示词缓存友好组装、技能目录摘要与上下文压缩**：[`docs/subsystems/system-prompt.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/system-prompt.md)、[`docs/subsystems/skills.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/skills.md)、[`docs/subsystems/compaction.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md)
- **子智能体历史隔离与运行时只读检查边界**：[`packages/subagent/subagent-spawn-in-process/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-spawn-in-process/README.md)、[`packages/extensions/tool-cordis/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/extensions/tool-cordis/README.md)、归档记录 [`2026-07-08-self-referential-cordis-toolset.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/feature/2026-07-08-self-referential-cordis-toolset.md)

---

## 五、本语料相关兄弟 FAQ

- 根入口文档在 DSH 内部的静态设计与运行时消费全景：[FAQ 04 · 根入口文档](../04_root-entry-doc/answer.md)
- DSH 主仓自身的变更载体分工与双案例深度拆解：[FAQ 06 · 变更落位路径](../06_change-landing-path/answer.md)
- DSH 主仓内外双圈与六步窄证据切片闭环：[FAQ 11 · 原生开发闭环](../11_native-development-loop/answer.md)
- Agent Note 制度细节与真实演进走查：[FAQ 20 · Agent Note 质量标准](../20_agent-note-quality-bar/answer.md)
- 无密钥录制会话快照的原理与插件仓取舍：[FAQ 21 · 录制会话快照](../21_recorded-session-snapshots/answer.md)
