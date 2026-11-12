# GLOSSARY · DSH 的词

一行一个词。四列：**怎么称呼**、**DSH 怎么说**、**它指什么**、**不要写成什么**。

每条依据前的标记只有两种：**原文**（repo 里逐字可搜到，允许省略号截断）与**译**（repo 是英文，这里给中译）。搜不到的句子不进这张表。

## 对象与组合

| 词 | DSH 怎么说 | 它指什么 | 不要写成 |
|---|---|---|---|
| `plugin` | **原文**「plugins contribute services, typed events, and reversible effects to a shared context」（[architecture](../../docs/architecture.md)） | 向 Cordis 上下文贡献能力的模块；一个实例在配置里是一行 | 「插件包」「插件组件」 |
| `bundle`／组合包 | **原文**「Cordis 配置项及其挂载代码的分发格式」（[architecture.zh](../../docs/architecture.zh.md)） | 声明 `dsh.bundle.patch` 的可安装发布单位 | 「插件集」「扩展包」 |
| `profile` | **原文**「A profile is a named composition stored in the Harness home. It lists the bundles it stacks…」（[architecture](../../docs/architecture.md)） | 一次启动的具名组合，住在 `$DSH_HOME/profiles/<name>` | 「入口 profile」「应用 profile」 |
| `preset` | **原文**「A `preset` patch applies these operations inside that declaration's `config.plugins`, with the same layer precedence」（[architecture](../../docs/architecture.md)） | 会话级声明；Standard / PTC / Minimal / Creator 都是它的名字 | 「模式」「mode」 |
| `composition` | **原文**「`--dump-config` reports the configured composition」（[app-boot](../../packages/boot/app-boot/README.md)） | 有序层叠算出来的配置集合 | 「配置树」「完整 cordis.yml」 |
| `patch`／`row` | **原文**「A patch targets a row by id and replaces its whole config, or inserts new rows」（[architecture](../../docs/architecture.md)） | 按 id 定位并整份替换，或插入新行 | 「深合并」「字段覆盖」 |
| roster | **原文**「它列出自己叠放的组合包」（[architecture.zh](../../docs/architecture.zh.md)）；字段 `dsh.profile.bundles` | 「装进去了」的可读回证据 | 把 `node_modules` 叫 roster——那是依赖 |

## 运行时与扩展

| 词 | DSH 怎么说 | 它指什么 | 不要写成 |
|---|---|---|---|
| `seam` | **原文**「一种包含三种角色的*可替换能力*」（[glossary.zh](../../docs/glossary.zh.md)） | 三角色齐备才算；单角色只是其中一员 | 「接口」「抽象层」 |
| Service Definition | **原文**「拥有自身 `ctx.<key>` 和词汇类型的 Cordis `Service`……绝不是 TypeScript `interface`」（[glossary.zh](../../docs/glossary.zh.md)） | 占住 `ctx.<key>` 的抽象类或注册表 | 「接口定义」 |
| Service Provider | **原文**「one or more **Service Providers**」（[glossary](../../docs/glossary.md)） | 提供方，按包计 | 「后端」——除非确指网络后端 |
| Consumer | **原文**「one or more **Consumers** that inject the service」（[glossary](../../docs/glossary.md)） | 注入该服务的插件 | 「客户端」——`client` 在本卷专指浏览器那棵树 |
| `scope`／scope key | **原文**「按 agent 划分的注册单位……一个活跃的 agent 就是其自身 scope 的 key」（[glossary.zh](../../docs/glossary.zh.md)） | 注册的可见范围；扁平两层 | 「租户」「权限域」 |
| `slot` | **原文**「`ctx.slots.register({ name, children?, store?, inject? }, Component)` for a parent-owned extension position」（[client AGENTS](../../packages/client/AGENTS.md)） | UI 上的命名插槽 | 「组件位置」「容器」 |
| `waterfall` | **原文**「Waterfall listeners MUST call `next()` to delegate; returning without it short-circuits the chain」（[AGENTS](../../AGENTS.md)） | 事件委托链 | 「钩子链」 |

## 证据与验证

| 词 | DSH 怎么说 | 它指什么 | 不要写成 |
|---|---|---|---|
| `keyless` | **原文**「The test-support group gives repository tests deterministic, keyless ways to exercise the real product」（[test-support](../../packages/test-support/README.md)）；「Replay is the keyless default」（[vitest.snapshot.config.ts](../../vitest.snapshot.config.ts)）；「A no-key test proves plumbing; only a with-key run proves the agent works against a real model」（[testing](../../docs/testing.md)） | 不发生真实 provider 调用的取证方式。`replay` 与 `refresh` 都 keyless，只有 `record` 是 live API；允许用哨兵假 key 让适配器启动起来 | 「mock」「离线测试」「无 key 测试」——它不 mock 产品，跑的是真插件真 profile，只有模型流是回放的；也不能写成「等价于真 API」，它与 with-key 是**成对**关系 |

## 时间与状态

| 词 | DSH 怎么说 | 它指什么 | 不要写成 |
|---|---|---|---|
| `turn`／轮次 | **原文**「一次对已接纳输入的排空过程，在模型及其工具停止工作或终止策略介入后结束」（[glossary.zh](../../docs/glossary.zh.md)） | 会话推进的基本单位 | 「回合」「对话轮」 |
| `step`／步骤 | **原文**「一次模型请求，以及由模型响应引发的工具执行」（[glossary.zh](../../docs/glossary.zh.md)） | turn 内部的一步 | 「迭代」「循环次数」 |
| `round` | **原文**「承载一个轮次的外层策略迭代」（[glossary.zh](../../docs/glossary.zh.md)） | 策略层迭代（Goal Round、Ralph Round） | 「轮次」——两者不可互换 |
| `exchange`／交互段 | **原文**「连续的轮次，从首个步骤接纳真人输入的轮次起，到下一个这样的轮次为止」（[glossary.zh](../../docs/glossary.zh.md)） | Chat 折叠的边界 | 「会话片段」 |
| `goal`／Goal Round | **原文**「附着在现有会话上的单个持久完成目标……Goal Round 是为当前目标接纳的一次续行周期」（[glossary.zh](../../docs/glossary.zh.md)） | 持久目标与其续行 | 「任务」「计划」 |
| `human command`／人类命令 | **原文**「以斜杠开头的指令，由面向人类的适配器通过 `ctx.commands` 解释并执行，不会成为模型消息」（[glossary.zh](../../docs/glossary.zh.md)） | 人与模型的另一条入口 | 「命令工具」「斜杠工具」 |
| session log／会话日志 | **译**「the session log remains its source of truth」（[glossary](../../docs/glossary.md)） | 追加写的持久事实 | 「聊天记录」「transcript」 |
| projection／投影 | **原文**「registered units fold committed events incrementally, host consumers read one typed state with `stateOf()`」（[architecture](../../docs/architecture.md)） | 由日志折叠出的当前值，可重建 | 「摘要」「缓存」 |
| storage domain | **原文**「the Consumer data form (`dsh-storage-domain`, `ctx.storageDomain`…) — the backend contract's only Consumer and the typed API everything else uses」（[storage](../../docs/subsystems/storage.md)） | 插件状态的原生落点 | 「数据库」「插件数据根」 |

## 边界与位置

| 词 | DSH 怎么说 | 它指什么 | 不要写成 |
|---|---|---|---|
| Harness home | **原文**「stored in the Harness home」（[architecture](../../docs/architecture.md)） | 机器本地的状态根 `$DSH_HOME` | 「数据目录」「安装目录」 |
| `workspace` | **原文**「A workspace is the persistent record of a directory the user works in: a stable id over a canonical path, a display title, and the ordered account of sessions that belong to it」（[workspace](../../docs/subsystems/workspace.md)） | 导航与分组用的登记 | 「项目」「工作目录」 |
| `app surface` | **原文**「A profile is how one dsh installation ships different app surfaces」（[app-boot](../../packages/boot/app-boot/README.md)） | profile 决定起哪个面 | 「应用面」「入口面」 |
| `product` | **原文**「Every part of the product is a plugin」（[architecture](../../docs/architecture.md)） | 整台运行中的 dsh；只作整体名词或形容词 | 「产品型 X」「产品 profile」 |
| `quality gate`／门禁 | **原文**「quality gate（质量门禁）」（[i18n/terminology](../../docs/i18n/terminology.md)） | 可机械失败的检查脚本 | 泛指一切「拦住」；`docs/AGENTS.md` 要求写具体检查名 |

## 怎么读这张表

- 标「原文」的必须能 grep；grep 不到，说明这条已经过期，按 [`03-retired`](./03-retired.md) 的规则处理。
- 「不要写成」一栏来自实际返工：每一条都对应过一次被改回来的替换。
- 一个词在这张表里只能有一种含义。要表达第二个意思，就给它另一个词。
- 本表不收录本语料自己的分类、指标、阶梯——它们不是 DSH 的词，不配与上表并列。
