# Experimental · 实验原型面

产品源码基线：`639ed015397290b3745d163aafe02ffee4aa3f84`（`dsh-v0.2.0-rc.2`）；本专题结论与该 commit 的项目树一致，跨度对照的 OLD 侧为 `46a7f68b09`（`dsh-v0.1.7-rc.1`），增量见 [`_change_log/0009`](../_change_log/0009-0.1.7-rc.1-to-0.2.0-rc.2.md)。

## 一句话

`packages/experimental/` 是「跑在真 Harness 上、但合同随时会变」的原型包集合，当前 **20 个包、五个家族**：Agent Teams 多代理编组（agent-team / tool-agent-team / client-ui-agent-team / agent-team-profile 四包，~~agent-team-web-profile~~ 已于 0.1.7 线删除并并入 agent-team-profile）、ptc-runtime 的 CPython 子进程后端（ptc-runtime-python，0.1.7 线自 code-runtime-python 改名——旧名退役）、Inspector CDP 调试面、webworker 的 preview 双包（webworker-packer / webworker-runtime），以及 0008 跨度新增的 browser-use driver 四包（runtime + stagehand-native / chrome-devtools-mcp / playwright-mcp）、computer-use driver 两包（cua-driver-mcp / cua-driver-native）、voice-input 语音转写五包（speech-to-text / speech-to-text-sensevoice / api-speech-to-text / client-ui-voice-input / voice-input-bundle）和 auto-review。单独成专题的理由不是它们彼此相似，而是它们共享同一条真实存在的边界——**原型合同**：一种不承诺稳定性、可以在上游同步之间自由漂移的合同。

## 为什么单独成专题

根 `AGENTS.md` 仓库布局行在 0.1.7 线**反转了方向**：「pre-stable prototypes; **public by default with explicit private exceptions**」（`AGENTS.md:69`）。现行边界机制：组内每包用 `@deepseek-ai/dsh-experimental-*` npm 前缀，**默认 public**——加入 dsh release 家族并设 `publishConfig.access: public`（`packages/experimental/AGENTS.md:6`）；例外方向也反了过来：private 名单常量 `PRIVATE_EXPERIMENTAL_PACKAGE_DIRECTORIES` 现为**空数组**（`scripts/experimental-package-policy.ts:2`），即当前没有任何包是 private 的，组 README 明说「All current packages publish under their `@deepseek-ai/dsh-experimental-*` names」（`packages/experimental/README.md:12`）。隔离规则未变：release 包和 apps 不得在 dependencies / optionalDependencies / peerDependencies 里点名它们（`packages/experimental/AGENTS.md:7`，CI 检查传递安装、运行时 import 与 shipped 组合）；普通 release 成员的目录正则 `packages/(?!experimental/)` 仍排除整个目录（`scripts/check-workspace-constraints.ts:55/:59`）。落点核验：`packages/bundle/` 全部 yml/json/md 中 grep 不到任何 `experimental` 引用——shipped bundle 组合仍然零挂载；但 0.1.7 线出现了**新的启用通道**：`OPTIONAL_BUNDLES`（`packages/boot/app-boot/src/profile.ts:190-193`，现为 `@deepseek-ai/dsh-experimental-voice-input-bundle` 与 `@deepseek-ai/dsh-experimental-agent-team-profile`）——随安装出货但在 Web 插件管理器里默认关断的 optional bundle（`packages/boot/plugin-manager/src/index.ts:290` 的 `optional` 判定）。「public 只解决发布边界，不等于 promotion」仍然成立。

组 README 的自我定位是这批包的合同声明：「prototype capabilities whose contracts can change and carry no support promise」「Released products outside this group must not depend on experimental packages」（`packages/experimental/README.md:12`）。发布本身也写明不是稳定承诺（`packages/experimental/AGENTS.md:9`）。与成熟专题的合同差异在**消化侧**同样成立：产品包的机制页对的是有 release 门禁、快照锚定和 catalog 生成撑着的公开合同；experimental 包同样过测试、文档、invariant 门禁（「Experimental status does not relax engineering, security, documentation, lifecycle, testing, invariant, or snapshot requirements」，`packages/experimental/AGENTS.md:8`），但那份合同本身允许在两次上游同步之间改名、重组甚至消失。所以本专题的行锚只保证对「最近核验」那个 commit 成立，漂移时按 `_coverage/` 矩阵整专题复核，而不是像产品 seam 那样默认向后兼容。

## 五个家族

**ptc-runtime-python（原名 code-runtime-python，0.1.7 线随 PTC 命名重构改名）—— 换 provider 形状。** `ctx.ptcRuntime` seam（原 `ctx.codeRuntime`）的第二实现：CPython 3.10+ 子进程每次 `run()` 跑一个全新解释器，程序与宿主在 fd 3 上说 JSON-lines 帧协议，宿主把每个入站帧当敌意输入逐字段重建，全部上限在 load 时验证。这是「同一个 Service Definition、第二个 provider」的最小样本，与 worker-thread 后端的取舍（进程隔离 vs 线程内、Unix-only vs 跨平台）全在 [`01-code-runtime-python.md`](./01-code-runtime-python.md)。

**Agent Teams —— 新服务 + 多包家族形状。** 一个 session 内的多代理编组：`ctx.agentTeams` 领域服务（roster / mailbox / task board，经 Lead Session log 持久化）+ 九个成员级工具 + 统一的 Host/Web profile bundle + Web 会话头部 UI，四包各司其职（0.1.7 线起 Host 与 Web 共用 `agent-team-profile` 一个 bundle，其 patch 同时插入 agent-team、tool-agent-team 与 ui-agent-team 三行）。它不是三角色 seam——没有 Provider 可替换性，消费的是「服务 + 工具 + UI」的组合；机制、事件与持久化在 [`02-agent-teams.md`](./02-agent-teams.md)。

**Inspector —— 调试面形状。** Host 与 browser Client 的 CDP 调试面：Worker 线程持有全部 Chrome 协议状态，Host/Client 只发内部观察记录，Worker 校验后翻译成标准 CDP 域；每条 DevTools 连接在 Worker 里挂一条 `node:inspector.Session` 回 Host 主线程。它不改任何模型可见行为，是纯开发者观察面，见 [`03-inspector.md`](./03-inspector.md)。

**webworker 双包一句带过**：`webworker-packer/` 把组合好的 profile 打成 gzip base tar VFS 镜像，`webworker-runtime/` 在一个专用浏览器 Worker 里跑整棵 harness 插件树（内存挂载、CommonJS 包装加载器、postMessage HTTP 隧道），服务 `apps/web` 的 `build:preview` 部署；与上面三个面同组但互不依赖。本专题不展开它们，机制页待有需要再补。

**driver / 语音 / auto-review 新原型波（0008 跨度，机制页待扩）**：browser-use 家族是 `ctx.browserUse`（exclusive 单槽注册，重名注册即失败）的三个 driver provider——stagehand-native（native 实现）与 chrome-devtools-mcp / playwright-mcp（经 `browser-use-runtime` 的 `mountSessionMcp` 挂上游 MCP server），全部 experimental、无 shipped 挂载；computer-use 家族同构，`ctx.computerUse` 的 cua-driver-mcp / cua-driver-native 两个 provider；voice-input 家族围 `ctx.speechToText`（Service Definition + sensevoice 本地 ONNX provider + `speech` Remote 出口 + client-ui 包 + 一个 4 行 insert 的 opt-in bundle）——已列入 `OPTIONAL_BUNDLES`，是这批原型里唯一有 shipped-optional 通道的家族；auto-review 是 `tools/pre-execute` 上的自动审查插件（在 permission-preset 指向 AUTO 预设时对每次原生调用与 PTC 内层调用发起评审，见 `packages/experimental/auto-review/src/index.ts:657/:660`）。这些家族的契约细节以各自 README 与源码为准，本专题暂以本段为地图。

## 毕业路径

原型成熟后的去向是消化侧的预判，不是上游承诺——上游唯一的机制承诺是 promotion 规则本身：「Promotion moves a package to its product-role group and removes `experimental-` from its npm name」，随后原子更新全部 import 与配置行，并复审公共合同、限制、测试证据、release payload、运行时依赖与具名稳定 owner（`packages/experimental/AGENTS.md:9`）。按各家族的形状推：

| 面 | 预判去向 | 依据 |
|---|---|---|
| ptc-runtime-python | `packages/ptc-runtime/` 组（0.1.7 线自 code-runtime 组改名），与 `ptc-runtime-node` 并列成正式 provider | 该组已是「Definition + node provider」结构，Python 后端只补第二个 provider；`language`/`isolation` 字段本来就是为多后端设计的 |
| Agent Teams | 服务进产品能力组（参照 schedule / webhook 这类自足插件的位置），Web UI 进 `packages/client/`（与 ui-schedule 等 client 包并列），profile bundle 转正或内化 | 上游 Dev Note 已把 nested teams、cross-process mailbox、worktree 隔离列为未承诺方向——毕业前这些不影响现有合同 |
| Inspector | host / surfaces 面 | 插件 `inject: ['webServer']`、经 `webserver/index-inject` 注入 client bootstrap，天然是 host 侧开发者工具 |
| driver / voice-input / auto-review | browser-use / computer-use 组已有产品组壳（driver 转正即换 experimental 前缀）；voice-input 的 speech-to-text 定义与 sensevoice provider 分开晋升；auto-review 进 guard/feedback 一侧 | 家族形状与现有产品组的对应关系；无上游时间表 |

这些都是按包形状与依赖方向做的消化侧推演；上游没有为任何一条给出时间表或承诺，读完本章不要把它们当成 roadmap。

## 启用方式总述

**shipped bundle 零挂载不变**，但启用通道从一条变成两条：其一仍是显式组合——源码 checkout 内 `dsh plugin --profile <name> add ./packages/experimental/<pkg>`，或直接往 `cordis.yml` / patch 里 insert；其二是 0.1.7 线新增的 **optional bundle**（`OPTIONAL_BUNDLES`，`profile.ts:213-218`）：voice-input-bundle 与 agent-team-profile 随安装出货（0009 跨度再收编 auto-review 与 schedule-bundle，现共四包），在 Web 插件管理器里一键开关（默认关）。全部 21 包随 dsh release 家族发布（public-by-default），不再有「不发布」的包。python 后端的启用：把默认 PTC runtime（node）行 `disabled: true`，再 insert `@deepseek-ai/dsh-experimental-ptc-runtime-python`——同一 isolate 里重复注册同一个服务名会 load 失败，所以「换后端」永远是组合层的显式决定（快照 `snapshots/session/ptc-python-turn/` 仍在，由 snapshot.yml 清单自动采集，是这条组合的活样本）。Agent Teams 的启用：Host 侧 `pnpm dsh plugin --profile headless add @deepseek-ai/dsh-experimental-agent-team-profile`（profile 已含 `dsh-base` 时可直接加；Web 场景同一 bundle，~~`agent-team-web-profile`~~ 已随 0.1.7 线删除）。Inspector 0009 起发布为 `@deepseek-ai/dsh-experimental-inspector` bundle（`dsh plugin --profile web add` 显式安装，`cordis.patch.yml` 挂安装包）；源码态仍是 `pnpm run demo:inspector`（`cordis.source.patch.yml`）。各面的完整入口见对应机制页。

## 阅读路径

| 文件 | 内容 |
|------|------|
| [`01-code-runtime-python.md`](./01-code-runtime-python.md)（页内 code-runtime-python 为改名前旧名，0.1.7 线已退役） | `ctx.ptcRuntime` 的 CPython 子进程后端：seam 合同、fd-3 帧协议、上限与失败行为 |
| [`02-agent-teams.md`](./02-agent-teams.md) | `ctx.agentTeams` 服务、Lead Session log 持久化、九个成员级工具、统一 profile bundle 与 Web UI |
| [`03-inspector.md`](./03-inspector.md) | Inspector 四个子目录、暴露面、CDP 连接方式与鉴权 |

三页共同回答一个问题：public-by-default（private 名单为空）但合同随时会变的原型能力在 DSH 里长什么样、怎么挂进来、毕业时往哪走；driver / voice-input / auto-review 新家族在本页第五节作为地图，机制页待有需要再补。
