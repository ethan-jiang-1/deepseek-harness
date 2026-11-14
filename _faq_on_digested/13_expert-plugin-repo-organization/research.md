# 外部生态调研与源码出处对照

本页汇总两部分参考材料：一是 DSH 仓库内支撑本组结论的一手源码与文档入口；二是对第三方 DSH 插件仓库及五个主流插件生态（Claude Code、OpenClaw、MCP、VS Code、Obsidian）仓库形态与命名规则的实证留档（外部仓库快照采集于 2026-09，外部结构随时间演进，以采集时点状态作模式参考）。

---

## 一、DSH 仓库一手文档与源码入口

- **应用启动边界与组合叠层**：[`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)、[`docs/cordis-primer.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md)、[`packages/boot/app-boot/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md)、[`apps/cli/src/plugin.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/plugin.ts)
- **插件开发与打包发布契约**：[`docs/user/develop/basic/index.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md)、[`docs/user/develop/basic/publish.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)、[`docs/cordis-tutorial/index.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/index.md)、[`packages/util/package-manifest/src/types.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/package-manifest/src/types.ts)、[`packages/boot/plugin-manager/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md)
- **声明式 Agent Preset 机制**：[`packages/preset/agent-preset-registry/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md)、[`packages/preset/agent-preset/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/README.md)、[`packages/bundle/web-app/presets/cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/cordis.patch.yml)
- **扩展形态、工具契约与前端卡片槽位**：[`docs/cookbook/extension-cookbook.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/extension-cookbook.md)、[`docs/cookbook/adding-a-tool.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md)、[`docs/cookbook/adding-a-package.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-package.md)、[`packages/core/tools/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/tools/README.md)、[`packages/core/session/src/types.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/session/src/types.ts)
- **Web 客户端模块与 UI 扩展点**：[`packages/client/modules/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/modules/README.md)、[`packages/client/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/AGENTS.md)、[`docs/subsystems/conversation.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/conversation.md)、[`packages/client/ui-conversation/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-conversation/README.md)、[`packages/client/ui-settings/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-settings/README.md)、[`packages/settings/settings/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/README.md)
- **主仓分组规则与 Vendored 同步范本**：[`packages/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/README.md)、[`vendor/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/README.md)、[`docs/development.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/development.md)、[`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)

---

## 二、第三方 DSH 插件仓库实证样本

社区收录列表（如 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)）中 90% 以上的第三方项目采用**单包仓库**，并以 `dsh.bundle.patch` + `dsh plugin add` 作为标准交付入口。几个代表性仓库在结构与依赖管理上的正反经验如下：

- **[anywhere-labs/dsh-desktop](https://github.com/anywhere-labs/dsh-desktop)（方案 A 实证样本）**
  通过 `.gitmodules` 把 `deepseek-ai/deepseek-harness` 完整源码钉为子模块，配合 `vendor/`、`patches/`、`upstream.json` 与根 `AGENTS.md`（加 `CLAUDE.md` 软链接），在真实工程中跑通了“独立仓库 + 钉死宿主源码供 Coding Agent 就地检索”的协作模式。
- **[dsh-market/dsh-market](https://github.com/dsh-market/dsh-market)（npm 包 `dshmarket`，单包 + 仓外 Web UI 正例）**
  单包结构，声明 `dsh.bundle.patch` 与 `dsh.client`；将 `@deepseek-ai/cordis` 与 `@deepseek-ai/dsh-settings` 放入 `peerDependencies`，客户端包作为 `devDependencies` 由 `tsdown` 构建出独立浏览器产物，并配有 `vitest`、`playwright` 和安装冒烟三层测试。
- **[xmanrui/dsh-im](https://github.com/xmanrui/dsh-im)（npm 包 `@xmanrui/dsh-im`，多渠道桥 + 自建构建）**
  单包内含十余条 IM 通道与独立 Web 配置面板（通过 `esbuild` 构建客户端模块）。注：该包在 `package.json` 中自定了 `dsh.compatibility.dshReleases` 字段记录测过的版本，这属于**社区作者自发维护的说明性元数据**——DSH 官方安装与启动器真正读取并强制校验的是顶层 `engines.dsh`（及回退的 `@deepseek-ai/dsh*` `peerDependencies` 范围）。
- **[Jesse-njx/dsh-chatnode-wechat](https://github.com/Jesse-njx/dsh-chatnode-wechat)（依赖锁死反面样本）**
  把五个 `@deepseek-ai/dsh-*` 包以精确版本号直接写进了运行时 `dependencies`。在 DSH 接口仍处 `pre-stable` 的阶段，这种写法不仅容易造成运行时多实例冲突，还会导致宿主每升一个小版本都逼着插件重新发版。
- **[yjh051108/dsh-routing-suite](https://github.com/yjh051108/dsh-routing-suite)（非标分发偏差样本）**
  设为 `private: true` 并靠自定义 shell 脚本安装，`peerDependencies` 误写成了未带 `@deepseek-ai/` 作用域的裸 `cordis`，偏离了官方包管理与作用域规范。
- **[vvlife/whalehub-dsh](https://github.com/vvlife/whalehub-dsh)（纯外部目录站）**
  独立部署的 Vercel + React 索引前端，不含任何 `@deepseek-ai/*` 依赖或 `dsh` 字段，属于纯展示型注册表而非插件 Bundle。

---

## 三、跨宿主生态的仓库共存模型对照

把视野放到更广的 AI 编程与编辑器插件生态（支撑 [`01-four-repo-layouts.md`](./01-four-repo-layouts.md) 的选型判断），主流做法同样收敛在三种开发态模型加一种纯索引目录：

1. **Pinned Vendor 子模块簿记（对应方案 A / D）**
   - **[antfu/skills](https://github.com/antfu/skills)**：用 Git submodule 钉住上游文档与项目 tag，在 `GENERATION.md` / `SYNC.md` 中记录精确 commit SHA，配套一键同步重生成脚本与版本漂移检查——是方案 A 上游同步脚本的极佳参考范本。
   - **DSH 自身 [`vendor/`](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/README.md)**：同样以固定上游 SHA 清单加显式同步步骤管理 Cordis 源码。
2. **宿主同仓演进 vs 外部 peer 双轨并存（对应方案 B ↔ 方案 A）**
   - **[openclaw/openclaw](https://github.com/openclaw/openclaw)**（参见其 [插件构建文档](https://docs.openclaw.ai/plugins/building-plugins.md)）：第一方内置插件放在主仓 `extensions/*` 工作区同编同发（享有一致性但承担发布耦合）；第三方插件走独立 npm 包，将宿主列为 `peerDependency` 并显式声明兼容版本范围。其官方文档特别强调：**源码工作区直跑会掩盖依赖声明错误，发版前必须用 `npm pack` 走真实安装路径测试**。
3. **闭源宿主与单包自包含纪律（对应方案 C 补救与方案 D 自包含要求）**
   - **Claude Code Plugins**（[plugins-reference](https://code.claude.com/docs/en/plugins-reference)、[plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)、[anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)）：安装器会将插件拷贝进版本化缓存目录，严禁 `../` 越界引用，因此多插件单体仓中的每个插件目录必须严格自包含；同时因宿主闭源，官方 `plugin-dev` 把框架开发规范整理成随包分发的 `SKILL.md` 喂给 Agent（即方案 C“源码不可见时把核心规则内化成文档”的原型）。
   - **Cursor Plugins**（[cursor.com/docs/plugins](https://cursor.com/docs/plugins.md)）：支持将整个多插件仓库作为 Marketplace 导入，同时兼容自有清单与中立的 [agent-plugins.org](https://agent-plugins.org) 结构。
4. **稳定小 SDK 上的纯外部依赖（对应方案 C 的成立前提）**
   - **[modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)**：`src/<server>/` 一目录一包、各自独立发版，对 `@modelcontextprotocol/sdk` 直接使用普通 npm SemVer 依赖。这之所以行得通，是因为底层协议 SDK 极薄且已稳定——恰好反衬出在 `pre-stable` 的重型 Harness 上单靠方案 C 容易踩坑的原因。
   - 另可对照 **[obsidianmd/obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin)**（`obsidian` 包仅作 `devDependency` 提供类型，运行时由宿主注入实例）与 **[gemini-cli-extensions/alloydb](https://github.com/gemini-cli-extensions/alloydb)**（薄核心配多宿主清单）。

---

## 四、跨生态命名与标识规则对照

支撑 [`03-isolation-and-naming.md`](./03-isolation-and-naming.md)“第 0 天锁死机器身份、放开展示文案”结论的五个生态官方规则：

- **VS Code 扩展**（[extension-manifest](https://code.visualstudio.com/api/references/extension-manifest)、[publishing-extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)）：唯一身份是 `publisher.name`，`publisher` ID 创建后不可更改，扩展下架后名字永久保留防冒名顶替；没有官方改名通道，改 `name` 等于发新扩展；而展示层的 `displayName`、简介与图标可随时修改。
- **Obsidian 插件**（[Manifest](https://docs.obsidian.md/Reference/Manifest)、[Submission requirements](https://docs.obsidian.md/Community+directory/Submission+requirements+for+plugins)）：manifest `id` 仅允许小写字母与连字符，绑定命令前缀与用户快捷键，发布后不支持改名迁移；展示字段 `name` 可随时修改。这与 DSH 的 `preset id` + 本地化显示名设计完全同构。
- **Claude Code 插件**（[plugins-reference](https://code.claude.com/docs/en/plugins-reference)、[plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)）：`plugin.json` 的 `name` 被定义为稳定标识符，直接拼接进用户设置键、缓存目录与技能/工具命名空间，改名会破坏既有安装；官方专门提供不参与寻址的 `displayName` 供品牌展示变更（仅市场层额外提供 `renames` 映射辅助迁移设置键）。
- **npm 包注册表**（[package-name-guidelines](https://docs.npmjs.com/package-name-guidelines)、[unpublish policy](https://docs.npmjs.com/policies/unpublish)）：包名不支持重命名，任何发布过的 `name@version` 即使撤销也永久不可复用；更名只能发新包并对旧包执行 `npm deprecate`。DSH Bundle 直接继承 npm 的这套全局不可变约束。
- **MCP Server 与 Registry**（[lifecycle spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle)、[MCP registry quickstart](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx)）：线协议区分机器名 `name` 与界面展示名 `title?`；官方 Registry 则采用反向域名（如 `io.github.<user>/<server>`）加所有权验证锁定机器身份。

> 核验状态见 [核验基线登记](../00-baseline.md)。
