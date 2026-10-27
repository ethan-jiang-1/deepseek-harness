# 06 · 社区里作者们实际怎么做：五种模式与一个缺口

## 这一篇回答什么

DSH 的核心文档讲的是“平面与 API”；社区插件讲的是“作者怎么在缺口里活下来”。这一篇把 2026-10 能观察到的做法归纳成五种模式，指出它们各自对应哪种数据承诺，以及核心目前没有提供、作者只能自己补的那一块。**所有社区材料都是外部作者声明，未独立验证**；它们钉在不同 RC 版本上，不能当 API 合同。

## 观察范围与口径

- **目录规模**：dshbase 的插件目录页自称收录约 20,006 个插件；社区 awesome 目录（`imsai-sh/awesome-deepseek-harness-plugins`）自称 13,780 个，分类里 Memory 436、Tools 3994、UI 2638（目录页 2026-10-13 的快照）。数量只能说明“生态很大、记忆类很多”，不能当质量证据。
- **样本**：挑的是 README 里明确写了数据边界/存储位置的插件：`dsh-memory-snapshot`、`dsh-workspace-overlay`、`dsh-custom-workspace`、`harness-insights`、`deepseek-harness-plugins` 的渠道包。
- **性质**：作者自述 + 目录站描述；没有逐个安装验证，也没有审计代码。引用只用于“模式存在”，不用于“DSH 支持”。

## 五种模式

### 模式 A：纯引用（对应 P0）

**做法**：不建库，配置里列文件/目录路径；每次装配时读，内容留在原地。

**样本**：`dsh-memory-snapshot`。

- README 原话：“零依赖：无数据库、无服务、无写入通道，文档原地不动。”
- 跨工作区的关键提醒：“跨工作区生效请用绝对路径或 `~`——相对路径按 dsh 启动目录解析，会变成「每个工作区各找各的」。”
- 它把注入内容记进 Trajectory，保证“模型吃了什么”可审计。

**为什么有效**：没有迁移、没有清理、没有隐私副本；用户已有的 markdown 就是唯一真相。**代价**：不能写、不能保证格式、跨项目靠配置。

**给作者的启示**：如果你的插件只是“让模型看见用户已有的东西”，P0 是最便宜、最可信的起点；先别建表。

### 模式 B：只存派生（对应 P1）

**做法**：从会话日志/投影折叠出统计或索引；只持久化可重建的检查点，不存消息正文。

**样本**：`harness-insights`。

- README 声明只折叠 `assistant/message.usage`、provider/model、`tool/call.name` 与时间戳；
- “does not request session history in the browser, store message content, read API keys, or upload usage data”；
- 升级后从日志重建本地派生检查点；大历史渐进填充。

**为什么有效**：用户删会话，统计跟着变；升级可以重建；隐私面小。**代价**：依赖投影 API 稳定性，回填有成本。

**给作者的启示**：先问“能不能重算”；能重算的，别存成权威。

### 模式 C：项目内文件（对应 P2）

**做法**：把配置/数据写进项目目录，随项目走；作为输入读取，不写回。

**样本**：`dsh-workspace-overlay`。

- 为每个 canonical workspace 提供共享的 Cordis scope（`workspaceCordis`），同一 workspace 的 session/agent 租用同一个 scope；
- 可选地把 `<workspace>/.dsh/cordis.yml` 挂成该 workspace 的 composition，默认监听并热重载；`write()` 是 no-op，“workspace config 是输入，Loader teardown 永不写回”；
- 默认 `trustWorkspaceConfig: true`，也就是**会执行项目里的配置**；作者把信任开关做成了显式配置。

**为什么有效**：项目级配置跟着仓库走，用户可见可改；删除目录即删除配置。**代价**：仓库污染、执行项目配置的信任边界、多人协作冲突。

**给作者的启示**：项目内文件适合“用户要看见/带走”的东西；如果文件会被执行，必须把信任模型写进 README，并提供关闭开关。

### 模式 D：home + 项目键（对应 P3）

**做法**：宿主 home 里存按 workspace 切分的数据，键是 workspace 路径/标识。

**样本**：`dsh-custom-workspace`。

- README：每个 workspace 独立的外观设置，“Per-workspace persistence in `$DSH_HOME/settings.yaml`”；
- 因为“DSH does not expose third-party namespaces through its generic settings API”，作者注册了专用 `/custom-workspace` RPC，只接受 loopback；
- 当前 workspace 由“包含当前会话的 workspace”决定，回退到最近选择的 workspace。

**为什么有效**：不污染项目，跨会话记住，模型不可见。**代价**：孤儿、键漂移、换机器不带走、旧 settings 文件迁移。

**给作者的启示**：这是“用户不必编辑的账本”的默认做法；但键要用规范化路径，别用短命的 `workspaceId`（见 FAQ 25）。

### 模式 E：账号级配置 + 凭据（对应 P4）

**做法**：把平台凭据、默认工作区、账号开关放在 profile/环境变量；一个 Host 账户一份。

**样本**：渠道插件 monorepo（Feishu/DingTalk/WeCom/iMessage）。

- 每个渠道配置有 `defaultWorkspace`（会话落在哪个项目）与平台凭据；
- README 明确“Keep credentials in the local Harness profile or environment variables. Never commit secrets”；
- 配置中心是独立插件，运行时包各自安装。

**为什么有效**：一次配置，所有项目生效；凭据不进业务数据。**代价**：一个默认值套所有项目；多账号要自己设计。

**给作者的启示**：把“关于账号的”与“关于项目的”分开；秘密只存引用。

## 一个核心缺口：没有“每 workspace 一套插件实例”

`dsh-workspace-overlay` 的存在本身就是证据：核心的插件在 Host 启动时挂载一次，没有“打开项目 → 实例化插件 → 关闭项目 → 销毁”的生命周期。社区要 per-workspace 的 MCP 进程、工具面、配置，只能自己实现：

- 用 canonical path 做 lease key；
- 用 scope 隔离贡献；
- 最后一个 lease 释放时 dispose；
- 自己处理热重载、失败回滚、进程清理。

这带来两个后果：

1. **数据作用域与运行时作用域不是一回事。** 核心给你 session/workspace/home 的数据切分，但不给你 per-workspace 的运行时隔离；需要隔离的作者要自己搭（P5）。
2. **社区模式不是“标准答案”。** 它们是作者在缺口上的适配：有人选零依赖（P0），有人选项目文件（P2），有人自己造 scope（P5）。DSH 没有强制其中任何一种。

## 社区里反复出现的坑

| 坑 | 现象 | 对应本篇规则 |
|---|---|---|
| 相对路径按启动目录解析 | 跨 workspace 时“每个项目各找各的” | 项目键用规范化路径；路径用绝对/`~` |
| 把项目设置放账号配置 | 30 个项目共用一份 | P3/P4 分开 |
| 第三方 settings namespace 不可用 | 只能自定义 RPC/文件 | 配置用 Config；数据用 domain |
| 版本钉在旧 RC | 升级即坏 | 声明兼容范围；迁移自己写 |
| 执行项目内配置 | 信任边界不清 | 显式 trust 开关 + README |
| 卸载留数据 | 用户不知道删什么 | 写清数据位置与删除方式 |

## 对 DSH 的产品启示（作者视角）

1. **默认值应该是“不存”**：文档、示例、脚手架先教 P0/P1，再教 domain。
2. **给 per-workspace 数据一个一等写法**：现在作者要么写项目文件，要么在 home 里手搓路径键；一个“workspace 键”的约定（规范化路径 + 清理钩子）能省掉大量重复。
3. **settings 的第三方命名空间**：社区已经因此造了自定义 RPC；如果核心提供受控命名空间，会少很多私有协议。
4. **数据位置的可见性**：用户需要知道“我的东西在哪、怎么删”；插件 README 应有固定一节（DSH 的发布检查可以考虑）。
5. **卸载/迁移语义**：domain 不自动迁移是对的，但作者需要一份“迁移剧本”模板（见 02 篇）。

## 边界

- 社区样本只用于说明模式，不代表 DSH 官方推荐；其中 `settings.yaml` 的写法基于旧版本，当前 settings 已迁到 profile patch。
- 目录规模数字来自站点自述，未审计；插件数量不等于质量或安全性。
- `dsh-workspace-overlay` 的 scope/lease 机制是第三方实现，不是核心 API；引用它只说明“缺什么”。
- 没有对任何社区插件做安装、代码审计或数据行为验证。
