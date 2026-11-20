# 01 · 从定义到会话：配置在哪生效？

## Preset 是一份子插件组合

preset 的定义包含身份、可选展示信息与 `plugins` 列表。列表里的 persona 贡献身份指引，工具插件贡献可调用能力，skill provider 贡献技能发现路径；共享的 Agent loop、会话和注册中心等通常由 Host 应用组合提供。源码入口是[声明插件](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/src/index.ts#L8-L29)。

配置中要区分两种 ID：外层 Loader 行的 `id` 用于 patch 寻址，内层 `config.id` 是会话选择并记录的 preset 身份。目录名叫 `presets/vp-eng` 是 company-pack 的组织约定；注册表不会因为发现该目录就自动加载它，bundle 的 patch 声明才把定义带入 profile。

| 配置位置 | 含义 | 维护后果 |
|---|---|---|
| 声明行的 `id` | Loader 修改目标 | 改错可能没有覆盖原行 |
| `config.id` | preset 身份 | 旧会话恢复与委派引用依赖它 |
| `config.plugins` | 完整子插件列表 | 覆盖时整块替换，不自动合并内置列表未来的改动 |
| 子行 `name` | 插件模块 | 安装产物需要能解析到它 |
| 子行 `config` | 该插件参数 | 由该插件的运行时 Config 校验 |

下面摘录原生声明结构并换成说明用名称，仅用于理解层次；本轮没有安装或执行这个示例，不能把它当作包含完整工具、策略与依赖的成品 preset。

```yaml
- insert:
    - id: preset-review
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: review
        name: Review
        plugins:
          - id: persona
            name: '@deepseek-ai/dsh-persona'
            config:
              prefix: You review evidence and identify missing sources.
```

`preset-review` 是 patch 寻址，`review` 是会话选择身份，`persona` 是子插件行。这个声明没有提供读文件、加载技能或写报告的工具；即使身份文字要求审查证据，也不能据此推断角色拥有这些能力。为它增加真实任务前，应先明确能力和验收。

这些规则见[声明字段说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/README.md#L40-L48)和[编辑组合指导](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md)。本篇不提供未经本轮安装验证的可复制安装脚本；已有 company-pack 是实际走查对象，安装与发布细节另见[插件发布专题](../24_plugin-publishing-and-data/answer.md)。

## 配置正确性并非一个检查时点

Schemastery 先验证声明本身：例如 `id` 是必填字符串，`plugins` 是必填数组。这里不是递归证明所有工具参数正确；注册表继续检查条目结构，Loader 和 Cordis 加载各子插件并调用各自校验器。

当前注册过程会提前建立并激活该定义对应的组合（revision）的子树。因此“所有子插件都等第一次创建会话才校验”不是当前机制。真实会话创建仍有价值：它继续检查具体 Agent 的绑定、目标引用、可见能力与产品入口。company-pack 脚本中的早期事故说明应与当前实现分开读。

| 阶段 | 当前主要检查 | 还需要继续验证 |
|---|---|---|
| 声明加载 | 顶层 Config、非空及重复身份 | 子树能否装配 |
| 注册时激活 | 条目结构、模块导入、配置、启动及服务泄漏审计 | Host 服务就绪后的状态 |
| 读取与绑定 | 等待 Host Loader 稳定后重新审计等待依赖的行；拒绝 missing/broken 定义 | 针对具体 Agent 安装的引用与能力 |
| 委派工具进入 Agent | 目标 preset 引用存在，按该工具规则安装可用选择 | 目标实际装配及 provider 支持条件 |
| 模型请求与执行 | 各消费者组装提示词和工具，执行时按策略处理调用 | 模型是否正确完成任务 |

具体检查见[registry](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L81-L145)、[子树审计](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/mount.ts#L134-L158)及[委派选择](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/tool-subagent/src/preset-selection.ts#L53-L96)。某些元数据读取只检查声明存在，不代表目标可激活；实际绑定还会拒绝 broken 定义。

导入或激活失败的定义可以保留在名册中显示诊断，健康 preset 与 Host 仍可运行。暂时等待 Host 服务的行会保留并重新审计，不能把启动顺序造成的等待一概叫永久损坏。另一方面，禁用行不参与激活失败审计，兼容策略也可能禁用某行；“名册无 broken”不等于全部宣称能力已经启用。

## 同一个 preset，运行中的 Agent 使用哪一版？

revision 是一次定义对应的活跃组合。它由注册表提前激活，并被选用它的多个 Agent 共享；不是每次会话都重新运行全部插件启动代码。更新定义会退役旧 revision，但只要仍有 Agent、子 Agent 或读取引用保留它，旧组合就继续存在。最后一个引用释放后才清理。[保留与释放实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L148-L158)。

| 情况 | 采用的组合 | 验证时注意什么 |
|---|---|---|
| 确实创建并绑定新的 Agent | 当前可用定义 | 排除界面复用已有空白草稿的情况 |
| 原进程中继续运行旧 Agent | 它保留的旧 revision | 旧工具仍在不代表新定义没有发布 |
| 默认继承组合的新 child | 父 Agent 的确切 revision | 不是只按父 preset ID 找最新版 |
| 显式选择独立 preset 的 child | 目标的当前定义 | 即使 ID 与父相同，也可能是不同 revision；还需通道支持 |
| 进程重启后的普通会话恢复 | 记录的当前 preset 身份所对应的现定义 | 旧实现不会跨重启保留，缺定义不会静默换成默认 |

子会话独立选择与继承的对照测试见[activation-presets](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/tests/activation-presets.spec.ts#L144-L159)。独立选择也不等于任意 fork 可换组合；通道是否继承父上下文、provider 是否支持都有限制。冷恢复子会话还有独立选择标记与历史兼容规则，精确细节留在[运行时研究](./research-runtime.md#4-child-composition省略与显式同-id-不能互换)。

会话记录不只有创建时 header：空白会话可以选择 preset，选择事件更新当前身份投影。第一轮开始后即锁定选择，轮次结束变为空闲也不重新允许切换。验证更新时宜用明确的新会话身份，不能仅看“点了一次新建”。依据见[选择实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L341-L367)和[会话入口复用逻辑](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/agent.ts#L459-L547)。

## 组合保留，不代表所有输入被冻结

磁盘 skill 的目录元数据与正文有不同生命周期：目录发现生成 catalog，加载正文时重读当前文件；watcher 和失效机制可以让增删及元数据变化到达后续模型步骤。之前已加载进会话历史的旧文本不会因此被抹去。依据见[skill-filesystem](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/README.md#L34-L85)。

这意味着可复现性需要记录多种输入：产品与 DSH 版本、preset 身份、方法正文、关键事实、模型和部署配置。仅写“使用 vp-eng”无法充分解释两次任务结果差异。方法或事实改变时应单独验收，不能假定旧 revision 提供内容快照。

persona 也可能影响其他指引是否进入上下文。例如原生 persona 的 `complete` 和 `includeRuntimeContext` 会改变其他提示词部分的组装；只检查工具插件安装不足以证明工具使用指导实际可见。[persona 实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/persona/src/index.ts#L29-L74)。

## 进阶查阅：可见性、服务实例与执行权限分别验证

scope 控制工具、提示词等注册贡献对哪个 Agent 可见；`isolate` 控制服务实例的选择。preset 自带服务时，provider 与消费者需要放在同一隔离 group；普通 `agent.ctx` 查服务不会自动追随任意子行隔离。被 Host 消费的服务应放在 Host 组合中。依据见[注册表的服务放置说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md#L56-L60)。

这些机制都不构成安全沙箱：插件和 YAML 表达式可以执行 Host 代码。角色说“只读”、skill 说“禁止写入”、工具没有显示在某次 catalog、操作系统拒绝实际写入，是不同性质。company-pack 的验证者与 researcher 需要按其全部实际能力和部署权限判断，不能只认一个字段或一句 persona。[下一篇](./02-company-pack-evidence.md)沿实际案例说明怎样取证。

> 核验状态见[核验基线登记](../00-baseline.md)。
