# Reference 24 · 源码与文档索引

本页汇总插件发布、只读智能体定义与运行期数据落点所依据的 DSH 主仓文档与实现入口，方便按模块直接下钻核对。

---

## 一、包清单、安装管理与兼容判定

- **发布与分发总览**：[`docs/user/develop/basic/publish.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)（Bundle 与 Profile 的职责切分、叠层顺序、Git 安装与 `allowBuilds`）
- **第三方市场索引规范**：[`docs/user/guide/plugin-market.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.md)（静态 `index.json` 格式、40 位 Git SHA 约束与信任边界）
- **官方按需目录生成器**：[`scripts/gen-official-bundle-catalog.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/gen-official-bundle-catalog.ts)（第一方公开 `@deepseek-ai/dsh-*` 准入条件、双语元数据与图标门禁）
- **`package.json` 公开清单类型**：[`packages/util/package-manifest/src/types.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/package-manifest/src/types.ts)（`DshManifest`、`dsh.bundle`、`dsh.profile`、`dsh.client` 类型定义）
- **启动叠层与行级装载**：[`packages/boot/app-boot/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md)（`skippedBundles`、必需插件行、HMR 刷新语义）
- **版本兼容判定实现**：[`packages/boot/app-boot/src/plugin-compatibility.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/plugin-compatibility.ts)（`engines.dsh` 唯一优先、`@deepseek-ai/dsh*` peer 回退、预发布号匹配）
- **静态展示元数据解析**：[`packages/boot/app-boot/src/package-meta.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/package-meta.ts)（免激活读取 `./locale/*.json` 与 `./icon`、256 KiB 体积上限与回退行为）
- **插件安装器与运行时管理**：[`packages/boot/plugin-manager/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md)（`install_bundle` 状态机、`not-bundle` 回滚、`compatibility.json` 精确豁免、卸载留存边界）
- **前端客户端模块扫描**：[`packages/client/modules/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/modules/README.md)（仅扫描已启用 Host 行对应包的 `dsh.client` 入口）
- **混用导出事故复盘**：[`docs/postmortem/0001-acp-default-export-drops-inject.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md)（`export default` 与具名 `inject` 混用导致依赖声明丢失的真实案例）

---

## 二、只读智能体定义（Preset、技能与指令链）

- **声明式 Preset 插件**：[`packages/preset/agent-preset/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/README.md)（`preset-<id>` 行结构与五个核心配置字段）
- **Preset 注册表与 Revision 生命周期**：[`packages/preset/agent-preset-registry/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md)（已有会话钉住 revision、新会话与重启切换最新定义、只读查询与选择接口）
- **出厂标准 Preset 样例**：[`packages/bundle/web-app/presets/standard.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/standard.patch.yml)
- **Cordis 组合与插件编写指南**：
  - [`packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md)
  - [`packages/preset/agent-preset/skills/cordis-plugin-development/references/host-plugin.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/cordis-plugin-development/references/host-plugin.md)
  - [`packages/preset/agent-preset/skills/cordis-plugin-development/references/ui-plugin.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/cordis-plugin-development/references/ui-plugin.md)
  - [`packages/preset/agent-preset/skills/cordis-plugin-development/references/mcp-bundle.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/cordis-plugin-development/references/mcp-bundle.md)
- **技能注册表与六个本地扫描根**：[`packages/skill/skill-filesystem/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/README.md)（`rank` 优先级与目录发现规则）
- **`AGENTS.md` 指令链加载**：[`packages/context/agent-instructions/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/agent-instructions/README.md)（全局根到会话目录的叠加顺序与字节预算）

---

## 三、运行期数据、路径与安全契约

- **全局目录解析**：[`packages/util/home-paths/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/home-paths/README.md)（`$DSH_HOME` 与 `$DSH_AGENTS_HOME` / `~/.agents` 双根分工）
- **会话与持久化日志**：
  - [`docs/subsystems/session.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md) 与 [`docs/subsystems/persistence.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/persistence.md)
  - [`packages/session/session-persistence-jsonl/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/session-persistence-jsonl/README.md)（追加式世代日志与 zstd 压缩布局）
  - [`docs/subsystems/session-projection.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session-projection.md)（`ctx.sessionProjections` 同步纯函数折叠与 `stateVersion`）
  - [`docs/subsystems/session-query.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session-query.md)（`ctx.sessionQuery` 只读浏览与搜索）
- **非会话托管存储（`storage` / `storage-domain`）**：
  - [`docs/subsystems/storage.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/storage.md) 与 [`packages/storage/storage-domain/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/storage/storage-domain/README.md)
  - [`packages/storage/storage-json/src/per-record-unit.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/storage/storage-json/src/per-record-unit.ts)（JSON `per-record` 键字符集 `[a-zA-Z0-9_-]+` 校验）
- **凭据与单 Profile 设置**：
  - [`docs/subsystems/credentials.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/credentials.md) 与 [`packages/credentials/credentials-local/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/credentials/credentials-local/README.md)
  - [`docs/subsystems/settings.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/settings.md) 与 [`packages/settings/settings/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/README.md)
- **工作目录、文件系统、附件、暂存与交付物**：
  - [`packages/session/working-directory/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/session/working-directory/README.md) 与 [`packages/workspace/workspace/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workspace/workspace/README.md)
  - [`docs/subsystems/filesystem.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/filesystem.md)（`ctx.fs` 乐观并发与沙箱写策略）
  - [`docs/subsystems/attachment.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/attachment.md)、[`docs/subsystems/spill.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/spill.md)、[`docs/subsystems/deliverables.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/deliverables.md)
- **宿主与沙箱防御规范**：[`docs/defensive-patterns/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/defensive-patterns/README.md)、[`docs/cookbook/adding-a-tool.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md)

---

## 四、相邻专题导航

- 动手前先查清 DSH 已有哪些现成能力与 seam：[FAQ 08 · 查找现成能力](../08_plugin-seam-maturity/01-finding-existing-capabilities.md)
- 外部专家插件源码仓库怎么组织与联调：[FAQ 13 · 专家插件仓库组织](../13_expert-plugin-repo-organization/answer.md)
- CLI、Web 与 Desktop 运行形态差异：[FAQ 23 · 独立应用与 Web 发布形态](../23_standalone-vs-web-release-forms/answer.md)
- Workspace 与 Session 的关系详解：[FAQ 25 · 工作区与会话机制](../25_workspaces-and-conversations/answer.md)
- 基于 DSH 组装定制工作台或独立发行产品：[FAQ 26 · 定制工作台与发行组装](../26_harness-distribution/answer.md)

> 核验状态见 [核验基线登记](../00-baseline.md)。
