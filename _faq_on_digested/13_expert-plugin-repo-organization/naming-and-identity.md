# Naming · 身份与皮肤：DSH 插件里那些"定了就难改"的名字

## 问题

一套专家插件要起很多名字：npm 包名、插件行 `id`、ctx 服务键、工具 wire 名、SessionEventMap 事件名、preset id、settings namespace、slot 名、面板上的标题……它们不在一个平面：有的被会话日志、注册表、下游 patch、用户设置文档钉死，改一次就是一次断兼容；有的纯展示、走 locale、改了只是改文案。这类名字**第 0 天就要定**——不是因为它难起，因为发布后调整的代价不对称：身份名字的改动会同时砸到旧会话重放、用户的 patch overlay、下游 Consumer 的 `inject`、用户的设置文档，而且每处的报错形态都不同（有的 fail-loud，有的静默失配）。

判别式一句话：**被机器在边界上引用或持久化的名字是身份，只被人读的名字是皮肤。** 身份进第 0 天的决策清单并配稳定性纪律；皮肤交给 locale，随时改。

## 三层总表：身份 / 中间地带 / 皮肤

| 名字 | 文法或约束 | 唯一性范围 | 谁钉死了它 | 发布后改名的代价 |
|---|---|---|---|---|
| npm 包名 | npm 规则 + scope 归属；`@deepseek-ai/*` 是 DSH 官方 scope，第三方用自己 scope | npm registry 全局 | `dsh.profile.bundles` 层清单按真实安装名 reconcile（`apps/cli/src/plugin.ts`）；装进 profile 的 `node_modules` 路径即包名；marketplace/awesome 列表按名收录 | = 发一个新包：老用户装不升级，层清单里出现两个身份 |
| 插件行 `id` | 无强制文法，组合内唯一 | 单个组合 | patch 以 id 定位做**整行配置替换**（`docs/architecture.md`）；`--dump-config`、bundle 层引用 | 下游 patch overlay 落空——patch 文件按 fail-loud 纪律在启动期报错或整层失效，用户必须手工改 |
| ctx 服务键（`inject` 名） | 与 Service Definition 声明同名 | 单个组合 | 其他插件 `inject` 它；生成目录（capability-seams / module-graph）按名收图 | 所有 Consumer 的 `inject` 断，装载等待永不满足（fail-loud，但报错在别人的仓库里） |
| 工具 wire 名 | 无强制 regex；生态惯例短 kebab；可经 Config 暴露为部署参数（`tool-subagent` 的 `toolName` 先例：每实例不同名） | 单个组合（同名 shadow） | **会话日志逐字记录**：`tool/call` 事件带 `name` 字段（`packages/core/session/src/types.ts`）；`tool.call.toolview` slot 按工具名 keyed；agent 工具限制按名过滤 | 旧会话重放断（日志里的名字解析不回工具）、专属卡失配、用户限制规则失配 |
| SessionEventMap 事件名 | 必须先声明 merging 进 map 才能写日志；required-on-read | 全局命名空间 | 事件名写进 JSONL；不认识事件的构建拒绝读日志（`ignorable` 除外） | 旧日志读不出 → 属结构性格式变更，走 `SESSION_FORMAT_VERSION` 相邻迁移的整套纪律 |
| preset id | `[a-z0-9][a-z0-9-]*`，id 即目录名 | roster 内；**roots 有序遮蔽** | 会话切换 preset 记录进日志；`presetDisplayText` 以 id 为 key 映射展示文案 | 用户会话的 preset 引用断；且**起 shipped 同名会被遮蔽**（shipped 根 prepend 在最前，叫 `standard`/`ptc`/`cordis`/`minimal` 等于隐身） |
| settings namespace | 小写字母/数字/连字符，TypeScript 字面量与运行时双重校验（`packages/settings/settings/README.md`） | 设置文档内 | 用户覆盖层（`user`）按 namespace 持久化 | 用户设置被孤儿化：文档里那节还在，没有插件认领 |
| slot 名 | `<domain>.<entry>.<hole>` 文法，镜像组合路径；声明冲突在装载期 fail（`packages/client/AGENTS.md`） | client 树内 | 注册方与消费方的合约；`dsh.client.inject` 的模块引用 DSH client 包名 | 注入方与占用方失配；占用 DSH 已声明域 = 装载失败 |
| registry.json 专家 id（方案 D） | 建议与 preset id 同名对齐 | 本 repo | registry → 目录 → 兼容矩阵三处一致（validate 脚本的校验面） | 三处失配，`dsh plugin add` 逐专家装的入口断 |
| `dsh.*` 字段键 | DSH 拥有：`dsh.bundle.patch`、`dsh.client.inject`；生态扩展 `dsh.compatibility`、`dsh.platform` 是事实标准而非 DSH 机制 | — | DSH 读取前两者；后者靠生态自觉 | 不是你的命名空间，别发明新键当机制用 |
| **（皮肤）** preset display name / description | 无 | — | 只进 picker 展示；copy-only authoring 保留 description、给新 id 与可选 display name | 无代价，随时改 |
| **（皮肤）** 面板标题 / UI 文案 | locale-owned：typed dictionaries + `t`；`verify-client-ui-i18n` 拒绝硬编码文案；`README.i18n.yaml` 双语配对 | — | 只被人读 | 无身份代价，走 locale 流程改 |
| **（中间地带）** 工具 description / 参数描述 | — | — | 名字是身份，**description 是模型可见输入**：改它不是身份变更，是行为变更 | 不破坏兼容，但触发 model-visible 纪律：配快照、当行为变更走 dev-loop |

## DSH 保留面（不是你的命名空间）

- **home 布局**：默认 `~/.dsh`、`$DSH_HOME`、`profiles/<name>`、`.agent-presets`、`.credentials.yaml`、`sessions/`——结构由解析顺序与隔离机制拥有，插件不改不占。
- **保留 profile 名**：shipped 模板 `web`/`headless`/`sdk`/`sdk-minimal`/`acp`；Electron 保留 `desktop`。自定义 profile 名自由（`dev`、专家名都行）。
- **shipped preset id**：`standard`/`ptc`/`cordis`/`minimal`（shipped 根永远 prepend 且同名遮蔽）。
- **`@deepseek-ai` scope 与核心 ctx 服务名**：`ctx.agents` 等 DSH 拥有；包不得带 `bin`（应用启动规则：只有 `dsh` profile 启动应用）。
- **核心事件名**：十三种（`turn/start` … `session/end-seed`）。

## 第 0 天清单

**要定（身份，进 `docs/` 当前合同 + 一条 Note 记命名决策）**：

1. npm 包名与 scope（生态惯例：名字里带 `dsh` 便于发现——`@xmanrui/dsh-im`、`dshmarket`、`@dsh-external/*`）。
2. 行 `id` 约定：全部同一前缀（如 `myexpert-flows` / `myexpert-tools`），与包名对齐，下游 patch 好引用。
3. ctx 服务键前缀：一个专家一个前缀，不与 DSH 核心/其他插件撞（dev-loop 设计四问第 1 问的落点）。
4. 工具 wire 名：短 kebab；决定是否像 `tool-subagent` 那样把 `toolName` 做成 Config（部署可换名——但记住日志记录运行时名，换名仍断旧重放，这是"可配置"不是"可反悔"）。
5. 事件名前缀：每条流的事件带专家前缀，避开核心十三种。
6. preset id：`[a-z0-9][a-z0-9-]*`，避开 shipped 四个；与 registry id（若有）对齐。
7. settings namespace：`[a-z0-9-]`；一旦有用户装了就别改（用户覆盖层按它持久化）。
8. slot 域名：`<你的域>.<entry>.<hole>`，第一段用专家前缀，不占 DSH 已声明域。

**不用定（皮肤）**：preset display name、面板/设置页标题、一切 UI 文案——走 locale dictionary；工具 description 属行为层，迭代时当行为变更处理。

## 改名代价速查：什么时候还能反悔

- **发布前**：全部可改，只有 repo 内部引用要跟着动——这正是"第 0 天定"的廉价窗口。
- **有用户安装后**：按上表逐行断——包名 = 新包；行 id = 用户 patch 失配；ctx 键 = 下游 inject 断；工具名 = 旧会话重放断；事件名 = 格式迁移级；preset id = 用户会话引用断；settings namespace = 用户设置孤儿化。要么不走这条路，要么当**破坏性变更**发 major 并写迁移说明（升级矩阵加列的语义反过来用一次）。
- **折中通道**：工具名经 `toolName` Config 暴露为部署参数，把"名字"从代码身份降级为部署选择——适合预期会被改名组合的场景（`tool-subagent` 每实例不同名就是这个用法），但它不撤销历史日志里的旧名。

## 市场对照（五个生态的一手规则，来源 URL 见 [research.md 第四节](./research.md)）

**共性规律**：每个生态都有"机器标识 vs 人类展示"二分——VS Code 与 Claude Code 的 `name`/`displayName`、MCP 的 `name`/`title`、Obsidian 的 `id`/`name`（npm 例外：包名既身份又展示）；身份字段全部被**引用图**钉死（设置键、依赖声明、CLI 参数、URL、缓存/数据目录、命名空间前缀）；防抢注是不可变的深层原因（VS Code Remove 后名字永久保留、npm `name@version` 永久不可复用、MCP Registry 反向 DNS + 所有权验证）；五个生态中**唯一的官方改名迁移**是 Claude Code 的 marketplace `renames` 映射，其余一律"改名 = 新身份"。本篇的"身份 vs 皮肤"判别式就是这条共性在 DSH 上的投影。

- **VS Code**：身份 `publisher.name`（publisher ID 创建后不可改；Remove 后扩展名永久保留防冒名）；展示 `displayName` 随时改零代价，publisher 展示名可改但吊销 verified 徽章——**连"改皮肤"都有副作用分级**。
- **Obsidian**：身份 manifest `id`（小写+连字符、不得含 `obsidian`、全目录唯一；命令 ID 自动带 id 前缀）；展示 `name` 可改、无效值被目录下架。与 DSH preset id 同构度最高：`[a-z0-9-]` 文法 + "id 即身份、名字走展示"。
- **Claude Code**：plugin `name` 官方明文 "**stable identifier**"——`enabledPlugins` 键、缓存路径 `<marketplace>/<plugin>/<version>/`、技能/子代理/MCP 工具的命名空间前缀全钉在它上；`displayName` "Not used for namespacing or lookup" 是官方指定的改名替代。**DSH 对应物**：preset display name 正是这个机制（`presetDisplayText` 以 id 为 key 映射文案）；但 DSH 工具名没有 displayName 通道——工具名本身就是模型接口，想"换皮"只能走 `toolName` Config。
- **npm**：无 rename；`name@version` 永久不可复用（unpublish 也烧不掉）；整包 unpublish 后 24h 禁再发；弃用走 `deprecate`。DSH 第三方包的包名直接继承这套规则——第 0 天起名就是在 npm 的全局命名空间里永久占位。
- **MCP**：线协议 `serverInfo.name` 无格式强制、展示走 `title`；Registry 身份是反向 DNS + 所有权验证。反例价值：**规范不管命名时，生态就自己长出事实标准**（registry 的反向 DNS）——DSH 工具名"无强制 regex、生态惯例短 kebab"正处在这个阶段，早定约好过等人收敛。

## 机制依据

`docs/architecture.md`（patch 按 id 整行替换、保留 profile）、`packages/core/session/src/types.ts`（`tool/call` 事件 `name` 字段）、`packages/core/tools/README.md` + `docs/tool-catalog.md`（工具名 model-visible、`toolName` Config、名字进生成目录）、`packages/preset/agent-presets/README.md`（preset id 文法与 roots 遮蔽、display name/copy 分离、`presetDisplayText`）、`packages/settings/settings/README.md`（namespace 文法与按 namespace 持久化）、`packages/client/AGENTS.md`（slot 文法与冲突 fail）、`packages/client/ui-settings/README.md`（`settings.section` / `settings.plugins.tab` 贡献面）、`apps/cli/src/plugin.ts`（层清单按真实安装名 reconcile）、根 `AGENTS.md`（scope/bin/事件声明/locale-owned 文案规则）、[research.md](./research.md) 第一节（生态命名样本）与第四节（五生态命名规则的一手来源）。
