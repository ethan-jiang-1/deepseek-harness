# Reference · 源码入口、事故复盘与图表清单

本页汇总本组回答引用的 DSH 主仓源码、文档与图表位置，并附带外部插件仓 `probes/` 实践的背景说明。核验状态见 [核验基线登记](../00-baseline.md)。

---

## 一、DSH 核心机制、测试分层与事故复盘出处

| 主题 | 主仓文件入口 |
|---|---|
| `model-visible ⟺ logged` 根规则 | [`AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md)（Conventions 节）；架构决策见 [`.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-07-05-reconstructable-requests.md) |
| 会话只追加事件日志、`request/header` 与 `system/message` 分离存储 | [`docs/subsystems/session.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md)（首段及 `The request header event: request/header` 节） |
| 只有真实装配夹具才能锁住拼装后的系统提示词与工具集合；拒绝缩减会话日志破坏可重建性 | [`.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/testing/2026-07-06-pin-request-header-content-in-one-scenario.md) |
| `@deepseek-ai/dsh-llm-replay` 回放挂载与 `replay.override.json` 四类异常注入 | [`packages/test-support/llm-replay/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/README.md) |
| 测试分层（`test` / `test:coverage` / `test:e2e` / `test:expected` / `test:snapshot`）与“验证真实世界而非自我汇报”原则 | [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)（`Tiers` 与 `Verify the world, not the self-report` 节） |
| 快照目录所有权与 `workspace.expected/` 独立校验规范 | [`snapshots/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md) |
| 沙箱 `confine` 失败即拒绝（fail-closed）不变量 | [`docs/subsystems/sandbox.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/sandbox.md) |
| 事故复盘 0001：178 个单测全绿但发布装配漏掉 `inject` 导致功能不可用 | [`docs/postmortem/0001-acp-default-export-drops-inject.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md) |
| 事故复盘 0002：配置禁用工具产生确定性 `UNKNOWN_TOOL` 报错，警示刷新快照不等于正确性审查 | [`docs/postmortem/0002-js-expression-disabled-filesystem-tools.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md) |
| 事故复盘 0003：脱离真实后端只跑裸前端构建导致 GUI 验证失真 | [`docs/postmortem/0003-web-agent-gui-feedback-loop.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0003-web-agent-gui-feedback-loop.md) |

---

## 二、`01-four-real-probes.md` 四个实例的主仓原生材料

| 实例 | 涉及的主仓夹具与源码路径 |
|---|---|
| **实例一 · 只读会话轨迹** | [`snapshots/session/bash-tool-turn/session.v4.jsonl`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/session/bash-tool-turn/session.v4.jsonl)、[`snapshots/session/bash-tool-turn/snapshot.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/session/bash-tool-turn/snapshot.yml) |
| **实例二 · 请求侧存档与对比** | [`snapshots/web/minimal-preset/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/snapshots/web/minimal-preset)（`snapshot.yml`、`system-prompt.expected.md`、`tool-schemas.expected.json`）；对比样本 [`snapshots/web/fresh-round-trip/system-prompt.expected.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/web/fresh-round-trip/system-prompt.expected.md) 与 [`snapshots/web/optional-string-editor/system-prompt.expected.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/web/optional-string-editor/system-prompt.expected.md)；读取与校验函数 [`packages/test-support/session-snapshot/src/suite.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/src/suite.ts)（`normalizedSystemPrompts`、`normalizedToolSchemas`、`systemPromptPrecedesRequests`、`UNKNOWN_TOOL` 守卫） |
| **实例三 · 浏览器 ARIA 树** | [`snapshots/web/minimal-preset/ui.expected.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/web/minimal-preset/ui.expected.md)；采集与唯一刷新写入函数 [`apps/web/tests/scaffold.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/scaffold.ts)（`captureStableAria`、`compareOrRefreshGolden`）；自动化页内目录选择器补丁 [`apps/web/tests/pin-browse-picker.overlay.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/pin-browse-picker.overlay.yml) |
| **实例四 · 故障注入与工作区校验** | [`snapshots/session/background-confinement-failure/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/snapshots/session/background-confinement-failure)（`snapshot.yml`、`replay.override.json`、`session.v4.jsonl`、[`workspace.expected/confinement-audit.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/session/background-confinement-failure/workspace.expected/confinement-audit.json)） |

---

## 三、DSH 产品树内同名 `probe`（运行时自检 vs 开发诊断脚本）对照

| 类别 | 主仓入口 | 实际用途 |
|---|---|---|
| 运行时安装源探测 | [`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md)、[`docs/subsystems/boot.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/boot.md)、[`docs/config-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md)（`ctx.pluginRegistryProbe` / `registryProbe*`） | 并发探测公共包仓库响应延迟，供安装器选源 |
| 启动期 `PATH` 环境探测 | [`packages/host/directory-picker-auto/src/probe.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/host/directory-picker-auto/src/probe.ts) | Linux 下检查 `zenity` / `kdialog` 是否存在，缺失时平滑回退到页内目录浏览 |
| 沙箱与进程自检 | [`packages/experimental/webworker-runtime/src/shell/process/landlock.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/webworker-runtime/src/shell/process/landlock.ts)（`--probe`）、[`packages/boot/plugin-manager/src/run-tree.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/src/run-tree.ts)（`process.kill(target, 0)`） | 检查内核沙箱可用性与目标进程存活状态 |
| 开发期跨进程 / ABI 取证脚本 | [`scripts/ssh-helper/probe.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/ssh-helper/probe.ts)、[`packages/subprocess/win32-process/verify/abi-probe.cpp`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subprocess/win32-process/verify/abi-probe.cpp)、[`packages/sandbox/sandbox-windows-acl/verify/abi-probe.cpp`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/sandbox/sandbox-windows-acl/verify/abi-probe.cpp) | 不进常规单测套件，专门拉起真实辅助进程或打印底层结构体偏移量供开发者复核 |

---

## 四、本组配图索引

| 图文件 | 引用页面 | 内容摘要 |
|---|---|---|
| [`figures/one-page.svg`](./figures/one-page.svg) | [`answer.md`](./answer.md) | 请求黑箱链、从低成本到高成本的五个下钩位置，以及产出的三种归宿 |
| [`figures/probe-evidence-layers.svg`](./figures/probe-evidence-layers.svg) | [`answer.md`](./answer.md) | 单测 / 覆盖率 / 真 API e2e / 录制快照与探针的分工、三大测试盲区与三条底层不变量 |
| [`figures/anatomy-of-a-probe.svg`](./figures/anatomy-of-a-probe.svg) | [`01-four-real-probes.md`](./01-four-real-probes.md) | `session.v4.jsonl` 事件时间轴与只读轨迹、请求侧 sidecar、ARIA 树、工作区校验四个取证接口 |
| [`figures/llm-in-the-loop.svg`](./figures/llm-in-the-loop.svg) | [`02-how-it-works-and-boundaries.md`](./02-how-it-works-and-boundaries.md) | 探针闭环七步人机分工（Agent 读日志改尺子，确定性代码做判定，人类审基线 diff） |
| [`figures/scenario-directory.svg`](./figures/scenario-directory.svg) | [`02-how-it-works-and-boundaries.md`](./02-how-it-works-and-boundaries.md) | `minimal-preset` 场景目录结构与探针“毕业”进快照基线前的四道安全门 |

---

## 五、关于外部插件仓 `probes/` 目录用法的补充说明

虽然理解本文无需阅读任何外部仓库，但如果你在社区或内部衍生插件仓库（如早期多智能体与个人助手实验仓）里看到独立的 `probes/` 或 `dev/probes/` 目录，它们与 DSH 主仓的对应关系非常简单：

- **为什么插件仓常建 `probes/` 而主仓只有 `snapshots/`**：主仓维护的是底层核心契约，探清后的场景大多直接固化进了 `snapshots/` CI 门禁；而业务插件仓迭代早期提示词、自定义 Web 面板与多角色交互变化极快，在尚未稳定到值得维护录制基线前，开发者习惯把一次性或按需手动运行的诊断脚本（如 `session` 装配检查、无头浏览器 CDP 截图检查）集中放在 `probes/` 下，并在目录 `README` 中声明“探针仅供排障观察，不进 `pnpm test` 门禁”。
- **跨仓沉淀下来的共同习惯**：无论目录叫什么，成熟的插件仓最终都会收敛出正文中总结的几条工程纪律——将通用浏览器/会话驱动与业务判据分层、文件头注明“证明什么 / 不证明什么 / 何时运行”、前置条件缺失统一返回退出码 `2`（`BLOCKED`），以及当某条检查稳定后将其纯函数判据或快照搬入正式测试并清理旧脚本。

> 核验状态见 [核验基线登记](../00-baseline.md)。
