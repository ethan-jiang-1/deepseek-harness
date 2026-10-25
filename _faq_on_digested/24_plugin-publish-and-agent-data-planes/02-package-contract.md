# 02 · 插件包的发布合同：六道门，两种要求

## 一句话

DSH 对插件包的硬要求只有四类：**能解析、能装载、版本对得上、配置校验得过**。其余（README、图标、测试、许可证、SemVer、数据边界）是质量线。把两类混在一起，就会把“DSH 会拒绝”与“作者应该做”说成同一件事。

![发布六道门](./figures/02-publish-gates.svg)

## 0. 先看全景

| 门 | 检查什么 | 谁在检查 | 不通过会怎样 |
|---|---|---|---|
| 1 入口 | 模块导出形式是否合法 | Loader / 模块加载 | 命名空间被丢弃、激活失败 |
| 2 打包 | `dsh.bundle.patch` 存在且能解析，模块能被 Node 解析 | `dsh plugin` / profile 启动 | 安装警告、bundle 被跳过、行被拒绝 |
| 3 自包含 | `exports`、`files`、构建产物是否覆盖运行所需 | Node 解析 / pnpm 打包 | 装完缺文件，激活时报模块找不到 |
| 4 兼容 | `engines.dsh`，或全部 `@deepseek-ai/dsh*` peer 范围 | 安装前预检 + 启动/重载 | 拒绝安装、跳过 bundle、拒绝行 |
| 5 配置 | 行内 `config` 是否过 `Config` 校验 | 插件激活 | 激活失败（随行的重要性升级） |
| 6 元数据 | locale、icon、description | 读 Display 元数据的消费者 | 只产生诊断，插件仍可管理 |

表里的“行的重要性”指 `required`：必需的插件失败会让启动回滚并非零退出；可选插件失败只打警告（[app-boot README](../../packages/boot/app-boot/README.md)）。`dsh plugin add` 成功也不等于激活成功：插件管理器会保留依赖与选择，把激活诊断报出来。

## 1. 入口门：两种形式，不能混

函数型插件：

```ts
export const name = 'acme-expert'
export const inject = ['tools', 'systemPrompt']   // 可选
export const Config = Schema.object({ /* ... */ }) // 可选
export function apply(ctx: Context, config: Config) { /* ... */ }
```

服务型插件：默认导出一个 service class。

规则与原因：

- **不能同时** default export 和 named `apply`。混用时 Loader 会丢掉函数插件的命名空间，`inject` 等导出失效——这是有事故记录的（[postmortem 0001](../../docs/postmortem/0001-acp-default-export-drops-inject.md)）。
- 依赖的服务要么进 `inject`，要么用 `ctx.inject([...], ...)` 可选等待；不要直接读 `ctx.<service>` 赌它存在。可选服务用 `ctx.get(name)`，属性代理对拓扑敏感。
- 每个注册都要有 disposer；用 `ctx.effect()` / `ctx.on()`，不要把清理留给“进程退出”。

这是“能装载”的最低条件，也是唯一一条**静默失败**风险最高的门：形式错了不一定会报错，可能只是行为少了一半。

## 2. 打包门：patch 是 bundle 的身份证

### 2.1 最小 bundle

```json
{
  "name": "@acme/dsh-review-pack",
  "version": "0.1.0",
  "type": "module",
  "main": "index.js",
  "exports": { ".": "./index.js", "./cordis.patch.yml": "./cordis.patch.yml", "./package.json": "./package.json" },
  "files": ["index.js", "cordis.patch.yml"],
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

```yaml
- insert:
    - id: acme-review
      name: '@acme/dsh-review-pack'
```

- `patch` 是相对包根的路径；也可以是有序数组，启动器按顺序当一层应用。
- 行 `name` 用包名（或子路径），不要用相对源码路径——安装后的代码在 profile 的 `node_modules` 里，相对路径会指错地方。
- `files` 必须覆盖 patch、运行入口、locale、icon、以及运行时要读的资源。**本地目录安装是 link，`files` 不过滤**；只有 packed/published 安装才按 `files` 裁剪。所以“我本地能跑”不能证明发布包完整。

### 2.2 覆盖与 id 稳定性

patch 可以按 `id` 覆盖前层（例如 `dsh-web-app` 覆盖 `dsh-base` 的行）。覆盖会替换整段 `config`，不是深合并；作者要重述想保留的每个字段（[publish.md](../../docs/user/develop/basic/publish.md)）。

由此产生两条发布纪律：

1. **行 id 一旦发布就当作 API。** 用户会在自己的 profile patch 里按 id 覆盖你；改名等于破坏用户配置。
2. **默认值要选用户大概率会保留的。** 用户覆盖你的行时不该被迫抄一整段配置；把可调项留给 `Config`，把默认值设合理。

### 2.3 一个包，多个入口

同一个包可以导出多个插件入口，每个入口一行，各自 `config`、各自启用。子路径插件（如 `@acme/pack/search`）不是包根：它不读 `package.json` 的 `icon` 与 `description`，显示元数据只能走自己的 `./search/locale/*.json` 与 `./search/icon`。这条差异在写元数据时最容易踩。

## 3. 自包含门：发布物不能依赖你的工作区

DSH 的安装模型是“把包装进 profile 的依赖树”，不是“复制你的 repo”。因此：

- **npm 发布必须带构建产物**（`lib/` 或打包后的 `index.js`）。直接发 `src/*.ts`，用户装到的是 Node 不能直接执行的源码。
- **Git 安装拿到的是源码，不会自动构建。** 作者要提供自包含的 `prepare` 脚本（不假设旁边有 monorepo），用户还要在 profile 的 `pnpm-workspace.yaml` 里为该包开 `allowBuilds`；否则 pnpm 会拒绝执行构建脚本（[publish.md](../../docs/user/develop/basic/publish.md)）。
- **不要引用仓库内的 `workspace:*` 路径、`vendor/`、共享 tsconfig 或 sibling 包**。发布后这些都不存在。
- **`exports` 要显式**：`"."`、`"./cordis.patch.yml"`、`"./package.json"`、`"./client"`（如果有 UI）、`"./locale/*.json"`、`"./icon"`（如果用导出图标）。少一个，Node 就会在用户机器上报 `ERR_PACKAGE_PATH_NOT_EXPORTED`。
- **校验真实打包结果**：`pnpm pack` 后看 tarball 里的文件列表，或 `npm publish --dry-run`。链接安装不会暴露 `files` 漏项。

## 4. 兼容门：写在 manifest 里的版本承诺

### 4.1 两种声明，一个判定

```json
{
  "engines": { "dsh": ">=0.2.0 <0.3.0", "node": ">=22.19" },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^0.2.0",
    "@deepseek-ai/dsh-tools": "^0.2.0"
  }
}
```

判定顺序（[app-boot README](../../packages/boot/app-boot/README.md)）：

1. 有 `engines.dsh`：**只看它**，peer 范围被忽略。
2. 没有 `engines.dsh`：每个 `@deepseek-ai/dsh` 与 `@deepseek-ai/dsh-*` 的 peer 范围都必须匹配运行版本。
3. 两者都没有：不施加约束。

细节：

- 预发布版本参与范围匹配；`engines.dsh` 写精确的预发布版本是允许的。
- `workspace:` 协议在 `engines.dsh` 里非法；在 peer 里，`workspace:^`、`workspace:~`、`workspace:*` 都指运行中的 DSH 版本。
- 空范围、非法范围、非字符串 `engines.dsh`、非对象 `engines` 都算不兼容/畸形。
- 不满足时，安装前会拒绝（registry spec 先查 `pnpm view`），启动时会跳过 bundle 或在行级拒绝；拒绝信息会按 `engines.dsh` 或 peer 包名列出未满足项。

**一处证据冲突要说明。** `packages/util/package-manifest/README.md` 的 Known Limitations 与 `2026-09-10-public-package-manifest` 决策记录都写着“当前安装器与加载器不强制 `engines.dsh`”。当前源码已经强制：`packages/boot/app-boot/src/plugin-compatibility.ts` 实现了 `engines.dsh` 优先、peer 回退的判定，`publish.md`、app-boot README 与 plugin-manager README 也都按“强制”描述，安装操作会对直接依赖逐一评估。合理的读法是：那两处说的是“这组 TypeScript 类型声明本身不做校验”，不是“运行时不做校验”。判定以源码与三个描述强制行为的产品文档为准。

### 4.2 共享实例：peer + dev 双写

凡是必须与宿主共享同一实例的 DSH 包（`cordis`、service 定义、被宿主注入的单例），要同时写进 `peerDependencies` 与 `devDependencies`：

- `peerDependencies` 告诉安装位置“这个实例由宿主提供”；
- `devDependencies` 让你的类型检查和独立测试能跑。

只在 `dependencies` 里写，会出现两份实例，`instanceof`、服务注册、事件命名空间都可能对不上。独立版本的三方库、无状态的工具库才放 `dependencies`（[publish.md](../../docs/user/develop/basic/publish.md)）。

### 4.3 `manifestVersion` 与豁免

- `dsh.manifestVersion: 1` 是 manifest 格式标识，与 npm 包版本、会话格式版本都无关。当前读取方把它当声明，不当作强制门禁；写上是为了让格式演进有据可依（[package-manifest types.ts](../../packages/util/package-manifest/src/types.ts)）。
- 不兼容时可以用精确版本豁免：profile 的 `compatibility.json` 里把 `package-name@version` 映射到精确的 DSH 运行版本。豁免不继承：插件升级或 DSH 升级都要重新授权；授权前要提示崩溃与数据损坏风险（[plugin-manager README](../../packages/boot/plugin-manager/README.md)）。

## 5. 配置门：所有会变的都进 Config

DSH 的规则是“**不要在插件里硬编码可调值**”：会随部署变化的选项必须是有校验的 `Config` 字段，能从 `cordis.yml` / patch 改；`DEFAULT_*` 常量或测试钩子不算可配置。协议常量、外部规范、安全不变量才保持固定。

```ts
export const Config = Schema.object({
  model: Schema.string().default('deepseek-chat'),
  maxRounds: Schema.natural().default(8),
  workspaceSubdir: Schema.string().default('.acme'),
})
```

为什么这是发布要求而不是风格问题：

- 用户只能通过 patch 覆盖你的 `config`；没有 Config 字段，他只能改你的代码。
- `plugin_manager` 与 `--dump-config-schema` 靠 Config 生成可读的 schema；没有它就无从校验。
- 覆盖是整段替换，不是深合并；Config 字段越少、默认值越稳，用户越不需要抄长配置。

## 6. 元数据门：说明文字与图标是“不激活也能读”的资源

DSH 在**不执行插件代码**的前提下读取显示元数据：Plugin Manager、Settings、官方目录都靠它。来源有三层：

1. `locale/<language>.json` 里的 `meta.title` 与 `meta.description`；
2. `package.json` 的 `name` 与 `description`（缺省回退）；
3. `package.json` 的 `icon` 字段，或导出的 `<specifier>/icon`。

规则（[package-meta.ts](../../packages/boot/app-boot/src/package-meta.ts)）：

- 英文文件必须是 `locale/en.json`；其他语言文件与它同目录，文件名是语言 id。
- 图标只能是 SVG、PNG、JPEG、WebP，≤256 KiB，必须留在包目录内；绝对路径、URL、指向包外的 symlink 都会被拒。
- 缺字段回退到包名与 `package.json.description`；没有图标就用面板默认图。
- 元数据错误不会让插件不可管理：会保留可用的文字，并附带一条 `error` 诊断。
- 官方目录更严：必须是公开的 `@deepseek-ai/dsh-*` bundle，英文与中文的 title/description 都要有，且必须有图标（[官方目录生成器](../../scripts/gen-official-bundle-catalog.ts)）。

最小例子：

```json
{ "meta": { "title": "Review Pack", "description": "Adds a review workflow and its tools." } }
```

```json
{
  "exports": { "./locale/*.json": "./locale/*.json", "./icon": "./icon.svg" },
  "files": ["index.js", "cordis.patch.yml", "locale/*.json", "icon.svg"]
}
```

外部作者的三条实用建议：

- `package.json.description` 写“这个包贡献什么”，因为 `listBundles` 直接把它当 bundle 的一行说明；
- locale 里的 title/description 写“用户看到的名字与能力”，不要写营销口号；
- 图标自己画或使用可再分发许可证的素材，保留署名要求。DSH 官方插件另有 artwork 规范，外部插件不强制。

## 7. 文档、许可证、仓库字段：不是门禁，但决定可维护性

一个可维护的包至少要在 `package.json` 里有：

```json
{
  "description": "One sentence: what capability this bundle contributes.",
  "repository": { "type": "git", "url": "git+https://github.com/acme/dsh-review-pack.git", "directory": "." },
  "license": "MIT",
  "publishConfig": { "access": "public" }
}
```

README 建议按 DSH 自己的包 README 结构写，但不必抄它的全部栏目：

1. **Summary**：一段话，说明它贡献什么、何时用。
2. **Install**：包名、最小安装命令、需要的 profile。
3. **What it contributes**：bundle 行、preset id、工具名、UI 位置。
4. **Configuration**：每个 Config 字段、默认值、会变的行为。
5. **Data**：读写哪些路径、属于 workspace 还是 home、升级时会不会动。
6. **Compatibility**：`engines.dsh`、已测试的 DSH 版本、已知限制。
7. **Uninstall**：移除后哪些数据保留、哪些需要手动清。

第 5、6 节是外部插件最容易缺、用户最需要的两节。

## 8. 一张发布前检查表

### 硬门禁（不通过就会装不上/跑不起来）

- [ ] 入口只导出一种形式：named `apply` 或 default service class。
- [ ] `package.json` 有 `dsh.bundle.patch`，路径存在且 YAML 能解析。
- [ ] patch 里每个 `name` 都能从安装位置解析到模块。
- [ ] npm 发布带构建产物；Git 安装有自包含 `prepare`。
- [ ] `exports` 覆盖入口、patch、locale、icon、client。
- [ ] `engines.dsh` 或全部 `@deepseek-ai/dsh*` peer 范围与目标 DSH 匹配。
- [ ] 每个行的 `config` 能过 `Config` 校验。
- [ ] `pnpm pack` 后的文件列表包含运行所需全部文件。

### 质量线（不通过不会立刻报错，但会留下维护债）

- [ ] 可调值全部进 `Config`，没有硬编码常量。
- [ ] 行 id 稳定；覆盖行为文档化。
- [ ] 每个注册都有 disposer；卸载后无残留。
- [ ] README 有 Install / Configuration / Data / Compatibility / Uninstall。
- [ ] `locale/en.json`、`locale/zh.json` 有真实 title/description。
- [ ] 图标 ≤256 KiB、留在包内、有再分发许可。
- [ ] 语义化版本；破坏性变更升 minor/major 并写迁移说明。
- [ ] 不把数据写进包目录；不依赖绝对路径或 `~`。
- [ ] 有一条真实 composition 测试：从干净 profile 安装、激活、调用、卸载。

## 9. 常见失败模式

| 现象 | 根因 | 修法 |
|---|---|---|
| 装上了但没反应 | 包没有 `dsh.bundle`，或 patch 没插行 | 加 `dsh.bundle.patch`；确认行 `name` |
| 启动报模块找不到 | `files` 漏了文件，或 `exports` 没导出 | `pnpm pack` 看列表；补 `exports` |
| 行为少了一半 | default 与 named export 混用 | 只保留一种形式 |
| 用户覆盖后你的默认值丢了 | 覆盖是整段替换 | 文档写明要重述的字段；减少必填项 |
| 升级后配置失效 | 行 id 或 Config 字段改名 | 把 id/字段当 API；写迁移说明 |
| 装完立刻失败但依赖还在 | 安装成功、激活失败 | 读激活诊断；修包后重装，不要重复装 |
| 本地能跑、发布不能跑 | link 不过滤 `files`，源码未构建 | 用 `pnpm pack` + 干净 profile 验证 |

## 10. 结论

发布一个插件包，不是“把代码推到 npm”就完了。它是一份六面合同：入口形式决定能不能装载，patch 决定是不是 bundle，自包含决定装完能不能跑，版本声明决定 DSH 让不让你跑，Config 决定用户能不能改，元数据决定用户能不能发现和信任。

前四面是 DSH 会检查的；后两面是 DSH 自己遵守、外部作者最好也遵守的质量线。把这条分界线记住，就不会把“我的 README 写得不好”误当成“DSH 不让我发布”。
