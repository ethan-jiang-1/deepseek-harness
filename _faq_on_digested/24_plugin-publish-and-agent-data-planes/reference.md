# 24 · 证据登记：来源、等级与主张对应

这份文件回答两个问题：本篇的结论分别由什么支持；发生冲突时该信谁。它不重复正文，只做**来源登记**和**主张 → 证据**的映射，保证本篇可以独立阅读、独立核对。

基线：`dsh-v0.2.1-rc.3`（`1f81c047fc48fa190a683e469daa699857e9afe8`）。仓库外行为（npm、Git 托管、市场、Desktop 壳）按仓库文档与生成器记录，未联网实测。

## 证据等级

| 等级 | 含义 | 能写成什么 |
|---|---|---|
| **C** | 当前合同：产品 docs、源码、测试 | “DSH 现在如何” |
| **H** | 历史事实：Agent Note、旧文档、旧 commit | “当时如何” |
| **P** | 提案：计划、未实现的设计 | 不能当已实现 |
| **S** | 第三方源码阅读 | “这个样本这样写”，不是 DSH 合同 |
| **R** | README / 作者声明 | “作者声称如此”，不等于产品合同 |
| **U** | 未确认 | 只能列为待核项 |

冲突时按 **C > R > H > S > U** 取信。注意：同一等级内部仍有优先级——**源码 + 测试 > 产品 docs > 包 README > 决策记录**。包 README 可能落后于实现；决策记录只说明当时的决定，不证明当前行为。

## 来源登记

### DSH 当前合同（C）

| 主题 | 来源 | 支撑什么 | 备注 |
|---|---|---|---|
| 发布模型 | [publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/user/develop/basic/publish.md) | bundle 与 profile 的分工、加载顺序、覆盖语义、Git 安装与 `allowBuilds` | 产品文档；与 app-boot/plugin-manager 一致时最稳 |
| 启动、层、行、必需 id | [app-boot README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/boot/app-boot/README.md) | patch 叠层、`skippedBundles`、行级拒绝、兼容判定入口 | 含 profile/linked 包 HMR 行为 |
| 安装、激活、豁免 | [plugin-manager README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/boot/plugin-manager/README.md) | `install_bundle`、回滚、`already-installed`、`compatibility.json`、插件在沙箱外执行 | 与 CLI 路径的差异要分开写 |
| manifest 类型 | [package-manifest types.ts](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/util/package-manifest/src/types.ts) | `DshBundleManifest`、`dsh.bundle.patch`、`manifestVersion`、`client` 字段 | 类型存在 ≠ 有读取方 |
| 兼容判定 | [plugin-compatibility.ts](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/boot/app-boot/src/plugin-compatibility.ts) | `engines.dsh` 优先、peer 回退、预发布匹配、非法范围 | 与 package-manifest README 的旧结论冲突，以本文件为准 |
| 元数据 | [package-meta.ts](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/boot/app-boot/src/package-meta.ts) | locale/icon/description 的解析、回退与 `error` 行为 | 资源经 `exports` 解析 |
| preset 声明 | [agent-preset README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/preset/agent-preset/README.md) | preset 的五个字段、子插件行、`preset-<id>` 约定 | 定义是普通插件行 |
| preset 生命周期 | [agent-preset-registry README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/preset/agent-preset-registry/README.md) | id 选择、revision 持有、重启按当前定义恢复、只读 UI | 注释里的“Web editor 保存”已过时 |
| 作者写法 | [editing-cordis-compositions SKILL](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md) | Host 行与 preset 行的分工、`isolate`/`group`、资产从安装包解析 | 作者指引，不是协议 |
| 出厂 preset | [standard.patch.yml](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/bundle/web-app/presets/standard.patch.yml) | 标准 preset 的 skill 两行、工具面 | 文件注释有漂移，行为以 registry 为准 |
| skill 根与 rank | [skill-filesystem README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/skill/skill-filesystem/README.md) | 六个扫描根、rank、frontmatter、顶层发现 | 包内 `assets/skills` 不自动发现 |
| 指令链 | [agent-instructions README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/context/agent-instructions/README.md) | `AGENTS.md` 顺序、broad→specific、字节预算、刷新时机 | durable baseline message，不是系统提示 |
| home 解析 | [home-paths README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/util/home-paths/README.md) | `$DSH_HOME`、`~/.agents`、`DSH_AGENTS_HOME` | 不要硬编码 `~/.dsh` |
| 宿主 KV | [storage-domain README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/storage/storage-domain/README.md) | domain、schema、版本、写链、`already-open`、无自动迁移 | 没有 per-plugin 目录/配额 |
| 会话日志 | [session-persistence-jsonl README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/session/session-persistence-jsonl/README.md) | 目录布局、世代、压缩、无删除 API | 默认 zstd，不是纯 JSONL |
| 工作目录 | [working-directory README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/session/working-directory/README.md) | 会话级工作目录、`working_directory` 工具、事件提交 | `header.cwd` 不可变，当前目录可改 |
| 工作区记录 | [workspace README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/workspace/workspace/README.md) | 项目列表与会话分组；删记录不删目录/历史 | 不是文件管理器 |
| 附件 | [attachment-local README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/attachment/attachment-local/README.md) | 内容寻址、不可变、保留所有对象、无自动 GC | 删日志/删工作区不回收 |
| spill | [spill-local README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/spill/spill-local/README.md) | OS 临时目录、`cleanupPeriodDays`、启动一次性清理 | 不是用户交付物 |
| 产物 | [tool-present README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/deliverables/tool-present/README.md) | `present` 只记路径，不复制字节 | 交付物应写工作区 |
| 凭据 | [credentials-local README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/credentials/credentials-local/README.md) | `CredentialRef` / `CredentialKey`、每次 resolve、文件权限不是隔离边界 | 值不进日志/patch |
| settings | [settings README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/settings/settings/README.md) | volatile 字段、写当前 profile 的 `cordis.patch.yml`、拒绝陈旧写 | profile 作用域，不是账号 |
| client 模块 | [client modules README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/client/modules/README.md) | Host 已启用行扫描、`dsh.client`、`window.__DSH_BOOT__`、组合路由 | preset 子树不参与扫描 |
| 市场 | [plugin-market 指南](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/user/guide/plugin-market.md) | index 格式、版本语义、Discover、不背书 | 第三方静态 JSON |
| 官方目录 | [gen-official-bundle-catalog.ts](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/scripts/gen-official-bundle-catalog.ts) | 准入条件、双语/图标、按需安装 | 外部作者不可发布 |
| 测试设施 | [testing.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/testing.md) | 分层、快照、e2e、覆盖率、flaky 规则 | 主仓规则，不是外部插件义务 |
| 导出事故 | [postmortem 0001](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/postmortem/0001-acp-default-export-drops-inject.md) | default/named 混用会丢命名空间 | 真实事故记录 |
| 沙箱与宿主边界 | [defensive-patterns README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/defensive-patterns/README.md) | 宿主代码在沙箱外、文件效果与审批、安装脚本执行 | 插件作者必须知道的边界 |

### 历史与过时材料（H / R）

| 来源 | 它说什么 | 现状 |
|---|---|---|
| `packages/util/package-manifest/README.md` 的 Known Limitations | “安装器与加载器不强制 `engines.dsh`” | **过时**；对 `manifestVersion` 仍成立，对 `engines.dsh` 不成立。以 `plugin-compatibility.ts` 与三份产品文档为准 |
| `2026-09-10-public-package-manifest` 决策记录 | 同上 | **历史**；记录的是当时决定，不证明当前行为 |
| `packages/bundle/web-app/presets/*.patch.yml` 注释 | “Web 编辑器保存的修改会覆盖此 row” | **漂移**；当前 registry 只有 `list` / `read` / `select`，没有 save |
| `2026-09-18-declarative-agent-presets` 决策记录 | Web editor 与 `agent_preset` 工具会保存 | **未落地**；按当前代码/README 为准 |
| `$DSH_HOME/.agent-presets/<id>/agent.cordis.yml` | 旧的 preset 目录 | **无读取方**；改用 bundle patch 里的 preset 行 |
| `dsh.compatibility` | 第三方版本矩阵 | **不是 DSH 字段**；用 `engines.dsh` |
| `modeSelectionEnabled` | 旧的模式选择开关 | **registry 不读不写**；删除 |
| `$DSH_HOME/plugins/<id>/` | 插件数据根 | **没有核心契约**；只是本机惯例（**C/U**：无类型/读取方，`home-paths` 也没有这个根） |

## 关键主张 → 证据

| # | 主张 | 主要证据 | 等级 |
|---|---|---|---|
| 1 | 只有 bundle 会被自动选入 profile 并作为一层管理 | publish.md；package-manifest types；app-boot README；plugin-manager README | C |
| 2 | 普通 npm 包可以安装，但只是依赖，不会自动启用 | publish.md；plugin-manager 的 `not-bundle` | C |
| 3 | 发布失败分三类：拒绝/跳过/拒行、装后坏、只降级 | app-boot README（行/层）；plugin-compatibility.ts；package-meta.ts | C |
| 4 | `engines.dsh` 优先，缺失时才回退 DSH peer | plugin-compatibility.ts；publish.md；app-boot/plugin-manager README | C |
| 5 | `dsh.manifestVersion` 没有读取方 | types.ts；全仓检索无消费者；package-manifest README 的旧说法只对它成立 | C/R |
| 6 | `dsh.compatibility` 不是 DSH 字段 | 无类型/读取方；兼容代码只读 `engines.dsh` / peer | C |
| 7 | preset 是 `@deepseek-ai/dsh-agent-preset` 的一行声明，不是包/目录 | agent-preset README；agent-preset-registry README；web-app presets | C |
| 8 | 已有 Agent 保持旧 revision，新 Agent 用当前定义；重启按当前定义恢复 | agent-preset-registry README 的 Model Experience；registry 源码 | C |
| 9 | 工作目录是会话级状态，`process.cwd()` 不代表它 | working-directory README | C |
| 10 | 指令链是 `$DSH_HOME` → `~/.agents` → 项目根到 cwd 的 `AGENTS.md`，有字节预算 | agent-instructions README | C |
| 11 | skill 有六个扫描根，按 rank 合并；包内 `assets/skills` 不自动发现 | skill-filesystem README | C |
| 12 | session 日志只追加、按世代保留、没有删除 API | session-persistence-jsonl README | C |
| 13 | 附件内容寻址、不可变、本地后端不自动 GC；删日志不回收 | attachment-local README | C |
| 14 | storage domain 是 schema 校验的宿主 KV；没有 per-plugin 目录/配额/自动迁移 | storage-domain README；`defineDomain` 类型与 `open` 语义 | C |
| 15 | settings 写当前 profile 的 `cordis.patch.yml`；profile 不是账号 | settings README | C |
| 16 | 插件没有核心“数据根”；`$DSH_HOME/plugins/<id>/` 只是惯例 | 无类型/读取方；`home-paths` 未定义该根 | C/U |
| 17 | 市场是第三方静态 JSON，DSH 只校验格式、不背书 | plugin-market 指南；plugin-market-index 包 | C |
| 18 | 官方目录只收第一方 `@deepseek-ai/dsh-*` bundle，外部作者不可发布 | gen-official-bundle-catalog.ts | C |
| 19 | client 模块只扫描 Host 已启用行挂载的包；preset 子树不参与 | client modules README | C |
| 20 | 安装可以执行被批准的构建脚本；激活的 Host 代码在进程内、沙箱外执行 | plugin-manager README；publish.md | C |
| 21 | HMR 会在下一次重组时替换 profile/linked 包的已加载文件 | plugin-manager README | C |
| 22 | 版本豁免是用户的逃生门，不是作者的兼容策略 | plugin-manager README | C |
| 23 | 卸载 bundle 只移除依赖、选择与运行时贡献，不清理插件数据 | plugin-manager README 的 Removal 顺序 | C |

## 外部来源（参考，不是 DSH 合同）

以下来源按 2026-10-25 公开文档记录，未逐项实测；等级为 **R/S**，只能支撑“别人怎么做”的对照，不能支撑 DSH 行为。

| 生态 | 来源 | 用途 |
|---|---|---|
| npm | [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish)、[Sigstore](https://docs.sigstore.dev/about/overview/)、[SLSA](https://slsa.dev/spec/v1.1/levels) | 发布、构建证明、供应链 |
| Dify | [manifest](https://docs.dify.ai/en/develop-plugin/features-and-specs/plugin-types/plugin-info-by-manifest)、[持久 KV](https://docs.dify.ai/en/develop-plugin/features-and-specs/plugin-types/persistent-storage-kv)、[签名](https://docs.dify.ai/en/develop-plugin/publishing/standards/third-party-signature-verification) | 密封包、权限、workspace KV |
| Hugging Face | [repositories](https://huggingface.co/docs/hub/repositories)、[Spaces storage](https://huggingface.co/docs/hub/spaces-storage) | repo 分发、临时磁盘 vs bucket |
| MCP Registry | [package types](https://modelcontextprotocol.io/registry/package-types)、[versioning](https://modelcontextprotocol.io/registry/versioning) | 纯指针、版本不可变 |
| Claude Code | [manifest](https://code.claude.com/docs/en/plugins/manifest-reference)、[security](https://code.claude.com/docs/en/plugins/security) | `PLUGIN_ROOT` vs `PLUGIN_DATA`、目录分发 |
| OpenAI | [package your plugin](https://developers.openai.com/plugins/build/plugins)、[schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json) | portable plugin、命名空间 |
| VS Code | [manifest](https://code.visualstudio.com/api/references/extension-manifest)、[capabilities](https://code.visualstudio.com/api/extension-capabilities/common-capabilities) | contribution points、五套 storage |
| Obsidian | [submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin) | 三文件发布、目录页与工件页分离 |

## 未验证与维护

**未验证：**

- 市场、npm、Git 托管、Desktop 壳侧安装的实际网络行为；只按文档与生成器阅读。
- 外部生态（Dify、HF、MCP、Claude Code、OpenAI、VS Code、Obsidian）的行为；只按公开文档对照。
- 本机未安装 Desktop；Desktop 差异引用 FAQ 23，不在本篇重新判断。
- “什么算好插件”的多数条目是质量判断，不是 DSH 强制；正文已按“门禁/质量线”分开。

**维护：**

1. 基线移动时，先重跑 `node _faq_on_digested/verify.mjs`，再逐条核对本文件的 C 级来源。
2. 源码与 README 冲突时，先查 `plugin-compatibility.ts`、`package-meta.ts`、`app-boot`/`plugin-manager` 的实现，再改正文。
3. 新增主张时，在本文件补一行“主张 → 证据”，不要只在正文里放链接。
4. 本篇是独立说明：不把其他 FAQ 的结论当作证据；需要跨篇对照时，只把它们当延伸阅读，并在正文保持可独立理解。
