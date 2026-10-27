# 12 · 状态的家：domain、settings、credential 各管什么

## 这一篇回答什么

插件要持久化一点东西时，DSH 给了三个看起来都像“存数据”的东西：`ctx.storageDomain`、Config/settings、`ctx.credentials`。它们不是同一层的替代品；选错的代价是数据不可迁移、秘密泄漏、或者把配置当数据库写坏。

## 三者的分工

| 你有的东西 | 用 | 位置 | 作用域 | 用户能编辑吗 | 模型可见吗 |
|---|---|---|---|---|---|
| 结构化的插件记录（索引、游标、学到的知识、运行历史） | `ctx.storageDomain` | `$DSH_HOME/storages/<domain>.json`（`single`）或 `<domain>/<table>/<key>.json`（`per-record`） | home（记录键再切项目/会话） | 不能（除非你另做 UI） | 不能 |
| 部署/用户可调的参数（开关、阈值、路径、模型名） | `Config` + `.volatile()` | 当前 profile 的 `cordis.patch.yml` | profile | 能，通过设置页 | 间接（被插件使用） |
| 秘密（API key、token、密码） | `ctx.credentials` | `.credentials.yaml` / 环境变量 / `.env` | home（provider 管理） | 能，通过凭据 UI | 不能 |
| 多字段凭据/授权记录（OAuth grant） | `ctx.credentials` 的 `CredentialKey` 记录 | 同一个 provider 文件 | home | 能，通过凭据 UI | 不能 |
| 纯浏览器 UI 状态 | `localStorage` / 桌面 `userData` | 浏览器/设备 | 源或设备 | 间接 | 不能 |
| 可重建的索引/缓存 | 派生层（domain 的 `per-record`、`$DSH_HOME/cache`、`session_projcache`） | 同上 | 跟源 | 不需要 | 不能 |

一句话：**domain 存事实，Config 存选择，credentials 存引用与授权记录，cache 存可丢弃的推导。**

但 domain 不是“插件数据根”：它没有 per-plugin 目录、配额、scope、卸载清理；域名是包级静态声明，一个 Host 一个名字只能开一次。需要“按插件 id 隔离”的状态，要么用记录键，要么自造目录并承担生命周期（见 [11](./11-five-homes.md) 的“没有插件数据根”）。

## `ctx.storageDomain`：有 schema 的宿主 KV

### 声明一次，到处打开

域由拥有它的包声明一次（`defineDomain`），spec 是名字、版本、布局与 record schema 的唯一来源：

```text
defineDomain({
  name: 'your_plugin',        // 静态；必须匹配 ^[a-z][a-z0-9_]*$
  version: 3,
  layout: 'single' | 'per-record',
  compatibleVersions?: [1, 2],
  invalidRecords?: 'backup-and-skip',
  global?: { schema, initial },
  tables: { records: domainTable(schema) },
})
```

消费者用 `ctx.storageDomain.open(spec)` 拿到 `Domain`，再 `domain.table('records')` 或 `domain.global`。三个边界：

- **域名是静态的**：不能按 workspace 动态建域；项目级数据只能体现在**记录键**上（13 篇）。
- **一个名字一个打开的句柄**：同一进程里重复 `open` 会 `already-open`；多实例插件要用**记录里的实例键**区分，不要造多个域。
- **域属于声明它的包**：schema 是包级契约；换个包名/域名等于换了一个存储。

### 语义与边界

- 读是**同步**的，来自已校验的内存；写先落盘、再改内存、再发 `domain/changed`；写失败不会留下半更新的内存。
- 每个域一条写链：`put` / `delete` / `update` / `global.set` 串行；并发 update 不会交错。
- `update` 的变换在写链的槽位上执行；record 是普通不可变数据，拿到的对象不要原地改。
- `domain/changed` 是**进程内**通知；第二个 Host 进程或重连的 GUI 看不到，直到重新打开。
- 没有跨表事务、没有二级索引、没有多段键；一条记录一次写。
- 没有自动迁移：存储版本与 spec 不一致时，`single` 布局直接 `version-mismatch` 拒绝打开。迁移要你自己写。
- 跨进程**没有串行化**：JSON 后端没有文件锁；SQLite 后端每条语句原子，但竞争写会立即 `busy`，没有等待/重试策略。多 Host 共享 home 不是支持场景。

### 键的形状

这是最容易被忽略的一条：

- `single` 布局：记录键是**不透明字符串**，可以包含 `/`、`:`、路径；整个 unit 一个文件。
- `per-record` 布局：记录键会变成**文件路径的一段**，必须匹配 `[a-zA-Z0-9_-]+`；`realpath`、`session:<id>` 这类含 `/` 或 `:` 的键会直接拒绝写入。

所以“按项目建键”在两种布局里写法不同：

```text
single:      key = '/Users/me/work/project'        // 可以
per-record:  key = 'w_' + sha256(realpath)          // 只能这样
```

不要未经检查就把路径拼进 per-record 键；用带前缀的哈希（`w_`、`s_`、`v1_`）避免纯十六进制撞上保留含义。

### 版本与兼容：两条不同的路

- **`single` 布局**：整个 unit 一个版本戳。版本不等就拒绝；要升级，先停 Host、把旧文件迁移成新 schema、把文件与 spec 的版本都改成新值，或者换一个新的 domain 名字。
- **`per-record` 布局**：每个 record 文档自带版本。`compatibleVersions` 列出“当前 schema 也能接受的旧版本”，读的时候按旧文档处理；不在接受集合里的文档按**不存在**处理（不是迁移）。`invalidRecords: 'backup-and-skip'` 进一步把校验失败的 record 挪到一边并跳过，适合派生数据；global 槽仍然拒绝。
- **`invalidRecords` 不是所有后端都支持**：只有能 `backupRecord`（把单条文档挪走）的后端才行，即 JSON 的 `per-record`；`single` 和 SQLite 没有可挪走的单条文档，会回退到“整个 open 拒绝”。

`compatibleVersions` 不是迁移工具：它只承诺“旧字段读得懂”，写入永远按当前版本。真正的 schema 变更（改名、改语义、拆表）要么写迁移代码，要么换域。

### 后端选择

| 后端 / 布局 | 适合 | 代价 |
|---|---|---|
| `json` + `single` | 小、想让人直接打开看、写入不频繁 | 每次写重写整个文件 |
| `json` + `per-record` | 记录大、稀疏、可单独丢弃 | 每条一个文件；键必须是路径安全字符；遍历成本 |
| `sqlite` | 高频、点状更新、数据量大 | 一个数据库文件；同步驱动阻塞线程；竞争写立即拒绝 |

路由在组合层配置（`storage-domain` 的 `backend` / `routes`），不是插件自己选；插件只声明域。base 组合把 JSON 后端挂在 `$DSH_HOME/storages`，这是默认值，不是每个部署的保证。

## Config / settings：用户可编辑的参数

`Config` 是 schemastery 声明的插件配置；只有标了 `.volatile()` 的字段（或祖先节点）会进入 settings 表单。写入落到**当前 profile 的 `cordis.patch.yml`**（`$DSH_HOME/profiles/<name>/cordis.patch.yml`），由 config editor **立即应用**，不是“下次重组才生效”。

它适合：

- 用户想改、且改了应该持久的选择：开关、阈值、默认模型、输出目录；
- 需要 schema 校验、默认值、继承层与冲突检测的参数。

它不适合：

- 累积的记录（每次保存都重写 patch 文件，且不是为查询设计的）；
- 大块内容、二进制、索引；
- 秘密（用 `role('secret')` 只解决“不回传”，值仍不该放配置；凭据走 credentials）。

几个精确边界：

- **命名空间是 profile 条目 id**：同一个插件实例的表单按 Loader entry id 区分；多个实例有多个表单。自定义设置页用 `ctx.settings.configure({ auto: false }, ctx.fiber)` 注册策略。
- **表单只显示 volatile 字段**：一份没有任何 volatile 字段的 `Config` 不会出现在设置页；新增字段忘了标 volatile，用户的设置页会看不到它。
- **写是“合并字段 + 乐观 revision”**，拒绝陈旧写入；`mutate` 按路径改，避免把客户端没收到的 secret 字段一起抹掉。
- **home patch 与命令行 overlay 优先**：如果它们会覆盖表单写入，写入会被拒绝；表单不是最高层。
- **profile 作用域，不是账号作用域**：换 profile 就是另一份配置；要跨 profile 共享，用 home 域单例，不要指望 `Config`。当前设计刻意拒绝“全局共享设置”；`$DSH_HOME/settings.yaml` 只被一次性 import 到活跃 profile，然后改名 `settings.yaml.imported`。**C/H**
- **嵌套 Include 的配置不进入当前 profile 的表单**，这是已知限制。

## `ctx.credentials`：只放引用与授权记录

### 引用：`CredentialRef`

- `CredentialRef` 是 POSIX 环境变量名；`resolve(ref)` 每次操作重新读，返回 `{ value, source }` 或 `undefined`。
- `describe(ref)` 只回答“配没配、从哪层来、能不能写”，**不回传值**；所以它可以安全地过 Remote。
- 本地 provider 的层包括 `env`、`file`、`project-env`、`user-env`；存储值为空等价于未配置。
- 轮换不需要重启：下一次 `resolve` 就拿到新值。

### 记录：`CredentialKey`

OAuth grant、代理凭据这类**多字段、需要读-改-写**的东西，用 `CredentialKey`（`<owner>/<id>`）的记录接口：

- `readRecord` / `describeRecord` / `listRecords` / `modifyRecord` / `deleteRecord`；
- `modifyRecord` 是唯一的写路径，序列化读-改-写，适合刷新 token；
- `listRecords` 只返回地址和 tag，**不返回值**；它存在的理由之一就是让 UI 找到“插件已卸载但记录还在”的孤儿；
- grant 的 payload 由 owner 解释，provider 原样保存。

### 本地 provider 的边界

本地 provider 把引用和记录放在 `$DSH_HOME/.credentials.yaml`；POSIX 上创建为 owner-only，并拒绝 group/other 可读的文件（Windows 跳过这个检查）。但**agent 的工具进程以同一个 OS 用户运行**，所以这不是隔离边界：能读文件的插件/工具就能读。它靠的是“不把路径交给模型 + 不把值写进日志”的约定，不是权限沙箱。

规则很简单：**任何秘密都只以引用形式出现在 Config、domain、日志、提示词里；值只在调用点解析。**

## 选错的四个症状

1. **用 settings 存累积数据**：patch 文件越来越大、每次保存都重写、查询要全量读；用户改一个开关可能顺手把你的记录覆盖掉。
2. **用 domain 存秘密**：可读 JSON 会把 key 摊在磁盘上；备份、日志、导出都可能带出去。
3. **用 `single` 布局存高频写**：每次写重写整包 JSON，写入放大、崩溃窗口变大；该用 `per-record` 或 sqlite。
4. **用 profile 配置存“账号级”数据**：换 profile 就丢；用户以为“配一次全生效”，实际只对一个 profile 生效。

## 迁移的最小剧本

1. 先决定是**兼容读**还是**换域**：只加可选字段 → 提高 version + `compatibleVersions`（仅 per-record）；改语义/拆表 → 新域名 + 一次性迁移。
2. 迁移代码放在插件启动时：读旧域/旧文件 → 写新域 → 校验条数与抽样 → 保留旧文件一个版本周期。
3. 给派生数据加 `invalidRecords: 'backup-and-skip'`（仅 JSON per-record），让坏记录不拖垮启动。
4. 在隔离的 `DSH_HOME` 里演练：旧数据 → 新版本启动 → 读回 → 再降级一次（确认不会写坏旧文件）。
5. 迁移是**你**的责任：DSH 不会替你改 schema，也不会在版本不匹配时猜。
6. 迁移要可重复、可校验、可中断；宁可 fail loud，也不要静默重建。

## 版本迁移的历史教训

- `invalidRecords: 'backup-and-skip'` 不是万能：只有 JSON `per-record` 能 `backupRecord`；`single`/SQLite 会回退到拒绝。
- 旧 `session_projcache.json`（单文件）被 per-record 布局取代后，遗留文件仍在磁盘，没有自动清理；这是“迁移只增不删”的典型。
- 可重建介质曾能 brick 启动（v3 单文件升级），后来靠读兼容 + backup-and-skip 缓解；权威 domain（workspace）仍然故意 fail-loud。**H/C**

## 边界

- 域是 home 级的；没有“每 workspace 一个域”。项目级切分靠键（13 篇）。
- `domain/changed` 不跨进程；需要跨进程刷新就自己加版本号/轮询，或等上游的 cross-process revision。
- 本篇不展开 settings 的表单协议与凭据 provider 的实现；只讲选型边界。
- 客户端存储没有统一的 DSH 服务；它是浏览器/桌面能力，插件自己管键名、版本与清理。
