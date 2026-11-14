# Reference 26 · 源码、文档与验证夹具索引

本页汇总定制工作台组装、Profile 启动流水线、首启工作区绑定与数据隔离所依据的 DSH 主仓文档及源码位置。

---

## 一、应用启动边界、CLI 与 Profile 叠层

- **受支持的应用启动入口规范**：[`docs/architecture.md#application-launch`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md#application-launch)（`Only dsh profiles launch supported Node apps`，禁止包级私有 `bin` 绕过 `dsh`）
- **CLI Profile 启动与插件管理参考**：
  - [`apps/cli/reference/README.md#profile-boot`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/reference/README.md#profile-boot)（内置模板、`--from-default-profile`、`--dump-default-config` / `--dump-config` / `--dump-config-schema`）
  - [`apps/cli/reference/README.md#plugin-management`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/reference/README.md#plugin-management) 与 [`apps/cli/src/plugin.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/plugin.ts)
- **启动叠层与模块装载实现**：
  - [`packages/boot/app-boot/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/README.md) 与 [`packages/boot/app-boot/src/profile.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/profile.ts)
  - [`vendor/include/src/index.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/include/src/index.ts)（Patch 顺序应用与同名行 `config` 整块对象替换逻辑）
  - [`docs/cordis-primer.md#loader-configuration`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md#loader-configuration)（`!!js` 动态配置规则与 Overlay 机制）
- **插件管理器与配置编辑器**：
  - [`packages/boot/plugin-manager/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/plugin-manager/README.md)
  - [`packages/boot/config-editor/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/config-editor/README.md) 与 [`packages/settings/settings/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/README.md)（`Config.volatile()` 写回当前 Profile `cordis.patch.yml`）
- **发布与包清单契约**：[`docs/user/develop/basic/publish.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)、[`packages/util/package-manifest/src/types.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/package-manifest/src/types.ts)
- **Desktop Windows 打包与签名要求**：[`apps/desktop/windows-signing/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/desktop/windows-signing/README.md)

---

## 二、首启引导、工作区、会话与前端装配

- **Web 出厂 Bundle 与标准 Preset**：
  - [`packages/bundle/web-app/presets/standard.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/standard.patch.yml)
  - [`packages/preset/agent-preset/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/README.md) 与 [`packages/preset/agent-preset-registry/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md)
- **Workspace 实体、默认目录与目录选择器**：
  - [`docs/subsystems/workspace.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/workspace.md) 与 [`packages/workspace/workspace/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/workspace/workspace/README.md)
  - [`packages/api/workspace-controller/src/default-directory.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/workspace-controller/src/default-directory.ts)（默认 `Documents/deepseek-harness/default-workspace` 路径生成）
  - [`packages/host/directory-picker-auto/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/host/directory-picker-auto/README.md) 与 [`apps/web/tests/pin-browse-picker.overlay.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/pin-browse-picker.overlay.yml)（原生弹窗 `pick` 与网页内浏览 `list/createDirectory` 切换）
- **会话创建、工作区挂接与前端选中状态**：
  - [`packages/api/session-controller/src/types.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/types.ts) 与 [`packages/api/session-controller/src/commands.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/commands.ts)（`workspaceId` 与 `cwd` 互斥校验及 `session/workspace-attach-failed` 错误恢复）
  - [`packages/client/ui-workspace/src/client/navigation.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-workspace/src/client/navigation.ts)（客户端首启资格判定与 `openSession` 导航）
  - [`packages/client/modules/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/modules/README.md)（前端扩展模块扫描规则）

---

## 三、主目录隔离、沙箱边界与状态存储

- **主目录与共享技能根解析**：[`packages/util/home-paths/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/util/home-paths/README.md)（`DSH_HOME` 与 `DSH_AGENTS_HOME`）
- **会话工作目录与沙箱写策略**：
  - [`docs/subsystems/working-directory.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/working-directory.md)
  - [`docs/subsystems/sandbox.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/sandbox.md)
  - [`docs/subsystems/filesystem.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/filesystem.md)、[`packages/fs/fs-sandbox/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/fs-sandbox/README.md)、[`packages/fs/tool-fs/README.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs/README.md)
- **托管存储、凭据、附件与交付展示**：
  - [`docs/subsystems/storage.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/storage.md)、[`docs/subsystems/credentials.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/credentials.md)
  - [`docs/subsystems/attachment.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/attachment.md)、[`docs/subsystems/deliverables.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/deliverables.md)
- **会话格式状态与兼容性门禁**：[`docs/session-format-status.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/session-format-status.md)
- **本专题附带的最小验证夹具**：[`fixtures/profile-bundle/package.json`](./fixtures/profile-bundle/package.json)、[`fixtures/profile-bundle/cordis.patch.yml`](./fixtures/profile-bundle/cordis.patch.yml)

---

## 四、相邻专题导航

- 单个插件包怎么打、随包技能怎么注册、运行数据怎么落盘：[FAQ 24 · 插件发布与数据边界](../24_plugin-publishing-and-data/answer.md)
- 官方 CLI、Web 与 Desktop 三种运行形态本身的边界：[FAQ 23 · 独立应用与 Web 发布形态](../23_standalone-vs-web-release-forms/answer.md)
- Workspace 与 Session 的底层关联机制：[FAQ 25 · 工作区与会话机制](../25_workspaces-and-conversations/answer.md)
- 动手扩展前如何检索 DSH 现有能力与 seam：[FAQ 08 · 插件生态成熟度](../08_plugin-seam-maturity/answer.md)

> 核验状态见 [核验基线登记](../00-baseline.md)。
