# 0008 独立复核：四个语料目录 vs 产品源码

复核日期：2026-09-24。产品基线：`46a7f68b0922371ce7144b668b90e377d8e799f4`（`dsh-v0.1.7-rc.1`）。先验证整树照搬成立：`git diff dsh-v0.1.7-rc.1 HEAD` 仅含四个语料目录与 `scripts/translation-pairing.manifest.json` 一行，产品源码与 tag 逐字节一致。

本页是对 [`0008-0.1.5-rc.2-to-0.1.7-rc.1.md`](./0008-0.1.5-rc.2-to-0.1.7-rc.1.md) 所述语料更新的**独立反查**（五个并行审计 + 独立抽查），不替代该记录。全部证据为工作树实读（文件:行），未采信记录自述。结论按五级组织：**重写**（机制描述已退役，需整段重写）、**点改**（计数/名称/行锚错）、**缺落点**（新源码面语料无内容）、**删除**（孤儿页）、**口径**（索引/矩阵/记录自相矛盾）。

前置事实：三个语料 `verify.mjs` 在复核时全绿（`_digested` 85 MD / `_faq_on_digested` 106 MD / `_agent_ready_development` 32 MD）。即现有门禁（UTF-8、换行、相对链接、锚点、基线常量、外链钉版）**不覆盖内容新鲜度**——下述全部问题存在于绿门禁之下。

## 总体结论

0008 的更新在「有明确 path:line 引用的地方」质量高：session 格式 v4 全链（01/04 两页几乎逐条核实为真）、FAQ 08 硬数字重测（89 = 54 core + 33 seam + 1 service + 1 bundle、45.5%，与生成表逐项吻合）、FAQ 12 的 no-store 退役改写、外链 re-pin 与锚点核对，都是扎实的。但反查确认约 **60 处过期断言、20 处新面缺落点、3 个孤儿页、10 处口径矛盾**，集中在 0008 自己已登记却未改完的三处（桌面端口、Remote stream、settings-card 机制）与它没看过的四类盲区（packages 内机制断言、新组合行、experimental 边界反转、历史维护记录）。

## 为什么 0008 会漏（过程层）

1. **反向审计只对 `docs/`/`scripts/` 的 path:line 引用求交**。packages 源码里的机制断言（不以引用形式出现）没有等价扫描，于是 capability-seams/04 的 Remote「仅 unary」、system/01 的 `installSection` 这类**纯正文断言**全部漏网——0008 自己都把这两条判为 INVALID，却只改了 surfaces 侧。
2. **「A 类有落点」判定过宽**。web-app 组合新行（3 个 controller + 8 个 ui-* 包）、`workspace/changes` 事件族被记为「本批已改/有落点」，实际语料正文零命中（见下文证据）。
3. **B 类缺口登记只落在 change log**，没有落到 `_coverage/00-index.md` 的「已知未覆盖」表。ssh / browser-use / computer-use / voice-input 四项在记录里"登记为缺口"，在唯一有长期效力的 coverage 表里不存在。
4. **`_architecture_referenced` 被排除在审计外**（0008 记录写「对三个语料的影响」），而 `_digested/00-index.md:5`、`_change_log/00-index.md:28`、0008 记录 :9 自己都说维护**四个**目录。
5. **历史条目被机械替换破坏**。`_agent_ready_development/_coverage/00-corpus-maintenance.md` 的 re-pin 编辑做了全局 hash 替换（`fb2c4b9e69` → `46a7f68b09`），把 2026-09-16 历史条目里的基线 hash 也改掉了（:3 头部与 :97 条目现在把 `46a7f68b09` 标成 `dsh-v0.1.5-rc.2`；git tag 证实 `dsh-v0.1.5-rc.2` = `fb2c4b9e69`）。历史读数保留的惯例被这次替换违反。
6. **孤儿页从未清理**。0006 时「没有文件被删除」被当作正面指标记录，实际留下三页互引孤儿链（见 _digested D 节）。
7. **矩阵「已核验」没有降级通道**。surfaces/03:3 页内写着「surfaces 深读将复核这一面」，矩阵同一轮把 surfaces 行写回「已核验 @ 46a7f68b09」。

## _digested

### A. 重写级（机制描述已退役，当前在讲不存在的实现）

| # | 位置 | 现状断言 | 源码事实 |
|---|------|----------|----------|
| A1 | `surfaces/03-桌面入口.md` 全篇 + `runtime-profiles/06-desktop.md` 全篇 | 无监听端口、`dsh-app://` + 分帧字节管道、`apps/desktop-host/src/wire.ts` 协议常量、`DESKTOP_TRANSPORT_SCRIPT` 注入、`desktop.cordis.patch.yml` 覆盖层（关掉 webserver）、`desktop 自己不调 runProfile`、`DESKTOP_PROFILE_BUNDLES` seed | 仓库已无 `wire.ts`、`config/desktop.cordis.patch.yml`（0008 记录自己也说找新落点）。现行 `apps/desktop-host/src/index.ts`：`loadProfileDirectory` + **`runProfile({ profile:'desktop', args:['--no-open','--port','19387'] })`**（:23-28），`packageManager` 用 Electron-as-Node（:29-39），boot 后 `ctx.connection.authenticatedUrl(http://127.0.0.1:${ctx.webServer.port})` 经 IPC 报给壳并附 `collectIndexInjections()`（:81-82）。`docs/architecture.md:55`："Desktop defaults to port `19387`"。壳侧 `host-process.ts` stdio 由 6-fd 变 4-fd；`rejectElectronProfile` 现于 `apps/cli/src/args.ts:83`；`project-manager.ts` 已无 `DESKTOP_PROFILE_BUNDLES`。0008 记录 :48 自己把「无监听端口」判为 INVALID（Desktop 默认端口 19387），修复从未落到任何页面——本轮 grep `19387` 在三语料正文零命中 |
| A2 | `composition/03-user-patch-hmr.md` 全篇 + `composition/01-boot-时序.md:16/:19/:29` + `composition/00-map.md:101` + `runtime-profiles/00-map.md:101`、`01-web.md:70` | `composeLive` 夹住用户层、`watchUserPatches`、`patchReload`、`hmr/config-update-failed` 事件、`healProfilesModuleFallback`、`hmr.registerConfig()` | 四个符号全仓零匹配。现行：`packages/boot/hmr/` 服务监视 profile patchPath + home patch + profile `package.json`（`boot/hmr/src/index.ts:222-246`），经 `reconcileProfilePatches`（`app-boot/src/index.ts:271-302`）调和，新失败抛错、回滚，发 `app-boot/config-reload`；API 为 `watchConfig`（:160）；就绪前置 `appReady`。heal 被 runtime-resolution 拦截层取代（`profile.ts:104-137`）。结构结论仍对（web 是唯一 launcher 带 hmr：base 行 `disabled: !!js "!ctx.get('profileContext')"` :25-31，headless/sdk-app/acp-app 显式 disable） |
| A3 | `cordis-runtime/04-vendor-本地修改.md:17-21/:34/:46-55` + `00-map.md:39`、`03-loader-include-与js插值.md:69` | vendor 4.0.2、19 条本地修改、第 8 条=Include 事务（候选失败恢复上一份）、第 12 条=Include 串行队列 | vendor/cordis = **4.0.4**（loader 1.0.5 / include 1.0.9 / timer 1.1.6 / hmr 1.0.19…），`vendor/README.md` 本地修改 **22 条**（:33-57）；第 8 条现为 "resilient file refresh and patch reactivation (#514)"，并明写 Loader entry/group/tree 变更为 **eager、非事务**、不回滚；事务 mod 已退役、编号被复用；Include 队列内容移到第 9 条、防抖持久写为第 14 条；新增 mod #16/#20/#21/#22 未登记 |
| A4 | `experimental/00-map.md:7/:11/:39` + `02-agent-teams.md:19-32` | 「private by default with explicit public exceptions」（AGENTS.md:48）、「五个 public 例外…另外四包不发布」、「九包」 | 根 `AGENTS.md:67` 已反转为 **"public by default with explicit private exceptions"**；`scripts/experimental-package-policy.ts:2` 的 private 名单为空数组；`packages/experimental/README.md:12` "All current packages publish"；现 **20 包**（agent-team×5、ptc-runtime-python、inspector、webworker×2、auto-review、browser-use×4、computer-use×2、voice-input×5）。「落点核验」（bundle 内无 experimental 引用）仍成立，但整段边界叙事方向相反；02 页内 agent-team-web-profile 段无退役注记（00-map:39 有） |
| A5 | `system/01-扩展表非显然落点.md:19` | Host 半边 `installSection(owner, ns, schema, entry, hooks)`、浏览器半边 `settings.plugin.item` | 两者全仓零命中；现行 `SettingsForms` live configuration forms（`packages/settings/settings/src/index.ts:223`）+ slot `settings.plugins.tab`（`cordis-client-runner/src/client/slot-catalog.ts:2595`）。0008 记录 :48 判 INVALID 后只改了 `surfaces/00-map:29`，system/01 漏改 |
| A6 | `capability-seams/04-新增seam与Remote.md:40/:54/:56` + `surfaces/06-Typert类型图与Remote生成.md:64` | Remote 面「仅 unary」、15 个 namespace、`$mount` 清单 `client/index.ts:153-158` | `packages/typert/protocol/src/types.ts:83-106` 定义 stream 方法与 `RemoteStreamHandle`；gateway 新增 **uplink**（`ctx.invocation.uplink`、`gateway/uplink-overflow`，`gateway/src/index.ts:101-148`，`docs/api-gateway.md:5/:58/:161`）；`packages/api/remotes/src/client/index.ts:181-184` 现 mount **22** 个贡献（新增 account / pluginManager / permissionPresets / job / terminal / officeToPdf 等）。0008 已把「仅 unary」判 INVALID，两个页面都未改 |

### B. 点改级（当前事实错，一句话到一行）

_session-and-loop / agent-loop：_

- `00-map.md:45`：`SESSION_FORMAT_VERSION`「当前为 3」→ 4（`packages/core/session/src/types.ts:89`；01/04 两页已写 4，唯独 map 漏）。
- `00-map.md:89`：「四个世代」→ 五个（v0–v4；04 页表格即五世代）。
- `00-map.md:86`、`01-session-event-map.md:5`：「四类 surface 事件」→ 五类（+`developer/message`，`types.ts:439-445`；两页正文均已写五类，唯引言行漏）。
- `03-换loop的半径.md:36`：「满足当前世代的规范信封：四类 surface（…）必需 surfaceOp」→ 五类含 `developer/message`（`core/session/src/index.ts:320-331` role map 含 developer）。
- `03-换loop的半径.md:35`：读 API `eventAt`/`snapshotEvents`/`seq` 行号漂移，且三者已 **@deprecated**（`core/session/src/index.ts:628/:641/:660`；新 note `2026-09-09-deprecate-synchronous-session-event-reads.md`）——「当前」表述需加弃用状态。
- `02-inbox-与turn-时序.md:31`、`01:76`：`source.plugin` → v4 改名 `source.kind`（`message.ts:108-115`；runtime-context 现写 `kind: 'runtime-context'`，`runtime-context.ts:159-161`）。
- `01:44`：「developer/message 不进入模型请求」→ 它以 `developer` role 进入 `deriveMessages`，不能表达的 provider 显式拒绝（`llm-deepseek/src/serialize.ts:90`、`llm-pi-ai/src/context.ts:53`）。
- **`agent/session-start` 事件已不存在** → session-start 边现为串行 `agent/created { agent, source: SessionStartSource('startup'|'resume'|'clear'|'compact'), signal? }`，由 `AgentRegistry.announce()` 发（`agent/src/index.ts:537-559`）。过期点：`session-and-loop/03:13/:22`、`00-map:65`、`agent-loop/01:112`、`agent-loop/03:84/:101`、图 `agent-loop/figures/restart-rearm.svg:39`、`loop-driver-channels.svg:50`，以及 scope 外的 `capability-seams/08:59`、`experimental/02:11`。

_system：_

- `03-门禁与性能基准.md:11`：「CI mode 有七个」→ 17 个（`scripts/run-gates.ts:23-41` 与 :159 报错文案：12 个 `ci-*` + node-compat + check-all + hygiene + doc-sync + doc-quick）。
- `03:34`：bench「五条路径」→ 六条（+`benchmarks/terminal-io/`）。

_surfaces / runtime-profiles：_

- `surfaces/01:39`：转发白名单「19 条、唯一新增 goal/activation-changed」→ 23 条（`packages/api/remotes/src/remote-events.ts:18-42`；其后新增 plugin-manager/changed|install-log|install-state、cordis/inspect-query(-resolved)、agent-preset/selected、commands/change、credentials/reference-updated、permission-presets/catalog-changed）。
- `surfaces/05:3`：「51 个包目录」→ **59**；`ui-permission` 包改名 `@deepseek-ai/dsh-client-ui-permission-presets`（web-app patch :370，行 id 未变）。
- `runtime-profiles/02-headless.md:37`：`ptc-runtime` 被列在 headless insert 表——该行实为 base 行（`packages/bundle/base/cordis.patch.yml:389-390`）；headless insert 只有 startup/runner。
- `runtime-profiles/01-web.md:16`：`rejectParentOptions` 已不存在（`apps/cli/src/args.ts` 零命中；positional 直通在 :202-206）；`dsh web` alias 仍成立（:92）。
- `composition/00-map.md:49`：「显示名来自 preset.yml 的 name 字段，不是 locale 映射」→ 方向反转：shipped 声明是 `presets/{standard,ptc,minimal}.patch.yml` 且**不发 name**，显示文案走 locale 键 `presetStandardName/…`（`agent-preset-registry/src/display.ts:10-17/:41-46`）。
- `composition/04`：「初始 patchReload（只有 web 是 live）」列 → patchReload 机制整体移除，模板现为 bundle-only（`profile.ts:158-176`）。
- `tools-prompt-llm/05:41`：「由 0 变成 3（types.ts:88）」→ 4（:89）。
- `harness-idea/05:19` vs `:21`：同页自相矛盾——:19「只注册两个只读名字」对，:21「三个只读工具…cordis_inspect_self…」错（源码仅 `cordis_inspect_list`/`cordis_inspect_query`，`tool-cordis/src/index.ts:23/:42`；self 只残留在 slot-catalog 帮助文案与 UI 测试的旧 key 清单）。
- `capability-seams/02:35`：「真正创建进程（本地或 E2B）」→ 本地或远程（`subprocess-ssh`；`packages/e2b` 已不存在）。
- `capability-seams/03:3/:20`：`packages/preset/agent-presets/presets/*/agent.cordis.yml` 已删；同事实现落 `packages/bundle/web-app/presets/cordis.patch.yml:95/:101/:108/:116`（并新增 `maxDepth: provider-managed`）。
- `capability-seams/06:22`：「桌面宿主不走这条路……代理对 desktop 不生效」+「runProfile 唯一调用者是 apps/cli/src/bin.ts:34」→ 反转：desktop-host 现也调 `runProfile`（其 :6/:23），而 runProfile 无条件安装代理（`apps/cli/src/profile-boot.ts:242/:247`）；`runtime-profiles/06:89-93` 的整节「偏差」随之失效（归入 A1 重写）。
- `capability-seams/08:7/:23` vs 同页 `:69`：正文「只桥 tools、不桥 resources」与注记「ctx.mcpResources seam」矛盾——现边界是 mcp-client 只桥 tools，`mcp-resources` 包桥 resources（`packages/mcp/mcp-resources/src/index.ts:16/:56`），prompts 仍未桥。
- 行号漂移簇（结论仍真、锚点需重钉，约 40 处）：`surfaces/01`（history/index/types/transport/session 六处）、`surfaces/06`（gateway definition-unavailable :748、signature-invalid :352/:387/:794、endpoint :315-317）、`runtime-profiles`（`PROFILE_TEMPLATES` 现 `profile.ts:158-175`、`loadProfileDirectory` :642-684、`loadProfile` :696-707、`INSTALLATION_OWNED_PROFILE_TUPLES` :177-179、`normalizeShippedProfile` :566-588、sdk-minimal :173-176）、`tools-prompt-llm/00-map:18`（exemption 注释现 :1165）、`tools-prompt-llm/02:37`（ptc.ts 五锚）、system-prompt/agent-loop/persistence/args.ts/dump-config 等簇（明细见审计底稿）。

### C. 新面缺落点（源码有、语料零机制内容）

1. **ssh 远程执行族**（0008 挂账①「真遗漏」）：`packages/ssh/{ssh,fs-ssh,subprocess-ssh,sandbox-ssh}`——`ctx.ssh` 单连接多 provider；fs-ssh→`ctx.fs`、subprocess-ssh→`ctx.subprocess`、sandbox-ssh→`ctx.sandbox` 的远程文件效应遏制。语料仅 `capability-seams/00-map:33`、`01:53` 两行指针。入口：`docs/subsystems/ssh.md`、note `2026-09-11-posix-ssh-runtime`。**这是最明确的「目录少了」候选：capability-seams 应补一页（如 09-ssh 远程执行族），或在 coverage「已知未覆盖」表正式登记。**
2. **experimental 新原型家族**：browser-use（runtime + stagehand-native/chrome-devtools-mcp/playwright-mcp 三 driver，`ctx.browserUse` 的 provider）、computer-use（cua-driver-mcp/native，`ctx.computerUse`）、voice-input 五包（`ctx.speechToText`）、auto-review——00-map 仅名字带过，「三个面」结构差 11 包。
3. **web-app 组合新行与 Web 浏览器认证**（0008 记为 A 类「有落点」，实际除 change log 外零命中）：insert 段实为 **22 行**（语料称 18；新增 `job-controller`/`terminal-controller`/`account-controller`/`ui-settings-account`/`cordis-inspect-providers`），browser roster 实为 **54 行**（语料称 44+1；新增 `ui-sidebar-browser`（desktop-only）/`ui-sidebar-terminal`/`ui-plugin-manager`/`ui-settings-shell`/`ui-settings-agent-loop`/`ui-settings-subagent`/`ui-settings-web-search`），另有 host 行 `office-to-pdf`(:244)、`workspace-changes`(:314)。认证面：`packages/client/connection/src/browser-auth.ts`（process-token URL、`dsh-auth-` HMAC cookie、credential 持久 secret、401 语义）+ URL 行 `dsh web: ${authenticatedUrl} (LAN: …)`（`web-app/src/index.ts:273-279`）——surfaces/runtime-profiles 全目录 grep 认证/token/cookie 零命中。
4. **六个新 seam**：`ctx.browserUse`/`ctx.computerUse`/`ctx.deepseekAccount`/`ctx.speechToText`/`ctx.ptcRuntime`/`ctx.mcpResources`（`docs/capability-seams.md:573-575/:606`）——除 mcpResources（08 有注记）、ptcRuntime（00-map:85 指针）外零机制内容。
5. **`workspace/changes` 与 `image/offload` 事件族**：仅 `session-and-loop/01:48` 名字带过；0008 记录 :89「本批已改 composition/runtime-profiles」对事件族不成立。
6. **plugin-manager typed refusals**（#5061：`incompatible-version` ManagementFailure、豁免 API、list/set_version_exemption/acceptRisk）+ `packages/boot/config-editor`（profile patch 校验后写）——composition/00-map 源码入口与 04 均未提。
7. **tool-fs 升权审批扩面**：`packages/fs/tool-fs/src/sandbox.ts:16/:45/:89`（与 tool-bash 共用一次性升权链，`sandbox/…/escalation.ts` 明言 shared by every sandbox-enforcing tool family）——`capability-seams/02` 政策表只写 tool-bash。
8. **Web 工具卡 preparing 阶段**（#5053）：`ui-chat/…/tool.ts:41-49` phase 'preparing' 先于 tool/call——`tools-prompt-llm/02:64` 提到 live-chunk 但无 preparing。
9. **`--dump-config-schema`** 第三种 dump 模式（`args.ts:120/:172`）——composition/02 只写两种。
10. **OPTIONAL_BUNDLES / 安装期自有元组**（`profile.ts:178-190`；experimental-voice-input-bundle、experimental-agent-team-profile 为可选 bundle）——composition 侧未落。

### D. 孤儿页（删或并）

1. `surfaces/03-客户端资源与侧栏.md`（69 行）——全语料零引用；内容被 `surfaces/04-客户端资源模型与右栏.md`（121 行、0008 已按 `docs/subsystems` 重校）覆盖。建议删除；`_coverage/00-index.md:45`「由 surfaces/03、04 承载」同步改为仅 04（0008 记录 :73 的"surfaces/03"也因此无法区分两个 03 页）。
2. `capability-seams/05-进程遏制与宿主边界.md`——不在 00-map 页表（map 挂的是 05-subagent-catalog），仅被 `system/03:28` 引用；三节内容分别被 07（OS 级所有权、native/system，同锚点更细）与 06（出站策略）覆盖。建议删除并把 `system/03:28` 改指 07。
3. `session-and-loop/04-持久化seam与互斥写.md`——仅被上一条孤儿页引用，不在 session-and-loop/00-map 机制表。内容本身经核验仍真（五个方法、flock 写租约、repair 语义，仅 index.ts 行距漂移）；被 04-格式世代（写者权威）+ 07（flock 租约）大体覆盖。**二选一**：补挂 00-map 保留（内容还新），或把 flock/repair 残值并入 07 后删除——不建议保持现状（无索引可达）。
4. 非孤儿但矩阵漏行：`system/03-门禁与性能基准.md` 在 `system/00-map:106` 有挂，`_coverage/00-index.md:21` 的 system 行只列 01、02。

### E. 索引与记录口径

- `_digested/00-index.md:47`：experimental 行仍写「code-runtime 的 CPython 子进程后端…四种原型合同」——code-runtime 名已死（ptc-runtime），四种→应按 20 包/五家族改写。
- `_digested/00-index.md:38-52` 专题表未提任何 0008 新组（ssh、sandbox、browser-use、computer-use、deliverables、document、ptc-runtime、mcp-resources）。
- `_digested/00-index.md:21` 分支纪律仍写「在 ethan2 上非快进 merge 目标 upstream 提交」的旧 merge 工作流，与同文件 :5「整树照搬」口径冲突。
- `_coverage/00-index.md`：system 行漏 03；「已知未覆盖」表须补登 0008 的 B 类缺口（ssh、browser-use/computer-use、voice-input）+ 门禁行与 `system/03` 对齐（17 modes：要么撤「未覆盖」登记、要么降格页内「七个 mode」）；:45 surfaces/03 措辞。
- `session-and-loop/00-map.md:47-49` 重复标题「## Projection 机制」+「## Projection 必须化」。
- 0008 记录本身两处与事实不符（历史记录不改写，建议在同页补「勘误」小节）：A 类落点判定（组合新行/认证面/事件族零落点）、:89「本批已改」清单（workspace/changes 未改）。

## _faq_on_digested

**重写/点改（17 处）**，损害集中在 preset 重设计的承接：

- FAQ 01 `answer.md:100`、`04-composition-and-entrypoints.md:158`、`02-top-level-zones.md:35`：`packages/preset/agent-presets/…` preset 根与「四个 overlay 目录（含 cordis）」——路径已删、cordis overlay 随 cordis 变更类工具退役（`apps/cli/config/examples/` 只剩 github-review、mcp-memory、schedule 三个）。FAQ 02 `answer.md:46` 已写对（移到 `packages/bundle/web-app/presets/*.patch.yml`）——同语料内部互相矛盾。
- FAQ 13（整个专题）：`option-a:49` 的「三处根 + `<dshHome>/.agent-presets` 用户根」机制已不存在（`agent-preset-registry` 经 bundle patch + plugin_manager 覆盖，README:48）；`option-b:33`、`naming-and-identity.md:68`、`question.md:26` 引已删路径；`dual-home-isolation.md:15` 的 `.agent-presets` 用户根在现源码找不到，需重证或删除。
- FAQ 10 `research.md:38`、FAQ 11 `runtime-user-journey.md:5/:36-37`：同一 preset 路径/行号——**这两个文件是 0008 声称已修订范围内的漏网**。
- `00-index.md:7`：「0006/0007 两轮同步已把全部篇目的声明推进到当前基线」→ 三轮（0006–0008）；同句 FAQ 08 括号数字与 :52 话题表（72 = 42+29+1、41.4%）均未随 FAQ 08 answer 重测推进（89 = 54+33+1+1、45.5%）。
- `00-index.md:56`（FAQ 12 行摘要）：仍把「修复 = index 加 no-store」当答案现状——answer 已改写为「修复随整树照搬退役、登记上游候选缺口」，摘要没跟。
- FAQ 03 `answer` 相关页 `:36`：「settings-file（0.1.7 线仍在 packages/settings/settings-file/）」→ 已删（`packages/settings/` 只剩 `settings/`）。
- FAQ 07 `06-runtime-inspection.md:17`：工具列表含 `cordis_inspect_self` → 已删。
- FAQ 01 `03-package-role-grammar.md:111`：迁移族缺 `session-format-v3-to-v4`；`:127` `API_REMOTE_FORWARDED_EVENTS` 19→23 条（`remote-events.ts:18`）；`:129`「51 个 client 目录」→ 59（README 表 58 行，且 **`ui-settings-account`、`ui-sidebar-terminal` 两个真实包未登记进表**——上游候选缺口，正是 FAQ 01 自己文档化的那类漏登记）。
- FAQ 04 `answer.md:58`、`03-progressive-disclosure-as-cache.md:17/:38`：「architecture.md ≤ 2400 硬预算」→ 强制上限 2410（`scripts/doc-budgets.manifest.json:4`），`docs/AGENTS.md:58` 仍印 ≤2,400（0008 已登记的上游自相矛盾，FAQ 04 未注记）。
- FAQ 01 `01-three-trees.md:28/:64/:75` 等 e2b 处已带 0008 注记，✓；FAQ 08 正文、FAQ 12 正文、FAQ 14 机制层经核验与源码一致 ✓。

**复核通过的部分**：FAQ 08 全表与生成表逐项吻合（含挂账 mcp-client 消费者行仍未修的判定：`docs/capability-seams.md:618`，`mcp-client/src/tools.ts:150` 确实 register）；FAQ 12 的诊断与退役表述与树一致（`frontend-static/src/index.ts` 确无缓存头）；FAQ 14 的桥机制（`packages/hooks/{hook-protocol,hooks-claude-code,hooks-codex}`）成立。

**明示未核**：FAQ 02/06/09/10 编号页、07 的 01–05/07–10 页、04 tier 表细节、05 maxBytes 数字、11 developer-journey 页、14 的 7/33 与 5/12 事件计数、03 完整 vendor route 集。

## _agent_ready_development

**维护记录损坏（先修）**：

- `_coverage/00-corpus-maintenance.md:3` 头部：「复核日期 2026-09-16。基线 46a7f68b09（dsh-v0.1.5-rc.2）」——hash/版本错配（46a7f68b09 = 0.1.7-rc.1），日期也未随 09-23 条目更新。
- `:97`：「2026-09-16 的 0.1.5-rc.2（`46a7f68b09`）re-pin」——历史条目的 hash 被全局替换破坏（pre-0008 版本为 `fb2c4b9e69`，`git show 23aa3b253b~1` 可证）；与 `:103`（fb2c4b9e69 → dsh-v0.1.7-rc.1）直接冲突。
- `:78/:97/:105` 的 118/118/66 条计数链：实际 = 65 个唯一 URL / 115 处 blob 引用，全部钉在 46a7f68b09，无漏钉。「66≈65」是唯一对得上的数；建议按「唯一 URL 数」重述计数口径。

**过期断言（教程教了已退役的规则/机制）**：

- **Agent Note 标准**：`advanced-sdd-flow/01:5-9/:23`、`foundations/01:75`、`foundations/02:24` 仍教「每个非平凡变更必须新增/更新 owning Note」，且 `01:7` 的引文与钉住的 `.agents/notes/README.md:46`（「only for lasting decision rationale… mechanical/local edits exempt」）不符；`development-harness/01:50` 已引新标准——同语料两套说法并存。
- `development-harness/06:37-39`：「catalog 还列出 cordis_define/run/stop/undefine…七个 model-facing tools」——与同页 `:27`（#4745 起两个只读工具）矛盾，`docs/tool-catalog.md` 无这些名字。
- `advanced-sdd-flow/02:9-11/:75`：`requiresPullRequestPolicy()`/`validatePullRequest()` 归属 `policy.mjs` → 实现在 `rules.mjs`（policy.mjs 是 29 行 dispatcher）；`:64`「E2B provider e2e 手动 dispatch」——E2B 已退役（`.github/workflows/e2e.yml` 无 e2b）。
- `advanced-sdd-flow/05:15-27`：tier 表缺 `docs/AGENTS.md:27` 新增的 **Persistence history** 行。
- skills 清单：`:23`「12 个（11 个 dsh-）」、`development-harness/03:30-34` 表 11 行 → 实际 14 目录 / 12 个 dsh-*（跨度新增 `dsh-client-ui-ux`、`agent-experience`，表缺这两行）。
- `:59` 重审触发路径 `packages/preset/agent-presets/**` → 已删（agent-preset + agent-preset-registry + `packages/bundle/web-app/presets/`）。

**新面缺位（0 命中）**：`packages/ssh`、`packages/sandbox` 三档政策与一次性升权、session 格式 v4 + `docs/persistence-changes` ack 树、browser-use/computer-use、voice-input、document/officeToPdf、credentials/deepseekAccount、deliverables 组、mcp-resources、两个新 skill。教程以「本仓库的开发过程」为纲，而根 AGENTS.md 已引用 persistence-changes/ack 流与 sandbox/ssh——建议落点：`advanced-sdd-flow/03`（sandbox/ssh 执行面）、`advanced-sdd-flow/05`（persistence-changes tier 行，与上条合并）、`development-harness/03/04/07`（skills 表 + 新执行面一句话注记）。

**复核通过**：全部 65 个外链钉在 46a7f68b09 且锚点抽验可解析；ISSUE_TEMPLATE/dependabot/ci.yml/lifecycle/note 格式条款与树一致；正文页零未注记的退役词。

## _architecture_referenced

- 六份文件均为外部存档：lencx×2（钉 DSH `47f9438` / `dsh-v0.1.1-rc.1`）、ruofei（钉 `dsh-v0.1.2-alpha.2`）自带版本 pin ✓；Google（Saboo 文章）、shixiang **无 pin**；LM_harness 全文零 DSH 内容（主题错置，建议移出或加范围说明）。
- 目录无索引、无基线说明、无 verify.mjs。建议：加 `00-index.md`（勿用 README.md，避双语配对门禁）记录每份的出处/版本/日期与「非版本审计、纯历史」状态；给 Google/shixiang 两份补文件头 pin。
- 口径矛盾：0008 记录 :42「对三个语料的影响」与其自身 :9 及两个 00-index 的「四个目录」声明冲突——本轮确认 `_architecture_referenced` 完全未审计。外部存档不必逐篇核，但**应有目录级索引与版本注记**，否则未来读者无法判断哪句话还成立（如 shixiang `:146` 的泛化描述）。

## 修复批次建议（对应「不要了 / 少了 / 要调整」）

**批 1 · 删除（「不要了」）**：3 个孤儿页（`surfaces/03-客户端资源与侧栏.md`、`capability-seams/05-进程遏制与宿主边界.md`、`session-and-loop/04-持久化seam与互斥写.md`——或补挂 map 保留）；同步改 `system/03:28`、`_coverage/00-index.md:45`、矩阵行清单。

**批 2 · 点改（「要调整」的机械部分）**：全部计数/名称错与行号漂移簇——session v4 常数四处、gate 17 modes、bench 6 路径、转发 23、client 59、Remote 22、`agent/session-start` → `agent/created`（含 2 张 SVG）、`source.kind`、preset 路径系（FAQ 01/03/10/11/13 + capability-seams/03 + 触发路径）、`inspect_self` 两处、维护页 hash 损坏三处、`_digested/00-index` 三处口径。

**批 3 · 重写（「要调整」的重活）**：桌面双页（runProfile + 19387 + 认证 URL 新故事）；composition/03 + 01 heal + cordis-runtime/04 合并为一个「profile 重载重设计」批次；experimental/00-map 边界反转 + 20 包清点；system/01 SettingsForms 段；capability-seams/04 + surfaces/06 的 stream/uplink Remote 面。

**批 4 · 补落点（「少了」）**：capability-seams 补 ssh 页（或在 coverage 登记为已知未覆盖）；experimental 补第四面（driver 原型 + voice-input + auto-review）；runtime-profiles/01 + surfaces/01 补认证面与组合新行；session-and-loop/01 补 `workspace/changes`、`image/offload` 两行；composition 补 plugin-manager/config-editor/`--dump-config-schema`/OPTIONAL_BUNDLES；FAQ 01 补 client README 两行未登记（上游候选）；_architecture_referenced 补 00-index.md。

**批 5 · 门禁加固（防再犯）**：`_digested/verify.mjs` 增加两类机械检查——(a) 孤儿页检测（正文页无任何入链即报）；(b) 退役词扫描（e2b/agent-presets/code-runtime/settings-file/installSection/composeLive 等词命中且同段无「退役/复核/~~」注记即报）。B 类缺口一律落「已知未覆盖」表，change log 只作转发。历史条目禁做任何形式的全局替换。

## 上游候选缺口汇总（下一轮 sync 时核销）

1. `packages/client/README.md` 包表漏 `ui-settings-account`、`ui-sidebar-terminal`（59 目录 vs 58 行）。
2. `docs/AGENTS.md:58` Targets 仍印 ≤2,400，强制上限已是 2410（manifest）。
3. `docs/capability-seams.md:618` `ctx.tools` 消费者行缺 `mcp-client`（gen-doc-graphs 策展表，0007 起挂账）。
4. 根 `AGENTS.md` 布局块缺 `document/`、`examples/` 行（0008 已登记）。

## 本轮未核验清单（明示）

- v3-to-v4 README 的完整 spec 区间、v0-to-v1 relationships 细节、快照 fixture；
- `capability-seams/02/07/08` 与 `tools-prompt-llm/01/03/04/05/06` 的**其余**行锚（抽查面之外的）；
- FAQ 02/06/09/10 编号页、07 的 01–05/07–10、04 tier 表、05 maxBytes、11 developer-journey、14 事件精确计数、03 vendor route 全集；
- `development-harness/01/02/04/05/07` 与 `advanced-sdd-flow/04/05/07/08` 的逐行（仅定向 grep）；
- `_architecture_referenced` 图像资产；`harness-idea/01-04/06-08` 正文（仅经 00-map 与 claims 抽查）；
- 事件名总数 54、N3（architecture 扩展表 20 行）两个计数未重数；「16 项 doc-quick 全绿」未重跑。

## 执行附录（2026-09-24，本页所列全部批次已执行）

本页初版只列发现；同日按「全都要做」指令执行完毕，执行记录如下。三个语料 verify 全绿；`_digested` 门禁在原有检查外新增**孤儿页门禁**与**退役词门禁**两项机械检查（`verify.mjs`，退役词命中且 ±2 行内无退役标注即报；页头带 0008 状态注记声明改名的整页豁免）。

**批 1 · 删除（已完成）**：删 `surfaces/03-客户端资源与侧栏.md`、`capability-seams/05-进程遏制与宿主边界.md`、`session-and-loop/04-持久化seam与互斥写.md`（flock/repair 残值由 07 页承载）；`system/03:28` 改指 07；`_coverage/00-index.md` surfaces 表述消歧。

**批 2 · 点改（已完成）**：session v4 常数四处（00-map:45/:86/:89、01:5、03:36）；`system/03` 17 modes + 六条 bench 路径；转发白名单 23 条（surfaces/01）+ surfaces/06 的 stream/uplink 重写；surfaces/05 59 目录 + permission-presets 改名注记；runtime-profiles 00-map/01/02 的 hmr 门控、args.ts:83、profile.ts 行锚；tools-prompt-llm 00-map/02/05 的锚与 preparing 阶段；harness-idea/05 两工具；capability-seams/08 的 mcp-resources 两层边界 + `agent/created` 锚；`_agent_ready_development` 维护页 hash 复原（09-16 条目复原为 `183f08e9c6`/`fb2c4b9e69`、计数改「唯一 URL 数」）+ note 收窄标准六处 + skills 14/12 + tier 表 Persistence history 行 + 触发路径 + 02 页 rules.mjs/e2e；FAQ 01/02/03/04/06/07/10/11/12/13/00-index 全部点改（含 `API_REMOTE_FORWARDED_EVENTS` 23、client 59、`cordis_inspect_self`、settings-file、预算 2410、FAQ 08 摘要与 FAQ 12 摘要）。

**批 3 · 重写（已完成）**：`surfaces/03-桌面入口.md` 与 `runtime-profiles/06-desktop.md` 按 runProfile + 19387 + 认证 URL 整页重写（capability-seams/06 的桌面段同步改写为「分歧已消除」）；`composition/03-user-patch-hmr.md`、`composition/04-profile-创建与保留名.md`、`composition/01-boot-时序.md`（heal→runtime-resolution、appReady 步骤）、`composition/00-map.md`（preset 显示名 locale 化反转、03 行摘要）按 hmr/reconcileProfilePatches/runtime-resolution 新机制改述；`cordis-runtime/04-vendor-本地修改.md` 整页按 22 条清单 + 4.0.4 重写，`00-map.md` vendor 段与 `03-loader-include-与js插值.md` 队列段同步；`experimental/00-map.md`（public-by-default 反转 + 20 包五家族 + OPTIONAL_BUNDLES 通道 + ptc-python 快照仍在的更正）与 `02-agent-teams.md`（统一 bundle、TeamService 非 Remote、投影读法）重写。

**批 4 · 补落点（已完成）**：新增 `capability-seams/09-ssh远程执行族.md`（ctx.ssh 单连接三 provider 扇出、远程 confinement 差异、opt-in 判定）与 `capability-seams/10-新执行面与编排seam.md`（browserUse/computerUse/speechToText/deepseekAccount/mcpResources/officeToPdf/deliverables/plugin-manager 地图页）；`00-map.md` 页表与源码入口同步；session-and-loop/01 补 `workspace/changes` 与 `image/offload` 两行；surfaces/01 补浏览器认证面；`_architecture_referenced/00-index.md` 新建（六份外部副本的出处/版本/使用纪律，LM_harness 标注非 DSH 内容）；`_coverage/00-index.md` 已知未覆盖表补登 ssh 逐行细节与 driver 深读两项、矩阵行补 system/03 与 09/10 页。

**批 5 · 门禁（已完成）**：见上；退役词首跑抓出 14 处残留并当场清零（capability-seams/00-map、03-subagent preset 路径、experimental/01 页头注记升级为全页豁免、runtime-profiles 两处 0.1.7 注记补「退役」字样）。

**遗留（明示，不阻塞）**：`composition/figures/live-recompose.svg`、`last-good-tree.svg`、`boot-sequence.svg:22` 仍含已退役符号（composeLive/watchUserPatches/healProfilesModuleFallback）——SVG 内容门禁不在本轮范围，需一次图修批次（verify 只查 XML/链接，不查图内文字）。`agent-loop/figures/loop-driver-channels.svg` 与 `restart-rearm.svg` 的 session-start 标注已在本轮改掉。

**上游候选缺口（下轮 sync 核销）**：`packages/client/README.md` 包表缺 `ui-settings-account`、`ui-sidebar-terminal`；`docs/AGENTS.md:58` Targets 印 ≤2,400 与 manifest 2410 不一致；`docs/capability-seams.md:618` `ctx.tools` 消费者行缺 `mcp-client`（0007 起挂账）；根 `AGENTS.md` 布局块缺 `document/`、`examples/` 行；`packages/host/apiproxy/` 迁移叙述中 agent-presets 的 Remote 行名（`capability-seams/00-map:67` 现带注记）。
