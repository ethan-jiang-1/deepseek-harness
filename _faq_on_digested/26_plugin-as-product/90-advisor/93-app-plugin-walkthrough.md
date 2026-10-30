# 93 · 端到端：一个应用型插件怎么落地

这一篇用一个**假想的看板应用**把 [40](./00-index.md) 的七步走一遍。例子不是规范——换一个产品，目录名、字段名都会不同；要抄的是**顺序与分界**，不是字面配置。

## 0. 设定

- 产品：Kanban Studio，用户用它管理多个看板项目；
- 交付：一个 bundle 包 `dsh-plugin-kanban-studio` + 一份 `kanban` profile；
- 模型只调产品工具（`kanban_*`），不直接写项目文件 → 选架构 I（工具中介）。

## 1. 定位与承诺（P5）

一句话：**打开 Kanban，用户能选一个看板项目，用对话改卡片、看进度。**

主承诺 **P5 产品实例**：这个 DSH 由 Kanban 决定装什么、从哪起步；内部组合 P2（项目内容）+ P3（账本）+ P4（安装参数）。

## 2. profile 与 bundle 组合

```text
$DSH_HOME/profiles/kanban/
├── package.json          # dependencies + dsh.profile.bundles
└── cordis.patch.yml      # 安装参数（很少）
```

`dsh.profile.bundles` 的顺序：

```text
@deepseek-ai/dsh-base  →  @deepseek-ai/dsh-web-app  →  dsh-plugin-kanban-studio
```

产品 bundle 放最后，才能按 id 覆盖前两层的行。没有 `extends: web` 这种继承，复现 Web 组合靠的是把 web-app 列进来（[18](../10-foundations/18-install-upgrade.md)）。

## 3. 架构选择

| 选项 | 选它因为 | 代价 |
|---|---|---|
| **I 工具中介**（本例） | 写操作都由 `kanban_*` 工具落盘，沙箱无关；项目目录可以任意 | 每个动作都要有工具 |
| II workspace 化 | 模型要用 `read`/`write`/`bash` 改项目文件 | 会话 cwd 必须落在项目里；沙箱决定一切 |
| III 混合 | 既想侧栏按项目开会话，又想保留账本 | 两套真相要同步 |

本例选 I：preset 只挂 `persona` + `kanban` 工具，不挂 `tool-fs`/`tool-bash`。

## 4. 根与启动

```text
configured  ← profile 的 projectsRoot（可选，部署方指定）
adopted     ← 全局设置文件里的 adoptedRoot（用户在弹窗里选过）
default     ← <dataRoot>/workspace（产品默认）
unresolved  → 登记占位 + 客户端弹窗
```

规则（[16](../10-foundations/16-startup-resolution.md)）：

- `configured` / `default` 缺失可以 `mkdir`；`adopted` 缺失不能重建，转 `missing` 重新问；
- `unresolved` 时先登记 `$DSH_HOME/kanban/workspace` 占位，挡住 `<Documents>` 默认工作区；
- 用户的选择写进 `dataRoot/settings.json`（跨 profile 一致），不写 profile patch。

## 5. 配置分层

`dataRoot` 本身只能来自 profile 或 env——这是"鸡生蛋"边界：

```yaml
# profiles/kanban/cordis.patch.yml
- id: kanban-studio
  name: 'dsh-plugin-kanban-studio'
  config:
    displayName: 'Kanban'
    dataRoot: ''            # 空 = $DSH_HOME/kanban
    projectsRoot: ''        # 空 = <dataRoot>/workspace
```

| 值 | 放哪 | 为什么不放别处 |
|---|---|---|
| `dataRoot` | profile config | 插件启动第一行就要用；不能从 dataRoot 文件里读 |
| `displayName` | profile config | 安装参数，装一次 |
| 用户选定的根 | `dataRoot/settings.json` | 跨 profile 一致；settings 会按 profile 分裂 |
| 渲染/外部服务偏好 | `dataRoot/settings.json` | 运行时可变，产品 UI 编辑 |
| API key | `ctx.credentials` 引用 | 不落配置文件 |

注意 patch 是**整对象替换**：手写只覆盖一个键会丢其余默认值（[17](../10-foundations/17-config-layers.md)）。

## 6. 账本

```text
$DSH_HOME/kanban/
├── settings.json      # 全局设置（adoptedRoot、偏好）
├── index.json         # 账本·索引：可重建
└── state.json         # 账本·状态：不可重建
```

| 事实 | 文件 | 键 | 丢了会怎样 |
|---|---|---|---|
| 项目索引 | `index.json` | `w_<sha256(realpath)>` | 重扫可重建 |
| 会话 → 看板绑定 | `state.json` | `SessionId` | 丢失即丢事实 |
| 同步游标 | `state.json` | 项目键 | 需要重新同步 |
| 用户选定的根 | `settings.json` | 单例 | 丢失需重新问 |

**账本目录不能登记成 workspace**；否则模型（或用户）能改写你的注册表。

## 7. 安装、升级、卸载

- **安装**：`dsh plugin --profile kanban add <bundle>`；bundle 成员变化需重启；
- **兼容**：manifest 写 `engines.dsh`；不匹配会被跳过并在 stderr 报 `skipping profile bundle`；
- **升级**：组合（bundle 版本）、配置（patch 差异）、数据（`settings/index/state` 的 `schemaVersion`）三层分别处理；数据版本不符要么迁移、要么 fail loud；
- **卸载**：workspace 登记、`dataRoot`、目录内 marker、profile patch 里的行——四处写进 README。

## 8. 数据卡

| 事实 | 承诺 | 空间 | 位置 | 键 | 谁删 | 换机器 |
|---|---|---|---|---|---|---|
| 看板项目内容 | P2 | workspace | 项目目录 | 路径 | 用户 | 跟目录 |
| 项目索引 | P3 | 账本·索引 | `index.json` | 路径哈希 | 插件 | 丢，可重建 |
| 会话绑定 | P3 | 账本·状态 | `state.json` | `SessionId` | 插件 | 丢 |
| 用户选定的根 | P5 | 全局设置 | `settings.json` | 单例 | 用户/插件 | 丢 |
| 安装参数 | P4 | profile | patch | 行 id | 用户 | 跟 profile |

## 9. 测试清单

- 冷启动四状态各一遍；`missing` 不重建；
- 未挂载卷：不允许在 `adopted` 路径建会话（`mkdir -p` 会物化挂载点）；
- 两个 profile 共用 home：工作区列表互相可见；
- 配置整对象替换：手写只覆盖一个键后，其余默认值是否还在；
- 升级：bundle 成员变化后重启；`schemaVersion` 不符时 fail loud；
- 卸载：四处残留与 README 一致。

## 10. 如果改成开放 agent

只改三处：

1. preset 加 `tool-fs` / `tool-bash`；
2. 会话创建时 cwd 必须落在项目目录（`workspaceId`）；
3. 接受沙箱约束：唯一可写根、`cd` 不放宽、放宽只能一次性审批。

其余（账本、配置、安装）不变。

## 边界

- 这是示范，不是模板；字段名与目录名按产品调整。
- 具体 API 与配置字段以当前 docs/源码为准；证据标记见 [40-evidence](../40-evidence/00-index.md)。
