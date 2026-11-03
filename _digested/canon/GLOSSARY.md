# 01 · 规范词表

一行一个承重词：左边是 repo 的原词（**保留英文**），中间是 repo 的原文（点开可核），右边是它在本卷怎么用、以及**不要写成什么**。表里没有的词，先在 [`03`](./03-retired.md) 登记再使用。

## 对象与组合

| 词 | repo 原文 | 在本卷指什么 | 不要写成 |
|---|---|---|---|
| `plugin` | 「plugins contribute services, typed events, and reversible effects to a shared context」（[architecture](../../docs/architecture.md)） | 向 Cordis 上下文贡献能力的模块；一个插件实例在配置里是一行 | 「插件包」「插件组件」——包与插件不是一回事 |
| `bundle`／组合包 | 「Cordis 配置项及其挂载代码的分发格式，因此它插入的内容始终可被其上各层 patch」（[architecture.zh](../../docs/architecture.zh.md)） | 可安装、声明 `dsh.bundle.patch` 的发布单位 | 「插件集」「扩展包」；中文只在需要时写「组合包」 |
| `profile` | 「存放在 Harness home 中的具名组装……列出自己叠放的组合包，存放自己安装的树外插件，并保存用户自己的 `cordis.patch.yml`」（[architecture.zh](../../docs/architecture.zh.md)） | 一次启动的具名组合，住在 `$DSH_HOME/profiles/<name>` | 「入口 profile」「应用 profile」「产品 profile」；profile 不是发布物，也不是隔离边界 |
| `preset` | 「A `preset` patch applies these operations inside that declaration's `config.plugins`, with the same layer precedence」（[architecture](../../docs/architecture.md)） | 会话级声明；Web 端的 Standard / PTC / Minimal / Creator 都是它 | 「模式」「mode」——那是 preset 的名字，不是机制 |
| `composition` | `--dump-config` 「reports the configured composition」（[app-boot](../../packages/boot/app-boot/README.md)） | 有序层叠算出来的配置集合，不是一份手写的最终文件 | 「配置树」「完整 cordis.yml」 |
| `patch`／`row` | 「A patch targets a row by id and replaces its whole config, or inserts new rows」（[architecture](../../docs/architecture.md)） | 按 id 定位并**整份替换** config，或插入新行 | 「深合并」「字段覆盖」——都不是它的语义 |
| roster | profile 的 `dsh.profile.bundles` 有序列表（[app-boot](../../packages/boot/app-boot/README.md)） | 「装进去了」的可读回证据 | 「已安装列表」但指 `node_modules`——那是依赖，不是 roster |

## 运行时与扩展

| 词 | repo 原文 | 在本卷指什么 | 不要写成 |
|---|---|---|---|
| `seam` | 「一种包含三种角色的*可替换能力*：Service Definition……Service Provider……Consumer」（[glossary.zh](../../docs/glossary.zh.md)） | 三角色齐备才算 seam；单角色只是其中一员 | 「接口」「抽象层」；也别说「某个插件是一个 seam」 |
| Service Definition | 「拥有自身 `ctx.<key>` 和词汇类型的 Cordis `Service`……绝不是 TypeScript `interface`」（[glossary.zh](../../docs/glossary.zh.md)） | 占住 `ctx.<key>` 的抽象类或注册表 | 「接口定义」 |
| Service Provider | 同一 Def 的一个实现；第二个真实 Provider 出现才构成 seam 的成熟信号 | 提供方，按包计 | 「后端」——除非确实在说网络后端 |
| Consumer | 注入该服务的插件 | 调用方 | 「客户端」——`client` 在本卷专指浏览器那棵树 |
| `scope`／scope key | 「按 agent 划分的注册单位……一个活跃的 agent 就是其自身 scope 的 key」（[glossary.zh](../../docs/glossary.zh.md)） | 注册的可见范围；扁平两层 | 「租户」「权限域」；scope 不是隔离边界 |
| `slot` | Client 的挂载点，文法 `<domain>.<entry>.<hole>`（[client AGENTS](../../packages/client/AGENTS.md)） | UI 上的命名插槽 | 「组件位置」「容器」 |
| `waterfall` | Cordis 的监听器链派发；不调 `next()` 即短路（[AGENTS](../../AGENTS.md)） | 事件委托链 | 「钩子链」——`hook` 在本卷另有所指（见 03） |

## 时间与状态

| 词 | repo 原文 | 在本卷指什么 | 不要写成 |
|---|---|---|---|
| `turn`／轮次 | 「一次对已接纳输入的排空过程，在模型及其工具停止工作或终止策略介入后结束」（[glossary.zh](../../docs/glossary.zh.md)） | 会话推进的基本单位 | 「回合」「对话轮」 |
| `step`／步骤 | 「一次模型请求，以及由模型响应引发的工具执行」（[glossary.zh](../../docs/glossary.zh.md)） | turn 内部的一步 | 「迭代」「循环次数」 |
| `round` | 「承载一个轮次的外层策略迭代」（[glossary.zh](../../docs/glossary.zh.md)） | 策略层的迭代（Goal Round、Ralph Round） | 「轮次」——两者不可互换 |
| `exchange`／交互段 | 「连续的轮次，从首个步骤接纳真人输入的轮次起，到下一个这样的轮次为止」（[glossary.zh](../../docs/glossary.zh.md)） | Chat 折叠的边界 | 「会话片段」 |
| `goal`／Goal Round | 「附着在现有会话上的单个持久完成目标……Goal Round 是为当前目标接纳的一次续行周期」（[glossary.zh](../../docs/glossary.zh.md)） | 持久目标与其续行 | 「任务」「计划」——todo／plan 是另外的东西 |
| `human command`／人类命令 | 「以斜杠开头的指令，由面向人类的适配器通过 `ctx.commands` 解释并执行，不会成为模型消息」（[glossary.zh](../../docs/glossary.zh.md)） | 人与模型的另一条入口 | 「命令工具」「斜杠工具」 |
| session log／会话日志 | 「会话日志仍是其真源」（[glossary](../../docs/glossary.md) 的 goal 条目） | 追加写的持久事实 | 「聊天记录」「transcript」——后者是投影出来的 |
| projection／投影 | 由日志折叠出的当前值，可重建 | 模型实际看见的有序历史 | 「摘要」「缓存」；投影不是第二份日志 |
| storage domain | `ctx.storageDomain`：schema 校验的 Host 侧 KV 域 | 插件状态的原生落点 | 「数据库」「插件数据根」——后者 DSH 没有 |

## 边界与位置

| 词 | repo 原文 | 在本卷指什么 | 不要写成 |
|---|---|---|---|
| Harness home | `$DSH_HOME`：机器本地的状态根 | profile、session、凭据、设置的共同根 | 「数据目录」「安装目录」 |
| `workspace` | Host 侧的目录登记，带 id、canonical path、title 与 Session 的 ordered account（[workspace](../../docs/subsystems/workspace.md)） | 导航与分组用的登记 | 「项目」「工作目录」——目录是文件系统事实，workspace 是登记 |
| `app surface` | 「A profile is how one dsh installation ships different app surfaces」（[app-boot](../../packages/boot/app-boot/README.md)） | profile 决定起哪个面 | 「应用面」「入口面」——中文里不要造译名 |
| `product` | 「Every part of the product is a plugin」（[architecture](../../docs/architecture.md)） | 整台运行中的 dsh；只作整体名词或形容词（`product data`） | 「产品型 X」「产品 profile」——它不修饰单个对象 |
| `quality gate`／门禁 | 「quality gate（质量门禁）」（[i18n/terminology](../../docs/i18n/terminology.md)） | 可机械失败的检查脚本 | 「装满后的拦截」；`docs/AGENTS.md` 要求写具体检查名，不要只说 gate |

## 怎么读这张表

- **repo 原文**一栏是判据，不是装饰：凡是这一栏说不通的写法，都是本卷在发明词。
- **不要写成**一栏来自实际返工：每一条都对应过一次被改回来的替换。
- 一个词在这张表里只能有一种含义。要表达第二个意思，就给它另一个词，而不是让同一个词兼任。
