# Reference · 源码入口与核验索引

本页集中汇总本专题涉及的 DSH 仓库一手源码、包文档与架构决策记录，便于对照核查。

---

## 一、`goal`、`plan` 与并发编排体系

| 主题 | 仓库路径 | 核查要点 |
|---|---|---|
| 基础默认组装单 | [`packages/bundle/base/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/base/cordis.patch.yml) | 开箱挂载 `goal`、`goal-round-driver`、`plan-mode`、`tool-workflow`、`tool-subagent`、`attachment-local`、`image-offload` 及默认模型 `deepseek-flash` |
| `goal` 领域包组总览 | [`packages/goal/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/README.md) | 单会话单当前目标模型工具、`/goal` 命令与自动续轮驱动器的四包职责切分 |
| `goal` 持久状态与生命周期 | [`packages/goal/goal/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal/README.md) | 四种持久阶段（`active` / `paused` / `blocked` / `complete`）、默认 `256` 轮上限、CAS 修订号校验、重启后 `activation` 归零规则 |
| 自动续轮驱动器 | [`packages/goal/goal-round-driver/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal-round-driver/README.md) | 整树空闲等待、先 `flush()` 落盘再入队、`agent/pre-step` 双重校验、异常停止自动续跑策略 |
| `<goal_round>` 续轮提示词 | [`packages/goal/goal-round-driver/src/prompt.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/goal-round-driver/src/prompt.ts) | 强制以当前工作区、工具结果和持久日志为准，否定早期模型自述权威性 |
| 模型侧目标工具门禁 | [`packages/goal/tool-goal/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/goal/tool-goal/README.md) | 人类与当前精确轮次授权边界、自动续轮前 3 轮拒绝 `blocked` 门槛 |
| 计划模式与评审流 | [`packages/plan/plan-mode/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/plan/plan-mode/src/index.ts) | `plan/mode` 布尔事件、`exit_plan_mode` 经 `ctx.userQuestions.ask` 触发评审、保持工具列表恒定以稳定请求前缀缓存 |
| 脚本化并发工作流 | [`packages/workflow/workflow/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workflow/workflow/README.md) | 仅执行调用方当场传入脚本（无静态保存模板）、`parallel()` / `pipeline()` / `agent()` 原语 |
| 固化编排插件样板 | [`packages/experimental/tool-ralph/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/tool-ralph/README.md) | 在 `ctx.workflowEngine` 与 `ctx.subagents` 之上封装固定策略工具而不改动 `agent-loop` |
| 子智能体委派全景 | [`packages/subagent/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/README.md) | 进程内 `spawn` / `fork`、外部 ACP / Claude Code / Codex 代理与 SDK 驱动等 6 类实现 |

---

## 二、模型路由、推理回传与多模态视觉链路

| 主题 | 仓库路径 | 核查要点 |
|---|---|---|
| 官方默认模型目录 | [`packages/llm/llm-deepseek/src/models.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/llm-deepseek/src/models.ts) | `deepseek-flash`（图文双模态、`in-history` 系统提示词追加、`addition-only` 工具增量）与 `deepseek-v4-pro`（纯文本）各 1M 上下文 |
| Messages 传输、缓存与图片预算 | [`packages/llm/llm-deepseek/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/llm-deepseek/README.md) | `reasoningEffort` 四档、推理原文回传（Reasoning passback）、14px 视觉网格与 1024 视觉 token 上限、Files API 128 MiB / 600 张预算与内联回退 |
| 文件与图像读取工具 | [`packages/fs/tool-fs/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs/README.md) | `read`（仅 UTF-8 文本）与 `read_image`（要求 `ctx.attachments` 与支持图像的模型路由、降采样坐标倍率提示） |
| 本地内容寻址附件存储 | [`packages/attachment/attachment-local/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/attachment/attachment-local/README.md) | 源文件准入上限（20 MiB / 8192px）与规范化落盘上限（长边 2048px / 4 MiB / 8-bit sRGB） |
| 超限旧图自动卸载 | [`packages/compaction/compaction-image-offload/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/compaction/compaction-image-offload/README.md) | 捕获 `IMAGE_OFFLOAD_REQUIRED`、记录 `image/offload` 事件并将最老图片前缀替换为文本占位符 |
| 浏览器与桌面交互接缝 | [`packages/browser-use/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/browser-use/README.md) · [`packages/computer-use/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/computer-use/README.md) | 按需挂载的网页操控与桌面操控 Provider 注册机制 |

---

## 三、前端预览、右侧边栏与 Creator 自扩展闭环

| 主题 | 仓库路径 | 核查要点 |
|---|---|---|
| 交付物与工作区变更记录 | [`packages/deliverables/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/deliverables/README.md) · [`packages/client/ui-deliverables/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-deliverables/README.md) | `present` 显式交付卡、轮末变更文件审查卡、行内代码路径自动转右栏预览链接 |
| 右侧停靠栏与内置页签 | [`packages/client/ui-sidebar-right/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-right/README.md) · [`packages/client/ui-sidebar-browser/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-browser/README.md) | `ctx.sidebarRight` 导航、`ctx.sidebarRightTabs` 标签页扩展槽位及沙箱内嵌浏览器 |
| 多格式文档与 Office 预览 | [`packages/client/ui-sidebar-documentpreview/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar-documentpreview/README.md) · [`packages/document/office-to-pdf/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/document/office-to-pdf/README.md) | Markdown、代码、PDF、图片、HTML、Excel（浏览器 Worker）与 Word/PPT（本地转 PDF）统一预览 |
| Office 渐进式编写与渲染技能 | [`packages/skill/skill-office/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-office/README.md) | 按需加载的文档编写、`office-render` 外观出图核验、公式重算与 PDF 导出技能 |
| Creator 预设与运行时自省 | [`packages/bundle/web-app/presets/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/cordis.patch.yml) · [`packages/extensions/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/extensions/README.md) · [`packages/extensions/tool-cordis/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/extensions/tool-cordis/README.md) | `cordis` 预设组装、只读 API/配置/槽位发现工具 `cordis_inspect_*` 与内置插件开发技能 |
| Profile 插件热装与分层启动 | [`packages/boot/plugin-manager/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md) · [`packages/boot/app-boot/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md) | 受审批门控的 `plugin_manager` Bundle 持久安装、HMR 热生效与多层 Patch 覆盖顺序 |

---

## 四、核心架构契约与决策记录

- **整体架构与会话日志铁律**：[`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) · [`docs/subsystems/session.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md)
- **全仓可替换服务接缝生成目录**：[`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md)
- **新增工具与纯函数回放卡片规范**：[`docs/cookbook/adding-a-tool.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md)
- **相关设计决策记录（Agent Notes）**：
  - [`2026-07-31-goal-owned-durable-events.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-07-31-goal-owned-durable-events.md)（会话日志作为 `goal` 唯一持久权威）
  - [`2026-09-04-right-sidebar-docking-infrastructure.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-09-04-right-sidebar-docking-infrastructure.md)（右侧停靠栏与资源路由架构）
  - [`2026-09-16-browser-excel-preview.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-09-16-browser-excel-preview.md)（浏览器端表格预览与隔离解析）
  - [`2026-09-15-guided-plugin-installation.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-09-15-guided-plugin-installation.md)（受控插件安装与失败回滚机制）

---

## 五、外部反馈背景说明

本专题讨论的三条重度用户体感源自社区高强度使用者（累计消耗约 10 亿 token）的实战经验转述。本文仅将其作为工程假设，对照当前 DSH 仓库源码验证“哪些体验由底层机制直接导出、哪些早期缺口现已补齐、哪些用法暗含成本边界”，不对发言者的私人环境配置或外部竞品表现做主观裁定。

> 核验状态见 [核验基线登记](../00-baseline.md)。
