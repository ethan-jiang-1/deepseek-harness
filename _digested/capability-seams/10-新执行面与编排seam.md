# 新执行面与编排 seam：面地图

> 除了 shell / fs / subprocess 这些教科书 seam，DSH 还有一批较新的能力面：浏览器与桌面控制、语音、账号登录态、MCP resources、文档转换、交付物、插件编排、会话执行目录、翻译。它们的形状各不相同——有的是独占注册位，有的是 core 服务，有的直接是 Remote 服务。本篇按形状给每张面一个定位：Service 合同、provider 集、启用方式与消费者。SSH 远程执行族单独成页（[`09`](./09-ssh远程执行族.md)），这里不重复；某个面挣到自己的深潜页时再展开。

源码核验入口：`packages/browser-use/`、`packages/computer-use/`、`packages/experimental/speech-to-text/`、`packages/experimental/api-speech-to-text/`、`packages/experimental/speech-to-text-sensevoice/`、`packages/experimental/voice-input-bundle/`、`packages/experimental/client-ui-voice-input/`、`packages/credentials/deepseek-account/`、`packages/mcp/mcp-resources/`、`packages/document/office-to-pdf/`、`packages/deliverables/`、`packages/boot/plugin-manager/`、`packages/boot/config-editor/`、`packages/session/working-directory/`、`packages/experimental/worktree/`、`packages/api/remote-access/`、`packages/boot/plugin-market/`、`packages/experimental/translator/`、`packages/experimental/client-ui-cot-translation/`、`packages/experimental/claude-code-mods/`、`packages/bundle/web-app/`、`packages/web/web-deepseek-api/`。

## 独占注册位：browserUse 与 computerUse

Definition 是 `BrowserUseRegistry`（`packages/browser-use/browser-use/src/index.ts`），合同极小：一个可选的 provider 名 + `register()` 独占槽位。第二次注册失败，**重复当前名字也失败**——一个部署同时最多一个浏览器后端。注册只是占位：provider 自己带 tools、自己拥有每个 Session 的浏览器资源，`ctx.browserUse` 不添加任何模型可见工具（组 README）。

provider 全部住在 `packages/experimental/`（npm 前缀 `dsh-experimental-*`，见 [`../experimental/00-map.md`](../experimental/00-map.md)）：`browser-use-stagehand-native`（`inject = ['browserUse', 'agents', 'tools', 'systemPrompt']`）、`browser-use-chrome-devtools-mcp` 与 `browser-use-playwright-mcp`（inject 五项、含 `workingDirectory`）。后两者经共享库 `browser-use-runtime` 的 `mountSessionMcp` 在 `agent/created` 时启动 per-Session MCP client 并在首个模型请求前完成 tool 发现（注册统一发生在 `packages/experimental/browser-use-runtime/src/mcp.ts`）。启用：核验全仓无 bundle/app/快照行挂载任何一个——纯 opt-in，显式挂 `browser-use` 注册服务 + 恰好一个 driver。

`ComputerUseRegistry`（`packages/computer-use/computer-use/src/index.ts`）与 browserUse 逐行同构：独占名槽、重复注册即败、不自带工具。driver 三个，同为 experimental：`cua-driver-mcp`（`inject = ['computerUse', 'tools']`）、`cua-driver-native`（`inject = ['computerUse', 'tools', 'systemPrompt']`）与 `cua-macos`（`inject = ['computerUse', 'tools', 'systemPrompt', 'subprocess', 'agents']`，复用共享库 `packages/experimental/cua/` 的 application / window 对象与已授权平台操作）。核验同样无 bundle/app 挂载行——opt-in。桌面 driver 没有像浏览器 driver 那样的共享 runtime 库；并发语义由包 README 明说不协调（不协调并发 Session）。

## 注册表 + provider + Remote 出口：speechToText

Definition 是 `SpeechToText` 注册表（`packages/experimental/speech-to-text/src/index.ts`）：具名 provider、重复 id 拒绝、`volatile` 配置 `defaultProvider` / `language`；`configure()` 经 `ctx.settings` 把选择写回 profile 条目并要求所选 provider 接受该语言，`follow()` / `snapshot()` 给 UI 完整就绪快照，`resolve()` + `transcribe()` 是显式两步——解析钉住 provider，无 fallback 把音频发给别处。

provider 一个：`speech-to-text-sensevoice`（`inject = ['speechToText', 'subprocess']`），在宿主 CPU 上跑 SenseVoiceSmall ONNX + Silero VAD，平台 sherpa-onnx 包自带 ONNX Runtime，无需 Python 或编译。出口是一个 Remote 面：`api-speech-to-text` 的 `SpeechController`（`TypertRemoteService`，`inject = ['speechToText', 'typert']`）暴露 `ctx.speechController`，请求前先做 WAV/时长限额校验；Client 侧 `client-ui-voice-input` 导入生成的 Remote stub 挂浏览器麦克风 UI。启用走 `voice-input-bundle` 的 `cordis.patch.yml` 四行 insert（speech-to-text、sensevoice、api-speech-to-text、ui-voice-input），shipped profile 保持禁用。整条链都在 `experimental/`。

## 账号登录态：deepseekAccount

Definition 是抽象类 `DeepSeekAccount`（`packages/credentials/deepseek-account/src/index.ts`）：`getState` / `getProfile` / `getBalance` / `startSignIn`（系统浏览器授权 + loopback 回调 origin）/ `cancelSignIn` / `signOut` / `watch`，加两个受限取值——`resolveToken(url)` 只对 provider 配置的推理 origin 返回存储 token，`getPlatformSession()` 是 Host-only 的内嵌 Platform 会话快照。实现是 `deepseek-account-platform`：系统浏览器登录、凭据进既有本地 credential store、取消防迟到回调。

与裸 API key 的关系是**并存而非替换**：两个 adapter 各走各的行——`llm-deepseek-account` 每次请求经 `account()?.resolveToken(connection.baseURL)` 取 token，取不到直接抛 `ACCOUNT_SIGN_IN_REQUIRED`、不落回 key；裸 key 走 `llm-deepseek-api-key` 的独立 adapter 行。listing 请求、缓存与 listed-catalog 解析在共享 transport（`packages/llm/llm-deepseek/src/listing.ts`、`listing-cache.ts`、`listed-catalog.ts`）：账户 route 保留 token 解析与 `ACCOUNT_QUOTA` 改写，api-key route 在官方 endpoint 上复用同一套件跟随 `/models`。消费者：`api/account-controller` Remote（`inject = ['deepseekAccount', 'agents']`）把状态/登录/登出暴露给 Web 与桌面 UI；`apps/desktop-host/src/platform-session.ts` 消费 `getPlatformSession`。登录 UI 与 API 面的启用属 shipped 组合；推理 origin 的账号 token 属 provider 配置决策。

## MCP resources 的独立面：mcpResources

Definition 是 `McpResourceRuntime`（`packages/mcp/mcp-resources/src/index.ts`，`inject = ['tools']`）。每个配置过的 MCP server 经 `register(server, provider)` 进 scope 层；provider 合同只有一个方法 `request()`，server 自己的连接插件拥有它。共享 tools 三个：`list_mcp_resources` / `list_mcp_resource_templates` / `read_mcp_resource`（`src/tools.ts`），由 scope 独立持有、不随单个 server 的挂载行消失（首个 provider 注册时创建，最后一个注销时拆除）；system prompt 侧加一段 `mcp-resource-servers` 点名可用 server。挂接方是 `mcp-client`：每个连上的 server 作为 provider 注册（`packages/mcp/mcp-client/src/server-context.ts`）。对照 [`08-外部生态桥：MCP与hooks.md`](./08-外部生态桥：MCP与hooks.md)：桥面是 tools only，这个独立包把 resources 补成可按需 list/read 的面；prompts 仍然没有。

## Remote 服务样本：officeToPdf

Definition 即实现：`OfficeToPdf` 继承 `TypertRemoteService`（`packages/document/office-to-pdf/src/index.ts`，`ctx.officeToPdf`）——它是 [`04`](./04-新增seam与Remote.md)「非三角色 seam：API Remote」形状的一个样本，不是三角色 seam。机制：经独立发布的 `@deepseek-ai/libreoffice-kit` 起宿主转换器，`ConversionQueue` 按并发/队列/字节上限收纳转换任务（Config 接口 + zod 默认），源文件经授权的 workspace-file 通道读、PDF 内容寻址缓存。桌面宿主另有自己的 office 引擎装配：`apps/desktop-host/src/office.ts` 解析捆绑的 `libreoffice-kit`、挂 `dsh-skill-office` 插件并指向捆绑资源目录，运行时产物由 `office-engine.ts` 定位——桌面侧的 office 能力（含 skill 面）与 `ctx.officeToPdf` 转换服务是同一 kit 的两条装配。消费者：Client 侧 `ui-sidebar-documentpreview`（`packages/client/ui-sidebar-documentpreview/src/client/office/index.ts`）经生成的 Remote stub 调用；该 Remote 与 account/pluginManager 等同批进 `packages/api/remotes/src/client/index.ts` 的 mount 清单。

## 交付物：present 工具 + workspace/changes 事件族

两个包，两个 durable 事件，都只给 Client 读。`tool-present` 注册 `present` 工具（`inject = ['tools', 'fs', 'sessionProjections', 'workingDirectory']`，`packages/deliverables/tool-present/src/index.ts`）：模型用一次调用声明已存在的源文件为最终交付物，引用进 tool result 持久化（描述引导通常 1–2 个、单次至多 4 个；硬上限是 Config `maxFiles` 默认 8）。

`workspace-changes`（`inject = ['subprocess', 'fs']`，`packages/deliverables/workspace-changes/src/index.ts`）提供 `ctx.workspaceChanges`（`ctx.provide`）。机制：turn 开始/结束各做一次 git working-tree 快照，围绕每次文件工具编辑再做 whole-file capture 覆盖 git 看不到的路径（工作区外临时根里的 scratch 文件与 gitlink 内容被排除，`src/recorder.ts`）；结算时 append `workspace/changes` 会话事件，**事件只带 turn 号**（事件类型声明 `src/types.ts`），行数摘要与逐文件对比留在 Host 侧，由 `workspaceChanges.summary()` / `diff()` 按事件 seq 在 Session 存续期内供读。不在 git 仓库里时退化为只列文件工具编辑；subagent 会话不记录（`eligible()`）。消费者是 Client 的 `ui-deliverables`（`packages/client/ui-deliverables/src/client/turn-deliverables.ts`、`changes-summary.ts`、`present-open.ts`）。机制归属 session-and-loop 专题的会话事件面，见 [`../session-and-loop/00-map.md`](../session-and-loop/00-map.md)。

## 编排面：plugin_manager 与 config-editor

`packages/boot/plugin-manager/` 提供 `ctx.pluginManager` 服务（`src/index.ts` 的 `PluginManager`，方法走 `@Remote` 装饰器）——`listPlugins` / `listVersionExemptions` / `setVersionExemption(packageVersion, runtimeVersion, enabled, acceptRisk)`。运行时拒绝是**类型化的** `ManagementFailure`：`code` 由调用方 locale 字典渲染，`incompatible-version` 附上被当前 DSH 版本拒绝的包/运行时/peer 范围数组（`src/failure.ts`；typed refusals 见上游 PR #5061，仓库侧无本地验证途径）。豁免是显式接受风险的双字段 API：`set_version_exemption` 授予/撤销一个精确 `包名@版本` 的兼容豁免，授予必须 `acceptRisk: true`，保存后触发 live 重载评估。模型可见入口是 `plugin_manager` 工具（`src/tools.ts`），调用走 `ctx.approval` 审批——profile 变更跨会话持久、安装的 Host 代码在 workspace sandbox 之外运行，这两条写进 justification 文案。

`packages/boot/config-editor/` 提供 `ctx.configEditor`（`src/index.ts`），合同是 **validate-then-write**：`edit()` 在文件锁内先 `resolveConfig` 校验下一步配置、再把 profile patch 写成原子 YAML（等值于继承层时删除 override 行），`reconcileProfilePatches` 失败即回滚写前内容；整个过程经 `hmr.runExclusive` 与 Loader 热重载串行。编排面的组合与 boot 时序归 composition 专题，见 [`../plugin-system/composition/00-map.md`](../plugin-system/composition/00-map.md)。

## Session 执行目录：workingDirectory 与 worktrees

`ctx.workingDirectory` 的 Definition 是 `WorkingDirectoryService`（`packages/session/working-directory/src/index.ts`，`inject = ['fs', 'sessionProjections', 'systemPrompt']`）。一个 Session projection 拥有生效的执行目录：文件系统校验变更，user context 报告变更，原始 metadata 与写授权保持固定。Provider 只有它自己；消费者是 `tool-working-directory`、`tool-fs`、`tool-bash`、`tool-pwsh`、`subagent`、`sdk-jsonrpc-server`（生成表的 direct consumers 列）。迁移口径见升级指引 [`working-directory`](../../docs/upgrade-guide/v0.2.1-alpha.1/working-directory/guide.md)；配套 persistence ack `2026-09-13-working-directory` 与 `2026-10-05-working-directory-attribution`。

`ctx.worktrees` 的 Definition 与唯一 Provider 都是 `WorktreeService`（`packages/experimental/worktree/src/index.ts`，`inject = ['workingDirectory', 'fs', 'subprocess', 'sandbox', 'sandboxPolicy']`）。模型面是 `experimental/tool-worktree` 的 `create_worktree` 工具（`inject = ['tools', 'worktrees']`，实现调 `ctx.worktrees.create(...)`），创建后把当前 Session 目录切到新 worktree；默认落在 `.agents/worktrees/`。作为可选 bundle `tool-worktree` 出货（`packages/boot/app-boot/src/profile.ts` 的 `OPTIONAL_BUNDLES`），纯 opt-in。

## core 服务：remoteAccess、pluginMarket、webApp、claudeCodeMods

`ctx.remoteAccess`：`RemoteAccessService extends TypertRemoteService`（`packages/api/remote-access/src/index.ts`）——按业务注册的 role-based policy 决定非 owner Peer 能调用哪些 Remote 方法，过滤 list 结果，并逐 Peer 推 access snapshot。消费者是 `api-gateway`、`api-session-controller`、`api-workspace-controller`。它是 core 而非 seam——只有一份实现，没有第二个可替换后端。持久化 ack `2026-10-13-user-rpc-principal`。

`ctx.pluginMarket`：`PluginMarket extends TypertRemoteService`（`packages/boot/plugin-market/src/index.ts`，`inject = ['pluginManager']`）——读取用户配置的市场索引，`@Remote` 方法 `listIndexes()` 等，安装动作仍归 plugin manager。消费者是 `client-ui-plugin-market` 与自身，随可选 bundle `plugin-market-bundle` 出货。

`ctx.webApp`：`@deepseek-ai/dsh-web-app` 在 Web 组合里 `ctx.provide('webApp', { getAdvertisedUrl })`（`packages/bundle/web-app/src/index.ts`）：有配置的 publicUrl 就用它，否则回落到 listener origin。`DSH_WEB_URL`、启动时打开的 URL 与 `harness-dev-context` 读同一份值；后者的两条 prompt section 因此能保持去值，见 [`../tools-prompt-llm/01-section顺序与前缀.md`](../tools-prompt-llm/01-section顺序与前缀.md)。

`ctx.claudeCodeMods`：`ClaudeCodeMods extends TypertRemoteService`（`packages/experimental/claude-code-mods/src/index.ts`，`inject = ['workingDirectory']`）——加载 mods，把它们的 hook 链从 harness 扩展点抬起来，并通过自己的 Remote 画 prompt 上方的条带。今天没有别的包消费它（生成表 consumers 列为空）。

## 翻译面：translator 与 cotTranslation

`ctx.translator` 的 Definition 是 `Translator extends Service`（`packages/experimental/translator/src/index.ts`），解析 Google 或 Bing 请求，并把共享实验结果经当前 Session writer 保留。`ctx.cotTranslation` 的 Definition 是 `CotTranslationController`（`packages/experimental/client-ui-cot-translation/src/index.ts`），服务已保存的 reasoning 翻译、复用缓存结果，并对未缓存的非活动 Session 加入普通 Session activation。两条 role 都是 `service`（生成表），随可选 bundle `cot-translation-bundle` 出货（`packages/experimental/cot-translation-bundle/cordis.patch.yml` 插入 `translator` 与 `cot-translation` 两行，后者 `provider: bing`）。

## ctx.web 的 DeepSeek provider

`web-deepseek-api` 把 DeepSeek 的 Search 与 Fetch API 注册进同一个 `ctx.web` seam（`inject = ['web']`，`packages/web/web-deepseek-api/src/index.ts` 的 `registerSearchProvider` / `registerFetchProvider`）。`ctx.web` 的 provider 集是 `web-search-exa`、`web-search-perplexity`、`web-search-deepseek`、`web-deepseek-api`、`web-fetch-http`（生成表），Consumer 仍只有一个 `tool-web`。它自带外发证据（`packages/web/web-deepseek-api/tests/egress.spec.ts`，见 [`06-外发代理策略.md`](./06-外发代理策略.md)）。持久化 ack `2026-10-13-deepseek-search-thinking`。

## 源码入口

| 路径 | 一句话 |
|---|---|
| `packages/browser-use/browser-use/src/index.ts` | `ctx.browserUse` 独占注册位 |
| `packages/computer-use/computer-use/src/index.ts` | `ctx.computerUse` 独占注册位（同形状） |
| `packages/experimental/browser-use-runtime/src/mcp.ts` | 两个 MCP 浏览器 driver 共享的 per-Session 挂载 |
| `packages/experimental/speech-to-text/src/index.ts` | `ctx.speechToText` 注册表：具名 provider、写回 profile 的选择 |
| `packages/experimental/api-speech-to-text/src/index.ts` | `ctx.speechController` Remote 出口 |
| `packages/credentials/deepseek-account/src/index.ts` | `ctx.deepseekAccount` 抽象 Definition 与 origin 受限的 `resolveToken` |
| `packages/mcp/mcp-resources/src/index.ts` | `ctx.mcpResources` scope 注册 + 三个共享 tools |
| `packages/document/office-to-pdf/src/index.ts` | `ctx.officeToPdf` Remote 服务与限额配置 |
| `packages/deliverables/workspace-changes/src/recorder.ts` | `workspace/changes` 事件的发射点 |
| `packages/boot/plugin-manager/src/failure.ts` | `ManagementFailure` 类型化拒绝 |
| `packages/boot/config-editor/src/index.ts` | profile patch 的 validate-then-write |
| `packages/session/working-directory/src/index.ts` | `ctx.workingDirectory`：Session 执行目录的唯一 projection |
| `packages/experimental/worktree/src/index.ts` | `ctx.worktrees`：Git worktree 创建 |
| `packages/api/remote-access/src/index.ts` | `ctx.remoteAccess`：非 owner Peer 的方法级准入 |
| `packages/boot/plugin-market/src/index.ts` | `ctx.pluginMarket`：市场索引读取 |
| `packages/experimental/translator/src/index.ts` | `ctx.translator`：匿名端点或原生 Flash 的机器翻译 |
| `packages/experimental/client-ui-cot-translation/src/index.ts` | `ctx.cotTranslation`：reasoning 翻译及其缓存 |
| `packages/experimental/claude-code-mods/src/index.ts` | `ctx.claudeCodeMods`：Claude Code mods 作为插件运行 |
| `packages/bundle/web-app/src/index.ts` | `ctx.webApp`：Web GUI 对外地址 |
| `packages/web/web-deepseek-api/src/index.ts` | DeepSeek Search / Fetch：`ctx.web` 的 provider |
