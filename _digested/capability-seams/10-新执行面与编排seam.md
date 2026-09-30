# 新执行面与编排 seam：0008 跨度的新面地图

源码核验入口：`packages/browser-use/`、`packages/computer-use/`、`packages/experimental/speech-to-text/`、`packages/experimental/api-speech-to-text/`、`packages/experimental/speech-to-text-sensevoice/`、`packages/experimental/voice-input-bundle/`、`packages/experimental/client-ui-voice-input/`、`packages/credentials/deepseek-account/`、`packages/mcp/mcp-resources/`、`packages/document/office-to-pdf/`、`packages/deliverables/`、`packages/boot/plugin-manager/`、`packages/boot/config-editor/`。

本页是 0008（`0.1.5-rc.2` → `0.1.7-rc.1`）新增执行面的**地图**：每节只记 Service 合同、provider 集、启用方式与消费者这些承重机制；SSH 远程执行族单独成页（[`09-ssh远程执行族.md`](./09-ssh远程执行族.md)），这里不重复。深潜不预先写——某个面挣到自己的页时再展开。跨度判定与缺口登记见 [`../_change_log/0008-independent-recheck.md`](../_change_log/0008-independent-recheck.md)。

## `ctx.browserUse`：独占注册位 + 全实验 driver 集

Definition 是 `BrowserUseRegistry`（`packages/browser-use/browser-use/src/index.ts:16`），合同极小：一个可选的 provider 名 + `register()` 独占槽位。第二次注册失败，**重复当前名字也失败**（`:35`-`:37`）——一个部署同时最多一个浏览器后端。注册只是占位：provider 自己带 tools、自己拥有每个 Session 的浏览器资源，`ctx.browserUse` 不添加任何模型可见工具（组 README，`packages/browser-use/README.md:12`）。

provider 全部住在 `packages/experimental/`（npm 前缀 `dsh-experimental-*`，见 [`../experimental/00-map.md`](../experimental/00-map.md)）：`browser-use-stagehand-native`（`inject = ['browserUse', 'agents', 'tools', 'systemPrompt']`，`packages/experimental/browser-use-stagehand-native/src/index.ts:25`，注册在 `:99`）、`browser-use-chrome-devtools-mcp` 与 `browser-use-playwright-mcp`（同名 inject，各自 `src/index.ts:11`/`:12`），后两者经共享库 `browser-use-runtime` 的 `mountSessionMcp` 在 `agent/created` 时启动 per-Session MCP client 并在首个模型请求前完成 tool 发现（注册统一发生在 `packages/experimental/browser-use-runtime/src/mcp.ts:125`，合同见 `packages/experimental/browser-use-runtime/README.md:32`）。启用：核验全仓无 bundle/app/快照行挂载任何一个——纯 opt-in，显式挂 `browser-use` 注册服务 + 恰好一个 driver。

## `ctx.computerUse`：同形状的独占注册位

`ComputerUseRegistry`（`packages/computer-use/computer-use/src/index.ts:16`）与 browserUse 逐行同构：独占名槽、重复注册即败（`:35`-`:37`）、不自带工具。driver 两个，同为 experimental：`cua-driver-mcp`（`inject = ['computerUse', 'tools']`，`packages/experimental/computer-use-cua-driver-mcp/src/index.ts:17`，注册 `:66`）与 `cua-driver-native`（`inject = ['computerUse', 'tools', 'systemPrompt']`，`packages/experimental/computer-use-cua-driver-native/src/index.ts:20`，注册 `:60`）。核验同样无 bundle/app 挂载行——opt-in。桌面 driver 没有像浏览器 driver 那样的共享 runtime 库；并发语义由包 README 明说不协调（`packages/computer-use/computer-use/README.md:12`——不协调并发 Session）。

## `ctx.speechToText`：语音识别注册表 + SenseVoice 本地 provider + Remote 出口

Definition 是 `SpeechToText` 注册表（`packages/experimental/speech-to-text/src/index.ts:35`）：具名 provider、重复 id 拒绝（`:65`）、`volatile` 配置 `defaultProvider` / `language`（`:20`-`:25`）；`configure()` 经 `ctx.settings` 把选择写回 profile 条目并要求所选 provider 接受该语言（`:134`-`:151`），`follow()` / `snapshot()` 给 UI 完整就绪快照，`resolve()` + `transcribe()` 是显式两步——解析钉住 provider，无 fallback 把音频发给别处（`:180`-`:209`）。

provider 一个：`speech-to-text-sensevoice`（`inject = ['speechToText', 'subprocess']`，`packages/experimental/speech-to-text-sensevoice/src/index.ts:13`），在宿主 CPU 上跑 SenseVoiceSmall ONNX + Silero VAD，平台 sherpa-onnx 包自带 ONNX Runtime，无需 Python 或编译（`packages/experimental/speech-to-text-sensevoice/README.md:12`）。出口是一个 Remote 面：`api-speech-to-text` 的 `SpeechController`（`TypertRemoteService`，`inject = ['speechToText', 'typert']`，`packages/experimental/api-speech-to-text/src/index.ts:27`-`:29`）暴露 `ctx.speechController`，请求前先做 WAV/时长限额校验；Client 侧 `client-ui-voice-input` 导入生成的 Remote stub（`packages/experimental/client-ui-voice-input/src/client/index.ts:3`）挂浏览器麦克风 UI。启用走 `voice-input-bundle` 的 `cordis.patch.yml` 四行 insert（speech-to-text、sensevoice、api-speech-to-text、ui-voice-input；`packages/experimental/voice-input-bundle/cordis.patch.yml:1`-`:14`），shipped profile 保持禁用（`packages/experimental/voice-input-bundle/README.md:12`）。整条链都在 `experimental/`。

## `ctx.deepseekAccount`：账号登录态，与裸 API key 并存

Definition 是抽象类 `DeepSeekAccount`（`packages/credentials/deepseek-account/src/index.ts:23`-`:77`）：`getState` / `getProfile` / `getBalance` / `startSignIn`（系统浏览器授权 + loopback 回调 origin）/ `cancelSignIn` / `signOut` / `watch`，加两个受限取值——`resolveToken(url)` 只对 provider 配置的推理 origin 返回存储 token（`:67`-`:71`），`getPlatformSession()` 是 Host-only 的内嵌 Platform 会话快照（`:72`-`:76`）。实现是 `deepseek-account-platform`：系统浏览器登录、凭据进既有本地 credential store、取消防迟到回调（`packages/credentials/deepseek-account-platform/README.md:18`）。与裸 API key 的关系是并存而非替换：0009 起拆成两个 adapter，`llm-deepseek-account` 每次请求经 `ctx.get('deepseekAccount')?.resolveToken(connection.baseURL)` 取 token（`packages/llm/llm-deepseek-account/src/index.ts:21-22`），取不到直接抛 `ACCOUNT_SIGN_IN_REQUIRED`、不落回 key（`:23`）；裸 key 走 `llm-deepseek-api-key` 的独立 adapter 行。消费者：`api/account-controller` Remote（`inject = ['deepseekAccount']`，`packages/api/account-controller/src/index.ts:10`）把状态/登录/登出暴露给 Web 与桌面 UI；`apps/desktop-host/src/platform-session.ts` 消费 `getPlatformSession`。登录 UI 与 API 面的启用属 shipped 组合；推理 origin 的账号 token 属 provider 配置决策。

## `ctx.mcpResources`：给 MCP resources 单独补的面

Definition 是 `McpResourceRuntime`（`packages/mcp/mcp-resources/src/index.ts:47`，`inject = ['tools']`）。每个配置过的 MCP server 经 `register(server, provider)` 进 scope 层（`:80`-`:105`）；provider 合同只有一个方法 `request()`，server 自己的连接插件拥有它（`:23`-`:36`）。共享 tools 三个：`list_mcp_resources` / `list_mcp_resource_templates` / `read_mcp_resource`（`packages/mcp/mcp-resources/src/tools.ts:34`、`:43`、`:52`），由 scope 独立持有、不随单个 server 的挂载行消失（首个 provider 注册时创建，最后一个注销时拆除，`src/index.ts:88`-`:96`）；system prompt 侧加一段 `mcp-resource-servers` 点名可用 server（`src/index.ts:56`-`:66`）。挂接方是 `mcp-client`：每个连上的 server 作为 provider 注册（`packages/mcp/mcp-client/src/server-context.ts:29`-`:31`）。对照 [`08-外部生态桥：MCP与hooks.md`](./08-外部生态桥：MCP与hooks.md)：该页记录的桥面是 **tools only**——resources/prompts 在 `mcp-client` 里仍无直接消费机制（`packages/mcp/mcp-client/README.md:191`），0008 用这个独立包把 resources 补成可按需 list/read 的面；prompts 仍然没有。

## `ctx.officeToPdf`：宿主 LibreOffice 转换，Remote 面

Definition 即实现：`OfficeToPdf` 继承 `TypertRemoteService`（`packages/document/office-to-pdf/src/index.ts:101`，`ctx.officeToPdf` 在 `:23`-`:25`）——它是 [`00-map.md`](./00-map.md)「非三角色 seam：API Remote」形状的一个样本，不是三角色 seam。机制：经独立发布的 `@deepseek-ai/libreoffice-kit` 起宿主转换器，`ConversionQueue` 按并发/队列/字节上限收纳转换任务（Config 全表在 `index.ts:29`-`:80`），源文件经授权的 workspace-file 通道读、PDF 内容寻址缓存。桌面宿主另有自己的 office 引擎装配：`apps/desktop-host/src/office.ts:31` 解析捆绑的 `libreoffice-kit`、`:33` 挂 `dsh-skill-office` 插件并指向捆绑资源目录，运行时产物由 `apps/desktop-host/src/office-engine.ts:27` 定位——桌面侧的 office 能力（含 skill 面）与 `ctx.officeToPdf` 转换服务是同一 kit 的两条装配。消费者：Client 侧 `ui-sidebar-documentpreview`（`packages/client/ui-sidebar-documentpreview/src/client/office/index.ts`）经生成的 Remote stub 调用；该 Remote 与 account/pluginManager 等同批进 `packages/api/remotes/src/client/index.ts` 的 mount 清单（0008 复核记 22 条，[`../_change_log/0008-independent-recheck.md`](../_change_log/0008-independent-recheck.md)）。

## deliverables 组：`present` 工具 + `workspace/changes` 事件族

两个包，两个 durable 事件，都只给 Client 读。`tool-present` 注册 `present` 工具（`inject = ['tools', 'fs', 'sessionProjections']`，`packages/deliverables/tool-present/src/index.ts:26`）：模型用一次调用声明已存在的源文件为最终交付物，引用进 tool result 持久化（描述引导通常 1–2 个、单次至多 4 个，`packages/deliverables/tool-present/src/index.ts:43`；硬上限是 Config `maxFiles` 默认 8，`:17`-`:24`）。

`workspace-changes`（`inject = ['subprocess']`，`packages/deliverables/workspace-changes/src/index.ts:30`）提供 `ctx.workspaceChanges`（`ctx.provide`，`:118`）。机制：turn 开始/结束各做一次 git working-tree 快照，围绕每次文件工具编辑再做 whole-file capture 覆盖 git 看不到的路径（工作区外临时根里的 scratch 文件与 gitlink 内容被排除，`packages/deliverables/workspace-changes/src/recorder.ts:330`-`:344`）；结算时 append `workspace/changes` 会话事件，**事件只带 turn 号**（`recorder.ts:354`；事件类型声明 `packages/deliverables/workspace-changes/src/types.ts:99`-`:106`），行数摘要与逐文件对比留在 Host 侧，由 `workspaceChanges.summary()` / `diff()`（`types.ts:86`、`:96`）按事件 seq 在 Session 存续期内供读。不在 git 仓库里时退化为只列文件工具编辑（`src/index.ts:6`-`:8`）；subagent 会话不记录（`eligible()`，`:58`）。消费者是 Client 的 `ui-deliverables`（`packages/client/ui-deliverables/src/client/turn-deliverables.ts`、`changes-summary.ts`、`present-open.ts`）。机制归属 session-and-loop 专题的会话事件面，见 [`../session-and-loop/00-map.md`](../session-and-loop/00-map.md)。

## 编排面：plugin_manager 与 config-editor

`packages/boot/plugin-manager/` 提供 `ctx.pluginManager` 服务（`packages/boot/plugin-manager/src/index.ts:168`-`:171`），方法走 `@Remote`——`listPlugins` / `listVersionExemptions` / `setVersionExemption(packageVersion, runtimeVersion, enabled, acceptRisk)`（`setVersionExemption` 的声明在 `packages/boot/plugin-manager/src/index.ts:244`-`:249`）。运行时拒绝是**类型化的** `ManagementFailure`：`code` 由调用方 locale 字典渲染，`incompatible-version` 附上被当前 DSH 版本拒绝的包/运行时/peer 范围数组（`packages/boot/plugin-manager/src/failure.ts:6`-`:26`；typed refusals 见上游 PR #5061，仓库侧无本地验证途径）。豁免是显式接受风险的双字段 API：`set_version_exemption` 授予/撤销一个精确 `包名@版本` 的兼容豁免，授予必须 `acceptRisk: true`（`:241`-`:249`），保存后触发 live 重载评估。模型可见入口是 `plugin_manager` 工具（`packages/boot/plugin-manager/src/tools.ts:20`），调用走 `ctx.approval` 审批——profile 变更跨会话持久、安装的 Host 代码在 workspace sandbox 之外运行，这两条写进 justification 文案（`:41`）。

`packages/boot/config-editor/` 提供 `ctx.configEditor`（`packages/boot/config-editor/src/index.ts:26`），合同是 **validate-then-write**：`edit()` 在文件锁内先 `resolveConfig` 校验下一步配置、再把 profile patch 写成原子 YAML（等值于继承层时删除 override 行），`reconcileProfilePatches` 失败即回滚写前内容（`:75`-`:138`）；整个过程经 `hmr.runExclusive` 与 Loader 热重载串行（`:141`）。编排面的组合与 boot 时序归 composition 专题，见 [`../composition-boot/00-map.md`](../composition-boot/00-map.md)。

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
