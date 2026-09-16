# Answer · DSH 目录设计的总模型

源码核验基线：DeepSeek Harness `dsh-v0.1.2-rc.1`，commit `a66e4702047846cdaa10c66c9d3df3951f5ea70d`。

## 一句话答案

DSH 的目录不是按“控制器、服务、工具类”这种实现层次来切，而是按**所有权、可替换角色、运行时组合和发布边界**来切：可复用产品能力放在 `packages/`，一项能力再拆成 Definition、Provider、Consumer 和策略插件；`bundle`、profile 与 agent preset 只选择这些插件如何组合；`apps/` 保留最终可执行入口；框架、原生组件、Python 发行物、性能门禁、文档和工程工具各有独立边界。

因此，熟悉 DSH 不能只背一棵目录树。需要同时看三张图：

![同一个 DSH 的三张结构图](./figures/three-trees.svg)

| 视角 | 它回答的问题 | 权威来源 |
|------|--------------|----------|
| 仓库目录树 | 代码、文档、构建和发行物分别由谁维护 | 顶层目录、各组 README、`pnpm-workspace.yaml` |
| package 依赖图 | 谁可以 import 谁，合同和实现如何解耦 | 各 `package.json`、[`docs/module-graph.md`](../../docs/module-graph.md) |
| 运行时插件树 | 这一次进程实际挂了哪些服务、监听器、工具和入口 | bundle/profile/preset 的 Cordis 配置、`dsh --dump-config` |

目录树提供位置，依赖图提供静态关系，插件树提供本次运行的事实。三者相互关联，但不能互相代替；详细解释见 [`01-three-trees.md`](./01-three-trees.md)。

## 仓库组织的五条原则

### 1. 产品能力按领域归组，不按技术层归组

`packages/fs/`、`packages/subagent/`、`packages/session/`、`packages/llm/` 各自拥有一个能力家族。某项能力需要接口、后端、模型工具、策略和 UI 时，这些角色优先放在同一个领域附近，而不是分别塞进全局 `services/`、`adapters/`、`tools/`、`controllers/` 目录。

这使阅读者可以先找到“谁拥有这件事”，再在该组内辨认角色。组 README 负责给出 package 与 `ctx` key 的地图，根 [`packages/README.md`](../../packages/README.md) 只维护组级索引。

### 2. 可替换能力按角色拆 package

一条完整 capability seam 通常包含 Service Definition、一个或多个 Provider、一个或多个 Consumer；策略可能通过事件作为独立插件参与。以文件系统为例，`fs` 定义 `ctx.fs`，`fs-local` 与 `fs-sandbox` 提供实现，`tool-fs` 把能力呈现给模型，`fs-observation-policy` 通过 `fs/*` 事件施加 read-before-edit 等策略。

拆 package 的目的不是追求数量，而是让替换半径与依赖方向可见：Consumer 依赖 Definition，不依赖某个具体 Provider；组合层选择本次安装哪个 Provider。完整角色语法见 [`03-package-role-grammar.md`](./03-package-role-grammar.md)。

### 3. 实现、组合与入口分开

`packages/` 拥有可复用实现，`packages/bundle/` 拥有可安装的 Cordis patch 层，profile 与 agent preset 决定部署和单个 agent 的选择，`apps/` 拥有最终进程或浏览器入口。业务行为不应因为“从 CLI 启动”就写进 `apps/cli`，也不应因为“默认启用”就写进 bundle；入口和 bundle 只保留自己必须拥有的装配职责。

这条分离形成一条稳定链：

```text
package 实现
  → bundle 给出默认插件行
  → profile / home / --patch 覆盖部署选择
  → app 启动 Cordis Loader
  → 形成这一次运行的插件树
```

启动链和 Web/Headless 差异见 [`04-composition-and-entrypoints.md`](./04-composition-and-entrypoints.md)。

### 4. 发布和平台边界在顶层显式出现

`vendor/` 是被钉住并本地维护的 Cordis 框架层；`native/system/` 是原生 system 原语（Landlock / POSIX flock）的源码与 npm 家族；`python/` 是 Python SDK 与捆绑 runtime；`website/` 是文档站投影和构建；`benchmarks/` 是仓库级性能门禁；`apps/` 是产品应用。它们的构建、发布和消费者不同，因此不强行藏进 `packages/`。

顶层目录不是“杂项分类”，而是维护与发行责任的边界。详细地图见 [`02-top-level-zones.md`](./02-top-level-zones.md)。

### 5. 源码、生成物、文档与研究材料不混在一起

package 的手写源码位于 `src/`，测试位于同级 `tests/`，构建产物位于被忽略的 `lib/`；生成的跨包目录位于 `docs/`，生成脚本位于 `scripts/`。官网不复制一套 Markdown，而由 `website/docs.ts` 把权威文档投影到 VitePress 路由。

`_digested/`、`_faq_on_digested/`、`_architecture_referenced/` 则是研究材料：它们帮助理解产品，但不构成产品 API、workspace package、官方站点或启动组合。把研究结论与产品权威来源分开，后续同步源码时才能知道哪些材料需要重新核验。

## 顶层结构应该怎样记

![DSH 仓库的职责分区](./figures/repository-zones.svg)

不需要一开始记住每个 package，只需先记住六个区域：

| 区域 | 主要目录 | 记忆方式 |
|------|----------|----------|
| 框架与平台基础 | `vendor/`、`native/` | DSH 依赖但独立维护或发布的底座 |
| 产品能力 | `packages/` | 插件、服务合同、Provider、Consumer、策略 |
| 应用与组合 | `apps/`、`packages/bundle/` | 入口启动组合，bundle 选择默认插件行 |
| 门禁与跨语言发行 | `benchmarks/`、`python/` | 性能门禁和 Python 驱动/捆绑 runtime |
| 文档与工程系统 | `docs/`、`website/`、`scripts/`、`.github/`、`.agents/` | 说明、生成、校验、CI、决策记录 |
| 研究覆盖层 | `_digested/`、`_faq_on_digested/`、`_architecture_referenced/` | `ethan` 分支上的源码消化与二次研究 |

## `packages/` 应该怎样记

`packages/<group>/<pkg>/` 的两级结构中，第一层回答“哪个领域拥有它”，第二层回答“它在该领域扮演什么角色”。例如：

```text
packages/fs/                  # 文件系统能力家族
├── fs/                       # Definition：ctx.fs 与 fs/*
├── fs-local/                 # Provider：本地文件系统
├── fs-sandbox/               # Provider：带 sandbox fence
├── fs-observation-policy/    # Policy：事件监听器
├── tool-fs/                  # Consumer：模型工具
└── tool-fs-search/           # 相邻 Consumer：基于 subprocess + rg
```

这只是前两层。阅读运行时还要继续区分 `group → package → plugin → entry row → Fiber → Context/realm`；[第三章](./03-package-role-grammar.md#先把六个层级分开)逐层解释这些名称。

几个常见但容易误读的组：

- `packages/core/` 是产品 API 主干，不是容纳所有逻辑的“大核心”；`agent-loop` 只是 `Agent` 合同的默认驱动。
- `packages/session/` 不是 `core/session` 的重复。`core/session` 拥有活的内存日志；`session/` 家族围绕它增加持久化、投影、标题和遥测。
- `packages/host/` 与 `packages/client/` 是 Web GUI 的两半；`apps/web` 只是很薄的浏览器入口，`apps/cli` 的 web profile 负责启动 Host 并提供前端产物。
- `packages/api/` 与 `packages/typert/` 负责 Host/Client 之间的类型化 Remote/RPC 机制，不是另一个独立产品入口。
- 组合叶子不再有顶层 `examples/`：可选 overlay 是 `apps/cli/config/examples/*/cordis.yml`（产品资产，`dsh --patch` 才挂），agent preset 的根是 `packages/preset/agent-presets/presets/*/agent.cordis.yml`。
- `packages/test-support/` 是跨 package 的测试基础设施；普通行为测试仍跟随自己的 package 放在 `tests/`。

## 一个 package 内部应该怎样读

普通 package 通常呈现以下结构：

```text
packages/<group>/<pkg>/
├── package.json       # npm 名称、exports、依赖与发布面
├── README.md          # 消费者合同、配置、扩展点、限制
├── README.zh.md       # 配对中文文档
├── src/
│   ├── index.ts       # 服务或插件入口
│   ├── types.ts       # 仅类型；不是所有 package 都需要
│   └── invariant.ts   # 可选加载的运行时关系检查
├── tests/             # 单元、集成或 real-composition 测试
└── tsconfig.json      # package 自己的编译边界与项目引用
```

`lib/` 是构建产物，不是读实现的起点。先读 `README.md` 确认角色，再读 `package.json` 看它依赖的是 Definition 还是具体 Provider，然后进入 `src/index.ts`；若行为跨包，再沿 `ctx` key、事件名和 bundle row 搜索。

## 为什么这种结构初看很碎

DSH 把传统单体里隐含的选择显式化了：哪个后端、哪条策略、哪些工具、哪个入口、哪个 agent scope，都不再藏在一个构造函数或全局依赖容器中。代价是 package 数量多，而且一个完整行为常跨过 Definition、Provider、Consumer、事件、session log 与组合配置。

这种结构优化的是替换、卸载、独立测试和发布，而不是“在一个文件里看完所有事情”。正确的阅读单位不是单个目录，而是一个**能力家族加它的运行时组合**。生成的 module graph、组 README、`dsh --dump-config` 和本 FAQ 的阅读路线，就是用来恢复这条跨目录链的。

## 第一次熟悉仓库的推荐顺序

1. 读根 [`AGENTS.md`](../../AGENTS.md) 的目录图和核心约束。
2. 读 [`docs/architecture.md`](../../docs/architecture.md)，建立 Cordis、composition、core、events、loop、session、seam 的顺序。
3. 读 [`packages/README.md`](../../packages/README.md)，只识别 group，不背 package 清单。
4. 从一个实际入口追踪：`apps/cli/src/bin.ts` → `profile-boot.ts` → bundle patch → 一个被挂载的 package。
5. 再从一个能力追踪：group README → Definition → Provider → Consumer → bundle/preset row → 测试。
6. Web 功能另走 Host/Client 路线；持久数据另走 `core/session` → `session/` 路线。

可直接照着执行的路线和搜索命令见 [`05-reading-routes.md`](./05-reading-routes.md)。

## 最重要的六个纠偏

1. **磁盘上有 package，不等于本次运行加载了它。** Cordis 配置才决定活插件树。
2. **依赖某个 package，不等于必须使用它的默认实现。** Consumer 应依赖 Definition，Provider 由组合选择。
3. **`core` 不等于不可替换内核。** 它是稳定产品 API 主干，默认 loop 仍是插件。
4. **`apps` 不等于业务逻辑层。** 它拥有进程/浏览器入口和启动事实，可复用行为回到 `packages/`。
5. **bundle 不执行能力。** 它发布 Cordis patch 行，选择哪些插件以什么默认配置挂载。
6. **官网目录不拥有文档正文。** `docs/` 和 package README 是来源，`website/` 负责投影与构建。

## 继续阅读

| 想解决的问题 | 下一篇 |
|--------------|--------|
| 三张树为什么不能混 | [`01-three-trees.md`](./01-three-trees.md) |
| 每个顶层目录到底归谁 | [`02-top-level-zones.md`](./02-top-level-zones.md) |
| package 名字和角色怎么对应 | [`03-package-role-grammar.md`](./03-package-role-grammar.md) |
| 从 `dsh` 命令怎样到活插件树 | [`04-composition-and-entrypoints.md`](./04-composition-and-entrypoints.md) |
| 现在打开仓库先看哪些文件 | [`05-reading-routes.md`](./05-reading-routes.md) |

## 核验入口

- [`docs/architecture.md`](../../docs/architecture.md)
- [`packages/README.md`](../../packages/README.md)
- [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)
- [`docs/module-graph.md`](../../docs/module-graph.md)
- [`_digested/system/00-map.md`](../../_digested/system/00-map.md)
- [`_digested/composition/00-map.md`](../../_digested/composition/00-map.md)
- [`_digested/capability-seams/00-map.md`](../../_digested/capability-seams/00-map.md)
