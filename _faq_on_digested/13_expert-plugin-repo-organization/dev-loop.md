# Dev Loop · 专家插件的开发过程：从意图到调整的完整生命周期（四方案共享）

## 这篇怎么读

上一篇回答的是"repo 长什么样"；这篇回答"**一个特性从想法到稳定，整个过程怎么走**"。读者假设：你还不熟悉 DSH 的研发流程。全文按时间顺序走一个例子——"给专家加一条新的信息处理流"——每个阶段讲三件事：

- **你在做什么**（人 + coding agent 的分工）；
- **DSH 原生机制是什么**（这一步在 DSH 里有正式载体，不用发明）；
- **专家 repo 怎么落地**（把 DSH 载体搬到你自己 repo 的具体做法）。

四方案（A/B/C/D）在这个生命周期上**没有差别**——插拔、调试、驱动 agent 的机制全部来自 DSH 的组合层；差别只在证据基础设施是谁建的，集中在各方案文件的"开发过程差异"一节（[A](./option-a-standalone-with-pinned-dsh.md#开发过程差异方案-a) / [B](./option-b-in-dsh-monorepo.md#开发过程差异方案-b) / [C](./option-c-external-dependency-only.md#开发过程差异方案-c) / [D](./option-d-marketplace-monorepo.md#开发过程差异方案-d)）。

依据：`docs/development.md`（环境与日常命令）、`docs/testing.md`（测试分层）、FAQ 02/06（[spec 从意图走到当前合同的完整路径](../06_spec-change-path/answer.md)）、FAQ 11（[六步执行闭环与两个回路](../11_native-development-loop/answer.md)）、根 `AGENTS.md`（checks 匹配面纪律）。

## 第 0 步 · 一次性准备（只做一次）

**做什么**：把开发环境立起来，让后面每个环都能"秒级反馈"。

**DSH 原生**：`pnpm install`（顺带装好 lefthook 本地钩子）→ `pnpm run typecheck` 通过即就绪（`development.md` 的验收标准）。钩子是快检查：pre-commit 验 staged 配对记录、staged lint、THIRD_PARTY_NOTICES 再生、whitespace、vendor manifest guard；**pre-push 跑 `pnpm run typecheck`**。除此之外钩子刻意不跑测试、snapshot、文档检查和构建——这些的穷举归 CI。

**专家 repo 落地**：同样的准备加两件——① `git submodule update --init` 拉下 `vendor/dsh`（方案 A/D）并确认 `pnpm install` 后 typecheck 解析到 DSH 源码；② 写根 `AGENTS.md`（几百词：常驻规则、布局、命令表、`vendor/dsh` 在哪、探索路由 `docs/architecture.md → capability-seams → 包 README`），`CLAUDE.md` 做 symlink。这是给 coding agent 铺的路，第 4 阶段起它每次都走。

### 第 0.5 步 · 双 home 隔离

已在用官方安装的 DSH 时，开发插件**不要**直接插进日用 home：日用留在默认 `~/.dsh` 原样不动，开发用 `DSH_HOME=~/dsh-dev` 起第二个 home，并让专家 repo 的环境脚本自动 export 它（coding agent 不会自己想起来这个区别）。机制依据、崩溃半径、向日用 home 的迁移方向见专篇 [dual-home-isolation.md](./dual-home-isolation.md)。

## 第 1 阶段 · 意图：把"想要什么"钉在外部可观察行为上

**做什么**：人用一两句话说清动机和预期行为——"专家在收到 X 类输入时应产出 Y，现在是 Z"。

**DSH 原生**：Issue 模板只留两个字段：**Motivation / Behavior**（为什么改、预期的外部可观察行为是什么）。验收和测试证据不写在这里——它们由后面 PR 的 Testing 部分承载。机器只在 PR 进入 review 时强制引用 Issue，不检查意图质量。

**专家 repo 落地**：不需要 GitHub Issue 也能走同构路径：在 `notes/intents.md`（或直接在对话里）写一行动机 + 一行预期行为。关键是**行为必须是外部可观察的**——"日志里出现事件 E"、"工具返回卡片 K"、"preset 挂上后其他会话无感"，而不是"代码要优雅"。

## 第 2 阶段 · 讨论与决策：让输掉的方案留下尸体

**做什么**：人和 agent 把可选做法摆开（"这条流的上下文放 preset prompt 还是 spill store？事件还是服务方法？"），选定一个，**记录输掉的方案和代价**。

**DSH 原生**：重大未来工作先写 **proposed Agent Note**（决策 spec：为什么这样设计、什么方案输了、风险是什么）；已经定的小决策可直接跳到 implemented。约束只有一条是强制的：**非平凡变更必须带 Agent Note**。

**专家 repo 落地**：`notes/proposed/<date>-<slug>.md`，三段式：决定 / 输掉的方案及原因 / 需要验证什么。这里就是你说的"讨论清楚"的落点——讨论不在聊天里蒸发，而是沉淀成一条下个 agent 也能读的记录。方案 B 树内卡片的去留记在 repo 级 `notes/`；方案 D 的专家级决策记在各自 `packages/<expert>/notes/`（见其目录树），仓库级（registry、shared/ 的取舍）才记在根 `notes/`。

## 第 3 阶段 · 设计：细化到 decision-complete

**做什么**：把选定方案展开成实施计划——改哪些面、每面的验收是什么。人对着计划说"对/不对"，批准后才动手。

**DSH 原生**：**Plan Mode**（可选会话模式）：agent 产出完整计划并通过 `exit_plan_mode` 取得批准，批准前不动文件。计划要覆盖：改哪些子系统/API/schema、失败路径、测试面。

**专家 repo 落地**：专家的设计清单有固定四问（这是"plugins, not loop changes"纪律的专家版）：

1. **占哪个 ctx 键 / 发哪些事件**？每条流一个自己的键，`inject` 声明依赖，不劫持别人的。
2. **模型会看见什么新状态**？model-visible ⟺ logged（下称**日志税**）——每个新的模型可见输入都要配 `SessionEventMap` 成员（并决定 `ignorable`），否则日志重建不出来。这问漏了，第 5 阶段调试时会以"日志读不全"的形式还债。
3. **UI 走哪层**？presenter 层（`presentCall`/`presentResult` + `presentationMeta`，纯函数、可 replay；注意内置 Web Client 不消费它，不配 client 时显示 generic fallback 卡）→ 专属 Web 卡的 `tool.call.toolview` 槽注册 / 独立 UI 面的 `dsh.client.inject` 注入层 → 树内定制（仅方案 B）。
4. **证据是什么**？"会为这次回归而失败"的那个测试长什么样——现在就点名，第 4 阶段写它。

## 第 4 阶段 · 落地：窄证据切片闭环

**做什么**：coding agent 执行，人指挥——这是两个回路：agent 在内圈走六步，人在外圈**切窄片 → 说清意图 → 委派执行 → 只审"会为这次回归而失败"的最小证据 → 错了整 PR 回滚**（人不用记规则，规则住在 repo 的门禁与 Note 里）。执行回路是 DSH 制度反复强化的默认（FAQ 11 命名为**窄证据切片闭环**），六步：

```text
核对现场 → 判定窄 diff → 原子修改 owner 面 → 跑最小证据 → 沉淀 gate/Note → 只报告实际跑过的检查
```

1. **核对现场**：不信任记忆，先读当前的代码/文档/日志——权威只在外部可验证状态里。
2. **判定窄 diff**：这次变更到底动哪几个文件？"给 `<tool>` 加 presentResult 卡片"是窄的，"改一下 UI"不是。窄 diff 是整个闭环的输入，派任务时就按 seam 说。
3. **原子修改 owner 面**：每个事实一个 owner——改 provider 不动 Consumer 合同；改专家流不动 agent-loop。owner 地图在 AGENTS.md 里。
4. **跑最小证据**：只跑"会为这次回归而失败"的那个测试 + typecheck，**不默认全量**。
5. **沉淀**：门禁住了的事实进 `docs/`（只写当前状态），选择进 Note。
6. **只报告实际跑过的检查**：没跑的不算数。

**交付形状**：一次交付是一个**完整垂直切片**——代码 + 测试 + docs/README/JSDoc + Note（+ 快照预期）在**同一个 PR** 里；proposed Note 在同一 diff 里改写成现在式的 implemented Note，不能原样留到交付后（FAQ 06 核实的真实例子：`proposed/` → 实现 commit → `implemented/` 三段在 git 历史里可追）。

**专家 repo 落地的两条特有纪律**：

- **插拔验证**（速查表见文末附录）：日常用 workspace 直跑；每次交付前用**真实安装形状**验一遍——`npm pack` → 干净 profile → `dsh plugin add` → 冒烟会话。源码直跑会掩盖依赖声明错误（OpenClaw 文档明示的坑）。
- **快检查在本地，穷举在 CI**：本地跑 lefthook 钩子（含 pre-push 的 typecheck）+ 选中的最小检查（DSH 的 `dsh-pre-push-checks` skill 就是"推送前选最小检查集"的流程）；测试、snapshot、doc-sync、平台矩阵的穷举归 CI。

## 第 5 阶段 · 调试：从组合层到会话层，逐层排除

**做什么**：行为不对时，按固定顺序排查，不跳层。

1. **组合层**：`dsh --profile <p> --dump-config` 打印最终插件行——先确认"我以为挂上的行真的在最终组合里、config 是我以为的"。层级顺序 bundle → profile patch → home patch → `--patch` overlay，先想清楚该行该来自哪层。
2. **装载层**：preset 装不上时，agent-presets 的 roster **连原因一起列出**而不是藏掉；配置错误按 fail-loud 纪律在最早可解点报错，不会静默跳过——报错信息本身就是诊断。
3. **生效层**：自定义 profile 默认 **live patch reload**（改 patch 行不重启就生效；`headless`/`sdk` 这类一次性应用是启动一次成型，调试它们要重启）。
4. **会话层**：session 是 JSONL 追加日志；model-visible ⟺ logged 保证专家流的每个模型可见状态都在日志里可重放——调试上下文组装**读日志，不猜**。如果日志读不全，回头修第 3 阶段第 2 问欠的债。
5. **回归层**：`test:snapshot` 用录制会话无 key 重放，是回答"行为为什么变了"的最快路径（方案 B 用官方 harness；A/C/D 自建最小版，见各方案差异节）。

## 第 6 阶段 · 调整：证据驱动的打磨，不是重设计

**做什么**：拿真实使用反馈（一条日志、一个 replay diff、一次不满意的会话）回到第 1 阶段——但这次意图更窄。打磨的迭代单位是**切片**，不是"推翻重来"。

**DSH 原生**：闭环的蛇形折回——第 4 阶段的第 5 步（沉淀 gate/Note）就是为这一阶段铺的：上轮的门禁让这轮的回归自动暴露，上轮的 Note 让这轮不再讨论已否决方案。打磨提速靠两个 DSH 机制：**委派 spine**（subagent 把任务切小）与**窄证据**（把验证切小），共享"单位成本最小化"。

**专家 repo 落地**：兼容性调整有固定环——`vendor/dsh` 升级（方案 A/D）或依赖更新（C）→ typecheck（A/D 经 workspace 协议直解析 DSH 源码，C 靠 npm 安装的类型；都让已声明范围的 API 漂移在编译期暴露）→ compatibility matrix 加列 → 真实安装形状冒烟。把这条环做成一个脚本，agent 每次只触发它。

## 第 7 阶段 · 收尾：只报告实际跑过的检查

**做什么**：推送前用 pre-push-checks 的纪律**选**（不是全跑）能覆盖本次 diff 的最小检查集，报告里只列实际跑过的命令；语义正确性（机器查不到的部分）留给 review 的人。

**DSH 原生**：`dsh-pre-push-checks` skill 明确"匹配证据面：行为测试对行为、`doc-sync` 对文档、快照对用户可见变更、e2e 对 provider；CI 拥有穷举"。`.agents/notes/` 归档低未来价值的 implemented note（可选的生命周期收敛）。

**专家 repo 落地**：同纪律自带三件套收尾——docs 更新为当前状态（无 change history）、Note 已从 proposed 改成 implemented、验证清单与实际执行一致。仓库级的机械检查（链接、结构、UTF-8）学 `_faq_on_digested/verify.mjs` 写成自己的 verify 脚本，让"文档不烂"也成为门禁而不是约定。

## 全周期速览

| 阶段 | DSH 原生载体 | 专家 repo 落地 |
|---|---|---|
| 0 准备 | `pnpm install` + typecheck + lefthook | + submodule、AGENTS.md 入口链 |
| 1 意图 | Issue 模板（Motivation/Behavior） | 一行动机 + 一行外部可观察行为 |
| 2 决策 | proposed Agent Note | `notes/proposed/`（含输掉的方案） |
| 3 设计 | Plan Mode，decision-complete | 固定四问：ctx 键/日志税/UI 层/证据 |
| 4 落地 | 六步闭环 + 垂直切片 PR + 同 diff 改写 Note | + 真实安装形状验证 |
| 5 调试 | dump-config → preset reason → live reload → JSONL → snapshot | 同一套，snapshot 可自建最小版 |
| 6 调整 | 蛇形折回；委派 + 窄证据 | 兼容性环做成脚本 |
| 7 收尾 | pre-push checks 选最小集；implemented Note | + 自己的 verify 脚本 |

## 附录 · 插拔速查

**装法（按离源码远近）**：

| 装法 | 命令/配置 | 用途 |
|---|---|---|
| workspace 直跑 | `pnpm dsh --profile headless "…"` + preset 挂会话 | 日常开发，改源码即刻生效 |
| patch overlay | `dsh --profile <p> --patch ./dev/try-x.patch.yml` | 一次性实验某插件行，不落盘 |
| profile 内持久 | `dsh plugin --profile <p> add file:./packages/expert-pack` | 验证真实安装形状；日常体验 Web |
| 正式分发 | `dsh plugin --profile <p> add <npm-name>` / `github:<owner>/<repo>` | 用户视角；CI 测兼容矩阵 |

**拔法**：会话不挂 preset（最轻）→ patch 里 `disabled: true`（行还在）→ 卸载（registrations are effects，无残留）。
