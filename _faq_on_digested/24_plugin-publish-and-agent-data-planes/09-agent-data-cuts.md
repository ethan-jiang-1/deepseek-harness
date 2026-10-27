# 09 · 智能体只读定义与数据：六种切法与推荐切法

## 一句话

最合理的切法不是把数据分成 workspace / home / session 三堆，而是先按**所有权**切、再用**可见性**做强约束、最后按**生命周期**决定删除。落到 DSH，推荐 **6 个平面 + 2 个旁路**：定义、代码、workspace、home、session、host state，加 cache 与 credentials。只读定义属于前两个平面；数据属于后六个，二者不共享目录、不共享写入通道。

## 1. 为什么“三归属”不够

workspace / home / session 是一个好的导航模型，但它把四个不同的问题压在同一张表里：

- **谁拥有**：项目、用户、会话，还是宿主？
- **谁能看见**：模型、用户、宿主，还是只有安全边界？
- **能活多久**：一次 turn、一次会话、一次安装，还是跨机器？
- **谁是权威**：定义、日志、文件、KV，还是可重建的缓存？

这会直接导致误放：

- 把宿主 KV 当成“home 数据”，于是直接写 `$DSH_HOME` 文件，绕过 schema 与变更事件。
- 把附件当成“session 文件”，于是按会话目录拼路径；实际上附件在 `$DSH_HOME/attachments/v1`，会话只持有引用。
- 把 workspace 记录当成项目文件，于是删除记录时以为删了目录。
- 把 cache 当成持久状态，清理缓存后行为改变。
- 把 credentials 当成普通配置，于是它进入 patch、日志或会话文本。

三归属回答的是“大致在哪”，不是“归谁、可见性、生命周期”。要做设计决策，需要更细的切法。

## 2. 六种切法

| 切法 | 回答的问题 | 最适合 | 单独使用会怎样 |
|---|---|---|---|
| 按所有权 | 谁能写、谁能删 | 市场、多租户、企业策略 | 单人本地使用会显得繁琐 |
| 按生命周期 | 一次 turn / 会话 / 安装 / 机器，活多久 | 缓存、日志、配置、卸载语义 | 生命周期模糊时（插件跨升级的数据）会卡住 |
| 按可变性 | 只读 / 只追加 / 可读写 / 可丢弃 | 内容寻址、回放、diff | 只按可变性切，容易把“配置”当“数据” |
| 按可见性 | 模型 / 用户 / 宿主 / 机密 | 隐私、egress、日志规则 | 过度分类会把普通元数据也变成秘密 |
| 按可移植性 | 可导出 / 可重建 / 仅本机 | 导出、迁移、共享 | 把 cache 或 secret 当成可导出 |
| 按租户 | 每安装 / 每 profile / 每 workspace / 每会话 | 多工作区、多用户、多 agent | 跨租户缓存与统计容易串 |

推荐组合不是“六选一”，而是：

- **主切法 = 所有权**：先决定谁写、谁删。
- **强约束 = 可见性**：再决定什么能进模型请求、什么能进日志。
- **文档切法 = 生命周期**：最后决定升级、卸载、清理时保留什么。
- **不要单独按可变性切**：可变性是所有权的结果，不是起点；把可变性当第一维，最容易产出“配置即数据库”。

## 3. 推荐切法：6 个平面 + 2 个旁路

| 平面 | 放什么 | 所有者 | 物理位置 / 服务 | 可变性 | 模型可见 | 生命周期 |
|---|---|---|---|---|---|---|
| **D 定义** | bundle patch、preset 行、Config 默认值、工具边界 | 包作者 / 部署者 | `package.json` + patch + preset | 只读（按 revision） | 间接（决定工具/提示词） | 随包/层版本；已有 Agent 钉住 revision |
| **C 代码** | 插件模块、`./client`、provider 代码 | 包作者 | 包目录 | 只读（随版本替换） | 间接 | 随安装/升级；link 指向 checkout |
| **W workspace** | 项目文件、项目 `AGENTS.md`、`.dsh/skills`、`.agents/skills` | 项目 | 会话工作目录及其项目根 | 可读写 | 按需（工具读取/指令链） | 随仓库；用户自己管理 |
| **U home** | 用户 `AGENTS.md`、`$DSH_HOME/skills`、`~/.agents/skills` | 用户 | `$DSH_HOME` + `~/.agents` | 可读写 | 按需（指令链/技能） | 跨项目；升级 DSH 不应清掉 |
| **S session** | 事件日志、preset 选择、附件引用 | 会话 | `$DSH_HOME/sessions/...` + `ctx.sessionPersistence` | 只追加 | 是（会话内容） | 随会话；无删除 API |
| **H host state** | workspace 记录、会话旁路元数据、插件 KV | 宿主 / 插件 | `$DSH_HOME/storages` + `ctx.storageDomain` | 可读写（schema 校验） | 否（除非消费者显式渲染） | 跨重启；版本不匹配拒绝打开 |
| **K cache** | 请求图片缓存、解析结果、临时产物 | 运行时 | `$DSH_HOME/cache` + `dshCachePath` | 可读写、可丢弃 | 否 | 随时可清；清了应能重建 |
| **X credentials** | token、API key、OAuth grant | 用户 | `$DSH_HOME/.credentials.yaml` + 凭据服务 | 可读写（受权限保护） | 否 | 用户撤销；不进日志/导出 |

为什么把 H / K / X 单独拿出来：

- **H 与 U 物理上都可能在 `$DSH_HOME` 下，但权威不同。** U 是用户可见的文件与技能；H 是 schema 校验、写后持久、变更事件的 KV，模型看不见。把 H 当 U 会绕过 schema 和迁移规则。
- **K 与 H 都是“跨重启”，但 K 可重建。** 把 K 当 H 会让清理缓存变成数据丢失；把 H 当 K 会让重启丢状态。
- **X 与 U 都是用户数据，但安全边界不同。** X 不进 patch、locale、README、会话文本；每次操作重新解析，不跨操作缓存。

**settings 不在 U 行里。** 它是 profile 作用域的状态/配置，写当前 profile 的 `cordis.patch.yml`，不是账号作用域；换 profile 就是另一份配置。跨 profile 共享的偏好要用 home 域单例，不能指望 `Config`。

**投影不是 S 的权威数据。** `ctx.sessionProjections` 从日志派生，是可重建的读模型；日志才是模型可见历史的权威。不要把它当第二份日志。

投影和索引属于派生层；6+2 不把它们单列（K 只列可丢弃缓存），用 `ctx.sessionProjections` / `ctx.sessionQuery` 读取。

**附件、spill、导出不是新增平面。** 附件在 `$DSH_HOME/attachments/v1`，内容寻址、不可变、本地后端不自动 GC；spill 默认在 OS 临时目录，启动后一次性清理（`cleanupPeriodDays`）；`present` 只记路径，不复制字节。它们是产物/临时旁路，发布数据测试时要单独看。

## 4. 每个平面的不变量

### 4.1 D 定义：不携带数据，不在原地改写

- 定义可以包含：persona、prompt section、工具白名单、技能集、策略、Config 默认值、子插件行。
- 定义不能包含：用户数据、secret、机器绝对路径、按用户变化的值、时间/缓存/计数器。
- 定义的变化方式是**新的 bundle patch / 新的 preset 行 / 新的 revision**，不是运行时写回。
- 覆盖是整段替换：覆盖者要重述 `id`、`plugins`、`name`、`description`、`order` 和所有想保留的字段。
- 已有 Agent 钉住启动时的 revision；新 Agent 用当前定义；进程重启按当前定义恢复，定义缺失则拒绝。

### 4.2 C 代码：包目录只读

- 包目录会被升级整体替换；`files` 会裁剪；link 安装直接指向 checkout。
- 不要在 `import.meta.url` 旁边写 `data/`、`cache/`、日志或用户配置。
- 包内资源（skill、模板、locale、icon）是只读资产，不是用户数据；需要可编辑就放 W 或 U。
- 代码与定义可以同包，但它们的版本契约不同：代码是入口/导出/依赖；定义是行 id/preset id/Config 键。

### 4.3 W workspace：项目拥有，随仓库走

- 项目事实、项目流程、项目指令放这里；可以提交、review、随分支变化。
- 项目技能根是 `<projectRoot>/.dsh/skills`（rank 100）与 `<projectRoot>/.agents/skills`（rank 200）。
- 项目根是最近的 `.git` 祖先；没有就用当前目录。
- 工作目录是**会话级**状态，不是进程 cwd；插件用 `ctx.workingDirectory.get(session)` 或会话投影，不要用 `process.cwd()`。
- 项目移动/改名不会搬会话日志；会话成员身份锚定创建时的 cwd。

### 4.4 U home：用户拥有，跨项目

- 用户全局指令 `$DSH_HOME/AGENTS.md`、共享 `~/.agents/AGENTS.md`；用户技能 `$DSH_HOME/skills`、`~/.agents/skills`。
- `~/.agents` 故意在 `$DSH_HOME` 之外，因为别的 agent 工具也读它；不要把两者合并。
- 插件**不要静默追加**全局 `AGENTS.md`；这等于给未来所有会话注入提示词。用户显式动作，或写到单独可审阅文件。
- settings 不属于 U 的内容家数据；它是 profile 作用域的配置，写当前 profile 的 `cordis.patch.yml`。启用/禁用、默认 preset 选择等可变选择不应写进包或 preset 定义。

### 4.5 S session：模型可见内容的唯一真源

- 对模型可见的会话内容，日志是唯一真源；fork、resume、replay、compaction 都从日志派生。
- 只追加；历史格式以不可变世代保留，读取时迁移，写时发布后继，不覆盖源文件。
- 没有删除 API；日志会累积到外部清理。插件不要把“归档会话”实现成删日志。
- 附件引用在事件里，但对象在 `$DSH_HOME/attachments/v1`，内容寻址、不可变、不自动 GC；删日志不会回收附件。
- **第三方不要新增 session event 类型。** 未知事件只有带 `ignorable: true` 才被读取方接受，而 live `Session.append()` 不能设置它；缺少声明插件的读取方会拒绝重开会话。用已有事件、投影、`agent.inject()` 或 storage；`plugin:` 记录只限 DSH 实验包。`@messageProjection` 是内部更强契约，不是第三方的安全替代。
- 不要用 `session/event` 监听 + 全量重扫维护状态；用 `ctx.sessionProjections` 的纯函数 fold。

### 4.6 H host state：schema 校验的 KV，不是日志

- 适合跨重启、但不属于会话日志的宿主状态：workspace 记录、会话旁路元数据、插件自己的配置缓存。
- 读是同步的、来自已验证内存；写先落盘再改内存，然后发 `domain/changed`。
- 打开时校验全部记录；坏记录 `invalid-record`；版本不匹配 `version-mismatch`；同一 domain 多消费者 `already-open`。
- 不产生工具、prompt 或 session event，所以模型看不见；要让模型看见，必须由消费者显式渲染，并留下会话事件。
- domain 名与 schema 是包级契约；改 schema 要自己迁移。
- domain 不是“插件数据根”：没有 per-plugin 目录、配额、作用域、卸载清理；项目级切分靠记录键，不能按 workspace 建 domain。

### 4.7 K cache：可丢弃，不是权威

- 请求图片缓存、解析结果、临时产物、可重建的索引放这里。
- 用 `dshCachePath`，不要自己拼 `~/.dsh/cache`。
- 清理缓存不应改变用户可见状态；如果会，那它其实属于 H 或 W。
- 缓存键要包含影响结果的版本/配置；缓存失效要能重建。

### 4.8 X credentials：不进定义、不进日志、不导出

- 配置里只放引用（如 `apiKeyEnv`），每次操作重新解析，不跨操作缓存。
- `!!js` 引用既有凭据可以；复制明文不行。
- 凭据文件按权限管理，不是隔离边界；agent 的工具进程以你的 OS 用户运行。
- 不把 secret 写进 patch、locale、README、会话文本、测试 fixture。

## 5. “状态”到底放哪：六类状态与五个判定问题

| 状态 | 典型例子 | 推荐落点 | 不要放 |
|---|---|---|---|
| 对话状态 | 用户消息、工具结果、压缩摘要、preset 选择 | S 会话事件/投影 | 模块全局、cache |
| Agent 工作状态 | 当前计划、临时中间结果、待办 | 投影/内存（随 Agent 释放）；跨 turn 则写事件 | storage domain（模型看不见） |
| 宿主跨会话状态 | workspace 记录、会话旁路元数据、插件配置缓存 | H storage domain | 包目录、`$DSH_HOME` 手写文件 |
| 项目状态 | 项目文件、项目技能、项目指令、生成物 | W workspace | home、session |
| 用户偏好 | 默认 preset、启用项、界面偏好、全局规则 | settings 走 profile 配置；`AGENTS.md` / skills 走 U home | preset、包、session |
| 机密 | token、API key、OAuth grant | X credentials | 任何可导出/可记录的位置 |

再问五个判定问题：

1. 模型必须看见吗？是 → S；否 → 继续。
2. 跨重启吗？否 → K 或内存；是 → 继续。
3. 跟项目绑定吗？是 → W（文件）或 H（项目记录）；否 → 继续。
4. 用户要能读/改吗？是 → U；否 → H。
5. 是 secret 吗？是 → X；否 → 按上面结果。

## 6. 只读定义的边界

“只读”不是说用户永远不能定制，而是说**已发布的声明不在原地被改写**。判断某个东西该不该进 preset：

| 该进 preset | 不该进 preset |
|---|---|
| persona / 系统提示前缀 | 用户数据、项目路径、绝对路径 |
| 工具白名单 / 工具子集 | secret、token、API key |
| 技能集与技能根（按 agent 定制） | 每个用户不同的值 |
| prompt section / 策略 | 时间、计数器、缓存、临时状态 |
| Config 的默认值 | 频繁变化的提示词长文 |
| 子插件行（provider/consumer） | 平台/机器相关的分支（除非 `!!js` 配置且可解释） |

变化路径：

- 新增/覆盖 preset → bundle patch 里 insert 一行，或按 `preset-<id>` 覆盖整段 `config`。
- 已有 Agent → 保持旧 revision，不中途换工具/提示词。
- 进程重启 → 按当前定义恢复；定义被删则拒绝恢复。
- 覆盖 → 完整 `plugins` 列表，不是增量；未来上游新增的子行不会自动合并。

## 7. 其他切法及适用场景

| 场景 | 推荐切法 | 理由 |
|---|---|---|
| 小工具、单会话 | 3 平面：D+C / W / S | 不需要跨项目状态；定义与代码作为一个交付组，项目与会话够了 |
| 团队插件、跨项目经验 | 4 平面：D+C / W / U / S | 加 home，让用户技能与全局指令有位置 |
| 有项目列表/会话分组的宿主 | 5 平面：D+C / W / U / S / H | workspace 记录、旁路元数据需要 KV |
| 需要缓存/凭据的生产插件 | 6+2：+ K / X | 缓存可丢弃，secret 独立 |
| 多租户/多用户 | 6+2 + 每租户 `$DSH_HOME` | 租户边界先于插件边界；不要共享 home |
| 外部语义记忆 | 6+2 + 外部 memory 服务 | 记忆是外部服务，不是新平面；模型经工具读取 |
| 临时/沙箱环境 | C / W（只读）/ S / K | 不落 home；会话日志仍权威 |
| Desktop 隔离实验 | 6+2 + 独立 `DSH_HOME` | 可执行侧天然隔离，数据侧默认共享；换 home 才隔离 |

**为什么小插件不推荐 6+2**：多出来的平面需要服务、schema、清理与测试。3 平面能覆盖“包只读、项目可写、会话可回放”时，不必为了形式完整加 H/K/X。切法是工具，不是成熟度徽章。

## 8. 反模式与迁移

| 反模式 | 症状 | 迁移到 |
|---|---|---|
| 写 `import.meta.url` 旁边的 `data/` | 升级丢失、`files` 裁剪、多 profile 各一份 | H storage domain 或 W 文件 |
| 模块级 `Map` 当会话缓存 | 多会话串、HMR 不清理、卸载泄漏 | S 投影 / `ctx.effect` 清理 |
| 把 `Config` 当数据库 | 配置越来越大、无法迁移、覆盖丢字段 | Config 只放可调值；状态进 H/W/S |
| secret 写进 Config 默认值 | patch 分享即泄漏 | X 凭据引用 |
| 把会话日志当语义记忆 | 日志无限增长、检索靠重扫、压缩后丢失 | U/W 的 skill/AGENTS.md，或外部 memory |
| 直接写 `$DSH_HOME` 下的自造文件 | 绕过 schema、迁移、变更事件 | H storage domain；用户可见内容才进 U |
| 删除日志实现“归档” | 历史不可恢复 | 隐藏/归档会话记录，不删日志 |
| `process.cwd()` 当会话目录 | working_directory 改了还读旧目录 | `ctx.workingDirectory.get(session)` |
| 把用户偏好写进 preset | 每个用户一份定义、升级冲突 | profile settings / 用户 patch |
| 以为 `assets/skills` 会自动发现 | 装上后技能不出现 | 包内 provider 注册，或 `bundledSkillDir` 显式配置 |

迁移顺序建议：

1. 先列出插件当前读写的每个路径/键，标上“谁写、谁读、活多久、是否 secret”。
2. 把包目录里的可变数据搬到 H 或 W；只读资产留在 C。
3. 把模块级可变状态搬到 S 投影或 H。
4. 把 secret 搬到 X，配置只留引用。
5. 在 README 的 Data 节写清新位置与升级/卸载行为。
6. 加数据隔离测试（见 [07 篇](./07-testing-and-acceptance.md)）。

## 9. README 的 Data 节模板

```markdown
## Data
- Reads: `<workspace>/...` through ctx.fs; project instructions through the agent-instructions chain.
- Writes: workspace files under `<project>/.acme/`; no writes to the package directory.
- Host state: storage domain `acme.review`, version 1 (workspace records / sidecar metadata).
- Session: derives from existing `tool/result` events; no custom event type.
- Home: none; no global AGENTS.md or skill writes.
- Cache: `dshCachePath('acme')`, safe to delete.
- Secrets: credential reference `acme.token`; never logged or exported.
- Upgrade/uninstall: workspace files and host state remain; cache may be cleared.
```

最后一行尤其重要：用户需要知道“卸载后什么还在、什么需要手动清”。

## 10. 结论

**最合理的切法是按所有权切、按可见性强约束、按生命周期文档化；推荐 6+2 平面。** 只读定义属于 D/C，数据属于 W/U/S/H/K/X；两边不共享目录与写入通道。三归属可以作为给用户看的导航图，但不能作为插件作者的实现模型：它没有回答“谁写、谁看、活多久、谁是权威”。

把这四个问题答清楚，智能体的“只读部分”和“数据部分”就不会长在一起；剩下的只是把每个选择写进 README、测试和迁移说明。

把 6+2 落到一个具体插件上的开发顺序、数据卡、原生能力地图与评审清单，见 [10 篇](./10-data-design-advisor.md)。

## 11. 证据

- 路径与根：[home-paths README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/util/home-paths/README.md)、[skill-filesystem README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/skill/skill-filesystem/README.md)、[agent-instructions README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/context/agent-instructions/README.md)
- 会话与工作目录：[session-persistence-jsonl README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/session/session-persistence-jsonl/README.md)、[working-directory README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/session/working-directory/README.md)
- 宿主状态：[storage-domain README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/storage/storage-domain/README.md)、[workspace README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/workspace/workspace/README.md)
- settings 作用域：[settings README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/settings/settings/README.md)
- 附件、spill 与导出：[attachment-local README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/attachment/attachment-local/README.md)、[spill-local README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/spill/spill-local/README.md)、[deliverables README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/deliverables/tool-present/README.md)
- 凭据：[credentials-local README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/credentials/credentials-local/README.md)
- 沙箱：[base cordis.patch.yml](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/bundle/base/cordis.patch.yml)、[sandbox 文档](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/defensive-patterns/README.md)
- 定义与 revision：[agent-preset README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/preset/agent-preset/README.md)、[agent-preset-registry README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/preset/agent-preset-registry/README.md)
- 相邻问题：[05 篇的路径表](./05-data-planes.md)、[04 篇的 preset 生命周期](./04-readonly-agent-definition.md)
