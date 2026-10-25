# Answer 24 · 发布的是 bundle，跑起来的是 plugin，选中的是 preset，数据三者都不是

## 一分钟结论

**DSH 的作者侧只有一种可发布物：bundle。** 它是一个 npm 包，`package.json` 的 `dsh.bundle.patch` 指向一份或多份 Cordis patch；用户把它装进某个 profile，profile 按 `dsh.profile.bundles` 的顺序叠层启动。profile 是用户侧的运行组合，不是作者发布的东西——产品文档的原话是 “A bundle is what you author and distribute; a profile is what a user boots... Nothing is both.”（[publish.md](../../docs/user/develop/basic/publish.md)）

**bundle 里可以装五种贡献，但只有一种是“代码”：**

| 贡献 | 在 bundle 里的形态 | 运行时身份 |
|---|---|---|
| 行为插件 | 导出 `apply(ctx)` 或 service class 的模块，被 patch 行 `name` 引用 | plugin |
| 智能体定义 | `@deepseek-ai/dsh-agent-preset` 的一行 `config.plugins` | preset |
| 只读知识 | 包内 `SKILL.md` + `references/`，由 skill provider 行注册 | skill（bundled） |
| Web UI | `dsh.client` + `exports["./client"]`，由 Host 行挂载 | client module |
| 外部工具 | 配置型 bundle 插入 `@deepseek-ai/dsh-mcp-client` 一行 | MCP tools |

**数据从来不在 bundle 里。** 它只有三个归属：会话工作区（working folder）、`$DSH_HOME` 用户目录、会话日志。插件要读写数据，必须通过 `ctx.fs`、`ctx.storageDomain`、`ctx.sessionProjections` 这些服务，并明确它是 workspace 相对还是 home 相对；不能写进包目录，也不能藏在模块全局变量里。

**DSH 真正强制的发布条件很少：** bundle patch 存在且能解析、模块能被 Node 解析、`engines.dsh` 或 DSH peer 范围满足、`Config` 能通过校验。README、图标、测试、许可证、SemVer 纪律、数据边界都是质量线，不是门禁；但它们决定插件能否被发现、被信任、被升级。

## 一张图先分清三层

![三个角色与五种贡献](./figures/01-three-roles.svg)

- **作者层**：写 bundle（包 + patch + 资源），不写 profile。
- **用户层**：profile 决定哪些 bundle、什么顺序；`cordis.patch.yml` 是用户自己的覆盖层。
- **运行层**：Loader 把 patch 叠成插件树；会话从 preset 里取自己那份只读定义；数据从 workspace、home、session 三个位置读。

## 三张判据表

### 表 A · 你要交付的东西，应该做成哪种形态

| 你想交付 | 做成 | 不要做成 |
|---|---|---|
| 新工具、服务、策略、模型适配 | plugin 包 + bundle patch 行 | 新可执行入口、独立 CLI |
| 一个专用智能体（人设 + 工具 + 技能） | bundle 里的 preset 声明行 + 子插件行 | 复制一份 Host、fork agent-loop |
| 只有流程知识、领域经验 | 包内 bundled skill；可编辑经验放 workspace/home 的 skill 根 | 塞进系统提示词的硬编码长文 |
| 只有外部工具连接 | 配置型 bundle（插 MCP client 行） | 自己写一个 MCP 协议实现 |
| 新 Web 面板 / 卡片 | `dsh.client` 模块 + Host 挂载行 | iframe 页面、替换应用根节点 |
| 只在本机试一下 | `--patch` overlay 或 `link:` 安装 | 当成正式发布形态 |

### 表 B · 一个“合格”插件包的六个面

| 面 | 硬要求（DSH 会拒绝） | 质量线（DSH 自己遵守） |
|---|---|---|
| 入口 | named export `apply` 与 default export service class 不能混用 | 注册全部走 `ctx.effect` / `ctx.on`，可卸载 |
| 打包 | patch 路径可读、模块可解析、`exports` 自洽 | `files` 覆盖 patch、locale、icon、运行产物 |
| 兼容 | `engines.dsh` 或全部 `@deepseek-ai/dsh*` peer 范围满足 | 声明 `manifestVersion: 1`、Node `engines` |
| 配置 | `Config` 校验行内 `config` | 所有可调值进 Config，不写死常量 |
| 元数据 | 无硬门禁；坏元数据只产生诊断 | `locale/{en,zh}.json` 的 title/description + 256 KiB 内图标 |
| 运维 | 安装/启用/移除结果可解释 | README 写清能力、配置、数据边界、限制 |

### 表 C · 数据放哪

| 数据 | 归属 | 位置 | 插件怎么碰 |
|---|---|---|---|
| 当前项目文件 | workspace | 会话工作目录及其项目根 | `ctx.fs` / 模型工具，受沙箱策略约束 |
| 项目级经验 | workspace | `<projectRoot>/.dsh/skills`、`.agents/skills`、项目 `AGENTS.md` | skill 发现、指令链，不写进包 |
| 跨项目经验 | home | `$DSH_HOME/skills`、`$DSH_HOME/AGENTS.md`、`~/.agents/skills` | 用户维护；插件只读/注册 |
| 宿主结构化状态 | home | `$DSH_HOME/storages` 的 KV domain | `ctx.storageDomain`，模型不可见 |
| 模型可见历史 | session | `$DSH_HOME/sessions/--<cwd>--/<id>/` | 只追加事件 + 投影，不造新事件类型 |
| 凭据 | home | `$DSH_HOME/.credentials.yaml` 或环境变量 | 凭据服务 / `!!js` 引用，不进会话文本 |

## 六篇分读

| # | 分篇 | 一句话 |
|---|---|---|
| 01 | [可发布形态](./01-publishable-forms.md) | plugin、bundle、profile、preset、skill、client、MCP 各是什么角色；`dsh plugin add` 只自动启用 bundle |
| 02 | [插件包的发布合同](./02-package-contract.md) | manifest、入口、patch、配置、兼容性、说明文字的逐项要求；硬门禁与质量线分开列 |
| 03 | [发行渠道与版本依赖](./03-channels-and-versions.md) | npm / Git / tarball / link / 市场 index / 官方目录；`engines.dsh`、peer 回退、豁免与升级 |
| 04 | [智能体的只读定义层](./04-readonly-agent-definition.md) | agent = Host loop + preset + session；preset 为什么只读、改它为什么只影响新会话 |
| 05 | [数据层三种归属](./05-data-planes.md) | workspace / home / session 的边界、路径表、七条数据规则与反模式 |
| 06 | [骨架与检查表](./06-skeleton-and-checklists.md) | 可直接照抄的 repo 骨架、manifest/patch/preset 例子、发布前清单、旧写法迁移 |

## 三个最容易被说错的点

**“把插件装成应用”是 FAQ 23 的问题，不是本篇的问题。** 应用发布物只有 Desktop 与 CLI/Web 两种；插件只是装进它们的某个 profile。两者不要混在一起谈。

**“preset 是一个目录”已经过时。** 旧版的 `$DSH_HOME/.agent-presets/<id>/agent.cordis.yml` 已经没人读；现在是 bundle patch 里的一行 `@deepseek-ai/dsh-agent-preset` 声明。FAQ 13 里“`agent.cordis.yml` 预设行”的写法要按 [06 篇的迁移节](./06-skeleton-and-checklists.md#8-旧写法迁移) 更正。

**“`dsh.compatibility` 版本矩阵”不是 DSH 字段。** DSH 读的是 `engines.dsh`，没有该字段时回退到全部 `@deepseek-ai/dsh*` peer 范围。第三方自造的 `dsh.compatibility` 不会被安装器或启动器读取。

## 证据与边界

仓库内主要证据：

- 发布模型：[publish.md](../../docs/user/develop/basic/publish.md)、[app-boot README 的 profiles 节](../../packages/boot/app-boot/README.md)、[plugin-manager README](../../packages/boot/plugin-manager/README.md)
- manifest 类型：[package-manifest types.ts](../../packages/util/package-manifest/src/types.ts)
- 元数据解析：[package-meta.ts](../../packages/boot/app-boot/src/package-meta.ts)、[plugin-market 指南](../../docs/user/guide/plugin-market.md)
- 智能体定义：[agent-preset README](../../packages/preset/agent-preset/README.md)、[editing-cordis-compositions skill](../../packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md)、[standard preset](../../packages/bundle/web-app/presets/standard.patch.yml)
- 数据层：[skill-filesystem README](../../packages/skill/skill-filesystem/README.md)、[agent-instructions README](../../packages/context/agent-instructions/README.md)、[storage-domain README](../../packages/storage/storage-domain/README.md)、[session-persistence-jsonl README](../../packages/session/session-persistence-jsonl/README.md)、[home-paths README](../../packages/util/home-paths/README.md)
- 渠道：[plugin-market 指南](../../docs/user/guide/plugin-market.md)、[plugin-manager README 的版本兼容节](../../packages/boot/plugin-manager/README.md)

边界：

- 市场、npm、Git 托管与 Desktop 壳侧安装的具体行为，只按仓库文档与生成器阅读，未联网实测。
- 本机未安装 Desktop；涉及 Desktop 的差异一律引用 FAQ 23，不在本篇重新判断。
- “什么算好插件”的多数条目是质量判断而不是 DSH 强制；各篇会在表头标明。
