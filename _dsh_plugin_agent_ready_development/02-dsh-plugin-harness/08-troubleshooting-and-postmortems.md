# 08 · 独立 DSH 插件仓排障速查表与四大真实事故复盘（Postmortems `0001`–`0004`）

## 为什么插件故障往往发生在“单测全绿之后”

独立 DSH 插件仓里最消耗研发预算的不是语法报错，而是**“本地单测 100% 通过，一装进真实 Profile 就静默失灵或炸出看不懂的运行时异常”**。这类故障几乎都长在模块导出边界、五层配置合成、Host/Web 双树产物协议与多进程错误归因的接缝上。

本章前半部分提供一张可直接贴给人类开发者与 Coding Agent 的 **8 大高频插件故障 1 分钟排障速查表**；后半部分从独立插件作者的实战视角，逐篇拆解 DSH 官方已公开的全部四份真实线上事故复盘（[`docs/postmortem/0001`–`0004`](https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/postmortem)），把主仓踩过的真金白银教训转化为你插件仓里的防复发护栏。

## 1. 八大高频插件故障 1 分钟排障速查表

遇到诡异现象时，切勿靠猜去改业务代码；严格按**“现象 → 真实根因 → 首条确认命令/探针 → 根治动作”**四步定位：

| # | 观察到的故障现象 | 90% 概率的真实根因 | 1 分钟首条诊断探针 | 根治动作与权威专章 |
|---|---|---|---|---|
| **1** | 插件装上后毫无报错，但注册的工具、斜杠命令或事件监听器**完全不生效** | `inject` 声明的某个上游服务未挂载或拼错服务键，导致插件 Fiber 静默停留在 `PENDING` | 在组合测试中调用 `assertAllEntriesActive(ctx)`（[`06` §第二阶](./06-plugin-gate-and-ci-harness.md)）枚举非 `ACTIVE` 条目及缺失的 `inject` 键；并运行 `dsh --profile <p> --dump-config` 核对上游行是否被 `disabled` | 补齐缺失的上游服务插件，或将非必需的可选依赖移出 `inject` 并在运行期改用 `ctx.get('serviceKey')` 安全探测 |
| **2** | 本地单测全绿，但真实 CLI/Web 启动即崩：`cannot get property "<svc>" without inject` | ① 函数式插件同时写了 `export default`，被 `Loader.unwrapExports` 丢弃了同文件的 `inject`；或 ② 跨外源 Shadow 代理直接点读了未在 `inject` 声明的可选服务 | 检查入口文件是否混有 `export default`（运行 `node scripts/verify-plugin.mjs`）；检查报错栈是否经过其他服务的代理方法 | 删除函数式插件的 `export default`；未列入 `inject` 的机会性可选服务一律走 `ctx.get('name')` 而非 `ctx.<name>`（详见下文 Postmortem `0001`） |
| **3** | 打开 Web 界面一片空白，控制台报 `window.__DSH_BOOT__ is missing` 或插件客户端模块加载失败 | ① 误用裸 Vite 直接起前端而非通过 `dsh web` 宿主注入启动清单；② 直接拿 `tsc` ESM 产物当 `lib/client.js`；或 ③ 把 `dsh.client` 挂在了子路径导出行而非裸包名根行 | 检查当前访问端口是否为真实宿主 `$DSH_WEB_URL`；打开构建后的 `lib/client.js` 首行核对是否包含 `window.__ModuleLoader__.load`；核对 `cordis.patch.yml` 是否有裸包名根行 | 永远通过 `dsh web` 启动验证；用 `tsdown.config.ts` 打出 lazy-CJS 工厂格式 `lib/client.js`，并把 `dsh.client` 留在裸包名根行（[`04` §2.2](./04-plugin-repo-topologies.md)） |
| **4** | 给工具精心编写了 `presentCall` / `presentResult`，CLI 终端卡片变漂亮了，但 **Web 界面工具卡片纹丝不动** | 把终端纯函数展示器当成了 Web 渲染源——内置 Web 客户端**根本不调用 `presentResult`**，它只消费持久化的 `output.presentationMeta` 与前端 `tool.call.toolview` 槽位 | 检查 `defineTool` 的 `output` 是否返回了 `presentationMeta`，以及客户端是否注册了匹配 `toolName` 的 `tool.call.toolview` 组件 | 在 Host 工具返回中填充精简的 `output.presentationMeta`，需要专属富交互视图时在拓扑 B 客户端挂载 `tool.call.toolview`（[`07` §2.1](./07-extension-recipes-and-host-services.md)） |
| **5** | 在 Profile 或 `--patch` 里只改了插件的 1 个配置字段，结果 Bundle 默认配好的**其余字段全丢了** | 五层配置按相同条目 `id` 叠加时执行的是**整块替换 `config` 对象**，绝非逐字段 deep merge | 运行 `dsh --profile <name> --dump-config`，直接查看该 `id` 合成后的完整 `config` JSON | 高层补丁覆盖同 `id` 条目时带齐所需非默认字段，或将常改项声明为 `Volatile<T>` 交由设置服务管理（[`04` §4](./04-plugin-repo-topologies.md)） |
| **6** | 在 `cordis.patch.yml` 里写了动态表达式，结果插件**永远处于禁用态**或表达式原样变成了字符串/对象 | ① 把双感叹号 `!!js` 误写成了单感叹号 `!js`；或 ② 把 `!!js` 写在了 `name`/`id` 等字面量元数据字段上（仅 `config` 与 `disabled` 支持求值） | 运行 `scripts/verify-plugin.mjs` 扫描 `!js`；用 `dsh --dump-config` 检查解析后的字段类型 | 动态求值一律写 `!!js` 且严格限制在 `config` 与条目 `disabled` 内；按环境切换不同插件包一律用 overlay 补丁文件（下文 Postmortem `0002`） |
| **7** | 用户卸载你的插件或恢复旧会话（`resume`）时，整条历史会话加载报错或后台注入报错 | ① 自定义会话事件漏标 `ignorable: true`，卸载插件后旧日志里留存的未知事件触发读取硬拒绝；或 ② Session V4 下 `agent.inject()` 仍传已废弃的旧 `source` 字面量而未合并 `MessageSourceMap` | 在测试中录制含插件事件的会话，卸载插件后再调用 `ctx.sessions.get()` / `deriveMessages()` 重放验证 | 纯插件私有的可跳过事件标记 `ignorable: true`；模型可见事件补齐 `@messageProjection` 并通过声明合并扩展 `MessageSourceMap`（[`03` §3](./03-context-and-drift.md)、[`07` §2.1](./07-extension-recipes-and-host-services.md)） |
| **8** | 热重载（HMR）或启停插件后，同一次事件**触发了双倍回调**，或正在跑的工具突然报句柄已关闭（`EBADF` / DB closed） | ① 把订阅或缓存放在了模块顶层变量/未纳入 `ctx.effect()` 的原生监听器里；或 ② 卸载回调直接同步 `close()` 资源而未等待在途异步操作排空 | 用 [`06`](./06-plugin-gate-and-ci-harness.md) 的 `.agents/skills/cordis-lifecycle-audit/SKILL.md` 清查模块顶层状态，并构造“调用卡在 `await` 时触发 `fiber.dispose()`”的交错测试 | 所有副作用 100% 走 `ctx.effect()` / `ctx.on()`；重型句柄采用“先关准入闸门 → `await` 在途排空 → 最后关底层连接”的三段式卸载（[`05` §契约四](./05-cordis-contracts-and-model-experience.md)） |

## 2. DSH 四大真实线上事故复盘（插件仓防复发深度拆解）

阅读官方 Postmortem 时，不要只看“当时哪行代码写错了”，更要看**“为什么当时完善的单元测试和门禁全放过了它”**。下面逐篇拆解四份官方复盘对独立插件仓的直接工程启示：

### 事故一（Postmortem `0001`）：一行多余的 `export default` 让 178 个全绿单测沦为摆设

- **一手档案**：[`docs/postmortem/0001-acp-default-export-drops-inject.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md)
- **事故还原**：`@deepseek-ai/dsh-acp` 插件明明拥有 178 个全绿单元测试与 100% 行覆盖率，但真实编辑器一连上 `dsh --profile acp` 就当场崩溃，连报两重 `cannot get property "..." without inject`：① 插件末尾多写了一行 `export default apply`，导致真实 `Loader.unwrapExports` 解包时直接取走了裸函数 `.default`，把同模块具名导出的 `inject = ['agents', 'sessions', 'sessionPersistence']` 彻底丢弃；② 修掉第一重后，`session/load` 仍崩在跨 Fiber 的 Shadow 代理遍历上——`AgentLoop` 为兼容无持久化场景故意未把 `sessionPersistence` 写进 `static inject`，测试里从根上下文直接调 `ctx.agents.resume()` 走了 `!ctx.fiber.runtime` 全局旁路侥幸逃过，而真实插件 Fiber 经由外源 Shadow 代理执行纯祖先链查找时当场撞墙。

> 100% line coverage was satisfied the whole time. Coverage proves lines *ran*; it says nothing about whether the feature works *the way it ships*.
>
> — DSH [`docs/postmortem/0001-acp-default-export-drops-inject.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md#why-every-test-missed-it-the-real-failure)

- **植入你插件仓的三条铁律**：
  1. **严禁混用具名插件导出与 `export default`**（直接由 [`06`](./06-plugin-gate-and-ci-harness.md) 的 `verify-plugin.mjs` 静态封死）；
  2. **凡未列入 `inject` 的机会性可选服务，一律用 `ctx.get('serviceName')` 读取，绝不用 `ctx.serviceName` 属性点读**：属性代理只做祖先 Fiber 链查找，跨兄弟树必炸，而 `ctx.get()` 走拓扑无关的隔离区查找且在服务未激活时安全返回 `undefined`；
  3. **至少保留一条无需 API Key 的真实 `Loader` 入口挂载测试**：手工 `ctx.plugin({ name, inject, apply })` 永远测不到 `Loader.unwrapExports` 与真实的跨树 Fiber 拓扑。

### 事故二（Postmortem `0002`）：合法的 YAML 表达式让文件系统工具全军覆没，快照刷新还把报错当成了新基准

- **一手档案**：[`docs/postmortem/0002-js-expression-disabled-filesystem-tools.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md)
- **事故还原**：团队当时在默认 `cordis.yml` 的文件系统插件条目上写了 `disabled: !!js ...` 试图按模式动态启停，但当时 `Loader` 只对 `config` 字段做表达式插值，未插值的 `disabled` 直接拿到了一个非空的表达式 AST 对象（布尔求值永远为 `true`），导致整套读写工具在所有模式下被永久禁用！更致命的是，开发者随后执行了快照刷新脚本——脚本乖乖把会话里的 `ToolNotFoundError`（`UNKNOWN_TOOL`）和失败卡片写进了预期基准文件，后续所有测试与覆盖率门禁全部绿灯放行。

> A snapshot refresh is fixture production, not correctness review. Semantic impossibilities such as a missing registered tool need assertions independent of the expected output.
>
> — DSH [`docs/postmortem/0002-js-expression-disabled-filesystem-tools.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md#lessons)

- **植入你插件仓的三条铁律**：
  1. **语法合法 ≠ 在该字段受支持求值**：严格遵守现行 Cordis 契约（`!!js` 仅在 `config` 与条目 `disabled` 受支持，其余元数据一律字面量，按环境增删整组插件用独立 overlay 文件）；
  2. **回放测试必须配“独立于录制文本之外的语义不变量断言”**：就像 [`06` §第三阶](./06-plugin-gate-and-ci-harness.md) 演示的那样，不仅要比对只读的 `workspace.expected/`，还要显式断言 `capturedRequests[0].tools` 包含目标工具名且会话结果绝不含 `UNKNOWN_TOOL`；
  3. **权限开关只能承诺它真正管得住的边界**：运行期开关改不了启动期根本没挂载进树里的插件组合。

### 事故三（Postmortem `0003`）：Coding Agent 对着白屏 Vite 报喜，又另起新端口“替身验收”

- **一手档案**：[`docs/postmortem/0003-web-agent-gui-feedback-loop.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0003-web-agent-gui-feedback-loop.md)
- **事故还原**：运行在端口 `3081` Web 界面里的 Agent 修改了前端主题代码后，连续犯下三次典型的“代理指标幻觉”：① 第一轮自己不验收，推给人类去敲命令；② 第二轮看到子目录有 Vite 脚本就裸起了一个 `5173` 端口的独立 Vite，`curl` 看到 HTTP `200` 就宣布成功——实际上浏览器因为缺少完整宿主注入的 `window.__DSH_BOOT__` 直接抛错白屏；③ 第三轮终于找到 `dsh web`，却用后台 `&` 另起了一个无人托管的 `3334` 端口新进程去验，浑然不知用户正在使用的 `3081` 原页面早已加载了新构建产物。

> HTTP readiness, build success, and a boot manifest are different facts. Acceptance names the exact origin and externally observes the requested change there.
>
> — DSH [`docs/postmortem/0003-web-agent-gui-feedback-loop.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0003-web-agent-gui-feedback-loop.md#lessons)

- **植入你插件仓的三条铁律**：
  1. **开发拓扑 B（全栈 Web 插件）时，在仓库 `AGENTS.md` 写死唯一合法的预览与验收入口**：构建双端产物后必须在真实 `dsh web`（优先复用 `$DSH_WEB_URL` 指向的既有宿主实例，自动化测试加 `--patch apps/web/tests/pin-browse-picker.overlay.yml` 固定目录选择器）上核验，严禁裸跑独立打包器盯着 HTTP `200` 报喜；
  2. **长驻测试进程必须走受管任务生命周期（`ctx.jobs` 或测试 `afterEach` 确定性回收）**，严禁用裸 shell `&` 把孤儿服务留在机器上；
  3. **负例测试必须证明“因目标机制而快速拒绝”**，切勿把“进程卡死超时被杀返回非零退出码”误当成“配置校验成功拦截”。

### 事故四（Postmortem `0004`）：粗糙的字符串前缀匹配，把正常的“搜索无结果”冤枉成“沙箱崩溃”

- **一手档案**：[`docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md)
- **事故还原**：在旧版内核 ABI 的 Linux 机器上，底层沙箱启动器每次成功拉起子进程前都会在 `stderr` 打印一行良性提示 `landlock-run: partial enforcement (older Landlock ABI)`（只有真正启动失败时才会打印另一条 `landlock-run:` 并固定以退出码 `125` 退出）。然而上层包装器偷懒只写了一条宽泛的子串匹配 `'landlock-run: '` 加“任意非零退出码”——结果当沙箱内正常运行的 `ripgrep` 因为“未搜到匹配项”合法返回退出码 `1` 时，子进程的退出码与启动器的良性提示被错误拼合，当场误报为致命的 `SANDBOX_UNAVAILABLE`！雪上加霜的是，更外层的文件搜索适配器又用一个大号 `catch` 把这个结构化沙箱错误吞掉改写成了笼统的 `SEARCH_FAILED`，让排障者彻底迷失方向。

> Process attribution requires a conjunction of independent evidence; a shared prefix is not a protocol.
>
> — DSH [`docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md#lessons)

> An adapter must preserve structured failures owned by the seam below it instead of replacing them with its own nearest generic category.
>
> — DSH [`docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md#lessons)

- **植入你插件仓的三条铁律**：
  1. **封装外部 CLI 或子进程（通过 `ctx.subprocess` / `ctx.shell`）时，严禁用宽泛的 `stderr.includes(...)` 定罪**：错误归因必须联合校验**特定退出码 + 精确致命行模式**，并精确豁免同命名空间下的良性告警（尤其注意 `rg`、`git diff --exit-code`、`grep` 等用退出码 `1` 表达合法空结果的命令！）；
  2. **严禁外层 `catch` 把下层服务已经分好类的结构化错误（如 `SandboxUnavailableError`、`RemoteError`）抹平重包成笼统的 `PLUGIN_FAILED`**——只转换真正属于你这一层契约的原始异常，其余带归属的结构化错误原样透传或挂入 `cause`；
  3. **强依赖特定宿主机内核/系统的分支不能只靠“环境不满足就 `skip`”的集成测试**：必须在原生边界旁配齐确定性的桩脚本（例如模拟打印良性告警后再返回退出码 `1`），确保任何开发机和 CI 都能锁住这条归因逻辑。

## 证据入口

- DSH [`docs/postmortem/0001-acp-default-export-drops-inject.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0001-acp-default-export-drops-inject.md)：`Loader.unwrapExports` 默认导出覆盖具名导出机制、外源 Shadow 代理祖先链查找与 `ctx.get()` 可选依赖规范。
- DSH [`docs/postmortem/0002-js-expression-disabled-filesystem-tools.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md)：Cordis YAML 动态求值边界、overlay 组合替代与录制刷新独立语义断言。
- DSH [`docs/postmortem/0003-web-agent-gui-feedback-loop.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0003-web-agent-gui-feedback-loop.md)：`window.__DSH_BOOT__` 宿主注入链路、`$DSH_WEB_URL` 原位验收与受管后台进程准则。
- DSH [`docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0004-landlock-partial-notice-misclassified-child-failures.md)：子进程退出码与 `stderr` 联合归因、下层结构化错误保留与平台无关确定性边界测试。
