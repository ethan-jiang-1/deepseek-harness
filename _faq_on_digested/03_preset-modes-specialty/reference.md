# Reference 03 · 权威源码入口与本地核验命令

本页集中汇总四个内置模式（Standard / PTC / Minimal / Creator）涉及的声明补丁、核心机制包、架构决策记录（Agent Notes）以及端到端与快照测试入口。核验状态见 [核验基线登记](../00-baseline.md)。

---

## 一、四份内置预设补丁与宿主组装

- **四份会话预设声明（唯一事实源）**
  - Standard：[`packages/bundle/web-app/presets/standard.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/standard.patch.yml)
  - PTC：[`packages/bundle/web-app/presets/ptc.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/ptc.patch.yml)
  - Minimal：[`packages/bundle/web-app/presets/minimal.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/minimal.patch.yml)
  - Creator（`id: cordis`）：[`packages/bundle/web-app/presets/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/cordis.patch.yml)
- **Web 宿主层与进程启动组装**
  - Web 应用补丁（含 `agent-preset-registry` 默认值与全局 `system-prompt` 配置）：[`packages/bundle/web-app/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/cordis.patch.yml)
  - 进程级 Profile 启动组装说明：[`packages/boot/app-boot/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md)

---

## 二、核心机制包与前端界面文案

- **预设注册、作用域隔离与创作技能**
  - 会话预设注册表与挂载：[`packages/preset/agent-preset-registry/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md)
  - `isolate` 局部作用域标签机制：[`packages/core/scope/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/scope/README.md)
  - Creator 追加的四个内置创作技能目录：[`packages/preset/agent-preset/skills/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/preset/agent-preset/skills)（含 [`editing-cordis-compositions/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md) 等）
  - 技能目录追加优先级（`customSkillDirs` / `CUSTOM_RANK`）：[`packages/skill/skill-filesystem/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/src/index.ts)
- **PTC 呈现层与运行时桥接**
  - 会话级工具呈现模式切换：[`packages/core/agent-tool-presentation/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent-tool-presentation/README.md)
  - `run_code`、`.d.ts` SDK 生成与子调用分发队列（`maxParallelSubCalls`、`tool/ptc-dispatch`）：[`packages/core/tools/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/tools/src/index.ts)、[`packages/core/tools/src/ptc.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/tools/src/ptc.ts)
  - Node 沙箱执行后端与 Workflow 编排引擎：[`packages/ptc-runtime/ptc-runtime-node/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/ptc-runtime/ptc-runtime-node/README.md)、[`packages/workflow/workflow-ptc/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workflow/workflow-ptc/README.md)
- **Minimal 身份覆盖与持久终端**
  - 作用域级 `persona`（`complete: true` 与 `includeRuntimeContext: false`）：[`packages/preset/persona/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/persona/src/index.ts)
  - 系统提示词组装与 `suppressRuntimeContext()`：[`packages/core/system-prompt/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/system-prompt/README.md)
  - 持久 Bash / PowerShell 工具：[`packages/shell/tool-bash-persistent/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/shell/tool-bash-persistent/src/index.ts)
- **Creator 自检、持久化插件管理与客户端选择器**
  - 运行时只读检查工具（`cordis_inspect_*`）：[`packages/extensions/tool-cordis/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/extensions/tool-cordis/README.md)
  - 持久化插件管理工具与审批理由（`plugin_manager` / `plugin_market`）：[`packages/boot/plugin-manager/src/tools.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/src/tools.ts)、[`packages/boot/plugin-market/src/tools.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-market/src/tools.ts)
  - 前端模式选择器显隐门控与中英文引导文案：[`packages/client/ui-agent-preset/src/client/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-agent-preset/src/client/index.ts)、[`locales.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-agent-preset/src/client/locales.ts)、[`guide-locales.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-agent-preset/src/client/guide-locales.ts)

---

## 三、架构决策记录与行为测试入口

- **设计取舍记录（Agent Notes）**
  - 声明式会话预设与非安全边界定位：[`.agents/notes/implemented/architecture/2026-09-18-declarative-agent-presets.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-09-18-declarative-agent-presets.md)
  - PTC 模式与子调用管道设计：[`.agents/notes/implemented/feature/2026-06-15-ptc.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-06-15-ptc.md)（早先由 `code-mode` 重命名为 `ptc` 见提交 [`3ca9c7d489`](https://github.com/deepseek-ai/deepseek-harness/commit/3ca9c7d489)）
  - Creator 创作技能渐进披露成本核算（历史归档参考）：[`.agents/notes/archived/architecture/2026-09-21-creator-skills-progressive-disclosure.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/architecture/2026-09-21-creator-skills-progressive-disclosure.md)
- **锁死行为契约的测试与快照**
  - Standard 31 工具清单与三类刻意缺席契约：[`apps/web/tests/shipped-composition.e2e.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/shipped-composition.e2e.ts)
  - Minimal 一句话提示词、哨兵段落屏蔽、持久终端与 `/compact` 快照：[`apps/web/tests/minimal-preset.snapshot.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/minimal-preset.snapshot.ts)、[`snapshots/web/minimal-preset/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/snapshots/web/minimal-preset)
  - PTC 完整往返与沙箱提权审批验证：[`apps/web/tests/ptc-round.e2e.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/ptc-round.e2e.ts)、[`apps/web/tests/ptc-escalation.e2e.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/ptc-escalation.e2e.ts)

---

## 四、本地快速核验命令

```sh
# 1. 以 standard.patch.yml 为基准，直观对比其余三份预设的每一行差异
diff -u packages/bundle/web-app/presets/standard.patch.yml packages/bundle/web-app/presets/ptc.patch.yml
diff -u packages/bundle/web-app/presets/standard.patch.yml packages/bundle/web-app/presets/cordis.patch.yml

# 2. 查看 Creator 追加的四个内置创作技能目录
ls -1 packages/preset/agent-preset/skills

# 3. 无密钥回放验证 Minimal 预设的完整系统提示词、工具表与手动压缩快照
pnpm run test:snapshot -- -t "minimal"
```
