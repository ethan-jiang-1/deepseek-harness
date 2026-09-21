# Research · 插件 repo 组织的市场实证

检索时点：2026-09（本 FAQ 写作会话）。树结构经 GitHub API（`git/trees` / `contents`）或 raw 文件抓取核实，未核实的推断一律标注"未验证"。外部 repo 随时间漂移，引用以本文留档为准。这些证据为 [方案 A](./option-a-standalone-with-pinned-dsh.md)–[D](./option-d-marketplace-monorepo.md) 的取舍背书。

## 一、第三方 DSH 插件 repo（最直接的生态证据）

### 装包契约：`dsh` 字段是事实标准

awesome 列表（[awesome-dsh-plugin/awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 等，另有 jqueryscript、dshworks、kejixiaoliang、coolbat、NoWint 多个竞争列表）的收录规则就是两条：**能用 `dsh plugin add` 装** + **package.json 声明 `dsh.bundle`**。核实到的字段形状：

```jsonc
// 核实自 dsh-im / dsh-market / dsh-routing-suite / chatnode-wechat 的 package.json
{
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },       // patch 层 bundle（全员必备）
    "client": { "inject": ["dsh-client-ui-slots", …] }, // Web UI 插件的注入点（可选）
    "platform": "web",
    "compatibility": { "dshReleases": { … } }           // 显式声明验证过的 DSH 版本（dsh-im 钉了 5 个 release）
  }
}
```

### 逐 repo 树

**[xmanrui/dsh-im](https://github.com/xmanrui/dsh-im)**（npm `@xmanrui/dsh-im`，九→十一条 IM 渠道）：

```text
bin/  docs/  integrations/  lib/  plugin-src/  scripts/(verify-*)  src/  test/(channels/*)
worker/  cordis.patch.yml  wrangler.jsonc  CONTEXT.md  bilingual READMEs
```

依赖姿态：`@deepseek-ai/cordis` **仅 devDependency**，Web client 用自家 esbuild 打包（`plugin-src/client/build.mjs`）后经 `dsh.client.inject` 注入——证明 out-of-tree Web UI 真实可行。维护 `CONTEXT.md`（上下文建模文档，与上游 domain-modeling 惯例同源）。

**[dsh-market/dsh-market](https://github.com/dsh-market/dsh-market)**（npm `dshmarket`，in-harness 商店）：单包，`dsh.bundle.patch` + `dsh.client.inject: [dsh-client-locale, dsh-client-ui-settings, dsh-client-ui-theme]`；**peerDependencies**：`@deepseek-ai/cordis ^4.0.1`、`@deepseek-ai/dsh-settings`（optional）；client 包作 devDependency 经 tsdown 打进产物。vitest + playwright + smoke 三套测试。`dsh plugin --profile web add dshmarket` 安装。

**[yjh051108/dsh-routing-suite](https://github.com/yjh051108/dsh-routing-suite)**：npm 名 `@dsh-external/dsh-super-injector` 但 `private: true`，分发走 `install.sh`/`install.ps1`；peerDependencies 写的是**未加 scope 的 `cordis`**（与上游 rescope 约定不符的偏差样本）；无 lockfile。`cordis.patch.yml` + `preset/` + `injector/` 分目录。

**[Jesse-njx/dsh-chatnode-wechat](https://github.com/Jesse-njx/dsh-chatnode-wechat)**：五个 `@deepseek-ai/dsh-*` 全部**精确钉死为 runtime dependencies**（`0.1.0-rc.6`）——pre-stable API 下每次上游同步都逼一次发版，是依赖姿态的反面样本。

**[anywhere-labs/dsh-desktop](https://github.com/anywhere-labs/dsh-desktop)**：桌面客户端 monorepo（workspaces：`dsh-plugin-desktop` 等），**`.gitmodules` 把 deepseek-ai/deepseek-harness 整库钉成 submodule**，配 `vendor/`、`patches/`、`upstream.json`、3.8KB `AGENTS.md`（`CLAUDE.md` 为 symlink stub）——**方案 A（submodule 钉 DSH 源码 + AGENTS.md 入口链）的现存完整实现**。

**[vvlife/whalehub-dsh](https://github.com/vvlife/whalehub-dsh)**：standalone 商店 Web 应用（Vercel + React），`private: true`、**无任何 `@deepseek-ai/*` 依赖、无 `dsh` 字段**——纯 registry 前端，不是 bundle。

**不可达/未核实**：`dsh-onlyne` 四路搜索无踪迹（按不存在处理）；[Abel-86/task-chime](https://github.com/Abel-86/task-chime) repo 在但 raw `main` 无 package.json，装包细节未验证。`dsh-tauri-desk` 组织重定向为 [dsh-tauri](https://github.com/dsh-tauri/deepseek-harness-pkg)（pnpm workspace 重打包仓库）。

### 生态统计与模式

- **90%+ 是单包 repo**（awesome 列表数百条目中 monorepo 是少数派：hyzyn/dsh-plugin-kit、Jonah-Wu23/dsh-gungnir、0x7A7A6572/dsh-forge-studio、dsh-desktop）——单专家阶段用一个包是市场主流，不是偷懒。
- **依赖声明四种姿态并存**（说明生态尚未收敛，需要自己选纪律）：peerDependencies（dsh-market）/ 精确 runtime deps（chatnode-wechat）/ devDep + 自打包 client（dsh-im）/ 零耦合（whalehub-dsh）。`@deepseek-ai/cordis` 作 peer 是最接近通用约定的写法（与上游规则一致）。
- **兼容矩阵**（`dsh.compatibility.dshReleases`）是反复出现的自律实践，值得照抄进 expert-pack。

## 二、其他 host 生态的插件 repo 形状

### Claude Code plugins（闭源 host 的极限形态）

[plugins-reference](https://code.claude.com/docs/en/plugins-reference) / [plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)；官方 marketplace repo [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)（树已核实）：

```text
.claude-plugin/marketplace.json    # 目录：本地 source ./plugins/<name> + 远端 git-subdir 钉 ref+SHA
plugins/<name>/                    # .claude-plugin/plugin.json、.mcp.json、commands/、skills/
external_plugins/                  # 第三方插件的 vendored 副本
```

要点：约定优于配置（组件放默认目录即被发现）；安装是**拷贝进版本化缓存**，因此禁止 `../` 引用、marketplace 内 symlink 被解引用拷贝——**自包含是硬规则**；版本不钉就退化为 git SHA，文档明说"每次发版都要 bump"。host 闭源，所以 `plugin-dev` 插件把框架知识做成 SKILL.md 随包走——"host 源码可见"不可得时的 fallback。

### OpenClaw（与 DSH 同构度最高的 host）

[building-plugins](https://docs.openclaw.ai/plugins/building-plugins.md) / [openclaw/openclaw](https://github.com/openclaw/openclaw)（树已核实）：

- **in-repo 通道**：60+ 第一方插件是 pnpm workspace 的 `extensions/*` 包，与 host 同仓同编译（还有独立的 `tsconfig.extensions.json` project face 和 `extensions/AGENTS.md`）——host 与插件永远版本一致，agent 只看一棵树；代价是发布耦合。
- **外部通道**：npm 包 + **host 作 peerDependency + 显式 `compat.pluginApi`/`minGatewayVersion` 范围**，manifest（`openclaw.plugin.json`）先行声明 `contracts.tools` 贡献清单，host 不必急加载 runtime；文档明说"源码 checkout 测试会掩盖依赖错误，要用 `npm pack` → 真实安装形状测"。

这两条通道的并存正是本 FAQ 方案 A ↔ 方案 B 关系的生态版。

### MCP servers（纯外部依赖 monorepo）

[modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)（树与 `src/everything/package.json` 已核实）：npm workspaces，`src/<server>/` 一目录一 server，对 `@modelcontextprotocol/sdk` 用 **registry semver `^` 依赖**（非 workspace/peer），各 server 独立发版（OIDC trusted publishing）。成立前提是 SDK 面小且稳定——DSH API 仍 pre-stable，照搬此姿态风险更高。

### 其他

- **[gemini-cli-extensions/alloydb](https://github.com/gemini-cli-extensions/alloydb)**（树已核实）：一个 pack 同时带 `gemini-extension.json` + `.claude-plugin/plugin.json` + `.codex-plugin/` 三套 host manifest——"pack 核心 + 薄 host 适配层"的多 host 形状。
- **[rust-lang/rust-analyzer](https://github.com/rust-lang/rust-analyzer)**：`lib/` + `crates/` + `editors/code`，扩展与 host 同仓但只经 LSP 协议耦合——协议化耦合让同仓不同步也安全。
- **[obsidianmd/obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin)**（树已核实）：单包形状的底线样本——`obsidian` npm 包**只是 devDependency 提供类型**，真实 API 运行时注入；`main.js` 构建产物随 release 提交。
- **Cursor**（[docs](https://code.claude.com/docs/en/plugins-reference) 之外的 [cursor.com/docs/plugins](https://cursor.com/docs/plugins.md)）：repo 导入即 marketplace；同时接受自有格式与 vendor-neutral 的 [agent-plugins.org](https://agent-plugins.org) 标准——多格式 pack = 薄标准核心 + host 专属扩展文件。规则文件最佳实践：短、引用真实文件、不复制内容。

### Vendored-framework / submodule 模式（方案 A 的优先证据）

- **[antfu/skills](https://github.com/antfu/skills)**（`.gitmodules` 与 `GENERATION.md` 已核实）：`sources/`（钉官方文档 repo）+ `vendor/`（钉自带 skills 的外部项目）+ 生成的 `skills/`；submodule 钉 tag、`GENERATION.md`/`SYNC.md` 记精确 SHA、更新脚本重检出再生成、还有版本漂移告警插件——pinned-vendor 簿记的最完整公开范本。
- **[MarkShawn2020/.claude](https://github.com/MarkShawn2020/.claude)**：个人插件配置 repo 用 submodule 钉整个 marketplace（`plugins/marketplaces/anthropic-agent-skills → anthropics/skills`）——小 repo 钉大生态的极简样本。
- **anywhere-labs/dsh-desktop**（上文）与 **DSH 自身 `vendor/`（钉 Cordis，manifest + upstream SHA + 同步程序）**：同一纪律在本生态内的两个既有实例。

## 三、综合：四种共存模型

| 模型 | 实例 | host 源码 | 版本关系 | 适用 |
|---|---|---|---|---|
| catalog-only（钉别人的 repo） | claude-plugins-official | 不含 | git-subdir + SHA 钉外部 | 分发/索引，不是开发形态 |
| 同仓 workspace（host+插件共维护） | OpenClaw extensions、gemini-cli | 就是 host repo | 永远一致，发布耦合 | 方案 B（第一方/prototype） |
| pinned vendor（钉住不拥有） | **dsh-desktop、antfu/skills、DSH `vendor/`** | submodule/钉本 | tag + SHA 簿记 | **方案 A（第三方专家包，与 D 同底）** |
| 纯外部依赖（host 只是 npm 包） | MCP servers、whalehub-dsh | 不含 | registry semver + 类型 | 方案 C（过渡） |

依赖姿态与模型的对应关系：同仓 co-build 用 workspace 依赖；发布插件用 peerDependencies + 兼容矩阵；UI 插件额外用 devDep + 自打包 client + `dsh.client.inject`。
