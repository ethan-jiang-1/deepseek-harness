# 01 · 可发布形态：DSH 认哪些东西，它们各是什么角色

## 一句话

DSH 只会把 **bundle** 自动选入 profile 并作为一层管理；普通 npm 包也能安装，但只是依赖，不会自动启用。**plugin** 是 bundle 里被 patch 行引用的运行时模块；**preset** 是 bundle 里的一行智能体定义；**skill** 是资源；**profile** 是用户侧的运行组合；**market index** 是目录；**overlay** 是本地试验层。把这些混成一个“插件”概念，后面的发布要求就说不清。

![三层与五种贡献](./figures/01-three-roles.svg)

## 1. plugin：运行时行为单元

DSH 对插件的最小定义只有一句：一个模块（TypeScript 源或构建后的 JS），导出 `apply` 函数；框架加载时调用它并传入 `ctx`，插件在 `ctx` 上注册能力。服务型包则默认导出 service class。两种形式不能混用，混用会让 Loader 丢掉 named export 的命名空间（[packages/AGENTS.md](../../packages/AGENTS.md) 的 Plugin exports 条；事故记录见 [postmortem 0001](../../docs/postmortem/0001-acp-default-export-drops-inject.md)）。

```ts
// 函数型
export const name = 'my-plugin'
export const inject = ['tools']
export function apply(ctx: Context) { /* 注册能力 */ }

// 服务型
export default class MyService { /* ... */ }
```

更准确的说法是：**一个插件实例是 patch 行；一个 bundle 是包。** 同一个包可以导出多个入口（`@scope/pkg`、`@scope/pkg/search`），每一行都可以单独启用/禁用、单独 `config`；行不是安装单位，移除要移除包或覆盖层。包负责安装、元数据、保护与移除，行负责这一次组合里的实例。这一点决定了后面所有发布讨论的对象：**你发布的是包，DSH 加载的是行。**

“注册即效果”是硬约定：每个贡献走 `ctx.effect()` 或 `ctx.on()`，`register()` 返回 disposer。否则 HMR、卸载、agent 销毁都会留下泄漏。DSH 没有运行时门禁能自动发现漏掉的 disposer，这属于质量线，不是安装门禁。

## 2. bundle：唯一的可安装并自动启用的作者发布物

bundle 的定义同样只有一句：`package.json` 里声明 `dsh.bundle.patch` 的 npm 包。patch 是一份 YAML 数组，用来插入或覆盖插件行；`patch` 可以是一个文件，也可以是有序的文件列表，启动器按顺序当成一层应用（[package-manifest types.ts](../../packages/util/package-manifest/src/types.ts) 的 `DshBundleManifest`）。

```json
{
  "name": "@acme/dsh-expert-pack",
  "version": "1.0.0",
  "type": "module",
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

安装时发生的事：

1. `dsh plugin --profile <name> add <spec>` 把 spec 转发给 profile 目录里的 pnpm；
2. 如果包声明了 `dsh.bundle`，`dsh` 把包名追加到 `dsh.profile.bundles`；
3. 启动时按 `dsh.profile.bundles` 顺序叠 patch 层；
4. 每行 `name` 经 Node 解析到实际模块，模块激活。

bundle **不必挂载自己**：`dsh-base` 的 patch 插入很多行，但没有一行挂载 `dsh-base` 自己；配置型 bundle 只插别的包；反过来，一个能力包也可以在自己的 patch 里插自己的根行。patch 插什么，比“这个包是谁”更重要。

如果包没有 `dsh.bundle`，行为取决于入口：`dsh plugin add` 仍会把它装成普通依赖，打一条警告，不激活任何层（[publish.md](../../docs/user/develop/basic/publish.md)）；`plugin_manager` 的 `install_bundle` 在 pnpm 之后以 `not-bundle` 拒绝，并回滚 manifest 与 lockfile。`listBundles` 会把这种“被选中但没有 bundle patch”的名字标成 `not-bundle`。**“能装”与“会被当成插件”是两件事。**

## 3. profile：用户侧组合，不是发布物

profile 是 `$DSH_HOME/profiles/<name>` 下的一个目录，两份关键文件是：

- `package.json`：profile 自己的依赖 + `dsh.profile.bundles` 有序列表；
- `cordis.patch.yml`：用户自己的覆盖层，在所有 bundle 层之后应用。

目录里还会有 `compatibility.json`（版本豁免）、`pnpm-workspace.yaml`（`allowBuilds`）、`pnpm-lock.yaml` 与 `.plugin-manager/`（运行记录）；它们是安装/管理状态，不是发布物。

profile 回答的是“这台机器上这个入口由哪些 bundle、按什么顺序组成”；bundle 回答的是“这个包贡献什么”。所以产品文档才说 “Nothing is both”。这是**角色分工**，不是 JSON 层面的排他：一个 package.json 理论上可以同时写 `dsh.bundle` 与 `dsh.profile`，但 DSH 只从 profile 目录读 `dsh.profile`、只从依赖里读 `dsh.bundle`，两个角色不会互相替代。作者不应该发布 profile；用户也不应该手写 profile manifest——`dsh plugin` 和 `plugin_manager` 会维护它。

加载顺序固定为：每个 bundle 的 patch（按列表顺序）→ profile 的 `cordis.patch.yml` → `$DSH_HOME/cordis.patch.yml` → 每个 `--patch` overlay（按 argv 顺序）。后者按行覆盖前者，且覆盖会替换整段 `config`，不是深合并（[publish.md](../../docs/user/develop/basic/publish.md)）。

## 4. preset：一行声明，不是包

preset 不是一种包类型，而是 `@deepseek-ai/dsh-agent-preset` 的一行配置。它声明一个智能体由哪些子插件组成：

```yaml
- insert:
    - id: preset-review
      name: '@deepseek-ai/dsh-agent-preset'
      config:
        id: review
        name: Review
        description: Reviews changes with the shell only.
        order: 10
        plugins:
          - id: persona
            name: '@deepseek-ai/dsh-persona'
            config: { prefix: You review software changes. }
          - id: tool-bash
            name: '@deepseek-ai/dsh-tool-bash'
```

`id` 是会话保存的 preset 身份；`plugins` 是子插件行；`name`、`description`、`order` 只影响展示与排序。Loader 行 id 约定为 `preset-<id>`。出厂 Web 的四个预设 `standard`、`ptc`、`minimal`、`cordis` 就是 `@deepseek-ai/dsh-web-app` 的 `presets/*.patch.yml`，并随该 bundle 的 `dsh.bundle.patch` 列表一起加载。

关键点：**preset 的“发布”就是 bundle patch 里的一行。** 建一个只含 `package.json` 与 `cordis.patch.yml` 的配置型 bundle，装上就多了一个可选智能体；不需要任何可执行代码，也不需要在 `$DSH_HOME` 下建目录。

## 5. skill：资源，不是包

skill 是给模型的按需指令，格式是目录 `<name>/SKILL.md` 或扁平 `<name>.md`，必须在扫描根的顶层；嵌套的 `**/SKILL.md` 故意不发现。frontmatter 必须有 `name` 与 `description`，可选 `whenToUse`、`metadata`、`disable-model-invocation`、`user-invocable`（[skill-filesystem README](../../packages/skill/skill-filesystem/README.md)）。

它有**六个扫描根，按 rank 合并；按所有权可分四类**（包、项目、用户、部署者）：

| 来源 | rank | 谁拥有 | 典型用途 |
|---|---|---|---|
| `<projectRoot>/.dsh/skills` | 100 | 项目 | 项目专用流程 |
| `<projectRoot>/.agents/skills` | 200 | 项目/共享 | 与别的 agent 工具共用 |
| `customSkillDirs` | 300 | 部署者 | 自定目录 |
| `<dshHome>/skills` | 400 | 用户 | 跨项目经验 |
| `<agentsHome>/skills` | 500 | 用户/共享 | `~/.agents/skills` |
| `bundledSkillDir` / provider | 600 | 包 | 随插件发布的只读知识 |

所以“经验放哪”不是插件实现细节，而是 skill 根的归属问题：项目经验放项目根，跨项目经验放 `$DSH_HOME/skills` 或 `~/.agents/skills`；插件只应该发布**只读的、与版本绑定的**那部分，并把可编辑入口留给用户。用户 DSH 根会跳过 `.system` 子目录；`includeDefaultRoots: false` 会省略项目/用户默认根，只保留配置的根。

skill 也可以由包内 provider 直接注册（例如 `dsh-skill-badge` 从 `assets/dsh-badge.md` 读正文，注册一个 `source: 'bundled'`、rank 为 `BUNDLED_SKILL_RANK` 的候选）。这种包仍然需要被某个 bundle 的 patch 行挂载，才会出现在会话里。

## 6. client module：bundle 的浏览器半边

Web UI 插件不是独立发布物。包在 `package.json` 声明 `dsh.client`（`platform: 'web'`，可选 `inject`、`immediately`、`external`），并在 `exports["./client"]` 导出构建好的浏览器 bundle。Host 侧的 `ctx.clientModules` 扫描**Host Loader 中已启用行所挂载的包**，把 `dsh.client` 行编成 `window.__DSH_BOOT__` 的模块图；preset 子树不参与这次扫描，除非同一个包也被 Host 行挂载。没有任何 Host 行把包挂上，client 声明不会被扫到。行必须命名**包根**，子路径插件永远不是 client 行。

这意味着一个 UI 插件的最小发布单元是：**一个 Host Loader 行 + 一个 client 模块 + 同一个包**。只发 client 文件、没有任何 Host 行把包挂上，页面上什么都不会出现。`dsh.client.external` 只能列精确的包行或静态表名；自请求、缺供应商、同步环都会让组合拒绝。

## 7. MCP：配置型 bundle，不是新协议实现

接一个外部 MCP server 不需要写协议代码。建一个配置型 bundle，patch 插入已经随 DSH 发布的 `@deepseek-ai/dsh-mcp-client`，配 `serverName`（`[A-Za-z0-9_-]{1,32}`，同一注册域内唯一）、`transport`（`stdio` 或 `streamable-http`）、`url`（streamable-http 还可配 `headers`；或 stdio 的 `command`/`args`/`env`/`cwd`），装上后工具以 `mcp__<serverName>__<tool>` 出现。需要初次连接失败就拒绝激活时设 `failOnStartupError: true`。凭据用 Loader 的 `!!js` 引用既有凭据，不要把 secret 复制进 patch 或会话文本。

这和“写一个自己的 MCP 客户端插件”是两条路：前者是配置分发，后者才是代码。绝大多数“接一个工具”的需求属于前者。

## 8. 其余东西不是发布形态

| 东西 | 它是什么 | 为什么不是插件发布形态 |
|---|---|---|
| profile | 用户运行组合 | 由用户/安装器维护，作者不发 |
| market index | 静态 JSON 目录 | 它列插件，本身不是插件；DSH 只校验格式，不背书内容 |
| `--patch` overlay | 本地一次性补丁 | 不经过安装、不进 profile、不可管理 |
| `cordis.yml` | Loader 直接配置 | 面向嵌入与测试，不是分发单位 |
| `$DSH_HOME` 下的数据 | 用户数据 | 与包版本无关，升级不应触碰 |
| 会话日志 | 运行记录 | 只追加；第三方不要新增 event 类型，用已有事件/投影；`plugin:` 只限实验包 |

## 9. 一张判定表

| 你手里的东西 | DSH 在哪一步识别它 | 能否被 `dsh plugin add` 自动启用 | 能否被 Plugin Manager 管理 |
|---|---|---|---|
| 带 `dsh.bundle.patch` 的包 | 安装 → 追加 `dsh.profile.bundles` | 能 | 能（bundle 级） |
| 不带 `dsh.bundle` 的普通包 | 被某行 `name` 解析时 | 不能（只装依赖） | 只作为依赖出现，标 `not-bundle` |
| patch 行引用的模块 | 启动/重载时 Loader 激活 | 不适用（它已经被行引用） | 能（行级启用/禁用） |
| preset 声明行 | 会话选择 preset 时 | 随 bundle | 管理器只读；可按 id 用 profile patch 覆盖整段 config |
| skill 目录/文件 | 会话 catalog 扫描 | 随所属 bundle 或用户放置 | 不在插件管理范围 |
| `dsh.client` 模块 | Host 扫描已挂载包时 | 随 bundle | 随包 |
| MCP server | `dsh-mcp-client` 行激活时 | 随配置型 bundle | 行级 |
| market index | Discover 拉取时 | 不能（它只是目录） | 不在 profile 里 |

## 10. 结论

**会被 DSH 自动启用为层的发布形态只有一个：bundle。** 普通 npm 包可以安装，但只是依赖。bundle 可以承载五种贡献，而且“贡献”与“包”不是一一对应：一个包可以同时声明 bundle、client、多个子路径插件；一个 preset 可以引用多个包里的插件行；一个 skill 可以来自包、项目或用户目录。

判断一个东西“算不算 DSH 插件”，不要看它是不是 npm 包，而要看它有没有进入下面任一管道：

1. **安装管道**：`dsh.bundle.patch` → profile 的 bundle 列表；
2. **装载管道**：patch 行的 `name` → Loader 里的一个 plugin；
3. **选择管道**：preset 行 → 会话的只读定义；
4. **发现管道**：skill 根或 provider → 会话 catalog。

四条管道之外的东西，要么是配置，要么是数据，要么是目录。
