# 05 · 数据层：workspace、home、session 三种归属

## 一句话

数据不属于插件包，它有三个所有者：**workspace**（跟当前 working folder 有关）、**home**（与 folder 无关的用户全局）、**session**（一次会话的日志与投影）。插件只能通过服务访问它们；把数据写进包目录、模块全局或自造事件类型，都会在升级、重放或多会话并发时坏掉。

![数据地图](./figures/05-data-map.svg)

## 1. 三种所有者

| 所有者 | 回答的问题 | 典型内容 | 生命周期 |
|---|---|---|---|
| workspace | 这个项目里有什么 | 工作目录文件、项目 `AGENTS.md`、项目技能 | 随仓库/目录；用户自己管理 |
| home | 这台机器上的用户是谁、积累了什么 | 全局指令、用户技能、宿主 KV、凭据、profile | 跨项目、跨会话；DSH 升级不应清掉 |
| session | 这一次对话发生了什么 | 会话日志、投影、附件引用、preset 选择 | 随会话；只追加 |

`$DSH_HOME` 默认 `~/.dsh`，可用环境变量覆盖；共享 agents 根默认 `~/.agents`，可用 `DSH_AGENTS_HOME` 覆盖。两者都是用户数据根，不是插件安装目录。

## 2. workspace：跟当前 working folder 有关

### 2.1 工作目录不是进程 cwd

每个会话有一个**有效工作目录**，默认是启动目录，可通过 `working_directory` 工具或 SDK 修改。它是会话级状态，不是进程级状态；已有 shell 进程保留自己的目录。改目录会提交事件、进入 user context，并在下一次请求前重新加载适用的项目指令链。

所以插件里**不要用 `process.cwd()` 代表会话工作目录**。要读当前目录，用 `ctx.workingDirectory` 或会话投影；要解析相对路径，以该目录为基准。

### 2.2 项目根与指令链

项目根是最近的、包含 `.git` 的祖先；没有就用当前目录。`dsh-agent-instructions` 加载的链是：

1. `$DSH_HOME/AGENTS.md`（用户全局）
2. `<agentsHome>/AGENTS.md`（共享全局）
3. 项目根到会话工作目录之间每一级的 `AGENTS.md` / `CLAUDE.md`（broad → specific）
4. 同目录的 `AGENTS.local.md` / `CLAUDE.local.md`（可选覆盖）

内容是**durable baseline message**：第一次请求注入，之后按需刷新；有字节预算，超预算先丢更宽的整文件，再截断最具体的文件。它不是系统提示的一部分，而是普通的 sourced user message，所以能重放、压缩、恢复。

对插件作者的含义：项目级“经验”可以通过这条链进入模型，**不需要也不应该由插件自己拼一段提示词**。插件若要贡献全局规则，应该发布 skill 或让用户写 `AGENTS.md`，而不是在代码里硬编码一段“项目约定”。

### 2.3 项目级技能

| 根 | rank | 说明 |
|---|---|---|
| `<projectRoot>/.dsh/skills` | 100 | DSH 专用项目技能 |
| `<projectRoot>/.agents/skills` | 200 | 与其他 agent 工具共用 |

技能格式是 `<name>/SKILL.md` 或 `<name>.md`，必须在根目录顶层；嵌套 `**/SKILL.md` 故意不发现。frontmatter 必填 `name`（kebab-case）与 `description`，可选 `whenToUse`、`metadata`、`disable-model-invocation`、`user-invocable`。

项目技能的所有权是项目：可以提交、可以 review、可以随分支变化。插件不应该往这里写东西；如果插件需要“项目级状态”，应该让用户显式创建文件，或通过 storage domain 存宿主状态。

### 2.4 workspace 记录不是文件管理器

`dsh-workspace` 维护的是“项目列表 + 每个目录下的会话分组”，不是文件本身。删除一个 workspace 记录不会删除目录，也不会删除会话历史；隐藏会话只是不参与分组。插件不要把“删除项目”实现成“删目录”。

## 3. home：与 folder 无关的用户全局

`$DSH_HOME` 下与插件作者最相关的内容：

| 路径 | 内容 | 插件怎么用 |
|---|---|---|
| `AGENTS.md` | 用户全局指令 | 不要写；让用户维护 |
| `skills/` | 跨项目技能，rank 400 | 不要写；插件只读/发现 |
| `storages/` | 宿主 KV 后端根 | 通过 `ctx.storageDomain`，不直接读写文件 |
| `.credentials.yaml` | 凭据引用 | 通过凭据服务；不要读文件 |
| `sessions/` | 会话日志 | 通过 `ctx.sessionPersistence` |
| `attachments/v1/` | 附件 | 通过 attachment 服务 |
| `profiles/<name>/` | 组合与依赖 | 不要手写；用 `dsh plugin` / `plugin_manager` |
| `cache/` | 缓存 | 通过 `dshCachePath`，可清理 |
| `cordis.patch.yml` | 机器级覆盖层 | 用户维护；插件不应改 |

共享 agents 根（`~/.agents`）是另一种全局：它的 `AGENTS.md` 与 `skills/` 故意放在 `$DSH_HOME` 之外，因为别的 agent 工具也读它。DSH 不会把它当成自己的私有目录。

### 3.1 宿主 KV：storage domain

`ctx.storageDomain` 提供 schema 校验、写后持久、变更事件的 KV domain。它适合“必须跨重启、但不属于会话日志”的宿主状态：工作区记录、会话旁路元数据、插件自己的配置缓存等。

关键语义：

- 读是同步的、来自已验证的内存；写先落盘再改内存，然后发 `domain/changed`。
- 每个 domain 有一条写链，`put` / `delete` / `update` 不交错。
- 打开时校验全部记录；坏记录会以 `invalid-record` 拒绝打开，而不是静默跳过。
- 它**不产生工具、prompt 或 session event**，所以模型看不见；要让模型看见，必须由消费者显式渲染。
- 句柄生命周期归调用方；插件卸载时用 `ctx.effect` 的 disposer `close()`。

这不是“插件的私有数据库”。domain 名字与 schema 是包级契约；多个消费者打开同一 domain 会得到 `already-open`。

## 4. session：一次会话的日志

### 4.1 日志是唯一真源

模型看到的任何东西都必须能从已提交的会话事件重建。fork、resume、replay、compaction 都从日志派生。插件内存里的状态只是派生缓存，进程一退就没了。

因此：

- 要让模型看见的状态 → 写成会话事件（优先用已有事件类型与投影），或在请求前通过 `agent.inject()` 注入并留下事件。
- 只是宿主自己用的状态 → storage domain。
- 不要新增自定义 session event 类型：读取方只接受带 `ignorable: true` 的未知事件，而 live `Session.append()` 不能设置该标记，会话会拒绝重新打开。`appendPluginRecord()` 写 `plugin:` 记录，但保留给 DSH 实验包，且会话格式迁移只尽力保留。
- 不要用 `session/event` 监听 + 全量重扫来维护状态；用 `ctx.sessionProjections` 的纯函数 fold，未变化时返回同一引用。

### 4.2 目录布局

```
$DSH_HOME/sessions/
  --<normalized-cwd>--/          # 可读的项目目录，或 _no-cwd/
    <encoded-id>/                # 会话自己的目录
      <generation files>         # 只追加的 JSONL 世代
```

项目目录名让日志可导航；cwd 归一化后相同的会话共享项目目录，但会话 id 仍然唯一选择目录。历史格式以不可变世代保留，读取时迁移，写时发布后继，不覆盖源文件。

**这解释了“数据跟 working folder 有关”的一半**：日志物理上住在 home，但按会话创建时的 cwd 分组。项目移动不会搬日志；日志仍在旧项目目录名下。插件不应该依赖这个路径做业务逻辑。

### 4.3 附件

浏览器草稿可能只在内存；一旦 host 接受用户消息，图片会在写 user event 之前移动到 `$DSH_HOME/attachments/v1`。规则是“先持久化，再写事件”。插件处理附件时应通过 attachment 服务取引用，不要自己拼路径。

## 5. 八条数据规则

**R1 · 包目录不是数据目录。** 安装与升级是 remove + install，包目录会被替换；`files` 会裁剪；link 安装又直接指向 checkout。写进包目录的用户数据没有持久性契约。

**R2 · 一个事实一个家。** 项目事实放 workspace，用户全局事实放 home，会话事实放 session。不要为了“方便”在三处各存一份。

**R3 · 模型可见 ⟺ 可从日志重建。** 任何进入模型请求的东西都必须能从已提交事件重建；否则 fork/replay 会得到不同结果。

**R4 · 不造新事件类型。** 用已有事件、投影、`agent.inject()` 或 storage。`plugin:` 记录是实验通道，不是通用扩展点。

**R5 · 宿主状态用 storage domain，不用模块全局。** 模块级 `Map`、`globalThis`、`Symbol.for` 都隐藏了所有者；多会话、多 profile、HMR 下会串。

**R6 · 路径必须显式。** 用 `resolveDshHome()` / `resolveAgentsHome()` / `ctx.workingDirectory`，不要把 `~/.dsh`、`process.cwd()` 或绝对路径写死。部署会用 `DSH_HOME` 换根。

**R7 · 经验放技能根或 AGENTS.md，不放包。** 包只发只读的、与版本绑定的知识；可编辑经验属于项目或用户。

**R8 · secret 走凭据，不进 patch、locale、README 或会话文本。** `!!js` 引用既有凭据可以；复制明文不行。

## 6. 选路径的决策树

```text
这份数据是模型必须看见的吗？
├── 是 → 它属于这次会话 → 写成会话事件/投影，或经 agent.inject 注入
└── 否 → 它需要跨重启吗？
    ├── 否 → 内存缓存即可，但要有所有者与清理
    └── 是 → 它跟当前项目绑定吗？
        ├── 是 → 用户可见的项目文件（workspace），或项目级技能
        └── 否 → 宿主 KV domain（home），或用户级技能/AGENTS.md
```

再问两个问题：

- **换一台机器还要吗？** 要 → home；不要 → workspace 或 session。
- **升级插件后还要吗？** 要 → 绝不能放包目录；不要 → 也不要放包目录，放缓存并声明可清理。

## 7. 生命周期：什么会动，什么不会

| 操作 | workspace 文件 | home 数据 | session 日志 | 包目录 |
|---|---|---|---|---|
| DSH 升级 | 不动 | 不动 | 可能读旧格式并写后继世代 | 替换 |
| 插件升级 | 不动 | 不动 | 不动 | 替换；模块代需要重启 |
| 移除 bundle | 不动 | 不动 | 不动 | 从 profile 依赖中移除，文件可能残留 |
| 禁用 bundle | 不动 | 不动 | 不动 | 依赖仍在，只是不选层 |
| 项目移动/改名 | 路径变 | 不动 | 仍在旧 cwd 的项目目录下 | 不动 |
| 删除 workspace 记录 | **不删** | 不动 | 不删 | 不动 |
| 清理缓存 | 不动 | `cache/` 可删 | 不动 | 不动 |

结论：**只有包目录会被升级替换，所以它是唯一不能放数据的地方。** 其余三个位置各有明确的生命周期；插件要做的是选对位置，并把选择写进 README。

## 8. 反模式

| 反模式 | 后果 | 正确做法 |
|---|---|---|
| 写 `import.meta.url` 旁边的 `data/` | 升级丢失；`files` 裁剪；多 profile 各一份 | storage domain 或 workspace 文件 |
| 模块级 `Map` 当会话缓存 | 多会话串；HMR 不清理；卸载泄漏 | 会话投影 / `ctx.effect` 清理 |
| `process.cwd()` 当会话目录 | `working_directory` 改了还读旧目录 | `ctx.workingDirectory` |
| `join(os.homedir(), '.dsh')` | 忽略 `DSH_HOME`，多环境互相污染 | `resolveDshHome()` |
| 追加自定义 session event | 会话可能拒绝重开；迁移丢失 | 已有事件 + 投影 |
| 只存 storage，不写事件 | 模型可见但不可重放；fork 不一致 | 事件优先，storage 只存宿主侧 |
| secret 写进 Config 默认值 | patch 被分享即泄漏 | 凭据引用 / 环境变量 |
| 用 `node:fs` 直接改 workspace | 绕过 fs 策略、沙箱与审计 | `ctx.fs` |
| 把 workspace 记录当文件管理器 | 删记录以为删了目录 | 明确“记录 ≠ 文件” |

## 9. 宿主代码与沙箱的边界

- **Host 插件在进程内执行，位于 workspace 沙箱之外。** 插件管理器明确写出这条边界；插件代码与宿主同权，能做 sandbox 之外的事。
- **模型的文件工具受沙箱与权限策略约束。** `workspace-write` 只允许改会话工作区；`read-only` 只读；审批策略决定 `ask` 还是拒绝。
- **不要用宿主代码替模型绕过沙箱。** 如果插件替模型读写工作区文件，它应当走 `ctx.fs`，让策略、审计、观测事件都成立；否则用户以为沙箱在保护他，实际没有。
- **安装即执行。** 装包、跑构建脚本、激活 Host 代码都在沙箱之外；这是“只装信任来源”的根本原因，不是文档措辞。

## 10. 结论

数据层的设计不是“把文件放哪”的偏好问题，而是所有权问题：

- **workspace** 属于项目，换项目就换一套；
- **home** 属于用户，跨项目积累经验与状态；
- **session** 属于这次对话，模型可见的东西必须能从日志重建。

插件包只发代码与只读定义；它通过服务访问这三种数据，并把“我读写什么、属于谁、升级后怎样”写进 README。做到这一点，“智能体代码”和“智能体数据”就自然分离了。
