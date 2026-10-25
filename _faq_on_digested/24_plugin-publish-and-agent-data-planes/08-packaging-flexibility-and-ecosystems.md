# 08 · 灵活度怎么打包：四种性质、五个时点与生态对照

## 一句话

DSH 的灵活度不是“把一个包做得更大”，而是把可变的部分推迟到安装、组合、选择、配置、运行五个时点；打包因此有四种性质——**分发**（包）、**组合**（bundle patch）、**定义**（preset）、**资源**（skill / locale / icon），而**数据不属于其中任何一种**。D（Dify）与 H（Hugging Face）以及 MCP、Claude Code、OpenAI、VS Code、Obsidian 的对照显示：成熟生态都会把“只读工件”和“可写数据”放到不同的位置；DSH 的差异在于把组合层和定义层也显式拆开。

> 外部生态只作对照，不构成 DSH 契约；仓库外行为按 2026-10-25 的公开文档记录，未逐项实测。DSH 结论仍以本 checkout 的源码与产品文档为准。

## 1. 先把“打包”拆成四个问题

“打包”在插件讨论里经常同时指四件事。混着说，就会出现“插件的数据怎么打包”“preset 能不能单独发布”这类没有共同主语的问题。

| 问题 | 载体 | DSH 的答案 | 典型生态对照 |
|---|---|---|---|
| 代码怎么分发？ | npm 包、压缩包、目录、仓库、描述符 | npm 包；`dsh.bundle.patch` 让它同时是 bundle | `.difypkg`、`.vsix`、HF repo、MCP `server.json` |
| 行为怎么组合？ | patch 层、贡献点、清单、依赖 | bundle patch 按 profile 顺序叠层 | VS Code contribution points、Claude Code manifest、Dify 扩展点 |
| 智能体怎么定义？ | preset 行、agent manifest、app DSL | `@deepseek-ai/dsh-agent-preset` 的一行 | Claude Code agents、Dify `app.yaml`、OpenAI `skills/` |
| 数据放在哪？ | KV、workspace 状态、bucket、插件数据目录 | workspace / home / session / host state / cache / credentials | Claude Code `PLUGIN_DATA`、VS Code 五套 storage、HF buckets、Dify 按 workspace 的 KV |

这四问的答案可以分别演进。把它们压成一个“插件格式”，就会在升级、卸载、迁移、审计时付出代价。

## 2. 四种性质

### 2.1 分发：包是信封，不是运行单元

一个 npm 包回答的是“这些字节从哪来、哪个版本、由谁签名、装到哪”。它不回答“运行时哪个实例在跑”。DSH 把这两件事分开：**包负责安装、元数据、保护与移除；行负责这一次组合里的实例**（[01 篇](./01-publishable-forms.md)）。

生态里的分发形态差别很大：

- Dify 的 `.difypkg` 是**密封的运行时包**，`manifest.yaml` 里带权限、架构、Python 运行时和入口；包本身就是安装单位。
- Hugging Face 的 repo 既是工件又是分发单位，“安装”其实是按 revision 拉取；没有独立的 registry。
- MCP 的 `server.json` 是**纯指针**，字节仍在 npm / PyPI / OCI；registry 只保存发布元数据。
- VS Code 的 `.vsix` 是带签名（或可验证签名）的压缩包；Obsidian 的“包”只是 GitHub release 里的三个文件，目录页与工件页分离。
- DSH 的包是 npm 包，但**只有声明了 `dsh.bundle.patch` 才进入插件管道**；普通包只是依赖。

对作者的含义：分发单元与运行单元不是一回事。你发布一个包，用户可能只启用其中一个子路径入口，也可能在 profile 里覆盖你的行配置。版本号管的是包，行 id 管的是运行时契约。

### 2.2 组合：bundle 是层，不是“插件本体”

bundle 的本质是一层 Cordis patch：它插入行、按 id 覆盖前层、替换整段 `config`。profile 决定层的顺序；`cordis.patch.yml`、home patch、`--patch` 再往后叠。这个模型让“改行为”不必 fork 包，但也让**组合本身成为兼容面**。

生态对照：

- VS Code 用 contribution points 做“声明式扩展”，Extension Pack 只做捆绑，不承诺运行时耦合。
- Claude Code 用 `plugin.json` 的 replace / add / merge 规则组合组件，`strict` 决定清单冲突是否报错。
- Dify 只在平台定义的扩展点上做加法，没有覆盖别人已安装插件的机制。
- OpenAI 的 `extensions.<vendor>` 用命名空间把厂商语义隔离在同一个清单里。

**DSH 的 bundle patch 是这几家里最“侵入”的组合层**：它能按 id 改别的包的行。没有哪家主流生态把“覆盖第三方安装物的配置”作为一等能力。这带来最大的灵活度，也带来最重的契约：行 id、`config` 键、默认值、覆盖顺序都必须当 API 维护。

### 2.3 定义：preset 是声明，不是程序

preset 回答的是“这个智能体由哪些子插件组成”，它是一行 `@deepseek-ai/dsh-agent-preset` 配置，不是包、不是目录、不是可执行入口。它的运行时语义是**按 id 选择、按 revision 持有**：已有 Agent 保持启动时的 revision，新 Agent 用当前定义；进程重启按当前定义恢复，定义缺失则拒绝（[04 篇](./04-readonly-agent-definition.md)）。

生态对照：

- Claude Code 的 agent 定义是 `agents/` 下的 Markdown 文件，随插件目录分发；没有独立的 revision 概念，改文件就改下一次会话。
- Dify 的 app 是 `app.yaml`（DSL），导出/导入是定义层；但导入会连 web-app 设置一起带过去，定义与部署没有完全分开。
- OpenAI 的 portable plugin 用 `skills/` + `plugin.json`，定义与工件仍在同一个包里。
- Hugging Face 没有“智能体定义”这一层；Space 的 `README.md` 是元数据，不是行为定义。

DSH 把定义从包里拿出来做成一行，好处是配置型 bundle 可以零代码交付一个智能体；代价是**覆盖是整段替换**，不是继承。作者必须把 `plugins` 当完整快照维护，不能指望上游新增的子行自动合并进来。

### 2.4 资源：只读、与版本绑定，但不是“数据”

skill、locale、icon、模板、参考文件都属于资源：它们随包发布、随版本替换、运行时不写回。skill 的特别之处是它有两种投递方式：

- `skill-filesystem` 扫描配置的根（项目、custom、`$DSH_HOME/skills`、`~/.agents/skills`、`bundledSkillDir`）；
- 包内 provider 直接向 `ctx.skills` 注册候选（`dsh-skill-badge` 是现成例子）。

**包内 `assets/skills` 不会自动被发现**：它既不在默认扫描根里，也不是 provider。要让随包技能进入会话，必须由包内 provider 用 `import.meta.url` 注册，或在部署配置里把 `bundledSkillDir` 指到已安装包的绝对路径。前者可移植，推荐。

生态对照：

- HF 的 model card、VS Code 的 theme/language pack、Dify 的 provider YAML 都是“资源随工件走”；其中只有 Dify 把 provider 声明提升为权限与入口的一部分。
- Claude Code 的 `skills/` 是固定目录，运行时按约定发现；DSH 则把“发现哪些根”做成 provider 配置，灵活度更高，但少了一层“包内自动发现”的约定。

### 2.5 数据：不是第五种性质

数据不是第五种打包性质；它是四种性质之外、必须单独归属的运行产物。把它放在本节，是为了划清“包里有什么”与“包里没有什么”的边界。

数据有独立的归属、生命周期与可见性。它可能物理上住在 `$DSH_HOME`，但逻辑上不属于包，也不属于 preset。把数据塞进包目录、preset、`Config` 默认值或模块全局，短期能跑，升级/迁移/多会话时必坏。具体切法见 [09 篇](./09-agent-data-cuts.md)。

## 3. 灵活度的五个时点

“灵活”不是没有约束，而是把选择放到合适的时点，并让每个选择可被记录、可被复现。

| 时点 | 谁决定 | 可以变什么 | 不能变什么 | 失败方式 |
|---|---|---|---|---|
| 安装 | 用户 / 安装器 | 渠道、版本、registry、是否允许构建脚本 | 包的 `name`、入口、`engines.dsh` 契约 | 装后坏、版本拒绝、构建脚本被拦 |
| 组合 | 用户 / profile / 插件管理器 | 哪些 bundle、顺序、启用/禁用、profile patch 覆盖 | 行 id 的语义、Config 的必填项 | 覆盖丢默认值、顺序改变优先级、跳过 bundle |
| 选择 | 会话 / 用户 | 选哪个 preset、空白会话切换 | 已运行 Agent 的 revision | 新会话看不到、恢复时定义缺失 |
| 配置 | 部署者 / 用户 | 行内 `config`、Config 字段 | 安全不变量、协议常量、数据边界 | 整段替换、校验失败、默认值漂移 |
| 运行 | Agent / 插件 | 读写哪些数据、调用哪些工具 | 模型可见 ⟺ 已记录 | 重放不一致、数据串会话、secret 泄漏 |

这张表的用法：**每增加一个“可配置”的维度，就要回答它在哪个时点被固定、被记录在哪里、升级时怎么迁移。** 否则灵活度会变成不可复现的矩阵。

DSH 的复现锚点有三个：会话日志（模型可见输入）、preset id + revision（定义）、包版本 + 组合层（代码与接线）。三者缺一，回放就可能和当时不同。

## 4. 包粒度：一个包还是一组包

合理的粒度不是“越大越完整”，而是**边界清楚、生命周期一致**。满足下面任一条就考虑拆：

- 两个能力有独立的版本节奏（例如 Host 插件与 Web 客户端）。
- 两个能力有不同的信任/权限要求（例如需要网络凭据的 provider 与纯 UI）。
- 两个能力有不同的所有者或发布渠道。
- 两个能力的数据边界不同（一个只读技能，一个写 workspace）。
- 第二个消费者出现，需要独立复用。

不该拆的理由：只是“文件多”、只是“想让名字更细”、只是“未来可能复用”。过早拆包会让 peer 解析、行 id、安装形状和测试矩阵成倍增长。

| 你要交付 | 推荐形态 | 包内需要 | 不需要 |
|---|---|---|---|
| 新工具/服务/策略/模型适配 | 代码插件 + bundle patch | 入口模块、Config、patch 行 | preset、client |
| 只接线（MCP、preset-only、skill provider） | 配置型 bundle | `package.json` + patch | `main`、运行时代码 |
| 一个专用智能体 | bundle 里的 preset 行 + 子插件行 | preset 配置、子插件依赖、只读资源 | 复制 Host、fork loop |
| 领域知识 | bundled skill 或 provider | `SKILL.md`、`references/`、provider 代码 | 把长文塞进系统提示词 |
| Web 面板/卡片 | `dsh.client` 模块 | `dsh.client`、`./client` 导出、构建产物 | iframe、替换应用根 |
| 外部工具连接 | 配置型 bundle + MCP client 行 | MCP 配置、凭据引用 | 自写 MCP 协议 |

## 5. 生态对照：D、H 与相邻生态

下表只比较与本篇问题相关的维度。D = Dify，H = Hugging Face。

| 维度 | DSH | Dify | Hugging Face | MCP Registry | Claude Code | VS Code |
|---|---|---|---|---|---|---|
| 安装物 | npm 包；bundle = patch 层 | `.difypkg`（平台）/ `.ifpkg`（app） | git repo + Storage Buckets | 无，`server.json` 指向 npm/PyPI/OCI 等 | 目录（`plugin.json` 可选） | `.vsix` |
| 清单 | `package.json` + `dsh.bundle` + typed `Config` | `manifest.yaml`（权限、架构、运行时） | README front matter + `config.json` | `server.json` | `plugin.json`（仅 `name` 必填） | `package.json` + `engines.vscode` |
| 组合 | patch 覆盖 + profile 顺序 + preset | 平台扩展点，加法 | 按引用挂载，只读 volume | 客户端侧挂多个 server | replace / add / merge + `strict` | contribution points + Extension Pack |
| 定义 | preset 行，按 revision 持有 | `app.yaml`（DSL） | 无独立定义层 | 无 | `agents/` + `skills/` 文件 | 清单中的 contributions |
| 只读工件 vs 可写数据 | 包/preset vs workspace/home/session/host state | 插件包 vs 按 workspace 的 KV | repo / 只读 volume vs 临时磁盘 / bucket | 描述符 vs 客户端/服务端自有状态 | `PLUGIN_ROOT` vs `PLUGIN_DATA` | `globalState` / `workspaceState` / `secrets` |
| 信任 | 安装渠道 + 兼容检查；市场只校验格式 | 默认强制签名 + 市场审核 | GPG commit 签名 + gating | 命名空间认证 + 包所有权 + registry 白名单 | 保留名 + `sha256`（archive）；无签名 | 市场签名 + 发布者信任提示 |
| 索引 | profile + 市场静态 JSON + 官方目录 | git PR 目录树 | Hub API over git | 版本化 list API | `marketplace.json`（多种来源） | Marketplace API / 私有市场 |

### 5.1 五个可借的教训

1. **只读工件根 + 独立可写数据目录。** Claude Code 明确写了 `${CLAUDE_PLUGIN_ROOT}` 会随更新变化，不能写状态；`${CLAUDE_PLUGIN_DATA}` 才是跨更新保留的目录。VS Code 用 `globalState` / `workspaceState` / `secrets` 把作用域、表示和机密性拆开。HF 用“临时磁盘 vs bucket”把可丢和持久分开。DSH 的对应物是包目录 / workspace / `$DSH_HOME` / storage domain / cache / credentials。
2. **权限要在安装前可见。** Dify 的 `resource.permission` 让用户在安装前看到工具、模型、节点、endpoint、存储、网络的申请。DSH 目前没有 per-plugin 权限清单；插件作者至少应在 README 的 Data / Security 节写清能力与数据边界，宿主侧则靠 sandbox、approval、凭据服务兜底。
3. **版本不可变、范围不能代替版本。** MCP Registry 要求每次发布的版本唯一且不可变，并明确禁止范围。DSH 的市场 index 列精确版本，但安装时仍会重新读包 manifest 并做兼容检查；作者不要把“市场列了某版本”当成安装保证。
4. **构建来源证明是分发层的信任，不是安全审计。** npm 的 SLSA 构建证明 + Sigstore 能证明“哪个仓库、哪个 CI 作业产生了这个 tarball”，不能证明作者没有恶意。DSH 的安装渠道可以消费 npm 的构建证明，但市场 index 目前只校验格式；作者应把 npm 的构建证明发布、签名 release、固定 commit 作为供应链质量线。
5. **临时与持久的边界要写进产品，而不是靠作者自觉。** HF Space 的临时磁盘丢数据是最常见的故障；Claude Code 用 `PLUGIN_DATA` 把“插件要持久化”变成显式选择。DSH 的 storage domain 与 cache 也应让作者显式选择，而不是默认写包目录。

### 5.2 DSH 与它们真正不同的地方

- **patch/overlay 组合。** 其他生态基本只做加法或按引用挂载；DSH 允许按 id 覆盖前一层的行与整段配置。这带来“不 fork 也能改行为”的能力，也把行 id 与配置键变成长期契约。
- **preset revision。** 其他生态的 agent 定义多是文件或 app DSL；DSH 把“定义”做成可选择的运行时 revision，已有 Agent 不被中途改写。
- **model-visible ⟺ logged。** 这是 DSH 自己的不变量：模型看到的会话内容必须能从已提交事件重建。多数生态只记录 chat transcript，不承诺 fork/replay/compaction 的一致性。
- **数据三归属的导航模型。** workspace / home / session 的粗分容易讲，但真正的实现还要加 host state、cache、credentials；见 09 篇。

## 6. 灵活度的边界

### 6.1 不要做成可配置的

- 安全不变量：沙箱模式的含义、凭据解析时机、审批语义。
- 协议常量：MCP 传输、session event 的判别式、市场 index 的 `format: 1`。
- 模型可见的日志规则：不能为了“灵活”让某个插件绕过 session event。
- 数据根：不能让插件自选“把用户数据写到包目录”。

### 6.2 必须当 API 维护的

| 契约 | 为什么 | 破坏方式 |
|---|---|---|
| 行 id | 用户按 id 覆盖、启用/禁用 | 改名 |
| preset id | 会话按 id 保存与恢复 | 改名、删除 |
| `Config` 字段 | 用户按字段覆盖 | 改名、改类型、改默认语义 |
| skill 名 | 模型按名字选择 | 改名 |
| locale 键 / `meta.title` | 客户端按语言展示 | 删键 |
| client module id | 浏览器按包名加载 | 改包名、改 `./client` 导出 |
| storage domain 名 + schema | 宿主状态的所有权 | 改 schema 不做迁移 |

### 6.3 六个版本，不要混成一个

| 版本 | 归属 | 变更规则 |
|---|---|---|
| 包版本（SemVer） | npm | 代码/资源/组合层的发布单位 |
| 组合契约版本 | bundle patch | 行 id、Config 键、默认值；破坏性变更写迁移 |
| 定义版本（revision） | preset | 由声明内容决定；已有 Agent 保持旧 revision |
| 资源版本 | skill / locale / icon | 随包替换；用户可编辑的不要放包内 |
| 数据 schema 版本 | storage domain | 版本不匹配拒绝打开；自己迁移 |
| 会话格式版本 | DSH | 不是插件作者可改的；只按 `SESSION_FORMAT_VERSION` 规则演进 |

## 7. 一个决策流程

```text
你要交付的东西，主要是什么？
├── 只读知识（流程、检查表、领域事实）
│   ├── 与包版本绑定 → bundled skill（provider 注册）
│   └── 用户要编辑 → workspace / home 的 skill 根或 AGENTS.md
├── 外部工具连接 → 配置型 bundle + MCP client 行
├── 新运行时行为（工具/服务/策略/模型适配） → 代码插件 + bundle patch 行
├── 只是把现有插件接起来 → 配置型 bundle（可以零代码）
├── 一个专用智能体 → bundle 里的 preset 行 + 子插件行
├── Web 面板/卡片 → dsh.client 模块 + Host 行
└── 数据 → 不是打包问题；按 09 篇选 workspace/home/session/host state/cache/credentials
```

再问三个问题：

1. 关掉这个包，用户还能启动吗？（能 → 可选 bundle；不能 → 必需行/基础设施）
2. 升级这个包，需要同时改数据吗？（需要 → 你放错了数据位置）
3. 第二个消费者出现时，需要独立版本吗？（需要 → 拆包；不需要 → 单包）

## 8. 结论

**打包的性质是“把可复用的部分固定下来，把可变的部分推迟到有记录、可回滚的时点”。** DSH 用四种载体分别固定四件事：

- 包固定**代码与资源**；
- bundle patch 固定**组合**；
- preset 固定**定义**；
- profile 固定**这一次运行的选择**。

数据不在这四者里。它由 workspace、home、session、host state、cache、credentials 六个位置承接，每个位置有自己的所有者、生命周期与可见性。把这条线守住，插件才能既灵活又不失控；把“灵活”理解成“所有东西都能在一个包里改”，最后一定会在升级、回放或多会话并发时付账。

## 9. 证据与边界

DSH 侧：

- 包 / bundle / profile：[publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/user/develop/basic/publish.md)、[bundle README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/bundle/README.md)、[app-boot README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/boot/app-boot/README.md)
- preset / revision：[preset README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/preset/README.md)、[agent-preset-registry README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/preset/agent-preset-registry/README.md)
- skill / provider：[skill-filesystem README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/skill/skill-filesystem/README.md)、[skill-badge 实现](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/experimental/skill-badge/src/index.ts)
- client module：[client-modules README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/client/modules/README.md)
- 市场 / 官方目录：[plugin-market 指南](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/user/guide/plugin-market.md)、[官方目录生成器](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/scripts/gen-official-bundle-catalog.ts)

外部侧（2026-10-25 文档，未实测）：

- Dify：`.difypkg` / 权限 / 签名 — [manifest](https://docs.dify.ai/en/develop-plugin/features-and-specs/plugin-types/plugin-info-by-manifest)、[第三方签名](https://docs.dify.ai/en/develop-plugin/publishing/standards/third-party-signature-verification)、[持久 KV](https://docs.dify.ai/en/develop-plugin/features-and-specs/plugin-types/persistent-storage-kv)、[app 导出](https://docs.dify.ai/en/self-host/use-dify/workspace/export-import-apps)
- Hugging Face：repo / Space / 临时磁盘 / buckets — [repositories](https://huggingface.co/docs/hub/repositories)、[Spaces storage](https://huggingface.co/docs/hub/spaces-storage)、[config reference](https://huggingface.co/docs/hub/spaces-config-reference)
- MCP Registry：`server.json` / 版本不可变 — [package types](https://modelcontextprotocol.io/registry/package-types)、[versioning](https://modelcontextprotocol.io/registry/versioning)
- Claude Code：插件目录 / `PLUGIN_ROOT` vs `PLUGIN_DATA` / 市场 — [manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference)、[security](https://code.claude.com/docs/en/plugins/security)
- OpenAI：portable plugin manifest — [package your plugin](https://developers.openai.com/plugins/build/plugins)、[plugin schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json)
- VS Code：manifest / storage / 签名 — [extension manifest](https://code.visualstudio.com/api/references/extension-manifest)、[common capabilities](https://code.visualstudio.com/api/extension-capabilities/common-capabilities)
- Obsidian：三文件 / release 标签 — [submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- npm 构建证明 / Sigstore / SLSA — [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish)、[Sigstore overview](https://docs.sigstore.dev/about/overview/)、[SLSA levels](https://slsa.dev/spec/v1.1/levels)
