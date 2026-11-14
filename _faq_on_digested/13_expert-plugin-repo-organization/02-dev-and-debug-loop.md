# 日常开发与排障闭环：挂载插拔、热重载、Agent 引导与测试分层

仓库骨架搭好之后，决定团队每天写插件爽不爽的，是四个高频环节：**怎么让仓内的 Coding Agent 一次找对扩展点、怎么免发版挂进 Profile 快速试跑、遇到怪现象按什么顺序排障，以及测试与文档治理怎么定在最省力的刻度上。**

---

## 一、给 Coding Agent 指好路：一张短地图 + 动手前四问

把 `vendor/dsh` 放进仓库只是给了原材料，想让 Coding Agent 不瞎猜接口，还需要在根 `AGENTS.md`（并配 `CLAUDE.md -> AGENTS.md` 软链接）里写清几百词的导航指令：

1. **锁定 `vendor/dsh` 的查阅优先级**（避免 Agent 一上来扎进几百个包里迷路）：
   - **插件写法、配置与打包契约** → 先读 [`docs/user/develop/basic/index.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/index.md) 与 [`publish.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)，或对照七讲可运行入门教程 [`docs/cordis-tutorial/index.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/index.md)；
   - **挑扩展点（工具、拦截钩子、UI 响应、协议桥）** → 查 [`docs/cookbook/extension-cookbook.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/extension-cookbook.md) 的功能映射表，写工具必看 [`adding-a-tool.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/adding-a-tool.md)；
   - **查宿主已有服务与可替换接缝** → 查 [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) 与自动生成的 [`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md)（查现成能力的四步法见 [FAQ 08](../08_plugin-seam-maturity/01-finding-existing-capabilities.md)）。
2. **每次加新功能前先过“设计四问”**：
   - **占哪个 `ctx` 键、依赖谁？** 自己的业务流挂独立前缀的服务键；`inject` 只声明抽象 Service Definition，不绑死具体 Provider，更不去篡改 `agent-loop`。
   - **有没有新增模型可见内容？** 严守 `model-visible ⟺ logged`：凡是拼进模型请求的内容，都必须能从会话日志完整还原（见 [`docs/subsystems/session.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/session.md)）。外部插件优先走标准工具返回与系统提示词段落；若确需通过 `agent.inject` 注入异步通知，须按规范声明 `MessageSourceMap` 类型（旧版 `{ kind: 'plugin' }` 包装已在 V4 会话格式中废除）。
   - **界面走哪一层？** 先用零前端代码的默认通用兜底卡跑通逻辑，需要保留结构化结果供回放展示时加 `output.presentationMeta`；确需定制视觉时再挂 `dsh.client` 的 `tool.call.toolview` 槽或面板槽位。
   - **最小回归证据是什么？** 动工前先定好哪条单测或组装测试能直接证明这次改动生效。

---

## 二、日常插拔与热重载：四种挂载距离与卸载避坑

开发期没必要每改一行代码都发包重装。按离源码从近到远，有四种挂载手法配合使用（与 Desktop 端及免发布手法的完整对照见 [FAQ 23](../23_standalone-vs-web-release-forms/02-plugin-install-and-dev-bypass.md)）：

| 挂载方式 | 典型命令 / 配置 | 生效范围与适用时机 |
|---|---|---|
| **1. 临时 `--patch` 覆盖** | `DSH_HOME=~/dsh-dev dsh web --patch ./dev/try.patch.yml` | **最快试错**：仅当次进程生效、不落盘改 Profile；注意 patch 内若直指本地 `.ts`/`.js` 文件须写**绝对路径** |
| **2. 源码启动器直跑** | 通过 `vendor/dsh` 源码入口拉起 `headless` 或 `web` 并选中专家预设 | **深挖宿主交互**：Host 侧经 `tsx/esm` 直接跑 TypeScript 源码，适合联调多流编排与断点排错 |
| **3. 本地目录链接进开发 Profile** | `DSH_HOME=~/dsh-dev dsh plugin --profile dev add ./` | **日常主力联调**：以 `link:` 方式写入开发 Profile 的 `dsh.profile.bundles`，贴近真实插件栈 |
| **4. 打包产物真装验收** | `pnpm pack` 后在全新临时 Profile 执行 `dsh plugin --profile smoke add ./*.tgz` | **发版前必过关**：专门揪出 `files` 漏配、构建产物缺失、`dependencies` 与 `peerDependencies` 放错位等打包硬伤 |

### 热重载与重构建的两条真实边界

- **Host 侧插件与配置重组**：长驻运行的自定义 Web Profile 支持动态配置与链接包重载——当你修改 Profile 的 `cordis.patch.yml` 或本地 `link:` 包中已加载的模块时，下一次重组会自动卸载旧 Fiber（由 `ctx.effect` 清理注册项与定时器）并挂载新代码；而 `headless`、`sdk` 等单次执行入口启动即定型，改代码后直接重跑命令即可。
- **Web 客户端（`dsh.client`）必须先产出构建文件**：哪怕 Host 端是源码启动，[`@deepseek-ai/dsh-client-modules`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/modules/README.md) 向浏览器分发的始终是构建后的 `lib/client.js`（缺失时会在激活期直接报错并列出缺失路径）。开发前端卡片或面板时，请在插件仓开一个终端跑打包监听（如 `tsdown --watch`）——每当 `lib/client.js` 重新生成并刷新时间戳，已打开的 Web 页面就会通过 HMR 连接自动热替换对应插件模块（只要宿主本身的 release 版本与 commit 未变）。

### 怎么把插件“拔干净”？（附 `disabled: true` 的实测排障提醒）

想停用某个专家或插件时，从轻到重有三档操作：

1. **会话级切换（最轻）**：新建或切换会话时不选该专家的 `preset`——因为预设内的工具和提示词严格隔离在预设作用域内，不选就完全不会介入当前对话。
2. **Patch 级停用**：在后置的 `cordis.patch.yml` 里给目标行加上 `disabled: true`（保留配置行位置，但跳过挂载）。
3. **Profile 级移除（最彻底）**：执行 `dsh plugin --profile <p> remove <包名>`，同步清掉依赖项与 `dsh.profile.bundles` 条目。

> **排障实战提醒：别盲信“写了 `disabled: true` 就一定摘干净了”**
> 按 Cordis Loader 的正式机制，`disabled` 会在每次挂载决策时求值，官方 `bundle/base` 也在用它做按平台开关。但在实际使用中曾记录到尚未查明根因的异常现象：在 `~/.dsh/profiles/web/cordis.patch.yml` 中对个别带客户端贡献的行（如 `better-sidebar`、`ui-skill-explorer`）设置 `disabled: true` 时并未生效——Host 侧路由仍在、浏览器端模块依然留在激活列表里；此外 `agent-teams`、`auto-continue` 等行在不同实例间的禁用表现也出现过不一致。
> 因此，遇到“明明禁用了怎么还在跑”的诡异现象时，**第一步先跑 `dsh --profile <p> --dump-config` 检查最终合并后的实际配置行**；若要彻底排除干扰，直接在测试 Profile 中 `remove` 该包最稳妥。

---

## 三、行为不对从哪查：五步逐层排障法

插件没按预期工作时，按“从静态组装到运行时日志”的顺序逐层排除，比在代码里乱打 `console.log` 快得多：

1. **查组合合并层（`--dump-config`）**
   运行 `dsh --profile dev --dump-config` 查看叠层后的最终配置。DSH 的加载覆盖顺序固定为：`dsh.profile.bundles 各包按顺序 → Profile 自身的 cordis.patch.yml → 全局 $DSH_HOME/cordis.patch.yml → 命令行 --patch`。重点检查你的行有没有挂上，以及**有没有被后面某一层按同名 `id` 整行覆盖掉部分字段**（Cordis patch 按 `id` 覆盖时是整份替换 `config`，不是深合并！）。
2. **查预设与服务装载层（Mount 审计）**
   预设装不上或置灰时，[`agent-preset-registry`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md) 不会静默吞错，而是把模块导入失败、缺少的 `inject` 服务名、或意外泄漏到全局的服务名连同原因直接列出来——报错文本本身就是修复清单。
3. **查浏览器模块同步层（仅限 Web UI 插件）**
   前端卡片或设置页没出来时，打开 Web 界面的 `Settings → Plugins` 查看插件同步诊断：不管是漏跑构建缺 `lib/client.js`，还是 `dsh.client.external` 漏写了非基线共享依赖，都会按条目显示最近一次导入失败原因。
4. **查会话 JSONL 日志（核对真实上下文）**
   模型表现反常（比如没调工具、提示词没生效）时，直接打开开发目录 `$DSH_HOME/sessions/` 下的 JSONL 日志文件（或写十几行解析探针脚本，见 [FAQ 28](../28_probe-usage-and-origin/answer.md)）。模型每一轮实际看到的系统提示词、工具列表与返回结果都在日志里有据可查。
5. **把偶发问题固化成回放用例**
   一旦定位到跟多步模型响应耦合的缺陷，把这段会话 JSONL 提取出来交给回放测试，防止后续改提示词或工具参数时二次复发。

---

## 四、测试分层与文档纪律：借主仓精髓，裁掉大仓包袱

外部插件仓不需要照搬 DSH 主仓面向 300 多个包的重型门禁（比如双语文档哈希锁、全仓单文件 100% 覆盖率硬卡），按下面这套轻量组合拳落地收益最高：

### 1. 四层测试按性价比排优先级

- **第 1 层（每次必跑，秒级）：纯函数与模块单测（`vitest`）**——覆盖领域解析逻辑、参数校验、`output.render` 与 `output.presentationMeta` 纯投影函数。
- **第 2 层（每次必跑，秒级）：最小 Cordis Loader 组装测试**——在测试里拉起只含目标插件与最小桩服务的 `Context`，验证 `inject` 依赖闭合，并断言插件卸载（`dispose`）后监听器与工具无残留。
- **第 3 层（每次发版或改打包配置必跑）：干净环境 `.tgz` 真装冒烟**——写成 `scripts/release-smoke.mjs`，自动执行 `pnpm build && pnpm pack`，在临时空目录设为 `DSH_HOME` 后跑通 `dsh plugin --profile smoke add` 与 `--dump-config`。
- **第 4 层（按需启用）：录制会话无密钥回放（`snapshots/`）**——公开发布的 `@deepseek-ai/dsh-llm-replay` 可以直接拿来用。只有当你的专家重度依赖复杂提示词拼装或多轮工具配合时，再挑几条黄金路径录进顶层 `snapshots/` 目录做回归（完整搭法与边界见 [FAQ 21](../21_recorded-session-snapshots/answer.md)）。

### 2. 代码、当前文档与决策记录同提交闭环

日常迭代直接沿用 [FAQ 11 · 六步窄切片闭环](../11_native-development-loop/answer.md) 与 [FAQ 06 · 变更落位路径](../06_change-landing-path/answer.md) 的核心习惯：

- **每次改对外行为**：同一个提交里同步改好代码、更新 `docs/` 或 `README`（只描述当前有效行为，绝不堆叠“某月某日把 X 改成了 Y”的历史流水账），并附上会在旧代码上报红的测试；
- **只有存在持久设计取舍时才写 `notes/`**：比如“为什么专家状态选了 `ctx.storageDomain` 而不是写工作区文件”“为什么放弃了拆成三个包”，用简短的 `Problem / Decision / Alternatives considered / Consequences` 记下被淘汰方案输在哪，防止三个月后自己或新的 Coding Agent 翻旧账重踩一遍坑（写法细则见 [FAQ 20](../20_agent-note-quality-bar/answer.md)）。

> 核验状态见 [核验基线登记](../00-baseline.md)。
