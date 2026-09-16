# 02 · "要自己改造"清单的逐项判定：哪些是官方交付，哪些是真缺口，缺口怎么补

用户第 2 条体感列了一张七项清单：dynamic workflow、多路并行、diff 预览、markdown 预览、word 预览、ppt 预览、codex 式右侧边栏产出物。逐项对源码判定，结论是 **3 项已有、1 项已有但需换载体、3 项真缺口**；word 与 ppt 预览合为同一条文档产物缺口，所以下文按两条缺口展开。原先并列为真缺口的"工具结果 image 块的 GUI 渲染"已在 0.1.5 跨度内交付（见第二节）——两条真缺口共享同一个补法门槛。

## 第一节 逐项判定：用户清单里哪些已经是官方交付

| 清单项 | 判定 | 官方交付位置 |
|---|---|---|
| 多路并行 | **已有，且有三层** | ① `workflow` 脚本内 `parallel()`（barrier）/`pipeline()`（stages 间无全局栅栏）fan-out 子代理；② 后台 subagent（`run_in_background`，完成后通知回流，不占 captain 上下文）；③ 单 turn 内无依赖工具调用按 `maxParallelToolCalls` 池并行（`packages/core/agent-loop/src/tool-calls.ts:132` 读取配置、`:200` 的在飞池循环） |
| diff 预览 | **已有** | `card: 'diff'` render intent：`tool-fs` 的 `write`（`oldText: null` 表新建）与 `edit`、`fs/tool-str-replace-editor` 都声明它；`ui-primitives/DiffBlock` 自研 hunk 渲染；chat 行截断 8 行、详情面板不截断（`packages/client/ui-tool/src/client/tool/models/diff-card-model.ts`） |
| markdown 预览 | **已有（渲染）** | `ui-primitives/MarkdownText`：micromark 自组装 commonmark + GFM + math，代码高亮 shiki（`packages/client/ui-primitives/package.json:34-48`）；`AssistantMarkdown` 按块序渲染 text/reasoning/image |
| dynamic workflow | **原语已有，模板载体没有** | 见第五节：seam 明确 "caller-supplied scripts only"（`packages/workflow/workflow/README.md`），可复用载体是插件或 skill，不是模板文件 |

关键细节：**diff 卡的权威来自日志，不来自文件系统**。result 侧 diff 的 applied hunks 由 `output.presentationMeta` 派生、随 `tool/result.meta` 持久化，"replay reproduces them"；settled 后 result view 反过来替换 call view 的 intended diff。这就是 `docs/cookbook/adding-a-tool.md:84-88` 的纯函数纪律："These run on live streaming AND on session-log REPLAY… NO I/O, NO reading session state, NO clock/random"——**预览不是 UI 的实时取材，是日志的投影**。

另外两项用户没点名但属于同一族的官方交付：`ui-deliverables` 的 Produced files 行（turn 结束按 render intent 识别 mutation——"a diff card, or a generic card whose `kind` is `edit`"，**不认工具名**，新 mutation 工具靠声明自动加入）与配套的 `ui:deliverable-file-references` 系统提示词段（order 9000，引导模型用 inline-code 引用产出文件，闭合语里的提及被解析成可点击链接，`packages/client/ui-deliverables/README.md:53`、`:88`）；以及 `card: 'read'`（行号窗口 + 语法高亮，由 `presentationMeta` 持久化，因为 "structured lines/path/lang/totalLines fields cannot be reconstructed from the model-facing result text alone"）。

## 第二节 用户清单之外的一项：工具结果图像的 GUI 渲染（0.1.5 已交付）

复核时曾记下一条链路不对称：**`read_image` 把图作为 image block 写进 `tool/result`，模型确实收到（序列化时工具结果图像以稳定前缀 `Attached image(s) from tool result:` 跟进一条独立 user message，`packages/llm/llm-deepseek/src/serialize.ts:323-331`），而 `ui-tool` 的 GenericToolCard 当时只派生 terminal/read/diff/search/web 卡、全包对 `'image'` 零分支**。这条不对称在 `a66e470204` 时成立，在本次跨度内被官方交付闭合：`ui-tool` 新增 image 卡模型与 `read_image` 行渲染器（`packages/client/ui-tool/src/client/tool/models/image-card-model.ts:118`、`:188`、`src/client/tool/toolviews/read-image-row.tsx`），并注册 `tool.call.images` slot（`src/client/contract/slots.ts:40`、`src/client/apply.ts:15`；跨度内提交 `a4d4404708 feat(ui-tool): render read_image results as the image` 与 `56ca8af0ee`）。

也就是说：在"多用 vision"的工作流里，模型看到的截图人类现在能在会话流里直接看到。**验证回路在 0.1.5 上是双向的**——这条曾经的 UI 缺口已从 backlog 移除。

## 第三节 真缺口与自建的硬税

两项真缺口，按"离现有制度多远"排序：

1. **word/ppt/pdf 等文档产物的读取与预览**。`tool-fs` README 明说 "`read` handles UTF-8 text files only — PDF, audio, and video remain deferred"（`packages/fs/tool-fs/README.md:242`）；`packages/web` 的 `WebFetchBody` 是封闭 union（`html | text`），无 `pdf` arm；全仓 "artifact" 命中只指会话日志文件，与 Claude 式 artifacts 无关。这是**读取侧 + 渲染侧双缺口**。
2. **侧边栏 artifacts / 产出物面板**。`deliverables/presented` 已是 `KNOWN_SESSION_EVENT_TYPES` 的成员（`packages/core/session/src/known-event-types.ts:36`；`packages/fs/tool-present/src/index.ts:104` 追加，声明在 `packages/fs/tool-present/src/types.ts:15`），`tool-present` 与 `ui-deliverables` 已把它渲染成 Produced files 行；但 `ui-sidebar` 有品牌行、会话浏览器与 Settings，没有产出物面板。缺的不是事件词表，是**侧边栏面板**——该事件在本页写作基线尚未存在，在复核树 `fb2c4b9e69` 上已交付。

补任何一个，都会先撞上同一条硬税——**`model-visible ⟺ logged` 的 UI 侧镜像**：

> GUI 不自造事实。用户看到的一切必须能从会话日志重建（render intent 纯函数、`presentationMeta` 落 `tool/result.meta`、session-projection whole-value 规则、SDK 整信封转发），而模型看到的一切必须能从日志推导（agent-loop invariant 在每次 dispatch 时以 `JSON.stringify` 逐字比对 `session.deriveMessages()`，`packages/core/agent-loop/src/invariant.ts:39-42`）。

两个方向共用同一个 `SessionEventMap`。所以新增一种产出物的最小完整动作是：**声明合并新增事件成员 → 提供投影/渲染器 → 过回放门禁**，且新成员**默认 required-on-read**：旧构建遇到不认识的无 `ignorable` 标记事件会拒绝重建整条会话，而不是悄悄跳过（`packages/core/session/src/known-event-types.ts:9-18`；机制笔记 `2026-08-10-session-log-version-mechanism.md`）。`ignorable: true` 只许给"丢了不影响重建"的纯信息记录。**这决定了 word/ppt 预览不是"写个渲染器"的活**：预览字节若要进日志（进就得想清楚它算不算模型可见、算不算 required），要么复用现有 `tool/result.meta` 携带派生卡数据（diff/read 卡的路），要么立新事件族（artifacts 侧栏的路）。抄近路在进程内直接塞 UI 状态，等于放弃回放与 fork——GUI 一刷新就没了。

## 第四节 官方实践的位置

用户说"官方已经有了很多实践，不多多试试"——成立，且集中在四个官方入口，全部有 cookbook 或生成目录背书：

| 路线 | 适用 | 入口 |
|---|---|---|
| 会话流业务卡（ConversationNodeDefinition + keyed renderer） | 产物作为对话流的一部分（如 workflow 运行面板就是这么做的） | `docs/subsystems/conversation.md`（要求稳定业务 id、增量事件可回放、`seq` 升序确定性 State） |
| 客户端 UI 插件挂槽位 | 独立面板/布局区域 | `ctx.slots.register()`：`shell.overlay`（帧级浮层，官方明说这是 "the additive seat for a frame-wide surface of your own"，`packages/client/ui-layout/src/client/index.ts:88`）、`rightbar` 右栏（`packages/client/ui-layout/src/client/index.ts:80`）、`conversation.view` 槽环（Trajectory 即其中注册的一个 tab） |
| `cordis_define`/`cordis_run` 动态包浏览器半部 | 零打包、运行时试验 | `packages/extensions/tool-cordis/README.md`（原 self-modification 包，[D 路报告更正](../08_plugin-seam-maturity/answer.md)：命名契约笔记 `2026-08-11` 已更名）；`cordis_inspect_query platform:"client"` 直接列出可用 seat 清单；注意动态包**仅进程内存、不落盘、不跨重启** |
| 固定策略 workflow 消费者插件 | 可复用可分发的编排模板 | 仿 `dsh-tool-ralph`（见下节） |

第 2 条体感的隐含判断——"DSH 还是要有很多自己改造的地方"——严格说对了一半：**改造是必然的，但"自己造"的大部分内容官方已把路铺到 slot 级**；真正要从零立制度的是 artifacts 侧栏面板（缺口 2）与文档产物读取（缺口 1 的读取半边）。

## 第五节 workflow 模板的正确载体

没有模板存储（seam 契约），所以"把我的重构流程固化下来"有两个官方形状：

1. **插件（可分发、可配置）**：仿 `dsh-tool-ralph` 注册一个模型面工具，内嵌固定脚本，把可调参数做成 validated `Config` 字段（`subagentProvider`/`maxRounds`/上限），按普通工具的三种装载方式分发——`dsh web --patch overlay.yml`（一次性）、打成 `dsh.bundle` 包 + `dsh plugin --profile <name> add`（持久层）、或 `agent.cordis.yml` 预设行（仅某类会话）。
2. **skill（零代码）**：在 `<projectRoot>/.agents/skills/<name>.md`（发现 rank 200，`docs/subsystems/skills.md`）放一份教模型按 workflow 脚本契约套模板的说明；正文由 `skill` 工具按需加载，body 编辑无需任何失效协议。

判据很简单：参数会不会增长、要不要给别人用——是，走插件；否，一份 skill 就够。**"用 plan 打造 dynamic workflow"这条用法本身，最自然的固化物是一份 skill**：它教的正是"plan 的哪些字段抄进 `meta.phases`、哪些写成各 `agent()` 的验收 prompt"，而这是提示词知识，不是代码知识。
