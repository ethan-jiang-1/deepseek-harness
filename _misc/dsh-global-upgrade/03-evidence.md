# 证据附录

本文件说明"为什么是这些版本、这个顺序"。执行时不需要读它；想质疑某个决定时再查。

**调研日期**：2026-10-19。**调研方式**：只读。npm registry 元数据、unpkg 单文件读取、本机安装目录与 profile 目录；仓库源码仅用于理解行为，**任何升级动作都不依赖仓库**。

---

## 1. 版本矩阵

| 包 | 本机版本 | npm 最新 | 升级目标 | 目标版本发布时间 | 声明要求（对 0.2.1-rc.2） |
|---|---|---|---|---|---|
| `@deepseek-ai/dsh` | 0.2.0-rc.2 | 0.2.0-rc.2（`latest`） | **0.2.1-rc.2**（`next`） | 2026-10-17 | — |
| `dsh-better-sidebar` | 0.25.0 | 0.28.0 | **0.28.0** | 2026-10-17 | `^0.2.1-rc.1` |
| `@quill507/dsh-auto-approval-llm` | 0.0.41 | 0.0.43 | **0.0.43** | 2026-10-18 | `>=0.2.1-rc.2 <2` |
| `dshmarket` | 1.66.17 | 1.66.42 | **1.66.42** | 2026-10-18 | `dsh-settings@^0.2.0-rc.1`（兼容） |
| `@linxin666/dsh-client-ui-skill-explorer` | 0.4.4 | 0.4.7 | **0.4.7** | 2026-10-17 | `engines.dsh >=0.2.1-rc.2` |
| `@cerbur/clutch-dsh-worktree` | 0.1.17 | 0.1.18 | **0.1.18** | 2026-10-14 | `>=0.2.0-rc.1` |
| `@arcships/dsh-dim-oauth` | 0.2.1 | 0.2.1 | 不动 | 2026-10-01 | `>=0.1.1-rc.2`（兼容） |
| `dsh-client-auto-continue` | 0.14.2 | 0.14.2 | 不动 | 2026-10-07 | `^0.2.0-rc.1`（兼容） |

注意 `@deepseek-ai/dsh` 的 `latest` 仍是 0.2.0-rc.2：`npm i -g @deepseek-ai/dsh` 不带 tag 等于没升。升级目标取 `next`（0.2.1-rc.2），不用 `alpha`（0.2.1-alpha.5）——auto-approval 的新版明确拒绝 alpha 线。

## 2. 宿主判定口径

0.2.1 起，安装与启动都会读插件清单判断兼容性：

1. 有 `engines.dsh` 时**只看它**，忽略 `@deepseek-ai/dsh*` 的 peer；
2. 没有 `engines.dsh` 时，逐个检查 `@deepseek-ai/dsh` 与 `@deepseek-ai/dsh-*` 的 peer 范围；
3. 比较用 `semver.satisfies(runtime, range, { includePrerelease: true })`，即**预发布参与匹配**；peer 里的 `workspace:*` 视为当前运行时；
4. 不满足的后果是：安装期拒绝，或启动期把该行**禁用**（`disabling profile plugin ...`），不是崩溃。

坑：用 npm/pnpm 的默认语义（不含预发布）会算出完全相反的结论。`^0.2.0-rc.2` 在默认语义下不匹配 `0.2.1-rc.2`，在宿主口径下匹配。**以宿主口径为准**，不要被 pnpm 的 peer 警告吓到。

## 3. 逐插件证据

### 3.1 `dsh-better-sidebar`（必须升）

- 0.25.0 的 `lib/index.js`：`inject = ["webServer","sessions","webRuntime","tools"]`，并且用 `ctx.webRuntime.trustedHosts` 做请求围栏。
- 0.2.1 移除了 `webRuntime` 服务，换成 `webStartup`（Web profile 的 `web-startup` 行提供）。旧插件因此永远等不到服务 → 侧栏整块不加载。
- 0.26.0 / 0.26.1 实测仍写 `webRuntime`（拉了 0.26.1 的 `lib/index.js` 验证），0.27 未发布。
- 0.28.0 的 `inject = ["webServer","sessions","connection","tools"]`，不再引用 `webRuntime`，也不再带那个空转的 `invariant` 伴生插件。
- 0.25.0 与 0.28.0 的 `PrefsSchema` 逐字段一致（连已废弃的 titleBar 兼容键都保留）→ 升级**不重置**侧栏偏好。
- 0.28.0 的 `cordis.patch.yml` 仍用行 id `better-sidebar`，`Config` 里仍有 `agentOpenTools` → 现有 user patch 继续生效。
- 附带证据：0.25.0 的 `TerminalLabels` 没有 0.2.1 新增的必填 `commandLine(line)`，即使宿主能加载，侧栏终端卡片也会在渲染时出错——进一步说明 0.25.0 不是 0.2.1 时代的构建。

### 3.2 `@quill507/dsh-auto-approval-llm`（建议升，风险低）

- 0.0.41 的 peer 范围 `>=0.2.0-rc.2 <2 || >=0.2.1-alpha.1 <2` 本身就包含 0.2.1-rc.2 → 不升也能过宿主校验。
- 0.0.41 → 0.0.43 的 `lib` 差异：新增 `systemone` 端点协议与分类器、新增唯一配置项 `endpointProtocol`（union，默认 `'openai'`），`index.js` 里**没有**宿主版本判断或 0.2.1 适配代码。
- 用户 patch 里 pin 的 8 个键（`enabled` / `timeoutAction` / `allowlist` / `denyList` / `humanOnlyList` / `maxConsecutiveDenials` / `maxTotalDenials` / `maxArgsChars` / `notifyUser`）在 0.0.43 中全部仍存在。
- 它对 `webRuntime` 是**可选读取**（`ctx.get('webRuntime')`），取不到退到 `--trusted-host` 再 fail-closed 到 loopback，因此即使留着旧版也不会崩。

### 3.3 `dshmarket`（建议升）

- 1.66.17 的 `lib/official-desktop.js` 直接调用 `manager.installBundle(spec)`，没有处理 0.2.1 新增的 `already-installed` 拒绝。
- 1.66.42 专门为这个分支加了处理（拒绝后先 remove 再 install），并新增 `host-recovery`（应对宿主启动失败时把 patch 改名的情况）。
- 声明范围一直兼容，所以不升也不会被宿主禁用，只是市场里的"更新官方插件"会失败。

### 3.4 `@linxin666/dsh-client-ui-skill-explorer`（建议升，非必须）

- 0.4.4 → 0.4.7 的差异集中在"插件提供的技能"：新增 `setProviderEnabled` 接口与"无本地 SKILL.md / 由插件提供"的展示文案。
- 0.4.4 的宿主侧不调用 `ctx.skills` 服务（自己扫描技能根目录），因此 0.2.1 对该服务的改动不影响它，只是看不到插件贡献的技能。
- 0.4.7 把 `engines.dsh` 提到 `>=0.2.1-rc.2`，属于"新能力依赖新宿主"，不是"旧版会坏"。

### 3.5 `@cerbur/clutch-dsh-worktree`（建议升，非必须）

- 0.1.18 发布于 2026-10-14（早于 0.2.1-rc.1），所以它不是专门为 rc.2 构建的；声明范围 `>=0.2.0-rc.1` 覆盖 0.2.1。
- 0.1.17 的导入符号在 0.2.1 中全部存在（含 `dsh-typert-protocol` 的 `Remote` / `TypertRemoteService`、`dsh-commands` 的 `CommandDefinitionId` 等）。
- 该包 0.1.18 的 tarball 未能完整下载（网络中断），因此**没有做逐文件 diff**，只验证了声明范围与导入符号。

### 3.6 两个"不动"的

- `@arcships/dsh-dim-oauth@0.2.1`：已是 npm 最新（2026-10-01）。导入 `PiAiAdapter` 并传 `{profiles, resolveApiKey, auth:{credentials, authContext}, resolveAttachments}`，这些选项在 0.2.1 的构造参数类型里仍然存在。它只提供 DimAgent OAuth 登录与一个 provider，**坏了也不影响其余 7 个 provider**。
- `dsh-client-auto-continue@0.14.2`：已是 npm 最新（2026-10-07）。宿主侧依赖会话 `turn/end` 事件与 `agents` / `sessions` / `settings` / `webServer` 等服务，这些在 0.2.1 中均存在。

## 4. 宿主侧与插件相关的变更（0.2.0-rc.2 → 0.2.1-rc.2）

| 变更 | 影响 | 依据 |
|---|---|---|
| `webRuntime` 服务移除，改 `webStartup` | 旧 better-sidebar 失效 | 0.2.1 Web profile 的 `web-startup` / `web-runtime` 行 |
| `@deepseek-ai/dsh-invariants` 包移除 | better-sidebar 的空转伴生插件失效（无功能影响）；0.28 已删除它 | 0.2.1 源码树中已无该包与服务注册 |
| 安装覆盖已装包（HMR 下）→ `already-installed` | 市场/UI/工具升级插件需先 remove | 0.2.1 的 plugin manager 与升级指南 |
| 启动失败时 `sanitizeProfile` 把 patch 改名 `.bak-<时间戳>` | 13.6KB 的自定义配置有被"换壳"风险 | 0.2.1 的 profile sanitize 实现 |
| 凭据优先级反转（存盘优先于环境变量） | 哪把 key 生效会变 | 0.2.1-alpha.2 升级指南 |
| `--host 0.0.0.0` 等通配地址被拒 | 若脚本里写过会启动失败 | 0.2.1-alpha.1 升级指南 |
| 会话格式仍为 v4 | 已有会话不受影响；风险在**降级**方向 | 两个版本的写入版本号一致 |
| 不兼容的插件在启动时被禁用而不是崩溃 | 失败表现是"某功能消失 + 日志一行" | 0.2.1 的启动兼容预检 |

## 5. 替代方案（备而不用）

### 自动审批

| 方案 | 版本 | 性质 | 备注 |
|---|---|---|---|
| 官方 `@deepseek-ai/dsh-experimental-auto-review` | `0.2.1-rc.2` | 官方实验特性，权限档名 `auto` | peer 精确 pin 到 `0.2.1-rc.2`，只能配这个宿主；**npm `latest` 是过期的 0.1.6-alpha.1，必须指定版本**；会消耗额外 token；与 `@quill507` 可共存但不要同时启用 |
| `dsh-auto-review` | 0.13.7 | 第三方，第二模型只读审查 | `engines.dsh >=0.2.1-0 <0.3.0`，是替代里最贴近 0.2.1 的 |
| `dsh-perm-gate` | 5.3.2 | 第三方，确定性 P0–P4 门控 | 不花 token，规则固定 |
| `dsh-permission-rules` | 0.7.20 | 第三方，YAML allow/deny/ask | 不花 token，规则可审计 |
| `dsh-approval-llm` | 0.1.8 | 第三方，模型审批 | 与现方案同思路 |
| `dsh-auto-approve` | 0.7.1 | 第三方，例行放行 | 干脆不声明 DSH 要求，等于不跟进兼容 |

### 侧栏

| 方案 | 版本 | 与 better-sidebar 的关系 |
|---|---|---|
| `@michengai/dsh-codex-ui` | 1.1.42 | Codex 风格重构侧栏 + 工作区树 + 搜索，交互模型不同，不是直接替换 |
| `dsh-sidebar` | 0.8.4 | 源码管理 + 文件树 + 预览 + 终端，功能相近但无插件 Tab 注册机制 |
| 官方右侧栏包组 | 0.2.1 | `sidebar-right` / `files` / `browser` / `terminal` / `documentpreview`，能力少一截 |

结论：**不换**。better-sidebar 0.28.0 已经兼容，换的成本远高于升级成本。

## 6. 未验证项（诚实清单）

1. **better-sidebar 0.28.0 的客户端 UI 未逐项验证**：只验证了 manifest、`inject`、`PrefsSchema`、patch 行 id 与配置键；完整包下载被网络截断。所以验收清单里把它列为阻断级，必须实机点一遍。
2. **clutch 0.1.18 未做代码 diff**：tarball 下载中断，只验证了声明范围与导入符号。
3. **dim-oauth / auto-continue 没有 0.2.1 实机证据**：两者都没有面向 0.2.1 的新版本，只能靠声明范围 + 导入符号推断。
4. **pnpm 版本差异**：PATH 上是 11.28.5，而 profile 元数据记录的是 12.5.1；升级时写入锁文件可能产生格式差异。已在回滚章节给出"按锁文件重装"的兜底。
5. **`dsh plugin add` 对已装包的行为**：CLI 路径（转发 pnpm）预期直接更新版本；若实际返回 `already-installed`，执行手册已给出 remove → add 的备用路径。

## 7. 调研来源

- npm registry：`dist-tags`、逐版本 `peerDependencies` / `engines` / 发布时间。
- unpkg 单文件读取：插件包内的 `package.json`、`cordis.patch.yml`、`lib/index.js`（用于比对 0.26.1 与 0.28.0 的 inject、确认 patch 行 id）。
- 本机只读检查：`~/.dsh/profiles/web`（package.json、pnpm-lock.yaml、pnpm-workspace.yaml、cordis.patch.yml、node_modules 内 7 个插件）、全局安装目录 `~/.nvm/versions/node/v22.23.1/lib/node_modules/@deepseek-ai/dsh`。
- 仓库源码（仅理解行为，不作为安装来源）：`apps/cli/src/plugin.ts`、`packages/boot/app-boot/src/plugin-compatibility.ts`、`packages/boot/app-boot/src/compatibility-preflight.ts`、`packages/boot/app-boot/src/profile-sanitize.ts`、`packages/boot/plugin-manager/src/operations.ts`、`packages/llm/llm-pi-ai/src/config.ts`、`packages/interaction/permission-presets/src/index.ts`。
- 插件目录（生态清单）：`dsh-plugin-catalog`（用于对照当前主流版本与替代品热度）。

## 8. 为什么不用仓库这条路

- 仓库是**源码树**，跑 `pnpm dsh` 走的是 tsx / 源码启动，和全局安装的产物不是同一套解析路径。
- 用 `link:` 或 `--patch` 指向仓库，会让 profile 依赖一个可能随时改动的目录，升级后不可复现。
- 全局安装的升级路径只有一条：`npm i -g` + `dsh plugin`。仓库恰好也是 0.2.1-rc.2，只是便于理解行为，**不是安装来源**。
