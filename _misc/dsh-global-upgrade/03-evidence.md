# 证据附录

本文件说明"为什么是这些版本、这个顺序"。执行时不需要读它；想质疑某个决定时再查。

**调研日期**：2026-10-25。**调研方式**：只读。npm registry 元数据、本机安装目录与 profile 目录、本仓库 `dsh-v0.2.1-rc.2..dsh-v0.2.1-rc.3` 的 tag diff；仓库源码仅用于理解行为，**任何升级动作都不依赖仓库**。

---

## 1. 版本矩阵

| 包 | 本机版本 | npm 最新 | 目标 | 目标版本发布时间 | 声明要求（对 0.2.1-rc.3） |
| --- | --- | --- | --- | --- | --- |
| `@deepseek-ai/dsh` | 0.2.1-rc.2 | 0.2.1-rc.2（`latest`） | **0.2.1-rc.3**（`next`） | 2026-10-23 | — |
| `dshmarket` | 1.66.42 | 1.70.2 | **1.70.2** | 2026-10-24 | `dsh-settings` 含 `^0.2.1-rc.1`（兼容） |
| `dsh-better-sidebar` | 0.28.0 | 0.28.0 | 不动（已是最新） | 2026-10-17 | `^0.2.1-rc.1` ×13（兼容） |
| `@quill507/dsh-auto-approval-llm` | 0.0.43 | 0.0.43 | 不动（已是最新） | 2026-10-18 | `>=0.2.1-rc.2 <2`（兼容） |
| `@cerbur/clutch-dsh-worktree` | 0.1.18 | 0.1.18 | 不动（已是最新） | 2026-10-14 | `>=0.2.0-rc.1`（兼容） |
| `@arcships/dsh-dim-oauth` | 0.2.1 | 0.2.1 | 不动（已是最新） | 2026-10-01 | `>=0.1.1-rc.2`（兼容） |
| `@linxin666/dsh-client-ui-skill-explorer` | 0.4.7 | 0.4.8 | 可选 0.4.8 | 2026-10-20 | `engines.dsh >=0.2.1-rc.2`（兼容） |
| `dsh-client-auto-continue` | 0.15.0 | 0.17.0 | 可选 0.17.0 | 2026-10-23 | `dsh-settings` 含 `^0.2.0-rc.1`（兼容） |

`@deepseek-ai/dsh` 的 dist-tags：`latest` = 0.2.1-rc.2、`next` = 0.2.1-rc.3、`alpha` = 0.2.1-alpha.5。**`latest` 落后于 `next`**，所以无 tag 的 `npm i -g` 等于没升。rc.3 未被标记 deprecated，tarball 可下载（25,130 字节元包，`dependencies` 里 86 个包，`dsh-base` 与 `dsh-web-app` 均指向 0.2.1-rc.3）。

## 2. 宿主判定口径

安装与启动都会读插件清单判断兼容性，规则自 0.2.1 线起未变（`packages/boot/app-boot/src/compatibility-preflight.ts` 在 rc.2→rc.3 之间 **零 diff**）：

1. 有 `engines.dsh` 时**只看它**，忽略 `@deepseek-ai/dsh*` 的 peer；
2. 没有 `engines.dsh` 时，逐个检查 `@deepseek-ai/dsh` 与 `@deepseek-ai/dsh-*` 的 peer 范围；
3. 比较用 `semver.satisfies(runtime, range, { includePrerelease: true })`，即**预发布参与匹配**；peer 里的 `workspace:*` 视为当前运行时；
4. 不满足的后果是：安装期拒绝，或启动期把该行**禁用**（`disabling profile plugin ...`），不是崩溃。

坑：用 npm/pnpm 的默认语义（不含预发布）会算出相反的结论。`^0.2.1-rc.1` 在默认语义下不匹配 `0.2.1-rc.3`，在宿主口径下匹配。**以宿主口径为准**。

本次按该口径对 7 个已装插件的 `package.json` 实跑了一遍（`runtime = "0.2.1-rc.3"`），结果全 PASS：

```text
PASS  dsh-better-sidebar@0.28.0                        [engines 无 / peers:13]
PASS  @quill507/dsh-auto-approval-llm@0.0.43           [peers:5]
PASS  dshmarket@1.66.42                                [peers:1]
PASS  @linxin666/dsh-client-ui-skill-explorer@0.4.7    [engines.dsh >=0.2.1-rc.2]
PASS  @cerbur/clutch-dsh-worktree@0.1.18               [peers:21]
PASS  @arcships/dsh-dim-oauth@0.2.1                    [peers:10]
PASS  dsh-client-auto-continue@0.15.0                  [peers:1]
```

## 3. rc.3 相对 rc.2 改了什么（宿主侧）

`dsh-v0.2.1-rc.2..dsh-v0.2.1-rc.3` 只有 6 个提交：4 个内容提交 + 1 个 release 提交 + 1 个 release merge。640 个文件里 349 个是 `package.json` 版本位。

| 提交 | 内容 | 插件面 |
| --- | --- | --- |
| #6247 导航入口自定义 | 新包 `packages/client/ui-entry-customization`（343 包）；`ui-sidebar` / `ui-sidebar-right` / `ui-conversation` 各新增一个 root slot 列表；`Menu` 新增 `current` 与 `minWidthFromAnchor` | 纯加法，无删除 |
| #6944 官方 `/models` listing | listing 从 `llm-deepseek-account` 搬进共享 transport `llm-deepseek`；api-key 路线跟随 `GET https://api.deepseek.com/models` | `llm-pi-ai` **只有版本位改动**，provider patch 生效方式不变 |
| #6600 客户端产品分析 | 3 个 client 侧分析事件 | 无 |
| #6883 侧栏 pin 与选中分离 | 官方侧栏菜单图标、`guide-pins`、`panel-pins` | 官方侧栏内部 |

**与插件判定直接相关的结论**（逐条核过）：

- `git diff rc.2 rc.3 -- packages/boot/` = 只有 6 个 `package.json` 版本位；`packages/boot/app-boot/src/` **完全无 diff**。判定逻辑、preflight、profile sanitize 全没动。
- 客户端 `ui-primitives`：`Tooltip.tsx` 改了落位算法（导出 `TooltipSide` 类型搬家到新文件 `tooltip-placement.ts`），**外部 props 未增未删**；`Menu.tsx` 只新增两个可选 prop；`icons/index.tsx` 新增 2 个图标。**没有删除任何导出符号**。
- 三个新 slot 都是新增 key：`sidebar.panellist.actions`、`conversation.session.header.views.actions`、`sidebar.right.tab.guide.actions`。`ui-conversation` 的 hooks 里 `conversationViews` 保留并**新增** `entryPins` / `entryActions`；`sidebar.panellist` 的 owner props 不变。
- `SESSION_FORMAT_VERSION` 仍 4，`ctx` 服务仍 99（58 core + 35 seam + 5 service + 1 bundle）——与 rc.2 逐项相同。
- `packages/api/session-controller` 只有 1 行注释级改动；`packages/client/ui-workspace` 的 `startSession` 把 `clearPreviousDraft` 演进为 `whenDraftExists`（旧字段作为回退保留），`connectWorkspace` / `startSession` 的签名未破。

## 4. 逐插件证据

### 4.1 `dsh-better-sidebar@0.28.0`（不动，但是本次主要风险点）

- 已是 npm 最新：`latest` = 0.28.0，`alpha` = 0.28.0-alpha.0，`beta` 停在 0.12.0-beta.1。**没有 0.2.1-rc.3 时代的版本可升。**
- 发布 2026-10-17，早于 rc.3（10-23），所以它没有针对 rc.3 构建。兼容性靠声明与符号核对：
  - 13 条 peer（`dsh-client-ui-conversation` / `ui-primitives` / `ui-sidebar-right` / `ui-slots` / `dsh-settings` / `dsh-session` / …）全部是 `^0.2.1-rc.1`，rc.3 满足。
  - 实际从 `ui-primitives` 取的只有 `MarkdownText`、`type IconProps`、`type StateDotState`，三者 rc.3 全在；`Tooltip` / `Menu` 是它自己的实现（`client.js` 里自带 `TooltipHost` / `TooltipView` 等），不依赖宿主的 `Tooltip`。
  - 它只注册 `settings.section` 一个 slot，**没有**引用 rc.3 改动的 `conversationViews` / `entryPins` hooks，也没有注册三个新增 slot 名。
  - `engines` 只有 `node: >=20`，没有 `engines.dsh`，因此走 peer 判定。
- 未验证项：完整客户端 UI 未逐项点验。rc.3 改过 `ui-primitives` 的 `Menu` 与 `Tooltip` 落位——**这是本次唯一需要实机确认的地方**，验收清单 E2 把它列为阻断级。

### 4.2 `dshmarket@1.70.2`（本次升级目标）

- 1.66.42 → 1.70.2 之间隔了 12 个版本（1.66.43…1.66.47、1.67、1.68、1.69、1.70.x），期间官方持续修安装/更新路径。
- peer 只有一条实质约束：`@deepseek-ai/dsh-settings`，范围含 `^0.2.1-rc.1` → rc.3 满足。无 `engines.dsh`。
- 发布 2026-10-24，早于调研时刻 16.7 小时。`minimumReleaseAge` 本身未启用（`pnpm config get minimumReleaseAge` → `undefined`），所以不构成阻断；`pnpm-workspace.yaml` 里那个 `minimumReleaseAgeExclude` 是历史遗留，按执行手册 2.1 的规则预防性补版本即可。
- 为什么必升：它是"装/升插件"的那个组件。1.66.17 在 0.2.1 线上"更新官方插件"会报 `already-installed`，1.66.42 修了那一处；再往上还有 `host-recovery`（宿主启动失败后 patch 被改名时的恢复）。留在 1.66.42 会让你在 rc.3 上用市场做的每一次写操作都可能踩到已知问题。

### 4.3 两个"可选升级"

- `@linxin666/dsh-client-ui-skill-explorer` 0.4.7 → 0.4.8（10-20）：声明 `engines.dsh >=0.2.1-rc.2`，两版相同。它注册 `sidebar.panellist`（owner props 未变）、`workspace.isolated`、`workspace.isolatedHint`——rc.3 没有改这些 slot 的 owner props。
- `dsh-client-auto-continue` 0.15.0 → 0.17.0（10-23）：peer 与 0.15.0 **逐字相同**，只约束 `dsh-settings` 的 `^0.2.0-rc.1` 等。注册 `conversation.input.left` 与 `settings.plugin.item`——两者 rc.3 均未触及。

两者都不是必需升级，失败也不该阻断本次。

### 4.4 三个"不动且无新版"

- `@quill507/dsh-auto-approval-llm@0.0.43`：`latest` 即 0.0.43。它注册的 `settings.advanced.*` 等文案 key 与 `conversation.input.left` 在 rc.3 未变。用户 patch 里 pin 的 9 个配置键仍然有效。
- `@cerbur/clutch-dsh-worktree@0.1.18`：`latest` 即 0.1.18，peer 21 条全部通过。它调 `ctx.uiWorkspace.startSession(workspaceId)`（不传 options），rc.3 的 `clearPreviousDraft` → `whenDraftExists` 演进对它是无感的（无 options 时行为等价）。
- `@arcships/dsh-dim-oauth@0.2.1`：`latest` 即 0.2.1。当前 `cordis.patch.yml` 的 `agent-default-model` 正指向它的 `deepseek-v4.1-flash`，所以它一旦失败会直接影响默认模型——处理办法是改 patch 的 `agent-default-model` 行，而不是卸载插件。

## 5. 本机现状快照（2026-10-25）

- `dsh --version` = `0.2.1-rc.2`；`which dsh` = `/Users/bowhead/.nvm/versions/node/v22.23.1/bin/dsh`；`node -v` = `v22.23.1`；`pnpm -v` = `11.28.5`。
- profile 目录 `~/.dsh/profiles/web`：`cordis.patch.yml` 13,641 B / `0584e3be…`，`package.json` 762 B / `f450fc26…`，`pnpm-lock.yaml` 51,332 B / `1a493801…`（`lockfileVersion: '9.0'`），`pnpm-workspace.yaml` 424 B / `3731ceb4…`。
- `node_modules/.modules.yaml` 记录 `packageManager: pnpm@12.5.1`、`nodeLinker: hoisted`、store 在 `~/Library/pnpm/store/v11`；而 PATH 上的 pnpm 是 11.28.5。11.x 读得懂 lockfile 9.0，正常升级不触发差异；这就是执行手册里"不要手工改锁文件"的来源。
- 正在运行的 `dsh web` 是 `node .../bin/dsh web --no-open`（同一时间端口上还混有 WebKit 辅助进程与别的 dsh 源码实例），**必须按 PID 精确停**。
- `cordis.patch.yml` 相对 10-19 的备份只差一处：`agent-default-model` 从 `yovole / DeepSeek-V4-Flash` 改为 `dimagent-oauth / deepseek-v4.1-flash`。

## 6. 未验证项（诚实清单）

1. **better-sidebar 0.28.0 的客户端 UI 在 rc.3 上未实机验证**：只核了 manifest、`inject`、导入符号、slot 注册与三个新增 slot 的 owner props。因此验收清单把它列为阻断级。
2. **`dshmarket@1.70.2` 的写操作未验证**：1.66.42→1.70.2 之间 12 个版本的逐条 changelog 未逐字读，只验了 peer 与发布时间。所以第一轮验收禁止点市场的更新/安装。
3. **`minimumReleaseAgeExclude` 的选择器语义**按 pnpm 文档理解（`name@v1 || v2` 的后续片段沿用同一包名）。执行手册 2.1 给的是"整份重写成含新版本的选择器"，即使语义判断有偏差也只是把该包的所有版本都排除，不会误伤其它包。
4. **`whenDraftExists` 未在任何插件上实测**：只核了它是 `clearPreviousDraft` 的替代且旧字段保留，且没有插件传这两个字段。
5. **pnpm 11.28.5 对现有 lockfile 9.0 的写入行为**未实测（上次升级是 10-19、同一个 pnpm，锁文件已被它写过一次，所以大概率无碍）。

## 7. 调研来源

- npm registry：`dist-tags`、逐版本 `peerDependencies` / `engines` / 发布时间、`deprecated`、`dist.tarball`。
- 本机只读检查：`~/.dsh/profiles/web`（四个元数据文件、`node_modules/.modules.yaml`、7 个插件的 `package.json` 与 `lib/`）、全局安装目录 `~/.nvm/versions/node/v22.23.1/lib/node_modules/@deepseek-ai/dsh`、`~/.dsh/backups/`。
- 仓库源码（仅理解行为，不作为安装来源）：`git diff dsh-v0.2.1-rc.2 dsh-v0.2.1-rc.3` 全量；重点 `packages/boot/app-boot/src/compatibility-preflight.ts`、`packages/boot/plugin-manager/src/{index,types}.ts`、`packages/client/ui-primitives/src/{Tooltip,Menu}.tsx`、`packages/client/ui-{sidebar,sidebar-right,conversation,workspace}/src/client/contract/slots.ts`、`packages/client/ui-workspace/src/client/navigation.ts`、`packages/llm/llm-pi-ai/`。
- 相邻语料：`../_digested/_change_log/0012-0.2.1-rc.2-to-0.2.1-rc.3.md`（rc.3 的完整变更清单）与该目录的 `00-index.md`（同步口径）。

## 8. 为什么不用仓库这条路

- 仓库是**源码树**，跑 `pnpm dsh` 走的是 tsx / 源码启动，和全局安装的产物不是同一套解析路径。
- 用 `link:` 或 `--patch` 指向仓库，会让 profile 依赖一个可能随时改动的目录，升级后不可复现。
- 全局安装的升级路径只有一条：`npm i -g` + `dsh plugin`。仓库恰好也是 rc.3，只是便于理解行为，**不是安装来源**。
