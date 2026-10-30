# 05 · 写插件时的落位清单

这一篇把前面的结论压缩成"写 `dsh-plugin-deck-studio` 时照着填"的东西。目标：**任何一块数据，都能一句话说清它在哪、谁删、换机器还在不在、模型能不能看见。**

## 决策树（七问）

按顺序问，不要跳：

```text
0. 模型要对项目目录用通用文件工具吗？
   不要 → 架构 I：插件中介写，项目不必是 workspace（见 04）
   要   → 架构 II：会话 cwd 必须落在项目里；其余照常问，第 4 问再确认
1. 这块数据的权威是谁？
   用户/项目文件 → 留在目录里，插件只读或用 ctx.fs 写
   插件自己     → 继续
   没人（派生） → 可重建，放 domain 或内存
2. 它是"安装参数"还是"项目状态"？
   安装参数（根目录、显示名） → profile patch / Config
   项目状态（游标、索引）     → 插件 domain，键 = 路径哈希
3. 它要不要跨机器/跨 home？
   要   → 目录内 marker（并接受污染仓库）
   不要 → registry + domain 就够
4. 模型要写它吗？
   要   → 会话 cwd 必须在里面（否则沙箱拒绝）
   不要 → 插件用 node:fs，或 ctx.fs + 显式策略
5. 用户能看见/编辑/删除吗？
   能 → 目录内文件，或设置页（volatile 字段）
   不能 → domain
6. 卸载/升级时留什么？
   写进 README；domain 版本号；marker 版本号
```

## 数据卡模板

每个 archetype 填一张：

| 项 | 值 |
|---|---|
| 事实 | 一句话（"这个目录属于哪个项目"） |
| 权威 | 用户 / 插件 / DSH / 无 |
| 落点 | 目录内文件 / `$DSH_HOME/storages` / profile patch / localStorage |
| 作用域 + 键 | session / workspace（path 哈希）/ profile / home |
| 寿命 | turn / session / project / install |
| 读写者 | 模型 / 用户 / 插件 / 浏览器 |
| 删除 | 谁删、怎么删、删不干净怎么办 |
| 迁移 | 换机器、换 home、schema 升级 |
| 证据 | C / H / P / U |

## `deckline` 的具体建议

### 1. profile 层（安装参数）

```yaml
# ~/.dsh/profiles/deckline/cordis.patch.yml（或在产品的 bundle patch 里做默认值）
- id: deck-studio
  name: 'dsh-plugin-deck-studio'
  config:
    displayName: 'Deckline'
    dataRoot: ''                                   # 空 = $DSH_HOME/deckline（账本根）
    projectsRoot: '/Users/bowhead/ai_org_general/decks'  # 用户可见的项目落盘根
```

两个根要分开说清楚：

- `dataRoot`：账本、注册表、会话绑定、素材库。**默认留在 home**，因为它不是用户内容。
- `projectsRoot`：新建项目的落盘位置，通常指到用户目录，便于打开、备份、移交。

`projectsRoot` 建议做成 **volatile 字段**：设置页可改，写回当前 profile 的 patch 并立即生效。`dataRoot` 一般不需要暴露给用户。

**不要**把项目清单写进 profile：profile 是"装一次"的单位，不是"项目列表"的容器。清单属于 `dataRoot` 里的账本（或 DSH registry，取决于架构）。

### 2. bundle 层（产品默认值）

产品应该是**一个 bundle 包**（`dsh.bundle.patch`），以 `dsh-base` + `dsh-web-app` 为前两层，自己的 patch 放在最后，用 id 覆盖/插入行。这样：

- 用户 `dsh plugin --profile deckline add @your/deckline-bundle` 即可；
- 升级是 `dsh plugin ... update`（bundle 成员变化要重启）；
- 用户自己的 `cordis.patch.yml` 仍然压在产品层之上——不要试图接管它。

### 3. 项目数据（账本放哪）

两种都成立，区别是"要不要 DSH 帮你管 schema/版本/并发"：

**A. DSH `storageDomain`**（结构化、有 schema 和版本）

```text
domain: deck_studio          # 静态名，一个 Host 一个
layout: per-record
key:    w_<sha256(realpath)> # 必须是 [a-zA-Z0-9_-]+
value:  { path, title, adoptedAt, lastSeenAt, indexCursor? }
```

- 只存**派生/游标**；项目内容永远在目录里。
- 键用路径哈希，**不要**用 `workspaceId`（删了重加会换 uuid）。
- 带 `lastSeenAt`，读到不存在的路径时标记清理，而不是当场删。
- 两个实例共用一个 domain 时，把实例 id 放进键：`inst_<entryId>_w_<hash>`。

**B. `dataRoot` 下的 JSON 文件**（现状）

`deck-studio` 用的是这一类：`decks-registry.json`、`designs-registry.json`、`session-bindings.json` 全部在 `dataRoot` 下，用 `node:fs` 读写。

| | A domain | B 文件 |
|---|---|---|
| schema/版本 | 有，版本不符 fail loud | 自己写 `schemaVersion` 与迁移 |
| 并发 | 由 domain 层排序 | 自己处理（单进程内一般够） |
| 可读性 | 结构化、模型不可见 | 用户可直接看/改 |
| 备份/移交 | 跟着 home | 跟着 `dataRoot`，可以指到用户目录 |
| 写入通道 | `ctx.storageDomain` | `node:fs`（不经沙箱） |

选 B 的常见理由：账本要跟 `dataRoot` 一起移动、要人肉可读、要跟项目内容放一起。选 A 的理由：不想自己实现版本与原子写。**不要两边都当权威。**

### 4. 目录里的东西（只在需要时写）

| 文件 | 什么时候写 | 规则 |
|---|---|---|
| `AGENTS.md` | 产品希望每个项目都带同一套指令 | **仅当不存在**时写；文件头注明"由 X 生成，可自由编辑"；不要覆盖用户版本 |
| `.agents/skills/*` 或 `.dsh/skills/*` | 项目级技能 | 同上；也可以完全不写，改用 profile 的 `customSkillDirs` 做"工作室级"技能 |
| `.deckline/project.json` | 需要跨机器识别同一项目 | 内容只放 `{ schemaVersion, id }`，不要放路径/标题；加进 `.gitignore` 的说明放 README |
| `.gitignore` | 如果写了 marker | 只在文件不存在时追加一行，不要重写 |

**注意**：`<projectsRoot>/AGENTS.md` 这种"工作室级指令"**不会**被加载——指令发现从项目根（最近 `.git` 标记）往下到 cwd，根之外不看（[files.ts:232](../../packages/context/agent-instructions/src/files.ts)）。工作室级要么放 `$DSH_HOME/AGENTS.md`（但那是全 profile 共享的），要么走 `skill-filesystem.customSkillDirs`（可配、按 profile）。

### 5. 会话与沙箱

- 新会话必须带 `workspaceId`（GUI 默认如此），cwd 才会落在项目里。
- **不要**指望 `cd` 或 `sandbox-policy.workspaceRoot` 让模型写到根外。
- 如果产品有"新建项目"动作：先 `mkdir`，再 `registry.create`，再让用户开会话。
- 如果产品要让模型一次改多个项目：做不到单会话；拆会话，或接受审批升级。

### 6. 卸载

README 必须写清：

- 插件 domain（`$DSH_HOME/storages/deck_studio.json`）
- 目录内的 marker / AGENTS.md
- profile patch 里留下的行
- 工作区登记（`delete` 只删登记，目录不动）

## 交付前检查表

- [ ] 每块数据都有数据卡，且只有一个权威
- [ ] domain 用了路径哈希，不是 `workspaceId` / 裸路径
- [ ] 目录内写入是幂等的、仅当不存在、有生成标记
- [ ] 模型的写路径要么在会话 cwd 内，要么有明确的产品决策（不用审批当常规）
- [ ] `projectsRoot` 的类型（volatile / 非 volatile）与"谁能改"一致
- [ ] 删除/复活语义已选定（目录树权威 / 登记表权威 / 墓碑）
- [ ] 升级路径：domain 版本、marker 版本、失败是 fail loud
- [ ] README 写了卸载留什么、怎么清
- [ ] 换 `$DSH_HOME`、换机器时的行为写了
- [ ] 在 `web` 和 `deckline` 两个 profile 下都试过（共享 home 的可见性）
- [ ] 启动解析有四种状态，且 `unresolved` 时有占位工作区（见 07）
- [ ] 无客户端时能降级到默认目录，不阻塞启动
- [ ] 账本目录没有被登记成 workspace（模型不能改写自己的账本）

## 容易犯的错（这个场景特有）

- **把 `projectsRoot` 当成沙箱根**：它只是配置；沙箱只认会话 cwd。
- **把项目清单写进 profile patch**：profile 是安装单位，不是数据库。
- **启动时重写用户目录**：用户手改过的东西会被覆盖；只写不存在的东西。
- **用 `workspaceId` 当长期键**：删一次工作区就失联。
- **假设只有一个 profile**：同一个 home 下 `web` 和 `deckline` 共享工作区列表与会话历史。
- **用审批弹窗兜底**：说明目录安排错了。
