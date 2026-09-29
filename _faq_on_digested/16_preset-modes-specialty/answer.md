# Answer 16 · 三个模式是同一机制上的三份 bundle patch，各自动宿主的一根不同的轴

## 一句话答案

四个内置模式是**同一声明式 preset 机制**上的四份 bundle patch（`packages/bundle/web-app/presets/` 下 [`standard.patch.yml`](../../packages/bundle/web-app/presets/standard.patch.yml) / [`ptc.patch.yml`](../../packages/bundle/web-app/presets/ptc.patch.yml) / [`minimal.patch.yml`](../../packages/bundle/web-app/presets/minimal.patch.yml) / [`cordis.patch.yml`](../../packages/bundle/web-app/presets/cordis.patch.yml)，见 [declarative presets Note](../../.agents/notes/implemented/architecture/2026-09-18-declarative-agent-presets.md)）。它们的"特殊性"不是工具清单的加减，而是各自动了宿主的一根不同的轴：**PTC 动呈现层**（工具目录怎么投影成模型可见的 wire 工具表），**Minimal 动身份层**（系统提示词被一句话整体替换、运行时上下文关闭、终端换成持久终端），**Creator 动扩展层**（在 Standard 之上加运行时检查、持久插件管理与创作技能，把 DSH 自身变成 agent 的工作对象）。Standard 是唯一三根轴都不动的基线。

## 第一节 · 先分清：preset 是什么，不是什么

- **Agent preset 是会话级的**：一个进程里可以同时跑不同 preset 的 Agent。registry（`dsh-agent-preset-registry`）为每份声明建 scope + 内存 Loader 树，Agent scope 挂上去，子 agent 继承同一 revision；进程的 Agent loop 与 Host 服务仍然共享（[declarative presets Note](../../.agents/notes/implemented/architecture/2026-09-18-declarative-agent-presets.md)）。这和**进程级**的 runtime profile 是两个层面——`_digested` 已经把这条线画过：profile 决定一个 `dsh` 进程启动时装入什么，preset 决定单个 Session 的 Agent 拿什么工具与提示词（[`../_digested/runtime-profiles/00-map.md`](../../_digested/runtime-profiles/00-map.md)）。
- **preset 声明就是普通插件行**：一份 `@deepseek-ai/dsh-agent-preset` 声明带 `id` + `plugins` 子列表，由 bundle patch 携带。Web 四份预设的差别全部体现在子列表的几十行 YAML 里，没有任何模式专属的宿主代码路径。
- **preset 不是安全边界**：Note 的 Consequences 明说 "Presets do not provide a security sandbox"；权限与沙箱照旧走 tool pipeline 与 approval seam。
- **选择器是实验性的**：`agent-preset-registry` 的部署 `default: standard`（[`packages/bundle/web-app/cordis.patch.yml`](../../packages/bundle/web-app/cordis.patch.yml)）；"新任务可选择模式"开关标注 Experimental，关掉时新任务用应用默认，已有任务不受影响（[`locales.ts`](../../packages/client/ui-agent-preset/src/client/locales.ts)）。

## 第二节 · 四份 patch 的实差

以 `standard`（order 1）为基线，逐行 diff 另外三份：

| 维度 | standard | ptc（order 2） | minimal（order 3） | cordis（order 4，显示名 Creator mode） |
|---|---|---|---|---|
| persona | `{{model}}` 前缀 + `{{cwd}}` 后缀 | 同 standard | **一句话 + `complete: true` + `includeRuntimeContext: false`** | 同 standard |
| wire 工具表 | 全部原生 schema | **只剩 `run_code` + 生成 SDK**（加一行 `dsh-agent-tool-presentation mode: ptc`） | 只剩 `bash`/`pwsh`（持久终端） | 原生 schema（同 standard） |
| shell | one-shot `dsh-tool-bash`/`pwsh` | 同 standard | **`dsh-tool-bash-persistent`/`pwsh-persistent`，`isolate: terminals`** | 同 standard |
| fs 工具 / 搜索 | read/edit/write/glob/grep | 有（经 SDK 调用） | **无**（靠 shell 命令） | 有 |
| skills | skill-filesystem + tool-skill | 有 | **无** | 有，且 `customSkillDirs` **追加**三个创作技能 |
| plan / goal / todo / ask-user / web / present / jobs | 全有 | 全有 | **全无** | 全有 |
| compaction | 有（`isolate: compaction, toolResultPruner`） | 有 | **无** | 有 |
| delegation | subagent×2 + workflow + workflow-ptc，ralph 禁 | subagent×2，**workflow 三件全禁** | 无 | 同 standard（workflow 可用） |
| `tool-cordis`（运行时检查） | 无 | 无 | 无 | **有** |
| `plugin-manager` 工具 | `disabled: true` | `disabled: true` | 无此行 | **条件启用**：`disabled: !!js "!ctx.get('profileContext')"` |
| `agent-instructions`（AGENTS.md 注入） | 有（64KB 上限） | 有 | **无** | 有 |

（逐格出处：四份 `*.patch.yml` 本身；Minimal 列另有快照钉住，见 [minimal-mode.md](./minimal-mode.md)。）

## 第三节 · "特殊性"的机制定位：三根正交的轴

1. **呈现轴（PTC）**：工具注册表 `ToolRuntime` 本身有 `mode: 'native' | 'ptc' | 'both'` 配置；preset 通过 `dsh-agent-tool-presentation` 这一行在自己的 scope 里声明 `presentAs()`，于是**同一进程里 native Agent 与 PTC Agent 并存而不共享工具目录**（[`packages/core/agent-tool-presentation/README.md`](../../packages/core/agent-tool-presentation/README.md)）。改的是"模型看见的工具表"这一层，工具本体、权限、审计一概不动。
2. **身份轴（Minimal）**：`dsh-persona` 行的 `complete: true` 让那句 prefix 成为**完整系统提示词**，抑制 suffix 和其他所有 section（[`packages/preset/persona/src/index.ts`](../../packages/preset/persona/src/index.ts)）；`includeRuntimeContext: false` 再关掉运行时上下文快照。配合砍掉 `agent-instructions`，Minimal 把"你是谁、你在哪、仓库说了什么"三个输入全部清零，只剩一个持久 shell。
3. **扩展轴（Creator）**：加的不是"给任务用的工具"，而是**把宿主自身当作业对象**的入口——只读运行时检查（`cordis_inspect_*`）、持久插件安装（`plugin-manager`，profile 上下文存在才启用）、三个按需加载的创作技能。产出物是 bundle patch / preset 声明，落进 profile，影响此后所有会话。

三根轴互不排斥——理论上可以写一份 `complete: true` 又 `mode: ptc` 的自定义 preset；内置四份只是三个单轴极端 + 一个不动轴的基线。这也解释了为什么 Creator 的 guide 文案说"模式是一份 Agent 预设"：**自定义模式没有新机制，就是再写一份声明**（[`guide-locales.ts`](../../packages/client/ui-agent-preset/src/client/guide-locales.ts)）。

分篇展开：[ptc-mode.md](./ptc-mode.md)（呈现轴）、[minimal-mode.md](./minimal-mode.md)（身份轴）、[creator-mode.md](./creator-mode.md)（扩展轴）。
