# 03 — 规矩与所有权：谁拥有什么证据

> 本篇收集 DSH 测试体系里"操作级"的规矩：常备条令（root `AGENTS.md`）、快照树所有权（`snapshots/AGENTS.md`）、推送前检查选取（`dsh-pre-push-checks`）。思想级的教义见 [01](./01-doctrine.md)，分层见 [02](./02-tiers.md)。

## 现象是什么：规矩的三种载体

DSH 的测试规矩不在一份文件里，而是按"谁需要什么时候看到它"分三处：

1. **常备条令**（root `AGENTS.md`）：每个 session 都要在上下文里的条款，每条 1~3 行，链接到它的"家"。
2. **所有权契约**（`snapshots/AGENTS.md`）：快照树的归属规则，只对碰快照的人相关。
3. **流程技能**（`.agents/skills/dsh-pre-push-checks/`）：推送前"选哪些检查跑"的决策流程。

这个分层本身是个设计：**常备条令是给 agent 的上下文经济**——把"每个 session 都必须知道的"压到几行，其余按需加载（skill/文档/Note）。

## 常备条令逐条（root `AGENTS.md`，硬事实，关键句原文）

1. **快照强制 + 所有权 + 夹具纪律**："Every non-trivial model- or product-user-visible change updates a keyless recorded-session snapshot; snapshot ownership reserves the top-level tree for session-driven cases and keeps other expected output owner-local. **Fixtures replay on macOS/Linux; fix fixtures, not normalizers.**"
   ——三条合一：改了模型/用户可见的东西必须动快照；顶层快照树只收 session 驱动的场景，其他期望输出 owner-local；夹具必须跨 macOS/Linux 回放，归一化器不许为凑绿而改。
2. **计划时点名测试面**："Plan unit, e2e, and snapshot coverage for capability seams, lifecycle paths, and transcript output; include missing snapshot-harness support in the same change."——缺快照基建支持要和功能同一个 PR 补。
3. **双 SDK 投影**："Both SDKs project the loop. Agent-loop, session-lifecycle, and `SessionEventMap` changes update the TypeScript and Python SDK expected outputs in the same PR; **`pnpm run test` covers neither**."——单测根本不覆盖这两个投影，漏改只有 CI 抓。
4. **证据匹配面**："Match evidence to the surface: focused behavior tests, model/user-output snapshots, `doc-sync` for docs, built smokes for published paths, and real-API e2e for providers."（[01](./01-doctrine.md) 贯穿思想 1）
5. **不默认全量**："Never default to the full suite or repeat a passing check for commit or push. CI owns exhaustive coverage and the platform matrix; rehearse all locally only by explicit request, for CI diagnosis, or for an irreducibly repository-wide change."
6. **覆盖门是谁**："`test:coverage`, not `test`, is the CI coverage gate."
7. **测试描述行为**："Tests describe behavior, not correctness. Change obsolete behavior with its tests; explain why in the PR."
8. **GUI PR 必须留浏览器证据**：每个改变 product-user-visible GUI 行为的 PR 必须录制浏览器交互 GIF（`record-browser-gif` 技能）；Web 浏览器自动化测试统一用 `pnpm dsh web --patch apps/web/tests/pin-browse-picker.overlay.yml` 的页内目录选择器 overlay，除非明确在测原生 picker。
9. **不许绕过测试失败**："If a required `gh`, `pnpm`, build, test, or generator command fails because the sandbox blocks credentials, network, IPC, watching, or nested `sandbox-exec`, retry unchanged with the narrowest host escalation. Require sandbox evidence; **never bypass test failures or the product sandbox**."——测试失败只能修，绕过（skip/删断言/改门槛）是被明文禁止的路径。

## 快照树所有权（`snapshots/AGENTS.md`）

顶层 `snapshots/` 树只收一类东西：**committed session JSONL 身兼回放输入与预期持久化输出**的场景。其余期望（非会话的 ARIA/几何/generator/CLI/单单元预期）留在各自 owner，用 `test:expected` / `test:web` / `test` 跑。七条核心规则（硬事实）：

1. **入口唯一**：被测进程一律经 `dsh` CLI + shipped profile + 可选场景 patch 启动；禁止新增应用入口、隐藏 CLI 模式或可执行的场景驱动器。
2. **角色与代际**：一个场景拥有/显式引用一个 primary Session 角色 + 连续 child 角色；可保留多代，但 replay/record/refresh 一律选数值最高代；record/refresh 写**版本命名的新输出**，绝不重命名或删除已提交代际；**只有 owner 本人**能对选定角色 record/refresh。
3. **input.json 禁令**：普通 one-shot 场景从选定 JSONL 派生用户任务与回放脚本，**不复制进 `input.json`**；共享引用只读、无环、指向 owner 的选定父代。
4. **历史代际显式声明**：要保留历史代或 retired-tool 录制的 owner，在 `snapshot.yml` 声明精确 `sessionFormat.version` + 封闭迁移 `coverage` 名；corpus policy（`scripts/session-snapshot-corpus-policy.ts`）要求 V3 输入做直接升级覆盖 + 显式 V0–V2 迁移覆盖；**writer bump 本身不刷新 fixture**。
5. **规范化固定点**：易变身份换成保关系的 typed token；系统提示词与工具 schema 换 token；每个 header 类只留一个可读 sidecar owner；"Never redact arbitrary user or tool text merely because it resembles an identifier."——不许把"长得像标识符"的用户/工具文本顺手抹掉。
6. **跨 profile sidecar 符号链接**：仅当 `snapshot.yml` 指名来源时允许；corpus gate 解析并核对目标；必需快照车道在 **macOS 与 Linux 双平台**都跑这些别名。
7. **workspace 证据**：mutating 场景设 `workspace.final: true` 并提交完整 `workspace.expected/`；空结果只用被忽略的 `.empty` 标记；"Model prose and tool-result text do not prove the external effect."——模型说的话不算世界状态的证据。

配套执行纪律：`test:snapshot` 回放不写；record/refresh 走显式脚本；所有 JSONL/prompt/schema/protocol/UI/workspace diff 提交前评审。

所有权契约的模式同样向下延伸：`packages/AGENTS.md` 把若干测试规则固化为包层常驻条令（plugin exports 形态与 `ctx.get` 读可选服务——均回指 postmortem 0001；REAL-composition 测试要求；注册贡献必须由 HMR 测试证明可撤销；并发 spec 缺陷认定）；`benchmarks/AGENTS.md` 拥有基准树规则（[02](./02-tiers.md)）。

## 推送前检查选取（`dsh-pre-push-checks`）

本地跑什么、不跑什么，由这个技能决定。核心条款（硬事实）：

1. **没有普适本地基线**："There is no universal local baseline beyond the hooks. Every behavior change needs the narrowest available test or purpose-built check that would fail for its regression; add broader checks only for surfaces the diff actually reaches."——git hooks 故意窄（pre-commit 只修 staged lint/空白/vendor 元数据；pre-push 只跑增量 typecheck），"the hooks intentionally do not run tests, snapshots, documentation checks, builds, or hygiene"。CI 拥有穷尽覆盖与平台矩阵。
2. **证据映射表**：包/脚本行为 → owning vitest 文件或聚焦名；文档 → `doc-sync`；模型/编辑器/CLI/终端可见输出 → 聚焦无密钥快照；manifest/公共导出/构建配置 → `build` + hygiene + owning built smoke；真实 provider/agent 行为 → 凭据可用时跑相关 `test:e2e`。
3. **预期输出放置**（复述快照所有权）：录制 Session 双角色场景归顶层 `snapshots/`；无该往返的期望留 owner 的 `tests/expected/`；跨包 profile 行为归 `apps/cli/tests/profiles/`，包特定组合归包 `tests/fixtures/`，用户可选 overlay 归 `apps/cli/config/examples/`。
4. **不重复已过的检查**："Do not manually repeat a passing check merely because commit or push follows."——尤其不许只为复述 pre-push hook 而在推送前再跑一次 typecheck。
5. **聚焦覆盖率仍按门的标准**：`vitest run <owning tests> --coverage --coverage.include='packages/<group>/<pkg>/src/**'`；per-file 100% 在选定范围内仍适用；不 `--passWithNoTests`、不降阈值、不为隐藏未覆盖文件而收窄 include。
6. **全套彩排仅三种情况**：用户显式要求、诊断 CI 失败、改动遍及全仓且无更小可信集。
7. **改写历史**：`--force-with-lease`（fetch 记录观察到的 OID，并发更新即中止）；raw `--force` 永不允许；`gh stack sync` 后四步验证（重查每分支头 → 检视 changed scope → 逐层跑证据 → 全过前不 merge）。
8. **失败处理**："Do not push and hope CI differs."——环境特定失败要拿证据（精确命令/失败测试/平台不匹配），不许推上去赌 CI。

## 为什么这么定（解释）

1. **所有权规则回答"证据放哪、谁维护"。** owner-local vs 顶层树的分界线是**证据是否由录制会话驱动**：是 → 顶层 `snapshots/`（跨包共享、CI 统一回放）；否 → 留在 owner 的 `tests/expected/`。这个分界同时决定了 CI 成本归属：顶层树的回放是全局门，owner-local 的跑在 owner 自己的 lane。
2. **"fix fixtures, not normalizers" 是反作弊条款。** 归一化器（把输出磨平以便比对的代码）一旦可以为通过而修改，快照就退化成"永远绿"——与 Pi 生态"evidence 字节锁、CI 禁改证据"（pi-mono FAQ 11 第 05 案）保护的是同一个不变量：**证据不许被磨到跟 bug 吻合**。
3. **双 SDK 投影条款承认单测的盲区。** "`pnpm run test` covers neither" 是一句罕见的"明说测试不覆盖哪里"的条款——不覆盖面被写进规矩而不是被默默接受。
4. **GIF 规矩把"人类可核对的证据"制度化。** 快照给 CI 看，GIF 给人看；GUI 行为变更的评审证据被要求成两种形态。

## 源码锚点

- root `AGENTS.md`——上述条款原文（Testing policy / Plan unit… / Both SDKs… / Run relevant checks locally 三节）
- `snapshots/AGENTS.md`——快照树所有权
- `.agents/skills/dsh-pre-push-checks/SKILL.md`——推送前检查选取
- `.agents/skills/record-browser-gif/SKILL.md`——GUI PR 的 GIF 证据规矩
- `apps/web/tests/pin-browse-picker.overlay.yml`——浏览器自动化测试的 overlay 约定

## 最小例证

1. **owner-local 可检索**：任选一个包的 `tests/expected/` 目录——期望文件贴着 owner 住，而顶层 `snapshots/` 只有 session 驱动场景；两处的内容形态不同。
2. **双投影警告可验证**：grep `SessionEventMap` 相关的最近改动 PR——描述里应同时出现 TS 与 Python 快照的更新。
3. **禁绕过条款的语气**：读 root `AGENTS.md` 的 "Host sandbox failures" 一节——"never bypass test failures" 是无例外祈使句。
