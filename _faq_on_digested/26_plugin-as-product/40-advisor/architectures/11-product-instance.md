# 11 · 产品实例（配置根）

[← 返回 42 总览](../42-native-reference-architectures.md)

**适用**：一个插件决定整个 DSH 实例的用途——装什么、从哪个目录起步、数据归谁（产品型实例：工作台、编辑器、运维面板都属于这一类）。

> 定义：一个产品型 DSH 实例 = 一份 profile 组合（装什么）+ 一个 workspace 根（在哪干）+ 一份 home 级账本与全局设置（记住什么）。

**数据卡**

| 项 | 值 |
|---|---|
| 权威 | 安装方/产品（组合与默认值）；用户（目录与内容） |
| 作用域 | 实例：profile 组合 + workspace 根 + `dataRoot` |
| 寿命 | 一次安装；账本随 home，项目内容随目录 |
| 读写者 | 插件、用户（设置页/弹窗）、模型（仅开放工具面时） |
| 介质 | profile `cordis.patch.yml` + `workspaceRegistry` + `dataRoot` 下的文件 |
| 秘密 | 只放引用（`apiKeyEnv` / `CredentialRef`） |

**布局**

```text
$DSH_HOME/profiles/<name>/
├── package.json          # dsh.profile.bundles：base → web-app → 产品 bundle
└── cordis.patch.yml      # 启动指针：dataRoot、projectsRoot、显示名

$DSH_HOME/<plugin>/       # dataRoot
├── settings.json         # 产品全局设置（跨 profile）
├── <ledger>.json         # 索引、游标、会话绑定
└── workspace/            # 默认 workspace（用户没指定时）
```

**路线**

| 路线 | 做法 | 代价 | 选它当 |
|---|---|---|---|
| A 工具中介 | preset 只挂插件工具；落盘走 `node:fs` | 每个动作都要有工具 | 受控 agent（现状） |
| B 开放 agent | preset 加 `tool-fs`/`tool-bash`；会话 cwd = 项目 | 沙箱约束全部生效；一个会话只能管一个项目 | 需要模型直接改文件 |
| C 混合 | workspace 是入口，账本另存 | 两套真相要同步 | 既要侧栏按项目开会话，又要产品账本 |

**数据面**：

| 选项 | 做法 | 隔离 | 代价 |
|---|---|---|---|
| S1 共享 `$DSH_HOME` | 什么都不改 | 无：会话/工作区/凭据混在一起 | 零 |
| S2 重定向数据根 | 覆写 `session-persistence-jsonl.root`、`storage-json.root`、`attachment-local.dshHome`、`credentials-local.path`、`spill-local.root`、`session-query-sqlite.path` | 中 | 配置现成但没有文档模式；两 profile 共用同一根会互踩 |
| S3 独立 `DSH_HOME` | 启动器设 `DSH_HOME=...` | 高 | 凭据、模型配置、设置全要重来；端口也要管 |

**启动四状态**：`configured` / `adopted` / `default` / `unresolved`。缺失时：配置可重建，记忆要重新问；`unresolved` 先登记占位，挡住 DSH 首用默认工作区。详见 [16](../../10-foundations/16-startup-resolution.md)。

**硬规则**：

- 账本与 workspace 分开，账本目录不登记为 workspace；
- 用户内容的唯一副本不进账本；
- 跨 profile 一致的配置放 `dataRoot` 文件，不放 home patch、不做 volatile；
- patch 整对象替换 → 用户可覆盖的默认值必须进 schema；
- 卸载说明写清 domain、`dataRoot`、marker、workspace 登记四处残留。

**测试**：冷启动四状态、占位与客户端首连竞态、未挂载卷（`missing`）、双 profile 共享 home、配置整对象替换、无客户端降级、升级重启边界（见 [18](../../10-foundations/18-install-upgrade.md)）。

**推荐路径**：先用 A（工具中介）把产品做稳——账本 `dataRoot`、会话绑定不依赖 cwd、写操作全走工具；如果项目内容要给用户看见，只把项目根指到用户目录即可。确实需要"侧栏按项目开会话"时再加 B（用户选根 → 客户端 `adopt` → 登记 workspace）；**不要默认从 C（启动扫描）起步**，它会立刻撞上"删了又复活"和首用默认工作区的竞态。三条路线按产品的写路径需求选，不按某个现成产品的现状选。

**DSH 映射**：`workspaceRegistry`（N1）+ `runProfile`/`dsh --profile`（N0）+ `dataRoot` 自造目录（N+，自己负责迁移清理）；`ctx.workspaceCordis` 类每项目运行时仍是 E1 参考。

## 一张选型表
