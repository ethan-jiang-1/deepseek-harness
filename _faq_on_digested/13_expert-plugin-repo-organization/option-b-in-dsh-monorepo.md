# 方案 B · 直接在 DSH monorepo 里长

## 一句话

专家作为 DSH workspace 的一个新领域组存在（如 `packages/expert/<pkg>/`），全部借力 DSH 的门禁、文档工程、snapshot harness 和 client 包；代价是背上上游同步税，且"专家"与"DSH"的身份边界消失。

## 目录树（以 DSH 侧为准）

```text
deepseek-harness/               # 你 fork/branch 的 DSH repo —— 生命周期的"家"几乎全是现成的
├── packages/
│   ├── expert/                 # 你的领域组（组 README 给包与 ctx 键地图）
│   │   ├── AGENTS.md           # 子树专属规则：发布纪律、compatibility 影响写进 README
│   │   ├── expert-flows/       # 流引擎 + 自己的 ctx 键 + SessionEventMap 事件
│   │   ├── expert-tools/       # 工具 Consumer
│   │   └── expert-pack/        # bundle + presets
│   └── client/
│       └── ui-expert/          # ✅ B 真正的独占面：改内置卡片组件本体 / 深度 client-modules 组装
│                               #   （单工具卡走 toolview 槽、整块 UI 面走 inject、View 走注册，皆 out-of-tree 可做）
├── docs/subsystems/expert.md   # 第 4/7 阶段的当前合同：进 DSH 正式文档体系 + doc-sync 门禁
├── snapshots/                  # 第 5 阶段：官方 snapshot harness；你的场景 = snapshots/<lane>/ 下一个目录，自带 session JSONL + 自己的 snapshot.yml
├── .agents/notes/              # 第 2 阶段 proposed/；implemented/ 随交付同 diff 改写（第 4 阶段，见 dev-loop）；归档 gate 现成
└── scripts/run-gates.ts        # 第 7 阶段：checks 选择走 DSH 现成闸门，不另造 verify
```

方案的代价面也在这棵树里：上游同步税落在 `packages/expert/` 的每一份结论上（每次 rc 同步按 `_change_log/` 复核）。

## 能借到什么（这是它最大的论据）

- **门禁全开**：`test:coverage`（per-file 100%）、`doc-sync`、`duplication`、`hygiene`、module-graph / capability-seams 生成目录会自动把你的 ctx 键收进图里。
- **snapshot harness**：model-visible 行为的 keyless recorded-session replay 是 DSH 一等公民；out-of-tree 自己搭这个最费劲。
- **client 包**：树内可直接改内置卡片组件本体与 client-modules 深度组装；单工具卡（`tool.call.toolview` 槽）、独立 UI 面（`dsh.client.inject`）与自定义 View（views 注册通道）out-of-tree 均有通道（见方案 A），B 的独占面只在"改本体"。
- **preset 就在旁边**：shipped presets（`standard`/`ptc`/`cordis`/`minimal`）是专家 preset 的现成范本——0.1.7 线起声明在 `packages/bundle/web-app/presets/*.patch.yml`，解析与注册在 `packages/preset/agent-preset/` + `agent-preset-registry/`；`cordis` 自带专属工具面与 skills，与"领域专家自持上下文"的形态最近。

## 取舍

| | 评价 |
|---|---|
| 借力 DSH 流程 | ✅✅ 全部：门禁、文档、snapshot、client、生成目录 |
| UI 表达上限 | ✅ 最高：改内置卡片组件本体与深度组装只有这里可做 |
| coding agent 探索 | ✅ 天然（整个 repo 就是 DSH） |
| 发布与身份 | ❌ 你的代码绑死 DSH 发布节奏；上游每次同步要按 `_change_log/` 复核自己的结论（FAQ 01/08 都吃过这个税） |
| 语义 | ❌ 这是"改 DSH"，不是"做专家包"；第三方用户没法 `dsh plugin add` 一个 fork 里的包 |

## 市场背书

- **OpenClaw 的 in-repo 插件**：bundled 插件就是 host monorepo 的 pnpm workspace 包（`extensions/*`），host 与插件永远版本一致、agent 只看一棵树——代价正是发布耦合，所以 OpenClaw 同时维护外部 npm 包 + peerDep + compat range 的第二通道。方案 B ↔ 方案 A 的关系与它同构。
- **anthropics/claude-code** 的对照：host 闭源，所以 `plugin-dev` 只能把框架知识做成 SKILL.md 文档给 agent 读——反证"host 源码可见"是稀缺资源，方案 B 是它的极限形态。

## 开发过程差异（方案 B）

共享细节见 [dev-loop.md](./dev-loop.md)。本形态的差异：**证据基础设施全部现成**，代价是换成了上游同步税。

- 环境与入口照 DSH 原生：`development.md` 原样做（install/typecheck/原生 lefthook 钩子），根 `AGENTS.md` 不重写——专家规则写 `packages/expert/AGENTS.md` 子树文件（见目录树）。
- 插拔/调试用 DSH 自己的流程：插件行进 `bundle/base` 或自组 profile，`--dump-config`、live reload、官方 snapshot harness（一场景一目录、各带自己的 `snapshot.yml` 声明 profile/recording 等）全在树上。
- 门禁照单全收：`test:coverage` per-file 100%、`doc-sync`（含双语）、`duplication`、非平凡变更必备 Agent Note、model-visible 变更必配快照——这些在 A/C/D 里是"自建最小版"，这里是义务；Notes 也不搬，直接写在原生 `.agents/notes/` 树，双语三件套与格式门禁现成（树内卡片组件的去留记在 repo 级 Note）。
- 新包落位按 `packages/README.md` 的组规则：**新包优先加入既有组**——给 DSH 上游提的 seam 落在拥有它的组（如新的文件系统能力进 `fs/`）；自成一家的领域才立新组，立组要同步组 README 与 `packages/README.md` 总表，且组默认按 product 期望（stable API）发布，想要无稳定性承诺的试验场落 `packages/experimental/`。
- 日常多了一个新环：**上游同步**。每次 rc 同步按 `_change_log/` 复核自己的包与文档结论（FAQ 01/08 都吃过漂移的亏），compatibility 影响写进自己包的 README。
- 驱动 agent 最顺：AGENTS.md/CLAUDE.md、skills、生成目录全是现成的，agent 的六步闭环直接在 DSH 语境里跑。

## 定位：不是长期形态，是两个专用形态

1. **UI prototype**：专门卡片/View 先在这里做，验证后把可通用的部分折回 card render intent 词汇表（那是 out-of-tree 可用的层）。
2. **上游贡献**：给 DSH 提新 seam（Definition 立在官方，Provider 可以是你的 expert repo）。

注意：answer 推荐路径 4 的"引入第二贡献者"**不触发 B**——那是 OpenSpec 的触发条件，主 repo 停在方案 A；只有贡献目标是 DSH 上游（上面第 2 条）时才进 B。

其余时间主 repo 停在方案 A。
