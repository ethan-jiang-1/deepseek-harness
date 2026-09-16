# Experimental · 实验原型面

产品源码基线：`fb2c4b9e69`（`dsh-v0.1.5-rc.2`）；本专题结论与该 commit 的项目树一致，跨度对照的 OLD 侧为 `a66e470204`（`0.1.2-rc.1`），`rc.1` → `rc.2` 的增量见 [`_change_log/0007`](../_change_log/0007-0.1.5-rc.1-to-0.1.5-rc.2.md)。

## 一句话

`packages/experimental/` 是九个「跑在真 Harness 上、但合同随时会变」的原型包：CPython 子进程后端、Agent Teams 多代理编组、Inspector CDP 调试面，外加 preview 部署用的 webworker 双包。单独成专题的理由不是它们彼此相似，而是它们共享同一条真实存在的边界——**原型合同**：一种不承诺稳定性、可以在上游同步之间自由漂移的合同。跨度 0006 起，这条边界内部分出一档：五个 Agent Teams 包是**显式 public 例外**，以现有 `dsh-experimental-*` 名字进入 dsh release 家族；其余四包（code-runtime-python、inspector、webworker 双包）仍是 private 原型。

## 为什么单独成专题

根 `AGENTS.md` 仓库布局行给了分组定义：「pre-stable prototypes; private by default with explicit public exceptions」（`AGENTS.md:48`）。三条机制把这句话变成可执行的边界：组内每包用 `@deepseek-ai/dsh-experimental-*` npm 前缀，**默认 private 并省略 `publishConfig`**；五个 Agent Teams 包是显式 public 例外，保留实验名、设 `publishConfig.access: public` 并加入 dsh release 家族（`packages/experimental/AGENTS.md:6`，名单常量 `scripts/experimental-package-policy.ts:2`）。release 包和 apps 不得在 dependencies / optionalDependencies / peerDependencies 里点名它们（`packages/experimental/AGENTS.md:7`）；普通 release 成员的目录正则 `packages/(?!experimental/)` 仍排除整个目录，public 例外由那份显式名单单独判定（`scripts/check-workspace-constraints.ts:59`；experimental 政策正则在同文件 `:55`）。落点核验：`packages/bundle/` 六个 bundle 的全部 yml/json/md 中 grep 不到任何 `experimental` 引用——九包都仍不在任何 shipped profile/base 组合里；public 只解决发布边界，不等于 promotion。

组 README 的自我定位是这批包的合同声明：「prototype capabilities whose contracts can change and carry no support promise」「Packages are private by default; the five Agent Teams packages are published opt-in exceptions」「Released products outside this group must not depend on experimental packages」（`packages/experimental/README.md:12`）。发布例外本身也写明不是稳定承诺：「Publishing an explicit exception does not promote it or add a stability promise」（`packages/experimental/AGENTS.md:9`）。与成熟专题的合同差异在**消化侧**同样成立：产品包的机制页对的是有 release 门禁、快照锚定和 catalog 生成撑着的公开合同；experimental 包同样过测试、文档、invariant 门禁（「Experimental status does not relax engineering, security, documentation, lifecycle, testing, invariant, or snapshot requirements」，`packages/experimental/AGENTS.md:8`），但那份合同本身允许在两次上游同步之间改名、重组甚至消失。所以本专题的行锚只保证对「最近核验」那个 commit 成立，漂移时按 `_coverage/` 矩阵整专题复核，而不是像产品 seam 那样默认向后兼容。

## 三个面

**code-runtime-python —— 换 provider 形状。** `ctx.codeRuntime` seam 的第二个实现：CPython 3.10+ 子进程每次 `run()` 跑一个全新解释器，程序与宿主在 fd 3 上说 JSON-lines 帧协议，宿主把每个入站帧当敌意输入逐字段重建，全部上限在 load 时验证。这是「同一个 Service Definition、第二个 provider」的最小样本，与 worker-thread 后端的取舍（进程隔离 vs 线程内、Unix-only vs 跨平台）全在 [`01-code-runtime-python.md`](./01-code-runtime-python.md)。

**Agent Teams —— 新服务 + 多包家族形状。** 一个 session 内的多代理编组：`ctx.agentTeams` 领域服务（roster / mailbox / task board，经 Lead Session log 持久化）+ 九个成员级工具 + Host/Web 两个 profile patch + Web 会话头部 UI，五包各司其职。它不是三角色 seam——没有 Provider 可替换性，消费的是「服务 + 工具 + UI」的组合；机制、事件与持久化在 [`02-agent-teams.md`](./02-agent-teams.md)。

**Inspector —— 调试面形状。** Host 与 browser Client 的 CDP 调试面：Worker 线程持有全部 Chrome 协议状态，Host/Client 只发内部观察记录，Worker 校验后翻译成标准 CDP 域；每条 DevTools 连接在 Worker 里挂一条 `node:inspector.Session` 回 Host 主线程。它不改任何模型可见行为，是纯开发者观察面，见 [`03-inspector.md`](./03-inspector.md)。

**webworker 双包一句带过**：`webworker-packer/` 把组合好的 profile 打成 gzip base tar VFS 镜像，`webworker-runtime/` 在一个专用浏览器 Worker 里跑整棵 harness 插件树（内存挂载、CommonJS 包装加载器、postMessage HTTP 隧道），服务 preview 部署；与上面三个面同组但互不依赖。本专题不展开它们，机制页待有需要再补。

## 毕业路径

原型成熟后的去向是消化侧的预判，不是上游承诺——上游唯一的机制承诺是 promotion 规则本身：「Promotion moves a package to its product-role group and removes `experimental-` from its npm name」，随后原子更新全部 import 与配置行，并复审公共合同、限制、测试证据、release payload、运行时依赖与具名稳定 owner（`packages/experimental/AGENTS.md:9`）。按三个包家族的形状推：

| 面 | 预判去向 | 依据 |
|---|---|---|
| code-runtime-python | `packages/code-runtime/` 组，与 `code-runtime-worker-thread` 并列成正式 provider | 该组已是「Definition + worker provider」结构，Python 后端只补第二个 provider；`language`/`isolation` 字段本来就是为多后端设计的 |
| Agent Teams | 服务进产品能力组（参照 schedule / webhook 这类自足插件的位置），Web UI 进 `packages/client/`（与 ui-schedule 等 client 包并列），profile patch 转正或内化 | 上游 Dev Note 已把 nested teams、cross-process mailbox、worktree 隔离列为未承诺方向——毕业前这些不影响现有合同 |
| Inspector | host / surfaces 面 | 插件 `inject: ['webServer']`、经 `webserver/index-inject` 注入 client bootstrap，天然是 host 侧开发者工具 |

三条都只是按包形状与依赖方向做的消化侧推演；上游没有为任何一条给出时间表或承诺，读完本章不要把它们当成 roadmap。

## 启用方式总述

九包都不在 shipped 组合里，启用全部走显式组合：源码 checkout 内 `dsh plugin --profile <name> add ./packages/experimental/<pkg>`，或直接往 `cordis.yml` / patch 里 insert；五个 public 例外随 dsh release 家族一起发布，另外四包不发布。python 后端的样板是 keyless 快照 `snapshots/session/ptc-python-turn/cordis.yml`：先把 headless profile 挂的默认 `code-runtime`（worker-thread）行 `disabled: true`（`snapshots/session/ptc-python-turn/cordis.yml:26`），再 insert `@deepseek-ai/dsh-experimental-code-runtime-python`（`:28`-`:30`）——同一 isolate 里重复注册同一个服务名会 load 失败，所以「换后端」永远是组合层的显式决定。Agent Teams 的启用是两层：Host 侧 `pnpm dsh plugin --profile headless add ./packages/experimental/agent-team-profile`（profile 已含 `dsh-base` 时可直接加），Web 场景再按「先 Host 后 Web」顺序加 `agent-team-web-profile`。Inspector 不装包：build 后 `node apps/cli/lib/bin.js web --patch ./packages/experimental/inspector/cordis.patch.yml` 挂 built 覆盖层，或源码态 `pnpm run demo:inspector`（`cordis.source.patch.yml`）。各面的完整入口见对应机制页。

## 阅读路径

| 文件 | 内容 |
|------|------|
| [`01-code-runtime-python.md`](./01-code-runtime-python.md) | `ctx.codeRuntime` 的 CPython 子进程后端：seam 合同、fd-3 帧协议、上限与失败行为 |
| [`02-agent-teams.md`](./02-agent-teams.md) | `ctx.agentTeams` 服务、Lead Session log 持久化、九个成员级工具、双 profile 与 Web UI |
| [`03-inspector.md`](./03-inspector.md) | Inspector 四个子目录、暴露面、CDP 连接方式与鉴权 |

三页共同回答一个问题：不进 release 家族的能力在 DSH 里长什么样、怎么挂进来、毕业时往哪走。
