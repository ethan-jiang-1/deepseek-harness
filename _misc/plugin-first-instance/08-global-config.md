# 08 · 产品全局 config：跨 profile 一致的那份配置放哪

**确认的前提**：插件启动时能读到的配置，只有 profile 那一层的 DSH Config（bundle → profile → home → `--patch`）。但产品还需要一份**跟具体 workspace 无关、跨 profile 也一致**的配置（渲染节点、默认风格、品牌素材这类）。

这两句话不矛盾，但也不能用同一个文件满足。本篇给出分工。

## 现有四层，各自的作用域

| 层 | 文件 | 作用域 | 能不能当"产品全局" |
|---|---|---|---|
| 包默认 | bundle 的 `cordis.patch.yml` | 随版本 | 只能当出厂值，用户一覆盖就丢 |
| **profile** | `$DSH_HOME/profiles/<name>/cordis.patch.yml` | 单个 profile | **不能**：两个 profile 就是两份 |
| home | `$DSH_HOME/cordis.patch.yml` | 该 home 下**所有** profile | 不能：会 insert 产品行、污染其他 profile |
| `--patch` | 启动参数 | 单次启动 | 不能：不可持久 |

home 层为什么不行，值得写清楚：它是机器级、优先于 profile 的一层，`insert` 会把产品插件**挂进每一个 profile**（`web`、`headless`、`desktop`）；按 id 覆盖则只在有这一行的 profile 生效，其余 profile 每次启动都在 stderr 上收到 unmatched 警告。它适合放通用设施（代理、provider 路由），不适合放某个产品的配置。

## 结论：放在 `dataRoot` 下的文件，`dataRoot` 必须稳定

```text
$DSH_HOME/<plugin>/settings.json      ← 产品全局配置（跨 profile、跨 workspace）
$DSH_HOME/<plugin>/                    ← 账本、注册表、会话绑定
```

为什么这是唯一可行解：

1. **跨 profile**：`dataRoot` 默认由 `$DSH_HOME` 推导（`$DSH_HOME/<plugin>`），每个 profile 拿到的都是同一个目录；
2. **启动可读**：插件 `apply` 第一行就知道 `dataRoot`，随后读文件，不需要等 Loader 重组；
3. **不污染**其他 profile：文件只在插件自己跑起来时被读；
4. **可版本化**：文件里带 `schemaVersion`，插件自己迁移。

代价与约束：

- `dataRoot` 一旦按 profile 配成不同值，全局配置就按 profile 分裂——**它是一个实例身份，不是一个可随便调的偏好**；
- 文件不进 git、权限 0600；秘密仍走 `apiKeyEnv` / `CredentialRef`，文件里只存引用。

## 优先级：文件是运行时权威，config 是种子

```text
包内代码默认
  → profile config（DSH Config）
    → dataRoot 全局设置文件
```

文件里有的字段以文件为准；文件里没有的字段才回落到 config。这条链要写进 README，否则用户永远不知道改哪个。

**字段级二选一。** 同一个字段不要同时给两个入口（设置页写 config、产品 UI 写文件），否则用户改了一个、另一个仍然生效，行为不可预测。

## 一个已验证的坑：patch 是整对象替换

`applyEntryPatches` 对目标行执行的是 `target[key] = value`（[vendor/include](../../vendor/include/src/index.ts)），也就是说 profile patch 里的 `config` 会**整体替换**该行的 config，不是深合并。

后果：

- 产品把默认值只写在 bundle patch 里，用户在 profile 里只覆盖 `projectsRoot` 一个键 → 其余键（`displayName`、`hideShellSidebar`、`bootstrap`）**全部回落到 schema/代码默认值**，bundle 里那份消失；
- 设置页不受影响，因为它写回的是"当前值 + 继承值"合并后的完整对象（[config-editor](../../packages/boot/config-editor/src/index.ts)）。

所以两条纪律：

1. **凡是用户可能覆盖的默认值，都要成为 schema/代码默认值**，不能只活在 bundle patch 里；
2. 手改 profile patch 之前先 `dsh --dump-config` 看整行；要覆盖就写全，或者走设置页。

## `.volatile()` 的陷阱

volatile 字段会出现在设置页，**写回当前 profile 的 patch**。如果一个"产品全局"字段做成 volatile，用户在每个 profile 里各改一次，就得到互相不一致的几份——正好违背"全局"的定义。

规则：**要跨 profile 一致的，不要 volatile；要按 profile 不同的，才用 volatile/config。**

## boot 前 vs boot 后

| 值 | 什么时候需要 | 只能来自 |
|---|---|---|
| `dataRoot` 本身 | `apply` 第一行 | DSH Config 或 env |
| `projectsRoot` | 同上 | 同上 |
| 渲染节点、风格、品牌素材 | 首次用到 | dataRoot 文件 |

**解析 `dataRoot` 所依赖的东西不能放进 `dataRoot` 的文件里**——那是鸡生蛋。这就是为什么 profile 层永远要保留一小块"指针配置"。

## 和三层空间的关系

```text
插件包（只读）        出厂默认、模板、种子
workspace（可写）     项目内容
账本（派生）          索引、游标、会话绑定
全局设置（跟 home）   产品级偏好 ← 本篇
```

第四层既不是账本（不派生、不可重建），也不是 workspace（跟项目无关），所以要单列。

## 检查清单

- [ ] 产品的全局配置只有一个文件，路径由 `dataRoot` 决定
- [ ] `dataRoot` 默认稳定，不鼓励按 profile 改
- [ ] 文件里有 `schemaVersion` 与迁移
- [ ] 每个字段只有一个入口（文件或 config，不双写）
- [ ] 需要跨 profile 一致的字段没有做成 volatile
- [ ] 用户可覆盖的默认值同时存在于 schema/代码默认里（防整对象替换丢值）
- [ ] README 写了优先级链与"改哪个文件生效"
- [ ] 秘密只存引用，文件权限 0600
