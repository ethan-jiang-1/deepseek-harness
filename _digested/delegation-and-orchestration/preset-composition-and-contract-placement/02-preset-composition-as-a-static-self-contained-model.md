# Preset Composition as a Static Self-Contained Model · preset 作为静态自包含模型

> 本页回答：**一个 preset 到底声明了什么？它是模型还是投影？能力面藏在哪、怎么被证明？** 通道差异见 [`composition/01`](./01-channel-capability-differences-and-inheritance.md)，收窄见 [`composition/03`](./03-worker-profiles-and-the-only-narrowing-lever.md)，合同见 [`composition/04`](./04-contract-placement-between-policy-and-engine.md)。

> 源码核验入口：`packages/preset/agent-preset/src/index.ts`、`packages/preset/agent-preset-registry/src/{index,definition}.ts`、`packages/preset/agent-preset/README.md`、`packages/bundle/base/cordis.patch.yml`、`apps/cli`（`--dump-config`）。

## 读完你能回答

- 一个 preset 到底声明了什么，能力面藏在哪几处？
- 描述性能力清单与独立验收期望，为什么要分别维护？
- 改了 preset，为什么跑着的 Agent 仍保留旧组合，但不一定保留所有旧输入？

## 心智模型

核心判断：**preset 声明一株自包含的插件子树，Agent 绑定其中一代 revision。静态的是组合定义。**

- 声明 = `id` + `plugins` 子列表；没有 hidden 标志，也没有工具过滤字段。
- 新的显式选择使用当前可用修订；给子代理显式传 id（哪怕等于父的 id）也如此。省略子代理的 preset 时，继承父 Agent 已绑定的精确修订，详见 [`composition/01`](./01-channel-capability-differences-and-inheritance.md)。
- 编辑声明不会把已有 Agent 换到新组合；旧实现仅在进程内按引用保留，重启冷恢复使用该 id 的当前定义。

组合 revision 不冻结所有模型输入：例如磁盘 skill 的目录摘要可以不变，下一次加载却读到新版正文，之前加载的文本仍留在历史。输入更新与历史的关系见[skill 输入生命周期](../../tools-prompt-llm/07-skill-input-lifecycle.md)。

![同一 preset 身份下，新旧修订随 Agent 引用并存](./figures/preset-revision-lifetimes.svg)

沿时间向右读：定义更新后，显式选择取当前修订，省略 preset 的子代理仍加入父代；只有退役修订的最后一个引用释放后才卸载旧组合。图中的 v1 / v2 仅用于区分修订，不是公开版本号。

## 一句话

preset 不是一份能力清单，而是**一株静态、自包含、eager 加载的插件子树**：能力在子插件行里、合同在这些插件的 prompt/skill 里、深度在行配置里——**没有任何一个字段声称「这个 preset 能做什么」**。想知道它实际能做什么，只能读组合、挂载、看会话实际工具面。

![preset 是投影：模型 → YAML → 通道 → 图 → 证据](./figures/preset-model-projection.svg)

## 它是什么

| 事实 | 证据 |
|---|---|
| 一个 preset 就是一行普通 Cordis 插件，`config` 即定义；`config.plugins` 是子插件入口列表 | `packages/preset/agent-preset/src/index.ts:9`、`:16`-`23` |
| 定义里的字段只有 `id / name / description / order / plugins` | `packages/preset/agent-preset-registry/src/definition.ts:5`-`11` |
| 声明行的 `id` 给 Loader 编辑用；`config.id` 才是 session 保存的 preset 身份 | `packages/preset/agent-preset/README.md:48` |
| 定义 **eagerly 加载**：注册即激活、即挂载；激活失败留在名册里可见 | `agent-preset/README.md:12`；`agent-preset-registry/src/index.ts:77`、`:98`-`110` |
| 编辑会退役旧修订；**已有 Agent 保留引用**，后续显式选择使用当前定义，继承子代理继续用父修订（仅同进程；重启冷恢复用该 id 的当前定义） | `agent-preset/README.md:78`；`agent-preset-registry/README.md:56`、`:93`、`:99` |
| **没有运行期继承**：没有 `extends`/`base`/parent 字段；用户覆盖是整份子列表替换，不合并 | `definition.ts:5`-`11`；`agent-preset-registry/README.md:99` |
| 唯一的分层是加载期 YAML patch 在 `config.plugins` 内做操作 | `docs/architecture.md:25` |
| 注册表不扫目录、不接受 preset 路径 | `agent-preset-registry/README.md:46` |
| 子条目 id 可省略、由 Loader 分配；`!!js` 保留到子插件加载 | `agent-preset/README.md:48`；`agent-preset/src/index.ts:14`-`15`、`:26`-`29` |

## 能力面藏在四处，没有单一声明

| 你以为的“能力” | 实际住在哪 | 读它要付出什么 |
|---|---|---|
| 有哪些工具（能不能委派、能不能开 workflow） | `config.plugins` 里的 tool 行 | 读 YAML + 理解每个插件的 Config |
| 行为约束（何时用哪条通道、失败怎么办） | 那些插件的 description / `systemPrompt.section` / 挂载的 skill | 读模型可见文本，不是读配置 |
| 递归预算 | 每个 delegation 行自己的 `maxDepth` | 逐行看，链的总预算没有单点声明 |
| 模型与 persona | 组合行里的 model / persona 段 | 读行配置与注入文本 |

这个形状的后果是：**「这个 preset 能干什么」是一个需要计算的结论**，不是一个可查询的字段。把 shipped 的四份 preset（`packages/bundle/web-app/presets/` 的 cordis/minimal/ptc/standard）并排读，你能看出哪些行共有、哪些是 delta，但看不出“它是否允许三层委派”——那要沿 delegation 行、bundle 组合与深度默认值一起推。

## 一个 shipped preset 里通常有什么

以 Web 组合的 `standard` 为例（`packages/bundle/web-app/presets/standard.patch.yml:6`-`127`），一株 preset 的子行按职责可以分成七类：

| 类别 | 典型行 | 作用 |
|---|---|---|
| 身份与上下文 | `persona`、`agent-instructions`、`time-context` | 模型看见的角色前缀、工作区指令、时间 |
| 工具面 | `tool-bash`/`tool-pwsh`（按平台 disable）、`tool-fs`、`tool-fs-search`、`tool-web` | 能读写、搜索、执行什么 |
| 计划与账本 | `tool-todo`、`plan-mode`（group）、`tool-goal` + `command-goal`、`tool-ask-user` | 轻量计划、审批门、跨轮目标、问人 |
| 委派 | `tool-subagent-control`（含 `list-agents`）、两条 `tool-subagent`（spawn / fork）、`workflow-ptc` + `tool-workflow` | 谁能委派、走哪条通道 |
| 技能 | `skill-filesystem` + `tool-skill` | 按需加载方法与 references |
| 上下文治理 | `compaction-basic`、`command-compact`、`tool-result-pruner`（8192/4096/1024） | 压缩与工具结果裁剪 |
| 产品能力 | `tool-present`、plugin-manager / plugin-market 的 tools | 呈现与插件管理（按部署增减） |

这张表的用法不是“抄一份 standard”，而是判断**你缺哪一类**：例如只有 `tool-subagent` 没有 `tool-subagent-control`，就没有 `send_message`/`interrupt_agent`；只有 `tool-workflow` 没有 `workflow-ptc`，工具挂载会失败；如果你的共享合同 skill 不在默认扫描根（`.dsh/skills` 等），又没配 `customSkillDirs`，它就发现不了。

## 名册、编辑与锁定

- **名册是给 UI 的，不是给模型的**：`agentPresets/list` 返回 id、`isDefault`、名称、`description` 与 `broken`，`agentPresets/read` 读一份声明的 YAML；模型只有在某个工具的 `agent_preset` 参数里才看得到候选（`preset-selection.ts:46`-`50`、`:65`-`70`）。
- **编辑落点是 profile patch**：Web 组合把用户编辑持久化到 `$DSH_HOME/profiles/web/cordis.patch.yml`（`packages/bundle/web-app/README.md:91`）；仓库里每个 shipped preset 自己一份 patch 文件，按 manifest 顺序应用（`packages/bundle/web-app/README.md:123`、`package.json` 的 `dsh.bundle.patch`）。
- **会话开始后不能换**：session 已启动再选 preset 会被拒（`agent-preset/locked`），未知 id 与非法声明分别报 `agent-preset/not-found` / `agent-preset/invalid`（`agent-preset-registry/src/index.ts:207`、`:243`、`:353`）。
- **坏声明不会拖垮整棵名册**：激活失败被记成 `broken` 并告警，已有 Agent 保留它们正在用的组合（`index.ts:106`-`118`）。

## 声明、描述性清单与独立验收

Loader 从组合声明挂载子插件；描述「当前组合写了什么」的清单也应从同一声明生成，避免另存一份容易漂移的副本。实际注册到 Agent 的工具仍须通过挂载后的工具查询或请求记录核对。

**验收期望由需求拥有，必须独立于被测声明维护。** 如果从同一份 YAML 同时生成实际集合和期望集合，误删必需工具时两边会一起减少，测试仍能通过。验收时应区分以下证据：

| 要回答的问题 | 依据 | 能发现什么 |
|---|---|---|
| 当前声明了哪些插件 | 从组合生成的清单、boot-free dump | 声明内容与生成清单的漂移 |
| Agent 实际得到哪些工具 | 挂载后的工具集合、`request/header.tools` | 注册缺失、作用域错误、实际请求差异 |
| 产品必须保有哪些能力 | 独立维护的精确期望与验收场景 | 声明本身误删或误配了必需能力 |

原生 [Web 组合测试（文件名沿用旧名）](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/tests/web-agent-presets.e2e.ts#L288-L306)独立写明 `standard` 的精确工具集合，并排除依赖宿主 ripgrep 的 `glob` / `grep`；[minimal 测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/tests/web-agent-presets.e2e.ts#L347-L365)另行固定 prompt、`bash / read_image / working_directory` 与服务位置。必需能力发生有意变化时，声明和验收期望需要分别审查。

`--dump-config` 只提供 boot-free 的声明证据；它不证明会话实际取得的工具、模型如何选择工具或成果是否正确。各层证据的区别见 [`observation/07`](../completion-and-observation/07-evidence-layers-declaration-mount-mechanism-behaviour.md)。

## 失败面

| 现象 | 机制 |
|---|---|
| 改了 preset，正在跑的 Agent 没换组合 | 旧修订仍被引用；新的显式选择使用当前定义，省略 preset 的子代理继承父修订 |
| revision 与 skill 目录没变，加载的正文却变了 | revision 固定组合；磁盘正文在加载时读取，详见[skill 输入生命周期](../../tools-prompt-llm/07-skill-input-lifecycle.md) |
| 用户覆盖后内置新增行不见了 | 覆盖是整份子列表替换，不自动合入内置更新（`agent-preset-registry/README.md:99`） |
| preset 激活失败但名册里还在 | 失败定义保留可见（`agent-preset-registry/README.md:2`；`registry/src/index.ts:77`） |
| 以为 preset 能隐藏内部 worker | 没有 hidden 标志；`AgentPresetRow` 只有 `id/isDefault/name/description/broken`（`agent-preset-registry/src/types.ts:8`-`19`）；`order` 属于 `AgentPreset`（`preset.ts:4`-`10`），不在对外行类型里 |
| 以为 preset 能按 agent 过滤工具 | 定义里没有工具过滤字段；工具侧的 `toolFilter/persona` 配置已退役，加载即报迁移错误（`tool-subagent/src/index.ts:147`-`150`）；描述符里的历史 `toolFilter` 仍会在冷恢复时重放（`child-agent.ts:160`-`163`、`:217`） |

## 推论与模式（不是 DSH 的词）

- **描述性清单从声明派生**：生成器描述当前组合，运行时查询核对实际贡献；两者不能代替需求验收。
- **验收期望保持独立**：必需工具、scope 与 prompt 由产品要求固定，避免被测声明的错误同步进入期望。
- **revision 固定声明组合**：区分当前选择与父修订继承；动态 skill 正文等输入仍按各自机制更新。
- **运行期没有继承，所以重复是结构性的**：想消除重复只能在构建期做（模板/生成器），并且生成物要被回读校验；不要在运行期等一个不存在的 base。

## 常见误解

| 你以为 | 实际上 |
|---|---|
| 改声明会更新所有已有会话 | 已绑定 Agent 保留旧组合；动态输入另有生命周期 |
| preset 之间是继承树 | 每份自包含，组合是 join，不是继承 |
| 所有能力期望都必须从声明生成 | 描述性清单从声明生成；必需能力的验收期望独立维护 |
| 给子代理同名 preset 会跟随父的修订 | 显式给 id 挂当前修订；省略才继承父的精确修订 |

## 待证（不要写成已证）

- 生成器保真：注释、`!!js` 表达式、行序在“生成 → 回读 → 与 dump 比对”里能否逐字保持——需要一次原型。
- 名册/选择器在大规模 preset（数十个）下的可读性——属产品体验，不是引擎合同；触发条件是预设数超过一屏或出现误选报告。

## 源码入口

| 路径 | 一句话 |
|------|--------|
| `packages/preset/agent-preset/src/index.ts:9`-`29` | 定义 schema、eager 注册、`!!js` 保留 |
| `packages/preset/agent-preset-registry/src/index.ts:77`-`152` | 注册、激活、挂载、修订保留与回收 |
| `packages/preset/agent-preset-registry/src/definition.ts:5`-`11` | 定义字段全集（没有继承字段） |
| `packages/preset/agent-preset/README.md:12`、`:48`、`:78` | eager、身份、KV 稳定性 |
| `packages/preset/agent-preset-registry/README.md:46`、`:56`、`:93`、`:99` | 不扫目录、修订引用、覆盖语义 |
| `packages/core/session/src/types.ts:241`-`247` | `EpochHeader.tools`：会话实际工具面的持久记录 |
| `apps/cli/tests/dump-config-schema.expected.e2e.ts:355` | `--dump-config` 的 boot-free 声明面定位 |
| `packages/preset/agent-preset-registry/src/index.ts:195`-`207`、`:243`、`:353` | 名册/读取远程、未知/非法/锁定三类拒绝 |
| `packages/preset/agent-preset-registry/README.md:99`、`:60` | 重启后冷恢复使用该 id 的当前定义；旧修订不跨进程保留 |
| `packages/bundle/web-app/README.md:91`、`:123` | 用户编辑落点与 shipped preset 的 patch 文件 |
| `packages/bundle/web-app/presets/standard.patch.yml:6`-`127` | standard preset 的子行全貌（七类职责） |
| [Web preset 组合测试（文件名沿用旧名）](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/tests/web-agent-presets.e2e.ts#L288-L365) | 独立的精确工具、prompt 与服务位置期望 |
| [skill 正文更新测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/tool-skill/tests/tool-skill.spec.ts#L660-L684) | 目录不变时仍按需读取新版正文 |
