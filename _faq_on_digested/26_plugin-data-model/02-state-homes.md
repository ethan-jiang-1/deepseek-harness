# 02 · 状态的家：domain、settings、credential 各管什么

## 这一篇回答什么

插件要持久化一点东西时，DSH 给了三个看起来都像“存数据”的东西：`ctx.storageDomain`、Config/settings、`ctx.credentials`。它们不是同一层的替代品；选错的代价是数据不可迁移、秘密泄漏、或者把配置当数据库写坏。

## 三者的分工

| 你有的东西 | 用 | 位置 | 用户能编辑吗 | 模型可见吗 |
|---|---|---|---|---|
| 结构化的插件记录（索引、游标、学到的知识、运行历史） | `ctx.storageDomain` | `$DSH_HOME/storages/<domain>.json`（或 sqlite） | 不能（除非你另做 UI） | 不能 |
| 部署/用户可调的参数（开关、阈值、路径、模型名） | `Config` + `.volatile()` | 当前 profile 的 `cordis.patch.yml` | 能，通过设置页 | 间接（被插件使用） |
| 秘密（API key、token、密码） | `ctx.credentials` | provider 管理的层（文件/环境变量） | 能，通过凭据 UI | 不能 |
| 可重建的索引/缓存 | 派生层（domain 的 per-record 或 `$DSH_HOME/cache`） | 同上 | 不需要 | 不能 |

一句话：**domain 存事实，Config 存选择，credentials 存引用，cache 存可丢弃的推导。**

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

消费者用 `ctx.storageDomain.open(spec)` 拿到 `Domain`，再 `domain.table('records')` 或 `domain.global`。**域名是静态的**：不能按 workspace 动态建域；项目级数据只能体现在**记录键**上（03 篇）。

### 语义与边界

- 读是**同步**的，来自已校验的内存；写先落盘、再改内存、再发 `domain/changed`；写失败不会留下半更新的内存。
- 每个域一条写链：`put` / `delete` / `update` / `global.set` 串行；并发 update 不会交错。但**跨进程不串行**，JSON 后端也没有文件锁。
- `update` 的变换在写链的槽位上执行；record 是普通不可变数据，拿到的对象不要原地改。
- `domain/changed` 是**进程内**通知；第二个 Host 进程或重连的 GUI 看不到，直到重新打开。
- 没有跨表事务、没有二级索引、没有多段键；一条记录一次写。
- 没有自动迁移：存储版本与 spec 不一致时，`single` 布局直接 `version-mismatch` 拒绝打开。迁移要你自己写。

### 版本与兼容：两条不同的路

- **`single` 布局**：整个 unit 一个版本戳。版本不等就拒绝；要升级，先停 Host、把旧文件迁移成新 schema、把版本改成新值，或者换一个新的 domain 名字。
- **`per-record` 布局**：每个 record 文档自带版本。`compatibleVersions` 列出“当前 schema 也能接受的旧版本”，读的时候按旧文档处理；不在接受集合里的文档按**不存在**处理（不是迁移）。`invalidRecords: 'backup-and-skip'` 进一步把校验失败的 record 挪到一边并跳过，适合派生数据；global 槽仍然拒绝。

`compatibleVersions` 不是迁移工具：它只承诺“旧字段读得懂”，写入永远按当前版本。真正的 schema 变更（改名、改语义、拆表）要么写迁移代码，要么换域。

### 后端选择

| 后端 / 布局 | 适合 | 代价 |
|---|---|---|
| `json` + `single` | 小、想让人直接打开看、写入不频繁 | 每次写重写整个文件 |
| `json` + `per-record` | 记录大、稀疏、可单独丢弃 | 每条一个文件；遍历成本 |
| `sqlite` | 高频、点状更新、数据量大 | 一个数据库文件；同步驱动阻塞线程 |

路由在组合层配置（`storage-domain` 的 `backend` / `routes`），不是插件自己选；插件只声明域。

## Config / settings：用户可编辑的参数

`Config` 是 schemastery 声明的插件配置；只有标了 `.volatile()` 的字段会进入 settings 表单。写入落到**当前 profile 的 `cordis.patch.yml`**（`$DSH_HOME/profiles/<name>/cordis.patch.yml`），下一次重组时生效。

它适合：

- 用户想改、且改了应该持久的选择：开关、阈值、默认模型、输出目录；
- 需要 schema 校验、默认值、继承层与冲突检测的参数。

它不适合：

- 累积的记录（每次保存都重写 patch 文件，且不是为查询设计的）；
- 大块内容、二进制、索引；
- 秘密（用 `role('secret')` 只解决“不回传”，值仍不该放配置；凭据走 credentials）。

settings 的写是“合并字段 + 乐观 revision”，拒绝陈旧写入；嵌套 Include 的配置不进入当前 profile 的表单，这是已知限制。

## `ctx.credentials`：只放引用

- `CredentialRef` 是 POSIX 环境变量名；`resolve(ref)` 每次操作重新读，返回 `{ value, source }` 或 `undefined`。
- `describe(ref)` 只回答“配没配、从哪层来、能不能写”，**不回传值**；所以它可以安全地过 Remote。
- 本地 provider 的层包括 `env`、`file`、`project-env`、`user-env`；存储值为空等价于未配置。
- 轮换不需要重启：下一次 `resolve` 就拿到新值。

规则很简单：**任何秘密都只以引用形式出现在 Config、domain、日志、提示词里；值只在调用点解析。**

## 选错的三个症状

1. **用 settings 存累积数据**：patch 文件越来越大、每次保存都重写、查询要全量读；用户改一个开关可能顺手把你的记录覆盖掉。
2. **用 domain 存秘密**：`workspace.json` 式的可读 JSON 会把 key 摊在磁盘上；备份、日志、导出都可能带出去。
3. **用 single 布局存高频写**：每次写重写整包 JSON，写入放大、崩溃窗口变大；该用 `per-record` 或 sqlite。

## 迁移的最小剧本

1. 先决定是**兼容读**还是**换域**：只加可选字段 → 提高 version + `compatibleVersions`（仅 per-record）；改语义/拆表 → 新域名 + 一次性迁移。
2. 迁移代码放在插件启动时：读旧域/旧文件 → 写新域 → 校验条数与抽样 → 保留旧文件一个版本周期。
3. 给派生数据加 `invalidRecords: 'backup-and-skip'`，让坏记录不拖垮启动。
4. 在隔离的 `DSH_HOME` 里演练：旧数据 → 新版本启动 → 读回 → 再降级一次（确认不会写坏旧文件）。
5. 迁移是**你**的责任：DSH 不会替你改 schema，也不会在版本不匹配时猜。

## 边界

- 域是 home 级的；没有“每 workspace 一个域”。项目级切分靠键（03 篇）。
- `domain/changed` 不跨进程；需要跨进程刷新就自己加版本号/轮询，或等上游的 cross-process revision。
- 本篇不展开 settings 的表单协议与凭据 provider 的实现；只讲选型边界。
