# 17 · 配置分几层：启动配置、产品全局、工具面与秘密

## 这一篇回答什么

插件启动时读的那份 config 从哪来、用户改的设置写回哪、产品自己的全局偏好放哪、模型能不能写文件由谁决定——这四件事常被混成"配置"。它们其实是四层不同的东西，混用会得到"改了没生效""换 profile 就变""用户一覆盖就丢默认值"。

## 五层配置

| 层 | 文件 | 作用域 | 放什么 |
|---|---|---|---|
| 包默认 | bundle 的 `cordis.patch.yml` | 随版本 | 出厂值（**不能只放这里**，见"整对象替换"） |
| **profile** | `$DSH_HOME/profiles/<name>/cordis.patch.yml` | 单个 profile | 启动引导：`dataRoot`、`projectsRoot`、显示名 |
| home | `$DSH_HOME/cordis.patch.yml` | 该 home 下所有 profile | 机器级通用设施；**不放产品配置** |
| `--patch` | 启动参数 | 单次启动 | 试验、覆盖 |
| **产品全局设置** | `dataRoot` 下的文件 | 该 home 下所有 profile | 渲染节点、默认风格、品牌素材 |

组合顺序是 bundle → profile → home → `--patch`，**后层赢**。`dataRoot` 文件不在这个链里：它由插件在启动后自己读（原因见"鸡生蛋"）。

## 为什么 home 层不能放产品配置

`$DSH_HOME/cordis.patch.yml` 对每个 profile 生效：

- `insert` 一行产品插件 → 该插件会出现在 `web`、`headless`、`desktop` 等所有 profile 里；
- 按 id 覆盖 → 只在有这一行的 profile 生效，其余 profile 每次启动在 stderr 上收到 unmatched 警告；
- 它优先于 profile patch → 用户在某个 profile 里的修改会被 home 层盖掉。

所以它适合放**真正机器级、与产品无关**的东西（代理、provider 路由），不适合放"某个产品的渲染节点"。

## 产品全局设置放哪

**放在 `dataRoot` 下的文件，且 `dataRoot` 必须稳定。**

```text
$DSH_HOME/<plugin>/settings.json     ← 产品全局配置（跨 profile、跨 workspace）
$DSH_HOME/<plugin>/                   ← 账本、注册表、会话绑定
```

为什么这是唯一可行解：

1. **跨 profile**：`dataRoot` 默认由 `$DSH_HOME` 推导，每个 profile 拿到同一个目录；
2. **启动可读**：插件 `apply` 第一行就知道 `dataRoot`，随后读文件；
3. **不污染其他 profile**：文件只在插件自己跑起来时被读；
4. **可版本化**：文件里带 `schemaVersion`，插件自己迁移。

代价：`dataRoot` 一旦按 profile 配成不同值，全局配置就按 profile 分裂——**它是实例身份，不是随便调的偏好**。

## 优先级与字段级权威

一条链管配置：**代码 schema 默认 → bundle patch → profile patch → home patch → `--patch`**（后层整对象替换，见上表）。

`dataRoot` 的 `settings.json` 是链外的运行时存储：插件启动后读它；对用户在 UI 里改的字段，文件值覆盖 config 值。规则：**同一字段只给一个入口**——安装参数进 config，运行时选择进 settings 文件；两边同时写会互相覆盖，用户也分不清哪个生效。

## 整对象替换：最容易丢默认值的地方

`applyEntryPatches` 对目标行执行的是 `target[key] = value`（[vendor/include](../../../vendor/include/src/index.ts)），也就是说 profile patch 里的 `config` 会**整体替换**该行的 config，不是深合并。**C**

后果：

- 产品默认值只写在 bundle patch 里，用户在 profile 里只覆盖 `projectsRoot` 一个键 → 其余键（`displayName`、`hideShellSidebar`、`bootstrap`）**全部回落到 schema/代码默认值**，bundle 里那份消失；
- 设置页**不能**替你恢复：`update` 以当前行 config 为底，`replace` 才以继承层为底；两者都保留非 volatile 字段（`strip(raw)` + `mergeLayers`），但被不完整覆盖丢掉的 bundle 默认值不会回来。`inherited` 只是把下层算给 UI 看（[config-editor](../../../packages/boot/config-editor/src/index.ts)、[settings](../../../packages/settings/settings/src/index.ts)）。**C**

两条纪律：

1. **凡是用户可能覆盖的默认值，都要成为 schema/代码默认值**，不能只活在 bundle patch 里；
2. 手改 profile patch 前先 `dsh --dump-config` 看整行；要覆盖就把该行 `config` 写全。设置页只编辑 volatile 字段，不能恢复已经丢掉的非 volatile 默认值。

## `.volatile()` 的陷阱

volatile 字段会出现在设置页，**写回当前 profile 的 patch**。一个"产品全局"字段如果做成 volatile，用户在每个 profile 里各改一次，就得到互相不一致的几份——正好违背"全局"的定义。

规则：**要跨 profile 一致的，不要 volatile；要按 profile 不同的，才用 volatile/config。**

## 鸡生蛋边界

| 值 | 什么时候需要 | 只能来自 |
|---|---|---|
| `dataRoot` 本身 | `apply` 第一行 | DSH Config 或 env |
| `projectsRoot` | 同上 | 同上 |
| 渲染节点、风格、品牌素材 | 首次用到 | `dataRoot` 文件 |

**解析 `dataRoot` 所依赖的东西不能放进 `dataRoot` 的文件里。** 这就是为什么 profile 层永远要保留一小块"指针配置"。

## 工具面也是配置：模型能不能写由 preset 决定

这是产品型实例最容易被说错的一点：

- workspace 只给**侧栏一行 + 会话 cwd + 沙箱根**；
- 模型能不能 `read` / `write` / `bash`，取决于 agent preset 挂了哪些工具行；
- 一个只挂插件工具的 preset，即使会话开在项目目录里，模型也碰不到文件——所有落盘由插件工具的 `node:fs` 完成。

| 模式 | preset 挂了什么 | 写路径 | 沙箱 |
|---|---|---|---|
| **工具中介** | 插件自己的工具 | 插件 `node:fs` | 不相关 |
| **开放 agent** | 加 `tool-fs` / `tool-bash` | 模型直接写 | 唯一可写根 = 会话 cwd |

选开放模式时，`cwd` 必须落在项目目录里，且 `cd` 不会放宽沙箱；放宽只能靠一次性审批。约束见 [sandbox 子系统](../../../docs/subsystems/sandbox.md) 与 [fs-sandbox](../../../packages/fs/fs-sandbox/README.md)。**C**

**普通插件控制不了宿主 preset**：宿主若挂了 `tool-fs`/`tool-bash`，模型可以绕过你的工具直接改文件。对策是格式幂等（外部改写后能重建索引）、派生索引可重建，不要假设只有你能写。

**沙箱管不到插件自己的代码。** 插件运行在 Host 进程，用 `node:fs` 写盘不受会话沙箱约束；沙箱约束的是模型调用的工具（`tool-fs`/`tool-bash`）。所以架构 I 的写边界是进程账户权限，不是会话 cwd。

## 沙箱对写路径的硬要求

| 事实 | 结论 |
|---|---|
| 策略字段 | 只有 `mode` + `workspaceRoot`，**没有**"额外可写目录" |
| 根从哪来 | 会话 `SessionHeader.cwd`；无会话时用部署兜底 `sandbox-policy.workspaceRoot` |
| `workspace-write` 放行 | 根 + 平台临时目录（`writableRoots`） |
| `cd` | 不放宽：沙箱根锚定原始 cwd |
| 读 | 不受 fs 栅栏限制（栅栏只管 `writeText`/`editText`） |
| 放宽 | 只有一次性审批，或把默认档改成 `danger-full-access` |
| 后端差异 | Seatbelt `deny file-write*`；bwrap 只读宿主根 + 可写 workspace bind；Windows ACL 报 `partial` |

推论：要让模型用通用工具写 `projectsRoot`，会话 cwd 必须落在该根下；插件自己的 `node:fs` 不受这条限制。详见 [sandbox](../../../docs/subsystems/sandbox.md) 与 [fs-sandbox](../../../packages/fs/fs-sandbox/README.md)。

## 秘密

`dataRoot` 文件的 0600 只是权限，不是边界：模型工具以同一个 uid 运行，读路径不受沙箱限制（fs 栅栏只管写）。所以：

- API key 不进配置文件的明文 payload；
- 首选 `apiKeyEnv` 引用或 `CredentialRef`；
- 必须落盘时，只回 `keyConfigured` / `keySource`，绝不回值。

## 检查清单

- [ ] 产品的全局配置只有一个文件，路径由 `dataRoot` 决定
- [ ] `dataRoot` 默认稳定，不鼓励按 profile 改
- [ ] 文件里有 `schemaVersion` 与迁移
- [ ] 每个字段只有一个入口（文件或 config，不双写）
- [ ] 需要跨 profile 一致的字段没有做成 volatile
- [ ] 用户可覆盖的默认值同时存在于 schema/代码默认里（防整对象替换丢值）
- [ ] 明确选了工具中介还是开放 agent；选开放 agent 时会话 cwd 必须是项目目录
- [ ] README 写了优先级链与"改哪个文件生效"
- [ ] 秘密只存引用

## 边界

- 单 Host、单 home；不涉及远端部署。
- 字段级权威与整对象替换只讨论 profile patch 这条路径；home patch 与 `--patch` 见 17 前文与 18。
