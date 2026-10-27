# 07 · 合格插件的测试与验收：按失败面分层，而不是按目录分层

## 一句话

“合格”不是“本地能跑一次”，而是六件事都能重复证明：**装得上、起得来、做对事、看得见（模型可见输入可重建）、不串数据、退得干净**。测试按失败面分层：打包面、契约面、组合面、真实安装面、模型可见面、数据面、兼容面、UI 面、供应链面。层与层之间不是替代关系；越靠下的层越便宜，越靠上的层越接近用户。

> 给李涛的一句话版：先花一小时做“打包 + 真实安装 + 一次启动”的三件套，能挡住大多数“装上了但没反应”；再用一天补契约、隔离、卸载；最后才做模型行为回放与兼容矩阵。

## 1. 先把“合格”写成六个断言

| # | 断言 | 失败时的典型现象 | 主要测试层 |
|---|---|---|---|
| 1 | 包能装进干净 profile | `not-bundle`、模块找不到、`files` 漏项 | T0 / T3 |
| 2 | 行能激活，服务能注入 | 启动警告、工具不出现、`inject` 失效 | T1 / T2 / T3 |
| 3 | 贡献真的可用 | 工具调用失败、UI 不渲染、preset 选不中 | T2 / T4 / T7 |
| 4 | 模型可见输入可重建 | 回放/恢复后前缀不同、`agent.inject` 没留事件 | T4 |
| 5 | 数据不串会话/项目/机器 | 多会话共享状态、写进包目录、secret 进日志 | T5 |
| 6 | 升级/卸载/禁用可解释 | 数据丢失、残留、无法重新启用 | T3 / T5 / T6 |

这六条对应 DSH 的六项发布检查（[02 篇](./02-package-contract.md)）与 6+2 数据平面（[09 篇](./09-agent-data-cuts.md)），但测试的落点不同：发布检查是“DSH 会不会拒绝”，测试是“作者能不能证明”。

## 2. 测试矩阵

| 层 | 目标 | 最小断言 | 推荐工具 / 命令 | 成本 |
|---|---|---|---|---|
| **T0 打包** | 发布的字节完整、可解析、可安装 | `files` 含入口/patch/资源；`exports` 能解析；patch YAML 能解析；`engines.dsh` 与 peer 一致 | `npm pack --dry-run --json`、`pnpm pack`、`publint`、`attw --pack .` | 10–30 分钟 |
| **T1 单元/契约** | 每个处理器在边界上返回正确结果/错误 | 工具成功、schema 拒绝、领域错误、超时、取消；`Config` 默认值；disposer 清理 | `vitest` / `node:test`；`@deepseek-ai/dsh-agent-loop-testkit` | 1–3 小时 |
| **T2 组合** | 真实 Loader 树能挂载、注入、激活、卸载 | 行存在且 `enabled`；服务注入；preset 子行可见；client 图包含包；卸载后无残留 | `@deepseek-ai/dsh-loader-smoke`、`@deepseek-ai/dsh-client-test-runtime`、`@deepseek-ai/dsh-remote-mock` | 2–4 小时 |
| **T3 真实安装** | tarball/registry 安装形状与源码直跑一致 | 干净 `DSH_HOME` 安装 tarball；`--dump-config` 有层；启动无 `skippedBundles`；卸载后 profile 干净 | `pnpm pack` + `DSH_HOME=$(mktemp -d) dsh plugin --profile web add ./x.tgz` + `dsh --profile web --dump-config` | 30–60 分钟 |
| **T4 模型可见** | 请求前缀、工具结果、注入消息可重建 | 记录一次真实会话；回放同一 fixture；断言 `request/header`、工具名、`agent.inject` 事件 | `@deepseek-ai/dsh-llm-replay`、`pnpm run test:snapshot`（仓库内） | 1–4 小时 |
| **T5 数据** | 数据在正确平面，跨会话/重启/升级不串 | 两个会话并行不共享；重启后 storage domain 仍在；包目录无写入；secret 不进日志 | 临时 `DSH_HOME` + 临时 workspace + 两次启动 + 目录 diff | 2–4 小时 |
| **T6 兼容** | 声明范围真实覆盖 | `engines.dsh` 下界/上界；peer-only 回退；预发布；不兼容时安装/启动都拒绝 | `dsh plugin add` 到最小/最大版本；`plugin_manager` 的豁免路径 | 4–8 小时（矩阵） |
| **T7 UI** | 客户端模块可构建、可挂载、可清理、文案本地化 | `./client` 存在；slot 渲染；locale 键；卸载清理样式/监听器 | `@deepseek-ai/dsh-client-test-runtime`（jsdom）；Playwright（真实 Web） | 3–8 小时 |
| **T8 供应链/安全** | 安装脚本、secret、网络、权限边界可解释 | 无生命周期脚本或已声明 `allowBuilds`；无明文 secret；无沙箱绕过；有构建来源证明/签名 | 人工 review + npm 的构建证明发布（CI OIDC）、`npm audit signatures`、secret 扫描 | 1–2 小时 |

## 3. T0：打包面（最便宜，先做）

### 3.1 四件套（三个检查面）

```sh
node lib/index.js                # 入口至少能被 Node import；有 top-level await 也会在这里暴露
npm pack --dry-run --json        # 或 pnpm pack 后看 tarball 文件列表
publint                          # 包结构/入口/类型/导出错误
attw --pack .                    # 类型与 ESM/CJS 解析面（如发布类型）
```

再看 tarball 列表：不应出现 `src/`、`*.map`、测试 fixture、`.env`；应出现 `package.json`、入口、`cordis.patch.yml`、locale、icon、技能资源。

1. **文件列表**：入口、`cordis.patch.yml`（或数组里的每个 patch）、`presets/*.patch.yml`、`locale/*.json`、`icon`、`assets/skills/**` 是否都在。
2. **入口解析**：`exports["."]`、`exports["./client"]`、子路径入口是否都能被 Node 解析；`main`/`types` 是否指向真实文件。
3. **元数据**：`name`、`version`、`engines.dsh`、`peerDependencies`、`dsh.bundle.patch`、`dsh.client.platform` 是否一致。

### 3.2 静态校验清单

- [ ] `dsh.bundle.patch` 指向真实文件；数组顺序就是层顺序；YAML 是顶层数组。
- [ ] 每个 patch 行的 `name` 能从安装位置解析；子路径入口存在。
- [ ] `engines.dsh` 是合法 SemVer 范围；没有 `workspace:`；peer 只写共享实例。
- [ ] 声明了 `Config` 的插件，行内 `config` 能过 schema。
- [ ] `locale/en.json` 存在；`meta.title`/`meta.description` 非空；其他语言文件同目录。
- [ ] 图标是 SVG/PNG/JPEG/WebP、≤256 KiB、在包内。
- [ ] `dsh.client` 的 `platform: 'web'`、`./client` 导出、`external` 只列非基线依赖。
- [ ] 没有把 `src/`、测试 fixture、`.env`、密钥、缓存打进 tarball。

### 3.3 一个容易漏的点

`assets/skills` **不会**因为放在包里就自动被发现。要么由包内 provider 用 `import.meta.url` 注册，要么给 `skill-filesystem` 配 `bundledSkillDir` 指向已安装包的绝对路径。T0 要断言“技能真的出现在 catalog”，而不只是“文件在 tarball 里”（[08 篇 §2.4](./08-packaging-flexibility-and-ecosystems.md)）。

## 4. T1：契约面

### 4.1 每个工具/处理器至少四类用例

| 用例 | 断言 |
|---|---|
| 成功 | 返回值/结构化内容正确；副作用落在预期平面 |
| schema 拒绝 | 非法参数被拒绝；错误信息可读；不产生副作用 |
| 领域错误 | 外部服务 4xx/5xx、超时、取消；错误作为结果返回还是抛出，与协议一致 |
| 清理 | 取消/异常后 disposer 执行；没有定时器、监听器、子进程残留 |

### 4.2 处理器之外

- `Config` 默认值：每个字段的默认值都有测试；默认值变更是破坏性变更。
- 路径：用 `resolveDshHome()` / `resolveAgentsHome()` / `ctx.workingDirectory.get(session)`，不要用 `process.cwd()` / `os.homedir()` 拼。
- 错误：`catch` 里命名错误并保留因果；不要吞掉。
- 协议边界：MCP/HTTP 的“错误是结果值而不是抛出”要在测试里固定，否则调用方会走错分支。

### 4.3 不建议在这一层做的事

- 不要 mock 掉整个 DSH 运行时来测“插件逻辑”；用真实的 service 拓扑（`dsh-agent-loop-testkit` 或 `dsh-loader-smoke`），只 mock 外部边界（LLM、网络、时钟）。
- 不要为静态类型已经保证的值写运行时校验测试；把测试预算放在队列、文件、进程、wire、模型输出这些真实边界。

## 5. T2：组合面

### 5.0 先用 CLI 看组合（不启动）

```sh
dsh --profile web --patch ./plugin.patch.yml --dump-config
dsh --profile web --patch ./plugin.patch.yml --dump-config-schema
```

- `--dump-config` 证明 patch 能解析、层被应用、行 id 在输出里；坏 patch 会以非零码退出，并给出未命中的 entry。
- `--dump-config-schema` **会 import 每个组合模块**来读 Config，因此能提前暴露模块解析失败、缺 Config、`x-cordis.complete === false`；不要对不信任的插件跑它。
- 这一步不证明激活成功；激活失败仍要启动一次，读启动诊断。

### 5.1 Loader 组合

最小组合测试要证明：

- patch 能被解析并挂载；
- 行 `enabled` 与预期一致；
- 依赖的服务被注入，可选服务用 `ctx.get()` 不崩；
- `apply()` 的注册走 `ctx.effect()`/`ctx.on()`；
- 卸载 fiber 后，注册、定时器、监听器都清掉；
- 同名/重复行、缺服务、root-realm 泄漏按预期拒绝。

`@deepseek-ai/dsh-loader-smoke` 提供“从真实 bin + `cordis.yml` 启动、隔离临时目录、捕获输出、清理”的 harness；它支持 source 与 built 两种执行形态，后者能暴露 `exports`/`lib` 的问题。

### 5.2 preset 组合

- 声明 `@deepseek-ai/dsh-agent-preset` 行后，`preset-<id>` 行存在且能绑定新会话。
- 子行 `plugins` 是完整列表；覆盖时重述全部字段。
- 服务提供者与消费者同 `cordis:group` + `isolate`；错误信息是 `Preset services require isolate realms`。
- 重复 id：先注册者胜，后一行失败。
- 失败声明留在花名册但不能绑定；等待 Host 服务的行在 Host 稳定后重审。
- 已有 Agent 保持旧 revision；新 Agent 用当前定义；重启按当前定义恢复。

### 5.3 client 组合

- Host Loader 中已启用的行挂载了包；preset 子树不参与扫描。
- `dsh.client` 的包根、`./client` 导出、`external` 依赖顺序正确。
- 浏览器图包含该包；卸载后图移除、模块/样式被清理。
- `@deepseek-ai/dsh-client-test-runtime` 的 **Slot tier** 可以在 jsdom 中挂载真实 slots、stores、Remote mock；**whole-client tier 只在源码面可用**（`TestClient`/`createClientTest` 不在发布入口里，`src/` 也不进 tarball）。外部作者用 Slot tier，或 Playwright 对已安装的 Web 面做 smoke。
- `@deepseek-ai/dsh-remote-mock` 按 endpoint 名 mock Host。

## 6. T3：真实安装形状

### 6.1 可照抄的验收脚本

```sh
set -eu
PKG=$(mktemp -d)
HOME_DIR=$(mktemp -d)
pnpm pack --pack-destination "$PKG" >/dev/null
TGZ=$(ls "$PKG"/*.tgz | head -1)

# 1. 干净 home + 临时 web profile；不污染现有数据
DSH_HOME="$HOME_DIR" dsh plugin --profile web add "$TGZ"

# 2. 层真的进来了吗？
DSH_HOME="$HOME_DIR" dsh --profile web --dump-config | grep -E 'your-package|your-row'

# 3. 启动（无 key 也能验证加载/激活；有 key 再验证一次真实 turn）
DSH_HOME="$HOME_DIR" dsh --profile web --no-open
# 或：DSH_HOME="$HOME_DIR" dsh --profile headless "run one task"

# 4. 卸载并检查残留
DSH_HOME="$HOME_DIR" dsh plugin --profile web remove your-package
find "$HOME_DIR" -maxdepth 3 -type f | sort
```

断言：

- `--dump-config` 里有你的层与行；没有 `skippedBundles`/兼容诊断。
- 安装后的依赖里没有残留 `workspace:` 范围；安装树里没有指向包外的 symlink。
- 新会话里工具/命令/UI 真的出现（不是只看启动日志）。
- 卸载后 profile 的 `package.json` 与 `cordis.patch.yml` 不再引用你；`$DSH_HOME` 下只留下预期的数据（storage domain、workspace 文件、session 日志）。
- 重装后行为可重复；如果数据仍在，确认这是设计而不是残留。
- 在 CI 里再加一道环境纪律：清掉 `NODE_OPTIONS`/`NODE_PATH`，设 `DSH_TELEMETRY_DISABLED=1`，避免继承宿主配置。

### 6.2 源码直跑不能替代

源码直跑会掩盖：

- `files` 漏项；
- `exports` 不对；
- 构建产物缺失；
- `peerDependencies` 在安装位置解析不同；
- `allowBuilds`/`prepare` 的 Git 安装差异。

链接安装也不过滤 `files`；只有 tarball/registry 安装才暴露裁剪问题。

### 6.3 在 Agent 里验收

不要让 agent 手写 profile 的 `package.json` 或直接跑 pnpm；用 `plugin_manager` 的 `install_bundle` / `list_bundles` / `list_plugins`，它会处理安装、选择、写入锁与结果解释。验收时分开看 `application`（`applied` / `restart-required`）、`warnings`、以及新会话里能力是否可用。

## 7. T4：模型可见面

### 7.1 为什么必须测

DSH 的规则是“模型可见 ⟺ 已记录”：模型看到的任何会话内容都必须能从已提交事件重建，否则 fork/resume/replay 会得到不同结果（[05 篇 R3](./05-data-planes.md)）。插件最容易破坏这条规则的方式是：

- 在 `apply()` 里直接拼一段提示词，不写事件；
- 用 `agent.inject()` 注入但不留 sourced 事件；
- 把状态只放 storage domain，却让模型通过工具读取；
- 新增自定义 session event 类型，或依赖 `plugin:` 记录；`@messageProjection` 也不能让旧读取方安全理解新类型。

### 7.2 两种做法

**A. 录制回放（推荐）**

用 `@deepseek-ai/dsh-llm-replay` 替代真实 LLM adapter，挂载到真实 agent loop；fixture 是一次真实会话的持久化 JSONL（保留 header 与 payload，省略 body `seq`/`time`）。回放时断言：

- `request/header` 的系统提示、工具 schema；
- 工具调用的名字、参数、结果；
- `agent.inject()` 的消息是否以 sourced user message 出现；
- 会话结束后重新打开，派生历史一致；
- **回放消费数**：`assertConsumed()` 在 teardown 时确认脚本里的调用都被消费；少驱动一次调用会静默通过，`assertConsumed` 是防线。

`@deepseek-ai/dsh-llm-replay` **不负责录制**：fixture 要么手工写一个 `session.vN.jsonl`，要么指向你自己的插件持久化的日志，要么用 `dsh-session-snapshot` 的录制路径（仓库内）。回放本身可以独立使用；录制需要真实模型或主仓的快照设施。

仓库内的快照层是 `pnpm run test:snapshot`（`DSH_SNAPSHOT=replay` 只读），录制用 `pnpm run test:snapshot:record`。外部插件不必复制主仓的快照目录规则，但应保留一份“真实会话 fixture + 回放断言”。

**B. Mock server（故障面）**

用 `@deepseek-ai/dsh-llm-mock-server` 脚本化 provider 行为：`rate_limit`、`server_error`、`stream_disconnect`、`partial_disconnect`、`stall`、`malformed_event`、`tool_call_success` 等。它适合测 adapter、重试、取消、错误呈现；不适合证明“模型行为正确”。

### 7.3 不要用“模型说了什么”当唯一断言

- 断言工具调用、文件效果、事件类型、结构化结果；不要只 grep 最终自然语言。
- 失败/取消路径要有独立用例；不要只测 happy path。
- 如果断言浏览器渲染，优先用 ARIA/text，不用像素。

## 8. T5：数据面

### 8.1 六个断言

1. **包目录无写入**：安装前后对包目录做文件树 diff；插件运行后不应新增 `data/`、`cache/`、日志。
2. **会话隔离**：两个并发会话使用同一个插件，状态不串；同一个进程内挂载两次，实例状态互相独立。
3. **重启持久**：写 storage domain 后重启宿主，记录仍在；schema 版本不匹配时拒绝打开（`version-mismatch`）。
4. **模型可见可重建**：只存 storage 的模型可见状态是缺陷；必须能由事件重建（投影是派生视图）。
5. **secret 不泄漏**：用假 token 跑错误路径，扫 stdout/stderr、会话 JSONL、`--json` 输出、诊断日志；凭据错误不能出现在 error 的 `stack` 里。
6. **卸载/升级保留**：卸载后 workspace 文件、home 技能、session 日志、storage domain 的保留/删除符合 README 的 Data 节。

### 8.2 目录 diff 的最小做法

```sh
BEFORE=$(mktemp); AFTER=$(mktemp)
find "$PKG_DIR" -type f -print0 | sort -z | xargs -0 shasum > "$BEFORE"
# 运行插件
find "$PKG_DIR" -type f -print0 | sort -z | xargs -0 shasum > "$AFTER"
diff -u "$BEFORE" "$AFTER"
```

对 `$DSH_HOME` 做同样的事，允许的变化应只有你声明的数据平面；任何意外文件都要解释。

### 8.3 数据测试与 09 篇的对应

| 09 篇平面 | 测试断言 |
|---|---|
| D 定义 | preset 覆盖后已有 Agent 不换 revision；重启按当前定义恢复 |
| C 代码 | 包目录无写入；`files` 完整；升级后入口仍解析 |
| W workspace | 项目文件/技能随仓库；换项目不串；工作目录变更后指令链刷新 |
| U home | 用户技能/AGENTS.md 不被静默追加；跨项目可见 |
| S session | 事件只追加；fork/resume/replay 一致；未知事件按 `ignorable` 处理 |
| H host state | schema/版本/已打开/坏记录行为；模型不可见 |
| K cache | 清理后行为可重建；不成为唯一真源 |
| X credentials | 不进 patch/locale/README/日志；每次操作重新解析 |

### 8.4 保留、清理与作用域的测试

09 篇没有把下面几件事单列成平面，但它们是发布时最容易留垃圾的地方：

- **没有插件数据根。** 如果你的插件自造 `$DSH_HOME/<plugin>/`，测试要断言：README 写了路径、清理方式、迁移方式；卸载后残留可解释。用 domain 时，断言 domain 名/版本与 README 一致。
- **session 无删除 API、附件无 GC。** 断言插件不删日志、不改 header；附件只通过 attachment 服务取引用，不解析 id、不拼路径；卸载不会假装回收附件。
- **settings 是 profile 作用域。** 换一个 profile 后，设置不跟随；如果 README 声称“配一次全生效”，测试要拆穿它。跨 profile 共享偏好应走 home 域，并单独测。

设计阶段的对应清单见 [10 篇 §11](./10-data-design-advisor.md)：数据卡、原生能力落点、键、生命周期、迁移与安全逐条过一遍，再回来写测试。

## 9. T6：兼容面

### 9.1 最小矩阵

- **下界**：`engines.dsh` 的最小版本能装、能启动、核心工具能调用。
- **上界**：下一个 minor 的最新 RC 能装、能启动；有 breaking API 时在 README 写明。
- **无 `engines.dsh`**：只写 DSH peer 时，peer 回退路径能通过。
- **预发布**：`-rc.N` 参与范围匹配；精确预发布声明可用。
- **不兼容**：安装预检/启动拒绝给出可读诊断；豁免路径只在用户明确接受风险时可用。
- **市场 index**：列出的 `engines.dsh` 与包 manifest 一致；安装时以包为准。

### 9.2 不要用“豁免”当兼容策略

版本豁免是用户的逃生门，不是作者的兼容手段。测试应证明“声明范围覆盖你真正测过的版本”，而不是“用户点一下 risk 就能跑”。

### 9.3 破坏性变更的测试

- 行 id 改名：用户 profile patch 失效；测试要证明迁移说明有效。
- `Config` 字段改名/类型变更：旧 config 校验失败；测试要给出迁移路径。
- preset id 改名：会话恢复失败；不要静默回退到另一个 preset。
- storage domain schema 变更：旧数据 `version-mismatch`；测试要覆盖迁移或拒绝。

## 10. T7：UI 面

- **构建**：`./client` 真的存在；`pnpm run build` 后入口可解析；不要只跑 source。
- **挂载**：Host 行挂载包；`dsh.client` 进图；slot 渲染。
- **本地化**：所有产品文案走 locale 字典；不要硬编码中文/英文。仓库内的 `verify-client-ui-i18n` 只扫主仓固定路径，不能直接对第三方包运行；可以 vendor 它导出的 `findUiI18nViolations`，或自己写“locale 键都有值、组件不出现字面量”的测试。
- **清理**：卸载/禁用后样式、监听器、定时器、DOM 节点都清掉。
- **响应式/可访问性**：窄宽度、键盘、焦点、tooltip；如果做 UI，至少测一个窄宽度与键盘路径。
- **真实浏览器**：仓库内 `pnpm run test:web` 是 Chromium/WebKit 快照；外部插件可用 Playwright 做最小 smoke（打开页面、找到你的 slot、断言文本/ARIA）。whole-client 组装层只在源码面可用，不要依赖它做发布测试。

## 11. T8：供应链与安全

- **安装脚本**：Git/tarball 的 `prepare`/`install`/`postinstall` 会以宿主机用户权限执行；能不给就不给；必须给时在 README 写清，并让用户显式 `allowBuilds`。
- **secret**：不写 patch/locale/README/测试 fixture；用凭据服务/环境变量引用；错误信息不打印 token。
- **网络**：声明会访问的域名；不要把用户内容发到未声明的第三方。
- **权限**：Host 插件在进程内、沙箱之外执行；不要用宿主代码替模型绕过 `ctx.fs`/sandbox。
- **构建来源证明**：npm 发布用 CI OIDC 的构建证明选项；`npm audit signatures` 验证；市场 index 不验证作者，用户要自己核对来源。
- **依赖**：`knip`/`dependency-cruiser` 查未使用依赖与非法分层；不要 vendored 一份 DSH 源码来“稳定 API”。

## 12. 时间预算：一小时 / 一天 / 一周

### 一小时（先别发布坏包）

1. `npm pack --dry-run --json` 看文件列表。
2. `publint` + `attw --pack .`。
3. 干净 `DSH_HOME` 安装 tarball，`--dump-config` 看层。
4. 启动一次，确认工具/命令/UI 出现，再卸载。

### 一天（证明边界与生命周期）

5. 每个工具四类用例（成功、schema 拒绝、领域错误、清理）。
6. 一个真实 Loader 组合测试（挂载、注入、卸载）。
7. 两个会话并发 + 重启 + 目录 diff（数据隔离）。
8. secret 扫描 + 卸载残留检查。
9. 把 1–8 串进 CI（push 触发；live 变体 nightly）。

### 一周（敢进市场）

10. 录制回放：真实会话 fixture + `dsh-llm-replay` + 模型可见断言。
11. 兼容矩阵：最小/最大 DSH、peer-only、预发布、不兼容拒绝。
12. UI：client 构建 + slot + locale + 窄宽度 + 卸载清理。
13. 供应链：构建证明、签名 release、依赖审计。
14. 文档即测试：README 的 Data/Compatibility 与 manifest 一致；tag == version；release 资产完整。

## 13. 不要测什么

- 不要为静态类型已经保证的值写运行时校验测试；把预算放在真实边界。
- 不要 mock 掉整个 DSH 来测插件；用真实组合，只 mock 外部服务/时间/网络。
- 不要为没有 UI 的插件建浏览器 E2E。
- 不要把 LLM 判分放进必过 CI；它慢、贵、脆，适合 nightly 或人工 review。
- 不要用“通过 validator”证明行为正确；validator 只证明格式/结构。
- 不要重复主仓的 100% coverage 门槛；外部插件按风险选层，但 T0/T3 不能省。
- 不要断言精确的 prompt 散文或工具描述文案；fixture 里它们被 token 化，断言结构、工具名、事件类型，不断言措辞。
- 不要测 Cordis 框架本身（服务查找、waterfall、disposal 机制）；那是宿主的所有权。
- 不要把 `snapshots/` 顶层语料规则搬进第三方包；那棵树属于 shipped profiles。

## 14. 稳定性规则

- 每个测试自己创建临时 `DSH_HOME`、workspace、端口、子进程，并在 `afterEach` 清理（失败/超时也清理）。
- 不依赖固定端口、固定路径、真实 `$HOME`、系统时钟；时间用可注入时钟。
- 并发测试要证明“两个会话不共享状态”，而不是“同时跑没崩”。
- 子进程要等退出并收集输出；不要留下孤儿进程。
- 快照/回放 fixture 要提交；录制与刷新分开；每个 diff 人工 review。
- 失败信息要带包名、行 id、路径、命令与退出码；不要只报“失败了”。

## 15. 一页检查表

### 最低合格线

**T0 + T1（含一个 disposer 测试）+ T2（`x-cordis.complete: true`）+ T3（干净安装、启动、卸载）+ T4（或明确声明“不产生模型调用”）**。持久化状态加 T5；碰凭据/沙箱/网络加 T6；发布 client module 加 T7；面向外部分发加 T8。

### 发布前必须

- [ ] `pnpm pack` 文件列表包含入口、patch、preset、locale、icon、技能资源。
- [ ] 干净 `DSH_HOME` 安装 tarball 成功；`--dump-config` 有层；启动无兼容/激活错误。
- [ ] 每个工具至少一个成功 + 一个错误用例；卸载后无残留。
- [ ] 新会话里能力真的可用（工具能调用、UI 能出现、preset 能选中）。
- [ ] README 的 Data 节写清读写路径、归属、升级/卸载行为。

### 推荐

- [ ] 真实 Loader 组合测试（不是只 `ctx.plugin`）。
- [ ] 两个会话并发 + 重启 + 目录 diff。
- [ ] `dsh-llm-replay` 的模型可见回放。
- [ ] 最小/最大 DSH 版本各跑一次安装 + 启动。
- [ ] secret 扫描与卸载残留检查。
- [ ] UI 的 locale/窄宽度/清理测试。
- [ ] npm 的构建证明发布 + `npm audit signatures`。

## 16. 证据与边界

DSH 测试设施：

- [testing.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/docs/testing.md) — 分层、覆盖率、e2e、快照、Web、flaky 规则
- [snapshots/AGENTS.md](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/snapshots/AGENTS.md) — 录制会话的所有权与代际规则
- [llm-replay README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/test-support/llm-replay/README.md) — 无 key 回放
- [llm-mock-server README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/test-support/llm-mock-server/README.md) — provider 故障注入
- [loader-smoke README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/test-support/loader-smoke/README.md) — 真实 bin/配置启动
- [agent-loop-testkit README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/test-support/agent-loop-testkit/README.md) — 真实 loop 组合
- [client-test-runtime README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/test-support/client-runtime/README.md) — jsdom slot 运行时
- [remote-mock README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/test-support/remote-mock/README.md) — 按 endpoint mock Host
- [session-snapshot README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/test-support/session-snapshot/README.md) — 完整 profile 快照套件
- [dsh-ci-test-reliability skill](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/.agents/skills/dsh-ci-test-reliability/SKILL.md) — 并发、端口、时钟、子进程、teardown

数据保留的边界：

- [attachment-local README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/attachment/attachment-local/README.md) — 内容寻址、保留所有对象、无自动 GC
- [spill-local README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/spill/spill-local/README.md) — OS 临时目录、启动清理
- [settings README](https://github.com/deepseek-ai/deepseek-harness/blob/1f81c047fc48fa190a683e469daa699857e9afe8/packages/settings/settings/README.md) — 写当前 profile 的 `cordis.patch.yml`，不是账号作用域

外部实践（2026-10-25 文档，未在 DSH 实测）：

- MCP Inspector / conformance / SDK testing — [Inspector CLI](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector/cli)、[conformance](https://github.com/modelcontextprotocol/conformance)、[SDK testing](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/testing.md)
- Claude Code plugin validate / eval — [CLI reference](https://code.claude.com/docs/en/plugins/cli-reference)、[plugin eval](https://code.claude.com/docs/en/plugin-eval)
- Dify 打包/校验 — [validate-difypkg](https://github.com/langgenius/dify-marketplace-toolkit)、[官方 per-plugin CI](https://github.com/langgenius/dify-official-plugins/blob/main/.github/workflows/pre-pr-check-per-plugin.yaml)
- VS Code 测试/发布 — [testing extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)、[publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- Obsidian 发布要求 — [submission requirements](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Community%20directory/Submission%20requirements%20for%20plugins.md)
- HF Spaces 调试 — [debugging ladder](https://github.com/huggingface/skills/blob/main/skills/huggingface-spaces/references/debugging.md)
- npm 发布 / `npm pack` / publint / attw — [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish)、[publint](https://publint.dev/)、[attw](https://github.com/arethetypeswrong/arethetypeswrong.github.io)

边界：

- 外部工具的截图/命令来自公开文档，未在本机逐项执行；DSH 命令以本 checkout 的 `package.json` 与文档为准。
- `pnpm run test:snapshot`、`test:web`、`test:coverage` 是主仓设施；外部插件可以借用机制，但不必复制全部目录规则。
- 本文的“成本”是作者时间估计，不是 CI 时长承诺。
