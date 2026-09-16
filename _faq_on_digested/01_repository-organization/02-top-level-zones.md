# 02 · 顶层目录按什么边界划分

源码核验基线：DeepSeek Harness `dsh-v0.1.5-rc.2`，commit `fb2c4b9e698e30edb738bca4cf0618587db7d203`。

## 总图

![DSH 仓库顶层职责分区](./figures/repository-zones.svg)

顶层目录主要表达维护、构建和发布边界，而不是一条从底到顶的运行时调用栈。`vendor/`、`packages/`、`apps/` 之间确实存在基础到应用的方向，但 `docs/`、`scripts/`、`benchmarks/` 和研究目录是围绕产品工作的其它平面。

## 产品与框架源码

| 目录 | 拥有什么 | 不拥有什么 | 阅读入口 |
|------|----------|------------|----------|
| `vendor/` | 钉住的 Cordis、Loader、Include、HMR 及基础库源码；上游 commit 与本地修改清单 | DSH 产品能力；普通第三方 npm 依赖 | [`vendor/README.md`](../../vendor/README.md) |
| `packages/` | `@deepseek-ai/dsh-*` 产品和支持 packages；Service、Provider、Consumer、策略、UI、bundle | 最终产品 bin；进程级运行配置 | [`packages/README.md`](../../packages/README.md) |
| `apps/` | 最终应用入口：发布的 `dsh` CLI、浏览器 Vite entry，以及桌面 Electron 壳与它的私有 host | 可复用能力实现；完整业务模块 | [`apps/cli/README.md`](../../apps/cli/README.md)、`apps/web/src/main.ts`、[`apps/desktop/README.md`](../../apps/desktop/README.md) |

`vendor/` 被纳入 pnpm workspace，因为 DSH 要从源码构建并发布自己重命名后的 Cordis 框架层；但它仍保持单独的 upstream manifest、同步流程和本地修改日志。不要像普通 `packages/` 代码一样顺手重构它。

`packages/` 是主产品层。绝大多数功能修改最终落在这里，但准确落点仍由能力所有者和角色决定，不是看到一个功能就新建 group。

`apps/cli` 的职责是解析启动模式、组合 profile、提供进程级启动事实和收敛 shutdown；`apps/web` 只寻找 DOM mount point 并启动 client shell；`apps/desktop` 是 Electron 壳，`apps/desktop-host` 只负责组合并启动 `desktop` profile。入口保持薄，才能让 Web、Headless、SDK（含 `sdk-minimal`）与 ACP 复用相同的产品 packages——桌面是同一论点的第 5 个例证，它复用的正是 Web 那份 client 产物。

桌面也是 `apps/` 里唯一**不**经 `dsh` CLI 启动的入口：CLI 用 `rejectElectronProfile()` 明确拒绝 `desktop` 这个 profile 名（`apps/cli/src/args.ts:68-71`），上游 [`docs/architecture.md`](../../docs/architecture.md) 也把桌面单列在 `## Desktop application`（`:49-53`），而不是并进 `## Application launch`（`:41-47`）。所以「`apps/` 保留最终可执行入口」这条描述仍然成立，但它不等于「`apps/` 里的每个入口都由 `dsh --profile` 启动」。

## 组合、预设与可选 overlay

“组合”的落点是 `packages/bundle/`、`packages/preset/` 与 `apps/cli/config/examples/`，没有一个是 `examples/` 包组：顶层 `examples/` 已由 `refactor(repo): retire top-level examples` 整体退役，`packages/examples/`（原 `agent-spine-demo`）也已由 `refactor(bundle): remove the agent spine demo` 移除，当前树里没有这个包组。

| 目录 | 角色 | 关键区别 |
|------|------|----------|
| `packages/bundle/` | 可发布、可安装的 profile patch 层 | 位于 `packages/`，因为 bundle 自身也是 npm package |
| `packages/preset/` | per-session agent 组合：一个 preset 目录持有一份 `agent.cordis.yml` | 决定“这个 session 的 agent 由哪些行组成”，不是进程级 profile |
| `apps/cli/config/examples/` | 随产品出货的可选 overlay（GitHub review webhook、session 内 Schedule、memory MCP 服务、runtime Cordis 工具） | 是产品资产而非测试 fixture；用 `dsh --patch <该文件>` opt-in，永不进默认 profile |
| `snapshots/` | committed session JSONL 作为回放输入与期望输出的场景 | 只放 session 驱动的用例；其它期望输出留在各自 owner |

bundle 的 `cordis.patch.yml` 解决“默认装配是什么”，`apps/cli/config/examples/*/cordis.yml` 解决“这次额外接哪几行”。两者都是配置层，都不该沉淀可复用实现：overlay 里长出的可复用逻辑要提取回 `packages/`，让它获得自己的合同、测试、覆盖率和发布边界。

## 跨语言与平台发行

| 目录 | 角色 | 为什么不放进普通 `packages/` |
|------|------|------------------------------|
| `native/` | `native/system` 工作区：`@deepseek-ai/node-addon-system` 的 Linux Landlock 限制器与 POSIX flock 绑定、平台包与发布流程 | 有独立平台矩阵、native artifact 和 release workflow |
| `python/` | Python SDK 与捆绑 DSH runtime 的发行载体 | 使用 Python packaging；SDK 通过 stdio JSON-RPC 驱动 runtime |

`native/system` 及其平台包仍加入根 pnpm workspace，以便 Harness consumer 与 launcher 合同在同一仓库联调；它的 release 边界仍独立。`python/sdk` 是 Python package，`python/sdk-runtime` 同时承担 Python runtime carrier 与 pnpm deploy-root manifest 的角色。

## 文档、站点与工程系统

| 目录 | 拥有什么 | 典型误读 |
|------|----------|----------|
| `docs/` | 架构、subsystem reference、cookbook、用户文档、生成目录、postmortem | 误以为所有 package 细节都应复制到架构页 |
| `website/` | `website/docs.ts` publication manifest、VitePress 配置和站点资产 | 误以为网站 route 下有另一份权威 Markdown |
| `scripts/` | 生成器、校验器、构建和发布脚本、fixtures/snapshots | 把生成文件手改，而不是修改 owner 或 generator |
| `benchmarks/` | 仓库级性能门禁：按被测用户路径分目录的 bench 用例、私有的 `@deepseek-ai/dsh-benchmarks` 工作区与 bench-only 依赖，由根 `vitest.bench.config.ts` 编排 | 把 package 局部诊断也搬进来；它们留在各自 owner 旁用 `.perf.ts`，不进 `test:bench` |
| `.agents/` | Agent Notes 与仓库专用 skills | 把决策理由写进当前行为 reference，或把 archived note 当现行合同 |
| `.github/` | CI、release、issue/PR policy 与模板 | 把 CI workflow 当成本地日常命令清单 |
| `patches/` | pnpm `patchedDependencies` 的补丁 | vendored source；真正 vendored 代码在 `vendor/` |

文档实行“一事实一归属”。高层架构只说明顺序、职责和扩展点；类型与事件语义属于 `docs/subsystems/`；package 消费合同属于 package README；生成 catalog 由 scripts 从源码再生；网站只投影这些来源。

根 [`AGENTS.md`](../../AGENTS.md) 是顶层区域的文字总览，但它的 `packages/` 布局块有两处已过期的条目：列出的 `self-modification/` 与 `support/` 并不存在，实际归属是 `packages/extensions/`（自省与运行时挂载工具面）和 `packages/test-support/`（跨 package 测试基础设施）。以 [`packages/README.md`](../../packages/README.md) 的组清单为准。

## Workspace 与非 Workspace

[`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) 是 pnpm 实际成员清单，主要包括：

```text
vendor/*
packages/*/*
native/system
native/system/packages/*
apps/*
benchmarks
website
python/sdk-runtime
```

这份清单透露了几个设计选择：

- `packages/` 必须保持两级 `group/package`，workspace glob 才能统一发现。
- `benchmarks/` 是私有的 workspace member（`@deepseek-ai/dsh-benchmarks`），只为 bench-only 依赖与 worker 构建存在，不发布。
- Python SDK 本身由 Python 工具管理，只有 runtime carrier 进入 pnpm 部署闭包。
- `docs/`、`scripts/`、`.agents/` 和研究目录不是独立 workspace package，但可由根脚本消费。

## 构建配置为什么都在根

根 `tsconfig.base.json`、`tsconfig.base.client.json`、`tsconfig.host.json`、`tsconfig.client.json`、`tsdown.config.ts`、Vitest configs 和 `package.json` scripts 共同协调整个 monorepo。它们不是产品运行时模块，而是构建图的控制面。

TypeScript 特别区分 Host 与 Client 两个 compiler face。普通 package 只加入一个 aggregate；这是因为两边可能对同名 Cordis Context key 做不同声明合并，不能把所有项目压成一个 TypeScript Program。package 自己的 `tsconfig.json` 保持编译边界，根 aggregate 只组合 project references。

构建时先由 TypeScript 在每个 package 的 `lib/types` 产生中间 JS/声明，再由 tsdown 输出发布 runtime 到 `lib/`；静态测试和 gates 通过 tsconfig paths 读 `src/`。所以读实现从 `src/` 开始，验证发布行为才去看构建后的 `lib/`。

## 研究覆盖层

| 目录 | 用途 | 产品地位 |
|------|------|----------|
| `_digested/` | 从源码重建机制主线 | 非产品、非官方文档、非 workspace |
| `_faq_on_digested/` | 跨消化材料与源码回答二次问题 | 非产品、非运行时 |
| `_architecture_referenced/` | 外部或独立架构分析的本地参考 | 仅参考，结论需回到当前源码核验 |

这三处属于 `ethan` 分支的研究工作面。它们可以引用产品源码和官方文档，但不能反过来成为产品实现的隐式权威；同步产品基线后，应按研究索引重新核验受影响结论。

## 快速定位规则

| 你在找什么 | 首先去哪里 |
|------------|------------|
| 一个服务合同、工具或 Provider | `packages/<owner-group>/` |
| `dsh` 命令怎么启动 | `apps/cli/` |
| Web 页面最初从哪里挂载 | `apps/web/`，随后进入 `packages/client/` |
| 桌面入口怎么启动 | `apps/desktop/` 的 Electron 主进程与 `apps/desktop-host/` 的私有 host，不经 `dsh` |
| 性能门禁的用例在哪里 | `benchmarks/`，由根 `vitest.bench.config.ts` 编排 |
| 默认启用哪些插件 | `packages/bundle/*/cordis.patch.yml` 与 profile/preset config |
| 一个可选 overlay 组合 | `apps/cli/config/examples/`，用 `dsh --patch <该文件>` 挂上 |
| 一个类型或事件的权威说明 | `docs/subsystems/` 或生成 catalog |
| 架构决策为什么这样做 | `.agents/notes/implemented/`，但先找当前文档/源码合同 |
| 生成或校验某份文档/目录 | `scripts/` |
| Python 用户怎么驱动 DSH | `python/sdk/` |
| 原生 system 原语（Landlock / flock） | `native/system/` |

## 核验入口

- [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)
- [`docs/development.md`](../../docs/development.md#typescript-project-layout)
- [`vendor/README.md`](../../vendor/README.md)
- [`native/README.md`](../../native/README.md)
- [`python/README.md`](../../python/README.md)
- [`apps/desktop/README.md`](../../apps/desktop/README.md)
- [`benchmarks/package.json`](../../benchmarks/package.json)
- [`website/docs.ts`](../../website/docs.ts)
