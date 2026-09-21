# 方案 A · 独立专家 repo + pinned DSH submodule（推荐起点）

## 一句话

专家包是自己的 repo（pnpm workspace，ESM，TS strict），DSH 以 **git submodule 钉在 release tag** 放进 `vendor/dsh/`，并把 submodule 的 packages 并入本 repo 的 pnpm workspace——coding agent 在 repo 内就能读 DSH 文档、顺着 tsconfig `paths`/`workspace:` 协议直接跳进 DSH 源码。

## 目录树

```text
my-expert/
├── AGENTS.md                     # 入口链：怎么跑、DSH 源在哪、改动的正确路径（几百词）
├── CLAUDE.md -> AGENTS.md        # symlink
├── pnpm-workspace.yaml           # packages: packages/* + vendor/dsh/packages/*
├── package.json                  # private root；对 @deepseek-ai/cordis 用 peerDependency
├── packages/
│   ├── expert-flows/             # 专家核心：自己的 ctx 键、流引擎、SessionEventMap 事件
│   │   ├── src/flows/…           # 多条信息处理流；每条流一个插件，自己的事件与状态
│   │   ├── src/prompt/           # 上下文/提示词组装（preset prompt sections 的供给方）
│   │   └── tests/                # 第 3 阶段点名的"会为回归而失败"的测试住这里
│   ├── expert-tools/             # 模型工具 Consumer：presentCall/presentResult + presentationMeta
│   └── expert-pack/              # 发布载体（自包含：产物不得引用 repo 内其他目录）：
│       ├── package.json          # "dsh" 字段：dsh.bundle.patch + 可选 dsh.client.inject + compatibility 矩阵
│       ├── cordis.patch.yml      # dsh.bundle 指向的默认插件行
│       └── presets/<name>/       # agent.cordis.yml —— 专家的"入口"形态（怎么进 roster 见下节）
├── vendor/
│   └── dsh/                      # git submodule，钉在 dsh release tag（如 dsh-v0.1.5-rc.2）
├── dev/
│   └── harness-home/             # 开发用 profile + cordis.patch.yml；第 5 阶段的 JSONL 会话日志也落在这里（运行残留 gitignore）
├── scripts/
│   ├── verify.mjs                # 第 7 阶段：链接/结构/自包含等机械门禁
│   ├── release-smoke.mjs         # 第 4 阶段：npm pack → 干净 profile → dsh plugin add → 冒烟
│   └── sync-dsh.mjs              # 第 6 阶段：submodule 换 tag + SHA 簿记 + typecheck + 矩阵加列
├── snapshots/                    # 第 5 阶段：自建最小 replay 的录制会话与预期（够用再升级）
├── docs/                         # 当前合同（只写 now）：专家的 ctx 键、事件、工具、preset 语义
├── notes/                        # 第 1/2 阶段：intents.md + proposed/ + implemented/（同 diff 改时态）
└── figures/
```

三个包是把**发布边界**画显眼的终形：pack 是唯一发布载体，flows/tools 是内部实现包。第 0 天收成一个包（生态主流形态）同样成立——见 [answer](./answer.md) 决策 2；长出第二条流或独立工具面时再按此形状展开。

## 为什么"入口"是 preset + bundle，而不是新程序

DSH 的组合链是固定的：package 实现 → bundle 给默认插件行 → profile / patch 覆盖部署选择 → app 启动 Loader（见 `docs/architecture.md`）。专家不产生新的可执行入口，它产生：

- **一个 agent preset**（`agent.cordis.yml` 目录）：会话挂上它，专家的工具、prompt sections、skills 只在这个会话生效，其他会话不受影响——这正是"专家有很好控制的上下文"的现成机制（`ctx.agentPresets`，用户根 `<dshHome>/.agent-presets` 或配置 `roots` 带 `trust`）。
- **一个 bundle 层**（`package.json` 的 `dsh.bundle` 字段指向 `cordis.patch.yml`）：声明默认插件行，让部署方可以 `dsh plugin add` 或 patch 替换。
- 多条信息处理流 = 多个插件，各占自己的 ctx 键、声明 `inject` 依赖；跨流编排用 `ctx.workflowEngine` / `ctx.subagents`，不自造调度器。

注意 pack 里带的 `presets/` **不会自动进 roster**：`agent-presets` 只扫三处根——自己的 shipped 根、组合配置的 `roots`、用户根 `<dshHome>/.agent-presets`（根推导见 `packages/preset/agent-presets/src/index.ts`）。两条落法：① 部署组合给 `dsh-agent-presets` 加一条指向 pack 安装后 `presets/` 目录的 `roots`（带 `trust`——preset 是受信配置，授权它所选插件的能力；注意 patch 对一行是**整行配置替换**，在 pack 自己的 `cordis.patch.yml` 里动这行就得连 base 的配置一起重述，更稳的位置是 profile/home 层的 patch）；② 把目录 copy 进用户根（preset 的 authoring 本来就是 copy-only）。

## 装法与开发环

```sh
git submodule update --init          # vendor/dsh 钉在 release tag
pnpm install                         # workspace: 协议解析到 DSH 源码
pnpm dsh --profile headless "…"      # 从源码起一个会话，挂专家 preset
dsh plugin --profile <p> add file:./packages/expert-pack   # 持久安装验证真实装法
```

`pnpm dsh` 有一个隐含前提：根 `package.json` 要有一条等价于 DSH 根的 `dsh` script（DSH 根是 `node --import tsx/esm apps/cli/src/bin.ts`），在专家 repo 里指向 `vendor/dsh/apps/cli/src/bin.ts` 或等价入口。

测试策略借 OpenClaw 的教训（见 [research.md](./research.md)）：**除了源码 checkout 直跑，必须用 `npm pack` + `dsh plugin add` 的真实安装形状测一遍**，因为源码测试会掩盖依赖声明错误（runtime 依赖漏进 devDependencies、peer 范围写错）。

## 取舍

| | 评价 |
|---|---|
| coding agent 可探索 | ✅ DSH 文档 + 源码在 repo 内，typecheck 直接解析到 DSH `src/` |
| 可复现 | ✅ submodule 钉 tag；升级 = 同步 submodule + 跑本 repo 门禁 |
| 插拔 | ✅ 天然走 `dsh plugin add` / patch 层级，不发明装载 |
| 发布边界 | ✅ 自己的 repo、自己的版本节奏、自己的 CI |
| UI 表达 | ⚠️ 可用但要自建：presenter 层（card render intent + `presentationMeta`）是纯函数、可 replay，但不做事时 Web 只显示 generic fallback 卡；专属工具卡要在 client 插件里注册 `tool.call.toolview` 槽，独立 UI 面走 `dsh.client.inject`（见下） |
| 成本 | ❌ submodule 同步纪律要自己扛；`vendor/dsh` 作为子 workspace 可能触发 DSH 仓库某些"我是根"假设的脚本，需先跑通再定型 |

### UI 表达的分层事实

out-of-tree 不是没有 Web UI 通道，但"免费"也有边界（`docs/cookbook/adding-a-tool.md`：内置 Web Client 不消费 presenter）。第三方实证（[research.md](./research.md)）：

- **presenter 层**（expert-tools）：`presentCall`/`presentResult` + `presentationMeta` 是纯函数、可 replay 的卡片状态投影；不配 client 时 Web 显示 generic fallback 卡——这层保证的是状态可重建与词汇表中性，不是"自动出现专属卡"。
- **专属工具卡**：client 插件在 `tool.call.toolview` keyed slot 注册自己的工具名，从 wire 事件 + `result.meta` 派生卡片 props——out-of-tree 可做，属于 expert-pack 的 client 模块。
- **独立 UI 面**（自定义面板/设置页）：`dsh.client.inject` 注入自带打包的 client 模块。`dsh-market`（tsdown）与 `dsh-im`（esbuild）都在独立 repo 里这样完成注入，DSH 的 client 包只作 devDependency；代价是要跟着 DSH client 的注入点与 locale 约定走。
- 方案 B 剩下的独占优势收窄为：**改内置 client 包的卡片组件本体**与 client-modules 的深度组装；自定义 View 不算——它经 `ctx.uiConversation.views` 注册通道 out-of-tree 可参与（`docs/subsystems/conversation.md`）。

## 市场背书

- **DSH 自己就是"pinned 副本"模式的现成用户**：`vendor/` 钉 Cordis 源码（manifest + upstream SHA + `vendor/README.md` 同步程序）。专家 repo 对 DSH 复制同一纪律即可。
- **OpenClaw 的外部插件模式**：host 作 peerDependency + 显式 `compat.pluginApi`/`minGatewayVersion` 范围，manifest 先行声明贡献清单（`contracts.tools`）让 host 不必急加载 runtime——对应到 DSH 就是 `cordis.patch.yml` 插件行 + `inject` 声明。
- **Claude Code plugins 的自包含规则**：装进缓存时禁止 `../` 路径、外部 symlink 被丢弃——专家包必须自包含，不能引用 vendor 外的共享目录；这与"expert-pack 是唯一发布载体、flows/tools 作为内部 workspace 包"的结构一致。
- **anywhere-labs/dsh-desktop 是本方案的活例子**：它用 `.gitmodules` 把整个 deepseek-harness 源码钉成 submodule，配 `vendor/`、`patches/`、`upstream.json` 和给 coding agent 的 `AGENTS.md`——"插件 repo 钉住 host 源码供 agent 探索"在 DSH 生态里已有人跑通。
- **antfu/skills 的 SHA 纪律**：submodule 钉 tag、`GENERATION.md` 记录精确 SHA、更新脚本重检出再再生成，并有版本漂移告警——专家 repo 同步 `vendor/dsh` 时值得照抄这套簿记。
- **兼容性矩阵是生态惯例**：`dsh-im` 在 `dsh.compatibility` 里显式钉五个 DSH release；专家 pack 应同样声明验证过的 DSH 版本范围（peerDependencies + 兼容矩阵），反面教材是 `chatnode-wechat` 把五个 `@deepseek-ai/dsh-*` 精确钉死成 runtime dependencies——DSH 是 pre-stable API，精确钉死让每次上游同步都变成发版。

## 开发过程差异（方案 A）

插拔/调试/驱动 agent/推荐流程的共享细节见 [dev-loop.md](./dev-loop.md)。本形态的差异全部来自"DSH 源码在 repo 里但你不拥有它"：

- **升级环是第一公民**：`vendor/dsh` 换 tag → 记 SHA（antfu/skills 的簿记）→ 跑 typecheck（workspace 协议直解析 DSH `src/`，API 漂移在编译期暴露）→ compatibility matrix 加列 → `dsh plugin add file:` 重装验证。把这套做成一个脚本，agent 每次升级只触发它。
- **真实安装形状必须自测**：`npm pack` → 干净 profile → `dsh plugin add` → 冒烟会话；源码直跑会掩盖依赖声明错误（OpenClaw 教训）。
- **证据基础设施自建最小版**：typecheck + 行为测试 + 自己的 verify 脚本；snapshot 想要 keyless replay 得仿 DSH 的"一场景一目录 + 自己的 `snapshot.yml`"形状自建，或先用 JSONL 日志 diff 顶着，够用再升。
- **agent 探索红利是本形态最大杠杆**：AGENTS.md 里明写"DSH 文档从 `vendor/dsh/docs/architecture.md` 读起"，agent 的每个设计决策都能现场查到 DSH 的合同原文。
- **子 workspace 风险自查**：DSH 仓库脚本假设自己是根；首次接好 workspace 后跑一遍它的 `typecheck`/`test` 确认没被误触发，把结论写进 AGENTS.md 或干脆用 `file:`/`link:` 依赖绕开子 workspace。

## 何时离开这个方案

- 需要**专属 Web 卡片、独立 UI 面或自定义 View**：按升级阶梯走——先 `tool.call.toolview` 槽注册（单工具卡），再 `dsh.client.inject`（整块 UI 面；View 走 `ctx.uiConversation.views` 注册），只有要改**内置卡片组件本体**或深度 client-modules 组装才进方案 B，成熟后看能否折回 presenter 词汇表。
- 专家长成一窝（多个领域共享骨架）：升到方案 D，方案 A 的结构原样变成其中一个子树。
- 反过来想给 DSH 提 seam（如长期记忆、通知 Definition）：以方案 B 的方式在 DSH 内做，expert repo 只留消费者。
